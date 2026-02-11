import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { getConcerns, addConcern, deleteConcern } from '../../lib/data';
import Button from '../../components/Button';

const ConcernManager = () => {
    const [concerns, setConcerns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newConcern, setNewConcern] = useState('');

    useEffect(() => {
        fetchConcerns();
    }, []);

    const fetchConcerns = async () => {
        setLoading(true);
        const data = await getConcerns();
        setConcerns(data);
        setLoading(false);
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newConcern) return;
        try {
            await addConcern({ name: newConcern });
            setNewConcern('');
            fetchConcerns();
        } catch (error) {
            console.error("Error adding concern:", error);
            alert("Failed to add concern.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this concern?')) {
            try {
                await deleteConcern(id);
                fetchConcerns();
            } catch (error) {
                console.error("Error deleting concern:", error);
            }
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-sage-900 mb-6">Manage Health Concerns</h1>

            {/* Add New Form */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-sage-100 mb-8">
                <form onSubmit={handleAdd} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-stone-700 mb-1">New Health Concern</label>
                        <input
                            type="text"
                            value={newConcern}
                            onChange={(e) => setNewConcern(e.target.value)}
                            placeholder="e.g. Digestion, Sleep..."
                            className="w-full px-3 py-2 border border-sage-200 rounded-md"
                            required
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
                            <th className="p-4">Concern Name</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-sage-100 text-sm">
                        {concerns.length === 0 ? (
                            <tr><td colSpan="2" className="p-4 text-center text-stone-500">No concerns found. Add one above.</td></tr>
                        ) : (
                            concerns.map((c) => (
                                <tr key={c.id} className="hover:bg-sage-50/50">
                                    <td className="p-4 font-medium text-stone-800">{c.name}</td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ConcernManager;
