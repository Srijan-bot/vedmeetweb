import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { placeOrder as placeOrderApi } from '../lib/orders';
import { ShoppingCart, Truck, CreditCard, CheckCircle, ChevronLeft, ChevronRight, ShieldCheck, MapPin, Plus } from 'lucide-react';
import Button from '../components/Button';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import LocationPicker from '../components/LocationPicker';
import { getSetting, getWarehouses } from '../lib/data';
import { calculateShippingCost, calculateDistance } from '../lib/shippingUtils';

const Checkout = () => {
    const { cartItems, cartSubtotal, cartTax, cartTotal, clearCart } = useCart();

    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [orderId, setOrderId] = useState(null);

    const { user, profile } = useAuth();
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [showAddressPicker, setShowAddressPicker] = useState(false);
    const [isAddingAddress, setIsAddingAddress] = useState(false);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [isEditingContact, setIsEditingContact] = useState(false);

    // Shipping Logic State
    const [shippingRates, setShippingRates] = useState([]);
    const [packagingBoxes, setPackagingBoxes] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [shippingCostData, setShippingCostData] = useState(null);
    const [distanceKm, setDistanceKm] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: user?.email || '',
        phone: '',
        address: '',
        houseNo: '',
        landmark: '',
        city: '',
        zip: '',
        paymentMethod: 'card'
    });

    useEffect(() => {
        if (user) {
            const fetchAddresses = async () => {
                const { data } = await supabase.from('user_addresses').select('*').order('is_default', { ascending: false });
                if (data) {
                    setSavedAddresses(data);

                    // Auto-fill default address if form is empty
                    const defaultAddr = data.find(a => a.is_default);
                    if (defaultAddr && !formData.address) {
                        setFormData(prev => ({
                            ...prev,
                            ...prev,
                            address: defaultAddr.full_address,
                            houseNo: defaultAddr.house_no || '',
                            landmark: defaultAddr.landmark || '',
                            city: defaultAddr.city,
                            zip: defaultAddr.zip_code,
                            coordinates: defaultAddr.coordinates
                        }));
                    }
                }
            };
            fetchAddresses();
        }

        // Auto-fill profile info
        if (profile) {
            const names = (profile.full_name || '').split(' ');
            const firstName = names[0] || '';
            const lastName = names.slice(1).join(' ') || '';

            setFormData(prev => ({
                ...prev,
                firstName: prev.firstName || firstName,
                lastName: prev.lastName || lastName,
                phone: prev.phone || profile.phone_number || ''
            }));
        }
    }, [user, profile]);

    // Fetch Shipping Settings
    useEffect(() => {
        const loadSettings = async () => {
            const rates = await getSetting('shipping_rates');
            const boxes = await getSetting('packaging_boxes');
            const wh = await getWarehouses();
            if (rates) setShippingRates(rates);
            if (boxes) setPackagingBoxes(boxes);
            if (wh) setWarehouses(wh);
        };
        loadSettings();
    }, []);

    // Calculate Shipping when address/cart changes
    useEffect(() => {
        if (!formData.coordinates || !shippingRates.length || !packagingBoxes.length) {
            setShippingCostData(null);
            return;
        }

        // 1. Get Distance
        const mainWh = warehouses.find(w => w.coordinates) || warehouses[0];
        let dist = 0;
        if (mainWh && mainWh.coordinates && formData.coordinates) {
            dist = calculateDistance(formData.coordinates, mainWh.coordinates);
        }

        // Fallback: If distance calc failed (e.g. no coords), check City match
        if (!dist && mainWh && formData.city) {
            const userCity = formData.city.trim().toLowerCase();
            const whCity = (mainWh.city || '').trim().toLowerCase();

            if (userCity && whCity && userCity === whCity) {
                // Same city -> Assume Local
                dist = 5;
            }
        }

        if (!dist) {
            // If still no distance (no coords AND no city entered), do not calculate
            setShippingCostData(null);
            return;
        }

        setDistanceKm(dist);

        // 2. Prepare Items
        // Cart items might be flat objects. logic expects { product: {...}, quantity }
        const orderForCalc = {
            items: cartItems.map(i => ({
                product: i, // pass full item as product
                variant: i.variant, // if variant info is separate
                quantity: i.quantity
            }))
        };

        const result = calculateShippingCost(orderForCalc, shippingRates, packagingBoxes, dist);
        setShippingCostData(result);

    }, [formData.coordinates, cartItems, shippingRates, packagingBoxes, warehouses]);

    const finalTotal = cartTotal + (shippingCostData?.totalCost || 0);

    const handleAddressSelect = (addr) => {
        setFormData(prev => ({
            ...prev,
            address: addr.full_address,
            houseNo: addr.house_no || '',
            landmark: addr.landmark || '',
            city: addr.city,
            zip: addr.zip_code,
            coordinates: addr.coordinates
        }));
        // Just select, don't open edit mode unless explicitly editing
        setIsAddingAddress(false);
        setIsPickerOpen(false);
    };

    const handleNewAddress = (addrData) => {
        const coordString = addrData.coordinates ? `(${addrData.coordinates[0]},${addrData.coordinates[1]})` : null;

        setFormData(prev => ({
            ...prev,
            address: addrData.full_address,
            street: addrData.street,
            city: addrData.city,
            zip: addrData.zip_code,
            coordinates: coordString
        }));

        setIsPickerOpen(false);
        // Do not close isAddingAddress yet, let user fill details
    };

    useEffect(() => {
        if (cartItems.length === 0 && step === 1) {
            // navigate('/shop'); // Optional: Redirect if empty
        }
    }, [cartItems, step, navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const nextStep = async () => {
        if (step === 2) {
            // Check if address is selected/valid
            if (!formData.address || !formData.city || !formData.zip) {
                alert("Please select or enter a valid shipping address.");
                return;
            }

            // If adding new address, save it now
            if (isAddingAddress && user) {
                const { error } = await supabase.from('user_addresses').insert({
                    user_id: user.id,
                    full_address: formData.address,
                    street: formData.houseNo,
                    house_no: formData.houseNo,
                    landmark: formData.landmark,
                    city: formData.city,
                    zip_code: formData.zip,
                    coordinates: formData.coordinates,
                    is_default: savedAddresses.length === 0
                });

                if (!error) {
                    // Refresh addresses
                    const { data } = await supabase.from('user_addresses').select('*').order('is_default', { ascending: false });
                    if (data) {
                        setSavedAddresses(data);
                        // find the one we just added? or just stay selected
                    }
                    setIsAddingAddress(false);
                } else {
                    console.error("Error saving address:", error);
                    alert("Failed to save new address. Please try again.");
                    return; // Don't proceed if save failed
                }
            }
        }
        setStep(prev => prev + 1);
    };
    const prevStep = () => setStep(prev => prev - 1);

    const placeOrder = async () => {
        setLoading(true);
        try {
            const orderPayload = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                address: `${formData.houseNo ? formData.houseNo + ', ' : ''}${formData.address}${formData.landmark ? ', Near ' + formData.landmark : ''}`,
                city: formData.city,
                zip: formData.zip,
                totalAmount: finalTotal, // Use final total with shipping
                shippingCost: shippingCostData?.totalCost || 0, // Store shipping separately if backend supports
                taxAmount: cartTax, // Explicitly pass tax amount
                shippingDetails: shippingCostData, // Optional: store full breakdown
                paymentMethod: formData.paymentMethod,
                items: cartItems,
                coordinates: formData.coordinates
            };

            const newOrderId = await placeOrderApi(orderPayload);

            setOrderId(newOrderId);
            clearCart();
            setStep(4);
            window.scrollTo(0, 0);
        } catch (error) {
            console.error("Order placement failed", error);
            alert("Failed to place order. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (cartItems.length === 0 && step !== 4) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h2 className="text-2xl font-serif font-bold text-sage-900 mb-4">Your Cart is Empty</h2>
                <p className="text-stone-600 mb-8">Add some authentic Ayurvedic remedies to your cart first.</p>
                <Link to="/shop">
                    <Button size="lg">Start Shopping</Button>
                </Link>
            </div>
        );
    }

    const steps = [
        { num: 1, label: 'Cart', icon: ShoppingCart },
        { num: 2, label: 'Shipping', icon: Truck },
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
                    {/* Step 1: Cart Review */}
                    {step === 1 && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-sage-100 space-y-6">
                            <h2 className="text-2xl font-serif font-bold text-sage-900">Shopping Cart</h2>
                            <div className="space-y-4">
                                {cartItems.map((item) => (
                                    <div key={`${item.id}-${item.variantId || 'default'}`} className="flex gap-4 border-b border-sage-100 pb-4">
                                        <div className="w-20 h-20 bg-sage-50 rounded-md overflow-hidden shrink-0">
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-sage-900">{item.name}</h3>
                                            <p className="text-sm text-stone-500">Unit Price: Rs. {item.price.toFixed(2)}</p>
                                            <p className="text-sm text-stone-500">Qty: {item.quantity}</p>
                                        </div>
                                        <div className="font-bold text-sage-900">
                                            Rs. {((item.price * (1 + (item.gst_rate || 0) / 100)) * item.quantity).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button onClick={nextStep} size="lg">Proceed to Shipping <ChevronRight className="w-4 h-4 ml-2" /></Button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Shipping Info */}
                    {step === 2 && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-sage-100 space-y-6">
                            <h2 className="text-2xl font-serif font-bold text-sage-900">Shipping Details</h2>

                            {/* Contact Details Section */}
                            <div className="mb-6">
                                <h3 className="text-sm font-bold text-stone-500 uppercase mb-3">Contact Information</h3>
                                {user && !isEditingContact ? (
                                    <div className="flex items-start gap-4 p-4 rounded-xl border border-sage-200 bg-stone-50">
                                        <div className="flex-1">
                                            <p className="font-bold text-sage-900">{formData.firstName} {formData.lastName}</p>
                                            <p className="text-stone-600 dark:text-stone-400 text-sm">{formData.email}</p>
                                            <p className="text-stone-600 dark:text-stone-400 text-sm">{formData.phone}</p>
                                        </div>
                                        <button
                                            onClick={() => setIsEditingContact(true)}
                                            className="text-saffron-600 text-sm font-bold hover:underline"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-stone-700">First Name</label>
                                            <input
                                                type="text"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleInputChange}
                                                className="w-full p-2 border border-sage-200 rounded-md focus:ring-sage-500 focus:border-sage-500"
                                                placeholder="John"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-stone-700">Last Name</label>
                                            <input
                                                type="text"
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleInputChange}
                                                className="w-full p-2 border border-sage-200 rounded-md focus:ring-sage-500 focus:border-sage-500"
                                                placeholder="Doe"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-stone-700">Email</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className="w-full p-2 border border-sage-200 rounded-md focus:ring-sage-500 focus:border-sage-500"
                                                disabled={!!user}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-stone-700">Phone</label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                className="w-full p-2 border border-sage-200 rounded-md focus:ring-sage-500 focus:border-sage-500"
                                                placeholder="+91 98765 43210"
                                            />
                                        </div>
                                        {isEditingContact && (
                                            <div className="md:col-span-2 flex justify-end">
                                                <Button size="sm" onClick={() => setIsEditingContact(false)}>Save Contact Info</Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Saved Addresses List */}
                            {user && savedAddresses.length > 0 && !isAddingAddress && (
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-bold text-stone-500 uppercase">Select Shipping Address</h3>
                                        <button
                                            onClick={() => {
                                                // Clear form for new address
                                                setFormData(prev => ({ ...prev, address: '', houseNo: '', landmark: '', city: '', zip: '', coordinates: null }));
                                                setIsAddingAddress(true);
                                                setIsPickerOpen(true);
                                            }}
                                            className="text-saffron-600 text-sm font-bold hover:underline flex items-center gap-1"
                                        >
                                            <Plus className="w-4 h-4" /> Add New Address
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        {savedAddresses.map(addr => (
                                            <div
                                                key={addr.id}
                                                onClick={() => handleAddressSelect(addr)}
                                                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-4
                                                    ${formData.address === addr.full_address
                                                        ? 'border-saffron-500 bg-saffron-50/50'
                                                        : 'border-sage-100 bg-white hover:border-sage-300'}`}
                                            >
                                                <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                                                    ${formData.address === addr.full_address ? 'border-saffron-500' : 'border-stone-300'}`}>
                                                    {formData.address === addr.full_address && (
                                                        <div className="w-2.5 h-2.5 bg-saffron-500 rounded-full" />
                                                    )}
                                                </div>

                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <p className="font-bold text-sage-900 text-sm">{addr.label || 'Home'}</p>
                                                        {addr.is_default && <span className="text-[10px] font-bold bg-sage-100 text-sage-700 px-2 py-0.5 rounded-full">DEFAULT</span>}
                                                    </div>
                                                    <p className="text-sm text-stone-600 mt-1">{addr.full_address}</p>
                                                    <p className="text-xs text-stone-500 mt-0.5">
                                                        {addr.house_no ? `${addr.house_no}, ` : ''}{addr.city} - {addr.zip_code}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Add/Edit Address Form */}
                            {(isAddingAddress || (!user || savedAddresses.length === 0)) && (
                                <div className="bg-stone-50 p-6 rounded-xl border border-sage-200 relative">
                                    {savedAddresses.length > 0 && isAddingAddress && (
                                        <button
                                            onClick={() => setIsAddingAddress(false)}
                                            className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 p-1"
                                            title="Cancel"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    )}

                                    <h3 className="font-serif font-bold text-lg text-sage-900 mb-4">
                                        {isAddingAddress && savedAddresses.length > 0 ? 'Add New Address' : 'Enter Shipping Address'}
                                    </h3>

                                    {/* Location Picker Modal/View */}
                                    {isPickerOpen && (
                                        <div className="mb-6 p-1 bg-white rounded-xl border border-sage-200 shadow-sm overflow-hidden">
                                            <div className="flex justify-between items-center p-3 bg-sage-50 border-b border-sage-100">
                                                <h4 className="text-sm font-bold text-sage-900">Pin Location on Map</h4>
                                                <button onClick={() => setIsPickerOpen(false)} className="text-xs text-stone-500 hover:text-stone-800 underline">Close Map</button>
                                            </div>
                                            <div className="h-64 sm:h-80 w-full relative">
                                                <LocationPicker
                                                    onSelectAddress={handleNewAddress}
                                                    onCancel={() => setIsPickerOpen(false)}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {!isPickerOpen && (
                                        <div className="flex justify-end mb-4">
                                            <button
                                                type="button"
                                                onClick={() => setIsPickerOpen(true)}
                                                className="text-sm font-bold text-saffron-600 hover:text-saffron-700 flex items-center gap-1.5 bg-saffron-50 px-3 py-1.5 rounded-lg border border-saffron-100 transition-colors"
                                            >
                                                <MapPin className="w-4 h-4" /> Pick Location on Map
                                            </button>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2 space-y-1.5">
                                            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Address Line</label>
                                            <input
                                                type="text"
                                                name="address"
                                                value={formData.address}
                                                onChange={handleInputChange}
                                                className="w-full p-2.5 border border-sage-200 rounded-lg focus:ring-2 focus:ring-sage-400 focus:border-sage-400 outline-none transition-all placeholder:text-stone-300"
                                                placeholder="123 Ayurveda Lane, Green Valley"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">House / Flat No.</label>
                                            <input
                                                type="text"
                                                name="houseNo"
                                                value={formData.houseNo}
                                                onChange={handleInputChange}
                                                className="w-full p-2.5 border border-sage-200 rounded-lg focus:ring-2 focus:ring-sage-400 focus:border-sage-400 outline-none transition-all placeholder:text-stone-300"
                                                placeholder="Flat 101"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Landmark</label>
                                            <input
                                                type="text"
                                                name="landmark"
                                                value={formData.landmark}
                                                onChange={handleInputChange}
                                                className="w-full p-2.5 border border-sage-200 rounded-lg focus:ring-2 focus:ring-sage-400 focus:border-sage-400 outline-none transition-all placeholder:text-stone-300"
                                                placeholder="Near Central Park"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">City</label>
                                            <input
                                                type="text"
                                                name="city"
                                                value={formData.city}
                                                onChange={handleInputChange}
                                                className="w-full p-2.5 border border-sage-200 rounded-lg focus:ring-2 focus:ring-sage-400 focus:border-sage-400 outline-none transition-all placeholder:text-stone-300"
                                                placeholder="Mumbai"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">ZIP / Pincode</label>
                                            <input
                                                type="text"
                                                name="zip"
                                                value={formData.zip}
                                                onChange={handleInputChange}
                                                className="w-full p-2.5 border border-sage-200 rounded-lg focus:ring-2 focus:ring-sage-400 focus:border-sage-400 outline-none transition-all placeholder:text-stone-300"
                                                placeholder="400001"
                                            />
                                        </div>
                                    </div>

                                    {isAddingAddress && savedAddresses.length > 0 && (
                                        <div className="mt-6 flex justify-end gap-3">
                                            <Button variant="outline" size="sm" onClick={() => setIsAddingAddress(false)}>
                                                Cancel
                                            </Button>
                                            <Button size="sm" onClick={nextStep} className="bg-sage-900 text-white">
                                                Save & Use Address
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-between pt-6">
                                <Button variant="outline" onClick={prevStep}><ChevronLeft className="w-4 h-4 mr-2" /> Back to Cart</Button>
                                <Button onClick={nextStep}>Proceed to Payment <ChevronRight className="w-4 h-4 ml-2" /></Button>
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

                                <label className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${formData.paymentMethod === 'cod' ? 'border-sage-500 bg-sage-50' : 'border-sage-100'}`}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="cod"
                                        checked={formData.paymentMethod === 'cod'}
                                        onChange={handleInputChange}
                                        className="text-sage-600 focus:ring-sage-500"
                                    />
                                    <div>
                                        <div className="font-bold text-sage-900">Cash on Delivery</div>
                                        <div className="text-sm text-stone-500">Pay when your order arrives</div>
                                    </div>
                                </label>
                            </div>

                            <div className="flex justify-between pt-6">
                                <Button variant="outline" onClick={prevStep}><ChevronLeft className="w-4 h-4 mr-2" /> Back</Button>
                                <Button onClick={placeOrder} disabled={loading} className="bg-saffron-500 hover:bg-saffron-600 text-white border-none">
                                    {loading ? 'Processing...' : `Pay Rs. ${finalTotal.toFixed(2)}`}
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
                            <h2 className="text-3xl font-serif font-bold text-sage-900">Order Placed Successfully!</h2>
                            <p className="text-stone-600 max-w-md mx-auto">
                                Thank you for choosing Vedmeet. Your order <strong>#{orderId}</strong> has been confirmed and will be shipped shortly.
                            </p>
                            <div className="pt-8">
                                <Link to="/shop">
                                    <Button size="lg">Continue Shopping</Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* Summary Sidebar (Hidden on Step 4) */}
                {step !== 4 && (
                    <div className="lg:col-span-1">
                        <div className="bg-sage-50 p-6 rounded-xl border border-sage-100 sticky top-24">
                            <h3 className="font-bold text-sage-900 mb-4 text-lg">Order Summary</h3>
                            <div className="space-y-3 pb-4 border-b border-sage-200 text-sm">
                                <div className="flex justify-between text-stone-600">
                                    <span>Subtotal (Excl. Tax)</span>
                                    <span>Rs. {cartSubtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-stone-600">
                                    <span>Shipping</span>
                                    {shippingCostData ? (
                                        <span className="text-sage-900 font-medium">Rs. {shippingCostData.totalCost}</span>
                                    ) : (
                                        <span className="text-orange-600 text-xs">{formData.coordinates ? 'Calculating...' : 'Enter Address'}</span>
                                    )}
                                </div>
                                <div className="flex justify-between text-stone-600">
                                    <span>Total GST</span>
                                    <span>Rs. {cartTax.toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="pt-4 flex justify-between items-center">
                                <span className="font-bold text-sage-900 text-lg">Total Payable</span>
                                <span className="font-bold text-sage-900 text-xl">Rs. {finalTotal.toFixed(2)}</span>
                            </div>
                            <div className="mt-6 flex items-center gap-2 text-xs text-stone-500 bg-white p-3 rounded border border-sage-100">
                                <ShieldCheck className="w-4 h-4 text-sage-600" />
                                Secure Checkout with SSL
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Checkout;
