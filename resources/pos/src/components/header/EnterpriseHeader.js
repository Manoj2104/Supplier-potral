import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Dropdown } from 'react-bootstrap-v5';
import { connect } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Tokens } from '../../constants/index';
import { logoutAction } from '../../store/action/authAction';
import { getAvatarName, getFormattedMessage } from '../../shared/sharedMethod';
import { updateLanguage } from '../../store/action/updateLanguageAction';
import User from '../../assets/images/avatar.png';
import { productQuantityReportAction } from '../../store/action/paymentQuantityReport';
import { Filters } from '../../constants';
import LanguageModel from "../user-profile/LanguageModel";
import PosRegisterModel from '../posRegister/PosRegisterModel.js';
import ChangePassword from '../auth/change-password/ChangePassword';

/* ── Lucide Icon primitives ── */
const SvgIcon = ({ size = 18, children, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
        {children}
    </svg>
);

const SearchIcon = () => <SvgIcon><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></SvgIcon>;
const BellIcon = () => <SvgIcon><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></SvgIcon>;
const MailIcon = () => <SvgIcon><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></SvgIcon>;
const GridIcon = () => <SvgIcon><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></SvgIcon>;
const MonitorIcon = () => <SvgIcon><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></SvgIcon>;
const GlobeIcon = () => <SvgIcon><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></SvgIcon>;
const ChevronDownIcon = () => <SvgIcon size={14}><path d="m6 9 6 6 6-6"/></SvgIcon>;
const ChevronRightIcon = () => <SvgIcon size={14}><path d="m9 18 6-6-6-6"/></SvgIcon>;
const UserIcon = () => <SvgIcon size={15}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></SvgIcon>;
const LockIcon = () => <SvgIcon size={15}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></SvgIcon>;
const LogoutIcon = () => <SvgIcon size={15}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></SvgIcon>;
const PosIcon = () => <SvgIcon size={16}><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 7h10M7 12h4m4 0h1M7 17h10"/></SvgIcon>;
const MenuIcon = () => <SvgIcon size={20}><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></SvgIcon>;

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

const EnterpriseHeader = (props) => {
    const {
        logoutAction, updateLanguage, selectedLanguage,
        productQuantityReportAction, productQuantityReport,
        isMenuCollapse, menuIconClick, menuClick,
        sidebarMode, onModeChange
    } = props;

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
    const [showPosRegisterModel, setShowPosRegisterModel] = useState(false);
    const [warehouseValue] = useState({ label: 'All', value: null });
    const [, setTotalRecords] = useState(0);

    const [globalSearchQuery, setGlobalSearchQuery] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchRef = useRef(null);
    const searchContainerRef = useRef(null);

    useEffect(() => {
        let isLoading;
        productQuantityReportAction(warehouseValue.value, Filters.OBJ, isLoading = false, setTotalRecords);
    }, []);

    // CTRL+K search focus & outside click listener
    useEffect(() => {
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                searchRef.current?.focus();
                setIsSearchOpen(true);
            }
        };
        const handleClickOutside = (e) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
                setIsSearchOpen(false);
            }
        };
        window.addEventListener('keydown', handler);
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            window.removeEventListener('keydown', handler);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const filteredGlobalResults = useMemo(() => {
        if (!globalSearchQuery.trim()) return [];
        const q = globalSearchQuery.toLowerCase().trim();
        const matches = [];

        ALL_NAV_MODULES.forEach(mod => {
            if (mod.name.toLowerCase().includes(q) || mod.desc.toLowerCase().includes(q)) {
                matches.push({ title: mod.name, subtitle: mod.desc, url: mod.url, icon: mod.icon, type: "Module" });
            }
        });

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

    const alertCount = productQuantityReport?.length > 0 ? productQuantityReport.length : 0;
    const avatarName = getAvatarName(displayName);

    const onLogOut = () => {
        logoutAction(token, navigate);
        navigate('/login');
    };

    const fullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen?.();
            setIsFullscreen(false);
        }
    };

    const APP_ITEMS = [
        { emoji: '💳', label: 'POS', to: '/app/pos' },
        { emoji: '📦', label: 'Products', to: '/app/products' },
        { emoji: '🛒', label: 'Sales', to: '/app/sales' },
        { emoji: '🏬', label: 'Warehouse', to: '/app/warehouse' },
        { emoji: '📊', label: 'Reports', to: '/app/report/report-warehouse' },
        { emoji: '👥', label: 'People', to: '/app/customers' },
        { emoji: '💰', label: 'Expenses', to: '/app/expenses' },
        { emoji: '🔔', label: 'Alerts', to: '/app/report/report-product-quantity' },
        { emoji: '⚙️', label: 'Settings', to: '/app/settings' },
    ];

    return (
        <header className="esb-topbar">
            {/* Mobile hamburger (small screens) */}
            <button type="button" className="esb-mobile-toggle d-lg-none" onClick={menuClick} title="Menu">
                <MenuIcon />
            </button>

            {/* POS Quick Launch */}
            <Link to="/app/pos" className="esb-pos-btn" title="Point of Sale">
                <PosIcon />
                <span>POS</span>
            </Link>

            {/* Global Search */}
            <div className="esb-topbar-search" ref={searchContainerRef} style={{ position: 'relative' }}>
                <SearchIcon />
                <input
                    ref={searchRef}
                    type="text"
                    placeholder="Search products, invoices, customers..."
                    value={globalSearchQuery}
                    onChange={(e) => {
                        setGlobalSearchQuery(e.target.value);
                        setIsSearchOpen(e.target.value.trim().length > 0);
                    }}
                    onFocus={() => {
                        if (globalSearchQuery.trim()) setIsSearchOpen(true);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Escape") setIsSearchOpen(false);
                        else if (e.key === "Enter" && filteredGlobalResults.length > 0) {
                            handleSelectResult(filteredGlobalResults[0].url);
                        }
                    }}
                />
                <span className="esb-search-kbd">Ctrl+K</span>

                {/* Floating Search Results Menu */}
                {isSearchOpen && (
                    <div
                        className="search-floating-menu position-absolute start-0 end-0 mt-2 bg-white rounded-4 shadow-lg border overflow-hidden"
                        style={{ top: "42px", zIndex: 99999, maxHeight: "380px", overflowY: "auto", padding: "8px", width: "420px" }}
                    >
                        {filteredGlobalResults.length > 0 ? (
                            filteredGlobalResults.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="d-flex align-items-center justify-content-between p-2.5 rounded-3 mb-1 cursor-pointer hover-bg-light"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => handleSelectResult(item.url)}
                                >
                                    <div className="d-flex align-items-center gap-3">
                                        <div
                                            className="rounded-2 d-flex align-items-center justify-content-center"
                                            style={{ width: "32px", height: "32px", background: "#F1F5F9", fontSize: "16px" }}
                                        >
                                            {item.icon}
                                        </div>
                                        <div>
                                            <div className="fw-bold text-dark" style={{ fontSize: "13px" }}>
                                                {item.title}
                                            </div>
                                            <div className="text-secondary" style={{ fontSize: "11px" }}>
                                                {item.subtitle}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="badge bg-light text-secondary border" style={{ fontSize: "10px" }}>
                                        {item.type}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="p-3 text-center text-muted" style={{ fontSize: "12.5px" }}>
                                No matching modules or records found for "<strong>{globalSearchQuery}</strong>"
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Right section */}
            <div className="esb-topbar-right">
                {/* Apps launcher */}
                <Dropdown>
                    <Dropdown.Toggle className="esb-nav-btn esb-no-caret p-0 border-0 bg-transparent" title="Quick Apps">
                        <div className="esb-nav-btn" style={{ width: 36, height: 36 }}>
                            <GridIcon />
                        </div>
                    </Dropdown.Toggle>
                    <Dropdown.Menu align="end" style={{ width: 248, padding: 12, borderRadius: 14, border: '1px solid #E2E8F0', boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }}>
                        <div style={{ fontWeight: 700, fontSize: 12, color: '#1E293B', marginBottom: 8, paddingLeft: 4 }}>Quick Modules</div>
                        <div className="esb-apps-grid">
                            {APP_ITEMS.map((app, i) => (
                                <Link key={i} to={app.to} className="esb-app-item">
                                    <span className="esb-app-icon">{app.emoji}</span>
                                    <span>{app.label}</span>
                                </Link>
                            ))}
                        </div>
                    </Dropdown.Menu>
                </Dropdown>

                {/* Mail */}
                <button type="button" className="esb-nav-btn" title="Messages">
                    <MailIcon />
                </button>

                {/* Notifications */}
                <Link to="/app/report/report-product-quantity" className="esb-nav-btn" title="Alerts">
                    <BellIcon />
                    {alertCount > 0 && (
                        <span className="esb-badge">{alertCount > 9 ? '9+' : alertCount}</span>
                    )}
                </Link>

                {/* Fullscreen */}
                <button type="button" className="esb-nav-btn" onClick={fullScreen} title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
                    <MonitorIcon />
                </button>

                {/* Language */}
                <button type="button" className="esb-lang-btn" onClick={() => setLanguageModel(true)} title="Language">
                    <GlobeIcon />
                    <span>{updatedLanguage ? updatedLanguage.toUpperCase().slice(0, 2) : 'EN'}</span>
                    <ChevronDownIcon />
                </button>

                {/* User Profile */}
                <Dropdown>
                    <Dropdown.Toggle
                        className="esb-no-caret bg-transparent border-0 p-0"
                        id="esb-user-dropdown"
                    >
                        <div className="esb-profile-btn">
                            <div className="esb-profile-av">
                                {imageUrl || image
                                    ? <img src={imageUrl || image} alt="Avatar" />
                                    : avatarName
                                }
                                <span className="esb-online-dot" />
                            </div>
                            <div className="esb-profile-meta d-none d-md-flex">
                                <span className="esb-profile-name">{displayName}</span>
                                <span className="esb-profile-role">Administrator</span>
                            </div>
                            <ChevronDownIcon />
                        </div>
                    </Dropdown.Toggle>

                    <Dropdown.Menu align="end" style={{ minWidth: 220, padding: 6, borderRadius: 14, border: '1px solid #E2E8F0', boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }}>
                        {/* Profile header */}
                        <div style={{ padding: '10px 12px 10px', borderBottom: '1px solid #F1F5F9', marginBottom: 4 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: '#1E293B' }}>{displayName}</div>
                            <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>{updatedEmail || users || 'admin@infypos.com'}</div>
                        </div>

                        <Dropdown.Item
                            onClick={() => window.location.href = '#/app/profile/edit'}
                            className="d-flex align-items-center gap-2"
                            style={{ borderRadius: 8, fontSize: 13, padding: '8px 12px' }}
                        >
                            <UserIcon /> {getFormattedMessage('header.profile-menu.profile.label')}
                        </Dropdown.Item>

                        <Dropdown.Item
                            onClick={() => setDeleteModel(true)}
                            className="d-flex align-items-center gap-2"
                            style={{ borderRadius: 8, fontSize: 13, padding: '8px 12px' }}
                        >
                            <LockIcon /> {getFormattedMessage('header.profile-menu.change-password.label')}
                        </Dropdown.Item>

                        <Dropdown.Item
                            onClick={() => setLanguageModel(true)}
                            className="d-flex align-items-center gap-2"
                            style={{ borderRadius: 8, fontSize: 13, padding: '8px 12px' }}
                        >
                            <GlobeIcon /> {getFormattedMessage('header.profile-menu.change-language.label')}
                        </Dropdown.Item>

                        <div style={{ borderTop: '1px solid #F1F5F9', marginTop: 4, paddingTop: 4 }}>
                            <Dropdown.Item
                                onClick={onLogOut}
                                className="d-flex align-items-center gap-2 text-danger"
                                style={{ borderRadius: 8, fontSize: 13, padding: '8px 12px' }}
                            >
                                <LogoutIcon /> {getFormattedMessage('header.profile-menu.logout.label')}
                            </Dropdown.Item>
                        </div>
                    </Dropdown.Menu>
                </Dropdown>
            </div>

            {/* Modals */}
            {deleteModel && (
                <ChangePassword deleteModel={deleteModel} onClickDeleteModel={() => setDeleteModel(false)} />
            )}
            {languageModel && (
                <LanguageModel languageModel={languageModel} onClickLanguageModel={() => setLanguageModel(false)} />
            )}
            <PosRegisterModel showPosRegisterModel={showPosRegisterModel} onClickshowPosRegisterModel={() => setShowPosRegisterModel(false)} />
        </header>
    );
};

const mapStateToProps = (state) => {
    const { selectedLanguage, productQuantityReport } = state;
    return { selectedLanguage, productQuantityReport };
};

export default connect(mapStateToProps, { logoutAction, updateLanguage, productQuantityReportAction })(EnterpriseHeader);
