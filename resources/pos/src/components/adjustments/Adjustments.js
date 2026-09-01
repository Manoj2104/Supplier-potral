import React, { useEffect, useState, useMemo } from 'react';
import moment from 'moment';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import MasterLayout from '../MasterLayout';
import TabTitle from '../../shared/tab-title/TabTitle';
import DeleteSaleAdjustMents from './DeleteSaleAdjustMents';
import AdjustMentDetail from './AdjustMentDetail';
import { getFormattedDate, getFormattedMessage, placeholderText, formatAmount, currencySymbolHandling } from '../../shared/sharedMethod';
import { fetchFrontSetting } from '../../store/action/frontSettingAction';
import { fetchAdjustments } from '../../store/action/adjustMentAction';
import { fetchProducts } from '../../store/action/productAction';
import { fetchAllWarehouses } from '../../store/action/warehouseAction';
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faSliders, 
    faBoxesStacked, 
    faReceipt, 
    faChartLine, 
    faPlus,
    faBuilding,
    faSearch,
    faEye,
    faEdit,
    faTrash,
    faUser,
    faList,
    faThLarge,
    faRotate,
    faClock,
} from '@fortawesome/free-solid-svg-icons';
import '../brands/ProductBrandsPremium.css';
import '../units/ProductUnitsPremium.css';
import '../variation/ProductVariationsPremium.css';
import LiveCounter from '../../shared/components/LiveCounter';
import LiveSparkline from '../../shared/components/LiveSparkline';
import { subscribePosDataChanged } from '../../shared/posEvents';

