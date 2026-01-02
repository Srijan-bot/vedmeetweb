import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
    ChevronLeft, Package, User, MapPin, CreditCard,
    CheckCircle, XCircle, Truck, FileText, AlertCircle
} from 'lucide-react';

const OrderDetails = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [invoiceNum, setInvoiceNum] = useState(null);

    useEffect(() => {
        fetchOrderDetails();
    }, [orderId]);

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

            // Check for Invoice
            const { data: invoiceData } = await supabase
                .from('invoices')
                .select('invoice_number')
                .eq('order_id', orderId)
                .maybeSingle();

            if (invoiceData) setInvoiceNum(invoiceData.invoice_number);

        } catch (error) {
            console.error("Error fetching order details:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmOrder = async () => {
        if (!confirm("Are you sure you want to confirm this order? Stocks will be deducted.")) return;
        setActionLoading(true);
        try {
            const { data, error } = await supabase.rpc('confirm_order', { p_order_id: orderId });
            if (error) throw error;

            // Allow DB trigger/function time to propagate if async
            alert(`Order Confirmed! Invoice Generated: ${data.invoice_number}`);
            fetchOrderDetails(); // Refresh
        } catch (error) {
            console.error("Error confirming order:", error);
            alert("Failed to confirm order: " + error.message);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading order details...</div>;
    if (!order) return <div className="p-8 text-center text-red-500">Order not found.</div>;

    const StatusBadge = ({ status }) => {
        const styles = {
            Pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            Confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
            Processing: 'bg-purple-100 text-purple-800 border-purple-200',
            Shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
            Delivered: 'bg-green-100 text-green-800 border-green-200',
            Cancelled: 'bg-red-100 text-red-800 border-red-200',
            Returned: 'bg-gray-100 text-gray-800 border-gray-200',
        };
        return <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${styles[status] || 'bg-gray-100'}`}>{status}</span>;
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <button onClick={() => navigate('/admin/orders')} className="flex items-center text-gray-500 hover:text-emerald-600 mb-6 transition-colors">
                <ChevronLeft className="w-4 h-4 mr-1" /> Back to Orders
            </button>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold text-gray-900">Order #{order.id.slice(0, 8)}</h1>
                        <StatusBadge status={order.status} />
                    </div>
                    <p className="text-gray-500">Placed on {new Date(order.created_at).toLocaleString()}</p>
                </div>

                <div className="flex gap-3">
                    {order.status === 'Pending' && (
                        <>
                            <button className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium transition-colors flex items-center gap-2">
                                <XCircle className="w-4 h-4" /> Cancel Order
                            </button>
                            <button
                                onClick={handleConfirmOrder}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg font-medium shadow-sm transition-all flex items-center gap-2"
                            >
                                <CheckCircle className="w-4 h-4" /> {actionLoading ? 'Confirming...' : 'Confirm Order'}
                            </button>
                        </>
                    )}
                    {order.status === 'Confirmed' && (
                        <button className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium shadow-sm transition-all flex items-center gap-2">
                            <Truck className="w-4 h-4" /> Ship Order
                        </button>
                    )}
                    {invoiceNum && (
                        <button className="px-4 py-2 bg-gray-800 text-white hover:bg-gray-700 rounded-lg font-medium shadow-sm transition-all flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Invoice: {invoiceNum}
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Col: Items */}
                <div className="md:col-span-2 space-y-6">
                    {/* Items Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Package className="w-4 h-4" /> Order Items
                            </h3>
                            <span className="text-sm text-gray-500">{items.length} items</span>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {items.map((item) => (
                                <div key={item.id} className="p-4 flex gap-4">
                                    <div className="w-16 h-16 bg-gray-100 rounded-md shrink-0 overflow-hidden">
                                        {item.product?.images?.[0] && <img src={item.product.images[0]} className="w-full h-full object-cover" />}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-900">{item.product?.name || 'Unknown Product'}</h4>
                                        <p className="text-sm text-gray-500">Variant ID: {item.variant_id?.slice(0, 8) || 'N/A'}</p>
                                        <div className="flex justify-between mt-2">
                                            <span className="text-sm text-gray-900 font-medium">{item.quantity} x Rs. {item.price}</span>
                                            <span className="font-bold text-gray-900">Rs. {(item.quantity * item.price).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 bg-gray-50 border-t border-gray-200">
                            <div className="flex justify-between items-center text-lg font-bold text-gray-900">
                                <span>Total</span>
                                <span>Rs. {order.total_amount?.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Col: Customer & Info */}
                <div className="space-y-6">
                    {/* Customer Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <User className="w-4 h-4 text-emerald-600" /> Customer Details
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div>
                                <p className="text-gray-500">Name</p>
                                <p className="font-medium text-gray-900">{order.first_name} {order.last_name}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Email</p>
                                <p className="font-medium text-gray-900">{order.email}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Phone</p>
                                <p className="font-medium text-gray-900">{order.phone}</p>
                            </div>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-orange-500" /> Shipping Address
                        </h3>
                        <div className="text-sm text-gray-700 leading-relaxed">
                            {order.address}<br />
                            {order.city} {order.zip}
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-blue-500" /> Payment
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Method</span>
                                <span className="font-medium capitalize">{order.payment_method}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Status</span>
                                <span className={`font-medium ${order.payment_status === 'Paid' ? 'text-green-600' : 'text-orange-600'}`}>
                                    {order.payment_status}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;
