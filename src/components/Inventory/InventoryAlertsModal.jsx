import React, { useState } from 'react';
import { X, AlertTriangle, Clock, ArrowRight } from 'lucide-react';

const InventoryAlertsModal = ({ isOpen, onClose, lowStockVariants, expiringBatches }) => {
    const [activeTab, setActiveTab] = useState('low_stock');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-sage-100">
                    <h2 className="text-xl font-bold text-sage-900 flex items-center gap-2">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                        Inventory Alerts
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-sage-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-stone-400" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-sage-200">
                    <button
                        onClick={() => setActiveTab('low_stock')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === 'low_stock' ? 'text-red-600 bg-red-50' : 'text-stone-500 hover:text-sage-800'}`}
                    >
                        Low Stock ({lowStockVariants.length})
                        {activeTab === 'low_stock' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab('expiring')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === 'expiring' ? 'text-orange-600 bg-orange-50' : 'text-stone-500 hover:text-sage-800'}`}
                    >
                        Expiring Soon ({expiringBatches.length})
                        {activeTab === 'expiring' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-600"></div>}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'low_stock' && (
                        <div className="space-y-3">
                            {lowStockVariants.length > 0 ? (
                                lowStockVariants.map(variant => (
                                    <div key={variant.id} className="flex items-center justify-between p-3 border border-red-100 bg-red-50/30 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white rounded border border-red-100 flex items-center justify-center text-red-600 font-bold text-sm">
                                                {variant.stock_quantity}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-sage-900">{variant.productName || variant.products?.name}</h4>
                                                <p className="text-xs text-stone-500">{variant.name} (SKU: {variant.sku})</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs text-red-600 font-medium block">Threshold: {variant.min_stock_level || 10}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-stone-500">No low stock alerts.</div>
                            )}
                        </div>
                    )}

                    {activeTab === 'expiring' && (
                        <div className="space-y-3">
                            {expiringBatches.length > 0 ? (
                                expiringBatches.map(batch => {
                                    const expiry = new Date(batch.expiry_date);
                                    const daysLeft = Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24));

                                    return (
                                        <div key={batch.id || batch.batch_number} className="flex items-center justify-between p-3 border border-orange-100 bg-orange-50/30 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <Clock className="w-5 h-5 text-orange-500" />
                                                <div>
                                                    <h4 className="text-sm font-bold text-sage-900">{batch.batch_number}</h4>
                                                    <p className="text-xs text-stone-500">Expires: {expiry.toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-xs font-bold block ${daysLeft < 0 ? 'text-red-600' : 'text-orange-600'}`}>
                                                    {daysLeft < 0 ? 'Expired' : `${daysLeft} Days Left`}
                                                </span>
                                                <span className="text-xs text-stone-500">Qty: {batch.current_quantity}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-8 text-stone-500">No expiring batches found.</div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-sage-100 bg-sage-50 rounded-b-xl flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-white border border-sage-200 text-sage-700 rounded-lg text-sm font-medium hover:bg-sage-100 transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InventoryAlertsModal;
