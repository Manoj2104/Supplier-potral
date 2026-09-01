export const preparePurchaseProductArray = (products, isBarcode) => {
    let purchaseProductRowArray = [];
    products.forEach(product => {
        const attr = product.attributes || {};
        const cost = Number(attr.product_cost) || Number(attr.product_price) || Number(attr.price) || 0;

        purchaseProductRowArray.push({
            name: attr.name || product.name || "",
            code: attr.code || product.code || "",
            barcode_url: attr.barcode_url || "",
            stock: attr.stock ? (typeof attr.stock === 'object' ? attr.stock.quantity : attr.stock) : 0,
            short_name: attr.purchase_unit_name?.short_name || attr.product_unit_name?.short_name || "pc",
            product_unit: attr.product_unit || 1,
            product_id: product.id,
            product_cost: cost,
            net_unit_cost: cost,
            fix_net_unit: cost,
            tax_type: attr.tax_type ? attr.tax_type : 1,
            tax_value: attr.order_tax ? attr.order_tax : 0.00,
            tax_amount: 0.00,
            discount_type: '2',
            discount_value: 0.00,
            discount_amount: 0.00,
            purchase_unit: attr.purchase_unit || 1,
            quantity: isBarcode ? 10 : 1,
            sub_total: cost,
            id: product.id,
            purchase_item_id: '',
            product_price: Number(attr.product_price) || cost
        });
    });
    return purchaseProductRowArray;
};
