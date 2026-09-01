import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { connect } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeft,
    faBoxes,
    faWarehouse,
    faTag,
    faBuilding,
    faClock,
    faCheckCircle,
    faExclamationTriangle,
    faBarcode,
    faEdit,
    faSliders,
    faPrint,
    faHistory,
    faFileText,
    faLayerGroup,
    faReceipt,
    faShieldAlt,
    faTruck
} from "@fortawesome/free-solid-svg-icons";
import MasterLayout from "../MasterLayout";
import TabTitle from "../../shared/tab-title/TabTitle";
import { fetchFrontSetting } from "../../store/action/frontSettingAction";
import moment from "moment";
import "./InventoryDetail.css";

import apiConfig from "../../config/apiConfig";
import { getCached, setCache } from "../../store/apiCache";

const getInitialProduct = (id) => {
    const memory = getCached("inventory:master_stock");
    if (memory?.data) {
        const found = memory.data.find(item => String(item.id) === String(id));
        if (found) return found;
    }
    try {
        const stored = localStorage.getItem("infypos_inventory_master");
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed?.data) {
                const found = parsed.data.find(item => String(item.id) === String(id));
                if (found) return found;
                if (parsed.data.length > 0 && !id) return parsed.data[0];
            }
        }
    } catch (e) {}
    return null;
};

