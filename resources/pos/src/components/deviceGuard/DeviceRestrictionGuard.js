import React, { useState, useEffect } from 'react';
import DeviceRestrictionScreen from './DeviceRestrictionScreen';

const DeviceRestrictionGuard = ({ children }) => {
    const [isBlocked, setIsBlocked] = useState(false);

    const evaluateDeviceAccess = () => {
        // 1. Exception Check: Always allow PDA Portal & Super Admin Portal
        const currentPath = (window.location.pathname + window.location.hash).toLowerCase();
        if (currentPath.includes('/pda') || currentPath.includes('super_admin') || currentPath.includes('super-admin') || window.SUPERADMIN_API_BASE) {
            setIsBlocked(false);
            return;
        }

        // 2. Detection Strategy
        const width = window.innerWidth;
        const userAgent = navigator.userAgent || navigator.vendor || window.opera || '';
        const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

        // Only block actual mobile devices (mobile user-agent), never block desktop PC / laptop users even if devtools is open
        const isMobileOrTablet = isMobileUA && (isTouchDevice || width < 1024);

        setIsBlocked(isMobileOrTablet);
    };

    useEffect(() => {
        evaluateDeviceAccess();

        // Dynamic Viewport & Orientation Change Listeners
        const handleResize = () => evaluateDeviceAccess();
        const handleOrientation = () => setTimeout(evaluateDeviceAccess, 200);

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleOrientation);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleOrientation);
        };
    }, []);

    if (isBlocked) {
        return <DeviceRestrictionScreen />;
    }

    return children;
};

export default DeviceRestrictionGuard;
