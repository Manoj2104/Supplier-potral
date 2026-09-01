import React, { useState, useEffect, useRef } from "react";
import { connect } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faSearch,
    faBoxes,
    faExclamationTriangle,
    faTimesCircle,
    faClock,
    faDownload,
    faFilter,
    faChevronDown,
    faEllipsisV,
    faSync,
    faCheckCircle,
    faBuilding,
    faShieldAlt,
    faTruck,
    faBan,
    faChartPie,
    faPercentage,
    faWarehouse,
    faBarcode,
    faPlus,
    faMapMarkerAlt,
    faList,
    faThLarge,
    faEye,
    faEdit
} from "@fortawesome/free-solid-svg-icons";
import MasterLayout from "../MasterLayout";
import TabTitle from "../../shared/tab-title/TabTitle";
import { fetchFrontSetting } from "../../store/action/frontSettingAction";
import { fetchAllWarehouses } from "../../store/action/warehouseAction";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import apiConfig from "../../config/apiConfig";
import { getCached, setCache } from "../../store/apiCache";
import useSmartLoading from "../../shared/hooks/useSmartLoading";
import "../brands/ProductBrandsPremium.css";
import LiveCounter from "../../shared/components/LiveCounter";
import LiveSparkline from "../../shared/components/LiveSparkline";
import "./EnterpriseInventory.css";
import { subscribePosDataChanged } from "../../shared/posEvents";
import { getInstantProductSvgUrl } from "../../shared/instantProductSvg";

// Enterprise Alphanumeric SKU (e.g. MCF82302GSW)
const generateProductSku = (title, id, existingSku) => {
    if (existingSku && typeof existingSku === 'string' && existingSku.length >= 6 && !/^\d+$/.test(existingSku) && !existingSku.startsWith('PR_')) {
        return existingSku;
    }
    const cleanTitle = (title || 'PRD').replace(/[^a-zA-Z]/g, '').toUpperCase();
    const prefix = cleanTitle.length >= 3 ? cleanTitle.slice(0, 3) : (cleanTitle + 'PRD').slice(0, 3);
    const numId = Number(id) || 1;
    const hash = (numId * 9301 + 49297) % 89999 + 10000;
    const suffixes = ['GSW', 'POS', 'RTL', 'EXP', 'STK', 'HUB', 'WHS'];
    const suffix = suffixes[numId % suffixes.length];
    return `${prefix}${hash}${suffix}`;
};

// Cache version — bump this to invalidate old cached data with fake values
const CACHE_VERSION = 'v2_real';

const isCacheValid = (cached) => {
    if (!cached || !cached.data || !cached.data.length) return false;
    // Reject old cache that had fake '32.5%' or expiring_soon values
    if (cached.summary && cached.summary.capacity_used === '32.5%') return false;
    if (cached.summary && cached.summary.expiring_soon !== undefined) return false;
    if (cached._version !== CACHE_VERSION) return false;
    return true;
};

// Helper to get cached inventory synchronously for instant display
const getInitialInventoryData = () => {
    try {
        const memory = getCached("inventory:master_stock");
        if (memory && memory.data && memory.data.length > 0) {
            return memory;
        }
    } catch (e) {}
    return null;
};

// Realistic Scanner Barcode Component
const RealBarcode = ({ code }) => {
    const str = String(code || "8902888746737");
    const barWidths = [
        3, 1, 2, 1, 3, 1, 2, 2, 1, 3, 1, 2, 1, 3, 2, 1, 2, 1, 3, 1, 2, 1, 3, 2, 1, 2, 3, 1, 2, 1, 3
    ];

    return (
        <div className="ent-barcode-wrapper" title={`Scan Barcode: ${str}`}>
            <svg width="100" height="22" viewBox="0 0 100 22" style={{ display: "block" }}>
                <rect x="0" y="0" width="100" height="22" fill="#FFFFFF" />
                {barWidths.map((w, idx) => {
                    const x = idx * 3.1 + 2;
                    return (
                        <rect
                            key={idx}
                            x={x}
                            y="0"
                            width={w}
                            height="22"
                            fill="#0F172A"
                        />
                    );
                })}
            </svg>
            <span className="ent-barcode-num">{str}</span>
        </div>
    );
};