const Adjustments = (props) => {
    const { 
        adjustments = [], 
        fetchAdjustments, 
        fetchProducts,
        products = [],
        totalRecord = 0, 
        fetchFrontSetting, 
        frontSetting, 
        warehouses = [], 
        fetchAllWarehouses, 
        isCallSaleApi, 
        allConfigData 
    } = props;

    const safeAdjustments = Array.isArray(adjustments) ? adjustments : [];
    const safeWarehouses = Array.isArray(warehouses) ? warehouses : [];
    const safeProducts = Array.isArray(products) ? products : [];

    const [deleteModel, setDeleteModel] = useState(false);
    const [detailsModel, setDetailsModel] = useState(false);
    const [isDelete, setIsDelete] = useState(null);
    const [isDetails, setIsDetails] = useState(null);
    const [lgShow, setLgShow] = useState(false);

    // Search, Filter, Pagination & View States
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedWarehouse, setSelectedWarehouse] = useState("All");
    const [selectedType, setSelectedType] = useState("All");
    const [sortBy, setSortBy] = useState("newest");
    const [viewMode, setViewMode] = useState("list");
    const [selectedRows, setSelectedRows] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [drawerItem, setDrawerItem] = useState(null);

    useEffect(() => {
        fetchFrontSetting();
        fetchAllWarehouses();
        const hasData = safeAdjustments.length > 0;
        fetchAdjustments({ page: 1, pageSize: 100 }, !hasData);
        fetchProducts({ page: 1, pageSize: 1000 }, false);

        // Event-driven real-time sync
        const unsubscribe = subscribePosDataChanged(() => {
            fetchAdjustments({ page: 1, pageSize: 100 }, false);
        });

        return () => unsubscribe();
    }, []);

    const currencySymbol = (frontSetting && frontSetting.value && frontSetting.value.currency_symbol) || '₹';

    // ─── Map Realtime Items ──────────────────────────────────────────────────
    const mappedItems = useMemo(() => {
        return safeAdjustments.map((item, idx) => {
            const rawProducts = Number(
                item?.attributes?.total_products || 
                (item?.attributes?.adjustment_items ? item.attributes.adjustment_items.length : 0)
            ) || 1;
            
            // Method Type detection
            const methodType = item?.attributes?.adjustment_items && item.attributes.adjustment_items.length > 0
                ? item.attributes.adjustment_items[0]?.method_type
                : (item?.attributes?.method_type || item?.attributes?.type);
            
            let typeStr = 'Addition';
            if (methodType === 2 || methodType === '2' || methodType === 'Subtraction' || methodType === 'Decrease') {
                typeStr = 'Subtraction';
            } else if (methodType === 3 || methodType === 'Transfer') {
                typeStr = 'Transfer';
            } else if (methodType === 4 || methodType === 'Damage') {
                typeStr = 'Damage';
            } else if (methodType === 5 || methodType === 'Expiry') {
                typeStr = 'Expiry';
            }

            const isAddition = typeStr === 'Addition' || typeStr === 'Increase';
            const isSubtraction = typeStr === 'Subtraction' || typeStr === 'Decrease';
            const isTransfer = typeStr === 'Transfer';

            let amount = 0;
            if (Array.isArray(item?.attributes?.adjustment_items) && item.attributes.adjustment_items.length > 0) {
                amount = item.attributes.adjustment_items.reduce((acc, ai) => {
                    const qty = Number(ai.quantity) || 1;
                    let cost = Number(ai.product_cost || ai.product_price || ai.net_unit_cost || ai.product?.product_cost || ai.product?.product_price || 0);
                    if (!cost && safeProducts.length > 0) {
                        const matchedProd = safeProducts.find(p => Number(p.id) === Number(ai.product_id));
                        if (matchedProd && matchedProd.attributes) {
                            cost = Number(matchedProd.attributes.product_cost || matchedProd.attributes.product_price || matchedProd.attributes.cost || 0);
                        }
                    }
                    if (!cost) cost = 0;
                    return acc + (qty * cost);
                }, 0);
            } else if (item?.attributes?.grand_total !== undefined && item?.attributes?.grand_total !== null && Number(item.attributes.grand_total) > 0) {
                amount = Number(item.attributes.grand_total);
            } else {
                amount = 0;
            }

            const reasonStr = item?.attributes?.reason || "Stock Count Correction";

            const createdRaw = item?.attributes?.created_at || item?.attributes?.date || new Date().toISOString();
            const dateStr = getFormattedDate(createdRaw, allConfigData);
            const timeStr = moment(createdRaw).format("hh:mm A");

            const changedBy = item?.attributes?.created_by_name || 'Admin';
            const refCode = item?.attributes?.reference_code || `AD_${item?.id || (idx + 1)}`;
            const warehouseName = item?.attributes?.warehouse_name || 'Main Warehouse';

            return {
                id: item?.id || (idx + 1),
                refCode,
                type: typeStr,
                isAddition,
                isSubtraction,
                isTransfer,
                warehouseName,
                productsCount: rawProducts,
                valueNum: amount,
                formattedValue: isAddition ? `+ ${currencySymbol} ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : (isSubtraction ? `- ${currencySymbol} ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `${currencySymbol} 0.00`),
                compactValue: isAddition ? `+ ${currencySymbol} ${formatAmount(amount)}` : (isSubtraction ? `- ${currencySymbol} ${formatAmount(amount)}` : `${currencySymbol} 0.00`),
                reason: reasonStr,
                dateOnly: dateStr,
                timeOnly: timeStr,
                changedBy,
                rawItem: item
            };
        });
    }, [safeAdjustments, safeProducts, currencySymbol, allConfigData]);

    // ─── Filter & Sort Logic ─────────────────────────────────────────────────
    const filteredRows = useMemo(() => {
        let list = mappedItems.filter((row) => {
            const search = searchTerm.trim().toLowerCase();
            const matchesSearch =
                !search ||
                row.refCode.toLowerCase().includes(search) ||
                row.warehouseName.toLowerCase().includes(search) ||
                row.reason.toLowerCase().includes(search) ||
                row.type.toLowerCase().includes(search);

            const matchesWh = selectedWarehouse === "All" || row.warehouseName === selectedWarehouse;
            const matchesType = selectedType === "All" || row.type.toLowerCase() === selectedType.toLowerCase();

            return matchesSearch && matchesWh && matchesType;
        });

        if (sortBy === 'oldest') {
            list.sort((a, b) => Number(a.id) - Number(b.id));
        } else if (sortBy === 'value') {
            list.sort((a, b) => b.valueNum - a.valueNum);
        } else if (sortBy === 'products') {
            list.sort((a, b) => b.productsCount - a.productsCount);
        } else {
            list.sort((a, b) => Number(b.id) - Number(a.id));
        }

        return list;
    }, [mappedItems, searchTerm, selectedWarehouse, selectedType, sortBy]);

    // ─── Pagination Calculations ─────────────────────────────────────────────
    const totalFiltered = filteredRows.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
    const validCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (validCurrentPage - 1) * pageSize;
    const paginatedRows = filteredRows.slice(startIndex, startIndex + pageSize);

    // ─── Realtime KPIs ───────────────────────────────────────────────────────
    const totalAdjustmentsCount = filteredRows.length;
    const totalProductsAffected = filteredRows.reduce((sum, r) => sum + r.productsCount, 0);
    const totalIncVal = filteredRows.filter(r => r.isAddition).reduce((sum, r) => sum + r.valueNum, 0);
    const totalDecVal = filteredRows.filter(r => r.isSubtraction).reduce((sum, r) => sum + r.valueNum, 0);
    const netAdjustmentVal = totalIncVal - totalDecVal;
    const avgAdjustmentVal = totalAdjustmentsCount > 0 ? (Math.abs(netAdjustmentVal) / totalAdjustmentsCount) : 0;

    const clearAllFilters = () => {
        setSearchTerm("");
        setSelectedWarehouse("All");
        setSelectedType("All");
        setSortBy("newest");
        setCurrentPage(1);
    };

    const onClickDeleteModel = (isDelete = null) => {
        setDeleteModel(!deleteModel);
        setIsDelete(isDelete);
    };

    const onClickDetailsModel = (rowItem) => {
        setDrawerItem(rowItem);
        setLgShow(true);
        setIsDetails(rowItem.rawItem || rowItem);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) setSelectedRows(filteredRows.map(i => i.id));
        else setSelectedRows([]);
    };

    const handleSelectRow = (id) => {
        setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
    };

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title={placeholderText('adjustments.title')} />

            <div className="brand-page-container">
                
                {/* ── 1. Breadcrumb ─────────────────────────────────────── */}
                <div className="brand-breadcrumb">
                    <span>Dashboard</span>
                    <span>&gt;</span>
                    <span>Inventory</span>
                    <span>&gt;</span>
                    <span className="brand-crumb-active">Adjustments</span>
                </div>

                {/* ── 2. Header Section ─────────────────────────────────── */}
                <div className="brand-header">
                    <div className="brand-title-group">
                        <h1>Inventory Adjustments</h1>
                        <p>Manage, track and reconcile product inventory adjustments and stock corrections across warehouses.</p>
                    </div>
                    <div className="brand-header-actions">
                        <Link to="/app/adjustments/create" className="unit-btn-pill unit-btn-primary">
                            <FontAwesomeIcon icon={faPlus} /> Create Adjustment
                        </Link>
                    </div>
                </div>

                {/* ── 3. 4 Real KPI Summary Cards Grid ─────────────────── */}
                <div className="brand-kpi-grid">
                    {/* Card 1: Total Adjustments */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Total Adjustments</span>
                            <div className="brand-kpi-icon green">
                                <FontAwesomeIcon icon={faSliders} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={totalAdjustmentsCount} isCurrency={false} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge up">
                                {totalAdjustmentsCount > 0 ? `${totalAdjustmentsCount} Active` : '0 Active'}
                            </span>
                            <LiveSparkline data={totalAdjustmentsCount > 0 ? [Math.max(0, totalAdjustmentsCount - 1), totalAdjustmentsCount] : [0, 0]} color="#16A34A" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 2: Products Affected */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Products Affected</span>
                            <div className="brand-kpi-icon blue">
                                <FontAwesomeIcon icon={faBoxesStacked} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={totalProductsAffected} isCurrency={false} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge up">
                                {totalProductsAffected > 0 ? `${totalProductsAffected} Items` : '0 Items'}
                            </span>
                            <LiveSparkline data={totalProductsAffected > 0 ? [Math.max(0, totalProductsAffected - 1), totalProductsAffected] : [0, 0]} color="#2563EB" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 3: Total Adjustment Value */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Total Adjustment Value</span>
                            <div className="brand-kpi-icon purple">
                                <FontAwesomeIcon icon={faReceipt} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={Math.abs(netAdjustmentVal)} isCurrency={true} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-label" style={{ fontSize: '13px', color: '#64748B', fontWeight: '700' }}>
                                Net Value Impact
                            </span>
                            <LiveSparkline data={Math.abs(netAdjustmentVal) > 0 ? [Math.max(0, Math.abs(netAdjustmentVal) - 100), Math.abs(netAdjustmentVal)] : [0, 0]} color="#9333EA" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 4: Average Adjustment */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Average Adjustment</span>
                            <div className="brand-kpi-icon orange">
                                <FontAwesomeIcon icon={faChartLine} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={avgAdjustmentVal} isCurrency={true} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge neutral">
                                Per Transaction
                            </span>
                            <LiveSparkline data={avgAdjustmentVal > 0 ? [Math.max(0, avgAdjustmentVal - 50), avgAdjustmentVal] : [0, 0]} color="#D97706" width={60} height={24} />
                        </div>
                    </div>
                </div>

                {/* ── 4. Main Workspace (Matching Units Design) ─────────── */}
                <div className="var-workspace">

                    {/* Search & Filter Bar */}
                    <div className="brand-filter-bar">
                        <div className="brand-search-box">
                            <FontAwesomeIcon icon={faSearch} className="brand-search-icon" />
                            <input
                                type="text"
                                placeholder="Search by reference, warehouse, reason..."
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
                                value={selectedWarehouse}
                                onChange={(e) => {
                                    setSelectedWarehouse(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="All">Warehouse: All</option>
                                {safeWarehouses.map((wh) => (
                                    <option key={wh.id} value={wh.attributes?.name || wh.name}>
                                        {wh.attributes?.name || wh.name}
                                    </option>
                                ))}
                            </select>

                            <select
                                className="var-select-sm"
                                value={selectedType}
                                onChange={(e) => {
                                    setSelectedType(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="All">Type: All</option>
                                <option value="Addition">Addition</option>
                                <option value="Subtraction">Subtraction</option>
                                <option value="Transfer">Transfer</option>
                                <option value="Damage">Damage</option>
                                <option value="Expiry">Expiry</option>
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
                                <option value="value">Sort: Highest Value</option>
                                <option value="products">Sort: Most Products</option>
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
                                onClick={clearAllFilters}
                                title="Reset Filters"
                            >
                                Reset
                            </button>
                        </div>
                    </div>

                    {/* ── 5. View Content: Table or Grid ───────────────── */}
                    {viewMode === 'grid' ? (
                        /* COMPACT ELEGANT GRID CARDS */
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                            {paginatedRows.length === 0 ? (
                                <div style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center' }}>
                                    <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px auto', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.12)' }}>
                                        <FontAwesomeIcon icon={faBoxesStacked} />
                                    </div>
                                    <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>No adjustments found</h3>
                                    <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '400px', margin: '0 auto 20px auto' }}>Try adjusting your search criteria or record a new adjustment.</p>
                                    <Link to="/app/adjustments/create" className="unit-btn-pill unit-btn-primary">
                                        <FontAwesomeIcon icon={faPlus} /> Create Adjustment
                                    </Link>
                                </div>
                            ) : (
                                paginatedRows.map((row) => (
                                    <div
                                        key={row.id}
                                        style={{
                                            background: '#FFFFFF',
                                            border: '1px solid #EEF2F7',
                                            borderRadius: '16px',
                                            padding: '14px 16px',
                                            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between',
                                            gap: '10px',
                                            cursor: 'pointer',
                                            transition: 'all 200ms ease',
                                            minHeight: '180px'
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(15, 23, 42, 0.07)';
                                            e.currentTarget.style.borderColor = '#BFDBFE';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 2px 6px rgba(15, 23, 42, 0.03)';
                                            e.currentTarget.style.borderColor = '#EEF2F7';
                                        }}
                                    >
                                        {/* Row 1: Icon + Ref Code + Type Pill */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                                <div style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '10px',
                                                    background: row.isAddition ? '#DCFCE7' : (row.isSubtraction ? '#FEF3C7' : '#EFF6FF'),
                                                    color: row.isAddition ? '#16A34A' : (row.isSubtraction ? '#D97706' : '#2563EB'),
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '14px',
                                                    flexShrink: 0
                                                }}>
                                                    <FontAwesomeIcon icon={faSliders} />
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {row.refCode}
                                                    </div>
                                                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', whiteSpace: 'nowrap' }}>
                                                        {row.warehouseName}
                                                    </div>
                                                </div>
                                            </div>

                                            <span className={`unit-status-pill ${row.isAddition ? 'active' : (row.isSubtraction ? 'draft' : 'default')}`} style={{ padding: '2px 8px', fontSize: '11px', fontWeight: '800', whiteSpace: 'nowrap' }}>
                                                <span className="unit-dot" /> {row.type}
                                            </span>
                                        </div>

                                        {/* Row 2: Reason */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                            <span style={{ fontSize: '12px', color: '#0F172A', fontWeight: '700', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                                {row.reason}
                                            </span>
                                        </div>

                                        {/* Row 3: Meta Strip */}
                                        <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '6px 10px', fontSize: '11px', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div>
                                                <span style={{ fontWeight: '700', color: '#0F172A' }}>{row.productsCount} Products</span>
                                                <span style={{ color: '#64748B', marginLeft: '4px' }}>• {row.changedBy}</span>
                                            </div>
                                            <div style={{ fontWeight: '800', color: row.isAddition ? '#16A34A' : (row.isSubtraction ? '#DC2626' : '#0F172A'), whiteSpace: 'nowrap' }}>
                                                {row.compactValue}
                                            </div>
                                        </div>

                                        {/* Row 4: Date + Actions */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid #F1F5F9' }}>
                                            <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '600' }}>
                                                {row.dateOnly} {row.timeOnly}
                                            </div>
                                            <div className="brand-card-actions" style={{ gap: '4px' }} onClick={e => e.stopPropagation()}>
                                                <button
                                                    type="button"
                                                    className="brand-action-btn"
                                                    title="View Details"
                                                    onClick={() => onClickDetailsModel(row)}
                                                >
                                                    <FontAwesomeIcon icon={faEye} />
                                                </button>
                                                <Link
                                                    to={`/app/adjustments/${row.id}`}
                                                    className="brand-action-btn edit"
                                                    title="Edit Adjustment"
                                                >
                                                    <FontAwesomeIcon icon={faEdit} />
                                                </Link>
                                                <button
                                                    type="button"
                                                    className="brand-action-btn delete"
                                                    title="Delete Adjustment"
                                                    onClick={() => onClickDeleteModel(row.rawItem || row)}
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        /* LIST VIEW TABLE */
                        <div className="var-table-wrap" style={{ overflowX: 'auto', width: '100%' }}>
                            <table className="var-table" style={{ width: '100%', minWidth: '1380px', tableLayout: 'auto', borderCollapse: 'separate' }}>
                                <thead>
                                    <tr>
                                        <th style={{ width: '36px', whiteSpace: 'nowrap' }}>
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={selectedRows.length === filteredRows.length && filteredRows.length > 0}
                                                onChange={handleSelectAll}
                                            />
                                        </th>
                                        <th style={{ minWidth: '150px', whiteSpace: 'nowrap' }}>REFERENCE NO.</th>
                                        <th style={{ minWidth: '130px', whiteSpace: 'nowrap' }}>TYPE</th>
                                        <th style={{ minWidth: '170px', whiteSpace: 'nowrap' }}>WAREHOUSE</th>
                                        <th style={{ minWidth: '120px', whiteSpace: 'nowrap' }}>PRODUCTS</th>
                                        <th style={{ minWidth: '150px', whiteSpace: 'nowrap' }}>ADJUSTMENT VALUE</th>
                                        <th style={{ minWidth: '190px', whiteSpace: 'nowrap' }}>REASON</th>
                                        <th style={{ minWidth: '170px', whiteSpace: 'nowrap' }}>CREATED ON</th>
                                        <th style={{ minWidth: '130px', whiteSpace: 'nowrap' }}>CHANGED BY</th>
                                        <th style={{ textAlign: 'right', minWidth: '120px', paddingRight: '16px', whiteSpace: 'nowrap' }}>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedRows.length === 0 ? (
                                        <tr>
                                            <td colSpan="10" style={{ textAlign: 'center', padding: '60px 20px', border: 'none' }}>
                                                <div style={{ padding: '20px', textAlign: 'center' }}>
                                                    <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', margin: '0 auto 16px auto', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.12)' }}>
                                                        <FontAwesomeIcon icon={faBoxesStacked} />
                                                    </div>
                                                    <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                                                        No inventory adjustments found
                                                    </h3>
                                                    <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '420px', margin: '0 auto 22px auto', lineHeight: '1.55' }}>
                                                        {searchTerm || selectedWarehouse !== 'All' || selectedType !== 'All'
                                                            ? 'No adjustments match your active search or filter criteria. Try resetting filters.'
                                                            : 'Record inventory adjustments to reconcile stock counts, discrepancies, damages, or corrections.'}
                                                    </p>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Link
                                                            to="/app/adjustments/create"
                                                            className="unit-btn-pill unit-btn-primary"
                                                        >
                                                            <FontAwesomeIcon icon={faPlus} /> Create Adjustment
                                                        </Link>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedRows.map((row) => {
                                            const isSelected = selectedRows.includes(row.id);

                                            return (
                                                <tr key={row.id} style={{ background: isSelected ? '#F0FDF4' : 'transparent' }}>
                                                    <td style={{ whiteSpace: 'nowrap' }}>
                                                        <input
                                                            type="checkbox"
                                                            className="form-check-input"
                                                            checked={isSelected}
                                                            onChange={() => handleSelectRow(row.id)}
                                                        />
                                                    </td>
                                                    <td style={{ whiteSpace: 'nowrap' }}>
                                                        <span
                                                            style={{
                                                                display: 'inline-block',
                                                                padding: '3px 10px',
                                                                borderRadius: '8px',
                                                                fontSize: '12.5px',
                                                                fontWeight: '800',
                                                                background: '#EFF6FF',
                                                                color: '#2563EB',
                                                                border: '1px solid #BFDBFE',
                                                                fontFamily: 'monospace',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            {row.refCode}
                                                        </span>
                                                    </td>
                                                    <td style={{ whiteSpace: 'nowrap' }}>
                                                        {row.isAddition ? (
                                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '800', background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', whiteSpace: 'nowrap' }}>
                                                                <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#15803D' }}></span> Addition
                                                            </span>
                                                        ) : row.isSubtraction ? (
                                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '800', background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A', whiteSpace: 'nowrap' }}>
                                                                <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#D97706' }}></span> Subtraction
                                                            </span>
                                                        ) : (
                                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '800', background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', whiteSpace: 'nowrap' }}>
                                                                <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#2563EB' }}></span> {row.type}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td style={{ whiteSpace: 'nowrap' }}>
                                                        <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '13px', whiteSpace: 'nowrap' }}>
                                                            {row.warehouseName}
                                                        </div>
                                                    </td>
                                                    <td style={{ whiteSpace: 'nowrap' }}>
                                                        <span style={{
                                                            display: 'inline-block',
                                                            padding: '2px 8px',
                                                            borderRadius: '6px',
                                                            fontSize: '11.5px',
                                                            fontWeight: '700',
                                                            background: '#F8FAFC',
                                                            border: '1px solid #E2E8F0',
                                                            color: '#1E293B',
                                                            whiteSpace: 'nowrap'
                                                        }}>
                                                            {row.productsCount} Products
                                                        </span>
                                                    </td>
                                                    <td style={{ whiteSpace: 'nowrap' }}>
                                                        <span style={{ fontWeight: '800', fontSize: '13.5px', color: row.isAddition ? '#16A34A' : (row.isSubtraction ? '#DC2626' : '#0F172A'), whiteSpace: 'nowrap' }}>
                                                            {row.compactValue}
                                                        </span>
                                                    </td>
                                                    <td style={{ whiteSpace: 'nowrap' }}>
                                                        <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: '700', whiteSpace: 'nowrap' }}>
                                                            {row.reason}
                                                        </span>
                                                    </td>
                                                    <td style={{ whiteSpace: 'nowrap' }}>
                                                        <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#0F172A', whiteSpace: 'nowrap' }}>
                                                            {row.dateOnly}, {row.timeOnly}
                                                        </span>
                                                    </td>
                                                    <td style={{ whiteSpace: 'nowrap' }}>
                                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 8px', borderRadius: '6px', background: '#F1F5F9', fontSize: '12px', fontWeight: '700', color: '#334155', whiteSpace: 'nowrap' }}>
                                                            <FontAwesomeIcon icon={faUser} style={{ fontSize: '11px', color: '#64748B' }} />
                                                            <span>{row.changedBy}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: 'right', paddingRight: '16px', whiteSpace: 'nowrap' }}>
                                                        <div className="brand-card-actions" style={{ justifyContent: 'flex-end', gap: '4px' }}>
                                                            <button
                                                                type="button"
                                                                className="brand-action-btn"
                                                                title="View Details"
                                                                onClick={() => onClickDetailsModel(row)}
                                                            >
                                                                <FontAwesomeIcon icon={faEye} />
                                                            </button>
                                                            <Link
                                                                to={`/app/adjustments/${row.id}`}
                                                                className="brand-action-btn edit"
                                                                title="Edit Adjustment"
                                                            >
                                                                <FontAwesomeIcon icon={faEdit} />
                                                            </Link>
                                                            <button
                                                                type="button"
                                                                className="brand-action-btn delete"
                                                                title="Delete Adjustment"
                                                                onClick={() => onClickDeleteModel(row.rawItem || row)}
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

                    {/* ── 6. Pagination ────────────────────────────────── */}
                    <div className="var-pagination">
                        <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
                            Showing {totalFiltered > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + pageSize, totalFiltered)} of {totalFiltered} adjustments
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

            {/* Modals */}
            <DeleteSaleAdjustMents 
                onClickDeleteModel={onClickDeleteModel} 
                deleteModel={deleteModel} 
                onDelete={isDelete} 
            />
            <AdjustMentDetail 
                onClickDetailsModel={onClickDetailsModel} 
                detailsModel={detailsModel} 
                onDetails={isDetails} 
                setLgShow={setLgShow} 
                lgShow={lgShow} 
            />
        </MasterLayout>
    );
};

const mapStateToProps = (state) => {
    const { adjustments = [], totalRecord = 0, frontSetting, warehouses = [], isCallSaleApi, allConfigData, products = [] } = state;
    return { adjustments, totalRecord, frontSetting, warehouses, isCallSaleApi, allConfigData, products };
};

export default connect(mapStateToProps, { fetchAdjustments, fetchAllWarehouses, fetchFrontSetting, fetchProducts })(Adjustments);
