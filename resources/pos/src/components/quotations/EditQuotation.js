import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { useParams } from 'react-router-dom';
import MasterLayout from '../MasterLayout';
import { fetchAllCustomer } from '../../store/action/customerAction';
import { fetchAllWarehouses } from '../../store/action/warehouseAction';
import { fetchQuotation } from '../../store/action/quotationAction';
import { getFormattedMessage } from '../../shared/sharedMethod';
import { quotationStatusOptions } from '../../constants';
import QuotationForm from './QuotationForm';
import Spinner from "../../shared/components/loaders/Spinner";
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";

const EditQuotation = (props) => {
    const { customers, fetchAllCustomer, warehouses, fetchAllWarehouses, isLoading, fetchQuotation, quotation } = props;
    const { id } = useParams();

    useEffect(() => {
        fetchAllCustomer();
        fetchAllWarehouses();
        fetchQuotation(id);
    }, []);

    const selectedStatus = quotation && quotation.attributes && quotationStatusOptions.filter((item) => item.value === quotation.attributes.status);

    const itemsValue = quotation && quotation.attributes && {
        date: quotation.attributes.date,
        customer_id: {
            value: quotation.attributes.customer_id,
            label: quotation.attributes.customer_name,
        },
        warehouse_id: {
            value: quotation.attributes.warehouse_id,
            label: quotation.attributes.warehouse_name,
        },
        tax_rate: quotation.attributes.tax_rate,
        tax_amount: quotation.attributes.tax_amount,
        discount: quotation.attributes.discount,
        shipping: quotation.attributes.shipping,
        grand_total: quotation.attributes.grand_total,
        quotation_items: quotation.attributes.quotation_items.map((item) => ({
            code: item.product && item.product.code,
            name: item.product && item.product.name,
            product_unit: item.product.product_unit,
            product_id: item.product_id,
            short_name: item.sale_unit && item.sale_unit.short_name,
            stock_alert: item.product && item.product.stock_alert,
            product_price: item.product_price,
            fix_net_unit: item.product_price,
            net_unit_price: item.product_price,
            tax_type: item.tax_type,
            tax_value: item.tax_value,
            tax_amount: item.tax_amount,
            discount_type: item.discount_type,
            discount_value: item.discount_value,
            discount_amount: item.discount_amount,
            sub_total: item.sub_total,
            sale_unit: item.sale_unit && item.sale_unit.id,
            quantity: item.quantity,
            stock: item.product && item.product.stocks.filter(items => items.warehouse_id === quotation.attributes.warehouse_id),
            id: item.product_id,
            quotation_item_id: item.id,
            newItem: '',
            isEdit: true
        })),
        id: quotation.id,
        notes: quotation.attributes.note,
        status_id: {
            label: selectedStatus && selectedStatus[0] && selectedStatus[0].label,
            value: selectedStatus && selectedStatus[0] && selectedStatus[0].value
        }
    };

    return (
        <MasterLayout>
            <TopProgressBar />
            {isLoading ? <Spinner /> :
                <QuotationForm singleQuotation={itemsValue} id={id} customers={customers} warehouses={warehouses} />}
        </MasterLayout>
    );
};

const mapStateToProps = (state) => {
    const { customers, warehouses, isLoading, quotation } = state;
    return { customers, warehouses, isLoading, quotation };
};

export default connect(mapStateToProps, { fetchAllCustomer, fetchAllWarehouses, fetchQuotation })(EditQuotation);
