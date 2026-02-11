import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from './Button';
import heroImg from '../assets/hero.png'; // Make sure this exists, or use a placeholder if needed

const HeroSection = () => {
    return (
        <section className="relative bg-cream overflow-hidden">
            <div className="container mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-20 lg:py-24">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

                    {/* Left Side: Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="space-y-6 md:space-y-8 z-10"
                    >
                        <div>
                            <span className="inline-block py-1 px-3 mb-4 rounded-full bg-green-100 text-green-800 text-xs font-bold tracking-widest uppercase">
                                100% Natural & Authentic
                            </span>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-sage-900 leading-tight">
                                Authentic Ayurvedic Medicines Delivered to Your Doorstep
                            </h1>
                            <p className="text-lg text-stone-600 max-w-lg pt-4">
                                100% Genuine Products | Doctor Consultation Available | Fast Delivery
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link to="/shop">
                                <Button size="lg" className="w-full sm:w-auto bg-green-800 hover:bg-green-900 text-white rounded-md px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all">
                                    Shop Medicines
                                </Button>
                            </Link>
                            <Link to="/consultation">
                                <Button size="lg" variant="outline" className="w-full sm:w-auto border-green-800 text-green-800 hover:bg-green-50 rounded-md px-8 py-6 text-lg">
                                    Consult Doctor
                                </Button>
                            </Link>
                        </div>

                        <div className="pt-6 flex items-center gap-6 text-sm text-stone-500 font-medium">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                50+ Top Brands
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                Expert Verified
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Side: Visual */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="relative"
                    >
                        {/* Background blobs or accent shapes can go here */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-green-900/5 rounded-full blur-3xl -z-10" />

                        <img
                            src={heroImg}
                            alt="Ayurvedic Medicines"
                            className="w-full h-auto object-contain drop-shadow-2xl relative z-10 transform md:scale-110"
                        />
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
