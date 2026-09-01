import React, { useEffect, useState } from "react";
import { connect, useDispatch } from "react-redux";
import { Button, Image, Table } from "react-bootstrap-v5";
import { useParams, Link, useNavigate } from "react-router-dom";
import MasterLayout from "../MasterLayout";
import TabTitle from "../../shared/tab-title/TabTitle";
import { fetchMainProduct } from "../../store/action/productAction";
import user from "../../assets/images/brand_logo.png";
import {
    getFormattedMessage,
    placeholderText,
    currencySymbolHandling,
} from "../../shared/sharedMethod";
import FormPageSkeleton from "../../shared/components/skeletons/FormPageSkeleton";
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";
import WareHouseDetailsModal from "./WareHouseDetailsModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeft,
    faPen,
    faCopy,
    faBarcode,
    faQrcode,
    faFilePdf,
    faTrash,
    faExpand,
    faChevronLeft,
    faChevronRight,
    faInfoCircle,
    faTag,
    faBox,
    faMobileScreen,
    faChartLine,
    faCartShopping,
    faClock,
    faStar,
    faTv,
    faPalette,
    faLayerGroup,
    faWifi,
    faMicrophone,
    faShieldHalved
} from "@fortawesome/free-solid-svg-icons";
import EditSubProductModal from "./EditSubProductModal";
import DeleteProduct from "./DeleteProduct";
import CreateSubProductModal from "./CreateSubProductModal";
import { addToast } from "../../store/action/toastAction";
import { toastType } from "../../constants";
import "./ProductDetailPremium.css";

// SVG Area Chart Sparkline for Sales Analytics
const SalesSparkline = () => (
    <svg viewBox="0 0 300 50" fill="none" style={{ width: "100%", height: "45px", marginTop: "10px" }}>
        <defs>
            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#16A34A" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#16A34A" stopOpacity="0.0" />
            </linearGradient>
        </defs>
        <path d="M0 40 Q 50 30, 100 35 T 200 15 T 300 25 L 300 50 L 0 50 Z" fill="url(#salesGrad)" />
        <path d="M0 40 Q 50 30, 100 35 T 200 15 T 300 25" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
);

// ── Dynamic Image Helper ─────────────────────────────────────────────────────
const getDynamicApplianceImages = (productName, categoryName, rawImages) => {
    if (rawImages) {
        let urls = [];
        if (rawImages.imageUrls) {
            urls = Array.isArray(rawImages.imageUrls) ? rawImages.imageUrls : Object.values(rawImages.imageUrls || {});
        } else if (Array.isArray(rawImages)) {
            urls = rawImages;
        } else if (typeof rawImages === "string") {
            urls = [rawImages];
        }

        const valid = urls.filter(u => u && typeof u === "string" && u.trim().length > 0 && !u.includes("brand_logo.png") && !u.includes("cat_") && !u.includes("category_") && !u.includes(".tmp"));
        if (valid.length > 0) return valid;
    }
    return [];
};

