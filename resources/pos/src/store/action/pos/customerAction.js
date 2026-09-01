import apiConfig from '../../../config/apiConfig';
import { apiBaseURL, toastType } from '../../../constants';
import { addToast } from './../toastAction'
import { getFormattedMessage } from '../../../shared/sharedMethod';
import { setSavingButton } from "./../saveButtonAction";
import { fetchAllCustomer } from "../customerAction";

export const addCustomer = ( supplier, hide, setSelectedCustomerOption ) => async ( dispatch ) => {
    dispatch( setSavingButton( true ) )
    await apiConfig.post( apiBaseURL.CUSTOMERS, supplier )
        .then( ( response ) => {
            dispatch( fetchAllCustomer() )
            dispatch( addToast( { text: getFormattedMessage( 'customer.success.create.message' ) } ) );
            if (setSelectedCustomerOption && response.data && response.data.data) {
                const newCust = response.data.data;
                setSelectedCustomerOption({
                    value: newCust.id,
                    label: newCust.attributes ? newCust.attributes.name : supplier.name
                });
            }
            dispatch( setSavingButton( false ) )
            dispatch( hide( false ) )
        } )
        .catch( ( { response } ) => {
            dispatch( setSavingButton( false ) )
            dispatch( addToast(
                { text: response?.data?.message || "Failed to create customer", type: toastType.ERROR } ) );
        } );
};

