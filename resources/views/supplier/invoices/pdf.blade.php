<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
  <title>PRODUCT LIST INVOICE — {{ $purchase->reference_code ?: ('PO-' . $purchase->id) }}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 10mm 12mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      margin: 0;
      padding: 0;
      background: @if(isset($isPdf) && $isPdf) #FFFFFF @else #475569 @endif;
      color: #0F172A;
      font-family: 'DejaVu Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 10.5px;
      line-height: 1.35;
    }

    @if(!isset($isPdf) || !$isPdf)
    /* Top Action Bar for Browser View */
    .top-action-bar {
      position: sticky;
      top: 0;
      left: 0;
      right: 0;
      background: rgba(15, 23, 42, 0.9);
      backdrop-filter: blur(8px);
      padding: 10px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 1000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }
    .top-bar-title {
      color: #FFFFFF;
      font-size: 13px;
      font-weight: bold;
    }
    .top-bar-actions {
      display: flex;
      gap: 10px;
    }
    .btn-action {
      height: 34px;
      padding: 0 16px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: bold;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      text-decoration: none;
      border: 1px solid transparent;
    }
    .btn-action.primary {
      background: #15803D;
      color: #FFFFFF;
    }
    .btn-action.secondary {
      background: #334155;
      color: #FFFFFF;
      border-color: #475569;
    }

    .invoice-wrapper {
      width: 780px;
      max-width: 95vw;
      margin: 20px auto 30px auto;
      background: #FFFFFF;
      padding: 30px 36px;
      border-radius: 6px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.25);
    }
    @else
    .invoice-wrapper {
      width: 100%;
      background: #FFFFFF;
      padding: 0;
      margin: 0;
    }
    @endif

    /* ── HEADER ── */
    .inv-header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }

    .logo-title-cell {
      vertical-align: top;
      width: 52%;
    }

    .meta-box-cell {
      vertical-align: top;
      width: 48%;
    }

    .main-doc-title {
      font-size: 21px;
      font-weight: bold;
      color: #064E3B;
      letter-spacing: 0.5px;
      margin: 0 0 4px 0;
      text-transform: uppercase;
    }

    .title-underline {
      width: 140px;
      height: 3.5px;
      background: #10B981;
      margin-bottom: 6px;
    }

    /* Meta Box */
    .meta-card {
      background: #FFFFFF;
      border: 1px solid #CBD5E1;
      border-radius: 6px;
      padding: 8px 12px;
    }

    .meta-card table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }

    .meta-card table td {
      padding: 1.5px 0;
    }

    /* ── PARTY COLUMNS ── */
    .party-columns-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }

    .party-col {
      width: 33.33%;
      vertical-align: top;
      padding: 0 8px 0 0;
    }

    .party-col-divider {
      border-left: 1px solid #E2E8F0;
      padding-left: 10px;
    }

    .party-pill-tag {
      background: #DCFCE7;
      color: #15803D;
      font-size: 9px;
      font-weight: bold;
      letter-spacing: 0.5px;
      padding: 2.5px 7px;
      border-radius: 3px;
      display: inline-block;
      margin-bottom: 5px;
      text-transform: uppercase;
    }

    .party-name {
      font-size: 11.5px;
      font-weight: bold;
      color: #0F172A;
      margin-bottom: 3px;
      line-height: 1.25;
    }

    .party-address {
      font-size: 10px;
      color: #475569;
      line-height: 1.35;
      margin-bottom: 3px;
    }

    .party-gst {
      font-size: 10px;
      font-weight: bold;
      color: #0F172A;
      margin-bottom: 2px;
    }

    .party-contact {
      font-size: 9.5px;
      color: #475569;
      margin-top: 1px;
    }

    /* ── PRODUCT TABLE ── */
    .product-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }

    .product-table th {
      background: #064E3B;
      color: #FFFFFF;
      font-size: 9.5px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      padding: 7px 8px;
      border: 1px solid #064E3B;
    }

    .product-table td {
      padding: 7px 8px;
      font-size: 10.5px;
      color: #0F172A;
      border-bottom: 1px solid #E2E8F0;
      border-left: 1px solid #E2E8F0;
      border-right: 1px solid #E2E8F0;
      vertical-align: middle;
    }

    .product-table tr:last-child td {
      border-bottom: 1px solid #CBD5E1;
    }

    .prod-desc-name {
      font-weight: bold;
      font-size: 11px;
      color: #0F172A;
      display: block;
    }

    .prod-desc-sub {
      font-size: 9px;
      color: #64748B;
      margin-top: 1px;
      display: block;
    }

    /* ── TOTALS & SUMMARY ── */
    .totals-wrapper-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
      page-break-inside: avoid;
    }

    .summary-left-cell {
      width: 46%;
      vertical-align: top;
      padding-right: 12px;
    }

    .summary-right-cell {
      width: 54%;
      vertical-align: top;
    }

    .qty-card-box {
      border: 1px solid #CBD5E1;
      border-radius: 6px;
      padding: 10px 14px;
      background: #FFFFFF;
    }

    .qty-card-row {
      font-size: 11.5px;
      margin-bottom: 6px;
    }
    .qty-card-row:last-child {
      margin-bottom: 0;
    }
    .qty-card-row strong {
      font-size: 14px;
      font-weight: bold;
      color: #0F172A;
      float: right;
    }

    /* Totals Calculation Table */
    .calc-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
    }

    .calc-table td {
      padding: 3.5px 6px;
    }

    .calc-lbl {
      color: #334155;
      text-align: left;
    }

    .calc-val {
      font-weight: bold;
      text-align: right;
      color: #0F172A;
    }

    .calc-row-grand {
      background: #064E3B;
      color: #FFFFFF !important;
    }
    .calc-row-grand td {
      color: #FFFFFF !important;
      font-weight: bold;
      font-size: 11.5px;
      padding: 5px 6px;
    }

    .calc-row-net {
      background: #DCFCE7;
    }
    .calc-row-net td {
      color: #15803D !important;
      font-weight: bold;
      font-size: 12px;
      padding: 6px 6px;
    }

    /* ── AMOUNT IN WORDS ── */
    .words-box {
      background: #FFFFFF;
      border: 1px solid #CBD5E1;
      border-radius: 6px;
      padding: 6px 12px;
      margin-bottom: 10px;
      page-break-inside: avoid;
    }

    .words-text-title {
      font-size: 8.5px;
      font-weight: bold;
      color: #0F172A;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .words-text-val {
      font-size: 10.5px;
      font-style: italic;
      color: #334155;
      font-weight: bold;
      margin-top: 1px;
    }

    /* ── FOOTER 3-COLUMN SECTION ── */
    .bottom-info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
      page-break-inside: avoid;
    }

    .bottom-col {
      vertical-align: top;
      width: 33.33%;
      padding-right: 8px;
    }
    .bottom-col:last-child {
      padding-right: 0;
      text-align: right;
    }

    .bottom-col-title {
      font-size: 9px;
      font-weight: bold;
      color: #0F172A;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-bottom: 3px;
      display: block;
    }

    .terms-list {
      margin: 0;
      padding-left: 12px;
      font-size: 8.5px;
      color: #475569;
      line-height: 1.35;
    }

    .bank-grid {
      font-size: 8.5px;
      color: #475569;
      line-height: 1.4;
    }
    .bank-grid strong {
      color: #0F172A;
    }

    /* Stamp & Signature */
    .stamp-wrap {
      display: inline-block;
      text-align: center;
    }

    .circle-stamp {
      width: 62px;
      height: 62px;
      border: 1.5px dashed #1E40AF;
      border-radius: 50%;
      display: inline-block;
      text-align: center;
      color: #1E40AF;
      font-size: 6px;
      font-weight: bold;
      text-transform: uppercase;
      padding: 3px;
      margin-right: 4px;
      vertical-align: middle;
    }

    .sign-image {
      display: inline-block;
      vertical-align: middle;
      width: 70px;
      height: auto;
    }

    .signatory-title {
      font-size: 9px;
      font-weight: bold;
      color: #0F172A;
      margin-top: 2px;
      display: block;
    }

    /* ── FOOTER BANNER ── */
    .thankyou-banner {
      border-top: 1px solid #10B981;
      padding-top: 6px;
      text-align: center;
      font-size: 10px;
      font-weight: bold;
      color: #047857;
      page-break-inside: avoid;
    }

    @media print {
      body {
        background: #FFFFFF !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .top-action-bar {
        display: none !important;
      }
      .invoice-wrapper {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        border-radius: 0 !important;
      }
    }
  </style>
