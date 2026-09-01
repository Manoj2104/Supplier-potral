import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import moment from 'moment';
import { connect, useDispatch } from 'react-redux';
import { fetchProductsByWarehouse } from '../../store/action/productAction';
import { editAdjustment } from '../../store/action/adjustMentAction';
import { placeholderText, getFormattedMessage } from '../../shared/sharedMethod';
import ReactDatePicker from '../../shared/datepicker/ReactDatePicker';
import { prepareSaleProductArray } from '../../shared/prepareArray/prepareSaleArray';
import { addToast } from '../../store/action/toastAction';
import { toastType } from '../../constants';
import { fetchFrontSetting } from '../../store/action/frontSettingAction';
import ReactSelect from '../../shared/select/reactSelect';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faShieldHalved,
    faSliders,
    faBoxesStacked,
    faReceipt,
    faArrowLeft,
    faCheck,
    faSearch,
    faBarcode,
    faFileExcel,
    faPlus,
    faTimes,
    faArrowRight,
    faMinus,
    faUpload,
    faTrash,
    faLocationDot,
    faWarehouse,
    faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import './AdjustmentsPremium.css';

// ── Bin catalog (from live DB) ────────────────────────────────────────────────
const BIN_CATALOG = [
    { code: "A-01-01", zone: "Zone A", label: "Shelf 1",  desc: "Fast Moving",      color: "#16A34A", bg: "#DCFCE7" },
    { code: "A-01-02", zone: "Zone A", label: "Shelf 2",  desc: "General Storage",  color: "#2563EB", bg: "#DBEAFE" },
    { code: "A-01-03", zone: "Zone A", label: "Shelf 3",  desc: "Slow Moving",      color: "#7C3AED", bg: "#EDE9FE" },
    { code: "B-01-01", zone: "Zone B", label: "Bulk",     desc: "Bulk Storage",     color: "#D97706", bg: "#FEF3C7" },
    { code: "DAMAGED-BIN-01", zone: "Quarantine", label: "Damage", desc: "Damaged & Quarantine", color: "#DC2626", bg: "#FEE2E2" },
    { code: "HOLD-BIN-01",    zone: "QC Hold",   label: "Hold",   desc: "Quality Hold Bin",     color: "#EA580C", bg: "#FEF3C7" },
    { code: "RESERVE-BIN-01", zone: "Reserve",   label: "Reserve",desc: "Overstock Reserve",    color: "#0891B2", bg: "#E0F2FE" },
];

const REASON_DESCRIPTIONS = {
    "Product Damage":       "Physical damage identified during warehouse inspection or handling.",
    "Expired Product":      "Product passed shelf-life expiry date and marked for write-off.",
    "Broken Packaging":     "Outer packaging torn or unsealable during storage.",
    "Water Damage":         "Moisture or liquid damage sustained in storage zone.",
    "Transport Damage":     "Goods received in damaged condition from transit vehicle.",
    "Quality Rejection":    "Failed QA quality inspection check during dock receiving.",
    "Supplier Shortage":    "Physical count less than invoice quantity during receiving.",
    "Cycle Count Variance": "Discrepancy found during routine warehouse cycle count audit.",
    "Receiving Error":      "Quantity mismatch during PDA dock receiving session.",
    "Warehouse Transfer":   "Internal inventory re-allocation between warehouse zones.",
    "Bin Transfer":         "Stock moved from one bin to another within same zone.",
    "Lost Item":            "Unit missing from designated rack location during audit.",
    "Found Item":           "Unrecorded unit located in warehouse during audit.",
};

