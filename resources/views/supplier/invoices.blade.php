@extends('supplier.layout')
@section('title', 'Supplier Invoices — INFY-POS Supplier Portal')

@section('head')
<style>
/* ══════════════════════════════════════════════════════════════════════
   SUPPLIER INVOICES — ENTERPRISE LUXURY DESIGN SYSTEM (PERFECT FIT)
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

.sp-kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
  border-color: #CBD5E1;
}

.sp-kpi-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.sp-kpi-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--sp-text-muted);
}

.sp-kpi-icon-box {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.sp-kpi-icon-blue { background: #EFF6FF; color: #2563EB; }
.sp-kpi-icon-purple { background: #FAF5FF; color: #7C3AED; }
.sp-kpi-icon-green { background: #F0FDF4; color: #15803D; }
.sp-kpi-icon-amber { background: #FFFBEB; color: #D97706; }

.sp-kpi-bottom {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.sp-kpi-value {
  font-size: 28px;
  font-weight: 800;
  color: var(--sp-text-dark);
  line-height: 1;
}

.sp-kpi-subtext {
  font-size: 11.5px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 999px;
}
.sp-kpi-sub-blue { background: #EFF6FF; color: #2563EB; }
.sp-kpi-sub-purple { background: #FAF5FF; color: #7C3AED; }
.sp-kpi-sub-green { background: #F0FDF4; color: #15803D; }
.sp-kpi-sub-amber { background: #FFFBEB; color: #D97706; }

/* Filter Tabs Strip */
.sp-tabs-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.sp-tab-pill {
  padding: 8px 18px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  color: var(--sp-text-muted);
  background: #FFFFFF;
  border: 1px solid var(--sp-border);
  text-decoration: none;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 150ms ease;
}

.sp-tab-pill:hover {
  background: #F8FAFC;
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
  border-radius: var(--sp-radius-md);
  box-shadow: var(--sp-shadow);
  padding: 20px 24px;
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
  min-width: 280px;
  position: relative;
}

.sp-search-input {
  width: 100%;
  height: 42px;
  background: #FFFFFF;
  border: 1px solid #CBD5E1;
  border-radius: var(--sp-radius-sm);
  padding: 0 16px 0 40px;
  font-size: 13.5px;
  color: var(--sp-text-dark);
  outline: none;
  transition: border-color 150ms ease;
}

.sp-search-input:focus {
  border-color: var(--sp-primary);
  box-shadow: 0 0 0 3px rgba(21, 128, 61, 0.1);
}

.sp-search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--sp-text-muted);
  font-size: 15px;
}

.sp-filter-dropdowns {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.sp-filter-select {
  height: 42px;
  background: #FFFFFF;
  border: 1px solid #CBD5E1;
  border-radius: var(--sp-radius-sm);
  padding: 0 14px;
  font-size: 13px;
  font-weight: 600;
  color: var(--sp-text-dark);
  outline: none;
  cursor: pointer;
}

.sp-filter-select:focus {
  border-color: var(--sp-primary);
}

/* Full-Width Luxury Data Table */
.sp-table-wrap {
  overflow-x: auto;
  border: 1px solid #E2E8F0;
  border-radius: var(--sp-radius-sm);
}

.sp-lux-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 13px;
}

.sp-lux-table th {
  background: #F8FAFC;
  color: #475569;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 12px 14px;
  border-bottom: 1px solid #E2E8F0;
  white-space: nowrap;
}

.sp-lux-table td {
  padding: 12px 14px;
  border-bottom: 1px solid #F1F5F9;
  color: #1E293B;
  vertical-align: middle;
}

.sp-lux-table tr:hover td {
  background: #FAFAFA;
}

/* Custom Badges & Monospace Numbers */
.sp-mono-code {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-weight: 700;
  color: #0F172A;
  font-size: 12.5px;
  white-space: nowrap;
}

.sp-badge-status {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  white-space: nowrap;
}

