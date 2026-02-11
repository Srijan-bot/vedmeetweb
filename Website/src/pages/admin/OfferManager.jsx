import React, { useEffect, useState } from 'react';
import { Tag, Search, Check, X, ChevronDown, ChevronRight } from 'lucide-react';
import { getAllVariants, applyVariantOffer, removeVariantOffer, syncAllProductOffers, createBundle, getBundles, deleteBundle } from '../../lib/data';
import Button from '../../components/Button';

const OfferManager = () => {
    const [variants, setVariants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVariantIds, setSelectedVariantIds] = useState([]);
    const [offerPercentage, setOfferPercentage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedProductIds, setExpandedProductIds] = useState([]);

    // Bundle State
    const [activeTab, setActiveTab] = useState('variants');
    const [bundles, setBundles] = useState([]);
    const [bundleName, setBundleName] = useState('');
    const [bundlePrice, setBundlePrice] = useState('');
    const [bundleDesc, setBundleDesc] = useState('');

    useEffect(() => {
        fetchData();
        fetchBundles();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const data = await getAllVariants();
        setVariants(data || []);
        setLoading(false);
    };

    const fetchBundles = async () => {
        const data = await getBundles();
        setBundles(data || []);
    };

    // Helper to group variants by product
    const getGroupedVariants = (variantList) => {
        const groups = {};
        variantList.forEach(variant => {
            const prodId = variant.product_id || 'unknown';
            if (!groups[prodId]) {
                groups[prodId] = {
                    product: variant.products || { name: 'Unknown Product', id: 'unknown', image: '' },
                    variants: []
                };
            }
            groups[prodId].variants.push(variant);
        });

        // Filter groups based on search
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

    const groupedVariants = getGroupedVariants(variants);
    const variantsWithOffers = variants.filter(v => v.discount_percentage > 0);
    const variantsNoOffers = variants.filter(v => !v.discount_percentage || v.discount_percentage === 0);

    const groupedWithOffers = getGroupedVariants(variantsWithOffers);
    const groupedNoOffers = getGroupedVariants(variantsNoOffers);

    const toggleExpand = (prodId) => {
        setExpandedProductIds(prev =>
            prev.includes(prodId) ? prev.filter(id => id !== prodId) : [...prev, prodId]
        );
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
            setSelectedVariantIds(prev => prev.filter(id => !groupVariantIds.includes(id)));
        } else {
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
        if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
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

    const handleSyncOffers = async () => {
        if (window.confirm("This will check all products and update their discount status to match their variants. Continue?")) {
            setLoading(true);
            const result = await syncAllProductOffers();
            setLoading(false);
            if (result.success) {
                alert(`Synced offers for ${result.count} products.`);
                fetchData();
            } else {
                alert("Failed to sync offers. Check console.");
            }
        }
    };

    // --- Bundle Handlers ---
    const handleCreateBundle = async () => {
        if (!bundleName || !bundlePrice || selectedVariantIds.length < 2) {
            alert("Please select at least 2 items, provide a name and price.");
            return;
        }

        const selectedItems = variants.filter(v => selectedVariantIds.includes(v.id)).map(v => ({
            variant_id: v.id,
            product_id: v.product_id,
            name: v.name,
            image: v.products?.image || 'https://via.placeholder.com/40',
            price: v.price
        }));

        const originalPrice = selectedItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);

        try {
            await createBundle({
                name: bundleName,
                description: bundleDesc,
                price: parseFloat(bundlePrice),
                original_price: originalPrice,
                components: selectedItems,
                active: true
            });
            alert("Bundle created successfully!");
            fetchBundles();
            setBundleName('');
            setBundlePrice('');
            setBundleDesc('');
            setSelectedVariantIds([]);
        } catch (error) {
            console.error(error);
            alert("Failed to create user bundle: " + error.message);
        }
    };

    const handleDeleteBundle = async (id) => {
        if (window.confirm("Delete this bundle?")) {
            await deleteBundle(id);
            fetchBundles();
        }
    };

    if (loading) return <div>Loading...</div>;

    const RenderTable = ({ groupedData, title, emptyMessage }) => (
        <div className="mb-12">
            <h2 className="text-xl font-bold text-sage-900 mb-4 flex items-center gap-2">
                {title}
                <span className="text-sm font-normal text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                    {groupedData.reduce((acc, g) => acc + g.variants.length, 0)} variants
                </span>
            </h2>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-sage-100">
                {groupedData.length === 0 ? (
                    <div className="p-8 text-center text-stone-500 italic">{emptyMessage}</div>
                ) : (
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
                            {groupedData.map((group) => {
                                const { product, variants: groupVariants } = group;
                                const isExpanded = expandedProductIds.includes(product.id || 'unknown');
                                // Determine header checkbox state for this product group
                                const groupVariantIds = groupVariants.map(v => v.id);
                                const allGroupSelected = groupVariantIds.every(id => selectedVariantIds.includes(id));
                                const someGroupSelected = groupVariantIds.some(id => selectedVariantIds.includes(id));

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
                                                <img src={product.image || 'https://via.placeholder.com/40'} alt={product.name} className="w-8 h-8 object-cover rounded bg-gray-100" />
                                                <span className="font-bold text-sage-900">{product.name}</span>
                                                <span className="text-xs text-stone-500">({groupVariants.length})</span>
                                            </td>
                                            <td className="p-4" colSpan="3"></td>
                                        </tr>

                                        {/* Child Variant Rows */}
                                        {isExpanded && groupVariants.map(variant => (
                                            <tr key={variant.id} className={`hover:bg-sage-50 transition-colors ${selectedVariantIds.includes(variant.id) ? 'bg-sage-50' : ''}`}>
                                                <td className="p-4"></td>
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
                                                    ₹{Number(variant.disc_price || variant.price).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );

    return (
        <div className="p-6 bg-white rounded-lg shadow-sm border border-stone-200">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-serif font-bold text-sage-900">Offer & Bundle Manager</h1>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-stone-200 mb-6">
                <button
                    className={`pb-2 px-4 font-medium transition-colors ${activeTab === 'variants' ? 'text-sage-900 border-b-2 border-sage-900' : 'text-stone-500 hover:text-sage-700'}`}
                    onClick={() => setActiveTab('variants')}
                >
                    Variant Offers
                </button>
                <button
                    className={`pb-2 px-4 font-medium transition-colors ${activeTab === 'bundles' ? 'text-sage-900 border-b-2 border-sage-900' : 'text-stone-500 hover:text-sage-700'}`}
                    onClick={() => setActiveTab('bundles')}
                >
                    Combo Bundles
                </button>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-start md:items-center">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-sage-500"
                    />
                </div>

                {activeTab === 'variants' ? (
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-32">
                            <input
                                type="number"
                                placeholder="%"
                                value={offerPercentage}
                                onChange={(e) => setOfferPercentage(e.target.value)}
                                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-sage-500"
                                min="1"
                                max="100"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">%</span>
                        </div>
                        <Button size="sm" onClick={handleApplyOffer} disabled={selectedVariantIds.length === 0 || !offerPercentage}>
                            Apply Offer
                        </Button>
                        <button
                            onClick={handleSyncOffers}
                            className="px-4 py-2 text-sm font-medium text-sage-600 hover:bg-sage-50 rounded-md transition-colors border border-sage-200"
                        >
                            Sync Offers
                        </button>
                        <button
                            onClick={handleRemoveOffer}
                            disabled={selectedVariantIds.length === 0}
                            className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Remove
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-stone-500 bg-stone-100 px-3 py-1 rounded-full">
                            {selectedVariantIds.length} items selected
                        </span>
                        {selectedVariantIds.length > 0 && (
                            <button
                                onClick={() => setSelectedVariantIds([])}
                                className="text-xs text-stone-400 hover:text-stone-600 underline"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* TAB CONTENT */}
            {activeTab === 'variants' ? (
                <>
                    <RenderTable
                        groupedData={groupedWithOffers}
                        title="Active Offers"
                        emptyMessage="No active offers found."
                    />
                    <RenderTable
                        groupedData={groupedNoOffers}
                        title="Available for Offer"
                        emptyMessage="No pending products found."
                    />
                </>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Bundle Creation Form */}
                    <div className="lg:col-span-1 space-y-4 bg-stone-50 p-6 rounded-xl h-fit sticky top-4 border border-stone-100">
                        <h3 className="font-bold text-lg text-sage-900 border-b border-stone-200 pb-2 mb-4">Create Bundle</h3>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Bundle Name</label>
                            <input
                                type="text"
                                value={bundleName} onChange={e => setBundleName(e.target.value)}
                                className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                                placeholder="e.g. Immunity Kit"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
                            <textarea
                                value={bundleDesc} onChange={e => setBundleDesc(e.target.value)}
                                className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                                placeholder="Short description..."
                                rows="2"
                            />
                        </div>

                        <div className="bg-white p-4 rounded-lg border border-stone-200">
                            <div className="text-sm text-stone-500 mb-1">Selected Items ({selectedVariantIds.length})</div>
                            <div className="text-xs text-stone-400 mb-2">
                                Original Total: ₹{variants.filter(v => selectedVariantIds.includes(v.id)).reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0).toFixed(2)}
                            </div>

                            <label className="block text-sm font-medium text-stone-700 mb-1">Bundle Price</label>
                            <input
                                type="number"
                                value={bundlePrice} onChange={e => setBundlePrice(e.target.value)}
                                className="w-full px-3 py-2 border border-green-200 rounded-lg font-bold text-green-700"
                                placeholder="₹ 0.00"
                            />
                        </div>

                        <Button onClick={handleCreateBundle} disabled={selectedVariantIds.length < 2 || !bundleName || !bundlePrice} className="w-full">
                            Create Bundle
                        </Button>
                    </div>

                    {/* Product Selection for Bundle */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 mb-2 flex items-center gap-2 border border-blue-100">
                            <Check className="w-4 h-4" />
                            Select items from the list below to add to your bundle.
                        </div>

                        {/* Reuse Variant Listing logic but simplified for selection */}
                        {groupedVariants.map((group) => (
                            <div key={group.product.id || 'unknown'} className="border border-stone-100 rounded-xl overflow-hidden">
                                <div className="bg-stone-50 px-4 py-2 flex items-center justify-between">
                                    <h3 className="font-bold text-sage-900 text-sm">{group.product.name}</h3>
                                </div>
                                <div className="divide-y divide-stone-100">
                                    {group.variants.map(variant => (
                                        <div key={variant.id}
                                            onClick={() => toggleSelectVariant(variant.id)}
                                            className={`px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-stone-50 transition-colors ${selectedVariantIds.includes(variant.id) ? 'bg-blue-50' : 'bg-white'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedVariantIds.includes(variant.id)}
                                                    onChange={() => { }} // handled by div click
                                                    className="rounded border-stone-300 text-sage-600"
                                                />
                                                <span className="text-sm text-stone-700">{variant.name}</span>
                                            </div>
                                            <span className="text-sm font-medium text-stone-900">₹{variant.price}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Active Bundles List */}
                    <div className="lg:col-span-3 mt-8 pt-8 border-t border-stone-200">
                        <h2 className="text-xl font-bold text-sage-900 mb-4">Active Bundles</h2>
                        {bundles.length === 0 ? (
                            <p className="text-stone-500 italic">No bundles created yet.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {bundles.map(bundle => (
                                    <div key={bundle.id} className="border border-stone-200 rounded-xl p-4 flex justify-between items-start bg-stone-50">
                                        <div>
                                            <h3 className="font-bold text-sage-900">{bundle.name}</h3>
                                            <p className="text-sm text-stone-500 mb-2">{bundle.description}</p>
                                            <div className="flex gap-2 items-baseline">
                                                <span className="font-bold text-green-700">₹{bundle.price}</span>
                                                <span className="text-xs text-stone-400 line-through">₹{bundle.original_price}</span>
                                            </div>
                                            <div className="mt-2 text-xs text-stone-500">
                                                <span className="font-semibold">Contains:</span> {bundle.components?.map(c => c.name).join(', ')}
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteBundle(bundle.id)} className="text-red-500 hover:text-red-700 p-1 bg-white border border-stone-200 rounded shadow-sm">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default OfferManager;
