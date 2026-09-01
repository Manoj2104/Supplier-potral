import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useIntl } from "react-intl";
import { useDispatch } from "react-redux";
import { Tokens } from "../../constants";
import { fetchProducts } from "../../store/action/productAction";
import { fetchSales } from "../../store/action/salesAction";
import { fetchPurchases } from "../../store/action/purchaseAction";
import { fetchCustomers } from "../../store/action/customerAction";
import { fetchSuppliers } from "../../store/action/supplierAction";
import { fetchExpenses } from "../../store/action/expenseAction";
import { fetchWarehouses } from "../../store/action/warehouseAction";
import { fetchUsers } from "../../store/action/userAction";
import { fetchRoles } from "../../store/action/roleAction";
import { fetchBrands } from "../../store/action/brandsAction";
import { fetchProductCategories } from "../../store/action/productCategoryAction";
import { fetchAdjustments } from "../../store/action/adjustMentAction";
import { fetchQuotations } from "../../store/action/quotationAction";
import { fetchTransfers } from "../../store/action/transfersAction";
import { fetchUnits } from "../../store/action/unitsAction";
import { fetchBaseUnits } from "../../store/action/baseUnitsAction";
import "./EnterpriseSidebar.css";

// ─── Lucide / Modern SVG Icons ─────────────────────
const Icon = ({ d, size = 18, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
        {Array.isArray(d) ? d.map((path, i) => <path key={i} d={path} />) : <path d={d} />}
    </svg>
);

const Icons = {
    Menu:        ({ size = 19 }) => <Icon size={size} d={["M4 6h16", "M4 12h16", "M4 18h16"]} />,
    Dashboard:   ({ size = 18 }) => <Icon size={size} d={["M4 4h6v6H4z", "M14 4h6v6h-6z", "M4 14h6v6H4z", "M14 14h6v6h-6z"]} />,
    Products:    ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    Inbound:     ({ size = 18 }) => <Icon size={size} d={["M12 2v10", "M18 8l-6 6-6-6", "M2 17l10 5 10-5"]} />,
    Adjustments: ({ size = 18 }) => <Icon size={size} d={["M4 21v-7", "M4 10V3", "M12 21v-9", "M12 8V3", "M20 21v-5", "M20 11V3", "M1 14h6", "M9 8h6", "M17 11h6"]} />,
    Quotations:  ({ size = 18 }) => <Icon size={size} d={["M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2", "M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z", "M12 11h4", "M12 16h4", "M8 11h.01", "M8 16h.01"]} />,
    Purchases:   ({ size = 18 }) => <Icon size={size} d={["M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z", "M3 6h18", "M16 10a4 4 0 0 1-8 0"]} />,
    Sales:       ({ size = 18 }) => <Icon size={size} d={["M22 12h-4l-3 9L9 3l-3 9H2"]} />,
    Transfers:   ({ size = 18 }) => <Icon size={size} d={["M7 16V4m0 0L3 8m4-4l4 4", "M17 8v12m0 0l4-4m-4 4l-4-4"]} />,
    Expenses:    ({ size = 18 }) => <Icon size={size} d={["M12 1v22", "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"]} />,
    People:      ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    Roles:       ({ size = 18 }) => <Icon size={size} d={["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"]} />,
    Warehouse:   ({ size = 18 }) => <Icon size={size} d={["M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M9 22V12h6v10"]} />,
    Reports:     ({ size = 18 }) => <Icon size={size} d={["M18 20V10", "M12 20V4", "M6 20v-6"]} />,
    Currencies:  ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M15 9.5a2.5 2.5 0 0 0-5 0c0 4 5 2 5 6a2.5 2.5 0 0 1-5 0"/></svg>,
    Languages:   ({ size = 18 }) => <Icon size={size} d={["M5 8l6 6", "M4 14e2 2 0 0 0 2-2V4", "M2 5h12", "M7 2h1", "M22 22l-5-10-5 10", "M14 18h6"]} />,
    Templates:   ({ size = 18 }) => <Icon size={size} d={["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6"]} />,
    Settings:    ({ size = 18 }) => <Icon size={size} d={["M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z", "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"]} />,

    SubProducts:   ({ size = 14 }) => <Icon size={size} d={["M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"]} />,
    SubCategory:   ({ size = 14 }) => <Icon size={size} d={["M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"]} />,
    SubVariations: ({ size = 14 }) => <Icon size={size} d={["M12 2L2 7l10 5 10-5-10-5z", "M2 17l10 5 10-5", "M2 12l10 5 10-5"]} />,
    SubBrands:     ({ size = 14 }) => <Icon size={size} d={["M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"]} />,
    SubUnits:      ({ size = 14 }) => <Icon size={size} d={["M21 3H3v18h18V3z", "M9 3v18", "M15 3v18"]} />,
    SubBarcode:    ({ size = 14 }) => <Icon size={size} d={["M3 5v14", "M8 5v14", "M12 5v14", "M17 5v14", "M21 5v14"]} />,
    SubReturn:     ({ size = 14 }) => <Icon size={size} d={["M9 14L4 9l5-5", "M4 9h11a5 5 0 0 1 5 5v1"]} />,
    SubPeople:     ({ size = 14 }) => <Icon size={size} d={["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2", "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"]} />,
    SubTemplate:   ({ size = 14 }) => <Icon size={size} d={["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"]} />,

    ChevronRight:  ({ size = 14, className = "" }) => <Icon size={size} className={className} d={["M9 18l6-6-6-6"]} />,
    Search:        ({ size = 14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    Billing:       ({ size = 18 }) => <Icon size={size} d={["M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z", "M1 10h22"]} />,
    Close:         ({ size = 14 }) => <Icon size={size} d={["M18 6L6 18", "M6 6l12 12"]} />,
};

const getIconForName = (name, size = 18) => {
    const map = {
        "dashboard": <Icons.Dashboard size={size} />,
        "products": <Icons.Products size={size} />,
        "inbound": <Icons.Inbound size={size} />,
        "inbound planning": <Icons.Inbound size={size} />,
        "stock grn": <Icons.Inbound size={size} />,
        "receiving orders": <Icons.Inbound size={size} />,
        "product master catalog": <Icons.Products size={size} />,
        "product categories": <Icons.SubCategory size={size} />,
        "variations": <Icons.SubVariations size={size} />,
        "brands": <Icons.SubBrands size={size} />,
        "units": <Icons.SubUnits size={size} />,
        "base units": <Icons.SubUnits size={size} />,
        "print barcode": <Icons.SubBarcode size={size} />,
        "adjustments": <Icons.Adjustments size={size} />,
        "quotations.title": <Icons.Quotations size={size} />,
        "purchases": <Icons.Purchases size={size} />,
        "purchases return": <Icons.SubReturn size={size} />,
        "supplier payments": <Icons.Billing size={size} />,
        "sales": <Icons.Sales size={size} />,
        "sales return": <Icons.SubReturn size={size} />,
        "transfers": <Icons.Transfers size={size} />,
        "expenses": <Icons.Expenses size={size} />,
        "expense categories": <Icons.SubCategory size={size} />,
        "pepoles": <Icons.People size={size} />,
        "suppliers": <Icons.SubPeople size={size} />,
        "customers": <Icons.SubPeople size={size} />,
        "users": <Icons.SubPeople size={size} />,
        "roles": <Icons.Roles size={size} />,
        "warehouse": <Icons.Warehouse size={size} />,
        "reports": <Icons.Reports size={size} />,
        "currencies": <Icons.Currencies size={size} />,
        "languages": <Icons.Languages size={size} />,
        "template": <Icons.Templates size={size} />,
        "email-templates": <Icons.SubTemplate size={size} />,
        "sms-templates": <Icons.SubTemplate size={size} />,
        "sms-api": <Icons.Settings size={size} />,
        "settings": <Icons.Settings size={size} />,
        "system settings": <Icons.Settings size={size} />,
        "prefixes": <Icons.SubBarcode size={size} />,
        "mail settings": <Icons.Templates size={size} />,
        "pda connection": <Icons.SubBarcode size={size} />,
        "subscription": <Icons.Billing size={size} />,
        "billing & subscription": <Icons.Billing size={size} />,
    };
    return map[name?.toLowerCase()?.trim()] || <Icons.Dashboard size={size} />;
};

const EnterpriseSidebar = ({ asideConfig, frontSetting, isResponsiveMenu, menuClick, isCollapsed, onToggleCollapse }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const intl = useIntl();
    const [openMenus, setOpenMenus] = useState({});
    const [searchTerm, setSearchTerm] = useState("");

    // Prefetch routes on hover
    const prefetchRoute = useCallback((to) => {
        if (!to) return;
        try {
            switch (to) {
                case "/app/products":
                    dispatch(fetchProducts({}, false));
                    break;
                case "/app/sales":
                    dispatch(fetchSales({}, false));
                    break;
                case "/app/purchases":
                    dispatch(fetchPurchases({}, false));
                    break;
                case "/app/customers":
                    dispatch(fetchCustomers({}, false));
                    break;
                case "/app/suppliers":
                    dispatch(fetchSuppliers({}, false));
                    break;
                case "/app/expenses":
                    dispatch(fetchExpenses({}, false));
                    break;
                case "/app/warehouses":
                    dispatch(fetchWarehouses({}, false));
                    break;
                case "/app/users":
                    dispatch(fetchUsers({}, false));
                    break;
                case "/app/roles":
                    dispatch(fetchRoles({}, false));
                    break;
                case "/app/brands":
                    dispatch(fetchBrands({}, false));
                    break;
                case "/app/product-categories":
                    dispatch(fetchProductCategories({}, false));
                    break;
                case "/app/units":
                    dispatch(fetchUnits({}, false));
                    break;
                case "/app/base-units":
                case "/app/base_units":
                    dispatch(fetchBaseUnits({}, false));
                    break;
                case "/app/adjustments":
                    dispatch(fetchAdjustments({}, false));
                    break;
                case "/app/quotations":
                    dispatch(fetchQuotations({}, false));
                    break;
                case "/app/transfers":
                    dispatch(fetchTransfers({}, false));
                    break;
                default:
                    break;
            }
        } catch (_) {}
    }, [dispatch]);

    // Background Warm-up during browser idle time (0ms perceived navigation)
    useEffect(() => {
        const timer = setTimeout(() => {
            try {
                dispatch(fetchUnits({}, false));
                dispatch(fetchBaseUnits({}, false));
            } catch (_) {}
        }, 1500);

        return () => clearTimeout(timer);
    }, [dispatch]);

    // Auto-open active menu on load or location change
    useEffect(() => {
        if (!asideConfig) return;
        asideConfig.forEach(item => {
            if (item.newRoute) {
                const isActive = item.newRoute.some(sub =>
                    location.pathname === sub.to || location.pathname.startsWith(sub.to)
                );
                if (isActive) {
                    setOpenMenus(prev => ({ ...prev, [item.name]: true }));
                }
            }
        });
    }, [location.pathname, asideConfig]);

    const toggleMenu = (name) => {
        setOpenMenus(prev => ({ ...prev, [name]: !prev[name] }));
    };

    // Check if an item or its children are active
    const isItemActive = (item) => {
        if (item.to && (location.pathname === item.to || location.pathname.startsWith(item.to))) return true;
        if (item.path && location.pathname === item.path) return true;
        if (item.mailSettingsPath && location.pathname === item.mailSettingsPath) return true;
        if (item.prefixesPath && location.pathname === item.prefixesPath) return true;
        const pathKeys = ['stockPath','purchasePath','topSellingPath','productQuantityAlertPath','supplierReportPath','profitLossReportPath','bestCustomerReportPath','customerReportPath','registerReportPath','supplierReportDetailsPath','customerReportDetailsPath'];
        return pathKeys.some(k => item[k] && location.pathname.startsWith(item[k]));
    };

    const isSubItemActive = (sub) => {
        return location.pathname === sub.to || location.pathname.startsWith(sub.to);
    };

    const handleRowClick = (item) => {
        if (isCollapsed) {
            navigate(item.to || (item.newRoute && item.newRoute[0]?.to));
        } else {
            if (item.newRoute && item.newRoute.length > 0) {
                toggleMenu(item.name);
            } else {
                navigate(item.to);
            }
        }
    };

    const getLabel = (title) => {
        if (!title) return "";
        return intl.formatMessage({ id: title, defaultMessage: title });
    };

    const filteredConfig = useMemo(() => {
        if (!asideConfig) return [];
        return asideConfig.filter(item => {
            if (item.to === "/app/pos") return false;
            if (!searchTerm) return true;
            const label = getLabel(item.title).toLowerCase();
            if (label.includes(searchTerm.toLowerCase())) return true;
            if (item.newRoute) {
                return item.newRoute.some(sub =>
                    getLabel(sub.title).toLowerCase().includes(searchTerm.toLowerCase())
                );
            }
            return false;
        });
    }, [asideConfig, searchTerm, intl]);

    const renderNavItem = (item, idx) => {
        const label = getLabel(item.title);
        const icon = getIconForName(item.name, 18);
        const hasChildren = !!(item.newRoute && item.newRoute.length);
        const isOpen = openMenus[item.name];

        const itemActive = isItemActive(item);
        const parentHighlight = isCollapsed ? itemActive : (!hasChildren && itemActive);

        if (hasChildren) {
            return (
                <div key={item.name || idx} className={`esb-nav-item ${isOpen ? 'open' : ''}`}>
                    <div
                        className={`esb-nav-row ${parentHighlight ? 'active' : ''}`}
                        onClick={() => handleRowClick(item)}
                        onMouseEnter={() => {
                            if (item.newRoute && item.newRoute[0]) prefetchRoute(item.newRoute[0].to);
                        }}
                        title={isCollapsed ? label : undefined}
                    >
                        <div className="esb-icon-box">{icon}</div>
                        {!isCollapsed && <span className="esb-nav-label">{label}</span>}
                        {!isCollapsed && <Icons.ChevronRight size={14} className="esb-arrow" />}
                    </div>

                    {/* Expanded Submenu */}
                    {!isCollapsed && (
                        <div className="esb-submenu">
                            {item.newRoute.map((sub, si) => {
                                const subLabel = getLabel(sub.title);
                                const subIcon = getIconForName(sub.name, 14);
                                const subActive = isSubItemActive(sub);
                                return (
                                    <Link
                                        key={si}
                                        to={sub.to}
                                        className={`esb-sub-item ${subActive ? 'active' : ''}`}
                                        onMouseEnter={() => prefetchRoute(sub.to)}
                                    >
                                        <span className="esb-sub-icon">{subIcon}</span>
                                        <span>{subLabel}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                    {/* Collapsed Hover Flyout Panel */}
                    {isCollapsed && (
                        <div className="esb-flyout">
                            <div className="esb-flyout-title">{label}</div>
                            {item.newRoute.map((sub, si) => (
                                <Link
                                    key={si}
                                    to={sub.to}
                                    className={`esb-flyout-item ${isSubItemActive(sub) ? 'active' : ''}`}
                                    onMouseEnter={() => prefetchRoute(sub.to)}
                                >
                                    {getLabel(sub.title)}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        // Single Item
        return (
            <div key={item.name || idx} className="esb-nav-item">
                <Link
                    to={item.to}
                    className={`esb-nav-row ${parentHighlight ? 'active' : ''}`}
                    onMouseEnter={() => prefetchRoute(item.to)}
                    title={isCollapsed ? label : undefined}
                >
                    <div className="esb-icon-box">{icon}</div>
                    {!isCollapsed && <span className="esb-nav-label">{label}</span>}
                </Link>
                {isCollapsed && <div className="esb-tooltip">{label}</div>}
            </div>
        );
    };

    return (
        <>
            <aside className={`esb-sidebar ${isCollapsed ? 'collapsed' : 'expanded'} ${isResponsiveMenu ? 'mobile-open' : ''}`}>
                {/* ── Header ── */}
                <div className="esb-header">
                    <Link to="/app/dashboard" className="esb-logo-wrap">
                        {frontSetting?.value?.logo ? (
                            <img src={frontSetting.value.logo} className="esb-logo-img" alt="Logo" />
                        ) : (
                            <div className="esb-logo-badge">
                                <span className="esb-logo-infinity">∞</span>
                            </div>
                        )}
                        {!isCollapsed && (
                            <div className="esb-logo-text">
                                <span className="esb-logo-name">
                                    {frontSetting?.value?.company_name || "Suguna POS"}
                                </span>
                            </div>
                        )}
                    </Link>
                    <button
                        type="button"
                        className="esb-toggle-btn"
                        onClick={onToggleCollapse}
                        title={isCollapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
                    >
                        <Icons.Menu size={19} />
                    </button>
                </div>

                {/* ── Search Bar (Expanded Only) ── */}
                {!isCollapsed && (
                    <div className="esb-search-wrap">
                        <div className="esb-search">
                            <Icons.Search size={14} />
                            <input
                                type="text"
                                placeholder="Search modules..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    className="esb-search-clear"
                                    onClick={() => setSearchTerm("")}
                                    title="Clear search"
                                >
                                    <Icons.Close size={12} />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Scrollable Nav Content ── */}
                <div className="esb-content">
                    {filteredConfig.map((item, idx) => renderNavItem(item, idx))}
                </div>

                {/* ── Need Help? Widget ── */}
                {!isCollapsed && (
                    <div className="esb-help-box">
                        <div className="esb-help-row">
                            <div className="esb-help-icon-wrap">
                                <div className="esb-help-bubble esb-help-bubble-main">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                    </svg>
                                </div>
                            </div>
                            <div className="esb-help-text">
                                <span className="esb-help-title">Need Help?</span>
                                <span className="esb-help-desc">Our support team is ready to help you anytime.</span>
                            </div>
                        </div>
                        <Link to="/app/support" className="esb-help-btn">
                            Visit Help Center &nbsp;→
                        </Link>
                    </div>
                )}
            </aside>

            {isResponsiveMenu && <div className="esb-overlay visible" onClick={menuClick} />}
        </>
    );
};

export default EnterpriseSidebar;
