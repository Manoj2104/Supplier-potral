import React, { useEffect, useState } from "react";
import { Route, useLocation, Navigate, Routes } from "react-router-dom";
import "../../pos/src/assets/sass/style.react.scss";
import { useDispatch, useSelector } from "react-redux";
import { IntlProvider } from "react-intl";
import { settingsKey, Tokens } from "./constants";
import Toasts from "./shared/toast/Toasts";
import { fetchFrontSetting } from "./store/action/frontSettingAction";
import { fetchConfig } from "./store/action/configAction";
import { addRTLSupport } from "./shared/sharedMethod";
import Login from "./components/auth/Login";
import ResetPassword from "./components/auth/ResetPassword";
import ForgotPassword from "./components/auth/ForgotPassword";
import AdminApp from "./AdminApp";
import SuperAdminPortal from "./components/superAdmin/SuperAdminPortal";
import { getFiles } from "./locales/index";

import DeviceRestrictionGuard from "./components/deviceGuard/DeviceRestrictionGuard";

function App() {
    const dispatch = useDispatch();
    const { updateLanguage } = useSelector((state) => state);
    const location = useLocation();
    const token = localStorage.getItem(Tokens.ADMIN);
    const updatedLanguage = localStorage.getItem(Tokens.UPDATED_LANGUAGE);
    const { selectedLanguage, config, language } = useSelector(
        (state) => state
    );
    const [allLocales, setAllLocales] = useState({});
    const [messages, setMessages] = useState({});
    const [userEditedMessage, setUserEditedMessage] = useState({});
    const updateLanguag =
        allLocales[updatedLanguage ? updatedLanguage : selectedLanguage];
    const [languageData, setLanguageData] = useState([]);

    const mapPermissionToRoute = (permission) => {
        if (!permission || typeof permission !== 'string') return '/app/dashboard';
        const entity = permission.split('_')[1];
        return `/app/${entity}`;
    };

    const [mappedRoutes, setMappedRoutes] = useState([]);
    const [redirectTo, setRedirectTo] = useState('/app/dashboard');

    useEffect(() => {
        if (config && Array.isArray(config)) {
            setMappedRoutes(config.map(mapPermissionToRoute));
        }
    }, [config]);

    useEffect(() => {
        if (mappedRoutes && mappedRoutes.length > 0) {
            if (config && Array.isArray(config) && config.includes('manage_dashboard')) {
                setRedirectTo('/app/dashboard');
            } else {
                setRedirectTo(mappedRoutes[0] || '/app/dashboard');
            }
        } else {
            setRedirectTo('/app/dashboard');
        }
    }, [mappedRoutes, config]);

    useEffect(() => {
        const getData = getFiles();
        setAllLocales(getData);
    }, [language, updateLanguage?.lang_json_array]);

    useEffect(() => {
        if (updateLanguage?.iso_code === updatedLanguage && languageData) {
            setUserEditedMessage(updateLanguage?.lang_json_array);
        }
    }, [language, languageData]);

    // updated language handling
    useEffect(() => {
        if (userEditedMessage && Object.values(userEditedMessage).length !== 0) {
            setMessages(userEditedMessage);
        } else {
            if (updateLanguage?.iso_code === updatedLanguage) {
                const updateLanguages = updateLanguage?.lang_json_array;
                setMessages(updateLanguages);
            } else {
                if (
                    updateLanguag === undefined ||
                    updateLanguag === null ||
                    updateLanguag === ""
                ) {
                    const defaultUpdateLanguage = allLocales["en"] || {};
                    setMessages(defaultUpdateLanguage);
                } else {
                    if (updateLanguag === undefined || updateLanguag === null) {
                        const defaultUpdateLanguage = allLocales["en"] || {};
                        setMessages(defaultUpdateLanguage);
                    } else {
                        setMessages(updateLanguag);
                    }
                }
            }
        }
    }, [allLocales, updateLanguage?.lang_json_array]);

    useEffect(() => {
        selectCSS();
    }, [location.pathname]);

    useEffect(() => {
        if (token) {
            dispatch(fetchConfig());
            dispatch(fetchFrontSetting());
        }
    }, []);

    const selectCSS = () => {
        if (updatedLanguage === "ar") {
            require("./assets/css/custom.rtl.css");
            require("./assets/css/style.rtl.css");
            require("./assets/css/frontend.rtl.css");
        } else {
            require("./assets/css/custom.css");
            require("./assets/css/style.css");
            require("./assets/css/frontend.css");
        }
    };

    useEffect(() => {
        addRTLSupport(updatedLanguage ? updatedLanguage : selectedLanguage);
    }, [updatedLanguage, selectedLanguage]);

    return (
        <DeviceRestrictionGuard>
            <div className="d-flex flex-column flex-root">
                <IntlProvider
                    locale={settingsKey.DEFAULT_LOCALE}
                    messages={messages || {}}
                >
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route
                            path="reset-password/:token/:email"
                            element={<ResetPassword />}
                        />
                        <Route
                            path="forgot-password"
                            element={<ForgotPassword />}
                        />
                        <Route
                            path="app/*"
                            element={<AdminApp config={config} />}
                        />
                        <Route
                            path="super-admin/*"
                            element={<SuperAdminPortal />}
                        />
                        <Route
                            path="super-admin"
                            element={<SuperAdminPortal />}
                        />
                        {/* Catch URL variants: spaces, underscores, no-hyphen */}
                        <Route path="super_admin/*" element={<SuperAdminPortal />} />
                        <Route path="super_admin" element={<SuperAdminPortal />} />
                        <Route path="superadmin/*" element={<SuperAdminPortal />} />
                        <Route path="superadmin" element={<SuperAdminPortal />} />
                        <Route
                            path="/"
                            element={
                                <Navigate
                                    replace
                                    to={window.SUPERADMIN_API_BASE ? "/super_admin" : (token ? redirectTo : "/login")}
                                />
                            }
                        />
                        <Route path="*" element={<Navigate replace to={"/"} />} />
                    </Routes>
                    <Toasts
                        language={
                            updatedLanguage ? updatedLanguage : selectedLanguage
                        }
                    />
                </IntlProvider>
            </div>
        </DeviceRestrictionGuard>
    );
}

export default App;
