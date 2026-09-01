import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import moment from 'moment';
import MasterLayout from '../MasterLayout';
import TopProgressBar from '../../shared/components/loaders/TopProgressBar';
import TabTitle from '../../shared/tab-title/TabTitle';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronRight, faArrowLeft, faCheckCircle,
    faPlayCircle, faClock, faMoneyBillWave, faBuilding,
    faShieldAlt, faPrint, faStore, faBullseye,
    faWifi, faPlugCircleCheck, faServer, faBarcode
} from '@fortawesome/free-solid-svg-icons';
import './RegisterManagement.css';

const SystemCheckRow = ({ label, status, icon, color }) => (
    <div className="d-flex align-items-center justify-content-between py-2 border-bottom" style={{ fontSize: 13 }}>
        <div className="d-flex align-items-center gap-2">
            <FontAwesomeIcon icon={icon} style={{ color, width: 16 }} />
            <span style={{ color: '#475569' }}>{label}</span>
        </div>
        <span style={{ fontWeight: 700, color, fontSize: 12, background: color + '15', padding: '2px 10px', borderRadius: 20 }}>
            {status}
        </span>
    </div>
);

const ReopenRegisterPage = () => {
    const navigate = useNavigate();
    const { frontSetting } = useSelector(state => state);
    const currencySymbol = frontSetting?.value?.currency_symbol || '₹';

    const [openingCash, setOpeningCash] = useState('');
    const [currentCash, setCurrentCash] = useState('');
    const [pin, setPin] = useState('');
    const [notes, setNotes] = useState('');
    const [supervisor, setSupervisor] = useState('');
    const [resumed, setResumed] = useState(false);

    const opening = parseFloat(openingCash || 0);
    const current = parseFloat(currentCash || 0);
    const difference = current - opening;

    const systemChecks = [
        { label: 'Printer', status: '✔ Online', icon: faPrint, color: '#16A34A' },
        { label: 'Barcode Scanner', status: '✔ Ready', icon: faBarcode, color: '#16A34A' },
        { label: 'Internet', status: '✔ Connected', icon: faWifi, color: '#16A34A' },
        { label: 'Cash Drawer', status: '✔ Closed', icon: faPlugCircleCheck, color: '#16A34A' },
        { label: 'POS Server', status: '✔ Running', icon: faServer, color: '#16A34A' },
    ];

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title="Resume Register" />
            <div className="reg-mgmt-container">
                {/* Breadcrumb */}
                <div style={{ fontSize: 12, color: '#64748B', marginBottom: 8, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Link to="/app/dashboard" style={{ color: '#64748B', textDecoration: 'none' }}>Dashboard</Link>
                    <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 9 }} />
                    <Link to="/app/pos" style={{ color: '#64748B', textDecoration: 'none' }}>POS</Link>
                    <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 9 }} />
                    <span style={{ color: '#0F172A', fontWeight: 700 }}>Resume Register</span>
                </div>

                {/* Header */}
                <div className="reg-mgmt-header">
                    <div>
                        <h1 className="reg-mgmt-title">
                            <FontAwesomeIcon icon={faPlayCircle} className="text-success" />
                            Resume Register
                            <span className="reg-badge-success">
                                <FontAwesomeIcon icon={faCheckCircle} /> System Ready
                            </span>
                        </h1>
                        <p className="reg-mgmt-sub">Reopen the suspended POS register. Complete cash verification and manager approval to resume billing.</p>
                    </div>
                    <button type="button" className="reg-btn reg-btn-outline" onClick={() => navigate(-1)}>
                        <FontAwesomeIcon icon={faArrowLeft} /> Back
                    </button>
                </div>

                {/* Success Banner */}
                <div style={{ background: '#F0FDF4', border: '1.5px solid #DCFCE7', borderRadius: 14, padding: '12px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <FontAwesomeIcon icon={faCheckCircle} style={{ color: '#16A34A', fontSize: 20 }} />
                    <div>
                        <div style={{ fontWeight: 700, color: '#166534', fontSize: 13 }}>System is Ready to Resume</div>
                        <div style={{ fontSize: 12, color: '#15803D', marginTop: 2 }}>All systems operational. Complete verification below to resume POS billing.</div>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="reg-kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    {[
                        { label: 'Suspended Duration', value: '0m 0s', color: '#D97706', bg: '#FEF3C7', icon: faClock },
                        { label: 'Cash in Drawer', value: `${currencySymbol} 0.00`, color: '#16A34A', bg: '#DCFCE7', icon: faMoneyBillWave },
                        { label: 'Pending Bills', value: '0', color: '#2563EB', bg: '#EFF6FF', icon: faBullseye },
                        { label: 'System Status', value: 'All OK ✅', color: '#16A34A', bg: '#F0FDF4', icon: faCheckCircle },
                    ].map((k, i) => (
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
                        {/* Previous Session Details */}
                        <div className="reg-card">
                            <div className="reg-card-title">
                                <FontAwesomeIcon icon={faBuilding} className="text-primary" /> Previous Session Details
                            </div>
                            <div className="row g-3">
                                {[
                                    { lbl: 'Register No.', val: 'REG-001' },
                                    { lbl: 'Cashier', val: 'Manoj S' },
                                    { lbl: 'Suspend Time', val: '—' },
                                    { lbl: 'Suspended By', val: 'Manoj S' },
                                    { lbl: 'Suspend Reason', val: 'Not recorded' },
                                    { lbl: 'Shift', val: 'Morning Shift' },
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

                        {/* System Health Check */}
                        <div className="reg-card">
                            <div className="reg-card-title">
                                <FontAwesomeIcon icon={faCheckCircle} className="text-success" /> System Health Check
                            </div>
                            {systemChecks.map((c, i) => <SystemCheckRow key={i} {...c} />)}
                            <div className="mt-3 p-2 rounded-3 text-center" style={{ background: '#F0FDF4', fontSize: 12, color: '#15803D', fontWeight: 700 }}>
                                ✅ All systems operational — Ready to resume
                            </div>
                        </div>

                        {/* Cash Verification */}
                        <div className="reg-card">
                            <div className="reg-card-title">
                                <FontAwesomeIcon icon={faMoneyBillWave} className="text-success" /> Cash Verification
                            </div>
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <label className="form-label fw-bold" style={{ fontSize: 12 }}>Opening Cash</label>
                                    <div className="input-group">
                                        <span className="input-group-text" style={{ borderRadius: '10px 0 0 10px', fontSize: 13, fontWeight: 700 }}>{currencySymbol}</span>
                                        <input type="number" className="form-control" style={{ borderRadius: '0 10px 10px 0', fontSize: 13, fontWeight: 700 }} placeholder="0.00" value={openingCash} onChange={e => setOpeningCash(e.target.value)} />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label fw-bold" style={{ fontSize: 12 }}>Current Cash Count</label>
                                    <div className="input-group">
                                        <span className="input-group-text" style={{ borderRadius: '10px 0 0 10px', fontSize: 13, fontWeight: 700 }}>{currencySymbol}</span>
                                        <input type="number" className="form-control" style={{ borderRadius: '0 10px 10px 0', fontSize: 13, fontWeight: 700 }} placeholder="0.00" value={currentCash} onChange={e => setCurrentCash(e.target.value)} />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label fw-bold" style={{ fontSize: 12 }}>Difference</label>
                                    <div style={{
                                        background: difference === 0 ? '#F0FDF4' : difference > 0 ? '#EFF6FF' : '#FEF2F2',
                                        border: `2px solid ${difference === 0 ? '#DCFCE7' : difference > 0 ? '#BFDBFE' : '#FECACA'}`,
                                        borderRadius: 10, padding: '8px 14px', fontWeight: 900, color: difference === 0 ? '#16A34A' : difference > 0 ? '#2563EB' : '#DC2626', fontSize: 16, textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        {currencySymbol} {difference.toFixed(2)}
                                    </div>
                                </div>
                                <div className="col-12">
                                    <label className="form-label fw-bold" style={{ fontSize: 12 }}>Notes</label>
                                    <textarea className="form-control" rows={2} placeholder="Cash verification notes..." style={{ borderRadius: 10, fontSize: 13 }} value={notes} onChange={e => setNotes(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {/* Manager PIN */}
                        <div className="reg-card" style={{ border: '1.5px solid #DCFCE7', background: '#F0FDF4' }}>
                            <div className="reg-card-title" style={{ color: '#15803D' }}>
                                <FontAwesomeIcon icon={faShieldAlt} /> Manager Verification
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
                        {/* Session Timeline */}
                        <div className="reg-card">
                            <div className="reg-card-title">
                                <FontAwesomeIcon icon={faClock} className="text-primary" /> Session Timeline
                            </div>
                            {[
                                { label: 'Register Opened', sub: 'Initial shift start', color: '#16A34A', icon: '🟢', time: 'Morning' },
                                { label: 'Billing Active', sub: 'POS billing in progress', color: '#2563EB', icon: '🔵', time: 'During shift' },
                                { label: 'Register Suspended', sub: 'Cash drawer locked', color: '#D97706', icon: '🟡', time: 'Suspended' },
                                { label: 'Resuming Now', sub: 'Verification in progress', color: '#16A34A', icon: '🟢', time: moment().format('hh:mm A') },
                            ].map((step, i) => (
                                <div key={i} className="d-flex align-items-start gap-3 pb-3">
                                    <div style={{ fontSize: 16, marginTop: 2, flexShrink: 0 }}>{step.icon}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: 12.5, color: '#0F172A' }}>{step.label}</div>
                                        <div style={{ fontSize: 11, color: '#64748B' }}>{step.sub}</div>
                                        <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 1 }}>{step.time}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Previous Session Stats */}
                        <div className="reg-card">
                            <div className="reg-card-title">
                                <FontAwesomeIcon icon={faBullseye} className="text-info" /> Previous Session Summary
                            </div>
                            {[
                                { label: 'Total Bills', value: '0' },
                                { label: 'Revenue', value: `${currencySymbol} 0.00` },
                                { label: 'Discounts', value: `${currencySymbol} 0.00` },
                                { label: 'Returns', value: '0' },
                            ].map((item, i) => (
                                <div key={i} className="d-flex justify-content-between align-items-center py-2 border-bottom" style={{ fontSize: 13 }}>
                                    <span style={{ color: '#475569' }}>{item.label}</span>
                                    <span style={{ fontWeight: 800, color: '#0F172A' }}>{item.value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Continue Billing Button */}
                        <Link to="/app/pos" className="btn btn-success w-100 fw-bold" style={{ borderRadius: 14, height: 52, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}>
                            <FontAwesomeIcon icon={faStore} /> Continue Billing →
                        </Link>
                    </div>
                </div>

                {/* Sticky Footer */}
                <div style={{ position: 'sticky', bottom: 0, background: '#FFFFFF', borderTop: '1px solid #E2E8F0', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 -4px 16px rgba(0,0,0,0.06)', borderRadius: '16px 16px 0 0', zIndex: 100 }}>
                    <button type="button" className="reg-btn reg-btn-outline" onClick={() => navigate(-1)}>
                        <FontAwesomeIcon icon={faArrowLeft} /> Cancel
                    </button>
                    <button
                        type="button"
                        className="reg-btn reg-btn-primary"
                        style={{ height: 44, fontSize: 14, fontWeight: 800, padding: '0 32px' }}
                        disabled={pin.length < 6}
                        onClick={() => navigate('/app/pos')}
                    >
                        <FontAwesomeIcon icon={faPlayCircle} className="me-2" /> Resume Register & Continue Billing
                    </button>
                </div>
            </div>
        </MasterLayout>
    );
};

export default ReopenRegisterPage;
