@extends('supplier.layout')

@section('title', 'My Approvals — INFY-POS Supplier Portal')

@section('head')
<style>
/* ══════════════════════════════════════════════════════════════════════
   MY APPROVALS WORK CENTER — REFINED LUXURY ENTERPRISE DESIGN (REF 2)
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
  --sp-radius-md: 14px;
  --sp-radius-sm: 10px;
}

.sp-page-container {
  padding: 4px 4px 40px 4px;
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
  font-size: 32px;
  font-weight: 900;
  color: var(--sp-text-dark);
  margin: 0 0 4px 0;
  letter-spacing: -0.02em;
  line-height: 1.15;
}

.sp-title-group p {
  font-size: 14px;
  color: var(--sp-text-muted);
  margin: 0;
  font-weight: 500;
}

.sp-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* Pill Buttons */
.sp-btn-pill {
  height: 44px;
  padding: 0 20px;
  border-radius: 999px;
  font-size: 13.5px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 180ms ease;
  border: 1px solid var(--sp-border);
  background: #FFFFFF;
  color: var(--sp-text-dark);
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
  text-decoration: none;
}

.sp-btn-pill:hover {
  background: #F1F5F9;
  border-color: #CBD5E1;
  color: var(--sp-text-dark);
}

.sp-btn-pill.sp-btn-primary {
  background: var(--sp-primary);
  color: #FFFFFF;
  border-color: var(--sp-primary);
  box-shadow: 0 4px 14px rgba(21, 128, 61, 0.25);
}

.sp-btn-pill.sp-btn-primary:hover {
  background: var(--sp-primary-hover);
  border-color: var(--sp-primary-hover);
  color: #FFFFFF;
}

/* ── 5 Clickable Actionable KPI Cards ── */
.sp-kpi-grid-5 {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 22px;
}
@media (max-width: 1200px) {
  .sp-kpi-grid-5 { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 768px) {
  .sp-kpi-grid-5 { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 480px) {
  .sp-kpi-grid-5 { grid-template-columns: 1fr; }
}

.sp-kpi-card-v2 {
  background: #FFFFFF;
  border: 1px solid var(--sp-border);
  border-radius: 16px;
  padding: 16px 18px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  text-decoration: none;
  display: block;
  transition: all 0.18s ease;
  position: relative;
}
.sp-kpi-card-v2:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0,0,0,0.05);
  border-color: #CBD5E1;
}
.sp-kpi-card-v2.active-tab {
  border-color: var(--sp-primary);
  background: #F0FDF4;
}

.sp-kpi-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.sp-kpi-lbl {
  font-size: 12.5px;
  font-weight: 700;
  color: #64748B;
}
.sp-kpi-icon-pill {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}
.sp-kpi-num {
  font-size: 28px;
  font-weight: 900;
  color: #0F172A;
  line-height: 1.1;
  letter-spacing: -0.02em;
}
.sp-kpi-subtext {
  font-size: 11px;
  font-weight: 700;
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* ── Main Unified White Card Container (Matching Ref Image 2) ── */
.sp-main-card {
  background: #FFFFFF;
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-lg);
  padding: 22px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.02);
  margin-bottom: 24px;
}

/* Search & Filter Bar Inside Card */
.sp-table-filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 18px;
}
.sp-search-wrap {
  position: relative;
  flex: 1;
  min-width: 260px;
}
.sp-search-wrap input {
  width: 100%;
  height: 44px;
  padding-left: 42px;
  padding-right: 14px;
  border-radius: 12px;
  border: 1px solid #E2E8F0;
  background: #F8FAFC;
  font-size: 13px;
  font-weight: 600;
  color: #0F172A;
  outline: none;
  transition: all 0.15s ease;
}
.sp-search-wrap input:focus {
  border-color: var(--sp-primary);
  background: #FFFFFF;
  box-shadow: 0 0 0 3px rgba(21, 128, 61, 0.1);
}
.sp-search-wrap i {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #94A3B8;
  font-size: 14px;
}

.sp-select-dropdown {
  height: 44px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid #E2E8F0;
  font-size: 13px;
  font-weight: 700;
  color: #0F172A;
  outline: none;
  background: #FFFFFF;
  cursor: pointer;
}

/* ── Table Styling (Matching PO Index Exactly for Perfect Width) ── */
.sp-ref-pill {
  font-family: monospace;
  font-weight: 800;
  font-size: 13px;
  color: #2563EB;
  text-decoration: none;
  padding: 4px 8px;
  background: #EFF6FF;
  border-radius: 6px;
  display: inline-block;
}
.sp-ref-pill:hover {
  background: #DBEAFE;
  color: #1D4ED8;
}

.sp-items-pill {
  font-size: 12px;
  font-weight: 700;
  color: #475569;
  background: #F1F5F9;
  padding: 3px 8px;
  border-radius: 6px;
}

.sp-action-btn-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid #E2E8F0;
  background: #FFFFFF;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #64748B;
  cursor: pointer;
  transition: all 0.15s ease;
  text-decoration: none;
}
.sp-action-btn-circle:hover {
  background: #F8FAFC;
  color: #0F172A;
  border-color: #CBD5E1;
}

