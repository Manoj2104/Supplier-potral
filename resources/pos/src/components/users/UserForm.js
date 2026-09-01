import React, { useEffect, useState } from 'react';
import { connect, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import * as EmailValidator from 'email-validator';
import { editUser } from '../../store/action/userAction';
import { fetchAllRoles } from '../../store/action/roleAction';
import { getAvatarName, numValidate } from '../../shared/sharedMethod';
import './UserFormSimple.css';

const UserForm = (props) => {
    const { addUserData, id, singleUser, isEdit, isCreate, fetchAllRoles, roles } = props;
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [currentStep, setCurrentStep] = useState(1);

    const [userValue, setUserValue] = useState({
        first_name: singleUser ? singleUser[0].first_name : '',
        last_name: singleUser ? singleUser[0].last_name : '',
        email: singleUser ? singleUser[0].email : '',
        phone: singleUser ? singleUser[0].phone : '',
        password: '',
        confirm_password: '',
        role_id: singleUser && singleUser[0].role_id ? (singleUser[0].role_id.value ? singleUser[0].role_id.value[0] : singleUser[0].role_id) : '',
        image: singleUser ? singleUser[0].image : '',
        // Step 2: Address
        country: 'India',
        state: '',
        city: '',
        pincode: '',
        address1: '',
        address2: '',
        // Step 3: ID & Bank
        aadhaar_no: '',
        pan_no: '',
        bank_name: '',
        account_no: '',
        ifsc_code: '',
        branch_name: '',
    });

    const [errors, setErrors] = useState({});
    const [selectImg, setSelectImg] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(singleUser && singleUser[0].image ? singleUser[0].image : null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        fetchAllRoles();
    }, []);

    // Format DB roles into options
    const roleOptions = Array.isArray(roles) ? roles.map(role => ({
        id: role.id || role.value,
        name: role.display_name || role.name || (role.attributes ? role.attributes.name : '') || role.label
    })) : [];

    const onChangeInput = (e) => {
        const { name, value } = e.target;
        setUserValue(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleRoleChange = (e) => {
        const val = e.target.value;
        setUserValue(prev => ({ ...prev, role_id: val }));
        setErrors(prev => ({ ...prev, role_id: '' }));
    };

    const handleImageChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setSelectImg(file);
            const fileReader = new FileReader();
            fileReader.onloadend = () => {
                setImagePreviewUrl(fileReader.result);
            };
            fileReader.readAsDataURL(file);
            setErrors(prev => ({ ...prev, image: '' }));
        }
    };

    const validateStep1 = () => {
        let errs = {};
        let isValid = true;

        if (!userValue.first_name.trim()) {
            errs.first_name = 'First name is required';
            isValid = false;
        }
        if (!userValue.last_name.trim()) {
            errs.last_name = 'Last name is required';
            isValid = false;
        }
        if (!userValue.email.trim()) {
            errs.email = 'Email address is required';
            isValid = false;
        } else if (!EmailValidator.validate(userValue.email)) {
            errs.email = 'Please enter a valid email address';
            isValid = false;
        }
        if (!userValue.phone.toString().trim()) {
            errs.phone = 'Phone number is required';
            isValid = false;
        }
        if (!userValue.role_id) {
            errs.role_id = 'Please select a role';
            isValid = false;
        }

        if (!isEdit) {
            if (!userValue.password) {
                errs.password = 'Password is required';
                isValid = false;
            } else if (userValue.password.length < 6) {
                errs.password = 'Password must be at least 6 characters';
                isValid = false;
            }
            if (userValue.password !== userValue.confirm_password) {
                errs.confirm_password = 'Passwords do not match';
                isValid = false;
            }
        }

        setErrors(errs);
        return isValid;
    };

    const handleNext = () => {
        if (currentStep === 1) {
            if (validateStep1()) {
                setCurrentStep(2);
            }
        } else if (currentStep === 2) {
            setCurrentStep(3);
        }
    };

    const handlePrev = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const prepareFormData = (data) => {
        const formData = new FormData();
        formData.append('first_name', data.first_name);
        formData.append('last_name', data.last_name);
        formData.append('email', data.email);
        formData.append('phone', data.phone);
        if (!isEdit) {
            formData.append('password', data.password);
            formData.append('confirm_password', data.confirm_password);
        }
        formData.append('role_id', data.role_id);
        if (selectImg) {
            formData.append('image', selectImg);
        }
        return formData;
    };

    const onSubmit = (event) => {
        event.preventDefault();
        if (validateStep1()) {
            if (isEdit && singleUser) {
                dispatch(editUser(id, prepareFormData(userValue), navigate));
            } else if (addUserData) {
                addUserData(prepareFormData(userValue));
            }
        } else {
            setCurrentStep(1);
        }
    };

    const fullName = `${userValue.first_name} ${userValue.last_name}`.trim();
    const avatarName = getAvatarName(fullName || 'User');

    return (
        <div className="user-form-card">
            {/* Stepper Progress Bar */}
            <div className="user-stepper-head">
                <div
                    className={`user-step-item ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`}
                    onClick={() => setCurrentStep(1)}
                >
                    <div className="user-step-num">{currentStep > 1 ? '✓' : '1'}</div>
                    <div>
                        <div className="user-step-title">Account Details</div>
                        <div className="user-step-sub">Basic Info &amp; Role</div>
                    </div>
                </div>

                <div className="user-step-line" />

                <div
                    className={`user-step-item ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`}
                    onClick={() => { if (validateStep1()) setCurrentStep(2); }}
                >
                    <div className="user-step-num">{currentStep > 2 ? '✓' : '2'}</div>
                    <div>
                        <div className="user-step-title">Address Details</div>
                        <div className="user-step-sub">Location &amp; Address</div>
                    </div>
                </div>

                <div className="user-step-line" />

                <div
                    className={`user-step-item ${currentStep === 3 ? 'active' : ''}`}
                    onClick={() => { if (validateStep1()) setCurrentStep(3); }}
                >
                    <div className="user-step-num">3</div>
                    <div>
                        <div className="user-step-title">ID &amp; Bank Details</div>
                        <div className="user-step-sub">PAN, Aadhaar &amp; Bank</div>
                    </div>
                </div>
            </div>

            <form onSubmit={onSubmit}>
                {/* Header (Shows on all steps) */}
                <div className="user-form-header">
                    <div className="user-avatar-picker">
                        <div className="user-avatar-preview">
                            {imagePreviewUrl ? (
                                <img src={imagePreviewUrl} alt="User Avatar" />
                            ) : (
                                <span>{avatarName}</span>
                            )}
                        </div>
                        <label htmlFor="user-img-file" className="user-avatar-badge" title="Change Profile Picture">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                <circle cx="12" cy="13" r="4" />
                            </svg>
                        </label>
                        <input
                            id="user-img-file"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            style={{ display: 'none' }}
                            onChange={handleImageChange}
                        />
                    </div>
                    <div className="user-form-title-wrap">
                        <h2>
                            {currentStep === 1 && (isEdit ? 'Edit Account Info' : 'Step 1: Account Details')}
                            {currentStep === 2 && 'Step 2: Address Information'}
                            {currentStep === 3 && 'Step 3: Identity Proofs & Bank Details'}
                        </h2>
                        <p>
                            {currentStep === 1 && 'Fill in employee name, email, phone number and assigned role.'}
                            {currentStep === 2 && 'Enter residential address, city, state, and pincode.'}
                            {currentStep === 3 && 'Provide Aadhaar, PAN card, and Bank Account details for payroll.'}
                        </p>
                    </div>
                </div>

                {/* Form Body */}
                <div className="user-form-body">
                    {/* STEP 1: Account Details */}
                    {currentStep === 1 && (
                        <div className="user-form-grid">
                            <div className="user-field">
                                <label className="user-label">
                                    First Name <span className="req">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={userValue.first_name}
                                    placeholder="Enter first name"
                                    className={`user-input ${errors.first_name ? 'is-invalid' : ''}`}
                                    onChange={onChangeInput}
                                    autoFocus
                                />
                                {errors.first_name && <span className="user-err-msg">{errors.first_name}</span>}
                            </div>

                            <div className="user-field">
                                <label className="user-label">
                                    Last Name <span className="req">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={userValue.last_name}
                                    placeholder="Enter last name"
                                    className={`user-input ${errors.last_name ? 'is-invalid' : ''}`}
                                    onChange={onChangeInput}
                                />
                                {errors.last_name && <span className="user-err-msg">{errors.last_name}</span>}
                            </div>

                            <div className="user-field">
                                <label className="user-label">
                                    Email Address <span className="req">*</span>
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={userValue.email}
                                    placeholder="user@example.com"
                                    className={`user-input ${errors.email ? 'is-invalid' : ''}`}
                                    onChange={onChangeInput}
                                />
                                {errors.email && <span className="user-err-msg">{errors.email}</span>}
                            </div>

                            <div className="user-field">
                                <label className="user-label">
                                    Phone Number <span className="req">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={userValue.phone}
                                    placeholder="Enter phone number"
                                    className={`user-input ${errors.phone ? 'is-invalid' : ''}`}
                                    onKeyPress={numValidate}
                                    onChange={onChangeInput}
                                />
                                {errors.phone && <span className="user-err-msg">{errors.phone}</span>}
                            </div>

                            <div className="user-field user-field-full">
                                <label className="user-label">
                                    Role <span className="req">*</span>
                                </label>
                                <select
                                    name="role_id"
                                    value={userValue.role_id}
                                    className={`user-input ${errors.role_id ? 'is-invalid' : ''}`}
                                    onChange={handleRoleChange}
                                    style={{ cursor: 'pointer', fontWeight: '500' }}
                                >
                                    <option value="">Select a Role...</option>
                                    {roleOptions.map(r => (
                                        <option key={r.id} value={r.id}>
                                            {r.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.role_id && <span className="user-err-msg">{errors.role_id}</span>}
                            </div>

                            {!isEdit && (
                                <>
                                    <div className="user-field">
                                        <label className="user-label">
                                            Password <span className="req">*</span>
                                        </label>
                                        <div className="user-pw-group">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                name="password"
                                                value={userValue.password}
                                                placeholder="Enter password"
                                                className={`user-input ${errors.password ? 'is-invalid' : ''}`}
                                                onChange={onChangeInput}
                                            />
                                            <button
                                                type="button"
                                                className="user-pw-toggle"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    {showPassword ? (
                                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22" />
                                                    ) : (
                                                        <>
                                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                            <circle cx="12" cy="12" r="3" />
                                                        </>
                                                    )}
                                                </svg>
                                            </button>
                                        </div>
                                        {errors.password && <span className="user-err-msg">{errors.password}</span>}
                                    </div>

                                    <div className="user-field">
                                        <label className="user-label">
                                            Confirm Password <span className="req">*</span>
                                        </label>
                                        <div className="user-pw-group">
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                name="confirm_password"
                                                value={userValue.confirm_password}
                                                placeholder="Confirm password"
                                                className={`user-input ${errors.confirm_password ? 'is-invalid' : ''}`}
                                                onChange={onChangeInput}
                                            />
                                            <button
                                                type="button"
                                                className="user-pw-toggle"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    {showConfirmPassword ? (
                                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22" />
                                                    ) : (
                                                        <>
                                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                            <circle cx="12" cy="12" r="3" />
                                                        </>
                                                    )}
                                                </svg>
                                            </button>
                                        </div>
                                        {errors.confirm_password && <span className="user-err-msg">{errors.confirm_password}</span>}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* STEP 2: Address Information */}
                    {currentStep === 2 && (
                        <div className="user-form-grid">
                            <div className="user-field">
                                <label className="user-label">Country</label>
                                <select
                                    name="country"
                                    value={userValue.country}
                                    className="user-input"
                                    onChange={onChangeInput}
                                >
                                    <option value="India">India</option>
                                    <option value="United States">United States</option>
                                    <option value="United Kingdom">United Kingdom</option>
                                    <option value="UAE">United Arab Emirates</option>
                                </select>
                            </div>

                            <div className="user-field">
                                <label className="user-label">State</label>
                                <input
                                    type="text"
                                    name="state"
                                    value={userValue.state}
                                    placeholder="Enter State (e.g. Tamil Nadu)"
                                    className="user-input"
                                    onChange={onChangeInput}
                                />
                            </div>

                            <div className="user-field">
                                <label className="user-label">City</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={userValue.city}
                                    placeholder="Enter City (e.g. Chennai)"
                                    className="user-input"
                                    onChange={onChangeInput}
                                />
                            </div>

                            <div className="user-field">
                                <label className="user-label">Pincode</label>
                                <input
                                    type="text"
                                    name="pincode"
                                    value={userValue.pincode}
                                    placeholder="Enter Pincode"
                                    className="user-input"
                                    onKeyPress={numValidate}
                                    onChange={onChangeInput}
                                />
                            </div>

                            <div className="user-field user-field-full">
                                <label className="user-label">Address Line 1</label>
                                <input
                                    type="text"
                                    name="address1"
                                    value={userValue.address1}
                                    placeholder="Street Address, Door No., Building Name"
                                    className="user-input"
                                    onChange={onChangeInput}
                                />
                            </div>

                            <div className="user-field user-field-full">
                                <label className="user-label">Address Line 2 / Landmark</label>
                                <input
                                    type="text"
                                    name="address2"
                                    value={userValue.address2}
                                    placeholder="Area, Landmark, Suite or Apartment"
                                    className="user-input"
                                    onChange={onChangeInput}
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Identity & Bank Details */}
                    {currentStep === 3 && (
                        <div className="user-form-grid">
                            <div className="user-section-title">Identity Details</div>

                            <div className="user-field">
                                <label className="user-label">Aadhaar Card Number</label>
                                <input
                                    type="text"
                                    name="aadhaar_no"
                                    value={userValue.aadhaar_no}
                                    placeholder="XXXX XXXX XXXX (12 Digits)"
                                    className="user-input"
                                    maxLength={14}
                                    onChange={onChangeInput}
                                />
                            </div>

                            <div className="user-field">
                                <label className="user-label">PAN Card Number</label>
                                <input
                                    type="text"
                                    name="pan_no"
                                    value={userValue.pan_no}
                                    placeholder="ABCDE1234F (10 Characters)"
                                    className="user-input"
                                    maxLength={10}
                                    style={{ textTransform: 'uppercase' }}
                                    onChange={onChangeInput}
                                />
                            </div>

                            <div className="user-section-title" style={{ marginTop: '10px' }}>Bank &amp; Payment Details</div>

                            <div className="user-field">
                                <label className="user-label">Bank Name</label>
                                <input
                                    type="text"
                                    name="bank_name"
                                    value={userValue.bank_name}
                                    placeholder="e.g. HDFC Bank, SBI, ICICI"
                                    className="user-input"
                                    onChange={onChangeInput}
                                />
                            </div>

                            <div className="user-field">
                                <label className="user-label">Account Number</label>
                                <input
                                    type="text"
                                    name="account_no"
                                    value={userValue.account_no}
                                    placeholder="Enter Bank Account Number"
                                    className="user-input"
                                    onKeyPress={numValidate}
                                    onChange={onChangeInput}
                                />
                            </div>

                            <div className="user-field">
                                <label className="user-label">IFSC Code</label>
                                <input
                                    type="text"
                                    name="ifsc_code"
                                    value={userValue.ifsc_code}
                                    placeholder="e.g. HDFC0001234"
                                    className="user-input"
                                    style={{ textTransform: 'uppercase' }}
                                    onChange={onChangeInput}
                                />
                            </div>

                            <div className="user-field">
                                <label className="user-label">Branch Name</label>
                                <input
                                    type="text"
                                    name="branch_name"
                                    value={userValue.branch_name}
                                    placeholder="Enter Bank Branch Name"
                                    className="user-input"
                                    onChange={onChangeInput}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="user-form-footer">
                    <div>
                        {currentStep > 1 ? (
                            <button type="button" className="btn-user-cancel" onClick={handlePrev}>
                                ← Previous Step
                            </button>
                        ) : (
                            <Link to="/app/users" className="btn-user-cancel">
                                Cancel
                            </Link>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        {currentStep < 3 ? (
                            <button type="button" className="btn-user-next" onClick={handleNext}>
                                Next Step →
                            </button>
                        ) : (
                            <button type="submit" className="btn-user-save">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                {isEdit ? 'Update User' : 'Save User'}
                            </button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
};

const mapStateToProps = (state) => {
    const { roles } = state;
    return { roles };
};

export default connect(mapStateToProps, { fetchAllRoles })(UserForm);
