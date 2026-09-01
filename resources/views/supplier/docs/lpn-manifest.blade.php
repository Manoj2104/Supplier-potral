<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
  <title>LPN WAREHOUSE MANIFEST — {{ $purchase->reference_code ?: ('PO-' . $purchase->id) }}</title>
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
    .btn-action.primary { background: #0D9488; color: #FFFFFF; box-shadow: 0 2px 8px rgba(13, 148, 136, 0.3); }
    .btn-action.primary:hover { background: #0F766E; }
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
    .main-title { font-size: 22px; font-weight: 900; color: #115E59; letter-spacing: 0.5px; margin: 0 0 4px 0; text-transform: uppercase; }
    .title-underline { width: 150px; height: 3.5px; background: #0D9488; border-radius: 2px; margin-bottom: 6px; }

    .meta-card { background: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 8px; padding: 10px 14px; }
    .meta-card table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
    .meta-card table td { padding: 2px 0; }

    .dock-instructions { background: #F0FDFA; border: 1.5px solid #99F6E4; border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; font-size: 10.5px; color: #115E59; line-height: 1.45; }

    .data-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    .data-table th { background: #115E59; color: #FFFFFF; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.4px; padding: 8px 10px; border: 1px solid #115E59; }
    .data-table td { padding: 9px 10px; font-size: 11px; color: #0F172A; border-bottom: 1px solid #E2E8F0; border-left: 1px solid #E2E8F0; border-right: 1px solid #E2E8F0; vertical-align: middle; }

    .bottom-table { width: 100%; border-collapse: collapse; margin-top: 18px; page-break-inside: avoid; }
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
  $mnfNumber = request('inv') ? ('MNF-' . request('inv')) : ('MNF-' . date('Y-m') . '-' . str_pad($purchase->id, 4, '0', STR_PAD_LEFT));
  $asnNumber = $purchase->asn ? $purchase->asn->asn_number : ('ASN-' . date('Y') . '-' . str_pad($purchase->id, 4, '0', STR_PAD_LEFT));
  $invoiceDate = \Carbon\Carbon::parse($purchase->date)->format('d M Y');
  
  $supplier = $purchase->supplier;
  $supplierName = $supplier->name ?? 'Jeyachandran Textile Private Limited';

  $warehouse = $purchase->warehouse;
  $warehouseName = 'Suguna Warehouse';
  $warehouseAddress = 'Main Receiving Warehouse, Hosur - 635 126, Tamil Nadu, India';

  $totalUnits = $purchase->purchaseItems->sum('quantity');
  $totalItems = $purchase->purchaseItems->count();
  $totalCartons = ceil($totalUnits / 50) ?: 1;
@endphp

@if(!isset($isPdf) || !$isPdf)
<div class="top-action-bar">
  <div class="top-bar-title">LPN Warehouse Manifest — <strong>{{ $mnfNumber }}</strong> ({{ $poCode }})</div>
  <div class="top-bar-actions">
    <a href="{{ route('supplier.invoices.lpn-manifest', $purchase->id) }}?pdf=1&download=1" class="btn-action secondary">⬇ Download PDF</a>
    <button type="button" class="btn-action primary" onclick="window.print();">🖨️ Print Manifest</button>
  </div>
</div>
@endif

<div class="invoice-wrapper">

  <table class="header-table">
    <tr>
      <td style="vertical-align: top; width: 55%;">
        <div class="main-title">LPN WAREHOUSE MANIFEST</div>
        <div class="title-underline"></div>
        <div style="font-size: 11px; color: #475569;">Fast Inward Dock Barcode Directory &amp; Cargo Breakdown</div>
      </td>
      <td style="vertical-align: top; width: 45%;">
        <div class="meta-card">
          <table>
            <tr><td style="color:#475569; width:45%;">Manifest ID</td><td style="font-weight:bold; text-align:right;">: &nbsp;{{ $mnfNumber }}</td></tr>
            <tr><td style="color:#475569;">Date</td><td style="font-weight:bold; text-align:right;">: &nbsp;{{ $invoiceDate }}</td></tr>
            <tr><td style="color:#475569;">PO Number</td><td style="font-weight:bold; text-align:right;">: &nbsp;{{ $poCode }}</td></tr>
            <tr><td style="color:#475569;">ASN Number</td><td style="font-weight:bold; text-align:right;">: &nbsp;{{ $asnNumber }}</td></tr>
            <tr><td style="color:#475569;">Destination</td><td style="font-weight:bold; text-align:right;">: &nbsp;{{ $warehouseName }}</td></tr>
          </table>
        </div>
      </td>
    </tr>
  </table>

  <!-- Fast Inward Dock Scanning Instructions -->
  <div class="dock-instructions">
    <strong>Warehouse Inward Instructions:</strong> Scan each carton LPN barcode using the Warehouse PDA scanner. The scanner will instantly match the carton against ASN <strong>{{ $asnNumber }}</strong>, verify SKU contents without opening the master carton, and automatically post the GRN (Goods Receipt Note).
  </div>

  <!-- Barcode Directory Table -->
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 6%; text-align: center;">No.</th>
        <th style="width: 24%; text-align: left;">LPN Barcode</th>
        <th style="width: 16%; text-align: left;">Package Type</th>
        <th style="width: 32%; text-align: left;">Enclosed SKU &amp; Item</th>
        <th style="width: 10%; text-align: center;">Pack Qty</th>
        <th style="width: 12%; text-align: center;">Dock Scan Check</th>
      </tr>
    </thead>
    <tbody>
      @foreach($purchase->purchaseItems as $index => $item)
      @php
        $p = $item->product;
        $skuCode = $p ? ($p->code ?: '8901898053777') : '8901898053777';
        $lpn = 'LPN-2026-' . str_pad($index + 1, 4, '0', STR_PAD_LEFT);
      @endphp
      <tr>
        <td style="text-align: center; font-weight: bold;">{{ $index + 1 }}</td>
        <td style="font-weight: bold; color: #115E59; font-size: 11.5px; letter-spacing: 0.5px;">
          {{ $lpn }}
          <div style="font-size: 8.5px; color: #64748B; font-weight: normal;">*{{ $lpn }}*</div>
        </td>
        <td>Master Box (CTN-{{ $index + 1 }})</td>
        <td>
          <strong style="color: #0F172A; font-size: 11.5px;">{{ $p->name ?? 'Product Item' }}</strong>
          <div style="font-size: 10.5px; font-weight: bold; color: #475569;">SKU: {{ $skuCode }}</div>
        </td>
        <td style="text-align: center; font-weight: bold; font-size: 12px; color: #115E59;">{{ $item->quantity }}</td>
        <td style="text-align: center; font-size: 11px; color: #64748B;">[ &nbsp;&nbsp;&nbsp;&nbsp; ] Verified</td>
      </tr>
      @endforeach
      <tr style="background: #F0FDFA; font-weight: bold;">
        <td colspan="4" style="text-align: right; padding: 8px;">Total Inward Units to Receive:</td>
        <td style="text-align: center; font-size: 13px; color: #115E59;">{{ $totalUnits }}</td>
        <td style="text-align: center; color: #115E59;">{{ $totalCartons }} Cartons Total</td>
      </tr>
    </tbody>
  </table>

  <!-- Warehouse Handover Signatures -->
  <table class="bottom-table">
    <tr>
      <td class="sign-box">
        <div style="font-weight: bold; color: #0F172A; font-size: 11px;">Shipped By (Supplier Dispatch)</div>
        <div style="margin: 24px 0 3px 0; color: #64748B; font-size: 9px;">Authorized Packaging Supervisor</div>
        <div style="font-size: 8.5px; color: #94A3B8;">{{ $supplierName }}</div>
      </td>
      <td style="width: 10%;"></td>
      <td class="sign-box">
        <div style="font-weight: bold; color: #0F172A; font-size: 11px;">Received By (Warehouse Inward)</div>
        <div style="margin: 24px 0 3px 0; color: #64748B; font-size: 9px;">Dock Scanner Verification Officer</div>
        <div style="font-size: 8.5px; color: #94A3B8;">{{ $warehouseName }} Inbound Team</div>
      </td>
    </tr>
  </table>

</div>

</body>
</html>