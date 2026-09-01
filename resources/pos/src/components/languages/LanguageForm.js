import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { Form, Modal, Button } from 'react-bootstrap-v5';
import { getFormattedMessage, placeholderText } from "../../shared/sharedMethod";
import { editLanguage, fetchLanguages, fetchLanguage } from '../../store/action/languageAction';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe, faUpload, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';

const getSingleName = (single) => {
    if (!single) return '';
    if (single.attributes && single.attributes.name) return single.attributes.name;
    if (single.name) return single.name;
    return '';
};

const getSingleIso = (single) => {
    if (!single) return '';
    if (single.attributes && single.attributes.iso_code) return single.attributes.iso_code;
    if (single.iso_code) return single.iso_code;
    return '';
};

const LanguageForm = (props) => {
    const { handleClose, show, title, singleLanguage, addLanguageData, editLanguage } = props;

    const [languageValue, setLanguageValue] = useState({
        name: getSingleName(singleLanguage),
        iso_code: getSingleIso(singleLanguage)
    });

    useEffect(() => {
        if (singleLanguage) {
            setLanguageValue({
                name: getSingleName(singleLanguage),
                iso_code: getSingleIso(singleLanguage)
            });
        }
    }, [singleLanguage]);

    const [nativeName, setNativeName] = useState('');
    const [country, setCountry] = useState('');
    const [direction, setDirection] = useState('LTR');
    const [isDefault, setIsDefault] = useState(false);
    const [status, setStatus] = useState('Active');

    const [errors, setErrors] = useState({
        name: '',
        iso_code: ''
    });

    const currentName = (languageValue.name || '').trim();
    const singleName = getSingleName(singleLanguage);
    const singleIso = getSingleIso(singleLanguage);
    const disabled = singleLanguage && singleName === currentName && singleIso === languageValue.iso_code;

    const handleValidation = () => {
        let errorss = {};
        let isValid = false;
        const nameVal = (languageValue.name || '').trim();
        const isoVal = (languageValue.iso_code || '').trim();

        if (!nameVal) {
            errorss['name'] = getFormattedMessage("globally.input.name.validate.label") || "The name field is required.";
        } else if (!isoVal) {
            errorss['iso_code'] = getFormattedMessage("globally.input.iso-code.validate.label") || "The ISO code field is required.";
        } else if (isoVal.length !== 2) {
            errorss['iso_code'] = getFormattedMessage('globally.input.iso-code.character.validate.label') || "ISO code must be 2 characters.";
        } else {
            isValid = true;
        }
        setErrors(errorss);
        return isValid;
    };

    const onChangeInput = (e) => {
        e.preventDefault();
        setLanguageValue(inputs => ({ ...inputs, [e.target.name]: e.target.value || '' }));
        setErrors('');
    };

    const prepareFormData = (data) => {
        const params = new URLSearchParams();
        params.append('name', data.name || '');
        params.append('iso_code', data.iso_code || '');
        return params;
    };

    const onSubmit = (event) => {
        if (event) event.preventDefault();
        const valid = handleValidation();
        if (singleLanguage && valid) {
            if (!disabled) {
                editLanguage(singleLanguage.id || singleLanguage.attributes?.id, prepareFormData(languageValue), handleClose);
                clearField(false);
            }
        } else {
            if (valid) {
                setLanguageValue(languageValue);
                addLanguageData(prepareFormData(languageValue));
                clearField(false);
            }
        }
    };

    const clearField = () => {
        setLanguageValue({
            name: '',
            iso_code: ''
        });
        setErrors('');
        handleClose(false);
    };

    return (
        <Modal
            show={show}
            onHide={clearField}
            keyboard={true}
            centered
            dialogClassName="modal-700w"
            contentClassName="border-0 rounded-4 shadow-lg overflow-hidden"
        >
            <Form onKeyPress={(e) => {
                if (e.key === 'Enter') {
                    onSubmit(e);
                }
            }}>
                <div className="p-4 bg-light border-bottom d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-3">
                        <div className="rounded-3 p-3 bg-success bg-opacity-10 text-success fs-4">
                            <FontAwesomeIcon icon={faGlobe} />
                        </div>
                        <div>
                            <h4 className="fw-extrabold text-dark mb-0">{title || "Create Language"}</h4>
                            <p className="text-muted fs-micro mb-0">Add or update language settings in your Enterprise POS system.</p>
                        </div>
                    </div>
                    <button type="button" className="btn-close" onClick={clearField}></button>
                </div>

                <Modal.Body className="p-4">
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label fw-bold text-dark">
                                Name <span className="text-danger">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={languageValue.name || ''}
                                maxLength={20}
                                placeholder="e.g. Tamil"
                                className="form-control form-control-lg rounded-3 fs-6"
                                autoComplete="off"
                                onChange={onChangeInput}
                            />
                            <span className="text-danger d-block fs-micro mt-1">{errors['name']}</span>
                        </div>

                        <div className="col-md-6">
                            <label className="form-label fw-bold text-dark">
                                ISO Code (2 Chars) <span className="text-danger">*</span>
                            </label>
                            <input
                                type="text"
                                name="iso_code"
                                maxLength={2}
                                value={languageValue.iso_code || ''}
                                placeholder="e.g. ta"
                                className="form-control form-control-lg rounded-3 fs-6"
                                onChange={onChangeInput}
                            />
                            <span className="text-danger d-block fs-micro mt-1">{errors['iso_code']}</span>
                        </div>

                        <div className="col-md-6">
                            <label className="form-label fw-bold text-dark">Native Name</label>
                            <input
                                type="text"
                                value={nativeName}
                                placeholder="e.g. தமிழ்"
                                className="form-control rounded-3"
                                onChange={(e) => setNativeName(e.target.value)}
                            />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label fw-bold text-dark">Country Name</label>
                            <input
                                type="text"
                                value={country}
                                placeholder="e.g. India"
                                className="form-control rounded-3"
                                onChange={(e) => setCountry(e.target.value)}
                            />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label fw-bold text-dark">Text Direction</label>
                            <div className="btn-group w-100" role="group">
                                <button
                                    type="button"
                                    className={`btn btn-sm ${direction === 'LTR' ? 'btn-success fw-bold' : 'btn-outline-secondary'}`}
                                    onClick={() => setDirection('LTR')}
                                >
                                    Left to Right (LTR)
                                </button>
                                <button
                                    type="button"
                                    className={`btn btn-sm ${direction === 'RTL' ? 'btn-success fw-bold' : 'btn-outline-secondary'}`}
                                    onClick={() => setDirection('RTL')}
                                >
                                    Right to Left (RTL)
                                </button>
                            </div>
                        </div>

                        <div className="col-md-6">
                            <label className="form-label fw-bold text-dark">Status</label>
                            <select className="form-select rounded-3" value={status} onChange={(e) => setStatus(e.target.value)}>
                                <option value="Active">Active</option>
                                <option value="Draft">Draft</option>
                                <option value="Disabled">Disabled</option>
                            </select>
                        </div>

                        <div className="col-md-12 mt-3">
                            <div className="form-check form-switch">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="defaultLangCheck"
                                    checked={isDefault}
                                    onChange={(e) => setIsDefault(e.target.checked)}
                                />
                                <label className="form-check-label fw-bold text-dark" htmlFor="defaultLangCheck">
                                    Set as System Default Language
                                </label>
                            </div>
                        </div>
                    </div>
                </Modal.Body>

                <Modal.Footer className="p-3 bg-light border-top d-flex align-items-center justify-content-end gap-2">
                    <Button variant="outline-secondary" className="px-4 py-2 rounded-3 fw-bold" onClick={clearField}>
                        Cancel
                    </Button>
                    <Button variant="success" className="px-4 py-2 rounded-3 fw-bold" onClick={onSubmit}>
                        <FontAwesomeIcon icon={faCheck} className="me-1" /> Save Language
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default connect(null, { fetchLanguage, fetchLanguages, editLanguage })(LanguageForm);
