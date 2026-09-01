@extends('supplier.layout')
@section('title', 'Notifications & Activity Feed — INFY-POS Supplier Portal')

@section('head')
<style>
/* ══════════════════════════════════════════════════════════════════════
   NOTIFICATIONS HUB — PREMIUM ENTERPRISE LUXURY DESIGN SYSTEM
   ══════════════════════════════════════════════════════════════════════ */

:root {
  --sp-bg-main: #F8FAFC;
  --sp-card-bg: #FFFFFF;
  --sp-border: #EEF2F7;
  --sp-primary: #15803D;
  --sp-primary-hover: #166534;
  --sp-text-dark: #0F172A;
  --sp-text-muted: #64748B;
  --sp-text-light: #94A3B8;
  --sp-radius-lg: 20px;
  --sp-radius-md: 18px;
  --sp-radius-sm: 10px;
  --sp-shadow: 0 4px 20px rgba(15, 23, 42, 0.03);
}

.sp-page-container {
  padding: 4px 8px 30px 8px;
  background: transparent;
  font-family: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif;
}

/* Breadcrumb */
.sp-page-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--sp-text-muted);
  font-weight: 500;
  margin-bottom: 12px;
}

.sp-crumb-active {
  color: var(--sp-primary);
  font-weight: 700;
}

/* Page Header Row */
.sp-page-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
}

.sp-title-group h1 {
  font-size: 26px;
  font-weight: 800;
  color: var(--sp-text-dark);
  margin: 0 0 4px 0;
  letter-spacing: -0.01em;
  line-height: 1.2;
}

.sp-title-group p {
  font-size: 13.5px;
  color: var(--sp-text-muted);
  margin: 0;
}

.sp-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* Pill Buttons */
.sp-btn-pill {
  height: 40px;
  padding: 0 18px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 180ms ease;
  border: 1px solid #CBD5E1;
  background: #FFFFFF;
  color: var(--sp-text-dark);
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.02);
  text-decoration: none;
  white-space: nowrap;
}

.sp-btn-pill:hover {
  background: #F1F5F9;
  border-color: #94A3B8;
  transform: translateY(-1px);
  color: var(--sp-text-dark);
}

.sp-btn-pill.sp-btn-primary {
  background: var(--sp-primary);
  color: #FFFFFF;
  border-color: var(--sp-primary);
  box-shadow: 0 4px 12px rgba(21, 128, 61, 0.2);
}

.sp-btn-pill.sp-btn-primary:hover {
  background: var(--sp-primary-hover);
  border-color: var(--sp-primary-hover);
  color: #FFFFFF;
}

/* 4 Luxury KPI Stat Cards */
.sp-kpi-grid {
  display: grid !important;
  grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
  gap: 16px !important;
  margin-bottom: 22px;
}

@media (max-width: 1024px) {
  .sp-kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }
}

@media (max-width: 640px) {
  .sp-kpi-grid {
    grid-template-columns: 1fr !important;
  }
}

.sp-kpi-card {
  background: #FFFFFF;
  border: 1px solid #EEF2F7;
  border-radius: 18px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 122px;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.02);
  transition: all 180ms ease;
  text-decoration: none;
  color: inherit;
}

.sp-kpi-card:hover {
  transform: translateY(-2px);
  border-color: #CBD5E1;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
}

.sp-kpi-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.sp-kpi-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--sp-text-muted);
}

.sp-kpi-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  flex-shrink: 0;
}

