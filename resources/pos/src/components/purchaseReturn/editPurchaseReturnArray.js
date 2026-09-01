export const editPurchaseReturnArray = (products = [], warehouse_id) => {
    let purchaseProductRowArray = [];
    (products || []).forEach(product => {
        const prod = product?.product || {};
        const unit = product?.purchase_unit || prod?.purchase_unit_name || {};
        const shortName = typeof unit === 'object' ? (unit?.short_name || unit?.name || 'pc') : (unit || 'pc');
        const cost = parseFloat(product?.product_cost || product?.net_unit_cost || prod?.product_cost || 0);

        purchaseProductRowArray.push({
            name: product?.name || prod?.name || 'Product',
            code: prod?.code || prod?.product_code || product?.code || '—',
            product_unit: prod?.product_unit || 1,
            product_id: product?.product_id || prod?.id || product?.id,
            short_name: shortName,
            stock_alert: prod?.stock_alert || 0,
            product_cost: cost,
            fix_net_unit: cost,
            net_unit_cost: cost,
            tax_type: String(product?.tax_type || '1'),
            tax_value: parseFloat(product?.tax_value || 0),
            tax_amount: parseFloat(product?.tax_amount || 0),
            discount_type: String(product?.discount_type || '2'),
            discount_value: parseFloat(product?.discount_value || 0),
            discount_amount: parseFloat(product?.discount_amount || 0),
            purchase_unit: (typeof unit === 'object' ? unit?.id : unit) || product?.purchase_unit || 1,
            quantity: parseFloat(product?.quantity || 1),
            sub_total: Number(product?.sub_total || cost),
            id: product?.id,
            purchase_return_item_id: product?.id,
            newItem: '',
            isEdit: true,
            stocks: Array.isArray(prod?.stocks) ? prod.stocks.filter(item => item.warehouse_id === warehouse_id) : []
        });
    });
    return purchaseProductRowArray;
};
