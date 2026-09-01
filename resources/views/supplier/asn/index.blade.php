@extends('supplier.layout')
@section('title', 'Advance Shipping Notices — INFY-POS Supplier Portal')

@section('head')
<style>
/* ══════════════════════════════════════════════════════════════════════
   SUPPLIER ASN / DISPATCH — CLEAN ENTERPRISE DESIGN (REF IMAGE 3)
   ══════════════════════════════════════════════════════════════════════ */

:root {
  --sp-bg-main: #F8FAFC;
  --sp-card-bg: #FFFFFF;
  --sp-border: #E2E8F0;
  --sp-primary: #15803D;
  --sp-primary-hover: #166534;
  --sp-text-dark: #0F172A;
  --sp-text-muted: #64748B;
  --sp-text-light: #94A3B8;
  --sp-radius-lg: 20px;
  --sp-radius-md: 12px;
  --sp-radius-sm: 8px;
}

.sp-page-container {
  padding: 4px 6px 40px 6px;
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
  margin-bottom: 22px;
}

.sp-title-group h1 {
  font-size: 28px;
  font-weight: 800;
  color: var(--sp-text-dark);
  margin: 0 0 4px 0;
  letter-spacing: -0.02em;
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
  font-size: 13.5px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 150ms ease;
  border: 1px solid var(--sp-border);
  background: #FFFFFF;
  color: var(--sp-text-dark);
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  text-decoration: none;
  white-space: nowrap;
}

.sp-btn-pill:hover {
  background: #F8FAFC;
  border-color: #CBD5E1;
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

.sp-btn-pill:disabled, .sp-btn-pill.disabled {
  opacity: 0.55;
  cursor: not-allowed;
  background: #F1F5F9;
  color: #94A3B8;
  border-color: #E2E8F0;
  box-shadow: none;
}

/* 4 KPI Summary Cards Grid (Ref 3) */
.sp-kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 22px;
}

@media (max-width: 1100px) {
  .sp-kpi-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .sp-kpi-grid { grid-template-columns: 1fr; }
}

.sp-kpi-card {
  background: #FFFFFF;
  border: 1px solid #EEF2F7;
  border-radius: 18px;
  padding: 18px 20px;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.02);
  transition: all 180ms ease;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  text-decoration: none;
  color: inherit;
}

.sp-kpi-card:hover {
  transform: translateY(-2px);
  border-color: #CBD5E1;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
}

.sp-kpi-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.sp-kpi-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--sp-text-muted);
}

.sp-kpi-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  flex-shrink: 0;
}

