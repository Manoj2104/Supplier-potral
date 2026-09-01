@extends('supplier.layout')

@section('title', 'PO ' . ($purchase->reference_code ?: $purchase->id) . ' — Suguna Supplier Portal')

@section('head')
<style>
/* ══════════════════════════════════════════════════════════════════════
   PURCHASE ORDER DETAILS — 1:1 PIXEL MATCH TO REFERENCE IMAGE 2
   ══════════════════════════════════════════════════════════════════════ */

:root {
  --sp-bg-main: #F8FAFC;
  --sp-card-bg: #FFFFFF;
  --sp-border: #EEF2F7;
  --sp-border-subtle: #E2E8F0;
  --sp-primary: #15803D;
  --sp-primary-hover: #166534;
  --sp-text-dark: #0F172A;
  --sp-text-muted: #64748B;
  --sp-radius-lg: 20px;
  --sp-radius-md: 14px;
}

.sp-page-container {
  padding: 8px 10px 40px 10px;
  font-family: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif;
}

/* ── 1. Breadcrumb ── */
.sp-page-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--sp-text-muted);
  font-weight: 500;
  margin-bottom: 12px;
}
.sp-page-breadcrumb a {
  color: var(--sp-text-muted);
  text-decoration: none;
  transition: color 150ms ease;
}
.sp-page-breadcrumb a:hover {
  color: var(--sp-primary);
}
.sp-crumb-active {
  color: var(--sp-primary);
  font-weight: 700;
}

/* ── 2. Page Header Row ── */
.sp-page-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
}

.sp-title-group h1 {
  font-size: 28px;
  font-weight: 800;
  color: var(--sp-text-dark);
  margin: 0;
  letter-spacing: -0.02em;
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.sp-title-group p {
  font-size: 13.5px;
  color: var(--sp-text-muted);
  margin: 6px 0 0 0;
  font-weight: 500;
}

.sp-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* Pill Buttons (Ref 2 Match) */
.sp-btn-pill {
  height: 40px;
  padding: 0 18px;
  border-radius: 999px;
  font-size: 13.5px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 180ms ease;
  border: 1px solid var(--sp-border-subtle);
  background: #FFFFFF;
  color: var(--sp-text-dark);
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
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
  box-shadow: 0 4px 14px rgba(21, 128, 61, 0.25);
}

.sp-btn-pill.sp-btn-primary:hover {
  background: var(--sp-primary-hover);
  border-color: var(--sp-primary-hover);
  color: #FFFFFF;
  box-shadow: 0 6px 18px rgba(21, 128, 61, 0.35);
}

.sp-btn-pill.sp-btn-purple {
  background: #7C3AED;
  color: #FFFFFF;
  border-color: #7C3AED;
  box-shadow: 0 4px 14px rgba(124, 58, 237, 0.25);
}

.sp-btn-pill.sp-btn-purple:hover {
  background: #6D28D9;
  border-color: #6D28D9;
  color: #FFFFFF;
}

/* ── 3. Top 3 Info Cards Grid (Ref 2 Match) ── */
.sp-info-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

@media (max-width: 992px) {
  .sp-info-grid-3 {
    grid-template-columns: 1fr;
  }
}

.sp-info-card {
  background: #FFFFFF;
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-lg);
  padding: 22px 24px;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.02);
  transition: all 180ms ease;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.sp-info-card:hover {
  border-color: #CBD5E1;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
}

.sp-info-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.sp-info-card-icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.sp-info-card-icon.blue   { background: #EFF6FF; color: #2563EB; }
.sp-info-card-icon.green  { background: #DCFCE7; color: #15803D; }
.sp-info-card-icon.purple { background: #F3E8FF; color: #9333EA; }

.sp-info-card-title {
  font-size: 12.5px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--sp-text-muted);
  text-transform: uppercase;
}

.sp-info-card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sp-info-main-title {
  font-size: 16.5px;
  font-weight: 800;
  color: var(--sp-text-dark);
  margin-bottom: 2px;
}

.sp-info-line {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13.5px;
  color: #475569;
  font-weight: 500;
}

.sp-info-line i {
  font-size: 14px;
  color: #94A3B8;
  width: 16px;
  text-align: center;
}

/* ── 4. Main Order Summary Card ── */
.sp-summary-card {
  background: #FFFFFF;
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-lg);
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.02);
  overflow: hidden;
  margin-bottom: 24px;
}

