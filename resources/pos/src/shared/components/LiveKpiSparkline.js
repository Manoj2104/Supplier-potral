import React, { useEffect, useRef, useState, useMemo } from 'react';

/**
 * LiveKpiSparkline
 * Enterprise-grade real-time SVG sparkline for KPI cards.
 * 
 * Features:
 *  - 100% Real Time-Series Data (Never Math.random(), never fake waves)
 *  - Neutral subtle flat baseline when data is 0 / empty
 *  - Smooth cubic bezier spline interpolation
 *  - requestAnimationFrame live path morphing on data updates (550ms cubic-ease-out)
 *  - One-shot soft pulse on latest endpoint marker upon new data arrival
 *  - Responsive coordinate normalization
 */

const WIDTH = 220;
const HEIGHT = 42;
const PADDING = 6;
const ANIMATION_DURATION = 550; // ms

// Cubic Ease-Out curve for fluid financial graph morphing
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

// Calculate target 2D points from raw numbers array
const calculatePoints = (data) => {
    const raw = Array.isArray(data) && data.length > 0 ? data.map(v => Number(v) || 0) : [0, 0, 0, 0, 0, 0, 0];
    // Ensure at least 7 points for consistent horizontal spacing
    const pointsData = raw.length < 7 ? [...Array(7 - raw.length).fill(0), ...raw] : raw;

    const min = Math.min(...pointsData);
    const max = Math.max(...pointsData);
    const isAllZero = pointsData.every(v => v === 0);

    return pointsData.map((val, idx) => {
        const x = (idx / (pointsData.length - 1)) * WIDTH;
        let y;

        if (isAllZero) {
            // Clean neutral baseline at bottom
            y = HEIGHT - PADDING - 2;
        } else if (max === min) {
            // Flat constant value at vertical center
            y = HEIGHT / 2;
        } else {
            // Scaled smoothly between top and bottom padding
            const normalized = (val - min) / (max - min);
            y = HEIGHT - PADDING - normalized * (HEIGHT - PADDING * 2);
        }

        return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)), val };
    });
};

// Generate smooth cubic bezier SVG path from points
const buildSvgPaths = (points) => {
    if (!points || points.length === 0) {
        return { linePath: `M 0 ${HEIGHT - PADDING} L ${WIDTH} ${HEIGHT - PADDING}`, areaPath: '', lastPoint: { x: WIDTH, y: HEIGHT - PADDING } };
    }

    let linePath = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i === 0 ? 0 : i - 1];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2 >= points.length ? points.length - 1 : i + 2];

        // Smooth tension bezier control points (Catmull-Rom spline)
        const tension = 0.2;
        const cp1x = Number((p1.x + (p2.x - p0.x) * tension).toFixed(1));
        const cp1y = Number((p1.y + (p2.y - p0.y) * tension).toFixed(1));
        const cp2x = Number((p2.x - (p3.x - p1.x) * tension).toFixed(1));
        const cp2y = Number((p2.y - (p3.y - p1.y) * tension).toFixed(1));

        linePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    const lastPoint = points[points.length - 1];
    const areaPath = `${linePath} L ${WIDTH} ${HEIGHT} L 0 ${HEIGHT} Z`;

    return { linePath, areaPath, lastPoint };
};

