export const preparePurchaseReturnArray = (products = []) => {
    let purchaseProductRowArray = [];
    (products || []).forEach(product => {
        const attr = product?.attributes || product || {};
        const unitName = attr.purchase_unit_name || attr.product_unit_name || {};
        const shortName = typeof unitName === 'object' ? (unitName?.short_name || unitName?.name || 'pc') : (unitName || 'pc');
        const cost = parseFloat(attr.product_cost || attr.net_unit_cost || 0);

        purchaseProductRowArray.push({
            name: attr.name || 'Product',
            code: attr.code || attr.product_code || '—',
            stock: attr.stock?.quantity ?? attr.stock ?? attr.in_stock ?? 100,
            short_name: shortName,
            product_unit: attr.product_unit || 1,
            product_id: product?.id || attr.product_id || attr.id,
            product_cost: cost,
            net_unit_cost: cost,
            fix_net_unit: cost,
            tax_type: String(attr.tax_type || '1'),
            tax_value: attr.order_tax ? parseFloat(attr.order_tax) : (attr.tax_value ? parseFloat(attr.tax_value) : 0.00),
            tax_amount: parseFloat(attr.tax_amount || 0.00),
            discount_type: String(attr.discount_type || '2'),
            discount_value: parseFloat(attr.discount_value || 0.00),
            discount_amount: parseFloat(attr.discount_amount || 0.00),
            purchase_unit: (typeof unitName === 'object' ? unitName?.id : unitName) || attr.purchase_unit || 1,
            quantity: parseFloat(attr.quantity || 1),
            sub_total: parseFloat(attr.sub_total || cost),
            id: product?.id || attr.product_id || attr.id,
            purchase_return_item_id: ''
        });
    });
    return purchaseProductRowArray;
};