.po-row-tr {
  cursor: pointer;
  transition: background 0.15s ease;
}
.po-row-tr:hover {
  background: #F8FAFC;
}

/* ── 6. Slide-Over Review Drawer ── */
.sp-drawer-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(2px);
  z-index: 1040;
  display: none;
}
.sp-drawer-backdrop.show { display: block; }

.sp-drawer-right {
  position: fixed;
  top: 0; right: -500px;
  width: 500px;
  max-width: 90vw;
  height: 100vh;
  background: #FFFFFF;
  z-index: 1050;
  box-shadow: -8px 0 30px rgba(0,0,0,0.12);
  transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
}
.sp-drawer-right.show { right: 0; }

.sp-drawer-head {
  padding: 18px 22px;
  border-bottom: 1px solid #E2E8F0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #F8FAFC;
}
.sp-drawer-body {
  padding: 22px;
  overflow-y: auto;
  flex: 1;
}
.sp-drawer-foot {
  padding: 16px 22px;
  border-top: 1px solid #E2E8F0;
  background: #FFFFFF;
}

/* Modals */
.sp-modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
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
  max-width: 480px;
  padding: 26px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.15);
  animation: spPop 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
@keyframes spPop {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>
@endsection

@section('content')

@php
  $supplierId = $portal->supplier_id ?? 1;

  // Real Stats Derivations
  $allPosCollection = isset($allPos) ? $allPos : $approvals->getCollection();
  $asnsCollection   = isset($asns) ? $asns : collect([]);
  $asnMapCollection = isset($asnMap) ? $asnMap : $asnsCollection->keyBy('purchase_id');

  // Counts
  $pendingPosCount  = $allPosCollection->whereIn('status', [\App\Models\Purchase::PENDING, \App\Models\Purchase::ORDERED, 2, 3])->filter(fn($p) => !str_contains($p->notes ?? '', 'REJECTED'))->count();
  $approvedPosList  = $allPosCollection->where('status', \App\Models\Purchase::RECEIVED);
  $approvedCount    = $approvedPosList->count();

  // Ready for ASN = Approved POs without ASN
  $readyForAsnPos   = $approvedPosList->filter(fn($p) => !isset($asnMapCollection[$p->id]));
  $readyForAsnCount = $readyForAsnPos->count();

  // In Shipment = ASNs in transit / dispatched
  $inShipmentCount  = $asnsCollection->whereIn('status', ['dispatched', 'in_transit', 'out_for_delivery'])->count();

  // Completed = Delivered / received
  $completedCount   = $asnsCollection->whereIn('status', ['delivered', 'arrived', 'received'])->count();

  // First actionable PO for Header
  $firstPendingPo  = $allPosCollection->whereIn('status', [\App\Models\Purchase::PENDING, \App\Models\Purchase::ORDERED, 2, 3])->filter(fn($p) => !str_contains($p->notes ?? '', 'REJECTED'))->first();
  $firstReadyAsnPo = $readyForAsnPos->first();
@endphp

<div class="sp-page-container">

  <!-- ── Breadcrumb ── -->
  <div class="sp-page-breadcrumb">
    <a href="{{ route('supplier.dashboard') }}" style="color: var(--sp-text-muted); text-decoration: none;">Dashboard</a>
    <span style="color: #CBD5E1;">&gt;</span>
    <span class="sp-crumb-active">My Approvals</span>
  </div>

  <!-- ── Page Header ── -->
  <div class="sp-page-header-row">
    <div class="sp-title-group">
      <h1>My Approvals</h1>
      <p>Review purchase orders, accept the orders you can fulfill, and move approved orders into shipment.</p>
    </div>

    <div class="sp-header-actions">
      @if($pendingPosCount > 0 && $firstPendingPo)
      <button type="button" class="sp-btn-pill sp-btn-primary" onclick="openDrawer({{ $firstPendingPo->id }})">
        <i class="bi bi-check-circle-fill"></i> Review Pending POs ({{ $pendingPosCount }})
      </button>
      @elseif($readyForAsnCount > 0 && $firstReadyAsnPo)
      <a href="{{ route('supplier.asn.create', $firstReadyAsnPo->id) }}" class="sp-btn-pill sp-btn-primary">
        <i class="bi bi-plus-lg"></i> Create ASN ({{ $readyForAsnCount }})
      </a>
      @else
      <span class="sp-btn-pill" style="background:#F0FDF4; color:#16A34A; border-color:#BBF7D0;">
        <i class="bi bi-check-all" style="font-size:16px;"></i> ✓ All Caught Up
      </span>
      @endif

      <a href="{{ route('supplier.purchase-orders.index') }}" class="sp-btn-pill" title="View Full PO List">
        <i class="bi bi-clock-history"></i> Approval History
      </a>

      <button type="button" class="sp-btn-pill" onclick="window.location.reload();" title="Refresh">
        <i class="bi bi-arrow-clockwise"></i>
      </button>
    </div>
  </div>

  <!-- ── 5 Clickable Actionable KPI Cards ── -->
  <div class="sp-kpi-grid-5">

    <!-- Card 1: Needs Review -->
    <a href="{{ route('supplier.my-approvals', ['tab' => 'pending']) }}" class="sp-kpi-card-v2 {{ $tab === 'pending' ? 'active-tab' : '' }}">
      <div class="sp-kpi-card-top">
        <span class="sp-kpi-lbl">Needs Review</span>
        <div class="sp-kpi-icon-pill" style="background:#FEF3C7; color:#D97706;">
          <i class="bi bi-hourglass-split"></i>
        </div>
      </div>
      <div class="sp-kpi-num" style="color: {{ $pendingPosCount > 0 ? '#D97706' : '#0F172A' }};">
        {{ $pendingPosCount }}
      </div>
      <div class="sp-kpi-subtext" style="color: {{ $pendingPosCount > 0 ? '#B45309' : '#64748B' }};">
        @if($pendingPosCount > 0)
          ⚡ Action Required
        @else
          ✓ All reviewed
        @endif
      </div>
    </a>

    <!-- Card 2: Approved -->
    <a href="{{ route('supplier.my-approvals', ['tab' => 'approved']) }}" class="sp-kpi-card-v2 {{ $tab === 'approved' ? 'active-tab' : '' }}">
      <div class="sp-kpi-card-top">
        <span class="sp-kpi-lbl">Approved</span>
        <div class="sp-kpi-icon-pill" style="background:#DCFCE7; color:#16A34A;">
          <i class="bi bi-check2-circle"></i>
        </div>
      </div>
      <div class="sp-kpi-num">{{ $approvedCount }}</div>
      <div class="sp-kpi-subtext" style="color:#15803D;">
        Accepted by supplier
      </div>
    </a>

    <!-- Card 3: Ready for ASN -->
    <a href="{{ route('supplier.asn.select-po') }}" class="sp-kpi-card-v2">
      <div class="sp-kpi-card-top">
        <span class="sp-kpi-lbl">Ready for ASN</span>
        <div class="sp-kpi-icon-pill" style="background:#EFF6FF; color:#2563EB;">
          <i class="bi bi-file-earmark-plus"></i>
        </div>
      </div>
      <div class="sp-kpi-num" style="color:#2563EB;">{{ $readyForAsnCount }}</div>
      <div class="sp-kpi-subtext" style="color:#1D4ED8;">
        Ready to dispatch
      </div>
    </a>

    <!-- Card 4: In Shipment -->
    <a href="{{ route('supplier.shipments') }}" class="sp-kpi-card-v2">
      <div class="sp-kpi-card-top">
        <span class="sp-kpi-lbl">In Shipment</span>
        <div class="sp-kpi-icon-pill" style="background:#F3E8FF; color:#9333EA;">
          <i class="bi bi-truck"></i>
        </div>
      </div>
      <div class="sp-kpi-num">{{ $inShipmentCount }}</div>
      <div class="sp-kpi-subtext" style="color:#7E22CE;">
        Moving to warehouse
      </div>
    </a>

    <!-- Card 5: Completed -->
    <a href="{{ route('supplier.purchase-orders.index', ['status' => 'delivered']) }}" class="sp-kpi-card-v2">
      <div class="sp-kpi-card-top">
        <span class="sp-kpi-lbl">Completed</span>
        <div class="sp-kpi-icon-pill" style="background:#F1F5F9; color:#475569;">
          <i class="bi bi-check-all"></i>
        </div>
      </div>
      <div class="sp-kpi-num">{{ $completedCount }}</div>
      <div class="sp-kpi-subtext" style="color:#64748B;">
        Warehouse received
      </div>
    </a>

  </div>

  <!-- ── Main Purchase Orders Table Card (Ref 2 Clean Fit) ── -->
  <div class="sp-main-card" id="sp-workspace">

    <!-- Search & Filter Controls Bar -->
    <div class="sp-table-filters">
      <div class="sp-search-wrap">
        <i class="bi bi-search"></i>
        <input type="text" id="spClientSearch" placeholder="Search PO number, product name, buyer, warehouse..." oninput="filterTable(this.value)">
      </div>

      <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
        <select class="sp-select-dropdown" id="statusFilter" onchange="window.location.href='{{ route('supplier.my-approvals') }}?tab=' + this.value">
          <option value="pending" {{ $tab === 'pending' ? 'selected' : '' }}>Status: Pending Review ({{ $counts['pending'] }})</option>
          <option value="approved" {{ $tab === 'approved' ? 'selected' : '' }}>Status: Approved ({{ $counts['approved'] }})</option>
          <option value="rejected" {{ $tab === 'rejected' ? 'selected' : '' }}>Status: Rejected ({{ $counts['rejected'] }})</option>
          <option value="all" {{ $tab === 'all' ? 'selected' : '' }}>Status: All ({{ $counts['all'] }})</option>
        </select>

        <a href="{{ route('supplier.my-approvals') }}" class="sp-btn-pill" style="height:44px; padding:0 16px;">
          <i class="bi bi-arrow-counterclockwise"></i> Reset
        </a>
      </div>
    </div>

    <!-- Table (Responsive without awkward horizontal overflow) -->
    <div style="overflow-x: auto;">
      <table class="table align-middle mb-0" id="approvalTable" style="font-size:13px; width:100%;">
        <thead style="background:#F8FAFC;">
          <tr>
            <th style="width:40px; padding:14px 16px; border-top-left-radius:12px; border-bottom-left-radius:12px; border-bottom:none;">
              <input type="checkbox" class="form-check-input" style="border-radius:6px; width:18px; height:18px;" id="selectAllPo">
            </th>
            <th style="font-size:11px; font-weight:800; color:#64748B; letter-spacing:0.6px; border-bottom:none;">REFERENCE</th>
            <th style="font-size:11px; font-weight:800; color:#64748B; letter-spacing:0.6px; border-bottom:none;">BUYER</th>
            <th style="font-size:11px; font-weight:800; color:#64748B; letter-spacing:0.6px; border-bottom:none;">WAREHOUSE</th>
            <th style="font-size:11px; font-weight:800; color:#64748B; letter-spacing:0.6px; border-bottom:none;">PRODUCTS & QTY</th>
            <th style="font-size:11px; font-weight:800; color:#64748B; letter-spacing:0.6px; border-bottom:none;">TOTAL AMOUNT</th>
            <th style="font-size:11px; font-weight:800; color:#64748B; letter-spacing:0.6px; border-bottom:none;">EXPECTED DELIVERY</th>
            <th style="font-size:11px; font-weight:800; color:#64748B; letter-spacing:0.6px; border-bottom:none;">STATUS</th>
            <th style="font-size:11px; font-weight:800; color:#64748B; letter-spacing:0.6px; text-align:right; padding-right:20px; border-top-right-radius:12px; border-bottom-right-radius:12px; border-bottom:none;">NEXT ACTION</th>
          </tr>
        </thead>
        <tbody>
          @forelse($approvals as $po)
            @php
              $asn = $asnMapCollection[$po->id] ?? null;
              $isRejected = str_contains($po->notes ?? '', 'REJECTED');
              $isPending = ($po->status == \App\Models\Purchase::PENDING || $po->status == 2 || $po->status == 3) && !$isRejected;
              $isApproved = ($po->status == \App\Models\Purchase::RECEIVED || $po->status == 1) && !$isRejected;

              $itemCount = $po->purchaseItems->count();
              $totalQty  = $po->purchaseItems->sum('quantity');
              $refCode   = $po->reference_code ?: ('PO-2026-'.str_pad($po->id, 5, '0', STR_PAD_LEFT));
              $firstItem = $po->purchaseItems->first();
            @endphp
            <tr class="po-row-tr po-data-row" 
                id="po-row-{{ $po->id }}"
                data-search="{{ strtolower($refCode . ' ' . ($firstItem->product->name ?? '') . ' ' . ($po->warehouse->name ?? '') . ' ' . $po->grand_total) }}"
                onclick="openDrawer({{ $po->id }})"
                style="border-bottom:1px solid #F1F5F9;">
              
              <!-- Checkbox -->
              <td style="padding:16px;" onclick="event.stopPropagation();">
                <input type="checkbox" class="form-check-input row-checkbox" style="border-radius:6px; width:18px; height:18px;">
              </td>

              <!-- PO Reference -->
              <td>
                <a href="javascript:void(0)" onclick="openDrawer({{ $po->id }})" class="sp-ref-pill">
                  {{ $refCode }}
                </a>
                <div style="font-size:11px; color:#94A3B8; margin-top:2px;">
                  {{ \Carbon\Carbon::parse($po->created_at)->format('d M Y') }}
                </div>
              </td>

              <!-- Buyer -->
              <td>
                <div style="display:flex; align-items:center; gap:8px;">
                  <div style="width:30px; height:30px; border-radius:50%; background:#DCFCE7; color:#16A34A; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:800;">
                    KR
                  </div>
                  <div>
                    <div style="font-weight:700; color:#0F172A; font-size:13px;">Karthik R</div>
                    <div style="font-size:11px; color:#64748B;">Suguna Buyer</div>
                  </div>
                </div>
              </td>

              <!-- Warehouse -->
              <td>
                <div style="font-weight:700; color:#0F172A;">{{ $po->warehouse->name ?? 'Suguna Main Warehouse' }}</div>
                <div style="font-size:11px; color:#64748B;">{{ $po->warehouse->city ?? 'Chennai' }}</div>
              </td>

              <!-- Products & Quantity -->
              <td>
                <div style="font-weight:700; color:#0F172A;">
                  {{ $firstItem->product->name ?? 'Products' }}
                  @if($itemCount > 1)
                    <span style="font-size:11px; color:#64748B;">(+{{ $itemCount - 1 }} more)</span>
                  @endif
                </div>
                <div style="font-size:11.5px; color:#16A34A; font-weight:800; margin-top:2px;">
                  {{ $totalQty }} Units Total
                </div>
              </td>

              <!-- Amount -->
              <td style="font-weight:900; color:#0F172A; font-size:14.5px;">
                ₹{{ number_format($po->grand_total, 2) }}
                <div style="font-size:10.5px; color:#94A3B8; font-weight:500;">Incl. GST</div>
              </td>

              <!-- Expected Delivery -->
              <td>
                <div style="display:inline-flex; align-items:center; gap:5px; background:#F8FAFC; border:1px solid #E2E8F0; padding:4px 10px; border-radius:8px; font-size:12px; font-weight:700; color:#0F172A;">
                  <i class="bi bi-calendar3" style="color:#64748B;"></i>
                  {{ \Carbon\Carbon::parse($po->created_at)->addDays(7)->format('d M Y') }}
                </div>
              </td>

              <!-- Status -->
              <td>
                @if($isPending)
                  <span class="badge" style="background:#FEF3C7; color:#B45309; border:1px solid #FDE68A; font-size:12px; padding:6px 12px; border-radius:14px; font-weight:800;">
                    • Review & Accept
                  </span>
                @elseif($isRejected)
                  <span class="badge" style="background:#FEE2E2; color:#DC2626; border:1px solid #FECACA; font-size:12px; padding:6px 12px; border-radius:14px; font-weight:800;">
                    ✕ Rejected
                  </span>
                @elseif($asn)
                  @if($asn->status === 'delivered' || $asn->status === 'arrived')
                    <span class="badge" style="background:#DCFCE7; color:#15803D; border:1px solid #86EFAC; font-size:12px; padding:6px 12px; border-radius:14px; font-weight:800;">
                      ✓ Delivered
                    </span>
                  @elseif($asn->status === 'in_transit' || $asn->status === 'dispatched')
                    <span class="badge" style="background:#F5F3FF; color:#7C3AED; border:1px solid #DDD6FE; font-size:12px; padding:6px 12px; border-radius:14px; font-weight:800;">
                      🚚 In Transit
                    </span>
                  @else
                    <span class="badge" style="background:#EFF6FF; color:#2563EB; border:1px solid #BFDBFE; font-size:12px; padding:6px 12px; border-radius:14px; font-weight:800;">
                      ✓ ASN Created
                    </span>
                  @endif
                @elseif($isApproved)
                  <span class="badge" style="background:#DCFCE7; color:#15803D; border:1px solid #86EFAC; font-size:12px; padding:6px 12px; border-radius:14px; font-weight:800;">
                    ✓ Approved
                  </span>
                @endif
              </td>

              <!-- Next Action Buttons -->
              <td style="text-align: right; padding-right:16px;" onclick="event.stopPropagation();">
                <div style="display:flex; align-items:center; justify-content:flex-end; gap:6px;">
                  @if($isPending)
                    <button type="button" class="btn btn-sm btn-warning fw-bold" style="background:#F59E0B; border:none; border-radius:16px; padding:6px 14px; font-size:12.5px; color:#FFF;" onclick="openDrawer({{ $po->id }})">
                      <i class="bi bi-clipboard-check me-1"></i> Review PO
                    </button>
                  @elseif($isApproved && !$asn)
                    <a href="{{ route('supplier.asn.create', $po->id) }}" class="btn btn-sm btn-success fw-bold" style="background:#16A34A; border:none; border-radius:16px; padding:6px 14px; font-size:12.5px;">
                      <i class="bi bi-plus-lg me-1"></i> Create ASN
                    </a>
                  @elseif($asn)
                    @if($asn->status === 'delivered' || $asn->status === 'arrived')
                      <span style="font-size:11.5px; font-weight:700; color:#64748B;">Waiting for GRN</span>
                    @elseif($asn->status === 'in_transit' || $asn->status === 'dispatched')
                      <a href="{{ route('supplier.shipments') }}" class="btn btn-sm btn-outline-primary fw-bold" style="border-radius:16px; padding:5px 12px; font-size:12px;">
                        <i class="bi bi-geo-alt me-1"></i> Track
                      </a>
                    @else
                      <a href="{{ route('supplier.cartons.index') }}" class="btn btn-sm btn-primary fw-bold" style="border-radius:16px; padding:5px 12px; font-size:12px;">
                        <i class="bi bi-boxes me-1"></i> Pack / LPN
                      </a>
                    @endif
                  @endif

                  <button type="button" class="sp-action-btn-circle" onclick="openDrawer({{ $po->id }})" title="View PO Details">
                    <i class="bi bi-eye"></i>
                  </button>

                  <a href="{{ route('supplier.purchase-orders.pdf', $po->id) }}" class="sp-action-btn-circle" title="Download PDF PO">
                    <i class="bi bi-download"></i>
                  </a>
                </div>
              </td>

            </tr>
          @empty
            <tr>
              <td colspan="9" style="text-align:center; padding:50px 20px;">
                <div style="font-size:40px; margin-bottom:10px;">🎉</div>
                <div style="font-size:16px; font-weight:800; color:#0F172A;">
                  ✓ No purchase orders waiting in this status
                </div>
                <div style="font-size:13px; color:#64748B; margin-top:4px;">
                  All current orders have been processed. You're all caught up!
                </div>
                <div style="margin-top:16px;">
                  <a href="{{ route('supplier.purchase-orders.index') }}" class="sp-btn-pill sp-btn-primary">
                    <i class="bi bi-box-seam"></i> View All Purchase Orders
                  </a>
                </div>
              </td>
            </tr>
          @endforelse
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div style="margin-top:18px; padding-top:14px; border-top:1px solid #F1F5F9; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
      <div style="font-size:12.5px; color:#64748B; font-weight:600;">
        Showing {{ $approvals->count() }} of {{ $approvals->total() }} purchase orders
      </div>
      <div>
        {{ $approvals->appends(request()->query())->links('pagination::bootstrap-4') }}
      </div>
    </div>

  </div>

</div>

<!-- ── Slide-Over Review Drawer ── -->
<div class="sp-drawer-backdrop" id="poDrawerBackdrop" onclick="closeDrawer()"></div>
<div class="sp-drawer-right" id="poDetailsDrawer">
  <div class="sp-drawer-head">
    <div>
      <div style="font-size:11px; font-weight:800; color:#64748B; text-transform:uppercase;">Purchase Order Review</div>
      <div class="font-monospace fw-bold" style="font-size:18px; color:#0F172A;" id="drawerPoRef">PO Number</div>
    </div>
    <button type="button" onclick="closeDrawer()" class="btn-close"></button>
  </div>

  <div class="sp-drawer-body">
    <!-- Status & Decision Header -->
    <div class="mb-3 d-flex justify-content-between align-items-center" id="drawerStatusStrip">
      <div id="drawerStatusBadge">
        <span class="badge" style="background:#FEF3C7; color:#B45309; font-size:13px; padding:6px 14px; border-radius:14px; font-weight:800;">• Pending Review</span>
      </div>
    </div>

    <!-- Key Order Info Grid -->
    <div class="mb-4" style="background: #F8FAFC; border-radius: 12px; padding: 16px; border: 1px solid #E2E8F0;">
      <div style="font-size: 11.5px; font-weight: 800; color: #0F172A; text-transform: uppercase; margin-bottom: 10px;">ORDER SUMMARY</div>
      <div style="display: grid; grid-template-columns: 130px 1fr; gap: 8px 12px; font-size: 13px;">
        <span style="color: #64748B; font-weight: 600;">Buyer:</span>
        <strong style="color: #0F172A;">Karthik R (Suguna)</strong>

        <span style="color: #64748B; font-weight: 600;">Warehouse:</span>
        <strong style="color: #0F172A;" id="drawerWh">Suguna Warehouse</strong>

        <span style="color: #64748B; font-weight: 600;">Expected Delivery:</span>
        <span style="color: #16A34A; font-weight: 800;" id="drawerDate">07 Sep 2026</span>

        <span style="color: #64748B; font-weight: 600;">Grand Total:</span>
        <strong style="color: #0F172A; font-size: 15px;" id="drawerAmount">₹ 0.00</strong>
      </div>
    </div>

    <!-- Product Line Items -->
    <div style="font-size:12px; font-weight:800; color:#0F172A; text-transform:uppercase; margin-bottom:10px;">PRODUCTS & QUANTITIES</div>
    <div style="border:1px solid #E2E8F0; border-radius:12px; overflow:hidden; margin-bottom:20px;">
      <table style="width:100%; border-collapse:collapse; font-size:12.5px;">
        <thead style="background:#F8FAFC;">
          <tr>
            <th style="padding:10px 12px; text-align:left; border-bottom:1px solid #E2E8F0; color:#64748B; font-weight:800;">PRODUCT</th>
            <th style="padding:10px 12px; text-align:center; border-bottom:1px solid #E2E8F0; color:#64748B; font-weight:800;">QTY</th>
            <th style="padding:10px 12px; text-align:right; border-bottom:1px solid #E2E8F0; color:#64748B; font-weight:800;">PRICE</th>
            <th style="padding:10px 12px; text-align:right; border-bottom:1px solid #E2E8F0; color:#64748B; font-weight:800;">TOTAL</th>
          </tr>
        </thead>
        <tbody id="drawerItemsBody">
          <!-- Populated by JS -->
        </tbody>
      </table>
    </div>

    <!-- Decision Center Box (Visible when PO is Pending) -->
    <div id="drawerDecisionSection" style="background:#FFFDF5; border:1.5px solid #FDE68A; border-radius:14px; padding:16px; margin-bottom:14px;">
      <div style="font-size:13.5px; font-weight:900; color:#92400E; margin-bottom:4px;">
        ⚡ Supplier Fulfillment Decision
      </div>
      <p style="font-size:12px; color:#78350F; margin:0 0 12px 0;">
        Can you fulfill all requested quantities and meet the expected delivery schedule?
      </p>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
        <button type="button" class="sp-btn-pill sp-btn-primary" style="height:42px; font-size:13px;" onclick="triggerAcceptModal()">
          ✓ YES, I CAN FULFILL
        </button>
        <button type="button" class="sp-btn-pill" style="height:42px; font-size:13px; color:#DC2626; border-color:#FECACA; background:#FEF2F2;" onclick="triggerRejectModal()">
          ✕ CANNOT FULFILL
        </button>
      </div>
    </div>

  </div>

  <div class="sp-drawer-foot" style="display:flex; justify-content:space-between; align-items:center;">
    <a href="#" id="drawerPdfLink" class="btn btn-outline-secondary btn-sm fw-bold" style="border-radius: 16px;">
      <i class="bi bi-download"></i> Download PO PDF
    </a>
    <button type="button" class="btn btn-light btn-sm fw-bold" onclick="closeDrawer()" style="border-radius: 16px;">
      Close
    </button>
  </div>
</div>

<!-- ── Accept Confirmation Modal ── -->
<div class="sp-modal-overlay" id="acceptModalOverlay">
  <div class="sp-modal-box">
    <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
      <div style="width:40px; height:40px; border-radius:12px; background:#DCFCE7; color:#16A34A; display:flex; align-items:center; justify-content:center; font-size:20px;">
        ✓
      </div>
      <div>
        <div style="font-size:17px; font-weight:900; color:#0F172A;">Confirm Purchase Order</div>
        <div style="font-size:12px; color:#64748B;">Accept and commitment to fulfill</div>
      </div>
    </div>

    <p style="font-size:13px; color:#334155; line-height:1.45; margin-bottom:16px;">
      You're confirming that you can fulfill all requested quantities and meet the delivery timeline for <strong id="acceptPoCode">PO</strong>.
    </p>

    <form method="POST" id="acceptForm" action="">
      @csrf
      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" class="sp-btn-pill" onclick="closeModal('acceptModalOverlay')">Cancel</button>
        <button type="submit" class="sp-btn-pill sp-btn-primary">Confirm & Accept Order</button>
      </div>
    </form>
  </div>
</div>

<!-- ── Reject Modal with Reasons ── -->
<div class="sp-modal-overlay" id="rejectModalOverlay">
  <div class="sp-modal-box">
    <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
      <div style="width:40px; height:40px; border-radius:12px; background:#FEE2E2; color:#DC2626; display:flex; align-items:center; justify-content:center; font-size:20px;">
        ✕
      </div>
      <div>
        <div style="font-size:17px; font-weight:900; color:#0F172A;">Reject Purchase Order</div>
        <div style="font-size:12px; color:#64748B;">This order will be returned to buyer</div>
      </div>
    </div>

    <form method="POST" id="rejectForm" action="">
      @csrf
      <div style="margin-bottom:14px;">
        <label style="font-size:12px; font-weight:800; color:#0F172A; display:block; margin-bottom:4px;">Select Reason for Rejection *</label>
        <select name="reason_select" id="rejectReasonSelect" class="form-select" style="font-size:13px; font-weight:600;" onchange="handleRejectSelect(this.value)">
          <option value="Insufficient Stock Available">Insufficient Stock Available</option>
          <option value="Cannot Meet Expected Delivery Schedule">Cannot Meet Expected Delivery Schedule</option>
          <option value="Pricing / GST Discrepancy">Pricing / GST Discrepancy</option>
          <option value="Product Discontinued / Unavailable">Product Discontinued / Unavailable</option>
          <option value="Quantity Exceeds Maximum Capacity">Quantity Exceeds Maximum Capacity</option>
          <option value="Other">Other (Specify below)</option>
        </select>
      </div>

      <div style="margin-bottom:16px;">
        <label style="font-size:12px; font-weight:800; color:#0F172A; display:block; margin-bottom:4px;">Detailed Note *</label>
        <textarea name="reason" id="rejectReasonText" rows="3" class="form-control" style="font-size:12.5px;" placeholder="Explain why this order cannot be fulfilled... (min 10 characters)" required>Insufficient stock available to fulfill requested quantity on schedule.</textarea>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" class="sp-btn-pill" onclick="closeModal('rejectModalOverlay')">Cancel</button>
        <button type="submit" class="sp-btn-pill" style="background:#DC2626; color:#FFF; border-color:#DC2626;">Reject Purchase Order</button>
      </div>
    </form>
  </div>
</div>

@endsection

@section('scripts')
<script>
// Real PO Client Database
const poDataStore = {
  @foreach($approvals as $p)
  @php
    $asn = $asnMapCollection[$p->id] ?? null;
    $isRejected = str_contains($p->notes ?? '', 'REJECTED');
    $isPending = ($p->status == \App\Models\Purchase::PENDING || $p->status == 2 || $p->status == 3) && !$isRejected;
    $refStr = $p->reference_code ?: ('PO-2026-'.str_pad($p->id, 5, '0', STR_PAD_LEFT));
  @endphp
  "{{ $p->id }}": {
    id: {{ $p->id }},
    ref: "{{ $refStr }}",
    status: {{ $p->status }},
    isPending: {{ $isPending ? 'true' : 'false' }},
    warehouse: "{{ addslashes($p->warehouse->name ?? 'Suguna Main Warehouse') }}",
    date: "{{ \Carbon\Carbon::parse($p->created_at)->addDays(7)->format('d M Y') }}",
    amount: "₹{{ number_format($p->grand_total, 2) }}",
    pdfUrl: "/supplier/purchase-orders/{{ $p->id }}/pdf",
    items: [
      @foreach($p->purchaseItems as $it)
      {
        name: "{{ addslashes($it->product->name ?? 'Item') }}",
        qty: {{ $it->quantity }},
        price: "₹{{ number_format($it->net_unit_cost, 2) }}",
        total: "₹{{ number_format($it->sub_total, 2) }}"
      },
      @endforeach
    ]
  },
  @endforeach
};

let currentSelectedPoId = null;

function openDrawer(id) {
  const po = poDataStore[id];
  if (!po) {
    console.warn("PO not found in store for ID:", id);
    return;
  }

  currentSelectedPoId = id;
  document.getElementById('drawerPoRef').innerText = po.ref;
  document.getElementById('drawerWh').innerText = po.warehouse;
  document.getElementById('drawerDate').innerText = po.date;
  document.getElementById('drawerAmount').innerText = po.amount;
  document.getElementById('drawerPdfLink').href = po.pdfUrl;

  // Decision section visibility
  const decSec = document.getElementById('drawerDecisionSection');
  const statBadge = document.getElementById('drawerStatusBadge');

  if (po.isPending) {
    decSec.style.display = 'block';
    statBadge.innerHTML = '<span class="badge" style="background:#FEF3C7; color:#B45309; font-size:13px; padding:6px 14px; border-radius:14px; font-weight:800;">• Pending Review</span>';
  } else {
    decSec.style.display = 'none';
    statBadge.innerHTML = '<span class="badge" style="background:#DCFCE7; color:#15803D; font-size:13px; padding:6px 14px; border-radius:14px; font-weight:800;">• Approved</span>';
  }

  // Populate items
  const tbody = document.getElementById('drawerItemsBody');
  tbody.innerHTML = '';
  po.items.forEach(it => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="padding:10px 12px; border-bottom:1px solid #F1F5F9; font-weight:700; color:#0F172A;">${it.name}</td>
      <td style="padding:10px 12px; border-bottom:1px solid #F1F5F9; text-align:center; font-weight:800; color:#16A34A;">${it.qty}</td>
      <td style="padding:10px 12px; border-bottom:1px solid #F1F5F9; text-align:right; color:#64748B;">${it.price}</td>
      <td style="padding:10px 12px; border-bottom:1px solid #F1F5F9; text-align:right; font-weight:800; color:#0F172A;">${it.total}</td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('poDrawerBackdrop').classList.add('show');
  document.getElementById('poDetailsDrawer').classList.add('show');
}

function closeDrawer() {
  document.getElementById('poDrawerBackdrop').classList.remove('show');
  document.getElementById('poDetailsDrawer').classList.remove('show');
}

function triggerAcceptModal() {
  if (!currentSelectedPoId) return;
  const po = poDataStore[currentSelectedPoId];
  document.getElementById('acceptPoCode').innerText = po.ref;
  document.getElementById('acceptForm').action = "/supplier/purchase-orders/" + currentSelectedPoId + "/approve";
  document.getElementById('acceptModalOverlay').classList.add('show');
}

function triggerRejectModal() {
  if (!currentSelectedPoId) return;
  document.getElementById('rejectForm').action = "/supplier/purchase-orders/" + currentSelectedPoId + "/reject";
  document.getElementById('rejectModalOverlay').classList.add('show');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('show');
}

function handleRejectSelect(val) {
  const txt = document.getElementById('rejectReasonText');
  if (val === 'Other') {
    txt.value = '';
    txt.placeholder = 'Please write specific reason (min 10 chars)...';
    txt.focus();
  } else {
    txt.value = val;
  }
}

// Client Table Search
function filterTable(query) {
  query = query.toLowerCase().trim();
  const rows = document.querySelectorAll('.po-data-row');
  rows.forEach(r => {
    const searchData = r.getAttribute('data-search') || '';
    if (searchData.includes(query)) {
      r.style.display = '';
    } else {
      r.style.display = 'none';
    }
  });
}

// Select All Checkbox
document.addEventListener("DOMContentLoaded", function() {
  const selectAll = document.getElementById('selectAllPo');
  if (selectAll) {
    selectAll.addEventListener('change', function() {
      document.querySelectorAll('.row-checkbox').forEach(cb => {
        cb.checked = selectAll.checked;
      });
    });
  }
});

// Keyboard shortcuts (Esc closes drawer/modals)
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeDrawer();
    closeModal('acceptModalOverlay');
    closeModal('rejectModalOverlay');
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
