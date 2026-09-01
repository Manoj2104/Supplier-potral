import React, { useState, createRef, useEffect } from 'react';
import { connect } from 'react-redux';
import { getFormattedMessage, placeholderText } from "../../shared/sharedMethod";
import { editBaseUnit, fetchBaseUnits, fetchBaseUnit } from '../../store/action/baseUnitsAction';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft,
    faCheck,
    faBoxes,
    faTag,
    faSliders,
} from '@fortawesome/free-solid-svg-icons';

const BaseUnitsForm = (props) => {
    const { handleClose, show, title, addProductData, editBaseUnit, singleUnit } = props;
    const innerRef = createRef();

    const getUnitName = (u) => u ? (u.name || u.attributes?.name || '') : '';

    const [unitValue, setUnitValue] = useState({
        name: getUnitName(singleUnit),
        short_symbol: '',
    });

    const [slug, setSlug] = useState('');
    const [category, setCategory] = useState('Count');
    const [status, setStatus] = useState('Active');

    const [errors, setErrors] = useState({ name: '' });

    useEffect(() => {
        if (singleUnit) {
            const uName = getUnitName(singleUnit);
            setUnitValue({ name: uName, short_symbol: uName.slice(0, 2).toLowerCase() });
            setSlug(uName.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
        } else {
            setUnitValue({ name: '', short_symbol: '' });
            setSlug('');
        }
        setErrors({ name: '' });
    }, [singleUnit, show]);

    const handleNameChange = (e) => {
        const val = e.target.value;
        setUnitValue(inputs => ({
            ...inputs,
            name: val,
            short_symbol: val.slice(0, 3).toLowerCase()
        }));
        setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
        setErrors({ name: '' });
    };

    const handleValidation = () => {
        let errorss = {};
        let isValid = false;
        const nameVal = (unitValue.name || '').trim();
        if (!nameVal) {
            errorss['name'] = getFormattedMessage("globally.input.name.validate.label");
        } else {
            isValid = true;
        }
        setErrors(errorss);
        return isValid;
    };

    const prepareFormData = (data) => {
        const params = new URLSearchParams();
        params.append('name', data.name);
        return params;
    };

    const onSubmit = (event) => {
        if (event) event.preventDefault();
        const valid = handleValidation();
        if (singleUnit && valid) {
            editBaseUnit(singleUnit.id, prepareFormData(unitValue), handleClose);
            clearField();
        } else if (valid) {
            addProductData(prepareFormData(unitValue));
            clearField();
        }
    };

    const clearField = () => {
        setUnitValue({ name: '', short_symbol: '' });
        setSlug('');
        setErrors({ name: '' });
        if (typeof handleClose === 'function') {
            handleClose(false);
        }
    };

    if (!show) return null;

    return (
        <div className="create-fullpage-container" style={{ margin: 0, borderRadius: '24px' }}>
            {/* Header */}
            <div className="create-form-header">
                <div className="d-flex align-items-center gap-3">
                    <button type="button" className="unit-btn-pill" onClick={clearField}>
                        <FontAwesomeIcon icon={faArrowLeft} /> Back to Base Units
                    </button>
                    <div>
                        <h2 style={{ fontSize: '26px', fontWeight: '800', margin: 0, color: '#0F172A' }}>
                            {singleUnit ? 'Edit Base Unit' : 'Create Base Unit'}
                        </h2>
                        <span style={{ fontSize: '14px', color: '#64748B' }}>
                            Configure master measurement unit name, category, and symbol
                        </span>
                    </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                    <button type="button" className="unit-btn-pill" onClick={clearField}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="unit-btn-pill unit-btn-primary"
                        onClick={onSubmit}
                        disabled={!(unitValue.name || '').trim()}
                    >
                        <FontAwesomeIcon icon={faCheck} /> {singleUnit ? 'Save Changes' : 'Save Base Unit'}
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="create-form-body">

                {/* Section 1: Base Unit Information Card */}
                <div className="create-card-section">
                    <div className="create-section-header">
                        <div className="create-section-icon">
                            <FontAwesomeIcon icon={faBoxes} />
                        </div>
                        <div className="create-section-title">
                            <h3>Base Unit Details</h3>
                            <p>Master unit definition used across inventory and sales</p>
                        </div>
                    </div>

                    <div className="row g-4">
                        <div className="col-md-6">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <label className="form-label mb-0" style={{ fontWeight: '700', fontSize: '14px' }}>
                                    Base Unit Name <span className="text-danger">*</span>
                                </label>
                                <span style={{ fontSize: '12px', color: '#94A3B8' }}>{(unitValue.name || '').length}/50</span>
                            </div>
                            <input
                                type="text"
                                className="form-control create-input-lg"
                                placeholder="Enter base unit name (e.g. Piece, Meter, Kilogram, Litre)"
                                ref={innerRef}
                                value={unitValue.name || ''}
                                onChange={handleNameChange}
                                autoComplete="off"
                            />
                            {errors['name'] && (
                                <span className="text-danger d-block fw-400 fs-small mt-1">{errors['name']}</span>
                            )}
                        </div>

                        <div className="col-md-6">
                            <label className="form-label mb-2" style={{ fontWeight: '700', fontSize: '14px' }}>
                                Short Symbol <span className="text-danger">*</span>
                            </label>
                            <input
                                type="text"
                                className="form-control create-input-lg"
                                placeholder="e.g. pc, m, kg, l, m²"
                                value={unitValue.short_symbol}
                                onChange={(e) => setUnitValue({ ...unitValue, short_symbol: e.target.value })}
                            />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label mb-2" style={{ fontWeight: '700', fontSize: '14px' }}>
                                Slug (URL) <span className="text-danger">*</span>
                            </label>
                            <div className="input-group">
                                <span className="input-group-text" style={{ background: '#F8FAFC', borderColor: '#E2E8F0', fontSize: '13px', color: '#64748B', borderRadius: '14px 0 0 14px' }}>
                                    infy-pos.com/base-units/
                                </span>
                                <input
                                    type="text"
                                    className="form-control create-input-lg"
                                    style={{ borderRadius: '0 14px 14px 0' }}
                                    placeholder="base-unit-slug"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="col-md-6">
                            <label className="form-label mb-2" style={{ fontWeight: '700', fontSize: '14px' }}>
                                Measurement Category
                            </label>
                            <select
                                className="form-select create-input-lg"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                <option value="Count">Count (Piece, Box, Dozen)</option>
                                <option value="Length">Length (Meter, Centimeter, Inch)</option>
                                <option value="Weight">Weight (Kilogram, Gram, Tonne)</option>
                                <option value="Volume">Volume (Litre, Millilitre, Gallon)</option>
                                <option value="Area">Area (Square Meter, Acre)</option>
                                <option value="Temperature">Temperature (Celsius, Fahrenheit)</option>
                                <option value="Time">Time (Second, Minute, Hour)</option>
                                <option value="Digital">Digital (Byte, KB, MB, GB)</option>
                            </select>
                        </div>

                        <div className="col-md-6">
                            <label className="form-label mb-2" style={{ fontWeight: '700', fontSize: '14px' }}>
                                Status <span className="text-danger">*</span>
                            </label>
                            <select
                                className="form-select create-input-lg"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default connect(null, { fetchBaseUnit, editBaseUnit, fetchBaseUnits })(BaseUnitsForm);
