import React, { useState } from 'react';
import { connect } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import MasterLayout from '../MasterLayout';
import TabTitle from '../../shared/tab-title/TabTitle';
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";
import { addSmsTemplate } from "../../store/action/smsTemplatesAction";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faComments,
    faPlus,
    faArrowLeft,
    faSave,
    faTags,
    faMobileAlt,
    faInfoCircle,
    faBolt,
    faCheck,
    faPaperPlane
} from "@fortawesome/free-solid-svg-icons";
import "../brands/ProductBrandsPremium.css";

const TRIGGER_PRESETS = [
    {
        name: "Sale SMS Notification",
        type: 1,
        content: "Hi {customer_name}, thank you for your purchase! Invoice ID: {sales_id}, Date: {sales_date}, Total: {grand_total}. Thank you, {company_name}!"
    },
    {
        name: "Sale Return SMS Alert",
        type: 2,
        content: "Hi {customer_name}, your return for {sales_id} has been processed. Refund: {grand_total}. Date: {sales_date}. Team {company_name}."
    },
    {
        name: "Customer Welcome SMS",
        type: 3,
        content: "Welcome to {company_name}, {customer_name}! We are glad to have you with us. Reach us anytime for great offers!"
    },
    {
        name: "Payment Receipt SMS",
        type: 4,
        content: "Dear {customer_name}, we received your payment of {grand_total} for {sales_id} on {sales_date}. Thanks, {company_name}."
    },
    {
        name: "Custom SMS Alert",
        type: 5,
        content: "Hi {customer_name}, important alert from {company_name}: Your order {sales_id} has been updated."
    }
];

const DYNAMIC_TAGS = [
    { tag: "{customer_name}", desc: "Customer Full Name" },
    { tag: "{sales_id}", desc: "Invoice / Order ID" },
    { tag: "{sales_date}", desc: "Transaction Date" },
    { tag: "{grand_total}", desc: "Total Amount" },
    { tag: "{company_name}", desc: "Business Name" },
    { tag: "{warehouse_name}", desc: "Store / Branch" }
];

