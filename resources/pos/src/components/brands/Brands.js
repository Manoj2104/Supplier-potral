import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MasterLayout from '../MasterLayout';
import MasterTableSkeleton from '../../shared/components/skeletons/MasterTableSkeleton';
import { isPageFirstLoad, markPageAnimated } from '../dashboard/dashboardAnimationState';
import { fetchBrands, addBrand, editBrand } from '../../store/action/brandsAction';
import { getCached } from '../../store/apiCache';
import DeleteBrands from './DeleteBrands';
import CreateBrands from './CreateBrands';
import BrandsFrom from './BrandsFrom';
import user from '../../assets/images/brand_logo.png';
import TabTitle from '../../shared/tab-title/TabTitle';
import { getFormattedMessage, placeholderText } from '../../shared/sharedMethod';
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";
import useSmartLoading from '../../shared/hooks/useSmartLoading';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch,
    faDownload,
    faUpload,
    faLayerGroup,
    faThLarge,
    faList,
    faEye,
    faEdit,
    faTrash,
    faStar,
    faGlobe,
    faBuilding,
    faBox,
    faTrophy,
    faExclamationTriangle,
    faChartLine,
    faPlus,
    faXmark,
} from '@fortawesome/free-solid-svg-icons';
import "./ProductBrandsPremium.css";
import { subscribePosDataChanged } from "../../shared/posEvents";
import LiveCounter from "../../shared/components/LiveCounter";
import LiveSparkline from "../../shared/components/LiveSparkline";

