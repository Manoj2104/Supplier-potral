import React, { useState, useEffect, createRef } from 'react';
import { connect } from 'react-redux';
import { editBrand, fetchBrand } from '../../store/action/brandsAction';
import user from '../../assets/images/brand_logo.png';
import { getFormattedMessage, placeholderText } from '../../shared/sharedMethod';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft,
    faCloudArrowUp,
    faGlobe,
    faTag,
    faTrash,
    faCheck,
    faBuilding,
} from '@fortawesome/free-solid-svg-icons';

const BrandsFrom = (props) => {
    const { handleClose, show, title, addBrandData, editBrand, singleBrand } = props;
    const innerRef = createRef();
    const fileInputRef = createRef();

    const getBrandName = (b) => b ? (b.name || b.attributes?.name || '') : '';
    const getBrandImg = (b) => b ? (b.image || b.attributes?.image || null) : null;

    const [formValue, setFormValue] = useState({
        name: getBrandName(singleBrand),
        image: getBrandImg(singleBrand)
    });

    const [slug, setSlug] = useState('');
    const [website, setWebsite] = useState('');
    const [country, setCountry] = useState('South Korea');
    const [status, setStatus] = useState('Active');
    const [description, setDescription] = useState('');

    const [errors, setErrors] = useState({ name: '' });
    const [imagePreviewUrl, setImagePreviewUrl] = useState(getBrandImg(singleBrand));
    const [selectImg, setSelectImg] = useState(null);

    useEffect(() => {
        if (singleBrand) {
            const bName = getBrandName(singleBrand);
            const bImg = getBrandImg(singleBrand);
            setFormValue({ name: bName, image: bImg });
            setSlug(bName.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
            setImagePreviewUrl(bImg || null);
        } else {
            setFormValue({ name: '', image: '' });
            setSlug('');
            setImagePreviewUrl(null);
        }
        setSelectImg(null);
        setErrors({ name: '' });
    }, [singleBrand, show]);

    const initialName = getBrandName(singleBrand);
    const currentName = (formValue.name || '').trim();
    const disabled = selectImg ? false : singleBrand && initialName === currentName;

    const handleNameChange = (e) => {
        const val = e.target.value;
        setFormValue(inputs => ({ ...inputs, name: val }));
        setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
        setErrors({ name: '' });
    };

    const handleImageChanges = (e) => {
        e.preventDefault();
        const files = e.target.files || e.dataTransfer?.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                setSelectImg(file);
                const fileReader = new FileReader();
                fileReader.onloadend = () => {
                    setImagePreviewUrl(fileReader.result);
                };
                fileReader.readAsDataURL(file);
                setErrors({ name: '' });
            }
        }
    };

    const handleValidation = () => {
        let errorss = {};
        let isValid = false;
        const nameVal = (formValue.name || '').trim();
        if (!nameVal) {
            errorss['name'] = getFormattedMessage('globally.input.name.validate.label');
        } else if (nameVal.length > 50) {
            errorss['name'] = getFormattedMessage('brand.input.name.valid.validate.label');
        } else {
            isValid = true;
        }
        setErrors(errorss);
        return isValid;
    };

    const prepareFormData = (data) => {
        const formData = new FormData();
        formData.append('name', data.name);
        if (selectImg && selectImg instanceof File) {
            formData.append('image', selectImg);
        }
        return formData;
    };

    const onSubmit = (event) => {
        if (event) event.preventDefault();
        const valid = handleValidation();
        if (singleBrand && valid) {
            if (!disabled) {
                editBrand(singleBrand.id, prepareFormData(formValue), handleClose);
                clearField();
            }
        } else if (valid) {
            addBrandData(prepareFormData(formValue));
            clearField();
        }
    };

    const clearField = () => {
        setFormValue({ name: '', image: '' });
        setSlug('');
        setImagePreviewUrl(null);
        setSelectImg(null);
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
                    <button type="button" className="brand-btn-pill" onClick={clearField}>
                        <FontAwesomeIcon icon={faArrowLeft} /> Back to Brands
                    </button>
                    <div>
                        <h2 style={{ fontSize: '26px', fontWeight: '800', margin: 0, color: '#0F172A' }}>
                            {singleBrand ? 'Edit Brand' : 'Create Brand'}
                        </h2>
                        <span style={{ fontSize: '14px', color: '#64748B' }}>
                            Configure brand details, logo, website, and manufacturer country
                        </span>
                    </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                    <button type="button" className="brand-btn-pill" onClick={clearField}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="brand-btn-pill brand-btn-primary"
                        onClick={onSubmit}
                        disabled={disabled || !(formValue.name || '').trim()}
                    >
                        <FontAwesomeIcon icon={faCheck} /> {singleBrand ? 'Save Changes' : 'Save Brand'}
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="create-form-body">

                {/* Section 1: Brand Information Card */}
                <div className="create-card-section">
                    <div className="create-section-header">
                        <div className="create-section-icon">
                            <FontAwesomeIcon icon={faBuilding} />
                        </div>
                        <div className="create-section-title">
                            <h3>Brand Information</h3>
                            <p>Basic details about the brand and manufacturer</p>
                        </div>
                    </div>

                    <div className="row g-4">
                        <div className="col-md-6">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <label className="form-label mb-0" style={{ fontWeight: '700', fontSize: '14px' }}>
                                    Brand Name <span className="text-danger">*</span>
                                </label>
                                <span style={{ fontSize: '12px', color: '#94A3B8' }}>{(formValue.name || '').length}/50</span>
                            </div>
                            <input
                                type="text"
                                className="form-control create-input-lg"
                                placeholder="Enter brand name (e.g. Samsung, Sony, LG)"
                                ref={innerRef}
                                value={formValue.name || ''}
                                onChange={handleNameChange}
                                autoComplete="off"
                            />
                            {errors['name'] && (
                                <span className="text-danger d-block fw-400 fs-small mt-1">{errors['name']}</span>
                            )}
                        </div>

                        <div className="col-md-6">
                            <label className="form-label mb-2" style={{ fontWeight: '700', fontSize: '14px' }}>
                                Slug (URL) <span className="text-danger">*</span>
                            </label>
                            <div className="input-group">
                                <span className="input-group-text" style={{ background: '#F8FAFC', borderColor: '#E2E8F0', fontSize: '13px', color: '#64748B', borderRadius: '14px 0 0 14px' }}>
                                    infy-pos.com/brands/
                                </span>
                                <input
                                    type="text"
                                    className="form-control create-input-lg"
                                    style={{ borderRadius: '0 14px 14px 0' }}
                                    placeholder="brand-slug"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="col-md-6">
                            <label className="form-label mb-2" style={{ fontWeight: '700', fontSize: '14px' }}>
                                Country of Origin
                            </label>
                            <select
                                className="form-select create-input-lg"
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                            >
                                <option value="South Korea">South Korea 🇰🇷</option>
                                <option value="Japan">Japan 🇯🇵</option>
                                <option value="United States">United States 🇺🇸</option>
                                <option value="India">India 🇮🇳</option>
                                <option value="China">China 🇨🇳</option>
                                <option value="Germany">Germany 🇩🇪</option>
                                <option value="Netherlands">Netherlands 🇳🇱</option>
                            </select>
                        </div>

                        <div className="col-md-6">
                            <label className="form-label mb-2" style={{ fontWeight: '700', fontSize: '14px' }}>
                                Official Website
                            </label>
                            <div className="input-group">
                                <span className="input-group-text" style={{ background: '#F8FAFC', borderColor: '#E2E8F0', fontSize: '13px', color: '#64748B', borderRadius: '14px 0 0 14px' }}>
                                    <FontAwesomeIcon icon={faGlobe} />
                                </span>
                                <input
                                    type="text"
                                    className="form-control create-input-lg"
                                    style={{ borderRadius: '0 14px 14px 0' }}
                                    placeholder="https://www.samsung.com"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                />
                            </div>
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

                {/* Section 2: Brand Logo */}
                <div className="create-card-section">
                    <div className="create-section-header">
                        <div className="create-section-icon blue">
                            <FontAwesomeIcon icon={faTag} />
                        </div>
                        <div className="create-section-title">
                            <h3>Brand Logo & Image</h3>
                            <p>Upload brand logo (PNG, JPG, WEBP, SVG)</p>
                        </div>
                    </div>

                    <div className="row g-4">
                        <div className="col-md-12">
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept="image/*"
                                onChange={handleImageChanges}
                            />
                            
                            <div
                                className="create-dropzone"
                                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleImageChanges}
                            >
                                {imagePreviewUrl ? (
                                    <div className="position-relative d-inline-block">
                                        <img
                                            src={imagePreviewUrl}
                                            alt="Brand Preview"
                                            style={{ maxHeight: '140px', maxWidth: '100%', objectFit: 'contain', borderRadius: '16px' }}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-danger position-absolute top-0 end-0 rounded-circle"
                                            style={{ transform: 'translate(50%, -50%)', padding: '4px 8px' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setImagePreviewUrl(null);
                                                setSelectImg(null);
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faCloudArrowUp} className="create-dropzone-icon" />
                                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A' }}>
                                            Drag and drop brand logo here
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
                                            or click to browse
                                        </div>
                                        <span style={{ fontSize: '12px', color: '#94A3B8', marginTop: '8px' }}>
                                            PNG, JPG, WEBP, SVG up to 2MB
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default connect(null, { fetchBrand, editBrand })(BrandsFrom);
