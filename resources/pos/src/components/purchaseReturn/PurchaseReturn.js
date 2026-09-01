import React, { useEffect, useState, useMemo } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import moment from "moment";
import MasterLayout from "../MasterLayout";
import TabTitle from "../../shared/tab-title/TabTitle";
import { fetchPurchasesReturn } from "../../store/action/purchaseReturnAction";
import DeletePurchaseReturn from "./DeletePurchaseReturn";
import { fetchAllSuppliers } from "../../store/action/supplierAction";
import { fetchAllWarehouses } from "../../store/action/warehouseAction";
import {
    currencySymbolHandling,
    placeholderText,
    getFormattedDate,
} from "../../shared/sharedMethod";
import { purchaseReturnPdfAction } from "../../store/action/purchaseReturnPdfAction";
import { fetchFrontSetting } from "../../store/action/frontSettingAction";
import ShowPayment from "../../shared/showPayment/ShowPayment";
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUndo,
    faClock,
    faCheckCircle,
    faIndianRupeeSign,
    faPlus,
    faSearch,
    faRotateLeft,
    faEye,
    faEdit,
    faFilePdf,
    faTrash,
    faStore,
    faList,
    faThLarge,
    faBoxesPacking
} from '@fortawesome/free-solid-svg-icons';
import "../brands/ProductBrandsPremium.css";
import "../units/ProductUnitsPremium.css";
import "../variation/ProductVariationsPremium.css";
import "./PurchaseReturnPremium.css";
import { subscribePosDataChanged } from "../../shared/posEvents";
import LiveCounter from "../../shared/components/LiveCounter";
import LiveSparkline from "../../shared/components/LiveSparkline";

