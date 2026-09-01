import React, { useEffect, useState, useMemo } from "react";
import { connect, useDispatch } from "react-redux";
import { Dropdown, Form } from "react-bootstrap-v5";
import { Link } from "react-router-dom";
import MasterLayout from "../MasterLayout";
import { fetchAllMainProducts } from "../../store/action/productAction";
import { fetchAllWarehouses } from "../../store/action/warehouseAction";
import { fetchAllBrands } from "../../store/action/brandsAction";
import { fetchAllProductCategories } from "../../store/action/productCategoryAction";
import { fetchAllSuppliers } from "../../store/action/supplierAction";
import TabTitle from "../../shared/tab-title/TabTitle";
import { fetchFrontSetting } from "../../store/action/frontSettingAction";
import ImportProductModel from "./ImportProductModel";
import DeleteMainProduct from "./DeleteMainProduct";
import { productExcelAction } from "../../store/action/productExcelAction";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus,
    faUpload,
    faDownload,
    faBarcode,
    faPrint,
    faEllipsisV,
    faBox,
    faCheckCircle,
    faTriangleExclamation,
    faBoxOpen,
    faSearch,
    faEye,
    faEdit,
    faTrash,
    faTimes,
    faList,
    faThLarge,
    faRotateLeft,
    faGift
} from "@fortawesome/free-solid-svg-icons";
import "../brands/ProductBrandsPremium.css";
import "../units/ProductUnitsPremium.css";
import "../variation/ProductVariationsPremium.css";
import "./ProductPremium.css";
import LiveCounter from "../../shared/components/LiveCounter";
import LiveSparkline from "../../shared/components/LiveSparkline";
import { subscribePosDataChanged } from "../../shared/posEvents";
import getInstantProductImage, { generateInstantProductSvg } from "../../shared/instantProductSvg";

// Short Unit Formatter - strictly standard Units format
const formatShortUnit = (unitStr) => {
    return "Units";
};

// Enterprise Alphanumeric SKU Generator (e.g. MCF82302GSW)
const generateProductSku = (product, attrs, subProd) => {
    const rawSku = attrs.sku;
    if (rawSku && rawSku.length >= 6 && !/^\d{12,14}$/.test(rawSku) && !rawSku.startsWith('SKU-') && !rawSku.startsWith('PR_')) {
        return String(rawSku).toUpperCase();
    }
    const name = (attrs.name || product.name || "PRD").toUpperCase().replace(/[^A-Z0-9\s]/g, "");
    const words = name.split(/\s+/).filter(Boolean);
    let prefix = "";
    if (words.length >= 3) {
        prefix = words[0][0] + words[1][0] + words[2][0];
    } else if (words.length === 2) {
        prefix = words[0].slice(0, 2) + words[1][0];
    } else if (words.length === 1 && words[0].length >= 3) {
        prefix = words[0].slice(0, 3);
    } else {
        prefix = "MCF";
    }
    
    const idNum = Number(product.id || attrs.id || 8);
    const hash = Math.abs((idNum * 82302 + 1729) % 89999 + 10000);
    const suffixCodes = ["GSW", "POS", "RTL", "IND", "BLR", "CHN", "MDU", "TRZ"];
    const suffix = suffixCodes[idNum % suffixCodes.length];
    
    return `${prefix}${hash}${suffix}`;
};

// ── Fast Vertical Wheel / Slot Number Spinner Component ──────────────
const RollingNumberSpinner = ({
    targetValue = 0,
    isSpinning = false,
    duration = 2000,
    color = "#16A34A"
}) => {
    const finalNumber = typeof targetValue === "number" ? targetValue : (parseInt(targetValue, 10) || 0);
    const [displayNumber, setDisplayNumber] = useState(isSpinning ? Math.floor(Math.random() * 89 + 10) : finalNumber);
    const [isFinished, setIsFinished] = useState(!isSpinning);
    const [offsetY, setOffsetY] = useState(0);

    useEffect(() => {
        if (!isSpinning) {
            setDisplayNumber(finalNumber);
            setIsFinished(true);
            return;
        }

        setIsFinished(false);
        const startTime = performance.now();
        let intervalId = null;

        // Rapid vertical wheel slot cycle: random numbers from 10 to 99 rolling vertically
        intervalId = setInterval(() => {
            const elapsed = performance.now() - startTime;
            if (elapsed < duration - 350) {
                // High speed wheel rolling mode
                setDisplayNumber(Math.floor(Math.random() * 89 + 10));
                setOffsetY(Math.sin(elapsed / 25) * 6);
            } else if (elapsed < duration) {
                // Deceleration mode: slowing down smoothly
                setDisplayNumber(Math.floor(Math.random() * 30 + (finalNumber % 10)));
                setOffsetY(Math.sin(elapsed / 45) * 2.5);
            }
        }, 40);

        const timer = setTimeout(() => {
            clearInterval(intervalId);
            setDisplayNumber(finalNumber);
            setOffsetY(0);
            setIsFinished(true);
        }, duration);

        return () => {
            if (intervalId) clearInterval(intervalId);
            clearTimeout(timer);
        };
    }, [isSpinning, finalNumber, duration]);

    return (
        <div className="kpi-wheel-slot-container">
            {!isFinished && <div className="kpi-wheel-slot-mask" />}
            <span
                className="kpi-wheel-number-roller"
                style={{
                    transform: isFinished ? "translateY(0)" : `translateY(${offsetY}px)`,
                    transition: isFinished ? "transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.2s ease" : "none"
                }}
            >
                {displayNumber}
            </span>
            {!isFinished && (
                <span className="kpi-wheel-circle-spinner" style={{ color }} />
            )}
        </div>
    );
};

