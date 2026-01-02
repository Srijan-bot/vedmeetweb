import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { adjustStock, getWarehouses, getVariants, getAllVariants } from '../../lib/data';
import Button from '../Button';

const StockAdjustmentModal = ({ isOpen, onClose, onSuccess }) => {
    const [variants, setVariants] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        variant_id: '',
        warehouse_id: '',
        quantity_change: '',
        type: 'adjustment', // adjustment, return, etc.
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

        // precise init
        if (wData && wData.length > 0) {
            setFormData(prev => ({ ...prev, warehouse_id: wData[0].id }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await adjustStock({
                ...formData,
                quantity_change: parseInt(formData.quantity_change)
            });
            onSuccess();
            onClose();
            setFormData({ variant_id: '', warehouse_id: '', quantity_change: '', type: 'adjustment', reason: '' });
        } catch (error) {
            console.error("Adjustment failed:", error);
            alert("Failed to adjust stock");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-900">Adjust Stock</h3>
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

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
                        <select
                            required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-saffron-500 outline-none"
                            value={formData.warehouse_id}
                            onChange={e => setFormData({ ...formData, warehouse_id: e.target.value })}
                        >
                            {warehouses.map(w => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Change (+/-)</label>
                            <input
                                type="number"
                                required
                                placeholder="+10 or -5"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-saffron-500 outline-none"
                                value={formData.quantity_change}
                                onChange={e => setFormData({ ...formData, quantity_change: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-saffron-500 outline-none"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="adjustment">Adjustment</option>
                                <option value="return">Return</option>
                                <option value="damage">Damage/Loss</option>
                                <option value="correction">Correction</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Required)</label>
                        <textarea
                            required
                            rows="2"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-saffron-500 outline-none"
                            value={formData.reason}
                            onChange={e => setFormData({ ...formData, reason: e.target.value })}
                            placeholder="e.g. Found extra stock during audit"
                        />
                    </div>

                    <div className="pt-2 flex gap-3">
                        <Button type="submit" className="flex-1" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Adjustment'}
                        </Button>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StockAdjustmentModal;
