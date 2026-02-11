import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Truck, ShieldCheck, Leaf, Heart, MessageCircle, ChevronDown, Droplet, Sun, Wind, Activity, Zap, Moon, ShoppingCart } from 'lucide-react';
import Button from '../components/Button';
import { getProduct, getCategories, getBrandByName, getVariants } from '../lib/data';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

import logoShort from '../assets/logo-short.svg';
import ProductRecommendations from '../components/ProductRecommendations';
import ReviewModal from '../components/ReviewModal';
import { supabase } from '../lib/supabase';

const ProductDetails = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [categories, setCategories] = useState([]);
    const [brandDetails, setBrandDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [activeTab, setActiveTab] = useState('description');
    const [selectedImage, setSelectedImage] = useState(null);
    const { addToCart } = useCart();
    const { user } = useAuth();
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviews, setReviews] = useState([]);

    const fetchReviews = async () => {
        if (!id) return;
        const { data } = await supabase
            .from('product_reviews')
            .select('*, profiles:user_id(full_name)')
            .eq('product_id', id)
            .order('created_at', { ascending: false });

        if (data) setReviews(data);
    };

    useEffect(() => {
        fetchReviews();
    }, [id]);

    useEffect(() => {
        const loadProduct = async () => {
            // Load product, categories, and variants in parallel
            const [productData, categoriesData, variantsData] = await Promise.all([
                getProduct(id),
                getCategories(),
                getVariants(id)
            ]);

            // Attach default variant ID if available
            if (variantsData && variantsData.length > 0) {
                productData.variants = variantsData; // Attach variants to product object
                productData.variantId = variantsData[0].id;

                // Try to find 200g as default (best value), else first
                const bestValue = variantsData.find(v => v.name.toLowerCase().includes('200g'));
                setSelectedVariant(bestValue || variantsData[0]);
            }

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
            <div className="container mx-auto px-4 md:px-6 py-4 md:py-8 lg:pb-24">
                {/* Breadcrumbs - Minimalist */}
                <nav className="hidden md:flex text-xs font-medium text-stone-400 mb-6 items-center gap-2 uppercase tracking-widest">
                    <Link to="/" className="hover:text-sage-800 transition-colors">Home</Link>
                    <span>/</span>
                    <Link to="/shop" className="hover:text-sage-800 transition-colors">Shop</Link>
                    <span>/</span>
                    <span className="text-sage-800 line-clamp-1">{product.name}</span>
                </nav>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-12 lg:gap-20 mb-12 md:mb-20">
                    {/* Left Column: Images (Large focus) */}
                    <div className="md:col-span-6 lg:col-span-7 space-y-4 md:space-y-6">
                        <div className="relative aspect-[4/5] md:aspect-square lg:aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl shadow-sage-200/50 group">
                            <img
                                src={selectedImage || product.image}
                                alt={product.name}
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                            />

                            {/* Floating Badges */}
                            <div className="absolute top-4 left-4 md:top-6 md:left-6 flex flex-col gap-3">
                                <div className="bg-white/90 backdrop-blur-md text-sage-900 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm border border-white/50">
                                    <Leaf size={12} className="text-sage-600 md:w-3.5 md:h-3.5" /> 100% Natural
                                </div>
                            </div>
                        </div>

                        {/* Thumbnails Gallery */}
                        {product.images && product.images.length > 0 && (
                            <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 scrollbar-hide px-1">
                                <button
                                    onClick={() => setSelectedImage(product.image)}
                                    className={`relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === product.image ? 'border-sage-900 ring-2 ring-sage-200' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                >
                                    <img src={product.image} alt="Main" className="w-full h-full object-cover" />
                                </button>
                                {product.images.map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedImage(img)}
                                        className={`relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === img ? 'border-sage-900 ring-2 ring-sage-200' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                    >
                                        <img src={img} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Product Info */}
                    <div className="md:col-span-6 lg:col-span-5 flex flex-col justify-center">
                        <div className="mb-6 md:mb-8">
                            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4 flex-wrap">
                                {normalizeToArray(product.category).map(id => {
                                    const catName = categories.find(c => c.id === id)?.name || id;
                                    return (
                                        <span key={id} className="text-[10px] md:text-xs font-bold tracking-widest uppercase text-saffron-600 bg-saffron-50 px-2 py-1 rounded">
                                            {catName}
                                        </span>
                                    );
                                })}
                            </div>

                            <h1 className="text-2xl md:text-5xl lg:text-6xl font-serif font-medium text-sage-900 mb-2 leading-tight tracking-tight">
                                {product.name}
                            </h1>
                            <div className="text-xs md:text-sm font-bold uppercase tracking-widest text-sage-500 mb-4 md:mb-6">
                                {product.brand ? `By ${product.brand}` : 'By Vedmeet'}
                            </div>

                            {/* Rating */}
                            {(product.reviews > 0 && product.rating > 0) && (
                                <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
                                    <div className="flex gap-0.5 text-saffron-400">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={16} className={`md:w-[18px] md:h-[18px] ${i < Math.round(product.rating || 0) ? "fill-current" : "text-gray-200"}`} />
                                        ))}
                                    </div>
                                    <span className="text-xs md:text-sm text-stone-500 font-medium">
                                        {product.rating ? product.rating.toFixed(1) : "0.0"} ({product.reviews || 0} reviews)
                                    </span>
                                </div>
                            )}

                            <p className="text-stone-600 leading-relaxed text-base md:text-lg mb-6 md:mb-8 font-light">
                                {product.meta_description || product.description}
                            </p>

                            {/* Benefits/Highlights Row */}
                            <div className="flex flex-wrap gap-2 md:gap-3 mb-8 md:mb-10">
                                {benefitsList.slice(0, 3).map((benefit, i) => (
                                    <div key={i} className="flex items-center gap-1.5 md:gap-2 px-2.5 py-1.5 md:px-3 md:py-2 rounded-lg bg-stone-100 text-stone-600 text-[10px] md:text-xs font-bold uppercase tracking-wide">
                                        <ShieldCheck size={12} className="md:w-3.5 md:h-3.5" />
                                        {benefit.replace(/^[•-]\s*/, '').split(' ').slice(0, 2).join(' ')}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Variants Selection */}
                        {product.variants && product.variants.length > 0 && (
                            <div className="mb-6 md:mb-8">
                                <span className="text-xs md:text-sm text-stone-400 font-medium mb-2 md:mb-3 block uppercase tracking-wider">Select Size</span>
                                <div className="flex flex-wrap gap-2 md:gap-3">
                                    {product.variants.map((variant) => {
                                        const isSelected = selectedVariant && selectedVariant.id === variant.id;

                                        // Use direct values from admin/db
                                        const basePrice = Math.round(variant.price);
                                        // Check for variant-level discount first, falling back to product-level
                                        const variantDiscount = variant.discount_percentage || 0;
                                        const productDiscount = product.discount_percentage || 0;
                                        const effectiveDiscount = variantDiscount > 0 ? variantDiscount : productDiscount;

                                        // Calculate final selling price based on offer if exists
                                        const displayPrice = effectiveDiscount > 0
                                            ? Math.round(basePrice * (1 - effectiveDiscount / 100))
                                            : basePrice;

                                        // If offer applies, the "Crossed Out" price is the Base Price (or MRP if it's even higher)

                                        // If NO offer, Crossed Out is MRP (if strictly provided)

                                        const mrp = variant.mrp ? Math.round(variant.mrp) : (productDiscount > 0 ? basePrice : null);

                                        // Calculate discount % based on what we are showing as "Original"
                                        const originalPrice = mrp || basePrice;
                                        // Avoid division by zero
                                        const discount = (originalPrice > displayPrice)
                                            ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
                                            : 0;

                                        const isBestValue = variant.name.toLowerCase().includes('200g');

                                        return (
                                            <button
                                                key={variant.id}
                                                onClick={() => setSelectedVariant(variant)}
                                                className={`relative flex flex-col items-start p-3 md:p-4 rounded-xl border transition-all text-left min-w-[140px] md:min-w-[160px] ${isSelected
                                                    ? 'bg-sage-900 border-sage-900 text-white shadow-lg shadow-sage-900/20'
                                                    : 'bg-white border-sage-200 text-sage-900 hover:border-sage-400'
                                                    }`}
                                            >
                                                {/* Variant Name */}
                                                <span className={`text-sm font-bold mb-2 ${isSelected ? 'text-white' : 'text-sage-900'}`}>
                                                    {variant.name}
                                                </span>

                                                {/* Selling Price */}
                                                <span className={`text-xl font-serif font-bold mb-1 ${isSelected ? 'text-white' : 'text-sage-900'}`}>
                                                    ₹{displayPrice}
                                                </span>

                                                {/* MRP & Discount */}
                                                {(discount > 0) && (
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-xs line-through ${isSelected ? 'text-sage-300' : 'text-stone-400'}`}>
                                                            ₹{mrp}
                                                        </span>
                                                        <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-green-700'}`}>
                                                            {discount}% off
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Best Value Badge */}
                                                {isBestValue && (
                                                    <span className={`absolute top-2 right-2 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${isSelected ? 'bg-saffron-500 text-white' : 'bg-saffron-100 text-saffron-800'
                                                        }`}>
                                                        Best
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Price & Action Area */}
                        <div className="bg-white p-5 md:p-8 rounded-3xl shadow-xl shadow-sage-100/50 border border-sage-50 mb-8 md:mb-0">
                            <div className="flex items-end justify-between mb-6 md:mb-8">
                                <div>
                                    <span className="text-xs md:text-sm text-stone-400 font-medium mb-1 block">Price (Incl. GST)</span>
                                    {(() => {
                                        const productDiscount = product.discount_percentage || 0;

                                        let sellingPrice, originalPrice;

                                        if (selectedVariant) {
                                            const baseVariantPrice = selectedVariant.price;
                                            const variantDiscount = selectedVariant.discount_percentage || 0;
                                            const effectiveDiscount = variantDiscount > 0 ? variantDiscount : (product.discount_percentage || 0);

                                            sellingPrice = effectiveDiscount > 0
                                                ? Math.round(baseVariantPrice * (1 - effectiveDiscount / 100))
                                                : baseVariantPrice;
                                            originalPrice = selectedVariant.mrp || (effectiveDiscount > 0 ? baseVariantPrice : null);
                                        } else {
                                            // No variant selected - use product defaults
                                            // product.disc_price is already calculated in DB if offer applied
                                            sellingPrice = product.disc_price || product.price;
                                            originalPrice = product.disc_price ? product.price : null; // If disc_price exists, main price is original
                                        }

                                        const hasDiscount = originalPrice && originalPrice > sellingPrice;
                                        const discountPercent = hasDiscount ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100) : 0;

                                        return (
                                            hasDiscount ? (
                                                <div className="flex items-baseline gap-2 md:gap-3">
                                                    <span className="text-3xl md:text-4xl font-serif text-sage-900">
                                                        ₹{sellingPrice.toFixed(0)}
                                                    </span>
                                                    <span className="text-base md:text-lg text-stone-400 line-through font-serif">
                                                        ₹{originalPrice.toFixed(0)}
                                                    </span>
                                                    <span className="text-[10px] md:text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full">-{discountPercent}%</span>
                                                </div>
                                            ) : (
                                                <span className="text-3xl md:text-4xl font-serif text-sage-900">
                                                    ₹{sellingPrice.toFixed(0)}
                                                </span>
                                            )
                                        );
                                    })()}
                                </div>
                                <div className={`text-xs md:text-sm font-bold px-2.5 py-1 md:px-3 rounded-full ${(selectedVariant ? selectedVariant.stock_quantity : product.stock_quantity) <= 0
                                    ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'
                                    }`}>
                                    {(selectedVariant ? selectedVariant.stock_quantity : product.stock_quantity) <= 0 ? 'Out of Stock' : 'In Stock'}
                                </div>
                            </div>

                            {/* Only show Add to Cart if in stock */}
                            {((selectedVariant ? selectedVariant.stock_quantity : product.stock_quantity) > 0) && (
                                <div className="space-y-4">
                                    <div className="flex gap-3 md:gap-4">
                                        <div className="flex items-center border border-stone-200 rounded-xl bg-stone-50 h-12 md:h-14">
                                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 md:w-12 h-full flex items-center justify-center text-stone-500 hover:text-sage-900 transition-colors text-lg md:text-xl">-</button>
                                            <span className="w-8 md:w-10 text-center font-bold text-sage-900 text-base md:text-lg">{quantity}</span>
                                            <button onClick={() => setQuantity(quantity + 1)} className="w-10 md:w-12 h-full flex items-center justify-center text-stone-500 hover:text-sage-900 transition-colors text-lg md:text-xl">+</button>
                                        </div>
                                        <Button
                                            className="flex-1 h-12 md:h-14 bg-sage-900 hover:bg-sage-800 text-white rounded-xl shadow-lg shadow-sage-900/20 text-base md:text-lg font-medium tracking-wide transition-all hover:-translate-y-0.5 flex items-center justify-center"
                                            onClick={() => {
                                                const taxRate = selectedVariant?.gst_rate || product.gst_rate || 0;
                                                const itemToAdd = selectedVariant
                                                    ? {
                                                        ...product,
                                                        price: (selectedVariant.discount_percentage || product.discount_percentage) > 0
                                                            ? selectedVariant.price * (1 - (selectedVariant.discount_percentage || product.discount_percentage) / 100)
                                                            : selectedVariant.price, // Use discounted price if exists
                                                        gst_rate: taxRate,
                                                        variantId: selectedVariant.id,
                                                        name: `${product.name} - ${selectedVariant.name}`,
                                                        image: selectedVariant.image || product.image
                                                    }
                                                    : {
                                                        ...product, // product.price is Base Price
                                                        gst_rate: taxRate
                                                    };
                                                addToCart(itemToAdd, quantity);
                                            }}
                                        >
                                            {user ? <><ShoppingCart className="w-5 h-5 md:w-6 md:h-6 mr-2" /> Add to Cart</> : 'Login to Order'}
                                        </Button>
                                    </div>
                                    <p className="text-[10px] md:text-xs text-center text-stone-400">Free shipping on orders above ₹999</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Section Diagram / Split */}
                <div className="relative mb-16 md:mb-24">
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-transparent via-sage-200 to-transparent"></div>
                    <div className="relative max-w-fit mx-auto bg-[#FAFAF9] px-6">
                        <img src={logoShort} alt="Divider" className="w-24 h-24 md:w-32 md:h-32 opacity-50" />
                    </div>
                </div>



                {/* Tabs Interface */}
                <div className="max-w-4xl mx-auto mb-20 md:mb-24">
                    {/* Tab Buttons */}
                    <div className="flex items-center gap-6 md:gap-8 mb-6 md:mb-8 border-b border-sage-100 overflow-x-auto no-scrollbar pb-2">
                        {[
                            { id: 'description', label: 'Description' },
                            { id: 'ingredients', label: 'Ingredients' },
                            { id: 'specifications', label: 'Specs' },
                            { id: 'benefits', label: 'Benefits' },
                            { id: 'usage', label: 'Usage' },
                            { id: 'reviews', label: product.reviews > 0 ? `Reviews (${product.reviews})` : 'Reviews' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative pb-3 md:pb-4 text-xs md:text-base font-bold uppercase tracking-wider transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === tab.id
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
                    <div className="bg-white rounded-3xl p-6 md:p-12 shadow-xl shadow-sage-100/50 border border-sage-50 min-h-[300px]">
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
                                            className="text-stone-600 leading-relaxed text-base md:text-lg mb-8 prose prose-stone max-w-none prose-headings:font-serif prose-headings:text-sage-900 prose-a:text-saffron-600 prose-p:text-sm md:prose-p:text-base"
                                            dangerouslySetInnerHTML={{ __html: product.description }}
                                        />

                                        {brandDetails && (
                                            <div className="bg-sage-50 p-5 md:p-6 rounded-2xl border border-sage-100 mt-8">
                                                <div className="flex items-start gap-4">
                                                    {brandDetails.logo && (
                                                        <img src={brandDetails.logo} alt={brandDetails.name} className="w-12 h-12 md:w-16 md:h-16 object-contain bg-white rounded-lg p-1" />
                                                    )}
                                                    <div>
                                                        <h3 className="font-serif font-bold text-lg md:text-xl text-sage-900 mb-2">About {brandDetails.name}</h3>
                                                        <p className="text-stone-600 text-xs md:text-sm leading-relaxed">
                                                            {brandDetails.description || `Discover more about ${brandDetails.name}.`}
                                                        </p>
                                                        {brandDetails.origin_country && (
                                                            <p className="text-[10px] md:text-xs text-sage-500 mt-2 font-bold uppercase tracking-wider">Origin: {brandDetails.origin_country}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'ingredients' && (
                                    <div className="prose prose-stone max-w-none">
                                        <p className="text-stone-600 leading-relaxed text-base md:text-lg mb-6">
                                            {product.ingredients}
                                        </p>
                                        {/* Tag Cloud for ingredients */}
                                        <div className="flex flex-wrap gap-2 mt-4">
                                            {ingredientsList.map((ing, i) => (
                                                <span key={i} className="inline-block bg-sage-50 text-sage-800 text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-full border border-sage-100">
                                                    {ing.replace(/^[•-]\s*/, '')}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'specifications' && (
                                    <div>
                                        <h3 className="font-serif font-bold text-lg md:text-xl text-sage-900 mb-4">Product Specifications</h3>
                                        <div className="bg-stone-50 rounded-xl p-5 md:p-6 border border-stone-100">

                                            {/* Physical Specifications (Dynamic from Variant) */}
                                            {(() => {
                                                const currentItem = selectedVariant || product;
                                                const hasPhysicalSpecs = currentItem.weight || currentItem.volume || currentItem.dimensions || currentItem.pieces;

                                                if (!hasPhysicalSpecs) return null;

                                                return (
                                                    <div className="mb-6 pb-6 border-b border-stone-200">
                                                        <h4 className="font-bold text-sage-800 mb-4 text-[10px] md:text-xs uppercase tracking-widest flex items-center gap-2">
                                                            <SparklesIcon /> Physical Details
                                                        </h4>
                                                        <ul className="space-y-3">
                                                            {currentItem.weight && (
                                                                <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                                                                    <span className="text-stone-500 text-xs md:text-sm font-medium w-32 shrink-0">Net Weight</span>
                                                                    <span className="text-sage-900 text-sm md:text-base font-medium">{currentItem.weight}</span>
                                                                </li>
                                                            )}
                                                            {currentItem.volume && (
                                                                <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                                                                    <span className="text-stone-500 text-xs md:text-sm font-medium w-32 shrink-0">Net Volume</span>
                                                                    <span className="text-sage-900 text-sm md:text-base font-medium">{currentItem.volume}</span>
                                                                </li>
                                                            )}
                                                            {currentItem.dimensions && (
                                                                <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                                                                    <span className="text-stone-500 text-xs md:text-sm font-medium w-32 shrink-0">Dimensions</span>
                                                                    <span className="text-sage-900 text-sm md:text-base font-medium">{currentItem.dimensions}</span>
                                                                </li>
                                                            )}
                                                            {currentItem.pieces && (
                                                                <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                                                                    <span className="text-stone-500 text-xs md:text-sm font-medium w-32 shrink-0">Unit Count</span>
                                                                    <span className="text-sage-900 text-sm md:text-base font-medium">{currentItem.pieces} {currentItem.pieces > 1 ? 'Pieces' : 'Piece'}</span>
                                                                </li>
                                                            )}
                                                        </ul>
                                                    </div>
                                                );
                                            })()}

                                            {/* General Specifications */}
                                            {product.specifications ? (
                                                <>
                                                    <h4 className="font-bold text-sage-800 mb-4 text-[10px] md:text-xs uppercase tracking-widest">General Details</h4>
                                                    <ul className="space-y-3">
                                                        {product.specifications.split('\n').map((line, i) => {
                                                            const parts = line.split(':');
                                                            const label = parts[0];
                                                            const value = parts.slice(1).join(':');

                                                            if (value && value.trim().length > 0) {
                                                                return (
                                                                    <li key={i} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 border-b border-stone-200 last:border-0 pb-2 last:pb-0">
                                                                        <span className="text-stone-500 text-xs md:text-sm font-medium w-32 shrink-0">{label.trim()}</span>
                                                                        <span className="text-sage-900 text-sm md:text-base font-medium">{value.trim()}</span>
                                                                    </li>
                                                                );
                                                            }
                                                            return (
                                                                <li key={i} className="text-stone-700 text-sm md:text-base">{line}</li>
                                                            );
                                                        })}
                                                    </ul>
                                                </>
                                            ) : (
                                                <p className="text-stone-500 italic text-sm">No additional specifications available.</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'benefits' && (
                                    <div>
                                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                            {benefitsList.map((benefit, i) => (
                                                <li key={i} className="flex items-start gap-3 bg-stone-50 p-3 md:p-4 rounded-xl">
                                                    <div className="mt-1 text-saffron-500">
                                                        <ShieldCheck className="w-4 h-4 md:w-5 md:h-5" />
                                                    </div>
                                                    <span className="text-stone-700 text-sm md:text-base font-medium">{benefit.replace(/^[•-]\s*/, '')}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        {benefitsList.length === 0 && <p className="text-stone-500 italic text-sm">No specific benefits details available.</p>}
                                    </div>
                                )}

                                {activeTab === 'usage' && (
                                    <div className="flex items-start gap-4 md:gap-6">
                                        <div className="hidden md:flex p-4 bg-blue-50 text-blue-500 rounded-2xl">
                                            <Droplet className="w-8 h-8" />
                                        </div>
                                        <div className="space-y-3 md:space-y-4">
                                            <h3 className="font-serif font-bold text-lg md:text-xl text-sage-900">Recommended Usage</h3>
                                            <p className="text-stone-600 leading-relaxed text-base md:text-lg whitespace-pre-line">
                                                {product.usage || "No usage instructions available."}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'reviews' && (
                                    <div className="space-y-6 md:space-y-8">
                                        <div className="flex items-center justify-between border-b border-sage-100 pb-6 md:pb-8">
                                            <div>
                                                {product.reviews > 0 ? (
                                                    <div className="flex items-center gap-4">
                                                        <h3 className="text-4xl md:text-5xl font-serif font-bold text-sage-900">{product.rating ? product.rating.toFixed(1) : "0.0"}</h3>
                                                        <div className="space-y-1">
                                                            <div className="flex text-saffron-400">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <Star key={i} size={20} className={i < Math.round(product.rating || 0) ? "fill-current" : "text-gray-200"} />
                                                                ))}
                                                            </div>
                                                            <p className="text-stone-500 text-sm font-medium">Based on {reviews.length} reviews</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <h3 className="text-xl md:text-2xl font-serif font-bold text-sage-900">Customer Reviews</h3>
                                                )}
                                            </div>
                                            <Button onClick={() => setIsReviewModalOpen(true)} size="sm" className="text-xs md:text-sm">Write a Review</Button>
                                        </div>

                                        {reviews.length > 0 ? (
                                            <div className="space-y-4 md:space-y-6">
                                                {reviews.map((review) => (
                                                    <div key={review.id} className="bg-stone-50 p-4 md:p-6 rounded-2xl">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <h4 className="font-bold text-sage-900 text-sm md:text-base">{review.profiles?.full_name || 'Anonymous User'}</h4>
                                                            <span className="text-[10px] md:text-xs text-stone-400">{new Date(review.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                        <div className="flex text-saffron-400 mb-3">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={i} size={14} className={i < review.rating ? "fill-current" : "text-gray-200"} />
                                                            ))}
                                                        </div>
                                                        <p className="text-stone-600 text-sm md:text-base leading-relaxed">
                                                            {review.review_text ? review.review_text : <span className="italic text-stone-400">No written review.</span>}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 md:py-12">
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

                {/* Recommendations */}
                <ProductRecommendations
                    title="You May Also Like"
                    currentProductId={product.id}
                    category={product.category}
                    concern={product.concern}
                    limit={4}
                />

                {/* Trust Badges Minimal */}
                <div className="border-t border-sage-200/50 pt-10 pb-20 md:pt-16 md:pb-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                        {[
                            { icon: <Leaf />, title: "100% Organic", desc: "Certified Sourcing" },
                            { icon: <ShieldCheck />, title: "Lab Tested", desc: "Safety Assured" },
                            { icon: <Truck />, title: "Fast Shipping", desc: "Pan-India Delivery" },
                            { icon: <MessageCircle />, title: "Expert Support", desc: "Vaidya Consultations" },
                        ].map((badge, i) => (
                            <div key={i} className="flex flex-col items-center text-center gap-3 group">
                                <div className="p-3 rounded-full bg-sage-50 text-sage-400 group-hover:bg-sage-100 group-hover:text-sage-600 transition-colors">
                                    {React.cloneElement(badge.icon, { className: "w-5 h-5 md:w-6 md:h-6" })}
                                </div>
                                <div>
                                    <h4 className="font-bold text-sage-900 text-xs md:text-sm">{badge.title}</h4>
                                    <p className="text-[10px] md:text-xs text-stone-400 mt-0.5">{badge.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mobile Sticky Add to Cart */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-sage-100 p-3 md:hidden z-40 flex items-center gap-4 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] safe-area-pb">
                    <div className="flex flex-col">
                        <span className="text-lg font-serif text-sage-900 font-bold">
                            {(() => {
                                // Logic matching the desktop display
                                const productDiscount = product.discount_percentage || 0;
                                let displayPrice;

                                if (selectedVariant) {
                                    const variantDiscount = selectedVariant.discount_percentage || 0;
                                    const effectiveDiscount = variantDiscount > 0 ? variantDiscount : (product.discount_percentage || 0);

                                    displayPrice = effectiveDiscount > 0
                                        ? selectedVariant.price * (1 - effectiveDiscount / 100)
                                        : selectedVariant.price;
                                } else {
                                    displayPrice = product.disc_price || product.price;
                                }
                                return `₹${displayPrice.toFixed(0)}`;
                            })()}
                        </span>
                        {(selectedVariant ? selectedVariant.stock_quantity : product.stock_quantity) <= 0
                            ? <span className="text-[10px] text-red-500 font-medium">Out of Stock</span>
                            : <span className="text-[10px] text-green-600 font-medium">In Stock</span>
                        }
                    </div>
                    <Button
                        className="flex-1 bg-sage-900 text-white rounded-full py-3 text-xs font-bold uppercase tracking-wider shadow-lg shadow-sage-900/20"
                        onClick={() => {
                            const taxRate = selectedVariant?.gst_rate || product.gst_rate || 0;
                            const itemToAdd = selectedVariant
                                ? {
                                    ...product,
                                    price: selectedVariant.price, // Base Price
                                    gst_rate: taxRate,
                                    variantId: selectedVariant.id,
                                    name: `${product.name} - ${selectedVariant.name}`,
                                    image: selectedVariant.image || product.image
                                }
                                : {
                                    ...product, // product.price is Base Price
                                    gst_rate: taxRate
                                };
                            addToCart(itemToAdd, quantity);
                        }}
                        disabled={product.stock_status === 'Out of Stock'}
                    >
                        {user ? 'Add to Cart' : 'Login'}
                    </Button>
                </div>
            </div>

            <ReviewModal
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                productId={product.id}
                onReviewSubmitted={() => {
                    fetchReviews(); // Reload reviews
                    // Optionally refresh product data to get new average rating
                }}
            />
        </div >
    );
};

// Simple Fallback Icon
const SparklesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
);

export default ProductDetails;
