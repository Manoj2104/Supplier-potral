import React from 'react';
import { getFormattedMessage } from '../../shared/sharedMethod';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

const CreateBrands = (props) => {
    const { onClickCreate } = props;

    return (
        <button
            type="button"
            className="brand-btn-pill brand-btn-primary"
            onClick={onClickCreate}
        >
            <FontAwesomeIcon icon={faPlus} /> {getFormattedMessage('brand.create.title')}
        </button>
    );
};

export default CreateBrands;
