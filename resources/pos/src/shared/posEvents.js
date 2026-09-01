/**
 * posEvents.js
 * High-Performance Centralized Real-Time Event Bus for INFY-POS Enterprise
 * 
 * Features:
 *   - Centralized Real-Time Event Bus
 *   - Cross-Tab / Cross-Window Synchronization via BroadcastChannel
 *   - Event Deduplication (prevents duplicate event loops)
 *   - Comprehensive Multi-Entity Invalidation Map
 *   - Safe Unsubscription on Component Unmount
 */
import { invalidateCacheByPrefix, getCurrentCompanyId } from '../store/apiCache';

export const POS_EVENTS = {
    DATA_CHANGED: 'pos:data_changed',
};

// Track processed event IDs to prevent duplicate processing
const PROCESSED_EVENT_IDS = new Set();
const MAX_PROCESSED_HISTORY = 1000;

// 1. Cross-Tab / Cross-Window Broadcast Synchronization
let broadcastChannel = null;
try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        broadcastChannel = new BroadcastChannel('infypos_realtime_bus');
        broadcastChannel.onmessage = (event) => {
            if (event.data && typeof window !== 'undefined') {
                const eventId = event.data.eventId;
                if (eventId && PROCESSED_EVENT_IDS.has(eventId)) {
                    return; // Already processed in this instance
                }

                // Strict Tenant Isolation Check
                const currentCompanyId = getCurrentCompanyId();
                if (event.data.companyId && currentCompanyId && String(event.data.companyId) !== String(currentCompanyId)) {
                    return; // Ignore foreign company event
                }

                if (eventId) {
                    PROCESSED_EVENT_IDS.add(eventId);
                }

                // Invalidate local caches for the received broadcast
                invalidateForEventType(event.data.type || 'all');

                // Dispatch custom DOM event to notify active React components in this tab
                const domEvent = new CustomEvent(POS_EVENTS.DATA_CHANGED, {
                    detail: {
                        ...event.data,
                        fromBroadcast: true,
                    }
                });
                window.dispatchEvent(domEvent);
            }
        };
    }
} catch (_) {}

/**
 * Invalidate affected cache keys according to Centralized Event -> Invalidation Map
 */
const invalidateForEventType = (type = 'all') => {
    // Always invalidate dashboard metrics on any business mutation
    invalidateCacheByPrefix('dashboard');

    const t = (type || '').toLowerCase();

    if (t.includes('sale') || t.includes('payment') || t.includes('register')) {
        invalidateCacheByPrefix('sales');
        invalidateCacheByPrefix('reports');
        invalidateCacheByPrefix('profit');
        invalidateCacheByPrefix('top_customers');
        invalidateCacheByPrefix('top_selling');
        invalidateCacheByPrefix('inventory');
        invalidateCacheByPrefix('products');
        invalidateCacheByPrefix('today_sale');
        invalidateCacheByPrefix('all_sale');
    } else if (
        t.includes('purchase') ||
        t.includes('inbound') ||
        t.includes('receiving') ||
        t.includes('asn') ||
        t.includes('shipment') ||
        t.includes('grn') ||
        t.includes('putaway') ||
        t.includes('po')
    ) {
        invalidateCacheByPrefix('main_products');
        invalidateCacheByPrefix('products');
        invalidateCacheByPrefix('purchases');
        invalidateCacheByPrefix('inbound');
        invalidateCacheByPrefix('inventory');
        invalidateCacheByPrefix('warehouses');
        invalidateCacheByPrefix('stock');
        invalidateCacheByPrefix('suppliers');
        invalidateCacheByPrefix('reports');
        invalidateCacheByPrefix('today_sale');
        invalidateCacheByPrefix('all_sale');
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.removeItem('infy_inbound_planning_cache');
            }
        } catch (_) {}
    } else if (t.includes('product') || t.includes('adjustment') || t.includes('stock') || t.includes('inventory')) {
        invalidateCacheByPrefix('main_products');
        invalidateCacheByPrefix('products');
        invalidateCacheByPrefix('categories');
        invalidateCacheByPrefix('brands');
        invalidateCacheByPrefix('variations');
        invalidateCacheByPrefix('inventory');
        invalidateCacheByPrefix('stock');
        invalidateCacheByPrefix('adjustments');
    } else if (t.includes('category')) {
        invalidateCacheByPrefix('categories');
        invalidateCacheByPrefix('products');
    } else if (t.includes('brand')) {
        invalidateCacheByPrefix('brands');
        invalidateCacheByPrefix('products');
    } else if (t.includes('unit')) {
        invalidateCacheByPrefix('units');
        invalidateCacheByPrefix('base-units');
        invalidateCacheByPrefix('products');
        invalidateCacheByPrefix('inventory');
    } else if (t.includes('variation')) {
        invalidateCacheByPrefix('variations');
        invalidateCacheByPrefix('products');
    } else if (t.includes('customer')) {
        invalidateCacheByPrefix('customers');
        invalidateCacheByPrefix('sales');
        invalidateCacheByPrefix('reports');
    } else if (t.includes('supplier')) {
        invalidateCacheByPrefix('suppliers');
        invalidateCacheByPrefix('purchases');
        invalidateCacheByPrefix('inbound');
        invalidateCacheByPrefix('reports');
    } else if (t.includes('expense')) {
        invalidateCacheByPrefix('expenses');
        invalidateCacheByPrefix('profit');
        invalidateCacheByPrefix('reports');
    } else if (t.includes('warehouse') || t.includes('transfer')) {
        invalidateCacheByPrefix('warehouses');
        invalidateCacheByPrefix('transfers');
        invalidateCacheByPrefix('inventory');
        invalidateCacheByPrefix('stock');
        invalidateCacheByPrefix('reports');
    } else if (t.includes('quotation')) {
        invalidateCacheByPrefix('quotations');
        invalidateCacheByPrefix('customers');
    } else {
        // Broad clear for unknown/all mutations
        invalidateCacheByPrefix('products');
        invalidateCacheByPrefix('sales');
        invalidateCacheByPrefix('purchases');
        invalidateCacheByPrefix('inbound');
        invalidateCacheByPrefix('inventory');
        invalidateCacheByPrefix('reports');
    }
};

