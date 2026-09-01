import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import moment from 'moment';
import MasterLayout from '../MasterLayout';
import TopProgressBar from '../../shared/components/loaders/TopProgressBar';
import TabTitle from '../../shared/tab-title/TabTitle';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronRight, faArrowLeft, faPrint, faFloppyDisk,
    faCheckCircle, faClock, faBuilding, faUser,
    faMoneyBillWave, faVault, faShieldAlt, faClipboardList,
    faReceipt, faNoteSticky, faCirclePlus
} from '@fortawesome/free-solid-svg-icons';
import './RegisterManagement.css';

// ── Denomination rows ─────────────────────────────────────────────
const DENOMS = [500, 200, 100, 50, 20, 10, 5, 2, 1];

const CashDropPage = () => {
    const navigate = useNavigate();
    const { frontSetting } = useSelector(state => state);
    const currencySymbol = frontSetting?.value?.currency_symbol || '₹';

    const [counts, setCounts] = useState(DENOMS.reduce((acc, d) => ({ ...acc, [d]: '' }), {}));
    const [dropReason, setDropReason] = useState('');
    const [safeDest, setSafeDest] = useState('');
    const [pin, setPin] = useState('');
    const [notes, setNotes] = useState('');
    const [attachedFiles, setAttachedFiles] = useState([]);
    const [approver, setApprover] = useState('');
    const [confirmed, setConfirmed] = useState(false);

    const refNo = `CDROP-${moment().format('YYMMDDHHmm')}-001`;
    const currentTime = moment().format('DD MMM YYYY hh:mm A');

    const denominationTotal = DENOMS.reduce((sum, d) => {
        const c = parseInt(counts[d] || 0, 10);
        return sum + (isNaN(c) ? 0 : c * d);
    }, 0);

    const drawerCash = 0; // Real value would come from open register state
    const afterDropBalance = drawerCash - denominationTotal;

    const kpis = [
        { label: 'Current Drawer Cash', value: `${currencySymbol} ${drawerCash.toFixed(2)}`, color: '#16A34A', bg: '#DCFCE7', icon: faMoneyBillWave },
        { label: 'Drop Amount', value: `${currencySymbol} ${denominationTotal.toFixed(2)}`, color: '#2563EB', bg: '#EFF6FF', icon: faMoneyBillWave },
        { label: 'Safe Balance', value: `${currencySymbol} 0.00`, color: '#7C3AED', bg: '#F3E8FF', icon: faVault },
        { label: 'Pending Approval', value: '0', color: '#D97706', bg: '#FEF3C7', icon: faClock },
    ];

    const handleFileUpload = (e) => {
        if (e.target.files) setAttachedFiles(prev => [...prev, ...Array.from(e.target.files)]);
    };

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title="Cash Drop" />
            <div className="reg-mgmt-container">
                {/* Breadcrumb */}
                <div style={{ fontSize: 12, color: '#64748B', marginBottom: 8, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Link to="/app/dashboard" style={{ color: '#64748B', textDecoration: 'none' }}>Dashboard</Link>
                    <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 9 }} />
                    <span>POS</span>
                    <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 9 }} />
                    <span>Register</span>
                    <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 9 }} />
                    <span style={{ color: '#0F172A', fontWeight: 700 }}>Cash Drop</span>
                </div>

                {/* Header */}
                <div className="reg-mgmt-header">
                    <div>
                        <h1 className="reg-mgmt-title">
                            <FontAwesomeIcon icon={faMoneyBillWave} className="text-success" />
                            Cash Drop Management
                        </h1>
                        <p className="reg-mgmt-sub">Transfer excess cash from the register drawer to the safe. All drops are logged and require manager approval.</p>
                    </div>
                    <button type="button" className="reg-btn reg-btn-outline" onClick={() => navigate(-1)}>
                        <FontAwesomeIcon icon={faArrowLeft} /> Back
                    </button>
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

                {/* Main 70/30 Layout */}
                <div className="reg-split-2">
                    {/* LEFT */}
                    <div>
                        {/* Register & Cashier Info */}
                        <div className="reg-card">
                            <div className="reg-card-title">
                                <FontAwesomeIcon icon={faBuilding} className="text-primary" /> Register & Shift Information
                            </div>
                            <div className="row g-3" style={{ fontSize: 13 }}>
                                {[
                                    { lbl: 'Register No.', val: 'REG-001' },
                                    { lbl: 'Cashier', val: 'Manoj S (Administrator)' },
                                    { lbl: 'Shift', val: 'Morning Shift' },
                                    { lbl: 'Date & Time', val: currentTime },
                                    { lbl: 'Drop Reference', val: refNo },
                                    { lbl: 'Status', val: <span className="reg-badge-success">Active</span> },
                                ].map((item, i) => (
                                    <div key={i} className="col-md-4">
                                        <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '10px 14px', border: '1px solid #E2E8F0' }}>
                                            <div style={{ fontSize: 10.5, color: '#64748B', fontWeight: 600, marginBottom: 3 }}>{item.lbl}</div>
                                            <div style={{ fontWeight: 700, color: '#0F172A' }}>{item.val}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Denomination Counter */}
                        <div className="reg-card">
                            <div className="reg-card-title">
                                <FontAwesomeIcon icon={faMoneyBillWave} className="text-success" /> Denomination Counter
                                <span className="ms-auto reg-badge-success fs-micro">{currencySymbol} {denominationTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <table className="denomi-table w-100">
                                <thead>
                                    <tr style={{ fontSize: 11, color: '#64748B', fontWeight: 700 }}>
                                        <td style={{ paddingBottom: 6 }}>DENOMINATION</td>
                                        <td style={{ textAlign: 'center', paddingBottom: 6 }}>COUNT</td>
                                        <td style={{ textAlign: 'right', paddingBottom: 6 }}>TOTAL</td>
                                    </tr>
                                </thead>
                                <tbody>
                                    {DENOMS.map(d => {
                                        const count = parseInt(counts[d] || 0, 10);
                                        const total = isNaN(count) ? 0 : count * d;
                                        return (
                                            <tr key={d}>
                                                <td style={{ fontWeight: 700 }}>
                                                    <span style={{ background: '#DCFCE7', color: '#15803D', fontWeight: 800, padding: '2px 8px', borderRadius: 5, fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>
                                                        {currencySymbol} {d}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <input
                                                        type="number"
                                                        className="denomi-input"
                                                        min="0"
                                                        placeholder="0"
                                                        value={counts[d]}
                                                        onChange={e => setCounts(prev => ({ ...prev, [d]: e.target.value }))}
                                                    />
                                                </td>
                                                <td style={{ textAlign: 'right', fontWeight: 800, color: total > 0 ? '#16A34A' : '#94A3B8', fontFamily: 'JetBrains Mono, monospace' }}>
                                                    {currencySymbol} {total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    <tr>
                                        <td colSpan={2} style={{ fontWeight: 800, fontSize: 14, color: '#0F172A' }}>Grand Total</td>
                                        <td style={{ textAlign: 'right', fontWeight: 900, fontSize: 16, color: '#16A34A', fontFamily: 'JetBrains Mono, monospace' }}>
                                            {currencySymbol} {denominationTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Drop Details */}
                        <div className="reg-card">
                            <div className="reg-card-title">
                                <FontAwesomeIcon icon={faClipboardList} className="text-primary" /> Drop Details
                            </div>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label fw-bold" style={{ fontSize: 12 }}>Drop Reason <span className="text-danger">*</span></label>
                                    <select className="form-select" style={{ borderRadius: 10, fontSize: 13 }} value={dropReason} onChange={e => setDropReason(e.target.value)}>
                                        <option value="">Select Reason</option>
                                        <option>Safe Deposit</option>
                                        <option>Bank Deposit</option>
                                        <option>End of Shift</option>
                                        <option>Excess Cash</option>
                                        <option>Manager Request</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-bold" style={{ fontSize: 12 }}>Safe Destination</label>
                                    <select className="form-select" style={{ borderRadius: 10, fontSize: 13 }} value={safeDest} onChange={e => setSafeDest(e.target.value)}>
                                        <option value="">Select Safe</option>
                                        <option>Main Safe</option>
                                        <option>Branch Safe</option>
                                        <option>Manager Safe</option>
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-bold" style={{ fontSize: 12 }}>Reference No.</label>
                                    <input type="text" className="form-control" value={refNo} readOnly style={{ borderRadius: 10, background: '#F1F5F9', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700 }} />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-bold" style={{ fontSize: 12 }}>Attach Receipt</label>
                                    <label className="d-block border rounded-3 text-center py-2 cursor-pointer" style={{ borderRadius: 10, borderStyle: 'dashed', background: '#F8FAFC', cursor: 'pointer', fontSize: 12 }}>
                                        <input type="file" multiple className="d-none" onChange={handleFileUpload} />
                                        <FontAwesomeIcon icon={faCirclePlus} className="text-success me-1" />
                                        {attachedFiles.length > 0 ? `${attachedFiles.length} file(s) attached` : 'Click to attach receipt'}
                                    </label>
                                </div>
                                <div className="col-12">
                                    <label className="form-label fw-bold" style={{ fontSize: 12 }}>Notes</label>
                                    <textarea className="form-control" rows={3} placeholder="Add notes about this cash drop..." style={{ borderRadius: 10, fontSize: 13 }} value={notes} onChange={e => setNotes(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {/* Manager Approval */}
                        <div className="reg-card" style={{ border: '1.5px solid #FDE68A', background: '#FFFBEB' }}>
                            <div className="reg-card-title">
                                <FontAwesomeIcon icon={faShieldAlt} className="text-warning" /> Manager Approval
                            </div>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label fw-bold" style={{ fontSize: 12 }}>Approver</label>
                                    <select className="form-select" style={{ borderRadius: 10, fontSize: 13 }} value={approver} onChange={e => setApprover(e.target.value)}>
                                        <option value="">Select Approver</option>
                                        <option>Store Manager</option>
                                        <option>Shift Supervisor</option>
                                        <option>Finance Head</option>
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-bold" style={{ fontSize: 12 }}>Manager PIN <span className="text-danger">*</span></label>
                                    <input
                                        type="password"
                                        maxLength={6}
                                        className="form-control"
                                        placeholder="Enter 6-digit PIN"
                                        style={{ borderRadius: 10, fontSize: 16, letterSpacing: 6, textAlign: 'center', fontWeight: 800 }}
                                        value={pin}
                                        onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    />
                                </div>
                                <div className="col-12">
                                    <div style={{ background: '#F8FAFC', border: '2px dashed #CBD5E1', borderRadius: 10, height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 13 }}>
                                        Digital Signature Area — Manager signs here
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDEBAR */}
                    <div>
                        {/* Live Summary */}
                        <div className="reg-card">
                            <div className="reg-card-title">
                                <FontAwesomeIcon icon={faReceipt} className="text-success" /> Live Drop Summary
                            </div>
                            {[
                                { label: 'Current Drawer Cash', val: `${currencySymbol} ${drawerCash.toFixed(2)}`, color: '#0F172A' },
                                { label: 'Drop Amount', val: `${currencySymbol} ${denominationTotal.toFixed(2)}`, color: '#DC2626' },
                                { label: 'After Drop Balance', val: `${currencySymbol} ${afterDropBalance.toFixed(2)}`, color: afterDropBalance >= 0 ? '#16A34A' : '#DC2626' },
                                { label: 'Safe Destination', val: safeDest || 'Not selected', color: '#2563EB' },
                            ].map((row, i) => (
                                <div key={i} className="d-flex justify-content-between align-items-center py-2 border-bottom" style={{ fontSize: 13 }}>
                                    <span style={{ color: '#475569' }}>{row.label}</span>
                                    <span style={{ fontWeight: 800, color: row.color }}>{row.val}</span>
                                </div>
                            ))}
                            <div className="d-flex justify-content-between align-items-center pt-3" style={{ fontSize: 15, fontWeight: 900 }}>
                                <span>Drop Reference</span>
                                <span style={{ color: '#2563EB', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{refNo}</span>
                            </div>
                        </div>

                        {/* Recent Drops Timeline */}
                        <div className="reg-card">
                            <div className="reg-card-title">
                                <FontAwesomeIcon icon={faClock} className="text-primary" /> Recent Drops
                            </div>
                            <div className="text-center py-4 text-muted" style={{ fontSize: 12 }}>
                                <FontAwesomeIcon icon={faMoneyBillWave} style={{ fontSize: 28, color: '#E2E8F0', display: 'block', marginBottom: 8 }} />
                                No cash drops recorded yet today
                            </div>
                        </div>

                        {/* Smart Tips */}
                        <div className="reg-card" style={{ background: '#F0FDF4', border: '1px solid #DCFCE7' }}>
                            <div className="reg-card-title" style={{ color: '#15803D' }}>
                                💡 Smart Tips
                            </div>
                            <ul style={{ fontSize: 11.5, color: '#166534', paddingLeft: 16, margin: 0, lineHeight: 1.8 }}>
                                <li>Always count denomination before dropping</li>
                                <li>Attach physical receipt to drop slip</li>
                                <li>Manager must verify and approve</li>
                                <li>Drops are auto-logged in audit trail</li>
                                <li>Never leave drawer unattended during drop</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Sticky Footer */}
                <div style={{ position: 'sticky', bottom: 0, background: '#FFFFFF', borderTop: '1px solid #E2E8F0', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 -4px 16px rgba(0,0,0,0.06)', borderRadius: '16px 16px 0 0', zIndex: 100 }}>
                    <button type="button" className="reg-btn reg-btn-outline" onClick={() => navigate(-1)}>
                        <FontAwesomeIcon icon={faArrowLeft} /> Cancel
                    </button>
                    <div className="d-flex gap-2">
                        <button type="button" className="reg-btn reg-btn-outline">
                            <FontAwesomeIcon icon={faFloppyDisk} /> Save Draft
                        </button>
                        <button type="button" className="reg-btn reg-btn-outline" onClick={() => window.print()}>
                            <FontAwesomeIcon icon={faPrint} /> Print Slip
                        </button>
                        <button
                            type="button"
                            className="reg-btn reg-btn-primary"
                            disabled={!dropReason || !pin || pin.length < 6 || denominationTotal === 0}
                            onClick={() => setConfirmed(true)}
                        >
                            <FontAwesomeIcon icon={faCheckCircle} /> Confirm Drop
                        </button>
                    </div>
                </div>
            </div>
        </MasterLayout>
    );
};

export default CashDropPage;