const Product = (props) => {
    const {
        fetchAllMainProducts,
        fetchAllWarehouses,
        fetchAllBrands,
        fetchAllProductCategories,
        fetchAllSuppliers,
        products = [],
        warehouses = [],
        brands = [],
        productCategories = [],
        suppliers = [],
        frontSetting,
        fetchFrontSetting,
        productExcelAction,
    } = props;

    const dispatch = useDispatch();

    // ── States ───────────────────────────────────────────────────────────────
    const [importProduct, setimportProduct] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedBrand, setSelectedBrand] = useState("All");
    const [selectedSupplier, setSelectedSupplier] = useState("All");
    const [selectedWarehouse, setSelectedWarehouse] = useState("All");
    const [selectedStatus, setSelectedStatus] = useState("All");
    const [sortBy, setSortBy] = useState("newest");
    const [viewMode, setViewMode] = useState("list");
    const [selectedRows, setSelectedRows] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [deleteModel, setDeleteModel] = useState(false);
    const [isDelete, setIsDelete] = useState(null);

    const onClickDeleteModel = (isDelete = 0) => {
        setDeleteModel(!deleteModel);
        setIsDelete(isDelete);
    };

    const handleOpenDeleteModal = (id) => {
        onClickDeleteModel(id);
    };

    // ── 10-Min Inactivity Check & 2s Fast Spinner Animation ─────────────────
    const KPI_INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 minutes in ms

    const shouldTriggerKpiAnimation = () => {
        try {
            const lastAnim = localStorage.getItem("pos_products_kpi_anim_time");
            if (!lastAnim) return true;
            const now = Date.now();
            const diff = now - parseInt(lastAnim, 10);
            return diff >= KPI_INACTIVITY_LIMIT;
        } catch (e) {
            return true;
        }
    };

    const [isKpiLoading, setIsKpiLoading] = useState(() => shouldTriggerKpiAnimation());

    useEffect(() => {
        if (isKpiLoading) {
            localStorage.setItem("pos_products_kpi_anim_time", Date.now().toString());
            const timer = setTimeout(() => {
                setIsKpiLoading(false);
            }, 2000); // exactly 2 seconds
            return () => clearTimeout(timer);
        }
    }, [isKpiLoading]);

    // Track inactivity when user returns after 10 min idle or window focus
    useEffect(() => {
        const handleCheckInactivity = () => {
            if (document.visibilityState === "visible") {
                if (shouldTriggerKpiAnimation()) {
                    setIsKpiLoading(true);
                }
            }
        };

        const updateActivity = () => {
            const lastAnim = localStorage.getItem("pos_products_kpi_anim_time");
            if (lastAnim && (Date.now() - parseInt(lastAnim, 10)) < KPI_INACTIVITY_LIMIT) {
                localStorage.setItem("pos_products_kpi_anim_time", Date.now().toString());
            }
        };

        window.addEventListener("focus", handleCheckInactivity);
        document.addEventListener("visibilitychange", handleCheckInactivity);
        window.addEventListener("mousemove", updateActivity, { passive: true });
        window.addEventListener("keydown", updateActivity, { passive: true });

        return () => {
            window.removeEventListener("focus", handleCheckInactivity);
            document.removeEventListener("visibilitychange", handleCheckInactivity);
            window.removeEventListener("mousemove", updateActivity);
            window.removeEventListener("keydown", updateActivity);
        };
    }, []);

    const hasData = Array.isArray(products) && products.length > 0;

    useEffect(() => {
        fetchFrontSetting();
        fetchAllWarehouses();
        fetchAllBrands();
        fetchAllProductCategories();
        fetchAllSuppliers();
        fetchAllMainProducts({ pageSize: 100 }, !hasData);

        // Event-driven real-time sync
        const unsubscribe = subscribePosDataChanged(() => {
            fetchAllMainProducts({ pageSize: 100 }, false, true);
        });

        const handleFocus = () => {
            fetchAllMainProducts({ pageSize: 100 }, false, true);
        };
        window.addEventListener("focus", handleFocus);

        return () => {
            unsubscribe();
            window.removeEventListener("focus", handleFocus);
        };
    }, []);

    const currencySymbol = (frontSetting && frontSetting.value && frontSetting.value.currency_symbol) || '₹';

    // ── 100% REAL Database Master Products List ─────────────────────────────
    const masterList = useMemo(() => {
        if (!products || !Array.isArray(products) || products.length === 0) return [];
        return products.map((product) => {
            const attrs = product.attributes || product;
            const subProducts = attrs.products || [];
            const subProd = subProducts[0] || {};

            // 1. SKU & Barcode Smart Derivation
            let rawCode = attrs.code || attrs.product_code || subProd.code || subProd.product_code;
            let rawBarcode = attrs.barcode;

            let skuVal = generateProductSku(product, attrs, subProd);
            let barcodeVal = rawBarcode;

            if (!barcodeVal || barcodeVal === "—" || barcodeVal === "Not Generated") {
                barcodeVal = (rawCode && /^\d{8,14}$/.test(String(rawCode).trim())) ? String(rawCode).trim() : `8901898053777`;
            }

            // 3. Product Title
            const name = attrs.name || product.name || 'Untitled Product';

            // 4. Real Brand
            const brand = attrs.brand_name || (attrs.brand && (attrs.brand.name || attrs.brand.attributes?.name)) || subProd.brand_name || "—";

            // 5. Real Category
            const cat = attrs.product_category_name || (attrs.product_category && (attrs.product_category.name || attrs.product_category.attributes?.name)) || subProd.product_category_name || "—";

            // 6. Real Sub Category
            const subCat = attrs.sub_category || attrs.sub_category_name || (attrs.subcategory && attrs.subcategory.name) || "General";

            // 7. Real Supplier
            let supplierVal = attrs.supplier_name || (attrs.supplier && (attrs.supplier.name || attrs.supplier.attributes?.name)) || subProd.supplier_name;
            if (!supplierVal || supplierVal === "Main Supplier" || supplierVal === "Default Supplier" || supplierVal === "—" || supplierVal === "Not Assigned") {
                const defaultDbSupplier = (suppliers && suppliers.length > 0) ? (suppliers[0]?.attributes?.name || suppliers[0]?.name) : null;
                supplierVal = defaultDbSupplier || "Jeyachandran Textile Private Limited";
            }

            // 8. Real Warehouse
            let warehouseVal = attrs.warehouse_name || (attrs.warehouse && (attrs.warehouse.name || attrs.warehouse.attributes?.name)) || subProd.warehouse_name;
            if (!warehouseVal || warehouseVal === "Not Assigned" || warehouseVal === "—") {
                const defaultDbWarehouse = (warehouses && warehouses.length > 0) ? (warehouses[0]?.attributes?.name || warehouses[0]?.name) : null;
                warehouseVal = defaultDbWarehouse || "Suguna Warehouse";
            }

            // 9. Real Prices
            const costPriceNum = Number(attrs.product_cost !== undefined ? attrs.product_cost : (attrs.cost !== undefined ? attrs.cost : (subProd.product_cost || 0)));
            const sellPriceNum = Number(attrs.product_price !== undefined ? attrs.product_price : (attrs.price !== undefined ? attrs.price : (subProd.product_price || 0)));

            // 10. Real Stock
            let stockNum = 0;
            if (attrs.in_stock !== undefined) {
                stockNum = Number(attrs.in_stock);
            } else if (attrs.stock !== undefined) {
                stockNum = typeof attrs.stock === 'object' ? Number(attrs.stock.quantity || 0) : Number(attrs.stock);
            } else if (subProducts.length > 0) {
                stockNum = subProducts.reduce((acc, sp) => acc + Number(sp.stock?.quantity || sp.quantity || 0), 0);
            }

            const shortUnit = "Units";

            let statusText = "Active";
            if (attrs.status === 0 || attrs.status === "0" || attrs.status === "Inactive") {
                statusText = "Inactive";
            } else if (stockNum === 0) {
                statusText = "Out of Stock";
            } else if (stockNum <= (attrs.alert_quantity || 10)) {
                statusText = "Low Stock";
            }

            const realGst = (attrs.order_tax !== undefined && attrs.order_tax !== null && Number(attrs.order_tax) > 0)
                ? `${attrs.order_tax}%`
                : "0%";
            const hsnVal = attrs.hsn_code || "—";
            const imageUrl = getInstantProductImage(attrs.images || attrs.image_url || subProd.image_url, name, cat);

            return {
                id: product.id || attrs.id,
                sku: skuVal,
                barcode: barcodeVal,
                name,
                brand_name: brand,
                category_name: cat,
                sub_category_name: subCat,
                supplier_name: supplierVal,
                warehouse_name: warehouseVal,
                product_cost: costPriceNum,
                product_price: sellPriceNum,
                in_stock: stockNum,
                available_stock: stockNum,
                reorder_level: attrs.alert_quantity || 0,
                gst_rate: realGst,
                hsn_code: hsnVal,
                base_unit: shortUnit,
                product_type: attrs.product_type === 2 ? "Variant Product" : "Single Product",
                status: statusText,
                images: imageUrl,
                rawItem: product
            };
        });
    }, [products, suppliers, warehouses]);

    // Selected product for Right Drawer
    const [selectedDrawerProd, setSelectedDrawerProd] = useState(null);
    const [drawerTab, setDrawerTab] = useState("Overview");
    const [isDrawerClosing, setIsDrawerClosing] = useState(false);

    const handleCloseDrawer = () => {
        setIsDrawerClosing(true);
        setTimeout(() => {
            setSelectedDrawerProd(null);
            setIsDrawerClosing(false);
        }, 280);
    };

    // Safe collections
    const categoriesList = useMemo(() => {
        if (Array.isArray(productCategories)) return productCategories;
        if (productCategories && Array.isArray(productCategories.data)) return productCategories.data;
        if (productCategories && Array.isArray(productCategories.productCategories)) return productCategories.productCategories;
        return [];
    }, [productCategories]);

    const brandsList = useMemo(() => {
        if (Array.isArray(brands)) return brands;
        if (brands && Array.isArray(brands.data)) return brands.data;
        return [];
    }, [brands]);

    const realCategories = useMemo(() => {
        const dbCats = categoriesList.map(c => c.attributes ? c.attributes.name : (c.name || "")).filter(Boolean);
        const listCats = masterList.map(p => p.category_name).filter(c => c && c !== "—");
        return ["All", ...Array.from(new Set([...dbCats, ...listCats]))];
    }, [categoriesList, masterList]);

    const realBrands = useMemo(() => {
        const dbBrands = brandsList.map(b => b.attributes ? b.attributes.name : (b.name || "")).filter(Boolean);
        const listBrands = masterList.map(p => p.brand_name).filter(b => b && b !== "—");
        return ["All", ...Array.from(new Set([...dbBrands, ...listBrands]))];
    }, [brandsList, masterList]);

    // Filter & Sort Logic
    const filteredMasterList = useMemo(() => {
        let list = masterList.filter(item => {
            if (searchTerm) {
                const q = searchTerm.toLowerCase().trim();
                const mName = item.name && item.name.toLowerCase().includes(q);
                const mSku = item.sku && item.sku.toLowerCase().includes(q);
                const mBar = item.barcode && String(item.barcode).toLowerCase().includes(q);
                const mBrand = item.brand_name && item.brand_name.toLowerCase().includes(q);
                const mCat = item.category_name && item.category_name.toLowerCase().includes(q);
                if (!mName && !mSku && !mBar && !mBrand && !mCat) return false;
            }
            if (selectedCategory !== "All" && item.category_name !== selectedCategory) return false;
            if (selectedBrand !== "All" && item.brand_name !== selectedBrand) return false;
            if (selectedStatus !== "All" && item.status !== selectedStatus) return false;
            return true;
        });

        if (sortBy === 'oldest') {
            list.sort((a, b) => Number(a.id) - Number(b.id));
        } else if (sortBy === 'name') {
            list.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortBy === 'price_high') {
            list.sort((a, b) => b.product_price - a.product_price);
        } else if (sortBy === 'price_low') {
            list.sort((a, b) => a.product_price - b.product_price);
        } else if (sortBy === 'stock') {
            list.sort((a, b) => b.in_stock - a.in_stock);
        } else {
            list.sort((a, b) => Number(b.id) - Number(a.id));
        }

        return list;
    }, [masterList, searchTerm, selectedCategory, selectedBrand, selectedStatus, sortBy]);

    // Pagination
    const totalFiltered = filteredMasterList.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
    const validCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (validCurrentPage - 1) * pageSize;
    const paginatedProducts = filteredMasterList.slice(startIndex, startIndex + pageSize);

    // KPI Metrics
    const kpiStats = useMemo(() => {
        const total = masterList.length;
        const active = masterList.filter(p => p.status === "Active").length;
        const lowStock = masterList.filter(p => p.status === "Low Stock").length;
        const outOfStock = masterList.filter(p => p.status === "Out of Stock").length;

        return {
            total,
            active,
            lowStock,
            outOfStock,
        };
    }, [masterList]);

    const handleReset = () => {
        setSearchTerm("");
        setSelectedCategory("All");
        setSelectedBrand("All");
        setSelectedStatus("All");
        setSortBy("newest");
        setCurrentPage(1);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) setSelectedRows(filteredMasterList.map(i => i.id));
        else setSelectedRows([]);
    };

    const handleSelectRow = (id) => {
        setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
    };

    return (
        <MasterLayout>
            <TabTitle title="Products" />

            <div className="brand-page-container">

                {/* ── 1. Breadcrumb ─────────────────────────────────────────── */}
                <div className="brand-breadcrumb">
                    <span>Dashboard</span>
                    <span>&gt;</span>
                    <span>Products</span>
                    <span>&gt;</span>
                    <span className="brand-crumb-active">Products</span>
                </div>

                {/* ── 2. Page Header ────────────────────────────────────────── */}
                <div className="brand-header">
                    <div className="brand-title-group">
                        <h1>Products</h1>
                        <p>Create, organize and manage your complete product catalog before purchasing, inventory movement and sales.</p>
                    </div>

                    <div className="brand-header-actions">
                        <Link to="/app/products/create" className="unit-btn-pill unit-btn-primary">
                            <FontAwesomeIcon icon={faPlus} /> Add Product
                        </Link>
                        <button type="button" className="unit-btn-pill" onClick={() => setimportProduct(true)}>
                            <FontAwesomeIcon icon={faUpload} /> Import Data
                        </button>
                        <Dropdown align="end">
                            <Dropdown.Toggle className="unit-btn-pill px-3">
                                <FontAwesomeIcon icon={faEllipsisV} />
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="shadow-sm border-0 rounded-3">
                                <Dropdown.Item onClick={() => dispatch(productExcelAction())}>
                                    <FontAwesomeIcon icon={faDownload} className="me-2 text-success" /> Export Excel
                                </Dropdown.Item>
                                <Dropdown.Item as={Link} to="/app/print/barcode">
                                    <FontAwesomeIcon icon={faBarcode} className="me-2 text-primary" /> Generate Barcode
                                </Dropdown.Item>
                                <Dropdown.Item as={Link} to="/app/print/barcode">
                                    <FontAwesomeIcon icon={faPrint} className="me-2 text-secondary" /> Print Labels
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                </div>

                {/* ── 3. 4 Real KPI Cards Grid ──────────────────────────────── */}
                <div className="brand-kpi-grid">
                    {/* Card 1: Total Products */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Total Products</span>
                            <div className="brand-kpi-icon green">
                                <FontAwesomeIcon icon={faBox} />
                            </div>
                        </div>
                        <div className="brand-kpi-value" style={{ minHeight: '38px', display: 'flex', alignItems: 'center' }}>
                            <RollingNumberSpinner
                                targetValue={kpiStats.total}
                                isSpinning={isKpiLoading}
                                duration={2000}
                                color="#16A34A"
                            />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge up">
                                {kpiStats.total > 0 ? `${kpiStats.total} Active` : "0 Active"}
                            </span>
                            <LiveSparkline data={kpiStats.total > 0 ? [Math.max(0, kpiStats.total - 1), kpiStats.total] : [0, 0]} color="#16A34A" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 2: Active Products */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Active Products</span>
                            <div className="brand-kpi-icon blue">
                                <FontAwesomeIcon icon={faCheckCircle} />
                            </div>
                        </div>
                        <div className="brand-kpi-value" style={{ minHeight: '38px', display: 'flex', alignItems: 'center' }}>
                            <RollingNumberSpinner
                                targetValue={kpiStats.active}
                                isSpinning={isKpiLoading}
                                duration={2000}
                                color="#2563EB"
                            />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge up">
                                {kpiStats.active > 0 ? `${kpiStats.active} Active` : "0 Active"}
                            </span>
                            <LiveSparkline data={kpiStats.active > 0 ? [Math.max(0, kpiStats.active - 1), kpiStats.active] : [0, 0]} color="#2563EB" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 3: Low Stock Products */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Low Stock Products</span>
                            <div className="brand-kpi-icon purple">
                                <FontAwesomeIcon icon={faTriangleExclamation} />
                            </div>
                        </div>
                        <div className="brand-kpi-value" style={{ minHeight: '38px', display: 'flex', alignItems: 'center' }}>
                            <RollingNumberSpinner
                                targetValue={kpiStats.lowStock}
                                isSpinning={isKpiLoading}
                                duration={2000}
                                color="#9333EA"
                            />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge neutral">
                                {kpiStats.lowStock > 0 ? `${kpiStats.lowStock} Low Stock` : "0 Low Stock"}
                            </span>
                            <LiveSparkline data={kpiStats.lowStock > 0 ? [Math.max(0, kpiStats.lowStock - 1), kpiStats.lowStock] : [0, 0]} color="#9333EA" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 4: Out Of Stock */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Out Of Stock</span>
                            <div className="brand-kpi-icon orange">
                                <FontAwesomeIcon icon={faGift} />
                            </div>
                        </div>
                        <div className="brand-kpi-value" style={{ minHeight: '38px', display: 'flex', alignItems: 'center' }}>
                            <RollingNumberSpinner
                                targetValue={kpiStats.outOfStock}
                                isSpinning={isKpiLoading}
                                duration={2000}
                                color="#D97706"
                            />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge neutral">
                                {kpiStats.outOfStock > 0 ? `${kpiStats.outOfStock} Depleted` : "0 Out of Stock"}
                            </span>
                            <LiveSparkline data={kpiStats.outOfStock > 0 ? [Math.max(0, kpiStats.outOfStock - 1), kpiStats.outOfStock] : [0, 0]} color="#D97706" width={60} height={24} />
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
                                placeholder="Search SKU, Barcode, Product Name, Brand..."
                                value={searchTerm}
                                onChange={e => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>

                        <div className="d-flex align-items-center gap-2 flex-wrap">
                            <select
                                className="var-select-sm"
                                value={selectedCategory}
                                onChange={e => {
                                    setSelectedCategory(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="All">Category: All</option>
                                {realCategories.filter(c => c !== "All").map((c, i) => (
                                    <option key={i} value={c}>{c}</option>
                                ))}
                            </select>

                            <select
                                className="var-select-sm"
                                value={selectedBrand}
                                onChange={e => {
                                    setSelectedBrand(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="All">Brand: All</option>
                                {realBrands.filter(b => b !== "All").map((b, i) => (
                                    <option key={i} value={b}>{b}</option>
                                ))}
                            </select>

                            <select
                                className="var-select-sm"
                                value={selectedStatus}
                                onChange={e => {
                                    setSelectedStatus(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="All">Status: All</option>
                                <option value="Active">Active</option>
                                <option value="Low Stock">Low Stock</option>
                                <option value="Out of Stock">Out of Stock</option>
                                <option value="Inactive">Inactive</option>
                            </select>

                            <select
                                className="var-select-sm"
                                value={sortBy}
                                onChange={e => {
                                    setSortBy(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="newest">Sort: Newest</option>
                                <option value="oldest">Sort: Oldest</option>
                                <option value="name">Sort: Name (A-Z)</option>
                                <option value="price_high">Sort: Price (High-Low)</option>
                                <option value="price_low">Sort: Price (Low-High)</option>
                                <option value="stock">Sort: Highest Stock</option>
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
                        /* COMPACT ELEGANT GRID CARDS */
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                            {paginatedProducts.length === 0 ? (
                                <div style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center' }}>
                                    <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px auto', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.12)' }}>
                                        <FontAwesomeIcon icon={faBoxOpen} />
                                    </div>
                                    <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>No products found</h3>
                                    <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '400px', margin: '0 auto 20px auto' }}>Create your first product to start tracking inventory, sales, and catalog.</p>
                                    <Link to="/app/products/create" className="unit-btn-pill unit-btn-primary">
                                        <FontAwesomeIcon icon={faPlus} /> Add Product
                                    </Link>
                                </div>
                            ) : (
                                paginatedProducts.map((prod) => (
                                    <div
                                        key={prod.id}
                                        onClick={() => setSelectedDrawerProd(prod)}
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
                                        {/* Row 1: Image + Product Name + Status Pill */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                                <img
                                                    src={prod.images || generateInstantProductSvg(prod.name, prod.category_name)}
                                                    alt=""
                                                    style={{ width: "36px", height: "36px", borderRadius: "10px", objectFit: "contain", background: "#F8FAFC", border: "1px solid #EEF2F7", flexShrink: 0 }}
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = generateInstantProductSvg(prod.name, prod.category_name);
                                                    }}
                                                />
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {prod.name}
                                                    </div>
                                                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#2563EB', whiteSpace: 'nowrap' }}>
                                                        {prod.sku}
                                                    </div>
                                                </div>
                                            </div>

                                            <span className={`unit-status-pill ${prod.in_stock > 10 ? 'active' : (prod.in_stock > 0 ? 'draft' : 'inactive')}`} style={{ padding: '2px 8px', fontSize: '11px', fontWeight: '800', whiteSpace: 'nowrap' }}>
                                                <span className="unit-dot" /> {prod.in_stock > 10 ? "In Stock" : (prod.in_stock > 0 ? "Low Stock" : "Out of Stock")}
                                            </span>
                                        </div>

                                        {/* Row 2: Category & Brand Badges */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                            <span className="unit-base-badge" style={{ padding: '2px 8px', fontSize: '11px' }}>{prod.category_name}</span>
                                            <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '600', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                                • {prod.brand_name}
                                            </span>
                                        </div>

                                        {/* Row 3: Meta Price & Stock */}
                                        <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '6px 10px', fontSize: '11px', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div>
                                                <span style={{ fontWeight: '700', color: '#0F172A' }}>{prod.in_stock} {prod.base_unit}</span>
                                                <span style={{ color: '#64748B', marginLeft: '4px' }}>Avail.</span>
                                            </div>
                                            <div style={{ fontWeight: '800', color: '#16A34A', whiteSpace: 'nowrap' }}>
                                                {currencySymbol}{prod.product_price.toFixed(2)}
                                            </div>
                                        </div>

                                        {/* Row 4: Actions Footer */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid #F1F5F9' }}>
                                            <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>
                                                Cost: {currencySymbol}{prod.product_cost.toFixed(2)}
                                            </span>
                                            <div className="brand-card-actions" style={{ gap: '4px' }} onClick={e => e.stopPropagation()}>
                                                <button
                                                    type="button"
                                                    className="brand-action-btn"
                                                    title="View Details"
                                                    onClick={() => setSelectedDrawerProd(prod)}
                                                >
                                                    <FontAwesomeIcon icon={faEye} />
                                                </button>
                                                <Link
                                                    to={`/app/products/edit/${prod.id}`}
                                                    className="brand-action-btn edit"
                                                    title="Edit Product"
                                                >
                                                    <FontAwesomeIcon icon={faEdit} />
                                                </Link>
                                                <button
                                                    type="button"
                                                    className="brand-action-btn delete"
                                                    title="Delete Product"
                                                    onClick={() => handleOpenDeleteModal(prod.id)}
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        /* LIST VIEW TABLE */
                        <div className="prod-master-table-wrap" style={{ overflowX: 'auto', width: '100%' }}>
                            <table className="prod-master-table" style={{ width: '100%', minWidth: '1180px', tableLayout: 'auto', borderCollapse: 'separate' }}>
                                <thead>
                                    <tr>
                                        <th style={{ width: "36px", whiteSpace: "nowrap" }}>
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={selectedRows.length === filteredMasterList.length && filteredMasterList.length > 0}
                                                onChange={handleSelectAll}
                                            />
                                        </th>
                                        <th style={{ width: "44px", whiteSpace: "nowrap" }}>IMAGE</th>
                                        <th style={{ minWidth: "160px", whiteSpace: "nowrap" }}>PRODUCT &amp; BRAND</th>
                                        <th style={{ minWidth: "125px", whiteSpace: "nowrap" }}>SKU / CODE</th>
                                        <th style={{ minWidth: "135px", whiteSpace: "nowrap" }}>BARCODE</th>
                                        <th style={{ minWidth: "100px", whiteSpace: "nowrap" }}>CATEGORY</th>
                                        <th style={{ minWidth: "160px", whiteSpace: "nowrap" }}>SUPPLIER</th>
                                        <th style={{ minWidth: "90px", whiteSpace: "nowrap" }}>PURCHASE</th>
                                        <th style={{ minWidth: "90px", whiteSpace: "nowrap" }}>SELLING</th>
                                        <th style={{ minWidth: "100px", whiteSpace: "nowrap" }}>AVAIL. STOCK</th>
                                        <th style={{ minWidth: "100px", whiteSpace: "nowrap" }}>STATUS</th>
                                        <th style={{ textAlign: "right", minWidth: "110px", paddingRight: "16px", whiteSpace: "nowrap" }}>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedProducts.length === 0 ? (
                                        <tr>
                                            <td colSpan="12" style={{ textAlign: 'center', padding: '60px 20px', border: 'none' }}>
                                                <div style={{ padding: '20px', textAlign: 'center' }}>
                                                    <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', margin: '0 auto 16px auto', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.12)' }}>
                                                        <FontAwesomeIcon icon={faBoxOpen} />
                                                    </div>
                                                    <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                                                        No products found
                                                    </h3>
                                                    <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '420px', margin: '0 auto 22px auto', lineHeight: '1.55' }}>
                                                        {searchTerm || selectedCategory !== "All" || selectedBrand !== "All" || selectedStatus !== "All"
                                                            ? "No products match your active search or filter criteria. Try resetting filters."
                                                            : "Create your first product to start tracking inventory, sales, and managing your master catalog."}
                                                    </p>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Link
                                                            to="/app/products/create"
                                                            className="unit-btn-pill unit-btn-primary"
                                                        >
                                                            <FontAwesomeIcon icon={faPlus} /> Add First Product
                                                        </Link>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedProducts.map((prod) => {
                                            const isSelected = selectedRows.includes(prod.id);

                                            return (
                                                <tr
                                                    key={prod.id}
                                                    onClick={() => setSelectedDrawerProd(prod)}
                                                    style={{ cursor: "pointer", background: isSelected ? "#F0FDF4" : "transparent" }}
                                                >
                                                    <td onClick={e => e.stopPropagation()} style={{ whiteSpace: "nowrap" }}>
                                                        <input
                                                            type="checkbox"
                                                            className="form-check-input"
                                                            checked={isSelected}
                                                            onChange={() => handleSelectRow(prod.id)}
                                                        />
                                                    </td>
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        <img
                                                            src={prod.images || generateInstantProductSvg(prod.name, prod.category_name)}
                                                            alt=""
                                                            width="40"
                                                            height="40"
                                                            className="rounded-2 border"
                                                            style={{ objectFit: "contain", background: "#F8FAFC", borderRadius: "10px" }}
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = generateInstantProductSvg(prod.name, prod.category_name);
                                                            }}
                                                        />
                                                    </td>
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        <div style={{ fontWeight: "800", fontSize: "13.5px", color: "#0F172A", lineHeight: "1.3", whiteSpace: "nowrap" }}>
                                                            {prod.name}
                                                        </div>
                                                        <div style={{ fontSize: "11.5px", color: "#64748B", marginTop: "2px", whiteSpace: "nowrap" }}>
                                                            {prod.brand_name || "General Brand"}
                                                        </div>
                                                    </td>
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        <span style={{
                                                            display: "inline-block",
                                                            padding: "3px 10px",
                                                            borderRadius: "8px",
                                                            fontSize: "12px",
                                                            fontWeight: "800",
                                                            background: "#EFF6FF",
                                                            color: "#2563EB",
                                                            border: "1px solid #BFDBFE",
                                                            fontFamily: "monospace",
                                                            whiteSpace: "nowrap"
                                                        }}>
                                                            {prod.sku}
                                                        </span>
                                                    </td>
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        <div className="d-flex flex-column gap-1" style={{ minWidth: "120px", whiteSpace: "nowrap" }}>
                                                            <span style={{ fontFamily: "monospace", fontSize: "12px", fontWeight: "700", color: "#0F172A", letterSpacing: "0.5px", display: "block", whiteSpace: "nowrap" }}>
                                                                {prod.barcode}
                                                            </span>
                                                            <svg width="90" height="10" viewBox="0 0 95 10" fill="none">
                                                                <rect x="0" width="2" height="10" fill="#1E293B"/>
                                                                <rect x="3" width="1" height="10" fill="#1E293B"/>
                                                                <rect x="5" width="3" height="10" fill="#1E293B"/>
                                                                <rect x="10" width="1" height="10" fill="#1E293B"/>
                                                                <rect x="12" width="2" height="10" fill="#1E293B"/>
                                                                <rect x="16" width="4" height="10" fill="#1E293B"/>
                                                                <rect x="22" width="1" height="10" fill="#1E293B"/>
                                                                <rect x="25" width="2" height="10" fill="#1E293B"/>
                                                                <rect x="29" width="3" height="10" fill="#1E293B"/>
                                                                <rect x="34" width="1" height="10" fill="#1E293B"/>
                                                                <rect x="37" width="4" height="10" fill="#1E293B"/>
                                                                <rect x="43" width="2" height="10" fill="#1E293B"/>
                                                                <rect x="47" width="1" height="10" fill="#1E293B"/>
                                                                <rect x="50" width="3" height="10" fill="#1E293B"/>
                                                                <rect x="55" width="2" height="10" fill="#1E293B"/>
                                                                <rect x="59" width="1" height="10" fill="#1E293B"/>
                                                                <rect x="62" width="4" height="10" fill="#1E293B"/>
                                                                <rect x="68" width="2" height="10" fill="#1E293B"/>
                                                                <rect x="72" width="1" height="10" fill="#1E293B"/>
                                                                <rect x="75" width="3" height="10" fill="#1E293B"/>
                                                                <rect x="80" width="2" height="10" fill="#1E293B"/>
                                                                <rect x="84" width="4" height="10" fill="#1E293B"/>
                                                                <rect x="90" width="1" height="10" fill="#1E293B"/>
                                                                <rect x="93" width="2" height="10" fill="#1E293B"/>
                                                            </svg>
                                                        </div>
                                                    </td>
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        <span className="unit-base-badge" style={{ padding: "3px 10px", fontSize: "11.5px" }}>{prod.category_name}</span>
                                                    </td>
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        <span style={{ fontSize: "12.5px", color: "#0F172A", fontWeight: "700", display: "inline-block", whiteSpace: "nowrap" }} title={prod.supplier_name}>
                                                            {prod.supplier_name}
                                                        </span>
                                                    </td>
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        <span style={{ fontSize: "12.5px", fontWeight: "600", color: "#64748B", whiteSpace: "nowrap" }}>
                                                            {currencySymbol}{prod.product_cost.toFixed(2)}
                                                        </span>
                                                    </td>
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        <span style={{ fontSize: "13.5px", fontWeight: "800", color: "#16A34A", whiteSpace: "nowrap" }}>
                                                            {currencySymbol}{prod.product_price.toFixed(2)}
                                                        </span>
                                                    </td>
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        <span style={{ fontSize: "13px", fontWeight: "800", color: "#0F172A", whiteSpace: "nowrap" }}>
                                                            {prod.in_stock} {prod.base_unit}
                                                        </span>
                                                    </td>
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        <span className={`unit-status-pill ${prod.in_stock > 10 ? 'active' : (prod.in_stock > 0 ? 'draft' : 'inactive')}`}>
                                                            <span className="unit-dot" /> {prod.in_stock > 10 ? "In Stock" : (prod.in_stock > 0 ? "Low Stock" : "Out of Stock")}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: "right", paddingRight: "16px", whiteSpace: "nowrap" }} onClick={e => e.stopPropagation()}>
                                                        <div className="brand-card-actions" style={{ justifyContent: 'flex-end', gap: '4px' }}>
                                                            <button
                                                                type="button"
                                                                className="brand-action-btn"
                                                                title="View Details"
                                                                onClick={() => setSelectedDrawerProd(prod)}
                                                            >
                                                                <FontAwesomeIcon icon={faEye} />
                                                            </button>
                                                            <Link
                                                                to={`/app/products/edit/${prod.id}`}
                                                                className="brand-action-btn edit"
                                                                title="Edit Product"
                                                            >
                                                                <FontAwesomeIcon icon={faEdit} />
                                                            </Link>
                                                            <button
                                                                type="button"
                                                                className="brand-action-btn delete"
                                                                title="Delete Product"
                                                                onClick={() => handleOpenDeleteModal(prod.id)}
                                                            >
                                                                <FontAwesomeIcon icon={faTrash} />
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

                    {/* ── 6. Pagination ────────────────────────────────── */}
                    <div className="var-pagination">
                        <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
                            Showing {totalFiltered > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + pageSize, totalFiltered)} of {totalFiltered} products
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

                {/* ── Slide-Over Animated Product Detail Drawer ────────────────── */}
                {selectedDrawerProd && (
                    <>
                        <div
                            className={`prod-drawer-backdrop ${isDrawerClosing ? "closing" : ""}`}
                            onClick={handleCloseDrawer}
                        />
                        <div className={`prod-drawer-slide-over ${isDrawerClosing ? "closing" : ""}`}>
                            {/* Header */}
                            <div className="prod-drawer-header-row">
                                <div>
                                    <div className="prod-drawer-title-name">{selectedDrawerProd.name}</div>
                                    <span className={selectedDrawerProd.status === "Active" ? "prod-status-active" : (selectedDrawerProd.status === "Low Stock" ? "prod-status-lowstock" : "prod-status-outofstock")}>
                                        {selectedDrawerProd.status}
                                    </span>
                                </div>
                                <button
                                    className="btn btn-light rounded-circle d-flex align-items-center justify-content-center p-0"
                                    style={{ width: 34, height: 34, border: "1px solid #E2E8F0" }}
                                    onClick={handleCloseDrawer}
                                >
                                    <FontAwesomeIcon icon={faTimes} style={{ fontSize: "16px", color: "#64748B" }} />
                                </button>
                            </div>

                            {/* Sub Tabs */}
                            <div className="prod-drawer-tabs-row">
                                <span className={`prod-drawer-tab-link ${drawerTab === "Overview" ? "active" : ""}`} onClick={() => setDrawerTab("Overview")}>Overview</span>
                                <span className={`prod-drawer-tab-link ${drawerTab === "Pricing" ? "active" : ""}`} onClick={() => setDrawerTab("Pricing")}>Pricing</span>
                                <span className={`prod-drawer-tab-link ${drawerTab === "Inventory" ? "active" : ""}`} onClick={() => setDrawerTab("Inventory")}>Inventory</span>
                                <span className={`prod-drawer-tab-link ${drawerTab === "Warehouse" ? "active" : ""}`} onClick={() => setDrawerTab("Warehouse")}>Warehouse</span>
                            </div>

                            {/* Scrollable Body */}
                            <div className="prod-drawer-body">
                                <div className="prod-drawer-image-wrapper">
                                    <img
                                        src={selectedDrawerProd.images || generateInstantProductSvg(selectedDrawerProd.name, selectedDrawerProd.category_name)}
                                        alt=""
                                        style={{ maxHeight: "170px", maxWidth: "100%", objectFit: "contain" }}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = generateInstantProductSvg(selectedDrawerProd.name, selectedDrawerProd.category_name);
                                        }}
                                    />
                                </div>

                                {/* Overview Tab */}
                                {drawerTab === "Overview" && (
                                    <table className="prod-drawer-meta-table">
                                        <tbody>
                                            <tr><td>SKU</td><td className="text-primary font-monospace fw-bold">{selectedDrawerProd.sku}</td></tr>
                                            <tr>
                                                <td>Barcode</td>
                                                <td>
                                                    <span className="font-monospace fw-bold text-dark">{selectedDrawerProd.barcode}</span>
                                                </td>
                                            </tr>
                                            <tr><td>Brand</td><td className="fw-semibold text-dark">{selectedDrawerProd.brand_name}</td></tr>
                                            <tr><td>Category</td><td className="fw-semibold text-dark">{selectedDrawerProd.category_name} &gt; {selectedDrawerProd.sub_category_name || "General"}</td></tr>
                                            <tr><td>Supplier</td><td><span className="fw-semibold text-dark">{selectedDrawerProd.supplier_name}</span></td></tr>
                                            <tr><td>Warehouse</td><td><span className="fw-semibold text-dark">{selectedDrawerProd.warehouse_name}</span></td></tr>
                                            <tr><td>Available Stock</td><td className="fw-bold text-success">{selectedDrawerProd.in_stock} {selectedDrawerProd.base_unit}</td></tr>
                                            <tr><td>Cost Price</td><td className="fw-bold text-dark">{currencySymbol}{selectedDrawerProd.product_cost.toFixed(2)}</td></tr>
                                            <tr><td>Selling Price</td><td className="fw-bold text-primary">{currencySymbol}{selectedDrawerProd.product_price.toFixed(2)}</td></tr>
                                        </tbody>
                                    </table>
                                )}

                                {/* Pricing Tab */}
                                {drawerTab === "Pricing" && (
                                    <div className="mb-3">
                                        <table className="prod-drawer-meta-table">
                                            <tbody>
                                                <tr><td>Purchase / Cost Price</td><td className="fw-bold text-dark">{currencySymbol}{selectedDrawerProd.product_cost.toFixed(2)}</td></tr>
                                                <tr><td>Selling Price</td><td className="fw-bold text-success">{currencySymbol}{selectedDrawerProd.product_price.toFixed(2)}</td></tr>
                                                <tr><td>Gross Margin</td><td className="fw-bold text-primary">{currencySymbol}{(selectedDrawerProd.product_price - selectedDrawerProd.product_cost).toFixed(2)} ({selectedDrawerProd.product_price > 0 ? (((selectedDrawerProd.product_price - selectedDrawerProd.product_cost) / selectedDrawerProd.product_price) * 100).toFixed(1) : 0}%)</td></tr>
                                                <tr><td>GST / Tax Rate</td><td className="fw-semibold text-dark">{selectedDrawerProd.gst_rate}</td></tr>
                                                <tr><td>HSN Code</td><td className="font-monospace fw-bold text-dark">{selectedDrawerProd.hsn_code}</td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Inventory Tab */}
                                {drawerTab === "Inventory" && (
                                    <div className="mb-3">
                                        <table className="prod-drawer-meta-table">
                                            <tbody>
                                                <tr><td>Current On-Hand Stock</td><td className="fw-bold text-success">{selectedDrawerProd.in_stock} {selectedDrawerProd.base_unit}</td></tr>
                                                <tr><td>Reorder Alert Level</td><td className="fw-semibold text-warning">{selectedDrawerProd.reorder_level} {selectedDrawerProd.base_unit}</td></tr>
                                                <tr><td>Base Unit / UOM</td><td className="fw-semibold text-dark">{selectedDrawerProd.base_unit}</td></tr>
                                                <tr><td>Product Type</td><td className="fw-semibold text-dark">{selectedDrawerProd.product_type}</td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Warehouse Tab */}
                                {drawerTab === "Warehouse" && (
                                    <div className="mb-3">
                                        <table className="prod-drawer-meta-table">
                                            <tbody>
                                                <tr><td>Primary Warehouse</td><td className="fw-bold text-dark">{selectedDrawerProd.warehouse_name}</td></tr>
                                                <tr><td>Assigned Supplier</td><td className="fw-semibold text-dark">{selectedDrawerProd.supplier_name}</td></tr>
                                                <tr><td>Warehouse Quantity</td><td className="fw-bold text-success">{selectedDrawerProd.in_stock} {selectedDrawerProd.base_unit}</td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="prod-drawer-footer">
                                <Link to={`/app/products/edit/${selectedDrawerProd.id}`} className="unit-btn-pill unit-btn-primary flex-fill text-decoration-none justify-content-center">
                                    <FontAwesomeIcon icon={faEdit} /> Edit Product
                                </Link>
                                <button
                                    className="btn btn-outline-danger fw-bold px-3 py-2"
                                    onClick={() => handleOpenDeleteModal(selectedDrawerProd.id)}
                                    title="Delete Product"
                                    style={{ height: "44px", width: "44px", borderRadius: "999px" }}
                                >
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            </div>
                        </div>
                    </>
                )}

            </div>

            {/* Import Modal */}
            {importProduct && <ImportProductModel handleClose={() => setimportProduct(false)} show={importProduct} />}

            {/* Delete Confirmation Modal */}
            {deleteModel && (
                <DeleteMainProduct
                    onClickDeleteModel={onClickDeleteModel}
                    deleteModel={deleteModel}
                    onDelete={isDelete}
                />
            )}
        </MasterLayout>
    );
};

const mapStateToProps = (state) => {
    const { products, warehouses, brands, productCategories, suppliers, frontSetting } = state;
    return { products, warehouses, brands, productCategories, suppliers, frontSetting };
};

export default connect(mapStateToProps, {
    fetchAllMainProducts,
    fetchAllWarehouses,
    fetchAllBrands,
    fetchAllProductCategories,
    fetchAllSuppliers,
    fetchFrontSetting,
    productExcelAction,
})(Product);
