import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import moment from 'moment';
import MasterLayout from '../MasterLayout';
import TopProgressBar from '../../shared/components/loaders/TopProgressBar';
import TabTitle from '../../shared/tab-title/TabTitle';
import ReactDataTable from '../../shared/table/ReactDataTable';
import { getAllRegisterReportDetailsAction } from '../../store/action/pos/posRegisterDetailsAction';
import { fetchUsers } from '../../store/action/userAction';
import ReactSelect from '../../shared/select/reactSelect';
import { getFormattedMessage, currencySymbolHandling } from '../../shared/sharedMethod';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronRight, faSearch, faFilter, faDownload, faPrint,
    faFileExcel, faFilePdf, faStore, faCheckCircle, faTimesCircle,
    faClock, faUser, faMoneyBillWave, faRefresh, faEye,
    faChartBar, faCashRegister
} from '@fortawesome/free-solid-svg-icons';
import './RegisterManagement.css';

const RegisterHistoryPage = () => {
    const dispatch = useDispatch();
    const { isLoading, totalRecord, registerReportDetails, frontSetting, allConfigData, dates, users } = useSelector(state => state);

    const currencySymbol = frontSetting?.value?.currency_symbol || '₹';

    const [userData, setUserData] = useState({});
    const [usersOptions, setUsersOptions] = useState([]);
    const [usersType, setUsersType] = useState([]);
    const [tableFilter, setTableFilter] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    useEffect(() => {
        dispatch(fetchUsers({}, true, '?page[size]=0&returnAll=true'));
        dispatch(getAllRegisterReportDetailsAction({}));
    }, []);

    useEffect(() => {
        if (users?.length > 0) {
            const options = users.map(u => ({ id: u?.id, name: `${u?.attributes?.first_name || ''} ${u?.attributes?.last_name || ''}`.trim() }));
            setUsersOptions(options);
            setUsersType(options.map(u => ({ value: u.id, label: u.name })));
        }
    }, [users]);

    useEffect(() => {
        let query = '';
        if (userData?.value) query += `?user_id=${userData.value}`;
        if (fromDate && toDate) {
            query += `${query ? '&' : '?'}start_date=${fromDate}&end_date=${toDate}`;
        } else if (dates?.start_date && dates?.end_date) {
            query += `${query ? '&' : '?'}start_date=${dates.start_date}&end_date=${dates.end_date}`;
        }
        dispatch(getAllRegisterReportDetailsAction({ query: query || undefined }));
    }, [dates, userData, fromDate, toDate]);

    const handleClearFilters = () => {
        setUserData({});
        setFromDate('');
        setToDate('');
        setStatusFilter('all');
        setSearchTerm('');
        dispatch(getAllRegisterReportDetailsAction({}));
    };

    // ── KPI Calculations ────────────────────────────────────────────────────
    const totalRegs = Array.isArray(registerReportDetails) ? registerReportDetails.length : 0;
    const openRegs = registerReportDetails?.filter(r => !r?.attributes?.closed_at)?.length || 0;

    const closedRegs = registerReportDetails?.filter(r => r?.attributes?.closed_at)?.length || 0;
    const totalCash = registerReportDetails?.reduce((acc, r) => acc + parseFloat(r?.attributes?.cash_in_hand || 0), 0) || 0;
    const totalClosing = registerReportDetails?.reduce((acc, r) => acc + parseFloat(r?.attributes?.cash_in_hand_while_closing || 0), 0) || 0;

    const kpis = [
        { label: 'Total Registers', value: totalRegs, color: '#16A34A', bg: '#DCFCE7', icon: faCashRegister },
        { label: 'Open Registers', value: openRegs, color: '#2563EB', bg: '#EFF6FF', icon: faStore },
        { label: 'Closed Registers', value: closedRegs, color: '#64748B', bg: '#F1F5F9', icon: faTimesCircle },
        { label: 'Suspended', value: 0, color: '#D97706', bg: '#FEF3C7', icon: faClock },
        { label: 'Total Opening Cash', value: `${currencySymbol} ${totalCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: '#16A34A', bg: '#F0FDF4', icon: faMoneyBillWave },
        { label: 'Total Closing Cash', value: `${currencySymbol} ${totalClosing.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: '#7C3AED', bg: '#F3E8FF', icon: faMoneyBillWave },
    ];

    const itemsValue = registerReportDetails?.length > 0 && registerReportDetails.map((r, i) => {
        const openedAt = r?.attributes?.created_at;
        const closedAt = r?.attributes?.closed_at;
        const duration = openedAt && closedAt
            ? `${moment(closedAt).diff(moment(openedAt), 'hours')}h ${moment(closedAt).diff(moment(openedAt), 'minutes') % 60}m`
            : openedAt ? 'Active' : '—';

        const opening = parseFloat(r?.attributes?.cash_in_hand || 0);
        const closing = parseFloat(r?.attributes?.cash_in_hand_while_closing || 0);
        const variance = closing - opening;
        const isOpen = !closedAt;

        return {
            id: r?.id || i + 1,
            register_no: `REG-${String(i + 1).padStart(3, '0')}`,
            cashier_name: `${r?.attributes?.user?.first_name || ''} ${r?.attributes?.user?.last_name || ''}`.trim() || 'Unknown',
            cashier_email: r?.attributes?.user?.email || '',
            cashier_image: r?.attributes?.user?.image_url,
            open_date: openedAt ? moment(openedAt).format('DD-MM-YYYY') : '—',
            open_time: openedAt ? moment(openedAt).format('hh:mm A') : '—',
            close_date: closedAt ? moment(closedAt).format('DD-MM-YYYY') : '—',
            close_time: closedAt ? moment(closedAt).format('hh:mm A') : '—',
            duration,
            opening_cash: currencySymbolHandling(allConfigData, r?.attributes?.cash_in_hand_while_closing ? frontSetting?.value?.currency_symbol : currencySymbol, opening),
            closing_cash: currencySymbolHandling(allConfigData, currencySymbol, closing),
            variance,
            variance_display: `${variance >= 0 ? '+' : ''}${currencySymbol} ${Math.abs(variance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
            variance_color: variance >= 0 ? '#16A34A' : '#DC2626',
            notes: r?.attributes?.notes || '—',
            isOpen,
        };
    });

    const columns = [
        {
            name: 'REGISTER',
            cell: row => (
                <div style={{ fontWeight: 800, color: '#16A34A', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>{row.register_no}</div>
            ),
            width: '90px',
        },
        {
            name: 'CASHIER',
            cell: row => (
                <div className="d-flex align-items-center gap-2">
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#16A34A', fontSize: 11, flexShrink: 0 }}>
                        {row.cashier_name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 12, color: '#0F172A' }}>{row.cashier_name}</div>
                        <div style={{ fontSize: 10, color: '#94A3B8' }}>{row.cashier_email}</div>
                    </div>
                </div>
            ),
            minWidth: '160px',
        },
        {
            name: 'OPENED',
            cell: row => (
                <div>
                    <div style={{ fontWeight: 700, fontSize: 11 }}>{row.open_date}</div>
                    <div style={{ fontSize: 10, color: '#64748B' }}>{row.open_time}</div>
                </div>
            ),
            width: '110px',
        },
        {
            name: 'CLOSED',
            cell: row => row.isOpen ? (
                <span className="reg-badge-success">Active</span>
            ) : (
                <div>
                    <div style={{ fontWeight: 700, fontSize: 11 }}>{row.close_date}</div>
                    <div style={{ fontSize: 10, color: '#64748B' }}>{row.close_time}</div>
                </div>
            ),
            width: '110px',
        },
        {
            name: 'DURATION',
            selector: row => row.duration,
            cell: row => <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>{row.duration}</span>,
            width: '90px',
        },
        {
            name: 'OPENING CASH',
            cell: row => <span style={{ fontWeight: 800, color: '#0F172A', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{row.opening_cash}</span>,
            width: '130px',
        },
        {
            name: 'CLOSING CASH',
            cell: row => <span style={{ fontWeight: 800, color: '#16A34A', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{row.closing_cash}</span>,
            width: '130px',
        },
        {
            name: 'VARIANCE',
            cell: row => (
                <span style={{ fontWeight: 900, color: row.variance_color, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, background: row.variance_color + '12', padding: '2px 8px', borderRadius: 6 }}>
                    {row.variance_display}
                </span>
            ),
            width: '120px',
        },
        {
            name: 'STATUS',
            cell: row => row.isOpen
                ? <span className="reg-badge-success"><FontAwesomeIcon icon={faCheckCircle} /> Open</span>
                : <span style={{ fontSize: 11, fontWeight: 700, background: '#F1F5F9', color: '#475569', padding: '2px 10px', borderRadius: 20 }}>Closed</span>,
            width: '90px',
        },
        {
            name: 'NOTES',
            cell: row => <span style={{ fontSize: 11, color: '#64748B' }}>{row.notes?.length > 20 ? row.notes.substring(0, 19) + '…' : row.notes}</span>,
            minWidth: '120px',
        },
    ];

    const onChange = (filter) => {
        setTableFilter(filter);
        let query = '';
        if (userData?.value) query += `?user_id=${userData.value}`;
        dispatch(getAllRegisterReportDetailsAction({ filter, query: query || undefined }));
    };

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title="Register History" />
            <div className="reg-mgmt-container">
                {/* Breadcrumb */}
                <div style={{ fontSize: 12, color: '#64748B', marginBottom: 8, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Link to="/app/dashboard" style={{ color: '#64748B', textDecoration: 'none' }}>Dashboard</Link>
                    <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 9 }} />
                    <span>Reports</span>
                    <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 9 }} />
                    <span style={{ color: '#0F172A', fontWeight: 700 }}>Register History</span>
                </div>

                {/* Header */}
                <div className="reg-mgmt-header">
                    <div>
                        <h1 className="reg-mgmt-title">
                            <FontAwesomeIcon icon={faCashRegister} className="text-success" />
                            Register History
                        </h1>
                        <p className="reg-mgmt-sub">Complete audit trail of all POS register sessions — openings, closings, cash variances, and cashier activity</p>
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

                {/* 6 KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 20 }}>
                    {kpis.map((k, i) => (
                        <div key={i} className="reg-kpi-card">
                            <div className="d-flex align-items-center justify-content-between mb-2">
                                <span className="reg-kpi-lbl">{k.label}</span>
                                <div style={{ width: 28, height: 28, borderRadius: 8, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: k.color }}>
                                    <FontAwesomeIcon icon={k.icon} style={{ fontSize: 12 }} />
                                </div>
                            </div>
                            <div className="reg-kpi-val" style={{ color: k.color }}>{k.value}</div>
                        </div>
                    ))}
                </div>

                {/* Filter Toolbar */}
                <div className="reg-card" style={{ padding: '14px 20px' }}>
                    <div className="d-flex align-items-end gap-3 flex-wrap">
                        <div>
                            <label className="form-label fw-bold" style={{ fontSize: 11, color: '#64748B' }}>FROM DATE</label>
                            <input type="date" className="form-control form-control-sm" style={{ borderRadius: 8, fontSize: 13 }} value={fromDate} onChange={e => setFromDate(e.target.value)} />
                        </div>
                        <div>
                            <label className="form-label fw-bold" style={{ fontSize: 11, color: '#64748B' }}>TO DATE</label>
                            <input type="date" className="form-control form-control-sm" style={{ borderRadius: 8, fontSize: 13 }} value={toDate} onChange={e => setToDate(e.target.value)} />
                        </div>
                        <div style={{ minWidth: 200 }}>
                            <label className="form-label fw-bold" style={{ fontSize: 11, color: '#64748B' }}>CASHIER</label>
                            <ReactSelect
                                multiLanguageOption={usersOptions}
                                onChange={setUserData}
                                defaultValue={usersType[0]}
                                title=""
                                errors=""
                                placeholder="All Cashiers"
                            />
                        </div>
                        <div>
                            <label className="form-label fw-bold" style={{ fontSize: 11, color: '#64748B' }}>STATUS</label>
                            <select className="form-select form-select-sm" style={{ borderRadius: 8, fontSize: 13 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                <option value="all">All Status</option>
                                <option value="open">Open</option>
                                <option value="closed">Closed</option>
                                <option value="suspended">Suspended</option>
                            </select>
                        </div>
                        <button type="button" className="reg-btn reg-btn-outline" style={{ height: 34 }} onClick={handleClearFilters}>
                            <FontAwesomeIcon icon={faFilter} /> Clear
                        </button>
                    </div>
                </div>

                {/* Data Table */}
                <div className="reg-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div className="reg-card-title" style={{ margin: 0, fontSize: 13 }}>
                            <FontAwesomeIcon icon={faChartBar} className="text-primary" /> Register Sessions
                            <span style={{ marginLeft: 8, fontSize: 11, color: '#64748B', fontWeight: 600 }}>({totalRegs} records)</span>
                        </div>
                    </div>
                    <ReactDataTable
                        columns={columns}
                        items={itemsValue}
                        onChange={onChange}
                        isLoading={isLoading}
                        totalRows={totalRegs}

                        isShowSearch
                        isShowDateRangeField
                    />
                </div>
            </div>
        </MasterLayout>
    );
};

export default RegisterHistoryPage;
