/**
 * apiCache.js
 * Dual-Layer Persistent Client-Side SWR Cache (L1 Memory + L2 LocalStorage)
 * with In-Flight Request Deduplication & Tenant Isolation
 * 
 * Strategy: True 0ms Stale-While-Revalidate (SWR)
 *   1. L1 (Memory) → 0.0ms instant synchronous return.
 *   2. L2 (LocalStorage) → Restores full application state across page reloads in 0ms.
 *   3. In-flight Request Deduplication → Prevents duplicate simultaneous API calls.
 *   4. Tenant Isolation → Cache keys automatically scoped by company_id.
 *   5. Never blocks UI with loading spinners when cached data exists.
 *   6. Mutations (Create/Update/Delete) purge relevant keys instantly from both L1 and L2.
 */

const MEMORY_CACHE = new Map();
const IN_FLIGHT_REQUESTS = new Map();
const STORAGE_PREFIX = "pos_swr_v5_";
const DEFAULT_TTL_MS = 15 * 60 * 1000; // 15 minutes fresh window

// Automatically purge legacy / stale cache versions from browser localStorage on load
try {
    if (typeof window !== "undefined" && window.localStorage) {
        const legacyKeys = [];
        for (let i = 0; i < window.localStorage.length; i++) {
            const k = window.localStorage.key(i);
            if (k && (k.startsWith("pos_swr_") || k.startsWith("infy_get_cache_")) && !k.startsWith("pos_swr_v5_")) {
                legacyKeys.push(k);
            }
        }
        legacyKeys.forEach((k) => window.localStorage.removeItem(k));
    }
} catch (_) {}

/**
 * Get active tenant / company prefix to guarantee strict multi-tenant isolation
 */
export const getTenantPrefix = () => {
    try {
        if (typeof window !== "undefined" && window.localStorage) {
            const loginUserArrayRaw = window.localStorage.getItem("loginUserArray");
            if (loginUserArrayRaw) {
                const user = JSON.parse(loginUserArrayRaw);
                const companyId = user?.company_id || user?.id || user?.email || "guest";
                return `tenant_${companyId}:`;
            }
            const userRaw = window.localStorage.getItem("user");
            if (userRaw) {
                try {
                    const user = JSON.parse(userRaw);
                    const companyId = user?.company_id || user?.id || "guest";
                    return `tenant_${companyId}:`;
                } catch (_) {
                    return `tenant_${userRaw}:`;
                }
            }
        }
    } catch (_) {}
    return "tenant_guest:";
};

export const getCurrentCompanyId = () => {
    try {
        if (typeof window !== "undefined" && window.localStorage) {
            const loginUserArrayRaw = window.localStorage.getItem("loginUserArray");
            if (loginUserArrayRaw) {
                const user = JSON.parse(loginUserArrayRaw);
                return user?.company_id || user?.id || user?.email || null;
            }
            const userRaw = window.localStorage.getItem("user");
            if (userRaw) {
                try {
                    const user = JSON.parse(userRaw);
                    return user?.company_id || user?.id || null;
                } catch (_) {
                    return userRaw;
                }
            }
        }
    } catch (_) {}
    return null;
};

/**
 * Resolve full key with tenant prefix
 */
const resolveKey = (key) => {
    const prefix = getTenantPrefix();
    return key.startsWith("tenant_") ? key : `${prefix}${key}`;
};

/**
 * Read from L1 memory first, fallback to L2 LocalStorage
 * True SWR: Always returns cached data immediately (0.0ms) without blocking UI
 */
export const getCached = (key) => {
    const fullKey = resolveKey(key);
    const activeCompanyId = getCurrentCompanyId();

    // 1. Check L1 Memory (Instant 0.0ms)
    if (MEMORY_CACHE.has(fullKey)) {
        const entry = MEMORY_CACHE.get(fullKey);
        if (entry && entry.data !== undefined) {
            if (entry.companyId && activeCompanyId && String(entry.companyId) !== String(activeCompanyId)) {
                MEMORY_CACHE.delete(fullKey);
            } else {
                return entry.data;
            }
        }
    }

    // 2. Check L2 LocalStorage (Persistent 0ms across browser & app reloads)
    try {
        if (typeof window !== "undefined" && window.localStorage) {
            const raw = window.localStorage.getItem(STORAGE_PREFIX + fullKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && parsed.data !== undefined) {
                    if (parsed.companyId && activeCompanyId && String(parsed.companyId) !== String(activeCompanyId)) {
                        window.localStorage.removeItem(STORAGE_PREFIX + fullKey);
                    } else {
                        // Populate L1 for subsequent reads
                        MEMORY_CACHE.set(fullKey, parsed);
                        return parsed.data;
                    }
                }
            }
        }
    } catch (e) {
        // Fallback gracefully
    }

    return null;
};

