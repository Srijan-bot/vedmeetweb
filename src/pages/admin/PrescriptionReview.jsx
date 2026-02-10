import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePrescriptions } from '../../hooks/usePrescriptions';
import { supabase } from '../../lib/supabase';
import { getVariants } from '../../lib/data';
import Button from '../../components/Button';
import { ArrowLeft, ZoomIn, Search, Plus, Trash2, Check, AlertCircle, Save } from 'lucide-react';

const PrescriptionReview = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getPrescriptionDetails, referPrescription, loading, markPrescriptionSeen, addQuery } = usePrescriptions();
    const [replyText, setReplyText] = useState('');

    const handleReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim()) return;
        setSaving(true);
        try {
            await addQuery(id, replyText, user.id);
            setReplyText('');
            // Refresh details to show new query
            const data = await getPrescriptionDetails(id);
            setDetails(data);
        } catch (err) {
            console.error(err);
            alert('Failed to send reply');
        } finally {
            setSaving(false);
        }
    };

    const [details, setDetails] = useState(null);
    const [selectedMedicines, setSelectedMedicines] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);

    // Zoom State
    const [isZoomed, setIsZoomed] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            const data = await getPrescriptionDetails(id);
            setDetails(data);
            if (data?.items) {
                // Pre-fill if already referred (edit mode)
                const existing = await Promise.all(data.items.map(async (item) => {
                    const variants = await getVariants(item.medicine_id);
                    return {
                        medicine_id: item.medicine_id,
                        product: item.product,
                        variant_id: item.variant_id || (variants.length > 0 ? variants[0].id : null),
                        quantity: item.quantity || 1,
                        is_alternative: item.is_alternative,
                        doctor_note: item.doctor_note || '',
                        variants: variants || []
                    };
                }));
                setSelectedMedicines(existing);
            }
            if (data && data.has_new_query) {
                await markPrescriptionSeen(id);
            }
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
                setUserRole(profile?.role);
            }
        };
        fetchDetails();
    }, [id]);

    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        const { data } = await supabase
            .from('products')
            .select('*')
            .ilike('name', `%${query}%`)
            .limit(10);
        setSearchResults(data || []);
        setSearching(false);
    };

    const addMedicine = async (product) => {
        if (selectedMedicines.find(m => m.medicine_id === product.id)) return;

        // Fetch variants for the product
        const variants = await getVariants(product.id);

        setSelectedMedicines([...selectedMedicines, {
            medicine_id: product.id,
            product: product,
            variant_id: variants && variants.length > 0 ? variants[0].id : null,
            quantity: 1,
            is_alternative: false,
            doctor_note: '',
            variants: variants || []
        }]);
        setSearchQuery('');
        setSearchResults([]);
    };

    const removeMedicine = (index) => {
        const newMeds = [...selectedMedicines];
        newMeds.splice(index, 1);
        setSelectedMedicines(newMeds);
    };

    const updateMedicine = (index, field, value) => {
        const newMeds = [...selectedMedicines];
        newMeds[index][field] = value;
        setSelectedMedicines(newMeds);
    };

    const handleRefer = async () => {
        if (selectedMedicines.length === 0) {
            if (!confirm("Are you sure you want to refer without any medicines? This might confuse the user.")) return;
        }

        // Validate variants
        const missingVariants = selectedMedicines.some(m => m.variants.length > 0 && !m.variant_id);
        if (missingVariants) {
            alert("Please select a variant for all products that have variants.");
            return;
        }

        setSaving(true);
        try {
            await referPrescription(id, selectedMedicines, user.id);
            alert("Prescription referred successfully!");
            navigate('/admin/prescriptions');
        } catch (error) {
            console.error(error);
            alert("Failed to refer prescription");
        } finally {
            setSaving(false);
        }
    };

    if (loading || !details) return <div className="p-12 text-center">Loading...</div>;

    return (
        <div className="container mx-auto max-w-6xl">
            <div className="flex items-center justify-between mb-6">
                <button onClick={() => navigate('/admin/prescriptions')} className="flex items-center text-stone-500 hover:text-sage-900 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Inbox
                </button>
                <div className="flex items-center gap-3">
                    {details.referrer && userRole === 'admin' && (
                        <span className="text-sm text-stone-500 mr-2">
                            Referred by: <b className="text-sage-900">{details.referrer.full_name || details.referrer.email}</b>
                        </span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${details.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        details.status === 'referred' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {details.status}
                    </span>
                    {details.status !== 'referred' && (
                        <Button onClick={handleRefer} disabled={saving}>
                            {saving ? 'Processing...' : 'Complete Referral'} <Check className="w-4 h-4 ml-2" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-140px)]">
                {/* Left: Image Viewer */}
                {/* Left: Image Viewer & Chat */}
                <div className="flex flex-col gap-4 h-full">
                    {/* Image Viewer */}
                    <div className="bg-stone-900 rounded-xl overflow-hidden relative flex items-center justify-center group flex-1">
                        {details.signedImageUrl ? (
                            <>
                                <img
                                    src={details.signedImageUrl}
                                    alt="Prescription"
                                    className={`transition-transform duration-200 ${isZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'} max-h-full max-w-full object-contain`}
                                    onClick={() => setIsZoomed(!isZoomed)}
                                />
                                <button
                                    onClick={() => setIsZoomed(!isZoomed)}
                                    className="absolute bottom-4 right-4 bg-black/50 text-white p-2 rounded-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <ZoomIn className="w-5 h-5" />
                                </button>
                            </>
                        ) : (
                            <span className="text-stone-500">Image unavailable</span>
                        )}
                    </div>

                    {/* Queries & Chat */}
                    <div className="bg-white rounded-xl shadow-sm border border-sage-100 p-4 h-[300px] flex flex-col">
                        <h3 className="font-bold text-sage-900 mb-2 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-saffron-500" /> Discussion
                        </h3>
                        <div className="flex-1 overflow-y-auto space-y-3 mb-3 p-3 bg-stone-50 rounded-lg border border-sage-50">
                            {details.queries?.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-stone-400 text-sm">
                                    <p>No questions yet.</p>
                                </div>
                            ) : (
                                details.queries.map(q => (
                                    <div key={q.id} className={`flex flex-col max-w-[85%] ${q.user_id === user?.id ? 'ml-auto items-end' : 'items-start'}`}>
                                        <div className={`p-3 rounded-lg text-sm ${q.user_id === user?.id
                                            ? 'bg-sage-100 text-sage-900 rounded-br-none'
                                            : 'bg-white border border-sage-200 text-stone-800 rounded-bl-none shadow-sm'
                                            }`}>
                                            <p>{q.message}</p>
                                        </div>
                                        <span className="text-[10px] text-stone-400 mt-1">{new Date(q.created_at).toLocaleString()}</span>
                                    </div>
                                ))
                            )}
                        </div>
                        <form onSubmit={handleReply} className="flex gap-2">
                            <input
                                type="text"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Type a reply..."
                                className="flex-1 border border-sage-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sage-400"
                            />
                            <Button size="sm" type="submit" disabled={saving}>
                                Send
                            </Button>
                        </form>
                    </div>
                </div>

                {/* Right: Medicine Selector */}
                <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-sage-100 overflow-hidden">
                    <div className="p-4 border-b border-sage-100 bg-sage-50">
                        <h2 className="font-serif font-bold text-sage-900">Refer Medicines</h2>
                        <div className="relative mt-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                            <input
                                type="text"
                                placeholder="Search products database..."
                                className="w-full pl-9 pr-4 py-2 border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-saffron-500"
                                value={searchQuery}
                                onChange={handleSearch}
                            />
                            {/* Search Results Dropdown */}
                            {searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white shadow-xl rounded-lg border border-sage-100 z-50 max-h-60 overflow-y-auto">
                                    {searchResults.map(product => (
                                        <div
                                            key={product.id}
                                            onClick={() => addMedicine(product)}
                                            className="flex items-center gap-3 p-3 hover:bg-sage-50 cursor-pointer border-b border-sage-50 last:border-0"
                                        >
                                            {product.image ? (
                                                <img src={product.image} className="w-10 h-10 rounded bg-stone-100 object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 rounded bg-stone-100 flex items-center justify-center text-stone-400">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-bold text-sage-900 text-sm">{product.name}</p>
                                                <p className="text-xs text-stone-500">Stock: {product.stock_quantity}</p>
                                            </div>
                                            <div className="ml-auto">
                                                <Plus className="w-4 h-4 text-saffron-500" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {selectedMedicines.length === 0 ? (
                            <div className="text-center text-stone-400 mt-20">
                                <p>No medicines added yet.</p>
                                <p className="text-sm">Search and add products from above.</p>
                            </div>
                        ) : (
                            selectedMedicines.map((item, idx) => (
                                <div key={idx} className="border border-sage-200 rounded-lg p-3 bg-white hover:border-saffron-200 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex gap-3">
                                            {item.product?.image ? (
                                                <img src={item.product.image} className="w-12 h-12 rounded bg-stone-100 object-cover" />
                                            ) : (
                                                <div className="w-12 h-12 rounded bg-stone-100 flex items-center justify-center text-stone-400">
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                            )}
                                            <div>
                                                <h4 className="font-bold text-sage-900 text-sm">{item.product?.name}</h4>
                                                <p className="text-xs text-stone-500">Price: <span className="text-sage-700">₹{item.product?.price}</span></p>

                                                {/* Variant Selection */}
                                                {item.variants && item.variants.length > 0 && (
                                                    <div className="mt-2">
                                                        <select
                                                            value={item.variant_id || ''}
                                                            onChange={(e) => updateMedicine(idx, 'variant_id', e.target.value)}
                                                            className="text-xs border border-sage-200 rounded px-2 py-1 bg-sage-50 focus:outline-none focus:ring-1 focus:ring-sage-400"
                                                        >
                                                            {item.variants.map(v => (
                                                                <option key={v.id} value={v.id}>
                                                                    {v.name} ({v.volume || v.weight || 'Std'}) - ₹{v.price}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <button onClick={() => removeMedicine(idx)} className="text-red-400 hover:text-red-600">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {/* Quantity & Alternative */}
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium text-stone-500">Qty:</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity || 1}
                                                    onChange={(e) => updateMedicine(idx, 'quantity', parseInt(e.target.value) || 1)}
                                                    className="w-16 text-xs border border-sage-200 rounded px-2 py-1"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id={`alt-${idx}`}
                                                    checked={item.is_alternative}
                                                    onChange={(e) => updateMedicine(idx, 'is_alternative', e.target.checked)}
                                                    className="rounded border-sage-300 text-saffron-600 focus:ring-saffron-500"
                                                />
                                                <label htmlFor={`alt-${idx}`} className="text-xs font-medium text-sage-700 cursor-pointer">Is Alt?</label>
                                            </div>
                                        </div>

                                        {/* Note */}
                                        <div>
                                            <input
                                                type="text"
                                                placeholder="Doctor's Note (Optional)"
                                                value={item.doctor_note}
                                                onChange={(e) => updateMedicine(idx, 'doctor_note', e.target.value)}
                                                className="w-full text-xs border border-sage-200 rounded px-2 py-1"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrescriptionReview;
