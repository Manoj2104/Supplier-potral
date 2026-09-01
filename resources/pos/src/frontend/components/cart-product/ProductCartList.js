import React from "react";
import { connect, useDispatch } from "react-redux";
import {
    currencySymbolHandling,
    decimalValidate,
    getFormattedMessage,
} from "../../../shared/sharedMethod";
import { calculateProductCost } from "../../shared/SharedMethod";
import { addToast } from "../../../store/action/toastAction";
import { toastType } from "../../../constants";
import getInstantProductImage, { generateInstantProductSvg } from "../../../shared/instantProductSvg";



const ProductCartList = (props) => {
    const {
        singleProduct,
        index,
        onDeleteCartItem,
        frontSetting,
        setUpdateProducts,
        posAllProducts,
        allConfigData,
    } = props;

    const dispatch = useDispatch();

    // Get available stock for this product from the full catalog
    const stockEntry = posAllProducts
        ? posAllProducts.find((p) => p.id === singleProduct.id)
        : null;
    const availableStock = stockEntry
        ? stockEntry.attributes.stock.quantity
        : Infinity;

    // ── Increment quantity ────────────────────────────────────────────────────
    const handleIncrement = () => {
        setUpdateProducts((prev) =>
            prev.map((item) => {
                if (item.id !== singleProduct.id) return item;
                if (item.quantity >= availableStock) {
                    dispatch(addToast({
                        text: getFormattedMessage("pos.product-quantity-error.message"),
                        type: toastType.ERROR,
                    }));
                    return item;
                }
                return { ...item, quantity: item.quantity + 1 };
            })
        );
    };

    // ── Decrement quantity ────────────────────────────────────────────────────
    const handleDecrement = () => {
        setUpdateProducts((prev) =>
            prev.map((item) => {
                if (item.id !== singleProduct.id) return item;
                if (item.quantity <= 1) return item; // prevent going below 1
                return { ...item, quantity: item.quantity - 1 };
            })
        );
    };

    // ── Manual quantity input ─────────────────────────────────────────────────
    const handleChange = (e) => {
        e.preventDefault();
        const val = e.target.value;
        if (val.match(/\./g)) {
            const [, decimal] = val.split(".");
            if (decimal?.length > 2) return;
        }
        const numVal = Number(val);
        setUpdateProducts((prev) =>
            prev.map((item) => {
                if (item.id !== singleProduct.id) return item;
                if (numVal > availableStock) {
                    dispatch(addToast({
                        text: getFormattedMessage("pos.product-quantity-error.message"),
                        type: toastType.ERROR,
                    }));
                    return { ...item, quantity: availableStock };
                }
                return { ...item, quantity: numVal };
            })
        );
    };

    // ── Product image (Instant 0ms) ───────────────────────────────────────────
    const getImage = () => {
        const rawImages = singleProduct.image_url || singleProduct.images || singleProduct.attributes?.image_url;
        const name = singleProduct.name || singleProduct.attributes?.name || '';
        const cat = singleProduct.product_category_name || singleProduct.attributes?.product_category_name || '';
        return getInstantProductImage(rawImages, name, cat);
    };


    const sym = frontSetting.value && frontSetting.value.currency_symbol;
    const unitCost = calculateProductCost(singleProduct);
    const subtotal = unitCost * singleProduct.quantity;

    return (
        <tr key={index} className="align-middle border-bottom" style={{ verticalAlign: "middle" }}>

            {/* 1. Thumbnail (#) */}
            <td className="ps-2 pe-1" style={{ width: "36px" }}>
                <img
                    src={getImage()}
                    alt={singleProduct.name}
                    style={{
                        width: "34px",
                        height: "34px",
                        objectFit: "contain",
                        borderRadius: "6px",
                        border: "1px solid #E2E8F0",
                        background: "#F8FAFC",
                    }}
                    onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=100&auto=format&fit=crop&q=80";
                    }}
                />
            </td>

            {/* 2. ITEM DETAILS */}
            <td className="ps-0" style={{ maxWidth: "160px" }}>
                <div
                    className="fw-semibold text-dark text-truncate"
                    style={{ fontSize: "11px", lineHeight: 1.3 }}
                    title={singleProduct.name}
                >
                    {singleProduct.name}
                </div>
                <div style={{ fontSize: "9px", color: "#2563EB", fontWeight: 600 }}>
                    SKU: {singleProduct.code}
                </div>
            </td>

            {/* 3. QTY */}
            <td style={{ width: "80px" }}>
                <div
                    className="d-flex align-items-center border rounded-2"
                    style={{ width: "fit-content", background: "#F8FAFC" }}
                >
                    <button
                        type="button"
                        className="btn btn-sm p-0 border-0 text-danger fw-bold"
                        style={{ width: "22px", height: "22px", lineHeight: 1, fontSize: "14px" }}
                        onClick={handleDecrement}
                    >
                        −
                    </button>
                    <input
                        type="number"
                        value={singleProduct.quantity}
                        min="1"
                        className="border-0 bg-transparent text-center fw-bold text-dark p-0"
                        style={{ width: "26px", fontSize: "11px", outline: "none" }}
                        onKeyPress={(e) => decimalValidate(e)}
                        onChange={handleChange}
                    />
                    <button
                        type="button"
                        className="btn btn-sm p-0 border-0 text-success fw-bold"
                        style={{ width: "22px", height: "22px", lineHeight: 1, fontSize: "14px" }}
                        onClick={handleIncrement}
                    >
                        +
                    </button>
                </div>
            </td>

            {/* 4. PRICE */}
            <td className="text-nowrap fw-semibold text-dark" style={{ fontSize: "11px" }}>
                {currencySymbolHandling(allConfigData, sym, unitCost)}
            </td>

            {/* 5. DISC % */}
            <td className="text-nowrap text-muted" style={{ fontSize: "11px" }}>
                {singleProduct.discount_value ? `${singleProduct.discount_value}${singleProduct.discount_type === 1 ? '%' : ''}` : '0.00'}
            </td>

            {/* 6. TAX % */}
            <td className="text-nowrap text-muted" style={{ fontSize: "11px" }}>
                {singleProduct.tax_rate ? `${singleProduct.tax_rate}%` : '0.00%'}
            </td>

            {/* 7. TOTAL (Line Subtotal) */}
            <td className="text-nowrap text-end fw-extrabold text-dark pe-2" style={{ fontSize: "11.5px", color: "#0F172A" }}>
                {currencySymbolHandling(allConfigData, sym, subtotal)}
            </td>

            {/* 8. Action Delete */}
            <td className="text-end pe-2" style={{ width: "28px" }}>
                <button
                    type="button"
                    className="btn btn-sm p-0 border-0"
                    style={{ color: "#EF4444", lineHeight: 1 }}
                    onClick={() => onDeleteCartItem(singleProduct.id)}
                    title="Remove item"
                >
                    <i className="bi bi-trash3" style={{ fontSize: "12px" }} />
                </button>
            </td>
        </tr>
    );
};

const mapStateToProps = (state) => ({
    posAllProducts: state.posAllProducts,
    allConfigData: state.allConfigData,
});

export default connect(mapStateToProps, null)(ProductCartList);
