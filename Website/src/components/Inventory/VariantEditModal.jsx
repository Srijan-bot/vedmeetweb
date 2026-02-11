import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { updateVariant } from '../../lib/data';
import Button from '../Button';

const VariantEditModal = ({ isOpen, onClose, variant, onSuccess }) => {
    const [formData, setFormData] = useState({
        price: '',
        mrp: '',
        cost_price: '',
        gst_rate: '',
        hsn_code: '',
        min_stock_level: '',
        reorder_quantity: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (variant) {
            setFormData({
                price: variant.price || 0,
                mrp: variant.mrp || 0,
                cost_price: variant.cost_price || 0,
                gst_rate: variant.gst_rate || 18,
                hsn_code: variant.hsn_code || '',
                min_stock_level: variant.min_stock_level || 10,
                reorder_quantity: variant.reorder_quantity || 50
            });
        }
    }, [variant]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateVariant(variant.id, formData);
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Update failed:", error);
            alert("Failed to update variant");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !variant) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="font-bold text-gray-900">Edit Variant Details</h3>
                        <p className="text-xs text-gray-500">{variant.products?.name} - {variant.name}</p>
                    </div>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (₹)</label>
                            <input
                                type="number"
                                required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-saffron-500 outline-none"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">MRP (₹)</label>
                            <input
                                type="number"
                                required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-saffron-500 outline-none"
                                value={formData.mrp}
                                onChange={e => setFormData({ ...formData, mrp: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Standard Cost (₹)</label>
                            <input
                                type="number"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-saffron-500 outline-none"
                                value={formData.cost_price}
                                onChange={e => setFormData({ ...formData, cost_price: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">GST %</label>
                            <select
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-saffron-500 outline-none"
                                value={formData.gst_rate}
                                onChange={e => setFormData({ ...formData, gst_rate: e.target.value })}
                            >
                                <option value="0">0%</option>
                                <option value="5">5%</option>
                                <option value="12">12%</option>
                                <option value="18">18%</option>
                                <option value="28">28%</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">HSN Code</label>
                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-saffron-500 outline-none"
                            value={formData.hsn_code}
                            onChange={e => setFormData({ ...formData, hsn_code: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock Level</label>
                            <input
                                type="number"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-saffron-500 outline-none"
                                value={formData.min_stock_level}
                                onChange={e => setFormData({ ...formData, min_stock_level: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Quantity</label>
                            <input
                                type="number"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-saffron-500 outline-none"
                                value={formData.reorder_quantity}
                                onChange={e => setFormData({ ...formData, reorder_quantity: e.target.value })}
                            />
                        </div>
                        <p className="col-span-2 text-xs text-gray-500 italic">
                            * Stock Quantity cannot be edited directly. Use 'Adjust Stock' or 'Inward Stock'.
                        </p>
                    </div>


                    <div className="pt-2 flex gap-3">
                        <Button type="submit" className="flex-1" disabled={loading} icon={Save}>
                            {loading ? 'Saving...' : 'Update Details'}
                        </Button>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VariantEditModal;
