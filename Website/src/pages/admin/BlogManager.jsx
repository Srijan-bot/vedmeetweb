import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Calendar } from 'lucide-react';
import { getBlogs, deleteBlog } from '../../lib/data';
import Button from '../../components/Button';

const BlogManager = () => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBlogs();
    }, []);

    const fetchBlogs = async () => {
        setLoading(true);
        const data = await getBlogs();
        setBlogs(data);
        setLoading(false);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            await deleteBlog(id);
            fetchBlogs();
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-sage-900">Blog Posts</h1>
                <Link to="/admin/blogs/new">
                    <Button size="sm" className="flex items-center gap-2">
                        <Plus className="h-4 w-4" /> Add New
                    </Button>
                </Link>
            </div>

            <div className="space-y-4">
                {blogs.map((blog) => (
                    <div key={blog.id} className="bg-white rounded-xl shadow-sm border border-sage-100 p-4 flex items-center gap-4">
                        <img src={blog.image} alt={blog.title} className="w-20 h-20 rounded-md object-cover bg-sage-50" />

                        <div className="flex-1">
                            <h3 className="font-bold text-sage-900 text-lg leading-tight">{blog.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-stone-500 mt-1">
                                <span className="bg-sage-50 text-sage-600 px-2 py-0.5 rounded text-xs uppercase font-bold">{blog.category}</span>
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {blog.date}</span>
                                <span>By {blog.author}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Link to={`/admin/blogs/edit/${blog.id}`}>
                                <button className="p-2 text-sage-600 hover:bg-sage-100 rounded-md transition-colors">
                                    <Edit className="h-5 w-5" />
                                </button>
                            </Link>
                            <button
                                onClick={() => handleDelete(blog.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                            >
                                <Trash2 className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            {blogs.length === 0 && (
                <div className="p-8 text-center text-stone-500 bg-white border border-sage-100 rounded-xl">
                    No blog posts found.
                </div>
            )}
        </div>
    );
};

export default BlogManager;
