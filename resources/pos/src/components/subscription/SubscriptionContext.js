import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

/**
 * SubscriptionContext
 * Provides global subscription status to the entire app.
 * Any component can call useSubscription() to get current status.
 */
const SubscriptionContext = createContext({
    isExpired: false,
    subData: null,
    loading: true,
});

export const useSubscription = () => useContext(SubscriptionContext);

export const SubscriptionProvider = ({ children }) => {
    const [isExpired, setIsExpired] = useState(false);
    const [subData, setSubData] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkStatus = async () => {
        try {
            const res = await axios.get('/api/saas/subscription-status');
            if (res.data && res.data.status) {
                const { status, days_remaining } = res.data;
                setSubData(res.data);

                const expired = (
                    status === 'expired' ||
                    (status !== 'active' && status !== 'trial' && (days_remaining === undefined || days_remaining <= 0))
                );
                setIsExpired(expired);
            }
        } catch (err) {
            console.warn('SubscriptionProvider: check failed, defaulting to active.', err);
            setIsExpired(false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkStatus();
        // Re-check every 60 seconds
        const interval = setInterval(checkStatus, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <SubscriptionContext.Provider value={{ isExpired, subData, loading }}>
            {children}
        </SubscriptionContext.Provider>
    );
};