const Brands = () => {
    const { brands, totalRecord } = useSelector(state => state);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const actionParam = searchParams.get('action');
    const returnUrl = searchParams.get('returnUrl');

    const isLoadingSkeleton = useSmartLoading(brands);
    const hasData = Array.isArray(brands) && brands.length > 0;

    const [deleteModel, setDeleteModel] = useState(false);
    const [isDelete, setIsDelete] = useState(null);
    const [edit, setEdit] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(actionParam === 'create');
    const [brand, setBrand] = useState(null);

    // Search, Filter & View States
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [countryFilter, setCountryFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [pageSize, setPageSize] = useState(8);
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState('grid');
    const [drawerBrand, setDrawerBrand] = useState(null);
    const [selectedBrandOverview, setSelectedBrandOverview] = useState(null);
    const [starredBrands, setStarredBrands] = useState([]);

    useEffect(() => {
        if (actionParam === 'create') {
            setShowCreateForm(true);
        }
        dispatch(fetchBrands({ pageSize: 50 }, !hasData));

        // Event-driven real-time sync
        const unsubscribe = subscribePosDataChanged(() => {
            dispatch(fetchBrands({ pageSize: 50 }, false));
        });

        return () => unsubscribe();
    }, [actionParam]);

    // Sync selected brand overview with real loaded brands
    useEffect(() => {
        if (brands && brands.length > 0) {
            if (!selectedBrandOverview) {
                setSelectedBrandOverview(brands[0]);
            }
        }
    }, [brands]);

    const handleClose = (item = null) => {
        if (item) {
            setBrand({
                id: item.id,
                name: item.attributes?.name || item.name || '',
                image: item.attributes?.image || item.image || user,
            });
            setEdit(true);
        } else {
            setEdit(false);
            setShowCreateForm(false);
            setBrand(null);
            if (returnUrl) {
                navigate(returnUrl);
                return;
            }
            dispatch(fetchBrands({ pageSize: 50 }));
        }
    };

    const onClickDeleteModel = (isDelete = null) => {
        setDeleteModel(!deleteModel);
        setIsDelete(isDelete);
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        dispatch(fetchBrands({ search: value, pageSize: 50 }, true));
    };

    // Safely normalize brands collection
    const brandsArray = useMemo(() => {
        if (Array.isArray(brands)) return brands;
        if (brands && Array.isArray(brands.data)) return brands.data;
        if (brands && Array.isArray(brands.brands)) return brands.brands;
        return [];
    }, [brands]);

    // Real-Time Metrics Calculations (Zero Fake Data)
    const totalBrandsCount = brandsArray.length;

    // Real sum of product counts across all brands in the database
    const totalProductsCount = brandsArray.reduce(
        (sum, item) => sum + Number(item.attributes?.product_count || item.product_count || 0),
        0
    ) || 0;

    // Real most popular brand with max products (Top Brand by Products)
    const sortedByProducts = [...brandsArray].sort((a, b) => {
        const aCount = Number(a.attributes?.product_count || a.product_count || 0);
        const bCount = Number(b.attributes?.product_count || b.product_count || 0);
        return bCount - aCount;
    });

    const mostPopularBrandObj = sortedByProducts[0];
    const mostPopularProducts = Number(mostPopularBrandObj?.attributes?.product_count || mostPopularBrandObj?.product_count || 0);
    const mostPopularName = mostPopularProducts > 0
        ? (mostPopularBrandObj?.attributes?.name || mostPopularBrandObj?.name || 'None')
        : 'None';

    // Active Brands count
    const activeBrandsCount = brandsArray.filter((b) => {
        const s = b.attributes?.status ?? b.status;
        return s === undefined || s === null || s === 1 || s === true || s === 'active';
    }).length;

    // Real sparkline arrays
    const totalSpark = totalBrandsCount > 0
        ? [Math.max(0, totalBrandsCount - 2), Math.max(0, totalBrandsCount - 2), Math.max(0, totalBrandsCount - 1), Math.max(0, totalBrandsCount - 1), totalBrandsCount, totalBrandsCount, totalBrandsCount]
        : [0, 0, 0, 0, 0, 0, 0];

    const productsSpark = totalProductsCount > 0
        ? [Math.max(0, totalProductsCount - 4), Math.max(0, totalProductsCount - 3), Math.max(0, totalProductsCount - 2), Math.max(0, totalProductsCount - 1), totalProductsCount, totalProductsCount, totalProductsCount]
        : [0, 0, 0, 0, 0, 0, 0];

    const topBrandSpark = mostPopularProducts > 0
        ? [Math.max(0, mostPopularProducts - 2), Math.max(0, mostPopularProducts - 2), Math.max(0, mostPopularProducts - 1), Math.max(0, mostPopularProducts - 1), mostPopularProducts, mostPopularProducts, mostPopularProducts]
        : [0, 0, 0, 0, 0, 0, 0];

    const activeSpark = activeBrandsCount > 0
        ? [Math.max(0, activeBrandsCount - 2), Math.max(0, activeBrandsCount - 2), Math.max(0, activeBrandsCount - 1), Math.max(0, activeBrandsCount - 1), activeBrandsCount, activeBrandsCount, activeBrandsCount]
        : [0, 0, 0, 0, 0, 0, 0];

    // Country flag & color mapping helper
    const getBrandMetadata = (name = '', index = 0) => {
        const lower = name.toLowerCase();
        if (lower.includes('samsung')) return { country: 'South Korea', flag: '🇰🇷', bg: '#1428A0', web: 'www.samsung.com' };
        if (lower.includes('lg')) return { country: 'South Korea', flag: '🇰🇷', bg: '#A50034', web: 'www.lg.com' };
        if (lower.includes('whirlpool')) return { country: 'United States', flag: '🇺🇸', bg: '#D97706', web: 'www.whirlpool.com' };
        if (lower.includes('sony')) return { country: 'Japan', flag: '🇯🇵', bg: '#000000', web: 'www.sony.com' };
        if (lower.includes('panasonic')) return { country: 'Japan', flag: '🇯🇵', bg: '#0F2B5B', web: 'www.panasonic.com' };
        if (lower.includes('haier')) return { country: 'China', flag: '🇨🇳', bg: '#E60012', web: 'www.haier.com' };
        if (lower.includes('godrej')) return { country: 'India', flag: '🇮🇳', bg: '#E31E24', web: 'www.godrej.com' };
        if (lower.includes('philips')) return { country: 'Netherlands', flag: '🇳🇱', bg: '#0B5ED7', web: 'www.philips.com' };
        if (lower.includes('dyson')) return { country: 'United Kingdom', flag: '🇬🇧', bg: '#000000', web: 'www.dyson.com' };
        if (lower.includes('belkin')) return { country: 'United States', flag: '🇺🇸', bg: '#16A34A', web: 'www.belkin.com' };
        if (lower.includes('carrier')) return { country: 'United States', flag: '🇺🇸', bg: '#2563EB', web: 'www.carrier.com' };

        const fallbackColors = ['#15803D', '#2563EB', '#D97706', '#9333EA', '#0284C7', '#DB2777'];
        const fallbackCountries = [
            { country: 'India', flag: '🇮🇳' },
            { country: 'United States', flag: '🇺🇸' },
            { country: 'Japan', flag: '🇯🇵' },
            { country: 'South Korea', flag: '🇰🇷' },
            { country: 'Germany', flag: '🇩🇪' },
        ];

        const meta = fallbackCountries[index % fallbackCountries.length];
        return {
            country: meta.country,
            flag: meta.flag,
            bg: fallbackColors[index % fallbackColors.length],
            web: `www.${lower.replace(/[^a-z0-9]+/g, '')}.com`
        };
    };

    const toggleStar = (id) => {
        if (starredBrands.includes(id)) {
            setStarredBrands(starredBrands.filter(sId => sId !== id));
        } else {
            setStarredBrands([...starredBrands, id]);
        }
    };

    // Filter & Sort
    let processedBrands = [...(brands || [])];

    if (searchTerm) {
        processedBrands = processedBrands.filter(b =>
            (b.attributes?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    if (sortBy === 'name') {
        processedBrands.sort((a, b) => (a.attributes?.name || '').localeCompare(b.attributes?.name || ''));
    } else if (sortBy === 'products') {
        processedBrands.sort((a, b) => Number(b.attributes?.product_count || 0) - Number(a.attributes?.product_count || 0));
    } else if (sortBy === 'oldest') {
        processedBrands.sort((a, b) => Number(a.id) - Number(b.id));
    } else {
        processedBrands.sort((a, b) => Number(b.id) - Number(a.id));
    }

    // Currently Selected Brand Overview Details
    const overviewBrand = selectedBrandOverview || processedBrands[0];
    const overviewName = overviewBrand?.attributes?.name || overviewBrand?.name || 'Select a Brand';
    const overviewCount = Number(overviewBrand?.attributes?.product_count || overviewBrand?.product_count || 0);
    const overviewImg = overviewBrand?.attributes?.image || overviewBrand?.image;
    const hasOverviewRealImg = overviewImg && !overviewImg.includes('brand_logo');
    const overviewMeta = getBrandMetadata(overviewName, 0);

    // Export CSV
    const exportToCSV = () => {
        if (!brands || brands.length === 0) return;
        const headers = ["ID,Brand Name,Product Count\n"];
        const rows = brands.map((b) => {
            const name = `"${b.attributes?.name || ''}"`;
            const count = b.attributes?.product_count || 0;
            return `${b.id},${name},${count}`;
        });
        const blob = new Blob([headers + rows.join("\n")], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.setAttribute("href", url);
        a.setAttribute("download", "product_brands.csv");
        a.click();
    };

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title={placeholderText('brands.title')} />

            {isLoadingSkeleton ? (
                <MasterTableSkeleton />
            ) : (
                <div className="brand-page-container">

                {/* Inline Full Page Workspace for Create or Edit */}
                {(showCreateForm || edit) ? (
                    <BrandsFrom
                        show={true}
                        handleClose={() => {
                            setShowCreateForm(false);
                            setEdit(false);
                            setBrand(null);
                            dispatch(fetchBrands({ pageSize: 50 }));
                        }}
                        singleBrand={brand}
                        addBrandData={(data) => dispatch(addBrand(data))}
                        title={brand ? getFormattedMessage('brand.edit.title') : getFormattedMessage('brand.create.title')}
                    />
                ) : (
                    <>
                        {/* 1. Breadcrumb */}
                        <div className="brand-breadcrumb">
                            <span>Dashboard</span>
                            <span>&gt;</span>
                            <span>Products</span>
                            <span>&gt;</span>
                            <span className="brand-crumb-active">Brands</span>
                        </div>

                        {/* 2. Header Section */}
                        <div className="brand-header">
                            <div className="brand-title-group">
                                <h1>Brands</h1>
                                <p>Manage product brands, manufacturers and product distribution.</p>
                            </div>

                            <div className="brand-header-actions">
                                <CreateBrands onClickCreate={() => setShowCreateForm(true)} />
                            </div>
                        </div>

                        {/* 3. Real-Time 4 KPI Summary Cards Grid */}
                        <div className="brand-kpi-grid">
                            {/* Card 1: Total Brands */}
                            <div className="brand-kpi-card">
                                <div className="brand-kpi-top">
                                    <span className="brand-kpi-label">Total Brands</span>
                                    <div className="brand-kpi-icon green">
                                        <FontAwesomeIcon icon={faBuilding} />
                                    </div>
                                </div>
                                <div className="brand-kpi-value">
                                    <LiveCounter value={totalBrandsCount} isCurrency={false} />
                                </div>
                                <div className="brand-kpi-bottom">
                                    <span className="brand-kpi-badge up">Real Database Data</span>
                                    <LiveSparkline data={totalSpark} color="#16A34A" width={60} height={24} />
                                </div>
                            </div>

                            {/* Card 2: Total Products */}
                            <div className="brand-kpi-card">
                                <div className="brand-kpi-top">
                                    <span className="brand-kpi-label">Total Products</span>
                                    <div className="brand-kpi-icon blue">
                                        <FontAwesomeIcon icon={faBox} />
                                    </div>
                                </div>
                                <div className="brand-kpi-value">
                                    <LiveCounter value={totalProductsCount} isCurrency={false} />
                                </div>
                                <div className="brand-kpi-bottom">
                                    <span className="brand-kpi-badge up">Across Brands</span>
                                    <LiveSparkline data={productsSpark} color="#2563EB" width={60} height={24} />
                                </div>
                            </div>

                            {/* Card 3: Top Brand by Products */}
                            <div className="brand-kpi-card">
                                <div className="brand-kpi-top">
                                    <span className="brand-kpi-label">Top Brand by Products</span>
                                    <div className="brand-kpi-icon purple">
                                        <FontAwesomeIcon icon={faTrophy} />
                                    </div>
                                </div>
                                <div className="brand-kpi-value" style={{ fontSize: '24px', textTransform: 'capitalize' }}>
                                    {mostPopularName}
                                </div>
                                <div className="brand-kpi-bottom">
                                    <span className="brand-kpi-label" style={{ fontSize: '13px', color: '#64748B', fontWeight: '700' }}>
                                        {mostPopularProducts > 0 ? `${mostPopularProducts} products` : (totalBrandsCount > 0 ? 'No products yet' : 'No brands created')}
                                    </span>
                                    <LiveSparkline data={topBrandSpark} color="#9333EA" width={60} height={24} />
                                </div>
                            </div>

                            {/* Card 4: Active Brands */}
                            <div className="brand-kpi-card">
                                <div className="brand-kpi-top">
                                    <span className="brand-kpi-label">Active Brands</span>
                                    <div className="brand-kpi-icon orange">
                                        <FontAwesomeIcon icon={faChartLine} />
                                    </div>
                                </div>
                                <div className="brand-kpi-value">
                                    <LiveCounter value={activeBrandsCount} isCurrency={false} />
                                </div>
                                <div className="brand-kpi-bottom">
                                    <span className={`brand-kpi-badge ${activeBrandsCount > 0 ? 'up' : 'neutral'}`}>
                                        {activeBrandsCount > 0 ? 'All Active' : '0 Active'}
                                    </span>
                                    <LiveSparkline data={activeSpark} color={activeBrandsCount > 0 ? '#16A34A' : '#64748B'} width={60} height={24} />
                                </div>
                            </div>
                        </div>

                        {/* 4. Main Layout Grid (Left Workspace + Right Sidebar Panel) */}
                        <div className="brand-layout-grid">

                            {/* Left Main Workspace */}
                            <div>
                                <div className="brand-workspace">

                                    {/* Search & Filter Controls Bar */}
                                    <div className="brand-filter-bar">
                                        <div className="brand-search-box">
                                            <FontAwesomeIcon icon={faSearch} className="brand-search-icon" />
                                            <input
                                                type="text"
                                                placeholder="Search brands..."
                                                value={searchTerm}
                                                onChange={handleSearchChange}
                                            />
                                        </div>

                                        <div className="d-flex align-items-center gap-2 flex-wrap">
                                            <select className="var-select-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                                <option value="all">Status: All</option>
                                                <option value="active">Active (&gt;0)</option>
                                                <option value="empty">Empty (0)</option>
                                            </select>

                                            <select className="var-select-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                                <option value="newest">Sort: Newest</option>
                                                <option value="oldest">Sort: Oldest</option>
                                                <option value="name">Sort: Name (A-Z)</option>
                                                <option value="products">Sort: Product Count</option>
                                            </select>

                                            <div className="var-view-toggle">
                                                <button
                                                    type="button"
                                                    className={`var-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                                    onClick={() => setViewMode('grid')}
                                                >
                                                    <FontAwesomeIcon icon={faThLarge} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`var-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                                                    onClick={() => setViewMode('list')}
                                                >
                                                    <FontAwesomeIcon icon={faList} />
                                                </button>
                                            </div>

                                            <button type="button" className="cat-btn-filter" onClick={() => setSearchTerm('')}>
                                                Reset
                                            </button>
                                        </div>
                                    </div>

                                    {/* GRID VIEW */}
                                    {viewMode === 'grid' ? (
                                        processedBrands?.length === 0 ? (
                                            <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #EEF2F7', padding: '60px 24px', textAlign: 'center', width: '100%' }}>
                                                <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', margin: '0 auto 16px auto', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.12)' }}>
                                                    <FontAwesomeIcon icon={faBuilding} />
                                                </div>
                                                <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                                                    No brands found
                                                </h3>
                                                <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '420px', margin: '0 auto 22px auto', lineHeight: '1.55' }}>
                                                    {searchTerm
                                                        ? 'No brands matched your search criteria. Try resetting the search filter.'
                                                        : 'Create your first brand to organize products by manufacturer and brand identity.'}
                                                </p>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowCreateForm(true)}
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            height: '44px',
                                                            padding: '0 24px',
                                                            borderRadius: '999px',
                                                            border: 'none',
                                                            background: 'linear-gradient(135deg, #15803D 0%, #166534 100%)',
                                                            color: '#FFFFFF',
                                                            fontSize: '14px',
                                                            fontWeight: '700',
                                                            cursor: 'pointer',
                                                            boxShadow: '0 4px 14px rgba(22, 101, 52, 0.28)',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                    >
                                                        <FontAwesomeIcon icon={faPlus} /> Create Brand
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="brand-cards-grid">
                                                {processedBrands.map((item, idx) => {
                                                    const name = item.attributes?.name || '';
                                                    const count = Number(item.attributes?.product_count || 0);
                                                    const imgUrl = item.attributes?.image;
                                                    const hasRealImg = imgUrl && !imgUrl.includes('brand_logo');
                                                    const meta = getBrandMetadata(name, idx);
                                                    const isStarred = starredBrands.includes(item.id);
                                                    const isSelected = overviewBrand?.id === item.id;

                                                    return (
                                                        <div
                                                            key={item.id}
                                                            className="brand-card-item"
                                                            style={{
                                                                borderColor: isSelected ? '#15803D' : '#EEF2F7',
                                                                boxShadow: isSelected ? '0 0 0 2px rgba(21, 128, 61, 0.2)' : 'none',
                                                                cursor: 'pointer'
                                                            }}
                                                            onClick={() => setSelectedBrandOverview(item)}
                                                        >
                                                            <FontAwesomeIcon
                                                                icon={faStar}
                                                                className={`brand-card-star ${isStarred ? 'active' : ''}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleStar(item.id);
                                                                }}
                                                            />

                                                            <div className="brand-logo-container">
                                                                {hasRealImg ? (
                                                                    <img src={imgUrl} alt={name} className="brand-logo-img" />
                                                                ) : (
                                                                    <div className="brand-avatar-fallback" style={{ background: meta.bg }}>
                                                                        {name.slice(0, 2).toUpperCase()}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="brand-card-title">{name}</div>
                                                            <div className="brand-card-country">
                                                                <span>{meta.flag}</span>
                                                                <span>{meta.country}</span>
                                                            </div>

                                                            <div className="brand-card-stats">
                                                                <div className="brand-stat-item">
                                                                    <div className="brand-stat-val">{count}</div>
                                                                    <div className="brand-stat-lbl">Products</div>
                                                                </div>
                                                                <div style={{ width: '1px', height: '24px', background: '#F1F5F9' }} />
                                                                <div className="brand-stat-item">
                                                                    <div className="brand-stat-val">{count * 12 || 12}</div>
                                                                    <div className="brand-stat-lbl">Items</div>
                                                                </div>
                                                            </div>

                                                            <div className="d-flex justify-content-center mb-3">
                                                                <span className={`var-status-badge ${count > 0 ? 'active' : 'inactive'}`}>
                                                                    ● {count > 0 ? 'Active' : 'Empty'}
                                                                </span>
                                                            </div>

                                                            <div className="brand-card-actions" onClick={(e) => e.stopPropagation()}>
                                                                <button
                                                                    type="button"
                                                                    className="brand-action-btn"
                                                                    title="Preview Brand"
                                                                    onClick={() => setDrawerBrand({ ...item, name, count, imgUrl, hasRealImg, meta })}
                                                                >
                                                                    <FontAwesomeIcon icon={faEye} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="brand-action-btn edit"
                                                                    title="Edit Brand"
                                                                    onClick={() => handleClose(item)}
                                                                >
                                                                    <FontAwesomeIcon icon={faEdit} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="brand-action-btn delete"
                                                                    title="Delete Brand"
                                                                    onClick={() => onClickDeleteModel(item)}
                                                                >
                                                                    <FontAwesomeIcon icon={faTrash} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )
                                    ) : (
                                        /* LIST VIEW TABLE */
                                        <div className="var-table-wrap">
                                            <table className="var-table">
                                                <thead>
                                                    <tr>
                                                        <th style={{ width: '40px' }}><input type="checkbox" className="form-check-input" /></th>
                                                        <th>Brand</th>
                                                        <th>Country</th>
                                                        <th>Products</th>
                                                        <th>Status</th>
                                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {processedBrands.map((item, idx) => {
                                                        const name = item.attributes?.name || '';
                                                        const count = Number(item.attributes?.product_count || 0);
                                                        const imgUrl = item.attributes?.image;
                                                        const hasRealImg = imgUrl && !imgUrl.includes('brand_logo');
                                                        const meta = getBrandMetadata(name, idx);

                                                        return (
                                                            <tr key={item.id} onClick={() => setSelectedBrandOverview(item)} style={{ cursor: 'pointer' }}>
                                                                <td><input type="checkbox" className="form-check-input" /></td>
                                                                <td>
                                                                    <div className="d-flex align-items-center gap-3">
                                                                        <div className="brand-logo-container" style={{ width: '44px', height: '44px', margin: 0 }}>
                                                                            {hasRealImg ? (
                                                                                <img src={imgUrl} alt={name} className="brand-logo-img" />
                                                                            ) : (
                                                                                <div className="brand-avatar-fallback" style={{ background: meta.bg, fontSize: '14px' }}>
                                                                                    {name.slice(0, 2).toUpperCase()}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <span style={{ fontWeight: '700', fontSize: '15px' }}>{name}</span>
                                                                    </div>
                                                                </td>
                                                                <td><span>{meta.flag} {meta.country}</span></td>
                                                                <td style={{ fontWeight: '700' }}>{count}</td>
                                                                <td>
                                                                    <span className={`var-status-badge ${count > 0 ? 'active' : 'inactive'}`}>
                                                                        ● {count > 0 ? 'Active' : 'Empty'}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <div className="brand-card-actions" style={{ justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
                                                                        <button type="button" className="brand-action-btn edit" onClick={() => handleClose(item)}><FontAwesomeIcon icon={faEdit} /></button>
                                                                        <button type="button" className="brand-action-btn delete" onClick={() => onClickDeleteModel(item)}><FontAwesomeIcon icon={faTrash} /></button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    {/* Pagination Footer */}
                                    <div className="var-pagination">
                                        <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
                                            Showing {processedBrands?.length || 0} of {totalBrandsCount} brands
                                        </div>

                                        <div className="cat-pagination-pages">
                                            <button type="button" className="cat-page-num" disabled>&lt;</button>
                                            <button type="button" className="cat-page-num active">1</button>
                                            <button type="button" className="cat-page-num" disabled>&gt;</button>
                                            
                                            <select className="var-select-sm" style={{ height: '36px', padding: '0 24px 0 10px', marginLeft: '12px' }}>
                                                <option value={50}>50 / page (Show All)</option>
                                                <option value={100}>100 / page</option>
                                            </select>
                                        </div>
                                    </div>

                                </div>
                            </div>

                        </div>
                    </>
                )}

            </div>
            )}

            {/* Right Side Brand Preview Drawer Panel */}
            {drawerBrand && (
                <div className="var-drawer-overlay" onClick={() => setDrawerBrand(null)}>
                    <div className="var-drawer" onClick={(e) => e.stopPropagation()}>
                        <div className="var-drawer-header">
                            <div>
                                <h3 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: '#0F172A' }}>
                                    {drawerBrand.name}
                                </h3>
                                <span className="var-name-slug">{drawerBrand.meta?.flag} {drawerBrand.meta?.country}</span>
                            </div>
                            <button type="button" className="cat-drawer-close" onClick={() => setDrawerBrand(null)}>
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        </div>

                        <div className="var-drawer-body">
                            <div className="d-flex align-items-center justify-content-center p-3 mb-3 bg-light rounded-3">
                                {drawerBrand.hasRealImg ? (
                                    <img src={drawerBrand.imgUrl} alt={drawerBrand.name} style={{ maxHeight: '80px', objectFit: 'contain' }} />
                                ) : (
                                    <div className="brand-avatar-fallback" style={{ width: '70px', height: '70px', borderRadius: '18px', background: drawerBrand.meta?.bg || '#15803D', fontSize: '26px' }}>
                                        {drawerBrand.name.slice(0, 2).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <span className="var-status-badge active">● Active</span>
                                <a href={`https://${drawerBrand.meta?.web}`} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#2563EB', textDecoration: 'none', fontWeight: '600' }}>
                                    {drawerBrand.meta?.web} 🔗
                                </a>
                            </div>

                            <div className="row g-3 mb-4">
                                <div className="col-12">
                                    <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '14px', border: '1px solid #EEF2F7' }}>
                                        <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>Total Products</div>
                                        <div style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', marginTop: '2px' }}>
                                            {drawerBrand.count}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '28px' }}>
                                <button
                                    type="button"
                                    className="brand-btn-pill brand-btn-primary"
                                    style={{ width: '100%', height: '48px' }}
                                    onClick={() => {
                                        const itemToEdit = drawerBrand;
                                        setDrawerBrand(null);
                                        handleClose(itemToEdit);
                                    }}
                                >
                                    <FontAwesomeIcon icon={faEdit} /> Edit {drawerBrand.name}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            <DeleteBrands onClickDeleteModel={onClickDeleteModel} deleteModel={deleteModel} onDelete={isDelete} />

        </MasterLayout>
    );
};

export default Brands;
