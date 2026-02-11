import React, { useEffect, useState, useRef } from 'react';
import { X, Send, Paperclip, AtSign, Hash, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getMessages, sendMessage, getProducts, getLeads, getDoctors, getBlogs, getProfiles } from '../lib/data';

import { useNavigate } from 'react-router-dom';

const ChatSystem = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    // Context State
    const [contextMode, setContextMode] = useState(null); // 'product', 'lead', 'doctor', 'blog'
    const [contextItems, setContextItems] = useState([]);
    const [selectedContext, setSelectedContext] = useState(null);

    // Tagging State
    const [tagMode, setTagMode] = useState(false);
    const [users, setUsers] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [currentUserRole, setCurrentUserRole] = useState(null);

    const messagesEndRef = useRef(null);

    // Initial Load
    // useEffect(() => {
    //     if (isOpen) {
    //         document.body.style.overflow = 'hidden';
    //         loadInitialData();
    //         subscribeToMessages();
    //     } else {
    //         document.body.style.overflow = '';
    //     }
    //     return () => { document.body.style.overflow = ''; };
    // }, [isOpen]);
    // MERGED INTO THE MAIN SUBSCRIPTION EFFECT ABOVE

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const msgs = await getMessages(50);
            setMessages(msgs);

            // Pre-fetch potential context/tag data
            const [u, p, l, d, b] = await Promise.all([
                getProfiles(),
                getProducts(),
                getLeads(),
                getDoctors(),
                getBlogs()
            ]);
            setUsers(u);

            // Determine current role
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const myProfile = u.find(profile => profile.id === user.id);
                setCurrentUserRole(myProfile?.role || 'user');
            }

            // Store these for the context picker
            window.chatContexts = { product: p, lead: l, doctor: d, blog: b };
        } catch (error) {
            console.error("Chat load error:", error);
        } finally {
            setLoading(false);
        }
    };

    const channelRef = useRef(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);

    // Subscription & Presence Logic
    useEffect(() => {
        if (!isOpen) {
            return () => {
                if (channelRef.current) {
                    supabase.removeChannel(channelRef.current);
                    channelRef.current = null;
                }
                document.body.style.overflow = '';
            }
        }

        document.body.style.overflow = 'hidden';
        loadInitialData();

        // 1. Setup Channel
        // We use a single channel for both DB changes and Presence/Broadcast
        const channel = supabase.channel('public:chat_room');
        channelRef.current = channel;

        // 2. Listen for Messages
        channel
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
                // Fetch full message details including sender
                const { data } = await supabase
                    .from('messages')
                    .select('*, sender:sender_id(email, role)')
                    .eq('id', payload.new.id)
                    .single();

                if (data) {
                    setMessages(prev => {
                        // Avoid duplicates if optimistic UI already added it (checked by ID usually, but here we used temp IDs)
                        // OR if subscription fires multiple times
                        if (prev.some(m => m.id === data.id)) return prev;
                        return [...prev, data];
                    });
                }
            })
            // 3. Listen for Presence (Online Users)
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState();
                const users = [];
                for (const id in newState) {
                    users.push(newState[id][0]); // usually one session per user ID if we track by ID
                }
                setOnlineUsers(users);
            })
            // 4. Listen for Broadcast (Typing)
            .on('broadcast', { event: 'typing' }, ({ payload }) => {
                setTypingUsers(prev => {
                    if (prev.some(u => u.id === payload.id)) return prev;
                    return [...prev, payload];
                });
                // Remove after 3 seconds
                setTimeout(() => {
                    setTypingUsers(prev => prev.filter(u => u.id !== payload.id));
                }, 3000);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        await channel.track({
                            id: user.id,
                            email: user.email,
                            online_at: new Date().toISOString()
                        });
                    }
                }
            });

        return () => {
            // Cleanup
            supabase.removeChannel(channel);
            channelRef.current = null;
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() && !selectedContext) return;

        setSending(true);
        const tempId = `temp-${Date.now()}`;

        // Optimistic UI: Add message immediately
        const { data: { user } } = await supabase.auth.getUser();
        const tempMessage = {
            id: tempId,
            content: newMessage,
            context_type: selectedContext?.type || null,
            context_id: selectedContext?.id || null,
            context_data: selectedContext?.data || null,
            tagged_users: selectedTags,
            sender_id: user?.id,
            created_at: new Date().toISOString(),
            sender: { email: user?.email, role: currentUserRole },
            status: 'sending'
        };

        setMessages(prev => [...prev, tempMessage]);
        setNewMessage('');
        const prevContext = selectedContext;
        const prevTags = selectedTags;
        setSelectedContext(null);
        setSelectedTags([]);

        try {
            const data = await sendMessage({
                content: tempMessage.content,
                context_type: tempMessage.context_type,
                context_id: tempMessage.context_id,
                context_data: tempMessage.context_data,
                tagged_users: tempMessage.tagged_users
            });

            // Remove optimistic message, the subscription or the data return will fill it
            // Actually, to avoid UI flicker if subscription is slow, allow subscription to handle it,
            // OR update the temp message with real ID.
            // If we update ID, we might conflict with subscription adding the same ID.
            // Safest: Remove temp message when we confirm success, AND rely on subscription to add real one.
            // If subscription adds it BEFORE we remove temp, we see duplicate for a ms.
            // If we remove temp BEFORE subscription adds, we see it disappear.

            // Better: Filter out temp message once we have confirmation or just let it stay until component re-renders?
            // Let's simple remove temp message now that we know it's sent.
            setMessages(prev => prev.filter(m => m.id !== tempId));

        } catch (error) {
            console.error("Send error:", error);
            alert("Failed to send message");
            setMessages(prev => prev.filter(m => m.id !== tempId)); // Remove failed optimistic Msg
            setNewMessage(tempMessage.content); // Restore content
            setSelectedContext(prevContext);
            setSelectedTags(prevTags);
        } finally {
            setSending(false);
        }
    };

    // Typing Handler
    const typingTimeoutRef = useRef(null);
    const handleTyping = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const channel = supabase.channel('public:messages');
        // Note: we should store the channel reference from useEffect to reuse it
        // but creating a new reference to same channel string *might* work if Supabase client caches it,
        // but safest is to just emit if we have access.
        // Actually, 'public:messages' channel is managed in useEffect.
        // We can't access `channel` variable from here easily unless we use a Ref.
        // Let's trust that send() on a new channel instance with same topic works, or use a Ref.
        // Using `supabase.channel` with same name returns the existing channel if subscribed?
        // Let's use a Ref for the channel.

        if (channelRef.current) {
            channelRef.current.track({
                id: user.id,
                email: user.email,
                typing: true
            });
            // Or better, use 'broadcast' event types which are ephemeral
            channelRef.current.send({
                type: 'broadcast',
                event: 'typing',
                payload: { email: user.email, id: user.id }
            });
        }

        // Debounce clearing
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            // Stop typing
            // We don't really need a "stop typing" event if we just show "X is typing" for a few seconds on receipt
        }, 3000);
    };

    const handleContextClick = (type, id) => {
        // PERMISSION CHECK
        const role = currentUserRole;
        const allowed = role === 'admin';
        // SEO Writers can only see products and blogs
        const seoAllowed = (type === 'product' || type === 'blog') && role === 'seo_writer';

        if (!allowed && !seoAllowed) {
            alert("Access Restricted: You do not have permission to view this item.");
            return;
        }

        // NAVIGATION LOGIC
        switch (type) {
            case 'product': navigate(`/admin/products/edit/${id}`); break;
            case 'blog': navigate(`/admin/blogs/edit/${id}`); break;
            case 'doctor': navigate(`/admin/doctors/edit/${id}`); break; // Assuming edit route exists
            case 'lead': navigate(`/admin/leads`); break; // Leads usually on a list page
            default: break;
        }
        onClose(); // Close chat to view content
    };

    // Helper to open context picker
    const openContextPicker = (type) => {
        setContextMode(type);
        setContextItems(window.chatContexts[type] || []);
    };

    const selectContext = (item) => {
        setSelectedContext({
            type: contextMode,
            id: item.id,
            data: { name: item.name || item.title || item.email } // Snapshot
        });
        setContextMode(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

            {/* Drawer */}
            <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="p-4 border-b border-sage-100 flex items-center justify-between bg-sage-50">
                    <div className="flex items-center gap-2 text-sage-900">
                        <MessageSquare className="w-5 h-5" />
                        <h2 className="font-serif font-bold text-lg">Team Chat</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-sage-200 rounded-full transition-colors text-sage-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50">
                    {loading && <p className="text-center text-stone-400 text-sm">Loading messages...</p>}

                    {/* Online Users Header */}
                    {onlineUsers.length > 0 && (
                        <div className="flex items-center gap-2 mb-2 px-2">
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <p className="text-xs text-stone-500">
                                {onlineUsers.length} online: {onlineUsers.map(u => u.email?.split('@')[0]).join(', ')}
                            </p>
                        </div>
                    )}

                    {messages.map((msg) => {
                        // Check if this message is from current user (using email as fallback if id logic fails, but optimistic msg has valid sender_id)
                        // The original code used a direct comparison. I will refine it.
                        const isMe = msg.sender_id === (supabase.auth.getSession()?.user?.id || msg.sender_id); // Fallback for optimistic

                        return (
                            <div key={msg.id} className={`flex flex-col ${false ? 'items-end' : 'items-start'} ${msg.status === 'sending' ? 'opacity-70' : ''}`}>
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className="text-xs font-bold text-sage-900">
                                        {msg.sender?.email?.split('@')[0] || 'Unknown'}
                                    </span>
                                    <span className="text-[10px] text-stone-400">
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>

                                <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm border border-sage-100 max-w-[90%] relative">
                                    {/* Context Attachment */}
                                    {msg.context_type && (
                                        <button
                                            onClick={() => handleContextClick(msg.context_type, msg.context_id)}
                                            className="w-full mb-2 pb-2 border-b border-sage-50 flex items-center gap-2 hover:bg-sage-50 transition-colors p-1 rounded -ml-1 text-left"
                                        >
                                            <Hash size={12} className="text-sage-400" />
                                            <span className="text-xs uppercase font-bold text-sage-500">{msg.context_type}:</span>
                                            <span className="text-xs font-medium text-sage-800 truncate max-w-[150px]">
                                                {msg.context_data?.name || msg.context_id}
                                            </span>
                                        </button>
                                    )}

                                    <p className="text-sm text-stone-700 whitespace-pre-wrap">{msg.content}</p>

                                    {/* Tagged Users (Visual only for now) */}
                                    {msg.tagged_users && msg.tagged_users.length > 0 && (
                                        <div className="mt-2 text-xs text-blue-600 flex flex-wrap gap-1">
                                            {msg.tagged_users.map(uid => {
                                                const u = users.find(user => user.id === uid);
                                                return <span key={uid}>@{u?.email?.split('@')[0] || 'user'}</span>
                                            })}
                                        </div>
                                    )}

                                    {msg.status === 'sending' && (
                                        <span className="absolute bottom-1 right-2 w-2 h-2 rounded-full border border-stone-300 border-t-stone-600 animate-spin"></span>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Typing Indicator */}
                    {typingUsers.length > 0 && (
                        <div className="text-xs text-stone-400 italic ml-2 animate-pulse">
                            {typingUsers.map(u => u.email?.split('@')[0]).join(', ')} is typing...
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Context Selection Modal (Overlay) */}
                {contextMode && (
                    <div className="absolute inset-x-0 bottom-0 top-0 bg-white/95 z-10 p-4 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-sage-900 capitalize">Select {contextMode}</h3>
                            <button onClick={() => setContextMode(null)} className="text-stone-400"><X size={20} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2">
                            {contextItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => selectContext(item)}
                                    className="w-full text-left p-3 rounded-lg border border-sage-100 hover:bg-sage-50 transition-colors"
                                >
                                    <p className="font-medium text-sage-900">{item.name || item.title || item.email}</p>
                                    <p className="text-xs text-stone-500 truncate">{item.id}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tag Selection Modal (Overlay) */}
                {tagMode && (
                    <div className="absolute inset-x-0 bottom-0 top-0 bg-white/95 z-10 p-4 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-sage-900">Tag a User</h3>
                            <button onClick={() => setTagMode(false)} className="text-stone-400"><X size={20} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2">
                            {users.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => { setSelectedTags(prev => [...prev, item.id]); setTagMode(false); }}
                                    className="w-full text-left p-3 rounded-lg border border-sage-100 hover:bg-sage-50 transition-colors flex items-center justify-between"
                                >
                                    <div>
                                        <p className="font-medium text-sage-900">{item.email}</p>
                                        <p className="text-xs text-stone-500 uppercase">{item.role}</p>
                                    </div>
                                    {selectedTags.includes(item.id) && <span className="text-sage-600 text-xs font-bold">Selected</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-sage-100 space-y-3">
                    {/* Active Attachments */}
                    {(selectedContext || selectedTags.length > 0) && (
                        <div className="flex flex-wrap gap-2">
                            {selectedContext && (
                                <div className="inline-flex items-center gap-1 px-2 py-1 bg-sage-100 text-sage-700 rounded text-xs font-medium">
                                    <Hash size={10} />
                                    <span className="capitalize">{selectedContext.type}:</span>
                                    <span>{selectedContext.data.name}</span>
                                    <button onClick={() => setSelectedContext(null)} className="hover:text-red-500 ml-1"><X size={10} /></button>
                                </div>
                            )}
                            {selectedTags.map(tagId => {
                                const u = users.find(user => user.id === tagId);
                                return (
                                    <div key={tagId} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                                        <AtSign size={10} />
                                        <span>{u?.email?.split('@')[0]}</span>
                                        <button onClick={() => setSelectedTags(prev => prev.filter(id => id !== tagId))} className="hover:text-red-500 ml-1"><X size={10} /></button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <form onSubmit={handleSend} className="flex gap-2">
                        {/* Tools */}
                        <div className="flex flex-col gap-2">
                            <div className="relative group">
                                <button type="button" className="p-2 text-stone-400 hover:bg-stone-100 rounded-full transition-colors">
                                    <Paperclip size={20} />
                                </button>
                                {/* Popup Menu */}
                                <div className="absolute bottom-full left-0 mb-2 bg-white shadow-lg rounded-lg border border-sage-100 p-1 hidden group-hover:block w-32">
                                    {['product', 'lead', 'doctor', 'blog'].map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => openContextPicker(type)}
                                            className="block w-full text-left px-3 py-2 text-sm text-stone-600 hover:bg-sage-50 rounded capitalize"
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setTagMode(true)}
                                className="p-2 text-stone-400 hover:bg-stone-100 rounded-full transition-colors"
                            >
                                <AtSign size={20} />
                            </button>
                        </div>

                        <textarea
                            value={newMessage}
                            onChange={(e) => {
                                setNewMessage(e.target.value);
                                handleTyping();
                            }}
                            placeholder="Type a message..."
                            className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500 resize-none h-20"
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                        />

                        <button
                            type="submit"
                            disabled={sending || (!newMessage.trim() && !selectedContext)}
                            className="self-end p-2 bg-sage-900 text-white rounded-full hover:bg-sage-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send size={20} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChatSystem;
