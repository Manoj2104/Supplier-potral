import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import moment from 'moment';
import MasterLayout from '../MasterLayout';
import MasterTableSkeleton from '../../shared/components/skeletons/MasterTableSkeleton';
import DeleteUnits from './DeleteUnits';
import CreateUnits from './CreateUnits';
import UnitsForm from './UnitsForm';
import TabTitle from '../../shared/tab-title/TabTitle';
import { getFormattedDate, getFormattedMessage, placeholderText } from '../../shared/sharedMethod';
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch,
    faThLarge,
    faList,
    faEye,
    faEdit,
    faTrash,
    faXmark,
    faTag,
    faBox,
    faTrophy,
    faRulerCombined,
    faWeightHanging,
    faFlask,
    faPlus,
    faLayerGroup,
    faBalanceScale,
} from '@fortawesome/free-solid-svg-icons';
import "./ProductUnitsPremium.css";
import { subscribePosDataChanged } from "../../shared/posEvents";
import LiveCounter from "../../shared/components/LiveCounter";
import LiveSparkline from "../../shared/components/LiveSparkline";
import useSmartLoading from "../../shared/hooks/useSmartLoading";
import { fetchUnits, addUnit, editUnit, deleteUnit } from '../../store/action/unitsAction';

const Units = (props) => {
    const dispatch = useDispatch();
    const { units, allConfigData } = useSelector((state) => state);

    // Smart loading: instant 0ms render if data is in Redux / SWR Cache
    const isLoadingSkeleton = useSmartLoading(units);
    const hasData = Array.isArray(units) && units.length > 0;

    const [deleteModel, setDeleteModel] = useState(false);
    const [isDelete, setIsDelete] = useState(null);
    const [editModel, setEditModel] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [unit, setUnit] = useState(null);

    // Search, Filter, Pagination & View States
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [baseUnitFilter, setBaseUnitFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [viewMode, setViewMode] = useState('list');
    const [drawerUnit, setDrawerUnit] = useState(null);
    const [selectedRows, setSelectedRows] = useState([]);
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        dispatch(fetchUnits({ search: searchTerm }, !hasData));

        const unsubscribe = subscribePosDataChanged(() => {
            dispatch(fetchUnits({ search: searchTerm }, false));
        });

        return () => {
            unsubscribe();
        };
    }, [searchTerm]);

    const handleClose = (item = null) => {
        if (item) {
            setUnit({
                id: item.id,
                name: item.attributes?.name || item.name || '',
                short_name: item.attributes?.short_name || item.short_name || '',
                base_unit: item.attributes?.base_unit_name?.name || item.base_unit || '',
            });
            setEditModel(true);
        } else {
            setEditModel(false);
            setShowCreateForm(false);
            setUnit(null);
            dispatch(fetchUnits({ search: searchTerm }, false));
        }
    };

    const onClickDeleteModel = (isDelete = null) => {
        setDeleteModel(!deleteModel);
        setIsDelete(isDelete);
    };
    const totalUnitsCount = units?.length || 0;

    // Unit Metadata Helper (icon, type, real used count from DB, % share)
    const getUnitMetadata = (name = '', shortName = '', rawItem = null) => {
        const lower = (name + ' ' + shortName).toLowerCase();
        const words = lower.split(/[\s,_\-]+/);
        const hasWord = (w) => words.includes(w);
        const used = Number(rawItem?.attributes?.products_count || rawItem?.products_count || 0);
        const totalProds = (units && units.length > 0) ? units.length : 1;
        const pct = totalProds > 0 && used > 0 ? Math.min(100, Math.round((used / totalProds) * 100)) : 0;

        if (lower.includes('kilogram') || lower.includes('gram') || lower.includes('weight') || hasWord('kg') || hasWord('gm') || hasWord('g') || hasWord('ton') || hasWord('tonne') || hasWord('lbs') || hasWord('lb')) {
            return { icon: faWeightHanging, iconBg: '#F3E8FF', type: 'Weight', used, pct, color: '#9333EA' };
        }
        if (lower.includes('meter') || lower.includes('metre') || lower.includes('length') || hasWord('m') || hasWord('cm') || hasWord('mm') || hasWord('km') || hasWord('ft') || hasWord('inch') || hasWord('in') || hasWord('yard')) {
            return { icon: faRulerCombined, iconBg: '#EFF6FF', type: 'Length', used, pct, color: '#2563EB' };
        }
        if (lower.includes('litre') || lower.includes('liter') || lower.includes('volume') || hasWord('l') || hasWord('ml') || hasWord('ltr') || hasWord('gal') || hasWord('gallon')) {
            return { icon: faFlask, iconBg: '#FEF3C7', type: 'Volume', used, pct, color: '#D97706' };
        }
        if (lower.includes('square') || lower.includes('area') || hasWord('sqft') || hasWord('sqm') || hasWord('acre')) {
            return { icon: faLayerGroup, iconBg: '#E0F2FE', type: 'Area', used, pct, color: '#0284C7' };
        }
        if (lower.includes('piece') || lower.includes('count') || lower.includes('dozen') || lower.includes('box') || lower.includes('packet') || lower.includes('pack') || hasWord('pc') || hasWord('pcs') || hasWord('dz') || hasWord('box') || hasWord('pkt')) {
            return { icon: faBox, iconBg: '#DCFCE7', type: 'Count', used, pct, color: '#15803D' };
        }

        return { icon: faTag, iconBg: '#F1F5F9', type: 'Count', used, pct, color: '#475569' };
    };

    // Extract dynamic unique Base Units list
    const baseUnitsList = Array.from(
        new Set(
            (units || [])
                .map(u => u.attributes?.base_unit_name?.name || u.attributes?.base_unit)
                .filter(Boolean)
        )
    );
    const uniqueBaseUnitsCount = baseUnitsList.length > 0 ? baseUnitsList.length : (totalUnitsCount > 0 ? 1 : 0);

    // Find most used unit
    const mostUsedUnitName = units && units.length > 0
        ? (units[0]?.attributes?.name || 'Piece')
        : 'None';

    // ── Filter & Sort Logic ──
    let processedUnits = (units || []).filter(u => {
        const name = (u.attributes?.name || u.name || '').toLowerCase();
        const shortName = (u.attributes?.short_name || u.short_name || '').toLowerCase();
        const baseUnit = (u.attributes?.base_unit_name?.name || u.attributes?.base_unit || '').toLowerCase();
        const search = searchTerm.trim().toLowerCase();

        const matchesSearch = !search || name.includes(search) || shortName.includes(search) || baseUnit.includes(search);
        const matchesStatus = statusFilter === 'all' ? true : statusFilter === 'active';
        const matchesBaseUnit = baseUnitFilter === 'all' ? true : baseUnit === baseUnitFilter.toLowerCase();

        return matchesSearch && matchesStatus && matchesBaseUnit;
    });

    if (sortBy === 'name') {
        processedUnits.sort((a, b) => (a.attributes?.name || a.name || '').localeCompare(b.attributes?.name || b.name || ''));
    } else if (sortBy === 'oldest') {
        processedUnits.sort((a, b) => Number(a.id) - Number(b.id));
    } else if (sortBy === 'used') {
        processedUnits.sort((a, b) => Number(b.attributes?.products_count || 0) - Number(a.attributes?.products_count || 0));
    } else {
        processedUnits.sort((a, b) => Number(b.id) - Number(a.id));
    }

    // ── Pagination Calculation ──
    const totalFiltered = processedUnits.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
    const validCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (validCurrentPage - 1) * pageSize;
    const paginatedUnits = processedUnits.slice(startIndex, startIndex + pageSize);

    const handleReset = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setBaseUnitFilter('all');
        setSortBy('newest');
        setCurrentPage(1);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedRows(processedUnits.map(u => u.id));
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

    const isInitialLoading = units === null;

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title={placeholderText('units.title')} />

            {isLoadingSkeleton ? (
                <MasterTableSkeleton />
            ) : showCreateForm || editModel ? (
                <UnitsForm
                    show={true}
                    handleClose={() => {
                        setShowCreateForm(false);
                        setEditModel(false);
                        setUnit(null);
                        dispatch(fetchUnits({ search: searchTerm }, false));
                    }}
                    singleUnit={unit}
                    addProductData={(data) => dispatch(addUnit(data))}
                    title={unit ? getFormattedMessage('unit.edit.title') : getFormattedMessage('unit.create.title')}
                />
            ) : (
                <div className="brand-page-container">
                        {/* 1. Breadcrumb */}
                        <div className="brand-breadcrumb">
                            <span>Dashboard</span>
                            <span>&gt;</span>
                            <span>Products</span>
                            <span>&gt;</span>
                            <span className="brand-crumb-active">Units</span>
                        </div>

                        {/* 2. Header Section */}
                        <div className="brand-header">
                            <div className="brand-title-group">
                                <h1>Units</h1>
                                <p>Manage measurement units used for your products and inventory.</p>
                            </div>

                            <div className="brand-header-actions">
                                <CreateUnits onClickCreate={() => setShowCreateForm(true)} />
                            </div>
                        </div>

                        {/* 3. 4 Real KPI Summary Cards Grid */}
                        <div className="brand-kpi-grid">
                            {/* Card 1: Total Units */}
                            <div className="brand-kpi-card">
                                <div className="brand-kpi-top">
                                    <span className="brand-kpi-label">Total Units</span>
                                    <div className="brand-kpi-icon green">
                                        <FontAwesomeIcon icon={faBalanceScale} />
                                    </div>
                                </div>
                                <div className="brand-kpi-value">
                                    {isInitialLoading ? (
                                        <span className="kpi-loading-shimmer" style={{ width: '45px', height: '36px' }}></span>
                                    ) : (
                                        totalUnitsCount
                                    )}
                                </div>
                                <div className="brand-kpi-bottom">
                                    {isInitialLoading ? (
                                        <span className="kpi-loading-shimmer" style={{ width: '70px', height: '18px' }}></span>
                                    ) : (
                                        <>
                                            <span className="brand-kpi-badge up">{totalUnitsCount > 0 ? `${totalUnitsCount} Active Units` : '0 Units'}</span>
                                            <LiveSparkline data={totalUnitsCount > 0 ? [Math.max(0, totalUnitsCount - 1), totalUnitsCount] : [0, 0]} color="#16A34A" width={60} height={24} />
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Card 2: Units in Use */}
                            <div className="brand-kpi-card">
                                <div className="brand-kpi-top">
                                    <span className="brand-kpi-label">Units in Use</span>
                                    <div className="brand-kpi-icon blue">
                                        <FontAwesomeIcon icon={faBox} />
                                    </div>
                                </div>
                                <div className="brand-kpi-value">
                                    {isInitialLoading ? (
                                        <span className="kpi-loading-shimmer" style={{ width: '45px', height: '36px' }}></span>
                                    ) : (
                                        totalUnitsCount
                                    )}
                                </div>
                                <div className="brand-kpi-bottom">
                                    {isInitialLoading ? (
                                        <span className="kpi-loading-shimmer" style={{ width: '70px', height: '18px' }}></span>
                                    ) : (
                                        <>
                                            <span className="brand-kpi-badge up">
                                                {totalUnitsCount > 0 ? `${totalUnitsCount} Active` : '0 Active'}
                                            </span>
                                            <LiveSparkline data={totalUnitsCount > 0 ? [Math.max(0, totalUnitsCount - 1), totalUnitsCount] : [0, 0]} color="#2563EB" width={60} height={24} />
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Card 3: Most Used Unit */}
                            <div className="brand-kpi-card">
                                <div className="brand-kpi-top">
                                    <span className="brand-kpi-label">Most Used Unit</span>
                                    <div className="brand-kpi-icon purple">
                                        <FontAwesomeIcon icon={faTrophy} />
                                    </div>
                                </div>
                                <div className="brand-kpi-value" style={{ fontSize: '24px', textTransform: 'capitalize' }}>
                                    {isInitialLoading ? (
                                        <span className="kpi-loading-shimmer" style={{ width: '90px', height: '30px' }}></span>
                                    ) : (
                                        mostUsedUnitName
                                    )}
                                </div>
                                <div className="brand-kpi-bottom">
                                    {isInitialLoading ? (
                                        <span className="kpi-loading-shimmer" style={{ width: '70px', height: '18px' }}></span>
                                    ) : (
                                        <>
                                            <span className="brand-kpi-label" style={{ fontSize: '13px', color: '#64748B', fontWeight: '700' }}>
                                                {units && units.length > 0 ? 'Primary Unit' : 'No units created'}
                                            </span>
                                            <LiveSparkline data={units && units.length > 0 ? [1, 1] : [0, 0]} color="#9333EA" width={60} height={24} />
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Card 4: Base Units Count */}
                            <div className="brand-kpi-card">
                                <div className="brand-kpi-top">
                                    <span className="brand-kpi-label">Base Units</span>
                                    <div className="brand-kpi-icon orange">
                                        <FontAwesomeIcon icon={faLayerGroup} />
                                    </div>
                                </div>
                                <div className="brand-kpi-value">
                                    {isInitialLoading ? (
                                        <span className="kpi-loading-shimmer" style={{ width: '45px', height: '36px' }}></span>
                                    ) : (
                                        uniqueBaseUnitsCount
                                    )}
                                </div>
                                <div className="brand-kpi-bottom">
                                    {isInitialLoading ? (
                                        <span className="kpi-loading-shimmer" style={{ width: '70px', height: '18px' }}></span>
                                    ) : (
                                        <>
                                            <span className="brand-kpi-badge neutral">{uniqueBaseUnitsCount} Defined</span>
                                            <LiveSparkline data={[uniqueBaseUnitsCount, uniqueBaseUnitsCount]} color="#D97706" width={60} height={24} />
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 4. Main Workspace */}
                        <div className="var-workspace">

                            {/* Search & Filter Bar */}
                            <div className="brand-filter-bar">
                                <div className="brand-search-box">
                                    <FontAwesomeIcon icon={faSearch} className="brand-search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Search units..."
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
                                        value={baseUnitFilter}
                                        onChange={(e) => {
                                            setBaseUnitFilter(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <option value="all">Base Unit: All</option>
                                        {baseUnitsList.map((bu, buIdx) => (
                                            <option key={buIdx} value={bu}>{bu}</option>
                                        ))}
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
                                        <option value="used">Sort: Used Products</option>
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
                                    {isInitialLoading ? (
                                        [1, 2, 3, 4].map((sk) => (
                                            <div key={sk} className="brand-card-item">
                                                <div className="brand-logo-container" style={{ background: '#F1F5F9' }}>
                                                    <span className="kpi-loading-shimmer" style={{ width: '28px', height: '28px', borderRadius: '6px' }}></span>
                                                </div>
                                                <div style={{ marginTop: '12px', textAlign: 'center' }}>
                                                    <span className="kpi-loading-shimmer" style={{ width: '90px', height: '18px' }}></span>
                                                </div>
                                                <div className="d-flex align-items-center justify-content-center gap-2 my-3">
                                                    <span className="kpi-loading-shimmer" style={{ width: '40px', height: '20px', borderRadius: '999px' }}></span>
                                                    <span className="kpi-loading-shimmer" style={{ width: '60px', height: '20px', borderRadius: '999px' }}></span>
                                                </div>
                                                <div className="brand-card-stats">
                                                    <span className="kpi-loading-shimmer" style={{ width: '100%', height: '36px', borderRadius: '8px' }}></span>
                                                </div>
                                            </div>
                                        ))
                                    ) : paginatedUnits.length === 0 ? (
                                        <div style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center' }}>
                                            <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px auto' }}>
                                                <FontAwesomeIcon icon={faRulerCombined} />
                                            </div>
                                            <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>No units found</h3>
                                            <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '400px', margin: '0 auto 20px auto' }}>Try adjusting your search criteria or create a new unit.</p>
                                        </div>
                                    ) : (
                                        paginatedUnits.map((item) => {
                                            const name = item.attributes?.name || item.name || 'Kilogram';
                                            const shortName = item.attributes?.short_name || item.short_name || (name.toLowerCase().includes('kilo') ? 'KG' : (name.toLowerCase().includes('piece') ? 'PC' : '-'));
                                            const baseUnit = item.attributes?.base_unit_name?.name || (typeof item.attributes?.base_unit === 'string' && item.attributes?.base_unit ? item.attributes?.base_unit : name);
                                            const meta = getUnitMetadata(name, shortName, item);

                                            return (
                                                <div key={item.id} className="brand-card-item">
                                                    <div className="brand-logo-container" style={{ background: meta.iconBg }}>
                                                        <FontAwesomeIcon icon={meta.icon} style={{ color: meta.color, fontSize: '24px' }} />
                                                    </div>
                                                    <div className="brand-card-title">{name}</div>
                                                    <div className="d-flex align-items-center justify-content-center gap-2 my-2">
                                                        <span className="unit-short-badge">{shortName}</span>
                                                        <span className="unit-base-badge">{baseUnit}</span>
                                                    </div>
                                                    <div className="brand-card-stats">
                                                        <div className="brand-stat-item">
                                                            <div className="brand-stat-val">{meta.used}</div>
                                                            <div className="brand-stat-lbl">Products</div>
                                                        </div>
                                                        <div style={{ width: '1px', height: '24px', background: '#F1F5F9' }} />
                                                        <div className="brand-stat-item">
                                                            <div className="brand-stat-val">{meta.pct}%</div>
                                                            <div className="brand-stat-lbl">Usage</div>
                                                        </div>
                                                    </div>
                                                    <div className="brand-card-actions">
                                                        <button
                                                            type="button"
                                                            className="brand-action-btn"
                                                            title="Preview"
                                                            onClick={() => setDrawerUnit({ ...item, name, shortName, baseUnit, meta })}
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
                                                        checked={selectedRows.length === processedUnits.length && processedUnits.length > 0}
                                                        onChange={handleSelectAll}
                                                        disabled={processedUnits.length === 0}
                                                    />
                                                </th>
                                                <th>UNIT NAME</th>
                                                <th>SHORT NAME</th>
                                                <th>BASE UNIT</th>
                                                <th>TYPE</th>
                                                <th>USED IN PRODUCTS</th>
                                                <th>CREATED ON</th>
                                                <th>STATUS</th>
                                                <th style={{ textAlign: 'right' }}>ACTIONS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {isInitialLoading ? (
                                                [1, 2, 3].map((sk) => (
                                                    <tr key={sk}>
                                                        <td><span className="kpi-loading-shimmer" style={{ width: '18px', height: '18px' }}></span></td>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                <span className="kpi-loading-shimmer" style={{ width: '36px', height: '36px', borderRadius: '10px' }}></span>
                                                                <span className="kpi-loading-shimmer" style={{ width: '100px', height: '16px' }}></span>
                                                            </div>
                                                        </td>
                                                        <td><span className="kpi-loading-shimmer" style={{ width: '40px', height: '16px' }}></span></td>
                                                        <td><span className="kpi-loading-shimmer" style={{ width: '70px', height: '16px' }}></span></td>
                                                        <td><span className="kpi-loading-shimmer" style={{ width: '50px', height: '16px' }}></span></td>
                                                        <td><span className="kpi-loading-shimmer" style={{ width: '60px', height: '16px' }}></span></td>
                                                        <td><span className="kpi-loading-shimmer" style={{ width: '80px', height: '16px' }}></span></td>
                                                        <td><span className="kpi-loading-shimmer" style={{ width: '60px', height: '22px', borderRadius: '999px' }}></span></td>
                                                        <td style={{ textAlign: 'right' }}>
                                                            <span className="kpi-loading-shimmer" style={{ width: '70px', height: '28px', borderRadius: '8px' }}></span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : paginatedUnits.length === 0 ? (
                                                <tr>
                                                    <td colSpan="9" style={{ textAlign: 'center', padding: '60px 20px', border: 'none' }}>
                                                        <div style={{ padding: '20px', textAlign: 'center' }}>
                                                            <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', margin: '0 auto 16px auto', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.12)' }}>
                                                                <FontAwesomeIcon icon={faRulerCombined} />
                                                            </div>
                                                            <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                                                                No units found
                                                            </h3>
                                                            <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '420px', margin: '0 auto 22px auto', lineHeight: '1.55' }}>
                                                                {searchTerm
                                                                    ? 'No measurement units match your search criteria. Try resetting filters.'
                                                                    : 'Create measurement units (e.g. Kg, Pcs, Box, Liter) to quantify your products and packaging.'}
                                                            </p>
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowCreateForm(true)}
                                                                    className="brand-btn-pill brand-btn-primary"
                                                                >
                                                                    <FontAwesomeIcon icon={faPlus} /> Create Unit
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                paginatedUnits.map((item) => {
                                                    const name = item.attributes?.name || item.name || 'Kilogram';
                                                    const shortName = item.attributes?.short_name || item.short_name || (name.toLowerCase().includes('kilo') ? 'KG' : (name.toLowerCase().includes('piece') ? 'PC' : '-'));
                                                    const baseUnit = item.attributes?.base_unit_name?.name || (typeof item.attributes?.base_unit === 'string' && item.attributes?.base_unit ? item.attributes?.base_unit : name);
                                                    const createdDate = getFormattedDate(item.attributes?.created_at, allConfigData);
                                                    const createdTime = moment(item.attributes?.created_at).format('LT');
                                                    const meta = getUnitMetadata(name, shortName, item);
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
                                                                            fontSize: '16px',
                                                                            flexShrink: 0
                                                                        }}
                                                                    >
                                                                        <FontAwesomeIcon icon={meta.icon} style={{ color: meta.color }} />
                                                                    </div>
                                                                    <span style={{ fontWeight: '700', fontSize: '15px', color: '#0F172A', textTransform: 'capitalize' }}>
                                                                        {name}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td><span className="unit-short-badge">{shortName}</span></td>
                                                            <td><span className="unit-base-badge">{baseUnit}</span></td>
                                                            <td>
                                                                <span className={`cat-badge ${meta.type.toLowerCase()}`}>
                                                                    {meta.type}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <div className="d-flex align-items-center gap-3" style={{ minWidth: '140px', maxWidth: '180px' }}>
                                                                    <span style={{ fontWeight: '800', fontSize: '13px', minWidth: '16px' }}>{meta.used}</span>
                                                                    <div style={{ flex: 1, height: '6px', background: '#F1F5F9', borderRadius: '50px', overflow: 'hidden' }}>
                                                                        <div style={{ width: `${meta.pct}%`, height: '100%', background: meta.color, borderRadius: '50px' }} />
                                                                    </div>
                                                                    <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', minWidth: '28px', textAlign: 'right' }}>{meta.pct}%</span>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A', lineHeight: '1.2' }}>{createdDate}</div>
                                                                    <div style={{ fontSize: '11px', color: '#64748B', lineHeight: '1.2' }}>{createdTime}</div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className="var-status-badge active">
                                                                    <span className="status-dot"></span>Active
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <div className="brand-card-actions" style={{ justifyContent: 'flex-end' }}>
                                                                    <button
                                                                        type="button"
                                                                        className="brand-action-btn"
                                                                        title="Preview Unit"
                                                                        onClick={() => setDrawerUnit({ ...item, name, shortName, baseUnit, meta })}
                                                                    >
                                                                        <FontAwesomeIcon icon={faEye} />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="brand-action-btn edit"
                                                                        title="Edit Unit"
                                                                        onClick={() => handleClose(item)}
                                                                    >
                                                                        <FontAwesomeIcon icon={faEdit} />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="brand-action-btn delete"
                                                                        title="Delete Unit"
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
                                    Showing {totalFiltered > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + pageSize, totalFiltered)} of {totalFiltered} units
                                </div>

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

                                    <select
                                        className="var-select-sm"
                                        style={{ height: '36px', padding: '0 24px 0 10px', marginLeft: '12px' }}
                                        value={pageSize}
                                        onChange={(e) => {
                                            setPageSize(Number(e.target.value));
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <option value={10}>10 / page</option>
                                        <option value={20}>20 / page</option>
                                        <option value={50}>50 / page</option>
                                    </select>
                                </div>
                            </div>

                        </div>

                    </div>
            )}

            {/* Right Side Unit Preview Drawer Panel */}
            {drawerUnit && (
                <div className="var-drawer-overlay" onClick={() => setDrawerUnit(null)}>
                    <div className="var-drawer" onClick={(e) => e.stopPropagation()}>
                        <div className="var-drawer-header">
                            <div>
                                <h3 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: '#0F172A', textTransform: 'capitalize' }}>
                                    {drawerUnit.name}
                                </h3>
                                <span className="var-name-slug">Symbol: {drawerUnit.shortName}</span>
                            </div>
                            <button type="button" className="cat-drawer-close" onClick={() => setDrawerUnit(null)}>
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        </div>

                        <div className="var-drawer-body">
                            <div className="d-flex align-items-center justify-content-center p-4 mb-4 rounded-3" style={{ background: drawerUnit.meta?.iconBg }}>
                                <FontAwesomeIcon icon={drawerUnit.meta?.icon} style={{ color: drawerUnit.meta?.color, fontSize: '42px' }} />
                            </div>

                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <span className="var-status-badge active">● Active</span>
                                <span className="unit-base-badge">Base Unit: {drawerUnit.baseUnit}</span>
                            </div>

                            <div className="row g-3 mb-4">
                                <div className="col-6">
                                    <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '14px', border: '1px solid #EEF2F7' }}>
                                        <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>Products Count</div>
                                        <div style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', marginTop: '2px' }}>
                                            {drawerUnit.meta?.used}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '14px', border: '1px solid #EEF2F7' }}>
                                        <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>Usage Share</div>
                                        <div style={{ fontSize: '20px', fontWeight: '800', color: '#15803D', marginTop: '2px' }}>
                                            {drawerUnit.meta?.pct}%
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '28px' }}>
                                <button
                                    type="button"
                                    className="brand-btn-pill brand-btn-primary"
                                    style={{ width: '100%', height: '48px', justifyContent: 'center' }}
                                    onClick={() => {
                                        const itemToEdit = drawerUnit;
                                        setDrawerUnit(null);
                                        handleClose(itemToEdit);
                                    }}
                                >
                                    <FontAwesomeIcon icon={faEdit} /> Edit {drawerUnit.name}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            <DeleteUnits onClickDeleteModel={onClickDeleteModel} deleteModel={deleteModel} onDelete={isDelete} />

        </MasterLayout>
    );
};

export default Units;
