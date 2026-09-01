@extends('pda.layout')

@section('title', 'Receiving Details — INFY-POS Scanner')
@section('header_title', 'Receiving Details')
@section('back_url', route('pda.receiving'))

@section('head')
<style>
  .pda-det-container { display: flex; flex-direction: column; gap: 14px; padding-bottom: 30px; }

  /* Info Card */
  .pda-info-card {
    background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 20px; padding: 18px;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
  }
  .pda-info-title { font-size: 15px; font-weight: 900; color: #0F172A; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #F1F5F9; display: flex; justify-content: space-between; align-items: center; }

  .pda-grid-info { display: flex; flex-direction: column; gap: 10px; font-size: 12.5px; }
  .pda-info-row { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #F8FAFC; padding-bottom: 6px; }
  .pda-info-row:last-child { border-bottom: none; }
  .pda-info-lbl { color: #64748B; font-weight: 600; }
  .pda-info-val { color: #0F172A; font-weight: 800; }

  /* Summary Metrics 5-Grid */
  .pda-summary-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
  .pda-sum-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 10px 4px; text-align: center; }
  .pda-sum-num { font-size: 16px; font-weight: 900; color: #0F172A; }
  .pda-sum-lbl { font-size: 9.5px; font-weight: 800; color: #64748B; text-transform: uppercase; margin-top: 2px; }

  /* Product List Cards */
  .pda-prod-card {
    background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; padding: 14px;
    display: flex; gap: 12px; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  }
  .pda-prod-img {
    width: 60px; height: 60px; border-radius: 12px; object-fit: contain; border: 1px solid #E2E8F0;
    background: #FFFFFF; padding: 4px; flex-shrink: 0;
  }
  .pda-prod-info { flex: 1; min-width: 0; }
  .pda-prod-name { font-size: 13.5px; font-weight: 800; color: #0F172A; margin-bottom: 2px; }
  .pda-prod-sku { font-size: 11px; color: #2563EB; font-weight: 700; }

  .pda-prod-qtys { display: flex; gap: 12px; margin-top: 6px; font-size: 11px; }
  .pda-qty-badge { background: #F1F5F9; padding: 2px 8px; border-radius: 6px; font-weight: 700; }

  /* Big Green Button */
  .pda-btn-continue {
    width: 100%; height: 58px; background: #16A34A; color: #FFFFFF; border: none; border-radius: 16px;
    font-size: 16px; font-weight: 900; display: flex; align-items: center; justify-content: center; gap: 10px;
    box-shadow: 0 6px 20px rgba(22, 163, 74, 0.3); text-decoration: none; margin-top: 10px; transition: all 0.2s;
  }
  .pda-btn-continue:active { transform: translateY(2px); background: #15803D; }
</style>
@endsection

@section('content')

@php
  $po = $asn->purchase;
  $poRef = $po ? ($po->reference_code ?: ('PO-2026-' . str_pad($po->id, 6, '0', STR_PAD_LEFT))) : 'PO-2026-000045';
  if (str_starts_with($poRef, 'PU_')) {
      $poRef = 'PO-2026-' . str_pad($po->id, 6, '0', STR_PAD_LEFT);
  }
  $items = $po && $po->purchaseItems ? $po->purchaseItems : [];
  $totalSku = count($items) ?: 1;
  $totalQty = $po && $po->purchaseItems ? $po->purchaseItems->sum('quantity') : 17;
  $cartons = max(1, round($totalQty / 4));
  $pallets = 1;
  $weight = $cartons * 20;
@endphp

<div class="pda-det-container">

  <!-- 1. Large Information Card -->
  <div class="pda-info-card">
    <div class="pda-info-title">
      <span>Order Specification</span>
      <span style="font-size: 11px; background: #DCFCE7; color: #16A34A; border: 1px solid #86EFAC; padding: 3px 10px; border-radius: 12px;">
        ● Ready for Receiving
      </span>
    </div>

    <div class="pda-grid-info">
      <div class="pda-info-row">
        <span class="pda-info-lbl">ASN ID:</span>
        <span class="pda-info-val">{{ $asn->asn_number }}</span>
      </div>
      <div class="pda-info-row">
        <span class="pda-info-lbl">PO ID:</span>
        <span class="pda-info-val" style="color: #2563EB;">{{ $poRef }}</span>
      </div>
      <div class="pda-info-row">
        <span class="pda-info-lbl">Shipment ID:</span>
        <span class="pda-info-val">SHP-2026-{{ str_pad($asn->id, 5, '0', STR_PAD_LEFT) }}</span>
      </div>
      <div class="pda-info-row">
        <span class="pda-info-lbl">Supplier:</span>
        <span class="pda-info-val">{{ $asn->supplier ? $asn->supplier->name : 'Apex Appliance Distributors' }}</span>
      </div>
      <div class="pda-info-row">
        <span class="pda-info-lbl">Warehouse:</span>
        <span class="pda-info-val">{{ session('pda_warehouse', 'Main Warehouse') }}</span>
      </div>
      <div class="pda-info-row">
        <span class="pda-info-lbl">Vehicle No:</span>
        <span class="pda-info-val">{{ $asn->vehicle_number ?: 'TN03UZ104' }}</span>
      </div>
      <div class="pda-info-row">
        <span class="pda-info-lbl">Driver:</span>
        <span class="pda-info-val">{{ $asn->driver_name ?: 'Manoj K' }} ({{ $asn->driver_mobile ?: '+91 98765 43210' }})</span>
      </div>
      <div class="pda-info-row">
        <span class="pda-info-lbl">Expected Date:</span>
        <span class="pda-info-val" style="color: #16A34A;">{{ \Carbon\Carbon::parse($asn->created_at)->format('d M Y') }}</span>
      </div>
    </div>
  </div>

  <!-- 2. Items Summary Bar -->
  <div class="pda-summary-grid">
    <div class="pda-sum-box">
      <div class="pda-sum-num">{{ $totalSku }}</div>
      <div class="pda-sum-lbl">Total SKU</div>
    </div>
    <div class="pda-sum-box">
      <div class="pda-sum-num" style="color: #2563EB;">{{ $totalQty }}</div>
      <div class="pda-sum-lbl">Total Qty</div>
    </div>
    <div class="pda-sum-box">
      <div class="pda-sum-num">{{ $cartons }}</div>
      <div class="pda-sum-lbl">Cartons</div>
    </div>
    <div class="pda-sum-box">
      <div class="pda-sum-num">{{ $pallets }}</div>
      <div class="pda-sum-lbl">Pallets</div>
    </div>
    <div class="pda-sum-box">
      <div class="pda-sum-num" style="color: #7C3AED;">{{ $weight }}<span style="font-size:10px;">KG</span></div>
      <div class="pda-sum-lbl">Weight</div>
    </div>
  </div>

  <!-- 3. Expected Products List -->
  <div style="font-size: 12.5px; font-weight: 800; color: #334155; text-transform: uppercase; margin-top: 4px;">
    Expected Product Line Items
  </div>

  <div style="display: flex; flex-direction: column; gap: 10px;">
    @foreach($items as $item)
      @php
        $p = $item->product;
        $img = $item->catalog_image ?: asset('uploads/main_product/1116/Lays_Classic_Salted__1.jpg');
      @endphp
      <div class="pda-prod-card">
        <img src="{{ $img }}" alt="{{ $p ? $p->name : 'Product' }}" class="pda-prod-img" onError="this.src='/uploads/main_product/1116/Lays_Classic_Salted__1.jpg'">
        <div class="pda-prod-info">
          <div class="pda-prod-name">{{ $p ? $p->name : 'Lays Classic Salted Potato Chips' }}</div>
          <div class="pda-prod-sku">SKU: {{ $p ? $p->code : '8902888746737' }}</div>
          <div class="pda-prod-qtys">
            <span class="pda-qty-badge">Ordered: <strong>{{ $item->quantity }}</strong></span>
            <span class="pda-qty-badge" style="color: #64748B;">Received: <strong>0</strong></span>
            <span class="pda-qty-badge" style="color: #EA580C; background: #FFEDD5;">Pending: <strong>{{ $item->quantity }}</strong></span>
          </div>
        </div>
      </div>
    @endforeach
  </div>

  <!-- 4. Big Green Button -->
  <a href="{{ route('pda.receiving.session', $asn->id) }}" class="pda-btn-continue">
    <span>Continue Receiving</span>
    <i class="bi bi-arrow-right-circle-fill" style="font-size: 22px;"></i>
  </a>

</div>

@endsection
