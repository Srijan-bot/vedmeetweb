import React, { useEffect, useState } from 'react';
import { Tag, Search, Check, X } from 'lucide-react';
import { getProducts, applyOffer, removeOffer } from '../../lib/data';
import Button from '../../components/Button';

const OfferManager = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);
    const [offerPercentage, setOfferPercentage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        const data = await getProducts();
        setProducts(data);
        setLoading(false);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === products.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(products.map(p => p.id));
        }
    };

    const toggleSelect = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(itemId => itemId !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleApplyOffer = async () => {
        if (!offerPercentage || selectedIds.length === 0) return;
        const percentage = parseInt(offerPercentage);
        if (percentage <= 0 || percentage > 100) {
            alert("Please enter a valid percentage (1-100)");
            return;
        }

        if (window.confirm(`Apply ${percentage}% OFF to ${selectedIds.length} products?`)) {
            await applyOffer(selectedIds, percentage);
            fetchProducts();
            setSelectedIds([]);
            setOfferPercentage('');
        }
    };

    const handleRemoveOffer = async () => {
        if (selectedIds.length === 0) return;

        if (window.confirm(`Remove offers from ${selectedIds.length} products?`)) {
            await removeOffer(selectedIds);
            fetchProducts();
            setSelectedIds([]);
        }
    };

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-sage-900">Offer Management</h1>
                    <p className="text-stone-500 text-sm">Select products to apply bulk discounts</p>
                </div>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-sage-200 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-sage-500"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                </div>
            </div>

            {/* Bulk Actions Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-sage-100 mb-6 flex items-center gap-4 sticky top-0 z-10">
                <div className="flex items-center gap-2 border-r border-sage-100 pr-4">
                    <input
                        type="checkbox"
                        checked={selectedIds.length === products.length && products.length > 0}
                        onChange={toggleSelectAll}
                        className="w-5 h-5 rounded text-sage-600 focus:ring-sage-500 border-gray-300"
                    />
                    <span className="text-sm font-medium text-stone-600">{selectedIds.length} Selected</span>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        placeholder="%"
                        value={offerPercentage}
                        onChange={(e) => setOfferPercentage(e.target.value)}
                        className="w-20 px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                    />
                    <Button size="sm" onClick={handleApplyOffer} disabled={selectedIds.length === 0 || !offerPercentage}>
                        Apply Offer
                    </Button>
                    <button
                        onClick={handleRemoveOffer}
                        disabled={selectedIds.length === 0}
                        className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Remove Offer
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-sage-100">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-sage-50 text-sage-900 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="p-4 w-12"></th>
                            <th className="p-4 font-semibold">Product</th>
                            <th className="p-4 font-semibold">Base Price</th>
                            <th className="p-4 font-semibold">Discount</th>
                            <th className="p-4 font-semibold">Final Price</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-sage-100 text-sm">
                        {filteredProducts.map((product) => (
                            <tr key={product.id} className={`hover:bg-sage-50/50 transition-colors ${selectedIds.includes(product.id) ? 'bg-sage-50' : ''}`}>
                                <td className="p-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(product.id)}
                                        onChange={() => toggleSelect(product.id)}
                                        className="w-4 h-4 rounded text-sage-600 focus:ring-sage-500 border-gray-300"
                                    />
                                </td>
                                <td className="p-4 flex items-center gap-3">
                                    <img src={product.image} alt={product.name} className="w-10 h-10 object-cover rounded-md bg-gray-100" />
                                    <span className="font-medium text-stone-800">{product.name}</span>
                                </td>
                                <td className="p-4 text-stone-500">Rs. {product.price.toFixed(2)}</td>
                                <td className="p-4">
                                    {product.discount_percentage ? (
                                        <span className="px-2 py-1 bg-saffron-100 text-saffron-700 rounded-full text-xs font-bold">
                                            {product.discount_percentage}% OFF
                                        </span>
                                    ) : (
                                        <span className="text-stone-400">-</span>
                                    )}
                                </td>
                                <td className="p-4 font-bold text-sage-900">
                                    Rs. {(product.disc_price || product.price).toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OfferManager;
