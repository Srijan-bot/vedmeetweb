import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ProductCard from './ProductCard';

const BestsellerSection = ({ products = [] }) => {
    return (
        <section className="py-16 bg-white border-t border-stone-100">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-serif font-bold text-sage-900">Top Rated Bestsellers</h2>
                        <p className="text-stone-500 mt-1">Most loved products by our customers</p>
                    </div>
                    <Link to="/shop" className="hidden md:flex items-center gap-2 text-green-700 font-medium hover:text-green-800 transition-colors">
                        View All <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {products.slice(0, 6).map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>

                <div className="mt-8 text-center md:hidden">
                    <Link to="/shop" className="inline-flex items-center gap-2 text-green-700 font-medium">
                        View All Products <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default BestsellerSection;
