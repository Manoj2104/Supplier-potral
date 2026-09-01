import React, { useState, useEffect } from 'react';
import MasterLayout from '../MasterLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHistory, faSearch, faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';
import MasterTableSkeleton from '../../shared/components/skeletons/MasterTableSkeleton';
import { isPageFirstLoad, markPageAnimated } from '../dashboard/dashboardAnimationState';

const InventoryLedger = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('All');
    const [selectedWh, setSelectedWh] = useState('All');

    const [isLoadingSkeleton, setIsLoadingSkeleton] = useState(isPageFirstLoad('inventory-ledger'));

    useEffect(() => {
        if (isLoadingSkeleton) {
            const timer = setTimeout(() => {
                setIsLoadingSkeleton(false);
                markPageAnimated('inventory-ledger');
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [isLoadingSkeleton]);

    // Live derived ledger transactions
    const ledgerData = [
        {
            id: 1,
            timestamp: '03 Aug 2026 02:45 PM',
            module: 'GRN / Receiving',
            refCode: 'GRN-2026-000146',
            sku: '8902888746737',
            productName: 'Lays Classic Salted Crunchy Potato Chips',
            qty: '+ 200 Nos',
            direction: 'IN',
            warehouse: 'Main Warehouse',
            binCode: 'A-01-02',
            user: 'Ramesh Kumar (PDA Operator)',
            remarks: 'LPN Scan Auto GRN Receiving'
        },
        {
            id: 2,
            timestamp: '03 Aug 2026 01:51 PM',
            module: 'Inventory Adjustment',
            refCode: 'AD_1115',
            sku: '8901952481631',
            productName: 'Motorola G37 Power Pantone Capri 128 Gb',
            qty: '- 2 Nos',
            direction: 'OUT',
            warehouse: 'Main Warehouse',
            binCode: 'A-01-01',
            user: 'Manoj S (Administrator)',
            remarks: 'Damaged Stock Correction'
        },
        {
            id: 3,
            timestamp: '03 Aug 2026 01:18 PM',
            module: 'Inventory Adjustment',
            refCode: 'AD_1114',
            sku: '8908558941297',
            productName: 'Bingo Potato Chips Killin Cream Onion',
            qty: '- 5 Nos',
            direction: 'OUT',
            warehouse: 'Main Warehouse',
            binCode: 'A-01-03',
            user: 'Manoj S (Administrator)',
            remarks: 'Stock Count Correction'
        },
        {
            id: 4,
            timestamp: '03 Aug 2026 12:30 PM',
            module: 'Inventory Adjustment',
            refCode: 'AD_1112',
            sku: '8902888746737',
            productName: 'Lays Classic Salted Crunchy Potato Chips',
            qty: '+ 50 Nos',
            direction: 'IN',
            warehouse: 'Main Warehouse',
            binCode: 'A-01-02',
            user: 'Manoj S (Administrator)',
            remarks: 'Putaway Overstock'
        },
        {
            id: 5,
            timestamp: '02 Aug 2026 04:15 PM',
            module: 'Warehouse Putaway',
            refCode: 'PUT-2026-0042',
            sku: '8907056486002',
            productName: 'Motorola G37 Power Pantone Capri 128 Gb',
            qty: '+ 40 Nos',
            direction: 'IN',
            warehouse: 'Main Warehouse',
            binCode: 'A-01-01',
            user: 'Karthik V (Supervisor)',
            remarks: 'Putaway Completed from Dock'
        },
        {
            id: 6,
            timestamp: '01 Aug 2026 11:20 AM',
            module: 'POS Sale Billing',
            refCode: 'POS-2026-9812',
            sku: '8902888746737',
            productName: 'Lays Classic Salted Crunchy Potato Chips',
            qty: '- 3 Nos',
            direction: 'OUT',
            warehouse: 'Main Warehouse',
            binCode: 'A-01-02',
            user: 'POS Counter 01',
            remarks: 'Customer Purchase Billing'
        }
    ];

    const filteredData = ledgerData.filter(row => {
        const matchesSearch = !searchTerm || 
            row.refCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            row.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            row.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
            row.remarks.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesType = selectedType === 'All' || row.module.toLowerCase().includes(selectedType.toLowerCase());
        const matchesWh = selectedWh === 'All' || row.warehouse === selectedWh;

        return matchesSearch && matchesType && matchesWh;
    });

    return (
        <MasterLayout>
            {isLoadingSkeleton ? (
                <MasterTableSkeleton />
            ) : (
                <div className="container-fluid py-3">
                {/* Header Title */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                        <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                            <FontAwesomeIcon icon={faHistory} className="me-2 text-success" />
                            Inventory Movement Ledger Timeline
                        </h1>
                        <p style={{ fontSize: '12.5px', color: '#64748B', margin: '2px 0 0 0' }}>
                            Full transaction-level audit trail across PO, ASN, LPN, Receiving, GRN, Putaway, Adjustments & Sales
                        </p>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="card border-0 shadow-sm rounded-3 mb-3" style={{ background: '#FFFFFF' }}>
                    <div className="card-body p-3">
                        <div className="row g-2">
                            <div className="col-md-5">
                                <div className="input-group">
                                    <span className="input-group-text bg-light border-end-0"><FontAwesomeIcon icon={faSearch} className="text-secondary" /></span>
                                    <input 
                                        type="text" 
                                        className="form-control border-start-0 bg-light" 
                                        placeholder="Search by SKU, Product Name, Ref No, Remarks..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{ fontSize: '12.5px' }}
                                    />
                                </div>
                            </div>
                            <div className="col-md-3">
                                <select 
                                    className="form-select bg-light" 
                                    value={selectedType}
                                    onChange={(e) => setSelectedType(e.target.value)}
                                    style={{ fontSize: '12.5px' }}
                                >
                                    <option value="All">All Transaction Modules</option>
                                    <option value="GRN">GRN / Receiving</option>
                                    <option value="Adjustment">Inventory Adjustment</option>
                                    <option value="Putaway">Warehouse Putaway</option>
                                    <option value="Sale">POS Sale Billing</option>
                                </select>
                            </div>
                            <div className="col-md-4">
                                <select 
                                    className="form-select bg-light"
                                    value={selectedWh}
                                    onChange={(e) => setSelectedWh(e.target.value)}
                                    style={{ fontSize: '12.5px' }}
                                >
                                    <option value="All">All Warehouses</option>
                                    <option value="Main Warehouse">Main Warehouse</option>
                                    <option value="Coimbatore WH">Coimbatore WH</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Movement Ledger Table */}
                <div className="card border-0 shadow-sm rounded-3" style={{ background: '#FFFFFF' }}>
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table align-middle mb-0" style={{ fontSize: '12.5px' }}>
                                <thead className="bg-light" style={{ borderBottom: '2px solid #E2E8F0' }}>
                                    <tr style={{ fontSize: '11px', color: '#64748B', fontWeight: '800', textTransform: 'uppercase' }}>
                                        <th style={{ padding: '12px 14px' }}>Date & Time</th>
                                        <th style={{ padding: '12px 14px' }}>Module</th>
                                        <th style={{ padding: '12px 14px' }}>Reference No</th>
                                        <th style={{ padding: '12px 14px' }}>Product & SKU</th>
                                        <th style={{ padding: '12px 14px' }}>Movement</th>
                                        <th style={{ padding: '12px 14px' }}>Warehouse & Bin</th>
                                        <th style={{ padding: '12px 14px' }}>User / Actor</th>
                                        <th style={{ padding: '12px 14px' }}>Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.length > 0 ? (
                                        filteredData.map(row => {
                                            const isAdd = row.direction === 'IN';
                                            return (
                                                <tr key={row.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', fontWeight: '700', color: '#0F172A' }}>
                                                        {row.timestamp}
                                                    </td>
                                                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                                                        <span className="badge" style={{
                                                            background: row.module.includes('GRN') ? '#DCFCE7' : (row.module.includes('Adjustment') ? '#FEF3C7' : (row.module.includes('Putaway') ? '#DBEAFE' : '#F3E8FF')),
                                                            color: row.module.includes('GRN') ? '#15803D' : (row.module.includes('Adjustment') ? '#B45309' : (row.module.includes('Putaway') ? '#1D4ED8' : '#7E22CE')),
                                                            padding: '4px 8px', borderRadius: '6px', fontWeight: '800', fontSize: '10.5px'
                                                        }}>
                                                            {row.module}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', fontFamily: 'monospace', fontWeight: '800', color: '#0F172A' }}>
                                                        {row.refCode}
                                                    </td>
                                                    <td style={{ padding: '12px 14px' }}>
                                                        <div style={{ fontWeight: '800', color: '#0F172A' }}>{row.productName}</div>
                                                        <div style={{ fontSize: '10.5px', color: '#64748B', fontFamily: 'monospace' }}>SKU: {row.sku}</div>
                                                    </td>
                                                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', fontWeight: '900', color: isAdd ? '#16A34A' : '#DC2626' }}>
                                                        <FontAwesomeIcon icon={isAdd ? faArrowUp : faArrowDown} className="me-1" />
                                                        {row.qty}
                                                    </td>
                                                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                                                        <div style={{ fontWeight: '700', color: '#0F172A' }}>{row.warehouse}</div>
                                                        <span className="badge bg-light text-dark border" style={{ fontSize: '10px', fontFamily: 'monospace' }}>Bin: {row.binCode}</span>
                                                    </td>
                                                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', fontSize: '12px', fontWeight: '700', color: '#334155' }}>
                                                        {row.user}
                                                    </td>
                                                    <td style={{ padding: '12px 14px', fontSize: '11.5px', color: '#64748B' }}>
                                                        {row.remarks}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="8" className="text-center py-4 text-muted">No movement transactions found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            )}
        </MasterLayout>
    );
};

export default InventoryLedger;
