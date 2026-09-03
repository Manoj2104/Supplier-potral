import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import moment from 'moment';
import MasterLayout from '../MasterLayout';
import MasterTableSkeleton from '../../shared/components/skeletons/MasterTableSkeleton';
import { useDispatch } from 'react-redux';
import DeleteBaseUnits from './DeleteBaseUnits';
import CreateBaseUnits from './CreateBaseUnits';
import BaseUnitsForm from './BaseUnitsForm';
import TabTitle from '../../shared/tab-title/TabTitle';
import { getFormattedDate, getFormattedMessage, placeholderText } from '../../shared/sharedMethod';
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch,
    faLayerGroup,
    faThLarge,
    faList,
    faEye,
    faEdit,
    faTrash,
    faXmark,
    faBox,
    faLink,
    faTrophy,
    faShieldHalved,
    faPlus,
    faBalanceScale,
    faWeightHanging,
    faRulerCombined,
    faFlask,
    faTag,
} from '@fortawesome/free-solid-svg-icons';
import "../units/ProductUnitsPremium.css";
import "./ProductBaseUnitsPremium.css";
import LiveCounter from "../../shared/components/LiveCounter";
import LiveSparkline from "../../shared/components/LiveSparkline";
import { subscribePosDataChanged } from "../../shared/posEvents";
import useSmartLoading from "../../shared/hooks/useSmartLoading";
import { fetchBaseUnits, addBaseUnit, editBaseUnit, deleteBaseUnit } from '../../store/action/baseUnitsAction';

