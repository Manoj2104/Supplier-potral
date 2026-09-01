import React from 'react';
import {connect} from 'react-redux';
import MasterLayout from '../MasterLayout';
import {useNavigate} from 'react-router-dom';
import {Filters} from '../../constants';
import CustomerForm from './CustomerForm';
import {addCustomer} from '../../store/action/customerAction';
import {getFormattedMessage, placeholderText} from '../../shared/sharedMethod';
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";
import TabTitle from '../../shared/tab-title/TabTitle';

const CreateCustomer = (props) => {
    const {addCustomer} = props;
    const navigate = useNavigate();

    const addCustomerData = (formValue) => {
        addCustomer(formValue, navigate, Filters.OBJ);
    };

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title={placeholderText('customer.create.title')} />
            <CustomerForm addCustomerData={addCustomerData}/>
        </MasterLayout>
    )
};

export default connect(null, {addCustomer})(CreateCustomer);
