import React, { useEffect, useState } from 'react';
import { getSiteSettings, updateSiteSetting } from '../../lib/data';
import Button from '../../components/Button';

const SettingsManager = () => {
    const [settings, setSettings] = useState({
        hero_image: '',
        hero_title: '',
        hero_subtitle: '',
        company_name: '',
        company_address_line1: '',
        company_address_line2: '',
        company_gstin: '',
        company_contact: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        const data = await getSiteSettings();
        setSettings(prev => ({ ...prev, ...data }));
        setLoading(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Update each setting individually
            await updateSiteSetting('hero_image', settings.hero_image);
            await updateSiteSetting('hero_title', settings.hero_title);
            await updateSiteSetting('hero_subtitle', settings.hero_subtitle);

            // Invoice Settings
            await updateSiteSetting('company_name', settings.company_name);
            await updateSiteSetting('company_address_line1', settings.company_address_line1);
            await updateSiteSetting('company_address_line2', settings.company_address_line2);
            await updateSiteSetting('company_gstin', settings.company_gstin);
            await updateSiteSetting('company_contact', settings.company_contact);
            alert("Settings saved successfully!");
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="max-w-2xl">
            <h1 className="text-2xl font-bold text-sage-900 mb-6">Site Settings</h1>

            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-sage-100 space-y-8">

                <section>
                    <h2 className="text-lg font-serif font-bold text-sage-900 mb-4 pb-2 border-b border-sage-100">Hero Section</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Hero Image URL</label>
                            <input
                                type="text"
                                name="hero_image"
                                value={settings.hero_image}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                            />
                            {settings.hero_image && (
                                <div className="mt-2 text-xs text-stone-500">
                                    <p className="mb-1">Preview:</p>
                                    <img src={settings.hero_image} alt="Hero Preview" className="w-full h-32 object-cover rounded-md" onError={(e) => e.target.style.display = 'none'} />
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Hero Title</label>
                            <input
                                type="text"
                                name="hero_title"
                                value={settings.hero_title}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500 font-serif text-lg"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Hero Subtitle</label>
                            <textarea
                                name="hero_subtitle"
                                value={settings.hero_subtitle}
                                onChange={handleChange}
                                rows="2"
                                className="w-full px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                            />
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-lg font-serif font-bold text-sage-900 mb-4 pb-2 border-b border-sage-100">Invoice Settings</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Company Name</label>
                            <input
                                type="text"
                                name="company_name"
                                value={settings.company_name}
                                onChange={handleChange}
                                placeholder="e.g. Vedmeet Organics Pvt. Ltd."
                                className="w-full px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Address Line 1</label>
                                <input
                                    type="text"
                                    name="company_address_line1"
                                    value={settings.company_address_line1}
                                    onChange={handleChange}
                                    placeholder="e.g. Viswnath puram Colony"
                                    className="w-full px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Address Line 2</label>
                                <input
                                    type="text"
                                    name="company_address_line2"
                                    value={settings.company_address_line2}
                                    onChange={handleChange}
                                    placeholder="e.g. Varanasi, UP, 221106"
                                    className="w-full px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">GSTIN</label>
                                <input
                                    type="text"
                                    name="company_gstin"
                                    value={settings.company_gstin}
                                    onChange={handleChange}
                                    placeholder="e.g. 27AABCU9603R1Z2"
                                    className="w-full px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Contact Info</label>
                                <input
                                    type="text"
                                    name="company_contact"
                                    value={settings.company_contact}
                                    onChange={handleChange}
                                    placeholder="e.g. support@vedmeet.com | +91 ..."
                                    className="w-full px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-lg font-serif font-bold text-sage-900 mb-4 pb-2 border-b border-sage-100">Power User Mode</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium text-stone-900">Show Advanced Inventory</h3>
                                <p className="text-sm text-stone-500">Enable advanced columns (e.g. Batch IDs, Supplier Codes) in Inventory tables.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="show_advanced_inventory"
                                    checked={settings.show_advanced_inventory === 'true'}
                                    onChange={(e) => handleChange({ target: { name: 'show_advanced_inventory', value: e.target.checked ? 'true' : 'false' } })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sage-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sage-600"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium text-stone-900">Enable Audit Logs</h3>
                                <p className="text-sm text-stone-500">Log all inventory changes and administrative actions for compliance.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="enable_audit_logs"
                                    checked={settings.enable_audit_logs === 'true'}
                                    onChange={(e) => handleChange({ target: { name: 'enable_audit_logs', value: e.target.checked ? 'true' : 'false' } })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sage-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sage-600"></div>
                            </label>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-lg font-serif font-bold text-sage-900 mb-4 pb-2 border-b border-sage-100">System Status</h2>
                    <div className="flex items-center justify-between bg-stone-50 p-4 rounded-lg border border-stone-200">
                        <div>
                            <h3 className="font-medium text-stone-900">Maintenance Mode</h3>
                            <p className="text-sm text-stone-500">
                                {settings.maintenance_mode === 'true'
                                    ? "Website is currently paused. Only Admin, Inventory, and Order pages are accessible."
                                    : "Website is live and accessible to all users."}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {settings.maintenance_mode === 'true' ? (
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (confirm("Are you sure you want to resume the website?")) {
                                            setSaving(true);
                                            await updateSiteSetting('maintenance_mode', 'false');
                                            setSettings(prev => ({ ...prev, maintenance_mode: 'false' }));
                                            setSaving(false);
                                            alert("Website is now live.");
                                        }
                                    }}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                >
                                    Resume Website
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={async () => {
                                        const code = prompt("Enter Admin Code to PAUSE the website:");
                                        if (code === "5825") {
                                            setSaving(true);
                                            await updateSiteSetting('maintenance_mode', 'true');
                                            setSettings(prev => ({ ...prev, maintenance_mode: 'true' }));
                                            setSaving(false);
                                            alert("Website is now paused.");
                                        } else if (code !== null) {
                                            alert("Incorrect Code.");
                                        }
                                    }}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                                >
                                    Pause Website
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                <div className="pt-4">
                    <Button type="submit" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Settings'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default SettingsManager;
