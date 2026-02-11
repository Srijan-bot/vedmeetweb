import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2, Navigation } from 'lucide-react';
import Button from './Button';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAPTILER_API_KEY = "osH9Q7Saaeut7cJoayPE";

const LocationPicker = ({ onSelectAddress, onCancel }) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const marker = useRef(null);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [debounceTimer, setDebounceTimer] = useState(null);

    // Initial center (India generic or specific if user prompts)
    const [viewState, setViewState] = useState({
        lng: 78.9629,
        lat: 20.5937,
        zoom: 4
    });

    useEffect(() => {
        if (map.current) return;

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_API_KEY}`,
            center: [viewState.lng, viewState.lat],
            zoom: viewState.zoom,
            attributionControl: false
        });

        map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

        map.current.on('load', () => {
            setMapLoaded(true);
        });

        map.current.on('moveend', async () => {
            if (!map.current) return;
            const center = map.current.getCenter();
            await reverseGeocode(center.lng, center.lat);
        });

    }, []);

    const reverseGeocode = async (lng, lat) => {
        setLoading(true);
        try {
            const response = await fetch(
                `https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${MAPTILER_API_KEY}`
            );
            const data = await response.json();
            if (data.features && data.features.length > 0) {
                const feature = data.features[0];
                const addressData = parseFeature(feature);

                // Override with exact coordinates from the map center (user's pin),
                // not the snapped coordinate from the geocoding result.
                addressData.coordinates = [lng, lat];

                setSelectedAddress(addressData);
                setQuery(addressData.full_address);
            }
        } catch (error) {
            console.error("Reverse Geocoding error:", error);
        } finally {
            setLoading(false);
        }
    };

    const searchAddress = async (searchQuery) => {
        if (!searchQuery || searchQuery.length < 3) return;

        setLoading(true);
        try {
            const response = await fetch(
                `https://api.maptiler.com/geocoding/${encodeURIComponent(searchQuery)}.json?key=${MAPTILER_API_KEY}&bbox=68.1,6.5,97.4,35.5` // Bbox for India roughly
            );
            const data = await response.json();
            setResults(data.features || []);
        } catch (error) {
            console.error("MapTiler search error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);
        if (value.length > 2) {
            if (debounceTimer) clearTimeout(debounceTimer);
            setDebounceTimer(setTimeout(() => searchAddress(value), 500));
        } else {
            setResults([]);
        }
    };

    const handleResultSelect = (feature) => {
        const addressData = parseFeature(feature);
        setSelectedAddress(addressData);
        setQuery(addressData.full_address);
        setResults([]);

        // Fly to location
        if (map.current) {
            map.current.flyTo({
                center: feature.center,
                zoom: 16
            });
        }
    };

    const parseFeature = (feature) => {
        const context = feature.context || [];
        const findContext = (idPrefix) => context.find(c => c.id.startsWith(idPrefix))?.text || '';

        // Better fallback logic for formatted address
        let formatted = feature.place_name;

        return {
            full_address: formatted,
            street: feature.text,
            city: findContext('place') || findContext('municipality') || '',
            state: findContext('region') || findContext('province') || '',
            zip_code: findContext('postal_code') || '',
            country: findContext('country') || '',
            coordinates: feature.center
        };
    };

    const handleConfirm = () => {
        if (selectedAddress) {
            onSelectAddress(selectedAddress);
        }
    };

    const getCurrentLocation = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(position => {
                const { longitude, latitude } = position.coords;
                if (map.current) {
                    map.current.flyTo({ center: [longitude, latitude], zoom: 16 });
                }
            });
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-sage-100 w-full max-w-4xl mx-auto overflow-hidden flex flex-col h-[80vh]">
            {/* Header */}
            <div className="p-4 border-b border-sage-100 flex justify-between items-center bg-white z-10 relative">
                <h3 className="font-serif font-bold text-xl text-sage-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-saffron-500" />
                    Select Delivery Location
                </h3>
                <Button variant="ghost" onClick={onCancel}>Close</Button>
            </div>

            {/* Map Container */}
            <div className="flex-1 relative">
                <div ref={mapContainer} className="w-full h-full" />

                {/* Center Marker Fixed */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 mb-8">
                    <MapPin className="w-10 h-10 text-saffron-600 drop-shadow-lg fill-current pb-2" />
                </div>

                {/* Search Bar Overlay */}
                <div className="absolute top-4 left-4 right-4 z-20 max-w-md">
                    <div className="relative shadow-lg rounded-xl">
                        <input
                            type="text"
                            value={query}
                            onChange={handleInputChange}
                            placeholder="Search your area..."
                            className="w-full pl-10 pr-10 py-3 bg-white border border-sage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-400"
                            autoFocus={false}
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                        </div>
                        {query && !loading && (
                            <button
                                onClick={() => { setQuery(''); setResults([]); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                            >
                                x
                            </button>
                        )}
                    </div>

                    {/* Autocomplete Results */}
                    {results.length > 0 && (
                        <div className="mt-2 bg-white rounded-xl shadow-lg border border-sage-100 max-h-60 overflow-y-auto custom-scrollbar">
                            {results.map((feature) => (
                                <button
                                    key={feature.id}
                                    onClick={() => handleResultSelect(feature)}
                                    className="w-full text-left p-3 hover:bg-sage-50 border-b border-stone-50 last:border-0 transition-colors flex items-start gap-3"
                                >
                                    <MapPin className="w-4 h-4 text-stone-400 mt-1 shrink-0" />
                                    <div>
                                        <p className="font-medium text-sage-900 text-sm">{feature.text}</p>
                                        <p className="text-xs text-stone-500 truncate">{feature.place_name}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* GPS Button */}
                <button
                    onClick={getCurrentLocation}
                    className="absolute bottom-4 right-4 bg-white p-3 rounded-full shadow-lg border border-sage-100 hover:bg-sage-50 z-10"
                    title="Use Current Location"
                >
                    <Navigation className="w-6 h-6 text-sage-600" />
                </button>
            </div>

            {/* Footer with Selected Address */}
            <div className="p-6 border-t border-sage-100 bg-white z-10">
                <div className="mb-4">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Selected Location</p>
                    <p className="text-lg font-medium text-sage-900">
                        {selectedAddress?.full_address || "Drag map to select location"}
                    </p>
                </div>
                <div className="flex justify-end gap-3">
                    <Button variant="ghost" onClick={onCancel}>Cancel</Button>
                    <Button onClick={handleConfirm} disabled={!selectedAddress}>
                        Confirm Location
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default LocationPicker;
