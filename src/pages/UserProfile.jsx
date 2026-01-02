import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/Button';
import { User, MapPin, Package, FileText, Settings, LogOut, CheckCircle, Clock, AlertCircle, ShoppingCart, ChevronRight, Calendar, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrescriptions } from '../hooks/usePrescriptions';
import { useCart } from '../context/CartContext';
import PrescriptionUpload from '../components/PrescriptionUpload';
import { getUserOrders, getUserAppointments } from '../lib/data';

const UserProfile = () => {
    const { user, profile, loading: authLoading, signOut } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('profile');

    useEffect(() => {
        if (!authLoading && !user) navigate('/login');
    }, [user, authLoading, navigate]);

    if (authLoading) return <div className="min-h-screen pt-20 text-center">Loading...</div>;

    const tabs = [
        { id: 'profile', label: 'My Profile', icon: User },
        { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
        { id: 'orders', label: 'Order History', icon: Package },
        { id: 'appointments', label: 'Appointments', icon: Calendar },
        { id: 'prescriptions', label: 'Prescriptions', icon: FileText },
    ];

    return (
        <div className="min-h-screen bg-[#FAFAF9] pt-8 pb-20">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar */}
                    <div className="w-full md:w-64 flex-shrink-0 space-y-2">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-sage-100 mb-6 text-center">
                            <div className="w-20 h-20 bg-sage-100 rounded-full mx-auto flex items-center justify-center text-sage-600 text-2xl font-bold mb-3 border border-sage-200">
                                {profile?.full_name?.[0] || user?.email?.[0]?.toUpperCase()}
                            </div>
                            <h2 className="font-serif font-bold text-sage-900 truncate">{profile?.full_name || 'User'}</h2>
                            <p className="text-xs text-stone-500 truncate">{user?.email}</p>
                        </div>

                        <nav className="bg-white rounded-2xl shadow-sm border border-sage-100 overflow-hidden">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-6 py-4 text-sm font-medium transition-colors text-left border-l-4 ${activeTab === tab.id
                                        ? 'border-saffron-500 bg-sage-50 text-sage-900'
                                        : 'border-transparent text-stone-500 hover:bg-stone-50 hover:text-sage-700'
                                        }`}
                                >
                                    <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-saffron-600' : 'text-stone-400'}`} />
                                    {tab.label}
                                </button>
                            ))}
                            <button
                                onClick={signOut}
                                className="w-full flex items-center gap-3 px-6 py-4 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors text-left border-l-4 border-transparent"
                            >
                                <LogOut className="w-5 h-5" />
                                Sign Out
                            </button>
                        </nav>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 min-h-[500px]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                {activeTab === 'profile' && <ProfileTab user={user} profile={profile} />}
                                {activeTab === 'addresses' && <AddressesTab />}
                                {activeTab === 'orders' && <OrdersTab userId={user?.id} />}
                                {activeTab === 'appointments' && <AppointmentsTab userId={user?.id} />}
                                {activeTab === 'prescriptions' && <PrescriptionsTab userId={user?.id} />}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProfileTab = ({ user, profile }) => {
    // Reusing logic from CompleteProfile roughly, or just display mode
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        full_name: profile?.full_name || '',
        phone: profile?.phone || '',
        age: profile?.age || '',
        gender: profile?.gender || '',
        bio: profile?.bio || ''
    });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSave = async () => {
        try {
            const { error } = await supabase.from('profiles').update(formData).eq('id', user.id);
            if (error) throw error;
            setIsEditing(false);
            alert('Profile updated!');
        } catch (error) {
            console.error(error);
            alert('Failed to update profile');
        }
    };

    return (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-sage-100">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-serif font-bold text-sage-900">Personal Information</h2>
                {!isEditing && <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Edit</Button>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Full Name</label>
                    <input
                        type="text"
                        name="full_name"
                        disabled={!isEditing}
                        value={formData.full_name}
                        onChange={handleChange}
                        className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-sage-400 disabled:opacity-70 disabled:cursor-not-allowed"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Email</label>
                    <input
                        type="text"
                        disabled
                        value={user?.email}
                        className="w-full p-3 bg-stone-100 border border-stone-200 rounded-lg text-stone-500 cursor-not-allowed"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Phone</label>
                    <input
                        type="tel"
                        name="phone"
                        disabled={!isEditing}
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-sage-400 disabled:opacity-70"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Age</label>
                        <input
                            type="number"
                            name="age"
                            disabled={!isEditing}
                            value={formData.age}
                            onChange={handleChange}
                            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-sage-400 disabled:opacity-70"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Gender</label>
                        <select
                            name="gender"
                            disabled={!isEditing}
                            value={formData.gender}
                            onChange={handleChange}
                            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-sage-400 disabled:opacity-70"
                        >
                            <option value="">Select</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>
            </div>

            {isEditing && (
                <div className="mt-8 flex justify-end gap-3">
                    <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Changes</Button>
                </div>
            )}
        </div>
    );
};