.sp-summary-header {
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #F1F5F9;
}

.sp-summary-title {
  font-size: 17px;
  font-weight: 800;
  color: var(--sp-text-dark);
  display: flex;
  align-items: center;
  gap: 10px;
}

.sp-summary-title i {
  color: var(--sp-primary);
  font-size: 19px;
}

.sp-summary-count-badge {
  background: #F1F5F9;
  color: #475569;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 999px;
}

/* Table Style */
.sp-table-wrapper {
  overflow-x: auto;
  width: 100%;
}

.sp-table-order {
  width: 100%;
  border-collapse: collapse;
  min-width: 900px;
}

.sp-table-order thead th {
  background: #F8FAFC;
  color: #64748B;
  font-size: 11.5px;
  font-weight: 800;
  letter-spacing: 0.05em;
  padding: 14px 20px;
  border-bottom: 1px solid #E2E8F0;
  text-align: left;
}

.sp-table-order thead th.text-right {
  text-align: right;
}

.sp-table-order thead th.text-center {
  text-align: center;
}

.sp-table-order tbody tr {
  border-bottom: 1px solid #F1F5F9;
  transition: background 150ms ease;
}

.sp-table-order tbody tr:hover {
  background: #FAFAFA;
}

.sp-table-order tbody td {
  padding: 16px 20px;
  font-size: 13.5px;
  color: #1E293B;
  vertical-align: middle;
}

.sp-table-order tbody td.text-right {
  text-align: right;
}

.sp-table-order tbody td.text-center {
  text-align: center;
}

/* ── 5. Bottom Breakdown Grid ── */
.sp-bottom-grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 24px;
  padding: 24px;
  background: #FAFAFA;
  border-top: 1px solid #EEF2F7;
}

@media (max-width: 900px) {
  .sp-bottom-grid {
    grid-template-columns: 1fr;
  }
}

