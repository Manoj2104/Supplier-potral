import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Modal, Form } from "react-bootstrap-v5";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faSearch,
    faBookmark,
    faPlus,
    faWarehouse,
    faBoxes,
    faCheckCircle,
    faExclamationTriangle,
    faCube,
    faSlidersH,
    faEdit,
    faTrash,
    faSave,
    faTimes,
    faBuilding,
    faThLarge,
    faList,
    faRotateLeft,
    faBox,
    faChartLine,
    faArrowRight,
    faTags,
    faLayerGroup,
    faCalendarDay,
    faLink,
    faDownload,
    faSync
} from "@fortawesome/free-solid-svg-icons";
import MasterLayout from "../MasterLayout";
import TabTitle from "../../shared/tab-title/TabTitle";
import MasterTableSkeleton from "../../shared/components/skeletons/MasterTableSkeleton";
import LiveCounter from "../../shared/components/LiveCounter";
import LiveSparkline from "../../shared/components/LiveSparkline";
import { isPageFirstLoad, markPageAnimated } from "../dashboard/dashboardAnimationState";
import "../brands/ProductBrandsPremium.css";
import "./LiveWarehouseReceiving.css";
import { getCached, setCache } from "../../store/apiCache";
import { subscribePosDataChanged } from "../../shared/posEvents";
import moment from "moment";

const getInitialBinsCache = () => {
    try {
        const memory = getCached("warehouse:bins");
        if (memory && Array.isArray(memory) && memory.length > 0) return memory;
    } catch(e) {}
    return [];
};

const getInitialZonesCache = () => {
    try {
        const memory = getCached("warehouse:zones");
        if (memory && Array.isArray(memory) && memory.length > 0) return memory;
    } catch(e) {}
    return [];
};

