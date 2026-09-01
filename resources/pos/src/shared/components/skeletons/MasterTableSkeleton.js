import React from 'react';
import { Table } from 'react-bootstrap-v5';

const MasterTableSkeleton = () => {
    return (
        <div className="dashboard-page premium-workspace master-skeleton-root" aria-hidden="true" role="status">
            {/* 1. Header Intro Skeleton */}
            <div className="dashboard-intro">
                <div>
                    <div className="skeleton mb-2" style={{ width: '220px', height: '14px', borderRadius: '4px' }} />
                    <div className="skeleton mb-2" style={{ width: '260px', height: '34px', borderRadius: '10px' }} />
                    <div className="skeleton" style={{ width: '380px', height: '16px', borderRadius: '6px' }} />
                </div>
                <div className="dashboard-actions">
                    <div className="skeleton" style={{ width: '130px', height: '42px', borderRadius: '50px' }} />
                    <div className="skeleton" style={{ width: '120px', height: '42px', borderRadius: '50px' }} />
                </div>
            </div>

            {/* 2. 4 KPI Cards Grid Skeleton */}
            <div className="cat-kpi-grid mb-4">
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        className="cat-kpi-card"
                        style={{
                            background: '#FFFFFF',
                            borderRadius: '20px',
                            border: '1px solid #EEF2F7',
                            padding: '18px 20px',
                            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)',
                        }}
                    >
                        <div className="d-flex align-items-center justify-content-between mb-2">
                            <div className="skeleton" style={{ width: '85px', height: '14px', borderRadius: '4px' }} />
                            <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '10px' }} />
                        </div>
                        <div className="skeleton mb-2" style={{ width: '60px', height: '28px', borderRadius: '6px' }} />
                        <div className="d-flex align-items-center justify-content-between">
                            <div className="skeleton" style={{ width: '70px', height: '16px', borderRadius: '50px' }} />
                            <div className="skeleton" style={{ width: '50px', height: '18px', borderRadius: '4px' }} />
                        </div>
                    </div>
                ))}
            </div>

            {/* 3. Toolbar Skeleton */}
            <div className="cat-toolbar-card mb-4">
                <div className="d-flex align-items-center justify-content-between gap-3">
                    <div className="flex-fill skeleton" style={{ height: '44px', borderRadius: '12px', maxWidth: '400px' }} />
                    <div className="d-flex align-items-center gap-2">
                        <div className="skeleton" style={{ width: '80px', height: '40px', borderRadius: '10px' }} />
                        <div className="skeleton" style={{ width: '80px', height: '40px', borderRadius: '10px' }} />
                    </div>
                </div>
            </div>

            {/* 4. Table Card Skeleton */}
            <div className="cat-table-card">
                <div className="table-responsive">
                    <Table hover className="align-middle mb-0" size="sm" style={{ fontSize: '13px' }}>
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}>
                                    <div className="skeleton" style={{ width: '18px', height: '18px', borderRadius: '4px' }} />
                                </th>
                                <th>
                                    <div className="skeleton" style={{ width: '120px', height: '14px', borderRadius: '4px' }} />
                                </th>
                                <th>
                                    <div className="skeleton" style={{ width: '100px', height: '14px', borderRadius: '4px' }} />
                                </th>
                                <th>
                                    <div className="skeleton" style={{ width: '80px', height: '14px', borderRadius: '4px' }} />
                                </th>
                                <th className="text-end">
                                    <div className="skeleton ms-auto" style={{ width: '60px', height: '14px', borderRadius: '4px' }} />
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...Array(6)].map((_, idx) => (
                                <tr key={idx} style={{ height: '58px' }}>
                                    <td>
                                        <div className="skeleton" style={{ width: '18px', height: '18px', borderRadius: '4px' }} />
                                    </td>
                                    <td>
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="skeleton" style={{ width: '38px', height: '38px', borderRadius: '10px' }} />
                                            <div className="d-flex flex-column gap-1">
                                                <div className="skeleton" style={{ width: '130px', height: '14px', borderRadius: '4px' }} />
                                                <div className="skeleton" style={{ width: '80px', height: '11px', borderRadius: '3px' }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="skeleton" style={{ width: '70px', height: '22px', borderRadius: '50px' }} />
                                    </td>
                                    <td>
                                        <div className="skeleton" style={{ width: '60px', height: '14px', borderRadius: '4px' }} />
                                    </td>
                                    <td className="text-end">
                                        <div className="d-flex align-items-center justify-content-end gap-1">
                                            <div className="skeleton" style={{ width: '30px', height: '30px', borderRadius: '8px' }} />
                                            <div className="skeleton" style={{ width: '30px', height: '30px', borderRadius: '8px' }} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>

                {/* Pagination Footer */}
                <div className="d-flex align-items-center justify-content-between p-3 border-top mt-2">
                    <div className="skeleton" style={{ width: '160px', height: '14px', borderRadius: '4px' }} />
                    <div className="d-flex align-items-center gap-2">
                        <div className="skeleton" style={{ width: '30px', height: '30px', borderRadius: '8px' }} />
                        <div className="skeleton" style={{ width: '30px', height: '30px', borderRadius: '8px' }} />
                        <div className="skeleton" style={{ width: '30px', height: '30px', borderRadius: '8px' }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MasterTableSkeleton;