.sp-notes-box {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.sp-notes-title {
  font-size: 12px;
  font-weight: 800;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 8px;
}

.sp-notes-content {
  font-size: 13.5px;
  color: #64748B;
  line-height: 1.6;
  margin-bottom: 16px;
}

.sp-breakdown-table {
  width: 100%;
  border-collapse: collapse;
}

.sp-breakdown-table tr td {
  padding: 8px 0;
  font-size: 13.5px;
  color: #475569;
}

.sp-breakdown-table tr td:last-child {
  text-align: right;
  font-weight: 700;
  color: #0F172A;
}

.sp-breakdown-table tr.grand-total-row td {
  padding-top: 14px;
  border-top: 1.5px solid #E2E8F0;
  font-size: 16px;
  font-weight: 800;
  color: #0F172A;
}

.sp-breakdown-table tr.grand-total-row td:last-child {
  font-size: 22px;
  font-weight: 900;
  color: var(--sp-primary);
}
</style>
@endsection

@section('content')
@php
  $statusVal = (int) $purchase->status;
  $isRejected = ($statusVal === 3 || $purchase->status === 'rejected' || (!empty($purchase->notes) && str_contains($purchase->notes, 'REJECTED:')));
  $isApproved = (!$isRejected && ($statusVal === 1 || $purchase->status === 'approved' || $purchase->status === 'Received'));
  $isPending = (!$isRejected && !$isApproved);
  $refCode = $purchase->reference_code ?: ('PU_' . $purchase->id);
  $itemCount = $purchase->purchaseItems ? $purchase->purchaseItems->count() : 0;
  $totalUnits = $purchase->purchaseItems ? $purchase->purchaseItems->sum('quantity') : 0;
@endphp

<div class="sp-page-container">

  <!-- ── 1. Breadcrumb ── -->
  <div class="sp-page-breadcrumb">
    <a href="{{ route('supplier.dashboard') }}">Dashboard</a>
    <span style="color: #CBD5E1;">&gt;</span>
    <a href="{{ route('supplier.purchase-orders.index') }}">Purchase Orders</a>
    <span style="color: #CBD5E1;">&gt;</span>
    <span class="sp-crumb-active font-monospace">{{ $refCode }}</span>
  </div>

  <!-- ── 2. Page Header Row ── -->
  <div class="sp-page-header-row">
    <div class="sp-title-group">
      <h1>
        Purchase Order Details
        <span class="badge font-monospace" style="background:#F3E8FF; color:#7C3AED; font-size:14px; font-weight:800; padding:4px 12px; border-radius:8px; vertical-align:middle;">
          {{ $refCode }}
        </span>
        @if($isApproved)
          <span class="badge" style="background:#DCFCE7; color:#15803D; border:1px solid #86EFAC; font-size:13px; font-weight:800; padding:4px 12px; border-radius:999px; vertical-align:middle;">
            • Approved
          </span>
        @elseif($isRejected)
          <span class="badge" style="background:#FEE2E2; color:#DC2626; border:1px solid #FECACA; font-size:13px; font-weight:800; padding:4px 12px; border-radius:999px; vertical-align:middle;">
            • Rejected
          </span>
        @elseif($isPending)
          <span class="badge" style="background:#FEF3C7; color:#B45309; border:1px solid #FDE68A; font-size:13px; font-weight:800; padding:4px 12px; border-radius:999px; vertical-align:middle;">
            • Pending Confirmation
          </span>
        @else
          <span class="badge" style="background:#FEE2E2; color:#DC2626; border:1px solid #FECACA; font-size:13px; font-weight:800; padding:4px 12px; border-radius:999px; vertical-align:middle;">
            • {{ ucfirst($purchase->status) }}
          </span>
        @endif
      </h1>
      <p>Created on {{ \Carbon\Carbon::parse($purchase->created_at)->format('d-m-Y') }} &bull; Warehouse: <strong>{{ $purchase->warehouse->name ?? 'Suguna Warehouse' }}</strong></p>
    </div>

    <!-- Header Action Buttons -->
    <div class="sp-header-actions">
      <a href="{{ route('supplier.purchase-orders.pdf', $purchase->id) }}" class="sp-btn-pill sp-btn-primary">
        <i class="bi bi-file-earmark-pdf-fill"></i> PDF / Print
      </a>

      @if($isApproved)
        @if(!$asn)
          <a href="{{ route('supplier.asn.create', $purchase->id) }}" class="sp-btn-pill sp-btn-purple">
            <i class="bi bi-truck"></i> Create ASN / Dispatch
          </a>
        @else
          <a href="{{ route('supplier.asn.show', $asn->id) }}" class="sp-btn-pill sp-btn-purple">
            <i class="bi bi-box-seam"></i> View ASN ({{ $asn->asn_number }})
          </a>
        @endif
      @elseif($isPending)
        <form action="{{ route('supplier.purchase-orders.approve', $purchase->id) }}" method="POST" style="display:inline;">
          @csrf
          <button type="submit" class="sp-btn-pill sp-btn-purple" onclick="return confirm('Approve Purchase Order {{ $refCode }}?')">
            <i class="bi bi-check2-circle"></i> Accept Order
          </button>
        </form>
      @endif

      <a href="{{ route('supplier.purchase-orders.index') }}" class="sp-btn-pill">
        <i class="bi bi-arrow-left"></i> Back
      </a>
    </div>
  </div>

  <!-- ── 3. Top 3 Info Cards Grid (Exact Ref 2 Match) ── -->
  <div class="sp-info-grid-3">

    <!-- Card 1: SUPPLIER INFO (Icon Blue) -->
    <div class="sp-info-card">
      <div class="sp-info-card-header">
        <div class="sp-info-card-icon blue">
          <i class="bi bi-person-fill"></i>
        </div>
        <div class="sp-info-card-title">SUPPLIER INFO</div>
      </div>
      <div class="sp-info-card-body">
        <div class="sp-info-main-title">{{ $purchase->supplier->name ?? 'Jeyachandran Textile Private Limited' }}</div>
        <div class="sp-info-line">
          <i class="bi bi-envelope"></i>
          <span>{{ $purchase->supplier->email ?? 'manoj2104s@gmail.com' }}</span>
        </div>
        <div class="sp-info-line">
          <i class="bi bi-telephone"></i>
          <span>{{ $purchase->supplier->phone ?? '+918610006544' }}</span>
        </div>
        <div class="sp-info-line">
          <i class="bi bi-geo-alt"></i>
          <span>{{ $purchase->supplier->address ?? 'SUP-00001, Main Warehouse' }}</span>
        </div>
      </div>
    </div>

    <!-- Card 2: COMPANY INFO (Icon Green) -->
    <div class="sp-info-card">
      <div class="sp-info-card-header">
        <div class="sp-info-card-icon green">
          <i class="bi bi-building"></i>
        </div>
        <div class="sp-info-card-title">COMPANY INFO</div>
      </div>
      <div class="sp-info-card-body">
        <div class="sp-info-main-title">Suguna</div>
        <div class="sp-info-line">
          <i class="bi bi-envelope"></i>
          <span>manoj@gmail.com</span>
        </div>
        <div class="sp-info-line">
          <i class="bi bi-telephone"></i>
          <span>9345635571</span>
        </div>
        <div class="sp-info-line">
          <i class="bi bi-geo-alt"></i>
          <span>Chennai, Tamil Nadu 600081, India</span>
        </div>
      </div>
    </div>

    <!-- Card 3: PURCHASE ORDER INFO (Icon Purple) -->
    <div class="sp-info-card">
      <div class="sp-info-card-header">
        <div class="sp-info-card-icon purple">
          <i class="bi bi-file-earmark-text-fill"></i>
        </div>
        <div class="sp-info-card-title">PURCHASE ORDER INFO</div>
      </div>
      <div class="sp-info-card-body">
        <div class="sp-info-main-title" style="color: #7C3AED; font-family: monospace;">
          Ref: {{ $refCode }}
        </div>
        <div class="sp-info-line">
          <i class="bi bi-building"></i>
          <span>Warehouse: <strong>{{ $purchase->warehouse->name ?? 'Suguna Warehouse' }}</strong></span>
        </div>
        <div class="sp-info-line">
          <i class="bi bi-calendar3"></i>
          <span>Date: {{ \Carbon\Carbon::parse($purchase->date)->format('d-m-Y') }}</span>
        </div>
        <div class="sp-info-line">
          <i class="bi bi-shield-check"></i>
          <span>Status: <strong style="color: {{ $isApproved ? '#15803D' : '#D97706' }};">{{ $isApproved ? 'Approved (Ready for ASN)' : 'Pending Confirmation' }}</strong></span>
        </div>
      </div>
    </div>

  </div>

  <!-- ── 4. Main Order Summary Card (Exact Ref 2 Match) ── -->
  <div class="sp-summary-card">
    <div class="sp-summary-header">
      <div class="sp-summary-title">
        <i class="bi bi-receipt"></i> Order Summary
      </div>
      <div class="sp-summary-count-badge">
        {{ $itemCount }} Item(s)
      </div>
    </div>

    <div class="sp-table-wrapper">
      <table class="sp-table-order">
        <thead>
          <tr>
            <th style="width: 50px;">#</th>
            <th>PRODUCT</th>
            <th class="text-right">NET UNIT PRICE</th>
            <th class="text-center">QUANTITY</th>
            <th class="text-right">UNIT PRICE</th>
            <th class="text-right">DISCOUNT</th>
            <th class="text-right">TAX</th>
            <th class="text-right" style="padding-right: 24px;">SUBTOTAL</th>
          </tr>
        </thead>
        <tbody>
          @forelse($purchase->purchaseItems as $i => $item)
            @php
              $pCost = (float) ($item->product_cost ?: 0);
              $netCost = (float) ($item->net_unit_cost ?: $pCost);
              $qty = (float) ($item->quantity ?: 1);
              $disc = (float) ($item->discount_amount ?: 0);
              $tax = (float) ($item->tax_amount ?: 0);
              $sub = (float) ($item->sub_total ?: ($pCost * $qty));
            @endphp
            <tr>
              <td style="color: #94A3B8; font-weight: 700;">{{ $i + 1 }}</td>
              <td>
                <div style="font-weight: 800; color: #0F172A; font-size: 14px;">
                  {{ $item->product->name ?? 'Product Item' }}
                </div>
                <div style="font-size: 12px; color: #64748B; font-family: monospace; margin-top: 2px;">
                  ||||| {{ $item->product->code ?? '8981898853777' }}
                </div>
              </td>
              <td class="text-right" style="font-weight: 600; color: #334155;">
                ₹{{ number_format($netCost, 2) }}
              </td>
              <td class="text-center">
                <span class="badge" style="background:#EFF6FF; color:#2563EB; border:1px solid #BFDBFE; font-size:13px; font-weight:800; padding:4px 12px; border-radius:8px;">
                  {{ (int)$qty }}
                </span>
              </td>
              <td class="text-right" style="font-weight: 600; color: #334155;">
                ₹{{ number_format($pCost, 2) }}
              </td>
              <td class="text-right" style="font-weight: 600; color: #64748B;">
                ₹{{ number_format($disc, 2) }}
              </td>
              <td class="text-right" style="font-weight: 600; color: #64748B;">
                ₹{{ number_format($tax, 2) }}
              </td>
              <td class="text-right" style="padding-right: 24px; font-weight: 800; color: #0F172A; font-size: 14.5px;">
                ₹{{ number_format($sub, 2) }}
              </td>
            </tr>
          @empty
            <tr>
              <td colspan="8" style="text-align:center; padding: 40px; color: #94A3B8;">
                No line items associated with this purchase order.
              </td>
            </tr>
          @endforelse
        </tbody>
      </table>
    </div>

    <!-- ── 5. Bottom Notes & Totals Breakdown (Exact Ref 2 Match) ── -->
    <div class="sp-bottom-grid">
      <div class="sp-notes-box">
        <div>
          <div class="sp-notes-title">PURCHASE ORDER TERMS &amp; NOTES</div>
          <div class="sp-notes-content">
            {{ $purchase->notes ?: 'This purchase order is confirmed and scheduled for delivery. Prices and availability are subject to final confirmation upon goods inspection at the delivery warehouse.' }}
          </div>
        </div>

        @if($isApproved && !$asn)
          <div style="background: #F0FDF4; border: 1px solid #86EFAC; border-radius: 12px; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 14px;">
            <div style="font-size: 13px; color: #15803D; font-weight: 700;">
              📦 Order Approved! Ready to dispatch goods?
            </div>
            <a href="{{ route('supplier.asn.create', $purchase->id) }}" class="btn btn-sm btn-success fw-bold text-white shadow-sm" style="border-radius: 8px; font-size: 12px; padding: 6px 14px; background: #16A34A; border: none; white-space: nowrap;">
              Create ASN Now →
            </a>
          </div>
        @endif
      </div>

      <div>
        <table class="sp-breakdown-table">
          <tr>
            <td>Order Tax</td>
            <td>₹{{ number_format($purchase->tax_amount ?? 0, 2) }} ({{ number_format($purchase->tax_rate ?? 0, 2) }}%)</td>
          </tr>
          <tr>
            <td>Discount</td>
            <td>₹{{ number_format($purchase->discount ?? 0, 2) }}</td>
          </tr>
          <tr>
            <td>Shipping</td>
            <td>₹{{ number_format($purchase->shipping ?? 0, 2) }}</td>
          </tr>
          <tr class="grand-total-row">
            <td>Grand Total</td>
            <td>₹{{ number_format($purchase->grand_total, 2) }}</td>
          </tr>
        </table>
      </div>
    </div>

  </div>

</div>

@endsection

@section('scripts')
@if(session('success') || session('error'))
<script>
  try {
    const bc = new BroadcastChannel('infypos_realtime_bus');
    bc.postMessage({ type: 'purchase', action: '{{ session('success') ? "approved" : "updated" }}', po_id: {{ $purchase->id }}, timestamp: Date.now() });
  } catch(e) {}
  try {
    localStorage.setItem('infypos_sync_pulse', Date.now().toString());
    localStorage.setItem('infy_purchase_sync', Date.now().toString());
    localStorage.setItem('infy_inventory_sync', Date.now().toString());
  } catch(e) {}
</script>
@endif
<script>
function filterLineItems(query) {
  const q = (query || '').toLowerCase().trim();
  const rows = document.querySelectorAll('.po-item-row');
  rows.forEach(row => {
    const text = row.innerText.toLowerCase();
    row.style.display = text.includes(q) ? '' : 'none';
  });
}
</script>
@endsection
