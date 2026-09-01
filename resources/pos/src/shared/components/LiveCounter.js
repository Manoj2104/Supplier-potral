import React, { useEffect, useState, useRef } from "react";
import { currencySymbolHandling, formatAmount } from "../sharedMethod";

/**
 * LiveCounter Component
 * Smooth requestAnimationFrame counter animation for real-time POS dashboard
 */
const LiveCounter = ({
    value,
    currency = "₹",
    isCurrency = true,
    allConfigData = null,
    isFormatted = true,
    duration = 650,
    className = "",
    style = {},
}) => {
    const numericTarget = typeof value === "number" ? value : parseFloat(value || 0) || 0;
    const [displayNum, setDisplayNum] = useState(numericTarget);
    const prevTargetRef = useRef(numericTarget);
    const animFrameRef = useRef(null);

    useEffect(() => {
        const startVal = prevTargetRef.current;
        const endVal = numericTarget;
        prevTargetRef.current = endVal;

        if (startVal === endVal) {
            setDisplayNum(endVal);
            return;
        }

        const startTime = performance.now();

        const updateAnimation = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic formula
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const currentNum = startVal + (endVal - startVal) * easeProgress;

            setDisplayNum(currentNum);

            if (progress < 1) {
                animFrameRef.current = requestAnimationFrame(updateAnimation);
            } else {
                setDisplayNum(endVal);
            }
        };

        animFrameRef.current = requestAnimationFrame(updateAnimation);

        return () => {
            if (animFrameRef.current) {
                cancelAnimationFrame(animFrameRef.current);
            }
        };
    }, [numericTarget, duration]);

    if (value === null || value === undefined) {
        return null;
    }

    if (!isCurrency) {
        // Plain integer or decimal counter
        const isDecimal = Number.isInteger(numericTarget) === false;
        const formatted = isDecimal ? displayNum.toFixed(2) : Math.round(displayNum).toLocaleString("en-IN");
        return <span className={className} style={style}>{formatted}</span>;
    }

    // Currency formatted counter
    const formattedVal = displayNum.toFixed(2);
    const renderedText = currencySymbolHandling(allConfigData, currency, formattedVal, isFormatted);

    return <span className={className} style={style}>{renderedText}</span>;
};

export default React.memo(LiveCounter);
