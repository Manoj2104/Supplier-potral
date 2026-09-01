import React, { useEffect, useState, useMemo } from "react";
import moment from "moment";
import { connect, useDispatch, useSelector } from "react-redux";
import MasterLayout from "../MasterLayout";
import TabTitle from "../../shared/tab-title/TabTitle";
import { fetchSales, deleteSale } from "../../store/action/salesAction";
import DeleteSale from "./DeleteSale";
import {
    currencySymbolHandling,
    getFormattedDate,
    placeholderText,
} from "../../shared/sharedMethod";
import { salePdfAction } from "../../store/action/salePdfAction";
import { fetchFrontSetting } from "../../store/action/frontSettingAction";
import ShowPayment from "../../shared/showPayment/ShowPayment";
import CreatePaymentModal from "./CreatePaymentModal";
import { fetchSalePayments } from "../../store/action/salePaymentAction";
import { todaySalePurchaseCount } from "../../store/action/dashboardAction";
import { fetchAllSalePurchaseCount } from "../../store/action/allSalePurchaseAction";
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faIndianRupeeSign,
    faCalendarDay,
    faCheckCircle,
    faClock,
    faPlus,
    faRotateLeft,
    faEye,
    faEdit,
    faFilePdf,
    faTrash,
    faCreditCard,
    faShoppingBag,
    faSearch,
    faList,
    faThLarge,
    faWarehouse,
    faUserTie
} from '@fortawesome/free-solid-svg-icons';
import "../brands/ProductBrandsPremium.css";
import "../units/ProductUnitsPremium.css";
import "../variation/ProductVariationsPremium.css";
import LiveCounter from "../../shared/components/LiveCounter";
import LiveSparkline from "../../shared/components/LiveSparkline";
import useSmartLoading from '../../shared/hooks/useSmartLoading';
import MasterTableSkeleton from '../../shared/components/skeletons/MasterTableSkeleton';
import { subscribePosDataChanged } from '../../shared/posEvents';

