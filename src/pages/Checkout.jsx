import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { placeOrder as placeOrderApi } from '../lib/orders';
import { ShoppingCart, Truck, CreditCard, CheckCircle, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import Button from '../components/Button';
import { useCart } from '../context/CartContext';

const Checkout = () => {
    const { cartItems, cartTotal, clearCart } = useCart();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [orderId, setOrderId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        zip: '',
        paymentMethod: 'card'
    });

    useEffect(() => {
        if (cartItems.length === 0 && step === 1) {
            // navigate('/shop'); // Optional: Redirect if empty
        }
    }, [cartItems, step, navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    const placeOrder = async () => {
        setLoading(true);
        try {
            const orderPayload = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                city: formData.city,
                zip: formData.zip,
                totalAmount: cartTotal,
                paymentMethod: formData.paymentMethod,
                items: cartItems
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
                                    <div key={item.id} className="flex gap-4 border-b border-sage-100 pb-4">
                                        <div className="w-20 h-20 bg-sage-50 rounded-md overflow-hidden shrink-0">
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-sage-900">{item.name}</h3>
                                            <p className="text-sm text-stone-500">Unit Price: Rs. {item.price.toFixed(2)}</p>
                                            <p className="text-sm text-stone-500">Qty: {item.quantity}</p>
                                        </div>
                                        <div className="font-bold text-sage-900">
                                            Rs. {(item.price * item.quantity).toFixed(2)}
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-sm font-medium text-stone-700">Address</label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-sage-200 rounded-md focus:ring-sage-500 focus:border-sage-500"
                                        placeholder="123 Ayurveda Lane"
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
                                    <p className="text-xs text-stone-500">For delivery updates</p>
                                </div>
                            </div>

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
                                    {loading ? 'Processing...' : `Pay Rs. ${cartTotal.toFixed(2)}`}
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
                                    <span>Subtotal</span>
                                    <span>Rs. {cartTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-stone-600">
                                    <span>Shipping</span>
                                    <span className="text-green-600 font-medium">Free</span>
                                </div>
                                <div className="flex justify-between text-stone-600">
                                    <span>Tax (5%)</span>
                                    <span>Rs. {(cartTotal * 0.05).toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="pt-4 flex justify-between items-center">
                                <span className="font-bold text-sage-900 text-lg">Total</span>
                                <span className="font-bold text-sage-900 text-xl">Rs. {(cartTotal * 1.05).toFixed(2)}</span>
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
