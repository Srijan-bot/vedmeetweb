import React, { useState } from 'react';
import { Settings, Save, Lock, Bell, Percent, Building } from 'lucide-react';

const InventorySettings = () => {
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-slate-500 rounded-sm"></div>
                    <h1 className="text-2xl font-bold text-sage-900">Settings</h1>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
                    <Save className="w-4 h-4" />
                    Save Changes
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* General Settings */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-sage-200">
                    <h3 className="text-lg font-semibold text-sage-900 mb-4 flex items-center gap-2">
                        <Building className="w-5 h-5 text-blue-500" />
                        General Configuration
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-stone-500 mb-1">Default Warehouse</label>
                            <select className="w-full bg-white border border-sage-200 rounded-lg p-2 text-sage-900 focus:outline-none focus:border-sage-400">
                                <option>Main Warehouse (Mumbai)</option>
                                <option>Delhi Hub</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-stone-500 mb-1">Currency</label>
                            <select className="w-full bg-white border border-sage-200 rounded-lg p-2 text-sage-900 focus:outline-none focus:border-sage-400">
                                <option>INR (₹)</option>
                                <option>USD ($)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Tax Rules */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-sage-200">
                    <h3 className="text-lg font-semibold text-sage-900 mb-4 flex items-center gap-2">
                        <Percent className="w-5 h-5 text-emerald-500" />
                        Tax & GST
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-stone-500 mb-1">Default GST Slab</label>
                            <select className="w-full bg-white border border-sage-200 rounded-lg p-2 text-sage-900 focus:outline-none focus:border-sage-400">
                                <option>18%</option>
                                <option>12%</option>
                                <option>5%</option>
                                <option>0%</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-3 mt-4">
                            <input type="checkbox" className="w-4 h-4 rounded bg-white border-sage-300 text-blue-600 focus:ring-blue-500" checked onChange={() => { }} />
                            <span className="text-sm text-sage-700">Prices Inclusive of Tax</span>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-sage-200">
                    <h3 className="text-lg font-semibold text-sage-900 mb-4 flex items-center gap-2">
                        <Bell className="w-5 h-5 text-orange-500" />
                        Alerts
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-stone-500 mb-1">Low Stock Threshold (Global)</label>
                            <input type="number" className="w-full bg-white border border-sage-200 rounded-lg p-2 text-sage-900 focus:outline-none focus:border-sage-400" defaultValue="10" />
                        </div>
                        <div className="flex items-center gap-3 mt-4">
                            <input type="checkbox" className="w-4 h-4 rounded bg-white border-sage-300 text-blue-600 focus:ring-blue-500" checked onChange={() => { }} />
                            <span className="text-sm text-sage-700">Email Alerts for Low Stock</span>
                        </div>
                    </div>
                </div>

                {/* User Roles */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-sage-200 md:col-span-2">
                    <h3 className="text-lg font-semibold text-sage-900 mb-4 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-red-500" />
                        Access Control
                    </h3>
                    <p className="text-sm text-stone-500 mb-4">Manage who can edit stock quantities and view reports.</p>
                    <div className="bg-sage-50 p-4 rounded-lg text-center text-sage-500 border border-sage-200 border-dashed">
                        User Role Management Module (Coming Soon)
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventorySettings;
