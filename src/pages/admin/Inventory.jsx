import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Trash, RefreshCw, ChevronDown, Check, X, FileText } from 'lucide-react';
import { getAllVariants, getWarehouses, getCategories, getBrands, getSetting } from '../../lib/data';
import { supabase } from '../../lib/supabase';
import StockAdjustmentModal from '../../components/Inventory/StockAdjustmentModal';
import BatchInwardModal from '../../components/Inventory/BatchInwardModal';
import StockTransferModal from '../../components/Inventory/StockTransferModal';
import VariantEditModal from '../../components/Inventory/VariantEditModal';
import BatchList from '../../components/Inventory/BatchList';
import InventoryAlertsModal from '../../components/Inventory/InventoryAlertsModal';
import { deleteVariant } from '../../lib/data';
import { Edit2, MoreVertical, ArrowLeftRight } from 'lucide-react';

const Inventory = () => {
    const [variants, setVariants] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [batches, setBatches] = useState([]); // New state
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Filter States
    const [filterCategory, setFilterCategory] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterBrand, setFilterBrand] = useState('');
    const [filterExpiry, setFilterExpiry] = useState('');

    // Modal States
    const [isAdjustOpen, setIsAdjustOpen] = useState(false);
    const [isBatchInwardOpen, setIsBatchInwardOpen] = useState(false);
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);

    // Alert Modal State
    const [isAlertsOpen, setIsAlertsOpen] = useState(false);
    const [alertStats, setAlertStats] = useState({ lowStock: [], expiring: [] });

    // UI States
    const [expandedVariantId, setExpandedVariantId] = useState(null);
    const [editingVariant, setEditingVariant] = useState(null);

    // Advanced Features
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [enableAudit, setEnableAudit] = useState(false);

    useEffect(() => {
        loadData();
        loadSettings();
    }, []);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterCategory, filterStatus, filterBrand, filterExpiry]);

    // Calculate Alerts when data changes
    useEffect(() => {
        if (!variants.length && !batches.length) return;

        const lowStock = variants.filter(v => {
            const stock = parseInt(v.stock_quantity || 0);
            const min = parseInt(v.min_stock_level) || 10;
            return stock <= min;
        });

        const today = new Date();
        const ninetyDays = new Date();
        ninetyDays.setDate(today.getDate() + 90);

        const expiring = batches.filter(b => {
            const expiry = new Date(b.expiry_date);
            return expiry < ninetyDays && b.current_quantity > 0;
        });

        setAlertStats({ lowStock, expiring });
    }, [variants, batches]);

    const loadSettings = async () => {
        const gen = await getSetting('general_config');
        if (gen) {
            setShowAdvanced(gen.show_advanced);
            setEnableAudit(gen.enable_audit);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const vData = await getAllVariants();
            setVariants(vData || []);

            const cData = await getCategories();
            setCategories(cData || []);

            const bData = await getBrands();
            setBrands(bData || []);

            // Fetch all active batches for analytics
            const { data: batchData } = await supabase.from('product_batches')
                .select('batch_number, variant_id, current_quantity, expiry_date')
                .gt('current_quantity', 0);
            setBatches(batchData || []);
        } catch (error) {
            console.error("Failed to load inventory:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditVariant = (variant) => {
        setEditingVariant(variant);
        setIsEditOpen(true);
    };

    const handleDeleteVariant = async (id) => {
        if (window.confirm("Are you sure you want to delete this variant? This cannot be undone.")) {
            try {
                await deleteVariant(id);
                loadData(); // Refresh list
            } catch (error) {
                console.error("Delete failed:", error);
                alert("Failed to delete variant. Ensure it has no active stock or transactions.");
            }
        }
    };

    const handleExportCSV = () => {
        if (!variants.length) return;

        const headers = ["Product Name", "Variant Name", "SKU", "Category", "Brand", "Stock Quantity", "Price", "Cost Price", "Tax %"];
        const rows = filteredVariantsWithBrand.map(v => [
            v.products?.name || "",
            v.name || "",
            v.sku || "",
            Array.isArray(v.products?.category) ? v.products.category.join(", ") : v.products?.category || "",
            v.products?.brand || "",
            v.stock_quantity || 0,
            v.price || 0,
            v.cost_price || 0,
            v.gst_rate || 0
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `inventory_export_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getStatusColor = (qty) => {
        if (qty > 10) return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-500', label: 'In Stock' };
        if (qty > 0) return { bg: 'bg-orange-500/20', text: 'text-orange-400', dot: 'bg-orange-500', label: 'Low' };
        return { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-500', label: 'Critical' };
    };

    // Helper to normalize category/concern to array of strings
    const normalizeToArray = (value) => {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        // Handle Postgres array string format "{a,b}"
        if (typeof value === 'string') {
            if (value.startsWith('{') && value.endsWith('}')) {
                return value.slice(1, -1).split(',').map(s => s.trim().replace(/"/g, ''));
            }
            if (value.includes(',')) {
                return value.split(',').map(s => s.trim());
            }
            return [value];
        }
        return [];
    };

    const filteredVariants = variants.filter(v => {
        const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (v.products?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

        // Enhanced Category Matching
        const matchesCategory = (() => {
            if (!filterCategory) return true;
            const pCats = normalizeToArray(v.products?.category);
            // Match ID directly
            if (pCats.includes(filterCategory)) return true;
            // Match Name (find category by ID and check name)
            const cat = categories.find(c => c.id === filterCategory);
            // Check if product has the Category Name stored (legacy or fallback)
            if (cat && pCats.includes(cat.name)) return true;
            return false;
        })();

        const status = getStatusColor(v.stock_quantity);
        const matchesStatus = filterStatus ? status.label === filterStatus : true;

        return matchesSearch && matchesCategory && matchesStatus;
    });

    // Brand filtering note: logic added but data might be missing.
    // Ideally I'd use `v.products?.brand === filterBrand`. 
    // Let's include it in logic.
    const filteredVariantsWithBrand = filteredVariants.filter(v => {
        const brandMatch = filterBrand ? (v.products?.brand === filterBrand || v.products?.brand?.name === filterBrand) : true;

        // Expiry Filter
        if (!filterExpiry) return brandMatch;

        const vBatches = batches.filter(b => b.variant_id === v.id && b.current_quantity > 0);
        const now = new Date();
        const threeMonths = new Date(); threeMonths.setDate(now.getDate() + 90);

        if (filterExpiry === 'expired') {
            return brandMatch && vBatches.some(b => new Date(b.expiry_date) < now);
        } else if (filterExpiry === 'expiring_soon') {
            return brandMatch && vBatches.some(b => new Date(b.expiry_date) > now && new Date(b.expiry_date) < threeMonths);
        }

        return brandMatch;
    });

    return (
        <div className="space-y-8">
            {/* Header / Top Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-blue-500 rounded-sm"></div>
                    <h1 className="text-2xl font-bold text-sage-900">Inventory</h1>
                </div>

                <div className="flex items-center gap-4 text-stone-500">
                    {enableAudit && (
                        <a href="/inventory/movement" className="flex items-center gap-2 px-3 py-1.5 bg-white border border-sage-200 rounded-lg text-sage-600 hover:text-sage-900 shadow-sm transition-colors text-sm font-medium">
                            <FileText className="w-4 h-4" />
                            Audit Logs
                        </a>
                    )}
                    <button
                        onClick={() => setIsAlertsOpen(true)}
                        className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-sage-200 shadow-sm hover:bg-sage-50 transition-colors cursor-pointer"
                    >
                        <span className={`w-2 h-2 rounded-full ${alertStats.lowStock.length + alertStats.expiring.length > 0 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></span>
                        <span className="text-sm font-medium text-sage-700">
                            {alertStats.lowStock.length + alertStats.expiring.length > 0
                                ? `${alertStats.lowStock.length + alertStats.expiring.length} Alerts`
                                : 'No Alerts'}
                        </span>
                    </button>

                    <InventoryAlertsModal
                        isOpen={isAlertsOpen}
                        onClose={() => setIsAlertsOpen(false)}
                        lowStockVariants={alertStats.lowStock}
                        expiringBatches={alertStats.expiring}
                    />
                </div>
            </div>

            {/* Controls Bar */}
            <div className="bg-white p-4 rounded-xl border border-sage-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-4 py-2 bg-white hover:bg-sage-50 text-sage-700 rounded-lg text-sm border border-sage-200 shadow-sm min-w-[180px] focus:outline-none focus:ring-2 focus:ring-sage-500"
                    >
                        <option value="">Category: All Categories</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 bg-white hover:bg-sage-50 text-sage-700 rounded-lg text-sm border border-sage-200 shadow-sm min-w-[180px] focus:outline-none focus:ring-2 focus:ring-sage-500"
                    >
                        <option value="">Stock Status: All Status</option>
                        <option value="In Stock">In Stock</option>
                        <option value="Low">Low Stock</option>
                        <option value="Critical">Critical</option>
                    </select>

                    {/* Expiry Placeholder - Complex logic dependent on batches */}
                    <select
                        value={filterExpiry}
                        onChange={(e) => setFilterExpiry(e.target.value)}
                        className="px-4 py-2 bg-white hover:bg-sage-50 text-sage-700 rounded-lg text-sm border border-sage-200 shadow-sm min-w-[180px] focus:outline-none focus:ring-2 focus:ring-sage-500"
                    >
                        <option value="">Expiry: All Items</option>
                        <option value="expiring_soon">Expiring Soon (&lt; 90 days)</option>
                        <option value="expired">Expired</option>
                    </select>

                    <select
                        value={filterBrand}
                        onChange={(e) => setFilterBrand(e.target.value)}
                        className="px-4 py-2 bg-white hover:bg-sage-50 text-sage-700 rounded-lg text-sm border border-sage-200 shadow-sm min-w-[180px] focus:outline-none focus:ring-2 focus:ring-sage-500"
                    >
                        <option value="">Supplier: All Suppliers</option>
                        {brands.map(brand => (
                            <option key={brand.id} value={brand.name}>{brand.name}</option>
                        ))}
                    </select>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsBatchInwardOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-sage-50 text-sage-700 rounded-lg text-sm font-medium border border-sage-200 shadow-sm transition-colors">
                        <Plus className="w-4 h-4" />
                        Add Stock
                    </button>
                    <button onClick={() => setIsAdjustOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-sage-50 text-sage-700 rounded-lg text-sm font-medium border border-sage-200 shadow-sm transition-colors">
                        <RefreshCw className="w-4 h-4" />
                        Adjust Stock
                    </button>
                    <button onClick={() => setIsTransferOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-sage-50 text-sage-700 rounded-lg text-sm font-medium border border-sage-200 shadow-sm transition-colors">
                        <ArrowLeftRight className="w-4 h-4" />
                        Transfer Stock
                    </button>
                    <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium shadow-sm transition-colors">
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white rounded-xl border border-sage-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-sage-50 text-sage-500 text-xs uppercase font-semibold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Product Name</th>
                                <th className="px-6 py-4">SKU / Variant</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Current Stock</th>
                                <th className="px-6 py-4">Batch Count</th>
                                <th className="px-6 py-4">Expiry Risk</th>
                                {showAdvanced && <th className="px-6 py-4 bg-purple-50 text-purple-700 border-b-2 border-purple-200">Active Batches</th>}
                                <th className="px-6 py-4">GST %</th>
                                <th className="px-6 py-4">Price</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-sage-100">
                            {loading ? (
                                <tr><td colSpan="9" className="p-8 text-center text-stone-500">Loading inventory...</td></tr>
                            ) : (() => {
                                // 1. Group variants by Product
                                const productGroups = filteredVariantsWithBrand.reduce((acc, variant) => {
                                    const prodId = variant.product_id || 'unknown';
                                    if (!acc[prodId]) {
                                        acc[prodId] = {
                                            product: variant.products || { name: 'Unknown Product', id: 'unknown' },
                                            variants: []
                                        };
                                    }
                                    acc[prodId].variants.push(variant);
                                    return acc;
                                }, {});

                                // 2. Sort Groups and Variants
                                const sortedGroups = Object.values(productGroups)
                                    .sort((a, b) => (a.product.name || '').localeCompare(b.product.name || ''));

                                sortedGroups.forEach(group => {
                                    group.variants.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
                                });

                                // 3. Pagination Logic
                                const totalItems = sortedGroups.length;
                                const itemsPerPage = 10;
                                const totalPages = Math.ceil(totalItems / itemsPerPage);

                                // Ensure currentPage is valid (reset if filter reduces count)
                                if (currentPage > totalPages && totalPages > 0) setCurrentPage(1);

                                const startIndex = (currentPage - 1) * itemsPerPage;
                                const endIndex = startIndex + itemsPerPage;
                                const currentGroups = sortedGroups.slice(startIndex, endIndex);

                                return (
                                    <>
                                        {currentGroups.map((group) => {
                                            const { product, variants } = group;

                                            // Calculate Parent Stats
                                            const totalStock = variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);
                                            const totalBatches = variants.reduce((sum, v) => {
                                                const vBatches = batches.filter(b => b.variant_id === v.id && b.current_quantity > 0);
                                                return sum + vBatches.length;
                                            }, 0);

                                            // Price Range
                                            const prices = variants.map(v => v.price).filter(p => !isNaN(p));
                                            const minPrice = Math.min(...prices);
                                            const maxPrice = Math.max(...prices);
                                            const priceDisplay = prices.length > 0
                                                ? (minPrice === maxPrice ? `₹${minPrice}` : `₹${maxPrice}`) // Changed to show max price if min and max are different
                                                : '-';

                                            // Aggregate Status
                                            const parentStatus = getStatusColor(totalStock);

                                            return (
                                                <React.Fragment key={`prod-${product.id || 'unknown'}`}>
                                                    {/* PARENT ROW */}
                                                    <tr className="bg-sage-50/80 hover:bg-sage-100 transition-colors border-l-4 border-l-sage-400">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded bg-sage-200 flex items-center justify-center text-xs font-bold text-sage-700">
                                                                    {(product.name || 'P')[0]}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-sage-900 text-base">{product.name || 'Unknown Product'}</span>
                                                                    <span className="text-xs text-sage-500">{variants.length} Variants</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-stone-400 font-mono">-</td>
                                                        <td className="px-6 py-4 text-sm text-sage-700 font-medium">
                                                            {(() => {
                                                                const pCats = normalizeToArray(product.category);
                                                                if (pCats.length === 0) return 'General';
                                                                return pCats.map(c => categories.find(cat => cat.id === c || cat.name === c)?.name || c).join(', ');
                                                            })()}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-sage-900 font-bold">{totalStock}</td>
                                                        <td className="px-6 py-4 text-sm text-stone-500">{totalBatches}</td>
                                                        <td className="px-6 py-4 text-sm text-stone-400">-</td>
                                                        {showAdvanced && <td className="px-6 py-4 text-sm text-stone-400">-</td>}
                                                        <td className="px-6 py-4 text-sm text-stone-500">{product.gst_rate || 18}%</td>
                                                        <td className="px-6 py-4 text-sm text-sage-700 font-mono">{priceDisplay}</td>
                                                        <td className="px-6 py-4">
                                                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full w-fit ${parentStatus.bg} border border-transparent`}>
                                                                <span className={`w-2 h-2 rounded-full ${parentStatus.dot}`}></span>
                                                                <span className={`text-xs font-medium ${parentStatus.text}`}>{parentStatus.label}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4"></td> {/* Parent row actions placeholder */}
                                                    </tr>

                                                    {/* CHILD VARIANTS */}
                                                    {variants.map((variant, index) => {
                                                        const status = getStatusColor(variant.stock_quantity);

                                                        // Calculate Batch Stats
                                                        const variantBatches = batches.filter(b => b.variant_id === variant.id && b.current_quantity > 0);
                                                        const batchCount = variantBatches.length;

                                                        // Expiry Risk Logic
                                                        let expiryRisk = { label: 'Safe', color: 'text-emerald-500 bg-emerald-50' };
                                                        const now = new Date();
                                                        const threeMonths = new Date(); threeMonths.setMonth(now.getMonth() + 3);
                                                        const sixMonths = new Date(); sixMonths.setMonth(now.getMonth() + 6);
                                                        const hasExpired = variantBatches.some(b => new Date(b.expiry_date) < now);
                                                        const hasCritical = variantBatches.some(b => new Date(b.expiry_date) < threeMonths);
                                                        const hasWarning = variantBatches.some(b => new Date(b.expiry_date) < sixMonths);

                                                        if (hasExpired) expiryRisk = { label: 'Expired', color: 'text-red-700 bg-red-100 font-bold' };
                                                        else if (hasCritical) expiryRisk = { label: '< 3 Months', color: 'text-red-600 bg-red-50' };
                                                        else if (hasWarning) expiryRisk = { label: '3-6 Months', color: 'text-orange-600 bg-orange-50' };
                                                        else if (batchCount > 0) expiryRisk = { label: '> 6 Months', color: 'text-emerald-600 bg-emerald-50' };
                                                        else expiryRisk = { label: 'N/A', color: 'text-gray-400' };

                                                        const isLast = index === variants.length - 1;

                                                        return (
                                                            <React.Fragment key={variant.id}>
                                                                <tr className={`hover:bg-sage-50 transition-colors group ${!isLast ? 'border-b border-sage-50' : ''}`}>
                                                                    <td className="px-6 py-3 pl-12 relative">
                                                                        <div className="absolute left-6 top-0 bottom-1/2 w-4 border-l-2 border-sage-200"></div>
                                                                        <div className="absolute left-6 top-1/2 w-4 border-t-2 border-sage-200"></div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="w-1.5 h-1.5 bg-sage-300 rounded-full"></span>
                                                                            <span className="text-sm font-medium text-sage-700">{variant.name || 'Standard'}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-3 text-sm text-stone-500 font-mono">{variant.sku}</td>
                                                                    <td className="px-6 py-3 text-sm text-stone-400"></td>
                                                                    <td className="px-6 py-3 text-sm text-sage-600 font-medium">{variant.stock_quantity}</td>
                                                                    <td className="px-6 py-3 text-sm text-stone-500">{batchCount}</td>
                                                                    <td className="px-6 py-3 text-sm">
                                                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wide ${expiryRisk.color}`}>
                                                                            {expiryRisk.label}
                                                                        </span>
                                                                    </td>
                                                                    {showAdvanced && (
                                                                        <td className="px-6 py-3 text-xs text-purple-700 font-mono">
                                                                            {variantBatches.length > 0 ? variantBatches.map(b => b.batch_number).join(', ') : '-'}
                                                                        </td>
                                                                    )}
                                                                    <td className="px-6 py-3 text-sm text-stone-400"></td> {/* GST Placeholder - Using parent gst usually */}
                                                                    <td className="px-6 py-3 text-sm text-sage-700 font-mono">₹{variant.price}</td>
                                                                    <td className="px-6 py-3">
                                                                        <span className={`text-xs font-medium ${status.text}`}>{status.label}</span>
                                                                    </td>
                                                                    <td className="px-6 py-3">
                                                                        <div className="flex items-center gap-2">
                                                                            <button
                                                                                onClick={() => handleEditVariant(variant)}
                                                                                className="p-1.5 text-sage-500 hover:bg-sage-200 rounded transition-colors"
                                                                                title="Edit Details"
                                                                            >
                                                                                <Edit2 className="w-4 h-4" />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => setExpandedVariantId(expandedVariantId === variant.id ? null : variant.id)}
                                                                                className={`p-1.5 rounded transition-colors ${expandedVariantId === variant.id ? 'bg-blue-100 text-blue-600' : 'text-sage-500 hover:bg-sage-200'}`}
                                                                                title="View Batches"
                                                                            >
                                                                                <ChevronDown className={`w-4 h-4 transition-transform ${expandedVariantId === variant.id ? 'rotate-180' : ''}`} />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleDeleteVariant(variant.id)}
                                                                                className="p-1.5 text-red-500 hover:bg-red-100 rounded transition-colors"
                                                                                title="Delete Variant"
                                                                            >
                                                                                <Trash className="w-4 h-4" />
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                                {
                                                                    expandedVariantId === variant.id && (
                                                                        <tr>
                                                                            <td colSpan={showAdvanced ? 12 : 11} className="bg-sage-50 px-6 py-4">
                                                                                <BatchList variantId={variant.id} />
                                                                            </td>
                                                                        </tr>
                                                                    )
                                                                }
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </React.Fragment>
                                            );
                                        })}

                                        {/* Pagination Stats inside the map function to access totalItems */}
                                        <tr className="hidden"></tr>{/* Hidden row to avoid table errors if needed, but we'll render controls outside tbody */}
                                    </>
                                );
                            })()}
                        </tbody >
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="p-4 border-t border-sage-200 bg-sage-50 flex items-center justify-between text-sm text-stone-500">
                    {(() => {
                        const productsCount = new Set(filteredVariantsWithBrand.map(v => v.product_id)).size;
                        const itemsPerPage = 10;
                        const totalPages = Math.ceil(productsCount / itemsPerPage);
                        const start = (currentPage - 1) * itemsPerPage + 1;
                        const end = Math.min(currentPage * itemsPerPage, productsCount);

                        return (
                            <>
                                <div>Showing {productsCount > 0 ? start : 0} to {end} of {productsCount} Products</div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 bg-white hover:bg-sage-100 disabled:opacity-50 border border-sage-200 rounded text-sage-600 transition-colors"
                                    >
                                        Previous
                                    </button>

                                    {/* Simple Pagination Numbers - showing current and maybe +/- 1 */}
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) pageNum = i + 1;
                                        else if (currentPage <= 3) pageNum = i + 1;
                                        else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                        else pageNum = currentPage - 2 + i;

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`px-3 py-1 border rounded transition-colors ${currentPage === pageNum
                                                    ? 'bg-blue-600 hover:bg-blue-500 border-blue-600 text-white'
                                                    : 'bg-white hover:bg-sage-100 border-sage-200 text-sage-600'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}

                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        className="px-3 py-1 bg-white hover:bg-sage-100 disabled:opacity-50 border border-sage-200 rounded text-sage-600 transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            </>
                        );
                    })()}
                </div>
            </div>

            {/* Modals */}
            <StockAdjustmentModal
                isOpen={isAdjustOpen}
                onClose={() => setIsAdjustOpen(false)}
                onSuccess={loadData}
            />
            <BatchInwardModal
                isOpen={isBatchInwardOpen}
                onClose={() => setIsBatchInwardOpen(false)}
                onSuccess={loadData}
            />
            <StockTransferModal
                isOpen={isTransferOpen}
                onClose={() => setIsTransferOpen(false)}
                onSuccess={loadData}
            />
            <VariantEditModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                variant={editingVariant}
                onSuccess={loadData}
            />
        </div>
    );
};

export default Inventory;