.sp-status-approved { background: #DCFCE7; color: #15803D; border: 1px solid #86EFAC; }
.sp-status-verified { background: #EFF6FF; color: #1D4ED8; border: 1px solid #93C5FD; }
.sp-status-pending { background: #FEF3C7; color: #B45309; border: 1px solid #FCD34D; }
.sp-status-paid { background: #ECFDF5; color: #047857; border: 1px solid #6EE7B7; }
.sp-status-rejected { background: #FEE2E2; color: #B91C1C; border: 1px solid #FCA5A5; }

/* Table Action Buttons */
.sp-row-actions {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}

.sp-btn-action {
  height: 30px;
  padding: 0 10px;
  border-radius: 6px;
  font-size: 11.5px;
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
}

.sp-btn-action:hover {
  background: #F1F5F9;
  border-color: #94A3B8;
  color: #0F172A;
}

.sp-btn-action.green {
  background: #F0FDF4;
  border-color: #86EFAC;
  color: #15803D;
}
.sp-btn-action.green:hover {
  background: #DCFCE7;
  border-color: #4ADE80;
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

.sp-pdf-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: #FEE2E2;
  color: #DC2626;
  border-radius: 5px;
  font-size: 9px;
  font-weight: 900;
  margin-right: 5px;
  border: 1px solid #FECACA;
  flex-shrink: 0;
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
  max-width: 560px;
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
    <span class="sp-crumb-active">Supplier Invoices</span>
  </div>

  <!-- ── 2. Page Header Row ── -->
  <div class="sp-page-header-row">
    <div class="sp-title-group">
      <h1>Supplier Invoices 📄</h1>
      <p>Create, submit, track and manage all your official GST commercial invoices.</p>
    </div>

    <div class="sp-header-actions">
      <button type="button" class="sp-btn-pill sp-btn-primary" onclick="openCreateInvoiceModal()">
        <i class="bi bi-plus-circle-fill"></i> + Create Invoice
      </button>
      <button type="button" class="sp-btn-pill" onclick="openCreateInvoiceModal()">
        <i class="bi bi-file-earmark-arrow-up"></i> Import Invoice
      </button>
      <button type="button" class="sp-btn-pill" onclick="exportInvoicesCsv()">
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

  <!-- ── 3. 4 Modern KPI Stat Cards (Matching Shipments Layout) ── -->
  <div class="sp-kpi-grid">
    
    <!-- Card 1: Total Invoices -->
    <div class="sp-kpi-card">
      <div class="sp-kpi-card-top">
        <span class="sp-kpi-title">Total Invoices</span>
        <div class="sp-kpi-icon-box sp-kpi-icon-blue">
          <i class="bi bi-file-earmark-text-fill"></i>
        </div>
      </div>
      <div class="sp-kpi-bottom">
        <div class="sp-kpi-value" id="kpi-total-invoices-val">{{ $kpis['submitted'] }}</div>
        <span class="sp-kpi-subtext sp-kpi-sub-blue">All Invoices</span>
      </div>
    </div>

    <!-- Card 2: Approved & Verified -->
    <div class="sp-kpi-card">
      <div class="sp-kpi-card-top">
        <span class="sp-kpi-title">Approved &amp; Verified</span>
        <div class="sp-kpi-icon-box sp-kpi-icon-green">
          <i class="bi bi-patch-check-fill"></i>
        </div>
      </div>
      <div class="sp-kpi-bottom">
        <div class="sp-kpi-value" id="kpi-approved-invoices-val">{{ $kpis['approved'] }}</div>
        <span class="sp-kpi-subtext sp-kpi-sub-green">Finance Approved</span>
      </div>
    </div>

    <!-- Card 3: Pending Approval -->
    <div class="sp-kpi-card">
      <div class="sp-kpi-card-top">
        <span class="sp-kpi-title">Pending / In Review</span>
        <div class="sp-kpi-icon-box sp-kpi-icon-purple">
          <i class="bi bi-hourglass-split"></i>
        </div>
      </div>
      <div class="sp-kpi-bottom">
        <div class="sp-kpi-value" id="kpi-pending-invoices-val">{{ $kpis['pending_approval'] }}</div>
        <span class="sp-kpi-subtext sp-kpi-sub-purple">Awaiting Audit</span>
      </div>
    </div>

    <!-- Card 4: Total Value & GST -->
    <div class="sp-kpi-card">
      <div class="sp-kpi-card-top">
        <span class="sp-kpi-title">Total Billing Value</span>
        <div class="sp-kpi-icon-box sp-kpi-icon-amber">
          <i class="bi bi-currency-rupee"></i>
        </div>
      </div>
      <div class="sp-kpi-bottom">
        <div class="sp-kpi-value" id="kpi-total-billing-val" style="font-size:24px;">₹ {{ number_format($totals['total_value'], 2) }}</div>
        <span class="sp-kpi-subtext sp-kpi-sub-amber" id="kpi-gst-billing-val">GST: ₹{{ number_format($totals['gst_amount'], 2) }}</span>
      </div>
    </div>

  </div>

  <!-- ── 4. Pill Tabs Strip ── -->
  <div class="sp-tabs-strip">
    <button type="button" class="sp-tab-pill active" onclick="filterByTab('all', this)">
      All Invoices <span class="sp-tab-count" id="tab-count-all">{{ $kpis['submitted'] }}</span>
    </button>
    <button type="button" class="sp-tab-pill" onclick="filterByTab('approved', this)">
      Approved <span class="sp-tab-count" id="tab-count-approved">{{ $kpis['approved'] }}</span>
    </button>
    <button type="button" class="sp-tab-pill" onclick="filterByTab('verified', this)">
      Verified GRN <span class="sp-tab-count" id="tab-count-verified">{{ $kpis['verified'] }}</span>
    </button>
    <button type="button" class="sp-tab-pill" onclick="filterByTab('pending', this)">
      Pending <span class="sp-tab-count" id="tab-count-pending">{{ $kpis['pending_approval'] }}</span>
    </button>
    <button type="button" class="sp-tab-pill" onclick="filterByTab('paid', this)">
      Paid <span class="sp-tab-count" id="tab-count-paid">{{ $kpis['paid'] }}</span>
    </button>
    <button type="button" class="sp-tab-pill" onclick="filterByTab('overdue', this)">
      Overdue <span class="sp-tab-count" id="tab-count-overdue">{{ $kpis['overdue'] }}</span>
    </button>
  </div>

  <!-- ── 5. Full-Width Main Card Container (NO RIGHT SIDEBAR) ── -->
  <div class="sp-card-lux">
    
    <!-- Filter & Search Bar -->
    <div class="sp-filters-bar">
      <div class="sp-search-wrap">
        <i class="bi bi-search sp-search-icon"></i>
        <input type="text" id="invoiceSearchInput" class="sp-search-input" placeholder="Search Invoice Number, PO Ref, GRN, Amount..." oninput="filterInvoicesTable()">
      </div>

      <div class="sp-filter-dropdowns">
        <select id="filterWarehouse" class="sp-filter-select" onchange="filterInvoicesTable()">
          <option value="">Warehouse: All</option>
          <option value="Suguna Warehouse">Suguna Warehouse</option>
          <option value="Chennai Hub">Chennai Hub</option>
        </select>

        <select id="filterStatus" class="sp-filter-select" onchange="filterInvoicesTable()">
          <option value="">Status: All</option>
          <option value="Approved">Approved</option>
          <option value="Verified">Verified</option>
          <option value="Pending">Pending</option>
          <option value="Paid">Paid</option>
        </select>

        <select id="filterSort" class="sp-filter-select" onchange="sortInvoicesTable(this.value)">
          <option value="newest">Sort: Newest First</option>
          <option value="highest">Sort: Highest Amount</option>
          <option value="oldest">Sort: Oldest First</option>
        </select>

        <button type="button" class="sp-btn-pill" style="height:42px;" onclick="resetInvoiceFilters()">
          <i class="bi bi-arrow-counterclockwise"></i> Reset
        </button>
      </div>
    </div>

    <!-- Full-Width Luxury Data Table -->
    <div class="sp-table-wrap">
      <table class="sp-lux-table" id="invoicesTable">
        <thead>
          <tr>
            <th style="width:32px; text-align:center;">
              <input type="checkbox" id="chkSelectAll" onclick="toggleSelectAllInvoices(this)" style="cursor:pointer;">
            </th>
            <th>INVOICE NUMBER</th>
            <th>INVOICE DATE</th>
            <th>PO NUMBER</th>
            <th>GRN NUMBER</th>
            <th>DESTINATION WAREHOUSE</th>
            <th>PRODUCTS</th>
            <th>INVOICE AMOUNT</th>
            <th style="text-align:center;">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          @forelse($invoices as $p)
          @php
            $invNum = $p->asn ? $p->asn->invoice_number : ('INV-' . date('Y') . '-' . str_pad($p->id, 5, '0', STR_PAD_LEFT));
            $poCode = $p->reference_code ?: ('PU_' . $p->id);
            $grnNum = 'GRN-' . date('Y') . '-' . str_pad(120 + $p->id, 5, '0', STR_PAD_LEFT);
            $invDate = \Carbon\Carbon::parse($p->date)->format('d M Y');
            $whName = $p->warehouse->name ?? 'Suguna Warehouse';
            $firstProduct = $p->purchaseItems->first() ? ($p->purchaseItems->first()->product->name ?? 'Product') : 'Items';
            $itemCount = $p->purchaseItems->count();
            $statusLabel = 'Approved';
            $statusClass = 'sp-status-approved';
            if ($p->status == \App\Models\Purchase::PENDING) {
              $statusLabel = 'Pending';
              $statusClass = 'sp-status-pending';
            } elseif (($p->paid_amount ?? 0) >= $p->grand_total && $p->grand_total > 0) {
              $statusLabel = 'Paid';
              $statusClass = 'sp-status-paid';
            }
          @endphp
          <tr class="inv-row" data-invoice="{{ $invNum }}" data-po="{{ $poCode }}" data-grn="{{ $grnNum }}" data-wh="{{ $whName }}" data-status="{{ strtolower($statusLabel) }}" data-amount="{{ $p->grand_total }}" data-date="{{ $p->date }}">
            <td style="text-align:center;">
              <input type="checkbox" class="inv-chk" value="{{ $p->id }}" style="cursor:pointer;">
            </td>
            <td>
              <div style="display:flex; align-items:center; gap:6px;">
                <span class="sp-pdf-badge">PDF</span>
                <div>
                  <strong class="sp-mono-code" style="display:block;">{{ $invNum }}</strong>
                  <span class="sp-badge-status {{ $statusClass }}">✓ {{ $statusLabel }}</span>
                </div>
              </div>
            </td>
            <td>
              <span style="font-weight:600; color:#334155; white-space:nowrap;">{{ $invDate }}</span>
            </td>
            <td>
              <a href="{{ route('supplier.purchase-orders.index') }}" style="color:#2563EB; font-weight:700; text-decoration:none; background:#EFF6FF; padding:3px 8px; border-radius:999px; border:1px solid #BFDBFE; display:inline-block; font-size:11.5px; white-space:nowrap;">
                {{ $poCode }}
              </a>
            </td>
            <td>
              <span style="color:#1E40AF; font-weight:700; background:#F8FAFC; padding:3px 8px; border-radius:6px; border:1px solid #CBD5E1; font-family:monospace; font-size:11.5px; display:inline-block; white-space:nowrap;">
                {{ $grnNum }}
              </span>
            </td>
            <td>
              <div>
                <strong style="color:#0F172A; display:block; font-size:12.5px; white-space:nowrap;">{{ $whName }}</strong>
                <span style="font-size:11px; color:#64748B; white-space:nowrap;">Main Receiving Dock</span>
              </div>
            </td>
            <td>
              <div style="display:flex; align-items:center; gap:6px;">
                <div style="width:26px; height:26px; border-radius:6px; background:#FEF3C7; color:#D97706; display:flex; align-items:center; justify-content:center; font-size:13px; flex-shrink:0;">
                  📦
                </div>
                <div>
                  <strong style="font-size:12px; color:#0F172A; display:block; max-width:140px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{{ $firstProduct }}</strong>
                  <span style="font-size:10.5px; color:#64748B; white-space:nowrap;">{{ $itemCount }} SKU(s) packed</span>
                </div>
              </div>
            </td>
            <td>
              <strong style="font-size:14px; color:#0F172A; font-weight:800; display:block; white-space:nowrap;">
                ₹ {{ number_format($p->grand_total, 2) }}
              </strong>
              <span style="font-size:10.5px; color:#15803D; font-weight:700; white-space:nowrap;">Incl. GST (18%)</span>
            </td>
            <td style="text-align:center;">
              <div class="sp-row-actions">
                <a href="{{ route('supplier.invoices.pdf', $p->id) }}" target="_blank" class="sp-btn-action blue" title="View Full Tax Invoice">
                  <i class="bi bi-eye"></i> View
                </a>
                <a href="{{ route('supplier.invoices.pdf', $p->id) }}" target="_blank" class="sp-btn-action" title="Print Invoice">
                  <i class="bi bi-printer"></i> Print
                </a>
                <a href="{{ route('supplier.invoices.pdf', $p->id) }}?pdf=1&download=1" target="_blank" class="sp-btn-action green" title="Download PDF Document">
                  <i class="bi bi-download"></i> PDF
                </a>
              </div>
            </td>
          </tr>
          @empty
          <tr>
            <td colspan="9" style="text-align:center; padding:40px; color:#64748B;">
              <div style="font-size:32px; margin-bottom:8px;">📄</div>
              <strong>No Invoices Found</strong>
              <p style="margin:4px 0 0 0; font-size:12.5px;">No commercial invoices recorded for this supplier.</p>
            </td>
          </tr>
          @endforelse
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div style="margin-top:20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
      <span id="txtShowingCount" style="font-size:13px; color:#64748B;">
        Showing <strong>{{ $invoices->firstItem() ?? 1 }}</strong> to <strong>{{ $invoices->lastItem() ?? count($invoices) }}</strong> of <strong>{{ $invoices->total() ?? count($invoices) }}</strong> invoices
      </span>
      <div>
        @if(method_exists($invoices, 'links'))
          {{ $invoices->links() }}
        @endif
      </div>
    </div>

  </div>

</div>

<!-- ── CREATE INVOICE MODAL ── -->
<div id="createInvoiceModal" class="sp-modal-overlay">
  <div class="sp-modal-card">
    <div style="height:4px; background:linear-gradient(90deg, #10B981, #059669); width:100%;"></div>

    <div class="sp-modal-head">
      <div>
        <h3 style="font-size:17px; font-weight:800; color:#0F172A; margin:0;">Create Supplier Tax Invoice</h3>
        <p style="font-size:12px; color:#64748B; margin:2px 0 0 0;">Generate tax invoice against an approved Purchase Order.</p>
      </div>
      <button type="button" onclick="closeCreateInvoiceModal()" style="background:#F1F5F9; border:none; border-radius:50%; width:32px; height:32px; color:#475569; font-size:16px; cursor:pointer; display:flex; align-items:center; justify-content:center;">✕</button>
    </div>

    <form id="createInvoiceForm" onsubmit="submitCreateInvoiceForm(event)">
      <div class="sp-modal-body">
        
        <div style="margin-bottom:14px;">
          <label style="font-size:12px; font-weight:700; color:#374151; margin-bottom:4px; display:block;">Select Purchase Order <span style="color:#DC2626;">*</span></label>
          <select id="c_po_id" class="sp-filter-select" style="width:100%; font-size:13px;" required>
            @foreach($invoices as $inv)
              <option value="{{ $inv->id }}">{{ $inv->reference_code ?: ('PU_'.$inv->id) }} — {{ $inv->warehouse->name ?? 'Main WH' }} (₹ {{ number_format($inv->grand_total, 2) }})</option>
            @endforeach
          </select>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
          <div>
            <label style="font-size:12px; font-weight:700; color:#374151; margin-bottom:4px; display:block;">Invoice Number <span style="color:#DC2626;">*</span></label>
            <input type="text" id="c_invoice_num" class="sp-search-input" style="padding-left:14px;" value="INV-2026-00049" required>
          </div>
          <div>
            <label style="font-size:12px; font-weight:700; color:#374151; margin-bottom:4px; display:block;">Invoice Date <span style="color:#DC2626;">*</span></label>
            <input type="date" id="c_invoice_date" class="sp-search-input" style="padding-left:14px;" value="{{ date('Y-m-d') }}" required>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
          <div>
            <label style="font-size:12px; font-weight:700; color:#374151; margin-bottom:4px; display:block;">GST Tax Rate</label>
            <select id="c_gst_rate" class="sp-filter-select" style="width:100%;">
              <option value="18">18% GST (Standard)</option>
              <option value="12">12% GST</option>
              <option value="5">5% GST</option>
              <option value="0">0% Exempted</option>
            </select>
          </div>
          <div>
            <label style="font-size:12px; font-weight:700; color:#374151; margin-bottom:4px; display:block;">Attach PDF / Scan</label>
            <input type="file" id="c_invoice_pdf" class="sp-search-input" style="padding:6px 14px; font-size:11.5px;" accept=".pdf,.png,.jpg">
          </div>
        </div>

      </div>

      <div class="sp-modal-foot">
        <button type="button" class="sp-btn-pill" onclick="closeCreateInvoiceModal()">Cancel</button>
        <button type="submit" class="sp-btn-pill sp-btn-primary">
          <i class="bi bi-send-fill"></i> Submit Tax Invoice
        </button>
      </div>
    </form>
  </div>
</div>

<script>
function openCreateInvoiceModal() {
  document.getElementById('createInvoiceModal').classList.add('show');
}

function closeCreateInvoiceModal() {
  document.getElementById('createInvoiceModal').classList.remove('show');
}

function submitCreateInvoiceForm(e) {
  e.preventDefault();
  const invNum = document.getElementById('c_invoice_num').value;
  const poId = document.getElementById('c_po_id').value;

  fetch("/api/supplier/invoices/create", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-CSRF-TOKEN': '{{ csrf_token() }}'
    },
    body: JSON.stringify({
      po_id: poId,
      invoice_number: invNum,
      date: document.getElementById('c_invoice_date').value,
      gst_rate: document.getElementById('c_gst_rate').value
    })
  })
  .then(res => res.json())
  .then(data => {
    closeCreateInvoiceModal();
    if (window.refreshInvoicesRealtime) window.refreshInvoicesRealtime();

    try {
      if (window.BroadcastChannel) {
        const bc = new BroadcastChannel('infypos_realtime_bus');
        bc.postMessage({
          type: 'invoice',
          action: 'created',
          po_id: poId,
          invoice_number: invNum,
          timestamp: Date.now()
        });
      }
    } catch(e) {}

    try {
      localStorage.setItem('infypos_sync_pulse', Date.now().toString());
      localStorage.setItem('infy_invoice_sync', Date.now().toString());
      localStorage.setItem('infy_purchase_sync', Date.now().toString());
    } catch(e) {}

    if (window.InfySyncEngine && window.InfySyncEngine.toast) {
      window.InfySyncEngine.toast('Tax Invoice ' + invNum + ' created & synced successfully!', 'success');
    }
  })
  .catch(err => {
    console.error('Invoice creation error:', err);
    closeCreateInvoiceModal();
  });
}

function filterByTab(status, el) {
  document.querySelectorAll('.sp-tab-pill').forEach(btn => btn.classList.remove('active'));
  el.classList.add('active');

  const rows = document.querySelectorAll('.inv-row');
  let visibleCount = 0;

  rows.forEach(row => {
    const rowStatus = (row.dataset.status || '').toLowerCase();
    const hasGrn = !!row.dataset.grn;

    let match = false;
    if (status === 'all') {
      match = true;
    } else if (status === 'verified') {
      // In this POS, approved/received POs have GRNs verified
      match = (rowStatus === 'verified' || rowStatus === 'approved' || hasGrn);
    } else if (status === 'approved') {
      match = (rowStatus === 'approved' || rowStatus === 'verified');
    } else if (status === 'pending') {
      match = (rowStatus === 'pending');
    } else if (status === 'paid') {
      match = (rowStatus === 'paid');
    } else if (status === 'overdue') {
      match = (rowStatus === 'overdue');
    }

    if (match) {
      row.style.display = '';
      visibleCount++;
    } else {
      row.style.display = 'none';
    }
  });

  updateShowingCountText(visibleCount, rows.length);
}

function filterInvoicesTable() {
  const query = document.getElementById('invoiceSearchInput').value.toLowerCase().trim();
  const whFilter = document.getElementById('filterWarehouse').value.toLowerCase().trim();
  const stFilter = document.getElementById('filterStatus').value.toLowerCase().trim();

  const rows = document.querySelectorAll('.inv-row');
  let visibleCount = 0;

  rows.forEach(row => {
    const inv = (row.dataset.invoice || '').toLowerCase();
    const po = (row.dataset.po || '').toLowerCase();
    const grn = (row.dataset.grn || '').toLowerCase();
    const wh = (row.dataset.wh || '').toLowerCase();
    const st = (row.dataset.status || '').toLowerCase();
    const amt = (row.dataset.amount || '').toLowerCase();

    const matchesSearch = !query || inv.includes(query) || po.includes(query) || grn.includes(query) || amt.includes(query);
    const matchesWh = !whFilter || wh.includes(whFilter);
    const matchesSt = !stFilter || st.includes(stFilter);

    if (matchesSearch && matchesWh && matchesSt) {
      row.style.display = '';
      visibleCount++;
    } else {
      row.style.display = 'none';
    }
  });

  updateShowingCountText(visibleCount, rows.length);
}

function updateShowingCountText(visible, total) {
  const el = document.getElementById('txtShowingCount');
  if (el) {
    el.innerHTML = `Showing <strong>${visible}</strong> of <strong>${total}</strong> invoices`;
  }
}

function sortInvoicesTable(val) {
  const tbody = document.querySelector('#invoicesTable tbody');
  const rows = Array.from(tbody.querySelectorAll('.inv-row'));

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

function resetInvoiceFilters() {
  document.getElementById('invoiceSearchInput').value = '';
  document.getElementById('filterWarehouse').value = '';
  document.getElementById('filterStatus').value = '';
  document.getElementById('filterSort').value = 'newest';
  filterInvoicesTable();
}

function toggleSelectAllInvoices(chk) {
  document.querySelectorAll('.inv-chk').forEach(c => c.checked = chk.checked);
}

function exportInvoicesCsv() {
  let csv = "Invoice Number,Invoice Date,PO Number,GRN Number,Warehouse,Amount\n";
  document.querySelectorAll('.inv-row').forEach(row => {
    if (row.style.display !== 'none') {
      csv += `"${row.dataset.invoice}","${row.dataset.date}","${row.dataset.po}","${row.dataset.grn}","${row.dataset.wh}","${row.dataset.amount}"\n`;
    }
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", "Supplier_Invoices_" + new Date().toISOString().slice(0,10) + ".csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ── Fast Real-Time Invoices Syncer ──────────────────────────────────────────
window.refreshInvoicesRealtime = function() {
  fetch("/api/supplier/invoices/realtime?supplier_id={{ $supplierId ?? 1 }}", {
    headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
  })
  .then(res => res.json())
  .then(data => {
    if (!data || !data.success) return;

    // 1. Update 4 KPI Cards
    if (data.kpis) {
      const elTotal = document.getElementById('kpi-total-invoices-val');
      if (elTotal) elTotal.innerText = data.kpis.submitted ?? 0;

      const elApproved = document.getElementById('kpi-approved-invoices-val');
      if (elApproved) elApproved.innerText = data.kpis.approved ?? 0;

      const elPending = document.getElementById('kpi-pending-invoices-val');
      if (elPending) elPending.innerText = data.kpis.pending_approval ?? 0;

      // 2. Update Tabs Badges
      const tAll = document.getElementById('tab-count-all');
      if (tAll) tAll.innerText = data.kpis.submitted ?? 0;

      const tApproved = document.getElementById('tab-count-approved');
      if (tApproved) tApproved.innerText = data.kpis.approved ?? 0;

      const tVerified = document.getElementById('tab-count-verified');
      if (tVerified) tVerified.innerText = data.kpis.verified ?? 0;

      const tPending = document.getElementById('tab-count-pending');
      if (tPending) tPending.innerText = data.kpis.pending_approval ?? 0;

      const tPaid = document.getElementById('tab-count-paid');
      if (tPaid) tPaid.innerText = data.kpis.paid ?? 0;

      const tOverdue = document.getElementById('tab-count-overdue');
      if (tOverdue) tOverdue.innerText = data.kpis.overdue ?? 0;
    }

    if (data.totals) {
      const elBilling = document.getElementById('kpi-total-billing-val');
      if (elBilling) elBilling.innerText = '₹ ' + Number(data.totals.total_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      const elGst = document.getElementById('kpi-gst-billing-val');
      if (elGst) elGst.innerText = 'GST: ₹' + Number(data.totals.gst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // 3. Update Sidebar Badges
    if (data.sidebar_counts) {
      const bPos = document.getElementById('badge-pos-count');
      if (bPos) bPos.innerText = data.sidebar_counts.total_pos ?? 0;

      const bAppr = document.getElementById('badge-approvals-count');
      if (bAppr) bAppr.innerText = data.sidebar_counts.pending_pos ?? 0;

      const bAsn = document.getElementById('badge-asn-count');
      if (bAsn) bAsn.innerText = data.sidebar_counts.total_asns ?? 0;

      const bShip = document.getElementById('badge-shipments-count');
      if (bShip) bShip.innerText = data.sidebar_counts.dispatched_asns ?? 0;
    }
  })
  .catch(err => console.warn('[InvoicesSync] Real-time sync skipped:', err));
};

// ── Cross-Tab & Event Bus Listeners ─────────────────────────────────────────
try {
  if (window.BroadcastChannel) {
    const bc = new BroadcastChannel('infypos_realtime_bus');
    bc.onmessage = function(event) {
      if (event && event.data) {
        window.refreshInvoicesRealtime();
      }
    };
  }
} catch(e) {}

window.addEventListener('storage', function(e) {
  if (e.key === 'infypos_sync_pulse' || e.key === 'infy_purchase_sync' || e.key === 'infy_invoice_sync' || e.key === 'infypos_realtime_event') {
    window.refreshInvoicesRealtime();
  }
});

document.addEventListener('visibilitychange', function() {
  if (document.visibilityState === 'visible') {
    window.refreshInvoicesRealtime();
  }
});

document.addEventListener('infy:purchases-changed', () => window.refreshInvoicesRealtime());
document.addEventListener('infy:invoices-changed', () => window.refreshInvoicesRealtime());
</script>
@endsection