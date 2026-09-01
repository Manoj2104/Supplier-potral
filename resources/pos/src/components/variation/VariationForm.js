import React, { createRef, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Modal } from "react-bootstrap-v5";
import { getFormattedMessage, placeholderText } from "../../shared/sharedMethod";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus,
    faTrash,
    faXmark,
    faCheck,
    faSliders,
    faTag,
    faPalette,
    faArrowLeft,
    faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import {
    createVariation,
    updateVariation,
} from "../../store/action/variationAction";

const VariationForm = (props) => {
    const { handleClose, show, title, singleVariation } = props;
    const innerRef = createRef();
    const tagInputRef = createRef();
    const dispatch = useDispatch();

    const [name, setName] = useState(singleVariation ? singleVariation.name : "");
    const [slug, setSlug] = useState("");
    const [tagInputValue, setTagInputValue] = useState("");
    const [variationTypes, setVariationTypes] = useState([{ name: "" }]);
    const [deletedVariationTypes, setDeletedVariationTypes] = useState([]);
    const [status, setStatus] = useState("Active");

    const [errors, setErrors] = useState({
        name: "",
        variation_types: "",
    });

    useEffect(() => {
        if (singleVariation) {
            setName(singleVariation.name || "");
            setSlug((singleVariation.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-"));
            setVariationTypes(singleVariation.variation_types && singleVariation.variation_types.length > 0 ? singleVariation.variation_types : [{ name: "" }]);
            setDeletedVariationTypes([]);
        } else {
            setName("");
            setSlug("");
            setVariationTypes([{ name: "" }]);
            setDeletedVariationTypes([]);
        }
        setTagInputValue("");
        setErrors({ name: "", variation_types: "" });
    }, [singleVariation, show]);

    const handleNameChange = (e) => {
        const val = e.target.value;
        setName(val);
        setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
        setErrors((prev) => ({ ...prev, name: "" }));
    };

    const handleTagKeyDown = (e) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTagFromInput();
        } else if (e.key === "Backspace" && !tagInputValue && variationTypes.length > 0) {
            // Remove last tag on backspace if input is empty
            const lastIdx = variationTypes.length - 1;
            removeVariationType(lastIdx, variationTypes[lastIdx]);
        }
    };

    const addTagFromInput = () => {
        const trimmed = tagInputValue.trim();
        if (!trimmed) return;

        // Check duplicates
        const exists = variationTypes.some(t => t.name.toLowerCase() === trimmed.toLowerCase());
        if (!exists) {
            setVariationTypes([...variationTypes.filter(t => t.name.trim() !== ""), { name: trimmed }]);
            setTagInputValue("");
            setErrors((prev) => ({ ...prev, variation_types: "" }));
        }
    };

    const removeVariationType = (index, variationType) => {
        const list = [...variationTypes];
        list.splice(index, 1);
        setVariationTypes(list.length > 0 ? list : [{ name: "" }]);
        if (variationType && variationType.id) {
            setDeletedVariationTypes([...deletedVariationTypes, { id: variationType.id, name: variationType.name }]);
        }
    };

    const handleValidation = () => {
        let error = {};
        let isValid = false;
        const validTypes = variationTypes.filter((item) => item.name && item.name.trim() !== "");
        if (!name.trim()) {
            error["name"] = getFormattedMessage("globally.input.name.validate.label");
        } else if (validTypes.length === 0) {
            error["variation_types"] = getFormattedMessage("variation.type.input.name.validate.label");
        } else {
            isValid = true;
        }
        setErrors(error);
        return isValid;
    };

    const clearField = () => {
        setName("");
        setSlug("");
        setVariationTypes([{ name: "" }]);
        setDeletedVariationTypes([]);
        setTagInputValue("");
        setErrors({ name: "", variation_types: "" });
        if (typeof handleClose === "function") {
            handleClose(false);
        }
    };

    const onSubmit = (event) => {
        if (event) event.preventDefault();

        // If there's unadded text in tag input, add it first
        let currentTypes = [...variationTypes];
        if (tagInputValue.trim()) {
            const trimmed = tagInputValue.trim();
            if (!currentTypes.some(t => t.name.toLowerCase() === trimmed.toLowerCase())) {
                currentTypes = [...currentTypes.filter(t => t.name.trim() !== ""), { name: trimmed }];
            }
        } else {
            currentTypes = currentTypes.filter(t => t.name.trim() !== "");
        }

        const valid = handleValidation();
        if (!valid) return;

        if (singleVariation) {
            dispatch(
                updateVariation(
                    singleVariation.id,
                    { id: singleVariation.id, name: name.trim(), variation_types: currentTypes, deleted_variation_types: deletedVariationTypes },
                    clearField
                )
            );
        } else {
            dispatch(
                createVariation(
                    { name: name.trim(), variation_types: currentTypes, deleted_variation_types: [] },
                    clearField
                )
            );
        }
    };

    if (!show) return null;

    return (
        <div className="create-fullpage-container" style={{ margin: 0, borderRadius: '24px' }}>
            {/* Header */}
            <div className="create-form-header">
                <div className="d-flex align-items-center gap-3">
                    <button type="button" className="var-btn-pill" onClick={clearField}>
                        <FontAwesomeIcon icon={faArrowLeft} /> Back to Variations
                    </button>
                    <div>
                        <h2 style={{ fontSize: '26px', fontWeight: '800', margin: 0, color: '#0F172A' }}>
                            {singleVariation ? 'Edit Product Variation' : 'Create Product Variation'}
                        </h2>
                        <span style={{ fontSize: '14px', color: '#64748B' }}>
                            Configure product attributes and variation values
                        </span>
                    </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                    <button type="button" className="var-btn-pill" onClick={clearField}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="var-btn-pill var-btn-primary"
                        onClick={onSubmit}
                        disabled={!name.trim()}
                    >
                        <FontAwesomeIcon icon={faCheck} /> {singleVariation ? 'Save Changes' : 'Save Variation'}
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="create-form-body">
                {/* Section 1: Variation Details */}
                <div className="create-card-section">
                    <div className="create-section-header">
                        <div className="create-section-icon">
                            <FontAwesomeIcon icon={faSliders} />
                        </div>
                        <div className="create-section-title">
                            <h3>Variation Information</h3>
                            <p>Define attribute name, URL slug, and status</p>
                        </div>
                    </div>

                    <div className="row g-4">
                        <div className="col-md-6">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <label className="form-label mb-0" style={{ fontWeight: '700', fontSize: '14px' }}>
                                    Variation Name <span className="text-danger">*</span>
                                </label>
                                <span style={{ fontSize: '12px', color: '#94A3B8' }}>{name.length}/50</span>
                            </div>
                            <input
                                type="text"
                                className="form-control create-input-lg"
                                placeholder="e.g. Color, Size, Storage, Capacity"
                                ref={innerRef}
                                value={name}
                                onChange={handleNameChange}
                                autoComplete="off"
                            />
                            {errors["name"] && (
                                <span className="text-danger d-block fw-400 fs-small mt-1">{errors["name"]}</span>
                            )}
                        </div>

                        <div className="col-md-6">
                            <label className="form-label mb-2" style={{ fontWeight: '700', fontSize: '14px' }}>
                                Slug (URL) <span className="text-danger">*</span>
                            </label>
                            <div className="input-group">
                                <span className="input-group-text" style={{ background: '#F8FAFC', borderColor: '#E2E8F0', fontSize: '13px', color: '#64748B', borderRadius: '14px 0 0 14px' }}>
                                    infy-pos.com/variations/
                                </span>
                                <input
                                    type="text"
                                    className="form-control create-input-lg"
                                    style={{ borderRadius: '0 14px 14px 0' }}
                                    placeholder="variation-slug"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
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
                                <option value="Draft">Draft</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Section 2: Variation Values (Modern Tag / Chip Input) */}
                <div className="create-card-section">
                    <div className="create-section-header">
                        <div className="create-section-icon blue">
                            <FontAwesomeIcon icon={faTag} />
                        </div>
                        <div className="create-section-title">
                            <h3>Variation Values & Options</h3>
                            <p>Enter values (e.g. Black, White, XL, 128GB). Press Enter or Comma to add chips.</p>
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="form-label mb-2" style={{ fontWeight: '700', fontSize: '14px' }}>
                            Values <span className="text-danger">*</span>
                        </label>
                        
                        {/* Modern Tag Input Container */}
                        <div className="var-tag-input-container">
                            {variationTypes
                                .filter(t => t.name && t.name.trim() !== "")
                                .map((typeItem, index) => (
                                    <span key={index} className="var-tag-chip">
                                        {typeItem.name}
                                        <FontAwesomeIcon
                                            icon={faXmark}
                                            className="var-tag-remove"
                                            onClick={() => removeVariationType(index, typeItem)}
                                        />
                                    </span>
                                ))}

                            <input
                                type="text"
                                className="var-tag-input-field"
                                placeholder={variationTypes.length === 0 ? "Type value and press Enter..." : "Add another value..."}
                                value={tagInputValue}
                                onChange={(e) => setTagInputValue(e.target.value)}
                                onKeyDown={handleTagKeyDown}
                                onBlur={addTagFromInput}
                                ref={tagInputRef}
                            />
                        </div>

                        {errors["variation_types"] && (
                            <span className="text-danger d-block fw-400 fs-small mt-2">{errors["variation_types"]}</span>
                        )}

                        <div className="d-flex align-items-center gap-2 mt-3">
                            <button
                                type="button"
                                className="var-btn-pill"
                                style={{ height: '40px', padding: '0 16px', fontSize: '13px' }}
                                onClick={addTagFromInput}
                                disabled={!tagInputValue.trim()}
                            >
                                <FontAwesomeIcon icon={faPlus} /> Add Value
                            </button>
                            <span style={{ fontSize: '13px', color: '#64748B' }}>
                                <FontAwesomeIcon icon={faInfoCircle} /> Pressing Enter or Comma automatically creates a value chip.
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VariationForm;
