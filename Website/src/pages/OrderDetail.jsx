import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    ChevronLeft, Package, Clock, Truck, CheckCircle,
    MapPin, CreditCard, ShoppingBag, XCircle, FileText, Copy,
    ArrowRight, Box
} from 'lucide-react';
import Button from '../components/Button';
import { motion } from 'framer-motion';

const OrderDetail = () => {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                // Fetch Order
                const { data: orderData, error: orderError } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('id', orderId)
                    .single();

                if (orderError) throw orderError;
                setOrder(orderData);

                // Fetch Items with Product Details
                const { data: itemsData, error: itemsError } = await supabase
                    .from('order_items')
                    .select(`
                        *,
                        product:products(name, images)
                    `)
                    .eq('order_id', orderId);

                if (itemsError) throw itemsError;
                setItems(itemsData || []);
            } catch (error) {
                console.error("Error fetching order:", error);
            } finally {
                setLoading(false);
            }
        };

        if (orderId) fetchOrderDetails();
    }, [orderId]);

    if (loading) return (
        <div className="min-h-screen pt-20 flex items-center justify-center bg-[#FAFAF9]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-sage-200 border-t-sage-600 rounded-full animate-spin"></div>
                <p className="text-sage-600 font-serif animate-pulse">Loading order details...</p>
            </div>
        </div>
    );

    if (!order) return (
        <div className="min-h-screen pt-20 flex flex-col items-center justify-center bg-[#FAFAF9] px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center max-w-md"
            >
                <div className="w-20 h-20 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-6 text-sage-400">
                    <Package className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-serif font-bold text-sage-900 mb-4">Order Not Found</h2>
                <p className="text-stone-500 mb-8">We couldn't find the order you're looking for. It might have been moved or deleted.</p>
                <Link to="/profile">
                    <Button>Back to My Orders</Button>
                </Link>
            </motion.div>
        </div>
    );

    // Helpers
    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const getStatusStep = (status) => {
        switch (status) {
            case 'Pending': return 1;
            case 'Confirmed': return 2;
            case 'Processing': return 2;
            case 'Shipped': return 3;
            case 'Out for Delivery': return 4;
            case 'Delivered': return 4; // Map Delivered to Out for Delivery (completed)
            default: return 0;
        }
    };

    const currentStep = getStatusStep(order.status);
    const isCancelled = order.status === 'Cancelled';

    const timelineSteps = [
        { step: 1, label: 'Order Placed', date: formatDate(order.created_at), icon: Clock },
        { step: 2, label: 'Confirmed', date: order.confirmed_at ? formatDate(order.confirmed_at) : 'Pending Confirmation', icon: CheckCircle },
        { step: 3, label: 'Shipped', date: order.shipped_at ? formatDate(order.shipped_at) : 'Not shipped yet', icon: Truck }, // Ideally track dates if available
        { step: 4, label: 'Out for Delivery', date: order.out_for_delivery_at ? formatDate(order.out_for_delivery_at) : 'Expected soon', icon: Box },
    ];

    return (
        <div className="min-h-screen bg-[#FAFAF9] py-12">
            <div className="container mx-auto px-4 md:px-6 max-w-6xl">

                {/* Breadcrumb */}
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <Link to="/profile" className="inline-flex items-center text-stone-500 hover:text-sage-700 mb-8 transition-colors group font-medium">
                        <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                        Back to Orders
                    </Link>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">

                    {/* LEFT COLUMN: Main Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="lg:col-span-8 space-y-6"
                    >

                        {/* 1. Header Card */}
                        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-sage-100/50 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-sage-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50 pointer-events-none"></div>

                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h1 className="text-3xl font-serif font-bold text-sage-900">
                                            Order #{order.id.slice(0, 8)}
                                        </h1>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isCancelled ? 'bg-red-100 text-red-700' :
                                            order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' :
                                                'bg-saffron-100 text-saffron-800'
                                            }`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <p className="text-stone-500 flex items-center gap-2 text-sm">
                                        <Clock className="w-4 h-4" /> Placed on {formatDate(order.created_at)}
                                    </p>
                                </div>

                                {['Delivered', 'Out for Delivery'].includes(order.status) && (
                                    <a
                                        href={`/invoice/${order.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-5 py-2.5 bg-sage-900 text-white hover:bg-sage-800 rounded-xl font-medium transition-all shadow-lg shadow-sage-200"
                                    >
                                        <FileText className="w-4 h-4" /> Download Invoice
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* 2. Enhanced Timeline */}
                        {!isCancelled ? (
                            <div className="bg-white rounded-3xl p-8 shadow-sm border border-sage-100/50">
                                <h3 className="font-serif font-bold text-xl text-sage-900 mb-8">Order Status</h3>

                                {/* Tracking Code */}
                                {order.status === 'Out for Delivery' && order.delivery_code && (
                                    <div className="mb-10 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                                                <Box className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Your Tracking Number</p>
                                                <p className="text-2xl font-mono font-bold text-emerald-800 tracking-wider">{order.delivery_code}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(order.delivery_code);
                                            }}
                                            className="p-3 bg-white hover:bg-emerald-50 text-emerald-600 rounded-xl transition-all border border-emerald-100 shadow-sm"
                                            title="Copy Code"
                                        >
                                            <Copy className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}

                                {/* Progress Bar */}
                                <div className="relative pl-4 md:pl-0">
                                    {/* Mobile Vertical Line */}
                                    <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-stone-100 md:hidden"></div>

                                    {/* Desktop Horizontal Line */}
                                    <div className="hidden md:block absolute top-[22px] left-0 right-0 h-1 bg-stone-100 rounded-full">
                                        <div
                                            className="h-full bg-saffron-500 rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${Math.min(((currentStep - 1) / 3) * 100, 100)}%` }}
                                        ></div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-0 relative">
                                        {timelineSteps.map((s, index) => {
                                            const isActive = currentStep >= s.step;
                                            const isCurrent = currentStep === s.step;

                                            return (
                                                <div key={s.step} className="flex md:flex-col items-center md:text-center gap-4 md:gap-4 relative z-10 w-full">

                                                    {/* Icon Circle */}
                                                    <div className={`
                                                        w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-500 shrink-0
                                                        ${isActive
                                                            ? 'bg-white border-saffron-500 text-saffron-600 shadow-md scale-100'
                                                            : 'bg-white border-stone-100 text-stone-300 scale-90'}
                                                        ${isCurrent ? 'ring-4 ring-saffron-100' : ''}
                                                    `}>
                                                        <s.icon className="w-5 h-5" />
                                                    </div>

                                                    {/* Text */}
                                                    <div className="flex-1 md:w-full">
                                                        <p className={`text-sm font-bold transition-colors ${isActive ? 'text-sage-900' : 'text-stone-400'}`}>
                                                            {s.label}
                                                        </p>
                                                        {isActive && (
                                                            <p className="text-xs text-stone-500 mt-0.5 md:mt-1 font-medium">
                                                                {s.date}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-red-50 rounded-3xl p-8 border border-red-100 flex items-center gap-6 text-red-800">
                                <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                                    <XCircle className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl mb-1">Order Cancelled</h3>
                                    <p className="text-red-700/80">This order has been cancelled and will not be processed. If you paid online, a refund has been initiated.</p>
                                </div>
                            </div>
                        )}

                        {/* 3. Items List */}
                        <div className="bg-white rounded-3xl shadow-sm border border-sage-100/50 overflow-hidden">
                            <div className="p-6 md:p-8 border-b border-sage-50 flex justify-between items-center bg-sage-50/30">
                                <h3 className="font-serif font-bold text-xl text-sage-900">Items Ordered ({items.length})</h3>
                            </div>
                            <div className="divide-y divide-sage-50">
                                {items.map((item, idx) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 + 0.3 }}
                                        className="p-6 md:p-8 flex flex-col sm:flex-row gap-6 hover:bg-sage-50/20 transition-colors group"
                                    >
                                        {/* Product Image */}
                                        <div className="w-full sm:w-32 h-40 sm:h-32 bg-stone-100 rounded-2xl overflow-hidden shrink-0 border border-stone-200 relative">
                                            {item.product?.images?.[0] ? (
                                                <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-stone-300">
                                                    <ShoppingBag className="w-10 h-10" />
                                                </div>
                                            )}
                                            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold shadow-sm">
                                                x{item.quantity}
                                            </div>
                                        </div>

                                        {/* Product Info */}
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start gap-4 mb-2">
                                                    <Link to={`/product/${item.product_id}`} className="font-bold text-lg text-sage-900 hover:text-saffron-600 transition-colors line-clamp-2">
                                                        {item.product?.name || 'Unknown Product'}
                                                    </Link>
                                                    <span className="font-bold text-lg text-sage-900 whitespace-nowrap">Rs. {(item.price * item.quantity).toFixed(2)}</span>
                                                </div>
                                                <p className="text-sm text-stone-500 mb-4">{item.variant_id ? 'Standard Packaging' : 'Standard Bundle'}</p>
                                            </div>

                                            <div className="flex items-center gap-3 mt-auto">
                                                <Link to={`/product/${item.product_id}`}>
                                                    <Button variant="outline" size="sm" className="text-xs h-8">
                                                        View Product
                                                    </Button>
                                                </Link>
                                                <Button size="sm" className="text-xs h-8 bg-sage-100 text-sage-700 hover:bg-sage-200 border-transparent">
                                                    Buy Again
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                    </motion.div>

                    {/* RIGHT COLUMN: Sidebar Summary */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="lg:col-span-4 space-y-6 lg:sticky lg:top-8"
                    >

                        {/* Combined Cost & Payment Card */}
                        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-sage-100/50 space-y-8 relative overflow-hidden">
                            {/* Decorative Background */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-saffron-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-60 pointer-events-none"></div>

                            {/* Price Breakdown */}
                            <div>
                                <h3 className="font-serif font-bold text-xl text-sage-900 mb-6 flex items-center gap-2">
                                    Order Summary
                                </h3>
                                <div className="space-y-3 pb-6 border-b border-dashed border-sage-200 text-sm">
                                    <div className="flex justify-between text-stone-600">
                                        <span>Subtotal</span>
                                        <span className="font-medium text-sage-900">
                                            Rs. {(order.total_amount - (order.shipping_amount || 0) - (order.tax_amount || 0)).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-stone-600">
                                        <span>Shipping</span>
                                        {Number(order.shipping_amount) > 0 ? (
                                            <span className="text-sage-900 font-medium">Rs. {Number(order.shipping_amount).toFixed(2)}</span>
                                        ) : (
                                            <span className="text-emerald-600 font-bold text-xs uppercase bg-emerald-50 px-2 py-0.5 rounded">Free</span>
                                        )}
                                    </div>
                                    <div className="flex justify-between text-stone-600">
                                        <span>Tax</span>
                                        <span className="font-medium text-sage-900">Rs. {Number(order.tax_amount || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="pt-6 flex justify-between items-center">
                                    <span className="font-bold text-lg text-sage-900">Total Paid</span>
                                    <span className="font-serif font-bold text-2xl text-sage-900">Rs. {Number(order.total_amount).toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div className="bg-stone-50 rounded-2xl p-4 flex items-center justify-between border border-stone-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-sage-600 shadow-sm">
                                        <CreditCard className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sage-900 text-sm capitalize">{order.payment_method}</p>
                                        <p className="text-[10px] uppercase font-bold text-stone-400">Payment Method</p>
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${order.payment_status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {order.payment_status || 'Pending'}
                                </div>
                            </div>
                        </div>

                        {/* Shipping Address Card */}
                        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-sage-100/50">
                            <h3 className="font-serif font-bold text-xl text-sage-900 mb-6 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-saffron-500" /> Shipping To
                            </h3>
                            <div className="space-y-1 text-stone-600 leading-relaxed text-sm">
                                <p className="font-bold text-sage-900 text-lg mb-2">{order.first_name} {order.last_name}</p>
                                <p>{order.address}</p>
                                <p>{order.city}, {order.zip}</p>
                                <div className="mt-6 pt-4 border-t border-stone-100 grid gap-2">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase text-stone-400">Phone</p>
                                        <p className="text-sage-900 font-medium">{order.phone}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase text-stone-400">Email</p>
                                        <p className="text-sage-900 font-medium truncate">{order.email}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Help Card */}
                        <div className="bg-sage-900 rounded-3xl p-6 shadow-sm text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-white/20 transition-colors"></div>
                            <h3 className="font-bold text-lg mb-2">Need Help?</h3>
                            <p className="text-sage-200 text-sm mb-4">Have an issue with this order?</p>
                            <Link to="/contact">
                                <button className="w-full py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
                                    Contact Support <ArrowRight className="w-4 h-4" />
                                </button>
                            </Link>
                        </div>

                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetail;
