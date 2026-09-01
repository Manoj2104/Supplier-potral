import React, { useEffect, useState } from "react";
import { InputGroup } from "react-bootstrap-v5";
import { connect, useDispatch } from "react-redux";
import Form from "react-bootstrap/Form";
import {
    taxAmountMultiply,
    discountAmountMultiply,
    subTotalCount,
    amountBeforeTax,
} from "../../calculation/calculation";
import ProductModal from "./ProductModal";
import { productSalesDropdown } from "../../../store/action/productSaleUnitAction";
import {
    currencySymbolHandling,
    decimalValidate,
    getFormattedMessage,
    numValidate,
} from "../../sharedMethod";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencil, faTrash } from "@fortawesome/free-solid-svg-icons";
import { addToast } from "../../../store/action/toastAction";
import { toastType } from "../../../constants";

const ProductTableBody = (props) => {
    const {
        singleProduct,
        index,
        updateProducts,
        setUpdateProducts,
        productSales,
        productSalesDropdown,
        updateCost,
        updateDiscount,
        updateTax,
        updateSubTotal,
        updateSaleUnit,
        frontSetting,
        allConfigData,
    } = props;
    const [isShowModal, setIsShowModal] = useState(false);
    const [updateProductData, setUpdateProductData] = useState([]);
    const dispatch = useDispatch();

    useEffect(() => {
        singleProduct.newItem !== "" &&
            productSalesDropdown(singleProduct.product_unit);
    }, [updateProductData, singleProduct.sale_unit]);

    useEffect(() => {
        singleProduct.sub_total = Number(subTotalCount(singleProduct));
    }, [singleProduct.sub_total]);

    const onProductUpdateInCart = (item) => {
        setUpdateProductData(item);
    };

    const onDeleteCartItem = (id) => {
        const newProduct = updateProducts.filter((item) => item.id !== id);
        setUpdateProducts(newProduct);
    };

    const handleIncrement = () => {
        singleProduct.isSaleReturn || singleProduct.isSaleReturnEdit
            ? setUpdateProducts((updateProducts) =>
                  updateProducts.map((item) => {
                      if (item.id === singleProduct.id) {
                          if (item.quantity >= item.sold_quantity) {
                              dispatch(
                                  addToast({
                                      text: getFormattedMessage(
                                          "sale-return.product-qty.validate.message"
                                      ),
                                      type: toastType.ERROR,
                                  })
                              );
                              return item;
                          } else {
                              return { ...item, quantity: item.quantity++ + 1 };
                          }
                      } else {
                          return item;
                      }
                  })
              )
            : setUpdateProducts((updateProducts) =>
                  updateProducts.map((item) => {
                      if (item.id === singleProduct.id) {
                          const newQuantity = item.quantity + 1;
                          if (
                              item.quantity_limit &&
                              Number(item.quantity_limit) > 0 &&
                              newQuantity > Number(item.quantity_limit)
                          ) {
                              dispatch(
                                  addToast({
                                      text: getFormattedMessage(
                                          "sale.product-qty.limit.validate.message"
                                      ) || `Please enter less than ${item.quantity_limit} quantity`,
                                      type: toastType.ERROR,
                                  })
                              );
                              return { ...item };
                          }
                          return { ...item, quantity: newQuantity };
                      } else {
                          return item;
                      }
                  })
              );
    };

    const handleDecrement = () => {
        if (singleProduct.quantity - 1 > 0) {
            setUpdateProducts((updateProducts) =>
                updateProducts.map((item) =>
                    item.id === singleProduct.id
                        ? { ...item, quantity: item.quantity-- - 1 }
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

        singleProduct.isSaleReturn || singleProduct.isSaleReturnEdit
            ? setUpdateProducts((updateProducts) =>
                  updateProducts.map((item) => {
                      if (item.id === singleProduct.id) {
                          if (item.sold_quantity < Number(e.target.value)) {
                              dispatch(
                                  addToast({
                                      text: getFormattedMessage(
                                          "sale-return.product-qty.validate.message"
                                      ),
                                      type: toastType.ERROR,
                                  })
                              );
                              return { ...item, quantity: item.sold_quantity };
                          } else {
                              return {
                                  ...item,
                                  quantity: Number(e.target.value),
                              };
                          }
                      } else {
                          return item;
                      }
                  })
              )
            : setUpdateProducts((updateProducts) =>
                  updateProducts.map((item) =>
                      item.id === singleProduct.id
                          ? { ...item, quantity: Number(value) }
                          : item
                  )
              );
    };

    const onClickShowProductModal = () => {
        setIsShowModal(true);
        productSalesDropdown(singleProduct.product_unit);
    };

    return (
        <>
            <tr key={index} className="align-middle" style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: '800', fontSize: '14px', color: '#0F172A', marginBottom: '3px' }}>
                        {singleProduct.name}
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <span style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#64748B', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', fontFamily: 'monospace' }}>
                            {singleProduct.code || singleProduct.barcode || '—'}
                        </span>
                        {singleProduct.isSaleReturn !== true && singleProduct.isSaleReturnEdit !== true && (
                            <button
                                type="button"
                                onClick={(e) => onClickShowProductModal(e)}
                                style={{ width: '22px', height: '22px', borderRadius: '6px', border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#64748B', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                                title="Edit Product Details"
                            >
                                <FontAwesomeIcon icon={faPencil} style={{ fontSize: '10px' }} />
                            </button>
                        )}
                    </div>
                </td>
                <td style={{ padding: '14px 16px', fontWeight: '700', fontSize: '13.5px', color: '#0F172A' }}>
                    {currencySymbolHandling(
                        allConfigData,
                        frontSetting.value &&
                            frontSetting.value.currency_symbol,
                        amountBeforeTax(singleProduct).toFixed(2)
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
                            onClick={(e) => handleDecrement(e)}
                        >
                            −
                        </button>
                        <input
                            type="number"
                            value={singleProduct.quantity}
                            onChange={(e) => handleChange(e, singleProduct)}
                            onKeyPress={(event) => decimalValidate(event)}
                            min={0}
                            style={{ width: '42px', height: '28px', border: 'none', background: 'transparent', textAlign: 'center', fontWeight: '800', fontSize: '14px', color: '#0F172A', outline: 'none', MozAppearance: 'textfield' }}
                        />
                        <button
                            type="button"
                            style={{ width: '28px', height: '28px', borderRadius: '7px', border: 'none', background: '#16A34A', color: '#FFFFFF', fontWeight: '800', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 6px rgba(22,163,74,0.25)' }}
                            onClick={(e) => handleIncrement(e)}
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
                {singleProduct.isSaleReturn || singleProduct.isSaleReturnEdit ? null : (
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
                )}
            </tr>
            {isShowModal && (
                <ProductModal
                    product={singleProduct}
                    isShowModal={isShowModal}
                    frontSetting={frontSetting}
                    updateSubTotal={updateSubTotal}
                    setIsShowModal={setIsShowModal}
                    updateCost={updateCost}
                    updateDiscount={updateDiscount}
                    updateTax={updateTax}
                    productSales={productSales}
                    updateSaleUnit={updateSaleUnit}
                    onProductUpdateInCart={onProductUpdateInCart}
                />
            )}
        </>
    );
};

const mapStateToProps = (state) => {
    const { productSales, allConfigData } = state;
    return { productSales, allConfigData };
};

export default connect(mapStateToProps, { productSalesDropdown })(
    ProductTableBody
);
