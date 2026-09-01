import React, { useEffect, useState } from 'react';
import Swiper from 'react-id-swiper';
import 'swiper/swiper.scss';
import { Nav, Button } from 'react-bootstrap-v5';
import { connect } from 'react-redux';
import { fetchAllBrands } from '../../store/action/brandsAction';
import { getFormattedMessage } from '../../shared/sharedMethod';

const swiperParams = {
    slidesPerView: 'auto',
    observer: true,
};

const Brands = ( props ) => {
    const { fetchAllBrands, brands, setBrand } = props;
    const [ productBrandName, setProductBrandName ] = useState( 0 );

    useEffect( () => {
        fetchAllBrands();
    }, [] );

    //filter brand function
    const onSelectBrand = ( brand ) => {
        setBrand( brand );
        setProductBrandName( brand );
    };

    let brandsItem = brands && brands.map( ( brand, index ) => {
        return (
            <div className='me-2 flex-shrink-0' key={index}>
                <Button variant='light'
                    className={`custom-btn-size text-nowrap rounded-pill px-3 ${productBrandName === brand.id ? 'btn-success text-white' : 'btn-outline-secondary bg-white text-dark'}`}
                    onClick={() => onSelectBrand( brand.id )}>
                    {brand.attributes.name}
                </Button>
            </div>
        )
    } );

    return (
        <div className='d-flex align-items-center flex-nowrap overflow-auto py-1' style={{ scrollbarWidth: 'none' }}>
            <div className='me-2 flex-shrink-0'>
                <Button variant='light'
                    className={`text-nowrap custom-btn-size rounded-pill px-3 ${productBrandName === 0 ? 'btn-success text-white' : 'btn-outline-secondary bg-white text-dark'}`}
                    onClick={() => onSelectBrand( 0 )}>
                    {getFormattedMessage( 'pos-all.brands.label' )}
                </Button>
            </div>
            {brandsItem}
        </div>
    )
};

const mapStateToProps = ( state ) => {
    const { brands } = state;
    return { brands }
};

export default connect( mapStateToProps, { fetchAllBrands } )( Brands );
