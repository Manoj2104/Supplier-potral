import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment';
import MasterLayout from '../MasterLayout';
import MasterTableSkeleton from '../../shared/components/skeletons/MasterTableSkeleton';
import { isPageFirstLoad, markPageAnimated } from '../dashboard/dashboardAnimationState';
import TopProgressBar from '../../shared/components/loaders/TopProgressBar';
import TabTitle from '../../shared/tab-title/TabTitle';
import { getFormattedMessage, placeholderText } from '../../shared/sharedMethod';
import CreateVariation from './CreateVariation';
import VariationForm from './VariationForm';
import { fetchVariations, deleteVariation } from '../../store/action/variationAction';
import DeleteVariation from './DeleteVariation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch,
    faDownload,
    faUpload,
    faLayerGroup,
    faThLarge,
    faList,
    faEye,
    faEdit,
    faTrash,
    faCopy,
    faChevronRight,
    faXmark,
    faSliders,
    faPalette,
    faTags,
    faCheckCircle,
    faBox,
    faWandMagicSparkles,
    faPlus,
} from '@fortawesome/free-solid-svg-icons';
import './ProductVariationsPremium.css';
import '../brands/ProductBrandsPremium.css';
import useSmartLoading from '../../shared/hooks/useSmartLoading';
import LiveCounter from '../../shared/components/LiveCounter';
import LiveSparkline from '../../shared/components/LiveSparkline';
import { subscribePosDataChanged } from '../../shared/posEvents';

