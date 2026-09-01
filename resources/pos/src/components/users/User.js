import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import moment from 'moment';
import MasterLayout from '../MasterLayout';
import TabTitle from '../../shared/tab-title/TabTitle';
import TopProgressBar from '../../shared/components/loaders/TopProgressBar';
import { fetchUsers, deleteUser } from '../../store/action/userAction';
import DeleteUser from './DeleteUser';
import { getFormattedDate, placeholderText } from '../../shared/sharedMethod';
import MasterTableSkeleton from '../../shared/components/skeletons/MasterTableSkeleton';
import useSmartLoading from '../../shared/hooks/useSmartLoading';
import '../brands/ProductBrandsPremium.css';
import '../units/ProductUnitsPremium.css';
import '../variation/ProductVariationsPremium.css';
import LiveCounter from '../../shared/components/LiveCounter';
import LiveSparkline from '../../shared/components/LiveSparkline';
import { subscribePosDataChanged } from "../../shared/posEvents";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUsers,
    faShieldHalved,
    faCashRegister,
    faUserTie,
    faPlus,
    faSearch,
    faList,
    faThLarge,
    faEye,
    faEdit,
    faTrash,
    faTimes,
} from '@fortawesome/free-solid-svg-icons';

/* ─────────── Avatar Color Generator ─────────── */
const AV_COLORS = ['#6366F1', '#EC4899', '#F59E0B', '#14B8A6', '#8B5CF6', '#0EA5E9', '#F97316', '#10B981', '#EF4444', '#06B6D4'];
const avColor = (n = '') => AV_COLORS[(n.charCodeAt(0) || 0) % AV_COLORS.length];
const empId = (id) => `EMP-${String(id).padStart(4, '0')}`;

