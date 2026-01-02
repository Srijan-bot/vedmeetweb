import React from 'react';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import Button from './Button';
import { useNavigate } from 'react-router-dom';

const CartDrawer = () => {
    const { isCartOpen, setIsCartOpen, cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();
    const navigate = useNavigate();

    const handleCheckout = () => {
        setIsCartOpen(false);
        navigate('/checkout');
    };

    return (
        <AnimatePresence>
            {isCartOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsCartOpen(false)}
                        className="fixed inset-0 bg-black z-40"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'tween', duration: 0.3 }}
                        className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-sage-100">
                            <h2 className="text-xl font-serif font-bold text-sage-900 flex items-center gap-2">
                                <ShoppingBag className="h-5 w-5" />
                                Your Cart
                            </h2>
                            <button
                                onClick={() => setIsCartOpen(false)}
                                className="p-2 hover:bg-sage-50 rounded-full transition-colors text-stone-500"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Cart Items */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {cartItems.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-stone-500 space-y-4">
                                    <ShoppingBag className="h-12 w-12 opacity-20" />
                                    <p>Your cart is empty</p>
                                    <Button variant="outline" onClick={() => setIsCartOpen(false)}>
                                        Continue Shopping
                                    </Button>
                                </div>
                            ) : (
                                cartItems.map((item) => (
                                    <div key={item.id} className="flex gap-4 p-4 bg-sage-50/50 rounded-xl">
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-20 h-20 object-cover rounded-md bg-white"
                                        />
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <h3 className="font-medium text-sage-900 line-clamp-1">{item.name}</h3>
                                                <p className="text-sm text-stone-500">Rs. {item.price.toFixed(2)}</p>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center border border-sage-200 rounded-md bg-white">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="p-1 hover:bg-sage-50 text-sage-600"
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </button>
                                                    <span className="px-2 text-sm font-medium text-stone-700">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="p-1 hover:bg-sage-50 text-sage-600"
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="text-red-400 hover:text-red-500 p-1"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {cartItems.length > 0 && (
                            <div className="p-4 border-t border-sage-100 bg-sage-50/30 space-y-4">
                                <div className="flex items-center justify-between text-lg font-bold text-sage-900">
                                    <span>Subtotal</span>
                                    <span>Rs. {cartTotal.toFixed(2)}</span>
                                </div>
                                <p className="text-xs text-stone-500 text-center">
                                    Shipping and taxes calculated at checkout
                                </p>
                                <Button onClick={handleCheckout} className="w-full py-3 text-lg shadow-lg">
                                    Checkout
                                </Button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CartDrawer;
