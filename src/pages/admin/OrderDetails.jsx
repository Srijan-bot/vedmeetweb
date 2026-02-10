import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
    ChevronLeft, Package, User, MapPin, CreditCard,
    CheckCircle, XCircle, Truck, FileText, AlertCircle, Lock, Calendar, Clock, Shield
} from 'lucide-react';
import { getProfiles, getWarehouses, getSetting } from '../../lib/data'; // Import getWarehouses and getSetting
import { calculateShippingCost } from '../../lib/shippingUtils';

// Helper: Haversine Distance Calculation (Km)
const calculateDistance = (coord1, coord2) => {
    if (!coord1 || !coord2) return null;

    const toRad = (value) => (value * Math.PI) / 180;

    // Parse coordinates if they are strings "(lng,lat)" or objects {x,y}
    // Standardize to [lng, lat] array
    const parseCoord = (c) => {
        if (typeof c === 'string') {
            // Remove parens and split
            const parts = c.replace(/[()]/g, '').split(',').map(Number);
            return [parts[0], parts[1]]; // lng, lat
        }
        if (c.x !== undefined && c.y !== undefined) return [c.x, c.y]; // PostGIS point {x: lng, y: lat}
        if (Array.isArray(c)) return c;
        return null;
    };

    const p1 = parseCoord(coord1);
    const p2 = parseCoord(coord2);

    if (!p1 || !p2) return null;

    const [lon1, lat1] = p1;
    const [lon2, lat2] = p2;

    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};

