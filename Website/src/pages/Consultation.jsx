import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Star, CheckCircle, Video, ArrowRight } from 'lucide-react';
import Button from '../components/Button';
import { Link } from 'react-router-dom';

import { getDoctors } from '../lib/data';

const Consultation = () => {
    const [doctors, setDoctors] = useState([]);
    const [step, setStep] = useState(1);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [patientDetails, setPatientDetails] = useState({ name: '', age: '', concern: '' });

    useEffect(() => {
        const loadDoctors = async () => {
            const data = await getDoctors();
            setDoctors(data);
        };
        loadDoctors();
    }, []);

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const dates = ['Mon, Oct 23', 'Tue, Oct 24', 'Wed, Oct 25'];
    const times = ['10:00 AM', '11:30 AM', '02:00 PM', '04:30 PM'];

    return (
        <div className="container mx-auto px-4 md:px-6 py-12">
            <div className="max-w-4xl mx-auto mb-12 text-center">
                <h1 className="text-4xl font-serif font-bold text-sage-900 mb-4">Book an Ayurvedic Consultation</h1>
                <p className="text-stone-600">
                    Connect with certified Vaidyas for personalized health advice from the comfort of your home.
                </p>
            </div>

            {/* Progress Steps */}
            <div className="max-w-3xl mx-auto mb-12 flex justify-between relative">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-sage-100 -z-10" />
                {['Select Doctor', 'Date & Time', 'Your Details', 'Confirm'].map((label, idx) => (
                    <div key={idx} className={`flex flex-col items-center gap-2 bg-cream px-2 ${step > idx + 1 ? 'text-sage-600' : step === idx + 1 ? 'text-saffron-600 font-bold' : 'text-stone-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${step > idx + 1 ? 'bg-sage-600 border-sage-600 text-white' :
                            step === idx + 1 ? 'bg-white border-saffron-500 text-saffron-600' :
                                'bg-white border-sage-200 text-stone-300'
                            }`}>
                            {idx + 1}
                        </div>
                        <span className="text-xs uppercase tracking-wider hidden sm:block">{label}</span>
                    </div>
                ))}
            </div>

            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-sage-100 p-6 md:p-8 min-h-[400px]">
                {step === 1 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-serif font-bold text-sage-900 mb-6">Choose a Specialist</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {doctors.map(doctor => (
                                <div
                                    key={doctor.id}
                                    className={`border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${selectedDoctor?.id === doctor.id ? 'border-saffron-500 bg-saffron-50 ring-1 ring-saffron-500' : 'border-sage-200 hover:border-sage-400'}`}
                                    onClick={() => setSelectedDoctor(doctor)}
                                >
                                    <div className="flex gap-4 mb-4">
                                        <img src={doctor.image} alt={doctor.name} className="w-16 h-16 rounded-full object-cover" />
                                        <div>
                                            <h3 className="font-bold text-sage-900 leading-tight">{doctor.name}</h3>
                                            <p className="text-xs text-stone-500 mt-1">{doctor.experience} exp.</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-sage-700 font-medium mb-2">{doctor.specialty}</p>
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-1 text-yellow-500">
                                            <Star className="w-4 h-4 fill-current" />
                                            <span className="font-bold text-stone-700">{doctor.rating}</span>
                                        </div>
                                        <span className="font-bold text-sage-900">${doctor.price}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button onClick={handleNext} disabled={!selectedDoctor}>
                                Next Step <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-serif font-bold text-sage-900 mb-6">Select Appointment Time</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-4">Available Dates</h3>
                                <div className="space-y-3">
                                    {dates.map(date => (
                                        <button
                                            key={date}
                                            onClick={() => setSelectedDate(date)}
                                            className={`w-full text-left p-4 rounded-lg border transition-all ${selectedDate === date ? 'border-saffron-500 bg-saffron-50 font-bold text-sage-900' : 'border-sage-200 hover:border-sage-400 text-stone-600'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Calendar className="w-4 h-4" />
                                                {date}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-4">Available Slots</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {times.map(time => (
                                        <button
                                            key={time}
                                            onClick={() => setSelectedTime(time)}
                                            disabled={!selectedDate}
                                            className={`p-3 rounded-lg border text-sm transition-all ${selectedTime === time ? 'border-saffron-500 bg-saffron-50 font-bold text-sage-900' : !selectedDate ? 'opacity-50 cursor-not-allowed border-stone-200' : 'border-sage-200 hover:border-sage-400 text-stone-600'}`}
                                        >
                                            <div className="flex items-center justify-center gap-2">
                                                <Clock className="w-4 h-4" />
                                                {time}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-between pt-8">
                            <Button variant="outline" onClick={handleBack}>Back</Button>
                            <Button onClick={handleNext} disabled={!selectedTime}>Next Step <ArrowRight className="w-4 h-4 ml-2" /></Button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-serif font-bold text-sage-900 mb-6">Patient Details</h2>
                        <div className="space-y-4 max-w-lg">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={patientDetails.name}
                                    onChange={(e) => setPatientDetails({ ...patientDetails, name: e.target.value })}
                                    className="w-full p-2 border border-sage-200 rounded-md focus:ring-sage-500 focus:border-sage-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Age</label>
                                <input
                                    type="number"
                                    value={patientDetails.age}
                                    onChange={(e) => setPatientDetails({ ...patientDetails, age: e.target.value })}
                                    className="w-full p-2 border border-sage-200 rounded-md focus:ring-sage-500 focus:border-sage-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Health Concern (Brief)</label>
                                <textarea
                                    value={patientDetails.concern}
                                    onChange={(e) => setPatientDetails({ ...patientDetails, concern: e.target.value })}
                                    rows={4}
                                    className="w-full p-2 border border-sage-200 rounded-md focus:ring-sage-500 focus:border-sage-500"
                                    placeholder="Describe your symptoms..."
                                />
                            </div>
                        </div>
                        <div className="flex justify-between pt-8">
                            <Button variant="outline" onClick={handleBack}>Back</Button>
                            <Button onClick={handleNext} disabled={!patientDetails.name || !patientDetails.concern}>Confirm Booking <ArrowRight className="w-4 h-4 ml-2" /></Button>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="text-center py-12 space-y-6">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 mb-6">
                            <CheckCircle className="w-10 h-10" />
                        </div>
                        <h2 className="text-3xl font-serif font-bold text-sage-900">Booking Confirmed!</h2>
                        <p className="text-stone-600 max-w-md mx-auto">
                            Your video consultation with <strong>{selectedDoctor?.name}</strong> is scheduled for <strong>{selectedDate} at {selectedTime}</strong>.
                        </p>
                        <div className="bg-sage-50 p-4 rounded-lg inline-block text-left mb-6">
                            <h4 className="font-bold text-sage-900 mb-2 border-b border-sage-200 pb-2">Appointment Details</h4>
                            <div className="flex items-center gap-2 text-sm text-stone-600 py-1">
                                <User className="w-4 h-4" /> Patient: {patientDetails.name}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-stone-600 py-1">
                                <Video className="w-4 h-4" /> Link: Sent to email
                            </div>
                        </div>
                        <div className="block">
                            <Link to="/">
                                <Button size="lg">Return Home</Button>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Consultation;
