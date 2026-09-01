import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';

const DashboardSkeleton = () => {
    return (
        <div className="dashboard-page premium-workspace dashboard-skeleton-root" aria-hidden="true" role="status">
            {/* 1. Header Skeleton */}
            <div className="dashboard-intro">
                <div>
                    <div className="skeleton" style={{ width: '220px', height: '34px', borderRadius: '10px', marginBottom: '8px' }} />
                    <div className="skeleton" style={{ width: '380px', height: '16px', borderRadius: '6px' }} />
                </div>
                <div className="dashboard-actions">
                    <div className="skeleton" style={{ width: '130px', height: '42px', borderRadius: '50px' }} />
                    <div className="skeleton" style={{ width: '130px', height: '42px', borderRadius: '50px' }} />
                </div>
            </div>

            {/* 2. Main KPI Cards Skeleton (8 Cards in 4x2 Grid) */}
            <Row className="g-4 mb-4">
                <Col className="col-12">
                    <Row className="g-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="col-xxl-3 col-xl-6 col-sm-6 widget dashboard-widget mb-4">
                                <div
                                    className="card border-0 d-flex flex-column justify-content-between h-100"
                                    style={{
                                        background: '#FFFFFF',
                                        borderRadius: '22px',
                                        boxShadow: '0 10px 35px rgba(15, 23, 42, 0.05)',
                                        border: '1px solid #EEF2F7',
                                        minHeight: '175px',
                                        padding: '22px 24px',
                                    }}
                                >
                                    {/* Header Row: Icon + Title on Left | Badge on Right */}
                                    <div className="d-flex align-items-center justify-content-between mb-3">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="skeleton" style={{ width: '46px', height: '46px', borderRadius: '14px' }} />
                                            <div className="skeleton" style={{ width: '90px', height: '18px', borderRadius: '6px' }} />
                                        </div>
                                        <div className="skeleton" style={{ width: '65px', height: '24px', borderRadius: '50px' }} />
                                    </div>

                                    {/* Amount & Subtitle */}
                                    <div className="mb-2" style={{ minHeight: '44px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <div className="skeleton" style={{ width: '120px', height: '32px', borderRadius: '8px', marginBottom: '8px' }} />
                                        <div className="skeleton" style={{ width: '80px', height: '14px', borderRadius: '5px' }} />
                                    </div>

                                    {/* Wave Sparkline Placeholder */}
                                    <div className="mt-2" style={{ height: '42px', position: 'relative' }}>
                                        <div className="skeleton" style={{ width: '100%', height: '36px', borderRadius: '10px' }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </Row>
                </Col>
            </Row>

            {/* 3. Quick Stats Panel Skeleton */}
            <div className="mb-4">
                <Card
                    className="border-0 bg-white"
                    style={{
                        borderRadius: '20px',
                        border: '1px solid #EEF2F7',
                        boxShadow: '0 6px 20px rgba(15, 23, 42, 0.03)',
                        padding: '8px'
                    }}
                >
                    <div className="d-flex align-items-center justify-content-between p-3 px-4 pb-2">
                        <div className="skeleton" style={{ width: '120px', height: '20px', borderRadius: '6px' }} />
                        <div className="skeleton" style={{ width: '140px', height: '16px', borderRadius: '6px' }} />
                    </div>
                    <Card.Body className="p-3 pt-1">
                        <Row className="g-3">
                            {[...Array(4)].map((_, i) => (
                                <Col key={i} xl={3} lg={3} md={6} sm={6} className="col-12">
                                    <div
                                        className="position-relative h-100"
                                        style={{
                                            background: '#FFFFFF',
                                            border: '1px solid #EEF2F7',
                                            borderRadius: '16px',
                                            padding: '16px',
                                            boxShadow: '0 6px 20px rgba(15, 23, 42, 0.04)',
                                        }}
                                    >
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="skeleton" style={{ width: '44px', height: '44px', borderRadius: '14px' }} />
                                            <div className="d-flex flex-column gap-2" style={{ flex: 1 }}>
                                                <div className="skeleton" style={{ width: '85px', height: '14px', borderRadius: '4px' }} />
                                                <div className="skeleton" style={{ width: '60px', height: '28px', borderRadius: '6px' }} />
                                                <div className="skeleton" style={{ width: '75px', height: '18px', borderRadius: '50px' }} />
                                            </div>
                                        </div>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    </Card.Body>
                </Card>
            </div>

            {/* 4. Middle 3 Panels (Sales Overview, Top Selling Products, Recent Activities) */}
            <Row className="g-4 mb-4 align-items-stretch">
                {/* Col 1: Sales Overview Skeleton */}
                <Col xl={4} lg={4} md={12} className="col-12">
                    <Card className="border-0 shadow-sm rounded-4 h-100 bg-white" style={{ borderRadius: "20px" }}>
                        <div className="p-3 px-4 pb-0 d-flex align-items-center justify-content-between">
                            <div className="skeleton" style={{ width: '130px', height: '20px', borderRadius: '6px' }} />
                            <div className="skeleton" style={{ width: '90px', height: '26px', borderRadius: '8px' }} />
                        </div>
                        <Card.Body className="p-3 pt-3 d-flex flex-column justify-content-between">
                            <div className="d-flex align-items-end justify-content-between px-2" style={{ height: '210px', gap: '8px' }}>
                                {[45, 75, 50, 95, 60, 85, 40].map((h, idx) => (
                                    <div key={idx} className="d-flex flex-column align-items-center gap-2" style={{ flex: 1 }}>
                                        <div className="skeleton" style={{ width: '100%', height: `${h * 1.8}px`, borderRadius: '6px' }} />
                                        <div className="skeleton" style={{ width: '24px', height: '12px', borderRadius: '3px' }} />
                                    </div>
                                ))}
                            </div>
                            <div className="row g-1 pt-3 border-top mt-3 text-center">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="col-3">
                                        <div className="skeleton mx-auto mb-1" style={{ width: '50px', height: '12px', borderRadius: '3px' }} />
                                        <div className="skeleton mx-auto" style={{ width: '45px', height: '16px', borderRadius: '4px' }} />
                                    </div>
                                ))}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Col 2: Top Selling Products Skeleton */}
                <Col xl={4} lg={4} md={12} className="col-12">
                    <Card className="border-0 shadow-sm rounded-4 h-100 bg-white" style={{ borderRadius: "20px" }}>
                        <div className="p-3 px-4 pb-0 d-flex align-items-center justify-content-between">
                            <div className="skeleton" style={{ width: '150px', height: '20px', borderRadius: '6px' }} />
                            <div className="skeleton" style={{ width: '80px', height: '26px', borderRadius: '8px' }} />
                        </div>
                        <Card.Body className="p-3 pt-3 d-flex flex-column gap-3">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="d-flex align-items-center justify-content-between p-1">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="skeleton" style={{ width: '16px', height: '16px', borderRadius: '4px' }} />
                                        <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '10px' }} />
                                        <div className="d-flex flex-column gap-1">
                                            <div className="skeleton" style={{ width: '120px', height: '14px', borderRadius: '4px' }} />
                                            <div className="skeleton" style={{ width: '75px', height: '11px', borderRadius: '3px' }} />
                                        </div>
                                    </div>
                                    <div className="skeleton" style={{ width: '55px', height: '14px', borderRadius: '4px' }} />
                                </div>
                            ))}
                        </Card.Body>
                    </Card>
                </Col>

                {/* Col 3: Recent Activities Skeleton */}
                <Col xl={4} lg={4} md={12} className="col-12">
                    <Card className="border-0 shadow-sm rounded-4 h-100 bg-white" style={{ borderRadius: "20px" }}>
                        <div className="p-3 px-4 pb-0 d-flex align-items-center justify-content-between">
                            <div className="skeleton" style={{ width: '140px', height: '20px', borderRadius: '6px' }} />
                            <div className="skeleton" style={{ width: '45px', height: '20px', borderRadius: '50px' }} />
                        </div>
                        <Card.Body className="p-3 pt-3 d-flex flex-column gap-2">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="d-flex align-items-center justify-content-between p-2 rounded-3" style={{ border: '1px solid #F1F5F9' }}>
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '10px' }} />
                                        <div className="d-flex flex-column gap-1">
                                            <div className="skeleton" style={{ width: '130px', height: '14px', borderRadius: '4px' }} />
                                            <div className="skeleton" style={{ width: '90px', height: '11px', borderRadius: '3px' }} />
                                        </div>
                                    </div>
                                    <div className="skeleton" style={{ width: '60px', height: '14px', borderRadius: '4px' }} />
                                </div>
                            ))}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* 5. Recent Sales Table Skeleton */}
            <Row className="g-4 mb-4">
                <Col col={12} className="col-12">
                    <Card className="border-0 bg-white" style={{ borderRadius: '24px', boxShadow: '0 10px 30px rgba(15,23,42,.06)', border: '1px solid #EEF2F7', padding: '24px' }}>
                        <div className="d-flex align-items-center justify-content-between mb-4">
                            <div className="skeleton" style={{ width: '140px', height: '22px', borderRadius: '6px' }} />
                            <div className="skeleton" style={{ width: '90px', height: '30px', borderRadius: '50px' }} />
                        </div>
                        <div className="d-flex flex-column gap-3">
                            <div className="skeleton" style={{ width: '100%', height: '38px', borderRadius: '8px' }} />
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="skeleton" style={{ width: '100%', height: '48px', borderRadius: '8px' }} />
                            ))}
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default DashboardSkeleton;

