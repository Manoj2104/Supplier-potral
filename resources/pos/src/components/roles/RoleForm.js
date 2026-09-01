import React, { useEffect, useState, useMemo } from 'react';
import { connect, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import moment from 'moment';
import { editRole } from '../../store/action/roleAction';
import { fetchAllWarehouses } from '../../store/action/warehouseAction';
import { addToast } from '../../store/action/toastAction';
import { getFormattedMessage } from "../../shared/sharedMethod";
import { toastType } from '../../constants';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft, faSave, faCheckCircle, faTimes, faUndo, faPlus,
    faCrown, faUserShield, faBriefcase, faCashRegister, faShoppingBag,
    faBox, faCalculator, faUsers, faKey, faSearch, faCheckSquare,
    faChevronDown, faChevronUp, faExpandAlt,
    faFileImport, faFileExport, faCopy, faShieldAlt, faBuilding,
    faWarehouse, faTag, faFolder, faPlusCircle, faPrint, faCheck
} from '@fortawesome/free-solid-svg-icons';
import '../sales/CreateSalePremium.css';
import '../variation/ProductVariationsPremium.css';
import './RolesDashboard.css';

// ─── Quick Preset Templates ────────────────────────────────────────────────
const PRESET_TEMPLATES = [
    { id: "super_admin", title: "Super Admin", icon: faCrown, bg: "#DCFCE7", color: "#15803D" },
    { id: "admin", title: "Administrator", icon: faUserShield, bg: "#DBEAFE", color: "#1E40AF" },
    { id: "manager", title: "Store Manager", icon: faBriefcase, bg: "#F3E8FF", color: "#6B21A8" },
    { id: "cashier", title: "Cashier", icon: faCashRegister, bg: "#FFEDD5", color: "#C2410C" },
    { id: "sales", title: "Sales Executive", icon: faShoppingBag, bg: "#E0F2FE", color: "#0369A1" },
    { id: "inventory", title: "Inventory Manager", icon: faBox, bg: "#FEF3C7", color: "#92400E" },
    { id: "accountant", title: "Accountant", icon: faCalculator, bg: "#D1FAE5", color: "#065F46" },
    { id: "custom", title: "Custom", icon: faPlus, bg: "#F1F5F9", color: "#475569" },
];

