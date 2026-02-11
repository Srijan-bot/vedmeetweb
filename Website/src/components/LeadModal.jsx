import React, { useState, useEffect } from 'react';
import { X, Phone, User } from 'lucide-react';
import { addLead } from '../lib/data';
import Button from './Button';
import { motion, AnimatePresence } from 'framer-motion';

const LeadModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({ name: '', phone: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const hasSeenModal = localStorage.getItem('leadModalSeen');
        if (!hasSeenModal) {
            const timer = setTimeout(() => {
                setIsOpen(true);
            }, 3000); // Show after 3 seconds
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem('leadModalSeen', 'true');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addLead(formData);
            setSubmitted(true);
            localStorage.setItem('leadModalSeen', 'true');
            setTimeout(() => {
                setIsOpen(false);
            }, 2000);
        } catch (error) {
            console.error("Error submitting lead:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full overflow-hidden"
                    >
                        {/* Decorative Background */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-saffron-500 to-sage-600" />

                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {!submitted ? (
                            <div className="space-y-6">
                                <div className="text-center">
                                    <h2 className="text-2xl font-serif font-bold text-sage-900 mb-2">Get Free Consultation</h2>
                                    <p className="text-stone-600 text-sm">
                                        Join over 10,000+ happy customers. Leave your details and our Vaidya will call you.
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Your Name"
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 border border-sage-200 rounded-xl focus:ring-2 focus:ring-sage-500 focus:border-sage-500 focus:outline-none transition-all"
                                        />
                                    </div>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                                            <Phone className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="tel"
                                            placeholder="Phone Number"
                                            required
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 border border-sage-200 rounded-xl focus:ring-2 focus:ring-sage-500 focus:border-sage-500 focus:outline-none transition-all"
                                        />
                                    </div>
                                    <Button type="submit" disabled={loading} className="w-full py-4 text-lg">
                                        {loading ? 'Submitting...' : 'Request Call Back'}
                                    </Button>
                                </form>
                                <p className="text-xs text-center text-stone-400">We respect your privacy. No spam, ever.</p>
                            </div>
                        ) : (
                            <div className="text-center py-8 space-y-4">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <User className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-serif font-bold text-sage-900">Thank You!</h3>
                                <p className="text-stone-600">Our expert will reach out to you shortly.</p>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default LeadModal;