// Storage event listener for cross-tab sync
try {
    if (typeof window !== 'undefined') {
        window.addEventListener('storage', (event) => {
            if (event.key === 'infypos_realtime_event' && event.newValue) {
                try {
                    const data = JSON.parse(event.newValue);
                    if (data && data.eventId && !PROCESSED_EVENT_IDS.has(data.eventId)) {
                        PROCESSED_EVENT_IDS.add(data.eventId);
                        if (PROCESSED_EVENT_IDS.size > MAX_PROCESSED_HISTORY) {
                            const firstKey = PROCESSED_EVENT_IDS.values().next().value;
                            PROCESSED_EVENT_IDS.delete(firstKey);
                        }
                        invalidateForEventType(data.type || 'all');
                        const domEvent = new CustomEvent(POS_EVENTS.DATA_CHANGED, {
                            detail: {
                                ...data,
                                fromBroadcast: true,
                            }
                        });
                        window.dispatchEvent(domEvent);
                    }
                } catch (_) {}
            }
        });
    }
} catch (_) {}

/**
 * Emit a data change event across the application, invalidate caches, and broadcast to other tabs
 */
export const emitPosDataChanged = (details = {}) => {
    const eventId = details.eventId || (Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9));
    const timestamp = details.timestamp || Date.now();
    const type = details.type || 'all';

    // Prevent duplicate processing
    if (PROCESSED_EVENT_IDS.has(eventId)) {
        return;
    }
    PROCESSED_EVENT_IDS.add(eventId);
    if (PROCESSED_EVENT_IDS.size > MAX_PROCESSED_HISTORY) {
        const firstKey = PROCESSED_EVENT_IDS.values().next().value;
        PROCESSED_EVENT_IDS.delete(firstKey);
    }

    const companyId = details.companyId || getCurrentCompanyId();

    const payload = {
        ...details,
        eventId,
        companyId,
        timestamp,
        type,
    };

    // 1. Synchronously invalidate affected caches
    invalidateForEventType(type);

    // 2. Dispatch custom DOM event for active React components in current window
    if (typeof window !== 'undefined') {
        const event = new CustomEvent(POS_EVENTS.DATA_CHANGED, {
            detail: payload
        });
        window.dispatchEvent(event);
    }

    // 3. Broadcast to other open browser tabs/windows via BroadcastChannel
    try {
        if (broadcastChannel && !details.fromBroadcast) {
            broadcastChannel.postMessage(payload);
        }
    } catch (_) {}

    // 4. Broadcast via localStorage storage event
    try {
        if (typeof window !== 'undefined' && window.localStorage && !details.fromBroadcast) {
            window.localStorage.setItem('infypos_realtime_event', JSON.stringify(payload));
        }
    } catch (_) {}
};

/**
 * Subscribe to POS data change events with automatic cleanup
 * @param {Function} callback Function to execute on event
 * @returns {Function} Unsubscribe cleanup function
 */
export const subscribePosDataChanged = (callback) => {
    if (typeof window === 'undefined') return () => {};

    const handler = (event) => {
        if (typeof callback === 'function') {
            callback(event.detail || {});
        }
    };

    window.addEventListener(POS_EVENTS.DATA_CHANGED, handler);
    return () => {
        window.removeEventListener(POS_EVENTS.DATA_CHANGED, handler);
    };
};

export const onPosDataChanged = subscribePosDataChanged;

export default {
    POS_EVENTS,
    emitPosDataChanged,
    subscribePosDataChanged,
    onPosDataChanged,
};
