import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDoctor, addDoctor, updateDoctor } from '../../lib/data';
import Button from '../../components/Button';

const DoctorForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        name: '',
        specialty: '',
        experience: '',
        rating: 5.0,
        price: '',
        image: '',
        bio: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isEditMode) {
            fetchDoctor();
        }
    }, [id]);

    const fetchDoctor = async () => {
        const data = await getDoctor(id);
        if (data) setFormData(data);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEditMode) {
                await updateDoctor(id, formData);
            } else {
                await addDoctor(formData);
            }
            navigate('/admin/doctors');
        } catch (error) {
            console.error("Error saving doctor:", error);
            alert("Failed to save doctor");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <h1 className="text-3xl font-serif font-bold text-sage-900 mb-8">
                {isEditMode ? 'Edit Doctor' : 'Add New Doctor'}
            </h1>

            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-sage-100 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Doctor Name</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Specialty</label>
                        <input
                            type="text"
                            name="specialty"
                            value={formData.specialty}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Experience (e.g., 10+ years)</label>
                        <input
                            type="text"
                            name="experience"
                            value={formData.experience}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Consultation Fee (₹)</label>
                        <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Rating</label>
                        <input
                            type="number"
                            name="rating"
                            step="0.1"
                            max="5"
                            value={formData.rating}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Profile Image URL</label>
                    <input
                        type="text"
                        name="image"
                        value={formData.image}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                    />
                    {formData.image && (
                        <div className="mt-2">
                            <img src={formData.image} alt="Preview" className="h-16 w-16 rounded-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Biography</label>
                    <textarea
                        name="bio"
                        value={formData.bio || ''}
                        onChange={handleChange}
                        rows="4"
                        className="w-full px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                    />
                </div>

                <div className="flex gap-4 pt-4">
                    <Button type="submit" disabled={loading} className="flex-1">
                        {loading ? 'Saving...' : (isEditMode ? 'Update Doctor' : 'Add Doctor')}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => navigate('/admin/doctors')}>
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default DoctorForm;
