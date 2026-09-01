import React, { useEffect, useState } from "react";
import { Card, Table, OverlayTrigger, Tooltip } from "react-bootstrap";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import {
    currencySymbolHandling,
    getFormattedMessage,
} from "../../shared/sharedMethod";
import { recentSales } from "../../store/action/recentSaleDashboardAction";
import { salePdfAction } from "../../store/action/salePdfAction";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faChevronLeft, faChevronRight, faPrint } from "@fortawesome/free-solid-svg-icons";
import { subscribePosDataChanged } from "../../shared/posEvents";

// Helper to get initials
const getInitials = (name) => {
    const str = typeof name === "string" ? name : (name ? String(name) : "C");
    if (!str) return "C";
    const parts = str.trim().split(/[\s-]+/);
    if (parts.length >= 2 && parts[0] && parts[1]) return (parts[0][0] + parts[1][0]).toUpperCase();
    return str.slice(0, 2).toUpperCase();
};

// Customer Avatar Color Generator
const getCustomerAvatarStyle = (name) => {
    const cleanName = (typeof name === "string" ? name : (name ? String(name) : "")).toLowerCase();
    if (cleanName.includes("walk-in")) {
        return { bg: "#BFDBFE", color: "#1E40AF" };
    } else if (cleanName.includes("manoj")) {
        return { bg: "#86EFAC", color: "#15803D" };
    } else if (cleanName.includes("saravanan")) {
        return { bg: "#CBD5E1", color: "#334155" };
    }
    return { bg: "#E2E8F0", color: "#475569" };
};

