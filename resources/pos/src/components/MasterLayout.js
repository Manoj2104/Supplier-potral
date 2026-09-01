import React, { useEffect, useState, useCallback } from "react";
import { connect } from "react-redux";
import EnterpriseSidebar from "./sidebar/EnterpriseSidebar";
import Header from "./header/Header";
import Footer from "./footer/Footer";
import { Tokens } from "../constants";
import asideConfig from "../config/asideConfig";
import { environment } from "../config/environment";
import { fetchConfig } from "../store/action/configAction";
import SubscriptionExpiryBanner from "./subscription/SubscriptionExpiryBanner";
import SubscriptionReminderModal from "./subscription/SubscriptionReminderModal";

const MasterLayout = (props) => {
    const {
        children,
        newPermissions,
        frontSetting,
        fetchConfig,
        config,
        allConfigData,
    } = props;

    const [isResponsiveMenu, setIsResponsiveMenu] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false); // Clean boolean toggle: false (expanded 230px), true (collapsed 70px)
    const newRoutes = prepareRoutes(config);
    const token = localStorage.getItem(Tokens.ADMIN);

    useEffect(() => {
        if (token) {
            fetchConfig();
        }
        if (!token) {
            window.location.href = environment.URL + "#" + "/login";
        }
    }, []);

    /* Ctrl+B shortcut to toggle collapse */
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
                e.preventDefault();
                setIsCollapsed(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const toggleCollapse = useCallback(() => {
        setIsCollapsed(prev => !prev);
    }, []);

    const menuClick = () => {
        setIsResponsiveMenu(!isResponsiveMenu);
    };

    const getWrapperMargin = () => {
        return isCollapsed ? "70px" : "265px";
    };

    return (
        <div className="d-flex flex-row flex-column-fluid">
            {/* Enterprise Sidebar */}
            <EnterpriseSidebar
                asideConfig={newRoutes}
                frontSetting={frontSetting}
                isResponsiveMenu={isResponsiveMenu}
                menuClick={menuClick}
                isCollapsed={isCollapsed}
                onToggleCollapse={toggleCollapse}
            />

            {/* Main Content Area */}
            <div
                className="d-flex flex-column flex-row-fluid"
                style={{
                    marginLeft: getWrapperMargin(),
                    width: `calc(100vw - ${getWrapperMargin()})`,
                    maxWidth: `calc(100vw - ${getWrapperMargin()})`,
                    transition: 'margin-left 200ms cubic-bezier(0.4, 0, 0.2, 1), width 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                    minHeight: '100vh',
                    background: '#F8FAFC',
                    overflowX: 'hidden',
                    boxSizing: 'border-box',
                }}
            >
                {/* Top Navbar — 100% Permanently Fixed to Viewport */}
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: getWrapperMargin(),
                        width: `calc(100vw - ${getWrapperMargin()})`,
                        zIndex: 1040,
                        background: '#FFFFFF',
                        transition: 'left 200ms cubic-bezier(0.4, 0, 0.2, 1), width 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
                        borderBottom: '1px solid #E2E8F0',
                    }}
                >
                    <Header
                        newRoutes={newRoutes}
                        isMenuCollapse={isCollapsed}
                        menuIconClick={toggleCollapse}
                        menuClick={menuClick}
                    />
                    {/* Subscription Expiry Warning Banner — shows when ≤ 6 days remain */}
                    <SubscriptionExpiryBanner />
                    {/* Subscription Reminder Modal — Microsoft 365 / Adobe / Shopify style expiry popup */}
                    <SubscriptionReminderModal />
                </div>

                {/* Page Content — Padded top so content smoothly scrolls under fixed header */}
                <div className="content d-flex flex-column flex-column-fluid" style={{ paddingTop: '74px' }}>
                    <div className="d-flex flex-column-fluid">
                        <div className="container-fluid">{children}</div>
                    </div>
                </div>

                {/* Footer */}
                <div className="container-fluid">
                    <Footer allConfigData={allConfigData} frontSetting={frontSetting} />
                </div>
            </div>
        </div>
    );
};

/* ── Route permission filtering ── */
const getEffectivePermissions = (config) => {
    if (config && Array.isArray(config) && config.length > 0) {
        return config;
    }
    try {
        const cached = localStorage.getItem('infypos_permissions');
        if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch (e) {}
    return null;
};

const getRouteWithSubMenu = (route, permissions) => {
    const subRoutes = route.subMenu
        ? route.subMenu.filter(
              (item) =>
                  permissions.indexOf(item.permission) !== -1 ||
                  item.permission === ""
          )
        : null;
    const newSubRoutes = subRoutes ? { ...route, newRoute: subRoutes } : route;
    return newSubRoutes;
};

const prepareRoutes = (config) => {
    const permissions = getEffectivePermissions(config);
    let filterRoutes = [];
    asideConfig.forEach((route) => {
        if (!permissions) {
            // Instant 0ms fallback: show route with its subMenu immediately
            filterRoutes.push(route.subMenu ? { ...route, newRoute: route.subMenu } : route);
        } else {
            const permissionsRoute = getRouteWithSubMenu(route, permissions);
            if (
                (permissions.indexOf(route.permission) !== -1) ||
                route.permission === "" ||
                permissionsRoute.newRoute?.length
            ) {
                filterRoutes.push(permissionsRoute);
            }
        }
    });
    return filterRoutes;
};

const mapStateToProps = (state) => {
    const newPermissions = [];
    const { permissions, settings, frontSetting, config, allConfigData } = state;

    if (permissions) {
        permissions.forEach((permission) =>
            newPermissions.push(permission.attributes.name)
        );
    }
    return { newPermissions, settings, frontSetting, config, allConfigData };
};

export default connect(mapStateToProps, { fetchConfig })(MasterLayout);
