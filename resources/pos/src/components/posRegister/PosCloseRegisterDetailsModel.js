import moment from "moment";
import React, { useEffect, useState } from "react";
import { Row, Col, Form, Button } from "react-bootstrap-v5";
import { useSelector } from "react-redux";
import {
    currencySymbolHandling,
    getFormattedMessage,
    numValidate,
} from "../../shared/sharedMethod";
import { Tokens } from "../../constants";
import "./CloseRegisterPremium.css";

const PosCloseRegisterDetailsModel = ({
    showCloseDetailsModal,
    handleCloseRegisterDetails,
    setShowCloseDetailsModal,
}) => {
    const { frontSetting, allConfigData, closeRegisterDetails, getRegisterDetails, settings } = useSelector(
        (state) => state
    );
    const currencySymbol =
        (frontSetting && frontSetting.value && frontSetting.value.currency_symbol) || "₹";

    // ─── Real cashier info from localStorage ─────────────────────────────────
    const loggedInFirstName = localStorage.getItem(Tokens.UPDATED_FIRST_NAME) || localStorage.getItem(Tokens.FIRST_NAME) || '';
    const loggedInLastName  = localStorage.getItem(Tokens.UPDATED_LAST_NAME)  || localStorage.getItem(Tokens.LAST_NAME)  || '';
    const cashierFullName   = `${loggedInFirstName} ${loggedInLastName}`.trim() || 'Cashier';

    // ─── Real register info from Redux state ─────────────────────────────────
    const registerInfo    = getRegisterDetails && getRegisterDetails[0];
    const registerCode    = registerInfo?.reference_code || registerInfo?.id ? `REG-${String(registerInfo.id).padStart(3, '0')}` : '—';
    const warehouseName   = settings?.attributes?.warehouse_name || registerInfo?.warehouse_name || '—';
    const openingTime     = registerInfo?.created_at ? moment(registerInfo.created_at).format("hh:mm A") : moment().format("hh:mm A");
    const businessDate    = moment().format("DD MMM YYYY");

    // ─── Form state ───────────────────────────────────────────────────────────
    const [formValue, setFormsValue] = useState({
        cash_in_hand_while_closing: 0,
        notes: "",
    });

    const [denominations, setDenominations] = useState({
        d2000: 0, d500: 0, d200: 0, d100: 0,
        d50: 0, d20: 0, d10: 0, d5: 0, d2: 0, d1: 0,
    });
    const [diffReason, setDiffReason] = useState("");

    // ─── Denomination total ───────────────────────────────────────────────────
    const denominationTotal =
        (denominations.d2000 * 2000) +
        (denominations.d500  * 500)  +
        (denominations.d200  * 200)  +
        (denominations.d100  * 100)  +
        (denominations.d50   * 50)   +
        (denominations.d20   * 20)   +
        (denominations.d10   * 10)   +
        (denominations.d5    * 5)    +
        (denominations.d2    * 2)    +
        (denominations.d1    * 1);

    useEffect(() => {
        if (closeRegisterDetails) {
            const initialCash = closeRegisterDetails?.total_cash_amount || 0;
            setFormsValue(prev => ({ ...prev, cash_in_hand_while_closing: initialCash.toFixed(2) }));
        }
    }, [closeRegisterDetails]);

    const handleDenominationChange = (key, val, denomVal) => {
        const numVal = parseInt(val, 10) || 0;
        const updated = { ...denominations, [key]: numVal };
        setDenominations(updated);
        const newTotal =
            (updated.d2000 * 2000) + (updated.d500 * 500) + (updated.d200 * 200) +
            (updated.d100 * 100)   + (updated.d50 * 50)   + (updated.d20 * 20)   +
            (updated.d10 * 10)     + (updated.d5 * 5)     + (updated.d2 * 2)     + (updated.d1 * 1);
        setFormsValue(prev => ({ ...prev, cash_in_hand_while_closing: newTotal.toFixed(2) }));
    };

    const onChangeInput = (e) => {
        setFormsValue(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // ─── Real financial data from Redux closeRegisterDetails ─────────────────
    const openingCash  = Number(closeRegisterDetails?.cash_in_hand)                   || 0;
    const cashSales    = Number(closeRegisterDetails?.today_sales_cash_payment)        || 0;
    const chequeSales  = Number(closeRegisterDetails?.today_sales_cheque_payment)      || 0;
    const bankSales    = Number(closeRegisterDetails?.today_sales_bank_transfer_payment)|| 0;
    const otherSales   = Number(closeRegisterDetails?.today_sales_other_payment)       || 0;
    const totalSales   = Number(closeRegisterDetails?.today_sales_amount)              || 0;
    const totalRefund  = Number(closeRegisterDetails?.today_sales_return_amount)       || 0;
    const totalPayment = Number(closeRegisterDetails?.today_sales_payment_amount)      || 0;
    const expectedCash = Number(closeRegisterDetails?.total_cash_amount)               || (openingCash + cashSales);
    const actualCash   = parseFloat(formValue.cash_in_hand_while_closing)             || 0;
    const difference   = actualCash - expectedCash;
    const netRevenue   = totalSales - totalRefund;

    const fmt = (val) => currencySymbolHandling(allConfigData, currencySymbol, val);

    const denomRows = [
        { label: '₹ 2000', key: 'd2000', val: 2000 },
        { label: '₹ 500',  key: 'd500',  val: 500  },
        { label: '₹ 200',  key: 'd200',  val: 200  },
        { label: '₹ 100',  key: 'd100',  val: 100  },
        { label: '₹ 50',   key: 'd50',   val: 50   },
        { label: '₹ 20',   key: 'd20',   val: 20   },
        { label: '₹ 10',   key: 'd10',   val: 10   },
        { label: '₹ 5',    key: 'd5',    val: 5    },
        { label: '₹ 2',    key: 'd2',    val: 2    },
        { label: '₹ 1',    key: 'd1',    val: 1    },
    ];

    // Not shown if modal is not active
    if (!showCloseDetailsModal) return null;

    return (
        <div className="close-reg-fullpage">

            {/* ── TOP HEADER BAR ─────────────────────────────────────────────── */}
            <div className="close-reg-topbar">
                <div className="d-flex align-items-center gap-3">
                    <button
                        type="button"
                        className="btn btn-sm btn-light border d-flex align-items-center gap-1 fw-bold"
                        style={{ fontSize: "12px", borderRadius: "8px" }}
                        onClick={() => setShowCloseDetailsModal(false)}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m15 18-6-6 6-6"/>
                        </svg>
                        Back to POS
                    </button>
                    <div>
                        <div className="d-flex align-items-center gap-2">
                            <span className="badge fw-bold px-2 py-1" style={{ background: "#FEE2E2", color: "#DC2626", fontSize: "10px", borderRadius: "6px" }}>
                                🔒 END OF SHIFT
                            </span>
                            <h5 className="fw-bold text-dark m-0" style={{ fontSize: "16px" }}>Close Register — Shift Closing</h5>
                        </div>
                        <span style={{ fontSize: "11px", color: "#64748B" }}>Review all transactions, reconcile cash and close the register cleanly.</span>
                    </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <button type="button" className="btn btn-sm btn-outline-secondary fw-bold" style={{ fontSize: "11px", borderRadius: "8px" }} onClick={() => window.print()}>
                        <i className="bi bi-printer me-1" /> Print X Report
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-secondary fw-bold" style={{ fontSize: "11px", borderRadius: "8px" }} onClick={() => window.print()}>
                        <i className="bi bi-printer-fill me-1" /> Print Z Report
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm fw-bold text-white"
                        style={{ fontSize: "11px", borderRadius: "8px", background: "#16A34A", border: "none" }}
                        onClick={() => handleCloseRegisterDetails(formValue)}
                    >
                        <i className="bi bi-lock-fill me-1" /> Close Register
                    </button>
                </div>
            </div>

            {/* ── SCROLLABLE BODY ────────────────────────────────────────────── */}
            <div className="close-reg-body">

                {/* ── SHIFT META INFO BAR ──────────────────────────────────── */}
                <div className="close-meta-strip">
                    <div className="close-meta-chip">
                        <span className="close-chip-label">Register</span>
                        <span className="close-chip-val">{registerCode}</span>
                    </div>
                    <div className="close-meta-chip">
                        <span className="close-chip-label">Cashier</span>
                        <span className="close-chip-val">{cashierFullName}</span>
                    </div>
                    <div className="close-meta-chip">
                        <span className="close-chip-label">Warehouse</span>
                        <span className="close-chip-val">{warehouseName}</span>
                    </div>
                    <div className="close-meta-chip">
                        <span className="close-chip-label">Opening Time</span>
                        <span className="close-chip-val">{openingTime}</span>
                    </div>
                    <div className="close-meta-chip">
                        <span className="close-chip-label">Business Date</span>
                        <span className="close-chip-val">{businessDate}</span>
                    </div>
                    <div className="close-meta-chip">
                        <span className="close-chip-label">Closing Time</span>
                        <span className="close-chip-val">{moment().format("hh:mm A")}</span>
                    </div>
                    <div className="close-meta-chip">
                        <span className="close-chip-label">Status</span>
                        <span className="badge fw-bold" style={{ background: "#DCFCE7", color: "#15803D", fontSize: "10px", borderRadius: "6px", padding: "3px 8px" }}>
                            ● Ready To Close
                        </span>
                    </div>
                </div>

                {/* ── 3-COLUMN SUMMARY CARDS ───────────────────────────────── */}
                <Row className="g-3 mb-3">

                    {/* Payment Breakdown */}
                    <Col lg={4}>
                        <div className="close-info-card">
                            <div className="close-info-card-title">
                                <i className="bi bi-wallet2 text-success" /> Payment Breakdown
                            </div>
                            <div className="close-info-row">
                                <span>💵 Cash Sales</span>
                                <span className="fw-bold font-mono">{fmt(cashSales)}</span>
                            </div>
                            <div className="close-info-row">
                                <span>🧾 Cheque</span>
                                <span className="fw-bold font-mono">{fmt(chequeSales)}</span>
                            </div>
                            <div className="close-info-row">
                                <span>🏦 Bank Transfer</span>
                                <span className="fw-bold font-mono">{fmt(bankSales)}</span>
                            </div>
                            <div className="close-info-row">
                                <span>💳 Other</span>
                                <span className="fw-bold font-mono">{fmt(otherSales)}</span>
                            </div>
                            <div className="close-info-row close-info-total">
                                <span>Total Payment</span>
                                <span className="text-success font-mono">{fmt(totalPayment || cashSales + chequeSales + bankSales + otherSales)}</span>
                            </div>
                        </div>
                    </Col>

                    {/* Sales Summary */}
                    <Col lg={4}>
                        <div className="close-info-card">
                            <div className="close-info-card-title">
                                <i className="bi bi-graph-up-arrow text-primary" /> Sales Summary
                            </div>
                            <div className="close-info-row">
                                <span>Gross Sales</span>
                                <span className="fw-bold font-mono">{fmt(totalSales)}</span>
                            </div>
                            <div className="close-info-row text-danger">
                                <span>(-) Returns</span>
                                <span className="fw-bold font-mono">{fmt(totalRefund)}</span>
                            </div>
                            <div className="close-info-row">
                                <span>Opening Cash</span>
                                <span className="fw-bold font-mono">{fmt(openingCash)}</span>
                            </div>
                            <div className="close-info-row">
                                <span>Expected Cash</span>
                                <span className="fw-bold font-mono">{fmt(expectedCash)}</span>
                            </div>
                            <div className="close-info-row close-info-total">
                                <span>Net Revenue</span>
                                <span className="text-primary font-mono">{fmt(netRevenue)}</span>
                            </div>
                        </div>
                    </Col>

                    {/* Cash Reconciliation */}
                    <Col lg={4}>
                        <div className="close-info-card">
                            <div className="close-info-card-title">
                                <i className="bi bi-cash-coin text-warning" /> Cash Reconciliation
                            </div>
                            <div className="close-info-row">
                                <span>Opening Cash</span>
                                <span className="fw-bold font-mono">{fmt(openingCash)}</span>
                            </div>
                            <div className="close-info-row text-success">
                                <span>(+) Cash Sales</span>
                                <span className="fw-bold font-mono">{fmt(cashSales)}</span>
                            </div>
                            <div className="close-info-row">
                                <span>Expected Cash</span>
                                <span className="fw-bold font-mono">{fmt(expectedCash)}</span>
                            </div>
                            <div className="close-info-row">
                                <span>Actual Counted Cash</span>
                                <span className="fw-bold font-mono text-primary">{fmt(actualCash)}</span>
                            </div>
                            <div className={`close-info-row close-info-total ${difference === 0 ? 'text-success' : difference < 0 ? 'text-danger' : 'text-warning'}`}>
                                <span>Difference</span>
                                <span className="font-mono">
                                    {difference === 0
                                        ? `✓ ${fmt(0)} (Perfect)`
                                        : `${difference > 0 ? '+' : ''}${fmt(difference)} (${difference < 0 ? 'Short' : 'Excess'})`
                                    }
                                </span>
                            </div>
                        </div>
                    </Col>
                </Row>

                {/* ── DENOMINATION COUNTER + CLOSING NOTES ─────────────────── */}
                <Row className="g-3">

                    {/* Cash Denominations */}
                    <Col lg={7}>
                        <div className="close-info-card">
                            <div className="d-flex align-items-center justify-content-between mb-3">
                                <div className="close-info-card-title mb-0">
                                    <i className="bi bi-grid-3x3-gap-fill text-success" /> Cash Denominations Counter
                                </div>
                                <span style={{ fontSize: "11px", color: "#64748B" }}>Enter quantity of each note</span>
                            </div>
                            <div className="denom-grid">
                                {denomRows.map((item) => (
                                    <div className="denom-row-item" key={item.key}>
                                        <span className="denom-lbl">{item.label}</span>
                                        <span className="denom-times">×</span>
                                        <input
                                            type="number"
                                            min="0"
                                            className="denom-qty-input"
                                            value={denominations[item.key] || ''}
                                            placeholder="0"
                                            onChange={(e) => handleDenominationChange(item.key, e.target.value, item.val)}
                                            onKeyPress={(e) => numValidate(e)}
                                        />
                                        <span className="denom-amt">
                                            ₹ {((denominations[item.key] || 0) * item.val).toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="denom-total-bar">
                                <span className="fw-bold text-success">Total Cash Counted</span>
                                <span className="fw-bold text-success" style={{ fontSize: "18px", fontFamily: "monospace" }}>
                                    ₹ {denominationTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </Col>

                    {/* Closing Notes + Action */}
                    <Col lg={5}>
                        <div className="close-info-card h-100 d-flex flex-column">
                            <div className="close-info-card-title">
                                <i className="bi bi-pencil-square text-dark" /> Closing Details
                            </div>

                            <Form.Group className="mb-3">
                                <Form.Label style={{ fontSize: "12px", fontWeight: 700, color: "#374151" }}>
                                    Total Counted Cash <span className="text-danger">*</span>
                                </Form.Label>
                                <div className="input-group input-group-sm">
                                    <span className="input-group-text fw-bold">{currencySymbol}</span>
                                    <Form.Control
                                        type="text"
                                        name="cash_in_hand_while_closing"
                                        className="fw-bold font-mono"
                                        value={formValue.cash_in_hand_while_closing}
                                        onKeyPress={(e) => numValidate(e)}
                                        onChange={onChangeInput}
                                        style={{ height: "40px", fontSize: "16px", borderColor: "#16A34A" }}
                                    />
                                </div>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label style={{ fontSize: "12px", fontWeight: 700, color: "#374151" }}>
                                    Closing Notes <span className="text-muted fw-normal">(Optional)</span>
                                </Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    name="notes"
                                    style={{ fontSize: "12px", resize: "none" }}
                                    placeholder="Add remarks or explanations for shift closing..."
                                    value={formValue.notes}
                                    onChange={onChangeInput}
                                />
                            </Form.Group>

                            {difference !== 0 && (
                                <div className="p-2 rounded-3 mb-3" style={{ background: "#FEF2F2", border: "1px solid #FCA5A5" }}>
                                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#DC2626", marginBottom: "6px" }}>
                                        ⚠️ Cash {difference < 0 ? 'Shortage' : 'Excess'}: {fmt(Math.abs(difference))}
                                    </div>
                                    <Form.Select
                                        size="sm"
                                        style={{ fontSize: "11px", fontWeight: 600 }}
                                        value={diffReason}
                                        onChange={(e) => setDiffReason(e.target.value)}
                                    >
                                        <option value="">Select Reason...</option>
                                        <option value="rounding">Rounding Difference</option>
                                        <option value="change_error">Cash Change Error</option>
                                        <option value="unrecorded_expense">Unrecorded Cash Expense</option>
                                        <option value="verified_by_manager">Verified by Manager</option>
                                    </Form.Select>
                                </div>
                            )}

                            <div className="mt-auto pt-3 border-top">
                                <button
                                    type="button"
                                    className="btn w-100 fw-bold text-white"
                                    style={{ background: "#16A34A", border: "none", borderRadius: "10px", height: "44px", fontSize: "14px" }}
                                    onClick={() => handleCloseRegisterDetails(formValue)}
                                >
                                    <i className="bi bi-lock-fill me-2" />
                                    Close Register & End Shift
                                </button>
                                <button
                                    type="button"
                                    className="btn w-100 btn-light border fw-bold mt-2"
                                    style={{ borderRadius: "10px", height: "38px", fontSize: "13px" }}
                                    onClick={() => setShowCloseDetailsModal(false)}
                                >
                                    Cancel — Back to POS
                                </button>
                            </div>
                        </div>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default PosCloseRegisterDetailsModel;
