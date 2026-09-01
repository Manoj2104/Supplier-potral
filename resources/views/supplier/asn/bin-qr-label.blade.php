<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Bin QR Label — {{ $bin->bin_code }}</title>
  <style>
    @page { size: 100mm 100mm; margin: 0; }
    body { font-family: monospace, sans-serif; margin: 0; padding: 10px; background: #FFF; width: 100mm; }
    .qr-box { border: 3px solid #000; border-radius: 10px; padding: 12px; text-align: center; }
    .header { font-size: 16px; font-weight: 900; border-bottom: 2px solid #000; padding-bottom: 4px; margin-bottom: 8px; }
    .bin-code { font-size: 26px; font-weight: 900; letter-spacing: 2px; color: #000; margin: 8px 0; }
    .path-text { font-size: 11px; font-weight: 700; color: #333; margin-bottom: 8px; }
  </style>
</head>
<body onload="window.print()">
  <div class="qr-box">
    <div class="header">INFY-POS WAREHOUSE BIN</div>
    <div class="bin-code">{{ $bin->bin_code }}</div>
    <div class="path-text">Main WH › {{ $bin->zone_name ?: 'Zone A' }} › Rack 01 › Shelf 02</div>
    <img src="{{ $qrUrl }}" alt="Bin QR" style="width: 130px; height: 130px; margin: 6px 0;">
    <div style="font-size: 10px; font-weight: 800; text-transform: uppercase;">Scan via PDA Mobile Scanner</div>
  </div>
</body>
</html>