const OrderDetails = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Shipping Logic State
    const [shippingRates, setShippingRates] = useState([]);
    const [packagingBoxes, setPackagingBoxes] = useState([]);
    const [shippingCost, setShippingCost] = useState(null);
    const [distance, setDistance] = useState(null); // New state for distance
    const [invoiceNum, setInvoiceNum] = useState(null);
    const [showTrackingModal, setShowTrackingModal] = useState(false);
    const [trackingCode, setTrackingCode] = useState('');




    const handleStatusUpdate = async (newStatus, code = null) => {
        if (!confirm(`Are you sure you want to mark this order as ${newStatus}?`)) return;

        setActionLoading(true);
        try {
            const updates = {
                status: newStatus,
                ...(code && { delivery_code: code }) // Reuse delivery_code for tracking code
            };

            const { error } = await supabase
                .from('orders')
                .update(updates)
                .eq('id', orderId);

            if (error) throw error;

            alert(`Order marked as ${newStatus}!`);
            setShowTrackingModal(false);
            fetchOrderDetails();
        } catch (error) {
            console.error(`Error updating status to ${newStatus}:`, error);
            alert(`Failed to update status: ${error.message}`);
        } finally {
            setActionLoading(false);
        }
    };



    const fetchOrderDetails = async () => {
        console.log("🚀 fetchOrderDetails START. ID:", orderId);
        try {
            // Fetch Order
            console.log("Fetching order data...");
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .select(`
                    *,
                    agent:agent_id (id, agent_name, email, contact_no)
                `)
                .eq('id', orderId)
                .single();

            if (orderError) {
                console.error("❌ Error fetching order:", orderError);
                throw orderError;
            }
            console.log("✅ Order data fetched:", orderData);
            setOrder(orderData);

            // Fetch Items with Product Details
            console.log("Fetching order items...");
            const { data: itemsData, error: itemsError } = await supabase
                .from('order_items')
                .select(`
                    *,
                      product:products(name, images, weight, dimensions, volume, gst_rate),
                    variant:product_variants(id, name, sku, stock_quantity, weight, dimensions, volume, gst_rate)
                `)
                .eq('order_id', orderId);

            if (itemsError) {
                console.error("❌ Error fetching items:", itemsError);
                throw itemsError;
            }
            console.log('📦 Fetched Items:', itemsData); // DEBUG: Check if stock_quantity is here
            setItems(itemsData || []);

            // Check for Invoice
            console.log("Fetching invoice...");
            const { data: invoiceData } = await supabase
                .from('invoices')
                .select('invoice_number')
                .eq('order_id', orderId)
                .maybeSingle();

            if (invoiceData) setInvoiceNum(invoiceData.invoice_number);
            if (invoiceData) setInvoiceNum(invoiceData.invoice_number);
            console.log("Invoice data:", invoiceData);

            // Fetch Warehouses & Calculate Distance
            // We assume distance from the MAIN warehouse for now, or the first one found with coords
            const warehouses = await getWarehouses();
            const mainWarehouse = warehouses.find(w => w.coordinates) || warehouses[0];

            if (mainWarehouse && mainWarehouse.coordinates && orderData.coordinates) {
                const dist = calculateDistance(orderData.coordinates, mainWarehouse.coordinates);
                setDistance(dist);
            }

        } catch (error) {
            console.error("❌ Error fetching order details:", error);
        } finally {
            console.log("🏁 fetchOrderDetails FINALLY. Setting loading = false");
            setLoading(false);
        }
    };







    useEffect(() => {
        if (orderId) {
            fetchOrderDetails();
        }
    }, [orderId]);

    // Fetch Shipping Settings
    useEffect(() => {
        const fetchSettings = async () => {
            const rates = await getSetting('shipping_rates');
            const boxes = await getSetting('packaging_boxes');
            if (rates) setShippingRates(rates);
            if (boxes) setPackagingBoxes(boxes);
        };
        fetchSettings();
    }, []);

    // Calculate Shipping Cost when dependencies change
    useEffect(() => {
        if (!order || items.length === 0 || !distance || shippingRates.length === 0) return;

        // Prepare order details for calculator
        // Calculator expects: { items: [ { product: { weight, dimensions }, quantity } ] }
        // Our items structure matches this roughly but we need to ensure fields exist
        const orderForCalc = {
            items: items.map(i => ({
                product: i.product,
                variant: i.variant,
                quantity: i.quantity
            }))
        };

        const result = calculateShippingCost(
            orderForCalc,
            shippingRates,
            packagingBoxes,
            distance
        );

        setShippingCost(result);

    }, [order, items, distance, shippingRates, packagingBoxes]);

    // Calculate Totals for Display
    // Helper to parse weight string (e.g. "500 g", "1 kg") -> grams
    const parseWeight = (str) => {
        if (!str) return 0;
        const lower = str.toLowerCase();
        const floatVal = parseFloat(lower);
        if (isNaN(floatVal)) return 0;

        if (lower.includes('kg')) return floatVal * 1000;
        return floatVal; // Assume grams if no unit or 'g'
    };

    // Helper to parse dimensions string (e.g. "10 x 20 x 5 cm") -> volume cm3
    const parseVolumeFromDims = (str) => {
        if (!str) return 0;
        // Extract numbers
        const parts = str.toLowerCase().split('x').map(p => parseFloat(p));
        if (parts.length >= 3 && !parts.some(isNaN)) {
            return parts[0] * parts[1] * parts[2];
        }
        return 0;
    };

    // Calculate Totals for Display
    const totalWeight = items.reduce((sum, item) => {
        const wStr = item.variant?.weight || item.product?.weight;
        return sum + (parseWeight(wStr) * item.quantity);
    }, 0);

    const totalVolume = items.reduce((sum, item) => {
        // Try explicit volume field first? Or dimensions?
        // Usually dimensions string is "LxWxH unit"
        // Let's rely on dimensions field
        const dStr = item.variant?.dimensions || item.product?.dimensions;
        return sum + (parseVolumeFromDims(dStr) * item.quantity);
    }, 0);

    if (loading) return <div className="p-8 text-center flex flex-col items-center justify-center h-64 text-gray-500">
        <Package className="w-8 h-8 mb-2 animate-bounce" />
        Loading order details...
    </div>;

    if (!order) return <div className="p-8 text-center text-red-500">Order not found.</div>;

    // DEBUG: Dump raw order data to verify agent_id existence
    // Remove this after verification
    // console.log("Raw Order Data:", order); 
    // Uncommenting visual debug
    // return <pre>{JSON.stringify(order, null, 2)}</pre>;


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
        <div className="p-6 max-w-7xl mx-auto relative pb-20 bg-stone-50 min-h-screen">
            <button onClick={() => navigate('/admin/orders')} className="flex items-center text-stone-500 hover:text-emerald-600 mb-6 transition-colors group font-medium">
                <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" /> Back to Orders
            </button>

            {/* HEADER SECTION */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-4xl font-serif font-bold text-stone-900">Order #{order.id.slice(0, 8)}</h1>
                        <StatusBadge status={order.status} />
                    </div>
                    <div className="flex items-center gap-4 text-stone-500 text-sm">
                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(order.created_at).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {new Date(order.created_at).toLocaleTimeString()}</span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    {['Pending', 'Confirmed', 'Processing'].includes(order.status) && (
                        <button
                            onClick={() => handleStatusUpdate('Shipped')}
                            disabled={actionLoading}
                            className="px-5 py-2.5 bg-stone-900 text-white hover:bg-stone-800 rounded-xl font-medium shadow-sm transition-all flex items-center gap-2"
                        >
                            <Truck className="w-4 h-4" /> Ship Order
                        </button>
                    )}

                    {order.status === 'Shipped' && (
                        <button
                            onClick={() => setShowTrackingModal(true)}
                            disabled={actionLoading}
                            className="px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-medium shadow-sm transition-all flex items-center gap-2"
                        >
                            <Truck className="w-4 h-4" /> Out for Delivery
                        </button>
                    )}

                    {(invoiceNum || ['Shipped', 'Out for Delivery', 'Delivered'].includes(order.status)) && (
                        <a
                            href={`/invoice/${order.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-5 py-2.5 bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 rounded-xl font-medium shadow-sm transition-all flex items-center gap-2"
                        >
                            <FileText className="w-4 h-4" /> Download Invoice
                        </a>
                    )}
                </div>
            </div>

            {/* BENTO GRID LAYOUT */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">

                {/* 1. CUSTOMER CARD */}
                <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 text-emerald-700 mb-2">
                        <div className="p-2 bg-emerald-50 rounded-lg">
                            <User className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-lg text-stone-800">Customer</h3>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Name</p>
                            <p className="font-medium text-stone-900 text-lg">{order.first_name} {order.last_name}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Contact</p>
                            <p className="text-stone-700">{order.email}</p>
                            <p className="text-stone-700">{order.phone}</p>
                        </div>
                    </div>
                </div>

                {/* 2. SHIPPING ADDRESS CARD */}
                <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 text-orange-600 mb-2">
                        <div className="p-2 bg-orange-50 rounded-lg">
                            <MapPin className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-lg text-stone-800">Shipping To</h3>
                    </div>
                    <div className="flex-1">
                        <p className="text-stone-700 leading-relaxed mb-4">
                            {order.address},<br />
                            {order.city} - <span className="font-bold">{order.zip}</span>
                        </p>

                        {distance !== null && (
                            <div className="inline-flex items-center px-3 py-1 bg-stone-100 rounded-full text-stone-600 text-xs font-bold mb-3">
                                <Truck className="w-3 h-3 mr-1" /> {distance.toFixed(1)} km away
                            </div>
                        )}

                        {order.coordinates && (
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${(() => {
                                    if (typeof order.coordinates === 'string') {
                                        const [lng, lat] = order.coordinates.replace(/[()]/g, '').split(',');
                                        return `${lat},${lng}`;
                                    }
                                    return `${order.coordinates.y},${order.coordinates.x}`;
                                })()}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full text-center py-2 border border-blue-200 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
                            >
                                Open in Maps
                            </a>
                        )}
                    </div>
                </div>

                {/* 3. PAYMENT INFO CARD */}
                <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 text-purple-600 mb-2">
                        <div className="p-2 bg-purple-50 rounded-lg">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-lg text-stone-800">Payment</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-stone-100 pb-2">
                            <span className="text-stone-500 text-sm">Method</span>
                            <span className="font-medium text-stone-900 capitalize">{order.payment_method}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-stone-100 pb-2">
                            <span className="text-stone-500 text-sm">Status</span>
                            <span className={`px-2 py-0.5 rounded text-sm font-bold ${order.payment_status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                {order.payment_status}
                            </span>
                        </div>
                        <div className="pt-2">
                            <span className="text-stone-500 text-xs uppercase tracking-wider block mb-1">Total Amount</span>
                            <span className="text-3xl font-bold text-stone-900">₹{order.total_amount?.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </div>

                {/* 4. ORDER ITEMS (Spans 2 cols, 2 rows) */}
                <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden flex flex-col md:col-span-2 lg:col-span-1 lg:row-span-2 hover:shadow-md transition-shadow">
                    <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                        <h3 className="font-bold text-lg text-stone-800 flex items-center gap-2">
                            <Package className="w-5 h-5 text-stone-600" /> Items <span className="bg-stone-200 text-stone-600 px-2 py-0.5 rounded-full text-xs">{items.length}</span>
                        </h3>
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-2 max-h-[500px]">
                        {items.map((item) => (
                            <div key={item.id} className="flex gap-3 p-3 hover:bg-stone-50 rounded-xl transition-colors border border-transparent hover:border-stone-100 group">
                                <div className="w-16 h-16 bg-white border border-stone-200 rounded-lg shrink-0 overflow-hidden relative">
                                    {item.product?.images?.[0] ? (
                                        <img src={item.product.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-300"><Package /></div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-stone-800 text-sm truncate">{item.product?.name}</h4>
                                    <p className="text-xs text-stone-500 mb-1">{item.variant?.name || 'Standard'}</p>
                                    <div className="flex justify-between items-end mt-2">
                                        <span className="text-xs font-mono bg-stone-100 px-1.5 py-0.5 rounded text-stone-600">{item.quantity} x ₹{item.price}</span>
                                        <span className="font-bold text-stone-900 text-sm">₹{(item.quantity * item.price).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Price Breakup Section (Inside Items Card) */}
                    {/* Price Breakup Section (Inside Items Card) */}
                    <div className="p-4 bg-stone-50 border-t border-stone-200 text-sm space-y-2">
                        <div className="flex justify-between text-stone-500">
                            <span>Item Total</span>
                            <span>₹{items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-stone-500">
                            <span>Tax (GST)</span>
                            <span>₹{items.reduce((sum, item) => {
                                const gst = item.gst_rate || item.variant?.gst_rate || item.product?.gst_rate || 0;
                                return sum + ((item.price * (gst / 100)) * item.quantity);
                            }, 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-stone-500">
                            <span>Shipping</span>
                            <span>₹{order.shipping_amount || 0}</span>
                        </div>
                        <div className="flex justify-between font-bold text-stone-900 border-t border-stone-200 pt-2 mt-2">
                            <span>Grand Total</span>
                            <span>₹{order.total_amount?.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* 5. INTERNAL INVENTORY STATUS (Moved Up) */}
                <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 md:col-span-3 lg:col-span-2 hover:shadow-md transition-shadow flex flex-col">
                    <h3 className="font-bold text-lg text-stone-800 flex items-center gap-2 mb-4">
                        <Shield className="w-5 h-5 text-teal-600" /> Internal Inventory Status
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-3 max-h-[400px]">
                        {items.map(item => (
                            <div key={item.id} className="p-3 border border-stone-100 rounded-xl bg-stone-50/50 flex flex-col gap-1">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-stone-700 text-sm truncate pr-2">{item.product?.name}</h4>
                                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider shrink-0 ${item.variant?.stock_quantity > 10 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {item.variant?.stock_quantity > 10 ? 'In Stock' : 'Low Stock'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs mt-1 text-stone-500">
                                    <span>Qty: {item.quantity}</span>
                                    <span>Wt: {(item.variant?.weight || item.product?.shipping_weight || 0)}g</span>
                                </div>
                                <div className="flex justify-between items-center text-xs mt-1">
                                    <span className="text-stone-500">{item.variant?.name}</span>
                                    <span className="font-mono text-stone-400">#{item.variant?.sku || 'NOSKU'}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs mt-1 border-t border-stone-100 pt-1">
                                    <span className="text-stone-400 font-bold uppercase text-[10px]">Warehouse</span>
                                    <span className="font-bold text-stone-800">Main Warehouse</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Total Weight & Dimensions Display */}
                    <div className="mt-4 pt-4 border-t border-stone-100 grid grid-cols-2 gap-4">
                        <div className="bg-stone-50 p-3 rounded-lg text-center">
                            <p className="text-[10px] text-stone-400 uppercase font-bold">Total Weight</p>
                            <p className="font-mono font-bold text-stone-800 text-lg">{totalWeight} g</p>
                        </div>
                        <div className="bg-stone-50 p-3 rounded-lg text-center">
                            <p className="text-[10px] text-stone-400 uppercase font-bold">Est. Volume</p>
                            <p className="font-mono font-bold text-stone-800 text-lg">{totalVolume.toLocaleString()} cm³</p>
                        </div>
                    </div>
                </div>

                {/* 6. LOGISTICS & SHIPPING (Moved Down & Full Width) */}
                <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 md:col-span-3 lg:col-span-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3 text-indigo-600">
                            <div className="p-2 bg-indigo-50 rounded-lg">
                                <Truck className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-lg text-stone-800">Logistics & Shipping</h3>
                        </div>
                        {shippingCost && (
                            <div className="flex gap-2">
                                <span className="bg-stone-100 text-stone-600 px-3 py-1 rounded-full text-xs font-bold border border-stone-200">
                                    {shippingCost.distanceKm ? `${shippingCost.distanceKm.toFixed(1)} km` : 'N/A'}
                                </span>
                                <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100">
                                    {shippingCost.zoneKey?.toUpperCase() || 'ZONE N/A'}
                                </span>
                            </div>
                        )}
                    </div>

                    {shippingCost ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Col 1: Box Info */}
                            <div className="space-y-4">
                                <div className="bg-stone-50 rounded-xl p-4 border border-stone-100 h-full">
                                    <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Packaging</p>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-stone-800">{shippingCost.selectedBox?.name || 'Custom Box'}</span>
                                        <span className="text-xs text-stone-500 font-mono">
                                            {(shippingCost.selectedBox?.box_id || shippingCost.selectedBox?.id) ? `ID: ${shippingCost.selectedBox.box_id || shippingCost.selectedBox.id}` : ''}
                                        </span>
                                    </div>
                                    <div className="text-xs text-stone-500 mb-2">
                                        Dims: {shippingCost.selectedBox?.length_cm} x {shippingCost.selectedBox?.width_cm} x {shippingCost.selectedBox?.height_cm} cm
                                    </div>
                                    <div className="w-full bg-stone-200 h-1.5 rounded-full mt-2 overflow-hidden">
                                        <div className="bg-indigo-500 h-full rounded-full" style={{ width: '60%' }}></div>
                                    </div>
                                </div>
                            </div>

                            {/* Col 2: Weights */}
                            <div className="grid grid-cols-2 gap-3 self-start">
                                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-center flex flex-col justify-center relative overflow-hidden">
                                    <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[8px] px-1.5 py-0.5 rounded-bl">BILLED</div>
                                    <p className="text-[10px] text-indigo-400 uppercase font-bold">Actual Wt</p>
                                    <p className="font-mono font-bold text-indigo-900 text-lg">{shippingCost.actualTotalWeight} g</p>
                                </div>
                                <div className="bg-white border border-stone-200 rounded-lg p-3 text-center flex flex-col justify-center opacity-70">
                                    <p className="text-[10px] text-stone-400 uppercase font-bold">Volumetric</p>
                                    <p className="font-mono font-bold text-stone-500 text-lg line-through decoration-stone-300">{Math.round(shippingCost.volumetricWeight)} g</p>
                                </div>
                                <div className="col-span-2 bg-stone-50 border border-stone-200 rounded-lg p-2 flex justify-between items-center text-xs">
                                    <span className="text-stone-500">Chargeable Weight:</span>
                                    <span className="font-bold text-stone-900">{shippingCost.actualTotalWeight} g</span>
                                </div>
                            </div>

                            {/* Col 3: Cost Breakdown */}
                            <div className="space-y-3 pl-0 md:pl-6 border-l-0 md:border-l border-stone-100">
                                <h4 className="font-bold text-stone-800 text-sm">Cost Analysis</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between text-stone-600">
                                        <span>Applied Slab</span>
                                        <span className="font-mono font-bold text-indigo-600">{shippingCost.appliedSlab || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between text-stone-600">
                                        <span>Base Estimate</span>
                                        <span className="font-mono">₹{shippingCost.baseCost}</span>
                                    </div>
                                    {shippingCost.extraCost > 0 && (
                                        <div className="flex justify-between text-orange-600">
                                            <span>Surcharge Estimate</span>
                                            <span className="font-mono">+ ₹{shippingCost.extraCost}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-stone-600 border-t border-dashed border-stone-200 pt-2">
                                        <span>Calculated Total</span>
                                        <span className="font-mono text-stone-500">₹{shippingCost.totalCost}</span>
                                    </div>

                                    <div className="flex justify-between items-center pt-2 mt-2 bg-stone-50 p-2 rounded-lg border border-stone-200">
                                        <span className="font-bold text-stone-800">Charged Shipping</span>
                                        <span className="font-bold text-xl text-indigo-600">₹{order.shipping_amount || 0}</span>
                                    </div>

                                    {Math.abs((order.shipping_amount || 0) - shippingCost.totalCost) > 1 && (
                                        <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
                                            <AlertCircle className="w-4 h-4 shrink-0" />
                                            <span>
                                                Mismatch: Calculated cost (₹{shippingCost.totalCost}) differs from charged amount.
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-stone-400 bg-stone-50 rounded-xl border border-dashed border-stone-200">
                            <Package className="w-8 h-8 mb-2 opacity-50" />
                            <p className="text-sm">Shipping calculation pending...</p>
                        </div>
                    )}
                </div>

            </div> {/* End Grid */}


            {/* Tracking Code Modal */}
            {
                showTrackingModal && (
                    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                        <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl transform transition-all scale-100">
                            <h3 className="text-xl font-bold mb-2 flex items-center gap-2 text-stone-900">
                                <Truck className="w-6 h-6 text-indigo-600" /> Enter Tracking Code
                            </h3>
                            <p className="text-stone-500 mb-6 text-sm leading-relaxed">
                                Provide the courier tracking ID to mark this order as "Out for Delivery".
                            </p>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                handleStatusUpdate('Out for Delivery', trackingCode);
                            }}>
                                <input
                                    value={trackingCode}
                                    onChange={(e) => setTrackingCode(e.target.value)}
                                    type="text"
                                    placeholder="TRK-XXXXXXXXX"
                                    className="w-full border border-stone-200 rounded-xl p-4 text-lg font-mono mb-4 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all placeholder:text-stone-300"
                                    required
                                    autoFocus
                                />
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowTrackingModal(false)}
                                        className="flex-1 px-4 py-3 border border-stone-200 rounded-xl text-stone-600 hover:bg-stone-50 font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={actionLoading}
                                        className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium transition-colors shadow-sm"
                                    >
                                        {actionLoading ? 'Saving...' : 'Confirm'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default OrderDetails;
