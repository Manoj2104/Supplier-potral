import React, { useEffect, useState } from "react";
import { Route, Navigate, Routes, useLocation } from "react-router-dom";
import "../../pos/src/assets/sass/style.react.scss";
import { Tokens } from "./constants";
import { ProtectedRoute } from "./shared/sharedMethod";
import { route } from "./routes";
import AccessDenied from "./components/auth/AccessDenied";
import TopProgressBar from "./shared/components/loaders/TopProgressBar";
import { useSelector } from "react-redux";
import SubscriptionLockScreen from "./components/subscription/SubscriptionLockScreen";
import axios from "axios";

const getInitialSubData = () => {
    try {
        const stored = localStorage.getItem('infypos_sub_data');
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {}
    return null;
};

// ─────────────────────────────────────────────────────────────────
//  SubscriptionRouteWrapper
//  A component (not a function call) so it re-renders on state change.
//  This is the correct pattern for React Router v6.
// ─────────────────────────────────────────────────────────────────
function SubscriptionRouteWrapper({ routeItem, config, allConfigData, subExpired, subLoaded, subData }) {
    // Direct render for Owner Super Admin Control Center & Subscription page
    if (routeItem.path && (routeItem.path.includes('super-admin') || routeItem.path.includes('subscription'))) {
        return routeItem.ele;
    }

    const token = localStorage.getItem(Tokens.ADMIN);

    if (token === null) {
        return <Navigate replace to="/login" />;
    }

    // While loading: show a minimal loading indicator (not null, prevents blank flash)
    if (!subLoaded) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '100vh', background: '#f4f6fb', color: '#64748b', fontSize: 14
            }}>
                Loading...
            </div>
        );
    }

    // ✅ SUBSCRIPTION EXPIRED → Show lock screen on ALL pages except /app/subscription (URL stays, sidebar stays)
    if (subExpired) {
        return <SubscriptionLockScreen subData={subData} />;
    }

    // ✅ NORMAL → Show the actual page
    const hasPermission = (permission) => {
        if (!permission || permission === "") return true;
        if (config && Array.isArray(config) && config.length > 0) {
            return config.includes(permission);
        }
        return true;
    };

    const isAuthorized = hasPermission(routeItem.permission);
    return (
        <ProtectedRoute allConfigData={allConfigData} route={routeItem.path}>
            {isAuthorized ? routeItem.ele : <AccessDenied />}
        </ProtectedRoute>
    );
}

// ─────────────────────────────────────────────────────────────────
//  AdminApp
// ─────────────────────────────────────────────────────────────────
function AdminApp(props) {
    const { config } = props;
    const token = localStorage.getItem(Tokens.ADMIN);
    const { allConfigData } = useSelector((state) => state);
    const location = useLocation();

    const initialData = getInitialSubData();
    const isInitiallyExpired = initialData ? (
        initialData.status === 'expired' ||
        initialData.status === 'locked'  ||
        initialData.status === 'access_locked' ||
        initialData.is_expired === true
    ) : false;

    const [subData,    setSubData]    = useState(initialData);
    const [subExpired, setSubExpired] = useState(isInitiallyExpired);
    const [subLoaded,  setSubLoaded]  = useState(true);
    const isMounted = React.useRef(true);

    useEffect(() => {
        isMounted.current = true;
        const checkSubscription = async () => {
            try {
                const res = await axios.get('/api/saas/subscription-status');
                if (!isMounted.current) return;
                if (res.data && res.data.status) {
                    const { status, days_remaining, is_expired } = res.data;
                    setSubData(res.data);
                    window.__INFYPOS_SUB_DATA__ = res.data;
                    try {
                        localStorage.setItem('infypos_sub_data', JSON.stringify(res.data));
                    } catch (e) {}

                    const expired = (
                        status === 'expired'        ||
                        status === 'locked'         ||
                        status === 'access_locked'   ||
                        is_expired === true          ||
                        (
                            status !== 'active' &&
                            status !== 'trial'  &&
                            status !== 'grace_period' &&
                            (days_remaining === undefined || days_remaining <= 0)
                        )
                    );
                    if (isMounted.current) {
                        setSubExpired(expired);
                    }
                }
            } catch (err) {
                console.warn('AdminApp: subscription check error', err);
            } finally {
                if (isMounted.current) {
                    setSubLoaded(true);
                }
            }
        };

        if (token) {
            checkSubscription();
            const interval = setInterval(checkSubscription, 60000); // Check once per 60s
            return () => {
                isMounted.current = false;
                clearInterval(interval);
            };
        } else {
            setSubLoaded(true);
        }

        return () => {
            isMounted.current = false;
        };
    }, [token, location.pathname]);


    return (
        <>
            <TopProgressBar />
            <Routes>
                {route && route.length > 0 && route.map((routeItem, index) =>
                    routeItem.ele ? (
                        <Route
                            key={index}
                            exact={true}
                            path={routeItem.path}
                            element={
                                // Use a React COMPONENT (not a function call) so it re-renders
                                // whenever subExpired/subLoaded state changes in AdminApp.
                                <SubscriptionRouteWrapper
                                    routeItem={routeItem}
                                    config={config}
                                    allConfigData={allConfigData}
                                    subExpired={subExpired}
                                    subLoaded={subLoaded}
                                    subData={subData}
                                />
                            }
                        />
                    ) : null
                )}
                <Route path="*" element={<AccessDenied />} />
            </Routes>
        </>
    );
}

export default AdminApp;
