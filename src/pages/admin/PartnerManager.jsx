import React, { useEffect, useState } from 'react';
import { getProfiles } from '../../lib/data';
import { Search, Loader, Shield, User, Phone, Hash, Mail } from 'lucide-react';

const PartnerManager = () => {
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadAgents();
    }, []);

    const loadAgents = async () => {
        try {
            const data = await getProfiles();
            // Filter only agents
            const agentList = data.filter(user => user.role === 'agent');
            setAgents(agentList);
        } catch (error) {
            console.error("Failed to load agents", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredAgents = agents.filter(agent => {
        const query = searchQuery.toLowerCase();
        return (
            (agent.agent_name && agent.agent_name.toLowerCase().includes(query)) ||
            (agent.email && agent.email.toLowerCase().includes(query)) ||
            (agent.employment_code && agent.employment_code.toLowerCase().includes(query)) ||
            (agent.contact_no && agent.contact_no.includes(query))
        );
    });

    if (loading) return <div className="p-8 flex items-center gap-2 text-stone-500"><Loader className="animate-spin w-5 h-5" /> Loading partners...</div>;

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-sage-900">Partner Management</h1>
                    <p className="text-stone-500 mt-1">View and manage registered agents and their details.</p>
                </div>

                {/* Stats */}
                <div className="flex gap-4">
                    <div className="bg-white px-4 py-2 rounded-lg border border-sage-100 shadow-sm flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                            <Shield size={16} />
                        </div>
                        <div>
                            <p className="text-xs text-stone-500 font-medium">Total Agents</p>
                            <p className="text-lg font-bold text-sage-900">{agents.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-sage-100 mb-6 flex items-center gap-2 max-w-md">
                <Search className="text-stone-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search by Name, ID, Email or Phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 outline-none text-stone-700 placeholder:text-stone-400"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-sage-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-sage-50 border-b border-sage-100 text-xs font-bold uppercase text-sage-600 tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Agent Details</th>
                                <th className="px-6 py-4">Employment Code</th>
                                <th className="px-6 py-4">Contact Info</th>
                                <th className="px-6 py-4">Joined Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-sage-50">
                            {filteredAgents.length > 0 ? (
                                filteredAgents.map(agent => (
                                    <tr key={agent.id} className="hover:bg-stone-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 shrink-0">
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sage-900">{agent.agent_name || 'Unnamed Agent'}</p>
                                                    <p className="text-sm text-stone-500">{agent.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {agent.employment_code ? (
                                                <div className="flex items-center gap-2">
                                                    <Hash size={14} className="text-orange-500" />
                                                    <span className="font-mono font-medium text-stone-700 bg-orange-50 px-2 py-1 rounded border border-orange-100">
                                                        {agent.employment_code}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-stone-400 italic text-sm">Not assigned</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                {agent.contact_no ? (
                                                    <div className="flex items-center gap-2 text-sm text-stone-600">
                                                        <Phone size={14} className="text-sage-600" />
                                                        {agent.contact_no}
                                                    </div>
                                                ) : (
                                                    <div className="text-stone-400 text-sm italic">No contact info</div>
                                                )}
                                                <div className="flex items-center gap-2 text-sm text-stone-600">
                                                    <Mail size={14} className="text-sage-600" />
                                                    {agent.email}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-stone-500">
                                                {new Date(agent.created_at || Date.now()).toLocaleDateString()}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-stone-500">
                                        {agents.length === 0
                                            ? "No agents found. Use User Management to assign the 'agent' role to users."
                                            : "No agents match your search."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PartnerManager;
