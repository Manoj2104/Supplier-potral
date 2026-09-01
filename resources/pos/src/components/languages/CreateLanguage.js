import React, { useState } from 'react';
import { connect } from 'react-redux';
import { addLanguage } from '../../store/action/languageAction';
import LanguageForm from './LanguageForm';
import { getFormattedMessage } from "../../shared/sharedMethod";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

const CreateLanguage = (props) => {
    const { addLanguage } = props;
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(!show);

    const addLanguageData = (productValue) => {
        addLanguage(productValue);
    };

    return (
        <div>
            <button
                type="button"
                className="unit-btn-pill unit-btn-primary"
                onClick={handleClose}
            >
                <FontAwesomeIcon icon={faPlus} /> {getFormattedMessage('language.create.title')}
            </button>
            <LanguageForm
                addLanguageData={addLanguageData}
                handleClose={handleClose}
                show={show}
                title={getFormattedMessage('language.create.title')}
            />
        </div>
    );
};

export default connect(null, { addLanguage })(CreateLanguage);
