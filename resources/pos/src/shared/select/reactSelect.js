import React, { useEffect } from 'react';
import { Form } from 'react-bootstrap-v5';
import Select from 'react-select';
import { useDispatch, useSelector } from "react-redux";
import { useIntl } from "react-intl";
import { getFormattedMessage } from '../sharedMethod';

const ReactSelect = ( props ) => {
    const { title, placeholder, data, defaultValue, onChange, errors, value, isRequired, multiLanguageOption, isWarehouseDisable, addSearchItems } = props;
    const dispatch = useDispatch();
    const isOptionDisabled = useSelector( ( state ) => state.isOptionDisabled );
    const intl = useIntl();

    const formatOptionLabel = (name) => {
        if (!name || typeof name !== 'string') return '';
        if (name.includes('.') || name.includes('label') || name.startsWith('status.')) {
            try {
                const translated = intl.formatMessage({ id: name, defaultMessage: '' });
                if (translated && translated !== name) return translated;
            } catch (e) {}
            if (name.includes('received')) return 'Received';
            if (name.includes('pending')) return 'Pending';
            if (name.includes('ordered')) return 'Ordered';
            if (name.includes('sent')) return 'Sent';
            if (name.includes('completed')) return 'Completed';
            if (name.includes('paid')) return 'Paid';
            if (name.includes('unpaid')) return 'Unpaid';
            if (name.includes('partial')) return 'Partially Paid';
            const parts = name.split('.');
            const last = parts[parts.length - 2] || parts[parts.length - 1];
            return last.charAt(0).toUpperCase() + last.slice(1);
        }
        return name;
    };

    const rawData = Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : null);

    const option = rawData ? rawData.map( ( da ) => {
        const itemVal = da.value !== undefined ? da.value : da.id;
        let itemLabel = da.label ? da.label : da.name;
        if (!itemLabel && da.attributes) {
            itemLabel = da.attributes.symbol || da.attributes.name;
        }
        if (!itemLabel) {
            itemLabel = da.symbol || String(da.id || '');
        }
        return {
            value: itemVal,
            label: formatOptionLabel(itemLabel)
        };
    } ) : (Array.isArray(multiLanguageOption) ? multiLanguageOption.map( ( opt ) => {
        return {
            value: opt.id !== undefined ? opt.id : opt.value,
            label: formatOptionLabel(opt.name || opt.label)
        };
    } ) : []);

    // Format controlled value label if it has translation key
    let formattedValue = value;
    if (value && typeof value === 'object') {
        const vLabel = value.label || value.name;
        if (vLabel && typeof vLabel === 'string' && (vLabel.includes('.') || vLabel.startsWith('status.'))) {
            formattedValue = {
                ...value,
                label: formatOptionLabel(vLabel),
                name: formatOptionLabel(vLabel),
            };
        }
    }

    useEffect( () => {
        addSearchItems ? dispatch( { type: 'DISABLE_OPTION', payload: true } ) : dispatch( { type: 'DISABLE_OPTION', payload: false } )
    }, [] );

    return (
        <Form.Group className='form-group w-100' controlId='formBasic'>
            {title ? <Form.Label>{title}:</Form.Label> : ''}
            {isRequired ? '' : <span className='required' />}
            <Select
                placeholder={placeholder}
                value={formattedValue}
                defaultValue={defaultValue}
                onChange={onChange}
                options={option}
                noOptionsMessage={() => getFormattedMessage( 'no-option.label' )}
                isDisabled={isWarehouseDisable ? isOptionDisabled : false}
            />
            {errors ? <span className='text-danger d-block fw-400 fs-small mt-2'>{errors ? errors : null}</span> : null}
        </Form.Group>
    )
};
export default ReactSelect;
