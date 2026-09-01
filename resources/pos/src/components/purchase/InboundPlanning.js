import React, { useState, useEffect, useMemo, useRef } from "react";
import MasterLayout from "../MasterLayout";
import TabTitle from "../../shared/tab-title/TabTitle";
import { Link } from "react-router-dom";
import apiConfig from "../../config/apiConfig";
import { getCached, setCache } from "../../store/apiCache";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarDays,
  faFileInvoice,
  faTruck,
  faIndianRupeeSign,
  faSearch,
  faRotateLeft,
  faPlus,
  faEye,
  faTimes,
  faFileCsv,
  faList,
  faThLarge,
  faStore
} from '@fortawesome/free-solid-svg-icons';
import '../brands/ProductBrandsPremium.css';
import '../units/ProductUnitsPremium.css';
import '../variation/ProductVariationsPremium.css';
import LiveCounter from '../../shared/components/LiveCounter';
import LiveSparkline from '../../shared/components/LiveSparkline';
import { onPosDataChanged } from '../../shared/posEvents';

const getInitialInboundCache = () => {
  try {
    const memory = getCached("inbound:planning_data");
    if (memory?.items && memory.items.length > 0) return memory;
  } catch (e) {}
  return {
    items: [],
    kpi: {
      expected_today: 0,
      waiting_asn: 0,
      asn_created: 0,
      shipment_created: 0,
      shipments_in_transit: 0,
      expected_quantity: 0,
      expected_value: 0
    }
  };
};

const getStatusBadgeClass = (status) => {
  if (!status) return 'draft';
  if (status === 'Stock Received' || status === 'Putaway Completed' || status === 'Delivered' || status === 'Receiving Completed') return 'active';
  if (status === 'Putaway Pending' || status === 'Awaiting Putaway') return 'active';
  if (status === 'Partially Received') return 'warning';
  if (status === 'Receiving in Progress' || status === 'Putaway In Progress') return 'default';
  if (status.includes('Dispatched') || status.includes('In Transit') || status.includes('Ready to Receive') || status.includes('Delivery')) return 'default';
  if (status.includes('ASN Created')) return 'default';
  if (status.includes('Ready for ASN') || status.includes('Waiting for ASN') || status.includes('Pending Receiving') || status.includes('Preparing')) return 'draft';
  if (status.includes('Approval')) return 'draft';
  return 'draft';
};

