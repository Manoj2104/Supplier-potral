import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { useParams } from 'react-router-dom';
import MasterLayout from '../MasterLayout';
import { fetchAllWarehouses } from '../../store/action/warehouseAction';
import { fetchAllSuppliers } from '../../store/action/supplierAction';
import { fetchPurchaseReturn } from '../../store/action/purchaseReturnAction';
import PurchaseReturnForm from './PurchaseReturnForm';
import Spinner from "../../shared/components/loaders/Spinner";
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";

const EditPurchaseReturn = (props) => {
    const { fetchAllWarehouses, fetchAllSuppliers, fetchPurchaseReturn, purchaseReturn, warehouses, suppliers, isLoading } = props;
    const { id } = useParams();

    useEffect(() => {
        fetchAllWarehouses();
        fetchAllSuppliers();
        fetchPurchaseReturn(id);
    }, []);

    const selectedStatus = purchaseReturn && purchaseReturn.attributes && purchaseReturn.attributes.status;

    const itemsValue = purchaseReturn && purchaseReturn.attributes && {
        date: purchaseReturn.attributes.date,
        warehouse_id: {
            value: purchaseReturn.attributes.warehouse_id,
            label: purchaseReturn.attributes.warehouse_name,
        },
        supplier_id: {
            value: purchaseReturn.attributes.supplier_id,
            label: purchaseReturn.attributes.supplier_name,
        },
        orderTax: purchaseReturn.attributes.tax_rate,
        tax_amount: purchaseReturn.attributes.tax_amount,
        discount: purchaseReturn.attributes.discount,
        shipping: purchaseReturn.attributes.shipping,
        grand_total: purchaseReturn.attributes.grand_total,
        purchase_return_items: purchaseReturn.attributes.purchase_return_items.map((item) => ({
            code: item.product && item.product.code,
            name: item.product && item.product.name,
            product_unit: item.product.product_unit,
            product_id: item.product_id,
            short_name: item.purchase_unit && item.purchase_unit.short_name,
            stock_alert: item.product && item.product.stock_alert,
            product_cost: item.product_cost,
            fix_net_unit: item.product_cost,
            net_unit_cost: item.product_cost,
            tax_type: item.tax_type,
            tax_value: item.tax_value,
            tax_amount: item.tax_amount,
            discount_type: item.discount_type,
            discount_value: item.discount_value,
            discount_amount: item.discount_amount,
            sub_total: item.sub_total,
            purchase_unit: item.purchase_unit && item.purchase_unit.id,
            quantity: item.quantity,
            stock: item.product && item.product.stocks.filter(items => items.warehouse_id === purchaseReturn.attributes.warehouse_id),
            id: item.product_id,
            purchase_return_item_id: item.id,
            newItem: '',
            isEdit: true
        })),
        id: purchaseReturn.id,
        notes: purchaseReturn.attributes.notes,
        status_id: {
            label: selectedStatus === 1 ? 'Received' : selectedStatus === 2 ? 'Pending' : 'Ordered',
            value: selectedStatus
        }
    };

    return (
        <MasterLayout>
            <TopProgressBar />
            {isLoading ? <Spinner /> :
                <PurchaseReturnForm singlePurchase={itemsValue} id={id} warehouses={warehouses} suppliers={suppliers} />}
        </MasterLayout>
    );
};

const mapStateToProps = (state) => {
    const { warehouses, suppliers, purchaseReturn, isLoading } = state;
    return { warehouses, suppliers, purchaseReturn, isLoading };
};

export default connect(mapStateToProps, { fetchAllWarehouses, fetchAllSuppliers, fetchPurchaseReturn })(EditPurchaseReturn);