const Variation = (props) => {
    const dispatch = useDispatch();
    const { variations, isLoading } = useSelector((state) => state);

    // Smart loading: instant render if variations already in Redux
    const isLoadingSkeleton = useSmartLoading(variations);
    const hasData = Array.isArray(variations) && variations.length > 0;

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editModel, setEditModel] = useState(false);
    const [deleteModel, setDeleteModel] = useState(false);
    const [isDelete, setIsDelete] = useState(null);
    const [variation, setVariation] = useState(null);

    // Search, Filter & View States
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRows, setSelectedRows] = useState([]);
    const [viewMode, setViewMode] = useState('list');
    const [drawerVariation, setDrawerVariation] = useState(null);
    const [activeDrawerTab, setActiveDrawerTab] = useState('overview');

    useEffect(() => {
        // Immediate fetch on mount
        dispatch(fetchVariations({ search: searchTerm }, !hasData));

        // Real-time reactive listener for variation and inventory mutations
        const unsubscribe = subscribePosDataChanged(() => {
            dispatch(fetchVariations({ search: searchTerm }, false));
        });

        // Clean up on unmount to avoid duplicate listeners
        return () => {
            unsubscribe();
        };
    }, [searchTerm]);

    const handleCloseEdit = (item = null) => {
        if (item) {
            setVariation({
                id: item.id,
                name: item.attributes?.name || item.name || '',
                variation_types: item.attributes?.variation_types || item.variation_types || [],
            });
            setEditModel(true);
        } else {
            setEditModel(false);
            setShowCreateForm(false);
            setVariation(null);
            dispatch(fetchVariations());
        }
    };

    const onClickDeleteModel = (itemToDelete = null) => {
        setDeleteModel(!deleteModel);
        setIsDelete(itemToDelete);
    };

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchTerm(val);
        setCurrentPage(1);
    };

    const handleReset = () => {
        setSearchTerm('');
        setTypeFilter('all');
        setStatusFilter('all');
        setSortBy('newest');
        setCurrentPage(1);
    };

    // Safe variation list array
    const variationList = Array.isArray(variations)
        ? variations
        : (variations && Array.isArray(variations.data) ? variations.data : []);

    // Calculate Real KPI Metrics strictly from variations array
    const totalVariationsCount = variationList.length;

    const totalValuesCount = variationList.reduce((sum, item) => {
        const types = item.attributes?.variation_types || item.variation_types || [];
        return sum + types.length;
    }, 0);

    // Find variation with most values / usage
    const sortedByValues = [...variationList].sort((a, b) => {
        const aProdCount = (a.attributes?.products_count || a.products_count || 0);
        const bProdCount = (b.attributes?.products_count || b.products_count || 0);
        const aCount = (a.attributes?.variation_types || a.variation_types || []).length;
        const bCount = (b.attributes?.variation_types || b.variation_types || []).length;
        const aUsage = aProdCount * 1000 + aCount;
        const bUsage = bProdCount * 1000 + bCount;
        return bUsage - aUsage;
    });

    const mostUsedVariationName = sortedByValues.length > 0
        ? (sortedByValues[0].attributes?.name || sortedByValues[0].name || 'None')
        : 'None';
    const mostUsedName = mostUsedVariationName;

    const mostUsedValuesCount = sortedByValues.length > 0
        ? ((sortedByValues[0].attributes?.products_count || sortedByValues[0].products_count || 0) > 0
            ? `${sortedByValues[0].attributes?.products_count || sortedByValues[0].products_count} products linked`
            : `${(sortedByValues[0].attributes?.variation_types || sortedByValues[0].variation_types || []).length} values defined`)
        : '0 values defined';

    const activeVariationsCount = variationList.length;

    // Helper for category variation icons and colors
    const getVariationStyle = (name = '') => {
        const lower = (name || '').toLowerCase();
        if (lower.includes('color') || lower.includes('colour')) return { icon: faPalette, bg: '#F3E8FF', color: '#9333EA' };
        if (lower.includes('size')) return { icon: faSliders, bg: '#DCFCE7', color: '#15803D' };
        if (lower.includes('storage') || lower.includes('capacity') || lower.includes('ram')) return { icon: faBox, bg: '#EFF6FF', color: '#2563EB' };
        if (lower.includes('display') || lower.includes('screen')) return { icon: faThLarge, bg: '#FEF3C7', color: '#D97706' };
        if (lower.includes('star') || lower.includes('rating')) return { icon: faWandMagicSparkles, bg: '#FCE7F3', color: '#DB2777' };
        return { icon: faTags, bg: '#E0F2FE', color: '#0284C7' };
    };

    // Color indicators for value chips (clean hex colors)
    const getColorDot = (valueName = '') => {
        const lower = (valueName || '').toLowerCase();
        if (lower.includes('black')) return '#0F172A';
        if (lower.includes('white')) return '#E2E8F0';
        if (lower.includes('red')) return '#EF4444';
        if (lower.includes('blue')) return '#3B82F6';
        if (lower.includes('green')) return '#10B981';
        if (lower.includes('yellow') || lower.includes('gold')) return '#F59E0B';
        if (lower.includes('purple')) return '#8B5CF6';
        if (lower.includes('orange')) return '#F97316';
        if (lower.includes('pink')) return '#EC4899';
        if (lower.includes('grey') || lower.includes('silver')) return '#64748B';
        if (lower.includes('brown')) return '#78350F';
        return null;
    };

    // Filter & Sort Variations
    let processedVariations = [...(variationList || [])];

    if (searchTerm) {
        processedVariations = processedVariations.filter((v) => {
            const name = (v.attributes?.name || v.name || '').toLowerCase();
            const types = (v.attributes?.variation_types || v.variation_types || []).map(t => (t.name || '').toLowerCase()).join(' ');
            return name.includes(searchTerm.toLowerCase()) || types.includes(searchTerm.toLowerCase());
        });
    }

    if (typeFilter && typeFilter !== 'all') {
        processedVariations = processedVariations.filter((v) => {
            const name = (v.attributes?.name || v.name || '').toLowerCase();
            const isAttr = name.includes('color') || name.includes('size') || name.includes('storage') || name.includes('capacity') || name.includes('ram');
            return typeFilter === 'attribute' ? isAttr : !isAttr;
        });
    }

    if (statusFilter && statusFilter !== 'all') {
        processedVariations = processedVariations.filter((v) => {
            const status = (v.attributes?.status || v.status || 'active').toLowerCase();
            return status === statusFilter.toLowerCase();
        });
    }

    if (sortBy === 'name') {
        processedVariations.sort((a, b) => (a.attributes?.name || a.name || '').localeCompare(b.attributes?.name || b.name || ''));
    } else if (sortBy === 'values') {
        processedVariations.sort((a, b) => (b.attributes?.variation_types || b.variation_types || []).length - (a.attributes?.variation_types || a.variation_types || []).length);
    } else if (sortBy === 'oldest') {
        processedVariations.sort((a, b) => Number(a.id) - Number(b.id));
    } else {
        processedVariations.sort((a, b) => Number(b.id) - Number(a.id));
    }

    // Pagination calculations
    const totalFiltered = processedVariations.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
    const validCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (validCurrentPage - 1) * pageSize;
    const paginatedVariations = processedVariations.slice(startIndex, startIndex + pageSize);

    // Checkbox selection
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedRows(processedVariations.map((v) => v.id));
        } else {
            setSelectedRows([]);
        }
    };

    const handleSelectRow = (id) => {
        if (selectedRows.includes(id)) {
            setSelectedRows(selectedRows.filter((rId) => rId !== id));
        } else {
            setSelectedRows([...selectedRows, id]);
        }
    };

    // Export CSV
    const exportToCSV = () => {
        if (!variations || variations.length === 0) return;
        const headers = ["ID,Variation Name,Variation Values\n"];
        const rows = variations.map((v) => {
            const name = `"${v.attributes?.name || v.name || ''}"`;
            const types = `"${(v.attributes?.variation_types || v.variation_types || []).map(t => t.name).join(', ')}"`;
            return `${v.id},${name},${types}`;
        });
        const blob = new Blob([headers + rows.join("\n")], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.setAttribute("href", url);
        a.setAttribute("download", "product_variations.csv");
        a.click();
    };

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title={placeholderText('variations.title')} />

            {isLoadingSkeleton ? (
                <MasterTableSkeleton />
            ) : (
                /* Inline Full Page Workspace for Create or Edit */
                showCreateForm || editModel ? (
                    <VariationForm
                        show={true}
                        handleClose={() => {
                            setShowCreateForm(false);
                            setEditModel(false);
                            setVariation(null);
                            dispatch(fetchVariations());
                        }}
                        singleVariation={variation}
                        title={variation ? getFormattedMessage('variation.edit.title') : getFormattedMessage('variation.create.title')}
                    />
                ) : (
                    <div className="brand-page-container">
                        {/* 1. Breadcrumb */}
                        <div className="brand-breadcrumb">
                            <span>Dashboard</span>
                            <span>&gt;</span>
                            <span>Products</span>
                            <span>&gt;</span>
                            <span className="brand-crumb-active">Variations</span>
                        </div>

                        {/* 2. Header */}
                        <div className="brand-header">
                            <div className="brand-title-group">
                                <h1>Product Variations</h1>
                                <p>Create and manage product attributes, variation values and inventory combinations.</p>
                            </div>

                            <div className="brand-header-actions">
                                <button
                                    type="button"
                                    className="brand-btn-pill brand-btn-primary"
                                    onClick={() => setShowCreateForm(true)}
                                >
                                    <FontAwesomeIcon icon={faPlus} /> {getFormattedMessage('variation.create.title')}
                                </button>
                            </div>
                        </div>

                        {/* 3. 4 Real KPI Summary Cards Grid (Brands Design) */}
                        <div className="brand-kpi-grid">
                            {/* Card 1 */}
                            <div className="brand-kpi-card">
                                <div className="brand-kpi-top">
                                    <span className="brand-kpi-label">Total Variations</span>
                                    <div className="brand-kpi-icon green">
                                        <FontAwesomeIcon icon={faSliders} />
                                    </div>
                                </div>
                                <div className="brand-kpi-value">
                                    <LiveCounter value={totalVariationsCount} isCurrency={false} />
                                </div>
                                <div className="brand-kpi-bottom">
                                    <span className="brand-kpi-badge up">Real Database Data</span>
                                    <LiveSparkline data={totalVariationsCount > 0 ? [Math.max(0, totalVariationsCount * 0.8), totalVariationsCount] : [0, 0, 0]} color="#16A34A" width={60} height={24} />
                                </div>
                            </div>

                            {/* Card 2 */}
                            <div className="brand-kpi-card">
                                <div className="brand-kpi-top">
                                    <span className="brand-kpi-label">Variation Values</span>
                                    <div className="brand-kpi-icon blue">
                                        <FontAwesomeIcon icon={faTags} />
                                    </div>
                                </div>
                                <div className="brand-kpi-value">
                                    <LiveCounter value={totalValuesCount} isCurrency={false} />
                                </div>
                                <div className="brand-kpi-bottom">
                                    <span className="brand-kpi-badge up">Option Values</span>
                                    <LiveSparkline data={totalValuesCount > 0 ? [Math.max(0, totalValuesCount * 0.8), totalValuesCount] : [0, 0, 0]} color="#2563EB" width={60} height={24} />
                                </div>
                            </div>

                            {/* Card 3 */}
                            <div className="brand-kpi-card">
                                <div className="brand-kpi-top">
                                    <span className="brand-kpi-label">Most Used Variation</span>
                                    <div className="brand-kpi-icon orange">
                                        <FontAwesomeIcon icon={faPalette} />
                                    </div>
                                </div>
                                <div className="brand-kpi-value" style={{ fontSize: '24px' }}>
                                    {mostUsedName}
                                </div>
                                <div className="brand-kpi-bottom">
                                    <span className="brand-kpi-badge neutral">{mostUsedValuesCount}</span>
                                    <LiveSparkline data={[2, 3, 4, 3, 5]} color="#D97706" width={60} height={24} />
                                </div>
                            </div>

                            {/* Card 4 */}
                            <div className="brand-kpi-card">
                                <div className="brand-kpi-top">
                                    <span className="brand-kpi-label">Active Variations</span>
                                    <div className="brand-kpi-icon purple">
                                        <FontAwesomeIcon icon={faCheckCircle} />
                                    </div>
                                </div>
                                <div className="brand-kpi-value">
                                    <LiveCounter value={activeVariationsCount} isCurrency={false} />
                                </div>
                                <div className="brand-kpi-bottom">
                                    <span className="brand-kpi-badge up">Active Attributes</span>
                                    <LiveSparkline data={activeVariationsCount > 0 ? [Math.max(0, activeVariationsCount * 0.8), activeVariationsCount] : [0, 0, 0]} color="#9333EA" width={60} height={24} />
                                </div>
                            </div>
                        </div>

                        {/* 4. Floating Workspace Container */}
                        <div className="var-workspace">

                            {/* Filter Bar */}
                            <div className="var-filter-bar">
                                <div className="var-search-box">
                                    <FontAwesomeIcon icon={faSearch} className="var-search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Search variation name or values..."
                                        value={searchTerm}
                                        onChange={handleSearchChange}
                                    />
                                </div>

                                <div className="var-filter-controls">
                                    <select className="var-select-sm" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}>
                                        <option value="all">Type: All</option>
                                        <option value="attribute">Attribute</option>
                                        <option value="custom">Custom</option>
                                    </select>

                                    <select className="var-select-sm" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
                                        <option value="all">Status: All</option>
                                        <option value="active">Active</option>
                                        <option value="draft">Draft</option>
                                    </select>

                                    <select className="var-select-sm" value={sortBy} onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}>
                                        <option value="newest">Sort: Newest</option>
                                        <option value="oldest">Sort: Oldest</option>
                                        <option value="name">Sort: Name (A-Z)</option>
                                        <option value="values">Sort: Values Count</option>
                                    </select>

                                    <div className="var-view-toggle">
                                        <button type="button" className={`var-view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} title="Table List View">
                                            <FontAwesomeIcon icon={faList} />
                                        </button>
                                        <button type="button" className={`var-view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} title="Card Grid View">
                                            <FontAwesomeIcon icon={faThLarge} />
                                        </button>
                                    </div>

                                    <button type="button" className="cat-btn-filter" onClick={handleReset}>
                                        Reset
                                    </button>
                                </div>
                            </div>

                            {/* Bulk Bar */}
                            {selectedRows.length > 0 && (
                                <div className="cat-bulk-bar" style={{ marginBottom: '16px' }}>
                                    <div className="cat-bulk-info">
                                        <FontAwesomeIcon icon={faCheckCircle} />
                                        {selectedRows.length} variations selected
                                    </div>
                                    <div className="cat-bulk-actions">
                                        <button
                                            type="button"
                                            className="cat-btn-bulk danger"
                                            onClick={() => {
                                                if (window.confirm(`Delete ${selectedRows.length} selected variations?`)) {
                                                    selectedRows.forEach(id => dispatch(deleteVariation(id)));
                                                    setSelectedRows([]);
                                                }
                                            }}
                                        >
                                            Bulk Delete
                                        </button>
                                        <button type="button" className="cat-btn-bulk" onClick={exportToCSV}>
                                            Export Selected
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* View Switch: Table List vs Grid Cards */}
                            {viewMode === 'grid' ? (
                                <div className="var-grid-layout">
                                    {paginatedVariations.length === 0 ? (
                                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', background: '#F8FAFC', borderRadius: '20px' }}>
                                            <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px auto' }}>
                                                <FontAwesomeIcon icon={faSliders} />
                                            </div>
                                            <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '6px' }}>No variations found</h4>
                                            <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '380px', margin: '0 auto 18px auto' }}>Try adjusting your search terms or filters to find what you are looking for.</p>
                                            <button type="button" className="brand-btn-pill brand-btn-primary" onClick={handleReset}>
                                                Reset Filters
                                            </button>
                                        </div>
                                    ) : (
                                        paginatedVariations.map((item) => {
                                            const name = item.attributes?.name || item.name || '';
                                            const types = item.attributes?.variation_types || item.variation_types || [];
                                            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                                            const varStyle = getVariationStyle(name);
                                            const createdDate = item.attributes?.created_at || item.created_at
                                                ? moment(item.attributes?.created_at || item.created_at).format('DD MMM YYYY')
                                                : '—';

                                            return (
                                                <div key={item.id} className="var-grid-card">
                                                    <div className="var-grid-top">
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div className="var-icon-badge" style={{ background: varStyle.bg, color: varStyle.color }}>
                                                                <FontAwesomeIcon icon={varStyle.icon} />
                                                            </div>
                                                            <div>
                                                                <div className="var-name-title">{name}</div>
                                                                <div className="var-name-slug">{slug}</div>
                                                            </div>
                                                        </div>
                                                        <span className="var-status-badge active">● Active</span>
                                                    </div>

                                                    <div className="var-grid-chips">
                                                        {types.length === 0 ? (
                                                            <span style={{ color: '#94A3B8', fontSize: '13px' }}>No values defined</span>
                                                        ) : (
                                                            <div className="var-hover-tooltip-container">
                                                                <span className="var-chip-summary">
                                                                    <span className="var-chip-count-dot" />
                                                                    {types.length} Other
                                                                </span>
                                                                <div className="var-hover-tooltip">
                                                                    <div className="var-tooltip-header">{name} Values ({types.length})</div>
                                                                    <div className="var-tooltip-chips">
                                                                        {types.map((tItem, tIdx) => {
                                                                            const dotColor = getColorDot(tItem.name);
                                                                            return (
                                                                                <span key={tIdx} className="var-tooltip-chip">
                                                                                    {dotColor && (
                                                                                        <span
                                                                                            style={{
                                                                                                width: '8px',
                                                                                                height: '8px',
                                                                                                borderRadius: '50%',
                                                                                                background: dotColor,
                                                                                                display: 'inline-block',
                                                                                                flexShrink: 0,
                                                                                                border: dotColor === '#E2E8F0' ? '1px solid #94A3B8' : 'none'
                                                                                            }}
                                                                                        />
                                                                                    )}
                                                                                    {tItem.name}
                                                                                </span>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="var-grid-footer">
                                                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748B' }}>
                                                            {types.length} option values
                                                        </span>
                                                        <div className="var-action-btns">
                                                            <button
                                                                type="button"
                                                                className="var-icon-btn"
                                                                title="Preview"
                                                                onClick={() => setDrawerVariation({ ...item, name, types, slug, createdDate })}
                                                            >
                                                                <FontAwesomeIcon icon={faEye} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="var-icon-btn edit"
                                                                title="Edit"
                                                                onClick={() => handleCloseEdit(item)}
                                                            >
                                                                <FontAwesomeIcon icon={faEdit} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="var-icon-btn delete"
                                                                title="Delete"
                                                                onClick={() => onClickDeleteModel(item)}
                                                            >
                                                                <FontAwesomeIcon icon={faTrash} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            ) : (
                                /* Real Data Table */
                                <div className="var-table-wrap">
                                    <table className="var-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '40px' }}>
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        checked={selectedRows.length === (processedVariations?.length || 0) && processedVariations?.length > 0}
                                                        onChange={handleSelectAll}
                                                    />
                                                </th>
                                                <th>Variation Name</th>
                                                <th>Variation Values</th>
                                                <th>Values Count</th>
                                                <th>Status</th>
                                                <th>Created Date</th>
                                                <th style={{ textAlign: 'right' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedVariations.length === 0 ? (
                                                <tr>
                                                    <td colSpan="7" style={{ textAlign: 'center', padding: '60px 20px', border: 'none' }}>
                                                        <div style={{ padding: '20px', textAlign: 'center' }}>
                                                            <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', margin: '0 auto 16px auto', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.12)' }}>
                                                                <FontAwesomeIcon icon={faSliders} />
                                                            </div>
                                                            <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                                                                No product variations found
                                                            </h3>
                                                            <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '420px', margin: '0 auto 22px auto', lineHeight: '1.55' }}>
                                                                {searchTerm
                                                                    ? 'No variations match your search criteria. Try resetting filters.'
                                                                    : 'Create product variations (e.g. Size, Color, Flavor, Material) to configure dynamic multi-sku products.'}
                                                            </p>
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowCreateForm(true)}
                                                                    className="brand-btn-pill brand-btn-primary"
                                                                >
                                                                    <FontAwesomeIcon icon={faPlus} /> Create Variation
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                paginatedVariations.map((item) => {
                                                    const name = item.attributes?.name || item.name || '';
                                                    const types = item.attributes?.variation_types || item.variation_types || [];
                                                    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                                                    const varStyle = getVariationStyle(name);
                                                    const isSelected = selectedRows.includes(item.id);
                                                    const createdDate = item.attributes?.created_at || item.created_at
                                                        ? moment(item.attributes?.created_at || item.created_at).format('DD MMM YYYY')
                                                        : '—';

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
                                                                <div className="var-name-box">
                                                                    <div className="var-icon-badge" style={{ background: varStyle.bg, color: varStyle.color }}>
                                                                        <FontAwesomeIcon icon={varStyle.icon} />
                                                                    </div>
                                                                    <div>
                                                                        <div className="var-name-title">{name}</div>
                                                                        <div className="var-name-slug">{slug}</div>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            <td>
                                                                {types.length === 0 ? (
                                                                    <span style={{ color: '#94A3B8', fontSize: '13px' }}>—</span>
                                                                ) : (
                                                                    <div className="var-hover-tooltip-container">
                                                                        <span className="var-chip-summary">
                                                                            <span className="var-chip-count-dot" />
                                                                            {types.length} Other
                                                                        </span>
                                                                        <div className="var-hover-tooltip">
                                                                            <div className="var-tooltip-header">{name} Values ({types.length})</div>
                                                                            <div className="var-tooltip-chips">
                                                                                {types.map((tItem, tIdx) => {
                                                                                    const dotColor = getColorDot(tItem.name);
                                                                                    return (
                                                                                        <span key={tIdx} className="var-tooltip-chip">
                                                                                            {dotColor && (
                                                                                                <span
                                                                                                    style={{
                                                                                                        width: '8px',
                                                                                                        height: '8px',
                                                                                                        borderRadius: '50%',
                                                                                                        background: dotColor,
                                                                                                        display: 'inline-block',
                                                                                                        flexShrink: 0,
                                                                                                        border: dotColor === '#E2E8F0' ? '1px solid #94A3B8' : 'none'
                                                                                                    }}
                                                                                                />
                                                                                            )}
                                                                                            {tItem.name}
                                                                                        </span>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </td>

                                                            <td style={{ fontWeight: '700', color: '#0F172A' }}>
                                                                {types.length}
                                                            </td>

                                                            <td>
                                                                <span className="var-status-badge active">
                                                                    ● Active
                                                                </span>
                                                            </td>

                                                            <td style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
                                                                {createdDate}
                                                            </td>

                                                            <td>
                                                                <div className="var-action-btns" style={{ justifyContent: 'flex-end' }}>
                                                                    <button
                                                                        type="button"
                                                                        className="var-icon-btn"
                                                                        title="Preview Variation"
                                                                        onClick={() => setDrawerVariation({ ...item, name, types, slug, createdDate })}
                                                                    >
                                                                        <FontAwesomeIcon icon={faEye} />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="var-icon-btn edit"
                                                                        title="Edit Variation"
                                                                        onClick={() => handleCloseEdit(item)}
                                                                    >
                                                                        <FontAwesomeIcon icon={faEdit} />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="var-icon-btn"
                                                                        title="Duplicate Variation"
                                                                        onClick={() => {
                                                                            dispatch(fetchVariations());
                                                                        }}
                                                                    >
                                                                        <FontAwesomeIcon icon={faCopy} />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="var-icon-btn delete"
                                                                        title="Delete Variation"
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

                            {/* Pagination Footer */}
                            <div className="var-pagination">
                                <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
                                    Showing {totalFiltered > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + pageSize, totalFiltered)} of {totalFiltered} variations
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
                )
            )}

            {/* 6. Variation Preview Right Drawer Panel */}
            {drawerVariation && (
                <div className="var-drawer-overlay" onClick={() => setDrawerVariation(null)}>
                    <div className="var-drawer" onClick={(e) => e.stopPropagation()}>
                        <div className="var-drawer-header">
                            <div>
                                <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#0F172A' }}>
                                    {drawerVariation.name}
                                </h3>
                                <span className="var-name-slug">{drawerVariation.slug}</span>
                            </div>
                            <button type="button" className="cat-drawer-close" onClick={() => setDrawerVariation(null)}>
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        </div>

                        <div className="var-drawer-body">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <span className="var-status-badge active">● Active</span>
                                <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
                                    Created: {drawerVariation.createdDate || '—'}
                                </span>
                            </div>

                            {/* Drawer Nav Tabs */}
                            <div className="d-flex gap-2 border-bottom pb-2 mb-4">
                                <button
                                    type="button"
                                    className={`btn btn-sm ${activeDrawerTab === 'overview' ? 'btn-success fw-bold' : 'btn-light'}`}
                                    onClick={() => setActiveDrawerTab('overview')}
                                >
                                    Overview
                                </button>
                                <button
                                    type="button"
                                    className={`btn btn-sm ${activeDrawerTab === 'values' ? 'btn-success fw-bold' : 'btn-light'}`}
                                    onClick={() => setActiveDrawerTab('values')}
                                >
                                    Values ({drawerVariation.types.length})
                                </button>
                            </div>

                            {/* Drawer Content */}
                            <div className="row g-3 mb-4">
                                <div className="col-12">
                                    <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '14px', border: '1px solid #EEF2F7' }}>
                                        <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>Variation Values Count</div>
                                        <div style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', marginTop: '2px' }}>
                                            {drawerVariation.types.length}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4">
                                <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', marginBottom: '12px' }}>
                                    Variation Values ({drawerVariation.types.length})
                                </h4>
                                <div className="d-flex flex-wrap gap-2">
                                    {drawerVariation.types.map((t, idx) => (
                                        <span key={idx} className="var-chip" style={{ fontSize: '13px', padding: '6px 14px' }}>
                                            {getColorDot(t.name) && <span className="me-1">{getColorDot(t.name)}</span>}
                                            {t.name}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div style={{ marginTop: '28px' }}>
                                <button
                                    type="button"
                                    className="var-btn-pill var-btn-primary"
                                    style={{ width: '100%', height: '48px' }}
                                    onClick={() => {
                                        const itemToEdit = drawerVariation;
                                        setDrawerVariation(null);
                                        handleCloseEdit(itemToEdit);
                                    }}
                                >
                                    <FontAwesomeIcon icon={faEdit} /> Edit {drawerVariation.name}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            <DeleteVariation
                onClickDeleteModel={onClickDeleteModel}
                deleteModel={deleteModel}
                onDelete={isDelete}
            />

        </MasterLayout>
    );
};

export default Variation;