const InboundPlanning = () => {
  const isMounted = useRef(true);
  const initialCache = useMemo(() => getInitialInboundCache(), []);
  const [loading, setLoading] = useState(false);
  const [inboundList, setInboundList] = useState(initialCache.items || []);
  const [kpiData, setKpiData] = useState(initialCache.kpi || {
    expected_today: 0,
    waiting_asn: 0,
    asn_created: 0,
    shipment_created: 0,
    shipments_in_transit: 0,
    expected_quantity: 0,
    expected_value: 0
  });
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("All");
  const [selectedSupplier, setSelectedSupplier] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("list");
  const [selectedRows, setSelectedRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = async (isSilent = false) => {
    if (!isSilent && isMounted.current) {
      setLoading(true);
    }

    try {
      const response = await apiConfig.get("inbound-planning-data");
      if (isMounted.current && response.data && response.data.success && response.data.data) {
        const { items, kpi } = response.data.data;
        setCache("inbound:planning_data", { items, kpi });
        setInboundList(items || []);
        setKpiData(kpi || {});
      }
    } catch (err) {
      console.error("Error fetching inbound planning data:", err);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMounted.current = true;
    fetchData(false);

    let bc = null;
    try {
      if (window.BroadcastChannel) {
        bc = new BroadcastChannel('infypos_realtime_bus');
        bc.onmessage = (event) => {
          if (event && event.data) {
            fetchData(true);
          }
        };
      }
    } catch(e) {}

    const handleStorage = (e) => {
      if (e.key === 'infypos_sync_pulse' || e.key === 'infy_purchase_sync' || e.key === 'infy_shipment_sync' || e.key === 'infy_asn_sync' || e.key === 'infypos_realtime_event') {
        fetchData(true);
      }
    };

    const handleFocus = () => {
      fetchData(true);
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchData(true);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    // Instant update when ANY purchase, ASN, shipment, receiving, or warehouse mutation occurs
    const unsubscribe = onPosDataChanged?.((event) => {
      fetchData(true);
    });

    return () => {
      isMounted.current = false;
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleExportCSV = () => {
    if (!inboundList || inboundList.length === 0) return;
    const headers = ["Inbound ID,PO ID,Shipment ID,Supplier,Warehouse,Stock Qty,Delivery Date,Status\n"];
    const rows = inboundList.map((item) => {
      return `"${item.inbound_id}","${item.po_id}","${item.shipment_id}","${item.supplier}","${item.warehouse}","${item.stock_qty}","${item.delivery_date}","${item.status}"`;
    });
    const blob = new Blob([headers + rows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", "inbound_planning.csv");
    a.click();
  };

  // Filter & Sort Logic
  const filteredItems = useMemo(() => {
    let list = inboundList.filter((item) => {
      const query = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !query ||
        (item.inbound_id && item.inbound_id.toLowerCase().includes(query)) ||
        (item.po_id && item.po_id.toLowerCase().includes(query)) ||
        (item.shipment_id && item.shipment_id.toLowerCase().includes(query)) ||
        (item.supplier && item.supplier.toLowerCase().includes(query));

      const matchesWh = selectedWarehouse === "All" || item.warehouse === selectedWarehouse;
      const matchesSup = selectedSupplier === "All" || item.supplier === selectedSupplier;
      const matchesStatus = selectedStatus === "All" || item.status === selectedStatus;

      return matchesSearch && matchesWh && matchesSup && matchesStatus;
    });

    if (sortBy === 'oldest') {
      list.sort((a, b) => Number(a.id || 0) - Number(b.id || 0));
    } else if (sortBy === 'qty') {
      list.sort((a, b) => Number(b.stock_qty || 0) - Number(a.stock_qty || 0));
    } else if (sortBy === 'supplier') {
      list.sort((a, b) => (a.supplier || '').localeCompare(b.supplier || ''));
    } else {
      list.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
    }

    return list;
  }, [inboundList, searchTerm, selectedWarehouse, selectedSupplier, selectedStatus, sortBy]);

  // Pagination
  const totalFiltered = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedInbounds = filteredItems.slice(startIndex, startIndex + pageSize);

  const handleReset = () => {
    setSearchTerm("");
    setSelectedWarehouse("All");
    setSelectedSupplier("All");
    setSelectedStatus("All");
    setSortBy("newest");
    setCurrentPage(1);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedRows(filteredItems.map(i => i.id || i.inbound_id));
    else setSelectedRows([]);
  };

  const handleSelectRow = (id) => {
    setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };

  const parseExpectedValue = () => {
    const rawVal = kpiData?.expected_value;
    if (!rawVal) return 0;
    if (typeof rawVal === 'number') return rawVal;
    return Number(String(rawVal).replace(/[^0-9.]/g, '')) || 0;
  };

  return (
    <MasterLayout>
      <TabTitle title="Inbound Planning — infy-pos WMS" />

      <div className="brand-page-container">

        {/* ── 1. Breadcrumb ─────────────────────────────────────────── */}
        <div className="brand-breadcrumb">
          <span>Dashboard</span>
          <span>&gt;</span>
          <span>Purchases</span>
          <span>&gt;</span>
          <span>Inbound</span>
          <span>&gt;</span>
          <span className="brand-crumb-active">Inbound Planning</span>
        </div>

        {/* ── 2. Page Header ────────────────────────────────────────── */}
        <div className="brand-header">
          <div className="brand-title-group">
            <h1>Inbound Planning</h1>
            <p>Monitor all supplier shipments and purchase deliveries before warehouse receiving.</p>
          </div>

          <div className="brand-header-actions">
            <Link to="/app/purchases/create" className="unit-btn-pill unit-btn-primary">
              <FontAwesomeIcon icon={faPlus} /> Create Purchase
            </Link>
            <button type="button" className="unit-btn-pill" onClick={handleExportCSV}>
              <FontAwesomeIcon icon={faFileCsv} /> Export CSV
            </button>
            <button type="button" className="unit-btn-pill" onClick={() => fetchData(false)}>
              <FontAwesomeIcon icon={faRotateLeft} /> Refresh
            </button>
          </div>
        </div>

        {/* ── 3. 4 Real KPI Summary Cards Grid ──────────────────────── */}
        <div className="brand-kpi-grid">
          {/* Card 1: Expected Today */}
          <div className="brand-kpi-card">
            <div className="brand-kpi-top">
              <span className="brand-kpi-label">Expected Today</span>
              <div className="brand-kpi-icon green">
                <FontAwesomeIcon icon={faCalendarDays} />
              </div>
            </div>
            <div className="brand-kpi-value">
              <LiveCounter value={Number(kpiData?.expected_today || 0)} isCurrency={false} />
            </div>
            <div className="brand-kpi-bottom">
              <span className="brand-kpi-badge up">
                {Number(kpiData?.expected_today || 0) > 0 ? "Shipments Today" : "0 Today"}
              </span>
              <LiveSparkline data={Number(kpiData?.expected_today || 0) > 0 ? [0, Number(kpiData?.expected_today)] : [0, 0]} color="#16A34A" width={60} height={24} />
            </div>
          </div>

          {/* Card 2: Waiting for ASN */}
          <div className="brand-kpi-card">
            <div className="brand-kpi-top">
              <span className="brand-kpi-label">Waiting for ASN</span>
              <div className="brand-kpi-icon orange">
                <FontAwesomeIcon icon={faFileInvoice} />
              </div>
            </div>
            <div className="brand-kpi-value">
              <LiveCounter value={Number(kpiData?.waiting_asn || 0)} isCurrency={false} />
            </div>
            <div className="brand-kpi-bottom">
              <span className="brand-kpi-badge neutral">
                {Number(kpiData?.waiting_asn || 0) > 0 ? "Pending ASN" : "0 Pending"}
              </span>
              <LiveSparkline data={Number(kpiData?.waiting_asn || 0) > 0 ? [0, Number(kpiData?.waiting_asn)] : [0, 0]} color="#D97706" width={60} height={24} />
            </div>
          </div>

          {/* Card 3: Shipments In Transit */}
          <div className="brand-kpi-card">
            <div className="brand-kpi-top">
              <span className="brand-kpi-label">Shipments In Transit</span>
              <div className="brand-kpi-icon blue">
                <FontAwesomeIcon icon={faTruck} />
              </div>
            </div>
            <div className="brand-kpi-value">
              <LiveCounter value={Number(kpiData?.shipment_created || 0)} isCurrency={false} />
            </div>
            <div className="brand-kpi-bottom">
              <span className="brand-kpi-badge up">
                {Number(kpiData?.shipment_created || 0) > 0 ? "In Transit" : "0 In Transit"}
              </span>
              <LiveSparkline data={Number(kpiData?.shipment_created || 0) > 0 ? [0, Number(kpiData?.shipment_created)] : [0, 0]} color="#2563EB" width={60} height={24} />
            </div>
          </div>

          {/* Card 4: Expected Value */}
          <div className="brand-kpi-card">
            <div className="brand-kpi-top">
              <span className="brand-kpi-label">Expected Value</span>
              <div className="brand-kpi-icon purple">
                <FontAwesomeIcon icon={faIndianRupeeSign} />
              </div>
            </div>
            <div className="brand-kpi-value">
              <LiveCounter value={parseExpectedValue()} isCurrency={true} />
            </div>
            <div className="brand-kpi-bottom">
              <span className="brand-kpi-label" style={{ fontSize: '13px', color: '#64748B', fontWeight: '700' }}>
                Total Value
              </span>
              <LiveSparkline data={parseExpectedValue() > 0 ? [0, parseExpectedValue()] : [0, 0]} color="#9333EA" width={60} height={24} />
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
                placeholder="Search Inbound ID, PO, Shipment, Supplier..."
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
                <option value="Main Warehouse">Main Warehouse</option>
              </select>

              <select
                className="var-select-sm"
                value={selectedSupplier}
                onChange={(e) => {
                  setSelectedSupplier(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="All">Supplier: All</option>
                {Array.from(new Set(inboundList.map(i => i.supplier).filter(Boolean))).map((sup, sIdx) => (
                  <option key={sIdx} value={sup}>{sup}</option>
                ))}
              </select>

              <select
                className="var-select-sm"
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="All">Status: All</option>
                <option value="Waiting for Approval">Waiting for Approval</option>
                <option value="Ready for ASN">Ready for ASN</option>
                <option value="ASN Created">ASN Created</option>
                <option value="In Transit">In Transit</option>
                <option value="Receiving in Progress">Receiving in Progress</option>
                <option value="Receiving Complete, GRN Pending">Receiving Complete</option>
                <option value="Awaiting Putaway">Awaiting Putaway</option>
                <option value="Putaway In Progress">Putaway In Progress</option>
                <option value="Putaway Completed">Putaway Completed</option>
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
                <option value="qty">Sort: Stock Qty</option>
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
            /* SMALL COMPACT ELEGANT CARDS */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px', marginBottom: '24px' }}>
              {paginatedInbounds.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center' }}>
                  <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px auto', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.12)' }}>
                    <FontAwesomeIcon icon={faTruck} />
                  </div>
                  <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>No inbound shipments found</h3>
                  <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '400px', margin: '0 auto 20px auto' }}>Monitor all supplier shipments and purchase deliveries before receiving.</p>
                  <Link to="/app/purchases/create" className="unit-btn-pill unit-btn-primary">
                    <FontAwesomeIcon icon={faPlus} /> Create Purchase
                  </Link>
                </div>
              ) : (
                paginatedInbounds.map((row, idx) => {
                  const hasAsn = row.asn_id && row.asn_id !== "—" && row.asn_id !== "";
                  const hasShipment = row.shipment_id && row.shipment_id !== "—" && row.shipment_id !== "";
                  const isDelivered = row.status === 'Delivered' || row.status === 'Stock Received' || row.status === 'Receiving Completed' || row.status === 'Putaway Completed';
                  const isDispatched = row.status === 'Dispatched';
                  const isInTransit = row.status === 'In Transit';
                  const isOutForDelivery = row.status === 'Out for Delivery';
                  const isReadyForAsn = row.status === 'Ready for ASN' || row.status === 'Preparing';
                  const isWaitingApproval = row.status === 'Waiting for Approval';

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedRecord(row)}
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
                      {/* Row 1: Icon + Inbound & Shipment ID + Status */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '10px',
                            background: isDelivered ? '#DCFCE7' : (hasShipment ? '#EFF6FF' : '#F8FAFC'),
                            color: isDelivered ? '#15803D' : (hasShipment ? '#2563EB' : '#94A3B8'),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            flexShrink: 0
                          }}>
                            🚚
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {row.inbound_id}
                            </div>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: hasShipment ? '#2563EB' : '#94A3B8', whiteSpace: 'nowrap' }}>
                              {hasShipment ? row.shipment_id : 'No Shipment'}
                            </div>
                          </div>
                        </div>

                        {/* Compact Status Pill */}
                        <div style={{ flexShrink: 0 }}>
                          {isDelivered ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: '800', background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', whiteSpace: 'nowrap' }}>
                              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#15803D' }} /> Delivered
                            </span>
                          ) : isDispatched ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: '800', background: '#F3E8FF', color: '#9333EA', border: '1px solid #E9D5FF', whiteSpace: 'nowrap' }}>
                              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#9333EA' }} /> Dispatched
                            </span>
                          ) : isInTransit ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: '800', background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', whiteSpace: 'nowrap' }}>
                              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#2563EB' }} /> In Transit
                            </span>
                          ) : isOutForDelivery ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: '800', background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', whiteSpace: 'nowrap' }}>
                              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#D97706' }} /> Delivery
                            </span>
                          ) : isReadyForAsn ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: '800', background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A', whiteSpace: 'nowrap' }}>
                              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#D97706' }} /> Ready for ASN
                            </span>
                          ) : isWaitingApproval ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: '800', background: '#FFF7ED', color: '#C2410C', border: '1px solid #FFEDD5', whiteSpace: 'nowrap' }}>
                              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#C2410C' }} /> Approval
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: '800', background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}>
                              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#64748B' }} /> {row.status}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Row 2: PO REF & Supplier */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                        <span style={{ padding: '2px 7px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#1E293B', fontFamily: 'monospace' }}>
                          {row.po_id}
                        </span>
                        {hasAsn && (
                          <span style={{ padding: '2px 7px', borderRadius: '6px', fontSize: '10.5px', fontWeight: '700', background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}>
                            {row.asn_id}
                          </span>
                        )}
                        <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '500', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          • {row.supplier}
                        </span>
                      </div>

                      {/* Row 3: Compact Logistics strip */}
                      <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '6px 10px', fontSize: '11px', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
                          {hasAsn && (row.vehicle_no || row.transporter) ? (
                            <span style={{ fontWeight: '600', color: '#0F172A' }}>
                              🚚 {row.vehicle_no || row.transporter}
                            </span>
                          ) : (
                            <span style={{ color: '#94A3B8' }}>Logistics: Unassigned</span>
                          )}
                        </div>
                        <div style={{ fontWeight: '700', color: isDelivered ? '#15803D' : '#D97706', whiteSpace: 'nowrap' }}>
                          {row.delivery_date || '01 Sep 2026'}
                        </div>
                      </div>

                      {/* Row 4: Stock Qty + View Details Button */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid #F1F5F9' }}>
                        <div>
                          <span style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>{row.stock_qty}</span>
                        </div>
                        <div onClick={e => e.stopPropagation()}>
                          <Link
                            to={`/app/inbound/detail/${row.id || idx}`}
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
                              textDecoration: 'none',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                            }}
                          >
                            <FontAwesomeIcon icon={faEye} style={{ fontSize: '10px' }} /> View
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* LIST VIEW TABLE (100% Matching Ref 3 & 4) */
            <div className="var-table-wrap" style={{ overflowX: 'auto', width: '100%' }}>
              <table className="var-table" style={{ width: '100%', minWidth: '1380px', tableLayout: 'auto', borderCollapse: 'separate' }}>
                <thead>
                  <tr>
                    <th style={{ width: "36px", whiteSpace: "nowrap" }}>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selectedRows.length === filteredItems.length && filteredItems.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th style={{ minWidth: "140px", whiteSpace: "nowrap" }}>INBOUND ID</th>
                    <th style={{ minWidth: "170px", whiteSpace: "nowrap" }}>SHIPMENT ID</th>
                    <th style={{ minWidth: "150px", whiteSpace: "nowrap" }}>ASN NUMBER</th>
                    <th style={{ minWidth: "110px", whiteSpace: "nowrap" }}>PO REF</th>
                    <th style={{ minWidth: "180px", whiteSpace: "nowrap" }}>DESTINATION WAREHOUSE</th>
                    <th style={{ minWidth: "190px", whiteSpace: "nowrap" }}>COURIER &amp; AWB / LR TRACKING</th>
                    <th style={{ minWidth: "150px", whiteSpace: "nowrap" }}>VEHICLE &amp; DRIVER</th>
                    <th style={{ minWidth: "130px", whiteSpace: "nowrap" }}>DISPATCH / ETA</th>
                    <th style={{ minWidth: "140px", whiteSpace: "nowrap" }}>STATUS</th>
                    <th style={{ minWidth: "90px", textAlign: "right", paddingRight: "16px", whiteSpace: "nowrap" }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedInbounds.length === 0 ? (
                    <tr>
                      <td colSpan="11" style={{ textAlign: 'center', padding: '60px 20px', border: 'none' }}>
                        <div style={{ padding: '20px', textAlign: 'center' }}>
                          <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', margin: '0 auto 16px auto', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.12)' }}>
                            <FontAwesomeIcon icon={faTruck} />
                          </div>
                          <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                            No inbound shipments found
                          </h3>
                          <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '420px', margin: '0 auto 22px auto', lineHeight: '1.55' }}>
                            {searchTerm || selectedWarehouse !== "All" || selectedSupplier !== "All" || selectedStatus !== "All"
                              ? "No inbound records match your active search or filter criteria. Try resetting filters."
                              : "Monitor all supplier shipments, advance shipping notices (ASN), and purchase deliveries before warehouse receiving."}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Link
                              to="/app/purchases/create"
                              className="unit-btn-pill unit-btn-primary"
                            >
                              <FontAwesomeIcon icon={faPlus} /> Create Purchase
                            </Link>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedInbounds.map((row, idx) => {
                      const rowId = row.id || row.inbound_id;
                      const isSelected = selectedRows.includes(rowId);
                      const hasAsn = row.asn_id && row.asn_id !== "—" && row.asn_id !== "";
                      const hasShipment = row.shipment_id && row.shipment_id !== "—" && row.shipment_id !== "";
                      
                      const isDelivered = row.status === 'Delivered' || row.status === 'Stock Received' || row.status === 'Receiving Completed' || row.status === 'Putaway Completed';
                      const isDispatched = row.status === 'Dispatched';
                      const isInTransit = row.status === 'In Transit';
                      const isOutForDelivery = row.status === 'Out for Delivery';
                      const isReadyForAsn = row.status === 'Ready for ASN' || row.status === 'Preparing';
                      const isWaitingApproval = row.status === 'Waiting for Approval';

                      return (
                        <tr
                          key={idx}
                          onClick={() => setSelectedRecord(row)}
                          style={{ cursor: "pointer", background: isSelected ? "#F0FDF4" : "transparent" }}
                        >
                          <td style={{ whiteSpace: "nowrap" }} onClick={e => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={isSelected}
                              onChange={() => handleSelectRow(rowId)}
                            />
                          </td>

                          {/* 1. INBOUND ID */}
                          <td style={{ whiteSpace: "nowrap" }}>
                            <Link
                              to={`/app/inbound/detail/${row.id || idx}`}
                              onClick={e => e.stopPropagation()}
                              className="unit-short-badge font-monospace text-decoration-none"
                              style={{ fontWeight: "800", color: "#2563EB", background: "#EFF6FF", border: "1px solid #BFDBFE" }}
                            >
                              {row.inbound_id}
                            </Link>
                          </td>

                          {/* 2. SHIPMENT ID */}
                          <td style={{ whiteSpace: "nowrap" }}>
                            {hasShipment ? (
                              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                                <div style={{
                                  width: "30px",
                                  height: "30px",
                                  borderRadius: "8px",
                                  background: isDelivered ? "#DCFCE7" : "#EFF6FF",
                                  color: isDelivered ? "#15803D" : "#2563EB",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "14px",
                                  flexShrink: 0
                                }}>
                                  🚚
                                </div>
                                <div>
                                  <div style={{ fontSize: "13px", fontWeight: "800", color: "#2563EB", whiteSpace: "nowrap" }}>
                                    {row.shipment_id}
                                  </div>
                                  <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "1px", fontWeight: "500", whiteSpace: "nowrap" }}>
                                    {row.delivery_date || "01 Sep 2026"}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: "#94A3B8", fontWeight: "500", whiteSpace: "nowrap" }}>—</span>
                            )}
                          </td>

                          {/* 3. ASN NUMBER */}
                          <td style={{ whiteSpace: "nowrap" }}>
                            {hasAsn ? (
                              <span style={{ fontSize: "13px", fontWeight: "700", color: "#334155", textDecoration: "none", whiteSpace: "nowrap", display: "inline-block" }}>
                                {row.asn_id}
                              </span>
                            ) : (
                              <span style={{ color: "#94A3B8", fontWeight: "500", whiteSpace: "nowrap" }}>—</span>
                            )}
                          </td>

                          {/* 4. PO REF */}
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
                              {row.po_id}
                            </span>
                          </td>

                          {/* 5. DESTINATION WAREHOUSE */}
                          <td style={{ whiteSpace: "nowrap" }}>
                            <div style={{ fontWeight: "700", color: "#0F172A", fontSize: "13px", whiteSpace: "nowrap" }}>
                              {row.warehouse || "Suguna Warehouse"}
                            </div>
                            <div style={{ fontSize: "11.5px", color: "#64748B", marginTop: "1px", whiteSpace: "nowrap" }}>
                              {row.supplier}
                            </div>
                          </td>

                          {/* 6. COURIER & AWB / LR TRACKING */}
                          <td style={{ whiteSpace: "nowrap" }}>
                            {hasAsn && (row.transporter || row.lr_number) ? (
                              <div>
                                <div style={{ fontWeight: "700", color: "#0F172A", fontSize: "13px", whiteSpace: "nowrap" }}>
                                  {row.transporter || "Logistics Assigned"}
                                </div>
                                <div style={{ fontSize: "11px", color: "#2563EB", fontWeight: "600", marginTop: "1px", whiteSpace: "nowrap" }}>
                                  AWB: {row.lr_number || "LR-2026-9871"}
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: "#94A3B8", fontWeight: "500", whiteSpace: "nowrap" }}>—</span>
                            )}
                          </td>

                          {/* 7. VEHICLE & DRIVER */}
                          <td style={{ whiteSpace: "nowrap" }}>
                            {hasAsn && (row.vehicle_no || row.driver) ? (
                              <div>
                                <div style={{ fontWeight: "700", color: "#0F172A", fontSize: "12.5px", whiteSpace: "nowrap" }}>
                                  {row.vehicle_no || "Vehicle Assigned"}
                                </div>
                                <div style={{ fontSize: "11px", color: "#64748B", marginTop: "1px", whiteSpace: "nowrap" }}>
                                  {row.driver || "Driver Assigned"}
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: "#94A3B8", fontWeight: "500", whiteSpace: "nowrap" }}>—</span>
                            )}
                          </td>

                          {/* 8. DISPATCH / ETA */}
                          <td style={{ whiteSpace: "nowrap" }}>
                            {hasAsn ? (
                              <div>
                                <div style={{ fontWeight: "700", color: "#0F172A", fontSize: "12px", whiteSpace: "nowrap" }}>
                                  {row.delivery_date || "01 Sep 2026"}
                                </div>
                                <div style={{ fontSize: "11px", color: isDelivered ? "#15803D" : "#D97706", fontWeight: "600", marginTop: "1px", whiteSpace: "nowrap" }}>
                                  ETA: {row.delivery_time && row.delivery_time !== "12:00 AM" ? row.delivery_time : "03 Sep"}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div style={{ fontWeight: "700", color: "#0F172A", fontSize: "12px", whiteSpace: "nowrap" }}>
                                  {row.delivery_date || "—"}
                                </div>
                                <div style={{ fontSize: "11px", color: "#94A3B8", fontWeight: "500", marginTop: "1px", whiteSpace: "nowrap" }}>
                                  Pending Dispatch
                                </div>
                              </div>
                            )}
                          </td>

                          {/* 9. STATUS */}
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
                            ) : isOutForDelivery ? (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: "800", background: "#FEF3C7", color: "#B45309", border: "1px solid #FDE68A", whiteSpace: "nowrap" }}>
                                <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#D97706" }}></span> Out for Delivery
                              </span>
                            ) : isReadyForAsn ? (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: "800", background: "#FEF3C7", color: "#D97706", border: "1px solid #FDE68A", whiteSpace: "nowrap" }}>
                                <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#D97706" }}></span> Ready for ASN
                              </span>
                            ) : isWaitingApproval ? (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: "800", background: "#FFF7ED", color: "#C2410C", border: "1px solid #FFEDD5", whiteSpace: "nowrap" }}>
                                <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#C2410C" }}></span> Waiting for Approval
                              </span>
                            ) : (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: "800", background: "#F1F5F9", color: "#475569", border: "1px solid #E2E8F0", whiteSpace: "nowrap" }}>
                                <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#64748B" }}></span> {row.status}
                              </span>
                            )}
                          </td>

                          {/* 10. ACTIONS */}
                          <td style={{ textAlign: "right", paddingRight: "16px", whiteSpace: "nowrap" }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: "inline-flex", gap: "6px", alignItems: "center", justifyContent: "flex-end" }}>
                              <Link
                                to={`/app/inbound/detail/${row.id || idx}`}
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
                                  textDecoration: "none",
                                  boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                                  transition: "all 150ms ease",
                                  whiteSpace: "nowrap"
                                }}
                                title="View Details"
                              >
                                <FontAwesomeIcon icon={faEye} style={{ fontSize: "11px" }} /> View
                              </Link>
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
              Showing {totalFiltered > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + pageSize, totalFiltered)} of {totalFiltered} shipments
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

        {/* ── Slide-in Drawer Modal for Selected Inbound Record Details ── */}
        {selectedRecord && (
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              width: "380px",
              maxWidth: "90vw",
              height: "100vh",
              background: "#FFFFFF",
              boxShadow: "-8px 0 30px rgba(15, 23, 42, 0.15)",
              zIndex: 1050,
              padding: "24px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              animation: "slideInRight 0.25s ease"
            }}
          >
            <div className="d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom">
              <div>
                <h4 style={{ fontSize: "17px", fontWeight: "800", color: "#0F172A", margin: "0" }}>{selectedRecord.inbound_id}</h4>
                <div style={{ fontSize: "11.5px", color: "#64748B" }}>Inbound Shipment Details</div>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-light rounded-circle"
                onClick={() => setSelectedRecord(null)}
                style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B" }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 12px", fontSize: "12px", marginBottom: "16px" }}>
              <div style={{ color: "#64748B" }}>PO ID</div>
              <div style={{ fontWeight: "700", color: "#2563EB", textAlign: "right" }}>{selectedRecord.po_id}</div>

              <div style={{ color: "#64748B" }}>Shipment ID</div>
              <div style={{ fontWeight: "700", color: "#0F172A", textAlign: "right" }}>{selectedRecord.shipment_id}</div>

              <div style={{ color: "#64748B" }}>Supplier</div>
              <div style={{ fontWeight: "700", color: "#0F172A", textAlign: "right" }}>{selectedRecord.supplier}</div>

              <div style={{ color: "#64748B" }}>Warehouse</div>
              <div style={{ fontWeight: "700", color: "#0F172A", textAlign: "right" }}>{selectedRecord.warehouse}</div>

              <div style={{ color: "#64748B" }}>Status</div>
              <div style={{ textAlign: "right" }}>
                <span className="unit-status-pill active">
                  <span className="unit-dot" /> {selectedRecord.status}
                </span>
              </div>

              <div style={{ color: "#64748B" }}>Expected Delivery</div>
              <div style={{ fontWeight: "700", color: "#0F172A", textAlign: "right" }}>{selectedRecord.delivery_date}</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "20px" }}>
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "10px" }}>
                <div style={{ fontSize: "10px", color: "#64748B", fontWeight: "600" }}>Expected Qty</div>
                <div style={{ fontSize: "15px", fontWeight: "800", color: "#0F172A", marginTop: "2px" }}>{selectedRecord.stock_qty}</div>
              </div>
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "10px" }}>
                <div style={{ fontSize: "10px", color: "#64748B", fontWeight: "600" }}>Purchase Value</div>
                <div style={{ fontSize: "15px", fontWeight: "800", color: "#16A34A", marginTop: "2px" }}>{selectedRecord.purchase_value || '—'}</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ marginTop: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <Link to={`/app/purchases`} className="unit-btn-pill text-decoration-none justify-content-center">
                📋 View PO
              </Link>
              <Link to={`/app/inbound/detail/${selectedRecord.id || 0}`} className="unit-btn-pill unit-btn-primary text-decoration-none justify-content-center">
                ▶ Open Detail
              </Link>
            </div>
          </div>
        )}

      </div>
    </MasterLayout>
  );
};

export default InboundPlanning;
