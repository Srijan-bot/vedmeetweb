import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import AuthModal from '../components/AuthModal';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X } from 'lucide-react';

const CartContext = createContext();

export const useCart = () => {
    return useContext(CartContext);
};

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    // Toast State
    const [toast, setToast] = useState({ show: false, message: '', image: null });

    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cartItems));
    }, [cartItems]);

    // Auto-hide toast
    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => {
                setToast(prev => ({ ...prev, show: false }));
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toast.show]);

    const showToastMessage = (message, image = null) => {
        setToast({ show: true, message, image });
    };

    const addToCart = (product, quantity = 1) => {
        if (!user) {
            setIsAuthModalOpen(true);
            return;
        }

        setCartItems(prevItems => {
            const existingItem = prevItems.find(item =>
                item.id === product.id && item.variantId === product.variantId
            );
            if (existingItem) {
                return prevItems.map(item =>
                    (item.id === product.id && item.variantId === product.variantId)
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [...prevItems, { ...product, quantity }];
        });

        // Show Toast
        showToastMessage(`Added ${product.name} to cart`, product.images?.[0] || product.image);

        // Only open drawer on desktop
        if (window.innerWidth >= 768) {
            setIsCartOpen(true);
        }
    };

    const removeFromCart = (productId, variantId) => {
        setCartItems(prevItems => prevItems.filter(item =>
            !(item.id === productId && item.variantId === variantId)
        ));
    };

    const updateQuantity = (productId, variantId, quantity) => {
        if (quantity < 1) return;
        setCartItems(prevItems =>
            prevItems.map(item =>
                (item.id === productId && item.variantId === variantId)
                    ? { ...item, quantity } : item
            )
        );
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const toggleCart = () => {
        setIsCartOpen(prev => !prev);
    };

    const cartSubtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
    const cartDiscount = cartItems.reduce((total, item) => total + (item.bundle_discount || 0) * item.quantity, 0);

    const cartTax = cartItems.reduce((total, item) => {
        const gstRate = item.gst_rate || 0;
        // Tax is usually on discounted price, but let's keep it simple or strictly on base price? 
        // User asked for "subtotal less bundle offer". Tax usually applies to final price.
        // Let's assume tax is on the price AFTER discount.
        const effectivePrice = Math.max(0, item.price - (item.bundle_discount || 0));
        return total + (effectivePrice * (gstRate / 100)) * item.quantity;
    }, 0);

    const cartTotal = cartSubtotal - cartDiscount + cartTax;
    const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            isCartOpen,
            setIsCartOpen,
            toggleCart,
            cartSubtotal, // Gross Total
            cartDiscount, // Total Discounts
            cartTax,      // Total GST
            cartTotal,    // Grand Total (Inclusive)
            cartCount
        }}>
            {children}
            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

            {/* Mobile Toast Notification */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="fixed bottom-24 left-4 right-4 md:bottom-8 md:right-8 md:left-auto md:w-96 z-50 pointer-events-none"
                    >
                        <div className="bg-sage-900 text-white p-4 rounded-xl shadow-xl flex items-center gap-4 pointer-events-auto border border-sage-700/50 backdrop-blur-md bg-opacity-95">
                            {toast.image ? (
                                <div className="w-10 h-10 bg-white rounded-lg overflow-hidden shrink-0">
                                    <img src={toast.image} alt="" className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center shrink-0">
                                    <CheckCircle className="w-6 h-6" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm truncate">{toast.message}</p>
                                <p className="text-xs text-sage-300">View cart to checkout</p>
                            </div>
                            <button
                                onClick={() => setIsCartOpen(true)}
                                className="text-xs font-bold bg-white text-sage-900 px-3 py-1.5 rounded-lg hover:bg-sage-100 transition-colors whitespace-nowrap"
                            >
                                View Cart
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </CartContext.Provider>
    );
};
