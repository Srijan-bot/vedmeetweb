import React, { useEffect, useState } from 'react';
import { getSiteSettings, updateSiteSetting } from '../../lib/data';
import Button from '../../components/Button';

const SettingsManager = () => {
    const [settings, setSettings] = useState({
        hero_image: '',
        hero_title: '',
        hero_subtitle: ''
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
