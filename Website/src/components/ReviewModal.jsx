import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Star, X, Loader, Send } from 'lucide-react';

const ReviewModal = ({ isOpen, onClose, productId, onReviewSubmitted }) => {
    const { user } = useAuth();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            alert("Please select a star rating.");
            return;
        }
        if (!user) {
            alert("You must be logged in to leave a review.");
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from('product_reviews')
                .insert({
                    product_id: productId,
                    user_id: user.id,
                    rating: rating,
                    review_text: reviewText
                });

            if (error) throw error;

            onReviewSubmitted();
            onClose();
            setRating(0);
            setReviewText('');
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Failed to submit review. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-stone-100 rounded-full transition-colors"
                >
                    <X className="w-5 h-5 text-stone-500" />
                </button>

                <div className="p-8">
                    <h2 className="text-2xl font-serif font-bold text-sage-900 mb-2">Write a Review</h2>
                    <p className="text-stone-500 text-sm mb-6">Share your experience with this product.</p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Star Rating */}
                        <div className="flex flex-col items-center gap-2">
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        className="p-1 transition-transform hover:scale-110 focus:outline-none"
                                    >
                                        <Star
                                            size={32}
                                            className={`${(hoverRating || rating) >= star ? 'fill-saffron-400 text-saffron-400' : 'text-stone-200'} transition-colors`}
                                        />
                                    </button>
                                ))}
                            </div>
                            <span className="text-sm font-medium text-saffron-600 h-5">
                                {hoverRating ? ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][hoverRating - 1] : (rating ? ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating - 1] : '')}
                            </span>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-stone-700">Your Review</label>
                            <textarea
                                value={reviewText}
                                onChange={(e) => setReviewText(e.target.value)}
                                placeholder="What did you like or dislike?"
                                className="w-full p-4 border border-stone-200 rounded-xl focus:ring-2 focus:ring-sage-500 focus:border-sage-500 outline-none transition-all placeholder:text-stone-300 min-h-[120px] resize-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || rating === 0}
                            className="w-full py-3 px-4 bg-sage-900 text-white rounded-xl font-medium hover:bg-sage-800 focus:ring-4 focus:ring-sage-100 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-sage-900/20 hover:-translate-y-0.5"
                        >
                            {loading ? (
                                <>
                                    <Loader className="w-5 h-5 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    Submit Review
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ReviewModal;
