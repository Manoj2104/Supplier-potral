import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import moment from 'moment';
import MasterLayout from '../MasterLayout';
import TopProgressBar from '../../shared/components/loaders/TopProgressBar';
import TabTitle from '../../shared/tab-title/TabTitle';
import { getAllRegisterReportDetailsAction } from '../../store/action/pos/posRegisterDetailsAction';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronRight, faDownload, faPrint, faFileExcel, faFilePdf,
    faChartBar, faUsers, faMoneyBillWave, faReceipt,
    faTag, faPercent, faRefresh, faClock, faArrowTrendUp,
    faArrowTrendDown, faStore, faBullseye
} from '@fortawesome/free-solid-svg-icons';
import './RegisterManagement.css';

// ── Donut Chart (SVG) ─────────────────────────────────────────────────────────
const DonutSlice = ({ segments, size = 120 }) => {
    const r = size / 2 - 16;
    const cx = size / 2, cy = size / 2;
    const circumference = 2 * Math.PI * r;
    const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;

    let offset = 0;
    return (
        <svg width={size} height={size} style={{ display: 'block', margin: '0 auto' }}>
            {total === 0 || segments.every(s => s.value === 0) ? (
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E2E8F0" strokeWidth={20} />
            ) : segments.map((seg, i) => {
                const dash = (seg.value / total) * circumference;
                const el = (
                    <circle
                        key={i}
                        cx={cx} cy={cy} r={r}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth={20}
                        strokeDasharray={`${dash} ${circumference - dash}`}
                        strokeDashoffset={-offset}
                        style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dasharray 0.6s ease' }}
                    />
                );
                offset += dash;
                return el;
            })}
            <text x={cx} y={cy - 4} textAnchor="middle" style={{ fontSize: 16, fontWeight: 900, fill: '#0F172A', fontFamily: 'JetBrains Mono, monospace' }}>
                {total > 0 ? total : 0}
            </text>
            <text x={cx} y={cy + 14} textAnchor="middle" style={{ fontSize: 9, fill: '#64748B', fontWeight: 600 }}>SESSIONS</text>
        </svg>
    );
};

