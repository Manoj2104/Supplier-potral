import React, {useState} from 'react';
import {placeholderText} from '../sharedMethod';
import {faSearch} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';

const FilterComponent = (props) => {
    const {handleSearch} = props;
    const [typingTimeout, setTypingTimeout] = useState(0);

    const sendToParent = (searchText) => {
        handleSearch(searchText);
    };

    const onChangeName = (event) => {
        if (typingTimeout) {
            clearTimeout(typingTimeout);
        }
        setTypingTimeout(setTimeout(() => sendToParent(event.target.value), 150));
    };

    return (
        <div className='d-flex position-relative col-12 col-xxl-4 col-md-4 col-lg-4 mb-lg-0 mb-md-0 mb-3 searchBox'>
            <div className='position-relative d-flex w-100'>
                <input 
                    className='form-control ps-10 border-gray-200 bg-light' 
                    type='search' 
                    id='search'
                    placeholder="Search by name, code, brand..." 
                    aria-label='Search'
                    onChange={(e) => onChangeName(e)}
                    style={{
                        borderRadius: '999px',
                        height: '44px',
                        fontSize: '13px',
                        paddingLeft: '40px',
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #E2E8F0'
                    }}
                />
                <span
                    className='position-absolute d-flex align-items-center top-0 bottom-0 text-gray-400 ms-3'
                    style={{ left: '4px', pointerEvents: 'none' }}
                >
                    <FontAwesomeIcon icon={faSearch} style={{ fontSize: '14px', color: '#94A3B8' }} />
                </span>
            </div>
        </div>
    )
};

export default FilterComponent;
