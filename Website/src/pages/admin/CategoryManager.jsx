import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { getCategories, addCategory, deleteCategory } from '../../lib/data';
import Button from '../../components/Button';

const CategoryManager = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newCategory, setNewCategory] = useState({ name: '', image: '' });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        const data = await getCategories();
        setCategories(data);
        setLoading(false);
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newCategory.name) return;
        try {
            await addCategory(newCategory);
            setNewCategory({ name: '', image: '' });
            fetchCategories();
        } catch (error) {
            console.error("Error adding category:", error);
            alert("Failed to add category. Name might be duplicate.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this category?')) {
            try {
                await deleteCategory(id);
                fetchCategories();
            } catch (error) {
                console.error("Error deleting category:", error);
            }
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-sage-900 mb-6">Manage Categories</h1>

            {/* Add New Form */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-sage-100 mb-8">
                <h2 className="text-lg font-bold text-sage-800 mb-4">Add New Category</h2>
                <form onSubmit={handleAdd} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-stone-700 mb-1">Name</label>
                        <input
                            type="text"
                            value={newCategory.name}
                            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                            className="w-full px-3 py-2 border border-sage-200 rounded-md"
                            required
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-stone-700 mb-1">Image URL</label>
                        <input
                            type="text"
                            value={newCategory.image}
                            onChange={(e) => setNewCategory({ ...newCategory, image: e.target.value })}
                            className="w-full px-3 py-2 border border-sage-200 rounded-md"
                        />
                    </div>
                    <Button type="submit" disabled={loading}>
                        <Plus className="w-4 h-4 mr-2" /> Add
                    </Button>
                </form>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-sage-100">
                <table className="w-full text-left">
                    <thead className="bg-sage-50 text-sage-900 text-xs uppercase">
                        <tr>
                            <th className="p-4">Image</th>
                            <th className="p-4">Name</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-sage-100 text-sm">
                        {categories.map((cat) => (
                            <tr key={cat.id || cat.name} className="hover:bg-sage-50/50">
                                <td className="p-4">
                                    {cat.image && <img src={cat.image} alt={cat.name} className="w-12 h-12 rounded object-cover bg-gray-100" />}
                                </td>
                                <td className="p-4 font-medium text-stone-800">{cat.name}</td>
                                <td className="p-4 text-right">
                                    {/* Only allow deleting DB items (usually have UUIDs) to prevent breaking mocked items if mixed, 
                                        but for now assuming strict DB usage after migration */}
                                    <button onClick={() => handleDelete(cat.id)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CategoryManager;
