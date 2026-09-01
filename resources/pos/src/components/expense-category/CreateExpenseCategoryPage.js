import React, { useState } from "react";
import { connect, useDispatch } from "react-redux";
import { Form } from "react-bootstrap-v5";
import { useNavigate, Link } from "react-router-dom";
import MasterLayout from "../MasterLayout";
import TabTitle from "../../shared/tab-title/TabTitle";
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";
import { getFormattedMessage } from "../../shared/sharedMethod";
import { addExpenseCategory } from "../../store/action/expenseCategoryAction";
import { Filters } from "../../constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeft,
    faBriefcase,
    faShoppingCart,
    faCar,
    faUtensils,
    faPlane,
    faBuilding,
    faDesktop,
    faPhone,
    faUsers,
    faPlusSquare,
    faWrench,
    faGear,
    faGift,
    faGraduationCap,
    faHome,
    faIndustry,
    faGasPump,
    faTruck,
    faBox,
    faCloud,
    faShieldHalved,
    faWallet,
    faReceipt,
    faPrint,
    faFolder,
    faCheck,
    faLightbulb,
} from "@fortawesome/free-solid-svg-icons";
import { addToast } from "../../store/action/toastAction";
import { toastType } from "../../constants";
import "./ExpenseCategoryPremium.css";

const POPULAR_ICONS = [
    { id: "briefcase", icon: faBriefcase, label: "Office" },
    { id: "cart", icon: faShoppingCart, label: "Shopping" },
    { id: "car", icon: faCar, label: "Transport" },
    { id: "utensils", icon: faUtensils, label: "Food" },
    { id: "plane", icon: faPlane, label: "Travel" },
    { id: "building", icon: faBuilding, label: "Building" },
    { id: "desktop", icon: faDesktop, label: "Hardware" },
    { id: "phone", icon: faPhone, label: "Telecom" },
    { id: "users", icon: faUsers, label: "Salary" },
    { id: "wrench", icon: faWrench, label: "Maintenance" },
    { id: "gear", icon: faGear, label: "Operations" },
    { id: "gift", icon: faGift, label: "Marketing" },
    { id: "graduation", icon: faGraduationCap, label: "Training" },
    { id: "home", icon: faHome, label: "Rent" },
    { id: "industry", icon: faIndustry, label: "Factory" },
    { id: "gas", icon: faGasPump, label: "Fuel" },
    { id: "truck", icon: faTruck, label: "Logistics" },
    { id: "box", icon: faBox, label: "Inventory" },
    { id: "cloud", icon: faCloud, label: "Software" },
    { id: "shield", icon: faShieldHalved, label: "Insurance" },
    { id: "wallet", icon: faWallet, label: "Finance" },
    { id: "receipt", icon: faReceipt, label: "Bills" },
    { id: "print", icon: faPrint, label: "Printing" },
    { id: "plus", icon: faPlusSquare, label: "Medical" },
    { id: "lightbulb", icon: faLightbulb, label: "Utilities" },
];

