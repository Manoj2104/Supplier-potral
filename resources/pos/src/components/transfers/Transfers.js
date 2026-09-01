import React, { useEffect, useState, useMemo } from "react";
import MasterLayout from "../MasterLayout";
import { connect } from "react-redux";
import moment from "moment";
import { Link } from "react-router-dom";
import TabTitle from "../../shared/tab-title/TabTitle";
import { fetchTransfers } from "../../store/action/transfersAction";
import { fetchFrontSetting } from "../../store/action/frontSettingAction";
import DeleteTransfer from "./DeleteTransfer";
import TransferDetails from "./TransferDetails";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
    faPlus, 
    faArrowRightArrowLeft, 
    faCalendarDay, 
    faTruckRampBox, 
    faCheckCircle, 
    faSearch, 
    faRotateLeft, 
    faList, 
    faThLarge, 
    faEye,
    faPenToSquare,
    faTrash,
    faWarehouse,
    faArrowRight
} from "@fortawesome/free-solid-svg-icons";
import "./TransfersPremium.css";
import "../brands/ProductBrandsPremium.css";
import "../units/ProductUnitsPremium.css";
import "../variation/ProductVariationsPremium.css";
import LiveCounter from "../../shared/components/LiveCounter";
import LiveSparkline from "../../shared/components/LiveSparkline";
import { subscribePosDataChanged } from "../../shared/posEvents";

