import React, { useEffect, useState } from 'react';
import { Check, X, Calendar, Search, Phone, User } from 'lucide-react';
import { getLeads, updateLeadStatus } from '../../lib/data';

const LeadManager = () => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        const data = await getLeads();
        setLeads(data);
        setLoading(false);
    };

    const handleStatusUpdate = async (id, status) => {
        // Optimistic update
        setLeads(leads.map(lead => lead.id === id ? { ...lead, status } : lead));
        await updateLeadStatus(id, status);
    };

    const filteredLeads = leads.filter(lead =>
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm)
    );

    if (loading) return <div>Loading leads...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-sage-900">Leads Management</h1>
                    <p className="text-stone-500 text-sm">Track and manage callback requests</p>
                </div>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search leads..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-sage-200 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-sage-500"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-sage-100">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-sage-50 text-sage-900 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="p-4 font-semibold">User Details</th>
                            <th className="p-4 font-semibold">Date</th>
                            <th className="p-4 font-semibold">Status</th>
                            <th className="p-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-sage-100 text-sm">
                        {filteredLeads.map((lead) => (
                            <tr key={lead.id} className="hover:bg-sage-50/50 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold">
                                            {lead.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sage-900">{lead.name}</div>
                                            <div className="flex items-center gap-1 text-xs text-stone-500">
                                                <Phone className="w-3 h-3" /> {lead.phone}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-stone-600">
                                    {new Date(lead.created_at).toLocaleDateString()}
                                    <br />
                                    <span className="text-xs text-stone-400">{new Date(lead.created_at).toLocaleTimeString()}</span>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${lead.status === 'Success' ? 'bg-green-100 text-green-700' :
                                            lead.status === 'Loss' ? 'bg-red-100 text-red-700' :
                                                lead.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {lead.status}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleStatusUpdate(lead.id, 'Success')}
                                            className="px-3 py-1 bg-green-50 text-green-600 border border-green-200 rounded-md hover:bg-green-100 text-xs font-semibold flex items-center gap-1"
                                            title="Mark as Success"
                                        >
                                            <Check className="w-3 h-3" /> Won
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(lead.id, 'Scheduled')}
                                            className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-md hover:bg-blue-100 text-xs font-semibold flex items-center gap-1"
                                            title="Mark as Scheduled"
                                        >
                                            <Calendar className="w-3 h-3" /> Schedule
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(lead.id, 'Loss')}
                                            className="px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 text-xs font-semibold flex items-center gap-1"
                                            title="Mark as Loss"
                                        >
                                            <X className="w-3 h-3" /> Loss
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {filteredLeads.length === 0 && (
                <div className="p-8 text-center text-stone-500 bg-white border border-sage-100 rounded-xl mt-4">
                    No leads found.
                </div>
            )}
        </div>
    );
};

export default LeadManager;
