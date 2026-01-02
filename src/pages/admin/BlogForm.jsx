import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getBlog, addBlog, updateBlog } from '../../lib/data'; // Ensure getBlog can handle ID if needed or adjust logic
import { supabase } from '../../lib/supabase'; // Direct access if needed for ID fetch vs Slug
import Button from '../../components/Button';

const BlogForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
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
        }
    }, [id]);

    const fetchBlog = async () => {
        // Special fetch by ID for admin since public uses slug
        const { data, error } = await supabase.from('blogs').select('*').eq('id', id).single();
        if (data) setFormData(data);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTitleChange = (e) => {
        const title = e.target.value;
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        setFormData(prev => ({ ...prev, title, slug }));
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

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <h1 className="text-3xl font-serif font-bold text-sage-900 mb-8">
                {isEditMode ? 'Edit Article' : 'Write New Article'}
            </h1>

            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-sage-100 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Title</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleTitleChange}
                        className="w-full px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500 font-serif text-lg"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Slug (URL)</label>
                        <input
                            type="text"
                            name="slug"
                            value={formData.slug}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500 bg-gray-50 text-sm"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Category</label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                        >
                            <option>Wellness</option>
                            <option>Recipes</option>
                            <option>Herbal Remedies</option>
                            <option>Yoga</option>
                            <option>Lifestyle</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Author</label>
                        <input
                            type="text"
                            name="author"
                            value={formData.author}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Publish Date</label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Cover Image URL</label>
                    <input
                        type="text"
                        name="image"
                        value={formData.image}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Short Excerpt</label>
                    <textarea
                        name="excerpt"
                        value={formData.excerpt}
                        onChange={handleChange}
                        rows="2"
                        className="w-full px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Content (HTML Supported)</label>
                    <textarea
                        name="content"
                        value={formData.content}
                        onChange={handleChange}
                        rows="12"
                        className="w-full px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500 font-mono text-sm"
                        placeholder="<p>Write your article here...</p>"
                    />
                    <p className="text-xs text-stone-500 mt-1">Basic HTML tags like &lt;p&gt;, &lt;h3&gt;, &lt;ul&gt;, &lt;li&gt; are supported.</p>
                </div>

                <div className="flex gap-4 pt-4">
                    <Button type="submit" disabled={loading} className="flex-1">
                        {loading ? 'Saving...' : (isEditMode ? 'Update Article' : 'Publish Article')}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => navigate('/admin/blogs')}>
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default BlogForm;
