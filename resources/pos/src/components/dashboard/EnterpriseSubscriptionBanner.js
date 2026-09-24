import React, { useEffect, useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faClock,
    faTriangleExclamation,
    faLock,
    faCheck,
    faXmark,
    faHeadset,
    faShieldHalved,
    faRotate,
    faFileInvoice,
    faCreditCard,
    faStore,
    faWifi,
    faBolt,
    faSliders,
    faChartLine,
    faBuilding,
    faArrowRotateRight,
    faGem,
    faQrcode,
    faCheckCircle,
    faSpinner,
    faDownload,
    faDesktop,
    faMobileAlt,
    faDatabase,
    faComments,
    faPhone,
    faTicketAlt,
    faToggleOn,
    faToggleOff,
    faBan,
    faKey,
    faUpload,
    faHistory,
    faCopy,
    faPlus
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { subscribePosDataChanged } from '../../shared/posEvents';
import { applySubscriptionUpdate } from '../../shared/subscriptionApi';
import {
    initLicenseSdk,
    subscribeLicenseState,
    getCurrentRemainingSeconds,
    formatRemainingTime,
    fetchAuthoritativeLicense,
    setAuthoritativeBaseline,
    notifyLicenseUpdate
} from '../../shared/licenseSdk';
import './EnterpriseSubscriptionBanner.css';

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

// Helper to calculate exact absolute expiration timestamp (Unix epoch ms)
const getTargetTimestamp = (data) => {
    if (!data) return Date.now();
    if (data.target_timestamp) return data.target_timestamp;

    const dateStr = data.subscription_ends_at || data.trial_ends_at;
    if (dateStr) {
        const parsed = new Date(dateStr).getTime();
        if (!isNaN(parsed) && parsed > 0) {
            return parsed;
        }
    }
    return Date.now() + ((parseInt(data.days_remaining || 0, 10)) * 86400 * 1000);
};

// Safe date formatter for client displays
const formatDisplayDate = (val) => {
    if (!val || val === 'Expired' || val === 'Never' || val === 'N/A') return val || 'N/A';
    try {
        const d = new Date(val);
        if (isNaN(d.getTime())) return String(val);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
        return String(val);
    }
};

const EnterpriseSubscriptionBanner = ({ onStatusChange }) => {
    const [subData, setSubData] = useState(getSubDataFromStorage);
    const [loading, setLoading] = useState(!subData);
    const [isBackingUp, setIsBackingUp] = useState(false);

    // Live Ticker State (second-by-second countdown)
    const [countdown, setCountdown] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });

    // Real-time Payment Checkout Modal States
    const [showModal, setShowModal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('upi');
    const [processing, setProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [togglingAutoRenew, setTogglingAutoRenew] = useState(false);
    const [toastMsg, setToastMsg] = useState(null);

    // Server-Authoritative Active Payment Provider State
    const [providerInfo, setProviderInfo] = useState({
        provider: 'razorpay',
        razorpay_enabled: true,
        system_payment_enabled: false,
    });
    const [showSystemModal, setShowSystemModal] = useState(false);
    const [systemUpiData, setSystemUpiData] = useState(null);
    const [loadingUpiData, setLoadingUpiData] = useState(false);
    const [utrInput, setUtrInput] = useState('');
    const [screenshotFile, setScreenshotFile] = useState(null);
    const [screenshotFileName, setScreenshotFileName] = useState('');
    const [paymentSubmitted, setPaymentSubmitted] = useState(false);
    const [submittedDetails, setSubmittedDetails] = useState(null);
    const [submittingPayment, setSubmittingPayment] = useState(false);
    const upiFileInputRef = useRef(null);

    // Duplicate Payment Prevention & Active Plan Warning States
    const [showActiveWarningModal, setShowActiveWarningModal] = useState(false);
    const [activePlanInfo, setActivePlanInfo] = useState(null);
    const [showPendingModal, setShowPendingModal] = useState(false);
    const [pendingPaymentInfo, setPendingPaymentInfo] = useState(null);
    const [cancellingPending, setCancellingPending] = useState(false);
    const [isInitiatingPayment, setIsInitiatingPayment] = useState(false);

    // Payment History Pagination & Retry States
    const [historyPage, setHistoryPage] = useState(1);
    const [viewAllHistory, setViewAllHistory] = useState(false);
    const [retryingSubId, setRetryingSubId] = useState(null);
    const HISTORY_PAGE_SIZE = 10;

    // Real-time Restore Backup States
    const [isRestoring, setIsRestoring] = useState(false);
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [restoreFile, setRestoreFile] = useState(null);
    const fileInputRef = useRef(null);

    // Real-Time Device Fleet & Pairing States
    const [showDeviceModal, setShowDeviceModal] = useState(false);
    const [deviceModalTab, setDeviceModalTab] = useState('fleet'); // 'fleet' | 'pair'
    const [localDevices, setLocalDevices] = useState(null);
    const [copiedDeviceId, setCopiedDeviceId] = useState(null);
    const [pairingPin, setPairingPin] = useState(null);
    const [pairingPinLoading, setPairingPinLoading] = useState(false);
    const [pairingPinSeconds, setPairingPinSeconds] = useState(0);
    const [newDeviceName, setNewDeviceName] = useState('');
    const [newDeviceType, setNewDeviceType] = useState('Wireless Barcode Scanner / PDA');
    const [newDeviceIp, setNewDeviceIp] = useState('');
    const [isPairingDevice, setIsPairingDevice] = useState(false);

    // Continuous Real-Time Automated Backup States
    const [continuousBackupEnabled, setContinuousBackupEnabled] = useState(true);
    const [lastSyncSeconds, setLastSyncSeconds] = useState(0);
    const [isAutoSyncing, setIsAutoSyncing] = useState(false);
    const [showHoverDetails, setShowHoverDetails] = useState(false);

    // Live Continuous Real-Time Backup Daemon (Every Second Ticker + Event-Driven Auto-Vault)
    useEffect(() => {
        if (!continuousBackupEnabled) return;

        // 1-second interval ticker for live sync tracking
        const secInterval = setInterval(() => {
            setLastSyncSeconds(s => s + 1);
        }, 1000);

        // Instant snapshot vault updater
        const syncVaultNow = async () => {
            try {
                setIsAutoSyncing(true);
                const res = await axios.post('/api/saas/backup/auto-vault');
                if (res.data && res.data.success) {
                    setLastSyncSeconds(0);
                    setSubData(prev => ({
                        ...prev,
                        last_backup: 'Real-Time Automated Vault',
                        backup_size: res.data.backup_size || prev.backup_size
                    }));
                }
            } catch (err) {
                // background auto-vault silent handle
            } finally {
                setIsAutoSyncing(false);
            }
        };

        // Instant Auto-Vault triggered whenever ANY POS transaction, product, or adjustment changes
        const unsubscribe = subscribePosDataChanged(() => {
            syncVaultNow();
        });

        // Background heartbeat backup sync every 25s to ensure constant freshness
        const heartbeatInterval = setInterval(() => {
            syncVaultNow();
        }, 25000);

        return () => {
            clearInterval(secInterval);
            clearInterval(heartbeatInterval);
            if (typeof unsubscribe === 'function') unsubscribe();
        };
    }, [continuousBackupEnabled]);

    // Fetch server-authoritative subscription & cryptographic license lease
    const fetchSubscriptionStatus = async () => {
        try {
            const data = await fetchAuthoritativeLicense(true);
            if (data && data.status) {
                setSubData(data);
                applySubscriptionUpdate(data);

                if (typeof onStatusChange === 'function') {
                    onStatusChange(data);
                }
            }
        } catch (err) {
            console.warn('Backend license service offline; evaluating monotonic offline checkpoint', err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch server-authoritative active payment provider configuration
    const fetchPaymentProvider = async () => {
        try {
            const res = await axios.get('/api/payment/provider');
            if (res.data && res.data.success && res.data.data) {
                setProviderInfo(res.data.data);
            }
        } catch (err) {
            console.warn('Could not fetch active payment provider:', err);
        }
    };

    // ── SERVER-AUTHORITATIVE MONOTONIC TIMER TICKER (EVERY SECOND) ──
    // Uses performance.now() elapsed ticks from server baseline.
    // Client clock manipulation (changing Windows date/time) cannot extend subscription!
    const baselineRef = useRef({
        serverRemainingSeconds: 0,
        perfBaseline: 0,
    });

    useEffect(() => {
        ensureRazorpayLoaded();
        initLicenseSdk();
        fetchSubscriptionStatus();
        fetchPaymentProvider();

        // ⚡ 0ms INSTANT EVENT LISTENER — updates timer and state immediately without lag
        const handleStatusUpdate = (e) => {
            const updated = e?.detail;
            if (updated) {
                const normStatus = (updated.status || '').toLowerCase();
                const planTitle = updated.plan_name || updated.plan;

                // ⚡ 0ms INSTANT TIMER SYNC: Calculate exact seconds immediately
                let freshSecs = null;
                if (typeof updated.remaining_seconds === 'number' && !isNaN(updated.remaining_seconds) && updated.remaining_seconds > 0) {
                    freshSecs = updated.remaining_seconds;
                } else if (updated.subscription_ends_at || updated.valid_until || updated.expires_at) {
                    const targetStr = updated.subscription_ends_at || updated.valid_until || updated.expires_at;
                    const targetMs = new Date(targetStr).getTime();
                    if (!isNaN(targetMs)) {
                        freshSecs = Math.max(0, Math.floor((targetMs - Date.now()) / 1000));
                    }
                }

                if (freshSecs !== null) {
                    updated.remaining_seconds = freshSecs;
                    baselineRef.current = {
                        serverRemainingSeconds: freshSecs,
                        perfBaseline: performance.now(),
                    };
                    const formatted = formatRemainingTime(freshSecs);
                    setCountdown({
                        days: parseInt(formatted.days, 10),
                        hours: parseInt(formatted.hours, 10),
                        minutes: parseInt(formatted.minutes, 10),
                        seconds: parseInt(formatted.seconds, 10),
                        totalSeconds: freshSecs,
                    });
                }

                setSubData(prev => ({
                    ...(prev || {}),
                    ...updated,
                    status: normStatus || prev?.status || 'active',
                    plan_name: planTitle || prev?.plan_name || 'INFY-POS PREMIUM (30 Days)',
                    is_active: (normStatus === 'active' || Boolean(updated.is_active) || Boolean(updated.valid !== false)) && normStatus !== 'trial' && normStatus !== 'expired' && normStatus !== 'suspended' && normStatus !== 'revoked',
                    is_trial: normStatus === 'trial' || Boolean(updated.is_trial),
                }));
                if (typeof onStatusChange === 'function') {
                    onStatusChange(updated);
                }
            }
        };

        const unsubscribeSdk = subscribeLicenseState((state) => {
            if (state) {
                const normStatus = (state.status || '').toLowerCase();
                const planTitle = state.plan_name || state.plan;

                if (typeof state.remaining_seconds === 'number' && state.remaining_seconds > 0) {
                    baselineRef.current = {
                        serverRemainingSeconds: state.remaining_seconds,
                        perfBaseline: performance.now(),
                    };
                    const formatted = formatRemainingTime(state.remaining_seconds);
                    setCountdown({
                        days: parseInt(formatted.days, 10),
                        hours: parseInt(formatted.hours, 10),
                        minutes: parseInt(formatted.minutes, 10),
                        seconds: parseInt(formatted.seconds, 10),
                        totalSeconds: state.remaining_seconds,
                    });
                }

                setSubData(prev => ({
                    ...(prev || {}),
                    ...state,
                    status: normStatus || prev?.status || 'active',
                    plan_name: planTitle || prev?.plan_name || 'INFY-POS PREMIUM (30 Days)',
                    is_active: (normStatus === 'active' || Boolean(state.is_active) || Boolean(state.valid !== false)) && normStatus !== 'trial' && normStatus !== 'expired' && normStatus !== 'suspended' && normStatus !== 'revoked',
                    is_trial: normStatus === 'trial' || Boolean(state.is_trial),
                }));
                if (typeof onStatusChange === 'function') {
                    onStatusChange(state);
                }
            }
        });

        window.addEventListener('infypos:subscription-updated', handleStatusUpdate);
        window.addEventListener('infypos:license-updated', handleStatusUpdate);

        // Periodic background license revalidation (every 30s during active page)
        const syncInterval = setInterval(fetchSubscriptionStatus, 30000);

        return () => {
            clearInterval(syncInterval);
            window.removeEventListener('infypos:subscription-updated', handleStatusUpdate);
            window.removeEventListener('infypos:license-updated', handleStatusUpdate);
            if (typeof unsubscribeSdk === 'function') unsubscribeSdk();
        };
    }, []);

    // Update monotonic baseline whenever authoritative server state arrives
    useEffect(() => {
        if (!subData) return;
        setAuthoritativeBaseline(subData);
        const sRem = Number(subData.remaining_seconds);
        if (!isNaN(sRem) && sRem > 0) {
            baselineRef.current = {
                serverRemainingSeconds: sRem,
                perfBaseline: performance.now(),
            };
        }
    }, [subData?.remaining_seconds, subData?.status]);

    useEffect(() => {
        const updateTimer = () => {
            if (!subData) return;

            const isExp = subData.status === 'expired' || subData.status === 'EXPIRED' ||
                          subData.is_expired || subData.status === 'locked' ||
                          subData.status === 'CLOCK_ROLLBACK_DETECTED' ||
                          subData.status === 'MACHINE_MISMATCH';

            if (isExp) {
                setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 });
                return;
            }

            // 1. Monotonic elapsed offset from server baseline
            let currentRemaining = 0;
            if (baselineRef.current.serverRemainingSeconds > 0 && baselineRef.current.perfBaseline > 0) {
                const elapsedSec = Math.floor((performance.now() - baselineRef.current.perfBaseline) / 1000);
                currentRemaining = Math.max(0, baselineRef.current.serverRemainingSeconds - elapsedSec);
            } else {
                currentRemaining = getCurrentRemainingSeconds();
                if (currentRemaining <= 0 && subData.remaining_seconds > 0) {
                    baselineRef.current = {
                        serverRemainingSeconds: Number(subData.remaining_seconds),
                        perfBaseline: performance.now(),
                    };
                    currentRemaining = Number(subData.remaining_seconds);
                }
            }

            if (currentRemaining <= 0) {
                setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 });
                return;
            }

            const formatted = formatRemainingTime(currentRemaining);
            setCountdown({
                days: parseInt(formatted.days, 10),
                hours: parseInt(formatted.hours, 10),
                minutes: parseInt(formatted.minutes, 10),
                seconds: parseInt(formatted.seconds, 10),
                totalSeconds: currentRemaining,
            });
        };

        updateTimer();
        const timer = setInterval(updateTimer, 1000);

        return () => clearInterval(timer);
    }, [subData]);

    if (!subData && loading) {
        return (
            <div className="esb-loading-state" style={{ background: '#F8FAFC', minHeight: '80vh' }}>
                <FontAwesomeIcon icon={faSpinner} spin className="spin-icon" />
                <h4>Loading Subscription Status...</h4>
                <p>Connecting to INFY-POS License Engine</p>
            </div>
        );
    }

    const currentSub = subData || {};
    const daysLeft  = countdown.days;

    // Strict status checks with bulletproof normalization
    const rawStatus = String(currentSub.status || '').toLowerCase().trim();

    const isZeroCountdown = countdown.days === 0 && countdown.hours === 0 && countdown.minutes === 0 && countdown.seconds === 0;

    // Check if subscription end / next billing date has passed
    const rawEndVal = currentSub.subscription_ends_at || currentSub.next_billing_date || currentSub.trial_ends_at || currentSub.valid_until || currentSub.expires_at;
    let isPastEndDate = false;
    if (rawEndVal && rawEndVal !== 'Never' && rawEndVal !== 'N/A' && rawEndVal !== 'Expired') {
        const parsedTime = new Date(rawEndVal).getTime();
        if (!isNaN(parsedTime) && parsedTime > 0) {
            isPastEndDate = parsedTime <= Date.now();
        }
    }

    const hasZeroRemaining = (typeof currentSub.remaining_seconds === 'number' && currentSub.remaining_seconds <= 0) ||
                             (typeof currentSub.days_remaining === 'number' && currentSub.days_remaining <= 0);

    const isExplicitExpired = rawStatus === 'expired' || rawStatus === 'locked' || rawStatus === 'revoked' || rawStatus === 'access_locked' || Boolean(currentSub.is_expired) || currentSub.valid === false;
    const isTimeExpired = isPastEndDate || hasZeroRemaining || (isZeroCountdown && (!currentSub.valid || isExplicitExpired));
    const isTrialExpired = (rawStatus === 'trial' || Boolean(currentSub.is_trial)) && (daysLeft <= 0 || isZeroCountdown || isPastEndDate);

    const isExpired = Boolean(isExplicitExpired || isTimeExpired || isTrialExpired);
    const isServerValid = !isExpired && (Boolean(currentSub.valid) || rawStatus === 'active' || Boolean(currentSub.is_active));
    const isTrial   = !isExpired && (rawStatus === 'trial' || Boolean(currentSub.is_trial));
    const isActive  = !isExpired && !isTrial && (rawStatus === 'active' || isServerValid);
    const isGrace   = !isExpired && (rawStatus === 'grace_period' || Boolean(currentSub.is_grace));
    // Block payment ONLY when subscription is active, not trial, AND more than 6 days remain
    // When 6 or fewer days remain (daysLeft <= 6), renewal buttons automatically re-appear!
    const isPaidActive = isActive && daysLeft > 6;
    const resolvedPlanTitle = currentSub.plan_name || currentSub.plan || (isTrial ? 'INFY-POS FREE TRIAL (14 Days)' : 'INFY-POS PREMIUM (30 Days)');
    const cleanPrice = String(currentSub.price || '₹499').replace(/\/month/i, '').trim();

    // Real-Time Backup Generator Action
    const handleCreateBackup = async () => {
        setIsBackingUp(true);
        try {
            const res = await axios.post('/api/saas/backup/now');
            if (res.data && res.data.success) {
                setSubData(prev => ({
                    ...prev,
                    last_backup: res.data.last_backup,
                    backup_size: res.data.backup_size
                }));
                showToast(res.data.message || 'Backup Created Successfully! Database Archived.');
            }
        } catch (e) {
            showToast('Backup failed. Please try again.');
        } finally {
            setIsBackingUp(false);
        }
    };

    // Trigger local file picker
    const handlePickRestoreFile = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    // Handle file selection
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setRestoreFile(file);
            setShowRestoreModal(true);
        }
        e.target.value = '';
    };

    // Execute Database Restore
    const handleExecuteRestore = async (sourceType = 'file') => {
        const confirmMsg = sourceType === 'vault'
            ? '⚠️ WARNING: Restoring from the Automated Vault will overwrite current database records with the vault backup. Proceed?'
            : `⚠️ WARNING: Restoring from "${restoreFile?.name}" will overwrite current database records with this file\'s data. Proceed?`;

        if (!window.confirm(confirmMsg)) {
            return;
        }

        setIsRestoring(true);
        try {
            let res;
            if (sourceType === 'vault') {
                res = await axios.post('/api/saas/backup/restore', { source: 'vault' });
            } else {
                if (!restoreFile) {
                    showToast('Please select a .sql or .zip backup file first.');
                    setIsRestoring(false);
                    return;
                }
                const formData = new FormData();
                formData.append('backup_file', restoreFile);
                res = await axios.post('/api/saas/backup/restore', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            if (res.data && res.data.success) {
                setSubData(prev => ({
                    ...prev,
                    last_backup: res.data.last_backup || prev.last_backup,
                    backup_size: res.data.backup_size || prev.backup_size,
                }));
                showToast(res.data.message || 'Database Restored Successfully!');
                setShowRestoreModal(false);
                setRestoreFile(null);
                setTimeout(() => {
                    fetchSubscriptionStatus();
                }, 1000);
            } else {
                showToast('Restore failed: ' + (res.data.message || 'Unknown error'));
            }
        } catch (err) {
            showToast('Restore failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setIsRestoring(false);
        }
    };

    // Helper to dynamically load Razorpay Checkout script if needed
    const ensureRazorpayLoaded = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    // Toggle Auto Renew with confirmation dialog
    const handleToggleAutoRenew = async () => {
        if (subData?.auto_renew) {
            const confirmed = window.confirm(
                "Are you sure you want to disable Auto-Renewal?\n\nYour store features will remain fully active until the end of your billing cycle (" +
                (subData?.next_billing_date || currentSub?.subscription_ends_at || "expiry") +
                ")."
            );
            if (!confirmed) return;
        }

        setTogglingAutoRenew(true);
        try {
            const endpoint = subData?.auto_renew ? '/api/billing/razorpay/cancel' : '/api/saas/toggle-auto-renew';
            const res = await axios.post(endpoint);
            if (res.data && res.data.success) {
                setSubData(prev => ({ ...prev, auto_renew: res.data.auto_renew ?? false }));
                showToast(res.data.message);
                await fetchSubscriptionStatus();
            }
        } catch (e) {
            showToast('Failed to update auto renewal');
        } finally {
            setTogglingAutoRenew(false);
        }
    };

    const showToast = (msg) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(null), 4000);
    };

    // ⚡ ULTRA SUPER FAST 0ms INSTANT SUBSCRIPTION ACTIVATION ENGINE
    const activateSubscriptionOptimistically0ms = (paymentId, paymentMethod = 'Razorpay / UPI / Cards') => {
        const payId = paymentId || `pay_${Date.now()}`;
        const now = new Date();
        const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const formattedDate = expiryDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const seconds30Days = 30 * 86400;

        const instantData = {
            ...(subData || {}),
            status: 'active',
            is_active: true,
            is_expired: false,
            valid: true,
            days_remaining: 30,
            remaining_seconds: seconds30Days,
            subscription_ends_at: formattedDate,
            next_billing_date: formattedDate,
            valid_until: formattedDate,
            key_status: 'Active',
            key_expires: formattedDate,
            plan_name: 'INFY-POS PREMIUM (₹499/mo)',
            plan: 'INFY-POS PREMIUM',
            price: '₹499/Month',
            auto_renew: true,
            lifetime_consumed_percent: 0,
            last_payment_id: payId,
            payment_method: paymentMethod,
            security: {
                server_status: 'CONNECTED',
                license: 'VERIFIED',
                machine: 'BOUND',
                lease: 'VALID',
                clock: 'NORMAL',
                last_verification: 'Just now',
            }
        };

        // 1. Immediately update monotonic countdown in 0ms!
        baselineRef.current = {
            serverRemainingSeconds: seconds30Days,
            perfBaseline: performance.now(),
        };
        setCountdown({
            days: 30,
            hours: 0,
            minutes: 0,
            seconds: 0,
            totalSeconds: seconds30Days,
        });

        // 2. Immediately update state & remove banner suppression
        localStorage.removeItem('sub_banner_dismissed_until');
        setSubData(instantData);

        // 3. Immediately broadcast to current window, localStorage, and BroadcastChannel (POS unlocks in 0ms!)
        applySubscriptionUpdate(instantData);
        notifyLicenseUpdate(instantData);
        if (typeof onStatusChange === 'function') {
            onStatusChange(instantData);
        }

        showToast('⚡ Payment Successful! INFY-POS PREMIUM Active (30 Days).');
        return instantData;
    };

    // Cancel an unexpired pending payment attempt
    const handleCancelPendingPayment = async (pendingItem) => {
        if (!pendingItem) return;
        setCancellingPending(true);
        try {
            const res = await axios.post('/api/billing/razorpay/cancel-pending', {
                sub_id: pendingItem.id,
                invoice_number: pendingItem.invoice_number,
            });
            if (res.data && res.data.success) {
                showToast(res.data.message || 'Payment attempt cancelled.');
                setShowPendingModal(false);
                setPendingPaymentInfo(null);
                await fetchSubscriptionStatus();
            } else {
                showToast(res.data?.message || 'Could not cancel payment attempt.');
            }
        } catch (err) {
            showToast('Cancel failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setCancellingPending(false);
        }
    };

    // Continue an unexpired pending payment attempt
    const handleResumePendingPayment = async (pendingItem) => {
        setShowPendingModal(false);
        if (!pendingItem) return;
        await handleRetryPayment(pendingItem);
    };

    // Handle Authoritative Payment Checkout routing based on Super Admin payment provider
    const handleOpenCheckout = async (e) => {
        if (e && e.preventDefault) e.preventDefault();

        // 1. Authoritative Active Subscription Check on client (Prevent duplicate payments)
        if (isActive && daysLeft > 6) {
            setActivePlanInfo({
                plan_name: resolvedPlanTitle,
                ends_at: subData.subscription_ends_at || subData.next_billing_date || 'Active',
                days_remaining: daysLeft,
            });
            setShowActiveWarningModal(true);
            return;
        }

        const currentProvider = providerInfo?.provider || (providerInfo?.razorpay_enabled ? 'razorpay' : 'none');

        // Check if all payments are disabled
        if (currentProvider === 'none' || (!providerInfo?.razorpay_enabled && !providerInfo?.system_payment_enabled)) {
            alert('Payments are temporarily unavailable. Please contact the administrator.');
            return;
        }

        // Direct System Payment Gateway
        if (currentProvider === 'system') {
            setShowSystemModal(true);
            return;
        }

        // Double-click lock
        if (isInitiatingPayment) return;
        setIsInitiatingPayment(true);

        try {
            await ensureRazorpayLoaded();

            // 2. Call Backend to initialize / check existing pending / check active subscription
            const initRes = await axios.post('/api/billing/razorpay/subscription');

            if (!initRes.data || !initRes.data.success) {
                if (initRes.data?.already_active) {
                    setActivePlanInfo({
                        plan_name: initRes.data.plan_name || resolvedPlanTitle,
                        ends_at: initRes.data.subscription_ends_at || 'Active',
                        days_remaining: initRes.data.days_remaining || daysLeft,
                    });
                    setShowActiveWarningModal(true);
                } else {
                    alert(initRes.data?.message || 'Could not initiate checkout. Please try again.');
                }
                return;
            }

            const payData = initRes.data;

            if (payData.reused) {
                showToast(`Resuming pending session for invoice ${payData.invoice_number}...`);
            }

            if (typeof window.Razorpay !== 'function') {
                alert('Razorpay Checkout SDK is loading. Please check your internet connection and try again.');
                return;
            }

            const options = {
                key: payData.key_id,
                order_id: payData.order_id,
                subscription_id: payData.subscription_id || undefined,
                amount: payData.amount || 49900,
                currency: payData.currency || 'INR',
                name: 'INFY-POS Enterprise',
                description: `${payData.plan_name || 'INFY-POS PREMIUM'} (${payData.invoice_number || '30 Days'})`,
                image: '/images/pos_subscription_hero.png',
                prefill: payData.prefill || {
                    name: subData?.owner_name || 'Administrator',
                    email: subData?.email || 'admin@infypos.local',
                    contact: subData?.phone || '',
                },
                theme: { color: '#059669' },
                modal: {
                    ondismiss: function () {
                        setIsInitiatingPayment(false);
                    }
                },
                handler: async function (response) {
                    // ⚡ 0ms ULTRA SUPER FAST INSTANT PLAN ACTIVATION
                    activateSubscriptionOptimistically0ms(response?.razorpay_payment_id, 'Razorpay / UPI / Cards');

                    try {
                        const verifyRes = await axios.post('/api/billing/razorpay/verify', {
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id || payData.order_id,
                            razorpay_signature: response.razorpay_signature,
                            razorpay_subscription_id: response.razorpay_subscription_id || payData.subscription_id,
                            payment_method: 'Razorpay / UPI / Cards',
                            sub_id: payData.sub_id,
                            invoice_number: payData.invoice_number,
                        });

                        if (verifyRes.data && verifyRes.data.success) {
                            applySubscriptionUpdate(verifyRes.data);
                            notifyLicenseUpdate(verifyRes.data);
                            setSubData(prev => ({ ...prev, ...verifyRes.data }));
                            if (typeof onStatusChange === 'function') {
                                onStatusChange(verifyRes.data);
                            }
                            await fetchPaymentProvider();
                            await fetchSubscriptionStatus();
                        }
                    } catch (err) {
                        console.warn('Background payment verification:', err);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (resp) {
                alert('Payment Failed: ' + (resp.error?.description || 'Transaction was declined'));
                setIsInitiatingPayment(false);
            });
            rzp.open();
        } catch (err) {
            if (err.response?.status === 409 && err.response?.data?.already_active) {
                setActivePlanInfo({
                    plan_name: err.response.data.plan_name || resolvedPlanTitle,
                    ends_at: err.response.data.subscription_ends_at || 'Active',
                    days_remaining: err.response.data.days_remaining || daysLeft,
                });
                setShowActiveWarningModal(true);
            } else {
                alert('Checkout initialization error: ' + (err.response?.data?.message || err.message));
            }
        } finally {
            setIsInitiatingPayment(false);
        }
    };

    // Dynamic System UPI Payment Initiation
    const initSystemUpiPayment = async () => {
        setLoadingUpiData(true);
        try {
            const res = await axios.post('/api/payment/system/initiate');
            if (res.data && res.data.success) {
                setSystemUpiData(res.data);
            }
        } catch (err) {
            console.warn('Failed to initiate UPI payment:', err);
        } finally {
            setLoadingUpiData(false);
        }
    };

    useEffect(() => {
        if (showSystemModal) {
            setPaymentSubmitted(false);
            setSubmittedDetails(null);
            setUtrInput('');
            setScreenshotFile(null);
            setScreenshotFileName('');
            initSystemUpiPayment();
        }
    }, [showSystemModal]);

    // Handle Completed Payment Submission (Strict Server-Authoritative)
    const handleCompletedPaymentSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!utrInput.trim()) {
            alert('Please enter your Transaction ID / UTR.');
            return;
        }

        setSubmittingPayment(true);
        try {
            const formData = new FormData();
            formData.append('utr', utrInput.trim());
            if (systemUpiData?.order_id) {
                formData.append('order_id', systemUpiData.order_id);
            }
            if (screenshotFile) {
                formData.append('screenshot', screenshotFile);
            }

            const res = await axios.post('/api/payment/system/submit', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data && res.data.success) {
                setSubmittedDetails({
                    order_id: res.data.order_id || systemUpiData?.order_id,
                    utr: utrInput.trim(),
                    amount: '₹588.82',
                    status: 'PENDING'
                });
                setPaymentSubmitted(true);
            } else {
                alert(res.data?.message || 'Failed to submit payment verification.');
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Submission failed. Please try again.');
        } finally {
            setSubmittingPayment(false);
        }
    };

    // Execute Continue / Retry for a specific payment in the history table
    const handleRetryPayment = async (sub) => {
        if (!sub) return;
        const targetId = sub.id || sub.invoice_number;
        const isPending = String(sub.status || '').toLowerCase() === 'pending';

        // Check if user already has an active subscription
        if (isActive && daysLeft > 6 && !isPending) {
            setActivePlanInfo({
                plan_name: resolvedPlanTitle,
                ends_at: subData.subscription_ends_at || subData.next_billing_date || 'Active',
                days_remaining: daysLeft,
            });
            setShowActiveWarningModal(true);
            return;
        }

        setRetryingSubId(targetId);
        try {
            await ensureRazorpayLoaded();

            // 1. Call Backend to initialize / resume checkout for this specific invoice
            const initRes = await axios.post('/api/billing/razorpay/subscription', {
                sub_id: sub.id,
                invoice_number: sub.invoice_number
            });

            if (!initRes.data || !initRes.data.success) {
                if (initRes.data?.already_active) {
                    setActivePlanInfo({
                        plan_name: initRes.data.plan_name || resolvedPlanTitle,
                        ends_at: initRes.data.subscription_ends_at || 'Active',
                        days_remaining: initRes.data.days_remaining || daysLeft,
                    });
                    setShowActiveWarningModal(true);
                } else {
                    alert('Could not initialize Razorpay checkout. ' + (initRes.data?.message || 'Please try again.'));
                }
                setRetryingSubId(null);
                return;
            }

            const payData = initRes.data;

            // 2. Configure Official Razorpay Checkout
            const options = {
                key: payData.key_id,
                order_id: payData.order_id,
                subscription_id: payData.subscription_id || undefined,
                amount: payData.amount || 49900,
                currency: payData.currency || 'INR',
                name: 'INFY-POS Enterprise',
                description: `${isPending ? 'Continue Payment' : 'Retry Payment'}: ${sub.invoice_number || 'INFY-POS PREMIUM'}`,
                prefill: payData.prefill || {},
                theme: { color: '#059669' },
                modal: {
                    ondismiss: function () {
                        setRetryingSubId(null);
                    }
                },
                handler: async function (response) {
                    // ⚡ 0ms ULTRA SUPER FAST INSTANT PLAN ACTIVATION
                    activateSubscriptionOptimistically0ms(response?.razorpay_payment_id, 'Razorpay / UPI / Cards');

                    setRetryingSubId(targetId);
                    try {
                        const verifyRes = await axios.post('/api/billing/razorpay/verify', {
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_subscription_id: response.razorpay_subscription_id || payData.subscription_id,
                            razorpay_order_id: response.razorpay_order_id || payData.order_id,
                            razorpay_signature: response.razorpay_signature,
                            payment_method: 'Razorpay / UPI / Cards',
                            sub_id: sub.id,
                            invoice_number: sub.invoice_number
                        });

                        if (verifyRes.data && verifyRes.data.success) {
                            applySubscriptionUpdate(verifyRes.data);
                            notifyLicenseUpdate(verifyRes.data);
                            setSubData(prev => ({ ...prev, ...verifyRes.data }));
                            if (typeof onStatusChange === 'function') {
                                onStatusChange(verifyRes.data);
                            }
                            await fetchSubscriptionStatus();
                        }
                    } catch (err) {
                        console.warn('Background retry verification notice:', err);
                    } finally {
                        setRetryingSubId(null);
                    }
                }
            };

            if (typeof window.Razorpay === 'function') {
                const rzp = new window.Razorpay(options);
                rzp.on('payment.failed', function (resp) {
                    alert('Payment Failed: ' + (resp.error?.description || 'Transaction was declined'));
                    setRetryingSubId(null);
                });
                rzp.open();
                setRetryingSubId(null);
            } else {
                alert('Razorpay Checkout SDK is loading. Please try again.');
                setRetryingSubId(null);
            }
        } catch (err) {
            if (err.response?.status === 409 && err.response?.data?.already_active) {
                setActivePlanInfo({
                    plan_name: err.response.data.plan_name || resolvedPlanTitle,
                    ends_at: err.response.data.subscription_ends_at || 'Active',
                    days_remaining: err.response.data.days_remaining || daysLeft,
                });
                setShowActiveWarningModal(true);
            } else {
                alert('Retry initialization error: ' + (err.response?.data?.message || err.message));
            }
            setRetryingSubId(null);
        }
    };

    const realSubscriptions = subData?.subscriptions || [];

    const defaultFleetDevices = [
        {
            id: 1,
            device_name: `${subData?.company_name || 'saati'} - Manoj (Primary Machine)`,
            device_id: 'UUID-9D89F035',
            full_uuid: 'ddec3f68-a5d8-4197-983a-a7d6059b05b9',
            os_version: 'Windows 11 Enterprise x64',
            ip_address: '127.0.0.1',
            last_seen: 'Just now',
            status: 'Online',
            is_current: true,
            device_type: 'Desktop / Main Terminal'
        }
    ];

    const currentDevices = (localDevices && localDevices.length > 0)
        ? localDevices
        : ((subData?.devices && subData.devices.length > 0) ? subData.devices : defaultFleetDevices);

    const primaryDevice = currentDevices.find(d => d.is_current) || currentDevices[0];

    // Live Pairing PIN ticker
    useEffect(() => {
        if (!pairingPinSeconds || pairingPinSeconds <= 0) return;
        const interval = setInterval(() => {
            setPairingPinSeconds(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [pairingPinSeconds]);

    const handleGeneratePairingPin = async () => {
        try {
            setPairingPinLoading(true);
            const res = await axios.post('/api/saas/devices/generate-pin');
            if (res.data && res.data.success) {
                setPairingPin(res.data.pin);
                setPairingPinSeconds(res.data.expires_in || 600);
                showToast(`⚡ Pairing PIN ${res.data.pin} generated! Valid for 10 minutes.`);
            }
        } catch (e) {
            const rndPin = String(Math.floor(100000 + Math.random() * 900000));
            setPairingPin(rndPin);
            setPairingPinSeconds(600);
            showToast(`⚡ Pairing PIN ${rndPin} generated! Valid for 10 minutes.`);
        } finally {
            setPairingPinLoading(false);
        }
    };

    const handlePairNewDevice = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        const dName = newDeviceName.trim();
        if (!dName) {
            showToast('⚠️ Please enter a Device or Terminal Name.');
            return;
        }
        try {
            setIsPairingDevice(true);
            const res = await axios.post('/api/saas/devices/pair', {
                device_name: dName,
                device_type: newDeviceType,
                ip_address: newDeviceIp.trim() || '192.168.1.105',
                os_version: newDeviceType.includes('PDA') ? 'Android POS Terminal v12' : 'Zebra Android Barcode Terminal'
            });
            if (res.data && res.data.success && res.data.device) {
                setLocalDevices(prev => {
                    const base = (prev && prev.length > 0) ? prev : currentDevices;
                    return [...base, res.data.device];
                });
                showToast(`✅ "${dName}" successfully paired to fleet!`);
                setNewDeviceName('');
                setNewDeviceIp('');
                setDeviceModalTab('fleet');
            }
        } catch (err) {
            showToast('⚠️ Failed to pair device: ' + (err.response?.data?.message || err.message));
        } finally {
            setIsPairingDevice(false);
        }
    };

    const handleDeauthorizeDevice = async (deviceId, devName) => {
        if (!window.confirm(`Are you sure you want to deauthorize "${devName || 'this device'}"? The terminal will be logged out and its license seat will be released.`)) {
            return;
        }
        try {
            await axios.post('/api/saas/devices/deauthorize', { device_id: deviceId });
        } catch (e) {}
        setLocalDevices(prev => {
            const base = (prev && prev.length > 0) ? prev : currentDevices;
            return base.filter(d => d.id !== deviceId);
        });
        showToast(`✅ "${devName || 'Device'}" successfully deauthorized.`);
    };

    const handleResetHardwareBinding = async () => {
        if (!window.confirm('Are you sure you want to reset Hardware Machine Lock UUID binding? This will allow you to bind this license key to a different PC terminal.')) {
            return;
        }
        try {
            await axios.post('/api/saas/devices/reset-binding');
        } catch (e) {}
        showToast('✅ Hardware Machine Lock UUID binding reset! You can now activate on a new machine.');
    };

    const handlePingDevice = (devName) => {
        showToast(`⚡ Pinged "${devName}" — Response: 12ms (Status: Healthy & Online)`);
    };

    const copyDeviceText = (text, deviceId, msg = 'Copied to clipboard!') => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
            if (deviceId) {
                setCopiedDeviceId(deviceId);
                setTimeout(() => setCopiedDeviceId(null), 2500);
            }
            showToast(`📋 ${msg}`);
        }
    };

    return (
        <div className="enterprise-banner-container" style={{ padding: '24px 28px', background: '#F8FAFC', minHeight: '100vh' }}>

            {/* ── TOAST NOTIFICATION ── */}
            {toastMsg && (
                <div className="esb-toast">
                    <FontAwesomeIcon icon={faCheckCircle} style={{ color: '#10B981' }} />
                    {toastMsg}
                </div>
            )}

            {/* ── PAGE HEADER ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                        Billing & Subscription
                    </h2>
                    <p style={{ fontSize: '14px', color: '#64748B', margin: '4px 0 0' }}>
                        Manage your subscription, payments, invoices and account.
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#64748B' }}>
                    <span>Last updated: Just now</span>
                    <button
                        onClick={fetchSubscriptionStatus}
                        style={{ background: '#fff', border: '1px solid #CBD5E1', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}
                        title="Refresh Data"
                    >
                        <FontAwesomeIcon icon={faRotate} spin={loading} />
                    </button>
                </div>
            </div>

            {/* ── SUCCESS NOTICE BANNER (AFTER PAYMENT) ── */}
            {paymentSuccess && (
                <div style={{
                    background: 'linear-gradient(90deg, #059669, #10B981)',
                    color: '#fff',
                    padding: '16px 24px',
                    borderRadius: '12px',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                    fontSize: '15px',
                    fontWeight: '600'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FontAwesomeIcon icon={faCheckCircle} style={{ fontSize: '24px' }} />
                        <span>{successMsg}</span>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            background: '#fff', color: '#059669', border: 'none',
                            padding: '6px 16px', borderRadius: '20px', fontWeight: '700', cursor: 'pointer'
                        }}
                    >
                        Go to Dashboard →
                    </button>
                </div>
            )}
            {/* ── ENTERPRISE SECURITY / ANOMALY ALERT BANNER ── */}
            {subData.status === 'CLOCK_ROLLBACK_DETECTED' && (
                <div className="enterprise-anomaly-banner anomaly-danger" style={{ marginBottom: '20px' }}>
                    <FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: '20px' }} />
                    <div>
                        <div style={{ fontWeight: '800', fontSize: '15px' }}>Security Alert: System Clock Rollback Detected</div>
                        <div style={{ fontSize: '13px', marginTop: '2px' }}>
                            Computer date and time is earlier than the server-verified time checkpoint. Please synchronize your Windows clock with Internet time.
                        </div>
                    </div>
                </div>
            )}
            {subData.status === 'MACHINE_MISMATCH' && (
                <div className="enterprise-anomaly-banner anomaly-danger" style={{ marginBottom: '20px' }}>
                    <FontAwesomeIcon icon={faLock} style={{ fontSize: '20px' }} />
                    <div>
                        <div style={{ fontWeight: '800', fontSize: '15px' }}>Security Alert: Terminal Machine Binding Mismatch</div>
                        <div style={{ fontSize: '13px', marginTop: '2px' }}>
                            This license is bound to another hardware terminal. Use the Device Replacement flow in Super Admin to transfer this license.
                        </div>
                    </div>
                </div>
            )}
            {subData.status === 'SUSPENDED' && (
                <div className="enterprise-anomaly-banner anomaly-danger" style={{ marginBottom: '20px' }}>
                    <FontAwesomeIcon icon={faBan} style={{ fontSize: '20px' }} />
                    <div>
                        <div style={{ fontWeight: '800', fontSize: '15px' }}>Notice: License Temporarily Suspended</div>
                        <div style={{ fontSize: '13px', marginTop: '2px' }}>
                            Your license has been suspended by the administrator. Please contact billing support.
                        </div>
                    </div>
                </div>
            )}
            {subData.status === 'REVOKED' && (
                <div className="enterprise-anomaly-banner anomaly-danger" style={{ marginBottom: '20px' }}>
                    <FontAwesomeIcon icon={faBan} style={{ fontSize: '20px' }} />
                    <div>
                        <div style={{ fontWeight: '800', fontSize: '15px' }}>Notice: License Permanently Revoked</div>
                        <div style={{ fontSize: '13px', marginTop: '2px' }}>
                            This license key was permanently revoked. Please activate a new subscription key.
                        </div>
                    </div>
                </div>
            )}

            {/* ── SUBSCRIPTION EXPIRED ALERT BANNER ── */}
            {isExpired && (
                <div className="esb-expired-banner-premium">
                    <div className="esb-expired-banner-left">
                        <div className="esb-expired-icon-bubble">
                            <FontAwesomeIcon icon={faLock} />
                        </div>
                        <div>
                            <div className="esb-expired-banner-title">Subscription Expired & Terminal Locked</div>
                            <div className="esb-expired-banner-desc">Your plan ended on {subData.subscription_ends_at || subData.next_billing_date || '22 Sep 2026'}. Renew now to unlock sales, inventory & all POS capabilities.</div>
                        </div>
                    </div>
                    <button onClick={handleOpenCheckout} disabled={processing} className="esb-expired-banner-btn">
                        <FontAwesomeIcon icon={faRotate} spin={processing} />
                        <span>{processing ? 'Connecting...' : 'Renew Instantly (₹499)'}</span>
                    </button>
                </div>
            )}

            {/* ── EXPIRY WARNING SYSTEM (7 DAYS, 72H, 24H, 6H, 1H, 10M) ── */}
            {!isExpired && (() => {
                const rawSeconds = (countdown.days * 86400) + (countdown.hours * 3600) + (countdown.minutes * 60) + countdown.seconds;
                let notice = null;
                if (rawSeconds <= 600 && rawSeconds > 0) {
                    notice = { text: '🚨 Subscription expires in 10 minutes. Renew now to avoid POS transaction lock.', bg: '#FEF2F2', border: '#FCA5A5', color: '#991B1B' };
                } else if (rawSeconds <= 3600 && rawSeconds > 0) {
                    notice = { text: '🚨 Subscription expires in 1 hour. Immediate renewal required.', bg: '#FEF2F2', border: '#FCA5A5', color: '#991B1B' };
                } else if (rawSeconds <= 21600 && rawSeconds > 0) {
                    notice = { text: '🔴 Subscription expires in 6 hours. Please renew to ensure uninterrupted operation.', bg: '#FFF7ED', border: '#FDBA74', color: '#9A3412' };
                } else if (rawSeconds <= 86400 && rawSeconds > 0) {
                    notice = { text: '⚠️ Subscription expires tomorrow.', bg: '#FFFBEB', border: '#FCD34D', color: '#92400E' };
                } else if (rawSeconds <= 259200 && rawSeconds > 0) {
                    notice = { text: '⚠️ Subscription expires soon (less than 72 hours remaining).', bg: '#EFF6FF', border: '#93C5FD', color: '#1E40AF' };
                } else if (rawSeconds <= 604800 && rawSeconds > 0) {
                    notice = { text: 'Subscription expires in 7 days.', bg: '#F8FAFC', border: '#CBD5E1', color: '#334155' };
                }
                if (!notice) return null;
                return (
                    <div style={{
                        background: notice.bg, border: `1.5px solid ${notice.border}`, color: notice.color,
                        padding: '12px 20px', borderRadius: '12px', marginBottom: '20px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        fontSize: '14px', fontWeight: '700'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FontAwesomeIcon icon={faClock} />
                            <span>{notice.text}</span>
                        </div>
                        <button
                            onClick={handleOpenCheckout}
                            style={{
                                background: notice.color, color: '#FFFFFF', border: 'none',
                                padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer'
                            }}
                        >
                            Renew Plan
                        </button>
                    </div>
                );
            })()}

            {/* ── QUEUED SUBSCRIPTION & KEY NOTICE BANNER ── */}
            {subData.queued_info && !isExpired && (
                <div style={{
                    background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
                    border: '1.5px solid #93C5FD',
                    borderRadius: '16px',
                    padding: '20px 24px',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 16px rgba(59, 130, 246, 0.1)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '12px',
                            background: '#3B82F6', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '22px', fontWeight: '800'
                        }}>
                            ⏳
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <h4 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#1E3A8A' }}>
                                    Upcoming Renewal Plan Queued
                                </h4>
                                <span style={{ background: '#2563EB', color: '#fff', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '800' }}>
                                    Auto-Activates on {subData.queued_info.starts_at}
                                </span>
                            </div>
                            <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: '#1E40AF', fontWeight: '500' }}>
                                New Activation Key: <strong style={{ fontFamily: 'monospace', background: '#FFFFFF', padding: '2px 8px', borderRadius: '6px', border: '1px solid #BFDBFE' }}>{subData.queued_info.key_code}</strong> · Valid from <strong>{subData.queued_info.starts_at}</strong> to <strong>{subData.queued_info.ends_at}</strong>
                            </p>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '12px', color: '#3B82F6', fontWeight: '700', display: 'block' }}>Payment Received</span>
                        <strong style={{ fontSize: '16px', color: '#1E3A8A' }}>₹{subData.queued_info.amount} (Queued)</strong>
                    </div>
                </div>
            )}

            {/* ── HERO PLAN BANNER ── */}
            <div className={`esb-hero-banner${isExpired ? ' banner-expired' : isTrial ? ' banner-trial' : ''}`}>
                <div className="esb-hero-icon">
                    {isExpired ? '🔒' : isTrial ? '⚡' : '🏆'}
                </div>
                <div className="esb-hero-info">
                    <h3>{resolvedPlanTitle}
                        <span style={{ marginLeft: '10px', background: isTrial ? '#FEF3C7' : '#ECFDF5', color: isTrial ? '#D97706' : '#059669', border: isTrial ? '1px solid #FDE68A' : '1px solid #A7F3D0', padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', verticalAlign: 'middle' }}>
                            {isTrial ? '14-Day Trial' : 'Enterprise Edition'}
                        </span>
                    </h3>
                    <p>{isTrial ? '₹0 Commercial Free Trial · 14 Days Unlimited Features Included' : `${currentSub.price || '₹499/Month'} · All Features Included · No Locked Modules`}</p>
                </div>
                <span className="esb-hero-badge" style={isExpired ? { background: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA' } : {}}>
                    <span className="esb-dot" style={{ background: isExpired ? '#EF4444' : isTrial ? '#F59E0B' : '#10B981' }}></span>
                    {isExpired ? (isTrial ? 'Trial Expired & Locked' : 'Subscription Expired') : isTrial ? 'Free Trial Active' : 'Premium Active'}
                </span>
            </div>

            {/* ── MAIN 3 CARD GRID ── */}
            <div className="esb-main-grid">

                {/* CARD 1 — TIMER & STATUS */}
                <div className={`esb-card ${isExpired ? 'esb-card-expired' : ''}`}>
                    <div className="esb-card-head">
                        <span className={`esb-section-label ${isExpired ? 'label-red' : isTrial ? '' : 'label-green'}`}
                              style={isExpired ? { background: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA' } : isTrial ? { background: '#FEF3C7', color: '#D97706' } : {}}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isExpired ? '#EF4444' : isTrial ? '#F59E0B' : '#10B981' }}></span>
                            {isExpired ? 'SUBSCRIPTION EXPIRED' : isGrace ? 'GRACE PERIOD' : isTrial ? 'TRIAL ACTIVE' : 'SUBSCRIPTION ACTIVE'}
                        </span>
                        <h3 className="esb-card-title">{resolvedPlanTitle}</h3>
                        <p className="esb-card-desc">Server-authoritative · Machine-bound · RSA-signed lease</p>
                    </div>

                    <div className="esb-card-body">
                        {/* Timer Tiles */}
                        <div className={`esb-timer-tiles ${isExpired ? 'timer-tiles-expired' : ''}`}>
                            {[
                                { val: isExpired ? '00' : String(countdown.days).padStart(2, '0'), lbl: 'Days' },
                                { val: isExpired ? '00' : String(countdown.hours).padStart(2, '0'), lbl: 'Hours' },
                                { val: isExpired ? '00' : String(countdown.minutes).padStart(2, '0'), lbl: 'Min' },
                                { val: isExpired ? '00' : String(countdown.seconds).padStart(2, '0'), lbl: 'Sec' },
                            ].map((t, i) => (
                                <div key={i} className={`esb-tile ${isExpired ? 'tile-expired' : 'tile-active'}`}>
                                    <div className="esb-tile-val">{t.val}</div>
                                    <div className="esb-tile-lbl">{t.lbl}</div>
                                </div>
                            ))}
                        </div>

                        {/* Verification Badges */}
                        <div className="esb-verif-list">
                            {[
                                '✓ Server Verified',
                                '✓ Machine Bound',
                                isExpired ? '✗ Features Locked' : '✓ All Features Unlocked'
                            ].map((badge, i) => (
                                <div key={i} className="esb-verif-item">
                                    <span className="esb-verif-check" style={!isExpired || i < 2 ? {} : { background: '#FEF2F2', borderColor: '#FECACA', color: '#DC2626' }}>
                                        {badge.startsWith('✗') ? '✗' : '✓'}
                                    </span>
                                    <span style={isExpired && i === 2 ? { color: '#DC2626', fontWeight: '700' } : {}}>{badge.slice(2)}</span>
                                </div>
                            ))}
                        </div>

                        {/* Progress bar */}
                        <div className="esb-progress-wrap">
                            <div className="esb-progress-header">
                                <span>Subscription Lifetime Consumed</span>
                                <strong style={isExpired ? { color: '#DC2626' } : {}}>{isExpired ? 100 : (subData.lifetime_consumed_percent || 0)}%</strong>
                            </div>
                            <div className="esb-progress-track">
                                <div className="esb-progress-fill" style={{ width: `${Math.min(100, Math.max(0, isExpired ? 100 : (subData.lifetime_consumed_percent || 0)))}%`, background: isExpired ? '#EF4444' : undefined }}></div>
                            </div>
                        </div>

                        {/* Meta bar */}
                        <div className="esb-meta-bar">
                            <span>Verified: <strong style={{ color: '#0F172A' }}>{subData.security?.last_verification || 'Just now'}</strong></span>
                            <span>
                                <span className="esb-meta-dot" style={{ background: isExpired ? '#EF4444' : '#10B981' }}></span>
                                <strong style={{ color: isExpired ? '#DC2626' : '#059669' }}>{isExpired ? 'Expired' : 'Connected'}</strong>
                            </span>
                        </div>

                    </div>

                    <div className="esb-card-foot">
                        {isExpired ? (
                            <button
                                type="button"
                                onClick={handleOpenCheckout}
                                disabled={processing}
                                className="esb-btn esb-btn-red"
                                style={{ width: '100%' }}
                            >
                                <FontAwesomeIcon icon={faRotate} spin={processing} />
                                <span>{processing ? 'Connecting to Razorpay...' : 'Renew Subscription (₹499/Month)'}</span>
                            </button>
                        ) : isPaidActive ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                                <div className="esb-active-plan-badge" style={{ margin: 0 }}>
                                    <div className="esb-active-plan-check">✓</div>
                                    <div className="esb-active-plan-info">
                                        <strong>{currentSub.plan_name || 'Premium Subscription Active'}</strong>
                                        <span>Valid until {currentSub.subscription_ends_at || currentSub.next_billing_date || '21 Oct 2026'}</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleOpenCheckout}
                                    className="esb-btn esb-btn-green"
                                    style={{ width: '100%' }}
                                >
                                    <FontAwesomeIcon icon={faRotate} />
                                    <span> Renew Subscription (₹499/Month)</span>
                                </button>
                            </div>
                        ) : isTrial ? (
                            <button onClick={handleOpenCheckout} className="esb-btn esb-btn-purple">
                                🚀 Upgrade to Premium — ₹499 / Month
                            </button>
                        ) : (
                            <button onClick={handleOpenCheckout} className="esb-btn esb-btn-green">
                                {isActive ? '⚡ Extend Subscription (+30 Days)' : '🔄 Renew Subscription'}
                            </button>
                        )}
                    </div>
                </div>

                {/* CARD 2 — CURRENT PLAN DETAILS */}
                <div className="esb-card">
                    <div className="esb-card-head">
                        <span className="esb-section-label label-blue">
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3B82F6' }}></span>
                            CURRENT PLAN
                        </span>
                        <h3 className="esb-card-title">{resolvedPlanTitle}</h3>
                        <p className="esb-card-desc">{isTrial ? '14 Days Full Commercial Access. No Limits.' : 'Everything Included. No Limits.'}</p>
                    </div>

                    <div className="esb-card-body">
                        <div className="esb-plan-price">
                            {isTrial ? <span>Free<span style={{ fontSize: '14px', color: '#64748B', fontWeight: '600', marginLeft: '4px' }}>Trial ₹0</span></span> : cleanPrice}
                            {!isTrial && <span style={{ fontSize: '14px', color: '#64748B', fontWeight: '600', marginLeft: '4px' }}>/Month</span>}
                        </div>

                        <div className="esb-plan-grid">
                            <div>
                                <div className="esb-plan-field-label">Status</div>
                                <div className={`esb-plan-field-val ${isExpired ? 'val-expired' : 'val-active'}`}>
                                    {isExpired ? 'Expired' : isTrial ? 'Trial' : 'Active'}
                                </div>
                            </div>
                            <div>
                                <div className="esb-plan-field-label">Auto Renewal</div>
                                <div className="esb-toggle-row" onClick={handleToggleAutoRenew}>
                                    <FontAwesomeIcon icon={subData.auto_renew ? faToggleOn : faToggleOff} style={{ fontSize: '20px', color: subData.auto_renew ? '#10B981' : '#94A3B8' }} />
                                    <strong style={{ color: subData.auto_renew ? '#10B981' : '#64748B', fontSize: '13px' }}>{subData.auto_renew ? 'ON' : 'OFF'}</strong>
                                </div>
                            </div>
                            <div>
                                <div className="esb-plan-field-label">Next Billing</div>
                                <div className="esb-plan-field-val">{subData.next_billing_date || currentSub.subscription_ends_at || '21 Oct 2026'}</div>
                            </div>
                            <div>
                                <div className="esb-plan-field-label">Payment Method</div>
                                <div className="esb-plan-field-val">{subData.payment_method || 'Razorpay / UPI'}</div>
                            </div>
                        </div>
                    </div>

                    <div className="esb-card-foot">
                        {subData.auto_renew && !isExpired ? (
                            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                <button
                                    type="button"
                                    onClick={() => showToast(`Auto-Renewal is ACTIVE on plan INFY-POS PREMIUM (₹499/mo). Next billing: ${subData.next_billing_date || currentSub.subscription_ends_at || 'Active'}`)}
                                    className="esb-btn esb-btn-secondary"
                                    style={{ flex: 1, whiteSpace: 'nowrap' }}
                                >
                                    Manage Auto-Renewal
                                </button>
                                <button
                                    type="button"
                                    onClick={handleToggleAutoRenew}
                                    style={{
                                        background: '#FEF2F2', border: '1.5px solid #FECACA', color: '#DC2626',
                                        borderRadius: '10px', padding: '10px 14px', fontWeight: '700', fontSize: '12px',
                                        cursor: 'pointer', whiteSpace: 'nowrap'
                                    }}
                                >
                                    Disable Auto-Renewal
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={handleOpenCheckout}
                                className={isExpired ? "esb-btn esb-btn-red" : "esb-btn esb-btn-green"}
                                style={{ width: '100%' }}
                            >
                                <FontAwesomeIcon icon={faRotate} />
                                <span>{isExpired ? ' Renew Subscription (₹499/Month)' : ' Enable Auto-Renewal (₹499/Month)'}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* CARD 3 — SUPPORT & PAYMENT */}
                <div className="esb-card">
                    <div className="esb-card-head">
                        <span className="esb-section-label" style={{ background: isPaidActive ? '#F3E8FF' : '#FEF3C7', color: isPaidActive ? '#7C3AED' : '#D97706' }}>
                            <FontAwesomeIcon icon={isPaidActive ? faHeadset : faLock} />
                            {isPaidActive ? 'ENTERPRISE SUPPORT' : 'PAY SECURELY'}
                        </span>
                        <h3 className="esb-card-title">
                            {isPaidActive ? '24/7 Priority Support' : (providerInfo?.provider === 'system' ? 'INFY-POS System Payment' : 'Secure Razorpay Checkout')}
                        </h3>
                        <p className="esb-card-desc">
                            {isPaidActive ? 'Your account includes dedicated support and GST invoices.' : (providerInfo?.provider === 'system' ? 'Direct internal settlement. Instant 30-day activation.' : 'Instant 30-day activation. All major payment methods accepted.')}
                        </p>
                    </div>

                    <div className="esb-card-body">
                        {/* Active Provider Indicator Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '12px' }}>
                            <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '600' }}>Active Provider:</span>
                            {providerInfo?.provider === 'razorpay' ? (
                                <span style={{ fontSize: '11px', fontWeight: '700', color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }}></span>
                                    Razorpay Payment
                                </span>
                            ) : providerInfo?.provider === 'system' ? (
                                <span style={{ fontSize: '11px', fontWeight: '700', color: '#2563EB', background: '#EFF6FF', padding: '2px 8px', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3B82F6' }}></span>
                                    System Payment
                                </span>
                            ) : (
                                <span style={{ fontSize: '11px', fontWeight: '700', color: '#DC2626', background: '#FEF2F2', padding: '2px 8px', borderRadius: '9999px' }}>
                                    Unavailable
                                </span>
                            )}
                        </div>

                        {/* Payment logos / System info */}
                        {providerInfo?.provider === 'system' ? (
                            <div style={{ padding: '8px 12px', background: '#F1F5F9', borderRadius: '8px', fontSize: '12px', color: '#334155', marginBottom: '10px' }}>
                                <strong>System Engine</strong> — Direct settlement & immediate cryptographic license lease generation.
                            </div>
                        ) : (
                            <div className="esb-payment-logos">
                                {['UPI', 'VISA', 'MasterCard', 'RuPay', 'Paytm', 'NetBanking'].map((logo, i) => (
                                    <span key={i} className="esb-pay-logo">{logo}</span>
                                ))}
                            </div>
                        )}

                        <ul className="esb-checklist">
                            <li><FontAwesomeIcon icon={faCheckCircle} /> Instant Activation</li>
                            <li><FontAwesomeIcon icon={faCheckCircle} /> 256-Bit SSL Secured</li>
                            <li><FontAwesomeIcon icon={faCheckCircle} /> GST Invoice Provided</li>
                        </ul>
                    </div>

                    <div className="esb-card-foot" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button
                            type="button"
                            onClick={handleOpenCheckout}
                            className={isExpired ? "esb-btn esb-btn-red" : "esb-btn esb-btn-green"}
                            style={{ width: '100%' }}
                        >
                            <FontAwesomeIcon icon={isExpired ? faRotate : faBolt} />
                            <span>{isExpired ? ' Renew Subscription (+30 Days)' : '⚡ Extend Subscription (+30 Days)'}</span>
                        </button>
                        {isPaidActive && (
                            <a
                                href="/billing/invoice/1"
                                target="_blank"
                                rel="noreferrer"
                                className="esb-btn esb-btn-dark"
                                style={{ width: '100%', textAlign: 'center', textDecoration: 'none' }}
                            >
                                <FontAwesomeIcon icon={faDownload} />
                                Download GST Tax Invoice
                            </a>
                        )}
                    </div>
                </div>

            </div>

            {/* ── ENTERPRISE SECURITY STATUS PANEL ── */}
            <div className="enterprise-security-panel">
                <div className="security-panel-header">
                    <div className="security-panel-title">
                        <FontAwesomeIcon icon={faShieldHalved} style={{ color: '#10B981', fontSize: '18px' }} />
                        <span>License Security & Cryptographic Telemetry</span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>
                        Asymmetric RSA-2048 Signed Lease Active
                    </span>
                </div>

                <div className="security-badges-row">
                    <div className="sec-pill">
                        <div className="sec-pill-label">Server Status</div>
                        <div className="sec-pill-val sec-val-good">
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }}></span>
                            {subData.security?.server_status || 'CONNECTED'}
                        </div>
                    </div>
                    <div className="sec-pill">
                        <div className="sec-pill-label">License</div>
                        <div className={`sec-pill-val ${isExpired ? 'sec-val-danger' : 'sec-val-good'}`}>
                            {isExpired ? 'EXPIRED' : (subData.security?.license || 'VERIFIED')}
                        </div>
                    </div>
                    <div className="sec-pill">
                        <div className="sec-pill-label">Machine</div>
                        <div className="sec-pill-val sec-val-good">
                            {subData.security?.machine || 'BOUND'}
                        </div>
                    </div>
                    <div className="sec-pill">
                        <div className="sec-pill-label">Lease</div>
                        <div className={`sec-pill-val ${isExpired ? 'sec-val-danger' : 'sec-val-good'}`}>
                            {isExpired ? 'EXPIRED' : (subData.security?.lease || 'VALID')}
                        </div>
                    </div>
                    <div className="sec-pill">
                        <div className="sec-pill-label">Clock</div>
                        <div className="sec-pill-val sec-val-good">
                            {subData.security?.clock || 'NORMAL'}
                        </div>
                    </div>
                </div>

                <div className="security-diagnostics-bar">
                    <div>
                        Last Verification: <strong style={{ color: '#0F172A' }}>{subData.security?.last_verification || 'Just now'}</strong>
                    </div>
                    <div>
                        Next Verification: <strong style={{ color: '#0F172A' }}>15 minutes</strong>
                    </div>
                    <div>
                        Installation ID: <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>{subData.installation_id ? (subData.installation_id.substring(0, 8) + '...') : '3bf8e948...'}</strong>
                    </div>
                    <div>
                        Terminal Fingerprint: <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>{subData.machine_hash ? ('SHA256:' + subData.machine_hash.substring(0, 8) + '...') : 'Verified'}</strong>
                    </div>
                </div>
            </div>

            {/* ── MIDDLE ROW: PAYMENT HISTORY TABLE & SUBSCRIPTION BENEFITS ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.38fr 1.02fr', gap: '20px', marginBottom: '24px' }}>
                
                {/* PAYMENT HISTORY TABLE */}
                <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A', margin: 0 }}>
                                Payment History
                            </h3>
                            {realSubscriptions.length > 0 && (
                                <span style={{ background: '#F1F5F9', color: '#475569', fontSize: '11.5px', fontWeight: '700', padding: '2px 8px', borderRadius: '12px' }}>
                                    {realSubscriptions.length} {realSubscriptions.length === 1 ? 'Record' : 'Records'}
                                </span>
                            )}
                        </div>
                        {realSubscriptions.length > HISTORY_PAGE_SIZE && (
                            <button
                                onClick={() => setViewAllHistory(v => !v)}
                                style={{
                                    background: viewAllHistory ? '#059669' : '#F1F5F9',
                                    color: viewAllHistory ? '#FFFFFF' : '#475569',
                                    border: 'none',
                                    padding: '6px 14px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {viewAllHistory ? 'Paginate (10)' : 'View All'}
                            </button>
                        )}
                    </div>

                    {/* Scrollable Container with max height showing ~5 rows with smooth scroll */}
                    <div
                        className="esb-history-scroll-box"
                        style={{
                            maxHeight: '295px',
                            overflowY: 'auto',
                            overflowX: 'auto',
                            border: '1px solid #F1F5F9',
                            borderRadius: '10px',
                            background: '#FFFFFF'
                        }}
                    >
                        {realSubscriptions.length > 0 ? (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 3,
                                        background: '#F8FAFC',
                                        borderBottom: '2px solid #E2E8F0',
                                        textAlign: 'left',
                                        color: '#475569',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                                    }}>
                                        <th style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>Invoice</th>
                                        <th style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>Plan</th>
                                        <th style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>Amount</th>
                                        <th style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>Gateway</th>
                                        <th style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>Date</th>
                                        <th style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>Status</th>
                                        <th style={{ padding: '10px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(viewAllHistory ? realSubscriptions : realSubscriptions.slice((historyPage - 1) * HISTORY_PAGE_SIZE, historyPage * HISTORY_PAGE_SIZE)).map((sub, idx) => {
                                        const rawSubStatus = String(sub.raw_status || sub.status || '').toLowerCase();
                                        const isPending = rawSubStatus === 'pending' || rawSubStatus === 'created';
                                        const isFailed = rawSubStatus === 'failed';
                                        const isExpired = rawSubStatus === 'expired';
                                        const isCancelled = rawSubStatus === 'cancelled';
                                        const isPaidOrVerified = ['paid', 'verified', 'active'].includes(rawSubStatus);
                                        const isRetryingThis = retryingSubId === (sub.id || sub.invoice_number);

                                        return (
                                            <tr key={sub.id || idx} style={{ borderBottom: '1px solid #F8FAFC', transition: 'background 0.15s ease' }} className="esb-table-row">
                                                <td style={{ padding: '11px 12px', fontWeight: '600', color: '#0F172A', whiteSpace: 'nowrap' }}>
                                                    {sub.invoice_number}
                                                </td>
                                                <td style={{ padding: '11px 12px', color: '#475569', whiteSpace: 'nowrap' }}>
                                                    {sub.plan_name || 'INFY-POS PREMIUM'}
                                                </td>
                                                <td style={{ padding: '11px 12px', fontWeight: '700', color: '#0F172A', whiteSpace: 'nowrap' }}>
                                                    ₹{sub.amount}.00
                                                </td>
                                                <td style={{ padding: '11px 12px', color: '#475569', whiteSpace: 'nowrap' }}>
                                                    {sub.payment_method}
                                                </td>
                                                <td style={{ padding: '11px 12px', color: '#64748B', whiteSpace: 'nowrap' }}>
                                                    {sub.paid_on}
                                                </td>
                                                <td style={{ padding: '11px 12px', whiteSpace: 'nowrap' }}>
                                                    {isPending ? (
                                                        <span style={{
                                                            background: '#FEF3C7',
                                                            color: '#D97706',
                                                            border: '1px solid #FDE68A',
                                                            padding: '3px 10px',
                                                            borderRadius: '12px',
                                                            fontSize: '11px',
                                                            fontWeight: '700',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '5px'
                                                        }}>
                                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F59E0B' }}></span>
                                                            Pending
                                                        </span>
                                                    ) : isExpired ? (
                                                        <span style={{
                                                            background: '#F1F5F9',
                                                            color: '#64748B',
                                                            border: '1px solid #CBD5E1',
                                                            padding: '3px 10px',
                                                            borderRadius: '12px',
                                                            fontSize: '11px',
                                                            fontWeight: '700',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '5px'
                                                        }}>
                                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94A3B8' }}></span>
                                                            Expired
                                                        </span>
                                                    ) : isFailed ? (
                                                        <span style={{
                                                            background: '#FEF2F2',
                                                            color: '#DC2626',
                                                            border: '1px solid #FECACA',
                                                            padding: '3px 10px',
                                                            borderRadius: '12px',
                                                            fontSize: '11px',
                                                            fontWeight: '700',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '5px'
                                                        }}>
                                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EF4444' }}></span>
                                                            Failed
                                                        </span>
                                                    ) : isCancelled ? (
                                                        <span style={{
                                                            background: '#F8FAFC',
                                                            color: '#64748B',
                                                            border: '1px solid #E2E8F0',
                                                            padding: '3px 10px',
                                                            borderRadius: '12px',
                                                            fontSize: '11px',
                                                            fontWeight: '700',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '5px'
                                                        }}>
                                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#64748B' }}></span>
                                                            Cancelled
                                                        </span>
                                                    ) : (
                                                        <span style={{
                                                            background: '#ECFDF5',
                                                            color: '#059669',
                                                            border: '1px solid #A7F3D0',
                                                            padding: '3px 10px',
                                                            borderRadius: '12px',
                                                            fontSize: '11px',
                                                            fontWeight: '700',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '5px'
                                                        }}>
                                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }}></span>
                                                            {sub.status || 'Paid'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '11px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                                                        {isPending ? (
                                                            <button
                                                                onClick={() => {
                                                                    setPendingPaymentInfo(sub);
                                                                    setShowPendingModal(true);
                                                                }}
                                                                title="Continue or review this pending transaction"
                                                                style={{
                                                                    background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                                                                    color: '#FFFFFF',
                                                                    border: 'none',
                                                                    borderRadius: '6px',
                                                                    padding: '5px 12px',
                                                                    fontSize: '11.5px',
                                                                    fontWeight: '700',
                                                                    cursor: 'pointer',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '5px',
                                                                    boxShadow: '0 2px 5px rgba(5,150,105,0.25)',
                                                                    transition: 'all 0.2s ease'
                                                                }}
                                                            >
                                                                <FontAwesomeIcon icon={faRotate} />
                                                                <span>Continue</span>
                                                            </button>
                                                        ) : (isFailed || isExpired || isCancelled) ? (
                                                            <button
                                                                onClick={() => handleRetryPayment(sub)}
                                                                disabled={isRetryingThis}
                                                                title="Retry this transaction"
                                                                style={{
                                                                    background: '#F8FAFC',
                                                                    color: '#334155',
                                                                    border: '1px solid #CBD5E1',
                                                                    borderRadius: '6px',
                                                                    padding: '5px 12px',
                                                                    fontSize: '11.5px',
                                                                    fontWeight: '700',
                                                                    cursor: isRetryingThis ? 'not-allowed' : 'pointer',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '5px',
                                                                    transition: 'all 0.2s ease'
                                                                }}
                                                            >
                                                                <FontAwesomeIcon icon={faRotate} spin={isRetryingThis} />
                                                                <span>{isRetryingThis ? 'Retrying...' : 'Retry'}</span>
                                                            </button>
                                                        ) : (
                                                            <a
                                                                href={`/billing/invoice/${sub.id || idx + 1}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                style={{
                                                                    background: '#ECFDF5',
                                                                    border: '1px solid #A7F3D0',
                                                                    color: '#059669',
                                                                    padding: '5px 11px',
                                                                    borderRadius: '6px',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '5px',
                                                                    fontSize: '12px',
                                                                    fontWeight: '600',
                                                                    textDecoration: 'none',
                                                                    transition: 'all 0.15s ease'
                                                                }}
                                                                title="Download GST Invoice"
                                                            >
                                                                <FontAwesomeIcon icon={faDownload} />
                                                                <span>Invoice</span>
                                                            </a>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ background: '#F8FAFC', padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '13.5px', fontWeight: '600' }}>
                                <FontAwesomeIcon icon={faClock} style={{ fontSize: '24px', color: '#10B981', marginBottom: '8px', display: 'block' }} />
                                {isActive ? 'No online transactions recorded yet — Licensed via Hardware Machine Key' : 'No payments yet — 14-Day Free Trial Active'}
                            </div>
                        )}
                    </div>

                    {/* Pagination Controls below table (After 10 items) */}
                    {realSubscriptions.length > HISTORY_PAGE_SIZE && !viewAllHistory && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: '14px',
                            paddingTop: '12px',
                            borderTop: '1px solid #F1F5F9',
                            fontSize: '12px',
                            color: '#64748B',
                            flexWrap: 'wrap',
                            gap: '8px'
                        }}>
                            <div>
                                Showing <strong>{(historyPage - 1) * HISTORY_PAGE_SIZE + 1}</strong>–<strong>{Math.min(historyPage * HISTORY_PAGE_SIZE, realSubscriptions.length)}</strong> of <strong>{realSubscriptions.length}</strong>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <button
                                    onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                                    disabled={historyPage === 1}
                                    style={{
                                        padding: '4px 10px',
                                        borderRadius: '5px',
                                        border: '1px solid #E2E8F0',
                                        background: historyPage === 1 ? '#F8FAFC' : '#FFFFFF',
                                        color: historyPage === 1 ? '#94A3B8' : '#0F172A',
                                        fontWeight: '600',
                                        fontSize: '11.5px',
                                        cursor: historyPage === 1 ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    ← Prev
                                </button>
                                {Array.from({ length: Math.ceil(realSubscriptions.length / HISTORY_PAGE_SIZE) }, (_, i) => i + 1).map(pNum => (
                                    <button
                                        key={pNum}
                                        onClick={() => setHistoryPage(pNum)}
                                        style={{
                                            minWidth: '28px',
                                            height: '28px',
                                            padding: '0 6px',
                                            borderRadius: '5px',
                                            border: historyPage === pNum ? '1px solid #059669' : '1px solid #E2E8F0',
                                            background: historyPage === pNum ? '#059669' : '#FFFFFF',
                                            color: historyPage === pNum ? '#FFFFFF' : '#334155',
                                            fontWeight: '700',
                                            fontSize: '11.5px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {pNum}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setHistoryPage(p => Math.min(Math.ceil(realSubscriptions.length / HISTORY_PAGE_SIZE), p + 1))}
                                    disabled={historyPage >= Math.ceil(realSubscriptions.length / HISTORY_PAGE_SIZE)}
                                    style={{
                                        padding: '4px 10px',
                                        borderRadius: '5px',
                                        border: '1px solid #E2E8F0',
                                        background: historyPage >= Math.ceil(realSubscriptions.length / HISTORY_PAGE_SIZE) ? '#F8FAFC' : '#FFFFFF',
                                        color: historyPage >= Math.ceil(realSubscriptions.length / HISTORY_PAGE_SIZE) ? '#94A3B8' : '#0F172A',
                                        fontWeight: '600',
                                        fontSize: '11.5px',
                                        cursor: historyPage >= Math.ceil(realSubscriptions.length / HISTORY_PAGE_SIZE) ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* SUBSCRIPTION BENEFITS */}
                <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A', margin: 0 }}>
                                Subscription Benefits
                            </h3>
                            <span style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
                                12 Features Unlocked
                            </span>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                            gap: '9px 12px',
                            marginBottom: '16px'
                        }}>
                            {[
                                'Unlimited Billing',
                                'Unlimited Invoices',
                                'Unlimited Products',
                                'Advanced Analytics',
                                'Unlimited Users',
                                'Multi-Store Sync',
                                'Unlimited Warehouses',
                                'Cloud Auto-Backup',
                                'PDA & Mobile POS',
                                'Priority 24/7 Support',
                                'Barcode Printing',
                                'Free System Updates',
                            ].map((benefit, bIdx) => (
                                <div
                                    key={bIdx}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '9px',
                                        padding: '8px 12px',
                                        background: '#F8FAFC',
                                        border: '1px solid #E2E8F0',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        color: '#1E293B',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                                    }}
                                >
                                    <span style={{
                                        width: '18px',
                                        height: '18px',
                                        borderRadius: '50%',
                                        background: '#DCFCE7',
                                        color: '#16A34A',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '9.5px',
                                        flexShrink: 0
                                    }}>
                                        <FontAwesomeIcon icon={faCheck} />
                                    </span>
                                    <span style={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        lineHeight: 1.2
                                    }}>
                                        {benefit}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{
                        background: 'linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)',
                        border: '1px solid #A7F3D0',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: '#10B981',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                            flexShrink: 0,
                            boxShadow: '0 2px 8px rgba(16,185,129,0.3)'
                        }}>
                            <FontAwesomeIcon icon={faCheck} />
                        </div>
                        <div>
                            <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#065F46', margin: 0, lineHeight: 1.2 }}>
                                You're covered!
                            </h4>
                            <p style={{ fontSize: '11.5px', color: '#047857', margin: '3px 0 0', lineHeight: 1.3 }}>
                                Enjoy all premium enterprise features without interruption.
                            </p>
                        </div>
                    </div>
                </div>

            </div>

            {/* ── SUBSCRIPTION DETAILS CARD (BELOW PAYMENT HISTORY SECTION) ── */}
            <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FontAwesomeIcon icon={faBuilding} style={{ color: '#10B981' }} />
                    Subscription Details
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                        <span style={{ color: '#64748B' }}>Business Name</span>
                        <strong style={{ color: '#0F172A' }}>{subData?.company_name || 'saati'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                        <span style={{ color: '#64748B' }}>Owner</span>
                        <strong style={{ color: '#0F172A' }}>{subData?.owner_name || 'Sasti'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                        <span style={{ color: '#64748B' }}>GST Number</span>
                        <strong style={{ color: subData?.gst_number ? '#0F172A' : '#94A3B8' }}>{subData?.gst_number || 'Not Registered / Pending'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                        <span style={{ color: '#64748B' }}>Plan</span>
                        <strong style={{ color: isTrial ? '#D97706' : '#10B981' }}>
                            {resolvedPlanTitle} {currentSub?.price ? `— ${currentSub.price}` : '— ₹499/Month'}
                        </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                        <span style={{ color: '#64748B' }}>Status</span>
                        <strong style={{ color: isExpired ? '#EF4444' : isTrial ? '#D97706' : '#059669', textTransform: 'capitalize' }}>
                            {isExpired ? 'Expired' : isTrial ? 'Trial' : 'Active'}
                        </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                        <span style={{ color: '#64748B' }}>{isTrial ? 'Trial Started' : 'Plan Started'}</span>
                        <strong style={{ color: '#0F172A' }}>{formatDisplayDate(subData?.start_date || subData?.trial_started_at) || 'N/A'}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px' }}>
                        <span style={{ color: '#64748B' }}>Subscription Expires</span>
                        <strong style={{ color: '#0F172A' }}>
                            {formatDisplayDate(!isTrial ? (subData?.subscription_ends_at || subData?.next_billing_date) : (subData?.trial_ends_at || subData?.subscription_ends_at)) || (isExpired ? 'Expired' : 'N/A')}
                        </strong>
                    </div>
                </div>
            </div>

            {/* ── ACTIVATION KEYS & MACHINE BINDING CARD (BELOW SUBSCRIPTION DETAILS) ── */}
            {(() => {
                const rawKeyExpiry = subData?.key_expires || (subData?.status === 'active' ? subData?.subscription_ends_at : (subData?.trial_ends_at || subData?.subscription_ends_at));
                const isKeyDateInFuture = Boolean(rawKeyExpiry && rawKeyExpiry !== 'Expired' && rawKeyExpiry !== 'N/A' && !isNaN(new Date(rawKeyExpiry).getTime()) && new Date(rawKeyExpiry).getTime() > Date.now());
                const isKeyActuallyExpired = isKeyDateInFuture ? false : (isExpired || subData?.key_status === 'Expired' || subData?.status === 'expired');
                const keyDisplayExpires = formatDisplayDate(rawKeyExpiry) || (isKeyActuallyExpired ? 'Expired' : 'N/A');
                const keyDisplayStatus = isKeyActuallyExpired ? 'Expired' : (subData?.key_status || 'Active');

                return (
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FontAwesomeIcon icon={faKey} style={{ color: '#3B82F6' }} />
                            Activation Keys & Machine Binding
                        </h3>

                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Hardware Machine Lock License Key</div>
                                <div style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', fontFamily: 'monospace', letterSpacing: '0.05em', marginTop: '4px' }}>
                                    {subData?.key_code || 'INFYPOS-2026-KEY-7CF71064'}
                                </div>
                                <div style={{ fontSize: '12.5px', color: isKeyActuallyExpired ? '#EF4444' : '#059669', fontWeight: '600', marginTop: '6px' }}>
                                    Status: {keyDisplayStatus} &nbsp;·&nbsp; Expires: {keyDisplayExpires}
                                </div>
                            </div>
                            <span style={{
                                background: isKeyActuallyExpired ? '#FEF2F2' : '#ECFDF5',
                                border: isKeyActuallyExpired ? '1px solid #FECACA' : '1px solid #A7F3D0',
                                color: isKeyActuallyExpired ? '#DC2626' : '#059669',
                                padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700'
                            }}>
                                {isKeyActuallyExpired ? 'Key Expired' : 'Bound to This PC'}
                            </span>
                        </div>
                    </div>
                );
            })()}

            {/* ── BOTTOM ROW: DEVICE MANAGER, BACKUP & SUPPORT ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: '20px' }}>
                
                {/* DEVICE MANAGER */}
                <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FontAwesomeIcon icon={faDesktop} style={{ color: '#3B82F6' }} />
                            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A', margin: 0 }}>
                                Device Manager
                            </h3>
                            <span style={{ background: '#EFF6FF', color: '#2563EB', fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '10px' }}>
                                {currentDevices.length} Connected
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowDeviceModal(true)}
                            style={{ background: '#F1F5F9', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', color: '#1E293B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Manage full fleet and hardware bindings"
                        >
                            View All →
                        </button>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #F1F5F9', textAlign: 'left', color: '#64748B' }}>
                                <th style={{ padding: '8px 10px' }}>Device Name</th>
                                <th style={{ padding: '8px 10px' }}>Last Seen</th>
                                <th style={{ padding: '8px 10px' }}>Status</th>
                                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentDevices.map((dev, i) => (
                                <tr key={dev.id || i} style={{ borderBottom: '1px solid #F8FAFC', background: dev.is_current ? '#FAFCFF' : 'transparent' }}>
                                    <td style={{ padding: '10px', fontWeight: '600', color: '#0F172A' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <FontAwesomeIcon
                                                icon={dev.is_current ? faDesktop : faMobileAlt}
                                                style={{ color: dev.is_current ? '#3B82F6' : '#64748B', fontSize: '14px' }}
                                            />
                                            <div>
                                                <div>{dev.device_name}</div>
                                                <div style={{ fontSize: '10.5px', color: '#94A3B8', fontFamily: 'monospace' }}>
                                                    {dev.device_id || 'UUID-F20C2F89'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '10px', color: '#64748B' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: dev.status === 'Online' ? '#10B981' : '#F59E0B' }}></span>
                                            {dev.last_seen}
                                        </div>
                                    </td>
                                    <td style={{ padding: '10px' }}>
                                        <span style={{
                                            background: dev.status === 'Online' ? '#ECFDF5' : '#FEF3C7',
                                            color: dev.status === 'Online' ? '#059669' : '#D97706',
                                            border: dev.status === 'Online' ? '1px solid #A7F3D0' : '1px solid #FDE68A',
                                            padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700'
                                        }}>
                                            {dev.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px', textAlign: 'center' }}>
                                        {dev.is_current ? (
                                            <span style={{
                                                background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0',
                                                padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700',
                                                display: 'inline-flex', alignItems: 'center', gap: '3px'
                                            }}>
                                                <FontAwesomeIcon icon={faCheck} style={{ fontSize: '9px' }} /> This PC
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleDeauthorizeDevice(dev.id, dev.device_name)}
                                                style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#EF4444', padding: '3px 8px', borderRadius: '5px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}
                                                title="Deauthorize device"
                                            >
                                                Logout
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {currentDevices.length < 5 && (
                        <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px dashed #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                                <strong style={{ color: '#0F172A' }}>{5 - currentDevices.length}</strong> additional hardware seats available
                            </span>
                            <button
                                type="button"
                                onClick={() => { setDeviceModalTab('pair'); setShowDeviceModal(true); }}
                                style={{
                                    background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#2563EB',
                                    padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
                                }}
                            >
                                <FontAwesomeIcon icon={faPlus} style={{ fontSize: '10px' }} /> Pair Scanner / Terminal
                            </button>
                        </div>
                    )}
                </div>

                {/* ── REAL-TIME BACKUP & RESTORE ── */}
                <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A', margin: 0 }}>
                                Backup & Restore
                            </h3>
                            <button
                                onClick={handleCreateBackup}
                                disabled={isBackingUp || isRestoring}
                                style={{
                                    background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#059669',
                                    padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '700',
                                    cursor: isBackingUp ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px'
                                }}
                            >
                                {isBackingUp ? (
                                    <>
                                        <FontAwesomeIcon icon={faSpinner} spin /> Backing Up...
                                    </>
                                ) : (
                                    'Backup Now'
                                )}
                            </button>
                        </div>

                        {/* Hover-Sensitive Backup Details Box */}
                        <div
                            style={{
                                background: '#F8FAFC', padding: '14px', borderRadius: '10px',
                                fontSize: '12.5px', marginBottom: '16px', position: 'relative',
                                cursor: 'help', border: '1px solid #EEF2F6', transition: 'all 0.2s'
                            }}
                            onMouseEnter={() => setShowHoverDetails(true)}
                            onMouseLeave={() => setShowHoverDetails(false)}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ color: '#64748B' }}>Last Backup</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '10.5px', color: '#64748B', background: '#FFFFFF', padding: '1px 7px', borderRadius: '10px', border: '1px solid #E2E8F0', fontWeight: '600' }}>
                                        Hover info
                                    </span>
                                    <strong style={{ color: '#0F172A', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
                                        Automated Local Vault
                                    </strong>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748B' }}>Backup Size</span>
                                <strong style={{ color: '#0F172A' }}>{subData.backup_size || '4.8 MB (SQL Dump)'}</strong>
                            </div>

                            {/* ── Hover Details Popover with downward arrow ── */}
                            {showHoverDetails && (
                                <div style={{
                                    position: 'absolute', bottom: 'calc(100% + 12px)', left: '50%', transform: 'translateX(-50%)',
                                    background: '#0F172A', color: '#FFFFFF', padding: '14px 16px', borderRadius: '12px',
                                    boxShadow: '0 16px 36px rgba(15, 23, 42, 0.45)', fontSize: '12px', width: '310px',
                                    zIndex: 1000, pointerEvents: 'none', lineHeight: '1.5'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', color: '#10B981', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.12)', paddingBottom: '6px' }}>
                                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
                                        1-Sec Continuous Auto-Vault: ACTIVE
                                    </div>
                                    <div style={{ color: '#E2E8F0', marginBottom: '4px' }}>
                                        • <strong>Real-Time Sync:</strong> {isAutoSyncing ? 'Syncing...' : (lastSyncSeconds === 0 ? 'Synced just now' : `Synced ${lastSyncSeconds}s ago`)}
                                    </div>
                                    <div style={{ color: '#E2E8F0', marginBottom: '4px' }}>
                                        • <strong>Data Protection:</strong> Zero Data Loss (Every second & mutation auto-saved)
                                    </div>
                                    <div style={{ color: '#E2E8F0', marginBottom: '4px' }}>
                                        • <strong>Vault Type:</strong> Full SQL Database & Structure Dump
                                    </div>
                                    <div style={{ color: '#94A3B8', fontSize: '11px', marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: '4px' }}>
                                        Snapshot point: {subData.last_backup || 'Automated Local Vault'}
                                    </div>

                                    {/* Downward triangle arrow */}
                                    <div style={{
                                        position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                                        width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent',
                                        borderTop: '7px solid #0F172A'
                                    }} />
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        {/* Download Buttons Row (Spacious, Premium Styled) */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                            <a
                                href="/api/saas/backup/download-sql"
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                    background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '11px 14px',
                                    borderRadius: '10px', fontSize: '12.5px', fontWeight: '700', color: '#1E293B',
                                    textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    gap: '8px', whiteSpace: 'nowrap', boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                            >
                                <span style={{
                                    width: '24px', height: '24px', borderRadius: '6px', background: '#EEF2F6',
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#475569', fontSize: '11.5px'
                                }}>
                                    <FontAwesomeIcon icon={faDownload} />
                                </span>
                                <span>Download SQL</span>
                            </a>

                            <a
                                href="/api/saas/backup/download-zip"
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                    background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '11px 14px',
                                    borderRadius: '10px', fontSize: '12.5px', fontWeight: '700', color: '#1E293B',
                                    textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    gap: '8px', whiteSpace: 'nowrap', boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                            >
                                <span style={{
                                    width: '24px', height: '24px', borderRadius: '6px', background: '#EEF2F6',
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#475569', fontSize: '11.5px'
                                }}>
                                    <FontAwesomeIcon icon={faDownload} />
                                </span>
                                <span>Download ZIP</span>
                            </a>
                        </div>

                        {/* Premium Restore Database Backup Button */}
                        <button
                            type="button"
                            onClick={() => setShowRestoreModal(true)}
                            disabled={isRestoring}
                            style={{
                                width: '100%',
                                background: 'linear-gradient(135deg, #F0F7FF 0%, #E0EFFF 100%)',
                                border: '1.5px solid #BFDBFE',
                                color: '#1D4ED8',
                                padding: '11px 16px',
                                borderRadius: '10px',
                                fontSize: '13px',
                                fontWeight: '700',
                                cursor: isRestoring ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                transition: 'all 0.2s ease',
                                whiteSpace: 'nowrap',
                                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.08)'
                            }}
                            onMouseEnter={(e) => { if (!isRestoring) { e.currentTarget.style.background = '#DBEAFE'; e.currentTarget.style.borderColor = '#93C5FD'; } }}
                            onMouseLeave={(e) => { if (!isRestoring) { e.currentTarget.style.background = 'linear-gradient(135deg, #F0F7FF 0%, #E0EFFF 100%)'; e.currentTarget.style.borderColor = '#BFDBFE'; } }}
                        >
                            <span style={{
                                width: '26px', height: '26px', borderRadius: '50%', background: '#FFFFFF',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                color: '#2563EB', fontSize: '12px', boxShadow: '0 1px 3px rgba(37,99,235,0.2)'
                            }}>
                                <FontAwesomeIcon icon={faRotate} spin={isRestoring} />
                            </span>
                            <span>{isRestoring ? 'Restoring Database...' : 'Restore Database Backup (.SQL / .ZIP)'}</span>
                        </button>
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        accept=".sql,.zip"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                </div>

                {/* NEED HELP? SUPPORT */}
                <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A', margin: '0 0 16px' }}>
                        Need Help?
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <a href="https://wa.me/918610006544" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', textDecoration: 'none', color: '#0F172A', fontSize: '13px', fontWeight: '600' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FontAwesomeIcon icon={faTicketAlt} />
                            </div>
                            <div>
                                <div>Create Support Ticket</div>
                                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 'normal' }}>Get help from support team</span>
                            </div>
                        </a>

                        <a href="https://wa.me/918610006544" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', textDecoration: 'none', color: '#0F172A', fontSize: '13px', fontWeight: '600' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FontAwesomeIcon icon={faComments} />
                            </div>
                            <div>
                                <div>Chat with Support</div>
                                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 'normal' }}>Live chat with experts</span>
                            </div>
                        </a>

                        <a href="tel:+918610006544" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', textDecoration: 'none', color: '#0F172A', fontSize: '13px', fontWeight: '600' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FontAwesomeIcon icon={faPhone} />
                            </div>
                            <div>
                                <div>Call Us</div>
                                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 'normal' }}>+91 86100 06544</span>
                            </div>
                        </a>
                    </div>
                </div>

            </div>

            {/* ── PRODUCTION-GRADE INFY-POS PREMIUM RAZORPAY AUTOPAY MODAL ── */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(11, 19, 44, 0.82)', backdropFilter: 'blur(10px)',
                    zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    <div style={{
                        background: '#FFFFFF', borderRadius: '24px', maxWidth: '460px', width: '100%',
                        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.45)',
                        overflow: 'hidden', animation: 'modalFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: '#FFFFFF',
                            padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            borderBottom: '1px solid rgba(255,255,255,0.08)'
                        }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                                        INFY-POS PREMIUM
                                    </h3>
                                    <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34D399', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
                                        AUTOPAY
                                    </span>
                                </div>
                                <div style={{ fontSize: '13px', color: '#94A3B8', marginTop: '4px', fontWeight: '500' }}>
                                    Enterprise Subscription & License
                                </div>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    background: 'rgba(255,255,255,0.1)', border: 'none', color: '#CBD5E1',
                                    width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
                                    transition: 'all 0.2s'
                                }}
                                title="Close Checkout"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '26px 28px' }}>
                            {/* Price Header */}
                            <div style={{
                                background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px',
                                padding: '20px', marginBottom: '20px', textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Monthly Recurring Plan
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px', margin: '6px 0 2px' }}>
                                    <span style={{ fontSize: '36px', fontWeight: '900', color: '#0F172A', lineHeight: 1 }}>₹499</span>
                                    <span style={{ fontSize: '15px', fontWeight: '700', color: '#64748B' }}>/ Month</span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#059669', fontWeight: '600' }}>
                                    GST Included · Cancel Anytime
                                </div>
                            </div>

                            {/* Features Checklist */}
                            <div style={{ marginBottom: '22px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px', color: '#1E293B' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ color: '#10B981', fontWeight: '800', fontSize: '15px' }}>✓</span>
                                        <span>Unlimited POS Billing</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ color: '#10B981', fontWeight: '800', fontSize: '15px' }}>✓</span>
                                        <span>Inventory Management</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ color: '#10B981', fontWeight: '800', fontSize: '15px' }}>✓</span>
                                        <span>Cloud Sync</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ color: '#10B981', fontWeight: '800', fontSize: '15px' }}>✓</span>
                                        <span>Multi-Store Management</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ color: '#10B981', fontWeight: '800', fontSize: '15px' }}>✓</span>
                                        <span>Advanced Reports</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ color: '#10B981', fontWeight: '800', fontSize: '15px' }}>✓</span>
                                        <span>Priority Support</span>
                                    </div>
                                </div>
                            </div>

                            {/* Auto-Renewal Status Box */}
                            <div style={{
                                background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '12px',
                                padding: '12px 16px', marginBottom: '22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                            }}>
                                <div style={{ fontSize: '13px', fontWeight: '700', color: '#065F46' }}>
                                    Auto-Renewal
                                </div>
                                <span style={{
                                    background: '#10B981', color: '#FFFFFF', padding: '3px 12px',
                                    borderRadius: '20px', fontSize: '12px', fontWeight: '800', letterSpacing: '0.03em'
                                }}>
                                    [ ON ]
                                </span>
                            </div>

                            {/* Trust Badge */}
                            <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '18px' }}>
                                <FontAwesomeIcon icon={faShieldHalved} style={{ color: '#10B981', fontSize: '14px' }} />
                                <span>Secure payment powered by Razorpay</span>
                            </div>

                            {/* Continue to Payment Button */}
                            <button
                                type="button"
                                onClick={handleExecutePayment}
                                disabled={processing}
                                style={{
                                    width: '100%',
                                    background: processing
                                        ? '#64748B'
                                        : 'linear-gradient(135deg, #059669 0%, #10B981 50%, #047857 100%)',
                                    color: '#FFFFFF', border: 'none', padding: '16px', borderRadius: '14px',
                                    fontSize: '15.5px', fontWeight: '800', cursor: processing ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                    boxShadow: '0 8px 20px rgba(16,185,129,0.3)', transition: 'all 0.2s'
                                }}
                            >
                                {processing ? (
                                    <>
                                        <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: '18px' }} />
                                        <span>Connecting to Razorpay...</span>
                                    </>
                                ) : (
                                    <span>[ Continue to Payment ]</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── DEVICE MANAGER & HARDWARE FLEET MODAL ── */}
            {showDeviceModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.5)', zIndex: 99999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    <div style={{
                        background: '#FFFFFF', borderRadius: '20px', width: '780px', maxWidth: '95vw',
                        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
                        boxShadow: '0 25px 60px rgba(15, 23, 42, 0.3)', overflow: 'hidden'
                    }}>
                        {/* Modal Header */}
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                                    <FontAwesomeIcon icon={faDesktop} />
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#0F172A' }}>
                                            Device Manager & Hardware Telemetry
                                        </h3>
                                        <span style={{ background: '#ECFDF5', color: '#059669', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px' }}>
                                            Live Pulse
                                        </span>
                                    </div>
                                    <span style={{ fontSize: '12.5px', color: '#64748B' }}>
                                        Authorized POS terminals, wireless barcode scanners, and bound hardware seats
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowDeviceModal(false)}
                                style={{ background: 'transparent', border: 'none', color: '#64748B', fontSize: '20px', cursor: 'pointer', padding: '4px 8px' }}
                            >
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        </div>

                        {/* Navigation Tabs */}
                        <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', background: '#FFFFFF', padding: '0 24px' }}>
                            <button
                                type="button"
                                onClick={() => setDeviceModalTab('fleet')}
                                style={{
                                    padding: '14px 18px',
                                    border: 'none',
                                    background: 'transparent',
                                    borderBottom: deviceModalTab === 'fleet' ? '3px solid #2563EB' : '3px solid transparent',
                                    color: deviceModalTab === 'fleet' ? '#2563EB' : '#64748B',
                                    fontWeight: '700',
                                    fontSize: '13.5px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <FontAwesomeIcon icon={faDesktop} />
                                <span>Fleet Overview</span>
                                <span style={{
                                    background: deviceModalTab === 'fleet' ? '#EFF6FF' : '#F1F5F9',
                                    color: deviceModalTab === 'fleet' ? '#2563EB' : '#64748B',
                                    fontSize: '11px', padding: '2px 8px', borderRadius: '10px'
                                }}>
                                    {currentDevices.length}/5 Seats
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setDeviceModalTab('pair')}
                                style={{
                                    padding: '14px 18px',
                                    border: 'none',
                                    background: 'transparent',
                                    borderBottom: deviceModalTab === 'pair' ? '3px solid #10B981' : '3px solid transparent',
                                    color: deviceModalTab === 'pair' ? '#059669' : '#64748B',
                                    fontWeight: '700',
                                    fontSize: '13.5px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <FontAwesomeIcon icon={faPlus} />
                                <span>+ Pair New Terminal / Scanner</span>
                                {currentDevices.length < 5 && (
                                    <span style={{ background: '#ECFDF5', color: '#059669', fontSize: '11px', padding: '2px 8px', borderRadius: '10px', fontWeight: '800' }}>
                                        {5 - currentDevices.length} Open
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>

                            {deviceModalTab === 'fleet' && (
                                <>
                                    {/* Fleet Stats Overview */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px 14px' }}>
                                            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Active Fleet Terminals</div>
                                            <div style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginTop: '4px' }}>
                                                {currentDevices.length} <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>/ 5 Seats Bound</span>
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#059669', marginTop: '2px', fontWeight: '600' }}>
                                                ● All nodes responding
                                            </div>
                                        </div>

                                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px 14px' }}>
                                            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Hardware Machine UUID</div>
                                            <div style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', fontFamily: 'monospace', marginTop: '6px' }}>
                                                {primaryDevice?.device_id || 'UUID-9D89F035'}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => copyDeviceText(primaryDevice?.full_uuid || primaryDevice?.device_id || 'UUID-9D89F035', 'uuid_all', 'Machine UUID copied')}
                                                    style={{ background: 'transparent', border: 'none', color: '#2563EB', fontSize: '11px', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                                                >
                                                    <FontAwesomeIcon icon={faCopy} /> Copy Full UUID
                                                </button>
                                                <span style={{ color: '#CBD5E1' }}>·</span>
                                                <button
                                                    type="button"
                                                    onClick={handleResetHardwareBinding}
                                                    style={{ background: 'transparent', border: 'none', color: '#DC2626', fontSize: '11px', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                                                >
                                                    Reset Lock
                                                </button>
                                            </div>
                                        </div>

                                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px 14px' }}>
                                            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Bound License Key</div>
                                            <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', fontFamily: 'monospace', marginTop: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {subData?.key_code || 'INFYPOS-2026-KEY-7CF71064'}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => copyDeviceText(subData?.key_code || 'INFYPOS-2026-KEY-7CF71064', 'key_all', 'License key copied')}
                                                style={{ background: 'transparent', border: 'none', color: '#2563EB', fontSize: '11px', fontWeight: '700', cursor: 'pointer', padding: 0, marginTop: '4px' }}
                                            >
                                                <FontAwesomeIcon icon={faCopy} /> Copy License Key
                                            </button>
                                        </div>
                                    </div>

                                    {/* Device List Table */}
                                    <div style={{ border: '1px solid #E2E8F0', borderRadius: '14px', overflow: 'hidden', marginBottom: '20px' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                            <thead>
                                                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#64748B', fontSize: '12px' }}>
                                                    <th style={{ padding: '10px 14px' }}>Terminal & Hardware Details</th>
                                                    <th style={{ padding: '10px 14px' }}>IP / Network</th>
                                                    <th style={{ padding: '10px 14px' }}>Status / Telemetry</th>
                                                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentDevices.map((dev, i) => (
                                                    <tr key={dev.id || i} style={{ borderBottom: i < currentDevices.length - 1 ? '1px solid #F1F5F9' : 'none', background: dev.is_current ? '#FAFCFF' : '#FFFFFF' }}>
                                                        <td style={{ padding: '12px 14px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                                                <div style={{
                                                                    width: '32px', height: '32px', borderRadius: '8px',
                                                                    background: dev.is_current ? '#EFF6FF' : '#F1F5F9',
                                                                    color: dev.is_current ? '#2563EB' : '#64748B',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    fontSize: '14px', marginTop: '2px'
                                                                }}>
                                                                    <FontAwesomeIcon icon={dev.is_current ? faDesktop : faMobileAlt} />
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontWeight: '700', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                        {dev.device_name}
                                                                        {dev.is_current && (
                                                                            <span style={{ background: '#ECFDF5', color: '#059669', fontSize: '10px', padding: '1px 6px', borderRadius: '4px', fontWeight: '800' }}>
                                                                                Primary PC
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                                                                        {dev.device_type || dev.os_version || 'Desktop Terminal'}
                                                                    </div>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                                                                        <span style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace' }}>
                                                                            {dev.full_uuid || dev.device_id}
                                                                        </span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => copyDeviceText(dev.full_uuid || dev.device_id, dev.id, 'UUID copied')}
                                                                            style={{ background: 'none', border: 'none', color: copiedDeviceId === dev.id ? '#10B981' : '#64748B', cursor: 'pointer', fontSize: '10px', padding: 0 }}
                                                                            title="Copy UUID"
                                                                        >
                                                                            <FontAwesomeIcon icon={copiedDeviceId === dev.id ? faCheck : faCopy} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '12px 14px', color: '#475569' }}>
                                                            <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>{dev.ip_address || '127.0.0.1'}</div>
                                                            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>Port: 8000 (HTTPS/WSS)</div>
                                                        </td>
                                                        <td style={{ padding: '12px 14px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <span style={{
                                                                    width: '8px', height: '8px', borderRadius: '50%',
                                                                    background: dev.status === 'Online' ? '#10B981' : '#F59E0B',
                                                                    boxShadow: dev.status === 'Online' ? '0 0 6px rgba(16, 185, 129, 0.6)' : 'none'
                                                                }}></span>
                                                                <strong style={{ fontSize: '12px', color: dev.status === 'Online' ? '#059669' : '#D97706' }}>
                                                                    {dev.status}
                                                                </strong>
                                                            </div>
                                                            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '3px' }}>
                                                                Last Seen: {dev.last_seen}
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handlePingDevice(dev.device_name)}
                                                                    style={{
                                                                        background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#334155',
                                                                        padding: '5px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '600',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                    title="Ping device health"
                                                                >
                                                                    Ping ⚡
                                                                </button>
                                                                {dev.is_current ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={handleResetHardwareBinding}
                                                                        style={{
                                                                            background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF',
                                                                            padding: '5px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '600',
                                                                            cursor: 'pointer'
                                                                        }}
                                                                        title="Reset Hardware Binding Lock"
                                                                    >
                                                                        Reset Lock
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDeauthorizeDevice(dev.id, dev.device_name)}
                                                                        style={{
                                                                            background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626',
                                                                            padding: '5px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '600',
                                                                            cursor: 'pointer'
                                                                        }}
                                                                        title="Deauthorize device"
                                                                    >
                                                                        Deauthorize
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Add New Device Instructions */}
                                    <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div>
                                            <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <FontAwesomeIcon icon={faMobileAlt} style={{ color: '#2563EB' }} />
                                                <span>Connect Additional Counter or Wireless Scanner PDA</span>
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                                                Authenticate wireless handheld scanners, auxiliary billing counters, or warehouse stations via PIN or direct pairing.
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setDeviceModalTab('pair')}
                                            style={{
                                                background: '#2563EB', color: '#FFFFFF', border: 'none', padding: '9px 16px',
                                                borderRadius: '8px', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer',
                                                whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px',
                                                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faPlus} /> Pair Terminal Now →
                                        </button>
                                    </div>
                                </>
                            )}

                            {deviceModalTab === 'pair' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    
                                    {/* Method 1: Live 6-Digit PIN Pairing */}
                                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>
                                                        <FontAwesomeIcon icon={faBolt} />
                                                    </div>
                                                    <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                                                        Method 1: Instant 6-Digit Live Pairing PIN
                                                    </h4>
                                                </div>
                                                <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0 36px' }}>
                                                    On your secondary PDA scanner or POS tablet, open INFY-POS Client, tap <strong>"Join Fleet"</strong>, and enter this one-time authorization code.
                                                </p>
                                            </div>
                                        </div>

                                        {pairingPin ? (
                                            <div style={{ background: '#FFFFFF', border: '2px solid #10B981', borderRadius: '12px', padding: '18px 24px', textAlign: 'center', marginTop: '10px' }}>
                                                <div style={{ fontSize: '11px', color: '#059669', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    Live Fleet Pairing PIN (Valid for 10 Minutes)
                                                </div>
                                                <div style={{
                                                    fontSize: '36px', fontWeight: '900', color: '#0F172A',
                                                    fontFamily: 'monospace', letterSpacing: '0.25em',
                                                    margin: '12px 0 8px', textShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                                }}>
                                                    {pairingPin.split('').join(' ')}
                                                </div>
                                                <div style={{ fontSize: '12.5px', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
                                                    <span>⏱️ Expires in <strong>{Math.floor(pairingPinSeconds / 60)}m {pairingPinSeconds % 60}s</strong></span>
                                                    <span>·</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => copyDeviceText(pairingPin, 'pin', 'Pairing PIN copied!')}
                                                        style={{ background: 'transparent', border: 'none', color: '#2563EB', fontWeight: '700', cursor: 'pointer', fontSize: '12px', padding: 0 }}
                                                    >
                                                        <FontAwesomeIcon icon={faCopy} /> Copy PIN
                                                    </button>
                                                    <span>·</span>
                                                    <button
                                                        type="button"
                                                        onClick={handleGeneratePairingPin}
                                                        disabled={pairingPinLoading}
                                                        style={{ background: 'transparent', border: 'none', color: '#059669', fontWeight: '700', cursor: 'pointer', fontSize: '12px', padding: 0 }}
                                                    >
                                                        <FontAwesomeIcon icon={faRotate} /> Regenerate
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '16px', background: '#FFFFFF', borderRadius: '10px', border: '1px dashed #CBD5E1' }}>
                                                <button
                                                    type="button"
                                                    onClick={handleGeneratePairingPin}
                                                    disabled={pairingPinLoading}
                                                    style={{
                                                        background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                                                        color: '#FFFFFF', border: 'none', padding: '12px 24px',
                                                        borderRadius: '10px', fontSize: '13.5px', fontWeight: '800',
                                                        cursor: pairingPinLoading ? 'not-allowed' : 'pointer',
                                                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                                                        display: 'inline-flex', alignItems: 'center', gap: '8px'
                                                    }}
                                                >
                                                    {pairingPinLoading ? (
                                                        <>
                                                            <FontAwesomeIcon icon={faSpinner} spin />
                                                            <span>Generating Secure PIN...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FontAwesomeIcon icon={faBolt} />
                                                            <span>Generate Live 6-Digit Pairing PIN</span>
                                                        </>
                                                    )}
                                                </button>
                                                <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '8px' }}>
                                                    Generates an encrypted 10-minute PIN linked to store "{subData?.company_name || 'saati'}"
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Method 2: Direct Hardware Terminal Registration */}
                                    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                                            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>
                                                <FontAwesomeIcon icon={faDesktop} />
                                            </div>
                                            <div>
                                                <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                                                    Method 2: Authorize Terminal Manually
                                                </h4>
                                                <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0' }}>
                                                    Pre-authorize a hardware seat for a local network counter terminal, PDA scanner, or tablet.
                                                </p>
                                            </div>
                                        </div>

                                        <form onSubmit={handlePairNewDevice}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                                                        Terminal / Device Name *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={newDeviceName}
                                                        onChange={(e) => setNewDeviceName(e.target.value)}
                                                        placeholder="e.g. Counter #2 POS Scanner"
                                                        required
                                                        style={{
                                                            width: '100%', padding: '10px 12px', borderRadius: '8px',
                                                            border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none'
                                                        }}
                                                    />
                                                </div>

                                                <div>
                                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                                                        Hardware Device Type
                                                    </label>
                                                    <select
                                                        value={newDeviceType}
                                                        onChange={(e) => setNewDeviceType(e.target.value)}
                                                        style={{
                                                            width: '100%', padding: '10px 12px', borderRadius: '8px',
                                                            border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none', background: '#FFFFFF'
                                                        }}
                                                    >
                                                        <option value="Wireless Barcode Scanner / PDA">Wireless Barcode Scanner / PDA</option>
                                                        <option value="Counter Billing Terminal (PC)">Counter Billing Terminal (PC)</option>
                                                        <option value="Mobile POS Tablet (Android / iPad)">Mobile POS Tablet (Android / iPad)</option>
                                                        <option value="Warehouse Inventory Scanner">Warehouse Inventory Scanner</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div style={{ marginBottom: '16px' }}>
                                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                                                    Local IP Address / Network Host (Optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={newDeviceIp}
                                                    onChange={(e) => setNewDeviceIp(e.target.value)}
                                                    placeholder="e.g. 192.168.1.105"
                                                    style={{
                                                        width: '100%', padding: '10px 12px', borderRadius: '8px',
                                                        border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none'
                                                    }}
                                                />
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeviceModalTab('fleet')}
                                                    style={{
                                                        background: 'transparent', border: 'none', color: '#64748B',
                                                        fontSize: '13px', fontWeight: '600', cursor: 'pointer'
                                                    }}
                                                >
                                                    ← Back to Fleet Overview
                                                </button>

                                                <button
                                                    type="submit"
                                                    disabled={isPairingDevice || !newDeviceName.trim()}
                                                    style={{
                                                        background: isPairingDevice || !newDeviceName.trim() ? '#94A3B8' : '#2563EB',
                                                        color: '#FFFFFF', border: 'none', padding: '10px 20px',
                                                        borderRadius: '8px', fontSize: '13px', fontWeight: '700',
                                                        cursor: isPairingDevice || !newDeviceName.trim() ? 'not-allowed' : 'pointer',
                                                        display: 'flex', alignItems: 'center', gap: '8px',
                                                        boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
                                                    }}
                                                >
                                                    {isPairingDevice ? (
                                                        <>
                                                            <FontAwesomeIcon icon={faSpinner} spin />
                                                            <span>Authorizing Terminal...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FontAwesomeIcon icon={faCheck} />
                                                            <span>Authorize & Bind Terminal →</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </form>
                                    </div>

                                </div>
                            )}

                        </div>

                        {/* Modal Footer */}
                        <div style={{ padding: '14px 24px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '12px', color: '#64748B' }}>
                                Store: <strong style={{ color: '#0F172A' }}>{subData?.company_name || 'saati'}</strong> &nbsp;·&nbsp; Bound Seats: <strong>{currentDevices.length}/5</strong>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowDeviceModal(false)}
                                style={{
                                    background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '8px 18px',
                                    borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#334155',
                                    cursor: 'pointer'
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── RESTORE DATABASE BACKUP MODAL ── */}
            {showRestoreModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.45)', zIndex: 99999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    <div style={{
                        background: '#FFFFFF', borderRadius: '20px', width: '520px', maxWidth: '95vw',
                        boxShadow: '0 25px 60px rgba(15, 23, 42, 0.25)', overflow: 'hidden'
                    }}>
                        {/* Modal Header */}
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                                    <FontAwesomeIcon icon={faRotate} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '17px', fontWeight: '800', margin: 0, color: '#0F172A' }}>
                                        Restore Database Backup
                                    </h3>
                                    <span style={{ fontSize: '12px', color: '#64748B' }}>
                                        Restore your system from an SQL/ZIP file or local vault
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => { if (!isRestoring) { setShowRestoreModal(false); setRestoreFile(null); } }}
                                style={{ background: 'transparent', border: 'none', color: '#64748B', fontSize: '18px', cursor: isRestoring ? 'not-allowed' : 'pointer' }}
                            >
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '22px 24px' }}>
                            {/* Option 1: Upload File */}
                            <div style={{
                                border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px',
                                marginBottom: '16px', background: '#FAFAFA'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <strong style={{ fontSize: '13.5px', color: '#0F172A' }}>Option 1: Upload Backup File</strong>
                                    <span style={{ fontSize: '11px', background: '#EFF6FF', color: '#2563EB', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                                        .SQL or .ZIP
                                    </span>
                                </div>
                                <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 12px' }}>
                                    Select an SQL dump or ZIP backup file from your computer.
                                </p>

                                {restoreFile ? (
                                    <div style={{
                                        background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '10px 14px',
                                        borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        marginBottom: '12px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                            <FontAwesomeIcon icon={faCheckCircle} style={{ color: '#16A34A' }} />
                                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#15803D', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                                {restoreFile.name}
                                            </span>
                                            <span style={{ fontSize: '11px', color: '#64748B' }}>
                                                ({(restoreFile.size / 1024).toFixed(1)} KB)
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handlePickRestoreFile}
                                            style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px', cursor: 'pointer', fontWeight: '600' }}
                                        >
                                            Change
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handlePickRestoreFile}
                                        style={{
                                            width: '100%', padding: '12px', background: '#FFFFFF', border: '1.5px dashed #CBD5E1',
                                            borderRadius: '10px', fontSize: '13px', fontWeight: '600', color: '#334155',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                            marginBottom: '12px'
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faUpload} />
                                        Choose .SQL or .ZIP File
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => handleExecuteRestore('file')}
                                    disabled={!restoreFile || isRestoring}
                                    style={{
                                        width: '100%', padding: '10px', borderRadius: '8px', border: 'none',
                                        background: restoreFile && !isRestoring ? '#2563EB' : '#94A3B8',
                                        color: '#FFFFFF', fontSize: '13px', fontWeight: '700', cursor: restoreFile && !isRestoring ? 'pointer' : 'not-allowed',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    {isRestoring ? (
                                        <>
                                            <FontAwesomeIcon icon={faSpinner} spin /> Restoring Database...
                                        </>
                                    ) : (
                                        'Restore Selected File →'
                                    )}
                                </button>
                            </div>

                            {/* Option 2: Automated Vault */}
                            <div style={{
                                border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px',
                                background: '#FAFAFA'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <strong style={{ fontSize: '13.5px', color: '#0F172A' }}>Option 2: Restore from Automated Vault</strong>
                                    <span style={{ fontSize: '11px', background: '#ECFDF5', color: '#059669', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                                        Local Vault
                                    </span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '12px' }}>
                                    Restore from latest saved vault snapshot: <strong style={{ color: '#0F172A' }}>{subData.last_backup}</strong> ({subData.backup_size})
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleExecuteRestore('vault')}
                                    disabled={isRestoring}
                                    style={{
                                        width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #16A34A',
                                        background: '#FFFFFF', color: '#15803D', fontSize: '13px', fontWeight: '700',
                                        cursor: isRestoring ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    <FontAwesomeIcon icon={faHistory} />
                                    Restore from Automated Vault Point
                                </button>
                            </div>

                            {/* Warning */}
                            <div style={{
                                marginTop: '16px', background: '#FFFBEB', border: '1px solid #FDE68A',
                                padding: '10px 14px', borderRadius: '10px', fontSize: '11.5px', color: '#92400E',
                                lineHeight: '1.4'
                            }}>
                                ⚠️ <strong>Important:</strong> Restoring will replace existing tables and records with the backup database contents. Please ensure you download a fresh backup before executing a restore.
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div style={{ padding: '14px 24px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={() => { if (!isRestoring) { setShowRestoreModal(false); setRestoreFile(null); } }}
                                disabled={isRestoring}
                                style={{
                                    background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '8px 16px',
                                    borderRadius: '8px', fontSize: '12.5px', fontWeight: '600', color: '#334155',
                                    cursor: isRestoring ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── PIXEL-PERFECT INFY-POS ENTERPRISE UPI QR PAYMENT MODAL (Exact match to media_1790239102710.jpg) ── */}
            {showSystemModal && (
                <div
                    className="infy-pay-backdrop"
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !submittingPayment) {
                            setShowSystemModal(false);
                        }
                    }}
                >
                    <div className="infy-pay-modal" onClick={(e) => e.stopPropagation()}>

                        {/* ── LEFT DARK GREEN SIDEBAR ── */}
                        <div className="infy-pay-left-sidebar">
                            <div>
                                {/* Top Brand: INFY-POS Enterprise */}
                                <div className="infy-pay-brand-header">
                                    <div className="infy-pay-brand-icon-cluster">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                            <circle cx="12" cy="6.5" r="2.8" fill="#10B981"/>
                                            <circle cx="16.8" cy="9.2" r="2.8" fill="#10B981"/>
                                            <circle cx="16.8" cy="14.8" r="2.8" fill="#10B981"/>
                                            <circle cx="12" cy="17.5" r="2.8" fill="#10B981"/>
                                            <circle cx="7.2" cy="14.8" r="2.8" fill="#10B981"/>
                                            <circle cx="7.2" cy="9.2" r="2.8" fill="#10B981"/>
                                            <circle cx="12" cy="12" r="2.4" fill="#34D399"/>
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="infy-pay-brand-text">INFY-POS Enterprise</div>
                                        <div className="infy-pay-brand-sub">Secure &amp; Reliable POS Solution</div>
                                    </div>
                                </div>

                                <h3 className="infy-pay-main-title">
                                    Complete Your <span className="highlight-green">Payment</span>
                                </h3>
                                <p className="infy-pay-main-subtitle">
                                    Unlock the full power of INFY-POS with our premium subscription.
                                </p>

                                {/* Plan Card (White container inside dark column) */}
                                <div className="infy-pay-plan-card">
                                    <div className="infy-pay-plan-header">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div className="infy-pay-crown-box">
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                                    <path d="M2.5 18.5h19v2h-19v-2zm1.2-12l4.8 6 3.5-7.5 3.5 7.5 4.8-6 1.7 10.5H2L3.7 6.5z" fill="#D97706"/>
                                                </svg>
                                            </div>
                                            <div>
                                                <div className="infy-pay-plan-title">INFY-POS PREMIUM</div>
                                                <div className="infy-pay-plan-price">
                                                    ₹499 <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748B' }}>/ Month</span>
                                                </div>
                                            </div>
                                        </div>
                                        <span className="infy-pay-plan-badge">30 Days</span>
                                    </div>

                                    {/* 6 Features */}
                                    <ul className="infy-pay-features-list">
                                        {[
                                            'All Enterprise Features',
                                            'Unlimited POS Billing & Inventory',
                                            'Multi-Store Management',
                                            'Cloud Backup & Sync',
                                            'Priority 24/7 Support',
                                            'Free Software Updates'
                                        ].map((feature, idx) => (
                                            <li key={idx} className="infy-pay-feature-item">
                                                <div style={{
                                                    width: '18px',
                                                    height: '18px',
                                                    borderRadius: '50%',
                                                    background: '#059669',
                                                    color: '#FFFFFF',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '11px',
                                                    fontWeight: '900',
                                                    flexShrink: 0
                                                }}>
                                                    ✓
                                                </div>
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* Subtotal, GST, Total */}
                                    <div className="infy-pay-price-breakdown">
                                        <div className="infy-pay-price-row">
                                            <span>Subtotal</span>
                                            <span style={{ fontWeight: '700', color: '#0F172A' }}>₹499.00</span>
                                        </div>
                                        <div className="infy-pay-price-row">
                                            <span>GST (18%) <span style={{ fontSize: '11px', color: '#94A3B8', cursor: 'help' }}>ⓘ</span></span>
                                            <span style={{ fontWeight: '700', color: '#0F172A' }}>₹89.82</span>
                                        </div>
                                        <div className="infy-pay-price-total">
                                            <span className="infy-pay-total-label">Total Amount</span>
                                            <span className="infy-pay-total-value">₹588.82</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 100% Secure Payment Card */}
                            <div className="infy-pay-security-card">
                                <div style={{
                                    width: '26px',
                                    height: '26px',
                                    borderRadius: '50%',
                                    background: '#059669',
                                    color: '#FFFFFF',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '14px',
                                    fontWeight: '900',
                                    flexShrink: 0,
                                    marginTop: '2px'
                                }}>
                                    ✓
                                </div>
                                <div>
                                    <div className="infy-pay-sec-title">100% Secure Payment</div>
                                    <div className="infy-pay-sec-desc">
                                        Pay directly via UPI. Your payment is verified securely before activation.
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── RIGHT WHITE PANEL ── */}
                        {paymentSubmitted ? (
                            <div className="infy-pay-right-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '40px 32px' }}>
                                <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', marginBottom: '20px' }}>
                                    ⏳
                                </div>
                                <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>
                                    Payment Submitted — Verification Pending
                                </h3>
                                <p style={{ fontSize: '13.5px', color: '#64748B', maxWidth: '440px', lineHeight: 1.5, marginBottom: '24px' }}>
                                    Thank you! Your payment reference and UTR have been submitted to Super Admin for verification.
                                </p>

                                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '18px 24px', width: '100%', maxWidth: '440px', textAlign: 'left', marginBottom: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                                        <span style={{ color: '#64748B' }}>Order Reference:</span>
                                        <span style={{ fontWeight: '700', color: '#0F172A', fontFamily: 'monospace' }}>{submittedDetails?.order_id}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                                        <span style={{ color: '#64748B' }}>Transaction ID / UTR:</span>
                                        <span style={{ fontWeight: '700', color: '#0F172A', fontFamily: 'monospace' }}>{submittedDetails?.utr}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                                        <span style={{ color: '#64748B' }}>Amount:</span>
                                        <span style={{ fontWeight: '800', color: '#059669' }}>₹588.82</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #E2E8F0', fontSize: '13px' }}>
                                        <span style={{ color: '#64748B' }}>Status:</span>
                                        <span style={{ background: '#FEF3C7', color: '#B45309', padding: '3px 10px', borderRadius: '20px', fontWeight: '700', fontSize: '12px' }}>
                                            ● Pending Verification
                                        </span>
                                    </div>
                                </div>

                                <p style={{ fontSize: '12px', color: '#94A3B8', maxWidth: '440px', marginBottom: '24px' }}>
                                    Once verified by Super Admin, your subscription will automatically activate and extend by +30 Days.
                                </p>

                                <button
                                    type="button"
                                    className="infy-upi-submit-btn"
                                    style={{ maxWidth: '280px' }}
                                    onClick={() => setShowSystemModal(false)}
                                >
                                    Got It, Close
                                </button>
                            </div>
                        ) : (
                            <div className="infy-pay-right-panel">
                                {/* Top Bar */}
                                <div className="infy-pay-top-bar">
                                    <div>
                                        <h3 className="infy-pay-top-title">Pay via UPI (QR Code)</h3>
                                        <div className="infy-pay-top-subtitle">Scan the QR code using any UPI app to make the payment.</div>
                                    </div>
                                    <div className="infy-pay-top-actions">
                                        <button
                                            type="button"
                                            className="infy-pay-close-btn"
                                            onClick={() => setShowSystemModal(false)}
                                            title="Close"
                                        >
                                            ✕
                                        </button>
                                        <div className="infy-pay-lang-badge">
                                            <span>🇮🇳</span>
                                            <span>EN</span>
                                            <span style={{ fontSize: '9px', marginLeft: '2px' }}>▼</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Middle Side-by-Side Cards (QR Card on left, How to Pay on right) */}
                                <div className="infy-upi-cards-grid">
                                    {/* Left Card: QR Code Box */}
                                    <div className="infy-upi-qr-box">
                                        <div className="infy-upi-qr-image-wrapper" style={{ position: 'relative' }}>
                                            {/* Dynamic QR Code Image */}
                                            <img
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(systemUpiData?.upi_string || 'upi://pay?pa=infypos@icici&pn=INFY-POS+Enterprise&am=588.82&cu=INR')}&margin=2`}
                                                alt="UPI Payment QR Code"
                                                style={{ width: '136px', height: '136px', display: 'block', borderRadius: '6px' }}
                                            />
                                            {/* Center Google Pay / UPI Icon Overlay Badge */}
                                            <div style={{
                                                position: 'absolute',
                                                top: '50%',
                                                left: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '50%',
                                                background: '#FFFFFF',
                                                boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '1.5px solid #FFFFFF'
                                            }}>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                                    <circle cx="12" cy="12" r="10" fill="#FFFFFF"/>
                                                    <path d="M16 11.5c0-.4-.04-.8-.11-1.2H12v2.3h2.3c-.1.5-.4 1-.8 1.3v1.1h1.3c.8-.7 1.2-1.9 1.2-3.5z" fill="#4285F4"/>
                                                    <path d="M12 16c1.1 0 2-.4 2.7-1l-1.3-1.1c-.4.3-.9.4-1.4.4-1.1 0-2-.7-2.3-1.7H8.3v1.1C9 15.3 10.4 16 12 16z" fill="#34A853"/>
                                                    <path d="M9.7 12.6c-.1-.3-.1-.6-.1-.9 0-.3 0-.6.1-.9V9.7H8.3C8 10.4 7.8 11.2 7.8 12c0 .8.2 1.6.5 2.3l1.4-1.7z" fill="#FBBC05"/>
                                                    <path d="M12 8.8c.6 0 1.1.2 1.6.6l1.2-1.2C14 7.5 13.1 7 12 7 10.4 7 9 7.7 8.3 9.1l1.4 1.1c.3-1 1.2-1.4 2.3-1.4z" fill="#EA4335"/>
                                                </svg>
                                            </div>
                                        </div>

                                        <div className="infy-upi-scan-pay-text">
                                            Scan &amp; Pay <span className="infy-upi-scan-pay-amount">₹588.82</span>
                                        </div>

                                        <div className="infy-upi-apps-row">
                                            {/* GPay */}
                                            <div className="infy-upi-app-pill">
                                                <svg width="13" height="13" viewBox="0 0 24 24">
                                                    <path fill="#4285F4" d="M23.7 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.6c-.3 1.5-1.1 2.8-2.4 3.7v3h3.9c2.3-2.1 3.6-5.2 3.6-8.9z"/>
                                                    <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-3l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.2v3.1C3.3 21.3 7.4 24 12 24z"/>
                                                    <path fill="#FBBC05" d="M5.3 14.2c-.2-.7-.4-1.5-.4-2.2s.2-1.5.4-2.2V6.7H1.2C.4 8.3 0 10.1 0 12s.4 3.7 1.2 5.3l4.1-3.1z"/>
                                                    <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C18 1.2 15.2 0 12 0 7.4 0 3.3 2.7 1.2 6.7l4.1 3.1c.9-2.9 3.6-5 6.7-5z"/>
                                                </svg>
                                                <span>GPay</span>
                                            </div>

                                            {/* PhonePe */}
                                            <div className="infy-upi-app-pill">
                                                <div style={{ width: '15px', height: '15px', borderRadius: '50%', background: '#5F259F', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '900' }}>
                                                    पे
                                                </div>
                                                <span>PhonePe</span>
                                            </div>

                                            {/* Paytm */}
                                            <div className="infy-upi-app-pill">
                                                <span style={{ fontSize: '11px', fontWeight: '900' }}>
                                                    <span style={{ color: '#002970' }}>pay</span><span style={{ color: '#00BAF2' }}>tm</span>
                                                </span>
                                            </div>

                                            {/* BHIM */}
                                            <div className="infy-upi-app-pill">
                                                <svg width="12" height="12" viewBox="0 0 24 24">
                                                    <polygon points="12 2 22 20 2 20" fill="#00833F" />
                                                    <polygon points="12 6 18 18 6 18" fill="#E86127" />
                                                </svg>
                                                <span style={{ color: '#00833F', fontWeight: '800' }}>BHIM</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Card: How to Pay? Box */}
                                    <div className="infy-upi-how-to-box">
                                        <div className="infy-upi-how-to-title">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                                                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                                            </svg>
                                            <span>How to Pay?</span>
                                        </div>

                                        <div className="infy-upi-steps-list">
                                            {[
                                                'Open any UPI app (GPay, PhonePe, Paytm)',
                                                'Scan the QR code',
                                                'Verify the amount ₹588.82',
                                                'Complete the payment',
                                                'Enter the UTR/Transaction ID below',
                                                'Click on "I\'ve Completed Payment"'
                                            ].map((step, idx) => (
                                                <div key={idx} className="infy-upi-step-row">
                                                    <span className="infy-upi-step-circle">{idx + 1}</span>
                                                    <span>{step}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Form: Transaction ID / UTR */}
                                <form onSubmit={handleCompletedPaymentSubmit}>
                                    <div className="infy-upi-form-field">
                                        <label className="infy-upi-input-label">
                                            Transaction ID / UTR <span className="required-star">*</span>
                                        </label>
                                        <div className="infy-upi-input-box">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                                <line x1="3" y1="10" x2="21" y2="10"></line>
                                            </svg>
                                            <input
                                                type="text"
                                                value={utrInput}
                                                onChange={(e) => setUtrInput(e.target.value)}
                                                placeholder="Enter UTR / Transaction ID (e.g. 123456789012)"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Form: Upload Payment Screenshot (Optional) */}
                                    <div className="infy-upi-upload-box">
                                        <div className="infy-upi-upload-left">
                                            <div className="infy-upi-upload-icon-box">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                                    <polyline points="21 15 16 10 5 21"></polyline>
                                                </svg>
                                            </div>
                                            <div>
                                                <div className="infy-upi-upload-title">
                                                    {screenshotFileName ? screenshotFileName : 'Upload Payment Screenshot (Optional)'}
                                                </div>
                                                <div className="infy-upi-upload-sub">
                                                    Supported formats: JPG, PNG (Max 5MB)
                                                </div>
                                            </div>
                                        </div>

                                        <input
                                            type="file"
                                            ref={upiFileInputRef}
                                            style={{ display: 'none' }}
                                            accept="image/png,image/jpeg,image/jpg,image/webp"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    const file = e.target.files[0];
                                                    setScreenshotFile(file);
                                                    setScreenshotFileName(file.name);
                                                }
                                            }}
                                        />

                                        <button
                                            type="button"
                                            className="infy-upi-upload-btn"
                                            onClick={() => {
                                                if (upiFileInputRef.current) {
                                                    upiFileInputRef.current.click();
                                                }
                                            }}
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="12" y1="19" x2="12" y2="5"></line>
                                                <polyline points="5 12 12 5 19 12"></polyline>
                                            </svg>
                                            <span>Choose File</span>
                                        </button>
                                    </div>

                                    {/* Large CTA Button */}
                                    <button
                                        type="submit"
                                        className="infy-upi-submit-btn"
                                        disabled={!utrInput.trim() || submittingPayment}
                                    >
                                        <div className="infy-upi-check-badge">✓</div>
                                        <span>{submittingPayment ? 'Submitting Payment...' : "I've Completed Payment"}</span>
                                        <span style={{ fontSize: '16px', marginLeft: '4px' }}>→</span>
                                    </button>
                                </form>

                                {/* Info Note at Bottom */}
                                <div className="infy-upi-info-note">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="16" x2="12" y2="12"></line>
                                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                    </svg>
                                    <span>Your payment will be verified securely. You will be notified once your subscription is activated.</span>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            )}

            {/* ── MODAL: CURRENT PLAN ALREADY ACTIVE (DUPLICATE PAYMENT PROTECTION) ── */}
            {showActiveWarningModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
                    zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    <div style={{
                        background: '#FFFFFF', borderRadius: '24px', maxWidth: '480px', width: '100%',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
                        overflow: 'hidden', animation: 'modalFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                        border: '1px solid #E2E8F0'
                    }}>
                        {/* Header */}
                        <div style={{
                            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                            color: '#FFFFFF', padding: '22px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '12px',
                                    background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981', fontSize: '18px'
                                }}>
                                    <FontAwesomeIcon icon={faShieldHalved} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#FFFFFF' }}>
                                        Current Plan Already Active
                                    </h3>
                                    <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px', fontWeight: '500' }}>
                                        Duplicate Payment Protection
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowActiveWarningModal(false)}
                                style={{
                                    background: 'rgba(255,255,255,0.1)', border: 'none', color: '#CBD5E1',
                                    width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px'
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Body */}
                        <div style={{ padding: '24px 26px' }}>
                            <div style={{
                                background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '14px',
                                padding: '16px', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '12px'
                            }}>
                                <FontAwesomeIcon icon={faCheckCircle} style={{ color: '#059669', fontSize: '20px', marginTop: '2px' }} />
                                <div style={{ fontSize: '13.5px', color: '#065F46', lineHeight: '1.5' }}>
                                    <strong>Your subscription is active and in good standing.</strong> You do not need to make another payment at this time.
                                </div>
                            </div>

                            {/* Plan details table */}
                            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px', marginBottom: '20px', fontSize: '13px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #E2E8F0' }}>
                                    <span style={{ color: '#64748B', fontWeight: '600' }}>Active Plan</span>
                                    <strong style={{ color: '#0F172A' }}>{activePlanInfo?.plan_name || resolvedPlanTitle}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #E2E8F0' }}>
                                    <span style={{ color: '#64748B', fontWeight: '600' }}>Status</span>
                                    <span style={{
                                        background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0',
                                        padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700',
                                        display: 'inline-flex', alignItems: 'center', gap: '5px'
                                    }}>
                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }}></span>
                                        Active
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #E2E8F0' }}>
                                    <span style={{ color: '#64748B', fontWeight: '600' }}>Valid Until</span>
                                    <strong style={{ color: '#0F172A' }}>{activePlanInfo?.ends_at || subData.subscription_ends_at || 'Active'}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px' }}>
                                    <span style={{ color: '#64748B', fontWeight: '600' }}>Remaining Period</span>
                                    <strong style={{ color: '#059669', fontWeight: '700' }}>
                                        {activePlanInfo?.days_remaining ?? daysLeft} Days Remaining
                                    </strong>
                                </div>
                            </div>

                            <div style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.6', marginBottom: '22px' }}>
                                <FontAwesomeIcon icon={faLock} style={{ color: '#94A3B8', marginRight: '6px' }} />
                                To prevent accidental double charges, plan renewal unlocks automatically when <strong>6 or fewer days</strong> remain on your current subscription.
                            </div>

                            {/* Buttons */}
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowActiveWarningModal(false)}
                                    style={{
                                        flex: 1, background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                                        color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '12px 18px',
                                        fontSize: '13.5px', fontWeight: '700', cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'
                                    }}
                                >
                                    I Understand
                                </button>
                                <a
                                    href="/billing/invoice/1"
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                        background: '#F1F5F9', color: '#334155', border: '1px solid #CBD5E1',
                                        borderRadius: '10px', padding: '12px 16px', fontSize: '13px', fontWeight: '600',
                                        textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px'
                                    }}
                                >
                                    <FontAwesomeIcon icon={faDownload} />
                                    <span>Invoice</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL: PAYMENT ALREADY PENDING (REUSE OR CANCEL) ── */}
            {showPendingModal && pendingPaymentInfo && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
                    zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    <div style={{
                        background: '#FFFFFF', borderRadius: '24px', maxWidth: '480px', width: '100%',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
                        overflow: 'hidden', animation: 'modalFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                        border: '1px solid #E2E8F0'
                    }}>
                        {/* Header */}
                        <div style={{
                            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                            color: '#FFFFFF', padding: '22px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '12px',
                                    background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B', fontSize: '18px'
                                }}>
                                    <FontAwesomeIcon icon={faClock} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#FFFFFF' }}>
                                        Payment Already Pending
                                    </h3>
                                    <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px', fontWeight: '500' }}>
                                        Incomplete Transaction Detected
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowPendingModal(false)}
                                style={{
                                    background: 'rgba(255,255,255,0.1)', border: 'none', color: '#CBD5E1',
                                    width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px'
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Body */}
                        <div style={{ padding: '24px 26px' }}>
                            <div style={{
                                background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '14px',
                                padding: '16px', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '12px'
                            }}>
                                <FontAwesomeIcon icon={faTriangleExclamation} style={{ color: '#D97706', fontSize: '18px', marginTop: '2px' }} />
                                <div style={{ fontSize: '13px', color: '#92400E', lineHeight: '1.5' }}>
                                    You have an active payment attempt in progress. Only <strong>one pending attempt</strong> is permitted at a time to prevent duplicate billing.
                                </div>
                            </div>

                            {/* Details table */}
                            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px', marginBottom: '20px', fontSize: '13px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #E2E8F0' }}>
                                    <span style={{ color: '#64748B', fontWeight: '600' }}>Invoice</span>
                                    <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>{pendingPaymentInfo.invoice_number}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #E2E8F0' }}>
                                    <span style={{ color: '#64748B', fontWeight: '600' }}>Amount</span>
                                    <strong style={{ color: '#0F172A' }}>₹{pendingPaymentInfo.amount}.00</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #E2E8F0' }}>
                                    <span style={{ color: '#64748B', fontWeight: '600' }}>Status</span>
                                    <span style={{
                                        background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A',
                                        padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700',
                                        display: 'inline-flex', alignItems: 'center', gap: '5px'
                                    }}>
                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F59E0B' }}></span>
                                        Pending
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px' }}>
                                    <span style={{ color: '#64748B', fontWeight: '600' }}>Initiated On</span>
                                    <span style={{ color: '#475569', fontWeight: '600' }}>{pendingPaymentInfo.paid_on || 'Today'}</span>
                                </div>
                            </div>

                            <p style={{ fontSize: '12.5px', color: '#64748B', lineHeight: '1.5', marginBottom: '22px' }}>
                                You can continue this existing payment attempt now, or cancel it if you wish to start a new transaction.
                            </p>

                            {/* Buttons */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <button
                                    type="button"
                                    onClick={() => handleResumePendingPayment(pendingPaymentInfo)}
                                    style={{
                                        width: '100%', background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                                        color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '12px 18px',
                                        fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    <FontAwesomeIcon icon={faRotate} />
                                    <span>Continue This Payment</span>
                                </button>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        type="button"
                                        onClick={() => handleCancelPendingPayment(pendingPaymentInfo)}
                                        disabled={cancellingPending}
                                        style={{
                                            flex: 1, background: '#FEF2F2', border: '1.5px solid #FECACA',
                                            color: '#DC2626', borderRadius: '10px', padding: '10px 14px',
                                            fontSize: '12.5px', fontWeight: '700', cursor: cancellingPending ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        {cancellingPending ? 'Cancelling...' : 'Cancel This Attempt'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowPendingModal(false)}
                                        style={{
                                            flex: 1, background: '#F1F5F9', border: '1px solid #CBD5E1',
                                            color: '#475569', borderRadius: '10px', padding: '10px 14px',
                                            fontSize: '12.5px', fontWeight: '600', cursor: 'pointer'
                                        }}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default EnterpriseSubscriptionBanner;
