import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ArrowUpRight, ArrowDownLeft, Filter, Search, Calendar, User } from 'lucide-react';

const StockMovement = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('inventory_transactions')
                .select(`
                    *,
                    product_variants (name, sku),
                    warehouses (name),
                    performed_by (email)
                `)
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;
            setTransactions(data || []);
        } catch (error) {
            console.error('Error fetching movements:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-purple-500 rounded-sm"></div>
                    <h1 className="text-2xl font-bold text-sage-900">Stock Movement</h1>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-sage-200 rounded-lg text-sage-600 hover:text-sage-900 hover:bg-sage-50 shadow-sm transition-colors">
                        <Filter className="w-4 h-4" />
                        Filter
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-sage-200 rounded-lg text-sage-600 hover:text-sage-900 hover:bg-sage-50 shadow-sm transition-colors">
                        <Calendar className="w-4 h-4" />
                        Date Range
                    </button>
                </div>
            </div>

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
                                        {tx.performed_by?.email?.split('@')[0] || 'System'}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {transactions.length === 0 && !loading && (
                            <tr><td colSpan="7" className="p-8 text-center text-stone-500">No transactions found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StockMovement;
