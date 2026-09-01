import React from 'react';
import { getFormattedMessage } from '../../shared/sharedMethod';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

const CreateBaseUnits = (props) => {
    const { onClickCreate } = props;

    return (
        <button
            type="button"
            className="unit-btn-pill unit-btn-primary"
            onClick={onClickCreate}
        >
            <FontAwesomeIcon icon={faPlus} /> Create Base Unit
        </button>
    );
};

export default CreateBaseUnits;
