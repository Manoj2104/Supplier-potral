import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import moment from 'moment';
import MasterLayout from '../MasterLayout';
import TopProgressBar from '../../shared/components/loaders/TopProgressBar';
import TabTitle from '../../shared/tab-title/TabTitle';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronRight, faArrowLeft, faCheckCircle,
    faWarning, faLock, faClock, faShoppingCart,
    faPauseCircle, faMoneyBillWave, faUser, faBuilding,
    faClipboardList, faShieldAlt, faRefresh
} from '@fortawesome/free-solid-svg-icons';
import './RegisterManagement.css';

const SuspendRegisterPage = () => {
    const navigate = useNavigate();
    const { frontSetting } = useSelector(state => state);
    const currencySymbol = frontSetting?.value?.currency_symbol || '₹';

    const [suspendReason, setSuspendReason] = useState('');
    const [resumeTime, setResumeTime] = useState('');
    const [notes, setNotes] = useState('');
    const [pin, setPin] = useState('');
    const [supervisor, setSupervisor] = useState('');
    const [sessionSeconds, setSessionSeconds] = useState(0);
    const [confirmed, setConfirmed] = useState(false);

    const sessionStart = moment().subtract(sessionSeconds, 'seconds');

    // Session duration timer
    useEffect(() => {
        const timer = setInterval(() => setSessionSeconds(s => s + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatDuration = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
    };

    const kpis = [
        { label: 'Current Session', value: formatDuration(sessionSeconds), color: '#D97706', bg: '#FEF3C7', icon: faClock },
        { label: 'Open Cart Items', value: '0', color: '#2563EB', bg: '#EFF6FF', icon: faShoppingCart },
        { label: 'Hold Bills', value: '0', color: '#7C3AED', bg: '#F3E8FF', icon: faPauseCircle },
        { label: 'Cash in Drawer', value: `${currencySymbol} 0.00`, color: '#16A34A', bg: '#DCFCE7', icon: faMoneyBillWave },
    ];

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title="Suspend Register" />
            <div className="reg-mgmt-container">
                {/* Breadcrumb */}
                <div style={{ fontSize: 12, color: '#64748B', marginBottom: 8, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Link to="/app/dashboard" style={{ color: '#64748B', textDecoration: 'none' }}>Dashboard</Link>
                    <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 9 }} />
                    <Link to="/app/pos" style={{ color: '#64748B', textDecoration: 'none' }}>POS</Link>
                    <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 9 }} />
                    <span style={{ color: '#0F172A', fontWeight: 700 }}>Suspend Register</span>
                </div>

                {/* Header */}
                <div className="reg-mgmt-header">
                    <div>
                        <h1 className="reg-mgmt-title">
                            <FontAwesomeIcon icon={faPauseCircle} className="text-warning" />
                            Suspend Register
                            <span className="reg-badge-warning">
                                <FontAwesomeIcon icon={faWarning} /> Action Required
                            </span>
                        </h1>
                        <p className="reg-mgmt-sub">Temporarily suspend the POS register during a break, shift change, or maintenance. All open items will be preserved.</p>
                    </div>
                    <button type="button" className="reg-btn reg-btn-outline" onClick={() => navigate(-1)}>
                        <FontAwesomeIcon icon={faArrowLeft} /> Back
                    </button>
                </div>

                {/* Warning Banner */}
                <div style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 14, padding: '12px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <FontAwesomeIcon icon={faWarning} style={{ color: '#D97706', fontSize: 20 }} />
                    <div>
                        <div style={{ fontWeight: 700, color: '#92400E', fontSize: 13 }}>Suspend will lock the register immediately</div>
                        <div style={{ fontSize: 12, color: '#B45309', marginTop: 2 }}>Ensure all current bills are saved or on hold before proceeding. Cash drawer will be locked.</div>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="reg-kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    {kpis.map((k, i) => (
                        <div key={i} className="reg-kpi-card">
                            <div className="d-flex align-items-center justify-content-between mb-2">
                                <span className="reg-kpi-lbl">{k.label}</span>
                                <div style={{ width: 30, height: 30, borderRadius: 8, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: k.color }}>
                                    <FontAwesomeIcon icon={k.icon} style={{ fontSize: 13 }} />
                                </div>
                            </div>
                            <div className="reg-kpi-val" style={{ color: k.color }}>{k.value}</div>
                        </div>
                    ))}
                </div>

                {/* 60/40 Layout */}
                <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: 20 }}>
                    {/* LEFT */}
                    <div>
                        {/* Register Status */}
                        <div className="reg-card">
                            <div className="reg-card-title">
                                <FontAwesomeIcon icon={faBuilding} className="text-primary" /> Register Status
                            </div>
                            <div className="row g-3">
                                {[
                                    { lbl: 'Register No.', val: 'REG-001' },
                                    { lbl: 'Cashier', val: 'Manoj S (Administrator)' },
                                    { lbl: 'Shift Type', val: 'Morning Shift' },
                                    { lbl: 'Shift Started', val: sessionStart.format('hh:mm A') },
                                    { lbl: 'Current Time', val: moment().format('hh:mm A') },
                                    { lbl: 'Session Duration', val: formatDuration(sessionSeconds) },
                                ].map((item, i) => (
                                    <div key={i} className="col-md-4">
                                        <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '10px 14px', border: '1px solid #E2E8F0' }}>
                                            <div style={{ fontSize: 10.5, color: '#64748B', fontWeight: 600, marginBottom: 3 }}>{item.lbl}</div>
                                            <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13 }}>{item.val}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Suspend Configuration */}
                        <div className="reg-card">
                            <div className="reg-card-title">
                                <FontAwesomeIcon icon={faClipboardList} className="text-warning" /> Suspend Configuration
                            </div>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label fw-bold" style={{ fontSize: 12 }}>Suspend Reason <span className="text-danger">*</span></label>
                                    <select className="form-select" style={{ borderRadius: 10, fontSize: 13 }} value={suspendReason} onChange={e => setSuspendReason(e.target.value)}>
                                        <option value="">Select Reason</option>
                                        <option>Break / Lunch</option>
                                        <option>Shift Change</option>
                                        <option>Emergency</option>
                                        <option>Maintenance</option>
                                        <option>Technical Issue</option>
                                        <option>Manager Request</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-bold" style={{ fontSize: 12 }}>Expected Resume Time</label>
                                    <input
                                        type="datetime-local"
                                        className="form-control"
                                        style={{ borderRadius: 10, fontSize: 13 }}
                                        value={resumeTime}
                                        onChange={e => setResumeTime(e.target.value)}
                                    />
                                </div>
                                <div className="col-12">
                                    <label className="form-label fw-bold" style={{ fontSize: 12 }}>Additional Notes</label>
                                    <textarea className="form-control" rows={3} placeholder="Reason details or handover instructions..." style={{ borderRadius: 10, fontSize: 13 }} value={notes} onChange={e => setNotes(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {/* Current Session Summary */}
                        <div className="reg-card">
                            <div className="reg-card-title">
                                <FontAwesomeIcon icon={faRefresh} className="text-info" /> Current Session Summary
                            </div>
                            <div className="row g-2">
                                {[
                                    { label: 'Cart Items', value: '0', color: '#2563EB' },
                                    { label: 'Hold Bills', value: '0', color: '#7C3AED' },
                                    { label: 'Cash Balance', value: `${currencySymbol} 0.00`, color: '#16A34A' },
                                    { label: 'Last Transaction', value: 'None', color: '#64748B' },
                                ].map((item, i) => (
                                    <div key={i} className="col-md-6">
                                        <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '12px 16px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: 12.5, color: '#475569', fontWeight: 600 }}>{item.label}</span>
                                            <span style={{ fontSize: 14, fontWeight: 800, color: item.color }}>{item.value}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Manager Verification */}
                        <div className="reg-card" style={{ border: '1.5px solid #FDE68A', background: '#FFFBEB' }}>
                            <div className="reg-card-title" style={{ color: '#B45309' }}>
                                <FontAwesomeIcon icon={faShieldAlt} /> Manager Verification Required
                            </div>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label fw-bold" style={{ fontSize: 12 }}>Supervisor</label>
                                    <select className="form-select" style={{ borderRadius: 10, fontSize: 13 }} value={supervisor} onChange={e => setSupervisor(e.target.value)}>
                                        <option value="">Select Supervisor</option>
                                        <option>Store Manager</option>
                                        <option>Floor Supervisor</option>
                                        <option>Shift Lead</option>
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-bold" style={{ fontSize: 12 }}>Manager PIN <span className="text-danger">*</span></label>
                                    <input
                                        type="password"
                                        maxLength={6}
                                        className="form-control"
                                        placeholder="••••••"
                                        style={{ borderRadius: 10, fontSize: 18, letterSpacing: 8, textAlign: 'center', fontWeight: 800 }}
                                        value={pin}
                                        onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT */}
                    <div>
                        {/* Lock Screen Preview */}
                        <div className="reg-card" style={{ background: '#0F172A', border: '1px solid #1E293B', textAlign: 'center', padding: 32 }}>
                            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, marginBottom: 20, textTransform: 'uppercase', letterSpacing: 2 }}>Lock Screen Preview</div>
                            <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#F1F5F9', marginBottom: 8 }}>REGISTER SUSPENDED</div>
                            <div style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>REG-001 · Manoj S</div>
                            <div style={{ fontSize: 28, fontWeight: 900, color: '#16A34A', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8 }}>
                                {moment().format('hh:mm A')}
                            </div>
                            <div style={{ fontSize: 12, color: '#475569' }}>{moment().format('dddd, DD MMM YYYY')}</div>
                            {suspendReason && (
                                <div style={{ marginTop: 20, background: '#1E293B', borderRadius: 10, padding: '10px 16px', fontSize: 12, color: '#94A3B8' }}>
                                    Reason: {suspendReason}
                                </div>
                            )}
                            <div style={{ marginTop: 20, width: '100%', height: 2, background: 'linear-gradient(90deg, transparent, #16A34A, transparent)' }} />
                            <div style={{ marginTop: 16, fontSize: 11, color: '#475569' }}>Contact manager to resume</div>
                        </div>

                        {/* Bills Alert */}
                        <div className="reg-card" style={{ border: '1px solid #E2E8F0' }}>
                            <div className="reg-card-title">
                                <FontAwesomeIcon icon={faWarning} className="text-warning" /> Open Bills Status
                            </div>
                            {[
                                { label: 'Open Cart Bills', value: '0', status: 'ok' },
                                { label: 'Hold Bills', value: '0', status: 'ok' },
                                { label: 'Pending Payments', value: '0', status: 'ok' },
                            ].map((item, i) => (
                                <div key={i} className="d-flex align-items-center justify-content-between py-2 border-bottom">
                                    <span style={{ fontSize: 13, color: '#475569' }}>{item.label}</span>
                                    <div className="d-flex align-items-center gap-2">
                                        <span style={{ fontWeight: 800, fontSize: 14 }}>{item.value}</span>
                                        <FontAwesomeIcon icon={faCheckCircle} className="text-success" style={{ fontSize: 14 }} />
                                    </div>
                                </div>
                            ))}
                            <div className="mt-3 p-2 rounded-3 text-center" style={{ background: '#F0FDF4', fontSize: 12, color: '#15803D', fontWeight: 700 }}>
                                ✅ All clear — Safe to suspend
                            </div>
                        </div>

                        {/* Tips */}
                        <div className="reg-card" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                            <div className="reg-card-title" style={{ color: '#B45309' }}>⚠️ Before Suspending</div>
                            <ul style={{ fontSize: 11.5, color: '#92400E', paddingLeft: 16, margin: 0, lineHeight: 1.9 }}>
                                <li>Save or hold all open bills</li>
                                <li>Close cash drawer completely</li>
                                <li>Notify supervisor on duty</li>
                                <li>Set expected return time</li>
                                <li>Do not leave terminal unattended</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Sticky Footer */}
                <div style={{ position: 'sticky', bottom: 0, background: '#FFFFFF', borderTop: '1px solid #E2E8F0', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 -4px 16px rgba(0,0,0,0.06)', borderRadius: '16px 16px 0 0', zIndex: 100 }}>
                    <button type="button" className="reg-btn reg-btn-outline" onClick={() => navigate(-1)}>
                        <FontAwesomeIcon icon={faArrowLeft} /> Cancel
                    </button>
                    <button
                        type="button"
                        className="reg-btn"
                        style={{ background: '#D97706', borderColor: '#D97706', color: '#FFFFFF', height: 44, fontSize: 14, fontWeight: 800, padding: '0 32px', borderRadius: 10 }}
                        disabled={!suspendReason || pin.length < 6}
                        onClick={() => setConfirmed(true)}
                    >
                        <FontAwesomeIcon icon={faLock} className="me-2" /> Confirm Suspend Register
                    </button>
                </div>
            </div>
        </MasterLayout>
    );
};

export default SuspendRegisterPage;
