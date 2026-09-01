import React, { useEffect, useState, useMemo } from 'react';
import { Card } from 'react-bootstrap';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { getFormattedMessage } from '../../shared/sharedMethod';
import { fetchStockAlert } from "../../store/action/stockAlertAction";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { subscribePosDataChanged } from '../../shared/posEvents';
import {
    faCheckCircle,
    faExclamationTriangle,
    faBarcode,
    faWarehouse,
    faArrowRight,
    faCartPlus,
    faBoxOpen,
    faArrowTrendDown,
} from '@fortawesome/free-solid-svg-icons';

// Monogram colors generator for fallback product avatars
const getAvatarColor = (name = '') => {
    const colors = [
        { bg: '#EFF6FF', color: '#2563EB', border: '#DBEAFE' },
        { bg: '#FEF2F2', color: '#DC2626', border: '#FEE2E2' },
        { bg: '#FFFBEB', color: '#D97706', border: '#FEF3C7' },
        { bg: '#FAF5FF', color: '#9333EA', border: '#F3E8FF' },
        { bg: '#F0FDF4', color: '#16A34A', border: '#DCFCE7' },
        { bg: '#ECFEFF', color: '#0891B2', border: '#CFFAFE' },
    ];
    const charCode = name ? name.charCodeAt(0) : 0;
    return colors[charCode % colors.length];
};

