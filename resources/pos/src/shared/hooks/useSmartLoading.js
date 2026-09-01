import { useState, useEffect, useRef } from 'react';

/**
 * useSmartLoading.js
 * High-performance hook that eliminates freezing skeleton loaders.
 * 
 * Strategy:
 *   - If data exists in Redux / Cache (even empty array [] for 0 items) -> 0ms instant render.
 *   - If data is truly undefined/null -> shows brief skeleton only if fetch exceeds delayMs.
 *   - As soon as API returns (whether 0 or many items) -> clears skeleton immediately.
 */
const useSmartLoading = (data, delayMs = 300, timeoutMs = 1500) => {
    const isResolved = data !== null && data !== undefined;
    const [showSkeleton, setShowSkeleton] = useState(false);
    const delayTimerRef = useRef(null);
    const timeoutRef = useRef(null);

    useEffect(() => {
        if (isResolved) {
            setShowSkeleton(false);
            if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            return;
        }

        // Only show skeleton if initial fetch is pending and exceeds delayMs
        delayTimerRef.current = setTimeout(() => {
            setShowSkeleton(true);
        }, delayMs);

        timeoutRef.current = setTimeout(() => {
            setShowSkeleton(false);
        }, timeoutMs);

        return () => {
            if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [isResolved, delayMs, timeoutMs]);

    return !isResolved && showSkeleton;
};

export default useSmartLoading;
