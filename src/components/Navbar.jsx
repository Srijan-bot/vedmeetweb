import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingBag, Menu, X, Search, User, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';
import { cn } from '../lib/utils';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
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
                                <Link to="/shop?category=single-herbs" className="block px-4 py-2 text-sm text-stone-600 hover:bg-sage-50 hover:text-sage-700">Single Herbs</Link>
                                <Link to="/shop?category=wellness-kits" className="block px-4 py-2 text-sm text-stone-600 hover:bg-sage-50 hover:text-sage-700">Wellness Kits</Link>
                                <Link to="/shop?category=skincare" className="block px-4 py-2 text-sm text-stone-600 hover:bg-sage-50 hover:text-sage-700">Skincare</Link>
                                <Link to="/shop?category=haircare" className="block px-4 py-2 text-sm text-stone-600 hover:bg-sage-50 hover:text-sage-700">Haircare</Link>
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

                        <div className="relative">
                            <AnimatePresence>
                                {searchOpen && (
                                    <motion.form
                                        initial={{ width: 0, opacity: 0 }}
                                        animate={{ width: 200, opacity: 1 }}
                                        exit={{ width: 0, opacity: 0 }}
                                        onSubmit={handleSearch}
                                        className="absolute right-10 top-1/2 -translate-y-1/2 overflow-hidden z-50"
                                    >
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search..."
                                            className="w-full px-3 py-1 text-sm border border-sage-200 rounded-full focus:outline-none focus:border-sage-400 bg-white shadow-sm"
                                            autoFocus
                                        />
                                    </motion.form>
                                )}
                            </AnimatePresence>
                            <Button variant="ghost" size="icon" onClick={() => setSearchOpen(!searchOpen)}>
                                <Search className="h-5 w-5" />
                            </Button>
                        </div>
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
