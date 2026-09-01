import React, { useState, useEffect, useMemo, useRef } from "react";
import { connect, useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faTruck,
    faBoxesPacking,
    faCheckCircle,
    faSearch,
    faClock,
    faTruckFast,
    faEye,
    faPlus,
    faWallet,
    faPlay,
    faRotateLeft,
    faList,
    faThLarge,
    faArrowRight,
    faCheckDouble,
    faBarcode
} from "@fortawesome/free-solid-svg-icons";
import MasterLayout from "../MasterLayout";
import TabTitle from "../../shared/tab-title/TabTitle";
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";
import apiConfig from "../../config/apiConfig";
import { getCached, setCache } from "../../store/apiCache";
import { onPosDataChanged } from "../../shared/posEvents";
import { fetchAllMainProducts } from "../../store/action/productAction";
import { fetchPurchases } from "../../store/action/purchaseAction";
import { fetchAllSuppliers } from "../../store/action/supplierAction";
import { fetchAllWarehouses } from "../../store/action/warehouseAction";
import { fetchFrontSetting } from "../../store/action/frontSettingAction";
import moment from "moment";
import "./StockReceiving.css";
import "../brands/ProductBrandsPremium.css";
import "../units/ProductUnitsPremium.css";
import "../variation/ProductVariationsPremium.css";
import LiveCounter from "../../shared/components/LiveCounter";
import LiveSparkline from "../../shared/components/LiveSparkline";

const getInitialGrnCache = () => {
    try {
        const memory = getCached("inbound:planning_data");
        if (memory?.items && memory.items.length > 0) return memory;
        const local = localStorage.getItem("infy_inbound_planning_cache");
        if (local) {
            const parsed = JSON.parse(local);
            if (parsed?.items && parsed.items.length > 0) return parsed;
        }
    } catch (e) {}
    return { items: [], kpi: {} };
};

