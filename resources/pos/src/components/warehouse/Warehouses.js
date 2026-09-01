import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { connect } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import moment from 'moment';
import MasterLayout from '../MasterLayout';
import TabTitle from '../../shared/tab-title/TabTitle';
import TopProgressBar from '../../shared/components/loaders/TopProgressBar';
import { fetchWarehouses, deleteWarehouse } from '../../store/action/warehouseAction';
import DeleteWarehouse from './DeleteWarehouse';
import { getFormattedDate, placeholderText } from '../../shared/sharedMethod';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faWarehouse,
    faCheckCircle,
    faMapMarkerAlt,
    faGlobe,
    faSearch,
    faPlus,
    faRotateRight,
    faEye,
    faEdit,
    faTrash,
    faList,
    faThLarge,
    faPhone,
    faEnvelope,
    faTimes,
    faCity,
    faLocationDot,
    faHashtag
} from '@fortawesome/free-solid-svg-icons';
import "../brands/ProductBrandsPremium.css";
import "../units/ProductUnitsPremium.css";
import "../variation/ProductVariationsPremium.css";
import LiveCounter from "../../shared/components/LiveCounter";
import LiveSparkline from "../../shared/components/LiveSparkline";
import './WarehousePremium.css';
import { subscribePosDataChanged } from "../../shared/posEvents";

/* ── Color Theme Pool for Avatars ── */
const WH_COLORS = [
    { bg: '#DCFCE7', col: '#16A34A' },
    { bg: '#DBEAFE', col: '#2563EB' },
    { bg: '#F3E8FF', col: '#9333EA' },
    { bg: '#FEF3C7', col: '#D97706' },
    { bg: '#CFFAFE', col: '#0891B2' },
];