const AddressesTab = () => {
    return (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-sage-100 min-h-[300px] flex items-center justify-center text-center">
            <div>
                <MapPin className="w-12 h-12 text-sage-200 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-sage-900">No Save Addresses</h3>
                <p className="text-stone-500 mb-6">You haven't added any addresses yet.</p>
                <Button variant="outline">Add New Address</Button>
            </div>
        </div>
    );
};

const OrdersTab = ({ userId }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            if (userId) {
                const data = await getUserOrders(userId);
                setOrders(data || []);
            }
            setLoading(false);
        };
        fetchOrders();
    }, [userId]);

    if (loading) return <div className="text-center py-10">Loading orders...</div>;

    if (orders.length === 0) {
        return (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-sage-100 min-h-[300px] flex items-center justify-center text-center">
                <div>
                    <Package className="w-12 h-12 text-sage-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-sage-900">No Orders Yet</h3>
                    <p className="text-stone-500 mb-6">Start shopping to see your orders here.</p>
                    <Link to="/shop"><Button>Browse Shop</Button></Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-2xl p-6 shadow-sm border border-sage-100">
                    <div className="flex justify-between items-start mb-4 border-b border-sage-50 pb-4">
                        <div>
                            <p className="text-xs text-stone-400 font-bold uppercase tracking-wider mb-1">
                                {new Date(order.created_at).toLocaleDateString()}
                            </p>
                            <h3 className="font-bold text-sage-900">Order #{order.id.slice(0, 8)}</h3>
                        </div>
                        <div className="text-right">
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase bg-green-100 text-green-800">
                                {order.status || 'Processing'}
                            </span>
                            <p className="font-bold text-sage-900 mt-1">Rs. {order.total_amount}</p>
                        </div>
                    </div>
                    {/* Simplified Item List */}
                    <div className="space-y-2">
                        {order.items?.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 text-sm text-stone-600">
                                <div className="w-8 h-8 bg-stone-100 rounded overflow-hidden shrink-0">
                                    <img src={item.product?.image} className="w-full h-full object-cover" alt="" />
                                </div>
                                <span className="flex-1 truncate">{item.product?.name}</span>
                                <span className="text-stone-400">x{item.quantity}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

const AppointmentsTab = ({ userId }) => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAppointments = async () => {
            if (userId) {
                const data = await getUserAppointments(userId);
                setAppointments(data || []);
            }
            setLoading(false);
        };
        fetchAppointments();
    }, [userId]);

    if (loading) return <div className="text-center py-10">Loading appointments...</div>;

    if (appointments.length === 0) {
        return (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-sage-100 min-h-[300px] flex items-center justify-center text-center">
                <div>
                    <Calendar className="w-12 h-12 text-sage-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-sage-900">No Appointments</h3>
                    <p className="text-stone-500 mb-6">Book a consultation with our ayurvedic experts.</p>
                    <Link to="/book-appointment"><Button>Book Appointment</Button></Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {appointments.map((apt) => (
                <div key={apt.id} className="bg-white rounded-2xl p-6 shadow-sm border border-sage-100 flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-24 h-24 bg-sage-50 rounded-xl overflow-hidden shrink-0">
                        {apt.doctors?.image ? (
                            <img src={apt.doctors.image} alt={apt.doctors.name} className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-full h-full p-6 text-sage-300" />
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-lg text-sage-900">{apt.doctors?.name || 'Doctor'}</h3>
                                <p className="text-sm text-stone-500">{apt.doctors?.specialty}</p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${apt.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                    apt.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                        'bg-stone-100 text-stone-600'
                                }`}>
                                {apt.status}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                            <div className="flex items-center gap-2 text-stone-600">
                                <Calendar className="w-4 h-4 text-saffron-500" />
                                {apt.appointment_date}
                            </div>
                            <div className="flex items-center gap-2 text-stone-600">
                                <Clock className="w-4 h-4 text-saffron-500" />
                                {apt.appointment_time}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const PrescriptionsTab = ({ userId }) => {
    const { getUserPrescriptions, loading } = usePrescriptions();
    const [prescriptions, setPrescriptions] = useState([]);
    const [subTab, setSubTab] = useState('ongoing'); // ongoing | history
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const { addToCart } = useCart();

    // Fetch data
    const refresh = async () => {
        if (userId) {
            const data = await getUserPrescriptions(userId);
            setPrescriptions(data);
        }
    };

    useEffect(() => { refresh(); }, [userId]);

    // Derived state
    const ongoing = prescriptions.filter(p => p.status === 'pending' || p.status === 'referred');
    const history = prescriptions.filter(p => p.status === 'rejected' || p.status === 'completed');

    const currentList = subTab === 'ongoing' ? ongoing : history;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex bg-white rounded-lg p-1 border border-sage-100">
                    <button
                        onClick={() => setSubTab('ongoing')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${subTab === 'ongoing' ? 'bg-sage-100 text-sage-900' : 'text-stone-500 hover:text-sage-700'}`}
                    >
                        Ongoing ({ongoing.length})
                    </button>
                    <button
                        onClick={() => setSubTab('history')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${subTab === 'history' ? 'bg-sage-100 text-sage-900' : 'text-stone-500 hover:text-sage-700'}`}
                    >
                        History ({history.length})
                    </button>
                </div>
                <Button size="sm" onClick={() => setIsUploadOpen(true)}>New Upload</Button>
            </div>

            <div className="space-y-4">
                {currentList.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center border border-sage-100">
                        <p className="text-stone-500">No {subTab} prescriptions found.</p>
                    </div>
                ) : (
                    currentList.map(p => (
                        <PrescriptionCard key={p.id} prescription={p} addToCart={addToCart} />
                    ))
                )}
            </div>

            <PrescriptionUpload
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                onUploadComplete={refresh}
            />
        </div>
    );
};

const PrescriptionCard = ({ prescription, addToCart }) => {
    const isReferred = prescription.status === 'referred';
    const items = prescription.items || [];
    const navigate = useNavigate();

    const handleAddAll = (e) => {
        e.stopPropagation();
        e.preventDefault();
        items.forEach(item => {
            if (item.product) addToCart(item.product);
        });
        alert(`Added ${items.length} medicines to cart`);
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-sage-100 hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row gap-6">
                {/* Image Thumbnail */}
                <div className="w-full md:w-32 h-32 bg-stone-100 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer" onClick={() => navigate(`/prescriptions/${prescription.id}`)}>
                    {prescription.image_path ? (
                        <img src={prescription.signedImageUrl} alt="Prescription" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-400">
                            <FileText />
                        </div>
                    )}
                </div>

                <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-xs text-stone-400 font-bold uppercase tracking-wider mb-1">
                                {new Date(prescription.created_at).toLocaleDateString()}
                            </p>
                            <h3 className="font-serif font-bold text-lg text-sage-900">
                                Prescription #{prescription.id.slice(0, 8)}
                            </h3>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${prescription.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            prescription.status === 'referred' ? 'bg-green-100 text-green-800' : 'bg-stone-100 text-stone-600'
                            }`}>
                            {prescription.status}
                        </div>
                    </div>

                    {/* Referred Content */}
                    {isReferred && items.length > 0 && (
                        <div className="mt-4 bg-sage-50 rounded-xl p-4 border border-sage-100">
                            <p className="text-xs font-bold text-sage-700 uppercase mb-2 flex items-center gap-2">
                                <CheckCircle className="w-3 h-3" /> Doctor Recommended Medicines
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                                {items.slice(0, 4).map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-sm text-stone-600">
                                        <div className="w-1 h-1 rounded-full bg-saffron-400"></div>
                                        {item.product?.name || 'Unknown Product'}
                                    </div>
                                ))}
                                {items.length > 4 && <div className="text-xs text-stone-400 pl-3">+{items.length - 4} more</div>}
                            </div>

                            <div className="flex gap-3">
                                <Button size="sm" onClick={handleAddAll} className="flex-1 bg-sage-900 text-white">
                                    Add All to Cart <ShoppingCart className="w-3 h-3 ml-2" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => navigate(`/prescriptions/${prescription.id}`)}>
                                    Need Help?
                                </Button>
                            </div>
                        </div>
                    )}

                    {!isReferred && (
                        <div className="mt-4 flex gap-3">
                            <Button size="sm" variant="outline" onClick={() => navigate(`/prescriptions/${prescription.id}`)}>
                                View Details <ChevronRight className="w-3 h-3 ml-1" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
