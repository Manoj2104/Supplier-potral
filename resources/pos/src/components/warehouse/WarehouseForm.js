import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { connect } from 'react-redux';
import * as EmailValidator from 'email-validator';
import { getFormattedMessage, numValidate } from '../../shared/sharedMethod';
import { editWarehouse } from '../../store/action/warehouseAction';
import './WarehouseFormSimple.css';

const WarehouseForm = (props) => {
    const { addWarehouseData, id, editWarehouse, singleWarehouse } = props;
    const navigate = useNavigate();

    const [currentStep, setCurrentStep] = useState(1);

    const [warehouseValue, setWarehouseValue] = useState({
        name: singleWarehouse ? singleWarehouse[0].name : '',
        email: singleWarehouse ? singleWarehouse[0].email : '',
        phone: singleWarehouse ? singleWarehouse[0].phone : '',
        country: singleWarehouse ? singleWarehouse[0].country : '',
        city: singleWarehouse ? singleWarehouse[0].city : '',
        zip_code: singleWarehouse ? singleWarehouse[0].zip_code : '',
        address1: '',
        address2: '',
    });

    const [errors, setErrors] = useState({});

    const onChangeInput = (e) => {
        const { name, value } = e.target;
        setWarehouseValue(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validateStep1 = () => {
        let errs = {};
        let isValid = true;

        if (!warehouseValue.name.trim()) {
            errs.name = 'Warehouse name is required';
            isValid = false;
        }
        if (!warehouseValue.email.trim()) {
            errs.email = 'Email address is required';
            isValid = false;
        } else if (!EmailValidator.validate(warehouseValue.email)) {
            errs.email = 'Please enter a valid email address';
            isValid = false;
        }
        if (!warehouseValue.phone.toString().trim()) {
            errs.phone = 'Phone number is required';
            isValid = false;
        }
        if (!warehouseValue.zip_code.toString().trim()) {
            errs.zip_code = 'Zip code is required';
            isValid = false;
        }

        setErrors(errs);
        return isValid;
    };

    const validateStep2 = () => {
        let errs = {};
        let isValid = true;

        if (!warehouseValue.country.trim()) {
            errs.country = 'Country is required';
            isValid = false;
        }
        if (!warehouseValue.city.trim()) {
            errs.city = 'City is required';
            isValid = false;
        }

        setErrors(prev => ({ ...prev, ...errs }));
        return isValid;
    };

    const handleNext = () => {
        if (currentStep === 1) {
            if (validateStep1()) {
                setCurrentStep(2);
            }
        }
    };

    const handlePrev = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const onSubmit = (event) => {
        event.preventDefault();
        const valid1 = validateStep1();
        const valid2 = validateStep2();

        if (valid1 && valid2) {
            const dataToSubmit = {
                name: warehouseValue.name,
                email: warehouseValue.email,
                phone: warehouseValue.phone,
                country: warehouseValue.country,
                city: warehouseValue.city,
                zip_code: warehouseValue.zip_code,
            };

            if (singleWarehouse) {
                editWarehouse(id, dataToSubmit, navigate);
            } else if (addWarehouseData) {
                addWarehouseData(dataToSubmit);
            }
        } else if (!valid1) {
            setCurrentStep(1);
        }
    };

    return (
        <div className="wh-form-card">
            {/* Stepper Progress Header */}
            <div className="wh-stepper-head">
                <div
                    className={`wh-step-item ${currentStep === 1 ? 'active' : 'completed'}`}
                    onClick={() => setCurrentStep(1)}
                >
                    <div className="wh-step-num">{currentStep > 1 ? '✓' : '1'}</div>
                    <div>
                        <div className="wh-step-title">Warehouse Details</div>
                        <div className="wh-step-sub">Basic Info &amp; Contact</div>
                    </div>
                </div>

                <div className="wh-step-line" />

                <div
                    className={`wh-step-item ${currentStep === 2 ? 'active' : ''}`}
                    onClick={() => { if (validateStep1()) setCurrentStep(2); }}
                >
                    <div className="wh-step-num">2</div>
                    <div>
                        <div className="wh-step-title">Location Details</div>
                        <div className="wh-step-sub">Country, City &amp; Address</div>
                    </div>
                </div>
            </div>

            <form onSubmit={onSubmit}>
                {/* Header Title Banner */}
                <div className="wh-form-header">
                    <div className="wh-form-icon-avatar">
                        🏢
                    </div>
                    <div className="wh-form-title-wrap">
                        <h2>
                            {currentStep === 1 ? (singleWarehouse ? 'Edit Warehouse Details' : 'Step 1: Warehouse Details') : 'Step 2: Location Details'}
                        </h2>
                        <p>
                            {currentStep === 1
                                ? 'Fill in the warehouse name, contact email, phone, and zip code.'
                                : 'Select country, city, and enter street address details.'}
                        </p>
                    </div>
                </div>

                {/* Form Body */}
                <div className="wh-form-body">
                    {/* STEP 1: Warehouse Basic Info */}
                    {currentStep === 1 && (
                        <div className="wh-form-grid">
                            <div className="wh-field wh-field-full">
                                <label className="wh-label">
                                    Warehouse Name <span className="req">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={warehouseValue.name}
                                    placeholder="Enter warehouse name (e.g. Main Warehouse, City Depot)"
                                    className={`wh-input ${errors.name ? 'is-invalid' : ''}`}
                                    onChange={onChangeInput}
                                    autoFocus
                                />
                                {errors.name && <span className="wh-err-msg">{errors.name}</span>}
                            </div>

                            <div className="wh-field">
                                <label className="wh-label">
                                    Email Address <span className="req">*</span>
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={warehouseValue.email}
                                    placeholder="warehouse@example.com"
                                    className={`wh-input ${errors.email ? 'is-invalid' : ''}`}
                                    onChange={onChangeInput}
                                />
                                {errors.email && <span className="wh-err-msg">{errors.email}</span>}
                            </div>

                            <div className="wh-field">
                                <label className="wh-label">
                                    Phone Number <span className="req">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={warehouseValue.phone}
                                    placeholder="Enter phone number"
                                    className={`wh-input ${errors.phone ? 'is-invalid' : ''}`}
                                    onKeyPress={numValidate}
                                    onChange={onChangeInput}
                                />
                                {errors.phone && <span className="wh-err-msg">{errors.phone}</span>}
                            </div>

                            <div className="wh-field wh-field-full">
                                <label className="wh-label">
                                    Zip / Postal Code <span className="req">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="zip_code"
                                    value={warehouseValue.zip_code}
                                    placeholder="Enter Zip / Postal code"
                                    className={`wh-input ${errors.zip_code ? 'is-invalid' : ''}`}
                                    onKeyPress={numValidate}
                                    onChange={onChangeInput}
                                />
                                {errors.zip_code && <span className="wh-err-msg">{errors.zip_code}</span>}
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Location Details */}
                    {currentStep === 2 && (
                        <div className="wh-form-grid">
                            <div className="wh-field">
                                <label className="wh-label">
                                    Country <span className="req">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="country"
                                    value={warehouseValue.country}
                                    placeholder="Enter Country (e.g. India, USA)"
                                    className={`wh-input ${errors.country ? 'is-invalid' : ''}`}
                                    onChange={onChangeInput}
                                    autoFocus
                                />
                                {errors.country && <span className="wh-err-msg">{errors.country}</span>}
                            </div>

                            <div className="wh-field">
                                <label className="wh-label">
                                    City <span className="req">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="city"
                                    value={warehouseValue.city}
                                    placeholder="Enter City (e.g. Chennai, Bangalore)"
                                    className={`wh-input ${errors.city ? 'is-invalid' : ''}`}
                                    onChange={onChangeInput}
                                />
                                {errors.city && <span className="wh-err-msg">{errors.city}</span>}
                            </div>

                            <div className="wh-field wh-field-full">
                                <label className="wh-label">Address Line 1</label>
                                <input
                                    type="text"
                                    name="address1"
                                    value={warehouseValue.address1}
                                    placeholder="Street Address, Building Name, Door No."
                                    className="wh-input"
                                    onChange={onChangeInput}
                                />
                            </div>

                            <div className="wh-field wh-field-full">
                                <label className="wh-label">Address Line 2 / Landmark</label>
                                <input
                                    type="text"
                                    name="address2"
                                    value={warehouseValue.address2}
                                    placeholder="Area, Landmark, Suite"
                                    className="wh-input"
                                    onChange={onChangeInput}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="wh-form-footer">
                    <div>
                        {currentStep > 1 ? (
                            <button type="button" className="btn-wh-cancel" onClick={handlePrev}>
                                ← Previous Step
                            </button>
                        ) : (
                            <Link to="/app/warehouse" className="btn-wh-cancel">
                                Cancel
                            </Link>
                        )}
                    </div>

                    <div>
                        {currentStep < 2 ? (
                            <button type="button" className="btn-wh-next" onClick={handleNext}>
                                Next Step: Location Details ➔
                            </button>
                        ) : (
                            <button type="submit" className="btn-wh-save">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                {singleWarehouse ? 'Update Warehouse' : 'Save Warehouse'}
                            </button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
};

export default connect(null, { editWarehouse })(WarehouseForm);
