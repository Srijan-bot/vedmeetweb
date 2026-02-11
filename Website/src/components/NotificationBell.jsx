import React, { useState, useEffect, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../lib/data';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [toast, setToast] = useState(null); // { id, content, link }
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        const data = await getNotifications(20);
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
    };

    useEffect(() => {
        let mounted = true;
        let subscription = null;

        const fetchData = async () => {
            if (!mounted) return;
            await fetchNotifications();
        };
        fetchData();

        const setupSubscription = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!mounted || !user) return;

                subscription = supabase
                    .channel('public:notifications')
                    .on('postgres_changes', {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${user.id}`
                    }, (payload) => {
                        if (!mounted) return;
                        const newNotification = payload.new;
                        setNotifications(prev => [newNotification, ...prev]);
                        setUnreadCount(prev => prev + 1);

                        // Show Toast
                        setToast(newNotification);
                        setTimeout(() => {
                            if (mounted) setToast(null);
                        }, 5000);
                    })
                    .subscribe();
            } catch (error) {
                console.error("Error setting up subscription:", error);
            }
        };

        setupSubscription();

        return () => {
            mounted = false;
            if (subscription) {
                supabase.removeChannel(subscription).catch(console.error);
            }
        };
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleNotificationClick = async (notification) => {
        if (!notification.is_read) {
            await markNotificationAsRead(notification.id);
            setNotifications(prev => prev.map(n =>
                n.id === notification.id ? { ...n, is_read: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        }

        if (notification.link) {
            if (notification.link === '/admin/chat') {
                navigate('/admin/dashboard', { state: { openChat: true } });
            } else {
                navigate(notification.link);
            }
        }
        setIsOpen(false);
    };

    // Helper for toast click
    const handleToastClick = () => {
        if (toast) {
            handleNotificationClick(toast);
            setToast(null);
        }
    };

    const handleMarkAllRead = async () => {
        await markAllNotificationsAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
                aria-label="Notifications"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-stone-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-3 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                        <h3 className="font-bold text-stone-700">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-sage-600 hover:text-sage-800 font-medium"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-stone-400 text-sm">
                                No notifications
                            </div>
                        ) : (
                            <div className="divide-y divide-stone-50">
                                {notifications.map(notification => (
                                    <button
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`w-full text-left p-4 hover:bg-stone-50 transition-colors flex gap-3 ${!notification.is_read ? 'bg-blue-50/50' : ''}`}
                                    >
                                        <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!notification.is_read ? 'bg-blue-500' : 'bg-transparent'}`} />
                                        <div>
                                            <p className={`text-sm ${!notification.is_read ? 'font-semibold text-stone-800' : 'text-stone-600'}`}>
                                                {notification.content}
                                            </p>
                                            <p className="text-xs text-stone-400 mt-1">
                                                {new Date(notification.created_at).toLocaleDateString()} • {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, x: 0 }}
                        animate={{ opacity: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-4 right-4 z-[100] bg-white rounded-lg shadow-2xl border border-sage-100 p-4 max-w-sm cursor-pointer hover:bg-sage-50"
                        onClick={handleToastClick}
                    >
                        <div className="flex items-start gap-3">
                            <div className="bg-saffron-100 text-saffron-600 p-2 rounded-full">
                                <Bell className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-sage-900">New Notification</h4>
                                <p className="text-sm text-stone-600 mt-1">{toast.content}</p>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); setToast(null); }}
                                className="text-stone-400 hover:text-stone-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;
