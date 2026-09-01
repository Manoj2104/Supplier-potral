import React, { useState, useEffect, useMemo } from 'react';
import { connect, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import moment from 'moment';
import { Table } from 'react-bootstrap-v5';
import { InputGroup } from 'react-bootstrap-v5';
import { editPurchaseReturn } from '../../store/action/purchaseReturnAction';
import { fetchAllProducts, fetchProductsByWarehouse } from '../../store/action/productAction';
import { fetchAllSuppliers } from '../../store/action/supplierAction';
import { fetchAllWarehouses } from '../../store/action/warehouseAction';
import { editPurchaseUnit } from '../../store/action/purchaseProductAction';
import { addToast } from '../../store/action/toastAction';
import { toastType, saleStatusOptions, apiBaseURL } from '../../constants';
import apiConfig from '../../config/apiConfig';
import ProductSearch from '../../shared/components/product-cart/search/ProductSearch';
import ReactDatePicker from '../../shared/datepicker/ReactDatePicker';
import ReactSelect from '../../shared/select/reactSelect';
import PurchaseReturnTable from '../../shared/components/purchase/PurchaseTable';
import { preparePurchaseReturnArray } from './preparePurchaseReturnArray';
import {
    getFormattedMessage,
    placeholderText,
    decimalValidate,
    onFocusInput,
    getFormattedOptions
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
import './CreatePurchaseReturnPremium.css';

const PurchaseReturnForm = (props) => {
    const {
        addPurchaseReturnData,
        id,
        editPurchaseReturn,
        customProducts,
        singlePurchase,
        warehouses = [],
        suppliers = [],
        fetchProductsByWarehouse,
        products = [],
        frontSetting,
        allConfigData,
        purchases = [],
        totalRecord = 0,
        editPurchaseUnit,
    } = props;

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const currencySymbol = frontSetting?.value?.currency_symbol || "₹";

    // Products in Return Cart
    const [updateProducts, setUpdateProducts] = useState([]);
    const [searchMode, setSearchMode] = useState('search');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (singlePurchase && singlePurchase.purchase_return_items) {
            setUpdateProducts(singlePurchase.purchase_return_items);
        }
    }, [singlePurchase]);

    // Auto select warehouse & supplier
    useEffect(() => {
        if (!singlePurchase && warehouses && warehouses.length > 0 && !purchaseValue.warehouse_id) {
            const firstWh = warehouses[0];
            const whObj = firstWh.value !== undefined ? firstWh : { label: firstWh.attributes?.name || firstWh.name, value: firstWh.id };
            setPurchaseValue(prev => ({ ...prev, warehouse_id: whObj }));
            if (whObj.value || firstWh.id) {
                fetchProductsByWarehouse(whObj.value || firstWh.id);
            }
        }
    }, [warehouses]);

    useEffect(() => {
        if (!singlePurchase && suppliers && suppliers.length > 0 && !purchaseValue.supplier_id) {
            const firstSup = suppliers[0];
            const supObj = firstSup.value !== undefined ? firstSup : { label: firstSup.attributes?.name || firstSup.name, value: firstSup.id };
            setPurchaseValue(prev => ({ ...prev, supplier_id: supObj }));
        }
    }, [suppliers]);

    // Reference Number
    const [refNumber, setRefNumber] = useState('');

    useEffect(() => {
        if (singlePurchase) {
            setRefNumber(singlePurchase.reference_code || `PR-2026${String(singlePurchase.id).padStart(5, '0')}`);
        } else {
            setRefNumber(`PR-${moment().format('YYYYMMDD')}-${Math.floor(1000 + Math.random() * 9000)}`);
        }
    }, [singlePurchase]);

    // Original Purchases List for optional quick selection
    const [purchaseList, setPurchaseList] = useState([]);
    const [selectedOriginalPurchase, setSelectedOriginalPurchase] = useState('');

    useEffect(() => {
        apiConfig.get(apiBaseURL.PURCHASES)
            .then(res => {
                if (res.data && res.data.data) {
                    setPurchaseList(res.data.data);
                }
            })
            .catch(err => console.error("Error fetching purchases for return:", err));
    }, []);

    const onOriginalPurchaseChange = async (e) => {
        const purchaseId = e.target.value;
        setSelectedOriginalPurchase(purchaseId);
        if (!purchaseId) return;

        try {
            // Try fetching edit data or show data
            let res;
            try {
                res = await apiConfig.get(`${apiBaseURL.PURCHASES}/${purchaseId}/edit`);
            } catch (e1) {
                res = await apiConfig.get(`${apiBaseURL.PURCHASES}/${purchaseId}`);
            }

            const rawData = res.data?.data;
            const pData = rawData?.attributes || rawData;

            if (pData) {
                // 1. Auto-select Warehouse
                const targetWId = pData.warehouse_id || pData.warehouse?.id;
                if (targetWId && warehouses && warehouses.length > 0) {
                    const matchedW = warehouses.find(w => (w.id === targetWId || w.value === targetWId));
                    if (matchedW) {
                        const whObj = matchedW.value !== undefined ? matchedW : { label: matchedW.name || matchedW.attributes?.name, value: matchedW.id };
                        setPurchaseValue(prev => ({ ...prev, warehouse_id: whObj }));
                        if (whObj.value) fetchProductsByWarehouse(whObj.value);
                    }
                }

                // 2. Auto-select Supplier
                const targetSId = pData.supplier_id || pData.supplier?.id;
                if (targetSId && suppliers && suppliers.length > 0) {
                    const matchedS = suppliers.find(s => (s.id === targetSId || s.value === targetSId));
                    if (matchedS) {
                        const supObj = matchedS.value !== undefined ? matchedS : { label: matchedS.name || matchedS.attributes?.name, value: matchedS.id };
                        setPurchaseValue(prev => ({ ...prev, supplier_id: supObj }));
                    }
                }

                // 3. Extract Purchase Items
                const rawItems = pData.purchase_items || pData.purchaseItems || pData.purchase_return_items || [];
                const formattedItems = rawItems.map(item => {
                    const itemAttrs = item.attributes || item;
                    const prod = itemAttrs.product?.attributes || itemAttrs.product || {};
                    const cost = parseFloat(itemAttrs.net_unit_cost || itemAttrs.product_cost || itemAttrs.net_unit_price || prod.product_cost || 0);
                    const qty = parseFloat(itemAttrs.quantity || 1);
                    const discType = String(itemAttrs.discount_type || "2");
                    const discVal = parseFloat(itemAttrs.discount_value || 0);
                    const discAmt = parseFloat(itemAttrs.discount_amount || 0);
                    const taxType = String(itemAttrs.tax_type || "1");
                    const taxVal = parseFloat(itemAttrs.tax_value || 0);
                    const taxAmt = parseFloat(itemAttrs.tax_amount || 0);
                    const sub = parseFloat(itemAttrs.sub_total || (cost * qty - discAmt + taxAmt));
                    const unitObj = itemAttrs.purchase_unit || prod.purchase_unit_name || prod.product_unit_name;
                    const unitShort = typeof unitObj === 'object' ? (unitObj.short_name || unitObj.name || 'pc') : (unitObj || 'pc');

                    return {
                        id: itemAttrs.product_id || prod.id || itemAttrs.id,
                        product_id: itemAttrs.product_id || prod.id || itemAttrs.id,
                        code: prod.code || prod.product_code || itemAttrs.code || '—',
                        name: prod.name || itemAttrs.name || 'Product',
                        fix_net_unit: cost,
                        net_unit_cost: cost,
                        net_cost: cost,
                        product_cost: cost,
                        stock: prod.stock?.quantity ?? prod.in_stock ?? 100,
                        quantity: qty,
                        discount_type: discType,
                        discount_value: discVal,
                        discount_amount: discAmt,
                        tax_type: taxType,
                        tax_value: taxVal,
                        tax_amount: taxAmt,
                        sub_total: sub,
                        purchase_unit: (typeof unitObj === 'object' ? unitObj.id : unitObj) || 1,
                        short_name: unitShort,
                        newItem: ''
                    };
                });

                setUpdateProducts(formattedItems);
                setErrors({});
                dispatch(addToast({
                    text: `Successfully auto-filled ${formattedItems.length} items from Purchase Order!`,
                    type: toastType.SUCCESS
                }));
            }
        } catch (err) {
            console.error("Error auto-filling from purchase order:", err);
            dispatch(addToast({
                text: "Failed to load original purchase order details",
                type: toastType.ERROR
            }));
        }
    };

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
        status_id: singlePurchase ? singlePurchase.status_id : { label: getFormattedMessage("status.filter.received.label"), value: 1 }
    });

    const [errors, setErrors] = useState({
        date: '',
        warehouse_id: '',
        supplier_id: '',
        status_id: '',
    });

    const statusFilterOptions = getFormattedOptions(saleStatusOptions);

    useEffect(() => {
        if (purchaseValue.warehouse_id?.value) {
            fetchProductsByWarehouse(purchaseValue.warehouse_id.value);
        }
    }, [purchaseValue.warehouse_id]);

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

    const addProductToReturn = (prod) => {
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
            dispatch(addToast({ text: `${a.name} added to return list!`, type: toastType.SUCCESS }));
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
            errs.date = 'Please select a return date';
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
        if (updateProducts.length === 0) {
            dispatch(addToast({
                text: 'Please add at least one product to return.',
                type: toastType.ERROR
            }));
            isValid = false;
        }

        setErrors(errs);
        return isValid;
    };

    const onSubmit = (e) => {
        if (e) e.preventDefault();
        if (!handleValidation()) return;

        const warehouseId = purchaseValue.warehouse_id?.value || purchaseValue.warehouse_id?.id || purchaseValue.warehouse_id;
        const supplierId = purchaseValue.supplier_id?.value || purchaseValue.supplier_id?.id || purchaseValue.supplier_id;
        const statusId = purchaseValue.status_id?.value || purchaseValue.status_id?.id || purchaseValue.status_id || 1;

        const payload = {
            date: moment(purchaseValue.date).toDate(),
            warehouse_id: Number(warehouseId),
            supplier_id: Number(supplierId),
            discount: Number(purchaseValue.discount || 0),
            tax_rate: Number(purchaseValue.tax_rate || 0),
            tax_amount: Number(calculatedTaxTotal || 0),
            purchase_return_items: updateProducts.map(p => {
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
            }),
            shipping: Number(purchaseValue.shipping || 0),
            grand_total: Number(grandTotalAmount || 0),
            received_amount: '',
            paid_amount: '',
            payment_type: 0,
            notes: purchaseValue.notes || '',
            reference_code: refNumber,
            status: Number(statusId),
            payment_status: 2,
        };

        if (singlePurchase) {
            editPurchaseReturn(id, payload, navigate);
        } else if (addPurchaseReturnData) {
            addPurchaseReturnData(payload);
        }
    };

    return (
        <div className="pur-ret-create-page">
            {/* ── Breadcrumb ── */}
            <div className="brand-breadcrumb">
                <span>Dashboard</span>
                <span>&gt;</span>
                <Link to="/app/purchases" style={{ color: '#64748B', textDecoration: 'none' }}>Purchases</Link>
                <span>&gt;</span>
                <Link to="/app/purchase-return" style={{ color: '#64748B', textDecoration: 'none' }}>Purchase Returns</Link>
                <span>&gt;</span>
                <span className="brand-crumb-active">{singlePurchase ? 'Edit' : 'Create'}</span>
            </div>

            <div className="create-fullpage-container">

                {/* ── Header Bar ── */}
                <div className="create-form-header">
                    <div className="d-flex align-items-center gap-3">
                        <Link to="/app/purchase-return" className="brand-btn-pill">
                            <FontAwesomeIcon icon={faArrowLeft} /> Back to Purchase Returns
                        </Link>
                        <div>
                            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', margin: 0, lineHeight: '1.2' }}>
                                {singlePurchase ? 'Edit Purchase Return' : 'Create Purchase Return'}
                            </h2>
                            <p style={{ fontSize: '13.5px', color: '#64748B', margin: '2px 0 0 0' }}>
                                Return items to supplier and adjust inventory automatically
                            </p>
                        </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <button type="button" className="brand-btn-pill" onClick={() => navigate('/app/purchase-return')}>
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="brand-btn-pill brand-btn-primary"
                            onClick={onSubmit}
                        >
                            <FontAwesomeIcon icon={faCheck} /> {singlePurchase ? 'Save Changes' : 'Save Purchase Return'}
                        </button>
                    </div>
                </div>

                {/* ── Form Body ── */}
                <div className="create-form-body">
                    <form onSubmit={onSubmit}>

                        {/* Section 1: Return Information */}
                        <div className="create-card-section">
                            <div className="create-section-header">
                                <div className="create-section-icon green">
                                    <FontAwesomeIcon icon={faBuilding} />
                                </div>
                                <div className="create-section-title">
                                    <h3>Return Information</h3>
                                    <p>Select supplier, warehouse, return date, and reference configuration</p>
                                </div>
                            </div>

                            <div className="row g-4">
                                <div className="col-md-3">
                                    <label className="form-label">
                                        Return Date <span className="text-danger">*</span>
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
                                        data={statusFilterOptions}
                                        name="status_id"
                                        onChange={onStatusChange}
                                        isRequired={true}
                                        value={purchaseValue.status_id}
                                        errors={errors.status_id}
                                        placeholder={placeholderText('purchase.select.status.placeholder.label')}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">Original Purchase Order (Optional)</label>
                                    <select
                                        className="form-select"
                                        value={selectedOriginalPurchase}
                                        onChange={onOriginalPurchaseChange}
                                    >
                                        <option value="">Choose original purchase to auto-fill items...</option>
                                        {purchaseList.map(p => {
                                            const pAttr = p.attributes || p;
                                            const pRef = pAttr.reference_code || `PO #${p.id}`;
                                            const pDate = pAttr.date ? moment(pAttr.date).format('DD MMM YYYY') : '';
                                            return (
                                                <option key={p.id} value={p.id}>
                                                    {pRef} {pDate ? `(${pDate})` : ''} - {currencySymbol} {Number(pAttr.grand_total || 0).toLocaleString('en-IN')}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">Reference No.</label>
                                    <input
                                        className="form-control create-ref-input"
                                        value={refNumber}
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
                                    <p>Lookup items by SKU, barcode, or product name and configure return items</p>
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
                                                    onClick={() => addProductToReturn(prod)}
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

                            {/* Table of configured return items */}
                            <div className="mt-4">
                                {updateProducts.length === 0 ? (
                                    <div className="pur-empty-state">
                                        <div className="pur-empty-icon">
                                            <FontAwesomeIcon icon={faBoxOpen} />
                                        </div>
                                        <h4 className="pur-empty-title">No return products added yet</h4>
                                        <p className="pur-empty-desc">Search products above or select an original purchase to populate return items.</p>
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
                                                <PurchaseReturnTable
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
                                    <h3>Adjustments & Financial Summary</h3>
                                    <p>Configure tax rate, discount, shipping deduction, and inspect live calculations</p>
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
                                        <span className="pur-grand-pill-lbl">Return Total</span>
                                        <span className="pur-grand-pill-val">{currencySymbol} {grandTotalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Return Reason & Remarks */}
                        <div className="create-card-section">
                            <div className="create-section-header">
                                <div className="create-section-icon purple">
                                    <FontAwesomeIcon icon={faFileSignature} />
                                </div>
                                <div className="create-section-title">
                                    <h3>Return Notes & Reason</h3>
                                    <p>Specify reason for return, damaged goods notes, or supplier communication</p>
                                </div>
                            </div>

                            <div>
                                <label className="form-label">Return Remarks (optional)</label>
                                <textarea
                                    name="notes"
                                    className="form-control"
                                    value={purchaseValue.notes}
                                    rows={3}
                                    placeholder="Add reason for returning products to supplier (e.g. damaged stock, wrong specification, excess supply)..."
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
                                <button type="button" className="brand-btn-pill" onClick={() => navigate('/app/purchase-return')}>
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="brand-btn-pill brand-btn-primary"
                                    onClick={onSubmit}
                                >
                                    <FontAwesomeIcon icon={faCheck} /> {singlePurchase ? 'Save Changes' : 'Save Purchase Return'}
                                </button>
                            </div>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
};

const mapStateToProps = (state) => {
    const { warehouses, suppliers, products, customProducts, singlePurchase, frontSetting, allConfigData, purchases, totalRecord } = state;
    return {
        customProducts: preparePurchaseReturnArray(products),
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
    editPurchaseReturn,
    fetchAllProducts,
    fetchAllSuppliers,
    fetchAllWarehouses,
    fetchProductsByWarehouse,
    editPurchaseUnit,
})(PurchaseReturnForm);
