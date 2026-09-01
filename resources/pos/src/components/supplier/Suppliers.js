import React, { useState, useEffect, useMemo } from 'react';
import { connect, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import moment from 'moment';
import MasterLayout from '../MasterLayout';
import { fetchSuppliers } from '../../store/action/supplierAction';
import DeleteSupplier from './DeleteSupplier';
import TabTitle from '../../shared/tab-title/TabTitle';
import { getFormattedDate, placeholderText } from '../../shared/sharedMethod';
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";
import ImportSuppliersModel from './ImportSuppliersModel';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus,
    faSearch,
    faTruck,
    faLocationDot,
    faCalendarAlt,
    faUserCheck,
    faList,
    faThLarge,
    faEye,
    faEdit,
    faTrash,
} from '@fortawesome/free-solid-svg-icons';
import useSmartLoading from '../../shared/hooks/useSmartLoading';
import MasterTableSkeleton from '../../shared/components/skeletons/MasterTableSkeleton';
import '../brands/ProductBrandsPremium.css';
import '../units/ProductUnitsPremium.css';
import '../variation/ProductVariationsPremium.css';
import './SuppliersPremium.css';
import LiveCounter from '../../shared/components/LiveCounter';
import LiveSparkline from '../../shared/components/LiveSparkline';
import { subscribePosDataChanged } from "../../shared/posEvents";

