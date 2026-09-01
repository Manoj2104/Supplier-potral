import React, { useEffect, useState } from "react";
import { Modal, Form } from "react-bootstrap";
import {
    currencySymbolHandling,
    getFormattedMessage,
    getFormattedOptions,
    numValidate,
} from "../../../../shared/sharedMethod";
import ReactSelect from "../../../../shared/select/reactSelect";
import { useDispatch } from "react-redux";
import { addToast } from "../../../../store/action/toastAction";
import { salePaymentStatusOptions, toastType } from "../../../../constants";

const CashPaymentModel = (props) => {
    const {
        handleCashPayment,
        cashPaymentValue,
        onPaymentStatusChange,
        cashPayment,
        onChangeInput,
        onCashPayment,
        grandTotal,
        totalQty,
        cartItemValue,
        taxTotal,
        settings,
        subTotal,
        errors,
        onPaymentTypeChange,
        paymentTypeDefaultValue,
        paymentTypeFilterOptions,
        allConfigData,
        onChangeReturnChange,
    } = props;

    const [summation, setSummation] = useState(0);
    const [selectedMode, setSelectedMode] = useState("Cash");
    const [isSplit, setIsSplit] = useState(false);
    const [splitCash, setSplitCash] = useState("");
    const [splitOnline, setSplitOnline] = useState("");
    const dispatch = useDispatch();

    const currencySymbol = (settings.attributes && settings.attributes.currency_symbol) || "₹";

    useEffect(() => {
        const received = cashPaymentValue.received_amount !== undefined
            ? Number(cashPaymentValue.received_amount)
            : Number(grandTotal);
        setSummation(received - grandTotal);
    }, [cashPaymentValue.received_amount, grandTotal]);

    useEffect(() => {
        onChangeReturnChange(summation);
    }, [summation]);

    const paymentStatusFilterOptions = getFormattedOptions(salePaymentStatusOptions);
    const paymentStatusDefaultValue = paymentStatusFilterOptions.map((option) => ({
        value: option.id,
        label: option.name,
    }));

    // Quick cash handler
    const handleQuickCash = (amountToAdd) => {
        const current = cashPaymentValue.received_amount !== undefined && cashPaymentValue.received_amount !== ""
            ? Number(cashPaymentValue.received_amount)
            : Number(grandTotal);
        const updated = current + amountToAdd;
        onChangeInput({
            preventDefault: () => {},
            target: { name: "received_amount", value: updated.toString() },
        });
    };

    // 50 / 50 Split Handler (Half Cash + Half GPay/UPI)
    const handleFiftyFiftySplit = () => {
        const half = (Number(grandTotal) / 2).toFixed(2);
        setSplitCash(half);
        setSplitOnline(half);
        setIsSplit(true);
        setSelectedMode("Split");
        onChangeInput({
            preventDefault: () => {},
            target: { name: "received_amount", value: grandTotal.toString() },
        });
        onChangeInput({
            preventDefault: () => {},
            target: { name: "notes", value: `Split Payment: Cash ₹${half} + UPI/GPay ₹${half}` },
        });
    };

    // Custom Split Cash Change
    const handleSplitCashChange = (val) => {
        setSplitCash(val);
        const cashNum = Number(val) || 0;
        const onlineNum = Math.max(0, Number(grandTotal) - cashNum).toFixed(2);
        setSplitOnline(onlineNum);
        const totalReceived = cashNum + Number(onlineNum);
        onChangeInput({
            preventDefault: () => {},
            target: { name: "received_amount", value: totalReceived.toString() },
        });
        onChangeInput({
            preventDefault: () => {},
            target: { name: "notes", value: `Split Payment: Cash ₹${cashNum} + UPI/GPay ₹${onlineNum}` },
        });
    };

    // Custom Split Online Change
    const handleSplitOnlineChange = (val) => {
        setSplitOnline(val);
        const onlineNum = Number(val) || 0;
        const cashNum = Math.max(0, Number(grandTotal) - onlineNum).toFixed(2);
        setSplitCash(cashNum);
        const totalReceived = onlineNum + Number(cashNum);
        onChangeInput({
            preventDefault: () => {},
            target: { name: "received_amount", value: totalReceived.toString() },
        });
        onChangeInput({
            preventDefault: () => {},
            target: { name: "notes", value: `Split Payment: Cash ₹${cashNum} + UPI/GPay ₹${onlineNum}` },
        });
    };

    // Mode click handler
    const handleSelectMode = (modeName) => {
        setSelectedMode(modeName);
        if (modeName === "Split") {
            setIsSplit(true);
            handleFiftyFiftySplit();
            return;
        } else {
            setIsSplit(false);
        }
        const matched = paymentTypeFilterOptions.find((opt) =>
            opt.name.toLowerCase().includes(modeName.toLowerCase()) ||
            modeName.toLowerCase().includes(opt.name.toLowerCase())
        );
        if (matched) {
            onPaymentTypeChange({ value: matched.id, label: matched.name });
        }
    };

    const receivedVal = cashPaymentValue.received_amount !== undefined && cashPaymentValue.received_amount !== ""
        ? Number(cashPaymentValue.received_amount)
        : Number(grandTotal);

    return (
        <Modal
            show={cashPayment}
            onHide={handleCashPayment}
            className="pos-modal pos-payment-modal"
            centered
        >
            {/* Modal Header */}
            <Modal.Header closeButton>
                <div>
                    <Modal.Title>Make Payment</Modal.Title>
                    <div className="pos-payment-modal modal-subtitle">
                        Complete the payment for this order
                    </div>
                </div>
            </Modal.Header>

            {/* Modal Body */}
            <Modal.Body>
                <div className="row g-3">

                    {/* ── LEFT PANEL (Form Inputs & Payment Modes) ── */}
                    <div className="col-lg-7 col-12">

                        {/* Payment Mode Selector */}
                        <div className="mb-2">
                            <label className="pos-input-label">Payment Mode</label>
                            <div className="payment-mode-grid">
                                {[
                                    { name: "Cash", icon: "bi-cash-stack" },
                                    { name: "UPI", icon: "bi-qr-code-scan" },
                                    { name: "Card", icon: "bi-credit-card-2-front" },
                                    { name: "Wallet", icon: "bi-wallet2" },
                                    { name: "Split", icon: "bi-diagram-3" },
                                    { name: "Other", icon: "bi-three-dots" },
                                ].map((mode) => (
                                    <div
                                        key={mode.name}
                                        className={`payment-mode-card ${selectedMode === mode.name ? "active" : ""}`}
                                        onClick={() => handleSelectMode(mode.name)}
                                    >
                                        <i className={`bi ${mode.icon}`} />
                                        <span>{mode.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── SPLIT PAYMENT BAR (Half Cash + Half GPay/UPI) ── */}
                        <div className="p-3 mb-3 border rounded-3" style={{ background: "#F8FAFC", borderColor: "#E2E8F0" }}>
                            <div className="d-flex align-items-center justify-content-between mb-2">
                                <span className="fw-bold text-dark" style={{ fontSize: "12px" }}>
                                    <i className="bi bi-diagram-3-fill text-success me-1" /> Partial / Split Payment Options
                                </span>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-success fw-bold py-0 px-2"
                                    style={{ fontSize: "10px", borderRadius: "6px" }}
                                    onClick={handleFiftyFiftySplit}
                                >
                                    ⚡ 50/50 Auto Split (Half Cash + Half GPay)
                                </button>
                            </div>

                            {isSplit && (
                                <div className="row g-2 mt-1">
                                    <div className="col-6">
                                        <label style={{ fontSize: "10px", fontWeight: 700, color: "#16A34A" }}>
                                            💵 Cash Amount (Half 1)
                                        </label>
                                        <Form.Control
                                            type="number"
                                            value={splitCash}
                                            onChange={(e) => handleSplitCashChange(e.target.value)}
                                            placeholder="Enter cash portion"
                                            className="pos-input-control py-1 px-2"
                                            style={{ fontSize: "12px" }}
                                        />
                                    </div>
                                    <div className="col-6">
                                        <label style={{ fontSize: "10px", fontWeight: 700, color: "#2563EB" }}>
                                            📲 UPI / GPay / Card (Half 2)
                                        </label>
                                        <Form.Control
                                            type="number"
                                            value={splitOnline}
                                            onChange={(e) => handleSplitOnlineChange(e.target.value)}
                                            placeholder="Enter online portion"
                                            className="pos-input-control py-1 px-2"
                                            style={{ fontSize: "12px" }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Received Amount & Paying Amount */}
                        <div className="row g-3 mb-2">
                            <div className="col-6">
                                <label className="pos-input-label">
                                    Received Amount <span className="text-danger">*</span>
                                </label>
                                <Form.Control
                                    type="number"
                                    min={0}
                                    onKeyPress={(event) => numValidate(event)}
                                    name="received_amount"
                                    autoComplete="off"
                                    className="pos-input-control"
                                    defaultValue={grandTotal}
                                    value={cashPaymentValue.received_amount !== undefined ? cashPaymentValue.received_amount : grandTotal}
                                    onChange={(e) => onChangeInput(e)}
                                />
                                {/* Quick Cash Chips */}
                                <div className="quick-cash-chips">
                                    {[100, 500, 1000, 5000, 10000].map((amt) => (
                                        <div
                                            key={amt}
                                            className="quick-cash-chip"
                                            onClick={() => handleQuickCash(amt)}
                                        >
                                            + ₹{amt.toLocaleString()}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="col-6">
                                <label className="pos-input-label">Paying Amount</label>
                                <Form.Control
                                    type="text"
                                    name="paying_amount"
                                    autoComplete="off"
                                    readOnly={true}
                                    className="pos-input-control pos-input-readonly-green"
                                    value={currencySymbolHandling(allConfigData, currencySymbol, grandTotal)}
                                />
                            </div>
                        </div>

                        {/* Change Return & Payment Type */}
                        <div className="row g-3 mb-2">
                            <div className="col-6">
                                <label className="pos-input-label">Change Return</label>
                                <Form.Control
                                    type="text"
                                    autoComplete="off"
                                    readOnly={true}
                                    className="pos-input-control pos-input-readonly-gray"
                                    value={currencySymbolHandling(allConfigData, currencySymbol, Number(summation > 0 ? summation : 0).toFixed(2))}
                                />
                            </div>

                            <div className="col-6">
                                <label className="pos-input-label">Payment Type</label>
                                <ReactSelect
                                    multiLanguageOption={paymentTypeFilterOptions}
                                    onChange={onPaymentTypeChange}
                                    name="payment_type"
                                    isRequired
                                    defaultValue={paymentTypeDefaultValue[0]}
                                    placeholder={getFormattedMessage("select.payment-type.label")}
                                />
                            </div>
                        </div>

                        {/* Note (Optional) */}
                        <div className="mb-2">
                            <label className="pos-input-label">Note (Optional)</label>
                            <Form.Control
                                as="textarea"
                                className="pos-input-control"
                                name="notes"
                                rows={2}
                                onChange={(e) => onChangeInput(e)}
                                placeholder="Enter a note about this payment..."
                                value={cashPaymentValue.notes || ""}
                            />
                            {errors["notes"] && <span className="text-danger font-size-11">{errors["notes"]}</span>}
                        </div>

                        {/* Payment Status & Reference ID */}
                        <div className="row g-3 mb-2">
                            <div className="col-6">
                                <label className="pos-input-label">
                                    Payment Status <span className="text-danger">*</span>
                                </label>
                                <ReactSelect
                                    multiLanguageOption={paymentStatusFilterOptions}
                                    onChange={onPaymentStatusChange}
                                    name="payment_status"
                                    value={cashPaymentValue.payment_status}
                                    errors={errors["payment_status"]}
                                    defaultValue={paymentStatusDefaultValue[1]}
                                    placeholder="Select Payment Status"
                                />
                            </div>

                            <div className="col-6">
                                <label className="pos-input-label">Reference / Transaction ID (Optional)</label>
                                <Form.Control
                                    type="text"
                                    name="reference_id"
                                    autoComplete="off"
                                    className="pos-input-control"
                                    placeholder="Enter reference or transaction ID"
                                    onChange={(e) => onChangeInput(e)}
                                />
                            </div>
                        </div>

                        {/* Secure Payment Banner */}
                        <div className="secure-payment-banner py-2 my-2">
                            <div className="secure-payment-icon" style={{ width: 24, height: 24, fontSize: 13 }}>
                                <i className="bi bi-check-lg" />
                            </div>
                            <div>
                                <h6 className="secure-payment-title" style={{ fontSize: 11 }}>Secure Payment</h6>
                                <p className="secure-payment-desc" style={{ fontSize: 10 }}>
                                    This payment is secure and encrypted.
                                </p>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div>
                            <label className="pos-input-label mb-1">Quick Actions</label>
                            <div className="payment-quick-actions">
                                <div className="quick-action-pill" onClick={() => dispatch(addToast({ text: "Printing Invoice..." }))}>
                                    <i className="bi bi-printer text-success" /> Print Invoice
                                </div>
                                <div className="quick-action-pill" onClick={() => dispatch(addToast({ text: "Email receipt sent" }))}>
                                    <i className="bi bi-envelope text-primary" /> Email Invoice
                                </div>
                                <div className="quick-action-pill" onClick={() => dispatch(addToast({ text: "WhatsApp receipt sent" }))}>
                                    <i className="bi bi-whatsapp text-success" /> WhatsApp
                                </div>
                                <div className="quick-action-pill" onClick={() => dispatch(addToast({ text: "Bill held successfully" }))}>
                                    <i className="bi bi-pause-fill text-warning" /> Hold Bill
                                </div>
                                <div className="quick-action-pill" onClick={() => dispatch(addToast({ text: "Bill suspended" }))}>
                                    <i className="bi bi-pause-circle text-purple" /> Suspend Bill
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* ── RIGHT PANEL (Order Summary & Shortcuts) ── */}
                    <div className="col-lg-5 col-12">

                        {/* Order Summary Card */}
                        <div className="order-summary-card p-3 mb-2">
                            <div className="order-summary-header mb-2 pb-2">
                                <h5 className="order-summary-title" style={{ fontSize: 14 }}>Order Summary</h5>
                                <span className="badge bg-success bg-opacity-10 text-success fw-bold px-2 py-1" style={{ borderRadius: "6px", fontSize: "10px" }}>
                                    {totalQty} Items
                                </span>
                            </div>

                            <table className="order-summary-table mb-2">
                                <tbody>
                                    <tr>
                                        <td>Total Products</td>
                                        <td>{totalQty}</td>
                                    </tr>
                                    <tr>
                                        <td>Sub Total</td>
                                        <td>{currencySymbolHandling(allConfigData, currencySymbol, subTotal || "0.00")}</td>
                                    </tr>
                                    <tr>
                                        <td>
                                            Order Tax ({cartItemValue.tax ? parseFloat(cartItemValue.tax).toFixed(2) : "0.00"} %)
                                        </td>
                                        <td>{currencySymbolHandling(allConfigData, currencySymbol, taxTotal || "0.00")}</td>
                                    </tr>
                                    <tr>
                                        <td>Discount</td>
                                        <td className="text-danger">
                                            - {currencySymbolHandling(allConfigData, currencySymbol, cartItemValue.discount || "0.00")}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Shipping</td>
                                        <td>{currencySymbolHandling(allConfigData, currencySymbol, cartItemValue.shipping || "0.00")}</td>
                                    </tr>
                                    <tr className="grand-total-row">
                                        <td className="grand-total-label">Grand Total</td>
                                        <td className="grand-total-value" style={{ fontSize: 18 }}>
                                            {currencySymbolHandling(allConfigData, currencySymbol, grandTotal)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Summary Highlights Box */}
                            <div className="summary-highlight-box py-2">
                                <div className="summary-highlight-row">
                                    <span>Amount Received</span>
                                    <span className="summary-highlight-val">
                                        {currencySymbolHandling(allConfigData, currencySymbol, receivedVal)}
                                    </span>
                                </div>
                                <div className="summary-highlight-row">
                                    <span>Change Return</span>
                                    <span className="summary-highlight-val">
                                        {currencySymbolHandling(allConfigData, currencySymbol, Number(summation > 0 ? summation : 0).toFixed(2))}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Customer & Metrics Mini Cards */}
                        <div className="metrics-three-grid mb-2">
                            <div className="metric-mini-card p-2">
                                <i className="bi bi-basket metric-mini-icon" />
                                <div className="metric-mini-label">Items</div>
                                <div className="metric-mini-val">{totalQty}</div>
                            </div>
                            <div className="metric-mini-card p-2">
                                <i className="bi bi-layers metric-mini-icon" />
                                <div className="metric-mini-label">Total Qty</div>
                                <div className="metric-mini-val">{totalQty}</div>
                            </div>
                            <div className="metric-mini-card p-2">
                                <i className="bi bi-person-circle metric-mini-icon" />
                                <div className="metric-mini-label">Customer</div>
                                <div className="metric-mini-val text-truncate">Walk-in</div>
                            </div>
                        </div>

                        {/* Payment Shortcuts Grid */}
                        <div>
                            <div className="payment-shortcuts-header mb-1" style={{ fontSize: 11 }}>Payment Shortcuts</div>
                            <div className="payment-shortcuts-grid mb-2">
                                {[
                                    { name: "Cash", icon: "bi-cash-stack", color: "#16A34A" },
                                    { name: "UPI", icon: "bi-qr-code-scan", color: "#0D9488" },
                                    { name: "Card", icon: "bi-credit-card-2-front", color: "#2563EB" },
                                    { name: "Wallet", icon: "bi-wallet2", color: "#9333EA" },
                                    { name: "Gift Card", icon: "bi-gift", color: "#DB2777" },
                                    { name: "Credit", icon: "bi-person-badge", color: "#EA580C" },
                                    { name: "Split 50/50", icon: "bi-diagram-3", color: "#059669" },
                                    { name: "Bank", icon: "bi-bank", color: "#0284C7" },
                                ].map((tile) => (
                                    <div
                                        key={tile.name}
                                        className="shortcut-tile py-1 px-1"
                                        onClick={() => handleSelectMode(tile.name.includes("Split") ? "Split" : tile.name)}
                                    >
                                        <i className={`bi ${tile.icon}`} style={{ color: tile.color, fontSize: 14 }} />
                                        <span style={{ fontSize: 9 }}>{tile.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                </div>
            </Modal.Body>

            {/* Modal Footer */}
            <Modal.Footer className="py-2">
                <button
                    type="button"
                    className="btn btn-payment-cancel py-1 px-3"
                    style={{ height: 38, fontSize: 13 }}
                    onClick={handleCashPayment}
                >
                    Cancel
                </button>

                <button
                    type="button"
                    className="btn btn-payment-submit py-1 px-4"
                    style={{ height: 38, fontSize: 13 }}
                    onClick={(event) => {
                        if (cashPaymentValue.received_amount !== undefined) {
                            if (parseInt(cashPaymentValue.received_amount) < parseInt(grandTotal)) {
                                dispatch(
                                    addToast({
                                        text: getFormattedMessage("purchase.less.recieving.ammout.error"),
                                        type: toastType.ERROR,
                                    })
                                );
                            } else {
                                onCashPayment(event);
                            }
                        } else {
                            onCashPayment(event);
                        }
                    }}
                >
                    <i className="bi bi-lock-fill" />
                    Submit Payment
                </button>
            </Modal.Footer>
        </Modal>
    );
};

export default CashPaymentModel;
