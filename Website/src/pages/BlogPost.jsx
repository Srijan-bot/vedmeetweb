import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, User, ArrowLeft, Share2, Facebook, Twitter, Linkedin } from 'lucide-react';

import { getBlog } from '../lib/data';

const BlogPost = () => {
    const { slug } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPost = async () => {
            // Basic decoding if slug comes from URL encoded
            const data = await getBlog(slug);
            setPost(data);
            setLoading(false);
        };
        loadPost();
    }, [slug]);

    if (loading) return <div className="p-20 text-center">Loading article...</div>;

    if (!post) return <div className="p-20 text-center">Article not found. <Link to="/blog" className="text-saffron-600 underline">Return to Blog</Link></div>;

    return (
        <article className="pb-20">
            {/* Header Image */}
            <div className="h-[50vh] relative">
                <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="container mx-auto px-4 text-center text-white">
                        <span className="bg-saffron-500 text-white px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider mb-4 inline-block">
                            {post.category}
                        </span>
                        <h1 className="text-4xl md:text-6xl font-serif font-bold leading-tight mb-4 drop-shadow-md">
                            {post.title}
                        </h1>
                        <div className="flex items-center justify-center gap-6 text-sm md:text-base">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                <span>{post.author}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>{post.date}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 md:px-6 relative -mt-20 z-10">
                <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 max-w-4xl mx-auto">
                    <Link to="/blog" className="inline-flex items-center text-stone-500 hover:text-sage-600 mb-8 font-medium">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Articles
                    </Link>

                    {/* Content */}
                    <div
                        className="prose prose-lg prose-stone prose-headings:font-serif prose-headings:text-sage-900 prose-a:text-saffron-600 hover:prose-a:text-saffron-700 mx-auto"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />

                    {/* Author/Share Footer */}
                    <div className="mt-12 pt-8 border-t border-sage-100 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-sage-100 rounded-full flex items-center justify-center text-sage-600 font-bold text-xl">
                                {post.author.charAt(0)}
                            </div>
                            <div>
                                <div className="font-bold text-sage-900">Written by {post.author}</div>
                                <div className="text-sm text-stone-500">Ayurvedic Practitioner & Wellness Coach</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-stone-500 uppercase tracking-wider">Share:</span>
                            <button className="p-2 rounded-full bg-sage-50 text-sage-600 hover:bg-sage-100"><Facebook className="w-4 h-4" /></button>
                            <button className="p-2 rounded-full bg-sage-50 text-sage-600 hover:bg-sage-100"><Twitter className="w-4 h-4" /></button>
                            <button className="p-2 rounded-full bg-sage-50 text-sage-600 hover:bg-sage-100"><Linkedin className="w-4 h-4" /></button>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
};

export default BlogPost;