</head>
<body>

@php
  $poCode = $purchase->reference_code ?: ('PU_' . $purchase->id);
  $invoiceNumber = request('inv') ?: request('invoice_number') ?: ($purchase->asn ? $purchase->asn->invoice_number : ('INV-' . date('Y-m') . '-' . str_pad($purchase->id, 4, '0', STR_PAD_LEFT)));
  $asnNumber = $purchase->asn ? $purchase->asn->asn_number : ('ASN-' . date('Y') . '-' . str_pad($purchase->id, 4, '0', STR_PAD_LEFT));
  $invoiceDate = \Carbon\Carbon::parse($purchase->date)->format('d M Y');
  $dispatchDate = $purchase->asn && $purchase->asn->dispatch_date ? \Carbon\Carbon::parse($purchase->asn->dispatch_date)->format('d M Y') : $invoiceDate;
  $dueDate = \Carbon\Carbon::parse($purchase->date)->addDays(30)->format('d M Y');
  
  $supplier = $purchase->supplier;
  $supplierName = $supplier->name ?? 'Jeyachandran Textile Private Limited';
  $supplierAddress = '123, Industrial Estate, Ganapathy, Coimbatore - 641006, Tamil Nadu, India';
  $supplierGst = '33ABCDE1234F1Z5';
  $supplierPhone = '+91 98765 43210';
  $supplierEmail = 'accounts@jeyachandran.com';

  $warehouse = $purchase->warehouse;
  $warehouseName = 'Suguna Warehouse';
  $warehouseAddress = 'Main Receiving Warehouse, Hosur - 635 126, Tamil Nadu, India';

  // Calculate items and totals dynamically
  $totalItemsCount = $purchase->purchaseItems->count();
  $totalQtyCount = $purchase->purchaseItems->sum('quantity');
  
  $subtotal = 0;
  foreach($purchase->purchaseItems as $it) {
      $unitCost = (float)($it->net_unit_cost ?? $it->product_cost ?? ($it->product->product_cost ?? 15.0));
      $subtotal += ($unitCost * (float)$it->quantity);
  }

  $taxAmount = (float)($purchase->tax_amount ?? 0);
  $grandTotal = $subtotal + $taxAmount;
  $cgst = round($taxAmount / 2, 2);
  $sgst = round($taxAmount / 2, 2);
  $roundOff = 0.00;
  $netPayable = $grandTotal;

  $amountInWords = getIndianCurrencyWords($netPayable);
