import React, { useState, useMemo } from 'react';
import moment from 'moment';
import { connect } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import MasterLayout from '../MasterLayout';
import TabTitle from '../../shared/tab-title/TabTitle';
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";
import { placeholderText } from '../../shared/sharedMethod';
import { addEmailTemplate } from "../../store/action/emailTemplatesAction";
import ReactQuill from "react-quill";
import 'react-quill/dist/quill.snow.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faEnvelope,
    faPlus,
    faArrowLeft,
    faSave,
    faTags,
    faEye,
    faPen,
    faSliders,
    faInfoCircle,
    faBolt,
    faCheck,
    faCopy,
    faShieldAlt,
    faCode,
    faTimes,
    faPaperPlane
} from "@fortawesome/free-solid-svg-icons";
import "../brands/ProductBrandsPremium.css";
import "../units/ProductUnitsPremium.css";
import "../variation/ProductVariationsPremium.css";
import "./CreateEmailTemplatePremium.css";

const TRIGGER_PRESETS = [
    {
        name: "Sale Invoice Notification",
        type: 1,
        tag: "Sales",
        defaultSubject: "Your Invoice #{sales_id} from {company_name}",
        defaultContent: `<p>Dear <strong>{customer_name}</strong>,</p>
<p>Thank you for shopping with us! Here are your sale invoice details:</p>
<ul>
  <li><strong>Invoice No:</strong> {sales_id}</li>
  <li><strong>Date:</strong> {sales_date}</li>
  <li><strong>Total Amount:</strong> {grand_total}</li>
  <li><strong>Warehouse / Store:</strong> {warehouse_name}</li>
</ul>
<p>View or download your digital invoice: <a href="{invoice_url}">Click here</a></p>
<p>Best regards,<br><strong>{company_name}</strong></p>`
    },
    {
        name: "Sale Return & Refund Alert",
        type: 2,
        tag: "Refund",
        defaultSubject: "Return Confirmation #{sales_id} - {company_name}",
        defaultContent: `<p>Hello <strong>{customer_name}</strong>,</p>
<p>Your return request has been processed successfully.</p>
<ul>
  <li><strong>Return Reference:</strong> {sales_id}</li>
  <li><strong>Date:</strong> {sales_date}</li>
  <li><strong>Refunded Amount:</strong> {grand_total}</li>
</ul>
<p>Thank you for your patience.</p>
<p>Best regards,<br><strong>{company_name}</strong></p>`
    },
    {
        name: "Customer Welcome & Registration",
        type: 3,
        tag: "Customer",
        defaultSubject: "Welcome to {company_name}!",
        defaultContent: `<p>Dear <strong>{customer_name}</strong>,</p>
<p>Welcome to <strong>{company_name}</strong>! We are excited to have you as our valued customer.</p>
<p>If you have any questions or need assistance, feel free to reach out to us at <strong>{email}</strong> or <strong>{phone}</strong>.</p>
<p>Warm regards,<br><strong>{company_name} Team</strong></p>`
    },
    {
        name: "Payment Receipt Confirmation",
        type: 4,
        tag: "Payment",
        defaultSubject: "Payment Receipt for Invoice #{sales_id}",
        defaultContent: `<p>Dear <strong>{customer_name}</strong>,</p>
<p>We have successfully received your payment of <strong>{grand_total}</strong> on <strong>{sales_date}</strong> for order <strong>{sales_id}</strong>.</p>
<p>Thank you for your prompt payment!</p>
<p>Best regards,<br><strong>{company_name}</strong></p>`
    },
    {
        name: "Custom Notification Template",
        type: 5,
        tag: "General",
        defaultSubject: "Important Update from {company_name}",
        defaultContent: `<p>Dear <strong>{customer_name}</strong>,</p>
<p>We are writing to update you regarding your account and recent activities.</p>
<p>Best regards,<br><strong>{company_name}</strong></p>`
    }
];

