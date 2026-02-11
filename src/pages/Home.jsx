import React, { useEffect, useState } from 'react';
import { getProducts, getCategories } from '../lib/data';
import HeroSection from '../components/HeroSection';
import TrustElements from '../components/TrustElements';
import CategoryGrid from '../components/CategoryGrid';
import BestsellerSection from '../components/BestsellerSection';
import ComboSection from '../components/ComboSection';
import DealsSection from '../components/DealsSection';
import ConsultationBanner from '../components/ConsultationBanner';
import ProductRecommendations from '../components/ProductRecommendations';
import PageLoader from '../components/PageLoader';

const Home = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Fetch all products for now to distribute among sections
                // In a real app we would have specific endpoints
                const allProducts = await getProducts();
                setProducts(allProducts || []);
            } catch (error) {
                console.error("Failed to load home data", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) return <PageLoader />;

    // Derive data for sections
    const bestsellers = products.filter(p => p.rating >= 4.5 || p.reviews > 50).slice(0, 6);
    // Fallback if no specific bestsellers
    const displayBestsellers = bestsellers.length > 0 ? bestsellers : products.slice(0, 6);

    const deals = products.filter(p => p.discount_percentage > 0).slice(0, 10);
    const displayDeals = deals.length > 0 ? deals : products.slice(0, 10);

    return (
        <div className="bg-white min-h-screen pb-10">
            {/* 1. Hero Section */}
            <HeroSection />

            {/* 2. Trust Elements (Below Hero) */}
            <TrustElements />

            {/* 3. Shop by Health Concern */}
            <CategoryGrid />

            {/* 4. Bestseller Section */}
            <BestsellerSection products={displayBestsellers} />

            {/* 5. Complete Ayurvedic Care Kits (Combo) */}
            <ComboSection />

            {/* 6. Limited Time Deals */}
            <DealsSection products={displayDeals} />

            {/* 7. Recommended For You */}
            <div className="container mx-auto px-4 md:px-6 bg-stone-50/50 py-4 rounded-xl mt-8">
                <ProductRecommendations title="Recommended for You" limit={4} />
            </div>

            {/* 8. Doctor Consultation Banner */}
            <div className="mt-12">
                <ConsultationBanner />
            </div>
        </div>
    );
};

export default Home;
