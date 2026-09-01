<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Receiving Completed — INFY-POS Scanner</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; -webkit-tap-highlight-color: transparent; }

    body {
      background: #0F172A; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 12px;
    }

    /* PDA Mobile Shell Frame */
    .pda-shell {
      width: 100%; max-width: 440px; height: 100vh; max-height: 870px;
      background: #FFFFFF; display: flex; flex-direction: column; justify-content: space-between;
      overflow: hidden; border-radius: 40px; border: 10px solid #1E293B; position: relative; padding: 14px 18px 18px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    @media (max-width: 480px) {
      body { padding: 0; }
      .pda-shell { max-width: 100%; height: 100vh; max-height: 100vh; border-radius: 0; border: none; padding: 12px 16px 16px; }
    }

    /* Status Bar */
    .pda-status-bar {
      color: #0F172A; font-size: 11.5px; font-weight: 800; display: flex; justify-content: space-between; align-items: center;
      padding-bottom: 6px; margin-bottom: 2px;
    }

    /* Header Row */
    .pda-header-row {
      display: flex; align-items: center; justify-content: space-between; padding-bottom: 10px;
      border-bottom: 1px solid #F1F5F9; margin-bottom: 16px;
    }
    .pda-header-icon { color: #0F172A; font-size: 20px; text-decoration: none; display: flex; }

    /* Content Area */
    .pda-comp-body { flex: 1; overflow-y: auto; display: flex; flex-direction: column; align-items: center; gap: 14px; text-align: center; }

    /* Green Animated Tick Circle (Matching Reference Image 3) */
    .pda-green-tick-circle {
      width: 72px; height: 72px; border-radius: 50%; background: #22C55E; color: #FFFFFF;
      display: inline-flex; align-items: center; justify-content: center; font-size: 38px; font-weight: 900;
      box-shadow: 0 10px 25px rgba(34, 197, 94, 0.35); margin-top: 10px;
      animation: popTick 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    @keyframes popTick { from { transform: scale(0.2); opacity: 0; } to { transform: scale(1); opacity: 1; } }

    .pda-comp-title { font-size: 22px; font-weight: 900; color: #0F172A; margin-top: 2px; }
    .pda-comp-time { font-size: 12.5px; font-weight: 700; color: #64748B; margin-top: 2px; }

    /* Scanned LPNs summary row */
    .pda-lpns-row {
      width: 100%; display: flex; justify-content: space-between; align-items: center;
      background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 12px 16px;
      font-size: 14px; font-weight: 800; color: #0F172A; cursor: pointer;
    }
    .pda-lpn-pill { background: #E2E8F0; color: #0F172A; border-radius: 10px; padding: 2px 10px; font-size: 12px; margin-left: 6px; }

    /* Details Card Block (Matching Reference Image 3) */
    .pda-details-card {
      width: 100%; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 18px; padding: 16px;
      text-align: left; display: flex; flex-direction: column; gap: 12px;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.02);
    }
    .pda-details-heading { font-size: 13px; font-weight: 800; color: #64748B; margin-bottom: 2px; }
    
    .pda-field-block { display: flex; flex-direction: column; gap: 2px; }
    .pda-field-val { font-size: 15px; font-weight: 900; color: #0F172A; }
    .pda-field-lbl { font-size: 11px; font-weight: 700; color: #64748B; }

    /* Generated GRN Banner */
    .pda-grn-banner {
      width: 100%; background: #F0FDF4; border: 1.5px solid #86EFAC; color: #15803D; padding: 14px; border-radius: 16px;
      display: none; text-align: center; font-size: 13px; font-weight: 800; animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    /* Sticky Bottom Done / Generate GRN Button */
    .pda-btn-bottom-done {
      width: 100%; height: 56px; background: #E11D48; color: #FFFFFF; border: none; border-radius: 16px;
      font-size: 16px; font-weight: 900; display: flex; align-items: center; justify-content: center; gap: 10px;
      box-shadow: 0 6px 20px rgba(225, 29, 72, 0.3); cursor: pointer; text-decoration: none; transition: all 0.15s ease;
    }
    .pda-btn-bottom-done:active { transform: translateY(2px); background: #BE123C; }

    .pda-btn-grn-green {
      width: 100%; height: 56px; background: #16A34A; color: #FFFFFF; border: none; border-radius: 16px;
      font-size: 16px; font-weight: 900; display: flex; align-items: center; justify-content: center; gap: 10px;
      box-shadow: 0 6px 20px rgba(22, 163, 74, 0.3); cursor: pointer; text-decoration: none; transition: all 0.15s ease;
    }
  </style>
</head>
<body>

<div class="pda-shell">

  <!-- Status Bar -->
  <div class="pda-status-bar">
    <span>10:30</span>
    <div style="display: flex; align-items: center; gap: 6px;">
      <i class="bi bi-reception-4"></i>
      <i class="bi bi-wifi"></i>
      <i class="bi bi-battery-full" style="font-size: 13px;"></i>
    </div>
  </div>

  @php
    $isPartial = request()->query('partial') == 1;
  @endphp

  <!-- Header Bar -->
  <div class="pda-header-row">
    <a href="{{ route('pda.receiving') }}" class="pda-header-icon"><i class="bi bi-chevron-left"></i></a>
    <div style="font-size: 16px; font-weight: 900; color: #0F172A;">{{ $isPartial ? 'Partial Receiving Completed' : 'Receiving Completed' }}</div>
    <a href="#" class="pda-header-icon" onclick="alert('Menu'); return false;"><i class="bi bi-three-dots-vertical"></i></a>
  </div>

  @php
    $po = $asn->purchase;
    $poRef = $po ? ($po->reference_code ?: ('PO-2026-' . str_pad($po->id, 6, '0', STR_PAD_LEFT))) : 'PO-2026-011147';
    if (str_starts_with($poRef, 'PU_')) {
        $poRef = 'PO-2026-' . str_pad($po->id, 6, '0', STR_PAD_LEFT);
    }
    $supplierName = $asn->supplier ? $asn->supplier->name : 'Apex Appliance Distributors';
    $inboundNo = 'INB-2026-' . str_pad($asn->id, 5, '0', STR_PAD_LEFT);
  @endphp

  <!-- Body Content -->
  <div class="pda-comp-body">

    <!-- Green or Orange Animated Tick Circle -->
    @if ($isPartial)
      <div class="pda-green-tick-circle" style="background: #F97316; box-shadow: 0 10px 25px rgba(249, 115, 22, 0.35);">
        <i class="bi bi-exclamation-lg"></i>
      </div>
    @else
      <div class="pda-green-tick-circle">
        <i class="bi bi-check-lg"></i>
      </div>
    @endif

    <div>
      <div class="pda-comp-title">{{ $isPartial ? 'Partial Receiving Logged' : 'Receiving Completed' }}</div>
      <div class="pda-comp-time">{{ date('h:i a') }} • {{ date('d M Y') }}</div>
    </div>

    <!-- Scanned LPNs Summary Row -->
    <div class="pda-lpns-row">
      <span>Scanned Line Items <span class="pda-lpn-pill">{{ count($po && $po->purchaseItems ? $po->purchaseItems : [1]) }}</span></span>
      <i class="bi bi-chevron-right"></i>
    </div>

    <!-- Details Card -->
    <div class="pda-details-card">
      <div class="pda-details-heading">Details</div>

      <div class="pda-field-block">
        <div class="pda-field-val" style="color: #16A34A;">{{ $inboundNo }} {{ $isPartial ? '(Partial Verified)' : '(Verified)' }}</div>
        <div class="pda-field-lbl">Inbound Number</div>
      </div>

      <div class="pda-field-block">
        <div class="pda-field-val">{{ $supplierName }}</div>
        <div class="pda-field-lbl">Vendor Name</div>
      </div>

      <div class="pda-field-block">
        <div class="pda-field-val">{{ $asn->asn_number }}</div>
        <div class="pda-field-lbl">ASN ID</div>
      </div>

      <div class="pda-field-block">
        <div class="pda-field-val" style="color: #2563EB;">{{ $poRef }}</div>
        <div class="pda-field-lbl">PO ID</div>
      </div>
    </div>

  </div>

  <!-- Bottom Done Action Button -->
  <div style="padding-top: 10px;">
    <a href="{{ route('pda.receiving') }}" class="pda-btn-bottom-done" style="{{ $isPartial ? 'background: #F97316; box-shadow: 0 6px 20px rgba(249, 115, 22, 0.3);' : '' }}">
      Done
    </a>
  </div>

</div>

<script>
  try {
    localStorage.removeItem("pda_rec_session_{{ $asn->id }}");
  } catch(e) {}
</script>

</body>
</html>
