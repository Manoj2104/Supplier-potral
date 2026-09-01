import React, { useEffect, useState } from "react";
import { Card } from "react-bootstrap";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import {
    currencySymbolHandling,
} from "../../shared/sharedMethod";
import { topSellingProduct } from "../../store/action/topSellingProductAction";
import { fetchTopCustomers } from "../../store/action/topCustomersAction";
import { subscribePosDataChanged } from "../../shared/posEvents";
import { getCached } from "../../store/apiCache";

// Real Product Image Extractor
const getRealProductImage = (item) => {
    let rawUrl = null;
    if (item.image) {
        if (typeof item.image === "string") rawUrl = item.image;
        else if (Array.isArray(item.image) && item.image.length > 0) rawUrl = item.image[0];
        else if (typeof item.image === "object") {
            const vals = Object.values(item.image);
            if (vals.length > 0) rawUrl = vals[0];
        }
    }
    if (rawUrl) {
        return String(rawUrl).replaceAll('\\', '/');
    }
    return null;
};

const TopSellingProduct = (props) => {
    const {
        topSelling,
        topSellingProduct,
        frontSetting,
        fetchTopCustomers,
        allConfigData,
        isInitialRefresh = false,
    } = props;

    const [timeframe, setTimeframe] = useState("This Month");

    useEffect(() => {
        topSellingProduct();
        fetchTopCustomers();

        const unsubscribe = subscribePosDataChanged(() => {
            topSellingProduct();
            fetchTopCustomers();
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const currencySymbol = frontSetting?.value?.currency_symbol || "₹";

    return (
        <Card className={`border-0 shadow-sm rounded-4 h-100 bg-white ${isInitialRefresh ? 'dashboard-blur-pulse-active' : ''}`} style={{ borderRadius: "20px" }}>
            {/* Header */}
            <div className="p-3 px-4 pb-0 d-flex align-items-center justify-content-between">
                <h5 className="fw-extrabold text-dark mb-0" style={{ fontSize: "17px", color: "#0F172A", fontWeight: 800 }}>
                    Top Selling Products
                </h5>
                <select
                    className="form-select border rounded-3 py-1 px-2 fw-bold text-secondary"
                    style={{ width: "auto", fontSize: "12.5px", background: "#F8FAFC", cursor: "pointer" }}
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                >
                    <option value="This Week">This Week</option>
                    <option value="This Month">This Month</option>
                    <option value="Today">Today</option>
                </select>
            </div>

            {/* List Body */}
            <Card.Body className="p-3 pt-2 d-flex flex-column justify-content-between">
                {(() => {
                    const cachedList = getCached("dashboard:top_selling") || [];
                    const items = (Array.isArray(topSelling) && topSelling.length > 0) ? topSelling : cachedList;

                    if (items && items.length > 0) {
                        return (
                            <div className="d-flex flex-column gap-2">
                                {items.slice(0, 5).map((item, index) => {
                                    const realImgSrc = getRealProductImage(item);
                                    const categoryName = item.category_name || "General Products";

                                    return (
                                        <div
                                            key={index}
                                            className="d-flex align-items-center justify-content-between p-1 px-2 rounded-3"
                                            style={{ transition: "background 0.2s ease" }}
                                        >
                                            {/* Left: Rank & Image & Title */}
                                            <div className="d-flex align-items-center gap-3" style={{ minWidth: 0 }}>
                                                <span className="fw-extrabold text-dark text-center" style={{ width: "16px", fontSize: "14px", color: "#0F172A", fontWeight: 800 }}>
                                                    {index + 1}
                                                </span>

                                                {realImgSrc ? (
                                                    <img
                                                        src={realImgSrc}
                                                        alt={item.name}
                                                        className="rounded-3 flex-shrink-0"
                                                        style={{
                                                            width: "40px",
                                                            height: "40px",
                                                            objectFit: "cover",
                                                            border: "1px solid #E2E8F0",
                                                            background: "#F8FAFC"
                                                        }}
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                        }}
                                                    />
                                                ) : (
                                                    <div
                                                        className="rounded-3 flex-shrink-0 d-flex align-items-center justify-content-center fw-extrabold text-success"
                                                        style={{
                                                            width: "40px",
                                                            height: "40px",
                                                            background: "#F0FDF4",
                                                            border: "1px solid #DCFCE7",
                                                            fontSize: "15px"
                                                        }}
                                                    >
                                                        {item.name ? item.name.charAt(0).toUpperCase() : 'P'}
                                                    </div>
                                                )}

                                                <div style={{ minWidth: 0 }}>
                                                    <h6
                                                        className="mb-0 fw-extrabold text-dark text-truncate"
                                                        style={{ fontSize: "13px", color: "#0F172A", fontWeight: 700 }}
                                                        title={item.name}
                                                    >
                                                        {item.name}
                                                    </h6>
                                                    <span className="text-muted text-truncate d-block fw-semibold" style={{ fontSize: "11.5px", color: "#64748B" }}>
                                                        {categoryName}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Right: Quantity & Revenue */}
                                            <div className="text-end flex-shrink-0 ms-2">
                                                <div className="fw-extrabold text-dark" style={{ fontSize: "15px", color: "#0F172A", fontWeight: 800 }}>
                                                    {item.total_quantity}
                                                </div>
                                                <div className="text-muted fw-bold" style={{ fontSize: "11.5px", color: "#64748B" }}>
                                                    {currencySymbolHandling(
                                                        allConfigData,
                                                        currencySymbol,
                                                        item.grand_total
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    }

                    return (
                        <div className="text-center py-4 text-muted fs-small">
                            No Top Selling Products Data Available
                        </div>
                    );
                })()}

                {/* Footer View All Button */}
                <div className="text-center mt-2">
                    <Link
                        to="/app/products"
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
    const { topSelling, allConfigData, frontSetting } = state;
    return { topSelling, allConfigData, frontSetting };
};

export default connect(mapStateToProps, {
    topSellingProduct,
    fetchTopCustomers,
})(TopSellingProduct);