const AdjustmentForm = (props) => {
    const {
        addAdjustmentData, editAdjustment, id, warehouses, singleAdjustMent,
        customProducts, products = [], fetchProductsByWarehouse, fetchFrontSetting, frontSetting,
    } = props;

    const navigate  = useNavigate();
    const dispatch  = useDispatch();

    // ── Core form state ───────────────────────────────────────────────────────
    const [updateProducts, setUpdateProducts] = useState([]);
    const [adjustMentValue, setAdjustMentValue] = useState({
        date: new Date(), warehouse_id: '',
        notes: singleAdjustMent ? singleAdjustMent.notes : '',
        AdjustmentType: { label: 'Addition', value: 1 }
    });
    const [errors, setErrors] = useState({ date: '', warehouse_id: '' });

    // ── Drawer state ──────────────────────────────────────────────────────────
    const [searchQuery,            setSearchQuery]          = useState('');
    const [isDrawerOpen,           setIsDrawerOpen]         = useState(false);
    const [selectedProduct,        setSelectedProduct]      = useState(null);
    const [drawerStep,             setDrawerStep]           = useState(1); // 1 = Details, 2 = Adjust to Bin
    const [isSubmittingSuccess,    setIsSubmittingSuccess]  = useState(false);

    // Drawer form fields
    const [adjType,    setAdjType]    = useState('Stock Decrease');
    const [adjReason,  setAdjReason]  = useState('Product Damage');
    const [targetBin,  setTargetBin]  = useState('DAMAGED-BIN-01');
    const [adjQty,     setAdjQty]     = useState(1);
    const [adjRemarks, setAdjRemarks] = useState('');
    const [unitCost,   setUnitCost]   = useState(0);

    // ── Lifecycle ─────────────────────────────────────────────────────────────
    useEffect(() => { fetchFrontSetting(); }, []);

    useEffect(() => {
        updateProducts.length >= 1
            ? dispatch({ type: 'DISABLE_OPTION', payload: true })
            : dispatch({ type: 'DISABLE_OPTION', payload: false });
    }, [updateProducts]);

    useEffect(() => {
        if (adjustMentValue.warehouse_id?.value) {
            fetchProductsByWarehouse(adjustMentValue.warehouse_id.value);
        }
    }, [adjustMentValue.warehouse_id?.value]);

    useEffect(() => {
        if (singleAdjustMent) {
            setAdjustMentValue({
                date: moment(singleAdjustMent.date).toDate(),
                warehouse_id: singleAdjustMent.warehouse_id,
                AdjustmentType: singleAdjustMent.AdjustmentType,
                notes: singleAdjustMent.notes || ''
            });
            setUpdateProducts(singleAdjustMent.adjustment_items || []);
        }
    }, [singleAdjustMent]);

    const currencySymbol = frontSetting?.value?.currency_symbol || '₹';

    // ── Validation & Submit ───────────────────────────────────────────────────
    const handleValidation = () => {
        let error = {}, isValid = false;
        if (!adjustMentValue.date)         error.date         = getFormattedMessage('globally.date.validate.label');
        else if (!adjustMentValue.warehouse_id) error.warehouse_id = getFormattedMessage('product.input.warehouse.validate.label');
        else if (updateProducts.filter(a => a.quantity === 0).length > 0)
            dispatch(addToast({ text: getFormattedMessage('globally.product-quantity.validate.message'), type: toastType.ERROR }));
        else if (updateProducts.length < 1)
            dispatch(addToast({ text: getFormattedMessage('purchase.product-list.validate.message'), type: toastType.ERROR }));
        else isValid = true;
        setErrors(error);
        return isValid;
    };

    const prepareFormData = (d) => ({
        date: moment(d.date).toDate(),
        warehouse_id: d.warehouse_id?.value || d.warehouse_id,
        note: d.notes,
        adjustment_items: updateProducts.map(item => ({
            product_id:         item.product_id || item.id,
            quantity:           item.quantity,
            method_type:        item.adjustMethod || (item.isDecrease ? 2 : 1),
            target_bin:         item.targetBin || 'A-01-02',
            adjustment_item_id: item.adjustment_item_id
        }))
    });

    const onSubmit = (e) => {
        if (e) e.preventDefault();
        if (!handleValidation()) return;
        singleAdjustMent
            ? editAdjustment(id, prepareFormData(adjustMentValue), navigate)
            : addAdjustmentData(prepareFormData(adjustMentValue));
    };

    // ── Product search ────────────────────────────────────────────────────────
    // products = raw [{id, attributes}] from Redux FETCH_PRODUCTS_BY_WAREHOUSE
    const safeProducts = Array.isArray(products) ? products : [];
    const hasWarehouse = !!adjustMentValue.warehouse_id;
    const filteredProducts = (searchQuery && hasWarehouse)
        ? safeProducts.filter(p => {
              const a = p.attributes || p;
              const nameMatch = (a.name || '').toLowerCase().includes(searchQuery.toLowerCase());
              const codeMatch = (a.code || '').toLowerCase().includes(searchQuery.toLowerCase());
              const barcodeMatch = (a.barcode || '').toLowerCase().includes(searchQuery.toLowerCase());
              return nameMatch || codeMatch || barcodeMatch;
          }).slice(0, 8)
        : [];

    // No fake/demo data — show real results only
    const displayProducts = filteredProducts;

    // ── Open / Close drawer ───────────────────────────────────────────────────
    // Helper: extract image URL from Spatie MediaLibrary format
    const extractImageUrl = (attr) => {
        if (!attr) return null;
        // Spatie format: { imageUrls: { 0: 'http://...' }, id: { 0: 5 } }
        if (attr.image_url?.imageUrls) {
            const urls = attr.image_url.imageUrls;
            const first = Object.values(urls)[0];
            if (first && typeof first === 'string') return first;
        }
        // Fallback: direct string
        if (typeof attr.image_url === 'string' && attr.image_url.length > 5) return attr.image_url;
        if (typeof attr.product_image === 'string' && attr.product_image.length > 5) return attr.product_image;
        return null;
    };

    const openDrawer = (prod) => {
        const a    = prod.attributes || {};
        // Safe number extraction — avoids $reolQty / undefined errors
        const cost = Number(a.product_cost || a.product_price || a.net_unit_price || 0);
        const qty  = Number(a.stock?.quantity || a.available_qty || a.quantity || 0);
        setSelectedProduct({
            id:           prod.id,
            product_id:   prod.id,
            name:         a.name                || 'Unknown Product',
            code:         a.code                || '—',
            barcode:      a.barcode             || a.code || '—',
            category:     a.product_category_name || a.category || 'General',
            brand:        a.brand_name          || '—',
            availableQty: qty,
            sourceBin:    a.bin_code            || 'A-01-02',
            unitCost:     cost,
            image:        extractImageUrl(a),
        });
        setUnitCost(cost);
        setAdjQty(1);
        setAdjType('Stock Decrease');
        setAdjReason('Product Damage');
        setTargetBin('DAMAGED-BIN-01');
        setAdjRemarks('');
        setDrawerStep(1);
        setIsSubmittingSuccess(false);
        setIsDrawerOpen(true);
    };

    const closeDrawer = () => { 
        setIsDrawerOpen(false); 
        setSelectedProduct(null);
        setDrawerStep(1);
        setIsSubmittingSuccess(false);
    };

    // ── Add to list / Move To Bin & Instant 0ms Auto-Save to Database ─────────
    const handleMoveToBin = () => {
        if (!selectedProduct) return;
        setIsSubmittingSuccess(true);

        const isDecrease = ['Stock Decrease','Damage','Expiry','Shrinkage'].includes(adjType);
        const newItem = {
            ...selectedProduct,
            quantity:     Number(adjQty),
            unitCost:     Number(unitCost),
            adjustMethod: isDecrease ? 2 : 1,
            isDecrease,
            reason:       adjReason,
            targetBin:    targetBin || 'A-01-02',
            notes:        adjRemarks,
            sub_total:    Number(adjQty) * Number(unitCost),
        };

        const finalWarehouseId = adjustMentValue.warehouse_id?.value || adjustMentValue.warehouse_id || (warehouses && warehouses[0]?.id) || 1;

        const payload = {
            date: moment(adjustMentValue.date || new Date()).toDate(),
            warehouse_id: finalWarehouseId,
            note: adjustMentValue.notes || adjRemarks || 'Inventory Adjustment',
            adjustment_items: [{
                product_id:         newItem.product_id || newItem.id,
                quantity:           newItem.quantity,
                method_type:        newItem.adjustMethod || (newItem.isDecrease ? 2 : 1),
                target_bin:         newItem.targetBin || 'A-01-02',
                adjustment_item_id: newItem.adjustment_item_id
            }]
        };

        // Fire API creation at 0ms immediately
        if (singleAdjustMent) {
            editAdjustment(id, payload, navigate);
        } else if (addAdjustmentData) {
            addAdjustmentData(payload);
        } else {
            navigate("/app/adjustments");
        }
    };

    const removeItem = (i) => setUpdateProducts(prev => prev.filter((_, idx) => idx !== i));

    const isDecreaseType = ['Stock Decrease','Damage','Expiry','Shrinkage'].includes(adjType);

    return (
        <div className="adj-create-page" style={{ padding: '24px', background: '#F8FAFC', minHeight: 'calc(100vh - 60px)' }}>

            {/* ── Breadcrumb ── */}
            <div className="brand-breadcrumb">
                <span>Dashboard</span>
                <span>&gt;</span>
                <Link to="/app/adjustments" style={{ color: '#64748B', textDecoration: 'none' }}>Adjustments</Link>
                <span>&gt;</span>
                <span className="brand-crumb-active">{singleAdjustMent ? 'Edit' : 'Create'}</span>
            </div>

            <div className="create-fullpage-container" style={{ margin: 0, borderRadius: '24px' }}>

                {/* ── Header Bar ── */}
                <div className="create-form-header">
                    <div className="d-flex align-items-center gap-3">
                        <Link to="/app/adjustments" className="brand-btn-pill">
                            <FontAwesomeIcon icon={faArrowLeft} /> Back to Adjustments
                        </Link>
                        <div>
                            <h2 style={{ fontSize: '26px', fontWeight: '800', margin: 0, color: '#0F172A' }}>
                                {singleAdjustMent ? 'Edit Adjustment' : 'Create Adjustment'}
                            </h2>
                            <span style={{ fontSize: '14px', color: '#64748B' }}>
                                Record stock increases, decreases, damages, or bin relocations
                            </span>
                        </div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                        <button type="button" className="brand-btn-pill" onClick={() => navigate('/app/adjustments')}>
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="brand-btn-pill brand-btn-primary"
                            onClick={onSubmit}
                        >
                            <FontAwesomeIcon icon={faCheck} /> {singleAdjustMent ? 'Save Changes' : 'Save Adjustment'}
                        </button>
                    </div>
                </div>

                {/* ── Body Form ── */}
                <div className="create-form-body">
                    <form onSubmit={onSubmit}>

                        {/* Section 1: Adjustment Information Card */}
                        <div className="create-card-section">
                            <div className="create-section-header">
                                <div className="create-section-icon green">
                                    <FontAwesomeIcon icon={faSliders} />
                                </div>
                                <div className="create-section-title">
                                    <h3>Adjustment Information</h3>
                                    <p>Select warehouse, adjustment date, and reference configuration</p>
                                </div>
                            </div>

                            <div className="row g-4">
                                <div className="col-md-4">
                                    <label className="form-label mb-2" style={{ fontWeight: '700', fontSize: '14px' }}>
                                        Warehouse <span className="text-danger">*</span>
                                    </label>
                                    <ReactSelect
                                        name="warehouse_id"
                                        data={warehouses}
                                        onChange={obj => { setAdjustMentValue(s => ({ ...s, warehouse_id: obj })); setErrors(''); }}
                                        isRequired={true}
                                        errors={errors.warehouse_id}
                                        defaultValue={adjustMentValue.warehouse_id}
                                        value={adjustMentValue.warehouse_id}
                                        addSearchItems={singleAdjustMent}
                                        isWarehouseDisable={true}
                                        placeholder={placeholderText('purchase.select.warehouse.placeholder.label')}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label mb-2" style={{ fontWeight: '700', fontSize: '14px' }}>
                                        {getFormattedMessage('react-data-table.date.column.label')} <span className="text-danger">*</span>
                                    </label>
                                    <ReactDatePicker
                                        onChangeDate={d => { setAdjustMentValue(s => ({ ...s, date: d })); setErrors(''); }}
                                        newStartDate={adjustMentValue.date}
                                    />
                                    {errors.date && <span className="text-danger d-block fw-400 fs-small mt-1">{errors.date}</span>}
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label mb-2" style={{ fontWeight: '700', fontSize: '14px' }}>
                                        Reference No.
                                    </label>
                                    <input
                                        className="form-control create-ref-input"
                                        value="Auto generated"
                                        disabled
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Search & Add Products Card */}
                        <div className="create-card-section">
                            <div className="create-section-header">
                                <div className="create-section-icon blue">
                                    <FontAwesomeIcon icon={faBoxesStacked} />
                                </div>
                                <div className="create-section-title">
                                    <h3>Search & Add Products</h3>
                                    <p>Lookup items by SKU, barcode, or product name and configure bin adjustments</p>
                                </div>
                            </div>

                            <div className="create-mode-pills">
                                {[['Search Product', faSearch], ['Scan Barcode', faBarcode], ['Import Excel', faFileExcel]].map(([label, icon], idx) => (
                                    <button
                                        key={label}
                                        type="button"
                                        className={`create-mode-pill ${idx === 0 ? 'active' : ''}`}
                                    >
                                        <FontAwesomeIcon icon={icon} /> {label}
                                    </button>
                                ))}
                            </div>

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
                                        const a = prod.attributes || {};
                                        const availQty = Number(a.stock?.quantity || a.available_qty || 0);
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
                                                    onClick={() => openDrawer(prod)}
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
                        </div>

                        {/* Section 3: Order Items Card */}
                        <div className="create-card-section">
                            <div className="create-section-header">
                                <div className="create-section-icon orange">
                                    <FontAwesomeIcon icon={faReceipt} />
                                </div>
                                <div className="create-section-title">
                                    <h3>Order Items ({updateProducts.length})</h3>
                                    <p>Configured inventory adjustment lines and destination rack locations</p>
                                </div>
                            </div>

                            <div className="table-responsive" style={{ borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                                <table className="table align-middle mb-0" style={{ fontSize: '13px' }}>
                                    <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                        <tr style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            <th style={{ padding: '12px 16px' }}>#</th>
                                            <th style={{ padding: '12px 16px' }}>Product</th>
                                            <th style={{ padding: '12px 16px' }}>Source Bin</th>
                                            <th style={{ padding: '12px 16px' }}>Move To Bin</th>
                                            <th style={{ padding: '12px 16px' }}>Type</th>
                                            <th style={{ padding: '12px 16px' }}>Qty</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {updateProducts.length > 0 ? updateProducts.map((item, idx) => {
                                            const binMeta = BIN_CATALOG.find(b => b.code === item.targetBin);
                                            return (
                                                <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                                    <td style={{ padding: '12px 16px', fontWeight: '600', color: '#94A3B8' }}>{idx + 1}</td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <div style={{ fontWeight: '700', color: '#0F172A' }}>{item.name}</div>
                                                        <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace' }}>{item.code}</div>
                                                    </td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <span className="badge border" style={{ background: '#F1F5F9', color: '#475569', fontFamily: 'monospace', fontWeight: '700', fontSize: '11px', padding: '6px 10px', borderRadius: '8px' }}>
                                                            {item.sourceBin || 'A-01-02'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <span className="badge" style={{ background: binMeta?.bg || '#DBEAFE', color: binMeta?.color || '#2563EB', fontFamily: 'monospace', fontWeight: '800', fontSize: '11px', padding: '6px 10px', borderRadius: '8px' }}>
                                                            <FontAwesomeIcon icon={faLocationDot} className="me-1" />
                                                            {item.targetBin}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <span className="badge" style={{ background: item.isDecrease ? '#FEE2E2' : '#DCFCE7', color: item.isDecrease ? '#DC2626' : '#15803D', fontWeight: '800', fontSize: '11px', padding: '6px 10px', borderRadius: '8px' }}>
                                                            {item.isDecrease ? 'Decrease (-)' : 'Increase (+)'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <input
                                                            type="number"
                                                            className="form-control text-center fw-bold create-input-lg"
                                                            value={item.quantity}
                                                            min="1"
                                                            onChange={e => {
                                                                const u = [...updateProducts];
                                                                u[idx].quantity = Math.max(1, Number(e.target.value));
                                                                setUpdateProducts(u);
                                                            }}
                                                            style={{ width: '80px', height: '40px', fontSize: '13.5px' }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                                        <button
                                                            type="button"
                                                            className="brand-action-btn delete"
                                                            style={{ display: 'inline-flex' }}
                                                            onClick={() => removeItem(idx)}
                                                        >
                                                            <FontAwesomeIcon icon={faTrash} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        }) : (
                                            <tr>
                                                <td colSpan="7" className="text-center py-5 text-muted">
                                                    <FontAwesomeIcon icon={faBoxesStacked} style={{ fontSize: '32px', color: '#CBD5E1', marginBottom: '12px', display: 'block', margin: '0 auto 12px' }} />
                                                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>No items added yet.</div>
                                                    <div style={{ fontSize: '12.5px', color: '#94A3B8', marginTop: '4px' }}>Search a product above and click <strong>Add →</strong> to configure adjustment lines.</div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Section 4: Audit Notes & Remarks */}
                        <div className="create-card-section">
                            <div className="create-section-header">
                                <div className="create-section-icon purple">
                                    <FontAwesomeIcon icon={faShieldHalved} />
                                </div>
                                <div className="create-section-title">
                                    <h3>Audit Notes & Remarks</h3>
                                    <p>Optional notes or reference documentation for this adjustment</p>
                                </div>
                            </div>

                            <div className="row g-4">
                                <div className="col-12">
                                    <textarea
                                        className="form-control create-input-lg"
                                        style={{ minHeight: '100px', height: 'auto', padding: '14px' }}
                                        placeholder="Enter any reference notes or inspection remarks (optional)..."
                                        value={adjustMentValue.notes || ''}
                                        onChange={e => setAdjustMentValue(s => ({ ...s, notes: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ── Bottom Action Footer ── */}
                        <div className="d-flex justify-content-between align-items-center mt-4 pt-3">
                            <button
                                type="button"
                                className="brand-btn-pill"
                                onClick={() => navigate('/app/adjustments')}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="brand-btn-pill brand-btn-primary"
                                onClick={onSubmit}
                            >
                                <FontAwesomeIcon icon={faCheck} /> {singleAdjustMent ? 'Save Changes' : 'Save Adjustment'}
                            </button>
                        </div>

                    </form>
                </div>

            </div>

            {/* ════════════════════════════════════════════════════════════
                CENTER POPUP MODAL — 2-STEP INTERACTIVE WORKFLOW
            ════════════════════════════════════════════════════════════ */}
            {isDrawerOpen && selectedProduct && (
                <div className="adj-drawer-backdrop" onClick={closeDrawer}>
                    {/* Center Modal Dialog panel */}
                    <div className="adj-center-modal" onClick={e => e.stopPropagation()}>

                        {/* ── Success Animation Overlay ── */}
                        {isSubmittingSuccess && (
                            <div className="adj-success-overlay">
                                <div className="adj-success-checkmark-circle">
                                    <svg className="adj-checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                                        <circle className="adj-checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                                        <path className="adj-checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                                    </svg>
                                </div>
                                <h4 style={{ fontWeight: '800', color: '#0F172A', marginTop: '16px', fontSize: '18px' }}>
                                    Item Adjusted & Moved!
                                </h4>
                                <p style={{ color: '#64748B', fontSize: '13.5px', marginTop: '4px' }}>
                                    Successfully assigned to bin <strong className="text-success">{targetBin}</strong>
                                </p>
                            </div>
                        )}

                        {/* ── Clean White Header (Replacing heavy black) ── */}
                        <div style={{ background: '#FFFFFF', padding: '18px 22px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>Inventory Adjustment</span>
                                    <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-0.5" style={{ fontSize: '11px', fontWeight: '700' }}>
                                        Step {drawerStep} of 2
                                    </span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                                    {drawerStep === 1 ? 'Configure adjustment type and reason' : 'Adjust to destination bin and confirm'}
                                </div>
                            </div>
                            <button type="button" className="btn-close" onClick={closeDrawer} style={{ fontSize: '12px' }} />
                        </div>

                        {/* ── Scrollable Body ── */}
                        <div className="adj-drawer-body" style={{ background: '#F8FAFC' }}>

                            {/* Product Card (compact) */}
                            <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '14px 16px', marginBottom: '16px', display: 'flex', gap: '14px', alignItems: 'center' }}>
                                {selectedProduct.image ? (
                                    <img src={selectedProduct.image} alt="" style={{ width: '52px', height: '52px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
                                        onError={e => { e.target.style.display = 'none'; }} />
                                ) : (
                                    <div style={{ width: '52px', height: '52px', borderRadius: '10px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <FontAwesomeIcon icon={faBoxesStacked} style={{ color: '#94A3B8', fontSize: '20px' }} />
                                    </div>
                                )}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: '800', fontSize: '14px', color: '#0F172A', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {selectedProduct.name}
                                    </div>
                                    <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                                        SKU: <strong>{selectedProduct.code}</strong> &bull; Barcode: {selectedProduct.barcode}
                                    </div>
                                    <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                                        Current Bin: <strong className="text-primary">{selectedProduct.sourceBin}</strong>
                                        &ensp;|&ensp;Stock: <strong className={selectedProduct.availableQty > 0 ? 'text-success' : 'text-danger'}>{selectedProduct.availableQty} Units</strong>
                                    </div>
                                </div>
                                <span style={{ background: selectedProduct.availableQty > 0 ? '#DCFCE7' : '#FEE2E2', color: selectedProduct.availableQty > 0 ? '#15803D' : '#DC2626', fontSize: '10.5px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                                    {selectedProduct.availableQty > 0 ? 'In Stock' : 'Out of Stock'}
                                </span>
                            </div>

                            {/* ── STEP 1: ADJUSTMENT DETAILS ONLY (Type & Reason) ── */}
                            {drawerStep === 1 && (
                                <div style={drawerSection}>
                                    <div style={drawerSectionTitle}>Adjustment Details</div>
                                    <div className="d-flex flex-column gap-3">
                                        <div>
                                            <label style={drawerLabel}>Type <span className="text-danger">*</span></label>
                                            <select className="form-select fw-bold" value={adjType} onChange={e => setAdjType(e.target.value)}
                                                style={{ height: '42px', fontSize: '13.5px', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
                                                <option value="Stock Decrease">Stock Decrease (-)</option>
                                                <option value="Stock Increase">Stock Increase (+)</option>
                                                <option value="Damage">Damage (-)</option>
                                                <option value="Expiry">Expiry (-)</option>
                                                <option value="Shrinkage">Shrinkage (-)</option>
                                                <option value="Cycle Count Variance">Cycle Count Variance</option>
                                                <option value="Warehouse Transfer">Warehouse Transfer</option>
                                                <option value="Bin Transfer">Bin Transfer</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label style={drawerLabel}>Reason <span className="text-danger">*</span></label>
                                            <select className="form-select fw-bold" value={adjReason} onChange={e => setAdjReason(e.target.value)}
                                                style={{ height: '42px', fontSize: '13.5px', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
                                                {Object.keys(REASON_DESCRIPTIONS).map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                        </div>

                                        {/* Reason description callout */}
                                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px 14px', fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>
                                            <strong className="text-dark">{adjReason}:</strong> {REASON_DESCRIPTIONS[adjReason] || 'Manual stock correction.'}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── STEP 2: ADJUST TO BIN & QUANTITY ── */}
                            {drawerStep === 2 && (
                                <>
                                    {/* Back to Step 1 Button */}
                                    <div className="mb-3">
                                        <button
                                            type="button"
                                            onClick={() => setDrawerStep(1)}
                                            className="btn btn-sm btn-link text-decoration-none p-0"
                                            style={{ color: '#16A34A', fontWeight: '700', fontSize: '12.5px' }}
                                        >
                                            <FontAwesomeIcon icon={faArrowLeft} className="me-1" /> Back to Adjustment Details
                                        </button>
                                    </div>

                                    {/* Quantity & Value */}
                                    <div style={drawerSection}>
                                        <div style={drawerSectionTitle}>Quantity & Value</div>
                                        <div className="row g-2 align-items-end">
                                            <div className="col-12 col-sm-6">
                                                <label style={drawerLabel}>Adjustment Quantity <span className="text-danger">*</span></label>
                                                <div className="d-flex align-items-center gap-2">
                                                    <button type="button" className="btn btn-outline-secondary fw-bold" style={{ width: '38px', height: '40px', padding: 0, borderRadius: '9px' }}
                                                        onClick={() => setAdjQty(prev => Math.max(1, prev - 1))}>
                                                        <FontAwesomeIcon icon={faMinus} />
                                                    </button>
                                                    <input type="number" className="form-control text-center fw-bold"
                                                        value={adjQty} min="1" onChange={e => setAdjQty(Math.max(1, Number(e.target.value)))}
                                                        style={{ height: '40px', fontSize: '16px', borderRadius: '9px', fontWeight: '900' }} />
                                                    <button type="button" className="btn btn-outline-secondary fw-bold" style={{ width: '38px', height: '40px', padding: 0, borderRadius: '9px' }}
                                                        onClick={() => setAdjQty(prev => prev + 1)}>
                                                        <FontAwesomeIcon icon={faPlus} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="col-12 col-sm-6">
                                                <label style={drawerLabel}>Adjustment Value (₹)</label>
                                                <input className="form-control fw-bold bg-light text-success text-center" disabled
                                                    value={`${currencySymbol} ${(adjQty * unitCost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                                                    style={{ height: '40px', fontSize: '14px', borderRadius: '9px', fontWeight: '900' }} />
                                            </div>
                                        </div>

                                        {/* Inventory Preview strip */}
                                        <div style={{ background: isDecreaseType ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${isDecreaseType ? '#FECACA' : '#BBF7D0'}`, borderRadius: '10px', padding: '10px 14px', marginTop: '10px' }}>
                                            <div className="d-flex align-items-center justify-content-between" style={{ fontSize: '12.5px' }}>
                                                <div>Before: <strong>{selectedProduct.availableQty}</strong></div>
                                                <div style={{ fontWeight: '800', color: isDecreaseType ? '#DC2626' : '#16A34A', fontSize: '14px' }}>
                                                    {isDecreaseType ? `−${adjQty}` : `+${adjQty}`}
                                                </div>
                                                <div>After: <strong>{isDecreaseType ? selectedProduct.availableQty - adjQty : selectedProduct.availableQty + adjQty}</strong></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── ADJUST TO BIN (Interactive Input & Quick Select) ── */}
                                    <div style={drawerSection}>
                                        <div className="d-flex align-items-center justify-content-between mb-2">
                                            <div style={drawerSectionTitle}>
                                                <FontAwesomeIcon icon={faLocationDot} className="text-success me-1" />
                                                Adjust to Bin <span className="text-danger">*</span>
                                            </div>
                                            {/* Relocation path badge */}
                                            <div style={{ fontSize: '11.5px', background: '#DCFCE7', border: '1px solid #86EFAC', borderRadius: '20px', padding: '3px 10px', color: '#15803D', fontWeight: '700' }}>
                                                {selectedProduct.sourceBin} &nbsp;→&nbsp; {targetBin || 'Select Bin'}
                                            </div>
                                        </div>

                                        {/* Bin Typing Input */}
                                        <div className="mb-3">
                                            <label style={drawerLabel}>Target Bin Code <span className="text-danger">*</span></label>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Type bin code (e.g. DAMAGED-BIN-01, A-01-01)..."
                                                    value={targetBin}
                                                    onChange={e => setTargetBin(e.target.value)}
                                                    style={{ height: '42px', fontSize: '13.5px', borderRadius: '10px', border: '1.5px solid #16A34A', paddingLeft: '14px', fontWeight: '700', fontFamily: 'monospace' }}
                                                />
                                            </div>
                                            <span style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', display: 'block' }}>
                                                Type any custom bin or click one of the suggested bins below:
                                            </span>
                                        </div>

                                        {/* Quick Suggested Bin Chips / Cards */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                            {BIN_CATALOG.map(bin => {
                                                const isSelected = targetBin === bin.code;
                                                return (
                                                    <div key={bin.code} onClick={() => setTargetBin(bin.code)}
                                                        style={{
                                                            cursor: 'pointer',
                                                            borderRadius: '12px',
                                                            padding: '10px 12px',
                                                            border: isSelected ? `2px solid ${bin.color}` : '1.5px solid #E2E8F0',
                                                            background: isSelected ? bin.bg : '#FFF',
                                                            transition: 'all 0.18s ease',
                                                            boxShadow: isSelected ? `0 0 0 3px ${bin.color}22` : 'none',
                                                            position: 'relative',
                                                            overflow: 'hidden',
                                                        }}>
                                                        {isSelected && (
                                                            <div style={{ position: 'absolute', top: '6px', right: '8px', width: '16px', height: '16px', borderRadius: '50%', background: bin.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <FontAwesomeIcon icon={faCheck} style={{ color: '#FFF', fontSize: '8px' }} />
                                                            </div>
                                                        )}
                                                        <div style={{ fontFamily: 'monospace', fontWeight: '900', fontSize: '12.5px', color: isSelected ? bin.color : '#0F172A', marginBottom: '2px' }}>
                                                            {bin.code}
                                                        </div>
                                                        <div style={{ fontSize: '11px', fontWeight: '700', color: isSelected ? bin.color : '#475569' }}>
                                                            {bin.zone} · {bin.label}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Remarks (optional) */}
                                    <div style={drawerSection}>
                                        <label style={drawerLabel}>Remarks (optional)</label>
                                        <textarea className="form-control" rows="2" placeholder="Enter reason, notes, or inspection remarks..."
                                            value={adjRemarks} onChange={e => setAdjRemarks(e.target.value)}
                                            style={{ fontSize: '13px', borderRadius: '9px', resize: 'none' }} />
                                        <div style={{ fontSize: '10px', color: '#94A3B8', textAlign: 'right', marginTop: '2px' }}>{adjRemarks.length}/250</div>
                                    </div>
                                </>
                            )}

                        </div>

                        {/* ── Sticky Drawer Footer ── */}
                        <div style={{ padding: '14px 20px', background: '#FFF', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '10px', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <button
                                type="button"
                                onClick={closeDrawer}
                                className="btn btn-outline-secondary fw-bold px-4"
                                style={{ borderRadius: '10px', height: '42px', fontSize: '13px' }}
                            >
                                Cancel
                            </button>

                            {drawerStep === 1 ? (
                                <button
                                    type="button"
                                    onClick={() => setDrawerStep(2)}
                                    className="btn fw-bold text-white px-4"
                                    style={{
                                        background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
                                        borderRadius: '10px',
                                        border: 'none',
                                        height: '42px',
                                        fontSize: '13.5px',
                                        boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <span>Continue</span>
                                    <FontAwesomeIcon icon={faArrowRight} />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleMoveToBin}
                                    className="btn fw-bold text-white px-5"
                                    style={{
                                        background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
                                        borderRadius: '10px',
                                        border: 'none',
                                        height: '42px',
                                        fontSize: '13.5px',
                                        boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <FontAwesomeIcon icon={faCheck} />
                                    <span>Move to Bin</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Helper sub-components & style consts ──────────────────────────────────────
const cardStyle = { background: '#FFF', border: '1px solid #EEF2F7', borderRadius: '16px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 10px rgba(0,0,0,.02)' };
const th        = { padding: '10px 12px' };
const drawerSection     = { background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px', marginBottom: '12px' };
const drawerSectionTitle = { fontSize: '13.5px', fontWeight: '800', color: '#0F172A', marginBottom: '12px' };
const drawerLabel        = { fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '4px', display: 'block' };

const SectionTitle = ({ icon, title }) => (
    <div className="d-flex align-items-center gap-2 mb-3">
        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FontAwesomeIcon icon={icon} />
        </div>
        <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: 0 }}>{title}</h4>
    </div>
);

const mapStateToProps = (state) => {
    const { purchaseProducts, products, frontSetting } = state;
    return { customProducts: prepareSaleProductArray(products), purchaseProducts, products, frontSetting };
};

export default connect(mapStateToProps, { editAdjustment, fetchProductsByWarehouse, fetchFrontSetting })(AdjustmentForm);
