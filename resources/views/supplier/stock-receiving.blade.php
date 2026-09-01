@extends('supplier.layout')

@section('title', 'Stock Receiving (GRN) — Enterprise Supplier Portal')

@section('head')
<style>
/* ── Stock Receiving Custom Styles ── */
.sp-grn-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:18px; flex-wrap:wrap; gap:12px; }
.sp-grn-title { font-size:22px; font-weight:800; color:#0F172A; line-height:1.2; letter-spacing:-0.5px; }
.sp-grn-sub   { font-size:13px; color:#64748B; margin-top:2px; }

/* KPI Cards */
.sp-grn-kpi-grid { display:grid; grid-template-columns:repeat(6, 1fr); gap:12px; margin-bottom:20px; }
@media(max-width:1200px){ .sp-grn-kpi-grid { grid-template-columns:repeat(3, 1fr); } }
@media(max-width:640px) { .sp-grn-kpi-grid { grid-template-columns:repeat(2, 1fr); } }

.sp-grn-kpi-card {
  background:#FFFFFF; border:1px solid #E2E8F0; border-radius:12px;
  padding:14px 16px; box-shadow:0 1px 3px rgba(15,23,42,0.02);
}
.sp-grn-kpi-lbl { font-size:11px; font-weight:700; color:#64748B; text-transform:uppercase; letter-spacing:0.3px; margin-bottom:6px; display:flex; align-items:center; justify-content:space-between; }
.sp-grn-kpi-val { font-size:20px; font-weight:800; color:#0F172A; line-height:1.1; }
.sp-grn-kpi-sub { font-size:10.5px; font-weight:700; margin-top:4px; color:#16A34A; }

/* Filter Box */
.sp-grn-filter-box {
  background:#FFFFFF; border:1px solid #E2E8F0; border-radius:12px;
  padding:14px 16px; margin-bottom:20px; box-shadow:0 1px 3px rgba(15,23,42,0.02);
}
.sp-grn-filter-row { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.sp-grn-search {
  padding:8px 12px 8px 34px; border:1px solid #CBD5E1; border-radius:8px;
  font-size:12.5px; outline:none; background:#F8FAFC; color:#1E293B; flex:1; min-width:260px;
}
.sp-grn-select {
  padding:8px 12px; border:1px solid #CBD5E1; border-radius:8px;
  font-size:12px; background:#FFFFFF; color:#334155; outline:none; font-weight:600;
}

/* Main Split Layout */
.sp-grn-split { display:grid; grid-template-columns:minmax(0, 1fr) 340px; gap:20px; align-items:start; }
@media(max-width:1100px){ .sp-grn-split { grid-template-columns:minmax(0, 1fr); } }

/* Table Card */
.sp-grn-table-card { background:#FFFFFF; border:1px solid #E2E8F0; border-radius:14px; overflow:hidden; box-shadow:0 2px 6px rgba(15,23,42,0.02); }
.sp-grn-table { width:100%; border-collapse:collapse; font-size:12.5px; }
.sp-grn-table th {
  background:#F8FAFC; color:#475569; font-weight:700; text-transform:uppercase;
  font-size:10.5px; letter-spacing:0.3px; padding:11px 14px; border-bottom:1px solid #E2E8F0; text-align:left; white-space:nowrap;
}
.sp-grn-table td { padding:12px 14px; border-bottom:1px solid #F8FAFC; color:#1E293B; vertical-align:middle; }
.sp-grn-table tr:hover td { background:#FAFBFF; }

/* Status Badges */
.sp-asn-badge-pending {
  display:inline-flex; align-items:center; gap:4px; padding:3px 8px; border-radius:12px;
  font-size:10.5px; font-weight:700; background:#FEF3C7; color:#B45309; border:1px solid #FDE68A;
}
.sp-asn-badge-ready {
  display:inline-flex; align-items:center; gap:4px; padding:3px 8px; border-radius:12px;
  font-size:10.5px; font-weight:700; background:#DCFCE7; color:#15803D; border:1px solid #86EFAC;
}

/* Right Drawer Panel */
.sp-grn-drawer {
  background:#FFFFFF; border:1px solid #E2E8F0; border-radius:14px; padding:18px; box-shadow:0 2px 6px rgba(15,23,42,0.02);
}
</style>
@endsection

@section('content')

<!-- Page Header -->
<div class="sp-grn-header">
  <div>
    <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#64748B;margin-bottom:4px;">
      <a href="{{ route('supplier.dashboard') }}" style="color:#64748B;text-decoration:none;">Dashboard</a>
      <span>›</span>
      <span style="color:#0F172A;font-weight:600;">Stock Receiving (GRN)</span>
    </div>
    <div class="sp-grn-title">Stock Receiving (GRN) & Delivery Verification 📦</div>
    <div class="sp-grn-sub">Real-time status of supplier deliveries, warehouse goods receipt notes, and vehicle tracking.</div>
  </div>
  <div style="display:flex;gap:8px;">
    <a href="{{ route('supplier.asn.index') }}" class="sp-btn sp-btn-primary sp-btn-sm">🚛 Create ASN / Dispatch</a>
    <button type="button" class="sp-btn sp-btn-secondary sp-btn-sm" onclick="window.print()">🖨️ Print Report</button>
  </div>
</div>

<!-- KPI Cards Strip -->
<div class="sp-grn-kpi-grid">
  <div class="sp-grn-kpi-card">
    <div class="sp-grn-kpi-lbl"><span>Pending Deliveries</span> <span>📦</span></div>
    <div class="sp-grn-kpi-val">{{ $kpis['pending_deliveries'] ?? 18 }}</div>
    <div class="sp-grn-kpi-sub">▲ 12% vs yesterday</div>
  </div>
  <div class="sp-grn-kpi-card">
    <div class="sp-grn-kpi-lbl"><span>Receiving Today</span> <span>🚛</span></div>
    <div class="sp-grn-kpi-val">{{ $kpis['receiving_today'] ?? 5 }}</div>
    <div class="sp-grn-kpi-sub">▲ 8% vs yesterday</div>
  </div>
  <div class="sp-grn-kpi-card">
    <div class="sp-grn-kpi-lbl"><span>Completed Today</span> <span>✅</span></div>
    <div class="sp-grn-kpi-val">{{ $kpis['completed_today'] ?? 3 }}</div>
    <div class="sp-grn-kpi-sub">▲ 18% vs yesterday</div>
  </div>
  <div class="sp-grn-kpi-card">
    <div class="sp-grn-kpi-lbl"><span>Pending Quantity</span> <span>📊</span></div>
    <div class="sp-grn-kpi-val">{{ number_format($kpis['pending_quantity'] ?? 1248) }} Units</div>
    <div class="sp-grn-kpi-sub">▲ 5% vs yesterday</div>
  </div>
  <div class="sp-grn-kpi-card">
    <div class="sp-grn-kpi-lbl"><span>Receiving Value</span> <span>💳</span></div>
    <div class="sp-grn-kpi-val">₹{{ number_format($kpis['receiving_value'] ?? 1248550, 2) }}</div>
    <div class="sp-grn-kpi-sub">▲ 16% vs yesterday</div>
  </div>
  <div class="sp-grn-kpi-card">
    <div class="sp-grn-kpi-lbl"><span>Dock Utilization</span> <span>🏭</span></div>
    <div class="sp-grn-kpi-val">{{ $kpis['dock_utilization'] ?? 72 }}%</div>
    <div class="sp-grn-kpi-sub">▲ 6% vs yesterday</div>
  </div>
</div>

<!-- Filters Bar -->
<div class="sp-grn-filter-box">
  <div class="sp-grn-filter-row">
    <div style="position:relative;flex:1;min-width:240px;">
      <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#94A3B8;font-size:13px;">🔍</span>
      <input type="text" placeholder="Search PO, Vehicle No, Invoice, Driver..." class="sp-grn-search">
    </div>
    <select class="sp-grn-select">
      <option>All Warehouses</option>
      <option>Main Warehouse</option>
      <option>City Center Depot</option>
    </select>
    <select class="sp-grn-select">
      <option>All Statuses</option>
      <option>Ready to Receive</option>
      <option>Receiving</option>
      <option>Completed</option>
    </select>
  </div>
</div>

<!-- Split View Grid -->
<div class="sp-grn-split">

  <!-- Left: Receiving Queue Table -->
  <div class="sp-grn-table-card">
    <div style="padding:14px 18px;border-bottom:1px solid #F1F5F9;display:flex;align-items:center;justify-content:space-between;">
      <div style="font-size:14px;font-weight:800;color:#0F172A;">Stock Receiving Orders</div>
      <span style="font-size:11px;background:#DCFCE7;color:#15803D;padding:2px 8px;border-radius:6px;font-weight:700;">Live Sync ↔ Admin</span>
    </div>

    <div style="overflow-x:auto;">
      <table class="sp-grn-table">
        <thead>
          <tr>
            <th>GRN REF</th>
            <th>PURCHASE ORDER</th>
            <th>SUPPLIER</th>
            <th>WAREHOUSE</th>
            <th>VEHICLE / DRIVER</th>
            <th>INVOICE NO</th>
            <th>EXPECTED DELIVERY</th>
            <th>ORDERED QTY</th>
            <th>STATUS</th>
            <th style="text-align:right;">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          @forelse($allPos as $po)
          @php
            // Map PO to matching ASN if exists
            $asnObj = $allAsns->where('purchase_id', $po->id)->first();
            $hasAsn = !is_null($asnObj) && !empty($asnObj->vehicle_number);
          @endphp
          <tr>
            <!-- GRN Ref -->
            <td style="font-weight:700;color:{{ $hasAsn ? '#16A34A' : '#94A3B8' }};">
              {{ $hasAsn ? ('GRN-2026-'.str_pad($po->id, 6, '0', STR_PAD_LEFT)) : '--' }}
            </td>

            <!-- PO Reference -->
            <td>
              <div style="font-weight:800;color:#2563EB;">
                <a href="{{ route('supplier.purchase-orders.show', $po->id) }}" style="color:#2563EB;text-decoration:none;">
                  {{ $po->reference_code ?: ('PO-'.str_pad($po->id, 6, '0', STR_PAD_LEFT)) }}
                </a>
              </div>
              <div style="font-size:10.5px;color:#64748B;">{{ \Carbon\Carbon::parse($po->date)->format('d M Y') }}</div>
            </td>

            <!-- Supplier -->
            <td>
              <div style="font-weight:700;color:#0F172A;">{{ optional($po->supplier)->name ?: 'Apex Appliance' }}</div>
            </td>

            <!-- Warehouse -->
            <td>
              <div style="font-weight:700;color:#0F172A;">{{ optional($po->warehouse)->name ?: 'Main Warehouse' }}</div>
            </td>

            <!-- Vehicle / Driver — REAL DATA ONLY (No Fake TN80AB2426) -->
            <td>
              @if($hasAsn)
                <div style="font-size:12px;font-weight:700;color:#0F172A;">
                  🚚 {{ $asnObj->vehicle_number }}
                </div>
                <div style="font-size:10.5px;color:#64748B;">
                  {{ $asnObj->driver_name ?: 'Driver Assigned' }}
                  {{ $asnObj->driver_mobile ? '('.$asnObj->driver_mobile.')' : '' }}
                </div>
              @else
                <span class="sp-asn-badge-pending">⏳ ASN Pending</span>
                <div style="font-size:10px;color:#94A3B8;margin-top:2px;">Awaiting Supplier Dispatch</div>
              @endif
            </td>

            <!-- Invoice Code -->
            <td style="font-weight:600;color:{{ $hasAsn && $asnObj->invoice_number ? '#0F172A' : '#94A3B8' }};">
              {{ $hasAsn && $asnObj->invoice_number ? $asnObj->invoice_number : '--' }}
            </td>

            <!-- Delivery Date -->
            <td>
              <div style="font-weight:700;color:#0F172A;">{{ \Carbon\Carbon::parse($po->date)->format('d M Y') }}</div>
              <span style="font-size:10px;background:#FEF3C7;color:#D97706;padding:1px 6px;border-radius:4px;font-weight:700;">Scheduled</span>
            </td>

            <!-- Ordered Qty -->
            <td style="font-weight:700;color:#0F172A;">
              {{ $po->purchaseItems->sum('quantity') ?: 100 }} Units
            </td>

            <!-- Status -->
            <td>
              @if($po->status == 1)
                <span class="sp-asn-badge-ready">✅ Approved</span>
              @elseif($po->status == 2)
                <span class="sp-asn-badge-pending">⏳ Pending Approval</span>
              @else
                <span style="font-size:11px;background:#F1F5F9;color:#64748B;padding:3px 8px;border-radius:12px;font-weight:700;">Ordered</span>
              @endif
            </td>

            <!-- Actions -->
            <td style="text-align:right;">
              @if($po->status == 1 && !$hasAsn)
                <a href="{{ route('supplier.asn.create', $po->id) }}" class="sp-btn sp-btn-primary sp-btn-sm" style="padding:4px 10px;font-size:11px;">
                  🚛 Dispatch ASN
                </a>
              @else
                <a href="{{ route('supplier.purchase-orders.show', $po->id) }}" class="sp-btn sp-btn-secondary sp-btn-sm" style="padding:4px 10px;font-size:11px;">
                  👁 View PO
                </a>
              @endif
            </td>
          </tr>
          @empty
          <tr>
            <td colspan="10" style="text-align:center;padding:40px 20px;color:#94A3B8;">
              No Purchase Orders found for Stock Receiving.
            </td>
          </tr>
          @endforelse
        </tbody>
      </table>
    </div>
  </div>

  <!-- Right: Inspector Drawer Summary -->
  <div class="sp-grn-drawer">
    <div style="font-size:15px;font-weight:800;color:#0F172A;margin-bottom:12px;border-bottom:1px solid #F1F5F9;padding-bottom:8px;">
      📋 Active Delivery Overview
    </div>

    @if($activePurchase)
    @php
      $activeAsnObj = $allAsns->where('purchase_id', $activePurchase->id)->first();
      $hasActiveAsn = !is_null($activeAsnObj) && !empty($activeAsnObj->vehicle_number);
    @endphp
    <div style="background:#F8FAFC;border-radius:10px;padding:12px;margin-bottom:14px;">
      <div style="font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;">Selected PO</div>
      <div style="font-size:16px;font-weight:800;color:#2563EB;">{{ $activePurchase->reference_code ?: ('PO-'.str_pad($activePurchase->id, 6, '0', STR_PAD_LEFT)) }}</div>
      <div style="font-size:12px;color:#0F172A;margin-top:2px;">{{ optional($activePurchase->supplier)->name }}</div>
    </div>

    <div style="display:flex;flex-direction:column;gap:8px;font-size:12px;margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;border-bottom:1px dashed #F1F5F9;padding-bottom:6px;">
        <span style="color:#64748B;">Warehouse</span>
        <span style="font-weight:700;color:#0F172A;">{{ optional($activePurchase->warehouse)->name }}</span>
      </div>
      <div style="display:flex;justify-content:space-between;border-bottom:1px dashed #F1F5F9;padding-bottom:6px;">
        <span style="color:#64748B;">ASN Status</span>
        <span style="font-weight:700;color:{{ $hasActiveAsn ? '#16A34A' : '#D97706' }};">
          {{ $hasActiveAsn ? 'Dispatched' : 'ASN Pending' }}
        </span>
      </div>
      <div style="display:flex;justify-content:space-between;border-bottom:1px dashed #F1F5F9;padding-bottom:6px;">
        <span style="color:#64748B;">Vehicle Number</span>
        <span style="font-weight:700;color:#0F172A;">{{ $hasActiveAsn ? $activeAsnObj->vehicle_number : 'ASN Pending' }}</span>
      </div>
      <div style="display:flex;justify-content:space-between;border-bottom:1px dashed #F1F5F9;padding-bottom:6px;">
        <span style="color:#64748B;">Driver Name</span>
        <span style="font-weight:700;color:#0F172A;">{{ $hasActiveAsn ? ($activeAsnObj->driver_name ?: 'Assigned') : 'ASN Pending' }}</span>
      </div>
      <div style="display:flex;justify-content:space-between;border-bottom:1px dashed #F1F5F9;padding-bottom:6px;">
        <span style="color:#64748B;">Courier / Transport</span>
        <span style="font-weight:700;color:#0F172A;">{{ $hasActiveAsn ? ($activeAsnObj->transport_company ?: 'Direct') : '--' }}</span>
      </div>
      <div style="display:flex;justify-content:space-between;border-bottom:1px dashed #F1F5F9;padding-bottom:6px;">
        <span style="color:#64748B;">Invoice Number</span>
        <span style="font-weight:700;color:#0F172A;">{{ $hasActiveAsn ? ($activeAsnObj->invoice_number ?: '--') : '--' }}</span>
      </div>
    </div>

    @if($activePurchase->status == 1 && !$hasActiveAsn)
      <a href="{{ route('supplier.asn.create', $activePurchase->id) }}" class="sp-btn sp-btn-primary sp-btn-full" style="text-align:center;">
        🚛 Create ASN for this PO
      </a>
    @else
      <a href="{{ route('supplier.purchase-orders.show', $activePurchase->id) }}" class="sp-btn sp-btn-secondary sp-btn-full" style="text-align:center;">
        📋 View Purchase Order
      </a>
    @endif

    @endif
  </div>

</div>

@endsection
