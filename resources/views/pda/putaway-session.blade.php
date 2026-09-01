<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Putaway Session — INFY-POS Scanner</title>
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

    /* Header Bar */
    .pda-header-row {
      display: flex; align-items: center; justify-content: space-between; padding-bottom: 10px;
      border-bottom: 1px solid #F1F5F9; margin-bottom: 12px;
    }
    .pda-header-icon { color: #0F172A; font-size: 20px; text-decoration: none; display: flex; }
    .pda-header-logo-group { text-align: center; }
    .pda-brand-title { font-size: 22px; font-weight: 900; color: #2563EB; letter-spacing: -0.5px; line-height: 1; }
    .pda-brand-subtitle { font-size: 9.5px; font-weight: 800; color: #64748B; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 2px; }

    /* Main Scrollable Content Area */
    .pda-content-body { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding-bottom: 6px; scrollbar-width: none; }
    .pda-content-body::-webkit-scrollbar { display: none; }

    /* Inbound Info Banner Box */
    .pda-asn-banner-box {
      background: #FFFFFF; border: 1.5px solid #E2E8F0; border-radius: 16px; padding: 12px 14px;
      display: grid; grid-template-columns: 1.2fr 1.2fr 1fr; align-items: center; gap: 8px;
    }
    .pda-banner-lbl { font-size: 9.5px; font-weight: 700; color: #64748B; text-transform: uppercase; }
    .pda-banner-val { font-size: 12px; font-weight: 800; color: #0F172A; margin-top: 1px; }
    .pda-status-pill-blue {
      font-size: 10.5px; font-weight: 800; background: #DBEAFE; color: #1E40AF; border: 1px solid #BFDBFE;
      padding: 3px 8px; border-radius: 10px; text-align: center; display: inline-block;
    }
    .pda-status-pill-orange {
      font-size: 10.5px; font-weight: 800; background: #FEF3C7; color: #D97706; border: 1px solid #FDE68A;
      padding: 3px 8px; border-radius: 10px; text-align: center; display: inline-block;
    }

    /* Barcode Scan Field */
    .pda-scan-input-wrapper { position: relative; width: 100%; margin-bottom: 2px; }
    .pda-scan-icon-left { position: absolute; left: 16px; top: 16px; font-size: 20px; color: #2563EB; pointer-events: none; }
    .pda-scan-input-field {
      width: 100%; height: 54px; border: 2px solid #2563EB; border-radius: 18px;
      padding: 0 48px 0 48px; font-size: 14.5px; font-weight: 800; color: #0F172A; outline: none; background: #FFFFFF;
      box-shadow: 0 4px 16px rgba(37, 99, 235, 0.08); transition: all 0.2s ease;
    }
    .pda-scan-input-field::placeholder { color: #94A3B8; font-weight: 600; }
    .pda-scan-icon-right { position: absolute; right: 16px; top: 15px; font-size: 22px; color: #2563EB; background: none; border: none; cursor: pointer; }

    /* Section Titles */
    .pda-sec-title-row { display: flex; justify-content: space-between; align-items: center; margin-top: 2px; }
    .pda-sec-title { font-size: 11.5px; font-weight: 900; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; }

    /* No Scan Placeholder */
    .pda-no-scan-box {
      background: #F8FAFC; border: 2px dashed #CBD5E1; border-radius: 20px; padding: 28px 16px; text-align: center;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
    }

    /* Resume Banner */
    .pda-resume-banner {
      background: linear-gradient(135deg, #FFF7ED 0%, #FEF3C7 100%);
      border: 1.5px solid #FDE68A; border-radius: 14px; padding: 12px 14px;
      display: flex; align-items: center; gap: 10px;
    }

    /* Scanned Items List Cards */
    .pda-item-list-card {
      background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; padding: 10px 12px;
      display: flex; gap: 10px; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.02); margin-bottom: 8px; cursor: pointer;
      transition: all 0.15s ease;
    }
    .pda-item-list-card:active { transform: scale(0.98); }
    .pda-item-list-card.active-highlight { border: 2px solid #2563EB; background: #EFF6FF; }
    .pda-item-list-card.completed-card { border: 2px solid #10B981; background: #F0FDF4; }
    .pda-item-thumb { width: 44px; height: 44px; border-radius: 10px; object-fit: contain; border: 1px solid #E2E8F0; padding: 2px; flex-shrink: 0; }
    .pda-item-info { flex: 1; min-width: 0; }
    .pda-item-name { font-size: 13px; font-weight: 800; color: #0F172A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .pda-item-sub { font-size: 10.5px; color: #64748B; font-weight: 600; }
    .pda-item-right { text-align: right; flex-shrink: 0; }
    .pda-item-qty-lbl { font-size: 9.5px; color: #64748B; font-weight: 700; text-transform: uppercase; }
    .pda-item-qty-val { font-size: 13px; font-weight: 900; color: #2563EB; }
    .pda-badge-completed { font-size: 9.5px; font-weight: 800; background: #D1FAE5; color: #059669; padding: 2px 6px; border-radius: 6px; }
    .pda-badge-pending { font-size: 9.5px; font-weight: 800; background: #FEF3C7; color: #D97706; padding: 2px 6px; border-radius: 6px; }
    .pda-badge-partial { font-size: 9.5px; font-weight: 800; background: #DBEAFE; color: #2563EB; padding: 2px 6px; border-radius: 6px; }

    /* Totals 3-Grid Bar */
    .pda-totals-bar {
      background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 10px 8px;
      display: grid; grid-template-columns: 1fr 1fr 1fr; text-align: center; margin-top: 4px;
    }

    /* Sticky Bottom Button */
    .pda-bottom-sticky-area { padding-top: 8px; flex-shrink: 0; }
    .pda-btn-complete-sticky {
      width: 100%; height: 56px; background: #2563EB; color: #FFFFFF; border: none; border-radius: 16px;
      font-size: 15px; font-weight: 900; display: flex; align-items: center; justify-content: center; gap: 10px;
      box-shadow: 0 6px 20px rgba(37, 99, 235, 0.3); text-decoration: none; transition: all 0.15s ease;
    }
    .pda-btn-complete-sticky:active { transform: translateY(2px); background: #1D4ED8; }

    /* Toast Alert */
    .pda-toast-alert {
      position: fixed; top: 70px; left: 50%; transform: translateX(-50%); width: 90%; max-width: 380px;
      background: #EF4444; color: #FFFFFF; padding: 12px 16px; border-radius: 14px; box-shadow: 0 10px 30px rgba(239, 68, 68, 0.3);
      font-size: 13px; font-weight: 800; text-align: center; z-index: 1000; display: none; animation: popDown 0.25s ease;
    }
    @keyframes popDown { from { transform: translate(-50%, -20px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }

    /* Fullscreen Success Overlay */
    .pda-success-overlay {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      background: #FFFFFF; z-index: 2000; display: none; flex-direction: column;
      justify-content: space-between; padding: 40px 24px 24px;
    }

    /* === PRODUCT BOTTOM SHEET (slides up from bottom) === */
    .product-sheet-overlay {
      display: none;
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      width: 100vw; height: 100vh;
      background: rgba(15, 23, 42, 0);
      z-index: 99999;
      align-items: flex-end; justify-content: center;
      transition: background 0.3s ease;
    }
    .product-sheet-overlay.show-active {
      display: flex !important;
      background: rgba(15, 23, 42, 0.75) !important;
    }
    .product-sheet-container {
      background: #FFFFFF; width: 100%; max-width: 440px;
      border-radius: 32px 32px 0 0;
      padding: 20px 20px 32px;
      box-shadow: 0 -10px 40px rgba(15, 23, 42, 0.3);
      max-height: 90vh; overflow-y: auto;
      display: flex; flex-direction: column; gap: 14px;
      transform: translateY(100%);
      transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .product-sheet-container.show-active { transform: translateY(0) !important; }
    
    /* Saving indicator */
    .saving-indicator {
      display: none; position: fixed; bottom: 80px; right: 20px;
      background: #10B981; color: #fff; font-size: 11px; font-weight: 800;
      padding: 6px 12px; border-radius: 20px; z-index: 9999;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }
  </style>
</head>
<body>

<div class="pda-shell">

  <!-- Status Bar -->
  <div class="pda-status-bar">
    <span id="liveTime">10:32</span>
    <div style="display: flex; align-items: center; gap: 6px;">
      <i class="bi bi-reception-4"></i>
      <i class="bi bi-wifi"></i>
      <i class="bi bi-battery-full" style="font-size: 13px;"></i>
    </div>
  </div>

  <!-- Header Bar -->
  <div class="pda-header-row">
    <a href="{{ route('pda.putaway') }}" class="pda-header-icon"><i class="bi bi-chevron-left"></i></a>
    <div class="pda-header-logo-group">
      <div class="pda-brand-title">INFY-POS</div>
      <div class="pda-brand-subtitle">Putaway Session</div>
    </div>
    <a href="#" class="pda-header-icon" onclick="saveProgress(); return false;"><i class="bi bi-floppy"></i></a>
  </div>

  <!-- Error Toast Popup -->
  <div class="pda-toast-alert" id="toastAlert">
    <span id="toastText">Product Not Found in Selected GRN</span>
  </div>

  <!-- Content Body -->
  <div class="pda-content-body">

    @php
      $po = $asn->purchase;
      $poRef = $po ? ($po->reference_code ?: ('PO-2026-' . str_pad($po->id, 6, '0', STR_PAD_LEFT))) : 'PO-2026-000050';
      if (str_starts_with($poRef, 'PU_')) {
          $poRef = 'PO-2026-' . str_pad($po->id, 6, '0', STR_PAD_LEFT);
      }
      $inboundCode = 'INB-2026-' . str_pad($asn->id, 5, '0', STR_PAD_LEFT);
      $grnCode = 'GRN-2026-' . str_pad($asn->id + 120, 5, '0', STR_PAD_LEFT);
      $items = $po && $po->purchaseItems ? $po->purchaseItems : [];
      $isInProgress = $asn->status === 'putaway_in_progress';
    @endphp

    <!-- 1. Top Inbound Banner Box -->
    <div class="pda-asn-banner-box">
      <div>
        <div class="pda-banner-lbl">Inbound ID</div>
        <div class="pda-banner-val">{{ $inboundCode }}</div>
      </div>
      <div>
        <div class="pda-banner-lbl">GRN ID</div>
        <div class="pda-banner-val" style="color:#2563EB;">{{ $grnCode }}</div>
      </div>
      <div>
        <div class="pda-banner-lbl">Status</div>
        @if($isInProgress)
          <div class="pda-status-pill-orange">⏸ In Progress</div>
        @else
          <div class="pda-status-pill-blue">Putaway</div>
        @endif
      </div>
    </div>

    <!-- Resume Banner (shown if session had partial progress) -->
    @if($isInProgress)
    <div class="pda-resume-banner">
      <div style="width: 36px; height: 36px; background: #FDE68A; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;">⏸️</div>
      <div>
        <div style="font-size: 13px; font-weight: 900; color: #92400E;">Resume Putaway</div>
        <div style="font-size: 11px; color: #B45309; font-weight: 600; margin-top: 1px;">Previously saved progress detected. Continue scanning to complete.</div>
      </div>
    </div>
    @endif

    <!-- 2. Scan / Search Barcode Input -->
    <div class="pda-scan-input-wrapper">
      <i class="bi bi-upc-scan pda-scan-icon-left"></i>
      <input
        type="text"
        id="barcodeInput"
        class="pda-scan-input-field"
        placeholder="Scan Product Barcode"
        autofocus
        autocomplete="off"
      >
      <button type="button" class="pda-scan-icon-right" onclick="triggerDemoScan()">
        <i class="bi bi-qr-code-scan"></i>
      </button>
    </div>

    <!-- 3. ITEMS TO PUTAWAY List -->
    <div class="pda-sec-title-row">
      <span class="pda-sec-title" id="scannedSecTitle">ITEMS TO PUTAWAY ({{ count($items) }})</span>
      <span style="font-size: 10px; color: #64748B; font-weight: 700;">Tap item to scan bin</span>
    </div>

    <div style="display: flex; flex-direction: column; gap: 8px;" id="scannedItemsList">
      <!-- Populated dynamically -->
    </div>

    <!-- 4. Totals Bar -->
    <div class="pda-totals-bar">
      <div>
        <div class="pda-banner-lbl">Total Items</div>
        <div class="pda-banner-val" style="font-size: 15px;" id="totalItemsCount">0</div>
      </div>
      <div>
        <div class="pda-banner-lbl">Expected Units</div>
        <div class="pda-banner-val" style="font-size: 15px;" id="totalExpectedCount">0</div>
      </div>
      <div>
        <div class="pda-banner-lbl">Putaway Units</div>
        <div class="pda-banner-val" style="font-size: 15px; color:#2563EB;" id="totalReceivedVal">0</div>
      </div>
    </div>

  </div>

  <!-- Sticky Bottom Complete Button -->
  <div class="pda-bottom-sticky-area">
    <button type="button" class="pda-btn-complete-sticky" id="completeReceivingBtn">
      <i class="bi bi-check-circle-fill"></i>
      <span>Complete Putaway (<span id="completeBtnProgress">0 / 0</span>)</span>
    </button>
  </div>

  <!-- Fullscreen Success Overlay -->
  <div class="pda-success-overlay" id="successOverlay">
    <div style="text-align:center; margin-top:20px;">
      <div style="width:72px; height:72px; background:#D1FAE5; color:#16A34A; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:36px; margin:0 auto 16px auto; border:3px solid #A7F3D0; box-shadow:0 10px 25px rgba(22, 163, 74, 0.25);">
        ✓
      </div>
      <h2 style="font-size:22px; font-weight:900; color:#0F172A; margin-bottom:4px;">Putaway Completed</h2>
      <div style="font-size:11.5px; color:#64748B; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">{{ \Carbon\Carbon::now()->format('h:i a • d M Y') }}</div>
    </div>

    <div style="background:#F8FAFC; border:1.5px solid #E2E8F0; border-radius:24px; padding:20px 18px; display:flex; flex-direction:column; gap:12px; margin:20px 0;">
      <div style="font-size:11px; font-weight:800; color:#64748B; text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid #E2E8F0; padding-bottom:6px;">Putaway Details</div>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:12px; color:#64748B; font-weight:600;">Inbound Number</span>
        <strong style="font-size:13.5px; color:#0284C7; font-weight:900;">{{ $inboundCode }}</strong>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:12px; color:#64748B; font-weight:600;">GRN ID</span>
        <strong style="font-size:13px; color:#16A34A; font-weight:900;">{{ $grnCode }}</strong>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:12px; color:#64748B; font-weight:600;">Operator Name</span>
        <strong style="font-size:13px; color:#0F172A; font-weight:800;">{{ session('pda_emp_name', 'Manoj S') }}</strong>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:12px; color:#64748B; font-weight:600;">Total Products</span>
        <strong style="font-size:13px; color:#0F172A; font-weight:800;" id="successTotalProd">1 Products</strong>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:12px; color:#64748B; font-weight:600;">Putaway Units</span>
        <strong style="font-size:14px; color:#2563EB; font-weight:900;" id="successTotalUnits">0 / 0</strong>
      </div>
    </div>

    <div style="margin-top: auto; padding-top: 12px; width: 100%;">
      <a href="{{ route('pda.putaway') }}" class="pda-btn-complete-sticky" style="background: #2563EB; box-shadow: 0 6px 20px rgba(37, 99, 235, 0.3); text-decoration: none;" onclick="clearPutawaySession();">
        <i class="bi bi-check-circle-fill"></i>
        <span>Done</span>
      </a>
    </div>
  </div>

  <!-- ============================================================= -->
  <!-- PRODUCT BOTTOM SHEET (slides up from bottom on barcode scan) -->
  <!-- ============================================================= -->
  <div id="productSheetOverlay" class="product-sheet-overlay" onclick="handleSheetOverlayClick(event)">
    <div class="product-sheet-container" id="productSheetContainer">

      <!-- Grabber Handle -->
      <div style="width: 40px; height: 5px; background: #CBD5E1; border-radius: 3px; align-self: center; margin-bottom: 2px; flex-shrink: 0;"></div>

      <!-- Header row -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h3 style="font-size: 17px; font-weight: 900; color: #0F172A; margin-bottom: 2px;">🏗️ Verify Rack Bin Location</h3>
          <p style="font-size: 11.5px; color: #64748B; font-weight: 700; line-height: 1.4;">Scan the destination bin barcode to assign this item</p>
        </div>
        <button onclick="closeProductSheet()" style="background: #F1F5F9; border: none; border-radius: 8px; width: 32px; height: 32px; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; color: #64748B; flex-shrink: 0;">×</button>
      </div>

      <!-- Product Card inside sheet -->
      <div style="display: flex; gap: 12px; align-items: center; background: #F8FAFC; border: 1px solid #E2E8F0; padding: 12px; border-radius: 16px;">
        <img id="sheetProdImg" src="" style="width: 56px; height: 56px; border-radius: 10px; object-fit: contain; border: 1px solid #E2E8F0; background: #FFF; flex-shrink: 0;" alt="" onerror="this.src='/uploads/main_product/1116/Lays_Classic_Salted__1.jpg'">
        <div style="flex: 1; min-width: 0;">
          <div id="sheetProdName" style="font-size: 13.5px; font-weight: 800; color: #0F172A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Product Name</div>
          <div style="font-size: 11px; color: #64748B; font-weight: 600; margin-top: 2px;">
            Suggested Rack: <strong id="sheetSuggestedRack" style="color: #2563EB; font-weight: 800;">A-01-02</strong>
          </div>
          <div style="margin-top: 6px; display: flex; gap: 6px;">
            <span style="font-size: 9.5px; font-weight: 800; background: #DBEAFE; color: #1E40AF; padding: 2px 8px; border-radius: 6px;">To Putaway: <strong id="sheetProdExpected">0</strong></span>
            <span style="font-size: 9.5px; font-weight: 800; background: #D1FAE5; color: #059669; padding: 2px 8px; border-radius: 6px;">Done: <strong id="sheetProdReceived">0</strong></span>
          </div>
        </div>
      </div>

      <!-- Bin Scan Field -->
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <label style="font-size: 11px; font-weight: 800; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px;">Scan Bin Barcode</label>
        <input
          type="text"
          id="sheetBinInput"
          style="width: 100%; height: 52px; border: 2.5px solid #2563EB; border-radius: 14px; padding: 0 16px; font-size: 15px; font-weight: 800; color: #0F172A; outline: none; background: #fff;"
          placeholder="Scan / Type Bin Barcode (e.g. A-01-02)"
          autocomplete="off"
        >
        <div id="sheetBinErrorMsg" style="font-size: 11px; color: #EF4444; font-weight: 800; margin-top: 2px; display: none;"></div>
      </div>

      <!-- Action Buttons -->
      <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 4px;">
        <button type="button" class="pda-btn-complete-sticky" id="btnVerifyBinSheet" style="height: 52px; background: #10B981; box-shadow: 0 6px 20px rgba(16,185,129,0.3); border: none; border-radius: 14px; font-size: 15px;">
          <i class="bi bi-check-circle-fill"></i>
          Verify &amp; Continue
        </button>
        <button type="button" onclick="closeProductSheet()" style="border: none; background: none; font-size: 13px; font-weight: 800; color: #64748B; padding: 8px; cursor: pointer;">
          Cancel
        </button>
      </div>

    </div>
  </div>

  <!-- Saving indicator -->
  <div class="saving-indicator" id="savingIndicator">✓ Saved to Inventory</div>

</div>

<script>
  // Update live clock
  function updateClock() {
    const now = new Date();
    const h = now.getHours().toString().padStart(2,'0');
    const m = now.getMinutes().toString().padStart(2,'0');
    document.getElementById('liveTime').textContent = h + ':' + m;
  }
  updateClock();
  setInterval(updateClock, 30000);

  // ---------------------------------------------------------------
  // Product items dataset from backend
  // ---------------------------------------------------------------
  const ASN_ID = {{ $asn->id }};
  const CSRF_TOKEN = '{{ csrf_token() }}';
  const SESSION_KEY = 'pda_putaway_session_' + ASN_ID;

  const putawayItems = [
    @foreach($items as $idx => $item)
      @php
        $p = $item->product;
        $imgPath = isset($item->catalog_image) ? $item->catalog_image : '/uploads/main_product/1116/Lays_Classic_Salted__1.jpg';
      @endphp
      {
        idx: {{ $idx }},
        product_id: {{ $p ? $p->id : 0 }},
        name: "{{ addslashes($p ? $p->name : 'Product ' . ($idx+1)) }}",
        sku: "{{ $p ? $p->code : 'SKU-00' . ($idx+1) }}",
        barcode: "{{ $p ? ($p->code ?: '8901234567' . $idx) : '8901234567' . $idx }}",
        img: "{{ $imgPath }}",
        expected: {{ $item->quantity }},
        received: 0,
        rack: "A-01-02"
      },
    @endforeach
  ];

  let totalExpectedAll = 0;
  putawayItems.forEach(i => totalExpectedAll += i.expected);

  const validBins = {!! json_encode($bins) !!};

  const barcodeInput = document.getElementById('barcodeInput');
  let activeProduct = null;

  // ---------------------------------------------------------------
  // SESSION RESUME from localStorage
  // ---------------------------------------------------------------
  function loadSavedProgress() {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (!saved) return;
      const data = JSON.parse(saved);
      if (!data || !data.items) return;
      data.items.forEach(savedItem => {
        const match = putawayItems.find(i => i.sku === savedItem.sku || i.idx === savedItem.idx);
        if (match) {
          match.received = savedItem.received || 0;
          match.rack = savedItem.rack || match.rack;
        }
      });
      if (data.items.some(i => i.received > 0)) {
        showToastAlert('⏸ Resuming previous putaway session...', true);
      }
    } catch(e) {}
  }

  function saveProgress() {
    try {
      const data = {
        asn_id: ASN_ID,
        saved_at: new Date().toISOString(),
        items: putawayItems.map(i => ({ idx: i.idx, sku: i.sku, received: i.received, rack: i.rack }))
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(data));
    } catch(e) {}
  }

  function clearPutawaySession() {
    try { localStorage.removeItem(SESSION_KEY); } catch(e) {}
  }

  // ---------------------------------------------------------------
  // Render item list
  // ---------------------------------------------------------------
  function initList() {
    const listContainer = document.getElementById('scannedItemsList');
    listContainer.innerHTML = '';
    putawayItems.forEach(item => {
      const isDone = item.received >= item.expected;
      const isPartial = item.received > 0 && !isDone;
      const cardClass = isDone ? 'completed-card' : (isPartial ? '' : '');
      const badgeClass = isDone ? 'pda-badge-completed' : (isPartial ? 'pda-badge-partial' : 'pda-badge-pending');
      const badgeText = isDone ? 'Completed ✓' : (isPartial ? 'In Progress' : 'Pending');

      const cardHtml = `
        <div class="pda-item-list-card ${cardClass}" id="card-${item.idx}" onclick="selectItemFromList(${item.idx})">
          <img src="${item.img}" class="pda-item-thumb" alt="${item.name}" onerror="this.src='/uploads/main_product/1116/Lays_Classic_Salted__1.jpg'">
          <div class="pda-item-info">
            <div class="pda-item-name">${item.name}</div>
            <div class="pda-item-sub">SKU: ${item.sku} | Bin: <strong style="color:#2563EB;">${item.rack}</strong></div>
          </div>
          <div class="pda-item-right">
            <div class="pda-item-qty-lbl">QTY</div>
            <div class="pda-item-qty-val" id="listQty-${item.idx}">${item.received} / ${item.expected}</div>
            <div style="margin-top:2px;">
              <span id="badge-${item.idx}" class="${badgeClass}">${badgeText}</span>
            </div>
          </div>
        </div>
      `;
      listContainer.insertAdjacentHTML('beforeend', cardHtml);
    });
    document.getElementById('totalItemsCount').innerText = putawayItems.length;
    document.getElementById('totalExpectedCount').innerText = totalExpectedAll;
    updateTotals();
  }

  // ---------------------------------------------------------------
  // Main Barcode Input Handler
  // ---------------------------------------------------------------
  if (barcodeInput) {
    barcodeInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const code = this.value.trim();
        this.value = '';
        if (code) handleScanCode(code);
      }
    });
  }

  // Demo scan button — simulates scanning the next pending item
  function triggerDemoScan() {
    const pending = putawayItems.find(i => i.received < i.expected);
    if (pending) {
      handleScanCode(pending.barcode || pending.sku);
    } else {
      showToastAlert('✅ All items already put away!', true);
    }
  }

  // ---------------------------------------------------------------
  // Match barcode to a putaway item and open the product popup
  // ---------------------------------------------------------------
  function handleScanCode(code) {
    if (!code) return;
    const cleanCode = code.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    let matchedItem = putawayItems.find(i => {
      const b = (i.barcode || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const s = (i.sku || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const n = (i.name || '').toUpperCase();
      return b === cleanCode || s === cleanCode || (cleanCode.length > 3 && (cleanCode.includes(b) || cleanCode.includes(s) || n.includes(cleanCode)));
    });

    // Fallback to first pending item
    if (!matchedItem && putawayItems.length > 0) {
      matchedItem = putawayItems.find(i => i.received < i.expected) || putawayItems[0];
    }

    if (matchedItem) {
      if (matchedItem.received >= matchedItem.expected) {
        showToastAlert('⚠️ Already fully put away! Tap another item.', false);
        return;
      }
      activeProduct = matchedItem;
      openProductSheet(matchedItem);  // Open BOTTOM SHEET immediately
    } else {
      showToastAlert('❌ Barcode not found in this GRN: ' + code);
    }
  }

  // ---------------------------------------------------------------
  // SELECT ITEM by tapping the list card
  // ---------------------------------------------------------------
  function selectItemFromList(idx) {
    const item = putawayItems[idx];
    if (!item) return;
    if (item.received >= item.expected) {
      showToastAlert('⚠️ Already fully put away!', false);
      return;
    }
    activeProduct = item;
    
    // Highlight the card in the list
    document.querySelectorAll('.pda-item-list-card').forEach(c => c.classList.remove('active-highlight'));
    const card = document.getElementById('card-' + item.idx);
    if (card) card.classList.add('active-highlight');

    showToastAlert('📦 Selected: ' + item.name + '. Scan product barcode to start bin putaway.', true);
  }

  // ---------------------------------------------------------------
  // PRODUCT BOTTOM SHEET — slides up from bottom on barcode scan
  // ---------------------------------------------------------------
  function openProductSheet(item) {
    // Populate sheet with product data
    document.getElementById('sheetProdImg').src = item.img;
    document.getElementById('sheetProdName').innerText = item.name;
    document.getElementById('sheetSuggestedRack').innerText = item.rack;
    document.getElementById('sheetProdExpected').innerText = item.expected;
    document.getElementById('sheetProdReceived').innerText = item.received;
    document.getElementById('sheetBinErrorMsg').style.display = 'none';

    const binInput = document.getElementById('sheetBinInput');
    binInput.value = '';
    binInput.placeholder = 'Scan / Type Bin Barcode (e.g. ' + item.rack + ')';

    // Show the overlay (it's hidden by default, flex when .show-active)
    const overlay = document.getElementById('productSheetOverlay');
    const container = document.getElementById('productSheetContainer');
    overlay.style.display = 'flex';
    overlay.style.zIndex = '99999';

    // Use requestAnimationFrame to ensure display:flex is painted before we add the animation class
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.add('show-active');
        container.classList.add('show-active');
        setTimeout(() => binInput.focus(), 80);
      });
    });

    // Highlight the card in the list
    document.querySelectorAll('.pda-item-list-card').forEach(c => c.classList.remove('active-highlight'));
    const card = document.getElementById('card-' + item.idx);
    if (card) card.classList.add('active-highlight');
  }

  function closeProductSheet() {
    const overlay = document.getElementById('productSheetOverlay');
    const container = document.getElementById('productSheetContainer');
    overlay.classList.remove('show-active');
    container.classList.remove('show-active');
    setTimeout(() => {
      overlay.style.display = 'none';
      document.querySelectorAll('.pda-item-list-card').forEach(c => c.classList.remove('active-highlight'));
      if (barcodeInput) {
        barcodeInput.value = '';
        barcodeInput.focus();
      }
    }, 350);
  }

  function handleSheetOverlayClick(e) {
    if (e.target === document.getElementById('productSheetOverlay')) {
      closeProductSheet();
    }
  }

  // Sheet bin input Enter key → verify immediately
  document.getElementById('sheetBinInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      verifyBinAndSave();
    }
  });

  document.getElementById('btnVerifyBinSheet').addEventListener('click', verifyBinAndSave);

  // ---------------------------------------------------------------
  // VERIFY BIN + IMMEDIATELY SAVE TO INVENTORY (real-time)
  // ---------------------------------------------------------------
  function verifyBinAndSave() {
    if (!activeProduct) return;

    const binInput = document.getElementById('sheetBinInput');
    const binCode = binInput.value.trim().toUpperCase();
    const errMsg = document.getElementById('sheetBinErrorMsg');

    if (!binCode) {
      errMsg.textContent = '⚠️ Please scan or enter a bin barcode first.';
      errMsg.style.display = 'block';
      binInput.focus();
      return;
    }

    // Validate bin exists (only if validBins list is populated)
    if (validBins.length > 0 && !validBins.includes(binCode)) {
      errMsg.textContent = `❌ Bin "${binCode}" is not registered. Please scan a valid bin.`;
      errMsg.style.display = 'block';
      binInput.value = '';
      binInput.focus();
      return;
    }

    errMsg.style.display = 'none';

    // Update local state first (optimistic update)
    activeProduct.rack = binCode;
    if (activeProduct.received < activeProduct.expected) {
      activeProduct.received += 1;
    }

    // Update list card
    updateScannedListCard(activeProduct);
    updateTotals();
    saveProgress();

    // Close sheet immediately for snappy UX
    closeProductSheet();

    // REAL-TIME API CALL — save ONE unit to bin_inventories immediately!
    fetch('/api/warehouse-bins/putaway-one', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': CSRF_TOKEN
      },
      body: JSON.stringify({
        sku: activeProduct.sku,
        barcode: activeProduct.barcode,
        bin_code: binCode,
        quantity: 1,
        asn_id: ASN_ID
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        showSavingIndicator('✓ Saved to Inventory — ' + binCode);
        showToastAlert('✅ Bin ' + binCode + ' verified! Stock saved.', true);
      } else {
        showToastAlert('⚠️ ' + (data.message || 'Could not save to bin'), false);
      }
    })
    .catch(err => {
      console.error('Putaway-one error:', err);
      showToastAlert('⚠️ Network error. Progress saved locally.', false);
    });
  }

  function showSavingIndicator(msg) {
    const el = document.getElementById('savingIndicator');
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 2500);
  }

  // ---------------------------------------------------------------
  // Update UI
  // ---------------------------------------------------------------
  function updateScannedListCard(item) {
    const qtyEl = document.getElementById('listQty-' + item.idx);
    const badge = document.getElementById('badge-' + item.idx);
    const card = document.getElementById('card-' + item.idx);
    if (qtyEl) qtyEl.innerText = item.received + ' / ' + item.expected;
    if (badge) {
      if (item.received >= item.expected) {
        badge.className = 'pda-badge-completed';
        badge.innerText = 'Completed ✓';
        if (card) card.classList.add('completed-card');
      } else if (item.received > 0) {
        badge.className = 'pda-badge-partial';
        badge.innerText = 'In Progress';
      } else {
        badge.className = 'pda-badge-pending';
        badge.innerText = 'Pending';
      }
    }
  }

  function updateTotals() {
    let totalPut = 0;
    putawayItems.forEach(i => totalPut += i.received);
    document.getElementById('totalReceivedVal').innerText = totalPut;
    document.getElementById('completeBtnProgress').innerText = `${totalPut} / ${totalExpectedAll}`;
    if (totalPut === totalExpectedAll && totalExpectedAll > 0) {
      document.getElementById('completeReceivingBtn').style.background = '#10B981';
      document.getElementById('completeReceivingBtn').style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.3)';
    }
  }

  function showToastAlert(msg, isSuccess = false) {
    const toast = document.getElementById('toastAlert');
    const txt = document.getElementById('toastText');
    txt.innerText = msg;
    toast.style.background = isSuccess ? '#10B981' : '#EF4444';
    toast.style.boxShadow = isSuccess ? '0 10px 30px rgba(16, 185, 129, 0.3)' : '0 10px 30px rgba(239, 68, 68, 0.3)';
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 2800);
  }

  // ---------------------------------------------------------------
  // COMPLETE PUTAWAY BUTTON — finalizes and marks ASN as completed
  // ---------------------------------------------------------------
  document.getElementById('completeReceivingBtn').addEventListener('click', function(e) {
    e.preventDefault();
    let totalPut = 0;
    putawayItems.forEach(i => totalPut += i.received);

    if (totalPut === 0) {
      alert('Please put away at least one item first.');
      return;
    }

    if (totalPut < totalExpectedAll) {
      if (!confirm('Some items are not yet put away (' + totalPut + '/' + totalExpectedAll + '). Complete partial putaway?')) {
        return;
      }
    }

    // Mark ASN as fully completed via API
    fetch('/api/warehouse-bins/complete-putaway', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': CSRF_TOKEN
      },
      body: JSON.stringify({
        asn_id: ASN_ID,
        items: putawayItems
      })
    })
    .then(res => res.json())
    .then(data => {
      showSuccessScreen(totalPut);
      clearPutawaySession();
    })
    .catch(err => {
      console.error(err);
      alert('Error completing putaway session. Please try again.');
    });
  });

  function showSuccessScreen(totalPut) {
    document.getElementById('successTotalProd').innerText = putawayItems.length + ' Products';
    document.getElementById('successTotalUnits').innerText = `${totalPut} / ${totalExpectedAll} Units`;
    document.getElementById('successOverlay').style.display = 'flex';
  }

  // ---------------------------------------------------------------
  // INIT
  // ---------------------------------------------------------------
  window.onload = function() {
    loadSavedProgress();
    initList();
    if (barcodeInput) barcodeInput.focus();
  };
</script>

</body>
</html>
