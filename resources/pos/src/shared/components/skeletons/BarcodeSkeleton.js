import React from 'react';
import { Row, Col, Card } from 'react-bootstrap-v5';

const BarcodeSkeleton = () => {
    return (
        <div className="dashboard-page premium-workspace barcode-skeleton-root" aria-hidden="true" role="status">
            {/* 1. Header Intro Skeleton */}
            <div className="dashboard-intro">
                <div>
                    <div className="skeleton mb-2" style={{ width: '180px', height: '14px', borderRadius: '4px' }} />
                    <div className="skeleton mb-2" style={{ width: '250px', height: '34px', borderRadius: '10px' }} />
                    <div className="skeleton" style={{ width: '380px', height: '16px', borderRadius: '6px' }} />
                </div>
                <div className="dashboard-actions">
                    <div className="skeleton" style={{ width: '130px', height: '42px', borderRadius: '50px' }} />
                    <div className="skeleton" style={{ width: '120px', height: '42px', borderRadius: '50px' }} />
                </div>
            </div>

            {/* 2. Top Form Card Skeleton */}
            <Card className="border-0 shadow-sm rounded-4 bg-white p-4 mb-4" style={{ borderRadius: '20px', border: '1px solid #EEF2F7' }}>
                <Row className="g-3 mb-4">
                    <Col md={6}>
                        <div className="skeleton mb-2" style={{ width: '120px', height: '14px', borderRadius: '4px' }} />
                        <div className="skeleton" style={{ width: '100%', height: '44px', borderRadius: '12px' }} />
                    </Col>
                    <Col md={6}>
                        <div className="skeleton mb-2" style={{ width: '140px', height: '14px', borderRadius: '4px' }} />
                        <div className="skeleton" style={{ width: '100%', height: '44px', borderRadius: '12px' }} />
                    </Col>
                </Row>
                <div className="d-flex align-items-center gap-3 pt-3 border-top">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="d-flex align-items-center gap-2">
                            <div className="skeleton" style={{ width: '18px', height: '18px', borderRadius: '4px' }} />
                            <div className="skeleton" style={{ width: '90px', height: '14px', borderRadius: '4px' }} />
                        </div>
                    ))}
                </div>
            </Card>

            {/* 3. Barcode Print Sheet Preview Skeleton */}
            <Card className="border-0 shadow-sm rounded-4 bg-white p-4" style={{ borderRadius: '20px', border: '1px solid #EEF2F7' }}>
                <div className="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom">
                    <div className="skeleton" style={{ width: '160px', height: '20px', borderRadius: '6px' }} />
                    <div className="skeleton" style={{ width: '110px', height: '36px', borderRadius: '50px' }} />
                </div>
                <Row className="g-3">
                    {[...Array(8)].map((_, i) => (
                        <Col key={i} md={3} sm={6}>
                            <div className="p-3 border rounded-3 text-center d-flex flex-column align-items-center gap-2">
                                <div className="skeleton" style={{ width: '100px', height: '12px', borderRadius: '3px' }} />
                                <div className="skeleton" style={{ width: '100%', height: '45px', borderRadius: '4px' }} />
                                <div className="skeleton" style={{ width: '80px', height: '12px', borderRadius: '3px' }} />
                                <div className="skeleton" style={{ width: '60px', height: '16px', borderRadius: '4px' }} />
                            </div>
                        </Col>
                    ))}
                </Row>
            </Card>
        </div>
    );
};

export default BarcodeSkeleton;