const WarehouseBins = () => {
    const navigate = useNavigate();
    const isMounted = useRef(true);

    const initialBins = getInitialBinsCache();
    const initialZones = getInitialZonesCache();
    const [bins, setBins] = useState(initialBins);
    const [zones, setZones] = useState(initialZones);
    const [isLoading, setIsLoading] = useState(!initialBins.length);
    const [lastSync, setLastSync] = useState(moment().format("HH:mm:ss"));
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedZone, setSelectedZone] = useState("All Zones");
    const [selectedStatus, setSelectedStatus] = useState("All Status");
    const [sortBy, setSortBy] = useState("newest");
    const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'

    // Modal / Action states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newBinCode, setNewBinCode] = useState("");
    const [newZoneName, setNewZoneName] = useState("Zone A");
    const [newCapacity, setNewCapacity] = useState(1000);
    const [errors, setErrors] = useState({});

    // Create Zone Modal State
    const [showCreateZoneModal, setShowCreateZoneModal] = useState(false);
    const [zoneNameInput, setZoneNameInput] = useState("");
    const [zoneCategoryInput, setZoneCategoryInput] = useState("Fast Moving (FMCG)");
    const [zoneColorInput, setZoneColorInput] = useState("#2563EB");
    const [zoneCapacityInput, setZoneCapacityInput] = useState(5000);

    // Allocate product states
    const [showAllocateModal, setShowAllocateModal] = useState(false);
    const [products, setProducts] = useState([]);
    const [selectedProductId, setSelectedProductId] = useState("");
    const [allocateQty, setAllocateQty] = useState(1);

    // Inline edits
    const [editingProductId, setEditingProductId] = useState(null);
    const [editingBinCode, setEditingBinCode] = useState("");
    const [editQuantity, setEditQuantity] = useState(0);

    // Broadcast helper
    const broadcastSync = (type = 'bin_update') => {
        try {
            if (window.BroadcastChannel) {
                const bc = new BroadcastChannel('infypos_realtime_bus');
                bc.postMessage({ type: 'bins', action: type, timestamp: Date.now() });
                bc.close();
            }
        } catch(e) {}
        try {
            localStorage.setItem('infypos_sync_pulse', Date.now().toString());
            localStorage.setItem('infy_inventory_sync', Date.now().toString());
            localStorage.setItem('infy_putaway_sync', Date.now().toString());
        } catch(e) {}
    };

    // Unified parallel fetch
    const fetchAllData = (isSilent = false) => {
        if (!isSilent && isMounted.current && bins.length === 0) {
            setIsLoading(true);
        }

        Promise.all([
            fetch('/api/warehouse-bins').then(r => r.json()),
            fetch('/api/warehouse-zones').then(r => r.json()),
            fetch('/api/warehouse-bins/detail/A-01-01').then(r => r.json()).catch(() => ({ products: [] }))
        ])
        .then(([binsData, zonesData, detailData]) => {
            if (!isMounted.current) return;
            if (Array.isArray(binsData)) {
                setCache("warehouse:bins", binsData);
                setBins(binsData);
            }
            if (Array.isArray(zonesData)) {
                setCache("warehouse:zones", zonesData);
                setZones(zonesData);
                if (zonesData.length > 0 && !newZoneName) {
                    setNewZoneName(zonesData[0].name);
                }
            }
            if (detailData && detailData.products) {
                setProducts(detailData.products);
            }
            setLastSync(moment().format("HH:mm:ss"));
        })
        .catch(err => console.error("Error fetching warehouse bins data:", err))
        .finally(() => {
            if (isMounted.current) {
                setIsLoading(false);
            }
        });
    };

    useEffect(() => {
        isMounted.current = true;
        fetchAllData(false);

        let bc = null;
        try {
            if (window.BroadcastChannel) {
                bc = new BroadcastChannel('infypos_realtime_bus');
                bc.onmessage = (event) => {
                    if (event && event.data) {
                        fetchAllData(true);
                    }
                };
            }
        } catch(e) {}

        const handleStorage = (e) => {
            if (e.key === 'infypos_sync_pulse' || e.key === 'infy_inventory_sync' || e.key === 'infy_putaway_sync' || e.key === 'infypos_realtime_event') {
                fetchAllData(true);
            }
        };

        const handleFocus = () => fetchAllData(true);
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                fetchAllData(true);
            }
        };

        window.addEventListener('storage', handleStorage);
        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibility);

        const unsubscribe = subscribePosDataChanged(() => {
            fetchAllData(true);
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

    const handleCreateZone = (e) => {
        e.preventDefault();
        if (!zoneNameInput.trim()) return;

        const zoneData = {
            name: zoneNameInput.trim(),
            category: zoneCategoryInput,
            color: zoneColorInput,
            capacity: Number(zoneCapacityInput) || 5000
        };

        fetch('/api/warehouse-zones', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            },
            body: JSON.stringify(zoneData)
        })
        .then(res => res.json())
        .then(data => {
            setShowCreateZoneModal(false);
            setZoneNameInput("");
            setZoneCategoryInput("General Inventory");
            setZoneColorInput("#2563EB");
            setZoneCapacityInput(5000);
            broadcastSync('zone_created');
            fetchAllData(true);
        })
        .catch(err => console.error("Error creating zone:", err));
    };

    const handleCreateBin = (e) => {
        e.preventDefault();
        setErrors({});

        if (!newBinCode.trim()) {
            setErrors({ bin_code: "Bin Code is required" });
            return;
        }

        const binData = {
            bin_code: newBinCode.trim().toUpperCase(),
            zone_name: newZoneName,
            max_capacity: newCapacity
        };

        fetch('/api/warehouse-bins', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            },
            body: JSON.stringify(binData)
        })
        .then(res => {
            if (res.status === 422) {
                return res.json().then(errData => {
                    setErrors({ bin_code: "Bin code already exists!" });
                    throw new Error("Validation Failed");
                });
            }
            return res.json();
        })
        .then(data => {
            setShowCreateModal(false);
            setNewBinCode("");
            setNewCapacity(1000);
            broadcastSync('bin_created');
            fetchAllData(true);
        })
        .catch(err => {
            console.error("Error creating bin:", err);
        });
    };

    const handleAllocateProduct = (e) => {
        e.preventDefault();
        const activeBinCode = bins[0]?.bin_code || "A-01-01";
        if (!selectedProductId) return;

        const data = {
            bin_code: activeBinCode,
            product_id: selectedProductId,
            quantity: allocateQty,
            action: 'add'
        };

        fetch('/api/warehouse-bins/manage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            },
            body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(() => {
            setShowAllocateModal(false);
            setSelectedProductId("");
            setAllocateQty(1);
            broadcastSync('product_allocated');
            fetchAllData(true);
        })
        .catch(err => console.error("Error allocating product:", err));
    };

    const handleUpdateQty = (binCode, productId, qty) => {
        const data = {
            bin_code: binCode,
            product_id: productId,
            quantity: qty,
            action: 'update'
        };

        fetch('/api/warehouse-bins/manage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            },
            body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(() => {
            setEditingProductId(null);
            broadcastSync('qty_updated');
            fetchAllData(true);
        })
        .catch(err => console.error("Error updating bin qty:", err));
    };

    const handleDeleteProduct = (binCode, productId) => {
        if (!confirm("Are you sure you want to remove this product from the bin?")) {
            return;
        }

        const data = {
            bin_code: binCode,
            product_id: productId,
            action: 'delete'
        };

        fetch('/api/warehouse-bins/manage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            },
            body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(() => {
            broadcastSync('product_deleted');
            fetchAllData(true);
        })
        .catch(err => console.error("Error deleting product:", err));
    };

    const handleToggleActive = (binCode, currentActiveStatus, e) => {
        if (e) e.stopPropagation();
        const newStatus = currentActiveStatus === false ? true : false;
        
        fetch('/api/warehouse-bins/toggle-active', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            },
            body: JSON.stringify({ bin_code: binCode, is_active: newStatus })
        })
        .then(res => res.json())
        .then(() => {
            broadcastSync('bin_toggled');
            fetchAllData(true);
        })
        .catch(err => console.error("Error toggling bin status:", err));
    };

    const handleExportCSV = () => {
        if (!bins || bins.length === 0) return;
        const headers = ["Bin Code,Zone Name,Max Capacity,Used Capacity,Utilization (%),Status\n"];
        const rows = bins.map((b) => {
            const binQty = (b.inventories || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
            const util = Math.min(100, Math.round((binQty / (b.max_capacity || 1)) * 100));
            const status = b.is_active === false ? "Disabled" : (util >= 100 ? "Full" : (util > 0 ? "Available" : "Empty"));
            return `"${b.bin_code}","${b.zone_name || 'Zone A'}","${b.max_capacity || 1000}","${binQty}","${util}%","${status}"`;
        });
        const blob = new Blob([headers + rows.join("\n")], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.setAttribute("href", url);
        a.setAttribute("download", `INFY_Warehouse_Bins_${moment().format("YYYY-MM-DD")}.csv`);
        a.click();
    };

    // Filter & sort bins
    const filteredBins = useMemo(() => {
        let list = bins.filter(b => {
            const matchesSearch = !searchQuery || 
                b.bin_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                b.zone_name?.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesZone = selectedZone === "All Zones" || b.zone_name === selectedZone;
            
            let status = "Empty";
            const binQty = (b.inventories || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
            const utilization = Math.min(100, Math.round((binQty / (b.max_capacity || 1)) * 100));
            if (utilization >= 100) status = "Full";
            else if (utilization >= 80) status = "Nearly Full";
            else if (utilization > 0) status = "Available";

            const matchesStatus = selectedStatus === "All Status" || status === selectedStatus;

            return matchesSearch && matchesZone && matchesStatus;
        });

        if (sortBy === "code") {
            list.sort((a, b) => (a.bin_code || '').localeCompare(b.bin_code || ''));
        } else if (sortBy === "capacity") {
            list.sort((a, b) => Number(b.max_capacity || 0) - Number(a.max_capacity || 0));
        } else if (sortBy === "utilization") {
            list.sort((a, b) => {
                const qtyA = (a.inventories || []).reduce((s, i) => s + Number(i.quantity || 0), 0);
                const qtyB = (b.inventories || []).reduce((s, i) => s + Number(i.quantity || 0), 0);
                return (qtyB / (b.max_capacity || 1)) - (qtyA / (a.max_capacity || 1));
            });
        } else {
            // newest
            list.sort((a, b) => (b.id || 0) - (a.id || 0));
        }

        return list;
    }, [bins, searchQuery, selectedZone, selectedStatus, sortBy]);

    let totalStoredQty = 0;
    let totalCapacitySum = 0;
    bins.forEach(b => {
        if (b.is_active !== false) {
            const binQty = (b.inventories || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
            totalStoredQty += binQty;
        }
        totalCapacitySum += Number(b.max_capacity || 1000);
    });

    const averageUtilization = totalCapacitySum > 0 ? ((totalStoredQty / totalCapacitySum) * 100).toFixed(2) : "0.00";

    // Gather active inventories to display in bottom details table
    let displayedInventories = [];
    bins.forEach(bin => {
        if (bin.inventories && bin.is_active !== false) {
            bin.inventories.forEach(item => {
                displayedInventories.push({
                    ...item,
                    bin_code: bin.bin_code
                });
            });
        }
    });

    return (
        <MasterLayout>
            <TabTitle title="Warehouse Bin Inventory Manager — INFY-POS WMS" />

            {isLoading && bins.length === 0 ? (
                <MasterTableSkeleton />
            ) : (
                <div className="brand-page-container">
                    {/* 1. Breadcrumb */}
                    <div className="brand-breadcrumb">
                        <span>Dashboard</span>
                        <span>&gt;</span>
                        <span>Inbound</span>
                        <span>&gt;</span>
                        <span className="brand-crumb-active">Bins</span>
                    </div>

                    {/* 2. Header Section */}
                    <div className="brand-header">
                        <div className="brand-title-group">
                            <h1>Warehouse Bins</h1>
                            <p>
                                Manage warehouse bins, view inventory allocation and storage utilization in real-time.
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
                                <FontAwesomeIcon icon={faDownload} />
                                <span>Export CSV</span>
                            </button>
                            <button
                                type="button"
                                className="brand-btn-pill"
                                onClick={() => fetchAllData(false)}
                                title="Refresh Bins"
                            >
                                <FontAwesomeIcon icon={faSync} />
                                <span>Refresh</span>
                            </button>
                            <button 
                                type="button"
                                className="brand-btn-pill"
                                onClick={() => setShowCreateZoneModal(true)}
                            >
                                <FontAwesomeIcon icon={faPlus} />
                                <span>Create Zone</span>
                            </button>
                            <button 
                                type="button"
                                className="brand-btn-pill brand-btn-primary"
                                onClick={() => setShowCreateModal(true)}
                            >
                                <FontAwesomeIcon icon={faPlus} />
                                <span>Create Bin</span>
                            </button>
                        </div>
                    </div>

                    {/* 3. Real-Time 4 KPI Summary Cards Grid */}
                    <div className="brand-kpi-grid">
                        {/* Card 1: Total Registered Bins */}
                        <div className="brand-kpi-card">
                            <div className="brand-kpi-top">
                                <span className="brand-kpi-label">Total Registered Bins</span>
                                <div className="brand-kpi-icon green">
                                    <FontAwesomeIcon icon={faWarehouse} />
                                </div>
                            </div>
                            <div className="brand-kpi-value">
                                <LiveCounter value={bins.length} isCurrency={false} />
                            </div>
                            <div className="brand-kpi-bottom">
                                <span className="brand-kpi-badge up">Active in System</span>
                                <LiveSparkline data={[0, 0, 0, 0, 0, 0, bins.length]} color="#16A34A" width={60} height={24} />
                            </div>
                        </div>

                        {/* Card 2: Active Storage Zones */}
                        <div className="brand-kpi-card">
                            <div className="brand-kpi-top">
                                <span className="brand-kpi-label">Active Storage Zones</span>
                                <div className="brand-kpi-icon blue">
                                    <FontAwesomeIcon icon={faBuilding} />
                                </div>
                            </div>
                            <div className="brand-kpi-value">
                                <LiveCounter value={zones.length} isCurrency={false} />
                            </div>
                            <div className="brand-kpi-bottom">
                                <span className="brand-kpi-badge up">Configured Zones</span>
                                <LiveSparkline data={[0, 0, 0, 0, 0, 0, zones.length]} color="#2563EB" width={60} height={24} />
                            </div>
                        </div>

                        {/* Card 3: Inventory Stored */}
                        <div className="brand-kpi-card">
                            <div className="brand-kpi-top">
                                <span className="brand-kpi-label">Inventory Stored</span>
                                <div className="brand-kpi-icon purple">
                                    <FontAwesomeIcon icon={faBoxes} />
                                </div>
                            </div>
                            <div className="brand-kpi-value">
                                <LiveCounter value={totalStoredQty} isCurrency={false} />
                            </div>
                            <div className="brand-kpi-bottom">
                                <span className="brand-kpi-label" style={{ fontSize: '13px', color: '#64748B', fontWeight: '700' }}>
                                    Total available units
                                </span>
                                <LiveSparkline data={[0, 0, 0, 0, 0, 0, totalStoredQty]} color="#9333EA" width={60} height={24} />
                            </div>
                        </div>

                        {/* Card 4: Warehouse Utilization */}
                        <div className="brand-kpi-card">
                            <div className="brand-kpi-top">
                                <span className="brand-kpi-label">Warehouse Utilization</span>
                                <div className="brand-kpi-icon orange">
                                    <FontAwesomeIcon icon={faCube} />
                                </div>
                            </div>
                            <div className="brand-kpi-value">
                                {averageUtilization}%
                            </div>
                            <div className="brand-kpi-bottom">
                                <span className="brand-kpi-badge neutral">
                                    Total capacity utilized
                                </span>
                                <LiveSparkline data={[0, 0, 0, 0, 0, 0, Number(averageUtilization)]} color="#D97706" width={60} height={24} />
                            </div>
                        </div>
                    </div>

                    {/* 4. Main Workspace Container */}
                    <div className="brand-workspace">
                        {/* Search & Filter Controls Bar */}
                        <div className="brand-filter-bar">
                            <div className="brand-search-box">
                                <FontAwesomeIcon icon={faSearch} className="brand-search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search by Bin Code, Zone, SKU, Product..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                <select 
                                    className="var-select-sm" 
                                    value={selectedZone} 
                                    onChange={(e) => setSelectedZone(e.target.value)}
                                >
                                    <option value="All Zones">Zone: All</option>
                                    {zones.map(z => (
                                        <option key={z.name} value={z.name}>{z.name}</option>
                                    ))}
                                </select>

                                <select 
                                    className="var-select-sm" 
                                    value={selectedStatus} 
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                >
                                    <option value="All Status">Status: All</option>
                                    <option value="Available">Available</option>
                                    <option value="Nearly Full">Nearly Full</option>
                                    <option value="Full">Full</option>
                                    <option value="Empty">Empty</option>
                                </select>

                                <select 
                                    className="var-select-sm" 
                                    value={sortBy} 
                                    onChange={(e) => setSortBy(e.target.value)}
                                >
                                    <option value="newest">Sort: Newest</option>
                                    <option value="code">Sort: Bin Code</option>
                                    <option value="capacity">Sort: Capacity</option>
                                    <option value="utilization">Sort: Utilization</option>
                                </select>

                                <div className="var-view-toggle">
                                    <button
                                        type="button"
                                        className={'var-view-btn ' + (viewMode === 'grid' ? 'active' : '')}
                                        onClick={() => setViewMode('grid')}
                                        title="Grid View"
                                    >
                                        <FontAwesomeIcon icon={faThLarge} />
                                    </button>
                                    <button
                                        type="button"
                                        className={'var-view-btn ' + (viewMode === 'list' ? 'active' : '')}
                                        onClick={() => setViewMode('list')}
                                        title="List View"
                                    >
                                        <FontAwesomeIcon icon={faList} />
                                    </button>
                                </div>

                                <button 
                                    type="button" 
                                    className="cat-btn-filter" 
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSelectedZone('All Zones');
                                        setSelectedStatus('All Status');
                                        setSortBy('newest');
                                    }}
                                >
                                    Reset
                                </button>
                            </div>
                        </div>

                        {/* GRID VIEW */}
                        {viewMode === 'grid' ? (
                            filteredBins.length === 0 ? (
                                <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #EEF2F7', padding: '60px 24px', textAlign: 'center', width: '100%' }}>
                                    <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', margin: '0 auto 16px auto', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.12)' }}>
                                        <FontAwesomeIcon icon={faWarehouse} />
                                    </div>
                                    <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                                        No bins found
                                    </h3>
                                    <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '380px', margin: '0 auto 20px auto', lineHeight: 1.5 }}>
                                        Create your first warehouse bin to organize inventory storage locations
                                    </p>
                                    <button
                                        type="button"
                                        className="brand-btn-pill brand-btn-primary"
                                        onClick={() => setShowCreateModal(true)}
                                    >
                                        <FontAwesomeIcon icon={faPlus} /> Create Bin
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
                                    {filteredBins.map(bin => {
                                        const binQty = (bin.inventories || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
                                        const maxCap = Number(bin.max_capacity || 1000);
                                        const utilization = Math.min(100, Math.round((binQty / (maxCap || 1)) * 100));
                                        
                                        let statusColor = '#15803D';
                                        let statusText = 'Available';
                                        let statusBg = '#DCFCE7';
                                        let barColor = '#16A34A';

                                        if (utilization >= 100) {
                                            statusColor = '#DC2626';
                                            statusText = 'Full';
                                            statusBg = '#FEE2E2';
                                            barColor = '#EF4444';
                                        } else if (utilization >= 80) {
                                            statusColor = '#D97706';
                                            statusText = 'Nearly Full';
                                            statusBg = '#FEF3C7';
                                            barColor = '#F59E0B';
                                        } else if (binQty === 0) {
                                            statusColor = '#64748B';
                                            statusText = 'Empty';
                                            statusBg = '#F1F5F9';
                                            barColor = '#CBD5E1';
                                        }

                                        return (
                                            <div 
                                                key={bin.id || bin.bin_code}
                                                onClick={() => navigate('/app/bins/detail/' + bin.bin_code)}
                                                style={{ 
                                                    background: '#FFFFFF',
                                                    border: '1px solid #EEF2F7',
                                                    borderRadius: '20px',
                                                    padding: '20px',
                                                    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.03)',
                                                    cursor: 'pointer',
                                                    transition: 'all 200ms ease',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'space-between',
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(-3px)';
                                                    e.currentTarget.style.boxShadow = '0 12px 28px rgba(15, 23, 42, 0.08)';
                                                    e.currentTarget.style.borderColor = '#CBD5E1';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(15, 23, 42, 0.03)';
                                                    e.currentTarget.style.borderColor = '#EEF2F7';
                                                }}
                                            >
                                                <div>
                                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                                        <div>
                                                            <strong style={{ fontSize: '17px', color: '#0F172A', fontWeight: '800', letterSpacing: '-0.01em' }}>
                                                                {bin.bin_code}
                                                            </strong>
                                                            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', marginTop: '2px' }}>
                                                                {bin.zone_name || 'Zone A'} • Rack A • Level 01
                                                            </div>
                                                        </div>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <span 
                                                                style={{ 
                                                                    background: bin.is_active === false ? '#F1F5F9' : statusBg, 
                                                                    color: bin.is_active === false ? '#64748B' : statusColor, 
                                                                    fontSize: '11px', 
                                                                    fontWeight: '700', 
                                                                    padding: '3px 8px', 
                                                                    borderRadius: '999px' 
                                                                }}
                                                            >
                                                                {bin.is_active === false ? 'Inactive' : statusText}
                                                            </span>
                                                            <div 
                                                                className="form-check form-switch m-0" 
                                                                onClick={(e) => e.stopPropagation()}
                                                                title={bin.is_active !== false ? "Bin Active" : "Bin Inactive"}
                                                            >
                                                                <input 
                                                                    className="form-check-input" 
                                                                    type="checkbox" 
                                                                    role="switch" 
                                                                    checked={bin.is_active !== false} 
                                                                    onChange={(e) => handleToggleActive(bin.bin_code, bin.is_active, e)}
                                                                    style={{ cursor: 'pointer', width: '30px', height: '15px' }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Progress bar */}
                                                    <div style={{ margin: '16px 0 12px 0' }}>
                                                        <div className="d-flex justify-content-between" style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', marginBottom: '6px' }}>
                                                            <span>Capacity Utilization</span>
                                                            <span>{utilization}%</span>
                                                        </div>
                                                        <div style={{ height: '7px', borderRadius: '999px', background: '#F1F5F9', overflow: 'hidden' }}>
                                                            <div 
                                                                style={{ 
                                                                    width: utilization + '%', 
                                                                    height: '100%', 
                                                                    background: barColor, 
                                                                    borderRadius: '999px',
                                                                    transition: 'width 300ms ease'
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="d-flex justify-content-between mt-2" style={{ fontSize: '11px', fontWeight: '700' }}>
                                                            <span style={{ color: statusColor }}>Used {binQty} units</span>
                                                            <span style={{ color: '#64748B' }}>Available {Math.max(0, maxCap - binQty)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="d-flex justify-content-between align-items-center pt-3" style={{ borderTop: '1px solid #F1F5F9', fontSize: '12px', color: '#64748B', fontWeight: '600' }}>
                                                    <div>
                                                        <FontAwesomeIcon icon={faBoxes} className="me-1" style={{ color: '#94A3B8' }} />
                                                        <span>SKUs: <strong style={{ color: '#0F172A' }}>{(bin.inventories || []).length}</strong></span>
                                                    </div>
                                                    <span style={{ color: '#15803D', fontWeight: '700', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                        View Details <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: '10px' }} />
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )
                        ) : (
                            /* LIST / TABLE VIEW */
                            filteredBins.length === 0 ? (
                                <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #EEF2F7', padding: '60px 24px', textAlign: 'center', width: '100%' }}>
                                    <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', margin: '0 auto 16px auto' }}>
                                        <FontAwesomeIcon icon={faWarehouse} />
                                    </div>
                                    <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>
                                        No bins found
                                    </h3>
                                    <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '380px', margin: '0 auto 20px auto' }}>
                                        Create your first warehouse bin to organize inventory storage locations
                                    </p>
                                </div>
                            ) : (
                                <div className="brand-table-wrapper" style={{ overflowX: 'auto' }}>
                                    <table className="brand-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr>
                                                <th style={{ padding: '14px 18px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748B', borderBottom: '1px solid #EEF2F7' }}>BIN CODE</th>
                                                <th style={{ padding: '14px 18px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748B', borderBottom: '1px solid #EEF2F7' }}>ZONE</th>
                                                <th style={{ padding: '14px 18px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748B', borderBottom: '1px solid #EEF2F7' }}>MAX CAPACITY</th>
                                                <th style={{ padding: '14px 18px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748B', borderBottom: '1px solid #EEF2F7' }}>USED QUANTITY</th>
                                                <th style={{ padding: '14px 18px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748B', borderBottom: '1px solid #EEF2F7' }}>UTILIZATION</th>
                                                <th style={{ padding: '14px 18px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748B', borderBottom: '1px solid #EEF2F7' }}>STATUS</th>
                                                <th style={{ padding: '14px 18px', textAlign: 'center', fontSize: '12px', fontWeight: '700', color: '#64748B', borderBottom: '1px solid #EEF2F7' }}>ACTIVE</th>
                                                <th style={{ padding: '14px 18px', textAlign: 'right', fontSize: '12px', fontWeight: '700', color: '#64748B', borderBottom: '1px solid #EEF2F7' }}>ACTIONS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredBins.map(bin => {
                                                const binQty = (bin.inventories || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
                                                const maxCap = Number(bin.max_capacity || 1000);
                                                const utilization = Math.min(100, Math.round((binQty / (maxCap || 1)) * 100));

                                                let statusColor = '#15803D';
                                                let statusText = 'Available';
                                                let statusBg = '#DCFCE7';

                                                if (utilization >= 100) {
                                                    statusColor = '#DC2626';
                                                    statusText = 'Full';
                                                    statusBg = '#FEE2E2';
                                                } else if (utilization >= 80) {
                                                    statusColor = '#D97706';
                                                    statusText = 'Nearly Full';
                                                    statusBg = '#FEF3C7';
                                                } else if (binQty === 0) {
                                                    statusColor = '#64748B';
                                                    statusText = 'Empty';
                                                    statusBg = '#F1F5F9';
                                                }

                                                return (
                                                    <tr key={bin.id || bin.bin_code} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                                        <td style={{ padding: '14px 18px' }}>
                                                            <strong style={{ color: '#0F172A', fontSize: '14px' }}>{bin.bin_code}</strong>
                                                        </td>
                                                        <td style={{ padding: '14px 18px', color: '#475569', fontSize: '13px', fontWeight: '600' }}>
                                                            {bin.zone_name || 'Zone A'}
                                                        </td>
                                                        <td style={{ padding: '14px 18px', color: '#475569', fontSize: '13px', fontWeight: '600' }}>
                                                            {maxCap} Units
                                                        </td>
                                                        <td style={{ padding: '14px 18px' }}>
                                                            <strong style={{ color: '#15803D', fontSize: '14px' }}>{binQty}</strong>
                                                        </td>
                                                        <td style={{ padding: '14px 18px' }}>
                                                            <div style={{ width: '100px', display: 'inline-block' }}>
                                                                <div className="d-flex justify-content-between mb-1" style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>
                                                                    <span>{utilization}%</span>
                                                                </div>
                                                                <div style={{ height: '6px', borderRadius: '999px', background: '#F1F5F9', overflow: 'hidden' }}>
                                                                    <div style={{ width: utilization + '%', height: '100%', background: '#16A34A', borderRadius: '999px' }} />
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '14px 18px' }}>
                                                            <span style={{ background: bin.is_active === false ? '#F1F5F9' : statusBg, color: bin.is_active === false ? '#64748B' : statusColor, fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '999px' }}>
                                                                {bin.is_active === false ? 'Inactive' : statusText}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                                                            <div className="form-check form-switch d-inline-block m-0">
                                                                <input 
                                                                    className="form-check-input" 
                                                                    type="checkbox" 
                                                                    role="switch" 
                                                                    checked={bin.is_active !== false} 
                                                                    onChange={(e) => handleToggleActive(bin.bin_code, bin.is_active, e)}
                                                                    style={{ cursor: 'pointer' }}
                                                                />
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-success"
                                                                onClick={() => navigate('/app/bins/detail/' + bin.bin_code)}
                                                                style={{ borderRadius: '8px', fontWeight: '700', fontSize: '12px', padding: '4px 10px' }}
                                                            >
                                                                View Details
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        )}
                    </div>

                    {/* 5. Unified Detail Section showing all bin items */}
                    <div className="brand-workspace" style={{ marginTop: '24px' }}>
                        <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
                            <div>
                                <div className="d-flex align-items-center gap-2">
                                    <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', margin: 0, letterSpacing: '-0.01em' }}>
                                        All Bin Details
                                    </h2>
                                    <span 
                                        className="brand-kpi-badge up"
                                    >
                                        Active
                                    </span>
                                </div>
                                <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '600', marginTop: '3px' }}>
                                    Comprehensive overview of all locations
                                </div>
                            </div>

                            <div className="d-flex align-items-center gap-4 flex-wrap">
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Bin Capacity</span>
                                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>{totalCapacitySum} Units</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Used Capacity</span>
                                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#15803D' }}>{totalStoredQty} Units</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Available Capacity</span>
                                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#2563EB' }}>{Math.max(0, totalCapacitySum - totalStoredQty)} Units</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>SKU Types</span>
                                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>
                                        {bins.reduce((sum, b) => sum + (b.inventories || []).length, 0)}
                                    </div>
                                </div>

                                <button 
                                    type="button"
                                    className="brand-btn-pill brand-btn-primary"
                                    onClick={() => setShowAllocateModal(true)}
                                    style={{ height: '42px', padding: '0 18px', fontSize: '13px' }}
                                >
                                    <FontAwesomeIcon icon={faPlus} />
                                    <span>Bin Actions</span>
                                </button>
                            </div>
                        </div>

                        {/* Stored products list table */}
                        <div className="table-responsive">
                            <table className="table align-middle text-nowrap" style={{ margin: 0 }}>
                                <thead>
                                    <tr style={{ background: '#F8FAFC', fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>
                                        <th style={{ padding: '12px 16px', borderBottom: '1px solid #EEF2F7' }}>#</th>
                                        <th style={{ padding: '12px 16px', borderBottom: '1px solid #EEF2F7' }}>Image</th>
                                        <th style={{ padding: '12px 16px', borderBottom: '1px solid #EEF2F7' }}>Product</th>
                                        <th style={{ padding: '12px 16px', borderBottom: '1px solid #EEF2F7' }}>SKU / Barcode</th>
                                        <th style={{ padding: '12px 16px', borderBottom: '1px solid #EEF2F7' }}>Bin</th>
                                        <th style={{ padding: '12px 16px', borderBottom: '1px solid #EEF2F7' }}>Available Qty</th>
                                        <th style={{ padding: '12px 16px', borderBottom: '1px solid #EEF2F7' }}>Putaway Date</th>
                                        <th style={{ padding: '12px 16px', borderBottom: '1px solid #EEF2F7' }}>Status</th>
                                        <th className="text-end" style={{ padding: '12px 16px', borderBottom: '1px solid #EEF2F7' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedInventories.length > 0 ? (
                                        displayedInventories.map((item, idx) => {
                                            const p = item.product || { name: 'Unknown Product', code: 'N/A' };
                                            const isEditing = editingProductId === item.product_id && editingBinCode === item.bin_code;

                                            return (
                                                <tr key={item.bin_code + '-' + item.product_id + '-' + idx} style={{ fontSize: '13px', borderBottom: '1px solid #F1F5F9' }}>
                                                    <td style={{ padding: '12px 16px', color: '#64748B', fontWeight: '700' }}>{idx + 1}</td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <div style={{ width: '40px', height: '40px', border: '1px solid #E2E8F0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFF', overflow: 'hidden' }}>
                                                            <img src={p.product_image || "/uploads/main_product/1116/Lays_Classic_Salted__1.jpg"} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <div>
                                                            <strong style={{ color: '#0F172A', fontWeight: '800' }}>{p.name}</strong>
                                                            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>Warehouse Inventory</div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '12px 16px', fontWeight: '700', color: '#0F172A' }}>
                                                        <div>{p.code}</div>
                                                    </td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', background: '#F1F5F9', padding: '4px 8px', borderRadius: '6px' }}>
                                                            {item.bin_code}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        {isEditing ? (
                                                            <input 
                                                                type="number"
                                                                className="form-control form-control-sm"
                                                                value={editQuantity}
                                                                onChange={(e) => setEditQuantity(e.target.value)}
                                                                style={{ width: '80px', fontWeight: '800', borderRadius: '8px' }}
                                                            />
                                                        ) : (
                                                            <strong style={{ color: '#15803D', fontSize: '14px', fontWeight: '800' }}>{item.quantity}</strong>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '12px 16px', color: '#64748B', fontWeight: '600' }}>
                                                        {new Date(item.created_at || new Date()).toLocaleDateString()}
                                                    </td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <span style={{ background: '#DCFCE7', color: '#15803D', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '999px' }}>
                                                            Available
                                                        </span>
                                                    </td>
                                                    <td className="text-end" style={{ padding: '12px 16px' }}>
                                                        {isEditing ? (
                                                            <div className="d-flex justify-content-end gap-2">
                                                                <button 
                                                                    className="btn btn-success btn-sm"
                                                                    onClick={() => handleUpdateQty(item.bin_code, item.product_id, editQuantity)}
                                                                    style={{ borderRadius: '8px', fontWeight: '800', background: '#15803D', border: 'none' }}
                                                                >
                                                                    <FontAwesomeIcon icon={faSave} />
                                                                </button>
                                                                <button 
                                                                    className="btn btn-secondary btn-sm"
                                                                    onClick={() => {
                                                                        setEditingProductId(null);
                                                                        setEditingBinCode("");
                                                                    }}
                                                                    style={{ borderRadius: '8px' }}
                                                                >
                                                                    <FontAwesomeIcon icon={faTimes} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="d-flex justify-content-end gap-2">
                                                                <button 
                                                                    className="btn btn-outline-primary btn-sm"
                                                                    onClick={() => {
                                                                        setEditingProductId(item.product_id);
                                                                        setEditingBinCode(item.bin_code);
                                                                        setEditQuantity(item.quantity);
                                                                    }}
                                                                    style={{ borderRadius: '8px' }}
                                                                >
                                                                    <FontAwesomeIcon icon={faEdit} />
                                                                </button>
                                                                <button 
                                                                    className="btn btn-outline-danger btn-sm"
                                                                    onClick={() => handleDeleteProduct(item.bin_code, item.product_id)}
                                                                    style={{ borderRadius: '8px' }}
                                                                >
                                                                    <FontAwesomeIcon icon={faTrash} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="9" className="text-center py-5">
                                                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', margin: '0 auto 12px auto' }}>
                                                    <FontAwesomeIcon icon={faExclamationTriangle} />
                                                </div>
                                                <div style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', marginBottom: '4px' }}>
                                                    No products allocated
                                                </div>
                                                <div style={{ fontSize: '13px', color: '#64748B' }}>
                                                    Ready for Putaway or allocate stock manually via Bin Actions.
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Create Bin Modal */}
                    <Modal 
                        show={showCreateModal} 
                        onHide={() => setShowCreateModal(false)}
                        centered
                    >
                        <Modal.Header closeButton className="border-0 px-4 pt-4 pb-0">
                            <Modal.Title style={{ fontWeight: '800', fontSize: '18px', color: '#0F172A' }}>
                                🏗️ Create New Warehouse Bin
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body className="px-4 pb-4">
                            <Form onSubmit={handleCreateBin}>
                                <Form.Group className="mb-3">
                                    <Form.Label style={{ fontSize: '12px', fontWeight: '700', color: '#64748B' }}>Bin Location Code (e.g. A-01-02)</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        value={newBinCode}
                                        onChange={(e) => setNewBinCode(e.target.value)}
                                        placeholder="e.g. A-01-02"
                                        isInvalid={!!errors.bin_code}
                                        style={{ height: '46px', borderRadius: '12px', border: '1.5px solid #E2E8F0', fontWeight: '700' }}
                                    />
                                    <Form.Control.Feedback type="invalid" style={{ fontWeight: '700' }}>
                                        {errors.bin_code}
                                    </Form.Control.Feedback>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label style={{ fontSize: '12px', fontWeight: '700', color: '#64748B' }}>Zone</Form.Label>
                                    <Form.Select 
                                        value={newZoneName}
                                        onChange={(e) => setNewZoneName(e.target.value)}
                                        style={{ height: '46px', borderRadius: '12px', border: '1.5px solid #E2E8F0', fontWeight: '700' }}
                                    >
                                        {zones.map(z => (
                                            <option key={z.name} value={z.name}>{z.name} • {z.category}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label style={{ fontSize: '12px', fontWeight: '700', color: '#64748B' }}>Max Unit Capacity</Form.Label>
                                    <Form.Control 
                                        type="number" 
                                        value={newCapacity}
                                        onChange={(e) => setNewCapacity(e.target.value)}
                                        placeholder="1000"
                                        style={{ height: '46px', borderRadius: '12px', border: '1.5px solid #E2E8F0', fontWeight: '700' }}
                                    />
                                </Form.Group>

                                <button 
                                    type="submit" 
                                    className="brand-btn-pill brand-btn-primary w-100" 
                                    style={{ height: '48px', marginTop: '10px' }}
                                >
                                    Create Location Bin
                                </button>
                            </Form>
                        </Modal.Body>
                    </Modal>

                    {/* Create Zone Modal */}
                    <Modal 
                        show={showCreateZoneModal} 
                        onHide={() => setShowCreateZoneModal(false)}
                        centered
                    >
                        <Modal.Header closeButton className="border-0 px-4 pt-4 pb-0">
                            <Modal.Title style={{ fontWeight: '800', fontSize: '18px', color: '#0F172A' }}>
                                🏷️ Create Warehouse Zone
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body className="px-4 pb-4">
                            <Form onSubmit={handleCreateZone}>
                                <Form.Group className="mb-3">
                                    <Form.Label style={{ fontSize: '12px', fontWeight: '700', color: '#64748B' }}>Zone Name (e.g. Zone C - Cold Storage)</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        value={zoneNameInput}
                                        onChange={(e) => setZoneNameInput(e.target.value)}
                                        placeholder="e.g. Zone C, Cold Storage, Zone D"
                                        required
                                        style={{ height: '46px', borderRadius: '12px', border: '1.5px solid #E2E8F0', fontWeight: '700' }}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label style={{ fontSize: '12px', fontWeight: '700', color: '#64748B' }}>Storage Category / Type</Form.Label>
                                    <Form.Select 
                                        value={zoneCategoryInput}
                                        onChange={(e) => setZoneCategoryInput(e.target.value)}
                                        style={{ height: '46px', borderRadius: '12px', border: '1.5px solid #E2E8F0', fontWeight: '700' }}
                                    >
                                        <option value="Fast Moving (FMCG)">Fast Moving (FMCG)</option>
                                        <option value="Cold Storage (-18°C)">Cold Storage (-18°C)</option>
                                        <option value="High Value Security Cage">High Value Security Cage</option>
                                        <option value="Bulk Pallet Racking">Bulk Pallet Racking</option>
                                        <option value="Hazardous Goods Safety Zone">Hazardous Goods Safety Zone</option>
                                        <option value="General Inventory">General Inventory</option>
                                    </Form.Select>
                                </Form.Group>

                                <div className="row g-2 mb-3">
                                    <div className="col-6">
                                        <Form.Group>
                                            <Form.Label style={{ fontSize: '12px', fontWeight: '700', color: '#64748B' }}>Default Capacity</Form.Label>
                                            <Form.Control 
                                                type="number" 
                                                value={zoneCapacityInput}
                                                onChange={(e) => setZoneCapacityInput(e.target.value)}
                                                placeholder="5000"
                                                style={{ height: '46px', borderRadius: '12px', border: '1.5px solid #E2E8F0', fontWeight: '700' }}
                                            />
                                        </Form.Group>
                                    </div>
                                    <div className="col-6">
                                        <Form.Group>
                                            <Form.Label style={{ fontSize: '12px', fontWeight: '700', color: '#64748B' }}>Theme Color</Form.Label>
                                            <Form.Select 
                                                value={zoneColorInput}
                                                onChange={(e) => setZoneColorInput(e.target.value)}
                                                style={{ height: '46px', borderRadius: '12px', border: '1.5px solid #E2E8F0', fontWeight: '700' }}
                                            >
                                                <option value="#2563EB">🔵 Royal Blue</option>
                                                <option value="#10B981">🟢 Emerald Green</option>
                                                <option value="#F59E0B">🟠 Amber Orange</option>
                                                <option value="#8B5CF6">🟣 Purple Velvet</option>
                                                <option value="#EC4899">💗 Pink Rose</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    className="brand-btn-pill brand-btn-primary w-100" 
                                    style={{ height: '48px', marginTop: '10px' }}
                                >
                                    Create Warehouse Zone
                                </button>
                            </Form>
                        </Modal.Body>
                    </Modal>

                    {/* Allocate Stock Modal */}
                    <Modal
                        show={showAllocateModal}
                        onHide={() => setShowAllocateModal(false)}
                        centered
                    >
                        <Modal.Header closeButton className="border-0 px-4 pt-4 pb-0">
                            <Modal.Title style={{ fontWeight: '800', fontSize: '18px', color: '#0F172A' }}>
                                ➕ Allocate Stock to Bin: {bins[0]?.bin_code || "A-01-01"}
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body className="px-4 pb-4">
                            <Form onSubmit={handleAllocateProduct}>
                                <Form.Group className="mb-3">
                                    <Form.Label style={{ fontSize: '12px', fontWeight: '700', color: '#64748B' }}>Select Product</Form.Label>
                                    <Form.Select
                                        value={selectedProductId}
                                        onChange={(e) => setSelectedProductId(e.target.value)}
                                        style={{ height: '46px', borderRadius: '12px', border: '1.5px solid #E2E8F0', fontWeight: '700' }}
                                        required
                                    >
                                        <option value="">-- Choose Product --</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label style={{ fontSize: '12px', fontWeight: '700', color: '#64748B' }}>Allocated Quantity</Form.Label>
                                    <Form.Control 
                                        type="number"
                                        min="1"
                                        value={allocateQty}
                                        onChange={(e) => setAllocateQty(e.target.value)}
                                        style={{ height: '46px', borderRadius: '12px', border: '1.5px solid #E2E8F0', fontWeight: '700' }}
                                        required
                                    />
                                </Form.Group>

                                <button 
                                    type="submit" 
                                    className="brand-btn-pill brand-btn-primary w-100"
                                    style={{ height: '48px' }}
                                >
                                    Allocate Product
                                </button>
                            </Form>
                        </Modal.Body>
                    </Modal>
                </div>
            )}
        </MasterLayout>
    );
};

export default WarehouseBins;
