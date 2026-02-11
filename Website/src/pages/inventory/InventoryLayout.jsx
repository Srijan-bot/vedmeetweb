import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, LogOut, Menu, X, ArrowLeft, Settings, Activity, FileText, Scale } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const InventoryLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/admin/login');
    };

    const navItems = [
        { path: '/inventory/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/inventory/movement', icon: Activity, label: 'Stock Movement' },
        { path: '/inventory/stock', icon: Package, label: 'Stock List' }, // Reordered for better flow
        { path: '/inventory/accounting', icon: Scale, label: 'Accounting' },
        { path: '/inventory/reports', icon: FileText, label: 'Reports' },
        { path: '/inventory/settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <div className="h-screen bg-sage-50 flex overflow-hidden font-sans text-sage-900">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-sage-200 transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } flex flex-col h-full shadow-lg`}
            >
                <div className="p-6 flex items-center justify-between flex-shrink-0 border-b border-sage-200">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-sage-900 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-lg font-bold text-sage-900 tracking-tight">Inventory</h2>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-stone-500 hover:text-sage-900">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="px-4 py-6 space-y-1 flex-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${isActive
                                    ? 'bg-sage-100 text-sage-900 shadow-sm border border-sage-200'
                                    : 'text-stone-500 hover:bg-sage-50 hover:text-sage-900'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? 'text-sage-900' : 'text-stone-400 group-hover:text-sage-700'}`} />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-sage-200 bg-sage-50">
                    <Link
                        to="/admin/dashboard"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-stone-500 hover:bg-white hover:text-sage-900 transition-colors mb-1 shadow-sm border border-transparent hover:border-sage-200"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Admin
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-sage-50/50">
                {/* Mobile Header */}
                <header className="md:hidden bg-white border-b border-sage-200 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsSidebarOpen(true)} className="text-stone-500 hover:text-sage-900">
                            <Menu className="w-6 h-6" />
                        </button>
                        <span className="font-bold text-sage-900">Inventory Portal</span>
                    </div>
                </header>

                <div className="flex-1 overflow-x-hidden overflow-y-auto relative p-6">
                    {/* Content Container */}
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default InventoryLayout;
