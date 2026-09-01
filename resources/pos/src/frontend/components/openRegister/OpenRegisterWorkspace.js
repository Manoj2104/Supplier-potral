import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment';
import { registerCashInHandAction } from '../../../store/action/pos/posRegisterDetailsAction';
import { currencySymbolHandling } from '../../../shared/sharedMethod';
import { Tokens } from '../../../constants';

const OpenRegisterWorkspace = ({ onCompleteOpenRegister, allConfigData, frontSetting, settings }) => {
    const dispatch = useDispatch();

    const loggedInFirstName = localStorage.getItem(Tokens.UPDATED_FIRST_NAME) || localStorage.getItem(Tokens.FIRST_NAME) || 'Manoj';
    const loggedInLastName = localStorage.getItem(Tokens.UPDATED_LAST_NAME) || localStorage.getItem(Tokens.LAST_NAME) || 'S';
    const cashierFullName = `${loggedInFirstName} ${loggedInLastName}`.trim();
    const currencySymbol = frontSetting?.value?.currency_symbol || '₹';

    const [openingBalance, setOpeningBalance] = useState("0.00");
    const [paymentType, setPaymentType] = useState("Cash");
    const [notes, setNotes] = useState("");
    const [referenceNo, setReferenceNo] = useState("");
    const [verifiedBy, setVerifiedBy] = useState(cashierFullName);

    // Denominations
    const [denominations, setDenominations] = useState({
        d2000: 0,
        d500: 0,
        d200: 0,
        d100: 0,
        d50: 0,
        d20: 0,
        d10: 0,
        d5: 0,
        d2: 0,
        d1: 0,
    });

    const calculateBreakdownTotal = () => {
        return (
            (denominations.d2000 * 2000) +
            (denominations.d500 * 500) +
            (denominations.d200 * 200) +
            (denominations.d100 * 100) +
            (denominations.d50 * 50) +
            (denominations.d20 * 20) +
            (denominations.d10 * 10) +
            (denominations.d5 * 5) +
            (denominations.d2 * 2) +
            (denominations.d1 * 1)
        );
    };

    const breakdownTotal = calculateBreakdownTotal();

    const handleDenominationChange = (key, val) => {
        const num = Math.max(0, parseInt(val, 10) || 0);
        setDenominations(prev => {
            const next = { ...prev, [key]: num };
            // auto calculate breakdown total
            const total = (
                (next.d2000 * 2000) +
                (next.d500 * 500) +
                (next.d200 * 200) +
                (next.d100 * 100) +
                (next.d50 * 50) +
                (next.d20 * 20) +
                (next.d10 * 10) +
                (next.d5 * 5) +
                (next.d2 * 2) +
                (next.d1 * 1)
            );
            setOpeningBalance(total.toFixed(2));
            return next;
        });
    };

    const handleReset = () => {
        setOpeningBalance("0.00");
        setPaymentType("Cash");
        setNotes("");
        setReferenceNo("");
        setDenominations({
            d2000: 0, d500: 0, d200: 0, d100: 0, d50: 0, d20: 0, d10: 0, d5: 0, d2: 0, d1: 0
        });
    };

    const handleSubmitOpenRegister = (e) => {
        if (e) e.preventDefault();
        const cashValue = parseFloat(openingBalance) || 0;
        
        // 1. Instantly transition to POS Billing screen
        if (onCompleteOpenRegister) {
            onCompleteOpenRegister(cashValue);
        }

        // 2. Dispatch backend action to record cash in hand
        dispatch(registerCashInHandAction({
            cash_in_hand: cashValue,
            notes: notes,
            reference_no: referenceNo,
        }, () => {}));
    };

    // Keyboard shortcut F8
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "F8") {
                e.preventDefault();
                handleSubmitOpenRegister();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [openingBalance, notes]);

    return (
        <div className="open-register-workspace p-4 flex-fill overflow-auto" style={{ background: "#F8FAFC", minHeight: "100vh" }}>
            <div className="container-fluid max-w-7xl mx-auto">

                {/* ── Page Header ── */}
                <div className="mb-4">
                    <h1 className="fw-extrabold text-dark fs-3 m-0 d-flex align-items-center gap-2">
                        <i className="bi bi-cash-register text-success" />
                        Open Register
                    </h1>
                    <p className="text-muted fs-small m-0">Open a new register to start billing and manage transactions.</p>
                </div>

                {/* ── Top Status Banner Card (Matching Ref Image #2) ── */}
                <div className="bg-white border rounded-4 p-3.5 mb-4 shadow-sm" style={{ borderColor: "#E2E8F0" }}>
                    <div className="row align-items-center g-3">
                        <div className="col-md-5 d-flex align-items-center gap-3">
                            <div className="rounded-circle bg-success-subtle text-success p-3 d-flex align-items-center justify-content-center" style={{ width: "54px", height: "54px" }}>
                                <i className="bi bi-cash-stack fs-3" />
                            </div>
                            <div>
                                <div className="d-flex align-items-center gap-2 mb-1">
                                    <span className="fw-bold text-dark fs-6">Register Status</span>
                                    <span className="badge bg-success-subtle text-success border border-success fw-bold px-2 py-0.5 fs-micro">Openable</span>
                                </div>
                                <div className="text-muted fs-micro">Current Status: <strong className="text-dark">No active register found</strong></div>
                            </div>
                        </div>

                        <div className="col-md-7 border-start ps-md-4">
                            <div className="row g-2 text-muted fs-micro">
                                <div className="col-4">
                                    <div className="fw-semibold">Previous Register</div>
                                    <div className="fw-bold text-dark fs-small">REG-000125</div>
                                </div>
                                <div className="col-4">
                                    <div className="fw-semibold">Closed By</div>
                                    <div className="fw-bold text-dark fs-small">{cashierFullName}</div>
                                </div>
                                <div className="col-4">
                                    <div className="fw-semibold">Closed At</div>
                                    <div className="fw-bold text-dark fs-small">26 Jul 2026, 09:15 PM</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Main Layout: 70% Left Panel | 30% Right Summary ── */}
                <div className="row g-4">

                    {/* ── LEFT PANEL (70%) ── */}
                    <div className="col-lg-8">
                        
                        {/* 1. Register Information Card */}
                        <div className="bg-white border rounded-4 p-4 mb-4 shadow-sm" style={{ borderColor: "#E2E8F0" }}>
                            <h5 className="fw-bold text-dark fs-6 mb-3 d-flex align-items-center gap-2">
                                <i className="bi bi-info-circle-fill text-success" />
                                Register Information
                            </h5>

                            <div className="row g-3">
                                {/* Opening Balance */}
                                <div className="col-md-4">
                                    <label className="form-label fw-bold fs-micro text-dark">Opening Balance <span className="text-danger">*</span></label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-light text-muted fw-bold">{currencySymbol}</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="form-control fw-bold text-dark fs-small"
                                            value={openingBalance}
                                            onChange={(e) => setOpeningBalance(e.target.value)}
                                            placeholder="0.00"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                {/* Payment Type */}
                                <div className="col-md-4">
                                    <label className="form-label fw-bold fs-micro text-dark">Payment Type <span className="text-danger">*</span></label>
                                    <select
                                        className="form-select fw-semibold text-dark fs-small"
                                        value={paymentType}
                                        onChange={(e) => setPaymentType(e.target.value)}
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Card">Card</option>
                                        <option value="UPI">UPI / Bank Transfer</option>
                                    </select>
                                </div>

                                {/* Notes */}
                                <div className="col-md-4">
                                    <label className="form-label fw-bold fs-micro text-dark">Notes</label>
                                    <input
                                        type="text"
                                        className="form-control fs-small"
                                        placeholder="Enter opening note (optional)"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>

                                {/* Counted By */}
                                <div className="col-md-4">
                                    <label className="form-label fw-bold fs-micro text-dark">Counted By <span className="text-danger">*</span></label>
                                    <input
                                        type="text"
                                        className="form-control bg-light fs-small fw-semibold"
                                        value={cashierFullName}
                                        disabled
                                    />
                                </div>

                                {/* Verified By */}
                                <div className="col-md-4">
                                    <label className="form-label fw-bold fs-micro text-dark">Verified By <span className="text-danger">*</span></label>
                                    <input
                                        type="text"
                                        className="form-control bg-light fs-small fw-semibold"
                                        value={verifiedBy}
                                        onChange={(e) => setVerifiedBy(e.target.value)}
                                    />
                                </div>

                                {/* Reference No */}
                                <div className="col-md-4">
                                    <label className="form-label fw-bold fs-micro text-dark">Reference No.</label>
                                    <input
                                        type="text"
                                        className="form-control fs-small"
                                        placeholder="Enter reference (optional)"
                                        value={referenceNo}
                                        onChange={(e) => setReferenceNo(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 2. Cash Breakdown Card (Optional) */}
                        <div className="bg-white border rounded-4 p-4 mb-4 shadow-sm" style={{ borderColor: "#E2E8F0" }}>
                            <div className="d-flex align-items-center justify-content-between mb-3">
                                <h5 className="fw-bold text-dark fs-6 m-0 d-flex align-items-center gap-2">
                                    <i className="bi bi-[#16A34A] bi-calculator text-success" />
                                    Cash Breakdown (Optional)
                                </h5>
                                <span className="fs-micro text-muted">Auto calculates opening balance</span>
                            </div>

                            <div className="row g-2 mb-3">
                                {[
                                    { label: '₹2000', key: 'd2000' },
                                    { label: '₹500', key: 'd500' },
                                    { label: '₹200', key: 'd200' },
                                    { label: '₹100', key: 'd100' },
                                    { label: '₹50', key: 'd50' },
                                    { label: '₹20', key: 'd20' },
                                    { label: '₹10', key: 'd10' },
                                    { label: '₹5', key: 'd5' },
                                    { label: '₹2', key: 'd2' },
                                    { label: '₹1', key: 'd1' },
                                ].map((item) => (
                                    <div className="col-md-2.4 col-6" key={item.key} style={{ flex: "0 0 20%", maxWidth: "20%" }}>
                                        <div className="p-2 border rounded-3 bg-light-subtle">
                                            <span className="fw-bold text-dark fs-micro d-block mb-1">{item.label}</span>
                                            <input
                                                type="number"
                                                min="0"
                                                className="form-control form-control-sm text-center fw-bold"
                                                value={denominations[item.key]}
                                                onChange={(e) => handleDenominationChange(item.key, e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Total Cash Banner */}
                            <div className="p-3 rounded-3 d-flex align-items-center justify-content-between" style={{ background: "#F0FDF4", border: "1px solid #DCFCE7" }}>
                                <div className="d-flex align-items-center gap-2">
                                    <i className="bi bi-calculator-fill fs-4 text-success" />
                                    <span className="fw-bold text-dark fs-small">Total Cash Breakdown</span>
                                </div>
                                <div className="fs-4 fw-extrabold text-success">
                                    {currencySymbol} {breakdownTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </div>
                            </div>
                        </div>

                        {/* 3. Action Buttons Row */}
                        <div className="d-flex align-items-center justify-content-between p-3 bg-white border rounded-4 shadow-sm" style={{ borderColor: "#E2E8F0" }}>
                            <div className="d-flex align-items-center gap-2">
                                <button type="button" className="btn btn-light border fw-bold text-secondary px-3 py-2" onClick={handleReset}>
                                    Reset
                                </button>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <button
                                    type="button"
                                    className="btn btn-outline-success fw-bold px-4 py-2"
                                    onClick={handleSubmitOpenRegister}
                                >
                                    Save Draft
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-success fw-bold px-4 py-2 shadow-sm d-flex align-items-center gap-2 text-white"
                                    style={{ background: "#16A34A", border: "none", borderRadius: "10px" }}
                                    onClick={handleSubmitOpenRegister}
                                >
                                    <i className="bi bi-check-circle-fill" /> Open Register (F8)
                                </button>
                            </div>
                        </div>

                    </div>

                    {/* ── RIGHT SUMMARY SIDEBAR (30%) ── */}
                    <div className="col-lg-4">

                        {/* Card 1: Register Summary */}
                        <div className="bg-white border rounded-4 p-4 mb-4 shadow-sm" style={{ borderColor: "#E2E8F0" }}>
                            <h5 className="fw-bold text-dark fs-6 mb-3 d-flex align-items-center gap-2">
                                <i className="bi bi-journal-text text-success" />
                                Register Summary
                            </h5>

                            <div className="d-flex flex-column gap-2.5 fs-small text-muted mb-3">
                                <div className="d-flex justify-content-between">
                                    <span>Register ID</span>
                                    <strong className="text-dark">Auto generated</strong>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span>Opening Date</span>
                                    <strong className="text-dark">{moment().format("DD MMM YYYY")}</strong>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span>Opening Time</span>
                                    <strong className="text-dark">{moment().format("hh:mm A")}</strong>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span>Cashier</span>
                                    <strong className="text-dark">{cashierFullName}</strong>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span>Warehouse</span>
                                    <strong className="text-dark">City Center Depot</strong>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span>Default Customer</span>
                                    <strong className="text-dark">Walk-in Customer</strong>
                                </div>

                                <hr className="my-2" />

                                <div className="d-flex justify-content-between fs-small">
                                    <span>Opening Balance</span>
                                    <strong className="text-dark">{currencySymbol} {parseFloat(openingBalance || 0).toFixed(2)}</strong>
                                </div>
                                <div className="d-flex justify-content-between fs-small">
                                    <span>Cash In Drawer</span>
                                    <strong className="text-dark">{currencySymbol} {breakdownTotal.toFixed(2)}</strong>
                                </div>
                                <div className="d-flex justify-content-between fs-small">
                                    <span>Expected Amount</span>
                                    <strong className="text-dark">{currencySymbol} {parseFloat(openingBalance || 0).toFixed(2)}</strong>
                                </div>

                                <hr className="my-2" />

                                <div className="d-flex justify-content-between align-items-center">
                                    <span>Status</span>
                                    <span className="badge bg-success-subtle text-success border border-success fw-bold px-2 py-1 fs-micro">
                                        Ready to Open
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Card 2: Important Guidelines */}
                        <div className="p-3.5 rounded-4 border" style={{ background: "#F0FDF4", borderColor: "#DCFCE7" }}>
                            <div className="fw-bold text-success fs-small mb-2 d-flex align-items-center gap-1.5">
                                <i className="bi bi-shield-check fs-5" /> Important Guidelines
                            </div>
                            <ul className="m-0 ps-3 fs-micro text-secondary" style={{ lineHeight: 1.6 }}>
                                <li>Please count the cash carefully before opening today's register.</li>
                                <li>You can add an optional opening note for reference.</li>
                                <li>Once opened, you cannot edit the opening balance for this session.</li>
                            </ul>
                        </div>

                    </div>

                </div>

            </div>
        </div>
    );
};

export default OpenRegisterWorkspace;
