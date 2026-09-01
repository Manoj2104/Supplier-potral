import React, { useState } from 'react';
import { connect } from 'react-redux';
import { addProductCategory } from '../../store/action/productCategoryAction';
import ProductCategoryFrom from './ProductCategoryForm';
import { getFormattedMessage } from '../../shared/sharedMethod';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

const CreateProductCategory = (props) => {
    const { addProductCategory, onClickCreate } = props;
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(!show);

    const addProductData = (productValue) => {
        addProductCategory(productValue);
    };

    return (
        <div>
            <button
                type="button"
                className='cat-btn-pill cat-btn-primary'
                onClick={onClickCreate ? onClickCreate : handleClose}
            >
                <FontAwesomeIcon icon={faPlus} /> {getFormattedMessage('product-category.create.title')}
            </button>
            {!onClickCreate && (
                <ProductCategoryFrom
                    addProductData={addProductData}
                    handleClose={handleClose}
                    show={show}
                    title={getFormattedMessage('product-category.create.title')}
                />
            )}
        </div>
    );
};

export default connect(null, { addProductCategory })(CreateProductCategory);
