import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getBlog, addBlog, updateBlog } from '../../lib/data';
import { supabase } from '../../lib/supabase';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import {
    PenTool, Calendar, Image as ImageIcon, Layout,
    Save, ArrowLeft, Type, Link as LinkIcon
} from 'lucide-react';

import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const BlogForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        category: 'Wellness',
        author: '',
        date: new Date().toISOString().split('T')[0],
        excerpt: '',
        content: '',
        image: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isEditMode) {
            fetchBlog();
        } else if (user) {
            // Auto-fill author if new post
            const getProfile = async () => {
                const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
                if (data?.full_name) setFormData(prev => ({ ...prev, author: data.full_name }));
            }
            getProfile();
        }
    }, [id, user]);

    const fetchBlog = async () => {
        const { data, error } = await supabase.from('blogs').select('*').eq('id', id).single();
        if (data) setFormData(data);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTitleChange = (e) => {
        const title = e.target.value;
        // Simple slug generation
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        setFormData(prev => ({ ...prev, title, slug }));
    };

    const handleContentChange = (value) => {
        setFormData(prev => ({ ...prev, content: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { ...formData };
            if (isEditMode) {
                await updateBlog(id, payload);
            } else {
                await addBlog(payload);
            }
            navigate('/admin/blogs');
        } catch (error) {
            console.error("Error saving blog:", error);
            alert("Failed to save blog");
        } finally {
            setLoading(false);
        }
    };

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
            ['link', 'image'],
            ['clean']
        ],
    };

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike', 'blockquote',
        'list', 'bullet', 'indent',
        'link', 'image'
    ];

    return (
        <div className="container mx-auto px-6 py-8 md:max-w-5xl">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/blogs')}
                        className="p-2 hover:bg-stone-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-stone-600" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-sage-900">
                            {isEditMode ? 'Edit Article' : 'Compose New Article'}
                        </h1>
                        <p className="text-stone-500 text-sm mt-1">Share wisdom with the community.</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/admin/blogs')}
                        className="border-stone-200 text-stone-600 hover:bg-stone-50"
                    >
                        Discard
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-sage-900 text-white hover:bg-sage-800 flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {loading ? 'Saving...' : (isEditMode ? 'Update Article' : 'Publish')}
                    </Button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Title & Slug */}
                    <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Article Title</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleTitleChange}
                                placeholder="Enter a captivating title..."
                                className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 font-serif text-xl placeholder-stone-300"
                                required
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-xs font-medium text-stone-500 mb-1">
                                <LinkIcon className="w-3 h-3" /> Permalink (Slug)
                            </label>
                            <input
                                type="text"
                                name="slug"
                                value={formData.slug}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-stone-100 bg-stone-50 rounded-md text-stone-600 text-sm focus:outline-none focus:border-sage-300"
                                required
                            />
                        </div>
                    </div>

                    {/* Rich Text Editor */}
                    <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
                        <div className="p-4 border-b border-stone-100 bg-stone-50">
                            <label className="flex items-center gap-2 text-sm font-bold text-stone-700">
                                <PenTool className="w-4 h-4" /> Content
                            </label>
                        </div>
                        <ReactQuill
                            theme="snow"
                            value={formData.content}
                            onChange={handleContentChange}
                            modules={modules}
                            formats={formats}
                            className="flex-1 flex flex-col"
                            placeholder="Start writing your story..."
                        />
                        {/* Custom CSS to make the editor fill height */}
                        <style>{`
                            .quill { display: flex; flex-direction: column; height: 100%; }
                            .ql-container { flex: 1; overflow-y: auto; font-family: 'Inter', sans-serif; font-size: 16px; }
                            .ql-editor { min-height: 100%; padding: 1.5rem; }
                            .ql-toolbar { border-top: none !important; border-left: none !important; border-right: none !important; background: white; }
                            .ql-container.ql-snow { border: none !important; }
                        `}</style>
                    </div>

                    {/* Excerpt */}
                    <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                        <label className="block text-sm font-medium text-stone-700 mb-2">Short Excerpt</label>
                        <textarea
                            name="excerpt"
                            value={formData.excerpt}
                            onChange={handleChange}
                            rows="3"
                            placeholder="A brief summary for previews..."
                            className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 text-sm"
                        />
                        <p className="text-xs text-stone-400 mt-1 text-right">{formData.excerpt.length}/300 characters</p>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    {/* Publishing Details */}
                    <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-4">
                        <h3 className="font-bold text-stone-800 border-b border-stone-100 pb-2 mb-4">Publishing Details</h3>

                        <div>
                            <label className="block text-sm font-medium text-stone-600 mb-1">Category</label>
                            <div className="relative">
                                <Layout className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 appearance-none bg-white"
                                >
                                    <option>Wellness</option>
                                    <option>Recipes</option>
                                    <option>Herbal Remedies</option>
                                    <option>Yoga</option>
                                    <option>Lifestyle</option>
                                    <option>Mental Health</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-600 mb-1">Author</label>
                            <input
                                type="text"
                                name="author"
                                value={formData.author}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-600 mb-1">Publish Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Media */}
                    <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-4">
                        <h3 className="font-bold text-stone-800 border-b border-stone-100 pb-2 mb-4 flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" /> Featured Image
                        </h3>

                        <div className="aspect-video bg-stone-50 rounded-lg border-2 border-dashed border-stone-200 flex items-center justify-center overflow-hidden relative group">
                            {formData.image ? (
                                <>
                                    <img
                                        src={formData.image}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                        onError={(e) => e.target.style.display = 'none'}
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <p className="text-white text-xs font-medium">Enter URL below to change</p>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center p-4">
                                    <ImageIcon className="w-8 h-8 text-stone-300 mx-auto mb-1" />
                                    <p className="text-xs text-stone-400">No Image Selected</p>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-stone-600 mb-1">Image URL</label>
                            <input
                                type="text"
                                name="image"
                                value={formData.image}
                                onChange={handleChange}
                                placeholder="https://..."
                                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 text-xs"
                            />
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default BlogForm;