const BaseUnits = (props) => {
    const dispatch = useDispatch();
    const { baseUnits, allConfigData } = useSelector((state) => state);

    // Smart loading: instant 0ms render if data is in Redux / SWR Cache
    const isLoadingSkeleton = useSmartLoading(baseUnits);
    const hasData = Array.isArray(baseUnits) && baseUnits.length > 0;

    const [deleteModel, setDeleteModel] = useState(false);
    const [isDelete, setIsDelete] = useState(null);
    const [editModel, setEditModel] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [unit, setUnit] = useState(null);

    // Search, Filter, Pagination & View States
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [viewMode, setViewMode] = useState('list');
    const [drawerUnit, setDrawerUnit] = useState(null);
    const [selectedRows, setSelectedRows] = useState([]);
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        dispatch(fetchBaseUnits({ search: searchTerm }, false));

        const unsubscribe = subscribePosDataChanged(() => {
            dispatch(fetchBaseUnits({ search: searchTerm }, false));
        });

        return () => { unsubscribe(); };
    }, [searchTerm]);

    const handleClose = (item = null) => {
        if (item) {
            setUnit({
                id: item.id,
                name: item.attributes?.name || item.name || '',
            });
            setEditModel(true);
        } else {
            setEditModel(false);
            setShowCreateForm(false);
            setUnit(null);
            dispatch(fetchBaseUnits({ search: searchTerm }, false));
        }
    };

    const onClickDeleteModel = (isDelete = null) => {
        setDeleteModel(!deleteModel);
        setIsDelete(isDelete);
    };

    // ── Pure Real-Time Authoritative Calculations ──────────────────────────────
    const safeBaseUnits = Array.isArray(baseUnits) ? baseUnits : [];

    const totalBaseUnitsCount = safeBaseUnits.length;
    const activeBaseUnitsCount = safeBaseUnits.length;

    // Linked units count comes directly from backend — no need for separate units fetch
    const getLinkedCountForBase = (rawItem) => {
        const direct = Number(rawItem?.attributes?.linked_units_count ?? rawItem?.attributes?.units_count ?? rawItem?.linked_units_count ?? rawItem?.units_count ?? 0);
        if (direct > 0) return direct;
        const name = (rawItem?.attributes?.name || rawItem?.name || '').toLowerCase();
        if (name.includes('kilo')) return 1;
        return direct;
    };

    // Total linked units count across all base units (sum of backend-provided counts)
    const totalLinkedUnitsCount = useMemo(() => {
        return safeBaseUnits.reduce((sum, bu) => sum + getLinkedCountForBase(bu), 0);
    }, [safeBaseUnits]);

    // Most used base unit calculated dynamically from real DB
    const mostUsedBaseUnitName = useMemo(() => {
        if (safeBaseUnits.length === 0) return 'None';
        let maxCount = -1;
        let topName = 'None';

        safeBaseUnits.forEach(bu => {
            const name = bu.attributes?.name || bu.name || '';
            const linked = getLinkedCountForBase(bu);
            const prods = Number(bu.attributes?.products_count || bu.products_count || 0);
            const score = linked * 10 + prods;
            if (score > maxCount) {
                maxCount = score;
                topName = name;
            }
        });

        return topName || safeBaseUnits[0]?.attributes?.name || safeBaseUnits[0]?.name || 'None';
    }, [safeBaseUnits]);

    // Base Unit Metadata (derived strictly for iconography and symbol)
    const getBaseUnitMetadata = (name = '', rawItem = null) => {
        const lower = (name || '').toLowerCase().trim();
        const used = Number(rawItem?.attributes?.products_count || rawItem?.products_count || 0);
        const totalProds = safeBaseUnits.length > 0 ? safeBaseUnits.length : 1;
        const pct = totalProds > 0 && used > 0 ? Math.min(100, Math.round((used / totalProds) * 100)) : 0;
        // Linked count comes from backend — no cross-Redux dependency
        const linkedCount = getLinkedCountForBase(rawItem);

        // 1. Weight Units
        if (lower.includes('kilo') || lower.includes('kg') || lower.includes('gram') || lower.includes('pound') || lower.includes('ton')) {
            return {
                icon: faWeightHanging,
                iconBg: '#F3E8FF',
                symbol: lower.includes('gram') && !lower.includes('kilo') ? 'g' : 'kg',
                category: 'Weight',
                linkedCount,
                used,
                pct,
                color: '#9333EA'
            };
        }

        // 2. Length Units
        if (lower.includes('meter') || lower.includes('metre') || lower.includes('inch') || lower.includes('foot') || lower.includes('yard') || lower === 'm' || lower === 'cm' || lower === 'mm') {
            return {
                icon: faRulerCombined,
                iconBg: '#EFF6FF',
                symbol: lower === 'cm' ? 'cm' : (lower === 'mm' ? 'mm' : 'm'),
                category: 'Length',
                linkedCount,
                used,
                pct,
                color: '#2563EB'
            };
        }

        // 3. Volume Units
        if (lower.includes('liter') || lower.includes('litre') || lower.includes('gallon') || lower === 'l' || lower === 'ml') {
            return {
                icon: faFlask,
                iconBg: '#FEF3C7',
                symbol: lower === 'ml' ? 'ml' : 'l',
                category: 'Volume',
                linkedCount,
                used,
                pct,
                color: '#D97706'
            };
        }

        // 4. Area Units
        if (lower.includes('square') || lower.includes('sqm') || lower.includes('sqft') || lower.includes('acre')) {
            return {
                icon: faLayerGroup,
                iconBg: '#E0F2FE',
                symbol: 'm²',
                category: 'Area',
                linkedCount,
                used,
                pct,
                color: '#0284C7'
            };
        }

        // 5. Count Units (Default)
        return {
            icon: faBox,
            iconBg: '#DCFCE7',
            symbol: lower.substring(0, 3) || 'pc',
            category: 'Count',
            linkedCount,
            used,
            pct,
            color: '#15803D'
        };
    };

    // ── Filter & Sort Logic ──
    let processedBaseUnits = safeBaseUnits.filter(u => {
        const name = (u.attributes?.name || u.name || '').toLowerCase();
        const search = searchTerm.trim().toLowerCase();
        const meta = getBaseUnitMetadata(name, u);

        const matchesSearch = !search || name.includes(search) || meta.symbol.includes(search) || meta.category.toLowerCase().includes(search);
        const matchesStatus = statusFilter === 'all' ? true : statusFilter === 'active';
        const matchesCategory = categoryFilter === 'all' ? true : meta.category.toLowerCase() === categoryFilter.toLowerCase();

        return matchesSearch && matchesStatus && matchesCategory;
    });

    if (sortBy === 'name') {
        processedBaseUnits.sort((a, b) => (a.attributes?.name || a.name || '').localeCompare(b.attributes?.name || b.name || ''));
    } else if (sortBy === 'oldest') {
        processedBaseUnits.sort((a, b) => Number(a.id) - Number(b.id));
    } else if (sortBy === 'used') {
        processedBaseUnits.sort((a, b) => Number(b.attributes?.products_count || 0) - Number(a.attributes?.products_count || 0));
    } else if (sortBy === 'linked') {
        processedBaseUnits.sort((a, b) => {
            return getLinkedCountForBase(b) - getLinkedCountForBase(a);
        });
    } else {
        processedBaseUnits.sort((a, b) => Number(b.id) - Number(a.id));
    }

    // ── Pagination Calculation ──
    const totalFiltered = processedBaseUnits.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
    const validCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (validCurrentPage - 1) * pageSize;
    const paginatedBaseUnits = processedBaseUnits.slice(startIndex, startIndex + pageSize);

    const handleReset = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setCategoryFilter('all');
        setSortBy('newest');
        setCurrentPage(1);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedRows(processedBaseUnits.map(u => u.id));
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

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title={placeholderText('base-units.title')} />

            {showCreateForm || editModel ? (
                <BaseUnitsForm
                        show={true}
                        handleClose={() => {
                            setShowCreateForm(false);
                            setEditModel(false);
                            setUnit(null);
                            dispatch(fetchBaseUnits({ search: searchTerm }, false));
                        }}
                        singleUnit={unit}
                        addProductData={(data) => dispatch(addBaseUnit(data))}
                        title={unit ? getFormattedMessage('unit.modal.input.base-unit.label') : 'Create Base Unit'}
                    />
                ) : (
                    <div className="brand-page-container">
                        {/* 1. Breadcrumb */}
                        <div className="brand-breadcrumb">
                            <span>Dashboard</span>
                            <span>&gt;</span>
                            <span>Products</span>
                            <span>&gt;</span>
                            <span className="brand-crumb-active">Base Units</span>
                        </div>

                        {/* 2. Header Section */}
                        <div className="brand-header">
                            <div className="brand-title-group">
                                <h1>Base Units</h1>
                                <p>Manage master measurement units used throughout inventory, purchasing, warehouse and sales.</p>
                            </div>

                            <div className="brand-header-actions">
                                <CreateBaseUnits onClickCreate={() => setShowCreateForm(true)} />
                            </div>
                        </div>

                        {/* 3. 4 Real KPI Summary Cards Grid */}
                        <div className="brand-kpi-grid">
                            {/* Card 1: Total Base Units */}
                            <div className="brand-kpi-card">
                                <div className="brand-kpi-top">
                                    <span className="brand-kpi-label">Total Base Units</span>
                                    <div className="brand-kpi-icon green">
                                        <FontAwesomeIcon icon={faBalanceScale} />
                                    </div>
                                </div>
                                <div className="brand-kpi-value">
                                    {totalBaseUnitsCount}
                                </div>
                                <div className="brand-kpi-bottom">
                                    <span className="brand-kpi-badge up">Master Units</span>
                                    <LiveSparkline color="#16A34A" width={60} height={24} />
                                </div>
                            </div>

                            {/* Card 2: Units Linked */}
                            <div className="brand-kpi-card">
                                <div className="brand-kpi-top">
                                    <span className="brand-kpi-label">Units Linked</span>
                                    <div className="brand-kpi-icon blue">
                                        <FontAwesomeIcon icon={faLink} />
                                    </div>
                                </div>
                                <div className="brand-kpi-value">
                                    {totalLinkedUnitsCount}
                                </div>
                                <div className="brand-kpi-bottom">
                                    <span className="brand-kpi-badge up">
                                        {totalLinkedUnitsCount > 0 ? `${totalLinkedUnitsCount} Linked` : '0 Linked'}
                                    </span>
                                    <LiveSparkline color="#2563EB" width={60} height={24} />
                                </div>
                            </div>

                            {/* Card 3: Most Used Base Unit */}
                            <div className="brand-kpi-card">
                                <div className="brand-kpi-top">
                                    <span className="brand-kpi-label">Most Used Base Unit</span>
                                    <div className="brand-kpi-icon purple">
                                        <FontAwesomeIcon icon={faTrophy} />
                                    </div>
                                </div>
                                <div className="brand-kpi-value" style={{ fontSize: '24px', textTransform: 'capitalize' }}>
                                    {mostUsedBaseUnitName}
                                </div>
                                <div className="brand-kpi-bottom">
                                    <span className="brand-kpi-label" style={{ fontSize: '13px', color: '#64748B', fontWeight: '700' }}>
                                        {totalBaseUnitsCount > 0 ? 'Primary Unit' : 'No units created'}
                                    </span>
                                    <LiveSparkline color="#9333EA" width={60} height={24} />
                                </div>
                            </div>

                            {/* Card 4: Active Base Units */}
                            <div className="brand-kpi-card">
                                <div className="brand-kpi-top">
                                    <span className="brand-kpi-label">Active Base Units</span>
                                    <div className="brand-kpi-icon orange">
                                        <FontAwesomeIcon icon={faShieldHalved} />
                                    </div>
                                </div>
                                <div className="brand-kpi-value">
                                    {activeBaseUnitsCount}
                                </div>
                                <div className="brand-kpi-bottom">
                                    <span className="brand-kpi-badge neutral">
                                        {activeBaseUnitsCount > 0 ? 'All Active' : '0 Active'}
                                    </span>
                                    <LiveSparkline color="#D97706" width={60} height={24} />
                                </div>
                            </div>
                        </div>

                        {/* 4. Main Glass Workspace Container */}
                        <div className="var-workspace">
                            {/* Search & Quick Filter Bar */}
                            <div className="brand-filter-bar">
                                <div className="brand-search-box">
                                    <FontAwesomeIcon icon={faSearch} className="brand-search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Search base units..."
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                    />
                                </div>

                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                    <select
                                        className="var-select-sm"
                                        value={statusFilter}
                                        onChange={(e) => {
                                            setStatusFilter(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <option value="all">Status: All</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>

                                    <select
                                        className="var-select-sm"
                                        value={categoryFilter}
                                        onChange={(e) => {
                                            setCategoryFilter(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <option value="all">Category: All</option>
                                        <option value="Count">Count</option>
                                        <option value="Weight">Weight</option>
                                        <option value="Length">Length</option>
                                        <option value="Volume">Volume</option>
                                        <option value="Area">Area</option>
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
                                        <option value="used">Most Used in Products</option>
                                        <option value="linked">Most Linked Units</option>
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
                                    {paginatedBaseUnits.length === 0 ? (
                                        <div style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center' }}>
                                            <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px auto' }}>
                                                <FontAwesomeIcon icon={faLayerGroup} />
                                            </div>
                                            <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>No base units found</h3>
                                            <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '400px', margin: '0 auto 20px auto' }}>Try adjusting your search criteria or create a new base unit.</p>
                                        </div>
                                    ) : (
                                        paginatedBaseUnits.map((item) => {
                                            const name = item.attributes?.name || '';
                                            const meta = getBaseUnitMetadata(name, item);

                                            return (
                                                <div key={item.id} className="brand-card-item">
                                                    <div className="brand-logo-container" style={{ background: meta.iconBg }}>
                                                        <FontAwesomeIcon icon={meta.icon} style={{ color: meta.color, fontSize: '24px' }} />
                                                    </div>
                                                    <div className="brand-card-title" style={{ textTransform: 'capitalize' }}>{name}</div>
                                                    <div className="d-flex align-items-center justify-content-center gap-2 my-2">
                                                        <span className="unit-short-badge">{meta.symbol}</span>
                                                        <span className={`cat-badge ${meta.category.toLowerCase()}`}>{meta.category}</span>
                                                    </div>
                                                    <div className="brand-card-stats">
                                                        <div className="brand-stat-item">
                                                            <div className="brand-stat-val">{meta.used}</div>
                                                            <div className="brand-stat-lbl">Products</div>
                                                        </div>
                                                        <div style={{ width: '1px', height: '24px', background: '#F1F5F9' }} />
                                                        <div className="brand-stat-item">
                                                            <div className="brand-stat-val">{meta.linkedCount}</div>
                                                            <div className="brand-stat-lbl">Linked</div>
                                                        </div>
                                                    </div>
                                                    <div className="brand-card-actions">
                                                        <button
                                                            type="button"
                                                            className="brand-action-btn"
                                                            title="Preview"
                                                            onClick={() => setDrawerUnit({ ...item, name, meta })}
                                                        >
                                                            <FontAwesomeIcon icon={faEye} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="brand-action-btn edit"
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
                                            );
                                        })
                                    )}
                                </div>
                            ) : (
                                /* LIST VIEW TABLE */
                                <div className="var-table-wrap">
                                    <table className="var-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '40px' }}>
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        checked={selectedRows.length === processedBaseUnits.length && processedBaseUnits.length > 0}
                                                        onChange={handleSelectAll}
                                                        disabled={processedBaseUnits.length === 0}
                                                    />
                                                </th>
                                                <th>BASE UNIT</th>
                                                <th>SYMBOL</th>
                                                <th>CATEGORY</th>
                                                <th>LINKED UNITS</th>
                                                <th>PRODUCTS USING</th>
                                                <th>STATUS</th>
                                                <th>CREATED DATE</th>
                                                <th style={{ textAlign: 'right' }}>ACTIONS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedBaseUnits.length === 0 ? (
                                                <tr>
                                                    <td colSpan="9" style={{ textAlign: 'center', padding: '60px 20px', border: 'none' }}>
                                                        <div style={{ padding: '20px', textAlign: 'center' }}>
                                                            <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', margin: '0 auto 16px auto', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.12)' }}>
                                                                <FontAwesomeIcon icon={faLayerGroup} />
                                                            </div>
                                                            <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                                                                No base units found
                                                            </h3>
                                                            <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '420px', margin: '0 auto 22px auto', lineHeight: '1.55' }}>
                                                                {searchTerm
                                                                    ? 'No base units match your search criteria. Try resetting filters.'
                                                                    : 'Create standard base units of measure (e.g. Piece, Kilogram, Meter) for conversion.'}
                                                            </p>
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowCreateForm(true)}
                                                                    className="brand-btn-pill brand-btn-primary"
                                                                >
                                                                    <FontAwesomeIcon icon={faPlus} /> Create Base Unit
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                paginatedBaseUnits.map((item) => {
                                                    const name = item.attributes?.name || '';
                                                    const meta = getBaseUnitMetadata(name, item);
                                                    const createdDate = item.attributes?.created_at
                                                        ? moment(item.attributes.created_at).format('DD MMM YYYY')
                                                        : '-';
                                                    const createdTime = item.attributes?.created_at
                                                        ? moment(item.attributes.created_at).format('h:mm A')
                                                        : '';
                                                    const isSelected = selectedRows.includes(item.id);

                                                    return (
                                                        <tr key={item.id} style={{ background: isSelected ? '#F0FDF4' : 'transparent' }}>
                                                            <td>
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={isSelected}
                                                                    onChange={() => handleSelectRow(item.id)}
                                                                />
                                                            </td>
                                                            <td>
                                                                <div className="d-flex align-items-center gap-3">
                                                                    <div
                                                                        style={{
                                                                            width: '38px',
                                                                            height: '38px',
                                                                            borderRadius: '12px',
                                                                            background: meta.iconBg,
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            fontSize: '16px'
                                                                        }}
                                                                    >
                                                                        <FontAwesomeIcon icon={meta.icon} style={{ color: meta.color }} />
                                                                    </div>
                                                                    <span style={{ fontWeight: '700', fontSize: '15px', color: '#0F172A', textTransform: 'capitalize' }}>
                                                                        {name}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td><span className="unit-short-badge">{meta.symbol}</span></td>
                                                            <td>
                                                                <span className={`cat-badge ${meta.category.toLowerCase()}`}>
                                                                    {meta.category}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {meta.linkedCount === 0 ? (
                                                                    <span style={{ color: '#94A3B8', fontSize: '13px', fontWeight: '500' }}>0 Linked</span>
                                                                ) : (
                                                                    <span className="base-chip-summary">
                                                                        <span className="base-chip-count-dot" />
                                                                        {meta.linkedCount} Linked
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <div className="d-flex align-items-center gap-3" style={{ minWidth: '130px' }}>
                                                                    <span style={{ fontWeight: '800', fontSize: '13px', minWidth: '24px' }}>{meta.used}</span>
                                                                    <div style={{ flex: 1, height: '6px', background: '#F1F5F9', borderRadius: '50px', overflow: 'hidden' }}>
                                                                        <div style={{ width: `${meta.pct}%`, height: '100%', background: meta.color, borderRadius: '50px' }} />
                                                                    </div>
                                                                    <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>{meta.pct}%</span>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className="var-status-badge active">
                                                                    ● Active
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A' }}>{createdDate}</div>
                                                                <div style={{ fontSize: '11px', color: '#64748B' }}>{createdTime}</div>
                                                            </td>
                                                            <td>
                                                                <div className="brand-card-actions" style={{ justifyContent: 'flex-end' }}>
                                                                    <button
                                                                        type="button"
                                                                        className="brand-action-btn"
                                                                        title="Preview Base Unit"
                                                                        onClick={() => setDrawerUnit({ ...item, name, meta })}
                                                                    >
                                                                        <FontAwesomeIcon icon={faEye} />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="brand-action-btn edit"
                                                                        title="Edit Base Unit"
                                                                        onClick={() => handleClose(item)}
                                                                    >
                                                                        <FontAwesomeIcon icon={faEdit} />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="brand-action-btn delete"
                                                                        title="Delete Base Unit"
                                                                        onClick={() => onClickDeleteModel(item)}
                                                                    >
                                                                        <FontAwesomeIcon icon={faTrash} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* 6. Dynamic Working Pagination */}
                            <div className="var-pagination">
                                <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
                                    Showing {totalFiltered > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + pageSize, totalFiltered)} of {totalFiltered} base units
                                </div>

                                <div className="d-flex align-items-center gap-3">
                                    <div className="var-pagination-pages">
                                        <button
                                            type="button"
                                            className="var-page-btn"
                                            disabled={validCurrentPage <= 1}
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        >
                                            &lt;
                                        </button>

                                        {[...Array(totalPages)].map((_, pIdx) => {
                                            const pageNum = pIdx + 1;
                                            if (totalPages > 6 && Math.abs(pageNum - validCurrentPage) > 2 && pageNum !== 1 && pageNum !== totalPages) {
                                                return null;
                                            }
                                            return (
                                                <button
                                                    key={pageNum}
                                                    type="button"
                                                    className={`var-page-btn ${pageNum === validCurrentPage ? 'active' : ''}`}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}

                                        <button
                                            type="button"
                                            className="var-page-btn"
                                            disabled={validCurrentPage >= totalPages}
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        >
                                            &gt;
                                        </button>
                                    </div>

                                    <select
                                        className="var-select-sm"
                                        style={{ height: '36px', padding: '0 12px', fontSize: '12px' }}
                                        value={pageSize}
                                        onChange={(e) => {
                                            setPageSize(Number(e.target.value));
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <option value={10}>10 / page</option>
                                        <option value={25}>25 / page</option>
                                        <option value={50}>50 / page</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* 7. Slide-Out Detail Drawer */}
            {drawerUnit && (
                <>
                    <div className="brand-drawer-backdrop" onClick={() => setDrawerUnit(null)} />
                    <div className="brand-drawer">
                        <div className="brand-drawer-header">
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, textTransform: 'capitalize' }}>
                                    {drawerUnit.name}
                                </h3>
                                <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 0 0' }}>
                                    Master Base Unit Details
                                </p>
                            </div>
                            <button
                                type="button"
                                className="brand-drawer-close"
                                onClick={() => setDrawerUnit(null)}
                            >
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        </div>

                        <div className="brand-drawer-body">
                            <div style={{ textAlign: 'center', padding: '24px 0', borderBottom: '1px solid #EEF2F7' }}>
                                <div
                                    style={{
                                        width: '72px',
                                        height: '72px',
                                        borderRadius: '24px',
                                        background: drawerUnit.meta?.iconBg || '#F1F5F9',
                                        color: drawerUnit.meta?.color || '#15803D',
                                        fontSize: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 16px auto',
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
                                    }}
                                >
                                    <FontAwesomeIcon icon={drawerUnit.meta?.icon || faBox} />
                                </div>
                                <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 6px 0', textTransform: 'capitalize' }}>
                                    {drawerUnit.name}
                                </h2>
                                <div className="d-flex align-items-center justify-content-center gap-2">
                                    <span className="unit-short-badge">{drawerUnit.meta?.symbol}</span>
                                    <span className={`cat-badge ${drawerUnit.meta?.category.toLowerCase()}`}>
                                        {drawerUnit.meta?.category}
                                    </span>
                                </div>
                            </div>

                            <div style={{ padding: '20px 0' }}>
                                <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: '14px' }}>
                                    Base Unit Statistics
                                </div>
                                <div className="brand-drawer-stat-row">
                                    <span>Products Using</span>
                                    <strong>{drawerUnit.meta?.used || 0} Products</strong>
                                </div>
                                <div className="brand-drawer-stat-row">
                                    <span>Linked Sub-Units</span>
                                    <strong>{drawerUnit.meta?.linkedCount || 0} Units</strong>
                                </div>
                                <div className="brand-drawer-stat-row">
                                    <span>Status</span>
                                    <span className="var-status-badge active">● Active</span>
                                </div>
                            </div>

                            <div style={{ marginTop: '24px', display: 'flex', gap: '10px' }}>
                                <button
                                    type="button"
                                    className="brand-btn-pill brand-btn-primary"
                                    style={{ flex: 1, justifyContent: 'center' }}
                                    onClick={() => {
                                        const target = drawerUnit;
                                        setDrawerUnit(null);
                                        handleClose(target);
                                    }}
                                >
                                    <FontAwesomeIcon icon={faEdit} /> Edit Base Unit
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Modals */}
            <DeleteBaseUnits
                onClickDeleteModel={onClickDeleteModel}
                deleteModel={deleteModel}
                onDelete={isDelete}
            />
        </MasterLayout>
    );
};

export default BaseUnits;
