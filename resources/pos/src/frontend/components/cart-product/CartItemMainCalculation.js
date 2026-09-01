import React from "react";
import { Form, InputGroup, FormControl } from "react-bootstrap-v5";
import { Row } from "react-bootstrap";
import {
    currencySymbolHandling,
    decimalValidate,
    getFormattedMessage,
    numValidate,
    placeholderText,
} from "../../../shared/sharedMethod";

const CartItemMainCalculation = (props) => {
    const {
        totalQty,
        subTotal,
        cartItemValue,
        onChangeCart,
        grandTotal,
        frontSetting,
        allConfigData,
        onChangeTaxCart,
    } = props;

    return (
        <div className="calculation p-3 bg-white border-top">
            <Row className="align-items-center">
                <div className="col-5">
                    <Form.Group className="mb-1">
                        <InputGroup size="sm">
                            <FormControl
                                type="text"
                                id="tax"
                                name="tax"
                                min="0"
                                step=".01"
                                placeholder="Tax"
                                onChange={(e) => onChangeTaxCart(e)}
                                onKeyPress={(event) => numValidate(event)}
                                value={cartItemValue.tax === 0 ? "" : cartItemValue.tax}
                                style={{ fontSize: "11px" }}
                            />
                            <InputGroup.Text style={{ fontSize: "11px" }}>%</InputGroup.Text>
                        </InputGroup>
                    </Form.Group>
                    <Form.Group className="mb-1">
                        <InputGroup size="sm">
                            <FormControl
                                type="text"
                                id="discount"
                                onChange={(e) => onChangeCart(e)}
                                value={cartItemValue.discount === 0 ? "" : cartItemValue.discount}
                                onKeyPress={(event) => decimalValidate(event)}
                                name="discount"
                                min="0"
                                step=".01"
                                placeholder="Discount"
                                style={{ fontSize: "11px" }}
                            />
                            <InputGroup.Text style={{ fontSize: "11px" }}>
                                {frontSetting.value && frontSetting.value.currency_symbol}
                            </InputGroup.Text>
                        </InputGroup>
                    </Form.Group>
                    <Form.Group className="mb-0">
                        <InputGroup size="sm">
                            <FormControl
                                type="text"
                                id="shipping"
                                name="shipping"
                                min="0"
                                step=".01"
                                placeholder="Shipping"
                                onChange={(e) => onChangeCart(e)}
                                onKeyPress={(event) => decimalValidate(event)}
                                value={cartItemValue.shipping === 0 ? "" : cartItemValue.shipping}
                                style={{ fontSize: "11px" }}
                            />
                            <InputGroup.Text style={{ fontSize: "11px" }}>
                                {frontSetting.value && frontSetting.value.currency_symbol}
                            </InputGroup.Text>
                        </InputGroup>
                    </Form.Group>
                </div>
                <div className="col-7 text-end">
                    <div className="d-flex justify-content-between mb-1" style={{ fontSize: "11px", color: "#64748B" }}>
                        <span>Total QTY:</span>
                        <span className="fw-bold text-dark">{totalQty ? totalQty : "0"}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-1" style={{ fontSize: "11px", color: "#64748B" }}>
                        <span>Sub Total:</span>
                        <span className="fw-bold text-dark">
                            {currencySymbolHandling(
                                allConfigData,
                                frontSetting.value && frontSetting.value.currency_symbol,
                                subTotal ? subTotal : "0.00"
                            )}
                        </span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mt-2 border-top pt-2">
                        <span className="fw-bold text-dark" style={{ fontSize: "13px" }}>Grand Total:</span>
                        <span className="fw-black" style={{ fontSize: "20px", color: "#16A34A", fontWeight: 900 }}>
                            {currencySymbolHandling(
                                allConfigData,
                                frontSetting.value && frontSetting.value.currency_symbol,
                                grandTotal ? grandTotal : "0.00"
                            )}
                        </span>
                    </div>
                </div>
            </Row>
        </div>
    );
};
export default CartItemMainCalculation;
