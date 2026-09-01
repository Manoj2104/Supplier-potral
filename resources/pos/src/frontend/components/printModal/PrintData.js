import React from "react";
import { Image } from "react-bootstrap-v5";
import { calculateProductCost } from "../../shared/SharedMethod";
import "../../../assets/scss/frontend/pdf.scss";
import {
    currencySymbolHandling,
    getFormattedDate,
    getFormattedMessage,
} from "../../../shared/sharedMethod";

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

class PrintData extends React.PureComponent {
    render() {
        const paymentPrint = this.props.updateProducts;
        const allConfigData = this.props.allConfigData;
        const paymentType = this.props.paymentType;
        const currency =
            paymentPrint.settings &&
            paymentPrint.settings.attributes &&
            paymentPrint.settings.attributes.currency_symbol;

        const formattedPaymentType = cleanPaymentType(paymentType);

        const companyName = paymentPrint.frontSetting?.value?.company_name || "infy-pos";
        const storeAddress = paymentPrint.frontSetting?.value?.address || "Atlanta Shopping Mall, C-303, Nr. Sudama Chowk, Mota Varachha, Surat, Gujarat - 395006, India";
        const storeEmail = paymentPrint.frontSetting?.value?.email || "support@infypos.com";
        const storePhone = paymentPrint.frontSetting?.value?.phone || "1234567890";
        const customerName = paymentPrint.customer_name && paymentPrint.customer_name[0]
            ? paymentPrint.customer_name[0].label
            : (paymentPrint.customer_name && paymentPrint.customer_name.label) || "walk-in-customer";

        const invoiceRefNo = paymentPrint.reference_code || "INV-250804-0001";
        const currentDateStr = getFormattedDate(new Date(), allConfigData);
        const currentTimeStr = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

        const totalItemsCount = paymentPrint?.products?.length || 0;
        const discountAmount = parseFloat(paymentPrint?.discount || 0);
        const taxTotalAmount = parseFloat(paymentPrint?.taxTotal || 0);
        const taxRatePercent = parseFloat(paymentPrint?.tax || 0);
        const subTotalAmount = parseFloat(paymentPrint?.subTotal || 0);
        const grandTotalAmount = parseFloat(paymentPrint?.grandTotal || 0);

        return (
            <div
                className="print-data"
                style={{
                    padding: "12px",
                    maxWidth: "380px",
                    margin: "0 auto",
                    fontFamily: "'Courier New', Courier, monospace, sans-serif",
                    color: "#000000",
                    fontSize: "11.5px",
                    lineHeight: "1.35"
                }}
            >
                {/* 1. Logo & Store Info */}
                <div style={{ textAlign: "center", marginBottom: "10px" }}>
                    {paymentPrint.settings &&
                    paymentPrint.settings.attributes.show_logo_in_receipt === "1" &&
                    paymentPrint.frontSetting?.value?.logo ? (
                        <img
                            src={paymentPrint.frontSetting.value.logo}
                            alt="Logo"
                            style={{ maxHeight: "40px", maxWidth: "120px", marginBottom: "4px" }}
                        />
                    ) : null}
                    <h3 style={{ fontSize: "16px", fontWeight: "bold", margin: "0", textTransform: "uppercase" }}>
                        {companyName}
                    </h3>
                    <div style={{ fontSize: "11px", fontWeight: "bold" }}>Atlanta Shopping Mall</div>
                    <div style={{ fontSize: "10.5px" }}>{storeAddress}</div>
                    <div style={{ fontSize: "10.5px" }}>
                        📞 {storePhone} | ✉ {storeEmail}
                    </div>
                </div>

                <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />

                {/* 2. TAX INVOICE Header */}
                <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "12px", letterSpacing: "1px" }}>
                    TAX INVOICE
                </div>

                <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

