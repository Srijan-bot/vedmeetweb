import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import Button from './Button';
import { getBundles } from '../lib/data';

import { useCart } from '../context/CartContext';

const ComboSection = () => {
    const [bundles, setBundles] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();

    useEffect(() => {
        const loadBundles = async () => {
            try {
                const data = await getBundles();
                setBundles(data || []);
            } catch (e) {
                console.error("Failed to load bundles", e);
            } finally {
                setLoading(false);
            }
        };
        loadBundles();
    }, []);

    const handleAddBundle = (bundle) => {
        if (!bundle.components || bundle.components.length === 0) return;

        // Calculate total original price of components to determine discount distribution
        const totalOriginalPrice = bundle.components.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
        const totalDiscount = Math.max(0, totalOriginalPrice - parseFloat(bundle.price));

        bundle.components.forEach(item => {
            const itemOriginalPrice = parseFloat(item.price) || 0;
            // Distribute discount proportionally
            const proportionalDiscount = totalOriginalPrice > 0
                ? (itemOriginalPrice / totalOriginalPrice) * totalDiscount
                : 0;

            addToCart({
                id: item.product_id,       // Correct ID for Cart
                variantId: item.variant_id, // Variant ID
                name: item.name,
                image: item.image,
                price: itemOriginalPrice,
                bundle_discount: proportionalDiscount
            }, 1);
        });
    };

    if (loading) return null;
    if (bundles.length === 0) return null;

    return (
        <section className="py-16 bg-earth-50">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center mb-10">
                    <h2 className="text-2xl md:text-3xl font-serif font-bold text-sage-900">Complete Ayurvedic Care Kits</h2>
                    <p className="text-stone-600">Save more when you buy complete wellness solutions</p>
                </div>

                <div className="space-y-12">
                    {bundles.map((bundle) => (
                        <div key={bundle.id} className="max-w-4xl mx-auto bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
                            <div className="flex flex-row items-center justify-center gap-2 md:gap-8 overflow-x-auto pb-4 md:pb-0 scrollbar-hide">
                                {bundle.components && bundle.components.map((item, index) => (
                                    <React.Fragment key={index}>
                                        {index > 0 && (
                                            <div className="flex items-center justify-center text-stone-300 h-20 md:h-32 pt-2 md:pt-0 shrink-0">
                                                <Plus className="w-4 h-4 md:w-6 md:h-6" />
                                            </div>
                                        )}
                                        <div className="flex flex-col items-center min-w-[100px] w-28 md:w-40 shrink-0">
                                            <div className="w-24 h-24 md:w-32 md:h-32 bg-stone-50 rounded-xl mb-3 flex items-center justify-center border border-stone-100 p-2 relative overflow-hidden group">
                                                {item.image && item.image !== 'https://via.placeholder.com/40' ? (
                                                    <img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
                                                ) : (
                                                    <span className="text-xs text-stone-400 text-center px-2">{item.name}</span>
                                                )}
                                            </div>
                                            <span className="text-xs md:text-sm font-medium text-center leading-tight line-clamp-2 text-stone-700 w-full px-1">
                                                {item.name}
                                            </span>
                                        </div>
                                    </React.Fragment>
                                ))}
                            </div>

                            <div className="mt-8 pt-6 border-t border-stone-100 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="text-center md:text-left">
                                    <h3 className="text-xl font-bold text-sage-900">{bundle.name}</h3>
                                    <p className="text-sm text-stone-500 mt-1 max-w-md">{bundle.description}</p>
                                    <div className="flex items-center justify-center md:justify-start gap-3 mt-3">
                                        <span className="text-3xl font-bold text-green-700">₹{bundle.price}</span>
                                        {bundle.original_price > bundle.price && (
                                            <>
                                                <span className="text-lg text-stone-400 line-through">₹{bundle.original_price}</span>
                                                <span className="text-xs font-bold bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                                    Save ₹{bundle.original_price - bundle.price}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    onClick={() => handleAddBundle(bundle)}
                                    className="bg-green-700 hover:bg-green-800 text-white px-8 py-4 rounded-xl w-full md:w-auto text-lg shadow-lg shadow-green-900/10 transition-transform active:scale-95"
                                >
                                    Add Bundle to Cart
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ComboSection;
