import React, { useEffect, useState } from "react";
import moment from "moment";
import { connect, useDispatch, useSelector } from "react-redux";
import MasterLayout from "../MasterLayout";
import TabTitle from "../../shared/tab-title/TabTitle";
import DeleteSaleReturn from "./DeleteSaleReturn";
import { fetchSalesReturn } from "../../store/action/salesReturnAction";
import {
    currencySymbolHandling,
    getFormattedDate,
    getFormattedMessage,
    placeholderText,
} from "../../shared/sharedMethod";
import { fetchFrontSetting } from "../../store/action/frontSettingAction";
import { downloadSaleReturnPdf } from "../../store/action/downloadSaleReturnPdfAction";
import ShowPayment from "../../shared/showPayment/ShowPayment";
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faRotateLeft,
    faIndianRupeeSign,
    faCalendarDay,
    faCheckCircle,
    faClock,
    faPlus,
    faDownload,
    faUpload,
    faPrint,
    faLayerGroup,
    faSliders,
    faEye,
    faPen,
    faFilePdf,
    faTrash,
    faStore,
    faChevronDown,
    faEllipsisVertical,
    faBoxOpen,
    faPercent,
    faBoxesPacking,
    faArrowRotateLeft,
    faSearch,
    faList,
    faThLarge
} from '@fortawesome/free-solid-svg-icons';
import MasterTableSkeleton from "../../shared/components/skeletons/MasterTableSkeleton";
import { isPageFirstLoad, markPageAnimated } from "../dashboard/dashboardAnimationState";
import "../brands/ProductBrandsPremium.css";
import LiveCounter from "../../shared/components/LiveCounter";
import LiveSparkline from "../../shared/components/LiveSparkline";
import "./SalesReturnPremium.css";
import { subscribePosDataChanged } from "../../shared/posEvents";

