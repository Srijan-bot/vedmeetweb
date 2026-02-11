import React, { useEffect, useState } from 'react';
import { getAppointments, updateAppointmentStatus } from '../../lib/data';
import { Calendar, Clock, User, CheckCircle, XCircle } from 'lucide-react';
import Button from '../../components/Button';

const Appointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        setLoading(true);
        const data = await getAppointments();
        setAppointments(data);
        setLoading(false);
    };

    const handleStatusUpdate = async (id, status) => {
        if (window.confirm(`Are you sure you want to mark this appointment as ${status}?`)) {
            await updateAppointmentStatus(id, status);
            fetchAppointments();
        }
    };

    if (loading) return <div>Loading appointments...</div>;

    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-serif font-bold text-sage-900 mb-6">Appointments</h1>

            {appointments.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-sage-100 p-8 text-center">
                    <p className="text-stone-500">No appointments found.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {appointments.map((apt) => (
                        <div key={apt.id} className="bg-white rounded-xl shadow-sm border border-sage-100 p-6 flex flex-col md:flex-row justify-between gap-6">
                            <div className="flex gap-4">
                                <div className="w-16 h-16 bg-sage-50 rounded-full flex items-center justify-center shrink-0">
                                    <User className="text-sage-400 w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sage-900 text-lg">{apt.patient_name}</h3>
                                    <p className="text-stone-500 text-sm">{apt.patient_email}</p>
                                    <p className="text-stone-500 text-sm">{apt.patient_phone}</p>

                                    <div className="flex items-center gap-4 mt-2 text-sm text-sage-700">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(apt.appointment_date).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            {apt.appointment_time}
                                        </div>
                                    </div>

                                    <div className="text-xs text-stone-400 mt-2">
                                        Doctor: <span className="text-sage-800 font-medium">{apt.doctors?.name || 'Unknown'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-3 min-w-[150px]">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider 
                                    ${apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                        apt.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                            apt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                'bg-yellow-100 text-yellow-700'}`}>
                                    {apt.status}
                                </span>

                                <div className="flex gap-2 mt-auto">
                                    {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                                        <>
                                            <button
                                                onClick={() => handleStatusUpdate(apt.id, 'completed')}
                                                className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                                                title="Mark Completed"
                                            >
                                                <CheckCircle className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleStatusUpdate(apt.id, 'cancelled')}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                                title="Cancel"
                                            >
                                                <XCircle className="w-5 h-5" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Appointments;
