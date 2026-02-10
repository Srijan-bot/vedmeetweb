import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Save, Loader, User, Phone, Briefcase } from 'lucide-react';

const AgentOnboardingModal = () => {
    const { profile, updateProfile, loading: authLoading } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        agent_name: '',
        contact_no: ''
    });

    useEffect(() => {
        if (!authLoading && profile) {
            // Check if user is agent and missing details
            if (profile.role === 'agent') {
                const missingDetails = !profile.agent_name || !profile.contact_no;
                if (missingDetails) {
                    setIsOpen(true);
                    // Pre-fill existing data if any (e.g. partial info)
                    setFormData({
                        agent_name: profile.agent_name || '',
                        contact_no: profile.contact_no || ''
                    });
                } else {
                    setIsOpen(false);
                }
            }
        }
    }, [profile, authLoading]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await updateProfile({
                agent_name: formData.agent_name,
                contact_no: formData.contact_no
            });

            if (error) throw error;

            // Modal will close automatically via useEffect when profile updates
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300">
                {/* Header */}
                <div className="bg-sage-900 px-8 py-6 text-center">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                        <Briefcase className="w-8 h-8 text-sage-200" />
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-white mb-2">Welcome, Agent!</h2>
                    <p className="text-sage-200 text-sm">Please complete your profile to access the dashboard.</p>
                </div>

                {/* Form */}
                <div className="p-8">
                    <div className="mb-6 bg-orange-50 border border-orange-100 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-orange-800">
                            We need a few more details to set up your agent account and generate your unique employment code.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-stone-700">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                                <input
                                    type="text"
                                    required
                                    value={formData.agent_name}
                                    onChange={e => setFormData(prev => ({ ...prev, agent_name: e.target.value }))}
                                    className="w-full pl-10 pr-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-sage-500 focus:border-sage-500 outline-none transition-all placeholder:text-stone-300"
                                    placeholder="Enter your full name"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-stone-700">Contact Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                                <input
                                    type="tel"
                                    required
                                    pattern="[0-9]{10}"
                                    title="Please enter a valid 10-digit mobile number"
                                    value={formData.contact_no}
                                    onChange={e => {
                                        const val = e.target.value.replace(/\D/g, ''); // Only numbers
                                        if (val.length <= 10) {
                                            setFormData(prev => ({ ...prev, contact_no: val }));
                                        }
                                    }}
                                    className="w-full pl-10 pr-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-sage-500 focus:border-sage-500 outline-none transition-all placeholder:text-stone-300"
                                    placeholder="9876543210"
                                />
                            </div>
                            <p className="text-xs text-stone-500 pl-1">Enter a valid 10-digit mobile number</p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-sage-900 text-white rounded-xl font-medium hover:bg-sage-800 focus:ring-4 focus:ring-sage-100 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader className="w-5 h-5 animate-spin" />
                                    Saving Details...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Complete Profile
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AgentOnboardingModal;
