import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Modal } from "react-bootstrap-v5";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faWarehouse,
    faMapMarkerAlt,
    faSearch,
    faCheckDouble,
    faTimes,
    faBoxesPacking,
    faTruck,
    faCheckCircle,
    faPlus,
    faMobileScreenButton,
    faRotateLeft,
    faList,
    faThLarge,
    faEye,
    faArrowRight,
    faBarcode,
    faDownload,
    faSync
} from "@fortawesome/free-solid-svg-icons";
import MasterLayout from "../MasterLayout";
import MasterTableSkeleton from "../../shared/components/skeletons/MasterTableSkeleton";
import TabTitle from "../../shared/tab-title/TabTitle";
import "../brands/ProductBrandsPremium.css";
import LiveCounter from "../../shared/components/LiveCounter";
import LiveSparkline from "../../shared/components/LiveSparkline";
import "./LiveWarehouseReceiving.css";
import apiConfig from "../../config/apiConfig";
import { subscribePosDataChanged } from "../../shared/posEvents";
import { getCached, setCache } from "../../store/apiCache";
import moment from "moment";

const getInitialPutawayCache = () => {
    try {
        const memory = getCached("putaway:list");
        if (memory && Array.isArray(memory) && memory.length > 0) return memory;
    } catch(e) {}
    return [];
};