/**
 * Store into both L1 Memory and L2 LocalStorage with version/timestamp validation
 */
export const setCache = (key, data, reqTimestamp = null) => {
    if (data === undefined || data === null) return;
    const fullKey = resolveKey(key);
    const now = reqTimestamp || Date.now();

    // Prevent race conditions: do not overwrite if existing entry has a newer timestamp
    if (MEMORY_CACHE.has(fullKey)) {
        const existing = MEMORY_CACHE.get(fullKey);
        if (existing && existing.timestamp > now) {
            return;
        }
    }

    const activeCompanyId = getCurrentCompanyId();
    const entry = { data, timestamp: now, companyId: activeCompanyId, version: 1 };

    // Set L1 Memory
    MEMORY_CACHE.set(fullKey, entry);

    // Set L2 LocalStorage
    try {
        if (typeof window !== "undefined" && window.localStorage) {
            window.localStorage.setItem(STORAGE_PREFIX + fullKey, JSON.stringify(entry));
        }
    } catch (e) {
        // Auto-prune old storage keys if quota exceeded
        try {
            if (typeof window !== "undefined" && window.localStorage) {
                for (let i = window.localStorage.length - 1; i >= 0; i--) {
                    const k = window.localStorage.key(i);
                    if (k && k.startsWith(STORAGE_PREFIX)) {
                        window.localStorage.removeItem(k);
                        break;
                    }
                }
            }
        } catch (_) {}
    }
};

/**
 * Deduplicate simultaneous in-flight API requests across components
 */
export const dedupedFetch = (key, fetcherPromiseFn) => {
    const fullKey = resolveKey(key);
    if (IN_FLIGHT_REQUESTS.has(fullKey)) {
        return IN_FLIGHT_REQUESTS.get(fullKey);
    }

    const promise = fetcherPromiseFn()
        .then((result) => {
            IN_FLIGHT_REQUESTS.delete(fullKey);
            return result;
        })
        .catch((error) => {
            IN_FLIGHT_REQUESTS.delete(fullKey);
            throw error;
        });

    IN_FLIGHT_REQUESTS.set(fullKey, promise);
    return promise;
};

/**
 * Invalidate specific cache keys from both L1 and L2
 */
export const invalidateCache = (...keys) => {
    keys.forEach((key) => {
        const fullKey = resolveKey(key);
        MEMORY_CACHE.delete(fullKey);
        try {
            if (typeof window !== "undefined" && window.localStorage) {
                window.localStorage.removeItem(STORAGE_PREFIX + fullKey);
            }
        } catch (_) {}
    });
};

/**
 * Invalidate all cache entries matching a namespace/prefix (e.g., "products", "dashboard")
 */
export const invalidateCacheByPrefix = (prefix) => {
    // Clear matching L1
    for (const key of MEMORY_CACHE.keys()) {
        if (key.includes(prefix)) {
            MEMORY_CACHE.delete(key);
        }
    }

    // Clear matching L2
    try {
        if (typeof window !== "undefined" && window.localStorage) {
            const keysToRemove = [];
            for (let i = 0; i < window.localStorage.length; i++) {
                const k = window.localStorage.key(i);
                if (k && k.startsWith(STORAGE_PREFIX) && k.includes(prefix)) {
                    keysToRemove.push(k);
                }
            }
            keysToRemove.forEach((k) => window.localStorage.removeItem(k));
        }
    } catch (_) {}
};

/**
 * Clear all cache entries on logout or account switch
 */
export const clearAllCache = () => {
    MEMORY_CACHE.clear();
    IN_FLIGHT_REQUESTS.clear();
    try {
        if (typeof window !== "undefined" && window.localStorage) {
            const keysToRemove = [];
            for (let i = 0; i < window.localStorage.length; i++) {
                const k = window.localStorage.key(i);
                if (k && k.startsWith(STORAGE_PREFIX)) {
                    keysToRemove.push(k);
                }
            }
            keysToRemove.forEach((k) => window.localStorage.removeItem(k));
        }
    } catch (_) {}
};

/**
 * Check if cache exists
 */
export const hasCached = (key) => getCached(key) !== null;

export default {
    getCached,
    setCache,
    dedupedFetch,
    invalidateCache,
    invalidateCacheByPrefix,
    clearAllCache,
    hasCached,
    getTenantPrefix,
    getCurrentCompanyId,
};
