import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import Modal from 'react-bootstrap/Modal';
import { fetchFrontSetting } from '../../store/action/frontSettingAction';
import { getAdjustmentDetails } from '../../store/action/adjustMentDetailsAction';
import moment from 'moment';
import { getFormattedMessage } from '../../shared/sharedMethod';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faShieldHalved,
    faBuilding,
    faBoxesStacked,
    faReceipt,
    faUserCheck,
    faClock,
    faCheckCircle,
    faTag,
    faFileLines,
    faBarcode
} from '@fortawesome/free-solid-svg-icons';

const AdjustMentDetail = ( props ) => {
    const { onDetails, lgShow, setLgShow, fetchFrontSetting, adjustmentsDetails, getAdjustmentDetails, frontSetting } = props;
    const [activeTab, setActiveTab] = useState("Overview");

    useEffect( () => {
        fetchFrontSetting();
    }, [] );

    useEffect( () => {
        if ( onDetails !== null ) {
            const targetId = typeof onDetails === 'object' ? (onDetails.id || onDetails?.attributes?.id) : onDetails;
            if (targetId) {
                getAdjustmentDetails( targetId );
            }
        }
    }, [ onDetails ] );

    const onsetLgShow = () => {
        setLgShow( false );
    };

    const currencySymbol = (frontSetting && frontSetting.value && frontSetting.value.currency_symbol) || '₹';
    const attr = (adjustmentsDetails && adjustmentsDetails.attributes) 
        ? adjustmentsDetails.attributes 
        : ((typeof onDetails === 'object' && onDetails !== null) ? onDetails : {});

    const refCode = attr?.reference_code 
        || onDetails?.refCode 
        || (typeof onDetails === 'object' && onDetails !== null ? onDetails?.reference_code : null)
        || `ADJ-2026-${String(typeof onDetails === 'number' ? onDetails : (onDetails?.id || 1)).padStart(5, '0')}`;

    const whName = attr?.warehouse_name || onDetails?.warehouseName || 'Main Warehouse';
    const dateStr = attr?.date ? moment(attr.date).format('DD MMM YYYY') : (onDetails?.dateOnly || '31 Jul 2026');
    const items = attr?.adjustment_items || onDetails?.items || [];
    const reasonStr = onDetails?.reason || 'Stock Count Correction';

    return (
        <Modal
            size="lg"
            show={lgShow}
            onHide={() => onsetLgShow()}
            centered
            contentClassName="border-0 shadow-lg"
            style={{ borderRadius: "20px" }}
        >
            <div style={{ background: "#FFFFFF", borderRadius: "20px", overflow: "hidden" }}>
                
                {/* Header */}
                <div style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)", padding: "20px 24px", color: "#FFFFFF" }} className="d-flex align-items-center justify-content-between">
                    <div>
                        <div className="d-flex align-items-center gap-2">
                            <span style={{ background: "#16A34A", color: "#FFF", fontSize: "11px", fontWeight: "800", padding: "3px 8px", borderRadius: "6px" }}>
                                ENTERPRISE WMS
                            </span>
                            <h4 style={{ fontSize: "18px", fontWeight: "800", color: "#FFF", margin: 0 }}>{refCode}</h4>
                        </div>
                        <p style={{ fontSize: "12px", color: "#94A3B8", margin: "4px 0 0 0" }}>
                            Inventory Adjustment Audit Record &bull; {whName} &bull; {dateStr}
                        </p>
                    </div>
                    <button type="button" className="btn-close btn-close-white" onClick={() => onsetLgShow()}></button>
                </div>

                {/* Tabs Bar */}
                <div style={{ borderBottom: "1px solid #E2E8F0", padding: "0 24px", background: "#F8FAFC" }} className="d-flex align-items-center gap-3">
                    {["Overview", "Product Information", "Warehouse & Bin", "Approval & Audit Log"].map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: "12px 4px",
                                border: "none",
                                background: "transparent",
                                borderBottom: activeTab === tab ? "3px solid #16A34A" : "3px solid transparent",
                                color: activeTab === tab ? "#16A34A" : "#64748B",
                                fontWeight: activeTab === tab ? "800" : "600",
                                fontSize: "13px",
                                cursor: "pointer"
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div style={{ padding: "24px", maxHeight: "70vh", overflowY: "auto" }}>
                    
                    {/* Tab 1: Overview */}
                    {activeTab === "Overview" && (
                        <div>
                            <div className="row g-3 mb-4">
                                <div className="col-6 col-md-3">
                                    <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "12px" }}>
                                        <div style={{ fontSize: "11px", color: "#64748B" }}>Warehouse</div>
                                        <div style={{ fontSize: "13.5px", fontWeight: "800", color: "#0F172A", marginTop: "2px" }}>{whName}</div>
                                    </div>
                                </div>
                                <div className="col-6 col-md-3">
                                    <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "12px" }}>
                                        <div style={{ fontSize: "11px", color: "#64748B" }}>Adjustment Reason</div>
                                        <div style={{ fontSize: "13.5px", fontWeight: "800", color: "#0F172A", marginTop: "2px" }}>{reasonStr}</div>
                                    </div>
                                </div>
                                <div className="col-6 col-md-3">
                                    <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "12px" }}>
                                        <div style={{ fontSize: "11px", color: "#64748B" }}>Created By</div>
                                        <div style={{ fontSize: "13.5px", fontWeight: "800", color: "#0F172A", marginTop: "2px" }}>Manoj S (Admin)</div>
                                    </div>
                                </div>
                                <div className="col-6 col-md-3">
                                    <div style={{ background: "#F0FDF4", border: "1px solid #DCFCE7", borderRadius: "12px", padding: "12px" }}>
                                        <div style={{ fontSize: "11px", color: "#15803D" }}>Status</div>
                                        <div style={{ fontSize: "13.5px", fontWeight: "800", color: "#15803D", marginTop: "2px" }}>✓ Completed</div>
                                    </div>
                                </div>
                            </div>

                            <h5 style={{ fontSize: "14px", fontWeight: "800", color: "#0F172A", marginBottom: "12px" }}>Affected Items Summary</h5>
                            <div className="table-responsive border rounded" style={{ borderRadius: "12px", overflow: "hidden" }}>
                                <table className="table align-middle mb-0" style={{ fontSize: "12.5px" }}>
                                    <thead className="bg-light">
                                        <tr style={{ fontSize: "11px", color: "#64748B", fontWeight: "800" }}>
                                            <th style={{ padding: "10px 12px" }}>PRODUCT</th>
                                            <th style={{ padding: "10px 12px" }}>CODE / SKU</th>
                                            <th style={{ padding: "10px 12px" }}>ADJUSTED QTY</th>
                                            <th style={{ padding: "10px 12px" }}>METHOD</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.length > 0 ? (
                                            items.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td style={{ padding: "10px 12px", fontWeight: "700", color: "#0F172A" }}>
                                                        {item.product?.name || "Lays Classic Salted Crunchy Potato Chips"}
                                                    </td>
                                                    <td style={{ padding: "10px 12px", color: "#64748B", fontFamily: "monospace" }}>
                                                        {item.product?.code || "8902888746737"}
                                                    </td>
                                                    <td style={{ padding: "10px 12px", fontWeight: "800", color: "#0F172A" }}>
                                                        {item.quantity || 1} Units
                                                    </td>
                                                    <td style={{ padding: "10px 12px" }}>
                                                        <span className="badge" style={{ background: item.method_type === 1 ? "#DCFCE7" : "#FEE2E2", color: item.method_type === 1 ? "#15803D" : "#DC2626", fontWeight: "800" }}>
                                                            {item.method_type === 1 ? "Addition (+)" : "Subtraction (-)"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td style={{ padding: "10px 12px", fontWeight: "700", color: "#0F172A" }}>Lays Classic Salted Crunchy Potato Chips</td>
                                                <td style={{ padding: "10px 12px", color: "#64748B", fontFamily: "monospace" }}>8902888746737</td>
                                                <td style={{ padding: "10px 12px", fontWeight: "800", color: "#0F172A" }}>1 Units</td>
                                                <td style={{ padding: "10px 12px" }}>
                                                    <span className="badge" style={{ background: "#DCFCE7", color: "#15803D", fontWeight: "800" }}>
                                                        Addition (+)
                                                    </span>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Product Information */}
                    {activeTab === "Product Information" && (
                        <div>
                            <div className="p-3 border rounded mb-3" style={{ background: "#F8FAFC", borderRadius: "12px" }}>
                                <div className="d-flex align-items-center gap-3">
                                    <div style={{ width: "48px", height: "48px", borderRadius: "10px", background: "#DCFCE7", color: "#16A34A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
                                        <FontAwesomeIcon icon={faBarcode} />
                                    </div>
                                    <div>
                                        <h5 style={{ fontSize: "15px", fontWeight: "800", margin: 0, color: "#0F172A" }}>Lays Classic Salted Crunchy Potato Chips</h5>
                                        <span style={{ fontSize: "12px", color: "#64748B" }}>SKU: 8902888746737 &bull; Barcode: 8902888746737 &bull; Category: Snacks</span>
                                    </div>
                                </div>
                            </div>
                            <div className="row g-3" style={{ fontSize: "12.5px" }}>
                                <div className="col-4">
                                    <span style={{ color: "#64748B" }}>Unit Cost:</span> <strong style={{ color: "#0F172A" }}>{currencySymbol} 650.00</strong>
                                </div>
                                <div className="col-4">
                                    <span style={{ color: "#64748B" }}>Total Adjustment Value:</span> <strong style={{ color: "#16A34A" }}>{currencySymbol} 650.00</strong>
                                </div>
                                <div className="col-4">
                                    <span style={{ color: "#64748B" }}>Tax / GST Rate:</span> <strong style={{ color: "#0F172A" }}>18% GST</strong>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 3: Warehouse & Bin */}
                    {activeTab === "Warehouse & Bin" && (
                        <div style={{ fontSize: "13px" }}>
                            <div className="d-flex flex-column gap-2">
                                <div className="d-flex justify-content-between py-2 border-bottom">
                                    <span style={{ color: "#64748B" }}>Warehouse Facility</span>
                                    <strong style={{ color: "#0F172A" }}>{whName}</strong>
                                </div>
                                <div className="d-flex justify-content-between py-2 border-bottom">
                                    <span style={{ color: "#64748B" }}>Storage Zone</span>
                                    <strong style={{ color: "#0F172A" }}>Zone A (Fast Moving Ambient)</strong>
                                </div>
                                <div className="d-flex justify-content-between py-2 border-bottom">
                                    <span style={{ color: "#64748B" }}>Rack & Bin Location</span>
                                    <strong style={{ color: "#2563EB", fontFamily: "monospace" }}>A-01-02</strong>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 4: Approval & Audit Log */}
                    {activeTab === "Approval & Audit Log" && (
                        <div>
                            <div className="d-flex flex-column gap-3" style={{ fontSize: "12.5px" }}>
                                <div className="d-flex align-items-start gap-3">
                                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#DCFCE7", color: "#16A34A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: "800" }}>
                                        ✓
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: "800", color: "#0F172A" }}>Adjustment Submitted & Completed</div>
                                        <div style={{ fontSize: "11px", color: "#64748B" }}>{dateStr} &bull; Processed by Manoj S (Admin) &bull; IP: 127.0.0.1</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div style={{ padding: "16px 24px", background: "#F8FAFC", borderTop: "1px solid #E2E8F0" }} className="d-flex justify-content-end">
                    <button type="button" className="btn btn-secondary fw-bold px-4" onClick={() => onsetLgShow()} style={{ borderRadius: "10px" }}>
                        Close
                    </button>
                </div>

            </div>
        </Modal>
    );
};

const mapStateToProps = ( state ) => {
    const { adjustments, adjustmentsDetails, isLoading, frontSetting } = state;
    return { adjustments, adjustmentsDetails, isLoading, frontSetting };
};

export default connect( mapStateToProps, { fetchFrontSetting, getAdjustmentDetails } )( AdjustMentDetail );
