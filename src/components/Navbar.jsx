import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingBag, Menu, X, Search, User, FileText, ArrowLeft, History } from 'lucide-react';
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
    const [searchOpen, setSearchOpen] = useState(false);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { cartCount, toggleCart } = useCart();
    const { user, profile, loading, signOut } = useAuth();
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);

    const [searchResults, setSearchResults] = useState([]);
    const [trendingProducts, setTrendingProducts] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    React.useEffect(() => {
        const loadData = async () => {
            const cats = await getCategories();
            setCategories(cats || []);

            const trending = await getTrendingProducts(6);
            setTrendingProducts(trending || []);
        };
        loadData();
    }, []);

    // Real-time search effect
    React.useEffect(() => {
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
            setSearchOpen(false);
        }
    };

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Shop', path: '/shop' },
        { name: 'About', path: '/about' },
        { name: 'Contact', path: '/contact' },
        { name: 'Blog', path: '/blog' },
        { name: 'Consult a Doctor', path: '/book-appointment' },
    ];

    return (
        <nav className="sticky top-0 z-50 w-full bg-cream/80 backdrop-blur-md border-b border-sage-100">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex h-20 md:h-36 items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <img src={logoFull} alt="Vedmeet" className="h-12 md:h-32 w-auto" />
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        <Link to="/" className="text-sm font-medium text-stone-600 hover:text-sage-600 transition-colors">Home</Link>

                        {/* Shop Dropdown */}
                        <div className="group relative">
                            <Link to="/shop" className="text-sm font-medium text-stone-600 hover:text-sage-600 transition-colors py-4">
                                Shop
                            </Link>
                            <div className="invisible group-hover:visible absolute top-full left-0 w-48 bg-cream border border-sage-100 shadow-lg rounded-md py-2 overflow-hidden z-50 transition-all opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0">
                                {categories.length > 0 ? (
                                    categories.map(cat => (
                                        <Link key={cat.id} to={`/shop?category=${cat.id}`} className="block px-4 py-2 text-sm text-stone-600 hover:bg-sage-50 hover:text-sage-700">
                                            {cat.name}
                                        </Link>
                                    ))
                                ) : (
                                    <span className="block px-4 py-2 text-sm text-stone-400">Loading...</span>
                                )}
                            </div>
                        </div>

                        {/* Health Concerns Dropdown */}
                        <div className="group relative">
                            <span className="text-sm font-medium text-stone-600 hover:text-sage-600 transition-colors cursor-pointer py-4">
                                Health Concerns
                            </span>
                            <div className="invisible group-hover:visible absolute top-full left-0 w-48 bg-cream border border-sage-100 shadow-lg rounded-md py-2 overflow-hidden z-50 transition-all opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0">
                                <Link to="/shop?concern=digestion" className="block px-4 py-2 text-sm text-stone-600 hover:bg-sage-50 hover:text-sage-700">Digestion</Link>
                                <Link to="/shop?concern=immunity" className="block px-4 py-2 text-sm text-stone-600 hover:bg-sage-50 hover:text-sage-700">Immunity</Link>
                                <Link to="/shop?concern=stress" className="block px-4 py-2 text-sm text-stone-600 hover:bg-sage-50 hover:text-sage-700">Stress & Sleep</Link>
                            </div>
                        </div>

                        <Link to="/blog" className="text-sm font-medium text-stone-600 hover:text-sage-600 transition-colors">Blog</Link>
                        <Link to="/consultation" className="text-sm font-medium text-stone-600 hover:text-sage-600 transition-colors">Consult a Doctor</Link>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                        {/* Upload Prescription */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsUploadOpen(true)}
                            title="Upload Prescription"
                        >
                            <FileText className="h-5 w-5" />
                        </Button>

                        {/* Search - Desktop Expanding */}
                        <div className="hidden md:flex relative items-center group">
                            <AnimatePresence>
                                {searchOpen && (
                                    <>
                                        <motion.form
                                            initial={{ width: 0, opacity: 0 }}
                                            animate={{ width: 300, opacity: 1 }}
                                            exit={{ width: 0, opacity: 0 }}
                                            onSubmit={handleSearch}
                                            className="absolute right-10 top-1/2 -translate-y-1/2 overflow-visible z-20"
                                        >
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Search products..."
                                                className="w-full px-4 py-2 text-sm border border-sage-200 rounded-full focus:outline-none focus:border-saffron-400 bg-white shadow-sm pr-8"
                                                autoFocus
                                            />

                                            {/* Desktop Search Dropdown */}
                                            {searchOpen && (
                                                <div className="absolute top-12 right-0 w-full min-w-[300px] bg-white rounded-xl shadow-xl border border-sage-100 overflow-hidden py-2 z-50" onClick={(e) => e.stopPropagation()}>
                                                    {console.log('Search Render:', { searchQuery, res: searchResults.length, trend: trendingProducts.length })}
                                                    {searchQuery.length < 2 ? (
                                                        <div className="p-4">
                                                            <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Trending Now</h4>
                                                            <div className="grid grid-cols-1 gap-3">
                                                                {trendingProducts.map(prod => (
                                                                    <Link
                                                                        key={prod.id}
                                                                        to={`/product/${prod.id}`}
                                                                        onClick={() => setSearchOpen(false)}
                                                                        className="flex items-center gap-3 hover:bg-sage-50 p-2 rounded-lg transition-colors group/item"
                                                                    >
                                                                        <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                                                                            <img src={prod.image} alt="" className="w-full h-full object-cover" />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-sm font-medium text-sage-900 group-hover/item:text-saffron-600 truncate">{prod.name}</p>
                                                                            <p className="text-xs text-stone-500 truncate">{prod.brand}</p>
                                                                        </div>
                                                                    </Link>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="max-h-[60vh] overflow-y-auto">
                                                            {isSearching ? (
                                                                <div className="p-4 text-center text-sm text-stone-500">Searching...</div>
                                                            ) : searchResults.length > 0 ? (
                                                                searchResults.map(prod => (
                                                                    <Link
                                                                        key={prod.id}
                                                                        to={`/product/${prod.id}`}
                                                                        onClick={() => {
                                                                            setSearchQuery('');
                                                                            setSearchOpen(false);
                                                                        }}
                                                                        className="flex items-center gap-4 px-4 py-3 hover:bg-sage-50 transition-colors border-b border-gray-50 last:border-0 group/item"
                                                                    >
                                                                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                                                                            <img src={prod.image} alt="" className="w-full h-full object-cover" />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-sm font-medium text-sage-900 group-hover/item:text-saffron-600 truncate">{prod.name}</p>
                                                                            <div className="flex justify-between items-center mt-0.5">
                                                                                <p className="text-xs text-stone-500 truncate">{prod.category && prod.category[0]}</p>
                                                                                <span className="text-xs font-bold text-sage-800">₹{Math.round(prod.disc_price || prod.price)}</span>
                                                                            </div>
                                                                        </div>
                                                                    </Link>
                                                                ))
                                                            ) : (
                                                                <div className="p-8 text-center">
                                                                    <p className="text-sm text-stone-500">No products found for "{searchQuery}"</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </motion.form>
                                    </>
                                )}
                            </AnimatePresence>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSearchOpen(!searchOpen)}
                                className={cn(searchOpen ? "bg-sage-50 text-sage-900" : "")}
                            >
                                <Search className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Search - Mobile Trigger */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setSearchOpen(true)}
                        >
                            <Search className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="relative" onClick={toggleCart}>
                            <ShoppingBag className="h-5 w-5" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-earth-500 text-[10px] font-bold text-white flex items-center justify-center">
                                    {cartCount}
                                </span>
                            )}
                        </Button>

                        {/* User Profile / Login - Desktop Only */}
                        <div className="hidden md:block">
                            {loading ? (
                                <div className="h-8 w-8 rounded-full bg-sage-100 animate-pulse"></div>
                            ) : user ? (
                                <div className="relative group">
                                    <Link to="/profile" className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-sage-100 flex items-center justify-center text-sage-700 font-bold border border-sage-200">
                                            {profile?.full_name ? profile.full_name[0].toUpperCase() : <User className="h-5 w-5" />}
                                        </div>
                                    </Link>
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-sage-100 rounded-lg shadow-lg py-1 hidden group-hover:block">
                                        <div className="px-4 py-2 border-b border-sage-50">
                                            <p className="text-sm font-semibold text-stone-800 truncate">{profile?.full_name || 'User'}</p>
                                            <p className="text-xs text-stone-500 truncate">{user.email}</p>
                                        </div>
                                        <Link to="/profile" className="block px-4 py-2 text-sm text-stone-600 hover:bg-sage-50">Edit Profile</Link>
                                        <button
                                            onClick={signOut}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                        >
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <Link to="/login">
                                    <Button size="sm" variant="outline">Login</Button>
                                </Link>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setIsOpen(!isOpen)}
                        >
                            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden border-t border-sage-100 bg-cream"
                    >
                        <div className="container mx-auto px-4 py-6 flex flex-col gap-6">
                            <div className="flex flex-col gap-2">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        className="text-lg font-serif font-medium text-stone-600 hover:text-sage-800 hover:bg-sage-50 px-4 py-3 rounded-xl transition-colors"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        {link.name}
                                    </Link>
                                ))}

                                <div className="border-t border-sage-200 mt-2 pt-4">
                                    {user ? (
                                        <>
                                            <div className="px-4 mb-2">
                                                <p className="text-sm font-bold text-sage-900">{profile?.full_name}</p>
                                                <p className="text-xs text-stone-500">{user.email}</p>
                                            </div>
                                            <Link to="/profile" className="block px-4 py-2 text-lg font-serif font-medium text-stone-600" onClick={() => setIsOpen(false)}>My Profile</Link>
                                            <button onClick={() => { signOut(); setIsOpen(false); }} className="w-full text-left block px-4 py-2 text-lg font-serif font-medium text-red-500">Sign Out</button>
                                        </>
                                    ) : (
                                        <Link to="/login" className="block px-4 py-2 text-lg font-serif font-medium text-sage-900" onClick={() => setIsOpen(false)}>Login / Signup</Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Search Overlay */}
            <AnimatePresence>
                {searchOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed inset-0 z-[9999] md:hidden flex flex-col bg-white"
                        style={{ backgroundColor: '#ffffff', height: '100vh', width: '100vw' }}
                    >
                        <div className="flex items-center gap-3 p-4 border-b border-sage-100 bg-white">
                            <button onClick={() => setSearchOpen(false)} className="text-stone-500 p-1">
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <form onSubmit={handleSearch} className="flex-1 relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search for products, brands..."
                                    className="w-full bg-sage-50 text-sage-900 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-200 placeholder:text-sage-300 text-sm font-medium"
                                    autoFocus
                                />
                                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-saffron-600">
                                    <Search className="w-4 h-4" />
                                </button>
                            </form>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 bg-white">
                            {/* Suggestions or Recent */}
                            {searchQuery.length < 2 ? (
                                <>
                                    <div className="mb-6">
                                        <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3 px-1">Trending Products</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            {trendingProducts.map(prod => (
                                                <Link
                                                    key={prod.id}
                                                    to={`/product/${prod.id}`}
                                                    onClick={() => setSearchOpen(false)}
                                                    className="bg-white p-2 rounded-lg border border-sage-100 shadow-sm flex flex-col gap-2"
                                                >
                                                    <div className="bg-gray-100 aspect-square rounded-md overflow-hidden">
                                                        <img src={prod.image} className="w-full h-full object-cover" alt="" />
                                                    </div>
                                                    <p className="text-xs font-bold text-sage-900 line-clamp-2">{prod.name}</p>
                                                    <p className="text-xs text-saffron-600 font-bold">₹{Math.round(prod.disc_price || prod.price)}</p>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3 px-1">Popular Keywords</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {['Ashwagandha', 'Hair Oil', 'Chyawanprash', 'Triphala', 'Face Serum'].map(tag => (
                                                <button
                                                    key={tag}
                                                    onClick={() => {
                                                        setSearchQuery(tag);
                                                        // navigate(`/shop?search=${encodeURIComponent(tag)}`); 
                                                    }}
                                                    className="px-3 py-1.5 bg-white border border-sage-100 rounded-full text-sm text-sage-700 hover:border-saffron-300 hover:text-saffron-700 transition-colors shadow-sm"
                                                >
                                                    <span className="flex items-center gap-1"><Search className="w-3 h-3 text-stone-300" /> {tag}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3 px-1">Popular Categories</h4>
                                        <div className="space-y-1">
                                            {categories.slice(0, 5).map(cat => (
                                                <Link
                                                    key={cat.id}
                                                    to={`/shop?category=${cat.id}`}
                                                    onClick={() => setSearchOpen(false)}
                                                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-transparent hover:border-sage-100 active:bg-sage-50"
                                                >
                                                    <span className="text-sm font-medium text-sage-800">{cat.name}</span>
                                                    <ArrowLeft className="w-4 h-4 text-stone-300 rotate-180" />
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3 px-1">Search Results</h4>
                                    {isSearching ? (
                                        <div className="flex justify-center py-8">
                                            <div className="w-6 h-6 border-2 border-sage-200 border-t-saffron-500 rounded-full animate-spin" />
                                        </div>
                                    ) : searchResults.length > 0 ? (
                                        searchResults.map(prod => (
                                            <Link
                                                key={prod.id}
                                                to={`/product/${prod.id}`}
                                                onClick={() => {
                                                    setSearchQuery('');
                                                    setSearchOpen(false);
                                                }}
                                                className="flex items-center gap-4 p-3 bg-white rounded-xl border border-sage-100 shadow-sm mb-2"
                                            >
                                                <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                                    <img src={prod.image} alt="" className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-sage-900 line-clamp-2">{prod.name}</p>
                                                    <div className="flex justify-between items-center mt-1">
                                                        <span className="text-xs text-stone-500">{prod.brand}</span>
                                                        <span className="text-sm font-bold text-saffron-600">₹{Math.round(prod.disc_price || prod.price)}</span>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))
                                    ) : (
                                        <div className="text-center py-10 text-stone-500">
                                            No products found matching "{searchQuery}"
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <PrescriptionUpload
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                onUploadComplete={() => {
                    // navigate('/prescriptions') // Optional: Redirect to prescriptions page after upload
                }}
            />
        </nav>
    );
};

export default Navbar;
