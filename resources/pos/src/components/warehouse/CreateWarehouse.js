import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import MasterLayout from '../MasterLayout';
import { addWarehouse } from '../../store/action/warehouseAction';
import WarehouseForm from './WarehouseForm';
import HeaderTitle from '../header/HeaderTitle';
import { Filters } from '../../constants';
import { getFormattedMessage } from '../../shared/sharedMethod';
import FormPageSkeleton from '../../shared/components/skeletons/FormPageSkeleton';
import { isPageFirstLoad, markPageAnimated } from '../dashboard/dashboardAnimationState';

const CreateWarehouse = (props) => {
    const { addWarehouse } = props;
    const navigate = useNavigate();

    const [isLoadingSkeleton, setIsLoadingSkeleton] = useState(isPageFirstLoad('warehouse-create'));

    useEffect(() => {
        if (isLoadingSkeleton) {
            const timer = setTimeout(() => {
                setIsLoadingSkeleton(false);
                markPageAnimated('warehouse-create');
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [isLoadingSkeleton]);

    const addWarehouseData = (formValue) => {
        addWarehouse(formValue, navigate, Filters.OBJ);
    };

    return (
        <MasterLayout>
            <HeaderTitle title={getFormattedMessage('warehouse.create.title')} to='/app/warehouse' />
            {isLoadingSkeleton ? (
                <FormPageSkeleton />
            ) : (
                <WarehouseForm addWarehouseData={addWarehouseData} />
            )}
        </MasterLayout>
    );
};

export default connect(null, { addWarehouse })(CreateWarehouse);
