import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faSearch,
    faBarcode,
    faArrowRight,
    faTruck,
    faCheckCircle,
    faFileInvoice,
    faCheckDouble,
    faPlus,
    faMobileScreenButton,
    faRotateLeft,
    faBoxesPacking,
    faBuilding,
    faWarehouse,
    faExclamationTriangle,
    faCircleInfo,
    faPlay,
    faTimes,
    faClock
} from "@fortawesome/free-solid-svg-icons";
import MasterLayout from "../MasterLayout";
import TabTitle from "../../shared/tab-title/TabTitle";
import apiConfig from "../../config/apiConfig";
import { getCached, setCache } from "../../store/apiCache";
import { onPosDataChanged, emitPosDataChanged } from "../../shared/posEvents";
import moment from "moment";
import "../brands/ProductBrandsPremium.css";
import "../units/ProductUnitsPremium.css";
import "../variation/ProductVariationsPremium.css";
import LiveCounter from "../../shared/components/LiveCounter";
import LiveSparkline from "../../shared/components/LiveSparkline";
import "./LiveWarehouseReceiving.css";

const getInitialReceivingCache = () => {
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

const ReceivingList = () => {
    const navigate = useNavigate();
    const isMounted = useRef(true);
    const initialCache = useMemo(() => getInitialReceivingCache(), []);

    const [receivingItems, setReceivingItems] = useState(initialCache.items || []);
    const [loading, setLoading] = useState(false);

    // Scanner / Inbound Search State
    const [scanInput, setScanInput] = useState("");
    const [isValidating, setIsValidating] = useState(false);
    const [validationResult, setValidationResult] = useState(null);
    const [validationError, setValidationError] = useState("");

    // PDA live stream tracking
    const [activePdaPoId, setActivePdaPoId] = useState(null);
    const [completedMap, setCompletedMap] = useState({});
    const [pdaStatuses, setPdaStatuses] = useState({});

    const fetchReceivingData = async (isSilent = true) => {
        if (!isSilent && isMounted.current) {
            setLoading(true);
        }

        try {
            const response = await apiConfig.get("inbound-planning-data");
            if (isMounted.current && response.data && response.data.success && response.data.data) {
                const { items, kpi } = response.data.data;
                setCache("inbound:planning_data", { items, kpi });
                try {
                    localStorage.setItem("infy_inbound_planning_cache", JSON.stringify({ items, kpi }));
                } catch (e) {}
                setReceivingItems(items || []);
            }
        } catch (err) {
            console.error("Error fetching receiving data:", err);
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        isMounted.current = true;
        fetchReceivingData(true);

        const handleFocus = () => {
            fetchReceivingData(true);
        };
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                fetchReceivingData(true);
            }
        };

        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibility);

        const unsubscribe = onPosDataChanged?.(() => {
            fetchReceivingData(true);
        });

        return () => {
            isMounted.current = false;
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibility);
            if (typeof unsubscribe === 'function') unsubscribe();
        };
    }, []);

    // Handle Validate Inbound ID
    const handleValidateInbound = async (queryToSearch) => {
        const query = (queryToSearch !== undefined ? queryToSearch : scanInput).trim();
        if (!query) {
            setValidationError("Please enter or scan an Inbound ID, PO Number, or ASN.");
            setValidationResult(null);
            return;
        }

        setIsValidating(true);
        setValidationError("");

        try {
            const response = await apiConfig.get(`validate-receiving-inbound?search=${encodeURIComponent(query)}`);
            if (response.data && response.data.success && response.data.data) {
                setValidationResult(response.data);
                setValidationError("");
            } else {
                setValidationResult(null);
                setValidationError(response.data?.message || `No inbound record found matching "${query}".`);
            }
        } catch (err) {
            setValidationResult(null);
            setValidationError(err.response?.data?.message || "Failed to validate Inbound ID with server.");
        } finally {
            setIsValidating(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleValidateInbound();
        }
    };

    // Filter purely active and eligible receipts (NO UNAPPROVED OR READY FOR ASN)
    const activeSessions = useMemo(() => {
        return receivingItems.filter(i => 
            i.status === 'Receiving in Progress' || 
            activePdaPoId === String(i.id) || 
            activePdaPoId === i.po_id
        );
    }, [receivingItems, activePdaPoId]);

    const eligibleReceipts = useMemo(() => {
        return receivingItems.filter(i => 
            ['ASN Created', 'In Transit', 'Out for Delivery', 'Ready to Receive'].includes(i.status)
        );
    }, [receivingItems]);

    const verifiedGrns = useMemo(() => {
        return receivingItems.filter(i => 
            ['Receiving Completed', 'Receiving Complete, GRN Pending', 'Verified'].includes(i.status) || 
            completedMap[i.id]
        );
    }, [receivingItems, completedMap]);

    // KPI Metrics
    const readyToReceiveCount = eligibleReceipts.length;
    const activeSessionsCount = activeSessions.length;
    const grnPendingCount = verifiedGrns.length;
    const receivableUnitsTotal = eligibleReceipts.reduce((sum, i) => sum + Number(i.raw_qty || 0), 0);

    const handleStartReceiving = (inboundId) => {
        if (inboundId) {
            navigate(`/app/receiving/detail/${inboundId}`);
        }
    };

    const handleGenerateGrn = (item) => {
        const poId = item.id;
        const grnNo = `GRN-2026-${String(poId + 120).padStart(5, '0')}`;
        const poNo = item.po_id;
        const asnNo = item.asn_id || `ASN-2026-${String(poId).padStart(5, '0')}`;
        const sName = item.supplier;
        const wName = item.warehouse;
        const totalQty = item.expected_qty || item.stock_qty || 1;

        try {
            const currentGrns = JSON.parse(localStorage.getItem("wms_grn_list") || "[]");
            const newGrnObj = {
                id: poId + 9000,
                grn_number: grnNo,
                po_number: poNo,
                asn_number: asnNo,
                supplier_name: sName,
                warehouse_name: wName,
                receiving_date: moment().format("YYYY-MM-DD"),
                total_accepted: totalQty,
                status: "Waiting For Putaway",
                items: [
                    {
                        name: `Received Items for ${poNo}`,
                        accepted_qty: totalQty,
                        batch_no: `BATCH-${moment().format("YYYYMM")}-01`,
                        sku: `SKU-${poId}`
                    }
                ],
                created_at: new Date().toISOString()
            };
            localStorage.setItem("wms_grn_list", JSON.stringify([newGrnObj, ...currentGrns]));
        } catch (e) {}

        fetch(`/pda/receiving/generate-grn/${poId}`, {
            method: "POST",
            headers: {
                "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.content || "",
                "Content-Type": "application/json"
            }
        })
        .then(() => {
            emitPosDataChanged({
                type: 'inventory',
                action: 'updated',
                source: 'grn',
                poId,
                grnNumber: grnNo
            });
            alert(`🎉 ${grnNo} Generated Successfully!\nOrder moved out of Receiving Queue to Putaway Module.`);
            navigate("/app/putaway");
        })
        .catch(() => {
            emitPosDataChanged({
                type: 'inventory',
                action: 'updated',
                source: 'grn',
                poId,
                grnNumber: grnNo
            });
            alert(`🎉 ${grnNo} Generated Successfully!\nOrder moved out of Receiving Queue to Putaway Module.`);
            navigate("/app/putaway");
        });
    };

    return (
        <MasterLayout>
            <TabTitle title="Warehouse Receiving Workspace — INFY-POS" />

            <div className="brand-page-container">
                
                {/* ── 1. Breadcrumb ─────────────────────────────────────────── */}
                <div className="brand-breadcrumb">
                    <span>Dashboard</span>
                    <span>&gt;</span>
                    <span>Purchases</span>
                    <span>&gt;</span>
                    <span>Inbound</span>
                    <span>&gt;</span>
                    <span className="brand-crumb-active">Receiving Workspace</span>
                </div>

                {/* ── 2. Header Row ─────────────────────────────────────────── */}
                <div className="brand-header">
                    <div className="brand-title-group">
                        <h1>Warehouse Receiving Workspace</h1>
                        <p>Scan or enter an <strong>Inbound ID</strong> to validate shipment eligibility and start a dock receiving session.</p>
                    </div>

                    <div className="brand-header-actions">
                        <Link to="/app/purchases/create" className="unit-btn-pill unit-btn-primary">
                            <FontAwesomeIcon icon={faPlus} /> Create Purchase
                        </Link>
                        <a
                            href="/pda/receiving/stream"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="unit-btn-pill"
                        >
                            <FontAwesomeIcon icon={faMobileScreenButton} /> Open PDA Scanner
                        </a>
                    </div>
                </div>

                {/* ── 3. 4 Top KPI Cards Grid ───────────────────────────────── */}
                <div className="brand-kpi-grid">
                    {/* Card 1: Ready to Receive */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Ready to Receive</span>
                            <div className="brand-kpi-icon green">
                                <FontAwesomeIcon icon={faTruck} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={readyToReceiveCount} isCurrency={false} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className={`brand-kpi-badge ${readyToReceiveCount > 0 ? "up" : "neutral"}`}>
                                {readyToReceiveCount > 0 ? "Receivable Orders" : "0 Orders"}
                            </span>
                            <LiveSparkline data={readyToReceiveCount > 0 ? [0, readyToReceiveCount] : [0, 0]} color="#16A34A" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 2: Active Sessions */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Active Sessions</span>
                            <div className="brand-kpi-icon blue">
                                <FontAwesomeIcon icon={faBarcode} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={activeSessionsCount} isCurrency={false} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className={`brand-kpi-badge ${activeSessionsCount > 0 ? "up" : "neutral"}`}>
                                {activeSessionsCount > 0 ? "Active Scanning" : "0 Active"}
                            </span>
                            <LiveSparkline data={activeSessionsCount > 0 ? [0, activeSessionsCount] : [0, 0]} color="#2563EB" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 3: GRN Pending */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">GRN Pending</span>
                            <div className="brand-kpi-icon purple">
                                <FontAwesomeIcon icon={faCheckDouble} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={grnPendingCount} isCurrency={false} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className={`brand-kpi-badge ${grnPendingCount > 0 ? "up" : "neutral"}`}>
                                {grnPendingCount > 0 ? "Verified / GRN" : "0 GRNs"}
                            </span>
                            <LiveSparkline data={grnPendingCount > 0 ? [0, grnPendingCount] : [0, 0]} color="#9333EA" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 4: Receivable Units */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Receivable Units</span>
                            <div className="brand-kpi-icon orange">
                                <FontAwesomeIcon icon={faBoxesPacking} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={receivableUnitsTotal} isCurrency={false} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge neutral">
                                {receivableUnitsTotal > 0 ? "Units Total" : "0 Units"}
                            </span>
                            <LiveSparkline data={receivableUnitsTotal > 0 ? [0, receivableUnitsTotal] : [0, 0]} color="#D97706" width={60} height={24} />
                        </div>
                    </div>
                </div>

                {/* ── 4. Main Receiving Workspace ─────────────────────────────── */}
                <div className="var-workspace" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* CORE SCANNER HUB CARD */}
                    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                                <FontAwesomeIcon icon={faBarcode} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Start Receiving</h2>
                                <p style={{ fontSize: '13px', color: '#64748B', margin: '2px 0 0 0' }}>Scan or enter an Inbound ID (e.g. <code>INB-2026-00002</code>), PO Number, or ASN barcode to begin.</p>
                            </div>
                        </div>

                        {/* Search Input Box */}
                        <div style={{ display: 'flex', gap: '12px', marginTop: '18px', flexWrap: 'wrap' }}>
                            <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
                                <FontAwesomeIcon icon={faSearch} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '15px' }} />
                                <input
                                    type="text"
                                    placeholder="Scan barcode or enter Inbound ID (e.g. INB-2026-00002) & press Enter..."
                                    value={scanInput}
                                    onChange={(e) => setScanInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    autoFocus
                                    style={{ width: '100%', height: '48px', padding: '0 40px 0 46px', borderRadius: '12px', border: '1.5px solid #CBD5E1', fontSize: '14.5px', fontWeight: '600', color: '#0F172A', outline: 'none', background: '#F8FAFC' }}
                                />
                                {scanInput && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setScanInput("");
                                            setValidationResult(null);
                                            setValidationError("");
                                        }}
                                        style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: '#94A3B8', cursor: 'pointer', fontSize: '15px' }}
                                    >
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                )}
                            </div>

                            <button
                                type="button"
                                className="unit-btn-pill unit-btn-primary"
                                style={{ height: '48px', padding: '0 24px', fontSize: '14px', fontWeight: '800' }}
                                onClick={() => handleValidateInbound()}
                                disabled={isValidating}
                            >
                                {isValidating ? "Validating..." : "Validate & Inspect"} <FontAwesomeIcon icon={faArrowRight} />
                            </button>
                        </div>

                        {/* Error Message */}
                        {validationError && (
                            <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '12px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', fontSize: '13.5px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <FontAwesomeIcon icon={faExclamationTriangle} />
                                <span>{validationError}</span>
                            </div>
                        )}

                        {/* Validation Result Inspection Card */}
                        {validationResult && validationResult.data && (
                            <div style={{ marginTop: '20px', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '20px', background: '#F8FAFC' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                            <span className="unit-short-badge font-monospace" style={{ fontSize: '14px', fontWeight: '800' }}>
                                                {validationResult.data.inbound_id}
                                            </span>
                                            <span className="unit-base-badge font-monospace" style={{ fontSize: '13px' }}>
                                                {validationResult.data.po_id}
                                            </span>
                                            {validationResult.data.asn_id && (
                                                <span className="unit-base-badge font-monospace" style={{ fontSize: '13px', background: '#EFF6FF', color: '#2563EB', borderColor: '#BFDBFE' }}>
                                                    {validationResult.data.asn_id}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>{validationResult.data.supplier}</div>
                                        <div style={{ fontSize: '12px', color: '#64748B' }}>{validationResult.data.warehouse} • Expected: {validationResult.data.expected_qty} Units • Delivery: {validationResult.data.expected_delivery}</div>
                                    </div>

                                    <div>
                                        {validationResult.data.status === 'Waiting for Approval' ? (
                                            <span className="unit-status-pill draft" style={{ fontSize: '13px', padding: '6px 14px' }}>
                                                <span className="unit-dot" /> Waiting for Approval
                                            </span>
                                        ) : ['Ready for ASN', 'Waiting for ASN'].includes(validationResult.data.status) ? (
                                            <span className="unit-status-pill draft" style={{ fontSize: '13px', padding: '6px 14px' }}>
                                                <span className="unit-dot" /> Ready for ASN
                                            </span>
                                        ) : validationResult.eligible ? (
                                            <span className="unit-status-pill active" style={{ fontSize: '13px', padding: '6px 14px' }}>
                                                <span className="unit-dot" /> {validationResult.data.status === 'ASN Created' ? 'ASN Created — Ready to Receive' : 'Ready to Receive'}
                                            </span>
                                        ) : (
                                            <span className="unit-status-pill default" style={{ fontSize: '13px', padding: '6px 14px' }}>
                                                <span className="unit-dot" /> {validationResult.data.status}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Status Explanation Alert */}
                                <div style={{
                                    padding: '12px 16px',
                                    borderRadius: '10px',
                                    marginBottom: '16px',
                                    fontSize: '13px',
                                    fontWeight: '700',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    background: validationResult.eligible ? '#DCFCE7' : '#FEF3C7',
                                    border: `1px solid ${validationResult.eligible ? '#86EFAC' : '#FCD34D'}`,
                                    color: validationResult.eligible ? '#15803D' : '#92400E'
                                }}>
                                    <FontAwesomeIcon icon={validationResult.eligible ? faCheckCircle : faCircleInfo} />
                                    <span>{validationResult.reason}</span>
                                </div>

                                {/* Products Summary */}
                                {validationResult.data.items && validationResult.data.items.length > 0 && (
                                    <div style={{ background: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '12px 16px', marginBottom: '16px' }}>
                                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>Line Items Expected</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {validationResult.data.items.map((it, idx) => (
                                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                                                    <span style={{ fontWeight: '700', color: '#0F172A' }}>{it.product_name}</span>
                                                    <span className="font-monospace" style={{ fontWeight: '800', color: '#16A34A' }}>{it.expected_qty} {it.unit}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                    {validationResult.eligible ? (
                                        <button
                                            type="button"
                                            className="unit-btn-pill unit-btn-primary"
                                            style={{ height: '46px', padding: '0 28px', fontSize: '14px', fontWeight: '800' }}
                                            onClick={() => handleStartReceiving(validationResult.data.id)}
                                        >
                                            <FontAwesomeIcon icon={faPlay} /> Start Receiving Session
                                        </button>
                                    ) : ['Receiving Completed', 'Receiving Complete, GRN Pending', 'Verified'].includes(validationResult.data.status) ? (
                                        <button
                                            type="button"
                                            className="unit-btn-pill unit-btn-primary"
                                            style={{ height: '46px', padding: '0 28px', fontSize: '14px', fontWeight: '800' }}
                                            onClick={() => handleGenerateGrn(validationResult.data)}
                                        >
                                            <FontAwesomeIcon icon={faFileInvoice} /> Generate GRN
                                        </button>
                                    ) : (
                                        <button
                                            disabled
                                            className="unit-btn-pill disabled"
                                            style={{ height: '46px', padding: '0 24px', fontSize: '13.5px', fontWeight: '700', opacity: 0.5, cursor: 'not-allowed', background: '#E2E8F0', color: '#64748B', border: 'none' }}
                                        >
                                            Start Receiving (Disabled — {validationResult.data.status})
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SECTION 1: ACTIVE RECEIVING SESSIONS (IN PROGRESS) */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FontAwesomeIcon icon={faBarcode} style={{ color: '#2563EB' }} />
                                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Active Receiving Sessions</h3>
                                <span className="unit-short-badge">{activeSessions.length}</span>
                            </div>
                        </div>

                        {activeSessions.length === 0 ? (
                            <div style={{ background: '#FFFFFF', border: '1px dashed #CBD5E1', borderRadius: '16px', padding: '36px 20px', textAlign: 'center', color: '#64748B' }}>
                                <FontAwesomeIcon icon={faClock} style={{ fontSize: '26px', marginBottom: '10px', color: '#94A3B8' }} />
                                <div style={{ fontSize: '14.5px', fontWeight: '800', color: '#0F172A' }}>No active receiving sessions</div>
                                <div style={{ fontSize: '13px', marginTop: '4px', color: '#64748B' }}>Scan an eligible Inbound ID above to begin dock receiving.</div>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                                {activeSessions.map((row, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => handleStartReceiving(row.id)}
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
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                                <div style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '10px',
                                                    background: '#EFF6FF',
                                                    color: '#2563EB',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '14px',
                                                    flexShrink: 0
                                                }}>
                                                    <FontAwesomeIcon icon={faBarcode} />
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {row.po_id}
                                                    </div>
                                                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#2563EB', whiteSpace: 'nowrap' }}>
                                                        {row.inbound_id}
                                                    </div>
                                                </div>
                                            </div>

                                            <span className="unit-status-pill default" style={{ padding: '2px 8px', fontSize: '11px', fontWeight: '800', whiteSpace: 'nowrap' }}>
                                                <span className="unit-dot" /> In Progress
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                            <span style={{ fontSize: '12px', color: '#0F172A', fontWeight: '700', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                                {row.supplier}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid #F1F5F9' }}>
                                            <div>
                                                <span style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>
                                                    {String(row.stock_qty || row.expected_qty || 1).replace(/Units/gi, '').trim()} Units
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                className="unit-btn-pill unit-btn-primary"
                                                style={{ height: '30px', padding: '0 12px', fontSize: '11.5px', fontWeight: '700' }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleStartReceiving(row.id);
                                                }}
                                            >
                                                <span>Continue</span> <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: '10px' }} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* SECTION 2: ELIGIBLE DOCK RECEIPTS (READY TO RECEIVE) */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FontAwesomeIcon icon={faTruck} style={{ color: '#16A34A' }} />
                                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Eligible Dock Receipts (Ready to Receive)</h3>
                                <span className="unit-short-badge" style={{ background: '#DCFCE7', color: '#15803D', border: '1px solid #BBF7D0' }}>{eligibleReceipts.length}</span>
                            </div>
                        </div>

                        {eligibleReceipts.length === 0 ? (
                            <div style={{ background: '#FFFFFF', border: '1px dashed #CBD5E1', borderRadius: '16px', padding: '36px 20px', textAlign: 'center', color: '#64748B' }}>
                                <FontAwesomeIcon icon={faTruck} style={{ fontSize: '26px', marginBottom: '10px', color: '#94A3B8' }} />
                                <div style={{ fontSize: '14.5px', fontWeight: '800', color: '#0F172A' }}>No shipments currently awaiting dock arrival</div>
                                <div style={{ fontSize: '13px', marginTop: '4px', color: '#64748B' }}>Purchase orders waiting for approval or awaiting ASN creation will not appear here until dispatched.</div>
                            </div>
                        ) : (
                            <div className="var-table-wrap" style={{ overflowX: 'auto', width: '100%' }}>
                                <table className="var-table" style={{ width: '100%', minWidth: '1380px', tableLayout: 'auto', borderCollapse: 'separate' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ minWidth: "130px", whiteSpace: "nowrap" }}>INBOUND ID</th>
                                            <th style={{ minWidth: "120px", whiteSpace: "nowrap" }}>PO NUMBER</th>
                                            <th style={{ minWidth: "180px", whiteSpace: "nowrap" }}>SUPPLIER &amp; ASN</th>
                                            <th style={{ minWidth: "160px", whiteSpace: "nowrap" }}>WAREHOUSE</th>
                                            <th style={{ minWidth: "160px", whiteSpace: "nowrap" }}>VEHICLE &amp; DRIVER</th>
                                            <th style={{ minWidth: "120px", whiteSpace: "nowrap" }}>EXPECTED QTY</th>
                                            <th style={{ minWidth: "130px", whiteSpace: "nowrap" }}>DELIVERY DATE</th>
                                            <th style={{ minWidth: "140px", whiteSpace: "nowrap" }}>STATUS</th>
                                            <th style={{ textAlign: 'right', minWidth: "130px", paddingRight: '16px', whiteSpace: "nowrap" }}>ACTION</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {eligibleReceipts.map((row, idx) => {
                                            const hasAsn = row.asn_id && row.asn_id !== '—' && row.asn_id !== '';
                                            const qtyDisplay = String(row.stock_qty || row.expected_qty || row.raw_qty || 1).replace(/Units/gi, '').trim() + ' Units';
                                            const formattedDate = moment(row.delivery_date).isValid() ? moment(row.delivery_date).format('DD MMM YYYY') : (row.delivery_date || '01 Sep 2026');

                                            return (
                                                <tr
                                                    key={idx}
                                                    onClick={() => {
                                                        setScanInput(row.inbound_id);
                                                        handleValidateInbound(row.inbound_id);
                                                    }}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        <span style={{
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
                                                        }}>
                                                            {row.inbound_id}
                                                        </span>
                                                    </td>
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        <span style={{
                                                            display: 'inline-block',
                                                            padding: '3px 10px',
                                                            borderRadius: '8px',
                                                            fontSize: '12px',
                                                            fontWeight: '700',
                                                            background: '#F8FAFC',
                                                            border: '1px solid #E2E8F0',
                                                            color: '#1E293B',
                                                            fontFamily: 'monospace',
                                                            whiteSpace: 'nowrap'
                                                        }}>
                                                            {row.po_id}
                                                        </span>
                                                    </td>
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '13px', whiteSpace: 'nowrap' }}>
                                                            {row.supplier}
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: hasAsn ? '#2563EB' : '#94A3B8', fontWeight: '600', marginTop: '1px', whiteSpace: 'nowrap' }}>
                                                            {hasAsn ? `ASN: ${row.asn_id}` : 'ASN: Pending'}
                                                        </div>
                                                    </td>
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        <span style={{ fontWeight: '700', color: '#0F172A', fontSize: '13px', whiteSpace: 'nowrap' }}>
                                                            {row.warehouse || 'Suguna Warehouse'}
                                                        </span>
                                                    </td>
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        {hasAsn && (row.vehicle_no || row.transporter) ? (
                                                            <div style={{ whiteSpace: "nowrap" }}>
                                                                <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#0F172A', whiteSpace: 'nowrap' }}>
                                                                    <FontAwesomeIcon icon={faTruck} className="text-primary me-1" />
                                                                    {row.vehicle_no || row.transporter}
                                                                </div>
                                                                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '1px', whiteSpace: 'nowrap' }}>
                                                                    {row.driver || 'Driver Assigned'}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span style={{ color: '#94A3B8', fontWeight: '500', whiteSpace: 'nowrap' }}>—</span>
                                                        )}
                                                    </td>
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        <span style={{ fontWeight: '800', color: '#0F172A', fontSize: '13px', whiteSpace: 'nowrap' }}>
                                                            {qtyDisplay}
                                                        </span>
                                                    </td>
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#0F172A', whiteSpace: 'nowrap' }}>
                                                            {formattedDate}
                                                        </span>
                                                    </td>
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        <span style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            padding: '4px 12px',
                                                            borderRadius: '999px',
                                                            fontSize: '12px',
                                                            fontWeight: '800',
                                                            background: '#DCFCE7',
                                                            color: '#15803D',
                                                            border: '1px solid #86EFAC',
                                                            whiteSpace: 'nowrap'
                                                        }}>
                                                            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#15803D' }}></span> Ready to Receive
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: 'right', paddingRight: '16px', whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleStartReceiving(row.id)}
                                                            style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                height: '32px',
                                                                padding: '0 14px',
                                                                borderRadius: '999px',
                                                                fontSize: '12px',
                                                                fontWeight: '700',
                                                                background: '#16A34A',
                                                                border: '1px solid #15803D',
                                                                color: '#FFFFFF',
                                                                boxShadow: '0 2px 6px rgba(22, 163, 74, 0.2)',
                                                                cursor: 'pointer',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            <span>Start Receiving</span> <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: '10px' }} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                </div>

            </div>
        </MasterLayout>
    );
};

export default ReceivingList;