const RecentSale = (props) => {
    const { recentSales, recentSalesDashboard, frontSetting, allConfigData, salePdfAction, isInitialRefresh = false } = props;

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    useEffect(() => {
        recentSales();
        const unsubscribe = subscribePosDataChanged(() => {
            recentSales();
        });
        return () => {
            unsubscribe();
        };
    }, []);

    const currencySymbol = frontSetting?.value?.currency_symbol || "₹";

    const salesData = Array.isArray(recentSalesDashboard) ? recentSalesDashboard : [];
    const totalPages = Math.ceil(salesData.length / itemsPerPage) || 1;
    const paginatedSales = salesData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handlePrintInvoice = (e, item) => {
        e.preventDefault();
        e.stopPropagation();
        const id = item.id || (item.attributes && item.attributes.id);
        if (id && salePdfAction) {
            salePdfAction(id);
        } else if (id) {
            window.open(`#/app/sales/detail/${id}`, '_blank');
        }
    };

    return (
        <Card
            className={`border-0 bg-white ${isInitialRefresh ? 'dashboard-blur-pulse-active' : ''}`}
            style={{
                borderRadius: "24px",
                boxShadow: "0 10px 30px rgba(15,23,42,.06)",
                border: "1px solid #EEF2F7",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
            }}
        >
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-4">
                <h5 className="mb-0 fw-extrabold text-dark" style={{ fontSize: "18px", color: "#0F172A", fontWeight: 800 }}>
                    {getFormattedMessage("dashboard.recentSales.title")}
                </h5>
                <Link
                    to="/app/sales"
                    className="btn btn-sm border rounded-pill px-3 py-1 fw-bold text-success d-inline-flex align-items-center gap-1"
                    style={{ fontSize: "12.5px", borderColor: "#86EFAC", background: "#FFFFFF", textDecoration: "none", color: "#16A34A" }}
                >
                    View All <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: 11 }} />
                </Link>
            </div>

            {/* Table Area (Clean ERP Layout matching reference image) */}
            <div className="overflow-auto mb-3">
                <Table responsive borderless className="align-middle mb-0">
                    <thead>
                        <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                            <th style={{ fontSize: "11px", fontWeight: 800, color: "#64748B", textTransform: "uppercase", padding: "12px 14px", letterSpacing: "0.5px" }}>
                                REFERENCE
                            </th>
                            <th style={{ fontSize: "11px", fontWeight: 800, color: "#64748B", textTransform: "uppercase", padding: "12px 14px", letterSpacing: "0.5px" }}>
                                CUSTOMER
                            </th>
                            <th style={{ fontSize: "11px", fontWeight: 800, color: "#64748B", textTransform: "uppercase", padding: "12px 14px", letterSpacing: "0.5px" }}>
                                CASHIER
                            </th>
                            <th style={{ fontSize: "11px", fontWeight: 800, color: "#64748B", textTransform: "uppercase", padding: "12px 14px", letterSpacing: "0.5px" }}>
                                STATUS
                            </th>
                            <th style={{ fontSize: "11px", fontWeight: 800, color: "#64748B", textTransform: "uppercase", padding: "12px 14px", letterSpacing: "0.5px" }}>
                                GRAND TOTAL
                            </th>
                            <th style={{ fontSize: "11px", fontWeight: 800, color: "#64748B", textTransform: "uppercase", padding: "12px 14px", letterSpacing: "0.5px" }}>
                                PAID
                            </th>
                            <th style={{ fontSize: "11px", fontWeight: 800, color: "#64748B", textTransform: "uppercase", padding: "12px 14px", letterSpacing: "0.5px" }}>
                                DUE
                            </th>
                            <th style={{ fontSize: "11px", fontWeight: 800, color: "#64748B", textTransform: "uppercase", padding: "12px 14px", letterSpacing: "0.5px" }}>
                                PAYMENT STATUS
                            </th>
                            <th style={{ fontSize: "11px", fontWeight: 800, color: "#64748B", textTransform: "uppercase", padding: "12px 14px", letterSpacing: "0.5px", textAlign: "center" }}>
                                INVOICE
                            </th>
                        </tr>
                    </thead>
                    <tbody className="text-nowrap">
                        {recentSalesDashboard === null || recentSalesDashboard === undefined ? (
                            [1, 2, 3, 4, 5].map((i) => (
                                <tr key={i}>
                                    <td style={{ padding: "14px" }}><div className="skeleton" style={{ width: "80px", height: "16px", borderRadius: "4px" }} /></td>
                                    <td style={{ padding: "14px" }}><div className="d-flex align-items-center gap-2"><div className="skeleton" style={{ width: "28px", height: "28px", borderRadius: "50%" }} /><div className="skeleton" style={{ width: "100px", height: "14px", borderRadius: "4px" }} /></div></td>
                                    <td style={{ padding: "14px" }}><div className="skeleton" style={{ width: "70px", height: "14px", borderRadius: "4px" }} /></td>
                                    <td style={{ padding: "14px" }}><div className="skeleton" style={{ width: "90px", height: "14px", borderRadius: "4px" }} /></td>
                                    <td style={{ padding: "14px" }}><div className="skeleton" style={{ width: "80px", height: "14px", borderRadius: "4px" }} /></td>
                                    <td style={{ padding: "14px" }}><div className="skeleton" style={{ width: "60px", height: "14px", borderRadius: "4px" }} /></td>
                                    <td style={{ padding: "14px" }}><div className="skeleton" style={{ width: "60px", height: "14px", borderRadius: "4px" }} /></td>
                                    <td style={{ padding: "14px" }}><div className="skeleton" style={{ width: "65px", height: "20px", borderRadius: "50px" }} /></td>
                                    <td style={{ padding: "14px" }}><div className="skeleton" style={{ width: "70px", height: "24px", borderRadius: "50px" }} /></td>
                                </tr>
                            ))
                        ) : paginatedSales && paginatedSales.length > 0 ? (
                            paginatedSales.map((recentSale, index) => {
                                const attr = recentSale.attributes || recentSale;
                                const status = attr.status;
                                const paymentStatus = attr.payment_status;
                                const customerName = attr.customer_name || "walk-in-customer";
                                const cashierName = attr.cashier_name || "admin";
                                const avatarStyle = getCustomerAvatarStyle(customerName);

                                const renderTooltip = (props) => (
                                    <Tooltip id={`tooltip-sale-${index}`} {...props}>
                                        {currencySymbolHandling(
                                            allConfigData,
                                            currencySymbol,
                                            attr.grand_total
                                        )}
                                    </Tooltip>
                                );

                                return (
                                    <tr
                                        key={index}
                                        style={{
                                            borderBottom: index === paginatedSales.length - 1 ? "none" : "1px solid #F8FAFC",
                                            transition: "background 0.2s ease"
                                        }}
                                    >
                                        {/* Reference (Green Text) */}
                                        <td style={{ padding: "14px" }}>
                                            <span className="fw-extrabold text-success" style={{ fontSize: "13.5px", color: "#16A34A", fontWeight: 700 }}>
                                                {attr.reference_code || attr.reference}
                                            </span>
                                        </td>

                                        {/* Customer (Avatar + Name) */}
                                        <td style={{ padding: "14px" }}>
                                            <div className="d-flex align-items-center gap-2">
                                                <div
                                                    className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 fw-extrabold"
                                                    style={{
                                                        width: "28px",
                                                        height: "28px",
                                                        background: avatarStyle.bg,
                                                        color: avatarStyle.color,
                                                        fontSize: "11px"
                                                    }}
                                                >
                                                    {getInitials(customerName)}
                                                </div>
                                                <span className="fw-bold text-dark" style={{ fontSize: "13px", color: "#0F172A" }}>
                                                    {customerName}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Cashier (Green Avatar + Name) */}
                                        <td style={{ padding: "14px" }}>
                                            <div className="d-flex align-items-center gap-2">
                                                <div
                                                    className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 fw-extrabold"
                                                    style={{
                                                        width: "28px",
                                                        height: "28px",
                                                        background: "#16A34A",
                                                        color: "#FFFFFF",
                                                        fontSize: "11px"
                                                    }}
                                                >
                                                    {getInitials(cashierName)}
                                                </div>
                                                <span className="fw-bold text-dark" style={{ fontSize: "13px", color: "#0F172A" }}>
                                                    {cashierName}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Status Badge */}
                                        <td style={{ padding: "14px" }}>
                                            {status === 1 ? (
                                                <span className="badge px-3 py-1 rounded-pill" style={{ background: "#DCFCE7", color: "#16A34A", fontSize: "12px", fontWeight: 600 }}>
                                                    Completed
                                                </span>
                                            ) : (
                                                <span className="badge px-3 py-1 rounded-pill" style={{ background: "#FEF3C7", color: "#D97706", fontSize: "12px", fontWeight: 600 }}>
                                                    Pending
                                                </span>
                                            )}
                                        </td>

                                        {/* Grand Total */}
                                        <td style={{ padding: "14px" }}>
                                            <OverlayTrigger placement="bottom" delay={{ show: 250, hide: 400 }} overlay={renderTooltip}>
                                                <span className="fw-extrabold text-dark" style={{ fontSize: "13.5px", color: "#0F172A", fontWeight: 800 }}>
                                                    {currencySymbolHandling(allConfigData, currencySymbol, attr.grand_total)}
                                                </span>
                                            </OverlayTrigger>
                                        </td>

                                        {/* Paid */}
                                        <td style={{ padding: "14px" }}>
                                            <span className="fw-bold text-dark" style={{ fontSize: "13.5px", color: "#0F172A" }}>
                                                {currencySymbolHandling(allConfigData, currencySymbol, attr.paid_amount || attr.grand_total || "0.00")}
                                            </span>
                                        </td>

                                        {/* Due */}
                                        <td style={{ padding: "14px" }}>
                                            <span className="fw-bold text-dark" style={{ fontSize: "13.5px", color: "#0F172A" }}>
                                                {currencySymbolHandling(allConfigData, currencySymbol, paymentStatus === 1 ? "0.00" : (attr.grand_total || "0.00"))}
                                            </span>
                                        </td>

                                        {/* Payment Status Badge */}
                                        <td style={{ padding: "14px" }}>
                                            {paymentStatus === 1 ? (
                                                <span className="badge px-3 py-1 rounded-pill" style={{ background: "#DCFCE7", color: "#16A34A", fontSize: "12px", fontWeight: 600 }}>
                                                    Paid
                                                </span>
                                            ) : (
                                                <span className="badge px-3 py-1 rounded-pill" style={{ background: "#FEF3C7", color: "#D97706", fontSize: "12px", fontWeight: 600 }}>
                                                    Due
                                                </span>
                                            )}
                                        </td>

                                        {/* Invoice Column (Reprint Action Button) */}
                                        <td style={{ padding: "14px", textAlign: "center" }}>
                                            <button
                                                type="button"
                                                className="btn btn-sm border rounded-pill px-3 py-1 text-success fw-bold d-inline-flex align-items-center gap-1.5"
                                                style={{
                                                    fontSize: "12px",
                                                    background: "#F0FDF4",
                                                    borderColor: "#86EFAC",
                                                    color: "#16A34A",
                                                    cursor: "pointer",
                                                    whiteSpace: "nowrap"
                                                }}
                                                title="Reprint Invoice"
                                                onClick={(e) => handlePrintInvoice(e, recentSale)}
                                            >
                                                <FontAwesomeIcon icon={faPrint} style={{ fontSize: "11px", color: "#16A34A" }} />
                                                <span>Reprint</span>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="9" className="text-center py-5 text-muted fw-bold" style={{ fontSize: "13px" }}>
                                    No Recent Sales Available
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>

            {/* Pagination Controls */}
            <div className="d-flex align-items-center justify-content-between pt-2">
                <span className="text-muted fw-bold" style={{ fontSize: "12.5px", color: "#64748B" }}>
                    Showing {salesData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, salesData.length)} of {salesData.length} entries
                </span>

                <div className="d-flex align-items-center gap-1">
                    <button
                        className="btn btn-sm rounded-3 px-2.5 py-1 text-secondary"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        style={{ fontSize: "12px", background: "#F8FAFC", border: "1px solid #F1F5F9" }}
                    >
                        <FontAwesomeIcon icon={faChevronLeft} />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                            key={page}
                            className={`btn btn-sm rounded-3 px-3 py-1 fw-bold ${currentPage === page ? "text-white" : "text-dark"}`}
                            onClick={() => setCurrentPage(page)}
                            style={{
                                fontSize: "13px",
                                background: currentPage === page ? "#16A34A" : "#F8FAFC",
                                border: currentPage === page ? "none" : "1px solid #F1F5F9",
                                fontWeight: 700
                            }}
                        >
                            {page}
                        </button>
                    ))}

                    <button
                        className="btn btn-sm rounded-3 px-2.5 py-1 text-secondary"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        style={{ fontSize: "12px", background: "#F8FAFC", border: "1px solid #F1F5F9" }}
                    >
                        <FontAwesomeIcon icon={faChevronRight} />
                    </button>
                </div>
            </div>
        </Card>
    );
};

const mapStateToProps = (state) => {
    const { recentSalesDashboard, allConfigData, frontSetting } = state;
    return { recentSalesDashboard, allConfigData, frontSetting };
};

export default connect(mapStateToProps, { recentSales, salePdfAction })(RecentSale);
