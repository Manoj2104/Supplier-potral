import React from 'react';
import { Table } from 'react-bootstrap-v5';

const ProductSkeleton = () => {
    return (
        <div className="dashboard-page premium-workspace product-skeleton-root" aria-hidden="true" role="status">
            {/* 1. Header Intro Skeleton */}
            <div className="dashboard-intro">
                <div>
                    <div className="skeleton mb-2" style={{ width: '220px', height: '14px', borderRadius: '4px' }} />
                    <div className="skeleton mb-2" style={{ width: '280px', height: '34px', borderRadius: '10px' }} />
                    <div className="skeleton" style={{ width: '420px', height: '16px', borderRadius: '6px' }} />
                </div>
                <div className="dashboard-actions">
                    <div className="skeleton" style={{ width: '130px', height: '42px', borderRadius: '50px' }} />
                    <div className="skeleton" style={{ width: '130px', height: '42px', borderRadius: '50px' }} />
                    <div className="skeleton" style={{ width: '42px', height: '42px', borderRadius: '50px' }} />
                </div>
            </div>

            {/* 2. 5 KPI Cards Grid Skeleton */}
            <div className="prod-kpi-grid-5 mb-4">
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className="card border-0 d-flex flex-column justify-content-between h-100"
                        style={{
                            background: '#FFFFFF',
                            borderRadius: '22px',
                            border: '1px solid #EEF2F7',
                            padding: '18px 20px',
                            minHeight: '150px',
                            boxShadow: '0 10px 35px rgba(15, 23, 42, 0.05)',
                        }}
                    >
                        {/* Top Line: Icon + Badge */}
                        <div className="d-flex align-items-center justify-content-between mb-2">
                            <div className="skeleton" style={{ width: '38px', height: '38px', borderRadius: '12px' }} />
                            <div className="skeleton" style={{ width: '55px', height: '22px', borderRadius: '50px' }} />
                        </div>
                        {/* Title Line */}
                        <div className="skeleton mb-2" style={{ width: '110px', height: '16px', borderRadius: '5px' }} />
                        {/* Big Value & Subtitle */}
                        <div className="mb-1">
                            <div className="skeleton mb-1" style={{ width: '70px', height: '28px', borderRadius: '6px' }} />
                            <div className="skeleton" style={{ width: '60px', height: '12px', borderRadius: '4px' }} />
                        </div>
                        {/* Wave Sparkline Placeholder */}
                        <div className="mt-2" style={{ height: '36px' }}>
                            <div className="skeleton" style={{ width: '100%', height: '32px', borderRadius: '8px' }} />
                        </div>
                    </div>
                ))}
            </div>

            {/* 3. Search & Filter Toolbar Skeleton */}
            <div className="prod-toolbar-card mb-4">
                <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="flex-fill skeleton" style={{ height: '48px', borderRadius: '14px' }} />
                    <div className="skeleton" style={{ width: '160px', height: '48px', borderRadius: '14px' }} />
                    <div className="skeleton" style={{ width: '100px', height: '48px', borderRadius: '14px' }} />
                </div>

                {/* 8 Filter Dropdowns Skeleton Grid */}
                <div className="prod-8-filters-grid">
                    {[...Array(8)].map((_, i) => (
                        <div key={i}>
                            <div className="skeleton mb-1" style={{ width: '50px', height: '12px', borderRadius: '3px' }} />
                            <div className="skeleton" style={{ width: '100%', height: '36px', borderRadius: '8px' }} />
                        </div>
                    ))}
                </div>
            </div>

            {/* 4. Full Width Product Table Skeleton */}
            <div className="prod-table-card">
                <div className="table-responsive">
                    <Table hover className="align-middle mb-0" size="sm" style={{ fontSize: '12px' }}>
                        <thead>
                            <tr>
                                <th className="prod-table-th" style={{ width: '30px' }}>
                                    <div className="skeleton" style={{ width: '18px', height: '18px', borderRadius: '4px' }} />
                                </th>
                                <th className="prod-table-th">
                                    <div className="skeleton" style={{ width: '45px', height: '14px', borderRadius: '4px' }} />
                                </th>
                                <th className="prod-table-th">
                                    <div className="skeleton" style={{ width: '35px', height: '14px', borderRadius: '4px' }} />
                                </th>
                                <th className="prod-table-th">
                                    <div className="skeleton" style={{ width: '65px', height: '14px', borderRadius: '4px' }} />
                                </th>
                                <th className="prod-table-th">
                                    <div className="skeleton" style={{ width: '140px', height: '14px', borderRadius: '4px' }} />
                                </th>
                                <th className="prod-table-th">
                                    <div className="skeleton" style={{ width: '110px', height: '14px', borderRadius: '4px' }} />
                                </th>
                                <th className="prod-table-th">
                                    <div className="skeleton" style={{ width: '65px', height: '14px', borderRadius: '4px' }} />
                                </th>
                                <th className="prod-table-th">
                                    <div className="skeleton" style={{ width: '70px', height: '14px', borderRadius: '4px' }} />
                                </th>
                                <th className="prod-table-th">
                                    <div className="skeleton" style={{ width: '55px', height: '14px', borderRadius: '4px' }} />
                                </th>
                                <th className="prod-table-th">
                                    <div className="skeleton" style={{ width: '85px', height: '14px', borderRadius: '4px' }} />
                                </th>
                                <th className="prod-table-th">
                                    <div className="skeleton" style={{ width: '55px', height: '14px', borderRadius: '4px' }} />
                                </th>
                                <th className="prod-table-th text-end">
                                    <div className="skeleton ms-auto" style={{ width: '60px', height: '14px', borderRadius: '4px' }} />
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...Array(6)].map((_, idx) => (
                                <tr key={idx} style={{ height: '62px' }}>
                                    <td>
                                        <div className="skeleton" style={{ width: '18px', height: '18px', borderRadius: '4px' }} />
                                    </td>
                                    <td>
                                        <div className="skeleton" style={{ width: '42px', height: '42px', borderRadius: '10px' }} />
                                    </td>
                                    <td>
                                        <div className="skeleton" style={{ width: '60px', height: '14px', borderRadius: '4px' }} />
                                    </td>
                                    <td>
                                        <div className="skeleton" style={{ width: '85px', height: '14px', borderRadius: '4px' }} />
                                    </td>
                                    <td>
                                        <div className="d-flex flex-column gap-1">
                                            <div className="skeleton" style={{ width: '140px', height: '14px', borderRadius: '4px' }} />
                                            <div className="skeleton" style={{ width: '75px', height: '11px', borderRadius: '3px' }} />
                                        </div>
                                    </td>
                                    <td>
                                        <div className="skeleton" style={{ width: '100px', height: '14px', borderRadius: '4px' }} />
                                    </td>
                                    <td>
                                        <div className="skeleton" style={{ width: '80px', height: '14px', borderRadius: '4px' }} />
                                    </td>
                                    <td>
                                        <div className="skeleton" style={{ width: '60px', height: '14px', borderRadius: '4px' }} />
                                    </td>
                                    <td>
                                        <div className="skeleton" style={{ width: '65px', height: '14px', borderRadius: '4px' }} />
                                    </td>
                                    <td>
                                        <div className="skeleton" style={{ width: '70px', height: '14px', borderRadius: '4px' }} />
                                    </td>
                                    <td>
                                        <div className="skeleton" style={{ width: '60px', height: '22px', borderRadius: '50px' }} />
                                    </td>
                                    <td className="text-end">
                                        <div className="d-flex align-items-center justify-content-end gap-1">
                                            <div className="skeleton" style={{ width: '30px', height: '30px', borderRadius: '8px' }} />
                                            <div className="skeleton" style={{ width: '30px', height: '30px', borderRadius: '8px' }} />
                                            <div className="skeleton" style={{ width: '30px', height: '30px', borderRadius: '8px' }} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>

                {/* Pagination Skeleton */}
                <div className="d-flex align-items-center justify-content-between p-3 border-top mt-2">
                    <div className="skeleton" style={{ width: '180px', height: '16px', borderRadius: '4px' }} />
                    <div className="d-flex align-items-center gap-2">
                        <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
                        <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
                        <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductSkeleton;
