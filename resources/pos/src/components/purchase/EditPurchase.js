import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import MasterLayout from '../MasterLayout';
import { fetchAllWarehouses } from '../../store/action/warehouseAction';
import { fetchAllSuppliers } from '../../store/action/supplierAction';
import { fetchPurchase } from '../../store/action/purchaseAction';
import PurchaseForm from './PurchaseForm';
import { getFormattedMessage } from '../../shared/sharedMethod';
import Spinner from "../../shared/components/loaders/Spinner";
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";

const EditPurchase = (props) => {
    const { fetchAllWarehouses, fetchAllSuppliers, fetchPurchase, purchase, warehouses, suppliers, isLoading } = props;
    const { id } = useParams();

    useEffect(() => {
        fetchAllWarehouses();
        fetchAllSuppliers();
        fetchPurchase(id);
    }, [id]);

    const selectedStatus = purchase && purchase.attributes && purchase.attributes.status;

    const itemsValue = purchase && purchase.attributes && {
        date: purchase.attributes.date,
        warehouse_id: {
            value: purchase.attributes.warehouse_id,
            label: purchase.attributes.warehouse_name,
        },
        supplier_id: {
            value: purchase.attributes.supplier_id,
            label: purchase.attributes.supplier_name,
        },
        tax_rate: purchase.attributes.tax_rate,
        tax_amount: purchase.attributes.tax_amount,
        discount: purchase.attributes.discount,
        shipping: purchase.attributes.shipping,
        grand_total: purchase.attributes.grand_total,
        purchase_items: (purchase.attributes.purchase_items || []).map((item) => ({
            code: item.product && item.product.code,
            name: item.product && item.product.name,
            product_unit: item.product && item.product.product_unit,
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
            stock: item.product && item.product.stocks ? item.product.stocks.filter(items => items.warehouse_id === purchase.attributes.warehouse_id) : [],
            id: item.product_id,
            purchase_item_id: item.id,
            newItem: '',
            isEdit: true
        })),
        id: purchase.id,
        notes: purchase.attributes.notes,
        status_id: {
            label: selectedStatus === 1 ? 'Received' : selectedStatus === 2 ? 'Pending' : 'Ordered',
            value: selectedStatus
        }
    };

    return (
        <MasterLayout>
            <TopProgressBar />
            {isLoading ? (
                <Spinner />
            ) : itemsValue ? (
                <PurchaseForm singlePurchase={itemsValue} id={id} warehouses={warehouses} suppliers={suppliers} />
            ) : (
                <div style={{ maxWidth: '540px', margin: '80px auto', padding: '40px 30px', background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px' }}>
                        📋
                    </div>
                    <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>Purchase Order Not Found</h3>
                    <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
                        The requested Purchase Order could not be found or has expired.
                    </p>
                    <Link to="/app/purchases" className="btn btn-primary fw-bold" style={{ borderRadius: '10px', padding: '10px 24px', background: '#2563EB', border: 'none' }}>
                        ← Back to Purchase Orders
                    </Link>
                </div>
            )}
        </MasterLayout>
    );
};

const mapStateToProps = (state) => {
    const { warehouses, suppliers, purchase, isLoading } = state;
    return { warehouses, suppliers, purchase, isLoading };
};

export default connect(mapStateToProps, { fetchAllWarehouses, fetchAllSuppliers, fetchPurchase })(EditPurchase);