const Sales = (props) => {
    const {
        sales,
        fetchSales,
        totalRecord,
        salePdfAction,
        fetchFrontSetting,
        frontSetting,
        isCallSaleApi,
        allConfigData,
        todayCount,
        allSalePurchase,
        todaySalePurchaseCount,
        fetchAllSalePurchaseCount,
    } = props;

    const isLoading = useSmartLoading(sales);

    const [deleteModel, setDeleteModel] = useState(false);
    const [isShowPaymentModel, setIsShowPaymentModel] = useState(false);
    const [isCreatePaymentOpen, setIsCreatePaymentOpen] = useState(false);
    const [isDelete, setIsDelete] = useState(null);
    const [createPaymentItem, setCreatePaymentItem] = useState({});
    const { allSalePayments } = useSelector((state) => state);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [paymentStatusFilter, setPaymentStatusFilter] = useState("All");
    const [sortBy, setSortBy] = useState("newest");
    const [viewMode, setViewMode] = useState("list");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [selectedSales, setSelectedSales] = useState([]);

    useEffect(() => {
        fetchFrontSetting();
        const hasData = Array.isArray(sales) && sales.length > 0;
        fetchSales({ pageSize: 50 }, !hasData);
        if (todaySalePurchaseCount) todaySalePurchaseCount();
        if (fetchAllSalePurchaseCount) fetchAllSalePurchaseCount();

        // Event-driven real-time sync
        const unsubscribe = subscribePosDataChanged(() => {
            fetchSales({ pageSize: 50 }, false);
            if (todaySalePurchaseCount) todaySalePurchaseCount();
            if (fetchAllSalePurchaseCount) fetchAllSalePurchaseCount();
        });

        return () => unsubscribe();
    }, []);

    const dispatch = useDispatch();

    const currencySymbol =
        (frontSetting && frontSetting.value && frontSetting.value.currency_symbol) || '₹';

    const goToEdit = (item) => {
        const id = item.id || item;
        window.location.href = "#/app/sales/edit/" + id;
    };

    const onClickDeleteModel = (isDelete = null) => {
        setDeleteModel(!deleteModel);
        setIsDelete(isDelete);
    };

    const onShowPaymentClick = (item) => {
        setIsShowPaymentModel(!isShowPaymentModel);
        setCreatePaymentItem(item);
        if (item) {
            dispatch(fetchSalePayments(item.id));
        }
    };

    const onCreatePaymentClick = (item) => {
        setIsCreatePaymentOpen(!isCreatePaymentOpen);
        setCreatePaymentItem(item);
        if (item) {
            dispatch(fetchSalePayments(item.id));
        }
    };

    const goToDetailScreen = (ProductId) => {
        window.location.href = "#/app/sales/detail/" + ProductId;
    };

    const onPdfClick = (id) => {
        salePdfAction(id);
    };

    const handleCreateSale = () => {
        window.location.href = "#/app/sales/create";
    };

    // Safe array extraction
    const realSalesList = Array.isArray(sales)
        ? sales
        : (sales && Array.isArray(sales.data) ? sales.data : []);

    const totalCount = realSalesList.length;

    // REAL-TIME KPI CALCULATIONS
    const totalRevenue = realSalesList.reduce(
        (sum, s) => sum + Number(s?.attributes?.grand_total || s?.grand_total || 0),
        0
    );

    const totalPaid = realSalesList.reduce(
        (sum, s) => {
            const attr = s?.attributes || s || {};
            const isPaid = attr.payment_status === 1;
            return sum + Number(attr.paid_amount || (isPaid ? attr.grand_total : 0) || 0);
        },
        0
    );

    const totalDue = Math.max(0, totalRevenue - totalPaid);

    // Real-Time Today's Sales Calculation
    const todaySalesSum = realSalesList.reduce((sum, s) => {
        const attr = s?.attributes || s || {};
        const saleDate = attr.date || attr.created_at;
        if (saleDate && moment(saleDate).isSame(moment(), 'day')) {
            return sum + Number(attr.grand_total || 0);
        }
        return sum;
    }, 0);

    const displayTotalSales = (allSalePurchase && allSalePurchase.all_sales_count)
        ? Number(allSalePurchase.all_sales_count)
        : totalRevenue;

    const displayTodaySales = (todayCount && todayCount.today_sales)
        ? Number(todayCount.today_sales)
        : todaySalesSum;

    // Filter list
    const filteredSales = useMemo(() => {
        return realSalesList.filter((s) => {
            if (!s) return false;
            const attr = s.attributes || s;
            const ref = attr.reference_code || "";
            const cust = attr.customer_name || "";
            const wh = attr.warehouse_name || "";
            const query = searchQuery.toLowerCase().trim();

            const matchesQuery =
                !query ||
                ref.toLowerCase().includes(query) ||
                cust.toLowerCase().includes(query) ||
                wh.toLowerCase().includes(query);

            const matchesStatus =
                statusFilter === "All" ||
                (statusFilter === "Completed" && attr.status === 1) ||
                (statusFilter === "Pending" && attr.status === 2) ||
                (statusFilter === "Ordered" && attr.status === 3);

            const matchesPayment =
                paymentStatusFilter === "All" ||
                (paymentStatusFilter === "Paid" && attr.payment_status === 1) ||
                (paymentStatusFilter === "Unpaid" && attr.payment_status === 2) ||
                (paymentStatusFilter === "Partial" && attr.payment_status === 3);

            return matchesQuery && matchesStatus && matchesPayment;
        }).sort((a, b) => {
            const attrA = a.attributes || a;
            const attrB = b.attributes || b;
            if (sortBy === 'oldest') return moment(attrA.date || attrA.created_at).valueOf() - moment(attrB.date || attrB.created_at).valueOf();
            if (sortBy === 'amount_high') return Number(attrB.grand_total || 0) - Number(attrA.grand_total || 0);
            return moment(attrB.date || attrB.created_at).valueOf() - moment(attrA.date || attrA.created_at).valueOf();
        });
    }, [realSalesList, searchQuery, statusFilter, paymentStatusFilter, sortBy]);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filteredSales.length / perPage));
    const paginatedSales = filteredSales.slice((page - 1) * perPage, page * perPage);

    const pageNums = (() => {
        const max = Math.min(5, totalPages);
        let start = Math.max(1, page - 2);
        if (start + max - 1 > totalPages) start = Math.max(1, totalPages - max + 1);
        return Array.from({ length: max }, (_, i) => start + i);
    })();

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedSales(filteredSales.map(s => s.id));
        } else {
            setSelectedSales([]);
        }
    };

    const handleSelectOne = (id) => {
        if (selectedSales.includes(id)) {
            setSelectedSales(selectedSales.filter(i => i !== id));
        } else {
            setSelectedSales([...selectedSales, id]);
        }
    };

    const clearFilters = () => {
        setSearchQuery("");
        setStatusFilter("All");
        setPaymentStatusFilter("All");
        setSortBy("newest");
        setSelectedSales([]);
        setPage(1);
    };

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title={placeholderText("sales.title")} />

            {isLoading ? (
                <MasterTableSkeleton />
            ) : (
                <div className="var-page-container">

                    {/* 1. Breadcrumb (Exact Match to Units page) */}
                    <div className="var-breadcrumb">
                        <span>Dashboard</span>
                        <span>&gt;</span>
                        <span>Sales</span>
                        <span>&gt;</span>
                        <span className="var-crumb-active">Sales List</span>
                    </div>

                    {/* 2. Header Row (Exact Match to Units page) */}
                    <div className="var-header">
                        <div className="var-title-group">
                            <h1>Sales</h1>
                            <p>Manage customer sales, invoices, payment status and warehouse transactions.</p>
                        </div>

                        <div className="var-header-actions">
                            <button
                                type="button"
                                className="var-btn-pill var-btn-primary"
                                onClick={handleCreateSale}
                            >
                                <FontAwesomeIcon icon={faPlus} /> Create Sale
                            </button>
                        </div>
                    </div>

                    {/* 3. Top 4 KPI Cards Grid (Exact Match to Units page) */}
                    <div className="var-kpi-grid">
                        {/* Card 1: Total Sales */}
                        <div className="var-kpi-card">
                            <div className="var-kpi-top">
                                <span className="var-kpi-label">Total Sales</span>
                                <div className="var-kpi-icon green">
                                    <FontAwesomeIcon icon={faIndianRupeeSign} />
                                </div>
                            </div>
                            <div className="var-kpi-value">
                                <LiveCounter value={displayTotalSales} isCurrency={true} />
                            </div>
                            <div className="var-kpi-bottom">
                                <span className="var-kpi-badge up">Real Database Data</span>
                                <LiveSparkline data={displayTotalSales > 0 ? [Math.max(0, displayTotalSales * 0.8), displayTotalSales] : [0, 0, 0]} color="#16A34A" width={60} height={24} />
                            </div>
                        </div>

                        {/* Card 2: Today's Sales */}
                        <div className="var-kpi-card">
                            <div className="var-kpi-top">
                                <span className="var-kpi-label">Today's Sales</span>
                                <div className="var-kpi-icon orange">
                                    <FontAwesomeIcon icon={faCalendarDay} />
                                </div>
                            </div>
                            <div className="var-kpi-value">
                                <LiveCounter value={displayTodaySales} isCurrency={true} />
                            </div>
                            <div className="var-kpi-bottom">
                                <span className="var-kpi-badge neutral">Today's Inflow</span>
                                <LiveSparkline data={displayTodaySales > 0 ? [Math.max(0, displayTodaySales * 0.5), displayTodaySales] : [0, 0, 0]} color="#D97706" width={60} height={24} />
                            </div>
                        </div>

                        {/* Card 3: Paid Sales */}
                        <div className="var-kpi-card">
                            <div className="var-kpi-top">
                                <span className="var-kpi-label">Paid Sales</span>
                                <div className="var-kpi-icon blue">
                                    <FontAwesomeIcon icon={faCheckCircle} />
                                </div>
                            </div>
                            <div className="var-kpi-value">
                                <LiveCounter value={Math.max(0, displayTotalSales - totalDue)} isCurrency={true} />
                            </div>
                            <div className="var-kpi-bottom">
                                <span className="var-kpi-badge up">Settled Amount</span>
                                <LiveSparkline data={(displayTotalSales - totalDue) > 0 ? [Math.max(0, (displayTotalSales - totalDue) * 0.8), displayTotalSales - totalDue] : [0, 0, 0]} color="#2563EB" width={60} height={24} />
                            </div>
                        </div>

                        {/* Card 4: Pending Payments */}
                        <div className="var-kpi-card">
                            <div className="var-kpi-top">
                                <span className="var-kpi-label">Pending Payments</span>
                                <div className="var-kpi-icon purple">
                                    <FontAwesomeIcon icon={faClock} />
                                </div>
                            </div>
                            <div className="var-kpi-value">
                                <LiveCounter value={totalDue} isCurrency={true} />
                            </div>
                            <div className="var-kpi-bottom">
                                <span className="var-kpi-badge neutral">Pending Due</span>
                                <LiveSparkline data={totalDue > 0 ? [Math.max(0, totalDue * 0.9), totalDue] : [0, 0, 0]} color="#7C3AED" width={60} height={24} />
                            </div>
                        </div>
                    </div>

                    {/* 4. MAIN FLOATING WORKSPACE CONTAINER (Exact Match to Units page) */}
                    <div className="var-workspace" style={{ width: '100%', boxSizing: 'border-box' }}>

                        {/* Filter Bar (Exact Single-Line Match to Units page) */}
                        <div className="var-filter-bar">
                            <div className="var-search-box">
                                <FontAwesomeIcon icon={faSearch} className="var-search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search by invoice, customer, warehouse..."
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                                />
                            </div>

                            <div className="var-filter-controls">
                                <select
                                    className="var-select-sm"
                                    value={statusFilter}
                                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                                >
                                    <option value="All">Status: All</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Ordered">Ordered</option>
                                </select>

                                <select
                                    className="var-select-sm"
                                    value={paymentStatusFilter}
                                    onChange={(e) => { setPaymentStatusFilter(e.target.value); setPage(1); }}
                                >
                                    <option value="All">Payment: All</option>
                                    <option value="Paid">Paid</option>
                                    <option value="Unpaid">Unpaid</option>
                                    <option value="Partial">Partial</option>
                                </select>

                                <select
                                    className="var-select-sm"
                                    value={sortBy}
                                    onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                                >
                                    <option value="newest">Sort: Newest</option>
                                    <option value="oldest">Sort: Oldest</option>
                                    <option value="amount_high">Amount: High to Low</option>
                                </select>

                                <div className="var-view-toggle">
                                    <button
                                        type="button"
                                        className={`var-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                                        onClick={() => setViewMode('list')}
                                        title="List View"
                                    >
                                        <FontAwesomeIcon icon={faList} />
                                    </button>
                                    <button
                                        type="button"
                                        className={`var-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                        onClick={() => setViewMode('grid')}
                                        title="Grid View"
                                    >
                                        <FontAwesomeIcon icon={faThLarge} />
                                    </button>
                                </div>

                                <button type="button" className="cat-btn-filter" onClick={clearFilters} title="Reset Filters">
                                    Reset
                                </button>
                            </div>
                        </div>

                        {/* Content: List / Grid / Empty State */}
                        {filteredSales.length === 0 ? (
                            <div className="var-table-wrap" style={{ width: '100%', marginBottom: '20px', border: '1px solid #EEF2F7', borderRadius: '20px' }}>
                                <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                                    <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', margin: '0 auto 16px auto', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.12)' }}>
                                        <FontAwesomeIcon icon={faShoppingBag} />
                                    </div>
                                    <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                                        No sales found
                                    </h3>
                                    <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '420px', margin: '0 auto 22px auto', lineHeight: '1.55' }}>
                                        {searchQuery || statusFilter !== 'All' || paymentStatusFilter !== 'All'
                                            ? 'No sales match your search criteria. Try resetting filters.'
                                            : 'Create your first sale to start recording transactions and customer invoices.'}
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <button
                                            type="button"
                                            onClick={handleCreateSale}
                                            className="brand-btn-pill brand-btn-primary"
                                        >
                                            <FontAwesomeIcon icon={faPlus} /> Create Sale
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : viewMode === 'list' ? (
                            <div className="var-table-wrap" style={{ width: '100%', overflowX: 'hidden', marginBottom: '20px' }}>
                                <table className="var-table" style={{ width: '100%', tableLayout: 'fixed' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ width: '40px', textAlign: 'center' }}>
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    style={{ width: '18px', height: '18px', cursor: 'pointer', borderRadius: '4px' }}
                                                    checked={filteredSales.length > 0 && selectedSales.length === filteredSales.length}
                                                    onChange={handleSelectAll}
                                                />
                                            </th>
                                            <th style={{ width: '14%' }}>INVOICE NO</th>
                                            <th style={{ width: '18%' }}>CUSTOMER</th>
                                            <th style={{ width: '14%' }}>WAREHOUSE</th>
                                            <th style={{ width: '12%' }}>GRAND TOTAL</th>
                                            <th style={{ width: '11%' }}>PAID</th>
                                            <th style={{ width: '11%' }}>PAYMENT</th>
                                            <th style={{ width: '10%' }}>STATUS</th>
                                            <th style={{ width: '10%', whiteSpace: 'nowrap' }}>DATE</th>
                                            <th style={{ width: '110px', textAlign: 'right', whiteSpace: 'nowrap' }}>ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedSales.map((row) => {
                                            const attr = row?.attributes || {};
                                            const statusVal = attr.status;
                                            const statusText = statusVal === 1 ? 'Completed' : statusVal === 2 ? 'Pending' : 'Ordered';

                                            const payStatusVal = attr.payment_status;
                                            const payStatusText = payStatusVal === 1 ? 'Paid' : payStatusVal === 2 ? 'Unpaid' : 'Partial';

                                            const custName = attr.customer_name || 'Walk-in Customer';
                                            const initials = custName.slice(0, 2).toUpperCase();
                                            const grandTotal = Number(attr.grand_total || 0);
                                            const paidAmt = Number(attr.paid_amount || (payStatusVal === 1 ? grandTotal : 0));

                                            const createdDate = getFormattedDate(attr.date || attr.created_at, allConfigData) || 'Recent';
                                            const createdTime = attr.created_at ? moment(attr.created_at).format("hh:mm A") : '';
                                            const isChecked = selectedSales.includes(row.id);

                                            return (
                                                <tr key={row.id} style={{ background: isChecked ? '#F0FDF4' : 'transparent', cursor: "pointer" }} onClick={() => goToDetailScreen(row.id)}>
                                                    <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                                        <input
                                                            type="checkbox"
                                                            className="form-check-input"
                                                            style={{ width: '18px', height: '18px', cursor: 'pointer', borderRadius: '4px' }}
                                                            checked={isChecked}
                                                            onChange={() => handleSelectOne(row.id)}
                                                        />
                                                    </td>
                                                    <td>
                                                        <span className="unit-short-badge">
                                                            {attr.reference_code || `SA-${row.id}`}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-2" style={{ minWidth: 0, overflow: 'hidden' }}>
                                                            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#EFF6FF', color: '#2563EB', fontWeight: '800', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                {initials}
                                                            </div>
                                                            <div style={{ minWidth: 0, overflow: 'hidden' }}>
                                                                <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '13.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                    {custName}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden' }}>
                                                            <FontAwesomeIcon icon={faWarehouse} style={{ color: '#94A3B8', fontSize: '11px', flexShrink: 0 }} />
                                                            <span style={{ fontSize: '13px', color: '#475569', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {attr.warehouse_name || 'Main Warehouse'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span style={{ fontWeight: '800', color: '#0F172A', fontSize: '13.5px' }}>
                                                            {currencySymbol} {grandTotal.toFixed(2)}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span style={{ fontWeight: '600', color: '#16A34A', fontSize: '13px' }}>
                                                            {currencySymbol} {paidAmt.toFixed(2)}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span
                                                            className="unit-base-badge"
                                                            style={{
                                                                background: payStatusVal === 1 ? '#DCFCE7' : payStatusVal === 2 ? '#FEE2E2' : '#FEF3C7',
                                                                color: payStatusVal === 1 ? '#15803D' : payStatusVal === 2 ? '#DC2626' : '#B45309',
                                                                borderColor: payStatusVal === 1 ? '#BBF7D0' : payStatusVal === 2 ? '#FECACA' : '#FDE68A',
                                                                cursor: 'pointer'
                                                            }}
                                                            onClick={(e) => { e.stopPropagation(); onShowPaymentClick(row); }}
                                                            title="View Payment"
                                                        >
                                                            ● {payStatusText}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span
                                                            className="unit-base-badge"
                                                            style={{
                                                                background: statusVal === 1 ? '#DCFCE7' : '#FEF3C7',
                                                                color: statusVal === 1 ? '#15803D' : '#D97706',
                                                                borderColor: statusVal === 1 ? '#BBF7D0' : '#FDE68A'
                                                            }}
                                                        >
                                                            ● {statusText}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontSize: '12.5px', fontWeight: '600', color: '#0F172A', whiteSpace: 'nowrap' }}>{createdDate}</div>
                                                        <div style={{ fontSize: '10.5px', color: '#64748B', whiteSpace: 'nowrap' }}>{createdTime}</div>
                                                    </td>
                                                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                                                        <div className="brand-card-actions" style={{ justifyContent: 'flex-end', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                            <button type="button" className="brand-action-btn" title="View Sale" onClick={() => goToDetailScreen(row.id)}>
                                                                <FontAwesomeIcon icon={faEye} />
                                                            </button>
                                                            <button type="button" className="brand-action-btn edit" title="Edit Sale" onClick={() => goToEdit(row)}>
                                                                <FontAwesomeIcon icon={faEdit} />
                                                            </button>
                                                            <button type="button" className="brand-action-btn" title="Download PDF" onClick={() => onPdfClick(row.id)}>
                                                                <FontAwesomeIcon icon={faFilePdf} style={{ color: '#EF4444' }} />
                                                            </button>
                                                            <button type="button" className="brand-action-btn delete" title="Delete Sale" onClick={() => onClickDeleteModel(row)}>
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
                            /* GRID VIEW CARDS (Exact Match to Units page) */
                            <div className="brand-cards-grid">
                                {paginatedSales.map((row) => {
                                    const attr = row?.attributes || {};
                                    const grandTotal = Number(attr.grand_total || 0);
                                    const custName = attr.customer_name || 'Walk-in Customer';
                                    const payStatusVal = attr.payment_status;
                                    const payStatusText = payStatusVal === 1 ? 'Paid' : payStatusVal === 2 ? 'Unpaid' : 'Partial';

                                    return (
                                        <div key={row.id} className="brand-card-item" onClick={() => goToDetailScreen(row.id)} style={{ cursor: "pointer" }}>
                                            <div className="brand-logo-container" style={{ background: '#DCFCE7', color: '#16A34A', fontSize: '20px' }}>
                                                <FontAwesomeIcon icon={faShoppingBag} />
                                            </div>
                                            <div className="brand-card-title">{attr.reference_code || `SA-${row.id}`}</div>
                                            <div className="d-flex align-items-center justify-content-center gap-2 my-2">
                                                <span className="unit-short-badge">{custName}</span>
                                                <span className="unit-base-badge">● {payStatusText}</span>
                                            </div>
                                            <div className="brand-card-stats">
                                                <div className="brand-stat-item">
                                                    <div className="brand-stat-val">{currencySymbol} {grandTotal.toFixed(2)}</div>
                                                    <div className="brand-stat-lbl">Grand Total</div>
                                                </div>
                                                <div style={{ width: '1px', height: '24px', background: '#F1F5F9' }} />
                                                <div className="brand-stat-item">
                                                    <div className="brand-stat-val" style={{ fontSize: '12px' }}>{attr.warehouse_name || 'Main'}</div>
                                                    <div className="brand-stat-lbl">Warehouse</div>
                                                </div>
                                            </div>
                                            <div className="brand-card-actions">
                                                <button type="button" className="brand-action-btn" title="View Details" onClick={(e) => { e.stopPropagation(); goToDetailScreen(row.id); }}>
                                                    <FontAwesomeIcon icon={faEye} />
                                                </button>
                                                <button type="button" className="brand-action-btn edit" title="Edit Sale" onClick={(e) => { e.stopPropagation(); goToEdit(row); }}>
                                                    <FontAwesomeIcon icon={faEdit} />
                                                </button>
                                                <button type="button" className="brand-action-btn" title="Download PDF" onClick={(e) => { e.stopPropagation(); onPdfClick(row.id); }}>
                                                    <FontAwesomeIcon icon={faFilePdf} style={{ color: '#EF4444' }} />
                                                </button>
                                                <button type="button" className="brand-action-btn delete" title="Delete Sale" onClick={(e) => { e.stopPropagation(); onClickDeleteModel(row); }}>
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* 5. DYNAMIC WORKING PAGINATION (Inside Workspace Card - Exact Match to Units page) */}
                        <div className="var-pagination" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', paddingTop: '16px', borderTop: '1px solid #EEF2F7', width: '100%' }}>
                            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
                                Showing {filteredSales.length > 0 ? (page - 1) * perPage + 1 : 0} to {Math.min(page * perPage, filteredSales.length)} of {filteredSales.length} sales
                            </div>

                            <div className="var-pagination-pages" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <button
                                    type="button"
                                    className="var-page-btn"
                                    disabled={page <= 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                >
                                    &lt;
                                </button>

                                {pageNums.map(n => (
                                    <button
                                        key={n}
                                        type="button"
                                        className={`var-page-btn ${page === n ? 'active' : ''}`}
                                        onClick={() => setPage(n)}
                                    >
                                        {n}
                                    </button>
                                ))}

                                <button
                                    type="button"
                                    className="var-page-btn"
                                    disabled={page >= totalPages}
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                >
                                    &gt;
                                </button>

                                <select
                                    className="var-page-select"
                                    value={perPage}
                                    onChange={(e) => {
                                        setPerPage(Number(e.target.value));
                                        setPage(1);
                                    }}
                                >
                                    <option value={10}>10 / page</option>
                                    <option value={20}>20 / page</option>
                                    <option value={50}>50 / page</option>
                                </select>
                            </div>
                        </div>

                    </div>

                </div>
            )}

            {/* Modals */}
            {deleteModel && isDelete && (
                <DeleteSale
                    onClickDeleteModel={onClickDeleteModel}
                    deleteModel={deleteModel}
                    onDelete={isDelete}
                />
            )}

            {isShowPaymentModel && (
                <ShowPayment
                    setIsShowPaymentModel={setIsShowPaymentModel}
                    isShowPaymentModel={isShowPaymentModel}
                    allSalePayments={allSalePayments}
                    currencySymbol={currencySymbol}
                    createPaymentItem={createPaymentItem}
                    onCreatePaymentClick={onCreatePaymentClick}
                />
            )}

            {isCreatePaymentOpen && (
                <CreatePaymentModal
                    setIsCreatePaymentOpen={setIsCreatePaymentOpen}
                    isCreatePaymentOpen={isCreatePaymentOpen}
                    createPaymentItem={createPaymentItem}
                    allConfigData={allConfigData}
                />
            )}
        </MasterLayout>
    );
};

const mapStateToProps = (state) => {
    const {
        sales,
        totalRecord,
        frontSetting,
        isCallSaleApi,
        allConfigData,
        todayCount,
        allSalePurchase,
    } = state;
    return {
        sales,
        totalRecord,
        frontSetting,
        isCallSaleApi,
        allConfigData,
        todayCount,
        allSalePurchase,
    };
};

export default connect(mapStateToProps, {
    fetchSales,
    deleteSale,
    salePdfAction,
    fetchFrontSetting,
    todaySalePurchaseCount,
    fetchAllSalePurchaseCount,
})(Sales);
