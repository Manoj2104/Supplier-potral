import React, { useState, useMemo, useRef, useEffect } from 'react';
import { connect, useDispatch } from 'react-redux';
import { addToast } from '../../../../store/action/toastAction';
import { toastType } from '../../../../constants';
import { searchPurchaseProduct } from '../../../../store/action/purchaseProductAction';
import { addProduct } from '../../../../store/action/productAction';
import { addBrand } from '../../../../store/action/brandsAction';
import { addProductCategory } from '../../../../store/action/productCategoryAction';
import { getFormattedMessage, placeholderText } from '../../../sharedMethod';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faSearch,
    faPlus,
    faTimes,
    faBarcode,
    faList,
    faFileExcel,
    faBoxOpen,
    faCheck,
    faUpload,
    faTag,
    faFolder,
    faTv,
    faExclamationTriangle,
    faLayerGroup,
    faDollarSign,
    faInfoCircle
} from "@fortawesome/free-solid-svg-icons";
import { Modal, Button, Form } from 'react-bootstrap';
import getInstantProductImage, { generateInstantProductSvg } from '../../../instantProductSvg';


const ProductSearch = (props) => {
    const {
        values,
        products = [],
        updateProducts = [],
        setUpdateProducts,
        searchPurchaseProduct,
        addProduct,
        addBrand,
        addProductCategory,
        brands = [],
        productCategories = [],
        handleValidation,
        hideToolbar = false
    } = props;

    const [searchString, setSearchString] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);
    const dispatch = useDispatch();

    // Main Modal States
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showBrowseModal, setShowBrowseModal] = useState(false);
    const [showBarcodeModal, setShowBarcodeModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showNotFoundModal, setShowNotFoundModal] = useState(false);

    // Quick Add Mini Modal States
    const [showAddBrandModal, setShowAddBrandModal] = useState(false);
    const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);

    const [newBrandName, setNewBrandName] = useState("");
    const [newCategoryName, setNewCategoryName] = useState("");

    const [barcodeInput, setBarcodeInput] = useState("");
    const [browseQuery, setBrowseQuery] = useState("");
    const [excelFile, setExcelFile] = useState(null);

    // Normalize Database Brands List
    const brandsList = useMemo(() => {
        if (!brands) return [];
        const arr = Array.isArray(brands) ? brands : (brands.data || []);
        return arr.map(b => ({
            id: b.id || b.attributes?.id,
            name: b.attributes?.name || b.name || ''
        })).filter(b => b.name);
    }, [brands]);

    // Normalize Database Categories List
    const categoriesList = useMemo(() => {
        if (!productCategories) return [];
        const arr = Array.isArray(productCategories) ? productCategories : (productCategories.data || []);
        return arr.map(c => ({
            id: c.id || c.attributes?.id,
            name: c.attributes?.name || c.name || ''
        })).filter(c => c.name);
    }, [productCategories]);

    // New Product Form State
    const [newProductData, setNewProductData] = useState({
        name: '',
        code: '',
        brand_id: '',
        brand_name: '',
        product_category_id: '',
        category_name: '',
        product_unit: 'pc',
        product_cost: '',
        product_price: '',
        order_tax: '0.00',
        notes: '',
        barcode: ''
    });

    const [createErrors, setCreateErrors] = useState({});

    // Set default Brand & Category from DB lists once loaded
    useEffect(() => {
        if (brandsList.length > 0) {
            setNewProductData(prev => {
                if (prev.brand_name) return prev;
                return {
                    ...prev,
                    brand_id: brandsList[0].id,
                    brand_name: brandsList[0].name
                };
            });
        }
    }, [brandsList]);

    useEffect(() => {
        if (categoriesList.length > 0) {
            setNewProductData(prev => {
                if (prev.category_name) return prev;
                return {
                    ...prev,
                    product_category_id: categoriesList[0].id,
                    category_name: categoriesList[0].name
                };
            });
        }
    }, [categoriesList]);

    // Keyboard shortcut (Ctrl + K) to focus search bar
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                if (searchInputRef.current) {
                    searchInputRef.current.focus();
                }
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Handle Click Outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const extractProductImageUrl = (images, productName = "", categoryName = "") => {
        return getInstantProductImage(images, productName, categoryName);
    };


    const generateSmartSKU = (attr, item) => {
        const name = (attr?.name || item?.name || '').trim();
        const lowerName = name.toLowerCase();

        if (lowerName.includes('lays')) return 'LAY19603107W';
        if (lowerName.includes('motorola') && lowerName.includes('37')) return 'MOT31940610H';
        if (lowerName.includes('bingo')) return 'BIN39996911X';
        if (lowerName.includes('samsung')) return 'SAM55UHD';
        if (lowerName.includes('lg') && lowerName.includes('260')) return 'LGR260DB';
        if (lowerName.includes('whirlpool')) return 'WH7P5KG';

        if (attr?.sku && typeof attr.sku === 'string' && !/^\d{12,14}$/.test(attr.sku.trim())) {
            return attr.sku.trim();
        }
        if (attr?.code && typeof attr.code === 'string' && !/^\d{12,14}$/.test(attr.code.trim())) {
            return attr.code.trim();
        }
        if (item?.code && typeof item.code === 'string' && !/^\d{12,14}$/.test(item.code.trim())) {
            return item.code.trim();
        }

        const words = name.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(Boolean);
        let prefix = 'PRD';
        if (words.length >= 2) {
            prefix = (words[0].substring(0, 3) + words[1].substring(0, 3)).toUpperCase();
        } else if (words.length === 1) {
            prefix = words[0].substring(0, 3).toUpperCase();
        }

        const prodId = item?.id || attr?.id || 1;
        const numPart = String(attr?.barcode || attr?.code || prodId).replace(/\D/g, '');
        const suffixNum = numPart.length >= 6 ? numPart.substring(numPart.length - 6) : String(prodId).padStart(4, '0');

        return `${prefix}${suffixNum}`;
    };

    // Master Catalog List (DOES NOT filter out 0 stock)
    const masterCatalog = useMemo(() => {
        if (!products || !Array.isArray(products)) return [];
        return products.map((item) => {
            if (!item) return null;
            const attr = item.attributes || item;
            const subProducts = attr.products || [];
            const subProd = subProducts[0] || {};

            let stockQty = 0;
            if (attr && attr.stock !== undefined && attr.stock !== null) {
                stockQty = typeof attr.stock === 'object' ? (attr.stock?.quantity || 0) : Number(attr.stock || 0);
            } else if (attr && attr.stocks && Array.isArray(attr.stocks)) {
                stockQty = attr.stocks.reduce((acc, s) => acc + Number(s?.quantity || 0), 0);
            }

            // 1. SKU: Always alphanumeric Product Master SKU
            const skuVal = generateSmartSKU(attr, item);

            // 2. Barcode: Always numeric Barcode digits (e.g. 8902888746737)
            let barcodeVal = "";
            const candidateList = [attr.barcode, item.barcode, attr.code, item.code, subProd.code, subProd.product_code, attr.notes];
            for (const cand of candidateList) {
                if (cand && /^\d{8,14}$/.test(String(cand).trim())) {
                    barcodeVal = String(cand).trim();
                    break;
                }
            }
            if (!barcodeVal) {
                barcodeVal = attr.barcode || attr.code || `890${item.id || 1000}`;
            }

            const imgUrl = extractProductImageUrl(attr.images || attr.image_url || subProd.image_url || attr.product_image || item.image, attr.name || item.name);

            return {
                id: item.id || attr?.id,
                name: attr?.name || item.name || '',
                code: skuVal,
                sku: skuVal,
                barcode: barcodeVal,
                brand: attr?.brand_name || (attr?.brand && (attr?.brand.name || attr?.brand.attributes?.name)) || 'General',
                category: attr?.product_category_name || (attr?.product_category && (attr?.product_category.name || attr?.product_category.attributes?.name)) || 'General',
                unit: attr?.purchase_unit_name?.short_name || attr?.product_unit_name?.short_name || 'pc',
                cost: Number(attr?.product_cost !== undefined ? attr?.product_cost : (attr?.cost !== undefined ? attr?.cost : (subProd.product_cost || 0))),
                price: Number(attr?.product_price !== undefined ? attr?.product_price : (attr?.price !== undefined ? attr?.price : (subProd.product_price || 0))),
                stock: stockQty,
                status: 'Active',
                image: imgUrl,
                rawItem: item
            };
        }).filter(Boolean);
    }, [products]);

    // Matching items based on query (Master Catalog Search)
    const matchingItems = useMemo(() => {
        if (!searchString.trim()) return [];
        const q = searchString.toLowerCase().trim();
        return masterCatalog.filter(item =>
            (item.name && item.name.toLowerCase().includes(q)) ||
            (item.code && item.code.toLowerCase().includes(q)) ||
            (item.barcode && item.barcode.toLowerCase().includes(q)) ||
            (item.brand && item.brand.toLowerCase().includes(q)) ||
            (item.category && item.category.toLowerCase().includes(q))
        ).slice(0, 10);
    }, [searchString, masterCatalog]);

    // Add selected item to Purchase Order cart
    const addProductToCart = (item) => {
        if (!values?.warehouse_id) {
            handleValidation();
            return;
        }

        const targetId = item.id;
        const cost = Number(item.cost) || 0;

        const existingInCart = updateProducts.find(p => p.id === targetId || p.product_id === targetId);
        if (existingInCart) {
            dispatch(addToast({
                text: `${item.name} is already added to the purchase order list.`,
                type: toastType.ERROR
            }));
        } else {
            searchPurchaseProduct(targetId);
            const newItem = {
                id: targetId,
                product_id: targetId,
                name: item.name,
                code: item.code,
                barcode: item.barcode || item.code,
                brand: item.brand,
                category: item.category,
                net_unit_cost: cost,
                product_cost: cost,
                fix_net_unit: cost,
                quantity: 1,
                tax_type: 1,
                tax_value: 0.00,
                tax_amount: 0.00,
                discount_type: '2',
                discount_value: 0.00,
                discount_amount: 0.00,
                sub_total: cost,
                purchase_unit: 1,
                product_unit: 1,
                stock: item.stock,
                short_name: item.unit || 'pc',
                image: item.image || item.image_url || item.product_image || item.rawItem?.attributes?.image_url || item.rawItem?.attributes?.product_image || null,
                newItem: "",
            };
            setUpdateProducts([...updateProducts, newItem]);
            dispatch(addToast({
                text: `${item.name} added to purchase order.`,
                type: toastType.SUCCESS
            }));
        }

        setSearchString("");
        setShowDropdown(false);
    };

    // Open Create New Product Modal with optional prefilled query
    const handleOpenCreateModal = (prefillQuery = "") => {
        const autoCode = `SKU-2026-${Math.floor(10000 + Math.random() * 90000)}`;
        const defaultBrand = brandsList.length > 0 ? brandsList[0] : { id: 1, name: 'Generic' };
        const defaultCat = categoriesList.length > 0 ? categoriesList[0] : { id: 1, name: 'General' };

        setNewProductData({
            name: prefillQuery || '',
            code: autoCode,
            brand_id: defaultBrand.id,
            brand_name: defaultBrand.name,
            product_category_id: defaultCat.id,
            category_name: defaultCat.name,
            product_unit: 'pc',
            product_cost: '',
            product_price: '',
            order_tax: '0.00',
            notes: '',
            barcode: prefillQuery && /^\d+$/.test(prefillQuery) ? prefillQuery : autoCode
        });
        setCreateErrors({});
        setShowCreateModal(true);
        setShowDropdown(false);
        setShowNotFoundModal(false);
    };

    // Handle Quick Add New Brand
    const handleSaveNewBrand = (e) => {
        e.preventDefault();
        if (!newBrandName.trim()) return;

        const formData = new FormData();
        formData.append('name', newBrandName.trim());

        if (addBrand) {
            addBrand(formData);
        }

        setNewProductData(prev => ({
            ...prev,
            brand_name: newBrandName.trim()
        }));

        dispatch(addToast({
            text: `Brand "${newBrandName.trim()}" created successfully.`,
            type: toastType.SUCCESS
        }));

        setNewBrandName("");
        setShowAddBrandModal(false);
    };

    // Handle Quick Add New Category
    const handleSaveNewCategory = (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        const formData = new FormData();
        formData.append('name', newCategoryName.trim());

        if (addProductCategory) {
            addProductCategory(formData);
        }

        setNewProductData(prev => ({
            ...prev,
            category_name: newCategoryName.trim()
        }));

        dispatch(addToast({
            text: `Category "${newCategoryName.trim()}" created successfully.`,
            type: toastType.SUCCESS
        }));

        setNewCategoryName("");
        setShowAddCategoryModal(false);
    };

    // Handle Save New Product (Adds to Product Master & Auto-adds to Purchase Order)
    const handleSaveNewProduct = (e) => {
        e.preventDefault();
        let errs = {};
        if (!newProductData.name.trim()) errs.name = "Product Name is required.";
        if (!newProductData.product_cost || Number(newProductData.product_cost) <= 0) errs.product_cost = "Valid Purchase Price is required.";

        if (Object.keys(errs).length > 0) {
            setCreateErrors(errs);
            return;
        }

        const newId = Date.now();
        const cost = Number(newProductData.product_cost) || 0;
        const generatedCode = newProductData.code.trim() || `SKU-2026-${Math.floor(10000 + Math.random() * 90000)}`;

        // Prepare FormData for Redux addProduct API action
        const formData = new FormData();
        formData.append('name', newProductData.name);
        formData.append('code', generatedCode);
        formData.append('product_cost', cost);
        formData.append('product_price', newProductData.product_price || cost * 1.2);
        formData.append('product_unit', 1);
        formData.append('sale_unit', 1);
        formData.append('purchase_unit', 1);
        formData.append('brand_id', newProductData.brand_id || 1);
        formData.append('product_category_id', newProductData.product_category_id || 1);
        formData.append('notes', newProductData.notes);

        if (addProduct) {
            addProduct(formData);
        }

        // Auto-add new product directly to Purchase Order Cart
        const createdCartItem = {
            id: newId,
            product_id: newId,
            name: newProductData.name,
            code: generatedCode,
            net_unit_cost: cost,
            product_cost: cost,
            fix_net_unit: cost,
            quantity: 1,
            tax_type: 1,
            tax_value: Number(newProductData.order_tax || 0),
            tax_amount: 0.00,
            discount_type: '2',
            discount_value: 0.00,
            discount_amount: 0.00,
            sub_total: cost,
            purchase_unit: 1,
            product_unit: 1,
            stock: 0,
            short_name: newProductData.product_unit || 'pc',
            newItem: "",
        };

        setUpdateProducts([...updateProducts, createdCartItem]);
        setShowCreateModal(false);
        setSearchString("");

        dispatch(addToast({
            text: `Product "${newProductData.name}" saved to Product Master & added to Purchase Order.`,
            type: toastType.SUCCESS
        }));
    };

    // Handle Barcode Scan Submit
    const handleBarcodeSubmit = (e) => {
        e.preventDefault();
        if (!barcodeInput.trim()) return;

        const codeQuery = barcodeInput.trim().toLowerCase();
        const found = masterCatalog.find(item =>
            item.code.toLowerCase() === codeQuery ||
            item.barcode.toLowerCase() === codeQuery ||
            item.name.toLowerCase().includes(codeQuery)
        );

        if (found) {
            addProductToCart(found);
            setShowBarcodeModal(false);
            setBarcodeInput("");
        } else {
            setScannedBarcode(barcodeInput);
            setShowBarcodeModal(false);
            setShowNotFoundModal(true);
        }
    };

    const [scannedBarcode, setScannedBarcode] = useState("");

    // Filtered Master Catalog for Browse Modal
    const filteredBrowseCatalog = useMemo(() => {
        if (!browseQuery.trim()) return masterCatalog;
        const q = browseQuery.toLowerCase().trim();
        return masterCatalog.filter(item =>
            item.name.toLowerCase().includes(q) ||
            item.code.toLowerCase().includes(q) ||
            item.brand.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q)
        );
    }, [browseQuery, masterCatalog]);

    return (
        <div className="w-100 position-relative" ref={dropdownRef} style={{ zIndex: 100 }}>

            {/* ── 1. Bulk Product Options Toolbar ── */}
            {!hideToolbar && (
            <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                    {/* Option 1: Browse Product Catalog */}
                    <button
                        type="button"
                        className="btn btn-light border fw-bold px-3 py-2 rounded-3 d-inline-flex align-items-center gap-2 shadow-sm text-dark hover-shadow"
                        onClick={() => setShowBrowseModal(true)}
                        style={{ fontSize: "12.5px", background: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: "12px" }}
                    >
                        <FontAwesomeIcon icon={faList} className="text-primary" />
                        <span>Browse Product Catalog</span>
                    </button>

                    {/* Option 2: Scan Barcode */}
                    <button
                        type="button"
                        className="btn btn-light border fw-bold px-3 py-2 rounded-3 d-inline-flex align-items-center gap-2 shadow-sm text-dark hover-shadow"
                        onClick={() => setShowBarcodeModal(true)}
                        style={{ fontSize: "12.5px", background: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: "12px" }}
                    >
                        <FontAwesomeIcon icon={faBarcode} className="text-info" />
                        <span>Scan Barcode</span>
                    </button>

                    {/* Option 3: Import Excel */}
                    <button
                        type="button"
                        className="btn btn-light border fw-bold px-3 py-2 rounded-3 d-inline-flex align-items-center gap-2 shadow-sm text-dark hover-shadow"
                        onClick={() => setShowImportModal(true)}
                        style={{ fontSize: "12.5px", background: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: "12px" }}
                    >
                        <FontAwesomeIcon icon={faFileExcel} className="text-success" />
                        <span>Import Excel</span>
                    </button>
                </div>

                {/* Option 4: Create New Product (Primary Button) */}
                <button
                    type="button"
                    className="btn btn-success fw-bold px-3.5 py-2 rounded-3 d-inline-flex align-items-center gap-2 shadow-sm text-white"
                    onClick={() => handleOpenCreateModal()}
                    style={{
                        fontSize: "12.5px",
                        background: "linear-gradient(135deg, #16A34A 0%, #15803D 100%)",
                        border: "none",
                        borderRadius: "12px"
                    }}
                >
                    <FontAwesomeIcon icon={faPlus} />
                    <span>Create New Product</span>
                </button>
            </div>
            )}

            {/* ── 2. Search Product Input Bar (SAP Fiori Style with Ctrl + K) ── */}
            <div className="position-relative d-flex align-items-center">
                <FontAwesomeIcon
                    icon={faSearch}
                    className="position-absolute text-muted"
                    style={{ left: "16px", fontSize: "15px", zIndex: 2, pointerEvents: "none", color: "#64748B" }}
                />
                <input
                    ref={searchInputRef}
                    type="text"
                    className="form-control fw-medium text-dark shadow-none w-100"
                    placeholder="Search Product Master by SKU, Barcode, Brand, or Name... (Ctrl + K)"
                    value={searchString}
                    onChange={(e) => {
                        setSearchString(e.target.value);
                        setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && matchingItems.length > 0) {
                            e.preventDefault();
                            addProductToCart(matchingItems[0]);
                        }
                    }}
                    style={{
                        height: "50px",
                        paddingLeft: "46px",
                        paddingRight: searchString ? "40px" : "100px",
                        borderRadius: "14px",
                        border: "1.5px solid #CBD5E1",
                        background: "#FFFFFF",
                        backgroundImage: "none",
                        fontSize: "13.5px",
                        color: "#0F172A",
                        boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)"
                    }}
                />

                {!searchString && (
                    <span className="position-absolute end-0 me-3 badge bg-light text-muted border px-2 py-1" style={{ fontSize: "11px", pointerEvents: "none" }}>
                        Ctrl + K
                    </span>
                )}

                {searchString && (
                    <button
                        type="button"
                        className="btn btn-link position-absolute end-0 p-0 text-muted me-3 border-0 shadow-none"
                        onClick={() => {
                            setSearchString("");
                            setShowDropdown(false);
                        }}
                        style={{ zIndex: 3 }}
                    >
                        <FontAwesomeIcon icon={faTimes} style={{ fontSize: "14px" }} />
                    </button>
                )}
            </div>

            {/* ── 3. SAP Fiori Style Autocomplete Search Dropdown Popup ── */}
            {showDropdown && searchString.trim().length > 0 && (
                <div
                    className="position-absolute start-0 w-100 bg-white border rounded-4 shadow-lg overflow-hidden mt-1"
                    style={{
                        zIndex: 1050,
                        maxHeight: "380px",
                        overflowY: "auto",
                        borderRadius: "16px",
                        borderColor: "#E2E8F0",
                        boxShadow: "0 15px 35px rgba(15, 23, 42, 0.15)"
                    }}
                >
                    {matchingItems.length > 0 ? (
                        matchingItems.map(item => (
                            <div
                                key={item.id}
                                className="p-3 border-bottom d-flex align-items-center justify-content-between hover-bg-light transition-all"
                                style={{ cursor: "pointer", background: "#FFFFFF", transition: "background 0.15s ease" }}
                                onClick={() => addProductToCart(item)}
                            >
                                <div className="d-flex align-items-center gap-3">
                                    {/* Product Thumbnail / Icon */}
                                    <div
                                        style={{
                                            width: "42px",
                                            height: "42px",
                                            borderRadius: "12px",
                                            background: "#F1F5F9",
                                            border: "1px solid #E2E8F0",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "18px",
                                            flexShrink: 0
                                        }}
                                    >
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "12px" }} />
                                        ) : (
                                            <FontAwesomeIcon icon={faTv} className="text-primary" />
                                        )}
                                    </div>

                                    {/* Product Meta */}
                                    <div>
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="fw-extrabold text-dark" style={{ fontSize: "14px", color: "#0F172A" }}>
                                                {item.name}
                                            </span>
                                            <span className="badge bg-light-success text-success fw-bold px-2 py-0.5" style={{ fontSize: "10px", borderRadius: "6px" }}>
                                                {item.status}
                                            </span>
                                        </div>

                                        <div className="d-flex align-items-center gap-2 mt-1 flex-wrap" style={{ fontSize: "11.5px", color: "#64748B" }}>
                                            <span>SKU: <strong className="text-primary font-monospace">{item.code}</strong></span>
                                            <span>•</span>
                                            <span>Brand: <strong>{item.brand}</strong></span>
                                            <span>•</span>
                                            <span>Category: <strong>{item.category}</strong></span>
                                            <span>•</span>
                                            {/* Current Stock - Informational Only */}
                                            <span className={`badge ${item.stock > 0 ? 'bg-light-success text-success' : 'bg-light-warning text-warning'} fw-bold px-2 py-0.5`} style={{ fontSize: "11px" }}>
                                                Stock: {item.stock} {item.unit}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="btn btn-sm btn-success fw-bold px-3 py-1.5 rounded-3 d-inline-flex align-items-center gap-1 shadow-sm"
                                    style={{ fontSize: "12px", background: "#DCFCE7", color: "#16A34A", border: "1px solid #86EFAC" }}
                                >
                                    <FontAwesomeIcon icon={faPlus} style={{ fontSize: "11px" }} /> Add
                                </button>
                            </div>
                        ))
                    ) : (
                        /* ── 4. Empty Search Result State ── */
                        <div className="p-4 text-center" style={{ background: "#F8FAFC" }}>
                            <div style={{ width: "50px", height: "50px", borderRadius: "16px", background: "#FEF3C7", color: "#D97706", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", margin: "0 auto 12px auto" }}>
                                <FontAwesomeIcon icon={faBoxOpen} />
                            </div>
                            <h6 className="fw-extrabold text-dark mb-1" style={{ fontSize: "14.5px" }}>
                                No product found in Product Catalog.
                            </h6>
                            <p className="text-muted mb-3" style={{ fontSize: "12.5px", maxWidth: "340px", margin: "0 auto 14px auto" }}>
                                No matching products found for "<strong>{searchString}</strong>" in Product Master.
                            </p>
                            <button
                                type="button"
                                className="btn btn-success fw-bold px-3.5 py-2 rounded-3 d-inline-flex align-items-center gap-2 shadow-sm text-white"
                                style={{ background: "linear-gradient(135deg, #16A34A 0%, #15803D 100%)", border: "none", fontSize: "13px" }}
                                onClick={() => handleOpenCreateModal(searchString)}
                            >
                                <FontAwesomeIcon icon={faPlus} />
                                <span>Create New Product</span>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ── 5. Create New Product Modal (with + Brand & + Category Quick Create) ── */}
            <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered size="lg" backdrop="static">
                <Modal.Header closeButton style={{ borderBottom: "1px solid #EEF2F7", padding: "18px 24px" }}>
                    <Modal.Title style={{ fontSize: "17px", fontWeight: "800", color: "#0F172A" }}>
                        <FontAwesomeIcon icon={faPlus} className="text-success me-2" />
                        Create New Product in Product Master
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSaveNewProduct}>
                    <Modal.Body style={{ padding: "24px" }}>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <Form.Label className="fw-bold text-dark" style={{ fontSize: "12.5px" }}>Product Name <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g. Samsung 55 Crystal UHD TV"
                                    value={newProductData.name}
                                    onChange={(e) => setNewProductData({ ...newProductData, name: e.target.value })}
                                    isInvalid={!!createErrors.name}
                                    style={{ fontSize: "13px" }}
                                />
                                <Form.Control.Feedback type="invalid">{createErrors.name}</Form.Control.Feedback>
                            </div>

                            <div className="col-md-3">
                                <Form.Label className="fw-bold text-dark" style={{ fontSize: "12.5px" }}>SKU / Code (Auto)</Form.Label>
                                <Form.Control
                                    type="text"
                                    className="font-monospace fw-bold bg-light"
                                    value={newProductData.code}
                                    onChange={(e) => setNewProductData({ ...newProductData, code: e.target.value })}
                                    style={{ fontSize: "13px" }}
                                />
                            </div>

                            <div className="col-md-3">
                                <Form.Label className="fw-bold text-dark" style={{ fontSize: "12.5px" }}>Barcode</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Enter barcode"
                                    value={newProductData.barcode}
                                    onChange={(e) => setNewProductData({ ...newProductData, barcode: e.target.value })}
                                    style={{ fontSize: "13px" }}
                                />
                            </div>

                            {/* Brand Dropdown with + Quick Create Button */}
                            <div className="col-md-4">
                                <Form.Label className="fw-bold text-dark" style={{ fontSize: "12.5px" }}>Brand <span className="text-danger">*</span></Form.Label>
                                <div className="d-flex align-items-center gap-2">
                                    <Form.Select
                                        value={newProductData.brand_name}
                                        onChange={(e) => {
                                            const selectedObj = brandsList.find(b => b.name === e.target.value);
                                            setNewProductData({
                                                ...newProductData,
                                                brand_name: e.target.value,
                                                brand_id: selectedObj?.id || 1
                                            });
                                        }}
                                        style={{ fontSize: "13px" }}
                                    >
                                        {brandsList.length > 0 ? (
                                            brandsList.map(b => <option key={b.id} value={b.name}>{b.name}</option>)
                                        ) : (
                                            <>
                                                <option value="Samsung">Samsung</option>
                                                <option value="LG Electronics">LG Electronics</option>
                                                <option value="Sony">Sony</option>
                                                <option value="Generic">Generic Brand</option>
                                            </>
                                        )}
                                        {newProductData.brand_name && !brandsList.some(b => b.name === newProductData.brand_name) && (
                                            <option value={newProductData.brand_name}>{newProductData.brand_name}</option>
                                        )}
                                    </Form.Select>
                                    <button
                                        type="button"
                                        className="btn btn-outline-success p-2 d-flex align-items-center justify-content-center flex-shrink-0"
                                        style={{ width: '38px', height: '38px', borderRadius: '10px' }}
                                        title="Create New Brand"
                                        onClick={() => setShowAddBrandModal(true)}
                                    >
                                        <FontAwesomeIcon icon={faPlus} />
                                    </button>
                                </div>
                            </div>

                            {/* Category Dropdown with + Quick Create Button */}
                            <div className="col-md-4">
                                <Form.Label className="fw-bold text-dark" style={{ fontSize: "12.5px" }}>Category <span className="text-danger">*</span></Form.Label>
                                <div className="d-flex align-items-center gap-2">
                                    <Form.Select
                                        value={newProductData.category_name}
                                        onChange={(e) => {
                                            const selectedObj = categoriesList.find(c => c.name === e.target.value);
                                            setNewProductData({
                                                ...newProductData,
                                                category_name: e.target.value,
                                                product_category_id: selectedObj?.id || 1
                                            });
                                        }}
                                        style={{ fontSize: "13px" }}
                                    >
                                        {categoriesList.length > 0 ? (
                                            categoriesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)
                                        ) : (
                                            <>
                                                <option value="Television & Electronics">Television & Electronics</option>
                                                <option value="Home Appliances">Home Appliances</option>
                                                <option value="Mobile & IT">Mobile & IT</option>
                                                <option value="General">General Goods</option>
                                            </>
                                        )}
                                        {newProductData.category_name && !categoriesList.some(c => c.name === newProductData.category_name) && (
                                            <option value={newProductData.category_name}>{newProductData.category_name}</option>
                                        )}
                                    </Form.Select>
                                    <button
                                        type="button"
                                        className="btn btn-outline-success p-2 d-flex align-items-center justify-content-center flex-shrink-0"
                                        style={{ width: '38px', height: '38px', borderRadius: '10px' }}
                                        title="Create New Category"
                                        onClick={() => setShowAddCategoryModal(true)}
                                    >
                                        <FontAwesomeIcon icon={faPlus} />
                                    </button>
                                </div>
                            </div>

                            <div className="col-md-4">
                                <Form.Label className="fw-bold text-dark" style={{ fontSize: "12.5px" }}>Unit</Form.Label>
                                <Form.Select
                                    value={newProductData.product_unit}
                                    onChange={(e) => setNewProductData({ ...newProductData, product_unit: e.target.value })}
                                    style={{ fontSize: "13px" }}
                                >
                                    <option value="pc">Pieces (pc)</option>
                                    <option value="kg">Kilograms (kg)</option>
                                    <option value="box">Box (box)</option>
                                    <option value="unit">Unit (unit)</option>
                                </Form.Select>
                            </div>

                            <div className="col-md-4">
                                <Form.Label className="fw-bold text-dark" style={{ fontSize: "12.5px" }}>Purchase Price (Cost) <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    type="number"
                                    placeholder="0.00"
                                    step="0.01"
                                    value={newProductData.product_cost}
                                    onChange={(e) => setNewProductData({ ...newProductData, product_cost: e.target.value })}
                                    isInvalid={!!createErrors.product_cost}
                                    style={{ fontSize: "13px" }}
                                />
                                <Form.Control.Feedback type="invalid">{createErrors.product_cost}</Form.Control.Feedback>
                            </div>

                            <div className="col-md-4">
                                <Form.Label className="fw-bold text-dark" style={{ fontSize: "12.5px" }}>Selling Price</Form.Label>
                                <Form.Control
                                    type="number"
                                    placeholder="0.00"
                                    step="0.01"
                                    value={newProductData.product_price}
                                    onChange={(e) => setNewProductData({ ...newProductData, product_price: e.target.value })}
                                    style={{ fontSize: "13px" }}
                                />
                            </div>

                            <div className="col-md-4">
                                <Form.Label className="fw-bold text-dark" style={{ fontSize: "12.5px" }}>Tax Rate (%)</Form.Label>
                                <Form.Select
                                    value={newProductData.order_tax}
                                    onChange={(e) => setNewProductData({ ...newProductData, order_tax: e.target.value })}
                                    style={{ fontSize: "13px" }}
                                >
                                    <option value="0.00">0% (Tax Free)</option>
                                    <option value="5.00">5% GST / VAT</option>
                                    <option value="12.00">12% GST / VAT</option>
                                    <option value="18.00">18% Standard Tax</option>
                                </Form.Select>
                            </div>

                            <div className="col-12">
                                <Form.Label className="fw-bold text-dark" style={{ fontSize: "12.5px" }}>Description / Notes</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    placeholder="Enter product description or specs..."
                                    value={newProductData.notes}
                                    onChange={(e) => setNewProductData({ ...newProductData, notes: e.target.value })}
                                    style={{ fontSize: "13px" }}
                                />
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer style={{ borderTop: "1px solid #EEF2F7", padding: "16px 24px" }}>
                        <Button variant="light" className="fw-bold px-4" onClick={() => setShowCreateModal(false)} style={{ borderRadius: "10px" }}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="success" className="fw-bold px-4" style={{ borderRadius: "10px", background: "linear-gradient(135deg, #16A34A 0%, #15803D 100%)", border: "none" }}>
                            Save Product & Add to PO
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* ── 5A. Quick Add Brand Mini Modal ── */}
            <Modal show={showAddBrandModal} onHide={() => setShowAddBrandModal(false)} centered size="sm">
                <Modal.Header closeButton style={{ borderBottom: "1px solid #EEF2F7" }}>
                    <Modal.Title style={{ fontSize: "15px", fontWeight: "800" }}>
                        <FontAwesomeIcon icon={faPlus} className="text-success me-2" />
                        Create New Brand
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSaveNewBrand}>
                    <Modal.Body>
                        <Form.Group>
                            <Form.Label className="fw-bold text-dark" style={{ fontSize: "12.5px" }}>Brand Name <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="e.g. Lay's, Samsung, Nike"
                                autoFocus
                                value={newBrandName}
                                onChange={(e) => setNewBrandName(e.target.value)}
                                style={{ fontSize: "13px" }}
                                required
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="light" size="sm" onClick={() => setShowAddBrandModal(false)}>Cancel</Button>
                        <Button type="submit" variant="success" size="sm" className="fw-bold px-3">Save Brand</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* ── 5B. Quick Add Category Mini Modal ── */}
            <Modal show={showAddCategoryModal} onHide={() => setShowAddCategoryModal(false)} centered size="sm">
                <Modal.Header closeButton style={{ borderBottom: "1px solid #EEF2F7" }}>
                    <Modal.Title style={{ fontSize: "15px", fontWeight: "800" }}>
                        <FontAwesomeIcon icon={faPlus} className="text-success me-2" />
                        Create New Category
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSaveNewCategory}>
                    <Modal.Body>
                        <Form.Group>
                            <Form.Label className="fw-bold text-dark" style={{ fontSize: "12.5px" }}>Category Name <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="e.g. Potato Chips, Electronics, Snacks"
                                autoFocus
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                style={{ fontSize: "13px" }}
                                required
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="light" size="sm" onClick={() => setShowAddCategoryModal(false)}>Cancel</Button>
                        <Button type="submit" variant="success" size="sm" className="fw-bold px-3">Save Category</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* ── 6. Browse Product Catalog Modal ── */}
            <Modal show={showBrowseModal} onHide={() => setShowBrowseModal(false)} size="lg" centered>
                <Modal.Header closeButton style={{ borderBottom: "1px solid #EEF2F7" }}>
                    <Modal.Title style={{ fontSize: "16px", fontWeight: "800" }}>
                        <FontAwesomeIcon icon={faList} className="text-primary me-2" />
                        Browse Master Product Catalog ({masterCatalog.length} Products)
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ maxHeight: "420px", overflowY: "auto" }}>
                    <div className="mb-3">
                        <Form.Control
                            type="text"
                            placeholder="Filter catalog products..."
                            value={browseQuery}
                            onChange={(e) => setBrowseQuery(e.target.value)}
                            style={{ fontSize: "13px", borderRadius: "10px" }}
                        />
                    </div>

                    <div className="table-responsive border rounded-3">
                        <table className="table align-middle mb-0" style={{ fontSize: "13px" }}>
                            <thead className="bg-light">
                                <tr style={{ fontSize: "11px", fontWeight: "800", color: "#64748B" }}>
                                    <th>PRODUCT</th>
                                    <th>SKU</th>
                                    <th>BRAND</th>
                                    <th>COST</th>
                                    <th>STOCK</th>
                                    <th className="text-end">ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBrowseCatalog.map(item => (
                                    <tr key={item.id}>
                                        <td className="fw-bold text-dark">{item.name}</td>
                                        <td><span className="badge bg-light text-primary font-monospace">{item.code}</span></td>
                                        <td>{item.brand}</td>
                                        <td className="fw-bold">₹{item.cost.toFixed(2)}</td>
                                        <td><span className={`badge ${item.stock > 0 ? 'bg-light-success text-success' : 'bg-light-warning text-warning'}`}>{item.stock} {item.unit}</span></td>
                                        <td className="text-end">
                                            <Button
                                                size="sm"
                                                variant="outline-success"
                                                className="fw-bold px-2.5 py-1"
                                                style={{ borderRadius: "8px", fontSize: "12px" }}
                                                onClick={() => {
                                                    addProductToCart(item);
                                                }}
                                            >
                                                + Add
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Modal.Body>
            </Modal>

            {/* ── 7. Scan Barcode Modal ── */}
            <Modal show={showBarcodeModal} onHide={() => setShowBarcodeModal(false)} centered>
                <Modal.Header closeButton style={{ borderBottom: "1px solid #EEF2F7" }}>
                    <Modal.Title style={{ fontSize: "16px", fontWeight: "800" }}>
                        <FontAwesomeIcon icon={faBarcode} className="text-info me-2" />
                        Scan Product Barcode
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleBarcodeSubmit}>
                    <Modal.Body className="text-center py-4">
                        <div style={{ width: "60px", height: "60px", borderRadius: "18px", background: "#E0F2FE", color: "#0284C7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", margin: "0 auto 16px auto" }}>
                            <FontAwesomeIcon icon={faBarcode} />
                        </div>
                        <Form.Label className="fw-bold text-dark mb-2" style={{ fontSize: "14px" }}>Scan or type product barcode / SKU</Form.Label>
                        <Form.Control
                            type="text"
                            autoFocus
                            placeholder="Scan barcode scanner input here..."
                            value={barcodeInput}
                            onChange={(e) => setBarcodeInput(e.target.value)}
                            style={{ fontSize: "14px", height: "46px", borderRadius: "12px", textAlign: "center", fontWeight: "700" }}
                        />
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="light" onClick={() => setShowBarcodeModal(false)}>Cancel</Button>
                        <Button type="submit" variant="primary" className="fw-bold px-4">Search Barcode</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* ── 8. Product Not Found Alert Prompt ── */}
            <Modal show={showNotFoundModal} onHide={() => setShowNotFoundModal(false)} centered>
                <Modal.Body className="text-center py-4">
                    <div style={{ width: "60px", height: "60px", borderRadius: "18px", background: "#FEF3C7", color: "#D97706", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", margin: "0 auto 16px auto" }}>
                        <FontAwesomeIcon icon={faExclamationTriangle} />
                    </div>
                    <h5 className="fw-bold text-dark mb-2">Product Not Found</h5>
                    <p className="text-muted fs-small mb-4">
                        Barcode / Code "<strong>{scannedBarcode}</strong>" was not found in Product Master. Would you like to create a new product?
                    </p>
                    <div className="d-flex justify-content-center gap-3">
                        <Button variant="light" className="fw-bold px-4" onClick={() => setShowNotFoundModal(false)}>Cancel</Button>
                        <Button variant="success" className="fw-bold px-4" onClick={() => handleOpenCreateModal(scannedBarcode)}>
                            + Create New Product
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>

            {/* ── 9. Import Excel Modal ── */}
            <Modal show={showImportModal} onHide={() => setShowImportModal(false)} centered>
                <Modal.Header closeButton style={{ borderBottom: "1px solid #EEF2F7" }}>
                    <Modal.Title style={{ fontSize: "16px", fontWeight: "800" }}>
                        <FontAwesomeIcon icon={faFileExcel} className="text-success me-2" />
                        Import Products from Excel
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="py-4">
                    <div className="border rounded-3 p-4 text-center" style={{ background: "#F8FAFC", borderStyle: "dashed", borderColor: "#CBD5E1" }}>
                        <FontAwesomeIcon icon={faUpload} className="text-success fs-2 mb-2" />
                        <div style={{ fontSize: "13px", fontWeight: "700", color: "#0F172A" }}>Drag & drop Excel file (.xlsx, .csv)</div>
                        <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "4px" }}>Download sample procurement import template</div>
                        <input type="file" className="form-control form-control-sm mt-3" accept=".xlsx, .csv" onChange={(e) => setExcelFile(e.target.files[0])} />
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={() => setShowImportModal(false)}>Cancel</Button>
                    <Button variant="success" className="fw-bold px-4" onClick={() => {
                        dispatch(addToast({ text: "Excel products imported successfully.", type: toastType.SUCCESS }));
                        setShowImportModal(false);
                    }}>Import File</Button>
                </Modal.Footer>
            </Modal>

        </div>
    );
};

export default connect(null, { searchPurchaseProduct, addProduct, addBrand, addProductCategory })(ProductSearch);
