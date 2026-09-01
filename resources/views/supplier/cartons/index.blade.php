@extends('supplier.layout')

@section('title', 'Cartons & LPN Barcode Hub — Supplier Portal | Suguna')

@section('head')
<!-- Real-Time Barcode & QR Code Engine -->
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>

<style>
/* ══════════════════════════════════════════════════════════════════════
   ENTERPRISE CARTONS & LPN BARCODE HUB (LUXURY APPLE / SAAS STANDARD)
   ══════════════════════════════════════════════════════════════════════ */

:root {
  --sp-primary: #15803D;
  --sp-primary-hover: #166534;
  --sp-primary-light: #DCFCE7;
  --sp-text-dark: #0F172A;
  --sp-text-muted: #64748B;
  --sp-text-light: #94A3B8;
  --sp-border: #EEF2F7;
  --sp-bg-light: #F8FAFC;
  --sp-radius-lg: 24px;
  --sp-radius-md: 16px;
  --sp-radius-sm: 10px;
}

.dashboard-page,
.dashboard-page * {
  font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
}

/* Outer Workspace Shell */
.dashboard-page.premium-workspace {
  margin: 12px 0 36px !important;
  padding: 28px 30px !important;
  border-radius: 24px !important;
  background: rgba(255, 255, 255, 0.88) !important;
  backdrop-filter: blur(24px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(24px) saturate(180%) !important;
  border: 1px solid rgba(255, 255, 255, 0.95) !important;
  box-shadow:
    0 0 0 1px rgba(15, 23, 42, 0.04),
    0 8px 32px rgba(15, 23, 42, 0.06),
    0 32px 64px rgba(15, 23, 42, 0.04) !important;
  box-sizing: border-box;
}

/* ── Breadcrumb ── */
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
.sp-breadcrumb a:hover {
  color: #15803D;
}
.sp-breadcrumb i {
  font-size: 10px;
  color: #94A3B8;
}
.sp-breadcrumb .active {
  color: #16A34A;
  font-weight: 700;
}

/* ── Header Row ── */
.sp-page-intro-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 18px;
  margin-bottom: 24px;
}

.sp-page-title {
  font-size: 34px;
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
  font-size: 14.5px;
  color: #64748B;
  margin: 0;
  font-weight: 400;
  max-width: 680px;
  line-height: 1.45;
}

/* ── Action Buttons ── */
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
  line-height: 1 !important;
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

/* ── 4 Luxury KPI Cards Grid ── */
.sp-kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}
@media (max-width: 1100px) { .sp-kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 600px) { .sp-kpi-grid { grid-template-columns: 1fr; } }

.sp-kpi-card {
  background: #FFFFFF;
  border: 1px solid #EEF2F7;
  border-radius: 20px;
  padding: 20px 22px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
}

.sp-kpi-card:hover {
  transform: translateY(-2px);
  border-color: #E2E8F0;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.06);
}

.sp-kpi-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.sp-kpi-label {
  font-size: 13px;
  font-weight: 700;
  color: #64748B;
}