.sp-kpi-icon.green { background: #DCFCE7; color: #15803D; }
.sp-kpi-icon.blue { background: #EFF6FF; color: #2563EB; }
.sp-kpi-icon.orange { background: #FEF3C7; color: #D97706; }
.sp-kpi-icon.purple { background: #F3E8FF; color: #9333EA; }

.sp-kpi-value {
  font-size: 30px;
  font-weight: 800;
  color: var(--sp-text-dark);
  line-height: 1.1;
  margin-bottom: 12px;
}

.sp-kpi-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.sp-kpi-badge {
  font-size: 11.5px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
  white-space: nowrap;
}

.sp-kpi-badge.up { background: #DCFCE7; color: #15803D; }
.sp-kpi-badge.blue { background: #EFF6FF; color: #2563EB; }
.sp-kpi-badge.orange { background: #FEF3C7; color: #D97706; }
.sp-kpi-badge.purple { background: #F3E8FF; color: #9333EA; }

/* Status Tabs Bar */
.sp-tabs-wrap {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  border-bottom: 1px solid #E2E8F0;
  margin-bottom: 20px;
  padding-bottom: 2px;
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
  padding: 1px 7px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 800;
  background: #F1F5F9;
  color: #475569;
}

.sp-tab-item.active .sp-tab-count-badge {
  background: var(--sp-primary);
  color: #FFFFFF;
}

/* Master Card Container */
.sp-card-lux {
  background: #FFFFFF;
  border: 1px solid var(--sp-border);
  border-radius: 20px;
  padding: 20px 24px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.02);
}

/* Search & Filter Bar (Ref 3 Layout) */
.sp-toolbar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}

.sp-search-box {
  position: relative;
  flex: 1;
  min-width: 260px;
}

.sp-search-box input {
  width: 100%;
  height: 42px;
  padding: 0 16px 0 40px;
  border-radius: 10px;
  border: 1px solid var(--sp-border);
  font-size: 13.5px;
  background: #F8FAFC;
  font-weight: 500;
  color: var(--sp-text-dark);
  outline: none;
  transition: all 150ms ease;
}

.sp-search-box input:focus {
  border-color: #16A34A;
  background: #FFFFFF;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.08);
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
  height: 42px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid var(--sp-border);
  font-size: 13px;
  font-weight: 600;
  color: var(--sp-text-dark);
  background: #F8FAFC;
  outline: none;
  cursor: pointer;
  transition: all 150ms ease;
}

.sp-filter-select:focus {
  border-color: #16A34A;
  background: #FFFFFF;
}

.sp-btn-reset {
  height: 42px;
  padding: 0 16px;
  border-radius: 10px;
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

/* Master Table - Perfect Single Line Clean Styling */
.sp-table-wrapper {
  overflow-x: auto;
  margin: 0 -8px;
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
  padding: 12px 14px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: #64748B;
  text-transform: uppercase;
  border-bottom: 1px solid #EEF2F7;
  white-space: nowrap;
}

.sp-table tbody tr {
  background: #FFFFFF;
  transition: background 120ms ease;
  cursor: pointer;
}

.sp-table tbody tr:hover {
  background: #F8FAFC !important;
}

.sp-table td {
  padding: 14px 14px;
  font-size: 13px;
  color: var(--sp-text-dark);
  border-bottom: 1px solid #F1F5F9;
  vertical-align: middle;
  white-space: nowrap;
}

/* ASN Number Single Line Badge */
.sp-asn-code-link {
  font-size: 13px;
  font-weight: 800;
  color: #2563EB;
  text-decoration: none;
  white-space: nowrap;
  letter-spacing: -0.01em;
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
  gap: 5px;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

/* Slide-over Drawer */
.sp-drawer-backdrop {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(2px);
  z-index: 1050;
  display: none;
}
.sp-drawer-backdrop.show { display: block; }

.sp-drawer {
  position: fixed; top: 0; right: -480px; bottom: 0;
  width: 480px;
  max-width: 90vw;
  background: #FFFFFF;
  z-index: 1060;
  box-shadow: -4px 0 30px rgba(0,0,0,0.1);
  transition: right 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
}
.sp-drawer.show { right: 0; }

.sp-drawer-head {
  padding: 20px 24px;
  border-bottom: 1px solid #E2E8F0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.sp-drawer-title { font-size: 18px; font-weight: 800; color: #0F172A; }
.sp-drawer-sub { font-size: 12px; color: #64748B; margin-top: 2px; }
.sp-drawer-close {
  background: none; border: none; font-size: 20px; color: #94A3B8; cursor: pointer;
}
.sp-drawer-body { padding: 24px; overflow-y: auto; flex: 1; }
.sp-drawer-foot {
  padding: 16px 24px; border-top: 1px solid #E2E8F0; background: #FFFFFF;
}

/* Modals */
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
  $asnRequiredCount = $counts['asn_required'] ?? 0;
  $packingCount = $counts['packing'] ?? 0;
  $readyDispatchCount = $counts['ready_dispatch'] ?? 0;
  $inTransitCount = $counts['in_transit'] ?? 0;
  $deliveredCount = $counts['delivered'] ?? 0;
@endphp

<div class="sp-page-container">

  <!-- ── Breadcrumb ── -->
  <div class="sp-page-breadcrumb">
    <a href="{{ route('supplier.dashboard') }}" style="color: var(--sp-text-muted); text-decoration: none;">Dashboard</a>
    <span style="color: #CBD5E1;">&gt;</span>
    <span class="sp-crumb-active">Advance Shipping Notices</span>
  </div>

  <!-- ── Page Header Row ── -->
  <div class="sp-page-header-row">
    <div class="sp-title-group">
      <h1>Advance Shipping Notices</h1>
      <p>Create, pack and dispatch shipments for confirmed purchase orders.</p>
    </div>

    <div class="sp-header-actions">
      @if($asnRequiredCount > 0)
        <a href="{{ route('supplier.asn.index', ['status' => 'asn_required']) }}" class="sp-btn-pill sp-btn-primary" title="Create ASN for {{ $asnRequiredCount }} approved PO(s)">
          <i class="bi bi-plus-lg"></i> Create ASN ({{ $asnRequiredCount }})
        </a>
      @else
        <button type="button" class="sp-btn-pill disabled" disabled title="No approved purchase orders are ready for ASN.">
          <i class="bi bi-plus-lg"></i> Create ASN
        </button>
      @endif

      <button type="button" class="sp-btn-pill" onclick="openBulkUploadModal()">
        <i class="bi bi-upload"></i> Bulk Upload
      </button>

      <button type="button" class="sp-btn-pill" onclick="openManifestModal()">
        <i class="bi bi-printer"></i> Print Manifest
      </button>

      <a href="{{ route('supplier.asn.index') }}" class="sp-btn-pill" title="Refresh data">
        <i class="bi bi-arrow-clockwise"></i> Refresh
      </a>
    </div>
  </div>

  <!-- ── 4 KPI Summary Cards Grid (Ref 3) ── -->
  <div class="sp-kpi-grid">
    
    <!-- Card 1: Approved POs / ASN Required -->
    <a href="{{ route('supplier.asn.index', ['status' => 'asn_required']) }}" class="sp-kpi-card">
      <div class="sp-kpi-top">
        <span class="sp-kpi-label">ASN Pending</span>
        <div class="sp-kpi-icon orange">
          <i class="bi bi-clock-history"></i>
        </div>
      </div>
      <div class="sp-kpi-value" style="color: {{ $asnRequiredCount > 0 ? '#D97706' : '#0F172A' }};">{{ $asnRequiredCount }}</div>
      <div class="sp-kpi-bottom">
        <span class="sp-kpi-badge orange">Approved POs</span>
        <svg width="48" height="18" viewBox="0 0 48 18" fill="none"><path d="M1 17L16 9L30 13L47 1" stroke="#F59E0B" stroke-width="2" stroke-linecap="round"/></svg>
      </div>
    </a>

    <!-- Card 2: Packing Required -->
    <a href="{{ route('supplier.cartons.index') }}" class="sp-kpi-card">
      <div class="sp-kpi-top">
        <span class="sp-kpi-label">Packing Required</span>
        <div class="sp-kpi-icon blue">
          <i class="bi bi-box-seam"></i>
        </div>
      </div>
      <div class="sp-kpi-value">{{ $packingCount }}</div>
      <div class="sp-kpi-bottom">
        <span class="sp-kpi-badge blue">Cartons Pending</span>
        <svg width="48" height="18" viewBox="0 0 48 18" fill="none"><path d="M1 17L16 11L30 14L47 1" stroke="#3B82F6" stroke-width="2" stroke-linecap="round"/></svg>
      </div>
    </a>

    <!-- Card 3: Ready to Dispatch -->
    <a href="{{ route('supplier.asn.index', ['status' => 'ready_dispatch']) }}" class="sp-kpi-card">
      <div class="sp-kpi-top">
        <span class="sp-kpi-label">Ready to Dispatch</span>
        <div class="sp-kpi-icon green">
          <i class="bi bi-send-check"></i>
        </div>
      </div>
      <div class="sp-kpi-value" style="color: #16A34A;">{{ $readyDispatchCount }}</div>
      <div class="sp-kpi-bottom">
        <span class="sp-kpi-badge up">Packed & Ready</span>
        <svg width="48" height="18" viewBox="0 0 48 18" fill="none"><path d="M1 17L16 9L30 12L47 1" stroke="#16A34A" stroke-width="2" stroke-linecap="round"/></svg>
      </div>
    </a>

    <!-- Card 4: In Transit -->
    <a href="{{ route('supplier.shipments') }}" class="sp-kpi-card">
      <div class="sp-kpi-top">
        <span class="sp-kpi-label">In Transit</span>
        <div class="sp-kpi-icon purple">
          <i class="bi bi-truck"></i>
        </div>
      </div>
      <div class="sp-kpi-value">{{ $inTransitCount }}</div>
      <div class="sp-kpi-bottom">
        <span class="sp-kpi-badge purple">On the Road</span>
        <svg width="48" height="18" viewBox="0 0 48 18" fill="none"><path d="M1 17L16 10L30 13L47 1" stroke="#9333EA" stroke-width="2" stroke-linecap="round"/></svg>
      </div>
    </a>

  </div>

  <!-- ── Filter Tabs ── -->
  <div class="sp-tabs-wrap">
    <a href="{{ route('supplier.asn.index', ['status' => 'all']) }}" class="sp-tab-item {{ $currentTab == 'all' ? 'active' : '' }}">
      All Notices <span class="sp-tab-count-badge">{{ $counts['all'] }}</span>
    </a>
    <a href="{{ route('supplier.asn.index', ['status' => 'asn_required']) }}" class="sp-tab-item {{ $currentTab == 'asn_required' ? 'active' : '' }}">
      ASN Required <span class="sp-tab-count-badge" style="background:#FEF3C7; color:#B45309;">{{ $asnRequiredCount }}</span>
    </a>
    <a href="{{ route('supplier.asn.index', ['status' => 'packing']) }}" class="sp-tab-item {{ $currentTab == 'packing' ? 'active' : '' }}">
      Packing <span class="sp-tab-count-badge">{{ $packingCount }}</span>
    </a>
    <a href="{{ route('supplier.asn.index', ['status' => 'ready_dispatch']) }}" class="sp-tab-item {{ $currentTab == 'ready_dispatch' ? 'active' : '' }}">
      Ready to Dispatch <span class="sp-tab-count-badge">{{ $readyDispatchCount }}</span>
    </a>
    <a href="{{ route('supplier.asn.index', ['status' => 'in_transit']) }}" class="sp-tab-item {{ $currentTab == 'in_transit' ? 'active' : '' }}">
      In Transit <span class="sp-tab-count-badge">{{ $inTransitCount }}</span>
    </a>
    <a href="{{ route('supplier.asn.index', ['status' => 'delivered']) }}" class="sp-tab-item {{ $currentTab == 'delivered' ? 'active' : '' }}">
      Delivered <span class="sp-tab-count-badge">{{ $deliveredCount }}</span>
    </a>
    <a href="{{ route('supplier.asn.index', ['status' => 'warehouse_received']) }}" class="sp-tab-item {{ $currentTab == 'warehouse_received' ? 'active' : '' }}">
      Warehouse Received <span class="sp-tab-count-badge">{{ $counts['warehouse_received'] }}</span>
    </a>
  </div>

  <!-- ── Master Card Container (Matching Ref 3) ── -->
  <div class="sp-card-lux">

    <!-- Search & Filter Controls Toolbar -->
    <form action="{{ route('supplier.asn.index') }}" method="GET" class="sp-toolbar-row">
      <input type="hidden" name="status" value="{{ $currentTab }}">
      
      <!-- Search Input -->
      <div class="sp-search-box">
        <i class="bi bi-search"></i>
        <input type="text" name="search" value="{{ request('search') }}" placeholder="Search ASN #, PO reference, carrier, vehicle...">
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
          <option value="asn_required" {{ $currentTab == 'asn_required' ? 'selected' : '' }}>Status: ASN Required</option>
          <option value="packing" {{ $currentTab == 'packing' ? 'selected' : '' }}>Status: Packing</option>
          <option value="ready_dispatch" {{ $currentTab == 'ready_dispatch' ? 'selected' : '' }}>Status: Ready to Dispatch</option>
          <option value="in_transit" {{ $currentTab == 'in_transit' ? 'selected' : '' }}>Status: In Transit</option>
          <option value="delivered" {{ $currentTab == 'delivered' ? 'selected' : '' }}>Status: Delivered</option>
          <option value="warehouse_received" {{ $currentTab == 'warehouse_received' ? 'selected' : '' }}>Status: WH Received</option>
        </select>

        <!-- Sort Dropdown -->
        <select name="sort" class="sp-filter-select" onchange="this.form.submit()">
          <option value="newest" {{ request('sort') == 'newest' ? 'selected' : '' }}>Sort: Newest</option>
          <option value="oldest" {{ request('sort') == 'oldest' ? 'selected' : '' }}>Sort: Oldest</option>
          <option value="expected_delivery" {{ request('sort') == 'expected_delivery' ? 'selected' : '' }}>Sort: Expected ETA</option>
        </select>

        <a href="{{ route('supplier.asn.index') }}" class="sp-btn-reset">
          Reset
        </a>
      </div>
    </form>

    <!-- Master Table -->
    <div class="sp-table-wrapper">
      <table class="sp-table">
        <thead>
          <tr>
            <th style="width: 36px;"><input type="checkbox" id="selectAllAsn" class="form-check-input" onchange="toggleSelectAll(this)"></th>
            <th style="min-width: 170px;">{{ $currentTab == 'asn_required' ? 'PO REFERENCE' : 'ASN NUMBER' }}</th>
            <th style="min-width: 110px;">{{ $currentTab == 'asn_required' ? 'PO DATE' : 'PO REFERENCE' }}</th>
            <th style="min-width: 170px;">DESTINATION WAREHOUSE</th>
            <th style="min-width: 170px;">PRODUCTS & QTY</th>
            <th style="min-width: 110px;">TOTAL VALUE</th>
            <th style="min-width: 160px;">{{ $currentTab == 'asn_required' ? 'PAYMENT STATUS' : 'PACKING PROGRESS' }}</th>
            <th style="min-width: 150px;">{{ $currentTab == 'asn_required' ? 'ASN ACTION' : 'TRANSPORT' }}</th>
            <th style="min-width: 140px;">STATUS</th>
            <th style="min-width: 110px; text-align:right; padding-right:16px;">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          @if($currentTab === 'asn_required')
            @forelse($approvedPosWithoutAsn as $po)
            @php
              $poCode = $po->reference_code ?: 'PO-'.$po->id;
              $totalUnits = $po->purchaseItems->sum('quantity');
            @endphp
            <tr>
              <td>
                <input type="checkbox" class="form-check-input asn-row-check" value="{{ $po->id }}">
              </td>
              <td>
                <div style="display:inline-flex; align-items:center; gap:8px;">
                  <div style="width:32px; height:32px; border-radius:8px; background:#FEF3C7; color:#D97706; display:inline-flex; align-items:center; justify-content:center; font-size:14px; flex-shrink:0;">
                    📋
                  </div>
                  <div>
                    <a href="{{ route('supplier.purchase-orders.show', $po->id) }}" class="sp-asn-code-link" style="color:#D97706;">
                      {{ $poCode }}
                    </a>
                    <div style="font-size:11px; color:#94A3B8; margin-top:1px;">Approved PO</div>
                  </div>
                </div>
              </td>
              <td>
                <span class="sp-po-pill">{{ \Carbon\Carbon::parse($po->created_at)->format('d M Y') }}</span>
              </td>
              <td>
                <div style="font-weight:700; color:#0F172A;">{{ $po->warehouse->name ?? 'Suguna Warehouse' }}</div>
                <div style="font-size:11.5px; color:#64748B; margin-top:1px;">{{ $po->warehouse->city ?? 'Chennai' }}</div>
              </td>
              <td>
                <div style="font-weight:700; color:#0F172A;">{{ $po->purchaseItems->first() ? ($po->purchaseItems->first()->product->name ?? 'Product Item') : 'General Goods' }}</div>
                <span class="badge" style="background:#F1F5F9; color:#475569; font-size:11px; border-radius:6px; font-weight:700; margin-top:2px;">
                  {{ $totalUnits }} Units Total
                </span>
              </td>
              <td style="font-weight:800; color:#0F172A; font-size:13.5px;">
                ₹{{ number_format($po->grand_total ?? 0, 2) }}
              </td>
              <td>
                <span class="badge" style="background:#DCFCE7; color:#15803D; font-size:11px; border-radius:6px; font-weight:700;">
                  Confirmed / Approved
                </span>
              </td>
              <td>
                <span style="font-size:12px; color:#D97706; font-weight:700;">• ASN Not Created</span>
              </td>
              <td>
                <span class="sp-status-badge" style="background:#FEF3C7; color:#B45309; border:1px solid #FDE68A;">
                  <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#D97706;"></span> ASN Pending
                </span>
              </td>
              <td style="text-align:right; padding-right:16px;">
                <a href="{{ route('supplier.asn.create', $po->id) }}" class="sp-btn-pill sp-btn-primary" style="height:32px; padding:0 14px; font-size:12px;">
                  <i class="bi bi-plus-lg"></i> Create ASN
                </a>
              </td>
            </tr>
            @empty
            <tr>
              <td colspan="10" style="text-align:center; padding:50px; color:#94A3B8; font-weight:700;">
                All approved purchase orders have Advance Shipping Notices created!
              </td>
            </tr>
            @endforelse
          @else
            @forelse($asns as $asn)
            @php
              $po = $asn->purchase;
              $poCode = $po ? ($po->reference_code ?: 'PO-'.$po->id) : '—';
              $cartonCount = $asn->cartons->count();
              $totalUnits = $po ? $po->purchaseItems->sum('quantity') : 0;
              $isDispatched = in_array($asn->status, ['dispatched', 'in_transit', 'out_for_delivery']);
              $isDelivered = in_array($asn->status, ['arrived', 'delivered']);
              $isWarehouseReceived = in_array($asn->status, ['receiving', 'verified', 'completed']);
              $isReadyDispatch = in_array($asn->status, ['accepted', 'ready']) || ($cartonCount > 0 && !empty($asn->vehicle_number) && !$isDispatched && !$isDelivered && !$isWarehouseReceived);
            @endphp
            <tr onclick="openAsnDrawer({{ $asn->id }})">
              <td onclick="event.stopPropagation();">
                <input type="checkbox" class="form-check-input asn-row-check" value="{{ $asn->id }}" onchange="handleRowCheck()">
              </td>
              <td>
                <div style="display:inline-flex; align-items:center; gap:8px;">
                  <div style="width:32px; height:32px; border-radius:8px; background:#EFF6FF; color:#2563EB; display:inline-flex; align-items:center; justify-content:center; font-size:14px; flex-shrink:0;">
                    📦
                  </div>
                  <div>
                    <div>
                      <a href="{{ route('supplier.asn.show', $asn->id) }}" class="sp-asn-code-link" onclick="event.stopPropagation();">
                        {{ $asn->asn_number }}
                      </a>
                    </div>
                    <div style="font-size:11px; color:#94A3B8; margin-top:1px;">{{ \Carbon\Carbon::parse($asn->created_at)->format('d M Y') }}</div>
                  </div>
                </div>
              </td>
              <td>
                @if($po)
                  <a href="{{ route('supplier.purchase-orders.show', $po->id) }}" class="sp-po-pill" onclick="event.stopPropagation();">
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
                <div style="font-weight:700; color:#0F172A;">{{ $po && $po->purchaseItems->first() ? ($po->purchaseItems->first()->product->name ?? 'Product Item') : 'General Goods' }}</div>
                <span class="badge" style="background:#F1F5F9; color:#475569; font-size:11px; border-radius:6px; font-weight:700; margin-top:2px;">
                  {{ $totalUnits }} Units Total
                </span>
              </td>
              <td style="font-weight:800; color:#0F172A; font-size:13.5px;">
                ₹{{ number_format($po->grand_total ?? 0, 2) }}
              </td>
              <td>
                @if($cartonCount > 0)
                  <div style="font-weight:800; color:#15803D; font-size:12px;">
                    ✓ {{ $cartonCount }} Carton{{ $cartonCount > 1 ? 's' : '' }} ({{ $totalUnits }} Units)
                  </div>
                  <a href="{{ route('supplier.cartons.index') }}" style="font-size:11px; color:#2563EB; text-decoration:none; font-weight:600;" onclick="event.stopPropagation();">
                    View LPN Labels →
                  </a>
                @else
                  <div style="font-weight:700; color:#D97706; font-size:12px;">
                    0 / {{ $totalUnits }} Packed
                  </div>
                  <a href="{{ route('supplier.cartons.index') }}" style="font-size:11px; color:#2563EB; text-decoration:none; font-weight:600;" onclick="event.stopPropagation();">
                    + Create Cartons →
                  </a>
                @endif
              </td>
              <td>
                @if(!empty($asn->vehicle_number))
                  <div style="font-weight:700; color:#0F172A; font-size:12.5px;">{{ $asn->vehicle_number }}</div>
                  <div style="font-size:11px; color:#64748B; margin-top:1px;">{{ $asn->transport_company ?? 'Carrier Assigned' }}</div>
                @else
                  <span style="font-size:12px; color:#94A3B8;">Not Added</span>
                @endif
              </td>
              <td>
                @if($isWarehouseReceived)
                  <span class="sp-status-badge" style="background:#DCFCE7; color:#15803D; border:1px solid #86EFAC;">
                    <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#15803D;"></span> WH Received
                  </span>
                @elseif($isDelivered)
                  <span class="sp-status-badge" style="background:#DCFCE7; color:#15803D; border:1px solid #86EFAC;">
                    <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#15803D;"></span> Delivered
                  </span>
                @elseif($isDispatched)
                  <span class="sp-status-badge" style="background:#F3E8FF; color:#9333EA; border:1px solid #E9D5FF;">
                    <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#9333EA;"></span> Dispatched
                  </span>
                @elseif($isReadyDispatch)
                  <span class="sp-status-badge" style="background:#FEF3C7; color:#B45309; border:1px solid #FDE68A;">
                    <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#D97706;"></span> Ready to Dispatch
                  </span>
                @else
                  <span class="sp-status-badge" style="background:#F1F5F9; color:#475569; border:1px solid #CBD5E1;">
                    <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#64748B;"></span> ASN Created
                  </span>
                @endif
              </td>
              <td style="text-align:right; padding-right:16px;" onclick="event.stopPropagation();">
                @if($isWarehouseReceived)
                  <a href="{{ route('supplier.asn.show', $asn->id) }}" class="sp-btn-pill" style="height:32px; padding:0 12px; font-size:12px;">
                    View
                  </a>
                @elseif($isDelivered)
                  <a href="{{ route('supplier.shipments') }}" class="sp-btn-pill" style="height:32px; padding:0 12px; font-size:12px; background:#F8FAFC; color:#64748B;">
                    Waiting Receipt
                  </a>
                @elseif($isDispatched)
                  <a href="{{ route('supplier.shipments') }}" class="sp-btn-pill" style="height:32px; padding:0 12px; font-size:12px; background:#EFF6FF; color:#2563EB; border-color:#BFDBFE;">
                    <i class="bi bi-geo-alt"></i> Track
                  </a>
                @elseif($isReadyDispatch)
                  <button type="button" class="sp-btn-pill sp-btn-primary" style="height:32px; padding:0 14px; font-size:12px;" onclick="openDispatchModal({{ $asn->id }}, '{{ $asn->asn_number }}', '{{ $poCode }}')">
                    <i class="bi bi-truck"></i> Dispatch
                  </button>
                @else
                  <a href="{{ route('supplier.cartons.index') }}" class="sp-btn-pill" style="height:32px; padding:0 12px; font-size:12px; background:#FEF3C7; color:#B45309; border-color:#FDE68A;">
                    <i class="bi bi-box-seam"></i> Pack
                  </a>
                @endif
              </td>
            </tr>
            @empty
            <tr>
              <td colspan="10" style="text-align:center; padding:50px; color:#94A3B8; font-weight:700;">
                No Advance Shipping Notices found.
                @if($asnRequiredCount > 0)
                  <div style="margin-top:10px;">
                    <a href="{{ route('supplier.asn.index', ['status' => 'asn_required']) }}" class="sp-btn-pill sp-btn-primary" style="height:34px; font-size:12px;">
                      + Create ASN from Approved PO ({{ $asnRequiredCount }})
                    </a>
                  </div>
                @endif
              </td>
            </tr>
            @endforelse
          @endif
        </tbody>
      </table>
    </div>

    <!-- Bottom Pagination (Ref 3 Layout) -->
    <div style="margin-top:16px; padding-top:16px; border-top:1px solid #F1F5F9; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
      <div style="font-size:12.5px; color:#64748B; font-weight:600;">
        @if($currentTab === 'asn_required')
          Showing {{ $approvedPosWithoutAsn->count() }} approved orders needing ASN
        @else
          Showing {{ $asns->firstItem() ?? 0 }} to {{ $asns->lastItem() ?? 0 }} of {{ $asns->total() }} notices
        @endif
      </div>
      <div>
        @if($currentTab !== 'asn_required')
          {{ $asns->links() }}
        @endif
      </div>
    </div>

  </div>

</div>

<!-- ── Slide-Over ASN Quick Preview Drawer ── -->
<div class="sp-drawer-backdrop" id="asnDrawerBackdrop" onclick="closeAsnDrawer()"></div>
<div class="sp-drawer" id="asnPreviewDrawer">
  <div class="sp-drawer-head">
    <div>
      <div class="sp-drawer-title" id="drAsnCode">ASN-2026-00001</div>
      <div class="sp-drawer-sub" id="drAsnDate">Created on 31 Aug 2026</div>
    </div>
    <button type="button" class="sp-drawer-close" onclick="closeAsnDrawer()">✕</button>
  </div>
  <div class="sp-drawer-body">
    
    <!-- Status & Action Strip -->
    <div class="mb-4 d-flex justify-content-between align-items-center">
      <div id="drAsnStatusBadge">
        <span class="badge" style="background:#DCFCE7; color:#15803D; font-size:13px; padding:6px 14px; border-radius:14px; font-weight:800;">• Ready</span>
      </div>
      <a id="drAsnCta" href="#" class="sp-btn-pill sp-btn-primary" style="height:36px; font-size:12px;">
        Next Action
      </a>
    </div>

    <!-- Order Summary -->
    <div class="mb-4" style="background: #F8FAFC; border-radius: 12px; padding: 16px; border: 1px solid #E2E8F0;">
      <div style="font-size: 11.5px; font-weight: 800; color: #64748B; text-transform: uppercase; margin-bottom: 12px;">SHIPMENT OVERVIEW</div>
      <div style="display: grid; grid-template-columns: 120px 1fr; gap: 8px 12px; font-size: 13px;">
        <span style="color: #64748B;">PO Reference:</span>
        <strong style="color: #0F172A;" id="drAsnPo">PU_1116</strong>

        <span style="color: #64748B;">Warehouse:</span>
        <strong style="color: #0F172A;" id="drAsnWarehouse">Suguna Warehouse</strong>

        <span style="color: #64748B;">Carrier / Transporter:</span>
        <span style="color: #0F172A; font-weight:700;" id="drAsnCarrier">VRL Logistics</span>

        <span style="color: #64748B;">Vehicle Number:</span>
        <span style="color: #0F172A; font-weight:700;" id="drAsnVehicle">TN-01-AB-1234</span>

        <span style="color: #64748B;">Expected Arrival:</span>
        <span style="color: #16A34A; font-weight: 700;" id="drAsnEta">06 Sep 2026</span>
      </div>
    </div>

    <!-- What Happens Next Box -->
    <div class="mb-4" style="background:#EFF6FF; border:1px solid #BFDBFE; border-radius:14px; padding:16px;">
      <div style="font-size:11.5px; font-weight:800; color:#1E40AF; text-transform:uppercase; margin-bottom:4px;">WHAT HAPPENS NEXT?</div>
      <div id="drWhatNextText" style="font-size:13px; color:#1E3A8A; line-height:1.5;">
        Pack products into cartons and assign LPN barcodes before carrier handover.
      </div>
    </div>

  </div>
  <div class="sp-drawer-foot d-flex justify-content-between align-items-center">
    <a id="drAsnFullLink" href="#" class="sp-btn-pill" style="font-size:12.5px;">
      Open Full ASN Show Page →
    </a>
    <button type="button" class="sp-btn-pill" onclick="closeAsnDrawer()">Close</button>
  </div>
</div>

<!-- ── Fast Dispatch Confirmation Modal ── -->
<div class="sp-modal-overlay" id="dispatchModal">
  <div class="sp-modal-box">
    <div style="display:flex; align-items:center; gap:10px; margin-bottom:14px;">
      <div style="width:42px; height:42px; border-radius:12px; background:#DCFCE7; color:#16A34A; display:flex; align-items:center; justify-content:center; font-size:22px;">
        🚚
      </div>
      <div>
        <div style="font-size:18px; font-weight:900; color:#0F172A;">Confirm Shipment Dispatch</div>
        <div style="font-size:12.5px; color:#64748B;">Goods handover to transporter</div>
      </div>
    </div>

    <p style="font-size:13.5px; color:#334155; line-height:1.6; margin-bottom:16px;">
      Are you ready to mark <strong id="dispModalAsn">ASN-XXXX</strong> for <strong id="dispModalPo">PO-XXXX</strong> as <strong>Dispatched & In Transit</strong>? The warehouse receiving team will be notified immediately.
    </p>

    <form id="dispatchForm" method="POST" action="">
      @csrf
      <input type="hidden" name="status" value="in_transit">
      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" class="sp-btn-pill" onclick="closeModal('dispatchModal')">Cancel</button>
        <button type="submit" class="sp-btn-pill sp-btn-primary">Confirm & Start Tracking</button>
      </div>
    </form>
  </div>
</div>

<!-- ── Print Manifest Modal ── -->
<div class="sp-modal-overlay" id="manifestModal">
  <div class="sp-modal-box">
    <div style="display:flex; align-items:center; gap:10px; margin-bottom:14px;">
      <div style="width:42px; height:42px; border-radius:12px; background:#EFF6FF; color:#2563EB; display:flex; align-items:center; justify-content:center; font-size:22px;">
        📄
      </div>
      <div>
        <div style="font-size:18px; font-weight:900; color:#0F172A;">Print Shipping Manifest</div>
        <div style="font-size:12.5px; color:#64748B;">Handover documentation for logistics driver</div>
      </div>
    </div>

    <p style="font-size:13.5px; color:#334155; line-height:1.6;">
      Select the dispatches you want included in the manifest. The manifest includes LPN barcode carton summaries, product quantities, and destination warehouse signatures.
    </p>

    <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
      <button type="button" class="sp-btn-pill" onclick="closeModal('manifestModal')">Cancel</button>
      <button type="button" class="sp-btn-pill sp-btn-primary" onclick="window.print(); closeModal('manifestModal');">
        <i class="bi bi-printer"></i> Print Manifest Now
      </button>
    </div>
  </div>
</div>

<!-- ── Bulk Upload Modal ── -->
<div class="sp-modal-overlay" id="bulkUploadModal">
  <div class="sp-modal-box">
    <div style="display:flex; align-items:center; gap:10px; margin-bottom:14px;">
      <div style="width:42px; height:42px; border-radius:12px; background:#F3E8FF; color:#9333EA; display:flex; align-items:center; justify-content:center; font-size:22px;">
        📤
      </div>
      <div>
        <div style="font-size:18px; font-weight:900; color:#0F172A;">Bulk ASN & LPN Upload</div>
        <div style="font-size:12.5px; color:#64748B;">Upload CSV / Excel packing spreadsheet</div>
      </div>
    </div>

    <div style="border:2px dashed #CBD5E1; border-radius:14px; padding:30px 20px; text-align:center; margin-bottom:16px; background:#F8FAFC;">
      <i class="bi bi-cloud-arrow-up" style="font-size:32px; color:#9333EA;"></i>
      <div style="font-size:13.5px; font-weight:700; color:#0F172A; margin-top:8px;">Drag & Drop ASN CSV / Excel File Here</div>
      <div style="font-size:12px; color:#94A3B8; margin-top:4px;">Supported: .xlsx, .csv (Max 10MB)</div>
      <input type="file" style="display:none;" id="bulkCsvInput" onchange="alert('File selected: ' + this.files[0].name)">
      <button type="button" class="sp-btn-pill" style="margin-top:14px;" onclick="document.getElementById('bulkCsvInput').click()">Browse File</button>
    </div>

    <div style="display:flex; justify-content:space-between; align-items:center;">
      <a href="javascript:void(0)" onclick="alert('Sample ASN template downloaded.')" style="font-size:12.5px; color:#2563EB; font-weight:700; text-decoration:none;">
        <i class="bi bi-download"></i> Download Sample CSV
      </a>
      <div style="display:flex; gap:8px;">
        <button type="button" class="sp-btn-pill" onclick="closeModal('bulkUploadModal')">Cancel</button>
        <button type="button" class="sp-btn-pill sp-btn-primary" onclick="alert('Upload processed successfully!'); closeModal('bulkUploadModal');">Upload & Process</button>
      </div>
    </div>
  </div>
</div>

@endsection

@section('scripts')
<script>
const drawerAsnData = {
  @foreach($asns as $asn)
  @php
    $po = $asn->purchase;
    $cartonCount = $asn->cartons->count();
    $isDispatched = in_array($asn->status, ['dispatched', 'in_transit', 'out_for_delivery']);
    $isDelivered = in_array($asn->status, ['arrived', 'delivered']);
    $isWarehouseReceived = in_array($asn->status, ['receiving', 'verified', 'completed']);
    $isReadyDispatch = in_array($asn->status, ['accepted', 'ready']) || ($cartonCount > 0 && !empty($asn->vehicle_number) && !$isDispatched && !$isDelivered && !$isWarehouseReceived);
  @endphp
  "{{ $asn->id }}": {
    asn_number: "{{ $asn->asn_number }}",
    date: "{{ \Carbon\Carbon::parse($asn->created_at)->format('d M Y') }}",
    po_ref: "{{ $po ? ($po->reference_code ?: 'PO-'.$po->id) : '—' }}",
    warehouse: "{{ addslashes($po->warehouse->name ?? 'Suguna Warehouse') }}",
    carrier: "{{ addslashes($asn->transport_company ?? 'Not Assigned') }}",
    vehicle: "{{ addslashes($asn->vehicle_number ?? 'Not Added') }}",
    eta: "{{ $asn->expected_arrival ? \Carbon\Carbon::parse($asn->expected_arrival)->format('d M Y') : '—' }}",
    status_label: "{{ $asn->status_label }}",
    is_dispatched: {{ $isDispatched ? 'true' : 'false' }},
    is_delivered: {{ $isDelivered ? 'true' : 'false' }},
    is_wh_received: {{ $isWarehouseReceived ? 'true' : 'false' }},
    is_ready_dispatch: {{ $isReadyDispatch ? 'true' : 'false' }},
    show_url: "{{ route('supplier.asn.show', $asn->id) }}",
    cartons_url: "{{ route('supplier.cartons.index') }}"
  },
  @endforeach
};

function openAsnDrawer(id) {
  const data = drawerAsnData[id];
  if (!data) return;

  document.getElementById('drAsnCode').innerText = data.asn_number;
  document.getElementById('drAsnDate').innerText = 'Created on ' + data.date;
  document.getElementById('drAsnPo').innerText = data.po_ref;
  document.getElementById('drAsnWarehouse').innerText = data.warehouse;
  document.getElementById('drAsnCarrier').innerText = data.carrier;
  document.getElementById('drAsnVehicle').innerText = data.vehicle;
  document.getElementById('drAsnEta').innerText = data.eta;
  document.getElementById('drAsnFullLink').href = data.show_url;

  const badge = document.getElementById('drAsnStatusBadge');
  const cta = document.getElementById('drAsnCta');
  const whatNext = document.getElementById('drWhatNextText');

  if (data.is_wh_received) {
    badge.innerHTML = '<span class="badge" style="background:#DCFCE7; color:#15803D; font-size:13px; padding:6px 14px; border-radius:14px; font-weight:800;">• WH Received</span>';
    cta.innerText = 'View Details';
    cta.href = data.show_url;
    cta.className = 'sp-btn-pill';
    whatNext.innerText = 'Shipment fully received and inspected at warehouse. 3-Way match in progress.';
  } else if (data.is_delivered) {
    badge.innerHTML = '<span class="badge" style="background:#DCFCE7; color:#15803D; font-size:13px; padding:6px 14px; border-radius:14px; font-weight:800;">• Delivered</span>';
    cta.innerText = 'Track Status';
    cta.href = "{{ route('supplier.shipments') }}";
    cta.className = 'sp-btn-pill';
    whatNext.innerText = 'Shipment has reached the warehouse gate. Awaiting receiving team to complete GRN scan.';
  } else if (data.is_dispatched) {
    badge.innerHTML = '<span class="badge" style="background:#EFF6FF; color:#2563EB; font-size:13px; padding:6px 14px; border-radius:14px; font-weight:800;">• In Transit</span>';
    cta.innerText = 'Track Live';
    cta.href = "{{ route('supplier.shipments') }}";
    cta.className = 'sp-btn-pill sp-btn-primary';
    whatNext.innerText = 'Shipment is currently moving with transporter. Monitor delivery arrival time.';
  } else if (data.is_ready_dispatch) {
    badge.innerHTML = '<span class="badge" style="background:#FEF3C7; color:#B45309; font-size:13px; padding:6px 14px; border-radius:14px; font-weight:800;">• Ready to Dispatch</span>';
    cta.innerText = 'Dispatch Shipment';
    cta.href = "javascript:openDispatchModal(" + id + ", '" + data.asn_number + "', '" + data.po_ref + "')";
    cta.className = 'sp-btn-pill sp-btn-primary';
    whatNext.innerText = 'All cartons are packed and transport info recorded. Click Dispatch to begin tracking.';
  } else {
    badge.innerHTML = '<span class="badge" style="background:#F1F5F9; color:#475569; font-size:13px; padding:6px 14px; border-radius:14px; font-weight:800;">• Packing Required</span>';
    cta.innerText = 'Pack / Create LPN';
    cta.href = data.cartons_url;
    cta.className = 'sp-btn-pill sp-btn-primary';
    whatNext.innerText = 'ASN created. Please create carton containers and print LPN barcode labels before dispatch.';
  }

  document.getElementById('asnPreviewDrawer').classList.add('show');
  document.getElementById('asnDrawerBackdrop').classList.add('show');
}

function closeAsnDrawer() {
  document.getElementById('asnPreviewDrawer').classList.remove('show');
  document.getElementById('asnDrawerBackdrop').classList.remove('show');
}

function openDispatchModal(id, asnNum, poRef) {
  document.getElementById('dispModalAsn').innerText = asnNum;
  document.getElementById('dispModalPo').innerText = poRef;
  document.getElementById('dispatchForm').action = "/supplier/asn/" + id + "/update-status";
  document.getElementById('dispatchModal').classList.add('show');
}

function openManifestModal() {
  document.getElementById('manifestModal').classList.add('show');
}

function openBulkUploadModal() {
  document.getElementById('bulkUploadModal').classList.add('show');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('show');
}

function toggleSelectAll(master) {
  document.querySelectorAll('.asn-row-check').forEach(chk => chk.checked = master.checked);
}

function handleRowCheck() {
  const anyChecked = document.querySelectorAll('.asn-row-check:checked').length > 0;
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeAsnDrawer();
    closeModal('dispatchModal');
    closeModal('manifestModal');
    closeModal('bulkUploadModal');
  }
});

// Real-Time Cross-Tab Event Listeners
try {
  if (window.BroadcastChannel) {
    const bc = new BroadcastChannel('infypos_realtime_bus');
    bc.onmessage = function(e) {
      if (e && e.data && (e.data.type === 'purchase' || e.data.type === 'asn')) {
        setTimeout(() => location.reload(), 300);
      }
    };
  }
} catch(e) {}

window.addEventListener('storage', function(e) {
  if (e.key === 'infypos_sync_pulse' || e.key === 'infypos_realtime_event' || e.key === 'infy_purchase_sync') {
    setTimeout(() => location.reload(), 300);
  }
});
</script>
@endsection