const Suppliers = ( props ) => {
    const { fetchSuppliers, suppliers = [], allConfigData } = props;
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Smart loading: instant render if suppliers data already in Redux
    const isLoadingSkeleton = useSmartLoading(suppliers);

    const safeSuppliers = Array.isArray(suppliers) ? suppliers : [];

    const [ deleteModel, setDeleteModel ] = useState( false );
    const [ isDelete, setIsDelete ] = useState( null );
    const [ importSuppliers, setImportSuppliers ] = useState( false );
    const [ searchTerm, setSearchTerm ] = useState("");
    const [ statusFilter, setStatusFilter ] = useState("all");
    const [ cityFilter, setCityFilter ] = useState("all");
    const [ sortBy, setSortBy ] = useState("newest");
    const [ viewMode, setViewMode ] = useState("list");
    const [ selectedRows, setSelectedRows ] = useState([]);
    const [ currentPage, setCurrentPage ] = useState(1);
    const [ pageSize, setPageSize ] = useState(10);

    useEffect(() => {
        const hasData = safeSuppliers.length > 0;
        fetchSuppliers({ page: 1, pageSize: 50 }, !hasData);

        // Event-driven real-time sync
        const unsubscribe = subscribePosDataChanged(() => {
            fetchSuppliers({ page: 1, pageSize: 50 }, false);
        });

        return () => unsubscribe();
    }, []);

    const handleClose = () => {
        setImportSuppliers( !importSuppliers );
    };

    const onClickDeleteModel = ( isDelete = null ) => {
        setDeleteModel( !deleteModel );
        setIsDelete( isDelete );
    };

    const goToEditProduct = ( item ) => {
        const id = item.id;
        navigate( `/app/suppliers/edit/${id}` );
    };

    const handleReset = () => {
        setSearchTerm("");
        setStatusFilter("all");
        setCityFilter("all");
        setSortBy("newest");
        setSelectedRows([]);
        setCurrentPage(1);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedRows(filteredItems.map(item => item.id));
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

    // ── Realtime Table Items Formatting ───────────────────────────────────────
    const itemsValue = useMemo(() => {
        if (!safeSuppliers || !safeSuppliers.length) return [];
        return safeSuppliers.map((supplier) => {
            const name = supplier.attributes?.name || "N/A";
            const email = supplier.attributes?.email || "N/A";
            const phone = supplier.attributes?.phone || "N/A";
            const city = supplier.attributes?.city || "";
            const country = supplier.attributes?.country || "";
            const location = [city, country].filter(Boolean).join(", ") || "N/A";

            return {
                id: supplier.id,
                name: name,
                code: `SUP-${String(supplier.id).padStart(5, '0')}`,
                phone: phone,
                email: email,
                city: city || "Other",
                country: country || "India",
                location: location,
                status: "active",
                date: getFormattedDate(supplier.attributes?.created_at, allConfigData && allConfigData),
                time: supplier.attributes?.created_at ? moment(supplier.attributes.created_at).format('LT') : '',
                created_at: supplier.attributes?.created_at,
                rawItem: supplier
            };
        });
    }, [safeSuppliers, allConfigData]);

    // Unique cities list for dropdown
    const citiesList = useMemo(() => {
        const set = new Set(safeSuppliers.map(s => s.attributes?.city).filter(Boolean));
        return Array.from(set);
    }, [safeSuppliers]);

    // Filter and sort items (Matching Units page logic)
    const filteredItems = useMemo(() => {
        let result = itemsValue.filter(item => {
            const matchesSearch = !searchTerm || (
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.code.toLowerCase().includes(searchTerm.toLowerCase())
            );
            const matchesStatus = statusFilter === "all" || item.status === statusFilter;
            const matchesCity = cityFilter === "all" || item.city === cityFilter;
            return matchesSearch && matchesStatus && matchesCity;
        });

        // Sorting
        if (sortBy === 'name_asc') {
            result.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortBy === 'name_desc') {
            result.sort((a, b) => b.name.localeCompare(a.name));
        } else if (sortBy === 'oldest') {
            result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        } else {
            // newest
            result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }

        return result;
    }, [itemsValue, searchTerm, statusFilter, cityFilter, sortBy]);

    // Pagination calculations
    const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredItems.slice(start, start + pageSize);
    }, [filteredItems, currentPage, pageSize]);

    // ── 4 Clean Realtime KPI Stat Cards ───────────────────────────────────────
    const totalCount = safeSuppliers.length;
    const activeCount = safeSuppliers.length;

    const uniqueCitiesCount = useMemo(() => {
        const set = new Set(safeSuppliers.map(s => s.attributes?.city).filter(Boolean));
        return set.size;
    }, [safeSuppliers]);

    const newThisMonthCount = useMemo(() => {
        return safeSuppliers.filter(s => s.attributes?.created_at && moment(s.attributes.created_at).isSame(moment(), 'month')).length;
    }, [safeSuppliers]);

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title={placeholderText( 'suppliers.title' )} />

            {isLoadingSkeleton ? (
                <MasterTableSkeleton />
            ) : (
                <div className="brand-page-container">

                    {/* 1. Breadcrumb (Exact Match to Units page) */}
                    <div className="brand-breadcrumb">
                        <span>Dashboard</span>
                        <span>&gt;</span>
                        <span>People</span>
                        <span>&gt;</span>
                        <span className="brand-crumb-active">Suppliers</span>
                    </div>

                    {/* 2. Header Section (Exact Match to Units page) */}
                    <div className="brand-header">
                        <div className="brand-title-group">
                            <h1>Suppliers</h1>
                            <p>Manage measurement units, vendor details, and procurement partners.</p>
                        </div>

                        <div className="brand-header-actions">
                            <Link
                                to="/app/suppliers/create"
                                className="brand-btn-pill brand-btn-primary"
                            >
                                <FontAwesomeIcon icon={faPlus} /> Create Supplier
                            </Link>
                        </div>
                    </div>

                    {/* 3. 4 Real KPI Summary Cards Grid (Exact Match to Units page) */}
                    <div className="brand-kpi-grid">
                        {/* Card 1: Total Suppliers */}
                        <div className="brand-kpi-card">
                            <div className="brand-kpi-top">
                                <span className="brand-kpi-label">Total Suppliers</span>
                                <div className="brand-kpi-icon green">
                                    <FontAwesomeIcon icon={faTruck} />
                                </div>
                            </div>
                            <div className="brand-kpi-value">
                                <LiveCounter value={totalCount} isCurrency={false} />
                            </div>
                            <div className="brand-kpi-bottom">
                                <span className="brand-kpi-badge up">Active Units</span>
                                <LiveSparkline color="#16A34A" width={60} height={24} />
                            </div>
                        </div>

                        {/* Card 2: Active Suppliers */}
                        <div className="brand-kpi-card">
                            <div className="brand-kpi-top">
                                <span className="brand-kpi-label">Active Suppliers</span>
                                <div className="brand-kpi-icon blue">
                                    <FontAwesomeIcon icon={faUserCheck} />
                                </div>
                            </div>
                            <div className="brand-kpi-value">
                                <LiveCounter value={activeCount} isCurrency={false} />
                            </div>
                            <div className="brand-kpi-bottom">
                                <span className="brand-kpi-badge up">{activeCount} Active</span>
                                <LiveSparkline color="#2563EB" width={60} height={24} />
                            </div>
                        </div>

                        {/* Card 3: Cities Covered */}
                        <div className="brand-kpi-card">
                            <div className="brand-kpi-top">
                                <span className="brand-kpi-label">Cities Covered</span>
                                <div className="brand-kpi-icon purple">
                                    <FontAwesomeIcon icon={faLocationDot} />
                                </div>
                            </div>
                            <div className="brand-kpi-value">
                                <LiveCounter value={uniqueCitiesCount} isCurrency={false} />
                            </div>
                            <div className="brand-kpi-bottom">
                                <span className="brand-kpi-badge neutral">
                                    {uniqueCitiesCount > 0 ? `${uniqueCitiesCount} Locations` : '0 Locations'}
                                </span>
                                <LiveSparkline color="#9333EA" width={60} height={24} />
                            </div>
                        </div>

                        {/* Card 4: New This Month */}
                        <div className="brand-kpi-card">
                            <div className="brand-kpi-top">
                                <span className="brand-kpi-label">New This Month</span>
                                <div className="brand-kpi-icon orange">
                                    <FontAwesomeIcon icon={faCalendarAlt} />
                                </div>
                            </div>
                            <div className="brand-kpi-value">
                                <LiveCounter value={newThisMonthCount} isCurrency={false} />
                            </div>
                            <div className="brand-kpi-bottom">
                                <span className="brand-kpi-badge neutral">
                                    {newThisMonthCount > 0 ? `${newThisMonthCount} Defined` : '0 Defined'}
                                </span>
                                <LiveSparkline color="#D97706" width={60} height={24} />
                            </div>
                        </div>
                    </div>

                    {/* 4. Main Workspace Container (Exact Match to Units page) */}
                    <div className="var-workspace">

                        {/* Search & Filter Bar (Exact Match to Units page) */}
                        <div className="brand-filter-bar">
                            <div className="brand-search-box">
                                <FontAwesomeIcon icon={faSearch} className="brand-search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search suppliers..."
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
                                    value={cityFilter}
                                    onChange={(e) => {
                                        setCityFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value="all">City: All</option>
                                    {citiesList.map((c, idx) => (
                                        <option key={idx} value={c}>{c}</option>
                                    ))}
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
                                    <option value="name_asc">Sort: Name (A-Z)</option>
                                    <option value="name_desc">Sort: Name (Z-A)</option>
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

                        {/* 5. View Content: Table or Grid (Exact Match to Units page) */}
                        {viewMode === 'grid' ? (
                            /* GRID VIEW CARDS */
                            <div className="brand-cards-grid">
                                {paginatedItems.length === 0 ? (
                                    <div style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center' }}>
                                        <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px auto' }}>
                                            <FontAwesomeIcon icon={faTruck} />
                                        </div>
                                        <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>No suppliers found</h3>
                                        <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '400px', margin: '0 auto 20px auto' }}>Try adjusting your search criteria or create a new supplier.</p>
                                    </div>
                                ) : (
                                    paginatedItems.map((item) => (
                                        <div key={item.id} className="brand-card-item">
                                            <div className="brand-logo-container" style={{ background: '#F3E8FF', color: '#7E22CE' }}>
                                                <FontAwesomeIcon icon={faTruck} style={{ fontSize: '24px' }} />
                                            </div>
                                            <div className="brand-card-title">{item.name}</div>
                                            <div className="d-flex align-items-center justify-content-center gap-2 my-2">
                                                <span className="unit-short-badge" style={{ whiteSpace: 'nowrap' }}>{item.code}</span>
                                                <span className="unit-base-badge" style={{ whiteSpace: 'nowrap' }}>{item.location}</span>
                                            </div>
                                            <div className="brand-card-stats">
                                                <div className="brand-stat-item">
                                                    <div className="brand-stat-val">{item.phone}</div>
                                                    <div className="brand-stat-lbl">Phone</div>
                                                </div>
                                                <div style={{ width: '1px', height: '24px', background: '#F1F5F9' }} />
                                                <div className="brand-stat-item">
                                                    <div className="brand-stat-val">{item.date}</div>
                                                    <div className="brand-stat-lbl">Created</div>
                                                </div>
                                            </div>
                                            <div className="brand-card-actions">
                                                <button
                                                    type="button"
                                                    className="brand-action-btn"
                                                    title="View Details"
                                                    onClick={() => goToEditProduct(item)}
                                                >
                                                    <FontAwesomeIcon icon={faEye} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="brand-action-btn edit"
                                                    title="Edit Supplier"
                                                    onClick={() => goToEditProduct(item)}
                                                >
                                                    <FontAwesomeIcon icon={faEdit} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="brand-action-btn delete"
                                                    title="Delete Supplier"
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
                            /* LIST VIEW TABLE (Exact Match to Units page) */
                            <div className="var-table-wrap">
                                <table className="var-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '40px' }}>
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    checked={selectedRows.length === filteredItems.length && filteredItems.length > 0}
                                                    onChange={handleSelectAll}
                                                />
                                            </th>
                                            <th>SUPPLIER NAME</th>
                                            <th style={{ whiteSpace: 'nowrap', minWidth: '110px' }}>CODE</th>
                                            <th style={{ whiteSpace: 'nowrap', minWidth: '130px' }}>PHONE</th>
                                            <th style={{ whiteSpace: 'nowrap', minWidth: '140px' }}>CITY / LOCATION</th>
                                            <th style={{ whiteSpace: 'nowrap', minWidth: '140px' }}>CREATED ON</th>
                                            <th style={{ whiteSpace: 'nowrap', minWidth: '100px' }}>STATUS</th>
                                            <th style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedItems.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" style={{ textAlign: 'center', padding: '60px 20px', border: 'none' }}>
                                                    <div style={{ padding: '20px', textAlign: 'center' }}>
                                                        <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', margin: '0 auto 16px auto', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.12)' }}>
                                                            <FontAwesomeIcon icon={faTruck} />
                                                        </div>
                                                        <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                                                            No suppliers found
                                                        </h3>
                                                        <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '420px', margin: '0 auto 22px auto', lineHeight: '1.55' }}>
                                                            {searchTerm || statusFilter !== "all" || cityFilter !== "all"
                                                                ? 'No suppliers match your search criteria. Try resetting filters.'
                                                                : 'Create supplier and vendor records to manage procurement, invoices, and supplier payments.'}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Link
                                    to="/app/suppliers/create"
                                    className="brand-btn-pill brand-btn-primary"
                                >
                                    <FontAwesomeIcon icon={faPlus} /> Create Supplier
                                </Link>
                            </div>
                        </div>
                    </td>
                </tr>
            ) : (
                paginatedItems.map((item) => {
                    const isSelected = selectedRows.includes(item.id);
                    return (
                        <tr key={item.id} style={{ background: isSelected ? '#F0FDF4' : 'transparent' }}>
                            <td>
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={isSelected}
                                    onChange={() => handleSelectRow(item.id)}
                                />
                            </td>
                            <td>
                                <div className="d-flex align-items-center gap-3">
                                    <div
                                        style={{
                                            width: '38px',
                                            height: '38px',
                                            borderRadius: '12px',
                                            background: '#F3E8FF',
                                            color: '#7E22CE',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '16px',
                                            flexShrink: 0
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faTruck} />
                                    </div>
                                    <span style={{ fontWeight: '700', fontSize: '15px', color: '#0F172A' }}>
                                        {item.name}
                                    </span>
                                </div>
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                                <span className="unit-short-badge" style={{ whiteSpace: 'nowrap' }}>{item.code}</span>
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                                <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                                    {item.phone}
                                </span>
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                                <span className="unit-base-badge" style={{ whiteSpace: 'nowrap' }}>{item.location}</span>
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A' }}>{item.date}</div>
                                <div style={{ fontSize: '11px', color: '#64748B' }}>{item.time}</div>
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                                <span className="var-status-badge active" style={{ whiteSpace: 'nowrap' }}>
                                    ● Active
                                </span>
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                                <div className="brand-card-actions" style={{ justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        className="brand-action-btn"
                                        title="View Details"
                                        onClick={() => goToEditProduct(item)}
                                    >
                                        <FontAwesomeIcon icon={faEye} />
                                    </button>
                                    <button
                                        type="button"
                                        className="brand-action-btn edit"
                                        title="Edit Supplier"
                                        onClick={() => goToEditProduct(item)}
                                    >
                                        <FontAwesomeIcon icon={faEdit} />
                                    </button>
                                    <button
                                        type="button"
                                        className="brand-action-btn delete"
                                        title="Delete Supplier"
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

                        {/* 6. Dynamic Working Pagination (Exact Match to Units page) */}
                        <div className="var-pagination">
                            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
                                Showing {filteredItems.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, filteredItems.length)} of {filteredItems.length} suppliers
                            </div>

                            <div className="d-flex align-items-center gap-3">
                                <div className="var-pagination-pages">
                                    <button
                                        type="button"
                                        className="var-page-btn"
                                        disabled={currentPage <= 1}
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    >
                                        &lt;
                                    </button>

                                    {[...Array(totalPages)].map((_, pIdx) => {
                                        const pageNum = pIdx + 1;
                                        if (totalPages > 6 && Math.abs(pageNum - currentPage) > 2 && pageNum !== 1 && pageNum !== totalPages) {
                                            return null;
                                        }
                                        return (
                                            <button
                                                key={pageNum}
                                                type="button"
                                                className={`var-page-btn ${pageNum === currentPage ? 'active' : ''}`}
                                                onClick={() => setCurrentPage(pageNum)}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}

                                    <button
                                        type="button"
                                        className="var-page-btn"
                                        disabled={currentPage >= totalPages}
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    >
                                        &gt;
                                    </button>
                                </div>

                                <select
                                    className="var-select-sm"
                                    style={{ height: '36px', padding: '0 12px', fontSize: '12px' }}
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value={10}>10 / page</option>
                                    <option value={25}>25 / page</option>
                                    <option value={50}>50 / page</option>
                                </select>
                            </div>
                        </div>

                    </div>

                </div>
            )}

            {/* Modals */}
            <DeleteSupplier onClickDeleteModel={onClickDeleteModel} deleteModel={deleteModel} onDelete={isDelete} />
            {importSuppliers && <ImportSuppliersModel handleClose={handleClose} show={importSuppliers} />}
        </MasterLayout>
    );
};

const mapStateToProps = ( state ) => {
    const { suppliers, totalRecord, allConfigData } = state;
    return { suppliers, totalRecord, allConfigData };
};

export default connect( mapStateToProps, { fetchSuppliers } )( Suppliers );
