import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePrescriptions } from '../hooks/usePrescriptions';
import { useCart } from '../context/CartContext';
import Button from '../components/Button';
import { ArrowLeft, ShoppingBag, Send, AlertCircle, FileText, Clock, MessageCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const PrescriptionDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getPrescriptionDetails, addQuery, loading } = usePrescriptions();
    const { addToCart } = useCart();

    const [details, setDetails] = useState(null);
    const [query, setQuery] = useState('');
    const [user, setUser] = useState(null);
    const [sendingQuery, setSendingQuery] = useState(false);

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { navigate('/login'); return; }
            setUser(user);
            const data = await getPrescriptionDetails(id);
            setDetails(data);
        };
        init();
    }, [id]);

    const handleAddAllToCart = () => {
        details.items.forEach(item => {
            addToCart(item.product);
        });
        alert("All items added to cart!");
    };

    const handleSendQuery = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;
        setSendingQuery(true);
        try {
            await addQuery(id, query, user.id);
            setQuery('');
            const data = await getPrescriptionDetails(id); // Refresh to see new query
            setDetails(data);
        } catch (error) {
            console.error(error);
        } finally {
            setSendingQuery(false);
        }
    };

    if (loading || !details) return <div className="p-12 text-center">Loading details...</div>;

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <button onClick={() => navigate('/prescriptions')} className="flex items-center text-stone-500 hover:text-sage-900 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Prescriptions
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Image & Info */}
                <div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-sage-100 mb-6">
                        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-saffron-500" /> Original Prescription
                        </h2>
                        {details.signedImageUrl ? (
                            <img src={details.signedImageUrl} alt="Prescription" className="w-full rounded-lg border border-sage-50" />
                        ) : (
                            <div className="h-64 bg-stone-100 flex items-center justify-center rounded-lg text-stone-400">Image not available</div>
                        )}
                        <p className="text-xs text-stone-400 mt-2 text-center">Uploaded on {new Date(details.created_at).toLocaleDateString()}</p>
                    </div>

                    {/* Queries Section */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-sage-100 h-96 flex flex-col">
                        <h3 className="font-bold text-sage-900 mb-4 px-2 flex items-center gap-2">
                            <MessageCircle className="w-5 h-5 text-saffron-500" /> Have questions? Ask here
                        </h3>
                        <div className="flex-1 overflow-y-auto space-y-3 px-2 mb-4">
                            {details.queries?.length === 0 ? (
                                <p className="text-sm text-stone-400 italic text-center mt-10">No questions asked yet.</p>
                            ) : (
                                details.queries.map((q) => (
                                    <div key={q.id} className="bg-sage-50 p-3 rounded-lg text-sm">
                                        <p className="font-medium text-sage-900">You asked:</p>
                                        <p className="text-stone-700">{q.message}</p>
                                        <span className="text-[10px] text-stone-400">{new Date(q.created_at).toLocaleTimeString()}</span>
                                    </div>
                                ))
                            )}
                        </div>
                        <form onSubmit={handleSendQuery} className="flex gap-2">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Ask a question..."
                                className="flex-1 border border-sage-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-saffron-500"
                            />
                            <button
                                type="submit"
                                disabled={sendingQuery}
                                className="bg-saffron-500 text-white p-2 rounded-lg hover:bg-saffron-600 disabled:opacity-50"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right: Referred Medicines */}
                <div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-sage-100 min-h-full">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-2xl font-serif font-bold text-sage-900">Prescription Items</h1>
                                <p className="text-sm text-stone-500">
                                    Status: <span className="font-semibold uppercase text-saffron-600">{details.status}</span>
                                </p>
                            </div>
                            {details.items?.length > 0 && (
                                <Button onClick={handleAddAllToCart} size="sm">
                                    Add All to Cart
                                </Button>
                            )}
                        </div>

                        {details.status === 'pending' ? (
                            <div className="text-center py-12 bg-yellow-50 rounded-xl border border-yellow-100">
                                <Clock className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                                <h3 className="font-bold text-yellow-800">Under Review</h3>
                                <p className="text-sm text-yellow-700 mt-1 max-w-xs mx-auto">
                                    Our doctors are reviewing your prescription. You will be notified once medicines are added.
                                </p>
                            </div>
                        ) : details.items?.length === 0 ? (
                            <div className="text-center py-12">No items found.</div>
                        ) : (
                            <div className="space-y-4">
                                {details.items.map((item) => (
                                    <div key={item.id} className="flex gap-4 p-4 border border-sage-100 rounded-lg hover:border-saffron-200 transition-colors">
                                        {item.product?.images?.[0] ? (
                                            <img
                                                src={item.product.images[0]}
                                                alt={item.product.name}
                                                className="w-20 h-20 object-cover rounded-md bg-stone-100"
                                            />
                                        ) : (
                                            <div className="w-20 h-20 rounded-md bg-stone-100 flex items-center justify-center text-stone-300">
                                                <ShoppingBag className="w-8 h-8" />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-sage-900">{item.product?.name}</h4>
                                                {item.is_alternative && (
                                                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">Alternative</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-stone-500 mt-1 line-clamp-1">{item.product?.description}</p>

                                            {item.doctor_note && (
                                                <div className="mt-2 text-xs bg-yellow-50 text-yellow-800 p-2 rounded flex gap-2">
                                                    <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                                    {item.doctor_note}
                                                </div>
                                            )}

                                            <div className="flex justify-between items-center mt-3">
                                                <span className="font-bold text-saffron-600">₹{item.product?.price}</span>
                                                <button
                                                    onClick={() => addToCart(item.product)}
                                                    className="text-sm font-medium text-saffron-600 hover:text-saffron-700 flex items-center gap-1"
                                                >
                                                    <ShoppingBag className="w-4 h-4" /> Add
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrescriptionDetails;
