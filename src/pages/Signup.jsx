import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import { Mail, Lock, Check } from 'lucide-react';

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const { signUp } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            return setError("Passwords do not match");
        }

        setLoading(true);
        setError(null);

        try {
            const { error: signUpError, data } = await signUp(email, password);
            if (signUpError) throw signUpError;

            // Check if user is created but session is null (implies email confirmation required)
            if (data?.user && !data?.session) {
                setSuccess(true);
            } else {
                // If session exists immediately (e.g. email confirm off), proceed
                navigate('/complete-profile');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center bg-cream px-4">
                <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-sage-100 text-center">
                    <div className="w-16 h-16 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Mail className="h-8 w-8 text-sage-600" />
                    </div>
                    <h1 className="text-2xl font-serif font-bold text-sage-900 mb-4">Check Your Email</h1>
                    <p className="text-stone-600 mb-6">
                        We have sent a verification link to <span className="font-semibold">{email}</span>.
                        Please click the link to verify your account and complete your profile.
                    </p>
                    <div className="flex flex-col gap-3">
                        <Link to="/login">
                            <Button className="w-full">Proceed to Login</Button>
                        </Link>
                        <button
                            onClick={() => setSuccess(false)}
                            className="text-stone-500 text-sm hover:text-sage-600"
                        >
                            Back to Signup
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-cream px-4">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-sage-100">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-serif font-bold text-sage-900 mb-2">Create Account</h1>
                    <p className="text-stone-600">Join Vedmeet for a personalized journey</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 h-5 w-5" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all"
                                placeholder="you@example.com"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 h-5 w-5" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Confirm Password</label>
                        <div className="relative">
                            <Check className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 h-5 w-5" />
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={loading}
                    >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </Button>
                </form>

                <div className="mt-8 text-center text-sm text-stone-600">
                    Already have an account?{' '}
                    <Link to="/login" className="text-earth-600 font-semibold hover:text-earth-700">
                        Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Signup;
