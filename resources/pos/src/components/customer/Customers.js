import React, { useState, useEffect, useMemo } from "react";
import { connect } from "react-redux";
import moment from "moment";
import { useNavigate, Link } from "react-router-dom";
import MasterLayout from "../MasterLayout";
import { fetchCustomers } from "../../store/action/customerAction";
import DeleteCustomer from "./DeleteCustomer";
import TabTitle from "../../shared/tab-title/TabTitle";
import {
    getFormattedDate,
    placeholderText,
} from "../../shared/sharedMethod";
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";
import ImportCustomersModel from "./ImportCustomersModel";
import useSmartLoading from "../../shared/hooks/useSmartLoading";
import MasterTableSkeleton from "../../shared/components/skeletons/MasterTableSkeleton";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUsers,
    faUserCheck,
    faEnvelope,
    faMapMarkerAlt,
    faSearch,
    faPlus,
    faDownload,
    faEye,
    faEdit,
    faTrash,
    faList,
    faThLarge,
    faPhone,
} from '@fortawesome/free-solid-svg-icons';
import "../brands/ProductBrandsPremium.css";
import "../units/ProductUnitsPremium.css";
import "../variation/ProductVariationsPremium.css";
import "./CustomersPremium.css";
import LiveCounter from "../../shared/components/LiveCounter";
import LiveSparkline from "../../shared/components/LiveSparkline";
import { subscribePosDataChanged } from "../../shared/posEvents";

