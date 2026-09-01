import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import MasterLayout from "../MasterLayout";
import { connect, useDispatch } from "react-redux";
import DeleteExpenseCategory from "./DeleteExpenseCategory";
import { fetchExpenseCategories } from "../../store/action/expenseCategoryAction";
import EditExpenseCategory from "./EditExpenseCategory";
import TabTitle from "../../shared/tab-title/TabTitle";
import { getFormattedMessage, placeholderText } from "../../shared/sharedMethod";
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus,
    faSearch,
    faFolderOpen,
    faFolder,
    faIndianRupeeSign,
    faCoins,
    faRotateLeft,
    faList,
    faThLarge,
    faPenToSquare,
    faTrash
} from "@fortawesome/free-solid-svg-icons";
import moment from "moment";
import "../brands/ProductBrandsPremium.css";
import "../units/ProductUnitsPremium.css";
import "../variation/ProductVariationsPremium.css";
import LiveCounter from "../../shared/components/LiveCounter";
import LiveSparkline from "../../shared/components/LiveSparkline";

const ExpenseCategory = (props) => {
    const { fetchExpenseCategories, expenseCategories = [], totalRecord, isLoading } = props;
    const dispatch = useDispatch();

    const [deleteModel, setDeleteModel] = useState(false);
    const [isDelete, setIsDelete] = useState(null);
    const [editModel, setEditModel] = useState(false);
    const [expenseCategory, setExpenseCategory] = useState();

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortBy, setSortBy] = useState("newest");
    const [viewMode, setViewMode] = useState("list");
    const [selectedRows, setSelectedRows] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        fetchExpenseCategories({}, true);
    }, []);

    const handleClose = (item) => {
        setEditModel(!editModel);
        setExpenseCategory(item);
    };

    const onClickDeleteModel = (isDelete = null) => {
        setDeleteModel(!deleteModel);
        setIsDelete(isDelete);
    };

    // Safe extraction handling Array
    const categoriesArray = Array.isArray(expenseCategories) 
        ? expenseCategories 
        : (expenseCategories && Array.isArray(expenseCategories.data) 
            ? expenseCategories.data 
            : []);

    // Real-Time Dynamic Calculations
    const totalCategoriesCount = categoriesArray.length;
    const activeCategoriesCount = categoriesArray.filter(c => {
        const s = (c.attributes || c).status;
        return s !== 0 && s !== "0" && s !== "Inactive";
    }).length;

    // Filter & Sort Logic
    const filteredCategories = useMemo(() => {
        let list = categoriesArray.map((expense) => ({
            name: expense.attributes?.name || "",
            code: expense.attributes?.code || `EXP-${expense.id}`,
            desc: expense.attributes?.description || expense.attributes?.name || "Expense Category",
            status: expense.attributes?.status === 0 ? "Inactive" : "Active",
            createdOn: moment(expense.attributes?.created_at || new Date()).format("DD MMM YYYY"),
            id: expense.id,
            rawItem: expense
        }));

        if (statusFilter === "active") {
            list = list.filter(item => item.status === "Active");
        } else if (statusFilter === "inactive") {
            list = list.filter(item => item.status === "Inactive");
        }

        if (searchTerm) {
            const q = searchTerm.toLowerCase();
            list = list.filter(item => 
                item.name.toLowerCase().includes(q) || 
                item.code.toLowerCase().includes(q) || 
                item.desc.toLowerCase().includes(q)
            );
        }

        if (sortBy === "name") {
            list.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortBy === "oldest") {
            list.sort((a, b) => Number(a.id || 0) - Number(b.id || 0));
        } else {
            list.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
        }

        return list;
    }, [categoriesArray, statusFilter, searchTerm, sortBy]);

    // Pagination
    const totalFiltered = filteredCategories.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
    const validCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (validCurrentPage - 1) * pageSize;
    const paginatedCategories = filteredCategories.slice(startIndex, startIndex + pageSize);

    const handleReset = () => {
        setSearchTerm("");
        setStatusFilter("all");
        setSortBy("newest");
        setCurrentPage(1);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) setSelectedRows(filteredCategories.map(i => i.id));
        else setSelectedRows([]);
    };

    const handleSelectRow = (id) => {
        setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
    };

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title={placeholderText('expense-categories.title')} />

            <div className="brand-page-container">

                {/* ── 1. Breadcrumb ─────────────────────────────────────────── */}
                <div className="brand-breadcrumb">
                    <span>Dashboard</span>
                    <span>&gt;</span>
                    <span>Expenses</span>
                    <span>&gt;</span>
                    <span className="brand-crumb-active">Expense Categories</span>
                </div>

                {/* ── 2. Page Header ───────────────────────────────────────── */}
                <div className="brand-header">
                    <div className="brand-title-group">
                        <h1>Expense Categories</h1>
                        <p>Manage all expense categories used across the organization.</p>
                    </div>

                    <div className="brand-header-actions">
                        <Link to="/app/expense-categories/create" className="unit-btn-pill unit-btn-primary text-decoration-none">
                            <FontAwesomeIcon icon={faPlus} /> Create Category
                        </Link>
                    </div>
                </div>

                {/* ── 3. 4 Top KPI Stat Cards Grid ──────────────────────────── */}
                <div className="brand-kpi-grid">
                    {/* Card 1: Total Categories */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Total Categories</span>
                            <div className="brand-kpi-icon green">
                                <FontAwesomeIcon icon={faFolderOpen} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={totalCategoriesCount} isCurrency={false} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className={`brand-kpi-badge ${totalCategoriesCount > 0 ? "up" : "neutral"}`}>
                                {totalCategoriesCount > 0 ? `${totalCategoriesCount} Active` : "0 Categories"}
                            </span>
                            <LiveSparkline data={totalCategoriesCount > 0 ? [Math.max(0, totalCategoriesCount * 0.8), totalCategoriesCount] : [0, 0]} color="#16A34A" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 2: Active Categories */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Active Categories</span>
                            <div className="brand-kpi-icon blue">
                                <FontAwesomeIcon icon={faFolder} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={activeCategoriesCount} isCurrency={false} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className={`brand-kpi-badge ${activeCategoriesCount > 0 ? "up" : "neutral"}`}>
                                {activeCategoriesCount > 0 ? "Active in ERP" : "0 Active"}
                            </span>
                            <LiveSparkline data={activeCategoriesCount > 0 ? [Math.max(0, activeCategoriesCount * 0.8), activeCategoriesCount] : [0, 0]} color="#2563EB" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 3: Monthly Expenses */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Monthly Expenses</span>
                            <div className="brand-kpi-icon purple">
                                <FontAwesomeIcon icon={faIndianRupeeSign} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={0} isCurrency={true} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-label" style={{ fontSize: '13px', color: '#64748B', fontWeight: '700' }}>
                                Current Month
                            </span>
                            <LiveSparkline data={[0, 0]} color="#9333EA" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 4: Total Expenses */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Total Expenses</span>
                            <div className="brand-kpi-icon orange">
                                <FontAwesomeIcon icon={faCoins} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={0} isCurrency={true} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-label" style={{ fontSize: '13px', color: '#64748B', fontWeight: '700' }}>
                                Cumulative Total
                            </span>
                            <LiveSparkline data={[0, 0]} color="#D97706" width={60} height={24} />
                        </div>
                    </div>
                </div>

                {/* ── 4. Main Workspace (Matching Units Design) ─────────── */}
                <div className="var-workspace">

                    {/* Search & Filter Bar */}
                    <div className="brand-filter-bar">
                        <div className="brand-search-box">
                            <FontAwesomeIcon icon={faSearch} className="brand-search-icon" />
                            <input
                                type="text"
                                placeholder="Search by category name, code, description..."
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
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>

                            <select
                                className="var-select-sm"
                                value={sortBy}
                                onChange={(e) => {
                                    setSortBy(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="newest">Sort: Newest First</option>
                                <option value="oldest">Sort: Oldest First</option>
                                <option value="name">Sort: Name (A-Z)</option>
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
                                <FontAwesomeIcon icon={faRotateLeft} /> Reset
                            </button>
                        </div>
                    </div>

                    {/* ── 5. View Content: Table or Grid ───────────────── */}
                    {viewMode === 'grid' ? (
                        /* GRID VIEW CARDS */
                        <div className="brand-cards-grid">
                            {paginatedCategories.length === 0 ? (
                                <div style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center' }}>
                                    <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px auto' }}>
                                        <FontAwesomeIcon icon={faFolderOpen} />
                                    </div>
                                    <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>No expense categories found</h3>
                                    <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '400px', margin: '0 auto 20px auto' }}>Create your first expense category to organize business expenses.</p>
                                    <Link to="/app/expense-categories/create" className="unit-btn-pill unit-btn-primary text-decoration-none">
                                        <FontAwesomeIcon icon={faPlus} /> Create Category
                                    </Link>
                                </div>
                            ) : (
                                paginatedCategories.map((item) => (
                                    <div key={item.id} className="brand-card-item">
                                        <div className="brand-logo-container" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                                            <FontAwesomeIcon icon={faFolder} style={{ fontSize: '24px' }} />
                                        </div>
                                        <div className="brand-card-title">{item.name}</div>
                                        <div className="d-flex align-items-center justify-content-center gap-2 my-2">
                                            <span className={`unit-status-pill ${item.status === 'Active' ? 'active' : 'draft'}`}>
                                                <span className="unit-dot" /> {item.status}
                                            </span>
                                            <span className="unit-short-badge">{item.code}</span>
                                        </div>
                                        <div className="brand-card-stats">
                                            <div className="brand-stat-item">
                                                <div className="brand-stat-val" style={{ fontSize: '12px' }}>{item.createdOn}</div>
                                                <div className="brand-stat-lbl">Created Date</div>
                                            </div>
                                            <div style={{ width: '1px', height: '24px', background: '#F1F5F9' }} />
                                            <div className="brand-stat-item">
                                                <div className="brand-stat-val text-success">Active</div>
                                                <div className="brand-stat-lbl">Status</div>
                                            </div>
                                        </div>
                                        <div className="brand-card-actions">
                                            <button
                                                type="button"
                                                className="brand-action-btn"
                                                title="Edit Category"
                                                onClick={() => handleClose(item.rawItem)}
                                            >
                                                <FontAwesomeIcon icon={faPenToSquare} />
                                            </button>
                                            <button
                                                type="button"
                                                className="brand-action-btn delete"
                                                title="Delete Category"
                                                onClick={() => onClickDeleteModel(item.rawItem)}
                                            >
                                                <FontAwesomeIcon icon={faTrash} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        /* LIST VIEW TABLE */
                        <div className="var-table-wrap">
                            <table className="var-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: "40px" }}>
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={selectedRows.length === filteredCategories.length && filteredCategories.length > 0}
                                                onChange={handleSelectAll}
                                            />
                                        </th>
                                        <th>CATEGORY</th>
                                        <th>CODE</th>
                                        <th>DESCRIPTION</th>
                                        <th>STATUS</th>
                                        <th>CREATED ON</th>
                                        <th style={{ textAlign: "right" }}>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedCategories.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', padding: '60px 20px', border: 'none' }}>
                                                <div style={{ padding: '20px', textAlign: 'center' }}>
                                                    <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', margin: '0 auto 16px auto', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.12)' }}>
                                                        <FontAwesomeIcon icon={faFolderOpen} />
                                                    </div>
                                                    <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                                                        No expense categories found
                                                    </h3>
                                                    <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '420px', margin: '0 auto 22px auto', lineHeight: '1.55' }}>
                                                        {searchTerm || statusFilter !== 'all'
                                                            ? "No expense categories match your active search or filter criteria. Try resetting filters."
                                                            : "Create your first expense category to organize business expenses and track operational spending."}
                                                    </p>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Link
                                                            to="/app/expense-categories/create"
                                                            className="unit-btn-pill unit-btn-primary text-decoration-none"
                                                        >
                                                            <FontAwesomeIcon icon={faPlus} /> Create Category
                                                        </Link>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedCategories.map((item) => {
                                            const isSelected = selectedRows.includes(item.id);

                                            return (
                                                <tr
                                                    key={item.id}
                                                    style={{ background: isSelected ? "#F0FDF4" : "transparent" }}
                                                >
                                                    <td>
                                                        <input
                                                            type="checkbox"
                                                            className="form-check-input"
                                                            checked={isSelected}
                                                            onChange={() => handleSelectRow(item.id)}
                                                        />
                                                    </td>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "#DCFCE7", color: "#16A34A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>
                                                                <FontAwesomeIcon icon={faFolder} />
                                                            </div>
                                                            <div>
                                                                <span style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A", display: "block" }}>{item.name}</span>
                                                                <span style={{ fontSize: "11px", color: "#64748B" }}>{item.code}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="unit-short-badge font-monospace" style={{ fontWeight: "800" }}>
                                                            {item.code}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span style={{ fontSize: "13px", color: "#64748B" }}>{item.desc}</span>
                                                    </td>
                                                    <td>
                                                        <span className={`unit-status-pill ${item.status === 'Active' ? 'active' : 'draft'}`}>
                                                            <span className="unit-dot" /> {item.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span style={{ fontSize: "13px", fontWeight: "600", color: "#0F172A" }}>{item.createdOn}</span>
                                                    </td>
                                                    <td style={{ textAlign: "right" }}>
                                                        <div className="brand-card-actions" style={{ justifyContent: 'flex-end' }}>
                                                            <button
                                                                type="button"
                                                                className="brand-action-btn"
                                                                title="Edit Category"
                                                                onClick={() => handleClose(item.rawItem)}
                                                            >
                                                                <FontAwesomeIcon icon={faPenToSquare} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="brand-action-btn delete"
                                                                title="Delete Category"
                                                                onClick={() => onClickDeleteModel(item.rawItem)}
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

                    {/* ── 6. Pagination ────────────────────────────────── */}
                    <div className="var-pagination">
                        <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
                            Showing {totalFiltered > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + pageSize, totalFiltered)} of {totalFiltered} categories
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

            </div>

            {/* Modals */}
            <EditExpenseCategory handleClose={handleClose} show={editModel} expenseCategory={expenseCategory} />
            <DeleteExpenseCategory onClickDeleteModel={onClickDeleteModel} deleteModel={deleteModel} onDelete={isDelete} />
        </MasterLayout>
    );
};

const mapStateToProps = (state) => {
    const { expenseCategories, totalRecord, isLoading } = state;
    return { expenseCategories, totalRecord, isLoading };
};

export default connect(mapStateToProps, { fetchExpenseCategories })(ExpenseCategory);
