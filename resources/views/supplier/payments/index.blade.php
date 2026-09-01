@extends('supplier.layout')

@section('title', 'Payments & Settlements Received — Suguna Supplier Portal')

@section('head')
<style>
/* ══════════════════════════════════════════════════════════════════════
   ENTERPRISE SUPPLIER PAYMENTS & SETTLEMENT HUB (SUPPLIER RECEIVING UI)
   ══════════════════════════════════════════════════════════════════════ */

:root {
  --sp-primary: #15803D;
  --sp-primary-hover: #166534;
  --sp-text-dark: #0F172A;
  --sp-text-muted: #64748B;
  --sp-border: #EEF2F7;
  --sp-radius-lg: 24px;
  --sp-radius-md: 16px;
}

.dashboard-page,
.dashboard-page * {
  font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
}

/* Outer Workspace Shell */
.dashboard-page.premium-workspace {
  margin: 12px 0 36px !important;
  padding: 28px 30px !important;
  border-radius: 24px !important;
  background: rgba(255, 255, 255, 0.92) !important;
  backdrop-filter: blur(24px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(24px) saturate(180%) !important;
  border: 1px solid rgba(255, 255, 255, 0.95) !important;
  box-shadow:
    0 0 0 1px rgba(15, 23, 42, 0.04),
    0 8px 32px rgba(15, 23, 42, 0.06),
    0 32px 64px rgba(15, 23, 42, 0.04) !important;
  box-sizing: border-box;
}

/* Breadcrumb */
.sp-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #64748B;
  margin-bottom: 12px;
}
.sp-breadcrumb a {
  color: #64748B;
  text-decoration: none;
  transition: color 150ms ease;
}
.sp-breadcrumb a:hover { color: #15803D; }
.sp-breadcrumb i { font-size: 10px; color: #94A3B8; }
.sp-breadcrumb .active { color: #16A34A; font-weight: 700; }

/* Header Row */
.sp-page-intro-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 18px;
  margin-bottom: 24px;
}
.sp-page-title {
  font-size: 30px;
  font-weight: 800;
  color: #0F172A;
  letter-spacing: -0.02em;
  line-height: 1.15;
  margin: 0 0 4px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}
.sp-page-subtitle {
  font-size: 14px;
  color: #64748B;
  margin: 0;
  font-weight: 400;
  max-width: 680px;
  line-height: 1.45;
}

/* Action Buttons */
.sp-page-intro-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.sp-btn-pill {
  height: 42px !important;
  padding: 0 20px !important;
  border-radius: 9999px !important;
  font-size: 13.5px !important;
  font-weight: 700 !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1) !important;
  border: 1px solid #E2E8F0 !important;
  background: #FFFFFF !important;
  color: #0F172A !important;
  cursor: pointer !important;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04) !important;
  text-decoration: none !important;
  white-space: nowrap !important;
}
.sp-btn-pill:hover {
  background: #F8FAFC !important;
  border-color: #CBD5E1 !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08) !important;
  color: #0F172A !important;
}
.sp-btn-pill.sp-btn-primary {
  background: linear-gradient(135deg, #15803D 0%, #16A34A 100%) !important;
  color: #FFFFFF !important;
  border: none !important;
  box-shadow: 0 4px 14px rgba(22, 163, 74, 0.3) !important;
}
.sp-btn-pill.sp-btn-primary:hover {
  background: linear-gradient(135deg, #166534 0%, #15803D 100%) !important;
  transform: translateY(-1.5px) !important;
  box-shadow: 0 6px 18px rgba(22, 163, 74, 0.4) !important;
  color: #FFFFFF !important;
}

/* 4 KPI Cards Grid */
.sp-kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  margin-bottom: 24px;
}
@media (max-width: 1200px) { .sp-kpi-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) { .sp-kpi-grid { grid-template-columns: 1fr; } }

.sp-kpi-card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 18px;
  padding: 20px 22px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.03);
  transition: all 220ms ease;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 136px;
}
.sp-kpi-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.07);
  border-color: #CBD5E1;
}

