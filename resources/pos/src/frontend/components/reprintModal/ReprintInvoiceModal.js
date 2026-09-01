import React, { useState, useEffect, useRef } from "react";
import { Modal, Table, Spinner, InputGroup, Form } from "react-bootstrap-v5";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPrinter, faSearch, faXmark, faCheckCircle, faClock, faReceipt, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { useReactToPrint } from "react-to-print";
import apiConfig from "../../../config/apiConfig";
import { apiBaseURL } from "../../../constants";
import PrintData from "../printModal/PrintData";
import { currencySymbolHandling, getFormattedDate } from "../../../shared/sharedMethod";

const ReprintInvoiceModal = ({ show, handleClose, frontSetting, allConfigData }) => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSaleForPrint, setSelectedSaleForPrint] = useState(null);
    const printRef = useRef();

    const currencySymbol = frontSetting?.value?.currency_symbol || '₹';

    // Fetch previous completed sales when modal opens
    useEffect(() => {
        if (show) {
            fetchRecentSales();
        }
    }, [show]);

    // Live search query handler to trigger API search if needed
    useEffect(() => {
        if (!show) return;

        const timer = setTimeout(() => {
            if (searchQuery.trim().length >= 1) {
                searchSalesApi(searchQuery.trim());
            } else if (searchQuery.trim().length === 0) {
                fetchRecentSales();
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, show]);

    const fetchRecentSales = async () => {
        setLoading(true);
        try {
            const response = await apiConfig.get(`${apiBaseURL.SALES}?pageSize=150`);
            const data = response.data.data || response.data || [];
            setSales(data);
        } catch (error) {
            console.error("Error fetching recent sales for reprint:", error);
        } finally {
            setLoading(false);
        }
    };

    const searchSalesApi = async (queryStr) => {
        setLoading(true);
        try {
            const response = await apiConfig.get(`${apiBaseURL.SALES}?search=${encodeURIComponent(queryStr)}&pageSize=50`);
            const data = response.data.data || response.data || [];
            setSales(data);
        } catch (error) {
            console.error("Error searching sales API:", error);
        } finally {
            setLoading(false);
        }
    };

    // Flexible client-side filtering matching Invoice ID, Reference Code, Customer, or numeric ID
    const filteredSales = sales.filter((sale) => {
        const attr = sale.attributes || sale;
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;
        
        const refCode = String(attr.reference_code || `INV-${sale.id}`).toLowerCase();
        const customer = String(attr.customer_name || 'Walk-in Customer').toLowerCase();
        const idStr = String(sale.id);

        const cleanRef = refCode.replace(/[^a-z0-9]/gi, '');
        const cleanQuery = query.replace(/[^a-z0-9]/gi, '');
        
        return (
            refCode.includes(query) || 
            cleanRef.includes(cleanQuery) || 
            customer.includes(query) || 
            idStr.includes(query)
        );
    });

    const handlePrintClick = async (saleItem) => {
        setLoading(true);
        try {
            // Fetch detailed sale item data for exact receipt rendering
            const response = await apiConfig.get(`${apiBaseURL.SALES}/${saleItem.id}/edit`);
            const saleDetails = response.data.data || response.data;
            const attr = saleDetails.attributes || saleDetails;

            const printPayload = {
                frontSetting: frontSetting,
                settings: { attributes: { currency_symbol: currencySymbol, show_logo_in_receipt: "1" } },
                customer_name: [{ label: attr.customer_name || 'Walk-in Customer' }],
                reference_code: attr.reference_code || `INV-${saleItem.id}`,
                subTotal: attr.grand_total || 0,
                taxTotal: attr.tax_amount || 0,
                discount: attr.discount || 0,
                shipping: attr.shipping || 0,
                grandTotal: attr.grand_total || 0,
                changeReturn: 0,
                note: attr.note || '',
                barcode_url: attr.barcode_url || '',
                products: (attr.sale_items || attr.sales_items || []).map(item => ({
                    name: item.product_name || item.product?.name || 'Product',
                    code: item.product_code || item.product?.code || '',
                    quantity: parseFloat(item.quantity || 1),
                    product_unit: item.product_unit || '1',
                    net_unit_price: parseFloat(item.net_unit_price || item.product_price || 0),
                }))
            };

            setSelectedSaleForPrint(printPayload);
            setTimeout(() => {
                triggerPrint();
            }, 300);
        } catch (error) {
            console.error("Error fetching sale details for print:", error);
            // Fallback print payload using available list item
            const attr = saleItem.attributes || saleItem;
            const printPayload = {
                frontSetting: frontSetting,
                settings: { attributes: { currency_symbol: currencySymbol, show_logo_in_receipt: "1" } },
                customer_name: [{ label: attr.customer_name || 'Walk-in Customer' }],
                reference_code: attr.reference_code || `INV-${saleItem.id}`,
                subTotal: attr.grand_total || 0,
                taxTotal: 0,
                discount: 0,
                shipping: 0,
                grandTotal: attr.grand_total || 0,
                changeReturn: 0,
                products: []
            };
            setSelectedSaleForPrint(printPayload);
            setTimeout(() => {
                triggerPrint();
            }, 300);
        } finally {
            setLoading(false);
        }
    };

    const triggerPrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: `Receipt_${selectedSaleForPrint?.reference_code || 'Invoice'}`,
    });

    return (
        <>
            <Modal show={show} onHide={handleClose} size="lg" centered className="reprint-modal">
                <Modal.Header className="border-0 bg-light p-3">
                    <div className="d-flex align-items-center gap-2">
                        <div className="bg-success text-white rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                            <FontAwesomeIcon icon={faPrinter} />
                        </div>
                        <div>
                            <Modal.Title className="fw-extrabold text-dark fs-5 m-0">Reprint Invoice / Receipt</Modal.Title>
                            <span className="fs-micro text-muted">Search previous completed payments or type Invoice ID to reprint receipt</span>
                        </div>
                    </div>
                    <button type="button" className="btn-close ms-auto" onClick={handleClose} aria-label="Close"></button>
                </Modal.Header>

                <Modal.Body className="p-4">
                    {/* Top Search Input by Invoice ID */}
                    <div className="mb-4">
                        <label className="form-label fw-bold text-dark fs-small">Search Invoice by ID or Reference Number</label>
                        <InputGroup style={{ height: '46px' }}>
                            <InputGroup.Text className="bg-white border-end-0 text-muted">
                                <FontAwesomeIcon icon={faSearch} />
                            </InputGroup.Text>
                            <Form.Control
                                type="text"
                                className="border-start-0 fs-small fw-semibold shadow-none"
                                placeholder="Enter Invoice ID / Reference (e.g. INV-11129, SA_11129, or 11129)..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                            {searchQuery && (
                                <InputGroup.Text 
                                    className="bg-white border-start-0 text-muted cursor-pointer"
                                    onClick={() => setSearchQuery("")}
                                >
                                    <FontAwesomeIcon icon={faXmark} />
                                </InputGroup.Text>
                            )}
                        </InputGroup>
                    </div>

                    {/* Sales List Table */}
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="success" />
                            <div className="mt-2 text-muted fs-small">Loading previous completed payments...</div>
                        </div>
                    ) : filteredSales.length === 0 ? (
                        <div className="text-center py-5 text-muted border rounded-3 bg-light-subtle">
                            <FontAwesomeIcon icon={faReceipt} className="fs-1 text-light-emphasis mb-2" />
                            <div className="fw-bold text-dark fs-6">No matching invoices found</div>
                            <div className="fs-micro">Try searching with a different Invoice ID or Reference Code.</div>
                        </div>
                    ) : (
                        <div className="table-responsive border rounded-3 overflow-hidden shadow-sm" style={{ maxHeight: '360px' }}>
                            <Table hover align="middle" className="m-0 fs-small">
                                <thead className="bg-light text-muted uppercase fw-bold fs-micro">
                                    <tr>
                                        <th className="ps-3 py-2.5">Invoice ID</th>
                                        <th className="py-2.5">Customer</th>
                                        <th className="py-2.5">Date & Time</th>
                                        <th className="py-2.5">Grand Total</th>
                                        <th className="py-2.5">Status</th>
                                        <th className="text-end pe-3 py-2.5">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSales.map((sale) => {
                                        const attr = sale.attributes || sale;
                                        const refCode = attr.reference_code || `INV-${sale.id}`;
                                        const customerName = attr.customer_name || 'Walk-in Customer';
                                        const formattedDate = attr.date ? getFormattedDate(attr.date, allConfigData) : '27 Jul 2026';
                                        const totalAmt = parseFloat(attr.grand_total || 0);

                                        return (
                                            <tr key={sale.id}>
                                                <td className="ps-3 py-2.5">
                                                    <span className="badge bg-success-subtle text-success border border-success fw-bold px-2 py-1 fs-micro">
                                                        {refCode}
                                                    </span>
                                                </td>
                                                <td className="fw-bold text-dark py-2.5">{customerName}</td>
                                                <td className="text-muted py-2.5 fs-micro">{formattedDate}</td>
                                                <td className="fw-extrabold text-dark py-2.5">
                                                    {currencySymbol} {totalAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="py-2.5">
                                                    <span className="badge bg-success-subtle text-success border border-success fw-bold px-2 py-0.5 fs-micro">
                                                        ● Completed
                                                    </span>
                                                </td>
                                                <td className="text-end pe-3 py-2.5">
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-success px-3 rounded-pill fw-bold text-white shadow-sm"
                                                        style={{ background: "#16A34A", border: "none", fontSize: "11px" }}
                                                        onClick={() => handlePrintClick(sale)}
                                                    >
                                                        <FontAwesomeIcon icon={faPrinter} className="me-1" /> Reprint
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Modal.Body>
            </Modal>

            {/* Hidden Printable Component Container */}
            <div style={{ display: "none" }}>
                {selectedSaleForPrint && (
                    <PrintData
                        ref={printRef}
                        updateProducts={selectedSaleForPrint}
                        allConfigData={allConfigData}
                        paymentType="Cash / Card"
                    />
                )}
            </div>
        </>
    );
};

export default ReprintInvoiceModal;