const EnterpriseInventory = (props) => {
    const { fetchFrontSetting, fetchAllWarehouses } = props;
    const navigate = useNavigate();
    const isMounted = useRef(true);

    const cachedData = getInitialInventoryData();
    const [inventoryList, setInventoryList] = useState(cachedData?.data || []);
    const [summary, setSummary] = useState(cachedData?.summary || {
        total_products: 0,
        available_qty: 0,
        inventory_value: 0,
        low_stock_count: 0,
        out_of_stock_count: 0,
        in_stock_count: 0,
        reserved_stock: 0,
        receiving_stock: 0,
        capacity_used: '0%',
        active_bins: 0
    });
    const [loading, setLoading] = useState(!cachedData || !cachedData.data?.length);
    const [lastSync, setLastSync] = useState(cachedData ? moment().format("HH:mm:ss") : null);

    // Filter Controls
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedWarehouse, setSelectedWarehouse] = useState("All");
    const [selectedZone, setSelectedZone] = useState("All");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedStatus, setSelectedStatus] = useState("All");
    const [sortBy, setSortBy] = useState("newest");
    const [viewMode, setViewMode] = useState("list");

    const [selectedRows, setSelectedRows] = useState([]);

    const loadMasterInventory = (isInitial = false) => {
        apiConfig.get("inventory/master-stock")
            .then(response => {
                if (!isMounted.current) return;
                const resData = response.data;
                if (resData && resData.success) {
                    const versionedData = { ...resData, _version: CACHE_VERSION };
                    setCache("inventory:master_stock", versionedData);
                    setInventoryList(resData.data || []);
                    setSummary(resData.summary || {});
                    setLastSync(moment().format("HH:mm:ss"));
                }
            })
            .catch(err => console.error("Error loading master inventory:", err))
            .finally(() => {
                if (isMounted.current) {
                    setLoading(false);
                }
            });
    };

    useEffect(() => {
        isMounted.current = true;
        fetchFrontSetting();
        fetchAllWarehouses();
        loadMasterInventory(true);

        let bc = null;
        try {
            if (window.BroadcastChannel) {
                bc = new BroadcastChannel('infypos_realtime_bus');
                bc.onmessage = (event) => {
                    if (event && event.data) {
                        loadMasterInventory(false);
                    }
                };
            }
        } catch(e) {}

        const handleStorage = (e) => {
            if (e.key === 'infypos_sync_pulse' || e.key === 'infy_inventory_sync' || e.key === 'infy_purchase_sync' || e.key === 'infypos_realtime_event') {
                loadMasterInventory(false);
            }
        };

        const handleFocus = () => loadMasterInventory(false);
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                loadMasterInventory(false);
            }
        };

        window.addEventListener('storage', handleStorage);
        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibility);

        const unsubscribe = subscribePosDataChanged(() => {
            loadMasterInventory(false);
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

    // Filter Computation
    let filteredList = inventoryList.filter(item => {
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch = !query ||
            item.name?.toLowerCase().includes(query) ||
            item.sku?.toLowerCase().includes(query) ||
            (item.barcode || "").toLowerCase().includes(query) ||
            item.supplier_name?.toLowerCase().includes(query) ||
            item.bin_location?.toLowerCase().includes(query) ||
            item.category_name?.toLowerCase().includes(query);

        const matchesWarehouse = selectedWarehouse === "All" || item.warehouse_name === selectedWarehouse;
        const matchesZone = selectedZone === "All" || item.zone === selectedZone;
        const matchesCategory = selectedCategory === "All" || item.category_name === selectedCategory;
        const matchesStatus = selectedStatus === "All" || item.status === selectedStatus;

        return matchesSearch && matchesWarehouse && matchesZone && matchesCategory && matchesStatus;
    });

    if (sortBy === "name") {
        filteredList.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sortBy === "qty_high") {
        filteredList.sort((a, b) => Number(b.available_qty || 0) - Number(a.available_qty || 0));
    } else if (sortBy === "qty_low") {
        filteredList.sort((a, b) => Number(a.available_qty || 0) - Number(b.available_qty || 0));
    } else if (sortBy === "val_high") {
        filteredList.sort((a, b) => Number(b.inventory_value || 0) - Number(a.inventory_value || 0));
    } else if (sortBy === "oldest") {
        filteredList.sort((a, b) => Number(a.id || 0) - Number(b.id || 0));
    } else {
        filteredList.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
    }

    const formatCurrency = (val) => {
        return `₹ ${Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const handleExport = () => {
        const headers = ["Product Name", "SKU", "Barcode", "Warehouse", "Zone", "Bin", "Available Qty", "Total Qty", "Reserved Qty", "Unit Price", "GST %", "Inventory Value", "Status"];
        const rows = filteredList.map(i => [
            `"${i.name}"`,
            `"${i.sku}"`,
            `"${i.barcode}"`,
            `"${i.warehouse_name}"`,
            `"${i.zone}"`,
            `"${i.bin_location}"`,
            i.available_qty,
            i.total_qty,
            i.reserved_qty,
            i.selling_price,
            `${i.gst_pct}%`,
            i.inventory_value,
            `"${i.status}"`
        ]);
        const csvContent = "data:text/csv;charset=utf-8," +
            [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `INFY_Inventory_${moment().format("YYYY-MM-DD")}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const toggleSelectRow = (e, id) => {
        e.stopPropagation();
        setSelectedRows(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedRows.length === filteredList.length) {
            setSelectedRows([]);
        } else {
            setSelectedRows(filteredList.map(i => i.id));
        }
    };

    const clearFilters = () => {
        setSearchQuery("");
        setSelectedWarehouse("All");
        setSelectedZone("All");
        setSelectedCategory("All");
        setSelectedStatus("All");
        setSortBy("newest");
    };

    const uniqueCategories = [...new Set(inventoryList.map(i => i.category_name).filter(Boolean))];

    return (
        <MasterLayout>
            <TabTitle title="Inventory Management — INFY-POS Enterprise WMS" />

            <div className="brand-page-container">

                {/* ── 1. Breadcrumb (Exact Brands Page Style) ─────────────── */}
                <div className="brand-breadcrumb">
                    <span>Dashboard</span>
                    <span>&gt;</span>
                    <span>Inbound</span>
                    <span>&gt;</span>
                    <span className="brand-crumb-active">Inventory</span>
                </div>

                {/* ── 2. Header Row (Exact Brands Page Style) ─────────────── */}
                <div className="brand-header">
                    <div className="brand-title-group">
                        <h1>
                            Inventory
                        </h1>
                        <p>
                            Real-time inventory overview across all warehouses and storage bins.
                            {lastSync && <span style={{ marginLeft: 8, color: "#94A3B8", fontSize: 12 }}>
                                (Synced: {lastSync})
                            </span>}
                        </p>
                    </div>

                    <div className="brand-header-actions">
                        <button type="button" className="brand-btn-pill" onClick={handleExport}>
                            <FontAwesomeIcon icon={faDownload} /> Export CSV
                        </button>

                        <div className="dropdown d-inline-block">
                            <button type="button" className="brand-btn-pill brand-btn-primary text-white" data-bs-toggle="dropdown" aria-expanded="false">
                                <FontAwesomeIcon icon={faPlus} /> Inventory Actions &nbsp;<FontAwesomeIcon icon={faChevronDown} style={{ fontSize: 10 }} />
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end shadow border-0" style={{ borderRadius: 14, minWidth: 210 }}>
                                <li><a className="dropdown-item py-2 fw-bold" href="#/app/adjustments/create">➕ &nbsp;Stock Adjustment</a></li>
                                <li><a className="dropdown-item py-2 fw-bold" href="#/app/bins">📦 &nbsp;Move Bin Location</a></li>
                                <li><a className="dropdown-item py-2 fw-bold" href="#/app/print/barcode">🏷️ &nbsp;Print Barcodes</a></li>
                                <li><hr className="dropdown-divider" /></li>
                                <li>
                                    <button className="dropdown-item py-2 fw-bold text-success" onClick={() => loadMasterInventory(true)}>
                                        <FontAwesomeIcon icon={faSync} className="me-2" /> Sync Live Inventory
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* ── 3. 8 Top KPI Cards (Top 4 + Below 4 in 2 Clean Rows) ─── */}
                <div className="brand-kpi-grid mb-3">
                    {/* Card 1: Total Products */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Total Products</span>
                            <div className="brand-kpi-icon green">
                                <FontAwesomeIcon icon={faBoxes} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={summary.total_products || inventoryList.length} isCurrency={false} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge up">Active SKUs</span>
                            <LiveSparkline color="#16A34A" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 2: Available Qty */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Available Qty</span>
                            <div className="brand-kpi-icon blue">
                                <FontAwesomeIcon icon={faWarehouse} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={summary.available_qty || 0} isCurrency={false} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge up">Units in Stock</span>
                            <LiveSparkline color="#2563EB" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 3: Inventory Value */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Inventory Value</span>
                            <div className="brand-kpi-icon purple">
                                <FontAwesomeIcon icon={faBuilding} />
                            </div>
                        </div>
                        <div className="brand-kpi-value" style={{ fontSize: '24px' }}>
                            {formatCurrency(summary.inventory_value || 0)}
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-label" style={{ fontSize: '13px', color: '#64748B', fontWeight: '700' }}>
                                Total Valuation
                            </span>
                            <LiveSparkline color="#9333EA" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 4: Active Bins */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Active Bins</span>
                            <div className="brand-kpi-icon orange">
                                <FontAwesomeIcon icon={faMapMarkerAlt} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={summary.active_bins || 0} isCurrency={false} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge up">Allocated Bins</span>
                            <LiveSparkline color="#D97706" width={60} height={24} />
                        </div>
                    </div>

                    {/* ── ROW 2 (Below 4 Cards) ── */}
                    {/* Card 5: Low Stock */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Low Stock Items</span>
                            <div className="brand-kpi-icon orange">
                                <FontAwesomeIcon icon={faExclamationTriangle} />
                            </div>
                        </div>
                        <div className="brand-kpi-value" style={{ color: summary.low_stock_count > 0 ? '#D97706' : undefined }}>
                            <LiveCounter value={summary.low_stock_count || 0} isCurrency={false} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className={`brand-kpi-badge ${summary.low_stock_count > 0 ? 'up' : 'neutral'}`}>
                                {summary.low_stock_count > 0 ? 'Need Reorder' : 'Healthy Levels'}
                            </span>
                            <LiveSparkline color="#D97706" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 6: Out of Stock */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Out of Stock</span>
                            <div className="brand-kpi-icon" style={{ background: '#FEE2E2', color: '#DC2626' }}>
                                <FontAwesomeIcon icon={faTimesCircle} />
                            </div>
                        </div>
                        <div className="brand-kpi-value" style={{ color: summary.out_of_stock_count > 0 ? '#DC2626' : undefined }}>
                            <LiveCounter value={summary.out_of_stock_count || 0} isCurrency={false} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className={`brand-kpi-badge ${summary.out_of_stock_count > 0 ? 'down' : 'neutral'}`}>
                                {summary.out_of_stock_count > 0 ? '0 Units Available' : 'No Stockouts'}
                            </span>
                            <LiveSparkline color="#DC2626" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 7: Receiving Stock */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Inbound Receiving</span>
                            <div className="brand-kpi-icon blue">
                                <FontAwesomeIcon icon={faTruck} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={summary.receiving_stock || 0} isCurrency={false} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge neutral">Incoming Units</span>
                            <LiveSparkline color="#2563EB" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 8: Capacity Used */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Capacity Used</span>
                            <div className="brand-kpi-icon green">
                                <FontAwesomeIcon icon={faChartPie} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            {summary.capacity_used || '0%'}
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge up">WH Utilization</span>
                            <LiveSparkline color="#16A34A" width={60} height={24} />
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
                                placeholder="Search SKU, Product, Barcode, Supplier, Bin..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="d-flex align-items-center gap-2 flex-wrap">
                            <select className="var-select-sm" value={selectedWarehouse} onChange={e => setSelectedWarehouse(e.target.value)}>
                                <option value="All">Warehouse: All</option>
                                <option value="Suguna Warehouse">Suguna Warehouse</option>
                                <option value="Main Warehouse">Main Warehouse</option>
                            </select>

                            <select className="var-select-sm" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                                <option value="All">Category: All</option>
                                {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>

                            <select className="var-select-sm" value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
                                <option value="All">Status: All</option>
                                <option value="Available">Available</option>
                                <option value="Low Stock">Low Stock</option>
                                <option value="Out of Stock">Out of Stock</option>
                            </select>

                            <select className="var-select-sm" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                                <option value="newest">Sort: Newest</option>
                                <option value="qty_high">Sort: Stock (High-Low)</option>
                                <option value="qty_low">Sort: Stock (Low-High)</option>
                                <option value="val_high">Sort: Value (High-Low)</option>
                                <option value="name">Sort: Name (A-Z)</option>
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

                            <button type="button" className="cat-btn-filter" onClick={clearFilters}>
                                Reset
                            </button>
                        </div>
                    </div>

                    {/* Batch Actions Toolbar */}
                    {selectedRows.length > 0 && (
                        <div className="d-flex align-items-center justify-content-between p-3 mb-3 bg-light rounded-3 border">
                            <div className="d-flex align-items-center gap-2">
                                <span className="badge bg-primary rounded-pill px-3 py-2">{selectedRows.length} Products Selected</span>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <button type="button" className="btn btn-sm btn-outline-dark fw-bold rounded-pill" onClick={handleExport}>
                                    <FontAwesomeIcon icon={faDownload} className="me-1" /> Export Selected CSV
                                </button>
                                <a href="#/app/print/barcode" className="btn btn-sm btn-primary fw-bold rounded-pill text-white">
                                    <FontAwesomeIcon icon={faBarcode} className="me-1" /> Print Barcodes
                                </a>
                                <button type="button" className="btn btn-sm btn-light border fw-bold rounded-pill" onClick={() => setSelectedRows([])}>
                                    Clear Selection
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Content: List / Grid / Empty State */}
                    {filteredList.length === 0 ? (
                        <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #EEF2F7', padding: '60px 24px', textAlign: 'center', width: '100%' }}>
                            <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', margin: '0 auto 16px auto', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.12)' }}>
                                <FontAwesomeIcon icon={faBoxes} />
                            </div>
                            <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                                No inventory items found
                            </h3>
                            <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '440px', margin: '0 auto 22px auto', lineHeight: '1.55' }}>
                                {searchQuery || selectedWarehouse !== 'All' || selectedStatus !== 'All'
                                    ? 'No inventory records match your search criteria. Try clearing or resetting filters.'
                                    : 'Add product stock or perform purchase receiving to see real-time inventory overview.'}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                <button
                                    type="button"
                                    className="brand-btn-pill"
                                    onClick={clearFilters}
                                >
                                    Reset Filters
                                </button>
                                <a
                                    href="#/app/adjustments/create"
                                    className="brand-btn-pill brand-btn-primary text-white text-decoration-none"
                                >
                                    <FontAwesomeIcon icon={faPlus} /> Stock Adjustment
                                </a>
                            </div>
                        </div>
                    ) : viewMode === 'list' ? (
                        <div className="var-table-wrap" style={{ overflowX: 'auto', width: '100%' }}>
                            <table className="var-table" style={{ width: '100%', minWidth: '1380px', tableLayout: 'auto', borderCollapse: 'separate' }}>
                                <thead>
                                    <tr>
                                        <th style={{ width: '36px', whiteSpace: 'nowrap' }}>
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={selectedRows.length > 0 && selectedRows.length === filteredList.length}
                                                onChange={toggleSelectAll}
                                            />
                                        </th>
                                        <th style={{ width: '44px', whiteSpace: 'nowrap' }}>IMAGE</th>
                                        <th style={{ minWidth: '180px', whiteSpace: 'nowrap' }}>PRODUCT</th>
                                        <th style={{ minWidth: '125px', whiteSpace: 'nowrap' }}>SKU</th>
                                        <th style={{ minWidth: '135px', whiteSpace: 'nowrap', textAlign: 'center' }}>BARCODE</th>
                                        <th style={{ minWidth: '160px', whiteSpace: 'nowrap' }}>WAREHOUSE</th>
                                        <th style={{ minWidth: '110px', whiteSpace: 'nowrap' }}>BIN LOCATION</th>
                                        <th style={{ minWidth: '120px', whiteSpace: 'nowrap' }}>AVAILABLE QTY</th>
                                        <th style={{ minWidth: '100px', whiteSpace: 'nowrap' }}>TOTAL QTY</th>
                                        <th style={{ minWidth: '100px', whiteSpace: 'nowrap' }}>UNIT PRICE</th>
                                        <th style={{ minWidth: '120px', whiteSpace: 'nowrap' }}>INVENTORY VALUE</th>
                                        <th style={{ minWidth: '110px', whiteSpace: 'nowrap' }}>STATUS</th>
                                        <th style={{ textAlign: 'right', minWidth: '130px', paddingRight: '16px', whiteSpace: 'nowrap' }}>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredList.map((item, idx) => {
                                        const isChecked = selectedRows.includes(item.id);
                                        const computedSku = generateProductSku(item.name, item.id, item.sku);
                                        const fallbackImg = getInstantProductSvgUrl(item.name || 'Product', item.category_name || 'General', item.id);

                                        return (
                                            <tr
                                                key={item.id || idx}
                                                onDoubleClick={() => navigate(`/app/inventory/detail/${item.id}`)}
                                                style={{ cursor: "pointer", background: isChecked ? '#F0FDF4' : 'transparent' }}
                                                title="Double-tap to open product details"
                                            >
                                                <td style={{ whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        checked={isChecked}
                                                        onChange={(e) => toggleSelectRow(e, item.id)}
                                                    />
                                                </td>

                                                <td style={{ whiteSpace: 'nowrap' }}>
                                                    <img
                                                        src={item.image_url || fallbackImg}
                                                        alt={item.name}
                                                        style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover", border: "1px solid #E2E8F0" }}
                                                        onError={(e) => { e.target.src = fallbackImg; }}
                                                    />
                                                </td>

                                                <td style={{ whiteSpace: 'nowrap' }}>
                                                    <div>
                                                        <div style={{ fontWeight: 800, color: "#0F172A", fontSize: 13.5, whiteSpace: 'nowrap' }}>{item.name}</div>
                                                        <div style={{ fontSize: 11.5, color: "#64748B", whiteSpace: 'nowrap' }}>{item.category_name}</div>
                                                    </div>
                                                </td>

                                                <td style={{ whiteSpace: 'nowrap' }}>
                                                    <span
                                                        style={{
                                                            display: 'inline-block',
                                                            padding: '3px 8px',
                                                            borderRadius: '8px',
                                                            fontSize: '12px',
                                                            fontWeight: '800',
                                                            background: '#EFF6FF',
                                                            color: '#2563EB',
                                                            border: '1px solid #BFDBFE',
                                                            fontFamily: 'monospace',
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                    >
                                                        {computedSku}
                                                    </span>
                                                </td>

                                                <td style={{ textAlign: "center", whiteSpace: 'nowrap' }}>
                                                    <RealBarcode code={item.barcode} />
                                                </td>

                                                <td style={{ fontWeight: 700, color: "#0F172A", fontSize: 13, whiteSpace: 'nowrap' }}>
                                                    {item.warehouse_name}
                                                </td>

                                                <td style={{ whiteSpace: 'nowrap' }}>
                                                    <span style={{ fontFamily: "monospace", fontWeight: 800, color: "#0F172A", background: "#F1F5F9", padding: "3px 8px", borderRadius: 6, fontSize: 12, whiteSpace: 'nowrap' }}>
                                                        {item.bin_location}
                                                    </span>
                                                </td>

                                                <td style={{ fontWeight: 800, fontSize: 13, color: Number(item.available_qty) > 0 ? "#16A34A" : "#DC2626", whiteSpace: 'nowrap' }}>
                                                    {item.available_qty} Units
                                                </td>

                                                <td style={{ fontWeight: 700, color: "#0F172A", fontSize: 13, whiteSpace: 'nowrap' }}>
                                                    {item.total_qty} Units
                                                </td>

                                                <td style={{ fontWeight: 800, color: "#0F172A", fontSize: 13, whiteSpace: 'nowrap' }}>
                                                    {formatCurrency(item.selling_price)}
                                                </td>

                                                <td style={{ fontWeight: 800, color: "#16A34A", fontSize: 13, whiteSpace: 'nowrap' }}>
                                                    {formatCurrency(item.inventory_value)}
                                                </td>

                                                <td style={{ whiteSpace: 'nowrap' }}>
                                                    {item.status === "Available" ? (
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '800', background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', whiteSpace: 'nowrap' }}>
                                                            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#15803D' }}></span> Available
                                                        </span>
                                                    ) : item.status === "Low Stock" ? (
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '800', background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A', whiteSpace: 'nowrap' }}>
                                                            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#D97706' }}></span> Low Stock
                                                        </span>
                                                    ) : (
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '800', background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA', whiteSpace: 'nowrap' }}>
                                                            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#DC2626' }}></span> Out of Stock
                                                        </span>
                                                    )}
                                                </td>

                                                <td style={{ textAlign: "right", paddingRight: "16px", whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                                                    <div className="brand-card-actions" style={{ justifyContent: 'flex-end', gap: '4px' }}>
                                                        <button
                                                            type="button"
                                                            className="brand-action-btn"
                                                            title="View Details"
                                                            onClick={() => navigate(`/app/inventory/detail/${item.id}`)}
                                                        >
                                                            <FontAwesomeIcon icon={faEye} />
                                                        </button>
                                                        <a
                                                            href="#/app/adjustments/create"
                                                            className="brand-action-btn edit"
                                                            title="Adjust Stock"
                                                        >
                                                            <FontAwesomeIcon icon={faEdit} />
                                                        </a>
                                                        <a
                                                            href="#/app/print/barcode"
                                                            className="brand-action-btn"
                                                            title="Print Barcode"
                                                            style={{ color: '#2563EB' }}
                                                        >
                                                            <FontAwesomeIcon icon={faBarcode} />
                                                        </a>
                                                    </div>
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
                            {filteredList.map((item, idx) => {
                                const computedSku = generateProductSku(item.name, item.id, item.sku);
                                const fallbackImg = getInstantProductSvgUrl(item.name || 'Product', item.category_name || 'General', item.id);

                                return (
                                    <div
                                        key={item.id || idx}
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
                                        onDoubleClick={() => navigate(`/app/inventory/detail/${item.id}`)}
                                    >
                                        {/* Row 1: Image + Name + SKU */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                                <img
                                                    src={item.image_url || fallbackImg}
                                                    alt={item.name}
                                                    style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover', border: '1px solid #E2E8F0', flexShrink: 0 }}
                                                    onError={(e) => { e.target.src = fallbackImg; }}
                                                />
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {item.name}
                                                    </div>
                                                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', whiteSpace: 'nowrap' }}>
                                                        {item.category_name}
                                                    </div>
                                                </div>
                                            </div>

                                            <span style={{ padding: '2px 8px', fontSize: '11px', fontWeight: '800', background: '#EFF6FF', color: '#2563EB', borderRadius: '6px', border: '1px solid #BFDBFE', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                                                {computedSku}
                                            </span>
                                        </div>

                                        {/* Row 2: Warehouse + Bin */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#0F172A', fontWeight: '700' }}>
                                            <span>{item.warehouse_name}</span>
                                            <span style={{ fontFamily: 'monospace', background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>📍 {item.bin_location}</span>
                                        </div>

                                        {/* Row 3: Meta Strip */}
                                        <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '6px 10px', fontSize: '11px', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div>
                                                <span style={{ fontWeight: '800', color: Number(item.available_qty) > 0 ? '#16A34A' : '#DC2626' }}>{item.available_qty} Units</span>
                                                <span style={{ color: '#64748B', marginLeft: '4px' }}>/ {item.total_qty} Total</span>
                                            </div>
                                            <div style={{ fontWeight: '800', color: '#16A34A', whiteSpace: 'nowrap' }}>
                                                {formatCurrency(item.inventory_value)}
                                            </div>
                                        </div>

                                        {/* Row 4: Status + Actions */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid #F1F5F9' }}>
                                            <div>
                                                {item.status === "Available" ? (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: '800', background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
                                                        <span style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', background: '#15803D' }}></span> Available
                                                    </span>
                                                ) : (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: '800', background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA' }}>
                                                        <span style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', background: '#DC2626' }}></span> {item.status}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="brand-card-actions" style={{ gap: '4px' }} onClick={e => e.stopPropagation()}>
                                                <button
                                                    type="button"
                                                    className="brand-action-btn"
                                                    title="View Details"
                                                    onClick={() => navigate(`/app/inventory/detail/${item.id}`)}
                                                >
                                                    <FontAwesomeIcon icon={faEye} />
                                                </button>
                                                <a
                                                    href="#/app/adjustments/create"
                                                    className="brand-action-btn edit"
                                                    title="Adjust Stock"
                                                >
                                                    <FontAwesomeIcon icon={faEdit} />
                                                </a>
                                                <a
                                                    href="#/app/print/barcode"
                                                    className="brand-action-btn"
                                                    title="Print Barcode"
                                                    style={{ color: '#2563EB' }}
                                                >
                                                    <FontAwesomeIcon icon={faBarcode} />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                </div>

            </div>
        </MasterLayout>
    );
};

const mapStateToProps = (state) => {
    const { warehouses } = state;
    return { warehouses };
};

export default connect(mapStateToProps, {
    fetchFrontSetting,
    fetchAllWarehouses
})(EnterpriseInventory);
