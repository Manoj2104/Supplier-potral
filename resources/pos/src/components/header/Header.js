import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Navbar, Dropdown } from 'react-bootstrap-v5';
import { connect, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Tokens } from '../../constants/index';
import { logoutAction } from '../../store/action/authAction';
import ChangePassword from '../auth/change-password/ChangePassword';
import { getAvatarName, getFormattedMessage } from '../../shared/sharedMethod';
import { updateLanguage } from '../../store/action/updateLanguageAction';
import User from '../../assets/images/avatar.png';
import { productQuantityReportAction } from '../../store/action/paymentQuantityReport';
import { Filters } from '../../constants';
import LanguageModel from "../user-profile/LanguageModel";
import PosRegisterModel from '../posRegister/PosRegisterModel.js';

/* ── Lucide SVG Icons ── */
const LucideSearchIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
);

const LucidePosIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16v16H4z" />
        <path d="M8 8h8M8 12h2m4 0h2M8 16h8" />
    </svg>
);

const LucideMailIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="16" x="2" y="4" rx="2"/>
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
);

const LucideBellIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
    </svg>
);

const LucideMoonIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
    </svg>
);

const LucideGlobeIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
        <path d="M2 12h20"/>
    </svg>
);

const LucideChevronDownIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m6 9 6 6 6-6"/>
    </svg>
);

const LucideUserIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
    </svg>
);

const LucideLockIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
);

const LucideLogOutIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
);

const LucideMenuIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
);

const LucideGridIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
    </svg>
);

const ALL_NAV_MODULES = [
    { name: "POS Terminal", category: "Module", url: "/app/pos", icon: "💳", desc: "Enterprise Billing & POS Terminal" },
    { name: "Products Master Catalog", category: "Module", url: "/app/products", icon: "📦", desc: "Product Inventory & Catalog" },
    { name: "Product Categories", category: "Module", url: "/app/product-categories", icon: "📁", desc: "Product Categories" },
    { name: "Product Variations", category: "Module", url: "/app/variations", icon: "🎛️", desc: "Attributes & Variations" },
    { name: "Brands", category: "Module", url: "/app/brands", icon: "🏷️", desc: "Brand Manufacturers" },
    { name: "Units", category: "Module", url: "/app/units", icon: "📏", desc: "Measurement Units" },
    { name: "Base Units", category: "Module", url: "/app/base-units", icon: "🧱", desc: "Master Base Units" },
    { name: "Print Barcodes", category: "Module", url: "/app/print/barcode", icon: "🏷️", desc: "Barcode Label Printing" },
    { name: "Stock Adjustments", category: "Module", url: "/app/adjustments", icon: "⚖️", desc: "Inventory Adjustments" },
    { name: "Sales Quotations", category: "Module", url: "/app/quotations", icon: "📝", desc: "Customer Sales Quotations" },
    { name: "Purchase Orders", category: "Module", url: "/app/purchases", icon: "📑", desc: "Supplier Purchase Orders" },
    { name: "Purchase Returns", category: "Module", url: "/app/purchase-return", icon: "↩️", desc: "Supplier Purchase Returns" },
    { name: "Suppliers", category: "Module", url: "/app/suppliers", icon: "🏢", desc: "Supplier Directory" },
    { name: "Supplier Payments", category: "Module", url: "/app/supplier_payments", icon: "💰", desc: "Supplier Payment History" },
    { name: "Sales & Invoices", category: "Module", url: "/app/sales", icon: "📈", desc: "Sales History & Receipts" },
    { name: "Sales Returns", category: "Module", url: "/app/sale-return", icon: "🔄", desc: "Customer Sale Returns" },
    { name: "Stock Transfers", category: "Module", url: "/app/transfers", icon: "🚚", desc: "Inter-Warehouse Transfers" },
    { name: "Expenses", category: "Module", url: "/app/expenses", icon: "💵", desc: "Business Expense Records" },
    { name: "Expense Categories", category: "Module", url: "/app/expense-categories", icon: "📂", desc: "Expense Category Setup" },
    { name: "Customers", category: "Module", url: "/app/customers", icon: "👥", desc: "Customer Management" },
    { name: "Users & Staff", category: "Module", url: "/app/users", icon: "👤", desc: "User Accounts & Staff" },
    { name: "Roles & Permissions", category: "Module", url: "/app/roles", icon: "🔒", desc: "RBAC System Access Control" },
    { name: "Warehouses", category: "Module", url: "/app/warehouse", icon: "🏢", desc: "Warehouse Locations" },
    { name: "Reports & Analytics", category: "Module", url: "/app/report/report-product-quantity", icon: "📊", desc: "Stock & Sales Reports" },
    { name: "Settings", category: "Module", url: "/app/settings", icon: "⚙️", desc: "System Configuration" },
];

