import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LogIn, UserPlus, Leaf } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';

const AuthModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/20"
                    >
                        {/* Decorative Header Background */}
                        <div className="absolute top-0 left-0 right-0 h-32 bg-sage-900">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-saffron-500/10 rounded-full blur-3xl" />
                        </div>

                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-10 backdrop-blur-md"
                        >
                            <X size={20} />
                        </button>

                        <div className="relative pt-12 px-8 pb-8 text-center">
                            {/* Icon Badge */}
                            <div className="w-20 h-20 bg-white rounded-2xl shadow-xl mx-auto flex items-center justify-center text-sage-900 mb-6 relative z-10 transform rotate-3 border-4 border-white/50">
                                <Leaf size={40} className="text-saffron-500" />
                            </div>

                            <h2 className="text-2xl font-serif font-bold text-sage-900 mb-2">Welcome to VedMeet</h2>
                            <p className="text-stone-500 mb-8 leading-relaxed">
                                Join our community of wellness enthusiasts to shop for authentic ayurvedic products and exclusive remedies.
                            </p>

                            <div className="space-y-4">
                                <Button
                                    onClick={() => {
                                        navigate('/login');
                                        onClose();
                                    }}
                                    className="w-full h-14 bg-sage-900 hover:bg-sage-800 text-white rounded-xl shadow-lg shadow-sage-900/20 text-lg font-medium flex items-center justify-center gap-3"
                                >
                                    <LogIn size={20} />
                                    Login to Continue
                                </Button>

                                <div className="relative flex py-2 items-center">
                                    <div className="flex-grow border-t border-stone-200"></div>
                                    <span className="flex-shrink-0 mx-4 text-stone-400 text-xs uppercase tracking-wider font-bold">New Here?</span>
                                    <div className="flex-grow border-t border-stone-200"></div>
                                </div>

                                <Button
                                    onClick={() => {
                                        navigate('/signup');
                                        onClose();
                                    }}
                                    variant="outline"
                                    className="w-full h-14 border-2 border-sage-100 hover:border-sage-900 text-sage-900 hover:bg-white rounded-xl text-lg font-medium flex items-center justify-center gap-3"
                                >
                                    <UserPlus size={20} />
                                    Create Account
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AuthModal;
