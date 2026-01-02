import React, { useState, useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { transferStock, getWarehouses, getAllVariants } from '../../lib/data';
import Button from '../Button';

const StockTransferModal = ({ isOpen, onClose, onSuccess }) => {
    const [variants, setVariants] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        variant_id: '',
        source_warehouse_id: '',
        target_warehouse_id: '',
        quantity: '',
        reason: ''
    });

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen]);

    const loadData = async () => {
        const [vData, wData] = await Promise.all([
            getAllVariants(),
            getWarehouses()
        ]);
        setVariants(vData || []);
        setWarehouses(wData || []);

        if (wData && wData.length > 1) {
            setFormData(prev => ({
                ...prev,
                source_warehouse_id: wData[0].id,
                target_warehouse_id: wData[1].id
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.source_warehouse_id === formData.target_warehouse_id) {
            alert("Source and Target warehouses must be different");
            return;
        }

        setLoading(true);
        try {
            await transferStock({
                ...formData,
                quantity: parseInt(formData.quantity)
            });
            onSuccess();
            onClose();
            setFormData({ variant_id: '', source_warehouse_id: '', target_warehouse_id: '', quantity: '', reason: '' });
        } catch (error) {
            console.error("Transfer failed:", error);
            alert("Failed to transfer stock");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-900">Transfer Stock</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Product / Variant</label>
                        <select
                            required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-saffron-500 outline-none"
                            value={formData.variant_id}
                            onChange={e => setFormData({ ...formData, variant_id: e.target.value })}
                        >
                            <option value="">Select Item...</option>
                            {variants.map(v => (
                                <option key={v.id} value={v.id}>
                                    {v.products?.name} - {v.name} ({v.sku})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                            <select
                                required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-saffron-500 outline-none"
                                value={formData.source_warehouse_id}
                                onChange={e => setFormData({ ...formData, source_warehouse_id: e.target.value })}
                            >
                                {warehouses.map(w => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 mt-6" />
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                            <select
                                required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-saffron-500 outline-none"
                                value={formData.target_warehouse_id}
                                onChange={e => setFormData({ ...formData, target_warehouse_id: e.target.value })}
                            >
                                {warehouses.map(w => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                        <input
                            type="number"
                            required
                            min="1"
                            placeholder="Amount to transfer"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-saffron-500 outline-none"
                            value={formData.quantity}
                            onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason / Reference</label>
                        <input
                            type="text"
                            required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-saffron-500 outline-none"
                            value={formData.reason}
                            onChange={e => setFormData({ ...formData, reason: e.target.value })}
                            placeholder="e.g. Refill Store #2"
                        />
                    </div>

                    <div className="pt-2 flex gap-3">
                        <Button type="submit" className="flex-1" disabled={loading}>
                            {loading ? 'Processing...' : 'Transfer Stock'}
                        </Button>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StockTransferModal;
