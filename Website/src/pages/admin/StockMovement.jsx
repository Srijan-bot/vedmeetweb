import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ArrowUpRight, ArrowDownLeft, Filter, Search, Calendar, User } from 'lucide-react';

const StockMovement = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filterType, setFilterType] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [showFilters, setShowFilters] = useState(false);
    const [showDateFilters, setShowDateFilters] = useState(false);

    useEffect(() => {
        fetchTransactions();
    }, [filterType, dateRange]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            // 1. Fetch Transactions (removed performed_by join which caused 400 error)
            let query = supabase
                .from('inventory_transactions')
                .select(`
                    *,
                    product_variants (name, sku),
                    warehouses (name)
                `)
                .order('created_at', { ascending: false });

            // Apply Filters
            if (filterType) {
                query = query.ilike('transaction_type', `%${filterType}%`);
            }
            if (dateRange.start) {
                query = query.gte('created_at', new Date(dateRange.start).toISOString());
            }
            if (dateRange.end) {
                const endDate = new Date(dateRange.end);
                endDate.setHours(23, 59, 59, 999);
                query = query.lte('created_at', endDate.toISOString());
            }

            const { data: txData, error: txError } = await query.limit(100);
            if (txError) throw txError;

            // 2. Client-side join for User emails (performed_by)
            // Fetch unique user IDs
            const userIds = [...new Set(txData.map(tx => tx.performed_by).filter(Boolean))];

            let userMap = {};
            if (userIds.length > 0) {
                const { data: userData } = await supabase
                    .from('profiles')
                    .select('id, email, full_name')
                    .in('id', userIds);

                if (userData) {
                    userData.forEach(u => { userMap[u.id] = u; });
                }
            }

            // Merge data
            const enrichedData = txData.map(tx => ({
                ...tx,
                performer_details: userMap[tx.performed_by] || null
            }));

            setTransactions(enrichedData || []);
        } catch (error) {
            console.error('Error fetching movements:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-purple-500 rounded-sm"></div>
                    <h1 className="text-2xl font-bold text-sage-900">Stock Movement</h1>
                </div>
                <div className="flex gap-3 items-center">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sage-600 shadow-sm transition-colors ${showFilters ? 'border-purple-500 ring-1 ring-purple-500 bg-purple-50' : 'border-sage-200 hover:text-sage-900 hover:bg-sage-50'}`}
                    >
                        <Filter className="w-4 h-4" />
                        Type Filter
                    </button>
                    <button
                        onClick={() => setShowDateFilters(!showDateFilters)}
                        className={`flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sage-600 shadow-sm transition-colors ${showDateFilters ? 'border-purple-500 ring-1 ring-purple-500 bg-purple-50' : 'border-sage-200 hover:text-sage-900 hover:bg-sage-50'}`}
                    >
                        <Calendar className="w-4 h-4" />
                        Date Range
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            {(showFilters || showDateFilters) && (
                <div className="bg-sage-50 border border-sage-200 rounded-lg p-4 flex flex-wrap gap-4 items-center animate-in fade-in slide-in-from-top-2">
                    {showFilters && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-sage-500 uppercase tracking-wide">Type:</span>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="px-3 py-1.5 bg-white border border-sage-200 rounded text-sage-700 text-sm focus:outline-none focus:border-purple-400"
                            >
                                <option value="">All Types</option>
                                <option value="purchase">Purchase (In)</option>
                                <option value="sale">Sale (Out)</option>
                                <option value="transfer">Transfer</option>
                                <option value="adjustment">Adjustment</option>
                                <option value="return">Return</option>
                            </select>
                        </div>
                    )}

                    {showDateFilters && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-sage-500 uppercase tracking-wide">Date:</span>
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                className="px-3 py-1.5 bg-white border border-sage-200 rounded text-sage-700 text-sm focus:outline-none focus:border-purple-400"
                                placeholder="Start"
                            />
                            <span className="text-sage-400">-</span>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                className="px-3 py-1.5 bg-white border border-sage-200 rounded text-sage-700 text-sm focus:outline-none focus:border-purple-400"
                                placeholder="End"
                            />
                        </div>
                    )}

                    <button
                        onClick={() => { setFilterType(''); setDateRange({ start: '', end: '' }); }}
                        className="text-xs text-red-500 hover:text-red-700 underline"
                    >
                        Clear All
                    </button>
                </div>
            )}

            <div className="bg-white rounded-xl border border-sage-200 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-sage-50 text-sage-500 text-xs uppercase font-semibold tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Date & Time</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Product / SKU</th>
                            <th className="px-6 py-4">Warehouse</th>
                            <th className="px-6 py-4 text-right">Quantity</th>
                            <th className="px-6 py-4">Reason / Ref</th>
                            <th className="px-6 py-4">User</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-sage-100">
                        {loading ? (
                            <tr><td colSpan="7" className="p-8 text-center text-stone-500">Loading movements...</td></tr>
                        ) : transactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-sage-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-sage-900">
                                        {new Date(tx.created_at).toLocaleDateString()}
                                    </div>
                                    <div className="text-xs text-stone-500">
                                        {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${tx.quantity_change > 0
                                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                        : 'bg-amber-100 text-amber-700 border border-amber-200'
                                        }`}>
                                        {tx.quantity_change > 0 ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                                        {tx.transaction_type?.replace(/_/g, ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-sage-900">{tx.product_variants?.name || 'Unknown'}</div>
                                    <div className="text-xs text-stone-500 font-mono">{tx.product_variants?.sku}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-stone-500">
                                    {tx.warehouses?.name || '-'}
                                </td>
                                <td className={`px-6 py-4 text-right font-mono font-bold ${tx.quantity_change > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {tx.quantity_change > 0 ? '+' : ''}{tx.quantity_change}
                                </td>
                                <td className="px-6 py-4 text-sm text-stone-500 max-w-xs truncate" title={tx.reason}>
                                    {tx.reason || '-'}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-xs text-stone-500">
                                        <User className="w-3 h-3" />
                                        {tx.performer_details?.email?.split('@')[0] || tx.performer_details?.full_name || 'System'}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {transactions.length === 0 && !loading && (
                            <tr><td colSpan="7" className="p-8 text-center text-stone-500">No transactions found matching criteria.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StockMovement;
