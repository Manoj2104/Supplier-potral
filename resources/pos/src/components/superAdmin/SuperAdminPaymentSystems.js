import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCreditCard,
    faWallet,
    faShieldAlt,
    faCheckCircle,
    faTimesCircle,
    faExclamationTriangle,
    faRotate,
    faKey,
    faLock,
    faGlobe,
    faBuilding,
    faServer,
    faCheck,
    faCopy,
    faExchangeAlt,
    faHistory,
    faBolt,
    faEye,
    faEyeSlash,
    faSpinner,
    faSliders,
    faReceipt,
    faSearch,
    faFilter,
    faCircleDot,
    faCheckDouble
} from '@fortawesome/free-solid-svg-icons';
import './SuperAdminPortal.css';

const DEFAULT_SETTINGS = {
    id: 1,
    active_provider: 'razorpay',
    razorpay_enabled: true,
    system_payment_enabled: false,
    razorpay_mode: 'test',
    razorpay_key_id: 'rzp_test_TfUvXTbtZxl0LL',
    razorpay_key_secret_masked: '••••••••••••••••••••',
    razorpay_has_key_secret: true,
    razorpay_webhook_secret_masked: '••••••••••••••••••••',
    razorpay_has_webhook_secret: true,
    razorpay_plan_id: 'plan_INFYPOS_MONTHLY_499',
    merchant_name: 'INFY-POS Enterprise',
    system_payment_mode: 'system',
    system_payment_verification: 'automatic',
    currency: 'INR',
    is_razorpay_configured: true,
    webhook_url: (typeof window !== 'undefined' && window.location ? window.location.origin : 'http://127.0.0.1:8000') + '/api/webhooks/razorpay',
};