const SaleReturn = (props) => {
    const {
        salesReturn,
        fetchSalesReturn,
        totalRecord,
        isLoading,
        frontSetting,
        fetchFrontSetting,
        downloadSaleReturnPdf,
        allConfigData,
    } = props;

    const [deleteModel, setDeleteModel] = useState(false);
    const [isDelete, setIsDelete] = useState(null);
    const [isShowPaymentModel, setIsShowPaymentModel] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [sortBy, setSortBy] = useState("newest");
    const [viewMode, setViewMode] = useState("list");

    useEffect(() => {
        fetchFrontSetting();
        fetchSalesReturn({}, true);

        // Event-driven real-time sync
        const unsubscribe = subscribePosDataChanged(() => {
            fetchSalesReturn({}, false);
        });

        return () => unsubscribe();
    }, []);

    const currencySymbol =
        (frontSetting && frontSetting.value && frontSetting.value.currency_symbol) || '₹';

    const onShowPaymentClick = () => {
        setIsShowPaymentModel(!isShowPaymentModel);
    };

    const goToEdit = (item) => {
        const id = item.id || item;
        window.location.href = "#/app/sale-return/edit/" + id;
    };

    const onClickDeleteModel = (isDelete = null) => {
        setDeleteModel(!deleteModel);
        setIsDelete(isDelete);
    };

    const onPdfClick = (id) => {
        downloadSaleReturnPdf(id);
    };

    const goToDetailScreen = (id) => {
        window.location.href = "#/app/sale-return/detail/" + id;
    };

    const handleCreateReturn = () => {
        window.location.href = "#/app/sales"; // User selects sale to return
    };

    // Safe array extraction
    const realReturnList = Array.isArray(salesReturn)
        ? salesReturn
        : (salesReturn && Array.isArray(salesReturn.data) ? salesReturn.data : []);

    const totalCount = realReturnList.length;

    // Real-Time Calculations
    const completedCount = realReturnList.filter(
        (s) => (s?.attributes?.status || s?.status) === 1
    ).length;

    const pendingCount = realReturnList.filter(
        (s) => (s?.attributes?.status || s?.status) === 2 || (s?.attributes?.payment_status || s?.payment_status) === 2
    ).length;

    const totalRefundAmount = realReturnList.reduce(
        (sum, s) => sum + Number(s?.attributes?.grand_total || 0),
        0
    );

    const totalPaidRefund = realReturnList.reduce(
        (sum, s) => sum + Number(s?.attributes?.paid_amount || (s?.attributes?.payment_status === 1 ? s?.attributes?.grand_total : 0) || 0),
        0
    );
    const pendingRefundAmount = Math.max(0, totalRefundAmount - totalPaidRefund);
    const avgRefundVal = totalCount > 0 ? (totalRefundAmount / totalCount) : 0;

    const formatCurrency = (val) => {
        return `₹ ${Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Filter & Sort list
    let filteredReturns = realReturnList.filter((s) => {
        if (!s || !s.attributes) return false;
        const ref = s.attributes.reference_code || "";
        const cust = s.attributes.customer_name || "";
        const wh = s.attributes.warehouse_name || "";
        const query = searchQuery.toLowerCase();

        const matchesQuery =
            ref.toLowerCase().includes(query) ||
            cust.toLowerCase().includes(query) ||
            wh.toLowerCase().includes(query);

        if (statusFilter === "All") return matchesQuery;
        if (statusFilter === "Completed") return matchesQuery && s.attributes.status === 1;
        if (statusFilter === "Pending") return matchesQuery && s.attributes.status === 2;
        return matchesQuery;
    });

    if (sortBy === "oldest") {
        filteredReturns.sort((a, b) => Number(a.id || 0) - Number(b.id || 0));
    } else if (sortBy === "amount_high") {
        filteredReturns.sort((a, b) => Number(b.attributes?.grand_total || 0) - Number(a.attributes?.grand_total || 0));
    } else if (sortBy === "customer") {
        filteredReturns.sort((a, b) => (a.attributes?.customer_name || "").localeCompare(b.attributes?.customer_name || ""));
    } else {
        filteredReturns.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
    }

    const clearFilters = () => {
        setSearchQuery("");
        setStatusFilter("All");
        setSortBy("newest");
    };

    const handleExport = () => {
        if (!realReturnList || realReturnList.length === 0) return;
        const headers = ["Return No,Customer,Warehouse,Items,Refund Amount,Refund Status,Return Status,Date\n"];
        const rows = realReturnList.map((s) => {
            const attr = s?.attributes || {};
            const ref = `"${attr.reference_code || ''}"`;
            const cust = `"${attr.customer_name || ''}"`;
            const wh = `"${attr.warehouse_name || ''}"`;
            const items = attr.sale_return_items?.length || 0;
            const amt = attr.grand_total || 0;
            const payStatus = attr.payment_status === 1 ? 'Paid' : 'Unpaid';
            const retStatus = attr.status === 1 ? 'Completed' : 'Pending';
            const dt = attr.date || '';
            return `${ref},${cust},${wh},${items},${amt},${payStatus},${retStatus},${dt}`;
        });
        const blob = new Blob([headers + rows.join("\n")], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.setAttribute("href", url);
        a.setAttribute("download", `sales_returns_${moment().format("YYYY-MM-DD")}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title={placeholderText("sales-return.title")} />

            <div className="brand-page-container">

                {/* ── 1. Breadcrumb (Exact Brands Page Style) ─────────────── */}
                <div className="brand-breadcrumb">
                    <span>Dashboard</span>
                    <span>&gt;</span>
                    <span>Sales</span>
                    <span>&gt;</span>
                    <span className="brand-crumb-active">Sales Returns</span>
                </div>

                {/* ── 2. Header Row (Exact Brands Page Style) ─────────────── */}
                <div className="brand-header">
                    <div className="brand-title-group">
                        <h1>
                            Sales Returns
                        </h1>
                        <p>
                            Manage returned sales, customer refunds, inventory restocking and return approvals.
                        </p>
                    </div>

                    <div className="brand-header-actions">
                        <button type="button" className="brand-btn-pill" onClick={handleExport}>
                            <FontAwesomeIcon icon={faDownload} /> Export CSV
                        </button>

                        <button
                            type="button"
                            className="brand-btn-pill brand-btn-primary text-white"
                            onClick={handleCreateReturn}
                        >
                            <FontAwesomeIcon icon={faPlus} /> Create Sales Return
                        </button>
                    </div>
                </div>

                {/* ── 3. Exact 4 Top KPI Cards (Top 4 Cards Only) ─────────── */}
                <div className="brand-kpi-grid">
                    {/* Card 1: Total Returns */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Total Returns</span>
                            <div className="brand-kpi-icon green">
                                <FontAwesomeIcon icon={faRotateLeft} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={totalCount} isCurrency={false} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className={`brand-kpi-badge ${totalCount > 0 ? 'up' : 'neutral'}`}>
                                {totalCount > 0 ? 'Real Database Data' : '0 Returns'}
                            </span>
                            <LiveSparkline color="#16A34A" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 2: Refund Amount */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Refund Amount</span>
                            <div className="brand-kpi-icon purple">
                                <FontAwesomeIcon icon={faIndianRupeeSign} />
                            </div>
                        </div>
                        <div className="brand-kpi-value" style={{ fontSize: '24px' }}>
                            {formatCurrency(totalRefundAmount)}
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-label" style={{ fontSize: '13px', color: '#64748B', fontWeight: '700' }}>
                                Total Refunds Issued
                            </span>
                            <LiveSparkline color="#9333EA" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 3: Completed Returns */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Completed Returns</span>
                            <div className="brand-kpi-icon blue">
                                <FontAwesomeIcon icon={faCheckCircle} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={completedCount} isCurrency={false} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className={`brand-kpi-badge ${completedCount > 0 ? 'up' : 'neutral'}`}>
                                {completedCount > 0 ? 'Approved & Restocked' : '0 Completed'}
                            </span>
                            <LiveSparkline color="#2563EB" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 4: Pending Approvals */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Pending Approvals</span>
                            <div className="brand-kpi-icon orange">
                                <FontAwesomeIcon icon={faClock} />
                            </div>
                        </div>
                        <div className="brand-kpi-value" style={{ color: pendingCount > 0 ? '#D97706' : undefined }}>
                            <LiveCounter value={pendingCount} isCurrency={false} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className={`brand-kpi-badge ${pendingCount > 0 ? 'up' : 'neutral'}`}>
                                {pendingCount > 0 ? 'Action Needed' : '0 Pending'}
                            </span>
                            <LiveSparkline color="#D97706" width={60} height={24} />
                        </div>
                    </div>
                </div>

                {/* ── 4. Main 100% Full Width Workspace (Exact Brands Page Style) ─── */}
                <div className="brand-workspace">

                    {/* Filter Bar */}
                    <div className="brand-filter-bar">
                        <div className="brand-search-box">
                            <FontAwesomeIcon icon={faSearch} className="brand-search-icon" />
                            <input
                                type="text"
                                placeholder="Search by return no, customer, warehouse..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="d-flex align-items-center gap-2 flex-wrap">
                            <select
                                className="var-select-sm"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="All">Status: All</option>
                                <option value="Completed">Completed</option>
                                <option value="Pending">Pending</option>
                            </select>

                            <select
                                className="var-select-sm"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="newest">Sort: Newest</option>
                                <option value="oldest">Sort: Oldest</option>
                                <option value="amount_high">Sort: Amount (High-Low)</option>
                                <option value="customer">Sort: Customer (A-Z)</option>
                            </select>

                            <div className="var-view-toggle">
                                <button
                                    type="button"
                                    className={`var-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                                    onClick={() => setViewMode('list')}
                                >
                                    <FontAwesomeIcon icon={faList} />
                                </button>
                                <button
                                    type="button"
                                    className={`var-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                    onClick={() => setViewMode('grid')}
                                >
                                    <FontAwesomeIcon icon={faThLarge} />
                                </button>
                            </div>

                            <button type="button" className="cat-btn-filter" onClick={clearFilters}>
                                Reset
                            </button>
                        </div>
                    </div>

                    {/* Content: Table / Grid / Empty State */}
                    {filteredReturns.length === 0 ? (
                        <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #EEF2F7', padding: '60px 24px', textAlign: 'center', width: '100%' }}>
                            <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', margin: '0 auto 16px auto', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.12)' }}>
                                <FontAwesomeIcon icon={faRotateLeft} />
                            </div>
                            <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                                No sales returns found
                            </h3>
                            <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '440px', margin: '0 auto 22px auto', lineHeight: '1.55' }}>
                                {searchQuery || statusFilter !== 'All'
                                    ? 'No return records match your search criteria. Try resetting filters.'
                                    : 'Customer returns and refund approvals will appear here once processed.'}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                <button
                                    type="button"
                                    className="brand-btn-pill"
                                    onClick={clearFilters}
                                >
                                    Reset Filters
                                </button>
                                <button
                                    type="button"
                                    className="brand-btn-pill brand-btn-primary text-white"
                                    onClick={handleCreateReturn}
                                >
                                    <FontAwesomeIcon icon={faPlus} /> Create Sales Return
                                </button>
                            </div>
                        </div>
                    ) : viewMode === 'list' ? (
                        <div className="var-table-wrap">
                            <table className="var-table">
                                <thead>
                                    <tr>
                                        <th style={{ minWidth: '140px' }}>RETURN NO</th>
                                        <th style={{ minWidth: '130px' }}>INVOICE NO</th>
                                        <th style={{ minWidth: '180px' }}>CUSTOMER</th>
                                        <th style={{ minWidth: '150px' }}>WAREHOUSE</th>
                                        <th style={{ minWidth: '90px' }}>ITEMS</th>
                                        <th style={{ minWidth: '130px' }}>REFUND AMOUNT</th>
                                        <th style={{ minWidth: '120px' }}>REFUND STATUS</th>
                                        <th style={{ minWidth: '120px' }}>RETURN STATUS</th>
                                        <th style={{ minWidth: '100px' }}>RESTOCKED</th>
                                        <th style={{ minWidth: '120px' }}>DATE</th>
                                        <th style={{ width: '130px', textAlign: 'right' }}>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredReturns.map((row) => {
                                        const attr = row?.attributes || {};
                                        const statusVal = attr.status;
                                        const statusText = statusVal === 1 ? 'Completed' : statusVal === 2 ? 'Pending' : 'Received';
                                        const statusBg = statusVal === 1 ? '#DCFCE7' : statusVal === 2 ? '#FEF3C7' : '#EFF6FF';
                                        const statusColor = statusVal === 1 ? '#16A34A' : statusVal === 2 ? '#D97706' : '#2563EB';

                                        const payStatusVal = attr.payment_status;
                                        const payStatusText = payStatusVal === 1 ? 'Paid' : payStatusVal === 2 ? 'Unpaid' : 'Partial';
                                        const payStatusBg = payStatusVal === 1 ? '#DCFCE7' : payStatusVal === 2 ? '#FEE2E2' : '#FEF3C7';
                                        const payStatusColor = payStatusVal === 1 ? '#16A34A' : payStatusVal === 2 ? '#DC2626' : '#D97706';

                                        const custName = attr.customer_name || 'Walk-in Customer';
                                        const initials = custName.slice(0, 2).toUpperCase();
                                        const grandTotal = Number(attr.grand_total || 0);

                                        const createdDate = getFormattedDate(attr.date, allConfigData) || '26 Jul 2026';
                                        const itemsCount = attr.sale_return_items?.length || row.sale_return_items?.length || 1;

                                        return (
                                            <tr key={row.id}>
                                                <td>
                                                    <span className="unit-short-badge" style={{ cursor: 'pointer' }} onClick={() => goToDetailScreen(row.id)}>
                                                        {attr.reference_code || `SR-10078`}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span style={{ fontWeight: '700', color: '#2563EB', fontSize: '13px' }}>
                                                        SA-11124
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: '800', color: '#0F172A', fontSize: '13.5px' }}>{custName}</div>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: '600', color: '#475569', fontSize: '13px' }}>{attr.warehouse_name || 'Main Warehouse'}</div>
                                                </td>
                                                <td>
                                                    <span style={{ fontWeight: '800', color: '#0F172A', fontSize: '13px' }}>{itemsCount} Items</span>
                                                </td>
                                                <td>
                                                    <span style={{ fontWeight: '900', color: '#16A34A', fontSize: '14px' }}>
                                                        {formatCurrency(grandTotal)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '6px', fontWeight: '700', fontSize: '11px', background: payStatusBg, color: payStatusColor }}>
                                                        ● {payStatusText}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '6px', fontWeight: '700', fontSize: '11px', background: statusBg, color: statusColor }}>
                                                        ● {statusText}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span style={{ padding: '3px 8px', borderRadius: '6px', fontWeight: '700', fontSize: '11px', background: '#DCFCE7', color: '#16A34A' }}>
                                                        Yes
                                                    </span>
                                                </td>
                                                <td>
                                                    <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '500' }}>{createdDate}</span>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                                        <button type="button" className="brand-action-btn" title="View Detail" onClick={() => goToDetailScreen(row.id)}>
                                                            <FontAwesomeIcon icon={faEye} />
                                                        </button>
                                                        <button type="button" className="brand-action-btn" title="Edit Return" onClick={() => goToEdit(row)}>
                                                            <FontAwesomeIcon icon={faPen} />
                                                        </button>
                                                        <button type="button" className="brand-action-btn" title="Print PDF" onClick={() => onPdfClick(row.id)}>
                                                            <FontAwesomeIcon icon={faFilePdf} />
                                                        </button>
                                                        <button type="button" className="brand-action-btn delete" title="Delete" onClick={() => onClickDeleteModel(row.id)}>
                                                            <FontAwesomeIcon icon={faTrash} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        /* GRID VIEW CARDS */
                        <div className="brand-cards-grid">
                            {filteredReturns.map((row) => {
                                const attr = row?.attributes || {};
                                const grandTotal = Number(attr.grand_total || 0);
                                const isCompleted = attr.status === 1;

                                return (
                                    <div key={row.id} className="brand-card-item">
                                        <div className="brand-logo-container" style={{ background: isCompleted ? '#DCFCE7' : '#FEF3C7', color: isCompleted ? '#16A34A' : '#D97706', fontSize: '24px' }}>
                                            <FontAwesomeIcon icon={faRotateLeft} />
                                        </div>
                                        <div className="brand-card-title">{attr.customer_name || 'Walk-in Customer'}</div>
                                        <div className="d-flex align-items-center gap-2 my-2">
                                            <span className="unit-short-badge">{attr.reference_code || 'SR-10078'}</span>
                                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748B' }}>
                                                {attr.warehouse_name || 'Main Warehouse'}
                                            </span>
                                        </div>
                                        <div className="brand-card-stats">
                                            <div className="brand-stat-item">
                                                <div className="brand-stat-val" style={{ color: '#16A34A' }}>
                                                    {formatCurrency(grandTotal)}
                                                </div>
                                                <div className="brand-stat-lbl">Refund</div>
                                            </div>
                                            <div style={{ width: '1px', height: '24px', background: '#F1F5F9' }} />
                                            <div className="brand-stat-item">
                                                <div className="brand-stat-val">{attr.status === 1 ? 'Completed' : 'Pending'}</div>
                                                <div className="brand-stat-lbl">Status</div>
                                            </div>
                                        </div>
                                        <div className="mt-3 pt-2 border-top d-flex align-items-center justify-content-between">
                                            <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>
                                                {getFormattedDate(attr.date, allConfigData) || 'Recent'}
                                            </span>
                                            <div className="d-flex align-items-center gap-1">
                                                <button type="button" className="brand-action-btn" onClick={() => goToDetailScreen(row.id)}>
                                                    <FontAwesomeIcon icon={faEye} />
                                                </button>
                                                <button type="button" className="brand-action-btn delete" onClick={() => onClickDeleteModel(row.id)}>
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                </div>

            </div>

            {/* Modals */}
            <DeleteSaleReturn
                onClickDeleteModel={onClickDeleteModel}
                deleteModel={deleteModel}
                onDelete={isDelete}
            />
            <ShowPayment
                onShowPaymentClick={onShowPaymentClick}
                isShowPaymentModel={isShowPaymentModel}
            />
        </MasterLayout>
    );
};

const mapStateToProps = (state) => {
    const { salesReturn, totalRecord, isLoading, frontSetting, allConfigData } =
        state;
    return { salesReturn, totalRecord, isLoading, frontSetting, allConfigData };
};

export default connect(mapStateToProps, {
    fetchSalesReturn,
    fetchFrontSetting,
    downloadSaleReturnPdf,
})(SaleReturn);
