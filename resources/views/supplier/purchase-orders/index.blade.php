@extends('supplier.layout')

@section('title', 'Purchase Orders')

@section('head')
<style>
/* ── Perfect Ref 2 Quotations Design System ── */

/* KPI Cards 4-Column Grid */
.sp-kpi-grid-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}
@media (max-width: 1200px) {
  .sp-kpi-grid-4 { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 576px) {
  .sp-kpi-grid-4 { grid-template-columns: 1fr; }
}

.sp-kpi-card-premium {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 16px;
  padding: 20px 22px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  text-decoration: none;
  display: block;
}
.sp-kpi-card-premium:hover {
  box-shadow: 0 6px 20px rgba(0,0,0,0.06);
  transform: translateY(-2px);
  border-color: #CBD5E1;
}

.sp-kpi-title-text {
  font-size: 13px;
  font-weight: 700;
  color: #475569;
}
.sp-kpi-icon-box {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 19px;
  flex-shrink: 0;
}
.sp-kpi-big-num {
  font-size: 32px;
  font-weight: 900;
  color: #0F172A;
  line-height: 1.1;
  margin-top: 6px;
  letter-spacing: -0.02em;
}
.sp-kpi-tag {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11.5px;
  font-weight: 700;
}

/* Reference Tag Pill */
.sp-ref-pill {
  background: #EFF6FF;
  color: #2563EB;
  border: 1px solid #BFDBFE;
  padding: 4px 12px;
  border-radius: 14px;
  font-weight: 800;
  font-size: 12.5px;
  text-decoration: none;
  display: inline-block;
}
.sp-ref-pill:hover {
  background: #DBEAFE;
  color: #1D4ED8;
}

/* Items Pill */
.sp-items-pill {
  background: #DCFCE7;
  color: #15803D;
  padding: 4px 12px;
  border-radius: 14px;
  font-weight: 800;
  font-size: 12px;
  display: inline-block;
}

/* Table Row Hover */
.po-row-tr { transition: background 0.15s ease; cursor: pointer; }
.po-row-tr:hover { background: #F8FAFC !important; }

/* Action Circular Buttons */
.sp-action-btn-circle {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid #E2E8F0;
  background: #FFFFFF;
  color: #64748B;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.15s ease;
}
.sp-action-btn-circle:hover {
  background: #F1F5F9;
  color: #0F172A;
  border-color: #CBD5E1;
}

/* Right Slide-over Drawer */
.sp-drawer-backdrop {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(2px);
  z-index: 1040;
  display: none;
}
.sp-drawer-backdrop.show { display: block; }

.sp-drawer-right {
  position: fixed; top: 0; right: -460px; width: 450px; height: 100vh;
  background: #FFFFFF; z-index: 1050;
  box-shadow: -8px 0 30px rgba(0,0,0,0.12);
  transition: right 0.3s ease;
  display: flex; flex-direction: column;
}
.sp-drawer-right.show { right: 0; }

.sp-drawer-head {
  padding: 20px 24px; border-bottom: 1px solid #E2E8F0;
  display: flex; align-items: center; justify-content: space-between; background: #F8FAFC;
}
.sp-drawer-body {
  padding: 24px; overflow-y: auto; flex: 1;
}
.sp-drawer-foot {
  padding: 16px 24px; border-top: 1px solid #E2E8F0; background: #FFFFFF;
}
</style>
@endsection

@section('content')

@php
  $statusFilter = request('status', 'all');

  $approvedEligiblePos = $purchases->filter(fn($po) => $po->status == 1 && !str_contains($po->notes ?? '', 'REJECTED') && !isset($asnMap[$po->id]));
  $eligibleAsnCount = $approvedEligiblePos->count();

  $actionNeededCount = $purchases->filter(function($po) use ($asnMap) {
      $hasAsn = isset($asnMap[$po->id]);
      $isRejected = str_contains($po->notes ?? '', 'REJECTED');
      $isPending = in_array($po->status, [2, 3]) && !$isRejected;
      $isApprovedNoAsn = ($po->status == 1) && !$isRejected && !$hasAsn;
      return $isPending || $isApprovedNoAsn;
  })->count();

  $displayPurchases = $purchases->filter(function($po) use ($statusFilter, $asnMap) {
      $hasAsn = isset($asnMap[$po->id]);
      $asn = $asnMap[$po->id] ?? null;
      $isRejected = str_contains($po->notes ?? '', 'REJECTED');
      $isPending = in_array($po->status, [2, 3]) && !$isRejected;
      $isApproved = ($po->status == 1) && !$isRejected;

      if ($statusFilter === 'need_action') {
          return $isPending || ($isApproved && !$hasAsn);
      } elseif ($statusFilter === 'asn_pending') {
          return $isApproved && !$hasAsn;
      } elseif ($statusFilter === 'asn_created') {
          return $hasAsn;
      } elseif ($statusFilter === 'delivered') {
          return $hasAsn && ($asn->status == 'arrived' || $asn->status == 'delivered');
      } elseif ($statusFilter === 'pending') {
          return $isPending;
      } elseif ($statusFilter === 'approved') {
          return $isApproved;
      }
      return true;
  });
@endphp

<!-- Page Title Header (Matching Ref 2 Quotations Header) -->
<div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
  <div>
    <!-- Breadcrumb -->
    <div style="font-size: 13px; font-weight: 600; color: #64748B; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
      <span>Dashboard</span>
      <span>&gt;</span>
      <span>Purchases</span>
      <span>&gt;</span>
      <span style="color: #16A34A; font-weight: 700;">Purchase Orders</span>
    </div>
    <h1 style="font-size: 26px; font-weight: 900; color: #0F172A; margin: 0; letter-spacing: -0.02em;">Purchase Orders</h1>
    <p style="font-size: 13.5px; color: #64748B; margin: 3px 0 0 0; font-weight: 500;">
      Create, manage and monitor purchase orders before converting them into shipments.
    </p>
  </div>
  <div>
    <a href="{{ route('supplier.asn.select-po') }}" class="btn btn-success" style="background: #16A34A; border: none; border-radius: 24px; padding: 10px 24px; font-size: 14px; font-weight: 800; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 14px rgba(22, 163, 74, 0.25);">
      <i class="bi bi-plus-lg" style="font-size: 16px;"></i> Create ASN {{ $eligibleAsnCount > 0 ? '('.$eligibleAsnCount.')' : '' }}
    </a>
  </div>
</div>

<!-- Top 4 Clickable Summary Cards Grid (Matching Ref Image 2) -->
<div class="sp-kpi-grid-4">
  <!-- Card 1: Total POs -->
  <a href="{{ route('supplier.purchase-orders.index', ['status' => 'all']) }}" class="sp-kpi-card-premium">
    <div class="d-flex align-items-center justify-content-between">
      <span class="sp-kpi-title-text">Total POs</span>
      <div class="sp-kpi-icon-box" style="background:#DCFCE7; color:#16A34A;">
        <i class="bi bi-file-earmark-text"></i>
      </div>
    </div>
    <div class="sp-kpi-big-num">{{ $purchases->total() ?: count($purchases) }}</div>
    <div class="d-flex align-items-center justify-content-between mt-3">
      <span class="sp-kpi-tag" style="background:#DCFCE7; color:#15803D;">{{ $purchases->total() ?: count($purchases) }} Active</span>
      <svg width="76" height="26" viewBox="0 0 76 26" fill="none">
        <path d="M2 20L22 14L44 16L74 4" stroke="#16A34A" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="74" cy="4" r="3.5" fill="#16A34A"/>
      </svg>
    </div>
  </a>

  <!-- Card 2: Pending POs / Need Action -->
  <a href="{{ route('supplier.purchase-orders.index', ['status' => 'need_action']) }}" class="sp-kpi-card-premium" style="{{ $statusFilter == 'need_action' ? 'border-color:#F59E0B; background:#FFFDF5;' : '' }}">
    <div class="d-flex align-items-center justify-content-between">
      <span class="sp-kpi-title-text">Need Action</span>
      <div class="sp-kpi-icon-box" style="background:#FEF3C7; color:#D97706;">
        <i class="bi bi-lightning-charge-fill"></i>
      </div>
    </div>
    <div class="sp-kpi-big-num" style="color:#D97706;">{{ $actionNeededCount }}</div>
    <div class="d-flex align-items-center justify-content-between mt-3">
      <span class="sp-kpi-tag" style="background:#FEF3C7; color:#B45309;">⚡ {{ $actionNeededCount }} Action Required</span>
      <svg width="76" height="26" viewBox="0 0 76 26" fill="none">
        <path d="M2 18L22 21L44 13L74 6" stroke="#D97706" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="74" cy="6" r="3.5" fill="#D97706"/>
      </svg>
    </div>
  </a>

  <!-- Card 3: Approved POs -->
  <a href="{{ route('supplier.purchase-orders.index', ['status' => 'approved']) }}" class="sp-kpi-card-premium">
    <div class="d-flex align-items-center justify-content-between">
      <span class="sp-kpi-title-text">Approved POs</span>
      <div class="sp-kpi-icon-box" style="background:#F3E8FF; color:#9333EA;">
        <i class="bi bi-check-circle-fill"></i>
      </div>
    </div>
    <div class="sp-kpi-big-num">{{ $stats['approved'] ?? 0 }}</div>
    <div class="d-flex align-items-center justify-content-between mt-3">
      <span class="sp-kpi-tag" style="background:#F3E8FF; color:#7E22CE;">{{ $stats['approved'] ?? 0 }} Approved</span>
      <svg width="76" height="26" viewBox="0 0 76 26" fill="none">
        <path d="M2 22L22 17L44 12L74 4" stroke="#9333EA" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="74" cy="4" r="3.5" fill="#9333EA"/>
      </svg>
    </div>
  </a>

  <!-- Card 4: PO Value -->
  <div class="sp-kpi-card-premium" style="cursor:default;">
    <div class="d-flex align-items-center justify-content-between">
      <span class="sp-kpi-title-text">PO Value</span>
      <div class="sp-kpi-icon-box" style="background:#EFF6FF; color:#2563EB;">
        <i class="bi bi-currency-rupee"></i>
      </div>
    </div>
    <div class="sp-kpi-big-num" style="font-size: 26px;">₹ {{ number_format($stats['total_value'] ?? 0, 2) }}</div>
    <div class="d-flex align-items-center justify-content-between mt-3">
      <span class="sp-kpi-tag" style="background:#EFF6FF; color:#1D4ED8;">Total Value</span>
      <svg width="76" height="26" viewBox="0 0 76 26" fill="none">
        <path d="M2 20L22 16L44 11L74 3" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="74" cy="3" r="3.5" fill="#2563EB"/>
      </svg>
    </div>
  </div>
</div>

<!-- Single Unified Master Card Container (Matching Ref Image 2 Quotations Card) -->
<div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 20px; padding: 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.02); margin-bottom: 24px;">

  <!-- Search & Controls Bar Inside Card -->
  <form action="{{ route('supplier.purchase-orders.index') }}" method="GET" class="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
    <!-- Search Box -->
    <div style="position:relative; flex:1; min-width:280px;">
      <i class="bi bi-search" style="position:absolute; left:16px; top:50%; transform:translateY(-50%); color:#94A3B8; font-size:15px;"></i>
      <input type="text" name="search" value="{{ request('search') }}" placeholder="Search purchase orders by reference, warehouse, buyer..." style="width:100%; height:46px; padding-left:46px; border-radius:12px; border:1px solid #F1F5F9; font-size:13.5px; font-weight:600; color:#0F172A; outline:none; background:#F8FAFC;">
    </div>

    <!-- Dropdowns -->
    <div class="d-flex align-items-center gap-2 flex-wrap">
      <div style="display:flex; align-items:center; gap:6px;">
        <span style="font-size:13px; font-weight:700; color:#64748B;">Status:</span>
        <select name="status" class="form-select" style="height:46px; border-radius:12px; border:1px solid #E2E8F0; font-size:13px; font-weight:700; color:#0F172A; min-width:170px;" onchange="this.form.submit()">
          <option value="all" {{ $statusFilter == 'all' ? 'selected' : '' }}>All</option>
          <option value="need_action" {{ $statusFilter == 'need_action' ? 'selected' : '' }}>⚡ Need Action ({{ $actionNeededCount }})</option>
          <option value="pending" {{ $statusFilter == 'pending' ? 'selected' : '' }}>Pending Review</option>
          <option value="asn_pending" {{ $statusFilter == 'asn_pending' ? 'selected' : '' }}>Approved (Ready for ASN)</option>
          <option value="asn_created" {{ $statusFilter == 'asn_created' ? 'selected' : '' }}>ASN Created</option>
          <option value="delivered" {{ $statusFilter == 'delivered' ? 'selected' : '' }}>Delivered</option>
        </select>
      </div>

      <div style="display:flex; align-items:center; gap:6px;">
        <span style="font-size:13px; font-weight:700; color:#64748B;">Sort:</span>
        <select name="sort" class="form-select" style="height:46px; border-radius:12px; border:1px solid #E2E8F0; font-size:13px; font-weight:700; color:#0F172A; min-width:120px;" onchange="this.form.submit()">
          <option value="newest" {{ request('sort') == 'newest' ? 'selected' : '' }}>Newest</option>
          <option value="oldest" {{ request('sort') == 'oldest' ? 'selected' : '' }}>Oldest</option>
          <option value="highest" {{ request('sort') == 'highest' ? 'selected' : '' }}>Highest Amount</option>
        </select>
      </div>

      <!-- View Toggle Pills -->
      <div style="background:#F1F5F9; border-radius:12px; padding:3px; display:flex; align-items:center; gap:2px; height:46px;">
        <button type="button" class="btn btn-sm" style="background:#FFFFFF; color:#16A34A; border-radius:8px; width:36px; height:36px; display:flex; align-items:center; justify-content:center; box-shadow:0 1px 2px rgba(0,0,0,0.06); border:none;"><i class="bi bi-list-ul" style="font-size:16px;"></i></button>
        <button type="button" class="btn btn-sm" style="background:transparent; color:#94A3B8; border-radius:8px; width:36px; height:36px; display:flex; align-items:center; justify-content:center; border:none;"><i class="bi bi-grid" style="font-size:16px;"></i></button>
      </div>

      <a href="{{ route('supplier.purchase-orders.index') }}" class="btn btn-light fw-bold" style="height:46px; border-radius:12px; border:1px solid #E2E8F0; font-size:13px; padding:0 18px; display:inline-flex; align-items:center; gap:6px; color:#475569; background:#FFFFFF;">
        <i class="bi bi-arrow-counterclockwise"></i> Reset
      </a>
    </div>
  </form>

  <!-- Master Table (Matching Ref Image 2 Quotations Layout) -->
  <div style="overflow-x:auto;">
    <table class="table align-middle mb-0" id="poTable" style="font-size:13px; width:100%;">
      <thead style="background:#F8FAFC; border-radius:12px;">
        <tr>
          <th style="width:40px; padding:14px 16px; border-top-left-radius:12px; border-bottom-left-radius:12px; border-bottom:none;"><input type="checkbox" class="form-check-input" style="border-radius:6px; width:18px; height:18px;"></th>
          <th style="font-size:11px; font-weight:800; color:#64748B; letter-spacing:0.6px; border-bottom:none;">REFERENCE</th>
          <th style="font-size:11px; font-weight:800; color:#64748B; letter-spacing:0.6px; border-bottom:none;">BUYER</th>
          <th style="font-size:11px; font-weight:800; color:#64748B; letter-spacing:0.6px; border-bottom:none;">WAREHOUSE</th>
          <th style="font-size:11px; font-weight:800; color:#64748B; letter-spacing:0.6px; border-bottom:none;">ITEMS</th>
          <th style="font-size:11px; font-weight:800; color:#64748B; letter-spacing:0.6px; border-bottom:none;">GRAND TOTAL</th>
          <th style="font-size:11px; font-weight:800; color:#64748B; letter-spacing:0.6px; border-bottom:none;">STATUS</th>
          <th style="font-size:11px; font-weight:800; color:#64748B; letter-spacing:0.6px; border-bottom:none;">CREATED DATE</th>
          <th style="font-size:11px; font-weight:800; color:#64748B; letter-spacing:0.6px; text-align:right; padding-right:20px; border-top-right-radius:12px; border-bottom-right-radius:12px; border-bottom:none;">ACTIONS</th>
        </tr>
      </thead>
      <tbody>
        @forelse($displayPurchases as $idx => $po)
        @php
          $asn = $asnMap[$po->id] ?? null;
          $refCode = $po->reference_code ?: ('PO-2026-'.str_pad($po->id, 5, '0', STR_PAD_LEFT));
          $itemCount = $po->purchaseItems->count();
          $isRejected = str_contains($po->notes ?? '', 'REJECTED');
          $isPending = in_array($po->status, [2, 3]) && !$isRejected;
          $isApproved = ($po->status == 1) && !$isRejected;
        @endphp
        <tr id="po-row-{{ $po->id }}" class="po-row-tr" style="border-bottom:1px solid #F1F5F9;" onclick="openPoOrderDrawer({{ $po->id }})">
          <td style="padding:16px;" onclick="event.stopPropagation();">
            <input type="checkbox" class="form-check-input" style="border-radius:6px; width:18px; height:18px;">
          </td>
          <td>
            <a href="javascript:void(0)" class="sp-ref-pill" onclick="openPoOrderDrawer({{ $po->id }})">
              {{ $refCode }}
            </a>
          </td>
          <td>
            <div style="display:flex; align-items:center; gap:8px;">
              <div style="width:30px; height:30px; border-radius:50%; background:#DCFCE7; color:#16A34A; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:800;">
                KR
              </div>
              <div>
                <div style="font-weight:700; color:#0F172A; font-size:13px;">Karthik R</div>
                <div style="font-size:11px; color:#64748B;">Buyer</div>
              </div>
            </div>
          </td>
          <td>
            <div style="font-weight:700; color:#0F172A;">{{ $po->warehouse->name ?? 'Suguna Warehouse' }}</div>
            <div style="font-size:11px; color:#64748B;">Main Warehouse</div>
          </td>
          <td>
            <span class="sp-items-pill">{{ $itemCount }} Products</span>
          </td>
          <td style="font-weight:900; color:#0F172A; font-size:14px;">
            ₹{{ number_format($po->grand_total, 2) }}
          </td>
          <td>
            @if($asn)
              @if($asn->status == 'dispatched')
                <span class="badge" style="background:#F0FDF4; color:#16A34A; border:1px solid #BBF7D0; font-size:12.5px; padding:6px 14px; border-radius:16px; font-weight:800;">• Dispatched</span>
              @elseif($asn->status == 'in_transit')
                <span class="badge" style="background:#F5F3FF; color:#7C3AED; border:1px solid #DDD6FE; font-size:12.5px; padding:6px 14px; border-radius:16px; font-weight:800;">• In Transit</span>
              @elseif($asn->status == 'arrived' || $asn->status == 'delivered')
                <span class="badge" style="background:#DCFCE7; color:#15803D; border:1px solid #86EFAC; font-size:12.5px; padding:6px 14px; border-radius:16px; font-weight:800;">• Delivered</span>
              @else
                <span class="badge" style="background:#EFF6FF; color:#2563EB; border:1px solid #BFDBFE; font-size:12.5px; padding:6px 14px; border-radius:16px; font-weight:800;">• ASN Created</span>
              @endif
            @elseif($isPending)
              <span class="badge" style="background:#FEF3C7; color:#B45309; border:1px solid #FDE68A; font-size:12.5px; padding:6px 14px; border-radius:16px; font-weight:800;">• Pending Review</span>
            @elseif($isApproved)
              <span class="badge" style="background:#DCFCE7; color:#15803D; border:1px solid #86EFAC; font-size:12.5px; padding:6px 14px; border-radius:16px; font-weight:800;">• Approved</span>
            @else
              <span class="badge" style="background:#FEE2E2; color:#B91C1C; border:1px solid #FECACA; font-size:12.5px; padding:6px 14px; border-radius:16px; font-weight:800;">• Rejected</span>
            @endif
          </td>
          <td>
            <div style="font-weight:600; color:#0F172A; font-size:12.5px;">{{ \Carbon\Carbon::parse($po->date)->format('d-m-Y') }}</div>
            <div style="font-size:11px; color:#94A3B8;">{{ \Carbon\Carbon::parse($po->created_at)->format('h:i A') }}</div>
          </td>
          <td style="text-align:right; padding-right:16px;" onclick="event.stopPropagation();">
            <div style="display:flex; gap:6px; justify-content:flex-end; align-items:center;">
              <button type="button" class="sp-action-btn-circle" title="View PO Details" onclick="openPoOrderDrawer({{ $po->id }})">
                <i class="bi bi-eye"></i>
              </button>
              @if($asn)
                <a href="{{ route('supplier.asn.index') }}" class="btn btn-sm btn-outline-success fw-bold" style="border-radius:16px; padding:5px 12px; font-size:12px; background:#F0FDF4; color:#16A34A; border-color:#BBF7D0;" title="ASN Already Created">
                  <i class="bi bi-check2-circle me-1"></i> ASN Created
                </a>
              @elseif($isPending)
                <a href="{{ route('supplier.my-approvals') }}" class="btn btn-sm fw-bold" style="background:#F59E0B; border:none; border-radius:16px; padding:5px 14px; font-size:12px; color:#FFF; box-shadow:0 2px 6px rgba(245,158,11,0.25);" title="Review & Accept PO">
                  Review PO
                </a>
              @elseif($isApproved)
                <a href="{{ route('supplier.asn.create', $po->id) }}" class="btn btn-sm btn-success fw-bold" style="background:#16A34A; border:none; border-radius:16px; padding:5px 14px; font-size:12px;" title="Create ASN">
                  <i class="bi bi-plus-lg me-1"></i> ASN
                </a>
              @endif
              <a href="{{ route('supplier.purchase-orders.pdf', $po->id) }}" class="sp-action-btn-circle" title="Download PDF PO">
                <i class="bi bi-download"></i>
              </a>
            </div>
          </td>
        </tr>
        @empty
        <tr>
          <td colspan="9" style="text-align:center; padding:60px; color:#94A3B8; font-weight:700;">
            No purchase orders match your search or filter.
          </td>
        </tr>
        @endforelse
      </tbody>
    </table>
  </div>

  <!-- Pagination Bar (Matching Ref Image 2) -->
  <div style="margin-top:20px; padding-top:18px; border-top:1px solid #F1F5F9; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
    <div style="font-size:13px; color:#64748B; font-weight:600;">
      Showing {{ $displayPurchases->count() }} of {{ $purchases->total() ?? $purchases->count() }} purchase orders
    </div>
    <div class="d-flex align-items-center gap-3">
      {{ $purchases->links() }}
    </div>
  </div>

</div>

<!-- RIGHT-SIDE PO DETAILS DRAWER -->
<div class="sp-drawer-backdrop" id="drawerBackdrop" onclick="closePoOrderDrawer()"></div>
<div class="sp-drawer-right" id="poDetailsDrawer">
  <div class="sp-drawer-head">
    <div>
      <div style="font-size: 16px; font-weight: 900; color: #0F172A;" id="drCode">PO Number</div>
      <div style="font-size: 12px; color: #64748B;" id="drDate">Date</div>
    </div>
    <button type="button" class="btn-close" onclick="closePoOrderDrawer()"></button>
  </div>
  <div class="sp-drawer-body">
    <!-- Status Badge -->
    <div class="mb-4 d-flex justify-content-between align-items-center">
      <div id="drStatusBadge">
        <span class="badge" style="background:#DCFCE7; color:#15803D; font-size:13px; padding:6px 14px; border-radius:14px; font-weight:800;">• Approved</span>
      </div>
      <a id="drCtaBtn" href="#" class="btn btn-sm btn-success fw-bold" style="background:#16A34A; border:none; border-radius:16px; padding:6px 16px;">
        + Create ASN
      </a>
    </div>

    <!-- ORDER SUMMARY -->
    <div class="mb-4" style="background: #F8FAFC; border-radius: 12px; padding: 16px; border: 1px solid #E2E8F0;">
      <div style="font-size: 12px; font-weight: 800; color: #0F172A; text-transform: uppercase; margin-bottom: 12px;">ORDER SUMMARY</div>
      <div style="display: grid; grid-template-columns: 120px 1fr; gap: 8px 12px; font-size: 13px;">
        <span style="color: #64748B; font-weight: 600;">Buyer:</span>
        <strong style="color: #0F172A;">Karthik R</strong>

        <span style="color: #64748B; font-weight: 600;">Warehouse:</span>
        <strong style="color: #0F172A;" id="drWarehouse">Suguna Warehouse</strong>

        <span style="color: #64748B; font-weight: 600;">Expected Delivery:</span>
        <span style="color: #16A34A; font-weight: 700;" id="drDeliveryDate">05 Sep 2026</span>

        <span style="color: #64748B; font-weight: 600;">Total Value:</span>
        <strong style="color: #0F172A; font-size: 15px;" id="drTotalValue">₹ 2,070.00</strong>
      </div>
    </div>

    <!-- PRODUCTS LIST -->
    <div>
      <div style="font-size: 12px; font-weight: 800; color: #0F172A; text-transform: uppercase; margin-bottom: 10px;">PRODUCTS</div>
      <div id="drProductsList">
        <!-- Dynamic JS Insert -->
      </div>
    </div>
  </div>
  <div class="sp-drawer-foot d-flex justify-content-between align-items-center">
    <a id="drPdfLink" href="#" class="btn btn-outline-secondary btn-sm fw-bold" style="border-radius: 16px;">
      <i class="bi bi-download"></i> Download PO PDF
    </a>
    <button type="button" class="btn btn-light btn-sm fw-bold" onclick="closePoOrderDrawer()" style="border-radius: 16px;">
      Close
    </button>
  </div>
</div>

@endsection

@section('scripts')
<script>
window.drawerPoData = {
  @foreach($purchases as $po)
  @php
    $asn = $asnMap[$po->id] ?? null;
    $totalQty = $po->purchaseItems->sum('quantity') ?: 50;
    $hasAsn = !is_null($asn);
    $isPoRejected = str_contains($po->notes ?? '', 'REJECTED');
    $isPoPending = in_array($po->status, [2, 3]) && !$isPoRejected;
    $isPoApproved = ($po->status == 1) && !$isPoRejected;
  @endphp
  "{{ $po->id }}": {
    code: "{{ $po->reference_code ?: ('PO-2026-'.str_pad($po->id, 5, '0', STR_PAD_LEFT)) }}",
    date: "{{ \Carbon\Carbon::parse($po->date)->format('d M Y') }}",
    delivery_date: "{{ \Carbon\Carbon::parse($po->created_at)->addDays(7)->format('d M Y') }}",
    warehouse: "{{ addslashes($po->warehouse->name ?? 'Suguna Warehouse') }}",
    total_val: "₹ {{ number_format($po->grand_total, 2) }}",
    status: {{ $po->status }},
    is_pending: {{ $isPoPending ? 'true' : 'false' }},
    is_approved: {{ $isPoApproved ? 'true' : 'false' }},
    is_rejected: {{ $isPoRejected ? 'true' : 'false' }},
    has_asn: {{ $hasAsn ? 'true' : 'false' }},
    asn_create_url: "{{ route('supplier.asn.create', $po->id) }}",
    pdf_url: "{{ route('supplier.purchase-orders.pdf', $po->id) }}",
    items: [
      @foreach($po->purchaseItems as $pi)
      {
        name: "{{ addslashes($pi->product->name ?? 'Product Item') }}",
        qty: {{ (int)$pi->quantity }},
        total: "₹ {{ number_format($pi->total, 2) }}"
      },
      @endforeach
    ]
  },
  @endforeach
};

window.openPoOrderDrawer = function(poId) {
  const data = window.drawerPoData ? window.drawerPoData[poId] : null;
  if (!data) return;

  const codeEl = document.getElementById('drCode');
  if (codeEl) codeEl.innerText = data.code;
  const dateEl = document.getElementById('drDate');
  if (dateEl) dateEl.innerText = 'Created on ' + data.date;
  const whEl = document.getElementById('drWarehouse');
  if (whEl) whEl.innerText = data.warehouse;
  const delEl = document.getElementById('drDeliveryDate');
  if (delEl) delEl.innerText = data.delivery_date;
  const valEl = document.getElementById('drTotalValue');
  if (valEl) valEl.innerText = data.total_val;
  const pdfEl = document.getElementById('drPdfLink');
  if (pdfEl) pdfEl.href = data.pdf_url;

  const btnCta = document.getElementById('drCtaBtn');
  const badgeStat = document.getElementById('drStatusBadge');

  if (btnCta && badgeStat) {
    if (data.is_pending) {
      badgeStat.innerHTML = '<span class="badge" style="background:#FEF3C7; color:#B45309; font-size:13px; padding:6px 14px; border-radius:14px; font-weight:800;">• Pending Review</span>';
      btnCta.innerText = 'Review PO';
      btnCta.href = "{{ route('supplier.my-approvals') }}";
      btnCta.className = 'btn btn-sm btn-warning fw-bold';
    } else if (data.is_rejected) {
      badgeStat.innerHTML = '<span class="badge" style="background:#FEE2E2; color:#B91C1C; font-size:13px; padding:6px 14px; border-radius:14px; font-weight:800;">• Rejected</span>';
      btnCta.innerText = 'Rejected';
      btnCta.href = '#';
      btnCta.className = 'btn btn-sm btn-danger fw-bold disabled';
    } else if (!data.has_asn) {
      badgeStat.innerHTML = '<span class="badge" style="background:#DCFCE7; color:#15803D; font-size:13px; padding:6px 14px; border-radius:14px; font-weight:800;">• Approved</span>';
      btnCta.innerText = '+ Create ASN';
      btnCta.href = data.asn_create_url;
      btnCta.className = 'btn btn-sm btn-success fw-bold';
    } else {
      badgeStat.innerHTML = '<span class="badge" style="background:#EFF6FF; color:#1D4ED8; font-size:13px; padding:6px 14px; border-radius:14px; font-weight:800;">• ASN Created</span>';
      btnCta.innerText = 'Manage ASN';
      btnCta.href = "{{ route('supplier.asn.index') }}";
      btnCta.className = 'btn btn-sm btn-outline-success fw-bold';
    }
  }

  let itemsHtml = '';
  data.items.forEach(it => {
    itemsHtml += `
      <div class="d-flex align-items-center justify-content-between py-2 border-bottom" style="font-size:12.5px;">
        <div>
          <strong style="color:#0F172A;">${it.name}</strong>
        </div>
        <div>
          <span style="color:#16A34A; font-weight:700;">Qty: ${it.qty}</span>
          <span style="margin-left:8px; font-weight:800;">${it.total}</span>
        </div>
      </div>
    `;
  });
  const listEl = document.getElementById('drProductsList');
  if (listEl) listEl.innerHTML = itemsHtml || '<div style="font-size:12px; color:#94A3B8;">No items listed.</div>';

  const drEl = document.getElementById('poDetailsDrawer');
  if (drEl) drEl.classList.add('show');
  const bdEl = document.getElementById('drawerBackdrop');
  if (bdEl) bdEl.classList.add('show');
};

window.closePoOrderDrawer = function() {
  const drEl = document.getElementById('poDetailsDrawer');
  if (drEl) drEl.classList.remove('show');
  const bdEl = document.getElementById('drawerBackdrop');
  if (bdEl) bdEl.classList.remove('show');
};

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
