import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, Package, AlertCircle } from 'lucide-react';
import { inwardStock, getWarehouses, getAllVariants } from '../../lib/data';
import Button from '../Button';

const BatchInwardModal = ({ isOpen, onClose, onSuccess }) => {
    const [variants, setVariants] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        variant_id: '',
        warehouse_id: '',
        batch_number: '',
        expiry_date: '',
        cost_price: '',
        quantity: '',
        reason: 'Regular Purchase'
    });

    useEffect(() => {
        if (isOpen) {
            loadData();
            // Generate default batch number
            const today = new Date();
            const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
            setFormData(prev => ({ ...prev, batch_number: `BATCH-${dateStr}-${Math.floor(Math.random() * 1000)}` }));
        }
    }, [isOpen]);

    const loadData = async () => {
        try {
            const [vData, wData] = await Promise.all([
                getAllVariants(),
                getWarehouses()
            ]);
            setVariants(vData || []);
            setWarehouses(wData || []);

            if (wData && wData.length > 0) {
                setFormData(prev => ({ ...prev, warehouse_id: wData[0].id }));
            }
        } catch (error) {
            console.error("Error loading data:", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        console.log("Inwarding Stock Data:", formData); // Debug Log
        try {
            await inwardStock({
                ...formData,
                quantity: parseInt(formData.quantity),
                cost_price: parseFloat(formData.cost_price)
            });
            onSuccess();
            onClose();
            // Reset form but keep warehouse
            setFormData(prev => ({
                ...prev,
                variant_id: '',
                batch_number: '',
                expiry_date: '',
                cost_price: '',
                quantity: '',
                reason: 'Regular Purchase'
            }));
        } catch (error) {
            console.error("Inward failed:", error);
            alert("Failed to inward stock: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const selectedVariant = variants.find(v => v.id === formData.variant_id);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-sage-50">
                    <div>
                        <h3 className="font-bold text-sage-900 text-lg">Inward Stock (New Batch)</h3>
                        <p className="text-xs text-sage-500">Add new items to inventory with batch tracking</p>
                    </div>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-500 hover:text-red-500" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Product Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-sage-700 mb-1">Product / Variant</label>
                            <select
                                required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-sage-500 outline-none bg-white"
                                value={formData.variant_id}
                                onChange={e => {
                                    setFormData({ ...formData, variant_id: e.target.value });
                                    // Auto-fill cost price if relevant from variant history?
                                    const v = variants.find(v => v.id === e.target.value);
                                    if (v && v.cost_price) {
                                        setFormData(prev => ({ ...prev, cost_price: v.cost_price || '' }));
                                    }
                                }}
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
                            <label className="block text-sm font-medium text-sage-700 mb-1">Warehouse</label>
                            <select
                                required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-sage-500 outline-none bg-white"
                                value={formData.warehouse_id}
                                onChange={e => setFormData({ ...formData, warehouse_id: e.target.value })}
                            >
                                {warehouses.map(w => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-sage-700 mb-1">Batch Number</label>
                            <div className="relative">
                                <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    required
                                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 focus:ring-2 focus:ring-sage-500 outline-none"
                                    value={formData.batch_number}
                                    onChange={e => setFormData({ ...formData, batch_number: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-sage-700 mb-1">Expiry Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="date"
                                    required
                                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 focus:ring-2 focus:ring-sage-500 outline-none"
                                    value={formData.expiry_date}
                                    onChange={e => setFormData({ ...formData, expiry_date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-sage-700 mb-1">Cost Price (Per Unit)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    min="0"
                                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 focus:ring-2 focus:ring-sage-500 outline-none"
                                    value={formData.cost_price}
                                    onChange={e => setFormData({ ...formData, cost_price: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-sage-700 mb-1">Quantity</label>
                            <input
                                type="number"
                                required
                                min="1"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-sage-500 outline-none"
                                value={formData.quantity}
                                onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-sage-700 mb-1">Reason / PO Ref</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-sage-500 outline-none"
                                value={formData.reason}
                                onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                placeholder="PO-1234 or Purchase"
                            />
                        </div>
                    </div>

                    {/* Summary Card */}
                    {selectedVariant && (
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-4 items-start">
                            <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-blue-800">Summary</h4>
                                <p className="text-sm text-blue-700 mt-1">
                                    You are adding <strong>{formData.quantity || 0}</strong> units of <strong>{selectedVariant.name}</strong> to <strong>Batch {formData.batch_number}</strong>.
                                </p>
                                <p className="text-sm text-blue-700">
                                    Total Value: <strong>₹{((parseFloat(formData.cost_price) || 0) * (parseInt(formData.quantity) || 0)).toFixed(2)}</strong>
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="pt-2 flex gap-3">
                        <Button type="submit" className="flex-1 text-base py-3" disabled={loading}>
                            {loading ? 'Processing...' : 'Confirm Inward Stock'}
                        </Button>
                        <Button type="button" variant="outline" onClick={onClose} className="px-6">Cancel</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BatchInwardModal;
