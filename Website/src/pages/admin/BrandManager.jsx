import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Globe } from 'lucide-react';
import { getBrands, addBrand, deleteBrand } from '../../lib/data';
import Button from '../../components/Button';

const BrandManager = () => {
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newBrand, setNewBrand] = useState({
        name: '',
        logo: '',
        description: '',
        origin_country: ''
    });

    useEffect(() => {
        fetchBrands();
    }, []);

    const fetchBrands = async () => {
        setLoading(true);
        const data = await getBrands();
        setBrands(data);
        setLoading(false);
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newBrand.name) return;
        try {
            await addBrand(newBrand);
            setNewBrand({ name: '', logo: '', description: '', origin_country: '' });
            fetchBrands();
        } catch (error) {
            console.error("Error adding brand:", error);
            alert("Failed to add brand.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this brand?')) {
            try {
                await deleteBrand(id);
                fetchBrands();
            } catch (error) {
                console.error("Error deleting brand:", error);
            }
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-sage-900 mb-6">Manage Brands</h1>

            {/* Add New Form */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-sage-100 mb-8">
                <h2 className="text-lg font-bold text-sage-800 mb-4">Add New Brand</h2>
                <form onSubmit={handleAdd} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Brand Name</label>
                            <input
                                type="text"
                                value={newBrand.name}
                                onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
                                className="w-full px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Origin Country</label>
                            <input
                                type="text"
                                value={newBrand.origin_country}
                                onChange={(e) => setNewBrand({ ...newBrand, origin_country: e.target.value })}
                                className="w-full px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                                placeholder="e.g. India, USA"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-stone-700 mb-1">Logo URL</label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="text"
                                    value={newBrand.logo}
                                    onChange={(e) => setNewBrand({ ...newBrand, logo: e.target.value })}
                                    className="w-full px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                                    placeholder="https://..."
                                />
                                {newBrand.logo && (
                                    <img src={newBrand.logo} alt="Preview" className="w-10 h-10 object-contain border rounded bg-gray-50" onError={(e) => e.target.style.display = 'none'} />
                                )}
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
                            <textarea
                                value={newBrand.description}
                                onChange={(e) => setNewBrand({ ...newBrand, description: e.target.value })}
                                className="w-full px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                                rows="3"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={loading}>
                            <Plus className="w-4 h-4 mr-2" /> Add Brand
                        </Button>
                    </div>
                </form>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-sage-100">
                <table className="w-full text-left">
                    <thead className="bg-sage-50 text-sage-900 text-xs uppercase">
                        <tr>
                            <th className="p-4">Logo</th>
                            <th className="p-4">Brand Details</th>
                            <th className="p-4">Origin</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-sage-100 text-sm">
                        {brands.map((brand) => (
                            <tr key={brand.id || brand.name} className="hover:bg-sage-50/50">
                                <td className="p-4">
                                    {brand.logo ? (
                                        <img src={brand.logo} alt={brand.name} className="w-16 h-16 object-contain rounded border border-gray-100 bg-white" />
                                    ) : (
                                        <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">No Logo</div>
                                    )}
                                </td>
                                <td className="p-4">
                                    <div className="font-bold text-stone-800 text-base">{brand.name}</div>
                                    <div className="text-stone-500 text-xs mt-1 line-clamp-2">{brand.description}</div>
                                </td>
                                <td className="p-4 text-stone-600">
                                    <div className="flex items-center gap-2">
                                        <Globe className="w-3 h-3" />
                                        {brand.origin_country || 'N/A'}
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <button onClick={() => handleDelete(brand.id)} className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {brands.length === 0 && !loading && (
                    <div className="p-8 text-center text-stone-400">No brands found. Add one above.</div>
                )}
            </div>
        </div>
    );
};

export default BrandManager;
