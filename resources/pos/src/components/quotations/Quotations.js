import React, { useEffect, useState, useMemo } from "react";
import moment from "moment";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import MasterLayout from "../MasterLayout";
import TabTitle from "../../shared/tab-title/TabTitle";
import DeleteQuotation from "./DeleteQuotation";
import { fetchSales } from "../../store/action/salesAction";
import {
    currencySymbolHandling,
    getFormattedDate,
    getFormattedMessage,
    placeholderText,
} from "../../shared/sharedMethod";
import { fetchFrontSetting } from "../../store/action/frontSettingAction";
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";
import { fetchQuotations } from "../../store/action/quotationAction";
import { quotationPdfAction } from "../../store/action/quotationPdfAction";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faFileInvoice,
    faClock,
    faCheckCircle,
    faIndianRupeeSign,
    faPlus,
    faSearch,
    faRotateLeft,
    faEye,
    faEdit,
    faFilePdf,
    faShoppingCart,
    faTrash,
    faStore,
    faList,
    faThLarge,
    faClipboardList,
} from '@fortawesome/free-solid-svg-icons';
import "../brands/ProductBrandsPremium.css";
import "../units/ProductUnitsPremium.css";
import "../variation/ProductVariationsPremium.css";
import "./ProductQuotationsPremium.css";
import LiveCounter from "../../shared/components/LiveCounter";
import LiveSparkline from "../../shared/components/LiveSparkline";
import { subscribePosDataChanged } from "../../shared/posEvents";