const Transfers = (props) => {
    const {
        fetchTransfers,
        tansfers,
        frontSetting,
        fetchFrontSetting,
    } = props;

    const [deleteModel, setDeleteModel] = useState(false);
    const [isDelete, setIsDelete] = useState(null);
    const [lgShow, setLgShow] = useState(false);
    const [isDetails, setIsDetails] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortBy, setSortBy] = useState("newest");
    const [viewMode, setViewMode] = useState("list");
    const [selectedRows, setSelectedRows] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const currencySymbol =
        frontSetting &&
        frontSetting.value &&
        frontSetting.value.currency_symbol ? frontSetting.value.currency_symbol : '₹';

    // Fetch initial transfers and settings on mount
    useEffect(() => {
        fetchFrontSetting();
        fetchTransfers();

        // Event-driven real-time sync
        const unsubscribe = subscribePosDataChanged(() => {
            fetchTransfers({}, false);
        });

        return () => unsubscribe();
    }, []);

    const onClickDeleteModel = (isDelete = null) => {
        setDeleteModel(!deleteModel);
        setIsDelete(isDelete);
    };

    const onClickDetailsModel = (isDetails = null) => {
        setLgShow(true);
        setIsDetails(isDetails);
    };

    // Safe extraction handling Array, Object with data property, or Single Transfer Object
    const transfersArray = Array.isArray(tansfers) 
        ? tansfers 
        : (tansfers && Array.isArray(tansfers.data) 
            ? tansfers.data 
            : (tansfers && (tansfers.id || tansfers.attributes) ? [tansfers] : []));

    // Calculate Realtime KPI & Summary Data safely
    const totalTransfersCount = transfersArray.length;
    const completedCount = transfersArray.filter(t => {
        const s = (t.attributes?.status || t.status);
        return s === 1 || s === '1' || s === 'completed';
    }).length;
    const transitCount = transfersArray.filter(t => {
        const s = (t.attributes?.status || t.status);
        return s === 2 || s === '2' || s === 'sent';
    }).length;
    const pendingCount = transfersArray.filter(t => {
        const s = (t.attributes?.status || t.status);
        return s === 3 || s === '3' || s === 'pending';
    }).length;

    // Filter & Sort Logic
    const filteredTransfers = useMemo(() => {
        let list = transfersArray.filter(t => {
            const attr = t.attributes || t;
            const ref = (attr.reference_code || `TRF_${t.id}`).toLowerCase();
            const fromWh = (attr.from_warehouse?.name || attr.from_warehouse_name || '').toLowerCase();
            const toWh = (attr.to_warehouse?.name || attr.to_warehouse_name || '').toLowerCase();
            const query = searchTerm.toLowerCase().trim();

            const matchesSearch = !query || ref.includes(query) || fromWh.includes(query) || toWh.includes(query);

            const st = String(attr.status);
            let matchesStatus = true;
            if (statusFilter === 'completed') matchesStatus = st === '1' || st === 'completed';
            else if (statusFilter === 'sent') matchesStatus = st === '2' || st === 'sent';
            else if (statusFilter === 'pending') matchesStatus = st === '3' || st === 'pending';

            return matchesSearch && matchesStatus;
        });

        if (sortBy === 'oldest') {
            list.sort((a, b) => Number(a.id || 0) - Number(b.id || 0));
        } else if (sortBy === 'total') {
            list.sort((a, b) => {
                const aTot = Number((a.attributes || a).grand_total || 0);
                const bTot = Number((b.attributes || b).grand_total || 0);
                return bTot - aTot;
            });
        } else if (sortBy === 'items') {
            list.sort((a, b) => {
                const aItm = ((a.attributes || a).transfer_items || []).length;
                const bItm = ((b.attributes || b).transfer_items || []).length;
                return bItm - aItm;
            });
        } else {
            list.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
        }

        return list;
    }, [transfersArray, searchTerm, statusFilter, sortBy]);

    // Pagination
    const totalFiltered = filteredTransfers.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
    const validCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (validCurrentPage - 1) * pageSize;
    const paginatedTransfers = filteredTransfers.slice(startIndex, startIndex + pageSize);

    const handleReset = () => {
        setSearchTerm("");
        setStatusFilter("all");
        setSortBy("newest");
        setCurrentPage(1);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) setSelectedRows(filteredTransfers.map(i => i.id));
        else setSelectedRows([]);
    };

    const handleSelectRow = (id) => {
        setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
    };

    const getStatusInfo = (status) => {
        const s = String(status);
        if (s === '1' || s === 'completed') {
            return { label: 'Completed', className: 'active' };
        }
        if (s === '2' || s === 'sent') {
            return { label: 'Sent', className: 'default' };
        }
        return { label: 'Pending', className: 'draft' };
    };

    return (
        <MasterLayout>
            <TabTitle title="Transfers | INFY-POS Enterprise" />

            <div className="brand-page-container">
                {/* ─── 1. Breadcrumb ───────────────────────────────────────── */}
                <div className="brand-breadcrumb">
                    <span>Dashboard</span>
                    <span>&gt;</span>
                    <span>Transfers</span>
                    <span>&gt;</span>
                    <span className="brand-crumb-active">Transfer List</span>
                </div>

                {/* ─── 2. Page Header ──────────────────────────────────────── */}
                <div className="brand-header">
                    <div className="brand-title-group">
                        <h1>Transfers</h1>
                        <p>Manage stock transfers between warehouses and track transfer history.</p>
                    </div>
                    <div className="brand-header-actions">
                        <Link to="/app/transfers/create" className="unit-btn-pill unit-btn-primary text-decoration-none">
                            <FontAwesomeIcon icon={faPlus} /> Create Transfer
                        </Link>
                    </div>
                </div>

                {/* ─── 3. Top 4 KPI Cards Grid ──────────────────────────────── */}
                <div className="brand-kpi-grid">
                    {/* Card 1: Total Transfers */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Total Transfers</span>
                            <div className="brand-kpi-icon green">
                                <FontAwesomeIcon icon={faArrowRightArrowLeft} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={totalTransfersCount} isCurrency={false} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge up">
                                {totalTransfersCount > 0 ? `${totalTransfersCount} Active` : "0 Transfers"}
                            </span>
                            <LiveSparkline data={totalTransfersCount > 0 ? [Math.max(0, totalTransfersCount * 0.8), totalTransfersCount] : [0, 0]} color="#16A34A" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 2: Today's Transfers */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Today's Transfers</span>
                            <div className="brand-kpi-icon orange">
                                <FontAwesomeIcon icon={faCalendarDay} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={0} isCurrency={false} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge neutral">Today's Activity</span>
                            <LiveSparkline data={[0, 0]} color="#D97706" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 3: In Transit */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">In Transit</span>
                            <div className="brand-kpi-icon blue">
                                <FontAwesomeIcon icon={faTruckRampBox} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={transitCount} isCurrency={false} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge up">
                                {transitCount > 0 ? `${transitCount} In Transit` : "0 In Transit"}
                            </span>
                            <LiveSparkline data={transitCount > 0 ? [Math.max(0, transitCount * 0.8), transitCount] : [0, 0]} color="#2563EB" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 4: Completed */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Completed</span>
                            <div className="brand-kpi-icon purple">
                                <FontAwesomeIcon icon={faCheckCircle} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={completedCount} isCurrency={false} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge up">
                                {completedCount > 0 ? `${completedCount} Completed` : "0 Completed"}
                            </span>
                            <LiveSparkline data={completedCount > 0 ? [Math.max(0, completedCount * 0.8), completedCount] : [0, 0]} color="#9333EA" width={60} height={24} />
                        </div>
                    </div>
                </div>

                {/* ─── 4. Main Workspace (Matching Units Design) ─────────────── */}
                <div className="var-workspace">

                    {/* Search & Filter Bar */}
                    <div className="brand-filter-bar">
                        <div className="brand-search-box">
                            <FontAwesomeIcon icon={faSearch} className="brand-search-icon" />
                            <input
                                type="text"
                                placeholder="Search Reference, From/To Warehouse..."
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
                                <option value="completed">Completed</option>
                                <option value="sent">Sent</option>
                                <option value="pending">Pending</option>
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
                                <option value="total">Sort: Grand Total</option>
                                <option value="items">Sort: Items Count</option>
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

                    {/* ─── 5. View Content: Table or Grid ───────────────────── */}
                    {viewMode === 'grid' ? (
                        /* GRID VIEW CARDS */
                        <div className="brand-cards-grid">
                            {paginatedTransfers.length === 0 ? (
                                <div style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center' }}>
                                    <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px auto' }}>
                                        <FontAwesomeIcon icon={faArrowRightArrowLeft} />
                                    </div>
                                    <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>No transfers found</h3>
                                    <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '400px', margin: '0 auto 20px auto' }}>You haven't created any stock transfers yet. Create your first transfer to move stock between warehouses.</p>
                                    <Link to="/app/transfers/create" className="unit-btn-pill unit-btn-primary text-decoration-none">
                                        <FontAwesomeIcon icon={faPlus} /> Create Transfer
                                    </Link>
                                </div>
                            ) : (
                                paginatedTransfers.map((item) => {
                                    const attr = item.attributes || item;
                                    const ref = attr.reference_code || `TRF_${item.id}`;
                                    const fromWh = attr.from_warehouse?.name || attr.from_warehouse_name || 'Main Warehouse';
                                    const toWh = attr.to_warehouse?.name || attr.to_warehouse_name || 'Branch Warehouse';
                                    const total = Number(attr.grand_total || 0);
                                    const itemCount = (attr.transfer_items || []).length;
                                    const statusInfo = getStatusInfo(attr.status);

                                    return (
                                        <div key={item.id} className="brand-card-item">
                                            <div className="brand-logo-container" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                                                <FontAwesomeIcon icon={faArrowRightArrowLeft} style={{ fontSize: '24px' }} />
                                            </div>
                                            <div className="brand-card-title">{ref}</div>
                                            <div className="d-flex align-items-center justify-content-center gap-2 my-2">
                                                <span className={`unit-status-pill ${statusInfo.className}`}>
                                                    <span className="unit-dot" /> {statusInfo.label}
                                                </span>
                                                <span className="unit-base-badge">{itemCount} Items</span>
                                            </div>
                                            <div className="brand-card-stats">
                                                <div className="brand-stat-item">
                                                    <div className="brand-stat-val" style={{ fontSize: '12px' }}>{fromWh} → {toWh}</div>
                                                    <div className="brand-stat-lbl">Route</div>
                                                </div>
                                                <div style={{ width: '1px', height: '24px', background: '#F1F5F9' }} />
                                                <div className="brand-stat-item">
                                                    <div className="brand-stat-val text-success">
                                                        {currencySymbol}{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </div>
                                                    <div className="brand-stat-lbl">Grand Total</div>
                                                </div>
                                            </div>
                                            <div className="brand-card-actions">
                                                <button
                                                    type="button"
                                                    className="brand-action-btn"
                                                    title="View Details"
                                                    onClick={() => onClickDetailsModel(item)}
                                                >
                                                    <FontAwesomeIcon icon={faEye} />
                                                </button>
                                                <Link
                                                    to={`/app/transfers/${item.id}`}
                                                    className="brand-action-btn"
                                                    title="Edit Transfer"
                                                >
                                                    <FontAwesomeIcon icon={faPenToSquare} />
                                                </Link>
                                                <button
                                                    type="button"
                                                    className="brand-action-btn delete"
                                                    title="Delete Transfer"
                                                    onClick={() => onClickDeleteModel(item)}
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
                        /* LIST VIEW TABLE */
                        <div className="var-table-wrap">
                            <table className="var-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: "40px" }}>
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={selectedRows.length === filteredTransfers.length && filteredTransfers.length > 0}
                                                onChange={handleSelectAll}
                                            />
                                        </th>
                                        <th>REFERENCE</th>
                                        <th>FROM WAREHOUSE</th>
                                        <th>TO WAREHOUSE</th>
                                        <th>ITEMS</th>
                                        <th>GRAND TOTAL</th>
                                        <th>STATUS</th>
                                        <th>CREATED DATE</th>
                                        <th style={{ textAlign: "right" }}>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedTransfers.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" style={{ textAlign: 'center', padding: '60px 20px', border: 'none' }}>
                                                <div style={{ padding: '20px', textAlign: 'center' }}>
                                                    <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', margin: '0 auto 16px auto', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.12)' }}>
                                                        <FontAwesomeIcon icon={faArrowRightArrowLeft} />
                                                    </div>
                                                    <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                                                        No transfers found
                                                    </h3>
                                                    <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '420px', margin: '0 auto 22px auto', lineHeight: '1.55' }}>
                                                        {searchTerm || statusFilter !== 'all'
                                                            ? "No transfers match your active search or filter criteria. Try resetting filters."
                                                            : "You haven't created any stock transfers yet. Create your first transfer to move stock between warehouses."}
                                                    </p>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Link
                                                            to="/app/transfers/create"
                                                            className="unit-btn-pill unit-btn-primary text-decoration-none"
                                                        >
                                                            <FontAwesomeIcon icon={faPlus} /> Create Transfer
                                                        </Link>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedTransfers.map((item) => {
                                            const attr = item.attributes || item;
                                            const ref = attr.reference_code || `TRF_${item.id}`;
                                            const fromWh = attr.from_warehouse?.name || attr.from_warehouse_name || 'Main Warehouse';
                                            const toWh = attr.to_warehouse?.name || attr.to_warehouse_name || 'Branch Warehouse';
                                            const total = Number(attr.grand_total || 0);
                                            const itemCount = (attr.transfer_items || []).length;
                                            const statusInfo = getStatusInfo(attr.status);
                                            const date = attr.date ? moment(attr.date).format("DD MMM YYYY") : "Today";
                                            const time = attr.created_at ? moment(attr.created_at).format("LT") : "";
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
                                                        <span className="unit-short-badge font-monospace" style={{ fontWeight: "800" }}>
                                                            {ref}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-1">
                                                            <FontAwesomeIcon icon={faWarehouse} className="text-muted me-1" style={{ fontSize: '11px' }} />
                                                            <span style={{ fontWeight: "700", color: "#0F172A", fontSize: "13px" }}>{fromWh}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-1">
                                                            <FontAwesomeIcon icon={faWarehouse} className="text-success me-1" style={{ fontSize: '11px' }} />
                                                            <span style={{ fontWeight: "700", color: "#0F172A", fontSize: "13px" }}>{toWh}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="cat-badge count">{itemCount}</span>
                                                    </td>
                                                    <td>
                                                        <span style={{ fontWeight: "800", fontSize: "13.5px", color: "#16A34A" }}>
                                                            {currencySymbol}{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`unit-status-pill ${statusInfo.className}`}>
                                                            <span className="unit-dot" /> {statusInfo.label}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div>
                                                            <div style={{ fontSize: "13px", fontWeight: "600", color: "#0F172A" }}>{date}</div>
                                                            {time && <div style={{ fontSize: "11px", color: "#64748B" }}>{time}</div>}
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: "right" }}>
                                                        <div className="brand-card-actions" style={{ justifyContent: 'flex-end' }}>
                                                            <button
                                                                type="button"
                                                                className="brand-action-btn"
                                                                title="View Details"
                                                                onClick={() => onClickDetailsModel(item)}
                                                            >
                                                                <FontAwesomeIcon icon={faEye} />
                                                            </button>
                                                            <Link
                                                                to={`/app/transfers/${item.id}`}
                                                                className="brand-action-btn"
                                                                title="Edit Transfer"
                                                            >
                                                                <FontAwesomeIcon icon={faPenToSquare} />
                                                            </Link>
                                                            <button
                                                                type="button"
                                                                className="brand-action-btn delete"
                                                                title="Delete Transfer"
                                                                onClick={() => onClickDeleteModel(item)}
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

                    {/* ─── 6. Pagination ────────────────────────────────────── */}
                    <div className="var-pagination">
                        <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
                            Showing {totalFiltered > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + pageSize, totalFiltered)} of {totalFiltered} transfers
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
            {deleteModel && (
                <DeleteTransfer
                    onClickDeleteModel={onClickDeleteModel}
                    deleteModel={deleteModel}
                    onDelete={isDelete}
                />
            )}
            {lgShow && (
                <TransferDetails
                    onClickDetailsModel={onClickDetailsModel}
                    lgShow={lgShow}
                    setLgShow={setLgShow}
                    isDetails={isDetails}
                />
            )}
        </MasterLayout>
    );
};

const mapStateToProps = (state) => {
    const { tansfers, totalRecord, isLoading, frontSetting, allConfigData } = state;
    return { tansfers, totalRecord, isLoading, frontSetting, allConfigData };
};

export default connect(mapStateToProps, {
    fetchTransfers,
    fetchFrontSetting,
})(Transfers);
