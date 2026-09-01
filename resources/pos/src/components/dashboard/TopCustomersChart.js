import React, { useEffect } from 'react';
import { Card, ProgressBar } from 'react-bootstrap';
import moment from 'moment';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { currencySymbolHandling, getFormattedMessage } from '../../shared/sharedMethod';
import { fetchTopCustomers } from '../../store/action/topCustomersAction';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { subscribePosDataChanged } from '../../shared/posEvents';

// Helper to get initials
const getInitials = (name) => {
    const str = typeof name === "string" ? name : (name ? String(name) : "C");
    if (!str) return "C";
    const parts = str.trim().split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) return (parts[0][0] + parts[1][0]).toUpperCase();
    return str.slice(0, 2).toUpperCase();
};

// Rank Badge Styling Helper
const getRankBadgeStyle = (rank) => {
    switch (rank) {
        case 1:
            return { bg: "#FEF3C7", color: "#D97706", border: "1px solid #FDE68A", label: "🥇 #1" };
        case 2:
            return { bg: "#F1F5F9", color: "#475569", border: "1px solid #E2E8F0", label: "🥈 #2" };
        case 3:
            return { bg: "#FFEDD5", color: "#C2410C", border: "1px solid #FED7AA", label: "🥉 #3" };
        default:
            return { bg: "#F8FAFC", color: "#64748B", border: "1px solid #E2E8F0", label: `#${rank}` };
    }
};

const TopCustomersChart = (props) => {
    const { frontSetting, topCustomers, allConfigData, languageCode, fetchTopCustomers, isInitialRefresh = false } = props;

    useEffect(() => {
        if (fetchTopCustomers) {
            fetchTopCustomers();
        }
        const unsubscribe = subscribePosDataChanged(() => {
            if (fetchTopCustomers) {
                fetchTopCustomers();
            }
        });
        return () => {
            unsubscribe();
        };
    }, []);

    const month = new Date();
    const currencySymbol = frontSetting?.value?.currency_symbol || "₹";

    const customerNames = topCustomers && topCustomers.name ? topCustomers.name : [];
    const customerTotals = topCustomers && topCustomers.grand_total ? topCustomers.grand_total : [];

    // Form leaderboard array from database
    const rawCustomers = customerNames.map((name, i) => ({
        name,
        total: parseFloat(customerTotals[i] || 0)
    })).sort((a, b) => b.total - a.total).slice(0, 5);

    const totalRevenue = rawCustomers.reduce((acc, curr) => acc + curr.total, 0) || 1;

    return (
        <Card
            className={`border-0 bg-white h-100 ${isInitialRefresh ? 'dashboard-blur-pulse-active' : ''}`}
            style={{
                borderRadius: "24px",
                boxShadow: "0 10px 30px rgba(15,23,42,.06)",
                border: "1px solid #EEF2F7",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
            }}
        >
            {/* Header */}
            <div className="p-4 pb-3 border-bottom border-light">
                <h5 className="mb-0 fw-extrabold text-dark" style={{ fontSize: "18px", color: "#0F172A", fontWeight: 800 }}>
                    {getFormattedMessage('dashboard.top-customers.title')}{" "}
                    ({moment(month).locale(languageCode || 'en').format('MMMM')})
                </h5>
            </div>

            {/* Leaderboard Body */}
            <Card.Body className="p-4 flex-grow-1 d-flex flex-column justify-content-center">
                {rawCustomers.length > 0 ? (
                    <div className="d-flex flex-column gap-3">
                        {rawCustomers.map((cust, index) => {
                            const rank = index + 1;
                            const badge = getRankBadgeStyle(rank);
                            const percentage = Math.round((cust.total / totalRevenue) * 100);

                            return (
                                <div key={index} className="d-flex flex-column gap-1.5 p-2 rounded-3" style={{ background: "#F8FAFC", border: "1px solid #F1F5F9" }}>
                                    <div className="d-flex align-items-center justify-content-between">
                                        {/* Rank & Avatar & Name */}
                                        <div className="d-flex align-items-center gap-2.5" style={{ minWidth: 0 }}>
                                            <span
                                                className="badge px-2 py-1 rounded-pill flex-shrink-0"
                                                style={{
                                                    background: badge.bg,
                                                    color: badge.color,
                                                    border: badge.border,
                                                    fontSize: "11px",
                                                    fontWeight: 800
                                                }}
                                            >
                                                {badge.label}
                                            </span>

                                            <div
                                                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 fw-extrabold text-success"
                                                style={{
                                                    width: "34px",
                                                    height: "34px",
                                                    background: "#DCFCE7",
                                                    border: "1px solid #86EFAC",
                                                    fontSize: "12.5px"
                                                }}
                                            >
                                                {getInitials(cust.name)}
                                            </div>

                                            <div style={{ minWidth: 0 }}>
                                                <h6 className="mb-0 fw-extrabold text-dark text-truncate" style={{ fontSize: "13.5px", color: "#0F172A", fontWeight: 800 }}>
                                                    {cust.name}
                                                </h6>
                                            </div>
                                        </div>

                                        {/* Amount & Percentage */}
                                        <div className="text-end flex-shrink-0 ms-2">
                                            <div
                                                className="fw-extrabold text-dark"
                                                style={{ fontSize: "14px", color: "#0F172A", fontWeight: 800, cursor: "help" }}
                                                title={`${currencySymbol} ${parseFloat(cust.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                            >
                                                {currencySymbolHandling(allConfigData, currencySymbol, cust.total, true)}
                                            </div>
                                            <span className="text-muted fw-bold" style={{ fontSize: "11px", color: "#64748B" }}>
                                                {percentage}% of total sales
                                            </span>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <ProgressBar
                                        now={percentage}
                                        style={{ height: "5px", borderRadius: "10px", background: "#E2E8F0" }}
                                        variant="success"
                                    />
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-5 text-muted fw-bold" style={{ fontSize: "13px" }}>
                        No Customer Data Available
                    </div>
                )}
            </Card.Body>

            {/* Footer View Full Report Button */}
            <div className="p-3 px-4 text-center border-top border-light">
                <Link
                    to="/app/report/report-customer"
                    className="btn border rounded-pill px-4 py-1.5 text-success fw-extrabold d-inline-flex align-items-center gap-2"
                    style={{ fontSize: "13px", borderColor: "#86EFAC", background: "#FFFFFF", textDecoration: "none", fontWeight: 800 }}
                >
                    View Full Report <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: 11 }} />
                </Link>
            </div>
        </Card>
    );
};

const mapStateToProps = (state) => {
    const { topCustomers, allConfigData, frontSetting } = state;
    return { topCustomers, allConfigData, frontSetting };
};

export default connect(mapStateToProps, { fetchTopCustomers })(TopCustomersChart);
