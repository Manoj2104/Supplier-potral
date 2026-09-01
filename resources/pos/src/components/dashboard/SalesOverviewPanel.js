import React, { useEffect, useState, useRef } from "react";
import Chart from "react-apexcharts";
import { Card } from "react-bootstrap";
import { connect } from "react-redux";
import moment from "moment";
import {
    currencySymbolHandling,
} from "../../shared/sharedMethod";
import { weekSalePurchases } from "../../store/action/weeksalePurchaseAction";
import { fetchAllSalePurchaseCount } from "../../store/action/allSalePurchaseAction";
import { recentSales } from "../../store/action/recentSaleDashboardAction";
import apiConfig from "../../config/apiConfig";
import { subscribePosDataChanged } from "../../shared/posEvents";

const SalesOverviewPanel = (props) => {
    const {
        frontSetting,
        weekSalePurchases,
        weekSalePurchase,
        fetchAllSalePurchaseCount,
        allSalePurchase,
        recentSales,
        recentSalesDashboard,
        allConfigData,
        isInitialRefresh = false,
    } = props;

    const [timeframe, setTimeframe] = useState("This Week");
    const [totalOrdersCount, setTotalOrdersCount] = useState(0);
    const isMounted = useRef(true);

    const loadPanelData = () => {
        weekSalePurchases();
        fetchAllSalePurchaseCount();
        recentSales();

        apiConfig.get('sales?page[size]=1')
            .then((res) => {
                if (isMounted.current && res && res.data && res.data.meta && res.data.meta.total !== undefined) {
                    setTotalOrdersCount(res.data.meta.total);
                }
            })
            .catch(() => null);
    };

    useEffect(() => {
        isMounted.current = true;
        loadPanelData();

        const unsubscribe = subscribePosDataChanged(() => {
            loadPanelData();
        });

        return () => {
            isMounted.current = false;
            unsubscribe();
        };
    }, []);

    const currencySymbol = frontSetting?.value?.currency_symbol || "₹";

    // Format dates for X-Axis
    const rawDates = weekSalePurchase && weekSalePurchase.dates ? weekSalePurchase.dates : [];
    const formattedDates = rawDates.length > 0
        ? rawDates.map(d => moment(d).isValid() ? moment(d).format('ddd') : d)
        : ['Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue'];

    // Real-time sales and purchases series data from DB
    const rawSalesData = weekSalePurchase && Array.isArray(weekSalePurchase.sales)
        ? weekSalePurchase.sales.map(v => parseFloat(v || 0))
        : [0, 0, 0, 0, 0, 0, 0];

    const rawPurchasesData = weekSalePurchase && Array.isArray(weekSalePurchase.purchases)
        ? weekSalePurchase.purchases.map(v => parseFloat(v || 0))
        : [0, 0, 0, 0, 0, 0, 0];

    // Real-time Total Sales Amount
    const totalSalesNum = allSalePurchase && allSalePurchase.all_sales_count !== undefined
        ? parseFloat(allSalePurchase.all_sales_count || 0)
        : rawSalesData.reduce((acc, curr) => acc + curr, 0);

    // Real-time Orders Count
    const ordersCountNum = totalOrdersCount > 0
        ? totalOrdersCount
        : (recentSalesDashboard && recentSalesDashboard.length > 0 ? recentSalesDashboard.length : (totalSalesNum > 0 ? 1 : 0));

    // Real-time Average Order Value = Total Sales / Orders Count
    const avgOrderNum = ordersCountNum > 0 ? totalSalesNum / ordersCountNum : 0;

    // Real-time Conversion / Paid Rate
    const paidSalesCount = recentSalesDashboard && recentSalesDashboard.length > 0
        ? recentSalesDashboard.filter(s => (s.attributes || s).payment_status === 1 || parseFloat((s.attributes || s).paid_amount || 0) > 0).length
        : 0;

    const convRateNum = recentSalesDashboard && recentSalesDashboard.length > 0
        ? ((paidSalesCount / recentSalesDashboard.length) * 100).toFixed(1)
        : (totalSalesNum > 0 ? "100.0" : "0.0");

    // Helper formatter for Compact Currency (e.g. ₹1.25M, ₹247.6K, ₹8.02K)
    const formatCompactCurrency = (num) => {
        if (!num || num === 0) return `${currencySymbol}0.00`;
        if (num >= 1000000) return `${currencySymbol}${(num / 1000000).toFixed(2)}M`;
        if (num >= 1000) return `${currencySymbol}${(num / 1000).toFixed(2)}K`;
        return `${currencySymbol}${num.toFixed(2)}`;
    };

    // Calculate max values to scale visual bars perfectly
    const maxSaleVal = Math.max(...rawSalesData, 1);
    const maxPurchaseVal = Math.max(...rawPurchasesData, 1);
    const globalMaxVal = Math.max(maxSaleVal, maxPurchaseVal, 1000);

    // Smart Visual Bar Heights (Ensures both Sales & Purchases bars are bold, tall, and prominent)
    const visualSalesData = rawSalesData.map(val => {
        if (val === 0) return 0;
        // Non-linear scaling so smaller sales bars (e.g. 247K vs 2M purchase) stay visually tall (60-80% height)
        const ratio = val / globalMaxVal;
        return Math.round(globalMaxVal * Math.pow(ratio, 0.4));
    });

    const series = [
        {
            name: "Sales",
            data: rawSalesData.length > 0 ? rawSalesData : [0, 0, 0, 0, 0, 0, 0],
        },
        {
            name: "Purchases",
            data: rawPurchasesData.length > 0 ? rawPurchasesData : [0, 0, 0, 0, 0, 0, 0],
        },
    ];

    // ApexCharts Modern Rounded Bar Options
    const barOptions = {
        chart: {
            type: "bar",
            height: 220,
            toolbar: { show: false },
            fontFamily: "Inter, system-ui, sans-serif",
            animations: {
                enabled: true,
                easing: "easeinout",
                speed: 600,
            },
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: "32%",
                borderRadius: 4,
                borderRadiusApplication: "end",
            },
        },
        colors: ["#16A34A", "#2563EB"],
        dataLabels: { enabled: false },
        stroke: { show: true, width: 2, colors: ["transparent"] },
        xaxis: {
            categories: formattedDates,
            labels: {
                style: {
                    colors: "#64748B",
                    fontSize: "12px",
                    fontWeight: 500,
                    fontFamily: "Inter, sans-serif",
                },
            },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: {
            labels: {
                style: {
                    colors: "#94A3B8",
                    fontSize: "11px",
                    fontWeight: 500,
                    fontFamily: "Inter, sans-serif",
                },
                formatter: (val) => {
                    if (val >= 10000000) return `${currencySymbol}${(val / 10000000).toFixed(1)}Cr`;
                    if (val >= 100000) return `${currencySymbol}${(val / 100000).toFixed(1)}L`;
                    if (val >= 1000) return `${currencySymbol}${(val / 1000).toFixed(0)}K`;
                    return `${currencySymbol}${val.toFixed(0)}`;
                },
            },
        },
        grid: {
            borderColor: "#F1F5F9",
            strokeDashArray: 4,
            padding: { top: 0, right: 0, bottom: 0, left: 10 },
        },
        legend: {
            position: "top",
            horizontalAlign: "left",
            fontSize: "13px",
            fontWeight: 600,
            fontFamily: "Inter, sans-serif",
            markers: { radius: 3, width: 10, height: 10 },
            itemMargin: { horizontal: 10, vertical: 0 },
        },
        tooltip: {
            theme: "light",
            y: {
                formatter: (val) => `${currencySymbol} ${val.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
            },
        },
    };

    return (
        <Card className={`border-0 shadow-sm rounded-4 h-100 bg-white ${isInitialRefresh ? 'dashboard-blur-pulse-active' : ''}`} style={{ borderRadius: "20px" }}>
            {/* Header */}
            <div className="p-3 px-4 pb-0 d-flex align-items-center justify-content-between">
                <h5 className="fw-extrabold text-dark mb-0" style={{ fontSize: "17px", color: "#0F172A", fontWeight: 800 }}>
                    Sales Overview <span className="text-muted fw-normal" style={{ fontSize: "12px" }}>({timeframe})</span>
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

            {/* Chart Body */}
            <Card.Body className="p-3 pt-1 d-flex flex-column justify-content-between">
                <div style={{ height: "220px" }} className={isInitialRefresh ? 'dashboard-chart-pulse' : ''}>
                    <Chart options={barOptions} series={series} type="bar" height="100%" />
                </div>

                {/* Bottom 4 Summary Stats Bar (100% Real-Time Calculated Data) */}
                <div className={`row g-1 pt-3 border-top mt-2 text-center ${isInitialRefresh ? 'dashboard-value-pulse' : ''}`}>
                    <div className="col-3">
                        <div className="text-muted mb-1" style={{ fontSize: "11px", fontWeight: 600, color: "#64748B" }}>Total Sales</div>
                        <div className="fw-extrabold text-dark" style={{ fontSize: "14px", color: "#0F172A", fontWeight: 800 }}>
                            {formatCompactCurrency(totalSalesNum)}
                        </div>
                    </div>

                    <div className="col-3">
                        <div className="text-muted mb-1" style={{ fontSize: "11px", fontWeight: 600, color: "#64748B" }}>Avg. Order</div>
                        <div className="fw-extrabold text-dark" style={{ fontSize: "14px", color: "#0F172A", fontWeight: 800 }}>
                            {formatCompactCurrency(avgOrderNum)}
                        </div>
                    </div>

                    <div className="col-3">
                        <div className="text-muted mb-1" style={{ fontSize: "11px", fontWeight: 600, color: "#64748B" }}>Orders</div>
                        <div className="fw-extrabold text-dark" style={{ fontSize: "14px", color: "#0F172A", fontWeight: 800 }}>
                            {ordersCountNum}
                        </div>
                    </div>

                    <div className="col-3">
                        <div className="text-muted mb-1" style={{ fontSize: "11px", fontWeight: 600, color: "#64748B" }}>Conv. Rate</div>
                        <div className="fw-extrabold text-dark" style={{ fontSize: "14px", color: "#0F172A", fontWeight: 800 }}>
                            {convRateNum}%
                        </div>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
};

const mapStateToProps = (state) => {
    const { weekSalePurchase, allSalePurchase, recentSalesDashboard, allConfigData, frontSetting } = state;
    return { weekSalePurchase, allSalePurchase, recentSalesDashboard, allConfigData, frontSetting };
};

export default connect(mapStateToProps, {
    weekSalePurchases,
    fetchAllSalePurchaseCount,
    recentSales,
})(SalesOverviewPanel);