// ── Payment Method Card ───────────────────────────────────────────────────────
const PayBar = ({ label, value, percent, color }) => (
    <div className="mb-3">
        <div className="d-flex justify-content-between align-items-center mb-1">
            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#334155' }}>{label}</span>
            <div className="d-flex gap-2 align-items-center">
                <span style={{ fontSize: 12, fontWeight: 800, color, fontFamily: 'JetBrains Mono, monospace' }}>{value}</span>
                <span style={{ fontSize: 10, color: '#94A3B8' }}>{percent}%</span>
            </div>
        </div>
        <div style={{ height: 8, background: '#F1F5F9', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${percent}%`, background: color, borderRadius: 8, transition: 'width 0.8s ease' }} />
        </div>
    </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────
const ShiftReportsPage = () => {
    const dispatch = useDispatch();
    const { registerReportDetails, frontSetting, allConfigData, isLoading, totalRecord } = useSelector(state => state);

    const currencySymbol = frontSetting?.value?.currency_symbol || '₹';
    const [activeTab, setActiveTab] = useState('Today');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    useEffect(() => {
        dispatch(getAllRegisterReportDetailsAction({}));
    }, []);

    // ── Real Data Calcs ─────────────────────────────────────────────────────
    const totalSessions = registerReportDetails?.length || 0;
    const totalOpeningCash = registerReportDetails?.reduce((s, r) => s + parseFloat(r?.attributes?.cash_in_hand || 0), 0) || 0;
    const totalClosingCash = registerReportDetails?.reduce((s, r) => s + parseFloat(r?.attributes?.cash_in_hand_while_closing || 0), 0) || 0;
    const cashDiff = totalClosingCash - totalOpeningCash;

    const openSessions = registerReportDetails?.filter(r => !r?.attributes?.closed_at)?.length || 0;
    const closedSessions = registerReportDetails?.filter(r => r?.attributes?.closed_at)?.length || 0;

    const tabs = ['Today', 'Yesterday', 'This Week', 'This Month', 'Custom'];

    const kpiRows = [
        [
            { label: 'Total Revenue', value: `${currencySymbol} ${totalClosingCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: '#16A34A', bg: '#DCFCE7', icon: faMoneyBillWave, trend: '↑ 0%' },
            { label: 'Net Cash Change', value: `${cashDiff >= 0 ? '+' : ''}${currencySymbol} ${Math.abs(cashDiff).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: cashDiff >= 0 ? '#16A34A' : '#DC2626', bg: cashDiff >= 0 ? '#DCFCE7' : '#FEE2E2', icon: cashDiff >= 0 ? faArrowTrendUp : faArrowTrendDown, trend: cashDiff >= 0 ? '↑ Net Gain' : '↓ Net Loss' },
            { label: 'Total Sessions', value: totalSessions, color: '#2563EB', bg: '#EFF6FF', icon: faReceipt, trend: `${openSessions} open` },
            { label: 'Avg Session Cash', value: `${currencySymbol} ${totalSessions > 0 ? (totalOpeningCash / totalSessions).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}`, color: '#7C3AED', bg: '#F3E8FF', icon: faBullseye, trend: 'avg opening' },
        ],
        [
            { label: 'Active Cashiers', value: openSessions, color: '#16A34A', bg: '#F0FDF4', icon: faUsers, trend: 'Now active' },
            { label: 'Sessions Closed', value: closedSessions, color: '#64748B', bg: '#F8FAFC', icon: faClock, trend: 'Completed' },
            { label: 'Discounts Given', value: `${currencySymbol} 0.00`, color: '#D97706', bg: '#FEF3C7', icon: faTag, trend: '0 applied' },
            { label: 'Returns', value: 0, color: '#DC2626', bg: '#FEE2E2', icon: faPercent, trend: '0 returns' },
        ]
    ];

    // ── Cashier Performance Data ────────────────────────────────────────────
    const cashierPerf = registerReportDetails?.map(r => ({
        name: `${r?.attributes?.user?.first_name || ''} ${r?.attributes?.user?.last_name || ''}`.trim() || 'Unknown',
        opening: parseFloat(r?.attributes?.cash_in_hand || 0),
        closing: parseFloat(r?.attributes?.cash_in_hand_while_closing || 0),
        isOpen: !r?.attributes?.closed_at,
    })) || [];

    // ── Donut data ──────────────────────────────────────────────────────────
    const donutData = [
        { label: 'Open', value: openSessions, color: '#16A34A' },
        { label: 'Closed', value: closedSessions, color: '#64748B' },
        { label: 'Suspended', value: 0, color: '#D97706' },
    ];

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title="Shift Reports" />
            <div className="reg-mgmt-container">
                {/* Breadcrumb */}
                <div style={{ fontSize: 12, color: '#64748B', marginBottom: 8, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Link to="/app/dashboard" style={{ color: '#64748B', textDecoration: 'none' }}>Dashboard</Link>
                    <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 9 }} />
                    <span>Reports</span>
                    <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 9 }} />
                    <span style={{ color: '#0F172A', fontWeight: 700 }}>Shift Reports</span>
                </div>

                {/* Header */}
                <div className="reg-mgmt-header">
                    <div>
                        <h1 className="reg-mgmt-title">
                            <FontAwesomeIcon icon={faChartBar} className="text-success" />
                            Shift Reports & Analytics
                        </h1>
                        <p className="reg-mgmt-sub">Performance analytics by shift, cashier, and payment method — powered by real register data</p>
                    </div>
                    <div className="d-flex gap-2 flex-wrap align-items-center">
                        <button type="button" className="reg-btn reg-btn-outline" onClick={() => dispatch(getAllRegisterReportDetailsAction({}))}>
                            <FontAwesomeIcon icon={faRefresh} /> Refresh
                        </button>
                        <button type="button" className="reg-btn reg-btn-outline" onClick={() => window.print()}>
                            <FontAwesomeIcon icon={faPrint} /> Print
                        </button>
                        <button type="button" className="reg-btn reg-btn-outline">
                            <FontAwesomeIcon icon={faFileExcel} /> Excel
                        </button>
                        <button type="button" className="reg-btn reg-btn-outline">
                            <FontAwesomeIcon icon={faFilePdf} /> PDF
                        </button>
                    </div>
                </div>

                {/* Date Range Quick Tabs */}
                <div className="d-flex align-items-center gap-2 mb-4 flex-wrap">
                    {tabs.map(tab => (
                        <button key={tab} type="button"
                            className={`reg-btn ${activeTab === tab ? 'reg-btn-primary' : 'reg-btn-outline'}`}
                            style={{ height: 34 }}
                            onClick={() => setActiveTab(tab)}>
                            {tab}
                        </button>
                    ))}
                    {activeTab === 'Custom' && (
                        <>
                            <input type="date" className="form-control form-control-sm" style={{ width: 150, borderRadius: 8 }} value={fromDate} onChange={e => setFromDate(e.target.value)} />
                            <input type="date" className="form-control form-control-sm" style={{ width: 150, borderRadius: 8 }} value={toDate} onChange={e => setToDate(e.target.value)} />
                        </>
                    )}
                </div>

                {/* 8 KPI Cards — 2 rows of 4 */}
                {kpiRows.map((row, ri) => (
                    <div key={ri} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 }}>
                        {row.map((k, i) => (
                            <div key={i} className="reg-kpi-card">
                                <div className="d-flex align-items-center justify-content-between mb-1">
                                    <span className="reg-kpi-lbl">{k.label}</span>
                                    <div style={{ width: 28, height: 28, borderRadius: 8, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: k.color }}>
                                        <FontAwesomeIcon icon={k.icon} style={{ fontSize: 11 }} />
                                    </div>
                                </div>
                                <div className="reg-kpi-val" style={{ color: k.color, fontSize: 18 }}>{k.value}</div>
                                <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 4, fontWeight: 600 }}>{k.trend}</div>
                            </div>
                        ))}
                    </div>
                ))}

                {/* 2x2 Reports Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                    {/* Cashier Performance */}
                    <div className="reg-card">
                        <div className="reg-card-title">
                            <FontAwesomeIcon icon={faUsers} className="text-primary" /> Cashier Performance
                        </div>
                        <table className="table table-hover align-middle" style={{ fontSize: 12 }}>
                            <thead>
                                <tr style={{ background: '#F8FAFC' }}>
                                    <th style={{ fontSize: 10.5, fontWeight: 700, color: '#475569' }}>CASHIER</th>
                                    <th style={{ fontSize: 10.5, fontWeight: 700, color: '#475569' }}>OPENING</th>
                                    <th style={{ fontSize: 10.5, fontWeight: 700, color: '#475569' }}>CLOSING</th>
                                    <th style={{ fontSize: 10.5, fontWeight: 700, color: '#475569' }}>STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cashierPerf.length > 0 ? cashierPerf.map((c, i) => (
                                    <tr key={i}>
                                        <td>
                                            <div style={{ fontWeight: 700, fontSize: 12 }}>{c.name}</div>
                                        </td>
                                        <td style={{ fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                                            {currencySymbol} {c.opening.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td style={{ fontWeight: 700, color: '#16A34A', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                                            {currencySymbol} {c.closing.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td>
                                            {c.isOpen ? <span className="reg-badge-success">Active</span> : <span style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B', background: '#F1F5F9', padding: '2px 8px', borderRadius: 12 }}>Closed</span>}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={4} className="text-center py-4 text-muted" style={{ fontSize: 12 }}>No cashier data found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Session Overview Donut */}
                    <div className="reg-card">
                        <div className="reg-card-title">
                            <FontAwesomeIcon icon={faStore} className="text-success" /> Session Overview
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <DonutSlice segments={donutData} size={160} />
                        </div>
                        <div className="d-flex flex-column gap-2">
                            {donutData.map((seg, i) => (
                                <div key={i} className="d-flex align-items-center justify-content-between">
                                    <div className="d-flex align-items-center gap-2">
                                        <div style={{ width: 10, height: 10, borderRadius: 2, background: seg.color }} />
                                        <span style={{ fontSize: 12, color: '#475569' }}>{seg.label}</span>
                                    </div>
                                    <span style={{ fontWeight: 800, color: seg.color, fontSize: 12 }}>{seg.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Payment Analysis */}
                    <div className="reg-card">
                        <div className="reg-card-title">
                            <FontAwesomeIcon icon={faMoneyBillWave} className="text-success" /> Payment Method Analysis
                        </div>
                        <PayBar label="Cash" value={`${currencySymbol} 0.00`} percent={0} color="#16A34A" />
                        <PayBar label="UPI / Digital" value={`${currencySymbol} 0.00`} percent={0} color="#2563EB" />
                        <PayBar label="Card" value={`${currencySymbol} 0.00`} percent={0} color="#7C3AED" />
                        <PayBar label="Credit / Due" value={`${currencySymbol} 0.00`} percent={0} color="#D97706" />
                        <div className="text-center mt-2" style={{ fontSize: 11, color: '#94A3B8' }}>
                            Payment breakdowns visible after billing starts
                        </div>
                    </div>

                    {/* Shift Timeline */}
                    <div className="reg-card">
                        <div className="reg-card-title">
                            <FontAwesomeIcon icon={faClock} className="text-primary" /> Shift Timeline
                        </div>
                        {registerReportDetails?.length > 0 ? (
                            registerReportDetails.slice(0, 5).map((r, i) => (
                                <div key={i} className="d-flex align-items-start gap-3 pb-3 border-bottom">
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: !r?.attributes?.closed_at ? '#16A34A' : '#64748B', marginTop: 5, flexShrink: 0 }} />
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>
                                            {!r?.attributes?.closed_at ? 'Register Opened' : 'Register Closed'}
                                        </div>
                                        <div style={{ fontSize: 11, color: '#64748B' }}>
                                            {r?.attributes?.user?.first_name || 'Manoj S'} — REG-{String(i + 1).padStart(3, '0')}
                                        </div>
                                        <div style={{ fontSize: 10.5, color: '#94A3B8' }}>
                                            {moment(r?.attributes?.created_at).format('hh:mm A, DD MMM YYYY')}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-4 text-muted" style={{ fontSize: 12 }}>
                                <div style={{ fontSize: 28, marginBottom: 8 }}>📊</div>
                                No shift data available yet
                            </div>
                        )}
                    </div>
                </div>

                {/* Export Section */}
                <div className="reg-card" style={{ background: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)', border: '1.5px solid #BBF7D0' }}>
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                        <div>
                            <div style={{ fontWeight: 800, color: '#15803D', fontSize: 15 }}>
                                <FontAwesomeIcon icon={faDownload} className="me-2" />Export Shift Reports
                            </div>
                            <div style={{ fontSize: 12, color: '#16A34A', marginTop: 4 }}>
                                Download complete shift analytics in your preferred format
                            </div>
                        </div>
                        <div className="d-flex gap-2 flex-wrap">
                            <button type="button" className="reg-btn" style={{ background: '#1D6F42', color: '#FFF', borderColor: '#1D6F42', height: 38 }}>
                                <FontAwesomeIcon icon={faFileExcel} /> Export Excel
                            </button>
                            <button type="button" className="reg-btn" style={{ background: '#C62828', color: '#FFF', borderColor: '#C62828', height: 38 }}>
                                <FontAwesomeIcon icon={faFilePdf} /> Export PDF
                            </button>
                            <button type="button" className="reg-btn reg-btn-outline" style={{ height: 38 }} onClick={() => window.print()}>
                                <FontAwesomeIcon icon={faPrint} /> Print Report
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </MasterLayout>
    );
};

export default ShiftReportsPage;
