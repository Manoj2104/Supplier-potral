import React, { useEffect, useState } from "react";
import { InputGroup } from "react-bootstrap-v5";
import { connect } from "react-redux";
import ProductModal from "./ProductModal";
import Form from "react-bootstrap/Form";
import {
    taxAmountMultiply,
    discountAmountMultiply,
    subTotalCount,
    amountBeforeTax,
} from "../../calculation/calculation";
import { productUnitDropdown } from "../../../store/action/productUnitAction";
import { currencySymbolHandling, decimalValidate } from "../../sharedMethod";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencil, faTrash } from "@fortawesome/free-solid-svg-icons";

const PurchaseTable = (props) => {
    const {
        singleProduct,
        index,
        updateCost,
        updateDiscount,
        updateProducts,
        setUpdateProducts,
        frontSetting,
        updateTax,
        updateSubTotal,
        productUnitDropdown,
        productUnits,
        updatePurchaseUnit,
        allConfigData,
    } = props;
    const [updateData, setUpdateData] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [modalId, setModalId] = useState(null);

    useEffect(() => {
        if (singleProduct && singleProduct.product_unit) {
            productUnitDropdown(singleProduct.product_unit);
        }
    }, [updateData, singleProduct?.purchase_unit]);

    const onDeleteCartItem = (id) => {
        const newProduct = updateProducts.filter((item) => item.id !== id);
        setUpdateProducts(newProduct);
    };

    const handleClose = (e) => {
        e.preventDefault();
        setIsOpen(!isOpen);
        e.stopPropagation();
        productUnitDropdown(singleProduct.product_unit);
        setModalId(singleProduct.id);
    };

    const onProductUpdateInCart = (item) => {
        setUpdateData(item);
    };

    const handleIncrement = () => {
        setUpdateProducts((updateProducts) =>
            updateProducts.map((item) =>
                item.id === singleProduct.id
                    ? { ...item, quantity: item.quantity++ + 1 }
                    : item
            )
        );
    };

    const handleDecrement = () => {
        if (singleProduct.quantity - 1 > 0.0) {
            setUpdateProducts((updateProducts) =>
                updateProducts.map((item) =>
                    item.id === singleProduct.id
                        ? {
                              ...item,
                              quantity:
                                  item.quantity > 0.0 && item.quantity-- - 1,
                          }
                        : item
                )
            );
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        const { value } = e.target;
        // check if value includes a decimal point
        if (value.match(/\./g)) {
            const [, decimal] = value.split(".");
            // restrict value to only 2 decimal places
            if (decimal?.length > 2) {
                // do nothing
                return;
            }
        }
        setUpdateProducts((updateProducts) =>
            updateProducts.map((item) =>
                item.id === singleProduct.id
                    ? { ...item, quantity: Number(value) }
                    : item
            )
        );
    };

    return (
        <>
            <tr key={index} className="align-middle" style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: '800', fontSize: '14px', color: '#0F172A', marginBottom: '3px' }}>
                        {singleProduct?.name}
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <span style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#64748B', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', fontFamily: 'monospace' }}>
                            {singleProduct?.code || singleProduct?.barcode || '—'}
                        </span>
                        <button
                            type="button"
                            onClick={(e) => handleClose(e)}
                            style={{ width: '22px', height: '22px', borderRadius: '6px', border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#64748B', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                            title="Edit Product Details"
                        >
                            <FontAwesomeIcon icon={faPencil} style={{ fontSize: '10px' }} />
                        </button>
                    </div>
                </td>
                <td style={{ padding: '14px 16px', fontWeight: '700', fontSize: '13.5px', color: '#0F172A' }}>
                    {currencySymbolHandling(
                        allConfigData,
                        frontSetting.value &&
                            frontSetting.value.currency_symbol,
                        amountBeforeTax(singleProduct)
                    )}
                </td>
                <td style={{ padding: '14px 16px' }}>
                    <span style={{
                        background: (Number(singleProduct.stock) > 0 ? '#DCFCE7' : '#FEE2E2'),
                        color: (Number(singleProduct.stock) > 0 ? '#15803D' : '#DC2626'),
                        fontSize: '11.5px',
                        fontWeight: '800',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        ● {singleProduct.stock || 0} {singleProduct.short_name || 'pc'}
                    </span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '10px', padding: '3px 4px', gap: '3px' }}>
                        <button
                            type="button"
                            style={{ width: '28px', height: '28px', borderRadius: '7px', border: 'none', background: '#FFFFFF', color: '#0F172A', fontWeight: '800', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                            onClick={() => handleDecrement()}
                        >
                            −
                        </button>
                        <input
                            type="number"
                            value={singleProduct.quantity}
                            onChange={(e) => handleChange(e)}
                            onKeyPress={(event) => decimalValidate(event)}
                            min={0}
                            style={{ width: '42px', height: '28px', border: 'none', background: 'transparent', textAlign: 'center', fontWeight: '800', fontSize: '14px', color: '#0F172A', outline: 'none', MozAppearance: 'textfield' }}
                        />
                        <button
                            type="button"
                            style={{ width: '28px', height: '28px', borderRadius: '7px', border: 'none', background: '#16A34A', color: '#FFFFFF', fontWeight: '800', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 6px rgba(22,163,74,0.25)' }}
                            onClick={() => handleIncrement()}
                        >
                            +
                        </button>
                    </div>
                </td>
                <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748B', fontWeight: '600' }}>
                    {currencySymbolHandling(
                        allConfigData,
                        frontSetting.value &&
                            frontSetting.value.currency_symbol,
                        discountAmountMultiply(singleProduct)
                    )}
                </td>
                <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748B', fontWeight: '600' }}>
                    {currencySymbolHandling(
                        allConfigData,
                        frontSetting.value &&
                            frontSetting.value.currency_symbol,
                        taxAmountMultiply(singleProduct)
                    )}
                </td>
                <td style={{ padding: '14px 16px', fontWeight: '900', fontSize: '14px', color: '#15803D' }}>
                    {currencySymbolHandling(
                        allConfigData,
                        frontSetting.value &&
                            frontSetting.value.currency_symbol,
                        subTotalCount(singleProduct)
                    )}
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <button
                        type="button"
                        onClick={() => onDeleteCartItem(singleProduct.id)}
                        style={{ width: '34px', height: '34px', borderRadius: '8px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s ease' }}
                        title="Remove item"
                    >
                        <FontAwesomeIcon icon={faTrash} style={{ fontSize: '12.5px' }} />
                    </button>
                </td>
            </tr>
            <ProductModal
                handleClose={handleClose}
                setIsOpen={setIsOpen}
                show={isOpen}
                modalId={modalId}
                isOpen={isOpen}
                frontSetting={frontSetting}
                product={singleProduct}
                id={singleProduct.id}
                productUnits={productUnits}
                updatePurchaseUnit={updatePurchaseUnit}
                updateProducts={updateProducts}
                title={singleProduct.name}
                onProductUpdateInCart={onProductUpdateInCart}
                updateSubTotal={updateSubTotal}
                updateCost={updateCost}
                updateDiscount={updateDiscount}
                updateTax={updateTax}
            />
        </>
    );
};

const mapStateToProps = (state) => {
    const { productUnits, frontSetting, allConfigData } = state;
    return { productUnits, frontSetting, allConfigData };
};

export default connect(mapStateToProps, { productUnitDropdown })(PurchaseTable);
