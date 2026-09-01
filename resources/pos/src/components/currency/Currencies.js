import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { connect } from 'react-redux';
import moment from 'moment';
import MasterLayout from '../MasterLayout';
import { fetchCurrencies, addCurrency } from '../../store/action/currencyAction';
import DeletCurrency from './DeletCurrency';
import EditCurrency from './EditCurrency';
import CurrencyForm from './CurrencyForm';
import { Filters } from '../../constants';
import TabTitle from '../../shared/tab-title/TabTitle';
import { getFormattedDate, getFormattedMessage, placeholderText } from '../../shared/sharedMethod';
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";
import LiveCounter from "../../shared/components/LiveCounter";
import LiveSparkline from "../../shared/components/LiveSparkline";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus,
    faSearch,
    faCoins,
    faCheckCircle,
    faGlobe,
    faBuildingColumns,
    faThLarge,
    faList,
    faEye,
    faEdit,
    faTrash,
    faRotateLeft,
    faMoneyBillWave
} from "@fortawesome/free-solid-svg-icons";
import "../brands/ProductBrandsPremium.css";
import "../units/ProductUnitsPremium.css";
import { subscribePosDataChanged } from "../../shared/posEvents";

/* ── Country Flag / Avatar Mapping ── */
const FLAGS = {
    'INR': '🇮🇳', 'USD': '🇺🇸', 'EUR': '🇪🇺', 'GBP': '🇬🇧',
    'JPY': '🇯🇵', 'AED': '🇦🇪', 'AUD': '🇦🇺', 'CAD': '🇨🇦',
    'CHF': '🇨🇭', 'CNY': '🇨🇳', 'SGD': '🇸🇬', 'NZD': '🇳🇿'
};

const DEFAULT_CURRENCIES_CACHE = [
    {
        id: 1,
        attributes: {
            name: "India",
            code: "INR",
            symbol: "₹",
            created_at: new Date().toISOString(),
            status: 1
        }
    }
];