const LiveKpiSparkline = ({
    data = [0, 0, 0, 0, 0, 0, 0],
    color = '#16A34A',
    isDark = false,
    height = HEIGHT,
    width = '100%',
}) => {
    const targetPoints = useMemo(() => calculatePoints(data), [JSON.stringify(data)]);
    const isAllZero = useMemo(() => {
        const raw = Array.isArray(data) ? data : [];
        return raw.every(v => Number(v) === 0);
    }, [JSON.stringify(data)]);

    const [currentPoints, setCurrentPoints] = useState(targetPoints);
    const [isPulsing, setIsPulsing] = useState(false);

    const prevPointsRef = useRef(targetPoints);
    const animFrameRef = useRef(null);
    const pulseTimerRef = useRef(null);
    const uniqueId = useMemo(() => Math.random().toString(36).substring(2, 9), []);

    useEffect(() => {
        const fromPoints = prevPointsRef.current;
        const toPoints = targetPoints;

        // Check if data actually changed
        const hasChanged = fromPoints.some((p, i) => toPoints[i] && Math.abs(p.y - toPoints[i].y) > 0.5);

        if (!hasChanged) {
            setCurrentPoints(toPoints);
            prevPointsRef.current = toPoints;
            return;
        }

        const startTime = performance.now();

        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
        }

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
            const easedProgress = easeOutCubic(progress);

            const interpolated = toPoints.map((target, idx) => {
                const start = fromPoints[idx] || target;
                const currY = start.y + (target.y - start.y) * easedProgress;
                return {
                    x: target.x,
                    y: Number(currY.toFixed(1)),
                    val: target.val,
                };
            });

            setCurrentPoints(interpolated);

            if (progress < 1) {
                animFrameRef.current = requestAnimationFrame(animate);
            } else {
                prevPointsRef.current = toPoints;
                // Trigger one-shot subtle endpoint pulse
                if (!isAllZero) {
                    setIsPulsing(true);
                    if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
                    pulseTimerRef.current = setTimeout(() => setIsPulsing(false), 500);
                }
            }
        };

        animFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
        };
    }, [targetPoints, isAllZero]);

    const { linePath, areaPath, lastPoint } = useMemo(() => buildSvgPaths(currentPoints), [currentPoints]);

    const strokeColor = isDark ? '#FFFFFF' : color;
    const gradientId = `sparkline-grad-${uniqueId}`;

    return (
        <div style={{ width, height: `${height}px`, position: 'relative', overflow: 'visible' }}>
            <svg
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                preserveAspectRatio="none"
                style={{ width: '100%', height: '100%', overflow: 'visible', display: 'block' }}
            >
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop
                            offset="0%"
                            stopColor={isDark ? '#FFFFFF' : color}
                            stopOpacity={isAllZero ? '0.08' : (isDark ? '0.38' : '0.32')}
                        />
                        <stop
                            offset="100%"
                            stopColor={isDark ? '#FFFFFF' : color}
                            stopOpacity="0"
                        />
                    </linearGradient>
                </defs>

                {/* Gradient Filled Area */}
                {areaPath && (
                    <path
                        d={areaPath}
                        fill={`url(#${gradientId})`}
                        style={{ pointerEvents: 'none' }}
                    />
                )}

                {/* Bold Premium Curved Line / Baseline */}
                <path
                    d={linePath}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={isDark ? '3.5' : '3.2'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeOpacity={isAllZero ? (isDark ? '0.75' : '0.65') : (isDark ? '1' : '0.95')}
                    style={{ transition: 'stroke-opacity 0.3s ease' }}
                />

                {/* Endpoint Marker & Pulse Ring */}
                {lastPoint && (
                    <g transform={`translate(${lastPoint.x}, ${lastPoint.y})`}>
                        {/* One-Shot Pulse Ring */}
                        {isPulsing && (
                            <circle
                                r="10"
                                fill="none"
                                stroke={strokeColor}
                                strokeWidth="2.5"
                                opacity="0.7"
                                style={{
                                    animation: 'sparklinePulseOnce 500ms cubic-bezier(0.1, 0.9, 0.2, 1) forwards',
                                }}
                            />
                        )}

                        {/* Outer Glow Halo */}
                        <circle
                            r="6.5"
                            fill={strokeColor}
                            opacity={isDark ? '0.35' : '0.25'}
                        />

                        {/* Solid Bold Endpoint Dot */}
                        <circle
                            r="4"
                            fill={strokeColor}
                            opacity={isDark ? '1' : '0.95'}
                            stroke={isDark ? '#166534' : '#FFFFFF'}
                            strokeWidth="2"
                        />
                    </g>
                )}
            </svg>

            {/* Injected scoped CSS for one-shot pulse */}
            <style>{`
                @keyframes sparklinePulseOnce {
                    0% {
                        r: 3.5px;
                        opacity: 0.8;
                    }
                    100% {
                        r: 12px;
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    );
};

export default React.memo(LiveKpiSparkline);
