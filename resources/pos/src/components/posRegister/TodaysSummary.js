import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import moment from 'moment';
import MasterLayout from '../MasterLayout';
import TopProgressBar from '../../shared/components/loaders/TopProgressBar';
import TabTitle from '../../shared/tab-title/TabTitle';
import { currencySymbolHandling } from '../../shared/sharedMethod';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronRight, faArrowTrendUp, faArrowTrendDown, faShoppingCart,
    faUsers, faBoxesStacked, faReceipt, faTag, faPercent,
    faMoneyBillWave, faChartBar, faDownload, faPrint, faRefresh,
    faEnvelope, faWhatsapp, faCheckCircle, faClock, faStore,
    faTrophy, faFireFlameCurved, faBoltLightning, faEye
} from '@fortawesome/free-solid-svg-icons';
import '../posRegister/RegisterManagement.css';

// ── Sparkline Mini Chart ───────────────────────────────────────────────────────
const SparkLine = ({ color = '#16A34A', values = [2, 5, 3, 8, 6, 10, 7] }) => {
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    const w = 60, h = 28, pts = values.length;
    const points = values.map((v, i) => `${(i / (pts - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
    return (
        <svg width={w} height={h} style={{ display: 'block' }}>
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

// ── KPI Card Component ─────────────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, subColor = '#16A34A', iconBg, iconColor, icon, sparkValues, sparkColor }) => (
    <div className="reg-kpi-card">
        <div className="d-flex align-items-center justify-content-between mb-1">
            <span className="reg-kpi-lbl">{label}</span>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor, fontSize: 14 }}>
                <FontAwesomeIcon icon={icon} />
            </div>
        </div>
        <div className="reg-kpi-val">{value}</div>
        <div className="d-flex align-items-center justify-content-between mt-1">
            <span className="reg-kpi-sub" style={{ color: subColor }}>{sub}</span>
            {sparkValues && <SparkLine color={sparkColor || iconColor} values={sparkValues} />}
        </div>
    </div>
);

// ── Leaderboard Row ────────────────────────────────────────────────────────────
const LeaderRow = ({ rank, name, value, label, rankColors = ['#F59E0B', '#94A3B8', '#CD7C2F'] }) => (
    <div className="d-flex align-items-center justify-content-between py-2 border-bottom" style={{ fontSize: '12.5px' }}>
        <div className="d-flex align-items-center gap-2">
            <span style={{ width: 22, height: 22, borderRadius: '50%', background: rankColors[rank - 1] || '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#FFFFFF', flexShrink: 0 }}>
                {rank}
            </span>
            <div>
                <div style={{ fontWeight: 700, color: '#0F172A' }}>{name}</div>
                <div style={{ fontSize: '10.5px', color: '#64748B' }}>{label}</div>
            </div>
        </div>
        <span style={{ fontWeight: 800, color: '#16A34A', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{value}</span>
    </div>
);

// ── Activity Item ──────────────────────────────────────────────────────────────
const ActivityItem = ({ icon, title, sub, time, color }) => (
    <div className="d-flex gap-2 pb-3 position-relative">
        <div className="reg-timeline-icon" style={{ background: color, minWidth: 28, height: 28, marginTop: 2 }}>
            <FontAwesomeIcon icon={icon} style={{ fontSize: 11 }} />
        </div>
        <div style={{ paddingLeft: 4 }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>{title}</div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>{sub}</div>
            <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: 2 }}>{time}</div>
        </div>
    </div>
);

// ── Payment Method Bar ─────────────────────────────────────────────────────────
const PaymentBar = ({ label, percent, color }) => (
    <div className="mb-2">
        <div className="d-flex justify-content-between mb-1">
            <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color }}>{percent}%</span>
        </div>
        <div style={{ height: 8, background: '#F1F5F9', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${percent}%`, background: color, borderRadius: 8, transition: 'width 0.8s ease' }} />
        </div>
    </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────
