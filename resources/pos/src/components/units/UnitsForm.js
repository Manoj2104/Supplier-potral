import React, { useState, createRef, useEffect } from 'react';
import { connect } from 'react-redux';
import { getFormattedMessage, placeholderText } from "../../shared/sharedMethod";
import { editUnit } from '../../store/action/unitsAction';
import ReactSelect from '../../shared/select/reactSelect';
import { fetchAllBaseUnits } from "../../store/action/baseUnitsAction";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft,
    faCheck,
    faRulerCombined,
    faTag,
    faBoxes,
} from '@fortawesome/free-solid-svg-icons';

const UnitsForm = (props) => {
    const { handleClose, base, fetchAllBaseUnits, show, title, addProductData, editUnit, singleUnit, hide } = props;
    const innerRef = createRef();

    const getUnitName = (u) => u ? (u.name || u.attributes?.name || '') : '';
    const getShortName = (u) => u ? (u.short_name || u.attributes?.short_name || '') : '';
    const getBaseUnit = (u) => u ? (u.base_unit || u.attributes?.base_unit || '') : '';

    const [unitValue, setUnitValue] = useState({
        name: getUnitName(singleUnit),
        short_name: getShortName(singleUnit),
        base_unit: ''
    });

    const [slug, setSlug] = useState('');
    const [unitType, setUnitType] = useState('Count');
    const [status, setStatus] = useState('Active');

    const [errors, setErrors] = useState({
        name: '',
        short_name: '',
        base_unit: ''
    });

    useEffect(() => {
        fetchAllBaseUnits();
    }, []);

    useEffect(() => {
        if (singleUnit) {
            const uName = getUnitName(singleUnit);
            const uShort = getShortName(singleUnit);
            const data = base.filter((da) => Number(singleUnit.base_unit) === da.id || singleUnit.base_unit === da.attributes?.name);
            setUnitValue({
                name: uName,
                short_name: uShort,
                base_unit: data.length ? { label: data[0]?.attributes?.name, value: data[0]?.id } : ''
            });
            setSlug(uName.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
        } else {
            setUnitValue({
                name: '',
                short_name: '',
                base_unit: ''
            });
            setSlug('');
        }
        setErrors({ name: '', short_name: '', base_unit: '' });
    }, [singleUnit, show]);

    const handleNameChange = (e) => {
        const val = e.target.value;
        setUnitValue(inputs => ({ ...inputs, name: val }));
        setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
        setErrors(prev => ({ ...prev, name: '' }));
    };

    const onChangeInput = (e) => {
        e.preventDefault();
        setUnitValue(inputs => ({ ...inputs, [e.target.name]: e.target.value }));
        setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    };

    const onBaseUnitChange = (obj) => {
        setUnitValue(unitValue => ({ ...unitValue, base_unit: obj }));
        setErrors(prev => ({ ...prev, base_unit: '' }));
    };

    const handleValidation = () => {
        let errorss = {};
        let isValid = false;
        const nameVal = (unitValue.name || '').trim();
        const shortVal = (unitValue.short_name || '').trim();
        if (!nameVal) {
            errorss['name'] = getFormattedMessage("globally.input.name.validate.label");
        } else if (!shortVal) {
            errorss['short_name'] = getFormattedMessage("unit.modal.input.short-name.validate.label");
        } else if (shortVal.length > 50) {
            errorss['short_name'] = getFormattedMessage("unit.modal.input.short-name.valid.validate.label");
        } else if (!unitValue['base_unit']) {
            errorss['base_unit'] = getFormattedMessage("unit.modal.input.base-unit.validate.label");
        } else {
            isValid = true;
        }
        setErrors(errorss);
        return isValid;
    };

    const prepareFormData = (data) => {
        const params = new URLSearchParams();
        params.append('name', data.name);
        params.append('short_name', data.short_name);
        if (Array.isArray(data.base_unit) && data.base_unit[0]) {
            params.append('base_unit', data.base_unit[0].value);
        } else if (data.base_unit && data.base_unit.value) {
            params.append('base_unit', data.base_unit.value);
        } else {
            params.append('base_unit', data.base_unit);
        }
        return params;
    };

    const onSubmit = (event) => {
        if (event) event.preventDefault();
        const valid = handleValidation();
        if (singleUnit && valid) {
            editUnit(singleUnit.id, prepareFormData(unitValue), handleClose);
            clearField();
        } else if (valid) {
            addProductData(prepareFormData(unitValue));
            clearField();
        }
    };

    const clearField = () => {
        setUnitValue({
            name: '',
            short_name: '',
            base_unit: ''
        });
        setSlug('');
        setErrors({ name: '', short_name: '', base_unit: '' });
        if (typeof handleClose === 'function') {
            handleClose(false);
        } else if (typeof hide === 'function') {
            hide(false);
        }
    };

    if (!show) return null;

    return (
        <div className="create-fullpage-container" style={{ margin: 0, borderRadius: '24px' }}>
            {/* Header */}
            <div className="create-form-header">
                <div className="d-flex align-items-center gap-3">
                    <button type="button" className="unit-btn-pill" onClick={clearField}>
                        <FontAwesomeIcon icon={faArrowLeft} /> Back to Units
                    </button>
                    <div>
                        <h2 style={{ fontSize: '26px', fontWeight: '800', margin: 0, color: '#0F172A' }}>
                            {singleUnit ? 'Edit Unit' : 'Create Unit'}
                        </h2>
                        <span style={{ fontSize: '14px', color: '#64748B' }}>
                            Configure product measurement units, short name, and base unit
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
                        <FontAwesomeIcon icon={faCheck} /> {singleUnit ? 'Save Changes' : 'Save Unit'}
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="create-form-body">

                {/* Section 1: Unit Information Card */}
                <div className="create-card-section">
                    <div className="create-section-header">
                        <div className="create-section-icon">
                            <FontAwesomeIcon icon={faRulerCombined} />
                        </div>
                        <div className="create-section-title">
                            <h3>Unit Information</h3>
                            <p>Basic details about measurement unit</p>
                        </div>
                    </div>

                    <div className="row g-4">
                        <div className="col-md-6">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <label className="form-label mb-0" style={{ fontWeight: '700', fontSize: '14px' }}>
                                    Unit Name <span className="text-danger">*</span>
                                </label>
                                <span style={{ fontSize: '12px', color: '#94A3B8' }}>{(unitValue.name || '').length}/50</span>
                            </div>
                            <input
                                type="text"
                                className="form-control create-input-lg"
                                placeholder="Enter unit name (e.g. Piece, Kilogram, Litre)"
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
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <label className="form-label mb-0" style={{ fontWeight: '700', fontSize: '14px' }}>
                                    Short Name <span className="text-danger">*</span>
                                </label>
                                <span style={{ fontSize: '12px', color: '#94A3B8' }}>{(unitValue.short_name || '').length}/50</span>
                            </div>
                            <input
                                type="text"
                                name="short_name"
                                className="form-control create-input-lg"
                                placeholder="Enter short symbol (e.g. pc, kg, L, m)"
                                value={unitValue.short_name || ''}
                                onChange={onChangeInput}
                                autoComplete="off"
                            />
                            {errors['short_name'] && (
                                <span className="text-danger d-block fw-400 fs-small mt-1">{errors['short_name']}</span>
                            )}
                        </div>

                        <div className="col-md-6">
                            <label className="form-label mb-2" style={{ fontWeight: '700', fontSize: '14px' }}>
                                Slug (URL) <span className="text-danger">*</span>
                            </label>
                            <div className="input-group">
                                <span className="input-group-text" style={{ background: '#F8FAFC', borderColor: '#E2E8F0', fontSize: '13px', color: '#64748B', borderRadius: '14px 0 0 14px' }}>
                                    infy-pos.com/units/
                                </span>
                                <input
                                    type="text"
                                    className="form-control create-input-lg"
                                    style={{ borderRadius: '0 14px 14px 0' }}
                                    placeholder="unit-slug"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="col-md-6">
                            <label className="form-label mb-2" style={{ fontWeight: '700', fontSize: '14px' }}>
                                Base Unit <span className="text-danger">*</span>
                            </label>
                            <ReactSelect
                                title={getFormattedMessage("unit.modal.input.base-unit.label")}
                                placeholder={placeholderText("unit.modal.input.base-unit.placeholder.label")}
                                value={unitValue.base_unit}
                                data={base}
                                onChange={onBaseUnitChange}
                                errors={errors['base_unit']}
                            />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label mb-2" style={{ fontWeight: '700', fontSize: '14px' }}>
                                Unit Type Category
                            </label>
                            <select
                                className="form-select create-input-lg"
                                value={unitType}
                                onChange={(e) => setUnitType(e.target.value)}
                            >
                                <option value="Count">Count (Piece, Box, Packet, Dozen)</option>
                                <option value="Length">Length (Meter, Centimeter, Inch)</option>
                                <option value="Weight">Weight (Kilogram, Gram)</option>
                                <option value="Volume">Volume (Litre, Millilitre)</option>
                                <option value="Area">Area (Square Meter)</option>
                                <option value="Digital Storage">Digital Storage (GB, MB)</option>
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

const mapStateToProps = (state) => {
    const { base } = state;
    return { base };
};

export default connect(mapStateToProps, { fetchAllBaseUnits, editUnit })(UnitsForm);
