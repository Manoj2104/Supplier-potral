import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { InputGroup } from "react-bootstrap-v5";
import moment from "moment";
import { connect, useDispatch } from "react-redux";
import { fetchProductsByWarehouse } from "../../store/action/productAction";
import ProductRowTable from "../../shared/components/sales/ProductRowTable";
import ProductSearch from "../../shared/components/product-cart/search/ProductSearch";
import {
    decimalValidate,
    getFormattedMessage,
    placeholderText,
    onFocusInput,
    getFormattedOptions,
} from "../../shared/sharedMethod";
import ReactDatePicker from "../../shared/datepicker/ReactDatePicker";
import ProductMainCalculation from "../../components/sales/ProductMainCalculation";
import {
    calculateCartTotalAmount,
    calculateCartTotalTaxAmount,
} from "../../shared/calculation/calculation";
import { prepareSaleProductArray } from "../../shared/prepareArray/prepareSaleArray";
import { editSaleReturn } from "../../store/action/salesReturnAction";
import { fetchFrontSetting } from "../../store/action/frontSettingAction";
import { addToast } from "../../store/action/toastAction";
import { toastType, saleReturnStatusOptions } from "../../constants";
import ReactSelect from "../../shared/select/reactSelect";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faChevronRight,
    faArrowLeft,
    faCalendarDays,
    faFileInvoice,
    faClipboardCheck,
    faBoxesStacked,
    faBoxOpen,
    faBarcode,
    faRotateLeft,
    faBox,
    faMoneyBillTransfer,
    faPaperclip,
    faTrashCan,
    faBookmark,
    faEye,
    faPrint,
    faPlus
} from "@fortawesome/free-solid-svg-icons";
import "./CreateSaleReturnPremium.css";

