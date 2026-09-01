import React, {useEffect, useState} from 'react';
import Swiper from 'react-id-swiper';
import {Nav, Button} from 'react-bootstrap-v5';
import {connect} from 'react-redux';
import {fetchAllProductCategories} from '../../store/action/productCategoryAction';
import {fetchBrandClickable} from '../../store/action/pos/posAllProductAction';
import { getFormattedMessage } from '../../shared/sharedMethod';

const swiperParams = {
    slidesPerView: 'auto',
    observer: true,
};

const Category = (props) => {
    const {fetchAllProductCategories, productCategories, fetchBrandClickable, brandId, setCategory, selectedOption} = props;
    const [productCategoryName, setProductCategoryName] = useState(0);
    const [proId, setProId] = useState(0);

    useEffect(() => {
        fetchAllProductCategories();
    }, []);

    useEffect(() => {
        if(selectedOption) {
            fetchBrandClickable(brandId, proId, selectedOption.value && selectedOption.value);
        }
    }, [selectedOption]);

    //filter category function
    const onSelectCategory = (productCategory) => {
        setCategory(productCategory);
        setProductCategoryName(productCategory);
    };

    const categoryItem = productCategories && productCategories.map((productCategory, index) => {
        return (
            <div key={index} className='me-2 flex-shrink-0'>
                <Button variant='light'
                    className={`custom-btn-size text-nowrap rounded-pill px-3 ${productCategoryName === productCategory.id ? 'btn-success text-white' : 'btn-outline-secondary bg-white text-dark'}`}
                    onClick={() => {
                        onSelectCategory(productCategory.id);
                        setProId(productCategory.id);
                    }}>
                    {productCategory.attributes.name}
                </Button>
            </div>
        )
    });

    return (
        <div className='d-flex align-items-center flex-nowrap overflow-auto py-1 mb-2' style={{ scrollbarWidth: 'none' }}>
            <div className='me-2 flex-shrink-0'>
                <Button variant='light'
                    className={`custom-btn-size text-nowrap rounded-pill px-3 ${productCategoryName === 0 ? 'btn-success text-white' : 'btn-outline-secondary bg-white text-dark'}`}
                    onClick={() => onSelectCategory(0)}>
                    {getFormattedMessage('pos-all.categories.label')}
                </Button>
            </div>
            {categoryItem}
        </div>
    )
};
const mapStateToProps = (state) => {
    const {productCategories} = state;
    return {productCategories}
};

export default connect(mapStateToProps, {fetchAllProductCategories, fetchBrandClickable})(Category);
