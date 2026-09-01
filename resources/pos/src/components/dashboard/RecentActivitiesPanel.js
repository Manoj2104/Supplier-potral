import React, { useEffect } from "react";
import { Card } from "react-bootstrap";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faShoppingCart,
    faWallet,
    faTriangleExclamation,
    faBoxOpen,
    faBagShopping,
    faArrowRight
} from "@fortawesome/free-solid-svg-icons";
import { recentSales } from "../../store/action/recentSaleDashboardAction";
import moment from "moment";
import { subscribePosDataChanged } from "../../shared/posEvents";

const RecentActivitiesPanel = ({ recentSales, recentSalesDashboard, frontSetting, isInitialRefresh = false }) => {
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

    // Build real activity feed from live sale data in state.recentSalesDashboard
    const buildActivities = () => {
        const activities = [];

        if (recentSalesDashboard && recentSalesDashboard.length > 0) {
            recentSalesDashboard.forEach((sale, idx) => {
                const attr = sale.attributes || sale;
                const refNo = attr.reference_code || attr.reference || `#SA-${1000 + idx}`;
                const customer = attr.customer_name || "Walk-in Customer";
                const total = attr.grand_total ? `${currencySymbol} ${parseFloat(attr.grand_total).toLocaleString("en-IN")}` : "";
                const paid = attr.paid_amount ? `${currencySymbol} ${parseFloat(attr.paid_amount).toLocaleString("en-IN")}` : total;
                const createdAt = attr.created_at || attr.date || attr.updated_at;
                const timeAgo = createdAt ? moment(createdAt).fromNow() : `${(idx + 1) * 4}m ago`;

                // Activity 1: Sale Completed
                activities.push({
                    id: `sale-${idx}`,
                    title: "New Sale Completed",
                    subtitle: `${refNo} — ${customer}`,
                    amount: total,
                    time: timeAgo,
                    icon: faShoppingCart,
                    bgColor: "#DCFCE7",
                    iconColor: "#16A34A",
                    link: "/app/sales"
                });

                // Activity 2: Payment Received
                if (attr.payment_status === 1 || parseFloat(attr.paid_amount || attr.grand_total || 0) > 0) {
                    activities.push({
                        id: `pay-${idx}`,
                        title: "Payment Received",
                        subtitle: `Payment for ${refNo} (${customer})`,
                        amount: paid,
                        time: timeAgo,
                        icon: faWallet,
                        bgColor: "#EFF6FF",
                        iconColor: "#2563EB",
                        link: "/app/sales"
                    });
                }
            });
        }

        if (activities.length === 0) {
            return [
                {
                    id: "empty-1",
                    title: "System Ready",
                    subtitle: "No recent transactions found",
                    amount: "",
                    time: "Just now",
                    icon: faBoxOpen,
                    bgColor: "#F1F5F9",
                    iconColor: "#64748B",
                    link: "/app/sales"
                }
            ];
        }

        // STRICT LIMIT: Exactly 5 items max
        return activities.slice(0, 5);
    };

    const activities = buildActivities();

    return (
        <Card className={`border-0 shadow-sm rounded-4 h-100 bg-white ${isInitialRefresh ? 'dashboard-blur-pulse-active' : ''}`} style={{ borderRadius: "20px" }}>
            {/* Header */}
            <div className="p-3 px-4 pb-0 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                    <h5 className="mb-0" style={{ fontSize: "17px", fontWeight: 800, color: "#0F172A" }}>
                        Recent Activities
                    </h5>
                    <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1" style={{ fontSize: "11px", fontWeight: 700, borderRadius: "12px" }}>
                        Live
                    </span>
                </div>
            </div>

            {/* List Body */}
            <Card.Body className="p-3 pt-2 d-flex flex-column justify-content-between">
                <div className="d-flex flex-column gap-2">
                    {activities.map((act) => (
                        <div
                            key={act.id}
                            className="d-flex align-items-center justify-content-between p-2 rounded-3"
                            style={{
                                transition: "all 0.15s ease",
                                border: "1px solid #F1F5F9",
                                background: "#FFFFFF",
                                borderRadius: "14px"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#F8FAFC";
                                e.currentTarget.style.borderColor = "#E2E8F0";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "#FFFFFF";
                                e.currentTarget.style.borderColor = "#F1F5F9";
                            }}
                        >
                            {/* Left Icon & Text */}
                            <div className="d-flex align-items-center gap-3" style={{ minWidth: 0 }}>
                                <div
                                    className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                                    style={{
                                        width: "40px",
                                        height: "40px",
                                        background: act.bgColor,
                                        color: act.iconColor,
                                        fontSize: "16px",
                                        borderRadius: "12px"
                                    }}
                                >
                                    <FontAwesomeIcon icon={act.icon} />
                                </div>

                                <div style={{ minWidth: 0 }}>
                                    <h6
                                        className="mb-0 text-truncate"
                                        style={{ fontSize: "13.5px", fontWeight: 800, color: "#0F172A", letterSpacing: "-0.2px" }}
                                    >
                                        {act.title}
                                    </h6>
                                    <span
                                        className="text-truncate d-block"
                                        style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}
                                    >
                                        {act.subtitle}
                                    </span>
                                </div>
                            </div>

                            {/* Right Amount & Time */}
                            <div className="text-end flex-shrink-0 ms-2">
                                {act.amount && (
                                    <div style={{ fontSize: "13px", fontWeight: 800, color: "#0F172A" }}>
                                        {act.amount}
                                    </div>
                                )}
                                <span
                                    className="d-inline-block px-2 py-0.5 rounded-2 mt-0.5"
                                    style={{
                                        fontSize: "11px",
                                        fontWeight: 700,
                                        color: "#64748B",
                                        background: "#F1F5F9",
                                        whiteSpace: "nowrap"
                                    }}
                                >
                                    {act.time}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Centered View All Button (Matches Top Selling Products) */}
                <div className="text-center mt-3">
                    <Link
                        to="/app/sales"
                        className="btn border rounded-pill px-4 py-1 text-success fw-extrabold"
                        style={{ fontSize: "12.5px", borderColor: "#86EFAC", background: "#FFFFFF", textDecoration: "none", fontWeight: 700 }}
                    >
                        View All
                    </Link>
                </div>
            </Card.Body>
        </Card>
    );
};

const mapStateToProps = (state) => {
    return {
        recentSalesDashboard: state.recentSalesDashboard,
        frontSetting: state.frontSetting
    };
};

export default connect(mapStateToProps, { recentSales })(RecentActivitiesPanel);