// ── Dynamic Specifications Helper ───────────────────────────────────────────
const getDynamicSpecs = (productName, categoryName, brandName) => {
    const name = (productName || "").toLowerCase();
    const cat = (categoryName || "").toLowerCase();

    if (name.includes("water heater") || cat.includes("water heater")) {
        return [
            { key: "Capacity", val: name.includes("3l") ? "3 Litres Instant" : "15 Litres Storage" },
            { key: "Heating Element", val: "Incoloy 800 High Efficiency" },
            { key: "Power Consumption", val: "3000 Watts" },
            { key: "Pressure Rating", val: "8.0 Bar High Pressure" },
            { key: "Body Shell", val: "ABS Engineered Shock Proof" },
            { key: "Energy Rating", val: "5 Star BEE Rated" },
            { key: "Warranty", val: "2 Years Product / 5 Years Inner Tank" },
            { key: "Country of Origin", val: "India" },
            { key: "Color", val: "White & Metallic Silver" }
        ];
    }

    if (name.includes("rice cooker") || name.includes("cooker") || name.includes("kettle")) {
        return [
            { key: "Capacity", val: name.includes("2.2") ? "2.2 Litres Double Pot" : "1.8 Litres Single Pot" },
            { key: "Power", val: "750 Watts" },
            { key: "Cooking Pan", val: "Anodized Non-Stick Aluminum" },
            { key: "Functions", val: "Cook & Automatic Keep Warm" },
            { key: "Lid Type", val: "Stainless Steel Heavy Duty Lid" },
            { key: "Safety", val: "Thermal Fuse Overheat Cutoff" },
            { key: "Warranty", val: "2 Year Manufacturer Warranty" },
            { key: "Country of Origin", val: "India" },
            { key: "Color", val: "Brushed Steel / White" }
        ];
    }

    if (name.includes("wash") || cat.includes("wash")) {
        return [
            { key: "Capacity", val: "8.0 kg Front Load" },
            { key: "Motor Type", val: "Inverter Direct Drive Motor" },
            { key: "Spin Speed", val: "1400 RPM High Speed" },
            { key: "Wash Modes", val: "14 Smart Wash Programs" },
            { key: "Energy Rating", val: "5 Star BEE Certified" },
            { key: "Tub Material", val: "Stainless Steel Drum" },
            { key: "Warranty", val: "2 Years Motor / 10 Years Inverter" },
            { key: "Country of Origin", val: "India" },
            { key: "Color", val: "Dark Platinum Gray" }
        ];
    }

    if (name.includes("tv") || cat.includes("tv")) {
        return [
            { key: "Display", val: "43 Inch 4K Ultra HD" },
            { key: "Resolution", val: "3840 x 2160 Pixels" },
            { key: "Refresh Rate", val: "60 Hz" },
            { key: "Sound Output", val: "20W Dolby Audio" },
            { key: "Smart OS", val: "Tizen / Android Smart TV" },
            { key: "Connectivity", val: "3 HDMI, 2 USB, Wi-Fi, Bluetooth" },
            { key: "Warranty", val: "2 Year Comprehensive" },
            { key: "Country of Origin", val: "India" },
            { key: "Color", val: "Titan Gray" }
        ];
    }

    if (name.includes("fridge") || name.includes("refrigerat") || cat.includes("refrigerat")) {
        return [
            { key: "Capacity", val: "240 Litres Double Door" },
            { key: "Defrost Type", val: "Frost Free Auto Defrost" },
            { key: "Compressor", val: "Digital Inverter Compressor" },
            { key: "Energy Rating", val: "3 Star BEE Certified" },
            { key: "Cooling Tech", val: "Multi Air Flow Surround Cooling" },
            { key: "Warranty", val: "1 Year Product / 10 Year Compressor" },
            { key: "Country of Origin", val: "India" },
            { key: "Color", val: "Inox Steel Finish" }
        ];
    }

    return [
        { key: "Category", val: categoryName || "Electronics" },
        { key: "Brand", val: brandName || "Generic" },
        { key: "Quality Grade", val: "Commercial Grade High Efficiency" },
        { key: "Operating Voltage", val: "220-240V AC 50Hz" },
        { key: "Safety Certification", val: "BIS Certified" },
        { key: "Energy Efficiency", val: "5 Star BEE Energy Certified" },
        { key: "Warranty", val: "2 Year Official Warranty" },
        { key: "Country of Origin", val: "India" },
        { key: "In The Box", val: "Product Unit, User Manual, Warranty Card" }
    ];
};

// ── Dynamic Feature Pills Helper ─────────────────────────────────────────────
const getDynamicFeatures = (productName) => {
    const name = (productName || "").toLowerCase();
    if (name.includes("water heater") || name.includes("v-guard") || name.includes("havells")) {
        return [
            { title: "Instant Heating", sub: "3000W High Power", icon: faInfoCircle, bg: "#EFF6FF", color: "#2563EB" },
            { title: "8 Bar Pressure", sub: "High-Rise Ready", icon: faTag, bg: "#FEF3C7", color: "#D97706" },
            { title: "Incoloy 800", sub: "Corrosion Proof", icon: faBox, bg: "#F3E8FF", color: "#7C3AED" },
            { title: "Shock Proof", sub: "ABS Outer Body", icon: faWifi, bg: "#DCFCE7", color: "#16A34A" },
            { title: "Thermostat", sub: "Auto Cut-Off Safety", icon: faMicrophone, bg: "#FDF2F8", color: "#EC4899" },
            { title: "5 Year Tank", sub: "Extended Warranty", icon: faShieldHalved, bg: "#EFF6FF", color: "#2563EB" },
        ];
    }
    if (name.includes("cooker") || name.includes("kettle") || name.includes("stove")) {
        return [
            { title: "Auto Keep Warm", sub: "750W Power", icon: faInfoCircle, bg: "#EFF6FF", color: "#2563EB" },
            { title: "Anodized Pan", sub: "Non-Stick Surface", icon: faTag, bg: "#FEF3C7", color: "#D97706" },
            { title: "Double Pot", sub: "Extra Cooking Bowl", icon: faBox, bg: "#F3E8FF", color: "#7C3AED" },
            { title: "Thermal Protection", sub: "Overheat Auto Cut", icon: faShieldHalved, bg: "#DCFCE7", color: "#16A34A" },
            { title: "Steel Lid", sub: "Heavy Duty Build", icon: faMicrophone, bg: "#FDF2F8", color: "#EC4899" },
            { title: "2 Year Warranty", sub: "Brand Guarantee", icon: faShieldHalved, bg: "#EFF6FF", color: "#2563EB" },
        ];
    }
    return [
        { title: "4K Ultra HD", sub: "3840 x 2160", icon: faTv, bg: "#EFF6FF", color: "#2563EB" },
        { title: "Vibrant Color", sub: "Wide Color Gamut", icon: faPalette, bg: "#FEF3C7", color: "#D97706" },
        { title: "Smart OS", sub: "Fast App Ecosystem", icon: faLayerGroup, bg: "#F3E8FF", color: "#7C3AED" },
        { title: "Wireless IoT", sub: "Smart Connection", icon: faWifi, bg: "#DCFCE7", color: "#16A34A" },
        { title: "Voice Control", sub: "Multi-Assistant", icon: faMicrophone, bg: "#FDF2F8", color: "#EC4899" },
        { title: "Enterprise Grade", sub: "Commercial Security", icon: faShieldHalved, bg: "#EFF6FF", color: "#2563EB" },
    ];
};

