import React, { useEffect, useState, useRef } from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCube,
    faUsers,
    faTriangleExclamation,
    faReceipt,
    faRotateRight,
    faEllipsisVertical,
    faArrowUp,
    faCheck
} from '@fortawesome/free-solid-svg-icons';
import apiConfig from '../../config/apiConfig';
import { getCached, setCache } from '../../store/apiCache';
import LiveCounter from '../../shared/components/LiveCounter';
import { subscribePosDataChanged } from '../../shared/posEvents';

const CACHE_KEY = 'dashboard:quick_stats';

const QuickStatsPanel = ({ isInitialRefresh = false }) => {
    const initialCache = getCached(CACHE_KEY) || {};
    const [productsCount, setProductsCount] = useState(initialCache?.total_products ?? 0);
    const [customersCount, setCustomersCount] = useState(initialCache?.total_customers ?? 0);
    const [lowStockCount, setLowStockCount] = useState(initialCache?.low_stock ?? 0);
    const [invoicesCount, setInvoicesCount] = useState(initialCache?.invoices_count ?? 0);
    const [productsGrowth, setProductsGrowth] = useState(initialCache?.products_growth ?? { text: '0%', isPositive: true });
    const [customersGrowth, setCustomersGrowth] = useState(initialCache?.customers_growth ?? { text: '0%', isPositive: true });
    const [invoicesGrowth, setInvoicesGrowth] = useState(initialCache?.invoices_growth ?? { text: '0%', isPositive: true });
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState('Just now');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const isMounted = useRef(true);

    const loadData = () => {
        setIsRefreshing(true);
        apiConfig.get('dashboard-quick-stats')
            .then((res) => {
                if (!isMounted.current) return;
                if (res && res.data && res.data.data) {
                    const c = res.data.data;
                    setCache(CACHE_KEY, c);
                    setProductsCount(c.total_products !== undefined ? c.total_products : 0);
                    setCustomersCount(c.total_customers !== undefined ? c.total_customers : 0);
                    setLowStockCount(c.low_stock !== undefined ? c.low_stock : 0);
                    setInvoicesCount(c.invoices_count !== undefined ? c.invoices_count : 0);
                    if (c.products_growth) setProductsGrowth(c.products_growth);
                    if (c.customers_growth) setCustomersGrowth(c.customers_growth);
                    if (c.invoices_growth) setInvoicesGrowth(c.invoices_growth);
                }
                setLoading(false);
                setLastUpdated('Just now');
                setTimeout(() => {
                    if (isMounted.current) setIsRefreshing(false);
                }, 300);
            })
            .catch(() => {
                if (!isMounted.current) return;
                setLoading(false);
                setIsRefreshing(false);
            });
    };

    useEffect(() => {
        isMounted.current = true;
        loadData();

        // Real-time reactive listener for POS transactions and inventory changes
        const unsubscribe = subscribePosDataChanged(() => {
            loadData();
        });

        return () => {
            isMounted.current = false;
            unsubscribe();
        };
    }, []);

    const cardsData = [
        {
            id: 'products',
            title: 'Total Products',
            value: productsCount,
            growth: productsGrowth.text || '0%',
            growthText: 'vs last month',
            isPositive: productsGrowth.isPositive !== false,
            icon: faCube,
            iconGradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
            iconShadow: '0 4px 12px rgba(59, 130, 246, 0.35)',
        },
        {
            id: 'customers',
            title: 'Total Customers',
            value: customersCount,
            growth: customersGrowth.text || '0%',
            growthText: 'vs last month',
            isPositive: customersGrowth.isPositive !== false,
            icon: faUsers,
            iconGradient: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
            iconShadow: '0 4px 12px rgba(34, 197, 94, 0.35)',
        },
        {
            id: 'low_stock',
            title: 'Low Stock Items',
            value: lowStockCount,
            isLowStock: true,
            icon: faTriangleExclamation,
            iconGradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            iconShadow: '0 4px 12px rgba(245, 158, 11, 0.35)',
        },
        {
            id: 'invoices',
            title: 'Total Invoices',
            value: invoicesCount,
            growth: invoicesGrowth.text || '0%',
            growthText: 'vs last month',
            isPositive: invoicesGrowth.isPositive !== false,
            icon: faReceipt,
            iconGradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
            iconShadow: '0 4px 12px rgba(139, 92, 246, 0.35)',
        }
    ];

    return (
        <Card
            className="border-0 bg-white"
            style={{
                borderRadius: '20px',
                border: '1px solid #EEF2F7',
                boxShadow: '0 6px 20px rgba(15, 23, 42, 0.03)',
                padding: '8px'
            }}
        >
            {/* ==================================================== */}
            {/* SECTION HEADER                                       */}
            {/* ==================================================== */}
            <div className="d-flex align-items-center justify-content-between p-3 px-4 pb-2">
                <h5 className="mb-0 fw-extrabold" style={{ fontSize: '18px', color: '#0F172A', fontWeight: 800 }}>
                    Quick Stats
                </h5>

                <div className="d-flex align-items-center gap-2">
                    <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 500 }}>
                        Last Updated: <strong style={{ color: '#0F172A', fontWeight: 600 }}>{lastUpdated}</strong>
                    </span>
                    <button
                        type="button"
                        onClick={loadData}
                        title="Refresh Quick Stats"
                        className="btn p-0 d-flex align-items-center justify-content-center"
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            color: '#475569',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#EFF6FF';
                            e.currentTarget.style.color = '#2563EB';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#F8FAFC';
                            e.currentTarget.style.color = '#475569';
                        }}
                    >
                        <FontAwesomeIcon
                            icon={faRotateRight}
                            style={{
                                fontSize: '12px',
                                transition: 'transform 0.5s ease',
                                transform: isRefreshing ? 'rotate(360deg)' : 'none'
                            }}
                        />
                    </button>
                </div>
            </div>

            {/* ==================================================== */}
            {/* LAYOUT: 4 Compact KPI Cards (4 columns × 1 row)     */}
            {/* ==================================================== */}
            <Card.Body className="p-3 pt-1">
                <Row className="g-3">
                    {cardsData.map((card) => (
                        <Col key={card.id} xl={3} lg={3} md={6} sm={6} className="col-12">
                            <div
                                className={`position-relative h-100 ${isInitialRefresh ? 'dashboard-blur-pulse-active' : ''}`}
                                style={{
                                    background: '#FFFFFF',
                                    border: '1px solid #EEF2F7',
                                    borderRadius: '16px',
                                    padding: '16px',
                                    boxShadow: '0 6px 20px rgba(15, 23, 42, 0.05)',
                                    transition: 'transform 300ms ease, box-shadow 300ms ease, border-color 300ms ease',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-3px)';
                                    e.currentTarget.style.boxShadow = '0 12px 28px rgba(15, 23, 42, 0.09)';
                                    e.currentTarget.style.borderColor = '#CBD5E1';
                                    const iconEl = e.currentTarget.querySelector('.kpi-icon-box');
                                    if (iconEl) iconEl.style.transform = 'scale(1.05)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0px)';
                                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(15, 23, 42, 0.05)';
                                    e.currentTarget.style.borderColor = '#EEF2F7';
                                    const iconEl = e.currentTarget.querySelector('.kpi-icon-box');
                                    if (iconEl) iconEl.style.transform = 'scale(1)';
                                }}
                            >
                                {/* 3-Dots Menu Icon in top-right */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '14px',
                                        right: '14px',
                                        color: '#94A3B8',
                                        fontSize: '13px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <FontAwesomeIcon icon={faEllipsisVertical} />
                                </div>

                                <div className="d-flex align-items-center gap-3">
                                    {/* LEFT: 44px × 44px Circular Icon */}
                                    <div
                                        className="kpi-icon-box d-flex align-items-center justify-content-center flex-shrink-0"
                                        style={{
                                            width: '44px',
                                            height: '44px',
                                            borderRadius: '14px',
                                            background: card.iconGradient,
                                            boxShadow: card.iconShadow,
                                            color: '#FFFFFF',
                                            fontSize: '18px',
                                            transition: 'transform 300ms ease'
                                        }}
                                    >
                                        <FontAwesomeIcon icon={card.icon} />
                                    </div>

                                    {/* RIGHT: Title, Number, Growth Badge */}
                                    <div className="d-flex flex-column" style={{ minWidth: 0 }}>
                                        {/* Top: Small Title (13px, Weight 500, #64748B) */}
                                        <span
                                            className="text-truncate d-block"
                                            style={{
                                                fontSize: '13px',
                                                fontWeight: 500,
                                                color: '#64748B',
                                                lineHeight: '1.2'
                                            }}
                                        >
                                            {card.title}
                                        </span>

                                        {/* Middle: Large Number (38px, Weight 700, #0F172A) */}
                                        <div
                                            className={isInitialRefresh ? 'dashboard-value-pulse' : ''}
                                            style={{
                                                fontSize: '34px',
                                                fontWeight: 700,
                                                color: '#0F172A',
                                                lineHeight: '1.1',
                                                margin: '2px 0 4px 0',
                                                letterSpacing: '-0.5px'
                                            }}
                                        >
                                            <LiveCounter value={card.value !== null && card.value !== undefined ? card.value : 0} isCurrency={false} />
                                        </div>

                                        {/* Bottom: Growth Badge / Low Stock Badge */}
                                        {card.isLowStock ? (
                                            <div>
                                                {card.value === 0 ? (
                                                    <span
                                                        className="d-inline-flex align-items-center gap-1 px-2.5 py-0.5 rounded-pill fw-semibold"
                                                        style={{
                                                            fontSize: '11.5px',
                                                            background: '#DCFCE7',
                                                            color: '#15803D',
                                                            fontWeight: 600
                                                        }}
                                                    >
                                                        <FontAwesomeIcon icon={faCheck} style={{ fontSize: '10px' }} />
                                                        Inventory Healthy
                                                    </span>
                                                ) : (
                                                    <span
                                                        className="d-inline-flex align-items-center gap-1 px-2.5 py-0.5 rounded-pill fw-semibold"
                                                        style={{
                                                            fontSize: '11.5px',
                                                            background: '#FEE2E2',
                                                            color: '#EF4444',
                                                            fontWeight: 600
                                                        }}
                                                    >
                                                        <FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: '10px' }} />
                                                        {card.value} Items Low
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="d-flex align-items-center text-nowrap">
                                                <span
                                                    className="d-inline-flex align-items-center gap-1 px-2 py-0.5 rounded-pill fw-semibold"
                                                    style={{
                                                        fontSize: '11.5px',
                                                        background: '#DCFCE7',
                                                        color: '#16A34A',
                                                        fontWeight: 600
                                                    }}
                                                >
                                                    <FontAwesomeIcon icon={faArrowUp} style={{ fontSize: '9px' }} />
                                                    {card.growth}
                                                </span>
                                                <span
                                                    className="ms-1.5"
                                                    style={{
                                                        fontSize: '12px',
                                                        fontWeight: 500,
                                                        color: '#64748B'
                                                    }}
                                                >
                                                    {card.growthText}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Col>
                    ))}
                </Row>
            </Card.Body>
        </Card>
    );
};

export default QuickStatsPanel;
