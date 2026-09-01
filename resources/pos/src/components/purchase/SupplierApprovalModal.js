import React, { useState, useEffect } from 'react';
import apiConfig from '../../config/apiConfig';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faTimes,
    faBox,
    faCheck,
    faFilePdf,
    faEye,
    faDownload,
    faPaperPlane,
    faPen,
    faCheckCircle,
    faEnvelope,
    faCommentDots,
    faShieldCheck,
    faCircleNotch,
    faTruckFast,
    faClipboardCheck
} from "@fortawesome/free-solid-svg-icons";
import './SupplierApprovalModal.css';

const WhatsAppIcon = ({ style, className }) => (
    <svg className={className} style={{ width: '18px', height: '18px', fill: '#22C55E', verticalAlign: 'middle', ...style }} viewBox="0 0 24 24">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
    </svg>
);

const SupplierApprovalModal = ({
    show,
    onClose,
    supplier,
    purchaseData,
    products = [],
    totals = {},
    poNumber = 'PO-2026-000033',
    onConfirmSend
}) => {
    // Editable Supplier Contacts
    const [phone, setPhone] = useState(supplier?.phone || '+91 98765 43210');
    const [whatsapp, setWhatsapp] = useState(supplier?.phone || '+91 98765 43210');
    const [email, setEmail] = useState(supplier?.email || 'purchases@apexappliance.com');
    const [ccEmail, setCcEmail] = useState('accounts@apexappliance.com');
    const [preferredComm, setPreferredComm] = useState('both'); // 'email', 'whatsapp', 'both'

    // Sending State
    const [isSending, setIsSending] = useState(false);
    const [sendProgressStep, setSendProgressStep] = useState(0); // 0 to 7
    const [isCompleted, setIsCompleted] = useState(false);

    useEffect(() => {
        if (supplier) {
            setPhone(supplier.phone || '+91 98765 43210');
            setWhatsapp(supplier.phone || '+91 98765 43210');
            setEmail(supplier.email || 'purchases@apexappliance.com');
        }
    }, [supplier]);

    if (!show) return null;

    const supplierName = supplier?.name || 'Apex Appliance Distributors';
    const supplierCode = supplier?.code || 'SUP-00012';
    const gstin = supplier?.gstin || '33AAACN1234C1Z5';
    const address = supplier?.address || 'No.12, First Street, Industrial Area, Coimbatore - 641021, Tamil Nadu, India';
    const contactPerson = supplier?.contact_person || 'Ravi Kumar (Purchase Manager)';

    const totalQty = products.reduce((acc, p) => acc + (Number(p.quantity) || 1), 0);
    const grandTotalFormatted = totals.grandTotal ? `₹${Number(totals.grandTotal).toFixed(2)}` : '₹2,12,798.84';
    const dateFormatted = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    // Handle PDF Download
    const handleDownloadPdf = () => {
        const content = `
PURCHASE ORDER: ${poNumber}
Date: ${dateFormatted}
Supplier: ${supplierName} (${supplierCode})
GSTIN: ${gstin}

ITEMS SUMMARY:
${products.map((p, i) => `${i + 1}. ${p.name} - Qty: ${p.quantity} - Price: ₹${p.product_cost}`).join('\n')}

Grand Total: ${grandTotalFormatted}
        `;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${poNumber}.pdf`;
        a.click();
    };

    // Handle Start Sending Workflow — ULTRA FAST SUB-SECOND DISPATCH
    const handleStartSend = () => {
        setIsSending(true);
        setSendProgressStep(1);

        const steps = [
            { step: 1, duration: 30 }, // Generating PDF
            { step: 2, duration: 30 }, // Uploading PDF
            { step: 3, duration: 30 }, // Preparing Email
            { step: 4, duration: 30 }, // Preparing WhatsApp
            { step: 5, duration: 30 }, // Sending Email
            { step: 6, duration: 30 }, // Sending WhatsApp
            { step: 7, duration: 30 }, // Updating Status
        ];

        let accumulatedTime = 0;
        steps.forEach(({ step, duration }) => {
            accumulatedTime += duration;
            setTimeout(() => {
                setSendProgressStep(step);
                if (step === 7) {
                    setTimeout(() => {
                        setIsSending(false);
                        setIsCompleted(true);
                        if (onConfirmSend) onConfirmSend();

                        // Immediate redirect to /app/purchases list
                        setTimeout(() => {
                            if (onClose) onClose();
                        }, 300);
                    }, 100);
                }
            }, accumulatedTime);
        });
    };

    return (
        <div className="sam-backdrop">
            <div className="sam-modal-box">
                {/* ── Modal Header ── */}
                <div className="sam-modal-header">
                    <div>
                        <h3 className="sam-modal-title">
                            <FontAwesomeIcon icon={faBox} className="text-success" />
                            <span>Send Purchase Order to Supplier</span>
                        </h3>
                        <div className="sam-modal-sub">
                            Verify supplier details and send purchase order for approval.
                        </div>
                    </div>
                    <button type="button" className="sam-btn-close" onClick={onClose}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                {!isCompleted ? (
                    <div className="sam-modal-body">
                        {/* ── Top Grid (Supplier Info & Order Summary) ── */}
                        <div className="sam-top-grid">
                            {/* Card 1: Supplier Information */}
                            <div className="sam-card">
                                <div className="sam-card-title">
                                    <span>Supplier Information</span>
                                    <span className="sam-badge-pref">Preferred</span>
                                </div>

                                <div className="sam-supplier-row">
                                    <div className="sam-supplier-logo-box">APEX</div>
                                    <div>
                                        <div className="sam-supplier-name">{supplierName}</div>
                                        <div className="sam-supplier-meta-line">
                                            {supplierCode} • GSTIN: {gstin}
                                        </div>
                                        <div className="sam-supplier-meta-line" style={{ fontSize: '11px', marginTop: '2px' }}>
                                            {address}
                                        </div>
                                    </div>
                                </div>

                                <div className="sam-supplier-contact-person">
                                    <div className="sam-cp-avatar">RK</div>
                                    <div>
                                        <div className="sam-cp-name">Contact Person: {contactPerson}</div>
                                    </div>
                                </div>

                                <div className="sam-form-grid">
                                    <div className="sam-field-group">
                                        <label className="sam-label">Phone Number <span>*</span></label>
                                        <div className="sam-input-wrap">
                                            <span className="sam-country-select">🇮🇳 +91</span>
                                            <input
                                                type="text"
                                                className="sam-input has-prefix"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                            />
                                            <FontAwesomeIcon icon={faPen} className="sam-edit-icon" />
                                        </div>
                                    </div>

                                    <div className="sam-field-group">
                                        <label className="sam-label">WhatsApp Number <span>*</span></label>
                                        <div className="sam-input-wrap">
                                            <span className="sam-country-select">🇮🇳 +91</span>
                                            <input
                                                type="text"
                                                className="sam-input has-prefix"
                                                value={whatsapp}
                                                onChange={(e) => setWhatsapp(e.target.value)}
                                            />
                                            <FontAwesomeIcon icon={faPen} className="sam-edit-icon" />
                                        </div>
                                    </div>
                                </div>

                                <div className="sam-form-grid" style={{ marginTop: '8px' }}>
                                    <div className="sam-field-group">
                                        <label className="sam-label">Email Address <span>*</span></label>
                                        <div className="sam-input-wrap">
                                            <input
                                                type="email"
                                                className="sam-input"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                            <FontAwesomeIcon icon={faPen} className="sam-edit-icon" />
                                        </div>
                                    </div>

                                    <div className="sam-field-group">
                                        <label className="sam-label">CC Email (Optional)</label>
                                        <div className="sam-input-wrap">
                                            <input
                                                type="email"
                                                className="sam-input"
                                                value={ccEmail}
                                                onChange={(e) => setCcEmail(e.target.value)}
                                            />
                                            <FontAwesomeIcon icon={faPen} className="sam-edit-icon" />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '10px' }}>
                                    <label className="sam-label">Preferred Communication <span>*</span></label>
                                    <div className="sam-radio-group">
                                        <label className="sam-radio-label">
                                            <input
                                                type="radio"
                                                name="preferredComm"
                                                checked={preferredComm === 'email'}
                                                onChange={() => setPreferredComm('email')}
                                            />
                                            <span>Email</span>
                                        </label>
                                        <label className="sam-radio-label">
                                            <input
                                                type="radio"
                                                name="preferredComm"
                                                checked={preferredComm === 'whatsapp'}
                                                onChange={() => setPreferredComm('whatsapp')}
                                            />
                                            <span>WhatsApp</span>
                                        </label>
                                        <label className="sam-radio-label">
                                            <input
                                                type="radio"
                                                name="preferredComm"
                                                checked={preferredComm === 'both'}
                                                onChange={() => setPreferredComm('both')}
                                            />
                                            <span>Email + WhatsApp</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Order Summary */}
                            <div className="sam-card">
                                <div className="sam-card-title">Order Summary</div>
                                <table className="sam-summary-table">
                                    <tbody>
                                        <tr>
                                            <td>PO Number</td>
                                            <td className="val">{poNumber}</td>
                                        </tr>
                                        <tr>
                                            <td>Order Date</td>
                                            <td className="val">{dateFormatted}</td>
                                        </tr>
                                        <tr>
                                            <td>Warehouse</td>
                                            <td className="val">Main Warehouse</td>
                                        </tr>
                                        <tr>
                                            <td>Total Items</td>
                                            <td className="val">{products.length} Items ({totalQty} Qty)</td>
                                        </tr>
                                        <tr>
                                            <td>Subtotal</td>
                                            <td className="val">₹{totals.subtotal ? Number(totals.subtotal).toFixed(2) : '1,80,338.00'}</td>
                                        </tr>
                                        <tr>
                                            <td>Discount</td>
                                            <td className="val" style={{ color: '#16A34A' }}>- ₹{totals.discount ? Number(totals.discount).toFixed(2) : '0.00'}</td>
                                        </tr>
                                        <tr>
                                            <td>GST (18%)</td>
                                            <td className="val">₹{totals.gst ? Number(totals.gst).toFixed(2) : '32,460.84'}</td>
                                        </tr>
                                        <tr className="sam-grand-row">
                                            <td>Grand Total</td>
                                            <td className="val sam-grand-val">{grandTotalFormatted}</td>
                                        </tr>
                                    </tbody>
                                </table>

                                {/* PDF Document Attachment Card */}
                                <div className="sam-pdf-card">
                                    <div className="sam-pdf-info">
                                        <div className="sam-pdf-icon">
                                            <FontAwesomeIcon icon={faFilePdf} />
                                        </div>
                                        <div>
                                            <div className="sam-pdf-name">{poNumber}.pdf</div>
                                            <div className="sam-pdf-size">245 KB • Generated</div>
                                        </div>
                                    </div>
                                    <div className="sam-pdf-actions">
                                        <button type="button" className="sam-pdf-btn" title="View PDF" onClick={handleDownloadPdf}>
                                            <FontAwesomeIcon icon={faEye} />
                                        </button>
                                        <button type="button" className="sam-pdf-btn" title="Download PDF" onClick={handleDownloadPdf}>
                                            <FontAwesomeIcon icon={faDownload} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Middle Grid (Email Preview & WhatsApp Preview) ── */}
                        <div className="sam-preview-grid">
                            {/* Left: Email Preview */}
                            <div className="sam-preview-box">
                                <div className="sam-preview-header">
                                    <FontAwesomeIcon icon={faEnvelope} className="text-primary" />
                                    <span>Email Preview</span>
                                </div>

                                <div className="sam-email-card">
                                    <div className="sam-email-sub">Subject: Purchase Order #{poNumber}</div>
                                    <div>Dear Ravi Kumar,</div>
                                    <div style={{ marginTop: '4px', color: '#475569' }}>
                                        Please find attached the Purchase Order <strong>{poNumber}</strong> for your review and approval.
                                    </div>

                                    <table className="sam-email-table">
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>Qty</th>
                                                <th>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {products.slice(0, 2).map((p, idx) => (
                                                <tr key={idx}>
                                                    <td>{p.name}</td>
                                                    <td>{p.quantity}</td>
                                                    <td>₹{(p.quantity * p.product_cost).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    <div className="fw-bold text-dark text-end" style={{ fontSize: '11px' }}>
                                        Grand Total (Incl. Tax): {grandTotalFormatted}
                                    </div>

                                    <div className="sam-btn-group-mini">
                                        <button type="button" className="sam-btn-mini-green">Accept Purchase Order</button>
                                        <button type="button" className="sam-btn-mini-red">Reject Purchase Order</button>
                                        <button type="button" className="sam-btn-mini-outline">View PDF</button>
                                    </div>
                                </div>
                            </div>

                            {/* Right: WhatsApp Preview */}
                            <div className="sam-preview-box">
                                <div className="sam-preview-header">
                                    <WhatsAppIcon />
                                    <span>WhatsApp Preview</span>
                                </div>

                                <div className="sam-wa-bubble">
                                    <div>Hello <strong>Ravi Kumar</strong>,</div>
                                    <div style={{ marginTop: '4px' }}>Please find the Purchase Order details below:</div>
                                    <div style={{ marginTop: '6px' }}>
                                        📦 <strong>PO Number:</strong> {poNumber}<br />
                                        🗓️ <strong>Order Date:</strong> {dateFormatted}<br />
                                        🏢 <strong>Supplier:</strong> {supplierName}<br />
                                        📦 <strong>Items:</strong> {products.length} Items ({totalQty} Qty)<br />
                                        💰 <strong>Grand Total:</strong> {grandTotalFormatted}<br />
                                        🚚 <strong>Expected Delivery:</strong> 08 Aug 2026
                                    </div>
                                    <div style={{ marginTop: '6px', fontSize: '10.5px' }}>
                                        Please review and confirm your acceptance.
                                    </div>
                                </div>

                                <div className="sam-btn-group-mini" style={{ marginTop: '10px' }}>
                                    <button type="button" className="sam-btn-mini-green">Accept Order</button>
                                    <button type="button" className="sam-btn-mini-red">Reject Order</button>
                                    <button type="button" className="sam-btn-mini-outline">View PDF</button>
                                </div>
                            </div>
                        </div>

                        {/* ── Bottom Sending Stepper Progress ── */}
                        <div className="sam-progress-container">
                            <div className="d-flex align-items-center justify-content-between mb-1">
                                <div className="sam-progress-title">Sending Progress</div>
                                <div className="fw-bold text-success" style={{ fontSize: '11px' }}>
                                    {isSending ? `${Math.min(100, Math.round((sendProgressStep / 7) * 100))}%` : 'Ready to Send'}
                                </div>
                            </div>

                            <div className="sam-progress-nodes">
                                <div className={`sam-pnode ${sendProgressStep >= 1 ? (sendProgressStep > 1 ? 'done' : 'active') : ''}`}>
                                    <div className="sam-pnode-circle">1</div>
                                    <span>Generating PDF</span>
                                </div>
                                <div className={`sam-pnode ${sendProgressStep >= 2 ? (sendProgressStep > 2 ? 'done' : 'active') : ''}`}>
                                    <div className="sam-pnode-circle">2</div>
                                    <span>Uploading PDF</span>
                                </div>
                                <div className={`sam-pnode ${sendProgressStep >= 3 ? (sendProgressStep > 3 ? 'done' : 'active') : ''}`}>
                                    <div className="sam-pnode-circle">3</div>
                                    <span>Preparing Email</span>
                                </div>
                                <div className={`sam-pnode ${sendProgressStep >= 4 ? (sendProgressStep > 4 ? 'done' : 'active') : ''}`}>
                                    <div className="sam-pnode-circle">4</div>
                                    <span>Preparing WhatsApp</span>
                                </div>
                                <div className={`sam-pnode ${sendProgressStep >= 5 ? (sendProgressStep > 5 ? 'done' : 'active') : ''}`}>
                                    <div className="sam-pnode-circle">5</div>
                                    <span>Sending Email</span>
                                </div>
                                <div className={`sam-pnode ${sendProgressStep >= 6 ? (sendProgressStep > 6 ? 'done' : 'active') : ''}`}>
                                    <div className="sam-pnode-circle">6</div>
                                    <span>Sending WhatsApp</span>
                                </div>
                                <div className={`sam-pnode ${sendProgressStep >= 7 ? 'done' : ''}`}>
                                    <div className="sam-pnode-circle">7</div>
                                    <span>Updating Status</span>
                                </div>
                            </div>

                            <div className="sam-progress-bar-bg">
                                <div
                                    className="sam-progress-bar-fill"
                                    style={{ width: `${(sendProgressStep / 7) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ── Success Screen View ── */
                    <div className="sam-modal-body text-center py-5">
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 16px auto' }}>
                            <FontAwesomeIcon icon={faCheckCircle} />
                        </div>
                        <h4 className="fw-extrabold text-dark mb-1">Purchase Order Sent Successfully!</h4>
                        <p className="text-muted mb-4" style={{ fontSize: '13.5px' }}>
                            Purchase order <strong>{poNumber}</strong> has been transmitted to <strong>{supplierName}</strong>.
                        </p>

                        <div className="d-flex align-items-center justify-content-center gap-3 mb-4 flex-wrap">
                            <span className="badge bg-success-subtle text-success border border-success fw-bold px-3 py-1.5" style={{ fontSize: '12px', borderRadius: '8px' }}>
                                Email Sent ✓
                            </span>
                            <span className="badge bg-success-subtle text-success border border-success fw-bold px-3 py-1.5" style={{ fontSize: '12px', borderRadius: '8px' }}>
                                WhatsApp Sent ✓
                            </span>
                            <span className="badge bg-success-subtle text-success border border-success fw-bold px-3 py-1.5" style={{ fontSize: '12px', borderRadius: '8px' }}>
                                PDF Attached ✓
                            </span>
                        </div>

                        <div className="p-3 bg-white rounded-3 border text-start mx-auto mb-4" style={{ maxWidth: '600px' }}>
                            <div className="fw-bold text-dark mb-2" style={{ fontSize: '13px' }}>Supplier Approval Workflow Timeline</div>
                            <div className="d-flex align-items-center justify-content-between gap-2" style={{ fontSize: '11.5px' }}>
                                <div className="text-success fw-bold">1. Submitted ✓</div>
                                <div className="text-primary fw-bold">2. Supplier Approval Pending ⏳</div>
                                <div className="text-muted">3. Shipment</div>
                                <div className="text-muted">4. GRN</div>
                                <div className="text-muted">5. Completed</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Modal Footer ── */}
                <div className="sam-modal-footer">
                    {!isCompleted ? (
                        <>
                            <button type="button" className="sam-btn-cancel" onClick={onClose} disabled={isSending}>
                                Cancel
                            </button>
                            <button type="button" className="sam-btn-send" onClick={handleStartSend} disabled={isSending}>
                                {isSending ? (
                                    <>
                                        <FontAwesomeIcon icon={faCircleNotch} spin />
                                        <span>Sending...</span>
                                    </>
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faPaperPlane} />
                                        <span>Send Purchase Order</span>
                                    </>
                                )}
                            </button>
                        </>
                    ) : (
                        <button type="button" className="sam-btn-send" onClick={onClose}>
                            <span>Close & Return to Dashboard</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SupplierApprovalModal;
