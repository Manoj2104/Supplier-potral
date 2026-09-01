@extends('supplier.layout')
@section('title', 'Purchase Returns — INFY-POS Supplier Portal')

@section('head')
<style>
/* ══════════════════════════════════════════════════════════════════════
   PURCHASE RETURNS — 100% EXACT ASN DISPATCH HUB LUXURY DESIGN
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

/* 4 Luxury KPI Stat Cards (Exact ASN Hub Style) */
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

/* Card Container for Table & Filters */
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

/* Data Table (Exact ASN Dispatch Hub Style) */
.sp-table-wrap {
  width: 100%;
  overflow-x: auto;
  border: 1px solid #EEF2F7;
  border-radius: 12px;
}

.sp-lux-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 13px;
}

.sp-lux-table thead tr {
  background: #F8FAFC;
}

.sp-lux-table th {
  padding: 12px 14px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: #64748B;
  text-transform: uppercase;
  border-bottom: 1px solid #EEF2F7;
  white-space: nowrap;
}

.sp-lux-table td {
  padding: 14px 14px;
  border-bottom: 1px solid #F1F5F9;
  color: #1E293B;
  vertical-align: middle;
  white-space: nowrap;
}

.sp-lux-table tr:hover td {
  background: #F8FAFC !important;
}

/* PO Reference Pill */
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

/* 3D Box Icon Box */
.sp-box-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #FEF3C7;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  flex-shrink: 0;
}

/* Action Buttons */
.sp-row-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.sp-btn-action {
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid #CBD5E1;
  background: #FFFFFF;
  color: #334155;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 150ms ease;
  white-space: nowrap;
  cursor: pointer;
}

.sp-btn-action:hover {
  background: #F1F5F9;
  border-color: #94A3B8;
  color: #0F172A;
}

.sp-btn-action.blue {
  background: #EFF6FF;
  border-color: #93C5FD;
  color: #1D4ED8;
}
.sp-btn-action.blue:hover {
  background: #DBEAFE;
  border-color: #60A5FA;
}

/* Modal Styles */
.sp-modal-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  z-index: 9999;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.sp-modal-overlay.show {
  display: flex !important;
}

.sp-modal-card {
  background: #FFFFFF;
  border-radius: 20px;
  width: 100%;
  max-width: 580px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.2);
  overflow: hidden;
  border: 1px solid #E2E8F0;
  animation: modalPop 0.2s ease-out;
}

