import React, { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
    ProSidebar,
    SidebarHeader,
    SidebarContent,
    MenuItem,
    Menu,
    SubMenu,
} from "react-pro-sidebar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "react-pro-sidebar/dist/css/styles.css";
import "./PremiumSidebar.css";
import {
    LayoutDashboard,
    Boxes,
    FolderOpen,
    Layers,
    Bookmark,
    Ruler,
    Sliders,
    ClipboardList,
    ShoppingCart,
    Undo2,
    TrendingUp,
    CornerDownLeft,
    ArrowLeftRight,
    Receipt,
    Tag,
    Users,
    Truck,
    UserCheck,
    User,
    ShieldAlert,
    Warehouse,
    BarChart3,
    Coins,
    Globe,
    Layout,
    Mail,
    MessageSquare,
    Smartphone,
    Settings,
    LogOut,
    Menu as HamburgerIcon,
    Search,
    Server,
    QrCode
} from "lucide-react";
import {
    getFormattedMessage,
    placeholderText,
} from "../../shared/sharedMethod";
import { useIntl } from "react-intl";
import { Tokens } from "../../constants";

// Lucide Icon Mapping Lookup
const lucideIconMap = {
    "dashboard": LayoutDashboard,
    "products": Boxes,
    "product categories": FolderOpen,
    "variations": Layers,
    "brands": Bookmark,
    "units": Ruler,
    "base units": Ruler,
    "print barcode": QrCode,
    "adjustments": Sliders,
    "quotations.title": ClipboardList,
    "purchases": ShoppingCart,
    "purchases return": Undo2,
    "sales": TrendingUp,
    "sales return": CornerDownLeft,
    "transfers": ArrowLeftRight,
    "expenses": Receipt,
    "expense categories": Tag,
    "Pepoles": Users,
    "suppliers": Truck,
    "customers": UserCheck,
    "users": User,
    "roles": ShieldAlert,
    "warehouse": Warehouse,
    "reports": BarChart3,
    "currencies": Coins,
    "Languages": Globe,
    "template": Layout,
    "email-templates": Mail,
    "sms-templates": MessageSquare,
    "sms-api": Smartphone,
    "pos": Coins,
    "settings": Settings
};

