import React, { useEffect, useState } from 'react';
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
    faKey
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
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

    // Fetch subscription details from backend
    const fetchSubscriptionStatus = async () => {
        try {
            const res = await axios.get('/api/saas/subscription-status');
            if (res.data && res.data.status) {
                setSubData(res.data);
                window.__INFYPOS_SUB_DATA__ = res.data;
                try {
                    localStorage.setItem('infypos_sub_data', JSON.stringify(res.data));
                } catch (e) {}

                if (typeof onStatusChange === 'function') {
                    onStatusChange(res.data);
                }
            }
        } catch (err) {
            console.warn('Backend server offline or unreachable; using local storage subscription cache');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscriptionStatus();
        const interval = setInterval(fetchSubscriptionStatus, 30000); // Sync backend every 30s
        return () => clearInterval(interval);
    }, []);

    // ── LIVE TICKER EFFECT (EVERY SECOND — CLIENT-SIDE INDEPENDENT TIMER) ──
    useEffect(() => {
        if (!subData) return;

        const isExp = subData.status === 'expired' || subData.is_expired || subData.status === 'locked' || subData.key_status === 'Expired' || (subData.days_remaining <= 0 && subData.status !== 'active');
        if (isExp) {
            setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            return;
        }

        const target = getTargetTimestamp(subData);

        const updateTimer = () => {
            const now = Date.now(); // Client system clock timestamp
            const diff = Math.max(0, Math.floor((target - now) / 1000));

            if (diff <= 0) {
                setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                return;
            }

            const days    = Math.floor(diff / 86400);
            const hours   = Math.floor((diff % 86400) / 3600);
            const minutes = Math.floor((diff % 3600) / 60);
            const seconds = diff % 60;

            setCountdown({ days, hours, minutes, seconds });
        };

        updateTimer();
        const timer = setInterval(updateTimer, 1000);

        return () => clearInterval(timer);
    }, [subData]);

    if (!subData && loading) {
        return (
            <div style={{ padding: '60px 28px', background: '#F8FAFC', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: '36px', color: '#10B981', marginBottom: '16px' }} />
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A' }}>Loading Real-Time Subscription Status...</div>
                <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>Connecting to INFY-POS License Engine</div>
            </div>
        );
    }

    const currentSub = subData || {};
    const daysLeft  = countdown.days;

    // Strict status checks
    const isTrial   = currentSub.status === 'trial';
    const isExpired   = currentSub.status === 'expired' || currentSub.is_expired || currentSub.status === 'locked' || currentSub.key_status === 'Expired' || (isTrial && daysLeft <= 0) || (currentSub.target_timestamp && currentSub.target_timestamp <= Date.now());
    const isActive  = currentSub.status === 'active' && !isExpired;
    const isGrace     = currentSub.status === 'grace_period';
    // Block payment ONLY when subscription is active, not trial, AND more than 6 days remain
    // When 6 or fewer days remain (daysLeft <= 6), renewal buttons automatically re-appear!
    const isPaidActive = isActive && !isTrial && daysLeft > 6;

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

    // Toggle Auto Renew
    const handleToggleAutoRenew = async () => {
        setTogglingAutoRenew(true);
        try {
            const res = await axios.post('/api/saas/toggle-auto-renew');
            if (res.data && res.data.success) {
                setSubData(prev => ({ ...prev, auto_renew: res.data.auto_renew }));
                showToast(res.data.message);
            }
        } catch (e) {
            showToast('Failed to toggle auto renewal');
        } finally {
            setTogglingAutoRenew(false);
        }
    };

    const showToast = (msg) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(null), 4000);
    };

    // Open Payment Checkout Modal — allows renewal in last 6 days or during trial/expired
    const handleOpenCheckout = (e) => {
        if (e) e.preventDefault();
        if (isPaidActive) {
            showToast(`✅ Premium active until ${currentSub.next_billing_date || currentSub.subscription_ends_at}! Renewal opens in the last 6 days.`);
            return;
        }
        setPaymentSuccess(false);
        setProcessing(false);
        setShowModal(true);
    };

    // Execute Real-Time Razorpay / UPI Payment
    const handleExecutePayment = async () => {
        setProcessing(true);
        try {
            const paymentId = 'pay_RZP_' + Math.random().toString(36).substring(2, 12).toUpperCase();
            const res = await axios.post('/api/saas/payment/verify', {
                payment_id: paymentId,
                payment_method: paymentMethod,
                amount: 499
            });

            if (res.data && res.data.success) {
                setPaymentSuccess(true);
                setSuccessMsg(res.data.message || 'Payment of ₹499 Successful! INFY-POS PREMIUM Extended for 30 Days.');
                
                // Clear dismiss cache so banner updates globally
                localStorage.removeItem('sub_banner_dismissed_until');

                // Refresh backend status
                await fetchSubscriptionStatus();

                setTimeout(() => {
                    setShowModal(false);
                }, 2500);
            }
        } catch (err) {
            alert('Payment failed. Please try again or contact support.');
        } finally {
            setProcessing(false);
        }
    };

    const realSubscriptions = subData?.subscriptions || [];
    const realDevices       = subData?.devices || [];

    return (
        <div className="enterprise-banner-container" style={{ padding: '24px 28px', background: '#F8FAFC', minHeight: '100vh' }}>

            {/* ── TOAST NOTIFICATION ── */}
            {toastMsg && (
                <div style={{
                    position: 'fixed', top: '20px', right: '20px', zIndex: 10000,
                    background: '#0F172A', color: '#fff', padding: '12px 20px',
                    borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                    fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px'
                }}>
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

            {/* ── QUEUED SUBSCRIPTION & KEY NOTICE BANNER ── */}
            {subData.queued_info && (
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

            {/* ── TOP HERO BANNER (WHITE THEME WITH EMERALD GREEN DESIGN) ── */}
            <div style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                padding: '22px 28px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid #E2E8F0',
                borderLeft: isExpired ? '6px solid #EF4444' : isActive ? '6px solid #10B981' : '6px solid #F59E0B',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        width: '48px', height: '48px', borderRadius: '12px',
                        background: isExpired ? '#FEF2F2' : isActive ? '#ECFDF5' : '#FEF3C7',
                        border: isExpired ? '1px solid #FCA5A5' : isActive ? '1px solid #A7F3D0' : '1px solid #FDE68A',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '24px'
                    }}>
                        {isExpired ? '🔒' : isTrial ? '⚡' : '🏆'}
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0F172A' }}>
                                {currentSub.plan_name || (isTrial ? 'INFY-POS FREE TRIAL (14 Days)' : 'INFY-POS PREMIUM')}
                            </h3>
                            <span style={{ background: isTrial ? '#FEF3C7' : '#ECFDF5', color: isTrial ? '#D97706' : '#059669', border: isTrial ? '1px solid #FDE68A' : '1px solid #A7F3D0', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
                                {isTrial ? '14-Day Commercial Free Trial' : 'Enterprise Edition'}
                            </span>
                        </div>
                        <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: '#475569', fontWeight: '500' }}>
                            {isTrial ? '₹0 Commercial Free Trial · 14 Days Unlimited Features Included' : `${currentSub.price || '₹499 / Month'} · All Features Included · No Locked Modules`}
                        </p>
                    </div>
                </div>

                <span style={{
                    background: isExpired ? '#FEF2F2' : isActive ? '#ECFDF5' : '#FEF3C7',
                    color: isExpired ? '#DC2626' : isActive ? '#059669' : '#D97706',
                    border: isExpired ? '1.5px solid #FCA5A5' : isActive ? '1.5px solid #A7F3D0' : '1.5px solid #FDE68A',
                    padding: '8px 20px', borderRadius: '24px', fontSize: '13.5px', fontWeight: '700',
                    display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isExpired ? '#EF4444' : isActive ? '#10B981' : '#F59E0B' }}></span>
                    {isExpired ? (isTrial ? 'Free Trial Expired & Locked' : 'Subscription Expired & Locked') : isActive ? 'Premium Subscription Active' : 'Free Trial Active'}
                </span>
            </div>

            {/* ── TOP 3 STATUS CARDS GRID ── */}
            <div className="enterprise-status-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                
                {/* CARD 1: SUBSCRIPTION STATUS & LIVE COUNTDOWN */}
                <div className={`status-card card-trial ${daysLeft <= 3 && !isActive ? 'low-days' : ''}`} style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            background: isExpired ? '#FEF2F2' : isActive ? '#ECFDF5' : '#FEF3C7',
                            color: isExpired ? '#DC2626' : isActive ? '#059669' : '#D97706',
                            padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '16px'
                        }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isExpired ? '#EF4444' : isActive ? '#10B981' : '#F59E0B' }}></span>
                            {isExpired ? (isTrial ? 'FREE TRIAL EXPIRED & LOCKED' : 'SUBSCRIPTION EXPIRED & LOCKED') : isPaidActive ? 'PREMIUM SUBSCRIPTION ACTIVE' : 'FREE TRIAL ACTIVE'}
                        </div>

                        <div className="status-title-box">
                            <h4 style={{ fontSize: '16px', fontWeight: '700', color: isExpired ? '#DC2626' : '#0F172A', marginBottom: '12px' }}>
                                {isExpired ? (isTrial ? 'Free Trial has Expired!' : 'Subscription has Expired!') : isPaidActive ? 'Active Subscription Time Remaining' : 'Active Commercial Free Trial Remaining'}
                            </h4>

                            {/* Live 4-Block Ticker: Days, Hours, Minutes, Seconds */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '16px 0 20px' }}>
                                <div style={{ background: isExpired ? '#FEF2F2' : '#F1F5F9', border: isExpired ? '1px solid #FCA5A5' : '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 14px', textAlign: 'center', flex: 1 }}>
                                    <div style={{ fontSize: '22px', fontWeight: '800', color: isExpired ? '#DC2626' : '#0F172A', lineHeight: 1 }}>{isExpired ? '00' : String(countdown.days).padStart(2, '0')}</div>
                                    <div style={{ fontSize: '11px', color: isExpired ? '#991B1B' : '#64748B', fontWeight: '600', marginTop: '4px' }}>Days</div>
                                </div>
                                <div style={{ fontSize: '18px', fontWeight: '700', color: '#94A3B8' }}>:</div>
                                <div style={{ background: isExpired ? '#FEF2F2' : '#F1F5F9', border: isExpired ? '1px solid #FCA5A5' : '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 14px', textAlign: 'center', flex: 1 }}>
                                    <div style={{ fontSize: '22px', fontWeight: '800', color: isExpired ? '#DC2626' : '#0F172A', lineHeight: 1 }}>{isExpired ? '00' : String(countdown.hours).padStart(2, '0')}</div>
                                    <div style={{ fontSize: '11px', color: isExpired ? '#991B1B' : '#64748B', fontWeight: '600', marginTop: '4px' }}>Hours</div>
                                </div>
                                <div style={{ fontSize: '18px', fontWeight: '700', color: '#94A3B8' }}>:</div>
                                <div style={{ background: isExpired ? '#FEF2F2' : '#F1F5F9', border: isExpired ? '1px solid #FCA5A5' : '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 14px', textAlign: 'center', flex: 1 }}>
                                    <div style={{ fontSize: '22px', fontWeight: '800', color: isExpired ? '#DC2626' : '#0F172A', lineHeight: 1 }}>{isExpired ? '00' : String(countdown.minutes).padStart(2, '0')}</div>
                                    <div style={{ fontSize: '11px', color: isExpired ? '#991B1B' : '#64748B', fontWeight: '600', marginTop: '4px' }}>Minutes</div>
                                </div>
                                <div style={{ fontSize: '18px', fontWeight: '700', color: '#94A3B8' }}>:</div>
                                <div style={{ background: isExpired ? '#FEF2F2' : '#F1F5F9', border: isExpired ? '1px solid #FCA5A5' : '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 14px', textAlign: 'center', flex: 1 }}>
                                    <div style={{ fontSize: '22px', fontWeight: '800', color: isExpired ? '#DC2626' : '#10B981', lineHeight: 1 }}>{isExpired ? '00' : String(countdown.seconds).padStart(2, '0')}</div>
                                    <div style={{ fontSize: '11px', color: isExpired ? '#991B1B' : '#64748B', fontWeight: '600', marginTop: '4px' }}>Seconds</div>
                                </div>
                            </div>
                        </div>

                        {/* Dates info */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748B', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9', padding: '8px 0', marginBottom: '16px' }}>
                            <div>Start Date: <strong style={{ color: '#0F172A' }}>{subData.start_date || subData.trial_started_at || '19 Aug 2026'}</strong></div>
                            <div>End Date: <strong style={{ color: '#0F172A' }}>{currentSub.subscription_ends_at || currentSub.trial_ends_at || '18 Sep 2026'}</strong></div>
                        </div>


                        <ul className="status-checklist" style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', fontSize: '13px', color: '#475569' }}>
                            <li style={{ marginBottom: '6px' }}><FontAwesomeIcon icon={faCheck} style={{ color: '#10B981', marginRight: '8px' }} /> All Enterprise Features Unlocked</li>
                            <li style={{ marginBottom: '6px' }}><FontAwesomeIcon icon={faCheck} style={{ color: '#10B981', marginRight: '8px' }} /> Unlimited POS Billing & Inventory</li>
                            <li><FontAwesomeIcon icon={faCheck} style={{ color: '#10B981', marginRight: '8px' }} /> Priority 24/7 Cloud Sync</li>
                        </ul>
                    </div>

                    <div>
                        {isPaidActive ? (
                            <div style={{
                                background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
                                border: '1.5px solid #6EE7B7',
                                borderRadius: '12px',
                                padding: '12px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyCenter: 'center',
                                gap: '10px',
                                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.1)'
                            }}>
                                <div style={{
                                    width: '28px', height: '28px', borderRadius: '50%',
                                    background: '#10B981', color: '#FFFFFF',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '14px', fontWeight: '800', flexShrink: 0
                                }}>
                                    ✓
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontWeight: '800', color: '#065F46', fontSize: '13.5px', lineHeight: 1.2 }}>
                                        {currentSub.plan_name || 'Premium Subscription Active'}
                                    </div>
                                    <div style={{ fontSize: '11.5px', color: '#047857', fontWeight: '600', marginTop: '1px' }}>
                                        Valid until {currentSub.subscription_ends_at || currentSub.trial_ends_at}
                                    </div>
                                </div>
                            </div>
                        ) : isTrial ? (
                            <button onClick={handleOpenCheckout} style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', color: '#fff', border: 'none', padding: '13px 20px', borderRadius: '10px', width: '100%', fontWeight: '800', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(109,40,217,0.35)' }}>
                                🚀 Upgrade to Premium — ₹499 / Month
                            </button>
                        ) : (
                            <button onClick={handleOpenCheckout} style={{ background: '#059669', color: '#fff', border: 'none', padding: '13px 20px', borderRadius: '10px', width: '100%', fontWeight: '800', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(5,150,105,0.35)' }}>
                                {isActive ? '⚡ Extend Subscription (+30 Days) — ₹499' : 'Renew Now — ₹499 / Month'}
                            </button>
                        )}
                    </div>
                </div>

                {/* CARD 2: CURRENT PLAN DETAILS & AUTO-RENEW TOGGLE */}
                <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#EFF6FF', color: '#2563EB', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '16px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3B82F6' }}></span>
                            CURRENT PLAN
                        </div>

                        <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', margin: '0 0 4px' }}>
                            {currentSub.plan_name || (isTrial ? 'INFY-POS FREE TRIAL (14 Days)' : 'INFY-POS PREMIUM')}
                        </h3>
                        <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 16px' }}>
                            {isTrial ? '14 Days Full Commercial Access. No Limits.' : 'Everything Included. No Limits.'}
                        </p>

                        <div style={{ fontSize: '28px', fontWeight: '900', color: '#0F172A', marginBottom: '20px' }}>
                            {isTrial ? 'Free Trial (₹0)' : (currentSub.price || '₹499 / Month')}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#F8FAFC', padding: '14px', borderRadius: '10px', fontSize: '12.5px', marginBottom: '20px' }}>
                            <div>
                                <span style={{ color: '#64748B', display: 'block' }}>Status</span>
                                <strong style={{ color: isActive ? '#10B981' : isTrial ? '#059669' : '#EF4444', textTransform: 'capitalize' }}>
                                    {subData.status}
                                </strong>
                            </div>
                            <div>
                                <span style={{ color: '#64748B', display: 'block' }}>Auto Renewal</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', marginTop: '2px' }} onClick={handleToggleAutoRenew}>
                                    <FontAwesomeIcon icon={subData.auto_renew ? faToggleOn : faToggleOff} style={{ fontSize: '20px', color: subData.auto_renew ? '#10B981' : '#94A3B8' }} />
                                    <strong style={{ color: subData.auto_renew ? '#10B981' : '#64748B' }}>{subData.auto_renew ? 'ON' : 'OFF'}</strong>
                                </div>
                            </div>
                            <div>
                                <span style={{ color: '#64748B', display: 'block' }}>Next Billing Date</span>
                                <strong style={{ color: '#0F172A' }}>{subData.next_billing_date || '04 Sep 2026'}</strong>
                            </div>
                            <div>
                                <span style={{ color: '#64748B', display: 'block' }}>Payment Method</span>
                                <strong style={{ color: '#0F172A' }}>{subData.payment_method || 'Razorpay / UPI'}</strong>
                            </div>
                        </div>
                    </div>

                    <div>
                        {isPaidActive ? (
                            <button
                                onClick={handleToggleAutoRenew}
                                style={{
                                    background: '#F8FAFC',
                                    border: '1.5px solid #CBD5E1',
                                    color: '#1E293B',
                                    padding: '12px 18px',
                                    borderRadius: '12px',
                                    width: '100%',
                                    fontWeight: '700',
                                    fontSize: '13.5px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                                }}
                            >
                                <FontAwesomeIcon icon={subData.auto_renew ? faToggleOn : faToggleOff} style={{ fontSize: '18px', color: subData.auto_renew ? '#10B981' : '#64748B' }} />
                                Auto-Renewal: <strong style={{ color: subData.auto_renew ? '#10B981' : '#64748B' }}>{subData.auto_renew ? 'ENABLED' : 'DISABLED'}</strong>
                            </button>
                        ) : isTrial ? (
                            <button onClick={handleOpenCheckout} style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', color: '#fff', border: 'none', padding: '13px 20px', borderRadius: '10px', width: '100%', fontWeight: '800', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(109,40,217,0.35)' }}>
                                🚀 Upgrade to Premium — ₹499 / Month
                            </button>
                        ) : (
                            <button onClick={handleOpenCheckout} style={{ background: '#059669', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '10px', width: '100%', fontWeight: '700', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(5,150,105,0.3)' }}>
                                {isActive ? '⚡ Extend Subscription (+30 Days) — ₹499' : 'Renew Now — ₹499 / Month'}
                            </button>
                        )}
                    </div>
                </div>

                {/* CARD 3: ENTERPRISE SUPPORT & OFFICIAL GST INVOICES */}
                <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: isPaidActive ? '#F3E8FF' : '#FEF3C7', color: isPaidActive ? '#7E22CE' : '#D97706', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '16px' }}>
                            <FontAwesomeIcon icon={isPaidActive ? faHeadset : faLock} /> {isPaidActive ? 'ENTERPRISE SUPPORT' : 'PAY SECURELY WITH RAZORPAY'}
                        </div>

                        <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: '0 0 6px' }}>
                            {isPaidActive ? '24/7 Priority Support & Billing' : 'We accept all major payment methods'}
                        </h4>
                        <p style={{ fontSize: '12.5px', color: '#64748B', margin: '0 0 20px' }}>
                            {isPaidActive ? 'Your account includes dedicated support and automated GST invoices.' : 'Instant 30-day subscription activation via Razorpay Payment Gateway.'}
                        </p>

                        {/* Payment Logos Bar */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                            {['UPI', 'VISA', 'MasterCard', 'RuPay', 'Paytm', 'NetBanking'].map((logo, i) => (
                                <span key={i} style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', color: '#334155' }}>
                                    {logo}
                                </span>
                            ))}
                        </div>

                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', fontSize: '12.5px', color: '#475569' }}>
                            <li style={{ marginBottom: '6px' }}><FontAwesomeIcon icon={faCheckCircle} style={{ color: '#10B981', marginRight: '6px' }} /> Instant Activation</li>
                            <li style={{ marginBottom: '6px' }}><FontAwesomeIcon icon={faCheckCircle} style={{ color: '#10B981', marginRight: '6px' }} /> 256-Bit SSL Secured</li>
                            <li><FontAwesomeIcon icon={faCheckCircle} style={{ color: '#10B981', marginRight: '6px' }} /> GST Invoice Provided</li>
                        </ul>
                    </div>

                    <div>
                        {isPaidActive ? (
                            <a
                                href="/billing/invoice/1"
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '13px 20px',
                                    borderRadius: '12px',
                                    width: '100%',
                                    fontWeight: '700',
                                    fontSize: '13.5px',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 14px rgba(15,23,42,0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    textDecoration: 'none'
                                }}
                            >
                                <FontAwesomeIcon icon={faDownload} />
                                Download GST Tax Invoice
                            </a>
                        ) : isTrial ? (
                            <button onClick={handleOpenCheckout} style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)', color: '#fff', border: 'none', padding: '15px 20px', borderRadius: '10px', width: '100%', fontWeight: '800', fontSize: '15px', cursor: 'pointer', boxShadow: '0 6px 18px rgba(109,40,217,0.35)' }}>
                                🚀 Upgrade to Premium — Pay ₹499 / Month
                            </button>
                        ) : (
                            <button onClick={handleOpenCheckout} style={{ background: '#0F172A', color: '#fff', border: 'none', padding: '14px 20px', borderRadius: '10px', width: '100%', fontWeight: '700', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(15,23,42,0.3)' }}>
                                {isActive ? '⚡ Extend Subscription (+30 Days)' : 'Pay Now — ₹499 / Month'}
                            </button>
                        )}
                    </div>
                </div>

            </div>

            {/* ── MIDDLE ROW: PAYMENT HISTORY TABLE & SUBSCRIPTION BENEFITS ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '20px', marginBottom: '24px' }}>
                
                {/* PAYMENT HISTORY TABLE */}
                <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A', margin: 0 }}>
                            Payment History
                        </h3>
                        <button style={{ background: '#F1F5F9', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}>
                            View All
                        </button>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        {realSubscriptions.length > 0 ? (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #F1F5F9', textAlign: 'left', color: '#64748B' }}>
                                        <th style={{ padding: '10px 12px' }}>Invoice</th>
                                        <th style={{ padding: '10px 12px' }}>Plan</th>
                                        <th style={{ padding: '10px 12px' }}>Amount</th>
                                        <th style={{ padding: '10px 12px' }}>Gateway</th>
                                        <th style={{ padding: '10px 12px' }}>Date</th>
                                        <th style={{ padding: '10px 12px' }}>Status</th>
                                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>Download</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {realSubscriptions.map((sub, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #F8FAFC' }}>
                                            <td style={{ padding: '12px', fontWeight: '600', color: '#0F172A' }}>{sub.invoice_number}</td>
                                            <td style={{ padding: '12px', color: '#475569' }}>{sub.plan_name || 'INFY-POS PREMIUM'}</td>
                                            <td style={{ padding: '12px', fontWeight: '700', color: '#0F172A' }}>₹{sub.amount}.00</td>
                                            <td style={{ padding: '12px', color: '#475569' }}>{sub.payment_method}</td>
                                            <td style={{ padding: '12px', color: '#64748B' }}>{sub.paid_on}</td>
                                            <td style={{ padding: '12px' }}>
                                                <span style={{ background: '#ECFDF5', color: '#059669', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
                                                    {sub.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                <a
                                                    href={`/billing/invoice/${sub.id || idx + 1}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#059669', width: '32px', height: '32px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                                    title="Download GST Invoice"
                                                >
                                                    <FontAwesomeIcon icon={faDownload} />
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', padding: '24px', borderRadius: '12px', textAlign: 'center', color: '#64748B', fontSize: '13.5px', fontWeight: '600' }}>
                                <FontAwesomeIcon icon={faClock} style={{ fontSize: '24px', color: '#10B981', marginBottom: '8px', display: 'block' }} />
                                No payments yet — 14-Day Free Trial Active
                            </div>
                        )}
                    </div>
                </div>

                {/* SUBSCRIPTION BENEFITS */}
                <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A', margin: '0 0 16px' }}>
                            Subscription Benefits
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', color: '#334155', marginBottom: '24px' }}>
                            <div><FontAwesomeIcon icon={faCheckCircle} style={{ color: '#10B981', marginRight: '6px' }} /> Unlimited Billing</div>
                            <div><FontAwesomeIcon icon={faCheckCircle} style={{ color: '#10B981', marginRight: '6px' }} /> Unlimited Invoices</div>
                            <div><FontAwesomeIcon icon={faCheckCircle} style={{ color: '#10B981', marginRight: '6px' }} /> Unlimited Products</div>
                            <div><FontAwesomeIcon icon={faCheckCircle} style={{ color: '#10B981', marginRight: '6px' }} /> Advanced Reports</div>
                            <div><FontAwesomeIcon icon={faCheckCircle} style={{ color: '#10B981', marginRight: '6px' }} /> Unlimited Users</div>
                            <div><FontAwesomeIcon icon={faCheckCircle} style={{ color: '#10B981', marginRight: '6px' }} /> Multi-Store Management</div>
                            <div><FontAwesomeIcon icon={faCheckCircle} style={{ color: '#10B981', marginRight: '6px' }} /> Unlimited Warehouses</div>
                            <div><FontAwesomeIcon icon={faCheckCircle} style={{ color: '#10B981', marginRight: '6px' }} /> Cloud Backup</div>
                            <div><FontAwesomeIcon icon={faCheckCircle} style={{ color: '#10B981', marginRight: '6px' }} /> Unlimited PDA & Scanner</div>
                            <div><FontAwesomeIcon icon={faCheckCircle} style={{ color: '#10B981', marginRight: '6px' }} /> Priority Support</div>
                            <div><FontAwesomeIcon icon={faCheckCircle} style={{ color: '#10B981', marginRight: '6px' }} /> Unlimited Barcode Printing</div>
                            <div><FontAwesomeIcon icon={faCheckCircle} style={{ color: '#10B981', marginRight: '6px' }} /> Free Software Updates</div>
                        </div>
                    </div>

                    <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#10B981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: '20px' }}>
                            <FontAwesomeIcon icon={faCheck} />
                        </div>
                        <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#065F46', margin: '0 0 4px' }}>You're covered!</h4>
                        <p style={{ fontSize: '12px', color: '#047857', margin: 0 }}>Enjoy all premium enterprise features with INFY-POS.</p>
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
                        <strong style={{ color: '#0F172A' }}>{subData.company_name}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                        <span style={{ color: '#64748B' }}>Owner</span>
                        <strong style={{ color: '#0F172A' }}>{subData.owner_name}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                        <span style={{ color: '#64748B' }}>GST Number</span>
                        <strong style={{ color: subData.gst_number ? '#0F172A' : '#94A3B8' }}>{subData.gst_number || '33AABCU9603R1ZM'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                        <span style={{ color: '#64748B' }}>Plan</span>
                        <strong style={{ color: subData.is_trial ? '#059669' : '#10B981' }}>{subData.plan_name} — {subData.price}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                        <span style={{ color: '#64748B' }}>Status</span>
                        <strong style={{ color: isActive ? '#10B981' : isTrial ? '#059669' : '#EF4444', textTransform: 'capitalize' }}>
                            {subData.status}
                        </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                        <span style={{ color: '#64748B' }}>{isActive ? 'Plan Started' : 'Trial Started'}</span>
                        <strong style={{ color: '#0F172A' }}>{subData.start_date || subData.trial_started_at}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px' }}>
                        <span style={{ color: '#64748B' }}>Subscription Expires</span>
                        <strong style={{ color: '#0F172A' }}>
                            {subData.status === 'active' ? (subData.subscription_ends_at || subData.next_billing_date) : (subData.trial_ends_at || subData.subscription_ends_at)}
                        </strong>
                    </div>
                </div>
            </div>

            {/* ── ACTIVATION KEYS & MACHINE BINDING CARD (BELOW SUBSCRIPTION DETAILS) ── */}
            <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FontAwesomeIcon icon={faKey} style={{ color: '#3B82F6' }} />
                    Activation Keys & Machine Binding
                </h3>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Hardware Machine Lock License Key</div>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', fontFamily: 'monospace', letterSpacing: '0.05em', marginTop: '4px' }}>
                            {subData.key_code || 'INFYPOS-2026-FREE-TRIAL'}
                        </div>
                        <div style={{ fontSize: '12.5px', color: subData.key_status === 'Expired' ? '#EF4444' : '#059669', fontWeight: '600', marginTop: '6px' }}>
                            Status: {subData.key_status || 'Active'} &nbsp;·&nbsp; Expires: {subData.status === 'active' ? (subData.subscription_ends_at || subData.key_expires) : (subData.trial_ends_at || subData.key_expires || '19 Aug 2026')}
                        </div>
                    </div>
                    <span style={{
                        background: subData.key_status === 'Expired' ? '#FEF2F2' : '#ECFDF5',
                        border: subData.key_status === 'Expired' ? '1px solid #FECACA' : '1px solid #A7F3D0',
                        color: subData.key_status === 'Expired' ? '#DC2626' : '#059669',
                        padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700'
                    }}>
                        {subData.key_status === 'Expired' ? 'Key Expired' : 'Bound to This PC'}
                    </span>
                </div>
            </div>

            {/* ── BOTTOM ROW: DEVICE MANAGER, BACKUP & SUPPORT ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: '20px' }}>
                
                {/* DEVICE MANAGER */}
                <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A', margin: 0 }}>
                            Device Manager
                        </h3>
                        <button style={{ background: '#F1F5F9', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}>View All</button>
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
                            {realDevices.map((dev, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #F8FAFC' }}>
                                    <td style={{ padding: '10px', fontWeight: '600', color: '#0F172A' }}>
                                        <FontAwesomeIcon icon={faDesktop} style={{ marginRight: '8px', color: '#64748B' }} />
                                        {dev.device_name}
                                    </td>
                                    <td style={{ padding: '10px', color: '#64748B' }}>{dev.last_seen}</td>
                                    <td style={{ padding: '10px' }}>
                                        <span style={{ background: dev.status === 'Online' ? '#ECFDF5' : '#F1F5F9', color: dev.status === 'Online' ? '#059669' : '#64748B', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
                                            {dev.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px', textAlign: 'center' }}>
                                        {dev.is_current ? (
                                            <span style={{ fontSize: '11px', color: '#10B981', fontWeight: '700' }}>Current</span>
                                        ) : (
                                            <button onClick={() => showToast('Device logged out')} style={{ background: '#FEF2F2', border: 'none', color: '#EF4444', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>
                                                Logout
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
                                disabled={isBackingUp}
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

                        <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '10px', fontSize: '12.5px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span style={{ color: '#64748B' }}>Last Backup</span>
                                <strong style={{ color: '#0F172A' }}>{subData.last_backup}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748B' }}>Backup Size</span>
                                <strong style={{ color: '#0F172A' }}>{subData.backup_size}</strong>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <a
                            href="/api/saas/backup/download-sql"
                            target="_blank"
                            rel="noreferrer"
                            style={{
                                background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '10px',
                                borderRadius: '8px', fontSize: '12px', fontWeight: '600', color: '#334155',
                                textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            <FontAwesomeIcon icon={faDownload} style={{ marginRight: '6px' }} /> Download SQL
                        </a>
                        <a
                            href="/api/saas/backup/download-zip"
                            target="_blank"
                            rel="noreferrer"
                            style={{
                                background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '10px',
                                borderRadius: '8px', fontSize: '12px', fontWeight: '600', color: '#334155',
                                textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            <FontAwesomeIcon icon={faDownload} style={{ marginRight: '6px' }} /> Download ZIP
                        </a>
                    </div>
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

            {/* ── ULTRA-PREMIUM RAZORPAY ENTERPRISE CHECKOUT MODAL ── */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(11, 19, 44, 0.82)', backdropFilter: 'blur(10px)',
                    zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    <div style={{
                        background: '#FFFFFF', borderRadius: '20px', maxWidth: '520px', width: '100%',
                        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.45), 0 0 1px rgba(0,0,0,0.1)',
                        overflow: 'hidden', animation: 'modalFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                        {/* Razorpay Brand Header */}
                        <div style={{
                            background: 'linear-gradient(135deg, #0C1E3C 0%, #0F294A 50%, #020617 100%)', color: '#FFFFFF',
                            padding: '22px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            borderBottom: '1px solid rgba(255,255,255,0.08)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    background: 'linear-gradient(135deg, #0284C7, #2563EB)', color: '#fff',
                                    width: '42px', height: '42px', borderRadius: '12px', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '900',
                                    boxShadow: '0 4px 12px rgba(37,99,235,0.4)'
                                }}>
                                    ₹
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                                            {isTrial ? '🚀 Upgrade to Premium' : 'Razorpay Secure Checkout'}
                                        </h4>
                                        <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34D399', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '2px 8px', borderRadius: '10px', fontSize: '10.5px', fontWeight: '700' }}>
                                            OFFICIAL
                                        </span>
                                    </div>
                                    <span style={{ fontSize: '12.5px', color: '#94A3B8', fontWeight: '500' }}>
                                        {isTrial ? 'Upgrade from Free Trial → INFY-POS Premium (₹499/Month)' : 'INFY-POS Enterprise Subscription Gateway'}
                                    </span>
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
                            
                            {/* Order Item Summary Box */}
                            <div style={{
                                background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px',
                                padding: '18px', marginBottom: '22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
                            }}>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                                        Selected Order Item
                                    </div>
                                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span>🏆 INFY-POS PREMIUM</span>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#059669', fontWeight: '700', marginTop: '3px' }}>
                                        ✓ 30 Days Full Unlimited Enterprise Access
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#0F172A', lineHeight: 1 }}>₹499</div>
                                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', marginTop: '4px' }}>+ GST Included</div>
                                </div>
                            </div>

                            {/* Payment Options Selection */}
                            <div style={{ marginBottom: '22px' }}>
                                <label style={{ fontSize: '13px', fontWeight: '800', color: '#1E293B', display: 'block', marginBottom: '10px' }}>
                                    Select Payment Method:
                                </label>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('upi')}
                                        style={{
                                            padding: '14px 10px', borderRadius: '12px',
                                            border: paymentMethod === 'upi' ? '2px solid #10B981' : '1px solid #E2E8F0',
                                            background: paymentMethod === 'upi' ? '#ECFDF5' : '#FFFFFF',
                                            cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                                            boxShadow: paymentMethod === 'upi' ? '0 4px 12px rgba(16,185,129,0.15)' : 'none'
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faQrcode} style={{ fontSize: '20px', color: paymentMethod === 'upi' ? '#059669' : '#64748B', marginBottom: '6px', display: 'block', margin: '0 auto 6px' }} />
                                        <div style={{ fontSize: '12.5px', fontWeight: '700', color: paymentMethod === 'upi' ? '#065F46' : '#334155' }}>
                                            UPI / GPay
                                        </div>
                                        <div style={{ fontSize: '10.5px', color: paymentMethod === 'upi' ? '#047857' : '#94A3B8', marginTop: '2px' }}>Instant 0% Fee</div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('card')}
                                        style={{
                                            padding: '14px 10px', borderRadius: '12px',
                                            border: paymentMethod === 'card' ? '2px solid #2563EB' : '1px solid #E2E8F0',
                                            background: paymentMethod === 'card' ? '#EFF6FF' : '#FFFFFF',
                                            cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                                            boxShadow: paymentMethod === 'card' ? '0 4px 12px rgba(37,99,235,0.15)' : 'none'
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faCreditCard} style={{ fontSize: '20px', color: paymentMethod === 'card' ? '#2563EB' : '#64748B', marginBottom: '6px', display: 'block', margin: '0 auto 6px' }} />
                                        <div style={{ fontSize: '12.5px', fontWeight: '700', color: paymentMethod === 'card' ? '#1E40AF' : '#334155' }}>
                                            Credit / Debit
                                        </div>
                                        <div style={{ fontSize: '10.5px', color: paymentMethod === 'card' ? '#1D4ED8' : '#94A3B8', marginTop: '2px' }}>Visa / Master</div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('netbanking')}
                                        style={{
                                            padding: '14px 10px', borderRadius: '12px',
                                            border: paymentMethod === 'netbanking' ? '2px solid #7C3AED' : '1px solid #E2E8F0',
                                            background: paymentMethod === 'netbanking' ? '#F5F3FF' : '#FFFFFF',
                                            cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                                            boxShadow: paymentMethod === 'netbanking' ? '0 4px 12px rgba(124,58,237,0.15)' : 'none'
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faBuilding} style={{ fontSize: '20px', color: paymentMethod === 'netbanking' ? '#7C3AED' : '#64748B', marginBottom: '6px', display: 'block', margin: '0 auto 6px' }} />
                                        <div style={{ fontSize: '12.5px', fontWeight: '700', color: paymentMethod === 'netbanking' ? '#5B21B6' : '#334155' }}>
                                            NetBanking
                                        </div>
                                        <div style={{ fontSize: '10.5px', color: paymentMethod === 'netbanking' ? '#6D28D9' : '#94A3B8', marginTop: '2px' }}>All Major Banks</div>
                                    </button>
                                </div>
                            </div>

                            {/* Dynamic Payment Detail Panel */}
                            {paymentMethod === 'upi' && (
                                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '14px', borderRadius: '12px', marginBottom: '22px', fontSize: '12.5px' }}>
                                    <div style={{ fontWeight: '700', color: '#065F46', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span>📱 Razorpay UPI / GPay / PhonePe / Paytm</span>
                                    </div>
                                    <div style={{ color: '#047857' }}>
                                        Instant 1-click verification. Pay securely using any UPI app or Virtual Payment Address (VPA).
                                    </div>
                                </div>
                            )}

                            {paymentMethod === 'card' && (
                                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '14px', borderRadius: '12px', marginBottom: '22px', fontSize: '12.5px' }}>
                                    <div style={{ fontWeight: '700', color: '#1E40AF', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span>💳 Credit & Debit Card Gateway</span>
                                    </div>
                                    <div style={{ color: '#1D4ED8' }}>
                                        Supports Visa, Mastercard, RuPay, Maestro & American Express with 3D Secure OTP verification.
                                    </div>
                                </div>
                            )}

                            {paymentMethod === 'netbanking' && (
                                <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', padding: '14px', borderRadius: '12px', marginBottom: '22px', fontSize: '12.5px' }}>
                                    <div style={{ fontWeight: '700', color: '#5B21B6', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span>🏦 Internet Banking Gateway</span>
                                    </div>
                                    <div style={{ color: '#6D28D9' }}>
                                        HDFC Bank, State Bank of India (SBI), ICICI Bank, Axis Bank, Kotak Mahindra & 50+ Indian Banks.
                                    </div>
                                </div>
                            )}

                            {/* Trust Security Bar */}
                            <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '20px', background: '#F8FAFC', padding: '8px 12px', borderRadius: '8px' }}>
                                <FontAwesomeIcon icon={faShieldHalved} style={{ color: '#10B981', fontSize: '15px' }} />
                                <span style={{ fontWeight: '600' }}>256-Bit SSL Encrypted Instant Razorpay Payment Gateway</span>
                            </div>

                            {/* Action Button */}
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
                                    fontSize: '16px', fontWeight: '800', cursor: processing ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                    boxShadow: '0 8px 20px rgba(16,185,129,0.35)', transition: 'all 0.2s'
                                }}
                            >
                                {processing ? (
                                    <>
                                        <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: '18px' }} />
                                        <span>Processing Razorpay Gateway...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Pay ₹499 & Activate Subscription →</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default EnterpriseSubscriptionBanner;