const Putaway = () => {
    const isMounted = useRef(true);
    const initialCache = getInitialPutawayCache();
    const [grns, setGrns] = useState(initialCache);
    const [isLoading, setIsLoading] = useState(!initialCache.length);
    const [selectedGrn, setSelectedGrn] = useState(null);
    const [showPdaEmulator, setShowPdaEmulator] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortBy, setSortBy] = useState("newest");
    const [viewMode, setViewMode] = useState("list");
    const [lastSync, setLastSync] = useState(moment().format("HH:mm:ss"));

    // Fetch dynamic list from Backend
    const fetchGrns = (isSilent = false) => {
        if (!isSilent && isMounted.current) {
            setIsLoading(true);
        }
        apiConfig.get("warehouse-putaway/list")
            .then((res) => {
                if (!isMounted.current) return;
                const data = res.data?.data || res.data;
                if (Array.isArray(data)) {
                    setCache("putaway:list", data);
                    setGrns(data);
                    setLastSync(moment().format("HH:mm:ss"));
                }
            })
            .catch(() => {
                // Fallback direct endpoint
                fetch("/api/warehouse-putaway/list")
                    .then(r => r.json())
                    .then(data => {
                        if (isMounted.current && Array.isArray(data)) {
                            setCache("putaway:list", data);
                            setGrns(data);
                            setLastSync(moment().format("HH:mm:ss"));
                        }
                    })
                    .catch(err => console.error("Error fetching putaway list:", err));
            })
            .finally(() => {
                if (isMounted.current) {
                    setIsLoading(false);
                }
            });
    };

    useEffect(() => {
        isMounted.current = true;
        fetchGrns(false);

        let bc = null;
        try {
            if (window.BroadcastChannel) {
                bc = new BroadcastChannel('infypos_realtime_bus');
                bc.onmessage = (event) => {
                    if (event && event.data) {
                        fetchGrns(true);
                    }
                };
            }
        } catch(e) {}

        const handleStorage = (e) => {
            if (e.key === 'infypos_sync_pulse' || e.key === 'infy_putaway_sync' || e.key === 'infy_purchase_sync' || e.key === 'infypos_realtime_event') {
                fetchGrns(true);
            }
        };

        const handleFocus = () => fetchGrns(true);
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                fetchGrns(true);
            }
        };

        window.addEventListener('storage', handleStorage);
        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibility);

        const unsubscribe = subscribePosDataChanged(() => {
            fetchGrns(true);
        });

        return () => {
            isMounted.current = false;
            if (bc) bc.close();
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibility);
            unsubscribe();
        };
    }, []);

    const handleOpenPdaEmulator = (grn) => {
        setSelectedGrn(grn);
        setShowPdaEmulator(true);
    };

    const handleExportCSV = () => {
        if (!grns || grns.length === 0) return;
        const headers = ["GRN Number,PO Number,Supplier,Warehouse,Accepted Qty,Receiving Date,Status,Location\n"];
        const rows = grns.map((item) => {
            return `"${item.grn_number}","${item.po_number}","${item.supplier_name}","${item.warehouse_name}","${item.total_accepted}","${item.receiving_date}","${item.status}","${item.location}"`;
        });
        const blob = new Blob([headers + rows.join("\n")], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.setAttribute("href", url);
        a.setAttribute("download", `INFY_Putaway_${moment().format("YYYY-MM-DD")}.csv`);
        a.click();
    };

    const pendingGrns = grns.filter((g) => g.status === "Waiting For Putaway");
    const completedGrns = grns.filter((g) => g.status === "Putaway Completed");

    // Filter & Sort
    let processedGrns = [...grns];

    if (statusFilter === "pending") {
        processedGrns = processedGrns.filter((g) => g.status === "Waiting For Putaway");
    } else if (statusFilter === "completed") {
        processedGrns = processedGrns.filter((g) => g.status === "Putaway Completed");
    }

    if (searchTerm) {
        const q = searchTerm.toLowerCase();
        processedGrns = processedGrns.filter((g) =>
            g.grn_number?.toLowerCase().includes(q) ||
            g.po_number?.toLowerCase().includes(q) ||
            g.supplier_name?.toLowerCase().includes(q) ||
            g.warehouse_name?.toLowerCase().includes(q) ||
            g.assigned_user?.toLowerCase().includes(q)
        );
    }

    if (sortBy === "supplier") {
        processedGrns.sort((a, b) => (a.supplier_name || "").localeCompare(b.supplier_name || ""));
    } else if (sortBy === "grn") {
        processedGrns.sort((a, b) => (a.grn_number || "").localeCompare(b.grn_number || ""));
    } else if (sortBy === "oldest") {
        processedGrns.sort((a, b) => Number(a.id || 0) - Number(b.id || 0));
    } else {
        processedGrns.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
    }

    const totalAcceptedUnits = grns.reduce((sum, g) => sum + Number(g.total_accepted || 0), 0);

    const pendingSpark = pendingGrns.length > 0 ? [Math.max(0, pendingGrns.length - 1), pendingGrns.length] : [0, 0];
    const completedSpark = completedGrns.length > 0 ? [Math.max(0, completedGrns.length - 1), completedGrns.length] : [0, 0];

    return (
        <MasterLayout>
            <TabTitle title="Warehouse Putaway Management — INFY-POS WMS" />

            {isLoading && grns.length === 0 ? (
                <MasterTableSkeleton />
            ) : (
                <div className="brand-page-container">
                
                {/* ── 1. Breadcrumb (Exact Brands Page Style) ─────────────── */}
                <div className="brand-breadcrumb">
                    <span>Dashboard</span>
                    <span>&gt;</span>
                    <span>Inbound</span>
                    <span>&gt;</span>
                    <span className="brand-crumb-active">Putaway</span>
                </div>

                {/* ── 2. Header Row (Exact Brands Page Style) ─────────────── */}
                <div className="brand-header">
                    <div className="brand-title-group">
                        <h1>
                            Putaway
                        </h1>
                        <p>
                            Assign incoming Goods Receipts (GRN) to warehouse zones, racks, shelves, and bins.
                            {lastSync && <span style={{ marginLeft: 8, color: "#94A3B8", fontSize: 12 }}>
                                (Synced: {lastSync})
                            </span>}
                        </p>
                    </div>

                    <div className="brand-header-actions">
                        <button
                            type="button"
                            className="brand-btn-pill"
                            onClick={handleExportCSV}
                        >
                            <FontAwesomeIcon icon={faDownload} /> Export CSV
                        </button>
                        <button
                            type="button"
                            className="brand-btn-pill"
                            onClick={() => fetchGrns(false)}
                            title="Refresh Putaway List"
                        >
                            <FontAwesomeIcon icon={faSync} /> Refresh
                        </button>
                        <a
                            href="/pda/putaway/stream"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="brand-btn-pill text-decoration-none"
                            style={{ background: "#EFF6FF", borderColor: "#BFDBFE", color: "#1D4ED8", fontWeight: 700 }}
                        >
                            <FontAwesomeIcon icon={faMobileScreenButton} /> Open PDA Scanner
                        </a>
                        <Link
                            to="/app/purchases/create"
                            className="brand-btn-pill brand-btn-primary text-white text-decoration-none"
                        >
                            <FontAwesomeIcon icon={faPlus} /> Create Purchase
                        </Link>
                    </div>
                </div>

                {/* ── 3. 4 Top KPI Cards Grid (Exact Brands Design) ───────── */}
                <div className="brand-kpi-grid">
                    {/* Card 1: Waiting Putaway */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Waiting Putaway</span>
                            <div className="brand-kpi-icon green">
                                <FontAwesomeIcon icon={faBoxesPacking} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={pendingGrns.length} isCurrency={false} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className={`brand-kpi-badge ${pendingGrns.length > 0 ? "up" : "neutral"}`}>
                                {pendingGrns.length > 0 ? `${pendingGrns.length} Pending Tasks` : "0 Pending"}
                            </span>
                            <LiveSparkline data={pendingSpark} color="#16A34A" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 2: Completed Today */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Completed Putaway</span>
                            <div className="brand-kpi-icon blue">
                                <FontAwesomeIcon icon={faCheckDouble} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={completedGrns.length} isCurrency={false} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className={`brand-kpi-badge ${completedGrns.length > 0 ? "up" : "neutral"}`}>
                                {completedGrns.length > 0 ? `${completedGrns.length} Completed` : "0 Completed"}
                            </span>
                            <LiveSparkline data={completedSpark} color="#2563EB" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 3: Active Zones */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Active Zones</span>
                            <div className="brand-kpi-icon purple">
                                <FontAwesomeIcon icon={faWarehouse} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={4} isCurrency={false} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-label" style={{ fontSize: '13px', color: '#64748B', fontWeight: '700' }}>
                                4 Storage Zones
                            </span>
                            <LiveSparkline data={[1, 1]} color="#9333EA" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 4: Total Stored Qty */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Total Stored Qty</span>
                            <div className="brand-kpi-icon orange">
                                <FontAwesomeIcon icon={faMapMarkerAlt} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={totalAcceptedUnits} isCurrency={false} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge neutral">Units in Bins</span>
                            <LiveSparkline data={[0, 0]} color="#D97706" width={60} height={24} />
                        </div>
                    </div>
                </div>

                {/* ── 4. Main Floating Workspace (Exact Brands Page Style) ─── */}
                <div className="brand-workspace">

                    {/* Filter Bar */}
                    <div className="brand-filter-bar">
                        <div className="brand-search-box">
                            <FontAwesomeIcon icon={faSearch} className="brand-search-icon" />
                            <input
                                type="text"
                                placeholder="Search GRN, PO Number, Supplier, Warehouse..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="d-flex align-items-center gap-2 flex-wrap">
                            <select className="var-select-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                <option value="all">Status: All</option>
                                <option value="pending">Waiting For Putaway</option>
                                <option value="completed">Putaway Completed</option>
                            </select>

                            <select className="var-select-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                <option value="newest">Sort: Newest</option>
                                <option value="oldest">Sort: Oldest</option>
                                <option value="grn">Sort: GRN Number</option>
                                <option value="supplier">Sort: Supplier</option>
                            </select>

                            <div className="var-view-toggle">
                                <button
                                    type="button"
                                    className={`var-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                                    onClick={() => setViewMode('list')}
                                >
                                    <FontAwesomeIcon icon={faList} />
                                </button>
                                <button
                                    type="button"
                                    className={`var-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                    onClick={() => setViewMode('grid')}
                                >
                                    <FontAwesomeIcon icon={faThLarge} />
                                </button>
                            </div>

                            <button
                                type="button"
                                className="cat-btn-filter"
                                onClick={() => {
                                    setSearchTerm('');
                                    setStatusFilter('all');
                                    setSortBy('newest');
                                }}
                            >
                                Reset
                            </button>
                        </div>
                    </div>

                    {/* Content: Loading / Empty State / List / Grid */}
                    {isLoading && processedGrns.length === 0 ? (
                        <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #EEF2F7', padding: '60px 24px', textAlign: 'center', width: '100%' }}>
                            <div className="spinner-border text-primary" role="status" style={{ width: '40px', height: '40px', marginBottom: '16px' }}>
                                <span className="visually-hidden">Loading Putaway Tasks...</span>
                            </div>
                            <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A', marginBottom: '4px' }}>
                                Fetching Putaway Tasks...
                            </h4>
                            <p style={{ fontSize: '13px', color: '#64748B' }}>Connecting to warehouse inventory database</p>
                        </div>
                    ) : processedGrns.length === 0 ? (
                        <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #EEF2F7', padding: '60px 24px', textAlign: 'center', width: '100%' }}>
                            <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', margin: '0 auto 16px auto', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.12)' }}>
                                <FontAwesomeIcon icon={faBoxesPacking} />
                            </div>
                            <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                                No putaway tasks found
                            </h3>
                            <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '440px', margin: '0 auto 22px auto', lineHeight: '1.55' }}>
                                {searchTerm || statusFilter !== 'all'
                                    ? 'No putaway records match your search criteria. Try resetting your filters.'
                                    : 'All goods receipts have been put away into warehouse bins, or no inbound receiving tasks are currently active.'}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                <a
                                    href="/pda/putaway/stream"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="brand-btn-pill text-decoration-none"
                                    style={{ background: "#EFF6FF", borderColor: "#BFDBFE", color: "#1D4ED8", fontWeight: 700 }}
                                >
                                    <FontAwesomeIcon icon={faMobileScreenButton} /> Open PDA Scanner
                                </a>
                                <Link
                                    to="/app/purchases/create"
                                    className="brand-btn-pill brand-btn-primary text-white text-decoration-none"
                                >
                                    <FontAwesomeIcon icon={faPlus} /> Create Purchase
                                </Link>
                            </div>
                        </div>
                    ) : viewMode === 'list' ? (
                        /* LIST VIEW TABLE (Single-Line Luxury Format) */
                        <div className="var-table-wrap" style={{ overflowX: 'auto', width: '100%' }}>
                            <table className="var-table" style={{ width: '100%', minWidth: '1380px', tableLayout: 'auto', borderCollapse: 'separate' }}>
                                <thead>
                                    <tr>
                                        <th style={{ minWidth: '160px', whiteSpace: 'nowrap' }}>GRN NUMBER</th>
                                        <th style={{ minWidth: '130px', whiteSpace: 'nowrap' }}>PO NUMBER</th>
                                        <th style={{ minWidth: '220px', whiteSpace: 'nowrap' }}>SUPPLIER</th>
                                        <th style={{ minWidth: '160px', whiteSpace: 'nowrap' }}>WAREHOUSE</th>
                                        <th style={{ minWidth: '130px', whiteSpace: 'nowrap' }}>ACCEPTED QTY</th>
                                        <th style={{ minWidth: '130px', whiteSpace: 'nowrap' }}>RECEIVING DATE</th>
                                        <th style={{ minWidth: '180px', whiteSpace: 'nowrap' }}>STATUS</th>
                                        <th style={{ minWidth: '180px', whiteSpace: 'nowrap' }}>ASSIGNED USER</th>
                                        <th style={{ textAlign: 'right', minWidth: '150px', paddingRight: '16px', whiteSpace: 'nowrap' }}>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {processedGrns.map((grn, idx) => {
                                        const isCompleted = grn.status === "Putaway Completed";
                                        return (
                                            <tr key={grn.id || idx}>
                                                <td style={{ whiteSpace: 'nowrap' }}>
                                                    <span style={{ display: 'inline-block', background: isCompleted ? "#DCFCE7" : "#FEF3C7", color: isCompleted ? "#15803D" : "#B45309", border: isCompleted ? "1px solid #86EFAC" : "1px solid #FDE68A", padding: "4px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: "800", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                                                        {grn.grn_number}
                                                    </span>
                                                </td>
                                                <td style={{ whiteSpace: 'nowrap' }}>
                                                    <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '800', background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                                                        {grn.po_number}
                                                    </span>
                                                </td>
                                                <td style={{ whiteSpace: 'nowrap' }}>
                                                    <span style={{ fontWeight: "700", color: "#0F172A", fontSize: "13px", whiteSpace: "nowrap" }}>
                                                        {grn.supplier_name}
                                                    </span>
                                                </td>
                                                <td style={{ whiteSpace: 'nowrap' }}>
                                                    <span style={{ fontWeight: "700", color: "#0F172A", fontSize: "13px", whiteSpace: "nowrap" }}>
                                                        {grn.warehouse_name}
                                                    </span>
                                                </td>
                                                <td style={{ whiteSpace: 'nowrap' }}>
                                                    <span style={{ fontWeight: "800", color: "#16A34A", fontSize: "13px", whiteSpace: "nowrap" }}>
                                                        📦 {grn.total_accepted} Units
                                                    </span>
                                                </td>
                                                <td style={{ whiteSpace: 'nowrap' }}>
                                                    <span style={{ fontWeight: "700", color: "#0F172A", fontSize: "12.5px", whiteSpace: "nowrap" }}>
                                                        {grn.receiving_date}
                                                    </span>
                                                </td>
                                                <td style={{ whiteSpace: 'nowrap' }}>
                                                    {isCompleted ? (
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: "#DCFCE7", color: "#15803D", border: "1px solid #86EFAC", padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: "800", whiteSpace: "nowrap" }}>
                                                            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#15803D' }}></span> Putaway Completed
                                                        </span>
                                                    ) : (
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: "#FEF3C7", color: "#B45309", border: "1px solid #FDE68A", padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: "800", whiteSpace: "nowrap" }}>
                                                            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#D97706' }}></span> Waiting For Putaway
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ whiteSpace: 'nowrap' }}>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '12px', fontWeight: '700', color: '#1E293B', whiteSpace: 'nowrap' }}>
                                                        👤 {grn.assigned_user}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right', paddingRight: '16px', whiteSpace: 'nowrap' }}>
                                                    {isCompleted ? (
                                                        <span style={{ fontSize: "12px", fontWeight: "800", background: "#F1F5F9", padding: "5px 12px", borderRadius: "8px", color: "#0F172A", border: "1px solid #CBD5E1", whiteSpace: "nowrap" }}>
                                                            📍 {grn.location || 'Bin Assigned'}
                                                        </span>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-success fw-bold text-white shadow-sm"
                                                            style={{ background: "linear-gradient(135deg, #15803D 0%, #166534 100%)", border: "none", borderRadius: "8px", fontSize: "12px", padding: "6px 14px", whiteSpace: "nowrap" }}
                                                            onClick={() => handleOpenPdaEmulator(grn)}
                                                        >
                                                            <FontAwesomeIcon icon={faMapMarkerAlt} className="me-1" /> Start Putaway →
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        /* COMPACT ELEGANT GRID CARDS */
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                            {processedGrns.map((grn, idx) => {
                                const isCompleted = grn.status === "Putaway Completed";
                                return (
                                    <div
                                        key={grn.id || idx}
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
                                        {/* Row 1: Icon + Supplier + Status */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                                <div style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '10px',
                                                    background: isCompleted ? '#DCFCE7' : '#FEF3C7',
                                                    color: isCompleted ? '#16A34A' : '#D97706',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '14px',
                                                    flexShrink: 0
                                                }}>
                                                    <FontAwesomeIcon icon={isCompleted ? faCheckDouble : faBoxesPacking} />
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {grn.supplier_name || 'Inbound Receipt'}
                                                    </div>
                                                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', whiteSpace: 'nowrap' }}>
                                                        {grn.warehouse_name}
                                                    </div>
                                                </div>
                                            </div>

                                            <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: isCompleted ? '#DCFCE7' : '#FEF3C7', color: isCompleted ? '#15803D' : '#B45309', border: isCompleted ? '1px solid #86EFAC' : '1px solid #FDE68A', whiteSpace: 'nowrap' }}>
                                                {grn.grn_number}
                                            </span>
                                        </div>

                                        {/* Row 2: Meta Strip */}
                                        <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '6px 10px', fontSize: '11px', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div>
                                                <span style={{ fontWeight: '800', color: '#16A34A' }}>📦 {grn.total_accepted} Units</span>
                                            </div>
                                            <div style={{ fontWeight: '700', color: '#2563EB', fontFamily: 'monospace' }}>
                                                PO: {grn.po_number}
                                            </div>
                                        </div>

                                        {/* Row 3: User + Action */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid #F1F5F9' }}>
                                            <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                                                👤 {grn.assigned_user}
                                            </span>
                                            {!isCompleted ? (
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-success fw-bold text-white shadow-sm"
                                                    style={{ fontSize: '11.5px', borderRadius: '6px', padding: '4px 10px', background: '#16A34A', border: 'none' }}
                                                    onClick={() => handleOpenPdaEmulator(grn)}
                                                >
                                                    Start →
                                                </button>
                                            ) : (
                                                <span style={{ fontSize: '11px', fontWeight: '700', color: '#15803D' }}>
                                                    ✔ Completed
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                </div>

            </div>
            )}

            {/* ── PDA MOBILE EMULATOR MODAL ── */}
            <Modal show={showPdaEmulator} onHide={() => { setShowPdaEmulator(false); fetchGrns(); }} size="md" centered className="pda-emulator-modal">
                <div className="pda-emulator-close-bar">
                    <button className="pda-emulator-close-btn" onClick={() => { setShowPdaEmulator(false); fetchGrns(); }}>
                        <FontAwesomeIcon icon={faTimes} style={{ marginRight: "6px" }} /> Close Emulator
                    </button>
                </div>
                <div className="pda-device-frame">
                    <div className="pda-device-notch"></div>
                    <div className="pda-device-screen">
                        {selectedGrn && (
                            <iframe 
                                src={`/pda/putaway/session/${selectedGrn.id}`} 
                                title="PDA Emulator"
                                style={{ width: "100%", height: "100%", border: "none" }}
                            />
                        )}
                    </div>
                </div>
            </Modal>
        </MasterLayout>
    );
};

export default Putaway;

