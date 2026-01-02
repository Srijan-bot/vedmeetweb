import React, { useEffect, useState } from 'react';
import { ShoppingBag, Users, FileText, AlertTriangle, ArrowRight, CheckCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { getProducts, getDoctors, getBlogs, getProfiles } from '../../lib/data';
import { supabase } from '../../lib/supabase';
import ChatSystem from '../../components/ChatSystem';
import { MessageSquare } from 'lucide-react';

const DashboardOverview = () => {
    const location = useLocation();
    const [stats, setStats] = useState({
        products: 0,
        doctors: 0,
        blogs: 0
    });
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState(null);
    const [userCount, setUserCount] = useState(0);
    const [isChatOpen, setIsChatOpen] = useState(false);

    useEffect(() => {
        if (location.state?.openChat) {
            setIsChatOpen(true);
            // Clear state so it doesn't reopen on refresh? 
            // Actually router state persists on refresh usually, but clearing it is clean.
            // window.history.replaceState({}, document.title)
        }
    }, [location]);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                // Fetch Role
                const { data: { session } } = await supabase.auth.getSession();
                let currentRole = 'user';
                if (session?.user) {
                    const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
                    currentRole = profile?.role || 'user';
                    setRole(currentRole);
                }

                const promises = [
                    getProducts(),
                    getDoctors(),
                    getBlogs()
                ];

                if (currentRole === 'admin') {
                    promises.push(getProfiles());
                }

                const results = await Promise.all(promises);
                const productsData = results[0];
                const doctorsData = results[1];
                const blogsData = results[2];

                if (currentRole === 'admin') {
                    setUserCount(results[3]?.length || 0);
                }

                setStats({
                    products: productsData.length,
                    doctors: doctorsData.length,
                    blogs: blogsData.length
                });

                // Filter for low stock (< 10)
                const lowStock = productsData.filter(p => (p.stock_quantity || 0) < 10);
                setLowStockProducts(lowStock);
            } catch (error) {
                console.error("Error loading dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, []);

    if (loading) return <div className="p-8">Loading dashboard...</div>;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-serif font-bold text-sage-900">Dashboard Overview</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsChatOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-sage-200 text-sage-700 rounded-lg hover:bg-white hover:shadow-sm transition-all text-sm font-medium"
                    >
                        <MessageSquare className="w-4 h-4" />
                        Team Chat
                    </button>

                    {role === 'admin' && (
                        <Link
                            to="/admin/users"
                            className="flex items-center gap-2 px-4 py-2 bg-sage-900 text-white rounded-lg hover:bg-sage-800 transition-colors text-sm font-medium"
                        >
                            <Users className="w-4 h-4" />
                            Manage Users
                        </Link>
                    )}
                </div>
            </div>



            <ChatSystem isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

            {/* Quick Access Portals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link to="/inventory/dashboard" className="p-6 bg-indigo-50 border border-indigo-100 rounded-xl hover:shadow-md transition-shadow flex items-center gap-6 group cursor-pointer">
                    <div className="w-16 h-16 bg-indigo-500 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                        <ShoppingBag className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-indigo-900 group-hover:text-indigo-700">Inventory Portal</h3>
                        <p className="text-sm text-indigo-600/80 mt-1">Manage stock, warehouses, and procurement.</p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-indigo-400 ml-auto group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link to="/admin/orders" className="p-6 bg-amber-50 border border-amber-100 rounded-xl hover:shadow-md transition-shadow flex items-center gap-6 group cursor-pointer">
                    <div className="w-16 h-16 bg-amber-500 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                        <FileText className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-amber-900 group-hover:text-amber-700">Order Management</h3>
                        <p className="text-sm text-amber-600/80 mt-1">Process orders, track shipments, and returns.</p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-amber-400 ml-auto group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-sage-100 flex items-center justify-between">
                    <div>
                        <p className="text-stone-500 text-sm font-medium uppercase tracking-wider">Total Products</p>
                        <h3 className="text-3xl font-bold text-sage-900 mt-1">{stats.products}</h3>
                    </div>
                    <div className="w-12 h-12 bg-saffron-100 text-saffron-600 rounded-full flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-sage-100 flex items-center justify-between">
                    <div>
                        <p className="text-stone-500 text-sm font-medium uppercase tracking-wider">Total Doctors</p>
                        <h3 className="text-3xl font-bold text-sage-900 mt-1">{stats.doctors}</h3>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-sage-100 flex items-center justify-between">
                    <div>
                        <p className="text-stone-500 text-sm font-medium uppercase tracking-wider">Published Articles</p>
                        <h3 className="text-3xl font-bold text-sage-900 mt-1">{stats.blogs}</h3>
                    </div>
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                        <FileText className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Low Stock Alert Section */}
            <div className="bg-white rounded-xl shadow-sm border border-sage-100 overflow-hidden">
                <div className="p-6 border-b border-sage-100 flex items-center justify-between bg-red-50">
                    <div className="flex items-center gap-2 text-red-700">
                        <AlertTriangle className="w-5 h-5" />
                        <h3 className="font-bold text-lg">Low Stock Alert (Less than 10)</h3>
                    </div>
                    <Link to="/admin/products" className="text-sm text-red-600 hover:text-red-800 font-medium">Manage Inventory</Link>
                </div>

                {lowStockProducts.length > 0 ? (
                    <div className="divide-y divide-sage-100">
                        {lowStockProducts.map(product => (
                            <div key={product.id} className="p-4 flex items-center justify-between hover:bg-sage-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <img src={product.image} alt={product.name} className="w-12 h-12 rounded-md object-cover bg-stone-100" />
                                    <div>
                                        <h4 className="font-bold text-sage-900">{product.name}</h4>
                                        <p className="text-xs text-stone-500">SKU: {String(product.id || '').slice(0, 8)}...</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <span className="block text-xs text-stone-500 mb-1">Current Stock</span>
                                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                                            {product.stock_quantity || 0} units
                                        </span>
                                    </div>
                                    <Link to={`/admin/products/edit/${product.id}`} className="p-2 text-stone-400 hover:text-sage-600">
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-stone-500">
                        <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500 opacity-50" />
                        <p>All products are well stocked.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardOverview;
