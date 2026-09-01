import React, { useState, useEffect, useRef } from "react";
import { connect, useDispatch } from "react-redux";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faTruck,
    faBarcode,
    faCheckCircle,
    faExclamationTriangle,
    faSearch,
    faRotateRight,
    faBoxesPacking,
    faBuilding,
    faWarehouse,
    faCalendarAlt,
    faBoxOpen,
    faCheckDouble,
    faArrowLeft,
    faCheck,
    faMinus,
    faPlus,
} from "@fortawesome/free-solid-svg-icons";
import MasterLayout from "../MasterLayout";
import TabTitle from "../../shared/tab-title/TabTitle";
import { fetchPurchases } from "../../store/action/purchaseAction";
import { fetchAllSuppliers } from "../../store/action/supplierAction";
import { fetchAllWarehouses } from "../../store/action/warehouseAction";
import { fetchAllMainProducts } from "../../store/action/productAction";
import { fetchFrontSetting } from "../../store/action/frontSettingAction";
import moment from "moment";
import apiConfig from "../../config/apiConfig";
import { emitPosDataChanged } from "../../shared/posEvents";
import "../supplier/SuppliersPremium.css";
import "./LiveWarehouseReceiving.css";

const LiveWarehouseReceiving = (props) => {
    const {
        fetchPurchases,
        purchases = [],
        suppliers = [],
        warehouses = [],
        allMainProducts = [],
        fetchAllMainProducts,
        fetchAllSuppliers,
        fetchAllWarehouses,
        fetchFrontSetting
    } = props;

    const { id } = useParams();
    const navigate = useNavigate();
    const isMounted = useRef(true);
    const [selectedPo, setSelectedPo] = useState(null);
    const [poDetail, setPoDetail] = useState(null);
    const [liveData, setLiveData] = useState(null);
    const [scannedItemsMap, setScannedItemsMap] = useState({});
    const [receivingStatus, setReceivingStatus] = useState("Receiving"); // "Receiving" | "Completed"

    useEffect(() => {
        isMounted.current = true;
        const controller = new AbortController();

        fetchFrontSetting();
        fetchAllSuppliers();
        fetchAllWarehouses();
        fetchPurchases({ pageSize: 100 }, true);
        if (fetchAllMainProducts) fetchAllMainProducts({}, false);

        if (id) {
            fetch(`/api/v1/inbound-planning-detail/${id}`, {
                signal: controller.signal,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
                    'Accept': 'application/json'
                }
            })
            .then((res) => res.json())
            .then((resData) => {
                if (isMounted.current && resData && resData.data) {
                    setPoDetail(resData.data);
                }
            })
            .catch((err) => {
                if (err.name !== 'AbortError') console.log("Error fetching PO detail:", err);
            });
        }

        // Real-Time Live Synchronization Loop (1500ms interval)
        const syncTimer = setInterval(() => {
            if (!isMounted.current) return;
            fetch(`/pda/receiving/live-stream/${id || ""}`, { signal: controller.signal })
                .then((res) => res.json())
                .then((resData) => {
                    if (!isMounted.current) return;
                    if (resData && resData.data) {
                        const payload = resData.data;
                        setLiveData(payload);

                        if (payload.items_list && Array.isArray(payload.items_list)) {
                            const newMap = {};
                            payload.items_list.forEach(it => {
                                if (it.barcode) newMap[it.barcode] = it.received;
                                if (it.sku) newMap[it.sku] = it.received;
                                if (it.code) newMap[it.code] = it.received;
                                if (it.name) newMap[it.name] = it.received;
                            });
                            setScannedItemsMap(newMap);
                        } else if (payload.item_data) {
                            setScannedItemsMap((prev) => ({
                                ...prev,
                                [payload.item_data.barcode]: payload.item_data.received,
                                [payload.item_data.sku]: payload.item_data.received,
                                [payload.item_data.code]: payload.item_data.received,
                                [payload.item_data.name]: payload.item_data.received
                            }));
                        }

                        if (payload.event_type === "completed" || payload.event_type === "verified") {
                            setReceivingStatus("Completed");
                        }
                    }
                })
                .catch((err) => {
                    if (err.name !== 'AbortError') console.log("Live stream sync:", err);
                });
        }, 1500);

        return () => {
            isMounted.current = false;
            controller.abort();
            clearInterval(syncTimer);
        };
    }, [id]);

    // Extract Purchases list safely
    const rawList = Array.isArray(purchases)
        ? purchases
        : purchases && Array.isArray(purchases.data)
        ? purchases.data
        : [];

    const supplierList = Array.isArray(suppliers)
        ? suppliers
        : suppliers && Array.isArray(suppliers.data)
        ? suppliers.data
        : [];

    const warehouseList = Array.isArray(warehouses)
        ? warehouses
        : warehouses && Array.isArray(warehouses.data)
        ? warehouses.data
        : [];

    // Format PO Number helper
    const getPoNumber = (p) => {
        const rawRef = p?.attributes?.reference_code;
        if (rawRef && rawRef.startsWith("PO-")) return rawRef;
        const cleanId = p?.id || (rawRef ? rawRef.replace(/\D/g, "") : "1");
        return `PO-2026-${String(cleanId).padStart(6, "0")}`;
    };

    const getAsnNumber = (p) => {
        const cleanId = p?.id || "1";
        return `ASN-2026-${String(cleanId).padStart(5, "0")}`;
    };

    // Auto Select first PO if none selected
    const activePurchase = selectedPo || (id ? rawList.find(p => String(p.id) === String(id) || String(p.attributes?.id) === String(id)) : (rawList.length > 0 ? rawList[0] : null));

    const poNumber = poDetail?.po_reference_code || (activePurchase ? getPoNumber(activePurchase) : `PO-2026-${String(id || '000041').padStart(6, "0")}`);
    const asnNumber = poDetail?.asn_details?.asn_number || (activePurchase ? getAsnNumber(activePurchase) : `ASN-2026-${String(id || '00041').padStart(5, "0")}`);

    const supplierObj = activePurchase ? supplierList.find((s) => s.id === activePurchase.attributes?.supplier_id) : null;
    const supplierName = poDetail?.supplier_name || supplierObj?.attributes?.name || activePurchase?.attributes?.supplier_name || "Manoj Warehouse";

    const warehouseObj = activePurchase ? warehouseList.find((w) => w.id === activePurchase.attributes?.warehouse_id) : null;
    const warehouseName = poDetail?.destination_warehouse || warehouseObj?.attributes?.name || activePurchase?.attributes?.warehouse_name || "Main Warehouse";
    const vehicleNumber = poDetail?.asn_details?.vehicle_number || "TN03 U2104";

    const parseDisplayDate = (d) => {
        if (!d) return moment().format("DD MMM YYYY");
        if (typeof d === "string" && /^\d{2}\s[A-Za-z]{3}\s\d{4}$/.test(d)) return d;
        const m = moment(d, ["YYYY-MM-DD HH:mm:ss", "YYYY-MM-DD", "DD MMM YYYY", moment.ISO_8601]);
        return m.isValid() ? m.format("DD MMM YYYY") : d;
    };

    const deliveryDate = parseDisplayDate(poDetail?.expected_delivery || activePurchase?.attributes?.created_at);

    // Products Line Items
    const rawItems = (poDetail && poDetail.items && poDetail.items.length > 0)
        ? poDetail.items.map((it, idx) => ({
            id: it.id || idx + 1,
            product_id: it.product_id || it.id,
            product_name: it.product_name,
            code: it.code || it.barcode || it.sku,
            barcode: it.barcode || it.code || it.sku,
            quantity: parseInt(it.quantity) || 1,
            image_url: it.image_url
        }))
        : (activePurchase?.attributes?.purchase_items || []);

    const itemsList = rawItems;

    // Compute Totals
    let totalExpected = 0;
    let totalReceived = 0;

    itemsList.forEach((item) => {
        const expected = Number(item.quantity || 0);
        totalExpected += expected;
        const key = item.code || item.product_id;
        const rec = scannedItemsMap[key] !== undefined 
            ? scannedItemsMap[key] 
            : (liveData?.totals?.total_received && itemsList.length === 1 ? liveData.totals.total_received : 0);
        totalReceived += rec;
    });

    const totalRemaining = Math.max(0, totalExpected - totalReceived);
    const progressPct = totalExpected > 0 ? Math.round((totalReceived / totalExpected) * 100) : 0;

    const isCompleted = receivingStatus === "Completed" || progressPct === 100;

    const handleConfirmGrn = () => {
        const poId = id;
        const payloadItems = itemsList.map(item => {
            const key = item.code || item.product_id;
            const rec = scannedItemsMap[key] !== undefined 
                ? scannedItemsMap[key] 
                : (liveData?.totals?.total_received && itemsList.length === 1 ? liveData.totals.total_received : (item.quantity || 0));
            return {
                product_id: item.product_id || item.id,
                code: item.code || item.barcode,
                expected: Number(item.quantity || 0),
                received: Number(rec || 0)
            };
        });

        apiConfig.post(`pda/receiving/generate-grn/${poId}`, {
            items: payloadItems
        })
        .then(res => {
            const resData = res.data;
            const grnNo = resData?.grn_number || `GRN-2026-${String(Number(poId) + 120).padStart(5, '0')}`;
            const isPart = resData?.is_partial;

            // Invalidate caches & broadcast to all tabs
            try {
                emitPosDataChanged({
                    type: 'inventory',
                    action: 'updated',
                    source: 'grn',
                    poId,
                    grnNumber: grnNo,
                    productIds: payloadItems.map(i => i.product_id),
                });
            } catch (_) {}

            if (isPart) {
                alert(`📦 Partial ${grnNo} Generated!\n${resData.received_qty}/${resData.expected_qty} Units received & inventory updated. Remaining stock is pending.`);
            } else {
                alert(`🎉 ${grnNo} Generated Successfully!\nAll quantities received & inventory updated. Ready for Putaway.`);
            }
            navigate("/app/stock-receiving");
        })
        .catch(err => {
            console.error("GRN generation error:", err);
            const errMsg = err?.response?.data?.message || err?.message || "Failed to generate GRN.";
            alert("Error confirming receiving: " + errMsg);
        });
    };

    return (
        <MasterLayout>
            <TabTitle title="Live Receiving Monitor — INFY-POS" />

            <div className="sup-create-page">
                    {/* ── Breadcrumb ── */}
                    <div className="brand-breadcrumb">
                        <span>Dashboard</span>
                        <span>&gt;</span>
                        <Link to="/app/purchases" style={{ color: '#64748B', textDecoration: 'none' }}>Purchases</Link>
                        <span>&gt;</span>
                        <Link to="/app/receiving" style={{ color: '#64748B', textDecoration: 'none' }}>Inbound Receiving</Link>
                        <span>&gt;</span>
                        <span className="brand-crumb-active">Live Receiving Monitor</span>
                    </div>

                    <div className="create-fullpage-container">

                        {/* ── Header Bar ── */}
                        <div className="create-form-header">
                            <div className="d-flex align-items-center gap-3">
                                <Link to="/app/receiving" className="brand-btn-pill">
                                    <FontAwesomeIcon icon={faArrowLeft} /> Back to Inbound Receiving Queue
                                </Link>
                                <div>
                                    <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', margin: 0, lineHeight: '1.2' }}>
                                        Real-Time Warehouse Receiving Monitor
                                    </h2>
                                    <p style={{ fontSize: '13.5px', color: '#64748B', margin: '2px 0 0 0' }}>
                                        Live synchronization with Mobile PDA Scanner. Barcode scans & status updates sync instantly without page refresh.
                                    </p>
                                </div>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                {isCompleted ? (
                                    <span className="live-status-pill-completed">
                                        <FontAwesomeIcon icon={faCheckCircle} /> Completed
                                    </span>
                                ) : (
                                    <span className="live-status-pill-active">
                                        <span className="live-pulse-dot"></span> Live Sync Receiving
                                    </span>
                                )}
                                <button
                                    type="button"
                                    className="brand-btn-pill"
                                    onClick={() => navigate('/app/receiving')}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="brand-btn-pill brand-btn-primary"
                                    onClick={handleConfirmGrn}
                                >
                                    <FontAwesomeIcon icon={faCheck} /> Confirm Receiving & Generate GRN
                                </button>
                            </div>
                        </div>

                        {/* ── Form Body ── */}
                        <div className="create-form-body">

                            {/* Section 1: Receiving Overview & Metrics */}
                            <div className="create-card-section">
                                <div className="create-section-header">
                                    <div className="create-section-icon green">
                                        <FontAwesomeIcon icon={faBoxesPacking} />
                                    </div>
                                    <div className="create-section-title">
                                        <h3>Receiving Overview & Real-Time Metrics</h3>
                                        <p>Live item count, physical scan progress, and dock verification status</p>
                                    </div>
                                </div>

                                <div className="row g-4">
                                    <div className="col-md-3 col-sm-6">
                                        <div className="live-metric-card">
                                            <div className="live-metric-lbl">Expected Quantity</div>
                                            <div className="live-metric-val">{totalExpected} <span className="live-metric-unit">Units</span></div>
                                            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>Total PO Items</div>
                                        </div>
                                    </div>
                                    <div className="col-md-3 col-sm-6">
                                        <div className="live-metric-card">
                                            <div className="live-metric-lbl">Received Quantity</div>
                                            <div className="live-metric-val text-green">{totalReceived} <span className="live-metric-unit">Units</span></div>
                                            <div style={{ fontSize: '12px', color: '#16A34A', marginTop: '4px', fontWeight: 600 }}>Scanned & Verified</div>
                                        </div>
                                    </div>
                                    <div className="col-md-3 col-sm-6">
                                        <div className="live-metric-card">
                                            <div className="live-metric-lbl">Remaining Quantity</div>
                                            <div className="live-metric-val text-orange">{totalRemaining} <span className="live-metric-unit">Units</span></div>
                                            <div style={{ fontSize: '12px', color: '#EA580C', marginTop: '4px', fontWeight: 600 }}>Pending Dock Scan</div>
                                        </div>
                                    </div>
                                    <div className="col-md-3 col-sm-6">
                                        <div className="live-metric-card">
                                            <div className="live-metric-lbl">Receiving Progress</div>
                                            <div className="live-metric-val">{progressPct}%</div>
                                            <div className="live-progress-bar-bg">
                                                <div className="live-progress-bar-fill" style={{ width: `${progressPct}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Lifecycle State Notice */}
                            {poDetail?.status === 'Waiting for Approval' && (
                                <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', color: '#92400E', padding: '16px 20px', borderRadius: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '14px', fontWeight: '700', fontSize: '13.5px' }}>
                                    <FontAwesomeIcon icon={faExclamationTriangle} style={{ fontSize: '20px' }} />
                                    <span>This purchase order is currently <strong>Waiting for Supplier Approval</strong>. Dock receiving will become active once the supplier accepts the PO and dispatches the shipment.</span>
                                </div>
                            )}
                            {['Ready for ASN', 'Waiting for ASN', 'ASN Created'].includes(poDetail?.status) && (
                                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF', padding: '16px 20px', borderRadius: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '14px', fontWeight: '700', fontSize: '13.5px' }}>
                                    <FontAwesomeIcon icon={faExclamationTriangle} style={{ fontSize: '20px' }} />
                                    <span>This order is currently <strong>{poDetail?.status}</strong>. Dock receiving will become active once the shipment is dispatched to the warehouse.</span>
                                </div>
                            )}

                            {/* Section 2: Inbound Shipment & PO Specifications */}
                            <div className="create-card-section">
                                <div className="create-section-header">
                                    <div className="create-section-icon blue">
                                        <FontAwesomeIcon icon={faTruck} />
                                    </div>
                                    <div className="create-section-title">
                                        <h3>Inbound Shipment & PO Specifications</h3>
                                        <p>Carrier vehicle, warehouse dock, supplier, and PO reference metadata</p>
                                    </div>
                                </div>

                                <div className="row g-4">
                                    <div className="col-md-4 col-sm-6">
                                        <label className="form-label" style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            PO ID
                                        </label>
                                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px 16px' }}>
                                            <span style={{ fontWeight: '800', color: '#2563EB', fontFamily: 'monospace', fontSize: '14px' }}>
                                                {poNumber}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="col-md-4 col-sm-6">
                                        <label className="form-label" style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            ASN ID
                                        </label>
                                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px 16px' }}>
                                            <span style={{ fontWeight: '800', color: '#0F172A', fontFamily: 'monospace', fontSize: '14px' }}>
                                                {asnNumber}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="col-md-4 col-sm-6">
                                        <label className="form-label" style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Supplier / Vendor
                                        </label>
                                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px 16px' }}>
                                            <span style={{ fontWeight: '800', color: '#0F172A', fontSize: '14px' }}>
                                                {supplierName}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="col-md-4 col-sm-6">
                                        <label className="form-label" style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Destination Warehouse
                                        </label>
                                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px 16px' }}>
                                            <span style={{ fontWeight: '800', color: '#0F172A', fontSize: '14px' }}>
                                                {warehouseName}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="col-md-4 col-sm-6">
                                        <label className="form-label" style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Carrier Vehicle No.
                                        </label>
                                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px 16px' }}>
                                            <span style={{ fontWeight: '800', color: '#0F172A', fontFamily: 'monospace', fontSize: '14px' }}>
                                                {vehicleNumber}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="col-md-4 col-sm-6">
                                        <label className="form-label" style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Expected Delivery Date
                                        </label>
                                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px 16px' }}>
                                            <span style={{ fontWeight: '800', color: '#16A34A', fontSize: '14px' }}>
                                                {deliveryDate}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Completion Success Banner */}
                            {isCompleted && (
                                <div className="live-completed-banner">
                                    <FontAwesomeIcon icon={faCheckDouble} style={{ fontSize: 24 }} />
                                    <div>
                                        <strong>Receiving Completed & GRN Generated Successfully!</strong>
                                        <div style={{ fontSize: 13, opacity: 0.9 }}>
                                            All quantities have been physically verified by PDA operator. Inventory is now Available for Putaway.
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Section 3: Live Product Receiving Specification */}
                            <div className="create-card-section">
                                <div className="create-section-header" style={{ justifyContent: 'space-between' }}>
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="create-section-icon purple">
                                            <FontAwesomeIcon icon={faBarcode} />
                                        </div>
                                        <div className="create-section-title">
                                            <h3>Live Product Receiving Specification</h3>
                                            <p>Scan or manually verify item quantities for barcode generation and GRN creation</p>
                                        </div>
                                    </div>
                                    <span className="supp-code-badge" style={{ fontSize: '13px', padding: '6px 12px' }}>
                                        {itemsList.length} Line Items
                                    </span>
                                </div>

                                <div className="supp-table-card">
                                    <table className="supp-data-table">
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>SKU / Barcode</th>
                                                <th>Expected Qty</th>
                                                <th>Received Qty</th>
                                                <th>Remaining Qty</th>
                                                <th>Progress</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {itemsList.map((item, idx) => {
                                                const expected = Number(item.quantity || 0);
                                                const key = item.code || item.product_id;
                                                const rec = scannedItemsMap[key] || (liveData?.totals?.total_received && itemsList.length === 1 ? liveData.totals.total_received : 0);
                                                const rem = Math.max(0, expected - rec);
                                                const itemPct = expected > 0 ? Math.round((rec / expected) * 100) : 0;
                                                const itemCompleted = rec >= expected;

                                                return (
                                                    <tr key={idx} className={rec > 0 ? "row-scanned-active" : ""}>
                                                        <td>
                                                            <div className="d-flex align-items-center gap-3">
                                                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#F8FAFC', border: '1px solid #EEF2F7', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                                                                    {item.image_url ? (
                                                                        <img
                                                                            src={item.image_url}
                                                                            alt={item.product_name || "Product"}
                                                                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                                        />
                                                                    ) : (
                                                                        <FontAwesomeIcon icon={faBoxesPacking} style={{ color: '#94A3B8', fontSize: '18px' }} />
                                                                    )}
                                                                </div>
                                                                <span style={{ fontWeight: 800, color: "#0F172A", fontSize: '14px' }}>
                                                                    {item.product_name || "Product Item"}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className="supp-code-badge" style={{ color: '#16A34A', fontWeight: 800 }}>
                                                                {item.code || "SKU"}
                                                            </span>
                                                            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '3px' }}>
                                                                Barcode: {item.barcode || item.code || "N/A"}
                                                            </div>
                                                        </td>
                                                        <td style={{ fontWeight: 800, fontSize: '14px', color: '#0F172A' }}>
                                                            {expected}
                                                        </td>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const current = scannedItemsMap[key] || 0;
                                                                        if (current > 0) {
                                                                            setScannedItemsMap(prev => ({ ...prev, [key]: current - 1 }));
                                                                        }
                                                                    }}
                                                                    style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1.5px solid #E2E8F0', background: '#FFFFFF', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', transition: 'all 0.15s ease' }}
                                                                >
                                                                    <FontAwesomeIcon icon={faMinus} style={{ fontSize: '11px' }} />
                                                                </button>
                                                                <input
                                                                    type="number"
                                                                    value={scannedItemsMap[key] !== undefined ? scannedItemsMap[key] : (liveData?.totals?.total_received && itemsList.length === 1 ? liveData.totals.total_received : 0)}
                                                                    onChange={(e) => {
                                                                        const val = Math.max(0, parseInt(e.target.value) || 0);
                                                                        setScannedItemsMap(prev => ({ ...prev, [key]: val }));
                                                                    }}
                                                                    style={{ width: '64px', height: '36px', textAlign: 'center', borderRadius: '8px', border: '1.5px solid #E2E8F0', fontWeight: '800', color: '#16A34A', fontSize: '14px' }}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const current = scannedItemsMap[key] || 0;
                                                                        setScannedItemsMap(prev => ({ ...prev, [key]: current + 1 }));
                                                                    }}
                                                                    style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1.5px solid #E2E8F0', background: '#FFFFFF', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', transition: 'all 0.15s ease' }}
                                                                >
                                                                    <FontAwesomeIcon icon={faPlus} style={{ fontSize: '11px' }} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td style={{ fontWeight: 800, color: "#EA580C", fontSize: '14px' }}>
                                                            {rem}
                                                        </td>
                                                        <td style={{ width: 140 }}>
                                                            <div className="live-progress-bar-bg" style={{ height: 6 }}>
                                                                <div className="live-progress-bar-fill" style={{ width: `${itemPct}%` }}></div>
                                                            </div>
                                                            <div style={{ fontSize: 11, color: "#64748B", marginTop: 4, fontWeight: 700 }}>{itemPct}%</div>
                                                        </td>
                                                        <td>
                                                            {itemCompleted ? (
                                                                <span className="supp-status-active">
                                                                    <FontAwesomeIcon icon={faCheckCircle} /> Completed
                                                                </span>
                                                            ) : rec > 0 ? (
                                                                <span className="live-badge-progress">In Progress</span>
                                                            ) : (
                                                                <span className="live-badge-pending">Pending</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Receiving Footer Actions */}
                                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderTop: '1px solid #E2E8F0', paddingTop: '20px' }}>
                                    <div>
                                        <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>
                                            Total Received: <span style={{ color: '#16A34A' }}>{totalReceived}</span> / {totalExpected} Units
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
                                            {totalRemaining > 0 ? `${totalRemaining} units remaining to complete full receipt.` : `All expected units have been verified.`}
                                        </div>
                                    </div>

                                    <div className="d-flex align-items-center gap-2">
                                        <button
                                            type="button"
                                            className="brand-btn-pill"
                                            onClick={() => navigate('/app/receiving')}
                                        >
                                            Back to Receiving Hub
                                        </button>
                                        <button
                                            type="button"
                                            className="brand-btn-pill brand-btn-primary"
                                            onClick={handleConfirmGrn}
                                        >
                                            <FontAwesomeIcon icon={faCheck} /> Confirm Receiving & Generate GRN
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
        </MasterLayout>
    );
};

const mapStateToProps = (state) => {
    const { purchases, suppliers, warehouses, allMainProducts, frontSetting } = state;
    return { purchases, suppliers, warehouses, allMainProducts, frontSetting };
};

export default connect(mapStateToProps, {
    fetchPurchases,
    fetchAllSuppliers,
    fetchAllWarehouses,
    fetchAllMainProducts,
    fetchFrontSetting
})(LiveWarehouseReceiving);