const Quotations = (props) => {
    const {
        totalRecord,
        quotationPdfAction,
        fetchFrontSetting,
        frontSetting,
        fetchQuotations,
        quotations,
        allConfigData,
    } = props;

    const [deleteModel, setDeleteModel] = useState(false);
    const [isDelete, setIsDelete] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [sortBy, setSortBy] = useState("newest");
    const [viewMode, setViewMode] = useState("list");
    const [selectedRows, setSelectedRows] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        fetchFrontSetting();
        const hasData = Array.isArray(quotations) && quotations.length > 0;
        fetchQuotations({}, !hasData);

        // Event-driven real-time sync
        const unsubscribe = subscribePosDataChanged(() => {
            fetchQuotations({}, false);
        });

        return () => unsubscribe();
    }, []);

    const currencySymbol =
        frontSetting &&
        frontSetting.value &&
        frontSetting.value.currency_symbol ? frontSetting.value.currency_symbol : '₹';

    const onClickDeleteModel = (isDelete = null) => {
        setDeleteModel(!deleteModel);
        setIsDelete(isDelete);
    };

    const onPdfClick = (id) => {
        quotationPdfAction(id);
    };

    // Safe array extraction from Redux quotations
    const realQuotationsList = useMemo(() => {
        if (Array.isArray(quotations)) return quotations;
        if (quotations && Array.isArray(quotations.data)) return quotations.data;
        return [];
    }, [quotations]);

    const totalCount = realQuotationsList.length;

    // Realtime Counts
    const sentCount = realQuotationsList.filter(
        (q) => (q?.attributes?.status || q?.status) === 1
    ).length;

    const pendingCount = realQuotationsList.filter(
        (q) => (q?.attributes?.status || q?.status) === 2
    ).length;

    const acceptedCount = realQuotationsList.filter(
        (q) => (q?.attributes?.status || q?.status) === 3
    ).length;

    const totalQuotationValue = realQuotationsList.reduce(
        (sum, q) => sum + Number(q?.attributes?.grand_total || q?.grand_total || 0),
        0
    );

    // Filter & Sort Logic
    const filteredQuotations = useMemo(() => {
        let list = realQuotationsList.filter((q) => {
            if (!q || !q.attributes) return false;
            const ref = q.attributes.reference_code || "";
            const cust = q.attributes.customer_name || "";
            const wh = q.attributes.warehouse_name || "";
            const query = searchQuery.trim().toLowerCase();
            const matchesQuery = !query || ref.toLowerCase().includes(query) || cust.toLowerCase().includes(query) || wh.toLowerCase().includes(query);

            if (statusFilter === "All") return matchesQuery;
            if (statusFilter === "Sent") return matchesQuery && q.attributes.status === 1;
            if (statusFilter === "Pending") return matchesQuery && q.attributes.status === 2;
            if (statusFilter === "Accepted") return matchesQuery && q.attributes.status === 3;
            return matchesQuery;
        });

        if (sortBy === 'oldest') {
            list.sort((a, b) => Number(a.id) - Number(b.id));
        } else if (sortBy === 'value') {
            list.sort((a, b) => Number(b.attributes?.grand_total || 0) - Number(a.attributes?.grand_total || 0));
        } else if (sortBy === 'customer') {
            list.sort((a, b) => (a.attributes?.customer_name || '').localeCompare(b.attributes?.customer_name || ''));
        } else {
            list.sort((a, b) => Number(b.id) - Number(a.id));
        }

        return list;
    }, [realQuotationsList, searchQuery, statusFilter, sortBy]);

    // Pagination
    const totalFiltered = filteredQuotations.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
    const validCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (validCurrentPage - 1) * pageSize;
    const paginatedQuotations = filteredQuotations.slice(startIndex, startIndex + pageSize);

    const handleReset = () => {
        setSearchQuery("");
        setStatusFilter("All");
        setSortBy("newest");
        setCurrentPage(1);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) setSelectedRows(filteredQuotations.map(i => i.id));
        else setSelectedRows([]);
    };

    const handleSelectRow = (id) => {
        setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
    };

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title={placeholderText("quotations.title")} />

            <div className="brand-page-container">

                {/* ── 1. Breadcrumb ─────────────────────────────────────────── */}
                <div className="brand-breadcrumb">
                    <span>Dashboard</span>
                    <span>&gt;</span>
                    <span>Sales</span>
                    <span>&gt;</span>
                    <span className="brand-crumb-active">Quotations</span>
                </div>

                {/* ── 2. Page Header ────────────────────────────────────────── */}
                <div className="brand-header">
                    <div className="brand-title-group">
                        <h1>Quotations</h1>
                        <p>Create, manage and monitor customer quotations before converting them into sales invoices.</p>
                    </div>

                    <div className="brand-header-actions">
                        <Link to="/app/quotations/create" className="unit-btn-pill unit-btn-primary">
                            <FontAwesomeIcon icon={faPlus} /> Create Quotation
                        </Link>
                    </div>
                </div>

                {/* ── 3. 4 Real KPI Summary Cards Grid ──────────────────────── */}
                <div className="brand-kpi-grid">
                    {/* Card 1: Total Quotations */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Total Quotations</span>
                            <div className="brand-kpi-icon green">
                                <FontAwesomeIcon icon={faFileInvoice} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={totalCount} isCurrency={false} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge up">
                                {totalCount > 0 ? `${totalCount} Active` : '0 Active'}
                            </span>
                            <LiveSparkline data={totalCount > 0 ? [Math.max(0, totalCount - 1), totalCount] : [0, 0]} color="#16A34A" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 2: Pending Quotations */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Pending Quotations</span>
                            <div className="brand-kpi-icon orange">
                                <FontAwesomeIcon icon={faClock} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={pendingCount} isCurrency={false} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge neutral">
                                {pendingCount > 0 ? `${pendingCount} Pending` : '0 Pending'}
                            </span>
                            <LiveSparkline data={pendingCount > 0 ? [Math.max(0, pendingCount - 1), pendingCount] : [0, 0]} color="#D97706" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 3: Accepted Quotations */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Accepted Quotations</span>
                            <div className="brand-kpi-icon purple">
                                <FontAwesomeIcon icon={faCheckCircle} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={acceptedCount} isCurrency={false} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge up">
                                {acceptedCount > 0 ? `${acceptedCount} Accepted` : '0 Accepted'}
                            </span>
                            <LiveSparkline data={acceptedCount > 0 ? [Math.max(0, acceptedCount - 1), acceptedCount] : [0, 0]} color="#9333EA" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 4: Quotation Value */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Quotation Value</span>
                            <div className="brand-kpi-icon blue">
                                <FontAwesomeIcon icon={faIndianRupeeSign} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={totalQuotationValue} isCurrency={true} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-label" style={{ fontSize: '13px', color: '#64748B', fontWeight: '700' }}>
                                Total Value
                            </span>
                            <LiveSparkline data={totalQuotationValue > 0 ? [Math.max(0, totalQuotationValue - 500), totalQuotationValue] : [0, 0]} color="#2563EB" width={60} height={24} />
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
                                placeholder="Search quotations by reference, customer, phone..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
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
                                <option value="All">Status: All</option>
                                <option value="Sent">Sent</option>
                                <option value="Pending">Pending</option>
                                <option value="Accepted">Accepted</option>
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
                                <option value="customer">Sort: Customer (A-Z)</option>
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
                                <FontAwesomeIcon icon={faRotateLeft} /> Reset
                            </button>
                        </div>
                    </div>

                    {/* ── 5. View Content: Table or Grid ───────────────── */}
                    {viewMode === 'grid' ? (
                        /* COMPACT ELEGANT GRID CARDS */
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                            {paginatedQuotations.length === 0 ? (
                                <div style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center' }}>
                                    <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px auto', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.12)' }}>
                                        <FontAwesomeIcon icon={faClipboardList} />
                                    </div>
                                    <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>No quotations found</h3>
                                    <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '400px', margin: '0 auto 20px auto' }}>Create your first sales quotation to start sending offers and converting them into sales.</p>
                                    <Link to="/app/quotations/create" className="unit-btn-pill unit-btn-primary">
                                        <FontAwesomeIcon icon={faPlus} /> Create Quotation
                                    </Link>
                                </div>
                            ) : (
                                paginatedQuotations.map((row) => {
                                    const attr = row?.attributes || {};
                                    const statusVal = attr.status;
                                    const statusText = statusVal === 1 ? 'Sent' : statusVal === 2 ? 'Pending' : statusVal === 3 ? 'Accepted' : 'Draft';
                                    const custName = attr.customer_name || 'Walk-in Customer';
                                    const itemCount = attr.quotation_items ? attr.quotation_items.length : 1;
                                    const refCode = attr.reference_code || `QT-00${row.id}`;

                                    return (
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
                                            {/* Row 1: Icon + Ref Code + Status Pill */}
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                                    <div style={{
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '10px',
                                                        background: statusVal === 3 ? '#DCFCE7' : (statusVal === 2 ? '#FEF3C7' : '#EFF6FF'),
                                                        color: statusVal === 3 ? '#15803D' : (statusVal === 2 ? '#D97706' : '#2563EB'),
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '14px',
                                                        flexShrink: 0
                                                    }}>
                                                        <FontAwesomeIcon icon={faFileInvoice} />
                                                    </div>
                                                    <div style={{ minWidth: 0 }}>
                                                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {refCode}
                                                        </div>
                                                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', whiteSpace: 'nowrap' }}>
                                                            {attr.warehouse_name || 'Suguna Warehouse'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <span className={`unit-status-pill ${statusVal === 3 ? 'active' : (statusVal === 2 ? 'draft' : 'default')}`} style={{ padding: '2px 8px', fontSize: '11px', fontWeight: '800', whiteSpace: 'nowrap' }}>
                                                    <span className="unit-dot" /> {statusText}
                                                </span>
                                            </div>

                                            {/* Row 2: Customer Name */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                                <span style={{ fontSize: '12px', color: '#0F172A', fontWeight: '700', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                                    {custName}
                                                </span>
                                            </div>

                                            {/* Row 3: Meta Strip */}
                                            <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '6px 10px', fontSize: '11px', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div>
                                                    <span style={{ fontWeight: '700', color: '#0F172A' }}>{itemCount} Products</span>
                                                </div>
                                                <div style={{ fontWeight: '800', color: '#16A34A', whiteSpace: 'nowrap' }}>
                                                    {currencySymbolHandling(allConfigData, currencySymbol, attr.grand_total)}
                                                </div>
                                            </div>

                                            {/* Row 4: Date + Actions */}
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid #F1F5F9' }}>
                                                <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '600' }}>
                                                    {getFormattedDate(attr.date || attr.created_at, allConfigData) || '30 Aug 2026'}
                                                </div>
                                                <div className="brand-card-actions" style={{ gap: '4px' }} onClick={e => e.stopPropagation()}>
                                                    <Link
                                                        to={`/app/quotations/detail/${row.id}`}
                                                        className="brand-action-btn"
                                                        title="View Details"
                                                    >
                                                        <FontAwesomeIcon icon={faEye} />
                                                    </Link>
                                                    <Link
                                                        to={`/app/quotations/edit/${row.id}`}
                                                        className="brand-action-btn edit"
                                                        title="Edit Quotation"
                                                    >
                                                        <FontAwesomeIcon icon={faEdit} />
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        className="brand-action-btn"
                                                        title="Print PDF"
                                                        onClick={() => onPdfClick(row.id)}
                                                    >
                                                        <FontAwesomeIcon icon={faFilePdf} />
                                                    </button>
                                                    <Link
                                                        to={`/app/quotations/Create_sale/${row.id}`}
                                                        className="brand-action-btn"
                                                        title="Convert to Sale"
                                                        style={{ color: '#16A34A' }}
                                                    >
                                                        <FontAwesomeIcon icon={faShoppingCart} />
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        className="brand-action-btn delete"
                                                        title="Delete Quotation"
                                                        onClick={() => onClickDeleteModel(row.id)}
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
                        /* LIST VIEW TABLE */
                        <div className="var-table-wrap" style={{ overflowX: 'auto', width: '100%' }}>
                            <table className="var-table" style={{ width: '100%', minWidth: '1380px', tableLayout: 'auto', borderCollapse: 'separate' }}>
                                <thead>
                                    <tr>
                                        <th style={{ width: "36px", whiteSpace: "nowrap" }}>
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={selectedRows.length === filteredQuotations.length && filteredQuotations.length > 0}
                                                onChange={handleSelectAll}
                                            />
                                        </th>
                                        <th style={{ minWidth: "150px", whiteSpace: "nowrap" }}>REFERENCE</th>
                                        <th style={{ minWidth: "190px", whiteSpace: "nowrap" }}>CUSTOMER</th>
                                        <th style={{ minWidth: "170px", whiteSpace: "nowrap" }}>WAREHOUSE</th>
                                        <th style={{ minWidth: "120px", whiteSpace: "nowrap" }}>ITEMS</th>
                                        <th style={{ minWidth: "130px", whiteSpace: "nowrap" }}>GRAND TOTAL</th>
                                        <th style={{ minWidth: "120px", whiteSpace: "nowrap" }}>STATUS</th>
                                        <th style={{ minWidth: "160px", whiteSpace: "nowrap" }}>CREATED DATE</th>
                                        <th style={{ textAlign: "right", minWidth: "160px", paddingRight: "16px", whiteSpace: "nowrap" }}>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedQuotations.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" style={{ textAlign: 'center', padding: '60px 20px', border: 'none' }}>
                                                <div style={{ padding: '20px', textAlign: 'center' }}>
                                                    <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', margin: '0 auto 16px auto', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.12)' }}>
                                                        <FontAwesomeIcon icon={faClipboardList} />
                                                    </div>
                                                    <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                                                        No quotations found
                                                    </h3>
                                                    <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '420px', margin: '0 auto 22px auto', lineHeight: '1.55' }}>
                                                        {searchQuery || statusFilter !== "All"
                                                            ? "No quotations match your active search or filter criteria. Try resetting filters."
                                                            : "Create your first sales quotation to start sending offers and converting them into customer invoices."}
                                                    </p>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Link
                                                            to="/app/quotations/create"
                                                            className="unit-btn-pill unit-btn-primary"
                                                        >
                                                            <FontAwesomeIcon icon={faPlus} /> Create Quotation
                                                        </Link>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedQuotations.map((row) => {
                                            const attr = row?.attributes || {};
                                            const statusVal = attr.status;
                                            const statusText = statusVal === 1 ? 'Sent' : statusVal === 2 ? 'Pending' : statusVal === 3 ? 'Accepted' : 'Draft';
                                            const custName = attr.customer_name || 'Walk-in Customer';
                                            const createdDate = getFormattedDate(attr.date || attr.created_at, allConfigData) || '30-08-2026';
                                            const createdTime = moment(attr.created_at || attr.date).format("hh:mm A") || '07:03 PM';
                                            const itemCount = attr.quotation_items ? attr.quotation_items.length : 1;
                                            const isSelected = selectedRows.includes(row.id);
                                            const refCode = attr.reference_code || `QT-00${row.id}`;

                                            return (
                                                <tr
                                                    key={row.id}
                                                    style={{ background: isSelected ? "#F0FDF4" : "transparent" }}
                                                >
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        <input
                                                            type="checkbox"
                                                            className="form-check-input"
                                                            checked={isSelected}
                                                            onChange={() => handleSelectRow(row.id)}
                                                        />
                                                    </td>
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        <Link
                                                            to={`/app/quotations/detail/${row.id}`}
                                                            style={{
                                                                display: "inline-block",
                                                                padding: "3px 10px",
                                                                borderRadius: "8px",
                                                                fontSize: "12.5px",
                                                                fontWeight: "800",
                                                                background: "#EFF6FF",
                                                                color: "#2563EB",
                                                                border: "1px solid #BFDBFE",
                                                                fontFamily: "monospace",
                                                                textDecoration: "none",
                                                                whiteSpace: "nowrap"
                                                            }}
                                                        >
                                                            {refCode}
                                                        </Link>
                                                    </td>
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '13px', whiteSpace: 'nowrap' }}>
                                                            {custName}
                                                        </div>
                                                    </td>
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '13px', whiteSpace: 'nowrap' }}>
                                                            {attr.warehouse_name || 'Suguna Warehouse'}
                                                        </div>
                                                    </td>
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        <span style={{
                                                            display: "inline-block",
                                                            padding: "2px 8px",
                                                            borderRadius: "6px",
                                                            fontSize: "11.5px",
                                                            fontWeight: "700",
                                                            background: "#F8FAFC",
                                                            border: "1px solid #E2E8F0",
                                                            color: "#1E293B",
                                                            whiteSpace: "nowrap"
                                                        }}>
                                                            {itemCount} Products
                                                        </span>
                                                    </td>
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        <span style={{ fontWeight: '800', fontSize: '13.5px', color: '#0F172A', whiteSpace: "nowrap" }}>
                                                            {currencySymbolHandling(allConfigData, currencySymbol, attr.grand_total)}
                                                        </span>
                                                    </td>
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        {statusVal === 3 ? (
                                                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: "800", background: "#DCFCE7", color: "#15803D", border: "1px solid #86EFAC", whiteSpace: "nowrap" }}>
                                                                <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#15803D" }}></span> Accepted
                                                            </span>
                                                        ) : statusVal === 2 ? (
                                                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: "800", background: "#FEF3C7", color: "#D97706", border: "1px solid #FDE68A", whiteSpace: "nowrap" }}>
                                                                <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#D97706" }}></span> Pending
                                                            </span>
                                                        ) : (
                                                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: "800", background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", whiteSpace: "nowrap" }}>
                                                                <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#2563EB" }}></span> {statusText}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#0F172A', whiteSpace: 'nowrap' }}>
                                                            {createdDate}, {createdTime}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: "right", paddingRight: "16px", whiteSpace: "nowrap" }}>
                                                        <div className="brand-card-actions" style={{ justifyContent: 'flex-end', gap: '4px' }}>
                                                            <Link
                                                                to={`/app/quotations/detail/${row.id}`}
                                                                className="brand-action-btn"
                                                                title="View Details"
                                                            >
                                                                <FontAwesomeIcon icon={faEye} />
                                                            </Link>
                                                            <Link
                                                                to={`/app/quotations/edit/${row.id}`}
                                                                className="brand-action-btn edit"
                                                                title="Edit Quotation"
                                                            >
                                                                <FontAwesomeIcon icon={faEdit} />
                                                            </Link>
                                                            <button
                                                                type="button"
                                                                className="brand-action-btn"
                                                                title="Print PDF"
                                                                onClick={() => onPdfClick(row.id)}
                                                            >
                                                                <FontAwesomeIcon icon={faFilePdf} />
                                                            </button>
                                                            <Link
                                                                to={`/app/quotations/Create_sale/${row.id}`}
                                                                className="brand-action-btn"
                                                                title="Convert to Sale"
                                                                style={{ color: '#16A34A' }}
                                                            >
                                                                <FontAwesomeIcon icon={faShoppingCart} />
                                                            </Link>
                                                            <button
                                                                type="button"
                                                                className="brand-action-btn delete"
                                                                title="Delete Quotation"
                                                                onClick={() => onClickDeleteModel(row.id)}
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
                            Showing {totalFiltered > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + pageSize, totalFiltered)} of {totalFiltered} quotations
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

            <DeleteQuotation
                onClickDeleteModel={onClickDeleteModel}
                deleteModel={deleteModel}
                onDelete={isDelete}
            />
        </MasterLayout>
    );
};

const mapStateToProps = (state) => {
    const {
        sales,
        totalRecord,
        frontSetting,
        isCallSaleApi,
        quotations,
        allConfigData,
    } = state;
    return {
        sales,
        totalRecord,
        frontSetting,
        isCallSaleApi,
        quotations,
        allConfigData,
    };
};

export default connect(mapStateToProps, {
    fetchSales,
    fetchFrontSetting,
    fetchQuotations,
    quotationPdfAction,
})(Quotations);
