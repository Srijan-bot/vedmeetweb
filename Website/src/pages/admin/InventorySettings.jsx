import React, { useState, useEffect } from 'react';
import { Settings, Save, Lock, Bell, Percent, Building, Plus, Edit2, Trash2, MapPin, X, ChevronLeft } from 'lucide-react';
import { getWarehouses, addWarehouse, updateWarehouse, deleteWarehouse, getSetting, saveSetting, deleteAllProducts } from '../../lib/data';
import LocationPicker from '../../components/LocationPicker';

const InventorySettings = () => {
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [currentWarehouse, setCurrentWarehouse] = useState({ name: '', location: '', address: '' });
    const [isEditing, setIsEditing] = useState(false);

    // Shipping Rates State
    const [shippingRates, setShippingRates] = useState([]);
    const [isEditingRates, setIsEditingRates] = useState(false);

    // Packaging State
    const [packagingBoxes, setPackagingBoxes] = useState([]);
    const [isEditingPackaging, setIsEditingPackaging] = useState(false);

    // General Config State
    const [currency, setCurrency] = useState('INR (₹)');

    // Tax Rules State
    const [defaultGst, setDefaultGst] = useState('18%');
    const [taxInclusive, setTaxInclusive] = useState(true);

    // Alerts State
    const [lowStockThreshold, setLowStockThreshold] = useState(10);
    const [emailAlerts, setEmailAlerts] = useState(true);

    // Default Rates to use if none in DB
    const defaultRates = [
        { slab: '≤50 g', dim: '≤10 × 8 × 4', weight: '0–50 g', local: 19, z1: 47, z2: 47, z3: 47, z4: 47, z5: 47 },
        { slab: '51–250 g', dim: '≤25 × 12 × 5', weight: '51–250 g', local: 24, z1: 59, z2: 63, z3: 68, z4: 72, z5: 77 },
        { slab: '251–500 g', dim: '≤25 × 20 × 5', weight: '251–500 g', local: 28, z1: 70, z2: 75, z3: 82, z4: 86, z5: 93 },
        { slab: '501–1000 g', dim: '≤30 × 20 × 8', weight: '0.5–1 kg', local: 38, z1: 85, z2: 95, z3: 110, z4: 120, z5: 135 },
        { slab: '1001–2000 g', dim: '≤40 × 25 × 10', weight: '1–2 kg', local: 50, z1: 110, z2: 125, z3: 150, z4: 170, z5: 190 },
        { slab: 'Each Extra 1 kg', dim: '+10 cm on longest side', weight: '+1000 g', local: 15, z1: 25, z2: 35, z3: 45, z4: 55, z5: 65 },
    ];

    const defaultPackaging = [
        { box_id: 1, name: 'Small', length_cm: 20, width_cm: 15, height_cm: 10, weight_g: 80 },
        { box_id: 2, name: 'Medium', length_cm: 30, width_cm: 20, height_cm: 15, weight_g: 150 },
        { box_id: 3, name: 'Large', length_cm: 40, width_cm: 30, height_cm: 20, weight_g: 300 },
    ];

    useEffect(() => {
        fetchWarehouses();
        fetchRates();
        fetchPackaging();
        fetchGeneralSettings();
    }, []);

    const fetchRates = async () => {
        const rates = await getSetting('shipping_rates');
        setShippingRates(rates || defaultRates);
    };

    const fetchPackaging = async () => {
        const boxes = await getSetting('packaging_boxes');
        setPackagingBoxes(boxes || defaultPackaging);
    };

    const handleRateChange = (index, field, value) => {
        const newRates = [...shippingRates];
        newRates[index] = { ...newRates[index], [field]: value };
        setShippingRates(newRates);
    };

    const handleSaveRates = async () => {
        try {
            await saveSetting('shipping_rates', shippingRates);
            setIsEditingRates(false);
            alert('Shipping rates saved!');
        } catch (error) {
            console.error("Error saving rates:", error);
            alert("Failed to save rates");
        }
    };

    const handlePackagingChange = (index, field, value) => {
        const newBoxes = [...packagingBoxes];
        newBoxes[index] = { ...newBoxes[index], [field]: value };
        setPackagingBoxes(newBoxes);
    };

    const handleSavePackaging = async () => {
        try {
            await saveSetting('packaging_boxes', packagingBoxes);
            setIsEditingPackaging(false);
            alert('Packaging settings saved!');
        } catch (error) {
            console.error("Error saving packaging:", error);
            alert("Failed to save packaging");
        }
    };

    const handleAddBox = () => {
        setPackagingBoxes(prev => [
            ...prev,
            { box_id: `box-${prev.length + 1}`, name: 'New Box', length_cm: 10, width_cm: 10, height_cm: 10, weight_g: 50 }
        ]);
        setIsEditingPackaging(true); // Auto-enter edit mode
    };

    const handleDeleteBox = (index) => {
        if (window.confirm("Delete this box?")) {
            const newBoxes = packagingBoxes.filter((_, i) => i !== index);
            setPackagingBoxes(newBoxes);
        }
    };

    // Advanced State
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [enableAudit, setEnableAudit] = useState(false);
    const [isDeletingAll, setIsDeletingAll] = useState(false);

    // ... (existing state)

    const fetchGeneralSettings = async () => {
        try {
            const gen = await getSetting('general_config');
            if (gen) {
                setCurrency(gen.currency || 'INR (₹)');
                setShowAdvanced(gen.show_advanced || false);
                setEnableAudit(gen.enable_audit || false);
            }

            const tax = await getSetting('tax_config');
            if (tax) {
                setDefaultGst(tax.default_gst || '18%');
                setTaxInclusive(tax.tax_inclusive !== false);
            }

            const alerts = await getSetting('alert_config');
            if (alerts) {
                setLowStockThreshold(alerts.low_stock_threshold || 10);
                setEmailAlerts(alerts.email_alerts !== false);
            }
        } catch (err) {
            console.error("Failed to fetch general settings", err);
        }
    };

    const handleSaveGeneral = async () => {
        try {
            await saveSetting('general_config', { currency, show_advanced: showAdvanced, enable_audit: enableAudit });
            alert('General settings saved');
        } catch (e) { alert('Failed to save general settings'); }
    };

    const handleSaveTax = async () => {
        try {
            await saveSetting('tax_config', { default_gst: defaultGst, tax_inclusive: taxInclusive });
            alert('Tax settings saved');
        } catch (e) { alert('Failed to save tax settings'); }
    };

    const handleSaveAlerts = async () => {
        try {
            await saveSetting('alert_config', { low_stock_threshold: lowStockThreshold, email_alerts: emailAlerts });
            alert('Alert settings saved');
        } catch (e) { alert('Failed to save alert settings'); }
    };

    const fetchWarehouses = async () => {
        setLoading(true);
        const data = await getWarehouses();
        setWarehouses(data || []);
        setLoading(false);
    };

    const handleOpenModal = (warehouse = null) => {
        if (warehouse) {
            setCurrentWarehouse(warehouse);
            setIsEditing(true);
        } else {
            setCurrentWarehouse({ name: '', location: '', address: '' });
            setIsEditing(false);
        }
        setIsPickerOpen(false);
        setIsModalOpen(true);
    };

    const handleAddressSelect = (addressData) => {
        setCurrentWarehouse(prev => ({
            ...prev,
            address: addressData.full_address,
            location: addressData.city || addressData.state || prev.location, // Auto-fill City/Location
            coordinates: addressData.coordinates ? `(${addressData.coordinates[0]},${addressData.coordinates[1]})` : null
        }));
        setIsPickerOpen(false);
    };

    const handleSaveWarehouse = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await updateWarehouse(currentWarehouse.id, currentWarehouse);
            } else {
                await addWarehouse(currentWarehouse);
            }
            setIsModalOpen(false);
            fetchWarehouses();
        } catch (error) {
            console.error("Error saving warehouse:", error);
            alert("Failed to save warehouse");
        }
    };

    const handleDeleteWarehouse = async (id) => {
        if (window.confirm("Are you sure you want to delete this warehouse?")) {
            try {
                await deleteWarehouse(id);
                fetchWarehouses();
            } catch (error) {
                console.error("Error deleting warehouse:", error);
                alert("Failed to delete warehouse");
            }
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-slate-500 rounded-sm"></div>
                    <h1 className="text-2xl font-bold text-sage-900">Settings</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Warehouse Management */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-sage-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-sage-900 flex items-center gap-2">
                            <Building className="w-5 h-5 text-blue-500" />
                            Warehouse Locations
                        </h3>
                        <button
                            onClick={() => handleOpenModal()}
                            className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-100 flex items-center gap-1"
                        >
                            <Plus className="w-4 h-4" /> Add Warehouse
                        </button>
                    </div>

                    {loading ? (
                        <p className="text-stone-500 text-sm">Loading warehouses...</p>
                    ) : (
                        <div className="space-y-3">
                            {warehouses.map((wh) => (
                                <div key={wh.id} className="flex justify-between items-start p-4 bg-slate-50 rounded-lg border border-sage-100">
                                    <div>
                                        <h4 className="font-medium text-sage-900">{wh.name}</h4>
                                        <p className="text-sm text-stone-500 flex items-center gap-1 mt-1">
                                            <MapPin className="w-3 h-3" /> {wh.location}
                                        </p>
                                        {wh.address && (
                                            <p className="text-xs text-stone-400 mt-1 ml-4">
                                                {wh.address}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleOpenModal(wh)}
                                            className="p-1.5 hover:bg-white rounded-md text-stone-500 hover:text-blue-500 transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteWarehouse(wh.id)}
                                            className="p-1.5 hover:bg-white rounded-md text-stone-500 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {warehouses.length === 0 && (
                                <p className="text-sm text-stone-400 text-center py-4">No warehouses added yet.</p>
                            )}
                        </div>
                    )}
                </div>

                {/* General Config (Currency etc) */}
                {/* General Config (Currency etc) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-sage-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-sage-900 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-gray-500" />
                            General
                        </h3>
                        <button onClick={handleSaveGeneral} className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded text-gray-700 font-medium">Save</button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-stone-500 mb-1">Currency</label>
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="w-full bg-white border border-sage-200 rounded-lg p-2 text-sage-900 focus:outline-none focus:border-sage-400"
                            >
                                <option>INR (₹)</option>
                                <option>USD ($)</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded bg-white border-sage-300 text-blue-600 focus:ring-blue-500"
                                checked={showAdvanced}
                                onChange={(e) => setShowAdvanced(e.target.checked)}
                            />
                            <div>
                                <span className="block text-sm font-medium text-sage-800">Show Advanced Inventory</span>
                                <span className="text-xs text-stone-500">Enable advanced columns (e.g. Batch IDs, Supplier Codes) in Inventory tables.</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded bg-white border-sage-300 text-blue-600 focus:ring-blue-500"
                                checked={enableAudit}
                                onChange={(e) => setEnableAudit(e.target.checked)}
                            />
                            <div>
                                <span className="block text-sm font-medium text-sage-800">Enable Audit Logs</span>
                                <span className="text-xs text-stone-500">Log all inventory changes and administrative actions for compliance.</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tax Rules */}
                {/* Tax Rules */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-sage-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-sage-900 flex items-center gap-2">
                            <Percent className="w-5 h-5 text-emerald-500" />
                            Tax & GST
                        </h3>
                        <button onClick={handleSaveTax} className="text-xs bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded text-emerald-700 font-medium">Save</button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-stone-500 mb-1">Default GST Slab</label>
                            <select
                                value={defaultGst}
                                onChange={(e) => setDefaultGst(e.target.value)}
                                className="w-full bg-white border border-sage-200 rounded-lg p-2 text-sage-900 focus:outline-none focus:border-sage-400"
                            >
                                <option>18%</option>
                                <option>12%</option>
                                <option>5%</option>
                                <option>0%</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-3 mt-4">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded bg-white border-sage-300 text-blue-600 focus:ring-blue-500"
                                checked={taxInclusive}
                                onChange={(e) => setTaxInclusive(e.target.checked)}
                            />
                            <span className="text-sm text-sage-700">Prices Inclusive of Tax</span>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                {/* Notifications */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-sage-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-sage-900 flex items-center gap-2">
                            <Bell className="w-5 h-5 text-orange-500" />
                            Alerts
                        </h3>
                        <button onClick={handleSaveAlerts} className="text-xs bg-orange-50 hover:bg-orange-100 px-3 py-1 rounded text-orange-700 font-medium">Save</button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-stone-500 mb-1">Low Stock Threshold</label>
                            <input
                                type="number"
                                className="w-full bg-white border border-sage-200 rounded-lg p-2 text-sage-900 focus:outline-none focus:border-sage-400"
                                value={lowStockThreshold}
                                onChange={(e) => setLowStockThreshold(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3 mt-4">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded bg-white border-sage-300 text-blue-600 focus:ring-blue-500"
                                checked={emailAlerts}
                                onChange={(e) => setEmailAlerts(e.target.checked)}
                            />
                            <span className="text-sm text-sage-700">Email Alerts</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 p-6 rounded-xl shadow-sm border border-red-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-red-700 flex items-center gap-2">
                        <Trash2 className="w-5 h-5" />
                        Danger Zone
                    </h3>
                </div>
                <div className="space-y-4">
                    <p className="text-sm text-red-600">
                        These actions are destructive and cannot be undone. Please be certain before proceeding.
                    </p>
                    <button
                        onClick={async () => {
                            if (window.confirm("CRITICAL WARNING: This will delete ALL products, variants, reviews, inventory history, and stock levels. Orders will remain but lose item details. Are you absolutely sure?")) {
                                if (window.confirm("Final Confirmation: Type 'DELETE' mentally and click OK to wipe the catalog.")) {
                                    setIsDeletingAll(true);
                                    try {
                                        await deleteAllProducts();
                                        alert("All products have been deleted successfully.");
                                        window.location.reload();
                                    } catch (e) {
                                        console.error(e);
                                        alert("Failed to delete all products: " + e.message);
                                    } finally {
                                        setIsDeletingAll(false);
                                    }
                                }
                            }
                        }}
                        disabled={isDeletingAll}
                        className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex justify-center gap-2"
                    >
                        {isDeletingAll ? 'Deleting Catalog...' : 'Delete All Products & Inventory'}
                    </button>
                </div>
            </div>



            <div className="bg-white p-6 rounded-xl shadow-sm border border-sage-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-sage-900 flex items-center gap-2">
                        <Building className="w-5 h-5 text-indigo-500" />
                        Shipping Rate Configuration
                    </h3>
                    <div className="flex gap-2">
                        {isEditingRates ? (
                            <>
                                <button onClick={() => setIsEditingRates(false)} className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 rounded-lg text-sm">Cancel</button>
                                <button onClick={handleSaveRates} className="px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded-lg text-sm flex items-center gap-1">
                                    <Save className="w-4 h-4" /> Save Rates
                                </button>
                            </>
                        ) : (
                            <button onClick={() => setIsEditingRates(true)} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-sm flex items-center gap-1">
                                <Edit2 className="w-4 h-4" /> Edit Rates
                            </button>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse border border-sage-200 rounded-lg">
                        <thead className="bg-sage-50 text-sage-700 font-semibold">
                            <tr>
                                <th className="border border-sage-200 p-3">Charge Slab</th>
                                <th className="border border-sage-200 p-3">Typical Box Dimensions</th>
                                <th className="border border-sage-200 p-3">Actual Weight Range</th>
                                <th className="border border-sage-200 p-3 text-right">Local</th>
                                <th className="border border-sage-200 p-3 text-right">≤200 km (Z1)</th>
                                <th className="border border-sage-200 p-3 text-right">201–500 km (Z2)</th>
                                <th className="border border-sage-200 p-3 text-right">501–1000 km (Z3)</th>
                                <th className="border border-sage-200 p-3 text-right">1001–2000 km (Z4)</th>
                                <th className="border border-sage-200 p-3 text-right">{'>'}2000 km (Z5)</th>
                            </tr>
                        </thead>
                        <tbody className="text-stone-700">
                            {shippingRates.map((row, idx) => (
                                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-sage-50/30'}>
                                    <td className="border border-sage-200 p-3 font-medium text-sage-900">
                                        {isEditingRates ? <input type="text" className="w-full bg-transparent border-b border-gray-300 focus:border-indigo-500 outline-none" value={row.slab} onChange={(e) => handleRateChange(idx, 'slab', e.target.value)} /> : row.slab}
                                    </td>
                                    <td className="border border-sage-200 p-3 text-stone-500 font-mono text-xs">
                                        {isEditingRates ? <input type="text" className="w-full bg-transparent border-b border-gray-300 focus:border-indigo-500 outline-none" value={row.dim} onChange={(e) => handleRateChange(idx, 'dim', e.target.value)} /> : row.dim}
                                    </td>
                                    <td className="border border-sage-200 p-3 text-stone-600">
                                        {isEditingRates ? <input type="text" className="w-full bg-transparent border-b border-gray-300 focus:border-indigo-500 outline-none" value={row.weight} onChange={(e) => handleRateChange(idx, 'weight', e.target.value)} /> : row.weight}
                                    </td>
                                    {/* Rates */}
                                    {['local', 'z1', 'z2', 'z3', 'z4', 'z5'].map(field => (
                                        <td key={field} className="border border-sage-200 p-3 text-right">
                                            {isEditingRates ? (
                                                <input
                                                    type="number"
                                                    className="w-16 text-right bg-transparent border-b border-gray-300 focus:border-indigo-500 outline-none"
                                                    value={row[field]}
                                                    onChange={(e) => handleRateChange(idx, field, e.target.value)}
                                                />
                                            ) : (
                                                `₹${row[field]}`
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Packaging Configuration */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-sage-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-sage-900 flex items-center gap-2">
                        <Building className="w-5 h-5 text-emerald-500" />
                        Packaging Configuration
                    </h3>
                    <div className="flex gap-2">
                        {isEditingPackaging ? (
                            <>
                                <button onClick={() => setIsEditingPackaging(false)} className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 rounded-lg text-sm">Cancel</button>
                                <button onClick={handleSavePackaging} className="px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded-lg text-sm flex items-center gap-1">
                                    <Save className="w-4 h-4" /> Save
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={handleAddBox} className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm flex items-center gap-1">
                                    <Plus className="w-4 h-4" /> Add Box
                                </button>
                                <button onClick={() => setIsEditingPackaging(true)} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-sm flex items-center gap-1">
                                    <Edit2 className="w-4 h-4" /> Edit Boxes
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse border border-sage-200 rounded-lg">
                        <thead className="bg-sage-50 text-sage-700 font-semibold">
                            <tr>
                                <th className="border border-sage-200 p-3">Box ID</th>
                                <th className="border border-sage-200 p-3">Name</th>
                                <th className="border border-sage-200 p-3 text-right">Length (cm)</th>
                                <th className="border border-sage-200 p-3 text-right">Width (cm)</th>
                                <th className="border border-sage-200 p-3 text-right">Height (cm)</th>
                                <th className="border border-sage-200 p-3 text-right">Weight (g)</th>
                                {isEditingPackaging && <th className="border border-sage-200 p-3 text-center">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="text-stone-700">
                            {packagingBoxes.map((box, idx) => (
                                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-sage-50/30'}>
                                    <td className="border border-sage-200 p-3 font-medium text-sage-900">
                                        {isEditingPackaging ? <input type="text" className="w-full bg-transparent border-b border-gray-300 focus:border-indigo-500 outline-none" value={box.box_id || box.id || `box-${idx + 1}`} onChange={(e) => handlePackagingChange(idx, 'box_id', e.target.value)} /> : (box.box_id || box.id || `box-${idx + 1}`)}
                                    </td>
                                    <td className="border border-sage-200 p-3">
                                        {isEditingPackaging ? <input type="text" className="w-full bg-transparent border-b border-gray-300 focus:border-indigo-500 outline-none" value={box.name} onChange={(e) => handlePackagingChange(idx, 'name', e.target.value)} /> : box.name}
                                    </td>
                                    <td className="border border-sage-200 p-3 text-right">
                                        {isEditingPackaging ? <input type="number" className="w-full text-right bg-transparent border-b border-gray-300 focus:border-indigo-500 outline-none" value={box.length_cm} onChange={(e) => handlePackagingChange(idx, 'length_cm', e.target.value)} /> : box.length_cm}
                                    </td>
                                    <td className="border border-sage-200 p-3 text-right">
                                        {isEditingPackaging ? <input type="number" className="w-full text-right bg-transparent border-b border-gray-300 focus:border-indigo-500 outline-none" value={box.width_cm} onChange={(e) => handlePackagingChange(idx, 'width_cm', e.target.value)} /> : box.width_cm}
                                    </td>
                                    <td className="border border-sage-200 p-3 text-right">
                                        {isEditingPackaging ? <input type="number" className="w-full text-right bg-transparent border-b border-gray-300 focus:border-indigo-500 outline-none" value={box.height_cm} onChange={(e) => handlePackagingChange(idx, 'height_cm', e.target.value)} /> : box.height_cm}
                                    </td>
                                    <td className="border border-sage-200 p-3 text-right">
                                        {isEditingPackaging ? <input type="number" className="w-full text-right bg-transparent border-b border-gray-300 focus:border-indigo-500 outline-none" value={box.weight_g} onChange={(e) => handlePackagingChange(idx, 'weight_g', e.target.value)} /> : box.weight_g}
                                    </td>
                                    {isEditingPackaging && (
                                        <td className="border border-sage-200 p-3 text-center">
                                            <button
                                                onClick={() => handleDeleteBox(idx)}
                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                                                title="Delete Box"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div >

            {/* Warehouse Modal */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className={`bg-white rounded-xl shadow-xl w-full ${isPickerOpen ? 'max-w-4xl h-[90vh]' : 'max-w-md'} transition-all duration-300 flex flex-col`}>
                            {isPickerOpen ? (
                                // --- MAP PICKER VIEW ---
                                <LocationPicker
                                    onSelectAddress={handleAddressSelect}
                                    onCancel={() => setIsPickerOpen(false)}
                                />
                            ) : (
                                // --- FORM VIEW ---
                                <div className="p-6 relative">
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="absolute top-4 right-4 text-stone-400 hover:text-stone-600"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                    <h3 className="text-lg font-bold text-sage-900 mb-4">
                                        {isEditing ? 'Edit Warehouse' : 'Add New Warehouse'}
                                    </h3>
                                    <form onSubmit={handleSaveWarehouse} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-stone-600 mb-1">Warehouse Name</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full border border-sage-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={currentWarehouse.name}
                                                onChange={e => setCurrentWarehouse({ ...currentWarehouse, name: e.target.value })}
                                                placeholder="e.g. Main Hub"
                                            />
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="block text-sm font-medium text-stone-600">Full Address</label>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsPickerOpen(true)}
                                                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                                >
                                                    <MapPin className="w-3 h-3" /> Pick on Map
                                                </button>
                                            </div>
                                            <textarea
                                                className="w-full border border-sage-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                                rows="3"
                                                value={currentWarehouse.address || ''}
                                                onChange={e => setCurrentWarehouse({ ...currentWarehouse, address: e.target.value })}
                                                placeholder="Enter address or select from map..."
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-stone-600 mb-1">Location (City/Area)</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full border border-sage-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={currentWarehouse.location}
                                                onChange={e => setCurrentWarehouse({ ...currentWarehouse, location: e.target.value })}
                                                placeholder="e.g. Mumbai (Auto-filled from map)"
                                            />
                                        </div>

                                        <div className="flex justify-end gap-3 mt-6">
                                            <button
                                                type="button"
                                                onClick={() => setIsModalOpen(false)}
                                                className="px-4 py-2 text-stone-600 hover:bg-stone-50 rounded-lg"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                            >
                                                {isEditing ? 'Update Warehouse' : 'Add Warehouse'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default InventorySettings;