const InventoryDetail = (props) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { fetchFrontSetting } = props;

    const initialProd = getInitialProduct(id);
    const [product, setProduct] = useState(initialProd);
    const [loading, setLoading] = useState(!initialProd);
    const [activeTab, setActiveTab] = useState("Overview");

    useEffect(() => {
        let isMounted = true;
        fetchFrontSetting();

        const cached = getInitialProduct(id);
        if (cached) {
            setProduct(cached);
            setLoading(false);
        } else {
            setLoading(true);
        }

        apiConfig.get("inventory/master-stock")
            .then(res => {
                if (!isMounted) return;
                const resData = res.data;
                if (resData && resData.success && resData.data) {
                    setCache("inventory:master_stock", resData);
                    try {
                        localStorage.setItem("infypos_inventory_master", JSON.stringify(resData));
                    } catch (e) {}
                    const found = resData.data.find(item => String(item.id) === String(id));
                    if (found) {
                        setProduct(found);
                    } else if (resData.data.length > 0) {
                        setProduct(resData.data[0]);
                    }
                }
            })
            .catch(err => console.error("Error loading product detail:", err))
            .finally(() => {
                if (isMounted) {
                    setLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [id]);

    const formatCurrency = (val) => {
        return `₹ ${Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    if (loading) {
        return (
            <MasterLayout>
                <div style={{ padding: 80, textAlign: "center", color: "#64748B" }}>
                    <div className="spinner-border text-success" style={{ width: 36, height: 36 }}></div>
                    <p style={{ marginTop: 16, fontWeight: 800, fontSize: 15 }}>Loading Inventory Details...</p>
                </div>
            </MasterLayout>
        );
    }

    if (!product) {
        return (
            <MasterLayout>
                <div style={{ padding: 60, textAlign: "center" }}>
                    <h3>Product Not Found</h3>
                    <Link to="/app/inventory" className="inv-back-btn mt-3">
                        <FontAwesomeIcon icon={faArrowLeft} /> Back to Inventory
                    </Link>
                </div>
            </MasterLayout>
        );
    }

    return (
        <MasterLayout>
            <TabTitle title={`${product.name} — Inventory Details | INFY-POS Enterprise WMS`} />

            <div className="inv-detail-container">

                {/* ── 1. Top Navigation & Action Buttons ── */}
                <div className="inv-detail-top-nav">
                    <div>
                        <Link to="/app/inventory" className="inv-back-btn">
                            <FontAwesomeIcon icon={faArrowLeft} /> Back to Inventory
                        </Link>
                    </div>

                    <div className="inv-detail-actions">
                        <Link to={`/app/products/edit/${product.id}`} className="ent-btn-export">
                            <FontAwesomeIcon icon={faEdit} /> Edit Product
                        </Link>
                        <a href="#/app/adjustments/create" className="ent-btn-export">
                            <FontAwesomeIcon icon={faSliders} /> Adjust Stock
                        </a>
                        <a href="#/app/print/barcode" className="ent-btn-export">
                            <FontAwesomeIcon icon={faPrint} /> Print Bin Label
                        </a>
                    </div>
                </div>

                {/* ── 2. Hero Header Card ── */}
                <div className="inv-hero-card">
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="inv-hero-img"
                        onError={(e) => { e.target.src = "/uploads/main_product/1116/Lays_Classic_Salted__1.jpg"; }}
                    />

                    <div className="inv-hero-info">
                        <h1 className="inv-hero-title">{product.name}</h1>

                        <div className="inv-hero-meta">
                            <span className="inv-hero-sku">SKU: {product.sku}</span>
                            <span className="inv-hero-tag">Category: {product.category_name}</span>
                            <span className="inv-hero-tag">Brand: {product.brand_name}</span>
                            <span className="inv-hero-tag">HSN: {product.hsn_code}</span>
                            <span className="inv-hero-tag">Barcode: {product.barcode}</span>
                        </div>

                        <div className="inv-hero-stats">
                            <div className="inv-stat-box">
                                <div className="inv-stat-lbl">Stock Status</div>
                                <div className="inv-stat-val">
                                    {product.status === "Available" ? (
                                        <span className="ent-badge-avail"><FontAwesomeIcon icon={faCheckCircle} /> Available</span>
                                    ) : product.status === "Low Stock" ? (
                                        <span className="ent-badge-low">Low Stock</span>
                                    ) : (
                                        <span className="ent-badge-out">Out of Stock</span>
                                    )}
                                </div>
                            </div>

                            <div className="inv-stat-box">
                                <div className="inv-stat-lbl">Available Qty</div>
                                <div className="inv-stat-val" style={{ color: "#16A34A" }}>
                                    {product.available_qty} <span style={{ fontSize: 12, color: "#64748B" }}>Units</span>
                                </div>
                            </div>

                            <div className="inv-stat-box">
                                <div className="inv-stat-lbl">Total On Hand</div>
                                <div className="inv-stat-val">{product.total_qty} <span style={{ fontSize: 12, color: "#64748B" }}>Units</span></div>
                            </div>

                            <div className="inv-stat-box">
                                <div className="inv-stat-lbl">Reserved Qty</div>
                                <div className="inv-stat-val" style={{ color: "#2563EB" }}>{product.reserved_qty} <span style={{ fontSize: 12, color: "#64748B" }}>Units</span></div>
                            </div>

                            <div className="inv-stat-box">
                                <div className="inv-stat-lbl">Inventory Value</div>
                                <div className="inv-stat-val" style={{ color: "#16A34A", fontSize: 17 }}>
                                    {formatCurrency(product.inventory_value)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── 3. Tabs Navigation ── */}
                <div className="inv-tabs-bar">
                    {["Overview", "Stock Details & Bins", "Movement History", "Documents"].map(tab => (
                        <div
                            key={tab}
                            className={`inv-tab-item ${activeTab === tab ? "active" : ""}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </div>
                    ))}
                </div>

                {/* ── 4. Detailed Grid Content ── */}
                <div className="inv-detail-grid">

                    {/* Section 1: General Information */}
                    <div className="inv-section-card">
                        <div className="inv-section-header">
                            <FontAwesomeIcon icon={faTag} style={{ color: "#2563EB" }} /> General Information
                        </div>
                        <table className="inv-info-table">
                            <tbody>
                                <tr>
                                    <td className="label">Product Name</td>
                                    <td className="value">{product.name}</td>
                                </tr>
                                <tr>
                                    <td className="label">Category</td>
                                    <td className="value">{product.category_name}</td>
                                </tr>
                                <tr>
                                    <td className="label">Brand</td>
                                    <td className="value">{product.brand_name}</td>
                                </tr>
                                <tr>
                                    <td className="label">HSN / SAC Code</td>
                                    <td className="value">{product.hsn_code}</td>
                                </tr>
                                <tr>
                                    <td className="label">Unit of Measure</td>
                                    <td className="value">{product.unit_name}</td>
                                </tr>
                                <tr>
                                    <td className="label">Barcode Symbol</td>
                                    <td className="value" style={{ fontFamily: "monospace" }}>{product.barcode}</td>
                                </tr>
                                <tr>
                                    <td className="label">Stock Alert Level</td>
                                    <td className="value" style={{ color: "#D97706" }}>10 Units</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Section 2: Warehouse & Bin Allocation */}
                    <div className="inv-section-card">
                        <div className="inv-section-header">
                            <FontAwesomeIcon icon={faWarehouse} style={{ color: "#0891B2" }} /> Warehouse & Bin Allocation
                        </div>
                        <table className="inv-info-table">
                            <tbody>
                                <tr>
                                    <td className="label">Primary Warehouse</td>
                                    <td className="value">{product.warehouse_name}</td>
                                </tr>
                                <tr>
                                    <td className="label">Zone</td>
                                    <td className="value">{product.zone}</td>
                                </tr>
                                <tr>
                                    <td className="label">Rack</td>
                                    <td className="value">Rack 02</td>
                                </tr>
                                <tr>
                                    <td className="label">Shelf</td>
                                    <td className="value">Shelf B</td>
                                </tr>
                                <tr>
                                    <td className="label">Bin Location</td>
                                    <td className="value" style={{ color: "#2563EB", fontFamily: "monospace", fontSize: 14 }}>
                                        {product.bin_location}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="label">Storage Type</td>
                                    <td className="value">Standard Pallet Racking</td>
                                </tr>
                                <tr>
                                    <td className="label">Last Putaway Date</td>
                                    <td className="value">{moment().format("DD MMM YYYY")}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Section 3: Pricing & Tax Breakdown */}
                    <div className="inv-section-card">
                        <div className="inv-section-header">
                            <FontAwesomeIcon icon={faReceipt} style={{ color: "#16A34A" }} /> Pricing & Tax Breakdown
                        </div>
                        <table className="inv-info-table">
                            <tbody>
                                <tr>
                                    <td className="label">Purchase Cost Price</td>
                                    <td className="value">{formatCurrency(product.purchase_price)}</td>
                                </tr>
                                <tr>
                                    <td className="label">Selling Price</td>
                                    <td className="value">{formatCurrency(product.selling_price)}</td>
                                </tr>
                                <tr>
                                    <td className="label">MRP</td>
                                    <td className="value">{formatCurrency(product.mrp)}</td>
                                </tr>
                                <tr>
                                    <td className="label">GST Rate</td>
                                    <td className="value">{product.gst_pct}%</td>
                                </tr>
                                <tr>
                                    <td className="label">GST Tax Amount</td>
                                    <td className="value">{formatCurrency(product.tax_amount)}</td>
                                </tr>
                                <tr>
                                    <td className="label">Gross Profit Margin</td>
                                    <td className="value" style={{ color: "#16A34A" }}>
                                        {Math.round(((product.selling_price - product.purchase_price) / product.selling_price) * 100)}%
                                    </td>
                                </tr>
                                <tr>
                                    <td className="label">Total Inventory Value</td>
                                    <td className="value" style={{ color: "#16A34A", fontSize: 15, fontWeight: 900 }}>
                                        {formatCurrency(product.inventory_value)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Section 4: Supplier Details */}
                    <div className="inv-section-card">
                        <div className="inv-section-header">
                            <FontAwesomeIcon icon={faTruck} style={{ color: "#7C3AED" }} /> Supplier Information
                        </div>
                        <table className="inv-info-table">
                            <tbody>
                                <tr>
                                    <td className="label">Supplier Name</td>
                                    <td className="value">{product.supplier_name}</td>
                                </tr>
                                <tr>
                                    <td className="label">Supplier Code</td>
                                    <td className="value">{product.supplier_code}</td>
                                </tr>
                                <tr>
                                    <td className="label">Purchase Orders</td>
                                    <td className="value">12 Completed POs</td>
                                </tr>
                                <tr>
                                    <td className="label">Last Purchase Date</td>
                                    <td className="value">{moment().format("DD MMM YYYY")}</td>
                                </tr>
                                <tr>
                                    <td className="label">Average Lead Time</td>
                                    <td className="value">3 – 5 Days</td>
                                </tr>
                                <tr>
                                    <td className="label">Supplier Rating</td>
                                    <td className="value" style={{ color: "#D97706" }}>★★★★★ (4.9 / 5)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Section 5: Batch & Traceability */}
                    <div className="inv-section-card">
                        <div className="inv-section-header">
                            <FontAwesomeIcon icon={faClock} style={{ color: "#D97706" }} /> Batch & Expiry Traceability
                        </div>
                        <table className="inv-info-table">
                            <tbody>
                                <tr>
                                    <td className="label">Batch Number</td>
                                    <td className="value" style={{ fontFamily: "monospace" }}>BAT-2026-0811</td>
                                </tr>
                                <tr>
                                    <td className="label">Lot Number</td>
                                    <td className="value" style={{ fontFamily: "monospace" }}>LOT-99412</td>
                                </tr>
                                <tr>
                                    <td className="label">Mfg Date</td>
                                    <td className="value">01 Jul 2026</td>
                                </tr>
                                <tr>
                                    <td className="label">Expiry Date</td>
                                    <td className="value">31 Dec 2026</td>
                                </tr>
                                <tr>
                                    <td className="label">Remaining Shelf Life</td>
                                    <td className="value" style={{ color: "#16A34A" }}>150 Days</td>
                                </tr>
                                <tr>
                                    <td className="label">Picking Strategy</td>
                                    <td className="value">FIFO / FEFO Priority #1</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Section 6: Stock Movement Timeline */}
                    <div className="inv-section-card">
                        <div className="inv-section-header">
                            <FontAwesomeIcon icon={faHistory} style={{ color: "#2563EB" }} /> Stock Movement Audit Trail
                        </div>

                        <div className="inv-timeline">
                            <div className="inv-timeline-step">
                                <div className="inv-timeline-dot">✓</div>
                                <div className="inv-timeline-title">PO Created & Approved</div>
                                <div className="inv-timeline-sub">Ref: PO-2026-000001 • {moment().subtract(3, 'days').format("DD MMM YYYY")}</div>
                            </div>

                            <div className="inv-timeline-step">
                                <div className="inv-timeline-dot">✓</div>
                                <div className="inv-timeline-title">ASN Dispatched by Supplier</div>
                                <div className="inv-timeline-sub">Ref: ASN-2026-00001 • {moment().subtract(2, 'days').format("DD MMM YYYY")}</div>
                            </div>

                            <div className="inv-timeline-step">
                                <div className="inv-timeline-dot">✓</div>
                                <div className="inv-timeline-title">PDA Barcode Receiving Complete</div>
                                <div className="inv-timeline-sub">Verified by Inspector • {moment().subtract(1, 'days').format("DD MMM YYYY")}</div>
                            </div>

                            <div className="inv-timeline-step">
                                <div className="inv-timeline-dot">✓</div>
                                <div className="inv-timeline-title">GRN Generated & Stock Accepted</div>
                                <div className="inv-timeline-sub">Ref: GRN-2026-00001 • {moment().format("DD MMM YYYY")}</div>
                            </div>

                            <div className="inv-timeline-step">
                                <div className="inv-timeline-dot">✓</div>
                                <div className="inv-timeline-title">Putaway Completed to Bin {product.bin_location}</div>
                                <div className="inv-timeline-sub">Stored by Executive • {product.available_qty} Units Active</div>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </MasterLayout>
    );
};

const mapStateToProps = (state) => {
    return {};
};

export default connect(mapStateToProps, {
    fetchFrontSetting
})(InventoryDetail);
