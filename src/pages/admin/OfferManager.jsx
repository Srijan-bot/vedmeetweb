import React, { useEffect, useState } from 'react';
import { Tag, Search, Check, X, ChevronDown, ChevronRight } from 'lucide-react';
import { getAllVariants, applyVariantOffer, removeVariantOffer } from '../../lib/data';
import Button from '../../components/Button';

const OfferManager = () => {
    const [variants, setVariants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVariantIds, setSelectedVariantIds] = useState([]);
    const [offerPercentage, setOfferPercentage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedProductIds, setExpandedProductIds] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const data = await getAllVariants();
        setVariants(data || []);
        setLoading(false);
    };

    // Group variants by Product
    const getGroupedVariants = () => {
        const groups = {};
        variants.forEach(variant => {
            const prodId = variant.product_id || 'unknown';
            if (!groups[prodId]) {
                groups[prodId] = {
                    product: variant.products || { name: 'Unknown Product', id: 'unknown', image: '' },
                    variants: []
                };
            }
            groups[prodId].variants.push(variant);
        });

        // Convert to array and filter
        return Object.values(groups).filter(group => {
            const term = searchTerm.toLowerCase();
            const prodName = (group.product.name || '').toLowerCase();
            const hasMatchingVariant = group.variants.some(v =>
                (v.name || '').toLowerCase().includes(term) ||
                (v.sku || '').toLowerCase().includes(term)
            );
            return prodName.includes(term) || hasMatchingVariant;
        });
    };

    const groupedVariants = getGroupedVariants();

    const toggleExpand = (prodId) => {
        setExpandedProductIds(prev =>
            prev.includes(prodId) ? prev.filter(id => id !== prodId) : [...prev, prodId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedVariantIds.length === variants.length) {
            setSelectedVariantIds([]);
        } else {
            setSelectedVariantIds(variants.map(v => v.id));
        }
    };

    const toggleSelectVariant = (id) => {
        if (selectedVariantIds.includes(id)) {
            setSelectedVariantIds(selectedVariantIds.filter(itemId => itemId !== id));
        } else {
            setSelectedVariantIds([...selectedVariantIds, id]);
        }
    };

    const toggleSelectProduct = (prodId, groupVariants) => {
        const groupVariantIds = groupVariants.map(v => v.id);
        const allSelected = groupVariantIds.every(id => selectedVariantIds.includes(id));

        if (allSelected) {
            // Deselect all for this product
            setSelectedVariantIds(prev => prev.filter(id => !groupVariantIds.includes(id)));
        } else {
            // Select all for this product
            const newIds = [...selectedVariantIds];
            groupVariantIds.forEach(id => {
                if (!newIds.includes(id)) newIds.push(id);
            });
            setSelectedVariantIds(newIds);
        }
    };

    const handleApplyOffer = async () => {
        if (!offerPercentage || selectedVariantIds.length === 0) return;
        const percentage = parseInt(offerPercentage);
        if (percentage <= 0 || percentage > 100) {
            alert("Please enter a valid percentage (1-100)");
            return;
        }

        if (window.confirm(`Apply ${percentage}% OFF to ${selectedVariantIds.length} variants?`)) {
            await applyVariantOffer(selectedVariantIds, percentage);
            fetchData();
            setSelectedVariantIds([]);
            setOfferPercentage('');
        }
    };

    const handleRemoveOffer = async () => {
        if (selectedVariantIds.length === 0) return;

        if (window.confirm(`Remove offers from ${selectedVariantIds.length} variants?`)) {
            await removeVariantOffer(selectedVariantIds);
            fetchData();
            setSelectedVariantIds([]);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-sage-900">Offer Management</h1>
                    <p className="text-stone-500 text-sm">Select variants to apply bulk discounts</p>
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
                        checked={selectedVariantIds.length === variants.length && variants.length > 0}
                        onChange={toggleSelectAll}
                        className="w-5 h-5 rounded text-sage-600 focus:ring-sage-500 border-gray-300"
                    />
                    <span className="text-sm font-medium text-stone-600">{selectedVariantIds.length} Selected</span>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        placeholder="%"
                        value={offerPercentage}
                        onChange={(e) => setOfferPercentage(e.target.value)}
                        className="w-20 px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                    />
                    <Button size="sm" onClick={handleApplyOffer} disabled={selectedVariantIds.length === 0 || !offerPercentage}>
                        Apply Offer
                    </Button>
                    <button
                        onClick={handleRemoveOffer}
                        disabled={selectedVariantIds.length === 0}
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
                            <th className="p-4 w-12"></th>
                            <th className="p-4 font-semibold">Product / Variant</th>
                            <th className="p-4 font-semibold">Price</th>
                            <th className="p-4 font-semibold">Discount</th>
                            <th className="p-4 font-semibold">Final Price</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-sage-100 text-sm">
                        {groupedVariants.map((group) => {
                            const { product, variants: groupVariants } = group;
                            const isExpanded = expandedProductIds.includes(product.id || 'unknown');
                            const allGroupSelected = groupVariants.every(v => selectedVariantIds.includes(v.id));
                            const someGroupSelected = groupVariants.some(v => selectedVariantIds.includes(v.id));

                            return (
                                <React.Fragment key={product.id || 'unknown'}>
                                    {/* Parent Product Row */}
                                    <tr className="bg-sage-50/50 hover:bg-sage-100 transition-colors">
                                        <td className="p-4">
                                            <input
                                                type="checkbox"
                                                checked={allGroupSelected}
                                                ref={el => el && (el.indeterminate = someGroupSelected && !allGroupSelected)}
                                                onChange={() => toggleSelectProduct(product.id, groupVariants)}
                                                className="w-4 h-4 rounded text-sage-600 focus:ring-sage-500 border-gray-300"
                                            />
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => toggleExpand(product.id)}
                                                className="p-1 hover:bg-sage-200 rounded text-sage-500"
                                            >
                                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                            </button>
                                        </td>
                                        <td className="p-4 flex items-center gap-3">
                                            <img src={product.image} alt={product.name} className="w-8 h-8 object-cover rounded bg-gray-100" />
                                            <span className="font-bold text-sage-900">{product.name}</span>
                                            <span className="text-xs text-stone-500">({groupVariants.length} variants)</span>
                                        </td>
                                        <td className="p-4" colSpan="3"></td>
                                    </tr>

                                    {/* Child Variant Rows */}
                                    {isExpanded && groupVariants.map(variant => (
                                        <tr key={variant.id} className={`hover:bg-sage-50 transition-colors ${selectedVariantIds.includes(variant.id) ? 'bg-sage-50' : ''}`}>
                                            <td className="p-4"></td> {/* Indent checkbox column */}
                                            <td className="p-4 flex justify-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedVariantIds.includes(variant.id)}
                                                    onChange={() => toggleSelectVariant(variant.id)}
                                                    className="w-4 h-4 rounded text-sage-600 focus:ring-sage-500 border-gray-300"
                                                />
                                            </td>
                                            <td className="p-4 pl-12">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-stone-700">{variant.name}</span>
                                                    <span className="text-xs text-stone-400 font-mono">{variant.sku}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-stone-500">₹{variant.price}</td>
                                            <td className="p-4">
                                                {variant.discount_percentage > 0 ? (
                                                    <span className="px-2 py-1 bg-saffron-100 text-saffron-700 rounded-full text-xs font-bold">
                                                        {variant.discount_percentage}% OFF
                                                    </span>
                                                ) : (
                                                    <span className="text-stone-300">-</span>
                                                )}
                                            </td>
                                            <td className="p-4 font-bold text-sage-900">
                                                ₹{(variant.disc_price || variant.price).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OfferManager;
