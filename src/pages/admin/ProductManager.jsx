import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { getProducts, deleteProduct } from '../../lib/data';
import Button from '../../components/Button';

const ProductManager = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
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

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-sage-900">Products</h1>
                <Link to="/admin/products/new">
                    <Button size="sm" className="flex items-center gap-2">
                        <Plus className="h-4 w-4" /> Add New
                    </Button>
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-sage-100">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-sage-50 text-sage-900 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="p-4 font-semibold">Product</th>
                            <th className="p-4 font-semibold">Category</th>
                            <th className="p-4 font-semibold">Stock</th>
                            <th className="p-4 font-semibold">Price</th>
                            <th className="p-4 font-semibold">Final Price</th>
                            <th className="p-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-sage-100 text-sm">
                        {products.map((product) => (
                            <tr key={product.id} className="hover:bg-sage-50/50 transition-colors">
                                <td className="p-4 flex items-center gap-3">
                                    <img src={product.image} alt={product.name} className="w-10 h-10 object-cover rounded-md bg-gray-100" />
                                    <span className="font-medium text-stone-800">{product.name}</span>
                                </td>
                                <td className="p-4 text-stone-600 capitalize">{product.category}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${(product.stock_quantity || 0) < 10
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-green-100 text-green-700'
                                        }`}>
                                        {product.stock_quantity || 0}
                                    </span>
                                </td>
                                <td className="p-4 text-stone-800">
                                    <span className={product.discount_percentage ? "line-through text-stone-400 text-xs block" : "font-bold"}>
                                        {product.price ? `Rs. ${product.price.toFixed(2)}` : '0.00'}
                                    </span>
                                    {product.discount_percentage > 0 && (
                                        <span className="text-xs text-saffron-600 font-bold">{product.discount_percentage}% OFF</span>
                                    )}
                                </td>
                                <td className="p-4 font-bold text-sage-900">
                                    Rs. {(product.disc_price || product.price || 0).toFixed(2)}
                                </td>
                                <td className="p-4 text-right space-x-2">
                                    <Link to={`/admin/products/edit/${product.id}`}>
                                        <button className="p-1.5 text-sage-600 hover:bg-sage-100 rounded-md transition-colors">
                                            <Edit className="h-4 w-4" />
                                        </button>
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(product.id)}
                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

            </div>
            {
                products.length === 0 && (
                    <div className="p-8 text-center text-stone-500 bg-white border border-sage-100 rounded-xl mt-4">
                        No products found.
                    </div>
                )
            }
        </div >
    );
};

export default ProductManager;
