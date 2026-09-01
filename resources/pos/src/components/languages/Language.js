import React, { useState, useEffect, useMemo } from 'react';
import { connect, useDispatch, useSelector } from 'react-redux';
import { Link } from "react-router-dom";
import moment from 'moment';
import MasterLayout from '../MasterLayout';
import { fetchLanguages } from '../../store/action/languageAction';
import DeleteLanguage from './DeleteLanguage';
import EditLanguage from './EditLanguage';
import CreateLanguage from "./CreateLanguage";
import TabTitle from '../../shared/tab-title/TabTitle';
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";
import LiveCounter from "../../shared/components/LiveCounter";
import LiveSparkline from "../../shared/components/LiveSparkline";
import { getFormattedDate } from '../../shared/sharedMethod';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faGlobe,
    faPlus,
    faSearch,
    faList,
    faThLarge,
    faEye,
    faEdit,
    faTrash,
    faLanguage,
    faCheck,
    faFileCode,
} from '@fortawesome/free-solid-svg-icons';
import "../brands/ProductBrandsPremium.css";
import "../units/ProductUnitsPremium.css";
import "../variation/ProductVariationsPremium.css";

const languageMetaMap = {
    ta: { native: "தமிழ்", flag: "🇮🇳", abbr: "TA", country: "India", progress: 95, color: "#16A34A", status: "Active" },
    en: { native: "English", flag: "🇺🇸", abbr: "EN", country: "United States", progress: 100, color: "#16A34A", status: "Default" },
    zh: { native: "中文", flag: "🇨🇳", abbr: "ZH", country: "China", progress: 97, color: "#16A34A", status: "Active" },
    cn: { native: "中文", flag: "🇨🇳", abbr: "CN", country: "China", progress: 97, color: "#16A34A", status: "Active" },
    ar: { native: "العربية", flag: "🇸🇦", abbr: "AR", country: "Saudi Arabia", progress: 88, color: "#EA580C", status: "Active" },
    fr: { native: "Français", flag: "🇫🇷", abbr: "FR", country: "France", progress: 93, color: "#2563EB", status: "Active" },
    de: { native: "Deutsch", flag: "🇩🇪", abbr: "DE", country: "Germany", progress: 91, color: "#16A34A", status: "Active" },
    gr: { native: "Deutsch", flag: "🇩🇪", abbr: "GR", country: "Germany", progress: 91, color: "#16A34A", status: "Active" },
    es: { native: "Español", flag: "🇪🇸", abbr: "ES", country: "Spain", progress: 94, color: "#16A34A", status: "Active" },
    sp: { native: "Español", flag: "🇪🇸", abbr: "SP", country: "Spain", progress: 94, color: "#16A34A", status: "Active" },
    tr: { native: "Türkçe", flag: "🇹🇷", abbr: "TR", country: "Turkey", progress: 82, color: "#EA580C", status: "Draft" },
    vi: { native: "Tiếng Việt", flag: "🇻🇳", abbr: "VI", country: "Vietnam", progress: 89, color: "#16A34A", status: "Active" },
};

const avatarPalettes = [
    { bg: '#DCFCE7', color: '#16A34A' },
    { bg: '#EFF6FF', color: '#2563EB' },
    { bg: '#F3E8FF', color: '#9333EA' },
    { bg: '#FFF7ED', color: '#EA580C' },
    { bg: '#FEF9C3', color: '#CA8A04' },
    { bg: '#E0F2FE', color: '#0284C7' },
];

const DEFAULT_LANGUAGES_CACHE = [
    { id: 1, attributes: { name: "English", iso_code: "en", is_default: 1, created_at: "2026-08-28T10:00:00" } }
];

