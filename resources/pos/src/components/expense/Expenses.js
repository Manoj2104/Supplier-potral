import React, { useEffect, useState, useMemo } from "react";
import { connect, useDispatch } from "react-redux";
import moment from "moment";
import { Link, useNavigate } from "react-router-dom";
import MasterLayout from "../MasterLayout";
import { fetchExpenses } from "../../store/action/expenseAction";
import DeleteExpense from "./DeleteExpense";
import TabTitle from "../../shared/tab-title/TabTitle";
import {
    currencySymbolHandling,
    getFormattedDate,
    placeholderText,
} from "../../shared/sharedMethod";
import { fetchFrontSetting } from "../../store/action/frontSettingAction";
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus,
    faReceipt,
    faCalendarAlt,
    faCalculator,
    faSearch,
    faRotateLeft,
    faList,
    faThLarge,
    faWallet,
    faEye,
    faEdit,
    faTrash,
    faXmark,
    faBuilding,
    faTag,
    faLayerGroup,
    faMoneyBillWave,
    faCreditCard,
    faBolt,
    faCar,
    faUtensils,
    faWrench,
    faBullhorn,
    faBox,
    faUserCheck,
    faClock
} from "@fortawesome/free-solid-svg-icons";
import "../brands/ProductBrandsPremium.css";
import "../units/ProductUnitsPremium.css";
import "./ExpensesPremium.css";
import useSmartLoading from "../../shared/hooks/useSmartLoading";
import MasterTableSkeleton from "../../shared/components/skeletons/MasterTableSkeleton";
import LiveCounter from "../../shared/components/LiveCounter";
import LiveSparkline from "../../shared/components/LiveSparkline";
import { isPageFirstLoad, markPageAnimated } from "../dashboard/dashboardAnimationState";
import { subscribePosDataChanged } from "../../shared/posEvents";

