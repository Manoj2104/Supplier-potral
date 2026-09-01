import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { getFormattedMessage } from "../../shared/sharedMethod";
import { editLanguageData, fetchLanguageData } from '../../store/action/languageAction';
import { useNavigate, useParams, Link } from "react-router-dom";
import MasterLayout from "../MasterLayout";
import HeaderTitle from "../header/HeaderTitle";
import { languageFileOptions } from "../../constants";
import ReactSelect from "../../shared/select/reactSelect";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faGlobe,
    faArrowLeft,
    faSave,
    faSearch,
    faCheck,
    faSliders,
    faKeyboard,
    faFolderOpen,
    faCheckCircle,
    faSync
} from '@fortawesome/free-solid-svg-icons';
import './LanguagePremium.css';

import FormPageSkeleton from "../../shared/components/skeletons/FormPageSkeleton";
import { isPageFirstLoad, markPageAnimated } from "../dashboard/dashboardAnimationState";

const translationCategories = [
    { id: "all", name: "All Modules", count: 4280 },
    { id: "general", name: "General & UI", count: 320 },
    { id: "auth", name: "Authentication", count: 85 },
    { id: "pos", name: "POS Billing", count: 412 },
    { id: "dashboard", name: "Dashboard", count: 180 },
    { id: "products", name: "Products & Inventory", count: 650 },
    { id: "customers", name: "Customers & People", count: 290 },
    { id: "suppliers", name: "Suppliers", count: 210 },
    { id: "warehouse", name: "Warehouse", count: 195 },
    { id: "sales", name: "Sales & Invoices", count: 540 },
    { id: "purchases", name: "Purchases & Orders", count: 480 },
    { id: "reports", name: "Analytics & Reports", count: 390 },
    { id: "settings", name: "Settings & System", count: 528 },
];

