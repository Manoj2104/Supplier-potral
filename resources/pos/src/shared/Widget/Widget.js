import React from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { currencySymbolHandling } from "../sharedMethod";
import LiveCounter from "../components/LiveCounter";

import LiveKpiSparkline from "../components/LiveKpiSparkline";

const Widget = (props) => {
    const {
        title,
        value,
        currency,
        icon,
        iconClass,
        iconBg,
        iconColor,
        onClick,
        allConfigData,
        isDark,
        badgeText,
        badgeType = "positive",
        subtitle = "vs yesterday",
        sparklineColor = "#16A34A",
        sparklineData = [0, 0, 0, 0, 0, 0, 0],
        isInitialRefresh = false,
    } = props;

    const uniqueId = Math.random().toString(36).substring(2, 9);

    const renderTooltip = (props) => (
        <Tooltip id={`tooltip-${uniqueId}`} {...props}>
            {currency} {value}
        </Tooltip>
    );

    const badgeStr = typeof badgeText === "string" ? badgeText : (badgeText ? String(badgeText) : "");
    const isPositive = badgeType === "positive" || (badgeStr && badgeStr.includes("▲"));
    const isNegative = badgeType === "negative" || (badgeStr && badgeStr.includes("▼"));
    const isNeutral = !isPositive && !isNegative;

    const strokeColor = isDark ? "#FFFFFF" : sparklineColor;
    const areaFillColor = isDark ? "rgba(255, 255, 255, 0.25)" : sparklineColor;

    const badgeBgColor = isDark
        ? '#FFFFFF'
        : (isPositive ? '#DCFCE7' : (isNegative ? '#FEE2E2' : '#F1F5F9'));

    const badgeTextColor = isDark
        ? '#15803D'
        : (isPositive ? '#16A34A' : (isNegative ? '#DC2626' : '#64748B'));

    return (
        <div className="col-xxl-3 col-xl-6 col-sm-6 widget dashboard-widget mb-4" onClick={onClick}>
            <div
                className={`card border-0 d-flex flex-column justify-content-between h-100 transition-all ${
                    isDark ? 'hero-sales-card' : ''
                } ${isInitialRefresh ? 'dashboard-blur-pulse-active' : ''}`}
                style={{
                    background: isDark
                        ? 'linear-gradient(135deg, #16A34A 0%, #15803D 50%, #166534 100%)'
                        : '#FFFFFF',
                    backgroundColor: isDark ? '#16A34A' : '#FFFFFF',
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    borderRadius: '22px',
                    boxShadow: '0 10px 35px rgba(15, 23, 42, 0.08)',
                    border: isDark ? 'none' : '1px solid #EEF2F7',
                    cursor: 'pointer',
                    minHeight: '175px',
                    padding: '22px 24px',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 18px 45px rgba(15, 23, 42, 0.14)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0px)';
                    e.currentTarget.style.boxShadow = '0 10px 35px rgba(15, 23, 42, 0.08)';
                }}
            >
                {/* Header Row: Icon + Title on Left | Badge on Right */}
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center gap-3">
                        <div
                            className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{
                                width: '46px',
                                height: '46px',
                                borderRadius: '14px',
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.22)' : (iconBg || iconClass || '#DCFCE7'),
                                color: isDark ? '#FFFFFF' : (iconColor || '#16A34A'),
                                fontSize: '18px',
                                backdropFilter: isDark ? 'blur(8px)' : 'none'
                            }}
                        >
                            {icon}
                        </div>
                        <span
                            className="fw-bold"
                            style={{
                                fontFamily: "'Inter', sans-serif",
                                fontSize: '15px',
                                fontWeight: '600',
                                color: isDark ? '#FFFFFF' : '#475569'
                            }}
                        >
                            {title}
                        </span>
                    </div>

                    {/* Top Right Trend Badge with Perfect Padding & Contrast */}
                    {badgeText && (
                        <div
                            className="rounded-pill"
                            style={{
                                backgroundColor: badgeBgColor,
                                color: badgeTextColor,
                                fontSize: '12.5px',
                                fontWeight: '800',
                                fontFamily: "'Inter', sans-serif",
                                padding: '5px 14px',
                                whiteSpace: 'nowrap',
                                boxShadow: isDark ? '0 2px 8px rgba(0, 0, 0, 0.12)' : 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                lineHeight: '1.2'
                            }}
                        >
                            <span style={{ color: badgeTextColor, fontWeight: '800', letterSpacing: '0.2px' }}>
                                {badgeText}
                            </span>
                        </div>
                    )}
                </div>

                {/* Amount & Subtitle */}
                <div className="mb-2" style={{ minHeight: '44px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <OverlayTrigger placement="bottom" delay={{ show: 250, hide: 400 }} overlay={renderTooltip}>
                        <h2
                            className={`fw-extrabold mb-1 ${isInitialRefresh ? 'dashboard-value-pulse' : ''}`}
                            style={{
                                fontFamily: "'Inter', sans-serif",
                                fontSize: '36px',
                                fontWeight: '800',
                                letterSpacing: '-0.03em',
                                color: isDark ? '#FFFFFF' : '#0F172A',
                                margin: 0,
                                lineHeight: '1.1'
                            }}
                        >
                            <LiveCounter
                                value={value !== null && value !== undefined ? value : "0.00"}
                                currency={currency}
                                decimals={2}
                                isDark={isDark}
                                allConfigData={allConfigData}
                                isFormatted={true}
                                isCurrency={true}
                            />
                        </h2>
                    </OverlayTrigger>
                    <span
                        style={{
                            fontSize: '13px',
                            fontWeight: '500',
                            color: isDark ? 'rgba(255, 255, 255, 0.85)' : '#94A3B8',
                            fontFamily: "'Inter', sans-serif"
                        }}
                    >
                        {subtitle}
                    </span>
                </div>

                {/* Real-Time Live KPI Sparkline */}
                <div className="mt-2" style={{ height: "42px", overflow: "visible" }}>
                    <LiveKpiSparkline
                        data={sparklineData}
                        color={sparklineColor}
                        isDark={isDark}
                    />
                </div>
            </div>
        </div>
    );
};

export default Widget;
