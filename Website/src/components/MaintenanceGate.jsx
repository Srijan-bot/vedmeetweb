import React, { useEffect, useState } from 'react';
import { getSiteSettings } from '../lib/data';
import Maintenance from '../pages/Maintenance';
import { useLocation } from 'react-router-dom';

const MaintenanceGate = ({ children }) => {
    const [isMaintenance, setIsMaintenance] = useState(false);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    // Whitelisted independent of settings - e.g. admin, inventory, orders
    // Actually the user said "only admin and inventory and order work".
    // We can rely on the check being here, but if we wrap specific routes in App.jsx,
    // we don't need complex path checking here.
    // However, if we wrap the *entire* public section, it's safer.

    useEffect(() => {
        checkMaintenance();
        // Poll every 30 seconds to catch changes? Or just on mount.
        // On mount is usually fine, but if admin turns it on, users might not see it until refresh.
        // That is acceptable.
    }, []);

    const checkMaintenance = async () => {
        // Bypass maintenance mode on localhost
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            setIsMaintenance(false);
            setLoading(false);
            return;
        }

        try {
            const settings = await getSiteSettings();
            // Boolean conversion - string 'true' or boolean true
            const mode = settings.maintenance_mode === 'true' || settings.maintenance_mode === true;
            setIsMaintenance(mode);
        } catch (err) {
            console.error("Error checking maintenance:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        // Optional: show a loading spinner or just render children until we know?
        // Rendering children might flash content.
        // Rendering spinner is safer.
        return <div className="h-screen w-full flex items-center justify-center bg-stone-50">Loading...</div>;
    }

    if (isMaintenance) {
        return <Maintenance />;
    }

    return children;
};

export default MaintenanceGate;
