import React, { createRef, useState, useEffect } from 'react';
import { connect } from 'react-redux';
import {
    editProductCategory, fetchProductCategory, fetchProductCategories
} from '../../store/action/productCategoryAction';
import { getFormattedMessage } from '../../shared/sharedMethod';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft,
    faCloudArrowUp,
    faFolder,
    faImage,
    faFileAlt,
    faBox,
    faShoppingBag,
    faShoppingCart,
    faTag,
    faThLarge,
    faTv,
    faMobileAlt,
    faShirt,
    faCouch,
    faClock,
    faHeadphones,
    faGamepad,
    faCamera,
    faGift,
    faCar,
    faBicycle,
    faWrench,
    faPaw,
    faBasketball,
    faGem,
    faEllipsisH,
    faBold,
    faItalic,
    faUnderline,
    faStrikethrough,
    faListUl,
    faAlignLeft,
    faAlignCenter,
    faLink,
    faTrash,
    faCheck,
} from '@fortawesome/free-solid-svg-icons';

const ProductCategoryForm = (props) => {
    const { handleClose, show, title, addProductData, editProductCategory, singleProductCategory } = props;
    const innerRef = createRef();
    const fileInputRef = createRef();

    const getCatName = (cat) => cat ? (cat.name || cat.attributes?.name || '') : '';
    const getCatImg = (cat) => cat ? (cat.image || cat.attributes?.image || null) : null;

    const [productCategoryValue, setProductCategoryValue] = useState({
        name: getCatName(singleProductCategory),
        image: getCatImg(singleProductCategory),
    });

    const [slug, setSlug] = useState('');
    const [parentCategory, setParentCategory] = useState('');
    const [status, setStatus] = useState('Active');
    const [selectedIconIndex, setSelectedIconIndex] = useState(0);
    const [shortDescription, setShortDescription] = useState('');
    const [fullDescription, setFullDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [errors, setErrors] = useState({
        name: '',
    });

    const [imagePreviewUrl, setImagePreviewUrl] = useState(getCatImg(singleProductCategory));
    const [selectImg, setSelectImg] = useState(null);

    useEffect(() => {
        if (singleProductCategory) {
            const catName = getCatName(singleProductCategory);
            const catImg = getCatImg(singleProductCategory);
            setProductCategoryValue({
                name: catName,
                image: catImg,
            });
            setSlug(catName.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
            setImagePreviewUrl(catImg || null);
        } else {
            setProductCategoryValue({
                name: '',
                image: '',
            });
            setSlug('');
            setImagePreviewUrl(null);
        }
        setSelectImg(null);
        setErrors({ name: '' });
        setIsSubmitting(false);
    }, [singleProductCategory, show]);

    const initialName = getCatName(singleProductCategory);
    const currentName = (productCategoryValue.name || '').trim();
    const disabled = isSubmitting || (selectImg ? false : singleProductCategory && initialName === currentName);

    // Auto Slug Generator
    const handleNameChange = (e) => {
        const val = e.target.value;
        setProductCategoryValue(inputs => ({ ...inputs, name: val }));
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
        const nameVal = (productCategoryValue.name || '').trim();
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

    const onSubmit = async (event) => {
        if (event) event.preventDefault();
        const valid = handleValidation();
        if (!valid || isSubmitting) return;

        setIsSubmitting(true);
        const catId = singleProductCategory?.id;

        try {
            if (catId) {
                if (!disabled) {
                    await editProductCategory(catId, prepareFormData(productCategoryValue), () => {});
                    clearField();
                }
            } else {
                await addProductData(prepareFormData(productCategoryValue));
                clearField();
                if (typeof handleClose === 'function') {
                    handleClose();
                }
            }
        } catch (err) {
            console.error(err);
            setIsSubmitting(false);
        }
    };

    const clearField = () => {
        setProductCategoryValue({
            name: '',
            image: ''
        });
        setSlug('');
        setImagePreviewUrl(null);
        setSelectImg(null);
        setErrors({ name: '' });
        setIsSubmitting(false);
        if (typeof handleClose === 'function') {
            handleClose(false);
        }
    };

    const iconsList = [
        faBox, faShoppingBag, faShoppingCart, faTag, faThLarge, faTv, faMobileAlt,
        faShirt, faCouch, faClock, faHeadphones, faGamepad, faCamera, faGift,
        faCar, faBicycle, faWrench, faPaw, faBasketball, faGem, faEllipsisH
    ];

    if (!show) return null;

    return (
        <div className="create-fullpage-container">
            <div className="create-form-header">
                <div className="d-flex align-items-center gap-3">
                    <button type="button" className="cat-btn-pill" onClick={clearField}>
                        <FontAwesomeIcon icon={faArrowLeft} /> Back to Categories
                    </button>
                    <div>
                        <h2 style={{ fontSize: '26px', fontWeight: '800', margin: 0, color: '#0F172A' }}>
                            {singleProductCategory ? 'Edit Product Category' : 'Create Product Category'}
                        </h2>
                        <span style={{ fontSize: '14px', color: '#64748B' }}>
                            Add a new category to organize your products better
                        </span>
                    </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                    <button type="button" className="cat-btn-pill" onClick={clearField}>
                        Save as Draft
                    </button>
                    <button
                        type="button"
                        className="cat-btn-pill cat-btn-primary"
                        onClick={onSubmit}
                        disabled={disabled || !(productCategoryValue.name || '').trim()}
                    >
                        <FontAwesomeIcon icon={faCheck} /> {isSubmitting ? 'Saving...' : (singleProductCategory ? 'Save Changes' : 'Save Category')}
                    </button>
                </div>
            </div>

            <div className="create-form-body">

                {/* Section 1: Category Information Card */}
                <div className="create-card-section">
                    <div className="create-section-header">
                        <div className="create-section-icon">
                            <FontAwesomeIcon icon={faFileAlt} />
                        </div>
                        <div className="create-section-title">
                            <h3>Category Information</h3>
                            <p>Basic details about the product category</p>
                        </div>
                    </div>

                    <div className="row g-4">
                        <div className="col-md-6">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <label className="form-label mb-0" style={{ fontWeight: '700', fontSize: '14px' }}>
                                    Category Name <span className="text-danger">*</span>
                                </label>
                                <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                                    {(productCategoryValue.name || '').length}/100
                                </span>
                            </div>
                            <input
                                type="text"
                                className="form-control create-input-lg"
                                placeholder="Enter category name"
                                ref={innerRef}
                                value={productCategoryValue.name || ''}
                                onChange={handleNameChange}
                                autoComplete="off"
                            />
                            <span style={{ fontSize: '12px', color: '#64748B', display: 'block', marginTop: '6px' }}>
                                Enter a unique and descriptive category name
                            </span>
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
                                    infy-pos.com/categories/
                                </span>
                                <input
                                    type="text"
                                    className="form-control create-input-lg"
                                    style={{ borderRadius: '0 14px 14px 0' }}
                                    placeholder="category-slug"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                />
                            </div>
                            <span style={{ fontSize: '12px', color: '#64748B', display: 'block', marginTop: '6px' }}>
                                URL friendly unique slug for the category
                            </span>
                        </div>

                        <div className="col-md-6">
                            <label className="form-label mb-2" style={{ fontWeight: '700', fontSize: '14px' }}>
                                Parent Category
                            </label>
                            <select
                                className="form-select create-input-lg"
                                value={parentCategory}
                                onChange={(e) => setParentCategory(e.target.value)}
                            >
                                <option value="">Select parent category</option>
                                <option value="electronics">Electronics</option>
                                <option value="home-appliances">Home Appliances</option>
                                <option value="fashion">Fashion</option>
                            </select>
                            <span style={{ fontSize: '12px', color: '#64748B', display: 'block', marginTop: '6px' }}>
                                Choose a parent category if this is a subcategory
                            </span>
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
                            <span style={{ fontSize: '12px', color: '#64748B', display: 'block', marginTop: '6px' }}>
                                Choose category status
                            </span>
                        </div>
                    </div>
                </div>

                {/* Section 2: Category Image & Icon Card */}
                <div className="create-card-section">
                    <div className="create-section-header">
                        <div className="create-section-icon blue">
                            <FontAwesomeIcon icon={faImage} />
                        </div>
                        <div className="create-section-title">
                            <h3>Category Image & Icon</h3>
                            <p>Upload image and choose an icon for the category</p>
                        </div>
                    </div>

                    <div className="row g-4">
                        {/* Drag & Drop Image Upload Area */}
                        <div className="col-md-6">
                            <label className="form-label mb-2" style={{ fontWeight: '700', fontSize: '14px' }}>
                                Category Image
                            </label>
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
                                            alt="Category Preview"
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
                                            Drag and drop image here
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
                                            or click to browse
                                        </div>
                                        <span style={{ fontSize: '12px', color: '#94A3B8', marginTop: '8px' }}>
                                            PNG, JPG, JPEG, WEBP up to 2MB
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Category Icon Selector Grid */}
                        <div className="col-md-6">
                            <label className="form-label mb-2" style={{ fontWeight: '700', fontSize: '14px' }}>
                                Category Icon
                            </label>
                            <div className="create-icon-grid">
                                {iconsList.map((ic, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        className={`create-icon-item ${selectedIconIndex === idx ? 'active' : ''}`}
                                        onClick={() => setSelectedIconIndex(idx)}
                                    >
                                        <FontAwesomeIcon icon={ic} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 3: Category Description Card */}
                <div className="create-card-section">
                    <div className="create-section-header">
                        <div className="create-section-icon orange">
                            <FontAwesomeIcon icon={faFolder} />
                        </div>
                        <div className="create-section-title">
                            <h3>Category Description</h3>
                            <p>Provide description for the category (optional)</p>
                        </div>
                    </div>

                    <div className="row g-4">
                        <div className="col-md-6">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <label className="form-label mb-0" style={{ fontWeight: '700', fontSize: '14px' }}>
                                    Short Description
                                </label>
                                <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                                    {shortDescription.length}/150
                                </span>
                            </div>
                            <textarea
                                className="form-control"
                                rows="5"
                                style={{ borderRadius: '14px', borderColor: '#E2E8F0', fontSize: '14px', padding: '12px' }}
                                placeholder="Enter short description"
                                value={shortDescription}
                                onChange={(e) => setShortDescription(e.target.value.slice(0, 150))}
                            />
                            <span style={{ fontSize: '12px', color: '#64748B', display: 'block', marginTop: '6px' }}>
                                Short summary about this category
                            </span>
                        </div>

                        <div className="col-md-6">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <label className="form-label mb-0" style={{ fontWeight: '700', fontSize: '14px' }}>
                                    Full Description
                                </label>
                                <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                                    {fullDescription.length}/2000
                                </span>
                            </div>

                            {/* Rich Text Toolbar */}
                            <div className="create-editor-toolbar">
                                <select className="form-select form-select-sm" style={{ width: '100px', fontSize: '12px' }}>
                                    <option>Normal</option>
                                    <option>Heading 1</option>
                                    <option>Heading 2</option>
                                </select>
                                <button type="button" className="create-tb-btn"><FontAwesomeIcon icon={faBold} /></button>
                                <button type="button" className="create-tb-btn"><FontAwesomeIcon icon={faItalic} /></button>
                                <button type="button" className="create-tb-btn"><FontAwesomeIcon icon={faUnderline} /></button>
                                <button type="button" className="create-tb-btn"><FontAwesomeIcon icon={faStrikethrough} /></button>
                                <button type="button" className="create-tb-btn"><FontAwesomeIcon icon={faListUl} /></button>
                                <button type="button" className="create-tb-btn"><FontAwesomeIcon icon={faAlignLeft} /></button>
                                <button type="button" className="create-tb-btn"><FontAwesomeIcon icon={faAlignCenter} /></button>
                                <button type="button" className="create-tb-btn"><FontAwesomeIcon icon={faLink} /></button>
                            </div>

                            <textarea
                                className="form-control create-editor-area"
                                rows="3"
                                placeholder="Enter detailed description about this category..."
                                value={fullDescription}
                                onChange={(e) => setFullDescription(e.target.value.slice(0, 2000))}
                            />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default connect(null, { fetchProductCategory, editProductCategory, fetchProductCategories })(ProductCategoryForm);
