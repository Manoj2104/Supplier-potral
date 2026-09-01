@extends('supplier.layout')
@section('title', 'ASN ' . $asn->asn_number . ' — Cartons (LPN) | Suguna')

@section('head')
<!-- Real-Time Barcode & QR Engines -->
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>

<style>
/* ═══════════════════════════════════════════════════════════════════
   PREMIUM ENTERPRISE ASN & LPN WMS SYSTEM
   ═══════════════════════════════════════════════════════════════════ */

.dashboard-page,
.dashboard-page * {
  font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
}

/* Outer Workspace Surface */
.dashboard-page.premium-workspace {
  margin: 12px 0 32px !important;
  padding: 28px 28px !important;
  border-radius: 24px !important;
  background: rgba(255, 255, 255, 0.85) !important;
  backdrop-filter: blur(24px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(24px) saturate(180%) !important;
  border: 1px solid rgba(255, 255, 255, 0.90) !important;
  box-shadow:
    0 0 0 1px rgba(15, 23, 42, 0.04),
    0 8px 32px rgba(15, 23, 42, 0.06),
    0 32px 64px rgba(15, 23, 42, 0.04) !important;
  min-height: unset !important;
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
  margin-bottom: 8px;
}
.sp-breadcrumb a {
  color: #64748B;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.15s ease;
}
.sp-breadcrumb a:hover {
  color: #16A34A;
}
.sp-breadcrumb i {
  font-size: 10px;
  color: #94A3B8;
}
.sp-breadcrumb .active {
  color: #16A34A;
  font-weight: 700;
}

/* ── Top Header Row ── */
.sp-page-intro-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.sp-page-title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.sp-page-title {
  font-size: 32px;
  font-weight: 800;
  color: #0F172A;
  letter-spacing: -1px;
  line-height: 1.15;
  margin: 0;
}

.sp-page-subtitle {
  font-size: 13.5px;
  color: #64748B;
  margin: 0;
  font-weight: 400;
  max-width: 650px;
  line-height: 1.5;
}

/* ── Header Action Buttons ── */
.sp-page-intro-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.sp-btn-secondary {
  height: 42px;
  padding: 0 18px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid #E2E8F0;
  background: #FFFFFF;
  color: #334155;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  transition: all 0.15s ease;
  text-decoration: none;
  white-space: nowrap;
}
.sp-btn-secondary:hover {
  background: #F8FAFC;
  border-color: #CBD5E1;
  color: #0F172A;
}

.sp-btn-submit {
  height: 42px;
  padding: 0 22px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  background: #15803D;
  color: #FFFFFF;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(21, 128, 61, 0.25);
  transition: all 0.15s ease;
  text-decoration: none;
  white-space: nowrap;
}
.sp-btn-submit:hover {
  background: #166534;
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(21, 128, 61, 0.35);
  color: #FFFFFF;
}

/* ── Horizontal Meta Badges Strip ── */
.sp-meta-strip {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 22px;
}

.sp-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 12px;
  font-size: 12.5px;
  font-weight: 600;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  color: #334155;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.02);
}
.sp-meta-item strong {
  font-weight: 800;
}
.sp-meta-item i {
  font-size: 14px;
}