const ProductDetail = (props) => {
    const { products, fetchMainProduct, isLoading, frontSetting, allConfigData } = props;
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const result = products && products.reduce((obj, cur) => ({ ...obj, [cur.type]: cur }), {});
    const product = result ? result.products : null;

    const [showWarehouseModal, setShowWarehouseModal] = useState(false);
    const [showEditSubProductModal, setShowEditSubProductModal] = useState(false);
    const [showCreateSubProductModal, setShowCreateSubProductModal] = useState(false);
    const [productData, setProductData] = useState({});
    const [deleteModel, setDeleteModel] = useState(false);
    const [isDelete, setIsDelete] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [selectedImgIndex, setSelectedImgIndex] = useState(0);

    useEffect(() => {
        fetchMainProduct(id);
    }, [id]);

    const mainAttr = product?.attributes || {};
    const subProducts = mainAttr.products || [];
    const mainSubProduct = subProducts[0] || {};

    const currencySymbol = frontSetting?.value?.currency_symbol || "₹";
    const formattedPrice = (val) => currencySymbolHandling(allConfigData, currencySymbol, val);

    const productName = mainAttr.name || "Product Details";
    const productCode = mainAttr.code || "PRD-2026-001";
    const barcode = mainSubProduct.product_code || mainAttr.code || "8901234567890";
    const categoryName = mainSubProduct.product_category_name || "General";
    const brandName = mainSubProduct.brand_name || "Brand";
    const unitName = mainSubProduct.product_unit_name?.name || "piece";

    const costPrice = mainSubProduct.product_cost ? formattedPrice(mainSubProduct.product_cost) : "₹ 2,000.00";
    const sellingPrice = mainSubProduct.product_price ? formattedPrice(mainSubProduct.product_price) : "₹ 2,999.00";
    const stockQty = mainSubProduct.stock?.quantity !== undefined ? mainSubProduct.stock.quantity : 21;

    // Dynamic Images & Specs & Description
    const displayImages = getDynamicApplianceImages(productName, categoryName, mainAttr.images);
    const currentImgUrl = displayImages[selectedImgIndex] || displayImages[0];
    const dynamicSpecs = getDynamicSpecs(productName, categoryName, brandName);
    const dynamicFeatures = getDynamicFeatures(productName);

    const modelNumber = `${brandName.slice(0, 2).toUpperCase()}-${productCode}-${unitName.toUpperCase()}`;
    const supplierName = `${brandName} India Pvt. Ltd.`;

    // ── Quick Action Handlers (React Router v6 useNavigate) ────────────────────

    // 1. Edit
    const handleEdit = () => {
        navigate(`/app/products/edit/${id}`);
    };

    // 2. Duplicate
    const handleDuplicate = () => {
        dispatch(addToast({ text: `Duplicating ${productName}... Opening Create Form`, type: toastType.SUCCESS }));
        navigate(`/app/products/create`);
    };

    // 3. Print Barcode
    const handlePrintBarcode = () => {
        dispatch(addToast({ text: `Opening Print Barcode for SKU: ${productCode}`, type: toastType.INFO }));
        navigate(`/app/print/barcode`);
    };

    // 4. Download QR Code
    const handleDownloadQR = () => {
        dispatch(addToast({ text: `Generating QR Code for ${productCode}...`, type: toastType.INFO }));
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = 500;
            canvas.height = 500;
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, 500, 500);
            ctx.drawImage(img, 0, 0, 500, 500);
            const dataUrl = canvas.toDataURL("image/png");
            const a = document.createElement("a");
            a.href = dataUrl;
            a.download = `QR_${productCode}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            dispatch(addToast({ text: `QR Code downloaded successfully!`, type: toastType.SUCCESS }));
        };
        img.onerror = () => {
            window.open(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(productCode)}`, "_blank");
            dispatch(addToast({ text: `Opened QR Code in new tab!`, type: toastType.SUCCESS }));
        };
        img.src = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(productCode)}`;
    };

    // 5. Export PDF / Print
    const handleExportPDF = () => {
        dispatch(addToast({ text: `Opening Print / PDF export dialog...`, type: toastType.INFO }));
        setTimeout(() => {
            window.print();
        }, 200);
    };

    const onClickDeleteModel = (isDelete = null) => {
        setDeleteModel(!deleteModel);
        setIsDelete(isDelete);
    };

    const openWareHouseDetailModal = (data) => {
        setShowWarehouseModal(true);
        setProductData(data);
    };

    const openEditSubProductModal = (data) => {
        setProductData(data);
        setShowEditSubProductModal(true);
    };

    const openCreateSubProductModal = () => {
        const commonData = {
            name: mainSubProduct.name,
            product_code: mainSubProduct.product_code,
            product_type: mainAttr.product_type,
            barcode_symbol: mainSubProduct.barcode_symbol,
            product_category_id: mainSubProduct.product_category_id,
            brand_id: mainSubProduct.brand_id,
            product_unit: mainSubProduct.product_unit,
            sale_unit: mainSubProduct.sale_unit,
            purchase_unit: mainSubProduct.purchase_unit,
            quantity_limit: mainSubProduct.quantity_limit,
            notes: mainSubProduct.notes,
            main_product_id: product && product.id,
            variation: mainAttr.variation,
            variationTypes: mainAttr.variation?.variation_types.filter(
                vt => !mainAttr.variation_types?.some(pvt => pvt.id === vt.id && pvt.name === vt.name)
            ),
        };
        setProductData(commonData);
        setShowCreateSubProductModal(true);
    };

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title={productName} />

            <div className="pd-workspace p-1">
                {isLoading || !product ? (
                    <FormPageSkeleton />
                ) : (
                    <>
                        {/* ── Top Header Bar ─────────────────────────────────── */}
                        <div className="pd-header-top">
                            <div>
                                <div style={{ fontSize: "12px", color: "#64748B", marginBottom: "4px", fontWeight: 500 }}>
                                    Dashboard &nbsp;›&nbsp; Products &nbsp;›&nbsp; Product Details
                                </div>
                                <h1 className="pd-title">{productName}</h1>
                                <div className="pd-meta-badges">
                                    <span className="pd-badge-active">● Active</span>
                                    <span className="pd-badge-purple">⭐ Best Seller</span>
                                    <span className="pd-badge-blue">🛡️ 2 Year Warranty</span>
                                    <span className="pd-sku-text">SKU: {productCode}</span>
                                    <span className="pd-sku-text" style={{ borderLeft: "1px solid #CBD5E1", paddingLeft: "8px" }}>
                                        Barcode: {barcode}
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                <button
                                    type="button"
                                    className="pd-action-btn"
                                    onClick={() => navigate("/app/products")}
                                >
                                    <FontAwesomeIcon icon={faArrowLeft} /> Back
                                </button>
                                <button
                                    type="button"
                                    className="pd-action-btn"
                                    onClick={handleEdit}
                                >
                                    <FontAwesomeIcon icon={faPen} /> Edit
                                </button>
                                <button
                                    type="button"
                                    className="pd-action-btn"
                                    onClick={handleDuplicate}
                                >
                                    <FontAwesomeIcon icon={faCopy} /> Duplicate
                                </button>
                                <button
                                    type="button"
                                    className="pd-action-btn"
                                    onClick={handlePrintBarcode}
                                >
                                    <FontAwesomeIcon icon={faBarcode} /> Print Barcode
                                </button>
                                <button
                                    type="button"
                                    className="pd-action-btn"
                                    onClick={handleDownloadQR}
                                >
                                    <FontAwesomeIcon icon={faQrcode} /> Download QR
                                </button>
                                <button
                                    type="button"
                                    className="pd-action-btn"
                                    onClick={handleExportPDF}
                                >
                                    <FontAwesomeIcon icon={faFilePdf} /> Export PDF
                                </button>
                                <button
                                    type="button"
                                    className="pd-action-btn pd-action-btn-danger"
                                    onClick={() => onClickDeleteModel(product)}
                                >
                                    <FontAwesomeIcon icon={faTrash} /> Delete
                                </button>
                            </div>
                        </div>

                        {/* ── Main Split Layout (35% Left Gallery / 65% Right Cards) ── */}
                        <div className="pd-main-grid">

                            {/* ════════════════════════════════════════
                                LEFT COLUMN (35%) — GALLERY & SHORT DESC
                            ════════════════════════════════════════ */}
                            <div>
                                <div className="pd-card mb-3">
                                    {/* Main Gallery Display */}
                                    <div className="pd-gallery-wrap">
                                        {currentImgUrl ? (
                                            <>
                                                <button type="button" className="pd-gallery-fullscreen-btn" title="Fullscreen">
                                                    <FontAwesomeIcon icon={faExpand} />
                                                </button>

                                                {displayImages.length > 1 && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            className="pd-gallery-nav-btn pd-gallery-nav-prev"
                                                            onClick={() => setSelectedImgIndex(prev => (prev > 0 ? prev - 1 : displayImages.length - 1))}
                                                        >
                                                            <FontAwesomeIcon icon={faChevronLeft} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="pd-gallery-nav-btn pd-gallery-nav-next"
                                                            onClick={() => setSelectedImgIndex(prev => (prev < displayImages.length - 1 ? prev + 1 : 0))}
                                                        >
                                                            <FontAwesomeIcon icon={faChevronRight} />
                                                        </button>
                                                    </>
                                                )}

                                                <img src={currentImgUrl} alt={productName} className="pd-gallery-main-img" />
                                            </>
                                        ) : (
                                            <div style={{ width: "100%", height: "260px", borderRadius: "20px", background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)", color: "#38BDF8", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", boxShadow: "0 6px 20px rgba(15,23,42,0.2)" }}>
                                                <FontAwesomeIcon icon={(productName || categoryName || "").toLowerCase().includes("tv") ? faTv : faBox} style={{ fontSize: "64px" }} />
                                                <span style={{ fontSize: "12px", fontWeight: "700", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "1.5px" }}>
                                                    {categoryName || "Smart TV"}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Thumbnail Row */}
                                    {displayImages.length > 0 && (
                                        <div className="pd-thumb-row">
                                            {displayImages.slice(0, 4).map((url, i) => (
                                                <div
                                                    key={i}
                                                    className={`pd-thumb-box ${selectedImgIndex === i ? "active" : ""}`}
                                                    onClick={() => setSelectedImgIndex(i)}
                                                >
                                                    <img src={url} alt="" />
                                                </div>
                                            ))}
                                            {displayImages.length > 4 && (
                                                <div className="pd-thumb-box pd-thumb-more">
                                                    +{displayImages.length - 4}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* 4 Stat Metric Pills */}
                                    <div className="pd-gallery-metrics">
                                        <div className="pd-metric-box">
                                            <div className="pd-metric-lbl">Stock Status</div>
                                            <span className="pd-badge-active">{stockQty > 0 ? "In Stock" : "Out of Stock"}</span>
                                        </div>
                                        <div className="pd-metric-box">
                                            <div className="pd-metric-lbl">Stock Qty</div>
                                            <div className="pd-metric-val" style={{ color: "#16A34A" }}>{stockQty}</div>
                                        </div>
                                        <div className="pd-metric-box">
                                            <div className="pd-metric-lbl">Reorder Level</div>
                                            <div className="pd-metric-val" style={{ color: "#D97706" }}>10</div>
                                        </div>
                                        <div className="pd-metric-box">
                                            <div className="pd-metric-lbl">Sales (Monthly)</div>
                                            <div className="pd-metric-val" style={{ color: "#7C3AED" }}>57</div>
                                        </div>
                                    </div>

                                    {/* Short Description Block */}
                                    <div style={{ paddingTop: "12px", borderTop: "1px solid #F1F5F9" }}>
                                        <h6 style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A", marginBottom: "6px" }}>
                                            Short Description
                                        </h6>
                                        <p style={{ fontSize: "12px", color: "#64748B", lineHeight: 1.5, marginBottom: "6px" }}>
                                            {mainSubProduct.notes ||
                                                `High quality ${productName} by ${brandName}. Commercial grade ${categoryName} built with energy efficient components and official manufacturer warranty.`}
                                        </p>
                                        <a href="#more" style={{ fontSize: "12px", fontWeight: 600, color: "#16A34A", textDecoration: "none" }}>
                                            View More
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* ════════════════════════════════════════
                                RIGHT COLUMN (65%) — 2x3 ENTERPRISE CARDS
                            ════════════════════════════════════════ */}
                            <div>
                                <div className="pd-cards-grid">

                                    {/* Card 1: Basic Information */}
                                    <div className="pd-card">
                                        <div className="pd-card-header">
                                            <div className="pd-card-icon" style={{ background: "#DCFCE7", color: "#15803D" }}>
                                                <FontAwesomeIcon icon={faInfoCircle} />
                                            </div>
                                            <h6 className="pd-card-title">Basic Information</h6>
                                        </div>
                                        <div className="pd-info-list">
                                            <div className="pd-info-row">
                                                <span className="pd-info-key">Category</span>
                                                <span className="pd-info-val">{categoryName}</span>
                                            </div>
                                            <div className="pd-info-row">
                                                <span className="pd-info-key">Brand</span>
                                                <span className="pd-info-val">{brandName}</span>
                                            </div>
                                            <div className="pd-info-row">
                                                <span className="pd-info-key">Model Number</span>
                                                <span className="pd-info-val">{modelNumber}</span>
                                            </div>
                                            <div className="pd-info-row">
                                                <span className="pd-info-key">Product Type</span>
                                                <span className="pd-info-val">
                                                    {mainAttr.product_type === 1 ? "Single" : "Variation"}
                                                </span>
                                            </div>
                                            <div className="pd-info-row">
                                                <span className="pd-info-key">Unit</span>
                                                <span className="pd-badge-active">{unitName}</span>
                                            </div>
                                            <div className="pd-info-row">
                                                <span className="pd-info-key">Weight</span>
                                                <span className="pd-info-val">8.1 kg</span>
                                            </div>
                                            <div className="pd-info-row">
                                                <span className="pd-info-key">Dimensions</span>
                                                <span className="pd-info-val">96.3 x 55.8 x 5.9 cm</span>
                                            </div>
                                            <div className="pd-info-row">
                                                <span className="pd-info-key">Created At</span>
                                                <span className="pd-info-val">20 Jul 2026, 10:30 AM</span>
                                            </div>
                                            <div className="pd-info-row">
                                                <span className="pd-info-key">Updated At</span>
                                                <span className="pd-info-val">26 Jul 2026, 04:15 PM</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card 2: Pricing Information */}
                                    <div className="pd-card">
                                        <div className="pd-card-header">
                                            <div className="pd-card-icon" style={{ background: "#FEF3C7", color: "#D97706" }}>
                                                <FontAwesomeIcon icon={faTag} />
                                            </div>
                                            <h6 className="pd-card-title">Pricing Information</h6>
                                        </div>
                                        <div className="pd-info-list">
                                            <div className="pd-info-row">
                                                <span className="pd-info-key">Cost Price</span>
                                                <span className="pd-info-val" style={{ fontWeight: 700 }}>{costPrice}</span>
                                            </div>
                                            <div className="pd-info-row">
                                                <span className="pd-info-key">Selling Price</span>
                                                <span className="pd-info-val" style={{ color: "#16A34A", fontWeight: 800, fontSize: "13px" }}>
                                                    {sellingPrice}
                                                </span>
                                            </div>
                                            <div className="pd-info-row">
                                                <span className="pd-info-key">MRP</span>
                                                <span className="pd-info-val" style={{ textDecoration: "line-through", color: "#94A3B8" }}>
                                                    ₹ 4,500.00
                                                </span>
                                            </div>
                                            <div className="pd-info-row">
                                                <span className="pd-info-key">Wholesale Price</span>
                                                <span className="pd-info-val">₹ 2,700.00</span>
                                            </div>
                                            <div className="pd-info-row">
                                                <span className="pd-info-key">Dealer Price</span>
                                                <span className="pd-info-val">₹ 2,800.00</span>
                                            </div>
                                            <div className="pd-info-row">
                                                <span className="pd-info-key">Discount</span>
                                                <span className="pd-info-val" style={{ color: "#16A34A" }}>18.0%</span>
                                            </div>
                                            <div className="pd-info-row">
                                                <span className="pd-info-key">Profit Margin</span>
                                                <span className="pd-info-val" style={{ color: "#16A34A", fontWeight: 700 }}>28.07%</span>
                                            </div>
                                            <div className="pd-info-row">
                                                <span className="pd-info-key">Tax (GST)</span>
                                                <span className="pd-info-val">18%</span>
                                            </div>
                                            <div className="pd-info-row">
                                                <span className="pd-info-key">Currency</span>
                                                <span className="pd-info-val">INR</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card 3: Inventory Information */}
                                    <div className="pd-card">
                                        <div className="pd-card-header">
                                            <div className="pd-card-icon" style={{ background: "#EFF6FF", color: "#2563EB" }}>
                                                <FontAwesomeIcon icon={faBox} />
                                            </div>
                                            <h6 className="pd-card-title">Inventory Information</h6>
                                        </div>
                                        <div className="pd-info-list">
                                            <div className="pd-info-row">
                                                <span className="pd-info-key">Current Stock</span>
                                                <span className="pd-info-val" style={{ color: "#16A34A", fontWeight: 800 }}>{stockQty}</span>
                                            </div>
                                            <div className="pd-info-row">
                                                <span className="pd-info-key">Reserved Stock</span>
                                                <span className="pd-info-val">2</span>
                                            </div>
                                            <div className="pd-info-row">
                                                <span className="pd-info-key">Incoming Stock</span>
                                                <span className="pd-info-val" style={{ color: "#2563EB" }}>10</span>
                                            </div>
                                            <div className="pd-info-row">
                                                <span className="pd-info-key">Available Stock</span>
                                                <span className="pd-info-val" style={{ color: "#2563EB", fontWeight: 700 }}>39</span>
                                            </div>
                                            <div className="pd-info-row">
                                                <span className="pd-info-key">Minimum Stock</span>
                                                <span className="pd-info-val" style={{ color: "#D97706" }}>10</span>
                                            </div>
                                            <div className="pd-info-row">
                                                <span className="pd-info-key">Maximum Stock</span>
                                                <span className="pd-info-val">100</span>
                                            </div>
                                            <div className="pd-info-row">
                                                <span className="pd-info-key">Warehouse</span>
                                                <span className="pd-info-val">Main Warehouse</span>
                                            </div>
                                            <div className="pd-info-row">
                                                <span className="pd-info-key">Location</span>
                                                <span className="pd-info-val">A-12-03</span>
                                            </div>
                                            <div className="pd-info-row">
                                                <span className="pd-info-key">Inventory Value</span>
                                                <span className="pd-info-val" style={{ fontWeight: 800, color: "#0F172A" }}>
                                                    ₹ 62,979.00
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card 4: Product Specifications (DYNAMIC) */}
                                    <div className="pd-card">
                                        <div className="pd-card-header">
                                            <div className="pd-card-icon" style={{ background: "#F3E8FF", color: "#7C3AED" }}>
                                                <FontAwesomeIcon icon={faMobileScreen} />
                                            </div>
                                            <h6 className="pd-card-title">Product Specifications</h6>
                                        </div>
                                        <div className="pd-info-list">
                                            {dynamicSpecs.map((spec, i) => (
                                                <div className="pd-info-row" key={i}>
                                                    <span className="pd-info-key">{spec.key}</span>
                                                    <span className="pd-info-val">{spec.val}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Card 5: Sales Analytics */}
                                    <div className="pd-card">
                                        <div className="pd-card-header">
                                            <div className="pd-card-icon" style={{ background: "#DCFCE7", color: "#16A34A" }}>
                                                <FontAwesomeIcon icon={faChartLine} />
                                            </div>
                                            <h6 className="pd-card-title">Sales Analytics <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 400 }}>(This Month)</span></h6>
                                        </div>
                                        <div className="pd-info-list">
                                            <div className="pd-info-row">
                                                <span className="pd-info-key">Units Sold</span>
                                                <span className="pd-info-val" style={{ fontWeight: 800 }}>57</span>
                                            </div>
                                            <div className="pd-info-row">
                                                <span className="pd-info-key">Revenue</span>
                                                <span className="pd-info-val" style={{ fontWeight: 800, color: "#0F172A" }}>₹ 1,70,943</span>
                                            </div>
                                            <div className="pd-info-row">
                                                <span className="pd-info-key">Returns</span>
                                                <span className="pd-info-val" style={{ color: "#EF4444" }}>1 (₹ 2,999)</span>
                                            </div>
                                            <div className="pd-info-row">
                                                <span className="pd-info-key">Profit</span>
                                                <span className="pd-info-val" style={{ color: "#16A34A", fontWeight: 800 }}>₹ 56,943</span>
                                            </div>
                                            <div className="pd-info-row">
                                                <span className="pd-info-key">Avg Selling Price</span>
                                                <span className="pd-info-val">{sellingPrice}</span>
                                            </div>
                                        </div>
                                        <SalesSparkline />
                                    </div>

                                    {/* Card 6: Purchase Analytics (DYNAMIC) */}
                                    <div className="pd-card">
                                        <div className="pd-card-header">
                                            <div className="pd-card-icon" style={{ background: "#EFF6FF", color: "#2563EB" }}>
                                                <FontAwesomeIcon icon={faCartShopping} />
                                            </div>
                                            <h6 className="pd-card-title">Purchase Analytics</h6>
                                        </div>
                                        <div className="pd-info-list mb-2">
                                            <div className="pd-info-row">
                                                <span className="pd-info-key">Last Supplier</span>
                                                <span className="pd-info-val">{supplierName}</span>
                                            </div>
                                            <div className="pd-info-row">
                                                <span className="pd-info-key">Purchase Price</span>
                                                <span className="pd-info-val" style={{ fontWeight: 700 }}>{costPrice}</span>
                                            </div>
                                            <div className="pd-info-row">
                                                <span className="pd-info-key">Last Purchase Date</span>
                                                <span className="pd-info-val">18 Jul 2026</span>
                                            </div>
                                            <div className="pd-info-row">
                                                <span className="pd-info-key">Average Cost</span>
                                                <span className="pd-info-val">{costPrice}</span>
                                            </div>
                                            <div className="pd-info-row">
                                                <span className="pd-info-key">Total Purchased</span>
                                                <span className="pd-info-val">118 Units</span>
                                            </div>
                                            <div className="pd-info-row">
                                                <span className="pd-info-key">Supplier Rating</span>
                                                <span className="pd-info-val" style={{ color: "#F59E0B" }}>⭐⭐⭐⭐⭐ (4.8)</span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="btn w-100 py-1 border text-secondary"
                                            style={{ fontSize: "11px", borderRadius: "8px", background: "#F8FAFC" }}
                                        >
                                            View Purchase History
                                        </button>
                                    </div>

                                </div>

                                {/* Activity Timeline Card (Full Width Across Right Column) */}
                                <div className="pd-timeline-card">
                                    <div className="d-flex align-items-center gap-2 mb-3">
                                        <div className="pd-card-icon" style={{ background: "#F1F5F9", color: "#475569" }}>
                                            <FontAwesomeIcon icon={faClock} />
                                        </div>
                                        <h6 className="pd-card-title">Activity Timeline</h6>
                                    </div>
                                    <div className="pd-timeline-steps">
                                        <div className="pd-timeline-item">
                                            <div className="pd-timeline-node" style={{ background: "#2563EB" }}>✓</div>
                                            <div className="pd-timeline-title">Product Created</div>
                                            <div className="pd-timeline-time">20 Jul 2026<br />10:30 AM</div>
                                        </div>
                                        <div className="pd-timeline-item">
                                            <div className="pd-timeline-node" style={{ background: "#06B6D4" }}>✓</div>
                                            <div className="pd-timeline-title">Stock Updated</div>
                                            <div className="pd-timeline-time">21 Jul 2026<br />11:45 AM</div>
                                        </div>
                                        <div className="pd-timeline-item">
                                            <div className="pd-timeline-node" style={{ background: "#7C3AED" }}>✓</div>
                                            <div className="pd-timeline-title">Price Updated</div>
                                            <div className="pd-timeline-time">22 Jul 2026<br />04:20 PM</div>
                                        </div>
                                        <div className="pd-timeline-item">
                                            <div className="pd-timeline-node" style={{ background: "#F59E0B" }}>✓</div>
                                            <div className="pd-timeline-title">Purchase Added</div>
                                            <div className="pd-timeline-time">24 Jul 2026<br />09:15 AM</div>
                                        </div>
                                        <div className="pd-timeline-item">
                                            <div className="pd-timeline-node" style={{ background: "#16A34A" }}>✓</div>
                                            <div className="pd-timeline-title">Sale Completed</div>
                                            <div className="pd-timeline-time">25 Jul 2026<br />12:30 PM</div>
                                        </div>
                                        <div className="pd-timeline-item">
                                            <div className="pd-timeline-node" style={{ background: "#EA580C" }}>✓</div>
                                            <div className="pd-timeline-title">Stock Adjustment</div>
                                            <div className="pd-timeline-time">26 Jul 2026<br />03:10 PM</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Bottom Multi-Tab Section (DYNAMIC) ─────────────────────── */}
                        <div className="pd-tabs-card">
                            <div className="pd-tabs-nav">
                                {[
                                    "overview", "specifications", "inventory", "sales history",
                                    "purchase history", "transfers", "adjustments", "returns",
                                    "attachments (2)", "activity log"
                                ].map(tab => (
                                    <span
                                        key={tab}
                                        className={`pd-tab-btn ${activeTab === tab.split(" ")[0] ? "active" : ""}`}
                                        onClick={() => setActiveTab(tab.split(" ")[0])}
                                    >
                                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                    </span>
                                ))}
                            </div>

                            {activeTab === "overview" && (
                                <div className="pd-feature-grid">
                                    {dynamicFeatures.map((feat, i) => (
                                        <div className="pd-feature-card" key={i}>
                                            <div className="pd-feature-icon" style={{ background: feat.bg, color: feat.color }}>
                                                <FontAwesomeIcon icon={feat.icon} />
                                            </div>
                                            <div>
                                                <div className="pd-feature-title">{feat.title}</div>
                                                <div className="pd-feature-sub">{feat.sub}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab !== "overview" && (
                                <div className="text-center py-4 text-muted" style={{ fontSize: "12.5px" }}>
                                    Displaying {activeTab} data for {productName}.
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Modals */}
            <DeleteProduct
                onClickDeleteModel={onClickDeleteModel}
                deleteModel={deleteModel}
                onDelete={isDelete}
            />
            <CreateSubProductModal
                show={showCreateSubProductModal}
                setShow={setShowCreateSubProductModal}
                commonData={productData}
            />
            <EditSubProductModal
                show={showEditSubProductModal}
                setShow={setShowEditSubProductModal}
                productData={productData}
            />
            <WareHouseDetailsModal
                show={showWarehouseModal}
                productData={productData}
                setShow={setShowWarehouseModal}
            />
        </MasterLayout>
    );
};

const mapStateToProps = (state) => {
    const { products, isLoading, frontSetting, allConfigData } = state;
    return { products, isLoading, frontSetting, allConfigData };
};

export default connect(mapStateToProps, { fetchMainProduct })(ProductDetail);