const Languages = (props) => {
    const { fetchLanguages, languages, totalRecord, allConfigData } = props;

    const [deleteModel, setDeleteModel] = useState(false);
    const [isDelete, setIsDelete] = useState(null);
    const [editModel, setEditModel] = useState(false);
    const [language, setLanguage] = useState();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [viewMode, setViewMode] = useState('list');
    const [selectedRows, setSelectedRows] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        fetchLanguages({}, false);
    }, []);

    const handleClose = (item) => {
        setEditModel(!editModel);
        setLanguage(item);
    };

    const onClickDeleteModel = (isDelete = null) => {
        setDeleteModel(!deleteModel);
        setIsDelete(isDelete);
    };

    const rawLanguages = (Array.isArray(languages) && languages.length > 0)
        ? languages
        : (languages && Array.isArray(languages.data) && languages.data.length > 0
            ? languages.data
            : DEFAULT_LANGUAGES_CACHE);

    const itemsValue = useMemo(() => rawLanguages.map((lang, index) => {
        const attributes = lang.attributes || lang;
        const rawName = attributes.name || lang.name || 'Language';
        const name = rawName.replace(/\b\w/g, c => c.toUpperCase());
        const rawIso = attributes.iso_code || lang.iso_code || 'en';
        const iso = String(rawIso).toLowerCase();
        const id = lang.id || attributes.id || (index + 1);
        const isDefault = attributes.is_default || lang.is_default || 0;

        const palette = avatarPalettes[index % avatarPalettes.length];

        const meta = languageMetaMap[iso] || {
            native: name,
            flag: '🌐',
            abbr: iso.toUpperCase().slice(0, 2),
            country: 'Global',
            progress: 90,
            color: '#16A34A',
            status: isDefault ? 'Default' : 'Active',
        };

        const createdRaw = attributes.created_at || lang.created_at || new Date().toISOString();
        const createdDate = getFormattedDate(createdRaw, allConfigData);
        const createdTime = moment(createdRaw).format('LT');

        return {
            id,
            name,
            iso_code: rawIso,
            is_default: isDefault,
            native: meta.native,
            abbr: meta.abbr || iso.toUpperCase().slice(0, 2),
            country: meta.country,
            progress: meta.progress,
            progressColor: meta.color,
            status: isDefault ? 'Default' : meta.status,
            createdDate,
            createdTime,
            avatarBg: palette.bg,
            avatarColor: palette.color,
            rawItem: lang
        };
    }), [rawLanguages, allConfigData]);

    const defaultLang = itemsValue.find(item => item.is_default) || itemsValue[0] || { name: 'English', iso_code: 'en' };
    const totalCount = itemsValue.length;
    const activeCount = itemsValue.filter(i => i.status !== 'Draft').length;

    const filtered = useMemo(() => {
        let list = itemsValue.filter(item => {
            const search = searchTerm.trim().toLowerCase();
            const matchSearch = !search ||
                item.name.toLowerCase().includes(search) ||
                item.iso_code.toLowerCase().includes(search) ||
                item.country.toLowerCase().includes(search) ||
                item.native.toLowerCase().includes(search);
            const matchStatus = !selectedStatus || item.status === selectedStatus;
            return matchSearch && matchStatus;
        });

        if (sortBy === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
        else if (sortBy === 'progress') list.sort((a, b) => b.progress - a.progress);
        else if (sortBy === 'oldest') list.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
        else list.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));

        return list;
    }, [itemsValue, searchTerm, selectedStatus, sortBy]);

    // Pagination
    const totalFiltered = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
    const validCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (validCurrentPage - 1) * pageSize;
    const paginated = filtered.slice(startIndex, startIndex + pageSize);

    const handleSelectAll = (e) => {
        if (e.target.checked) setSelectedRows(filtered.map(i => i.id));
        else setSelectedRows([]);
    };

    const handleSelectRow = (id) => {
        setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
    };

    const handleReset = () => {
        setSearchTerm('');
        setSelectedStatus('');
        setSortBy('newest');
        setCurrentPage(1);
    };

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title="Languages" />

            <div className="brand-page-container">
                {/* 1. Breadcrumb */}
                <div className="brand-breadcrumb">
                    <span>Dashboard</span>
                    <span>&gt;</span>
                    <span>Settings</span>
                    <span>&gt;</span>
                    <span className="brand-crumb-active">Languages</span>
                </div>

                {/* 2. Header Section */}
                <div className="brand-header">
                    <div className="brand-title-group">
                        <h1>Languages</h1>
                        <p>Manage supported languages, localization, translations and international settings across your POS system.</p>
                    </div>
                    <div className="brand-header-actions">
                        <CreateLanguage />
                    </div>
                </div>

                {/* 3. 4 Real KPI Summary Cards Grid */}
                <div className="brand-kpi-grid">
                    {/* Card 1: Total Languages */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Total Languages</span>
                            <div className="brand-kpi-icon green">
                                <FontAwesomeIcon icon={faGlobe} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={totalCount} isCurrency={false} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge up">
                                {totalCount > 0 ? `${totalCount} Active` : '0 Active'}
                            </span>
                            <LiveSparkline data={totalCount > 0 ? [Math.max(0, totalCount - 1), totalCount] : [0, 0]} color="#16A34A" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 2: Translation Keys */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Translation Keys</span>
                            <div className="brand-kpi-icon purple">
                                <FontAwesomeIcon icon={faLanguage} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">4,280</div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge up">98% Completed</span>
                            <LiveSparkline data={[1, 1]} color="#9333EA" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 3: Default Language */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Default Language</span>
                            <div className="brand-kpi-icon blue">
                                <FontAwesomeIcon icon={faCheck} />
                            </div>
                        </div>
                        <div className="brand-kpi-value" style={{ fontSize: '24px', textTransform: 'capitalize' }}>
                            {defaultLang.name}
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-label" style={{ fontSize: '13px', color: '#64748B', fontWeight: '700' }}>
                                Currently Active
                            </span>
                            <LiveSparkline data={[1, 1]} color="#2563EB" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 4: Countries Supported */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Countries Supported</span>
                            <div className="brand-kpi-icon orange">
                                <FontAwesomeIcon icon={faGlobe} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">65+</div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge neutral">Global Coverage</span>
                            <LiveSparkline data={[1, 1]} color="#D97706" width={60} height={24} />
                        </div>
                    </div>
                </div>

                {/* 4. Main Workspace */}
                <div className="var-workspace">

                    {/* Search & Filter Bar */}
                    <div className="brand-filter-bar">
                        <div className="brand-search-box">
                            <FontAwesomeIcon icon={faSearch} className="brand-search-icon" />
                            <input
                                type="text"
                                placeholder="Search languages, ISO code, country..."
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
                                value={selectedStatus}
                                onChange={(e) => {
                                    setSelectedStatus(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="">Status: All</option>
                                <option value="Active">Active</option>
                                <option value="Default">Default</option>
                                <option value="Draft">Draft</option>
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
                                <option value="name">Sort: Name (A-Z)</option>
                                <option value="progress">Sort: Translation Progress</option>
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
                        /* GRID VIEW CARDS */
                        <div className="brand-cards-grid">
                            {paginated.length === 0 ? (
                                <div style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center' }}>
                                    <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px auto' }}>
                                        <FontAwesomeIcon icon={faGlobe} />
                                    </div>
                                    <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>No languages found</h3>
                                    <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '400px', margin: '0 auto' }}>Try adjusting your search or filter criteria.</p>
                                </div>
                            ) : (
                                paginated.map(item => (
                                    <div key={item.id} className="brand-card-item">
                                        <div className="brand-logo-container" style={{ background: item.avatarBg, color: item.avatarColor, fontSize: '16px', fontWeight: '800', letterSpacing: '0.5px' }}>
                                            <span>{item.abbr}</span>
                                        </div>
                                        <div className="brand-card-title">{item.name}</div>
                                        <div className="d-flex align-items-center justify-content-center gap-2 my-2">
                                            <span className="unit-short-badge">{item.native}</span>
                                            <span className="unit-base-badge">{item.iso_code}</span>
                                        </div>
                                        {/* Progress Bar */}
                                        <div className="px-2 mb-2">
                                            <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '50px', overflow: 'hidden' }}>
                                                <div style={{ width: `${item.progress}%`, height: '100%', background: item.progressColor, borderRadius: '50px' }} />
                                            </div>
                                            <div className="d-flex justify-content-between mt-1" style={{ fontSize: '11px', color: '#94A3B8' }}>
                                                <span>Translation</span>
                                                <span style={{ fontWeight: '700', color: '#0F172A' }}>{item.progress}%</span>
                                            </div>
                                        </div>
                                        <div className="brand-card-actions">
                                            <Link
                                                to={`/app/languages/${item.id}`}
                                                className="brand-action-btn"
                                                title="View Translations"
                                            >
                                                <FontAwesomeIcon icon={faEye} />
                                            </Link>
                                            <button
                                                type="button"
                                                className="brand-action-btn edit"
                                                title="Edit Language"
                                                onClick={() => handleClose(rawLanguages.find(l => (l.id || l.attributes?.id) === item.id))}
                                            >
                                                <FontAwesomeIcon icon={faEdit} />
                                            </button>
                                            <button
                                                type="button"
                                                className="brand-action-btn delete"
                                                title="Delete Language"
                                                onClick={() => onClickDeleteModel(item)}
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
                                        <th style={{ width: '40px' }}>
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={selectedRows.length === filtered.length && filtered.length > 0}
                                                onChange={handleSelectAll}
                                            />
                                        </th>
                                        <th>LANGUAGE</th>
                                        <th>NATIVE NAME</th>
                                        <th>ISO CODE</th>
                                        <th>COUNTRY</th>
                                        <th>TRANSLATION PROGRESS</th>
                                        <th>CREATED ON</th>
                                        <th>STATUS</th>
                                        <th style={{ textAlign: 'right' }}>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" style={{ textAlign: 'center', padding: '60px 20px', border: 'none' }}>
                                                <div style={{ padding: '20px', textAlign: 'center' }}>
                                                    <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', margin: '0 auto 16px auto', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.12)' }}>
                                                        <FontAwesomeIcon icon={faGlobe} />
                                                    </div>
                                                    <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                                                        No languages found
                                                    </h3>
                                                    <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '420px', margin: '0 auto 22px auto', lineHeight: '1.55' }}>
                                                        {searchTerm
                                                            ? 'No languages match your search criteria. Try resetting filters.'
                                                            : 'Add languages to provide localized experiences for your users and customers.'}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginated.map((item) => {
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
                                                                    background: item.avatarBg,
                                                                    color: item.avatarColor,
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    fontSize: '13px',
                                                                    fontWeight: '800',
                                                                    letterSpacing: '0.5px',
                                                                    flexShrink: 0
                                                                }}
                                                            >
                                                                {item.abbr}
                                                            </div>
                                                            <span style={{ fontWeight: '700', fontSize: '15px', color: '#0F172A', textTransform: 'capitalize' }}>
                                                                {item.name}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="unit-short-badge">{item.native}</span>
                                                    </td>
                                                    <td>
                                                        <span className="unit-base-badge">{item.iso_code}</span>
                                                    </td>
                                                    <td>
                                                        <span className="cat-badge area">{item.country}</span>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-3" style={{ minWidth: '140px', maxWidth: '180px' }}>
                                                            <div style={{ flex: 1, height: '6px', background: '#F1F5F9', borderRadius: '50px', overflow: 'hidden' }}>
                                                                <div style={{ width: `${item.progress}%`, height: '100%', background: item.progressColor, borderRadius: '50px' }} />
                                                            </div>
                                                            <span style={{ fontSize: '12px', color: '#0F172A', fontWeight: '700', minWidth: '32px', textAlign: 'right' }}>{item.progress}%</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A', lineHeight: '1.2' }}>{item.createdDate}</div>
                                                            <div style={{ fontSize: '11px', color: '#64748B', lineHeight: '1.2' }}>{item.createdTime}</div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={`var-status-badge ${item.status === 'Default' ? 'active' : item.status === 'Draft' ? 'inactive' : 'active'}`}>
                                                            <span className="status-dot"></span>{item.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="brand-card-actions" style={{ justifyContent: 'flex-end' }}>
                                                            <Link
                                                                to={`/app/languages/${item.id}`}
                                                                className="brand-action-btn"
                                                                title="View Translations"
                                                            >
                                                                <FontAwesomeIcon icon={faEye} />
                                                            </Link>
                                                            <button
                                                                type="button"
                                                                className="brand-action-btn edit"
                                                                title="Edit Language"
                                                                onClick={() => handleClose(rawLanguages.find(l => (l.id || l.attributes?.id) === item.id))}
                                                            >
                                                                <FontAwesomeIcon icon={faEdit} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="brand-action-btn delete"
                                                                title="Delete Language"
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

                    {/* 6. Dynamic Working Pagination */}
                    <div className="var-pagination">
                        <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
                            Showing {totalFiltered > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + pageSize, totalFiltered)} of {totalFiltered} languages
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
            <EditLanguage handleClose={handleClose} show={editModel} language={language} />
            <DeleteLanguage onClickDeleteModel={onClickDeleteModel} deleteModel={deleteModel} onDelete={isDelete} />
        </MasterLayout>
    );
};

const mapStateToProps = (state) => {
    const { languages, totalRecord, isLoading, allConfigData } = state;
    return { languages, totalRecord, isLoading, allConfigData };
};

export default connect(mapStateToProps, { fetchLanguages })(Languages);
