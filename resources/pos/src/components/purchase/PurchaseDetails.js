import React, { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import moment from "moment";
import { Table } from "react-bootstrap-v5";
import { connect, useDispatch } from "react-redux";
import {
    faUser,
    faEnvelope,
    faLocationDot,
    faPhone,
    faBuilding,
    faStore,
    faFileLines,
    faBoxesStacked,
    faChevronRight,
    faArrowLeft,
    faCheckCircle,
    faCalendarAlt,
    faCreditCard,
    faTag,
    faUserCheck,
    faPenToSquare,
    faFilePdf,
    faReceipt,
    faClock,
    faBoxOpen
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MasterLayout from "../MasterLayout";
import TabTitle from "../../shared/tab-title/TabTitle";
import {
    currencySymbolHandling,
    getFormattedMessage,
    placeholderText,
    getFormattedDate
} from "../../shared/sharedMethod";
import { purchaseDetailsAction } from "../../store/action/purchaseDetailsAction";
import { purchasePdfAction } from "../../store/action/purchaseAction";
import { fetchFrontSetting } from "../../store/action/frontSettingAction";
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";
import FormPageSkeleton from "../../shared/components/skeletons/FormPageSkeleton";
import "./PurchaseDetailsPremium.css";

const PurchaseDetails = (props) => {
    const {
        purchaseDetailsAction,
        purchaseDetails,
        fetchFrontSetting,
        frontSetting,
        allConfigData,
        isLoading
    } = props;
    const { id } = useParams();
    const dispatch = useDispatch();

    useEffect(() => {
        fetchFrontSetting();
        purchaseDetailsAction(id);
    }, [id]);

    const currencySymbol =
        frontSetting &&
        frontSetting.value &&
        frontSetting.value.currency_symbol ? frontSetting.value.currency_symbol : '₹';

    // Comprehensive extraction of attributes handling single object, array, or wrapped data
    const attr = purchaseDetails?.attributes 
        || purchaseDetails?.data?.attributes 
        || (Array.isArray(purchaseDetails) ? (purchaseDetails[0]?.attributes || purchaseDetails[0]) : null)
        || (purchaseDetails?.data && Array.isArray(purchaseDetails.data) ? purchaseDetails.data[0]?.attributes : null)
        || purchaseDetails 
        || {};

    const statusVal = Number(attr?.status);
    const statusText = statusVal === 1 ? 'Received' : statusVal === 2 ? 'Pending' : statusVal === 3 ? 'Ordered' : 'Received';
    const isReceived = statusVal === 1 || !statusVal;

    const formattedDate = attr?.date
        ? `${getFormattedDate(attr.date, allConfigData)} ${moment(attr.created_at || attr.date).format("hh:mm A")}`
        : moment().format('DD MMM YYYY hh:mm A');

    // Purchase items array resolution
    const rawItems = attr?.purchase_items 
        || attr?.purchase_return_items 
        || attr?.items 
        || (Array.isArray(attr) ? attr : [])
        || [];

    const items = Array.isArray(rawItems) ? rawItems : [];

    const totalQuantity = items.reduce((sum, item) => {
        const itemObj = item?.attributes || item || {};
        return sum + (Number(itemObj.quantity) || 0);
    }, 0);

    const extractItemImage = (itemAttr) => {
        if (!itemAttr) return null;
        const prod = itemAttr.product || {};
        if (prod.image_url?.imageUrls) {
            const urls = prod.image_url.imageUrls;
            const first = Object.values(urls)[0];
            if (first && typeof first === 'string') return first;
        }
        if (typeof prod.image_url === 'string' && prod.image_url.length > 5) return prod.image_url;
        if (typeof prod.product_image === 'string' && prod.product_image.length > 5) return prod.product_image;
        if (typeof itemAttr.image === 'string' && itemAttr.image.length > 5) return itemAttr.image;
        if (typeof itemAttr.product_image === 'string' && itemAttr.product_image.length > 5) return itemAttr.product_image;
        return null;
    };

    const handlePdfDownload = () => {
        dispatch(purchasePdfAction(id));
    };

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title={placeholderText("purchases.details.title")} />

            {isLoading || !purchaseDetails ? (
                <FormPageSkeleton />
            ) : (
                <div className="pur-detail-page">
                    {/* ─── Breadcrumb ───────────────────────────────────────── */}
                    <div className="pur-detail-breadcrumb">
                        <Link to="/app/dashboard" className="text-decoration-none text-muted">Dashboard</Link>
                        <span className="sep"><FontAwesomeIcon icon={faChevronRight} /></span>
                        <Link to="/app/purchases" className="text-decoration-none text-muted">Purchases</Link>
                        <span className="sep"><FontAwesomeIcon icon={faChevronRight} /></span>
                        <span className="text-dark fw-bold">Purchase Details</span>
                    </div>

                    {/* ─── Page Header ──────────────────────────────────────── */}
                    <div className="pur-detail-header">
                        <div>
                            <div className="d-flex align-items-center gap-3">
                                <h1 className="pur-detail-header-title">Purchase Details</h1>
                                <span className={`badge px-3 py-1.5 rounded-pill fw-bold ${isReceived ? 'bg-success-subtle text-success border border-success' : 'bg-warning-subtle text-warning border border-warning'}`} style={{ fontSize: '13px' }}>
                                    <FontAwesomeIcon icon={isReceived ? faCheckCircle : faClock} className="me-1" /> {statusText}
                                </span>
                            </div>
                            <p className="pur-detail-header-subtitle">
                                Reference: <strong className="text-dark">{attr?.reference_code || `PU_${id}`}</strong> &bull; Created on {formattedDate}
                            </p>
                        </div>
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                            <Link to="/app/purchases" className="brand-btn-pill" style={{ textDecoration: 'none' }}>
                                <FontAwesomeIcon icon={faArrowLeft} /> Back
                            </Link>
                            <Link to={`/app/purchases/edit/${id}`} className="brand-btn-pill" style={{ textDecoration: 'none' }}>
                                <FontAwesomeIcon icon={faPenToSquare} /> Edit
                            </Link>
                            <button type="button" onClick={handlePdfDownload} className="brand-btn-pill">
                                <FontAwesomeIcon icon={faFilePdf} /> Download PDF
                            </button>
                        </div>
                    </div>

                    {/* ─── Top 3 Info Cards Grid ─────────────────────────────── */}
                    <div className="pur-detail-info-grid mb-4">
                        {/* Column 1: Supplier Info */}
                        <div className="pur-detail-info-card">
                            <div className="pur-detail-card-head green">
                                <div className="pur-detail-col-icon green">
                                    <FontAwesomeIcon icon={faUser} />
                                </div>
                                <span className="pur-detail-head-label">Supplier Information</span>
                            </div>
                            <div className="pur-detail-card-body">
                                <div className="pur-detail-entity-name">
                                    {attr?.supplier_name || attr?.supplier?.name || 'Apex Appliance Distributors'}
                                </div>
                                <div className="pur-detail-row">
                                    <FontAwesomeIcon icon={faEnvelope} className="pur-icon-muted" />
                                    <span>{attr?.supplier?.email || attr?.supplier_email || '—'}</span>
                                </div>
                                <div className="pur-detail-row">
                                    <FontAwesomeIcon icon={faPhone} className="pur-icon-muted" />
                                    <span>{attr?.supplier?.phone || attr?.supplier_phone || '—'}</span>
                                </div>
                                <div className="pur-detail-row">
                                    <FontAwesomeIcon icon={faLocationDot} className="pur-icon-muted" />
                                    <span>{attr?.supplier?.address || attr?.supplier_address || '—'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Company Info */}
                        <div className="pur-detail-info-card">
                            <div className="pur-detail-card-head blue">
                                <div className="pur-detail-col-icon blue">
                                    <FontAwesomeIcon icon={faBuilding} />
                                </div>
                                <span className="pur-detail-head-label">Company Information</span>
                            </div>
                            <div className="pur-detail-card-body">
                                <div className="pur-detail-entity-name">
                                    {attr?.company_info?.company_name || 'Suguna'}
                                </div>
                                <div className="pur-detail-row">
                                    <FontAwesomeIcon icon={faEnvelope} className="pur-icon-muted" />
                                    <span>{attr?.company_info?.email || 'support@suguna.com'}</span>
                                </div>
                                <div className="pur-detail-row">
                                    <FontAwesomeIcon icon={faPhone} className="pur-icon-muted" />
                                    <span>{attr?.company_info?.phone || '9345635571'}</span>
                                </div>
                                <div className="pur-detail-row">
                                    <FontAwesomeIcon icon={faLocationDot} className="pur-icon-muted" />
                                    <span>{attr?.company_info?.address || 'Chennai, Tamil Nadu 600081, India'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Column 3: Purchase Meta Info */}
                        <div className="pur-detail-info-card">
                            <div className="pur-detail-card-head purple">
                                <div className="pur-detail-col-icon purple">
                                    <FontAwesomeIcon icon={faFileLines} />
                                </div>
                                <span className="pur-detail-head-label">Purchase Meta</span>
                            </div>
                            <div className="pur-detail-card-body">
                                <div className="d-flex align-items-center justify-content-between py-1 border-bottom">
                                    <span className="text-muted fs-small">Reference:</span>
                                    <span className="badge bg-light text-dark border fw-bold font-monospace px-2.5 py-1">
                                        {attr?.reference_code || `PU_${id}`}
                                    </span>
                                </div>
                                <div className="d-flex align-items-center justify-content-between py-1 border-bottom">
                                    <span className="text-muted fs-small">Warehouse:</span>
                                    <span className="fw-bold text-dark fs-small">
                                        {attr?.warehouse_name || attr?.warehouse?.name || 'Suguna Warehouse'}
                                    </span>
                                </div>
                                <div className="d-flex align-items-center justify-content-between py-1 border-bottom">
                                    <span className="text-muted fs-small">Purchase Date:</span>
                                    <span className="fw-bold text-dark fs-small">{formattedDate}</span>
                                </div>
                                <div className="d-flex align-items-center justify-content-between py-1">
                                    <span className="text-muted fs-small">Status:</span>
                                    <span className={`badge px-2.5 py-0.5 rounded-pill fw-bold ${isReceived ? 'bg-success-subtle text-success border border-success' : 'bg-warning-subtle text-warning border border-warning'}`} style={{ fontSize: '11.5px' }}>
                                        {statusText}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ─── Order Summary Table Card ─────────────────────────── */}
                    <div className="pur-detail-card">
                        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
                            <div className="d-flex align-items-center gap-3">
                                <div className="create-section-icon green" style={{ width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#DCFCE7', color: '#15803D', fontSize: '18px' }}>
                                    <FontAwesomeIcon icon={faBoxesStacked} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                                        Order Summary
                                    </h3>
                                    <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
                                        Configured product items and financial calculations
                                    </p>
                                </div>
                            </div>

                            <div className="d-flex align-items-center gap-2">
                                <span className="badge px-3 py-2 rounded-pill fw-bold" style={{ background: '#DCFCE7', color: '#15803D', fontSize: '12.5px' }}>
                                    {items.length} Products
                                </span>
                                <span className="badge px-3 py-2 rounded-pill fw-bold" style={{ background: '#F1F5F9', color: '#475569', fontSize: '12.5px' }}>
                                    Total Qty: {totalQuantity}
                                </span>
                            </div>
                        </div>

                        <div className="pur-detail-summary-layout">
                            {/* Left: Product Items Table */}
                            <div>
                                <div className="pur-detail-table-wrap">
                                    <Table responsive className="align-middle mb-0" style={{ borderCollapse: 'separate', borderSpacing: 0, border: '1.5px solid #E2E8F0', borderRadius: '16px', overflow: 'hidden' }}>
                                        <thead>
                                            <tr style={{ background: '#F8FAFC' }}>
                                                <th style={{ padding: '14px 16px', color: '#64748B', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1.5px solid #E2E8F0' }}>#</th>
                                                <th style={{ padding: '14px 16px', color: '#64748B', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1.5px solid #E2E8F0' }}>Product</th>
                                                <th style={{ padding: '14px 16px', color: '#64748B', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1.5px solid #E2E8F0' }}>Net Unit Cost</th>
                                                <th style={{ padding: '14px 16px', color: '#64748B', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1.5px solid #E2E8F0' }}>Quantity</th>
                                                <th style={{ padding: '14px 16px', color: '#64748B', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1.5px solid #E2E8F0' }}>Unit Cost</th>
                                                <th style={{ padding: '14px 16px', color: '#64748B', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1.5px solid #E2E8F0' }}>Discount</th>
                                                <th style={{ padding: '14px 16px', color: '#64748B', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1.5px solid #E2E8F0' }}>Tax</th>
                                                <th style={{ padding: '14px 16px', color: '#64748B', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1.5px solid #E2E8F0', textAlign: 'right' }}>Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items && items.length > 0 ? (
                                                items.map((details, index) => {
                                                    const itemAttr = details?.attributes || details || {};
                                                    const prod = itemAttr.product || {};
                                                    const prodName = itemAttr.product_name || prod.name || itemAttr.name || 'Product';
                                                    const prodCode = itemAttr.product_code || prod.code || prod.product_code || itemAttr.code || '—';
                                                    const netCost = Number(itemAttr.net_unit_cost ?? itemAttr.product_cost ?? prod.product_cost ?? 0);
                                                    const unitCost = Number(itemAttr.product_cost ?? prod.product_cost ?? netCost ?? 0);
                                                    const qty = Number(itemAttr.quantity ?? 1);
                                                    const discount = Number(itemAttr.discount_amount ?? 0);
                                                    const tax = Number(itemAttr.tax_amount ?? 0);
                                                    const subTotal = Number(itemAttr.sub_total ?? (netCost * qty - discount + tax) ?? 0);
                                                    const thumbUrl = extractItemImage(itemAttr);

                                                    return (
                                                        <tr key={index} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                                            <td style={{ padding: '14px 16px', fontWeight: '700', color: '#94A3B8', fontSize: '13px' }}>
                                                                {index + 1}
                                                            </td>
                                                            <td style={{ padding: '14px 16px' }}>
                                                                <div className="d-flex align-items-center gap-3">
                                                                    {thumbUrl ? (
                                                                        <img
                                                                            src={thumbUrl}
                                                                            alt=""
                                                                            style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #E2E8F0', flexShrink: 0 }}
                                                                            onError={(e) => { e.target.style.display = 'none'; }}
                                                                        />
                                                                    ) : (
                                                                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', flexShrink: 0 }}>
                                                                            <FontAwesomeIcon icon={faBoxesStacked} style={{ fontSize: '16px' }} />
                                                                        </div>
                                                                    )}
                                                                    <div>
                                                                        <div style={{ fontWeight: '800', fontSize: '14px', color: '#0F172A', marginBottom: '2px' }}>
                                                                            {prodName}
                                                                        </div>
                                                                        <span style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#64748B', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', fontFamily: 'monospace' }}>
                                                                            {prodCode}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: '14px 16px', fontWeight: '700', fontSize: '13.5px', color: '#0F172A' }}>
                                                                {currencySymbolHandling(allConfigData, currencySymbol, netCost)}
                                                            </td>
                                                            <td style={{ padding: '14px 16px' }}>
                                                                <span style={{ background: '#DCFCE7', color: '#15803D', fontSize: '12px', fontWeight: '800', padding: '4px 10px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                                    {qty} pc
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '14px 16px', fontWeight: '700', fontSize: '13.5px', color: '#475569' }}>
                                                                {currencySymbolHandling(allConfigData, currencySymbol, unitCost)}
                                                            </td>
                                                            <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748B', fontWeight: '600' }}>
                                                                {discount > 0 ? currencySymbolHandling(allConfigData, currencySymbol, discount) : '—'}
                                                            </td>
                                                            <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748B', fontWeight: '600' }}>
                                                                {tax > 0 ? currencySymbolHandling(allConfigData, currencySymbol, tax) : '—'}
                                                            </td>
                                                            <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '900', fontSize: '14.5px', color: '#15803D' }}>
                                                                {currencySymbolHandling(allConfigData, currencySymbol, subTotal)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan={8} className="text-center py-5 text-muted">
                                                        <FontAwesomeIcon icon={faBoxOpen} style={{ fontSize: '32px', color: '#CBD5E1', display: 'block', margin: '0 auto 10px auto' }} />
                                                        No order items found for this purchase.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                            </div>

                            {/* Right: Financial Totals Card */}
                            <div className="pur-detail-totals-box">
                                <div style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <FontAwesomeIcon icon={faReceipt} style={{ color: '#15803D' }} />
                                    Financial Summary
                                </div>
                                <div className="pur-detail-tot-row">
                                    <span>Order Tax</span>
                                    <span className="fw-bold text-dark">
                                        {currencySymbolHandling(allConfigData, currencySymbol, attr?.tax_amount || 0)} ({parseFloat(attr?.tax_rate || 0).toFixed(0)}%)
                                    </span>
                                </div>
                                <div className="pur-detail-tot-row">
                                    <span>Discount</span>
                                    <span className="fw-bold text-dark">
                                        {currencySymbolHandling(allConfigData, currencySymbol, attr?.discount || 0)}
                                    </span>
                                </div>
                                <div className="pur-detail-tot-row">
                                    <span>Shipping</span>
                                    <span className="fw-bold text-dark">
                                        {currencySymbolHandling(allConfigData, currencySymbol, attr?.shipping || 0)}
                                    </span>
                                </div>

                                <div className="pur-detail-grand-box">
                                    <span className="pur-detail-grand-lbl">Grand Total</span>
                                    <span className="pur-detail-grand-val">
                                        {currencySymbolHandling(allConfigData, currencySymbol, attr?.grand_total || 0)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ─── Bottom 4 Metric Cards ────────────────────────────── */}
                    <div className="pur-detail-bottom-grid">
                        <div className="pur-detail-metric-card">
                            <div className="pur-detail-metric-icon green">
                                <FontAwesomeIcon icon={faCalendarAlt} />
                            </div>
                            <div>
                                <div className="pur-detail-metric-title">Payment Terms</div>
                                <div className="pur-detail-metric-val">Net 15 Days</div>
                            </div>
                        </div>

                        <div className="pur-detail-metric-card">
                            <div className="pur-detail-metric-icon blue">
                                <FontAwesomeIcon icon={faCreditCard} />
                            </div>
                            <div>
                                <div className="pur-detail-metric-title">Payment Status</div>
                                <div className="pur-detail-metric-val text-success">
                                    {isReceived ? 'Paid' : 'Pending'}
                                </div>
                            </div>
                        </div>

                        <div className="pur-detail-metric-card">
                            <div className="pur-detail-metric-icon purple">
                                <FontAwesomeIcon icon={faTag} />
                            </div>
                            <div>
                                <div className="pur-detail-metric-title">Payment Method</div>
                                <div className="pur-detail-metric-val">Credit / Bank</div>
                            </div>
                        </div>

                        <div className="pur-detail-metric-card">
                            <div className="pur-detail-metric-icon orange">
                                <FontAwesomeIcon icon={faUserCheck} />
                            </div>
                            <div>
                                <div className="pur-detail-metric-title">Created By</div>
                                <div className="pur-detail-metric-val">Administrator</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </MasterLayout>
    );
};

const mapStateToProps = (state) => {
    const { purchaseDetails, frontSetting, allConfigData, isLoading } = state;
    return { purchaseDetails, frontSetting, allConfigData, isLoading };
};

export default connect(mapStateToProps, {
    purchaseDetailsAction,
    fetchFrontSetting,
})(PurchaseDetails);

