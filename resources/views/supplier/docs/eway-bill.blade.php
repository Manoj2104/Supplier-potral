<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
  <title>GST e-WAY BILL — {{ $purchase->reference_code ?: ('PO-' . $purchase->id) }}</title>
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
    .btn-action.primary { background: #EA580C; color: #FFFFFF; box-shadow: 0 2px 8px rgba(234, 88, 12, 0.3); }
    .btn-action.primary:hover { background: #C2410C; }
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

    .govt-header {
      border-bottom: 2.5px solid #0F172A;
      padding-bottom: 10px;
      margin-bottom: 14px;
      display: table;
      width: 100%;
    }
    .govt-col-left { display: table-cell; vertical-align: top; width: 58%; }
    .govt-col-right { display: table-cell; vertical-align: top; width: 42%; text-align: right; }

    .ewb-badge {
      background: #FFEDD5;
      color: #C2410C;
      font-size: 9.5px;
      font-weight: bold;
      letter-spacing: 0.5px;
      padding: 3px 8px;
      border-radius: 4px;
      display: inline-block;
      margin-bottom: 5px;
      text-transform: uppercase;
    }

    .main-title { font-size: 22px; font-weight: 900; color: #9A3412; margin: 0 0 2px 0; }
    .title-sub { font-size: 10px; color: #64748B; }

    .ewb-num-card {
      background: #FFF7ED;
      border: 1.5px solid #FDBA74;
      border-radius: 8px;
      padding: 10px 14px;
      text-align: left;
    }

    .section-head {
      background: #9A3412;
      color: #FFFFFF;
      font-size: 10.5px;
      font-weight: bold;
      padding: 6px 10px;
      margin: 14px 0 6px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .data-grid { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 10.5px; }
    .data-grid td { padding: 6px 10px; border: 1px solid #E2E8F0; vertical-align: top; }
    .data-grid .lbl { width: 28%; color: #475569; background: #F8FAFC; font-weight: bold; }
    .data-grid .val { width: 72%; color: #0F172A; }

    .qr-box {
      border: 1.5px dashed #9A3412;
      border-radius: 8px;
      padding: 12px;
      text-align: center;
      background: #FFF7ED;
      margin-top: 14px;
    }

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
  $invNumber = request('inv') ?: ($purchase->asn ? $purchase->asn->invoice_number : ('INV-' . date('Y-m') . '-' . str_pad($purchase->id, 4, '0', STR_PAD_LEFT)));
  $ewbNumber = '1215 ' . rand(1000, 9999) . ' ' . str_pad($purchase->id * 317, 4, '0', STR_PAD_RIGHT);
  $genDate = request('dispatch_date') ? \Carbon\Carbon::parse(request('dispatch_date'))->format('d/m/Y h:i A') : \Carbon\Carbon::parse($purchase->date)->format('d/m/Y h:i A');
  $validUntil = request('expected_arrival') ? \Carbon\Carbon::parse(request('expected_arrival'))->format('d/m/Y 11:59 PM') : \Carbon\Carbon::parse($purchase->date)->addDays(2)->format('d/m/Y 11:59 PM');
  $transCompany = request('trans') ?: ($purchase->asn ? $purchase->asn->transport_company : '{{ $transCompany }}');
  $vehNumber = request('veh') ?: ($purchase->asn ? $purchase->asn->vehicle_number : '{{ $vehNumber }}');
  $lrNumber = request('lr') ?: ($purchase->asn ? $purchase->asn->lr_number : '{{ $lrNumber }}');
  $driverName = request('drv') ?: ($purchase->asn ? $purchase->asn->driver_name : 'Manoj K');
  $driverMobile = request('mob') ?: ($purchase->asn ? $purchase->asn->driver_mobile : '+91 98765 00000');
  
  $supplier = $purchase->supplier;
  $supplierName = $supplier->name ?? 'Jeyachandran Textile Private Limited';
  $supplierGst = '33ABCDE1234F1Z5';

  $warehouse = $purchase->warehouse;
  $warehouseName = 'Suguna Warehouse';
  $buyerGst = '33AAECS1234F1Z1';

  $totalUnits = $purchase->purchaseItems->sum('quantity');
  $subtotal = 0;
  foreach($purchase->purchaseItems as $it) {
      $unitCost = (float)($it->net_unit_cost ?? $it->product_cost ?? ($it->product->product_cost ?? 15.0));
      $subtotal += ($unitCost * (float)$it->quantity);
  }
  $taxAmount = (float)($purchase->tax_amount ?? 0);
  $grandTotal = $subtotal + $taxAmount;
@endphp

@if(!isset($isPdf) || !$isPdf)
<div class="top-action-bar">
  <div class="top-bar-title">GST e-Way Bill — <strong>{{ $ewbNumber }}</strong> ({{ $poCode }})</div>
  <div class="top-bar-actions">
    <a href="{{ route('supplier.invoices.eway-bill', $purchase->id) }}?pdf=1&download=1" class="btn-action secondary">⬇ Download PDF</a>
    <button type="button" class="btn-action primary" onclick="window.print();">🖨️ Print e-Way Bill</button>
  </div>
</div>
@endif

<div class="invoice-wrapper">

  <!-- Govt National Portal Header -->
  <div class="govt-header">
    <div class="govt-col-left">
      <span class="ewb-badge">GOVERNMENT OF INDIA &bull; GST PORTAL</span>
      <div class="main-title">e-WAY BILL SYSTEM</div>
      <div class="title-sub">Form GST EWB-01 &bull; Electronic Way Bill for Cargo Movement</div>
    </div>
    <div class="govt-col-right">
      <div class="ewb-num-card">
        <div style="font-size: 9.5px; color: #C2410C; font-weight: bold;">e-WAY BILL NUMBER</div>
        <div style="font-size: 15px; font-weight: 900; color: #9A3412; letter-spacing: 0.5px;">{{ $ewbNumber }}</div>
        <div style="font-size: 9px; color: #475569; margin-top: 3px;">Generated Date: <strong>{{ $genDate }}</strong></div>
      </div>
    </div>
  </div>

  <!-- Validity Summary -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 10px; background: #FFF7ED; border: 1.5px solid #FDBA74; border-radius: 6px;">
    <tr>
      <td style="padding: 7px 12px;">Generated By: <strong>{{ $supplierGst }} ({{ $supplierName }})</strong></td>
      <td style="padding: 7px 12px;">Approx Distance: <strong>140 KM</strong></td>
      <td style="padding: 7px 12px; text-align: right;">Valid Until: <strong style="color: #C2410C;">{{ $validUntil }}</strong></td>
    </tr>
  </table>

  <!-- PART-A -->
  <div class="section-head">PART - A (Goods &amp; Party Information)</div>
  <table class="data-grid">
    <tr>
      <td class="lbl">1. GSTIN of Supplier</td>
      <td class="val"><strong>{{ $supplierGst }}</strong> &bull; {{ $supplierName }}</td>
    </tr>
    <tr>
      <td class="lbl">2. Place of Dispatch</td>
      <td class="val">123, Industrial Estate, Ganapathy, Coimbatore, Tamil Nadu - <strong>641006</strong></td>
    </tr>
    <tr>
      <td class="lbl">3. GSTIN of Recipient</td>
      <td class="val"><strong>{{ $buyerGst }}</strong> &bull; Suguna Foods Private Limited</td>
    </tr>
    <tr>
      <td class="lbl">4. Place of Delivery</td>
      <td class="val">45, SIPCOT Industrial Complex, Hosur, Tamil Nadu - <strong>635126</strong></td>
    </tr>
    <tr>
      <td class="lbl">5. Document Details</td>
      <td class="val">Tax Invoice &bull; Doc No: <strong>{{ $invNumber }}</strong> &bull; Date: <strong>{{ \Carbon\Carbon::parse($purchase->date)->format('d/m/Y') }}</strong></td>
    </tr>
    <tr>
      <td class="lbl">6. Value of Goods</td>
      <td class="val"><strong>Rs. {{ number_format($grandTotal, 2) }}</strong> (Total Taxable Value + Applicable GST)</td>
    </tr>
    <tr>
      <td class="lbl">7. HSN Code &amp; Commodity</td>
      <td class="val"><strong>20041000</strong> &bull; {{ $purchase->purchaseItems->first()->product->name ?? 'Commercial Goods' }} ({{ $totalUnits }} Units)</td>
    </tr>
    <tr>
      <td class="lbl">8. Reason for Transportation</td>
      <td class="val"><strong>Outward - Supply to Warehouse</strong> (PO Ref: {{ $poCode }})</td>
    </tr>
  </table>

  <!-- PART-B -->
  <div class="section-head">PART - B (Vehicle &amp; Transporter Details)</div>
  <table class="data-grid">
    <tr>
      <td class="lbl">Mode of Transport</td>
      <td class="val"><strong>Road</strong> &bull; Regular Commercial Vehicle</td>
    </tr>
    <tr>
      <td class="lbl">Vehicle Number</td>
      <td class="val"><strong style="font-size: 12px; color: #9A3412; letter-spacing: 0.5px;">{{ $vehNumber }}</strong></td>
    </tr>
    <tr>
      <td class="lbl">Transporter Name &amp; Doc No</td>
      <td class="val"><strong>{{ $transCompany }}</strong> &bull; LR / Doc No: <strong>{{ $lrNumber }}</strong></td>
    </tr>
    <tr>
      <td class="lbl">Driver Details</td>
      <td class="val">Manoj K &bull; Mobile: +91 98765 00000 &bull; License Verified</td>
    </tr>
  </table>

  <!-- QR Code & Official Verification Barcode -->
  <div class="qr-box">
    <div style="font-size: 9.5px; font-weight: bold; color: #9A3412; text-transform: uppercase;">Official GST Highway Inspection QR Verification</div>
    <div style="font-family: monospace; font-size: 11px; letter-spacing: 2.5px; color: #0F172A; margin: 8px 0;">
      ||| | ||||| |||| || |||||| | |||| ||| ||||||| |||||||| ||||| || ||||||
    </div>
    <div style="font-size: 9px; color: #64748B;">
      Scan with the official NIC e-Way Bill mobile app for instant highway officer QR verification &bull; Valid across all interstate checkpoints.
    </div>
  </div>

</div>

</body>
</html>