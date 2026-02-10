import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Star, Truck, ShieldCheck, Leaf, Heart, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import { getProducts, getSiteSettings, getCategories, getBlogs, getBrands } from '../lib/data';
import { FileText, Stethoscope } from 'lucide-react';
import LeadModal from '../components/LeadModal';
import { useCart } from '../context/CartContext';
import heroImg from '../assets/hero.png';
import goldenSeal from '../assets/golden-seal.png';

const Home = () => {
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [blogs, setBlogs] = useState([]);
    const [heroData, setHeroData] = useState({
        hero_title: 'Pure Ayurveda,\nDelivered.',
        hero_subtitle: 'Authentic Ayurvedic remedies from India\'s most trusted brands, delivered to your doorstep.'
    });
    const { addToCart } = useCart();
    const [activeTestimonial, setActiveTestimonial] = useState(0);

    useEffect(() => {
        const loadData = async () => {
            const products = await getProducts();
            // Sort by popularity or just take first 4 for now
            setFeaturedProducts(products.slice(0, 4));

            const cats = await getCategories();
            setCategories(cats || []);

            const brandData = await getBrands();
            setBrands(brandData || []);

            const blogPosts = await getBlogs();
            setBlogs(blogPosts.slice(0, 3));

            const settings = await getSiteSettings();
            if (settings.hero_title) {
                setHeroData(prev => ({ ...prev, ...settings }));
            }
        };
        loadData();
    }, []);

    const testimonials = [
        { name: "Priya S.", text: "I love that I can find all my favorite authentic ayurvedic brands in one place. Fast delivery too!", role: "Yoga Instructor" },
        { name: "Rahul M.", text: "Finally, a platform that curates genuine products. I don't have to worry about counterfeits anymore.", role: "Software Engineer" },
        { name: "Anjali K.", text: "Their selection is amazing. Helped me find the perfect oil for my joint pain.", role: "Homemaker" }
    ];

    return (
        <div className="bg-cream">
            <LeadModal />

            {/* Hero Section - Full Viewport */}
            <section className="relative h-[90vh] flex items-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        src={heroImg}
                        alt="Ayurvedic Wellness"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 w-full h-full" />
                    {/* Gradient Overlay for Text Readability */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
                </div>

                <div className="relative z-10 container mx-auto px-6 md:px-12 pt-20">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="max-w-3xl space-y-8"
                    >
                        <span className="inline-block py-1 px-3 border border-white/30 rounded-full text-white/90 text-sm tracking-widest uppercase backdrop-blur-sm">
                            India's Premium Ayurveda Marketplace
                        </span>
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-white leading-[1.1] drop-shadow-lg">
                            {heroData.hero_title}
                        </h1>
                        <p className="text-lg md:text-xl text-white/90 max-w-xl font-light leading-relaxed drop-shadow-md">
                            {heroData.hero_subtitle}
                        </p>
                        <div className="flex items-center gap-4 pt-4">
                            <Link to="/shop">
                                <Button size="lg" className="bg-saffron-500 hover:bg-saffron-600 text-white border-none px-8 py-6 text-lg rounded-full">
                                    Shop Brands
                                </Button>
                            </Link>
                            <Link to="/book-appointment">
                                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-sage-900 px-8 py-6 text-lg rounded-full">
                                    Our Mission
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Trust Indicators */}
            <section className="bg-sage-900 text-white py-12 border-b border-sage-800">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { icon: Truck, title: "Free Shipping", desc: "On orders over ₹999" },
                            { icon: ShieldCheck, title: "100% Authentic", desc: "Sourced from Brands" },
                            { icon: Leaf, title: "Curated Selection", desc: "Verified Products" },
                            { icon: Heart, title: "Wellness First", desc: "Expert Support" }
                        ].map((item, index) => (
                            <div key={index} className="flex flex-col items-center text-center space-y-3 group">
                                <div className="p-3 bg-sage-800 rounded-full group-hover:bg-saffron-500 transition-colors duration-300">
                                    <item.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-serif font-semibold text-lg">{item.title}</h3>
                                    <p className="text-sage-300 text-sm">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Shop by Brand */}
            <section className="py-16 container mx-auto px-6">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <span className="text-saffron-600 font-medium tracking-wider uppercase text-sm">Trusted Partners</span>
                        <h2 className="text-3xl md:text-4xl font-serif font-bold text-sage-900 mt-2">Shop by Brand</h2>
                    </div>
                    <Link to="/shop" className="hidden md:flex text-sage-700 hover:text-saffron-600 transition-colors gap-2 items-center font-medium">
                        View All Brands <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="relative">
                    <div className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0">
                        {brands.map((brand) => (
                            <Link key={brand.id} to={`/shop?brand=${brand.id}`} className="shrink-0 snap-center flex flex-col items-center gap-3 w-28 md:w-32 group cursor-pointer">
                                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-white border border-stone-100 shadow-sm flex items-center justify-center p-4 group-hover:border-saffron-400 group-hover:shadow-md transition-all duration-300">
                                    {brand.logo ? (
                                        <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300" />
                                    ) : (
                                        <span className="text-2xl font-serif font-bold text-sage-300 group-hover:text-saffron-500 transition-colors">{brand.name.charAt(0)}</span>
                                    )}
                                </div>
                                <span className="text-sm font-medium text-sage-800 text-center group-hover:text-saffron-600 transition-colors line-clamp-1">{brand.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Our Services */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-12">
                        <span className="text-saffron-600 font-medium tracking-wider uppercase text-sm">Comprehensive Care</span>
                        <h2 className="text-3xl md:text-4xl font-serif font-bold text-sage-900 mt-2">Our Services</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
                        {[
                            { icon: FileText, title: "Upload Prescription", desc: "Get medicines delivered", link: "/prescriptions", color: "bg-blue-50 text-blue-600" },
                            { icon: Stethoscope, title: "Consult Doctor", desc: "Expert ayurvedic advice", link: "/book-appointment", color: "bg-green-50 text-green-600" }
                        ].map((service, index) => (
                            <Link key={index} to={service.link} className="bg-stone-50 rounded-2xl p-6 hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-stone-100 group text-center md:text-left flex flex-col items-center md:items-start">
                                <div className={`w-12 h-12 rounded-xl ${service.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                    <service.icon className="w-6 h-6" />
                                </div>
                                <h3 className="font-serif font-bold text-lg text-sage-900 mb-1">{service.title}</h3>
                                <p className="text-stone-500 text-sm mb-4">{service.desc}</p>
                                <span className="text-xs font-bold uppercase tracking-wider text-sage-400 group-hover:text-saffron-600 transition-colors mt-auto flex items-center gap-1">
                                    Learn More <ArrowRight className="w-3 h-3" />
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Curated Collections */}
            <section className="py-20 container mx-auto px-6">
                <div className="flex flex-col items-center md:flex-row md:justify-between md:items-end mb-10 gap-6">
                    <div className="text-center md:text-left">
                        <span className="text-saffron-600 font-medium tracking-wider uppercase text-sm">Browse</span>
                        <h2 className="text-3xl md:text-4xl font-serif font-bold text-sage-900 mt-2">Shop by Category</h2>
                    </div>
                    <Link to="/shop" className="group flex items-center gap-2 text-sage-700 hover:text-saffron-600 transition-colors font-medium border-b border-sage-200 hover:border-saffron-600 pb-1">
                        View All Categories <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {/* Categories: Mobile Carousel / Desktop Grid */}
                <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-6 px-6 md:grid md:grid-cols-3 md:gap-6 md:pb-0 md:mx-0 md:px-0 scrollbar-hide">
                    {categories.slice(0, 3).map((category) => (
                        <Link key={category.id} to={`/shop?category=${category.id}`} className="shrink-0 w-[85vw] md:w-auto md:shrink snap-center group relative aspect-[4/3] overflow-hidden rounded-2xl cursor-pointer shadow-sm">
                            <img
                                src={category.image}
                                alt={category.name}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                            <div className="absolute bottom-0 left-0 p-4 md:p-6 w-full">
                                <h3 className="text-xl md:text-2xl font-serif font-bold text-white mb-1">{category.name}</h3>
                                <span className="text-saffron-400 text-sm font-medium flex items-center gap-2 md:opacity-0 md:-translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                    Explore <ArrowRight className="w-3 h-3" />
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Bestsellers - Highlight Section */}
            <section className="py-24 bg-sage-50">
                <div className="container mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <span className="text-saffron-600 font-medium tracking-wider uppercase text-sm">Customer Favorites</span>
                        <h2 className="text-4xl md:text-5xl font-serif font-bold text-sage-900 mt-2 mb-4">Trending Products</h2>
                        <p className="text-stone-600">Discover the most popular ayurvedic solutions trusted by our community.</p>
                    </div>

                    {/* Products: Mobile 2x2 Grid / Desktop 4col */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
                        {featuredProducts.map((product) => (
                            <div key={product.id} className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
                                <div className="relative h-40 md:h-64 overflow-hidden bg-gray-100">
                                    <Link to={`/product/${product.id}`}>
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                    </Link>
                                    {/* Badges */}
                                    <div className="absolute top-2 left-2 md:top-3 md:left-3 flex flex-col gap-1">
                                        {product.discount_percentage > 0 && (
                                            <span className="bg-saffron-500 text-white text-[10px] uppercase font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded shadow-sm">
                                                -{product.discount_percentage}%
                                            </span>
                                        )}
                                    </div>
                                    {/* Quick Add Button (Desktop Only) */}
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            addToCart(product);
                                        }}
                                        className="hidden md:block absolute bottom-3 right-3 bg-white text-sage-900 p-2.5 rounded-full shadow-lg opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-sage-900 hover:text-white"
                                        title="Add to Cart"
                                    >
                                        <Truck className="w-4 h-4" />
                                    </button>

                                    {/* Mobile Quick Add (Always Visible or Corner) */}
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            addToCart(product);
                                        }}
                                        className="md:hidden absolute bottom-2 right-2 bg-white/90 text-sage-900 p-2 rounded-full shadow-sm border border-stone-100"
                                    >
                                        <Truck className="w-3 h-3" />
                                    </button>
                                </div>
                                <div className="p-3 md:p-5 flex flex-col flex-1">
                                    <div className="text-[9px] md:text-[10px] text-saffron-600 font-semibold uppercase tracking-wider mb-1 truncate">
                                        {(() => {
                                            // Handle array or string category
                                            const catId = Array.isArray(product.category) ? product.category[0] : product.category;
                                            // Lookup name
                                            const cat = categories.find(c => c.id === catId || c.name === catId);
                                            return cat ? cat.name : (catId || 'Unknown Category');
                                        })()}
                                    </div>
                                    <Link to={`/product/${product.id}`}>
                                        <h3 className="text-sm md:text-base font-serif font-bold text-sage-900 mb-1 line-clamp-2 md:truncate group-hover:text-saffron-600 transition-colors">{product.name}</h3>
                                    </Link>
                                    <div className="mt-auto pt-2 md:pt-3 border-t border-gray-100 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            {product.discount_percentage > 0 ? (
                                                <>
                                                    <span className="text-[10px] md:text-xs text-stone-400 line-through">₹{Math.round(product.price)}</span>
                                                    <span className="text-sm md:text-base font-bold text-sage-900">₹{Math.round(product.disc_price)}</span>
                                                </>
                                            ) : (
                                                <span className="text-sm md:text-base font-bold text-sage-900">₹{Math.round(product.price)}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] md:text-xs text-stone-500">
                                            {product.rating > 0 && product.reviews > 0 && (
                                                <>
                                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                    {product.rating.toFixed(1)}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-12">
                        <Link to="/shop">
                            <Button variant="outline" size="sm" className="border-sage-300 text-sage-800 hover:bg-sage-50 px-8 rounded-full">
                                Browse All Products
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Why Choose Us - Aesthetic Split Section */}
            <section className="py-24 bg-sage-900 text-white overflow-hidden">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="relative">
                            <div className="absolute -top-10 -left-10 w-32 h-32 bg-saffron-500/20 rounded-full blur-3xl" />
                            <div className="relative z-10 flex justify-center items-center">
                                <img src={goldenSeal} alt="Golden Seal of Purity" className="w-full max-w-sm drop-shadow-2xl animate-pulse-slow object-contain" />
                            </div>
                        </div>
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">Curated Tradition,<br />Verified Authenticity</h2>
                                <p className="text-sage-200 text-lg leading-relaxed">
                                    We bring you the finest formulations from India's most respected Ayurvedic manufacturers. Every product on our platform is verified for authenticity and quality, ensuring you get only the best for your wellness journey.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="border border-white/10 p-6 rounded-xl hover:bg-white/5 transition-colors">
                                    <h4 className="text-xl font-serif font-bold text-saffron-400 mb-2">100% Authentic</h4>
                                    <p className="text-sage-300">Directly sourced from authorized brand distributors.</p>
                                </div>
                                <div className="border border-white/10 p-6 rounded-xl hover:bg-white/5 transition-colors">
                                    <h4 className="text-xl font-serif font-bold text-saffron-400 mb-2">Expertly Selected</h4>
                                    <p className="text-sage-300">Curated by our team of Ayurvedic practitioners.</p>
                                </div>
                            </div>
                            <Link to="/about">
                                <Button className="bg-white text-sage-900 hover:bg-sage-100 rounded-full px-8 mt-4">
                                    Learn More About Us
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-24 bg-cream">
                <div className="container mx-auto px-6 text-center max-w-4xl">
                    <h2 className="text-3xl font-serif font-bold text-sage-900 mb-12">Stories of Healing</h2>

                    <div className="relative bg-white p-12 rounded-3xl shadow-sm border border-stone-100">
                        <div className="text-6xl text-saffron-300 font-serif absolute top-6 left-8">"</div>
                        <AnimatePresence mode='wait'>
                            <motion.div
                                key={activeTestimonial}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.5 }}
                                className="px-8"
                            >
                                <p className="text-xl md:text-2xl font-serif text-sage-800 italic mb-8 leading-relaxed">
                                    {testimonials[activeTestimonial].text}
                                </p>
                                <div>
                                    <h4 className="font-bold text-lg text-sage-900">{testimonials[activeTestimonial].name}</h4>
                                    <p className="text-stone-500 text-sm">{testimonials[activeTestimonial].role}</p>
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        <div className="flex justify-center gap-2 mt-8">
                            {testimonials.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveTestimonial(idx)}
                                    className={`w-3 h-3 rounded-full transition-all ${idx === activeTestimonial ? 'bg-saffron-500 w-8' : 'bg-stone-300 hover:bg-stone-400'}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Journal / Blog Teaser */}
            {blogs.length > 0 && (
                <section className="py-24 bg-white">
                    <div className="container mx-auto px-6">
                        <div className="flex justify-between items-end mb-12">
                            <div>
                                <span className="text-saffron-600 font-medium tracking-wider uppercase text-sm">The Journal</span>
                                <h2 className="text-4xl font-serif font-bold text-sage-900 mt-2">Wellness Wisdom</h2>
                            </div>
                            <Link to="/blog" className="hidden md:flex text-sage-700 hover:text-saffron-600 transition-colors gap-2 items-center">
                                Read all articles <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {blogs.map((blog) => (
                                <Link key={blog.id} to={`/blog/${blog.slug}`} className="group cursor-pointer">
                                    <div className="overflow-hidden rounded-xl mb-6 h-64">
                                        <img
                                            src={blog.image}
                                            alt={blog.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-stone-500 mb-3">
                                        <span className="uppercase tracking-wider font-semibold text-saffron-600">Health</span>
                                        <span>•</span>
                                        <span>{new Date(blog.date).toLocaleDateString()}</span>
                                    </div>
                                    <h3 className="text-2xl font-serif font-bold text-sage-900 mb-3 group-hover:text-saffron-600 transition-colors leading-tight">
                                        {blog.title}
                                    </h3>
                                    <p className="text-stone-600 line-clamp-2 mb-4">
                                        {blog.excerpt || "Discover the benefits of ayurveda for your daily life..."}
                                    </p>
                                    <span className="text-sage-800 font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                                        Read Story <ArrowUpRight className="w-4 h-4" />
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Newsletter */}
            <section className="py-24 bg-sage-50">
                <div className="container mx-auto px-6">
                    <div className="bg-sage-900 rounded-[2rem] p-12 md:p-20 text-center relative overflow-hidden">
                        {/* Abstract shapes */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-saffron-500/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-sage-500/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />

                        <div className="relative z-10 max-w-2xl mx-auto space-y-8">
                            <h2 className="text-4xl md:text-5xl font-serif font-bold text-white">Join Our Community</h2>
                            <p className="text-sage-200 text-lg">
                                Subscribe to receive ancient wellness tips, exclusive offers, and early access to new launches.
                            </p>
                            <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto" onSubmit={(e) => e.preventDefault()}>
                                <input
                                    type="email"
                                    placeholder="Your email address"
                                    className="flex-1 px-6 py-4 rounded-full bg-white/10 border border-white/20 text-white placeholder-sage-300 focus:outline-none focus:bg-white/20 transition-colors backdrop-blur-sm"
                                />
                                <Button className="bg-saffron-500 hover:bg-saffron-600 text-white rounded-full px-8 py-4 shadow-xl">
                                    Subscribe
                                </Button>
                            </form>
                            <p className="text-sage-400 text-sm pt-4">No spam. Unsubscribe anytime.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
