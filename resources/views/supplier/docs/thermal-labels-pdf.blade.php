<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>LPN Shipping Label — {{ $purchase->reference_code ?: ('PO-'.$purchase->id) }}</title>
  <style>
    @page {
      size: 288pt 432pt; /* Exact 4 x 6 inches in printer points */
      margin: 0;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 8pt;
      background: #FFFFFF;
      color: #000000;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 9pt;
      line-height: 1.25;
    }
    .label-page {
      border: 2pt solid #000000;
      border-radius: 6pt;
      padding: 8pt 10pt;
      height: 416pt;
      position: relative;
      page-break-after: always;
      page-break-inside: avoid;
    }
    .label-page:last-child {
      page-break-after: avoid;
    }
    .label-header {
      width: 100%;
      border-bottom: 2pt solid #000000;
      padding-bottom: 5pt;
      margin-bottom: 6pt;
    }
    .label-title {
      font-size: 13pt;
      font-weight: 900;
      letter-spacing: 0.5pt;
      text-transform: uppercase;
    }
    .label-sub {
      font-size: 7.5pt;
      font-weight: 700;
      color: #333333;
      letter-spacing: 0.5pt;
    }
    .barcode-box {
      text-align: center;
      padding: 6pt 4pt 4pt 4pt;
      border: 1.5pt solid #000000;
      border-radius: 5pt;
      margin-bottom: 6pt;
      background: #FFFFFF;
    }
    .meta-table {
      width: 100%;
      border-top: 1.2pt dashed #000000;
      border-bottom: 1.2pt dashed #000000;
      padding: 5pt 0;
      margin-bottom: 6pt;
    }
    .meta-table td {
      padding: 1.5pt 2pt;
      font-size: 8.5pt;
      vertical-align: top;
    }
    .meta-lbl {
      font-size: 6.5pt;
      font-weight: 800;
      color: #555555;
      text-transform: uppercase;
      display: block;
      margin-bottom: 1pt;
    }
    .contents-box {
      font-size: 8.5pt;
      margin-bottom: 6pt;
      max-height: 120pt;
      overflow: hidden;
    }
    .footer-bar {
      position: absolute;
      bottom: 8pt;
      left: 10pt;
      right: 10pt;
      border-top: 1.2pt solid #000000;
      padding-top: 3pt;
      font-size: 6.5pt;
      font-weight: 700;
    }
  </style>
</head>
<body>

@php
  $poCode = $purchase ? ($purchase->reference_code ?: ('PO-'.$purchase->id)) : 'PO-1';
  $warehouseName = $purchase && $purchase->warehouse ? $purchase->warehouse->name : 'Suguna Warehouse';
  $asn = $purchase ? $purchase->asn : null;
  
  $cartonsList = [];
  if (isset($carton) && $carton) {
    $cartonsList = [$carton];
  } elseif ($asn && $asn->cartons && $asn->cartons->count() > 0) {
    $cartonsList = $asn->cartons;
  } else {
    $cartonsList = [
      (object)[
        'lpn_number' => 'LPN-' . date('Y') . '-0001',
        'carton_number' => 'Carton 1',
        'carton_type' => 'Medium Box',
        'dimensions' => '40 x 35 x 30 cm',
        'weight' => 12.5,
        'items' => ($purchase && $purchase->purchaseItems) ? $purchase->purchaseItems->map(function($it) {
          return (object)[
            'product' => (object)['name' => $it->product->name ?? 'Product Item'],
            'product_name' => $it->product->name ?? 'Product Item',
            'sku' => $it->product->code ?? ('SKU-'.$it->product_id),
            'packed_quantity' => $it->quantity
          ];
        }) : collect([])
      ]
    ];
  }
@endphp

