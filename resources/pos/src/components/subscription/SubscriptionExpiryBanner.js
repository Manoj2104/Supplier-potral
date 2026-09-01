import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';

/**
 * SubscriptionExpiryBanner
 *
 * Lightning-fast (0ms) sticky warning banner at top of content area
 * when trial or subscription is expiring within 6 days.
 *
 * Rules:
 *   1. Displays on all admin pages (via MasterLayout).
 *   2. Instant 0ms load using global/localStorage cached subscription data.
 *   3. Dismissing (✕) hides the banner across ALL pages for 3 HOURS (`localStorage`).
 *   4. Pops back up automatically after 3 hours.
 *   5. NEVER displays on the POS billing screen (`#/app/pos`).
 */

const formatBannerData = (data) => {
    if (!data) return null;
    const { status, days_remaining, is_trial, is_grace, trial_ends_at, subscription_ends_at } = data;
    const days = parseInt(days_remaining, 10);

    const shouldShow =
        ((status === 'trial' || is_trial) && days <= 6 && days >= 0) ||
        status === 'grace_period' ||
        is_grace ||
        (status === 'active' && days <= 6 && days >= 0);

    if (!shouldShow) return null;

    let level = 'warning'; // yellow/orange
    if (days <= 1) level = 'flash'; // flashing red
    else if (days <= 3) level = 'danger'; // solid red

    let message = '';
    if (status === 'grace_period' || is_grace) {
        message = `🔴 Grace Period Active — Your subscription has expired. You have ${days} day${days !== 1 ? 's' : ''} to renew before access is locked.`;
        level = 'danger';
    } else if (days === 0) {
        message = `🚨 Your free trial expires TODAY! Renew now to keep your data and access.`;
        level = 'flash';
    } else if (days === 1) {
        message = `🚨 Last Day! Your free trial expires tomorrow. Renew now to avoid interruption.`;
        level = 'flash';
    } else {
        const label = is_trial ? 'free trial' : 'subscription';
        message = `⚠️ Your ${label} expires in ${days} day${days !== 1 ? 's' : ''} (${trial_ends_at || subscription_ends_at}). Renew now to avoid interruption.`;
    }

    return { message, level, days };
};

