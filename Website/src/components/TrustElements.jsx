import React from 'react';
import { ShieldCheck, Truck, CreditCard, RefreshCw } from 'lucide-react';

const TrustElements = () => {
    const badges = [
        { icon: ShieldCheck, title: "100% Authentic Products", subtitle: "Sourced directly from brands" },
        { icon: Truck, title: "Fast Delivery", subtitle: "Shipping across India" },
        { icon: CreditCard, title: "Secure Payment", subtitle: "100% safe transactions" },
        { icon: RefreshCw, title: "Easy Returns", subtitle: "Hassle-free policy" },
        { icon: CreditCard, title: "COD Available", subtitle: "Pay on delivery" }, // Reusing Note Icon or similar if specific COD icon not available
    ];

    return (
        <section className="bg-stone-50 border-y border-stone-100 py-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-2 md:flex md:flex-wrap md:justify-between gap-4 md:gap-4">
                    {badges.map((badge, idx) => (
                        <div key={idx} className="flex items-center gap-2 md:gap-3 md:min-w-0">
                            <div className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center text-green-700 shadow-sm flex-shrink-0">
                                <badge.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-xs md:text-sm text-sage-900">{badge.title}</h4>
                                <p className="text-[10px] md:text-xs text-stone-500">{badge.subtitle}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TrustElements;