const AsideMenu = (props) => {
    const {
        asideConfig,
        frontSetting,
        isResponsiveMenu,
        menuClick,
        menuIconClick,
        isMenuCollapse,
    } = props;

    const location = useLocation();
    const intl = useIntl();
    const { id } = useParams();
    const [searchTerm, setSearchTerm] = useState("");
    const displayName = [localStorage.getItem(Tokens.FIRST_NAME), localStorage.getItem(Tokens.LAST_NAME)]
        .filter(Boolean)
        .join(" ") 
        || localStorage.getItem(Tokens.FIRST_NAME) 
        || "Admin";

    const getMenuIcon = (name, defaultIcon) => {
        const IconComponent = lucideIconMap[name];
        if (IconComponent) {
            return <IconComponent size={20} />;
        }
        return defaultIcon;
    };

    const getSection = (item) => {
        if (["dashboard", "products"].includes(item.name)) return "MAIN";
        if (["adjustments", "warehouse", "transfers"].includes(item.name)) return "INVENTORY";
        if (["sales", "quotations"].includes(item.name)) return "SALES";
        if (["purchases", "expenses", "Pepoles"].includes(item.name)) return "PURCHASES";
        return "MANAGEMENT";
    };

    const logout = () => {
        localStorage.removeItem(Tokens.ADMIN);
        window.location.href = "#/login";
    };

    useEffect(() => {
        updateMenu();
    }, [updatedLanguage]);

    const updateMenu = () => {
        if (updatedLanguage === "ar") {
            var content = document.getElementsByClassName("pro-arrow-wrapper");
            for (let index = 0; index < content.length; index++) {
                content[index].style.textAlign = "end";
            }
        }
    };

    const filterMenu = (asideConfig, searchTerm) => {
        if (!searchTerm) {
            return asideConfig;
        }
        return asideConfig.filter((post) => {
            if (post.newRoute || post.subTitles) {
                if (post.newRoute) {
                    const allrouth = post.newRoute.map((posts) => {
                        const postName = intl
                            .formatMessage({ id: `${posts.title}` })
                            .toLowerCase();
                        return postName.includes(searchTerm.toLowerCase());
                    });
                    return allrouth.includes(true);
                } else {
                    const allrouth = post.subTitles.map((posts) => {
                        const postName = intl
                            .formatMessage({ id: `${posts.title}` })
                            .toLowerCase();
                        return postName.includes(searchTerm.toLowerCase());
                    });
                    return allrouth.includes(true);
                }
            } else {
                const postName = intl
                    .formatMessage({ id: `${post.title}` })
                    .toLowerCase();
                return postName.includes(searchTerm.toLowerCase());
            }
        });
    };

    const filteredMenu = filterMenu(asideConfig, searchTerm);

    useEffect(() => {
        if (filteredMenu) {
            var element = document.getElementsByClassName("myDIV");
            var content = document.getElementsByClassName("pro-item-content");
            var arrow = document.getElementsByClassName("pro-arrow-wrapper");
            filteredMenu.map((SubMenus) => {
                for (let index = 0; index < element.length; index++) {
                    if (SubMenus.newRoute && searchTerm.length > 0) {
                        element[index].lastChild.classList.remove("closed");
                        element[index].lastChild.style.height = "auto";
                        element[index].classList.add("open");
                        if (updatedLanguage === "ar") {
                            arrow[index].style.textAlign = "end";
                        }
                    } else {
                        if (!searchTerm) {
                            element[index].lastChild.classList.add("closed");
                            element[index].classList.remove("open");
                            if (updatedLanguage === "ar") {
                                arrow[index].style.textAlign = "end";
                            }
                        }
                    }
                }
                for (let index = 0; index < content.length; index++) {
                    if (SubMenus.newRoute && searchTerm.length) {
                        const postName =
                            content[index].children[0]?.innerText.toLowerCase();
                        if (postName !== undefined) {
                            if (
                                postName.includes(searchTerm.toLowerCase()) ===
                                    true ||
                                postName === "reports"
                            ) {
                                const hideElement =
                                    content[index].firstChild.parentElement
                                        .parentElement.parentElement;
                                hideElement.classList.remove("notShow");
                                hideElement.classList.add("d-flex");
                            } else {
                                const hideElement =
                                    content[index].firstChild.parentElement
                                        .parentElement.parentElement;
                                hideElement.classList.remove("d-flex");
                                hideElement.classList.add("notShow");
                            }
                        }
                    } else {
                        if (!searchTerm) {
                            const showElement =
                                content[index].parentElement.parentElement;
                            showElement.classList.remove("notShow");
                        }
                    }
                }
            });
        }
    }, [filteredMenu && searchTerm.length]);

    useEffect(() => {
        var content = document.getElementsByClassName("pro-item-content");
        var element = document.getElementsByClassName("myDIV");
        for (let index = 0; index < content.length; index++) {
            const hideElementOne =
                content[index].firstChild.parentElement.parentElement
                    .parentElement;
            if (
                hideElementOne.classList.value.includes(
                    "pro-menu-item d-flex flex-column active"
                )
            ) {
                let closedElement =
                    hideElementOne.parentElement.parentElement.parentElement;
                closedElement.classList.add("openMenu");
                let activeElementOne = closedElement.parentElement;
                activeElementOne.classList.add("pro-active-sub");
            }
        }
        for (let index = 0; index < element.length; index++) {
            if (element[index].classList.value.includes("pro-active-sub")) {
                let closeMenu = element[index].firstChild.lastChild.firstChild;
                if (updatedLanguage === "ar") {
                    closeMenu.style.transform = "rotate(-45deg)";
                } else {
                    closeMenu.style.transform = "rotate(45deg)";
                }
                element[index].addEventListener("click", () => {
                    let opneElement = element[index].lastChild;
                    if (
                        opneElement.classList.value.includes(
                            "closed openMenu transitioning"
                        ) ||
                        opneElement.classList.value.includes(
                            "openMenu transitioning closed"
                        ) ||
                        opneElement.classList.value.includes(
                            "transitioning openMenu closed"
                        )
                    ) {
                        opneElement.classList.toggle("closeMenu", "closeMenu");
                        opneElement.classList.toggle("openMenu", "");
                        if (updatedLanguage === "ar") {
                            closeMenu.style.transform = "rotate(45deg)";
                        } else {
                            closeMenu.style.transform = "rotate(-45deg)";
                        }
                    } else {
                        if (updatedLanguage === "ar") {
                            closeMenu.style.transform = "rotate(-45deg)";
                        } else {
                            closeMenu.style.transform = "rotate(45deg)";
                        }
                        opneElement.classList.toggle("closeMenu", "");
                        opneElement.classList.toggle("openMenu", "openMenu");
                        opneElement.classList.add("closed");
                    }
                });
            }
        }
    }, [location.pathname]);

    return (
        <>
            <ProSidebar
                collapsed={isMenuCollapse}
                className={`${
                    isResponsiveMenu === true ? "open-menu" : "hide-menu"
                } aside-menu-container`}
            >
                <SidebarHeader className="aside-menu-container__aside-logo flex-column-auto">
                    <a
                        href="/"
                        className="text-decoration-none sidebar-logo text-gray-900"
                    >
                        <div
                            className={`${
                                isMenuCollapse
                                    ? "d-flex justify-content-center w-100"
                                    : "image image-mini me-3"
                            }`}
                        >
                            <img
                                src={
                                    frontSetting.value &&
                                    frontSetting.value.logo
                                }
                                className="img-fluid object-fit-contain"
                                alt="profile image"
                            />
                        </div>

                        {isMenuCollapse
                            ? null
                            : frontSetting.value &&
                              frontSetting.value.show_app_name_in_sidebar ===
                                  "1"
                            ? frontSetting.value.company_name
                            : ""}
                    </a>
                    <button
                        type="button"
                        onClick={(e) => menuIconClick(e)}
                        className="btn p-0 aside-menu-container__aside-menubar d-lg-block d-none sidebar-btn border-0"
                        title="Toggle Sidebar (Ctrl + B)"
                    >
                        <HamburgerIcon size={20} />
                    </button>
                </SidebarHeader>
                <SidebarContent className="sidebar-scrolling">
                    <div
                        className={`d-flex position-relative aside-menu-container__aside-search search-control ${
                            isMenuCollapse ? "d-none" : ""
                        } py-3 mt-1`}
                    >
                        <div className="position-relative d-flex w-100">
                            <input
                                className={`form-control ps-8 ${
                                    isMenuCollapse ? "d-none" : ""
                                }`}
                                type="search"
                                id="search"
                                placeholder={placeholderText(
                                    "react-data-table.searchbar.placeholder"
                                )}
                                aria-label="Search"
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <span className="position-absolute d-flex align-items-center top-0 bottom-0 left-0 text-gray-600 ms-3">
                                <Search size={18} />
                            </span>
                        </div>
                    </div>
                    <Menu>
                        {filteredMenu.length ? (
                            filteredMenu.map((mainItems, index) => {
                                return <React.Fragment key={mainItems.name || index}>
                                    {mainItems.newRoute ? (
                                    <SubMenu
                                        title={intl.formatMessage({
                                            id: `${mainItems.title}`,
                                        })}
                                        className={
                                            location.pathname ===
                                                mainItems?.subPath
                                                    ?.userSubPath ||
                                            location.pathname ===
                                                mainItems?.subPath
                                                    ?.customerSubPath ||
                                            location.pathname ===
                                                mainItems?.subPath
                                                    ?.suppliareSubPath ||
                                            location.pathname ===
                                                mainItems?.subPath
                                                    ?.productsSubPath ||
                                            location.pathname ===
                                                mainItems?.subPath
                                                    ?.categoriesSubPath ||
                                            location.pathname ===
                                                mainItems?.subPath
                                                    ?.brandsSubPath ||
                                            location.pathname ===
                                                mainItems?.subPath
                                                    ?.unitsSubPath ||
                                            location.pathname ===
                                                mainItems?.subPath
                                                    ?.baseUnitsSubPath ||
                                            location.pathname ===
                                                mainItems?.subPath
                                                    ?.barcodeSubPath ||
                                            location.pathname ===
                                                mainItems?.subPath
                                                    ?.purchasesSubPath ||
                                            location.pathname ===
                                                mainItems?.subPath
                                                    ?.purchaseReturnSubPath ||
                                            location.pathname ===
                                                mainItems?.subPath
                                                    ?.salesSubPath ||
                                            location.pathname ===
                                                mainItems?.subPath
                                                    ?.salesReturnSubPath ||
                                            location.pathname ===
                                                mainItems?.subPath
                                                    ?.expensesSubPath ||
                                            location.pathname ===
                                                mainItems?.subPath
                                                    ?.expenseCategoriesSubPath ||
                                            location.pathname ===
                                                mainItems?.subPath
                                                    ?.emailTemplateSubPath ||
                                            location.pathname ===
                                                mainItems?.subPath
                                                    ?.smsTemplateSubPath ||
                                            location.pathname ===
                                                mainItems?.subPath
                                                    ?.smsApiSubPath
                                                ? "pro-active-sub myDIV"
                                                : "myDIV"
                                        }
                                        icon={getMenuIcon(mainItems.name, mainItems.fontIcon)}
                                    >
                                        {mainItems.newRoute.map(
                                            (subMainItems, index) => {
                                                return (
                                                    <MenuItem
                                                        key={index}
                                                        icon={getMenuIcon(subMainItems.name, subMainItems.fontIcon)}
                                                        className={`${
                                                            isMenuCollapse ===
                                                            false
                                                                ? subMainItems.class
                                                                : ""
                                                        } flex-column`}
                                                        active={
                                                            location.pathname ===
                                                                subMainItems.to ||
                                                            location.pathname ===
                                                                subMainItems.path ||
                                                            location.pathname.includes(
                                                                subMainItems.to
                                                            ) ||
                                                            location.pathname ===
                                                                subMainItems.stockPath ||
                                                            location.pathname ===
                                                                subMainItems.productPath ||
                                                            location.pathname ===
                                                                subMainItems.purchasePath ||
                                                            location.pathname ===
                                                                subMainItems.topSellingPath ||
                                                            location.pathname ===
                                                                subMainItems.productQuantityAlertPath ||
                                                            location.pathname ===
                                                                subMainItems.stockDetailPath +
                                                                    "/" +
                                                                    id
                                                        }
                                                    >
                                                        <Link
                                                            to={subMainItems.to}
                                                        >
                                                            {intl.formatMessage(
                                                                {
                                                                    id: `${subMainItems.title}`,
                                                                }
                                                            )}
                                                        </Link>
                                                    </MenuItem>
                                                );
                                            }
                                        )}
                                    </SubMenu>
                                ) : (
                                    mainItems.to !== "/app/pos" && (
                                        <MenuItem
                                            icon={getMenuIcon(mainItems.name, mainItems.fontIcon)}
                                            className={`${
                                                isMenuCollapse === false
                                                    ? mainItems.class
                                                    : ""
                                            } flex-column`}
                                            active={
                                                location.pathname ===
                                                    mainItems.to ||
                                                location.pathname ===
                                                    mainItems.path ||
                                                location.pathname ===
                                                    mainItems.mailSettingsPath ||
                                                location.pathname ===
                                                    mainItems.prefixesPath ||
                                                location.pathname ===
                                                    mainItems.profitLossReportPath ||
                                                location.pathname.includes(
                                                    mainItems.to
                                                ) ||
                                                location.pathname ===
                                                    mainItems.stockPath ||
                                                location.pathname ===
                                                    mainItems.productPath ||
                                                location.pathname ===
                                                    mainItems.purchasePath ||
                                                location.pathname ===
                                                    mainItems.topSellingPath ||
                                                location.pathname ===
                                                    mainItems.productQuantityAlertPath ||
                                                location.pathname ===
                                                    mainItems.supplierReportPath ||
                                                location.pathname ===
                                                    mainItems.customerReportPath ||
                                                location.pathname ===
                                                    mainItems.bestCustomerReportPath ||
                                                location.pathname ===
                                                    mainItems.registerReportPath ||
                                                location.pathname ===
                                                    mainItems.supplierReportDetailsPath +
                                                        "/" +
                                                        id ||
                                                location.pathname ===
                                                    mainItems.customerReportDetailsPath +
                                                        "/" +
                                                        id
                                            }
                                        >
                                            <Link to={mainItems.to}>
                                                {intl.formatMessage({
                                                    id: `${mainItems.title}`,
                                                })}
                                            </Link>
                                        </MenuItem>
                                    )
                                )}
                                </React.Fragment>;
                            })
                        ) : (
                            <div className="text-center">
                                {getFormattedMessage("side-menu.empty.message")}
                            </div>
                        )}
                    </Menu>
                    {!isMenuCollapse && (
                        <div className="premium-promo-card">
                            <div className="promo-bg-circle-1"></div>
                            <div className="promo-bg-circle-2"></div>
                            
                            <div className="promo-header">
                                <div className="promo-user-avatar">
                                    {displayName.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="promo-user-info">
                                    <h4 className="promo-user-name">{displayName}</h4>
                                    <p className="promo-user-role">Administrator</p>
                                </div>
                            </div>
                            
                            <div className="promo-storage-section">
                                <div className="promo-storage-text">
                                    <div className="d-flex align-items-center gap-1">
                                        <Server size={12} className="text-success" />
                                        <span>Database Storage</span>
                                    </div>
                                    <strong style={{ fontSize: '11px', color: '#16A34A' }}>48%</strong>
                                </div>
                                <div style={{ fontSize: '10.5px', color: '#64748B', marginBottom: '4px', fontWeight: 500 }}>
                                    48.2 GB of 100 GB used
                                </div>
                                <div className="premium-progress-bar">
                                    <div className="premium-progress-bar-fill" style={{ width: '48%', background: 'linear-gradient(90deg, #16A34A, #22C55E)' }}></div>
                                </div>
                            </div>
                            
                            <div className="promo-actions">
                                <Link to="/app/settings" className="promo-btn-settings">
                                    <Settings size={14} /> Settings
                                </Link>
                                <button type="button" onClick={logout} className="promo-btn-logout">
                                    <LogOut size={14} /> Log out
                                </button>
                            </div>
                        </div>
                    )}
                </SidebarContent>
            </ProSidebar>

            <div
                className={`${
                    isResponsiveMenu === true && "bg-overlay d-block"
                }`}
                onClick={menuClick}
            />
        </>
    );
};

export default AsideMenu;
