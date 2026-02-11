import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, User, ArrowRight } from 'lucide-react';
import Button from '../components/Button';

import { getBlogs } from '../lib/data';

const Blog = () => {
    const [blogPosts, setBlogPosts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    useEffect(() => {
        const loadBlogs = async () => {
            const data = await getBlogs();
            setBlogPosts(data);
        };
        loadBlogs();
    }, []);

    const categories = ['All', 'Wellness', 'Herbal Remedies', 'Recipes', 'Yoga'];

    const filteredPosts = blogPosts.filter(post => {
        const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) || post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="container mx-auto px-4 md:px-6 py-12">
            <div className="text-center max-w-2xl mx-auto mb-16">
                <h1 className="text-4xl font-serif font-bold text-sage-900 mb-4">Ayurveda Knowledge Center</h1>
                <p className="text-stone-600 mb-8">
                    Explore ancient wisdom for modern living. Expert articles, tips, and guides on Ayurvedic wellness.
                </p>

                <div className="relative max-w-md mx-auto">
                    <input
                        type="text"
                        placeholder="Search for articles..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-full border border-sage-200 focus:outline-none focus:border-sage-500 focus:ring-1 focus:ring-sage-500 shadow-sm"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap justify-center gap-2 mb-12">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === cat
                            ? 'bg-sage-600 text-white'
                            : 'bg-sage-50 text-sage-700 hover:bg-sage-100'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Blog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPosts.map(post => (
                    <article key={post.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col border border-sage-100">
                        <Link to={`/blog/${post.slug}`} className="relative h-56 overflow-hidden block">
                            <img
                                src={post.image}
                                alt={post.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-sage-800 uppercase tracking-wider">
                                {post.category}
                            </div>
                        </Link>
                        <div className="p-6 flex-1 flex flex-col">
                            <div className="flex items-center gap-4 text-xs text-stone-500 mb-3">
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {post.date}
                                </div>
                                <div className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {post.author}
                                </div>
                            </div>
                            <Link to={`/blog/${post.slug}`}>
                                <h2 className="text-xl font-serif font-bold text-sage-900 mb-3 group-hover:text-sage-700 transition-colors leading-tight">
                                    {post.title}
                                </h2>
                            </Link>
                            <p className="text-stone-600 text-sm line-clamp-3 mb-4 flex-1">
                                {post.excerpt}
                            </p>
                            <Link to={`/blog/${post.slug}`} className="inline-flex items-center text-saffron-600 font-bold text-sm hover:text-saffron-700 mt-auto">
                                Read Article <ArrowRight className="w-4 h-4 ml-1" />
                            </Link>
                        </div>
                    </article>
                ))}
            </div>

            {filteredPosts.length === 0 && (
                <div className="text-center py-12 text-stone-500">
                    No articles found matching your search.
                </div>
            )}
        </div>
    );
};

export default Blog;
