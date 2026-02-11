import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, ShoppingCart, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { cn } from '../lib/utils';
import Button from './Button';

const ProductCard = ({ product, className }) => {
    const { addToCart } = useCart();

    // Safety check for product data
    if (!product) return null;

    const {
        id,
        name,
        image,
        rating = 0,
        reviews = 0,
        price = 0,
        disc_price = 0,
        discount_percentage = 0
    } = product;

    const finalPrice = disc_price > 0 ? disc_price : price;
    const originalPrice = price;
    const hasDiscount = discount_percentage > 0;

    return (
        <div className={cn("group bg-white rounded-lg border border-stone-100 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full", className)}>
            {/* Image Container */}
            <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
                <Link to={`/product/${id}`}>
                    <img
                        src={image}
                        alt={name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                </Link>

                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {hasDiscount && (
                        <span className="bg-red-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm">
                            -{Math.round(discount_percentage)}%
                        </span>
                    )}
                </div>

                {/* Wishlist Button (Top Right) */}
                <button
                    className="absolute top-2 right-2 p-2 rounded-full bg-white/80 text-stone-400 hover:text-red-500 hover:bg-white transition-colors"
                    title="Add to Wishlist"
                >
                    <Heart className="w-4 h-4" />
                </button>

                {/* Quick Add Button (Visible on Hover in Desktop, always on Mobile if needed, but per design usually distinct) */}
                {/* The prompt requests a specific structure: [Add] button at bottom, but let's stick to the prompt's layout request which puts [Add] at bottom. */}
            </div>

            {/* Content */}
            <div className="p-3 flex flex-col flex-1">
                {/* Title */}
                <Link to={`/product/${id}`}>
                    <h3 className="text-sm font-medium text-stone-800 line-clamp-2 mb-1 group-hover:text-saffron-600 transition-colors py-1 h-10 leading-tight">
                        {name}
                    </h3>
                </Link>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-2">
                    <div className="bg-green-700 text-white text-[10px] font-bold px-1 py-0.5 rounded flex items-center gap-0.5">
                        {rating.toFixed(1)} <Star className="w-2.5 h-2.5 fill-white" />
                    </div>
                    <span className="text-xs text-stone-400">({reviews.toLocaleString()})</span>
                </div>

                {/* Price */}
                <div className="mt-auto flex items-center justify-between">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-stone-900">₹{Math.round(finalPrice)}</span>
                            {hasDiscount && (
                                <span className="text-xs text-stone-400 line-through">₹{Math.round(originalPrice)}</span>
                            )}
                        </div>
                        <span className="text-[10px] text-green-700 font-medium">Free Delivery</span>
                    </div>
                </div>

                {/* Add to Cart Button - Bottom Full or small? Prompt says "Small green Add button". Can be inline or block.
                   Design prompt:
                   [ Add ] [ Wishlist Icon ] -- This suggests a row at bottom. 
                   But Wishlist is often top right. Let's follow "Small green Add button" at bottom right or full width. 
                   Amazon style usually wants a clear "Add to Cart". 
                   Let's make a distinct Add button.
                */}
                <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                    <Button
                        onClick={(e) => {
                            e.preventDefault();
                            addToCart(product);
                        }}
                        size="sm"
                        className="flex-1 bg-green-700 hover:bg-green-800 text-white text-xs font-medium rounded h-8"
                    >
                        Add to Cart
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
