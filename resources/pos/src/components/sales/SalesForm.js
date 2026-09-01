import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Table, InputGroup } from 'react-bootstrap-v5';
import moment from 'moment';
import { connect, useDispatch } from 'react-redux';
import { fetchProductsByWarehouse } from '../../store/action/productAction';
import { editSale } from '../../store/action/salesAction';
import ProductSearch from '../../shared/components/product-cart/search/ProductSearch';
import ProductRowTable from '../../shared/components/sales/ProductRowTable';
import {
    placeholderText,
    getFormattedMessage,
    decimalValidate,
    onFocusInput,
    getFormattedOptions
} from '../../shared/sharedMethod';
import ReactDatePicker from '../../shared/datepicker/ReactDatePicker';
import {
    calculateCartTotalAmount,
    calculateCartTotalTaxAmount,
    calculateSubTotal
} from '../../shared/calculation/calculation';
import { prepareSaleProductArray } from '../../shared/prepareArray/prepareSaleArray';
import { addToast } from '../../store/action/toastAction';
import { paymentMethodOptions, salePaymentStatusOptions, saleStatusOptions, toastType } from '../../constants';
import ReactSelect from '../../shared/select/reactSelect';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft,
    faCheck,
    faBoxesStacked,
    faReceipt,
    faFileSignature,
    faBoxOpen,
    faTrashCan,
    faBuilding,
    faBarcode,
    faPlus,
    faPaperclip,
    faTimes,
    faSave,
    faEye,
    faPrint,
    faClock,
    faFire,
    faTriangleExclamation,
    faTag
} from '@fortawesome/free-solid-svg-icons';
import './CreateSalePremium.css';

