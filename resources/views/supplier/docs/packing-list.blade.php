<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
  <title>SHIPPING PACKING LIST — {{ $purchase->reference_code ?: ('PO-' . $purchase->id) }}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 14mm 12mm 14mm;
    }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body {
      margin: 0; padding: 0;
      background: @if(isset($isPdf) && $isPdf) #FFFFFF @else #475569 @endif;
      color: #0F172A;
      font-family: 'DejaVu Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 11px;
      line-height: 1.38;
      min-height: 100vh;
    }

    @if(!isset($isPdf) || !$isPdf)
    .top-action-bar {
      position: sticky; top: 0; left: 0; right: 0;
      background: rgba(15, 23, 42, 0.88);
      backdrop-filter: blur(8px);
      padding: 10px 24px;
      display: flex; align-items: center; justify-content: space-between;
      z-index: 1000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }
    .top-bar-title { color: #FFFFFF; font-size: 13px; font-weight: bold; }
    .top-bar-actions { display: flex; gap: 10px; }
    .btn-action {
      height: 36px; padding: 0 16px; border-radius: 999px; font-size: 12px; font-weight: bold;
      cursor: pointer; display: inline-flex; align-items: center; gap: 6px; text-decoration: none; border: 1px solid transparent;
    }
    .btn-action.primary { background: #2563EB; color: #FFFFFF; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3); }
    .btn-action.primary:hover { background: #1D4ED8; }
    .btn-action.secondary { background: #334155; color: #F8FAFC; border-color: #475569; }
    .btn-action.secondary:hover { background: #1E293B; }

    .invoice-wrapper {
      width: 794px; max-width: 95vw; min-height: 1080px;
      margin: 24px auto 40px auto;
      background: #FFFFFF; padding: 36px 42px; border-radius: 6px; box-shadow: 0 12px 35px rgba(0,0,0,0.25);
    }
    @else
    .invoice-wrapper { width: 100%; background: #FFFFFF; padding: 0; margin: 0; }
    @endif

    .header-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
    .main-title { font-size: 22px; font-weight: 900; color: #1E3A8A; letter-spacing: 0.5px; margin: 0 0 4px 0; text-transform: uppercase; }
    .title-underline { width: 140px; height: 3.5px; background: #3B82F6; border-radius: 2px; margin-bottom: 6px; }

    .meta-card { background: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 8px; padding: 10px 14px; }
    .meta-card table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
    .meta-card table td { padding: 2px 0; }

    .party-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    .party-col { width: 50%; vertical-align: top; padding-right: 12px; }
    .party-pill { background: #DBEAFE; color: #1E40AF; font-size: 9.5px; font-weight: bold; letter-spacing: 0.5px; padding: 3px 8px; border-radius: 4px; display: inline-block; margin-bottom: 6px; text-transform: uppercase; }

    .summary-grid { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    .summary-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px 12px; text-align: center; }
    .summary-box .num { font-size: 16px; font-weight: 900; color: #1E3A8A; display: block; margin-top: 2px; }

    .data-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    .data-table th { background: #1E3A8A; color: #FFFFFF; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.4px; padding: 8px 10px; border: 1px solid #1E3A8A; }
    .data-table td { padding: 9px 10px; font-size: 11px; color: #0F172A; border-bottom: 1px solid #E2E8F0; border-left: 1px solid #E2E8F0; border-right: 1px solid #E2E8F0; vertical-align: middle; }

    .bottom-table { width: 100%; border-collapse: collapse; margin-top: 20px; page-break-inside: avoid; }
    .sign-box { border-top: 1px dashed #64748B; padding-top: 8px; text-align: center; width: 45%; }

    @media print {
      body { background: #FFFFFF !important; padding: 0 !important; margin: 0 !important; }
      .top-action-bar { display: none !important; }
      .invoice-wrapper { width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; border-radius: 0 !important; }
    }
  </style>
</head>
<body>

@php
  $poCode = $purchase->reference_code ?: ('PU_' . $purchase->id);
  $packNumber = 'PL-' . date('Y-m') . '-' . str_pad($purchase->id, 4, '0', STR_PAD_LEFT);
  $asnNumber = $purchase->asn ? $purchase->asn->asn_number : ('ASN-' . date('Y') . '-' . str_pad($purchase->id, 4, '0', STR_PAD_LEFT));
  $invoiceDate = \Carbon\Carbon::parse($purchase->date)->format('d M Y');
  
  $supplier = $purchase->supplier;
  $supplierName = $supplier->name ?? 'Jeyachandran Textile Private Limited';
  $supplierAddress = '123, Industrial Estate, Ganapathy, Coimbatore - 641006, Tamil Nadu, India';

  $warehouse = $purchase->warehouse;
  $warehouseName = 'Suguna Warehouse';
  $warehouseAddress = 'Main Receiving Warehouse, Hosur - 635 126, Tamil Nadu, India';

  $totalUnits = $purchase->purchaseItems->sum('quantity');
  $totalItems = $purchase->purchaseItems->count();
  $totalWeight = round($totalUnits * 2.5, 1);
  $totalCartons = ceil($totalUnits / 50) ?: 1;
@endphp

@if(!isset($isPdf) || !$isPdf)
<div class="top-action-bar">
  <div class="top-bar-title">Shipping Packing List — <strong>{{ $packNumber }}</strong> ({{ $poCode }})</div>
  <div class="top-bar-actions">
    <a href="{{ route('supplier.invoices.packing-list', $purchase->id) }}?pdf=1&download=1" class="btn-action secondary">⬇ Download PDF</a>
    <button type="button" class="btn-action primary" onclick="window.print();">🖨️ Print Packing List</button>
  </div>
</div>
@endif

<div class="invoice-wrapper">

  <table class="header-table">
    <tr>
      <td style="vertical-align: top; width: 55%;">
        <div class="main-title">SHIPPING PACKING LIST</div>
        <div class="title-underline"></div>
        <div style="font-size: 11px; color: #475569;">Verified Cargo Manifest &amp; Container Allocation</div>
      </td>
      <td style="vertical-align: top; width: 45%;">
        <div class="meta-card">
          <table>
            <tr><td style="color:#475569; width:45%;">Packing List No.</td><td style="font-weight:bold; text-align:right;">: &nbsp;{{ $packNumber }}</td></tr>
            <tr><td style="color:#475569;">Date</td><td style="font-weight:bold; text-align:right;">: &nbsp;{{ $invoiceDate }}</td></tr>
            <tr><td style="color:#475569;">PO Reference</td><td style="font-weight:bold; text-align:right;">: &nbsp;{{ $poCode }}</td></tr>
            <tr><td style="color:#475569;">ASN Number</td><td style="font-weight:bold; text-align:right;">: &nbsp;{{ $asnNumber }}</td></tr>
            <tr><td style="color:#475569;">Carrier</td><td style="font-weight:bold; text-align:right;">: &nbsp;{{ request('trans') ?: 'Perman Logistics' }}</td></tr>
          </table>
        </div>
      </td>
    </tr>
  </table>

  <!-- Party Info -->
  <table class="party-table">
    <tr>
      <td class="party-col">
        <span class="party-pill">SHIPPER / SUPPLIER</span>
        <div style="font-size: 12px; font-weight: bold; color: #0F172A; margin-bottom: 3px;">{{ $supplierName }}</div>
        <div style="font-size: 10.5px; color: #475569; line-height: 1.4;">{{ $supplierAddress }}</div>
        <div style="font-size: 10px; color: #0F172A; font-weight: bold; margin-top: 3px;">GSTIN: 33ABCDE1234F1Z5 | Ph: +91 98765 43210</div>
      </td>
      <td class="party-col" style="border-left: 1px solid #E2E8F0; padding-left: 14px;">
        <span class="party-pill">DESTINATION WAREHOUSE</span>
        <div style="font-size: 12px; font-weight: bold; color: #0F172A; margin-bottom: 3px;">{{ $warehouseName }}</div>
        <div style="font-size: 10.5px; color: #475569; line-height: 1.4;">{{ $warehouseAddress }}</div>
        <div style="font-size: 10px; color: #1E40AF; font-weight: bold; margin-top: 3px;">Receiving Dock: Inward Bay 4</div>
      </td>
    </tr>
  </table>

  <!-- KPI Summary Banner -->
  <table class="summary-grid">
    <tr>
      <td style="width: 25%; padding: 0 4px 0 0;">
        <div class="summary-box">
          <span style="font-size: 9.5px; color: #64748B; font-weight: bold; text-transform: uppercase;">TOTAL CARTONS</span>
          <span class="num">{{ $totalCartons }} Cartons</span>
        </div>
      </td>
      <td style="width: 25%; padding: 0 4px;">
        <div class="summary-box">
          <span style="font-size: 9.5px; color: #64748B; font-weight: bold; text-transform: uppercase;">TOTAL UNITS</span>
          <span class="num">{{ $totalUnits }} Units</span>
        </div>
      </td>
      <td style="width: 25%; padding: 0 4px;">
        <div class="summary-box">
          <span style="font-size: 9.5px; color: #64748B; font-weight: bold; text-transform: uppercase;">TOTAL SKUS</span>
          <span class="num">{{ $totalItems }} Items</span>
        </div>
      </td>
      <td style="width: 25%; padding: 0 0 0 4px;">
        <div class="summary-box">
          <span style="font-size: 9.5px; color: #64748B; font-weight: bold; text-transform: uppercase;">GROSS WEIGHT</span>
          <span class="num">{{ $totalWeight }} KG</span>
        </div>
      </td>
    </tr>
  </table>

  <!-- Items Table -->
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 6%; text-align: center;">S.No.</th>
        <th style="width: 22%; text-align: left;">LPN Barcode</th>
        <th style="width: 36%; text-align: left;">Product Description</th>
        <th style="width: 16%; text-align: left;">SKU Code</th>
        <th style="width: 10%; text-align: center;">Packed Qty</th>
        <th style="width: 10%; text-align: right;">Weight (KG)</th>
      </tr>
    </thead>
    <tbody>
      @foreach($purchase->purchaseItems as $index => $item)
      @php
        $p = $item->product;
        $skuCode = $p ? ($p->code ?: '8901898053777') : '8901898053777';
        $lpn = 'LPN-2026-' . str_pad($index + 1, 4, '0', STR_PAD_LEFT);
        $wt = round($item->quantity * 2.5, 1);
      @endphp
      <tr>
        <td style="text-align: center; font-weight: bold;">{{ $index + 1 }}</td>
        <td style="font-weight: bold; color: #1E3A8A; font-size: 11.5px; letter-spacing: 0.5px;">{{ $lpn }}</td>
        <td>
          <strong style="color: #0F172A; font-size: 11.5px;">{{ $p->name ?? 'Product Item' }}</strong>
          <div style="font-size: 9.5px; color: #64748B;">Corrugated Master Carton</div>
        </td>
        <td style="font-size: 11.5px; font-weight: bold; color: #0F172A;">{{ $skuCode }}</td>
        <td style="text-align: center; font-weight: bold; font-size: 12px;">{{ $item->quantity }}</td>
        <td style="text-align: right; font-weight: bold;">{{ $wt }} KG</td>
      </tr>
      @endforeach
      <tr style="background: #F1F5F9; font-weight: bold;">
        <td colspan="4" style="text-align: right; padding: 8px;">Total Shipment Units &amp; Weight:</td>
        <td style="text-align: center; font-size: 13px; color: #1E3A8A;">{{ $totalUnits }}</td>
        <td style="text-align: right; font-size: 12px; color: #1E3A8A;">{{ $totalWeight }} KG</td>
      </tr>
    </tbody>
  </table>

  <!-- Signatures -->
  <table class="bottom-table">
    <tr>
      <td class="sign-box">
        <div style="font-weight: bold; color: #0F172A; font-size: 11px;">Prepared &amp; Packed By</div>
        <div style="margin: 28px 0 5px 0; color: #64748B; font-size: 9.5px;">Authorized Warehouse Dispatch Officer</div>
        <div style="font-size: 9px; color: #94A3B8;">{{ $supplierName }}</div>
      </td>
      <td style="width: 10%;"></td>
      <td class="sign-box">
        <div style="font-weight: bold; color: #0F172A; font-size: 11px;">Inward Receiving Verification</div>
        <div style="margin: 28px 0 5px 0; color: #64748B; font-size: 9.5px;">Received in Good Physical Condition</div>
        <div style="font-size: 9px; color: #94A3B8;">{{ $warehouseName }} Security / Dock</div>
      </td>
    </tr>
  </table>

</div>

</body>
</html>