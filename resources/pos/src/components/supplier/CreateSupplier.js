import React from 'react';
import { connect } from 'react-redux';
import MasterLayout from '../MasterLayout';
import SupplierForm from './SupplierForm';
import { useNavigate } from 'react-router-dom';
import { Filters } from '../../constants';
import { addSupplier } from '../../store/action/supplierAction';
import './SuppliersPremium.css';

const CreateSupplier = (props) => {
    const { addSupplier } = props;
    const navigate = useNavigate();

    const addSupplierData = (formValue) => {
        addSupplier(formValue, navigate, Filters.OBJ);
    };

    return (
        <MasterLayout>
            <SupplierForm addSupplierData={addSupplierData} />
        </MasterLayout>
    );
};

export default connect(null, { addSupplier })(CreateSupplier);
