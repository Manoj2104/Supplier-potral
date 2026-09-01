@extends('supplier.layout')
@section('title', 'Shipments & Courier Logistics Hub — INFY-POS Supplier Portal')

@section('head')
<style>
/* ══════════════════════════════════════════════════════════════════════
   SUPPLIER SHIPMENTS & LOGISTICS — LUXURY POS ENTERPRISE DESIGN
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
  --sp-radius-lg: 24px;
  --sp-radius-md: 16px;
  --sp-radius-sm: 10px;
  --sp-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
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
  position: static !important;
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
  height: 42px;
  padding: 0 20px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 180ms ease;
  border: 1px solid var(--sp-border);
  background: #FFFFFF;
  color: var(--sp-text-dark);
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.02);
  text-decoration: none;
  white-space: nowrap;
}

.sp-btn-pill:hover {
  background: #F1F5F9;
  border-color: #CBD5E1;
  transform: translateY(-1px);
  color: var(--sp-text-dark);
}

.sp-btn-pill.sp-btn-primary {
  background: var(--sp-primary);
  color: #FFFFFF;
  border-color: var(--sp-primary);
  box-shadow: 0 4px 12px rgba(21, 128, 61, 0.22);
}

.sp-btn-pill.sp-btn-primary:hover {
  background: var(--sp-primary-hover);
  border-color: var(--sp-primary-hover);
  color: #FFFFFF;
}

/* 4 Luxury KPI Cards Grid */
.sp-kpi-grid {
  display: grid !important;
  grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
  gap: 16px !important;
  margin-bottom: 24px;
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
  background: var(--sp-card-bg);
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-md);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 120px;
  position: relative;
  box-shadow: var(--sp-shadow);
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
  text-decoration: none;
  color: inherit;
}

.sp-kpi-card::before {
  display: none !important;
}

.sp-kpi-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.06);
  border-color: #CBD5E1;
}

.sp-kpi-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.sp-kpi-label {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--sp-text-muted);
}