const Customers = (props) => {
    const { fetchCustomers, customers, allConfigData } = props;
    const isLoading = useSmartLoading(customers);
    const [deleteModel, setDeleteModel] = useState(false);
    const [isDelete, setIsDelete] = useState(null);
    const [importCustomers, setImportCustomers] = useState(false);
    
    // Filter & View State
    const [searchQuery, setSearchQuery] = useState("");
    const [groupFilter, setGroupFilter] = useState("all");
    const [cityFilter, setCityFilter] = useState("all");
    const [sortBy, setSortBy] = useState("newest");
    const [viewMode, setViewMode] = useState("list");
    const [selectedCustomerIds, setSelectedCustomerIds] = useState([]);
    const [drawerCustomer, setDrawerCustomer] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const navigate = useNavigate();

    // ── Fetch Real Data from API ─────────────────────────────────────────────
    useEffect(() => {
        const hasData = Array.isArray(customers) && customers.length > 0;
        fetchCustomers({ page: 1, pageSize: 50 }, !hasData);

        // Event-driven real-time sync
        const unsubscribe = subscribePosDataChanged(() => {
            fetchCustomers({ page: 1, pageSize: 50 }, false);
        });

        return () => unsubscribe();
    }, []);

    const handleCloseImport = () => {
        setImportCustomers(!importCustomers);
    };

    const onClickDeleteModel = (id = null) => {
        setDeleteModel(!deleteModel);
        setIsDelete(id);
    };

    const goToEditProduct = (id) => {
        navigate(`/app/customers/edit/${id}`);
    };

    const handleReset = () => {
        setSearchQuery("");
        setGroupFilter("all");
        setCityFilter("all");
        setSortBy("newest");
        setSelectedCustomerIds([]);
        setCurrentPage(1);
    };

    // Customer items formatting
    const customerList = useMemo(() => {
        if (!customers || !Array.isArray(customers)) return [];
        return customers.map((c) => {
            const attr = c.attributes || c;
            const name = attr.name || "Customer";
            const email = attr.email || "walkin@pos.com";
            const phone = attr.phone || "9999999999";
            const city = attr.city || "";
            const country = attr.country || "";
            const location = [city, country].filter(Boolean).join(", ") || "Store Location, India";
            const code = `CUS-${String(c.id).padStart(5, '0')}`;
            const date = getFormattedDate(attr.created_at, allConfigData) || "2026-08-28";
            const time = attr.created_at ? moment(attr.created_at).format('LT') : '';

            return {
                id: c.id,
                name: name,
                email: email,
                phone: phone,
                city: city || "Other",
                country: country || "India",
                location: location,
                code: code,
                date: date,
                time: time,
                created_at: attr.created_at,
                rawItem: c
            };
        });
    }, [customers, allConfigData]);

    // Unique cities list
    const citiesList = useMemo(() => {
        const set = new Set(customerList.map(c => c.city).filter(Boolean));
        return Array.from(set);
    }, [customerList]);

    // Filter customers locally by search and category
    const filteredCustomers = useMemo(() => {
        let result = customerList.filter((customer) => {
            const q = searchQuery.toLowerCase().trim();
            const matchesSearch = !q || 
                customer.name.toLowerCase().includes(q) ||
                customer.phone.toLowerCase().includes(q) ||
                customer.email.toLowerCase().includes(q) ||
                customer.location.toLowerCase().includes(q) ||
                customer.code.toLowerCase().includes(q);

            if (!matchesSearch) return false;

            if (groupFilter === "walkin") {
                if (!customer.name.toLowerCase().includes("walk-in")) return false;
            } else if (groupFilter === "retail") {
                if (customer.name.toLowerCase().includes("walk-in")) return false;
            }

            if (cityFilter !== "all" && customer.city !== cityFilter) {
                return false;
            }

            return true;
        });

        if (sortBy === "name_asc") {
            result.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortBy === "name_desc") {
            result.sort((a, b) => b.name.localeCompare(a.name));
        } else if (sortBy === "oldest") {
            result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        } else {
            // newest
            result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }

        return result;
    }, [customerList, searchQuery, groupFilter, cityFilter, sortBy]);

    // Pagination calculations
    const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
    const paginatedCustomers = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredCustomers.slice(start, start + pageSize);
    }, [filteredCustomers, currentPage, pageSize]);

    // Dynamic Real-time Calculations for Top KPI Cards
    const realTotal = customerList.length;
    const realActiveCount = customerList.length;
    const realEmailCount = customerList.filter(c => c.email && c.email !== "N/A").length;
    const realCities = citiesList.length;

    // Checkbox bulk selection
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedCustomerIds(filteredCustomers.map(c => c.id));
        } else {
            setSelectedCustomerIds([]);
        }
    };

    const handleSelectOne = (id) => {
        if (selectedCustomerIds.includes(id)) {
            setSelectedCustomerIds(selectedCustomerIds.filter(i => i !== id));
        } else {
            setSelectedCustomerIds([...selectedCustomerIds, id]);
        }
    };

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title={placeholderText("customers.title") || "Customers"} />

            {isLoading ? (
                <MasterTableSkeleton />
            ) : (
                <div className="brand-page-container">

                    {/* ── 1. Breadcrumb (Exact Match to Units page) ───────────── */}
                    <div className="brand-breadcrumb">
                        <span>Dashboard</span>
                        <span>&gt;</span>
                        <span>Peoples</span>
                        <span>&gt;</span>
                        <span className="brand-crumb-active">Customers</span>
                    </div>

                    {/* ── 2. Header Row (Exact Match to Units page) ───────────── */}
                    <div className="brand-header">
                        <div className="brand-title-group">
                            <h1>
                                Customers
                            </h1>
                            <p>
                                Manage all your customers, loyalty members and walk-in customers.
                            </p>
                        </div>

                        <div className="brand-header-actions">
                            <button type="button" className="brand-btn-pill" onClick={handleCloseImport}>
                                <FontAwesomeIcon icon={faDownload} /> Import Customers
                            </button>

                            <Link
                                to="/app/customers/create"
                                className="brand-btn-pill brand-btn-primary"
                            >
                                <FontAwesomeIcon icon={faPlus} /> Create Customer
                            </Link>
                        </div>
                    </div>

                    {/* ── 3. 4 Top KPI Cards Grid (Exact Match to Units page) ─── */}
                    <div className="brand-kpi-grid">
                        {/* Card 1: Total Customers */}
                        <div className="brand-kpi-card">
                            <div className="brand-kpi-top">
                                <span className="brand-kpi-label">Total Customers</span>
                                <div className="brand-kpi-icon green">
                                    <FontAwesomeIcon icon={faUsers} />
                                </div>
                            </div>
                            <div className="brand-kpi-value">
                                <LiveCounter value={realTotal} isCurrency={false} />
                            </div>
                            <div className="brand-kpi-bottom">
                                <span className="brand-kpi-badge up">
                                    {realTotal > 0 ? 'Real Database Data' : '0 Customers'}
                                </span>
                                <LiveSparkline color="#16A34A" width={60} height={24} />
                            </div>
                        </div>

                        {/* Card 2: Active Customers */}
                        <div className="brand-kpi-card">
                            <div className="brand-kpi-top">
                                <span className="brand-kpi-label">Active Customers</span>
                                <div className="brand-kpi-icon blue">
                                    <FontAwesomeIcon icon={faUserCheck} />
                                </div>
                            </div>
                            <div className="brand-kpi-value">
                                <LiveCounter value={realActiveCount} isCurrency={false} />
                            </div>
                            <div className="brand-kpi-bottom">
                                <span className="brand-kpi-badge up">
                                    {realActiveCount > 0 ? 'Active Status' : '0 Active'}
                                </span>
                                <LiveSparkline color="#2563EB" width={60} height={24} />
                            </div>
                        </div>

                        {/* Card 3: Email Registered */}
                        <div className="brand-kpi-card">
                            <div className="brand-kpi-top">
                                <span className="brand-kpi-label">Email Registered</span>
                                <div className="brand-kpi-icon purple">
                                    <FontAwesomeIcon icon={faEnvelope} />
                                </div>
                            </div>
                            <div className="brand-kpi-value">
                                <LiveCounter value={realEmailCount} isCurrency={false} />
                            </div>
                            <div className="brand-kpi-bottom">
                                <span className="brand-kpi-label" style={{ fontSize: '13px', color: '#64748B', fontWeight: '700' }}>
                                    Valid Contacts
                                </span>
                                <LiveSparkline color="#9333EA" width={60} height={24} />
                            </div>
                        </div>

                        {/* Card 4: Cities Covered */}
                        <div className="brand-kpi-card">
                            <div className="brand-kpi-top">
                                <span className="brand-kpi-label">Cities Covered</span>
                                <div className="brand-kpi-icon orange">
                                    <FontAwesomeIcon icon={faMapMarkerAlt} />
                                </div>
                            </div>
                            <div className="brand-kpi-value">
                                <LiveCounter value={realCities} isCurrency={false} />
                            </div>
                            <div className="brand-kpi-bottom">
                                <span className="brand-kpi-badge neutral">
                                    {realCities > 0 ? `${realCities} Locations` : 'Locations Reached'}
                                </span>
                                <LiveSparkline color="#D97706" width={60} height={24} />
                            </div>
                        </div>
                    </div>

                    {/* ── 4. Master Floating Workspace (Exact Match to Units page) ─ */}
                    <div className="var-workspace">

                        {/* Search & Filter Bar (Exact Match to Units page) */}
                        <div className="brand-filter-bar">
                            <div className="brand-search-box">
                                <FontAwesomeIcon icon={faSearch} className="brand-search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search customers..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>

                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                <select
                                    className="var-select-sm"
                                    value={groupFilter}
                                    onChange={(e) => {
                                        setGroupFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value="all">Group: All</option>
                                    <option value="walkin">Walk-in Customers</option>
                                    <option value="retail">Retail Customers</option>
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

                                <button type="button" className="cat-btn-filter" onClick={handleReset}>
                                    Reset
                                </button>
                            </div>
                        </div>

                        {/* 5. View Content: Table or Grid */}
                        {filteredCustomers.length === 0 ? (
                            <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #EEF2F7', padding: '60px 24px', textAlign: 'center', width: '100%' }}>
                                <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', margin: '0 auto 16px auto', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.12)' }}>
                                    <FontAwesomeIcon icon={faUsers} />
                                </div>
                                <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                                    No customers found
                                </h3>
                                <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '440px', margin: '0 auto 22px auto', lineHeight: '1.55' }}>
                                    {searchQuery || groupFilter !== 'all' || cityFilter !== 'all'
                                        ? 'No customer records match your search criteria. Try resetting filters.'
                                        : 'Create customer records to track customer loyalty, sales history, and POS billing.'}
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                    <button
                                        type="button"
                                        className="brand-btn-pill brand-btn-primary"
                                        onClick={() => navigate('/app/customers/create')}
                                    >
                                        <FontAwesomeIcon icon={faPlus} /> Create Customer
                                    </button>
                                </div>
                            </div>
                        ) : viewMode === 'list' ? (
                            /* LIST VIEW TABLE (Exact Units & Suppliers Structure) */
                            <div className="var-table-wrap">
                                <table className="var-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '40px' }}>
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    checked={selectedCustomerIds.length > 0 && selectedCustomerIds.length === filteredCustomers.length}
                                                    onChange={handleSelectAll}
                                                />
                                            </th>
                                            <th>CUSTOMER NAME</th>
                                            <th style={{ whiteSpace: 'nowrap' }}>CODE</th>
                                            <th style={{ whiteSpace: 'nowrap' }}>PHONE</th>
                                            <th style={{ whiteSpace: 'nowrap' }}>CITY / LOCATION</th>
                                            <th style={{ whiteSpace: 'nowrap' }}>CREATED ON</th>
                                            <th style={{ whiteSpace: 'nowrap' }}>STATUS</th>
                                            <th style={{ textAlign: 'right', whiteSpace: 'nowrap', paddingRight: '20px' }}>ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedCustomers.map((customer) => {
                                            const isSelected = selectedCustomerIds.includes(customer.id);
                                            return (
                                                <tr key={customer.id} style={{ background: isSelected ? '#F0FDF4' : 'transparent' }}>
                                                    <td>
                                                        <input
                                                            type="checkbox"
                                                            className="form-check-input"
                                                            checked={isSelected}
                                                            onChange={() => handleSelectOne(customer.id)}
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
                                                                <FontAwesomeIcon icon={faUsers} />
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: '700', fontSize: '14.5px', color: '#0F172A', whiteSpace: 'nowrap' }}>
                                                                    {customer.name}
                                                                </div>
                                                                <div style={{ fontSize: '11.5px', color: '#64748B', whiteSpace: 'nowrap' }}>
                                                                    {customer.email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ whiteSpace: 'nowrap' }}>
                                                        <span className="unit-short-badge" style={{ whiteSpace: 'nowrap' }}>{customer.code}</span>
                                                    </td>
                                                    <td style={{ whiteSpace: 'nowrap' }}>
                                                        <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#0F172A', whiteSpace: 'nowrap' }}>
                                                            {customer.phone}
                                                        </span>
                                                    </td>
                                                    <td style={{ whiteSpace: 'nowrap' }}>
                                                        <span className="unit-base-badge" style={{ whiteSpace: 'nowrap' }}>{customer.location}</span>
                                                    </td>
                                                    <td style={{ whiteSpace: 'nowrap' }}>
                                                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A', whiteSpace: 'nowrap' }}>{customer.date}</div>
                                                        {customer.time && <div style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap' }}>{customer.time}</div>}
                                                    </td>
                                                    <td style={{ whiteSpace: 'nowrap' }}>
                                                        <span className="var-status-badge active" style={{ whiteSpace: 'nowrap' }}>
                                                            ● Active
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap', paddingRight: '20px' }}>
                                                        <div className="brand-card-actions" style={{ justifyContent: 'flex-end', whiteSpace: 'nowrap' }}>
                                                            <button
                                                                type="button"
                                                                className="brand-action-btn"
                                                                title="View Details"
                                                                onClick={() => setDrawerCustomer(customer.rawItem)}
                                                            >
                                                                <FontAwesomeIcon icon={faEye} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="brand-action-btn edit"
                                                                title="Edit Customer"
                                                                onClick={() => goToEditProduct(customer.id)}
                                                            >
                                                                <FontAwesomeIcon icon={faEdit} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="brand-action-btn delete"
                                                                title="Delete"
                                                                onClick={() => onClickDeleteModel(customer.id)}
                                                            >
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
                                {paginatedCustomers.map((customer) => (
                                    <div key={customer.id} className="brand-card-item">
                                        <div
                                            className="brand-logo-container"
                                            style={{
                                                background: "#F3E8FF",
                                                color: "#7E22CE",
                                                fontSize: "20px"
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faUsers} />
                                        </div>
                                        <div className="brand-card-title">{customer.name}</div>
                                        <div className="d-flex align-items-center justify-content-center gap-2 my-2">
                                            <span className="unit-short-badge" style={{ whiteSpace: 'nowrap' }}>{customer.code}</span>
                                            <span className="unit-base-badge" style={{ whiteSpace: 'nowrap' }}>{customer.location}</span>
                                        </div>
                                        <div className="brand-card-stats">
                                            <div className="brand-stat-item">
                                                <div className="brand-stat-val" style={{ fontSize: '12px' }}>{customer.phone}</div>
                                                <div className="brand-stat-lbl">Mobile</div>
                                            </div>
                                            <div style={{ width: '1px', height: '24px', background: '#F1F5F9' }} />
                                            <div className="brand-stat-item">
                                                <div className="brand-stat-val" style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>{customer.email}</div>
                                                <div className="brand-stat-lbl">Email</div>
                                            </div>
                                        </div>
                                        <div className="brand-card-actions">
                                            <button
                                                type="button"
                                                className="brand-action-btn"
                                                title="View Details"
                                                onClick={() => setDrawerCustomer(customer.rawItem)}
                                            >
                                                <FontAwesomeIcon icon={faEye} />
                                            </button>
                                            <button
                                                type="button"
                                                className="brand-action-btn edit"
                                                title="Edit Customer"
                                                onClick={() => goToEditProduct(customer.id)}
                                            >
                                                <FontAwesomeIcon icon={faEdit} />
                                            </button>
                                            <button
                                                type="button"
                                                className="brand-action-btn delete"
                                                title="Delete"
                                                onClick={() => onClickDeleteModel(customer.id)}
                                            >
                                                <FontAwesomeIcon icon={faTrash} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 6. Dynamic Working Pagination (Exact Match to Units page) */}
                        <div className="var-pagination">
                            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
                                Showing {filteredCustomers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, filteredCustomers.length)} of {filteredCustomers.length} customers
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

            {/* ── RIGHT SIDE REAL-TIME CUSTOMER DETAILS DRAWER ── */}
            {drawerCustomer && (
                <>
                    <div className="crm-drawer-backdrop" onClick={() => setDrawerCustomer(null)} />
                    <div className="crm-drawer">
                        <div className="crm-drawer-hdr">
                            <div className="d-flex align-items-center gap-3">
                                <div className="crm-avatar-circle" style={{ width: "44px", height: "44px", fontSize: "16px", background: "#F3E8FF", color: "#7E22CE" }}>
                                    <FontAwesomeIcon icon={faUsers} />
                                </div>
                                <div>
                                    <div className="d-flex align-items-center gap-2">
                                        <h5 className="fw-extrabold text-dark m-0">{drawerCustomer.attributes?.name || drawerCustomer.name}</h5>
                                        <span className="badge bg-success-subtle text-success border border-success fs-micro">Active</span>
                                    </div>
                                    <span className="crm-cus-code">CUS-{String(drawerCustomer.id).padStart(5, '0')}</span>
                                </div>
                            </div>
                            <button type="button" className="btn-close" onClick={() => setDrawerCustomer(null)} />
                        </div>

                        <div className="crm-drawer-body">
                            {/* Real Contact Info */}
                            <div className="p-3 bg-light rounded-3 mb-4 d-flex flex-column gap-2 fs-small">
                                <div className="d-flex align-items-center justify-content-between">
                                    <span className="text-muted"><FontAwesomeIcon icon={faPhone} className="me-2 text-success" />{drawerCustomer.attributes?.phone || drawerCustomer.phone || "N/A"}</span>
                                </div>
                                <div className="d-flex align-items-center justify-content-between border-top pt-2">
                                    <span className="text-muted"><FontAwesomeIcon icon={faEnvelope} className="me-2 text-primary" />{drawerCustomer.attributes?.email || drawerCustomer.email || "N/A"}</span>
                                </div>
                                <div className="d-flex align-items-center justify-content-between border-top pt-2">
                                    <span className="text-muted"><FontAwesomeIcon icon={faMapMarkerAlt} className="me-2 text-danger" />{drawerCustomer.attributes?.city || drawerCustomer.city || "N/A"}, {drawerCustomer.attributes?.country || drawerCustomer.country || "N/A"}</span>
                                </div>
                            </div>

                            {/* Real Attributes List */}
                            <h6 className="fw-bold text-dark fs-small mb-2">Customer Details</h6>
                            <div className="crm-drawer-item">
                                <span className="text-muted">Full Address</span>
                                <span className="fw-bold text-dark">{drawerCustomer.attributes?.address || drawerCustomer.address || "N/A"}</span>
                            </div>
                            <div className="crm-drawer-item">
                                <span className="text-muted">City</span>
                                <span className="fw-bold text-dark">{drawerCustomer.attributes?.city || drawerCustomer.city || "N/A"}</span>
                            </div>
                            <div className="crm-drawer-item">
                                <span className="text-muted">Country</span>
                                <span className="fw-bold text-dark">{drawerCustomer.attributes?.country || drawerCustomer.country || "N/A"}</span>
                            </div>
                            <div className="crm-drawer-item">
                                <span className="text-muted">Customer Since</span>
                                <span className="fw-bold text-dark">{getFormattedDate(drawerCustomer.attributes?.created_at || drawerCustomer.created_at, allConfigData)}</span>
                            </div>

                            <button type="button" className="brand-btn-pill brand-btn-primary w-100 mt-4 text-white text-center justify-content-center" onClick={() => goToEditProduct(drawerCustomer.id)}>
                                Edit Customer
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Delete Customer Modal */}
            <DeleteCustomer
                onClickDeleteModel={onClickDeleteModel}
                deleteModel={deleteModel}
                onDelete={isDelete}
            />

            {/* Import Customers Modal */}
            {importCustomers && (
                <ImportCustomersModel
                    handleClose={handleCloseImport}
                    show={importCustomers}
                />
            )}
        </MasterLayout>
    );
};

const mapStateToProps = (state) => {
    const { customers, totalRecord, allConfigData } = state;
    return { customers, totalRecord, allConfigData };
};

export default connect(mapStateToProps, { fetchCustomers })(Customers);
