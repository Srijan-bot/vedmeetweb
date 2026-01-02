import React, { useState, useEffect } from 'react';
import { BadgeDollarSign, FileSpreadsheet, Scale, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const InventoryAccounting = () => {
    const [ledgerEntries, setLedgerEntries] = useState([]);
    const [stats, setStats] = useState({
        inventory_val: 0,
        cogs: 0,
        revenue_potential: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLedger();
        fetchStats();
    }, []);

    const fetchLedger = async () => {
        try {
            // Fetch ledger with aggregated lines for simplified view
            // In a real app we might join accounts, but here we simplify
            const { data, error } = await supabase
                .from('accounting_ledger')
                .select(`
                    id,
                    transaction_date,
                    description,
                    reference_type,
                    accounting_journal_lines (
                        account_id,
                        debit,
                        credit,
                        accounting_accounts ( name, type )
                    )
                `)
                .order('transaction_date', { ascending: false });

            if (error) throw error;

            // Process data for display
            const formatted = data.map(entry => {
                // Determine main impact (simplification)
                // Find revenue or expense line
                const revenueLine = entry.accounting_journal_lines.find(l => l.accounting_accounts.type === 'Revenue');
                const expenseLine = entry.accounting_journal_lines.find(l => l.accounting_accounts.type === 'Expense');

                let type = 'General';
                let amount = 0;

                if (revenueLine) {
                    type = 'Revenue';
                    amount = revenueLine.credit;
                } else if (expenseLine) {
                    type = 'Expense';
                    amount = -expenseLine.debit; // Negative for display
                }

                return {
                    id: entry.id,
                    date: new Date(entry.transaction_date).toLocaleDateString(),
                    description: entry.description,
                    type,
                    amount,
                    related_to: entry.reference_type
                };
            });

            setLedgerEntries(formatted);
        } catch (error) {
            console.error("Error fetching ledger:", error);
        }
    };

    const fetchStats = async () => {
        try {
            // 1. Inventory Value (Sum of Stock * Cost)
            const { data: stockData } = await supabase
                .from('product_variants')
                .select('stock_quantity, cost_price, price');

            let invVal = 0;
            let revPot = 0;

            stockData?.forEach(item => {
                invVal += (item.stock_quantity || 0) * (item.cost_price || 0);
                revPot += (item.stock_quantity || 0) * (item.price || 0);
            });

            // 2. COGS (Sum of Expense debits this month) - Simplified query
            // In production, use specific account IDs or time filters
            // Here we mock the COGS fetch or do a basic client-side calc if table allows
            // const { data: cogsData } = await supabase ... (omitted for brevity)
            const cogsVal = 0; // Placeholder until real transactions flow

            setStats({
                inventory_val: invVal,
                cogs: cogsVal,
                revenue_potential: revPot
            });

        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-emerald-500 rounded-sm"></div>
                    <h1 className="text-2xl font-bold text-sage-900">Accounting & Ledger</h1>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
                    <FileSpreadsheet className="w-4 h-4" />
                    Export Ledger
                </button>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-sage-200">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-stone-500 text-sm font-medium uppercase tracking-wider">Inventory Asset Value</p>
                            <h3 className="text-2xl font-bold text-sage-900 mt-1">Rs. {stats.inventory_val.toLocaleString()}</h3>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-full">
                            <Scale className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                    <p className="text-xs text-stone-500">Current value of stock on hand (Cost Price)</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-sage-200">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-stone-500 text-sm font-medium uppercase tracking-wider">COGS (This Month)</p>
                            <h3 className="text-2xl font-bold text-sage-900 mt-1">Rs. {stats.cogs.toLocaleString()}</h3>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-full">
                            <BadgeDollarSign className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                    <p className="text-xs text-stone-500">Cost of Goods Sold</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-sage-200">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-stone-500 text-sm font-medium uppercase tracking-wider">Est. Revenue Potential</p>
                            <h3 className="text-2xl font-bold text-sage-900 mt-1">Rs. {stats.revenue_potential.toLocaleString()}</h3>
                        </div>
                        <div className="p-3 bg-emerald-100 rounded-full">
                            <TrendingUp className="w-6 h-6 text-emerald-600" />
                        </div>
                    </div>
                    <p className="text-xs text-stone-500">Projected sales from current stock</p>
                </div>
            </div>

            {/* Ledger Table */}
            <div className="bg-white rounded-xl border border-sage-200 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-sage-200 flex justify-between items-center bg-white">
                    <h3 className="font-semibold text-sage-900">Financial Ledger</h3>
                    <span className="text-xs text-stone-500">Auto-generated from stock movements</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-sage-50 text-sage-500 text-xs uppercase font-semibold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Note / Description</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Related To</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-sage-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center text-stone-500">Loading ledger...</td>
                                </tr>
                            ) : ledgerEntries.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center text-stone-500">No transactions yet.</td>
                                </tr>
                            ) : (
                                ledgerEntries.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-sage-50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-sage-700">{entry.date}</td>
                                        <td className="px-6 py-4 text-sm text-sage-900 font-medium">{entry.description}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${entry.type === 'Revenue' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                                entry.type === 'Expense' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
                                                }`}>
                                                {entry.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-stone-500 capitalize">{entry.related_to}</td>
                                        <td className={`px-6 py-4 text-right font-mono font-bold ${entry.amount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {entry.amount > 0 ? '+' : ''}{entry.amount.toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InventoryAccounting;
