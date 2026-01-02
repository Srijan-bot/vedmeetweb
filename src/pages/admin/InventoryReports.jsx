import React, { useEffect, useState } from 'react';
import { Package, AlertTriangle, Clock, DollarSign, ArrowUpRight, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';
import { getInventoryStats, getInventoryLedger, getAllVariants, getExpiringBatches } from '../../lib/data';

const StatCard = ({ title, value, subtext, icon: Icon, colorClass, barColor, bgClass, textClass }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-sage-100 relative overflow-hidden">
        <div className="flex justify-between items-start z-10 relative">
            <div>
                <p className="text-stone-500 text-sm font-medium mb-1 uppercase tracking-wider">{title}</p>
                <h3 className="text-3xl font-bold text-sage-900">{value}</h3>
            </div>
            <div className={`p-3 rounded-full ${bgClass} ${textClass}`}>
                <Icon size={24} />
            </div>
        </div>

        {/* Decorative Mini Bar Chart */}
        <div className="flex items-end gap-1 h-8 absolute bottom-6 right-6 opacity-30">
            {[40, 70, 50, 90, 60].map((h, i) => (
                <div key={i} style={{ height: `${h}%` }} className={`w-1.5 rounded-t-sm ${barColor}`}></div>
            ))}
        </div>
    </div>
);

const InventoryReports = () => {
    const [stats, setStats] = useState({
        totalProducts: 0,
        lowStock: 0,
        expiringSoon: 0,
        inventoryValue: 0
    });
    const [chartData, setChartData] = useState({ stockFlow: [], categoryDist: [], trend: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const [variants, ledger, statsRaw, expiringBatches] = await Promise.all([
                getAllVariants(),
                // Fetch more ledger history for charts (e.g., 1000 items) to get a decent graph
                getInventoryLedger(null, null, 1000),
                getInventoryStats(),
                getExpiringBatches(90) // 90 days threshold
            ]);

            // 1. Process Stats
            const lowStockCount = variants.filter(v => v.stock_quantity <= (v.min_stock_level || 10)).length;

            // asset_value comes from getInventoryStats which sums (qty * cost) from batch stock
            const inventoryValue = statsRaw.asset_value || 0;

            setStats({
                totalProducts: variants.length,
                lowStock: lowStockCount,
                expiringSoon: expiringBatches.length,
                inventoryValue: inventoryValue
            });

            // 2. Process Chart 1: Stock In vs Out (Monthly)
            // Group ledger by Month-Year
            const stockFlowMap = {};
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

            // Initialize last 6 months to 0 so we show a timeline even if empty
            const today = new Date();
            for (let i = 5; i >= 0; i--) {
                const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const key = `${months[d.getMonth()]} ${d.getFullYear()}`; // "Jan 2024"
                const shortKey = months[d.getMonth()];
                stockFlowMap[key] = { name: shortKey, fullDate: d, in: 0, out: 0, sortVal: d.getTime() };
            }

            ledger.forEach(entry => {
                const date = new Date(entry.transaction_date);
                const key = `${months[date.getMonth()]} ${date.getFullYear()}`;

                // If this month is not initialized (older than 6 months or future?), maybe skip or add?
                // For simplicity, we only track if it matches our map or if we want to expand dynamic range.
                // Let's just create entry if missing to show all history fetched.
                if (!stockFlowMap[key]) {
                    stockFlowMap[key] = {
                        name: months[date.getMonth()],
                        fullDate: date,
                        in: 0,
                        out: 0,
                        sortVal: date.getTime() // store timestamp for sorting
                    };
                }

                if (['PURCHASE', 'transfer_in', 'inward', 'purchase'].includes(entry.transaction_type?.toLowerCase())) {
                    stockFlowMap[key].in += Math.abs(entry.quantity_change || 0);
                } else if (['SALE', 'transfer_out', 'sale'].includes(entry.transaction_type?.toLowerCase())) {
                    stockFlowMap[key].out += Math.abs(entry.quantity_change || 0);
                }
            });

            const flowData = Object.values(stockFlowMap)
                .sort((a, b) => a.sortVal - b.sortVal)
                .slice(-6); // Last 6 months only for display

            setChartData(prev => ({ ...prev, stockFlow: flowData }));

            // 3. Process Chart 2: Category Distribution
            const catMap = {};
            variants.forEach(v => {
                const cat = v.products?.category || 'Uncategorized';
                catMap[cat] = (catMap[cat] || 0) + 1;
            });

            const pieData = Object.keys(catMap)
                .map(k => ({ name: k, value: catMap[k] }))
                .sort((a, b) => b.value - a.value) // Sort by count desc
                .slice(0, 5); // Top 5

            setChartData(prev => ({ ...prev, categoryDist: pieData }));

            // 4. Process Chart 3: Inventory Value Trend (Simulated History)
            // We start with current value and work backwards using ledger net value change
            const trendMap = {};
            // Using same months loop but we need to track value changes per month
            ledger.forEach(entry => {
                const date = new Date(entry.transaction_date);
                const key = `${months[date.getMonth()]} ${date.getFullYear()}`;

                if (!trendMap[key]) trendMap[key] = 0;

                // Calculate total_value of this transaction
                // If it's IN, it added value. If OUT, it removed value.
                // Note: quantity_change is signed? No, usually absolute in my previous logic, let's check.
                // In data.js inwardStock: quantity_change is positive. transfer_out is negative.
                // But my previous loop used Math.abs.
                // Let's use the raw signed quantity_change if possible, but the ledger might store absolute depending on implementation.
                // data.js: inward -> quantity (pos), sale? we didn't check sale implementation but usually neg.
                // Let's assume standard accounting: In = +Value, Out = -Value.

                let val = entry.total_value || (Math.abs(entry.quantity_change) * (entry.unit_cost || 0));

                if (['SALE', 'transfer_out', 'sale'].includes(entry.transaction_type?.toLowerCase())) {
                    val = -val; // Outgoing reduces value
                } else if (['PURCHASE', 'transfer_in', 'inward', 'purchase'].includes(entry.transaction_type?.toLowerCase())) {
                    val = val; // Incoming adds value
                }
                // Adjustment? Depends on sign of quantity_change.
                // If not one of above, check quantity_change sign.
                else {
                    if (entry.quantity_change < 0) val = -Math.abs(val);
                    else val = Math.abs(val);
                }

                trendMap[key] += val;
            });

            // Construct trend line backwards
            let currentValue = inventoryValue;
            const trendData = [];

            // Loop last 6 months backwards
            for (let i = 0; i < 6; i++) {
                const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
                const netChange = trendMap[key] || 0;

                trendData.unshift({
                    name: months[d.getMonth()],
                    value: currentValue > 0 ? currentValue : 0
                });

                currentValue -= netChange; // Previous was (Current - NetChange)
            }

            setChartData(prev => ({ ...prev, trend: trendData }));

        } catch (error) {
            console.error("Dashboard Load Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    if (loading) return <div className="p-8 text-center text-sage-400">Loading Dashboard...</div>;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-serif font-bold text-sage-900">Inventory Dashboard</h1>
                <div className="flex gap-4">
                    {/* Search bar placeholder */}
                    <input
                        type="text"
                        placeholder="Search..."
                        className="bg-white border border-sage-200 text-sm rounded-lg px-4 py-2 text-sage-700 focus:outline-none focus:border-sage-400"
                    />
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    title="Total Products"
                    value={stats.totalProducts.toLocaleString()}
                    icon={Package}
                    bgClass="bg-blue-100"
                    textClass="text-blue-600"
                    barColor="bg-blue-500"
                />
                <StatCard
                    title="Low Stock Alerts"
                    value={stats.lowStock}
                    icon={AlertTriangle}
                    bgClass="bg-orange-100"
                    textClass="text-orange-600"
                    barColor="bg-orange-500"
                />
                <StatCard
                    title="Expiring Soon"
                    value={stats.expiringSoon}
                    icon={Clock}
                    bgClass="bg-red-100"
                    textClass="text-red-600"
                    barColor="bg-red-500"
                />
                <StatCard
                    title="Inventory Value"
                    value={`$${(stats.inventoryValue / 1000).toFixed(1)}k`}
                    icon={DollarSign}
                    bgClass="bg-emerald-100"
                    textClass="text-emerald-600"
                    barColor="bg-emerald-500"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bar Chart: Stock Flow */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-sage-100">
                    <h3 className="text-lg font-bold text-sage-900 mb-6 flex items-center gap-2">
                        <ArrowUpRight className="w-5 h-5 text-blue-500" />
                        Stock In vs Stock Out
                    </h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData.stockFlow}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <YAxis stroke="#64748b" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' }}
                                    itemStyle={{ color: '#1e293b' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="in" name="Stock In" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="out" name="Stock Out" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Donut Chart: Categories */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-sage-100">
                    <h3 className="text-lg font-bold text-sage-900 mb-6 flex items-center gap-2">
                        <Package className="w-5 h-5 text-emerald-500" />
                        Stock by Category
                    </h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData.categoryDist}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.categoryDist.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' }}
                                />
                                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '20px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Line Chart: Inventory Trend (Full Width) */}
                <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-sage-100">
                    <h3 className="text-lg font-bold text-sage-900 mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-purple-500" />
                        Inventory Value Trend (Last 6 Months)
                    </h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData.trend || []}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <YAxis stroke="#64748b" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' }}
                                    formatter={(value) => [`$${(value / 1000).toFixed(1)}k`, 'Value']}
                                />
                                <Area type="monotone" dataKey="value" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorValue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventoryReports;