/* ─────────── User Drawer Preview ─────────── */
const UserDrawer = ({ user, onClose, onEdit, onDel }) => {
    const [tab, setTab] = useState('overview');
    if (!user) return null;

    const initials = ((user.first_name?.[0] || '') + (user.last_name?.[0] || '')).toUpperCase() || 'U';
    const roles = (user.role_names || []).join(', ') || 'User';

    const Row = ({ lbl, val, cls }) => (
        <div className="d-row">
            <span className="d-lbl">{lbl}</span>
            <span className={`d-val ${cls || ''}`}>{val}</span>
        </div>
    );

    return (
        <>
            <div className="drawer-overlay" onClick={onClose} />
            <div className="user-drawer">
                <div className="drawer-head">
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: '50%',
                                background: avColor(user.first_name || 'U'),
                                color: '#FFFFFF',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 16
                            }}
                        >
                            {initials}
                        </div>
                        <div>
                            <div className="d-name">{user.first_name} {user.last_name}</div>
                            <div className="d-sub">{user.email}</div>
                        </div>
                    </div>
                    <button className="d-close" onClick={onClose}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                <div className="drawer-tabs">
                    <button className={`d-tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>
                        Overview
                    </button>
                    <button className={`d-tab ${tab === 'permissions' ? 'active' : ''}`} onClick={() => setTab('permissions')}>
                        Roles
                    </button>
                    <button className={`d-tab ${tab === 'activity' ? 'active' : ''}`} onClick={() => setTab('activity')}>
                        Activity
                    </button>
                </div>

                <div className="drawer-body">
                    {tab === 'overview' && (
                        <>
                            <div className="d-section">
                                <div className="d-sec-title">Contact Info</div>
                                <Row lbl="Email" val={user.email || '—'} />
                                <Row lbl="Phone" val={user.phone || '—'} />
                            </div>
                            <div className="d-section">
                                <div className="d-sec-title">Account Details</div>
                                <Row lbl="Employee ID" val={<span className="emp-tag">{empId(user.id)}</span>} />
                                <Row lbl="Role" val={<span className="unit-base-badge">{roles}</span>} />
                                <Row lbl="Joined On" val={user.created_at ? moment(user.created_at).format('DD MMM YYYY') : '—'} />
                                <Row lbl="Status" val="Active User" cls="green" />
                            </div>
                            <div className="d-section">
                                <div className="d-sec-title">Last Activity</div>
                                <Row lbl="Last Login" val={user.created_at ? moment(user.created_at).fromNow() : '—'} />
                                <Row lbl="Device" val="Desktop / Chrome" />
                            </div>
                        </>
                    )}
                    {tab === 'permissions' && (
                        <div className="d-section">
                            <div className="d-sec-title">Assigned Roles</div>
                            {(user.role_names || []).length > 0 ? (
                                user.role_names.map((r, i) => (
                                    <div key={i} className="d-row">
                                        <span className="d-lbl">{r}</span>
                                        <span className="unit-base-badge">Active</span>
                                    </div>
                                ))
                            ) : (
                                <p style={{ color: '#9CA3AF', fontSize: 12 }}>No roles assigned.</p>
                            )}
                        </div>
                    )}
                    {tab === 'activity' && (
                        <div className="d-section">
                            <div className="d-sec-title">Activity Timeline</div>
                            {[
                                { ev: 'Account Created', time: user.created_at ? moment(user.created_at).format('DD MMM YYYY, hh:mm A') : '—', color: '#16A34A' },
                                { ev: 'Profile Updated', time: '—', color: '#3B82F6' },
                                { ev: 'Role Assigned', time: '—', color: '#8B5CF6' },
                            ].map((ev, i) => (
                                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 14 }}>
                                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: ev.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ev.color, fontSize: 11, fontWeight: 'bold', flexShrink: 0 }}>
                                        ✓
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: '#1E293B' }}>{ev.ev}</div>
                                        <div style={{ fontSize: 11, color: '#9CA3AF' }}>{ev.time}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="drawer-foot">
                    <button className="brand-btn-pill" onClick={() => onEdit(user)}>
                        <FontAwesomeIcon icon={faEdit} /> Edit User
                    </button>
                    <button className="brand-btn-pill" style={{ borderColor: '#FCA5A5', color: '#DC2626', background: '#FEF2F2' }} onClick={() => onDel(user)}>
                        <FontAwesomeIcon icon={faTrash} /> Delete
                    </button>
                </div>
            </div>
        </>
    );
};

/* ════════════════════════════════════════════
   MAIN USER COMPONENT
════════════════════════════════════════════ */
const User = ({ users, fetchUsers, totalRecord, isLoading, allConfigData }) => {
    const safeUsersArr = Array.isArray(users) ? users : [];
    const isLoadingSkeleton = useSmartLoading(safeUsersArr);

    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [viewMode, setViewMode] = useState('list');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [selected, setSelected] = useState([]);
    const [drawer, setDrawer] = useState(null);
    const [deleteModel, setDeleteModel] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [kpiFilter, setKpiFilter] = useState('');

    useEffect(() => {
        fetchUsers({ page, pageSize: 50 }, !safeUsersArr.length);

        const unsubscribe = subscribePosDataChanged(() => {
            fetchUsers({ page: 1, pageSize: 50 }, false);
        });

        return () => unsubscribe();
    }, []);

    const handleSearch = (val) => {
        setSearch(val);
        setPage(1);
    };

    /* ── mapped users ── */
    const allUsers = useMemo(() => {
        return safeUsersArr.map(u => ({
            id: u.id,
            first_name: u.attributes ? u.attributes.first_name : u.first_name || '',
            last_name: u.attributes ? u.attributes.last_name : u.last_name || '',
            email: u.attributes ? u.attributes.email : u.email || '',
            phone: u.attributes ? u.attributes.phone : u.phone || '',
            image: u.attributes ? u.attributes.image : u.image || '',
            role_names: u.attributes && Array.isArray(u.attributes.role)
                ? u.attributes.role.map(r => r.name)
                : Array.isArray(u.role) ? u.role.map(r => r.name || r) : [],
            created_at: u.attributes ? u.attributes.created_at : u.created_at || '',
        }));
    }, [safeUsersArr]);

    /* ── roles list ── */
    const allRoles = useMemo(() => {
        return [...new Set(allUsers.flatMap(u => u.role_names))].filter(Boolean);
    }, [allUsers]);

    /* ── filter & sort logic ── */
    const filtered = useMemo(() => {
        return allUsers.filter(u => {
            const q = `${u.first_name} ${u.last_name} ${u.email} ${u.phone} ${empId(u.id)}`.toLowerCase();
            const s = search.trim().toLowerCase();
            const matchSearch = !s || q.includes(s);
            const matchRole = roleFilter === 'all' || u.role_names.some(r => r.toLowerCase() === roleFilter.toLowerCase());
            const matchStatus = statusFilter === 'all' ? true : statusFilter === 'active';
            const matchKpi = !kpiFilter || u.role_names.some(r => r.toLowerCase().includes(kpiFilter.toLowerCase()));
            return matchSearch && matchRole && matchStatus && matchKpi;
        }).sort((a, b) => {
            if (sortBy === 'newest') return moment(b.created_at).valueOf() - moment(a.created_at).valueOf();
            if (sortBy === 'oldest') return moment(a.created_at).valueOf() - moment(b.created_at).valueOf();
            if (sortBy === 'name') return (a.first_name || '').localeCompare(b.first_name || '');
            return 0;
        });
    }, [allUsers, search, roleFilter, statusFilter, kpiFilter, sortBy]);

    /* ── KPIs count ── */
    const adminCnt = allUsers.filter(u => u.role_names.some(r => r.toLowerCase().includes('admin'))).length;
    const cashierCnt = allUsers.filter(u => u.role_names.some(r => r.toLowerCase().includes('cashier'))).length;
    const salesCnt = allUsers.filter(u => u.role_names.some(r => r.toLowerCase().includes('sales'))).length;

    /* ── select ── */
    const toggleSel = id => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
    const toggleAll = () => setSelected(s => s.length === filtered.length ? [] : filtered.map(u => u.id));

    /* ── delete ── */
    const openDel = (u) => { setDeleteTarget(u); setDeleteModel(true); };
    const closeDel = () => { setDeleteModel(false); setDeleteTarget(null); };

    /* ── edit ── */
    const goEdit = (u) => { window.location.href = `#/app/users/edit/${u.id}`; };

    /* ── reset filters ── */
    const handleReset = () => {
        setSearch('');
        setRoleFilter('all');
        setStatusFilter('all');
        setSortBy('newest');
        setKpiFilter('');
        setSelected([]);
        setPage(1);
    };

    /* ── pagination ── */
    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const paginatedUsers = filtered.slice((page - 1) * perPage, page * perPage);

    const pageNums = (() => {
        const max = Math.min(5, totalPages);
        let start = Math.max(1, page - 2);
        if (start + max - 1 > totalPages) start = Math.max(1, totalPages - max + 1);
        return Array.from({ length: max }, (_, i) => start + i);
    })();

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title={placeholderText('users.title')} />

            {isLoadingSkeleton ? (
                <MasterTableSkeleton />
            ) : (
                <div className="var-page-container">

                    {/* ── 1. BREADCRUMB (Exact Match to Units page) ── */}
                    <div className="var-breadcrumb">
                        <span>Dashboard</span>
                        <span>&gt;</span>
                        <span>People</span>
                        <span>&gt;</span>
                        <span className="var-crumb-active">Users</span>
                    </div>

                    {/* ── 2. HEADER SECTION (Exact Match to Units page) ── */}
                    <div className="var-header">
                        <div className="var-title-group">
                            <h1>Users</h1>
                            <p>Manage all system users, employees, cashiers, and administrators.</p>
                        </div>
                        <div className="var-header-actions">
                            <a
                                href="#/app/users/create"
                                className="var-btn-pill var-btn-primary"
                                style={{ textDecoration: 'none' }}
                            >
                                <FontAwesomeIcon icon={faPlus} /> Create User
                            </a>
                        </div>
                    </div>

                    {/* ── 3. 4 REAL KPI SUMMARY CARDS GRID (Exact Match to Units page) ── */}
                    <div className="var-kpi-grid">
                        {/* Card 1: Total Users */}
                        <div
                            className="var-kpi-card"
                            style={{ cursor: 'pointer', border: kpiFilter === '' ? '2px solid #16A34A' : undefined }}
                            onClick={() => { setKpiFilter(''); setPage(1); }}
                        >
                            <div className="var-kpi-top">
                                <span className="var-kpi-label">Total Users</span>
                                <div className="var-kpi-icon green">
                                    <FontAwesomeIcon icon={faUsers} />
                                </div>
                            </div>
                            <div className="var-kpi-value">
                                <LiveCounter value={allUsers.length} isCurrency={false} />
                            </div>
                            <div className="var-kpi-bottom">
                                <span className="var-kpi-badge up">Active Users</span>
                                <LiveSparkline color="#16A34A" width={60} height={24} />
                            </div>
                        </div>

                        {/* Card 2: Administrators */}
                        <div
                            className="var-kpi-card"
                            style={{ cursor: 'pointer', border: kpiFilter === 'admin' ? '2px solid #2563EB' : undefined }}
                            onClick={() => { setKpiFilter(kpiFilter === 'admin' ? '' : 'admin'); setPage(1); }}
                        >
                            <div className="var-kpi-top">
                                <span className="var-kpi-label">Administrators</span>
                                <div className="var-kpi-icon blue">
                                    <FontAwesomeIcon icon={faShieldHalved} />
                                </div>
                            </div>
                            <div className="var-kpi-value">
                                <LiveCounter value={adminCnt} isCurrency={false} />
                            </div>
                            <div className="var-kpi-bottom">
                                <span className="var-kpi-badge up">{adminCnt} Admin</span>
                                <LiveSparkline color="#2563EB" width={60} height={24} />
                            </div>
                        </div>

                        {/* Card 3: Cashiers */}
                        <div
                            className="var-kpi-card"
                            style={{ cursor: 'pointer', border: kpiFilter === 'cashier' ? '2px solid #D97706' : undefined }}
                            onClick={() => { setKpiFilter(kpiFilter === 'cashier' ? '' : 'cashier'); setPage(1); }}
                        >
                            <div className="var-kpi-top">
                                <span className="var-kpi-label">Cashiers</span>
                                <div className="var-kpi-icon orange">
                                    <FontAwesomeIcon icon={faCashRegister} />
                                </div>
                            </div>
                            <div className="var-kpi-value">
                                <LiveCounter value={cashierCnt} isCurrency={false} />
                            </div>
                            <div className="var-kpi-bottom">
                                <span className="var-kpi-badge neutral">
                                    {cashierCnt > 0 ? `${cashierCnt} Defined` : '0 Defined'}
                                </span>
                                <LiveSparkline color="#D97706" width={60} height={24} />
                            </div>
                        </div>

                        {/* Card 4: Sales Team */}
                        <div
                            className="var-kpi-card"
                            style={{ cursor: 'pointer', border: kpiFilter === 'sales' ? '2px solid #9333EA' : undefined }}
                            onClick={() => { setKpiFilter(kpiFilter === 'sales' ? '' : 'sales'); setPage(1); }}
                        >
                            <div className="var-kpi-top">
                                <span className="var-kpi-label">Sales Team</span>
                                <div className="var-kpi-icon purple">
                                    <FontAwesomeIcon icon={faUserTie} />
                                </div>
                            </div>
                            <div className="var-kpi-value">
                                <LiveCounter value={salesCnt} isCurrency={false} />
                            </div>
                            <div className="var-kpi-bottom">
                                <span className="var-kpi-badge neutral">
                                    {salesCnt > 0 ? `${salesCnt} Defined` : '0 Defined'}
                                </span>
                                <LiveSparkline color="#9333EA" width={60} height={24} />
                            </div>
                        </div>
                    </div>

                    {/* ── 4. FLOATING GLASS WORKSPACE CONTAINER (Exact Match to Units page) ── */}
                    <div className="var-workspace" style={{ width: '100%', boxSizing: 'border-box' }}>

                        {/* Search & Filter Toolbar (Exact Match to Units page) */}
                        <div className="var-filter-bar">
                            <div className="var-search-box">
                                <FontAwesomeIcon icon={faSearch} className="var-search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={search}
                                    onChange={(e) => handleSearch(e.target.value)}
                                />
                            </div>

                            <div className="var-filter-controls">
                                <select
                                    className="var-select-sm"
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                        setPage(1);
                                    }}
                                >
                                    <option value="all">Status: All</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>

                                <select
                                    className="var-select-sm"
                                    value={roleFilter}
                                    onChange={(e) => {
                                        setRoleFilter(e.target.value);
                                        setPage(1);
                                    }}
                                >
                                    <option value="all">Role: All</option>
                                    {allRoles.map((r, idx) => (
                                        <option key={idx} value={r}>{r}</option>
                                    ))}
                                </select>

                                <select
                                    className="var-select-sm"
                                    value={sortBy}
                                    onChange={(e) => {
                                        setSortBy(e.target.value);
                                        setPage(1);
                                    }}
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

                        {/* ── 5. VIEW CONTENT: LIST TABLE OR GRID (Exact Match to Units page) ── */}
                        {viewMode === 'list' ? (
                            <div className="var-table-wrap" style={{ width: '100%', overflowX: 'auto', marginBottom: '20px' }}>
                                <table className="var-table" style={{ width: '100%', tableLayout: 'auto' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ width: '40px', textAlign: 'center' }}>
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    style={{ width: '18px', height: '18px', cursor: 'pointer', borderRadius: '4px' }}
                                                    checked={filtered.length > 0 && selected.length === filtered.length}
                                                    onChange={toggleAll}
                                                />
                                            </th>
                                            <th>USER</th>
                                            <th>EMPLOYEE ID</th>
                                            <th>ROLE</th>
                                            <th>PHONE</th>
                                            <th style={{ whiteSpace: 'nowrap' }}>CREATED ON</th>
                                            <th>STATUS</th>
                                            <th style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" style={{ textAlign: 'center', padding: '60px 20px', border: 'none' }}>
                                                    <div style={{ padding: '20px', textAlign: 'center' }}>
                                                        <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', margin: '0 auto 16px auto', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.12)' }}>
                                                            <FontAwesomeIcon icon={faUsers} />
                                                        </div>
                                                        <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>
                                                            No users found
                                                        </h3>
                                                        <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '420px', margin: '0 auto 22px auto' }}>
                                                            Try adjusting your search criteria or create a new user.
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedUsers.map((u) => {
                                                const isChecked = selected.includes(u.id);
                                                const initials = ((u.first_name?.[0] || '') + (u.last_name?.[0] || '')).toUpperCase() || 'U';
                                                const createdDate = getFormattedDate(u.created_at, allConfigData);
                                                const createdTime = u.created_at ? moment(u.created_at).format('hh:mm A') : '';

                                                return (
                                                    <tr key={u.id} style={{ background: isChecked ? '#F0FDF4' : 'transparent' }}>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <input
                                                                type="checkbox"
                                                                className="form-check-input"
                                                                style={{ width: '18px', height: '18px', cursor: 'pointer', borderRadius: '4px' }}
                                                                checked={isChecked}
                                                                onChange={() => toggleSel(u.id)}
                                                            />
                                                        </td>
                                                        <td>
                                                            <div className="d-flex align-items-center gap-3">
                                                                <div
                                                                    style={{
                                                                        width: 38,
                                                                        height: 38,
                                                                        borderRadius: '12px',
                                                                        background: avColor(u.first_name || 'U'),
                                                                        color: '#FFFFFF',
                                                                        fontWeight: 800,
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        fontSize: 14,
                                                                        flexShrink: 0
                                                                    }}
                                                                >
                                                                    {initials}
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '14.5px' }}>
                                                                        {u.first_name} {u.last_name}
                                                                    </div>
                                                                    <div style={{ fontSize: '12px', color: '#64748B' }}>
                                                                        {u.email}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className="unit-short-badge">{empId(u.id)}</span>
                                                        </td>
                                                        <td>
                                                            <span className="unit-base-badge">{u.role_names?.[0] || 'User'}</span>
                                                        </td>
                                                        <td>
                                                            <span style={{ fontSize: '13.5px', color: '#334155', fontWeight: '500' }}>{u.phone || '—'}</span>
                                                        </td>
                                                        <td>
                                                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A', whiteSpace: 'nowrap' }}>{createdDate}</div>
                                                            <div style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap' }}>{createdTime}</div>
                                                        </td>
                                                        <td>
                                                            <span className="unit-base-badge">
                                                                ● Active
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="brand-card-actions" style={{ justifyContent: 'flex-end', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <button
                                                                    type="button"
                                                                    className="brand-action-btn"
                                                                    title="Preview User"
                                                                    onClick={() => setDrawer(u)}
                                                                >
                                                                    <FontAwesomeIcon icon={faEye} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="brand-action-btn edit"
                                                                    title="Edit User"
                                                                    onClick={() => goEdit(u)}
                                                                >
                                                                    <FontAwesomeIcon icon={faEdit} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="brand-action-btn delete"
                                                                    title="Delete User"
                                                                    onClick={() => openDel(u)}
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
                        ) : (
                            /* GRID VIEW CARDS (Exact Match to Units page) */
                            <div className="brand-cards-grid">
                                {paginatedUsers.length === 0 ? (
                                    <div style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center' }}>
                                        <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px auto' }}>
                                            <FontAwesomeIcon icon={faUsers} />
                                        </div>
                                        <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>No users found</h3>
                                        <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '400px', margin: '0 auto 20px auto' }}>Try adjusting your search criteria or create a new user.</p>
                                    </div>
                                ) : (
                                    paginatedUsers.map((u) => {
                                        const initials = ((u.first_name?.[0] || '') + (u.last_name?.[0] || '')).toUpperCase() || 'U';
                                        return (
                                            <div key={u.id} className="brand-card-item">
                                                <div className="brand-logo-container" style={{ background: '#EFF6FF' }}>
                                                    <div style={{ background: avColor(u.first_name || 'U'), color: '#FFFFFF', fontWeight: '800', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                                                        {initials}
                                                    </div>
                                                </div>
                                                <div className="brand-card-title">{u.first_name} {u.last_name}</div>
                                                <div className="d-flex align-items-center justify-content-center gap-2 my-2">
                                                    <span className="unit-short-badge">{empId(u.id)}</span>
                                                    <span className="unit-base-badge">{u.role_names?.[0] || 'User'}</span>
                                                </div>
                                                <div className="brand-card-stats">
                                                    <div className="brand-stat-item">
                                                        <div className="brand-stat-val" style={{ fontSize: '13px' }}>{u.phone || '—'}</div>
                                                        <div className="brand-stat-lbl">Phone</div>
                                                    </div>
                                                    <div style={{ width: '1px', height: '24px', background: '#F1F5F9' }} />
                                                    <div className="brand-stat-item">
                                                        <div className="brand-stat-val" style={{ fontSize: '12px', wordBreak: 'break-all' }}>{u.email}</div>
                                                        <div className="brand-stat-lbl">Email</div>
                                                    </div>
                                                </div>
                                                <div className="brand-card-actions">
                                                    <button
                                                        type="button"
                                                        className="brand-action-btn"
                                                        title="Preview User"
                                                        onClick={() => setDrawer(u)}
                                                    >
                                                        <FontAwesomeIcon icon={faEye} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="brand-action-btn edit"
                                                        title="Edit User"
                                                        onClick={() => goEdit(u)}
                                                    >
                                                        <FontAwesomeIcon icon={faEdit} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="brand-action-btn delete"
                                                        title="Delete User"
                                                        onClick={() => openDel(u)}
                                                    >
                                                        <FontAwesomeIcon icon={faTrash} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}

                        {/* ── 6. DYNAMIC WORKING PAGINATION (Inside Workspace Card - Exact Match to Units page) ── */}
                        <div className="var-pagination" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', paddingTop: '16px', borderTop: '1px solid #EEF2F7', width: '100%' }}>
                            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
                                Showing {filtered.length > 0 ? (page - 1) * perPage + 1 : 0} to {Math.min(page * perPage, filtered.length)} of {filtered.length} users
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

            {/* ── DRAWER PREVIEW ── */}
            <UserDrawer
                user={drawer}
                onClose={() => setDrawer(null)}
                onEdit={(u) => { setDrawer(null); goEdit(u); }}
                onDel={(u) => { setDrawer(null); openDel(u); }}
            />

            {/* ── DELETE MODAL ── */}
            {deleteModel && deleteTarget && (
                <DeleteUser
                    onClickDeleteModel={closeDel}
                    deleteModel={deleteModel}
                    onDelete={() => {
                        deleteUser(deleteTarget.id);
                        closeDel();
                    }}
                />
            )}
        </MasterLayout>
    );
};

const mapStateToProps = (state) => {
    const { users, totalRecord, isLoading, allConfigData } = state;
    return { users, totalRecord, isLoading, allConfigData };
};

export default connect(mapStateToProps, { fetchUsers, deleteUser })(User);