const RoleForm = (props) => {
    const { addRolesData, singleRole, editRole, permissionsArray = [], warehouses = [], fetchAllWarehouses, id } = props;
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Local form state
    const [permissions, setNewPer] = useState(permissionsArray);
    const [allChecked, setAllChecked] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTemplate, setSelectedTemplate] = useState("sales");
    const [collapsedModules, setCollapsedModules] = useState({});
    const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
    const [customCategory, setCustomCategory] = useState("");

    const [rolesValue, setRolesValue] = useState({
        name: singleRole ? singleRole.name : "Sales Executive",
        code: singleRole ? `ROLE-0000${id || 21}` : "ROLE-000021",
        description: singleRole ? "" : "Sales Executive role with sales, customer and report access",
        type: "Custom Role",
        category: "Sales & Operations",
        department: "Sales Department",
        priority: "2",
        status: "Active",
        selectedWarehouse: "Main Warehouse",
        branchScope: "All Branches",
        permissions: []
    });

    const [errors, setErrors] = useState({ name: '', permissions: '' });

    useEffect(() => {
        if (fetchAllWarehouses) fetchAllWarehouses();
    }, []);

    useEffect(() => {
        if (permissionsArray && permissionsArray.length > 0) {
            setNewPer(permissionsArray);
        }
    }, [permissionsArray]);

    useEffect(() => {
        if (singleRole) {
            setRolesValue(prev => ({
                ...prev,
                name: singleRole.name || "",
                permissions: singleRole.permissions || ""
            }));
        }
    }, [singleRole]);

    // Compute Selected Permissions Count & Completion %
    const selectedPermsCount = useMemo(() => {
        return permissions.filter(p => p.selected || p.isChecked).length;
    }, [permissions]);

    const totalPermsCount = permissions.length || 28;
    const completionPercent = Math.round((selectedPermsCount / (totalPermsCount || 1)) * 100);

    // Group Permissions by Module Categories
    const groupedModules = useMemo(() => {
        if (!permissions || permissions.length === 0) return [];
        const map = {};
        permissions.forEach(p => {
            let modName = "General & System";
            const name = (p.name || "").toLowerCase();
            if (name.includes("pos") || name.includes("sale")) modName = "POS & Sales Billing";
            else if (name.includes("product") || name.includes("brand") || name.includes("unit") || name.includes("category") || name.includes("variation")) modName = "Products & Inventory";
            else if (name.includes("purchase") || name.includes("supplier")) modName = "Purchases & Suppliers";
            else if (name.includes("customer")) modName = "Customers & Receivables";
            else if (name.includes("expense")) modName = "Expenses & Accounts";
            else if (name.includes("transfer") || name.includes("adjustment")) modName = "Transfers & Stock Adjustments";
            else if (name.includes("warehouse")) modName = "Warehouse & Outlets";
            else if (name.includes("report")) modName = "Reports & Analytics";
            else if (name.includes("role") || name.includes("user")) modName = "Users & Access Control";
            else if (name.includes("dashboard")) modName = "Dashboard & Overview";
            else if (name.includes("setting") || name.includes("currency") || name.includes("email") || name.includes("sms") || name.includes("language")) modName = "System Settings";
            if (!map[modName]) map[modName] = [];
            map[modName].push(p);
        });
        return Object.keys(map).map(key => ({ moduleName: key, items: map[key] }));
    }, [permissions]);

    const filteredModules = useMemo(() => {
        if (!searchQuery.trim()) return groupedModules;
        const q = searchQuery.toLowerCase();
        return groupedModules.map(g => {
            const matchedItems = g.items.filter(item => (item.name || "").toLowerCase().includes(q));
            return { ...g, items: matchedItems };
        }).filter(g => g.items.length > 0);
    }, [groupedModules, searchQuery]);

    const handlePermissionToggle = (permId) => {
        setNewPer(prev => prev.map(p => p.id === permId ? { ...p, selected: !p.selected, isChecked: !p.selected } : p));
        setErrors({});
    };

    const handleSelectAllToggle = (checked) => {
        setAllChecked(checked);
        setNewPer(prev => prev.map(p => ({ ...p, selected: checked, isChecked: checked })));
        setErrors({});
    };

    const applyPresetTemplate = (templateId) => {
        setSelectedTemplate(templateId);
        if (templateId === "super_admin") {
            handleSelectAllToggle(true);
        } else if (templateId === "custom") {
            // Keep current
        } else {
            setNewPer(prev => prev.map((p, idx) => {
                const isSelected = templateId === "sales" ? idx % 2 === 0 : idx % 3 === 0;
                return { ...p, selected: isSelected, isChecked: isSelected };
            }));
        }
    };

    const onChangeInput = (e) => {
        const { name, value } = e.target;
        if (name === "category" && value === "CREATE_NEW") {
            setShowCustomCategoryInput(true);
        } else {
            setRolesValue(prev => ({ ...prev, [name]: value }));
        }
        setErrors({});
    };

    const handleAddCustomCategory = () => {
        if (customCategory.trim()) {
            setRolesValue(prev => ({ ...prev, category: customCategory.trim() }));
            setShowCustomCategoryInput(false);
            setCustomCategory("");
        }
    };

    const validateForm = () => {
        let errs = {};
        let valid = true;
        if (!rolesValue.name || !rolesValue.name.trim()) {
            errs.name = "Role name is required";
            valid = false;
        }
        if (selectedPermsCount === 0) {
            errs.permissions = "Please select at least one permission";
            valid = false;
        }
        setErrors(errs);
        return valid;
    };

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        if (validateForm()) {
            const selectedIds = permissions.filter(p => p.selected || p.isChecked).map(p => p.id);
            if (addRolesData) addRolesData({ name: rolesValue.name, permissions: selectedIds });
        }
    };

    const handleEditSubmit = (e) => {
        if (e) e.preventDefault();
        if (validateForm()) {
            const selectedIds = permissions.filter(p => p.selected || p.isChecked).map(p => p.id);
            if (editRole) editRole(id, { name: rolesValue.name, permissions: selectedIds }, navigate);
        }
    };

    const handleReset = () => {
        setRolesValue({
            name: "",
            code: "ROLE-000021",
            description: "",
            type: "Custom Role",
            category: "Sales & Operations",
            department: "Sales Department",
            priority: "2",
            status: "Active",
            selectedWarehouse: "Main Warehouse",
            branchScope: "All Branches",
            permissions: []
        });
        handleSelectAllToggle(false);
    };

    return (
        <div className="sale-create-page">
            <div className="brand-breadcrumb">
                <Link to="/app/dashboard" style={{ color: '#64748B', textDecoration: 'none' }}>Dashboard</Link>
                <span>&gt;</span>
                <Link to="/app/roles" style={{ color: '#64748B', textDecoration: 'none' }}>Roles</Link>
                <span>&gt;</span>
                <span className="brand-crumb-active">{singleRole ? 'Edit' : 'Create'}</span>
            </div>

            <div className="create-fullpage-container">
                <div className="create-form-header">
                    <div className="d-flex align-items-center gap-3">
                        <Link to="/app/roles" className="brand-btn-pill">
                            <FontAwesomeIcon icon={faArrowLeft} /> Back to Roles
                        </Link>
                        <div>
                            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', margin: 0, lineHeight: '1.2' }}>
                                {singleRole ? 'Edit Role' : 'Create Role'}
                            </h2>
                            <p style={{ fontSize: '13.5px', color: '#64748B', margin: '2px 0 0 0' }}>
                                Configure role details, single warehouse scope, and granular permissions
                            </p>
                        </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <button type="button" className="brand-btn-pill" onClick={() => dispatch(addToast({ text: "Draft saved successfully", type: toastType.SUCCESS }))}>
                            <FontAwesomeIcon icon={faSave} /> Save Draft
                        </button>
                        <button type="button" className="brand-btn-pill" onClick={() => window.print()}>
                            <FontAwesomeIcon icon={faPrint} /> Print
                        </button>
                        <button type="button" className="brand-btn-pill brand-btn-primary" onClick={singleRole ? handleEditSubmit : handleSubmit}>
                            <FontAwesomeIcon icon={faCheck} /> {singleRole ? 'Save Changes' : 'Create Role'}
                        </button>
                    </div>
                </div>

                <div className="create-form-body">
                    <form onSubmit={singleRole ? handleEditSubmit : handleSubmit}>
                        <div className="create-card-section">
                            <div className="create-section-header">
                                <div className="create-section-icon green"><FontAwesomeIcon icon={faShieldAlt} /></div>
                                <div className="create-section-title">
                                    <h3>Role Information</h3>
                                    <p>Define role name, code, assigned warehouse, category, and status</p>
                                </div>
                            </div>
                            <div className="row g-4">
                                <div className="col-md-3">
                                    <label className="form-label" style={{ fontWeight: '700', fontSize: '13.5px', color: '#0F172A' }}>Role Name <span className="text-danger">*</span></label>
                                    <input type="text" name="name" className={`form-control create-input-lg ${errors.name ? "is-invalid" : ""}`} placeholder="e.g. Sales Executive" value={rolesValue.name} onChange={onChangeInput} autoFocus />
                                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label" style={{ fontWeight: '700', fontSize: '13.5px', color: '#0F172A' }}>Role Code</label>
                                    <input type="text" className="form-control create-input-lg bg-light" value={rolesValue.code} readOnly />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label" style={{ fontWeight: '700', fontSize: '13.5px', color: '#0F172A' }}>Role Type <span className="text-danger">*</span></label>
                                    <select name="type" className="form-select create-input-lg" value={rolesValue.type} onChange={onChangeInput}>
                                        <option value="Custom Role">Custom Role</option>
                                        <option value="System Role">System Role</option>
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label" style={{ fontWeight: '700', fontSize: '13.5px', color: '#0F172A' }}>Status <span className="text-danger">*</span></label>
                                    <select name="status" className="form-select create-input-lg text-success fw-bold" value={rolesValue.status} onChange={onChangeInput}>
                                        <option value="Active">Completed / Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label" style={{ fontWeight: '700', fontSize: '13.5px', color: '#0F172A' }}>Warehouse <span className="text-danger">*</span></label>
                                    <select name="selectedWarehouse" className="form-select create-input-lg" value={rolesValue.selectedWarehouse} onChange={onChangeInput}>
                                        <option value="Main Warehouse">Main Warehouse (Primary)</option>
                                        <option value="All Warehouses">All Warehouses (Global Access)</option>
                                        {Array.isArray(warehouses) && warehouses.map((w) => (<option key={w.id} value={w.attributes?.name || w.name}>{w.attributes?.name || w.name}</option>))}
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label" style={{ fontWeight: '700', fontSize: '13.5px', color: '#0F172A' }}>Role Category</label>
                                    {!showCustomCategoryInput ? (
                                        <select name="category" className="form-select create-input-lg" value={rolesValue.category} onChange={onChangeInput}>
                                            <option value="Sales & Operations">Sales & Operations</option>
                                            <option value="Inventory & Stock">Inventory & Stock</option>
                                            <option value="Finance & Accounts">Finance & Accounts</option>
                                            <option value="Administration & Security">Administration & Security</option>
                                            <option value="CREATE_NEW">+ Create New Category</option>
                                        </select>
                                    ) : (
                                        <div className="d-flex gap-2">
                                            <input type="text" className="form-control create-input-lg" placeholder="Enter new category..." value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} autoFocus />
                                            <button type="button" className="brand-btn-pill brand-btn-primary px-3" onClick={handleAddCustomCategory}>Add</button>
                                            <button type="button" className="brand-btn-pill px-3" onClick={() => setShowCustomCategoryInput(false)}><FontAwesomeIcon icon={faTimes} /></button>
                                        </div>
                                    )}
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label" style={{ fontWeight: '700', fontSize: '13.5px', color: '#0F172A' }}>Description</label>
                                    <input type="text" name="description" className="form-control create-input-lg" placeholder="Role description and scope..." value={rolesValue.description} onChange={onChangeInput} />
                                </div>
                            </div>
                        </div>

                        <div className="create-card-section">
                            <div className="create-section-header">
                                <div className="create-section-icon purple"><FontAwesomeIcon icon={faKey} /></div>
                                <div className="create-section-title">
                                    <h3>Permission Template</h3>
                                    <p>Select a preset template to quickly configure role permissions</p>
                                </div>
                            </div>
                            <div className="row g-3">
                                {PRESET_TEMPLATES.map((tmpl) => {
                                    const isSelected = selectedTemplate === tmpl.id;
                                    return (
                                        <div key={tmpl.id} className="col-6 col-md-3">
                                            <div onClick={() => applyPresetTemplate(tmpl.id)} style={{ border: `2px solid ${isSelected ? "#16A34A" : "#EEF2F7"}`, borderRadius: 16, padding: "16px 14px", textAlign: "center", cursor: "pointer", background: isSelected ? "#F0FDF4" : "#FFFFFF", transition: "all 0.2s ease", position: "relative", boxShadow: isSelected ? "0 4px 14px rgba(22, 163, 74, 0.12)" : "0 1px 3px rgba(0,0,0,0.02)" }}>
                                                {isSelected && <FontAwesomeIcon icon={faCheckCircle} style={{ position: "absolute", top: 10, right: 10, color: "#16A34A", fontSize: 14 }} />}
                                                <div style={{ width: 42, height: 42, borderRadius: 12, background: tmpl.bg, color: tmpl.color, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 10 }}>
                                                    <FontAwesomeIcon icon={tmpl.icon} />
                                                </div>
                                                <div style={{ fontWeight: 700, fontSize: 13, color: "#0F172A" }}>{tmpl.title}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="create-card-section">
                            <div className="create-section-header justify-content-between flex-wrap gap-2">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="create-section-icon blue"><FontAwesomeIcon icon={faCheckSquare} /></div>
                                    <div className="create-section-title">
                                        <h3>Permission Matrix</h3>
                                        <p>Configure granular access permissions for each system module ({selectedPermsCount} of {totalPermsCount} Granted)</p>
                                    </div>
                                </div>
                                <div>
                                    <span className="badge px-3 py-2" style={{ background: "#DCFCE7", color: "#15803D", fontSize: "13px", fontWeight: "700", borderRadius: "999px" }}>
                                        <FontAwesomeIcon icon={faCheckCircle} className="me-1" /> {completionPercent}% Complete ({selectedPermsCount}/{totalPermsCount})
                                    </span>
                                </div>
                            </div>
                            <div className="d-flex align-items-center justify-content-between gap-3 mb-4 flex-wrap">
                                <div className="position-relative flex-fill" style={{ maxWidth: 400 }}>
                                    <FontAwesomeIcon icon={faSearch} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#94A3B8", fontSize: 14 }} />
                                    <input type="text" className="form-control create-input-lg ps-5" placeholder="Search permissions or modules..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                                </div>
                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                    <button type="button" className="brand-btn-pill btn-sm" onClick={() => handleSelectAllToggle(true)}><FontAwesomeIcon icon={faCheckSquare} className="text-success" /> Select All</button>
                                    <button type="button" className="brand-btn-pill btn-sm" onClick={() => handleSelectAllToggle(false)}><FontAwesomeIcon icon={faTimes} className="text-danger" /> Clear All</button>
                                    <button type="button" className="brand-btn-pill btn-sm" onClick={() => setCollapsedModules({})}><FontAwesomeIcon icon={faExpandAlt} /> Expand All</button>
                                </div>
                            </div>
                            {errors.permissions && <div className="alert alert-danger p-3 mb-4" style={{ borderRadius: 14, fontWeight: 600 }}>{errors.permissions}</div>}
                            <div className="d-flex flex-column gap-3">
                                {filteredModules.map((group, idx) => {
                                    const isCollapsed = collapsedModules[group.moduleName];
                                    const groupCheckedCount = group.items.filter(p => p.selected || p.isChecked).length;
                                    const isGroupAllChecked = groupCheckedCount === group.items.length;
                                    return (
                                        <div key={idx} className="border rounded-4 overflow-hidden bg-white shadow-xs" style={{ borderColor: "#EEF2F7" }}>
                                            <div className="d-flex align-items-center justify-content-between px-4 py-3" style={{ cursor: "pointer", background: groupCheckedCount > 0 ? "#FAFEFF" : "#F8FAFC", borderBottom: isCollapsed ? "none" : "1px solid #EEF2F7", transition: "background 0.2s" }} onClick={() => setCollapsedModules(prev => ({ ...prev, [group.moduleName]: !prev[group.moduleName] }))}>
                                                <div className="d-flex align-items-center gap-3">
                                                    <FontAwesomeIcon icon={isCollapsed ? faChevronDown : faChevronUp} style={{ fontSize: 12, color: "#64748B" }} />
                                                    <span className="fw-bold" style={{ fontSize: 14.5, color: "#0F172A" }}>{group.moduleName}</span>
                                                    <span className="badge px-2.5 py-1" style={{ fontSize: 11, borderRadius: 12, background: groupCheckedCount > 0 ? "#DCFCE7" : "#F1F5F9", color: groupCheckedCount > 0 ? "#15803D" : "#64748B", fontWeight: 700 }}>{groupCheckedCount} of {group.items.length} Granted</span>
                                                </div>
                                                <div className="d-flex align-items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <label className="form-check-label text-secondary fw-bold cursor-pointer" style={{ fontSize: 12 }}>Select All Module</label>
                                                    <input type="checkbox" className="form-check-input cursor-pointer me-1" style={{ width: 18, height: 18, accentColor: "#16A34A" }} checked={isGroupAllChecked} onChange={(e) => { const targetState = e.target.checked; setNewPer(prev => prev.map(p => { if (group.items.some(gi => gi.id === p.id)) { return { ...p, selected: targetState, isChecked: targetState }; } return p; })); }} />
                                                </div>
                                            </div>
                                            {!isCollapsed && (
                                                <div className="p-4" style={{ background: "#FFFFFF" }}>
                                                    <div className="row g-3">
                                                        {group.items.map((perm) => {
                                                            const checked = perm.selected || perm.isChecked;
                                                            return (
                                                                <div key={perm.id} className="col-md-6 col-lg-4">
                                                                    <div onClick={() => handlePermissionToggle(perm.id)} style={{ border: `1.5px solid ${checked ? "#16A34A" : "#EEF2F7"}`, borderRadius: 14, padding: "14px 16px", background: checked ? "#F0FDF4" : "#FFFFFF", cursor: "pointer", transition: "all 0.2s ease", boxShadow: checked ? "0 2px 8px rgba(22,163,74,0.12)" : "0 1px 3px rgba(0,0,0,0.02)", display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 52, userSelect: "none" }}>
                                                                        <div className="d-flex align-items-center gap-2.5">
                                                                            <div style={{ width: 22, height: 22, borderRadius: "50%", background: checked ? "#16A34A" : "#F1F5F9", color: checked ? "#FFFFFF" : "#94A3B8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0, border: checked ? "none" : "1.5px solid #CBD5E1" }}><FontAwesomeIcon icon={faCheckCircle} /></div>
                                                                            <span style={{ fontSize: 13, fontWeight: checked ? 700 : 600, color: checked ? "#064E3B" : "#334155", lineHeight: 1.3 }}>{perm.name}</span>
                                                                        </div>
                                                                        {checked && <span className="badge" style={{ background: "#DCFCE7", color: "#15803D", fontSize: 10, fontWeight: 700, borderRadius: 10, padding: "4px 8px" }}>Granted</span>}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Bottom Actions Bar */}
                        <div className="d-flex align-items-center justify-content-end gap-3 pt-3">
                            <button
                                type="button"
                                className="brand-btn-pill"
                                onClick={handleReset}
                            >
                                <FontAwesomeIcon icon={faUndo} /> Reset
                            </button>
                            <button
                                type="button"
                                className="brand-btn-pill"
                                onClick={() => dispatch(addToast({ text: "Draft saved successfully", type: toastType.SUCCESS }))}
                            >
                                <FontAwesomeIcon icon={faSave} /> Save Draft
                            </button>
                            <button
                                type="button"
                                className="brand-btn-pill brand-btn-primary"
                                onClick={singleRole ? handleEditSubmit : handleSubmit}
                            >
                                <FontAwesomeIcon icon={faCheck} /> {singleRole ? 'Save Changes' : 'Create Role'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

const mapStateToProps = (state) => {
    const { warehouses } = state;
    return { warehouses };
};

export default connect(mapStateToProps, { editRole, fetchAllWarehouses })(RoleForm);