@foreach($cartonsList as $cIdx => $cartonItem)
<div class="label-page">
  <!-- Brand Header -->
  <table class="label-header">
    <tr>
      <td>
        <div class="label-title">SUGUNA LOGISTICS</div>
        <div class="label-sub">LICENSE PLATE NUMBER (LPN)</div>
      </td>
      <td style="text-align:right;">
        <span style="background:#000000; color:#FFFFFF; font-weight:900; font-size:9pt; padding:2pt 6pt; border-radius:3pt;">
          {{ $cartonItem->carton_number ?? ('Carton '.($cIdx+1)) }}
        </span>
        <div style="font-size:7.5pt; font-weight:700; margin-top:2pt;">{{ date('d M Y') }}</div>
      </td>
    </tr>
  </table>

  <!-- Scannable Barcode Image (Code-128) -->
  <div class="barcode-box">
    @php
      $barcodeImg = '';
      try {
        $generator = new \Picqer\Barcode\BarcodeGeneratorPNG();
        $code = $cartonItem->lpn_number ?: 'LPN-2026-0001';
        $barcodeData = $generator->getBarcode($code, $generator::TYPE_CODE_128, 2, 45);
        $barcodeImg = 'data:image/png;base64,' . base64_encode($barcodeData);
      } catch(\Throwable $e) {
        $barcodeImg = '';
      }
    @endphp
    @if($barcodeImg)
      <div style="text-align:center; margin:2pt auto 4pt auto;">
        <img src="{{ $barcodeImg }}" style="width:230pt; height:38pt; display:inline-block;" alt="{{ $cartonItem->lpn_number }}">
      </div>
    @endif
    <div style="font-family:monospace; font-weight:900; font-size:12pt; letter-spacing:1.5pt; color:#000000;">
      {{ $cartonItem->lpn_number }}
    </div>
  </div>

  <!-- Metadata Table -->
  <table class="meta-table">
    <tr>
      <td style="width:50%;">
        <span class="meta-lbl">PO NUMBER</span>
        <strong>{{ $poCode }}</strong>
      </td>
      <td style="width:50%;">
        <span class="meta-lbl">DESTINATION WH</span>
        <strong>{{ $warehouseName }}</strong>
      </td>
    </tr>
    <tr>
      <td>
        <span class="meta-lbl">CONTAINER TYPE</span>
        <strong>{{ $cartonItem->carton_type ?? 'Medium Box' }}</strong>
      </td>
      <td>
        <span class="meta-lbl">GROSS WEIGHT</span>
        <strong>{{ $cartonItem->weight ?? '12.5' }} KG</strong>
      </td>
    </tr>
    <tr>
      <td colspan="2">
        <span class="meta-lbl">DIMENSIONS</span>
        <strong>{{ $cartonItem->dimensions ?? '40 x 35 x 30 cm' }}</strong>
      </td>
    </tr>
  </table>

  <!-- Enclosed Products -->
  <div class="contents-box">
    <div style="font-size:7.5pt; font-weight:900; letter-spacing:0.5pt; text-transform:uppercase; margin-bottom:3pt;">
      ENCLOSED PRODUCTS &amp; QUANTITIES:
    </div>
    @if(isset($cartonItem->items))
      @foreach($cartonItem->items as $it)
        <div style="border-bottom:1px dashed #CCCCCC; padding:2pt 0;">
          <span style="float:left; width:75%;">• {{ $it->product_name ?? ($it->product->name ?? 'Item') }} <small style="color:#666;">({{ $it->sku ?? ($it->product->code ?? '') }})</small></span>
          <span style="float:right; text-align:right; font-weight:bold; color:#15803D;">{{ $it->packed_quantity ?? $it->quantity ?? 1 }} Units</span>
          <div style="clear:both;"></div>
        </div>
      @endforeach
    @endif
  </div>

  <!-- Footer -->
  <table class="footer-bar">
    <tr>
      <td>INFY-POS WMS ENTERPRISE</td>
      <td style="text-align:right;">VERIFIED PACKING • READY FOR DISPATCH</td>
    </tr>
  </table>
</div>
@endforeach

</body>
</html>
