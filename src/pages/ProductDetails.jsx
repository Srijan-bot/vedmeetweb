import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Truck, ShieldCheck, Leaf, Heart, MessageCircle, ChevronDown, Droplet, Sun, Wind, Activity, Zap, Moon, ShoppingCart } from 'lucide-react';
import Button from '../components/Button';
import { getProduct, getCategories, getBrandByName } from '../lib/data';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';

import logoShort from '../assets/logo-short.svg';

const ProductDetails = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [categories, setCategories] = useState([]);
    const [brandDetails, setBrandDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState('description');
    const [selectedImage, setSelectedImage] = useState(null);
    const { addToCart } = useCart();

    useEffect(() => {
        const loadProduct = async () => {
            // Load product and categories in parallel
            const [productData, categoriesData] = await Promise.all([
                getProduct(id),
                getCategories()
            ]);
            setProduct(productData);
            setSelectedImage(productData.image);
            setCategories(categoriesData);

            // Fetch brand details if brand exists
            if (productData.brand) {
                const brandData = await getBrandByName(productData.brand);
                setBrandDetails(brandData);
            }

            setLoading(false);
        };
        loadProduct();
    }, [id]);

    const normalizeToArray = (value) => {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') {
            if (value.startsWith('{') && value.endsWith('}')) {
                return value.slice(1, -1).split(',').map(s => s.trim().replace(/"/g, ''));
            }
            if (value.startsWith('[') && value.endsWith(']')) {
                try { return JSON.parse(value); } catch (e) { }
            }
            if (value.includes(',')) return value.split(',').map(s => s.trim());
            return [value];
        }
        return [];
    };

    // Helper to parse benefits/ingredients into structured data
    const parseList = (text) => {
        if (!text) return [];
        return text.split(/[\n,•]+/).map(item => item.trim()).filter(Boolean);
    };



    if (loading) {
        return (
            <div className="min-h-screen bg-[#FAFAF9]">
                <div className="container mx-auto px-4 md:px-6 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 lg:gap-20 mb-20 animate-pulse">
                        {/* Image Skeleton */}
                        <div className="md:col-span-6 lg:col-span-7">
                            <div className="aspect-[4/5] md:aspect-square lg:aspect-[4/3] bg-gray-200 rounded-3xl"></div>
                            <div className="flex gap-4 mt-6">
                                {[1, 2, 3].map(i => <div key={i} className="w-20 h-20 bg-gray-200 rounded-xl"></div>)}
                            </div>
                        </div>
                        {/* Content Skeleton */}
                        <div className="md:col-span-6 lg:col-span-5 space-y-6">
                            <div className="w-1/3 h-4 bg-gray-200 rounded"></div>
                            <div className="w-3/4 h-12 bg-gray-200 rounded"></div>
                            <div className="w-1/2 h-6 bg-gray-200 rounded"></div>
                            <div className="space-y-3">
                                <div className="w-full h-4 bg-gray-200 rounded"></div>
                                <div className="w-full h-4 bg-gray-200 rounded"></div>
                                <div className="w-2/3 h-4 bg-gray-200 rounded"></div>
                            </div>
                            <div className="w-full h-32 bg-gray-200 rounded-3xl mt-8"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h2 className="text-2xl font-serif font-bold text-sage-900 mb-4">Product not found</h2>
                <Link to="/shop">
                    <Button>Back to Shop</Button>
                </Link>
            </div>
        );
    }

    const benefitsList = parseList(product.benefits);
    const ingredientsList = parseList(product.ingredients);

    // Mock generic icons/data for ingredients to make them look good immediately
    // In a real app, this would come from a rich database or CMS
    const getIngredientMeta = (name) => {
        const n = name.toLowerCase();
        if (n.includes('ashwagandha')) return { icon: <Activity className="w-6 h-6" />, benefit: 'Stress Relief' };
        if (n.includes('amla') || n.includes('gooseberry')) return { icon: <Zap className="w-6 h-6" />, benefit: 'Vitamin C Boost' };
        if (n.includes('turmeric') || n.includes('haldi')) return { icon: <Sun className="w-6 h-6" />, benefit: 'Anti-inflammatory' };
        if (n.includes('brahmi')) return { icon: <Wind className="w-6 h-6" />, benefit: 'Brain Health' };
        if (n.includes('tulsi')) return { icon: <Leaf className="w-6 h-6" />, benefit: 'Immunity' };
        return { icon: <Leaf className="w-6 h-6" />, benefit: 'Vitality' };
    };




    return (
        <div className="min-h-screen bg-[#FAFAF9]"> {/* Warm light background */}
            <div className="container mx-auto px-4 md:px-6 py-8">
                {/* Breadcrumbs - Minimalist */}
                <nav className="text-xs font-medium text-stone-400 mb-6 flex items-center gap-2 uppercase tracking-widest">
                    <Link to="/" className="hover:text-sage-800 transition-colors">Home</Link>
                    <span>/</span>
                    <Link to="/shop" className="hover:text-sage-800 transition-colors">Shop</Link>
                    <span>/</span>
                    <span className="text-sage-800">{product.name}</span>
                </nav>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 lg:gap-20 mb-20">
                    {/* Left Column: Images (Large focus) */}
                    <div className="md:col-span-6 lg:col-span-7 space-y-6">
                        <div className="relative aspect-[4/5] md:aspect-square lg:aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl shadow-sage-200/50 group">
                            <img
                                src={selectedImage || product.image}
                                alt={product.name}
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                            />

                            {/* Floating Badges */}
                            <div className="absolute top-6 left-6 flex flex-col gap-3">
                                <div className="bg-white/90 backdrop-blur-md text-sage-900 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm border border-white/50">
                                    <Leaf size={14} className="text-sage-600" /> 100% Natural
                                </div>
                            </div>
                        </div>

                        {/* Thumbnails Gallery */}
                        {product.images && product.images.length > 0 && (
                            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                                <button
                                    onClick={() => setSelectedImage(product.image)}
                                    className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === product.image ? 'border-sage-900 ring-2 ring-sage-200' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                >
                                    <img src={product.image} alt="Main" className="w-full h-full object-cover" />
                                </button>
                                {product.images.map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedImage(img)}
                                        className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === img ? 'border-sage-900 ring-2 ring-sage-200' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                    >
                                        <img src={img} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Product Info */}
                    <div className="md:col-span-6 lg:col-span-5 flex flex-col justify-center">
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                {normalizeToArray(product.category).map(id => {
                                    const catName = categories.find(c => c.id === id)?.name || id;
                                    return (
                                        <span key={id} className="text-xs font-bold tracking-widest uppercase text-saffron-600 bg-saffron-50 px-2 py-1 rounded">
                                            {catName}
                                        </span>
                                    );
                                })}
                            </div>

                            <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-medium text-sage-900 mb-2 leading-[1.1] tracking-tight">
                                {product.name}
                            </h1>
                            <div className="text-sm font-bold uppercase tracking-widest text-sage-500 mb-6">
                                {product.brand ? `By ${product.brand}` : 'By Vedmeet'}
                            </div>

                            {/* Rating */}
                            <div className="flex items-center gap-4 mb-8">
                                <div className="flex gap-0.5 text-saffron-400">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={18} className={i < Math.round(product.rating || 0) ? "fill-current" : "text-gray-200"} />
                                    ))}
                                </div>
                                <span className="text-sm text-stone-500 font-medium">
                                    {product.rating ? product.rating.toFixed(1) : "0.0"} ({product.reviews || 0} reviews)
                                </span>
                            </div>

                            <p className="text-stone-600 leading-relaxed text-lg mb-8 font-light">
                                {product.meta_description || product.description}
                            </p>

                            {/* Benefits/Highlights Row */}
                            <div className="flex flex-wrap gap-3 mb-10">
                                {benefitsList.slice(0, 3).map((benefit, i) => (
                                    <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-100 text-stone-600 text-xs font-bold uppercase tracking-wide">
                                        <ShieldCheck size={14} />
                                        {benefit.replace(/^[•-]\s*/, '').split(' ').slice(0, 2).join(' ')}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Price & Action Area */}
                        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-sage-100/50 border border-sage-50">
                            <div className="flex items-end justify-between mb-8">
                                <div>
                                    <span className="text-sm text-stone-400 font-medium mb-1 block">Price</span>
                                    {product.discount_percentage > 0 ? (
                                        <div className="flex items-baseline gap-3">
                                            <span className="text-4xl font-serif text-sage-900">₹{product.disc_price.toFixed(2)}</span>
                                            <span className="text-lg text-stone-400 line-through font-serif">₹{product.price.toFixed(2)}</span>
                                            <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full">-{product.discount_percentage}%</span>
                                        </div>
                                    ) : (
                                        <span className="text-4xl font-serif text-sage-900">₹{product.price.toFixed(2)}</span>
                                    )}
                                </div>
                                <div className={`text-sm font-bold px-3 py-1 rounded-full ${product.stock_status === 'Out of Stock' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                                    {product.stock_status || 'In Stock'}
                                </div>
                            </div>

                            {product.stock_status !== 'Out of Stock' && (
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <div className="flex items-center border border-stone-200 rounded-xl bg-stone-50 h-14">
                                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-full flex items-center justify-center text-stone-500 hover:text-sage-900 transition-colors text-xl">-</button>
                                            <span className="w-10 text-center font-bold text-sage-900 text-lg">{quantity}</span>
                                            <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-full flex items-center justify-center text-stone-500 hover:text-sage-900 transition-colors text-xl">+</button>
                                        </div>
                                        <Button
                                            className="flex-1 h-14 bg-sage-900 hover:bg-sage-800 text-white rounded-xl shadow-lg shadow-sage-900/20 text-lg font-medium tracking-wide transition-all hover:-translate-y-0.5 flex items-center justify-center"
                                            onClick={() => addToCart(product, quantity)}
                                        >
                                            <ShoppingCart className="w-6 h-6" />
                                        </Button>
                                    </div>
                                    <p className="text-xs text-center text-stone-400">Free shipping on orders above ₹999</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Section Diagram / Split */}
                <div className="relative mb-24">
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-transparent via-sage-200 to-transparent"></div>
                    <div className="relative max-w-fit mx-auto bg-[#FAFAF9] px-6">
                        <img src={logoShort} alt="Divider" className="w-32 h-32 opacity-50" />
                    </div>
                </div>



                {/* Tabs Interface */}
                <div className="max-w-4xl mx-auto mb-24">
                    {/* Tab Buttons */}
                    {/* Tab Buttons (Underline Style) */}
                    <div className="flex items-center gap-6 md:gap-8 mb-8 border-b border-sage-100 overflow-x-auto no-scrollbar">
                        {[
                            { id: 'description', label: 'Description' },
                            { id: 'ingredients', label: 'Ingredients' },
                            { id: 'specifications', label: 'Specs' },
                            { id: 'benefits', label: 'Benefits' },
                            { id: 'usage', label: 'Usage' },
                            { id: 'reviews', label: `Reviews (${product.reviews || 0})` },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative pb-4 text-sm md:text-base font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${activeTab === tab.id
                                    ? 'text-sage-900'
                                    : 'text-sage-400 hover:text-sage-700'
                                    }`}
                            >
                                {tab.label}
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-sage-900"
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-sage-100/50 border border-sage-50 min-h-[300px]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                            >
                                {activeTab === 'description' && (
                                    <div>
                                        <div
                                            className="text-stone-600 leading-relaxed text-lg mb-8 prose prose-stone max-w-none prose-headings:font-serif prose-headings:text-sage-900 prose-a:text-saffron-600"
                                            dangerouslySetInnerHTML={{ __html: product.description }}
                                        />

                                        {brandDetails && (
                                            <div className="bg-sage-50 p-6 rounded-2xl border border-sage-100 mt-8">
                                                <div className="flex items-start gap-4">
                                                    {brandDetails.logo && (
                                                        <img src={brandDetails.logo} alt={brandDetails.name} className="w-16 h-16 object-contain bg-white rounded-lg p-1" />
                                                    )}
                                                    <div>
                                                        <h3 className="font-serif font-bold text-xl text-sage-900 mb-2">About {brandDetails.name}</h3>
                                                        <p className="text-stone-600 text-sm leading-relaxed">
                                                            {brandDetails.description || `Discover more about ${brandDetails.name}.`}
                                                        </p>
                                                        {brandDetails.origin_country && (
                                                            <p className="text-xs text-sage-500 mt-2 font-bold uppercase tracking-wider">Origin: {brandDetails.origin_country}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'ingredients' && (
                                    <div className="prose prose-stone max-w-none">
                                        <p className="text-stone-600 leading-relaxed text-lg mb-6">
                                            {product.ingredients}
                                        </p>
                                        {/* Tag Cloud for ingredients */}
                                        <div className="flex flex-wrap gap-2 mt-4">
                                            {ingredientsList.map((ing, i) => (
                                                <span key={i} className="inline-block bg-sage-50 text-sage-800 text-xs font-bold px-3 py-1 rounded-full border border-sage-100">
                                                    {ing.replace(/^[•-]\s*/, '')}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'specifications' && (
                                    <div>
                                        <h3 className="font-serif font-bold text-xl text-sage-900 mb-4">Product Specifications</h3>
                                        <div className="bg-stone-50 rounded-xl p-6 border border-stone-100">
                                            {product.specifications ? (
                                                <ul className="space-y-3">
                                                    {product.specifications.split('\n').map((line, i) => {
                                                        const [label, ...value] = line.split(':');
                                                        if (value.length > 0) {
                                                            return (
                                                                <li key={i} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 border-b border-stone-200 last:border-0 pb-2 last:pb-0">
                                                                    <span className="text-stone-500 text-sm font-medium w-32 shrink-0">{label.trim()}</span>
                                                                    <span className="text-sage-900 font-medium">{value.join(':').trim()}</span>
                                                                </li>
                                                            );
                                                        }
                                                        return (
                                                            <li key={i} className="text-stone-700">{line}</li>
                                                        );
                                                    })}
                                                </ul>
                                            ) : (
                                                <p className="text-stone-500 italic">No specifications available.</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'benefits' && (
                                    <div>
                                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {benefitsList.map((benefit, i) => (
                                                <li key={i} className="flex items-start gap-3 bg-stone-50 p-4 rounded-xl">
                                                    <div className="mt-1 text-saffron-500">
                                                        <ShieldCheck className="w-5 h-5" />
                                                    </div>
                                                    <span className="text-stone-700 font-medium">{benefit.replace(/^[•-]\s*/, '')}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        {benefitsList.length === 0 && <p className="text-stone-500 italic">No specific benefits details available.</p>}
                                    </div>
                                )}

                                {activeTab === 'usage' && (
                                    <div className="flex items-start gap-6">
                                        <div className="hidden md:flex p-4 bg-blue-50 text-blue-500 rounded-2xl">
                                            <Droplet className="w-8 h-8" />
                                        </div>
                                        <div className="space-y-4">
                                            <h3 className="font-serif font-bold text-xl text-sage-900">Recommended Usage</h3>
                                            <p className="text-stone-600 leading-relaxed text-lg whitespace-pre-line">
                                                {product.usage || "No usage instructions available."}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'reviews' && (
                                    <div className="space-y-8">
                                        <div className="flex items-center justify-between border-b border-sage-100 pb-8">
                                            <div>
                                                <div className="flex items-center gap-4">
                                                    <h3 className="text-5xl font-serif font-bold text-sage-900">{product.rating}</h3>
                                                    <div className="space-y-1">
                                                        <div className="flex text-saffron-400">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={i} size={20} className={i < Math.round(product.rating) ? "fill-current" : "text-gray-200"} />
                                                            ))}
                                                        </div>
                                                        <p className="text-stone-500 font-medium">Based on {product.reviews || 0} reviews</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button>Write a Review</Button>
                                        </div>

                                        {product.reviews > 0 ? (
                                            <div className="text-center py-12 bg-stone-50 rounded-2xl border border-stone-100 border-dashed">
                                                <MessageCircle className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                                                <p className="text-stone-500 font-medium">Reviews content would appear here.</p>
                                                <p className="text-xs text-stone-400 mt-1">(Mock functionality)</p>
                                            </div>
                                        ) : (
                                            <div className="text-center py-12">
                                                <p className="text-stone-500 mb-2 italic">No reviews yet.</p>
                                                <p className="text-sage-600 font-medium">Be the first to share your experience with {product.name}!</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Trust Badges Minimal */}
                <div className="border-t border-sage-200/50 pt-16 pb-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { icon: <Leaf />, title: "100% Organic", desc: "Certified Sourcing" },
                            { icon: <ShieldCheck />, title: "Lab Tested", desc: "Safety Assured" },
                            { icon: <Truck />, title: "Fast Shipping", desc: "Pan-India Delivery" },
                            { icon: <MessageCircle />, title: "Expert Support", desc: "Vaidya Consultations" },
                        ].map((badge, i) => (
                            <div key={i} className="flex flex-col items-center text-center gap-3 group">
                                <div className="p-3 rounded-full bg-sage-50 text-sage-400 group-hover:bg-sage-100 group-hover:text-sage-600 transition-colors">
                                    {badge.icon}
                                </div>
                                <div>
                                    <h4 className="font-bold text-sage-900 text-sm">{badge.title}</h4>
                                    <p className="text-xs text-stone-400 mt-0.5">{badge.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mobile Sticky Add to Cart */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-sage-100 p-4 md:hidden z-40 flex items-center gap-4 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                    <div className="flex flex-col">
                        <span className="text-xl font-serif text-sage-900 font-bold">₹{product.disc_price ? product.disc_price.toFixed(2) : product.price.toFixed(2)}</span>
                        {product.stock_status === 'Out of Stock' && <span className="text-xs text-red-500 font-medium">Out of Stock</span>}
                    </div>
                    <Button
                        className="flex-1 bg-sage-900 text-white rounded-full py-3 text-sm font-bold uppercase tracking-wider shadow-lg shadow-sage-900/20"
                        onClick={() => addToCart(product, quantity)}
                        disabled={product.stock_status === 'Out of Stock'}
                    >
                        Add to Cart
                    </Button>
                </div>
            </div>
        </div>
    );
};

// Simple Fallback Icon
const SparklesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
);

export default ProductDetails;
