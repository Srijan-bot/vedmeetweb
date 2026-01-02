import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { usePrescriptions } from '../hooks/usePrescriptions';
import Button from '../components/Button';
import PrescriptionUpload from '../components/PrescriptionUpload';
import { Plus, ChevronRight, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const UserPrescriptions = () => {
    const [prescriptions, setPrescriptions] = useState([]);
    const { getUserPrescriptions, loading } = usePrescriptions();
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const navigate = useNavigate();

    const fetchPrescriptions = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const data = await getUserPrescriptions(user.id);
            setPrescriptions(data);
        } else {
            navigate('/login');
        }
    };

    useEffect(() => {
        fetchPrescriptions();
    }, []);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'referred':
                return <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Referred</span>;
            case 'rejected':
                return <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejected</span>;
            default:
                return <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> Under Review</span>;
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-sage-900">My Prescriptions</h1>
                    <p className="text-stone-600 mt-1">Upload and manage your medical prescriptions</p>
                </div>
                <Button onClick={() => setIsUploadOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Upload
                </Button>
            </div>

            {loading && prescriptions.length === 0 ? (
                <div className="text-center py-12">Loading...</div>
            ) : prescriptions.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-sage-100">
                    <div className="w-16 h-16 bg-sage-50 text-sage-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-sage-900">No prescriptions yet</h3>
                    <p className="text-stone-500 mb-6">Upload your first prescription to get started</p>
                    <Button onClick={() => setIsUploadOpen(true)}>
                        Upload Now
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {prescriptions.map((p) => (
                        <Link
                            key={p.id}
                            to={`/prescriptions/${p.id}`}
                            className="block bg-white rounded-xl p-4 shadow-sm border border-sage-100 hover:border-saffron-300 transition-colors group"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-sage-50 rounded-lg flex items-center justify-center text-sage-500">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sage-900">Prescription #{p.id.slice(0, 8)}</p>
                                        <p className="text-xs text-stone-500">Uploaded on {new Date(p.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {getStatusBadge(p.status)}
                                    <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-saffron-500" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            <PrescriptionUpload
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                onUploadComplete={fetchPrescriptions}
            />
        </div>
    );
};

export default UserPrescriptions;
