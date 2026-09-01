import React, { useMemo } from "react";

/**
 * LiveSparkline Component
 * Real data-driven smooth cubic spline curve with pulsing glowing live endpoint dot.
 * Gracefully handles 0-value states with a flat neutral baseline.
 */
const LiveSparkline = ({
    data = [0, 0, 0, 0, 0, 0, 0],
    color = "#16A34A",
    isDark = false,
    width = 60,
    height = 24,
    strokeWidth = 2,
    showArea = false,
    showPulsingDot = true,
}) => {
    const id = useMemo(() => Math.random().toString(36).substring(2, 9), []);
    const rawData = Array.isArray(data) && data.length > 1 ? data : [0, 0, 0, 0, 0, 0, 0];
    const hasValues = rawData.some((v) => Number(v) > 0);

    const min = Math.min(...rawData);
    const max = Math.max(...rawData);
    const range = max - min || 1;
    const padding = 3;

    const points = rawData.map((val, idx) => {
        const x = (idx / (rawData.length - 1)) * (width - padding * 2) + padding;
        const y = hasValues
            ? height - ((val - min) / range) * (height - padding * 2) - padding
            : height / 2;
        return { x, y };
    });

    let linePath = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i === 0 ? 0 : i - 1];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2 >= points.length ? points.length - 1 : i + 2];

        const tension = 0.2;
        const cp1x = p1.x + (p2.x - p0.x) * tension;
        const cp1y = p1.y + (p2.y - p0.y) * tension;
        const cp2x = p2.x - (p3.x - p1.x) * tension;
        const cp2y = p2.y - (p3.y - p1.y) * tension;

        linePath += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }

    const areaPath = `${linePath} L ${width - padding} ${height} L ${padding} ${height} Z`;
    const lastPoint = points[points.length - 1];
    const strokeColor = isDark ? "#FFFFFF" : color;
    const areaFillColor = isDark ? "rgba(255, 255, 255, 0.25)" : color;

    return (
        <div style={{ width: `${width}px`, height: `${height}px`, overflow: "visible", display: "inline-block" }}>
            <svg
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                style={{ overflow: "visible" }}
            >
                <defs>
                    <linearGradient id={`live-spark-grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={areaFillColor} stopOpacity={isDark ? 0.35 : (hasValues ? 0.25 : 0.05)} />
                        <stop offset="100%" stopColor={areaFillColor} stopOpacity={0.0} />
                    </linearGradient>
                </defs>
                {showArea && <path d={areaPath} fill={`url(#live-spark-grad-${id})`} />}
                <path
                    d={linePath}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                {showPulsingDot && (
                    <>
                        <circle cx={lastPoint.x} cy={lastPoint.y} r="5" fill={strokeColor} opacity="0.5">
                            <animate attributeName="r" values="3;7;3" dur="2s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.7;0.1;0.7" dur="2s" repeatCount="indefinite" />
                        </circle>
                        <circle
                            cx={lastPoint.x}
                            cy={lastPoint.y}
                            r="2.5"
                            fill={strokeColor}
                            stroke={isDark ? "#166534" : "#FFFFFF"}
                            strokeWidth="1"
                        />
                    </>
                )}
            </svg>
        </div>
    );
};

export default React.memo(LiveSparkline);
