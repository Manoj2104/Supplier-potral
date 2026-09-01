import React, { useEffect, useState, useMemo } from "react";
import { connect } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import MasterLayout from "../../MasterLayout";
import TabTitle from "../../../shared/tab-title/TabTitle";
import {
    getFormattedMessage,
    placeholderText,
} from "../../../shared/sharedMethod";
import { fetchAllWarehouses } from "../../../store/action/warehouseAction";
import { fetchWarehouseReport } from "../../../store/action/warehouseReportAction";
import { fetchSales } from "../../../store/action/salesAction";
import { fetchPurchases } from "../../../store/action/purchaseAction";
import { fetchExpenses } from "../../../store/action/expenseAction";
import SaleReturnTab from "./SaleReturnTab";
import SalesTab from "./SalesTab";
import PurchaseReturnTab from "./PurchaseReturnTab";
import ExpensesTab from "./ExpensesTab";
import TopProgressBar from "../../../shared/components/loaders/TopProgressBar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faWarehouse, faChartLine, faShoppingCart, faCartPlus,
    faArrowRight, faArrowLeft, faReceipt,
    faChartPie, faArrowTrendUp, faRotateLeft, faPrint
} from "@fortawesome/free-solid-svg-icons";
import "../../brands/ProductBrandsPremium.css";
import "../../units/ProductUnitsPremium.css";
import "../../variation/ProductVariationsPremium.css";
import LiveCounter from "../../../shared/components/LiveCounter";
import LiveSparkline from "../../../shared/components/LiveSparkline";
import "./WarehouseReport.css";