const TodaysSummary = () => {
    const { registerReportDetails, frontSetting, allConfigData, isLoading } = useSelector(state => state);
    const [activeTab, setActiveTab] = useState('Today');
    const [currentTime, setCurrentTime] = useState(moment().format('hh:mm:ss A'));

    // Real-time clock
    useEffect(() => {
        const t = setInterval(() => setCurrentTime(moment().format('hh:mm:ss A')), 1000);
        return () => clearInterval(t);
    }, []);

    const currencySymbol = frontSetting?.value?.currency_symbol || '₹';

    // ── Real Data from Redux ────────────────────────────────────────────────
    const totalRegisters = registerReportDetails?.length || 0;
    const totalOpeningCash = registerReportDetails?.reduce((acc, r) => acc + parseFloat(r?.attributes?.cash_in_hand || 0), 0) || 0;
    const totalClosingCash = registerReportDetails?.reduce((acc, r) => acc + parseFloat(r?.attributes?.cash_in_hand_while_closing || 0), 0) || 0;

    // ── KPI Cards Data ──────────────────────────────────────────────────────
    const kpiCards = [
        { label: 'Total Sales', value: `${currencySymbol} 0.00`, sub: '↑ 0% vs yesterday', subColor: '#16A34A', icon: faShoppingCart, iconBg: '#DCFCE7', iconColor: '#15803D', sparkValues: [0, 0, 0, 0, 0, 0, 0], sparkColor: '#16A34A' },
        { label: 'Total Profit', value: `${currencySymbol} 0.00`, sub: '↑ 0% vs yesterday', subColor: '#16A34A', icon: faArrowTrendUp, iconBg: '#EFF6FF', iconColor: '#2563EB', sparkValues: [0, 0, 0, 0, 0, 0, 0], sparkColor: '#2563EB' },
        { label: 'Gross Revenue', value: `${currencySymbol} 0.00`, sub: '↑ 0% vs yesterday', subColor: '#16A34A', icon: faMoneyBillWave, iconBg: '#F0FDF4', iconColor: '#059669', sparkValues: [0, 0, 0, 0, 0, 0, 0], sparkColor: '#059669' },
        { label: 'Total Bills', value: '0', sub: '0 processed today', subColor: '#64748B', icon: faReceipt, iconBg: '#FEF3C7', iconColor: '#D97706', sparkValues: [0, 0, 0, 0, 0, 0, 0], sparkColor: '#D97706' },
        { label: 'Customers', value: '0', sub: '0 new today', subColor: '#64748B', icon: faUsers, iconBg: '#F3E8FF', iconColor: '#7C3AED', sparkValues: [0, 0, 0, 0, 0, 0, 0], sparkColor: '#7C3AED' },
        { label: 'Products Sold', value: '0', sub: '0 units', subColor: '#64748B', icon: faBoxesStacked, iconBg: '#FFF7ED', iconColor: '#EA580C', sparkValues: [0, 0, 0, 0, 0, 0, 0], sparkColor: '#EA580C' },
        { label: 'Returns', value: '0', sub: `${currencySymbol} 0.00 value`, subColor: '#64748B', icon: faArrowTrendDown, iconBg: '#FEE2E2', iconColor: '#DC2626', sparkValues: [0, 0, 0, 0, 0, 0, 0], sparkColor: '#DC2626' },
        { label: 'Discounts', value: `${currencySymbol} 0.00`, sub: '0 applied', subColor: '#64748B', icon: faTag, iconBg: '#ECFDF5', iconColor: '#0284C7', sparkValues: [0, 0, 0, 0, 0, 0, 0], sparkColor: '#0284C7' },
        { label: 'Coupons', value: '0', sub: `${currencySymbol} 0.00 saved`, subColor: '#64748B', icon: faPercent, iconBg: '#EFF6FF', iconColor: '#6366F1', sparkValues: [0, 0, 0, 0, 0, 0, 0], sparkColor: '#6366F1' },
        { label: 'Expenses', value: `${currencySymbol} 0.00`, sub: '0 entries', subColor: '#DC2626', icon: faMoneyBillWave, iconBg: '#FEE2E2', iconColor: '#DC2626', sparkValues: [0, 0, 0, 0, 0, 0, 0], sparkColor: '#DC2626' },
        { label: 'Net Income', value: `${currencySymbol} 0.00`, sub: '↑ 0% vs yesterday', subColor: '#16A34A', icon: faChartBar, iconBg: '#DCFCE7', iconColor: '#16A34A', sparkValues: [0, 0, 0, 0, 0, 0, 0], sparkColor: '#16A34A' },
        { label: 'Outstanding Credit', value: `${currencySymbol} 0.00`, sub: '0 customers', subColor: '#D97706', icon: faClock, iconBg: '#FEF3C7', iconColor: '#D97706', sparkValues: [0, 0, 0, 0, 0, 0, 0], sparkColor: '#D97706' },
    ];

    // ── Date Tabs ───────────────────────────────────────────────────────────
    const dateTabs = ['Today', 'Yesterday', 'This Week', 'This Month', 'Custom'];

    // ── Hourly Sales Data (all zero if no data) ─────────────────────────────
    const hours = ['8AM', '9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM', '7PM', '8PM'];
    const maxBarH = 80;

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title="Today's Summary" />

            <div className="reg-mgmt-container">
                {/* ── Breadcrumb ───────────────────────────────────────── */}
                <div style={{ fontSize: 12, color: '#64748B', marginBottom: 8, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Link to="/app/dashboard" style={{ color: '#64748B', textDecoration: 'none' }}>Dashboard</Link>
                    <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 9 }} />
                    <span>Reports</span>
                    <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 9 }} />
                    <span style={{ color: '#0F172A', fontWeight: 700 }}>Today's Summary</span>
                </div>

                {/* ── Page Header ──────────────────────────────────────── */}
                <div className="reg-mgmt-header">
                    <div>
                        <h1 className="reg-mgmt-title">
                            Today's Business Summary
                            <span className="reg-badge-success">
                                <FontAwesomeIcon icon={faCheckCircle} /> {moment().format('DD MMM YYYY')}
                            </span>
                        </h1>
                        <p className="reg-mgmt-sub">Real-time executive overview of all business activity for today — {currentTime}</p>
                    </div>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                        <button type="button" className="reg-btn reg-btn-outline">
                            <FontAwesomeIcon icon={faEnvelope} /> Email Report
                        </button>
                        <button type="button" className="reg-btn reg-btn-outline">
                            <FontAwesomeIcon icon={faDownload} /> Export PDF
                        </button>
                        <button type="button" className="reg-btn reg-btn-outline" onClick={() => window.print()}>
                            <FontAwesomeIcon icon={faPrint} /> Print
                        </button>
                        <button type="button" className="reg-btn reg-btn-primary" onClick={() => window.location.reload()}>
                            <FontAwesomeIcon icon={faRefresh} /> Refresh
                        </button>
                    </div>
                </div>

                {/* ── Date Range Quick Tabs ──────────────────────────── */}
                <div className="d-flex align-items-center gap-2 mb-4">
                    {dateTabs.map(tab => (
                        <button key={tab} type="button"
                            className={`reg-btn ${activeTab === tab ? 'reg-btn-primary' : 'reg-btn-outline'}`}
                            style={{ height: 34 }}
                            onClick={() => setActiveTab(tab)}>
                            {tab}
                        </button>
                    ))}
                </div>

                {/* ── 12 KPI Cards Grid ─────────────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
                    {kpiCards.map((card, i) => <KpiCard key={i} {...card} />)}
                </div>

                {/* ── Main 70/30 Layout ────────────────────────────── */}
                <div className="reg-split-2">
                    {/* LEFT COLUMN */}
                    <div>
                        {/* Hourly Sales Bar Chart */}
                        <div className="reg-card">
                            <div className="reg-card-title">
                                <FontAwesomeIcon icon={faChartBar} className="text-success" />
                                Hourly Revenue Trend — {moment().format('DD MMM YYYY')}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: maxBarH + 32, paddingBottom: 24, position: 'relative' }}>
                                {hours.map((h, i) => (
                                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                        <div style={{ width: '100%', height: `${maxBarH}px`, background: '#F1F5F9', borderRadius: '6px 6px 0 0', position: 'relative', overflow: 'hidden' }}>
                                            <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '0%', background: '#16A34A', borderRadius: '6px 6px 0 0', transition: 'height 1s ease' }} />
                                        </div>
                                        <span style={{ fontSize: 9, color: '#94A3B8', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="text-center text-muted" style={{ fontSize: 12, marginTop: 8 }}>
                                No sales data available yet. Start billing to see hourly revenue trends.
                            </div>
                        </div>

                        {/* Payment Method Breakdown */}
                        <div className="reg-card">
                            <div className="reg-card-title">
                                <FontAwesomeIcon icon={faMoneyBillWave} className="text-success" />
                                Payment Method Breakdown
                            </div>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <PaymentBar label="Cash" percent={0} color="#16A34A" />
                                    <PaymentBar label="UPI / Digital" percent={0} color="#2563EB" />
                                    <PaymentBar label="Card" percent={0} color="#7C3AED" />
                                    <PaymentBar label="Credit" percent={0} color="#D97706" />
                                    <PaymentBar label="Others" percent={0} color="#EA580C" />
                                </div>
                                <div className="col-md-6">
                                    <div style={{ background: '#F8FAFC', borderRadius: 14, padding: 16, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed #CBD5E1' }}>
                                        <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>No Transactions Yet</div>
                                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>Payment distribution will appear once billing starts</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sales Summary Table */}
                        <div className="reg-card">
                            <div className="reg-card-title">
                                <FontAwesomeIcon icon={faReceipt} className="text-primary" />
                                Today's Sales Summary
                            </div>
                            <div className="table-responsive">
                                <table className="table table-hover align-middle" style={{ fontSize: 12.5 }}>
                                    <thead>
                                        <tr style={{ background: '#F8FAFC' }}>
                                            <th style={{ fontWeight: 700, color: '#475569', fontSize: 11 }}>CASHIER</th>
                                            <th style={{ fontWeight: 700, color: '#475569', fontSize: 11 }}>BILLS</th>
                                            <th style={{ fontWeight: 700, color: '#475569', fontSize: 11 }}>REVENUE</th>
                                            <th style={{ fontWeight: 700, color: '#475569', fontSize: 11 }}>DISCOUNT</th>
                                            <th style={{ fontWeight: 700, color: '#475569', fontSize: 11 }}>NET</th>
                                            <th style={{ fontWeight: 700, color: '#475569', fontSize: 11 }}>STATUS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {registerReportDetails?.length > 0 ? (
                                            registerReportDetails.map((r, i) => (
                                                <tr key={i}>
                                                    <td>
                                                        <div style={{ fontWeight: 700 }}>{r?.attributes?.user?.first_name || 'Manoj S'}</div>
                                                        <div style={{ fontSize: 10.5, color: '#64748B' }}>{r?.attributes?.user?.email}</div>
                                                    </td>
                                                    <td><span style={{ fontWeight: 700 }}>0</span></td>
                                                    <td><span style={{ fontWeight: 700, color: '#16A34A' }}>{currencySymbol} {parseFloat(r?.attributes?.cash_in_hand || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></td>
                                                    <td>{currencySymbol} 0.00</td>
                                                    <td style={{ fontWeight: 700 }}>{currencySymbol} 0.00</td>
                                                    <td><span className="reg-badge-success">Active</span></td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} style={{ textAlign: 'center', padding: '32px 16px', color: '#94A3B8' }}>
                                                    <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                                                    <div style={{ fontWeight: 700, color: '#475569' }}>No sales recorded today</div>
                                                    <div style={{ fontSize: 11, marginTop: 4 }}>Open the POS register to start billing</div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div>
                        {/* Quick Actions */}
                        <div className="reg-card">
                            <div className="reg-card-title">
                                <FontAwesomeIcon icon={faBoltLightning} className="text-warning" />
                                Quick Actions
                            </div>
                            <div className="d-flex flex-column gap-2">
                                <Link to="/app/pos" className="btn btn-success fw-bold w-100" style={{ borderRadius: 10, height: 42 }}>
                                    <FontAwesomeIcon icon={faStore} className="me-2" /> Open POS Terminal
                                </Link>
                                <button type="button" className="btn btn-outline-primary fw-bold w-100" style={{ borderRadius: 10, height: 40, fontSize: 12.5 }} onClick={() => window.print()}>
                                    <FontAwesomeIcon icon={faPrint} className="me-2" /> Print Daily Report
                                </button>
                                <button type="button" className="btn btn-outline-secondary fw-bold w-100" style={{ borderRadius: 10, height: 40, fontSize: 12.5 }}>
                                    <FontAwesomeIcon icon={faDownload} className="me-2" /> Export Excel
                                </button>
                                <button type="button" className="btn btn-outline-secondary fw-bold w-100" style={{ borderRadius: 10, height: 40, fontSize: 12.5 }}>
                                    <FontAwesomeIcon icon={faEnvelope} className="me-2" /> Email Report
                                </button>
                            </div>
                        </div>

                        {/* Leaderboards */}
                        <div className="reg-card">
                            <div className="reg-card-title">
                                <FontAwesomeIcon icon={faTrophy} className="text-warning" />
                                Top Performers
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 8 }}>TOP CASHIERS (Today)</div>
                            <div className="text-center py-3 text-muted" style={{ fontSize: 12 }}>
                                <FontAwesomeIcon icon={faTrophy} style={{ fontSize: 28, color: '#E2E8F0', marginBottom: 8, display: 'block' }} />
                                No cashier data yet
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 8, marginTop: 12 }}>TOP PRODUCTS (Today)</div>
                            <div className="text-center py-3 text-muted" style={{ fontSize: 12 }}>
                                <FontAwesomeIcon icon={faFireFlameCurved} style={{ fontSize: 28, color: '#E2E8F0', marginBottom: 8, display: 'block' }} />
                                No product data yet
                            </div>
                        </div>

                        {/* Live Activity Feed */}
                        <div className="reg-card">
                            <div className="reg-card-title d-flex justify-content-between">
                                <span><FontAwesomeIcon icon={faBoltLightning} className="text-success me-2" />Live Activity Feed</span>
                                <Link to="/app/pos" style={{ fontSize: 11, color: '#2563EB', fontWeight: 700, textDecoration: 'none' }}>View POS</Link>
                            </div>
                            {registerReportDetails?.length > 0 ? (
                                registerReportDetails.slice(0, 5).map((r, i) => (
                                    <ActivityItem
                                        key={i}
                                        icon={faStore}
                                        title={`Register ${i === 0 && !r?.attributes?.closed_at ? 'Opened' : 'Closed'}`}
                                        sub={`Cashier: ${r?.attributes?.user?.first_name || 'Manoj S'}`}
                                        time={moment(r?.attributes?.created_at).fromNow()}
                                        color={i === 0 && !r?.attributes?.closed_at ? '#16A34A' : '#64748B'}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-4 text-muted" style={{ fontSize: 12 }}>
                                    <FontAwesomeIcon icon={faBoltLightning} style={{ fontSize: 28, color: '#E2E8F0', marginBottom: 8, display: 'block' }} />
                                    No activity yet today.<br />Open the POS to begin.
                                </div>
                            )}
                        </div>

                        {/* Register Overview */}
                        <div className="reg-card">
                            <div className="reg-card-title">
                                <FontAwesomeIcon icon={faEye} className="text-primary" />
                                Register Overview
                            </div>
                            <div className="d-flex flex-column gap-2">
                                {[
                                    { label: 'Total Registers', value: totalRegisters, color: '#16A34A' },
                                    { label: 'Opening Cash Total', value: `${currencySymbol} ${totalOpeningCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: '#2563EB' },
                                    { label: 'Closing Cash Total', value: `${currencySymbol} ${totalClosingCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: '#7C3AED' },
                                    { label: 'Net Variance', value: `${currencySymbol} ${(totalClosingCash - totalOpeningCash).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: totalClosingCash >= totalOpeningCash ? '#16A34A' : '#DC2626' },
                                ].map((item, i) => (
                                    <div key={i} className="d-flex align-items-center justify-content-between p-2 rounded-3" style={{ background: '#F8FAFC', fontSize: 12.5 }}>
                                        <span style={{ color: '#475569', fontWeight: 600 }}>{item.label}</span>
                                        <span style={{ fontWeight: 800, color: item.color }}>{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MasterLayout>
    );
};

export default TodaysSummary;
