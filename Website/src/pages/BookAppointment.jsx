import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Calendar, User, CreditCard, CheckCircle, ChevronLeft, ChevronRight, Clock, ShieldCheck, Star } from 'lucide-react';
import Button from '../components/Button';
import { getDoctors, bookAppointment } from '../lib/data';
import FakePaymentModal from '../components/FakePaymentModal';

const BookAppointment = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [doctors, setDoctors] = useState([]);

    // State
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [appointmentId, setAppointmentId] = useState(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        patient_name: '',
        patient_email: '',
        patient_phone: '',
        date: '',
        time: '',
        paymentMethod: 'card'
    });

    // Generated Dates
    const [availableDates, setAvailableDates] = useState([]);
    const timeSlots = [
        '09:00 AM', '10:00 AM', '11:30 AM',
        '02:00 PM', '03:30 PM', '05:00 PM'
    ];

    useEffect(() => {
        const fetchDoctors = async () => {
            const data = await getDoctors();
            setDoctors(data);
            // Pre-select doctor if passed in navigation state
            if (location.state?.doctorId) {
                const doctor = data.find(d => d.id === location.state.doctorId);
                if (doctor) {
                    setSelectedDoctor(doctor);
                    setStep(2); // Skip to details if doctor selected
                }
            }
        };
        fetchDoctors();

        // Generate next 5 days
        const dates = [];
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        for (let i = 0; i < 5; i++) {
            const d = new Date();
            d.setDate(d.getDate() + i);
            dates.push({
                fullDate: d.toISOString().split('T')[0],
                dayName: days[d.getDay()],
                dayNumber: d.getDate(),
                month: months[d.getMonth()]
            });
        }
        setAvailableDates(dates);
        // Default select tomorrow
        if (dates.length > 1) {
            setFormData(prev => ({ ...prev, date: dates[1].fullDate }));
        }

    }, [location.state]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);


    const initiatePayment = () => {
        setIsPaymentModalOpen(true);
    };

    const handlePaymentSuccess = async () => {
        setIsPaymentModalOpen(false);
        await handleBookAppointment();
    };

    const handleBookAppointment = async () => {
        setLoading(true);
        try {
            const appointmentData = {
                doctor_id: selectedDoctor.id,
                patient_name: formData.patient_name,
                patient_email: formData.patient_email,
                patient_phone: formData.patient_phone,
                appointment_date: formData.date,
                appointment_time: formData.time,
                amount: selectedDoctor.price,
                payment_status: 'paid', // Fake success
                status: 'confirmed'
            };

            const newAppointment = await bookAppointment(appointmentData);
            setAppointmentId(newAppointment?.id || 'New-123'); // Fallback ID if simplified
            setStep(4);
            window.scrollTo(0, 0);
        } catch (error) {
            console.error("Booking failed", error);
            alert("Failed to book appointment. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { num: 1, label: 'Doctor', icon: User },
        { num: 2, label: 'Details', icon: Calendar },
        { num: 3, label: 'Payment', icon: CreditCard },
        { num: 4, label: 'Done', icon: CheckCircle },
    ];

    return (
        <div className="container mx-auto px-4 md:px-6 py-12">
            {/* Progress Bar */}
            <div className="max-w-4xl mx-auto mb-12">
                <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-sage-100 -z-10" />
                    <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-saffron-500 -z-10 transition-all duration-500"
                        style={{ width: `${((step - 1) / 3) * 100}%` }}
                    />

                    {steps.map((s) => (
                        <div key={s.num} className="flex flex-col items-center gap-2 bg-cream px-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${step >= s.num ? 'bg-saffron-500 border-saffron-500 text-white' : 'bg-white border-sage-200 text-sage-300'
                                }`}>
                                <s.icon className="w-5 h-5" />
                            </div>
                            <span className={`text-xs font-bold uppercase tracking-wider ${step >= s.num ? 'text-sage-900' : 'text-stone-400'}`}>
                                {s.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2">
                    {/* Step 1: Select Doctor */}
                    {step === 1 && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-sage-100 space-y-6">
                            <h2 className="text-2xl font-serif font-bold text-sage-900">Select Specialist</h2>
                            <div className="grid grid-cols-1 gap-4">
                                {doctors.map((doctor) => (
                                    <div
                                        key={doctor.id}
                                        className={`border rounded-xl p-5 cursor-pointer transition-all hover:shadow-md flex flex-col md:flex-row gap-5 items-start md:items-center ${selectedDoctor?.id === doctor.id ? 'border-saffron-500 bg-orange-50/50 ring-1 ring-saffron-500' : 'border-sage-100'}`}
                                        onClick={() => setSelectedDoctor(doctor)}
                                    >
                                        <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 bg-sage-50 border border-sage-100">
                                            {doctor.image ? (
                                                <img src={doctor.image} alt={doctor.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-full h-full p-5 text-sage-300" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold text-sage-900 text-lg">{doctor.name}</h3>
                                                    <p className="text-stone-600 font-medium">{doctor.specialty}</p>
                                                    <p className="text-sm text-stone-500 mt-1">{doctor.experience || '10+ Years Experience'}</p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold text-lg text-sage-900">Rs. {doctor.price}</div>
                                                    <div className="text-xs text-stone-500">per session</div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-dashed border-sage-200">
                                                <div className="flex items-center gap-1 text-sm font-medium text-stone-700">
                                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                    {doctor.rating || '4.9'} Rating
                                                </div>
                                                <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                                                    <CheckCircle className="w-4 h-4" />
                                                    Available Tomorrow
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button
                                    onClick={nextStep}
                                    size="lg"
                                    disabled={!selectedDoctor}
                                >
                                    Proceed to Details <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Details & Date */}
                    {step === 2 && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-sage-100 space-y-6">
                            <h2 className="text-2xl font-serif font-bold text-sage-900">Select Date & Time</h2>

                            {/* Date Chips */}
                            <div>
                                <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-3">Available Dates</h3>
                                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                    {availableDates.map((dateObj) => (
                                        <button
                                            key={dateObj.fullDate}
                                            onClick={() => setFormData(prev => ({ ...prev, date: dateObj.fullDate }))}
                                            className={`flex flex-col items-center justify-center min-w-[70px] h-[80px] rounded-xl border transition-all ${formData.date === dateObj.fullDate
                                                    ? 'bg-saffron-500 border-saffron-500 text-white shadow-md'
                                                    : 'bg-white border-sage-200 text-sage-600 hover:border-sage-400'
                                                }`}
                                        >
                                            <span className="text-xs uppercase font-medium mt-1">{dateObj.month}</span>
                                            <span className="text-2xl font-bold leading-none">{dateObj.dayNumber}</span>
                                            <span className="text-xs opacity-80 mb-1">{dateObj.dayName}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Time Slots */}
                            <div className="pt-2">
                                <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-3">Available Slots</h3>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                    {timeSlots.map((slot) => (
                                        <button
                                            key={slot}
                                            onClick={() => setFormData(prev => ({ ...prev, time: slot }))}
                                            className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${formData.time === slot
                                                    ? 'bg-sage-900 border-sage-900 text-white shadow-md'
                                                    : 'bg-white border-sage-200 text-stone-600 hover:border-sage-400'
                                                }`}
                                        >
                                            {slot}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Patient Info */}
                            <div className="space-y-4 pt-6 mt-6 border-t border-sage-100">
                                <h3 className="font-bold text-sage-900 text-lg">Patient Information</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-stone-700">Patient Name</label>
                                        <input
                                            type="text"
                                            name="patient_name"
                                            value={formData.patient_name}
                                            onChange={handleInputChange}
                                            className="w-full p-2 border border-sage-200 rounded-md focus:ring-sage-500 focus:border-sage-500"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-stone-700">Email</label>
                                            <input
                                                type="email"
                                                name="patient_email"
                                                value={formData.patient_email}
                                                onChange={handleInputChange}
                                                className="w-full p-2 border border-sage-200 rounded-md focus:ring-sage-500 focus:border-sage-500"
                                                placeholder="john@example.com"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-stone-700">Phone</label>
                                            <input
                                                type="tel"
                                                name="patient_phone"
                                                value={formData.patient_phone}
                                                onChange={handleInputChange}
                                                className="w-full p-2 border border-sage-200 rounded-md focus:ring-sage-500 focus:border-sage-500"
                                                placeholder="+91 98765 43210"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between pt-6">
                                <Button variant="outline" onClick={prevStep}><ChevronLeft className="w-4 h-4 mr-2" /> Back</Button>
                                <Button onClick={nextStep} disabled={!formData.date || !formData.time || !formData.patient_name}>
                                    Proceed to Payment <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Payment */}
                    {step === 3 && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-sage-100 space-y-6">
                            <h2 className="text-2xl font-serif font-bold text-sage-900">Payment Method</h2>

                            <div className="space-y-4">
                                <label className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${formData.paymentMethod === 'card' ? 'border-sage-500 bg-sage-50' : 'border-sage-100'}`}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="card"
                                        checked={formData.paymentMethod === 'card'}
                                        onChange={handleInputChange}
                                        className="text-sage-600 focus:ring-sage-500"
                                    />
                                    <div>
                                        <div className="font-bold text-sage-900">Credit / Debit Card</div>
                                        <div className="text-sm text-stone-500">Visa, Mastercard, RuPay</div>
                                    </div>
                                    <CreditCard className="ml-auto text-sage-400" />
                                </label>

                                <label className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${formData.paymentMethod === 'upi' ? 'border-sage-500 bg-sage-50' : 'border-sage-100'}`}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="upi"
                                        checked={formData.paymentMethod === 'upi'}
                                        onChange={handleInputChange}
                                        className="text-sage-600 focus:ring-sage-500"
                                    />
                                    <div>
                                        <div className="font-bold text-sage-900">UPI</div>
                                        <div className="text-sm text-stone-500">Google Pay, PhonePe, Paytm</div>
                                    </div>
                                </label>
                            </div>

                            <div className="flex justify-between pt-6">
                                <Button variant="outline" onClick={prevStep}><ChevronLeft className="w-4 h-4 mr-2" /> Back</Button>
                                <Button onClick={initiatePayment} disabled={loading} className="bg-saffron-500 hover:bg-saffron-600 text-white border-none">
                                    {loading ? 'Processing...' : `Pay Rs. ${selectedDoctor?.price}`}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Confirmation */}
                    {step === 4 && (
                        <div className="bg-white p-12 rounded-xl shadow-sm border border-sage-100 text-center space-y-6">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 mb-6">
                                <CheckCircle className="w-10 h-10" />
                            </div>
                            <h2 className="text-3xl font-serif font-bold text-sage-900">Appointment Confirmed!</h2>
                            <p className="text-stone-600 max-w-md mx-auto">
                                Your appointment with <strong>{selectedDoctor?.name}</strong> has been secured for <strong>{formData.date} at {formData.time}</strong>.
                            </p>
                            <p className="text-sm text-stone-500">Booking ID: {appointmentId}</p>
                            <div className="pt-8">
                                <Link to="/">
                                    <Button size="lg">Return Home</Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* Summary Sidebar (Hidden on Step 4) */}
                {step !== 4 && selectedDoctor && (
                    <div className="lg:col-span-1">
                        <div className="bg-sage-50 p-6 rounded-xl border border-sage-100 sticky top-24">
                            <h3 className="font-bold text-sage-900 mb-4 text-lg">Booking Summary</h3>

                            <div className="flex items-start gap-3 mb-6">
                                {selectedDoctor.image ? (
                                    <img src={selectedDoctor.image} alt="" className="w-14 h-14 rounded-full object-cover" />
                                ) : (
                                    <div className="w-14 h-14 rounded-full bg-sage-50 flex items-center justify-center">
                                        <User className="w-8 h-8 text-sage-300" />
                                    </div>
                                )}
                                <div>
                                    <div className="font-bold text-sage-900">{selectedDoctor.name}</div>
                                    <div className="text-sm text-stone-500">{selectedDoctor.specialty}</div>
                                </div>
                            </div>

                            <div className="space-y-3 pb-4 border-b border-sage-200 text-sm">
                                <div className="flex justify-between text-stone-600">
                                    <span>Consultation Fee</span>
                                    <span>Rs. {selectedDoctor.price}</span>
                                </div>
                                <div className="flex justify-between text-stone-600">
                                    <span>Date</span>
                                    <span>{formData.date || '-'}</span>
                                </div>
                                <div className="flex justify-between text-stone-600">
                                    <span>Time</span>
                                    <span>{formData.time || '-'}</span>
                                </div>
                            </div>
                            <div className="pt-4 flex justify-between items-center">
                                <span className="font-bold text-sage-900 text-lg">Total</span>
                                <span className="font-bold text-sage-900 text-xl">Rs. {selectedDoctor.price}</span>
                            </div>
                            <div className="mt-6 flex items-center gap-2 text-xs text-stone-500 bg-white p-3 rounded border border-sage-100">
                                <ShieldCheck className="w-4 h-4 text-sage-600" />
                                Secure Payment with SSL
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <FakePaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                amount={selectedDoctor?.price}
                onSuccess={handlePaymentSuccess}
            />
        </div>
    );
};

export default BookAppointment;
