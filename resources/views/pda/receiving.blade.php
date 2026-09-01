<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Warehouse Receiving — INFY-POS Scanner</title>
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
      overflow: hidden; border-radius: 40px; border: 10px solid #1E293B; position: relative; padding: 16px 20px 20px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    @media (max-width: 480px) {
      body { padding: 0; }
      .pda-shell { max-width: 100%; height: 100vh; max-height: 100vh; border-radius: 0; border: none; padding: 14px 18px 18px; }
    }

    /* Top Status Bar */
    .pda-status-bar {
      color: #0F172A; font-size: 11.5px; font-weight: 800; display: flex; justify-content: space-between; align-items: center;
      padding-bottom: 8px; margin-bottom: 2px;
    }

    /* Header Bar */
    .pda-header-row {
      display: flex; align-items: center; justify-content: space-between; padding-bottom: 12px;
      border-bottom: 1px solid #F1F5F9; margin-bottom: 18px;
    }
    .pda-header-menu-btn { color: #0F172A; font-size: 22px; text-decoration: none; display: flex; }
    .pda-header-logo-group { text-align: center; }
    .pda-brand-title { font-size: 24px; font-weight: 900; color: #16A34A; letter-spacing: -0.5px; line-height: 1; }
    .pda-brand-subtitle { font-size: 9.5px; font-weight: 800; color: #64748B; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 3px; }
    .pda-header-bell-btn { color: #0F172A; font-size: 20px; text-decoration: none; position: relative; display: flex; }

    /* Main Scrollable Area */
    .pda-content-body { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; padding-bottom: 10px; }

    /* Green Search Field with Autocomplete */
    .pda-search-wrapper { position: relative; width: 100%; margin-bottom: 4px; }
    .pda-search-icon-left { position: absolute; left: 18px; top: 17px; font-size: 22px; color: #16A34A; pointer-events: none; }
    .pda-search-input {
      width: 100%; height: 58px; border: 2px solid #16A34A; border-radius: 20px;
      padding: 0 54px 0 54px; font-size: 15px; font-weight: 800; color: #0F172A; outline: none; background: #FFFFFF;
      box-shadow: 0 4px 16px rgba(22, 163, 74, 0.08); transition: all 0.2s ease; text-transform: uppercase;
    }
    .pda-search-input::placeholder { color: #94A3B8; font-weight: 600; text-transform: none; }
    .pda-search-input:focus { box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.15); }
    .pda-scanner-icon-right { position: absolute; right: 18px; top: 16px; font-size: 24px; color: #16A34A; background: none; border: none; cursor: pointer; }

    /* Autocomplete Dropdown List */
    .pda-autocomplete-list {
      position: absolute; top: 62px; left: 0; right: 0; background: #FFFFFF; border: 1.5px solid #16A34A;
      border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); z-index: 100; max-height: 200px; overflow-y: auto; display: none;
    }
    .pda-autocomplete-item {
      padding: 12px 18px; font-size: 13.5px; font-weight: 800; color: #0F172A; border-bottom: 1px solid #F1F5F9;
      cursor: pointer; display: flex; justify-content: space-between; align-items: center;
    }
    .pda-autocomplete-item:hover { background: #F0FDF4; color: #16A34A; }
    .pda-autocomplete-item:last-child { border-bottom: none; }

    /* Main Body Illustration Area */
    .pda-illustration-body {
      flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
      padding-bottom: 20px;
    }
    .pda-package-wrapper {
      position: relative; width: 220px; height: 180px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;
    }
    .pda-circle-backdrop {
      position: absolute; width: 180px; height: 180px; border-radius: 50%; background: #F0FDF4; z-index: 1;
    }
    .pda-shelves-bg {
      position: absolute; width: 210px; height: 120px; opacity: 0.35; z-index: 2; pointer-events: none;
    }
    .pda-instruction-title { font-size: 16px; font-weight: 800; color: #0F172A; margin-bottom: 4px; line-height: 1.3; }
    .pda-instruction-sub { font-size: 13.5px; font-weight: 600; color: #64748B; }

    /* Search Result Header */
    .pda-result-head-row { display: flex; flex-direction: column; gap: 2px; margin-bottom: 2px; }
    .pda-result-title { font-size: 16px; font-weight: 900; color: #0F172A; }
    .pda-result-sub { font-size: 12px; color: #64748B; font-weight: 600; }

    /* State 1: Selected Minimal Result Card ✅ */
    .pda-selected-card {
      background: #F0FDF4; border: 2px solid #16A34A; border-radius: 20px; padding: 18px;
      box-shadow: 0 4px 16px rgba(22, 163, 74, 0.08); display: flex; flex-direction: column; gap: 14px;
    }
    .pda-card-top-header { display: flex; justify-content: space-between; align-items: center; }
    .pda-card-asn-group { display: flex; align-items: center; gap: 10px; }
    .pda-check-icon {
      width: 28px; height: 28px; border-radius: 50%; background: #16A34A; color: #FFFFFF;
      display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 900;
    }
    .pda-card-asn-id { font-size: 17px; font-weight: 900; color: #0F172A; }
    .pda-status-badge {
      font-size: 11px; font-weight: 800; background: #DCFCE7; color: #15803D; border: 1px solid #86EFAC;
      padding: 4px 10px; border-radius: 12px;
    }

    .pda-card-info-table { display: flex; flex-direction: column; gap: 11px; font-size: 13px; }
    .pda-card-info-row { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #DCFCE7; padding-bottom: 8px; }
    .pda-card-info-row:last-child { border-bottom: none; padding-bottom: 0; }
    .pda-row-label { color: #64748B; font-weight: 600; display: flex; align-items: center; gap: 8px; font-size: 12.5px; }
    .pda-row-label i { font-size: 16px; color: #16A34A; }
    .pda-row-value { color: #0F172A; font-weight: 800; text-align: right; }
    .pda-row-value-po { color: #2563EB; font-weight: 900; text-align: right; }

    /* State 2: ASN Not Created ❌ (Warning Box) */
    .pda-warning-card-red {
      background: #FFFFFF; border: 2px solid #EF4444; border-radius: 24px; padding: 28px 20px; text-align: center;
      box-shadow: 0 10px 30px rgba(239, 68, 68, 0.08); display: flex; flex-direction: column; align-items: center; gap: 12px;
    }
    .pda-warn-icon-circle-red {
      width: 64px; height: 64px; border-radius: 50%; background: #FEE2E2; color: #DC2626;
      display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 900;
    }

    /* State 3: PO Exists but ASN Missing ⚠ (Yellow Box) */
    .pda-warning-card-yellow {
      background: #FFFBEB; border: 2px solid #F59E0B; border-radius: 24px; padding: 24px 20px;
      box-shadow: 0 10px 30px rgba(245, 158, 11, 0.08); display: flex; flex-direction: column; gap: 14px;
    }

    /* Sticky Bottom Buttons */
    .pda-bottom-sticky-area { padding-top: 10px; flex-shrink: 0; }
    .pda-btn-continue-sticky {
      width: 100%; height: 58px; background: #16A34A; color: #FFFFFF; border: none; border-radius: 16px;
      font-size: 16px; font-weight: 900; display: flex; align-items: center; justify-content: center; gap: 10px;
      box-shadow: 0 6px 20px rgba(22, 163, 74, 0.3); text-decoration: none; transition: all 0.15s ease;
    }
    .pda-btn-continue-sticky:active { transform: translateY(2px); background: #15803D; }

    .pda-btn-secondary {
      width: 100%; height: 52px; background: #F1F5F9; color: #334155; border: 1.5px solid #CBD5E1; border-radius: 14px;
      font-size: 15px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none;
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

  <!-- Header Bar -->
  <div class="pda-header-row">
    <a href="{{ route('pda.dashboard') }}" class="pda-header-menu-btn" title="Back to Dashboard" style="font-size: 24px; color: #0F172A;"><i class="bi bi-arrow-left"></i></a>
    <div class="pda-header-logo-group">
      <div class="pda-brand-title">INFY-POS</div>
      <div class="pda-brand-subtitle">Warehouse Receiving</div>
    </div>
    <a href="#" class="pda-header-bell-btn" onclick="alert('3 Notifications'); return false;"><i class="bi bi-bell"></i></a>
  </div>

  <!-- Content Body -->
  <div class="pda-content-body">
    @php
      $searchQuery = $rawQuery ?? $query ?? '';
    @endphp

    <!-- Search Input Form with Autocomplete -->
    <form action="{{ route('pda.receiving') }}" method="GET" id="searchForm">
      <div class="pda-search-wrapper">
        <i class="bi bi-search pda-search-icon-left"></i>
        <input
          type="text"
          name="search"
          id="searchInput"
          class="pda-search-input"
          value="{{ $searchQuery }}"
          placeholder="Search ASN / PO / Shipment"
          autofocus
          autocomplete="off"
          oninput="handleAutocomplete(this.value)"
        >
        <button type="button" class="pda-scanner-icon-right" title="Scan Barcode with Camera" onclick="openCameraScanner()">
          <i class="bi bi-qr-code-scan"></i>
        </button>

        <!-- Live Autocomplete Dropdown List -->
        <div class="pda-autocomplete-list" id="autocompleteDropdown">
          @foreach($asns as $item)
            @php
              $poItem = $item->purchase;
              $poCode = $poItem ? ($poItem->reference_code ?: ('PO-2026-' . str_pad($poItem->id, 6, '0', STR_PAD_LEFT))) : '';
              if (str_starts_with($poCode, 'PU_')) {
                  $poCode = 'PO-2026-' . str_pad($poItem->id, 6, '0', STR_PAD_LEFT);
              }
            @endphp
            <div class="pda-autocomplete-item" onclick="selectAsn('{{ $item->asn_number }}')">
              <span>{{ $item->asn_number }}</span>
              <span style="font-size: 11px; color: #2563EB;">{{ $poCode }}</span>
            </div>
          @endforeach
        </div>
      </div>
    </form>

    @if(!empty($searchQuery))

      <!-- STATE 1: ASN EXISTS & READY ✅ -->
      @if($searchState === 'exists' && $searchResult)
        @php
          $po = $searchResult->purchase;
          $poRef = $po ? ($po->reference_code ?: ('PO-2026-' . str_pad($po->id, 6, '0', STR_PAD_LEFT))) : 'PO-2026-011147';
          if (str_starts_with($poRef, 'PU_')) {
              $poRef = 'PO-2026-' . str_pad($po->id, 6, '0', STR_PAD_LEFT);
          }
          $expectedUnits = $po && $po->purchaseItems ? $po->purchaseItems->sum('quantity') : 17;
          $supplierName = $searchResult->supplier ? $searchResult->supplier->name : 'Apex Appliance Distributors';
          $warehouseName = session('pda_warehouse', 'Main Warehouse');
          $vehicleNo = $searchResult->vehicle_number ?: 'TN03 U2104';
          $deliveryDate = \Carbon\Carbon::parse($searchResult->created_at)->format('d M Y, 12:00 AM');
        @endphp

        <div class="pda-result-head-row">
          <h3 class="pda-result-title">Search Result</h3>
          <span class="pda-result-sub">1 result found</span>
        </div>

        <div class="pda-selected-card">
          <div class="pda-card-top-header">
            <div class="pda-card-asn-group">
              <div class="pda-check-icon">✓</div>
              <div class="pda-card-asn-id">{{ $searchResult->asn_number }}</div>
            </div>
            @if($searchResult->status === 'arrived' || $searchResult->status === 'completed')
              <span class="pda-status-badge" style="background: #DCFCE7; color: #16A34A; border: 1px solid #86EFAC;">
                ✓ Already Completed
              </span>
            @elseif($searchResult->status === 'verified')
              <span class="pda-status-badge" style="background: #DCFCE7; color: #16A34A; border: 1px solid #86EFAC;">
                ✓ Scan Completed
              </span>
            @elseif($searchResult->status === 'partial')
              <span class="pda-status-badge" style="background: #FFEDD5; color: #EA580C; border: 1px solid #FFD8A8;">
                ● Partial Received
              </span>
            @else
              <span class="pda-status-badge">
                ● Ready for Receiving
              </span>
            @endif
          </div>

          <div class="pda-card-info-table">
            <div class="pda-card-info-row">
              <span class="pda-row-label"><i class="bi bi-building"></i> Supplier</span>
              <span class="pda-row-value">{{ $supplierName }}</span>
            </div>
            <div class="pda-card-info-row">
              <span class="pda-row-label"><i class="bi bi-file-earmark-text"></i> PO ID</span>
              <span class="pda-row-value-po">{{ $poRef }}</span>
            </div>
            <div class="pda-card-info-row">
              <span class="pda-row-label"><i class="bi bi-box-seam"></i> Expected Qty</span>
              <span class="pda-row-value">{{ $expectedUnits }} Units</span>
            </div>
            <div class="pda-card-info-row">
              <span class="pda-row-label"><i class="bi bi-house-door"></i> Warehouse</span>
              <span class="pda-row-value">{{ $warehouseName }}</span>
            </div>
            <div class="pda-card-info-row">
              <span class="pda-row-label"><i class="bi bi-calendar-event"></i> Expected Delivery</span>
              <span class="pda-row-value">{{ $deliveryDate }}</span>
            </div>
            <div class="pda-card-info-row">
              <span class="pda-row-label"><i class="bi bi-truck"></i> Vehicle No.</span>
              <span class="pda-row-value">{{ $vehicleNo }}</span>
            </div>
          </div>
        </div>

      <!-- STATE 3: PO EXISTS BUT ASN MISSING / PENDING ⚠ -->
      @elseif($searchState === 'pending')
        @php
          $po = $searchResult ? $searchResult->purchase : ($purch ?? null);
          $poRef = $po ? ($po->reference_code ?: ('PO-2026-' . str_pad($po->id, 6, '0', STR_PAD_LEFT))) : $searchQuery;
          if (str_starts_with($poRef, 'PU_')) {
              $poRef = 'PO-2026-' . str_pad($po->id, 6, '0', STR_PAD_LEFT);
          }
          $supplierName = $po && $po->supplier ? $po->supplier->name : 'Apex Appliance Distributors';
        @endphp

        <div class="pda-warning-card-yellow">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="font-size:26px; color:#D97706;"><i class="bi bi-exclamation-triangle-fill"></i></div>
            <div>
              <div style="font-size:16px; font-weight:900; color:#B45309;">ASN Pending</div>
              <div style="font-size:11.5px; color:#D97706; font-weight:700;">Purchase Order Found</div>
            </div>
          </div>

          <div style="background:#FFFFFF; border:1px solid #FDE68A; border-radius:14px; padding:12px; font-size:12.5px; display:flex; flex-direction:column; gap:6px;">
            <div style="display:flex; justify-content:space-between;">
              <span style="color:#64748B;">PO Number:</span>
              <strong style="color:#2563EB;">{{ $poRef }}</strong>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span style="color:#64748B;">Supplier Name:</span>
              <strong style="color:#0F172A;">{{ $supplierName }}</strong>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span style="color:#64748B;">Status:</span>
              <span style="background:#FEF3C7; color:#B45309; padding:2px 8px; border-radius:6px; font-weight:800; font-size:11px;">● ASN Not Created</span>
            </div>
          </div>

          <p style="font-size:12px; color:#78350F; font-weight:600; text-align:center; margin:0;">
            This Purchase Order exists, but the ASN has not yet been created. Receiving remains disabled.
          </p>

          <a href="{{ route('pda.receiving') }}" class="pda-btn-secondary" style="background:#F59E0B; color:#FFFFFF; border:none; border-radius:12px; font-weight:900;">
            OK
          </a>
        </div>

      <!-- STATE 2: ASN NOT CREATED / INVALID ❌ -->
      @else
        <div class="pda-warning-card-red">
          <div class="pda-warn-icon-circle-red">
            <i class="bi bi-x-lg"></i>
          </div>

          <div>
            <h3 style="font-size:18px; font-weight:900; color:#0F172A; margin-bottom:4px;">ASN Not Created</h3>
            <p style="font-size:13px; color:#64748B; font-weight:600; margin-bottom:2px;">This ASN has not been created yet.</p>
            <p style="font-size:12px; color:#EF4444; font-weight:700;">Receiving cannot continue until an ASN is created.</p>
          </div>

          <a href="{{ route('pda.receiving') }}" class="pda-btn-secondary" style="margin-top:6px;">
            <i class="bi bi-arrow-counterclockwise"></i>
            <span>Search Again</span>
          </a>
        </div>
      @endif

    @else
      <!-- DEFAULT INITIAL STATE: Clean Vector Package Graphic Illustration -->
      <div class="pda-illustration-body">
        <div class="pda-package-wrapper">
          <div class="pda-circle-backdrop"></div>
          
          <svg class="pda-shelves-bg" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 20H190M10 60H190M10 100H190" stroke="#CBD5E1" stroke-width="2" stroke-dasharray="4 4"/>
            <path d="M30 10V110M170 10V110" stroke="#94A3B8" stroke-width="2.5"/>
            <rect x="40" y="35" width="25" height="20" rx="2" fill="#E2E8F0"/>
            <rect x="135" y="75" width="25" height="20" rx="2" fill="#E2E8F0"/>
          </svg>

          <svg viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 140px; height: 140px; position: relative; z-index: 3;">
            <rect x="20" y="105" width="120" height="12" fill="#15803D" rx="2"/>
            <rect x="25" y="117" width="18" height="10" fill="#14532D" rx="2"/>
            <rect x="71" y="117" width="18" height="10" fill="#14532D" rx="2"/>
            <rect x="117" y="117" width="18" height="10" fill="#14532D" rx="2"/>
            <path d="M30 55L80 30L130 55V95L80 105L30 95V55Z" fill="#16A34A"/>
            <path d="M80 30L130 55L80 68L30 55L80 30Z" fill="#4ADE80"/>
            <path d="M80 68V105L130 95V55L80 68Z" fill="#15803D"/>
            <rect x="92" y="68" width="22" height="14" fill="#FFFFFF" rx="2"/>
            <rect x="95" y="71" width="16" height="2" fill="#0F172A"/>
            <rect x="95" y="75" width="10" height="2" fill="#0F172A"/>
            <rect x="95" y="79" width="14" height="2" fill="#0F172A"/>
          </svg>
        </div>

        <div class="pda-instruction-title">Enter or scan ASN / PO / Shipment ID</div>
        <div class="pda-instruction-sub">to get started</div>
      </div>
    @endif

  </div>

  @if(!empty($searchQuery) && $searchState === 'exists' && $searchResult)
    <!-- Sticky Bottom Continue Button (ONLY visible when State 1 ASN Exists ✅) -->
    <div class="pda-bottom-sticky-area">
      @if($searchResult->status === 'arrived' || $searchResult->status === 'completed')
        <button class="pda-btn-continue-sticky" style="background: #64748B; cursor: not-allowed; box-shadow: none; width: 100%; border: none;" disabled>
          <span>Already Completed</span>
          <i class="bi bi-check-circle-fill" style="font-size: 20px;"></i>
        </button>
      @elseif($searchResult->status === 'verified')
        <button class="pda-btn-continue-sticky" style="background: #64748B; cursor: not-allowed; box-shadow: none; width: 100%; border: none;" disabled>
          <span>Scan Completed</span>
          <i class="bi bi-check-circle-fill" style="font-size: 20px;"></i>
        </button>
      @else
        <a href="{{ route('pda.receiving.session', $searchResult->id) }}" class="pda-btn-continue-sticky">
          <span>{{ $searchResult->status === 'partial' ? 'Continue Receiving' : 'Continue' }}</span>
          <i class="bi bi-arrow-right" style="font-size: 20px;"></i>
        </a>
      @endif
    </div>
  @endif

</div>

<!-- Live Camera Barcode Scanner Modal Sheet -->
<div id="cameraScannerModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.96); backdrop-filter: blur(8px); z-index: 99999; display: none; flex-direction: column; align-items: center; justify-content: space-between; padding: 20px 16px 24px; color: #FFFFFF;">
  
  <!-- Top Bar -->
  <div style="width: 100%; max-width: 440px; display: flex; align-items: center; justify-content: space-between; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.15);">
    <div style="display: flex; align-items: center; gap: 10px;">
      <div style="width: 38px; height: 38px; border-radius: 12px; background: rgba(22, 163, 74, 0.25); color: #4ADE80; display: flex; align-items: center; justify-content: center; font-size: 20px; border: 1px solid rgba(74, 222, 128, 0.4);">
        <i class="bi bi-camera-fill"></i>
      </div>
      <div>
        <div style="font-size: 15px; font-weight: 800; color: #FFFFFF;">Camera Barcode Scanner</div>
        <div style="font-size: 11px; color: #94A3B8; font-weight: 600;">Point camera at barcode or QR code</div>
      </div>
    </div>
    <button type="button" onclick="closeCameraScanner()" style="background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); color: #FFFFFF; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; cursor: pointer;">
      <i class="bi bi-x-lg"></i>
    </button>
  </div>

  <!-- Camera Viewfinder Box -->
  <div style="position: relative; width: 100%; max-width: 380px; height: 310px; border-radius: 24px; overflow: hidden; background: #000000; border: 2px solid #22C55E; box-shadow: 0 0 35px rgba(34, 197, 94, 0.3); display: flex; align-items: center; justify-content: center;">
    
    <!-- HTML5 QRCode Video Element -->
    <div id="reader" style="width: 100%; height: 100%; object-fit: cover;"></div>

    <!-- Scanning Overlay Reticle Lines & Laser -->
    <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; display: flex; flex-direction: column; align-items: center; justify-content: center;">
      <!-- Green Target Frame -->
      <div style="position: relative; width: 240px; height: 160px; border: 2px dashed rgba(74, 222, 128, 0.85); border-radius: 16px; overflow: hidden; box-shadow: inset 0 0 20px rgba(34, 197, 94, 0.2);">
        <!-- Laser Scanner Line -->
        <div style="position: absolute; width: 100%; height: 3px; background: #22C55E; box-shadow: 0 0 15px #22C55E; top: 0; animation: pdaLaserScan 2s linear infinite;"></div>
      </div>
      <div style="font-size: 11.5px; font-weight: 700; color: #4ADE80; margin-top: 14px; background: rgba(0,0,0,0.7); padding: 5px 14px; border-radius: 12px; border: 1px solid rgba(74, 222, 128, 0.4);">
        📷 Scanning via Device Camera...
      </div>
    </div>
  </div>

  <!-- Demo Barcode Quick Selector (for Desktop / Testing) -->
  <div style="width: 100%; max-width: 440px; background: rgba(30, 41, 59, 0.85); border: 1px solid rgba(255,255,255,0.12); border-radius: 20px; padding: 14px; text-align: center;">
    <div style="font-size: 11px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
      ⚡ Desktop Quick Scan Selector
    </div>
    <div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;">
      <button type="button" onclick="simulatedScan('ASN-2026-00001')" style="background: rgba(34, 197, 94, 0.2); border: 1px solid #22C55E; color: #4ADE80; padding: 7px 14px; border-radius: 10px; font-size: 12px; font-weight: 800; cursor: pointer;">
        ⚡ ASN-2026-00001
      </button>
      <button type="button" onclick="simulatedScan('PO-2026-011101')" style="background: rgba(59, 130, 246, 0.2); border: 1px solid #3B82F6; color: #60A5FA; padding: 7px 14px; border-radius: 10px; font-size: 12px; font-weight: 800; cursor: pointer;">
        ⚡ PO-2026-011101
      </button>
      <button type="button" onclick="simulatedScan('LPN-2026-00101')" style="background: rgba(245, 158, 11, 0.2); border: 1px solid #F59E0B; color: #FBBF24; padding: 7px 14px; border-radius: 10px; font-size: 12px; font-weight: 800; cursor: pointer;">
        ⚡ LPN-2026-00101
      </button>
    </div>
  </div>

</div>

<!-- HTML5 QRCode Scanner CDN -->
<script src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"></script>

<style>
@keyframes pdaLaserScan {
  0% { top: 0; }
  50% { top: 96%; }
  100% { top: 0; }
}
</style>

<script>
  let html5QrCode = null;

  function openCameraScanner() {
    const modal = document.getElementById('cameraScannerModal');
    if (modal) modal.style.display = 'flex';

    if (typeof Html5Qrcode !== 'undefined') {
      try {
        html5QrCode = new Html5Qrcode("reader");
        const config = { fps: 15, qrbox: { width: 240, height: 160 } };
        html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            onBarcodeDetected(decodedText);
          },
          (errorMessage) => {}
        ).catch(err => {
          console.warn("Camera start failed:", err);
        });
      } catch(e) {
        console.warn("HTML5 QRCode Exception:", e);
      }
    }
  }

  function closeCameraScanner() {
    const modal = document.getElementById('cameraScannerModal');
    if (modal) modal.style.display = 'none';

    if (html5QrCode) {
      html5QrCode.stop().then(() => {
        html5QrCode.clear();
      }).catch(err => console.error(err));
    }
  }

  function onBarcodeDetected(code) {
    playScanBeep();
    closeCameraScanner();
    const input = document.getElementById('searchInput');
    if (input) {
      input.value = code;
      document.getElementById('searchForm').submit();
    }
  }

  function simulatedScan(code) {
    onBarcodeDetected(code);
  }

  function playScanBeep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch(e) {}
  }

  // Handle Autocomplete Suggestions as user types
  function handleAutocomplete(val) {
    const dropdown = document.getElementById('autocompleteDropdown');
    val = val.trim().toUpperCase();

    if (val.length >= 2) {
      dropdown.style.display = 'block';
      let count = 0;
      document.querySelectorAll('.pda-autocomplete-item').forEach(item => {
        const text = item.innerText.toUpperCase();
        if (text.includes(val)) {
          item.style.display = 'flex';
          count++;
        } else {
          item.style.display = 'none';
        }
      });
      if (count === 0) dropdown.style.display = 'none';
    } else {
      dropdown.style.display = 'none';
    }
  }

  function selectAsn(asnNumber) {
    document.getElementById('searchInput').value = asnNumber;
    document.getElementById('autocompleteDropdown').style.display = 'none';
    document.getElementById('searchForm').submit();
  }

  // Close dropdown on outside click
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.pda-search-wrapper')) {
      document.getElementById('autocompleteDropdown').style.display = 'none';
    }
  });

  // Focus input for hardware PDA laser scanner
  window.onload = function() {
    const input = document.getElementById('searchInput');
    if (input) input.focus();
  };
</script>

</body>
</html>