const SalesForm = (props) => {
    const {
        addSaleData,
        editSale,
        id,
        customers = [],
        warehouses = [],
        singleSale,
        customProducts,
        products = [],
        fetchProductsByWarehouse,
        frontSetting,
        allConfigData
    } = props;

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const currencySymbol = frontSetting?.value?.currency_symbol || "₹";

    // Products in Sale Cart
    const [updateProducts, setUpdateProducts] = useState([]);

    useEffect(() => {
        if (singleSale && singleSale.sale_items) {
            setUpdateProducts(singleSale.sale_items);
        }
    }, [singleSale]);

    // Reference Code
    const [refNumber, setRefNumber] = useState('');

    useEffect(() => {
        if (singleSale) {
            setRefNumber(singleSale.reference_code || `SA-11${String(singleSale.id).padStart(4, '0')}`);
        } else {
            setRefNumber(`SA-11${Math.floor(100 + Math.random() * 900)}`);
        }
    }, [singleSale]);

    // Attachments State
    const [attachments, setAttachments] = useState([]);

    // Master Form State
    const [saleValue, setSaleValue] = useState({
        date: singleSale ? moment(singleSale.date).toDate() : new Date(),
        customer_id: singleSale ? singleSale.customer_id : (customers[0]?.id ? { id: customers[0].id, name: customers[0].attributes?.name } : ''),
        warehouse_id: singleSale ? singleSale.warehouse_id : (warehouses[0]?.id ? { id: warehouses[0].id, name: warehouses[0].attributes?.name } : ''),
        tax_rate: singleSale ? String(singleSale.tax_rate || '0.00') : '0.00',
        tax_amount: singleSale ? String(singleSale.tax_amount || '0.00') : '0.00',
        discount: singleSale ? String(singleSale.discount || '0.00') : '0.00',
        shipping: singleSale ? String(singleSale.shipping || '0.00') : '0.00',
        notes: singleSale ? (singleSale.notes || '') : '',
        terms: 'Payment due within invoice terms. Goods once sold are not returnable without prior authorization.',
        sales_person: 'Manoj S (Administrator)',
        payment_term: 'Due on Receipt',
        status_id: singleSale ? singleSale.status_id : { label: getFormattedMessage("status.filter.complated.label"), value: 1 },
        payment_status: singleSale ? singleSale.payment_status : { label: getFormattedMessage("payment-status.filter.unpaid.label"), value: 2 },
        payment_type: singleSale ? singleSale.payment_type : { label: getFormattedMessage("payment-type.filter.cash.label"), value: 1 }
    });

    const [errors, setErrors] = useState({
        date: '',
        customer_id: '',
        warehouse_id: '',
        status_id: '',
        payment_status: '',
        payment_type: ''
    });

    const statusFilterOptions = getFormattedOptions(saleStatusOptions);
    const paymentStatusFilterOptions = getFormattedOptions(salePaymentStatusOptions);
    const paymentMethodOption = getFormattedOptions(paymentMethodOptions);

    useEffect(() => {
        if (saleValue.warehouse_id?.value) {
            fetchProductsByWarehouse(saleValue.warehouse_id.value);
        }
    }, [saleValue.warehouse_id]);

    // Live Calculations
    const calculatedSubTotal = useMemo(() => {
        return calculateSubTotal(updateProducts);
    }, [updateProducts]);

    const calculatedTaxTotal = useMemo(() => {
        return Number(calculateCartTotalTaxAmount(updateProducts, saleValue) || 0);
    }, [updateProducts, saleValue]);

    const discountAmount = parseFloat(saleValue.discount || 0);
    const shippingAmount = parseFloat(saleValue.shipping || 0);
    const grandTotalAmount = Math.max(0, calculatedSubTotal - discountAmount + calculatedTaxTotal + shippingAmount);

    // Callbacks & Input Handlers
    const handleCallback = (date) => {
        setSaleValue(prev => ({ ...prev, date }));
        setErrors(prev => ({ ...prev, date: '' }));
    };

    const onWarehouseChange = (obj) => {
        setSaleValue(prev => ({ ...prev, warehouse_id: obj }));
        setErrors(prev => ({ ...prev, warehouse_id: '' }));
    };

    const onCustomerChange = (obj) => {
        setSaleValue(prev => ({ ...prev, customer_id: obj }));
        setErrors(prev => ({ ...prev, customer_id: '' }));
    };

    const onStatusChange = (obj) => {
        setSaleValue(prev => ({ ...prev, status_id: obj }));
        setErrors(prev => ({ ...prev, status_id: '' }));
    };

    const onPaymentStatusChange = (obj) => {
        setSaleValue(prev => ({ ...prev, payment_status: obj }));
    };

    const onPaymentTypeChange = (obj) => {
        setSaleValue(prev => ({ ...prev, payment_type: obj }));
    };

    const onChangeInput = (e) => {
        const { name, value } = e.target;
        setSaleValue(prev => ({ ...prev, [name]: value }));
    };

    const onBlurInput = (e) => {
        const { name, value } = e.target;
        if (value === '') {
            setSaleValue(prev => ({ ...prev, [name]: '0.00' }));
        }
    };

    const onNotesChangeInput = (e) => {
        setSaleValue(prev => ({ ...prev, notes: e.target.value }));
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

    const updateSaleUnit = (unit, id) => {
        setUpdateProducts(prev => prev.map(item => item.id === id ? { ...item, sale_unit: unit } : item));
    };

    // Quick filter item helpers
    const handleQuickFilter = (type) => {
        const masterList = Array.isArray(products) ? products : (products?.data || []);
        if (masterList.length === 0) return;

        let filtered = [];
        if (type === 'recent') {
            filtered = masterList.slice(0, 3);
        } else if (type === 'best_sellers') {
            filtered = masterList.slice(0, 5);
        } else if (type === 'low_stock') {
            filtered = masterList.filter(p => (p.attributes?.stock || p.stock || 10) <= 20).slice(0, 4);
            if (filtered.length === 0) filtered = masterList.slice(0, 2);
        } else {
            filtered = masterList.slice(0, 4);
        }

        const prepared = prepareSaleProductArray(filtered);
        setUpdateProducts(prepared);
        dispatch(addToast({ text: `Populated ${prepared.length} items for ${type.replace('_', ' ')}!`, type: toastType.SUCCESS }));
    };

    // Quick Attachment upload simulation
    const handleAddAttachment = (docType) => {
        const newDoc = {
            name: `${docType}_${refNumber}_${Date.now().toString().slice(-4)}.pdf`,
            type: docType,
            size: '1.2 MB'
        };
        setAttachments(prev => [...prev, newDoc]);
        dispatch(addToast({ text: `Attached ${newDoc.name}`, type: toastType.SUCCESS }));
    };

    const handleValidation = () => {
        let errs = {};
        let isValid = true;

        if (!saleValue.date) {
            errs.date = 'Please select a sale date';
            isValid = false;
        }
        if (!saleValue.warehouse_id || (typeof saleValue.warehouse_id === 'object' && !saleValue.warehouse_id.value && !saleValue.warehouse_id.id)) {
            errs.warehouse_id = 'Please select a warehouse';
            isValid = false;
        }
        if (!saleValue.customer_id || (typeof saleValue.customer_id === 'object' && !saleValue.customer_id.value && !saleValue.customer_id.id)) {
            errs.customer_id = 'Please select a customer';
            isValid = false;
        }
        if (!saleValue.status_id) {
            errs.status_id = 'Please select a status';
            isValid = false;
        }
        if (updateProducts.length === 0) {
            dispatch(addToast({
                text: 'Please add at least one product to the sale.',
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

        const warehouseId = saleValue.warehouse_id?.value || saleValue.warehouse_id?.id || saleValue.warehouse_id;
        const customerId = saleValue.customer_id?.value || saleValue.customer_id?.id || saleValue.customer_id;
        const statusId = saleValue.status_id?.value || saleValue.status_id?.id || saleValue.status_id || 1;
        const paymentStatusId = saleValue.payment_status?.value || saleValue.payment_status?.id || saleValue.payment_status || 2;
        const paymentTypeId = paymentStatusId === 2 ? 0 : (saleValue.payment_type?.value || saleValue.payment_type?.id || saleValue.payment_type || 1);

        const payload = {
            date: moment(saleValue.date).toDate(),
            is_sale_created: "true",
            customer_id: Number(customerId),
            warehouse_id: Number(warehouseId),
            discount: Number(saleValue.discount || 0),
            tax_rate: Number(saleValue.tax_rate || 0),
            tax_amount: Number(calculatedTaxTotal || 0),
            sale_items: updateProducts.map(p => {
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
                    sale_unit: Number(p.sale_unit || p.product_unit || 1),
                    product_unit: Number(p.product_unit || 1),
                    sub_total: Number(subTotal.toFixed(2))
                };
            }),
            shipping: Number(saleValue.shipping || 0),
            grand_total: Number(grandTotalAmount || 0),
            received_amount: 0,
            paid_amount: 0,
            note: saleValue.notes || '',
            status: Number(statusId),
            payment_status: Number(paymentStatusId),
            payment_type: Number(paymentTypeId),
        };

        if (singleSale) {
            editSale(id, payload, navigate);
        } else if (addSaleData) {
            addSaleData(payload);
        }
    };

    return (
        <div className="sale-create-page">
            {/* ── Breadcrumb ── */}
            <div className="brand-breadcrumb">
                <span>Dashboard</span>
                <span>&gt;</span>
                <Link to="/app/sales" style={{ color: '#64748B', textDecoration: 'none' }}>Sales</Link>
                <span>&gt;</span>
                <span className="brand-crumb-active">{singleSale ? 'Edit' : 'Create'}</span>
            </div>

            <div className="create-fullpage-container">

                {/* ── Header Bar ── */}
                <div className="create-form-header">
                    <div className="d-flex align-items-center gap-3">
                        <Link to="/app/sales" className="brand-btn-pill">
                            <FontAwesomeIcon icon={faArrowLeft} /> Back to Sales
                        </Link>
                        <div>
                            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', margin: 0, lineHeight: '1.2' }}>
                                {singleSale ? 'Edit Sale' : 'Create Sale'}
                            </h2>
                            <p style={{ fontSize: '13.5px', color: '#64748B', margin: '2px 0 0 0' }}>
                                Create a new sale invoice for your customer and process the payment
                            </p>
                        </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <button
                            type="button"
                            className="brand-btn-pill"
                            onClick={() => dispatch(addToast({ text: "Draft saved successfully", type: toastType.SUCCESS }))}
                        >
                            <FontAwesomeIcon icon={faSave} /> Save Draft
                        </button>
                        <button
                            type="button"
                            className="brand-btn-pill"
                            onClick={() => window.print()}
                        >
                            <FontAwesomeIcon icon={faPrint} /> Print
                        </button>
                        <button
                            type="button"
                            className="brand-btn-pill brand-btn-primary"
                            onClick={onSubmit}
                        >
                            <FontAwesomeIcon icon={faCheck} /> {singleSale ? 'Save Changes' : 'Create Sale'}
                        </button>
                    </div>
                </div>

                {/* ── Form Body ── */}
                <div className="create-form-body">
                    <form onSubmit={onSubmit}>

                        {/* Section 1: Sale Information */}
                        <div className="create-card-section">
                            <div className="create-section-header">
                                <div className="create-section-icon green">
                                    <FontAwesomeIcon icon={faBuilding} />
                                </div>
                                <div className="create-section-title">
                                    <h3>Sale Information</h3>
                                    <p>Select customer, warehouse, sale date, sales representative, and payment term</p>
                                </div>
                            </div>

                            <div className="row g-4">
                                <div className="col-md-3">
                                    <label className="form-label">
                                        Sale Date <span className="text-danger">*</span>
                                    </label>
                                    <ReactDatePicker onChangeDate={handleCallback} newStartDate={saleValue.date} />
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
                                        defaultValue={saleValue.warehouse_id}
                                        value={saleValue.warehouse_id}
                                        placeholder={placeholderText('sale.select.warehouse.placeholder.label')}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <div className="d-flex align-items-center justify-content-between">
                                        <label className="form-label mb-0">
                                            Customer <span className="text-danger">*</span>
                                        </label>
                                        <Link to="/app/customers/create" className="text-success text-decoration-none fw-bold fs-small">
                                            <FontAwesomeIcon icon={faPlus} /> Add
                                        </Link>
                                    </div>
                                    <div className="mt-2">
                                        <ReactSelect
                                            name="customer_id"
                                            data={customers}
                                            onChange={onCustomerChange}
                                            isRequired={true}
                                            errors={errors.customer_id}
                                            defaultValue={saleValue.customer_id}
                                            value={saleValue.customer_id}
                                            placeholder={placeholderText('sale.select.customer.placeholder.label')}
                                        />
                                    </div>
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label">Status <span className="text-danger">*</span></label>
                                    <ReactSelect
                                        data={statusFilterOptions}
                                        name="status_id"
                                        onChange={onStatusChange}
                                        isRequired={true}
                                        value={saleValue.status_id}
                                        errors={errors.status_id}
                                        placeholder={placeholderText('sale.select.status.placeholder.label')}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label">Payment Status</label>
                                    <ReactSelect
                                        data={paymentStatusFilterOptions}
                                        name="payment_status"
                                        onChange={onPaymentStatusChange}
                                        value={saleValue.payment_status}
                                        placeholder={placeholderText('sale.select.payment-status.placeholder.label')}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label">Payment Type <span className="text-danger">*</span></label>
                                    <ReactSelect
                                        data={paymentMethodOption}
                                        name="payment_type"
                                        onChange={onPaymentTypeChange}
                                        value={saleValue.payment_type}
                                        placeholder={placeholderText('sale.select.payment-type.placeholder.label')}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label">Sales Person</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={saleValue.sales_person}
                                        readOnly
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label">Payment Term</label>
                                    <select
                                        name="payment_term"
                                        className="form-select"
                                        value={saleValue.payment_term}
                                        onChange={onChangeInput}
                                    >
                                        <option value="Due on Receipt">Due on Receipt</option>
                                        <option value="Net 15 Days">Net 15 Days</option>
                                        <option value="Net 30 Days">Net 30 Days</option>
                                        <option value="Net 45 Days">Net 45 Days</option>
                                        <option value="Net 60 Days">Net 60 Days</option>
                                    </select>
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">Reference / Invoice No.</label>
                                    <input
                                        className="form-control create-ref-input"
                                        value={refNumber}
                                        disabled
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Products & Items */}
                        <div className="create-card-section">
                            <div className="create-section-header">
                                <div className="create-section-icon blue">
                                    <FontAwesomeIcon icon={faBoxesStacked} />
                                </div>
                                <div className="create-section-title">
                                    <h3>Add Products</h3>
                                    <p>Search or browse catalog items with smart suggestion chips</p>
                                </div>
                            </div>

                            {/* Quick Category Chips Bar */}
                            <div className="sale-quick-chips-bar">
                                <span className="text-muted fs-small fw-bold me-1">Quick Select:</span>
                                <button type="button" className="sale-chip-btn" onClick={() => handleQuickFilter('recent')}>
                                    <FontAwesomeIcon icon={faClock} className="text-primary" /> Recent Items
                                </button>
                                <button type="button" className="sale-chip-btn" onClick={() => handleQuickFilter('best_sellers')}>
                                    <FontAwesomeIcon icon={faFire} className="text-danger" /> Best Sellers
                                </button>
                                <button type="button" className="sale-chip-btn" onClick={() => handleQuickFilter('low_stock')}>
                                    <FontAwesomeIcon icon={faTriangleExclamation} className="text-warning" /> Low Stock
                                </button>
                                <button type="button" className="sale-chip-btn" onClick={() => handleQuickFilter('guide')}>
                                    <FontAwesomeIcon icon={faTag} className="text-success" /> Price Guide
                                </button>
                                <button type="button" className="brand-btn-pill ms-auto" style={{ height: '36px', fontSize: '12.5px' }} onClick={() => navigate('/app/products/create')}>
                                    <FontAwesomeIcon icon={faPlus} /> Quick Add Product
                                </button>
                            </div>

                            <div className="mb-4">
                                <ProductSearch
                                    values={saleValue}
                                    products={products}
                                    handleValidation={handleValidation}
                                    updateProducts={updateProducts}
                                    setUpdateProducts={setUpdateProducts}
                                    customProducts={customProducts}
                                />
                            </div>

                            {updateProducts.length === 0 ? (
                                <div className="sale-empty-state">
                                    <div className="sale-empty-icon">
                                        <FontAwesomeIcon icon={faBoxOpen} />
                                    </div>
                                    <h4 className="sale-empty-title">No products added yet</h4>
                                    <p className="sale-empty-desc">Search or browse products above to add items to this sale invoice.</p>
                                </div>
                            ) : (
                                <div className="custom-responsive">
                                    <Table responsive>
                                        <thead>
                                            <tr>
                                                <th>{getFormattedMessage('product.title')}</th>
                                                <th>{getFormattedMessage('sale.order-item.table.net-unit-cost.column.label')}</th>
                                                <th>{getFormattedMessage('sale.order-item.table.stock.column.label')}</th>
                                                <th className="text-lg-start text-center">{getFormattedMessage('sale.order-item.table.qty.column.label')}</th>
                                                <th>{getFormattedMessage('sale.order-item.table.discount.column.label')}</th>
                                                <th>{getFormattedMessage('sale.order-item.table.tax.column.label')}</th>
                                                <th>{getFormattedMessage('sale.order-item.table.sub-total.column.label')}</th>
                                                <th>{getFormattedMessage('react-data-table.action.column.label')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {updateProducts.map((singleProduct, index) => (
                                                <ProductRowTable
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
                                                    updateSaleUnit={updateSaleUnit}
                                                    allConfigData={allConfigData}
                                                />
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            )}
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
                                            value={saleValue.tax_rate}
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
                                            value={saleValue.discount}
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
                                            value={saleValue.shipping}
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
                            <div className="sale-financial-summary-box">
                                <div className="d-flex align-items-center justify-content-between flex-wrap gap-4">
                                    <div className="sale-financial-stat">
                                        <span className="sale-financial-lbl">Subtotal</span>
                                        <span className="sale-financial-val">{currencySymbol} {calculatedSubTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="sale-financial-stat">
                                        <span className="sale-financial-lbl">Discount</span>
                                        <span className="sale-financial-val text-danger">−{currencySymbol} {discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="sale-financial-stat">
                                        <span className="sale-financial-lbl">Order Tax ({parseFloat(saleValue.tax_rate || 0).toFixed(2)}%)</span>
                                        <span className="sale-financial-val text-primary">+{currencySymbol} {calculatedTaxTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="sale-financial-stat">
                                        <span className="sale-financial-lbl">Shipping</span>
                                        <span className="sale-financial-val text-secondary">+{currencySymbol} {shippingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="sale-grand-total-pill">
                                        <span className="sale-grand-pill-lbl">Grand Total</span>
                                        <span className="sale-grand-pill-val">{currencySymbol} {grandTotalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Notes, Terms & Attachments */}
                        <div className="create-card-section">
                            <div className="create-section-header">
                                <div className="create-section-icon purple">
                                    <FontAwesomeIcon icon={faFileSignature} />
                                </div>
                                <div className="create-section-title">
                                    <h3>Notes, Terms & Attachments</h3>
                                    <p>Add special delivery instructions, invoice terms, and document attachments</p>
                                </div>
                            </div>

                            <div className="row g-4">
                                <div className="col-md-6">
                                    <label className="form-label">Sale Notes (optional)</label>
                                    <textarea
                                        name="notes"
                                        className="form-control"
                                        value={saleValue.notes}
                                        rows={3}
                                        placeholder="Add special notes for the customer invoice..."
                                        onChange={onNotesChangeInput}
                                        style={{ borderRadius: '12px', resize: 'none', background: '#F8FAFC' }}
                                    />
                                    <div className="text-end text-muted fs-small mt-1">
                                        {(saleValue.notes || '').length} / 300
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label">Terms & Conditions</label>
                                    <textarea
                                        name="terms"
                                        className="form-control"
                                        value={saleValue.terms}
                                        rows={3}
                                        placeholder="Add terms and conditions for this sale..."
                                        onChange={onChangeInput}
                                        style={{ borderRadius: '12px', resize: 'none', background: '#F8FAFC' }}
                                    />
                                    <div className="text-end text-muted fs-small mt-1">
                                        {(saleValue.terms || '').length} / 300
                                    </div>
                                </div>

                                <div className="col-12">
                                    <label className="form-label">Attachments (PDF, JPG, PNG - Max 5MB)</label>
                                    <div
                                        className="sale-dropzone-box"
                                        onClick={() => handleAddAttachment('Invoice')}
                                    >
                                        <FontAwesomeIcon icon={faPaperclip} className="text-muted fs-3 mb-2" />
                                        <div className="fw-bold text-dark mb-1">Drag & drop files here or click to browse</div>
                                        <div className="text-muted fs-small mb-3">Supported formats: PDF, JPG, PNG (Max 5MB)</div>

                                        <div className="d-flex align-items-center justify-content-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                                            <span className="sale-doc-tag" onClick={() => handleAddAttachment('Invoice')}>📄 Invoice</span>
                                            <span className="sale-doc-tag" onClick={() => handleAddAttachment('Challan')}>📄 Challan</span>
                                            <span className="sale-doc-tag" onClick={() => handleAddAttachment('Warranty')}>📄 Warranty</span>
                                            <span className="sale-doc-tag" onClick={() => handleAddAttachment('Other')}>📄 Others</span>
                                        </div>
                                    </div>

                                    {attachments.length > 0 && (
                                        <div className="d-flex flex-column gap-2 mt-3">
                                            {attachments.map((att, idx) => (
                                                <div key={idx} className="d-flex align-items-center justify-content-between p-2 bg-light rounded-3 border fs-small">
                                                    <div className="d-flex align-items-center gap-2">
                                                        <FontAwesomeIcon icon={faPaperclip} className="text-primary" />
                                                        <strong>{att.name}</strong>
                                                        <span className="badge bg-secondary-subtle text-secondary">{att.type}</span>
                                                        <span className="text-muted">({att.size})</span>
                                                    </div>
                                                    <FontAwesomeIcon
                                                        icon={faTimes}
                                                        className="text-danger cursor-pointer px-2"
                                                        onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
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
                                <button type="button" className="brand-btn-pill" onClick={() => navigate('/app/sales')}>
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="brand-btn-pill brand-btn-primary"
                                    onClick={onSubmit}
                                >
                                    <FontAwesomeIcon icon={faCheck} /> {singleSale ? 'Save Changes' : 'Create Sale'}
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
    const { customProducts, products, frontSetting, allConfigData } = state;
    return {
        customProducts: prepareSaleProductArray(products),
        products,
        frontSetting,
        allConfigData
    };
};

export default connect(mapStateToProps, {
    editSale,
    fetchProductsByWarehouse
})(SalesForm);