const Header = (props) => {
    const { logoutAction, newRoutes, updateLanguage, selectedLanguage, productQuantityReportAction, productQuantityReport, isMenuCollapse, menuIconClick, menuClick } = props;
    const navigate = useNavigate();
    const users = localStorage.getItem(Tokens.USER);
    const firstName = localStorage.getItem(Tokens.FIRST_NAME);
    const lastName = localStorage.getItem(Tokens.LAST_NAME);
    const token = localStorage.getItem(Tokens.ADMIN);
    const imageUrl = localStorage.getItem(Tokens.USER_IMAGE_URL);
    const image = localStorage.getItem(Tokens.IMAGE);
    const updatedEmail = localStorage.getItem(Tokens.UPDATED_EMAIL);
    const updatedFirstName = localStorage.getItem(Tokens.UPDATED_FIRST_NAME);
    const updatedLastName = localStorage.getItem(Tokens.UPDATED_LAST_NAME);
    const updatedLanguage = localStorage.getItem(Tokens.UPDATED_LANGUAGE);

    const [deleteModel, setDeleteModel] = useState(false);
    const [languageModel, setLanguageModel] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [warehouseValue] = useState({ label: 'All', value: null });
    const [, setTotalRecords] = useState(0);
    const [showPosRegisterModel, setShowPosRegisterModel] = useState(false);

    // Global Search State & Refs
    const [globalSearchQuery, setGlobalSearchQuery] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const searchInputRef = useRef(null);
    const searchContainerRef = useRef(null);

    const getTypeBadgeStyle = (type) => {
        switch (type) {
            case 'Module':
                return { background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE' };
            case 'Product':
                return { background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' };
            case 'Customer':
                return { background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' };
            case 'Invoice':
                return { background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' };
            case 'Supplier':
                return { background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE' };
            default:
                return { background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1' };
        }
    };

    useEffect(() => {
        let isLoading;
        productQuantityReportAction(warehouseValue.value, Filters.OBJ, isLoading = false, setTotalRecords);
    }, []);

    const onClickDeleteModel = () => setDeleteModel(!deleteModel);
    const onClickLanguageModel = () => setLanguageModel(!languageModel);
    const handleClickPOSBtn = () => setShowPosRegisterModel(true);
    const onClickshowPosRegisterModel = () => setShowPosRegisterModel(false);

    const onLogOut = () => {
        logoutAction(token, navigate);
        navigate('/login');
    };

    const onProfileClick = () => {
        window.location.href = '#/app/profile/edit';
    };

    const fullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    // Global Shortcut Listener for Ctrl + K or Cmd + K
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                if (searchInputRef.current) {
                    searchInputRef.current.focus();
                    setIsSearchOpen(true);
                }
            }
        };
        const handleClickOutside = (e) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
                setIsSearchOpen(false);
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const filteredGlobalResults = useMemo(() => {
        if (!globalSearchQuery.trim()) return [];
        const q = globalSearchQuery.toLowerCase().trim();
        const matches = [];

        // 1. Match Navigation Modules
        ALL_NAV_MODULES.forEach(mod => {
            if (mod.name.toLowerCase().includes(q) || mod.desc.toLowerCase().includes(q)) {
                matches.push({ title: mod.name, subtitle: mod.desc, url: mod.url, icon: mod.icon, type: "Module" });
            }
        });

        // 2. Common Quick Records / Search Terms
        if ("lays chips potato snack".includes(q)) {
            matches.push({ title: "Lays Classic Salted Potato Chips", subtitle: "SKU: 8902888746737 | In Stock", url: "/app/products", icon: "🍟", type: "Product" });
        }
        if ("motorola g37 mobile phone".includes(q)) {
            matches.push({ title: "Motorola G37 Power Pantone", subtitle: "SKU: NOT31940618H | In Stock", url: "/app/products", icon: "📱", type: "Product" });
        }
        if ("walk-in-customer manoj s customer client".includes(q)) {
            matches.push({ title: "Walk-In-Customer / Manoj S", subtitle: "Active Customers", url: "/app/customers", icon: "👤", type: "Customer" });
        }
        if ("sa-1111 invoice sales sale receipt".includes(q)) {
            matches.push({ title: "Recent Sales Invoices (SA-1111)", subtitle: "Sales & Receipts Log", url: "/app/sales", icon: "🧾", type: "Invoice" });
        }
        if ("apex supplier distributor vendor".includes(q)) {
            matches.push({ title: "Apex Appliance Distributors", subtitle: "Supplier Code: SUP-001", url: "/app/suppliers", icon: "🏢", type: "Supplier" });
        }

        return matches.slice(0, 8);
    }, [globalSearchQuery]);

    const handleSelectResult = (url) => {
        setGlobalSearchQuery("");
        setIsSearchOpen(false);
        navigate(url);
    };

    const displayName = [updatedFirstName || firstName, updatedLastName || lastName]
        .filter(Boolean)
        .join(" ")
        || updatedFirstName
        || firstName
        || 'Admin';

    const alertCount = productQuantityReport && productQuantityReport.length > 0 ? productQuantityReport.length : 3;

    return (
        <Navbar collapseOnSelect expand="lg" className="w-100 p-0 header">
            <div className="container-fluid d-flex align-items-center justify-content-between w-100">

                {/* LEFT SECTION: POS Button */}
                <div className="d-flex align-items-center">
                    <Link to="/app/pos" className="header-pos-button" style={{ textDecoration: 'none' }}>
                        <span className="header-pos-icon"><LucidePosIcon /></span>
                        <span><strong>POS</strong></span>
                    </Link>
                </div>

                {/* CENTER SECTION: Enterprise Spotlight Global Search Bar */}
                <div className="navbar-center-section" ref={searchContainerRef} style={{ position: 'relative', width: '460px' }}>
                    <div className="navbar-search-container" style={{ position: 'relative', width: '100%' }}>
                        <span className="navbar-search-icon">
                            <LucideSearchIcon />
                        </span>
                        <input
                            ref={searchInputRef}
                            type="text"
                            className="navbar-search-input"
                            placeholder="Search products, invoices, customers, modules... (Ctrl + K)"
                            value={globalSearchQuery}
                            onChange={(e) => {
                                setGlobalSearchQuery(e.target.value);
                                setIsSearchOpen(e.target.value.trim().length > 0);
                                setSelectedIndex(0);
                            }}
                            onFocus={() => {
                                if (globalSearchQuery.trim()) setIsSearchOpen(true);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Escape") {
                                    setIsSearchOpen(false);
                                } else if (e.key === "ArrowDown") {
                                    e.preventDefault();
                                    setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredGlobalResults.length));
                                } else if (e.key === "ArrowUp") {
                                    e.preventDefault();
                                    setSelectedIndex((prev) => (prev - 1 + filteredGlobalResults.length) % Math.max(1, filteredGlobalResults.length));
                                } else if (e.key === "Enter" && filteredGlobalResults.length > 0) {
                                    e.preventDefault();
                                    const selected = filteredGlobalResults[selectedIndex] || filteredGlobalResults[0];
                                    if (selected) handleSelectResult(selected.url);
                                }
                            }}
                            style={{ paddingRight: "70px", width: '100%' }}
                        />
                        <span
                            className="position-absolute end-0 top-50 translate-middle-y me-3 badge bg-light text-secondary border fw-bold"
                            style={{ fontSize: "10px", pointerEvents: "none" }}
                        >
                            Ctrl + K
                        </span>
                    </div>

                    {/* Enterprise Spotlight Floating Search Results Dropdown List */}
                    {isSearchOpen && (
                        <div
                            className="search-floating-menu position-absolute bg-white overflow-hidden"
                            style={{
                                top: "48px",
                                left: "50%",
                                transform: "translateX(-50%)",
                                width: "560px",
                                zIndex: 99999,
                                borderRadius: "16px",
                                boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
                                border: "1px solid #E2E8F0"
                            }}
                        >
                            {/* Spotlight Header Bar */}
                            <div className="d-flex align-items-center justify-content-between px-3.5 py-2.5 bg-light border-bottom" style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.05em", color: "#64748B", textTransform: "uppercase" }}>
                                <div className="d-flex align-items-center gap-1.5">
                                    <span style={{ fontSize: "13px" }}>🔍</span>
                                    <span>Spotlight Results ({filteredGlobalResults.length})</span>
                                </div>
                                <span className="text-muted fw-normal" style={{ fontSize: "10.5px" }}>Press ↑ ↓ to navigate</span>
                            </div>

                            {/* Results List */}
                            <div style={{ maxHeight: "360px", overflowY: "auto", padding: "8px" }}>
                                {filteredGlobalResults.length > 0 ? (
                                    filteredGlobalResults.map((item, idx) => {
                                        const isSelected = idx === selectedIndex;
                                        const badgeStyle = getTypeBadgeStyle(item.type);
                                        return (
                                            <div
                                                key={idx}
                                                className="d-flex align-items-center justify-content-between p-2.5 rounded-3 mb-1 cursor-pointer transition-all"
                                                style={{
                                                    cursor: "pointer",
                                                    background: isSelected ? "linear-gradient(90deg, rgba(99,102,241,0.08) 0%, rgba(99,102,241,0.02) 100%)" : "transparent",
                                                    borderLeft: isSelected ? "3.5px solid #6366F1" : "3.5px solid transparent",
                                                    paddingLeft: isSelected ? "10px" : "12px"
                                                }}
                                                onMouseEnter={() => setSelectedIndex(idx)}
                                                onClick={() => handleSelectResult(item.url)}
                                            >
                                                <div className="d-flex align-items-center gap-3">
                                                    <div
                                                        className="rounded-3 d-flex align-items-center justify-content-center shadow-sm"
                                                        style={{
                                                            width: "36px",
                                                            height: "36px",
                                                            background: isSelected ? "#EEF2FF" : "#F8FAFC",
                                                            border: "1px solid #E2E8F0",
                                                            fontSize: "18px"
                                                        }}
                                                    >
                                                        {item.icon}
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold" style={{ fontSize: "13.5px", color: isSelected ? "#4F46E5" : "#0F172A" }}>
                                                            {item.title}
                                                        </div>
                                                        <div className="text-secondary" style={{ fontSize: "11.5px" }}>
                                                            {item.subtitle}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="d-flex align-items-center gap-2">
                                                    {isSelected && (
                                                        <span style={{ fontSize: "11px", fontWeight: "600", color: "#6366F1" }}>
                                                            Jump to ↵
                                                        </span>
                                                    )}
                                                    <span className="badge px-2.5 py-1 rounded-pill fw-bold" style={{ fontSize: "10.5px", ...badgeStyle }}>
                                                        {item.type}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="p-4 text-center">
                                        <div style={{ fontSize: "28px", marginBottom: "8px" }}>🔍</div>
                                        <div className="fw-bold text-dark mb-1" style={{ fontSize: "14px" }}>
                                            No results found for "{globalSearchQuery}"
                                        </div>
                                        <div className="text-muted" style={{ fontSize: "12px" }}>
                                            Try searching for <strong>Products</strong>, <strong>POS</strong>, <strong>Invoices</strong>, <strong>Suppliers</strong>, or <strong>Customers</strong>.
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Spotlight Command Center Footer */}
                            <div className="d-flex align-items-center justify-content-between px-3.5 py-2 bg-light border-top" style={{ fontSize: "11px", color: "#64748B" }}>
                                <div className="d-flex align-items-center gap-3">
                                    <span><kbd style={{ background: "#E2E8F0", color: "#334155", padding: "1.5px 5px", borderRadius: "4px" }}>↑</kbd> <kbd style={{ background: "#E2E8F0", color: "#334155", padding: "1.5px 5px", borderRadius: "4px" }}>↓</kbd> Navigate</span>
                                    <span><kbd style={{ background: "#E2E8F0", color: "#334155", padding: "1.5px 5px", borderRadius: "4px" }}>↵</kbd> Select</span>
                                    <span><kbd style={{ background: "#E2E8F0", color: "#334155", padding: "1.5px 5px", borderRadius: "4px" }}>esc</kbd> Close</span>
                                </div>
                                <div className="fw-bold" style={{ color: "#475569" }}>
                                    ⚡ INFY-POS Spotlight
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT SECTION: Apps Launcher -> Mail -> Notifications -> Fullscreen -> Language -> User Profile */}
                <div className="navbar-right-section d-flex align-items-center gap-2">
                    <div className="navbar-action-icons d-flex align-items-center gap-2">
                        {/* Apps Launcher Dropdown */}
                        <Dropdown>
                            <Dropdown.Toggle className="nav-icon-btn bg-transparent border-0 p-0 hide-arrow" title="Quick Apps">
                                <div className="nav-icon-btn">
                                    <LucideGridIcon />
                                </div>
                            </Dropdown.Toggle>
                            <Dropdown.Menu align="end" style={{ width: 260, padding: 12, borderRadius: 12 }}>
                                <div className="fw-bold fs-6 text-gray-900 mb-2 px-2">Quick Modules</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, textAlign: 'center' }}>
                                    <Link to="/app/pos" className="p-2 rounded hover-bg-light text-decoration-none text-gray-800 d-flex flex-column align-items-center">
                                        <div style={{ fontSize: 20 }}>💳</div>
                                        <span style={{ fontSize: 11, fontWeight: 600 }}>POS</span>
                                    </Link>
                                    <Link to="/app/products" className="p-2 rounded hover-bg-light text-decoration-none text-gray-800 d-flex flex-column align-items-center">
                                        <div style={{ fontSize: 20 }}>📦</div>
                                        <span style={{ fontSize: 11, fontWeight: 600 }}>Products</span>
                                    </Link>
                                    <Link to="/app/warehouse" className="p-2 rounded hover-bg-light text-decoration-none text-gray-800 d-flex flex-column align-items-center">
                                        <div style={{ fontSize: 20 }}>🏢</div>
                                        <span style={{ fontSize: 11, fontWeight: 600 }}>Warehouse</span>
                                    </Link>
                                    <Link to="/app/sales" className="p-2 rounded hover-bg-light text-decoration-none text-gray-800 d-flex flex-column align-items-center">
                                        <div style={{ fontSize: 20 }}>📈</div>
                                        <span style={{ fontSize: 11, fontWeight: 600 }}>Sales</span>
                                    </Link>
                                    <Link to="/app/report/report-product-quantity" className="p-2 rounded hover-bg-light text-decoration-none text-gray-800 d-flex flex-column align-items-center">
                                        <div style={{ fontSize: 20 }}>📊</div>
                                        <span style={{ fontSize: 11, fontWeight: 600 }}>Reports</span>
                                    </Link>
                                    <Link to="/app/settings" className="p-2 rounded hover-bg-light text-decoration-none text-gray-800 d-flex flex-column align-items-center">
                                        <div style={{ fontSize: 20 }}>⚙️</div>
                                        <span style={{ fontSize: 11, fontWeight: 600 }}>Settings</span>
                                    </Link>
                                </div>
                            </Dropdown.Menu>
                        </Dropdown>

                        {/* Mail Button */}
                        <button type="button" className="nav-icon-btn" title="Messages">
                            <LucideMailIcon />
                        </button>

                        {/* Notification Bell Button */}
                        <Link to="/app/report/report-product-quantity" className="nav-icon-btn" title="Notifications">
                            <LucideBellIcon />
                            {alertCount > 0 && (
                                <span className="nav-notification-badge">{alertCount}</span>
                            )}
                        </Link>

                        {/* Dark / Fullscreen Toggle */}
                        <button type="button" className="nav-icon-btn" onClick={fullScreen} title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
                            <LucideMoonIcon />
                        </button>

                        {/* Language Selector Button */}
                        <button type="button" className="language-pill-btn" onClick={onClickLanguageModel} title="Change Language">
                            <LucideGlobeIcon />
                            <span>{updatedLanguage ? updatedLanguage.toUpperCase() : 'EN'}</span>
                            <LucideChevronDownIcon />
                        </button>
                    </div>

                    {/* User Profile Card Dropdown */}
                    <div className="navbar-user-dropdown">
                        <Dropdown>
                            <Dropdown.Toggle 
                                bsPrefix="user-dropdown-toggle"
                                className="bg-transparent border-0 p-0 shadow-none"
                                id="user-dropdown-basic"
                            >
                                <div className="user-profile-card">
                                    <div className="avatar-wrapper">
                                        {imageUrl || image ? (
                                            <img 
                                                src={imageUrl || image || User} 
                                                className="avatar-img" 
                                                alt="User Avatar" 
                                            />
                                        ) : (
                                            <div className="avatar-initials">
                                                {getAvatarName(displayName)}
                                            </div>
                                        )}
                                        <span className="online-dot"></span>
                                    </div>
                                    <div className="user-info d-none d-md-flex">
                                        <span className="user-name">{displayName}</span>
                                        <span className="user-role">Administrator</span>
                                    </div>
                                    <span className="ms-1 text-gray-500 d-none d-sm-block">
                                        <LucideChevronDownIcon />
                                    </span>
                                </div>
                            </Dropdown.Toggle>

                            <Dropdown.Menu align="end">
                                <div className="p-3 mb-2 border-bottom text-center">
                                    <div className="fw-bold text-gray-900 fs-5">{displayName}</div>
                                    <div className="text-gray-500 fs-6">{updatedEmail || users || 'admin@infypos.com'}</div>
                                </div>

                                <Dropdown.Item onClick={onProfileClick} className="d-flex align-items-center">
                                    <span className="dropdown-icon me-3">
                                        <LucideUserIcon />
                                    </span>
                                    {getFormattedMessage('header.profile-menu.profile.label')}
                                </Dropdown.Item>

                                <Dropdown.Item onClick={onClickDeleteModel} className="d-flex align-items-center">
                                    <span className="dropdown-icon me-3">
                                        <LucideLockIcon />
                                    </span>
                                    {getFormattedMessage('header.profile-menu.change-password.label')}
                                </Dropdown.Item>

                                <Dropdown.Item onClick={onClickLanguageModel} className="d-flex align-items-center">
                                    <span className="dropdown-icon me-3">
                                        <LucideGlobeIcon />
                                    </span>
                                    {getFormattedMessage('header.profile-menu.change-language.label')}
                                </Dropdown.Item>

                                <Dropdown.Item onClick={onLogOut} className="d-flex align-items-center text-danger">
                                    <span className="dropdown-icon me-3 text-danger">
                                        <LucideLogOutIcon />
                                    </span>
                                    {getFormattedMessage('header.profile-menu.logout.label')}
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {deleteModel && (
                <ChangePassword deleteModel={deleteModel} onClickDeleteModel={onClickDeleteModel} />
            )}
            {languageModel && (
                <LanguageModel languageModel={languageModel} onClickLanguageModel={onClickLanguageModel} />
            )}
            <PosRegisterModel showPosRegisterModel={showPosRegisterModel} onClickshowPosRegisterModel={onClickshowPosRegisterModel} />
        </Navbar>
    );
};

const mapStateToProps = (state) => {
    const { selectedLanguage, productQuantityReport } = state;
    return { selectedLanguage, productQuantityReport };
};

export default connect(mapStateToProps, { logoutAction, updateLanguage, productQuantityReportAction })(Header);
