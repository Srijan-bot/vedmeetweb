import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Trash, RefreshCw, ChevronDown, Check, X } from 'lucide-react';
import { getAllVariants, getWarehouses } from '../../lib/data';
import { supabase } from '../../lib/supabase';
import StockAdjustmentModal from '../../components/Inventory/StockAdjustmentModal';
import BatchInwardModal from '../../components/Inventory/BatchInwardModal';

const Inventory = () => {
    const [variants, setVariants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal States
    const [isAdjustOpen, setIsAdjustOpen] = useState(false);
    const [isBatchInwardOpen, setIsBatchInwardOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const vData = await getAllVariants();
            setVariants(vData || []);
        } catch (error) {
            console.error("Failed to load inventory:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (qty) => {
        if (qty > 50) return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-500', label: 'In Stock' };
        if (qty > 10) return { bg: 'bg-orange-500/20', text: 'text-orange-400', dot: 'bg-orange-500', label: 'Low' };
        return { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-500', label: 'Critical' };
    };

    const filteredVariants = variants.filter(v =>
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.products?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8">
            {/* Header / Top Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-blue-500 rounded-sm"></div>
                    <h1 className="text-2xl font-bold text-sage-900">Inventory</h1>
                </div>

                <div className="flex items-center gap-4 text-stone-500">
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-sage-200 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        <span className="text-sm font-medium text-sage-700">3 New Alerts</span>
                    </div>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="bg-white p-4 rounded-xl border border-sage-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    {['Category: All Categories', 'Stock Status: All Status', 'Expiry Range: Select Date', 'Supplier: All Suppliers'].map((label, idx) => (
                        <button key={idx} className="flex items-center justify-between gap-2 px-4 py-2 bg-white hover:bg-sage-50 text-sage-700 rounded-lg text-sm border border-sage-200 shadow-sm min-w-[180px] transition-colors">
                            {label}
                            <ChevronDown className="w-4 h-4 text-sage-400" />
                        </button>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsBatchInwardOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-sage-50 text-sage-700 rounded-lg text-sm font-medium border border-sage-200 shadow-sm transition-colors">
                        <Plus className="w-4 h-4" />
                        Add Stock
                    </button>
                    <button onClick={() => setIsAdjustOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-sage-50 text-sage-700 rounded-lg text-sm font-medium border border-sage-200 shadow-sm transition-colors">
                        <RefreshCw className="w-4 h-4" />
                        Adjust Stock
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-sage-50 text-sage-700 rounded-lg text-sm font-medium border border-sage-200 shadow-sm transition-colors">
                        <Trash className="w-4 h-4" />
                        Batch Details
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium shadow-sm transition-colors">
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white rounded-xl border border-sage-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-sage-50 text-sage-500 text-xs uppercase font-semibold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Product Name</th>
                                <th className="px-6 py-4">SKU / Variant</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Current Stock</th>
                                <th className="px-6 py-4">Reorder Level</th>
                                <th className="px-6 py-4">Expiry Date</th>
                                <th className="px-6 py-4">Price</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-sage-100">
                            {loading ? (
                                <tr><td colSpan="8" className="p-8 text-center text-stone-500">Loading inventory...</td></tr>
                            ) : filteredVariants.map((variant) => {
                                const status = getStatusColor(variant.stock_quantity);
                                return (
                                    <tr key={variant.id} className="hover:bg-sage-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-sage-100 flex items-center justify-center text-xs font-bold text-sage-600">
                                                    {(variant.products?.name || 'P')[0]}
                                                </div>
                                                <span className="font-medium text-sage-900">{variant.products?.name || 'Unknown Product'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-stone-500 font-mono">{variant.sku}</td>
                                        <td className="px-6 py-4 text-sm text-stone-500">{variant.products?.category || 'General'}</td>
                                        <td className="px-6 py-4 text-sm text-sage-900 font-bold">{variant.stock_quantity}</td>
                                        <td className="px-6 py-4 text-sm text-stone-500">10</td> {/* Mocked Reorder Level */}
                                        <td className="px-6 py-4 text-sm text-stone-500">--</td> {/* Expiry not on variant level usually */}
                                        <td className="px-6 py-4 text-sm text-sage-700 font-mono">${variant.price}</td>
                                        <td className="px-6 py-4">
                                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full w-fit ${status.bg} border border-transparent`}>
                                                <span className={`w-2 h-2 rounded-full ${status.dot}`}></span>
                                                <span className={`text-xs font-medium ${status.text}`}>{status.label}</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Stats */}
                <div className="p-4 border-t border-sage-200 bg-sage-50 flex items-center justify-between text-sm text-stone-500">
                    <div>Showing 1 to {Math.min(filteredVariants.length, 10)} of {filteredVariants.length} entries</div>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 bg-white hover:bg-sage-100 border border-sage-200 rounded text-sage-600 transition-colors">Previous</button>
                        <button className="px-3 py-1 bg-blue-600 hover:bg-blue-500 border border-blue-600 rounded text-white transition-colors">1</button>
                        <button className="px-3 py-1 bg-white hover:bg-sage-100 border border-sage-200 rounded text-sage-600 transition-colors">2</button>
                        <button className="px-3 py-1 bg-white hover:bg-sage-100 border border-sage-200 rounded text-sage-600 transition-colors">3</button>
                        <button className="px-3 py-1 bg-white hover:bg-sage-100 border border-sage-200 rounded text-sage-600 transition-colors">Next</button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <StockAdjustmentModal
                isOpen={isAdjustOpen}
                onClose={() => setIsAdjustOpen(false)}
                onSuccess={loadData}
            />
            <BatchInwardModal
                isOpen={isBatchInwardOpen}
                onClose={() => setIsBatchInwardOpen(false)}
                onSuccess={loadData}
            />
        </div>
    );
};

export default Inventory;