.sp-kpi-icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.sp-kpi-icon.green { background: #DCFCE7; color: #15803D; }
.sp-kpi-icon.blue { background: #EFF6FF; color: #2563EB; }
.sp-kpi-icon.purple { background: #F3E8FF; color: #9333EA; }
.sp-kpi-icon.orange { background: #FEF3C7; color: #D97706; }

.sp-kpi-value {
  font-size: 32px;
  font-weight: 800;
  color: var(--sp-text-dark);
  line-height: 1;
  letter-spacing: -0.02em;
  margin-bottom: 12px;
}

.sp-kpi-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sp-kpi-badge {
  font-size: 11px;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.sp-kpi-badge.up { background: #DCFCE7; color: #15803D; }
.sp-kpi-badge.blue { background: #EFF6FF; color: #2563EB; }
.sp-kpi-badge.purple { background: #F3E8FF; color: #9333EA; }
.sp-kpi-badge.orange { background: #FEF3C7; color: #D97706; }

/* Status Tabs Bar */
.sp-tabs-wrap {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  border-bottom: 1px solid var(--sp-border);
  margin-bottom: 22px;
  padding-bottom: 4px;
}

.sp-tab-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 700;
  color: var(--sp-text-muted);
  text-decoration: none;
  border-radius: 10px;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.sp-tab-item:hover {
  color: var(--sp-text-dark);
  background: #F1F5F9;
}

.sp-tab-item.active {
  color: var(--sp-primary);
  background: #DCFCE7;
}

.sp-tab-count-badge {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  background: #F1F5F9;
  color: #475569;
}

.sp-tab-item.active .sp-tab-count-badge {
  background: var(--sp-primary);
  color: #FFFFFF;
}

/* Master Workspace Container */
.sp-workspace-box {
  background: var(--sp-card-bg);
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-lg);
  box-shadow: var(--sp-shadow);
  padding: 20px 24px;
}

/* Search & Filter Toolbar */
.sp-toolbar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.sp-search-box {
  position: relative;
  flex: 1;
  min-width: 280px;
}

.sp-search-box input {
  width: 100%;
  height: 44px;
  padding: 0 16px 0 42px;
  border-radius: 12px;
  border: 1px solid var(--sp-border);
  font-size: 13px;
  background: #F8FAFC;
  font-weight: 600;
  color: var(--sp-text-dark);
  outline: none;
  transition: all 150ms ease;
}

.sp-search-box input:focus {
  border-color: var(--sp-primary);
  background: #FFFFFF;
  box-shadow: 0 0 0 3px rgba(21, 128, 61, 0.12);
}

.sp-search-box i {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--sp-text-light);
  font-size: 15px;
}

.sp-filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.sp-filter-select {
  height: 44px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid var(--sp-border);
  font-size: 13px;
  font-weight: 700;
  color: var(--sp-text-dark);
  background: #F8FAFC;
  outline: none;
  cursor: pointer;
  transition: all 150ms ease;
}

.sp-filter-select:focus {
  border-color: var(--sp-primary);
  background: #FFFFFF;
}

.sp-btn-reset {
  height: 44px;
  padding: 0 16px;
  border-radius: 12px;
  border: 1px solid var(--sp-border);
  background: #FFFFFF;
  color: var(--sp-text-muted);
  font-size: 13px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 150ms ease;
  text-decoration: none;
  white-space: nowrap;
}

.sp-btn-reset:hover {
  background: #F1F5F9;
  color: var(--sp-text-dark);
}

/* Master Table */
.sp-table-wrapper {
  overflow-x: auto;
  border-radius: 14px;
  border: 1px solid var(--sp-border);
}

.sp-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 980px;
}

.sp-table thead tr {
  background: #F8FAFC;
}

.sp-table th {
  padding: 14px 16px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: #64748B;
  text-transform: uppercase;
  border-bottom: 1px solid var(--sp-border);
  white-space: nowrap;
}

.sp-table tbody tr {
  background: #FFFFFF;
  transition: background 120ms ease;
}

.sp-table tbody tr:hover {
  background: #F8FAFC !important;
}

.sp-table td {
  padding: 14px 16px;
  font-size: 13px;
  color: var(--sp-text-dark);
  border-bottom: 1px solid #F1F5F9;
  vertical-align: middle;
  white-space: nowrap;
}

/* Shipment Link */
.sp-shp-code-link {
  font-size: 13px;
  font-weight: 800;
  color: #2563EB;
  text-decoration: none;
  white-space: nowrap;
}

.sp-shp-code-link:hover {
  text-decoration: underline;
}

.sp-po-pill {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  color: #1E293B;
  text-decoration: none;
  white-space: nowrap;
}

.sp-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

/* Modal Overlay */
.sp-modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(3px);
  z-index: 1100;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.sp-modal-overlay.show { display: flex; }
.sp-modal-box {
  background: #FFFFFF;
  border-radius: 20px;
  width: 100%;
  max-width: 560px;
  padding: 26px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.15);
}
</style>
@endsection

@section('content')

@php
  $currentTab = request('status', 'all');
  $inTransitCount = $counts['in_transit'] ?? 0;
  $deliveredCount = $counts['delivered'] ?? 0;
  $dispatchedCount = $counts['dispatched'] ?? 0;
  $preparingCount = $counts['preparing'] ?? 0;
@endphp

<div class="sp-page-container">

  @if(session('download_package_url'))
  <iframe src="{{ session('download_package_url') }}" style="display:none;" id="autoDownloadZipFrame"></iframe>
  <div style="background:#DCFCE7; border:1.5px solid #86EFAC; border-radius:14px; padding:14px 20px; margin-bottom:20px; display:flex; align-items:center; justify-content:space-between; gap:12px;">
    <div style="display:flex; align-items:center; gap:12px;">
      <span style="font-size:24px;">📦</span>
      <div>
        <strong style="font-size:14px; color:#15803D;">Dispatch Package Download Started!</strong>
        <div style="font-size:12.5px; color:#166534;">Your complete ZIP archive containing all 6 PDFs and LPN barcode labels is downloading automatically.</div>
      </div>
    </div>
    <a href="{{ session('download_package_url') }}" class="sp-btn-pill sp-btn-primary" style="height:36px; padding:0 16px; font-size:12.5px;">
      <i class="bi bi-download"></i> Click here if download didn't start
    </a>
  </div>
  @endif

  <!-- ── 1. Breadcrumb ────────────────────────────────────────────────── -->
  <div class="sp-page-breadcrumb">
    <a href="{{ route('supplier.dashboard') }}" style="color: var(--sp-text-muted); text-decoration: none;">Dashboard</a>
    <span style="font-size: 10px; color: #94A3B8;">&gt;</span>
    <span class="sp-crumb-active">Shipments &amp; Courier Logistics Hub</span>
  </div>

  <!-- ── 2. Page Header Row ───────────────────────────────────────────── -->
  <div class="sp-page-header-row">
    <div class="sp-title-group">
      <h1>Shipments &amp; Courier Logistics Hub 🚚</h1>
      <p>Real-time courier dispatch tracking, live statuses, and auto-delivery milestones.</p>
    </div>

    <div class="sp-header-actions">
      <a href="{{ route('supplier.asn.index') }}" class="sp-btn-pill sp-btn-primary">
        <i class="bi bi-plus-lg"></i> Create Shipment (ASN)
      </a>

      <button type="button" class="sp-btn-pill" onclick="openGpsModal()">
        <i class="bi bi-geo-alt"></i> Live GPS Map
      </button>

      <a href="{{ route('supplier.shipments') }}" class="sp-btn-pill" title="Refresh data">
        <i class="bi bi-arrow-clockwise"></i> Refresh
      </a>
    </div>
  </div>

  <!-- ── 3. 4 Luxury KPI Summary Cards Grid (Exact Style as Ref Image 2) ── -->
  <div class="sp-kpi-grid">
    
    <!-- Card 1: Total Shipments -->
    <a href="{{ route('supplier.shipments', ['status' => 'all']) }}" class="sp-kpi-card">
      <div class="sp-kpi-top">
        <span class="sp-kpi-label">Total Shipments</span>
        <div class="sp-kpi-icon blue">
          <i class="bi bi-box-seam"></i>
        </div>
      </div>
      <div class="sp-kpi-value" id="kpi-total-shipments-val">{{ $counts['all'] }}</div>
      <div class="sp-kpi-bottom">
        <span class="sp-kpi-badge blue">All Dispatches</span>
        <svg width="60" height="24" viewBox="0 0 60 24" fill="none">
          <path d="M2 18L16 10L30 14L44 6L58 2" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </a>

    <!-- Card 2: In Transit -->
    <a href="{{ route('supplier.shipments', ['status' => 'in_transit']) }}" class="sp-kpi-card">
      <div class="sp-kpi-top">
        <span class="sp-kpi-label">In Transit</span>
        <div class="sp-kpi-icon purple">
          <i class="bi bi-truck"></i>
        </div>
      </div>
      <div class="sp-kpi-value" id="kpi-in-transit-val" style="color:#9333EA;">{{ $inTransitCount }}</div>
      <div class="sp-kpi-bottom">
        <span class="sp-kpi-badge purple">On the Road</span>
        <svg width="60" height="24" viewBox="0 0 60 24" fill="none">
          <path d="M2 18L16 12L30 14L44 8L58 3" stroke="#9333EA" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </a>

    <!-- Card 3: Delivered -->
    <a href="{{ route('supplier.shipments', ['status' => 'delivered']) }}" class="sp-kpi-card">
      <div class="sp-kpi-top">
        <span class="sp-kpi-label">Delivered</span>
        <div class="sp-kpi-icon green">
          <i class="bi bi-check2-circle"></i>
        </div>
      </div>
      <div class="sp-kpi-value" id="kpi-delivered-val" style="color:#15803D;">{{ $deliveredCount }}</div>
      <div class="sp-kpi-bottom">
        <span class="sp-kpi-badge up">Completed Delivery</span>
        <svg width="60" height="24" viewBox="0 0 60 24" fill="none">
          <path d="M2 20L16 14L30 16L44 8L58 2" stroke="#15803D" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </a>

    <!-- Card 4: Preparing & Staged -->
    <a href="{{ route('supplier.shipments', ['status' => 'preparing']) }}" class="sp-kpi-card">
      <div class="sp-kpi-top">
        <span class="sp-kpi-label">Preparing &amp; Staged</span>
        <div class="sp-kpi-icon orange">
          <i class="bi bi-clock-history"></i>
        </div>
      </div>
      <div class="sp-kpi-value" id="kpi-preparing-val" style="color:{{ $preparingCount > 0 ? '#D97706' : '#0F172A' }};">{{ $preparingCount }}</div>
      <div class="sp-kpi-bottom">
        <span class="sp-kpi-badge orange">Pending Handover</span>
        <svg width="60" height="24" viewBox="0 0 60 24" fill="none">
          <path d="M2 18L16 11L30 15L44 9L58 3" stroke="#D97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </a>

  </div>

  <!-- ── 4. Filter Tabs ────────────────────────────────────────────────── -->
  <div class="sp-tabs-wrap">
    <a href="{{ route('supplier.shipments', ['status' => 'all']) }}" class="sp-tab-item {{ $currentTab == 'all' ? 'active' : '' }}">
      All Shipments <span class="sp-tab-count-badge" id="tab-count-all">{{ $counts['all'] }}</span>
    </a>
    <a href="{{ route('supplier.shipments', ['status' => 'in_transit']) }}" class="sp-tab-item {{ $currentTab == 'in_transit' ? 'active' : '' }}">
      In Transit <span class="sp-tab-count-badge" id="tab-count-in_transit">{{ $inTransitCount }}</span>
    </a>
    <a href="{{ route('supplier.shipments', ['status' => 'delivered']) }}" class="sp-tab-item {{ $currentTab == 'delivered' ? 'active' : '' }}">
      Delivered <span class="sp-tab-count-badge" id="tab-count-delivered">{{ $deliveredCount }}</span>
    </a>
    <a href="{{ route('supplier.shipments', ['status' => 'dispatched']) }}" class="sp-tab-item {{ $currentTab == 'dispatched' ? 'active' : '' }}">
      Dispatched <span class="sp-tab-count-badge" id="tab-count-dispatched">{{ $dispatchedCount }}</span>
    </a>
    <a href="{{ route('supplier.shipments', ['status' => 'preparing']) }}" class="sp-tab-item {{ $currentTab == 'preparing' ? 'active' : '' }}">
      Preparing <span class="sp-tab-count-badge" id="tab-count-preparing">{{ $preparingCount }}</span>
    </a>
    <a href="{{ route('supplier.shipments', ['status' => 'delayed']) }}" class="sp-tab-item {{ $currentTab == 'delayed' ? 'active' : '' }}">
      Delayed <span class="sp-tab-count-badge" id="tab-count-delayed">{{ $counts['delayed'] ?? 0 }}</span>
    </a>
  </div>

  <!-- ── 5. Master Workspace Container ─────────────────────────────────── -->
  <div class="sp-workspace-box">

    <!-- Search & Filter Controls Toolbar -->
    <form action="{{ route('supplier.shipments') }}" method="GET" class="sp-toolbar-row">
      <input type="hidden" name="status" value="{{ $currentTab }}">
      
      <!-- Search Input -->
      <div class="sp-search-box">
        <i class="bi bi-search"></i>
        <input type="text" name="search" value="{{ request('search') }}" placeholder="Search Shipment ID, ASN #, carrier, vehicle, driver...">
      </div>

      <!-- Filter Controls Group -->
      <div class="sp-filter-group">
        
        <!-- Warehouse Dropdown -->
        <select name="warehouse_id" class="sp-filter-select" onchange="this.form.submit()">
          <option value="">Warehouse: All</option>
          @foreach($warehouses as $wh)
            <option value="{{ $wh->id }}" {{ request('warehouse_id') == $wh->id ? 'selected' : '' }}>{{ $wh->name }}</option>
          @endforeach
        </select>

        <!-- Status Filter Dropdown -->
        <select name="status" class="sp-filter-select" onchange="this.form.submit()">
          <option value="all" {{ $currentTab == 'all' ? 'selected' : '' }}>Status: All</option>
          <option value="in_transit" {{ $currentTab == 'in_transit' ? 'selected' : '' }}>Status: In Transit</option>
          <option value="delivered" {{ $currentTab == 'delivered' ? 'selected' : '' }}>Status: Delivered</option>
          <option value="dispatched" {{ $currentTab == 'dispatched' ? 'selected' : '' }}>Status: Dispatched</option>
          <option value="preparing" {{ $currentTab == 'preparing' ? 'selected' : '' }}>Status: Preparing</option>
          <option value="delayed" {{ $currentTab == 'delayed' ? 'selected' : '' }}>Status: Delayed</option>
        </select>

        <!-- Sort Dropdown -->
        <select name="sort" class="sp-filter-select" onchange="this.form.submit()">
          <option value="newest" {{ request('sort') == 'newest' ? 'selected' : '' }}>Sort: Newest</option>
          <option value="oldest" {{ request('sort') == 'oldest' ? 'selected' : '' }}>Sort: Oldest</option>
          <option value="expected_delivery" {{ request('sort') == 'expected_delivery' ? 'selected' : '' }}>Sort: Expected ETA</option>
        </select>

        <a href="{{ route('supplier.shipments') }}" class="sp-btn-reset">
          <i class="bi bi-arrow-counterclockwise"></i> Reset
        </a>
      </div>
    </form>

    <!-- Master Table (Full Width) -->
    <div class="sp-table-wrapper">
      <table class="sp-table">
        <thead>
          <tr>
            <th style="width: 36px;"><input type="checkbox" id="selectAllShp" class="form-check-input" onchange="toggleSelectAll(this)"></th>
            <th style="min-width: 170px;">SHIPMENT ID</th>
            <th style="min-width: 140px;">ASN NUMBER</th>
            <th style="min-width: 110px;">PO REF</th>
            <th style="min-width: 170px;">DESTINATION WAREHOUSE</th>
            <th style="min-width: 180px;">COURIER &amp; AWB / LR TRACKING</th>
            <th style="min-width: 160px;">VEHICLE &amp; DRIVER</th>
            <th style="min-width: 130px;">DISPATCH / ETA</th>
            <th style="min-width: 140px;">STATUS</th>
            <th style="min-width: 140px; text-align:right; padding-right:16px;">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          @forelse($asns as $asn)
          @php
            $po = $asn->purchase;
            $poCode = $po ? ($po->reference_code ?: 'PO-'.$po->id) : '—';
            $shipmentId = 'SHP-' . $asn->asn_number;
            $isDelivered = in_array($asn->display_status, ['delivered', 'arrived', 'verified', 'completed', 'received', 'putaway_completed']);
            $isInTransit = $asn->display_status === 'in_transit';
          @endphp
          <tr id="shp-row-{{ $asn->id }}">
            <td>
              <input type="checkbox" class="form-check-input shp-row-check" value="{{ $asn->id }}">
            </td>
            <td>
              <div style="display:inline-flex; align-items:center; gap:8px;">
                <div style="width:32px; height:32px; border-radius:8px; background:{{ $isDelivered ? '#DCFCE7' : '#EFF6FF' }}; color:{{ $isDelivered ? '#15803D' : '#2563EB' }}; display:inline-flex; align-items:center; justify-content:center; font-size:14px; flex-shrink:0;">
                  🚚
                </div>
                <div>
                  <a href="{{ route('supplier.asn.show', $asn->id) }}" class="sp-shp-code-link">
                    {{ $shipmentId }}
                  </a>
                  <div style="font-size:11px; color:#94A3B8; margin-top:1px;">{{ \Carbon\Carbon::parse($asn->created_at)->format('d M Y') }}</div>
                </div>
              </div>
            </td>
            <td>
              <a href="{{ route('supplier.asn.show', $asn->id) }}" style="font-size:12.5px; font-weight:700; color:#475569; text-decoration:none;">
                {{ $asn->asn_number }}
              </a>
            </td>
            <td>
              @if($po)
                <a href="{{ route('supplier.purchase-orders.show', $po->id) }}" class="sp-po-pill">
                  {{ $poCode }}
                </a>
              @else
                <span style="color:#94A3B8;">—</span>
              @endif
            </td>
            <td>
              <div style="font-weight:700; color:#0F172A;">{{ $po->warehouse->name ?? 'Suguna Warehouse' }}</div>
              <div style="font-size:11.5px; color:#64748B; margin-top:1px;">{{ $po->warehouse->city ?? 'Chennai' }}</div>
            </td>
            <td>
              <div style="font-weight:700; color:#0F172A;">{{ $asn->transport_company ?: 'Perman Logistics' }}</div>
              <div style="font-size:11px; color:#2563EB; font-weight:600; margin-top:1px;">
                AWB: {{ $asn->lr_number ?: ('LR-2026-'.str_pad($asn->id, 4, '0', STR_PAD_LEFT)) }}
              </div>
            </td>
            <td>
              <div style="font-weight:700; color:#0F172A; font-size:12.5px;">{{ $asn->vehicle_number ?: 'TN03UZ104' }}</div>
              <div style="font-size:11px; color:#64748B; margin-top:1px;">{{ $asn->driver_name ?: 'Assigned Driver' }}</div>
            </td>
            <td>
              <div style="font-weight:700; color:#0F172A; font-size:12px;">{{ $asn->dispatch_date ? \Carbon\Carbon::parse($asn->dispatch_date)->format('d M Y') : '30 Aug 2026' }}</div>
              <div style="font-size:11px; color:{{ $isDelivered ? '#15803D' : '#D97706' }}; font-weight:600; margin-top:1px;">
                ETA: {{ $asn->expected_arrival ? \Carbon\Carbon::parse($asn->expected_arrival)->format('d M') : '06 Sep' }}
              </div>
            </td>
            <td id="shp-status-cell-{{ $asn->id }}">
              @if($isDelivered)
                <span class="sp-status-badge" style="background:#DCFCE7; color:#15803D; border:1px solid #86EFAC;">
                  <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#15803D;"></span> Delivered
                </span>
              @elseif($isInTransit)
                <span class="sp-status-badge" style="background:#EFF6FF; color:#2563EB; border:1px solid #BFDBFE;">
                  <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#2563EB;"></span> In Transit
                </span>
              @elseif($asn->display_status === 'dispatched')
                <span class="sp-status-badge" style="background:#F3E8FF; color:#9333EA; border:1px solid #E9D5FF;">
                  <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#9333EA;"></span> Dispatched
                </span>
              @elseif($asn->display_status === 'out_for_delivery')
                <span class="sp-status-badge" style="background:#FEF3C7; color:#B45309; border:1px solid #FDE68A;">
                  <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#D97706;"></span> Out for Delivery
                </span>
              @else
                <span class="sp-status-badge" style="background:#FEF3C7; color:#D97706; border:1px solid #FDE68A;">
                  <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#D97706;"></span> Preparing
                </span>
              @endif
            </td>
            <td style="text-align:right; padding-right:16px;">
              <div style="display:inline-flex; gap:6px; align-items:center;">
                <a href="{{ route('supplier.asn.download-package.asn', $asn->id) }}" class="sp-btn-pill" style="height:32px; padding:0 10px; font-size:11.5px; border-color:#86EFAC; color:#15803D; background:#F0FDF4;" title="Download Complete Dispatch ZIP Package (All 6 Documents & Labels)">
                  <i class="bi bi-file-earmark-zip-fill"></i> ZIP Pack
                </a>
                <a href="{{ route('supplier.asn.show', $asn->id) }}" class="sp-btn-pill" style="height:32px; padding:0 12px; font-size:12px;">
                  View
                </a>
                <button type="button" class="sp-btn-pill sp-btn-primary" style="height:32px; padding:0 12px; font-size:12px;" onclick="openUpdateStatusModal({{ $asn->id }}, '{{ $shipmentId }}', '{{ $asn->display_status }}')">
                  Update
                </button>
              </div>
            </td>
          </tr>
          @empty
          <tr>
            <td colspan="10" style="text-align:center; padding:50px; color:#94A3B8; font-weight:700;">
              No shipments found in this view.
            </td>
          </tr>
          @endforelse
        </tbody>
      </table>
    </div>

    <!-- Bottom Pagination -->
    <div style="margin-top:16px; padding-top:16px; border-top:1px solid #F1F5F9; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
      <div style="font-size:12.5px; color:#64748B; font-weight:600;">
        Showing {{ $asns->firstItem() ?? 0 }} to {{ $asns->lastItem() ?? 0 }} of {{ $asns->total() }} shipments
      </div>
      <div>
        {{ $asns->links() }}
      </div>
    </div>

  </div>

</div>

<!-- ── Update Shipment Status Modal ── -->
<div class="sp-modal-overlay" id="statusModal">
  <div class="sp-modal-box">
    <div style="display:flex; align-items:center; gap:10px; margin-bottom:14px;">
      <div style="width:42px; height:42px; border-radius:12px; background:#EFF6FF; color:#2563EB; display:flex; align-items:center; justify-content:center; font-size:22px;">
        🔄
      </div>
      <div>
        <div style="font-size:18px; font-weight:900; color:#0F172A;">Update Shipment Status</div>
        <div style="font-size:12.5px; color:#64748B;" id="modalShpId">SHP-ASN-2026-00001</div>
      </div>
    </div>

    <form id="statusUpdateForm" method="POST" action="">
      @csrf
      <div class="mb-4">
        <label style="font-size:13px; font-weight:700; color:#334155; margin-bottom:8px; display:block;">Select Current Delivery Status</label>
        <select name="status" id="modalStatusSelect" class="form-select" style="height:44px; border-radius:10px; border:1px solid #CBD5E1; font-size:13.5px; font-weight:600;">
          <option value="pending">Pending / Preparing</option>
          <option value="dispatched">Dispatched</option>
          <option value="in_transit">In Transit (On the Road)</option>
          <option value="out_for_delivery">Out for Delivery</option>
          <option value="delivered">Delivered to Warehouse Gate</option>
          <option value="delayed">Delayed</option>
        </select>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" class="sp-btn-pill" onclick="closeModal('statusModal')">Cancel</button>
        <button type="submit" id="btnSubmitStatus" class="sp-btn-pill sp-btn-primary">Save &amp; Broadcast Status</button>
      </div>
    </form>
  </div>
</div>

<!-- ── Live GPS Map Modal ── -->
<div class="sp-modal-overlay" id="gpsModal">
  <div class="sp-modal-box" style="max-width: 680px;">
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px;">
      <div style="display:flex; align-items:center; gap:10px;">
        <div style="width:42px; height:42px; border-radius:12px; background:#DCFCE7; color:#16A34A; display:flex; align-items:center; justify-content:center; font-size:22px;">
          🗺️
        </div>
        <div>
          <div style="font-size:18px; font-weight:900; color:#0F172A;">Live GPS Fleet Tracking</div>
          <div style="font-size:12.5px; color:#64748B;">Active in-transit shipments on road</div>
        </div>
      </div>
      <button type="button" class="sp-btn-pill" style="height:32px; padding:0 10px;" onclick="closeModal('gpsModal')">✕</button>
    </div>

    <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:14px; height:280px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#64748B; text-align:center; padding:20px;">
      <i class="bi bi-geo-alt-fill" style="font-size:38px; color:#2563EB; margin-bottom:10px;"></i>
      <div style="font-size:15px; font-weight:800; color:#0F172A;">Live Route Map Simulator</div>
      <div style="font-size:12.5px; margin-top:4px;">Vehicle TN03UZ104 is currently 42 km from Suguna Warehouse (Chennai).</div>
      <div style="margin-top:14px;" class="badge bg-success p-2">Estimated Arrival: Today 4:30 PM</div>
    </div>

    <div style="display:flex; justify-content:flex-end; margin-top:16px;">
      <button type="button" class="sp-btn-pill" onclick="closeModal('gpsModal')">Close Map</button>
    </div>
  </div>
</div>

@endsection

@section('scripts')
<script>
let currentAsnId = null;

function openUpdateStatusModal(id, shpId, currentStatus) {
  currentAsnId = id;
  document.getElementById('modalShpId').innerText = shpId;
  document.getElementById('statusUpdateForm').action = "/supplier/asn/" + id + "/update-status";
  document.getElementById('modalStatusSelect').value = currentStatus || 'in_transit';
  document.getElementById('statusModal').classList.add('show');
}

function openGpsModal() {
  document.getElementById('gpsModal').classList.add('show');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('show');
}

function toggleSelectAll(master) {
  document.querySelectorAll('.shp-row-check').forEach(chk => chk.checked = master.checked);
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeModal('statusModal');
    closeModal('gpsModal');
  }
});

// ── Status Badge Generator ──────────────────────────────────────────────────
function renderStatusBadge(st) {
  if (st === 'delivered' || st === 'arrived' || st === 'completed' || st === 'received' || st === 'verified') {
    return `<span class="sp-status-badge" style="background:#DCFCE7; color:#15803D; border:1px solid #86EFAC;">
      <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#15803D;"></span> Delivered
    </span>`;
  }
  if (st === 'in_transit') {
    return `<span class="sp-status-badge" style="background:#EFF6FF; color:#2563EB; border:1px solid #BFDBFE;">
      <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#2563EB;"></span> In Transit
    </span>`;
  }
  if (st === 'dispatched' || st === 'accepted') {
    return `<span class="sp-status-badge" style="background:#F3E8FF; color:#9333EA; border:1px solid #E9D5FF;">
      <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#9333EA;"></span> Dispatched
    </span>`;
  }
  if (st === 'out_for_delivery') {
    return `<span class="sp-status-badge" style="background:#FEF3C7; color:#B45309; border:1px solid #FDE68A;">
      <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#D97706;"></span> Out for Delivery
    </span>`;
  }
  if (st === 'delayed' || st === 'rejected') {
    return `<span class="sp-status-badge" style="background:#FEE2E2; color:#DC2626; border:1px solid #FECACA;">
      <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#DC2626;"></span> Delayed
    </span>`;
  }
  return `<span class="sp-status-badge" style="background:#FEF3C7; color:#D97706; border:1px solid #FDE68A;">
    <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#D97706;"></span> Preparing
  </span>`;
}

// ── Fast Real-Time DOM Syncer ───────────────────────────────────────────────
window.refreshShipmentsRealtime = function() {
  fetch("/api/supplier/shipments/realtime?supplier_id={{ $supId ?? 1 }}", {
    headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
  })
  .then(res => res.json())
  .then(data => {
    if (!data || !data.success) return;

    // 1. Update 4 KPI Cards
    if (data.counts) {
      const elTotal = document.getElementById('kpi-total-shipments-val');
      if (elTotal) elTotal.innerText = data.counts.all ?? 0;

      const elInTransit = document.getElementById('kpi-in-transit-val');
      if (elInTransit) elInTransit.innerText = data.counts.in_transit ?? 0;

      const elDelivered = document.getElementById('kpi-delivered-val');
      if (elDelivered) elDelivered.innerText = data.counts.delivered ?? 0;

      const elPreparing = document.getElementById('kpi-preparing-val');
      if (elPreparing) {
        elPreparing.innerText = data.counts.preparing ?? 0;
        elPreparing.style.color = (data.counts.preparing > 0) ? '#D97706' : '#0F172A';
      }

      // 2. Update Tabs Badges
      const tAll = document.getElementById('tab-count-all');
      if (tAll) tAll.innerText = data.counts.all ?? 0;

      const tInTransit = document.getElementById('tab-count-in_transit');
      if (tInTransit) tInTransit.innerText = data.counts.in_transit ?? 0;

      const tDelivered = document.getElementById('tab-count-delivered');
      if (tDelivered) tDelivered.innerText = data.counts.delivered ?? 0;

      const tDispatched = document.getElementById('tab-count-dispatched');
      if (tDispatched) tDispatched.innerText = data.counts.dispatched ?? 0;

      const tPreparing = document.getElementById('tab-count-preparing');
      if (tPreparing) tPreparing.innerText = data.counts.preparing ?? 0;

      const tDelayed = document.getElementById('tab-count-delayed');
      if (tDelayed) tDelayed.innerText = data.counts.delayed ?? 0;
    }

    // 3. Update Sidebar Badges
    if (data.sidebar_counts) {
      const bShip = document.getElementById('badge-shipments-count');
      if (bShip) bShip.innerText = data.sidebar_counts.dispatched_asns ?? 0;

      const bAsn = document.getElementById('badge-asn-count');
      if (bAsn) bAsn.innerText = data.sidebar_counts.total_asns ?? 0;
    }

    // 4. Update Table Rows Status Cell
    if (data.shipments && Array.isArray(data.shipments)) {
      data.shipments.forEach(shp => {
        const cell = document.getElementById('shp-status-cell-' + shp.id);
        if (cell) {
          cell.innerHTML = renderStatusBadge(shp.status);
        }
      });
    }
  })
  .catch(err => console.warn('[ShipmentsSync] Real-time sync skipped:', err));
};

// ── AJAX Status Update Form Submission ──────────────────────────────────────
document.getElementById('statusUpdateForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const form = this;
  const btn = document.getElementById('btnSubmitStatus');
  const originalText = btn.innerText;
  btn.disabled = true;
  btn.innerText = 'Saving...';

  const formData = new FormData(form);
  const newStatus = document.getElementById('modalStatusSelect').value;

  fetch(form.action, {
    method: 'POST',
    body: formData,
    headers: {
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    }
  })
  .then(res => res.json())
  .then(data => {
    closeModal('statusModal');
    if (data && data.success) {
      // 1. Instantly patch current row badge
      if (currentAsnId) {
        const statusCell = document.getElementById('shp-status-cell-' + currentAsnId);
        if (statusCell) {
          statusCell.innerHTML = renderStatusBadge(newStatus);
        }
      }

      // 2. Refresh all counts & KPIs immediately
      window.refreshShipmentsRealtime();

      // 3. 0ms Instant Broadcast across all open POS tabs (Inbound Planning, Stock GRN, Dashboard)
      if (window.InfyBroadcast) {
        window.InfyBroadcast('shipment', { id: currentAsnId, status: newStatus });
        window.InfyBroadcast('inbound', { id: currentAsnId, status: newStatus });
        window.InfyBroadcast('RECEIVING_UPDATED', { id: currentAsnId, status: newStatus });
        window.InfyBroadcast('SHIPMENT_UPDATED', { id: currentAsnId, status: newStatus });
      }

      // 4. Show success toast if sync engine is active
      if (window.InfySyncEngine && window.InfySyncEngine.toast) {
        window.InfySyncEngine.toast(data.message || 'Shipment status updated successfully!', 'success');
      }
    }
  })
  .catch(err => {
    console.error('Update status failed:', err);
    form.submit(); // fallback to standard submit if AJAX network error occurs
  })
  .finally(() => {
    btn.disabled = false;
    btn.innerText = originalText;
  });
});

// ── Cross-Tab & Event Bus Listeners ─────────────────────────────────────────
try {
  if (window.BroadcastChannel) {
    const bc = new BroadcastChannel('infypos_realtime_bus');
    bc.onmessage = function(event) {
      if (event && event.data) {
        window.refreshShipmentsRealtime();
      }
    };
  }
} catch(e) {}

window.addEventListener('storage', function(e) {
  if (e.key === 'infypos_sync_pulse' || e.key === 'infy_shipment_sync' || e.key === 'infypos_realtime_event') {
    window.refreshShipmentsRealtime();
  }
});

document.addEventListener('visibilitychange', function() {
  if (document.visibilityState === 'visible') {
    window.refreshShipmentsRealtime();
  }
});

document.addEventListener('infy:asns-changed', () => window.refreshShipmentsRealtime());
document.addEventListener('infy:cartons-changed', () => window.refreshShipmentsRealtime());
</script>
@endsection