const PurchaseReturn = (props) => {
    const {
        fetchPurchasesReturn,
        fetchAllWarehouses,
        fetchAllSuppliers,
        purchaseReturn,
        totalRecord,
        isLoading,
        suppliers = [],
        purchaseReturnPdfAction,
        fetchFrontSetting,
        frontSetting,
        allConfigData,
    } = props;

    const [deleteModel, setDeleteModel] = useState(false);
    const [isDelete, setIsDelete] = useState(null);
    const [isShowPaymentModel, setIsShowPaymentModel] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [sortBy, setSortBy] = useState("newest");
    const [viewMode, setViewMode] = useState("list");
    const [selectedRows, setSelectedRows] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        fetchFrontSetting();
        fetchAllSuppliers();
        fetchAllWarehouses();
        fetchPurchasesReturn({}, true);

        // Event-driven real-time sync
        const unsubscribe = subscribePosDataChanged(() => {
            fetchPurchasesReturn({}, false);
        });

        return () => unsubscribe();
    }, []);

    const onClickDeleteModel = (isDelete = null) => {
        setDeleteModel(!deleteModel);
        setIsDelete(isDelete);
    };

    const onPurchaseReturnPdf = (id) => {
        purchaseReturnPdfAction(id);
    };

    const onShowPaymentClick = () => {
        setIsShowPaymentModel(!isShowPaymentModel);
    };

    const currencySymbol =
        (frontSetting && frontSetting.value && frontSetting.value.currency_symbol) || '₹';

    // Safe array extraction
    const realReturnList = useMemo(() => {
        if (Array.isArray(purchaseReturn)) return purchaseReturn;
        if (purchaseReturn && Array.isArray(purchaseReturn.data)) return purchaseReturn.data;
        return [];
    }, [purchaseReturn]);

    const totalCount = realReturnList.length;

    const receivedCount = realReturnList.filter(
        (r) => (r?.attributes?.status || r?.status) === 1
    ).length;

    const pendingCount = realReturnList.filter(
        (r) => (r?.attributes?.status || r?.status) === 2
    ).length;

    const totalReturnValue = realReturnList.reduce(
        (sum, r) => sum + Number(r?.attributes?.grand_total || r?.grand_total || 0),
        0
    );

    // Filter & Sort Logic
    const filteredReturns = useMemo(() => {
        let list = realReturnList.filter((r) => {
            if (!r || !r.attributes) return false;
            const ref = r.attributes.reference_code || "";
            const wh = r.attributes.warehouse_name || "";
            const supplierObj = suppliers.find((s) => s.id === r.attributes.supplier_id);
            const suppName = supplierObj?.attributes?.name || r.attributes.supplier_name || "";
            const query = searchQuery.trim().toLowerCase();

            const matchesQuery =
                !query ||
                ref.toLowerCase().includes(query) ||
                wh.toLowerCase().includes(query) ||
                suppName.toLowerCase().includes(query);

            if (statusFilter === "All") return matchesQuery;
            if (statusFilter === "Received") return matchesQuery && r.attributes.status === 1;
            if (statusFilter === "Pending") return matchesQuery && r.attributes.status === 2;
            return matchesQuery;
        });

        if (sortBy === 'oldest') {
            list.sort((a, b) => Number(a.id) - Number(b.id));
        } else if (sortBy === 'value') {
            list.sort((a, b) => Number(b.attributes?.grand_total || 0) - Number(a.attributes?.grand_total || 0));
        } else if (sortBy === 'supplier') {
            list.sort((a, b) => (a.attributes?.supplier_name || '').localeCompare(b.attributes?.supplier_name || ''));
        } else {
            list.sort((a, b) => Number(b.id) - Number(a.id));
        }

        return list;
    }, [realReturnList, searchQuery, statusFilter, sortBy, suppliers]);

    // Pagination
    const totalFiltered = filteredReturns.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
    const validCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (validCurrentPage - 1) * pageSize;
    const paginatedReturns = filteredReturns.slice(startIndex, startIndex + pageSize);

    const handleReset = () => {
        setSearchQuery("");
        setStatusFilter("All");
        setSortBy("newest");
        setCurrentPage(1);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) setSelectedRows(filteredReturns.map(i => i.id));
        else setSelectedRows([]);
    };

    const handleSelectRow = (id) => {
        setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
    };

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title={placeholderText("purchases.return.title")} />

            <div className="brand-page-container">

                {/* ── 1. Breadcrumb ─────────────────────────────────────────── */}
                <div className="brand-breadcrumb">
                    <span>Dashboard</span>
                    <span>&gt;</span>
                    <span>Purchases</span>
                    <span>&gt;</span>
                    <span className="brand-crumb-active">Purchase Returns</span>
                </div>

                {/* ── 2. Page Header ────────────────────────────────────────── */}
                <div className="brand-header">
                    <div className="brand-title-group">
                        <h1>Purchase Returns</h1>
                        <p>Manage, track and process returns of purchased inventory to suppliers.</p>
                    </div>

                    <div className="brand-header-actions">
                        <Link to="/app/purchase-return/create" className="unit-btn-pill unit-btn-primary">
                            <FontAwesomeIcon icon={faPlus} /> Create Purchase Return
                        </Link>
                    </div>
                </div>

                {/* ── 3. 4 Real KPI Summary Cards Grid ──────────────────────── */}
                <div className="brand-kpi-grid">
                    {/* Card 1: Total Returns */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Total Returns</span>
                            <div className="brand-kpi-icon orange">
                                <FontAwesomeIcon icon={faUndo} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={totalCount} isCurrency={false} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge up">
                                {totalCount > 0 ? `${totalCount} Active` : '0 Active'}
                            </span>
                            <LiveSparkline data={totalCount > 0 ? [Math.max(0, totalCount - 1), totalCount] : [0, 0]} color="#D97706" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 2: Received / Completed */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Received / Completed</span>
                            <div className="brand-kpi-icon green">
                                <FontAwesomeIcon icon={faCheckCircle} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={receivedCount} isCurrency={false} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge up">
                                {receivedCount > 0 ? `${receivedCount} Completed` : '0 Completed'}
                            </span>
                            <LiveSparkline data={receivedCount > 0 ? [Math.max(0, receivedCount - 1), receivedCount] : [0, 0]} color="#16A34A" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 3: Pending Returns */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Pending Returns</span>
                            <div className="brand-kpi-icon blue">
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
                            <LiveSparkline data={pendingCount > 0 ? [Math.max(0, pendingCount - 1), pendingCount] : [0, 0]} color="#2563EB" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 4: Total Return Value */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Total Return Value</span>
                            <div className="brand-kpi-icon purple">
                                <FontAwesomeIcon icon={faIndianRupeeSign} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={totalReturnValue} isCurrency={true} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-label" style={{ fontSize: '13px', color: '#64748B', fontWeight: '700' }}>
                                Total Value
                            </span>
                            <LiveSparkline data={totalReturnValue > 0 ? [Math.max(0, totalReturnValue - 500), totalReturnValue] : [0, 0]} color="#9333EA" width={60} height={24} />
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
                                placeholder="Search by reference, supplier or warehouse..."
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
                                <option value="Received">Received</option>
                                <option value="Pending">Pending</option>
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
                                <option value="supplier">Sort: Supplier (A-Z)</option>
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
                        /* GRID VIEW CARDS */
                        <div className="brand-cards-grid">
                            {paginatedReturns.length === 0 ? (
                                <div style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center' }}>
                                    <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px auto' }}>
                                        <FontAwesomeIcon icon={faUndo} />
                                    </div>
                                    <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>No purchase returns found</h3>
                                    <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '400px', margin: '0 auto 20px auto' }}>Create a purchase return to start tracking items returned to suppliers.</p>
                                    <Link to="/app/purchase-return/create" className="unit-btn-pill unit-btn-primary">
                                        <FontAwesomeIcon icon={faPlus} /> Create Purchase Return
                                    </Link>
                                </div>
                            ) : (
                                paginatedReturns.map((row) => {
                                    const attr = row?.attributes || {};
                                    const statusVal = attr.status;
                                    const statusText = statusVal === 1 ? 'Received' : statusVal === 2 ? 'Pending' : 'Ordered';
                                    const supplierObj = suppliers.find((s) => s.id === attr.supplier_id);
                                    const suppName = supplierObj?.attributes?.name || attr.supplier_name || 'Supplier';

                                    return (
                                        <div key={row.id} className="brand-card-item">
                                            <div className="brand-logo-container" style={{ background: '#FEF3C7', color: '#D97706' }}>
                                                <FontAwesomeIcon icon={faUndo} style={{ fontSize: '24px' }} />
                                            </div>
                                            <div className="brand-card-title">{attr.reference_code || `PR_00${row.id}`}</div>
                                            <div className="d-flex align-items-center justify-content-center gap-2 my-2">
                                                <span className={`unit-status-pill ${statusVal === 1 ? 'active' : (statusVal === 2 ? 'draft' : 'default')}`}>
                                                    <span className="unit-dot" /> {statusText}
                                                </span>
                                                <span className="unit-base-badge">{suppName}</span>
                                            </div>
                                            <div className="brand-card-stats">
                                                <div className="brand-stat-item">
                                                    <div className="brand-stat-val">{attr.warehouse_name || 'Warehouse'}</div>
                                                    <div className="brand-stat-lbl">Location</div>
                                                </div>
                                                <div style={{ width: '1px', height: '24px', background: '#F1F5F9' }} />
                                                <div className="brand-stat-item">
                                                    <div className="brand-stat-val text-success">
                                                        {currencySymbolHandling(allConfigData, currencySymbol, attr.grand_total)}
                                                    </div>
                                                    <div className="brand-stat-lbl">Total Value</div>
                                                </div>
                                            </div>
                                            <div className="brand-card-actions">
                                                <Link
                                                    to={`/app/purchase-return/detail/${row.id}`}
                                                    className="brand-action-btn"
                                                    title="View Details"
                                                >
                                                    <FontAwesomeIcon icon={faEye} />
                                                </Link>
                                                <Link
                                                    to={`/app/purchase-return/edit/${row.id}`}
                                                    className="brand-action-btn edit"
                                                    title="Edit Return"
                                                >
                                                    <FontAwesomeIcon icon={faEdit} />
                                                </Link>
                                                <button
                                                    type="button"
                                                    className="brand-action-btn"
                                                    title="Print PDF"
                                                    onClick={() => onPurchaseReturnPdf(row.id)}
                                                >
                                                    <FontAwesomeIcon icon={faFilePdf} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="brand-action-btn delete"
                                                    title="Delete"
                                                    onClick={() => onClickDeleteModel(row.id)}
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
                                        <th style={{ width: "40px" }}>
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={selectedRows.length === filteredReturns.length && filteredReturns.length > 0}
                                                onChange={handleSelectAll}
                                            />
                                        </th>
                                        <th>REFERENCE</th>
                                        <th>SUPPLIER</th>
                                        <th>WAREHOUSE</th>
                                        <th>GRAND TOTAL</th>
                                        <th>STATUS</th>
                                        <th>PAYMENT TYPE</th>
                                        <th>CREATED DATE</th>
                                        <th style={{ textAlign: "right" }}>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedReturns.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" style={{ textAlign: 'center', padding: '60px 20px', border: 'none' }}>
                                                <div style={{ padding: '20px', textAlign: 'center' }}>
                                                    <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', margin: '0 auto 16px auto', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.12)' }}>
                                                        <FontAwesomeIcon icon={faUndo} />
                                                    </div>
                                                    <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                                                        No purchase returns found
                                                    </h3>
                                                    <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '420px', margin: '0 auto 22px auto', lineHeight: '1.55' }}>
                                                        {searchQuery || statusFilter !== "All"
                                                            ? "No purchase returns match your active search or filter criteria. Try resetting filters."
                                                            : "Create a purchase return to start tracking items returned to suppliers."}
                                                    </p>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Link
                                                            to="/app/purchase-return/create"
                                                            className="unit-btn-pill unit-btn-primary"
                                                        >
                                                            <FontAwesomeIcon icon={faPlus} /> Create Purchase Return
                                                        </Link>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedReturns.map((row) => {
                                            const attr = row?.attributes || {};
                                            const statusVal = attr.status;
                                            const statusText = statusVal === 1 ? 'Received' : statusVal === 2 ? 'Pending' : 'Ordered';

                                            const supplierObj = suppliers.find((s) => s.id === attr.supplier_id);
                                            const suppName = supplierObj?.attributes?.name || attr.supplier_name || 'Supplier';
                                            const initials = suppName.slice(0, 2).toUpperCase();

                                            const createdDate = getFormattedDate(attr.date, allConfigData) || '26 Jul 2026';
                                            const createdTime = moment(attr.created_at).format("LT") || '05:05 PM';
                                            const isSelected = selectedRows.includes(row.id);

                                            return (
                                                <tr
                                                    key={row.id}
                                                    style={{ background: isSelected ? "#F0FDF4" : "transparent" }}
                                                >
                                                    <td>
                                                        <input
                                                            type="checkbox"
                                                            className="form-check-input"
                                                            checked={isSelected}
                                                            onChange={() => handleSelectRow(row.id)}
                                                        />
                                                    </td>
                                                    <td>
                                                        <Link
                                                            to={`/app/purchase-return/detail/${row.id}`}
                                                            className="unit-short-badge font-monospace text-decoration-none"
                                                            style={{ fontWeight: "800" }}
                                                        >
                                                            {attr.reference_code || `PR_00${row.id}`}
                                                        </Link>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#DCFCE7', color: '#16A34A', fontWeight: '800', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                {initials}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '13px' }}>{suppName}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-1.5" style={{ fontSize: '13px', color: '#334155' }}>
                                                            <FontAwesomeIcon icon={faStore} style={{ color: '#94A3B8', fontSize: '11px' }} />
                                                            <span>{attr.warehouse_name || 'Main Warehouse'}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span style={{ fontWeight: '800', fontSize: '13.5px', color: '#0F172A' }}>
                                                            {currencySymbolHandling(allConfigData, currencySymbol, attr.grand_total)}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`unit-status-pill ${statusVal === 1 ? 'active' : (statusVal === 2 ? 'draft' : 'default')}`}>
                                                            <span className="unit-dot" /> {statusText}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="cat-badge count">{attr.payment_type || 'Cash'}</span>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A', lineHeight: '1.2' }}>{createdDate}</div>
                                                            <div style={{ fontSize: '11px', color: '#64748B', lineHeight: '1.2' }}>{createdTime}</div>
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: "right" }}>
                                                        <div className="brand-card-actions" style={{ justifyContent: 'flex-end' }}>
                                                            <Link
                                                                to={`/app/purchase-return/detail/${row.id}`}
                                                                className="brand-action-btn"
                                                                title="View Details"
                                                            >
                                                                <FontAwesomeIcon icon={faEye} />
                                                            </Link>
                                                            <Link
                                                                to={`/app/purchase-return/edit/${row.id}`}
                                                                className="brand-action-btn edit"
                                                                title="Edit Return"
                                                            >
                                                                <FontAwesomeIcon icon={faEdit} />
                                                            </Link>
                                                            <button
                                                                type="button"
                                                                className="brand-action-btn"
                                                                title="Print PDF"
                                                                onClick={() => onPurchaseReturnPdf(row.id)}
                                                            >
                                                                <FontAwesomeIcon icon={faFilePdf} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="brand-action-btn delete"
                                                                title="Delete"
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
                            Showing {totalFiltered > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + pageSize, totalFiltered)} of {totalFiltered} purchase returns
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

            <DeletePurchaseReturn
                onClickDeleteModel={onClickDeleteModel}
                deleteModel={deleteModel}
                onDelete={isDelete}
            />
            <ShowPayment
                onShowPaymentClick={onShowPaymentClick}
                isShowPaymentModel={isShowPaymentModel}
            />
        </MasterLayout>
    );
};

const mapStateToProps = (state) => {
    const {
        purchaseReturn,
        totalRecord,
        isLoading,
        warehouses,
        suppliers,
        frontSetting,
        allConfigData,
    } = state;
    return {
        purchaseReturn,
        totalRecord,
        isLoading,
        warehouses,
        suppliers,
        frontSetting,
        allConfigData,
    };
};

export default connect(mapStateToProps, {
    fetchPurchasesReturn,
    fetchAllWarehouses,
    purchaseReturnPdfAction,
    fetchAllSuppliers,
    fetchFrontSetting,
})(PurchaseReturn);
