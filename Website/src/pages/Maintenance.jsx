import React from 'react';
import { useLocation } from 'react-router-dom';

const Maintenance = () => {
    return (
        <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4 text-center font-serif text-stone-800">
            <div className="max-w-md space-y-6">
                <div className="w-24 h-24 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-sage-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                </div>
                <h1 className="text-4xl font-bold text-sage-900 mb-2">We'll be back soon!</h1>
                <p className="text-xl text-stone-600">
                    Our website is currently undergoing scheduled maintenance. We should be back shortly.
                </p>
                <div className="pt-8">
                    <p className="text-sm text-stone-500">
                        &copy; {new Date().getFullYear()} Wedmeet. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Maintenance;