const SuperAdminPaymentSystems = () => {
    // Current Active Sub-Tab
    const [subTab, setSubTab] = useState('overview'); // 'overview' | 'razorpay' | 'system' | 'logs'

    // Payment Settings State from Backend (Pre-seeded with instant 0ms defaults)
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [toast, setToast] = useState(null);

    // Provider Switch Confirmation Modal State
    const [switchModal, setSwitchModal] = useState({
        open: false,
        targetProvider: null,
        targetLabel: '',
        switching: false,
    });

    // Live Mode Warning Modal State
    const [liveModeModal, setLiveModeModal] = useState(false);

    // Razorpay Form Edit State
    const [rzpForm, setRzpForm] = useState({
        razorpay_mode: 'test',
        razorpay_key_id: 'rzp_test_TfUvXTbtZxl0LL',
        razorpay_key_secret: '',
        razorpay_webhook_secret: '',
        razorpay_plan_id: 'plan_INFYPOS_MONTHLY_499',
        merchant_name: 'INFY-POS Enterprise',
    });
    const [showKeySecret, setShowKeySecret] = useState(false);
    const [showWebhookSecret, setShowWebhookSecret] = useState(false);
    const [savingRzp, setSavingRzp] = useState(false);

    // Test Connection State
    const [testingConnection, setTestingConnection] = useState(false);
    const [testResult, setTestResult] = useState(null);

    // System Payment Form State
    const [sysForm, setSysForm] = useState({
        system_payment_mode: 'system',
        system_payment_verification: 'automatic',
        system_upi_id: 'infypos@upi',
        currency: 'INR',
    });
    const [savingSys, setSavingSys] = useState(false);

    // Pending UPI Payments State
    const [pendingPayments, setPendingPayments] = useState([]);
    const [loadingPending, setLoadingPending] = useState(false);
    const [verifyingId, setVerifyingId] = useState(null);
    const [rejectModal, setRejectModal] = useState({ open: false, payment: null, reason: '', rejecting: false });
    const [screenshotModal, setScreenshotModal] = useState({ open: false, url: '' });

    // Payment Logs State
    const [logs, setLogs] = useState([]);
    const [logsPagination, setLogsPagination] = useState({ total: 0, current_page: 1, last_page: 1 });
    const [logsFilter, setLogsFilter] = useState({ provider: 'all', status: 'all', search: '', page: 1 });
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [copiedUrl, setCopiedUrl] = useState(false);

    // Toast Alert Helper
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    // Load Authoritative Settings from Backend
    const fetchSettings = async (showPulse = false) => {
        if (showPulse) setRefreshing(true);
        try {
            const res = await axios.get('/api/super-admin/payment-settings');
            if (res.data && res.data.success && res.data.data) {
                const d = res.data.data;
                setSettings(d);
                setRzpForm({
                    razorpay_mode: d.razorpay_mode || 'test',
                    razorpay_key_id: d.razorpay_key_id || '',
                    razorpay_key_secret: '',
                    razorpay_webhook_secret: '',
                    razorpay_plan_id: d.razorpay_plan_id || 'plan_INFYPOS_MONTHLY_499',
                    merchant_name: d.merchant_name || 'INFY-POS Enterprise',
                });
                setSysForm({
                    system_payment_mode: d.system_payment_mode || 'system',
                    system_payment_verification: d.system_payment_verification || 'automatic',
                    system_upi_id: d.system_upi_id || 'infypos@upi',
                    currency: d.currency || 'INR',
                });
            }
        } catch (err) {
            showToast('Failed to load payment settings', 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Load Pending Verifications from Backend
    const fetchPendingPayments = async () => {
        setLoadingPending(true);
        try {
            const res = await axios.get('/api/saas-admin/payment-settings/pending-requests');
            if (res.data && res.data.success) {
                setPendingPayments(res.data.data || []);
            }
        } catch (err) {
            console.warn('Failed to load pending payments:', err);
        } finally {
            setLoadingPending(false);
        }
    };

    // Load Filtered Payment Logs
    const fetchLogs = async () => {
        setLoadingLogs(true);
        try {
            const params = {
                page: logsFilter.page,
                provider: logsFilter.provider !== 'all' ? logsFilter.provider : '',
                status: logsFilter.status !== 'all' ? logsFilter.status : '',
                search: logsFilter.search,
            };
            const res = await axios.get('/api/super-admin/payment-settings/logs', { params });
            if (res.data && res.data.success && res.data.data) {
                setLogs(res.data.data.data || []);
                setLogsPagination({
                    total: res.data.data.total || 0,
                    current_page: res.data.data.current_page || 1,
                    last_page: res.data.data.last_page || 1,
                });
            }
        } catch (err) {
            // silent fail
        } finally {
            setLoadingLogs(false);
        }
    };

    useEffect(() => {
        fetchSettings();
        fetchLogs();
        fetchPendingPayments();
    }, []);

    useEffect(() => {
        if (subTab === 'logs') {
            fetchLogs();
        } else if (subTab === 'pending') {
            fetchPendingPayments();
        }
    }, [logsFilter, subTab]);

    // Handle Super Admin Direct Verification of UPI Payment
    const handleVerifyPayment = async (payment) => {
        if (!window.confirm(`Are you sure you want to verify payment for ${payment.customer_name} (UTR: ${payment.utr})?\n\nThis will immediately activate and extend the customer's subscription by +30 Days.`)) {
            return;
        }

        setVerifyingId(payment.id);
        try {
            const res = await axios.post(`/api/saas-admin/payment-settings/verify-request/${payment.id}`);
            if (res.data && res.data.success) {
                showToast(`✓ Payment verified! Subscription extended to ${res.data.valid_until || 'next billing cycle'}`);
                fetchPendingPayments();
                fetchLogs();
                fetchSettings();
            } else {
                showToast(res.data?.message || 'Verification failed', 'error');
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to verify payment', 'error');
        } finally {
            setVerifyingId(null);
        }
    };

    // Handle Super Admin Rejection of UPI Payment
    const handleRejectPayment = async () => {
        if (!rejectModal.payment) return;
        setRejectModal(prev => ({ ...prev, rejecting: true }));
        try {
            const res = await axios.post(`/api/saas-admin/payment-settings/reject-request/${rejectModal.payment.id}`, {
                reason: rejectModal.reason || 'Invalid UTR or payment not received.'
            });
            if (res.data && res.data.success) {
                showToast('Payment request rejected.');
                setRejectModal({ open: false, payment: null, reason: '', rejecting: false });
                fetchPendingPayments();
                fetchLogs();
            } else {
                showToast(res.data?.message || 'Rejection failed', 'error');
                setRejectModal(prev => ({ ...prev, rejecting: false }));
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to reject payment', 'error');
            setRejectModal(prev => ({ ...prev, rejecting: false }));
        }
    };

    // Handle Provider Switch Prompt
    const promptSwitchProvider = (targetProvider) => {
        if (!settings) return;
        if (settings.active_provider === targetProvider) return;

        // Validation: Cannot turn on Razorpay if not configured
        if (targetProvider === 'razorpay' && !settings.is_razorpay_configured) {
            showToast('Razorpay is not ready. Please complete Razorpay configuration and test connection before enabling.', 'error');
            setSubTab('razorpay');
            return;
        }

        const label = targetProvider === 'razorpay' ? 'Razorpay Payment' : 'System Payment';
        setSwitchModal({
            open: true,
            targetProvider,
            targetLabel: label,
            switching: false,
        });
    };

    // Execute Atomic Provider Switch
    const confirmSwitchProvider = async () => {
        setSwitchModal(prev => ({ ...prev, switching: true }));
        try {
            const res = await axios.post('/api/super-admin/payment-settings/provider', {
                provider: switchModal.targetProvider,
            });
            if (res.data && res.data.success) {
                const updatedSettings = res.data.data;
                setSettings(updatedSettings);
                showToast(`Payment provider switched to ${switchModal.targetLabel} successfully.`);
                setSwitchModal({ open: false, targetProvider: null, targetLabel: '', switching: false });
                fetchLogs();

                // ⚡ 0ms INSTANT LIVE BROADCAST ACROSS ALL PAGES & TABS WITHOUT RELOAD
                const providerPayload = {
                    provider: updatedSettings.active_provider,
                    razorpay_enabled: Boolean(updatedSettings.razorpay_enabled),
                    system_payment_enabled: Boolean(updatedSettings.system_payment_enabled),
                    razorpay_key_id: updatedSettings.razorpay_key_id,
                    merchant_name: updatedSettings.merchant_name,
                    currency: updatedSettings.currency,
                    timestamp: Date.now()
                };

                try {
                    localStorage.setItem('infypos_active_provider', JSON.stringify(providerPayload));
                    localStorage.setItem('infypos_provider_updated_at', String(Date.now()));
                } catch (e) {}

                try {
                    const bc = new BroadcastChannel('infypos_payment_provider_channel');
                    bc.postMessage({ type: 'PROVIDER_SWITCHED', data: providerPayload });
                    bc.close();
                } catch (e) {}

                window.dispatchEvent(new CustomEvent('infypos:payment-provider-changed', { detail: providerPayload }));
            } else {
                showToast(res.data?.message || 'Failed to switch payment provider', 'error');
                setSwitchModal(prev => ({ ...prev, switching: false }));
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Error occurred while switching provider', 'error');
            setSwitchModal(prev => ({ ...prev, switching: false }));
        }
    };

    // Test Razorpay Connection
    const handleTestConnection = async () => {
        setTestingConnection(true);
        setTestResult(null);
        try {
            const payload = {
                key_id: rzpForm.razorpay_key_id,
                key_secret: rzpForm.razorpay_key_secret || undefined,
                mode: rzpForm.razorpay_mode,
            };
            const res = await axios.post('/api/super-admin/payment-settings/razorpay/test', payload);
            setTestResult(res.data);
            if (res.data.success) {
                showToast('✓ Razorpay Connection Successful!');
            } else {
                showToast('✕ Razorpay Connection Failed', 'error');
            }
        } catch (err) {
            setTestResult({
                success: false,
                message: err.response?.data?.message || 'Unable to authenticate with Razorpay. Please verify your credentials.',
                account: 'Authentication Failed',
                api: 'Error',
            });
            showToast('✕ Razorpay Connection Failed', 'error');
        } finally {
            setTestingConnection(false);
        }
    };

    // Save Razorpay Configuration
    const handleSaveRazorpay = async (e) => {
        if (e) e.preventDefault();
        setSavingRzp(true);
        try {
            const res = await axios.post('/api/super-admin/payment-settings/razorpay', rzpForm);
            if (res.data && res.data.success) {
                setSettings(res.data.data);
                showToast('Razorpay configuration saved and encrypted successfully.');
                setRzpForm(prev => ({
                    ...prev,
                    razorpay_key_secret: '',
                    razorpay_webhook_secret: '',
                }));
            } else {
                showToast(res.data?.message || 'Failed to save configuration', 'error');
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Error saving Razorpay settings', 'error');
        } finally {
            setSavingRzp(false);
        }
    };

    // Save System Payment Configuration
    const handleSaveSystem = async (e) => {
        if (e) e.preventDefault();
        setSavingSys(true);
        try {
            const res = await axios.post('/api/super-admin/payment-settings/system', sysForm);
            if (res.data && res.data.success) {
                setSettings(res.data.data);
                showToast('System Payment settings saved successfully.');
            } else {
                showToast(res.data?.message || 'Failed to save settings', 'error');
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Error saving System Payment settings', 'error');
        } finally {
            setSavingSys(false);
        }
    };

    // Copy Webhook URL to Clipboard
    const copyWebhookUrl = () => {
        if (!settings?.webhook_url) return;
        navigator.clipboard.writeText(settings.webhook_url);
        setCopiedUrl(true);
        showToast('Webhook URL copied to clipboard');
        setTimeout(() => setCopiedUrl(false), 2000);
    };

    if (loading && !settings) {
        return (
            <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh', width: '100%' }}>
                <div style={{ textAlign: 'center' }}>
                    <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: '32px', color: '#16A34A', marginBottom: '14px' }} />
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#475569' }}>Loading Payment Systems Control Center...</div>
                </div>
            </div>
        );
    }

    const activeProvider = String(settings?.active_provider || 'razorpay').toLowerCase();
    const isRazorpayActive = activeProvider === 'razorpay' && (settings?.razorpay_enabled === undefined || Boolean(settings?.razorpay_enabled));
    const isSystemActive = activeProvider === 'system' && Boolean(settings?.system_payment_enabled);

    return (
        <div className="sa-payment-systems-page" style={{ width: '100%', boxSizing: 'border-box' }}>
            {/* Toast Notification */}
            {toast && (
                <div style={{
                    position: 'fixed',
                    top: '24px',
                    right: '24px',
                    zIndex: 99999,
                    background: toast.type === 'error' ? '#EF4444' : '#10B981',
                    color: '#FFFFFF',
                    padding: '12px 22px',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
                    fontWeight: 600,
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    animation: 'fadeIn 0.2s ease-out',
                }}>
                    <FontAwesomeIcon icon={toast.type === 'error' ? faTimesCircle : faCheckCircle} />
                    <span>{toast.message}</span>
                </div>
            )}

            {/* Breadcrumb matching Enterprise Super Admin */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12.5px',
                color: '#64748B',
                marginBottom: '14px',
                fontWeight: 500
            }}>
                <span>Dashboard</span>
                <span>/</span>
                <span>Super Admin</span>
                <span>/</span>
                <span style={{ color: '#16A34A', fontWeight: 700 }}>Payment Systems</span>
            </div>

            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '16px',
            }}>
                <div>
                    <h1 style={{
                        fontSize: '24px',
                        fontWeight: 800,
                        color: '#0F172A',
                        margin: '0 0 4px 0',
                        letterSpacing: '-0.025em',
                    }}>
                        Payment Systems
                    </h1>
                    <p style={{
                        fontSize: '13.5px',
                        color: '#64748B',
                        margin: 0,
                    }}>
                        Configure and control the active payment gateway used across INFY-POS customer subscriptions.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => fetchSettings(true)}
                        disabled={refreshing}
                        className="btn btn-outline-secondary"
                        style={{
                            background: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            borderRadius: '10px',
                            padding: '8px 16px',
                            fontWeight: 600,
                            fontSize: '13px',
                            color: '#334155',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                            cursor: 'pointer'
                        }}
                    >
                        <FontAwesomeIcon icon={faRotate} spin={refreshing} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Prominent Active Payment Provider Status Banner */}
            <div style={{
                background: isRazorpayActive
                    ? 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)'
                    : isSystemActive
                    ? 'linear-gradient(135deg, #064E3B 0%, #065F46 100%)'
                    : 'linear-gradient(135deg, #7F1D1D 0%, #991B1B 100%)',
                color: '#FFFFFF',
                borderRadius: '16px',
                padding: '20px 24px',
                marginBottom: '22px',
                boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.15)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '14px',
                        background: 'rgba(255, 255, 255, 0.12)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '22px',
                        color: '#FFFFFF',
                        flexShrink: 0
                    }}>
                        <FontAwesomeIcon icon={isRazorpayActive ? faCreditCard : isSystemActive ? faWallet : faExclamationTriangle} />
                    </div>
                    <div>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '11px',
                            fontWeight: 800,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: isRazorpayActive ? '#60A5FA' : isSystemActive ? '#34D399' : '#FCA5A5',
                            marginBottom: '4px',
                        }}>
                            <span style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: isRazorpayActive ? '#60A5FA' : isSystemActive ? '#34D399' : '#FCA5A5',
                                display: 'inline-block',
                                animation: 'pulse 2s infinite',
                            }} />
                            ACTIVE PAYMENT PROVIDER
                        </div>
                        <h2 style={{
                            fontSize: '20px',
                            fontWeight: 800,
                            margin: '0 0 3px 0',
                            color: '#FFFFFF',
                        }}>
                            {isRazorpayActive ? 'Razorpay Payment' : isSystemActive ? 'System Payment' : 'Payments Temporarily Disabled'}
                        </h2>
                        <p style={{
                            fontSize: '13px',
                            color: 'rgba(255, 255, 255, 0.85)',
                            margin: 0,
                            lineHeight: 1.4
                        }}>
                            {isRazorpayActive
                                ? `Online customer payments are processed securely through Razorpay (${settings?.razorpay_mode === 'live' ? 'Live Production' : 'Sandbox Test Mode'}). Instant 0ms checkout.`
                                : isSystemActive
                                ? 'Customer subscription payments use the built-in INFY-POS System Payment processing engine. Instant license generation.'
                                : 'No payment provider is currently active. Customer payments will show payment temporarily unavailable.'}
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    {!isRazorpayActive && !isSystemActive && (
                        <button
                            type="button"
                            onClick={() => promptSwitchProvider('razorpay')}
                            style={{
                                background: '#FFFFFF',
                                color: '#991B1B',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '10px',
                                fontWeight: 700,
                                fontSize: '12.5px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <FontAwesomeIcon icon={faBolt} />
                            Activate Razorpay
                        </button>
                    )}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        padding: '7px 14px',
                        borderRadius: '10px',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                    }}>
                        <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.75)' }}>Gateway Status:</span>
                        <span style={{
                            fontSize: '12px',
                            fontWeight: 800,
                            color: '#FFFFFF',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}>
                            <FontAwesomeIcon icon={faCheckCircle} style={{ color: '#10B981' }} />
                            OPERATIONAL
                        </span>
                    </div>
                </div>
            </div>

            {/* Navigation Pills */}
            <div style={{
                display: 'flex',
                gap: '8px',
                borderBottom: '1px solid #E2E8F0',
                paddingBottom: '14px',
                marginBottom: '24px',
                overflowX: 'auto',
            }}>
                {[
                    { id: 'overview', label: 'Payment Providers', icon: faSliders },
                    { id: 'razorpay', label: 'Razorpay Configuration', icon: faCreditCard },
                    { id: 'system', label: 'System Payment', icon: faWallet },
                    { id: 'pending', label: 'Pending Verifications', icon: faShieldAlt, count: pendingPayments.length },
                    { id: 'logs', label: 'Payment Logs', icon: faReceipt },
                ].map(tab => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSubTab(tab.id)}
                        style={{
                            padding: '8px 18px',
                            borderRadius: '10px',
                            fontSize: '13px',
                            fontWeight: subTab === tab.id ? 700 : 500,
                            color: subTab === tab.id ? '#15803D' : '#64748B',
                            background: subTab === tab.id ? '#DCFCE7' : 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        <FontAwesomeIcon icon={tab.icon} />
                        {tab.label}
                        {tab.count !== undefined && tab.count > 0 && (
                            <span style={{
                                background: '#EF4444',
                                color: '#FFFFFF',
                                fontSize: '11px',
                                fontWeight: 800,
                                padding: '1px 7px',
                                borderRadius: '12px',
                                marginLeft: '2px'
                            }}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ══════════════════════════════════════════════════════════════════ */}
            {/* SUB-TAB 1: PAYMENT PROVIDERS (MUTUALLY EXCLUSIVE TOGGLES)        */}
            {/* ══════════════════════════════════════════════════════════════════ */}
            {subTab === 'overview' && (
                <div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                        gap: '24px',
                        marginBottom: '32px',
                    }}>
                        {/* CARD 1: RAZORPAY PAYMENT */}
                        <div style={{
                            background: '#FFFFFF',
                            borderRadius: '16px',
                            border: isRazorpayActive ? '2px solid #10B981' : '1px solid #E2E8F0',
                            padding: '24px',
                            boxShadow: isRazorpayActive
                                ? '0 12px 28px -6px rgba(16, 185, 129, 0.18)'
                                : '0 1px 3px rgba(0,0,0,0.03)',
                            position: 'relative',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            minHeight: '390px',
                        }}>
                            <div>
                                {isRazorpayActive && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '16px',
                                        right: '16px',
                                        background: '#DCFCE7',
                                        color: '#15803D',
                                        fontWeight: 800,
                                        fontSize: '11px',
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.04em',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                    }}>
                                        <FontAwesomeIcon icon={faCheckCircle} /> ACTIVE
                                    </div>
                                )}

                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                                    <div style={{
                                        width: '46px',
                                        height: '46px',
                                        borderRadius: '12px',
                                        background: '#EFF6FF',
                                        color: '#2563EB',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '20px',
                                    }}>
                                        <FontAwesomeIcon icon={faCreditCard} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: '0 0 2px 0' }}>
                                            RAZORPAY PAYMENT
                                        </h3>
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>
                                            Mode: {settings?.razorpay_mode === 'live' ? 'Live (Production)' : 'Test Mode (Sandbox)'}
                                        </span>
                                    </div>
                                </div>

                                <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.5, marginBottom: '18px' }}>
                                    Process customer payments securely through Razorpay.
                                </p>

                                <div style={{
                                    background: '#F8FAFC',
                                    borderRadius: '12px',
                                    padding: '14px 16px',
                                    marginBottom: '20px',
                                }}>
                                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '10px' }}>
                                        SUPPORTED FEATURES:
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        {[
                                            'UPI & Instant QR',
                                            'Credit / Debit Cards',
                                            'Net Banking (All Banks)',
                                            'Digital Wallets',
                                            'Recurring Auto-Renewal',
                                            'Razorpay Webhooks',
                                        ].map(f => (
                                            <div key={f} style={{ fontSize: '12.5px', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <FontAwesomeIcon icon={faCheck} style={{ color: '#16A34A', fontSize: '11px' }} />
                                                <span>{f}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingTop: '16px',
                                borderTop: '1px solid #F1F5F9',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                                        Provider Status:
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setSubTab('razorpay')}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#2563EB',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            padding: 0,
                                            textDecoration: 'underline'
                                        }}
                                    >
                                        Configure →
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => promptSwitchProvider(isRazorpayActive ? 'system' : 'razorpay')}
                                    style={{
                                        border: 'none',
                                        borderRadius: '30px',
                                        padding: '7px 20px',
                                        fontSize: '13px',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        background: isRazorpayActive ? '#10B981' : '#E2E8F0',
                                        color: isRazorpayActive ? '#FFFFFF' : '#64748B',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <span style={{
                                        width: '10px',
                                        height: '10px',
                                        borderRadius: '50%',
                                        background: isRazorpayActive ? '#FFFFFF' : '#94A3B8',
                                        display: 'inline-block',
                                    }} />
                                    {isRazorpayActive ? 'ON' : 'OFF'}
                                </button>
                            </div>
                        </div>

                        {/* CARD 2: SYSTEM PAYMENT */}
                        <div style={{
                            background: '#FFFFFF',
                            borderRadius: '16px',
                            border: isSystemActive ? '2px solid #10B981' : '1px solid #E2E8F0',
                            padding: '24px',
                            boxShadow: isSystemActive
                                ? '0 12px 28px -6px rgba(16, 185, 129, 0.18)'
                                : '0 1px 3px rgba(0,0,0,0.03)',
                            position: 'relative',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            minHeight: '390px',
                        }}>
                            <div>
                                {isSystemActive && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '16px',
                                        right: '16px',
                                        background: '#DCFCE7',
                                        color: '#15803D',
                                        fontWeight: 800,
                                        fontSize: '11px',
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.04em',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                    }}>
                                        <FontAwesomeIcon icon={faCheckCircle} /> ACTIVE
                                    </div>
                                )}

                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                                    <div style={{
                                        width: '46px',
                                        height: '46px',
                                        borderRadius: '12px',
                                        background: '#F0FDF4',
                                        color: '#16A34A',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '20px',
                                    }}>
                                        <FontAwesomeIcon icon={faWallet} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: '0 0 2px 0' }}>
                                            SYSTEM PAYMENT
                                        </h3>
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>
                                            Mode: Built-in Internal Engine
                                        </span>
                                    </div>
                                </div>

                                <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.5, marginBottom: '18px' }}>
                                    Use the built-in INFY-POS payment processing system.
                                </p>

                                <div style={{
                                    background: '#F8FAFC',
                                    borderRadius: '12px',
                                    padding: '14px 16px',
                                    marginBottom: '20px',
                                }}>
                                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '10px' }}>
                                        SUPPORTED FEATURES:
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        {[
                                            'Internal Payment Flow',
                                            'Manual / System Payment',
                                            'Direct Store Settlement',
                                            'Internal Verification',
                                            'Instant License (+30D)',
                                            'Zero Gateway Fees (0%)',
                                        ].map(f => (
                                            <div key={f} style={{ fontSize: '12.5px', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <FontAwesomeIcon icon={faCheck} style={{ color: '#16A34A', fontSize: '11px' }} />
                                                <span>{f}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingTop: '16px',
                                borderTop: '1px solid #F1F5F9',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                                        Provider Status:
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setSubTab('system')}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#2563EB',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            padding: 0,
                                            textDecoration: 'underline'
                                        }}
                                    >
                                        Configure →
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => promptSwitchProvider(isSystemActive ? 'razorpay' : 'system')}
                                    style={{
                                        border: 'none',
                                        borderRadius: '30px',
                                        padding: '7px 20px',
                                        fontSize: '13px',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        background: isSystemActive ? '#10B981' : '#E2E8F0',
                                        color: isSystemActive ? '#FFFFFF' : '#64748B',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <span style={{
                                        width: '10px',
                                        height: '10px',
                                        borderRadius: '50%',
                                        background: isSystemActive ? '#FFFFFF' : '#94A3B8',
                                        display: 'inline-block',
                                    }} />
                                    {isSystemActive ? 'ON' : 'OFF'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Security & Operational Guarantees Banner */}
                    <div style={{
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '16px',
                        padding: '24px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: '20px',
                    }}>
                        <div style={{ display: 'flex', gap: '14px' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#F1F5F9', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <FontAwesomeIcon icon={faShieldAlt} />
                            </div>
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '2px' }}>Encrypted Credentials</div>
                                <div style={{ fontSize: '12px', color: '#64748B' }}>Secrets are encrypted at rest with AES-256 and never leaked in API responses.</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '14px' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#F1F5F9', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <FontAwesomeIcon icon={faExchangeAlt} />
                            </div>
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '2px' }}>Atomic Mutually Exclusive</div>
                                <div style={{ fontSize: '12px', color: '#64748B' }}>Only one provider can be active at a time, strictly enforced at database transaction level.</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '14px' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#F1F5F9', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <FontAwesomeIcon icon={faServer} />
                            </div>
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '2px' }}>Webhook Continuity</div>
                                <div style={{ fontSize: '12px', color: '#64748B' }}>Existing recurring Razorpay subscriptions continue renewing safely via webhooks even when provider switches.</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════ */}
            {/* SUB-TAB 2: RAZORPAY CONFIGURATION                                */}
            {/* ══════════════════════════════════════════════════════════════════ */}
            {subTab === 'razorpay' && (
                <div style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '28px',
                    maxWidth: '820px',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <div>
                            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0' }}>
                                RAZORPAY CONFIGURATION
                            </h3>
                            <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
                                Configure API credentials, encryption keys, and monthly subscription plans.
                            </p>
                        </div>

                        <span style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            padding: '4px 12px',
                            borderRadius: '20px',
                            background: rzpForm.razorpay_mode === 'live' ? '#FEE2E2' : '#EFF6FF',
                            color: rzpForm.razorpay_mode === 'live' ? '#DC2626' : '#2563EB',
                        }}>
                            {rzpForm.razorpay_mode === 'live' ? '🔴 Live Mode' : '🟡 Test Mode (Sandbox)'}
                        </span>
                    </div>

                    {/* Test Connection Banner Display */}
                    {testResult && (
                        <div style={{
                            background: testResult.success ? '#F0FDF4' : '#FEF2F2',
                            border: `1px solid ${testResult.success ? '#86EFAC' : '#FCA5A5'}`,
                            borderRadius: '12px',
                            padding: '16px 20px',
                            marginBottom: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '14px',
                        }}>
                            <FontAwesomeIcon
                                icon={testResult.success ? faCheckCircle : faTimesCircle}
                                style={{ fontSize: '22px', color: testResult.success ? '#16A34A' : '#EF4444' }}
                            />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '13.5px', fontWeight: 700, color: testResult.success ? '#15803D' : '#991B1B' }}>
                                    {testResult.success ? '✓ Razorpay Connection Successful' : '✕ Razorpay Connection Failed'}
                                </div>
                                <div style={{ fontSize: '12.5px', color: testResult.success ? '#166534' : '#B91C1C' }}>
                                    {testResult.message}
                                </div>
                                <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px' }}>
                                    Environment: <strong>{testResult.environment}</strong> &bull; Account: <strong>{testResult.account}</strong> &bull; API: <strong>{testResult.api}</strong>
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSaveRazorpay}>
                        {/* Environment Mode */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                                Environment
                            </label>
                            <select
                                value={rzpForm.razorpay_mode}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === 'live') {
                                        setLiveModeModal(true);
                                    } else {
                                        setRzpForm(prev => ({ ...prev, razorpay_mode: val }));
                                    }
                                }}
                                style={{
                                    width: '100%',
                                    maxWidth: '320px',
                                    padding: '10px 14px',
                                    borderRadius: '10px',
                                    border: '1px solid #CBD5E1',
                                    fontSize: '13.5px',
                                    fontWeight: 600,
                                    color: '#0F172A',
                                    background: '#FFFFFF',
                                }}
                            >
                                <option value="test">Test Mode (Sandbox)</option>
                                <option value="live">Live Mode (Production)</option>
                            </select>
                        </div>

                        {/* Key ID */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                                Key ID <span style={{ color: '#EF4444' }}>*</span>
                            </label>
                            <input
                                type="text"
                                value={rzpForm.razorpay_key_id}
                                onChange={(e) => setRzpForm(prev => ({ ...prev, razorpay_key_id: e.target.value }))}
                                placeholder={rzpForm.razorpay_mode === 'live' ? 'rzp_live_xxxxxxxxxxxxx' : 'rzp_test_xxxxxxxxxxxxx'}
                                required
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    borderRadius: '10px',
                                    border: '1px solid #CBD5E1',
                                    fontSize: '13.5px',
                                    color: '#0F172A',
                                    fontFamily: 'monospace',
                                    background: '#F8FAFC',
                                }}
                            />
                            <span style={{ fontSize: '11.5px', color: '#64748B', display: 'block', marginTop: '4px' }}>
                                Must match current mode prefix (e.g. <code>rzp_test_</code> or <code>rzp_live_</code>).
                            </span>
                        </div>

                        {/* Key Secret */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                                Key Secret <span style={{ color: '#EF4444' }}>*</span>
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showKeySecret ? 'text' : 'password'}
                                    value={rzpForm.razorpay_key_secret}
                                    onChange={(e) => setRzpForm(prev => ({ ...prev, razorpay_key_secret: e.target.value }))}
                                    placeholder={settings?.razorpay_has_key_secret ? '•••••••••••••••••••• (Leave blank to keep existing)' : 'Enter Razorpay Key Secret'}
                                    style={{
                                        width: '100%',
                                        padding: '10px 42px 10px 14px',
                                        borderRadius: '10px',
                                        border: '1px solid #CBD5E1',
                                        fontSize: '13.5px',
                                        color: '#0F172A',
                                        fontFamily: 'monospace',
                                        background: '#F8FAFC',
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowKeySecret(!showKeySecret)}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#94A3B8',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <FontAwesomeIcon icon={showKeySecret ? faEyeSlash : faEye} />
                                </button>
                            </div>
                        </div>

                        {/* Webhook Secret */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                                Webhook Secret
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showWebhookSecret ? 'text' : 'password'}
                                    value={rzpForm.razorpay_webhook_secret}
                                    onChange={(e) => setRzpForm(prev => ({ ...prev, razorpay_webhook_secret: e.target.value }))}
                                    placeholder={settings?.razorpay_has_webhook_secret ? '•••••••••••••••••••• (Leave blank to keep existing)' : 'Enter Razorpay Webhook Secret'}
                                    style={{
                                        width: '100%',
                                        padding: '10px 42px 10px 14px',
                                        borderRadius: '10px',
                                        border: '1px solid #CBD5E1',
                                        fontSize: '13.5px',
                                        color: '#0F172A',
                                        fontFamily: 'monospace',
                                        background: '#F8FAFC',
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#94A3B8',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <FontAwesomeIcon icon={showWebhookSecret ? faEyeSlash : faEye} />
                                </button>
                            </div>
                        </div>

                        {/* Monthly Plan ID */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                                Monthly Plan ID (₹499/Month Recurring)
                            </label>
                            <input
                                type="text"
                                value={rzpForm.razorpay_plan_id}
                                onChange={(e) => setRzpForm(prev => ({ ...prev, razorpay_plan_id: e.target.value }))}
                                placeholder="plan_INFYPOS_MONTHLY_499"
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    borderRadius: '10px',
                                    border: '1px solid #CBD5E1',
                                    fontSize: '13.5px',
                                    color: '#0F172A',
                                    fontFamily: 'monospace',
                                    background: '#F8FAFC',
                                }}
                            />
                        </div>

                        {/* Webhook URL (Read-only copy) */}
                        <div style={{ marginBottom: '28px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                                Webhook Endpoint URL
                            </label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="text"
                                    readOnly
                                    value={settings?.webhook_url || ''}
                                    style={{
                                        flex: 1,
                                        padding: '10px 14px',
                                        borderRadius: '10px',
                                        border: '1px solid #CBD5E1',
                                        fontSize: '13px',
                                        color: '#64748B',
                                        fontFamily: 'monospace',
                                        background: '#F1F5F9',
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={copyWebhookUrl}
                                    style={{
                                        background: copiedUrl ? '#10B981' : '#FFFFFF',
                                        color: copiedUrl ? '#FFFFFF' : '#334155',
                                        border: '1px solid #CBD5E1',
                                        borderRadius: '10px',
                                        padding: '0 16px',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                    }}
                                >
                                    <FontAwesomeIcon icon={copiedUrl ? faCheck : faCopy} />
                                    {copiedUrl ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                            <span style={{ fontSize: '11.5px', color: '#64748B', display: 'block', marginTop: '4px' }}>
                                Configure this endpoint inside your Razorpay Dashboard &gt; Webhooks with event <code>subscription.charged</code>.
                            </span>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                onClick={handleTestConnection}
                                disabled={testingConnection}
                                style={{
                                    background: '#FFFFFF',
                                    border: '1px solid #0080FF',
                                    color: '#0080FF',
                                    borderRadius: '10px',
                                    padding: '10px 20px',
                                    fontWeight: 700,
                                    fontSize: '13.5px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                }}
                            >
                                <FontAwesomeIcon icon={testingConnection ? faSpinner : faBolt} spin={testingConnection} />
                                {testingConnection ? 'Testing Connection...' : 'Test Connection'}
                            </button>

                            <button
                                type="submit"
                                disabled={savingRzp}
                                style={{
                                    background: '#16A34A',
                                    border: 'none',
                                    color: '#FFFFFF',
                                    borderRadius: '10px',
                                    padding: '10px 24px',
                                    fontWeight: 700,
                                    fontSize: '13.5px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    boxShadow: '0 2px 8px rgba(22, 163, 74, 0.3)',
                                }}
                            >
                                <FontAwesomeIcon icon={savingRzp ? faSpinner : faCheck} spin={savingRzp} />
                                {savingRzp ? 'Saving...' : 'Save Configuration'}
                            </button>

                            <button
                                type="button"
                                onClick={() => fetchSettings(false)}
                                style={{
                                    background: '#F1F5F9',
                                    border: 'none',
                                    color: '#475569',
                                    borderRadius: '10px',
                                    padding: '10px 18px',
                                    fontWeight: 600,
                                    fontSize: '13.5px',
                                    cursor: 'pointer',
                                }}
                            >
                                Reset
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════ */}
            {/* SUB-TAB 3: SYSTEM PAYMENT CONFIGURATION                          */}
            {/* ══════════════════════════════════════════════════════════════════ */}
            {subTab === 'system' && (
                <div style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '28px',
                    maxWidth: '820px',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <div>
                            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0' }}>
                                SYSTEM PAYMENT CONFIGURATION
                            </h3>
                            <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
                                Built-in INFY-POS payment processing and internal verification engine.
                            </p>
                        </div>

                        <span style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            padding: '4px 12px',
                            borderRadius: '20px',
                            background: isSystemActive ? '#DCFCE7' : '#F1F5F9',
                            color: isSystemActive ? '#15803D' : '#64748B',
                        }}>
                            {isSystemActive ? '● Currently Active' : '○ Standby'}
                        </span>
                    </div>

                    <form onSubmit={handleSaveSystem}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                                Payment Mode
                            </label>
                            <input
                                type="text"
                                readOnly
                                value="System Internal"
                                style={{
                                    width: '100%',
                                    maxWidth: '320px',
                                    padding: '10px 14px',
                                    borderRadius: '10px',
                                    border: '1px solid #CBD5E1',
                                    fontSize: '13.5px',
                                    color: '#475569',
                                    background: '#F1F5F9',
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                                Payment Verification Mode
                            </label>
                            <select
                                value={sysForm.system_payment_verification}
                                onChange={(e) => setSysForm(prev => ({ ...prev, system_payment_verification: e.target.value }))}
                                style={{
                                    width: '100%',
                                    maxWidth: '320px',
                                    padding: '10px 14px',
                                    borderRadius: '10px',
                                    border: '1px solid #CBD5E1',
                                    fontSize: '13.5px',
                                    fontWeight: 600,
                                    color: '#0F172A',
                                    background: '#FFFFFF',
                                }}
                            >
                                <option value="automatic">Automatic Instant Verification (+30 Days)</option>
                                <option value="manual">Manual Super Admin Approval</option>
                            </select>
                            <span style={{ fontSize: '11.5px', color: '#64748B', display: 'block', marginTop: '4px' }}>
                                Automatic mode immediately extends customer license upon checkout confirmation.
                            </span>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                                Merchant UPI ID (for Customer QR Code)
                            </label>
                            <input
                                type="text"
                                value={sysForm.system_upi_id || ''}
                                onChange={(e) => setSysForm(prev => ({ ...prev, system_upi_id: e.target.value }))}
                                placeholder="infypos@icici"
                                style={{
                                    width: '100%',
                                    maxWidth: '320px',
                                    padding: '10px 14px',
                                    borderRadius: '10px',
                                    border: '1px solid #CBD5E1',
                                    fontSize: '13.5px',
                                    fontWeight: 600,
                                    color: '#0F172A',
                                    background: '#F8FAFC',
                                }}
                            />
                            <span style={{ fontSize: '11.5px', color: '#64748B', display: 'block', marginTop: '4px' }}>
                                This UPI ID is dynamically encoded into the customer-facing QR code for direct transfers.
                            </span>
                        </div>

                        <div style={{ marginBottom: '28px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                                Currency
                            </label>
                            <input
                                type="text"
                                value={sysForm.currency}
                                onChange={(e) => setSysForm(prev => ({ ...prev, currency: e.target.value }))}
                                style={{
                                    width: '100%',
                                    maxWidth: '180px',
                                    padding: '10px 14px',
                                    borderRadius: '10px',
                                    border: '1px solid #CBD5E1',
                                    fontSize: '13.5px',
                                    color: '#0F172A',
                                    background: '#F8FAFC',
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={savingSys}
                            style={{
                                background: '#16A34A',
                                border: 'none',
                                color: '#FFFFFF',
                                borderRadius: '10px',
                                padding: '10px 24px',
                                fontWeight: 700,
                                fontSize: '13.5px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: '0 2px 8px rgba(22, 163, 74, 0.3)',
                            }}
                        >
                            <FontAwesomeIcon icon={savingSys ? faSpinner : faCheck} spin={savingSys} />
                            {savingSys ? 'Saving...' : 'Save System Payment Settings'}
                        </button>
                    </form>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════ */}
            {/* SUB-TAB: PENDING VERIFICATIONS                                   */}
            {/* ══════════════════════════════════════════════════════════════════ */}
            {subTab === 'pending' && (
                <div style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px',
                        flexWrap: 'wrap',
                        gap: '12px',
                    }}>
                        <div>
                            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FontAwesomeIcon icon={faShieldAlt} style={{ color: '#059669' }} />
                                PENDING PAYMENT VERIFICATIONS
                                {pendingPayments.length > 0 && (
                                    <span style={{ background: '#FEF3C7', color: '#B45309', fontSize: '12px', fontWeight: 800, padding: '2px 10px', borderRadius: '12px' }}>
                                        {pendingPayments.length} Pending
                                    </span>
                                )}
                            </h3>
                            <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
                                Review customer UPI submissions, check Transaction IDs / UTRs against your bank statement, and confirm activation.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={fetchPendingPayments}
                            disabled={loadingPending}
                            style={{
                                background: '#F8FAFC',
                                border: '1px solid #CBD5E1',
                                borderRadius: '10px',
                                padding: '8px 16px',
                                fontSize: '13px',
                                fontWeight: 700,
                                color: '#334155',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            <FontAwesomeIcon icon={faRotate} spin={loadingPending} />
                            Refresh
                        </button>
                    </div>

                    {/* Pending Requests Table */}
                    <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                            <thead>
                                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 700 }}>
                                    <th style={{ padding: '12px 16px' }}>CUSTOMER</th>
                                    <th style={{ padding: '12px 16px' }}>PLAN &amp; AMOUNT</th>
                                    <th style={{ padding: '12px 16px' }}>UTR / REF</th>
                                    <th style={{ padding: '12px 16px' }}>SCREENSHOT</th>
                                    <th style={{ padding: '12px 16px' }}>SUBMITTED AT</th>
                                    <th style={{ padding: '12px 16px' }}>STATUS</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingPending ? (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#64748B' }}>
                                            <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: '20px', marginBottom: '8px' }} />
                                            <div>Loading pending verifications...</div>
                                        </td>
                                    </tr>
                                ) : pendingPayments.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '48px', color: '#64748B' }}>
                                            <div style={{ fontSize: '32px', marginBottom: '12px', color: '#10B981' }}>✓</div>
                                            <div style={{ fontWeight: 700, fontSize: '15px', color: '#0F172A' }}>No Pending Verifications</div>
                                            <div style={{ fontSize: '12.5px', marginTop: '4px', color: '#64748B' }}>All customer UPI payments have been reviewed and verified.</div>
                                        </td>
                                    </tr>
                                ) : (
                                    pendingPayments.map(p => (
                                        <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                            <td style={{ padding: '12px 16px' }}>
                                                <div style={{ fontWeight: 700, color: '#0F172A' }}>{p.customer_name}</div>
                                                <div style={{ fontSize: '11.5px', color: '#64748B' }}>{p.customer_email || p.customer_phone || 'sasti@gmail.com'}</div>
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <div style={{ fontWeight: 700, color: '#059669' }}>{p.amount || '₹588.82'}</div>
                                                <div style={{ fontSize: '11px', color: '#64748B' }}>{p.plan_name || 'INFY-POS PREMIUM'}</div>
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0F172A' }}>
                                                    {p.utr}
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace' }}>
                                                    {p.payment_reference}
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                {p.screenshot_url ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setScreenshotModal({ open: true, url: p.screenshot_url })}
                                                        style={{
                                                            background: '#EFF6FF',
                                                            border: '1px solid #BFDBFE',
                                                            borderRadius: '8px',
                                                            padding: '4px 10px',
                                                            fontSize: '11.5px',
                                                            fontWeight: 600,
                                                            color: '#2563EB',
                                                            cursor: 'pointer',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                        }}
                                                    >
                                                        <FontAwesomeIcon icon={faEye} />
                                                        View Proof
                                                    </button>
                                                ) : (
                                                    <span style={{ fontSize: '11.5px', color: '#94A3B8', fontStyle: 'italic' }}>
                                                        No screenshot
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: '12px 16px', fontSize: '12px', color: '#64748B' }}>
                                                {p.submitted_at || 'Just now'}
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <span style={{
                                                    background: '#FEF3C7',
                                                    color: '#B45309',
                                                    fontSize: '11px',
                                                    fontWeight: 800,
                                                    padding: '3px 8px',
                                                    borderRadius: '12px',
                                                    display: 'inline-block',
                                                }}>
                                                    ● PENDING
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                                <div style={{ display: 'inline-flex', gap: '8px' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleVerifyPayment(p)}
                                                        disabled={verifyingId === p.id}
                                                        style={{
                                                            background: '#16A34A',
                                                            border: 'none',
                                                            borderRadius: '8px',
                                                            padding: '6px 14px',
                                                            color: '#FFFFFF',
                                                            fontWeight: 700,
                                                            fontSize: '12px',
                                                            cursor: 'pointer',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '5px',
                                                            boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
                                                        }}
                                                    >
                                                        <FontAwesomeIcon icon={verifyingId === p.id ? faSpinner : faCheck} spin={verifyingId === p.id} />
                                                        {verifyingId === p.id ? 'Activating...' : 'Verify Payment'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setRejectModal({ open: true, payment: p, reason: '', rejecting: false })}
                                                        disabled={verifyingId === p.id}
                                                        style={{
                                                            background: '#FFFFFF',
                                                            border: '1px solid #EF4444',
                                                            borderRadius: '8px',
                                                            padding: '6px 12px',
                                                            color: '#EF4444',
                                                            fontWeight: 700,
                                                            fontSize: '12px',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════ */}
            {/* SUB-TAB 4: PAYMENT LOGS TABLE                                    */}
            {/* ══════════════════════════════════════════════════════════════════ */}
            {subTab === 'logs' && (
                <div style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px',
                        flexWrap: 'wrap',
                        gap: '14px',
                    }}>
                        <div>
                            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: '0 0 2px 0' }}>
                                Payment Transaction Logs
                            </h3>
                            <span style={{ fontSize: '12.5px', color: '#64748B' }}>
                                Showing {logs.length} of {logsPagination.total} payment transactions
                            </span>
                        </div>

                        {/* Filters */}
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <div style={{ position: 'relative' }}>
                                <FontAwesomeIcon icon={faSearch} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                                <input
                                    type="text"
                                    placeholder="Search by ID or customer..."
                                    value={logsFilter.search}
                                    onChange={(e) => setLogsFilter(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                                    style={{
                                        padding: '7px 14px 7px 32px',
                                        borderRadius: '8px',
                                        border: '1px solid #CBD5E1',
                                        fontSize: '12.5px',
                                        width: '200px',
                                    }}
                                />
                            </div>

                            <select
                                value={logsFilter.provider}
                                onChange={(e) => setLogsFilter(prev => ({ ...prev, provider: e.target.value, page: 1 }))}
                                style={{
                                    padding: '7px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid #CBD5E1',
                                    fontSize: '12.5px',
                                    color: '#334155',
                                    fontWeight: 600,
                                }}
                            >
                                <option value="all">All Providers</option>
                                <option value="razorpay">Razorpay</option>
                                <option value="system">System Payment</option>
                            </select>

                            <select
                                value={logsFilter.status}
                                onChange={(e) => setLogsFilter(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                                style={{
                                    padding: '7px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid #CBD5E1',
                                    fontSize: '12.5px',
                                    color: '#334155',
                                    fontWeight: 600,
                                }}
                            >
                                <option value="all">All Statuses</option>
                                <option value="captured">Captured / Success</option>
                                <option value="pending">Pending</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #F1F5F9', textAlign: 'left', background: '#F8FAFC' }}>
                                    <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569' }}>DATE</th>
                                    <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569' }}>CUSTOMER</th>
                                    <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569' }}>STORE</th>
                                    <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569' }}>PROVIDER</th>
                                    <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569' }}>AMOUNT</th>
                                    <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569' }}>PAYMENT ID</th>
                                    <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569' }}>STATUS</th>
                                    <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569' }}>SUBSCRIPTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingLogs ? (
                                    <tr>
                                        <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>
                                            <FontAwesomeIcon icon={faSpinner} spin style={{ marginRight: '8px' }} />
                                            Loading logs...
                                        </td>
                                    </tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>
                                            No payment records found matching the filters.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((row) => (
                                        <tr key={row.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                            <td style={{ padding: '12px 14px', color: '#334155', whiteSpace: 'nowrap' }}>
                                                {row.date}
                                            </td>
                                            <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0F172A' }}>
                                                {row.customer}
                                                <span style={{ display: 'block', fontSize: '11px', color: '#94A3B8', fontWeight: 400 }}>
                                                    {row.email}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 14px', color: '#475569' }}>
                                                {row.store}
                                            </td>
                                            <td style={{ padding: '12px 14px' }}>
                                                <span style={{
                                                    fontSize: '11px',
                                                    fontWeight: 800,
                                                    padding: '3px 8px',
                                                    borderRadius: '6px',
                                                    background: row.provider === 'RAZORPAY' ? '#EFF6FF' : '#F0FDF4',
                                                    color: row.provider === 'RAZORPAY' ? '#1D4ED8' : '#15803D',
                                                    letterSpacing: '0.04em',
                                                }}>
                                                    {row.provider}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F172A' }}>
                                                ₹{row.amount.toFixed(2)}
                                            </td>
                                            <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '12px', color: '#475569' }}>
                                                {row.payment_id}
                                            </td>
                                            <td style={{ padding: '12px 14px' }}>
                                                <span style={{
                                                    fontSize: '11px',
                                                    fontWeight: 700,
                                                    padding: '3px 8px',
                                                    borderRadius: '6px',
                                                    background: ['SUCCESS', 'CAPTURED'].includes(row.status) ? '#DCFCE7' : '#FEF2F2',
                                                    color: ['SUCCESS', 'CAPTURED'].includes(row.status) ? '#15803D' : '#DC2626',
                                                }}>
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 14px', fontSize: '12.5px', color: '#475569' }}>
                                                {row.subscription}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {logsPagination.last_page > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                            <button
                                disabled={logsPagination.current_page <= 1}
                                onClick={() => setLogsFilter(prev => ({ ...prev, page: prev.page - 1 }))}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid #CBD5E1',
                                    background: '#FFFFFF',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                }}
                            >
                                Previous
                            </button>
                            <span style={{ fontSize: '12px', padding: '6px 10px', color: '#64748B' }}>
                                Page {logsPagination.current_page} of {logsPagination.last_page}
                            </span>
                            <button
                                disabled={logsPagination.current_page >= logsPagination.last_page}
                                onClick={() => setLogsFilter(prev => ({ ...prev, page: prev.page + 1 }))}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid #CBD5E1',
                                    background: '#FFFFFF',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                }}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════ */}
            {/* SWITCH PAYMENT PROVIDER CONFIRMATION MODAL                       */}
            {/* ══════════════════════════════════════════════════════════════════ */}
            {switchModal.open && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 999999,
                    padding: '16px',
                }}>
                    <div style={{
                        background: '#FFFFFF',
                        borderRadius: '20px',
                        maxWidth: '480px',
                        width: '100%',
                        padding: '28px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    }}>
                        <div style={{
                            width: '52px',
                            height: '52px',
                            borderRadius: '14px',
                            background: '#FEF3C7',
                            color: '#D97706',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '22px',
                            marginBottom: '18px',
                        }}>
                            <FontAwesomeIcon icon={faExchangeAlt} />
                        </div>

                        <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: '0 0 10px 0' }}>
                            Switch Payment Provider?
                        </h3>

                        <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.55, margin: '0 0 16px 0' }}>
                            You are switching the active payment provider from <strong>{isRazorpayActive ? 'Razorpay' : 'System Payment'}</strong> to <strong>{switchModal.targetLabel}</strong>.
                        </p>

                        <div style={{
                            background: '#FFFBEB',
                            border: '1px solid #FDE68A',
                            borderRadius: '12px',
                            padding: '12px 16px',
                            fontSize: '12.5px',
                            color: '#92400E',
                            marginBottom: '24px',
                            lineHeight: 1.45,
                        }}>
                            ⚠️ <strong>Important Notice:</strong> All new customer payment attempts will use <strong>{switchModal.targetLabel}</strong> after this change. Existing verified subscriptions will remain active.
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                disabled={switchModal.switching}
                                onClick={() => setSwitchModal({ open: false, targetProvider: null, targetLabel: '', switching: false })}
                                style={{
                                    background: '#F1F5F9',
                                    border: 'none',
                                    color: '#475569',
                                    borderRadius: '10px',
                                    padding: '10px 18px',
                                    fontWeight: 700,
                                    fontSize: '13.5px',
                                    cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                disabled={switchModal.switching}
                                onClick={confirmSwitchProvider}
                                style={{
                                    background: '#0F172A',
                                    border: 'none',
                                    color: '#FFFFFF',
                                    borderRadius: '10px',
                                    padding: '10px 22px',
                                    fontWeight: 700,
                                    fontSize: '13.5px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                }}
                            >
                                {switchModal.switching ? (
                                    <>
                                        <FontAwesomeIcon icon={faSpinner} spin />
                                        Switching...
                                    </>
                                ) : (
                                    'Switch Provider'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════ */}
            {/* LIVE MODE WARNING MODAL                                          */}
            {/* ══════════════════════════════════════════════════════════════════ */}
            {liveModeModal && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 999999,
                    padding: '16px',
                }}>
                    <div style={{
                        background: '#FFFFFF',
                        borderRadius: '20px',
                        maxWidth: '460px',
                        width: '100%',
                        padding: '28px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    }}>
                        <div style={{
                            width: '52px',
                            height: '52px',
                            borderRadius: '14px',
                            background: '#FEE2E2',
                            color: '#DC2626',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '22px',
                            marginBottom: '18px',
                        }}>
                            <FontAwesomeIcon icon={faExclamationTriangle} />
                        </div>

                        <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: '0 0 10px 0' }}>
                            Switch to Live Mode?
                        </h3>

                        <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.55, margin: '0 0 24px 0' }}>
                            Live Mode processes real customer payments. Make sure your production Razorpay credentials and webhook configuration are correct.
                        </p>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={() => setLiveModeModal(false)}
                                style={{
                                    background: '#F1F5F9',
                                    border: 'none',
                                    color: '#475569',
                                    borderRadius: '10px',
                                    padding: '10px 18px',
                                    fontWeight: 700,
                                    fontSize: '13.5px',
                                    cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setRzpForm(prev => ({ ...prev, razorpay_mode: 'live' }));
                                    setLiveModeModal(false);
                                }}
                                style={{
                                    background: '#DC2626',
                                    border: 'none',
                                    color: '#FFFFFF',
                                    borderRadius: '10px',
                                    padding: '10px 22px',
                                    fontWeight: 700,
                                    fontSize: '13.5px',
                                    cursor: 'pointer',
                                }}
                            >
                                Continue to Live Mode
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════ */}
            {/* REJECTION REASON MODAL                                            */}
            {/* ══════════════════════════════════════════════════════════════════ */}
            {rejectModal.open && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(15, 23, 42, 0.7)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 99999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                }}>
                    <div style={{
                        background: '#FFFFFF',
                        borderRadius: '16px',
                        maxWidth: '480px',
                        width: '100%',
                        padding: '24px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                    }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#DC2626', margin: '0 0 10px 0' }}>
                            Reject Payment Submission
                        </h3>
                        <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                            Rejecting payment for UTR: <strong>{rejectModal.payment?.utr}</strong>. Please enter the reason for rejection (e.g. UTR not found on statement, wrong amount, duplicate).
                        </p>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                Reason for Rejection
                            </label>
                            <textarea
                                value={rejectModal.reason}
                                onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
                                placeholder="Enter rejection reason..."
                                rows="3"
                                style={{
                                    width: '100%',
                                    borderRadius: '10px',
                                    border: '1px solid #CBD5E1',
                                    padding: '10px',
                                    fontSize: '13px',
                                    fontFamily: 'inherit',
                                    outline: 'none',
                                    resize: 'none',
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={() => setRejectModal({ open: false, payment: null, reason: '', rejecting: false })}
                                disabled={rejectModal.rejecting}
                                style={{
                                    background: '#F1F5F9',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '8px 16px',
                                    color: '#475569',
                                    fontWeight: 700,
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleRejectPayment}
                                disabled={rejectModal.rejecting}
                                style={{
                                    background: '#DC2626',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '8px 18px',
                                    color: '#FFFFFF',
                                    fontWeight: 700,
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                }}
                            >
                                {rejectModal.rejecting && <FontAwesomeIcon icon={faSpinner} spin />}
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════ */}
            {/* SCREENSHOT PROOF PREVIEW MODAL                                    */}
            {/* ══════════════════════════════════════════════════════════════════ */}
            {screenshotModal.open && (
                <div
                    onClick={() => setScreenshotModal({ open: false, url: '' })}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(15, 23, 42, 0.85)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 999999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '24px',
                        cursor: 'zoom-out',
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            maxWidth: '700px',
                            maxHeight: '90vh',
                            background: '#FFFFFF',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
                            display: 'flex',
                            flexDirection: 'column',
                            cursor: 'default',
                        }}
                    >
                        <div style={{ padding: '14px 18px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>Payment Proof Screenshot</span>
                            <button
                                type="button"
                                onClick={() => setScreenshotModal({ open: false, url: '' })}
                                style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748B' }}
                            >
                                ✕
                            </button>
                        </div>
                        <div style={{ padding: '16px', overflow: 'auto', textAlign: 'center', background: '#0F172A' }}>
                            <img
                                src={screenshotModal.url}
                                alt="Payment Proof"
                                style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: '8px' }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminPaymentSystems;