                {/* 3. Transaction Details (Two Columns) */}
                <div style={{ fontSize: "11px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <tbody>
                            <tr>
                                <td style={{ width: "50%", verticalAlign: "top" }}>
                                    <div><strong>Invoice No.</strong> : {invoiceRefNo}</div>
                                    <div><strong>Date</strong> : {currentDateStr}</div>
                                    <div><strong>Time</strong> : {currentTimeStr}</div>
                                </td>
                                <td style={{ width: "50%", verticalAlign: "top", textAlign: "right" }}>
                                    <div><strong>POS ID</strong> : POS-01</div>
                                    <div><strong>Cashier</strong> : Nandhini M</div>
                                    <div><strong>Customer</strong> : {customerName}</div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />

                {/* 4. Product Table */}
                <div style={{ marginBottom: "8px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid #000", background: "#F1F5F9" }}>
                                <th style={{ textAlign: "left", width: "8%", padding: "4px 2px" }}>#</th>
                                <th style={{ textAlign: "left", width: "42%", padding: "4px 2px" }}>ITEM DETAILS</th>
                                <th style={{ textAlign: "center", width: "15%", padding: "4px 2px" }}>QTY</th>
                                <th style={{ textAlign: "right", width: "17%", padding: "4px 2px" }}>RATE (₹)</th>
                                <th style={{ textAlign: "right", width: "18%", padding: "4px 2px" }}>AMOUNT (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paymentPrint.products && paymentPrint.products.map((item, idx) => {
                                const itemCost = calculateProductCost(item);
                                const itemTotal = item.quantity * itemCost;

                                return (
                                    <tr key={idx} style={{ borderBottom: "1px dashed #DDD" }}>
                                        <td style={{ verticalAlign: "top", padding: "4px 2px", fontWeight: "bold" }}>{idx + 1}</td>
                                        <td style={{ verticalAlign: "top", padding: "4px 2px" }}>
                                            <div style={{ fontWeight: "bold" }}>{item.name}</div>
                                            <div style={{ fontSize: "10px" }}>({item.code})</div>
                                        </td>
                                        <td style={{ verticalAlign: "top", padding: "4px 2px", textAlign: "center", fontWeight: "bold" }}>
                                            {item.quantity.toFixed(2)}
                                        </td>
                                        <td style={{ verticalAlign: "top", padding: "4px 2px", textAlign: "right" }}>
                                            {itemCost.toFixed(2)}
                                        </td>
                                        <td style={{ verticalAlign: "top", padding: "4px 2px", textAlign: "right", fontWeight: "bold" }}>
                                            {itemTotal.toFixed(2)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* 5. Financial Totals */}
                <div style={{ marginLeft: "auto", maxWidth: "260px", fontSize: "11px" }}>
                    <div className="d-flex justify-content-between py-0.5">
                        <span>Subtotal ({totalItemsCount} Item)</span>
                        <strong>₹ {subTotalAmount.toFixed(2)}</strong>
                    </div>
                    <div className="d-flex justify-content-between py-0.5">
                        <span>Discount</span>
                        <strong>₹ {discountAmount.toFixed(2)}</strong>
                    </div>
                    <div className="d-flex justify-content-between py-0.5">
                        <span>Coupon Discount</span>
                        <strong>₹ 0.00</strong>
                    </div>
                    <div className="d-flex justify-content-between py-0.5">
                        <span>Loyalty Discount</span>
                        <strong>₹ 0.00</strong>
                    </div>

                    <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />

                    <div className="d-flex justify-content-between py-0.5">
                        <span>Taxable Amount</span>
                        <strong>₹ {subTotalAmount.toFixed(2)}</strong>
                    </div>
                    <div className="d-flex justify-content-between py-0.5">
                        <span>CGST ({(taxRatePercent/2).toFixed(1)}%)</span>
                        <strong>₹ {(taxTotalAmount/2).toFixed(2)}</strong>
                    </div>
                    <div className="d-flex justify-content-between py-0.5">
                        <span>SGST ({(taxRatePercent/2).toFixed(1)}%)</span>
                        <strong>₹ {(taxTotalAmount/2).toFixed(2)}</strong>
                    </div>
                    <div className="d-flex justify-content-between py-0.5">
                        <span>Order Tax ({taxRatePercent.toFixed(2)}%)</span>
                        <strong>₹ {taxTotalAmount.toFixed(2)}</strong>
                    </div>
                    <div className="d-flex justify-content-between py-0.5">
                        <span>Shipping</span>
                        <strong>₹ {parseFloat(paymentPrint?.shipping || 0).toFixed(2)}</strong>
                    </div>
                </div>

                <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />

                {/* 6. GRAND TOTAL */}
                <div className="d-flex justify-content-between py-1" style={{ fontSize: "15px", fontWeight: "bold" }}>
                    <span>GRAND TOTAL</span>
                    <span>₹ {grandTotalAmount.toFixed(2)}</span>
                </div>

                <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />

                {/* 7. Payment Info */}
                <div style={{ fontSize: "11px" }}>
                    <div className="d-flex justify-content-between py-0.5">
                        <span><strong>Amount Paid:</strong></span>
                        <strong>₹ {grandTotalAmount.toFixed(2)}</strong>
                    </div>
                    <div className="d-flex justify-content-between py-0.5">
                        <span><strong>Payment Type:</strong></span>
                        <strong>{formattedPaymentType}</strong>
                    </div>
                </div>

                <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />

                {/* 8. Footer & Barcode */}
                <div style={{ textAlign: "center", marginTop: "10px" }}>
                    <div style={{ fontWeight: "bold", fontSize: "12px" }}>
                        Thank you for shopping with us!
                    </div>
                    <div style={{ fontSize: "11px" }}>Please visit again.</div>

                    <div style={{ marginTop: "6px", fontSize: "11px", fontWeight: "bold" }}>
                        Scan to visit again
                    </div>

                    {paymentPrint.barcode_url ? (
                        <div style={{ textAlign: "center", marginTop: "4px" }}>
                            <Image
                                src={paymentPrint.barcode_url}
                                alt={invoiceRefNo}
                                height={38}
                                width={180}
                            />
                            <div style={{ fontWeight: "bold", fontSize: "11px", letterSpacing: "1px" }}>
                                {invoiceRefNo.replace(/[^a-zA-Z0-9]/g, "")}
                            </div>
                        </div>
                    ) : null}

                    <div style={{ borderTop: "1px dashed #000", margin: "10px 0" }} />

                    {/* Trust Badges Strip */}
                    <table style={{ width: "100%", fontSize: "9.5px", textAlign: "center" }}>
                        <tbody>
                            <tr>
                                <td><strong>✔ Quality Products</strong></td>
                                <td><strong>✔ Best Price</strong></td>
                                <td><strong>✔ Easy Returns</strong></td>
                                <td><strong>✔ Happy Shopping</strong></td>
                            </tr>
                        </tbody>
                    </table>

                    <div style={{ border: "1px solid #000", padding: "4px", marginTop: "8px", fontSize: "10px" }}>
                        Goods once sold will not be taken back or exchanged.
                    </div>
                </div>
            </div>
        );
    }
}

export default PrintData;