const SaleReturnForm = (props) => {
    const {
        addSaleData,
        editSaleReturn,
        id,
        singleSale,
        fetchProductsByWarehouse,
        fetchFrontSetting,
        frontSetting,
        allConfigData,
        isEdit,
        customProducts,
        products,
    } = props;

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [updateProducts, setUpdateProducts] = useState([]);
    const [quantity, setQuantity] = useState(1);
    const [newCost, setNewCost] = useState("");
    const [newDiscount, setNewDiscount] = useState("");
    const [newTax, setNewTax] = useState("");
    const [subTotal, setSubTotal] = useState("");
    const [newSaleUnit, setNewSaleUnit] = useState("");

    const [saleReturnValue, setSaleReturnValue] = useState({
        date: new Date(),
        customer_id: "",
        warehouse_id: "",
        sale_id: "",
        sale_reference: "",
        tax_rate: "0.00",
        tax_amount: "0.00",
        discount: "0.00",
        shipping: "0.00",
        grand_total: 0.0,
        notes: "",
        received_amount: 0,
        payment_type: 1,
        paid_amount: 0,
        status: "",
    });

    const [errors, setErrors] = useState({
        date: "",
        customer_id: "",
        warehouse_id: "",
        status: "",
    });

    useEffect(() => {
        updateProducts.length >= 1
            ? dispatch({ type: "DISABLE_OPTION", payload: true })
            : dispatch({ type: "DISABLE_OPTION", payload: false });
    }, [updateProducts]);

    useEffect(() => {
        if (singleSale) {
            setSaleReturnValue({
                date: singleSale ? moment(singleSale.date).toDate() : new Date(),
                customer_id: singleSale ? singleSale.customer_id : "",
                warehouse_id: singleSale ? singleSale.warehouse_id : "",
                sale_id: singleSale ? (singleSale.sale_id || singleSale.id) : "",
                sale_reference: singleSale ? singleSale.sale_reference : "",
                tax_rate: singleSale && singleSale.tax_rate ? singleSale.tax_rate.toFixed(2) : "0.00",
                tax_amount: singleSale && singleSale.tax_amount
                    ? singleSale.tax_amount.toFixed(2)
                    : "0.00",
                discount: singleSale && singleSale.discount ? singleSale.discount.toFixed(2) : "0.00",
                shipping: singleSale && singleSale.shipping ? singleSale.shipping.toFixed(2) : "0.00",
                grand_total: Number(
                    singleSale ? singleSale.grand_total : "0.00"
                ),
                status: singleSale
                    ? singleSale.status_id === 1
                        ? {
                              label: getFormattedMessage(
                                  "status.filter.received.label"
                              ),
                              value: 1,
                          }
                        : {
                              label: getFormattedMessage(
                                  "status.filter.pending.label"
                              ),
                              value: 2,
                          }
                    : {
                          label: getFormattedMessage(
                              "status.filter.received.label"
                          ),
                          value: 1,
                      },
                notes: singleSale
                    ? singleSale.note === null
                        ? ""
                        : singleSale.note
                    : "",
            });

            if (singleSale.sale_items && Array.isArray(singleSale.sale_items) && singleSale.sale_items.length > 0) {
                setUpdateProducts(singleSale.sale_items);
            }
        }
    }, [singleSale]);

    // Enrich items with products array when available
    useEffect(() => {
        if (singleSale && singleSale.sale_items && singleSale.sale_items.length > 0 && products && products.length > 0) {
            const enriched = singleSale.sale_items.map((item) => {
                const matched = products.find(p => String(p.id) === String(item.product_id));
                if (matched && matched.attributes) {
                    return {
                        ...item,
                        name: matched.attributes.name || item.name,
                        code: matched.attributes.code || item.code,
                        stock: matched.attributes.stock ? (matched.attributes.stock.quantity || 100) : (item.stock || 100)
                    };
                }
                return item;
            });
            setUpdateProducts(enriched);
        }
    }, [singleSale, products]);

    useEffect(() => {
        fetchFrontSetting();
    }, []);

    useEffect(() => {
        const whId = saleReturnValue.warehouse_id?.value || saleReturnValue.warehouse_id;
        if (whId) {
            fetchProductsByWarehouse(whId);
        }
    }, [saleReturnValue.warehouse_id]);

    const handleValidation = () => {
        let error = {};
        let isValid = false;
        const qtyCart = updateProducts.filter((a) => a.quantity === 0);

        const custId = saleReturnValue.customer_id?.value || saleReturnValue.customer_id || singleSale?.customer_id?.value || singleSale?.customer_id;
        const whId = saleReturnValue.warehouse_id?.value || saleReturnValue.warehouse_id || singleSale?.warehouse_id?.value || singleSale?.warehouse_id;

        if (!saleReturnValue.date) {
            error["date"] = getFormattedMessage("globally.date.validate.label");
        } else if (!whId) {
            error["warehouse_id"] = getFormattedMessage(
                "product.input.warehouse.validate.label"
            );
        } else if (!custId) {
            error["customer_id"] = getFormattedMessage(
                "sale.select.customer.validate.label"
            );
        } else if (qtyCart.length > 0) {
            dispatch(
                addToast({
                    text: getFormattedMessage(
                        "globally.product-quantity.validate.message"
                    ),
                    type: toastType.ERROR,
                })
            );
        } else if (updateProducts.length < 1) {
            dispatch(
                addToast({
                    text: getFormattedMessage(
                        "purchase.product-list.validate.message"
                    ),
                    type: toastType.ERROR,
                })
            );
        } else if (!saleReturnValue.status) {
            error["status"] = getFormattedMessage(
                "globally.status.validate.label"
            );
        } else {
            isValid = true;
        }
        setErrors(error);
        return isValid;
    };

    const updatedQty = (qty) => setQuantity(qty);
    const updateCost = (cost) => setNewCost(cost);
    const updateDiscount = (discount) => setNewDiscount(discount);
    const updateTax = (tax) => setNewTax(tax);
    const updateSubTotal = (subTotal) => setSubTotal(subTotal);
    const updateSaleUnit = (saleUnit) => setNewSaleUnit(saleUnit);

    const handleCallback = (date) => {
        setSaleReturnValue((previousState) => ({ ...previousState, date: date }));
        setErrors("");
    };

    const onChangeInput = (e) => {
        e.preventDefault();
        const { value } = e.target;
        if (value.match(/\./g)) {
            const [, decimal] = value.split(".");
            if (decimal?.length > 2) return;
        }
        setSaleReturnValue((inputs) => ({
            ...inputs,
            [e.target.name]: value && value,
        }));
    };

    const onStatusChange = (obj) => {
        setSaleReturnValue((inputs) => ({ ...inputs, status: obj }));
    };

    const prepareFormData = (prepareData) => {
        const custId = prepareData.customer_id?.value || prepareData.customer_id || singleSale?.customer_id?.value || singleSale?.customer_id;
        const whId = prepareData.warehouse_id?.value || prepareData.warehouse_id || singleSale?.warehouse_id?.value || singleSale?.warehouse_id;
        const saleIdVal = prepareData.sale_id || singleSale?.sale_id || singleSale?.id || id;
        const saleRefVal = prepareData.sale_reference || singleSale?.sale_reference || '';

        const formValue = {
            date: moment(prepareData.date).toDate(),
            customer_id: custId,
            warehouse_id: whId,
            sale_id: Number(saleIdVal),
            sale_reference: saleRefVal,
            discount: prepareData.discount,
            tax_rate: prepareData.tax_rate,
            tax_amount: calculateCartTotalTaxAmount(
                updateProducts,
                saleReturnValue
            ),
            sale_return_items: updateProducts.map(p => ({
                ...p,
                product_id: Number(p.product_id || p.id),
                quantity: Number(p.quantity || 1)
            })),
            shipping: prepareData.shipping,
            grand_total: Number(
                calculateCartTotalAmount(updateProducts, saleReturnValue)
            ),
            received_amount: 0,
            payment_type: 0,
            paid_amount: 0,
            status: prepareData.status?.value || prepareData.status || 1,
            note: prepareData.notes,
        };
        return formValue;
    };

    const onSubmit = (event) => {
        event.preventDefault();
        const valid = handleValidation();
        if (valid) {
            if (singleSale && singleSale.isCreateSaleReturn) {
                addSaleData(prepareFormData(saleReturnValue), navigate);
            } else {
                editSaleReturn(id, prepareFormData(saleReturnValue), navigate);
                setSaleReturnValue(saleReturnValue);
            }
        }
    };

    const onNotesChangeInput = (e) => {
        e.preventDefault();
        setSaleReturnValue((inputs) => ({ ...inputs, notes: e.target.value }));
    };

    const onBlurInput = (el) => {
        if (el.target.value === "") {
            if (el.target.name === "shipping") setSaleReturnValue({ ...saleReturnValue, shipping: "0.00" });
            if (el.target.name === "discount") setSaleReturnValue({ ...saleReturnValue, discount: "0.00" });
            if (el.target.name === "tax_rate") setSaleReturnValue({ ...saleReturnValue, tax_rate: "0.00" });
        }
    };

    const saleReturnStatusFilterOptions = getFormattedOptions(
        saleReturnStatusOptions
    );
    const saleReturnStatusDefaultValue = saleReturnStatusFilterOptions.map(
        (option) => ({ value: option.id, label: option.name })
    );

    const currencySymbol = (frontSetting && frontSetting.value && frontSetting.value.currency_symbol) || '₹';
    const rawSubTotal = calculateCartTotalAmount(updateProducts, saleReturnValue);
    const calculatedSubTotal = Number(rawSubTotal || 0);

    return (
        <div className="sret-create-page">
            {/* ─── Breadcrumb ───────────────────────────────────────── */}
            <div className="sret-breadcrumb">
                <span>Dashboard</span>
                <span className="sep"><FontAwesomeIcon icon={faChevronRight} /></span>
                <span>Sales</span>
                <span className="sep"><FontAwesomeIcon icon={faChevronRight} /></span>
                <Link to="/app/sale-return" className="text-decoration-none text-muted">Sales Returns</Link>
                <span className="sep"><FontAwesomeIcon icon={faChevronRight} /></span>
                <span className="text-dark fw-bold">{isEdit ? 'Edit Sale Return' : 'Create Sale Return'}</span>
            </div>

            {/* ─── Page Header ──────────────────────────────────────── */}
            <div className="sret-header">
                <div>
                    <h1 className="sret-header-title">{isEdit ? 'Edit Sale Return' : 'Create Sale Return'}</h1>
                    <p className="sret-header-subtitle">
                        Create a new sale return for returned products and process refund or exchange.
                    </p>
                </div>
                <div>
                    <button
                        type="button"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', height: '42px', padding: '0 20px', borderRadius: '999px', border: '1px solid #16A34A', background: '#FFFFFF', color: '#16A34A', fontSize: '13.5px', fontWeight: '700', cursor: 'pointer' }}
                        onClick={() => navigate('/app/sales')}
                    >
                        <FontAwesomeIcon icon={faArrowLeft} /> Back
                    </button>
                </div>
            </div>

            {/* ─── Main 2-Column Responsive Workspace ───────────────── */}
            <form onSubmit={onSubmit}>
                <div className="sret-main-layout">

                    {/* LEFT PANEL (72%) */}
                    <div className="sret-left-panel">

                        {/* SECTION 1: RETURN INFORMATION */}
                        <div className="sret-card">
                            <div className="row g-4">
                                <div className="col-md-4">
                                    <label className="form-label" style={{ fontWeight: '600', fontSize: '13px' }}>
                                        Date <span className="text-danger">*</span>
                                    </label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '16px' }}>
                                            <FontAwesomeIcon icon={faCalendarDays} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <ReactDatePicker onChangeDate={handleCallback} newStartDate={saleReturnValue.date} />
                                        </div>
                                    </div>
                                    <span className="text-danger d-block fs-small mt-1">{errors["date"]}</span>
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label" style={{ fontWeight: '600', fontSize: '13px' }}>
                                        Sale Reference <span className="text-danger">*</span>
                                    </label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '16px' }}>
                                            <FontAwesomeIcon icon={faFileInvoice} />
                                        </div>
                                        <input
                                            type="text"
                                            className="form-control"
                                            readOnly={true}
                                            value={saleReturnValue.sale_reference || singleSale?.sale_reference || 'SA_1111'}
                                            style={{ height: '42px', borderRadius: '12px', background: '#F8FAFC', fontWeight: '700' }}
                                        />
                                    </div>
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label" style={{ fontWeight: '600', fontSize: '13px' }}>
                                        Status <span className="text-danger">*</span>
                                    </label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '16px' }}>
                                            <FontAwesomeIcon icon={faClipboardCheck} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <ReactSelect
                                                multiLanguageOption={saleReturnStatusFilterOptions}
                                                name="status"
                                                value={saleReturnValue.status}
                                                isRequired
                                                placeholder={placeholderText("purchase.select.status.placeholder.label")}
                                                defaultValue={saleReturnStatusDefaultValue[0]}
                                                onChange={onStatusChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2: PRODUCT SELECTION & ORDER ITEMS TABLE */}
                        <div className="sret-card">
                            <h3 className="sret-card-title">
                                <span className="sret-card-icon"><FontAwesomeIcon icon={faBoxesStacked} /></span>
                                Product Selection
                            </h3>

                            <div style={{ marginBottom: '20px' }}>
                                <ProductSearch
                                    values={saleReturnValue}
                                    products={products}
                                    handleValidation={handleValidation}
                                    updateProducts={updateProducts}
                                    setUpdateProducts={setUpdateProducts}
                                    customProducts={customProducts}
                                    isAllProducts={true}
                                />
                            </div>

                            {/* Items Table */}
                            {updateProducts.length === 0 ? (
                                <div className="sret-empty-state">
                                    <div className="sret-empty-icon">
                                        <FontAwesomeIcon icon={faBoxOpen} />
                                    </div>
                                    <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '6px' }}>No products added yet</h4>
                                    <p style={{ fontSize: '13.5px', color: '#64748B', maxWidth: '360px', margin: '0 auto 20px auto' }}>
                                        Search or browse products to add items to this return.
                                    </p>
                                </div>
                            ) : (
                                <div className="custom-responsive">
                                    <ProductRowTable
                                        updateProducts={updateProducts}
                                        setUpdateProducts={setUpdateProducts}
                                        updatedQty={updatedQty}
                                        frontSetting={frontSetting}
                                        isSaleReturn={true}
                                        updateCost={updateCost}
                                        updateDiscount={updateDiscount}
                                        updateTax={updateTax}
                                        updateSubTotal={updateSubTotal}
                                        updateSaleUnit={updateSaleUnit}
                                    />
                                </div>
                            )}

                            {/* Taxes & Shipping Controls */}
                            {updateProducts.length > 0 && (
                                <div className="row g-3 mt-4 pt-3 border-top">
                                    <div className="col-md-4">
                                        <label className="form-label">Order Tax (%)</label>
                                        <InputGroup>
                                            <input
                                                className="form-control"
                                                type="text"
                                                name="tax_rate"
                                                value={saleReturnValue.tax_rate}
                                                onBlur={(event) => onBlurInput(event)}
                                                onFocus={(event) => onFocusInput(event)}
                                                onKeyPress={(event) => decimalValidate(event)}
                                                onChange={(e) => onChangeInput(e)}
                                            />
                                            <InputGroup.Text>%</InputGroup.Text>
                                        </InputGroup>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Discount</label>
                                        <InputGroup>
                                            <input
                                                className="form-control"
                                                type="text"
                                                name="discount"
                                                value={saleReturnValue.discount}
                                                onBlur={(event) => onBlurInput(event)}
                                                onFocus={(event) => onFocusInput(event)}
                                                onKeyPress={(event) => decimalValidate(event)}
                                                onChange={(e) => onChangeInput(e)}
                                            />
                                            <InputGroup.Text>{currencySymbol}</InputGroup.Text>
                                        </InputGroup>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Shipping</label>
                                        <InputGroup>
                                            <input
                                                className="form-control"
                                                type="text"
                                                name="shipping"
                                                value={saleReturnValue.shipping}
                                                onBlur={(event) => onBlurInput(event)}
                                                onFocus={(event) => onFocusInput(event)}
                                                onKeyPress={(event) => decimalValidate(event)}
                                                onChange={(e) => onChangeInput(e)}
                                            />
                                            <InputGroup.Text>{currencySymbol}</InputGroup.Text>
                                        </InputGroup>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* SECTION 3: WORKFLOW SHORTCUTS */}
                        <div className="sret-card">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
                                {[
                                    { icon: faRotateLeft, title: 'Easy Return', desc: 'Select products from the sale to return', color: '#16A34A', bg: '#DCFCE7' },
                                    { icon: faBox, title: 'Stock Update', desc: 'Returned items will update stock', color: '#2563EB', bg: '#DBEAFE' },
                                    { icon: faMoneyBillTransfer, title: 'Refund / Exchange', desc: 'Process refund or exchange instantly', color: '#D97706', bg: '#FEF3C7' },
                                    { icon: faPaperclip, title: 'Notes & Attachments', desc: 'Add notes and attach documents', color: '#9333EA', bg: '#F3E8FF' },
                                ].map((wf) => (
                                    <div key={wf.title} style={{ padding: '16px', borderRadius: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: wf.bg, color: wf.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px', fontSize: '15px' }}>
                                            <FontAwesomeIcon icon={wf.icon} />
                                        </div>
                                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>{wf.title}</div>
                                        <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '3px' }}>{wf.desc}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* RIGHT SIDEBAR PANEL (28% / 320px) */}
                    <div className="sret-sidebar">

                        {/* CARD 1: RETURN SUMMARY */}
                        <div className="sret-summary-card">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <span style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>Return Summary</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: '#475569' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span>Order Tax</span>
                                    <span style={{ fontWeight: '700', color: '#0F172A' }}>{currencySymbol} 0.00 (0.00) %</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span>Discount</span>
                                    <span style={{ fontWeight: '700', color: '#DC2626' }}>{currencySymbol} {parseFloat(saleReturnValue.discount || 0).toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span>Shipping</span>
                                    <span style={{ fontWeight: '700', color: '#0F172A' }}>{currencySymbol} {parseFloat(saleReturnValue.shipping || 0).toFixed(2)}</span>
                                </div>

                                <div className="sret-grand-total-box">
                                    <span className="sret-grand-label">Grand Total</span>
                                    <span className="sret-grand-value">{currencySymbol} {calculatedSubTotal.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* CARD 2: RETURN NOTES */}
                        <div className="sret-summary-card">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                                <span style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>Return Notes</span>
                            </div>
                            <textarea
                                name="notes"
                                className="form-control"
                                rows={3}
                                onChange={(e) => onNotesChangeInput(e)}
                                value={saleReturnValue.notes}
                                placeholder="Add a note for this return..."
                                style={{ borderRadius: '12px', background: '#F8FAFC', fontSize: '13px' }}
                            />
                            <div className="text-end text-muted fs-small mt-1">{(saleReturnValue.notes || '').length} / 300</div>
                        </div>

                        {/* CARD 3: ATTACHMENTS */}
                        <div className="sret-summary-card">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                                <span style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>Attachments</span>
                            </div>
                            <div style={{ border: '2px dashed #CBD5E1', borderRadius: '16px', padding: '20px', textAlign: 'center', background: '#F8FAFC' }}>
                                <FontAwesomeIcon icon={faPaperclip} style={{ fontSize: '20px', color: '#94A3B8', marginBottom: '6px' }} />
                                <div style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>Drag & drop files here or click to browse</div>
                                <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>Supported: PDF, JPG, PNG (Max. 5MB each)</div>
                            </div>
                            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '10px', textAlign: 'center' }}>No files uploaded yet</div>
                        </div>

                    </div>

                </div>

                {/* BOTTOM ACTION BAR (STICKY FOOTER) */}
                <div className="sret-footer-actions">
                    <button type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '42px', padding: '0 20px', borderRadius: '999px', border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#DC2626', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }} onClick={() => setUpdateProducts([])}>
                        <FontAwesomeIcon icon={faTrashCan} /> Clear All
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', height: '42px', padding: '0 18px', borderRadius: '999px', border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#475569', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                            <FontAwesomeIcon icon={faBookmark} /> Save Draft
                        </button>
                        <button type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', height: '42px', padding: '0 18px', borderRadius: '999px', border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#475569', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                            <FontAwesomeIcon icon={faEye} /> Preview Return
                        </button>
                        <button type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', height: '42px', padding: '0 18px', borderRadius: '999px', border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#475569', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                            <FontAwesomeIcon icon={faPrint} /> Print
                        </button>
                        <button type="submit" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', height: '44px', padding: '0 24px', borderRadius: '999px', border: 'none', background: 'linear-gradient(135deg, #15803D 0%, #166534 100%)', color: '#FFFFFF', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 14px rgba(21, 128, 61, 0.35)' }} onClick={onSubmit}>
                            <FontAwesomeIcon icon={faRotateLeft} /> {isEdit ? 'Update Return' : 'Create Return'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

const mapStateToProps = (state) => {
    const { purchaseProducts, products, frontSetting, allConfigData } = state;
    return {
        customProducts: prepareSaleProductArray(products),
        purchaseProducts,
        products,
        frontSetting,
        allConfigData,
    };
};

export default connect(mapStateToProps, {
    editSaleReturn,
    fetchProductsByWarehouse,
    fetchFrontSetting,
})(SaleReturnForm);
