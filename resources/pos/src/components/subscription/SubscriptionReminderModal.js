import React, { useEffect, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faBell, faXmark, faTriangleExclamation, faCheck, 
    faLock, faShieldHalved, faHeadset, faCreditCard, faClock
} from '@fortawesome/free-solid-svg-icons';
import './SubscriptionReminderModal.css';

/**
 * SubscriptionReminderModal
 * Microsoft 365 / Adobe Creative Cloud / Shopify / Zoho Inspired
 * Enterprise Subscription Expiry Reminder Popup
 */
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
    return { status: 'trial', days_remaining: 5, is_trial: true };
};

const isCurrentlyDismissed = () => {
    try {
        const until = localStorage.getItem('infypos_sub_reminder_dismissed_until');
        if (until) {
            const untilTime = parseInt(until, 10);
            if (Date.now() < untilTime) {
                return true;
            } else {
                localStorage.removeItem('infypos_sub_reminder_dismissed_until');
            }
        }
    } catch (e) {}
    return false;
};

const SubscriptionReminderModal = ({ forceOpen = false, onCloseOverride = null }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const [subData, setSubData] = useState(getSubDataFromStorage);
    const [isOpen, setIsOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [timeLeft, setTimeLeft] = useState({ days: 5, hours: 13, minutes: 2, seconds: 2 });
    const isMounted = React.useRef(true);

    // 1. Fetch Subscription Data
    const fetchStatus = useCallback(async () => {
        try {
            const res = await axios.get('/api/saas/subscription-status');
            if (!isMounted.current) return;
            if (res.data && res.data.status) {
                setSubData(res.data);
                window.__INFYPOS_SUB_DATA__ = res.data;
                try {
                    localStorage.setItem('infypos_sub_data', JSON.stringify(res.data));
                } catch (e) {}
            }
        } catch (err) {
            console.warn('SubscriptionReminderModal: status check failed', err);
        }
    }, []);

    useEffect(() => {
        isMounted.current = true;
        fetchStatus();
        return () => {
            isMounted.current = false;
        };
    }, [fetchStatus]);

    // 2. Evaluate Popup Trigger Logic (ONLY SHOW WHEN DAYS <= 6 OR EXPIRED / GRACE / LOCKED)
    useEffect(() => {
        if (forceOpen) {
            setIsOpen(true);
            return;
        }

        // Never show popup on POS billing terminal (/app/pos) or Subscription management page (/app/subscription)
        const currentHash = window.location.hash || '';
        const currentPath = location.pathname || '';
        if (
            currentPath.includes('/pos') || currentHash.includes('/pos') ||
            currentPath.includes('/subscription') || currentHash.includes('/subscription')
        ) {
            setIsOpen(false);
            return;
        }

        // Strictly respect 24-hour dismissal rule
        if (isCurrentlyDismissed()) {
            setIsOpen(false);
            return;
        }

        if (!subData) {
            setIsOpen(false);
            return;
        }

        const { status, days_remaining, is_grace, is_expired } = subData;
        const days = parseInt(days_remaining ?? 999, 10);

        const isLocked = (status === 'locked');
        const isExpiredOrWarning = (
            status === 'expired' ||
            status === 'grace_period' ||
            is_expired ||
            is_grace ||
            (days <= 6 && days >= 0)
        );

        if (isLocked || isExpiredOrWarning) {
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    }, [subData, forceOpen, location.pathname]);

    // 3. Global Window Event Listener for Manual Trigger (Clears 24-Hour Dismissal)
    useEffect(() => {
        const handleManualOpen = () => {
            localStorage.removeItem('infypos_sub_reminder_dismissed_until');
            setIsOpen(true);
        };
        window.addEventListener('open-subscription-reminder', handleManualOpen);
        return () => window.removeEventListener('open-subscription-reminder', handleManualOpen);
    }, []);

    // 5. Live 60FPS Countdown Timer Engine
    useEffect(() => {
        if (!subData) return;

        const isExp = subData.status === 'expired' || subData.is_expired || subData.status === 'locked';
        if (isExp) {
            setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            return;
        }

        // Calculate Target Expiry Timestamp
        const days = parseInt(subData.days_remaining ?? 6, 10);
        let targetTime = Date.now() + (days * 86400 * 1000);

        if (subData.trial_ends_at || subData.subscription_ends_at) {
            const dateStr = subData.trial_ends_at || subData.subscription_ends_at;
            const parsed = new Date(dateStr).getTime();
            if (!isNaN(parsed) && parsed > Date.now()) {
                targetTime = parsed;
            }
        }

        const updateTimer = () => {
            const now = Date.now();
            const diff = targetTime - now;

            if (diff <= 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                return;
            }

            const d = Math.floor(diff / (1000 * 60 * 60 * 24));
            const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft({ days: d, hours: h, minutes: m, seconds: s });
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [subData]);

    // Handlers with Smooth Animated Close & 24-Hour Persistence
    const handleClose = () => {
        if (isClosing) return;
        setIsClosing(true);

        const twentyFourHours = Date.now() + (24 * 60 * 60 * 1000);
        localStorage.setItem('infypos_sub_reminder_dismissed_until', twentyFourHours.toString());

        setTimeout(() => {
            if (onCloseOverride) {
                onCloseOverride();
            }
            setIsOpen(false);
            setIsClosing(false);
        }, 200);
    };

    const handleRemindLater = () => {
        handleClose();
    };

    const handleRenewNow = () => {
        handleClose();
        navigate('/app/subscription');
        window.location.href = '#/app/subscription';
    };

    const handleContactSupport = () => {
        handleClose();
        window.location.href = '#/app/report/report-product-quantity';
    };

    if (!isOpen) return null;

    const days = subData ? parseInt(subData.days_remaining ?? 6, 10) : 6;
    const status = subData?.status || 'trial';
    const isTrial = status === 'trial' || subData?.is_trial;
    const isGrace = status === 'grace_period' || subData?.is_grace;
    const isExpired = status === 'expired' || subData?.is_expired;
    const isLocked = status === 'locked';

    // Theme Customization Map
    let themeClass = 'theme-active';
    let titleText = 'Your Subscription is Expiring Soon!';
    let subtitleText = 'Renew today to continue using all INFY-POS features without interruption.';
    let badgeText = `${String(days).padStart(2, '0')} DAYS LEFT`;
    let primaryBtnText = 'Renew Now – ₹499 / Month';

    if (isTrial) {
        themeClass = 'theme-trial';
        titleText = 'Your Free Trial Ends Soon!';
        subtitleText = 'Enjoying INFY-POS? Upgrade today to continue using all features without interruption.';
        badgeText = `${String(days).padStart(2, '0')} DAYS LEFT`;
        primaryBtnText = 'Choose Plan – ₹499 / Month';
    } else if (isGrace) {
        themeClass = 'theme-grace';
        titleText = 'You Are in Grace Period!';
        subtitleText = `Your subscription has expired, but you have ${days} days of grace access remaining.`;
        badgeText = `GRACE PERIOD`;
        primaryBtnText = 'Renew Now – ₹499 / Month';
    } else if (isExpired) {
        themeClass = 'theme-expired';
        titleText = 'Subscription Expired!';
        subtitleText = 'Your subscription has expired. Renew now to restore full access.';
        badgeText = 'EXPIRED';
        primaryBtnText = 'Renew & Continue – ₹499';
    } else if (isLocked) {
        themeClass = 'theme-locked';
        titleText = 'Access Locked!';
        subtitleText = 'Your grace period is over. Please renew your subscription to unlock and continue.';
        badgeText = 'LOCKED';
        primaryBtnText = 'Renew Now – ₹499 / Month';
    }

    return ReactDOM.createPortal(
        <div className={`sub-reminder-overlay ${isClosing ? 'closing' : ''}`} onClick={(e) => e.target.classList.contains('sub-reminder-overlay') && !isLocked && handleClose()}>
            <div className={`sub-reminder-modal ${themeClass} ${isClosing ? 'closing' : ''}`}>
                
                {/* Close Button (Hidden on Locked state) */}
                {!isLocked && (
                    <button className="sub-reminder-close-btn" onClick={handleClose} title="Close">
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                )}

                {/* Modal Header */}
                <div className="sub-reminder-header">
                    <div className="sub-bell-container">
                        <div className="sub-bell-bg">
                            <FontAwesomeIcon icon={isLocked ? faLock : (isGrace ? faTriangleExclamation : faBell)} style={{ color: isGrace ? '#D97706' : (isTrial ? '#16A34A' : '#EF4444') }} />
                        </div>
                        <div className="sub-bell-badge">
                            {badgeText}
                        </div>
                    </div>
                    <h2 className="sub-reminder-title">{titleText}</h2>
                    <p className="sub-reminder-subtitle">{subtitleText}</p>
                </div>

                {/* Live Countdown Card */}
                <div className={`sub-countdown-card ${themeClass}`}>
                    <div className="sub-countdown-label">
                        {isExpired || isLocked ? 'Subscription Has Expired' : 'Your subscription will expire in'}
                    </div>
                    <div className="sub-timer-grid">
                        <div className="sub-timer-box">
                            <div className="sub-timer-number">{(isExpired || isLocked) ? '00' : String(timeLeft.days).padStart(2, '0')}</div>
                            <div className="sub-timer-unit">Days</div>
                        </div>
                        <div className="sub-timer-colon">:</div>
                        <div className="sub-timer-box">
                            <div className="sub-timer-number">{(isExpired || isLocked) ? '00' : String(timeLeft.hours).padStart(2, '0')}</div>
                            <div className="sub-timer-unit">Hours</div>
                        </div>
                        <div className="sub-timer-colon">:</div>
                        <div className="sub-timer-box">
                            <div className="sub-timer-number">{(isExpired || isLocked) ? '00' : String(timeLeft.minutes).padStart(2, '0')}</div>
                            <div className="sub-timer-unit">Minutes</div>
                        </div>
                        <div className="sub-timer-colon">:</div>
                        <div className="sub-timer-box">
                            <div className="sub-timer-number">{(isExpired || isLocked) ? '00' : String(timeLeft.seconds).padStart(2, '0')}</div>
                            <div className="sub-timer-unit">Seconds</div>
                        </div>
                    </div>
                </div>

                {/* Warning Info Box */}
                <div className={`sub-warning-box ${themeClass}`}>
                    <div className="sub-warning-icon">ⓘ</div>
                    <div>
                        {isLocked ? (
                            <span><strong>Access Suspended:</strong> Your grace period is over. Renew now to reactivate service immediately.</span>
                        ) : isGrace ? (
                            <span><strong>Grace Period Active:</strong> Your service will be restricted once grace period ends. Renew now to avoid interruption.</span>
                        ) : isExpired ? (
                            <span><strong>Subscription Expired:</strong> Your account is currently in grace period for 3 days. Renew now to restore full service access.</span>
                        ) : (
                            <span>After expiry, you will enter grace period for 3 days. Renew now to avoid service interruption.</span>
                        )}
                    </div>
                </div>

                {/* Feature Benefits Chips */}
                <div className="sub-benefits-grid">
                    <div className="sub-benefit-chip">
                        <span className="sub-benefit-icon">✓</span>
                        <span>All Features Included</span>
                    </div>
                    <div className="sub-benefit-chip">
                        <span className="sub-benefit-icon">✓</span>
                        <span>No Credit Card Required</span>
                    </div>
                    <div className="sub-benefit-chip">
                        <span className="sub-benefit-icon">✓</span>
                        <span>Cancel Anytime</span>
                    </div>
                    <div className="sub-benefit-chip">
                        <span className="sub-benefit-icon">✓</span>
                        <span>Data is Safe & Secure</span>
                    </div>
                </div>

                {/* Action Buttons Row */}
                <div className="sub-actions-row">
                    <button className="sub-btn-outline" onClick={handleContactSupport}>
                        <FontAwesomeIcon icon={faHeadset} />
                        <span>Contact Support</span>
                    </button>

                    {!isLocked && (
                        <button className="sub-btn-secondary" onClick={handleRemindLater}>
                            Remind Me Later
                        </button>
                    )}

                    <button className="sub-btn-primary" onClick={handleRenewNow}>
                        <span>{primaryBtnText}</span>
                    </button>
                </div>

                {/* Security Footer Bar */}
                <div className="sub-footer-bar">
                    <div className="sub-footer-left">
                        <FontAwesomeIcon icon={faShieldHalved} style={{ color: '#16A34A' }} />
                        <span>🔒 100% Secure Payment with Razorpay</span>
                    </div>
                    <div className="sub-footer-right">
                        <div className="sub-footer-badge">
                            <FontAwesomeIcon icon={faCheck} style={{ color: '#16A34A' }} />
                            <span>Instant Activation</span>
                        </div>
                        <div className="sub-footer-badge">
                            <FontAwesomeIcon icon={faCheck} style={{ color: '#16A34A' }} />
                            <span>SSL Secured Payment</span>
                        </div>
                        <div className="sub-footer-badge">
                            <FontAwesomeIcon icon={faCheck} style={{ color: '#16A34A' }} />
                            <span>GST Invoice</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>,
        document.body
    );
};

export default SubscriptionReminderModal;