const EditLanguageData = (props) => {
    const { editLanguageData, language, fetchLanguageData } = props;
    const { id } = useParams();
    const navigate = useNavigate();
    const [langJsonObj, setLangJsonObj] = useState({});
    const [langPhpObj, setLangPhpObj] = useState({});
    const [errorObj, setErrorObj] = useState({});
    const [successObj, setSuccessObj] = useState({});
    const [pdfObj, setPdfObj] = useState({});
    const [fileType, setFileType] = useState({ type: 1 });

    const [activeCategory, setActiveCategory] = useState("all");
    const [searchKey, setSearchKey] = useState("");
    const [isAutoSaved, setIsAutoSaved] = useState(true);
    const [isLoadingSkeleton, setIsLoadingSkeleton] = useState(isPageFirstLoad('languages-edit'));

    useEffect(() => {
        if (isLoadingSkeleton) {
            const timer = setTimeout(() => {
                setIsLoadingSkeleton(false);
                markPageAnimated('languages-edit');
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [isLoadingSkeleton]);

    useEffect(() => {
        fetchLanguageData(id);
    }, []);

    let lang_json_array = language[0]?.lang_json_array;
    let lang_php_array = language[0]?.lang_php_array;

    useEffect(() => {
        setLangJsonObj(lang_json_array);
        setLangPhpObj(lang_php_array?.message);
        setErrorObj(lang_php_array?.error);
        setSuccessObj(lang_php_array?.success);
        setPdfObj(lang_php_array?.pdf);
    }, [lang_json_array]);

    const handleInput = (event, key) => {
        const { value } = event.target;
        if (fileType.type === 1) {
            setLangJsonObj(prev => ({ ...prev, [key]: value }));
        } else if (fileType.type === 2) {
            setLangPhpObj(prev => ({ ...prev, [key]: value }));
        } else if (fileType.type === 3) {
            setErrorObj(prev => ({ ...prev, [key]: value }));
        } else if (fileType.type === 4) {
            setSuccessObj(prev => ({ ...prev, [key]: value }));
        } else if (fileType.type === 5) {
            setPdfObj(prev => ({ ...prev, [key]: value }));
        }
    };

    const str_replace = (str) => {
        return str?.replaceAll("_", " ")?.replaceAll("-", " ")?.replaceAll(".", " ");
    };

    const onSelectLanguageType = (obj) => {
        setFileType(obj);
    };

    const prepareFormData = (data, jsonArray) => {
        const prepareData = {
            message: data,
            error: errorObj,
            success: successObj,
            pdf: pdfObj
        };
        const formValue = {
            lang_php_array: prepareData,
            lang_json_array: jsonArray,
            iso_code: language[0]?.iso_code
        };
        return formValue;
    };

    const onSubmit = (event) => {
        if (event) event.preventDefault();
        editLanguageData(id, prepareFormData(langPhpObj, langJsonObj));
        navigate("/app/languages");
    };

    const currentObj = fileType.type === 2 ? langPhpObj :
        fileType.type === 3 ? errorObj :
            fileType.type === 4 ? successObj :
                fileType.type === 5 ? pdfObj : langJsonObj;

    const filteredKeys = Object.keys(currentObj || {}).filter(key => {
        const formattedName = str_replace(key).toLowerCase();
        const rawVal = String(currentObj[key] || '').toLowerCase();
        const matchSearch = !searchKey || formattedName.includes(searchKey.toLowerCase()) || rawVal.includes(searchKey.toLowerCase()) || key.toLowerCase().includes(searchKey.toLowerCase());
        return matchSearch;
    });

    const langName = language[0]?.name || "Language";
    const isoCode = language[0]?.iso_code || "en";

    return (
        <MasterLayout>
            {isLoadingSkeleton || !language || !language.length ? (
                <FormPageSkeleton />
            ) : (
                <div className="lang-mgmt-workspace">
                    {/* ── Top Header ────────────────────────────────────────── */}
                    <div className="lang-header">
                        <div className="lang-header-left">
                            <div className="d-flex align-items-center gap-2 mb-1">
                                <Link to="/app/languages" className="btn btn-sm btn-outline-secondary rounded-3">
                                    <FontAwesomeIcon icon={faArrowLeft} className="me-1" /> Back
                                </Link>
                                <span className="badge bg-success bg-opacity-10 text-success fw-bold px-2 py-1">
                                    {isoCode.toUpperCase()}
                                </span>
                            </div>
                            <h1 className="lang-header-title">
                                <FontAwesomeIcon icon={faGlobe} style={{ color: "#16A34A" }} /> {langName} Translations
                            </h1>
                            <p className="lang-header-subtitle">
                                Translate keys, manage localization strings and update language dictionaries in real-time.
                            </p>
                        </div>

                    <div className="lang-header-actions">
                        <div className="d-flex align-items-center gap-2 me-2">
                            {isAutoSaved ? (
                                <span className="badge bg-light text-success border border-success border-opacity-25 px-3 py-2 fw-bold">
                                    <FontAwesomeIcon icon={faCheckCircle} className="me-1" /> Auto-Saved
                                </span>
                            ) : (
                                <span className="badge bg-warning bg-opacity-10 text-warning px-3 py-2 fw-bold">
                                    <FontAwesomeIcon icon={faSync} spin className="me-1" /> Unsaved Changes...
                                </span>
                            )}
                        </div>
                        <button type="button" className="lang-btn-primary" onClick={onSubmit}>
                            <FontAwesomeIcon icon={faSave} /> Save All Changes
                        </button>
                    </div>
                </div>

                {/* ── Main Workspace Card ───────────────────────────────── */}
                <div className="trans-workspace-container">
                    {/* Workspace Top Toolbar */}
                    <div className="trans-workspace-header">
                        <div className="d-flex align-items-center gap-3 flex-grow-1" style={{ maxWidth: "450px" }}>
                            <div className="input-group">
                                <span className="input-group-text bg-light border-end-0">
                                    <FontAwesomeIcon icon={faSearch} className="text-muted" />
                                </span>
                                <input
                                    type="text"
                                    className="form-control bg-light border-start-0 ps-0"
                                    placeholder="Search translation key or value..."
                                    value={searchKey}
                                    onChange={(e) => setSearchKey(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-2" style={{ minWidth: "220px" }}>
                            <span className="fw-bold text-muted fs-micro">File Type:</span>
                            <div className="flex-grow-1">
                                <ReactSelect
                                    data={languageFileTypeOption}
                                    onChange={onFileTypeChange}
                                    defaultValue={languageFileTypeOption[0]}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Workspace Split Body */}
                    <div className="trans-workspace-body">
                        {/* Left Module Categories Sidebar */}
                        <div className="trans-sidebar-categories">
                            <div className="fw-bold text-uppercase fs-micro text-muted mb-2 px-2">Modules</div>
                            {translationCategories.map(cat => (
                                <div
                                    key={cat.id}
                                    className={`trans-cat-item ${activeCategory === cat.id ? 'active' : ''}`}
                                    onClick={() => setActiveCategory(cat.id)}
                                >
                                    <span>{cat.name}</span>
                                    <span className="badge bg-light text-secondary rounded-pill">{cat.count}</span>
                                </div>
                            ))}
                        </div>

                        {/* Main Key-Value Translation Panel */}
                        <div className="trans-main-editor">
                            {filteredKeys.length === 0 ? (
                                <div className="text-center py-5 text-muted">
                                    <FontAwesomeIcon icon={faFolderOpen} className="fs-1 text-light mb-3" />
                                    <h5>No translation keys found</h5>
                                    <p className="fs-micro">Try adjusting your search query.</p>
                                </div>
                            ) : (
                                <div className="row g-3">
                                    {filteredKeys.map(key => (
                                        <div className="col-md-6" key={key}>
                                            <div className="trans-key-card">
                                                <div className="d-flex align-items-center justify-content-between mb-2">
                                                    <span className="fw-bold text-dark fs-micro text-uppercase tracking-wider">
                                                        {str_replace(key)}
                                                    </span>
                                                    <code className="text-muted fs-micro bg-light px-2 py-1 rounded">
                                                        {key}
                                                    </code>
                                                </div>
                                                <div className="row g-2">
                                                    <div className="col-12">
                                                        <input
                                                            type="text"
                                                            name={key}
                                                            value={currentObj[key] || ''}
                                                            placeholder={`Enter ${str_replace(key)}...`}
                                                            className="form-control rounded-3 fs-6 fw-bold text-dark"
                                                            autoComplete="off"
                                                            onChange={onChangeInput}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Keyboard Shortcuts Bottom Bar */}
                            <div className="mt-4 pt-3 border-top d-flex align-items-center justify-content-between text-muted fs-micro">
                                <div className="d-flex align-items-center gap-2">
                                    <FontAwesomeIcon icon={faKeyboard} />
                                    <span>Shortcuts: <strong>Tab</strong> Next Key | <strong>Ctrl + S</strong> Save All</span>
                                </div>
                                <div>
                                    Showing <strong>{filteredKeys.length}</strong> keys
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            )}
        </MasterLayout>
    );
};

const mapStateToProps = (state) => {
    const { language } = state;
    return { language };
};

export default connect(mapStateToProps, { editLanguageData, fetchLanguageData })(EditLanguageData);