@endphp

@if(!isset($isPdf) || !$isPdf)
<!-- Top Floating Action Toolbar (Only on Screen View) -->
<div class="top-action-bar">
  <div class="top-bar-title">
    Product List Invoice — <strong>{{ $invoiceNumber }}</strong> ({{ $poCode }})
  </div>
  <div class="top-bar-actions">
    <a href="{{ route('supplier.invoices.pdf', $purchase->id) }}?pdf=1&download=1" class="btn-action secondary">
      Download PDF
    </a>
    <button type="button" class="btn-action primary" onclick="window.print();">
      Print Invoice
    </button>
  </div>
</div>
@endif

<!-- A4 Paper Container -->
<div class="invoice-wrapper">

  <!-- ── 1. HEADER (HEADING + META BOX) ── -->
  <table class="inv-header-table">
    <tr>
      <!-- Left: Heading -->
      <td class="logo-title-cell">
        <div class="main-doc-title">PRODUCT LIST INVOICE</div>
        <div class="title-underline"></div>
      </td>

      <!-- Right: Meta Information Box -->
      <td class="meta-box-cell">
        <div class="meta-card">
          <table>
            <tr>
              <td style="color:#475569; width:40%;">Invoice No.</td>
              <td style="font-weight:bold; color:#0F172A; text-align:right;">: &nbsp;{{ $invoiceNumber }}</td>
            </tr>
            <tr>
              <td style="color:#475569;">Invoice Date</td>
              <td style="font-weight:bold; color:#0F172A; text-align:right;">: &nbsp;{{ $invoiceDate }}</td>
            </tr>
            <tr>
              <td style="color:#475569;">PO Reference</td>
              <td style="font-weight:bold; color:#0F172A; text-align:right;">: &nbsp;{{ $poCode }}</td>
            </tr>
            <tr>
              <td style="color:#475569;">ASN Number</td>
              <td style="font-weight:bold; color:#0F172A; text-align:right;">: &nbsp;{{ $asnNumber }}</td>
            </tr>
            <tr>
              <td style="color:#475569;">Dispatch Date</td>
              <td style="font-weight:bold; color:#0F172A; text-align:right;">: &nbsp;{{ $dispatchDate }}</td>
            </tr>
            <tr>
              <td style="color:#475569;">Due Date</td>
              <td style="font-weight:bold; color:#0F172A; text-align:right;">: &nbsp;{{ $dueDate }}</td>
            </tr>
          </table>
        </div>
      </td>
    </tr>
  </table>

  <!-- ── 2. PARTY INFORMATION (3 COLUMNS) ── -->
  <table class="party-columns-table">
    <tr>
      <!-- Column 1: Supplier (From) -->
      <td class="party-col">
        <span class="party-pill-tag">SUPPLIER (FROM)</span>
        <div class="party-name">{{ $supplierName }}</div>
        <div class="party-address">
          {{ $supplierAddress }}
        </div>
        <div class="party-gst">GSTIN : {{ $supplierGst }}</div>
        <div class="party-contact">Ph: {{ $supplierPhone }}</div>
        <div class="party-contact">Email: {{ $supplierEmail }}</div>
      </td>

      <!-- Column 2: Bill To (Buyer) -->
      <td class="party-col party-col-divider">
        <span class="party-pill-tag">BILL TO (BUYER)</span>
        <div class="party-name">Suguna Foods Private Limited</div>
        <div class="party-address">
          45, SIPCOT Industrial Complex,<br>
          Hosur - 635 126,<br>
          Tamil Nadu, India
        </div>
        <div class="party-gst">GSTIN : 33AAECS1234F1Z1</div>
      </td>

      <!-- Column 3: Ship To (Warehouse) -->
      <td class="party-col party-col-divider">
        <span class="party-pill-tag">SHIP TO (WAREHOUSE)</span>
        <div class="party-name">{{ $warehouseName }}</div>
        <div class="party-address">
          {{ $warehouseAddress }}
        </div>
      </td>
    </tr>
  </table>

  <!-- ── 3. PRODUCT TABLE ── -->
  <table class="product-table">
    <thead>
      <tr>
        <th style="width: 6%; text-align: center;">S.No.</th>
        <th style="width: 36%; text-align: left;">Product Description</th>
        <th style="width: 18%; text-align: left;">SKU</th>
        <th style="width: 8%; text-align: center;">Qty</th>
        <th style="width: 9%; text-align: center;">Unit</th>
        <th style="width: 11%; text-align: right;">Unit Price (Rs.)</th>
        <th style="width: 12%; text-align: right;">Total Amount (Rs.)</th>
      </tr>
    </thead>
    <tbody>
      @foreach($purchase->purchaseItems as $index => $item)
      @php
        $p = $item->product;
        $unitCost = (float)($item->net_unit_cost ?? $item->product_cost ?? ($p->product_cost ?? 15.0));
        $lineTotal = $unitCost * (float)$item->quantity;
        $skuCode = $p ? ($p->code ?: '8901898053777') : '8901898053777';
        $packSubtitle = 'Standard Pack';
        if (str_contains(strtolower($p->name ?? ''), 'fries')) $packSubtitle = '2.5 Kg Pack';
        elseif (str_contains(strtolower($p->name ?? ''), 'ketchup')) $packSubtitle = '1 Kg Bottle';
        elseif (str_contains(strtolower($p->name ?? ''), 'mayonnaise')) $packSubtitle = '500 g Jar';
        elseif (str_contains(strtolower($p->name ?? ''), 'pizza')) $packSubtitle = '10 Inch';
      @endphp
      <tr>
        <td style="text-align: center; font-weight: bold;">{{ $index + 1 }}</td>
        <td>
          <span class="prod-desc-name">{{ $p->name ?? 'Product Item' }}</span>
          <span class="prod-desc-sub">{{ $packSubtitle }}</span>
        </td>
        <td style="font-size: 11.5px; font-weight: bold; color: #0F172A; letter-spacing: 0.5px;">{{ $skuCode }}</td>
        <td style="text-align: center; font-weight: bold;">{{ $item->quantity }}</td>
        <td style="text-align: center; color: #475569;">Pack</td>
        <td style="text-align: right;">{{ number_format($unitCost, 2) }}</td>
        <td style="text-align: right; font-weight: bold;">{{ number_format($lineTotal, 2) }}</td>
      </tr>
      @endforeach
    </tbody>
  </table>

  <!-- ── 4. TOTAL SUMMARY (LEFT: QTY BOX, RIGHT: CALCULATION TABLE) ── -->
  <table class="totals-wrapper-table">
    <tr>
      <!-- Left: Total Items & Total Quantity Card -->
      <td class="summary-left-cell">
        <div class="qty-card-box">
          <div class="qty-card-row">
            <span style="color:#475569;">Total Items:</span>
            <strong>{{ $totalItemsCount }}</strong>
          </div>
          <div class="qty-card-row" style="margin-top:8px;">
            <span style="color:#475569;">Total Quantity:</span>
            <strong>{{ $totalQtyCount }}</strong>
          </div>
        </div>
      </td>

      <!-- Right: Financial Totals Breakdown -->
      <td class="summary-right-cell">
        <table class="calc-table">
          <tr>
            <td class="calc-lbl">Total Amount</td>
            <td class="calc-val">{{ number_format($subtotal, 2) }}</td>
          </tr>
          <tr>
            <td class="calc-lbl">CGST ({{ $taxAmount > 0 ? '2.50%' : '0.00%' }})</td>
            <td class="calc-val">{{ number_format($cgst, 2) }}</td>
          </tr>
          <tr>
            <td class="calc-lbl">SGST ({{ $taxAmount > 0 ? '2.50%' : '0.00%' }})</td>
            <td class="calc-val">{{ number_format($sgst, 2) }}</td>
          </tr>
          <tr class="calc-row-grand">
            <td style="font-weight: bold;">GRAND TOTAL (Rs.)</td>
            <td style="text-align: right; font-weight: bold;">{{ number_format($grandTotal, 2) }}</td>
          </tr>
          <tr>
            <td class="calc-lbl">Round Off</td>
            <td class="calc-val">{{ number_format($roundOff, 2) }}</td>
          </tr>
          <tr class="calc-row-net">
            <td>NET PAYABLE (Rs.)</td>
            <td style="text-align: right;">{{ number_format($netPayable, 2) }}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- ── 5. AMOUNT IN WORDS BANNER ── -->
  <div class="words-box">
    <div class="words-text-title">Amount in Words</div>
    <div class="words-text-val">{{ $amountInWords }}</div>
  </div>

  <!-- ── 6. BOTTOM SECTION: TERMS, BANK DETAILS & SIGNATURE ── -->
  <table class="bottom-info-table">
    <tr>
      <!-- Column 1: Terms & Conditions -->
      <td class="bottom-col">
        <span class="bottom-col-title">TERMS & CONDITIONS</span>
        <ul class="terms-list">
          <li>Goods once sold will not be taken back.</li>
          <li>Payment will be made within agreed credit period.</li>
          <li>Interest @ 18% p.a. will be charged on delayed payments.</li>
          <li>Please quote Invoice No. & PO No. for all correspondence.</li>
        </ul>
      </td>

      <!-- Column 2: Bank Details -->
      <td class="bottom-col" style="border-left: 1px solid #E2E8F0; padding-left: 8px;">
        <span class="bottom-col-title">BANK DETAILS</span>
        <div class="bank-grid">
          <div>Bank Name : <strong>HDFC Bank</strong></div>
          <div>A/c No &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: <strong>50200012345678</strong></div>
          <div>IFSC Code : <strong>HDFC0001234</strong></div>
          <div>Branch &nbsp;&nbsp;&nbsp;&nbsp;: <strong>Ganapathy, Coimbatore</strong></div>
        </div>
      </td>

      <!-- Column 3: Authorized Signatory & Stamp -->
      <td class="bottom-col" style="border-left: 1px solid #E2E8F0; padding-left: 8px;">
        <span class="bottom-col-title" style="text-align: right;">For {{ $supplierName }}</span>
        <div class="stamp-wrap">
          <!-- Stamp Text Box -->
          <div class="circle-stamp">
            <div style="margin-top:8px;">JEYACHANDRAN TEXTILE</div>
            <div style="color:#DC2626; font-size:6px; margin:2px 0;">* COIMBATORE *</div>
            <div>PVT LTD</div>
          </div>

          <!-- Signature SVG -->
          <svg class="sign-image" viewBox="0 0 100 45" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 30C15 10 25 35 35 15C45 -5 40 40 55 25C70 10 65 35 80 20C90 10 95 30 98 25" stroke="#0F172A" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>
        <span class="signatory-title">Authorized Signatory</span>
      </td>
    </tr>
  </table>

  <!-- ── 7. FOOTER BANNER ── -->
  <div class="thankyou-banner">
    <span>-- Thank you for your business! --</span>
  </div>

</div>

</body>
</html>