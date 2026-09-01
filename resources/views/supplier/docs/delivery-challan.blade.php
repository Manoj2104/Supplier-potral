<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
  <title>DELIVERY CHALLAN — {{ $purchase->reference_code ?: ('PO-' . $purchase->id) }}</title>
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
    .btn-action.primary { background: #7C3AED; color: #FFFFFF; box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3); }
    .btn-action.primary:hover { background: #6D28D9; }
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
    .main-title { font-size: 22px; font-weight: 900; color: #581C87; letter-spacing: 0.5px; margin: 0 0 4px 0; text-transform: uppercase; }
    .title-underline { width: 150px; height: 3.5px; background: #9333EA; border-radius: 2px; margin-bottom: 6px; }

    .meta-card { background: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 8px; padding: 10px 14px; }
    .meta-card table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
    .meta-card table td { padding: 2px 0; }

    .party-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
    .party-col { width: 33.33%; vertical-align: top; padding: 0 10px 0 0; }
    .party-pill { background: #F3E8FF; color: #7E22CE; font-size: 9.5px; font-weight: bold; letter-spacing: 0.5px; padding: 3px 8px; border-radius: 4px; display: inline-block; margin-bottom: 6px; text-transform: uppercase; }

    .trans-box { background: #FAF5FF; border: 1.5px solid #E9D5FF; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; }

    .data-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    .data-table th { background: #581C87; color: #FFFFFF; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.4px; padding: 8px 10px; border: 1px solid #581C87; }
    .data-table td { padding: 9px 10px; font-size: 11px; color: #0F172A; border-bottom: 1px solid #E2E8F0; border-left: 1px solid #E2E8F0; border-right: 1px solid #E2E8F0; vertical-align: middle; }

    .bottom-table { width: 100%; border-collapse: collapse; margin-top: 18px; page-break-inside: avoid; }
    .sign-box { border-top: 1px dashed #64748B; padding-top: 8px; text-align: center; width: 30%; }

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
  $dcNumber = request('inv') ? ('DC-' . request('inv')) : ('DC-' . date('Y-m') . '-' . str_pad($purchase->id, 4, '0', STR_PAD_LEFT));
  $invoiceDate = request('dispatch_date') ? \Carbon\Carbon::parse(request('dispatch_date'))->format('d M Y') : \Carbon\Carbon::parse($purchase->date)->format('d M Y');
  $transCompany = request('trans') ?: ($purchase->asn ? $purchase->asn->transport_company : '{{ $transCompany }}');
  $vehNumber = request('veh') ?: ($purchase->asn ? $purchase->asn->vehicle_number : '{{ $vehNumber }}');
  $lrNumber = request('lr') ?: ($purchase->asn ? $purchase->asn->lr_number : '{{ $lrNumber }}');
  $driverName = request('drv') ?: ($purchase->asn ? $purchase->asn->driver_name : 'Manoj K');
  $driverMobile = request('mob') ?: ($purchase->asn ? $purchase->asn->driver_mobile : '+91 98765 00000');
  
  $supplier = $purchase->supplier;
  $supplierName = $supplier->name ?? 'Jeyachandran Textile Private Limited';
  $supplierAddress = '123, Industrial Estate, Ganapathy, Coimbatore - 641006, Tamil Nadu, India';

  $warehouse = $purchase->warehouse;
  $warehouseName = 'Suguna Warehouse';
  $warehouseAddress = 'Main Receiving Warehouse, Hosur - 635 126, Tamil Nadu, India';

  $totalUnits = $purchase->purchaseItems->sum('quantity');
  $totalValue = 0;
  foreach($purchase->purchaseItems as $it) {
      $unitCost = (float)($it->net_unit_cost ?? $it->product_cost ?? ($it->product->product_cost ?? 15.0));
      $totalValue += ($unitCost * (float)$it->quantity);
  }
@endphp

@if(!isset($isPdf) || !$isPdf)
<div class="top-action-bar">
  <div class="top-bar-title">Delivery Challan &amp; Gate Pass — <strong>{{ $dcNumber }}</strong> ({{ $poCode }})</div>
  <div class="top-bar-actions">
    <a href="{{ route('supplier.invoices.delivery-challan', $purchase->id) }}?pdf=1&download=1" class="btn-action secondary">⬇ Download PDF</a>
    <button type="button" class="btn-action primary" onclick="window.print();">🖨️ Print Challan</button>
  </div>
</div>
@endif

<div class="invoice-wrapper">

  <table class="header-table">
    <tr>
      <td style="vertical-align: top; width: 55%;">
        <div class="main-title">DELIVERY CHALLAN &amp; GATE PASS</div>
        <div class="title-underline"></div>
        <div style="font-size: 11px; color: #475569;">Issued under Rule 55 of GST Rules for Transportation of Goods</div>
      </td>
      <td style="vertical-align: top; width: 45%;">
        <div class="meta-card">
          <table>
            <tr><td style="color:#475569; width:45%;">Challan No.</td><td style="font-weight:bold; text-align:right;">: &nbsp;{{ $dcNumber }}</td></tr>
            <tr><td style="color:#475569;">Date &amp; Time</td><td style="font-weight:bold; text-align:right;">: &nbsp;{{ $invoiceDate }}</td></tr>
            <tr><td style="color:#475569;">PO Reference</td><td style="font-weight:bold; text-align:right;">: &nbsp;{{ $poCode }}</td></tr>
            <tr><td style="color:#475569;">Supply Type</td><td style="font-weight:bold; text-align:right;">: &nbsp;Warehouse Supply</td></tr>
          </table>
        </div>
      </td>
    </tr>
  </table>

  <!-- 3 Party Columns -->
  <table class="party-table">
    <tr>
      <td class="party-col">
        <span class="party-pill">CONSIGNOR (SUPPLIER)</span>
        <div style="font-size: 12px; font-weight: bold; color: #0F172A; margin-bottom: 3px;">{{ $supplierName }}</div>
        <div style="font-size: 10.5px; color: #475569; line-height: 1.4;">{{ $supplierAddress }}</div>
        <div style="font-size: 10px; color: #0F172A; font-weight: bold; margin-top: 3px;">GSTIN: 33ABCDE1234F1Z5</div>
      </td>
      <td class="party-col" style="border-left: 1px solid #E2E8F0; padding-left: 12px;">
        <span class="party-pill">CONSIGNEE (BUYER)</span>
        <div style="font-size: 12px; font-weight: bold; color: #0F172A; margin-bottom: 3px;">Suguna Foods Private Limited</div>
        <div style="font-size: 10.5px; color: #475569; line-height: 1.4;">45, SIPCOT Complex, Hosur - 635 126, Tamil Nadu</div>
        <div style="font-size: 10px; color: #0F172A; font-weight: bold; margin-top: 3px;">GSTIN: 33AAECS1234F1Z1</div>
      </td>
      <td class="party-col" style="border-left: 1px solid #E2E8F0; padding-left: 12px;">
        <span class="party-pill">SHIP TO (DESTINATION)</span>
        <div style="font-size: 12px; font-weight: bold; color: #0F172A; margin-bottom: 3px;">{{ $warehouseName }}</div>
        <div style="font-size: 10.5px; color: #475569; line-height: 1.4;">{{ $warehouseAddress }}</div>
        <div style="font-size: 10px; color: #7E22CE; font-weight: bold; margin-top: 3px;">Gate Inward Pass Required</div>
      </td>
    </tr>
  </table>

  <!-- Transporter Banner -->
  <div class="trans-box">
    <table style="width: 100%; border-collapse: collapse; font-size: 10.5px;">
      <tr>
        <td style="width: 25%;">Transporter: <strong>{{ $transCompany }}</strong></td>
        <td style="width: 25%;">Vehicle No: <strong style="color:#581C87; font-size:11px;">{{ $vehNumber }}</strong></td>
        <td style="width: 25%;">LR / Docket: <strong>{{ $lrNumber }}</strong></td>
        <td style="width: 25%;">Driver: <strong>{{ $driverName }} ({{ $driverMobile }})</strong></td>
      </tr>
    </table>
  </div>

  <!-- Goods Table -->
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 6%; text-align: center;">S.No.</th>
        <th style="width: 44%; text-align: left;">Description of Goods</th>
        <th style="width: 16%; text-align: left;">HSN / SKU</th>
        <th style="width: 10%; text-align: center;">Qty</th>
        <th style="width: 10%; text-align: center;">Unit</th>
        <th style="width: 14%; text-align: right;">Declared Value (Rs.)</th>
      </tr>
    </thead>
    <tbody>
      @foreach($purchase->purchaseItems as $index => $item)
      @php
        $p = $item->product;
        $unitCost = (float)($it->net_unit_cost ?? $item->product_cost ?? ($p->product_cost ?? 15.0));
        $lineTot = $unitCost * (float)$item->quantity;
        $sku = $p ? ($p->code ?: '8901898053777') : '8901898053777';
      @endphp
      <tr>
        <td style="text-align: center; font-weight: bold;">{{ $index + 1 }}</td>
        <td>
          <strong style="color: #0F172A; font-size: 11.5px;">{{ $p->name ?? 'Product Item' }}</strong>
        </td>
        <td style="font-size: 11.5px; font-weight: bold; color: #0F172A;">{{ $sku }}</td>
        <td style="text-align: center; font-weight: bold; font-size: 12px;">{{ $item->quantity }}</td>
        <td style="text-align: center; color: #475569;">Pack</td>
        <td style="text-align: right; font-weight: bold;">{{ number_format($lineTot, 2) }}</td>
      </tr>
      @endforeach
      <tr style="background: #F8FAFC; font-weight: bold;">
        <td colspan="3" style="text-align: right; padding: 8px;">Total Declared Value:</td>
        <td style="text-align: center; font-size: 12px; color: #581C87;">{{ $totalUnits }}</td>
        <td></td>
        <td style="text-align: right; font-size: 12px; color: #581C87;">Rs. {{ number_format($totalValue, 2) }}</td>
      </tr>
    </tbody>
  </table>

  <!-- Handover Declaration & Signatures -->
  <div style="font-size: 9.5px; color: #475569; border: 1px solid #E2E8F0; border-radius: 6px; padding: 8px 12px; margin-bottom: 14px;">
    <strong>Declaration:</strong> Certified that the particulars given above are true and correct and the goods described above are being transported for supply to the designated warehouse.
  </div>

  <table class="bottom-table">
    <tr>
      <td class="sign-box">
        <div style="font-weight: bold; color: #0F172A; font-size: 10.5px;">Consignor Signatory</div>
        <div style="margin: 22px 0 3px 0; color: #64748B; font-size: 9px;">Authorized Signature &amp; Seal</div>
        <div style="font-size: 8.5px; color: #94A3B8;">{{ $supplierName }}</div>
      </td>
      <td style="width: 5%;"></td>
      <td class="sign-box">
        <div style="font-weight: bold; color: #0F172A; font-size: 10.5px;">Transporter Handover</div>
        <div style="margin: 22px 0 3px 0; color: #64748B; font-size: 9px;">Cargo Received in Sound Condition</div>
        <div style="font-size: 8.5px; color: #94A3B8;">Driver Signature &amp; Date</div>
      </td>
      <td style="width: 5%;"></td>
      <td class="sign-box">
        <div style="font-weight: bold; color: #0F172A; font-size: 10.5px;">Warehouse Security Gate</div>
        <div style="margin: 22px 0 3px 0; color: #64748B; font-size: 9px;">Gate Entry Inward Stamp</div>
        <div style="font-size: 8.5px; color: #94A3B8;">{{ $warehouseName }} Gate Pass</div>
      </td>
    </tr>
  </table>

</div>

</body>
</html>