.sp-kpi-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 4px;
}
.sp-kpi-card.kpi-paid::before { background: linear-gradient(90deg, #10B981, #059669); }
.sp-kpi-card.kpi-pending::before { background: linear-gradient(90deg, #F59E0B, #D97706); }
.sp-kpi-card.kpi-disputed::before { background: linear-gradient(90deg, #EF4444, #DC2626); }
.sp-kpi-card.kpi-total::before { background: linear-gradient(90deg, #3B82F6, #2563EB); }

.sp-kpi-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.sp-kpi-label {
  font-size: 11px;
  font-weight: 800;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.06em;
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
.sp-kpi-icon.orange { background: #FEF3C7; color: #D97706; }
.sp-kpi-icon.red { background: #FEE2E2; color: #DC2626; }
.sp-kpi-icon.blue { background: #EFF6FF; color: #2563EB; }

.sp-kpi-value {
  font-size: 26px;
  font-weight: 900;
  color: #0F172A;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin-bottom: 10px;
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
  gap: 5px;
}
.sp-kpi-badge.green { background: #DCFCE7; color: #15803D; border: 1px solid #86EFAC; }
.sp-kpi-badge.orange { background: #FEF3C7; color: #B45309; border: 1px solid #FDE68A; }
.sp-kpi-badge.red { background: #FEE2E2; color: #DC2626; border: 1px solid #FCA5A5; }
.sp-kpi-badge.blue { background: #EFF6FF; color: #2563EB; border: 1px solid #BFDBFE; }

/* Tabs Bar */
.sp-tabs-wrap {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  border-bottom: 1px solid #E2E8F0;
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
  color: #64748B;
  text-decoration: none;
  border-radius: 10px;
  transition: all 0.15s ease;
  white-space: nowrap;
}
.sp-tab-item:hover { color: #0F172A; background: #F1F5F9; }
.sp-tab-item.active { color: #15803D; background: #DCFCE7; }
.sp-tab-count-badge {
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  background: #F1F5F9;
  color: #475569;
}
.sp-tab-item.active .sp-tab-count-badge { background: #15803D; color: #FFFFFF; }

/* Toolbar & Filters */
.sp-workspace-box {
  background: #FFFFFF;
  border: 1px solid #EEF2F7;
  border-radius: var(--sp-radius-lg);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.02);
  padding: 22px 24px;
}
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
  min-width: 260px;
}
.sp-search-box input {
  width: 100%;
  height: 42px;
  padding: 0 16px 0 40px;
  border-radius: 12px;
  border: 1px solid #E2E8F0;
  font-size: 13px;
  background: #F8FAFC;
  font-weight: 600;
  color: #0F172A;
  outline: none;
  transition: all 150ms ease;
  box-sizing: border-box;
}
.sp-search-box input:focus {
  border-color: #15803D;
  background: #FFFFFF;
  box-shadow: 0 0 0 3px rgba(21, 128, 61, 0.12);
}
.sp-search-box i {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #94A3B8;
  font-size: 14px;
}
.sp-filter-group { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.sp-filter-select {
  height: 42px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid #E2E8F0;
  font-size: 13px;
  font-weight: 700;
  color: #0F172A;
  background: #F8FAFC;
  outline: none;
  cursor: pointer;
}

/* Master Table */
.sp-table-wrapper {
  overflow-x: auto;
  border-radius: var(--sp-radius-md);
  border: 1px solid #EEF2F7;
}
.sp-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 13px;
}
.sp-table th {
  background: #F8FAFC;
  padding: 12px 16px;
  font-size: 11px;
  font-weight: 800;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid #EEF2F7;
  white-space: nowrap;
}
.sp-table td {
  padding: 13px 16px;
  border-bottom: 1px solid #F1F5F9;
  vertical-align: middle;
  color: #0F172A;
}
.sp-table tbody tr:hover { background: #F0FDF4; }

/* Status Badges */
.sp-pay-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  font-weight: 800;
  padding: 4px 11px;
  border-radius: 999px;
  white-space: nowrap;
}
.sp-pay-badge.paid { background: #DCFCE7; color: #15803D; border: 1px solid #86EFAC; }
.sp-pay-badge.partial { background: #FEF3C7; color: #B45309; border: 1px solid #FDE68A; }
.sp-pay-badge.pending { background: #F1F5F9; color: #475569; border: 1px solid #CBD5E1; }
.sp-pay-badge.disputed { background: #FEE2E2; color: #DC2626; border: 1px solid #FCA5A5; }
.sp-pay-badge.overdue { background: #FEE2E2; color: #991B1B; border: 1px solid #F87171; }

.sp-po-pill {
  font-weight: 800;
  font-size: 13.5px;
  color: #0F172A;
  text-decoration: none;
  display: block;
}
.sp-po-pill:hover { color: #15803D; text-decoration: underline; }

/* Modals */
.sp-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(8px);
  z-index: 1050;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: spModalFadeIn 0.15s ease-out;
}
.sp-modal-overlay.show { display: flex; }
@keyframes spModalFadeIn {
  from { opacity: 0; transform: scale(0.97); }
  to { opacity: 1; transform: scale(1); }
}
.sp-modal-box {
  background: #FFFFFF;
  border-radius: 24px;
  max-width: 620px;
  width: 100%;
  padding: 28px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.25);
  max-height: 90vh;
  overflow-y: auto;
}
</style>
@endsection

@section('content')
<div class="dashboard-page premium-workspace">

  <!-- ── 1. Breadcrumb ── -->
  <div class="sp-breadcrumb">
    <a href="{{ route('supplier.dashboard') }}">Dashboard</a>
    <i class="bi bi-chevron-right"></i>
    <span class="active">Payments &amp; Settlements Received</span>
  </div>

  <!-- ── 2. Header Row ── -->
  <div class="sp-page-intro-header">
    <div>
      <h1 class="sp-page-title">Payments &amp; Settlements Received 💳</h1>
      <p class="sp-page-subtitle">Track disbursements credited to your registered bank account, verify settlement UTRs, and audit transaction receipts.</p>
    </div>

    <div class="sp-page-intro-actions">
      <button onclick="openPaymentHistoryModal()" class="sp-btn-pill sp-btn-primary">
        <i class="bi bi-clock-history"></i> 📜 Payment History Log
      </button>
      <a href="{{ route('supplier.payments.statement') }}" target="_blank" class="sp-btn-pill">
        <i class="bi bi-printer"></i> Printable Statement
      </a>
      <a href="{{ route('supplier.payments.export-csv') }}" class="sp-btn-pill">
        <i class="bi bi-download"></i> Export CSV
      </a>
    </div>
  </div>

  <!-- ── Flash Success / Error ── -->
  @if(session('success'))
  <div style="background:#ECFDF5; border:1.5px solid #86EFAC; border-radius:14px; padding:14px 20px; margin-bottom:22px; color:#064E3B; font-weight:700; display:flex; align-items:center; gap:12px;">
    <i class="bi bi-check-circle-fill" style="font-size:20px; color:#15803D;"></i>
    <span>{{ session('success') }}</span>
  </div>
  @endif

  @if(session('error'))
  <div style="background:#FEE2E2; border:1.5px solid #FCA5A5; border-radius:14px; padding:14px 20px; margin-bottom:22px; color:#991B1B; font-weight:700; display:flex; align-items:center; gap:12px;">
    <i class="bi bi-exclamation-octagon-fill" style="font-size:20px; color:#DC2626;"></i>
    <span>{{ session('error') }}</span>
  </div>
  @endif

  <!-- ── 3. Ultra-Luxury 4 KPI Metric Cards ── -->
  <div class="sp-kpi-grid">

    <!-- Card 1: Total Received -->
    <div class="sp-kpi-card kpi-paid">
      <div class="sp-kpi-top">
        <span class="sp-kpi-label">TOTAL DISBURSEMENTS RECEIVED</span>
        <div class="sp-kpi-icon green">
          <i class="bi bi-check-circle-fill"></i>
        </div>
      </div>
      <div class="sp-kpi-value" style="color: #15803D;">
        ₹{{ number_format($totalPaid, 2) }}
      </div>
      <div class="sp-kpi-bottom">
        <span class="sp-kpi-badge green">
          <i class="bi bi-shield-check"></i> Bank Reconciled
        </span>
        <span style="font-size:11.5px; color:#64748B; font-weight:700;">{{ $counts['paid'] }} Settled</span>
      </div>
    </div>

    <!-- Card 2: Pending Receivables -->
    <div class="sp-kpi-card kpi-pending">
      <div class="sp-kpi-top">
        <span class="sp-kpi-label">PENDING RECEIVABLES DUE</span>
        <div class="sp-kpi-icon orange">
          <i class="bi bi-hourglass-split"></i>
        </div>
      </div>
      <div class="sp-kpi-value" style="color: #D97706;">
        ₹{{ number_format($totalPending, 2) }}
      </div>
      <div class="sp-kpi-bottom">
        <span class="sp-kpi-badge orange">
          <i class="bi bi-clock"></i> Awaiting Buyer Transfer
        </span>
        <span style="font-size:11.5px; color:#64748B; font-weight:700;">{{ $counts['pending'] + $counts['partial'] }} Open</span>
      </div>
    </div>

    <!-- Card 3: Supplier Disputes -->
    <div class="sp-kpi-card kpi-disputed">
      <div class="sp-kpi-top">
        <span class="sp-kpi-label">UNPAID / DISPUTED REPORTS</span>
        <div class="sp-kpi-icon red">
          <i class="bi bi-shield-exclamation"></i>
        </div>
      </div>
      <div class="sp-kpi-value" style="color: {{ ($totalDisputed + $totalOverdue) > 0 ? '#DC2626' : '#0F172A' }};">
        {{ $counts['disputed'] }}
      </div>
      <div class="sp-kpi-bottom">
        <span class="sp-kpi-badge red">
          {{ $counts['disputed'] }} Disputes
        </span>
        <span style="font-size:11.5px; color:#64748B; font-weight:700;">{{ $counts['overdue'] }} Overdue</span>
      </div>
    </div>

    <!-- Card 4: Total Transactions -->
    <div class="sp-kpi-card kpi-total">
      <div class="sp-kpi-top">
        <span class="sp-kpi-label">TOTAL PURCHASE ORDERS</span>
        <div class="sp-kpi-icon blue">
          <i class="bi bi-receipt-cutoff"></i>
        </div>
      </div>
      <div class="sp-kpi-value">{{ $counts['all'] }}</div>
      <div class="sp-kpi-bottom">
        <span class="sp-kpi-badge blue">
          <i class="bi bi-check-all"></i> 100% Reconciled
        </span>
        <span style="font-size:11.5px; color:#64748B; font-weight:700;">{{ $counts['history'] ?? 0 }} Vouchers</span>
      </div>
    </div>

  </div>

  <!-- ── 4. Filter Tabs Bar ── -->
  <div class="sp-tabs-wrap">
    <a href="{{ route('supplier.payments', ['status' => 'all']) }}" class="sp-tab-item {{ $currentTab == 'all' ? 'active' : '' }}">
      All Receipts <span class="sp-tab-count-badge">{{ $counts['all'] }}</span>
    </a>
    <a href="{{ route('supplier.payments', ['status' => 'paid']) }}" class="sp-tab-item {{ $currentTab == 'paid' ? 'active' : '' }}">
      Fully Credited <span class="sp-tab-count-badge">{{ $counts['paid'] }}</span>
    </a>
    <a href="{{ route('supplier.payments', ['status' => 'partial']) }}" class="sp-tab-item {{ $currentTab == 'partial' ? 'active' : '' }}">
      Partially Credited <span class="sp-tab-count-badge">{{ $counts['partial'] }}</span>
    </a>
    <a href="{{ route('supplier.payments', ['status' => 'pending']) }}" class="sp-tab-item {{ $currentTab == 'pending' ? 'active' : '' }}">
      Awaiting Payment <span class="sp-tab-count-badge">{{ $counts['pending'] }}</span>
    </a>
    <a href="{{ route('supplier.payments', ['status' => 'disputed']) }}" class="sp-tab-item {{ $currentTab == 'disputed' ? 'active' : '' }}">
      Reported Unpaid <span class="sp-tab-count-badge" style="background:{{ $counts['disputed'] > 0 ? '#FEE2E2' : '#F1F5F9' }}; color:{{ $counts['disputed'] > 0 ? '#DC2626' : '#475569' }};">{{ $counts['disputed'] }}</span>
    </a>
    <a href="javascript:void(0)" onclick="openPaymentHistoryModal()" class="sp-tab-item" style="color:#15803D; font-weight:800;">
      <i class="bi bi-clock-history"></i> Payment History Log <span class="sp-tab-count-badge" style="background:#DCFCE7; color:#15803D;">{{ $counts['history'] ?? 0 }}</span>
    </a>
  </div>

  <!-- ── 5. Master Workspace Container ── -->
  <div class="sp-workspace-box">

    <!-- Search & Filter Controls Toolbar -->
    <form action="{{ route('supplier.payments') }}" method="GET" class="sp-toolbar-row">
      <input type="hidden" name="status" value="{{ $currentTab }}">
      
      <!-- Search Input -->
      <div class="sp-search-box">
        <i class="bi bi-search"></i>
        <input type="text" name="search" value="{{ request('search') }}" placeholder="Search payment ref, PO code, UTR, or bank note...">
      </div>

      <!-- Filter Controls Group -->
      <div class="sp-filter-group">
        <!-- Status Filter Dropdown -->
        <select name="status" class="sp-filter-select" onchange="this.form.submit()">
          <option value="all" {{ $currentTab == 'all' ? 'selected' : '' }}>Status: All</option>
          <option value="paid" {{ $currentTab == 'paid' ? 'selected' : '' }}>Status: Paid / Settled</option>
          <option value="partial" {{ $currentTab == 'partial' ? 'selected' : '' }}>Status: Partially Paid</option>
          <option value="pending" {{ $currentTab == 'pending' ? 'selected' : '' }}>Status: Awaiting Payment</option>
          <option value="disputed" {{ $currentTab == 'disputed' ? 'selected' : '' }}>Status: Disputed</option>
        </select>

        <!-- Method Dropdown -->
        <select name="method" class="sp-filter-select" onchange="this.form.submit()">
          <option value="">Method: All</option>
          <option value="bank">Bank Transfer (NEFT/RTGS)</option>
          <option value="upi">UPI / NetBanking</option>
          <option value="cash">Cash</option>
          <option value="cheque">Cheque</option>
        </select>

        <!-- Sort Dropdown -->
        <select name="sort" class="sp-filter-select" onchange="this.form.submit()">
          <option value="newest" {{ request('sort') == 'newest' ? 'selected' : '' }}>Sort: Newest</option>
          <option value="oldest" {{ request('sort') == 'oldest' ? 'selected' : '' }}>Sort: Oldest</option>
          <option value="amount" {{ request('sort') == 'amount' ? 'selected' : '' }}>Sort: Amount</option>
        </select>

        <a href="{{ route('supplier.payments') }}" class="sp-btn-pill" style="height:42px;">
          <i class="bi bi-arrow-counterclockwise"></i> Reset
        </a>
      </div>
    </form>

    <!-- Master Table -->
    <div class="sp-table-wrapper">
      <table class="sp-table">
        <thead>
          <tr>
            <th>PAYMENT REF</th>
            <th>PO / INVOICE</th>
            <th>DATE</th>
            <th style="text-align:right;">DISBURSED (₹)</th>
            <th style="text-align:right;">PENDING DUE (₹)</th>
            <th>PAYMENT METHOD &amp; UTR</th>
            <th style="text-align:center;">STATUS</th>
            <th style="text-align:right; padding-right:16px;">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          @forelse($filteredPayments as $p)
          <tr>
            <td>
              <div style="font-weight: 800; color: #1D4ED8; font-family: monospace; font-size: 13.5px; background: #EFF6FF; border: 1px solid #BFDBFE; display: inline-block; padding: 2px 8px; border-radius: 6px;">
                {{ $p->txn_id ? ('SP-' . str_pad($p->id, 4, '0', STR_PAD_LEFT)) : ('SP-' . $p->id) }}
              </div>
              <div style="font-size:11px; color:#64748B; font-family:monospace; margin-top:3px;">
                Ref: {{ $p->txn_id }}
              </div>
            </td>
            <td>
              <a href="{{ route('supplier.purchase-orders.show', $p->id) }}" class="sp-po-pill">
                {{ $p->po_reference }}
              </a>
              <div style="font-size:11px; color:#15803D; font-weight:700; display:flex; align-items:center; gap:4px; margin-top:2px;">
                <i class="bi bi-box-seam"></i> Received in Store ({{ $p->item_count }} items)
              </div>
            </td>
            <td>
              <span style="font-weight:700; color:#334155; font-size:12.5px;">{{ $p->po_date }}</span>
            </td>
            <td style="text-align:right;">
              <div style="font-weight:900; font-size:14px; color:#15803D;">
                ₹{{ number_format($p->paid_amount, 2) }}
              </div>
              @if($p->tds > 0)
              <div style="font-size:10.5px; color:#64748B; font-weight:600;">Net: ₹{{ number_format($p->net_paid, 2) }}</div>
              @endif
            </td>
            <td style="text-align:right;">
              <div style="font-weight:800; font-size:13.5px; color:{{ $p->outstanding > 0 ? '#DC2626' : '#64748B' }};">
                ₹{{ number_format($p->outstanding, 2) }}
              </div>
            </td>
            <td>
              <div style="display:flex; align-items:center; gap:6px; font-size:12.5px; font-weight:700; color:#0F172A;">
                <i class="bi bi-bank2" style="color:#15803D;"></i>
                {{ $p->payment_type }}
              </div>
              <div style="font-size:11px; color:#2563EB; font-family:monospace; font-weight:700; margin-top:2px;">
                {{ $p->txn_id }}
              </div>
            </td>
            <td style="text-align:center;">
              @if($p->status === 'Paid')
                <span class="sp-pay-badge paid">
                  <i class="bi bi-check-circle-fill"></i> Credited
                </span>
              @elseif($p->status === 'Partial')
                <span class="sp-pay-badge partial">
                  <i class="bi bi-pie-chart-fill"></i> Partial
                </span>
              @elseif($p->status === 'Disputed')
                <span class="sp-pay-badge disputed" title="{{ $p->dispute_reason }}">
                  <i class="bi bi-exclamation-octagon-fill"></i> Unpaid Dispute
                </span>
              @else
                <span class="sp-pay-badge pending">
                  <i class="bi bi-hourglass-split"></i> Awaiting Transfer
                </span>
              @endif
            </td>
            <td style="text-align:right; padding-right:16px;">
              <div style="display:flex; align-items:center; justify-content:flex-end; gap:6px;">
                <button onclick="viewPoAudit({{ $p->id }}, '{{ $p->po_reference }}', '{{ $p->txn_id }}', '{{ $p->payment_type }}', {{ $p->gross_amount }}, {{ $p->paid_amount }}, '{{ $p->status }}')" class="btn btn-sm btn-light" style="border-radius:8px; border:1px solid #E2E8F0; padding:5px 10px; font-weight:700; font-size:12px;" title="View Settlement Voucher">
                  <i class="bi bi-eye"></i> View Voucher
                </button>
                <button onclick="openDisputeModal({{ $p->id }}, '{{ $p->po_reference }}')" class="btn btn-sm btn-light text-danger" style="border-radius:8px; border:1px solid #E2E8F0; padding:5px 10px; font-weight:700; font-size:12px;" title="Report Payment Issue">
                  <i class="bi bi-shield-exclamation"></i> Dispute
                </button>
              </div>
            </td>
          </tr>
          @empty
          <tr>
            <td colspan="8" style="text-align:center; padding:36px; color:#94A3B8;">
              <i class="bi bi-credit-card" style="font-size:32px; color:#CBD5E1; display:block; margin-bottom:8px;"></i>
              No payments found matching your filter criteria.
            </td>
          </tr>
          @endforelse
        </tbody>
      </table>
    </div>

  </div>

</div>

<!-- ══════════════════════════════════════════════════════════════════════
     MODAL 1: PAYMENT HISTORY & AUDIT TRAIL
     ══════════════════════════════════════════════════════════════════════ -->
<div class="sp-modal-overlay" id="paymentHistoryModal">
  <div class="sp-modal-box" style="max-width:720px;">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; padding-bottom:14px; border-bottom:1px solid #EEF2F7;">
      <div>
        <h3 style="font-size:18px; font-weight:800; color:#0F172A; margin:0 0 2px 0;">📜 Payment Transaction History &amp; Settlement Vouchers</h3>
        <p style="font-size:12.5px; color:#64748B; margin:0;">Complete chronological record of all disbursements credited to your bank account.</p>
      </div>
      <button onclick="closePaymentHistoryModal()" style="background:#F1F5F9; border:none; border-radius:10px; width:32px; height:32px; font-weight:800; color:#64748B; cursor:pointer;">✕</button>
    </div>

    <div style="max-height:420px; overflow-y:auto; padding-right:4px;">
      @forelse($paymentHistory as $item)
      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:14px; padding:14px 16px; margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-weight:900; color:#1D4ED8; font-family:monospace; font-size:14px; background:#EFF6FF; border:1px solid #BFDBFE; padding:2px 8px; border-radius:6px;">
                {{ $item->payment_ref }}
              </span>
              <span class="sp-pay-badge paid" style="font-size:10.5px; padding:2px 8px;">
                <i class="bi bi-check-circle-fill"></i> Credited
              </span>
            </div>
            <div style="font-size:12px; color:#334155; font-weight:700; margin-top:6px;">
              Purchase Order: <strong>{{ optional($item->purchase)->reference_code ?: ('PO-' . $item->purchase_id) }}</strong>
            </div>
            <div style="font-size:11.5px; color:#64748B; font-family:monospace; margin-top:2px;">
              Bank UTR / Txn Ref: <strong>{{ $item->txn_id }}</strong> &bull; Method: {{ $item->payment_type }}
            </div>
          </div>

          <div style="text-align:right;">
            <div style="font-size:16px; font-weight:900; color:#15803D;">
              ₹{{ number_format($item->amount, 2) }}
            </div>
            <div style="font-size:11px; color:#94A3B8; margin-top:2px;">
              {{ $item->payment_date ? \Carbon\Carbon::parse($item->payment_date)->format('d M Y') : $item->created_at->format('d M Y') }}
            </div>
            @if($item->receipt_url)
            <a href="{{ asset('storage/'.$item->receipt_url) }}" target="_blank" style="font-size:11.5px; color:#2563EB; font-weight:700; text-decoration:none; display:inline-block; margin-top:4px;">
              <i class="bi bi-file-earmark-pdf"></i> View Bank Slip
            </a>
            @endif
          </div>
        </div>
      </div>
      @empty
      <div style="text-align:center; padding:36px; color:#94A3B8;">
        <i class="bi bi-clock-history" style="font-size:36px; color:#CBD5E1; display:block; margin-bottom:8px;"></i>
        No payment history records found yet.
      </div>
      @endforelse
    </div>

    <div style="display:flex; justify-content:flex-end; margin-top:16px; padding-top:14px; border-top:1px solid #EEF2F7;">
      <button onclick="closePaymentHistoryModal()" class="sp-btn-pill">Close</button>
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════════════════════════════════════
     MODAL 2: VIEW SETTLEMENT VOUCHER DETAILS
     ══════════════════════════════════════════════════════════════════════ -->
<div class="sp-modal-overlay" id="auditModal">
  <div class="sp-modal-box">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid #EEF2F7;">
      <h3 style="font-size:17px; font-weight:800; color:#0F172A; margin:0;" id="auditModalTitle">Settlement Voucher Details</h3>
      <button onclick="closeAuditModal()" style="background:#F1F5F9; border:none; border-radius:8px; width:28px; height:28px; font-weight:800; color:#64748B; cursor:pointer;">✕</button>
    </div>
    <div id="auditModalBody" style="font-size:13px; color:#334155; line-height:1.6;">
      <!-- Dynamic Info -->
    </div>
    <div style="display:flex; justify-content:flex-end; margin-top:18px;">
      <button onclick="closeAuditModal()" class="sp-btn-pill">Close</button>
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════════════════════════════════════
     MODAL 3: REPORT PAYMENT ISSUE / UNPAID DISPUTE
     ══════════════════════════════════════════════════════════════════════ -->
<div class="sp-modal-overlay" id="disputeModal">
  <div class="sp-modal-box">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid #EEF2F7;">
      <h3 style="font-size:17px; font-weight:800; color:#DC2626; margin:0;">⚠️ Report Payment Dispute / Uncredited Amount</h3>
      <button onclick="closeDisputeModal()" style="background:#F1F5F9; border:none; border-radius:8px; width:28px; height:28px; font-weight:800; color:#64748B; cursor:pointer;">✕</button>
    </div>
    <form id="disputeForm" action="" method="POST">
      @csrf
      <div style="margin-bottom:16px;">
        <label style="font-size:12.5px; font-weight:700; color:#334155; display:block; margin-bottom:6px;">
          Reason for Dispute / Unpaid Report <span style="color:#DC2626;">*</span>
        </label>
        <textarea name="dispute_reason" class="form-control" rows="3" required placeholder="Please explain why the payment is uncredited or describe the amount difference in your bank statement..." style="border-radius:12px; font-size:13px;"></textarea>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" onclick="closeDisputeModal()" class="sp-btn-pill">Cancel</button>
        <button type="submit" class="sp-btn-pill" style="background:#DC2626; color:#FFFFFF; border:none;">
          Submit Dispute to Buyer Finance
        </button>
      </div>
    </form>
  </div>
</div>

<script>
function openPaymentHistoryModal() {
  document.getElementById('paymentHistoryModal').classList.add('show');
}
function closePaymentHistoryModal() {
  document.getElementById('paymentHistoryModal').classList.remove('show');
}

function viewPoAudit(id, ref, txn, method, gross, paid, status) {
  document.getElementById('auditModalTitle').innerText = 'Settlement Voucher: ' + ref;
  document.getElementById('auditModalBody').innerHTML = `
    <div style="background:#F8FAFC; border-radius:12px; padding:14px; margin-bottom:12px; border:1px solid #E2E8F0;">
      <div style="margin-bottom:6px;"><strong>Purchase Order:</strong> ${ref}</div>
      <div style="margin-bottom:6px;"><strong>Bank UTR / Txn Reference:</strong> <span style="font-family:monospace; color:#2563EB; font-weight:700;">${txn}</span></div>
      <div style="margin-bottom:6px;"><strong>Payment Method:</strong> ${method}</div>
      <div style="margin-bottom:6px;"><strong>Gross Order Value:</strong> ₹${gross.toFixed(2)}</div>
      <div style="margin-bottom:6px;"><strong>Disbursed to Bank:</strong> <span style="color:#15803D; font-weight:800;">₹${paid.toFixed(2)}</span></div>
      <div><strong>Status:</strong> <span style="font-weight:700; color:#15803D;">${status}</span></div>
    </div>
  `;
  document.getElementById('auditModal').classList.add('show');
}

function closeAuditModal() {
  document.getElementById('auditModal').classList.remove('show');
}

function openDisputeModal(id, ref) {
  const form = document.getElementById('disputeForm');
  form.action = '/supplier/payments/' + id + '/dispute';
  document.getElementById('disputeModal').classList.add('show');
}

function closeDisputeModal() {
  document.getElementById('disputeModal').classList.remove('show');
}
</script>
@endsection