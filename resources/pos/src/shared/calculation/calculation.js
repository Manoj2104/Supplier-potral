export const getSafeFixNetUnit = (cartItem) => {
    if (!cartItem) return 0;
    const val = cartItem.fix_net_unit ?? cartItem.product_cost ?? cartItem.net_unit_cost ?? cartItem.product_price ?? 0;
    const num = Number(val);
    return isNaN(num) ? 0 : num;
};

export const discountAmount = (cartItem) => {
    if (!cartItem) return 0;
    const fixNetUnit = getSafeFixNetUnit(cartItem);
    const discVal = Number(cartItem.discount_value) || 0;
    const discType = cartItem.discount_type;

    if (discType === '1' || discType === 1) {
        return (fixNetUnit / 100) * discVal;
    } else if (discType === '2' || discType === 2) {
        return discVal;
    }
    const discAmt = Number(cartItem.discount_amount) || 0;
    return isNaN(discAmt) ? 0 : discAmt;
};

export const discountAmountMultiply = (cartItem) => {
    if (!cartItem) return "0.00";
    const qty = Number(cartItem.quantity) || 0;
    let discountMultiply = discountAmount(cartItem);
    const res = Number(discountMultiply * qty);
    return isNaN(res) ? "0.00" : res.toFixed(2);
};

export const taxAmount = (cartItem) => {
    if (!cartItem) return 0;
    const fixNetUnit = getSafeFixNetUnit(cartItem);
    const taxVal = Number(cartItem.tax_value) || 0;
    const discAmt = discountAmount(cartItem);
    const taxType = cartItem.tax_type;

    if (taxType === '2' || taxType === 2) {
        return ((fixNetUnit - discAmt) * taxVal) / (100 + taxVal);
    } else if (taxType === '1' || taxType === 1) {
        return ((fixNetUnit - discAmt) * taxVal) / 100;
    }

    const taxAmt = Number(cartItem.tax_amount) || 0;
    return isNaN(taxAmt) ? 0 : taxAmt;
};

export const taxAmountMultiply = (cartItem) => {
    if (!cartItem) return "0.00";
    const qty = Number(cartItem.quantity) || 0;
    let taxMultiply = taxAmount(cartItem);
    const res = Number(taxMultiply * qty);
    return isNaN(res) ? "0.00" : res.toFixed(2);
};

export const amountBeforeTax = (cartItem) => {
    if (!cartItem) return 0;
    let price = getSafeFixNetUnit(cartItem);
    const unitCost = price - discountAmount(cartItem);
    const inclusiveTax = unitCost - taxAmount(cartItem);
    let finalCalPrice = (cartItem.tax_type === '1' || cartItem.tax_type === 1) ? unitCost : inclusiveTax;
    const res = Number(finalCalPrice);
    return isNaN(res) ? 0 : Number(res.toFixed(2));
};

export const subTotalCount = (cartItem) => {
    if (!cartItem) return "0.00";
    const qty = Number(cartItem.quantity) || 0;
    const totalAmount = taxAmount(cartItem) + amountBeforeTax(cartItem);
    const res = Number(totalAmount * qty);
    return isNaN(res) ? "0.00" : res.toFixed(2);
};

// Grand Total Calculation
export const calculateCartTotalTaxAmount = (carts, inputValue) => {
    if (!carts || !Array.isArray(carts)) return "0.00";
    let taxValue = inputValue && Number(inputValue.tax_rate) || 0;
    let totalTax = 0;
    let price = 0;

    carts.forEach(cartItem => {
        const qty = Number(cartItem.quantity) || 0;
        const subTot = Number(subTotalCount(cartItem)) || 0;
        if (taxValue > 0) {
            price = price + subTot;
            const disc = Number(inputValue?.discount) || 0;
            totalTax = (((price - disc) / 100) * taxValue) * qty;
        }
    });

    return isNaN(totalTax) ? "0.00" : parseFloat(totalTax).toFixed(2);
};

export const calculateSubTotal = (carts) => {
    if (!carts || !Array.isArray(carts)) return 0;
    let subTotalAmount = 0;
    carts.forEach(cartItem => {
        subTotalAmount = subTotalAmount + Number(subTotalCount(cartItem));
    });
    return isNaN(subTotalAmount) ? 0 : Number(subTotalAmount);
};

export const calculateCartTotalAmount = (carts, inputValue) => {
    if (!carts || !Array.isArray(carts)) return "0.00";
    const value = inputValue || {};
    const disc = Number(value.discount) || 0;
    const taxRate = Number(value.tax_rate) || 0;
    const shipping = Number(value.shipping) || 0;
    const otherCharges = Number(value.other_charges) || 0;
    const roundOff = Number(value.round_off) || 0;

    let totalAmountAfterDiscount = calculateSubTotal(carts) - disc;
    let taxCal = (totalAmountAfterDiscount * taxRate) / 100;
    let finalTotalAmount = Number(totalAmountAfterDiscount) + Number(taxCal) + Number(shipping) + Number(otherCharges) + Number(roundOff);
    return isNaN(finalTotalAmount) ? "0.00" : parseFloat(finalTotalAmount).toFixed(2);
};
