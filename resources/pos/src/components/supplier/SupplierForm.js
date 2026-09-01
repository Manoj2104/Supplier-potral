import React, { useState } from 'react';
import { connect } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import * as EmailValidator from 'email-validator';
import { editSupplier } from '../../store/action/supplierAction';
import { getFormattedMessage } from '../../shared/sharedMethod';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft,
    faCheck,
    faBuilding,
    faUserTie,
    faLocationDot,
    faBuildingColumns,
    faHandshake,
    faFileSignature,
} from '@fortawesome/free-solid-svg-icons';
import './SuppliersPremium.css';

const SupplierForm = (props) => {
    const { addSupplierData, id, editSupplier, singleSupplier } = props;
    const navigate = useNavigate();

    // ── Form State ─────────────────────────────────────────────────────────────
    const [supplierValue, setSupplierValue] = useState({
        // Core fields
        name: singleSupplier ? singleSupplier[0].name : '',
        email: singleSupplier ? singleSupplier[0].email : '',
        phone: singleSupplier ? singleSupplier[0].phone : '',
        country: singleSupplier ? (singleSupplier[0].country || 'India') : 'India',
        city: singleSupplier ? singleSupplier[0].city : '',
        address: singleSupplier ? singleSupplier[0].address : '',

        // Business & Tax Info
        businessType: 'Wholesaler',
        supplierCategory: 'General Goods',
        gstNumber: '',
        panNumber: '',
        status: 'Active',
        isPreferred: true,

        // Contact Info
        contactPerson: '',
        altMobile: '',
        whatsapp: '',
        website: '',

        // Address Details
        state: 'Tamil Nadu',
        pincode: '',
        addressLine2: '',

        // Commercial & Payment Terms
        creditLimit: '500000.00',
        paymentTerms: '30 Days',
        currency: 'INR',
        openingBalance: '0.00',
        discount: '0.00',
        deliveryDays: '3',

        // Bank Details
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        branch: '',
        upiId: '',
        chequeName: '',

        // Notes
        internalNotes: '',
        remarks: '',
    });

    const [errors, setErrors] = useState({
        name: '',
        email: '',
        phone: '',
        country: '',
        city: '',
        address: ''
    });

    // ── Real-time Validation ──────────────────────────────────────────────────
    const handleValidation = () => {
        let errs = {};
        let isValid = true;

        if (!supplierValue.name.trim()) {
            errs.name = getFormattedMessage("globally.input.name.validate.label") || "Supplier name is required";
            isValid = false;
        }

        if (!supplierValue.email.trim()) {
            errs.email = getFormattedMessage("globally.input.email.validate.label") || "Email address is required";
            isValid = false;
        } else if (!EmailValidator.validate(supplierValue.email.trim())) {
            errs.email = getFormattedMessage("globally.input.email.valid.validate.label") || "Please enter a valid email address";
            isValid = false;
        }

        if (!supplierValue.phone.trim()) {
            errs.phone = getFormattedMessage("globally.input.phone-number.validate.label") || "Phone number is required";
            isValid = false;
        }

        if (!supplierValue.country.trim()) {
            errs.country = getFormattedMessage("globally.input.country.validate.label") || "Country is required";
            isValid = false;
        }

        if (!supplierValue.city.trim()) {
            errs.city = getFormattedMessage("globally.input.city.validate.label") || "City is required";
            isValid = false;
        }

        if (!supplierValue.address.trim()) {
            errs.address = getFormattedMessage("globally.input.address.validate.label") || "Address is required";
            isValid = false;
        }

        setErrors(errs);
        return isValid;
    };

    const onChangeInput = (e) => {
        const { name, value, type, checked } = e.target;
        setSupplierValue(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const onSubmit = (e) => {
        if (e) e.preventDefault();
        if (!handleValidation()) return;

        const payload = {
            name: supplierValue.name.trim(),
            email: supplierValue.email.trim(),
            phone: supplierValue.phone.trim(),
            country: supplierValue.country.trim(),
            city: supplierValue.city.trim(),
            address: supplierValue.address.trim(),
            // Pass extended fields if supported by backend API
            postal_code: supplierValue.pincode,
            state: supplierValue.state,
            tax_number: supplierValue.gstNumber,
            pan: supplierValue.panNumber,
            bank_name: supplierValue.bankName,
            account_number: supplierValue.accountNumber,
            ifsc_code: supplierValue.ifscCode,
            branch: supplierValue.branch,
            notes: supplierValue.internalNotes || supplierValue.remarks || ''
        };

        if (singleSupplier) {
            editSupplier(id, payload, navigate);
        } else if (addSupplierData) {
            addSupplierData(payload);
        }
    };

    return (
        <div className="sup-create-page">
            {/* ── Breadcrumb ── */}
            <div className="brand-breadcrumb">
                <span>Dashboard</span>
                <span>&gt;</span>
                <Link to="/app/purchases" style={{ color: '#64748B', textDecoration: 'none' }}>Purchases</Link>
                <span>&gt;</span>
                <Link to="/app/suppliers" style={{ color: '#64748B', textDecoration: 'none' }}>Suppliers</Link>
                <span>&gt;</span>
                <span className="brand-crumb-active">{singleSupplier ? 'Edit' : 'Create'}</span>
            </div>

            <div className="create-fullpage-container">

                {/* ── Header Bar ── */}
                <div className="create-form-header">
                    <div className="d-flex align-items-center gap-3">
                        <Link to="/app/suppliers" className="brand-btn-pill">
                            <FontAwesomeIcon icon={faArrowLeft} /> Back to Suppliers
                        </Link>
                        <div>
                            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', margin: 0, lineHeight: '1.2' }}>
                                {singleSupplier ? 'Edit Supplier' : 'Create Supplier'}
                            </h2>
                            <p style={{ fontSize: '13.5px', color: '#64748B', margin: '2px 0 0 0' }}>
                                Manage supplier profile, contact information, commercial terms, and banking details
                            </p>
                        </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <button type="button" className="brand-btn-pill" onClick={() => navigate('/app/suppliers')}>
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="brand-btn-pill brand-btn-primary"
                            onClick={onSubmit}
                        >
                            <FontAwesomeIcon icon={faCheck} /> {singleSupplier ? 'Save Changes' : 'Save Supplier'}
                        </button>
                    </div>
                </div>

                {/* ── Form Body ── */}
                <div className="create-form-body">
                    <form onSubmit={onSubmit}>

                        {/* Section 1: Basic & Business Information */}
                        <div className="create-card-section">
                            <div className="create-section-header">
                                <div className="create-section-icon green">
                                    <FontAwesomeIcon icon={faBuilding} />
                                </div>
                                <div className="create-section-title">
                                    <h3>Basic & Business Information</h3>
                                    <p>Enter vendor company name, business classification, and tax registration details</p>
                                </div>
                            </div>

                            <div className="row g-4">
                                <div className="col-md-6">
                                    <label className="form-label">
                                        Supplier / Company Name <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        className="form-control"
                                        placeholder="e.g. Apex Appliance Pvt Ltd"
                                        value={supplierValue.name}
                                        onChange={onChangeInput}
                                    />
                                    {errors.name && <span className="text-danger d-block fw-400 fs-small mt-1">{errors.name}</span>}
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label">Business Type</label>
                                    <select
                                        name="businessType"
                                        className="form-select"
                                        value={supplierValue.businessType}
                                        onChange={onChangeInput}
                                    >
                                        <option value="Manufacturer">Manufacturer</option>
                                        <option value="Wholesaler">Wholesaler</option>
                                        <option value="Distributor">Distributor</option>
                                        <option value="Direct Importer">Direct Importer</option>
                                        <option value="Trader">Trader</option>
                                        <option value="Service Provider">Service Provider</option>
                                    </select>
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label">Supplier Category</label>
                                    <select
                                        name="supplierCategory"
                                        className="form-select"
                                        value={supplierValue.supplierCategory}
                                        onChange={onChangeInput}
                                    >
                                        <option value="Electronics & Appliances">Electronics & Appliances</option>
                                        <option value="Home & Kitchen">Home & Kitchen</option>
                                        <option value="FMCG & Groceries">FMCG & Groceries</option>
                                        <option value="Hardware & Tools">Hardware & Tools</option>
                                        <option value="Raw Materials">Raw Materials</option>
                                        <option value="General Goods">General Goods</option>
                                    </select>
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">GSTIN / Tax Number</label>
                                    <input
                                        type="text"
                                        name="gstNumber"
                                        className="form-control"
                                        placeholder="e.g. 33AAACN1234C1Z5"
                                        value={supplierValue.gstNumber}
                                        onChange={onChangeInput}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">PAN Number</label>
                                    <input
                                        type="text"
                                        name="panNumber"
                                        className="form-control"
                                        placeholder="e.g. AAACN1234C"
                                        value={supplierValue.panNumber}
                                        onChange={onChangeInput}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">Supplier Status</label>
                                    <div className="d-flex align-items-center gap-4 mt-2">
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="status"
                                                id="statusActive"
                                                value="Active"
                                                checked={supplierValue.status === 'Active'}
                                                onChange={onChangeInput}
                                            />
                                            <label className="form-check-label fw-bold text-success" htmlFor="statusActive">
                                                Active
                                            </label>
                                        </div>
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="status"
                                                id="statusInactive"
                                                value="Inactive"
                                                checked={supplierValue.status === 'Inactive'}
                                                onChange={onChangeInput}
                                            />
                                            <label className="form-check-label fw-bold text-secondary" htmlFor="statusInactive">
                                                Inactive
                                            </label>
                                        </div>
                                        <div className="form-check ms-auto">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                name="isPreferred"
                                                id="isPreferred"
                                                checked={supplierValue.isPreferred}
                                                onChange={onChangeInput}
                                            />
                                            <label className="form-check-label fw-bold text-dark" htmlFor="isPreferred">
                                                Preferred Vendor
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Contact Information */}
                        <div className="create-card-section">
                            <div className="create-section-header">
                                <div className="create-section-icon blue">
                                    <FontAwesomeIcon icon={faUserTie} />
                                </div>
                                <div className="create-section-title">
                                    <h3>Contact Information</h3>
                                    <p>Primary contact point, phone numbers, and digital communication channels</p>
                                </div>
                            </div>

                            <div className="row g-4">
                                <div className="col-md-4">
                                    <label className="form-label">Primary Contact Person</label>
                                    <input
                                        type="text"
                                        name="contactPerson"
                                        className="form-control"
                                        placeholder="e.g. Rajesh Kumar (Sales Head)"
                                        value={supplierValue.contactPerson}
                                        onChange={onChangeInput}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">
                                        Primary Phone / Mobile <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="phone"
                                        className="form-control"
                                        placeholder="e.g. +91 98765 43210"
                                        value={supplierValue.phone}
                                        onChange={onChangeInput}
                                    />
                                    {errors.phone && <span className="text-danger d-block fw-400 fs-small mt-1">{errors.phone}</span>}
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">
                                        Email Address <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        className="form-control"
                                        placeholder="e.g. sales@apexappliance.com"
                                        value={supplierValue.email}
                                        onChange={onChangeInput}
                                    />
                                    {errors.email && <span className="text-danger d-block fw-400 fs-small mt-1">{errors.email}</span>}
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">Alternate Phone / Office Landline</label>
                                    <input
                                        type="text"
                                        name="altMobile"
                                        className="form-control"
                                        placeholder="e.g. 0422-2598712"
                                        value={supplierValue.altMobile}
                                        onChange={onChangeInput}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">WhatsApp Number</label>
                                    <input
                                        type="text"
                                        name="whatsapp"
                                        className="form-control"
                                        placeholder="e.g. +91 98765 43210"
                                        value={supplierValue.whatsapp}
                                        onChange={onChangeInput}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">Website</label>
                                    <input
                                        type="text"
                                        name="website"
                                        className="form-control"
                                        placeholder="e.g. https://www.apexappliance.com"
                                        value={supplierValue.website}
                                        onChange={onChangeInput}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Address & Location */}
                        <div className="create-card-section">
                            <div className="create-section-header">
                                <div className="create-section-icon orange">
                                    <FontAwesomeIcon icon={faLocationDot} />
                                </div>
                                <div className="create-section-title">
                                    <h3>Address & Depot Location</h3>
                                    <p>Billing and dispatch factory address for shipping logistics</p>
                                </div>
                            </div>

                            <div className="row g-4">
                                <div className="col-md-4">
                                    <label className="form-label">
                                        Country <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="country"
                                        className="form-control"
                                        placeholder="e.g. India"
                                        value={supplierValue.country}
                                        onChange={onChangeInput}
                                    />
                                    {errors.country && <span className="text-danger d-block fw-400 fs-small mt-1">{errors.country}</span>}
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">State / Province</label>
                                    <input
                                        type="text"
                                        name="state"
                                        className="form-control"
                                        placeholder="e.g. Tamil Nadu"
                                        value={supplierValue.state}
                                        onChange={onChangeInput}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">
                                        City <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="city"
                                        className="form-control"
                                        placeholder="e.g. Coimbatore"
                                        value={supplierValue.city}
                                        onChange={onChangeInput}
                                    />
                                    {errors.city && <span className="text-danger d-block fw-400 fs-small mt-1">{errors.city}</span>}
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label">Postal Code / Pincode</label>
                                    <input
                                        type="text"
                                        name="pincode"
                                        className="form-control"
                                        placeholder="e.g. 641021"
                                        value={supplierValue.pincode}
                                        onChange={onChangeInput}
                                    />
                                </div>

                                <div className="col-md-9">
                                    <label className="form-label">
                                        Street Address / Industrial Unit <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="address"
                                        className="form-control"
                                        placeholder="e.g. Plot No. 42, SIDCO Industrial Estate, Avinashi Road"
                                        value={supplierValue.address}
                                        onChange={onChangeInput}
                                    />
                                    {errors.address && <span className="text-danger d-block fw-400 fs-small mt-1">{errors.address}</span>}
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Commercial & Payment Terms */}
                        <div className="create-card-section">
                            <div className="create-section-header">
                                <div className="create-section-icon blue">
                                    <FontAwesomeIcon icon={faHandshake} />
                                </div>
                                <div className="create-section-title">
                                    <h3>Commercial & Payment Terms</h3>
                                    <p>Credit limits, settlement days, opening balance, and agreed supplier discounts</p>
                                </div>
                            </div>

                            <div className="row g-4">
                                <div className="col-md-4">
                                    <label className="form-label">Credit Limit (₹)</label>
                                    <input
                                        type="text"
                                        name="creditLimit"
                                        className="form-control font-monospace"
                                        placeholder="500000.00"
                                        value={supplierValue.creditLimit}
                                        onChange={onChangeInput}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">Payment Terms</label>
                                    <select
                                        name="paymentTerms"
                                        className="form-select"
                                        value={supplierValue.paymentTerms}
                                        onChange={onChangeInput}
                                    >
                                        <option value="Immediate / COD">Immediate / Cash on Delivery</option>
                                        <option value="15 Days">Net 15 Days</option>
                                        <option value="30 Days">Net 30 Days</option>
                                        <option value="45 Days">Net 45 Days</option>
                                        <option value="60 Days">Net 60 Days</option>
                                        <option value="100% Advance">100% Advance</option>
                                    </select>
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">Opening Balance (₹)</label>
                                    <input
                                        type="text"
                                        name="openingBalance"
                                        className="form-control font-monospace"
                                        placeholder="0.00"
                                        value={supplierValue.openingBalance}
                                        onChange={onChangeInput}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">Standard Agreed Discount (%)</label>
                                    <input
                                        type="text"
                                        name="discount"
                                        className="form-control"
                                        placeholder="e.g. 2.5"
                                        value={supplierValue.discount}
                                        onChange={onChangeInput}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">Expected Lead Time (Days)</label>
                                    <input
                                        type="text"
                                        name="deliveryDays"
                                        className="form-control"
                                        placeholder="e.g. 3 to 5"
                                        value={supplierValue.deliveryDays}
                                        onChange={onChangeInput}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">Base Currency</label>
                                    <select
                                        name="currency"
                                        className="form-select"
                                        value={supplierValue.currency}
                                        onChange={onChangeInput}
                                    >
                                        <option value="INR">INR (Indian Rupee - ₹)</option>
                                        <option value="USD">USD (US Dollar - $)</option>
                                        <option value="EUR">EUR (Euro - €)</option>
                                        <option value="AED">AED (UAE Dirham)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Section 5: Bank & Settlement Details */}
                        <div className="create-card-section">
                            <div className="create-section-header">
                                <div className="create-section-icon green">
                                    <FontAwesomeIcon icon={faBuildingColumns} />
                                </div>
                                <div className="create-section-title">
                                    <h3>Bank & Settlement Details</h3>
                                    <p>Official bank account info for vendor payouts, NEFT/RTGS, and UPI payments</p>
                                </div>
                            </div>

                            <div className="row g-4">
                                <div className="col-md-4">
                                    <label className="form-label">Bank Name</label>
                                    <input
                                        type="text"
                                        name="bankName"
                                        className="form-control"
                                        placeholder="e.g. HDFC Bank / State Bank of India"
                                        value={supplierValue.bankName}
                                        onChange={onChangeInput}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">Account Number</label>
                                    <input
                                        type="text"
                                        name="accountNumber"
                                        className="form-control font-monospace"
                                        placeholder="e.g. 50200012345678"
                                        value={supplierValue.accountNumber}
                                        onChange={onChangeInput}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">IFSC Code</label>
                                    <input
                                        type="text"
                                        name="ifscCode"
                                        className="form-control font-monospace"
                                        placeholder="e.g. HDFC0001234"
                                        value={supplierValue.ifscCode}
                                        onChange={onChangeInput}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">Branch Name</label>
                                    <input
                                        type="text"
                                        name="branch"
                                        className="form-control"
                                        placeholder="e.g. RS Puram Branch, Coimbatore"
                                        value={supplierValue.branch}
                                        onChange={onChangeInput}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">UPI ID / VPA</label>
                                    <input
                                        type="text"
                                        name="upiId"
                                        className="form-control"
                                        placeholder="e.g. apexappliance@hdfcbank"
                                        value={supplierValue.upiId}
                                        onChange={onChangeInput}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">Beneficiary / Cheque Name</label>
                                    <input
                                        type="text"
                                        name="chequeName"
                                        className="form-control"
                                        placeholder="e.g. Apex Appliance Private Limited"
                                        value={supplierValue.chequeName}
                                        onChange={onChangeInput}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 6: Notes & Remarks */}
                        <div className="create-card-section">
                            <div className="create-section-header">
                                <div className="create-section-icon purple">
                                    <FontAwesomeIcon icon={faFileSignature} />
                                </div>
                                <div className="create-section-title">
                                    <h3>Notes & Remarks</h3>
                                    <p>Internal procurement instructions, audit comments, or special vendor agreements</p>
                                </div>
                            </div>

                            <div>
                                <label className="form-label">Internal Procurement Remarks</label>
                                <textarea
                                    name="internalNotes"
                                    className="form-control"
                                    rows={3}
                                    placeholder="Add any internal remarks or delivery terms for this supplier..."
                                    value={supplierValue.internalNotes}
                                    onChange={onChangeInput}
                                    style={{ height: 'auto', borderRadius: '12px', resize: 'none', background: '#F8FAFC' }}
                                />
                                <div className="text-end text-muted fs-small mt-1">
                                    {(supplierValue.internalNotes || '').length} / 500
                                </div>
                            </div>
                        </div>

                        {/* Bottom Action Footer Bar */}
                        <div className="d-flex align-items-center justify-content-end pt-3 pb-2 flex-wrap gap-3">
                            <button type="button" className="brand-btn-pill" onClick={() => navigate('/app/suppliers')}>
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="brand-btn-pill brand-btn-primary"
                                onClick={onSubmit}
                            >
                                <FontAwesomeIcon icon={faCheck} /> {singleSupplier ? 'Save Changes' : 'Save Supplier'}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default connect(null, { editSupplier })(SupplierForm);
