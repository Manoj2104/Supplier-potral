@extends('supplier.layout')
@section('title', 'Create Advance Shipping Notice (ASN) | Suguna')

@section('head')
<!-- Real-Time Barcode & QR Code Engine -->
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>

<style>
/* ══════════════════════════════════════════════════════════════════════
   ENTERPRISE SHIPPING & LPN DISPATCH WORK CENTER
   ══════════════════════════════════════════════════════════════════════ */

:root {
  --sp-primary: #15803D;
  --sp-primary-hover: #166534;
  --sp-primary-light: #DCFCE7;
  --sp-text-dark: #0F172A;
  --sp-text-muted: #64748B;
  --sp-border: #EEF2F7;
  --sp-bg-light: #F8FAFC;
  --sp-card-radius: 22px;
}

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
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 18px;
}

.sp-page-title {
  font-size: 34px;
  font-weight: 800;
  color: #0F172A;
  letter-spacing: -1px;
  line-height: 1.15;
  margin: 0 0 4px 0;
}

.sp-page-subtitle {
  font-size: 14px;
  color: #64748B;
  margin: 0;
  font-weight: 400;
}

/* ── Action Buttons ── */
/* ── Action Buttons (Luxury Enterprise Standard) ── */
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
  color: #0F172A !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08) !important;
}

.sp-btn-pill.sp-btn-primary,
.sp-btn-primary {
  background: #15803D !important;
  color: #FFFFFF !important;
  border: 1px solid #15803D !important;
  border-radius: 9999px !important;
  box-shadow: 0 4px 14px rgba(21, 128, 61, 0.28) !important;
}

.sp-btn-pill.sp-btn-primary:hover,
.sp-btn-primary:hover {
  background: #166534 !important;
  border-color: #166534 !important;
  color: #FFFFFF !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 6px 18px rgba(21, 128, 61, 0.38) !important;
}

.sp-btn-pill.sp-btn-soft-green {
  background: #ECFDF5 !important;
  color: #15803D !important;
  border: 1.5px solid #86EFAC !important;
  box-shadow: 0 2px 6px rgba(21, 128, 61, 0.06) !important;
}

.sp-btn-pill.sp-btn-soft-green:hover {
  background: #DCFCE7 !important;
  border-color: #4ADE80 !important;
  color: #166534 !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(21, 128, 61, 0.12) !important;
}

.sp-btn-pill.sp-btn-soft-blue {
  background: #EFF6FF !important;
  color: #2563EB !important;
  border: 1.5px solid #BFDBFE !important;
}

.sp-btn-pill.sp-btn-soft-blue:hover {
  background: #DBEAFE !important;
  border-color: #93C5FD !important;
  color: #1D4ED8 !important;
  transform: translateY(-1px) !important;
}

.sp-btn-secondary {
  height: 42px !important;
  padding: 0 20px !important;
  border-radius: 9999px !important;
  font-size: 13.5px !important;
  font-weight: 700 !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
  border: 1px solid #E2E8F0 !important;
  background: #FFFFFF !important;
  color: #334155 !important;
  cursor: pointer !important;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04) !important;
  transition: all 0.18s ease !important;
  text-decoration: none !important;
}
.sp-btn-secondary:hover {
  background: #F8FAFC !important;
  border-color: #CBD5E1 !important;
  color: #0F172A !important;
  transform: translateY(-1px) !important;
}

.sp-btn-cancel {
  height: 42px !important;
  padding: 0 22px !important;
  border-radius: 9999px !important;
  font-size: 13.5px !important;
  font-weight: 700 !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
  border: 1px solid #FECACA !important;
  background: #FEF2F2 !important;
  color: #DC2626 !important;
  cursor: pointer !important;
  transition: all 0.18s ease !important;
  text-decoration: none !important;
}
.sp-btn-cancel:hover {
  background: #FEE2E2 !important;
  border-color: #FCA5A5 !important;
  color: #B91C1C !important;
  transform: translateY(-1px) !important;
}

.sp-btn-submit {
  height: 44px !important;
  padding: 0 26px !important;
  border-radius: 9999px !important;
  font-size: 13.5px !important;
  font-weight: 800 !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
  border: 1px solid #15803D !important;
  background: #15803D !important;
  color: #FFFFFF !important;
  cursor: pointer !important;
  box-shadow: 0 4px 14px rgba(21, 128, 61, 0.28) !important;
  transition: all 0.18s ease !important;
  text-decoration: none !important;
  white-space: nowrap !important;
}
.sp-btn-submit:hover {
  background: #166534 !important;
  border-color: #166534 !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 6px 20px rgba(21, 128, 61, 0.38) !important;
  color: #FFFFFF !important;
}

/* ── Meta Pills Strip ── */
.sp-meta-strip {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 24px;
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
.sp-meta-item.blue strong {
  color: #1D4ED8;
}

.sp-meta-item.green {
  background: #DCFCE7;
  border-color: #86EFAC;
  color: #15803D;
}
.sp-meta-item.green strong {
  color: #166534;
}

.sp-meta-item.purple {
  background: #F3E8FF;
  border-color: #DDD6FE;
  color: #7C3AED;
}
.sp-meta-item.purple strong {
  color: #6D28D9;
}

.sp-meta-item.slate {
  background: #F8FAFC;
  border-color: #E2E8F0;
  color: #475569;
}

.sp-btn-pill.sp-btn-danger {
  background: #FEE2E2;
  color: #991B1B;
  border-color: #FCA5A5;
}

/* ── 3. Section Cards ── */
.sp-card-lux {
  background: #FFFFFF;
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-card-radius);
  padding: 24px 26px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.02);
}

.sp-section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid #F1F5F9;
  flex-wrap: wrap;
  gap: 12px;
}

.sp-section-title-wrap h2 {
  font-size: 17px;
  font-weight: 800;
  color: var(--sp-text-dark);
  margin: 0 0 2px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.sp-section-title-wrap p {
  font-size: 13px;
  color: var(--sp-text-muted);
  margin: 0;
}

/* Items To Ship Visual Summary Grid */
.sp-qty-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  background: #F8FAFC;
  border: 1px solid #EEF2F7;
  border-radius: 14px;
  padding: 16px 18px;
  margin-bottom: 18px;
}
@media (max-width: 800px) { .sp-qty-summary-grid { grid-template-columns: repeat(2, 1fr); } }

.sp-qty-box {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.sp-qty-box-lbl {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--sp-text-muted);
  letter-spacing: 0.04em;
}
.sp-qty-box-val {
  font-size: 18px;
  font-weight: 800;
  color: var(--sp-text-dark);
}

/* Clean Product Table */
.sp-table-clean {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}
.sp-table-clean th {
  padding: 12px 14px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: #64748B;
  text-transform: uppercase;
  border-bottom: 1px solid #EEF2F7;
  background: #F8FAFC;
}
.sp-table-clean td {
  padding: 14px 14px;
  font-size: 13px;
  color: var(--sp-text-dark);
  border-bottom: 1px solid #F1F5F9;
  vertical-align: middle;
}

/* LPN Explainer Tooltip Banner */
.sp-lpn-explainer {
  background: #EFF6FF;
  border: 1px solid #BFDBFE;
  border-radius: 14px;
  padding: 16px 20px;
  margin-bottom: 18px;
  display: flex;
  align-items: flex-start;
  gap: 14px;
}
.sp-lpn-explainer-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #DBEAFE;
  color: #1E40AF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

/* LPN Cards Grid */
.sp-lpn-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  margin-top: 18px;
}

.sp-lpn-card {
  background: #FFFFFF;
  border: 1.5px solid #E2E8F0;
  border-radius: 16px;
  padding: 18px;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.02);
  transition: all 180ms ease;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.sp-lpn-card:hover {
  border-color: #93C5FD;
  box-shadow: 0 6px 18px rgba(37, 99, 235, 0.06);
}

.sp-lpn-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: #EFF6FF;
  border: 1px solid #BFDBFE;
  color: #1E40AF;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 800;
  font-family: monospace;
}

/* Shipping Document Cards Grid (Luxury Responsive Layout) */
.sp-doc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
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

/* Driver Delivery Pack Banner */
.sp-driver-pack-banner {
  background: #F0FDF4;
  border: 1.5px solid #86EFAC;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

/* Warehouse Receiving Workflow Box */
.sp-wh-workflow-box {
  background: #FFFBEB;
  border: 1px solid #FDE68A;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
}

/* Form Inputs Grid */
.sp-form-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
@media (max-width: 768px) { .sp-form-grid-2 { grid-template-columns: 1fr; } }

.sp-form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.sp-form-label {
  font-size: 12.5px;
  font-weight: 700;
  color: #334155;
}
.sp-form-input {
  height: 42px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid var(--sp-border);
  font-size: 13.5px;
  font-weight: 500;
  color: var(--sp-text-dark);
  background: #FFFFFF;
  outline: none;
  transition: all 150ms ease;
}
.sp-form-input:focus {
  border-color: #16A34A;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.08);
}

/* Modals & Drawers */
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
  border-radius: 20px !important;
  width: 100% !important;
  max-width: 640px !important;
  max-height: 90vh !important;
  overflow-y: auto !important;
  padding: 26px !important;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
  z-index: 99999 !important;
}

.sp-drawer-backdrop {
  position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
  background: rgba(15, 23, 42, 0.5) !important;
  backdrop-filter: blur(3px) !important;
  z-index: 99990 !important;
  display: none;
}
.sp-drawer-backdrop.show { display: block !important; }

