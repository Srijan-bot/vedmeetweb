import React, { useState, useEffect } from 'react';
import { X, CreditCard, Lock, CheckCircle, Loader } from 'lucide-react';
import Button from './Button';

const FakePaymentModal = ({ isOpen, onClose, amount, onSuccess }) => {
    const [status, setStatus] = useState('input'); // input, processing, success
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');

    useEffect(() => {
        if (isOpen) {
            setStatus('input');
            setCardNumber('');
            setExpiry('');
            setCvv('');
        }
    }, [isOpen]);

    const handlePay = (e) => {
        e.preventDefault();
        setStatus('processing');

        // Fake processing delay
        setTimeout(() => {
            setStatus('success');
            setTimeout(() => {
                onSuccess();
            }, 1000);
        }, 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-stone-900 text-white p-6 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-green-400" />
                        <span className="font-medium text-sm">Secure Payment Gateway</span>
                    </div>
                    <button onClick={onClose} className="text-stone-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {status === 'input' && (
                        <form onSubmit={handlePay} className="space-y-4">
                            <div className="text-center mb-6">
                                <p className="text-stone-500 text-sm">Total Amount</p>
                                <h3 className="text-3xl font-bold text-stone-900">₹ {amount}</h3>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Card Number</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="0000 0000 0000 0000"
                                            className="w-full pl-10 pr-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-900 focus:border-stone-900 outline-none"
                                            value={cardNumber}
                                            onChange={(e) => setCardNumber(e.target.value)}
                                            required
                                        />
                                        <CreditCard className="absolute left-3 top-3.5 text-stone-400 w-5 h-5" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Expiry</label>
                                        <input
                                            type="text"
                                            placeholder="MM/YY"
                                            className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-900 focus:border-stone-900 outline-none"
                                            value={expiry}
                                            onChange={(e) => setExpiry(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-stone-500 uppercase mb-1">CVV</label>
                                        <input
                                            type="password"
                                            placeholder="123"
                                            className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-900 focus:border-stone-900 outline-none"
                                            value={cvv}
                                            onChange={(e) => setCvv(e.target.value)}
                                            maxLength={3}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-stone-900 text-white font-bold py-4 rounded-xl mt-4 hover:bg-stone-800 transition-colors shadow-lg shadow-stone-900/10"
                            >
                                Pay Now
                            </button>
                        </form>
                    )}

                    {status === 'processing' && (
                        <div className="py-12 flex flex-col items-center text-center space-y-4">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-stone-100 border-t-stone-900 rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Lock className="w-6 h-6 text-stone-900" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-stone-900">Processing Payment</h3>
                                <p className="text-stone-500 text-sm mt-1">Please do not close this window...</p>
                            </div>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="py-12 flex flex-col items-center text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
                                <CheckCircle className="w-10 h-10" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-stone-900">Payment Successful!</h3>
                                <p className="text-stone-500 text-sm mt-1">Redirecting you back...</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-stone-50 p-4 text-center border-t border-stone-100">
                    <p className="text-xs text-stone-400 flex items-center justify-center gap-1">
                        <Lock className="w-3 h-3" /> Encrypted by FakePay Secure
                    </p>
                </div>
            </div>
        </div>
    );
};

export default FakePaymentModal;
