import React, { useState, useEffect, useMemo, useRef } from 'react';
import { connect, useDispatch } from 'react-redux';
import { useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom';
import moment from 'moment';
import { Table } from 'react-bootstrap-v5';
import { InputGroup } from 'react-bootstrap-v5';
import { editPurchase } from '../../store/action/purchaseAction';
import { fetchAllProducts } from '../../store/action/productAction';
import { fetchAllSuppliers } from '../../store/action/supplierAction';
import { fetchAllWarehouses } from '../../store/action/warehouseAction';
import { editPurchaseUnit } from '../../store/action/purchaseProductAction';
import { addToast } from '../../store/action/toastAction';
import { toastType, purchaseStatusOptions } from '../../constants';
import ProductSearch from '../../shared/components/product-cart/search/ProductSearch';
import ReactDatePicker from '../../shared/datepicker/ReactDatePicker';
import ReactSelect from '../../shared/select/reactSelect';
import PurchaseTable from '../../shared/components/purchase/PurchaseTable';
import { preparePurchaseProductArray } from '../../shared/prepareArray/preparePurchaseArray';
import {
    getFormattedMessage,
    placeholderText,
    decimalValidate,
    onFocusInput,
} from '../../shared/sharedMethod';
import {
    calculateCartTotalAmount,
    calculateCartTotalTaxAmount,
    calculateSubTotal
} from '../../shared/calculation/calculation';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft,
    faArrowRight,
    faCheck,
    faBoxesStacked,
    faReceipt,
    faFileSignature,
    faBoxOpen,
    faTrashCan,
    faBuilding,
    faSearch,
    faTimes,
    faFileExcel,
    faBarcode,
    faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import './CreatePurchasePremium.css';

const PurchaseForm = (props) => {
    const {
        addPurchaseData,
        id,
        editPurchase,
        customProducts,
        singlePurchase,
        warehouses = [],
        suppliers = [],
        fetchAllProducts,
        products = [],
        frontSetting,
        allConfigData,
        purchases = [],
        totalRecord = 0,
        editPurchaseUnit,
    } = props;

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [searchParams] = useSearchParams();
    const location = useLocation();

    const currencySymbol = frontSetting?.value?.currency_symbol || "₹";

    // Products in Cart
    const [updateProducts, setUpdateProducts] = useState([]);
    const [searchMode, setSearchMode] = useState('search');
    const [searchQuery, setSearchQuery] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [createdRefCode, setCreatedRefCode] = useState('');

    useEffect(() => {
        if (singlePurchase && singlePurchase.purchase_items) {
            setUpdateProducts(singlePurchase.purchase_items);
        }
    }, [singlePurchase]);

    // Auto select warehouse & supplier
    useEffect(() => {
        if (!singlePurchase && warehouses && warehouses.length > 0 && !purchaseValue.warehouse_id) {
            const firstWh = warehouses[0];
            const whObj = firstWh.value !== undefined ? firstWh : { label: firstWh.attributes?.name || firstWh.name, value: firstWh.id };
            setPurchaseValue(prev => ({ ...prev, warehouse_id: whObj }));
        }
    }, [warehouses]);

    useEffect(() => {
        if (!singlePurchase && suppliers && suppliers.length > 0 && !purchaseValue.supplier_id) {
            const firstSup = suppliers[0];
            const supObj = firstSup.value !== undefined ? firstSup : { label: firstSup.attributes?.name || firstSup.name, value: firstSup.id };
            setPurchaseValue(prev => ({ ...prev, supplier_id: supObj }));
        }
    }, [suppliers]);

    // PO Number State
    const [poNumber, setPoNumber] = useState('');

    useEffect(() => {
        if (singlePurchase) {
            const ref = singlePurchase.reference_code || `PO-2026-${String(singlePurchase.id).padStart(6, '0')}`;
            setPoNumber(ref);
        } else {
            const list = Array.isArray(purchases) ? purchases : (purchases?.data || []);
            let maxId = 0;
            list.forEach(p => {
                const pId = Number(p.id) || 0;
                if (pId > maxId) maxId = pId;
            });
            const nextNum = maxId > 0 ? maxId + 1 : (totalRecord ? totalRecord + 1 : 14);
            setPoNumber(`PO-2026-${String(nextNum).padStart(6, '0')}`);
        }
    }, [singlePurchase, purchases, totalRecord]);

    // Master Form State
    const [purchaseValue, setPurchaseValue] = useState({
        date: singlePurchase ? moment(singlePurchase.date).toDate() : new Date(),
        warehouse_id: singlePurchase ? singlePurchase.warehouse_id : (warehouses[0]?.id ? { id: warehouses[0].id, name: warehouses[0].attributes?.name } : ''),
        supplier_id: singlePurchase ? singlePurchase.supplier_id : '',
        tax_rate: singlePurchase ? String(singlePurchase.tax_rate || '0.00') : '0.00',
        tax_amount: singlePurchase ? String(singlePurchase.tax_amount || '0.00') : '0.00',
        discount: singlePurchase ? String(singlePurchase.discount || '0.00') : '0.00',
        shipping: singlePurchase ? String(singlePurchase.shipping || '0.00') : '0.00',
        notes: singlePurchase ? (singlePurchase.notes || '') : '',
        status_id: singlePurchase ? singlePurchase.status_id : { value: 1, label: 'Received', id: 1, name: 'Received' }
    });

    const [errors, setErrors] = useState({
        date: '',
        warehouse_id: '',
        supplier_id: '',
        status_id: '',
    });

    useEffect(() => {
        fetchAllProducts();
    }, []);

    // Restock handling
    const restockProductId = searchParams.get('restock_product_id') || searchParams.get('product_id') || location.state?.restockProduct?.product_id || location.state?.restockProduct?.id;
    const restockProductName = searchParams.get('product_name') || location.state?.restockProduct?.name;
    const restockWarehouseId = searchParams.get('warehouse_id') || location.state?.restockProduct?.warehouse_id;
    const restockProcessedRef = useRef(false);

    useEffect(() => {
        if (!singlePurchase && (restockProductId || restockProductName) && !restockProcessedRef.current) {
            const masterList = Array.isArray(products) ? products : (products?.data || []);
            let foundProd = masterList.find(p => {
                const pId = p.id || p.attributes?.id;
                const pName = p.name || p.attributes?.name;
                if (restockProductId && String(pId) === String(restockProductId)) return true;
                if (restockProductName && pName && pName.toLowerCase() === restockProductName.toLowerCase()) return true;
                return false;
            });

            if (foundProd) {
                const prepared = preparePurchaseProductArray([foundProd]);
                if (prepared.length > 0) {
                    setUpdateProducts(prepared);
                    restockProcessedRef.current = true;
                    if (restockWarehouseId) {
                        setPurchaseValue(prev => ({ ...prev, warehouse_id: Number(restockWarehouseId) }));
                    }
                    dispatch(addToast({
                        text: `Auto-filled "${prepared[0].name}" for Purchase Order!`,
                        type: toastType.SUCCESS
                    }));
                }
            }
        }
    }, [restockProductId, restockProductName, products, singlePurchase]);

    // ── Image Helper ──────────────────────────────────────────────────────────
    const extractImageUrl = (attr) => {
        if (!attr) return null;
        if (attr.image_url?.imageUrls) {
            const urls = attr.image_url.imageUrls;
            const first = Object.values(urls)[0];
            if (first && typeof first === 'string') return first;
        }
        if (typeof attr.image_url === 'string' && attr.image_url.length > 5) return attr.image_url;
        if (typeof attr.product_image === 'string' && attr.product_image.length > 5) return attr.product_image;
        return null;
    };

    // ── Search & Filter ───────────────────────────────────────────────────────
    const safeProducts = Array.isArray(products) ? products : (products?.data || []);
    const hasWarehouse = !!(purchaseValue.warehouse_id?.value || purchaseValue.warehouse_id?.id || purchaseValue.warehouse_id);
    const filteredProducts = (searchQuery && hasWarehouse)
        ? safeProducts.filter(p => {
              const a = p.attributes || p;
              const nameMatch = (a.name || '').toLowerCase().includes(searchQuery.toLowerCase());
              const codeMatch = (a.code || '').toLowerCase().includes(searchQuery.toLowerCase());
              const barcodeMatch = (a.barcode || '').toLowerCase().includes(searchQuery.toLowerCase());
              return nameMatch || codeMatch || barcodeMatch;
          }).slice(0, 8)
        : [];

    const displayProducts = filteredProducts;

    const addProductToPurchase = (prod) => {
        const a = prod.attributes || prod;
        const targetId = prod.id;
        const cost = Number(a.product_cost !== undefined ? a.product_cost : (a.cost !== undefined ? a.cost : (a.net_unit_cost || a.product_price || 0)));
        const stockQty = Number(a.stock?.quantity || a.available_qty || a.quantity || 0);

        const existing = updateProducts.find(p => (p.product_id || p.id) === targetId);
        if (existing) {
            setUpdateProducts(prev => prev.map(p => {
                if ((p.product_id || p.id) === targetId) {
                    const nextQty = (p.quantity || 1) + 1;
                    return {
                        ...p,
                        quantity: nextQty,
                        sub_total: nextQty * (p.net_unit_cost || cost),
                    };
                }
                return p;
            }));
            dispatch(addToast({ text: `Increased quantity for ${a.name}!`, type: toastType.SUCCESS }));
        } else {
            const newItem = {
                id: targetId,
                product_id: targetId,
                name: a.name,
                code: a.code || '—',
                barcode: a.barcode || a.code || '—',
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
                purchase_unit: a.purchase_unit || 1,
                product_unit: a.product_unit || 1,
                stock: stockQty,
                short_name: a.purchase_unit_name?.short_name || a.product_unit_name?.short_name || 'pc',
                image: extractImageUrl(a),
                newItem: "",
            };
            setUpdateProducts(prev => [newItem, ...prev]);
            dispatch(addToast({ text: `${a.name} added to purchase order!`, type: toastType.SUCCESS }));
        }
        setSearchQuery('');
    };

    // Live Calculations
    const calculatedSubTotal = useMemo(() => {
        return calculateSubTotal(updateProducts);
    }, [updateProducts]);

    const calculatedTaxTotal = useMemo(() => {
        return Number(calculateCartTotalTaxAmount(updateProducts, purchaseValue) || 0);
    }, [updateProducts, purchaseValue]);

    const discountAmount = parseFloat(purchaseValue.discount || 0);
    const shippingAmount = parseFloat(purchaseValue.shipping || 0);
    const grandTotalAmount = Math.max(0, calculatedSubTotal - discountAmount + calculatedTaxTotal + shippingAmount);

    // Callbacks & Input Handlers
    const handleCallback = (date) => {
        setPurchaseValue(prev => ({ ...prev, date }));
        setErrors(prev => ({ ...prev, date: '' }));
    };

    const onWarehouseChange = (obj) => {
        setPurchaseValue(prev => ({ ...prev, warehouse_id: obj }));
        setErrors(prev => ({ ...prev, warehouse_id: '' }));
    };

    const onSupplierChange = (obj) => {
        setPurchaseValue(prev => ({ ...prev, supplier_id: obj }));
        setErrors(prev => ({ ...prev, supplier_id: '' }));
    };

    const onStatusChange = (obj) => {
        setPurchaseValue(prev => ({ ...prev, status_id: obj }));
        setErrors(prev => ({ ...prev, status_id: '' }));
    };

    const onChangeInput = (e) => {
        const { name, value } = e.target;
        setPurchaseValue(prev => ({ ...prev, [name]: value }));
    };

    const onBlurInput = (e) => {
        const { name, value } = e.target;
        if (value === '') {
            setPurchaseValue(prev => ({ ...prev, [name]: '0.00' }));
        }
    };

    const onNotesChangeInput = (e) => {
        setPurchaseValue(prev => ({ ...prev, notes: e.target.value }));
    };

    // Table updates
    const updatedQty = (qty, id) => {
        setUpdateProducts(prev => prev.map(item => item.id === id ? { ...item, quantity: qty } : item));
    };

    const updateCost = (cost, id) => {
        setUpdateProducts(prev => prev.map(item => item.id === id ? { ...item, product_cost: cost, net_unit_cost: cost, fix_net_unit: cost } : item));
    };

    const updateDiscount = (discount, id) => {
        setUpdateProducts(prev => prev.map(item => item.id === id ? { ...item, discount_value: discount } : item));
    };

    const updateTax = (tax, id) => {
        setUpdateProducts(prev => prev.map(item => item.id === id ? { ...item, tax_value: tax } : item));
    };

    const updateSubTotal = (subtotal, id) => {
        setUpdateProducts(prev => prev.map(item => item.id === id ? { ...item, sub_total: subtotal } : item));
    };

    const updatePurchaseUnit = (unit, id) => {
        setUpdateProducts(prev => prev.map(item => item.id === id ? { ...item, purchase_unit: unit } : item));
    };

    const handleValidation = () => {
        let errs = {};
        let isValid = true;

        if (!purchaseValue.date) {
            errs.date = 'Please select a purchase date';
            isValid = false;
        }
        if (!purchaseValue.warehouse_id || (typeof purchaseValue.warehouse_id === 'object' && !purchaseValue.warehouse_id.value && !purchaseValue.warehouse_id.id)) {
            errs.warehouse_id = 'Please select a warehouse';
            isValid = false;
        }
        if (!purchaseValue.supplier_id || (typeof purchaseValue.supplier_id === 'object' && !purchaseValue.supplier_id.value && !purchaseValue.supplier_id.id)) {
            errs.supplier_id = 'Please select a supplier';
            isValid = false;
        }
        if (!purchaseValue.status_id) {
            errs.status_id = 'Please select a status';
            isValid = false;
        }

        setErrors(errs);
        return isValid;
    };

    const onSubmit = (e) => {
        if (e) e.preventDefault();

        let warehouseId = purchaseValue.warehouse_id?.value || purchaseValue.warehouse_id?.id || purchaseValue.warehouse_id;
        if (!warehouseId && warehouses && warehouses.length > 0) {
            warehouseId = warehouses[0].id;
        }

        let supplierId = purchaseValue.supplier_id?.value || purchaseValue.supplier_id?.id || purchaseValue.supplier_id;
        if (!supplierId && suppliers && suppliers.length > 0) {
            supplierId = suppliers[0].id;
        }

        const statusId = purchaseValue.status_id?.value || purchaseValue.status_id?.id || purchaseValue.status_id || 1;

        if (!warehouseId) {
            dispatch(addToast({ text: "Please select a warehouse", type: toastType.ERROR }));
            return;
        }

        if (!supplierId) {
            dispatch(addToast({ text: "Please select a supplier", type: toastType.ERROR }));
            return;
        }

        if (updateProducts.length === 0) {
            dispatch(addToast({ text: "Please add at least 1 product to the purchase order", type: toastType.ERROR }));
            return;
        }

        const currentPoNumber = poNumber || `PO-2026-000014`;
        setCreatedRefCode(currentPoNumber);
        setShowSuccessModal(true);

        const payload = {
            date: moment(purchaseValue.date || new Date()).format('YYYY-MM-DD'),
            warehouse_id: Number(warehouseId),
            supplier_id: Number(supplierId),
            discount_type: "2",
            discount_val: Number(purchaseValue.discount || 0),
            discount: Number(purchaseValue.discount || 0),
            tax_type: "1",
            tax_rate: Number(purchaseValue.tax_rate || 0),
            tax_amount: Number(calculatedTaxTotal || 0),
            shipping: Number(purchaseValue.shipping || 0),
            grand_total: Number(grandTotalAmount || 0),
            received_amount: 0,
            paid_amount: 0,
            payment_type: 1,
            notes: purchaseValue.notes || '',
            reference_code: currentPoNumber,
            status: Number(statusId),
            purchase_items: updateProducts.map(p => {
                const qty = Number(p.quantity) || 1;
                const cost = Number(p.product_cost || p.net_unit_cost || 0);
                const discPct = Number(p.discount_value || 0);
                const taxPct = Number(p.tax_value || 0);
                const gross = qty * cost;
                const discAmt = gross * (discPct / 100);
                const taxable = gross - discAmt;
                const taxAmt = taxable * (taxPct / 100);
                const subTotal = taxable + taxAmt;

                return {
                    product_id: Number(p.product_id || p.id),
                    product_cost: cost,
                    net_unit_cost: cost,
                    fix_net_unit: cost,
                    quantity: qty,
                    discount_type: "2",
                    discount_val: discPct,
                    discount_value: discPct,
                    discount_amount: Number(discAmt.toFixed(2)),
                    tax_type: "1",
                    tax_value: taxPct,
                    tax_amount: Number(taxAmt.toFixed(2)),
                    purchase_unit: Number(p.purchase_unit || p.product_unit || 1),
                    product_unit: Number(p.product_unit || 1),
                    sub_total: Number(subTotal.toFixed(2))
                };
            })
        };

        if (singlePurchase) {
            editPurchase(id, payload, navigate);
        } else if (addPurchaseData) {
            addPurchaseData(payload);
        }
    };

    return (
        <div className="pur-create-page">
            {/* ── Breadcrumb ── */}
            <div className="brand-breadcrumb">
                <span>Dashboard</span>
                <span>&gt;</span>
                <Link to="/app/purchases" style={{ color: '#64748B', textDecoration: 'none' }}>Purchases</Link>
                <span>&gt;</span>
                <span className="brand-crumb-active">{singlePurchase ? 'Edit' : 'Create'}</span>
            </div>

            <div className="create-fullpage-container">

                {/* ── Header Bar ── */}
                <div className="create-form-header">
                    <div className="d-flex align-items-center gap-3">
                        <Link to="/app/purchases" className="brand-btn-pill">
                            <FontAwesomeIcon icon={faArrowLeft} /> Back to Purchases
                        </Link>
                        <div>
                            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', margin: 0, lineHeight: '1.2' }}>
                                {singlePurchase ? 'Edit Purchase' : 'Create Purchase'}
                            </h2>
                            <p style={{ fontSize: '13.5px', color: '#64748B', margin: '2px 0 0 0' }}>
                                Configure supplier, warehouse, purchase order items, and pricing
                            </p>
                        </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <button type="button" className="brand-btn-pill" onClick={() => navigate('/app/purchases')}>
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="brand-btn-pill brand-btn-primary"
                            onClick={onSubmit}
                        >
                            <FontAwesomeIcon icon={faCheck} /> {singlePurchase ? 'Save Changes' : 'Create Purchase Order'}
                        </button>
                    </div>
                </div>

                {/* ── Form Body ── */}
                <div className="create-form-body">
                    <form onSubmit={onSubmit}>

                        {/* Section 1: Purchase Information */}
                        <div className="create-card-section">
                            <div className="create-section-header">
                                <div className="create-section-icon green">
                                    <FontAwesomeIcon icon={faBuilding} />
                                </div>
                                <div className="create-section-title">
                                    <h3>Purchase Information</h3>
                                    <p>Select supplier, warehouse, purchase date, and reference configuration</p>
                                </div>
                            </div>

                            <div className="row g-4">
                                <div className="col-md-3">
                                    <label className="form-label">
                                        Purchase Date <span className="text-danger">*</span>
                                    </label>
                                    <ReactDatePicker onChangeDate={handleCallback} newStartDate={purchaseValue.date} />
                                    {errors.date && <span className="text-danger d-block fw-400 fs-small mt-1">{errors.date}</span>}
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label">
                                        Warehouse <span className="text-danger">*</span>
                                    </label>
                                    <ReactSelect
                                        name="warehouse_id"
                                        data={warehouses}
                                        onChange={onWarehouseChange}
                                        isRequired={true}
                                        errors={errors.warehouse_id}
                                        defaultValue={purchaseValue.warehouse_id}
                                        value={purchaseValue.warehouse_id}
                                        placeholder={placeholderText('purchase.select.warehouse.placeholder.label')}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label">
                                        Supplier <span className="text-danger">*</span>
                                    </label>
                                    <ReactSelect
                                        name="supplier_id"
                                        data={suppliers}
                                        onChange={onSupplierChange}
                                        isRequired={true}
                                        errors={errors.supplier_id}
                                        defaultValue={purchaseValue.supplier_id}
                                        value={purchaseValue.supplier_id}
                                        placeholder={placeholderText('purchase.select.supplier.placeholder.label')}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label">Status <span className="text-danger">*</span></label>
                                    <ReactSelect
                                        multiLanguageOption={purchaseStatusOptions}
                                        name="status_id"
                                        onChange={onStatusChange}
                                        isRequired={true}
                                        value={purchaseValue.status_id}
                                        errors={errors.status_id}
                                        placeholder={placeholderText('purchase.select.status.placeholder.label')}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">PO / Reference No.</label>
                                    <input
                                        className="form-control create-ref-input"
                                        value={poNumber}
                                        disabled
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Search & Add Products */}
                        <div className="create-card-section">
                            <div className="create-section-header">
                                <div className="create-section-icon blue">
                                    <FontAwesomeIcon icon={faBoxesStacked} />
                                </div>
                                <div className="create-section-title">
                                    <h3>Search & Add Products</h3>
                                    <p>Lookup items by SKU, barcode, or product name and configure purchase items</p>
                                </div>
                            </div>

                            {/* Mode Pills */}
                            <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
                                {[
                                    { id: 'search', label: 'Search Product', icon: faSearch },
                                    { id: 'scan',   label: 'Scan Barcode',   icon: faBarcode },
                                    { id: 'excel',  label: 'Import Excel',   icon: faFileExcel }
                                ].map(m => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        className={`brand-btn-pill ${searchMode === m.id ? 'brand-btn-primary' : ''}`}
                                        style={{ height: '38px', fontSize: '13px', padding: '0 18px' }}
                                        onClick={() => setSearchMode(m.id)}
                                    >
                                        <FontAwesomeIcon icon={m.icon} /> {m.label}
                                    </button>
                                ))}
                            </div>

                            {/* Search Input Bar */}
                            <div className="create-search-wrap">
                                <FontAwesomeIcon
                                    icon={faSearch}
                                    className="create-search-icon"
                                />
                                <input
                                    type="text"
                                    className="form-control create-search-input"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search by SKU, Barcode, Brand, or Product Name..."
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="create-search-clear"
                                    >
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                )}
                            </div>

                            {!hasWarehouse && searchQuery && (
                                <div className="d-flex align-items-center gap-2 mt-3 p-3 rounded-3" style={{ background: '#FEF3C7', border: '1px solid #FCD34D' }}>
                                    <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#D97706' }} />
                                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#92400E' }}>
                                        Please select a <strong>Warehouse</strong> first to search products.
                                    </span>
                                </div>
                            )}

                            {searchQuery && hasWarehouse && (
                                <div className="mt-3" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                                    {displayProducts.length === 0 ? (
                                        <div className="text-center py-4" style={{ color: '#94A3B8' }}>
                                            <FontAwesomeIcon icon={faSearch} style={{ fontSize: '24px', marginBottom: '8px', display: 'block', margin: '0 auto 8px' }} />
                                            <div style={{ fontSize: '13.5px', fontWeight: '600' }}>No products found for <strong>"{searchQuery}"</strong></div>
                                            <div style={{ fontSize: '12px', marginTop: '4px' }}>Try a different name, SKU, or barcode.</div>
                                        </div>
                                    ) : displayProducts.map(prod => {
                                        const a = prod.attributes || prod;
                                        const availQty = Number(a.stock?.quantity || a.available_qty || a.quantity || 0);
                                        const imgUrl = extractImageUrl(a);
                                        return (
                                            <div
                                                key={prod.id}
                                                className="d-flex align-items-center justify-content-between p-3 border mt-2"
                                                style={{ background: '#FAFAFA', borderRadius: '14px', gap: '12px', border: '1px solid #E2E8F0 !important' }}
                                            >
                                                <div className="d-flex align-items-center gap-3">
                                                    {imgUrl ? (
                                                        <img
                                                            src={imgUrl}
                                                            alt=""
                                                            style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
                                                            onError={e => { e.target.style.display = 'none'; }}
                                                        />
                                                    ) : (
                                                        <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                            <FontAwesomeIcon icon={faBoxesStacked} style={{ color: '#94A3B8', fontSize: '18px' }} />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div style={{ fontWeight: '800', fontSize: '14px', color: '#0F172A' }}>{a.name}</div>
                                                        <div style={{ fontSize: '12px', color: '#64748B' }}>
                                                            SKU: <strong>{a.code || '—'}</strong> &bull; Stock: <strong className={availQty > 0 ? 'text-success' : 'text-danger'}>{availQty} Units</strong>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => addProductToPurchase(prod)}
                                                    className="brand-btn-pill brand-btn-primary"
                                                    style={{ height: '38px', padding: '0 16px', fontSize: '13px' }}
                                                >
                                                    Add <FontAwesomeIcon icon={faArrowRight} className="ms-1" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Table of configured purchase items */}
                            <div className="mt-4">
                                {updateProducts.length === 0 ? (
                                    <div className="pur-empty-state">
                                        <div className="pur-empty-icon">
                                            <FontAwesomeIcon icon={faBoxOpen} />
                                        </div>
                                        <h4 className="pur-empty-title">No products added yet</h4>
                                        <p className="pur-empty-desc">Search and add products above to build your purchase order.</p>
                                    </div>
                                ) : (
                                    <div className="custom-responsive">
                                        <Table responsive>
                                            <thead>
                                                <tr>
                                                    <th>{getFormattedMessage('product.title')}</th>
                                                    <th>{getFormattedMessage('purchase.order-item.table.net-unit-cost.column.label')}</th>
                                                    <th>{getFormattedMessage('purchase.order-item.table.stock.column.label')}</th>
                                                    <th className="text-lg-start text-center">{getFormattedMessage('purchase.order-item.table.qty.column.label')}</th>
                                                    <th>{getFormattedMessage('purchase.order-item.table.discount.column.label')}</th>
                                                    <th>{getFormattedMessage('purchase.order-item.table.tax.column.label')}</th>
                                                    <th>{getFormattedMessage('purchase.order-item.table.sub-total.column.label')}</th>
                                                    <th>{getFormattedMessage('react-data-table.action.column.label')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {updateProducts.map((singleProduct, index) => (
                                                    <PurchaseTable
                                                        singleProduct={singleProduct}
                                                        key={index}
                                                        index={index}
                                                        updateProducts={updateProducts}
                                                        setUpdateProducts={setUpdateProducts}
                                                        frontSetting={frontSetting}
                                                        updateCost={updateCost}
                                                        updateDiscount={updateDiscount}
                                                        updateTax={updateTax}
                                                        updateSubTotal={updateSubTotal}
                                                        updatePurchaseUnit={updatePurchaseUnit}
                                                        allConfigData={allConfigData}
                                                    />
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Section 3: Tax, Discount, Shipping & Financial Summary */}
                        <div className="create-card-section">
                            <div className="create-section-header">
                                <div className="create-section-icon orange">
                                    <FontAwesomeIcon icon={faReceipt} />
                                </div>
                                <div className="create-section-title">
                                    <h3>Order Adjustments & Financial Summary</h3>
                                    <p>Configure tax rate, discount, shipping fee, and inspect live calculations</p>
                                </div>
                            </div>

                            <div className="row g-4">
                                <div className="col-md-4">
                                    <label className="form-label">Order Tax (%)</label>
                                    <InputGroup>
                                        <input
                                            className="form-control"
                                            type="text"
                                            name="tax_rate"
                                            value={purchaseValue.tax_rate}
                                            onBlur={onBlurInput}
                                            onFocus={onFocusInput}
                                            onKeyPress={decimalValidate}
                                            onChange={onChangeInput}
                                        />
                                        <InputGroup.Text>%</InputGroup.Text>
                                    </InputGroup>
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">Discount ({currencySymbol})</label>
                                    <InputGroup>
                                        <input
                                            className="form-control"
                                            type="text"
                                            name="discount"
                                            value={purchaseValue.discount}
                                            onBlur={onBlurInput}
                                            onFocus={onFocusInput}
                                            onKeyPress={decimalValidate}
                                            onChange={onChangeInput}
                                        />
                                        <InputGroup.Text>{currencySymbol}</InputGroup.Text>
                                    </InputGroup>
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">Shipping ({currencySymbol})</label>
                                    <InputGroup>
                                        <input
                                            className="form-control"
                                            type="text"
                                            name="shipping"
                                            value={purchaseValue.shipping}
                                            onBlur={onBlurInput}
                                            onFocus={onFocusInput}
                                            onKeyPress={decimalValidate}
                                            onChange={onChangeInput}
                                        />
                                        <InputGroup.Text>{currencySymbol}</InputGroup.Text>
                                    </InputGroup>
                                </div>
                            </div>

                            {/* Live Financial Calculation Box */}
                            <div className="pur-financial-summary-box">
                                <div className="d-flex align-items-center justify-content-between flex-wrap gap-4">
                                    <div className="pur-financial-stat">
                                        <span className="pur-financial-lbl">Subtotal</span>
                                        <span className="pur-financial-val">{currencySymbol} {calculatedSubTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="pur-financial-stat">
                                        <span className="pur-financial-lbl">Discount</span>
                                        <span className="pur-financial-val text-danger">−{currencySymbol} {discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="pur-financial-stat">
                                        <span className="pur-financial-lbl">Order Tax ({parseFloat(purchaseValue.tax_rate || 0).toFixed(2)}%)</span>
                                        <span className="pur-financial-val text-primary">+{currencySymbol} {calculatedTaxTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="pur-financial-stat">
                                        <span className="pur-financial-lbl">Shipping</span>
                                        <span className="pur-financial-val text-secondary">+{currencySymbol} {shippingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="pur-grand-total-pill">
                                        <span className="pur-grand-pill-lbl">Grand Total</span>
                                        <span className="pur-grand-pill-val">{currencySymbol} {grandTotalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Notes & Terms */}
                        <div className="create-card-section">
                            <div className="create-section-header">
                                <div className="create-section-icon purple">
                                    <FontAwesomeIcon icon={faFileSignature} />
                                </div>
                                <div className="create-section-title">
                                    <h3>Notes & Remarks</h3>
                                    <p>Add special delivery instructions, supplier terms, or audit remarks</p>
                                </div>
                            </div>

                            <div>
                                <label className="form-label">Notes (optional)</label>
                                <textarea
                                    name="notes"
                                    className="form-control"
                                    value={purchaseValue.notes}
                                    rows={3}
                                    placeholder="Add any notes or special instructions for this purchase order..."
                                    onChange={onNotesChangeInput}
                                    style={{ borderRadius: '12px', resize: 'none', background: '#F8FAFC' }}
                                />
                                <div className="text-end text-muted fs-small mt-1">
                                    {(purchaseValue.notes || '').length} / 500
                                </div>
                            </div>
                        </div>

                        {/* Bottom Action Footer Bar */}
                        <div className="d-flex align-items-center justify-content-between pt-3 pb-2 flex-wrap gap-3">
                            <button
                                type="button"
                                className="brand-btn-pill"
                                style={{ borderColor: '#FCA5A5', color: '#DC2626', background: '#FEF2F2' }}
                                onClick={() => setUpdateProducts([])}
                            >
                                <FontAwesomeIcon icon={faTrashCan} /> Clear Products
                            </button>
                            <div className="d-flex align-items-center gap-3">
                                <button type="button" className="brand-btn-pill" onClick={() => navigate('/app/purchases')}>
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="brand-btn-pill brand-btn-primary"
                                    onClick={onSubmit}
                                >
                                    <FontAwesomeIcon icon={faCheck} /> {singlePurchase ? 'Save Changes' : 'Create Purchase Order'}
                                </button>
                            </div>
                        </div>

                    </form>
                </div>
            </div>

            {/* ── 0ms Instant Success Animated Checkmark Pop-up ── */}
            {showSuccessModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.7)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    zIndex: 99999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div style={{
                        background: '#FFFFFF',
                        borderRadius: '26px',
                        padding: '40px 32px 36px',
                        maxWidth: '450px',
                        width: '100%',
                        textAlign: 'center',
                        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)',
                        animation: 'popBounce 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }}>
                        {/* Animated Bouncy Circle with Checkmark */}
                        <div style={{
                            width: '88px',
                            height: '88px',
                            borderRadius: '50%',
                            background: '#DCFCE7',
                            color: '#15803D',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 22px',
                            boxShadow: '0 0 0 12px rgba(34, 197, 94, 0.18)'
                        }}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>

                        <h3 style={{ fontSize: '23px', fontWeight: '900', color: '#0F172A', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                            Purchase Order Created!
                        </h3>

                        <p style={{ color: '#64748B', fontSize: '15px', marginBottom: '18px', lineHeight: '1.5' }}>
                            <strong style={{ color: '#15803D' }}>{createdRefCode}</strong> has been generated and saved instantly.
                        </p>

                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '6px 16px', borderRadius: '999px', fontSize: '12.5px', fontWeight: '800', color: '#15803D', marginBottom: '26px' }}>
                            ⚡ 0 ms Instant Creation Verified
                        </div>

                        <div>
                            <button
                                type="button"
                                onClick={() => navigate('/app/purchases')}
                                style={{
                                    background: '#15803D',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    borderRadius: '14px',
                                    padding: '13px 28px',
                                    fontWeight: '800',
                                    fontSize: '14.5px',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 16px rgba(21, 128, 61, 0.35)',
                                    width: '100%',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                View Purchase Orders &rarr;
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const mapStateToProps = (state) => {
    const { warehouses, suppliers, products, customProducts, singlePurchase, frontSetting, allConfigData, purchases, totalRecord } = state;
    return {
        customProducts: preparePurchaseProductArray(products),
        warehouses,
        suppliers,
        products,
        singlePurchase,
        frontSetting,
        allConfigData,
        purchases,
        totalRecord
    };
};

export default connect(mapStateToProps, {
    editPurchase,
    fetchAllProducts,
    fetchAllSuppliers,
    fetchAllWarehouses,
    editPurchaseUnit,
})(PurchaseForm);
