import React, { useState, useEffect } from "react";
import MasterLayout from "../MasterLayout";
import TabTitle from "../../shared/tab-title/TabTitle";
import { Link, useParams } from "react-router-dom";
import moment from "moment";
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faBoxesStacked,
    faTruckFast,
    faBuilding,
    faWarehouse,
    faRotateLeft,
    faPrint,
    faPlay,
    faBarcode,
    faClock,
    faCheckCircle,
    faReceipt,
    faWeightHanging,
    faCreditCard,
    faCircleInfo,
    faArrowLeft,
    faCalendarAlt,
    faUserTie,
    faTruck
} from "@fortawesome/free-solid-svg-icons";
import apiConfig from "../../config/apiConfig";
import LiveCounter from "../../shared/components/LiveCounter";
import LiveSparkline from "../../shared/components/LiveSparkline";
import "../brands/ProductBrandsPremium.css";
import "../units/ProductUnitsPremium.css";
import { onPosDataChanged } from "../../shared/posEvents";

const InboundDetail = () => {
    const { id } = useParams();

    // Default fallback initial state for 0ms instant render
    const defaultDetail = {
        inbound_id: `INB-2026-0000${id || '1'}`,
        po_id: "PO-2026-001111",
        supplier: "Jeyachandran Textile Private Limited",
        warehouse: "Suguna Warehouse",
        po_created_date: "30 Aug 2026, 11:59 AM",
        expected_delivery: "30 Aug 2026, 12:00 PM",
        status: "Ready for ASN",
        expected_qty: 1,
        cartons: 1,
        weight: "20 KG",
        purchase_value: "₹ 15.00",
        line_items_count: 1,
        asn_details: null,
        items: [
            {
                product_name: "Lays Classic Salted Crunchy Potato Chips",
                code: "8902888746737",
                barcode: "8902888746737",
                quantity: "1 Units",
                unit_cost: "₹ 15.00",
                subtotal: "₹ 15.00",
                image_url: "/uploads/main_product/1116/Lays_Classic_Salted__1.jpg",
                status: "Pending Receiving"
            }
        ]
    };

    const [detail, setDetail] = useState(defaultDetail);
    const [loading, setLoading] = useState(false);

    const fetchDetail = async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const response = await apiConfig.get(`inbound-planning-detail/${id}`);
            if (response.data && response.data.success && response.data.data) {
                const d = response.data.data;
                // Clean up any double formatted dates
                let cleanExpDelivery = d.expected_delivery || "30 Aug 2026, 12:00 PM";
                if (cleanExpDelivery.includes("AMaug") || cleanExpDelivery.includes("PMaug")) {
                    cleanExpDelivery = cleanExpDelivery.replace(/AMaug/g, "AM").replace(/PMaug/g, "PM");
                }
                setDetail({
                    ...d,
                    expected_delivery: cleanExpDelivery
                });
            }
        } catch (err) {
            console.error("Error fetching inbound detail:", err);
        } finally {
            if (!isSilent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();

        const handleFocus = () => {
            fetchDetail(true);
        };
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                fetchDetail(true);
            }
        };

        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibility);

        const unsubscribe = onPosDataChanged?.(() => {
            fetchDetail(true);
        });

        return () => {
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibility);
            if (typeof unsubscribe === 'function') unsubscribe();
        };
    }, [id]);

    const isCompleteStatus = [
        "Receiving Complete, GRN Pending",
        "Receiving Complete",
        "Putaway Pending",
        "Putaway In Progress",
        "Putaway Completed",
        "Putaway Complete",
        "Completed",
        "Complete"
    ].includes(detail.status);

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title={`${detail.inbound_id} — Inbound Details — infy-pos WMS`} />

            <div className="brand-page-container">
                {/* 1. Breadcrumb */}
                <div className="brand-breadcrumb">
                    <span>Dashboard</span>
                    <span>&gt;</span>
                    <span>Inbound</span>
                    <span>&gt;</span>
                    <Link to="/app/inbound" style={{ textDecoration: 'none', color: '#64748B' }}>Inbound Planning</Link>
                    <span>&gt;</span>
                    <span className="brand-crumb-active">{detail.inbound_id}</span>
                </div>

                {/* 2. Page Header */}
                <div className="brand-header">
                    <div className="brand-title-group">
                        <div className="d-flex align-items-center gap-2 mb-1">
                            <h1 style={{ fontSize: '26px', fontWeight: '800', margin: 0, color: '#0F172A' }}>
                                {detail.inbound_id}
                            </h1>
                            <span className={`unit-status-pill ${detail.status === 'Putaway Completed' ? 'active' : (detail.status.includes('In Transit') || detail.status.includes('Delivery') ? 'default' : 'draft')}`}>
                                <span className="unit-dot" /> {detail.status}
                            </span>
                            <span className="unit-base-badge">
                                PO: {detail.po_id}
                            </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                            Inbound consignment tracking, advance shipping verification, and dock receiving workflow.
                        </p>
                    </div>

                    <div className="brand-header-actions">
                        <button type="button" className="brand-btn-pill" onClick={fetchDetail}>
                            <FontAwesomeIcon icon={faRotateLeft} />
                            <span>Refresh</span>
                        </button>

                        <button type="button" className="brand-btn-pill" onClick={() => window.print()}>
                            <FontAwesomeIcon icon={faPrint} />
                            <span>Print Slip</span>
                        </button>

                        <Link to="/app/receiving" className="brand-btn-pill brand-btn-primary">
                            <FontAwesomeIcon icon={faPlay} />
                            <span>Start Warehouse Receiving</span>
                        </Link>
                    </div>
                </div>

                {/* 3. Exactly 4 Standard Luxury KPI Cards Grid (Matching Units page) */}
                <div className="brand-kpi-grid">
                    {/* Card 1: Expected Qty */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Expected Inbound Qty</span>
                            <div className="brand-kpi-icon green">
                                <FontAwesomeIcon icon={faBoxesStacked} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            {detail.expected_qty} Units
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge up">{detail.line_items_count} Line Item{detail.line_items_count > 1 ? 's' : ''}</span>
                            <LiveSparkline data={[1, 1, 1, 1, 1]} color="#16A34A" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 2: Cartons & Weight */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Packages & Weight</span>
                            <div className="brand-kpi-icon blue">
                                <FontAwesomeIcon icon={faWarehouse} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            {detail.cartons} Cartons
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge up">{detail.weight} Gross</span>
                            <LiveSparkline data={[1, 1]} color="#2563EB" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 3: Inbound Value */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Inbound PO Value</span>
                            <div className="brand-kpi-icon purple">
                                <FontAwesomeIcon icon={faCreditCard} />
                            </div>
                        </div>
                        <div className="brand-kpi-value" style={{ color: '#0F172A' }}>
                            {detail.purchase_value}
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-label" style={{ fontSize: '13px', color: '#64748B', fontWeight: '700' }}>
                                PO Grand Total
                            </span>
                            <LiveSparkline data={[1, 1]} color="#9333EA" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 4: ASN Status */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">ASN & Courier Status</span>
                            <div className={`brand-kpi-icon ${detail.asn_details ? 'green' : 'orange'}`}>
                                <FontAwesomeIcon icon={faTruckFast} />
                            </div>
                        </div>
                        <div className="brand-kpi-value" style={{ fontSize: '20px', color: detail.asn_details ? '#16A34A' : '#D97706' }}>
                            {detail.asn_details ? "ASN SUBMITTED" : "ASN PENDING"}
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className={`brand-kpi-badge ${detail.asn_details ? 'up' : 'neutral'}`}>
                                {detail.asn_details ? "Carrier Dispatched" : "Awaiting Supplier ASN"}
                            </span>
                            <LiveSparkline data={[1, 1]} color={detail.asn_details ? '#16A34A' : '#D97706'} width={60} height={24} />
                        </div>
                    </div>
                </div>

                {/* 4. 2 Main Information Cards (Purchase Order & ASN Tracking) */}
                <div className="row g-4 mb-4">
                    {/* Left Card: Purchase Order & Warehouse */}
                    <div className="col-lg-6">
                        <div style={{ background: '#FFFFFF', border: '1px solid #EEF2F7', borderRadius: '22px', padding: '24px', height: '100%', boxShadow: '0 4px 18px rgba(15, 23, 42, 0.03)' }}>
                            <div className="d-flex align-items-center gap-3 pb-3 border-bottom mb-3">
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#DBEAFE', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px' }}>
                                    <FontAwesomeIcon icon={faBuilding} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: '#0F172A' }}>
                                        Purchase Order & Warehouse
                                    </h3>
                                    <div style={{ fontSize: '12px', color: '#64748B' }}>
                                        Order Origin & Destination Metadata
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
                                <div className="d-flex justify-content-between align-items-center">
                                    <span style={{ color: '#64748B' }}>Inbound Tracking ID</span>
                                    <strong style={{ color: '#0F172A', fontWeight: '700' }}>{detail.inbound_id}</strong>
                                </div>

                                <div className="d-flex justify-content-between align-items-center">
                                    <span style={{ color: '#64748B' }}>PO Reference Code</span>
                                    <strong style={{ color: '#2563EB', fontWeight: '700' }}>{detail.po_id}</strong>
                                </div>

                                <div className="d-flex justify-content-between align-items-center">
                                    <span style={{ color: '#64748B' }}>Supplier Name</span>
                                    <strong style={{ color: '#0F172A', fontWeight: '700' }}>{detail.supplier}</strong>
                                </div>

                                <div className="d-flex justify-content-between align-items-center">
                                    <span style={{ color: '#64748B' }}>Destination Warehouse</span>
                                    <strong style={{ color: '#0F172A', fontWeight: '700' }}>{detail.warehouse}</strong>
                                </div>

                                <div className="d-flex justify-content-between align-items-center">
                                    <span style={{ color: '#64748B' }}>PO Creation Date</span>
                                    <strong style={{ color: '#0F172A', fontWeight: '600' }}>{detail.po_created_date}</strong>
                                </div>

                                <div className="d-flex justify-content-between align-items-center">
                                    <span style={{ color: '#64748B' }}>
                                        {isCompleteStatus ? "Delivery Status" : "Expected Delivery Date"}
                                    </span>
                                    <strong style={{ color: '#16A34A', fontWeight: '700' }}>
                                        {isCompleteStatus ? `✓ Received (${detail.expected_delivery})` : detail.expected_delivery}
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Card: Advance Shipping Notice (ASN) & Courier */}
                    <div className="col-lg-6">
                        <div style={{ background: '#FFFFFF', border: '1px solid #EEF2F7', borderRadius: '22px', padding: '24px', height: '100%', boxShadow: '0 4px 18px rgba(15, 23, 42, 0.03)' }}>
                            <div className="d-flex align-items-center gap-3 pb-3 border-bottom mb-3">
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px' }}>
                                    <FontAwesomeIcon icon={faTruck} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: '#0F172A' }}>
                                        Advance Shipping Notice (ASN) & Courier
                                    </h3>
                                    <div style={{ fontSize: '12px', color: '#64748B' }}>
                                        Real-Time Courier & Vehicle Tracking
                                    </div>
                                </div>
                            </div>

                            {detail.asn_details ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span style={{ color: '#64748B' }}>ASN Number</span>
                                        <strong style={{ color: '#2563EB' }}>{detail.asn_details.asn_number}</strong>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span style={{ color: '#64748B' }}>Vehicle Number</span>
                                        <strong style={{ color: '#0F172A' }}>{detail.asn_details.vehicle_number}</strong>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span style={{ color: '#64748B' }}>Transport Company</span>
                                        <strong style={{ color: '#0F172A' }}>{detail.asn_details.transport_company}</strong>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span style={{ color: '#64748B' }}>Driver Name & Mobile</span>
                                        <strong style={{ color: '#0F172A' }}>
                                            {detail.asn_details.driver_name} ({detail.asn_details.driver_mobile})
                                        </strong>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span style={{ color: '#64748B' }}>Dispatch Date</span>
                                        <strong style={{ color: '#16A34A' }}>{detail.asn_details.dispatch_date}</strong>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '28px 20px', textAlign: 'center' }}>
                                    <div style={{ width: '46px', height: '46px', background: '#FEF3C7', color: '#D97706', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', margin: '0 auto 12px auto' }}>
                                        <FontAwesomeIcon icon={faClock} />
                                    </div>
                                    <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', marginBottom: '6px' }}>
                                        ASN Pending Supplier Submission
                                    </h4>
                                    <p style={{ fontSize: '12.5px', color: '#64748B', margin: '0 auto', maxWidth: '380px', lineHeight: '1.55' }}>
                                        The supplier has not submitted an Advance Shipping Notice (ASN) yet. Vehicle number, driver details, and tracking payload will appear automatically once dispatched.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 5. Expected Inbound Product Items Table */}
                <div className="var-workspace">
                    <div className="d-flex align-items-center gap-3 pb-3 mb-2">
                        <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                            <FontAwesomeIcon icon={faBoxesStacked} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '16.5px', fontWeight: '800', margin: 0, color: '#0F172A' }}>
                                Expected Inbound Product Items
                            </h3>
                            <div style={{ fontSize: '12px', color: '#64748B' }}>
                                List of verified SKU line items expected in this shipment consignment
                            </div>
                        </div>
                    </div>

                    <div className="var-table-wrap">
                        <table className="var-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '360px' }}>PRODUCT NAME & CODE</th>
                                    <th style={{ width: '220px' }}>BARCODE</th>
                                    <th>EXPECTED QTY</th>
                                    <th>UNIT COST</th>
                                    <th>SUBTOTAL</th>
                                    <th style={{ textAlign: 'right' }}>STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {detail.items && detail.items.length > 0 ? (
                                    detail.items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>
                                                <div className="d-flex align-items-center gap-3">
                                                    <img
                                                        src={item.image_url || "/uploads/main_product/1116/Lays_Classic_Salted__1.jpg"}
                                                        alt={item.product_name}
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = "/uploads/main_product/1116/Lays_Classic_Salted__1.jpg";
                                                        }}
                                                        style={{ width: "44px", height: "44px", borderRadius: "10px", objectFit: "cover", border: "1px solid #E2E8F0" }}
                                                    />
                                                    <div>
                                                        <div style={{ fontWeight: "800", fontSize: '13.5px', color: "#0F172A" }}>
                                                            {item.product_name}
                                                        </div>
                                                        <div style={{ fontSize: "11.5px", color: "#2563EB", fontWeight: "700" }}>
                                                            SKU: {item.code}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", width: "135px", padding: "4px 6px", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "6px" }}>
                                                    <svg viewBox="0 0 140 28" style={{ width: "100%", height: "24px" }}>
                                                        <rect x="2" y="0" width="3" height="28" fill="#0F172A" />
                                                        <rect x="7" y="0" width="1" height="28" fill="#0F172A" />
                                                        <rect x="10" y="0" width="4" height="28" fill="#0F172A" />
                                                        <rect x="16" y="0" width="2" height="28" fill="#0F172A" />
                                                        <rect x="20" y="0" width="1" height="28" fill="#0F172A" />
                                                        <rect x="23" y="0" width="5" height="28" fill="#0F172A" />
                                                        <rect x="30" y="0" width="2" height="28" fill="#0F172A" />
                                                        <rect x="34" y="0" width="1" height="28" fill="#0F172A" />
                                                        <rect x="37" y="0" width="4" height="28" fill="#0F172A" />
                                                        <rect x="43" y="0" width="2" height="28" fill="#0F172A" />
                                                        <rect x="47" y="0" width="6" height="28" fill="#0F172A" />
                                                        <rect x="55" y="0" width="1" height="28" fill="#0F172A" />
                                                        <rect x="58" y="0" width="3" height="28" fill="#0F172A" />
                                                        <rect x="63" y="0" width="2" height="28" fill="#0F172A" />
                                                        <rect x="67" y="0" width="4" height="28" fill="#0F172A" />
                                                        <rect x="73" y="0" width="1" height="28" fill="#0F172A" />
                                                        <rect x="76" y="0" width="5" height="28" fill="#0F172A" />
                                                        <rect x="83" y="0" width="2" height="28" fill="#0F172A" />
                                                        <rect x="87" y="0" width="1" height="28" fill="#0F172A" />
                                                        <rect x="90" y="0" width="4" height="28" fill="#0F172A" />
                                                        <rect x="96" y="0" width="2" height="28" fill="#0F172A" />
                                                        <rect x="100" y="0" width="6" height="28" fill="#0F172A" />
                                                        <rect x="108" y="0" width="1" height="28" fill="#0F172A" />
                                                        <rect x="111" y="0" width="3" height="28" fill="#0F172A" />
                                                        <rect x="116" y="0" width="2" height="28" fill="#0F172A" />
                                                        <rect x="120" y="0" width="4" height="28" fill="#0F172A" />
                                                        <rect x="126" y="0" width="1" height="28" fill="#0F172A" />
                                                        <rect x="129" y="0" width="5" height="28" fill="#0F172A" />
                                                        <rect x="136" y="0" width="2" height="28" fill="#0F172A" />
                                                    </svg>
                                                    <div style={{ fontFamily: "monospace, 'Courier New', Courier", fontSize: "11px", fontWeight: "700", color: "#0F172A", letterSpacing: "1px", textAlign: "center", width: "100%", marginTop: "1px" }}>
                                                        {item.barcode || "8902888746737"}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: "800", color: "#0F172A" }}>{item.quantity}</td>
                                            <td style={{ fontWeight: "700", color: "#475569" }}>{item.unit_cost}</td>
                                            <td style={{ fontWeight: "800", color: "#16A34A" }}>{item.subtotal}</td>
                                            <td style={{ textAlign: "right" }}>
                                                <span className={`badge ${isCompleteStatus ? 'bg-success-subtle text-success border border-success' : 'bg-warning-subtle text-warning border border-warning'} fw-bold px-2.5 py-1 fs-micro`}>
                                                    {isCompleteStatus ? "Received & Verified" : "Pending Arrival"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#64748B' }}>
                                            No product items in this shipment.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </MasterLayout>
    );
};

export default InboundDetail;