.sp-kpi-icon-amber { background: #FEF3C7; color: #D97706; }
.sp-kpi-icon-blue { background: #EFF6FF; color: #2563EB; }
.sp-kpi-icon-green { background: #DCFCE7; color: #15803D; }
.sp-kpi-icon-purple { background: #F3E8FF; color: #9333EA; }

.sp-kpi-bottom {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.sp-kpi-value {
  font-size: 30px;
  font-weight: 800;
  color: var(--sp-text-dark);
  line-height: 1.1;
}

.sp-kpi-trend-box {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sp-kpi-pill-badge {
  font-size: 11.5px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
  white-space: nowrap;
}

.sp-pill-amber { background: #FEF3C7; color: #D97706; }
.sp-pill-blue { background: #EFF6FF; color: #2563EB; }
.sp-pill-green { background: #DCFCE7; color: #15803D; }
.sp-pill-purple { background: #F3E8FF; color: #9333EA; }

.sp-kpi-sparkline {
  width: 70px;
  height: 22px;
}

/* Filter Tabs Strip */
.sp-tabs-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.sp-tab-pill {
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  color: var(--sp-text-muted);
  background: #FFFFFF;
  border: 1px solid #CBD5E1;
  text-decoration: none;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 150ms ease;
}

.sp-tab-pill:hover {
  background: #F1F5F9;
  color: var(--sp-text-dark);
}

.sp-tab-pill.active {
  background: #DCFCE7;
  color: #15803D;
  border-color: #86EFAC;
}

.sp-tab-count {
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 999px;
  background: rgba(0,0,0,0.06);
  font-weight: 800;
}

.sp-tab-pill.active .sp-tab-count {
  background: #15803D;
  color: #FFFFFF;
}

/* Card Container for List & Filters */
.sp-card-lux {
  background: #FFFFFF;
  border: 1px solid var(--sp-border);
  border-radius: 20px;
  box-shadow: var(--sp-shadow);
  padding: 22px 24px;
  margin-bottom: 24px;
}

/* Search and Filters Bar */
.sp-filters-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.sp-search-wrap {
  flex: 1;
  min-width: 260px;
  position: relative;
}

.sp-search-input {
  width: 100%;
  height: 42px;
  background: #F8FAFC;
  border: 1px solid var(--sp-border);
  border-radius: 10px;
  padding: 0 16px 0 40px;
  font-size: 13.5px;
  color: var(--sp-text-dark);
  outline: none;
  transition: all 150ms ease;
}

.sp-search-input:focus {
  border-color: #16A34A;
  background: #FFFFFF;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.08);
}

.sp-search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--sp-text-light);
  font-size: 15px;
}

.sp-filter-dropdowns {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.sp-filter-select {
  height: 42px;
  background: #F8FAFC;
  border: 1px solid var(--sp-border);
  border-radius: 10px;
  padding: 0 14px;
  font-size: 13px;
  font-weight: 600;
  color: var(--sp-text-dark);
  outline: none;
  cursor: pointer;
  transition: all 150ms ease;
}

.sp-filter-select:focus {
  border-color: #16A34A;
  background: #FFFFFF;
}

/* Luxury Notification Activity List */
.sp-notif-feed {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sp-feed-item {
  background: #FFFFFF;
  border: 1px solid #EEF2F7;
  border-radius: 14px;
  padding: 16px 18px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  transition: all 150ms ease;
  position: relative;
}

.sp-feed-item:hover {
  background: #F8FAFC;
  border-color: #CBD5E1;
  transform: translateX(2px);
}

.sp-feed-item.unread {
  background: #F0FDF4;
  border-color: #BBF7D0;
}

.sp-feed-item.unread:hover {
  background: #DCFCE7;
}

.sp-feed-left {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  flex: 1;
}

.sp-feed-icon-box {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.sp-feed-icon-blue { background: #EFF6FF; color: #2563EB; }
.sp-feed-icon-green { background: #DCFCE7; color: #15803D; }
.sp-feed-icon-amber { background: #FEF3C7; color: #D97706; }
.sp-feed-icon-purple { background: #F3E8FF; color: #9333EA; }

.sp-feed-content {
  flex: 1;
}

.sp-feed-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.sp-feed-title {
  font-size: 14px;
  font-weight: 800;
  color: var(--sp-text-dark);
}

.sp-feed-category-badge {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  padding: 2px 7px;
  border-radius: 999px;
}

.sp-cat-shipment { background: #EFF6FF; color: #2563EB; border: 1px solid #BFDBFE; }
.sp-cat-payment { background: #DCFCE7; color: #15803D; border: 1px solid #86EFAC; }
.sp-cat-order { background: #FEF3C7; color: #D97706; border: 1px solid #FDE68A; }
.sp-cat-system { background: #F3E8FF; color: #9333EA; border: 1px solid #E9D5FF; }

.sp-feed-msg {
  font-size: 13px;
  color: #334155;
  margin: 0 0 6px 0;
  line-height: 1.45;
}

.sp-feed-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 11.5px;
  color: #64748B;
  font-weight: 600;
}

.sp-feed-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.sp-unread-glow-dot {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 800;
  color: #15803D;
  background: #DCFCE7;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid #86EFAC;
}

.sp-unread-glow-dot::before {
  content: '';
  width: 6px;
  height: 6px;
  background: #15803D;
  border-radius: 50%;
  display: inline-block;
}
</style>
@endsection

@section('content')
<div class="sp-page-container">

  <!-- ── 1. Breadcrumb ── -->
  <div class="sp-page-breadcrumb">
    <a href="{{ route('supplier.dashboard') }}" style="color:inherit; text-decoration:none;">Dashboard</a>
    <i class="bi bi-chevron-right" style="font-size:10px;"></i>
    <span class="sp-crumb-active">Notifications</span>
  </div>

  <!-- ── 2. Page Header Row ── -->
  <div class="sp-page-header-row">
    <div class="sp-title-group">
      <h1>Notifications &amp; Activity Feed</h1>
      <p>Real-time alerts for purchase orders, dispatch status, gate receipts, and payment settlements.</p>
    </div>

    <div class="sp-header-actions">
      @if($unreadCount > 0)
      <button type="button" class="sp-btn-pill sp-btn-primary" onclick="markAllNotificationsAsRead()">
        <i class="bi bi-check2-all"></i> Mark All as Read ({{ $unreadCount }})
      </button>
      @endif
      <button type="button" class="sp-btn-pill" onclick="exportNotificationsCsv()">
        <i class="bi bi-download"></i> Export Logs
      </button>
      <button type="button" class="sp-btn-pill" onclick="location.reload()">
        <i class="bi bi-arrow-clockwise"></i> Refresh
      </button>
    </div>
  </div>

  <!-- ── 3. 4 Modern KPI Stat Cards ── -->
  <div class="sp-kpi-grid">
    
    <!-- Card 1: Unread Alerts -->
    <div class="sp-kpi-card">
      <div class="sp-kpi-card-top">
        <span class="sp-kpi-title">Unread Alerts</span>
        <div class="sp-kpi-icon-box sp-kpi-icon-amber">
          <i class="bi bi-bell-fill"></i>
        </div>
      </div>
      <div class="sp-kpi-bottom">
        <div class="sp-kpi-value">{{ $unreadCount }}</div>
        <div class="sp-kpi-trend-box">
          <span class="sp-kpi-pill-badge sp-pill-amber">Awaiting Review</span>
          <svg class="sp-kpi-sparkline" viewBox="0 0 70 22" fill="none">
            <path d="M2 16C12 8 24 14 36 6C48 12 58 6 68 10" stroke="#D97706" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- Card 2: Shipments & Dispatches -->
    <div class="sp-kpi-card">
      <div class="sp-kpi-card-top">
        <span class="sp-kpi-title">Shipments &amp; ASNs</span>
        <div class="sp-kpi-icon-box sp-kpi-icon-blue">
          <i class="bi bi-truck"></i>
        </div>
      </div>
      <div class="sp-kpi-bottom">
        <div class="sp-kpi-value">{{ $kpis['shipment'] ?? 15 }}</div>
        <div class="sp-kpi-trend-box">
          <span class="sp-kpi-pill-badge sp-pill-blue">Inward Updates</span>
          <svg class="sp-kpi-sparkline" viewBox="0 0 70 22" fill="none">
            <path d="M2 18C12 10 24 16 36 8C48 4 58 12 68 4" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- Card 3: Payments & Invoices -->
    <div class="sp-kpi-card">
      <div class="sp-kpi-card-top">
        <span class="sp-kpi-title">Payments &amp; Credits</span>
        <div class="sp-kpi-icon-box sp-kpi-icon-green">
          <i class="bi bi-currency-rupee"></i>
        </div>
      </div>
      <div class="sp-kpi-bottom">
        <div class="sp-kpi-value">{{ $kpis['payment'] ?? 12 }}</div>
        <div class="sp-kpi-trend-box">
          <span class="sp-kpi-pill-badge sp-pill-green">Settled Amount</span>
          <svg class="sp-kpi-sparkline" viewBox="0 0 70 22" fill="none">
            <path d="M2 16C12 10 24 14 36 8C48 4 58 6 68 2" stroke="#15803D" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- Card 4: Orders & Approvals -->
    <div class="sp-kpi-card">
      <div class="sp-kpi-card-top">
        <span class="sp-kpi-title">PO Orders &amp; RFQs</span>
        <div class="sp-kpi-icon-box sp-kpi-icon-purple">
          <i class="bi bi-bag-check-fill"></i>
        </div>
      </div>
      <div class="sp-kpi-bottom">
        <div class="sp-kpi-value">{{ $kpis['po'] ?? 8 }}</div>
        <div class="sp-kpi-trend-box">
          <span class="sp-kpi-pill-badge sp-pill-purple">Procurement</span>
          <svg class="sp-kpi-sparkline" viewBox="0 0 70 22" fill="none">
            <path d="M2 18C14 12 26 16 38 6C50 2 60 10 68 3" stroke="#9333EA" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>
      </div>
    </div>

  </div>

  <!-- ── 4. Pill Tabs Strip ── -->
  <div class="sp-tabs-strip">
    <button type="button" class="sp-tab-pill active" onclick="filterNotifsByTab('all', this)">
      All Notifications <span class="sp-tab-count">{{ $kpis['total'] ?? count($notifications) }}</span>
    </button>
    <button type="button" class="sp-tab-pill" onclick="filterNotifsByTab('unread', this)">
      Unread Only <span class="sp-tab-count">{{ $unreadCount }}</span>
    </button>
    <button type="button" class="sp-tab-pill" onclick="filterNotifsByTab('shipment', this)">
      Shipments &amp; ASNs <span class="sp-tab-count">{{ $kpis['shipment'] ?? 15 }}</span>
    </button>
    <button type="button" class="sp-tab-pill" onclick="filterNotifsByTab('payment', this)">
      Payments <span class="sp-tab-count">{{ $kpis['payment'] ?? 12 }}</span>
    </button>
    <button type="button" class="sp-tab-pill" onclick="filterNotifsByTab('po', this)">
      Purchase Orders <span class="sp-tab-count">{{ $kpis['po'] ?? 8 }}</span>
    </button>
  </div>

  <!-- ── 5. Main Card Container (Filters & Luxury Feed) ── -->
  <div class="sp-card-lux">
    
    <!-- Filter & Search Bar -->
    <div class="sp-filters-bar">
      <div class="sp-search-wrap">
        <i class="bi bi-search sp-search-icon"></i>
        <input type="text" id="notifSearchInput" class="sp-search-input" placeholder="Search notification title, PO#, ASN#, payment amount..." oninput="filterNotifsList()">
      </div>

      <div class="sp-filter-dropdowns">
        <select id="filterNotifCat" class="sp-filter-select" onchange="filterNotifsList()">
          <option value="">Category: All</option>
          <option value="shipment">Shipments & Dispatches</option>
          <option value="payment">Payments & Banking</option>
          <option value="po">Purchase Orders</option>
        </select>

        <select id="filterNotifRead" class="sp-filter-select" onchange="filterNotifsList()">
          <option value="">Status: All</option>
          <option value="unread">Unread Only</option>
          <option value="read">Read Only</option>
        </select>

        <button type="button" class="sp-btn-pill" style="height:42px; padding:0 16px; border-radius:10px;" onclick="resetNotifFilters()">
          Reset
        </button>
      </div>
    </div>

    <!-- Feed Items -->
    <div class="sp-notif-feed" id="notifsFeedContainer">
      @forelse($notifications as $notif)
      @php
        $title = $notif->title;
        $msg = $notif->message;
        $isUnread = !$notif->is_read;
        $cat = 'system';
        $iconClass = 'sp-feed-icon-purple';
        $iconHtml = '<i class="bi bi-bell-fill"></i>';
        $catBadge = 'SYSTEM';
        $catBadgeClass = 'sp-cat-system';
        $targetUrl = route('supplier.dashboard');

        if (stripos($title, 'Shipment') !== false || stripos($title, 'ASN') !== false || stripos($msg, 'ASN') !== false) {
          $cat = 'shipment';
          $iconClass = 'sp-feed-icon-blue';
          $iconHtml = '<i class="bi bi-truck"></i>';
          $catBadge = 'SHIPMENT';
          $catBadgeClass = 'sp-cat-shipment';
          $targetUrl = route('supplier.shipments');
        } elseif (stripos($title, 'Payment') !== false || stripos($msg, 'Payment') !== false || stripos($title, 'Invoice') !== false) {
          $cat = 'payment';
          $iconClass = 'sp-feed-icon-green';
          $iconHtml = '<i class="bi bi-currency-rupee"></i>';
          $catBadge = 'PAYMENT';
          $catBadgeClass = 'sp-cat-payment';
          $targetUrl = route('supplier.payments');
        } elseif (stripos($title, 'PO') !== false || stripos($title, 'Purchase') !== false || stripos($msg, 'PU_') !== false) {
          $cat = 'po';
          $iconClass = 'sp-feed-icon-amber';
          $iconHtml = '<i class="bi bi-receipt"></i>';
          $catBadge = 'PURCHASE ORDER';
          $catBadgeClass = 'sp-cat-order';
          $targetUrl = route('supplier.purchase-orders.index');
        }
      @endphp
      <div class="sp-feed-item {{ $isUnread ? 'unread' : '' }}" data-cat="{{ $cat }}" data-read="{{ $isUnread ? 'unread' : 'read' }}" data-search="{{ strtolower($title . ' ' . $msg) }}">
        <div class="sp-feed-left">
          <div class="sp-feed-icon-box {{ $iconClass }}">
            {!! $iconHtml !!}
          </div>
          <div class="sp-feed-content">
            <div class="sp-feed-head">
              <span class="sp-feed-title">{{ $title }}</span>
              <span class="sp-feed-category-badge {{ $catBadgeClass }}">{{ $catBadge }}</span>
            </div>
            <p class="sp-feed-msg">{{ $msg }}</p>
            <div class="sp-feed-meta">
              <span><i class="bi bi-clock"></i> {{ $notif->created_at->format('d M Y, h:i A') }} • {{ $notif->created_at->diffForHumans() }}</span>
              <a href="{{ $targetUrl }}" style="color:#2563EB; font-weight:700; text-decoration:none; margin-left:8px;">
                View Details →
              </a>
            </div>
          </div>
        </div>

        <div class="sp-feed-right">
          @if($isUnread)
            <span class="sp-unread-glow-dot">New</span>
          @endif
          <a href="{{ $targetUrl }}" class="sp-btn-pill" style="height:32px; padding:0 12px; font-size:11.5px; border-radius:6px;">
            <i class="bi bi-arrow-right-circle"></i> Open
          </a>
        </div>
      </div>
      @empty
      <div style="text-align:center; padding:50px 20px; color:#64748B;">
        <i class="bi bi-bell-slash" style="font-size:40px; display:block; margin-bottom:10px; color:#94A3B8;"></i>
        <strong style="font-size:16px; color:#0F172A;">No Notifications Yet</strong>
        <p style="margin:4px 0 0 0; font-size:13px;">You're all caught up! New alerts will appear here in real time.</p>
      </div>
      @endforelse
    </div>

    <!-- Pagination -->
    @if(method_exists($notifications, 'links') && $notifications->hasPages())
    <div style="margin-top:20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
      <span style="font-size:13px; color:#64748B;">
        Showing <strong>{{ $notifications->firstItem() }}</strong> to <strong>{{ $notifications->lastItem() }}</strong> of <strong>{{ $notifications->total() }}</strong> alerts
      </span>
      <div>
        {{ $notifications->links() }}
      </div>
    </div>
    @endif

  </div>

</div>

<script>
function markAllNotificationsAsRead() {
  fetch("{{ route('supplier.notifications.read') }}", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-TOKEN': '{{ csrf_token() }}'
    }
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      document.querySelectorAll('.sp-feed-item.unread').forEach(el => {
        el.classList.remove('unread');
        const dot = el.querySelector('.sp-unread-glow-dot');
        if (dot) dot.remove();
      });
      alert('✅ All notifications marked as read!');
      location.reload();
    }
  })
  .catch(err => {
    location.reload();
  });
}

function filterNotifsByTab(cat, el) {
  document.querySelectorAll('.sp-tab-pill').forEach(btn => btn.classList.remove('active'));
  el.classList.add('active');

  const items = document.querySelectorAll('.sp-feed-item');
  items.forEach(item => {
    const itemCat = item.dataset.cat;
    const itemRead = item.dataset.read;

    let match = false;
    if (cat === 'all') {
      match = true;
    } else if (cat === 'unread') {
      match = (itemRead === 'unread');
    } else if (cat === itemCat) {
      match = true;
    }

    if (match) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
}

function filterNotifsList() {
  const query = document.getElementById('notifSearchInput').value.toLowerCase().trim();
  const catFilter = document.getElementById('filterNotifCat').value.toLowerCase().trim();
  const readFilter = document.getElementById('filterNotifRead').value.toLowerCase().trim();

  const items = document.querySelectorAll('.sp-feed-item');
  items.forEach(item => {
    const searchData = item.dataset.search || '';
    const itemCat = item.dataset.cat || '';
    const itemRead = item.dataset.read || '';

    const matchesQuery = !query || searchData.includes(query);
    const matchesCat = !catFilter || itemCat === catFilter;
    const matchesRead = !readFilter || itemRead === readFilter;

    if (matchesQuery && matchesCat && matchesRead) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
}

function resetNotifFilters() {
  document.getElementById('notifSearchInput').value = '';
  document.getElementById('filterNotifCat').value = '';
  document.getElementById('filterNotifRead').value = '';
  filterNotifsList();
}

function exportNotificationsCsv() {
  let csv = "Title,Message,Read Status\n";
  document.querySelectorAll('.sp-feed-item').forEach(item => {
    if (item.style.display !== 'none') {
      const title = (item.querySelector('.sp-feed-title')?.innerText || '').replace(/"/g, '""');
      const msg = (item.querySelector('.sp-feed-msg')?.innerText || '').replace(/"/g, '""');
      const read = item.dataset.read || 'read';
      csv += `"${title}","${msg}","${read}"\n`;
    }
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", "Notifications_" + new Date().toISOString().slice(0,10) + ".csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
</script>
@endsection