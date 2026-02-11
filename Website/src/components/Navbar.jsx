
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Menu, X, Search, User, FileText, ArrowLeft, MapPin, ChevronDown, Zap, Phone, HelpCircle, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';
import { cn } from '../lib/utils';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getCategories, searchProducts, getTrendingProducts } from '../lib/data';
import PrescriptionUpload from './PrescriptionUpload';

import logoFull from '../assets/logo-full.svg';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false); // For mobile search overlay
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { cartCount, toggleCart } = useCart();
    const { user, profile, loading, signOut } = useAuth();
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);

    const [searchResults, setSearchResults] = useState([]);
    const [trendingProducts, setTrendingProducts] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Fetch initial data
    useEffect(() => {
        const loadData = async () => {
            const cats = await getCategories();
            setCategories(cats || []);

            const trending = await getTrendingProducts(6);
            setTrendingProducts(trending || []);
        };
        loadData();
    }, []);

    // Real-time search effect
    useEffect(() => {
        const timber = setTimeout(async () => {
            if (searchQuery.length >= 2) {
                setIsSearching(true);
                const results = await searchProducts(searchQuery);
                setSearchResults(results);
                setIsSearching(false);
            } else {
                setSearchResults([]);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timber);
    }, [searchQuery]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
            setSearchQuery('');
            setSearchOpen(false); // Close mobile overlay if open
        }
    };

    const navLinks = [
        { name: 'Medicines', path: '/shop' },
        { name: 'Consult Doctors', path: '/consultation' },
        { name: 'Ayurveda', path: '/shop?category=ayurveda' },
        { name: 'Blog', path: '/blog' },
    ];

    return (
        <header className="sticky top-0 z-50 w-full bg-white shadow-sm font-sans text-stone-800">
            {/* Top Bar: Logo, Main Links, Auth, Cart (Desktop) */}
            <div className="border-b border-gray-100 hidden md:block">
                <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
                    {/* Left: Logo & Core Nav */}
                    <div className="flex items-center gap-8">
                        <Link to="/" className="flex-shrink-0">
                            <img src={logoFull} alt="Vedmeet" className="h-10 w-auto" />
                        </Link>
                        <nav className="flex items-center gap-6">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    className="text-xs font-bold uppercase tracking-wider text-stone-600 hover:text-saffron-600 hover:underline decoration-2 underline-offset-4 transition-colors"
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </nav>
                        <div className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded border border-red-100 animate-pulse">
                            SAVE MORE
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-6 text-sm font-medium">
                        {/* Auth */}
                        <div className="flex items-center gap-1">
                            {loading ? (
                                <span className="text-stone-400">Loading...</span>
                            ) : user ? (
                                <div className="relative group cursor-pointer py-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-sage-100 rounded-full flex items-center justify-center text-sage-700 text-xs font-bold">
                                            {profile?.full_name ? profile.full_name[0].toUpperCase() : 'U'}
                                        </div>
                                        <span className="text-stone-700 truncate max-w-[100px]">{profile?.full_name?.split(' ')[0]}</span>
                                        <ChevronDown className="w-3 h-3 text-stone-400" />
                                    </div>
                                    {/* Dropdown */}
                                    <div className="absolute right-0 top-full mt-0 w-48 bg-white border border-gray-100 rounded-lg shadow-xl py-1 hidden group-hover:block z-50">
                                        <div className="px-4 py-2 border-b border-gray-50">
                                            <p className="text-xs font-bold text-stone-800 truncate">{profile?.full_name}</p>
                                            <p className="text-[10px] text-stone-500 truncate">{user.email}</p>
                                        </div>
                                        <Link to="/profile" className="block px-4 py-2 text-sm text-stone-600 hover:bg-gray-50">My Profile</Link>
                                        <Link to="/orders" className="block px-4 py-2 text-sm text-stone-600 hover:bg-gray-50">My Orders</Link>
                                        <button onClick={signOut} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Sign Out</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-1 text-stone-700">
                                    <Link to="/login" className="hover:text-saffron-600">Login</Link>
                                    <span className="text-stone-300">|</span>
                                    <Link to="/signup" className="hover:text-saffron-600">Signup</Link>
                                </div>
                            )}
                        </div>

                        <Link to="/offers" className="hover:text-saffron-600">Offers</Link>

                        <button onClick={toggleCart} className="flex items-center gap-1 hover:text-saffron-600 relative">
                            <ShoppingBag className="w-5 h-5" />
                            {cartCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-saffron-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                                    {cartCount}
                                </span>
                            )}
                        </button>

                        <Link to="/help" className="hover:text-saffron-600 flex items-center gap-1">
                            <span>Need Help?</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Middle Bar: Search, Location, Quick Action */}
            <div className="bg-white py-3 border-b border-gray-100 relative z-40">
                <div className="container mx-auto px-4 md:px-6 flex items-center gap-4">

                    {/* Mobile: Logo + Menu */}
                    <div className="md:hidden flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setIsOpen(true)} className="text-stone-600">
                                <Menu className="w-6 h-6" />
                            </button>
                            <Link to="/">
                                <img src={logoFull} alt="Vedmeet" className="h-8 w-auto" />
                            </Link>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={() => setIsUploadOpen(true)} className="p-1 hover:bg-gray-100 rounded-md transition-colors" title="Upload Prescription">
                                <Camera className="w-5 h-5 text-saffron-600" />
                            </button>
                            <button onClick={toggleCart} className="relative">
                                <ShoppingBag className="w-5 h-5 text-stone-600" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-saffron-500 text-white text-[10px] font-bold h-3 w-3 rounded-full flex items-center justify-center">
                                        {cartCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Desktop: Search Button (No Location) */}
                    <div className="hidden md:flex flex-1 items-center gap-3">
                        <div className="flex-1 bg-gray-50 rounded-md border border-gray-200 p-1">
                            {/* Search Input */}
                            <form onSubmit={handleSearch} className="relative group">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search for medicines and health products"
                                    className="w-full bg-transparent border-none focus:ring-0 px-4 py-2 text-sm text-stone-700 placeholder:text-stone-400"
                                />
                                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-stone-600">
                                    <Search className="w-5 h-5" />
                                </button>

                                {/* Search Dropdown logic (reuse existing) */}
                                {searchQuery.length >= 2 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50 max-h-[60vh] overflow-y-auto">
                                        {isSearching ? (
                                            <div className="p-4 text-center text-sm text-stone-500">Searching...</div>
                                        ) : searchResults.length > 0 ? (
                                            searchResults.map(prod => (
                                                <Link
                                                    key={prod.id}
                                                    to={`/product/${prod.id}`}
                                                    onClick={() => setSearchQuery('')}
                                                    className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                                                >
                                                    <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                                                        <img src={prod.image} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-stone-800 truncate">{prod.name}</p>
                                                        <p className="text-xs text-stone-500">{prod.brand}</p>
                                                    </div>
                                                    <span className="text-sm font-bold text-stone-900">₹{Math.round(prod.disc_price || prod.price)}</span>
                                                </Link>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-sm text-stone-500">No matches found</div>
                                        )}
                                    </div>
                                )}
                            </form>
                        </div>

                        {/* Camera Icon for Prescription Upload */}
                        <button
                            onClick={() => setIsUploadOpen(true)}
                            className="flex-shrink-0 p-2.5 bg-saffron-500 hover:bg-saffron-600 text-white rounded-md transition-colors shadow-sm group"
                            title="Upload Prescription"
                        >
                            <Camera className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Desktop: Quick Action */}
                    <div className="hidden md:flex items-center gap-4">
                        <div className="flex items-center gap-1 text-xs">
                            <Zap className="w-4 h-4 text-amber-500 fill-current" />
                            <span className="font-bold text-stone-700">QUICK BUY! Get 15% off on medicines*</span>
                        </div>
                        <Button
                            onClick={() => setIsUploadOpen(true)}
                            className="bg-saffron-500 hover:bg-saffron-600 text-white font-bold px-6 py-2.5 rounded text-sm shadow-sm active:scale-95 transition-transform"
                        >
                            Quick Order
                        </Button>
                    </div>
                </div>

                {/* Mobile Search Bar (Bottom of Header) */}
                <div className="md:hidden px-4 mt-3">
                    <form onSubmit={handleSearch} className="relative">
                        <input
                            type="text"
                            onFocus={() => setSearchOpen(true)}
                            placeholder="Search for medicines..."
                            className="w-full bg-gray-100 border-none rounded-lg py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-saffron-200"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    </form>
                </div>
            </div>

            {/* Bottom Bar: Categories (Desktop Hover Menu) */}
            <div className="bg-white border-b border-gray-200 hidden md:block">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="flex items-center gap-8 py-3 text-sm font-medium text-stone-600 overflow-x-auto no-scrollbar whitespace-nowrap">


                        {categories.slice(0, 8).map(cat => (
                            <div key={cat.id} className="flex items-center gap-1 cursor-pointer hover:text-saffron-600 group relative">
                                <Link to={`/shop?category=${cat.id}`} className="flex items-center gap-1">
                                    <span>{cat.name}</span>
                                    <ChevronDown className="w-3 h-3" />
                                </Link>
                            </div>
                        ))}

                        <Link to="/shop" className="text-saffron-600 font-bold hover:underline ml-auto">
                            See All
                        </Link>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: "tween" }}
                        className="fixed inset-0 z-[60] bg-white md:hidden overflow-y-auto"
                    >
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-sage-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-sage-700 font-bold border border-sage-200">
                                    {user ? (profile?.full_name?.[0] || 'U') : <User className="w-5 h-5" />}
                                </div>
                                <div>
                                    {user ? (
                                        <>
                                            <p className="font-bold text-sage-900">{profile?.full_name || 'User'}</p>
                                            <p className="text-xs text-stone-500">{user.email}</p>
                                        </>
                                    ) : (
                                        <div className="flex gap-2 text-sm font-bold text-sage-800">
                                            <Link to="/login" onClick={() => setIsOpen(false)}>Login</Link>
                                            <span>/</span>
                                            <Link to="/signup" onClick={() => setIsOpen(false)}>Signup</Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-2 bg-white rounded-full shadow-sm text-stone-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 space-y-6">
                            <div className="space-y-2">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.name}
                                        to={link.path}
                                        onClick={() => setIsOpen(false)}
                                        className="block py-2 text-base font-medium text-stone-700 hover:text-saffron-600 border-b border-gray-50"
                                    >
                                        {link.name}
                                    </Link>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Shop By Category</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {categories.map(cat => (
                                        <Link
                                            key={cat.id}
                                            to={`/shop?category=${cat.id}`}
                                            onClick={() => setIsOpen(false)}
                                            className="bg-gray-50 p-3 rounded-lg text-sm font-medium text-stone-700 hover:bg-saffron-50 hover:text-saffron-700 transition-colors"
                                        >
                                            {cat.name}
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2 pt-4 border-t border-gray-100">
                                <Link to="/orders" onClick={() => setIsOpen(false)} className="flex items-center gap-3 py-3 text-stone-700 font-medium">
                                    <ShoppingBag className="w-5 h-5 text-stone-400" /> My Orders
                                </Link>
                                <Link to="/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-3 py-3 text-stone-700 font-medium">
                                    <User className="w-5 h-5 text-stone-400" /> My Profile
                                </Link>
                                <Link to="/help" onClick={() => setIsOpen(false)} className="flex items-center gap-3 py-3 text-stone-700 font-medium">
                                    <HelpCircle className="w-5 h-5 text-stone-400" /> Need Help?
                                </Link>
                                {user && (
                                    <button
                                        onClick={() => { signOut(); setIsOpen(false); }}
                                        className="w-full flex items-center gap-3 py-3 text-red-600 font-medium text-left"
                                    >
                                        <ArrowLeft className="w-5 h-5 rotate-180" /> Sign Out
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Search Full Screen Overlay */}
            <AnimatePresence>
                {searchOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed inset-0 z-[70] bg-white md:hidden flex flex-col"
                    >
                        <div className="flex items-center gap-3 p-3 border-b border-gray-100 bg-white">
                            <button onClick={() => setSearchOpen(false)} className="p-2">
                                <ArrowLeft className="w-6 h-6 text-stone-600" />
                            </button>
                            <form onSubmit={handleSearch} className="flex-1 relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search products..."
                                    autoFocus
                                    className="w-full bg-gray-100 rounded-lg py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-200"
                                />
                                {searchQuery && (
                                    <button type="button" onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-stone-400">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </form>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            {/* Mobile Search Results or Suggestions (Simplified) */}
                            {searchQuery.length >= 2 ? (
                                <div className="space-y-4">
                                    {isSearching ? <div className="text-center text-sm text-stone-500">Searching...</div> : (
                                        searchResults.map(prod => (
                                            <Link key={prod.id} to={`/product/${prod.id}`} onClick={() => setSearchOpen(false)} className="flex gap-4 p-2 border-b border-gray-100">
                                                <img src={prod.image} className="w-12 h-12 rounded bg-gray-100 object-cover" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium line-clamp-2">{prod.name}</p>
                                                    <p className="text-xs font-bold text-saffron-600">₹{Math.round(prod.disc_price || prod.price)}</p>
                                                </div>
                                            </Link>
                                        ))
                                    )}
                                    {!isSearching && searchResults.length === 0 && <div className="text-center text-sm text-stone-500">No results</div>}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-xs font-bold text-stone-400 uppercase mb-3">Trending</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {trendingProducts.slice(0, 4).map(p => (
                                                <Link key={p.id} to={`/product/${p.id}`} onClick={() => setSearchOpen(false)} className="px-3 py-1 bg-gray-50 rounded-full text-xs text-stone-600 border border-gray-100">{p.name.substring(0, 20)}...</Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Prescription Upload Modal */}
            <PrescriptionUpload
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
            />
        </header >
    );
};

export default Navbar;