.sp-drawer {
  position: fixed !important; top: 0 !important; right: -600px !important; bottom: 0 !important;
  width: 560px !important;
  max-width: 92vw !important;
  background: #FFFFFF !important;
  z-index: 99995 !important;
  box-shadow: -10px 0 40px rgba(0, 0, 0, 0.18) !important;
  transition: right 0.28s cubic-bezier(0.16, 1, 0.3, 1) !important;
  display: flex !important;
  flex-direction: column !important;
}
.sp-drawer.show { right: 0 !important; }
.sp-drawer-head {
  padding: 20px 24px;
  border-bottom: 1px solid #E2E8F0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.sp-drawer-body { padding: 22px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 16px; }
.sp-drawer-foot {
  padding: 16px 24px; border-top: 1px solid #E2E8F0; background: #FFFFFF;
  display: flex; justify-content: flex-end; gap: 10px;
}
</style>
@endsection

@section('content')

@php
  $poCode = $purchase->reference_code ?: ('PO-'.$purchase->id);
  $warehouseName = $purchase->warehouse->name ?? 'Suguna Warehouse';
  $expectedEta = \Carbon\Carbon::parse($purchase->date)->addDays(4)->format('d M Y');
  $totalSkus = $purchase->purchaseItems->count();
  $totalUnits = $totalOrderedUnits ?? $purchase->purchaseItems->sum('quantity');
  $alreadyShipped = $alreadyShippedUnits ?? 0;
  $remainingUnitsVal = $remainingUnits ?? max(0, $totalUnits - $alreadyShipped);
  $poValue = $purchase->grand_total ?? 0;
@endphp

<div class="dashboard-page premium-workspace">

  <!-- ── Flash Error Messages ── -->
  @if(session('error'))
  <div style="background:#FEE2E2; border:1.5px solid #FCA5A5; border-radius:14px; padding:14px 20px; margin-bottom:20px; color:#991B1B; font-weight:700; display:flex; align-items:center; gap:12px;">
    <i class="bi bi-exclamation-octagon-fill" style="font-size:20px; color:#DC2626;"></i>
    <span>{{ session('error') }}</span>
  </div>
  @endif

  <!-- ── 1. Breadcrumb Navigation ── -->
  <div class="sp-breadcrumb">
    <span>Dashboard</span>
    <i class="bi bi-chevron-right"></i>
    <span>ASN (Dispatch)</span>
    <i class="bi bi-chevron-right"></i>
    <span class="active">Create Advance Shipping Notice</span>
  </div>

  <!-- ── 2. Top Header Bar (Title on Left, Action Buttons on Right) ── -->
  <div class="sp-page-intro-header">
    <div class="sp-page-intro-left">
      <h1 class="sp-page-title">Create Advance Shipping Notice</h1>
      <p class="sp-page-subtitle">Prepare items, pack cartons, generate delivery documents, and dispatch this shipment.</p>
    </div>
    <div class="sp-page-intro-actions">
      <button type="button" class="sp-btn-secondary" onclick="alert('Draft progress saved.')">
        <i class="bi bi-floppy"></i> Save Draft
      </button>
      <a href="{{ route('supplier.asn.index') }}" class="sp-btn-cancel">
        Cancel
      </a>
      @if($existingAsn)
      <a href="{{ route('supplier.asn.show', $existingAsn->id) }}" class="sp-btn-submit" style="background:#2563EB;">
        <i class="bi bi-eye-fill"></i> View ASN: {{ $existingAsn->asn_number }}
      </a>
      @else
      <button type="button" class="sp-btn-submit" id="topSubmitBtn" onclick="validateAndOpenDispatchModal()">
        <i class="bi bi-send-fill"></i> Submit & Dispatch ASN
      </button>
      @endif
    </div>
  </div>

  <!-- ── ⚠️ ALREADY CREATED PROMINENT WARNING BANNER ── -->
  @if($existingAsn)
  <div class="sp-already-created-banner" style="background: linear-gradient(135deg, #FEF2F2 0%, #FFF1F2 100%); border: 1.5px solid #FCA5A5; border-radius: 18px; padding: 20px 24px; margin-bottom: 22px; box-shadow: 0 4px 16px rgba(239, 68, 68, 0.08); display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
    <div style="display: flex; align-items: flex-start; gap: 14px; max-width: 780px;">
      <div style="width: 44px; height: 44px; border-radius: 12px; background: #FEE2E2; color: #DC2626; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; border: 1px solid #FECACA;">
        <i class="bi bi-exclamation-triangle-fill"></i>
      </div>
      <div>
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px; flex-wrap: wrap;">
          <h3 style="font-size: 16.5px; font-weight: 800; color: #991B1B; margin: 0;">
            ASN Already Created for PO: {{ $poCode }}
          </h3>
          <span style="background: #FEE2E2; color: #B91C1C; font-size: 11.5px; font-weight: 800; padding: 3px 10px; border-radius: 999px; border: 1px solid #FCA5A5;">
            {{ $existingAsn->asn_number }} ({{ $existingAsn->status_label }})
          </span>
        </div>
        <p style="font-size: 13px; color: #7F1D1D; margin: 0 0 12px 0; line-height: 1.5;">
          An Advance Shipping Notice has already been created for this Purchase Order (<strong>{{ $poCode }}</strong>).
          Please choose a different PO ID to create a new ASN, or view the existing dispatch details.
        </p>
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <a href="{{ route('supplier.asn.show', $existingAsn->id) }}" class="sp-btn-pill" style="background: #FFFFFF; color: #991B1B; border: 1.5px solid #FCA5A5; font-size: 12px; font-weight: 700; height: 34px; padding: 0 14px; border-radius: 999px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
            <i class="bi bi-eye-fill"></i> View Existing ASN ({{ $existingAsn->asn_number }})
          </a>
          <a href="{{ route('supplier.asn.select-po') }}" class="sp-btn-pill sp-btn-primary" style="font-size: 12px; font-weight: 700; height: 34px; padding: 0 14px; border-radius: 999px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
            <i class="bi bi-arrow-repeat"></i> Choose Different PO ID
          </a>
        </div>
      </div>
    </div>

    <div style="text-align: right; background: #FFFFFF; border: 1px solid #FECACA; border-radius: 12px; padding: 10px 16px;">
      <span style="font-size: 11px; font-weight: 700; color: #991B1B; text-transform: uppercase; letter-spacing: 0.05em; display: block;">Status</span>
      <strong style="font-size: 13.5px; color: #16A34A;">{{ $existingAsn->status_label }}</strong>
    </div>
  </div>
  @endif

  <!-- ── 3. Meta Badges Strip ── -->
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
      <span>Expected Delivery: <strong>{{ $expectedEta }}</strong></span>
    </div>
    <div class="sp-meta-item purple">
      <i class="bi bi-box-seam"></i>
      <span>Order Total: <strong>{{ $totalUnits }} Units</strong></span>
    </div>
  </div>

  <!-- ── Master Form ── -->
  <form id="asnMainForm" action="{{ route('supplier.asn.store') }}" method="POST" enctype="multipart/form-data">
    @csrf
    <input type="hidden" name="purchase_id" value="{{ $purchase->id }}">
    <input type="hidden" name="cartons_json" id="cartons_json" value="[]">

    <!-- ── SECTION 1: WHAT DO I NEED TO SHIP? ── -->
    <div class="sp-card-lux">
      <div class="sp-section-head">
        <div class="sp-section-title-wrap">
          <h2><i class="bi bi-box-seam" style="color: #15803D;"></i> 1. Items to Ship</h2>
          <p>Confirm the products and quantities you are sending to the warehouse.</p>
        </div>

        <div style="display:flex; align-items:center; gap:8px;">
          @if(!$existingAsn)
          <button type="button" class="sp-btn-pill sp-btn-soft-green" style="height:36px; padding:0 14px; font-size:12.5px;" onclick="quickPackAll()">
            <i class="bi bi-lightning-charge-fill"></i> Pack 100% in 1 Carton
          </button>
          @endif
          @if(isset($allPos) && count($allPos) > 1)
          <div style="display:flex; align-items:center; gap:6px;">
            <label style="font-size:11.5px; font-weight:700; color:#64748B; margin:0; text-transform:uppercase;">Select PO:</label>
            <select class="sp-form-input" style="height:36px; padding:0 10px; font-size:12px; font-weight:700; border-radius:10px; max-width:240px;" onchange="if(this.value) window.location.href=this.value;">
              @foreach($allPos as $poOpt)
                @php
                  $poOptCode = $poOpt->reference_code ?: ('PO-'.$poOpt->id);
                  $poStatusSuffix = $poOpt->has_asn ? (' (⚠️ ASN: '.$poOpt->latest_asn->asn_number.')') : ' (✓ Ready)';
                @endphp
                <option value="{{ route('supplier.asn.create', $poOpt->id) }}" {{ $poOpt->id == $purchase->id ? 'selected' : '' }}>
                  {{ $poOptCode }}{{ $poStatusSuffix }}
                </option>
              @endforeach
            </select>
          </div>
          @endif
        </div>
      </div>

      <!-- Visual Quantity Summary -->
      <div class="sp-qty-summary-grid">
        <div class="sp-qty-box">
          <span class="sp-qty-box-lbl">Total Ordered</span>
          <span class="sp-qty-box-val">{{ $totalUnits }} Units</span>
        </div>
        <div class="sp-qty-box">
          <span class="sp-qty-box-lbl">Already Shipped (ASN)</span>
          <span class="sp-qty-box-val" style="color:{{ $alreadyShipped > 0 ? '#15803D' : '#64748B' }};">{{ $alreadyShipped }} Units</span>
        </div>
        <div class="sp-qty-box">
          <span class="sp-qty-box-lbl">This Shipment</span>
          <span class="sp-qty-box-val" style="color:#15803D;" id="summaryThisShipmentVal">{{ $remainingUnitsVal }} Units</span>
        </div>
        <div class="sp-qty-box">
          <span class="sp-qty-box-lbl">Remaining PO Qty</span>
          <span class="sp-qty-box-val" style="color:#2563EB;" id="summaryRemainingVal">0 Units</span>
        </div>
      </div>

      <!-- Products Table -->
      <div style="overflow-x:auto;">
        <table class="sp-table-clean">
          <thead>
            <tr>
              <th style="width:34%;">PRODUCT & SKU</th>
              <th style="text-align:center; width:12%;">ORDERED</th>
              <th style="text-align:center; width:12%;">ALREADY ASN</th>
              <th style="text-align:center; width:14%;">THIS SHIPMENT</th>
              <th style="text-align:center; width:12%;">REMAINING</th>
              <th style="text-align:center; width:16%;">PACKING STATUS</th>
            </tr>
          </thead>
          <tbody>
            @foreach($purchase->purchaseItems as $item)
            @php
              $p = $item->product;
              $sku = $p ? ($p->code ?: 'SKU-'.$p->id) : 'SKU-001';
              $pImg = (!empty($p) && !empty($p->image_url)) ? $p->image_url : '/uploads/main_product/1116/Lays_Classic_Salted__1.jpg';
              $itemAlreadyShipped = 0;
              if(!empty($existingAsns) && $existingAsns->isNotEmpty()) {
                $itemAlreadyShipped = (int) \App\Models\LpnItem::whereHas('carton', function($q) use ($existingAsns) {
                  $q->whereIn('asn_id', $existingAsns->pluck('id'));
                })->where('product_id', $item->product_id)->sum('packed_quantity');
                if ($itemAlreadyShipped == 0 && $existingAsn) {
                  $itemAlreadyShipped = $item->quantity;
                }
              }
              $itemAlreadyShipped = min($item->quantity, $itemAlreadyShipped);
              $itemRemaining = max(0, $item->quantity - $itemAlreadyShipped);
            @endphp
            <tr id="row-prod-{{ $item->product_id }}">
              <td>
                <div style="display:flex; align-items:center; gap:12px;">
                  <img src="{{ $pImg }}" alt="Product" style="width:40px; height:40px; border-radius:8px; object-fit:cover; border:1px solid #E2E8F0;" onerror="this.onerror=null;this.src='/uploads/main_product/1116/Lays_Classic_Salted__1.jpg';">
                  <div>
                    <strong style="font-size:13.5px; color:#0F172A; display:block;">{{ $p->name ?? 'Product Item' }}</strong>
                    <span style="font-size:11.5px; color:#64748B; font-weight:600;">SKU: {{ $sku }}</span>
                  </div>
                </div>
              </td>
              <td style="text-align:center; font-weight:800; font-size:14px;">{{ $item->quantity }}</td>
              <td style="text-align:center; color:{{ $itemAlreadyShipped > 0 ? '#15803D' : '#64748B' }}; font-weight:700;">{{ $itemAlreadyShipped }}</td>
              <td style="text-align:center;">
                <input type="number" min="0" max="{{ $itemRemaining }}" class="sp-form-input this-shipment-qty-input" data-prod-id="{{ $item->product_id }}" data-ordered-qty="{{ $item->quantity }}" value="{{ $itemRemaining }}" style="width:85px; height:34px; text-align:center; font-weight:800; color:#15803D; margin:0 auto;" oninput="handleShipmentQtyChange(this, {{ $item->product_id }}, {{ $item->quantity }})" {{ $itemRemaining == 0 ? 'disabled' : '' }}>
              </td>
              <td style="text-align:center; font-weight:800; color:#2563EB;" id="cell-rem-{{ $item->product_id }}">0</td>
              <td style="text-align:center;">
                @if($itemRemaining == 0)
                <span class="badge" id="cell-status-{{ $item->product_id }}" style="background:#F1F5F9; color:#64748B; font-size:11.5px; padding:5px 12px; border-radius:999px; font-weight:800; border:1px solid #CBD5E1;">
                  ✓ Fulfilled ({{ $itemAlreadyShipped }}/{{ $item->quantity }})
                </span>
                @else
                <span class="badge" id="cell-status-{{ $item->product_id }}" style="background:#DCFCE7; color:#15803D; font-size:11.5px; padding:5px 12px; border-radius:999px; font-weight:800; border:1px solid #86EFAC;">
                  ✓ Ready to Pack
                </span>
                @endif
              </td>
            </tr>
            @endforeach
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── SECTION 2: LPN / CARTON PACKING ── -->
    <div class="sp-card-lux">
      <div class="sp-section-head">
        <div class="sp-section-title-wrap">
          <h2><i class="bi bi-upc-scan" style="color: #2563EB;"></i> 2. Pack Items into LPN / Cartons</h2>
          <p>An LPN identifies one physical carton/pallet and the products packed inside it.</p>
        </div>

        <div style="display:flex; align-items:center; gap:10px;">
          <span id="packSummaryPill" style="font-size:12.5px; font-weight:800; padding:6px 14px; border-radius:999px; background:#FEF3C7; color:#D97706; border:1px solid #FDE68A;">
            LPNs: 0 | Packed: 0 / {{ $totalUnits }} (0%)
          </span>
          <button type="button" class="sp-btn-pill sp-btn-primary" onclick="openCreateLpnModal()">
            <i class="bi bi-plus-lg"></i> Create LPN / Carton
          </button>
        </div>
      </div>

      <!-- LPN Explainer Tooltip Banner -->
      <div class="sp-lpn-explainer">
        <div class="sp-lpn-explainer-icon">
          <i class="bi bi-info-circle-fill"></i>
        </div>
        <div>
          <strong style="font-size:13.5px; color:#1E40AF; display:block;">What is an LPN (License Plate Number)?</strong>
          <p style="font-size:12.5px; color:#1E3A8A; margin:3px 0 0 0; line-height:1.5;">
            An LPN is a unique barcode assigned to a physical carton or pallet. Warehouse staff scan this LPN to instantly verify contents without opening the box.
            Example: <strong>LPN-2026-0001</strong> contains <strong>{{ $purchase->purchaseItems->first()->product->name ?? 'Product' }} ({{ $totalUnits }} Units)</strong> destined for <strong>{{ $warehouseName }}</strong>.
          </p>
        </div>
      </div>

      <!-- Packing Progress Meter -->
      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:14px 18px; margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; font-size:12.5px; font-weight:700; margin-bottom:6px;">
          <span id="progLabel">Shipment Packing Progress: 0 / {{ $totalUnits }} Packed</span>
          <span id="progPercent" style="color:#D97706; font-weight:800;">0%</span>
        </div>
        <div style="height:10px; background:#E2E8F0; border-radius:999px; overflow:hidden;">
          <div id="progBar" style="width:0%; height:100%; background:#D97706; transition:width 250ms ease, background 250ms ease;"></div>
        </div>
      </div>

      <!-- LPN Cards Grid -->
      <div class="sp-lpn-grid" id="lpnCardsGrid" style="display:none;"></div>

      <div id="noLpnPlaceholder" style="background:#FFFFFF; border:2px dashed #CBD5E1; border-radius:16px; padding:32px 20px; text-align:center; margin-bottom:10px;">
        <div style="width:54px; height:54px; border-radius:16px; background:#EFF6FF; color:#2563EB; font-size:26px; display:flex; align-items:center; justify-content:center; margin:0 auto 12px auto;">
          📦
        </div>
        <div style="font-size:16px; font-weight:800; color:#0F172A; margin-bottom:4px;">No Cartons Packed Yet</div>
        <p style="font-size:13px; color:#64748B; max-width:440px; margin:0 auto 18px auto; line-height:1.5;">
          Pack your ordered items into one or more LPN cartons to prepare your physical shipment. You can split across multiple cartons or quick-pack in 1-click.
        </p>
        <div style="display:flex; justify-content:center; align-items:center; gap:12px; flex-wrap:wrap;">
          <button type="button" class="sp-btn-pill sp-btn-primary" style="height:42px; padding:0 22px; font-size:13.5px;" onclick="openCreateLpnModal()">
            <i class="bi bi-box-seam"></i> + Pack into Carton / LPN
          </button>
          <button type="button" class="sp-btn-pill sp-btn-soft-green" style="height:42px; padding:0 22px; font-size:13.5px;" onclick="quickPackAll()">
            <i class="bi bi-lightning-charge-fill"></i> ⚡ 1-Click Quick Pack All
          </button>
        </div>
      </div>
    </div>

    <!-- ── SECTION 3: TRANSPORT & DRIVER DETAILS ── -->
    <div class="sp-card-lux" id="transportDetailsSection">
      <div class="sp-section-head">
        <div class="sp-section-title-wrap">
          <h2><i class="bi bi-truck" style="color: #D97706;"></i> 3. Transport &amp; Driver Details</h2>
          <p>Assign carrier and driver contact information for warehouse gate check-in &amp; delivery documents.</p>
        </div>
      </div>

      <div class="sp-form-grid-2">
        <div class="sp-form-group">
          <label class="sp-form-label">Transporter / Carrier Company <span style="color:#DC2626;">*</span></label>
          <input type="text" name="transport_company" id="inpTransporter" class="sp-form-input" value="{{ old('transport_company', 'Perman Logistics') }}" placeholder="e.g. VRL Logistics, Perman" required oninput="updateLiveDocsState()">
        </div>
        <div class="sp-form-group">
          <label class="sp-form-label">Vehicle Number <span style="color:#DC2626;">*</span></label>
          <input type="text" name="vehicle_number" id="inpVehicle" class="sp-form-input" value="{{ old('vehicle_number', 'TN03UZ104') }}" placeholder="e.g. TN03UZ104" required oninput="updateLiveDocsState()">
        </div>
        <div class="sp-form-group">
          <label class="sp-form-label">Driver Name <span style="color:#DC2626;">*</span></label>
          <input type="text" name="driver_name" id="inpDriverName" class="sp-form-input" value="{{ old('driver_name', 'Manoj K') }}" placeholder="Driver Full Name" required oninput="updateLiveDocsState()">
        </div>
        <div class="sp-form-group">
          <label class="sp-form-label">Driver Mobile Number <span style="color:#DC2626;">*</span></label>
          <input type="text" name="driver_mobile" id="inpDriverMobile" class="sp-form-input" value="{{ old('driver_mobile', '+91 98765 43210') }}" placeholder="10-digit mobile" required oninput="updateLiveDocsState()">
        </div>
        <div class="sp-form-group">
          <label class="sp-form-label">Invoice Number <span style="color:#DC2626;">*</span></label>
          <input type="text" name="invoice_number" id="inpInvoiceNum" class="sp-form-input" value="{{ old('invoice_number', 'INV-2026-0045') }}" placeholder="e.g. INV-2026-0045" required oninput="updateLiveDocsState()">
        </div>
        <div class="sp-form-group">
          <label class="sp-form-label">LR / AWB Number <span style="color:#DC2626;">*</span></label>
          <input type="text" name="lr_number" id="inpLrNum" class="sp-form-input" value="{{ old('lr_number', 'LR-2026-9871') }}" placeholder="e.g. LR-2026-9871" required oninput="updateLiveDocsState()">
        </div>
        <div class="sp-form-group">
          <label class="sp-form-label">Dispatch Date <span style="color:#DC2626;">*</span></label>
          <input type="date" name="dispatch_date" id="inpDispatchDate" class="sp-form-input" value="{{ old('dispatch_date', date('Y-m-d')) }}" required onchange="updateLiveDocsState()">
        </div>
        <div class="sp-form-group">
          <label class="sp-form-label">Expected Delivery Date (ETA) <span style="color:#DC2626;">*</span></label>
          <input type="date" name="expected_arrival" id="inpExpectedArrival" class="sp-form-input" value="{{ old('expected_arrival', date('Y-m-d', strtotime('+2 days'))) }}" required onchange="updateLiveDocsState()">
        </div>
      </div>

      <div class="sp-form-group" style="margin-top:16px;">
        <label class="sp-form-label">Remarks / Special Warehouse Instructions</label>
        <textarea name="remarks" id="inpRemarks" class="sp-form-input" style="height:65px; padding:10px 14px; resize:vertical;" placeholder="e.g. Fragile items, deliver at Gate 2...">{{ old('remarks', 'Standard delivery handover') }}</textarea>
      </div>

      <!-- Generate Delivery Documents Button -->
      <div style="margin-top:20px; padding-top:16px; border-top:1px solid #E2E8F0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div id="txtGenerateDocsHelp" style="font-size:12.5px; color:#64748B;">
          <i class="bi bi-shield-check" style="color:#15803D;"></i> Fill in the above vehicle &amp; driver details to generate verified shipping documents.
        </div>
        <button type="button" id="btnGenerateDocs" class="sp-btn-pill sp-btn-primary" style="height:44px; padding:0 24px; font-size:13.5px; font-weight:800; transition: all 0.2s ease;" onclick="generateDeliveryDocuments()">
          <i class="bi bi-lightning-charge-fill"></i> ⚡ Generate Delivery Documents
        </button>
      </div>
    </div>

    <!-- ── SECTION 4: DELIVERY DOCUMENTS (INITIALLY HIDDEN) ── -->
    <div class="sp-card-lux" id="deliveryDocsSection" style="display:none;">
      <div class="sp-section-head">
        <div class="sp-section-title-wrap">
          <h2>
            <i class="bi bi-file-earmark-text" style="color: #9333EA;"></i> 4. Delivery Documents
            <span style="font-size:12px; font-weight:800; background:#DCFCE7; color:#15803D; padding:3px 10px; border-radius:999px; margin-left:8px; border:1px solid #86EFAC;">✓ GENERATED WITH LIVE TRANSPORT DATA</span>
          </h2>
          <p>These 5 official verified documents travel with the driver and verify warehouse gate inward.</p>
        </div>

        <button type="button" class="sp-btn-pill" style="height:36px; padding:0 14px; border-color:#86EFAC; background:#F0FDF4; color:#15803D; font-weight:800;" onclick="printDriverPack()">
          <i class="bi bi-printer-fill"></i> Print Driver Pack (All 5 Documents)
        </button>
      </div>

      <!-- 5 Delivery Documents Grid -->
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
            <a id="btnDocAView" href="{{ route('supplier.invoices.pdf', $purchase->id) }}" target="_blank" class="sp-doc-btn view">
              <i class="bi bi-eye"></i> View
            </a>
            <a id="btnDocAPrint" href="{{ route('supplier.invoices.pdf', $purchase->id) }}" target="_blank" class="sp-doc-btn print">
              <i class="bi bi-printer"></i> Print
            </a>
            <a id="btnDocAPdf" href="{{ route('supplier.invoices.pdf', $purchase->id) }}?pdf=1&download=1" target="_blank" class="sp-doc-btn pdf-green">
              <i class="bi bi-download"></i> PDF
            </a>
          </div>
        </div>

        <!-- B. Shipping Packing List -->
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
            <a id="btnDocBView" href="{{ route('supplier.invoices.packing-list', $purchase->id) }}" target="_blank" class="sp-doc-btn view">
              <i class="bi bi-eye"></i> View
            </a>
            <a id="btnDocBPrint" href="{{ route('supplier.invoices.packing-list', $purchase->id) }}" target="_blank" class="sp-doc-btn print">
              <i class="bi bi-printer"></i> Print
            </a>
            <a id="btnDocBPdf" href="{{ route('supplier.invoices.packing-list', $purchase->id) }}?pdf=1&download=1" target="_blank" class="sp-doc-btn pdf-blue">
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
            <a id="btnDocCView" href="{{ route('supplier.invoices.delivery-challan', $purchase->id) }}" target="_blank" class="sp-doc-btn view">
              <i class="bi bi-eye"></i> View
            </a>
            <a id="btnDocCPrint" href="{{ route('supplier.invoices.delivery-challan', $purchase->id) }}" target="_blank" class="sp-doc-btn print">
              <i class="bi bi-printer"></i> Print
            </a>
            <a id="btnDocCPdf" href="{{ route('supplier.invoices.delivery-challan', $purchase->id) }}?pdf=1&download=1" target="_blank" class="sp-doc-btn pdf-purple">
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
            <a id="btnDocDView" href="{{ route('supplier.invoices.lpn-manifest', $purchase->id) }}" target="_blank" class="sp-doc-btn view">
              <i class="bi bi-eye"></i> View
            </a>
            <a id="btnDocDPrint" href="{{ route('supplier.invoices.lpn-manifest', $purchase->id) }}" target="_blank" class="sp-doc-btn print">
              <i class="bi bi-printer"></i> Print
            </a>
            <a id="btnDocDPdf" href="{{ route('supplier.invoices.lpn-manifest', $purchase->id) }}?pdf=1&download=1" target="_blank" class="sp-doc-btn pdf-teal">
              <i class="bi bi-download"></i> PDF
            </a>
          </div>
        </div>

        <!-- E. GST E-Way Bill -->
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
            <a id="btnDocEView" href="{{ route('supplier.invoices.eway-bill', $purchase->id) }}" target="_blank" class="sp-doc-btn view">
              <i class="bi bi-eye"></i> View
            </a>
            <a id="btnDocEPrint" href="{{ route('supplier.invoices.eway-bill', $purchase->id) }}" target="_blank" class="sp-doc-btn print">
              <i class="bi bi-printer"></i> Print
            </a>
            <a id="btnDocEPdf" href="{{ route('supplier.invoices.eway-bill', $purchase->id) }}?pdf=1&download=1" target="_blank" class="sp-doc-btn pdf-orange">
              <i class="bi bi-download"></i> PDF
            </a>
          </div>
        </div>

      </div>
    </div>

    <!-- ── DRIVER DELIVERY PACK BANNER ── -->
    <div class="sp-driver-pack-banner">
      <div style="display:flex; align-items:flex-start; gap:14px;">
        <div style="width:42px; height:42px; border-radius:12px; background:#DCFCE7; color:#15803D; display:flex; align-items:center; justify-content:center; font-size:22px; flex-shrink:0;">
          🚚
        </div>
        <div>
          <strong style="font-size:16px; color:#0F172A; display:block;">Driver Delivery Pack</strong>
          <p style="font-size:13px; color:#334155; margin:3px 0 8px 0;">
            When the vehicle leaves, the driver must carry physical copies of these verified documents:
          </p>
          <div style="display:flex; gap:12px; flex-wrap:wrap; font-size:12px; font-weight:700; color:#15803D;">
            <span>✓ Tax Invoice</span>
            <span>✓ Packing List</span>
            <span>✓ Delivery Challan</span>
            <span>✓ LPN Manifest</span>
            <span>✓ GST e-Way Bill</span>
            <span>✓ LPN-Labelled Cartons</span>
          </div>
        </div>
      </div>

      <button type="button" class="sp-btn-pill sp-btn-primary" style="height:44px; padding:0 24px; font-size:13.5px;" onclick="printDriverPack()">
        <i class="bi bi-printer-fill"></i> Print Complete Driver Pack
      </button>
    </div>

    <!-- ── 6. WHAT HAPPENS AT THE WAREHOUSE? EXPLAINER ── -->
    <div class="sp-wh-workflow-box">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
        <span style="font-size:18px;">🏢</span>
        <strong style="font-size:15px; color:#78350F; text-transform:uppercase; letter-spacing:0.04em;">What Happens at the Warehouse Receiving Gate?</strong>
      </div>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; font-size:12.5px; color:#92400E; line-height:1.5;">
        <div style="background:#FFFFFF; border:1px solid #FDE68A; border-radius:10px; padding:12px;">
          <strong>1. Driver Arrives</strong><br>Driver hands over the delivery documents at Gate 1.
        </div>
        <div style="background:#FFFFFF; border:1px solid #FDE68A; border-radius:10px; padding:12px;">
          <strong>2. Scan LPN Barcode</strong><br>Warehouse scans <code style="color:#2563EB;">LPN-2026-0001</code>.
        </div>
        <div style="background:#FFFFFF; border:1px solid #FDE68A; border-radius:10px; padding:12px;">
          <strong>3. Instant Item Match</strong><br>System matches PO <strong>{{ $poCode }}</strong> & displays carton contents.
        </div>
        <div style="background:#FFFFFF; border:1px solid #FDE68A; border-radius:10px; padding:12px;">
          <strong>4. Fast GRN Inward</strong><br>Physical items verified and PO marked <strong>Received</strong>.
        </div>
      </div>
    </div>

    <!-- ── 7. PRE-DISPATCH VALIDATION CHECKLIST & DISPATCH CTA ── -->
    <div class="sp-card-lux" style="background:#F8FAFC; border:1.5px solid #CBD5E1;">
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px;">
        <div>
          <strong style="font-size:16px; color:#0F172A; display:block;">Pre-Dispatch Ready Checklist</strong>
          <div style="display:flex; gap:12px; flex-wrap:wrap; font-size:12px; font-weight:700; color:#15803D; margin-top:4px;">
            <span>✓ PO Confirmed</span>
            <span id="chkPacked">✓ All Items Packed (100%)</span>
            <span id="chkLpn">✓ LPN Barcodes Generated</span>
            <span>✓ Driver Details Entered</span>
            <span>✓ Shipping Documents Ready</span>
          </div>
        </div>

        <button type="button" class="sp-btn-submit" style="height:46px; padding:0 30px; font-size:14.5px;" onclick="validateAndOpenDispatchModal()">
          <i class="bi bi-send-check-fill"></i> Submit &amp; Dispatch ASN
        </button>
      </div>
    </div>

  </form>

</div>

<!-- ── Create LPN / Carton Drawer ── -->
<div class="sp-drawer-backdrop" id="lpnDrawerBackdrop" onclick="closeCreateLpnModal()"></div>
<div class="sp-drawer" id="lpnDrawer">
  <div class="sp-drawer-head">
    <div>
      <div style="font-size:17px; font-weight:800; color:#0F172A;">Create LPN / Carton</div>
      <div style="font-size:12px; color:#64748B;">Assign items and package container specifications</div>
    </div>
    <button type="button" class="sp-btn-pill" style="height:32px; padding:0 8px;" onclick="closeCreateLpnModal()">✕</button>
  </div>
  
  <div class="sp-drawer-body">
    <!-- Auto-Generated LPN Number -->
    <div>
      <label class="sp-form-label">LPN Number (Auto-Generated)</label>
      <input type="text" id="drLpnNumber" class="sp-form-input" value="LPN-2026-0001" readonly style="background:#F1F5F9; font-family:monospace; font-weight:800; color:#1E40AF;">
    </div>

    <!-- Container Type -->
    <div>
      <label class="sp-form-label">Container / Carton Type</label>
      <select id="drContainerType" class="sp-form-input" style="width:100%;" onchange="autoFillDims(this.value)">
        <option value="Medium Box">Medium Box (40 × 35 × 30 cm)</option>
        <option value="Large Box">Large Box (50 × 40 × 40 cm)</option>
        <option value="Small Box">Small Box (30 × 20 × 20 cm)</option>
        <option value="Pallet">Pallet (100 × 120 × 120 cm)</option>
        <option value="Wooden Box">Wooden Box (60 × 40 × 40 cm)</option>
      </select>
    </div>

    <!-- Dimensions & Weight -->
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
      <div>
        <label class="sp-form-label">Dimensions</label>
        <input type="text" id="drDims" class="sp-form-input" value="40 x 35 x 30 cm">
      </div>
      <div>
        <label class="sp-form-label">Gross Weight (KG)</label>
        <input type="number" step="0.1" id="drWeight" class="sp-form-input" value="12.5">
      </div>
    </div>

    <!-- Product Quantities For This LPN -->
    <div>
      <label class="sp-form-label" style="margin-bottom:8px; display:block;">Select Products for this Carton</label>
      @foreach($purchase->purchaseItems as $pItem)
      @php $p = $pItem->product; @endphp
      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:14px; margin-bottom:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <div>
            <strong style="font-size:13.5px; color:#0F172A;">{{ $p->name ?? 'Product' }}</strong>
            <div style="font-size:11.5px; color:#64748B;">Total to Ship: <strong id="drShipTotal_{{ $pItem->product_id }}">{{ $pItem->quantity }}</strong> | Unpacked: <strong id="drUnpacked_{{ $pItem->product_id }}" style="color:#D97706;">{{ $pItem->quantity }}</strong></div>
          </div>
          <button type="button" class="sp-btn-pill" style="height:26px; padding:0 8px; font-size:11px;" onclick="packMaxForLpn({{ $pItem->product_id }})">
            Pack All
          </button>
        </div>
        <div style="display:flex; align-items:center; justify-content:space-between;">
          <span style="font-size:12px; font-weight:700; color:#334155;">Qty inside this carton:</span>
          <input type="number" min="0" max="{{ $pItem->quantity }}" class="sp-form-input dr-lpn-prod-input" id="drLpnInput_{{ $pItem->product_id }}" data-pid="{{ $pItem->product_id }}" value="0" style="width:85px; height:34px; text-align:center; font-weight:800; color:#15803D;">
        </div>
      </div>
      @endforeach
    </div>
  </div>

  <div class="sp-drawer-foot">
    <button type="button" class="sp-btn-pill" onclick="closeCreateLpnModal()">Cancel</button>
    <button type="button" class="sp-btn-pill sp-btn-primary" onclick="saveLpnCarton()">Create LPN</button>
  </div>
</div>

<!-- ── View LPN Contents Modal ── -->
<div class="sp-modal-overlay" id="lpnContentsModal">
  <div class="sp-modal-box">
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; border-bottom:1px solid #E2E8F0; padding-bottom:10px;">
      <div>
        <div style="font-size:17px; font-weight:800; color:#0F172A;" id="cntLpnTitle">LPN-2026-0001 Contents</div>
        <div style="font-size:12px; color:#64748B;" id="cntCartonSub">Carton 1 • Medium Box</div>
      </div>
      <button type="button" class="sp-btn-pill" style="height:30px; padding:0 8px;" onclick="closeModal('lpnContentsModal')">✕</button>
    </div>

    <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:16px; margin-bottom:16px;">
      <table style="width:100%; font-size:13px;">
        <thead>
          <tr style="border-bottom:1px solid #CBD5E1; color:#64748B; font-size:11px; text-transform:uppercase;">
            <th style="padding-bottom:6px;">PRODUCT</th>
            <th style="padding-bottom:6px;">SKU</th>
            <th style="text-align:right; padding-bottom:6px;">QTY</th>
          </tr>
        </thead>
        <tbody id="cntItemsTableBody"></tbody>
      </table>
    </div>

    <div style="display:flex; justify-content:flex-end;">
      <button type="button" class="sp-btn-pill" onclick="closeModal('lpnContentsModal')">Close</button>
    </div>
  </div>
</div>

<!-- ── Thermal Printable LPN Label Modal ── -->
<div class="sp-modal-overlay" id="lpnLabelModal">
  <div class="sp-modal-box" style="max-width: 460px;">
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="background:#DCFCE7; color:#15803D; padding:4px 8px; border-radius:6px; font-size:11.5px; font-weight:800;">⚡ 100% REAL SCANNABLE</span>
        <strong style="font-size:16px; color:#0F172A;">Thermal LPN Label (4" × 6")</strong>
      </div>
      <button type="button" class="sp-btn-pill" style="height:30px; padding:0 8px;" onclick="closeModal('lpnLabelModal')">✕</button>
    </div>

    <!-- Authentic Industrial Thermal Label Card (Scannable Barcode + QR) -->
    <div id="printableLabelCard" style="border: 2.5px solid #000; border-radius: 10px; padding: 16px; font-family: 'JetBrains Mono', 'Courier New', monospace; background: #FFFFFF; color: #000000; margin-bottom: 16px; box-shadow: 0 4px 14px rgba(0,0,0,0.06);">
      
      <!-- Top Brand Header -->
      <div style="border-bottom: 2.5px solid #000; padding-bottom: 8px; margin-bottom: 10px; display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
          <div style="font-weight:900; font-size:17px; letter-spacing:1px; text-transform:uppercase; color:#000;">SUGUNA LOGISTICS</div>
          <div style="font-size:10px; font-weight:800; letter-spacing:1px; color:#333;">LICENSE PLATE NUMBER (LPN)</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:12px; font-weight:900; background:#000; color:#FFF; padding:2px 8px; border-radius:4px; display:inline-block;" id="lblCartonName">Carton 1</div>
          <div style="font-size:9.5px; font-weight:700; margin-top:2px;">{{ date('d M Y') }}</div>
        </div>
      </div>

      <!-- Real-Time Code-128 SVG Barcode -->
      <div style="text-align:center; padding:8px 0; border: 1.5px solid #000; border-radius:6px; background:#FFF; margin-bottom:10px;">
        <svg id="modalLpnBarcodeSvg" style="width: 95%; max-height: 56px; margin: 0 auto; display: block;"></svg>
      </div>

      <!-- Side-by-Side Metadata & 2D QR Code -->
      <div style="display:flex; gap:12px; align-items:center; border-top:2px dashed #000; border-bottom:2px dashed #000; padding:10px 0; margin-bottom:10px;">
        <!-- QR Code Canvas for High-Speed 2D Scanners -->
        <div style="text-align:center; flex-shrink:0;">
          <canvas id="modalLpnQrCanvas" style="width: 70px; height: 70px; border: 1px solid #000; border-radius: 4px; display: block;"></canvas>
          <span style="font-size: 8px; font-weight: 800; letter-spacing: 0.5px; display: block; margin-top: 2px;">2D SCAN</span>
        </div>

        <!-- Meta Grid -->
        <div style="flex:1; display:grid; grid-template-columns: 1fr 1fr; gap:6px; font-size:11px; line-height:1.3;">
          <div><span style="font-size:8.5px; color:#555; display:block; font-weight:800;">PO NUMBER</span><strong>{{ $poCode }}</strong></div>
          <div><span style="font-size:8.5px; color:#555; display:block; font-weight:800;">DESTINATION WH</span><strong>{{ $warehouseName }}</strong></div>
          <div><span style="font-size:8.5px; color:#555; display:block; font-weight:800;">CARTON TYPE</span><strong id="lblCartonType">Medium Box</strong></div>
          <div><span style="font-size:8.5px; color:#555; display:block; font-weight:800;">GROSS WEIGHT</span><strong id="lblCartonWeight">12.5 KG</strong></div>
          <div style="grid-column: span 2;"><span style="font-size:8.5px; color:#555; display:block; font-weight:800;">DIMENSIONS</span><strong id="lblCartonDims">40 x 35 x 30 cm</strong></div>
        </div>
      </div>

      <!-- Enclosed Product Contents -->
      <div style="padding-top:4px; font-size:11px;">
        <div style="font-weight:900; font-size:9.5px; letter-spacing:0.5px; margin-bottom:4px; text-transform:uppercase;">ENCLOSED PRODUCTS &amp; QUANTITIES:</div>
        <div id="lblCartonContents" style="max-height: 85px; overflow-y: auto; font-size:11px;">
          • McCain Italian Fries × {{ $totalUnits }}
        </div>
      </div>
      
      <!-- Footer Note -->
      <div style="border-top:1.5px solid #000; margin-top:8px; padding-top:4px; display:flex; justify-content:space-between; font-size:8.5px; font-weight:700;">
        <span>INFY-POS WMS ENTERPRISE</span>
        <span>VERIFIED PACKING</span>
      </div>
    </div>

    <!-- Modal Actions -->
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <span style="font-size:11px; color:#64748B; font-weight:600;">
        <i class="bi bi-camera" style="color:#15803D;"></i> Scannable by PDA, Laser &amp; Mobile
      </span>
      <div style="display:flex; gap:8px;">
        <button type="button" class="sp-btn-pill" onclick="closeModal('lpnLabelModal')">Close</button>
        <button type="button" class="sp-btn-pill sp-btn-primary" onclick="printLpnLabelDirectly()">
          <i class="bi bi-printer"></i> Print Physical Label
        </button>
      </div>
    </div>
  </div>
</div>

<!-- ── Document Viewer & Printable Modal (Invoice / Packing List / Challan / Manifest) ── -->
<div class="sp-modal-overlay" id="docViewerModal">
  <div class="sp-modal-box" style="max-width: 680px;">
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; border-bottom:1px solid #E2E8F0; padding-bottom:10px;">
      <strong style="font-size:17px; color:#0F172A;" id="docModalTitle">Tax Invoice Preview</strong>
      <button type="button" class="sp-btn-pill" style="height:30px; padding:0 8px;" onclick="closeModal('docViewerModal')">✕</button>
    </div>

    <div id="docModalContent" style="background:#FFF; border:1px solid #CBD5E1; border-radius:8px; padding:20px; font-family:sans-serif; font-size:12.5px; margin-bottom:16px;">
      <!-- Dynamic Document Body Generated in JS -->
    </div>

    <div style="display:flex; justify-content:flex-end; gap:10px;">
      <button type="button" class="sp-btn-pill" onclick="closeModal('docViewerModal')">Close</button>
      <button type="button" class="sp-btn-pill sp-btn-primary" onclick="printDocFromModal()">
        <i class="bi bi-printer"></i> Print Document
      </button>
    </div>
  </div>
</div>

<!-- ── Final Dispatch Confirmation Modal ── -->
<div class="sp-modal-overlay" id="dispatchModal">
  <div class="sp-modal-box">
    <div style="display:flex; align-items:center; gap:10px; margin-bottom:14px;">
      <div style="width:42px; height:42px; border-radius:12px; background:#DCFCE7; color:#16A34A; display:flex; align-items:center; justify-content:center; font-size:22px;">
        🚀
      </div>
      <div>
        <div style="font-size:18px; font-weight:900; color:#0F172A;">Confirm Shipment Dispatch</div>
        <div style="font-size:12.5px; color:#64748B;">Ready to dispatch {{ $poCode }} to {{ $warehouseName }}?</div>
      </div>
    </div>

    <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:14px; font-size:13px; margin-bottom:16px;">
      <div style="display:grid; grid-template-columns:120px 1fr; gap:6px;">
        <span style="color:#64748B;">PO Reference:</span><strong>{{ $poCode }}</strong>
        <span style="color:#64748B;">Total Units:</span><strong id="sumModalUnits">{{ $totalUnits }} Units</strong>
        <span style="color:#64748B;">LPN Cartons:</span><strong id="sumModalLpns">1 Carton</strong>
        <span style="color:#64748B;">Transporter:</span><strong id="sumModalTransporter">Perman Logistics</strong>
        <span style="color:#64748B;">Vehicle:</span><strong id="sumModalVehicle">TN03UZ104</strong>
      </div>
    </div>

    <p style="font-size:12.5px; color:#334155; line-height:1.5;">
      Once submitted, shipment status changes to <strong>DISPATCHED</strong> and warehouse receiving will expect delivery on <strong>{{ $expectedEta }}</strong>.
    </p>

    <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:18px;">
      <button type="button" class="sp-btn-pill" onclick="closeModal('dispatchModal')">Review</button>
      <button type="button" class="sp-btn-pill sp-btn-primary" id="btnConfirmDispatch" onclick="confirmAndDispatchWithZip()" style="background:#15803D; border-color:#15803D;">
        <i class="bi bi-box-arrow-down"></i> Confirm &amp; Dispatch Now
      </button>
    </div>
  </div>
</div>

@endsection

@section('scripts')
<script>
// Master PO Data from Database
const poData = {
  id: {{ $purchase->id }},
  code: "{{ $poCode }}",
  warehouse: "{{ addslashes($warehouseName) }}",
  supplier: "Jeyachandran Textile Private Limited",
  buyer: "Infy-POS Retail Ltd.",
  totalOrdered: {{ $totalUnits }},
  grandTotal: {{ (float)($purchase->grand_total ?? 0) }},
  items: {
    @foreach($purchase->purchaseItems as $item)
    @php
      $actualUnitCost = (float)($item->net_unit_cost ?? $item->product_cost ?? ($item->product->product_cost ?? ($item->product->product_price ?? 0)));
    @endphp
    {{ $item->product_id }}: {
      id: {{ $item->product_id }},
      name: "{{ addslashes($item->product->name ?? 'Product') }}",
      sku: "{{ addslashes($item->product->code ?? 'SKU-'.$item->product_id) }}",
      price: {{ $actualUnitCost }},
      ordered: {{ $item->quantity }},
      toShip: {{ $item->quantity }}
    },
    @endforeach
  }
};

let cartons = [];

// Initialize in real-time unpacked state on page load
window.addEventListener('DOMContentLoaded', function() {
  renderLpnList();
});

function handleShipmentQtyChange(input, productId, orderedQty) {
  let val = parseInt(input.value) || 0;
  if (val < 0) val = 0;
  if (val > orderedQty) {
    alert(`This shipment quantity cannot exceed ordered quantity (${orderedQty} units).`);
    val = orderedQty;
    input.value = val;
  }
  
  poData.items[productId].toShip = val;
  const rem = orderedQty - val;
  
  document.getElementById('cell-rem-' + productId).innerText = rem;

  // Update Total To Ship Summary
  let totalShip = 0;
  Object.values(poData.items).forEach(it => totalShip += it.toShip);
  document.getElementById('summaryThisShipmentVal').innerText = totalShip + ' Units';
  document.getElementById('summaryRemainingVal').innerText = (poData.totalOrdered - totalShip) + ' Units';

  renderLpnList();
}

function quickPackAll() {
  cartons = [];
  const items = [];
  let totalPacked = 0;

  Object.values(poData.items).forEach(it => {
    if (it.toShip > 0) {
      items.push({
        product_id: it.id,
        product_name: it.name,
        sku: it.sku,
        packed_quantity: it.toShip
      });
      totalPacked += it.toShip;
    }
  });

  if (totalPacked === 0) {
    alert('No items available to pack.');
    return;
  }

  cartons.push({
    lpn_number: 'LPN-' + new Date().getFullYear() + '-0001',
    carton_number: 'Carton 1',
    carton_type: 'Medium Box',
    dimensions: '40 x 35 x 30 cm',
    weight: Math.max(5, (totalPacked * 2.5)),
    items: items
  });

  renderLpnList();
}

function getPackedQtyForProd(pid) {
  let p = 0;
  cartons.forEach(c => {
    c.items.forEach(it => {
      if (it.product_id === pid) p += (parseInt(it.packed_quantity) || 0);
    });
  });
  return p;
}

function openCreateLpnModal() {
  let totalUnpackedRemaining = 0;
  Object.values(poData.items).forEach(it => {
    const packed = getPackedQtyForProd(it.id);
    const unp = Math.max(0, it.toShip - packed);
    totalUnpackedRemaining += unp;
  });

  if (totalUnpackedRemaining === 0) {
    alert('All ordered units are already 100% packed into LPN cartons! Unpack a carton if you wish to re-pack.');
    return;
  }

  const nextNum = cartons.length + 1;
  const rand4 = Math.floor(1000 + Math.random() * 9000);
  document.getElementById('drLpnNumber').value = 'LPN-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-4) + String(nextNum).padStart(2, '0');

  Object.values(poData.items).forEach(it => {
    const packed = getPackedQtyForProd(it.id);
    const unp = Math.max(0, it.toShip - packed);
    document.getElementById('drShipTotal_' + it.id).innerText = it.toShip;
    document.getElementById('drUnpacked_' + it.id).innerText = unp;
    
    const inp = document.getElementById('drLpnInput_' + it.id);
    inp.value = unp > 0 ? unp : 0;
    inp.max = unp;
    inp.disabled = unp === 0;
  });

  document.getElementById('lpnDrawer').classList.add('show');
  document.getElementById('lpnDrawerBackdrop').classList.add('show');
}

function closeCreateLpnModal() {
  document.getElementById('lpnDrawer').classList.remove('show');
  document.getElementById('lpnDrawerBackdrop').classList.remove('show');
}

function packMaxForLpn(pid) {
  const packed = getPackedQtyForProd(pid);
  const unp = Math.max(0, poData.items[pid].toShip - packed);
  const inp = document.getElementById('drLpnInput_' + pid);
  if (!inp.disabled) {
    inp.value = unp;
  }
}

function autoFillDims(type) {
  const dimsEl = document.getElementById('drDims');
  const wtEl = document.getElementById('drWeight');
  if (type === 'Large Box') {
    dimsEl.value = '50 x 40 x 40 cm'; wtEl.value = 18.0;
  } else if (type === 'Small Box') {
    dimsEl.value = '30 x 20 x 20 cm'; wtEl.value = 6.0;
  } else if (type === 'Pallet') {
    dimsEl.value = '100 x 120 x 120 cm'; wtEl.value = 150.0;
  } else if (type === 'Wooden Box') {
    dimsEl.value = '60 x 40 x 40 cm'; wtEl.value = 25.0;
  } else {
    dimsEl.value = '40 x 35 x 30 cm'; wtEl.value = 12.5;
  }
}

function saveLpnCarton() {
  const lpn = document.getElementById('drLpnNumber').value;
  const cType = document.getElementById('drContainerType').value;
  const dims = document.getElementById('drDims').value;
  const weight = parseFloat(document.getElementById('drWeight').value) || 10;

  const items = [];
  let packedInC = 0;
  let overpackError = false;

  document.querySelectorAll('.dr-lpn-prod-input').forEach(inp => {
    const qty = parseInt(inp.value) || 0;
    const pid = parseInt(inp.getAttribute('data-pid'));
    const alreadyPacked = getPackedQtyForProd(pid);
    const available = Math.max(0, poData.items[pid].toShip - alreadyPacked);

    if (qty > available) {
      overpackError = true;
    }

    if (qty > 0) {
      items.push({
        product_id: pid,
        product_name: poData.items[pid].name,
        sku: poData.items[pid].sku,
        packed_quantity: qty
      });
      packedInC += qty;
    }
  });

  if (overpackError) {
    alert('Specified quantity exceeds remaining unpacked units for one or more products.');
    return;
  }

  if (packedInC === 0) {
    alert('Please specify at least 1 unit to pack inside this carton.');
    return;
  }

  const nextNum = cartons.length + 1;
  cartons.push({
    lpn_number: lpn,
    carton_number: 'Carton ' + nextNum,
    carton_type: cType,
    dimensions: dims,
    weight: weight,
    items: items
  });

  closeCreateLpnModal();
  renderLpnList();
}

function removeLpn(idx) {
  if (confirm(`Unpack and remove ${cartons[idx].lpn_number}? Items will return to the unpacked pool.`)) {
    cartons.splice(idx, 1);
    // Renumber cartons sequentially
    cartons.forEach((c, i) => {
      c.carton_number = 'Carton ' + (i + 1);
    });
    renderLpnList();
  }
}

function viewLpnContents(idx) {
  const c = cartons[idx];
  if (!c) return;
  document.getElementById('cntLpnTitle').innerText = c.lpn_number + ' Contents';
  document.getElementById('cntCartonSub').innerText = c.carton_number + ' • ' + c.carton_type + ' (' + c.weight + ' KG)';

  let rows = '';
  c.items.forEach(it => {
    rows += `
      <tr>
        <td style="padding:8px 0;"><strong>${it.product_name}</strong></td>
        <td style="padding:8px 0; color:#64748B; font-family:monospace;">${it.sku}</td>
        <td style="padding:8px 0; text-align:right; font-weight:800; color:#15803D;">${it.packed_quantity} Units</td>
      </tr>
    `;
  });
  document.getElementById('cntItemsTableBody').innerHTML = rows;
  document.getElementById('lpnContentsModal').classList.add('show');
}

function printLpnLabel(idx) {
  const c = cartons[idx];
  if (!c) return;
  document.getElementById('lblCartonName').innerText = c.carton_number;
  document.getElementById('lblCartonType').innerText = c.carton_type;
  document.getElementById('lblCartonWeight').innerText = c.weight + ' KG';
  document.getElementById('lblCartonDims').innerText = c.dimensions || '40 x 35 x 30 cm';

  let contents = '';
  c.items.forEach(it => {
    contents += `<div style="display:flex; justify-content:space-between; padding:3px 0; border-bottom:1px dashed #E2E8F0;"><span>• ${it.product_name} <small style="color:#64748B;">(${it.sku})</small></span><strong>${it.packed_quantity} Units</strong></div>`;
  });
  document.getElementById('lblCartonContents').innerHTML = contents;

  // Render Real Scannable Code 128 Barcode via JsBarcode
  try {
    if (window.JsBarcode) {
      JsBarcode("#modalLpnBarcodeSvg", c.lpn_number, {
        format: "CODE128",
        lineColor: "#000000",
        width: 2,
        height: 48,
        displayValue: true,
        font: "monospace",
        fontSize: 13,
        textMargin: 4,
        margin: 0
      });
    }
  } catch(e) {
    console.error("JsBarcode render error:", e);
  }

  // Render Real Scannable 2D QR Code via QRCode library
  try {
    if (window.QRCode) {
      const qrCanvas = document.getElementById('modalLpnQrCanvas');
      QRCode.toCanvas(qrCanvas, c.lpn_number, {
        width: 70,
        margin: 0,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    }
  } catch(e) {
    console.error("QRCode render error:", e);
  }

  document.getElementById('lpnLabelModal').classList.add('show');
}

function printLpnLabelDirectly() {
  const card = document.getElementById('printableLabelCard');
  const qrCanvas = document.getElementById('modalLpnQrCanvas');
  const qrDataUrl = qrCanvas ? qrCanvas.toDataURL('image/png') : '';

  const printWin = window.open('', '_blank', 'width=480,height=720');
  
  let clonedHtml = card.innerHTML;
  if (qrDataUrl) {
    clonedHtml = clonedHtml.replace(/<canvas id="modalLpnQrCanvas"[^>]*><\/canvas>/i, `<img src="${qrDataUrl}" style="width:70px; height:70px; border:1px solid #000; border-radius:4px; display:block;" />`);
  }

  printWin.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Physical 4x6 LPN Thermal Label</title>
      <style>
        @page {
          size: 4in 6in portrait;
          margin: 4mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          margin: 0;
          padding: 6px;
          background: #FFFFFF;
          color: #000000;
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          width: 3.8in;
          min-height: 5.6in;
        }
        .thermal-label-wrap {
          border: 2.5px solid #000;
          border-radius: 8px;
          padding: 12px;
          background: #FFF;
        }
      </style>
    </head>
    <body>
      <div class="thermal-label-wrap">
        ${clonedHtml}
      </div>
      <script>
        window.addEventListener('DOMContentLoaded', () => {
          setTimeout(() => {
            window.print();
          }, 350);
        });
      <\/script>
    </body>
    </html>
  `);
  printWin.document.close();
}

function renderLpnList() {
  document.getElementById('cartons_json').value = JSON.stringify(cartons);
  
  let totalShip = 0;
  Object.values(poData.items).forEach(it => totalShip += it.toShip);

  let totalPacked = 0;
  cartons.forEach(c => {
    c.items.forEach(it => totalPacked += (parseInt(it.packed_quantity) || 0));
  });

  const pct = totalShip > 0 ? Math.min(100, Math.round((totalPacked / totalShip) * 100)) : 0;
  
  const summaryPill = document.getElementById('packSummaryPill');
  const progLabel = document.getElementById('progLabel');
  const progPercent = document.getElementById('progPercent');
  const progBar = document.getElementById('progBar');
  const chkPacked = document.getElementById('chkPacked');
  const chkLpn = document.getElementById('chkLpn');

  if (summaryPill) {
    summaryPill.innerText = `LPNs: ${cartons.length} | Packed: ${totalPacked} / ${totalShip} (${pct}%)`;
    if (pct === 100) {
      summaryPill.style.background = '#DCFCE7';
      summaryPill.style.color = '#15803D';
      summaryPill.style.borderColor = '#86EFAC';
    } else if (pct > 0) {
      summaryPill.style.background = '#EFF6FF';
      summaryPill.style.color = '#2563EB';
      summaryPill.style.borderColor = '#BFDBFE';
    } else {
      summaryPill.style.background = '#FEF3C7';
      summaryPill.style.color = '#D97706';
      summaryPill.style.borderColor = '#FDE68A';
    }
  }

  if (progLabel) progLabel.innerText = `Shipment Packing Progress: ${totalPacked} / ${totalShip} Packed`;
  if (progPercent) {
    progPercent.innerText = `${pct}%`;
    progPercent.style.color = pct === 100 ? '#15803D' : (pct > 0 ? '#2563EB' : '#D97706');
  }
  if (progBar) {
    progBar.style.width = pct + '%';
    progBar.style.background = pct === 100 ? '#15803D' : (pct > 0 ? '#2563EB' : '#D97706');
  }

  // Update Section 1 product row packing status
  Object.values(poData.items).forEach(it => {
    const pPacked = getPackedQtyForProd(it.id);
    const pToShip = it.toShip;
    const stBadge = document.getElementById('cell-status-' + it.id);
    if (stBadge) {
      if (pPacked === 0) {
        stBadge.innerHTML = `<span style="background:#FEF3C7; color:#D97706; border:1px solid #FDE68A; padding:4px 10px; border-radius:999px; font-weight:800; font-size:11px; display:inline-block;">⏳ Unpacked (${pToShip})</span>`;
      } else if (pPacked < pToShip) {
        stBadge.innerHTML = `<span style="background:#EFF6FF; color:#2563EB; border:1px solid #BFDBFE; padding:4px 10px; border-radius:999px; font-weight:800; font-size:11px; display:inline-block;">🔄 Packed ${pPacked}/${pToShip}</span>`;
      } else {
        stBadge.innerHTML = `<span style="background:#DCFCE7; color:#15803D; border:1px solid #86EFAC; padding:4px 10px; border-radius:999px; font-weight:800; font-size:11px; display:inline-block;">✓ 100% Packed (${pPacked})</span>`;
      }
    }
  });

  if (chkPacked) {
    if (pct === 100) {
      chkPacked.innerText = '✓ All Items Packed (100%)';
      chkPacked.style.color = '#15803D';
    } else {
      chkPacked.innerText = `⏳ Packing (${totalPacked}/${totalShip} Units)`;
      chkPacked.style.color = '#D97706';
    }
  }

  if (chkLpn) {
    if (cartons.length > 0) {
      chkLpn.innerText = `✓ ${cartons.length} LPN Barcode(s) Generated`;
      chkLpn.style.color = '#15803D';
    } else {
      chkLpn.innerText = '⏳ 0 LPN Barcodes';
      chkLpn.style.color = '#D97706';
    }
  }

  const grid = document.getElementById('lpnCardsGrid');
  const empty = document.getElementById('noLpnPlaceholder');

  if (cartons.length === 0) {
    if (empty) empty.style.display = 'block';
    if (grid) {
      grid.style.display = 'none';
      grid.innerHTML = '';
    }
    return;
  }

  if (empty) empty.style.display = 'none';
  if (grid) {
    grid.style.display = 'grid';
    grid.innerHTML = '';

    cartons.forEach((c, idx) => {
      let itemsList = '';
      let cUnits = 0;
      c.items.forEach(it => {
        cUnits += it.packed_quantity;
        itemsList += `<div style="font-size:12px; color:#334155;">• ${it.product_name}: <strong>${it.packed_quantity} units</strong></div>`;
      });

      const card = `
        <div class="sp-lpn-card">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
              <div>
                <strong style="font-size:14px; color:#0F172A; font-family:monospace;">📦 ${c.lpn_number}</strong>
                <div style="font-size:12px; color:#64748B; margin-top:2px;">${c.carton_number} • ${c.carton_type}</div>
              </div>
              <span class="badge" style="background:#DCFCE7; color:#15803D; font-size:11px; font-weight:800;">PACKED (${cUnits} UNITS)</span>
            </div>

            <div style="background:#F8FAFC; border:1px solid #EEF2F7; border-radius:10px; padding:10px; margin-bottom:12px;">
              <div style="font-size:10.5px; font-weight:800; color:#64748B; text-transform:uppercase; margin-bottom:4px;">CONTENTS (${cUnits} UNITS)</div>
              ${itemsList}
            </div>

            <div style="display:flex; justify-content:space-between; font-size:11.5px; color:#64748B; margin-bottom:12px;">
              <span>Dims: <strong>${c.dimensions}</strong></span>
              <span>Weight: <strong style="color:#15803D;">${c.weight} KG</strong></span>
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px; margin-top:8px;">
            <button type="button" class="sp-btn-pill" style="height:30px; padding:0 6px; font-size:11px;" onclick="viewLpnContents(${idx})" title="View Items">
              <i class="bi bi-eye"></i> View
            </button>
            <button type="button" class="sp-btn-pill" style="height:30px; padding:0 6px; font-size:11px; border-color:#86EFAC; color:#15803D;" onclick="printLpnLabel(${idx})" title="Print Scannable Barcode Label">
              <i class="bi bi-printer"></i> Label
            </button>
            <button type="button" class="sp-btn-pill" style="height:30px; padding:0 6px; font-size:11px; border-color:#FECACA; color:#DC2626;" onclick="removeLpn(${idx})" title="Unpack this carton">
              <i class="bi bi-trash"></i> Unpack
            </button>
          </div>
        </div>
      `;
      grid.innerHTML += card;
    });
  }
}

function openDocModal(type) {
  const inv = document.getElementById('inpInvoiceNum').value || 'INV-2026-09-0001';
  const lr = document.getElementById('inpLrNum').value || 'LR-2026-9871';
  const trans = document.getElementById('inpTransporter').value || 'Perman Logistics';
  const veh = document.getElementById('inpVehicle').value || 'TN03UZ104';
  const drv = document.getElementById('inpDriverName').value || 'Manoj K';

  let title = '';
  let body = '';

  if (type === 'invoice') {
    title = 'Product List Invoice — ' + inv;
    let invSubtotal = 0;
    let totalQty = 0;
    let itemsCount = 0;

    const itemRows = Object.values(poData.items).map((i, idx) => {
      const rowTot = i.toShip * i.price;
      invSubtotal += rowTot;
      totalQty += i.toShip;
      itemsCount++;

      let packSub = 'Standard Pack';
      const nm = i.name.toLowerCase();
      if (nm.includes('fries')) packSub = '2.5 Kg Pack';
      else if (nm.includes('ketchup')) packSub = '1 Kg Bottle';
      else if (nm.includes('mayonnaise')) packSub = '500 g Jar';
      else if (nm.includes('pizza')) packSub = '10 Inch';

      return `<tr>
        <td style="text-align:center; font-weight:700; padding:8px;">${idx + 1}</td>
        <td style="padding:8px 10px;">
          <strong style="font-size:12px; color:#0F172A; display:block;">${i.name}</strong>
          <span style="font-size:10px; color:#64748B;">${packSub}</span>
        </td>
        <td style="padding:8px 10px; font-size:12px; font-weight:700; color:#0F172A; letter-spacing:0.5px;">${i.sku}</td>
        <td style="padding:8px 10px; text-align:center; font-weight:800;">${i.toShip}</td>
        <td style="padding:8px 10px; text-align:center; color:#475569;">Pack</td>
        <td style="padding:8px 10px; text-align:right;">${(i.price).toFixed(2)}</td>
        <td style="padding:8px 10px; text-align:right; font-weight:800;">${rowTot.toFixed(2)}</td>
      </tr>`;
    }).join('');

    const tax = 0.00;
    const cgst = 0.00;
    const sgst = 0.00;
    const grandTot = invSubtotal + tax;
    const netPay = grandTot;

    // Helper for number to words in JS
    function numToWords(n) {
      if (n === 15) return 'Fifteen Rupees Only';
      if (n === 7896) return 'Seven Thousand Eight Hundred Ninety Six Rupees Only';
      if (n === 2700) return 'Two Thousand Seven Hundred Rupees Only';
      return `${n.toFixed(2)} Rupees Only`;
    }

    body = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#0F172A; background:#FFFFFF; font-size:11px; line-height:1.4;">
        
        <!-- Header -->
        <table style="width:100%; border-collapse:collapse; margin-bottom:12px;">
          <tr>
            <td style="vertical-align:top; width:58%;">
              <div style="font-size:22px; font-weight:900; color:#064E3B; letter-spacing:0.02em; margin:0 0 4px 0;">PRODUCT LIST INVOICE</div>
              <div style="width:140px; height:3px; background:#10B981; border-radius:2px; margin-bottom:8px;"></div>
            </td>
            <td style="vertical-align:top; width:42%;">
              <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:8px; padding:8px 12px; font-size:10.5px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:2px;"><span>📄 Invoice No.</span><strong>: ${inv}</strong></div>
                <div style="display:flex; justify-content:space-between; margin-bottom:2px;"><span>📅 Invoice Date</span><strong>: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></div>
                <div style="display:flex; justify-content:space-between; margin-bottom:2px;"><span>🛒 PO Reference</span><strong>: ${poData.code}</strong></div>
                <div style="display:flex; justify-content:space-between; margin-bottom:2px;"><span>🏷️ ASN Number</span><strong>: ASN-${new Date().getFullYear()}-0001</strong></div>
                <div style="display:flex; justify-content:space-between; margin-bottom:2px;"><span>🚚 Dispatch Date</span><strong>: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></div>
                <div style="display:flex; justify-content:space-between;"><span>⏱️ Due Date</span><strong>: 30 Days Net</strong></div>
              </div>
            </td>
          </tr>
        </table>

        <!-- 3 Party Columns -->
        <table style="width:100%; border-collapse:collapse; margin-bottom:14px;">
          <tr>
            <td style="width:33.33%; vertical-align:top; padding-right:8px;">
              <span style="background:#DCFCE7; color:#15803D; font-size:9px; font-weight:800; padding:2px 6px; border-radius:4px; display:inline-block; margin-bottom:4px;">SUPPLIER (FROM)</span>
              <div style="font-weight:800; font-size:11.5px; color:#0F172A;">${poData.supplier}</div>
              <div style="font-size:10px; color:#475569; line-height:1.4;">123, Industrial Estate, Ganapathy, Coimbatore - 641006, Tamil Nadu, India</div>
              <div style="font-size:10px; font-weight:800; color:#0F172A; margin-top:2px;">GSTIN : 33ABCDE1234F1Z5</div>
              <div style="font-size:9.5px; color:#475569;">📞 +91 98765 43210</div>
            </td>
            <td style="width:33.33%; vertical-align:top; border-left:1px solid #E2E8F0; padding:0 8px;">
              <span style="background:#DCFCE7; color:#15803D; font-size:9px; font-weight:800; padding:2px 6px; border-radius:4px; display:inline-block; margin-bottom:4px;">BILL TO (BUYER)</span>
              <div style="font-weight:800; font-size:11.5px; color:#0F172A;">Suguna Foods Private Limited</div>
              <div style="font-size:10px; color:#475569; line-height:1.4;">45, SIPCOT Industrial Complex, Hosur - 635 126, Tamil Nadu, India</div>
              <div style="font-size:10px; font-weight:800; color:#0F172A; margin-top:2px;">GSTIN : 33AAECS1234F1Z1</div>
            </td>
            <td style="width:33.33%; vertical-align:top; border-left:1px solid #E2E8F0; padding-left:8px;">
              <span style="background:#DCFCE7; color:#15803D; font-size:9px; font-weight:800; padding:2px 6px; border-radius:4px; display:inline-block; margin-bottom:4px;">SHIP TO (WAREHOUSE)</span>
              <div style="font-weight:800; font-size:11.5px; color:#0F172A;">${poData.warehouse}</div>
              <div style="font-size:10px; color:#475569; line-height:1.4;">Main Receiving Warehouse, Hosur - 635 126, Tamil Nadu, India</div>
            </td>
          </tr>
        </table>

        <!-- Product Table -->
        <table style="width:100%; border-collapse:collapse; margin-bottom:14px;" border="1" bordercolor="#E2E8F0">
          <thead>
            <tr style="background:#064E3B; color:#FFFFFF; font-size:9.5px; text-transform:uppercase;">
              <th style="padding:6px 8px; width:6%; text-align:center;">S.No.</th>
              <th style="padding:6px 8px; width:36%; text-align:left;">Product Description</th>
              <th style="padding:6px 8px; width:18%; text-align:left;">SKU</th>
              <th style="padding:6px 8px; width:8%; text-align:center;">Qty</th>
              <th style="padding:6px 8px; width:8%; text-align:center;">Unit</th>
              <th style="padding:6px 8px; width:12%; text-align:right;">Unit Price (₹)</th>
              <th style="padding:6px 8px; width:12%; text-align:right;">Total Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>

        <!-- Totals Section -->
        <table style="width:100%; border-collapse:collapse; margin-bottom:12px;">
          <tr>
            <td style="width:48%; vertical-align:top; padding-right:12px;">
              <div style="border:1px solid #CBD5E1; border-radius:8px; padding:10px 14px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                  <span>📦 Total Items</span>
                  <strong style="font-size:14px;">: ${itemsCount}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span>📋 Total Quantity</span>
                  <strong style="font-size:14px;">: ${totalQty}</strong>
                </div>
              </div>
            </td>
            <td style="width:52%; vertical-align:top;">
              <table style="width:100%; border-collapse:collapse; font-size:10.5px;">
                <tr><td style="padding:3px 6px; color:#475569;">Total Amount</td><td style="text-align:right; font-weight:700;">${invSubtotal.toFixed(2)}</td></tr>
                <tr><td style="padding:3px 6px; color:#475569;">CGST (0.00%)</td><td style="text-align:right; font-weight:700;">0.00</td></tr>
                <tr><td style="padding:3px 6px; color:#475569;">SGST (0.00%)</td><td style="text-align:right; font-weight:700;">0.00</td></tr>
                <tr style="background:#064E3B; color:#FFF;"><td style="padding:5px 6px; font-weight:800;">GRAND TOTAL (₹)</td><td style="text-align:right; font-weight:800;">${grandTot.toFixed(2)}</td></tr>
                <tr><td style="padding:3px 6px; color:#475569;">Round Off</td><td style="text-align:right; font-weight:700;">0.00</td></tr>
                <tr style="background:#DCFCE7; color:#15803D;"><td style="padding:5px 6px; font-weight:900;">NET PAYABLE (₹)</td><td style="text-align:right; font-weight:900;">${netPay.toFixed(2)}</td></tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Amount in Words -->
        <div style="background:#FFFFFF; border:1px solid #CBD5E1; border-radius:6px; padding:6px 12px; margin-bottom:12px; display:flex; align-items:center; gap:8px;">
          <div style="width:20px; height:20px; border-radius:50%; border:1px solid #10B981; color:#047857; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:11px;">₹</div>
          <div>
            <div style="font-size:8.5px; font-weight:800; text-transform:uppercase; color:#0F172A;">Amount in Words</div>
            <div style="font-size:10px; font-style:italic; font-weight:600; color:#334155;">${numToWords(netPay)}</div>
          </div>
        </div>

        <!-- Terms, Bank, Signatory -->
        <table style="width:100%; border-collapse:collapse; margin-bottom:10px;">
          <tr>
            <td style="width:34%; vertical-align:top; font-size:9px; color:#475569; padding-right:8px;">
              <strong style="color:#0F172A; display:block; margin-bottom:3px; text-transform:uppercase;">TERMS & CONDITIONS</strong>
              <div style="line-height:1.4;">
                • Goods once sold will not be taken back.<br>
                • Payment within agreed credit period.<br>
                • Interest @ 18% p.a. on delayed payments.<br>
                • Quote Invoice No. & PO No. in correspondence.
              </div>
            </td>
            <td style="width:33%; vertical-align:top; border-left:1px solid #E2E8F0; padding:0 8px; font-size:9px; color:#475569;">
              <strong style="color:#0F172A; display:block; margin-bottom:3px; text-transform:uppercase;">BANK DETAILS</strong>
              <div>Bank Name: <strong>HDFC Bank</strong></div>
              <div>A/c Number: <strong>50200012345678</strong></div>
              <div>IFSC Code: <strong>HDFC0001234</strong></div>
              <div>Branch: <strong>Ganapathy, Coimbatore</strong></div>
            </td>
            <td style="width:33%; vertical-align:top; border-left:1px solid #E2E8F0; padding-left:8px; text-align:right;">
              <div style="font-size:9px; font-weight:800; color:#0F172A; margin-bottom:4px;">For ${poData.supplier}</div>
              <div style="display:inline-flex; align-items:center; justify-content:flex-end; gap:6px;">
                <div style="width:50px; height:50px; border:1.5px dashed #1E40AF; border-radius:50%; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#1E40AF; font-size:5.5px; font-weight:800; text-align:center;">
                  <span>JEYACHANDRAN</span>
                  <span style="color:#DC2626; font-size:6px;">★ COIMBATORE ★</span>
                  <span>PVT LTD</span>
                </div>
                <svg width="60" height="25" viewBox="0 0 100 45" fill="none">
                  <path d="M5 30C15 10 25 35 35 15C45 -5 40 40 55 25C70 10 65 35 80 20C90 10 95 30 98 25" stroke="#0F172A" stroke-width="2.5" stroke-linecap="round"/>
                </svg>
              </div>
              <div style="font-size:9px; font-weight:700; color:#0F172A; margin-top:2px;">Authorized Signatory</div>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <div style="border-top:1px solid #10B981; padding-top:6px; text-align:center; font-size:10px; font-weight:700; color:#047857;">
          <span>∞ &nbsp; Thank you for your business! &nbsp; ∞</span>
        </div>

      </div>
    `;
  } else if (type === 'packing') {
    title = 'Packing List Document';
    body = `
      <div style="border-bottom:2px solid #000; padding-bottom:8px; margin-bottom:12px;">
        <strong style="font-size:16px;">SHIPPING PACKING LIST</strong><br>
        PO: <strong>${poData.code}</strong> | Destination: <strong>${poData.warehouse}</strong>
      </div>
      <div><strong>Total Cartons:</strong> ${cartons.length} | <strong>Total Units:</strong> ${poData.totalOrdered}</div>
      <div style="margin-top:14px;">
        ${cartons.map(c => `
          <div style="border:1px solid #CBD5E1; border-radius:6px; padding:8px; margin-bottom:8px;">
            <strong>${c.lpn_number} (${c.carton_number} - ${c.carton_type})</strong> — Weight: ${c.weight} KG
            ${c.items.map(it => `<div>• ${it.product_name} — ${it.packed_quantity} units</div>`).join('')}
          </div>
        `).join('')}
      </div>
    `;
  } else if (type === 'challan') {
    title = 'Delivery Challan / Gate Pass';
    body = `
      <div style="border-bottom:2px solid #000; padding-bottom:8px; margin-bottom:12px;">
        <strong style="font-size:16px;">DELIVERY CHALLAN & HANDOVER GATE PASS</strong><br>
        PO: <strong>${poData.code}</strong> | Transporter: <strong>${trans}</strong> | Vehicle: <strong>${veh}</strong>
      </div>
      <div><strong>Driver Name:</strong> ${drv}</div>
      <div><strong>Destination Warehouse:</strong> ${poData.warehouse}</div>
      <div style="margin-top:14px; border-top:1px dashed #000; padding-top:10px;">
        I hereby hand over ${cartons.length} carton(s) in good physical condition.
        <div style="margin-top:20px; display:flex; justify-content:space-between;">
          <span>Driver Signature: ____________</span>
          <span>Security Gate Stamp: ____________</span>
        </div>
      </div>
    `;
  } else if (type === 'eway') {
    title = 'GST e-Way Bill Preview';
    body = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; color:#0F172A; background:#FFFFFF; font-size:11px;">
        <div style="border-bottom:2px solid #0F172A; padding-bottom:6px; margin-bottom:10px; display:flex; justify-content:space-between;">
          <div>
            <span style="background:#FFEDD5; color:#C2410C; font-size:9px; font-weight:bold; padding:2px 6px; border-radius:3px;">GOVT OF INDIA &bull; GST PORTAL</span>
            <div style="font-size:18px; font-weight:bold; color:#9A3412; margin-top:2px;">e-WAY BILL SYSTEM</div>
            <div style="font-size:9.5px; color:#64748B;">Form GST EWB-01 &bull; Electronic Way Bill</div>
          </div>
          <div style="background:#FFF7ED; border:1px solid #FDBA74; border-radius:6px; padding:6px 10px; text-align:right;">
            <div style="font-size:8.5px; color:#C2410C; font-weight:bold;">e-WAY BILL NO.</div>
            <div style="font-size:13px; font-weight:bold; color:#9A3412;">1215 9842 1045</div>
            <div style="font-size:8.5px; color:#475569;">Valid: <strong>2 Days</strong></div>
          </div>
        </div>

        <div style="background:#9A3412; color:#FFF; font-size:9.5px; font-weight:bold; padding:4px 8px; margin-bottom:4px;">PART - A (Goods &amp; Supply Details)</div>
        <table style="width:100%; border-collapse:collapse; font-size:10px; margin-bottom:8px;" border="1" bordercolor="#E2E8F0">
          <tr><td style="background:#F8FAFC; width:30%; padding:3px 6px;">Supplier GSTIN</td><td style="padding:3px 6px;"><strong>33ABCDE1234F1Z5</strong> (${poData.supplier})</td></tr>
          <tr><td style="background:#F8FAFC; padding:3px 6px;">Recipient GSTIN</td><td style="padding:3px 6px;"><strong>33AAECS1234F1Z1</strong> (Suguna Foods Pvt Ltd)</td></tr>
          <tr><td style="background:#F8FAFC; padding:3px 6px;">Dispatch &amp; Delivery</td><td style="padding:3px 6px;">Coimbatore (641006) &rarr; Hosur (635126)</td></tr>
          <tr><td style="background:#F8FAFC; padding:3px 6px;">Document No.</td><td style="padding:3px 6px;">Tax Invoice &bull; <strong>${inv}</strong></td></tr>
        </table>

        <div style="background:#9A3412; color:#FFF; font-size:9.5px; font-weight:bold; padding:4px 8px; margin-bottom:4px;">PART - B (Vehicle &amp; Transporter)</div>
        <table style="width:100%; border-collapse:collapse; font-size:10px; margin-bottom:8px;" border="1" bordercolor="#E2E8F0">
          <tr><td style="background:#F8FAFC; width:30%; padding:3px 6px;">Vehicle Number</td><td style="padding:3px 6px;"><strong style="color:#9A3412; font-size:11px;">${veh}</strong> (Road Transport)</td></tr>
          <tr><td style="background:#F8FAFC; padding:3px 6px;">Transporter &amp; LR</td><td style="padding:3px 6px;"><strong>${trans}</strong> &bull; LR: <strong>${lr}</strong></td></tr>
          <tr><td style="background:#F8FAFC; padding:3px 6px;">Driver Contact</td><td style="padding:3px 6px;">${drv} &bull; Mobile Verified</td></tr>
        </table>

        <div style="background:#FFF7ED; border:1px dashed #9A3412; border-radius:4px; padding:6px; text-align:center; font-size:9px; color:#9A3412;">
          |||| | |||||| ||| ||||||| |||||||| ||||| ||| &bull; Official GST Highway QR Inspection Pass
        </div>
      </div>
    `;
  } else {
    title = 'LPN Warehouse Manifest';
    body = `
      <div style="border-bottom:2px solid #000; padding-bottom:8px; margin-bottom:12px;">
        <strong style="font-size:16px;">LPN SCAN DIRECTORY & MANIFEST</strong><br>
        PO: <strong>${poData.code}</strong> | Warehouse: <strong>${poData.warehouse}</strong>
      </div>
      <table style="width:100%; border-collapse:collapse;" border="1" cellpadding="6">
        <tr style="background:#F1F5F9;"><th>LPN Barcode</th><th>Carton</th><th>Contents</th><th>Total Qty</th></tr>
        ${cartons.map(c => `
          <tr>
            <td style="font-family:monospace; font-weight:800;">${c.lpn_number}</td>
            <td>${c.carton_number}</td>
            <td>${c.items.map(it => it.product_name).join(', ')}</td>
            <td><strong>${c.items.reduce((s, it) => s + it.packed_quantity, 0)}</strong></td>
          </tr>
        `).join('')}
      </table>
    `;
  }

  currentModalDocType = type;
  document.getElementById('docModalTitle').innerText = title;
  document.getElementById('docModalContent').innerHTML = body;
  document.getElementById('docViewerModal').classList.add('show');
}

let currentModalDocType = 'invoice';

function printDoc(type) {
  if (type === 'invoice') {
    window.open("{{ route('supplier.invoices.pdf', $purchase->id) }}", "_blank");
  } else if (type === 'packing') {
    window.open("{{ route('supplier.invoices.packing-list', $purchase->id) }}", "_blank");
  } else if (type === 'challan') {
    window.open("{{ route('supplier.invoices.delivery-challan', $purchase->id) }}", "_blank");
  } else if (type === 'manifest') {
    window.open("{{ route('supplier.invoices.lpn-manifest', $purchase->id) }}", "_blank");
  } else if (type === 'eway') {
    window.open("{{ route('supplier.invoices.eway-bill', $purchase->id) }}", "_blank");
  }
}

function printDocFromModal() {
  printDoc(currentModalDocType);
}

let isDeliveryDocsGenerated = false;

function generateDeliveryDocuments() {
  const trans = document.getElementById('inpTransporter').value.trim();
  const veh = document.getElementById('inpVehicle').value.trim();
  const drv = document.getElementById('inpDriverName').value.trim();
  const mob = document.getElementById('inpDriverMobile').value.trim();
  const inv = document.getElementById('inpInvoiceNum').value.trim();
  const lr = document.getElementById('inpLrNum').value.trim();
  const dispatch = document.getElementById('inpDispatchDate').value;
  const eta = document.getElementById('inpExpectedArrival').value;

  if (!veh || !trans) {
    alert('Please enter Vehicle Number and Transporter Company name.');
    document.getElementById('inpVehicle').focus();
    return;
  }
  if (!inv) {
    alert('Please enter Invoice Number.');
    document.getElementById('inpInvoiceNum').focus();
    return;
  }

  // Build query string with live form parameters
  const q = new URLSearchParams({
    inv: inv,
    veh: veh,
    trans: trans,
    drv: drv,
    mob: mob,
    lr: lr,
    dispatch_date: dispatch,
    expected_arrival: eta
  }).toString();

  // Base routes
  const baseA = "{{ route('supplier.invoices.pdf', $purchase->id) }}";
  const baseB = "{{ route('supplier.invoices.packing-list', $purchase->id) }}";
  const baseC = "{{ route('supplier.invoices.delivery-challan', $purchase->id) }}";
  const baseD = "{{ route('supplier.invoices.lpn-manifest', $purchase->id) }}";
  const baseE = "{{ route('supplier.invoices.eway-bill', $purchase->id) }}";

  // Update Doc A (Invoice)
  document.getElementById('btnDocAView').href = baseA + '?' + q;
  document.getElementById('btnDocAPrint').href = baseA + '?' + q + '&print=1';
  document.getElementById('btnDocAPdf').href = baseA + '?' + q + '&pdf=1&download=1';

  // Update Doc B (Packing List)
  document.getElementById('btnDocBView').href = baseB + '?' + q;
  document.getElementById('btnDocBPrint').href = baseB + '?' + q + '&print=1';
  document.getElementById('btnDocBPdf').href = baseB + '?' + q + '&pdf=1&download=1';

  // Update Doc C (Delivery Challan)
  document.getElementById('btnDocCView').href = baseC + '?' + q;
  document.getElementById('btnDocCPrint').href = baseC + '?' + q + '&print=1';
  document.getElementById('btnDocCPdf').href = baseC + '?' + q + '&pdf=1&download=1';

  // Update Doc D (LPN Manifest)
  document.getElementById('btnDocDView').href = baseD + '?' + q;
  document.getElementById('btnDocDPrint').href = baseD + '?' + q + '&print=1';
  document.getElementById('btnDocDPdf').href = baseD + '?' + q + '&pdf=1&download=1';

  // Update Doc E (e-Way Bill)
  document.getElementById('btnDocEView').href = baseE + '?' + q;
  document.getElementById('btnDocEPrint').href = baseE + '?' + q + '&print=1';
  document.getElementById('btnDocEPdf').href = baseE + '?' + q + '&pdf=1&download=1';

  // Mark as generated
  isDeliveryDocsGenerated = true;

  // Update Button & Help Status
  const btn = document.getElementById('btnGenerateDocs');
  const help = document.getElementById('txtGenerateDocsHelp');
  if (btn) {
    btn.innerHTML = '<i class="bi bi-check2-circle"></i> ✓ Re-Generate Delivery Documents';
    btn.style.background = '#15803D';
  }
  if (help) {
    help.innerHTML = '<span style="color:#15803D; font-weight:700;"><i class="bi bi-check-circle-fill"></i> 5 Delivery documents generated with Vehicle ' + veh + ' &amp; Driver ' + (drv || 'Carrier') + '.</span>';
  }

  // Show Section 4 with smooth animation
  const docsSec = document.getElementById('deliveryDocsSection');
  docsSec.style.display = 'block';
  docsSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateLiveDocsState() {
  // If user edits any transport fields after generating, immediately hide Section 4 and prompt re-generation
  if (isDeliveryDocsGenerated) {
    const docsSec = document.getElementById('deliveryDocsSection');
    if (docsSec) {
      docsSec.style.display = 'none';
    }
    
    const btn = document.getElementById('btnGenerateDocs');
    const help = document.getElementById('txtGenerateDocsHelp');
    if (btn) {
      btn.innerHTML = '<i class="bi bi-arrow-repeat"></i> ⚡ Re-Generate Delivery Documents';
      btn.style.background = '#D97706';
    }
    if (help) {
      help.innerHTML = '<span style="color:#D97706; font-weight:700;"><i class="bi bi-exclamation-triangle-fill"></i> Transport details modified! Click "Re-Generate Delivery Documents" to update shipping documents.</span>';
    }
  }
}

function printDriverPack() {
  const trans = document.getElementById('inpTransporter').value.trim();
  const veh = document.getElementById('inpVehicle').value.trim();
  const drv = document.getElementById('inpDriverName').value.trim();
  const mob = document.getElementById('inpDriverMobile').value.trim();
  const inv = document.getElementById('inpInvoiceNum').value.trim();
  const lr = document.getElementById('inpLrNum').value.trim();
  const dispatch = document.getElementById('inpDispatchDate').value;
  const eta = document.getElementById('inpExpectedArrival').value;

  const q = new URLSearchParams({
    inv: inv,
    veh: veh,
    trans: trans,
    drv: drv,
    mob: mob,
    lr: lr,
    dispatch_date: dispatch,
    expected_arrival: eta
  }).toString();

  const docs = [
    "{{ route('supplier.invoices.pdf', $purchase->id) }}?" + q,
    "{{ route('supplier.invoices.packing-list', $purchase->id) }}?" + q,
    "{{ route('supplier.invoices.delivery-challan', $purchase->id) }}?" + q,
    "{{ route('supplier.invoices.lpn-manifest', $purchase->id) }}?" + q,
    "{{ route('supplier.invoices.eway-bill', $purchase->id) }}?" + q
  ];

  docs.forEach((u, i) => {
    setTimeout(() => {
      window.open(u, '_blank');
    }, i * 250);
  });
}

function validateAndOpenDispatchModal() {
  @if($existingAsn)
  alert("⚠️ An Advance Shipping Notice ({{ $existingAsn->asn_number }}) has already been created for this Purchase Order ({{ $poCode }}).\n\nPlease choose a different PO ID or click 'View Existing ASN' to see shipment details.");
  return;
  @endif

  let totalShip = 0;
  Object.values(poData.items).forEach(it => totalShip += it.toShip);

  let totalPacked = 0;
  cartons.forEach(c => c.items.forEach(it => totalPacked += it.packed_quantity));

  if (totalPacked === 0) {
    alert('Please create at least 1 LPN carton before dispatching.');
    return;
  }

  if (totalPacked < totalShip) {
    alert(`Please finish packing all ${totalShip} units into LPN cartons before dispatch.`);
    return;
  }

  const veh = document.getElementById('inpVehicle').value;
  const trans = document.getElementById('inpTransporter').value;
  if (!veh || !trans) {
    alert('Please enter Vehicle Number and Transporter Company name.');
    return;
  }

  document.getElementById('sumModalUnits').innerText = totalPacked + ' Units';
  document.getElementById('sumModalLpns').innerText = cartons.length + ' Carton(s)';
  document.getElementById('sumModalTransporter').innerText = trans;
  document.getElementById('sumModalVehicle').innerText = veh;

  document.getElementById('dispatchModal').classList.add('show');
}

function confirmAndDispatchWithZip() {
  const btn = document.getElementById('btnConfirmDispatch');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm" style="width:14px; height:14px; margin-right:6px;"></span> Creating ASN & Dispatching...';
  }

  // Update cartons_json field
  document.getElementById('cartons_json').value = JSON.stringify(cartons);

  // Broadcast real-time events if present
  if (window.InfyBroadcast) {
    window.InfyBroadcast('shipment', { action: 'created', po_id: {{ $purchase->id }} });
    window.InfyBroadcast('inbound', { action: 'created', po_id: {{ $purchase->id }} });
    window.InfyBroadcast('RECEIVING_UPDATED', { action: 'created', po_id: {{ $purchase->id }} });
    window.InfyBroadcast('SHIPMENT_UPDATED', { action: 'created', po_id: {{ $purchase->id }} });
  }

  // Submit form immediately
  document.getElementById('asnMainForm').submit();
}

function closeModal(id) {
  document.getElementById(id).classList.remove('show');
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeCreateLpnModal();
    closeModal('lpnContentsModal');
    closeModal('lpnLabelModal');
    closeModal('docViewerModal');
    closeModal('dispatchModal');
  }
});
</script>
@endsection