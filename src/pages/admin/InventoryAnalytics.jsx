import React, { useState, useEffect } from 'react';
import { FileText, Download, AlertTriangle, CalendarRange } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { getAllVariants, getInventoryLedger } from '../../lib/data';

const InventoryAnalytics = () => {
    const [activeTab, setActiveTab] = useState('aging');
    const [loading, setLoading] = useState(false);
    const [agingData, setAgingData] = useState([]);
    const [lowStockData, setLowStockData] = useState([]);
    const [stats, setStats] = useState({ agingValue: 0, agingCount: 0 });
    const [purchaseSalesData, setPurchaseSalesData] = useState([]);
    const [gstData, setGstData] = useState([]);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            const variants = await getAllVariants();

            if (activeTab === 'aging') {
                const ledger = await getInventoryLedger(null, null, 1000); // Need history to find last movement

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
                });

                const totalValue = agingItems.reduce((acc, v) => acc + (v.stock_quantity * (v.price || 0)), 0);

                setAgingData(agingItems);
                setStats(prev => ({ ...prev, agingValue: totalValue, agingCount: agingItems.length }));
            } else if (activeTab === 'low_stock') {
                const lowStock = variants.filter(v => v.stock_quantity <= (v.min_stock_level || 10));
                setLowStockData(lowStock);
            } else if (activeTab === 'purchase_sales' || activeTab === 'gst') {
                const ledger = await getInventoryLedger(null, null, 1000);

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

                    if (entry.transaction_type === 'PURCHASE' || entry.transaction_type === 'purchase') {
                        // entry.total_value is usually populated for purchase. Or qty * unit_cost
                        const val = entry.total_value || (quantity * (entry.unit_cost || variant.cost_price || 0));
                        monthlyStats[key].purchases += val;
                    } else if (entry.transaction_type === 'SALE' || entry.transaction_type === 'sale' || entry.transaction_type === 'transfer_out') {
                        // Estimate Sales Value: Qty * Selling Price
                        const val = quantity * (variant.price || 0);
                        monthlyStats[key].sales += val;
                    }
                });

                const chartData = Object.values(monthlyStats).sort((a, b) => a.sortDate - b.sortDate);
                setPurchaseSalesData(chartData);

                // Process for GST
                let inputTax = 0;
                let outputTax = 0;

                ledger.forEach(entry => {
                    const variant = entry.product_variants || {};
                    const rate = variant.gst_rate || 0; // Default 0 if not set
                    const quantity = Math.abs(entry.quantity_change);

                    if (rate > 0) {
                        if (entry.transaction_type === 'PURCHASE' || entry.transaction_type === 'purchase') {
                            const val = entry.total_value || (quantity * (entry.unit_cost || variant.cost_price || 0));
                            inputTax += (val * rate / 100);
                        } else if (entry.transaction_type === 'SALE' || entry.transaction_type === 'sale') {
                            const val = quantity * (variant.price || 0);
                            outputTax += (val * rate / 100);
                        }
                    }
                });

                setGstData([
                    { name: 'Input Tax (Paid)', value: inputTax, color: '#64748b' },
                    { name: 'Output Tax (Collected)', value: outputTax, color: '#10b981' }
                ]);
            }

        } catch (error) {
            console.error("Error loading analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-pink-500 rounded-sm"></div>
                    <h1 className="text-2xl font-bold text-sage-900">Reports & Analytics</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-sage-200 rounded-lg text-sage-600 hover:text-sage-900 hover:bg-sage-50 shadow-sm transition-colors">
                        <CalendarRange className="w-4 h-4" />
                        This Month
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-sage-200 rounded-lg text-sage-600 hover:text-sage-900 hover:bg-sage-50 shadow-sm transition-colors">
                        <Download className="w-4 h-4" />
                        Download PDF
                    </button>
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
                                <h3 className="text-lg font-semibold text-sage-900 mb-4">Stock Aging Report</h3>
                                <p className="text-stone-500 text-sm mb-6">Identify slow-moving items and dead stock based on the last movement date (&gt; 90 days).</p>

                                {agingData.length > 0 ? (
                                    <div className="space-y-6">
                                        <div className="bg-sage-50 rounded-lg border border-sage-200 p-6 flex flex-col items-center justify-center text-center">
                                            <FileText className="w-12 h-12 text-sage-400 mb-3" />
                                            <h4 className="text-sage-700 font-medium">Aging Analysis Generated</h4>
                                            <p className="text-stone-500 text-sm max-w-sm mt-2">
                                                {stats.agingCount} Products have not moved in the last 90 days. Total value tied up: <span className="text-sage-900 font-bold font-mono">${stats.agingValue.toLocaleString()}</span>
                                            </p>
                                        </div>

                                        <div className="divide-y divide-sage-100">
                                            {agingData.map(item => (
                                                <div key={item.id} className="py-4 flex justify-between items-center hover:bg-sage-50 transition-colors px-2 rounded-lg">
                                                    <div>
                                                        <h4 className="font-medium text-sage-900">{item.products?.name} - {item.name}</h4>
                                                        <p className="text-xs text-stone-500">Stock: {item.stock_quantity}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm text-stone-600">${(item.price * item.stock_quantity).toFixed(2)}</p>
                                                    </div>
                                                </div>
                                            ))}
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
                                            <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => `$${value / 1000}k`} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                                formatter={(value) => [`$${value.toLocaleString()}`, undefined]}
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
                                        <p className="text-2xl font-bold text-slate-600">${purchaseSalesData.reduce((a, b) => a + b.purchases, 0).toLocaleString()}</p>
                                    </div>
                                    <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                                        <p className="text-sm text-emerald-600">Total Sales</p>
                                        <p className="text-2xl font-bold text-emerald-700">${purchaseSalesData.reduce((a, b) => a + b.sales, 0).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'gst' && (
                            <div>
                                <h3 className="text-lg font-semibold text-sage-900 mb-4">GST / Tax Liability</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                                                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                                                <Legend verticalAlign="bottom" height={36} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="space-y-4 flex flex-col justify-center">
                                        <div className="p-4 bg-white border border-sage-200 rounded-lg shadow-sm">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm text-stone-500">Input Tax Credit (Paid)</span>
                                                <span className="text-sm font-bold text-slate-600">${(gstData.find(d => d.name === 'Input Tax (Paid)')?.value || 0).toLocaleString()}</span>
                                            </div>
                                            <div className="w-full bg-sage-100 h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-slate-500 h-full" style={{ width: '100%' }}></div>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-white border border-sage-200 rounded-lg shadow-sm">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm text-stone-500">Output Tax (Collected)</span>
                                                <span className="text-sm font-bold text-emerald-600">${(gstData.find(d => d.name === 'Output Tax (Collected)')?.value || 0).toLocaleString()}</span>
                                            </div>
                                            <div className="w-full bg-sage-100 h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-emerald-500 h-full" style={{ width: '100%' }}></div>
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-sage-100">
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium text-sage-900">Net Payable</span>
                                                <span className="font-bold text-xl text-sage-900">
                                                    ${Math.max(0, (gstData.find(d => d.name === 'Output Tax (Collected)')?.value || 0) - (gstData.find(d => d.name === 'Input Tax (Paid)')?.value || 0)).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
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