.sp-meta-item.blue {
  background: #EFF6FF;
  border-color: #BFDBFE;
  color: #1E40AF;
}
.sp-meta-item.blue strong { color: #1D4ED8; }

.sp-meta-item.green {
  background: #DCFCE7;
  border-color: #86EFAC;
  color: #15803D;
}
.sp-meta-item.green strong { color: #166534; }

.sp-meta-item.purple {
  background: #F3E8FF;
  border-color: #DDD6FE;
  color: #7C3AED;
}
.sp-meta-item.purple strong { color: #6D28D9; }

.sp-meta-item.slate {
  background: #F8FAFC;
  border-color: #E2E8F0;
  color: #475569;
}

/* ── Tab Navigation Strip ── */
.sp-tabs-nav {
  display: flex;
  gap: 24px;
  border-bottom: 2px solid #EEF2F7;
  margin-bottom: 22px;
}
.sp-tab-link {
  padding: 10px 4px 14px 4px;
  font-size: 13.5px;
  font-weight: 700;
  color: #64748B;
  text-decoration: none;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s ease;
  user-select: none;
}
.sp-tab-link:hover {
  color: #16A34A;
}
.sp-tab-link.active {
  color: #16A34A;
  border-bottom-color: #16A34A;
}
.sp-tab-badge {
  background: #DCFCE7;
  color: #16A34A;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 9999px;
  font-weight: 800;
}
.sp-tab-link:not(.active) .sp-tab-badge {
  background: #F1F5F9;
  color: #475569;
}

/* ── Tab Panes ── */
.sp-tab-pane {
  display: none;
}
.sp-tab-pane.active {
  display: block;
}

/* ── Enterprise Cards ── */
.sp-card-lux {
  background: #FFFFFF;
  border: 1px solid #EEF2F7;
  border-radius: 18px;
  padding: 22px 24px;
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.03);
  margin-bottom: 22px;
  box-sizing: border-box;
}

/* ── 1. HORIZONTAL LPN DETAIL SECTION ── */
.sp-lpn-horizontal-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 18px;
}

.sp-lpn-left-info {
  display: flex;
  align-items: center;
  gap: 14px;
}

.sp-lpn-icon-box {
  width: 48px;
  height: 48px;
  background: #FEF3C7;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.sp-lpn-title-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sp-lpn-main-code {
  font-size: 20px;
  font-weight: 800;
  color: #0F172A;
  letter-spacing: -0.5px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.sp-lpn-sub-meta {
  font-size: 12.5px;
  color: #64748B;
  font-weight: 600;
}

.sp-lpn-center-grid {
  display: flex;
  align-items: center;
  gap: 28px;
  background: #F8FAFC;
  border: 1px solid #EEF2F7;
  border-radius: 14px;
  padding: 12px 22px;
}

.sp-lpn-grid-cell {
  display: flex;
  flex-direction: column;
}

.sp-lpn-cell-lbl {
  font-size: 10px;
  font-weight: 800;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
}

.sp-lpn-cell-val {
  font-size: 13.5px;
  font-weight: 800;
  color: #0F172A;
}

.sp-lpn-right-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* ── 2. CONTENTS & PRODUCTS SECTION ── */
.sp-contents-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #EEF2F7;
  margin-bottom: 14px;
}

.sp-content-pills {
  display: inline-flex;
  gap: 4px;
  background: #F1F5F9;
  padding: 3px;
  border-radius: 10px;
}

.sp-content-pill {
  padding: 6px 16px;
  font-size: 12.5px;
  font-weight: 700;
  color: #64748B;
  border-radius: 7px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.sp-content-pill.active {
  background: #FFFFFF;
  color: #0F172A;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.sp-products-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.sp-products-table th {
  padding: 10px 12px;
  font-size: 11px;
  font-weight: 800;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #EEF2F7;
  text-align: left;
  background: #F8FAFC;
}

.sp-products-table td {
  padding: 12px 12px;
  border-bottom: 1px solid #F1F5F9;
  color: #334155;
  vertical-align: middle;
}

.sp-products-table tr:last-child td {
  border-bottom: none;
}

/* ── 3. MASTER CARTONS / LPN LIST ── */
.sp-data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;
}

.sp-data-table th {
  background: #F8FAFC;
  padding: 12px 14px;
  font-size: 11px;
  font-weight: 800;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #EEF2F7;
  text-align: left;
  white-space: nowrap;
}

.sp-data-table td {
  padding: 14px 14px;
  border-bottom: 1px solid #F1F5F9;
  vertical-align: middle;
  color: #334155;
}

.sp-data-table tr.selected td {
  background: #F0FDF4 !important;
  border-top: 1px solid #86EFAC !important;
  border-bottom: 1px solid #86EFAC !important;
}

.sp-data-table tr.selected td:first-child {
  border-left: 1px solid #86EFAC !important;
  border-top-left-radius: 10px;
  border-bottom-left-radius: 10px;
}

.sp-data-table tr.selected td:last-child {
  border-right: 1px solid #86EFAC !important;
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
}

.sp-data-table tr:hover:not(.selected) td {
  background: #F8FAFC;
}

.sp-lpn-pill {
  font-family: monospace;
  font-weight: 800;
  color: #16A34A;
  background: #DCFCE7;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid #86EFAC;
  font-size: 12.5px;
  display: inline-block;
}

.sp-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 11.5px;
  font-weight: 700;
  white-space: nowrap;
}
.sp-status-badge.in_transit { background: #EFF6FF; color: #2563EB; border: 1px solid #BFDBFE; }
.sp-status-badge.approved   { background: #DCFCE7; color: #16A34A; border: 1px solid #86EFAC; }
.sp-status-badge.arrived    { background: #F3E8FF; color: #7C3AED; border: 1px solid #DDD6FE; }
.sp-status-badge.pending    { background: #FEF3C7; color: #D97706; border: 1px solid #FDE68A; }
.sp-status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

/* ── 4. DELIVERY DOCUMENTS GRID (Ref 2 Match) ── */
.sp-doc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
  margin-bottom: 22px;
}

.sp-doc-card {
  background: #FFFFFF;
  border: 1.5px solid #E2E8F0;
  border-radius: 16px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 160px;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.03);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.sp-doc-card:hover {
  border-color: #94A3B8;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
  transform: translateY(-2px);
}

.sp-doc-icon-box {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 19px;
  flex-shrink: 0;
}

.sp-doc-btn {
  height: 34px !important;
  padding: 0 10px !important;
  border-radius: 9999px !important;
  font-size: 12px !important;
  font-weight: 700 !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 5px !important;
  flex: 1 !important;
  text-decoration: none !important;
  transition: all 0.15s ease !important;
  white-space: nowrap !important;
  cursor: pointer !important;
  line-height: 1 !important;
}
.sp-doc-btn.view {
  background: #F1F5F9 !important;
  color: #0F172A !important;
  border: 1px solid #CBD5E1 !important;
}
.sp-doc-btn.view:hover {
  background: #E2E8F0 !important;
  color: #0F172A !important;
  transform: translateY(-1px) !important;
}

.sp-doc-btn.print {
  background: #FFFFFF !important;
  color: #0F172A !important;
  border: 1px solid #CBD5E1 !important;
}
.sp-doc-btn.print:hover {
  background: #F8FAFC !important;
  border-color: #94A3B8 !important;
  transform: translateY(-1px) !important;
}

.sp-doc-btn.pdf-green {
  background: #ECFDF5 !important;
  color: #15803D !important;
  border: 1px solid #86EFAC !important;
}
.sp-doc-btn.pdf-green:hover {
  background: #DCFCE7 !important;
  border-color: #4ADE80 !important;
  color: #166534 !important;
  transform: translateY(-1px) !important;
}

.sp-doc-btn.pdf-blue {
  background: #EFF6FF !important;
  color: #1D4ED8 !important;
  border: 1px solid #93C5FD !important;
}
.sp-doc-btn.pdf-blue:hover {
  background: #DBEAFE !important;
  border-color: #60A5FA !important;
  color: #1E40AF !important;
  transform: translateY(-1px) !important;
}

.sp-doc-btn.pdf-purple {
  background: #FAF5FF !important;
  color: #6D28D9 !important;
  border: 1px solid #C4B5FD !important;
}
.sp-doc-btn.pdf-purple:hover {
  background: #EDE9FE !important;
  border-color: #A78BFA !important;
  color: #5B21B6 !important;
  transform: translateY(-1px) !important;
}

.sp-doc-btn.pdf-teal {
  background: #F0FDFA !important;
  color: #0F766E !important;
  border: 1px solid #99F6E4 !important;
}
.sp-doc-btn.pdf-teal:hover {
  background: #CCFBF1 !important;
  border-color: #5EEAD4 !important;
  color: #115E59 !important;
  transform: translateY(-1px) !important;
}

.sp-doc-btn.pdf-orange {
  background: #FFF7ED !important;
  color: #C2410C !important;
  border: 1px solid #FDBA74 !important;
}
.sp-doc-btn.pdf-orange:hover {
  background: #FFEDD5 !important;
  border-color: #FB923C !important;
  color: #9A3412 !important;
  transform: translateY(-1px) !important;
}

/* Slide Modal */
.sp-modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
  z-index: 1200;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.sp-modal-overlay.open { display: flex; }
.sp-modal-drawer-box {
  background: #FFFFFF;
  border-radius: 20px;
  width: 100%;
  max-width: 580px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 24px 48px rgba(0,0,0,0.18);
  display: flex;
  flex-direction: column;
}

@media (max-width: 900px) {
  .sp-lpn-horizontal-bar { flex-direction: column; align-items: flex-start; }
  .sp-lpn-center-grid { width: 100%; justify-content: space-between; gap: 12px; }
  .sp-lpn-right-actions { width: 100%; justify-content: flex-start; }
}
</style>
@endsection

@section('content')

@php
  $poCode = $asn->purchase->reference_code ?? ('PO-' . $asn->purchase_id);
  $supplierName = $asn->supplier->name ?? ($asn->purchase->supplier->name ?? 'Jeyachandran Textile Private Limited');
  $warehouseName = $asn->purchase->warehouse->name ?? 'Suguna Warehouse';
  $expectedDate = $asn->expected_arrival ? \Carbon\Carbon::parse($asn->expected_arrival)->format('d M Y') : date('d M Y', strtotime('+2 days'));
  $totalOrderedUnits = $asn->purchase->purchaseItems->sum('quantity');
  $totalSkusCount = $asn->purchase->purchaseItems->count();
  $totalCartonsCount = $asn->cartons->count();
  $statusClass = in_array($asn->status, ['in_transit', 'dispatched']) ? 'in_transit' : ($asn->status === 'arrived' ? 'arrived' : 'approved');
  $activeCarton = $asn->cartons->first();
@endphp

<div class="dashboard-page premium-workspace">

  <!-- ── 1. Breadcrumb Navigation ── -->
  <div class="sp-breadcrumb">
    <a href="{{ route('supplier.dashboard') }}">Dashboard</a>
    <i class="bi bi-chevron-right"></i>
    <a href="{{ route('supplier.asn.index') }}">ASN (Dispatch)</a>
    <i class="bi bi-chevron-right"></i>
    <span>{{ $asn->asn_number }}</span>
    <i class="bi bi-chevron-right"></i>
    <span class="active" id="crumbCurrentTab">Cartons (LPN)</span>
  </div>

  <!-- ── 2. Top Header Bar (Title on Left, Action Buttons on Right) ── -->
  <div class="sp-page-intro-header">
    <div style="flex: 1; min-width: 320px;">
      <div class="sp-page-title-wrap">
        <h1 class="sp-page-title">{{ $asn->asn_number }}</h1>
        <span class="sp-status-badge {{ $statusClass }}">
          <span class="sp-status-dot"></span> {{ ucwords(str_replace('_', ' ', $asn->status ?? 'in_transit')) }}
        </span>
      </div>
      <p class="sp-page-subtitle">Advance Shipping Notice details, packed LPN cartons, thermal barcode labels, and delivery documentation.</p>
    </div>

    <div class="sp-page-intro-actions">
      <a href="{{ route('supplier.asn.download-package.asn', $asn->id) }}" class="sp-btn-secondary" style="border-color:#86EFAC; color:#15803D; background:#F0FDF4;" title="Download Complete Dispatch ZIP Package (All 6 Documents & Labels)">
        <i class="bi bi-file-earmark-zip-fill"></i> Download Delivery Pack (ZIP)
      </a>
      <a href="{{ route('supplier.invoices.pdf', $asn->purchase_id) }}" target="_blank" class="sp-btn-secondary">
        <i class="bi bi-file-earmark-text"></i> View ASN
      </a>
      <button type="button" class="sp-btn-submit" onclick="openCreateCartonModal()">
        <i class="bi bi-plus-lg"></i> Create Carton
      </button>
    </div>
  </div>

  <!-- ── 3. Horizontal Meta Badges Strip ── -->
  <div class="sp-meta-strip">
    <div class="sp-meta-item blue">
      <i class="bi bi-file-earmark-text"></i>
      <span>PO: <strong>{{ $poCode }}</strong></span>
    </div>
    <div class="sp-meta-item green">
      <i class="bi bi-building"></i>
      <span>Destination: <strong>{{ $warehouseName }}</strong></span>
    </div>
    <div class="sp-meta-item slate">
      <i class="bi bi-calendar3"></i>
      <span>Expected Delivery: <strong>{{ $expectedDate }}</strong></span>
    </div>
    <div class="sp-meta-item purple">
      <i class="bi bi-box-seam"></i>
      <span>Order Total: <strong>{{ number_format($totalOrderedUnits) }} Units</strong></span>
    </div>
  </div>

  <!-- ── 4. Main 5-Tab Navigation Strip (Ref 1 Match) ── -->
  <div class="sp-tabs-nav">
    <div class="sp-tab-link" id="mainTabLink-overview" onclick="switchMainTab('overview')">
      Overview
    </div>
    <div class="sp-tab-link" id="mainTabLink-products" onclick="switchMainTab('products')">
      Products <span class="sp-tab-badge">{{ $totalSkusCount }}</span>
    </div>
    <div class="sp-tab-link active" id="mainTabLink-cartons" onclick="switchMainTab('cartons')">
      Cartons (LPN) <span class="sp-tab-badge">{{ $totalCartonsCount }}</span>
    </div>
    <div class="sp-tab-link" id="mainTabLink-documents" onclick="switchMainTab('documents')">
      Documents <span class="sp-tab-badge">5</span>
    </div>
    <div class="sp-tab-link" id="mainTabLink-timeline" onclick="switchMainTab('timeline')">
      Timeline
    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════════════════════
       TAB PANE 1: OVERVIEW
       ═══════════════════════════════════════════════════════════════════ -->
  <div class="sp-tab-pane" id="tabPane-overview">
    <div class="sp-card-lux">
      <h2 style="font-size:18px; font-weight:800; color:#0F172A; margin:0 0 16px 0;">Shipment Summary &amp; Overview</h2>
      
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:18px; margin-bottom:20px;">
        <div style="background:#F8FAFC; border:1px solid #EEF2F7; border-radius:14px; padding:16px;">
          <div style="font-size:11px; font-weight:800; color:#64748B; text-transform:uppercase; margin-bottom:8px;">PURCHASE ORDER &amp; SUPPLIER</div>
          <div style="display:flex; flex-direction:column; gap:6px; font-size:13px; color:#334155;">
            <div>PO Reference: <strong style="color:#0F172A;">{{ $poCode }}</strong></div>
            <div>Supplier: <strong>{{ $supplierName }}</strong></div>
            <div>Order Date: <strong>{{ $asn->purchase->date ? \Carbon\Carbon::parse($asn->purchase->date)->format('d M Y') : 'N/A' }}</strong></div>
            <div>Total Ordered Units: <strong style="color:#15803D;">{{ $totalOrderedUnits }} Units</strong></div>
          </div>
        </div>

        <div style="background:#F8FAFC; border:1px solid #EEF2F7; border-radius:14px; padding:16px;">
          <div style="font-size:11px; font-weight:800; color:#64748B; text-transform:uppercase; margin-bottom:8px;">LOGISTICS &amp; DESTINATION</div>
          <div style="display:flex; flex-direction:column; gap:6px; font-size:13px; color:#334155;">
            <div>Warehouse: <strong style="color:#0F172A;">{{ $warehouseName }}</strong></div>
            <div>Carrier / Transporter: <strong>{{ $asn->transporter_name ?: 'Perman Logistics' }}</strong></div>
            <div>Vehicle Number: <strong style="color:#2563EB;">{{ $asn->vehicle_number ?: 'TN03UZ104' }}</strong></div>
            <div>Driver Contact: <strong>{{ $asn->driver_name ?: 'Manoj K' }} ({{ $asn->driver_phone ?: '+91 98765 43210' }})</strong></div>
          </div>
        </div>
      </div>

      <div style="background:#EFF6FF; border:1px solid #BFDBFE; border-radius:14px; padding:16px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="font-size:24px;">🚚</div>
          <div>
            <strong style="color:#1E40AF; font-size:14px; display:block;">Shipment Status: {{ ucwords(str_replace('_', ' ', $asn->status ?? 'In Transit')) }}</strong>
            <span style="font-size:12.5px; color:#3B82F6;">Expected arrival at destination warehouse on {{ $expectedDate }}</span>
          </div>
        </div>
        <button type="button" class="sp-btn-secondary" onclick="switchMainTab('documents')" style="background:#FFFFFF; color:#1D4ED8; border-color:#93C5FD;">
          <i class="bi bi-file-earmark-text"></i> View 5 Dispatch Documents
        </button>
      </div>
    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════════════════════
       TAB PANE 2: PRODUCTS
       ═══════════════════════════════════════════════════════════════════ -->
  <div class="sp-tab-pane" id="tabPane-products">
    <div class="sp-card-lux">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; flex-wrap:wrap; gap:12px;">
        <div>
          <h2 style="font-size:18px; font-weight:800; color:#0F172A; margin:0 0 2px 0;">Purchase Order Products ({{ $totalSkusCount }})</h2>
          <div style="font-size:13px; color:#64748B;">Items scheduled for delivery under ASN {{ $asn->asn_number }}</div>
        </div>
      </div>

      <div style="overflow-x: auto;">
        <table class="sp-data-table">
          <thead>
            <tr>
              <th style="width: 40px;">#</th>
              <th>PRODUCT NAME</th>
              <th>SKU / BARCODE</th>
              <th style="text-align:center;">ORDERED QTY</th>
              <th style="text-align:center;">PACKED QTY</th>
              <th style="text-align:center;">REMAINING</th>
              <th style="text-align:right;">STATUS</th>
            </tr>
          </thead>
          <tbody>
            @foreach($asn->purchase->purchaseItems as $idx => $item)
            @php 
              $p = $item->product; 
              $packedQty = $asn->cartons->flatMap->items->where('product_id', $item->product_id)->sum('packed_quantity');
              $remQty = max(0, $item->quantity - $packedQty);
            @endphp
            <tr>
              <td style="font-weight:700; color:#64748B;">{{ $idx + 1 }}</td>
              <td>
                <strong style="color:#0F172A; font-size:13.5px; font-weight:800;">{{ $p->name ?? 'Product Item' }}</strong>
              </td>
              <td>
                <span style="font-family:monospace; font-weight:700; color:#475569; font-size:12.5px;">{{ $p->code ?? '8901898053777' }}</span>
              </td>
              <td style="text-align:center; font-weight:800; color:#0F172A;">{{ $item->quantity }}</td>
              <td style="text-align:center; font-weight:900; color:#16A34A;">{{ $packedQty }}</td>
              <td style="text-align:center; font-weight:800; color:{{ $remQty > 0 ? '#D97706' : '#64748B' }};">{{ $remQty }}</td>
              <td style="text-align:right;">
                <span class="sp-status-badge {{ $remQty == 0 ? 'approved' : 'pending' }}">
                  {{ $remQty == 0 ? '100% Packed' : 'Partial' }}
                </span>
              </td>
            </tr>
            @endforeach
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════════════════════
       TAB PANE 3: CARTONS (LPN) — DEFAULT ACTIVE (Ref 3 & 4 Match)
       ═══════════════════════════════════════════════════════════════════ -->
  <div class="sp-tab-pane active" id="tabPane-cartons">
    
    @if($activeCarton)
    <!-- 1. LPN DETAIL — HORIZONTAL SECTION (Ref 3 Match) -->
    <div class="sp-card-lux" id="lpnDetailSection">
      
      <!-- Top Horizontal Bar: Left Info + Center Stats Grid + Right Actions -->
      <div class="sp-lpn-horizontal-bar">
        
        <!-- LEFT -->
        <div class="sp-lpn-left-info">
          <div class="sp-lpn-icon-box">📦</div>
          <div class="sp-lpn-title-group">
            <div class="sp-lpn-main-code">
              <span id="lpnDetailNumber">{{ $activeCarton->lpn_number }}</span>
              <span class="sp-status-badge in_transit" id="lpnDetailStatus">{{ $activeCarton->status ?? 'In Transit' }}</span>
            </div>
            <div class="sp-lpn-sub-meta" id="lpnDetailSub">{{ $activeCarton->carton_number }} of {{ $totalCartonsCount }}</div>
          </div>
        </div>

        <!-- CENTER: Horizontal Operational Grid -->
        <div class="sp-lpn-center-grid">
          <div class="sp-lpn-grid-cell">
            <span class="sp-lpn-cell-lbl">Carton Type</span>
            <span class="sp-lpn-cell-val" id="lpnDetailType">{{ $activeCarton->carton_type }}</span>
          </div>
          <div class="sp-lpn-grid-cell">
            <span class="sp-lpn-cell-lbl">Dimensions</span>
            <span class="sp-lpn-cell-val" id="lpnDetailDims">{{ $activeCarton->dimensions }}</span>
          </div>
          <div class="sp-lpn-grid-cell">
            <span class="sp-lpn-cell-lbl">Weight</span>
            <span class="sp-lpn-cell-val" id="lpnDetailWeight">{{ $activeCarton->weight }} KG</span>
          </div>
          <div class="sp-lpn-grid-cell">
            <span class="sp-lpn-cell-lbl">Total Quantity</span>
            <span class="sp-lpn-cell-val" style="color: #16A34A;" id="lpnDetailQty">{{ $activeCarton->items->sum('packed_quantity') }} Units</span>
          </div>
        </div>

        <!-- RIGHT: Compact Actions (Ref 3 Exact Match) -->
        <div class="sp-lpn-right-actions">
          <button type="button" class="sp-btn-secondary" onclick="viewContentsAction()" id="btnViewContents">
            <i class="bi bi-eye"></i> View Contents
          </button>
          <button type="button" class="sp-btn-secondary" onclick="printActiveLpnLabel()">
            <i class="bi bi-printer"></i> Print Label
          </button>
          <a id="lpnDownloadPdfLink" href="/supplier/cartons/{{ $activeCarton->id }}/label?pdf=1&download=1" class="sp-btn-secondary" style="border-color:#86EFAC; color:#16A34A; text-decoration:none;">
            <i class="bi bi-download"></i> Download PDF
          </a>
        </div>

      </div>

      <!-- 2. CONTENTS & PRODUCT INFORMATION AREA -->
      <div class="sp-contents-nav-bar">
        <div class="sp-content-pills">
          <div class="sp-content-pill active" id="tabBtnProducts" onclick="switchLpnContentTab('products')">
            Products (<span id="lpnProductsCount">{{ $activeCarton->items->count() }}</span>)
          </div>
          <div class="sp-content-pill" id="tabBtnLabel" onclick="switchLpnContentTab('label')">
            Label
          </div>
        </div>
        <div style="font-size: 12px; color: #64748B; font-weight: 600;" id="lpnItemsSummary">
          Enclosed Products Manifest
        </div>
      </div>

      <!-- Tab 1: Products Table -->
      <div id="lpnProductsPane">
        <table class="sp-products-table">
          <thead>
            <tr>
              <th style="width: 45%;">PRODUCT</th>
              <th style="width: 35%;">SKU</th>
              <th style="width: 20%; text-align: right;">QTY</th>
            </tr>
          </thead>
          <tbody id="lpnProductRows">
            @foreach($activeCarton->items as $item)
            @php $p = $item->product; @endphp
            <tr>
              <td>
                <strong style="color: #0F172A; font-size: 13.5px; font-weight: 800;">{{ $p->name ?? 'Product Item' }}</strong>
              </td>
              <td>
                <span style="font-weight: 700; color: #475569; font-size: 12.5px;">{{ $item->sku ?: ($p->code ?? '8901898053777') }}</span>
              </td>
              <td style="text-align: right;">
                <strong style="color: #16A34A; font-size: 14px; font-weight: 900;">{{ $item->packed_quantity }}</strong>
              </td>
            </tr>
            @endforeach
          </tbody>
        </table>
      </div>

      <!-- Tab 2: Live Barcode Label Preview -->
      <div id="lpnLabelPane" style="display: none;">
        <div style="max-width: 460px; margin: 10px auto; border: 2px solid #000; border-radius: 10px; padding: 16px; font-family: monospace; background: #FFF;">
          <div style="display:flex; justify-content:space-between; border-bottom:2px solid #000; padding-bottom:6px; margin-bottom:8px;">
            <strong style="font-size:14px; color:#000;">SUGUNA LOGISTICS</strong>
            <span style="font-size:11px; font-weight:bold; background:#000; color:#FFF; padding:2px 8px; border-radius:4px;" id="lblPreviewCartonNumber">{{ $activeCarton->carton_number }}</span>
          </div>
          <div style="text-align:center; font-weight:900; font-size:16px; margin:6px 0; color:#000;" id="lblPreviewLpn">{{ $activeCarton->lpn_number }}</div>
          <div style="text-align:center; margin:8px 0;">
            <svg id="drawerBarcodeSvg" style="height:44px; width:90%;"></svg>
          </div>
          <div style="border-top:1.5px dashed #000; padding-top:8px; font-size:11px; display:flex; justify-content:space-between; color:#000;">
            <div>PO: <strong>{{ $poCode }}</strong></div>
            <div>Destination: <strong>{{ $warehouseName }}</strong></div>
            <div>Type: <strong id="lblPreviewType">{{ $activeCarton->carton_type }}</strong></div>
          </div>
        </div>
      </div>

    </div>
    @endif

    <!-- 3. CARTONS / LPN LIST SECTION (Ref 4 Exact Match) -->
    <div class="sp-card-lux">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; flex-wrap:wrap; gap:12px;">
        <div>
          <h2 style="font-size:18px; font-weight:800; color:#0F172A; margin:0 0 2px 0;">Cartons / LPN List</h2>
          <div style="font-size:13px; color:#64748B;">Manage all cartons created under this ASN</div>
        </div>
        <div style="display:flex; gap:10px;">
          <button type="button" class="sp-btn-secondary" onclick="printAllLabels()">
            <i class="bi bi-printer"></i> Print All Labels
          </button>
          <button type="button" class="sp-btn-secondary" onclick="exportCartonsCsv()">
            <i class="bi bi-download"></i> Export
          </button>
        </div>
      </div>

      <div style="overflow-x: auto;">
        <table class="sp-data-table">
          <thead>
            <tr>
              <th style="width: 40px;">#</th>
              <th style="width: 25%;">CARTON NUMBER</th>
              <th style="width: 22%;">LPN NUMBER ↓</th>
              <th style="width: 23%;">CARTON TYPE</th>
              <th style="width: 10%; text-align: center;">PRODUCTS</th>
              <th style="width: 10%; text-align: center;">TOTAL QTY</th>
              <th style="width: 10%; text-align: right;">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            @foreach($asn->cartons as $idx => $carton)
            @php
              $totalProds = $carton->items->count();
              $totalUnits = $carton->items->sum('packed_quantity');
              $cDate = $carton->created_at ? $carton->created_at->format('d M Y, h:i A') : date('d M Y, h:i A');
            @endphp
            <tr id="carton-row-{{ $carton->id }}" class="{{ $idx === 0 ? 'selected' : '' }}" style="cursor: pointer;" onclick="selectCarton({{ $carton->id }})">
              <td style="font-weight: 700; color: #64748B;">{{ $idx + 1 }}</td>
              <td>
                <div>
                  <strong style="color: #0F172A; font-weight: 800; font-size: 13.5px;">{{ $carton->carton_number }}</strong>
                  <div style="font-size: 11px; color: #64748B; margin-top: 1px;">{{ $cDate }}</div>
                </div>
              </td>
              <td>
                <span class="sp-lpn-pill">{{ $carton->lpn_number }}</span>
              </td>
              <td>
                <div style="font-weight: 700; color: #334155; font-size: 13px;">{{ $carton->carton_type }}</div>
                <div style="font-size: 11px; color: #94A3B8;">{{ $carton->dimensions }}</div>
              </td>
              <td style="text-align: center; font-weight: 800; color: #0F172A;">{{ $totalProds }}</td>
              <td style="text-align: center; font-weight: 900; color: #16A34A; font-size: 14px;">{{ $totalUnits }}</td>
              <td style="text-align: right;">
                <div style="display: flex; gap: 6px; justify-content: flex-end;" onclick="event.stopPropagation();">
                  <button type="button" class="sp-btn-secondary" style="height:32px; padding:0 12px; font-size:12px;" onclick="selectCartonAndScroll({{ $carton->id }})" title="View Details">
                    <i class="bi bi-eye"></i> View
                  </button>
                  <button type="button" class="sp-btn-secondary" style="height:32px; padding:0 12px; font-size:12px; color:#16A34A; border-color:#86EFAC;" onclick="printCartonThermalLabel({{ $carton->id }})" title="Print Label">
                    <i class="bi bi-printer"></i> Print
                  </button>
                </div>
              </td>
            </tr>
            @endforeach
          </tbody>
        </table>
      </div>

      <div style="margin-top: 18px; font-size: 13px; color: #64748B; font-weight: 600;">
        Showing 1 to {{ $totalCartonsCount }} of {{ $totalCartonsCount }} cartons
      </div>
    </div>

  </div>

  <!-- ═══════════════════════════════════════════════════════════════════
       TAB PANE 4: DOCUMENTS (5) (Ref 2 Exact Match)
       ═══════════════════════════════════════════════════════════════════ -->
  <div class="sp-tab-pane" id="tabPane-documents">
    <div class="sp-card-lux">
      
      <!-- Section Header -->
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; flex-wrap:wrap; gap:14px;">
        <div>
          <div style="display:flex; align-items:center; gap:8px;">
            <i class="bi bi-file-earmark-text" style="font-size:20px; color:#16A34A;"></i>
            <h2 style="font-size:18px; font-weight:800; color:#0F172A; margin:0;">3. Delivery Documents</h2>
          </div>
          <p style="font-size:13px; color:#64748B; margin:4px 0 0 0;">These documents travel with the shipment and help the warehouse verify the delivery.</p>
        </div>

        <button type="button" class="sp-btn-secondary" style="border-color:#CBD5E1;" onclick="printAllDriverPack()">
          <i class="bi bi-printer"></i> Print Driver Pack (All 5 Documents)
        </button>
      </div>

      <!-- 5 Document Cards Grid (Ref 2 Match) -->
      <div class="sp-doc-grid">
        
        <!-- A. Product List Invoice -->
        <div class="sp-doc-card">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <span style="font-size:11px; font-weight:800; color:#15803D; background:#DCFCE7; padding:4px 10px; border-radius:999px; border:1px solid #86EFAC;">✓ READY</span>
              <div class="sp-doc-icon-box" style="background:#ECFDF5; color:#15803D;">
                <i class="bi bi-file-earmark-pdf-fill"></i>
              </div>
            </div>
            <strong style="font-size:14.5px; color:#0F172A; display:block; margin-bottom:2px;">A. Product List Invoice</strong>
            <span style="font-size:12px; color:#64748B; line-height:1.4; display:block;">Commercial billing &amp; GST tax breakdown</span>
          </div>
          <div style="display:flex; gap:6px; margin-top:16px;">
            <a href="{{ route('supplier.invoices.pdf', $asn->purchase_id) }}" target="_blank" class="sp-doc-btn view">
              <i class="bi bi-eye"></i> View
            </a>
            <a href="{{ route('supplier.invoices.pdf', $asn->purchase_id) }}" target="_blank" class="sp-doc-btn print">
              <i class="bi bi-printer"></i> Print
            </a>
            <a href="{{ route('supplier.invoices.pdf', $asn->purchase_id) }}?pdf=1&download=1" target="_blank" class="sp-doc-btn pdf-green">
              <i class="bi bi-download"></i> PDF
            </a>
          </div>
        </div>

        <!-- B. Packing List -->
        <div class="sp-doc-card">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <span style="font-size:11px; font-weight:800; color:#1D4ED8; background:#DBEAFE; padding:4px 10px; border-radius:999px; border:1px solid #93C5FD;">✓ READY</span>
              <div class="sp-doc-icon-box" style="background:#EFF6FF; color:#2563EB;">
                <i class="bi bi-box-seam-fill"></i>
              </div>
            </div>
            <strong style="font-size:14.5px; color:#0F172A; display:block; margin-bottom:2px;">B. Packing List</strong>
            <span style="font-size:12px; color:#64748B; line-height:1.4; display:block;">Carton dimensions &amp; SKU weights</span>
          </div>
          <div style="display:flex; gap:6px; margin-top:16px;">
            <a href="{{ route('supplier.invoices.packing-list', $asn->purchase_id) }}" target="_blank" class="sp-doc-btn view">
              <i class="bi bi-eye"></i> View
            </a>
            <a href="{{ route('supplier.invoices.packing-list', $asn->purchase_id) }}" target="_blank" class="sp-doc-btn print">
              <i class="bi bi-printer"></i> Print
            </a>
            <a href="{{ route('supplier.invoices.packing-list', $asn->purchase_id) }}?pdf=1&download=1" target="_blank" class="sp-doc-btn pdf-blue">
              <i class="bi bi-download"></i> PDF
            </a>
          </div>
        </div>

        <!-- C. Delivery Challan -->
        <div class="sp-doc-card">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <span style="font-size:11px; font-weight:800; color:#6D28D9; background:#EDE9FE; padding:4px 10px; border-radius:999px; border:1px solid #C4B5FD;">✓ READY</span>
              <div class="sp-doc-icon-box" style="background:#FAF5FF; color:#7C3AED;">
                <i class="bi bi-truck-flatbed"></i>
              </div>
            </div>
            <strong style="font-size:14.5px; color:#0F172A; display:block; margin-bottom:2px;">C. Delivery Challan</strong>
            <span style="font-size:12px; color:#64748B; line-height:1.4; display:block;">Gate entry pass &amp; receiver memo</span>
          </div>
          <div style="display:flex; gap:6px; margin-top:16px;">
            <a href="{{ route('supplier.invoices.delivery-challan', $asn->purchase_id) }}" target="_blank" class="sp-doc-btn view">
              <i class="bi bi-eye"></i> View
            </a>
            <a href="{{ route('supplier.invoices.delivery-challan', $asn->purchase_id) }}" target="_blank" class="sp-doc-btn print">
              <i class="bi bi-printer"></i> Print
            </a>
            <a href="{{ route('supplier.invoices.delivery-challan', $asn->purchase_id) }}?pdf=1&download=1" target="_blank" class="sp-doc-btn pdf-purple">
              <i class="bi bi-download"></i> PDF
            </a>
          </div>
        </div>

        <!-- D. LPN Manifest -->
        <div class="sp-doc-card">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <span style="font-size:11px; font-weight:800; color:#0F766E; background:#CCFBF1; padding:4px 10px; border-radius:999px; border:1px solid #99F6E4;">✓ READY</span>
              <div class="sp-doc-icon-box" style="background:#F0FDFA; color:#0D9488;">
                <i class="bi bi-upc-scan"></i>
              </div>
            </div>
            <strong style="font-size:14.5px; color:#0F172A; display:block; margin-bottom:2px;">D. LPN Manifest</strong>
            <span style="font-size:12px; color:#64748B; line-height:1.4; display:block;">Dock barcode scan directory</span>
          </div>
          <div style="display:flex; gap:6px; margin-top:16px;">
            <a href="{{ route('supplier.invoices.lpn-manifest', $asn->purchase_id) }}" target="_blank" class="sp-doc-btn view">
              <i class="bi bi-eye"></i> View
            </a>
            <a href="{{ route('supplier.invoices.lpn-manifest', $asn->purchase_id) }}" target="_blank" class="sp-doc-btn print">
              <i class="bi bi-printer"></i> Print
            </a>
            <a href="{{ route('supplier.invoices.lpn-manifest', $asn->purchase_id) }}?pdf=1&download=1" target="_blank" class="sp-doc-btn pdf-teal">
              <i class="bi bi-download"></i> PDF
            </a>
          </div>
        </div>

        <!-- E. GST e-Way Bill -->
        <div class="sp-doc-card">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <span style="font-size:11px; font-weight:800; color:#C2410C; background:#FFEDD5; padding:4px 10px; border-radius:999px; border:1px solid #FDBA74;">✓ READY</span>
              <div class="sp-doc-icon-box" style="background:#FFF7ED; color:#EA580C;">
                <i class="bi bi-qr-code-scan"></i>
              </div>
            </div>
            <strong style="font-size:14.5px; color:#0F172A; display:block; margin-bottom:2px;">E. GST e-Way Bill</strong>
            <span style="font-size:12px; color:#64748B; line-height:1.4; display:block;">Official electronic transit permit</span>
          </div>
          <div style="display:flex; gap:6px; margin-top:16px;">
            <a href="{{ route('supplier.invoices.eway-bill', $asn->purchase_id) }}" target="_blank" class="sp-doc-btn view">
              <i class="bi bi-eye"></i> View
            </a>
            <a href="{{ route('supplier.invoices.eway-bill', $asn->purchase_id) }}" target="_blank" class="sp-doc-btn print">
              <i class="bi bi-printer"></i> Print
            </a>
            <a href="{{ route('supplier.invoices.eway-bill', $asn->purchase_id) }}?pdf=1&download=1" target="_blank" class="sp-doc-btn pdf-orange">
              <i class="bi bi-download"></i> PDF
            </a>
          </div>
        </div>

      </div>

      <!-- Driver Pack Handover Banner -->
      <div style="background:#F0FDF4; border:1.5px solid #86EFAC; border-radius:16px; padding:18px 22px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px;">
        <div style="display:flex; align-items:center; gap:14px;">
          <div style="font-size:26px;">🚚</div>
          <div>
            <strong style="font-size:15px; color:#0F172A; display:block;">Physical Driver Delivery Pack</strong>
            <span style="font-size:12.5px; color:#15803D; font-weight:600;">Download complete ZIP archive containing all 5 invoices, challans, manifest &amp; barcode labels.</span>
          </div>
        </div>
        <a href="{{ route('supplier.asn.download-package.asn', $asn->id) }}" class="sp-btn-submit" style="height:40px; padding:0 20px; font-size:13px;">
          <i class="bi bi-file-earmark-zip-fill"></i> Download Complete ZIP Pack
        </a>
      </div>

    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════════════════════
       TAB PANE 5: TIMELINE
       ═══════════════════════════════════════════════════════════════════ -->
  <div class="sp-tab-pane" id="tabPane-timeline">
    <div class="sp-card-lux">
      <h2 style="font-size:18px; font-weight:800; color:#0F172A; margin:0 0 16px 0;">Shipment Journey &amp; Milestones</h2>

      <div style="display:flex; flex-direction:column; gap:20px; padding-left:8px; border-left:3px solid #E2E8F0; margin-left:12px;">
        
        <!-- Step 1 -->
        <div style="position:relative; padding-left:24px;">
          <div style="position:absolute; left:-18px; top:0; width:28px; height:28px; border-radius:50%; background:#DCFCE7; color:#15803D; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:14px; border:2px solid #86EFAC;">✓</div>
          <strong style="font-size:14px; color:#0F172A; display:block;">Purchase Order Approved</strong>
          <span style="font-size:12px; color:#64748B;">PO reference {{ $poCode }} confirmed by Suguna Central Hub.</span>
        </div>

        <!-- Step 2 -->
        <div style="position:relative; padding-left:24px;">
          <div style="position:absolute; left:-18px; top:0; width:28px; height:28px; border-radius:50%; background:#DCFCE7; color:#15803D; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:14px; border:2px solid #86EFAC;">✓</div>
          <strong style="font-size:14px; color:#0F172A; display:block;">ASN Created &amp; LPN Cartons Packed</strong>
          <span style="font-size:12px; color:#64748B;">{{ $totalCartonsCount }} carton(s) packed with {{ $totalOrderedUnits }} units. Thermal labels generated.</span>
        </div>

        <!-- Step 3 -->
        <div style="position:relative; padding-left:24px;">
          <div style="position:absolute; left:-18px; top:0; width:28px; height:28px; border-radius:50%; background:#EFF6FF; color:#2563EB; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:14px; border:2px solid #93C5FD;">●</div>
          <strong style="font-size:14px; color:#1E40AF; display:block;">Dispatched &amp; In Transit (Current)</strong>
          <span style="font-size:12px; color:#3B82F6;">Carrier {{ $asn->transporter_name ?: 'Perman Logistics' }} (Vehicle {{ $asn->vehicle_number ?: 'TN03UZ104' }}). Expected arrival {{ $expectedDate }}.</span>
        </div>

        <!-- Step 4 -->
        <div style="position:relative; padding-left:24px; opacity:0.6;">
          <div style="position:absolute; left:-18px; top:0; width:28px; height:28px; border-radius:50%; background:#F1F5F9; color:#94A3B8; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:14px; border:2px solid #CBD5E1;">4</div>
          <strong style="font-size:14px; color:#0F172A; display:block;">Warehouse Gate Verification</strong>
          <span style="font-size:12px; color:#64748B;">Driver check-in and LPN barcode scan at {{ $warehouseName }}.</span>
        </div>

        <!-- Step 5 -->
        <div style="position:relative; padding-left:24px; opacity:0.6;">
          <div style="position:absolute; left:-18px; top:0; width:28px; height:28px; border-radius:50%; background:#F1F5F9; color:#94A3B8; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:14px; border:2px solid #CBD5E1;">5</div>
          <strong style="font-size:14px; color:#0F172A; display:block;">GRN Inwarding &amp; Delivery Acceptance</strong>
          <span style="font-size:12px; color:#64748B;">Items received into active warehouse inventory and GRN generated.</span>
        </div>

      </div>
    </div>
  </div>

</div>

<!-- Slide-Over Create Carton Modal -->
<div class="sp-modal-overlay" id="createCartonModal">
  <div class="sp-modal-drawer-box">
    <div style="display:flex; justify-content:space-between; align-items:center; padding:18px 24px; border-bottom:1px solid #EEF2F7;">
      <strong style="font-size:17px; font-weight:800; color:#0F172A;">+ Pack Items into New LPN Carton</strong>
      <button type="button" onclick="closeCreateCartonModal()" style="background:none; border:none; font-size:20px; color:#94A3B8; cursor:pointer;">✕</button>
    </div>
    
    <div style="padding:20px 24px; overflow-y:auto; flex:1;">
      <form id="frmCreateCarton" action="{{ route('supplier.asn.cartons.store', $asn->id) }}" method="POST">
        @csrf
        <div style="margin-bottom:14px;">
          <label style="font-size:12.5px; font-weight:700; color:#0F172A; display:block; margin-bottom:6px;">Carton Box Type</label>
          <select name="carton_type" id="modalCartonType" class="form-select" style="border-radius:10px; border-color:#E2E8F0; font-size:13px;" onchange="handleTypeChange(this.value)">
            <option value="Small Box">Small Box (20 × 15 × 10 cm) — Max 5 KG</option>
            <option value="Medium Box" selected>Medium Box (40 × 35 × 30 cm) — Max 15 KG</option>
            <option value="Large Box">Large Box (60 × 45 × 40 cm) — Max 30 KG</option>
            <option value="Pallet">Master Pallet (120 × 100 × 140 cm)</option>
          </select>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
          <div>
            <label style="font-size:12.5px; font-weight:700; color:#0F172A; display:block; margin-bottom:6px;">Dimensions (L×W×H)</label>
            <input type="text" name="dimensions" id="modalDims" class="form-control" style="border-radius:10px; border-color:#E2E8F0; font-size:13px;" value="40 x 35 x 30 cm">
          </div>
          <div>
            <label style="font-size:12.5px; font-weight:700; color:#0F172A; display:block; margin-bottom:6px;">Gross Weight (KG)</label>
            <input type="number" step="0.1" name="weight" id="modalWeight" class="form-control" style="border-radius:10px; border-color:#E2E8F0; font-size:13px;" value="5.0">
          </div>
        </div>

        <div style="margin-bottom:16px;">
          <label style="font-size:12.5px; font-weight:700; color:#0F172A; display:block; margin-bottom:8px;">Pack Available Products:</label>
          <div style="background:#F8FAFC; border:1px solid #EEF2F7; border-radius:12px; padding:14px;">
            @foreach($asn->purchase->purchaseItems as $it)
            @php $p = $it->product; @endphp
            <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #E2E8F0;">
              <div>
                <strong style="font-size:13px; color:#0F172A;">{{ $p->name ?? 'Product' }}</strong>
                <div style="font-size:11px; color:#64748B;">SKU: {{ $p->code ?? '8901898053777' }}</div>
              </div>
              <div style="display:flex; align-items:center; gap:8px;">
                <input type="number" name="items[{{ $it->product_id }}]" min="1" max="{{ $it->quantity }}" value="{{ $it->quantity }}" class="form-control form-control-sm text-center" style="width:75px; font-weight:800; border-radius:8px;">
                <span style="font-size:11px; color:#64748B;">Units</span>
              </div>
            </div>
            @endforeach
          </div>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
          <button type="button" class="sp-btn-secondary" onclick="closeCreateCartonModal()">Cancel</button>
          <button type="submit" class="sp-btn-submit">
            <i class="bi bi-check-lg"></i> Pack &amp; Generate LPN
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<!-- Scripts for Dynamic Interaction -->
<script>
const cartonsData = @json($asn->cartons->load('items.product'));
let activeCartonId = {{ $activeCarton ? $activeCarton->id : 'null' }};

// ── Main Tab Switcher ──
function switchMainTab(tabName) {
  document.querySelectorAll('.sp-tab-link').forEach(l => l.classList.remove('active'));
  document.querySelectorAll('.sp-tab-pane').forEach(p => p.classList.remove('active'));

  const link = document.getElementById('mainTabLink-' + tabName);
  const pane = document.getElementById('tabPane-' + tabName);
  const crumb = document.getElementById('crumbCurrentTab');

  if (link) link.classList.add('active');
  if (pane) pane.classList.add('active');
  
  const labels = {
    'overview': 'Overview',
    'products': 'Products',
    'cartons': 'Cartons (LPN)',
    'documents': 'Documents',
    'timeline': 'Timeline'
  };
  if (crumb && labels[tabName]) {
    crumb.innerText = labels[tabName];
  }

  window.location.hash = tabName;
}

// ── Select Carton Row ──
function selectCarton(cartonId) {
  const c = cartonsData.find(x => x.id === cartonId);
  if (!c) return;
  activeCartonId = cartonId;

  document.querySelectorAll('.sp-data-table tr').forEach(r => r.classList.remove('selected'));
  const row = document.getElementById('carton-row-' + cartonId);
  if (row) row.classList.add('selected');

  document.getElementById('lpnDetailNumber').innerText = c.lpn_number;
  document.getElementById('lpnDetailStatus').innerText = c.status || 'In Transit';
  document.getElementById('lpnDetailSub').innerText = c.carton_number + ' of ' + cartonsData.length;
  document.getElementById('lpnDetailType').innerText = c.carton_type;
  document.getElementById('lpnDetailDims').innerText = c.dimensions || '40 × 35 × 30 cm';
  document.getElementById('lpnDetailWeight').innerText = (c.weight || 5) + ' KG';
  document.getElementById('lpnProductsCount').innerText = c.items.length;
  document.getElementById('lblPreviewCartonNumber').innerText = c.carton_number;
  document.getElementById('lblPreviewLpn').innerText = c.lpn_number;
  document.getElementById('lblPreviewType').innerText = c.carton_type;
  document.getElementById('lpnDownloadPdfLink').href = `/supplier/cartons/${c.id}/label?pdf=1&download=1`;

  let totalUnits = 0;
  let rowsHtml = '';
  c.items.forEach(it => {
    totalUnits += (parseInt(it.packed_quantity) || 0);
    const pName = (it.product && it.product.name) ? it.product.name : 'Product Item';
    const sku = it.sku || (it.product ? it.product.code : '8901898053777');
    rowsHtml += `
      <tr>
        <td><strong style="color: #0F172A; font-size: 13.5px; font-weight: 800;">${pName}</strong></td>
        <td><span style="font-weight: 700; color: #475569; font-size: 12.5px;">${sku}</span></td>
        <td style="text-align: right;"><strong style="color: #16A34A; font-size: 14px; font-weight: 900;">${it.packed_quantity}</strong></td>
      </tr>
    `;
  });
  document.getElementById('lpnDetailQty').innerText = totalUnits + ' Units';
  document.getElementById('lpnProductRows').innerHTML = rowsHtml;

  try {
    if (window.JsBarcode) {
      JsBarcode("#drawerBarcodeSvg", c.lpn_number, { format: "CODE128", width: 1.8, height: 44, displayValue: false });
    }
  } catch(e) {}
}

function selectCartonAndScroll(cartonId) {
  selectCarton(cartonId);
  const el = document.getElementById('lpnDetailSection');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function viewContentsAction() {
  switchLpnContentTab('products');
  const pane = document.getElementById('lpnProductsPane');
  if (pane) {
    pane.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function switchLpnContentTab(tab) {
  document.getElementById('tabBtnProducts').classList.toggle('active', tab === 'products');
  document.getElementById('tabBtnLabel').classList.toggle('active', tab === 'label');
  document.getElementById('lpnProductsPane').style.display = tab === 'products' ? 'block' : 'none';
  document.getElementById('lpnLabelPane').style.display = tab === 'label' ? 'block' : 'none';

  if (tab === 'label') {
    const lpn = document.getElementById('lpnDetailNumber').innerText;
    try {
      JsBarcode("#drawerBarcodeSvg", lpn, { format: "CODE128", width: 1.8, height: 44, displayValue: false });
    } catch(e) {}
  }
}

function printActiveLpnLabel() {
  if (activeCartonId) {
    printCartonThermalLabel(activeCartonId);
  }
}

function printCartonThermalLabel(cartonId) {
  const c = cartonsData.find(x => x.id === cartonId);
  if (!c) return;

  const printWin = window.open('', '_blank', 'width=480,height=700');
  printWin.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Thermal LPN Label - ${c.lpn_number}</title>
      <style>
        @page { size: 4in 6in portrait; margin: 4mm; }
        * { box-sizing: border-box; }
        body { margin: 0; padding: 8px; font-family: monospace; background: #FFF; width: 3.8in; min-height: 5.6in; }
        .label-wrap { border: 2.5px solid #000; border-radius: 8px; padding: 12px; }
      </style>
    </head>
    <body>
      <div class="label-wrap">
        <div style="display:flex; justify-content:space-between; border-bottom:2px solid #000; padding-bottom:6px; margin-bottom:8px;">
          <strong style="font-size:14px;">SUGUNA LOGISTICS</strong>
          <span style="font-size:11px; font-weight:bold;">${c.carton_number}</span>
        </div>
        <div style="text-align:center; font-weight:900; font-size:16px; margin:6px 0;">${c.lpn_number}</div>
        <div style="text-align:center; margin:8px 0;">
          <svg id="pSvg" style="height:44px; width:90%;"></svg>
        </div>
        <div style="border-top:1.5px dashed #000; border-bottom:1.5px dashed #000; padding:8px 0; margin:8px 0; font-size:10.5px; display:grid; grid-template-columns:1fr 1fr; gap:6px;">
          <div>PO: <strong>{{ $poCode }}</strong></div>
          <div>Destination: <strong>{{ $warehouseName }}</strong></div>
          <div>Box Type: <strong>${c.carton_type}</strong></div>
          <div>Weight: <strong>${c.weight} KG</strong></div>
        </div>
        <div style="font-size:10px; font-weight:bold;">CONTENTS:</div>
        <div style="font-size:10.5px; margin-top:2px;">
          ${c.items.map(it => `• ${(it.product ? it.product.name : 'Item')} × ${it.packed_quantity}`).join('<br>')}
        </div>
      </div>
      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
      <script>
        window.onload = function() {
          JsBarcode("#pSvg", "${c.lpn_number}", { format: "CODE128", width: 2, height: 44, displayValue: true });
          setTimeout(() => { window.print(); }, 350);
        };
      <\/script>
    </body>
    </html>
  `);
  printWin.document.close();
}

function printAllLabels() {
  cartonsData.forEach((c, idx) => {
    setTimeout(() => { printCartonThermalLabel(c.id); }, idx * 400);
  });
}

function printAllDriverPack() {
  const docs = [
    "{{ route('supplier.invoices.pdf', $asn->purchase_id) }}",
    "{{ route('supplier.invoices.packing-list', $asn->purchase_id) }}",
    "{{ route('supplier.invoices.delivery-challan', $asn->purchase_id) }}",
    "{{ route('supplier.invoices.lpn-manifest', $asn->purchase_id) }}",
    "{{ route('supplier.invoices.eway-bill', $asn->purchase_id) }}"
  ];
  docs.forEach((d, i) => {
    setTimeout(() => { window.open(d, '_blank'); }, i * 350);
  });
}

function exportCartonsCsv() {
  let csv = 'Carton Number,LPN Number,Carton Type,Dimensions,Weight,Product,SKU,Quantity\n';
  cartonsData.forEach(c => {
    c.items.forEach(it => {
      const pName = (it.product && it.product.name) ? it.product.name.replace(/,/g, '') : 'Item';
      const sku = it.sku || (it.product ? it.product.code : '');
      csv += `"${c.carton_number}","${c.lpn_number}","${c.carton_type}","${c.dimensions}","${c.weight}","${pName}","${sku}",${it.packed_quantity}\n`;
    });
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `cartons_{{ $asn->asn_number }}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function openCreateCartonModal() { document.getElementById('createCartonModal').classList.add('open'); }
function closeCreateCartonModal() { document.getElementById('createCartonModal').classList.remove('open'); }

function handleTypeChange(val) {
  const maps = {
    'Small Box': { d: '20 x 15 x 10 cm', w: '2.5' },
    'Medium Box': { d: '40 x 35 x 30 cm', w: '5.0' },
    'Large Box': { d: '60 x 45 x 40 cm', w: '12.0' },
    'Pallet': { d: '120 x 100 x 140 cm', w: '50.0' }
  };
  if (maps[val]) {
    document.getElementById('modalDims').value = maps[val].d;
    document.getElementById('modalWeight').value = maps[val].w;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (cartonsData.length > 0) {
    try {
      JsBarcode("#drawerBarcodeSvg", cartonsData[0].lpn_number, { format: "CODE128", width: 1.8, height: 44, displayValue: false });
    } catch(e) {}
  }

  // Handle URL hash if specified (e.g. #documents, #products)
  if (window.location.hash) {
    const hash = window.location.hash.substring(1);
    if (['overview', 'products', 'cartons', 'documents', 'timeline'].includes(hash)) {
      switchMainTab(hash);
    }
  }
});
</script>
@endsection