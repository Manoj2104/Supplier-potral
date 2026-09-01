import React, { useState, useEffect, useMemo } from "react";
import { connect } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import MasterLayout from "../MasterLayout";
import { fetchRoles, deleteRole } from "../../store/action/roleAction";
import { fetchPermissions } from "../../store/action/permissionAction";
import { fetchUsers } from "../../store/action/userAction";
import DeleteRole from "./DeleteRole";
import TabTitle from "../../shared/tab-title/TabTitle";
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";
import {
    getFormattedDate,
    placeholderText,
} from "../../shared/sharedMethod";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faShieldAlt, faPlus,
    faCrown, faUserShield, faBriefcase, faCashRegister, faShoppingBag,
    faWarehouse, faShoppingCart, faCalculator, faUsers, faKey,
    faCheckCircle, faTimes, faEye, faEdit,
    faTrash, faSearch, faThLarge, faList,
} from "@fortawesome/free-solid-svg-icons";
import moment from "moment";
import "../brands/ProductBrandsPremium.css";
import "../units/ProductUnitsPremium.css";
import "../variation/ProductVariationsPremium.css";
import LiveCounter from "../../shared/components/LiveCounter";
import LiveSparkline from "../../shared/components/LiveSparkline";
import "./RolesDashboard.css";

// Helper to select icon & background gradient based on role name
const getRoleVisuals = (name = "") => {
    const n = name.toLowerCase();
    if (n.includes("admin") || n.includes("super")) {
        return {
            icon: faCrown,
            bg: "linear-gradient(135deg, #16A34A 0%, #15803D 100%)",
            color: "#16A34A",
            type: "System Role",
            desc: "Full system access with all permissions and administrative controls"
        };
    } else if (n.includes("cashier") || n.includes("pos")) {
        return {
            icon: faCashRegister,
            bg: "linear-gradient(135deg, #F97316 0%, #C2410C 100%)",
            color: "#EA580C",
            type: "System Role",
            desc: "Create bills, process sales transactions, cash drop and customer checkout"
        };
    } else if (n.includes("manager") || n.includes("supervisor")) {
        return {
            icon: faBriefcase,
            bg: "linear-gradient(135deg, #A855F7 0%, #7E22CE 100%)",
            color: "#9333EA",
            type: "Custom Role",
            desc: "Manage operations, reports, stock adjustments and staff approvals"
        };
    } else if (n.includes("sale") || n.includes("exec")) {
        return {
            icon: faShoppingBag,
            bg: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
            color: "#2563EB",
            type: "Custom Role",
            desc: "Manage customers, quotations, sales activities and order creation"
        };
    } else if (n.includes("store") || n.includes("warehouse") || n.includes("stock")) {
        return {
            icon: faWarehouse,
            bg: "linear-gradient(135deg, #0EA5E9 0%, #0369A1 100%)",
            color: "#0284C7",
            type: "Custom Role",
            desc: "Manage stock levels, inventory transfers, adjustments and warehouse"
        };
    } else if (n.includes("purchase") || n.includes("vendor") || n.includes("supplier")) {
        return {
            icon: faShoppingCart,
            bg: "linear-gradient(135deg, #F59E0B 0%, #B45309 100%)",
            color: "#D97706",
            type: "Custom Role",
            desc: "Manage purchase orders, suppliers, purchase returns and inventory bulk"
        };
    } else if (n.includes("account") || n.includes("finance")) {
        return {
            icon: faCalculator,
            bg: "linear-gradient(135deg, #10B981 0%, #047857 100%)",
            color: "#059669",
            type: "Custom Role",
            desc: "Manage financial accounts, expenses, payments, profit-loss reports"
        };
    }

    return {
        icon: faUserShield,
        bg: "linear-gradient(135deg, #64748B 0%, #334155 100%)",
        color: "#475569",
        type: "Custom Role",
        desc: `Manage custom permissions and access controls for ${name}`
    };
};