const CreateSmsTemplate = ({ addSmsTemplate }) => {
    const navigate = useNavigate();

    const [templateName, setTemplateName] = useState("");
    const [templateContent, setTemplateContent] = useState("");
    const [selectedType, setSelectedType] = useState(1);
    const [errors, setErrors] = useState({});

    const handleApplyPreset = (preset) => {
        setTemplateName(preset.name);
        setTemplateContent(preset.content);
        setSelectedType(preset.type);
        setErrors({});
    };

    const handleInsertTag = (tag) => {
        setTemplateContent(prev => prev + ` ${tag} `);
    };

    const validate = () => {
        let errs = {};
        if (!templateName.trim()) {
            errs.name = "Template name is required";
        }
        if (!templateContent.trim()) {
            errs.content = "SMS content cannot be empty";
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;

        const payload = {
            name: templateName.trim(),
            template_name: templateName.trim(),
            content: templateContent.trim(),
            type: selectedType,
            status: 1
        };

        addSmsTemplate(payload, navigate);
    };

    // SMS length metrics
    const charCount = templateContent.length;
    const smsCount = charCount === 0 ? 0 : charCount <= 160 ? 1 : Math.ceil(charCount / 153);

    // Mock formatted preview string
    const samplePreview = templateContent
        .replace(/{customer_name}/g, "John Doe")
        .replace(/{sales_id}/g, "INV-00104")
        .replace(/{sales_date}/g, "29-08-2026")
        .replace(/{grand_total}/g, "$250.00")
        .replace(/{company_name}/g, "Suguna POS")
        .replace(/{warehouse_name}/g, "Main Branch");

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title="Create SMS Template" />

            <div className="brand-page-container">

                {/* 1. Breadcrumb */}
                <div className="brand-breadcrumb">
                    <span>Dashboard</span>
                    <span>&gt;</span>
                    <span>Settings</span>
                    <span>&gt;</span>
                    <Link to="/app/sms-templates" style={{ color: "inherit", textDecoration: "none" }}>
                        SMS Templates
                    </Link>
                    <span>&gt;</span>
                    <span className="brand-crumb-active">Create Template</span>
                </div>

                {/* 2. Header */}
                <div className="brand-header">
                    <div className="brand-title-group">
                        <h1>Create SMS Template</h1>
                        <p>Configure automated transactional SMS notifications and customer text alerts.</p>
                    </div>

                    <div className="brand-header-actions">
                        <Link
                            to="/app/sms-templates"
                            className="brand-btn-pill text-decoration-none"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} /> Back to SMS Templates
                        </Link>
                    </div>
                </div>

                {/* 3. Main Workspace */}
                <div className="row g-4">
                    {/* Left: Editor Form */}
                    <div className="col-12 col-lg-7">
                        <div style={{ background: "#FFFFFF", borderRadius: "20px", border: "1px solid #EEF2F7", padding: "28px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                            
                            {/* Preset Quick Select */}
                            <div className="mb-4">
                                <label className="form-label fw-bold text-dark d-flex align-items-center gap-2 mb-2" style={{ fontSize: "13.5px" }}>
                                    <FontAwesomeIcon icon={faBolt} style={{ color: "#16A34A" }} />
                                    Quick Start with a Preset SMS Trigger
                                </label>
                                <div className="d-flex flex-wrap gap-2">
                                    {TRIGGER_PRESETS.map((p, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => handleApplyPreset(p)}
                                            style={{
                                                padding: "6px 14px",
                                                borderRadius: "999px",
                                                border: templateName === p.name ? "1.5px solid #16A34A" : "1px solid #E2E8F0",
                                                background: templateName === p.name ? "#DCFCE7" : "#F8FAFC",
                                                color: templateName === p.name ? "#15803D" : "#475569",
                                                fontSize: "12px",
                                                fontWeight: "600",
                                                cursor: "pointer",
                                                transition: "all 0.2s"
                                            }}
                                        >
                                            {p.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <form onSubmit={handleSubmit}>
                                {/* Template Name Field */}
                                <div className="mb-4">
                                    <label className="form-label fw-bold text-dark" style={{ fontSize: "13.5px" }}>
                                        Template Name <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                        placeholder="e.g., GREETING TO CUSTOMER ON SALES !"
                                        value={templateName}
                                        onChange={(e) => {
                                            setTemplateName(e.target.value);
                                            if (errors.name) setErrors({ ...errors, name: '' });
                                        }}
                                        style={{ height: "46px", borderRadius: "12px", fontSize: "14px", fontWeight: "500" }}
                                    />
                                    {errors.name && <div className="invalid-feedback fw-semibold">{errors.name}</div>}
                                </div>

                                {/* Dynamic Variable Chips */}
                                <div className="mb-3">
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                        <label className="form-label fw-bold text-dark mb-0 d-flex align-items-center gap-2" style={{ fontSize: "13px" }}>
                                            <FontAwesomeIcon icon={faTags} style={{ color: "#2563EB" }} />
                                            Click Dynamic Variable to Insert
                                        </label>
                                        <span className="text-muted" style={{ fontSize: "11px" }}>Replaced with live data</span>
                                    </div>
                                    <div className="d-flex flex-wrap gap-2 p-3" style={{ background: "#F8FAFC", borderRadius: "14px", border: "1px dashed #CBD5E1" }}>
                                        {DYNAMIC_TAGS.map((t, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => handleInsertTag(t.tag)}
                                                className="btn btn-sm btn-white border shadow-sm"
                                                style={{
                                                    borderRadius: "8px",
                                                    fontSize: "12px",
                                                    fontWeight: "600",
                                                    color: "#1E293B",
                                                    background: "#FFFFFF"
                                                }}
                                                title={t.desc}
                                            >
                                                <span style={{ color: "#2563EB" }}>+</span> {t.tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* SMS Body Textarea */}
                                <div className="mb-3">
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                        <label className="form-label fw-bold text-dark mb-0" style={{ fontSize: "13.5px" }}>
                                            SMS Message Content <span className="text-danger">*</span>
                                        </label>
                                        <div className="d-flex align-items-center gap-2">
                                            <span style={{ fontSize: "12px", color: charCount > 160 ? "#D97706" : "#64748B", fontWeight: "600" }}>
                                                {charCount} Characters
                                            </span>
                                            <span className="badge bg-light text-dark border">
                                                {smsCount} {smsCount === 1 ? 'SMS Segment' : 'SMS Segments'}
                                            </span>
                                        </div>
                                    </div>

                                    <textarea
                                        rows={6}
                                        className={`form-control ${errors.content ? 'is-invalid' : ''}`}
                                        placeholder="Type SMS template body here..."
                                        value={templateContent}
                                        onChange={(e) => {
                                            setTemplateContent(e.target.value);
                                            if (errors.content) setErrors({ ...errors, content: '' });
                                        }}
                                        style={{ borderRadius: "12px", fontSize: "14px", lineHeight: "1.6" }}
                                    />
                                    {errors.content && <div className="invalid-feedback fw-semibold">{errors.content}</div>}
                                </div>

                                {/* Action Buttons */}
                                <div className="d-flex align-items-center gap-3 pt-3 border-top mt-4">
                                    <button
                                        type="submit"
                                        className="brand-btn-pill brand-btn-primary"
                                        style={{ border: "none", cursor: "pointer", height: "44px", padding: "0 28px" }}
                                    >
                                        <FontAwesomeIcon icon={faSave} /> Save SMS Template
                                    </button>
                                    <Link
                                        to="/app/sms-templates"
                                        className="brand-btn-pill text-decoration-none text-muted"
                                        style={{ height: "44px", display: "inline-flex", alignItems: "center" }}
                                    >
                                        Cancel
                                    </Link>
                                </div>
                            </form>

                        </div>
                    </div>

                    {/* Right: Phone Mockup Live Preview */}
                    <div className="col-12 col-lg-5">
                        <div style={{ background: "#FFFFFF", borderRadius: "20px", border: "1px solid #EEF2F7", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                            <div className="d-flex align-items-center gap-2 mb-3">
                                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#DCFCE7", color: "#16A34A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <FontAwesomeIcon icon={faMobileAlt} />
                                </div>
                                <h6 className="fw-bold text-dark mb-0" style={{ fontSize: "14px" }}>Realtime SMS Device Preview</h6>
                            </div>

                            {/* Phone Frame */}
                            <div
                                style={{
                                    maxWidth: "320px",
                                    margin: "0 auto",
                                    background: "#0F172A",
                                    borderRadius: "32px",
                                    padding: "12px",
                                    boxShadow: "0 16px 40px rgba(15, 23, 42, 0.2)"
                                }}
                            >
                                <div
                                    style={{
                                        background: "#F1F5F9",
                                        borderRadius: "24px",
                                        padding: "18px 14px",
                                        minHeight: "340px",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "space-between"
                                    }}
                                >
                                    {/* Phone Header */}
                                    <div className="text-center pb-2 border-bottom">
                                        <div style={{ width: "40px", height: "4px", background: "#CBD5E1", borderRadius: "999px", margin: "0 auto 8px auto" }} />
                                        <div style={{ fontSize: "12px", fontWeight: "700", color: "#0F172A" }}>
                                            Suguna SMS Alert
                                        </div>
                                        <div style={{ fontSize: "10px", color: "#94A3B8" }}>Today 12:45 PM</div>
                                    </div>

                                    {/* SMS Bubble */}
                                    <div className="my-auto py-3">
                                        <div
                                            style={{
                                                background: "#16A34A",
                                                color: "#FFFFFF",
                                                borderRadius: "16px 16px 4px 16px",
                                                padding: "12px 14px",
                                                fontSize: "12.5px",
                                                lineHeight: "1.5",
                                                boxShadow: "0 2px 8px rgba(22, 163, 74, 0.25)",
                                                wordBreak: "break-word"
                                            }}
                                        >
                                            {samplePreview || "Type your SMS content to see how it appears on customer phones..."}
                                        </div>
                                        <div className="text-end mt-1" style={{ fontSize: "9.5px", color: "#94A3B8" }}>
                                            Delivered via Gateway
                                        </div>
                                    </div>

                                    {/* Phone Bottom bar */}
                                    <div className="pt-2 border-top text-center" style={{ fontSize: "10.5px", color: "#64748B" }}>
                                        160 chars / standard SMS
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 p-3" style={{ background: "#F8FAFC", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                                <div className="d-flex align-items-center gap-2 text-primary fw-bold" style={{ fontSize: "12px" }}>
                                    <FontAwesomeIcon icon={faPaperPlane} /> Automatic Gateway Dispatch
                                </div>
                                <p className="mb-0 mt-1" style={{ fontSize: "11px", color: "#64748B", lineHeight: "1.4" }}>
                                    Active SMS templates are dispatched through your configured SMS provider (Twilio / Custom Gateway).
                                </p>
                            </div>

                        </div>
                    </div>
                </div>

            </div>
        </MasterLayout>
    );
};

export default connect(null, { addSmsTemplate })(CreateSmsTemplate);
