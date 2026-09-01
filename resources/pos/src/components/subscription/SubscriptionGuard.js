import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

/**
 * SubscriptionGuard — Global Route Protector
 *
 * Checks subscription status on every route change.
 * If expired or access-locked → redirects ALL routes to /app/subscription.
 * If active or trial → allows normal navigation.
 */
const SubscriptionGuard = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [checked, setChecked] = useState(true);

    useEffect(() => {
        const checkSubscription = async () => {
            try {
                const res = await axios.get('/api/saas/subscription-status');
                if (res.data && res.data.status) {
                    const { status, days_remaining } = res.data;

                    const isLockedOrExpired = (
                        status === 'expired' ||
                        (status !== 'active' && status !== 'trial' && (days_remaining === undefined || days_remaining <= 0))
                    );

                    // If expired/locked AND user is NOT already on the subscription page
                    if (isLockedOrExpired && location.pathname !== '/app/subscription') {
                        navigate('/app/subscription', { replace: true });
                        return;
                    }
                }
            } catch (err) {
                // If API call fails, allow navigation (fail-open for availability)
                console.warn('SubscriptionGuard: status check failed, allowing navigation.', err);
            }
        };

        checkSubscription();
    }, [location.pathname, navigate]);

    return <>{children}</>;
};

export default SubscriptionGuard;
