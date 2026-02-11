import React, { useState, useEffect } from 'react';
import { FileText, Download, AlertTriangle, CalendarRange } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { getAllVariants, getInventoryLedger } from '../../lib/data';
import { supabase } from '../../lib/supabase';

const InventoryAnalytics = () => {
    const [activeTab, setActiveTab] = useState('aging');
    const [loading, setLoading] = useState(false);
    const [agingData, setAgingData] = useState([]);
    const [lowStockData, setLowStockData] = useState([]);
    const [stats, setStats] = useState({ agingValue: 0, agingCount: 0 });
    const [purchaseSalesData, setPurchaseSalesData] = useState([]);
    const [gstData, setGstData] = useState([]);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [showDateFilters, setShowDateFilters] = useState(false);

    useEffect(() => {
        loadData();
    }, [activeTab, dateRange]);

    const handlePrint = () => {
        window.print();
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const variants = await getAllVariants();
            const { data: batches } = await supabase.from('product_batches').select('*').eq('is_active', true);


            if (activeTab === 'aging') {
                const ledger = await getInventoryLedger(null, null, 1000, dateRange.start || null, dateRange.end || null); // Need history to find last movement

                // Map variantId -> lastTransactionDate
                const lastMoveMap = {};
                ledger.forEach(tx => {
                    const d = new Date(tx.transaction_date).getTime();
                    if (!lastMoveMap[tx.variant_id] || d > lastMoveMap[tx.variant_id]) {
                        lastMoveMap[tx.variant_id] = d;
                    }
                });

                const now = new Date().getTime();
                const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

                const agingItems = variants.filter(v => {
                    // If never moved (no ledger entry), use created_at? Or assume dead?
                    // Let's use created_at if no ledger, or assume very old.
                    const lastMove = lastMoveMap[v.id] || new Date(v.created_at).getTime();
                    return (now - lastMove) > ninetyDaysMs && v.stock_quantity > 0;
                }).map(v => {
                    // Find nearest expiry from batches
                    const vBatches = batches?.filter(b => b.variant_id === v.id && b.current_quantity > 0) || [];
                    vBatches.sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
                    const nearest = vBatches.length > 0 ? vBatches[0].expiry_date : null;
                    return { ...v, nearest_expiry: nearest };
                });

                const totalValue = agingItems.reduce((acc, v) => acc + (v.stock_quantity * (v.price || 0)), 0);

                setAgingData(agingItems);
                setStats(prev => ({ ...prev, agingValue: totalValue, agingCount: agingItems.length }));
            } else if (activeTab === 'low_stock') {
                // Low stock is current state, not historical usually, but we could use ledger to see low stock events? 
                // For now, keep it as current snapshot. Use getAllVariants data 'variants' which has latest stock.
                // Low stock is current state, not historical usually, but we could use ledger to see low stock events? 
                // For now, keep it as current snapshot. Use getAllVariants data 'variants' which has latest stock.
                const lowStock = variants.filter(v => {
                    const stock = parseInt(v.stock_quantity || 0);
                    // If min_stock_level is 0 or null, default to 10
                    const min = parseInt(v.min_stock_level) || 10;
                    return stock <= min;
                });
                setLowStockData(lowStock);
            } else if (activeTab === 'purchase_sales' || activeTab === 'gst') {
                const ledger = await getInventoryLedger(null, null, 1000, dateRange.start || null, dateRange.end || null);

                // Process for Purchase vs Sales (Group by Month)
                const monthlyStats = {};
                ledger.forEach(entry => {
                    const date = new Date(entry.transaction_date);
                    const key = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`; // e.g., "Jan 2026"

                    if (!monthlyStats[key]) monthlyStats[key] = { name: key, purchases: 0, sales: 0, sortDate: date.getTime() };

                    // Calculate Value
                    // unit_cost is used for purchase value. For sales, we use (qty * price).
                    // entry.product_variants contains { price, cost_price, gst_rate }
                    const variant = entry.product_variants || {};
                    const quantity = Math.abs(entry.quantity_change);

                    if (['PURCHASE', 'purchase', 'inward'].includes(entry.transaction_type?.toLowerCase())) {
                        const val = entry.total_value || (quantity * (entry.unit_cost || variant.cost_price || 0));
                        monthlyStats[key].purchases += val;
                    } else if (['SALE', 'sale'].includes(entry.transaction_type?.toLowerCase())) {
                        const val = quantity * (variant.price || 0);
                        monthlyStats[key].sales += val;
                    }
                });

                const chartData = Object.values(monthlyStats).sort((a, b) => a.sortDate - b.sortDate);
                setPurchaseSalesData(chartData);

                // Process for GST
                let inputTax = 0;
                let outputTax = 0;
                const gstBreakdown = {}; // { "18": { input: 0, output: 0 } }

                ledger.forEach(entry => {
                    const variant = entry.product_variants || {};
                    // Find robust rate from variant -> product
                    const fullVariant = variants.find(v => v.id === entry.variant_id);
                    const rate = fullVariant?.gst_rate ?? fullVariant?.products?.gst_rate ?? 18;
                    const quantity = Math.abs(entry.quantity_change);

                    const rateKey = rate.toString();
                    if (!gstBreakdown[rateKey]) gstBreakdown[rateKey] = { input: 0, output: 0 };

                    if (['PURCHASE', 'purchase', 'inward'].includes(entry.transaction_type?.toLowerCase())) {
                        const val = entry.total_value || (quantity * (entry.unit_cost || variant.cost_price || 0));
                        const tax = (val * rate / 100);
                        inputTax += tax;
                        gstBreakdown[rateKey].input += tax;
                    } else if (['SALE', 'sale'].includes(entry.transaction_type?.toLowerCase())) {
                        const val = quantity * (variant.price || 0);
                        const tax = (val * rate / 100);
                        outputTax += tax;
                        gstBreakdown[rateKey].output += tax;
                    }
                });

                setGstData([
                    { name: 'Input Tax (Paid)', value: inputTax, color: '#64748b' },
                    { name: 'Output Tax (Collected)', value: outputTax, color: '#10b981' }
                ]);
                setStats(prev => ({ ...prev, gstBreakdown: gstBreakdown }));
            }

        } catch (error) {
            console.error("Error loading analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 print:p-0">
            <div className="flex justify-between items-center print:hidden">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-pink-500 rounded-sm"></div>
                    <h1 className="text-2xl font-bold text-sage-900">Reports & Analytics</h1>
                </div>
                <div className="flex items-center gap-3 relative">
                    <button
                        onClick={() => setShowDateFilters(!showDateFilters)}
                        className={`flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sage-600 shadow-sm transition-colors ${showDateFilters ? 'border-pink-500 ring-1 ring-pink-500 bg-pink-50' : 'border-sage-200 hover:text-sage-900 hover:bg-sage-50'}`}
                    >
                        <CalendarRange className="w-4 h-4" />
                        {dateRange.start ? 'Date Filter Active' : 'Date Range'}
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-sage-200 rounded-lg text-sage-600 hover:text-sage-900 hover:bg-sage-50 shadow-sm transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Print / PDF
                    </button>

                    {/* Date Filter Dropdown */}
                    {showDateFilters && (
                        <div className="absolute top-12 right-0 bg-white border border-sage-200 rounded-lg shadow-lg p-4 z-50 flex flex-col gap-3 min-w-[300px] animate-in fade-in zoom-in-95">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-sage-700">Filter Range</span>
                                <button onClick={() => setDateRange({ start: '', end: '' })} className="text-xs text-red-500 hover:underline">Clear</button>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                    className="w-full text-sm border border-sage-200 rounded px-2 py-1"
                                />
                                <span className="text-stone-400">-</span>
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                    className="w-full text-sm border border-sage-200 rounded px-2 py-1"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Report Tabs */}
            <div className="flex border-b border-sage-200 mb-6 gap-6">
                {['aging', 'low_stock', 'purchase_sales', 'gst'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === tab ? 'text-blue-600' : 'text-stone-500 hover:text-sage-800'
                            }`}
                    >
                        {tab.replace('_', ' ').toUpperCase()}
                        {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></div>}
                    </button>
                ))}
            </div>

            {/* Report Content */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-sage-100 min-h-[400px]">
                {loading ? (
                    <div className="text-center py-20 text-stone-500">Loading data...</div>
                ) : (
                    <>
                        {activeTab === 'aging' && (
                            <div>
                                <h3 className="text-lg font-semibold text-sage-900 mb-4">Stock Aging & Expiry Report</h3>
                                <p className="text-stone-500 text-sm mb-6">Identify slow-moving items and stock nearing expiry.</p>

                                {agingData.length > 0 ? (
                                    <div className="space-y-6">
                                        <div className="bg-sage-50 rounded-lg border border-sage-200 p-6 flex flex-col items-center justify-center text-center">
                                            <FileText className="w-12 h-12 text-sage-400 mb-3" />
                                            <h4 className="text-sage-700 font-medium">Aging Analysis Generated</h4>
                                            <p className="text-stone-500 text-sm max-w-sm mt-2">
                                                {stats.agingCount} Products have not moved in the last 90 days. Total value tied up: <span className="text-sage-900 font-bold font-mono">₹{stats.agingValue.toLocaleString()}</span>
                                            </p>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead className="bg-sage-50 text-xs uppercase text-sage-500 font-semibold">
                                                    <tr>
                                                        <th className="px-4 py-3">Product</th>
                                                        <th className="px-4 py-3">Stock Qty</th>
                                                        <th className="px-4 py-3">Value</th>
                                                        <th className="px-4 py-3">Nearest Expiry</th>
                                                        <th className="px-4 py-3">Suggested Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-sage-100 text-sm">
                                                    {agingData.map(item => {
                                                        // Determine action
                                                        let action = "Monitor";
                                                        let actionColor = "text-stone-500";
                                                        const expiry = item.nearest_expiry ? new Date(item.nearest_expiry) : null;
                                                        const daysToExpiry = expiry ? Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24)) : 999;

                                                        if (daysToExpiry < 30) { action = "Clearance / Write-off"; actionColor = "text-red-600 font-bold"; }
                                                        else if (daysToExpiry < 90) { action = "Run Promotion (20% Off)"; actionColor = "text-orange-600"; }
                                                        else { action = "Bundle Trend Items"; actionColor = "text-blue-600"; }

                                                        return (
                                                            <tr key={item.id} className="hover:bg-sage-50 transition-colors">
                                                                <td className="px-4 py-3 font-medium text-sage-900">{item.products?.name} <span className="text-stone-400 font-normal">({item.sku})</span></td>
                                                                <td className="px-4 py-3">{item.stock_quantity}</td>
                                                                <td className="px-4 py-3 font-mono">₹{(item.price * item.stock_quantity).toFixed(2)}</td>
                                                                <td className="px-4 py-3">{expiry ? expiry.toLocaleDateString() : 'N/A'}</td>
                                                                <td className={`px-4 py-3 ${actionColor}`}>{action}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-10 text-stone-500">
                                        No aging stock found. Everything is moving!
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'low_stock' && (
                            <div>
                                <h3 className="text-lg font-semibold text-sage-900 mb-4 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                                    Low Stock Severity
                                </h3>

                                {lowStockData.length > 0 ? (
                                    <div className="space-y-4">
                                        {lowStockData.map((item, i) => (
                                            <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-sage-200 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-sage-100 rounded flex items-center justify-center text-sage-600 font-bold">
                                                        {item.stock_quantity}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sage-900 font-medium">{item.products?.name} ({item.name})</h4>
                                                        <p className="text-xs text-orange-600">Reorder Level: {item.min_stock_level || 10}</p>
                                                    </div>
                                                </div>
                                                <button className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded shadow-sm">Reorder</button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 text-stone-500">
                                        No low stock items. Inventory is healthy.
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'purchase_sales' && (
                            <div>
                                <h3 className="text-lg font-semibold text-sage-900 mb-4">Purchase vs Sales Analysis</h3>
                                <div className="h-80 w-full mb-8">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={purchaseSalesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                                            <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => `₹${value / 1000}k`} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                                formatter={(value) => [`₹${value.toLocaleString()}`, undefined]}
                                            />
                                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                            <Bar dataKey="purchases" name="Purchases" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="sales" name="Sales" fill="#059669" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-sage-50 rounded-lg border border-sage-200">
                                        <p className="text-sm text-stone-500">Total Purchases</p>
                                        <p className="text-2xl font-bold text-slate-600">₹{purchaseSalesData.reduce((a, b) => a + b.purchases, 0).toLocaleString()}</p>
                                    </div>
                                    <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                                        <p className="text-sm text-emerald-600">Total Sales</p>
                                        <p className="text-2xl font-bold text-emerald-700">₹{purchaseSalesData.reduce((a, b) => a + b.sales, 0).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'gst' && (
                            <div>
                                <h3 className="text-lg font-semibold text-sage-900 mb-4">GST / Tax Liability</h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={gstData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {gstData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                                                <Legend verticalAlign="bottom" height={36} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="space-y-4 flex flex-col justify-center">
                                        <div className="p-4 bg-white border border-sage-200 rounded-lg shadow-sm">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm text-stone-500">Input Tax Credit (Paid)</span>
                                                <span className="text-sm font-bold text-slate-600">₹{(gstData.find(d => d.name === 'Input Tax (Paid)')?.value || 0).toLocaleString()}</span>
                                            </div>
                                            <div className="w-full bg-sage-100 h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-slate-500 h-full" style={{ width: '100%' }}></div>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-white border border-sage-200 rounded-lg shadow-sm">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm text-stone-500">Output Tax (Collected)</span>
                                                <span className="text-sm font-bold text-emerald-600">₹{(gstData.find(d => d.name === 'Output Tax (Collected)')?.value || 0).toLocaleString()}</span>
                                            </div>
                                            <div className="w-full bg-sage-100 h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-emerald-500 h-full" style={{ width: '100%' }}></div>
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-sage-100">
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium text-sage-900">Net Payable</span>
                                                <span className="font-bold text-xl text-sage-900">
                                                    ₹{Math.max(0, (gstData.find(d => d.name === 'Output Tax (Collected)')?.value || 0) - (gstData.find(d => d.name === 'Input Tax (Paid)')?.value || 0)).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed GST Summary Table */}
                                <h4 className="text-md font-bold text-sage-900 mb-3">GST Slab Summary</h4>
                                <div className="overflow-x-auto bg-white rounded-lg border border-sage-200 shadow-sm">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-sage-50 text-sage-600 font-semibold border-b border-sage-100">
                                            <tr>
                                                <th className="px-4 py-3">GST Rate</th>
                                                <th className="px-4 py-3">Input Tax (Buy)</th>
                                                <th className="px-4 py-3">Output Tax (Sell)</th>
                                                <th className="px-4 py-3">Net Payable</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-sage-100">
                                            {stats.gstBreakdown && Object.keys(stats.gstBreakdown).sort((a, b) => parseInt(a) - parseInt(b)).map(rate => (
                                                <tr key={rate} className="hover:bg-sage-50">
                                                    <td className="px-4 py-3 font-medium text-sage-900">{rate === '0' ? 'Exempt (0%)' : `${rate}%`}</td>
                                                    <td className="px-4 py-3 text-slate-600">₹{stats.gstBreakdown[rate].input.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-emerald-600">₹{stats.gstBreakdown[rate].output.toLocaleString()}</td>
                                                    <td className="px-4 py-3 font-bold text-sage-900">
                                                        ₹{(stats.gstBreakdown[rate].output - stats.gstBreakdown[rate].input).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="bg-sage-50 font-bold border-t border-sage-200">
                                                <td className="px-4 py-3">Total</td>
                                                <td className="px-4 py-3 text-slate-700">₹{(gstData.find(d => d.name === 'Input Tax (Paid)')?.value || 0).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-emerald-700">₹{(gstData.find(d => d.name === 'Output Tax (Collected)')?.value || 0).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-sage-900">
                                                    ₹{Math.max(0, (gstData.find(d => d.name === 'Output Tax (Collected)')?.value || 0) - (gstData.find(d => d.name === 'Input Tax (Paid)')?.value || 0)).toLocaleString()}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default InventoryAnalytics;
