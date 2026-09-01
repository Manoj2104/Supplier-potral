import React, { useEffect, useState, useMemo } from "react";
import MasterLayout from "../MasterLayout";
import { connect, useDispatch } from "react-redux";
import { useLocation, Link } from "react-router-dom";
import moment from "moment";
import TabTitle from "../../shared/tab-title/TabTitle";
import { fetchPurchases } from "../../store/action/purchaseAction";
import DeletePurchase from "./DeletePurchase";
import { fetchAllSuppliers } from "../../store/action/supplierAction";
import { fetchAllWarehouses } from "../../store/action/warehouseAction";
import {
    currencySymbolHandling,
    placeholderText,
    getFormattedDate,
} from "../../shared/sharedMethod";
import { purchasePdfAction } from "../../store/action/purchasePdfAction";
import { fetchFrontSetting } from "../../store/action/frontSettingAction";
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus,
    faClock,
    faRotateLeft,
    faEye,
    faEdit,
    faFilePdf,
    faTrash,
    faStore,
    faCheckCircle,
    faClipboardList,
    faSearch,
    faWallet,
    faList,
    faThLarge,
    faIndianRupeeSign
} from "@fortawesome/free-solid-svg-icons";
import "../brands/ProductBrandsPremium.css";
import "../units/ProductUnitsPremium.css";
import "../variation/ProductVariationsPremium.css";
import "./ProductPurchasesPremium.css";
import { subscribePosDataChanged } from "../../shared/posEvents";
import LiveCounter from "../../shared/components/LiveCounter";
import LiveSparkline from "../../shared/components/LiveSparkline";

