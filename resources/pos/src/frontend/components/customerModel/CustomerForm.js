import React, { useState, useEffect, useRef } from 'react';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import { connect, useDispatch } from 'react-redux';
import * as EmailValidator from 'email-validator';
import { numValidate } from '../../../shared/sharedMethod';
import { editCustomer } from '../../../store/action/customerAction';
import { addCustomer } from '../../../store/action/pos/customerAction';
import { addToast } from '../../../store/action/toastAction';

const CustomerForm = (props) => {
    const { show, hide, singleCustomer, addCustomer, customers, setSelectedCustomerOption } = props;
    const dispatch = useDispatch();

    const phoneRef = useRef(null);
    const nameRef = useRef(null);

    const [customerValue, setCustomerValue] = useState({
        name: singleCustomer ? singleCustomer[0].name : '',
        email: singleCustomer ? singleCustomer[0].email : '',
        phone: singleCustomer ? singleCustomer[0].phone : '',
        country: singleCustomer ? singleCustomer[0].country : '',
        city: singleCustomer ? singleCustomer[0].city : '',
        address: singleCustomer ? singleCustomer[0].address : '',
    });

    const [existingCustomer, setExistingCustomer] = useState(null);
    const [errors, setErrors] = useState({ name: '', phone: '' });

    // Auto focus phone input on modal open
    useEffect(() => {
        if (show) {
            setTimeout(() => {
                if (phoneRef.current) phoneRef.current.focus();
            }, 150);
        }
    }, [show]);

    // Live search for existing customer by phone number
    const handlePhoneChange = (e) => {
        const val = e.target.value;
        setCustomerValue((prev) => ({ ...prev, phone: val }));
        setErrors((prev) => ({ ...prev, phone: '' }));

        if (val && val.length >= 7 && customers && customers.length > 0) {
            const cleanVal = val.trim();
            const found = customers.find((c) => {
                const p = c.attributes ? c.attributes.phone : c.phone;
                return p && p.toString().replace(/\D/g, '').includes(cleanVal.replace(/\D/g, ''));
            });

            if (found) {
                setExistingCustomer(found);
                const name = found.attributes ? found.attributes.name : found.name;
                setCustomerValue((prev) => ({ ...prev, name: name }));
            } else {
                setExistingCustomer(null);
            }
        } else {
            setExistingCustomer(null);
        }
    };

    // Use found existing customer immediately
    const handleUseExistingCustomer = () => {
        if (!existingCustomer) return;
        const custId = existingCustomer.id;
        const custName = existingCustomer.attributes ? existingCustomer.attributes.name : existingCustomer.name;

        if (setSelectedCustomerOption) {
            setSelectedCustomerOption({
                value: custId,
                label: custName,
            });
        }
        dispatch(addToast({ text: `✓ Switched to existing customer: ${custName}` }));
        hide(false);
    };

    // Keyboard Shortcuts (Ctrl+S save, Esc close)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                handleSubmit();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                hide(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [customerValue, existingCustomer]);

    const onChangeInput = (e) => {
        e.preventDefault();
        setCustomerValue((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    };

    const handleValidation = () => {
        let errs = {};
        let isValid = true;

        if (!customerValue.phone.trim()) {
            errs.phone = 'Mobile number is required';
            isValid = false;
        }

        if (!customerValue.name.trim()) {
            errs.name = 'Customer name is required';
            isValid = false;
        }

        setErrors(errs);
        return isValid;
    };

    const handleSubmit = (e) => {
        if (e) e.preventDefault();

        // If an existing customer was matched, select them instantly!
        if (existingCustomer) {
            handleUseExistingCustomer();
            return;
        }

        if (!handleValidation()) return;

        // Auto fallback for optional fields so API validation passes
        const payload = {
            name: customerValue.name,
            phone: customerValue.phone,
            email: customerValue.email || `${customerValue.phone}@pos.com`,
            country: customerValue.country || 'India',
            city: customerValue.city || 'City',
            address: customerValue.address || 'Address',
        };

        addCustomer(payload, hide, setSelectedCustomerOption);
    };

    // Calculate Initials for Avatar
    const getInitials = (nameStr) => {
        if (!nameStr) return 'NK';
        const parts = nameStr.trim().split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return nameStr.substring(0, 2).toUpperCase();
    };

    return (
        <Modal
            show={show}
            onHide={() => hide(false)}
            className="pos-modal pos-customer-modal"
            centered
        >
            {/* Header */}
            <Modal.Header closeButton>
                <div>
                    <Modal.Title style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                        Customer Selection & Onboarding
                    </Modal.Title>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                        Search by mobile number or add a new customer
                    </div>
                </div>
                <div className="d-flex align-items-center gap-2 me-4">
                    <span className="badge bg-light text-secondary border fw-bold px-2 py-1" style={{ fontSize: '10px' }}>
                        ESC
                    </span>
                </div>
            </Modal.Header>

            {/* Body */}
            <Modal.Body>
                <div className="row g-4">

                    {/* ── LEFT FORM PANEL (65%) ── */}
                    <div className="col-lg-7 col-12">
                        <Form onSubmit={handleSubmit}>

                            {/* Existing Customer Detected Alert Banner */}
                            {existingCustomer && (
                                <div className="p-3 mb-3 border rounded-3 bg-success bg-opacity-10 border-success" style={{ background: '#F0FDF4', borderColor: '#86EFAC' }}>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div className="d-flex align-items-center gap-2">
                                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                                                ✓
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#15803D' }}>
                                                    Existing Customer Found!
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#166534', fontWeight: 600 }}>
                                                    {existingCustomer.attributes ? existingCustomer.attributes.name : existingCustomer.name} (+91 {customerValue.phone})
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            className="btn btn-sm btn-success fw-bold px-3 py-1 border-0"
                                            style={{ background: '#16A34A', borderRadius: '8px', fontSize: '12px' }}
                                            onClick={handleUseExistingCustomer}
                                        >
                                            ⚡ Select Customer
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Mobile Number & Customer Name Inputs */}
                            <div className="row g-3 mb-3">
                                <div className="col-12">
                                    <label className="pos-input-label">
                                        Mobile Number <span className="text-danger">*</span>
                                    </label>
                                    <div className="pos-input-group">
                                        <i className="bi bi-telephone" />
                                        <Form.Control
                                            ref={phoneRef}
                                            type="text"
                                            name="phone"
                                            pattern="[0-9]*"
                                            maxLength="10"
                                            placeholder="Enter 10 digit mobile number (e.g. 9876543210)"
                                            value={customerValue.phone}
                                            onKeyPress={(e) => numValidate(e)}
                                            onChange={handlePhoneChange}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    if (existingCustomer) {
                                                        handleUseExistingCustomer();
                                                    } else if (nameRef.current) {
                                                        nameRef.current.focus();
                                                    }
                                                }
                                            }}
                                            className={`pos-input-control ${existingCustomer ? 'border-success' : ''}`}
                                            style={{ fontSize: '15px', fontWeight: 700 }}
                                        />
                                        {existingCustomer && (
                                            <i className="bi bi-check-circle-fill pos-input-success-icon" style={{ fontSize: '20px' }} />
                                        )}
                                    </div>
                                    <div className="d-flex justify-content-between mt-1">
                                        <span style={{ fontSize: '10px', color: '#64748B' }}>Auto-checks database for existing customers</span>
                                        {existingCustomer && (
                                            <span style={{ fontSize: '10px', color: '#16A34A', fontWeight: 800 }}>✓ Customer Already Exists</span>
                                        )}
                                    </div>
                                    {errors.phone && <span className="text-danger fw-semibold mt-1 d-block" style={{ fontSize: '11px' }}>{errors.phone}</span>}
                                </div>

                                <div className="col-12">
                                    <label className="pos-input-label">
                                        Customer Name <span className="text-danger">*</span>
                                    </label>
                                    <div className="pos-input-group">
                                        <i className="bi bi-person" />
                                        <Form.Control
                                            ref={nameRef}
                                            type="text"
                                            name="name"
                                            placeholder="Enter customer full name"
                                            value={customerValue.name}
                                            onChange={onChangeInput}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleSubmit();
                                                }
                                            }}
                                            className="pos-input-control"
                                            style={{ fontSize: '15px', fontWeight: 700 }}
                                        />
                                    </div>
                                    {errors.name && <span className="text-danger fw-semibold mt-1 d-block" style={{ fontSize: '11px' }}>{errors.name}</span>}
                                </div>
                            </div>

                            {/* Optional Details Collapsible / Simple Row */}
                            <div className="p-3 border rounded-3 bg-light mb-3">
                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                                    Optional Details (Auto-filled if left empty)
                                </div>
                                <div className="row g-2">
                                    <div className="col-6">
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="Email (Optional)"
                                            value={customerValue.email}
                                            onChange={onChangeInput}
                                            className="form-control form-control-sm bg-white"
                                            style={{ fontSize: '11px' }}
                                        />
                                    </div>
                                    <div className="col-6">
                                        <input
                                            type="text"
                                            name="city"
                                            placeholder="City (Optional)"
                                            value={customerValue.city}
                                            onChange={onChangeInput}
                                            className="form-control form-control-sm bg-white"
                                            style={{ fontSize: '11px' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Helper Tip Bar */}
                            <div className="d-flex align-items-center justify-content-between p-2 rounded-3 bg-light border">
                                <span style={{ fontSize: '11px', color: '#475569' }}>
                                    💡 <strong>Tip:</strong> Type phone → Auto-fills name if existing → Press <strong>Enter</strong> to select!
                                </span>
                            </div>

                        </Form>
                    </div>

                    {/* ── RIGHT PREVIEW PANEL (35%) ── */}
                    <div className="col-lg-5 col-12">
                        <div className="customer-preview-card">
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                                Selected Customer Preview
                            </div>

                            {/* Avatar */}
                            <div className="customer-preview-avatar">
                                {getInitials(customerValue.name)}
                            </div>

                            {/* Name */}
                            <div className="customer-preview-name">
                                {customerValue.name || 'Walk-in Customer'}
                            </div>

                            {/* Type Badge */}
                            <div className="customer-preview-badge">
                                {existingCustomer ? 'Existing Member' : 'New Customer'}
                            </div>

                            {/* Phone */}
                            <div className="customer-preview-phone">
                                {customerValue.phone ? `+91 ${customerValue.phone}` : '+91 00000 00000'}
                            </div>

                            {/* Details List */}
                            <div className="preview-details-list">
                                <div className="preview-detail-row">
                                    <span>⭐ Loyalty Points</span>
                                    <span>0</span>
                                </div>
                                <div className="preview-detail-row">
                                    <span>💼 Wallet Balance</span>
                                    <span>₹ 0.00</span>
                                </div>
                                <div className="preview-detail-row">
                                    <span>📅 Member Status</span>
                                    <span style={{ color: existingCustomer ? '#16A34A' : '#2563EB', fontWeight: 700 }}>
                                        {existingCustomer ? 'Active Member' : 'New Creation'}
                                    </span>
                                </div>
                            </div>

                            {/* Action Summary */}
                            <div className="loyalty-benefit-box">
                                <div className="loyalty-benefit-title">
                                    <i className="bi bi-person-check-fill" /> Active Billing Customer
                                </div>
                                <div className="loyalty-benefit-item">
                                    {existingCustomer
                                        ? `✓ Ready to switch POS to ${existingCustomer.attributes ? existingCustomer.attributes.name : existingCustomer.name}`
                                        : '✓ Saving will automatically assign this customer to current POS bill'}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </Modal.Body>

            {/* Footer */}
            <Modal.Footer>
                <button
                    type="button"
                    className="btn btn-light border fw-bold d-flex align-items-center gap-1"
                    style={{ borderRadius: '10px', height: '40px', fontSize: '13px' }}
                    onClick={() => hide(false)}
                >
                    Cancel <span className="badge bg-secondary text-white ms-1" style={{ fontSize: '9px' }}>ESC</span>
                </button>

                <div className="text-end">
                    <button
                        type="button"
                        className="btn btn-success fw-bold px-4 d-inline-flex align-items-center gap-2 border-0"
                        style={{ background: '#16A34A', borderRadius: '10px', height: '40px', fontSize: '14px', boxShadow: '0 4px 14px rgba(22,163,74,0.3)' }}
                        onClick={handleSubmit}
                    >
                        {existingCustomer ? '⚡ Select Customer & Continue' : 'Save & Continue Billing'}
                        <span className="badge bg-white text-success ms-1" style={{ fontSize: '10px' }}>Ctrl + S</span>
                    </button>
                    <div style={{ fontSize: '9px', color: '#64748B', marginTop: '2px' }}>
                        {existingCustomer ? 'Switches POS customer immediately' : 'Creates customer & assigns to POS bill'}
                    </div>
                </div>
            </Modal.Footer>
        </Modal>
    );
};

const mapStateToProps = (state) => {
    return {
        customers: state.customers,
    };
};

export default connect(mapStateToProps, { editCustomer, addCustomer })(CustomerForm);
