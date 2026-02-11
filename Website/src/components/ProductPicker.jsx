import React, { useState, useEffect } from 'react';
import { Search, Package, X, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Button from './Button';

const ProductPicker = ({ onSelect, onClose }) => {
    const [query, setQuery] = useState('');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const searchProducts = async () => {
            if (!query.trim()) {
                setProducts([]);
                return;
            }
            setLoading(true);
            const { data } = await supabase
                .from('products')
                .select('*')
                .ilike('name', `%${query}%`)
                .limit(5);
            setProducts(data || []);
            setLoading(false);
        };

        const debounce = setTimeout(searchProducts, 300);
        return () => clearTimeout(debounce);
    }, [query]);

    return (
        <div className="absolute bottom-16 left-4 w-80 bg-white rounded-xl shadow-xl border border-sage-100 p-4 z-50">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-sage-900 text-sm flex items-center gap-2">
                    <Package className="w-4 h-4" /> Recommend Product
                </h3>
                <button onClick={onClose} className="text-sage-400 hover:text-sage-600">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="relative mb-3">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-400" />
                <input
                    autoFocus
                    type="text"
                    placeholder="Search products..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-saffron-500"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
                {loading && <p className="text-xs text-center text-sage-400">Searching...</p>}
                {!loading && products.length === 0 && query && (
                    <p className="text-xs text-center text-sage-400">No products found</p>
                )}

                {products.map(product => (
                    <div
                        key={product.id}
                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-sage-50 cursor-pointer group transition-colors"
                        onClick={() => onSelect(product)}
                    >
                        {product.image ? (
                            <img src={product.image} alt={product.name} className="w-10 h-10 object-cover rounded" />
                        ) : (
                            <div className="w-10 h-10 bg-sage-100 rounded flex items-center justify-center text-sage-400">
                                <Package className="w-5 h-5" />
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-medium text-sage-900 truncate">{product.name}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs font-bold text-saffron-600">₹{product.disc_price || product.price}</span>
                                {product.stock_status === 'In Stock' ? (
                                    <span className="text-[10px] text-green-600 bg-green-50 px-1 rounded">In Stock</span>
                                ) : (
                                    <span className="text-[10px] text-red-600 bg-red-50 px-1 rounded">Out</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProductPicker;
