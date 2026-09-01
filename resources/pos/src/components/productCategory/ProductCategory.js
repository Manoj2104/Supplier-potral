import React, { useState, useEffect, useMemo, useRef } from 'react';
import { connect } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MasterLayout from '../MasterLayout';
import { fetchProductCategories, addProductCategory, editProductCategory } from '../../store/action/productCategoryAction';
import DeleteProductCategory from './DeleteProductCategory';
import CreateProductCategory from './CreateProductCategory';
import ProductCategoryForm from './ProductCategoryForm';
import TabTitle from '../../shared/tab-title/TabTitle';
import { getFormattedMessage, placeholderText } from '../../shared/sharedMethod';
import user from '../../assets/images/productCategory_logo.jpeg';
import apiConfig from '../../config/apiConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch,
    faDownload,
    faThLarge,
    faList,
    faEye,
    faEdit,
    faTrash,
    faChevronRight,
    faXmark,
    faFolder,
    faBox,
    faTrophy,
    faExclamationTriangle,
    faCheckCircle,
    faShoppingBag,
    faShoppingCart,
    faTag,
    faTv,
    faMobileAlt,
    faPlus,
    faFolderOpen,
} from '@fortawesome/free-solid-svg-icons';
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";
import useSmartLoading from '../../shared/hooks/useSmartLoading';
import LiveCounter from '../../shared/components/LiveCounter';
import { subscribePosDataChanged } from '../../shared/posEvents';
import "./ProductCategoriesPremium.css";