const CreateExpenseCategoryPage = (props) => {
    const { addExpenseCategory } = props;
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [expenseCategoryValue, setExpenseCategoryValue] = useState({ name: "" });
    const [code, setCode] = useState("EXP-001");
    const [description, setDescription] = useState("");
    const [selectedColor, setSelectedColor] = useState("#16A34A");
    const [selectedIcon, setSelectedIcon] = useState(faBriefcase);
    const [status, setStatus] = useState(true);
    const [parentCategory, setParentCategory] = useState("");
    const [department, setDepartment] = useState("");
    const [budgetLimit, setBudgetLimit] = useState("");
    const [taxApplicable, setTaxApplicable] = useState("Yes");
    const [notes, setNotes] = useState("");
    const [errors, setErrors] = useState({ name: "" });
    const [isSaving, setIsSaving] = useState(false);

    const generateCode = (name) => {
        if (!name || !name.trim()) {
            setCode("EXP-001");
            return;
        }
        const words = name.trim().toUpperCase().split(/\s+/);
        if (words.length >= 2) {
            setCode(`${words[0].slice(0, 3)}-${words[1].slice(0, 3)}`);
        } else {
            setCode(`${words[0].slice(0, 6)}-001`);
        }
    };

    const handleValidation = () => {
        let errorss = {};
        let isValid = false;
        if (!expenseCategoryValue["name"] || !expenseCategoryValue["name"].trim()) {
            errorss["name"] = getFormattedMessage("globally.input.name.validate.label");
        } else if (expenseCategoryValue["name"].length > 50) {
            errorss["name"] = getFormattedMessage("brand.input.name.valid.validate.label");
        } else {
            isValid = true;
        }
        setErrors(errorss);
        return isValid;
    };

    const onChangeInput = (e) => {
        const val = e.target.value;
        setExpenseCategoryValue({ name: val });
        generateCode(val);
        setErrors({ name: "" });
    };

    const onSubmit = (event) => {
        event.preventDefault();
        const valid = handleValidation();
        if (valid) {
            setIsSaving(true);
            addExpenseCategory(expenseCategoryValue, Filters.OBJ);
            dispatch(addToast({ text: "Expense Category Created Successfully!", type: toastType.SUCCESS }));
            setTimeout(() => {
                navigate("/app/expense-categories");
            }, 400);
        }
    };

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title="Create Expense Category" />

            <div className="exp-cat-workspace">
                <Form onSubmit={onSubmit}>

                    {/* ── Top Header Bar ─────────────────────────────────── */}
                    <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
                        <div>
                            <div style={{ fontSize: "12px", color: "#64748B", marginBottom: "4px", fontWeight: 500 }}>
                                Dashboard &nbsp;›&nbsp; Expenses &nbsp;›&nbsp; Expense Categories &nbsp;›&nbsp; Create Category
                            </div>
                            <h1 className="exp-cat-title">Create Expense Category</h1>
                            <p className="exp-cat-sub">Create a reusable category for organizing business expenses.</p>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            <Link to="/app/expense-categories" className="btn exp-cat-top-btn exp-cat-top-btn-outline">
                                <FontAwesomeIcon icon={faArrowLeft} /> Cancel
                            </Link>
                            <button
                                type="submit"
                                className="btn exp-cat-top-btn exp-cat-top-btn-primary"
                                disabled={!expenseCategoryValue.name.trim() || isSaving}
                            >
                                <FontAwesomeIcon icon={faCheck} /> {isSaving ? "Saving..." : "Save Category"}
                            </button>
                        </div>
                    </div>

                    {/* ── Main Split Layout (70% Form / 30% Preview & Icons) ──── */}
                    <div className="row g-4">

                        {/* ════════════════════════════════════════
                            LEFT COLUMN (70%) — CATEGORY FORM
                        ════════════════════════════════════════ */}
                        <div className="col-lg-8">
                            <div className="exp-form-card">
                                <h6 style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", marginBottom: "20px" }}>
                                    <FontAwesomeIcon icon={faFolder} className="text-success me-2" />
                                    Category Information
                                </h6>

                                <div className="row g-3">
                                    {/* Category Name */}
                                    <div className="col-md-6">
                                        <label className="exp-form-label">Category Name <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={expenseCategoryValue.name}
                                            placeholder="Enter category name (e.g., Office Supplies)"
                                            className="form-control exp-form-control"
                                            autoFocus
                                            autoComplete="off"
                                            onChange={onChangeInput}
                                        />
                                        {errors["name"] && <span className="text-danger fs-small mt-1 d-block">{errors["name"]}</span>}
                                    </div>

                                    {/* Category Code */}
                                    <div className="col-md-6">
                                        <label className="exp-form-label">Category Code <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            value={code}
                                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                                            placeholder="Enter unique code (e.g., OFF-SUP)"
                                            className="form-control exp-form-control"
                                            style={{ fontFamily: "JetBrains Mono", color: "#2563EB", fontWeight: 700 }}
                                        />
                                    </div>

                                    {/* Description */}
                                    <div className="col-md-6">
                                        <label className="exp-form-label">Description</label>
                                        <input
                                            type="text"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Enter description of this category"
                                            className="form-control exp-form-control"
                                        />
                                    </div>

                                    {/* Category Icon Select */}
                                    <div className="col-md-6">
                                        <label className="exp-form-label">Category Icon</label>
                                        <select
                                            className="form-select exp-form-control"
                                            onChange={(e) => {
                                                const found = POPULAR_ICONS.find(i => i.id === e.target.value);
                                                if (found) setSelectedIcon(found.icon);
                                            }}
                                        >
                                            {POPULAR_ICONS.map(i => (
                                                <option key={i.id} value={i.id}>{i.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Color Select */}
                                    <div className="col-md-6">
                                        <label className="exp-form-label">Color</label>
                                        <div className="d-flex align-items-center gap-2">
                                            <input
                                                type="color"
                                                value={selectedColor}
                                                onChange={(e) => setSelectedColor(e.target.value)}
                                                className="form-control form-control-color"
                                                style={{ width: "42px", height: "40px", borderRadius: "10px" }}
                                            />
                                            <input
                                                type="text"
                                                value={selectedColor}
                                                onChange={(e) => setSelectedColor(e.target.value)}
                                                className="form-control exp-form-control"
                                                style={{ fontFamily: "JetBrains Mono" }}
                                            />
                                        </div>
                                    </div>

                                    {/* Status Switch */}
                                    <div className="col-md-6">
                                        <label className="exp-form-label">Status</label>
                                        <div className="d-flex align-items-center gap-2 pt-1">
                                            <button
                                                type="button"
                                                className={`exp-toggle-btn ${status ? "active" : ""}`}
                                                onClick={() => setStatus(!status)}
                                            >
                                                <span className="exp-toggle-thumb" />
                                            </button>
                                            <span className="fw-bold" style={{ fontSize: "12.5px", color: status ? "#16A34A" : "#64748B" }}>
                                                {status ? "Active" : "Inactive"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Parent Category */}
                                    <div className="col-md-6">
                                        <label className="exp-form-label">Parent Category</label>
                                        <select
                                            className="form-select exp-form-control"
                                            value={parentCategory}
                                            onChange={(e) => setParentCategory(e.target.value)}
                                        >
                                            <option value="">Select parent category (optional)</option>
                                            <option value="Operational">Operational Expenses</option>
                                            <option value="Administrative">Administrative Expenses</option>
                                        </select>
                                    </div>

                                    {/* Department */}
                                    <div className="col-md-6">
                                        <label className="exp-form-label">Department</label>
                                        <select
                                            className="form-select exp-form-control"
                                            value={department}
                                            onChange={(e) => setDepartment(e.target.value)}
                                        >
                                            <option value="">Select department (optional)</option>
                                            <option value="Finance">Finance</option>
                                            <option value="Operations">Operations</option>
                                            <option value="Marketing">Marketing</option>
                                            <option value="IT & Infrastructure">IT & Infrastructure</option>
                                        </select>
                                    </div>

                                    {/* Budget Limit */}
                                    <div className="col-md-6">
                                        <label className="exp-form-label">Budget Limit (₹)</label>
                                        <input
                                            type="number"
                                            value={budgetLimit}
                                            onChange={(e) => setBudgetLimit(e.target.value)}
                                            placeholder="Enter budget limit (optional)"
                                            className="form-control exp-form-control"
                                        />
                                    </div>

                                    {/* Tax Applicable */}
                                    <div className="col-md-6">
                                        <label className="exp-form-label">Tax Applicable</label>
                                        <select
                                            className="form-select exp-form-control"
                                            value={taxApplicable}
                                            onChange={(e) => setTaxApplicable(e.target.value)}
                                        >
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                        </select>
                                    </div>

                                    {/* Notes */}
                                    <div className="col-md-12">
                                        <label className="exp-form-label">Notes</label>
                                        <textarea
                                            rows="3"
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Enter additional notes (optional)"
                                            className="form-control"
                                            style={{ borderRadius: "10px", fontSize: "12.5px" }}
                                        />
                                    </div>
                                </div>

                                {/* Tips Box */}
                                <div className="exp-tips-box">
                                    <div className="exp-tips-title">
                                        <FontAwesomeIcon icon={faLightbulb} /> Tips for creating categories
                                    </div>
                                    <div className="exp-tips-grid">
                                        <div>✓ Use a clear and meaningful name</div>
                                        <div>✓ Choose an appropriate icon and color</div>
                                        <div>✓ Organize categories using parent categories</div>
                                        <div>✓ Set budget limits to control expenses</div>
                                        <div>✓ Assign to relevant departments</div>
                                        <div>✓ Keep category codes short and unique</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ════════════════════════════════════════
                            RIGHT COLUMN (30%) — LIVE PREVIEW & POPULAR ICONS
                        ════════════════════════════════════════ */}
                        <div className="col-lg-4">
                            {/* Live Category Preview Card */}
                            <div className="exp-preview-card">
                                <div style={{ fontSize: "11px", fontWeight: 800, color: "#64748B", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                    Category Preview
                                </div>
                                <div className="exp-preview-icon-wrap" style={{ background: `${selectedColor}18`, color: selectedColor }}>
                                    <FontAwesomeIcon icon={selectedIcon} />
                                </div>
                                <div className="exp-preview-name">
                                    {expenseCategoryValue.name.trim() || "Category Name"}
                                </div>
                                <div className="exp-preview-code">
                                    {code || "EXP-001"}
                                </div>
                                <div>
                                    <span className={status ? "exp-cat-status-active" : "exp-cat-status-inactive"}>
                                        ● {status ? "Active" : "Inactive"}
                                    </span>
                                </div>
                                <div className="exp-preview-desc">
                                    {description || "Category description will appear here as you type."}
                                </div>
                            </div>

                            {/* Popular Icons Panel */}
                            <div className="exp-form-card mt-3">
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <h6 style={{ fontSize: "13px", fontWeight: 700, margin: 0, color: "#0F172A" }}>
                                        Popular Icons
                                    </h6>
                                    <span style={{ fontSize: "11px", color: "#94A3B8" }}>Select icon</span>
                                </div>

                                <div className="exp-icon-grid">
                                    {POPULAR_ICONS.map(i => (
                                        <div
                                            key={i.id}
                                            className={`exp-icon-box ${selectedIcon === i.icon ? "active" : ""}`}
                                            onClick={() => setSelectedIcon(i.icon)}
                                            title={i.label}
                                        >
                                            <FontAwesomeIcon icon={i.icon} />
                                        </div>
                                    ))}
                                </div>

                                <button type="button" className="btn btn-sm w-100 border text-secondary mt-2" style={{ fontSize: "11.5px", borderRadius: "8px", background: "#F8FAFC" }}>
                                    View All Icons
                                </button>
                            </div>
                        </div>

                    </div>
                </Form>
            </div>
        </MasterLayout>
    );
};

export default connect(null, { addExpenseCategory })(CreateExpenseCategoryPage);
