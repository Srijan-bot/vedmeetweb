import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Heart, Brain, Utensils, Shield, Sun, Droplet, UserCheck } from 'lucide-react';

const categories = [
    { title: 'Digestion', icon: Utensils, count: '120+ Products', id: 'digestion' },
    { title: 'Hair Care', icon: UserCheck, count: '85+ Products', id: 'hair-care' },
    { title: 'Immunity', icon: Shield, count: '50+ Products', id: 'immunity' },
    { title: 'Joint Care', icon: Activity, count: '40+ Products', id: 'joint-care' },
    { title: 'Stress Relief', icon: Brain, count: '30+ Products', id: 'stress-relief' },
    { title: 'Diabetes Care', icon: Droplet, count: '25+ Products', id: 'diabetes' },
    { title: 'Skin Care', icon: Sun, count: '90+ Products', id: 'skincare' },
    { title: 'Heart Care', icon: Heart, count: '15+ Products', id: 'heart-care' },
];

const CategoryGrid = () => {
    return (
        <section className="py-12 bg-white">
            <div className="container mx-auto px-4 md:px-6">
                <div className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-serif font-bold text-sage-900">Shop by Health Concern</h2>
                    <p className="text-stone-500 mt-2">Find the right ayurvedic solution for your needs</p>
                </div>

                {/* Desktop Layout (Linear Carousel) */}
                <div className="hidden md:flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory scrollbar-hide">
                    {categories.map((cat, idx) => (
                        <div key={idx} className="min-w-[240px] w-1/4 snap-start flex-shrink-0">
                            <Link
                                to={`/shop?category=${cat.id}`}
                                className="group bg-white border border-stone-100 rounded-xl p-6 flex flex-col items-center text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full"
                            >
                                <div className="w-14 h-14 rounded-full bg-green-50 text-green-700 flex items-center justify-center mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
                                    <cat.icon className="w-7 h-7" />
                                </div>

                                <h3 className="font-bold text-lg text-sage-900 mb-1 group-hover:text-green-700 transition-colors whitespace-nowrap">{cat.title}</h3>
                                <p className="text-xs text-stone-400 font-medium mb-4">{cat.count}</p>

                                <span className="text-xs font-bold text-green-600 uppercase tracking-wider opacity-0 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                    Explore
                                </span>
                            </Link>
                        </div>
                    ))}
                </div>

                {/* Mobile Layout (Paged 2x2 Grid Carousel) */}
                <div className="md:hidden flex overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 -mx-4 px-4">
                    {Array.from({ length: Math.ceil(categories.length / 4) }).map((_, pageIdx) => (
                        <div key={pageIdx} className="min-w-full snap-center grid grid-cols-2 grid-rows-2 gap-3 pr-4 last:pr-0">
                            {categories.slice(pageIdx * 4, (pageIdx + 1) * 4).map((cat, idx) => (
                                <Link
                                    key={idx}
                                    to={`/shop?category=${cat.id}`}
                                    className="group bg-white border border-stone-100 rounded-xl p-4 flex flex-col items-center text-center shadow-sm h-full justify-center"
                                >
                                    <div className="w-10 h-10 rounded-full bg-green-50 text-green-700 flex items-center justify-center mb-2">
                                        <cat.icon className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-bold text-sm text-sage-900 leading-tight">{cat.title}</h3>
                                    <p className="text-[10px] text-stone-400 font-medium">{cat.count}</p>
                                </Link>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default CategoryGrid;
