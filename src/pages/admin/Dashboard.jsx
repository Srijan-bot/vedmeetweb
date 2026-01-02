import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, LogOut } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getProducts, deleteProduct } from '../../lib/data';
import Button from '../../components/Button';

const Dashboard = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        const data = await getProducts();
        setProducts(data);
        setLoading(false);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            await deleteProduct(id);
            fetchProducts();
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    if (loading) return <div className="p-8 text-center">Loading products...</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-serif font-bold text-sage-900">Admin Dashboard</h1>
                <div className="flex gap-4">
                    <Link to="/admin/products/new">
                        <Button className="flex items-center gap-2">
                            <Plus className="h-4 w-4" /> Add Product
                        </Button>
                    </Link>
                    <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
                        <LogOut className="h-4 w-4" /> Logout
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-sage-100">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-sage-50 text-sage-900">
                        <tr>
                            <th className="p-4 font-semibold">Image</th>
                            <th className="p-4 font-semibold">Name</th>
                            <th className="p-4 font-semibold">Category</th>
                            <th className="p-4 font-semibold">Price</th>
                            <th className="p-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-sage-100">
                        {products.map((product) => (
                            <tr key={product.id} className="hover:bg-sage-50/50 transition-colors">
                                <td className="p-4">
                                    <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded-md" />
                                </td>
                                <td className="p-4 font-medium text-stone-800">{product.name}</td>
                                <td className="p-4 text-stone-600 capitalize">{product.category}</td>
                                <td className="p-4 text-stone-800 font-bold">Rs. {product.price.toFixed(2)}</td>
                                <td className="p-4 text-right space-x-2">
                                    <Link to={`/admin/products/edit/${product.id}`}>
                                        <button className="p-2 text-sage-600 hover:bg-sage-100 rounded-full transition-colors">
                                            <Edit className="h-4 w-4" />
                                        </button>
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(product.id)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {products.length === 0 && (
                            <tr>
                                <td colSpan="5" className="p-8 text-center text-stone-500">No products found. Add one to get started.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Dashboard;
