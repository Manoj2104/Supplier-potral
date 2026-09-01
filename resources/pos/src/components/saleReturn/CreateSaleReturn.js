import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import SaleReturnForm from './SaleReturnForm';
import MasterLayout from '../MasterLayout';
import { fetchAllCustomer } from '../../store/action/customerAction';
import { fetchAllWarehouses } from '../../store/action/warehouseAction';
import { addSaleReturn } from '../../store/action/salesReturnAction';
import { useParams } from "react-router-dom";
import { fetchSale } from "../../store/action/salesAction";
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";
import Spinner from "../../shared/components/loaders/Spinner";
import saleReturnStatus from "./saleReturnStatus.json";

const CreateSaleReturn = ( props ) => {
    const { addSaleReturn, customers, sales, isLoading, fetchSale, fetchAllCustomer, warehouses, fetchAllWarehouses } = props;

    const { id } = useParams();

    useEffect( () => {
        fetchAllCustomer();
        fetchAllWarehouses();
        if (id) {
            fetchSale( id );
        }
    }, [id] );

    const addSaleData = ( formValue, navigate ) => {
        addSaleReturn( formValue, navigate );
    };

    // Safely extract target sale whether sales is an Array or single Object
    const targetSale = Array.isArray(sales)
        ? sales.find((s) => String(s.id) === String(id))
        : (sales && (sales.id || sales.attributes) ? sales : null);

    const rawItems = targetSale && targetSale.attributes
        ? (targetSale.attributes.sale_items || targetSale.attributes.saleItems || [])
        : [];

    const itemsValue = targetSale && targetSale.attributes && {
        date: targetSale.attributes.date,
        warehouse_id: {
            value: targetSale.attributes.warehouse_id,
            label: targetSale.attributes.warehouse_name,
        },
        customer_id: {
            value: targetSale.attributes.customer_id,
            label: targetSale.attributes.customer_name,
        },
        tax_rate: 0,
        tax_amount: 0,
        discount: 0,
        shipping: 0,
        grand_total: targetSale.attributes.grand_total || 0,
        amount: targetSale.attributes.amount,
        sale_items: rawItems.map( ( item ) => {
            const itemAttr = item.attributes ? item.attributes : item;
            const productObj = itemAttr.product || item.product || {};
            const productAttr = productObj.attributes ? productObj.attributes : productObj;

            return {
                code: productAttr.code || itemAttr.code || '',
                name: productAttr.name || itemAttr.name || (productObj.name ? productObj.name : ('Product #' + (itemAttr.product_id || item.product_id))),
                product_unit: productAttr.product_unit || itemAttr.product_unit || 'pc',
                product_id: Number(itemAttr.product_id || item.product_id),
                short_name: itemAttr.sale_unit && itemAttr.sale_unit.short_name ? itemAttr.sale_unit.short_name : 'pc',
                stock_alert: productAttr.stock_alert || '',
                product_price: itemAttr.product_price || 0,
                fix_net_unit: itemAttr.product_price || 0,
                net_unit_price: itemAttr.net_unit_price || itemAttr.product_price || 0,
                tax_type: itemAttr.tax_type || 1,
                tax_value: itemAttr.tax_value || 0,
                tax_amount: itemAttr.tax_amount || 0,
                discount_type: itemAttr.discount_type || 1,
                discount_value: itemAttr.discount_value || 0,
                discount_amount: itemAttr.discount_amount || 0,
                isEdit: true,
                stock: 100,
                sold_quantity: itemAttr.quantity || 1,
                sub_total: itemAttr.sub_total || 0,
                sale_unit: itemAttr.sale_unit && itemAttr.sale_unit.id ? itemAttr.sale_unit.id : 1,
                quantity: itemAttr.quantity || 1,
                id: item.id || itemAttr.id,
                sale_item_id: item.id || itemAttr.id,
                newItem: '',
                isSaleReturn: true,
            };
        } ),
        id: Number(targetSale.id),
        sale_id: Number(targetSale.id),
        status_id: targetSale.attributes.status,
        note: targetSale.attributes.note,
        sale_reference: targetSale.attributes.reference_code,
        isCreateSaleReturn: true,
    };

    return (
        <MasterLayout>
            <TopProgressBar />
            {isLoading ? <Spinner /> :
                targetSale && itemsValue && <SaleReturnForm addSaleData={addSaleData} singleSale={itemsValue} id={id} customers={customers} warehouses={warehouses} />}
        </MasterLayout>
    );
};

const mapStateToProps = ( state ) => {
    const { customers, sales, warehouses, totalRecord, isLoading, addSaleReturn } = state;
    return { customers, sales, warehouses, totalRecord, isLoading, addSaleReturn };
};

export default connect( mapStateToProps, { addSaleReturn, fetchSale, fetchAllCustomer, fetchAllWarehouses } )( CreateSaleReturn );