.sp-kpi-icon-box {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}
.sp-kpi-icon-box.green { background: #DCFCE7; color: #15803D; }
.sp-kpi-icon-box.blue { background: #EFF6FF; color: #2563EB; }
.sp-kpi-icon-box.orange { background: #FEF3C7; color: #D97706; }
.sp-kpi-icon-box.purple { background: #F3E8FF; color: #7E22CE; }

.sp-kpi-value-wrap {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 12px;
}

.sp-kpi-value {
  font-size: 32px;
  font-weight: 900;
  color: #0F172A;
  letter-spacing: -0.03em;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.sp-kpi-unit {
  font-size: 15px;
  font-weight: 800;
  color: #64748B;
}

.sp-kpi-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid #F8FAFC;
}

.sp-kpi-badge {
  font-size: 11px;
  font-weight: 800;
  padding: 3px 9px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.sp-kpi-badge.green { background: #ECFDF5; color: #059669; border: 1px solid #A7F3D0; }
.sp-kpi-badge.blue { background: #EFF6FF; color: #2563EB; border: 1px solid #BFDBFE; }
.sp-kpi-badge.orange { background: #FFFBEB; color: #D97706; border: 1px solid #FDE68A; }
.sp-kpi-badge.purple { background: #FAF5FF; color: #7E22CE; border: 1px solid #E9D5FF; }

/* ── Main Workspace Card ── */
.sp-workspace-card {
  background: #FFFFFF;
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-lg);
  padding: 24px;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.02);
}

/* Filter Bar */
.sp-filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 20px;
}

.sp-search-box {
  position: relative;
  flex: 1;
  min-width: 280px;
  max-width: 480px;
}

.sp-search-input {
  width: 100%;
  height: 42px;
  padding: 0 16px 0 42px;
  border-radius: 12px;
  border: 1px solid #E2E8F0;
  background: #F8FAFC;
  font-size: 13.5px;
  font-weight: 500;
  color: #0F172A;
  outline: none;
  transition: all 180ms ease;
  box-sizing: border-box;
}

.sp-search-input:focus {
  border-color: #16A34A;
  background: #FFFFFF;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.12);
}

.sp-search-icon {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #94A3B8;
  font-size: 15px;
  pointer-events: none;
}

.sp-filter-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.sp-select-sm {
  height: 42px;
  padding: 0 16px;
  border-radius: 12px;
  border: 1px solid #E2E8F0;
  background: #FFFFFF;
  font-size: 13px;
  font-weight: 700;
  color: #334155;
  cursor: pointer;
  outline: none;
  transition: all 150ms ease;
}

.sp-select-sm:focus {
  border-color: #16A34A;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
}

.sp-view-toggle {
  display: flex;
  background: #F1F5F9;
  padding: 3px;
  border-radius: 10px;
  gap: 2px;
}

.sp-view-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #64748B;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 150ms ease;
  font-size: 15px;
}

.sp-view-btn.active {
  background: #FFFFFF;
  color: #15803D;
  box-shadow: 0 2px 5px rgba(15, 23, 42, 0.08);
}

/* Bulk Selection Action Bar */
.sp-bulk-bar {
  display: none;
  align-items: center;
  justify-content: space-between;
  background: #ECFDF5;
  border: 1.5px solid #86EFAC;
  border-radius: 14px;
  padding: 12px 18px;
  margin-bottom: 16px;
}
.sp-bulk-bar.show { display: flex; }

/* ── Luxury Table ── */
.sp-table-wrap {
  overflow-x: auto;
  border-radius: 16px;
  border: 1px solid #EEF2F7;
  background: #FFFFFF;
}

.sp-lux-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.sp-lux-table th {
  background: #F8FAFC;
  padding: 14px 18px;
  font-size: 11.5px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748B;
  border-bottom: 1px solid #EEF2F7;
  white-space: nowrap;
}

.sp-lux-table td {
  padding: 16px 18px;
  font-size: 13.5px;
  color: #0F172A;
  border-bottom: 1px solid #F1F5F9;
  vertical-align: middle;
}

.sp-lux-table tbody tr {
  transition: background 150ms ease;
}

.sp-lux-table tbody tr:hover {
  background: #F8FAFC;
}

.sp-lux-table tbody tr:last-child td {
  border-bottom: none;
}

/* LPN Code & Specs */
.sp-lpn-code-pill {
  background: #F0FDF4;
  color: #15803D;
  border: 1px solid #BBF7D0;
  font-family: monospace;
  font-weight: 800;
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 150ms ease;
}
.sp-lpn-code-pill:hover {
  background: #DCFCE7;
  border-color: #86EFAC;
}

.sp-box-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 800;
  background: #F1F5F9;
  color: #334155;
  border: 1px solid #E2E8F0;
}

.sp-po-pill {
  background: #EFF6FF;
  color: #1D4ED8;
  border: 1px solid #BFDBFE;
  font-family: monospace;
  font-weight: 800;
  font-size: 12px;
  padding: 3px 9px;
  border-radius: 8px;
  display: inline-block;
  text-decoration: none;
}
.sp-po-pill:hover {
  background: #DBEAFE;
  color: #1E40AF;
}

/* Workflow Status Badges */
.sp-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}
.sp-status-pill.transit { background: #EFF6FF; color: #1D4ED8; border: 1px solid #BFDBFE; }
.sp-status-pill.ready { background: #FEF3C7; color: #B45309; border: 1px solid #FDE68A; }
.sp-status-pill.received { background: #ECFDF5; color: #059669; border: 1px solid #A7F3D0; }
.sp-status-pill.completed { background: #DCFCE7; color: #15803D; border: 1px solid #86EFAC; }
.sp-status-pill.progress { background: #FAF5FF; color: #7E22CE; border: 1px solid #E9D5FF; }

.sp-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
  display: inline-block;
}
.sp-status-pill.transit .sp-status-dot {
  animation: pulseDot 1.5s infinite;
}
@keyframes pulseDot {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.8; }
}

/* Action Buttons */
.sp-action-btn-group {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
}

.sp-action-btn {
  height: 34px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid #E2E8F0;
  background: #FFFFFF;
  color: #475569;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  justify-content: center;
  cursor: pointer;
  transition: all 150ms ease;
  text-decoration: none;
  font-size: 12px;
  font-weight: 700;
}

.sp-action-btn:hover {
  background: #F8FAFC;
  color: #0F172A;
  border-color: #CBD5E1;
  transform: translateY(-1px);
}

.sp-action-btn.print {
  background: #ECFDF5;
  color: #15803D;
  border-color: #86EFAC;
}

.sp-action-btn.print:hover {
  background: #15803D;
  color: #FFFFFF;
  border-color: #15803D;
}

/* ── Grid / Cards View ── */
.sp-carton-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 18px;
  margin-top: 10px;
}

.sp-carton-card {
  background: #FFFFFF;
  border: 1.5px solid #E2E8F0;
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.02);
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.sp-carton-card:hover {
  transform: translateY(-3px);
  border-color: #CBD5E1;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.07);
}

/* Slide Drawer / Modals */
.sp-modal-overlay {
  position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
  background: rgba(15, 23, 42, 0.6) !important;
  backdrop-filter: blur(4px) !important;
  z-index: 99998 !important;
  display: none;
  align-items: center !important;
  justify-content: center !important;
  padding: 20px !important;
}
.sp-modal-overlay.show { display: flex !important; }

.sp-modal-box {
  background: #FFFFFF !important;
  border-radius: 22px !important;
  width: 100% !important;
  max-width: 580px !important;
  max-height: 90vh !important;
  overflow-y: auto !important;
  padding: 28px !important;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
  z-index: 99999 !important;
}
</style>
@endsection

@section('content')

<div class="dashboard-page premium-workspace">

  <!-- ── 1. Breadcrumb Navigation ── -->
  <div class="sp-breadcrumb">
    <a href="{{ route('supplier.dashboard') }}">Dashboard</a>
    <i class="bi bi-chevron-right"></i>
    <span class="active">Cartons &amp; LPN Barcode Hub</span>
  </div>

  <!-- ── 2. Top Header Row (Title & Enterprise Action Pills) ── -->
  <div class="sp-page-intro-header">
    <div>
      <h1 class="sp-page-title">Cartons &amp; LPN Barcode Hub 📦</h1>
      <p class="sp-page-subtitle">Manage packed shipping cartons, License Plate Numbers (LPN), GS1-128 scannables, and 4x6" thermal dispatch labels.</p>
    </div>

    <div class="sp-page-intro-actions">
      <a href="{{ route('supplier.asn.create', 1) }}" class="sp-btn-pill sp-btn-primary">
        <i class="bi bi-plus-lg"></i> Pack New Carton
      </a>
      <a href="{{ route('supplier.asn.index') }}" class="sp-btn-pill">
        <i class="bi bi-truck"></i> View ASNs
      </a>
      <button type="button" class="sp-btn-pill" onclick="printAllLabelsBatch()">
        <i class="bi bi-printer"></i> Print All LPN Labels
      </button>
      <button type="button" class="sp-btn-pill" onclick="location.reload()" title="Refresh Data">
        <i class="bi bi-arrow-clockwise"></i> Refresh
      </button>
    </div>
  </div>

  <!-- ── 3. 4 Luxury KPI Summary Cards Grid ── -->
  <div class="sp-kpi-grid">

    <!-- Card 1: Total Cartons -->
    <div class="sp-kpi-card">
      <div class="sp-kpi-top">
        <span class="sp-kpi-label">Total Cartons</span>
        <div class="sp-kpi-icon-box green">
          <i class="bi bi-box-seam"></i>
        </div>
      </div>
      <div class="sp-kpi-value-wrap">
        <span class="sp-kpi-value">{{ $totalCartons }}</span>
        <span class="sp-kpi-unit">Boxes</span>
      </div>
      <div class="sp-kpi-bottom">
        <span class="sp-kpi-badge green">✓ Real Database Data</span>
        <svg width="60" height="24" viewBox="0 0 60 24" fill="none">
          <path d="M2 18 L15 14 L30 16 L45 8 L58 4" stroke="#16A34A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
          <circle cx="58" cy="4" r="3" fill="#16A34A" />
        </svg>
      </div>
    </div>

    <!-- Card 2: Total Units Packed -->
    <div class="sp-kpi-card">
      <div class="sp-kpi-top">
        <span class="sp-kpi-label">Total Units Packed</span>
        <div class="sp-kpi-icon-box blue">
          <i class="bi bi-123"></i>
        </div>
      </div>
      <div class="sp-kpi-value-wrap">
        <span class="sp-kpi-value">{{ number_format($totalUnits) }}</span>
        <span class="sp-kpi-unit">Units</span>
      </div>
      <div class="sp-kpi-bottom">
        <span class="sp-kpi-badge blue">In Packed Cartons</span>
        <svg width="60" height="24" viewBox="0 0 60 24" fill="none">
          <path d="M2 20 L18 16 L35 12 L58 6" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
          <circle cx="58" cy="6" r="3" fill="#2563EB" />
        </svg>
      </div>
    </div>

    <!-- Card 3: Gross Weight -->
    <div class="sp-kpi-card">
      <div class="sp-kpi-top">
        <span class="sp-kpi-label">Gross Weight</span>
        <div class="sp-kpi-icon-box orange">
          <i class="bi bi-speedometer2"></i>
        </div>
      </div>
      <div class="sp-kpi-value-wrap">
        <span class="sp-kpi-value">{{ number_format($totalWeight, 1) }}</span>
        <span class="sp-kpi-unit">KG</span>
      </div>
      <div class="sp-kpi-bottom">
        <span class="sp-kpi-badge orange">Shipment Mass</span>
        <svg width="60" height="24" viewBox="0 0 60 24" fill="none">
          <path d="M2 16 L16 18 L32 10 L46 14 L58 6" stroke="#D97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
          <circle cx="58" cy="6" r="3" fill="#D97706" />
        </svg>
      </div>
    </div>

    <!-- Card 4: Active / Ready for Dispatch -->
    <div class="sp-kpi-card">
      <div class="sp-kpi-top">
        <span class="sp-kpi-label">Ready for Dispatch</span>
        <div class="sp-kpi-icon-box purple">
          <i class="bi bi-tag"></i>
        </div>
      </div>
      <div class="sp-kpi-value-wrap">
        <span class="sp-kpi-value">{{ $readyCount }}</span>
        <span class="sp-kpi-unit">Awaiting</span>
      </div>
      <div class="sp-kpi-bottom">
        <span class="sp-kpi-badge purple">Active Flow</span>
        <svg width="60" height="24" viewBox="0 0 60 24" fill="none">
          <path d="M2 18 L18 16 L34 12 L58 4" stroke="#9333EA" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
          <circle cx="58" cy="4" r="3" fill="#9333EA" />
        </svg>
      </div>
    </div>

  </div>

  <!-- ── 4. Main Luxury Workspace Container ── -->
  <div class="sp-workspace-card">

    <!-- Search & Filter Toolbar -->
    <div class="sp-filter-bar">
      <div class="sp-search-box">
        <i class="bi bi-search sp-search-icon"></i>
        <input type="text" id="cartonSearch" class="sp-search-input" placeholder="Search by LPN Barcode, Carton #, PO Reference, SKU..." onkeyup="filterCartons()">
      </div>

      <div class="sp-filter-controls">
        <select class="sp-select-sm" id="statusFilter" onchange="filterCartons()">
          <option value="ALL">Status: All</option>
          <option value="In Transit">In Transit</option>
          <option value="Ready for Dispatch">Ready for Dispatch</option>
          <option value="Received at WH">Received at WH</option>
          <option value="Putaway In Progress">Putaway In Progress</option>
          <option value="Putaway Completed">Putaway Completed</option>
        </select>

        <select class="sp-select-sm" id="sortFilter" onchange="sortCartonsTable()">
          <option value="newest">Sort: Newest</option>
          <option value="oldest">Sort: Oldest</option>
          <option value="weight_desc">Weight: High to Low</option>
          <option value="weight_asc">Weight: Low to High</option>
        </select>

        <div class="sp-view-toggle">
          <button type="button" class="sp-view-btn active" id="btnTableView" onclick="switchView('table')" title="Table View">
            <i class="bi bi-list-task"></i>
          </button>
          <button type="button" class="sp-view-btn" id="btnGridView" onclick="switchView('grid')" title="Visual Cards View">
            <i class="bi bi-grid-fill"></i>
          </button>
        </div>

        <a href="{{ route('supplier.cartons.index') }}" class="sp-btn-pill" style="height:42px; padding:0 16px; font-size:13px;" title="Reset Filters">
          <i class="bi bi-arrow-counterclockwise"></i> Reset
        </a>
      </div>
    </div>

    <!-- Bulk Action Bar -->
    <div class="sp-bulk-bar" id="bulkActionBar">
      <div style="display:flex; align-items:center; gap:10px;">
        <i class="bi bi-check2-circle" style="font-size:20px; color:#15803D;"></i>
        <span style="font-size:13px; font-weight:800; color:#064E3B;" id="bulkSelectedText">0 Cartons Selected</span>
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        <button type="button" class="sp-btn-pill sp-btn-primary" style="height:36px; padding:0 16px; font-size:12.5px;" onclick="printSelectedLabels()">
          <i class="bi bi-printer-fill"></i> Print Selected Labels
        </button>
        <button type="button" class="sp-btn-pill" style="height:36px; padding:0 14px; font-size:12.5px;" onclick="deselectAllCartons()">
          Deselect All
        </button>
      </div>
    </div>

    <!-- ── TABLE VIEW ── -->
    <div class="sp-table-wrap" id="tableViewContainer">
      <table class="sp-lux-table" id="cartonsTable">
        <thead>
          <tr>
            <th style="width: 36px;"><input type="checkbox" class="form-check-input" id="cartonSelectAll" onclick="toggleSelectAllCartons(this)" style="cursor:pointer; width:16px; height:16px;"></th>
            <th>CARTON &amp; LPN BARCODE</th>
            <th>CARTON TYPE</th>
            <th>PO &amp; WAREHOUSE</th>
            <th>ENCLOSED ITEMS</th>
            <th>GROSS WEIGHT</th>
            <th>STATUS</th>
            <th style="text-align: right;">ACTIONS</th>
          </tr>
        </thead>
        <tbody id="cartonsTableBody">
          @forelse($cartons as $index => $c)
          @php
            $poRef = optional($c->purchase)->reference_code ?: ('PO-2026-' . str_pad($c->purchase_id, 6, '0', STR_PAD_LEFT));
            $whName = optional(optional($c->purchase)->warehouse)->name ?: 'Suguna Warehouse';
            $itemsCount = $c->items->count();
            $unitsCount = $c->items->sum('packed_quantity');

            $effStatus = $c->status;
            $asnStatus = optional($c->asn)->status;

            if (in_array($effStatus, ['Putaway Completed', 'putaway_completed', 'completed']) || in_array($asnStatus, ['putaway_completed', 'completed'])) {
                $statusLabel = 'Putaway Completed';
                $statusPillClass = 'completed';
            } elseif (in_array($effStatus, ['Putaway In Progress', 'putaway_in_progress']) || $asnStatus === 'receiving') {
                $statusLabel = 'Putaway In Progress';
                $statusPillClass = 'progress';
            } elseif (in_array($effStatus, ['Received', 'Received at WH', 'arrived', 'verified', 'received']) || in_array($asnStatus, ['arrived', 'verified', 'received'])) {
                $statusLabel = 'Received at WH';
                $statusPillClass = 'received';
            } elseif (in_array($effStatus, ['In Transit', 'in_transit', 'dispatched']) || in_array($asnStatus, ['dispatched', 'in_transit'])) {
                $statusLabel = 'In Transit';
                $statusPillClass = 'transit';
            } else {
                $statusLabel = 'Ready for Dispatch';
                $statusPillClass = 'ready';
            }
          @endphp
          <tr class="carton-row-item" data-carton-id="{{ $c->id }}" data-lpn="{{ strtolower($c->lpn_number) }}" data-carton="{{ strtolower($c->carton_number) }}" data-po="{{ strtolower($poRef) }}" data-status="{{ $statusLabel }}" data-weight="{{ (float)$c->weight }}">
            <td>
              <input type="checkbox" class="form-check-input carton-row-cb" value="{{ $c->id }}" onchange="handleCartonSelection()" style="cursor:pointer; width:16px; height:16px;">
            </td>
            <td>
              <div style="font-weight: 800; color: #0F172A; font-size: 14px; display:flex; align-items:center; gap:6px;">
                <span>📦 {{ $c->carton_number }}</span>
              </div>
              <div style="margin-top: 5px;">
                <span class="sp-lpn-code-pill" onclick="copyToClipboard('{{ $c->lpn_number }}')" title="Click to Copy LPN">
                  <i class="bi bi-upc-scan"></i> {{ $c->lpn_number }}
                  <i class="bi bi-copy" style="font-size:10px; color:#16A34A;"></i>
                </span>
              </div>
            </td>
            <td>
              <span class="sp-box-badge">{{ $c->carton_type }}</span>
              <div style="font-size: 11.5px; color: #64748B; margin-top: 4px; font-weight: 600;">{{ $c->dimensions }}</div>
            </td>
            <td>
              <a href="{{ $c->asn_id ? route('supplier.asn.show', $c->asn_id) : route('supplier.asn.create', $c->purchase_id) }}" class="sp-po-pill" title="View Linked PO & ASN">
                {{ $poRef }}
              </a>
              <div style="font-size: 11.5px; color: #64748B; margin-top: 3px; font-weight: 600; display:flex; align-items:center; gap:4px;">
                <i class="bi bi-building" style="font-size:10.5px;"></i> {{ $whName }}
              </div>
            </td>
            <td>
              <div style="font-weight: 700; color: #0F172A; font-size: 13px;">{{ $itemsCount }} SKU{{ $itemsCount > 1 ? 's' : '' }}</div>
              <div style="font-size: 12px; color: #15803D; font-weight: 800; margin-top: 2px;">{{ $unitsCount }} Total Units</div>
            </td>
            <td>
              <div style="font-weight: 800; color: #0F172A; font-size: 14px;">{{ number_format($c->weight, 1) }} <span style="font-size:11.5px; color:#64748B; font-weight:700;">KG</span></div>
            </td>
            <td>
              <span class="sp-status-pill {{ $statusPillClass }}">
                <span class="sp-status-dot"></span> {{ $statusLabel }}
              </span>
            </td>
            <td style="text-align: right;">
              <div class="sp-action-btn-group">
                <a href="{{ url('/supplier/cartons/' . $c->id . '/label') }}" target="_blank" class="sp-action-btn print" title="Print 4x6 Thermal Barcode Label">
                  <i class="bi bi-printer"></i> Label
                </a>
                <button type="button" class="sp-action-btn" title="View Enclosed Items & Barcode" onclick="openCartonQuickView({{ $c->id }})">
                  <i class="bi bi-eye"></i> View
                </button>
              </div>
            </td>
          </tr>
          @empty
          <tr>
            <td colspan="8" align="center" style="padding: 60px 20px;">
              <div style="font-size: 44px; margin-bottom: 12px;">📦</div>
              <div style="font-size: 18px; font-weight: 800; color: #0F172A; margin-bottom: 4px;">No Cartons Created Yet</div>
              <div style="font-size: 13.5px; color: #64748B; margin-bottom: 20px; max-width: 440px; margin-left:auto; margin-right:auto; line-height: 1.5;">
                Create ASN shipments and pack items into LPN cartons to automatically generate barcodes and labels.
              </div>
              <a href="{{ route('supplier.asn.create', 1) }}" class="sp-btn-pill sp-btn-primary">
                <i class="bi bi-plus-lg"></i> Pack Items into Carton
              </a>
            </td>
          </tr>
          @endforelse
        </tbody>
      </table>
    </div>

    <!-- ── GRID / VISUAL CARDS VIEW ── -->
    <div class="sp-carton-cards-grid" id="gridViewContainer" style="display:none;">
      @foreach($cartons as $c)
      @php
        $poRef = optional($c->purchase)->reference_code ?: ('PO-2026-' . str_pad($c->purchase_id, 6, '0', STR_PAD_LEFT));
        $whName = optional(optional($c->purchase)->warehouse)->name ?: 'Suguna Warehouse';
        $itemsCount = $c->items->count();
        $unitsCount = $c->items->sum('packed_quantity');
      @endphp
      <div class="sp-carton-card carton-grid-item" data-lpn="{{ strtolower($c->lpn_number) }}" data-carton="{{ strtolower($c->carton_number) }}" data-po="{{ strtolower($poRef) }}" data-status="{{ $c->status }}">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
            <div>
              <div style="font-size:16px; font-weight:800; color:#0F172A;">📦 {{ $c->carton_number }}</div>
              <span class="sp-box-badge" style="margin-top:4px;">{{ $c->carton_type }}</span>
            </div>
            <span class="sp-status-pill transit" style="font-size:11px; padding:3px 10px;">
              <span class="sp-status-dot"></span> {{ $c->status }}
            </span>
          </div>

          <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:12px; margin-bottom:14px; text-align:center;">
            <span class="sp-lpn-code-pill" style="font-size:13px;">
              <i class="bi bi-upc-scan"></i> {{ $c->lpn_number }}
            </span>
            <div style="font-size:11px; color:#64748B; margin-top:4px; font-family:monospace;">{{ $c->dimensions }} • {{ number_format($c->weight, 1) }} KG</div>
          </div>

          <div style="display:flex; justify-content:space-between; font-size:12.5px; margin-bottom:8px;">
            <span style="color:#64748B;">Linked PO:</span>
            <strong style="color:#2563EB; font-family:monospace;">{{ $poRef }}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:12.5px; margin-bottom:12px;">
            <span style="color:#64748B;">Enclosed Contents:</span>
            <strong style="color:#15803D;">{{ $itemsCount }} SKU ({{ $unitsCount }} Units)</strong>
          </div>
        </div>

        <div style="display:flex; gap:8px; padding-top:12px; border-top:1px solid #F1F5F9;">
          <a href="{{ url('/supplier/cartons/' . $c->id . '/label') }}" target="_blank" class="sp-action-btn print" style="flex:1;">
            <i class="bi bi-printer"></i> 4x6 Label
          </a>
          <button type="button" class="sp-action-btn" style="flex:1;" onclick="openCartonQuickView({{ $c->id }})">
            <i class="bi bi-eye"></i> Details
          </button>
        </div>
      </div>
      @endforeach
    </div>

    <!-- Showing Count Status Footer -->
    <div style="padding: 16px 4px 0 4px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #F8FAFC; margin-top: 14px;">
      <div style="font-size: 13px; color: #64748B; font-weight: 600;" id="showingCountBadge">
        Showing {{ $cartons->count() }} of {{ $totalCartons }} Cartons
      </div>
      <div style="font-size: 12px; color: #94A3B8;">
        Standard: GS1-128 / Code 128 Barcode Format (4x6" Thermal)
      </div>
    </div>

  </div>

</div>

<!-- ── Quick View Carton & Barcode Modal ── -->
<div class="sp-modal-overlay" id="cartonDetailModalOverlay">
  <div class="sp-modal-box">
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:18px;">
      <div>
        <h3 id="modalCartonTitle" style="font-size:19px; font-weight:800; color:#0F172A; margin:0 0 4px 0;">Carton Details</h3>
        <span id="modalLpnBadge" class="sp-lpn-code-pill" style="font-size:13px;">LPN-2026-0001</span>
      </div>
      <button type="button" onclick="closeCartonModal()" style="border:none; background:transparent; font-size:22px; color:#94A3B8; cursor:pointer; line-height:1;">
        <i class="bi bi-x-lg"></i>
      </button>
    </div>

    <!-- Real-Time Barcode & QR Display -->
    <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:14px; padding:16px; text-align:center; margin-bottom:18px;">
      <div style="display:flex; justify-content:center; align-items:center; gap:20px; flex-wrap:wrap;">
        <div>
          <svg id="modalCode128Svg" style="max-width:100%; height:46px;"></svg>
        </div>
        <div>
          <canvas id="modalQrCanvas" style="width:54px; height:54px;"></canvas>
        </div>
      </div>
      <div style="font-size:11px; color:#64748B; font-weight:700; margin-top:6px; letter-spacing:0.04em;">SCANNABLE CODE 128 &amp; 2D QR CODE</div>
    </div>

    <!-- Carton Specs Grid -->
    <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; background:#FFFFFF; border:1px solid #EEF2F7; border-radius:12px; padding:12px 14px; margin-bottom:18px;">
      <div>
        <span style="font-size:11px; color:#64748B; font-weight:700; text-transform:uppercase;">Type</span>
        <div id="modalBoxType" style="font-size:13px; font-weight:800; color:#0F172A;">Medium Box</div>
      </div>
      <div>
        <span style="font-size:11px; color:#64748B; font-weight:700; text-transform:uppercase;">Dimensions</span>
        <div id="modalDims" style="font-size:13px; font-weight:800; color:#0F172A;">40 x 35 x 30 cm</div>
      </div>
      <div>
        <span style="font-size:11px; color:#64748B; font-weight:700; text-transform:uppercase;">Weight</span>
        <div id="modalWeight" style="font-size:13px; font-weight:800; color:#15803D;">5.0 KG</div>
      </div>
    </div>

    <!-- Enclosed Items Table -->
    <div style="margin-bottom:20px;">
      <h4 style="font-size:13px; font-weight:800; color:#0F172A; text-transform:uppercase; letter-spacing:0.04em; margin:0 0 10px 0;">Enclosed Products</h4>
      <div style="border:1px solid #EEF2F7; border-radius:12px; overflow:hidden;">
        <table style="width:100%; border-collapse:collapse; font-size:12.5px;">
          <thead>
            <tr style="background:#F8FAFC; border-bottom:1px solid #EEF2F7; text-align:left; color:#64748B; font-size:11px; font-weight:800; text-transform:uppercase;">
              <th style="padding:10px 14px;">Product &amp; SKU</th>
              <th style="padding:10px 14px; text-align:right;">Quantity</th>
            </tr>
          </thead>
          <tbody id="modalItemsBody">
            <tr>
              <td colspan="2" style="text-align:center; padding:20px; color:#64748B;">Loading items...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Action Buttons Footer -->
    <div style="display:flex; gap:10px;">
      <a id="modalPrintLabelBtn" href="#" target="_blank" class="sp-btn-pill sp-btn-primary" style="flex:1; height:42px; justify-content:center;">
        <i class="bi bi-printer"></i> Print 4x6 Thermal Label
      </a>
      <a id="modalPdfBtn" href="#" target="_blank" class="sp-btn-pill" style="height:42px; justify-content:center;">
        <i class="bi bi-file-earmark-pdf"></i> Download PDF
      </a>
    </div>
  </div>
</div>

<script>
// Filter Cartons dynamically
function filterCartons() {
  const search = document.getElementById('cartonSearch').value.toLowerCase().trim();
  const status = document.getElementById('statusFilter').value;
  const rows = document.querySelectorAll('.carton-row-item');
  const cards = document.querySelectorAll('.carton-grid-item');
  let visible = 0;

  rows.forEach(r => {
    const lpn = r.dataset.lpn || '';
    const carton = r.dataset.carton || '';
    const po = r.dataset.po || '';
    const st = r.dataset.status || '';

    const matchesSearch = !search || lpn.includes(search) || carton.includes(search) || po.includes(search);
    const matchesStatus = status === 'ALL' || st === status;

    if (matchesSearch && matchesStatus) {
      r.style.display = '';
      visible++;
    } else {
      r.style.display = 'none';
    }
  });

  cards.forEach(c => {
    const lpn = c.dataset.lpn || '';
    const carton = c.dataset.carton || '';
    const po = c.dataset.po || '';
    const st = c.dataset.status || '';

    const matchesSearch = !search || lpn.includes(search) || carton.includes(search) || po.includes(search);
    const matchesStatus = status === 'ALL' || st === status;

    c.style.display = (matchesSearch && matchesStatus) ? '' : 'none';
  });

  document.getElementById('showingCountBadge').innerText = `Showing ${visible} Cartons`;
}

// Sort Cartons Table
function sortCartonsTable() {
  const sort = document.getElementById('sortFilter').value;
  const tbody = document.getElementById('cartonsTableBody');
  const rows = Array.from(tbody.querySelectorAll('.carton-row-item'));

  rows.sort((a, b) => {
    if (sort === 'weight_desc') {
      return (parseFloat(b.dataset.weight) || 0) - (parseFloat(a.dataset.weight) || 0);
    } else if (sort === 'weight_asc') {
      return (parseFloat(a.dataset.weight) || 0) - (parseFloat(b.dataset.weight) || 0);
    } else if (sort === 'oldest') {
      return (parseInt(a.dataset.cartonId) || 0) - (parseInt(b.dataset.cartonId) || 0);
    } else {
      return (parseInt(b.dataset.cartonId) || 0) - (parseInt(a.dataset.cartonId) || 0);
    }
  });

  rows.forEach(r => tbody.appendChild(r));
}

// Switch between Table View and Cards View
function switchView(mode) {
  const tblBtn = document.getElementById('btnTableView');
  const grdBtn = document.getElementById('btnGridView');
  const tblCon = document.getElementById('tableViewContainer');
  const grdCon = document.getElementById('gridViewContainer');

  if (mode === 'grid') {
    tblBtn.classList.remove('active');
    grdBtn.classList.add('active');
    tblCon.style.display = 'none';
    grdCon.style.display = 'grid';
  } else {
    grdBtn.classList.remove('active');
    tblBtn.classList.add('active');
    grdCon.style.display = 'none';
    tblCon.style.display = 'block';
  }
}

// Bulk Selection
function toggleSelectAllCartons(masterCb) {
  const cbs = document.querySelectorAll('.carton-row-cb');
  cbs.forEach(cb => cb.checked = masterCb.checked);
  handleCartonSelection();
}

function handleCartonSelection() {
  const cbs = document.querySelectorAll('.carton-row-cb:checked');
  const bar = document.getElementById('bulkActionBar');
  const text = document.getElementById('bulkSelectedText');

  if (cbs.length > 0) {
    bar.classList.add('show');
    text.innerText = `${cbs.length} Carton${cbs.length > 1 ? 's' : ''} Selected`;
  } else {
    bar.classList.remove('show');
    const master = document.getElementById('cartonSelectAll');
    if (master) master.checked = false;
  }
}

function deselectAllCartons() {
  const cbs = document.querySelectorAll('.carton-row-cb');
  cbs.forEach(cb => cb.checked = false);
  handleCartonSelection();
}

function printSelectedLabels() {
  const cbs = document.querySelectorAll('.carton-row-cb:checked');
  if (cbs.length === 0) return;
  cbs.forEach((cb, idx) => {
    setTimeout(() => {
      window.open('/supplier/cartons/' + cb.value + '/label', '_blank');
    }, idx * 300);
  });
}

function printAllLabelsBatch() {
  const cbs = document.querySelectorAll('.carton-row-cb');
  if (cbs.length === 0) {
    alert('No cartons available to print.');
    return;
  }
  cbs.forEach((cb, idx) => {
    setTimeout(() => {
      window.open('/supplier/cartons/' + cb.value + '/label', '_blank');
    }, idx * 300);
  });
}

// Copy LPN Code
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert(`Copied "${text}" to clipboard!`);
  });
}

// Quick View Modal
function openCartonQuickView(id) {
  fetch('/supplier/cartons/' + id)
    .then(r => r.json())
    .then(data => {
      if (data.success && data.carton) {
        const c = data.carton;
        document.getElementById('modalCartonTitle').innerText = c.carton_number;
        document.getElementById('modalLpnBadge').innerText = c.lpn_number;
        document.getElementById('modalBoxType').innerText = c.carton_type || 'Standard Box';
        document.getElementById('modalDims').innerText = c.dimensions || '40 x 35 x 30 cm';
        document.getElementById('modalWeight').innerText = (parseFloat(c.weight) || 5.0).toFixed(1) + ' KG';

        document.getElementById('modalPrintLabelBtn').href = '/supplier/cartons/' + c.id + '/label';
        document.getElementById('modalPdfBtn').href = '/supplier/cartons/' + c.id + '/label?pdf=1';

        // Render Barcode
        try {
          if (window.JsBarcode) {
            JsBarcode("#modalCode128Svg", c.lpn_number, {
              format: "CODE128",
              lineColor: "#000000",
              width: 2,
              height: 44,
              displayValue: true,
              fontSize: 12,
              margin: 0
            });
          }
        } catch(e) { console.error(e); }

        // Render QR
        try {
          if (window.QRCode) {
            const qrCanvas = document.getElementById('modalQrCanvas');
            QRCode.toCanvas(qrCanvas, c.lpn_number, { width: 54, margin: 0 });
          }
        } catch(e) { console.error(e); }

        // Render Items
        let rows = '';
        if (c.items && c.items.length > 0) {
          c.items.forEach(it => {
            const pName = it.product ? it.product.name : 'Product Item';
            const pSku = it.sku || (it.product ? it.product.code : 'SKU-001');
            rows += `
              <tr style="border-bottom:1px solid #F1F5F9;">
                <td style="padding:10px 14px;">
                  <strong style="color:#0F172A; display:block;">${pName}</strong>
                  <span style="font-size:11px; color:#64748B; font-family:monospace;">SKU: ${pSku}</span>
                </td>
                <td style="padding:10px 14px; text-align:right; font-weight:800; color:#15803D;">
                  ${it.packed_quantity} Units
                </td>
              </tr>
            `;
          });
        } else {
          rows = `<tr><td colspan="2" style="text-align:center; padding:16px; color:#64748B;">No items packed.</td></tr>`;
        }
        document.getElementById('modalItemsBody').innerHTML = rows;

        document.getElementById('cartonDetailModalOverlay').classList.add('show');
      }
    });
}

function closeCartonModal() {
  document.getElementById('cartonDetailModalOverlay').classList.remove('show');
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeCartonModal();
  }
});
</script>
@endsection