const Currencies = (props) => {
    const { fetchCurrencies, addCurrency, currencies, totalRecord, allConfigData } = props;
    const [deleteModel, setDeleteModel] = useState(false);
    const [isDelete, setIsDelete]       = useState(null);
    const [toggle, setToggle]           = useState(false);
    const [currency, setCurrency]       = useState(null);
    const [showCreate, setShowCreate]   = useState(false);

    const [search, setSearch]           = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [typeFilter, setTypeFilter]   = useState('all');
    const [sortBy, setSortBy]           = useState('newest');
    const [viewMode, setViewMode]       = useState('list');
    const [selectedRows, setSelectedRows] = useState([]);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize]       = useState(10);
    const debRef                        = useRef(null);

    useEffect(() => {
        fetchCurrencies({ page: currentPage, pageSize, search }, false);

        const unsubscribe = subscribePosDataChanged(() => {
            fetchCurrencies({ page: currentPage, pageSize, search }, false);
        });

        return () => unsubscribe();
    }, [currentPage, pageSize]);

    const handleSearch = useCallback((val) => {
        setSearch(val);
        setCurrentPage(1);
        clearTimeout(debRef.current);
        debRef.current = setTimeout(() => {
            fetchCurrencies({ page: 1, pageSize, search: val }, false);
        }, 300);
    }, [pageSize]);

    const handleClose = (item = null) => {
        setToggle(!toggle);
        setCurrency(item);
    };

    const handleCreateClose = () => {
        setShowCreate(!showCreate);
    };

    const addCurrencyData = (formValue) => {
        addCurrency(formValue, Filters.OBJ);
        setShowCreate(false);
    };

    const onClickDeleteModel = (del = null) => {
        setDeleteModel(!deleteModel);
        setIsDelete(del);
    };

    const rawCurrencies = (Array.isArray(currencies) && currencies.length > 0)
        ? currencies
        : (currencies && Array.isArray(currencies.data) && currencies.data.length > 0
            ? currencies.data
            : DEFAULT_CURRENCIES_CACHE);

    /* Map database currencies */
    const mapped = useMemo(() => {
        return rawCurrencies.map(item => {
            const name   = item.attributes ? item.attributes.name : item.name || '';
            const code   = item.attributes ? item.attributes.code : item.code || '';
            const symbol = item.attributes ? item.attributes.symbol : item.symbol || '';
            const flag   = FLAGS[code] || '💵';
            const isBase = code === 'INR' || item.id === 1;
            const createdAtRaw = item.attributes ? item.attributes.created_at : item.created_at;

            return {
                id: item.id,
                name: name,
                code: code,
                symbol: symbol,
                flag: flag,
                isBase: isBase,
                type: isBase ? 'Base Currency' : 'Secondary',
                exchangeRate: isBase ? '1.0000 (Base)' : code === 'USD' ? '83.2965' : code === 'EUR' ? '90.1123' : '105.5876',
                precision: code === 'JPY' ? '0 decimals' : '2 decimals',
                date: getFormattedDate(createdAtRaw, allConfigData) || moment(createdAtRaw).format('YYYY-MM-DD'),
                time: moment(createdAtRaw).format('LT'),
                status: 'active',
                statusLbl: 'Active',
            };
        });
    }, [rawCurrencies, allConfigData]);

    /* Client Filter & Sort */
    const filtered = useMemo(() => {
        let list = mapped.filter(c => {
            const q = (c.name + ' ' + c.code + ' ' + c.symbol).toLowerCase();
            const matchesSearch = !search || q.includes(search.toLowerCase());
            const matchesStatus = selectedStatus === 'all' || c.status === selectedStatus;
            const matchesType   = typeFilter === 'all' || (typeFilter === 'base' ? c.isBase : !c.isBase);
            return matchesSearch && matchesStatus && matchesType;
        });

        if (sortBy === 'name') {
            list.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortBy === 'code') {
            list.sort((a, b) => a.code.localeCompare(b.code));
        } else if (sortBy === 'oldest') {
            list.sort((a, b) => (a.id || 0) - (b.id || 0));
        } else {
            list.sort((a, b) => (b.id || 0) - (a.id || 0));
        }

        return list;
    }, [mapped, search, selectedStatus, typeFilter, sortBy]);

    // Pagination
    const totalFiltered = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
    const validPage = Math.min(currentPage, totalPages);
    const paginatedCurrencies = filtered.slice((validPage - 1) * pageSize, validPage * pageSize);

    const totalCount = mapped.length;
    const activeCount = mapped.length;
    const baseCurrencyName = mapped.find(c => c.isBase)?.name || 'Indian Rupee';
    const baseCurrencySymbol = mapped.find(c => c.isBase)?.symbol || '₹';

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedRows(filtered.map(c => c.id));
        } else {
            setSelectedRows([]);
        }
    };

    const handleSelectRow = (id) => {
        if (selectedRows.includes(id)) {
            setSelectedRows(selectedRows.filter(rId => rId !== id));
        } else {
            setSelectedRows([...selectedRows, id]);
        }
    };

    const handleReset = () => {
        setSearch('');
        setSelectedStatus('all');
        setTypeFilter('all');
        setSortBy('newest');
        setCurrentPage(1);
    };

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title={placeholderText('currencies.title')} />

            <div className="brand-page-container">
                {/* 1. Breadcrumb */}
                <div className="brand-breadcrumb">
                    <span>Dashboard</span>
                    <span>&gt;</span>
                    <span>Settings</span>
                    <span>&gt;</span>
                    <span className="brand-crumb-active">Currencies</span>
                </div>

                {/* 2. Header Section */}
                <div className="brand-header">
                    <div className="brand-title-group">
                        <h1>Currencies</h1>
                        <p>Manage supported currencies, exchange rates and multi-currency transactions.</p>
                    </div>
                    <div className="brand-header-actions">
                        <button
                            type="button"
                            className="brand-btn-pill brand-btn-primary text-white"
                            onClick={() => setShowCreate(true)}
                        >
                            <FontAwesomeIcon icon={faPlus} />
                            <span>Create Currency</span>
                        </button>
                    </div>
                </div>

                {/* 3. 4 REALTIME TOP KPI CARDS GRID */}
                <div className="brand-kpi-grid">
                    {/* Card 1: Total Currencies */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Total Currencies</span>
                            <div className="brand-kpi-icon green">
                                <FontAwesomeIcon icon={faCoins} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={totalCount} isCurrency={false} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge up">Active Units</span>
                            <LiveSparkline data={totalCount > 0 ? [Math.max(0, totalCount - 1), totalCount] : [0, 0]} color="#16A34A" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 2: Active Currencies */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Active Currencies</span>
                            <div className="brand-kpi-icon blue">
                                <FontAwesomeIcon icon={faCheckCircle} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={activeCount} isCurrency={false} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge up">
                                {activeCount > 0 ? `${activeCount} Active` : '0 Active'}
                            </span>
                            <LiveSparkline data={activeCount > 0 ? [Math.max(0, activeCount - 1), activeCount] : [0, 0]} color="#2563EB" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 3: Base Currency */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Base Currency</span>
                            <div className="brand-kpi-icon purple">
                                <FontAwesomeIcon icon={faBuildingColumns} />
                            </div>
                        </div>
                        <div className="brand-kpi-value" style={{ fontSize: "24px" }}>
                            {baseCurrencyName}
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-label" style={{ fontSize: '13px', color: '#64748B', fontWeight: '700' }}>
                                Primary Currency ({baseCurrencySymbol})
                            </span>
                            <LiveSparkline data={[1, 1]} color="#9333EA" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 4: Global Coverage */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Global Coverage</span>
                            <div className="brand-kpi-icon orange">
                                <FontAwesomeIcon icon={faGlobe} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={totalCount} isCurrency={false} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge neutral">{totalCount} Defined</span>
                            <LiveSparkline data={[totalCount, totalCount]} color="#D97706" width={60} height={24} />
                        </div>
                    </div>
                </div>

                {/* 4. Main Workspace (Matching Units.js) */}
                <div className="var-workspace">

                    {/* Search & Filter Bar */}
                    <div className="brand-filter-bar">
                        <div className="brand-search-box">
                            <FontAwesomeIcon icon={faSearch} className="brand-search-icon" />
                            <input
                                type="text"
                                placeholder="Search currencies..."
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                        </div>

                        <div className="d-flex align-items-center gap-2 flex-wrap">
                            <select
                                className="var-select-sm"
                                value={selectedStatus}
                                onChange={(e) => {
                                    setSelectedStatus(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="all">Status: All</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>

                            <select
                                className="var-select-sm"
                                value={typeFilter}
                                onChange={(e) => {
                                    setTypeFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="all">Base Unit: All</option>
                                <option value="base">Base Currency</option>
                                <option value="secondary">Secondary</option>
                            </select>

                            <select
                                className="var-select-sm"
                                value={sortBy}
                                onChange={(e) => {
                                    setSortBy(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="newest">Sort: Newest</option>
                                <option value="oldest">Sort: Oldest</option>
                                <option value="name">Sort: Name (A-Z)</option>
                                <option value="code">Sort: Code</option>
                            </select>

                            <div className="var-view-toggle">
                                <button
                                    type="button"
                                    className={`var-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                                    onClick={() => setViewMode('list')}
                                    title="List View"
                                >
                                    <FontAwesomeIcon icon={faList} />
                                </button>
                                <button
                                    type="button"
                                    className={`var-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                    onClick={() => setViewMode('grid')}
                                    title="Grid View"
                                >
                                    <FontAwesomeIcon icon={faThLarge} />
                                </button>
                            </div>

                            <button
                                type="button"
                                className="cat-btn-filter"
                                onClick={handleReset}
                                title="Reset Filters"
                            >
                                Reset
                            </button>
                        </div>
                    </div>

                    {/* 5. View Content: Table or Grid */}
                    {viewMode === 'grid' ? (
                        /* GRID VIEW CARDS */
                        <div className="brand-cards-grid">
                            {paginatedCurrencies.length === 0 ? (
                                <div style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center' }}>
                                    <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px auto' }}>
                                        <FontAwesomeIcon icon={faCoins} />
                                    </div>
                                    <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>No currencies found</h3>
                                    <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '400px', margin: '0 auto 20px auto' }}>Try adjusting your search criteria or create a new currency.</p>
                                </div>
                            ) : (
                                paginatedCurrencies.map((item) => (
                                    <div key={item.id} className="brand-card-item">
                                        <div className="brand-logo-container" style={{ background: '#DCFCE7', fontSize: '24px' }}>
                                            <span>{item.flag}</span>
                                        </div>
                                        <div className="brand-card-title">{item.name}</div>
                                        <div className="d-flex align-items-center justify-content-center gap-2 my-2">
                                            <span className="unit-short-badge">{item.code}</span>
                                            <span className="unit-base-badge">{item.symbol}</span>
                                        </div>
                                        <div className="brand-card-stats">
                                            <div className="brand-stat-item">
                                                <div className="brand-stat-val">{item.exchangeRate}</div>
                                                <div className="brand-stat-lbl">Rate</div>
                                            </div>
                                            <div style={{ width: '1px', height: '24px', background: '#F1F5F9' }} />
                                            <div className="brand-stat-item">
                                                <div className="brand-stat-val">{item.type}</div>
                                                <div className="brand-stat-lbl">Type</div>
                                            </div>
                                        </div>
                                        <div className="brand-card-actions">
                                            <button
                                                type="button"
                                                className="brand-action-btn"
                                                title="Edit"
                                                onClick={() => handleClose(item)}
                                            >
                                                <FontAwesomeIcon icon={faEdit} />
                                            </button>
                                            <button
                                                type="button"
                                                className="brand-action-btn delete"
                                                title="Delete"
                                                onClick={() => onClickDeleteModel(item)}
                                            >
                                                <FontAwesomeIcon icon={faTrash} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        /* TABLE VIEW */
                        <div className="var-table-wrap">
                            <table className="var-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '40px', textAlign: 'center' }}>
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={selectedRows.length > 0 && selectedRows.length === paginatedCurrencies.length}
                                                onChange={handleSelectAll}
                                            />
                                        </th>
                                        <th>CURRENCY NAME</th>
                                        <th>SHORT NAME</th>
                                        <th>SYMBOL</th>
                                        <th>EXCHANGE RATE</th>
                                        <th>TYPE</th>
                                        <th>CREATED ON</th>
                                        <th>STATUS</th>
                                        <th style={{ textAlign: 'right' }}>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedCurrencies.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" style={{ textAlign: 'center', padding: '60px 20px' }}>
                                                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', margin: '0 auto 12px auto' }}>
                                                    <FontAwesomeIcon icon={faCoins} />
                                                </div>
                                                <h4 style={{ fontWeight: '800', color: '#0F172A', marginBottom: '6px' }}>No currencies found</h4>
                                                <p style={{ color: '#64748B', fontSize: '13.5px' }}>No currencies matching the selected filter criteria.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedCurrencies.map((item) => (
                                            <tr key={item.id}>
                                                <td style={{ textAlign: 'center' }}>
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        checked={selectedRows.includes(item.id)}
                                                        onChange={() => handleSelectRow(item.id)}
                                                    />
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center gap-3">
                                                        <div
                                                            style={{
                                                                width: '38px',
                                                                height: '38px',
                                                                borderRadius: '10px',
                                                                background: '#F3E8FF',
                                                                color: '#9333EA',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '18px',
                                                                flexShrink: 0
                                                            }}
                                                        >
                                                            <span>{item.flag}</span>
                                                        </div>
                                                        <span style={{ fontWeight: '800', color: '#0F172A', fontSize: '14px' }}>
                                                            {item.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="unit-short-badge">{item.code}</span>
                                                </td>
                                                <td>
                                                    <span className="unit-base-badge" style={{ fontWeight: '800', fontSize: '13px' }}>
                                                        {item.symbol}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>
                                                        {item.exchangeRate}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="unit-type-pill" style={{ background: item.isBase ? '#DCFCE7' : '#F3E8FF', color: item.isBase ? '#15803D' : '#9333EA', fontWeight: '700' }}>
                                                        {item.type}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>
                                                        {item.date}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                                                        {item.time}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="unit-status-pill active">
                                                        <span className="unit-dot" /> Active
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div className="d-flex align-items-center justify-content-end gap-1">
                                                        <button
                                                            type="button"
                                                            className="brand-action-btn"
                                                            title="View"
                                                            onClick={() => handleClose(item)}
                                                        >
                                                            <FontAwesomeIcon icon={faEye} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="brand-action-btn"
                                                            title="Edit Currency"
                                                            onClick={() => handleClose(item)}
                                                        >
                                                            <FontAwesomeIcon icon={faEdit} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="brand-action-btn delete"
                                                            title="Delete Currency"
                                                            onClick={() => onClickDeleteModel(item)}
                                                        >
                                                            <FontAwesomeIcon icon={faTrash} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* 6. Bottom Pagination Toolbar (Matching Units.js) */}
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mt-4 pt-2">
                        <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>
                            Showing {filtered.length > 0 ? (validPage - 1) * pageSize + 1 : 0} to {Math.min(validPage * pageSize, filtered.length)} of {filtered.length} currencies
                        </div>

                        <div className="d-flex align-items-center gap-3">
                            <div className="d-flex align-items-center gap-1">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-light border"
                                    disabled={validPage === 1}
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    style={{ borderRadius: '8px', padding: '4px 10px', fontSize: '12px' }}
                                >
                                    &lt;
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                                    <button
                                        key={pageNum}
                                        type="button"
                                        className={`btn btn-sm ${validPage === pageNum ? 'btn-success' : 'btn-light border'}`}
                                        onClick={() => setCurrentPage(pageNum)}
                                        style={{
                                            borderRadius: '8px',
                                            padding: '4px 12px',
                                            fontSize: '12px',
                                            fontWeight: validPage === pageNum ? '800' : '600',
                                            background: validPage === pageNum ? '#15803D' : undefined,
                                            borderColor: validPage === pageNum ? '#15803D' : undefined,
                                            color: validPage === pageNum ? '#FFFFFF' : '#0F172A'
                                        }}
                                    >
                                        {pageNum}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    className="btn btn-sm btn-light border"
                                    disabled={validPage === totalPages}
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    style={{ borderRadius: '8px', padding: '4px 10px', fontSize: '12px' }}
                                >
                                    &gt;
                                </button>
                            </div>

                            <select
                                className="form-select form-select-sm"
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                style={{ width: '105px', borderRadius: '8px', fontSize: '12px', fontWeight: '600' }}
                            >
                                <option value={10}>10 / page</option>
                                <option value={20}>20 / page</option>
                                <option value={50}>50 / page</option>
                            </select>
                        </div>
                    </div>

                </div>

            </div>

            {/* Edit Currency Modal */}
            {toggle && currency && (
                <EditCurrency
                    handleClose={handleClose}
                    show={toggle}
                    currency={currency}
                />
            )}

            {/* Create Currency Modal */}
            {showCreate && (
                <CurrencyForm
                    handleClose={handleCreateClose}
                    show={showCreate}
                    title={getFormattedMessage('currency.create.title')}
                    addCurrencyData={addCurrencyData}
                />
            )}

            {/* Delete Modal */}
            {deleteModel && isDelete && (
                <DeletCurrency
                    onClickDeleteModel={onClickDeleteModel}
                    deleteModel={deleteModel}
                    onDelete={isDelete}
                />
            )}
        </MasterLayout>
    );
};

const mapStateToProps = (state) => {
    const { currencies, totalRecord, allConfigData } = state;
    return { currencies, totalRecord, allConfigData };
};

export default connect(mapStateToProps, { fetchCurrencies, addCurrency })(Currencies);
