import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AdjustmentForm from './AdjustmentForm';
import MasterLayout from '../MasterLayout';
import { addAdjustment } from '../../store/action/adjustMentAction';
import { fetchAllWarehouses } from '../../store/action/warehouseAction';

const CreateAdjustment = (props) => {
    const { addAdjustment, warehouses, fetchAllWarehouses } = props;
    const navigate = useNavigate();

    useEffect(() => {
        fetchAllWarehouses();
    }, []);

    const addAdjustmentData = (formValue) => {
        addAdjustment(formValue, navigate);
    };

    return (
        <MasterLayout>
            <AdjustmentForm addAdjustmentData={addAdjustmentData} warehouses={warehouses} />
        </MasterLayout>
    );
};

const mapStateToProps = (state) => {
    const { warehouses, totalRecord } = state;
    return { warehouses, totalRecord };
};

export default connect(mapStateToProps, { addAdjustment, fetchAllWarehouses })(CreateAdjustment);
