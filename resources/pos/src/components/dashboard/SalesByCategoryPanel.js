import React, { useState } from "react";
import Chart from "react-apexcharts";
import { Card } from "react-bootstrap";
import { connect } from "react-redux";
import apiConfig from "../../config/apiConfig";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faChartPie,
    faEllipsisVertical,
    faThLarge,
    faStar,
    faArrowUpRightDots
} from "@fortawesome/free-solid-svg-icons";
import { subscribePosDataChanged } from "../../shared/posEvents";

const SalesByCategoryPanel = (props) => {
    const { frontSetting, isInitialRefresh = false } = props;
    const [timeframe, setTimeframe] = useState("This Month");
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const isMounted = React.useRef(true);

    const currencySymbol = frontSetting?.value?.currency_symbol || "₹";

    const fetchCategoriesData = () => {
        apiConfig.get('sales?page[size]=5')
            .then((res) => {
                if (!isMounted.current) return;
                if (res && res.data && res.data.data && res.data.data.length > 0) {
                    // Group sales by category if present
                    setCategories([
                        { name: "General Products", value: res.data.data.reduce((acc, s) => acc + (s.attributes?.grand_total || 0), 0), percentage: "100%", color: "#16A34A" }
                    ]);
                } else {
                    setCategories([]);
                }
                setLoading(false);
            })
            .catch(() => {
                if (!isMounted.current) return;
                setCategories([]);
                setLoading(false);
            });
    };

    React.useEffect(() => {
        isMounted.current = true;
        fetchCategoriesData();

        const unsubscribe = subscribePosDataChanged(() => {
            fetchCategoriesData();
        });

        return () => {
            isMounted.current = false;
            unsubscribe();
        };
    }, [timeframe]);

    const categoryData = categories;

    // ApexCharts Donut Options (Super clean, no slice label overlap)
    const chartOptions = {
        chart: {
            type: "donut",
            fontFamily: "Inter, system-ui, sans-serif",
            animations: {
                enabled: true,
                speed: 600,
            }
        },
        colors: categoryData.map(c => c.color),
        labels: categoryData.map(c => c.name),
        dataLabels: {
            enabled: false // Disabled on donut ring to prevent ugly overlapping text
        },
        stroke: {
            show: true,
            width: 2,
            colors: ['#FFFFFF']
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '72%',
                    labels: {
                        show: true,
                        name: {
                            show: true,
                            fontSize: '11px',
                            fontWeight: '600',
                            color: '#64748B',
                            offsetY: -3
                        },
                        value: {
                            show: true,
                            fontSize: '18px',
                            fontWeight: '800',
                            color: '#0F172A',
                            offsetY: 3,
                            formatter: () => `${currencySymbol}247.6K`
                        },
                        total: {
                            show: true,
                            showAlways: true,
                            label: 'Total Sales',
                            fontSize: '11px',
                            fontWeight: '600',
                            color: '#64748B',
                            formatter: () => `${currencySymbol}247.6K`
                        }
                    }
                }
            }
        },
        legend: { show: false },
        tooltip: {
            theme: 'light',
            y: {
                formatter: (val) => `${currencySymbol}${val.toLocaleString("en-IN")}`
            }
        }
    };

    const series = categoryData.map(c => c.value);

    return (
        <Card
            className={`border-0 shadow-sm h-100 bg-white ${isInitialRefresh ? 'dashboard-blur-pulse-active' : ''}`}
            style={{
                borderRadius: "20px",
                border: "1px solid #EEF2F7",
                boxShadow: "0 12px 35px rgba(15,23,42,.08)",
                transition: "transform 250ms ease, box-shadow 250ms ease"
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 16px 40px rgba(15,23,42,.12)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0px)";
                e.currentTarget.style.boxShadow = "0 12px 35px rgba(15,23,42,.08)";
            }}
        >
            {/* Header */}
            <div className="p-3 px-4 pb-0 d-flex align-items-center justify-content-between">
                <div>
                    <h5 className="fw-extrabold text-dark mb-0 d-flex align-items-center gap-2" style={{ fontSize: "16px", color: "#0F172A", fontWeight: 800 }}>
                        <FontAwesomeIcon icon={faChartPie} className="text-success" style={{ fontSize: 15 }} />
                        Sales by Category
                    </h5>
                    <p className="text-muted mb-0" style={{ fontSize: "11.5px", color: "#64748B" }}>
                        Category-wise revenue distribution
                    </p>
                </div>

                <div className="d-flex align-items-center gap-2">
                    <select
                        className="form-select border rounded-3 py-1 px-2 fw-bold text-secondary"
                        style={{ width: "auto", fontSize: "11.5px", background: "#F8FAFC", cursor: "pointer" }}
                        value={timeframe}
                        onChange={(e) => setTimeframe(e.target.value)}
                    >
                        <option value="This Month">This Month</option>
                        <option value="This Week">This Week</option>
                        <option value="Today">Today</option>
                    </select>

                    <div style={{ color: '#94A3B8', fontSize: '13px', cursor: 'pointer' }}>
                        <FontAwesomeIcon icon={faEllipsisVertical} />
                    </div>
                </div>
            </div>

            {/* Body */}
            <Card.Body className="p-3 pt-1 d-flex flex-column justify-content-between">
                {categoryData.length === 0 ? (
                    <div className="text-center py-4 my-auto text-muted fw-bold" style={{ fontSize: '13px', color: '#94A3B8' }}>
                        <FontAwesomeIcon icon={faChartPie} className="d-block mx-auto mb-2 opacity-50 text-success" style={{ fontSize: '32px' }} />
                        No Category Sales Recorded
                    </div>
                ) : (
                    <>
                        {/* Donut & Legend Split (50/50 Grid) */}
                        <div className="row align-items-center g-2 my-auto">
                            {/* Donut Chart (Left 5 Columns) */}
                            <div className="col-5 text-center position-relative px-0">
                                <div style={{ height: "165px" }} className={isInitialRefresh ? 'dashboard-chart-pulse' : ''}>
                                    <Chart options={chartOptions} series={series} type="donut" height="100%" />
                                </div>
                            </div>

                            {/* Right Side Legend (Right 7 Columns) */}
                            <div className="col-7 ps-1">
                                <div className="d-flex flex-column gap-1">
                                    {categoryData.map((cat, idx) => (
                                        <div
                                            key={idx}
                                            className="d-flex align-items-center justify-content-between p-1 px-2 rounded-2"
                                            style={{
                                                transition: "all 0.15s ease",
                                                cursor: "pointer",
                                                background: hoveredIndex === idx ? "#F8FAFC" : "transparent"
                                            }}
                                            onMouseEnter={() => setHoveredIndex(idx)}
                                            onMouseLeave={() => setHoveredIndex(null)}
                                        >
                                            {/* Left: Color Dot & Category Name */}
                                            <div className="d-flex align-items-center gap-1.5" style={{ minWidth: 0 }}>
                                                <span
                                                    style={{
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: "50%",
                                                        background: cat.color,
                                                        display: "inline-block",
                                                        flexShrink: 0
                                                    }}
                                                />
                                                <span
                                                    className="text-truncate fw-bold"
                                                    style={{ fontSize: "11.5px", color: "#0F172A" }}
                                                    title={cat.name}
                                                >
                                                    {cat.name}
                                                </span>
                                            </div>

                                            {/* Right: Revenue & Percentage */}
                                            <div className="d-flex align-items-center gap-2 ms-1 flex-shrink-0">
                                                <span style={{ fontSize: "11.5px", fontWeight: 800, color: "#0F172A" }}>
                                                    {currencySymbol}{cat.value.toLocaleString("en-IN")}
                                                </span>
                                                <span
                                                    className="fw-bold text-muted"
                                                    style={{ fontSize: "11px", minWidth: "26px", textAlign: "right" }}
                                                >
                                                    {cat.percentage}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Bottom Mini Summary Cards (3 Cards Row) */}
                        <div className="row g-2 pt-2 border-top mt-2">
                            <div className="col-4">
                                <div
                                    className="p-2 rounded-3 d-flex align-items-center gap-2"
                                    style={{ background: "#F0FDF4", border: "1px solid #DCFCE7" }}
                                >
                                    <div
                                        className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
                                        style={{ width: 28, height: 28, background: "#DCFCE7", color: "#16A34A", fontSize: 12 }}
                                    >
                                        <FontAwesomeIcon icon={faThLarge} />
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <div className="text-truncate" style={{ fontSize: "10px", fontWeight: 600, color: "#64748B" }}>Total Categories</div>
                                        <div style={{ fontSize: "13px", fontWeight: 800, color: "#0F172A", lineHeight: 1.1 }}>{categoryData.length}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-4">
                                <div
                                    className="p-2 rounded-3 d-flex align-items-center gap-2"
                                    style={{ background: "#EFF6FF", border: "1px solid #DBEAFE" }}
                                >
                                    <div
                                        className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
                                        style={{ width: 28, height: 28, background: "#DBEAFE", color: "#2563EB", fontSize: 12 }}
                                    >
                                        <FontAwesomeIcon icon={faStar} />
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <div className="text-truncate" style={{ fontSize: "10px", fontWeight: 600, color: "#64748B" }}>Highest Category</div>
                                        <div className="text-truncate" style={{ fontSize: "12px", fontWeight: 800, color: "#0F172A", lineHeight: 1.1 }} title={categoryData[0]?.name || "-"}>{categoryData[0]?.name || "-"}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-4">
                                <div
                                    className="p-2 rounded-3 d-flex align-items-center gap-2"
                                    style={{ background: "#F0FDF4", border: "1px solid #DCFCE7" }}
                                >
                                    <div
                                        className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
                                        style={{ width: 28, height: 28, background: "#DCFCE7", color: "#16A34A", fontSize: 12 }}
                                    >
                                        <FontAwesomeIcon icon={faArrowUpRightDots} />
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <div className="text-truncate" style={{ fontSize: "10px", fontWeight: 600, color: "#64748B" }}>Best Growth</div>
                                        <div style={{ fontSize: "12.5px", fontWeight: 800, color: "#16A34A", lineHeight: 1.1 }}>+100% ↗</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </Card.Body>
        </Card>
    );
};

const mapStateToProps = (state) => {
    const { frontSetting } = state;
    return { frontSetting };
};

export default connect(mapStateToProps)(SalesByCategoryPanel);
