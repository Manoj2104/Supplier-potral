import React, { useEffect } from "react";
import { connect } from "react-redux";
import { Link, useParams } from "react-router-dom";
import MasterLayout from "../MasterLayout";
import TabTitle from "../../shared/tab-title/TabTitle";
import {
    currencySymbolHandling,
    getFormattedDate,
    getFormattedMessage,
    placeholderText,
} from "../../shared/sharedMethod";
import { fetchFrontSetting } from "../../store/action/frontSettingAction";
import { quotationDetailsAction } from "../../store/action/quotationDetails";
import { quotationPdfAction } from "../../store/action/quotationPdfAction";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faEnvelope,
    faLocationDot,
    faMobileAlt,
    faUser,
    faBuilding,
    faFileInvoice,
    faFilePdf,
    faShoppingCart,
    faEdit,
    faArrowLeft,
    faWarehouse,
    faBarcode,
    faCheckCircle,
    faClock,
    faReceipt,
} from "@fortawesome/free-solid-svg-icons";
import FormPageSkeleton from "../../shared/components/skeletons/FormPageSkeleton";
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";
import "./ProductQuotationsPremium.css";

const QuotationDetails = (props) => {
    const {
        quotationDetailsAction,
        quotationPdfAction,
        quotationDetails,
        fetchFrontSetting,
        frontSetting,
        allConfigData,
    } = props;
    const { id } = useParams();

    useEffect(() => {
        fetchFrontSetting();
    }, []);

    useEffect(() => {
        quotationDetailsAction(id);
    }, [id]);

    const isSent = quotationDetails && quotationDetails.status === 1;
    const isPending = quotationDetails && quotationDetails.status === 2;

    const handlePdfPrint = () => {
        if (quotationDetails && quotationDetails.id) {
            quotationPdfAction(quotationDetails.id);
        }
    };

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title={placeholderText("details-quotations.title")} />

            {!quotationDetails || !quotationDetails.reference_code ? (
                <div className="qd-page-container">
                    <FormPageSkeleton />
                </div>
            ) : (
                <div className="qd-page-container">
                    {/* ── 1. Header & Navigation Row ────────────────── */}
                    <div className="qd-header-wrap">
                        <div>
                            <div className="qd-breadcrumb">
                                <Link to="/app/dashboard" className="qd-crumb-link">Dashboard</Link>
                                <span>&gt;</span>
                                <Link to="/app/quotations" className="qd-crumb-link">Quotations</Link>
                                <span>&gt;</span>
                                <span className="qd-crumb-active">{quotationDetails.reference_code}</span>
                            </div>

                            <div className="qd-title-row">
                                <h1>Quotation Details</h1>
                                <span className="qd-ref-pill">
                                    {quotationDetails.reference_code}
                                </span>
                                {isSent && (
                                    <span className="qd-status-pill sent">
                                        <span className="qd-status-dot"></span>
                                        {getFormattedMessage("status.filter.sent.label") || "Sent"}
                                    </span>
                                )}
                                {isPending && (
                                    <span className="qd-status-pill pending">
                                        <span className="qd-status-dot"></span>
                                        {getFormattedMessage("status.filter.pending.label") || "Pending"}
                                    </span>
                                )}
                            </div>
                            <p className="qd-subtitle">
                                Created on {quotationDetails.date ? getFormattedDate(quotationDetails.date, allConfigData && allConfigData.date_format) : "—"} • Warehouse: <strong>{quotationDetails.warehouse ? quotationDetails.warehouse.name : "Main Warehouse"}</strong>
                            </p>
                        </div>

                        {/* Right Action Buttons */}
                        <div className="qd-actions-group">
                            <button
                                type="button"
                                className="qd-btn-pill primary"
                                onClick={handlePdfPrint}
                                title="Download PDF / Print"
                            >
                                <FontAwesomeIcon icon={faFilePdf} /> PDF / Print
                            </button>

                            <Link
                                to={`/app/quotations/Create_sale/${id}`}
                                className="qd-btn-pill purple"
                                title="Convert Quotation to Real Sale"
                            >
                                <FontAwesomeIcon icon={faShoppingCart} /> Convert to Sale
                            </Link>

                            <Link
                                to={`/app/quotations/edit/${id}`}
                                className="qd-btn-pill"
                                title="Edit Quotation"
                            >
                                <FontAwesomeIcon icon={faEdit} /> Edit
                            </Link>

                            <Link
                                to="/app/quotations"
                                className="qd-btn-pill"
                                title="Back to Quotations List"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} /> Back
                            </Link>
                        </div>
                    </div>

                    {/* ── 2. 3 Luxury Info Cards Grid ──────────────── */}
                    <div className="qd-cards-grid">
                        {/* Customer Info Card */}
                        <div className="qd-info-card">
                            <div className="qd-card-head">
                                <div className="qd-card-icon blue">
                                    <FontAwesomeIcon icon={faUser} />
                                </div>
                                <span className="qd-card-title">
                                    {getFormattedMessage("sale.detail.customer.info")}
                                </span>
                            </div>
                            <div className="qd-primary-name">
                                {quotationDetails.customer ? quotationDetails.customer.name : "Walk-in Customer"}
                            </div>
                            <div className="qd-info-row">
                                <FontAwesomeIcon icon={faEnvelope} className="qd-row-icon" />
                                <span>{quotationDetails.customer && quotationDetails.customer.email ? quotationDetails.customer.email : "No email provided"}</span>
                            </div>
                            <div className="qd-info-row">
                                <FontAwesomeIcon icon={faMobileAlt} className="qd-row-icon" />
                                <span>{quotationDetails.customer && quotationDetails.customer.phone ? quotationDetails.customer.phone : "No phone provided"}</span>
                            </div>
                            <div className="qd-info-row">
                                <FontAwesomeIcon icon={faLocationDot} className="qd-row-icon" />
                                <span>{quotationDetails.customer && quotationDetails.customer.address ? quotationDetails.customer.address : "No address available"}</span>
                            </div>
                        </div>

                        {/* Company Info Card */}
                        <div className="qd-info-card">
                            <div className="qd-card-head">
                                <div className="qd-card-icon green">
                                    <FontAwesomeIcon icon={faBuilding} />
                                </div>
                                <span className="qd-card-title">
                                    {getFormattedMessage("globally.detail.company.info")}
                                </span>
                            </div>
                            <div className="qd-primary-name">
                                {quotationDetails.company_info ? quotationDetails.company_info.company_name : (allConfigData ? allConfigData.app_name : "Suguna POS Enterprise")}
                            </div>
                            <div className="qd-info-row">
                                <FontAwesomeIcon icon={faEnvelope} className="qd-row-icon" />
                                <span>{quotationDetails.company_info && quotationDetails.company_info.email ? quotationDetails.company_info.email : (allConfigData ? allConfigData.email : "info@suguna.com")}</span>
                            </div>
                            <div className="qd-info-row">
                                <FontAwesomeIcon icon={faMobileAlt} className="qd-row-icon" />
                                <span>{quotationDetails.company_info && quotationDetails.company_info.phone ? quotationDetails.company_info.phone : (allConfigData ? allConfigData.phone : "—")}</span>
                            </div>
                            <div className="qd-info-row">
                                <FontAwesomeIcon icon={faLocationDot} className="qd-row-icon" />
                                <span>{quotationDetails.company_info && quotationDetails.company_info.address ? quotationDetails.company_info.address : (allConfigData ? allConfigData.address : "Chennai, India")}</span>
                            </div>
                        </div>

                        {/* Quotation & Warehouse Summary Card */}
                        <div className="qd-info-card">
                            <div className="qd-card-head">
                                <div className="qd-card-icon purple">
                                    <FontAwesomeIcon icon={faFileInvoice} />
                                </div>
                                <span className="qd-card-title">
                                    {getFormattedMessage("quotation.detail.invoice.info")}
                                </span>
                            </div>
                            <div className="qd-primary-name" style={{ color: '#7E22CE' }}>
                                Ref: {quotationDetails.reference_code}
                            </div>
                            <div className="qd-info-row">
                                <FontAwesomeIcon icon={faWarehouse} className="qd-row-icon" />
                                <span>Warehouse: <strong>{quotationDetails.warehouse ? quotationDetails.warehouse.name : "Main Warehouse"}</strong></span>
                            </div>
                            <div className="qd-info-row">
                                <FontAwesomeIcon icon={faClock} className="qd-row-icon" />
                                <span>Date: <strong>{quotationDetails.date ? getFormattedDate(quotationDetails.date, allConfigData && allConfigData.date_format) : "—"}</strong></span>
                            </div>
                            <div className="qd-info-row">
                                <FontAwesomeIcon icon={faCheckCircle} className="qd-row-icon" />
                                <span>
                                    Status: {isSent ? (
                                        <strong style={{ color: '#15803D' }}>Sent to Customer</strong>
                                    ) : (
                                        <strong style={{ color: '#D97706' }}>Pending Review</strong>
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ── 3. Products Order Summary Box ─────────────── */}
                    <div className="qd-main-box">
                        <div className="qd-section-header">
                            <div className="qd-section-title">
                                <FontAwesomeIcon icon={faReceipt} style={{ color: '#15803D' }} />
                                {getFormattedMessage("globally.detail.order.summary")}
                            </div>
                            <span className="qd-section-badge">
                                {quotationDetails.quotation_items ? quotationDetails.quotation_items.length : 0} Item(s)
                            </span>
                        </div>

                        {/* Items Table */}
                        <div className="qd-table-wrap">
                            <table className="qd-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '40px' }}>#</th>
                                        <th>{getFormattedMessage("globally.detail.product")}</th>
                                        <th>{getFormattedMessage("globally.detail.net-unit-price")}</th>
                                        <th style={{ textAlign: 'center' }}>{getFormattedMessage("globally.detail.quantity")}</th>
                                        <th>{getFormattedMessage("globally.detail.unit-price")}</th>
                                        <th>{getFormattedMessage("globally.detail.discount")}</th>
                                        <th>{getFormattedMessage("globally.detail.tax")}</th>
                                        <th style={{ textAlign: 'right', paddingRight: '20px' }}>{getFormattedMessage("globally.detail.subtotal")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {quotationDetails.quotation_items && quotationDetails.quotation_items.length > 0 ? (
                                        quotationDetails.quotation_items.map((item, idx) => (
                                            <tr key={idx}>
                                                <td style={{ color: '#94A3B8', fontWeight: '700' }}>{idx + 1}</td>
                                                <td>
                                                    <div className="qd-product-name">
                                                        {item.product ? item.product.name : "Product Item"}
                                                    </div>
                                                    <div className="qd-product-code">
                                                        <FontAwesomeIcon icon={faBarcode} style={{ marginRight: '5px', color: '#94A3B8' }} />
                                                        {item.product ? item.product.code : "—"}
                                                    </div>
                                                </td>
                                                <td>
                                                    {currencySymbolHandling(
                                                        allConfigData,
                                                        frontSetting.value && frontSetting.value.currency_symbol,
                                                        item.net_unit_price
                                                    )}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span className="qd-qty-badge">
                                                        {item.quantity}
                                                    </span>
                                                </td>
                                                <td>
                                                    {currencySymbolHandling(
                                                        allConfigData,
                                                        frontSetting.value && frontSetting.value.currency_symbol,
                                                        item.product_price
                                                    )}
                                                </td>
                                                <td>
                                                    {currencySymbolHandling(
                                                        allConfigData,
                                                        frontSetting.value && frontSetting.value.currency_symbol,
                                                        item.discount_amount
                                                    )}
                                                </td>
                                                <td>
                                                    {currencySymbolHandling(
                                                        allConfigData,
                                                        frontSetting.value && frontSetting.value.currency_symbol,
                                                        item.tax_amount
                                                    )}
                                                </td>
                                                <td style={{ textAlign: 'right', fontWeight: '800', paddingRight: '20px', color: '#0F172A' }}>
                                                    {currencySymbolHandling(
                                                        allConfigData,
                                                        frontSetting.value && frontSetting.value.currency_symbol,
                                                        item.sub_total
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#94A3B8' }}>
                                                No items found in this quotation.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* ── 4. Notes & Financial Calculation Summary ── */}
                        <div className="qd-bottom-grid">
                            {/* Notes / Terms */}
                            <div className="qd-notes-card">
                                <div className="qd-notes-title">Quotation Terms &amp; Notes</div>
                                <p className="qd-notes-text">
                                    {quotationDetails.note || quotationDetails.remarks ? (
                                        quotationDetails.note || quotationDetails.remarks
                                    ) : (
                                        "This quotation is valid for 30 days from the date of issue. Prices and availability are subject to final confirmation upon sales order creation."
                                    )}
                                </p>
                            </div>

                            {/* Totals Summary */}
                            <div className="qd-summary-card">
                                <div className="qd-summary-row">
                                    <span>{getFormattedMessage("globally.detail.order.tax")}</span>
                                    <span>
                                        {currencySymbolHandling(
                                            allConfigData,
                                            frontSetting.value && frontSetting.value.currency_symbol,
                                            quotationDetails.tax_amount > 0 ? quotationDetails.tax_amount : "0.00"
                                        )}{" "}
                                        <small style={{ color: '#94A3B8' }}>
                                            ({parseFloat(quotationDetails.tax_rate || 0).toFixed(2)}%)
                                        </small>
                                    </span>
                                </div>

                                <div className="qd-summary-row">
                                    <span>{getFormattedMessage("globally.detail.discount")}</span>
                                    <span>
                                        {currencySymbolHandling(
                                            allConfigData,
                                            frontSetting.value && frontSetting.value.currency_symbol,
                                            quotationDetails.discount || "0.00"
                                        )}
                                    </span>
                                </div>

                                <div className="qd-summary-row">
                                    <span>{getFormattedMessage("globally.detail.shipping")}</span>
                                    <span>
                                        {currencySymbolHandling(
                                            allConfigData,
                                            frontSetting.value && frontSetting.value.currency_symbol,
                                            quotationDetails.shipping || "0.00"
                                        )}
                                    </span>
                                </div>

                                <div className="qd-summary-row total">
                                    <span>{getFormattedMessage("globally.detail.grand.total")}</span>
                                    <span className="qd-grand-total-val">
                                        {currencySymbolHandling(
                                            allConfigData,
                                            frontSetting.value && frontSetting.value.currency_symbol,
                                            quotationDetails.grand_total
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </MasterLayout>
    );
};

const mapStateToProps = (state) => {
    const { quotationDetails, frontSetting, allConfigData } = state;
    return { quotationDetails, frontSetting, allConfigData };
};

export default connect(mapStateToProps, {
    quotationDetailsAction,
    quotationPdfAction,
    fetchFrontSetting,
})(QuotationDetails);