const Role = (props) => {
    const {
        roles = [],
        permissions = [],
        users = [],
        fetchRoles,
        fetchPermissions,
        fetchUsers,
        totalRecord = 0,
        isLoading,
        allConfigData
    } = props;

    const navigate = useNavigate();

    const [deleteModel, setDeleteModel] = useState(false);
    const [isDelete, setIsDelete] = useState(null);
    const [viewMode, setViewMode] = useState("list"); // 'list' or 'grid'
    const [searchQuery, setSearchQuery] = useState("");
    const [roleTypeFilter, setRoleTypeFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortBy, setSortBy] = useState("newest");
    const [selectedRole, setSelectedRole] = useState(null);
    const [drawerTab, setDrawerTab] = useState("overview");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [selected, setSelected] = useState([]);

    useEffect(() => {
        fetchRoles({}, true);
        if (fetchPermissions) fetchPermissions();
        if (fetchUsers) fetchUsers();
    }, []);

    // ─── Real-Time KPI Calculations ──────────────────────────────────────────
    const realTotalRoles = roles.length;
    const realActiveRoles = roles.filter(r => r.attributes?.status !== false).length;

    const realSystemRoles = roles.filter(r => {
        const name = (r.attributes?.name || "").toLowerCase();
        return name === "admin" || name === "cashier" || name === "super admin";
    }).length;
    const realCustomRoles = Math.max(0, realTotalRoles - realSystemRoles);
    const realAssignedUsers = users ? users.length : 0;

    const totalSpark = realTotalRoles > 0 ? [Math.max(0, realTotalRoles - 1), realTotalRoles] : [0, 0];
    const activeSpark = realActiveRoles > 0 ? [Math.max(0, realActiveRoles - 1), realActiveRoles] : [0, 0];
    const customSpark = realCustomRoles > 0 ? [Math.max(0, realCustomRoles - 1), realCustomRoles] : [0, 0];
    const userSpark = realAssignedUsers > 0 ? [Math.max(0, realAssignedUsers - 1), realAssignedUsers] : [0, 0];

    // ─── Real Data Processing for Each Role ──────────────────────────────────
    const processedRoles = useMemo(() => {
        return roles.map((r) => {
            const rawName = r.attributes?.name || "Role";
            const visuals = getRoleVisuals(rawName);
            const permissionsCount = r.attributes?.permissions?.length || (Array.isArray(r.permissions) ? r.permissions.length : 0);

            // Compute actual users assigned to this role
            const assignedUsers = (users || []).filter((u) => {
                const userRole = u.attributes?.role_names || u.role_names || (Array.isArray(u.attributes?.role) ? u.attributes.role.map(x => x.name) : []);
                return Array.isArray(userRole) && userRole.includes(rawName);
            });

            return {
                id: r.id,
                name: rawName,
                displayName: r.attributes?.display_name || rawName,
                description: r.attributes?.description || visuals.desc,
                permissionsCount,
                permissions: r.attributes?.permissions || r.permissions || [],
                usersCount: assignedUsers.length,
                assignedUsersList: assignedUsers,
                type: visuals.type,
                icon: visuals.icon,
                bg: visuals.bg,
                color: visuals.color,
                status: r.attributes?.status !== false ? "Active" : "Inactive",
                createdDate: getFormattedDate(r.attributes?.created_at, allConfigData),
                createdTime: r.attributes?.created_at ? moment(r.attributes.created_at).format("hh:mm A") : "",
                rawCreated: r.attributes?.created_at
            };
        });
    }, [roles, users, allConfigData]);

    // ─── Filter & Search Logic ────────────────────────────────────────────────
    const filteredRoles = useMemo(() => {
        return processedRoles.filter((r) => {
            const query = searchQuery.toLowerCase().trim();
            const matchesSearch =
                !query ||
                r.name.toLowerCase().includes(query) ||
                r.displayName.toLowerCase().includes(query) ||
                r.description.toLowerCase().includes(query) ||
                r.id.toString().includes(query);

            const matchesType =
                roleTypeFilter === "all" ||
                (roleTypeFilter === "system" && r.type === "System Role") ||
                (roleTypeFilter === "custom" && r.type === "Custom Role");

            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "active" && r.status === "Active") ||
                (statusFilter === "inactive" && r.status === "Inactive");

            return matchesSearch && matchesType && matchesStatus;
        }).sort((a, b) => {
            if (sortBy === "newest") return moment(b.rawCreated).valueOf() - moment(a.rawCreated).valueOf();
            if (sortBy === "oldest") return moment(a.rawCreated).valueOf() - moment(b.rawCreated).valueOf();
            if (sortBy === "name") return a.name.localeCompare(b.name);
            return 0;
        });
    }, [processedRoles, searchQuery, roleTypeFilter, statusFilter, sortBy]);

    // Pagination slice
    const totalPages = Math.max(1, Math.ceil(filteredRoles.length / perPage));
    const paginatedRoles = filteredRoles.slice((page - 1) * perPage, page * perPage);

    const pageNums = (() => {
        const max = Math.min(5, totalPages);
        let start = Math.max(1, page - 2);
        if (start + max - 1 > totalPages) start = Math.max(1, totalPages - max + 1);
        return Array.from({ length: max }, (_, i) => start + i);
    })();

    const toggleSel = id => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
    const toggleSelectAll = () => setSelected(s => (s.length > 0 && s.length === filteredRoles.length) ? [] : filteredRoles.map(u => u.id));
    const toggleAll = toggleSelectAll;

    const clearFilters = () => {
        setSearchQuery("");
        setRoleTypeFilter("all");
        setStatusFilter("all");
        setSortBy("newest");
        setSelected([]);
        setPage(1);
    };

    const onClickDeleteModel = (role) => {
        setDeleteModel(true);
        setIsDelete(role);
    };

    const handleClose = () => {
        setDeleteModel(false);
        setIsDelete(null);
    };

    const handleSelectRole = (role) => {
        setSelectedRole(role);
        setDrawerTab("overview");
    };

    const goToEdit = (role) => {
        navigate(`/app/roles/edit/${role.id}`);
    };

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title={placeholderText('roles.permissions.title') || "Roles & Permissions"} />

            <div className="var-page-container">

                {/* ── 1. Breadcrumb (Exact Match to Units page) ─── */}
                <div className="var-breadcrumb">
                    <span>Dashboard</span>
                    <span>&gt;</span>
                    <span className="var-crumb-active">Roles & Permissions</span>
                </div>

                {/* ── 2. Top Header Section (Exact Match to Units page) ─── */}
                <div className="var-header">
                    <div className="var-title-group">
                        <h1>Roles & Permissions</h1>
                        <p>Manage system user roles, access control matrices, and module permissions.</p>
                    </div>
                    <div className="var-header-actions">
                        <Link
                            to="/app/roles/create"
                            className="var-btn-pill var-btn-primary"
                            style={{ textDecoration: "none" }}
                        >
                            <FontAwesomeIcon icon={faPlus} /> Create Role
                        </Link>
                    </div>
                </div>

                {/* ── 3. 4 Real KPI Summary Cards Grid (Exact Match to Units page) ─── */}
                <div className="var-kpi-grid">
                    {/* Card 1: Total Roles */}
                    <div className="var-kpi-card">
                        <div className="var-kpi-top">
                            <span className="var-kpi-label">Total Roles</span>
                            <div className="var-kpi-icon green">
                                <FontAwesomeIcon icon={faShieldAlt} />
                            </div>
                        </div>
                        <div className="var-kpi-value">
                            <LiveCounter value={realTotalRoles} isCurrency={false} />
                        </div>
                        <div className="var-kpi-bottom">
                            <span className={`var-kpi-badge ${realTotalRoles > 0 ? 'up' : 'neutral'}`}>
                                {realTotalRoles > 0 ? 'Real Database Data' : '0 Roles'}
                            </span>
                            <LiveSparkline data={totalSpark} color="#16A34A" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 2: Active Roles */}
                    <div className="var-kpi-card">
                        <div className="var-kpi-top">
                            <span className="var-kpi-label">Active Roles</span>
                            <div className="var-kpi-icon blue">
                                <FontAwesomeIcon icon={faCheckCircle} />
                            </div>
                        </div>
                        <div className="var-kpi-value">
                            <LiveCounter value={realActiveRoles} isCurrency={false} />
                        </div>
                        <div className="var-kpi-bottom">
                            <span className={`var-kpi-badge ${realActiveRoles > 0 ? 'up' : 'neutral'}`}>
                                {realActiveRoles > 0 ? 'Active Status' : '0 Active'}
                            </span>
                            <LiveSparkline data={activeSpark} color="#2563EB" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 3: Custom Roles */}
                    <div className="var-kpi-card">
                        <div className="var-kpi-top">
                            <span className="var-kpi-label">Custom Roles</span>
                            <div className="var-kpi-icon purple">
                                <FontAwesomeIcon icon={faBriefcase} />
                            </div>
                        </div>
                        <div className="var-kpi-value">
                            <LiveCounter value={realCustomRoles} isCurrency={false} />
                        </div>
                        <div className="var-kpi-bottom">
                            <span className="var-kpi-badge neutral">
                                Custom Defined
                            </span>
                            <LiveSparkline data={customSpark} color="#9333EA" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 4: Assigned Users */}
                    <div className="var-kpi-card">
                        <div className="var-kpi-top">
                            <span className="var-kpi-label">Assigned Users</span>
                            <div className="var-kpi-icon orange">
                                <FontAwesomeIcon icon={faUsers} />
                            </div>
                        </div>
                        <div className="var-kpi-value">
                            <LiveCounter value={realAssignedUsers} isCurrency={false} />
                        </div>
                        <div className="var-kpi-bottom">
                            <span className="var-kpi-badge up">Registered Users</span>
                            <LiveSparkline data={userSpark} color="#D97706" width={60} height={24} />
                        </div>
                    </div>
                </div>

                {/* ── 4. Master Floating Workspace (Exact Match to Units page) ─── */}
                <div className="var-workspace" style={{ width: '100%', boxSizing: 'border-box' }}>

                    {/* Filter Bar (Exact Single-Line Match to Units page) */}
                    <div className="var-filter-bar">
                        <div className="var-search-box">
                            <FontAwesomeIcon icon={faSearch} className="var-search-icon" />
                            <input
                                type="text"
                                placeholder="Search by role name, description..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                            />
                        </div>

                        <div className="var-filter-controls">
                            <select
                                className="var-select-sm"
                                value={roleTypeFilter}
                                onChange={(e) => { setRoleTypeFilter(e.target.value); setPage(1); }}
                            >
                                <option value="all">Type: All</option>
                                <option value="system">System Roles</option>
                                <option value="custom">Custom Roles</option>
                            </select>

                            <select
                                className="var-select-sm"
                                value={statusFilter}
                                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            >
                                <option value="all">Status: All</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>

                            <select
                                className="var-select-sm"
                                value={sortBy}
                                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                            >
                                <option value="newest">Sort: Newest</option>
                                <option value="oldest">Sort: Oldest</option>
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

                            <button type="button" className="cat-btn-filter" onClick={clearFilters} title="Reset Filters">
                                Reset
                            </button>
                        </div>
                    </div>

                    {/* Content: List / Grid / Empty State */}
                    {filteredRoles.length === 0 ? (
                        <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #EEF2F7', padding: '60px 24px', textAlign: 'center', width: '100%' }}>
                            <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', margin: '0 auto 16px auto', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.12)' }}>
                                <FontAwesomeIcon icon={faShieldAlt} />
                            </div>
                            <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                                No roles found
                            </h3>
                            <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '440px', margin: '0 auto 22px auto', lineHeight: '1.55' }}>
                                {searchQuery || roleTypeFilter !== 'all' || statusFilter !== 'all'
                                    ? 'No roles match your search criteria. Try resetting filters.'
                                    : 'Create system and custom roles to define access permissions across modules.'}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                <button
                                    type="button"
                                    className="brand-btn-pill"
                                    onClick={clearFilters}
                                >
                                    Reset Filters
                                </button>
                                <Link
                                    to="/app/roles/create"
                                    className="brand-btn-pill brand-btn-primary text-white text-decoration-none"
                                >
                                    <FontAwesomeIcon icon={faPlus} /> Create Role
                                </Link>
                            </div>
                        </div>
                    ) : viewMode === 'list' ? (
                        /* LIST VIEW TABLE (Single-Line Luxury Format) */
                        <div className="var-table-wrap" style={{ overflowX: 'auto', width: '100%' }}>
                            <table className="var-table" style={{ width: '100%', minWidth: '1280px', tableLayout: 'auto', borderCollapse: 'separate' }}>
                                <thead>
                                    <tr>
                                        <th style={{ width: '36px', whiteSpace: 'nowrap' }}>
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={selected.length > 0 && selected.length === filteredRoles.length}
                                                onChange={toggleSelectAll}
                                            />
                                        </th>
                                        <th style={{ minWidth: '170px', whiteSpace: 'nowrap' }}>ROLE NAME</th>
                                        <th style={{ minWidth: '220px', whiteSpace: 'nowrap' }}>DESCRIPTION</th>
                                        <th style={{ minWidth: '120px', whiteSpace: 'nowrap' }}>TYPE</th>
                                        <th style={{ minWidth: '130px', whiteSpace: 'nowrap' }}>ASSIGNED USERS</th>
                                        <th style={{ minWidth: '130px', whiteSpace: 'nowrap' }}>PERMISSIONS</th>
                                        <th style={{ minWidth: '160px', whiteSpace: 'nowrap' }}>CREATED ON</th>
                                        <th style={{ minWidth: '100px', whiteSpace: 'nowrap' }}>STATUS</th>
                                        <th style={{ textAlign: 'right', minWidth: '110px', paddingRight: '16px', whiteSpace: 'nowrap' }}>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedRoles.map((role) => {
                                        const isChecked = selected.includes(role.id);
                                        return (
                                            <tr key={role.id} style={{ background: isChecked ? '#F0FDF4' : 'transparent', cursor: "pointer" }} onClick={() => handleSelectRole(role)}>
                                                <td style={{ whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        checked={isChecked}
                                                        onChange={() => toggleSel(role.id)}
                                                    />
                                                </td>
                                                <td style={{ whiteSpace: 'nowrap' }}>
                                                    <div className="d-flex align-items-center gap-3">
                                                        <div
                                                            style={{
                                                                width: "34px",
                                                                height: "34px",
                                                                borderRadius: "10px",
                                                                background: role.bg,
                                                                color: "#FFFFFF",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                fontSize: "14px",
                                                                flexShrink: 0
                                                            }}
                                                        >
                                                            <FontAwesomeIcon icon={role.icon} />
                                                        </div>
                                                        <div style={{ minWidth: 0 }}>
                                                            <div style={{ fontWeight: 800, color: "#0F172A", fontSize: "13.5px", whiteSpace: 'nowrap' }}>
                                                                {role.name}
                                                            </div>
                                                            <div style={{ fontSize: "11px", color: "#64748B", whiteSpace: 'nowrap' }}>ID: #{role.id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ whiteSpace: 'nowrap' }}>
                                                    <span
                                                        title={role.description}
                                                        style={{
                                                            fontSize: '13px',
                                                            color: '#475569',
                                                            fontWeight: '600',
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                    >
                                                        {role.description}
                                                    </span>
                                                </td>
                                                <td style={{ whiteSpace: 'nowrap' }}>
                                                    <span
                                                        style={{
                                                            display: 'inline-block',
                                                            padding: '3px 10px',
                                                            borderRadius: '8px',
                                                            fontSize: '12px',
                                                            fontWeight: '800',
                                                            background: '#EFF6FF',
                                                            color: '#2563EB',
                                                            border: '1px solid #BFDBFE',
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                    >
                                                        {role.type}
                                                    </span>
                                                </td>
                                                <td style={{ whiteSpace: 'nowrap' }}>
                                                    <span
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            padding: '3px 10px',
                                                            borderRadius: '8px',
                                                            fontSize: '12px',
                                                            fontWeight: '800',
                                                            background: '#F8FAFC',
                                                            color: '#1E293B',
                                                            border: '1px solid #E2E8F0',
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                    >
                                                        <FontAwesomeIcon icon={faUsers} style={{ color: '#2563EB' }} />
                                                        {role.usersCount} Users
                                                    </span>
                                                </td>
                                                <td style={{ whiteSpace: 'nowrap' }}>
                                                    <span
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            padding: '3px 10px',
                                                            borderRadius: '8px',
                                                            fontSize: '12px',
                                                            fontWeight: '800',
                                                            background: '#FEF3C7',
                                                            color: '#B45309',
                                                            border: '1px solid #FDE68A',
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                    >
                                                        <FontAwesomeIcon icon={faKey} style={{ color: '#D97706' }} />
                                                        {role.permissionsCount} Perms
                                                    </span>
                                                </td>
                                                <td style={{ whiteSpace: 'nowrap' }}>
                                                    <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#0F172A', whiteSpace: 'nowrap' }}>
                                                        {role.createdDate}, {role.createdTime}
                                                    </span>
                                                </td>
                                                <td style={{ whiteSpace: 'nowrap' }}>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '800', background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', whiteSpace: 'nowrap' }}>
                                                        <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#15803D' }}></span> Active
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right', paddingRight: '16px', whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                                                    <div className="brand-card-actions" style={{ justifyContent: 'flex-end', gap: '4px' }}>
                                                        <button type="button" className="brand-action-btn" title="View Details" onClick={() => handleSelectRole(role)}>
                                                            <FontAwesomeIcon icon={faEye} />
                                                        </button>
                                                        <button type="button" className="brand-action-btn edit" title="Edit Role" onClick={() => goToEdit(role)}>
                                                            <FontAwesomeIcon icon={faEdit} />
                                                        </button>
                                                        <button type="button" className="brand-action-btn delete" title="Delete" onClick={() => onClickDeleteModel(role)}>
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
                        /* COMPACT ELEGANT GRID CARDS */
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                            {paginatedRoles.map((role) => (
                                <div
                                    key={role.id}
                                    style={{
                                        background: '#FFFFFF',
                                        border: '1px solid #EEF2F7',
                                        borderRadius: '16px',
                                        padding: '14px 16px',
                                        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        gap: '10px',
                                        cursor: 'pointer',
                                        transition: 'all 200ms ease',
                                        minHeight: '180px'
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(15, 23, 42, 0.07)';
                                        e.currentTarget.style.borderColor = '#BFDBFE';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 2px 6px rgba(15, 23, 42, 0.03)';
                                        e.currentTarget.style.borderColor = '#EEF2F7';
                                    }}
                                    onClick={() => handleSelectRole(role)}
                                >
                                    {/* Row 1: Icon + Name + Type Pill */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                            <div
                                                style={{
                                                    width: "32px",
                                                    height: "32px",
                                                    borderRadius: "10px",
                                                    background: role.bg,
                                                    color: "#FFFFFF",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: "14px",
                                                    flexShrink: 0
                                                }}
                                            >
                                                <FontAwesomeIcon icon={role.icon} />
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {role.name}
                                                </div>
                                                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', whiteSpace: 'nowrap' }}>
                                                    ID: #{role.id}
                                                </div>
                                            </div>
                                        </div>

                                        <span style={{ padding: '2px 8px', fontSize: '11px', fontWeight: '800', background: '#EFF6FF', color: '#2563EB', borderRadius: '6px', border: '1px solid #BFDBFE', whiteSpace: 'nowrap' }}>
                                            {role.type}
                                        </span>
                                    </div>

                                    {/* Row 2: Description */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                        <span style={{ fontSize: '12px', color: '#475569', fontWeight: '600', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                            {role.description}
                                        </span>
                                    </div>

                                    {/* Row 3: Meta Strip */}
                                    <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '6px 10px', fontSize: '11px', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <FontAwesomeIcon icon={faUsers} style={{ color: '#2563EB' }} />
                                            <span style={{ fontWeight: '700', color: '#0F172A' }}>{role.usersCount} Users</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <FontAwesomeIcon icon={faKey} style={{ color: '#D97706' }} />
                                            <span style={{ fontWeight: '800', color: '#B45309' }}>{role.permissionsCount} Perms</span>
                                        </div>
                                    </div>

                                    {/* Row 4: Status + Actions */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid #F1F5F9' }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: '800', background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
                                            <span style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', background: '#15803D' }}></span> Active
                                        </span>
                                        <div className="brand-card-actions" style={{ gap: '4px' }} onClick={e => e.stopPropagation()}>
                                            <button type="button" className="brand-action-btn" title="View Details" onClick={() => handleSelectRole(role)}>
                                                <FontAwesomeIcon icon={faEye} />
                                            </button>
                                            <button type="button" className="brand-action-btn edit" title="Edit Role" onClick={() => goToEdit(role)}>
                                                <FontAwesomeIcon icon={faEdit} />
                                            </button>
                                            <button type="button" className="brand-action-btn delete" title="Delete" onClick={() => onClickDeleteModel(role)}>
                                                <FontAwesomeIcon icon={faTrash} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── 5. DYNAMIC WORKING PAGINATION (Inside Workspace Card - Exact Match to Units page) ── */}
                    <div className="var-pagination" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', paddingTop: '16px', borderTop: '1px solid #EEF2F7', width: '100%' }}>
                        <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
                            Showing {filteredRoles.length > 0 ? (page - 1) * perPage + 1 : 0} to {Math.min(page * perPage, filteredRoles.length)} of {filteredRoles.length} roles
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

                {/* ── SLIDE-OVER DRAWER PREVIEW (Units & Variations Style) ─── */}
                {selectedRole && (
                    <div className="var-drawer-overlay" onClick={() => setSelectedRole(null)}>
                        <div className="var-drawer" onClick={(e) => e.stopPropagation()}>
                            <div className="var-drawer-header">
                                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                    <div
                                        style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: "14px",
                                            background: selectedRole.bg,
                                            color: "#FFFFFF",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: 18
                                        }}
                                    >
                                        <FontAwesomeIcon icon={selectedRole.icon} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#0F172A' }}>
                                            {selectedRole.name}
                                        </h3>
                                        <div style={{ fontSize: '12px', color: '#64748B' }}>
                                            {selectedRole.type} • ID: #{selectedRole.id}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="brand-action-btn"
                                    onClick={() => setSelectedRole(null)}
                                    title="Close"
                                >
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </div>

                            {/* Drawer Navigation Tabs */}
                            <div style={{ display: 'flex', borderBottom: '1px solid #EEF2F7', padding: '0 24px', background: '#FAFAFA' }}>
                                <button
                                    type="button"
                                    style={{
                                        padding: '12px 16px',
                                        fontSize: '13px',
                                        fontWeight: drawerTab === 'overview' ? '700' : '500',
                                        color: drawerTab === 'overview' ? '#16A34A' : '#64748B',
                                        border: 'none',
                                        background: 'transparent',
                                        borderBottom: drawerTab === 'overview' ? '2px solid #16A34A' : '2px solid transparent',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => setDrawerTab('overview')}
                                >
                                    Overview
                                </button>
                                <button
                                    type="button"
                                    style={{
                                        padding: '12px 16px',
                                        fontSize: '13px',
                                        fontWeight: drawerTab === 'permissions' ? '700' : '500',
                                        color: drawerTab === 'permissions' ? '#16A34A' : '#64748B',
                                        border: 'none',
                                        background: 'transparent',
                                        borderBottom: drawerTab === 'permissions' ? '2px solid #16A34A' : '2px solid transparent',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => setDrawerTab('permissions')}
                                >
                                    Permissions ({selectedRole.permissionsCount})
                                </button>
                                <button
                                    type="button"
                                    style={{
                                        padding: '12px 16px',
                                        fontSize: '13px',
                                        fontWeight: drawerTab === 'users' ? '700' : '500',
                                        color: drawerTab === 'users' ? '#16A34A' : '#64748B',
                                        border: 'none',
                                        background: 'transparent',
                                        borderBottom: drawerTab === 'users' ? '2px solid #16A34A' : '2px solid transparent',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => setDrawerTab('users')}
                                >
                                    Assigned Users ({selectedRole.usersCount})
                                </button>
                            </div>

                            <div className="var-drawer-body">
                                {drawerTab === 'overview' && (
                                    <div>
                                        <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '16px', border: '1px solid #EEF2F7', marginBottom: '20px' }}>
                                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                                                Role Details
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #EEF2F7', fontSize: '13px' }}>
                                                <span style={{ color: '#64748B' }}>Display Name</span>
                                                <span style={{ fontWeight: '700', color: '#0F172A' }}>{selectedRole.displayName}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #EEF2F7', fontSize: '13px' }}>
                                                <span style={{ color: '#64748B' }}>Description</span>
                                                <span style={{ fontWeight: '500', color: '#334155', maxWidth: '200px', textAlign: 'right' }}>{selectedRole.description}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #EEF2F7', fontSize: '13px', alignItems: 'center' }}>
                                                <span style={{ color: '#64748B' }}>Role Type</span>
                                                <span className="unit-short-badge">{selectedRole.type}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #EEF2F7', fontSize: '13px', alignItems: 'center' }}>
                                                <span style={{ color: '#64748B' }}>Status</span>
                                                <span className="unit-base-badge">● {selectedRole.status}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '13px' }}>
                                                <span style={{ color: '#64748B' }}>Created On</span>
                                                <span style={{ fontWeight: '600', color: '#0F172A' }}>{selectedRole.createdDate}</span>
                                            </div>
                                        </div>

                                        <div className="row g-3">
                                            <div className="col-6">
                                                <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '14px', border: '1px solid #EEF2F7' }}>
                                                    <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>Active Users</div>
                                                    <div style={{ fontSize: '22px', fontWeight: '800', color: '#2563EB', marginTop: '2px' }}>
                                                        {selectedRole.usersCount}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-6">
                                                <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '14px', border: '1px solid #EEF2F7' }}>
                                                    <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>Permissions</div>
                                                    <div style={{ fontSize: '22px', fontWeight: '800', color: '#16A34A', marginTop: '2px' }}>
                                                        {selectedRole.permissionsCount}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {drawerTab === 'permissions' && (
                                    <div>
                                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>
                                            Granted Permissions ({selectedRole.permissions.length})
                                        </div>
                                        {selectedRole.permissions.length === 0 ? (
                                            <p style={{ color: "#64748B", fontSize: "13px" }}>No specific permissions assigned.</p>
                                        ) : (
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                                {selectedRole.permissions.map((p, idx) => (
                                                    <span key={idx} className="var-chip" style={{ fontSize: "12px", padding: '6px 12px' }}>
                                                        <FontAwesomeIcon icon={faKey} style={{ color: "#16A34A" }} />
                                                        {typeof p === 'string' ? p : p.name || p.display_name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {drawerTab === 'users' && (
                                    <div>
                                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>
                                            Assigned Users ({selectedRole.assignedUsersList.length})
                                        </div>
                                        {selectedRole.assignedUsersList.length === 0 ? (
                                            <p style={{ color: "#64748B", fontSize: "13px" }}>No active users assigned to this role.</p>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {selectedRole.assignedUsersList.map((u, idx) => (
                                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #EEF2F7' }}>
                                                        <div>
                                                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>
                                                                {u.first_name || u.attributes?.first_name} {u.last_name || u.attributes?.last_name}
                                                            </div>
                                                            <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                                                                {u.email || u.attributes?.email}
                                                            </div>
                                                        </div>
                                                        <span className="unit-base-badge">Active</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div style={{ padding: '16px 24px', borderTop: '1px solid #EEF2F7', background: '#FAFAFA', display: 'flex', gap: '10px' }}>
                                <button
                                    type="button"
                                    className="brand-btn-pill brand-btn-primary"
                                    style={{ flex: 1 }}
                                    onClick={() => { setSelectedRole(null); goToEdit(selectedRole); }}
                                >
                                    <FontAwesomeIcon icon={faEdit} /> Edit Role
                                </button>
                                <button
                                    type="button"
                                    className="brand-btn-pill"
                                    style={{ borderColor: '#FCA5A5', color: '#DC2626', background: '#FEF2F2' }}
                                    onClick={() => { setSelectedRole(null); onClickDeleteModel(selectedRole); }}
                                >
                                    <FontAwesomeIcon icon={faTrash} /> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Delete Modal ─── */}
                {deleteModel && isDelete && (
                    <DeleteRole
                        onClickDeleteModel={handleClose}
                        deleteModel={deleteModel}
                        onDelete={() => {
                            deleteRole(isDelete.id);
                            handleClose();
                        }}
                    />
                )}

            </div>
        </MasterLayout>
    );
};

const mapStateToProps = (state) => {
    const { roles, permissions, users, totalRecord, isLoading, allConfigData } = state;
    return { roles, permissions, users, totalRecord, isLoading, allConfigData };
};

export default connect(mapStateToProps, { fetchRoles, deleteRole, fetchPermissions, fetchUsers })(Role);