const StockAlert = (props) => {
    const { fetchStockAlert, stockAlertDetails, isInitialRefresh = false } = props;
    const [filter, setFilter] = useState('all'); // 'all' | 'out' | 'critical'

    useEffect(() => {
        fetchStockAlert();
        const unsubscribe = subscribePosDataChanged(() => {
            fetchStockAlert();
        });
        return () => {
            unsubscribe();
        };
    }, []);

    const rawAlerts = useMemo(() => {
        return Array.isArray(stockAlertDetails) ? stockAlertDetails : [];
    }, [stockAlertDetails]);

    // Metrics
    const outOfStockCount = useMemo(() => {
        return rawAlerts.filter(a => {
            const qty = Number(a?.stock?.quantity ?? a?.quantity ?? 0);
            return qty <= 0;
        }).length;
    }, [rawAlerts]);

    const criticalCount = useMemo(() => {
        return rawAlerts.filter(a => {
            const qty = Number(a?.stock?.quantity ?? a?.quantity ?? 0);
            const alertQty = Number(a?.stock_alert ?? a?.alert_quantity ?? 5);
            return qty > 0 && qty <= Math.max(1, alertQty / 2);
        }).length;
    }, [rawAlerts]);

    // Filtered list
    const filteredAlerts = useMemo(() => {
        if (filter === 'out') {
            return rawAlerts.filter(a => Number(a?.stock?.quantity ?? a?.quantity ?? 0) <= 0);
        }
        if (filter === 'critical') {
            return rawAlerts.filter(a => {
                const qty = Number(a?.stock?.quantity ?? a?.quantity ?? 0);
                const alertQty = Number(a?.stock_alert ?? a?.alert_quantity ?? 5);
                return qty <= Math.max(1, alertQty / 2);
            });
        }
        return rawAlerts;
    }, [rawAlerts, filter]);

    const hasAlerts = rawAlerts.length > 0;

    return (
        <Card
            className={`stock-alert-card border-0 bg-white h-100 ${isInitialRefresh ? 'dashboard-blur-pulse-active' : ''}`}
        >
            {/* 1. Header with Icon, Title & Urgency Filter Chips */}
            <div className="stock-alert-header" style={{ padding: "14px 18px 10px" }}>
                <div className="stock-alert-title-wrap">
                    <div className={`stock-alert-icon-box ${hasAlerts ? 'danger' : 'healthy'}`} style={{ width: '32px', height: '32px', borderRadius: '8px', fontSize: '13px' }}>
                        <FontAwesomeIcon icon={hasAlerts ? faExclamationTriangle : faCheckCircle} />
                    </div>
                    <div>
                        <div className="d-flex align-items-center gap-2">
                            <h5 className="mb-0 fw-extrabold text-dark" style={{ fontSize: "15.5px", color: "#0F172A", fontWeight: 800 }}>
                                {getFormattedMessage("dashboard.stockAlert.title") || "Stock Alert"}
                            </h5>
                            {hasAlerts && (
                                <span
                                    className="badge rounded-pill fw-extrabold px-2 py-0.5"
                                    style={{
                                        background: outOfStockCount > 0 ? '#FEE2E2' : '#FEF3C7',
                                        color: outOfStockCount > 0 ? '#DC2626' : '#D97706',
                                        fontSize: '10.5px',
                                        border: `1px solid ${outOfStockCount > 0 ? '#FECACA' : '#FDE68A'}`
                                    }}
                                >
                                    {rawAlerts.length} Low
                                </span>
                            )}
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748B", marginTop: "1px", fontWeight: "600" }}>
                            {hasAlerts ? "Items below reorder threshold" : "All items well-stocked"}
                        </div>
                    </div>
                </div>

                {/* Filter Pills */}
                {hasAlerts && (
                    <div className="d-flex align-items-center gap-1">
                        <button
                            type="button"
                            className={`stock-alert-filter-pill ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                            style={{ padding: '2px 8px', fontSize: '11px' }}
                        >
                            All ({rawAlerts.length})
                        </button>
                        {outOfStockCount > 0 && (
                            <button
                                type="button"
                                className={`stock-alert-filter-pill ${filter === 'out' ? 'active-critical' : ''}`}
                                onClick={() => setFilter('out')}
                                style={{ padding: '2px 8px', fontSize: '11px' }}
                            >
                                🔴 Out ({outOfStockCount})
                            </button>
                        )}
                        {criticalCount > 0 && (
                            <button
                                type="button"
                                className={`stock-alert-filter-pill ${filter === 'critical' ? 'active' : ''}`}
                                onClick={() => setFilter('critical')}
                                style={{ padding: '2px 8px', fontSize: '11px' }}
                            >
                                ⚠️ Critical ({criticalCount})
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* 2. Body List Container */}
            <Card.Body className="p-3 pt-2 d-flex flex-column justify-content-between flex-grow-1" style={{ minHeight: '300px' }}>
                {stockAlertDetails === null || stockAlertDetails === undefined ? (
                    /* Skeletons */
                    <div className="d-flex flex-column gap-2">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="d-flex align-items-center justify-content-between p-2 rounded-3 border" style={{ background: '#FFFFFF' }}>
                                <div className="d-flex align-items-center gap-2" style={{ minWidth: 0, flex: 1 }}>
                                    <div className="skeleton" style={{ width: '34px', height: '34px', borderRadius: '8px' }} />
                                    <div className="d-flex flex-column gap-1" style={{ flex: 1 }}>
                                        <div className="skeleton" style={{ width: '120px', height: '12px', borderRadius: '4px' }} />
                                        <div className="skeleton" style={{ width: '70px', height: '9px', borderRadius: '4px' }} />
                                    </div>
                                </div>
                                <div className="d-flex flex-column align-items-end gap-1">
                                    <div className="skeleton" style={{ width: '45px', height: '16px', borderRadius: '6px' }} />
                                    <div className="skeleton" style={{ width: '55px', height: '14px', borderRadius: '4px' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : hasAlerts ? (
                    <div className="d-flex flex-column stock-alert-scroll" style={{ maxHeight: '275px', overflowY: 'auto', paddingRight: '2px' }}>
                        {filteredAlerts.map((alert, index) => {
                            const warehouseName = alert?.stock?.warehouse?.name || alert?.warehouse_name || "Main Warehouse";
                            const quantity = Number(alert?.stock?.quantity ?? alert?.quantity ?? 0);
                            const unitName = alert?.stock?.product_unit_name || alert?.product_unit_name || alert?.product_unit || "pc";
                            const alertQuantity = Number(alert?.stock_alert ?? alert?.alert_quantity ?? 5);
                            const isOutOfStock = quantity <= 0;
                            const isCritical = !isOutOfStock && quantity <= Math.max(1, alertQuantity / 2);
                            const avatarStyle = getAvatarColor(alert.name);
                            const progressPct = alertQuantity > 0 ? Math.min(100, Math.max(0, (quantity / alertQuantity) * 100)) : 0;
                            const imageSrc = alert?.image || alert?.attributes?.image;
                            const prodId = alert.product_id || alert.id || '';

                            return (
                                <div
                                    key={alert.id || index}
                                    className={`stock-alert-item ${isOutOfStock ? 'critical' : isCritical ? 'critical' : 'warning'}`}
                                    style={{ padding: '7px 10px', marginBottom: '6px' }}
                                >
                                    {/* Left: Thumbnail & Name & Info */}
                                    <div className="d-flex align-items-center gap-2" style={{ minWidth: 0, flex: 1 }}>
                                        {imageSrc && !imageSrc.includes('brand_logo') ? (
                                            <img
                                                src={imageSrc}
                                                alt={alert.name}
                                                className="stock-avatar"
                                                style={{ width: '34px', height: '34px', borderRadius: '8px' }}
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <div
                                                className="stock-avatar"
                                                style={{
                                                    width: '34px',
                                                    height: '34px',
                                                    borderRadius: '8px',
                                                    background: avatarStyle.bg,
                                                    color: avatarStyle.color,
                                                    border: `1px solid ${avatarStyle.border}`,
                                                    fontSize: '13px'
                                                }}
                                            >
                                                {alert.name ? alert.name.charAt(0).toUpperCase() : 'P'}
                                            </div>
                                        )}

                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <div
                                                className="fw-bold text-dark text-truncate"
                                                style={{ fontSize: "12.5px", color: "#0F172A", lineHeight: 1.25 }}
                                                title={alert.name}
                                            >
                                                {alert.name}
                                            </div>

                                            <div className="d-flex align-items-center gap-2 mt-0.5 flex-wrap" style={{ fontSize: "10.5px", color: "#64748B" }}>
                                                <span className="d-inline-flex align-items-center gap-1">
                                                    <FontAwesomeIcon icon={faBarcode} style={{ fontSize: '9.5px', color: '#94A3B8' }} />
                                                    {alert.code || '—'}
                                                </span>
                                                <span style={{ color: '#CBD5E1' }}>•</span>
                                                <span className="d-inline-flex align-items-center gap-1 text-truncate" style={{ maxWidth: '95px' }} title={warehouseName}>
                                                    <FontAwesomeIcon icon={faWarehouse} style={{ fontSize: '9.5px', color: '#94A3B8' }} />
                                                    {warehouseName}
                                                </span>
                                            </div>

                                            {/* Mini Visual Stock Progress Track */}
                                            <div className="stock-progress-track" style={{ height: '3.5px', marginTop: '3px' }}>
                                                <div
                                                    className={`stock-progress-fill ${isOutOfStock || isCritical ? 'danger' : 'warning'}`}
                                                    style={{ width: `${progressPct}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Stock Count & Restock Action Button */}
                                    <div className="d-flex flex-column align-items-end justify-content-center gap-1 flex-shrink-0 ms-2">
                                        <span className={`stock-badge ${isOutOfStock ? 'out-of-stock' : isCritical ? 'critical' : 'low'}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                                            {isOutOfStock ? (
                                                '● 0 Stock'
                                            ) : (
                                                `${quantity} / ${alertQuantity} ${unitName}`
                                            )}
                                        </span>

                                        <Link
                                            to={`/app/purchases/create?restock_product_id=${prodId}&product_name=${encodeURIComponent(alert.name || '')}&product_code=${encodeURIComponent(alert.code || '')}&warehouse_id=${alert.warehouse_id || alert.stock?.warehouse_id || ''}&alert_qty=${alertQuantity}`}
                                            state={{ restockProduct: alert }}
                                            className="stock-action-btn"
                                            title="Create Purchase / Restock"
                                            style={{ padding: '2px 7px', fontSize: '10.5px', borderRadius: '6px' }}
                                        >
                                            <FontAwesomeIcon icon={faCartPlus} /> Restock
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* Clean High-End Healthy State */
                    <div className="text-center py-4 my-auto">
                        <div
                            className="mx-auto mb-2 rounded-circle d-flex align-items-center justify-content-center"
                            style={{
                                width: "52px",
                                height: "52px",
                                background: "#DCFCE7",
                                color: "#16A34A",
                                fontSize: "22px",
                                boxShadow: "0 4px 14px rgba(22, 163, 74, 0.15)"
                            }}
                        >
                            <FontAwesomeIcon icon={faCheckCircle} />
                        </div>
                        <h6 className="mb-1 fw-extrabold text-dark" style={{ fontSize: "15px", color: "#0F172A", fontWeight: 800 }}>
                            All Products Well Stocked
                        </h6>
                        <p className="mb-0 text-muted fw-semibold" style={{ fontSize: "12px", color: "#64748B" }}>
                            0 items below minimum threshold
                        </p>
                    </div>
                )}

                {/* 3. Footer Action */}
                {hasAlerts && (
                    <div className="d-flex align-items-center justify-content-between pt-2 mt-1 border-top border-light">
                        <span style={{ fontSize: "11.5px", color: "#64748B", fontWeight: 600 }}>
                            Showing {Math.min(4, filteredAlerts.length)} of {rawAlerts.length} items
                        </span>
                        <Link
                            to="/app/reports/stock-report"
                            className="btn border rounded-pill px-2.5 py-0.5 text-primary fw-extrabold"
                            style={{ fontSize: "11.5px", borderColor: "#BFDBFE", background: "#EFF6FF", textDecoration: "none" }}
                        >
                            Stock Report <FontAwesomeIcon icon={faArrowRight} className="ms-1" style={{ fontSize: '9px' }} />
                        </Link>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

const mapStateToProps = (state) => {
    const { stockAlertDetails } = state;
    return { stockAlertDetails };
};

export default connect(mapStateToProps, { fetchStockAlert })(StockAlert);

