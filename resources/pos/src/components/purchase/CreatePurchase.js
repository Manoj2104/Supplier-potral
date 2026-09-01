import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import MasterLayout from '../MasterLayout';
import { useNavigate } from 'react-router-dom';
import { fetchAllWarehouses } from '../../store/action/warehouseAction';
import { fetchAllSuppliers } from '../../store/action/supplierAction';
import PurchaseForm from './PurchaseForm';
import { addPurchase, fetchPurchases } from '../../store/action/purchaseAction';
import { fetchAllBrands } from '../../store/action/brandsAction';
import { fetchAllProductCategories } from '../../store/action/productCategoryAction';
import FormPageSkeleton from '../../shared/components/skeletons/FormPageSkeleton';
import { isPageFirstLoad, markPageAnimated } from '../dashboard/dashboardAnimationState';

const CreatePurchase = (props) => {
    const { addPurchase, warehouses, fetchAllWarehouses, fetchAllSuppliers, suppliers, purchases, totalRecord, fetchPurchases, brands, productCategories, fetchAllBrands, fetchAllProductCategories } = props;
    const navigate = useNavigate();

    const [isLoadingSkeleton, setIsLoadingSkeleton] = useState(false);

    useEffect(() => {
        fetchAllWarehouses();
        fetchAllSuppliers();
        fetchPurchases({ pageSize: 100 }, false);
        fetchAllBrands();
        fetchAllProductCategories();
    }, []);

    const addPurchaseData = (formValue) => {
        addPurchase(formValue, navigate);
    };

    return (
        <MasterLayout>
            {isLoadingSkeleton ? (
                <FormPageSkeleton />
            ) : (
                <PurchaseForm addPurchaseData={addPurchaseData} warehouses={warehouses} suppliers={suppliers} purchases={purchases} totalRecord={totalRecord} brands={brands} productCategories={productCategories} />
            )}
        </MasterLayout>
    );
};

const mapStateToProps = (state) => {
    const { warehouses, suppliers, totalRecord, purchases, brands, productCategories } = state;
    return { warehouses, suppliers, totalRecord, purchases, brands, productCategories };
};

export default connect(mapStateToProps, { addPurchase, fetchAllWarehouses, fetchAllSuppliers, fetchPurchases, fetchAllBrands, fetchAllProductCategories })(CreatePurchase);