const Expenses = (props) => {
    const {
        fetchExpenses,
        expenses,
        totalRecord = 0,
        frontSetting,
        fetchFrontSetting,
        allConfigData,
    } = props;

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [deleteModel, setDeleteModel] = useState(false);
    const [isDelete, setIsDelete] = useState(null);
    const [viewMode, setViewMode] = useState("list"); // 'list' or 'grid'
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedWarehouse, setSelectedWarehouse] = useState("all");
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("all");
    const [sortBy, setSortBy] = useState("newest");
    const [selectedRows, setSelectedRows] = useState([]);
    const [drawerExpense, setDrawerExpense] = useState(null);
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const currencySymbol =
        frontSetting?.value?.currency_symbol || '₹';

    useEffect(() => {
        fetchFrontSetting();
        fetchExpenses({ pageSize: 100 });

        // Event-driven real-time sync
        const unsubscribe = subscribePosDataChanged(() => {
            fetchExpenses({ pageSize: 100 }, false);
        });

        return () => unsubscribe();
    }, []);

    const onClickDeleteModel = (isDelete = null) => {
        setDeleteModel(!deleteModel);
        setIsDelete(isDelete);
    };

    const goToEditProduct = (item) => {
        navigate('/app/expenses/edit/' + (item.id || item));
    };

    // Safe extraction of expenses array
    const expensesArray = useMemo(() => {
        if (Array.isArray(expenses)) return expenses;
        if (expenses && Array.isArray(expenses.data)) return expenses.data;
        if (expenses && (expenses.id || expenses.attributes)) return [expenses];
        return [];
    }, [expenses]);

    // Calculate Realtime Totals
    const totalExpenseSum = useMemo(() => {
        return expensesArray.reduce((sum, item) => {
            const amt = parseFloat(item.attributes?.amount || item.amount || 0);
            return sum + (isNaN(amt) ? 0 : amt);
        }, 0);
    }, [expensesArray]);

    const totalRecordCount = expensesArray.length;
    const avgExpense = totalRecordCount > 0 ? (totalExpenseSum / totalRecordCount) : 0;

    // This month expenses calculation
    const currentMonth = moment().format("YYYY-MM");
    const thisMonthExpenses = useMemo(() => {
        return expensesArray.filter(item => {
            const d = item.attributes?.date || item.date;
            return d && moment(d).format("YYYY-MM") === currentMonth;
        });
    }, [expensesArray, currentMonth]);

    const thisMonthSum = useMemo(() => {
        return thisMonthExpenses.reduce((sum, item) => {
            const amt = parseFloat(item.attributes?.amount || item.amount || 0);
            return sum + (isNaN(amt) ? 0 : amt);
        }, 0);
    }, [thisMonthExpenses]);

    // Extract unique categories & warehouses & payment methods
    const uniqueCategories = useMemo(() => {
        const cats = new Set();
        expensesArray.forEach(item => {
            const name = item.attributes?.expense_category_name || item.expense_category_name;
            if (name) cats.add(name);
        });
        return Array.from(cats);
    }, [expensesArray]);

    const uniqueWarehouses = useMemo(() => {
        const whs = new Set();
        expensesArray.forEach(item => {
            const name = item.attributes?.warehouse_name || item.warehouse_name;
            if (name) whs.add(name);
        });
        return Array.from(whs);
    }, [expensesArray]);

    const uniquePaymentMethods = useMemo(() => {
        const pms = new Set();
        expensesArray.forEach(item => {
            const pm = item.attributes?.payment_method || item.payment_method;
            if (pm) pms.add(pm);
        });
        return Array.from(pms);
    }, [expensesArray]);

    // Helper to get category visual theme (icon, color, bg)
    const getExpenseVisualMeta = (categoryName = '', title = '') => {
        const lower = (categoryName + ' ' + title).toLowerCase();
        if (lower.includes('travel') || lower.includes('fuel') || lower.includes('transport') || lower.includes('trip') || lower.includes('vehicle')) {
            return { icon: faCar, iconBg: '#EFF6FF', color: '#2563EB', badgeClass: 'badge-travel' };
        }
        if (lower.includes('util') || lower.includes('electric') || lower.includes('power') || lower.includes('water') || lower.includes('internet') || lower.includes('bill')) {
            return { icon: faBolt, iconBg: '#FEF3C7', color: '#D97706', badgeClass: 'badge-utility' };
        }
        if (lower.includes('maint') || lower.includes('repair') || lower.includes('service') || lower.includes('clean')) {
            return { icon: faWrench, iconBg: '#F3E8FF', color: '#7E22CE', badgeClass: 'badge-maintenance' };
        }
        if (lower.includes('food') || lower.includes('meal') || lower.includes('tea') || lower.includes('coffee') || lower.includes('snack') || lower.includes('dinner')) {
            return { icon: faUtensils, iconBg: '#FFEDD5', color: '#C2410C', badgeClass: 'badge-food' };
        }
        if (lower.includes('market') || lower.includes('ad') || lower.includes('promo') || lower.includes('campaign')) {
            return { icon: faBullhorn, iconBg: '#FCE7F3', color: '#BE185D', badgeClass: 'badge-marketing' };
        }
        if (lower.includes('office') || lower.includes('stationery') || lower.includes('supplies') || lower.includes('rent')) {
            return { icon: faBuilding, iconBg: '#DCFCE7', color: '#15803D', badgeClass: 'badge-office' };
        }
        return { icon: faReceipt, iconBg: '#F1F5F9', color: '#475569', badgeClass: 'badge-office' };
    };

    // Filter & Sort Logic
    const filteredExpenses = useMemo(() => {
        let result = expensesArray.filter(item => {
            const attr = item.attributes || item;
            const title = (attr.title || '').toLowerCase();
            const ref = (attr.reference_code || ('EXP-' + (item.id || attr.id))).toLowerCase();
            const cat = (attr.expense_category_name || '').toLowerCase();
            const wh = (attr.warehouse_name || '').toLowerCase();
            const search = searchTerm.trim().toLowerCase();

            const matchesSearch = !search || title.includes(search) || ref.includes(search) || cat.includes(search) || wh.includes(search);
            const matchesCat = selectedCategory === "all" || (attr.expense_category_name || '') === selectedCategory;
            const matchesWh = selectedWarehouse === "all" || (attr.warehouse_name || '') === selectedWarehouse;
            const matchesPm = selectedPaymentMethod === "all" || (attr.payment_method || 'Cash') === selectedPaymentMethod;
            const matchesStatus = statusFilter === "all" ? true : (statusFilter === "paid" ? (attr.status === 1 || !attr.status) : attr.status === statusFilter);

            return matchesSearch && matchesCat && matchesWh && matchesPm && matchesStatus;
        });

        if (sortBy === 'newest') {
            result.sort((a, b) => Number(b.id || b.attributes?.id || 0) - Number(a.id || a.attributes?.id || 0));
        } else if (sortBy === 'oldest') {
            result.sort((a, b) => Number(a.id || a.attributes?.id || 0) - Number(b.id || b.attributes?.id || 0));
        } else if (sortBy === 'high_amount') {
            result.sort((a, b) => Number(b.attributes?.amount || b.amount || 0) - Number(a.attributes?.amount || a.amount || 0));
        } else if (sortBy === 'low_amount') {
            result.sort((a, b) => Number(a.attributes?.amount || a.amount || 0) - Number(b.attributes?.amount || b.amount || 0));
        } else if (sortBy === 'name') {
            result.sort((a, b) => (a.attributes?.title || a.title || '').localeCompare(b.attributes?.title || b.title || ''));
        }

        return result;
    }, [expensesArray, searchTerm, selectedCategory, selectedWarehouse, selectedPaymentMethod, statusFilter, sortBy]);

    // Pagination Calculations
    const totalFiltered = filteredExpenses.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
    const validCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (validCurrentPage - 1) * pageSize;
    const paginatedExpenses = useMemo(() => {
        return filteredExpenses.slice(startIndex, startIndex + pageSize);
    }, [filteredExpenses, startIndex, pageSize]);

    const handleReset = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setSelectedCategory('all');
        setSelectedWarehouse('all');
        setSelectedPaymentMethod('all');
        setSortBy('newest');
        setCurrentPage(1);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedRows(filteredExpenses.map(u => u.id));
        } else {
            setSelectedRows([]);
        }
    };

    const handleSelectRow = (id) => {
        if (selectedRows.includes(id)) {
            setSelectedRows(selectedRows.filter(rId => rId !== id));
        } else {
            setSelectedRows([...selectedRows, id]);
        }
    };

    const [isLoadingSkeleton, setIsLoadingSkeleton] = useState(isPageFirstLoad('expenses'));

    useEffect(() => {
        if (isLoadingSkeleton) {
            const timer = setTimeout(() => {
                setIsLoadingSkeleton(false);
                markPageAnimated('expenses');
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [isLoadingSkeleton]);

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title={placeholderText("expenses.title")} />

            {isLoadingSkeleton ? (
                <MasterTableSkeleton />
            ) : (
                <div className="brand-page-container">
                    {/* 1. Breadcrumb */}
                    <div className="brand-breadcrumb">
                        <span>Dashboard</span>
                        <span>&gt;</span>
                        <span>Finance</span>
                        <span>&gt;</span>
                        <span className="brand-crumb-active">Expenses</span>
                    </div>

                    {/* 2. Page Header */}
                    <div className="brand-header">
                        <div className="brand-title-group">
                            <h1>Expenses</h1>
                            <p>Manage, track and analyze your business expenses and spending across departments.</p>
                        </div>
                        <div className="brand-header-actions">
                            <Link to="/app/expenses/create" className="brand-btn-pill brand-btn-primary">
                                <FontAwesomeIcon icon={faPlus} />
                                <span>Create Expense</span>
                            </Link>
                        </div>
                    </div>

                    {/* 3. 4 REALTIME TOP KPI CARDS GRID (Exact Match to Units page) */}
                    <div className="brand-kpi-grid">
                        {/* Card 1: Total Expenses */}
                        <div className="brand-kpi-card">
                            <div className="brand-kpi-top">
                                <span className="brand-kpi-label">Total Expenses</span>
                                <div className="brand-kpi-icon green">
                                    <FontAwesomeIcon icon={faReceipt} />
                                </div>
                            </div>
                            <div className="brand-kpi-value">
                                {currencySymbol} {totalExpenseSum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="brand-kpi-bottom">
                                <span className="brand-kpi-badge up">Live System Data</span>
                                <LiveSparkline data={[0, 0, 0, 0, 0, 0, totalExpenseSum]} color="#16A34A" width={60} height={24} />
                            </div>
                        </div>

                        {/* Card 2: This Month Expenses */}
                        <div className="brand-kpi-card">
                            <div className="brand-kpi-top">
                                <span className="brand-kpi-label">This Month Expenses</span>
                                <div className="brand-kpi-icon blue">
                                    <FontAwesomeIcon icon={faCalendarAlt} />
                                </div>
                            </div>
                            <div className="brand-kpi-value">
                                {currencySymbol} {thisMonthSum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="brand-kpi-bottom">
                                <span className="brand-kpi-badge up">Current Month</span>
                                <LiveSparkline data={[0, 0, 0, 0, 0, 0, thisMonthSum]} color="#2563EB" width={60} height={24} />
                            </div>
                        </div>

                        {/* Card 3: Average Expense */}
                        <div className="brand-kpi-card">
                            <div className="brand-kpi-top">
                                <span className="brand-kpi-label">Average Expense</span>
                                <div className="brand-kpi-icon purple">
                                    <FontAwesomeIcon icon={faCalculator} />
                                </div>
                            </div>
                            <div className="brand-kpi-value">
                                {currencySymbol} {avgExpense.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="brand-kpi-bottom">
                                <span className="brand-kpi-label" style={{ fontSize: '13px', color: '#64748B', fontWeight: '700' }}>
                                    Per transaction
                                </span>
                                <LiveSparkline data={[0, 0, 0, 0, 0, 0, avgExpense]} color="#9333EA" width={60} height={24} />
                            </div>
                        </div>

                        {/* Card 4: Active Records */}
                        <div className="brand-kpi-card">
                            <div className="brand-kpi-top">
                                <span className="brand-kpi-label">Total Expense Records</span>
                                <div className="brand-kpi-icon orange">
                                    <FontAwesomeIcon icon={faWallet} />
                                </div>
                            </div>
                            <div className="brand-kpi-value">
                                <LiveCounter value={totalRecordCount} isCurrency={false} />
                            </div>
                            <div className="brand-kpi-bottom">
                                <span className="brand-kpi-badge neutral">
                                    {totalRecordCount > 0 ? `${totalRecordCount} Active` : '0 Active'}
                                </span>
                                <LiveSparkline data={[totalRecordCount, totalRecordCount]} color="#D97706" width={60} height={24} />
                            </div>
                        </div>
                    </div>

                    {/* 4. Main Workspace (Matching Units Page Design) */}
                    <div className="var-workspace">
                        {/* Search & Filter Bar */}
                        <div className="brand-filter-bar">
                            <div className="brand-search-box">
                                <FontAwesomeIcon icon={faSearch} className="brand-search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search expenses by title, reference, category, warehouse..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>

                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                <select
                                    className="var-select-sm"
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value="all">Status: All</option>
                                    <option value="paid">Paid</option>
                                    <option value="pending">Pending</option>
                                </select>

                                <select
                                    className="var-select-sm"
                                    value={selectedCategory}
                                    onChange={(e) => {
                                        setSelectedCategory(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value="all">Category: All</option>
                                    {uniqueCategories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>

                                <select
                                    className="var-select-sm"
                                    value={selectedWarehouse}
                                    onChange={(e) => {
                                        setSelectedWarehouse(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value="all">Warehouse: All</option>
                                    {uniqueWarehouses.map(wh => (
                                        <option key={wh} value={wh}>{wh}</option>
                                    ))}
                                </select>

                                <select
                                    className="var-select-sm"
                                    value={selectedPaymentMethod}
                                    onChange={(e) => {
                                        setSelectedPaymentMethod(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value="all">Payment: All</option>
                                    <option value="Cash">Cash</option>
                                    <option value="UPI">UPI</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Card">Card</option>
                                </select>

                                <select
                                    className="var-select-sm"
                                    value={sortBy}
                                    onChange={(e) => {
                                        setSortBy(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value="newest">Sort: Newest</option>
                                    <option value="oldest">Sort: Oldest</option>
                                    <option value="high_amount">Sort: Highest Amount</option>
                                    <option value="low_amount">Sort: Lowest Amount</option>
                                    <option value="name">Sort: Title (A-Z)</option>
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

                                <button
                                    type="button"
                                    className="cat-btn-filter"
                                    onClick={handleReset}
                                    title="Reset Filters"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>

                        {/* 5. View Content: Table or Grid */}
                        {viewMode === 'grid' ? (
                            /* GRID CARDS VIEW */
                            <div className="brand-cards-grid">
                                {paginatedExpenses.length === 0 ? (
                                    <div style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center' }}>
                                        <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px auto' }}>
                                            <FontAwesomeIcon icon={faReceipt} />
                                        </div>
                                        <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>No expenses found</h3>
                                        <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '400px', margin: '0 auto 20px auto' }}>Try adjusting your search criteria or create a new expense.</p>
                                        <Link to="/app/expenses/create" className="brand-btn-pill brand-btn-primary">
                                            <FontAwesomeIcon icon={faPlus} /> Create Expense
                                        </Link>
                                    </div>
                                ) : (
                                    paginatedExpenses.map((item) => {
                                        const attr = item.attributes || item;
                                        const title = attr.title || 'Expense Item';
                                        const cat = attr.expense_category_name || 'General';
                                        const wh = attr.warehouse_name || 'Main Warehouse';
                                        const ref = attr.reference_code || ('EXP-' + (item.id || attr.id));
                                        const amt = parseFloat(attr.amount || 0);
                                        const pm = attr.payment_method || 'Cash';
                                        const dateStr = getFormattedDate(attr.date || attr.created_at, allConfigData);
                                        const meta = getExpenseVisualMeta(cat, title);

                                        return (
                                            <div key={item.id || attr.id} className="brand-card-item">
                                                <div className="brand-logo-container" style={{ background: meta.iconBg }}>
                                                    <FontAwesomeIcon icon={meta.icon} style={{ color: meta.color, fontSize: '24px' }} />
                                                </div>
                                                <div className="brand-card-title">{title}</div>
                                                
                                                <div className="d-flex align-items-center justify-content-center gap-2 my-2 flex-wrap">
                                                    <span className="unit-short-badge">{ref}</span>
                                                    <span className={`cat-badge ${meta.badgeClass}`}>{cat}</span>
                                                </div>

                                                <div style={{ fontSize: '22px', fontWeight: '900', color: '#0F172A', textAlign: 'center', margin: '10px 0' }}>
                                                    {currencySymbolHandling(allConfigData, currencySymbol, amt)}
                                                </div>

                                                <div className="brand-card-stats">
                                                    <div className="brand-stat-item">
                                                        <div className="brand-stat-val" style={{ fontSize: '13px' }}>{wh}</div>
                                                        <div className="brand-stat-lbl">Warehouse</div>
                                                    </div>
                                                    <div style={{ width: '1px', height: '24px', background: '#F1F5F9' }} />
                                                    <div className="brand-stat-item">
                                                        <div className="brand-stat-val" style={{ fontSize: '13px' }}>{pm}</div>
                                                        <div className="brand-stat-lbl">Method</div>
                                                    </div>
                                                </div>

                                                <div className="brand-card-actions">
                                                    <button
                                                        type="button"
                                                        className="brand-action-btn"
                                                        title="Preview"
                                                        onClick={() => setDrawerExpense({ ...item, ...attr, title, cat, wh, ref, amt, pm, dateStr, meta })}
                                                    >
                                                        <FontAwesomeIcon icon={faEye} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="brand-action-btn edit"
                                                        title="Edit"
                                                        onClick={() => goToEditProduct(item)}
                                                    >
                                                        <FontAwesomeIcon icon={faEdit} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="brand-action-btn delete"
                                                        title="Delete"
                                                        onClick={() => onClickDeleteModel(item.id || attr.id)}
                                                    >
                                                        <FontAwesomeIcon icon={faTrash} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        ) : (
                            /* LIST VIEW TABLE (Exact Match to Units table) */
                            <div className="var-table-wrap">
                                <table className="var-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '40px' }}>
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    checked={selectedRows.length === filteredExpenses.length && filteredExpenses.length > 0}
                                                    onChange={handleSelectAll}
                                                />
                                            </th>
                                            <th>EXPENSE TITLE</th>
                                            <th>REFERENCE NO</th>
                                            <th>CATEGORY</th>
                                            <th>WAREHOUSE</th>
                                            <th>AMOUNT</th>
                                            <th>PAYMENT METHOD</th>
                                            <th>CREATED ON</th>
                                            <th>STATUS</th>
                                            <th style={{ textAlign: 'right' }}>ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedExpenses.length === 0 ? (
                                            <tr>
                                                <td colSpan="10" style={{ textAlign: 'center', padding: '60px 20px', border: 'none' }}>
                                                    <div style={{ padding: '20px', textAlign: 'center' }}>
                                                        <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', margin: '0 auto 16px auto', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.12)' }}>
                                                            <FontAwesomeIcon icon={faReceipt} />
                                                        </div>
                                                        <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                                                            No expenses found
                                                        </h3>
                                                        <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '420px', margin: '0 auto 22px auto', lineHeight: '1.55' }}>
                                                            {searchTerm
                                                                ? 'No expenses match your search criteria. Try resetting filters.'
                                                                : 'Track, categorize, and control your business operational expenses across all locations.'}
                                                        </p>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Link
                                                                to="/app/expenses/create"
                                                                className="brand-btn-pill brand-btn-primary"
                                                            >
                                                                <FontAwesomeIcon icon={faPlus} /> Create Expense
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedExpenses.map((item) => {
                                                const attr = item.attributes || item;
                                                const id = item.id || attr.id;
                                                const title = attr.title || 'Expense Item';
                                                const cat = attr.expense_category_name || 'General';
                                                const wh = attr.warehouse_name || 'Main Warehouse';
                                                const ref = attr.reference_code || ('EXP-' + id);
                                                const amt = parseFloat(attr.amount || 0);
                                                const pm = attr.payment_method || 'Cash';
                                                const createdDate = getFormattedDate(attr.date || attr.created_at, allConfigData);
                                                const createdTime = moment(attr.created_at || attr.date).format('LT');
                                                const meta = getExpenseVisualMeta(cat, title);
                                                const isSelected = selectedRows.includes(id);

                                                return (
                                                    <tr key={id} style={{ background: isSelected ? '#F0FDF4' : 'transparent' }}>
                                                        <td>
                                                            <input
                                                                type="checkbox"
                                                                className="form-check-input"
                                                                checked={isSelected}
                                                                onChange={() => handleSelectRow(id)}
                                                            />
                                                        </td>
                                                        <td>
                                                            <div className="d-flex align-items-center gap-3">
                                                                <div
                                                                    style={{
                                                                        width: '38px',
                                                                        height: '38px',
                                                                        borderRadius: '12px',
                                                                        background: meta.iconBg,
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        fontSize: '16px'
                                                                    }}
                                                                >
                                                                    <FontAwesomeIcon icon={meta.icon} style={{ color: meta.color }} />
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontWeight: '700', fontSize: '14.5px', color: '#0F172A' }}>
                                                                        {title}
                                                                    </div>
                                                                    {attr.details && (
                                                                        <div style={{ fontSize: '11.5px', color: '#64748B', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                            {attr.details}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className="badge bg-success-subtle text-success border border-success fw-bold px-2 py-1 fs-micro">
                                                                {ref}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${meta.badgeClass} fw-bold px-2.5 py-1 fs-micro`}>
                                                                {cat}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="unit-base-badge">
                                                                {wh}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="fw-extrabold text-dark fs-small">
                                                                {currencySymbolHandling(allConfigData, currencySymbol, amt)}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className="unit-short-badge">
                                                                {pm}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A' }}>{createdDate}</div>
                                                            <div style={{ fontSize: '11px', color: '#64748B' }}>{createdTime}</div>
                                                        </td>
                                                        <td>
                                                            <span className="var-status-badge active">
                                                                ● Active
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="brand-card-actions" style={{ justifyContent: 'flex-end' }}>
                                                                <button
                                                                    type="button"
                                                                    className="brand-action-btn"
                                                                    title="Preview Expense"
                                                                    onClick={() => setDrawerExpense({ ...item, ...attr, id, title, cat, wh, ref, amt, pm, createdDate, createdTime, meta })}
                                                                >
                                                                    <FontAwesomeIcon icon={faEye} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="brand-action-btn edit"
                                                                    title="Edit Expense"
                                                                    onClick={() => goToEditProduct(item)}
                                                                >
                                                                    <FontAwesomeIcon icon={faEdit} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="brand-action-btn delete"
                                                                    title="Delete Expense"
                                                                    onClick={() => onClickDeleteModel(id)}
                                                                >
                                                                    <FontAwesomeIcon icon={faTrash} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* 6. Dynamic Working Pagination (Matching Units page) */}
                        <div className="var-pagination">
                            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
                                Showing {totalFiltered > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + pageSize, totalFiltered)} of {totalFiltered} expenses
                            </div>

                            <div className="var-pagination-pages">
                                <button
                                    type="button"
                                    className="var-page-btn"
                                    disabled={validCurrentPage <= 1}
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                >
                                    &lt;
                                </button>

                                {[...Array(totalPages)].map((_, pIdx) => {
                                    const pageNum = pIdx + 1;
                                    if (totalPages > 6 && Math.abs(pageNum - validCurrentPage) > 2 && pageNum !== 1 && pageNum !== totalPages) {
                                        return null;
                                    }
                                    return (
                                        <button
                                            key={pageNum}
                                            type="button"
                                            className={`var-page-btn ${pageNum === validCurrentPage ? 'active' : ''}`}
                                            onClick={() => setCurrentPage(pageNum)}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}

                                <button
                                    type="button"
                                    className="var-page-btn"
                                    disabled={validCurrentPage >= totalPages}
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                >
                                    &gt;
                                </button>

                                <select
                                    className="var-select-sm"
                                    style={{ height: '36px', padding: '0 24px 0 10px', marginLeft: '12px' }}
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value={10}>10 / page</option>
                                    <option value={20}>20 / page</option>
                                    <option value={50}>50 / page</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Right Side Expense Preview Drawer Panel */}
                    {drawerExpense && (
                        <div className="var-drawer-overlay" onClick={() => setDrawerExpense(null)}>
                            <div className="var-drawer" onClick={(e) => e.stopPropagation()}>
                                <div className="var-drawer-header">
                                    <div>
                                        <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#0F172A' }}>
                                            {drawerExpense.title}
                                        </h3>
                                        <span className="var-name-slug">Ref: {drawerExpense.ref}</span>
                                    </div>
                                    <button type="button" className="cat-drawer-close" onClick={() => setDrawerExpense(null)}>
                                        <FontAwesomeIcon icon={faXmark} />
                                    </button>
                                </div>

                                <div className="var-drawer-body">
                                    <div style={{ textAlign: 'center', padding: '24px 0 16px 0', borderBottom: '1px solid #EEF2F7' }}>
                                        <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: drawerExpense.meta?.iconBg || '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', fontSize: '26px' }}>
                                            <FontAwesomeIcon icon={drawerExpense.meta?.icon || faReceipt} style={{ color: drawerExpense.meta?.color || '#15803D' }} />
                                        </div>
                                        <div style={{ fontSize: '28px', fontWeight: '900', color: '#0F172A' }}>
                                            {currencySymbolHandling(allConfigData, currencySymbol, drawerExpense.amt)}
                                        </div>
                                        <span className="badge bg-success-subtle text-success border border-success fw-bold px-3 py-1 mt-2">
                                            ● Active & Recorded
                                        </span>
                                    </div>

                                    <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Category</span>
                                            <span className={`badge ${drawerExpense.meta?.badgeClass} fw-bold px-2.5 py-1`}>
                                                {drawerExpense.cat}
                                            </span>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Warehouse</span>
                                            <span className="unit-base-badge">{drawerExpense.wh}</span>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Payment Method</span>
                                            <span className="unit-short-badge">{drawerExpense.pm}</span>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Expense Date</span>
                                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>
                                                {drawerExpense.createdDate || getFormattedDate(drawerExpense.date, allConfigData)}
                                            </span>
                                        </div>
                                        {drawerExpense.details && (
                                            <div style={{ marginTop: '10px' }}>
                                                <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes & Details</span>
                                                <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '12px', border: '1px solid #E2E8F0', marginTop: '6px', fontSize: '13px', color: '#334155', lineHeight: '1.5' }}>
                                                    {drawerExpense.details}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="var-drawer-footer">
                                    <button
                                        type="button"
                                        className="brand-btn-pill"
                                        style={{ flex: 1 }}
                                        onClick={() => goToEditProduct(drawerExpense)}
                                    >
                                        <FontAwesomeIcon icon={faEdit} /> Edit Expense
                                    </button>
                                    <button
                                        type="button"
                                        className="brand-btn-pill"
                                        style={{ background: '#FEE2E2', color: '#DC2626', borderColor: '#FECACA' }}
                                        onClick={() => {
                                            const idToDel = drawerExpense.id;
                                            setDrawerExpense(null);
                                            onClickDeleteModel(idToDel);
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Delete Modal */}
                    <DeleteExpense
                        onClickDeleteModel={onClickDeleteModel}
                        deleteModel={deleteModel}
                        onDelete={isDelete}
                    />
                </div>
            )}
        </MasterLayout>
    );
};

const mapStateToProps = (state) => {
    const { expenses, totalRecord, frontSetting, allConfigData } = state;
    return { expenses, totalRecord, frontSetting, allConfigData };
};

export default connect(mapStateToProps, {
    fetchExpenses,
    fetchFrontSetting,
})(Expenses);
