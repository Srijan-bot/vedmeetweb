import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Stethoscope, FileText, Settings, LogOut, Menu, X, Users, Tag, Calendar, ClipboardList } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Button from '../../components/Button';

import NotificationBell from '../../components/NotificationBell';

const DashboardLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [role, setRole] = useState(null);

    React.useEffect(() => {
        const getRole = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();
                setRole(profile?.role || 'user');
            }
        };
        getRole();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/admin/login');
    };

    const allNavItems = [
        { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Overview', roles: ['admin', 'seo_writer'] },
        // Orders and Inventory moved to Dashboard Overview
        { path: '/admin/products', icon: Package, label: 'Products', roles: ['admin', 'seo_writer'] },
        { path: '/admin/offers', icon: Tag, label: 'Offers', roles: ['admin'] },
        { path: '/admin/brands', icon: Tag, label: 'Brands', roles: ['admin'] },
        { path: '/admin/leads', icon: Users, label: 'Leads', roles: ['admin'] },
        { path: '/admin/prescriptions', icon: FileText, label: 'Prescriptions', roles: ['admin', 'doctor'] },
        { path: '/admin/appointments', icon: Calendar, label: 'Appointments', roles: ['admin', 'doctor'] },
        { path: '/admin/doctors', icon: Stethoscope, label: 'Doctors', roles: ['admin'] },
        { path: '/admin/categories', icon: Package, label: 'Categories', roles: ['admin'] },
        { path: '/admin/concerns', icon: Stethoscope, label: 'Concerns', roles: ['admin'] },
        { path: '/admin/reports', icon: FileText, label: 'Reports', roles: ['admin'] },
        { path: '/admin/blogs', icon: FileText, label: 'Blogs', roles: ['admin', 'seo_writer'] },
    ];

    const navItems = allNavItems.filter(item => role && item.roles.includes(role));

    return (
        <div className="h-screen bg-sage-50 flex overflow-hidden">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-sage-900 text-white transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } flex flex-col h-full`}
            >
                <div className="p-6 flex items-center justify-between flex-shrink-0">
                    <h2 className="text-2xl font-serif font-bold text-saffron-500">Admin</h2>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="px-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar pb-4">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-saffron-500 text-white font-bold'
                                    : 'text-sage-200 hover:bg-sage-800 hover:text-white'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-sage-800 bg-sage-900 flex-shrink-0 space-y-1">
                    <Link
                        to="/admin/settings"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === '/admin/settings'
                            ? 'bg-saffron-500 text-white font-bold'
                            : 'text-sage-300 hover:bg-sage-800 hover:text-white'
                            }`}
                    >
                        <Settings className="w-5 h-5" />
                        Settings
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-red-300 hover:bg-sage-800 hover:text-red-200 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto">
                {/* Mobile Header */}
                <header className="bg-white shadow-sm border-b border-sage-100 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-sage-900">
                            <Menu className="w-6 h-6" />
                        </button>
                        <span className="font-bold text-sage-900 md:hidden">Dashboard</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <NotificationBell />
                    </div>
                </header>

                <div className="p-6 md:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
