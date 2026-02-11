import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';

// Utility to load script for MapMyIndia v1 (Legacy)
const loadMapplsScript = (callback) => {
    const existingScript = document.getElementById('mappls-sdk-script');
    if (existingScript) {
        if (window.MapmyIndia && window.MapmyIndia.Map) {
            callback();
        } else {
            existingScript.addEventListener('load', callback);
        }
        return;
    }

    const script = document.createElement('script');
    script.id = 'mappls-sdk-script';
    // Legacy v1 URL
    script.src = `https://apis.mapmyindia.com/advancedmaps/v1/${import.meta.env.VITE_MAPPLS_KEY}/map_load?v=1.5`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
        console.log("MapMyIndia v1 script loaded");
        callback();
    };
    script.onerror = (e) => {
        console.error("MapMyIndia script failed to load. Check API Key and Domain Whitelist.", e);
        alert("Map failed to load. Please check if your API Key is allowed for localhost in Mappls Dashboard.");
    };
    document.head.appendChild(script);
};

const CompleteProfile = () => {
    const { user, profile, updateProfile, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress] = useState('');
    const [position, setPosition] = useState({ lat: 28.6139, lng: 77.2090 });
    const [error, setError] = useState(null);

    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
            return;
        }

        if (profile) {
            if (profile.full_name) setFullName(profile.full_name);
            if (profile.phone_number) setPhoneNumber(profile.phone_number);
            if (profile.address) setAddress(profile.address);
            if (profile.latitude && profile.longitude) {
                setPosition({ lat: profile.latitude, lng: profile.longitude });
            }
        }
    }, [user, profile, authLoading, navigate]);

    // Initialize Map via Script Tag
    useEffect(() => {
        if (mapInstanceRef.current) return;

        const key = import.meta.env.VITE_MAPPLS_KEY;
        if (!key || key.includes('YOUR_MAPPLS')) {
            setError("Mappls API Key missing.");
            return;
        }

        loadMapplsScript(() => {
            // Check for v1 global object
            if (window.MapmyIndia && window.MapmyIndia.Map) {
                try {
                    const mapElement = document.getElementById('map');
                    if (!mapElement) return;

                    console.log("Initializing MapMyIndia v1 map");
                    const map = new window.MapmyIndia.Map(mapElement, {
                        center: [position.lat, position.lng],
                        zoomControl: true,
                        hybrid: true
                    });
                    mapInstanceRef.current = map;

                    // v1 Marker using Leaflet syntax (L is usually global with v1)
                    // If L is missing, we might need to load Leaflet separate, but v1 usually bundles it.
                    if (typeof L !== 'undefined') {
                        const marker = L.marker([position.lat, position.lng], {
                            draggable: true
                        }).addTo(map);
                        markerRef.current = marker;

                        marker.on('dragend', (e) => {
                            const pos = marker.getLatLng();
                            setPosition({ lat: pos.lat, lng: pos.lng });
                        });

                        map.on('click', (e) => {
                            if (e.latlng) {
                                marker.setLatLng(e.latlng);
                                setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
                            }
                        });
                    } else {
                        console.error("Leaflet (L) not found. MapMyIndia v1 requires Leaflet.");
                        setError("Map resources incomplete.");
                    }

                } catch (err) {
                    console.error("Map init error:", err);
                    setError("Map Error: " + err.message);
                }
            } else {
                console.error("MapMyIndia SDK not found");
                setError("Map SDK failed to load.");
            }
        });
    }, []); // Run once on mount

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-cream">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-600"></div>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const updates = {
            full_name: fullName,
            phone_number: phoneNumber,
            address: address,
            latitude: position.lat,
            longitude: position.lng,
        };

        const { error } = await updateProfile(updates);

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen bg-cream py-12 px-4">
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-sage-100">
                <div className="bg-sage-600 p-6 text-center">
                    <h1 className="text-2xl font-serif font-bold text-white mb-2">Complete Your Profile</h1>
                    <p className="text-sage-100">Please provide your details to continue</p>
                </div>

                <div className="p-8">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full px-4 py-2 border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="w-full px-4 py-2 border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Address</label>
                            <textarea
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-2 border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500"
                                placeholder="Street address, Apt, etc."
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">Pin Location (MapMyIndia)</label>
                            <div className="h-[300px] w-full rounded-lg overflow-hidden border border-sage-200 z-0 relative">
                                {!import.meta.env.VITE_MAPPLS_KEY || import.meta.env.VITE_MAPPLS_KEY.includes('YOUR_MAPPLS') ? (
                                    <div className="bg-gray-100 h-full w-full flex items-center justify-center text-gray-500 p-4 text-center">
                                        Mappls API Key missing or invalid.
                                    </div>
                                ) : (
                                    <div id="map" style={{ width: '100%', height: '100%' }}></div>
                                )}
                            </div>
                            <p className="text-xs text-stone-500 mt-1">Click on the map or drag the marker to pin your location.</p>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? 'Saving Profile...' : 'Save & Continue'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CompleteProfile;
