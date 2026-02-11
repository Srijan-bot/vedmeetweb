import React, { useEffect, useState } from 'react';
import { usePrescriptions } from '../../hooks/usePrescriptions';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { FileText, ChevronRight, CheckCircle, Clock, XCircle, Filter } from 'lucide-react';

const PrescriptionManager = () => {
    const { getAllPrescriptions, loading } = usePrescriptions();
    const [prescriptions, setPrescriptions] = useState([]);
    const [filter, setFilter] = useState('all');
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        fetchData();
        checkUserRole();
    }, [filter]);

    const checkUserRole = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
            setUserRole(data?.role);
        }
    };

    const fetchData = async () => {
        const data = await getAllPrescriptions(filter);
        setPrescriptions(data);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-sage-900 font-serif">Prescription Inbox</h1>

                <div className="md:hidden">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="block w-32 pl-3 pr-8 py-2 text-sm border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-saffron-500 bg-white"
                    >
                        <option value="all">All</option>
                        <option value="pending">Pending</option>
                        <option value="referred">Referred</option>
                    </select>
                </div>

                <div className="hidden md:flex items-center gap-2 bg-white p-1 rounded-lg border border-sage-200">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'all' ? 'bg-sage-100 text-sage-900' : 'text-stone-500 hover:text-sage-900'}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'text-stone-500 hover:text-yellow-700'}`}
                    >
                        Pending
                    </button>
                    <button
                        onClick={() => setFilter('referred')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'referred' ? 'bg-green-100 text-green-800' : 'text-stone-500 hover:text-green-700'}`}
                    >
                        Referred
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-sage-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-sage-50 border-b border-sage-100">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-sage-700 text-sm">ID</th>
                            <th className="px-6 py-4 font-semibold text-sage-700 text-sm">User</th>
                            <th className="px-6 py-4 font-semibold text-sage-700 text-sm">Date</th>
                            <th className="px-6 py-4 font-semibold text-sage-700 text-sm">Status</th>
                            {userRole === 'admin' && <th className="px-6 py-4 font-semibold text-sage-700 text-sm">Referred By</th>}
                            <th className="px-6 py-4 font-semibold text-sage-700 text-sm text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-sage-50">
                        {loading ? (
                            <tr><td colSpan="5" className="px-6 py-8 text-center text-stone-500">Loading...</td></tr>
                        ) : prescriptions.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-8 text-center text-stone-500">No prescriptions found</td></tr>
                        ) : (
                            prescriptions.map((p) => (
                                <tr key={p.id} className={`hover:bg-sage-50/50 transition-colors ${p.has_new_query ? 'bg-orange-50' : ''}`}>
                                    <td className="px-6 py-4 text-sm font-mono text-stone-500">
                                        <div className="flex items-center gap-2">
                                            #{p.id.slice(0, 8)}
                                            {p.has_new_query && (
                                                <span className="flex h-2 w-2 relative">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-saffron-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-saffron-500"></span>
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-sage-900">
                                        <div className="font-medium">{p.user?.full_name || 'Unknown User'}</div>
                                        {p.user?.email && <div className="text-xs text-stone-400">{p.user.email}</div>}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-stone-500">{new Date(p.created_at).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">
                                        {p.status === 'pending' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" /> Pending</span>}
                                        {p.status === 'referred' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Referred</span>}
                                        {p.status === 'rejected' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> Rejected</span>}
                                    </td>
                                    {userRole === 'admin' && (
                                        <td className="px-6 py-4 text-sm text-stone-600">
                                            {p.referrer ? (
                                                <span className="font-medium text-sage-900">{p.referrer.full_name || p.referrer.email}</span>
                                            ) : (
                                                <span className="text-stone-300">-</span>
                                            )}
                                        </td>
                                    )}
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            to={`/admin/prescriptions/${p.id}`}
                                            className="text-saffron-600 hover:text-saffron-700 font-medium text-sm inline-flex items-center"
                                        >
                                            Review <ChevronRight className="w-4 h-4 ml-1" />
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PrescriptionManager;