const getSubDataFromStorage = () => {
    if (window.__INFYPOS_SUB_DATA__) {
        return window.__INFYPOS_SUB_DATA__;
    }
    try {
        const stored = localStorage.getItem('infypos_sub_data');
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {}
    return null;
};

const isCurrentlyDismissed = () => {
    const until = localStorage.getItem('sub_banner_dismissed_until');
    if (until) {
        const untilTime = parseInt(until, 10);
        if (Date.now() < untilTime) {
            return true; // Still dismissed
        } else {
            localStorage.removeItem('sub_banner_dismissed_until');
        }
    }
    return false;
};

const SubscriptionExpiryBanner = () => {
    // Synchronous initial banner state (0ms delay)
    const [subData, setSubData] = useState(getSubDataFromStorage);
    const [dismissed, setDismissed] = useState(isCurrentlyDismissed);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        // Re-check dismiss state on mount
        if (isCurrentlyDismissed()) {
            if (isMounted.current) setDismissed(true);
        }

        // Fetch background update if data missing or to refresh
        const refreshData = async () => {
            if (isCurrentlyDismissed()) {
                if (isMounted.current) setDismissed(true);
                return;
            }
            try {
                const res = await axios.get('/api/saas/subscription-status');
                if (!isMounted.current) return;
                if (res.data && res.data.status) {
                    window.__INFYPOS_SUB_DATA__ = res.data;
                    try {
                        localStorage.setItem('infypos_sub_data', JSON.stringify(res.data));
                    } catch (e) {}
                    if (isMounted.current) setSubData(res.data);
                }
            } catch (e) {}
        };

        refreshData();

        // Interval to check 3-hour expiry every 15 seconds
        const interval = setInterval(() => {
            if (!isMounted.current) return;
            const dim = isCurrentlyDismissed();
            setDismissed(dim);
            if (!dim) {
                refreshData();
            }
        }, 15000);

        return () => {
            isMounted.current = false;
            clearInterval(interval);
        };
    }, []);

    // ── EXCLUDE POS BILLING ROUTE & SUBSCRIPTION PAGE ──
    const hash     = window.location.hash || '';
    const pathname = window.location.pathname || '';
    const isPosScreen =
        (hash.includes('/app/pos') && !hash.includes('/app/pos/settings')) ||
        (pathname.includes('/app/pos') && !pathname.includes('/app/pos/settings'));

    const isSubscriptionPage =
        hash.includes('/app/subscription') ||
        pathname.includes('/app/subscription');

    const bannerData = formatBannerData(subData);

    if (isPosScreen || isSubscriptionPage || !bannerData || dismissed) {
        return null;
    }

    const { message, level } = bannerData;

    // Dismiss for 3 HOURS across all pages
    const handleDismiss = () => {
        const threeHoursMs = 3 * 60 * 60 * 1000;
        const dismissedUntil = Date.now() + threeHoursMs;
        localStorage.setItem('sub_banner_dismissed_until', dismissedUntil.toString());
        setDismissed(true);
    };

    const styles = {
        warning: {
            background: 'linear-gradient(90deg, #f59e0b, #d97706)',
            color: '#1c1917',
        },
        danger: {
            background: 'linear-gradient(90deg, #ef4444, #dc2626)',
            color: '#fff',
        },
        flash: {
            background: 'linear-gradient(90deg, #dc2626, #b91c1c)',
            color: '#fff',
            animation: 'sub-banner-pulse 1.5s ease-in-out infinite',
        },
    };

    const s = styles[level] || styles.warning;

    return (
        <>
            <style>{`
                @keyframes sub-banner-pulse {
                    0%, 100% { opacity: 1; }
                    50%       { opacity: 0.85; }
                }
                .sub-expiry-banner {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 9px 20px;
                    font-size: 13.5px;
                    font-weight: 500;
                    letter-spacing: 0.01em;
                    line-height: 1.4;
                    z-index: 1000;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.12);
                }
                .sub-expiry-banner .banner-left {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex: 1;
                }
                .sub-expiry-banner .banner-renew {
                    background: rgba(255,255,255,0.22);
                    border: 1.5px solid rgba(255,255,255,0.45);
                    color: inherit;
                    padding: 4px 14px;
                    border-radius: 20px;
                    font-size: 12.5px;
                    font-weight: 600;
                    cursor: pointer;
                    text-decoration: none;
                    transition: background 0.2s;
                    white-space: nowrap;
                    margin-left: 12px;
                }
                .sub-expiry-banner .banner-renew:hover {
                    background: rgba(255,255,255,0.38);
                }
                .sub-expiry-banner .banner-dismiss {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: inherit;
                    opacity: 0.75;
                    font-size: 16px;
                    line-height: 1;
                    padding: 0 0 0 10px;
                    margin-left: 8px;
                    transition: opacity 0.2s;
                }
                .sub-expiry-banner .banner-dismiss:hover {
                    opacity: 1;
                }
            `}</style>

            <div
                className="sub-expiry-banner"
                style={{
                    background: s.background,
                    color: s.color,
                    animation: s.animation || 'none',
                }}
            >
                <div className="banner-left">
                    <span>{message}</span>
                    <a
                        href="#/app/subscription"
                        className="banner-renew"
                        style={{ color: s.color }}
                    >
                        Renew Now →
                    </a>
                </div>

                {/* Dismiss button — hides for 3 hours across all pages */}
                <button
                    className="banner-dismiss"
                    onClick={handleDismiss}
                    title="Dismiss for 3 hours"
                >
                    ✕
                </button>
            </div>
        </>
    );
};

export default SubscriptionExpiryBanner;
