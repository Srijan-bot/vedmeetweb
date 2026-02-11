import React, { useEffect, useState, useRef } from 'react';
import { Send, User, Trash2, ShoppingBag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Button from './Button';
import UserTagger from './UserTagger';
import ProductPicker from './ProductPicker'; // Keep simpler picker as fallback or alternative
import MentionPopup from './MentionPopup';

const AdvisingSession = ({ session }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [taggedUsers, setTaggedUsers] = useState([]);

    // Mention State
    const [mentionType, setMentionType] = useState(null); // 'product' | 'user'
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionResults, setMentionResults] = useState([]);
    const [cursorPosition, setCursorPosition] = useState({ bottom: 0, left: 0 });
    const textareaRef = useRef(null);

    const messagesEndRef = useRef(null);
    const [currentUserId, setCurrentUserId] = useState(null);

    // ... (Existing useEffects for messages & tags - same as before) ...
    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUserId(user?.id);
            await fetchMessages();
            await fetchTaggedUsers();

            const msgChannel = supabase
                .channel(`session:${session.id}:messages`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'session_messages',
                    filter: `session_id=eq.${session.id}`
                }, (payload) => {
                    setMessages(prev => [...prev, payload.new]);
                    scrollToBottom();
                })
                .subscribe();

            const tagChannel = supabase
                .channel(`session:${session.id}:tags`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'session_user_tags',
                    filter: `session_id=eq.${session.id}`
                }, fetchTaggedUsers)
                .subscribe();

            return () => {
                supabase.removeChannel(msgChannel);
                supabase.removeChannel(tagChannel);
            };
        };
        init();
    }, [session.id]);

    const fetchMessages = async () => {
        const { data } = await supabase.from('session_messages').select('*').eq('session_id', session.id).order('created_at', { ascending: true });
        setMessages(data || []);
        scrollToBottom();
    };

    const fetchTaggedUsers = async () => {
        const { data: tags } = await supabase.from('session_user_tags').select('user_id').eq('session_id', session.id);
        if (tags && tags.length > 0) {
            const userIds = tags.map(t => t.user_id);
            const { data: profiles } = await supabase.from('profiles').select('id, email').in('id', userIds);
            setTaggedUsers(profiles || []);
        } else {
            setTaggedUsers([]);
        }
    };

    // --- MENTION LOGIC ---
    useEffect(() => {
        const search = async () => {
            if (!mentionType) return;

            if (mentionType === 'product') {
                const { data } = await supabase.from('products').select('*').ilike('name', `%${mentionQuery}%`).limit(5);
                setMentionResults(data || []);
            } else if (mentionType === 'user') {
                const { data } = await supabase.from('profiles').select('id, email, role').ilike('email', `%${mentionQuery}%`).limit(5);
                setMentionResults(data || []);
            }
        };
        const debounce = setTimeout(search, 200);
        return () => clearTimeout(debounce);
    }, [mentionQuery, mentionType]);

    const handleInput = (e) => {
        const val = e.target.value;
        const selStart = e.target.selectionStart;
        setNewMessage(val);

        // Check for triggers before cursor
        const textBeforeCursor = val.slice(0, selStart);
        const lastWord = textBeforeCursor.split(/\s/).pop(); // simple split by space

        if (lastWord.startsWith('#')) {
            setMentionType('product');
            setMentionQuery(lastWord.slice(1));
            updateCursorPos(e.target);
        } else if (lastWord.startsWith('@')) {
            setMentionType('user');
            setMentionQuery(lastWord.slice(1));
            updateCursorPos(e.target);
        } else {
            setMentionType(null);
            setMentionResults([]);
        }
    };

    const updateCursorPos = (element) => {
        // Approximate position for popover relative to textarea
        // For distinct exact positioning, we'd need a mirror div, but for now simple bottom-left near cursor is okay or fixed above input
        // Let's rely on fixed positioning above the textarea for simplicity and robustness
        const rect = element.getBoundingClientRect();
        // Just position it at the bottom-left of the textarea + some offset
        // Or if we want to follow typing, it's more complex. Let's do fixed above input line.
        setCursorPosition({ bottom: 50, left: 16 });
    };

    const handleMentionSelect = (item) => {
        // Replace the trigger word with the item name
        const selStart = textareaRef.current.selectionStart;
        const textBefore = newMessage.slice(0, selStart);
        const textAfter = newMessage.slice(selStart);

        const lastSpace = textBefore.lastIndexOf(' ');
        const triggerStart = lastSpace === -1 ? 0 : lastSpace + 1;

        const prefix = textBefore.slice(0, triggerStart);
        const insertedText = mentionType === 'product' ? `[${item.name}]` : `@${item.email?.split('@')[0]}`;

        setNewMessage(prefix + insertedText + ' ' + textAfter);
        setMentionType(null);

        // If product, we could auto-send a card, but text link is nicer for flow.
        // User asked for tagging.
    };

    // --- SEND LOGIC ---
    const sendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!newMessage.trim()) return;

        // Detect if the message contains a product tag structure we defined?
        // Or just send text. The user asked for tagging logic.
        // Let's parse for products to add metadata if needed?
        // For now, pure text is fine, rich cards are handled by the picker separately? 
        // Or maybe if I use #tag it sends a card?
        // Let's assume text for now as it's inline.

        const { error } = await supabase
            .from('session_messages')
            .insert({
                session_id: session.id,
                user_id: currentUserId,
                content: newMessage,
                type: 'message',
                is_internal: false
            });

        if (error) alert('Failed to send');
        else setNewMessage('');
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const renderMessage = (msg, isMe) => {
        // Product Card Rendering (from metadata)
        if (msg.type === 'product' && msg.metadata) {
            const product = msg.metadata;
            return (
                <div className={`max-w-[80%] rounded-xl p-3 border ${isMe ? 'bg-white border-saffron-200 ml-auto' : 'bg-white border-sage-200 mr-auto'}`}>
                    <div className="flex gap-3">
                        <img src={product.image || 'https://via.placeholder.com/100'} alt={product.name} className="w-16 h-16 rounded-lg object-cover bg-sage-50" />
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-saffron-600 uppercase tracking-wider mb-1">Recommendation</p>
                            <h4 className="font-bold text-sage-900 leading-tight line-clamp-2">{product.name}</h4>
                            <p className="text-sm font-medium text-sage-600 mt-1">₹{product.disc_price || product.price}</p>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className={`max-w-[80%] rounded-lg p-3 ${isMe ? 'bg-saffron-500 text-white rounded-br-none' : 'bg-sage-100 text-sage-900 rounded-bl-none'}`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <div className={`text-[10px] block text-right mt-1 ${isMe ? 'text-saffron-100' : 'text-sage-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* Header */}
            <div className="p-4 border-b border-sage-100 bg-sage-50 flex justify-between items-start shrink-0">
                <div>
                    <h2 className="text-lg font-bold text-sage-900">{session.title}</h2>
                    <p className="text-sm text-sage-600">{session.description}</p>
                    <div className="flex -space-x-2 mt-2 overflow-hidden">
                        {taggedUsers.map(user => (
                            <div key={user.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-saffron-100 flex items-center justify-center text-xs font-bold text-saffron-700" title={user.email}>
                                {user.email?.[0]?.toUpperCase() || 'U'}
                            </div>
                        ))}
                    </div>
                </div>
                <UserTagger sessionId={session.id} onUserAdded={fetchTaggedUsers} existingUserIds={taggedUsers.map(u => u.id)} />
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => {
                    const isMe = msg.user_id === currentUserId;
                    return (
                        <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            {renderMessage(msg, isMe)}
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-sage-100 bg-white relative shrink-0">
                {mentionType && (
                    <MentionPopup
                        type={mentionType}
                        items={mentionResults}
                        position={cursorPosition}
                        onSelect={handleMentionSelect}
                        onClose={() => setMentionType(null)}
                    />
                )}

                <form onSubmit={sendMessage} className="flex gap-2 items-end">
                    {/* Keep Product Picker button for explicit card sending */}
                    <div className="relative">
                        {/* Note: In a full implementation, we'd toggle the ProductPicker component here too if button clicked */}
                    </div>

                    <div className="flex-1 relative">
                        <textarea
                            ref={textareaRef}
                            className="w-full border border-sage-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-saffron-500 resize-none max-h-32 min-h-[44px]"
                            placeholder="Type a message... Use # for products, @ for users"
                            value={newMessage}
                            onChange={handleInput}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
                            rows={1}
                            style={{ height: 'auto', minHeight: '44px' }}
                        />
                    </div>

                    <Button type="submit" disabled={!newMessage.trim()} className="h-[44px]">
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default AdvisingSession;
