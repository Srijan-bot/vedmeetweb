import React, { useState, useEffect } from 'react';
import { Plus, MessageSquare, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Button from '../../components/Button';
import AdvisingSession from '../../components/AdvisingSession';
import UserTagger from '../../components/UserTagger';

const AdvisingManager = () => {
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch sessions (created by me or I'm tagged in)
    const fetchSessions = async () => {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Custom query via RLS policy
        const { data, error } = await supabase
            .from('advising_sessions')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) console.error('Error fetching sessions:', error);
        else setSessions(data || []);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchSessions();

        // Realtime subscription for list
        const channel = supabase
            .channel('public:advising_sessions')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'advising_sessions' }, fetchSessions)
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    const handleCreateSession = async (title, description) => {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase
            .from('advising_sessions')
            .insert({ title, description, created_by: user.id });

        if (error) alert('Error creating session');
        else {
            setIsCreateModalOpen(false);
            fetchSessions();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-serif font-bold text-sage-900">Advising Sessions</h1>
                <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" /> New Session
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
                {/* Session List */}
                <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-sage-100 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-sage-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sage-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search sessions..."
                                className="w-full pl-10 pr-4 py-2 border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-saffron-500"
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-2">
                        {isLoading ? (
                            <p className="p-4 text-center text-sage-400">Loading...</p>
                        ) : sessions.map(session => (
                            <div
                                key={session.id}
                                onClick={() => setSelectedSession(session)}
                                className={`p-4 rounded-lg cursor-pointer transition-colors ${selectedSession?.id === session.id
                                    ? 'bg-sage-50 border-saffron-500 border'
                                    : 'hover:bg-sage-50 border border-transparent'
                                    }`}
                            >
                                <h3 className="font-medium text-sage-900">{session.title}</h3>
                                <p className="text-sm text-sage-500 truncate">{session.description}</p>
                                <div className="mt-2 flex items-center justify-between text-xs text-sage-400">
                                    <span>{new Date(session.updated_at).toLocaleDateString()}</span>
                                    <span className={`px-2 py-0.5 rounded-full ${session.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                        {session.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {sessions.length === 0 && !isLoading && (
                            <div className="text-center py-8 text-sage-400">No sessions found</div>
                        )}
                    </div>
                </div>

                {/* Session Detail / Chat Area */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-sage-100 overflow-hidden flex flex-col">
                    {selectedSession ? (
                        <AdvisingSession session={selectedSession} />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-sage-400">
                            <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
                            <p>Select a session to start advising</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">New Advising Session</h3>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            handleCreateSession(e.target.title.value, e.target.description.value);
                        }}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                    <input name="title" required className="w-full p-2 border rounded-lg" placeholder="e.g. Skin Consultation" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea name="description" className="w-full p-2 border rounded-lg" placeholder="Brief notes..." />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                                <Button type="submit">Create Session</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdvisingManager;
