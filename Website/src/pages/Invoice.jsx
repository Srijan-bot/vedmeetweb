import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getSiteSettings } from '../lib/data';
import { Printer, Download } from 'lucide-react';
import logo from '../assets/logo-full.svg'; // Ensure this path is correct or fallback

const Invoice = () => {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [invoice, setInvoice] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [companyDetails, setCompanyDetails] = useState({
        name: 'Vedmeet Organics Pvt. Ltd.',
        address1: 'Viswnath puram Colony, Awaleshpur',
        address2: 'Varanasi, Uttar Pradesh, 221106',
        gstin: '27AABCU9603R1Z2',
        contact: 'support@vedmeet.com | +91 8115087103'
    });

    useEffect(() => {
        fetchData();
    }, [orderId]);

    const fetchData = async () => {
        try {
            // 1. Fetch Order first
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .select('*')
                .eq('id', orderId)
                .single();
            if (orderError) throw orderError;
            setOrder(orderData);

            // 2. Fetch Existing Invoice
            const { data: invoiceData, error: invoiceError } = await supabase
                .from('invoices')
                .select('*')
                .eq('order_id', orderId)
                .maybeSingle();

            if (invoiceError && invoiceError.code !== 'PGRST116') console.warn(invoiceError);

            // 3. Determine Data Source
            let finalCompanyDetails = null;
            let finalItems = [];

            if (invoiceData?.snapshot_data) {
                // CASE A: Invoice exists with snapshot -> USE IT (Immutable)
                console.log("Using existing invoice snapshot");
                setInvoice(invoiceData);
                finalCompanyDetails = invoiceData.snapshot_data.companyDetails;
                finalItems = invoiceData.snapshot_data.items;
                setCompanyDetails(finalCompanyDetails);
                setItems(finalItems);
            } else {
                // CASE B: New Invoice OR Legacy Invoice (no snapshot) -> GENERATE & SAVE
                console.log("Generating new invoice snapshot...");

                // Fetch Current Settings
                const settings = await getSiteSettings();
                finalCompanyDetails = {
                    name: settings?.company_name || 'Vedmeet Organics Pvt. Ltd.',
                    address1: settings?.company_address_line1 || 'Viswnath puram Colony, Awaleshpur',
                    address2: settings?.company_address_line2 || 'Varanasi, Uttar Pradesh, 221106',
                    gstin: settings?.company_gstin || '27AABCU9603R1Z2',
                    contact: settings?.company_contact || 'support@vedmeet.com | +91 8115087103'
                };
                setCompanyDetails(finalCompanyDetails);

                // Fetch Current Items
                const { data: itemsData, error: itemsError } = await supabase
                    .from('order_items')
                    .select(`
                        *,
                        product:products(name, hsn_code, gst_rate),
                        variant:product_variants(name, sku, hsn_code, gst_rate)
                    `)
                    .eq('order_id', orderId);

                if (itemsError) throw itemsError;
                finalItems = itemsData || [];
                setItems(finalItems);

                // Prepare Snapshot
                const snapshot = {
                    companyDetails: finalCompanyDetails,
                    items: finalItems,
                    orderSummary: {
                        total_amount: orderData.total_amount,
                        tax_amount: orderData.tax_amount,
                        shipping_amount: orderData.shipping_amount
                    }
                };

                // Save to DB (Upsert)
                // If invoice exists (legacy), update it. If not, insert new.
                const newInvoiceData = {
                    order_id: orderId,
                    invoice_number: invoiceData?.invoice_number || `INV-${orderData.id.slice(0, 8).toUpperCase()}`,
                    total_amount: orderData.total_amount,
                    tax_amount: orderData.tax_amount || 0,
                    snapshot_data: snapshot,
                    created_at: invoiceData?.created_at || new Date().toISOString()
                };

                const { data: savedInvoice, error: saveError } = await supabase
                    .from('invoices')
                    .upsert(newInvoiceData, { onConflict: 'order_id' })
                    .select()
                    .single();

                if (saveError) {
                    console.error("Error saving invoice snapshot:", saveError);
                } else {
                    setInvoice(savedInvoice);
                }
            }

        } catch (error) {
            console.error("Error loading invoice data:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-center text-gray-500 font-serif">Generating Invoice...</div>;

    if (!order) return (
        <div className="p-10 text-center">
            <h2 className="text-xl font-bold text-red-600">Order Not Found</h2>
        </div>
    );

    // Fallback values if invoice record doesn't exist
    const invoiceNumber = invoice?.invoice_number || `INV-${order.id.slice(0, 8).toUpperCase()}`;
    const invoiceDate = invoice?.created_at || order.created_at;
    const totalAmount = invoice?.total_amount || order.total_amount;
    const taxAmount = invoice?.tax_amount || order.tax_amount || 0;

    return (
        <div className="min-h-screen bg-gray-100 py-10 print:bg-white print:py-0">
            <style>{`
                @page { 
                    size: A4 portrait; 
                    margin: 8mm;
                }
                @media print { 
                    body { 
                        -webkit-print-color-adjust: exact;
                        margin: 0;
                        padding: 0;
                    }
                    .print-container { 
                        width: 100% !important;
                        max-width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                    }
                    @page { margin: 8mm; }
                    @page :first { margin-top: 8mm; }
                }
            `}</style>
            <div className="max-w-[210mm] mx-auto bg-white shadow-lg p-8 print:shadow-none print:p-0 print:max-w-none print-container">

                {/* Print/Download Actions */}
                <div className="flex justify-end mb-5 gap-5 print:hidden">
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded-lg hover:bg-stone-800 transition-colors shadow-sm font-medium text-sm"
                    >
                        <Printer className="w-4 h-4" /> Print / Save PDF
                    </button>
                </div>

                {/* Invoice Header */}
                <header className="flex justify-between items-start border-b-2 border-emerald-900 pb-5 mb-5">
                    <div>
                        {/* Logo / Brand Name */}
                        <div className="flex items-center gap-3 mb-3">
                            <img src={logo} alt="Vedmeet Organics" className="h-10 w-auto object-contain" onError={(e) => e.target.style.display = 'none'} />
                            <h1 className="text-xl font-serif font-bold text-emerald-900 tracking-wide hidden md:block">VEDMEET ORGANICS</h1>
                        </div>
                        <div className="text-sm text-gray-600 leading-normal font-sans">
                            <p className="font-bold text-gray-800">{companyDetails.name}</p>
                            <p>{companyDetails.address1}</p>
                            <p>{companyDetails.address2}</p>
                            <p>GSTIN: {companyDetails.gstin}</p>
                            <p>{companyDetails.contact}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-3xl font-bold text-stone-200 tracking-widest mb-2">INVOICE</h2>
                        <dl className="text-sm">
                            <div className="flex justify-end gap-3 mb-1">
                                <dt className="font-bold text-gray-500 uppercase tracking-wider">Invoice No</dt>
                                <dd className="font-mono font-bold text-gray-900">{invoiceNumber}</dd>
                            </div>
                            <div className="flex justify-end gap-3 mb-1">
                                <dt className="font-bold text-gray-500 uppercase tracking-wider">Date</dt>
                                <dd className="font-medium text-gray-900">{new Date(invoiceDate).toLocaleDateString()}</dd>
                            </div>
                            <div className="flex justify-end gap-3">
                                <dt className="font-bold text-gray-500 uppercase tracking-wider">Order ID</dt>
                                <dd className="font-mono text-gray-600">#{order.id.slice(0, 8)}</dd>
                            </div>
                        </dl>
                    </div>
                </header>

                {/* Address Section - Two Columns */}
                <div className="grid grid-cols-2 gap-5 mb-4">
                    <div>
                        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 border-b border-gray-100 pb-1">Bill To</h3>
                        <p className="font-bold text-gray-900 text-sm mb-1">{order.first_name} {order.last_name}</p>
                        <div className="text-xs text-gray-600 leading-normal">
                            <p>{order.address}, {order.city}</p>
                            <p>{order.state} - {order.zip}</p>
                            <p>Ph: {order.phone}</p>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 border-b border-gray-100 pb-1">Ship To</h3>
                        <p className="font-bold text-gray-900 text-sm mb-1">{order.first_name} {order.last_name}</p>
                        <div className="text-xs text-gray-600 leading-normal">
                            <p>{order.address}, {order.city}</p>
                            <p>{order.state} - {order.zip}</p>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="mb-4">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-stone-50 border-b-2 border-stone-200">
                                <th className="py-2 px-2 text-left text-xs font-bold text-stone-500 uppercase">#</th>
                                <th className="py-2 px-2 text-left text-xs font-bold text-stone-500 uppercase">Item Description</th>
                                <th className="py-2 px-2 text-left text-xs font-bold text-stone-500 uppercase">HSN</th>
                                <th className="py-2 px-2 text-right text-xs font-bold text-stone-500 uppercase">Qty</th>
                                <th className="py-2 px-2 text-right text-xs font-bold text-stone-500 uppercase">Rate</th>
                                <th className="py-2 px-2 text-right text-xs font-bold text-stone-500 uppercase">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.map((item, idx) => (
                                <tr key={item.id}>
                                    <td className="py-2 px-2 text-xs text-gray-400 font-mono">{idx + 1}</td>
                                    <td className="py-2 px-2 text-sm text-gray-900">
                                        <p className="font-bold line-clamp-1">{item.product?.name}</p>
                                    </td>
                                    <td className="py-2 px-2 text-xs text-gray-500 font-mono">{item.product?.hsn_code || '3304'}</td>
                                    <td className="py-2 px-2 text-xs text-gray-900 text-right font-medium">{item.quantity}</td>
                                    <td className="py-2 px-2 text-xs text-gray-900 text-right">₹{item.price.toFixed(2)}</td>
                                    <td className="py-2 px-2 text-sm text-gray-900 text-right font-bold">₹{(item.price * item.quantity).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Summaries - Compact */}
                <div className="flex justify-between items-start gap-6">
                    <div className="w-1/2">
                        <div className="text-[10px] leading-normal text-stone-500">
                            <p className="font-bold text-stone-700 mb-1">Terms & Conditions</p>
                            <p>1. Goods once sold will not be taken back.</p>
                            <p>2. Interest @ 18% p.a. if not paid on due date.</p>
                        </div>
                    </div>

                    <div className="w-1/2">
                        <div className="space-y-1 text-xs">
                            <div className="flex justify-between text-stone-600">
                                <span>Sub Total</span>
                                <span className="font-medium">₹{items.reduce((sum, i) => sum + (i.price * i.quantity), 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-stone-600">
                                <span>Tax (GST)</span>
                                <span className="font-medium">₹{taxAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-stone-600">
                                <span>Shipping</span>
                                <span className="font-medium">₹{(order.shipping_amount || 0).toFixed(2)}</span>
                            </div>
                            <div className="border-t-2 border-stone-200 pt-2 flex justify-between items-center mt-2">
                                <span className="font-bold text-stone-900 text-sm">Grand Total</span>
                                <span className="font-bold text-emerald-700 text-base">₹{totalAmount.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Authorized Signatory - Minimal */}
                        <div className="mt-4 text-center">
                            <div className="h-8 flex items-end justify-center">
                                <span className="font-script text-base text-stone-400">Authorized Signatory</span>
                            </div>
                            <div className="border-t border-stone-300 pt-1 text-[10px] font-medium text-stone-500 uppercase">
                                For Vedmeet Organics
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer - Minimal */}
                <footer className="mt-4 pt-3 border-t border-stone-100 text-center text-[10px] text-stone-400">
                    <p>Computer generated invoice. E. & O.E.</p>
                </footer>
            </div>
        </div>
    );
};

export default Invoice;