const DYNAMIC_TAGS = [
    { tag: "{customer_name}", desc: "Customer Full Name", sample: "Manoj S" },
    { tag: "{sales_id}", desc: "Invoice / Order ID", sample: "SA-11024" },
    { tag: "{sales_date}", desc: "Transaction Date", sample: moment().format("DD MMM YYYY") },
    { tag: "{grand_total}", desc: "Total Amount", sample: "₹ 4,250.00" },
    { tag: "{company_name}", desc: "Your Business Name", sample: "Suguna Enterprise" },
    { tag: "{invoice_url}", desc: "Digital Invoice Link", sample: "https://pos.suguna.com/inv/11024" },
    { tag: "{warehouse_name}", desc: "Store / Branch Name", sample: "Main Central Depot" },
    { tag: "{email}", desc: "Contact Email", sample: "care@suguna.com" },
    { tag: "{phone}", desc: "Contact Phone", sample: "+91 98765 43210" }
];

const CreateEmailTemplate = ({ addEmailTemplate }) => {
    const navigate = useNavigate();

    const [templateName, setTemplateName] = useState("");
    const [subjectLine, setSubjectLine] = useState("");
    const [templateContent, setTemplateContent] = useState("");
    const [selectedType, setSelectedType] = useState(1);
    const [errors, setErrors] = useState({});
    const [activeTab, setActiveTab] = useState("editor"); // 'editor' | 'preview'
    const [copySuccess, setCopySuccess] = useState(null);

    const handleApplyPreset = (preset) => {
        setTemplateName(preset.name);
        setSubjectLine(preset.defaultSubject);
        setTemplateContent(preset.defaultContent);
        setSelectedType(preset.type);
        setErrors({});
    };

    const handleInsertTag = (tag) => {
        setTemplateContent(prev => {
            if (!prev || prev === '<p><br></p>') return `<p>${tag}</p>`;
            return prev.replace(/<\/p>$/, ` ${tag}</p>`);
        });
    };

    const handleCopyTag = (tag) => {
        navigator.clipboard.writeText(tag);
        setCopySuccess(tag);
        setTimeout(() => setCopySuccess(null), 1800);
    };

    const validate = () => {
        let errs = {};
        if (!templateName.trim()) {
            errs.name = "Template name is required";
        }
        if (!templateContent.trim() || templateContent === "<p><br></p>") {
            errs.content = "Template content cannot be empty";
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
            subject: subjectLine.trim(),
            content: templateContent,
            type: selectedType,
            status: 1
        };

        addEmailTemplate(payload, navigate);
    };

    // Simulated email body preview with mock dynamic data
    const evaluatedPreviewContent = useMemo(() => {
        let text = templateContent || "<p class='text-muted fst-italic'>No content written yet. Switch to Rich Editor to start writing.</p>";
        DYNAMIC_TAGS.forEach(t => {
            const regex = new RegExp(t.tag.replace(/([{}])/g, "\\$1"), "g");
            text = text.replace(regex, `<span style="background: #FEF3C7; color: #92400E; padding: 1px 5px; border-radius: 4px; font-weight: 600;">${t.sample}</span>`);
        });
        return text;
    }, [templateContent]);

    const evaluatedSubject = useMemo(() => {
        let sub = subjectLine || `Notification from Suguna POS`;
        DYNAMIC_TAGS.forEach(t => {
            const regex = new RegExp(t.tag.replace(/([{}])/g, "\\$1"), "g");
            sub = sub.replace(regex, t.sample);
        });
        return sub;
    }, [subjectLine]);

    const formats = [
        "header", "bold", "italic", "underline", "strike", "blockquote",
        "list", "bullet", "indent", "link", "color", "background", "align"
    ];

    const modules = {
        toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
            [{ color: [] }, { background: [] }],
            ['link', 'clean']
        ]
    };

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title={placeholderText('email-template.create.title') || "Create Email Template"} />

            <div className="var-page-container">

                {/* ── 1. Breadcrumb (Exact Match to Units page) ─── */}
                <div className="var-breadcrumb">
                    <span>Dashboard</span>
                    <span>&gt;</span>
                    <span>Settings</span>
                    <span>&gt;</span>
                    <Link to="/app/email-templates" style={{ color: "inherit", textDecoration: "none" }}>
                        Email Templates
                    </Link>
                    <span>&gt;</span>
                    <span className="var-crumb-active">Create Template</span>
                </div>

                {/* ── 2. Top Header Section (Exact Match to Units page) ─── */}
                <div className="var-header">
                    <div className="var-title-group">
                        <h1>Create Email Template</h1>
                        <p>Design a new transactional email notification with dynamic variables and rich HTML formatting.</p>
                    </div>

                    <div className="var-header-actions">
                        <Link
                            to="/app/email-templates"
                            className="var-btn-pill"
                            style={{ textDecoration: "none" }}
                        >
                            <FontAwesomeIcon icon={faArrowLeft} /> Back to Templates
                        </Link>
                    </div>
                </div>

                {/* ── 3. Main Workspace (2 Columns Responsive) ─── */}
                <div className="email-tmpl-workspace">
                    <form onSubmit={handleSubmit}>
                        <div className="row g-4">

                            {/* Left Main Column: Visual Template Builder */}
                            <div className="col-12 col-xl-8">

                                {/* Card 1: Trigger Presets */}
                                <div className="email-tmpl-card">
                                    <div className="email-card-title-group">
                                        <div className="email-card-title-left">
                                            <div className="email-card-icon green">
                                                <FontAwesomeIcon icon={faBolt} />
                                            </div>
                                            <div>
                                                <h3 className="email-card-heading">Quick Start with a Preset Trigger</h3>
                                                <p className="email-card-sub">Select a template preset to auto-fill layout, subject line, and recommended body copy.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="email-presets-grid">
                                        {TRIGGER_PRESETS.map((p, i) => {
                                            const isSelected = templateName === p.name;
                                            return (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    className={`email-preset-btn ${isSelected ? 'active' : ''}`}
                                                    onClick={() => handleApplyPreset(p)}
                                                >
                                                    <div className="email-preset-name">
                                                        <span>{p.name}</span>
                                                        {isSelected && <FontAwesomeIcon icon={faCheck} style={{ color: "#16A34A" }} />}
                                                    </div>
                                                    <span className="email-preset-tag">{p.tag} Trigger</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Card 2: Template Information */}
                                <div className="email-tmpl-card">
                                    <div className="email-card-title-group">
                                        <div className="email-card-title-left">
                                            <div className="email-card-icon blue">
                                                <FontAwesomeIcon icon={faEnvelope} />
                                            </div>
                                            <div>
                                                <h3 className="email-card-heading">Template Details</h3>
                                                <p className="email-card-sub">Define the unique template identifier and subject line dispatched to recipients.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row g-3">
                                        <div className="col-12 col-md-7">
                                            <div className="email-form-group">
                                                <label className="email-form-label">
                                                    Template Name <span style={{ color: "#EF4444" }}>*</span>
                                                </label>
                                                <div className="email-input-wrap">
                                                    <FontAwesomeIcon icon={faEnvelope} className="email-input-icon" />
                                                    <input
                                                        type="text"
                                                        className="email-input"
                                                        placeholder="e.g., GREETING TO CUSTOMER ON SALES !"
                                                        value={templateName}
                                                        onChange={(e) => {
                                                            setTemplateName(e.target.value);
                                                            if (errors.name) setErrors({ ...errors, name: '' });
                                                        }}
                                                    />
                                                </div>
                                                {errors.name && (
                                                    <div style={{ color: "#EF4444", fontSize: "12px", fontWeight: "600", marginTop: "4px" }}>
                                                        {errors.name}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="col-12 col-md-5">
                                            <div className="email-form-group">
                                                <label className="email-form-label">Notification Type</label>
                                                <select
                                                    className="email-select"
                                                    value={selectedType}
                                                    onChange={(e) => setSelectedType(Number(e.target.value))}
                                                >
                                                    <option value={1}>Sales & Invoicing</option>
                                                    <option value={2}>Returns & Refunds</option>
                                                    <option value={3}>Customer Registration</option>
                                                    <option value={4}>Payment Confirmation</option>
                                                    <option value={5}>General Alert</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="col-12">
                                            <div className="email-form-group" style={{ marginBottom: 0 }}>
                                                <label className="email-form-label">
                                                    Email Subject Line
                                                    <span style={{ fontSize: "11px", color: "#64748B", fontWeight: "500" }}>Dynamic tags supported</span>
                                                </label>
                                                <div className="email-input-wrap">
                                                    <FontAwesomeIcon icon={faPen} className="email-input-icon" />
                                                    <input
                                                        type="text"
                                                        className="email-input"
                                                        placeholder="e.g., Your invoice #{sales_id} from {company_name}"
                                                        value={subjectLine}
                                                        onChange={(e) => setSubjectLine(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Card 3: Dynamic Variable Insertion */}
                                <div className="email-tmpl-card">
                                    <div className="email-card-title-group">
                                        <div className="email-card-title-left">
                                            <div className="email-card-icon purple">
                                                <FontAwesomeIcon icon={faTags} />
                                            </div>
                                            <div>
                                                <h3 className="email-card-heading">Dynamic Variable Inserter</h3>
                                                <p className="email-card-sub">Click any variable chip below to automatically insert it into your email body copy.</p>
                                            </div>
                                        </div>
                                        <span className="unit-short-badge">9 Tags Available</span>
                                    </div>

                                    <div className="email-tags-box">
                                        {DYNAMIC_TAGS.map((t, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                className="email-tag-chip"
                                                onClick={() => handleInsertTag(t.tag)}
                                                title={`Insert ${t.desc} (${t.sample})`}
                                            >
                                                <span className="email-tag-plus">+</span>
                                                <span>{t.tag}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Card 4: Body Content & Live Preview */}
                                <div className="email-tmpl-card">
                                    <div className="email-card-title-group">
                                        <div className="email-card-title-left">
                                            <div className="email-card-icon orange">
                                                <FontAwesomeIcon icon={faPen} />
                                            </div>
                                            <div>
                                                <h3 className="email-card-heading">Email Body Content <span style={{ color: "#EF4444" }}>*</span></h3>
                                                <p className="email-card-sub">Compose with formatting, lists, tables and variables, or preview client rendering.</p>
                                            </div>
                                        </div>

                                        {/* Editor / Preview Switcher */}
                                        <div className="email-editor-tabs">
                                            <button
                                                type="button"
                                                className={`email-tab-btn ${activeTab === 'editor' ? 'active' : ''}`}
                                                onClick={() => setActiveTab('editor')}
                                            >
                                                <FontAwesomeIcon icon={faPen} /> Rich Editor
                                            </button>
                                            <button
                                                type="button"
                                                className={`email-tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
                                                onClick={() => setActiveTab('preview')}
                                            >
                                                <FontAwesomeIcon icon={faEye} /> Live Preview
                                            </button>
                                        </div>
                                    </div>

                                    {activeTab === 'editor' ? (
                                        <div className="email-quill-wrap">
                                            <ReactQuill
                                                theme="snow"
                                                modules={modules}
                                                formats={formats}
                                                value={templateContent}
                                                onChange={(content) => {
                                                    setTemplateContent(content);
                                                    if (errors.content) setErrors({ ...errors, content: '' });
                                                }}
                                                placeholder="Write your email template message here or click presets above..."
                                            />
                                            {errors.content && (
                                                <div style={{ color: "#EF4444", fontSize: "12.5px", fontWeight: "600", marginTop: "8px" }}>
                                                    {errors.content}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        /* Authentic Simulated Email Client Frame */
                                        <div className="email-client-frame">
                                            <div className="email-client-topbar">
                                                <div className="email-window-dots">
                                                    <div className="email-dot red" />
                                                    <div className="email-dot yellow" />
                                                    <div className="email-dot green" />
                                                </div>
                                                <span style={{ fontSize: "12px", color: "#64748B", fontWeight: "600" }}>
                                                    Email Client Simulation (Sample Data Preview)
                                                </span>
                                            </div>

                                            <div className="email-meta-box">
                                                <div className="email-meta-row">
                                                    <span className="email-meta-label">From:</span>
                                                    <span className="email-meta-val">Suguna POS &lt;notifications@suguna.com&gt;</span>
                                                </div>
                                                <div className="email-meta-row">
                                                    <span className="email-meta-label">To:</span>
                                                    <span className="email-meta-val">Manoj S &lt;manoj@example.com&gt;</span>
                                                </div>
                                                <div className="email-meta-row">
                                                    <span className="email-meta-label">Subject:</span>
                                                    <span className="email-meta-val" style={{ color: "#16A34A", fontWeight: "700" }}>{evaluatedSubject}</span>
                                                </div>
                                            </div>

                                            <div
                                                className="email-client-body"
                                                dangerouslySetInnerHTML={{ __html: evaluatedPreviewContent }}
                                            />
                                        </div>
                                    )}

                                    {/* Action Bar */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #F1F5F9' }}>
                                        <button
                                            type="submit"
                                            className="var-btn-pill var-btn-primary"
                                            style={{ border: 'none', cursor: 'pointer', height: '46px', padding: '0 32px' }}
                                        >
                                            <FontAwesomeIcon icon={faSave} /> Save Email Template
                                        </button>
                                        <Link
                                            to="/app/email-templates"
                                            className="var-btn-pill"
                                            style={{ textDecoration: 'none', height: '46px', display: 'inline-flex', alignItems: 'center' }}
                                        >
                                            Cancel
                                        </Link>
                                    </div>
                                </div>

                            </div>

                            {/* Right Column: Dynamic Variables Guide & Automation Card */}
                            <div className="col-12 col-xl-4">

                                {/* Card 1: Variable Directory */}
                                <div className="email-tmpl-card">
                                    <div className="email-card-title-group">
                                        <div className="email-card-title-left">
                                            <div className="email-card-icon blue">
                                                <FontAwesomeIcon icon={faCode} />
                                            </div>
                                            <div>
                                                <h3 className="email-card-heading">Variable Directory</h3>
                                                <p className="email-card-sub">Automatic runtime substitution tokens.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {copySuccess && (
                                        <div style={{ background: '#DCFCE7', color: '#166534', padding: '8px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <FontAwesomeIcon icon={faCheck} /> Copied <code>{copySuccess}</code> to clipboard!
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {DYNAMIC_TAGS.map((t, idx) => (
                                            <div key={idx} className="email-var-row">
                                                <div>
                                                    <div className="email-var-code">{t.tag}</div>
                                                    <div className="email-var-desc">{t.desc}</div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button
                                                        type="button"
                                                        className="email-var-insert-btn"
                                                        onClick={() => handleInsertTag(t.tag)}
                                                        title="Insert into editor"
                                                    >
                                                        + Insert
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="brand-action-btn"
                                                        style={{ width: '28px', height: '28px', fontSize: '11px' }}
                                                        onClick={() => handleCopyTag(t.tag)}
                                                        title="Copy Tag"
                                                    >
                                                        <FontAwesomeIcon icon={faCopy} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Card 2: Instant Realtime Dispatch Guide */}
                                <div className="email-tmpl-card" style={{ background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)', borderColor: '#BBF7D0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#16A34A', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                                            <FontAwesomeIcon icon={faPaperPlane} />
                                        </div>
                                        <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#166534', margin: 0 }}>
                                            Instant Realtime Automation
                                        </h4>
                                    </div>
                                    <p style={{ fontSize: '12.5px', color: '#14532D', lineHeight: '1.55', margin: 0 }}>
                                        When triggered by sales or return events, the system will automatically parse this template, replace all placeholders with live transaction data, and send it through your configured SMTP mail gateway.
                                    </p>
                                </div>

                            </div>

                        </div>
                    </form>
                </div>

            </div>
        </MasterLayout>
    );
};

export default connect(null, { addEmailTemplate })(CreateEmailTemplate);
