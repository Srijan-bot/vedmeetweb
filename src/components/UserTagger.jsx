import React, { useState, useEffect } from 'react';
import { UserPlus, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Button from './Button';

const UserTagger = ({ sessionId, onUserAdded, existingUserIds = [] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const search = async () => {
            if (query.length < 2) {
                setResults([]);
                return;
            }
            setIsSearching(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('id, email, role')
                .ilike('email', `%${query}%`)
                .limit(5);

            if (!error) {
                // Filter out already tagged users
                setResults(data.filter(u => !existingUserIds.includes(u.id)));
            }
            setIsSearching(false);
        };

        const timeoutId = setTimeout(search, 300); // Debounce
        return () => clearTimeout(timeoutId);
    }, [query, existingUserIds]);

    const handleAddUser = async (userId) => {
        // Try RPC first, fallback to insert if RPC not created or fails with permissions issues that suggest direct insert is allowed (unlikely for admin features, but good for resilience)
        // Actually, let's stick to the secure RPC we defined, or direct insert since we have RLS policies for admins.

        // Using Direct Insert for simplicity as current plan allows admins to insert into tags
        const { error } = await supabase
            .from('session_user_tags')
            .insert({ session_id: sessionId, user_id: userId, assigned_by: (await supabase.auth.getUser()).data.user.id });

        if (error) {
            console.error(error);
            alert('Failed to add user');
        } else {
            onUserAdded();
            setQuery(''); // Reset search
            // Keep modal open to add more? Or close? Let's keep open.
        }
    };

    return (
        <div className="relative">
            <Button variant="outline" size="sm" onClick={() => setIsOpen(!isOpen)} className="flex gap-2">
                <UserPlus className="w-4 h-4" /> <span className="hidden sm:inline">Add User</span>
            </Button>

            {isOpen && (
                <div className="absolute right-0 top-12 w-72 bg-white rounded-lg shadow-xl border border-sage-100 z-50 p-2">
                    <div className="flex justify-between items-center mb-2 px-1">
                        <span className="text-xs font-bold text-sage-500 uppercase">Search Users</span>
                        <button onClick={() => setIsOpen(false)}><X className="w-3 h-3 text-sage-400" /></button>
                    </div>
                    <input
                        autoFocus
                        type="text"
                        className="w-full text-sm border border-sage-200 rounded p-2 mb-2 focus:ring-1 focus:ring-saffron-500"
                        placeholder="Search by email..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />

                    <div className="max-h-48 overflow-y-auto space-y-1">
                        {isSearching && <p className="text-xs text-center text-sage-400 p-2">Searching...</p>}
                        {!isSearching && results.length === 0 && query.length > 2 && (
                            <p className="text-xs text-center text-sage-400 p-2">No users found</p>
                        )}
                        {results.map(user => (
                            <div key={user.id} className="flex items-center justify-between p-2 hover:bg-sage-50 rounded cursor-pointer group">
                                <div className="overflow-hidden">
                                    <p className="text-sm font-medium text-sage-900 truncate">{user.email}</p>
                                    <p className="text-xs text-sage-500 text-left capitalize">{user.role || 'user'}</p>
                                </div>
                                <button
                                    onClick={() => handleAddUser(user.id)}
                                    className="p-1 text-saffron-600 hover:bg-saffron-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Check className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserTagger;
