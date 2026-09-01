import React from 'react';
import { getFormattedMessage } from '../../shared/sharedMethod';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

const CreateVariation = (props) => {
    const { onClickCreate } = props;

    return (
        <button
            type="button"
            className="var-btn-pill var-btn-primary"
            onClick={onClickCreate}
        >
            <FontAwesomeIcon icon={faPlus} /> {getFormattedMessage('variation.create.title')}
        </button>
    );
};

export default CreateVariation;
