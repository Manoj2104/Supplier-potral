import React, { useState, useEffect } from 'react';
import MasterLayout from '../MasterLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartPie, faFileExcel, faFilePdf, faPrint, faTable, faBoxes, faTruck, faExchangeAlt, faExclamationTriangle, faClock } from '@fortawesome/free-solid-svg-icons';
import MasterTableSkeleton from '../../shared/components/skeletons/MasterTableSkeleton';
import { isPageFirstLoad, markPageAnimated } from '../dashboard/dashboardAnimationState';

const EnterpriseWmsReports = () => {
    const [activeTab, setActiveTab] = useState('abc');
    const [isLoadingSkeleton, setIsLoadingSkeleton] = useState(isPageFirstLoad('report-enterprise-wms'));

    useEffect(() => {
        if (isLoadingSkeleton) {
            const timer = setTimeout(() => {
                setIsLoadingSkeleton(false);
                markPageAnimated('report-enterprise-wms');
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [isLoadingSkeleton]);

    const handleExport = (type) => {
        alert(`Exporting ${activeTab.toUpperCase()} Report as ${type.toUpperCase()}...`);
    };

    return (
        <MasterLayout>
            {isLoadingSkeleton ? (
                <MasterTableSkeleton />
            ) : (
                <div className="container-fluid py-3">
                {/* Page Title & Export Actions */}
                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                    <div>
                        <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                            <FontAwesomeIcon icon={faChartPie} className="me-2 text-success" />
                            Enterprise WMS & Logistics Reports Hub
                        </h1>
                        <p style={{ fontSize: '12.5px', color: '#64748B', margin: '2px 0 0 0' }}>
                            SAP EWM & Oracle WMS compliant analytics across Inventory Aging, ABC Analysis, Bin Utilization & LPNs
                        </p>
                    </div>
                    <div className="d-flex gap-2">
                        <button type="button" className="btn btn-outline-success btn-sm fw-bold" onClick={() => handleExport('excel')}>
                            <FontAwesomeIcon icon={faFileExcel} className="me-1" /> Export Excel
                        </button>
                        <button type="button" className="btn btn-outline-danger btn-sm fw-bold" onClick={() => handleExport('pdf')}>
                            <FontAwesomeIcon icon={faFilePdf} className="me-1" /> Export PDF
                        </button>
                        <button type="button" className="btn btn-light border btn-sm fw-bold" onClick={() => window.print()}>
                            <FontAwesomeIcon icon={faPrint} className="me-1" /> Print
                        </button>
                    </div>
                </div>

                {/* Report Tabs Bar */}
                <div className="card border-0 shadow-sm rounded-3 mb-3" style={{ background: '#FFFFFF' }}>
                    <div className="card-body p-2">
                        <ul className="nav nav-pills gap-1">
                            <li className="nav-item">
                                <button className={`nav-link btn-sm fw-bold ${activeTab === 'abc' ? 'active bg-success text-white' : 'text-dark'}`} onClick={() => setActiveTab('abc')}>
                                    <FontAwesomeIcon icon={faBoxes} className="me-1.5" /> ABC Analysis
                                </button>
                            </li>
                            <li className="nav-item">
                                <button className={`nav-link btn-sm fw-bold ${activeTab === 'aging' ? 'active bg-success text-white' : 'text-dark'}`} onClick={() => setActiveTab('aging')}>
                                    <FontAwesomeIcon icon={faClock} className="me-1.5" /> Inventory Aging
                                </button>
                            </li>
                            <li className="nav-item">
                                <button className={`nav-link btn-sm fw-bold ${activeTab === 'bin' ? 'active bg-success text-white' : 'text-dark'}`} onClick={() => setActiveTab('bin')}>
                                    <FontAwesomeIcon icon={faTable} className="me-1.5" /> Bin Utilization
                                </button>
                            </li>
                            <li className="nav-item">
                                <button className={`nav-link btn-sm fw-bold ${activeTab === 'lpn' ? 'active bg-success text-white' : 'text-dark'}`} onClick={() => setActiveTab('lpn')}>
                                    <FontAwesomeIcon icon={faTruck} className="me-1.5" /> LPN Carton Tracking
                                </button>
                            </li>
                            <li className="nav-item">
                                <button className={`nav-link btn-sm fw-bold ${activeTab === 'damage' ? 'active bg-success text-white' : 'text-dark'}`} onClick={() => setActiveTab('damage')}>
                                    <FontAwesomeIcon icon={faExclamationTriangle} className="me-1.5" /> Damage & Loss
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Report Content Body */}
                <div className="card border-0 shadow-sm rounded-3" style={{ background: '#FFFFFF' }}>
                    <div className="card-body p-3">
                        {activeTab === 'abc' && (
                            <div>
                                <h5 className="fw-extrabold text-dark mb-2">ABC Inventory Classification Report</h5>
                                <p className="text-secondary small mb-3">Categorizes inventory based on annual consumption value (A: 70% Value, B: 20% Value, C: 10% Value)</p>
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0" style={{ fontSize: '12px' }}>
                                        <thead className="bg-light">
                                            <tr>
                                                <th>Category Class</th>
                                                <th>SKU Code</th>
                                                <th>Product Name</th>
                                                <th>Total Stock Qty</th>
                                                <th>Unit Price</th>
                                                <th>Total Inventory Value</th>
                                                <th>Cumulative %</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td><span className="badge bg-danger">Class A (High Value)</span></td>
                                                <td className="fw-bold font-monospace">8901952481631</td>
                                                <td className="fw-bold">Motorola G37 Power Pantone Capri 128 Gb</td>
                                                <td>52 Units</td>
                                                <td>₹ 14,999.00</td>
                                                <td className="fw-bold text-success">₹ 7,79,948.00</td>
                                                <td>68.4%</td>
                                                <td><span className="badge bg-success">Optimal</span></td>
                                            </tr>
                                            <tr>
                                                <td><span className="badge bg-warning text-dark">Class B (Medium)</span></td>
                                                <td className="fw-bold font-monospace">8902888746737</td>
                                                <td className="fw-bold">Lays Classic Salted Crunchy Potato Chips</td>
                                                <td>259 Units</td>
                                                <td>₹ 650.00</td>
                                                <td className="fw-bold text-dark">₹ 1,68,350.00</td>
                                                <td>88.2%</td>
                                                <td><span className="badge bg-success">Optimal</span></td>
                                            </tr>
                                            <tr>
                                                <td><span className="badge bg-secondary">Class C (Low Value)</span></td>
                                                <td className="fw-bold font-monospace">8908558941297</td>
                                                <td className="fw-bold">Bingo Potato Chips Killin Cream Onion</td>
                                                <td>120 Units</td>
                                                <td>₹ 25.00</td>
                                                <td className="fw-bold text-muted">₹ 3,000.00</td>
                                                <td>100.0%</td>
                                                <td><span className="badge bg-info text-dark">Sufficient</span></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'aging' && (
                            <div>
                                <h5 className="fw-extrabold text-dark mb-2">Inventory Aging & Slow Moving Analysis</h5>
                                <p className="text-secondary small mb-3">Tracks stock dwell time across 0-30, 31-60, 61-90, and 90+ days threshold brackets</p>
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0" style={{ fontSize: '12px' }}>
                                        <thead className="bg-light">
                                            <tr>
                                                <th>Product SKU</th>
                                                <th>Product Name</th>
                                                <th>0 - 30 Days</th>
                                                <th>31 - 60 Days</th>
                                                <th>61 - 90 Days</th>
                                                <th>90+ Days (Obsolete)</th>
                                                <th>Total Value</th>
                                                <th>Risk Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className="font-monospace fw-bold">8902888746737</td>
                                                <td className="fw-bold">Lays Classic Salted Crunchy Potato Chips</td>
                                                <td className="text-success fw-bold">200 Units</td>
                                                <td className="text-primary">59 Units</td>
                                                <td>0 Units</td>
                                                <td>0 Units</td>
                                                <td className="fw-bold">₹ 1,68,350.00</td>
                                                <td><span className="badge bg-success">Fast Moving</span></td>
                                            </tr>
                                            <tr>
                                                <td className="font-monospace fw-bold">8901952481631</td>
                                                <td className="fw-bold">Motorola G37 Power Pantone Capri 128 Gb</td>
                                                <td className="text-success fw-bold">30 Units</td>
                                                <td className="text-primary">22 Units</td>
                                                <td>0 Units</td>
                                                <td>0 Units</td>
                                                <td className="fw-bold">₹ 7,79,948.00</td>
                                                <td><span className="badge bg-primary">Normal</span></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'bin' && (
                            <div>
                                <h5 className="fw-extrabold text-dark mb-2">Warehouse Bin Capacity Utilization Report</h5>
                                <p className="text-secondary small mb-3">Real-time bin occupancy, max volume limits, and location metrics</p>
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0" style={{ fontSize: '12px' }}>
                                        <thead className="bg-light">
                                            <tr>
                                                <th>Bin Code</th>
                                                <th>Location Path</th>
                                                <th>Max Capacity</th>
                                                <th>Occupied Qty</th>
                                                <th>Utilization Meter</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className="fw-bold font-monospace text-primary">A-01-01</td>
                                                <td>Main WH › Zone A › Rack 01 › Level 01</td>
                                                <td>500 Units</td>
                                                <td className="fw-bold">68 Units</td>
                                                <td>
                                                    <div className="progress" style={{ height: '12px' }}>
                                                        <div className="progress-bar bg-success" style={{ width: '13.6%' }}>13.6%</div>
                                                    </div>
                                                </td>
                                                <td><span className="badge bg-success">Active (Live)</span></td>
                                            </tr>
                                            <tr>
                                                <td className="fw-bold font-monospace text-primary">A-01-02</td>
                                                <td>Main WH › Zone A › Rack 01 › Level 02</td>
                                                <td>500 Units</td>
                                                <td className="fw-bold">243 Units</td>
                                                <td>
                                                    <div className="progress" style={{ height: '12px' }}>
                                                        <div className="progress-bar bg-warning text-dark" style={{ width: '48.6%' }}>48.6%</div>
                                                    </div>
                                                </td>
                                                <td><span className="badge bg-success">Active (Live)</span></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'lpn' && (
                            <div>
                                <h5 className="fw-extrabold text-dark mb-2">License Plate Number (LPN) Tracking Report</h5>
                                <p className="text-secondary small mb-3">Traceability of all packed cartons from Supplier ASN dispatch to PDA Receiving</p>
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0" style={{ fontSize: '12px' }}>
                                        <thead className="bg-light">
                                            <tr>
                                                <th>LPN Barcode</th>
                                                <th>Carton No</th>
                                                <th>ASN Ref</th>
                                                <th>PO Ref</th>
                                                <th>Gross Weight</th>
                                                <th>Packed SKUs</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className="fw-bold font-monospace text-success">LPN-20260803-000001</td>
                                                <td className="fw-bold">Carton 1</td>
                                                <td>ASN-2026-00027</td>
                                                <td className="font-monospace fw-bold text-primary">PO-2026-011152</td>
                                                <td>18.50 KG</td>
                                                <td>1 SKU (100 Units)</td>
                                                <td><span className="badge bg-success">Received (GRN)</span></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'damage' && (
                            <div>
                                <h5 className="fw-extrabold text-dark mb-2">Damage, Expiry & Inventory Variance Log</h5>
                                <p className="text-secondary small mb-3">Audit trail of all damaged receiving and manual stock count adjustments</p>
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0" style={{ fontSize: '12px' }}>
                                        <thead className="bg-light">
                                            <tr>
                                                <th>Date</th>
                                                <th>Ref Code</th>
                                                <th>Product Name</th>
                                                <th>Variance Qty</th>
                                                <th>Reason</th>
                                                <th>Audited By</th>
                                                <th>Financial Impact</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>03 Aug 2026</td>
                                                <td className="font-monospace fw-bold">AD_1115</td>
                                                <td className="fw-bold">Motorola G37 Power Pantone Capri 128 Gb</td>
                                                <td className="text-danger fw-bold">- 2 Units</td>
                                                <td>Damaged Stock Correction</td>
                                                <td>Manoj S (Administrator)</td>
                                                <td className="text-danger fw-bold">- ₹ 29,998.00</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            )}
        </MasterLayout>
    );
};

export default EnterpriseWmsReports;
