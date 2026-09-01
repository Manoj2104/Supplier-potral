import React, { useState } from "react";
import Form from "react-bootstrap/Form";
import { connect } from "react-redux";
import * as EmailValidator from "email-validator";
import { useNavigate } from "react-router-dom";
import {
    getFormattedMessage,
    placeholderText,
    numValidate,
} from "../../shared/sharedMethod";
import { editCustomer } from "../../store/action/customerAction";
import ReactDatePicker from "../../shared/datepicker/ReactDatePicker";
import moment from "moment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeft,
    faCheck,
    faUser,
    faMapMarkerAlt,
    faEnvelope,
    faPhone,
    faCalendarAlt,
    faCity,
    faGlobe,
    faHome,
} from "@fortawesome/free-solid-svg-icons";
import "../variation/ProductVariationsPremium.css";
import "../brands/ProductBrandsPremium.css";
import "./CustomersPremium.css";

const CustomerForm = (props) => {
    const { addCustomerData, id, editCustomer, singleCustomer } = props;
    const navigate = useNavigate();

    const [customerValue, setCustomerValue] = useState({
        name: singleCustomer ? singleCustomer[0].name : "",
        dob: singleCustomer
            ? singleCustomer[0].dob === null
                ? null
                : moment(singleCustomer[0].dob).toDate()
            : null,
        email: singleCustomer ? singleCustomer[0].email : "",
        phone: singleCustomer ? singleCustomer[0].phone : "",
        country: singleCustomer ? singleCustomer[0].country : "",
        city: singleCustomer ? singleCustomer[0].city : "",
        address: singleCustomer ? singleCustomer[0].address : "",
    });

    const [errors, setErrors] = useState({
        dob: "",
        name: "",
        email: "",
        phone: "",
        country: "",
        city: "",
        address: "",
    });

    const [isSaving, setIsSaving] = useState(false);

    const disabled =
        singleCustomer &&
        singleCustomer[0].dob === customerValue.dob &&
        singleCustomer[0].phone === customerValue.phone &&
        singleCustomer[0].name === customerValue.name &&
        singleCustomer[0].country === customerValue.country &&
        singleCustomer[0].city === customerValue.city &&
        singleCustomer[0].email === customerValue.email &&
        singleCustomer[0].address === customerValue.address;

    const handleValidation = () => {
        let errorss = {};
        let isValid = false;
        if (!customerValue["name"] || !customerValue["name"].trim()) {
            errorss["name"] = getFormattedMessage(
                "globally.input.name.validate.label"
            );
        } else if (!customerValue["email"] || !EmailValidator.validate(customerValue["email"])) {
            if (!customerValue["email"]) {
                errorss["email"] = getFormattedMessage(
                    "globally.input.email.validate.label"
                );
            } else {
                errorss["email"] = getFormattedMessage(
                    "globally.input.email.valid.validate.label"
                );
            }
        } else if (!customerValue["country"] || !customerValue["country"].trim()) {
            errorss["country"] = getFormattedMessage(
                "globally.input.country.validate.label"
            );
        } else if (!customerValue["city"] || !customerValue["city"].trim()) {
            errorss["city"] = getFormattedMessage(
                "globally.input.city.validate.label"
            );
        } else if (!customerValue["address"] || !customerValue["address"].trim()) {
            errorss["address"] = getFormattedMessage(
                "globally.input.address.validate.label"
            );
        } else if (!customerValue["phone"] || !customerValue["phone"].trim()) {
            errorss["phone"] = getFormattedMessage(
                "globally.input.phone-number.validate.label"
            );
        } else {
            isValid = true;
        }
        setErrors(errorss);
        return isValid;
    };

    const handleCallback = (date) => {
        setCustomerValue((previousState) => {
            return { ...previousState, dob: date };
        });
        setErrors((prev) => ({ ...prev, dob: "" }));
    };

    const onChangeInput = (e) => {
        const { name, value } = e.target;
        setCustomerValue((inputs) => ({
            ...inputs,
            [name]: value,
        }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const onSubmit = (event) => {
        if (event) event.preventDefault();
        const valid = handleValidation();
        if (valid) {
            setIsSaving(true);
            if (singleCustomer) {
                if (!disabled) {
                    editCustomer(id, customerValue, navigate);
                }
            } else {
                addCustomerData(customerValue);
            }
        }
    };

    const handleCancel = () => {
        navigate("/app/customers");
    };

    return (
        <div className="create-fullpage-container" style={{ margin: "20px auto 40px auto", maxWidth: "1200px", borderRadius: "24px" }}>
            {/* Header */}
            <div className="create-form-header">
                <div className="d-flex align-items-center gap-3">
                    <button type="button" className="var-btn-pill" onClick={handleCancel}>
                        <FontAwesomeIcon icon={faArrowLeft} /> Back to Customers
                    </button>
                    <div>
                        <h2 style={{ fontSize: "26px", fontWeight: "800", margin: 0, color: "#0F172A" }}>
                            {singleCustomer ? "Edit Customer Profile" : "Create New Customer"}
                        </h2>
                        <span style={{ fontSize: "14px", color: "#64748B" }}>
                            Manage customer identity, contact information, and billing/shipping location
                        </span>
                    </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                    <button type="button" className="var-btn-pill" onClick={handleCancel}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="var-btn-pill var-btn-primary"
                        onClick={onSubmit}
                        disabled={isSaving || (singleCustomer && disabled) || !customerValue.name.trim()}
                    >
                        <FontAwesomeIcon icon={faCheck} /> {isSaving ? "Saving..." : singleCustomer ? "Save Changes" : "Save Customer"}
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="create-form-body">
                {/* Section 1: Customer Profile Details */}
                <div className="create-card-section">
                    <div className="create-section-header">
                        <div className="create-section-icon" style={{ background: "#EFF6FF", color: "#2563EB" }}>
                            <FontAwesomeIcon icon={faUser} />
                        </div>
                        <div className="create-section-title">
                            <h3>Personal & Contact Information</h3>
                            <p>Primary contact details and date of birth for identity and communication</p>
                        </div>
                    </div>

                    <div className="row g-4">
                        <div className="col-md-6">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <label className="form-label mb-0" style={{ fontWeight: "700", fontSize: "14px", color: "#0F172A" }}>
                                    Full Name <span className="text-danger">*</span>
                                </label>
                                <span style={{ fontSize: "12px", color: "#94A3B8" }}>
                                    {customerValue.name.length}/50
                                </span>
                            </div>
                            <input
                                type="text"
                                name="name"
                                value={customerValue.name}
                                placeholder="e.g. Alexander Wright"
                                className="form-control create-input-lg"
                                autoFocus={true}
                                onChange={onChangeInput}
                            />
                            {errors["name"] && (
                                <span className="text-danger d-block fw-500 fs-small mt-1">
                                    {errors["name"]}
                                </span>
                            )}
                        </div>

                        <div className="col-md-6">
                            <label className="form-label mb-2" style={{ fontWeight: "700", fontSize: "14px", color: "#0F172A" }}>
                                Email Address <span className="text-danger">*</span>
                            </label>
                            <input
                                type="email"
                                name="email"
                                className="form-control create-input-lg"
                                placeholder="e.g. alexander@example.com"
                                onChange={onChangeInput}
                                value={customerValue.email}
                            />
                            {errors["email"] && (
                                <span className="text-danger d-block fw-500 fs-small mt-1">
                                    {errors["email"]}
                                </span>
                            )}
                        </div>

                        <div className="col-md-6">
                            <label className="form-label mb-2" style={{ fontWeight: "700", fontSize: "14px", color: "#0F172A" }}>
                                Phone Number <span className="text-danger">*</span>
                            </label>
                            <input
                                type="text"
                                name="phone"
                                className="form-control create-input-lg"
                                pattern="[0-9]*"
                                placeholder="e.g. 9876543210"
                                onKeyPress={(event) => numValidate(event)}
                                onChange={onChangeInput}
                                value={customerValue.phone}
                            />
                            {errors["phone"] && (
                                <span className="text-danger d-block fw-500 fs-small mt-1">
                                    {errors["phone"]}
                                </span>
                            )}
                        </div>

                        <div className="col-md-6">
                            <label className="form-label mb-2" style={{ fontWeight: "700", fontSize: "14px", color: "#0F172A" }}>
                                Date of Birth
                            </label>
                            <div className="position-relative">
                                <ReactDatePicker
                                    onChangeDate={handleCallback}
                                    newStartDate={customerValue.dob}
                                    readOnlyref={false}
                                />
                            </div>
                            {errors["dob"] && (
                                <span className="text-danger d-block fw-500 fs-small mt-1">
                                    {errors["dob"]}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Section 2: Address & Location */}
                <div className="create-card-section">
                    <div className="create-section-header">
                        <div className="create-section-icon" style={{ background: "#DCFCE7", color: "#15803D" }}>
                            <FontAwesomeIcon icon={faMapMarkerAlt} />
                        </div>
                        <div className="create-section-title">
                            <h3>Address & Location Details</h3>
                            <p>Billing destination and delivery address for invoices and statements</p>
                        </div>
                    </div>

                    <div className="row g-4">
                        <div className="col-md-6">
                            <label className="form-label mb-2" style={{ fontWeight: "700", fontSize: "14px", color: "#0F172A" }}>
                                Country <span className="text-danger">*</span>
                            </label>
                            <input
                                type="text"
                                name="country"
                                className="form-control create-input-lg"
                                placeholder="e.g. India, United States"
                                onChange={onChangeInput}
                                value={customerValue.country}
                            />
                            {errors["country"] && (
                                <span className="text-danger d-block fw-500 fs-small mt-1">
                                    {errors["country"]}
                                </span>
                            )}
                        </div>

                        <div className="col-md-6">
                            <label className="form-label mb-2" style={{ fontWeight: "700", fontSize: "14px", color: "#0F172A" }}>
                                City <span className="text-danger">*</span>
                            </label>
                            <input
                                type="text"
                                name="city"
                                className="form-control create-input-lg"
                                placeholder="e.g. Chennai, Bangalore, Mumbai"
                                onChange={onChangeInput}
                                value={customerValue.city}
                            />
                            {errors["city"] && (
                                <span className="text-danger d-block fw-500 fs-small mt-1">
                                    {errors["city"]}
                                </span>
                            )}
                        </div>

                        <div className="col-12">
                            <label className="form-label mb-2" style={{ fontWeight: "700", fontSize: "14px", color: "#0F172A" }}>
                                Street Address <span className="text-danger">*</span>
                            </label>
                            <textarea
                                rows="3"
                                name="address"
                                className="form-control create-input-lg"
                                style={{ borderRadius: "14px", height: "auto" }}
                                placeholder="Enter full street address, apartment, suite, or building number"
                                onChange={onChangeInput}
                                value={customerValue.address}
                            />
                            {errors["address"] && (
                                <span className="text-danger d-block fw-500 fs-small mt-1">
                                    {errors["address"]}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom Actions Bar */}
                <div className="d-flex align-items-center justify-content-end gap-3 pt-3">
                    <button type="button" className="var-btn-pill" onClick={handleCancel}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="var-btn-pill var-btn-primary"
                        onClick={onSubmit}
                        disabled={isSaving || (singleCustomer && disabled) || !customerValue.name.trim()}
                    >
                        <FontAwesomeIcon icon={faCheck} /> {isSaving ? "Saving..." : singleCustomer ? "Save Changes" : "Save Customer"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default connect(null, { editCustomer })(CustomerForm);