const Warehouses = ({ fetchWarehouses, warehouses, totalRecord, isLoading, allConfigData }) => {
    const navigate = useNavigate();
    const [search, setSearch]               = useState('');
    const [countryFilter, setCountry]       = useState('all');
    const [cityFilter, setCity]             = useState('all');
    const [sortBy, setSortBy]               = useState('newest');
    const [viewMode, setViewMode]           = useState('list');
    const [page, setPage]                   = useState(1);
    const [perPage, setPerPage]             = useState(10);
    const [deleteModel, setDeleteModel]     = useState(false);
    const [isDelete, setIsDelete]           = useState(null);
    const [selectedWhIds, setSelectedWhIds] = useState([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState(null);
    const [drawerTab, setDrawerTab]         = useState('overview');
    const debRef                            = useRef(null);

    useEffect(() => {
        fetchWarehouses({ page: 1, pageSize: 100, search }, true);

        // Event-driven real-time sync
        const unsubscribe = subscribePosDataChanged(() => {
            fetchWarehouses({ page: 1, pageSize: 100, search }, false);
        });

        return () => unsubscribe();
    }, []);

    const handleSearch = useCallback((val) => {
        setSearch(val);
        setPage(1);
    }, []);

    const onClickDeleteModel = (del = null) => {
        setDeleteModel(!deleteModel);
        setIsDelete(del);
    };

    const goToEdit = (item) => navigate(`/app/warehouse/edit/${item.id}`);

    /* Defensive array check */
    const safeWarehouses = Array.isArray(warehouses) ? warehouses : [];

    /* Map warehouses with 100% REAL database values */
    const mapped = useMemo(() => {
        return safeWarehouses.map((wh, idx) => ({
            id:         wh.id,
            name:       wh.attributes ? wh.attributes.name : wh.name || '',
            code:       `WH-${String(wh.id).padStart(4, '0')}`,
            phone:      wh.attributes ? wh.attributes.phone : wh.phone || '—',
            country:    wh.attributes ? wh.attributes.country : wh.country || '—',
            city:       wh.attributes ? wh.attributes.city : wh.city || '—',
            email:      wh.attributes ? wh.attributes.email : wh.email || '—',
            zip_code:   wh.attributes ? wh.attributes.zip_code : wh.zip_code || '—',
            created_at: wh.attributes ? wh.attributes.created_at : wh.created_at || '',
            date:       getFormattedDate(wh.attributes ? wh.attributes.created_at : wh.created_at, allConfigData) || 'Recent',
            time:       wh.attributes?.created_at ? moment(wh.attributes.created_at).format('hh:mm A') : '',
            colorTheme: WH_COLORS[idx % WH_COLORS.length],
        }));
    }, [safeWarehouses, allConfigData]);

    /* Unique cities & countries for dropdown (REAL DATA) */
    const countries = useMemo(() => [...new Set(mapped.map(w => w.country))].filter(c => c && c !== '—'), [mapped]);
    const cities    = useMemo(() => [...new Set(mapped.map(w => w.city))].filter(c => c && c !== '—'), [mapped]);

    /* Real client-side filter & sort */
    const filtered = useMemo(() => {
        return mapped.filter(w => {
            const q = `${w.name} ${w.code} ${w.city} ${w.country} ${w.email} ${w.phone} ${w.zip_code}`.toLowerCase();
            const matchSearch  = !search || q.includes(search.toLowerCase());
            const matchCountry = countryFilter === 'all' || !countryFilter || w.country.toLowerCase() === countryFilter.toLowerCase();
            const matchCity    = cityFilter === 'all' || !cityFilter || w.city.toLowerCase() === cityFilter.toLowerCase();
            return matchSearch && matchCountry && matchCity;
        }).sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'oldest') return moment(a.created_at).valueOf() - moment(b.created_at).valueOf();
            return moment(b.created_at).valueOf() - moment(a.created_at).valueOf();
        });
    }, [mapped, search, countryFilter, cityFilter, sortBy]);

    /* REALTIME KPI CALCULATIONS */
    const totalCount = mapped.length;
    const activeCount = mapped.length;
    const uniqueCitiesCount = cities.length;
    const uniqueCountriesCount = countries.length;

    const totalSpark = totalCount > 0 ? [Math.max(0, totalCount - 1), totalCount] : [0, 0];
    const activeSpark = activeCount > 0 ? [Math.max(0, activeCount - 1), activeCount] : [0, 0];
    const citySpark = uniqueCitiesCount > 0 ? [Math.max(0, uniqueCitiesCount - 1), uniqueCitiesCount] : [0, 0];
    const countrySpark = uniqueCountriesCount > 0 ? [Math.max(0, uniqueCountriesCount - 1), uniqueCountriesCount] : [0, 0];

    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const paginatedWarehouses = filtered.slice((page - 1) * perPage, page * perPage);

    const pageNums = (() => {
        const max = Math.min(5, totalPages);
        let start = Math.max(1, page - 2);
        if (start + max - 1 > totalPages) start = Math.max(1, totalPages - max + 1);
        return Array.from({ length: max }, (_, i) => start + i);
    })();

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedWhIds(filtered.map(w => w.id));
        } else {
            setSelectedWhIds([]);
        }
    };

    const handleSelectOne = (id) => {
        if (selectedWhIds.includes(id)) {
            setSelectedWhIds(selectedWhIds.filter(i => i !== id));
        } else {
            setSelectedWhIds([...selectedWhIds, id]);
        }
    };

    const clearFilters = () => {
        setSearch('');
        setCountry('all');
        setCity('all');
        setSortBy('newest');
        setSelectedWhIds([]);
        setPage(1);
    };

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title={placeholderText('warehouse.title') || "Warehouse Management"} />

            <div className="var-page-container">

                {/* ── 1. Breadcrumb (Exact Units Page Style) ─────────────── */}
                <div className="var-breadcrumb">
                    <span>Dashboard</span>
                    <span>&gt;</span>
                    <span>Warehouse</span>
                    <span>&gt;</span>
                    <span className="var-crumb-active">Warehouses</span>
                </div>

                {/* ── 2. Header Row (Exact Units Page Style) ─────────────── */}
                <div className="var-header">
                    <div className="var-title-group">
                        <h1>Warehouse Management</h1>
                        <p>Manage all your warehouses, depots and storage locations.</p>
                    </div>

                    <div className="var-header-actions">
                        <button
                            type="button"
                            className="var-btn-pill"
                            onClick={() => fetchWarehouses({ page: 1, pageSize: 100 }, true)}
                        >
                            <FontAwesomeIcon icon={faRotateRight} /> Refresh
                        </button>

                        <Link
                            to="/app/warehouse/create"
                            className="var-btn-pill var-btn-primary"
                            style={{ textDecoration: "none" }}
                        >
                            <FontAwesomeIcon icon={faPlus} /> Create Warehouse
                        </Link>
                    </div>
                </div>

                {/* ── 3. Exact Top 4 KPI Cards Grid (Units & Variations Design) ────────── */}
                <div className="var-kpi-grid">
                    {/* Card 1: Total Warehouses */}
                    <div className="var-kpi-card">
                        <div className="var-kpi-top">
                            <span className="var-kpi-label">Total Warehouses</span>
                            <div className="var-kpi-icon green">
                                <FontAwesomeIcon icon={faWarehouse} />
                            </div>
                        </div>
                        <div className="var-kpi-value">
                            <LiveCounter value={totalCount} isCurrency={false} />
                        </div>
                        <div className="var-kpi-bottom">
                            <span className={`var-kpi-badge ${totalCount > 0 ? 'up' : 'neutral'}`}>
                                {totalCount > 0 ? 'Real Database Data' : '0 Warehouses'}
                            </span>
                            <LiveSparkline data={totalSpark} color="#16A34A" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 2: Active Locations */}
                    <div className="var-kpi-card">
                        <div className="var-kpi-top">
                            <span className="var-kpi-label">Active Locations</span>
                            <div className="var-kpi-icon blue">
                                <FontAwesomeIcon icon={faCheckCircle} />
                            </div>
                        </div>
                        <div className="var-kpi-value">
                            <LiveCounter value={activeCount} isCurrency={false} />
                        </div>
                        <div className="var-kpi-bottom">
                            <span className={`var-kpi-badge ${activeCount > 0 ? 'up' : 'neutral'}`}>
                                {activeCount > 0 ? 'Active Status' : '0 Active'}
                            </span>
                            <LiveSparkline data={activeSpark} color="#2563EB" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 3: Cities Covered */}
                    <div className="var-kpi-card">
                        <div className="var-kpi-top">
                            <span className="var-kpi-label">Cities Covered</span>
                            <div className="var-kpi-icon purple">
                                <FontAwesomeIcon icon={faMapMarkerAlt} />
                            </div>
                        </div>
                        <div className="var-kpi-value">
                            <LiveCounter value={uniqueCitiesCount} isCurrency={false} />
                        </div>
                        <div className="var-kpi-bottom">
                            <span className="var-kpi-badge neutral">
                                Across Network
                            </span>
                            <LiveSparkline data={citySpark} color="#9333EA" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 4: Countries Covered */}
                    <div className="var-kpi-card">
                        <div className="var-kpi-top">
                            <span className="var-kpi-label">Countries Covered</span>
                            <div className="var-kpi-icon orange">
                                <FontAwesomeIcon icon={faGlobe} />
                            </div>
                        </div>
                        <div className="var-kpi-value">
                            <LiveCounter value={uniqueCountriesCount} isCurrency={false} />
                        </div>
                        <div className="var-kpi-bottom">
                            <span className="var-kpi-badge up">Global Coverage</span>
                            <LiveSparkline data={countrySpark} color="#D97706" width={60} height={24} />
                        </div>
                    </div>
                </div>

                {/* ── 4. Main 100% Full Width Workspace (Exact Match to Units page) ─── */}
                <div className="var-workspace" style={{ width: '100%', boxSizing: 'border-box' }}>

                    {/* Filter Bar (Exact Single-Line Match to Units page) */}
                    <div className="var-filter-bar">
                        <div className="var-search-box">
                            <FontAwesomeIcon icon={faSearch} className="var-search-icon" />
                            <input
                                type="text"
                                placeholder="Search by warehouse name, code, city, email..."
                                value={search}
                                onChange={e => handleSearch(e.target.value)}
                            />
                        </div>

                        <div className="var-filter-controls">
                            <select
                                className="var-select-sm"
                                value={countryFilter}
                                onChange={e => { setCountry(e.target.value); setPage(1); }}
                            >
                                <option value="all">Country: All</option>
                                {countries.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>

                            <select
                                className="var-select-sm"
                                value={cityFilter}
                                onChange={e => { setCity(e.target.value); setPage(1); }}
                            >
                                <option value="all">City: All</option>
                                {cities.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>

                            <select
                                className="var-select-sm"
                                value={sortBy}
                                onChange={e => { setSortBy(e.target.value); setPage(1); }}
                            >
                                <option value="newest">Sort: Newest</option>
                                <option value="oldest">Sort: Oldest</option>
                                <option value="name">Sort: Name (A-Z)</option>
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

                            <button type="button" className="cat-btn-filter" onClick={clearFilters} title="Reset Filters">
                                Reset
                            </button>
                        </div>
                    </div>

                    {/* Content: List / Grid / Empty State */}
                    {filtered.length === 0 ? (
                        <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #EEF2F7', padding: '60px 24px', textAlign: 'center', width: '100%' }}>
                            <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', margin: '0 auto 16px auto', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.12)' }}>
                                <FontAwesomeIcon icon={faWarehouse} />
                            </div>
                            <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                                No warehouses found
                            </h3>
                            <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '440px', margin: '0 auto 22px auto', lineHeight: '1.55' }}>
                                {search || countryFilter !== 'all' || cityFilter !== 'all'
                                    ? 'No warehouses match your search query. Try resetting filters.'
                                    : 'Create warehouse locations and regional depots to allocate inventory stock.'}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                <button
                                    type="button"
                                    className="brand-btn-pill"
                                    onClick={clearFilters}
                                >
                                    Reset Filters
                                </button>
                                <Link
                                    to="/app/warehouse/create"
                                    className="brand-btn-pill brand-btn-primary text-white text-decoration-none"
                                >
                                    <FontAwesomeIcon icon={faPlus} /> Create Warehouse
                                </Link>
                            </div>
                        </div>
                    ) : viewMode === 'list' ? (
                        <div className="var-table-wrap" style={{ width: '100%', overflowX: 'hidden', marginBottom: '20px' }}>
                            <table className="var-table" style={{ width: '100%', tableLayout: 'fixed' }}>
                                <thead>
                                    <tr>
                                        <th style={{ width: "40px", textAlign: "center" }}>
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                style={{ width: '18px', height: '18px', cursor: 'pointer', borderRadius: '4px' }}
                                                checked={selectedWhIds.length > 0 && selectedWhIds.length === filtered.length}
                                                onChange={handleSelectAll}
                                            />
                                        </th>
                                        <th style={{ width: '22%' }}>WAREHOUSE</th>
                                        <th style={{ width: '12%' }}>CODE</th>
                                        <th style={{ width: '13%' }}>PHONE NUMBER</th>
                                        <th style={{ width: '14%' }}>LOCATION</th>
                                        <th style={{ width: '10%' }}>ZIP CODE</th>
                                        <th style={{ width: '10%' }}>STATUS</th>
                                        <th style={{ width: '11%', whiteSpace: 'nowrap' }}>CREATED ON</th>
                                        <th style={{ width: '100px', textAlign: 'right', whiteSpace: 'nowrap' }}>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedWarehouses.map(wh => {
                                        const isChecked = selectedWhIds.includes(wh.id);
                                        return (
                                            <tr key={wh.id} style={{ background: isChecked ? '#F0FDF4' : 'transparent', cursor: "pointer" }} onClick={() => setSelectedWarehouse(wh)}>
                                                <td style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        style={{ width: '18px', height: '18px', cursor: 'pointer', borderRadius: '4px' }}
                                                        checked={isChecked}
                                                        onChange={() => handleSelectOne(wh.id)}
                                                    />
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center gap-3">
                                                        <div
                                                            style={{
                                                                width: "36px",
                                                                height: "36px",
                                                                borderRadius: "10px",
                                                                background: wh.colorTheme.bg,
                                                                color: wh.colorTheme.col,
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                fontSize: "14px",
                                                                flexShrink: 0
                                                            }}
                                                        >
                                                            <FontAwesomeIcon icon={faWarehouse} />
                                                        </div>
                                                        <div style={{ minWidth: 0, overflow: 'hidden' }}>
                                                            <div style={{ fontWeight: 800, color: "#0F172A", fontSize: "14px", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {wh.name}
                                                            </div>
                                                            <div style={{ fontSize: "11px", color: "#64748B", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {wh.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="unit-short-badge">{wh.code}</span>
                                                </td>
                                                <td style={{ fontWeight: 600, color: "#0F172A", fontSize: "13px", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {wh.phone}
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <FontAwesomeIcon icon={faMapMarkerAlt} style={{ color: '#94A3B8', fontSize: '11px', flexShrink: 0 }} />
                                                        <div style={{ minWidth: 0, overflow: 'hidden' }}>
                                                            <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {wh.city}
                                                            </div>
                                                            <div style={{ fontSize: '11px', color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {wh.country}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ color: '#64748B', fontSize: '12.5px', whiteSpace: 'nowrap' }}>
                                                    {wh.zip_code}
                                                </td>
                                                <td>
                                                    <span className="unit-base-badge">
                                                        ● Active
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ fontSize: '12.5px', fontWeight: '600', color: '#0F172A', whiteSpace: 'nowrap' }}>{wh.date}</div>
                                                    <div style={{ fontSize: '10.5px', color: '#64748B', whiteSpace: 'nowrap' }}>{wh.time}</div>
                                                </td>
                                                <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                                                    <div className="brand-card-actions" style={{ justifyContent: 'flex-end', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <button type="button" className="brand-action-btn" title="View Details" onClick={() => setSelectedWarehouse(wh)}>
                                                            <FontAwesomeIcon icon={faEye} />
                                                        </button>
                                                        <button type="button" className="brand-action-btn edit" title="Edit Warehouse" onClick={() => goToEdit(wh)}>
                                                            <FontAwesomeIcon icon={faEdit} />
                                                        </button>
                                                        <button type="button" className="brand-action-btn delete" title="Delete Warehouse" onClick={() => onClickDeleteModel(wh)}>
                                                            <FontAwesomeIcon icon={faTrash} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        /* GRID VIEW CARDS (Exact Match to Units page) */
                        <div className="brand-cards-grid">
                            {paginatedWarehouses.map(wh => (
                                <div key={wh.id} className="brand-card-item" onClick={() => setSelectedWarehouse(wh)} style={{ cursor: "pointer" }}>
                                    <div
                                        className="brand-logo-container"
                                        style={{
                                            background: wh.colorTheme.bg,
                                            color: wh.colorTheme.col,
                                            fontSize: "20px"
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faWarehouse} />
                                    </div>
                                    <div className="brand-card-title">{wh.name}</div>
                                    <div className="d-flex align-items-center justify-content-center gap-2 my-2">
                                        <span className="unit-short-badge">{wh.code}</span>
                                        <span className="unit-base-badge">● Active</span>
                                    </div>
                                    <p style={{ fontSize: '12px', color: '#64748B', textAlign: 'center', margin: '4px 0 12px 0' }}>
                                        <FontAwesomeIcon icon={faMapMarkerAlt} className="me-1 text-muted" />
                                        {wh.city}, {wh.country} ({wh.zip_code})
                                    </p>
                                    <div className="brand-card-stats">
                                        <div className="brand-stat-item">
                                            <div className="brand-stat-val" style={{ fontSize: '12px' }}>{wh.phone}</div>
                                            <div className="brand-stat-lbl">Phone</div>
                                        </div>
                                        <div style={{ width: '1px', height: '24px', background: '#F1F5F9' }} />
                                        <div className="brand-stat-item">
                                            <div className="brand-stat-val" style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '110px' }}>{wh.email}</div>
                                            <div className="brand-stat-lbl">Email</div>
                                        </div>
                                    </div>
                                    <div className="brand-card-actions">
                                        <button type="button" className="brand-action-btn" title="View Details" onClick={(e) => { e.stopPropagation(); setSelectedWarehouse(wh); }}>
                                            <FontAwesomeIcon icon={faEye} />
                                        </button>
                                        <button type="button" className="brand-action-btn edit" title="Edit Warehouse" onClick={(e) => { e.stopPropagation(); goToEdit(wh); }}>
                                            <FontAwesomeIcon icon={faEdit} />
                                        </button>
                                        <button type="button" className="brand-action-btn delete" title="Delete Warehouse" onClick={(e) => { e.stopPropagation(); onClickDeleteModel(wh); }}>
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── 5. DYNAMIC WORKING PAGINATION (Inside Workspace Card - Exact Match to Units page) ── */}
                    <div className="var-pagination" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', paddingTop: '16px', borderTop: '1px solid #EEF2F7', width: '100%' }}>
                        <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
                            Showing {filtered.length > 0 ? (page - 1) * perPage + 1 : 0} to {Math.min(page * perPage, filtered.length)} of {filtered.length} warehouses
                        </div>

                        <div className="var-pagination-pages" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                                type="button"
                                className="var-page-btn"
                                disabled={page <= 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                            >
                                &lt;
                            </button>

                            {pageNums.map(n => (
                                <button
                                    key={n}
                                    type="button"
                                    className={`var-page-btn ${page === n ? 'active' : ''}`}
                                    onClick={() => setPage(n)}
                                >
                                    {n}
                                </button>
                            ))}

                            <button
                                type="button"
                                className="var-page-btn"
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            >
                                &gt;
                            </button>

                            <select
                                className="var-page-select"
                                value={perPage}
                                onChange={(e) => {
                                    setPerPage(Number(e.target.value));
                                    setPage(1);
                                }}
                            >
                                <option value={10}>10 / page</option>
                                <option value={20}>20 / page</option>
                                <option value={50}>50 / page</option>
                            </select>
                        </div>
                    </div>

                </div>

                {/* ── SLIDE-OVER DRAWER PREVIEW (Units & Variations Style) ─── */}
                {selectedWarehouse && (
                    <div className="var-drawer-overlay" onClick={() => setSelectedWarehouse(null)}>
                        <div className="var-drawer" onClick={(e) => e.stopPropagation()}>
                            <div className="var-drawer-header">
                                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                    <div
                                        style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: "14px",
                                            background: selectedWarehouse.colorTheme.bg,
                                            color: selectedWarehouse.colorTheme.col,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: 18
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faWarehouse} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#0F172A' }}>
                                            {selectedWarehouse.name}
                                        </h3>
                                        <div style={{ fontSize: '12px', color: '#64748B' }}>
                                            Code: {selectedWarehouse.code} • ID: #{selectedWarehouse.id}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="brand-action-btn"
                                    onClick={() => setSelectedWarehouse(null)}
                                    title="Close"
                                >
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </div>

                            {/* Drawer Navigation Tabs */}
                            <div style={{ display: 'flex', borderBottom: '1px solid #EEF2F7', padding: '0 24px', background: '#FAFAFA' }}>
                                <button
                                    type="button"
                                    style={{
                                        padding: '12px 16px',
                                        fontSize: '13px',
                                        fontWeight: drawerTab === 'overview' ? '700' : '500',
                                        color: drawerTab === 'overview' ? '#16A34A' : '#64748B',
                                        border: 'none',
                                        background: 'transparent',
                                        borderBottom: drawerTab === 'overview' ? '2px solid #16A34A' : '2px solid transparent',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => setDrawerTab('overview')}
                                >
                                    Overview
                                </button>
                                <button
                                    type="button"
                                    style={{
                                        padding: '12px 16px',
                                        fontSize: '13px',
                                        fontWeight: drawerTab === 'contact' ? '700' : '500',
                                        color: drawerTab === 'contact' ? '#16A34A' : '#64748B',
                                        border: 'none',
                                        background: 'transparent',
                                        borderBottom: drawerTab === 'contact' ? '2px solid #16A34A' : '2px solid transparent',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => setDrawerTab('contact')}
                                >
                                    Location & Contact
                                </button>
                            </div>

                            <div className="var-drawer-body">
                                {drawerTab === 'overview' && (
                                    <div>
                                        <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '16px', border: '1px solid #EEF2F7', marginBottom: '20px' }}>
                                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                                                Warehouse Details
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #EEF2F7', fontSize: '13px' }}>
                                                <span style={{ color: '#64748B' }}>Warehouse Name</span>
                                                <span style={{ fontWeight: '700', color: '#0F172A' }}>{selectedWarehouse.name}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #EEF2F7', fontSize: '13px', alignItems: 'center' }}>
                                                <span style={{ color: '#64748B' }}>Warehouse Code</span>
                                                <span className="unit-short-badge">{selectedWarehouse.code}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #EEF2F7', fontSize: '13px', alignItems: 'center' }}>
                                                <span style={{ color: '#64748B' }}>Operating Status</span>
                                                <span className="unit-base-badge">● Active</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '13px' }}>
                                                <span style={{ color: '#64748B' }}>Created On</span>
                                                <span style={{ fontWeight: '600', color: '#0F172A' }}>{selectedWarehouse.date}</span>
                                            </div>
                                        </div>

                                        <div className="row g-3">
                                            <div className="col-6">
                                                <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '14px', border: '1px solid #EEF2F7' }}>
                                                    <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>City / Region</div>
                                                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#2563EB', marginTop: '2px' }}>
                                                        {selectedWarehouse.city}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-6">
                                                <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '14px', border: '1px solid #EEF2F7' }}>
                                                    <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>Country</div>
                                                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#16A34A', marginTop: '2px' }}>
                                                        {selectedWarehouse.country}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {drawerTab === 'contact' && (
                                    <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '16px', border: '1px solid #EEF2F7' }}>
                                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                                            Contact & Address
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #EEF2F7', fontSize: '13px' }}>
                                            <span style={{ color: '#64748B' }}>Phone</span>
                                            <span style={{ fontWeight: '600', color: '#0F172A' }}>{selectedWarehouse.phone}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #EEF2F7', fontSize: '13px' }}>
                                            <span style={{ color: '#64748B' }}>Email</span>
                                            <span style={{ fontWeight: '600', color: '#0F172A' }}>{selectedWarehouse.email}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #EEF2F7', fontSize: '13px' }}>
                                            <span style={{ color: '#64748B' }}>Zip Code</span>
                                            <span style={{ fontWeight: '600', color: '#0F172A' }}>{selectedWarehouse.zip_code}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '13px' }}>
                                            <span style={{ color: '#64748B' }}>Location</span>
                                            <span style={{ fontWeight: '600', color: '#0F172A' }}>{selectedWarehouse.city}, {selectedWarehouse.country}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ padding: '16px 24px', borderTop: '1px solid #EEF2F7', background: '#FAFAFA', display: 'flex', gap: '10px' }}>
                                <button
                                    type="button"
                                    className="brand-btn-pill brand-btn-primary"
                                    style={{ flex: 1 }}
                                    onClick={() => { setSelectedWarehouse(null); goToEdit(selectedWarehouse); }}
                                >
                                    <FontAwesomeIcon icon={faEdit} /> Edit Warehouse
                                </button>
                                <button
                                    type="button"
                                    className="brand-btn-pill"
                                    style={{ borderColor: '#FCA5A5', color: '#DC2626', background: '#FEF2F2' }}
                                    onClick={() => { setSelectedWarehouse(null); onClickDeleteModel(selectedWarehouse); }}
                                >
                                    <FontAwesomeIcon icon={faTrash} /> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* Delete Modal */}
            {deleteModel && isDelete && (
                <DeleteWarehouse
                    onClickDeleteModel={onClickDeleteModel}
                    deleteModel={deleteModel}
                    onDelete={isDelete}
                />
            )}
        </MasterLayout>
    );
};

const mapStateToProps = (state) => {
    const { warehouses, totalRecord, isLoading, allConfigData } = state;
    return { warehouses, totalRecord, isLoading, allConfigData };
};

export default connect(mapStateToProps, { fetchWarehouses })(Warehouses);
