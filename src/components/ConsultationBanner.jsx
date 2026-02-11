import React from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';
import { Stethoscope } from 'lucide-react';

const ConsultationBanner = () => {
    return (
        <section className="py-16 bg-gradient-to-r from-sage-800 to-sage-900 text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
                    <div className="text-center md:text-left space-y-4 max-w-2xl">
                        <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-sm font-medium text-green-100 w-fit mx-auto md:mx-0">
                            <Stethoscope className="w-4 h-4" />
                            <span>Expert Ayurvedic Guidance</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-serif font-bold">
                            Not Sure Which Medicine to Choose?
                        </h2>
                        <p className="text-lg text-sage-200">
                            Get personalized recommendations from our certified Ayurvedic practitioners. Free minimal consultation available.
                        </p>
                    </div>

                    <div className="flex-shrink-0">
                        <Link to="/consultation">
                            <Button size="lg" className="bg-white text-sage-900 hover:bg-gray-100 px-8 py-6 text-lg font-bold rounded-full shadow-xl">
                                Book Free Consultation
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ConsultationBanner;
