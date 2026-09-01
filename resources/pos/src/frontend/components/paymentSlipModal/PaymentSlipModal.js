import React, { useEffect } from "react";
import { Modal, Image } from "react-bootstrap";
import { calculateProductCost } from "../../shared/SharedMethod";
import {
    currencySymbolHandling,
    getFormattedDate,
    getFormattedMessage,
} from "../../../shared/sharedMethod";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPrint,
    faXmark,
    faReceipt,
    faStore,
    faPhone,
    faEnvelope,
    faCheckCircle,
    faTags,
    faRotateLeft,
    faBagShopping,
    faWallet,
    faShieldCheck
} from "@fortawesome/free-solid-svg-icons";

const cleanPaymentType = (type) => {
    if (!type) return "Cash";
    if (typeof type === "object") {
        return type.label || type.name || "Cash";
    }
    const str = String(type).toLowerCase();
    if (str.includes("cash")) return "Cash";
    if (str.includes("card") || str.includes("credit")) return "Card";
    if (str.includes("upi") || str.includes("qr") || str.includes("gpay") || str.includes("phonepe")) return "UPI";
    if (str.includes("bank") || str.includes("transfer") || str.includes("cheque")) return "Bank Transfer";
    const formatted = getFormattedMessage(type);
    if (formatted && !formatted.includes("payment-type") && !formatted.includes("filter")) {
        return formatted;
    }
    return "Cash";
};

