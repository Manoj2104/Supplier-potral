import React, { useCallback, useEffect, useState } from "react";
import { Button } from "react-bootstrap-v5";
import { useDispatch } from "react-redux";
import { addToast } from "../../../store/action/toastAction";
import { toastType } from "../../../constants";
import { getFormattedMessage } from "../../../shared/sharedMethod";
import ResetCartConfirmationModal from "./ResetCartConfirmationModal";
import HoldCartConfirmationModal from "./HoldCartConfirmationModal";
import moment from "moment";
import { addHoldList } from "../../../store/action/pos/HoldListAction";

const PaymentButton = (props) => {
    const {
        updateProducts,
        setCashPayment,
        cartItemValue,
        grandTotal,
        subTotal,
        setCartItemValue,
        setUpdateProducts,
        holdListId,
        setHoldListValue,
        updateCart,
        selectedCustomerOption,
        selectedOption,
        cashPaymentValue,
        setUpdateHoldList,
    } = props;

    const dispatch = useDispatch();
    const [isReset, setIsReset] = useState(false);
    const [isHold, setIsHold] = useState(false);

    const hasItems = updateProducts && updateProducts.length > 0;
    const hasZeroQty = updateProducts && updateProducts.filter((a) => a.quantity === 0).length > 0;

    // ── Pay Now / Split Payment ──────────────────────────────────────────────
    const openPaymentModel = useCallback(() => {
        if (!hasItems) {
            dispatch(addToast({
                text: getFormattedMessage("pos.cash-payment.product-error.message"),
                type: toastType.ERROR,
            }));
            return;
        }
        if (hasZeroQty) {
            dispatch(addToast({
                text: getFormattedMessage("pos.cash-payment.quantity-error.message"),
                type: toastType.ERROR,
            }));
            return;
        }
        if (Number(cartItemValue.tax) > 100) {
            dispatch(addToast({
                text: getFormattedMessage("pos.cash-payment.tax-error.message"),
                type: toastType.ERROR,
            }));
            return;
        }
        if (Number(cartItemValue.shipping) > Number(subTotal)) {
            dispatch(addToast({
                text: getFormattedMessage("pos.cash-payment.sub-total-amount-error.message"),
                type: toastType.ERROR,
            }));
            return;
        }
        setCashPayment(true);
    }, [hasItems, hasZeroQty, cartItemValue, subTotal, setCashPayment, dispatch]);

    // ── Hold / Draft / Suspend ───────────────────────────────────────────────
    const holdPaymentModel = useCallback(() => {
        if (!hasItems) {
            dispatch(addToast({
                text: getFormattedMessage("pos.cash-payment.product-error.message"),
                type: toastType.ERROR,
            }));
            return;
        }
        setIsHold(true);
    }, [hasItems, dispatch]);

    // ── Clear Cart ───────────────────────────────────────────────────────────
    const resetPaymentModel = useCallback(() => {
        if (!hasItems) {
            dispatch(addToast({
                text: getFormattedMessage("pos.cash-payment.product-error.message"),
                type: toastType.ERROR,
            }));
            return;
        }
        setIsReset(true);
    }, [hasItems, dispatch]);

    // ── Keyboard shortcuts (Alt+S = Pay, Alt+R = Reset) ─────────────────────
    const handleKeyPress = useCallback((event) => {
        if (event.altKey && event.code === "KeyS") openPaymentModel();
        if (event.altKey && event.code === "KeyR") resetPaymentModel();
    }, [openPaymentModel, resetPaymentModel]);

    useEffect(() => {
        window.addEventListener("keydown", handleKeyPress);
        return () => window.removeEventListener("keydown", handleKeyPress);
    }, [handleKeyPress]);

    // ── Confirm clear cart ───────────────────────────────────────────────────
    const onConfirmReset = () => {
        setUpdateProducts([]);
        setCartItemValue({ discount: 0, tax: 0, shipping: 0 });
        setIsReset(false);
    };

    // ── Confirm hold ─────────────────────────────────────────────────────────
    const onConfirmHoldList = () => {
        if (!holdListId.referenceNumber) {
            dispatch(addToast({
                text: getFormattedMessage("hold-list.reference-code.error"),
                type: toastType.ERROR,
            }));
            return;
        }
        const formValue = {
            reference_code: holdListId.referenceNumber,
            date: moment(new Date()).format("YYYY-MM-DD"),
            customer_id:
                selectedCustomerOption && selectedCustomerOption[0]
                    ? selectedCustomerOption[0].value
                    : selectedCustomerOption && selectedCustomerOption.value,
            warehouse_id:
                selectedOption && selectedOption[0]
                    ? selectedOption[0].value
                    : selectedOption && selectedOption.value,
            hold_items: updateProducts || [],
            tax_rate: cartItemValue.tax || 0,
            discount: cartItemValue.discount || 0,
            shipping: cartItemValue.shipping || 0,
            grandTotal: grandTotal,
            subTotal: subTotal,
            note: cashPaymentValue.notes,
            discount_applied: cartItemValue.discount_applied,
        };
        dispatch(addHoldList(formValue));
        setIsHold(false);
        setUpdateProducts([]);
        setCartItemValue({ discount: 0, tax: 0, shipping: 0 });
        setUpdateHoldList(true);
    };

    const onCancel = () => {
        setIsReset(false);
        setIsHold(false);
    };

    const onChangeInput = (e) => {
        e.preventDefault();
        setHoldListValue((inputs) => ({
            ...inputs,
            referenceNumber: e.target.value,
        }));
    };

    return (
        <div className="d-flex flex-column gap-2 w-100">

            {/* ── Row 1: Pay Now + Split Payment ── */}
            <div className="d-flex align-items-center gap-2">
                <Button
                    type="button"
                    className="flex-fill fw-bold d-flex align-items-center justify-content-center gap-2 border-0"
                    style={{
                        background: "#16A34A",
                        color: "#fff",
                        borderRadius: "10px",
                        height: "44px",
                        fontSize: "14px",
                    }}
                    onClick={openPaymentModel}
                >
                    <i className="bi bi-wallet2" /> Pay Now
                </Button>
                <Button
                    type="button"
                    variant="outline-success"
                    className="fw-bold d-flex align-items-center justify-content-center gap-1"
                    style={{
                        borderRadius: "10px",
                        height: "44px",
                        fontSize: "12px",
                        minWidth: "130px",
                        borderColor: "#16A34A",
                        color: "#16A34A",
                    }}
                    onClick={openPaymentModel}
                >
                    <i className="bi bi-credit-card-2-front" /> Split Payment
                </Button>
            </div>

            {/* ── Row 2: Hold / Draft / Suspend / Clear ── */}
            <div className="d-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "6px" }}>
                <button
                    type="button"
                    className="btn btn-sm fw-semibold border"
                    style={{ background: "#FFF7ED", borderColor: "#FED7AA", color: "#C2410C", borderRadius: "8px", fontSize: "11px", height: "32px" }}
                    onClick={holdPaymentModel}
                    title="Hold current bill (F5)"
                >
                    <i className="bi bi-pause-fill me-1" />Hold
                </button>
                <button
                    type="button"
                    className="btn btn-sm fw-semibold border"
                    style={{ background: "#EFF6FF", borderColor: "#BFDBFE", color: "#1D4ED8", borderRadius: "8px", fontSize: "11px", height: "32px" }}
                    onClick={holdPaymentModel}
                    title="Save as draft"
                >
                    <i className="bi bi-file-earmark-text me-1" />Draft
                </button>
                <button
                    type="button"
                    className="btn btn-sm fw-semibold border"
                    style={{ background: "#F3E8FF", borderColor: "#E9D5FF", color: "#7E22CE", borderRadius: "8px", fontSize: "11px", height: "32px" }}
                    onClick={holdPaymentModel}
                    title="Suspend bill"
                >
                    <i className="bi bi-pause-circle me-1" />Suspend
                </button>
                <button
                    type="button"
                    className="btn btn-sm fw-semibold border"
                    style={{ background: "#FEF2F2", borderColor: "#FCA5A5", color: "#DC2626", borderRadius: "8px", fontSize: "11px", height: "32px" }}
                    onClick={resetPaymentModel}
                    title="Clear all items (Alt+R)"
                >
                    <i className="bi bi-trash3 me-1" />Clear
                </button>
            </div>

            {/* ── Modals ── */}
            {isReset && (
                <ResetCartConfirmationModal
                    onConfirm={onConfirmReset}
                    onCancel={onCancel}
                    itemName={getFormattedMessage("globally.detail.product")}
                />
            )}
            {isHold && (
                <HoldCartConfirmationModal
                    onChangeInput={onChangeInput}
                    onConfirm={onConfirmHoldList}
                    onCancel={onCancel}
                    itemName={getFormattedMessage("globally.detail.product")}
                />
            )}
        </div>
    );
};

export default PaymentButton;
