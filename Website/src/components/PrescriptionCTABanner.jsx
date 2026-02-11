import React, { useState } from 'react';
import { Camera, Upload, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import PrescriptionUpload from './PrescriptionUpload';

const PrescriptionCTABanner = () => {
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="container mx-auto px-4 md:px-6 my-8"
            >
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-saffron-500 via-saffron-600 to-orange-600 shadow-lg">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-32 -translate-y-32"></div>
                        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-48 translate-y-48"></div>
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 p-6 md:p-8">
                        {/* Left: Icon + Text */}
                        <div className="flex items-center gap-4 md:gap-6 text-white flex-1">
                            <div className="hidden md:flex items-center justify-center w-16 h-16 bg-white/20 rounded-full backdrop-blur-sm">
                                <Camera className="w-8 h-8 text-white" />
                            </div>

                            <div className="text-center md:text-left">
                                <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
                                    <Zap className="w-5 h-5 fill-current" />
                                    <span className="text-xs font-bold uppercase tracking-wider opacity-90">Quick Order</span>
                                </div>
                                <h3 className="text-xl md:text-2xl font-bold mb-1">
                                    Upload Your Prescription
                                </h3>
                                <p className="text-sm md:text-base opacity-90">
                                    Get your medicines delivered fast. Just snap and upload!
                                </p>
                            </div>
                        </div>

                        {/* Right: CTA Button */}
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <button
                                onClick={() => setIsUploadOpen(true)}
                                className="group flex items-center gap-2 bg-white text-saffron-600 font-bold px-6 py-3 rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200"
                            >
                                <Upload className="w-5 h-5 group-hover:translate-y-[-2px] transition-transform" />
                                <span>Upload Now</span>
                            </button>

                            <div className="hidden sm:flex items-center gap-2 text-white/80 text-xs">
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                    <span>Safe & Secure</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Icon */}
                    <div className="md:hidden absolute top-4 right-4 opacity-20">
                        <Camera className="w-24 h-24 text-white" />
                    </div>
                </div>
            </motion.div>

            {/* Prescription Upload Modal */}
            <PrescriptionUpload
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
            />
        </>
    );
};

export default PrescriptionCTABanner;
