<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Supplier Settlement &amp; Payment Statement</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    * { box-sizing: border-box; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
    body { margin: 0; padding: 0; color: #0F172A; font-size: 12px; }
    .header-table { width: 100%; border-bottom: 2px solid #0F172A; padding-bottom: 12px; margin-bottom: 16px; }
    .title { font-size: 20px; font-weight: 900; color: #15803D; letter-spacing: -0.5px; }
    .sub { font-size: 11px; color: #64748B; font-weight: 600; }
    .meta-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px; margin-bottom: 16px; font-size: 12px; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 11.5px; }
    .table th { background: #F1F5F9; color: #334155; font-weight: 800; text-transform: uppercase; font-size: 10px; padding: 8px 10px; border-bottom: 1.5px solid #CBD5E1; text-align: left; }
    .table td { padding: 9px 10px; border-bottom: 1px solid #E2E8F0; }
    .footer { font-size: 10px; color: #64748B; text-align: center; border-top: 1px solid #CBD5E1; padding-top: 10px; margin-top: 20px; }
    @media print { .no-print { display: none !important; } }
  </style>
</head>
<body>

<div class="no-print" style="background:#DCFCE7; border-bottom:1px solid #86EFAC; padding:10px 20px; display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
  <strong>Official Settlement Statement</strong>
  <button onclick="window.print()" style="background:#15803D; color:#FFF; border:none; padding:6px 16px; border-radius:6px; font-weight:700; cursor:pointer;">
    Print / Save PDF
  </button>
</div>

<table class="header-table">
  <tr>
    <td>
      <div class="title">SUGUNA LOGISTICS</div>
      <div class="sub">SUPPLIER PAYMENT &amp; SETTLEMENT STATEMENT</div>
    </td>
    <td style="text-align:right;">
      <div style="font-weight:800; font-size:13px;">Date: {{ date('d M Y') }}</div>
      <div style="color:#64748B; font-size:11px;">Supplier: {{ $supplier->name ?? 'Jeyachandran Textile Private Limited' }}</div>
    </td>
  </tr>
</table>

<table class="table">
  <thead>
    <tr>
      <th>PO Reference</th>
      <th>PO Date</th>
      <th>Warehouse</th>
      <th style="text-align:right;">PO Amount</th>
      <th style="text-align:right;">Paid (Net)</th>
      <th style="text-align:right;">Outstanding</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    @php
      $sumGross = 0;
      $sumPaid = 0;
      $sumOut = 0;
    @endphp
    @foreach($purchases as $p)
    @php
      $g = (float)$p->grand_total;
      $pd = (float)$p->paid_amount;
      $out = max(0, $g - $pd);
      $sumGross += $g;
      $sumPaid += $pd;
      $sumOut += $out;
      $st = ($g > 0 && $pd >= $g) ? 'Paid' : ($pd > 0 ? 'Partial' : 'Pending');
    @endphp
    <tr>
      <td><strong>{{ $p->reference_code ?: ('PO-'.$p->id) }}</strong></td>
      <td>{{ \Carbon\Carbon::parse($p->date)->format('d M Y') }}</td>
      <td>{{ $p->warehouse->name ?? 'Suguna Warehouse' }}</td>
      <td style="text-align:right;">₹{{ number_format($g, 2) }}</td>
      <td style="text-align:right; color:#15803D; font-weight:bold;">₹{{ number_format($pd, 2) }}</td>
      <td style="text-align:right; color:{{ $out > 0 ? '#DC2626' : '#64748B' }};">₹{{ number_format($out, 2) }}</td>
      <td><strong>{{ $st }}</strong></td>
    </tr>
    @endforeach
    <tr style="background:#F8FAFC; font-weight:900;">
      <td colspan="3">TOTALS</td>
      <td style="text-align:right;">₹{{ number_format($sumGross, 2) }}</td>
      <td style="text-align:right; color:#15803D;">₹{{ number_format($sumPaid, 2) }}</td>
      <td style="text-align:right; color:#DC2626;">₹{{ number_format($sumOut, 2) }}</td>
      <td></td>
    </tr>
  </tbody>
</table>

<div class="footer">
  INFY-POS WMS ENTERPRISE • Generated on {{ date('d-M-Y H:i:s') }} • Official Settlement Record
</div>

</body>
</html>