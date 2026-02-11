import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { getProducts, getTrendingProducts } from '../lib/data';
import Button from './Button';
import { useCart } from '../context/CartContext';

const ProductRecommendations = ({ title = "You May Also Like", currentProductId, category, concern, limit = 4 }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();

    useEffect(() => {
        const fetchRecommendations = async () => {
            setLoading(true);

            let allProducts = [];
            let recommended = [];

            // Strategy: 
            // 1. If category/concern provided, filter from all products.
            // 2. Else if currentProductId provided, try to find similar (this step needs full list).
            // 3. Fallback to Trending.

            if (category || concern || currentProductId) {
                allProducts = await getProducts();

                let pool = allProducts;

                // Filter out current product
                if (currentProductId) {
                    pool = pool.filter(p => String(p.id) !== String(currentProductId));
                }

                // Filter by Category
                if (category) {
                    const catMatches = pool.filter(p => {
                        const pCats = Array.isArray(p.category) ? p.category : (typeof p.category === 'string' ? p.category.split(',') : []);
                        return pCats.some(c => category.includes(c) || c === category);
                    });
                    if (catMatches.length > 0) recommended = catMatches;
                }

                // Filter by Concern (if needed or if category didn't yield enough)
                if (concern && recommended.length < limit) {
                    const conMatches = pool.filter(p => {
                        const pCons = Array.isArray(p.concern) ? p.concern : (typeof p.concern === 'string' ? p.concern.split(',') : []);
                        return pCons.some(c => concern.includes(c) || c === concern);
                    });
                    // Append unique
                    const existingIds = new Set(recommended.map(p => p.id));
                    const newMatches = conMatches.filter(p => !existingIds.has(p.id));
                    recommended = [...recommended, ...newMatches];
                }

                // If still not enough, fill with random or trending
                if (recommended.length < limit) {
                    // Basic Shuffle
                    const shuffled = pool.sort(() => 0.5 - Math.random());
                    const existingIds = new Set(recommended.map(p => p.id));
                    const fillers = shuffled.filter(p => !existingIds.has(p.id)).slice(0, limit - recommended.length);
                    recommended = [...recommended, ...fillers];
                }

            } else {
                // Default to Trending
                recommended = await getTrendingProducts(limit);
            }

            setProducts(recommended.slice(0, limit));
            setLoading(false);
        };

        fetchRecommendations();
    }, [currentProductId, category, concern, limit]);

    if (!loading && products.length === 0) return null;

    return (
        <div className="py-12">
            <h2 className="text-2xl font-serif font-bold text-sage-900 mb-6">{title}</h2>

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="aspect-[3/4] bg-stone-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {products.map(product => (
                        <div key={product.id} className="bg-white rounded-xl border border-stone-100 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col">
                            <Link to={`/product/${product.id}`} className="relative aspect-[3/4] bg-gray-100 block overflow-hidden">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                {product.rating > 0 && (
                                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-1.5 py-0.5 rounded text-[10px] font-bold text-sage-900 flex items-center gap-1">
                                        <Star className="w-3 h-3 fill-saffron-400 text-saffron-400" />
                                        {product.rating}
                                    </div>
                                )}
                            </Link>

                            <div className="p-3 flex-1 flex flex-col">
                                <Link to={`/product/${product.id}`} className="block">
                                    <h3 className="font-serif font-bold text-sage-900 text-sm leading-tight mb-1 hover:text-sage-700 line-clamp-2 min-h-[2.5em]">
                                        {product.name}
                                    </h3>
                                </Link>
                                <div className="text-[10px] text-stone-500 mb-2 truncate">{product.brand}</div>

                                <div className="mt-auto pt-2 border-t border-stone-50 flex items-center justify-between gap-2">
                                    <div className="font-bold text-sage-900 text-sm">₹{product.disc_price || product.price}</div>
                                    <button
                                        onClick={() => addToCart(product)}
                                        className="p-1.5 bg-sage-100 text-sage-700 rounded-lg hover:bg-sage-600 hover:text-white transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProductRecommendations;