const Purchases = (props) => {
    const {
        fetchPurchases,
        fetchAllWarehouses,
        fetchAllSuppliers,
        purchases,
        totalRecord,
        suppliers = [],
        warehouses = [],
        purchasePdfAction,
        frontSetting,
        fetchFrontSetting,
        allConfigData,
    } = props;

    const dispatch = useDispatch();
    const location = useLocation();
    const [highlightPoId, setHighlightPoId] = useState(location.state?.newPoId || null);
    const [deleteModel, setDeleteModel] = useState(false);
    const [isDelete, setIsDelete] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [supplierFilter, setSupplierFilter] = useState("All");
    const [warehouseFilter, setWarehouseFilter] = useState("All");
    const [sortBy, setSortBy] = useState("newest");
    const [viewMode, setViewMode] = useState("list");
    const [selectedRows, setSelectedRows] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        if (location.state?.newPoId) {
            window.scrollTo({ top: 0, behavior: "smooth" });
            const timer = setTimeout(() => {
                setHighlightPoId(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [location.state]);

    useEffect(() => {
        fetchFrontSetting();
        fetchAllSuppliers();
        fetchAllWarehouses();
        const hasData = Array.isArray(purchases) && purchases.length > 0;
        fetchPurchases({ pageSize: 100 }, !hasData);

        // 1. Event-driven real-time sync (BroadcastChannel & internal events)
        const unsubscribe = subscribePosDataChanged(() => {
            fetchPurchases({ pageSize: 100 }, false);
        });

        // 2. Storage event listener for cross-tab sync
        const handleStorage = (e) => {
            if (e.key === 'infypos_sync_pulse' || e.key === 'pos_realtime_event' || e.key === 'infy_purchase_sync') {
                fetchPurchases({ pageSize: 100 }, false);
            }
        };
        window.addEventListener('storage', handleStorage);

        // 3. Tab focus / visibility sync (instantly refreshes whenever user switches back to this tab)
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                fetchPurchases({ pageSize: 100 }, false);
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        window.addEventListener('focus', handleVisibility);

        // 4. Background polling sync (every 10s)
        const interval = setInterval(() => {
            fetchPurchases({ pageSize: 100 }, false);
        }, 10000);

        return () => {
            unsubscribe();
            window.removeEventListener('storage', handleStorage);
            document.removeEventListener('visibilitychange', handleVisibility);
            window.removeEventListener('focus', handleVisibility);
            clearInterval(interval);
        };
    }, []);

    const currencySymbol =
        frontSetting &&
        frontSetting.value &&
        frontSetting.value.currency_symbol ? frontSetting.value.currency_symbol : "₹";

    const onClickDeleteModel = (item = null) => {
        const targetId = typeof item === 'object' ? (item?.id || item?.attributes?.id) : item;
        if (targetId) {
            setDeleteModel(!deleteModel);
            setIsDelete(targetId);
        } else {
            setDeleteModel(!deleteModel);
        }
    };

    const onPdfClick = (item) => {
        const targetId = typeof item === 'object' ? (item?.id || item?.attributes?.id) : item;
        if (targetId && targetId !== 'undefined') {
            dispatch(purchasePdfAction(targetId));
        }
    };

    // 100% REAL DATABASE DATA EXTRACTION
    const rawList = useMemo(() => {
        if (Array.isArray(purchases)) return purchases;
        if (purchases && Array.isArray(purchases.data)) return purchases.data;
        return [];
    }, [purchases]);

    const realPurchasesList = useMemo(() => {
        return rawList.slice().sort((a, b) => {
            const timeA = a.attributes?.created_at ? new Date(a.attributes.created_at).getTime() : Number(a.id || 0);
            const timeB = b.attributes?.created_at ? new Date(b.attributes.created_at).getTime() : Number(b.id || 0);
            return timeB - timeA;
        });
    }, [rawList]);

    const getPoNumber = (p) => {
        const rawRef = p?.attributes?.reference_code;
        if (rawRef && rawRef.startsWith("PO-")) {
            return rawRef;
        }
        const cleanId = p?.id || (rawRef ? rawRef.replace(/\D/g, "") : "1");
        return `PO-2026-${String(cleanId).padStart(6, '0')}`;
    };

    // Filter real database purchases by user controls
    const filteredPurchases = useMemo(() => {
        let list = realPurchasesList.filter((p) => {
            if (!p) return false;
            const attr = p.attributes || p;
            const ref = getPoNumber(p);
            const supplierObj = suppliers.find((s) => String(s.id) === String(attr.supplier_id));
            const supplierName = supplierObj?.attributes?.name || supplierObj?.name || attr.supplier_name || "Supplier";
            const warehouseName = attr.warehouse_name || "Main Warehouse";
            const query = searchQuery.toLowerCase().trim();

            const matchesQuery =
                !query ||
                ref.toLowerCase().includes(query) ||
                supplierName.toLowerCase().includes(query) ||
                warehouseName.toLowerCase().includes(query);

            if (statusFilter !== "All") {
                const st = Number(attr.status);
                if (statusFilter === "Approved" && st !== 1) return false;
                if (statusFilter === "Pending" && st !== 2 && st !== 0) return false;
                if (statusFilter === "Partial" && st !== 3) return false;
                if (statusFilter === "Cancelled" && st !== 4) return false;
            }

            if (supplierFilter !== "All" && supplierName !== supplierFilter) return false;
            if (warehouseFilter !== "All" && warehouseName !== warehouseFilter) return false;

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
    }, [realPurchasesList, searchQuery, statusFilter, supplierFilter, warehouseFilter, sortBy, suppliers]);

    // Pagination
    const totalFiltered = filteredPurchases.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
    const validCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (validCurrentPage - 1) * pageSize;
    const paginatedPurchases = filteredPurchases.slice(startIndex, startIndex + pageSize);

    // Metrics
    const totalCount = realPurchasesList.length;
    const pendingApprovalCount = realPurchasesList.filter(p => {
        const attr = p?.attributes || p;
        const st = Number(attr?.status);
        const rawSt = String(attr?.status || '').toLowerCase();
        return st === 2 || st === 3 || rawSt === 'pending' || rawSt === 'ordered';
    }).length;
    const approvedCount = realPurchasesList.filter(p => {
        const attr = p?.attributes || p;
        const st = Number(attr?.status);
        const rawSt = String(attr?.status || '').toLowerCase();
        return st === 1 || rawSt === 'approved' || rawSt === 'received' || rawSt === 'accepted';
    }).length;
    const totalPoValueSum = realPurchasesList.reduce((acc, p) => {
        const attr = p?.attributes || p;
        return acc + Number(attr?.grand_total || 0);
    }, 0);

    const handleReset = () => {
        setSearchQuery("");
        setStatusFilter("All");
        setSupplierFilter("All");
        setWarehouseFilter("All");
        setSortBy("newest");
        setCurrentPage(1);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) setSelectedRows(filteredPurchases.map(p => p.id));
        else setSelectedRows([]);
    };

    const handleToggleRow = (id) => {
        setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
    };

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title="Purchase Orders | Enterprise Procurement Workspace" />

            <div className="brand-page-container">

                {/* ── 1. Breadcrumb ─────────────────────────────────────────── */}
                <div className="brand-breadcrumb">
                    <span>Dashboard</span>
                    <span>&gt;</span>
                    <span>Purchases</span>
                    <span>&gt;</span>
                    <span className="brand-crumb-active">Purchase Orders</span>
                </div>

                {/* ── 2. Page Header ────────────────────────────────────────── */}
                <div className="brand-header">
                    <div className="brand-title-group">
                        <h1>Purchase Orders</h1>
                        <p>Create, approve, track and manage supplier purchase orders from a centralized enterprise workspace.</p>
                    </div>

                    <div className="brand-header-actions">
                        <Link to="/app/purchases/create" className="unit-btn-pill unit-btn-primary">
                            <FontAwesomeIcon icon={faPlus} /> Create Purchase Order
                        </Link>
                    </div>
                </div>

                {/* ── 3. 4 Real KPI Summary Cards Grid ──────────────────────── */}
                <div className="brand-kpi-grid">
                    {/* Card 1: Total Purchase Orders */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Total Purchase Orders</span>
                            <div className="brand-kpi-icon blue">
                                <FontAwesomeIcon icon={faClipboardList} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={totalCount} isCurrency={false} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge up">
                                {totalCount > 0 ? `${totalCount} Active` : '0 Active'}
                            </span>
                            <LiveSparkline data={totalCount > 0 ? [Math.max(0, totalCount - 1), totalCount] : [0, 0]} color="#2563EB" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 2: Pending Approval */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Pending Approval</span>
                            <div className="brand-kpi-icon orange">
                                <FontAwesomeIcon icon={faClock} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={pendingApprovalCount} isCurrency={false} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge neutral">
                                {pendingApprovalCount > 0 ? `${pendingApprovalCount} Pending` : '0 Pending'}
                            </span>
                            <LiveSparkline data={pendingApprovalCount > 0 ? [Math.max(0, pendingApprovalCount - 1), pendingApprovalCount] : [0, 0]} color="#D97706" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 3: Approved Orders */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Approved Orders</span>
                            <div className="brand-kpi-icon green">
                                <FontAwesomeIcon icon={faCheckCircle} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={approvedCount} isCurrency={false} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge up">
                                {approvedCount > 0 ? `${approvedCount} Approved` : '0 Approved'}
                            </span>
                            <LiveSparkline data={approvedCount > 0 ? [Math.max(0, approvedCount - 1), approvedCount] : [0, 0]} color="#16A34A" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 4: Total Purchase Value */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Total Purchase Value</span>
                            <div className="brand-kpi-icon purple">
                                <FontAwesomeIcon icon={faWallet} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={totalPoValueSum} isCurrency={true} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-label" style={{ fontSize: '13px', color: '#64748B', fontWeight: '700' }}>
                                Total Spend
                            </span>
                            <LiveSparkline data={totalPoValueSum > 0 ? [Math.max(0, totalPoValueSum - 500), totalPoValueSum] : [0, 0]} color="#9333EA" width={60} height={24} />
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
                                placeholder="Search PO number, supplier name, warehouse..."
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
                                value={supplierFilter}
                                onChange={(e) => {
                                    setSupplierFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="All">Supplier: All</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.attributes?.name || s.name}>
                                        {s.attributes?.name || s.name}
                                    </option>
                                ))}
                            </select>

                            <select
                                className="var-select-sm"
                                value={warehouseFilter}
                                onChange={(e) => {
                                    setWarehouseFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="All">Warehouse: All</option>
                                {warehouses.map(w => (
                                    <option key={w.id} value={w.attributes?.name || w.name}>
                                        {w.attributes?.name || w.name}
                                    </option>
                                ))}
                            </select>

                            <select
                                className="var-select-sm"
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="All">Status: All</option>
                                <option value="Approved">Approved</option>
                                <option value="Pending">Pending</option>
                                <option value="Partial">Partially Received</option>
                                <option value="Cancelled">Cancelled</option>
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
                        /* COMPACT ELEGANT GRID CARDS */
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                            {paginatedPurchases.length === 0 ? (
                                <div style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center' }}>
                                    <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px auto', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.12)' }}>
                                        <FontAwesomeIcon icon={faClipboardList} />
                                    </div>
                                    <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>No purchase orders found</h3>
                                    <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '400px', margin: '0 auto 20px auto' }}>Create your first purchase order to start receiving inventory from suppliers.</p>
                                    <Link to="/app/purchases/create" className="unit-btn-pill unit-btn-primary">
                                        <FontAwesomeIcon icon={faPlus} /> Create Purchase Order
                                    </Link>
                                </div>
                            ) : (
                                paginatedPurchases.map((p) => {
                                    const attr = p.attributes || {};
                                    const poRef = getPoNumber(p);
                                    const supplierObj = suppliers.find((s) => s.id === attr.supplier_id);
                                    const supplierName = supplierObj?.attributes?.name || attr.supplier_name || "Supplier";
                                    const purchaseItems = attr.purchase_items || p.purchase_items || [];
                                    const totalQty = purchaseItems.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0) || (attr.total_quantity ? Number(attr.total_quantity) : 1);
                                    const statusVal = Number(attr.status);
                                    const rawSt = String(attr.status || '').toLowerCase();
                                    const isApproved = statusVal === 1 || rawSt === 'approved' || rawSt === 'received' || rawSt === 'accepted';
                                    const isCancelled = statusVal === 4 || rawSt === 'cancelled' || rawSt === 'rejected';
                                    const statusText = isApproved ? 'Approved' : (isCancelled ? 'Cancelled' : 'Pending');

                                    return (
                                        <div
                                            key={p.id}
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
                                            {/* Row 1: Icon + PO Ref + Status */}
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                                    <div style={{
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '10px',
                                                        background: isApproved ? '#DCFCE7' : '#EFF6FF',
                                                        color: isApproved ? '#15803D' : '#2563EB',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '14px',
                                                        flexShrink: 0
                                                    }}>
                                                        <FontAwesomeIcon icon={faClipboardList} />
                                                    </div>
                                                    <div style={{ minWidth: 0 }}>
                                                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {poRef}
                                                        </div>
                                                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', whiteSpace: 'nowrap' }}>
                                                            {attr.warehouse_name || 'Suguna Warehouse'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div style={{ flexShrink: 0 }}>
                                                    {isApproved ? (
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: '800', background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', whiteSpace: 'nowrap' }}>
                                                            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#15803D' }} /> Approved
                                                        </span>
                                                    ) : isCancelled ? (
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: '800', background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FCA5A5', whiteSpace: 'nowrap' }}>
                                                            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#B91C1C' }} /> Cancelled
                                                        </span>
                                                    ) : (
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: '800', background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A', whiteSpace: 'nowrap' }}>
                                                            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#D97706' }} /> Pending
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Row 2: Supplier Name */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                                <span style={{ fontSize: '12px', color: '#0F172A', fontWeight: '700', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                                    {supplierName}
                                                </span>
                                            </div>

                                            {/* Row 3: Meta strip */}
                                            <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '6px 10px', fontSize: '11px', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div>
                                                    <span style={{ fontWeight: '700', color: '#0F172A' }}>{totalQty} Units</span>
                                                    <span style={{ color: '#64748B', marginLeft: '4px' }}>({purchaseItems.length > 0 ? `${purchaseItems.length} Products` : '1 Product'})</span>
                                                </div>
                                                <div style={{ fontWeight: '800', color: '#16A34A', whiteSpace: 'nowrap' }}>
                                                    {currencySymbolHandling(allConfigData, currencySymbol, attr.grand_total)}
                                                </div>
                                            </div>

                                            {/* Row 4: Date + Actions */}
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid #F1F5F9' }}>
                                                <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '600' }}>
                                                    {moment(attr.created_at || attr.date || new Date()).format("DD MMM YYYY")}
                                                </div>
                                                <div className="brand-card-actions" style={{ gap: '4px' }} onClick={e => e.stopPropagation()}>
                                                    <Link
                                                        to={`/app/purchases/detail/${p.id}`}
                                                        className="brand-action-btn"
                                                        title="View PO"
                                                    >
                                                        <FontAwesomeIcon icon={faEye} />
                                                    </Link>
                                                    <Link
                                                        to={`/app/purchases/edit/${p.id}`}
                                                        className="brand-action-btn edit"
                                                        title="Edit PO"
                                                    >
                                                        <FontAwesomeIcon icon={faEdit} />
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        className="brand-action-btn"
                                                        title="Download PDF"
                                                        onClick={() => onPdfClick(p)}
                                                    >
                                                        <FontAwesomeIcon icon={faFilePdf} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="brand-action-btn delete"
                                                        title="Delete PO"
                                                        onClick={() => onClickDeleteModel(p)}
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
                                                checked={selectedRows.length === filteredPurchases.length && filteredPurchases.length > 0}
                                                onChange={handleSelectAll}
                                            />
                                        </th>
                                        <th style={{ minWidth: "150px", whiteSpace: "nowrap" }}>PO NUMBER</th>
                                        <th style={{ minWidth: "200px", whiteSpace: "nowrap" }}>SUPPLIER</th>
                                        <th style={{ minWidth: "170px", whiteSpace: "nowrap" }}>WAREHOUSE</th>
                                        <th style={{ minWidth: "120px", whiteSpace: "nowrap" }}>PRODUCTS</th>
                                        <th style={{ minWidth: "80px", whiteSpace: "nowrap" }}>QTY</th>
                                        <th style={{ minWidth: "130px", whiteSpace: "nowrap" }}>PO VALUE</th>
                                        <th style={{ minWidth: "130px", whiteSpace: "nowrap" }}>STATUS</th>
                                        <th style={{ minWidth: "130px", whiteSpace: "nowrap" }}>DATE</th>
                                        <th style={{ textAlign: "right", minWidth: "130px", paddingRight: "16px", whiteSpace: "nowrap" }}>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedPurchases.length === 0 ? (
                                        <tr>
                                            <td colSpan="10" style={{ textAlign: 'center', padding: '60px 20px', border: 'none' }}>
                                                <div style={{ padding: '20px', textAlign: 'center' }}>
                                                    <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', margin: '0 auto 16px auto', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.12)' }}>
                                                        <FontAwesomeIcon icon={faClipboardList} />
                                                    </div>
                                                    <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                                                        No purchase orders found
                                                    </h3>
                                                    <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '420px', margin: '0 auto 22px auto', lineHeight: '1.55' }}>
                                                        {searchQuery || supplierFilter !== "All" || warehouseFilter !== "All" || statusFilter !== "All"
                                                            ? "No purchase orders match your active search or filter criteria. Try resetting filters."
                                                            : "Create your first purchase order to start receiving inventory from suppliers and tracking purchase commitments."}
                                                    </p>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Link
                                                            to="/app/purchases/create"
                                                            className="unit-btn-pill unit-btn-primary"
                                                        >
                                                            <FontAwesomeIcon icon={faPlus} /> Create Purchase Order
                                                        </Link>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedPurchases.map((p) => {
                                            const attr = p.attributes || {};
                                            const poRef = getPoNumber(p);
                                            const supplierObj = suppliers.find((s) => s.id === attr.supplier_id);
                                            const supplierName = supplierObj?.attributes?.name || attr.supplier_name || "Supplier";

                                            const purchaseItems = attr.purchase_items || p.purchase_items || [];
                                            const totalQty = purchaseItems.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0) || (attr.total_quantity ? Number(attr.total_quantity) : 1);
                                            const statusVal = Number(attr.status);
                                            const rawSt = String(attr.status || '').toLowerCase();
                                            const isApproved = statusVal === 1 || rawSt === 'approved' || rawSt === 'received' || rawSt === 'accepted';
                                            const isCancelled = statusVal === 4 || rawSt === 'cancelled' || rawSt === 'rejected';

                                            const isSelected = selectedRows.includes(p.id);

                                            return (
                                                <tr
                                                    key={p.id}
                                                    style={{ background: isSelected ? "#F0FDF4" : "transparent" }}
                                                >
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        <input
                                                            type="checkbox"
                                                            className="form-check-input"
                                                            checked={isSelected}
                                                            onChange={() => handleToggleRow(p.id)}
                                                        />
                                                    </td>
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        <Link
                                                            to={`/app/purchases/detail/${p.id}`}
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
                                                            {poRef}
                                                        </Link>
                                                    </td>
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        <div style={{ fontWeight: "700", color: "#0F172A", fontSize: "13px", whiteSpace: "nowrap" }}>
                                                            {supplierName}
                                                        </div>
                                                    </td>
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        <div style={{ fontWeight: "700", color: "#0F172A", fontSize: "13px", whiteSpace: "nowrap" }}>
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
                                                            {purchaseItems.length > 0 ? `${purchaseItems.length} Products` : '1 Product'}
                                                        </span>
                                                    </td>
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        <span style={{ fontWeight: '800', fontSize: '13px', color: '#0F172A', whiteSpace: "nowrap" }}>{totalQty}</span>
                                                    </td>
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        <span style={{ fontWeight: '800', fontSize: '13.5px', color: '#0F172A', whiteSpace: "nowrap" }}>
                                                            {currencySymbolHandling(allConfigData, currencySymbol, attr.grand_total)}
                                                        </span>
                                                    </td>
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        {isApproved ? (
                                                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: "800", background: "#DCFCE7", color: "#15803D", border: "1px solid #86EFAC", whiteSpace: "nowrap" }}>
                                                                <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#15803D" }}></span> Approved
                                                            </span>
                                                        ) : isCancelled ? (
                                                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: "800", background: "#FEE2E2", color: "#B91C1C", border: "1px solid #FCA5A5", whiteSpace: "nowrap" }}>
                                                                <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#B91C1C" }}></span> Cancelled
                                                            </span>
                                                        ) : (
                                                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: "800", background: "#FEF3C7", color: "#D97706", border: "1px solid #FDE68A", whiteSpace: "nowrap" }}>
                                                                <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#D97706" }}></span> Pending
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#0F172A', whiteSpace: "nowrap" }}>
                                                            {moment(attr.created_at || attr.date || new Date()).format("DD MMM YYYY")}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: "right", paddingRight: "16px", whiteSpace: "nowrap" }}>
                                                        <div className="brand-card-actions" style={{ justifyContent: 'flex-end', flexWrap: 'nowrap', gap: '4px' }}>
                                                            <Link
                                                                to={`/app/purchases/detail/${p.id}`}
                                                                className="brand-action-btn"
                                                                title="View PO"
                                                            >
                                                                <FontAwesomeIcon icon={faEye} />
                                                            </Link>
                                                            <Link
                                                                to={`/app/purchases/edit/${p.id}`}
                                                                className="brand-action-btn edit"
                                                                title="Edit PO"
                                                            >
                                                                <FontAwesomeIcon icon={faEdit} />
                                                            </Link>
                                                            <button
                                                                type="button"
                                                                className="brand-action-btn"
                                                                title="Download PDF"
                                                                onClick={() => onPdfClick(p)}
                                                            >
                                                                <FontAwesomeIcon icon={faFilePdf} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="brand-action-btn delete"
                                                                title="Delete PO"
                                                                onClick={() => onClickDeleteModel(p)}
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
                            Showing {totalFiltered > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + pageSize, totalFiltered)} of {totalFiltered} purchase orders
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

            {deleteModel && (
                <DeletePurchase
                    onClickDeleteModel={onClickDeleteModel}
                    deleteModel={deleteModel}
                    deleteId={isDelete}
                />
            )}
        </MasterLayout>
    );
};

const mapStateToProps = (state) => {
    const { purchases, totalRecord, suppliers, warehouses, frontSetting, allConfigData } = state;
    return { purchases, totalRecord, suppliers, warehouses, frontSetting, allConfigData };
};

export default connect(mapStateToProps, {
    fetchPurchases,
    fetchAllSuppliers,
    fetchAllWarehouses,
    purchasePdfAction,
    fetchFrontSetting,
})(Purchases);
