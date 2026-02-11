import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Star } from 'lucide-react';
import { getDoctors, deleteDoctor } from '../../lib/data';
import Button from '../../components/Button';

const DoctorManager = () => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDoctors();
    }, []);

    const fetchDoctors = async () => {
        setLoading(true);
        const data = await getDoctors();
        setDoctors(data);
        setLoading(false);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this doctor?')) {
            await deleteDoctor(id);
            fetchDoctors();
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-sage-900">Doctors</h1>
                <Link to="/admin/doctors/new">
                    <Button size="sm" className="flex items-center gap-2">
                        <Plus className="h-4 w-4" /> Add New
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {doctors.map((doctor) => (
                    <div key={doctor.id} className="bg-white rounded-xl shadow-sm border border-sage-100 p-6 flex flex-col">
                        <div className="flex items-start gap-4 mb-4">
                            <img src={doctor.image} alt={doctor.name} className="w-16 h-16 rounded-full object-cover bg-sage-50" />
                            <div>
                                <h3 className="font-bold text-sage-900">{doctor.name}</h3>
                                <p className="text-sm text-stone-500">{doctor.specialty}</p>
                                <div className="flex items-center gap-1 text-xs text-yellow-500 mt-1">
                                    <Star className="w-3 h-3 fill-current" />
                                    <span>{doctor.rating}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto flex justify-between items-center pt-4 border-t border-sage-50">
                            <span className="font-bold text-sage-800">₹{doctor.price}</span>
                            <div className="space-x-2">
                                <Link to={`/admin/doctors/edit/${doctor.id}`}>
                                    <button className="p-2 text-sage-600 hover:bg-sage-100 rounded-md transition-colors">
                                        <Edit className="h-4 w-4" />
                                    </button>
                                </Link>
                                <button
                                    onClick={() => handleDelete(doctor.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {doctors.length === 0 && (
                <div className="p-8 text-center text-stone-500 bg-white border border-sage-100 rounded-xl">
                    No doctors found.
                </div>
            )}
        </div>
    );
};

export default DoctorManager;