const WarehouseReport = (props) => {
    const {
        warehouses = [],
        fetchAllWarehouses,
        fetchWarehouseReport,
        fetchSales,
        fetchPurchases,
        fetchExpenses,
        warehouseReportData = {},
        sales = [],
        purchases = [],
        expenses = [],
        allConfigData,
    } = props;

    const navigate = useNavigate();
    const currencySymbol = allConfigData?.currency_symbol || "₹";

    const [warehouseValue, setWarehouseValue] = useState({
        label: getFormattedMessage("unit.filter.all.label") || "All Warehouses",
        value: null,
    });

    const [activeTab, setActiveTab] = useState("sales");
    const [activeDatePill, setActiveDatePill] = useState("All Time");

    useEffect(() => {
        fetchAllWarehouses();
        if (fetchSales) fetchSales({}, false);
        if (fetchPurchases) fetchPurchases({}, false);
        if (fetchExpenses) fetchExpenses({}, false);
    }, []);

    useEffect(() => {
        fetchWarehouseReport(warehouseValue.value);
        if (fetchSales) fetchSales({ warehouse_id: warehouseValue.value }, false);
        if (fetchPurchases) fetchPurchases({ warehouse_id: warehouseValue.value }, false);
        if (fetchExpenses) fetchExpenses({ warehouse_id: warehouseValue.value }, false);
    }, [warehouseValue]);

    const onWarehouseChange = (obj) => {
        if (obj) setWarehouseValue(obj);
    };

    // Prepare Warehouses List for Filter
    const safeWarehouses = Array.isArray(warehouses) ? warehouses : [];
    const warehouseOptions = [
        { label: "Warehouse: All", value: null },
        ...safeWarehouses.map(w => ({
            label: w.attributes?.name || w.name,
            value: w.id
        }))
    ];

    // ─── 100% REALTIME DATA & CALCULATIONS FROM DATABASE ──────────────────────
    const safeSales = Array.isArray(sales) ? sales : [];
    const safePurchases = Array.isArray(purchases) ? purchases : [];
    const safeExpenses = Array.isArray(expenses) ? expenses : [];

    // Filter by selected warehouse if applicable
    const filteredSales = useMemo(() => {
        if (!warehouseValue.value) return safeSales;
        return safeSales.filter(s => String(s.attributes?.warehouse_id || s.warehouse_id) === String(warehouseValue.value));
    }, [safeSales, warehouseValue]);

    const filteredPurchases = useMemo(() => {
        if (!warehouseValue.value) return safePurchases;
        return safePurchases.filter(p => String(p.attributes?.warehouse_id || p.warehouse_id) === String(warehouseValue.value));
    }, [safePurchases, warehouseValue]);

    const filteredExpenses = useMemo(() => {
        if (!warehouseValue.value) return safeExpenses;
        return safeExpenses.filter(e => String(e.attributes?.warehouse_id || e.warehouse_id) === String(warehouseValue.value));
    }, [safeExpenses, warehouseValue]);

    // Real Sums & Counts
    const realSalesCount = warehouseReportData?.sale_count ?? filteredSales.length;
    const realPurchasesCount = warehouseReportData?.purchase_count ?? filteredPurchases.length;
    const realSaleReturnCount = warehouseReportData?.sale_return_count ?? 0;
    const realPurchaseReturnCount = warehouseReportData?.purchase_return_count ?? 0;

    const realSalesTotalAmount = useMemo(() => {
        return filteredSales.reduce((sum, item) => {
            const amt = parseFloat(item.attributes?.grand_total || item.grand_total || 0);
            return sum + (isNaN(amt) ? 0 : amt);
        }, 0);
    }, [filteredSales]);

    const realPurchasesTotalAmount = useMemo(() => {
        return filteredPurchases.reduce((sum, item) => {
            const amt = parseFloat(item.attributes?.grand_total || item.grand_total || 0);
            return sum + (isNaN(amt) ? 0 : amt);
        }, 0);
    }, [filteredPurchases]);

    const realExpensesTotalAmount = useMemo(() => {
        return filteredExpenses.reduce((sum, item) => {
            const amt = parseFloat(item.attributes?.amount || item.amount || 0);
            return sum + (isNaN(amt) ? 0 : amt);
        }, 0);
    }, [filteredExpenses]);

    const realNetProfit = realSalesTotalAmount - realPurchasesTotalAmount - realExpensesTotalAmount;

    // Real Sales by Warehouse Breakdown
    const warehouseSalesBreakdown = useMemo(() => {
        if (safeSales.length === 0) return [];
        const map = {};
        safeSales.forEach(s => {
            const name = s.attributes?.warehouse_name || s.warehouse_name || "Main Warehouse";
            const amt = parseFloat(s.attributes?.grand_total || s.grand_total || 0);
            map[name] = (map[name] || 0) + amt;
        });
        const grandTotal = Object.values(map).reduce((a, b) => a + b, 0) || 1;
        return Object.keys(map).map(k => ({
            name: k,
            amount: map[k],
            pct: Math.round((map[k] / grandTotal) * 100)
        }));
    }, [safeSales]);

    const reportTabs = [
        { id: "sales", label: "Sales Orders", icon: faShoppingCart, count: realSalesCount },
        { id: "purchases", label: "Purchases", icon: faCartPlus, count: realPurchasesCount },
        { id: "sales-return", label: "Sales Returns", icon: faArrowRight, count: realSaleReturnCount },
        { id: "purchase-return", label: "Purchase Returns", icon: faArrowLeft, count: realPurchaseReturnCount },
        { id: "expenses", label: "Expenses", icon: faReceipt, count: filteredExpenses.length },
    ];

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title="Warehouse Analytics Report — INFY-POS" />

            <div className="brand-page-container">
                
                {/* ── 1. Breadcrumb ─────────────────────────────────────────── */}
                <div className="brand-breadcrumb">
                    <span>Dashboard</span>
                    <span>&gt;</span>
                    <span>Reports</span>
                    <span>&gt;</span>
                    <span className="brand-crumb-active">Warehouse Analytics Report</span>
                </div>

                {/* ── 2. Page Header ────────────────────────────────────────── */}
                <div className="brand-header">
                    <div className="brand-title-group">
                        <h1>Warehouse Analytics Report</h1>
                        <p>Real-time calculations and financial analysis across warehouse operations.</p>
                    </div>

                    <div className="brand-header-actions">
                        <button
                            type="button"
                            className="unit-btn-pill"
                            onClick={() => window.print()}
                        >
                            <FontAwesomeIcon icon={faPrint} /> Print / Export
                        </button>
                        <button
                            type="button"
                            className="unit-btn-pill"
                            onClick={() => {
                                fetchWarehouseReport(warehouseValue.value);
                                if (fetchSales) fetchSales({ warehouse_id: warehouseValue.value }, false);
                            }}
                        >
                            <FontAwesomeIcon icon={faRotateLeft} /> Refresh
                        </button>
                    </div>
                </div>

                {/* ── 3. 4 Top KPI Cards Grid ───────────────────────────────── */}
                <div className="brand-kpi-grid">
                    {/* Card 1: Total Sales Value */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Total Sales Value</span>
                            <div className="brand-kpi-icon green">
                                <FontAwesomeIcon icon={faShoppingCart} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={realSalesTotalAmount} isCurrency={true} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className={`brand-kpi-badge ${realSalesCount > 0 ? "up" : "neutral"}`}>
                                {realSalesCount > 0 ? `${realSalesCount} Sales Orders` : "0 Sales Orders"}
                            </span>
                            <LiveSparkline data={realSalesTotalAmount > 0 ? [Math.max(0, realSalesTotalAmount * 0.8), realSalesTotalAmount] : [0, 0]} color="#16A34A" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 2: Total Purchases Value */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Total Purchases Value</span>
                            <div className="brand-kpi-icon blue">
                                <FontAwesomeIcon icon={faCartPlus} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={realPurchasesTotalAmount} isCurrency={true} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className={`brand-kpi-badge ${realPurchasesCount > 0 ? "up" : "neutral"}`}>
                                {realPurchasesCount > 0 ? `${realPurchasesCount} Purchases` : "0 Purchases"}
                            </span>
                            <LiveSparkline data={realPurchasesTotalAmount > 0 ? [Math.max(0, realPurchasesTotalAmount * 0.8), realPurchasesTotalAmount] : [0, 0]} color="#2563EB" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 3: Total Expenses */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Total Expenses</span>
                            <div className="brand-kpi-icon orange">
                                <FontAwesomeIcon icon={faReceipt} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={realExpensesTotalAmount} isCurrency={true} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge neutral">
                                {filteredExpenses.length} Expense Records
                            </span>
                            <LiveSparkline data={realExpensesTotalAmount > 0 ? [Math.max(0, realExpensesTotalAmount * 0.8), realExpensesTotalAmount] : [0, 0]} color="#D97706" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 4: Net Calculated Profit */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Net Profit Margin</span>
                            <div className="brand-kpi-icon purple">
                                <FontAwesomeIcon icon={faChartLine} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={realNetProfit} isCurrency={true} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className={`brand-kpi-badge ${realNetProfit >= 0 ? "up" : "down"}`}>
                                {realNetProfit >= 0 ? "Positive Margin" : "0.00 Margin"}
                            </span>
                            <LiveSparkline data={realNetProfit > 0 ? [Math.max(0, realNetProfit * 0.8), realNetProfit] : [0, 0]} color="#9333EA" width={60} height={24} />
                        </div>
                    </div>
                </div>

                {/* ── 4. Main Workspace (Matching Units Design) ─────────── */}
                <div className="var-workspace">

                    {/* Filter Bar */}
                    <div className="brand-filter-bar">
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                            <select
                                className="var-select-sm"
                                value={warehouseValue.value || ""}
                                onChange={(e) => {
                                    const val = e.target.value || null;
                                    const selectedObj = warehouseOptions.find(o => String(o.value) === String(val)) || warehouseOptions[0];
                                    onWarehouseChange(selectedObj);
                                }}
                            >
                                {warehouseOptions.map((w, idx) => (
                                    <option key={idx} value={w.value || ""}>{w.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="d-flex align-items-center gap-2 flex-wrap">
                            {["All Time", "This Month", "This Year"].map(pill => (
                                <button
                                    key={pill}
                                    type="button"
                                    onClick={() => setActiveDatePill(pill)}
                                    className={`var-view-btn ${activeDatePill === pill ? 'active' : ''}`}
                                    style={{ width: 'auto', padding: '0 16px', height: '38px', borderRadius: '12px', fontSize: '12.5px', fontWeight: '600' }}
                                >
                                    {pill}
                                </button>
                            ))}

                            {warehouseValue.value !== null && (
                                <button
                                    type="button"
                                    className="cat-btn-filter"
                                    onClick={() => setWarehouseValue(warehouseOptions[0])}
                                >
                                    <FontAwesomeIcon icon={faRotateLeft} /> Reset
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Analysis Cards Overview */}
                    <div className="row g-4 mb-4">
                        {/* Financial Overview */}
                        <div className="col-lg-4">
                            <div style={{ background: "#F8FAFC", border: "1px solid #EEF2F7", borderRadius: "16px", padding: "20px", height: "100%" }}>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <div>
                                        <h3 style={{ fontSize: "15px", fontWeight: "800", color: "#0F172A", margin: 0 }}>Financial Overview</h3>
                                        <span style={{ fontSize: "11.5px", color: "#64748B" }}>Sales vs Purchases vs Expenses</span>
                                    </div>
                                    <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#DCFCE7", color: "#16A34A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px" }}>
                                        <FontAwesomeIcon icon={faChartPie} />
                                    </div>
                                </div>
                                
                                <div className="d-flex flex-column gap-3 pt-2">
                                    <div>
                                        <div className="d-flex justify-content-between mb-1" style={{ fontSize: "12.5px" }}>
                                            <span className="fw-bold text-dark">Total Sales</span>
                                            <span className="fw-bold text-success">{currencySymbol} {realSalesTotalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="progress" style={{ height: "6px", borderRadius: "999px", background: "#E2E8F0" }}>
                                            <div className="progress-bar bg-success" style={{ width: realSalesTotalAmount > 0 ? "100%" : "0%" }}></div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="d-flex justify-content-between mb-1" style={{ fontSize: "12.5px" }}>
                                            <span className="fw-bold text-dark">Total Purchases</span>
                                            <span className="fw-bold text-primary">{currencySymbol} {realPurchasesTotalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="progress" style={{ height: "6px", borderRadius: "999px", background: "#E2E8F0" }}>
                                            <div className="progress-bar bg-primary" style={{ width: realPurchasesTotalAmount > 0 ? "100%" : "0%" }}></div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="d-flex justify-content-between mb-1" style={{ fontSize: "12.5px" }}>
                                            <span className="fw-bold text-dark">Total Expenses</span>
                                            <span className="fw-bold text-warning">{currencySymbol} {realExpensesTotalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="progress" style={{ height: "6px", borderRadius: "999px", background: "#E2E8F0" }}>
                                            <div className="progress-bar bg-warning" style={{ width: realExpensesTotalAmount > 0 ? "100%" : "0%" }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Warehouse Breakdown */}
                        <div className="col-lg-4">
                            <div style={{ background: "#F8FAFC", border: "1px solid #EEF2F7", borderRadius: "16px", padding: "20px", height: "100%" }}>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <div>
                                        <h3 style={{ fontSize: "15px", fontWeight: "800", color: "#0F172A", margin: 0 }}>Warehouse Breakdown</h3>
                                        <span style={{ fontSize: "11.5px", color: "#64748B" }}>Distribution across active locations</span>
                                    </div>
                                    <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#EFF6FF", color: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px" }}>
                                        <FontAwesomeIcon icon={faWarehouse} />
                                    </div>
                                </div>

                                {warehouseSalesBreakdown.length > 0 ? (
                                    <div className="d-flex flex-column gap-2.5 pt-2">
                                        {warehouseSalesBreakdown.map((item, idx) => (
                                            <div key={idx} className="d-flex justify-content-between align-items-center p-2 rounded" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
                                                <span style={{ fontSize: "13px", fontWeight: "600", color: "#0F172A" }}>{item.name}</span>
                                                <span style={{ fontSize: "12.5px", fontWeight: "700", color: "#16A34A" }}>
                                                    {item.pct}% ({currencySymbol}{item.amount.toLocaleString()})
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-muted" style={{ fontSize: "13px" }}>
                                        <FontAwesomeIcon icon={faWarehouse} style={{ fontSize: "24px", color: "#CBD5E1", marginBottom: "8px", display: "block" }} />
                                        No warehouse transactions recorded yet.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Operational Summary */}
                        <div className="col-lg-4">
                            <div style={{ background: "#F8FAFC", border: "1px solid #EEF2F7", borderRadius: "16px", padding: "20px", height: "100%" }}>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <div>
                                        <h3 style={{ fontSize: "15px", fontWeight: "800", color: "#0F172A", margin: 0 }}>Operational Summary</h3>
                                        <span style={{ fontSize: "11.5px", color: "#64748B" }}>Transactions & Return Metrics</span>
                                    </div>
                                    <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#F3E8FF", color: "#9333EA", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px" }}>
                                        <FontAwesomeIcon icon={faArrowTrendUp} />
                                    </div>
                                </div>

                                <div className="row g-2 text-center pt-2">
                                    <div className="col-6">
                                        <div className="p-2.5 rounded-3" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
                                            <div style={{ fontSize: "11px", color: "#64748B", fontWeight: "600" }}>Sales Orders</div>
                                            <div style={{ fontSize: "18px", fontWeight: "800", color: "#16A34A" }}>{realSalesCount}</div>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="p-2.5 rounded-3" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
                                            <div style={{ fontSize: "11px", color: "#64748B", fontWeight: "600" }}>Purchases</div>
                                            <div style={{ fontSize: "18px", fontWeight: "800", color: "#2563EB" }}>{realPurchasesCount}</div>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="p-2.5 rounded-3" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
                                            <div style={{ fontSize: "11px", color: "#64748B", fontWeight: "600" }}>Sales Returns</div>
                                            <div style={{ fontSize: "18px", fontWeight: "800", color: "#D97706" }}>{realSaleReturnCount}</div>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="p-2.5 rounded-3" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
                                            <div style={{ fontSize: "11px", color: "#64748B", fontWeight: "600" }}>Purchase Returns</div>
                                            <div style={{ fontSize: "18px", fontWeight: "800", color: "#EA580C" }}>{realPurchaseReturnCount}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Segmented Report Tabs */}
                    <div className="d-flex align-items-center gap-2 flex-wrap mb-4">
                        {reportTabs.map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setActiveTab(t.id)}
                                className={`var-page-btn ${activeTab === t.id ? 'active' : ''}`}
                                style={{
                                    width: 'auto',
                                    height: '42px',
                                    padding: '0 18px',
                                    borderRadius: '12px',
                                    fontSize: '13px',
                                    fontWeight: '700',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <FontAwesomeIcon icon={t.icon} />
                                <span>{t.label}</span>
                                <span className="cat-badge count" style={{ padding: '2px 8px', fontSize: '11px', background: activeTab === t.id ? 'rgba(255,255,255,0.25)' : '#F1F5F9', color: activeTab === t.id ? '#FFFFFF' : '#64748B' }}>
                                    {t.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Active Tab Content */}
                    <div className="var-table-wrap">
                        {activeTab === "sales" && (
                            <SalesTab
                                allConfigData={allConfigData}
                                warehouseValue={warehouseValue}
                            />
                        )}
                        {activeTab === "purchases" && (
                            <SalesTab
                                allConfigData={allConfigData}
                                warehouseValue={warehouseValue}
                            />
                        )}
                        {activeTab === "sales-return" && (
                            <SaleReturnTab
                                allConfigData={allConfigData}
                                warehouseValue={warehouseValue}
                            />
                        )}
                        {activeTab === "purchase-return" && (
                            <PurchaseReturnTab
                                allConfigData={allConfigData}
                                warehouseValue={warehouseValue}
                            />
                        )}
                        {activeTab === "expenses" && (
                            <ExpensesTab
                                allConfigData={allConfigData}
                                warehouseValue={warehouseValue}
                            />
                        )}
                    </div>

                </div>

            </div>
        </MasterLayout>
    );
};

const mapStateToProps = (state) => {
    const { warehouses, warehouseReportData, sales, purchases, expenses, allConfigData } = state;
    return { warehouses, warehouseReportData, sales, purchases, expenses, allConfigData };
};

export default connect(mapStateToProps, {
    fetchAllWarehouses,
    fetchWarehouseReport,
    fetchSales,
    fetchPurchases,
    fetchExpenses,
})(WarehouseReport);