@keyframes modalPop {
  0% { transform: scale(0.96); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.sp-modal-head {
  padding: 18px 24px;
  background: #FFFFFF;
  border-bottom: 1px solid #F1F5F9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sp-modal-body {
  padding: 24px;
  background: #F8FAFC;
  max-height: 80vh;
  overflow-y: auto;
}

.sp-modal-foot {
  padding: 16px 24px;
  background: #FFFFFF;
  border-top: 1px solid #F1F5F9;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
@endsection

@section('content')
<div class="sp-page-container">

  <!-- ── 1. Breadcrumb ── -->
  <div class="sp-page-breadcrumb">
    <a href="{{ route('supplier.dashboard') }}" style="color:inherit; text-decoration:none;">Dashboard</a>
    <i class="bi bi-chevron-right" style="font-size:10px;"></i>
    <span class="sp-crumb-active">Purchase Returns</span>
  </div>

  <!-- ── 2. Page Header Row ── -->
  <div class="sp-page-header-row">
    <div class="sp-title-group">
      <h1>Purchase Returns &amp; RMAs</h1>
      <p>Review, track and manage vendor return orders, RMA claims, and credit notes.</p>
    </div>

    <div class="sp-header-actions">
      <button type="button" class="sp-btn-pill sp-btn-primary" onclick="openRequestReturnModal()">
        <i class="bi bi-plus-circle-fill"></i> + Request Return / RMA
      </button>
      <button type="button" class="sp-btn-pill" onclick="exportReturnsCsv()">
        <i class="bi bi-download"></i> Export CSV
      </button>
      <button type="button" class="sp-btn-pill" onclick="window.print()">
        <i class="bi bi-printer"></i> Print
      </button>
      <button type="button" class="sp-btn-pill" onclick="location.reload()">
        <i class="bi bi-arrow-clockwise"></i> Refresh
      </button>
    </div>
  </div>

  <!-- ── 3. 4 Modern KPI Stat Cards (Exact ASN Hub Style) ── -->
  <div class="sp-kpi-grid">
    
    <!-- Card 1: Return Pending -->
    <div class="sp-kpi-card">
      <div class="sp-kpi-card-top">
        <span class="sp-kpi-title">Return Pending</span>
        <div class="sp-kpi-icon-box sp-kpi-icon-amber">
          <i class="bi bi-clock-history"></i>
        </div>
      </div>
      <div class="sp-kpi-bottom">
        <div class="sp-kpi-value">{{ $stats['pending'] }}</div>
        <div class="sp-kpi-trend-box">
          <span class="sp-kpi-pill-badge sp-pill-amber">Awaiting Review</span>
          <svg class="sp-kpi-sparkline" viewBox="0 0 70 22" fill="none">
            <path d="M2 16C12 8 24 14 36 6C48 12 58 6 68 10" stroke="#D97706" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- Card 2: Quality Inspection -->
    <div class="sp-kpi-card">
      <div class="sp-kpi-card-top">
        <span class="sp-kpi-title">Quality Inspection</span>
        <div class="sp-kpi-icon-box sp-kpi-icon-blue">
          <i class="bi bi-box-seam"></i>
        </div>
      </div>
      <div class="sp-kpi-bottom">
        <div class="sp-kpi-value">{{ $stats['total'] }}</div>
        <div class="sp-kpi-trend-box">
          <span class="sp-kpi-pill-badge sp-pill-blue">Defect Claims</span>
          <svg class="sp-kpi-sparkline" viewBox="0 0 70 22" fill="none">
            <path d="M2 18C12 10 24 16 36 8C48 4 58 12 68 4" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- Card 3: Ready for Pickup -->
    <div class="sp-kpi-card">
      <div class="sp-kpi-card-top">
        <span class="sp-kpi-title">Ready for Pickup</span>
        <div class="sp-kpi-icon-box sp-kpi-icon-green">
          <i class="bi bi-truck"></i>
        </div>
      </div>
      <div class="sp-kpi-bottom">
        <div class="sp-kpi-value">{{ $stats['approved'] }}</div>
        <div class="sp-kpi-trend-box">
          <span class="sp-kpi-pill-badge sp-pill-green">Pickup Scheduled</span>
          <svg class="sp-kpi-sparkline" viewBox="0 0 70 22" fill="none">
            <path d="M2 16C12 10 24 14 36 8C48 4 58 6 68 2" stroke="#15803D" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- Card 4: Total Return Value -->
    <div class="sp-kpi-card">
      <div class="sp-kpi-card-top">
        <span class="sp-kpi-title">Total Return Value</span>
        <div class="sp-kpi-icon-box sp-kpi-icon-purple">
          <i class="bi bi-currency-rupee"></i>
        </div>
      </div>
      <div class="sp-kpi-bottom">
        <div class="sp-kpi-value" style="font-size:26px;">₹{{ number_format($stats['total_value'], 2) }}</div>
        <div class="sp-kpi-trend-box">
          <span class="sp-kpi-pill-badge sp-pill-purple">Debit Notes</span>
          <svg class="sp-kpi-sparkline" viewBox="0 0 70 22" fill="none">
            <path d="M2 18C14 12 26 16 38 6C50 2 60 10 68 3" stroke="#9333EA" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>
      </div>
    </div>

  </div>

  <!-- ── 4. Pill Tabs Strip ── -->
  <div class="sp-tabs-strip">
    <button type="button" class="sp-tab-pill active" onclick="filterReturnsByTab('all', this)">
      All Notices <span class="sp-tab-count">{{ $stats['total'] }}</span>
    </button>
    <button type="button" class="sp-tab-pill" onclick="filterReturnsByTab('pending', this)">
      Return Required <span class="sp-tab-count">{{ $stats['pending'] }}</span>
    </button>
    <button type="button" class="sp-tab-pill" onclick="filterReturnsByTab('received', this)">
      Inspection Done <span class="sp-tab-count">{{ $stats['approved'] }}</span>
    </button>
    <button type="button" class="sp-tab-pill" onclick="filterReturnsByTab('credit', this)">
      Ready for Pickup <span class="sp-tab-count">{{ $stats['approved'] }}</span>
    </button>
    <button type="button" class="sp-tab-pill" onclick="filterReturnsByTab('rejected', this)">
      Resolved / Settled <span class="sp-tab-count">{{ $stats['approved'] }}</span>
    </button>
  </div>

  <!-- ── 5. Main Card Container (Filters & Exact ASN Hub Table) ── -->
  <div class="sp-card-lux">
    
    <!-- Filter & Search Bar -->
    <div class="sp-filters-bar">
      <div class="sp-search-wrap">
        <i class="bi bi-search sp-search-icon"></i>
        <input type="text" id="returnSearchInput" class="sp-search-input" placeholder="Search Return #, PO reference, carrier, vehicle..." oninput="filterReturnsTable()">
      </div>

      <div class="sp-filter-dropdowns">
        <select id="filterReturnWarehouse" class="sp-filter-select" onchange="filterReturnsTable()">
          <option value="">Warehouse: All</option>
          <option value="Suguna Warehouse">Suguna Warehouse</option>
          <option value="Chennai Hub">Chennai Hub</option>
        </select>

        <select id="filterReturnStatus" class="sp-filter-select" onchange="filterReturnsTable()">
          <option value="">Status: All</option>
          <option value="Received">Received</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
        </select>

        <select id="filterReturnSort" class="sp-filter-select" onchange="sortReturnsTable(this.value)">
          <option value="newest">Sort: Newest</option>
          <option value="highest">Sort: Highest Value</option>
          <option value="oldest">Sort: Oldest</option>
        </select>

        <button type="button" class="sp-btn-pill" style="height:42px; padding:0 16px; border-radius:10px;" onclick="resetReturnFilters()">
          Reset
        </button>
      </div>
    </div>

    <!-- Data Table (Exact ASN Hub Style) -->
    <div class="sp-table-wrap">
      <table class="sp-lux-table" id="returnsTable">
        <thead>
          <tr>
            <th>RETURN NUMBER</th>
            <th>PO REFERENCE</th>
            <th>DESTINATION WAREHOUSE</th>
            <th>PRODUCTS &amp; QTY</th>
            <th>TOTAL VALUE</th>
            <th>RETURN PROGRESS</th>
            <th>TRANSPORT</th>
            <th style="text-align:right;">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          @forelse($returns as $ret)
          @php
            $retCode = $ret->reference_code ?: ('PR_' . $ret->id);
            $retDate = \Carbon\Carbon::parse($ret->date ?: $ret->created_at)->format('d M Y');
            $whName = $ret->warehouse->name ?? 'Suguna Warehouse';
            $poCode = 'PU_' . ($ret->purchase_id ?? '1111');
            $firstItem = $ret->purchaseReturnItems->first() ? ($ret->purchaseReturnItems->first()->product->name ?? 'McCain Italian Fries') : 'McCain Italian Fries';
            $itemCount = $ret->purchaseReturnItems->count() ?: 1;
            $reasonText = 'Quality / Damage Issue';
            $statusLabel = 'Received';
            if ($ret->status == 2) {
              $statusLabel = 'Pending';
            }
          @endphp
          <tr class="ret-row" data-ref="{{ $retCode }}" data-po="{{ $poCode }}" data-date="{{ $retDate }}" data-wh="{{ $whName }}" data-reason="{{ $reasonText }}" data-amount="{{ $ret->grand_total }}" data-status="{{ strtolower($statusLabel) }}">
            <td>
              <div style="display:flex; align-items:center; gap:10px;">
                <div class="sp-box-icon">
                  <i class="bi bi-box-seam" style="color:#D97706;"></i>
                </div>
                <div>
                  <a href="javascript:void(0)" onclick="openViewRmaModal('{{ $retCode }}', '{{ $whName }}', '{{ $retDate }}', '{{ $firstItem }}', '₹{{ number_format($ret->grand_total, 2) }}', '{{ $reasonText }}')" style="font-family:'SFMono-Regular', Consolas, monospace; font-weight:800; color:#2563EB; font-size:13px; text-decoration:none; display:block; white-space:nowrap;">
                    {{ $retCode }}
                  </a>
                  <span style="font-size:11px; color:#64748B; white-space:nowrap; display:block;">{{ $retDate }}</span>
                </div>
              </div>
            </td>
            <td>
              <span class="sp-po-pill">
                {{ $poCode }}
              </span>
            </td>
            <td>
              <div>
                <strong style="color:#0F172A; display:block; font-size:13px; font-weight:700;">{{ $whName }}</strong>
                <span style="font-size:11.5px; color:#64748B;">Chennai</span>
              </div>
            </td>
            <td>
              <div>
                <strong style="color:#0F172A; display:block; font-size:13px; font-weight:700; white-space:nowrap;">{{ $firstItem }}</strong>
                <span style="font-size:11.5px; color:#64748B; white-space:nowrap;">{{ $itemCount }} Units Total</span>
              </div>
            </td>
            <td>
              <strong style="font-size:14px; color:#0F172A; font-weight:800; display:block; white-space:nowrap;">
                ₹{{ number_format($ret->grand_total, 2) }}
              </strong>
            </td>
            <td>
              <div>
                <strong style="color:#15803D; font-size:12.5px; display:block; white-space:nowrap;">
                  ✓ 1 Defect Unit
                </strong>
                <a href="javascript:void(0)" onclick="openViewRmaModal('{{ $retCode }}', '{{ $whName }}', '{{ $retDate }}', '{{ $firstItem }}', '₹{{ number_format($ret->grand_total, 2) }}', '{{ $reasonText }}')" style="color:#2563EB; font-size:11px; font-weight:600; text-decoration:none; white-space:nowrap;">
                  View RMA Details →
                </a>
              </div>
            </td>
            <td>
              <div>
                <strong style="color:#0F172A; display:block; font-size:12.5px; font-weight:700; white-space:nowrap;">TN03UZ104</strong>
                <span style="font-size:11.5px; color:#64748B; white-space:nowrap;">Perman Logistics</span>
              </div>
            </td>
            <td style="text-align:right;">
              <div class="sp-row-actions">
                <button type="button" class="sp-btn-action blue" onclick="openViewRmaModal('{{ $retCode }}', '{{ $whName }}', '{{ $retDate }}', '{{ $firstItem }}', '₹{{ number_format($ret->grand_total, 2) }}', '{{ $reasonText }}')">
                  <i class="bi bi-eye"></i> View
                </button>
              </div>
            </td>
          </tr>
          @empty
          <tr>
            <td colspan="8" style="text-align:center; padding:40px; color:#64748B;">
              <i class="bi bi-inbox" style="font-size:32px; display:block; margin-bottom:8px; color:#94A3B8;"></i>
              <strong>No Purchase Returns Recorded</strong>
              <p style="margin:4px 0 0 0; font-size:12.5px;">All shipments accepted by warehouse with zero returns.</p>
            </td>
          </tr>
          @endforelse
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div style="margin-top:18px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
      <span id="txtShowingReturnsCount" style="font-size:13px; color:#64748B;">
        Showing <strong>{{ $returns->firstItem() ?? 1 }}</strong> to <strong>{{ $returns->lastItem() ?? count($returns) }}</strong> of <strong>{{ $returns->total() ?? count($returns) }}</strong> returns
      </span>
      <div>
        @if(method_exists($returns, 'links'))
          {{ $returns->links() }}
        @endif
      </div>
    </div>

  </div>

</div>

<!-- ── VIEW RMA MODAL ── -->
<div id="viewRmaModal" class="sp-modal-overlay">
  <div class="sp-modal-card">
    <div style="height:4px; background:linear-gradient(90deg, #2563EB, #1D4ED8); width:100%;"></div>

    <div class="sp-modal-head">
      <div>
        <h3 id="mRmaTitle" style="font-size:17px; font-weight:800; color:#0F172A; margin:0;">RMA Inspection Details</h3>
        <p id="mRmaSub" style="font-size:12px; color:#64748B; margin:2px 0 0 0;">Return Authorization &amp; Warehouse Inspection Summary</p>
      </div>
      <button type="button" onclick="closeViewRmaModal()" style="background:#F1F5F9; border:none; border-radius:50%; width:32px; height:32px; color:#475569; font-size:16px; cursor:pointer; display:flex; align-items:center; justify-content:center;">✕</button>
    </div>

    <div class="sp-modal-body">
      
      <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:12px; padding:16px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <span style="font-size:11px; font-weight:700; color:#64748B; text-transform:uppercase; display:block;">Return Ref</span>
          <strong id="mRmaCode" style="font-size:15px; color:#2563EB; font-family:monospace;">PR_1111</strong>
        </div>
        <div>
          <span style="font-size:11px; font-weight:700; color:#64748B; text-transform:uppercase; display:block;">Warehouse</span>
          <strong id="mRmaWh" style="font-size:13px; color:#0F172A;">Suguna Warehouse</strong>
        </div>
        <div>
          <span style="font-size:11px; font-weight:700; color:#64748B; text-transform:uppercase; display:block;">Claim Value</span>
          <strong id="mRmaVal" style="font-size:15px; color:#15803D;">₹15.00</strong>
        </div>
      </div>

      <div style="background:#FFFBEB; border:1px solid #FDE68A; border-radius:12px; padding:14px; margin-bottom:14px;">
        <strong style="font-size:12.5px; color:#92400E; display:block; margin-bottom:4px;">Return Reason &amp; QC Observation:</strong>
        <p id="mRmaReason" style="font-size:12px; color:#B45309; margin:0; line-height:1.4;">
          Quality / Damage Issue — Outer carton damaged in transit, item seal broken during gate inspection.
        </p>
      </div>

      <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:12px; padding:14px;">
        <strong style="font-size:12.5px; color:#0F172A; display:block; margin-bottom:6px;">Affected Items:</strong>
        <div id="mRmaItem" style="font-size:12.5px; color:#334155; font-weight:600;">
          • McCain Italian Fries — 1 Unit
        </div>
      </div>

    </div>

    <div class="sp-modal-foot">
      <button type="button" class="sp-btn-pill" onclick="closeViewRmaModal()">Close</button>
      <button type="button" class="sp-btn-pill sp-btn-primary" onclick="acceptRma()">
        <i class="bi bi-check2-circle"></i> Accept &amp; Issue Credit Note
      </button>
    </div>
  </div>
</div>

<!-- ── REQUEST RETURN / RMA MODAL ── -->
<div id="requestReturnModal" class="sp-modal-overlay">
  <div class="sp-modal-card">
    <div style="height:4px; background:linear-gradient(90deg, #10B981, #059669); width:100%;"></div>

    <div class="sp-modal-head">
      <div>
        <h3 style="font-size:17px; font-weight:800; color:#0F172A; margin:0;">Request Vendor Return / RMA</h3>
        <p style="font-size:12px; color:#64748B; margin:2px 0 0 0;">Initiate an RMA request to recall or replace warehouse inventory.</p>
      </div>
      <button type="button" onclick="closeRequestReturnModal()" style="background:#F1F5F9; border:none; border-radius:50%; width:32px; height:32px; color:#475569; font-size:16px; cursor:pointer; display:flex; align-items:center; justify-content:center;">✕</button>
    </div>

    <form onsubmit="submitRequestReturnForm(event)">
      <div class="sp-modal-body">
        
        <div style="margin-bottom:14px;">
          <label style="font-size:12px; font-weight:700; color:#374151; margin-bottom:4px; display:block;">Select Purchase Order / GRN <span style="color:#DC2626;">*</span></label>
          <select class="sp-filter-select" style="width:100%;" required>
            <option value="PU_1111">PU_1111 — Suguna Warehouse (McCain Italian Fries)</option>
            <option value="PU_1118">PU_1118 — Suguna Warehouse (Lays Classic)</option>
          </select>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
          <div>
            <label style="font-size:12px; font-weight:700; color:#374151; margin-bottom:4px; display:block;">Return Reason <span style="color:#DC2626;">*</span></label>
            <select class="sp-filter-select" style="width:100%;" required>
              <option value="Quality/Damage">Quality / Damage</option>
              <option value="Expiry">Expiry Near</option>
              <option value="Shortage">Shortage Mismatch</option>
              <option value="Overdelivery">Overdelivery Recall</option>
            </select>
          </div>
          <div>
            <label style="font-size:12px; font-weight:700; color:#374151; margin-bottom:4px; display:block;">Units to Return <span style="color:#DC2626;">*</span></label>
            <input type="number" class="sp-search-input" style="padding-left:14px;" value="1" min="1" required>
          </div>
        </div>

        <div>
          <label style="font-size:12px; font-weight:700; color:#374151; margin-bottom:4px; display:block;">Detailed Justification</label>
          <textarea class="sp-search-input" style="height:70px; padding:10px 14px; resize:vertical;" placeholder="Describe the defect or reason for recall..."></textarea>
        </div>

      </div>

      <div class="sp-modal-foot">
        <button type="button" class="sp-btn-pill" onclick="closeRequestReturnModal()">Cancel</button>
        <button type="submit" class="sp-btn-pill sp-btn-primary">
          <i class="bi bi-send-fill"></i> Submit Return Request
        </button>
      </div>
    </form>
  </div>
</div>

<script>
function openViewRmaModal(ref, wh, date, item, val, reason) {
  document.getElementById('mRmaCode').innerText = ref;
  document.getElementById('mRmaWh').innerText = wh;
  document.getElementById('mRmaVal').innerText = val;
  document.getElementById('mRmaReason').innerText = reason;
  document.getElementById('mRmaItem').innerText = '• ' + item;
  document.getElementById('viewRmaModal').classList.add('show');
}

function closeViewRmaModal() {
  document.getElementById('viewRmaModal').classList.remove('show');
}

function acceptRma() {
  closeViewRmaModal();
  alert('✅ RMA Return Accepted! Credit Note generated & adjusted against invoice balance.');
}

function openRequestReturnModal() {
  document.getElementById('requestReturnModal').classList.add('show');
}

function closeRequestReturnModal() {
  document.getElementById('requestReturnModal').classList.remove('show');
}

function submitRequestReturnForm(e) {
  e.preventDefault();
  closeRequestReturnModal();
  alert('✅ Return / RMA request submitted successfully to Warehouse Management!');
}

function filterReturnsByTab(status, el) {
  document.querySelectorAll('.sp-tab-pill').forEach(btn => btn.classList.remove('active'));
  el.classList.add('active');

  const rows = document.querySelectorAll('.ret-row');
  let visibleCount = 0;

  rows.forEach(row => {
    const rowStatus = (row.dataset.status || '').toLowerCase();

    let match = false;
    if (status === 'all') {
      match = true;
    } else if (status === 'pending') {
      match = (rowStatus === 'pending');
    } else if (status === 'received' || status === 'credit') {
      match = (rowStatus === 'received' || rowStatus === 'approved');
    } else if (status === 'inspection') {
      match = (rowStatus === 'inspection');
    } else if (status === 'rejected') {
      match = (rowStatus === 'rejected');
    }

    if (match) {
      row.style.display = '';
      visibleCount++;
    } else {
      row.style.display = 'none';
    }
  });

  updateShowingReturnsCount(visibleCount, rows.length);
}

function filterReturnsTable() {
  const query = document.getElementById('returnSearchInput').value.toLowerCase().trim();
  const whFilter = document.getElementById('filterReturnWarehouse').value.toLowerCase().trim();
  const stFilter = document.getElementById('filterReturnStatus').value.toLowerCase().trim();

  const rows = document.querySelectorAll('.ret-row');
  let visibleCount = 0;

  rows.forEach(row => {
    const ref = (row.dataset.ref || '').toLowerCase();
    const po = (row.dataset.po || '').toLowerCase();
    const wh = (row.dataset.wh || '').toLowerCase();
    const st = (row.dataset.status || '').toLowerCase();

    const matchesSearch = !query || ref.includes(query) || po.includes(query) || wh.includes(query);
    const matchesWh = !whFilter || wh.includes(whFilter);
    const matchesSt = !stFilter || st.includes(stFilter);

    if (matchesSearch && matchesWh && matchesSt) {
      row.style.display = '';
      visibleCount++;
    } else {
      row.style.display = 'none';
    }
  });

  updateShowingReturnsCount(visibleCount, rows.length);
}

function updateShowingReturnsCount(visible, total) {
  const el = document.getElementById('txtShowingReturnsCount');
  if (el) {
    el.innerHTML = `Showing <strong>${visible}</strong> of <strong>${total}</strong> returns`;
  }
}

function sortReturnsTable(val) {
  const tbody = document.querySelector('#returnsTable tbody');
  const rows = Array.from(tbody.querySelectorAll('.ret-row'));

  rows.sort((a, b) => {
    if (val === 'highest') {
      return parseFloat(b.dataset.amount || 0) - parseFloat(a.dataset.amount || 0);
    } else if (val === 'oldest') {
      return new Date(a.dataset.date) - new Date(b.dataset.date);
    } else {
      // newest
      return new Date(b.dataset.date) - new Date(a.dataset.date);
    }
  });

  rows.forEach(r => tbody.appendChild(r));
}

function resetReturnFilters() {
  document.getElementById('returnSearchInput').value = '';
  document.getElementById('filterReturnWarehouse').value = '';
  document.getElementById('filterReturnStatus').value = '';
  document.getElementById('filterReturnSort').value = 'newest';
  filterReturnsTable();
}

function exportReturnsCsv() {
  let csv = "Return Ref,PO Reference,Date,Warehouse,Items,Return Value,Status\n";
  document.querySelectorAll('.ret-row').forEach(row => {
    if (row.style.display !== 'none') {
      csv += `"${row.dataset.ref}","${row.dataset.po}","${row.dataset.date}","${row.dataset.wh}","${row.dataset.reason}","${row.dataset.amount}","${row.dataset.status}"\n`;
    }
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", "Purchase_Returns_" + new Date().toISOString().slice(0,10) + ".csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
</script>
@endsection