const StockReceiving = (props) => {
    const {
        fetchPurchases,
        purchases = [],
        suppliers = [],
        warehouses = [],
        fetchAllMainProducts,
        fetchAllSuppliers,
        fetchAllWarehouses,
        fetchFrontSetting,
    } = props;

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const isMounted = useRef(true);
    const initialCache = useMemo(() => getInitialGrnCache(), []);

    const [grnList, setGrnList] = useState(initialCache.items || []);
    const [loading, setLoading] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [warehouseFilter, setWarehouseFilter] = useState("All");
    const [supplierFilter, setSupplierFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [sortBy, setSortBy] = useState("newest");
    const [viewMode, setViewMode] = useState("list");
    const [selectedRows, setSelectedRows] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    const fetchGrnData = async (isSilent = false) => {
        if (!isSilent && isMounted.current) setLoading(true);
        try {
            const response = await apiConfig.get("inbound-planning-data");
            if (isMounted.current && response.data && response.data.success && response.data.data) {
                const { items, kpi } = response.data.data;
                setCache("inbound:planning_data", { items, kpi });
                try {
                    localStorage.setItem("infy_inbound_planning_cache", JSON.stringify({ items, kpi }));
                } catch (e) {}
                setGrnList(items || []);
            }
        } catch (err) {
            console.error("Error fetching stock receiving data:", err);
        } finally {
            if (isMounted.current) setLoading(false);
        }
    };

    useEffect(() => {
        isMounted.current = true;
        fetchFrontSetting();
        fetchAllSuppliers();
        fetchAllWarehouses();
        fetchPurchases({ pageSize: 100 }, true);
        if (fetchAllMainProducts) fetchAllMainProducts({}, false);

        fetchGrnData(true);

        const handleFocus = () => fetchGrnData(true);
        const handleVisibility = () => {
            if (document.visibilityState === "visible") fetchGrnData(true);
        };

        window.addEventListener("focus", handleFocus);
        document.addEventListener("visibilitychange", handleVisibility);

        const handleStorage = (e) => {
            if (e.key === "infypos_sync_pulse" || e.key === "pos_realtime_event" || e.key === "infy_last_po_update") {
                fetchGrnData(true);
            }
        };
        window.addEventListener("storage", handleStorage);

        const handleCustomEvent = () => fetchGrnData(true);
        window.addEventListener("posDataChanged", handleCustomEvent);

        let bc = null;
        if (typeof window !== "undefined" && window.BroadcastChannel) {
            try {
                bc = new BroadcastChannel("infypos_realtime_bus");
                bc.onmessage = (msg) => {
                    if (msg?.data?.type === "RECEIVING_UPDATED" || msg?.data?.type === "GRN_COMPLETED" || msg?.data?.type === "PO_UPDATED") {
                        fetchGrnData(true);
                    }
                };
            } catch (_) {}
        }

        const unsubscribe = onPosDataChanged?.(() => {
            fetchGrnData(true);
        });

        const syncInterval = setInterval(() => {
            fetch("/pda/receiving/live-stream")
                .then(res => res.json())
                .then(resData => {
                    if (!isMounted.current) return;
                    if (resData && resData.data) {
                        const payload = resData.data;
                        if (payload.event_type === "completed" || payload.event_type === "partial_completed" || payload.event_type === "scan") {
                            fetchGrnData(true);
                        }
                    }
                })
                .catch(() => {});
        }, 1500);

        return () => {
            isMounted.current = false;
            window.removeEventListener("focus", handleFocus);
            document.removeEventListener("visibilitychange", handleVisibility);
            window.removeEventListener("storage", handleStorage);
            window.removeEventListener("posDataChanged", handleCustomEvent);
            if (bc) {
                try { bc.close(); } catch (_) {}
            }
            if (typeof unsubscribe === "function") unsubscribe();
            clearInterval(syncInterval);
        };
    }, []);

    const filteredPos = useMemo(() => {
        let list = grnList.filter((item) => {
            if (!item) return false;
            const query = searchQuery.toLowerCase().trim();

            const matchesQuery =
                !query ||
                (item.po_id && item.po_id.toLowerCase().includes(query)) ||
                (item.grn_number && item.grn_number.toLowerCase().includes(query)) ||
                (item.asn_id && item.asn_id.toLowerCase().includes(query)) ||
                (item.supplier && item.supplier.toLowerCase().includes(query)) ||
                (item.warehouse && item.warehouse.toLowerCase().includes(query));

            if (supplierFilter !== "All" && item.supplier !== supplierFilter) return false;
            if (warehouseFilter !== "All" && item.warehouse !== warehouseFilter) return false;

            if (statusFilter === "Completed" && item.grn_status !== "Completed") return false;
            if (statusFilter === "Partially Received" && item.grn_status !== "Partially Received") return false;
            if (statusFilter === "Receiving in Progress" && item.grn_status !== "Receiving in Progress") return false;
            if (statusFilter === "Ready to Receive" && item.grn_status !== "Ready to Receive") return false;
            if (statusFilter === "Pending Receiving" && item.grn_status !== "Pending Receiving") return false;

            return matchesQuery;
        });

        if (sortBy === 'oldest') {
            list.sort((a, b) => Number(a.id || 0) - Number(b.id || 0));
        } else if (sortBy === 'qty') {
            list.sort((a, b) => Number(b.raw_qty || 0) - Number(a.raw_qty || 0));
        } else if (sortBy === 'supplier') {
            list.sort((a, b) => (a.supplier || '').localeCompare(b.supplier || ''));
        } else {
            list.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
        }

        return list;
    }, [grnList, searchQuery, supplierFilter, warehouseFilter, statusFilter, sortBy]);

    const totalFiltered = filteredPos.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / perPage));
    const validCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (validCurrentPage - 1) * perPage;
    const paginatedPos = filteredPos.slice(startIndex, startIndex + perPage);

    const totalPosCount = grnList.length;
    const receivingTodayCount = grnList.filter(p => p.grn_status === "Receiving in Progress" || p.grn_status === "Ready to Receive").length;
    const partialCount = grnList.filter(p => p.grn_status === "Partially Received").length;
    const completedTodayCount = grnList.filter(p => p.grn_status === "Completed" || p.is_grn_completed).length;

    const handleReset = () => {
        setSearchQuery("");
        setWarehouseFilter("All");
        setSupplierFilter("All");
        setStatusFilter("All");
        setSortBy("newest");
        setCurrentPage(1);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) setSelectedRows(filteredPos.map(i => i.id));
        else setSelectedRows([]);
    };

    const handleSelectRow = (id) => {
        setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
    };

    const handleStartReceivingClick = (item) => {
        const targetId = item ? item.id : (filteredPos[0]?.id || 1);
        navigate(`/app/receiving/detail/${targetId}`);
    };

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title="Stock Receiving (GRN) | Enterprise WMS Workspace" />

            <div className="brand-page-container">

                <div className="brand-breadcrumb">
                    <span>Dashboard</span>
                    <span>&gt;</span>
                    <span>Inbound</span>
                    <span>&gt;</span>
                    <span className="brand-crumb-active">Stock GRN</span>
                </div>

                <div className="brand-header">
                    <div className="brand-title-group">
                        <h1>Stock Receiving (GRN)</h1>
                        <p>Receive supplier deliveries, verify quantities and update inventory in real-time.</p>
                    </div>

                    <div className="brand-header-actions">
                        <button
                            type="button"
                            className="unit-btn-pill unit-btn-primary"
                            onClick={() => handleStartReceivingClick(null)}
                        >
                            <FontAwesomeIcon icon={faPlus} /> Start Receiving
                        </button>
                    </div>
                </div>

                <div className="brand-kpi-grid">
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Total Inbound POs</span>
                            <div className="brand-kpi-icon orange">
                                <FontAwesomeIcon icon={faClock} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={totalPosCount} isCurrency={false} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge neutral">Inbound Orders</span>
                            <LiveSparkline data={totalPosCount > 0 ? [Math.max(0, totalPosCount - 1), totalPosCount] : [0, 0]} color="#D97706" width={60} height={24} />
                        </div>
                    </div>

                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Receiving / In Transit</span>
                            <div className="brand-kpi-icon blue">
                                <FontAwesomeIcon icon={faTruckFast} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={receivingTodayCount} isCurrency={false} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge up">Ready for Dock</span>
                            <LiveSparkline data={[Math.max(0, receivingTodayCount - 1), receivingTodayCount]} color="#2563EB" width={60} height={24} />
                        </div>
                    </div>

                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Partially Received</span>
                            <div className="brand-kpi-icon orange">
                                <FontAwesomeIcon icon={faBoxesPacking} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={partialCount} isCurrency={false} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge neutral">Partial Stock</span>
                            <LiveSparkline data={[0, partialCount]} color="#D97706" width={60} height={24} />
                        </div>
                    </div>

                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Completed GRNs</span>
                            <div className="brand-kpi-icon green">
                                <FontAwesomeIcon icon={faCheckCircle} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={completedTodayCount} isCurrency={false} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge up">Stock Verified</span>
                            <LiveSparkline data={[Math.max(0, completedTodayCount - 1), completedTodayCount]} color="#16A34A" width={60} height={24} />
                        </div>
                    </div>
                </div>

                <div className="unit-main-card">
                    <div className="var-filter-row">
                        <div className="var-search-box">
                            <FontAwesomeIcon icon={faSearch} className="var-search-icon" />
                            <input
                                type="text"
                                placeholder="Search PO, Supplier, Vehicle, Invoice, GRN..."
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
                                value={warehouseFilter}
                                onChange={(e) => {
                                    setWarehouseFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="All">Warehouse: All</option>
                                {warehouses.map(w => <option key={w.id} value={w.attributes?.name || w.name}>{w.attributes?.name || w.name}</option>)}
                            </select>

                            <select
                                className="var-select-sm"
                                value={supplierFilter}
                                onChange={(e) => {
                                    setSupplierFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="All">Supplier: All</option>
                                {suppliers.map(s => <option key={s.id} value={s.attributes?.name || s.name}>{s.attributes?.name || s.name}</option>)}
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
                                <option value="Pending Receiving">Pending Receiving</option>
                                <option value="Ready to Receive">Ready to Receive</option>
                                <option value="Receiving in Progress">Receiving in Progress</option>
                                <option value="Partially Received">Partially Received</option>
                                <option value="Completed">Completed</option>
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
                                <option value="qty">Sort: Total Qty</option>
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

                    {viewMode === 'grid' ? (
                        /* COMPACT ELEGANT GRID CARDS */
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                            {paginatedPos.length === 0 ? (
                                <div style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center' }}>
                                    <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px auto', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.12)' }}>
                                        <FontAwesomeIcon icon={faBoxesPacking} />
                                    </div>
                                    <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>No stock receiving orders found</h3>
                                    <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '400px', margin: '0 auto 20px auto' }}>Receive supplier deliveries, verify quantities and update inventory in real-time.</p>
                                    <button
                                        type="button"
                                        className="unit-btn-pill unit-btn-primary"
                                        onClick={() => handleStartReceivingClick(null)}
                                    >
                                        <FontAwesomeIcon icon={faPlus} /> Start Receiving
                                    </button>
                                </div>
                            ) : (
                                paginatedPos.map((p) => {
                                    const poRef = p.po_id || `PO-2026-${String(p.id).padStart(6, '0')}`;
                                    const hasGrnCode = p.grn_number && p.grn_number !== '—';
                                    const grnCode = hasGrnCode ? p.grn_number : '--';
                                    const supplierName = p.supplier || "Supplier";
                                    const orderedQty = p.raw_qty || 1;
                                    const hasAsnCreated = p.asn_id && p.asn_id !== '—' && p.asn_id !== '';
                                    const isDelivered = p.grn_status === 'Completed' || p.grn_status === 'Stock Received' || p.grn_status === 'Delivered';
                                    const isDispatched = p.grn_status === 'Dispatched';
                                    const isInTransit = p.grn_status === 'In Transit';
                                    const isPartial = p.grn_status === 'Partially Received';

                                    return (
                                        <div
                                            key={p.id}
                                            onClick={() => handleStartReceivingClick(p)}
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
                                                        background: isDelivered ? '#DCFCE7' : '#EFF6FF',
                                                        color: isDelivered ? '#15803D' : '#2563EB',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '14px',
                                                        flexShrink: 0
                                                    }}>
                                                        <FontAwesomeIcon icon={faBoxesPacking} />
                                                    </div>
                                                    <div style={{ minWidth: 0 }}>
                                                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {poRef}
                                                        </div>
                                                        <div style={{ fontSize: '11px', fontWeight: '700', color: hasGrnCode ? '#16A34A' : '#94A3B8', whiteSpace: 'nowrap' }}>
                                                            {hasGrnCode ? grnCode : 'GRN Pending'}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Status Pill */}
                                                <div style={{ flexShrink: 0 }}>
                                                    <span className={`unit-status-pill ${isDelivered ? 'active' : (isDispatched || isInTransit || p.grn_status === 'Ready to Receive' ? 'default' : (isPartial ? 'warning' : 'draft'))}`}>
                                                        <span className="unit-dot" /> {p.grn_status}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Row 2: Supplier & ASN Badges */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                                <span style={{ fontSize: '12px', color: '#0F172A', fontWeight: '700', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                                    {supplierName}
                                                </span>
                                                {hasAsnCreated && (
                                                    <span style={{ padding: '2px 7px', borderRadius: '6px', fontSize: '10.5px', fontWeight: '700', background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}>
                                                        {p.asn_id}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Row 3: Compact Logistics strip */}
                                            <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '6px 10px', fontSize: '11px', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
                                                    {hasAsnCreated && (p.vehicle_no || p.transporter) ? (
                                                        <span style={{ fontWeight: '600', color: '#0F172A' }}>
                                                            🚚 {p.vehicle_no || p.transporter}
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: '#94A3B8' }}>Logistics: Unassigned</span>
                                                    )}
                                                </div>
                                                <div style={{ fontWeight: '700', color: isDelivered ? '#15803D' : '#D97706', whiteSpace: 'nowrap' }}>
                                                    {p.delivery_date || '01 Sep 2026'}
                                                </div>
                                            </div>

                                            {/* Row 4: Ordered Qty + View Button */}
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid #F1F5F9' }}>
                                                <div>
                                                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>{orderedQty}</span> <span style={{ fontSize: '11px', color: '#64748B' }}>Units</span>
                                                </div>
                                                <div onClick={e => e.stopPropagation()}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleStartReceivingClick(p)}
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            padding: '3px 10px',
                                                            borderRadius: '999px',
                                                            background: '#FFFFFF',
                                                            border: '1px solid #E2E8F0',
                                                            color: '#0F172A',
                                                            fontSize: '11.5px',
                                                            fontWeight: '700',
                                                            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <FontAwesomeIcon icon={faPlay} style={{ fontSize: '10px' }} /> Receive
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    ) : (
                        <div className="var-table-wrap" style={{ overflowX: 'auto', width: '100%' }}>
                            <table className="var-table" style={{ width: '100%', minWidth: '1380px', tableLayout: 'auto', borderCollapse: 'separate' }}>
                                <thead>
                                    <tr>
                                        <th style={{ width: "36px", whiteSpace: "nowrap" }}>
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={selectedRows.length === filteredPos.length && filteredPos.length > 0}
                                                onChange={handleSelectAll}
                                            />
                                        </th>
                                        <th style={{ minWidth: "120px", whiteSpace: "nowrap" }}>GRN</th>
                                        <th style={{ minWidth: "150px", whiteSpace: "nowrap" }}>PURCHASE ORDER</th>
                                        <th style={{ minWidth: "190px", whiteSpace: "nowrap" }}>SUPPLIER &amp; ASN</th>
                                        <th style={{ minWidth: "160px", whiteSpace: "nowrap" }}>WAREHOUSE</th>
                                        <th style={{ minWidth: "170px", whiteSpace: "nowrap" }}>VEHICLE &amp; DRIVER</th>
                                        <th style={{ minWidth: "130px", whiteSpace: "nowrap" }}>EXPECTED DELIVERY</th>
                                        <th style={{ minWidth: "120px", whiteSpace: "nowrap" }}>ORDERED QTY</th>
                                        <th style={{ minWidth: "140px", whiteSpace: "nowrap" }}>STATUS</th>
                                        <th style={{ minWidth: "100px", textAlign: "right", paddingRight: "16px", whiteSpace: "nowrap" }}>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedPos.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} style={{ textAlign: 'center', padding: '60px 20px', border: 'none' }}>
                                                <div style={{ padding: '20px', textAlign: 'center' }}>
                                                    <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', margin: '0 auto 16px auto', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.12)' }}>
                                                        <FontAwesomeIcon icon={faBoxesPacking} />
                                                    </div>
                                                    <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                                                        No stock receiving orders found
                                                    </h3>
                                                    <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '420px', margin: '0 auto 22px auto', lineHeight: '1.55' }}>
                                                        {searchQuery || warehouseFilter !== "All" || supplierFilter !== "All" || statusFilter !== "All"
                                                            ? "No receiving records match your active search or filter criteria. Try resetting filters."
                                                            : "Receive supplier deliveries, verify quantities and update inventory in real-time."}
                                                    </p>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <button
                                                            type="button"
                                                            className="unit-btn-pill unit-btn-primary"
                                                            onClick={() => handleStartReceivingClick(null)}
                                                        >
                                                            <FontAwesomeIcon icon={faPlus} /> Start Receiving
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedPos.map((p) => {
                                            const poRef = p.po_id || `PO-2026-${String(p.id).padStart(6, '0')}`;
                                            const hasGrnCode = p.grn_number && p.grn_number !== '—';
                                            const grnCode = hasGrnCode ? p.grn_number : '--';
                                            const supplierName = p.supplier || "Supplier";
                                            const warehouseName = p.warehouse || "Suguna Warehouse";

                                            const hasAsnCreated = p.asn_id && p.asn_id !== '—' && p.asn_id !== '';
                                            const vehicleNo = (p.vehicle_no && p.vehicle_no !== 'N/A') ? p.vehicle_no : (hasAsnCreated ? (p.transporter && p.transporter !== 'N/A' ? p.transporter : null) : null);
                                            const driverName = (p.driver && p.driver !== 'N/A') ? p.driver : (hasAsnCreated ? 'Driver Assigned' : null);
                                            const deliveryDate = p.delivery_date || "01 Sep 2026";
                                            const orderedQty = p.raw_qty || 1;
                                            const isSelected = selectedRows.includes(p.id);
                                            const isDelivered = p.grn_status === 'Completed' || p.grn_status === 'Stock Received' || p.grn_status === 'Delivered';
                                            const isDispatched = p.grn_status === 'Dispatched';
                                            const isInTransit = p.grn_status === 'In Transit';
                                            const isPartial = p.grn_status === 'Partially Received';

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
                                                            onChange={() => handleSelectRow(p.id)}
                                                        />
                                                    </td>

                                                    {/* 1. GRN */}
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        {hasGrnCode ? (
                                                            <span style={{ padding: '3px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', color: '#16A34A', background: '#DCFCE7', border: '1px solid #BBF7D0', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                                                                {grnCode}
                                                            </span>
                                                        ) : (
                                                            <span style={{ color: "#94A3B8", fontWeight: "700", fontSize: "13px", whiteSpace: "nowrap" }}>
                                                                —
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* 2. PURCHASE ORDER */}
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        <span style={{
                                                            display: "inline-block",
                                                            padding: "3px 10px",
                                                            borderRadius: "8px",
                                                            fontSize: "12px",
                                                            fontWeight: "700",
                                                            background: "#F8FAFC",
                                                            border: "1px solid #E2E8F0",
                                                            color: "#1E293B",
                                                            fontFamily: "monospace",
                                                            whiteSpace: "nowrap"
                                                        }}>
                                                            {poRef}
                                                        </span>
                                                        <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: '2px', whiteSpace: "nowrap" }}>
                                                            {deliveryDate}
                                                        </div>
                                                    </td>

                                                    {/* 3. SUPPLIER & ASN */}
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        <div style={{ fontWeight: "700", color: "#0F172A", fontSize: "13px", whiteSpace: "nowrap" }}>
                                                            {supplierName}
                                                        </div>
                                                        <div style={{ fontSize: "11px", color: hasAsnCreated ? "#2563EB" : "#94A3B8", fontWeight: "600", marginTop: "1px", whiteSpace: "nowrap" }}>
                                                            {hasAsnCreated ? `ASN: ${p.asn_id}` : "ASN: Pending"}
                                                        </div>
                                                    </td>

                                                    {/* 4. WAREHOUSE */}
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        <div style={{ fontWeight: "700", color: "#0F172A", fontSize: "13px", whiteSpace: "nowrap" }}>
                                                            {warehouseName}
                                                        </div>
                                                    </td>

                                                    {/* 5. VEHICLE & DRIVER */}
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        {hasAsnCreated && (vehicleNo || driverName) ? (
                                                            <div style={{ whiteSpace: "nowrap" }}>
                                                                <div style={{ fontSize: "12.5px", fontWeight: "700", color: "#0F172A", whiteSpace: "nowrap" }}>
                                                                    <FontAwesomeIcon icon={faTruck} className="text-primary me-1" />
                                                                    {vehicleNo || "Assigned"}
                                                                </div>
                                                                <div style={{ fontSize: "11px", color: "#64748B", marginTop: "1px", whiteSpace: "nowrap" }}>
                                                                    {driverName || "Driver Assigned"}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span style={{ color: "#94A3B8", fontWeight: "500", whiteSpace: "nowrap" }}>—</span>
                                                        )}
                                                    </td>

                                                    {/* 6. EXPECTED DELIVERY */}
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        <span style={{ fontSize: "12.5px", fontWeight: "700", color: "#0F172A", whiteSpace: "nowrap" }}>
                                                            {deliveryDate}
                                                        </span>
                                                    </td>

                                                    {/* 7. ORDERED QTY */}
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        <span style={{ fontWeight: "800", fontSize: "13px", color: "#0F172A", whiteSpace: "nowrap" }}>{orderedQty}</span>{" "}
                                                        <span style={{ fontSize: "12px", color: "#64748B", whiteSpace: "nowrap" }}>Units</span>
                                                        {p.grn_status === "Partially Received" && (
                                                            <div style={{ fontSize: "11px", color: "#D97706", fontWeight: "700", whiteSpace: "nowrap" }}>
                                                                Received: {p.received_qty}/{orderedQty}
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* 8. STATUS */}
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        {isDelivered ? (
                                                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: "800", background: "#DCFCE7", color: "#15803D", border: "1px solid #86EFAC", whiteSpace: "nowrap" }}>
                                                                <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#15803D" }}></span> Delivered
                                                            </span>
                                                        ) : isDispatched ? (
                                                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: "800", background: "#F3E8FF", color: "#9333EA", border: "1px solid #E9D5FF", whiteSpace: "nowrap" }}>
                                                                <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#9333EA" }}></span> Dispatched
                                                            </span>
                                                        ) : isInTransit ? (
                                                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: "800", background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", whiteSpace: "nowrap" }}>
                                                                <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#2563EB" }}></span> In Transit
                                                            </span>
                                                        ) : isPartial ? (
                                                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: "800", background: "#FEF3C7", color: "#D97706", border: "1px solid #FDE68A", whiteSpace: "nowrap" }}>
                                                                <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#D97706" }}></span> Partially Received
                                                            </span>
                                                        ) : p.grn_status === 'Ready to Receive' ? (
                                                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: "800", background: "#DCFCE7", color: "#15803D", border: "1px solid #86EFAC", whiteSpace: "nowrap" }}>
                                                                <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#15803D" }}></span> Ready to Receive
                                                            </span>
                                                        ) : (
                                                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: "800", background: "#FEF3C7", color: "#D97706", border: "1px solid #FDE68A", whiteSpace: "nowrap" }}>
                                                                <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#D97706" }}></span> {p.grn_status}
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* 9. ACTIONS */}
                                                    <td style={{ textAlign: "right", paddingRight: "16px", whiteSpace: "nowrap" }}>
                                                        <div style={{ display: "inline-flex", gap: "6px", alignItems: "center", justifyContent: "flex-end" }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleStartReceivingClick(p)}
                                                                style={{
                                                                    display: "inline-flex",
                                                                    alignItems: "center",
                                                                    gap: "6px",
                                                                    height: "32px",
                                                                    padding: "0 14px",
                                                                    borderRadius: "999px",
                                                                    fontSize: "12px",
                                                                    fontWeight: "700",
                                                                    background: "#FFFFFF",
                                                                    border: "1px solid #E2E8F0",
                                                                    color: "#0F172A",
                                                                    boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                                                                    cursor: "pointer",
                                                                    whiteSpace: "nowrap"
                                                                }}
                                                                title="Receive Stock"
                                                            >
                                                                <FontAwesomeIcon icon={faPlay} style={{ fontSize: "10px" }} /> Receive
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

                    <div className="var-pagination">
                        <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
                            Showing {totalFiltered > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + perPage, totalFiltered)} of {totalFiltered} stock receiving orders
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
                                value={perPage}
                                onChange={(e) => {
                                    setPerPage(Number(e.target.value));
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
        </MasterLayout>
    );
};

const mapStateToProps = (state) => {
    const { purchases, suppliers, warehouses, allMainProducts, frontSetting, allConfigData, isLoading } = state;
    return { purchases, suppliers, warehouses, allMainProducts, frontSetting, allConfigData, isLoading };
};

export default connect(mapStateToProps, {
    fetchPurchases,
    fetchAllSuppliers,
    fetchAllWarehouses,
    fetchAllMainProducts,
    fetchFrontSetting
})(StockReceiving);
