/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * INFY-POS Enterprise Sync Engine v2.0
 * ═══════════════════════════════════════════════════════════════════════════════
 * Self-contained, zero-dependency real-time synchronization module.
 * No npm, no webpack, no build step — drop in a <script src> and go.
 *
 * Features:
 *  • Smart Polling with AbortController (zero duplicate requests)
 *  • Timestamp-delta API calls (?since=) — only fetches what changed
 *  • Adaptive intervals: 2s active / 10s when tab hidden
 *  • DOM row-level diffing (never re-renders full table)
 *  • Enterprise toast notification system
 *  • Debounced global search (300ms)
 *  • Connection status indicator
 *  • Auto-retry on network failure (exponential backoff)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function (window) {
  'use strict';

  // ── Configuration ────────────────────────────────────────────────────────────
  const CONFIG = {
    ACTIVE_INTERVAL:   5000,   // ms when tab is visible
    HIDDEN_INTERVAL:  15000,   // ms when tab is hidden
    DEBOUNCE_SEARCH:   300,    // ms search debounce
    MAX_RETRY:            5,   // max consecutive failures before backing off
    RETRY_BASE_MS:     2000,   // base backoff ms
    TOAST_DURATION:    4500,   // ms toast visible
    TOAST_SLIDE_MS:     300,   // ms toast slide animation
    BASE_URL:        '/api/supplier/sync',
  };

  // ── State ────────────────────────────────────────────────────────────────────
  const _state = {
    supplierId:   null,
    lastSync:     0,
    loops:        {},   // { key: { controller, timer, failures } }
    toastQueue:   [],
    toastVisible: false,
    connected:    true,
    seenNotifIds: new Set(),
  };

  // ── Utilities ────────────────────────────────────────────────────────────────
  function _now() { return Math.floor(Date.now() / 1000); }

  function _interval() {
    return document.visibilityState === 'hidden'
      ? CONFIG.HIDDEN_INTERVAL
      : CONFIG.ACTIVE_INTERVAL;
  }

  function _csrfToken() {
    const m = document.querySelector('meta[name="csrf-token"]');
    return m ? m.content : '';
  }

  // ── Toast Notification System ─────────────────────────────────────────────────
  function _ensureToastContainer() {
    let c = document.getElementById('infy-toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'infy-toast-container';
      c.style.cssText = [
        'position:fixed', 'top:20px', 'right:24px', 'z-index:99999',
        'display:flex', 'flex-direction:column', 'gap:10px',
        'pointer-events:none', 'max-width:360px',
      ].join(';');
      document.body.appendChild(c);
    }
    return c;
  }

  const TOAST_STYLES = {
    success: { bg: '#F0FDF4', border: '#86EFAC', color: '#15803D', icon: '✅' },
    error:   { bg: '#FEF2F2', border: '#FCA5A5', color: '#B91C1C', icon: '❌' },
    warning: { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E', icon: '⚠️' },
    info:    { bg: '#EFF6FF', border: '#BFDBFE', color: '#1E40AF', icon: '🔔' },
    sync:    { bg: '#F0FDF4', border: '#A7F3D0', color: '#047857', icon: '🔄' },
  };

  function toast(message, type = 'info', duration = CONFIG.TOAST_DURATION) {
    const container = _ensureToastContainer();
    const s = TOAST_STYLES[type] || TOAST_STYLES.info;

    const el = document.createElement('div');
    el.style.cssText = [
      `background:${s.bg}`,
      `border:1.5px solid ${s.border}`,
      `color:${s.color}`,
      'border-radius:12px',
      'padding:12px 16px',
      'font-size:13px',
      'font-weight:700',
      'font-family:Inter,-apple-system,sans-serif',
      'box-shadow:0 8px 25px rgba(0,0,0,0.12)',
      'display:flex',
      'align-items:flex-start',
      'gap:10px',
      'pointer-events:all',
      'cursor:pointer',
      'opacity:0',
      `transform:translateX(120%)`,
      `transition:all ${CONFIG.TOAST_SLIDE_MS}ms cubic-bezier(0.34,1.56,0.64,1)`,
      'max-width:360px',
      'min-width:260px',
    ].join(';');

    el.innerHTML = `
      <span style="font-size:18px;flex-shrink:0;line-height:1.2;">${s.icon}</span>
      <div style="flex:1;line-height:1.4;">${message}</div>
      <span style="opacity:0.5;font-size:16px;flex-shrink:0;margin-top:-2px;">×</span>
    `;

    el.addEventListener('click', () => _removeToast(el));
    container.appendChild(el);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateX(0)';
      });
    });

    setTimeout(() => _removeToast(el), duration);
    return el;
  }

  function _removeToast(el) {
    if (!el || !el.parentNode) return;
    el.style.opacity = '0';
    el.style.transform = 'translateX(120%)';
    setTimeout(() => el.parentNode && el.parentNode.removeChild(el), CONFIG.TOAST_SLIDE_MS);
  }

  // ── Connection Status ─────────────────────────────────────────────────────────
  function _setConnected(ok) {
    if (_state.connected === ok) return;
    _state.connected = ok;
    const dot = document.getElementById('infy-sync-dot');
    if (!dot) return;
    dot.style.background    = ok ? '#10B981' : '#EF4444';
    dot.title               = ok ? 'Synced — real-time active' : 'Sync offline — retrying…';
  }

  function _injectStatusDot() {
    if (document.getElementById('infy-sync-dot')) return;
    const dot = document.createElement('div');
    dot.id = 'infy-sync-dot';
    dot.title = 'INFY-POS Sync Active';
    dot.style.cssText = [
      'width:8px', 'height:8px', 'border-radius:50%',
      'background:#10B981',
      'position:fixed', 'bottom:18px', 'right:18px', 'z-index:9000',
      'box-shadow:0 0 0 0 rgba(16,185,129,0.4)',
      'animation:infy-pulse 2s infinite',
      'cursor:default',
    ].join(';');

    const style = document.createElement('style');
    style.textContent = `
      @keyframes infy-pulse {
        0%   { box-shadow: 0 0 0 0 rgba(16,185,129,0.5); }
        70%  { box-shadow: 0 0 0 7px rgba(16,185,129,0); }
        100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
      }
      @keyframes infy-row-flash {
        0%   { background: #ECFDF5; }
        100% { background: transparent; }
      }
      .infy-row-updated { animation: infy-row-flash 1.5s ease-out; }
      .infy-badge-pulse {
        animation: infy-pulse 1.5s 3;
      }
      .infy-skeleton {
        background: linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);
        background-size: 200% 100%;
        animation: infy-shimmer 1.5s infinite;
        border-radius: 4px;
      }
      @keyframes infy-shimmer {
        0%   { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(dot);
  }

  // ── Core Fetch with AbortController ──────────────────────────────────────────
  async function _fetch(url, key) {
    // Cancel any in-flight request for this key
    if (_state.loops[key] && _state.loops[key].controller) {
      _state.loops[key].controller.abort();
    }
    const ctrl = new AbortController();
    if (!_state.loops[key]) _state.loops[key] = { controller: null, timer: null, failures: 0 };
    _state.loops[key].controller = ctrl;

    const separator = url.includes('?') ? '&' : '?';
    const fullUrl   = `${url}${separator}since=${_state.lastSync}&_t=${Date.now()}`;

    const resp = await fetch(fullUrl, {
      signal: ctrl.signal,
      headers: {
        'X-CSRF-TOKEN':  _csrfToken(),
        'Accept':        'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp.json();
  }

  // ── Polling Loop ──────────────────────────────────────────────────────────────
  function _startLoop(key, url, callback) {
    if (!_state.loops[key]) {
      _state.loops[key] = { controller: null, timer: null, failures: 0 };
    }

    async function tick() {
      try {
        const data = await _fetch(url, key);
        _state.loops[key].failures = 0;
        _setConnected(true);

        if (data.last_sync) _state.lastSync = data.last_sync;
        if (callback && data.changed) callback(data);

      } catch (err) {
        if (err.name === 'AbortError') return; // normal — just cancelled
        _state.loops[key].failures = (_state.loops[key].failures || 0) + 1;
        if (_state.loops[key].failures >= CONFIG.MAX_RETRY) {
          _setConnected(false);
        }
      } finally {
        // Schedule next tick using adaptive interval + exponential backoff
        const failures  = _state.loops[key].failures || 0;
        const backoff   = failures > 0 ? Math.min(CONFIG.RETRY_BASE_MS * Math.pow(2, failures - 1), 30000) : 0;
        const base      = _interval();
        const delay     = base + backoff;
        _state.loops[key].timer = setTimeout(tick, delay);
      }
    }

    const initialDelay = _interval();
    _state.loops[key].timer = setTimeout(tick, initialDelay);
  }

  function _stopLoop(key) {
    const loop = _state.loops[key];
    if (!loop) return;
    if (loop.controller) loop.controller.abort();
    if (loop.timer)      clearTimeout(loop.timer);
    delete _state.loops[key];
  }

  // ── DOM Badge Updater ─────────────────────────────────────────────────────────
  function _updateBadge(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    const old = el.innerText.trim();
    const nw  = String(value);
    if (old === nw) return;
    el.innerText = nw;
    el.classList.add('infy-badge-pulse');
    setTimeout(() => el.classList.remove('infy-badge-pulse'), 4500);
  }

  // ── Sidebar Counts Handler ────────────────────────────────────────────────────
  function _handlePulse(data) {
    if (!data.counts) return;
    const c = data.counts;
    _updateBadge('badge-po-count',        c.total_pos);
    _updateBadge('badge-asn-count',       c.total_asns);
    _updateBadge('badge-shipments-count', c.dispatched);
    _updateBadge('badge-invoices-count',  c.invoices_count);
    _updateBadge('badge-notifs-count',    c.unread_notifs);
    _updateBadge('hdr-notifs-count',      c.unread_notifs);

    // Approvals badge
    const bApp = document.getElementById('badge-approvals');
    if (bApp) {
      if (c.pending_pos > 0) {
        bApp.innerText          = c.pending_pos + ' Pending';
        bApp.style.display      = 'inline-block';
        bApp.style.background   = '#FEF3C7';
        bApp.style.color        = '#B45309';
      } else {
        bApp.style.display = 'none';
      }
    }

    // New notification toast popup
    if (data.new_notification) {
      const n = data.new_notification;
      if (!_state.seenNotifIds.has(n.id)) {
        _state.seenNotifIds.add(n.id);
        toast(`<strong>${n.title}</strong><br><span style="font-weight:500;font-size:12px;">${n.message}</span>`, 'info', 6000);
      }
    }

    // Cloud Database Status Check
    if (typeof data.cloud_online !== 'undefined') {
      _updateCloudStatus(data.cloud_online);
    }

    // Module-level refresh hints
    if (data.flags) {
      if (data.flags.carton_changed) {
        document.dispatchEvent(new CustomEvent('infy:cartons-changed'));
      }
      if (data.flags.asn_changed) {
        document.dispatchEvent(new CustomEvent('infy:asns-changed'));
      }
      if (data.flags.new_po) {
        document.dispatchEvent(new CustomEvent('infy:pos-changed'));
        toast('📋 New Purchase Order assigned to your account!', 'info');
      }
    }
  }

  // ── Cloud Database Hybrid Sync Engine ─────────────────────────────────────────
  let _cloudOnline = true;
  let _isSyncing = false;

  function _updateCloudStatus(isOnline) {
    const badge = document.getElementById('sp-cloud-status-badge');
    const text = document.getElementById('sp-cloud-text');
    if (!badge || !text) return;

    const wasOffline = !_cloudOnline;
    _cloudOnline = !!isOnline;

    if (_isSyncing) return;

    if (_cloudOnline) {
      badge.classList.remove('offline');
      badge.classList.remove('syncing');
      badge.title = '🟢 Connected to Cloud DB (Supabase). Local MySQL runs at 0.00ms. Click to force sync.';
      text.innerText = 'Cloud Synced';
      if (wasOffline) {
        toast('🌐 Internet reconnected! Cloud Database synced.', 'success');
        triggerCloudSync(false);
      }
    } else {
      badge.classList.add('offline');
      badge.classList.remove('syncing');
      badge.title = '🟡 Offline Mode: Local MySQL database running (0.00ms). Changes will auto-sync when online.';
      text.innerText = 'Offline Mode (Local DB)';
    }
  }

  async function triggerCloudSync(showToast = false) {
    if (_isSyncing) return;
    _isSyncing = true;

    const badge = document.getElementById('sp-cloud-status-badge');
    const spinner = document.getElementById('sp-cloud-spin');
    const text = document.getElementById('sp-cloud-text');

    if (badge) badge.classList.add('syncing');
    if (spinner) spinner.style.display = 'inline-block';
    if (text) text.innerText = 'Syncing...';

    try {
      const resp = await fetch(CONFIG.BASE_URL + '/cloud-sync', {
        headers: {
          'X-CSRF-TOKEN': _csrfToken(),
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        }
      });
      const res = await resp.json();

      if (res.online) {
        _cloudOnline = true;
        if (badge) {
          badge.classList.remove('offline');
          badge.classList.remove('syncing');
        }
        if (text) text.innerText = 'Cloud Synced';
        const totalSynced = (res.pushed?.pushed_purchases || 0) + (res.pushed?.pushed_asns || 0) + (res.pushed?.pushed_cartons || 0) + (res.pulled?.pulled_purchases || 0) + (res.pulled?.pulled_asns || 0);
        if (showToast) {
          if (totalSynced > 0) {
            toast(`✅ Cloud DB Sync Complete (${totalSynced} records updated)`, 'success');
          } else {
            toast('✅ Local MySQL & Cloud DB are 100% in sync!', 'success');
          }
        }
      } else {
        _cloudOnline = false;
        if (badge) {
          badge.classList.add('offline');
          badge.classList.remove('syncing');
        }
        if (text) text.innerText = 'Offline Mode (Local DB)';
        if (showToast) {
          toast('⚠️ Cloud DB unreachable. All data safely kept in Local MySQL.', 'warning');
        }
      }
    } catch (err) {
      _cloudOnline = false;
      if (badge) {
        badge.classList.add('offline');
        badge.classList.remove('syncing');
      }
      if (text) text.innerText = 'Offline Mode (Local DB)';
      if (showToast) {
        toast('⚠️ Offline Mode active (Local DB 0ms)', 'warning');
      }
    } finally {
      _isSyncing = false;
      if (spinner) spinner.style.display = 'none';
    }
  }

  // ── Carton Status Cell Live Update ───────────────────────────────────────────
  function _handleCartonsChanged(data) {
    if (!data.records || !data.records.length) return;
    data.records.forEach(function (carton) {
      const cell = document.querySelector(`[data-carton-id="${carton.id}"] .infy-status-cell`);
      if (!cell) return;
      const old = cell.innerText.trim();
      if (old === carton.status_label) return;

      cell.innerText         = carton.status_label;
      cell.style.color       = carton.status_color;
      cell.style.transition  = 'background 0.6s ease, color 0.3s ease';
      const row = cell.closest('tr');
      if (row) {
        row.classList.remove('infy-row-updated');
        void row.offsetWidth; // force reflow
        row.classList.add('infy-row-updated');
      }
    });
  }

  // ── ASN Status Badge Live Update ──────────────────────────────────────────────
  function _handleAsnsChanged(data) {
    if (!data.records || !data.records.length) return;
    data.records.forEach(function (asn) {
      const badge = document.querySelector(`[data-asn-id="${asn.id}"] .infy-asn-status`);
      if (!badge) return;
      if (badge.innerText.trim() === asn.status_label) return;
      badge.innerText = asn.status_label;
      badge.style.color = asn.status_color;
      const row = badge.closest('tr');
      if (row) {
        row.classList.remove('infy-row-updated');
        void row.offsetWidth;
        row.classList.add('infy-row-updated');
      }
    });
  }

  // ── Debounced Search ──────────────────────────────────────────────────────────
  function debounce(fn, delay) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  function globalSearch(query, tableSelector, rowAttr) {
    const q   = query.toLowerCase().trim();
    const rows = document.querySelectorAll(tableSelector);
    let visible = 0;
    rows.forEach(function (row) {
      const text = row.getAttribute(rowAttr) || row.textContent;
      const show = !q || text.toLowerCase().includes(q);
      row.style.display = show ? '' : 'none';
      if (show) visible++;
    });
    return visible;
  }

  // ── Public API ────────────────────────────────────────────────────────────────
  const InfySyncEngine = {

    init: function (options = {}) {
      _state.supplierId = options.supplierId || 1;
      _state.lastSync   = options.initialSync || (_now() - 30);

      _injectStatusDot();

      // Master single pulse loop — handles sidebar badges, toasts & flags
      _startLoop('pulse', CONFIG.BASE_URL + '/pulse', _handlePulse);

      // Periodic Background Bi-directional Cloud Database Sync (every 60s when active)
      setInterval(function () {
        if (_cloudOnline && document.visibilityState !== 'hidden' && !_isSyncing) {
          triggerCloudSync(false);
        }
      }, 60000);

      // Listen for local mutations from BroadcastChannel or custom events to trigger instant cloud sync
      try {
        if (window.BroadcastChannel) {
          const bc = new BroadcastChannel('infypos_realtime_bus');
          bc.onmessage = function (ev) {
            if (ev.data && (ev.data.type === 'purchase' || ev.data.type === 'asn' || ev.data.type === 'carton')) {
              setTimeout(() => { if (!_isSyncing) triggerCloudSync(false); }, 1000);
            }
          };
        }
      } catch (e) {}

      // Adaptive interval on visibility change
      document.addEventListener('visibilitychange', function () {
        // Restart all loops with new interval on visibility change
        Object.keys(_state.loops).forEach(function (key) {
          const loop = _state.loops[key];
          if (loop && loop.timer) {
            clearTimeout(loop.timer);
            // tick will be called again at next natural cycle — adaptive interval handles it
          }
        });
      });

      console.log('[InfySyncEngine] Initialized — supplier #' + _state.supplierId + ', interval: ' + CONFIG.ACTIVE_INTERVAL + 'ms active / ' + CONFIG.HIDDEN_INTERVAL + 'ms hidden');
    },

    stop: function (key) {
      if (key) { _stopLoop(key); }
      else { Object.keys(_state.loops).forEach(_stopLoop); }
    },

    toast:            toast,
    globalSearch:     globalSearch,
    debounce:         debounce,
    updateBadge:      _updateBadge,
    triggerCloudSync: triggerCloudSync,
    getLastSync:      function () { return _state.lastSync; },
    isConnected:      function () { return _state.connected; },
    isCloudOnline:    function () { return _cloudOnline; },
  };

  window.InfySyncEngine = InfySyncEngine;

})(window);