const ProductCategory = (props) => {
    const {
        fetchProductCategories,
        addProductCategory,
        editProductCategory,
        productCategories,
        totalRecord,
    } = props;

    // Smart loading: instant render if data already in Redux
    const isInitialLoading = useSmartLoading(productCategories);

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const actionParam = searchParams.get('action');
    const returnUrl = searchParams.get('returnUrl');

    const hasData = Array.isArray(productCategories) && productCategories.length > 0;

    const [deleteModel, setDeleteModel] = useState(false);
    const [isDelete, setIsDelete] = useState(null);
    const [editModel, setEditModel] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(actionParam === 'create');
    const [productCategory, setProductCategory] = useState(null);
    
    // Search, Filter, Pagination & System Products State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'empty'
    const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'name', 'count'
    const [pageSize, setPageSize] = useState(50); // Default 50 to show all categories
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRows, setSelectedRows] = useState([]);
    const [drawerCategory, setDrawerCategory] = useState(null);
    const [viewMode, setViewMode] = useState('list');
    const [systemTotalProducts, setSystemTotalProducts] = useState(0);
    const [isApiCompleted, setIsApiCompleted] = useState(hasData);

    const isMounted = useRef(true);

    const loadCategoryData = () => {
        const hasData = Array.isArray(productCategories) && productCategories.length > 0;
        const req = fetchProductCategories({ pageSize, page: currentPage, search: searchTerm }, !hasData);
        if (req && typeof req.finally === 'function') {
            req.finally(() => {
                if (isMounted.current) setIsApiCompleted(true);
            });
        } else {
            setIsApiCompleted(true);
        }
        
        apiConfig.get('/products?page[size]=1')
            .then(res => {
                if (isMounted.current && res?.data?.meta?.total !== undefined) {
                    setSystemTotalProducts(res.data.meta.total);
                }
            })
            .catch(() => null);
    };

    useEffect(() => {
        isMounted.current = true;
        if (actionParam === 'create') {
            setShowCreateForm(true);
        }
        loadCategoryData();

        const unsubscribe = subscribePosDataChanged(() => {
            loadCategoryData();
        });

        return () => {
            isMounted.current = false;
            unsubscribe();
        };
    }, [actionParam, pageSize, currentPage]);

    useEffect(() => {
        if (hasData && !isApiCompleted) {
            setIsApiCompleted(true);
        }
    }, [hasData]);

    const handleCloseForm = () => {
        setShowCreateForm(false);
        setEditModel(false);
        setProductCategory(null);
        if (returnUrl) {
            navigate(returnUrl);
            return;
        }
        fetchProductCategories({ pageSize: 50, page: 1 }, false);
    };

    const handleCloseEdit = (item = null) => {
        if (item) {
            setProductCategory({
                id: item.id,
                name: item.name || item.attributes?.name || '',
                image: item.image || item.attributes?.image || user,
                attributes: item.attributes || {}
            });
            setEditModel(true);
        } else {
            handleCloseForm();
        }
    };

    const onClickDeleteModel = (item = null) => {
        setDeleteModel(!deleteModel);
        setIsDelete(item);
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        fetchProductCategories({ search: value, pageSize, page: 1 }, true);
    };

    const handlePageSizeChange = (e) => {
        const size = Number(e.target.value);
        setPageSize(size);
        setCurrentPage(1);
        fetchProductCategories({ pageSize: size, page: 1 }, true);
    };

    const handlePageChange = (newPage) => {
        if (newPage < 1) return;
        setCurrentPage(newPage);
        fetchProductCategories({ pageSize, page: newPage }, true);
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setSortBy('newest');
        setPageSize(50);
        setCurrentPage(1);
        fetchProductCategories({ pageSize: 50, page: 1 }, true);
    };

    // Safely normalize categories collection
    const categoriesArray = useMemo(() => {
        if (Array.isArray(productCategories)) return productCategories;
        if (productCategories && Array.isArray(productCategories.data)) return productCategories.data;
        if (productCategories && Array.isArray(productCategories.productCategories)) return productCategories.productCategories;
        return [];
    }, [productCategories]);

    // Real-Time Metrics
    const totalCategoriesCount = categoriesArray.length;

    
    const pageProductsCount = categoriesArray.reduce(
        (sum, cat) => sum + Number(cat.attributes?.products_count || 0),
        0
    ) || 0;

    const displayTotalProducts = systemTotalProducts > 0 ? systemTotalProducts : pageProductsCount;

    const sortedByProducts = [...categoriesArray].sort(
        (a, b) => Number(b.attributes?.products_count || 0) - Number(a.attributes?.products_count || 0)
    );
    const largestCategoryObj = sortedByProducts[0];
    const largestCategoryName = largestCategoryObj?.attributes?.name || "None";
    const largestCategoryCount = Number(largestCategoryObj?.attributes?.products_count || 0);

    const emptyCategoriesCount = categoriesArray.filter(
        (cat) => Number(cat.attributes?.products_count || 0) === 0
    ).length || 0;

    // Filter & Sort
    let processedCategories = [...categoriesArray];

    if (statusFilter === 'active') {
        processedCategories = processedCategories.filter(
            (cat) => Number(cat.attributes?.products_count || 0) > 0
        );
    } else if (statusFilter === 'empty') {
        processedCategories = processedCategories.filter(
            (cat) => Number(cat.attributes?.products_count || 0) === 0
        );
    }

    if (sortBy === 'name') {
        processedCategories.sort((a, b) =>
            (a.attributes?.name || '').localeCompare(b.attributes?.name || '')
        );
    } else if (sortBy === 'count') {
        processedCategories.sort(
            (a, b) => Number(b.attributes?.products_count || 0) - Number(a.attributes?.products_count || 0)
        );
    } else if (sortBy === 'oldest') {
        processedCategories.sort((a, b) => Number(a.id) - Number(b.id));
    } else {
        processedCategories.sort((a, b) => Number(b.id) - Number(a.id));
    }

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedRows(processedCategories.map((c) => c.id));
        } else {
            setSelectedRows([]);
        }
    };

    const handleSelectRow = (id) => {
        if (selectedRows.includes(id)) {
            setSelectedRows(selectedRows.filter((rId) => rId !== id));
        } else {
            setSelectedRows([...selectedRows, id]);
        }
    };

    const exportToCSV = () => {
        if (!categoriesArray || categoriesArray.length === 0) return;
        const headers = ["ID,Category Name,Products Count,Slug\n"];
        const rows = categoriesArray.map((cat) => {
            const name = `"${cat.attributes?.name || ''}"`;
            const count = cat.attributes?.products_count || 0;
            const slug = (cat.attributes?.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
            return `${cat.id},${name},${count},${slug}`;
        });

        const blob = new Blob([headers + rows.join("\n")], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.setAttribute("href", url);
        a.setAttribute("download", "product_categories.csv");
        a.click();
    };

    // Category Icon & Color palette for categories without custom image
    const getCategoryIconAndColor = (name = '', index = 0) => {
        const lower = name.toLowerCase();
        if (lower.includes('refrigerat') || lower.includes('fridge')) return { icon: faBox, bg: '#DCFCE7', color: '#15803D' };
        if (lower.includes('wash') || lower.includes('clean')) return { icon: faBox, bg: '#EFF6FF', color: '#2563EB' };
        if (lower.includes('air') || lower.includes('ac') || lower.includes('cool')) return { icon: faBox, bg: '#FEF3C7', color: '#D97706' };
        if (lower.includes('tv') || lower.includes('televi') || lower.includes('smart')) return { icon: faTv, bg: '#F3E8FF', color: '#9333EA' };
        if (lower.includes('phone') || lower.includes('mobile')) return { icon: faMobileAlt, bg: '#FCE7F3', color: '#DB2777' };
        
        const colors = [
            { bg: '#DCFCE7', color: '#15803D', icon: faBox },
            { bg: '#EFF6FF', color: '#2563EB', icon: faShoppingBag },
            { bg: '#FEF3C7', color: '#D97706', icon: faShoppingCart },
            { bg: '#F3E8FF', color: '#9333EA', icon: faTag },
            { bg: '#E0F2FE', color: '#0284C7', icon: faThLarge },
            { bg: '#FCE7F3', color: '#DB2777', icon: faFolder },
        ];
        return colors[index % colors.length];
    };

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title={placeholderText('product-categories.title')} />

            <div className="cat-page-container">

                {(showCreateForm || editModel) ? (
                    <ProductCategoryForm
                        show={true}
                        handleClose={handleCloseForm}
                        singleProductCategory={productCategory}
                        addProductData={addProductCategory}
                        editProductCategory={editProductCategory}
                        title={productCategory ? getFormattedMessage('product-category.edit.title') : getFormattedMessage('product-category.create.title')}
                    />
                ) : (
                    <>
                        {/* 1. Breadcrumb */}
                        <div className="cat-breadcrumb">
                            <span>Dashboard</span>
                            <span>&gt;</span>
                            <span>Products</span>
                            <span>&gt;</span>
                            <span className="cat-crumb-active">Categories</span>
                        </div>

                        {/* 2. Header Section */}
                        <div className="cat-header">
                            <div className="cat-title-group">
                                <h1>Product Categories</h1>
                                <p>Manage categories, organize products and monitor inventory distribution.</p>
                            </div>

                            <div className="cat-header-actions">
                                <button type="button" className="cat-btn-pill" onClick={exportToCSV}>
                                    <FontAwesomeIcon icon={faDownload} /> Export CSV
                                </button>
                                <CreateProductCategory onClickCreate={() => setShowCreateForm(true)} />
                            </div>
                        </div>

                        {/* 3. Real-Time 4 KPI Summary Cards */}
                        <div className="cat-kpi-grid">
                            <div className="cat-kpi-card">
                                <div className="cat-kpi-top">
                                    <span className="cat-kpi-label">Total Categories</span>
                                    <div className="cat-kpi-icon green">
                                        <FontAwesomeIcon icon={faFolder} />
                                    </div>
                                </div>
                                <div className="cat-kpi-value">
                                    {isInitialLoading ? <span className="prod-skeleton-shimmer d-inline-block" style={{ width: '45px', height: '28px', borderRadius: '6px' }} /> : <LiveCounter value={totalCategoriesCount} isCurrency={false} />}
                                </div>
                                <div className="cat-kpi-bottom">
                                    <span className="cat-kpi-badge up">Live System Data</span>
                                    <svg width="60" height="24" viewBox="0 0 60 24" fill="none">
                                        <path d="M2 12L58 12" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </div>
                            </div>

                            <div className="cat-kpi-card">
                                <div className="cat-kpi-top">
                                    <span className="cat-kpi-label">Total Products</span>
                                    <div className="cat-kpi-icon blue">
                                        <FontAwesomeIcon icon={faBox} />
                                    </div>
                                </div>
                                <div className="cat-kpi-value">
                                    {isInitialLoading ? <span className="prod-skeleton-shimmer d-inline-block" style={{ width: '45px', height: '28px', borderRadius: '6px' }} /> : <LiveCounter value={displayTotalProducts} isCurrency={false} />}
                                </div>
                                <div className="cat-kpi-bottom">
                                    <span className="cat-kpi-badge up">Across Categories</span>
                                    <svg width="60" height="24" viewBox="0 0 60 24" fill="none">
                                        <path d="M2 12L58 12" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </div>
                            </div>

                            <div className="cat-kpi-card">
                                <div className="cat-kpi-top">
                                    <span className="cat-kpi-label">Largest Category</span>
                                    <div className="cat-kpi-icon orange">
                                        <FontAwesomeIcon icon={faTrophy} />
                                    </div>
                                </div>
                                <div className="cat-kpi-value" style={{ fontSize: '22px' }}>
                                    {isInitialLoading ? <span className="prod-skeleton-shimmer d-inline-block" style={{ width: '100px', height: '28px', borderRadius: '6px' }} /> : largestCategoryName}
                                </div>
                                <div className="cat-kpi-bottom">
                                    <span className="cat-kpi-label" style={{ fontSize: '13px', color: '#64748B', fontWeight: '700' }}>
                                        {isInitialLoading ? <span className="prod-skeleton-shimmer d-inline-block" style={{ width: '70px', height: '14px', borderRadius: '4px' }} /> : <><LiveCounter value={largestCategoryCount} isCurrency={false} /> products</>}
                                    </span>
                                    <svg width="60" height="24" viewBox="0 0 60 24" fill="none">
                                        <path d="M2 12L58 12" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </div>
                            </div>

                            <div className="cat-kpi-card">
                                <div className="cat-kpi-top">
                                    <span className="cat-kpi-label">Empty Categories</span>
                                    <div className="cat-kpi-icon purple">
                                        <FontAwesomeIcon icon={faExclamationTriangle} />
                                    </div>
                                </div>
                                <div className="cat-kpi-value">
                                    {isInitialLoading ? <span className="prod-skeleton-shimmer d-inline-block" style={{ width: '45px', height: '28px', borderRadius: '6px' }} /> : <LiveCounter value={emptyCategoriesCount} isCurrency={false} />}
                                </div>
                                <div className="cat-kpi-bottom">
                                    <span className={`cat-kpi-badge ${emptyCategoriesCount > 0 ? 'down' : 'neutral'}`}>
                                        {emptyCategoriesCount > 0 ? `${emptyCategoriesCount} need products` : 'All Categories Active'}
                                    </span>
                                    <svg width="60" height="24" viewBox="0 0 60 24" fill="none">
                                        <path d="M2 12L58 12" stroke="#9333EA" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* 4. Floating Workspace Container */}
                        <div className="cat-workspace">

                            <div className="cat-filter-bar">
                                <div className="cat-search-box">
                                    <FontAwesomeIcon icon={faSearch} className="cat-search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Search categories in real time..."
                                        value={searchTerm}
                                        onChange={handleSearchChange}
                                    />
                                </div>

                                <div className="cat-filter-controls">
                                    <select
                                        className="cat-select-sm"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <option value="all">Status: All</option>
                                        <option value="active">Status: Active (&gt;0)</option>
                                        <option value="empty">Status: Empty (0)</option>
                                    </select>

                                    <select
                                        className="cat-select-sm"
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                    >
                                        <option value="newest">Sort: Newest</option>
                                        <option value="oldest">Sort: Oldest</option>
                                        <option value="name">Sort: Name (A-Z)</option>
                                        <option value="count">Sort: Product Count</option>
                                    </select>

                                    <div className="cat-view-toggle">
                                        <button
                                            type="button"
                                            className={`cat-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                                            onClick={() => setViewMode('list')}
                                        >
                                            <FontAwesomeIcon icon={faList} />
                                        </button>
                                        <button
                                            type="button"
                                            className={`cat-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                            onClick={() => setViewMode('grid')}
                                        >
                                            <FontAwesomeIcon icon={faThLarge} />
                                        </button>
                                    </div>

                                    <button type="button" className="cat-btn-filter" onClick={handleClearFilters}>
                                        Reset
                                    </button>
                                </div>
                            </div>

                            {selectedRows.length > 0 && (
                                <div className="cat-bulk-bar">
                                    <div className="cat-bulk-info">
                                        <FontAwesomeIcon icon={faCheckCircle} />
                                        {selectedRows.length} categories selected
                                    </div>
                                    <div className="cat-bulk-actions">
                                        <button
                                            type="button"
                                            className="cat-btn-bulk danger"
                                            onClick={() => {
                                                if (window.confirm(`Delete ${selectedRows.length} selected categories?`)) {
                                                    selectedRows.forEach((id) => onClickDeleteModel(id));
                                                    setSelectedRows([]);
                                                }
                                            }}
                                        >
                                            Bulk Delete
                                        </button>
                                        <button type="button" className="cat-btn-bulk" onClick={exportToCSV}>
                                            Export Selected
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Table */}
                            <div className="cat-table-wrap">
                                <table className="cat-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '40px' }}>
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    checked={
                                                        selectedRows.length === (processedCategories?.length || 0) &&
                                                        processedCategories?.length > 0
                                                    }
                                                    onChange={handleSelectAll}
                                                />
                                            </th>
                                            <th>Category</th>
                                            <th>Slug</th>
                                            <th>Products Count</th>
                                            <th>Share %</th>
                                            <th>Status</th>
                                            <th style={{ textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isInitialLoading ? (
                                            [...Array(6)].map((_, i) => (
                                                <tr key={`cat-skel-${i}`} style={{ height: '58px' }}>
                                                    <td><div className="prod-skeleton-shimmer" style={{ width: '18px', height: '18px', borderRadius: '4px' }} /></td>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div className="prod-skeleton-shimmer" style={{ width: '38px', height: '38px', borderRadius: '10px' }} />
                                                            <div className="d-flex flex-column gap-1.5">
                                                                <div className="prod-skeleton-shimmer" style={{ width: '140px', height: '14px', borderRadius: '4px' }} />
                                                                <div className="prod-skeleton-shimmer" style={{ width: '60px', height: '10px', borderRadius: '3px' }} />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td><div className="prod-skeleton-shimmer" style={{ width: '90px', height: '18px', borderRadius: '6px' }} /></td>
                                                    <td>
                                                        <div className="d-flex flex-column gap-1" style={{ width: '120px' }}>
                                                            <div className="prod-skeleton-shimmer" style={{ width: '30px', height: '14px', borderRadius: '4px' }} />
                                                            <div className="prod-skeleton-shimmer" style={{ width: '100px', height: '6px', borderRadius: '50px' }} />
                                                        </div>
                                                    </td>
                                                    <td><div className="prod-skeleton-shimmer" style={{ width: '45px', height: '14px', borderRadius: '4px' }} /></td>
                                                    <td><div className="prod-skeleton-shimmer" style={{ width: '65px', height: '20px', borderRadius: '50px' }} /></td>
                                                    <td className="text-end">
                                                        <div className="d-flex align-items-center justify-content-end gap-1">
                                                            <div className="prod-skeleton-shimmer" style={{ width: '28px', height: '28px', borderRadius: '8px' }} />
                                                            <div className="prod-skeleton-shimmer" style={{ width: '28px', height: '28px', borderRadius: '8px' }} />
                                                            <div className="prod-skeleton-shimmer" style={{ width: '28px', height: '28px', borderRadius: '8px' }} />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : processedCategories?.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" style={{ textAlign: 'center', padding: '60px 20px', border: 'none' }}>
                                                    <div style={{ padding: '20px', textAlign: 'center' }}>
                                                        <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', margin: '0 auto 16px auto', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.12)' }}>
                                                            <FontAwesomeIcon icon={faFolderOpen} />
                                                        </div>
                                                        <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                                                            No product categories found
                                                        </h3>
                                                        <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '420px', margin: '0 auto 22px auto', lineHeight: '1.55' }}>
                                                            {searchTerm
                                                                ? 'No categories matched your search criteria. Try resetting the search filter.'
                                                                : 'Create your first product category to organize your inventory, group related items, and speed up POS sales.'}
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
                                                                <FontAwesomeIcon icon={faPlus} /> Create Category
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            processedCategories?.map((item, index) => {
                                                const name = item.attributes?.name || '';
                                                const count = Number(item.attributes?.products_count || 0);
                                                const rawImg = item.attributes?.image;
                                                const hasCustomImage = rawImg && !rawImg.includes('productCategory_logo');
                                                const catStyle = getCategoryIconAndColor(name, index);
                                                const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                                                const denom = displayTotalProducts > 0 ? displayTotalProducts : 1;
                                                const pct = ((count / denom) * 100).toFixed(1);
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
                                                            <div className="cat-name-box">
                                                                {hasCustomImage ? (
                                                                    <img
                                                                        src={rawImg}
                                                                        alt={name}
                                                                        className="cat-thumb-box"
                                                                    />
                                                                ) : (
                                                                    <div
                                                                        className="cat-thumb-box"
                                                                        style={{
                                                                            background: catStyle.bg,
                                                                            color: catStyle.color,
                                                                            borderColor: 'transparent',
                                                                            fontWeight: '700',
                                                                            fontSize: '18px'
                                                                        }}
                                                                    >
                                                                        <FontAwesomeIcon icon={catStyle.icon} />
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <div className="cat-name-title">{name}</div>
                                                                    <div className="cat-name-sub">ID: #{item.id}</div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td>
                                                            <span className="cat-slug-badge">{slug}</span>
                                                        </td>

                                                        <td>
                                                            <div className="cat-count-wrap">
                                                                <span className="cat-count-num">{count}</span>
                                                                <div className="cat-progress-bg">
                                                                    <div
                                                                        className="cat-progress-fill"
                                                                        style={{ width: `${Math.min(100, parseFloat(pct) * 2.5)}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td style={{ fontWeight: '700', color: '#0F172A' }}>
                                                            {pct}%
                                                        </td>

                                                        <td>
                                                            <span className={`cat-status-badge ${count > 0 ? 'active' : 'inactive'}`}>
                                                                ● {count > 0 ? 'Active' : 'Empty'}
                                                            </span>
                                                        </td>

                                                        <td>
                                                            <div className="cat-action-btns" style={{ justifyContent: 'flex-end' }}>
                                                                <button
                                                                    type="button"
                                                                    className="cat-icon-btn"
                                                                    title="Preview Category"
                                                                    onClick={() => setDrawerCategory({ ...item, slug, pct, catStyle, hasCustomImage, rawImg })}
                                                                >
                                                                    <FontAwesomeIcon icon={faEye} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="cat-icon-btn edit"
                                                                    title="Edit Category"
                                                                    onClick={() => handleCloseEdit(item)}
                                                                >
                                                                    <FontAwesomeIcon icon={faEdit} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="cat-icon-btn delete"
                                                                    title="Delete Category"
                                                                    onClick={() => onClickDeleteModel(item)}
                                                                >
                                                                    <FontAwesomeIcon icon={faTrash} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="cat-icon-btn"
                                                                    title="View Details"
                                                                    onClick={() => setDrawerCategory({ ...item, slug, pct, catStyle, hasCustomImage, rawImg })}
                                                                >
                                                                    <FontAwesomeIcon icon={faChevronRight} />
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

                            <div className="cat-pagination">
                                <div className="cat-pagination-info">
                                    Showing {processedCategories?.length || 0} of {totalCategoriesCount} categories
                                </div>

                                <div className="cat-pagination-pages">
                                    <button
                                        type="button"
                                        className="cat-page-num"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        &lt;
                                    </button>
                                    <button
                                        type="button"
                                        className={`cat-page-num ${currentPage === 1 ? 'active' : ''}`}
                                        onClick={() => handlePageChange(1)}
                                    >
                                        1
                                    </button>
                                    {Math.ceil(totalCategoriesCount / pageSize) > 1 && (
                                        <button
                                            type="button"
                                            className={`cat-page-num ${currentPage === 2 ? 'active' : ''}`}
                                            onClick={() => handlePageChange(2)}
                                        >
                                            2
                                        </button>
                                    )}
                                    {Math.ceil(totalCategoriesCount / pageSize) > 2 && (
                                        <button
                                            type="button"
                                            className={`cat-page-num ${currentPage === 3 ? 'active' : ''}`}
                                            onClick={() => handlePageChange(3)}
                                        >
                                            3
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className="cat-page-num"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage >= Math.ceil(totalCategoriesCount / pageSize)}
                                    >
                                        &gt;
                                    </button>
                                    
                                    <select
                                        className="cat-select-sm"
                                        style={{ height: '36px', padding: '0 24px 0 10px', marginLeft: '12px' }}
                                        value={pageSize}
                                        onChange={handlePageSizeChange}
                                    >
                                        <option value={10}>10 / page</option>
                                        <option value={20}>20 / page</option>
                                        <option value={50}>50 / page (Show All)</option>
                                        <option value={100}>100 / page</option>
                                    </select>
                                </div>
                            </div>

                        </div>
                    </>
                )}
            </div>

            {/* Real Category Preview Right Drawer Panel */}
            {drawerCategory && (
                <div className="cat-drawer-overlay" onClick={() => setDrawerCategory(null)}>
                    <div className="cat-drawer" onClick={(e) => e.stopPropagation()}>
                        <div className="cat-drawer-header">
                            <span className="cat-drawer-title">{drawerCategory.attributes?.name}</span>
                            <button type="button" className="cat-drawer-close" onClick={() => setDrawerCategory(null)}>
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        </div>

                        <div className="cat-drawer-body">
                            <div className="cat-drawer-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {drawerCategory.hasCustomImage ? (
                                    <img
                                        src={drawerCategory.rawImg}
                                        alt=""
                                        style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '14px' }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            width: '90px',
                                            height: '90px',
                                            borderRadius: '18px',
                                            background: drawerCategory.catStyle?.bg || '#DCFCE7',
                                            color: drawerCategory.catStyle?.color || '#15803D',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '36px'
                                        }}
                                    >
                                        <FontAwesomeIcon icon={drawerCategory.catStyle?.icon || faBox} />
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <span className={`cat-status-badge ${Number(drawerCategory.attributes?.products_count || 0) > 0 ? 'active' : 'inactive'}`}>
                                    ● {Number(drawerCategory.attributes?.products_count || 0) > 0 ? 'Active' : 'Empty'}
                                </span>
                                <span className="cat-slug-badge">Slug: {drawerCategory.slug}</span>
                            </div>

                            <div className="cat-drawer-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                <div className="cat-drawer-stat-box">
                                    <div className="cat-drawer-stat-label">Product Count</div>
                                    <div className="cat-drawer-stat-val">{drawerCategory.attributes?.products_count || 0}</div>
                                </div>
                                <div className="cat-drawer-stat-box">
                                    <div className="cat-drawer-stat-label">Catalog Share</div>
                                    <div className="cat-drawer-stat-val">{drawerCategory.pct}%</div>
                                </div>
                            </div>

                            <div style={{ marginTop: '24px' }}>
                                <button
                                    type="button"
                                    className="cat-btn-pill cat-btn-primary"
                                    style={{ width: '100%', height: '44px' }}
                                    onClick={() => {
                                        const catToEdit = drawerCategory;
                                        setDrawerCategory(null);
                                        handleCloseEdit(catToEdit);
                                    }}
                                >
                                    <FontAwesomeIcon icon={faEdit} /> Edit {drawerCategory.attributes?.name}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <DeleteProductCategory onClickDeleteModel={onClickDeleteModel} deleteModel={deleteModel} onDelete={isDelete} />

        </MasterLayout>
    );
};

const mapStateToProps = (state) => {
    const { productCategories, totalRecord } = state;
    return { productCategories, totalRecord };
};

export default connect(mapStateToProps, { fetchProductCategories, addProductCategory, editProductCategory })(ProductCategory);
