import React from 'react';
import { Link } from 'react-router-dom';
import { Tag, ArrowRight } from 'lucide-react';
import Button from './Button';
import ProductCard from './ProductCard';

const DealsSection = ({ products = [] }) => {
    return (
        <section className="py-12 bg-white border-t border-stone-100">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h2 className="text-xl md:text-3xl font-serif font-bold text-sage-900">Limited Time Deals</h2>
                    <Link to="/shop" className="text-red-600 font-bold hover:underline flex items-center gap-1 text-sm md:text-base">
                        View All <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Horizontal Scroll Container */}
                <div className="flex overflow-x-auto gap-3 pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                    {products.map((product) => (
                        <div key={product.id} className="min-w-[160px] w-[160px] md:min-w-[240px] snap-start flex-shrink-0">
                            <div className="relative border border-red-100 rounded-lg p-2 md:p-3 bg-white h-full flex flex-col hover:shadow-md transition-shadow">
                                <ProductCard product={product} className="border-none shadow-none bg-transparent p-0" />
                            </div>
                        </div>
                    ))}

                    {/* View All Card */}
                    <Link to="/shop?sort=discount" className="min-w-[150px] flex items-center justify-center bg-stone-50 rounded-lg text-stone-500 hover:bg-stone-100 hover:text-green-700 transition-colors snap-start">
                        <span className="font-medium flex flex-col items-center gap-2">
                            <Tag className="w-6 h-6" />
                            View All Deals
                        </span>
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default DealsSection;