const PaymentSlipModal = (props) => {
    const {
        settings,
        modalShowPaymentSlip,
        setModalShowPaymentSlip,
        updateProducts,
        printPaymentReceiptPdf,
        paymentType,
        frontSetting,
        paymentDetails,
        allConfigData,
        setPaymentValue,
        paymentTypeDefaultValue,
    } = props;

    // Keyboard shortcut for Ctrl + P to trigger print
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (modalShowPaymentSlip && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
                e.preventDefault();
                printPaymentReceiptPdf();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [modalShowPaymentSlip, printPaymentReceiptPdf]);

    const currency =
        updateProducts.settings &&
        updateProducts.settings.attributes &&
        updateProducts.settings.attributes.currency_symbol;

    const companyName = frontSetting?.value?.company_name || "infy-pos";
    const storeAddress = frontSetting?.value?.address || "Atlanta Shopping Mall, C-303, Nr. Sudama Chowk, Mota Varachha, Surat, Gujarat - 395006, India";
    const storeEmail = frontSetting?.value?.email || "support@infypos.com";
    const storePhone = frontSetting?.value?.phone || "1234567890";
    
    const customerName = updateProducts.customer_name && updateProducts.customer_name[0]
        ? updateProducts.customer_name[0].label
        : (updateProducts.customer_name && updateProducts.customer_name.label) || "walk-in-customer";

    const formattedPaymentType = cleanPaymentType(paymentType);
    const invoiceRefNo = paymentDetails?.attributes?.reference_code || updateProducts?.reference_code || "INV-250804-0001";
    const currentDateStr = getFormattedDate(new Date(), allConfigData);
    const currentTimeStr = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

    // Calculate totals & discounts
    const totalItemsCount = updateProducts?.products?.length || 0;
    const discountAmount = parseFloat(updateProducts?.discount || 0);
    const taxTotalAmount = parseFloat(updateProducts?.taxTotal || 0);
    const taxRatePercent = parseFloat(updateProducts?.tax || 0);
    const subTotalAmount = parseFloat(updateProducts?.subTotal || 0);
    const grandTotalAmount = parseFloat(updateProducts?.grandTotal || 0);
    const isSaved = discountAmount > 0;

    return (
        <Modal
            show={modalShowPaymentSlip}
            onHide={() => {
                setModalShowPaymentSlip(false);
                setPaymentValue({
                    payment_type: paymentTypeDefaultValue[0],
                });
            }}
            centered
            dialogClassName="modal-dialog-centered"
            style={{ zIndex: 1055 }}
        >
            <div
                className="bg-white rounded-4 shadow-lg overflow-hidden border-0 mx-auto"
                style={{ width: "100%", maxWidth: "480px", fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
            >
                {/* Modal Header */}
                <div className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom bg-white">
                    <h5 className="fw-bold m-0 text-dark" style={{ fontSize: "16px" }}>
                        Invoice POS
                    </h5>
                    <button
                        type="button"
                        className="btn-close text-secondary"
                        aria-label="Close"
                        onClick={() => {
                            setModalShowPaymentSlip(false);
                            setPaymentValue({
                                payment_type: paymentTypeDefaultValue[0],
                            });
                        }}
                    />
                </div>

                {/* Modal Body - 80mm Enterprise Thermal Paper Slip Container */}
                <div className="p-3 bg-light" style={{ maxHeight: "78vh", overflowY: "auto" }}>
                    <div
                        className="bg-white p-4 rounded-3 border shadow-sm mx-auto"
                        style={{
                            maxWidth: "430px",
                            fontFamily: "'Inter', -apple-system, monospace, sans-serif",
                            fontSize: "12px",
                            color: "#0F172A",
                            lineHeight: "1.4"
                        }}
                    >
                        {/* 1. Header Logo & Store Contact Details */}
                        <div className="text-center mb-3">
                            {settings?.attributes?.show_logo_in_receipt === "1" && frontSetting?.value?.logo ? (
                                <img
                                    src={frontSetting.value.logo}
                                    alt="Logo"
                                    style={{ maxHeight: "48px", maxWidth: "140px", objectFit: "contain", marginBottom: "8px" }}
                                />
                            ) : (
                                <div className="mb-1 text-primary fw-bold" style={{ fontSize: "28px" }}>
                                    <FontAwesomeIcon icon={faStore} />
                                </div>
                            )}
                            <h3 className="fw-extrabold text-dark m-0" style={{ fontSize: "22px", letterSpacing: "-0.5px" }}>
                                {companyName}
                            </h3>
                            <div className="fw-bold text-dark mt-1" style={{ fontSize: "12px" }}>
                                Atlanta Shopping Mall
                            </div>
                            <div className="text-secondary px-2 mt-0.5" style={{ fontSize: "11px", color: "#475569" }}>
                                {storeAddress}
                            </div>
                            <div className="d-flex align-items-center justify-content-center gap-3 text-secondary mt-1" style={{ fontSize: "11px" }}>
                                <span><FontAwesomeIcon icon={faPhone} className="me-1" />{storePhone}</span>
                                <span>|</span>
                                <span><FontAwesomeIcon icon={faEnvelope} className="me-1" />{storeEmail}</span>
                            </div>
                        </div>

                        {/* Divider Line */}
                        <div style={{ borderTop: "1px dashed #CBD5E1", margin: "14px 0" }} />

                        {/* 2. TAX INVOICE Header */}
                        <div className="text-center fw-extrabold text-dark tracking-wider mb-2" style={{ fontSize: "13px", letterSpacing: "1px" }}>
                            TAX INVOICE
                        </div>

                        {/* 3. Transaction Meta Details (2-Column Grid) */}
                        <div className="py-1" style={{ fontSize: "11.5px" }}>
                            <div className="row g-1">
                                <div className="col-6">
                                    <div><span className="fw-bold text-dark">Invoice No.</span> : <span className="fw-semibold">{invoiceRefNo}</span></div>
                                    <div><span className="fw-bold text-dark">Date</span> : {currentDateStr}</div>
                                    <div><span className="fw-bold text-dark">Time</span> : {currentTimeStr}</div>
                                </div>
                                <div className="col-6 ps-2">
                                    <div><span className="fw-bold text-dark">POS ID</span> : POS-01</div>
                                    <div><span className="fw-bold text-dark">Cashier</span> : Nandhini M</div>
                                    <div><span className="fw-bold text-dark">Customer</span> : {customerName}</div>
                                </div>
                            </div>
                        </div>

                        {/* Divider Line */}
                        <div style={{ borderTop: "1px dashed #CBD5E1", margin: "12px 0" }} />

                        {/* 4. Product Table (DMart Supermarket Table Design) */}
                        <div className="mb-3">
                            <div
                                className="d-flex align-items-center fw-bold text-dark py-1.5 px-2 rounded-2 mb-2"
                                style={{ background: "#E8F5E9", fontSize: "10.5px", letterSpacing: "0.3px" }}
                            >
                                <span style={{ width: "8%" }}>#</span>
                                <span style={{ width: "42%" }}>ITEM DETAILS</span>
                                <span style={{ width: "15%", textAlign: "center" }}>QTY</span>
                                <span style={{ width: "17%", textAlign: "end" }}>RATE (₹)</span>
                                <span style={{ width: "18%", textAlign: "end" }}>AMOUNT (₹)</span>
                            </div>

                            {updateProducts.products && updateProducts.products.length > 0 ? (
                                updateProducts.products.map((item, idx) => {
                                    const itemCost = calculateProductCost(item);
                                    const itemTotal = item.quantity * itemCost;

                                    return (
                                        <div key={idx} className="py-2" style={{ borderBottom: "1px dashed #E2E8F0" }}>
                                            <div className="d-flex align-items-start" style={{ fontSize: "11.5px" }}>
                                                <span className="fw-bold text-secondary" style={{ width: "8%" }}>{idx + 1}</span>
                                                <div style={{ width: "42%", paddingRight: "4px" }}>
                                                    <div className="fw-bold text-dark" style={{ lineHeight: "1.3" }}>
                                                        {item.name}
                                                    </div>
                                                    <div className="text-secondary" style={{ fontSize: "10.5px" }}>
                                                        ({item.code})
                                                    </div>
                                                </div>
                                                <span className="fw-bold text-dark" style={{ width: "15%", textAlign: "center" }}>
                                                    {item.quantity.toFixed(2)}
                                                </span>
                                                <span className="fw-medium text-dark" style={{ width: "17%", textAlign: "end" }}>
                                                    {itemCost.toFixed(2)}
                                                </span>
                                                <span className="fw-extrabold text-dark" style={{ width: "18%", textAlign: "end" }}>
                                                    {itemTotal.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-2 text-muted">No items in bill</div>
                            )}
                        </div>

                        {/* 5. Financial Totals Section */}
                        <div className="ms-auto" style={{ maxWidth: "280px", fontSize: "11.5px" }}>
                            <div className="d-flex justify-content-between py-1">
                                <span className="text-dark fw-medium">Subtotal ({totalItemsCount} Item)</span>
                                <span className="fw-bold text-dark">₹ {subTotalAmount.toFixed(2)}</span>
                            </div>
                            <div className="d-flex justify-content-between py-1">
                                <span className="text-dark fw-medium">Discount</span>
                                <span className="fw-bold text-dark">₹ {discountAmount.toFixed(2)}</span>
                            </div>
                            <div className="d-flex justify-content-between py-1">
                                <span className="text-dark fw-medium">Coupon Discount</span>
                                <span className="fw-bold text-dark">₹ 0.00</span>
                            </div>
                            <div className="d-flex justify-content-between py-1">
                                <span className="text-dark fw-medium">Loyalty Discount</span>
                                <span className="fw-bold text-dark">₹ 0.00</span>
                            </div>

                            <div style={{ borderTop: "1px dashed #E2E8F0", margin: "6px 0" }} />

                            <div className="d-flex justify-content-between py-1">
                                <span className="text-dark fw-medium">Taxable Amount</span>
                                <span className="fw-bold text-dark">₹ {subTotalAmount.toFixed(2)}</span>
                            </div>
                            <div className="d-flex justify-content-between py-1">
                                <span className="text-dark fw-medium">CGST ({taxRatePercent > 0 ? (taxRatePercent/2).toFixed(1) : 0}%)</span>
                                <span className="fw-bold text-dark">₹ {(taxTotalAmount/2).toFixed(2)}</span>
                            </div>
                            <div className="d-flex justify-content-between py-1">
                                <span className="text-dark fw-medium">SGST ({taxRatePercent > 0 ? (taxRatePercent/2).toFixed(1) : 0}%)</span>
                                <span className="fw-bold text-dark">₹ {(taxTotalAmount/2).toFixed(2)}</span>
                            </div>
                            <div className="d-flex justify-content-between py-1">
                                <span className="text-dark fw-medium">Order Tax ({taxRatePercent.toFixed(2)}%)</span>
                                <span className="fw-bold text-dark">₹ {taxTotalAmount.toFixed(2)}</span>
                            </div>
                            <div className="d-flex justify-content-between py-1">
                                <span className="text-dark fw-medium">Shipping</span>
                                <span className="fw-bold text-dark">₹ {parseFloat(updateProducts?.shipping || 0).toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Divider Line */}
                        <div style={{ borderTop: "1px dashed #CBD5E1", margin: "14px 0" }} />

                        {/* 6. GRAND TOTAL Banner */}
                        <div className="d-flex align-items-center justify-content-between py-1 mb-3">
                            <span className="fw-extrabold text-dark" style={{ fontSize: "16px", letterSpacing: "0.5px" }}>
                                GRAND TOTAL
                            </span>
                            <span className="fw-extrabold text-success" style={{ fontSize: "24px" }}>
                                ₹ {grandTotalAmount.toFixed(2)}
                            </span>
                        </div>

                        {/* 7. Payment Cards (DMart Style Green Card Boxes) */}
                        <div className="mb-3">
                            <div
                                className="d-flex align-items-center justify-content-between p-2.5 mb-2 rounded-3"
                                style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}
                            >
                                <div className="d-flex align-items-center gap-2">
                                    <div className="rounded-2 d-flex align-items-center justify-content-center" style={{ width: "26px", height: "26px", background: "#DCFCE7", color: "#15803D" }}>
                                        <FontAwesomeIcon icon={faWallet} style={{ fontSize: "13px" }} />
                                    </div>
                                    <span className="fw-bold text-dark" style={{ fontSize: "12px" }}>Amount Paid</span>
                                </div>
                                <span className="fw-extrabold text-dark" style={{ fontSize: "13.5px" }}>
                                    ₹ {grandTotalAmount.toFixed(2)}
                                </span>
                            </div>

                            <div
                                className="d-flex align-items-center justify-content-between p-2.5 rounded-3"
                                style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}
                            >
                                <div className="d-flex align-items-center gap-2">
                                    <div className="rounded-2 d-flex align-items-center justify-content-center" style={{ width: "26px", height: "26px", background: "#DCFCE7", color: "#15803D" }}>
                                        <FontAwesomeIcon icon={faCheckCircle} style={{ fontSize: "13px" }} />
                                    </div>
                                    <span className="fw-bold text-dark" style={{ fontSize: "12px" }}>Payment Type</span>
                                </div>
                                <span className="fw-extrabold text-success" style={{ fontSize: "13px" }}>
                                    {formattedPaymentType}
                                </span>
                            </div>
                        </div>

                        {/* 8. Savings Highlight Banner */}
                        {isSaved && (
                            <div className="p-2 mb-3 bg-success bg-opacity-10 border border-success rounded-3 text-center text-success fw-bold" style={{ fontSize: "11.5px" }}>
                                🎉 You Saved Today ₹ {discountAmount.toFixed(2)} using Discounts & Offers!
                            </div>
                        )}

                        <div style={{ borderTop: "1px dashed #CBD5E1", margin: "14px 0" }} />

                        {/* 9. Thank You Message & Barcode */}
                        <div className="text-center mb-3">
                            <div className="d-flex align-items-center justify-content-center gap-2 text-dark fw-bold mb-1" style={{ fontSize: "12px" }}>
                                <div className="rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: "24px", height: "24px", background: "#DCFCE7", color: "#16A34A" }}>
                                    <FontAwesomeIcon icon={faBagShopping} style={{ fontSize: "12px" }} />
                                </div>
                                <div>Thank you for shopping with us! Please visit again.</div>
                            </div>

                            <div style={{ borderTop: "1px dashed #CBD5E1", margin: "12px 0" }} />

                            <div className="fw-bold text-secondary mb-1" style={{ fontSize: "11px" }}>
                                Scan to visit again
                            </div>

                            {paymentDetails?.attributes?.barcode_url ? (
                                <div className="text-center mt-1">
                                    <Image
                                        src={paymentDetails.attributes.barcode_url}
                                        alt="Barcode"
                                        style={{ height: "42px", maxWidth: "240px", objectFit: "contain" }}
                                    />
                                    <div className="fw-extrabold text-dark mt-1" style={{ fontSize: "11px", letterSpacing: "1px" }}>
                                        {invoiceRefNo.replace(/[^a-zA-Z0-9]/g, "")}
                                    </div>
                                </div>
                            ) : (
                                <div className="fw-bold text-dark">{invoiceRefNo}</div>
                            )}
                        </div>

                        <div style={{ borderTop: "1px dashed #CBD5E1", margin: "14px 0" }} />

                        {/* 10. 4 Bottom Quality & Service Badges (DMart Feature Strip) */}
                        <div className="row g-1 text-center py-1 mb-2">
                            <div className="col-3">
                                <div className="text-success mb-0.5" style={{ fontSize: "15px" }}><FontAwesomeIcon icon={faShieldCheck} /></div>
                                <div className="fw-bold text-dark" style={{ fontSize: "9.5px", lineHeight: "1.2" }}>Quality Products</div>
                            </div>
                            <div className="col-3">
                                <div className="text-success mb-0.5" style={{ fontSize: "15px" }}><FontAwesomeIcon icon={faTags} /></div>
                                <div className="fw-bold text-dark" style={{ fontSize: "9.5px", lineHeight: "1.2" }}>Best Price</div>
                            </div>
                            <div className="col-3">
                                <div className="text-success mb-0.5" style={{ fontSize: "15px" }}><FontAwesomeIcon icon={faRotateLeft} /></div>
                                <div className="fw-bold text-dark" style={{ fontSize: "9.5px", lineHeight: "1.2" }}>Easy Returns</div>
                            </div>
                            <div className="col-3">
                                <div className="text-success mb-0.5" style={{ fontSize: "15px" }}><FontAwesomeIcon icon={faBagShopping} /></div>
                                <div className="fw-bold text-dark" style={{ fontSize: "9.5px", lineHeight: "1.2" }}>Happy Shopping</div>
                            </div>
                        </div>

                        {/* Policy Box */}
                        <div className="p-2 border rounded-2 text-center text-secondary fw-semibold bg-light" style={{ fontSize: "10.5px" }}>
                            Goods once sold will not be taken back or exchanged.
                        </div>
                    </div>
                </div>

                {/* Modal Footer Action Buttons */}
                <div className="d-flex align-items-center justify-content-center gap-3 p-3 bg-white border-top">
                    <button
                        type="button"
                        className="btn btn-success fw-bold px-4 py-2.5 text-white shadow-sm d-inline-flex align-items-center gap-2"
                        style={{ borderRadius: "10px", fontSize: "14px", background: "#00A650", border: "none" }}
                        onClick={printPaymentReceiptPdf}
                    >
                        <FontAwesomeIcon icon={faPrint} />
                        <span>Print</span>
                    </button>

                    <button
                        type="button"
                        className="btn btn-secondary fw-bold px-4 py-2.5 text-dark border-0"
                        style={{ borderRadius: "10px", fontSize: "14px", background: "#CBD5E1" }}
                        onClick={() => {
                            setModalShowPaymentSlip(false);
                            setPaymentValue({
                                payment_type: paymentTypeDefaultValue[0],
                            });
                        }}
                    >
                        <span>Close</span>
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default PaymentSlipModal;
