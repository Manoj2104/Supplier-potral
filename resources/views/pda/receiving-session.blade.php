<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Receiving Scan — INFY-POS Scanner</title>
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
    .pda-brand-title { font-size: 22px; font-weight: 900; color: #16A34A; letter-spacing: -0.5px; line-height: 1; }
    .pda-brand-subtitle { font-size: 9.5px; font-weight: 800; color: #64748B; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 2px; }

    /* Main Scrollable Content Area */
    .pda-content-body { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding-bottom: 6px; scrollbar-width: none; }
    .pda-content-body::-webkit-scrollbar { display: none; }

    /* ASN Info Banner Box (3 Columns) */
    .pda-asn-banner-box {
      background: #FFFFFF; border: 1.5px solid #E2E8F0; border-radius: 16px; padding: 12px 14px;
      display: grid; grid-template-columns: 1.2fr 1.2fr 1fr; align-items: center; gap: 8px;
    }
    .pda-banner-lbl { font-size: 9.5px; font-weight: 700; color: #64748B; text-transform: uppercase; }
    .pda-banner-val { font-size: 12px; font-weight: 800; color: #0F172A; margin-top: 1px; }
    .pda-status-pill-green {
      font-size: 10.5px; font-weight: 800; background: #DCFCE7; color: #16A34A; border: 1px solid #86EFAC;
      padding: 3px 8px; border-radius: 10px; text-align: center; display: inline-block;
    }

    /* Barcode Scan Field */
    .pda-scan-input-wrapper { position: relative; width: 100%; margin-bottom: 2px; }
    .pda-scan-icon-left { position: absolute; left: 16px; top: 16px; font-size: 20px; color: #16A34A; pointer-events: none; }
    .pda-scan-input-field {
      width: 100%; height: 54px; border: 2px solid #16A34A; border-radius: 18px;
      padding: 0 48px 0 48px; font-size: 14.5px; font-weight: 800; color: #0F172A; outline: none; background: #FFFFFF;
      box-shadow: 0 4px 16px rgba(22, 163, 74, 0.08); transition: all 0.2s ease;
    }
    .pda-scan-input-field::placeholder { color: #94A3B8; font-weight: 600; }
    .pda-scan-icon-right { position: absolute; right: 16px; top: 15px; font-size: 22px; color: #16A34A; background: none; border: none; cursor: pointer; }

    /* Section Titles */
    .pda-sec-title-row { display: flex; justify-content: space-between; align-items: center; margin-top: 2px; }
    .pda-sec-title { font-size: 11.5px; font-weight: 900; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; }
    .pda-sec-action-link { font-size: 11.5px; font-weight: 800; color: #16A34A; text-decoration: none; cursor: pointer; }

    /* No Scan Placeholder State */
    .pda-no-scan-box {
      background: #F8FAFC; border: 2px dashed #CBD5E1; border-radius: 20px; padding: 28px 16px; text-align: center;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
    }

    /* Current Active Product Card (Hidden until barcode scanned) */
    .pda-current-prod-card {
      background: #FFFFFF; border: 1.5px solid #E2E8F0; border-radius: 20px; padding: 14px;
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.03); display: none; flex-direction: column; gap: 10px;
    }
    .pda-prod-top-row { display: flex; gap: 12px; align-items: flex-start; }
    .pda-prod-img-box {
      width: 80px; height: 80px; border-radius: 14px; object-fit: contain; border: 1px solid #E2E8F0;
      background: #FFFFFF; padding: 4px; flex-shrink: 0;
    }
    .pda-prod-title-text { font-size: 15px; font-weight: 900; color: #0F172A; line-height: 1.25; margin-bottom: 4px; }
    .pda-valid-badge {
      font-size: 10px; font-weight: 800; background: #DCFCE7; color: #16A34A; border: 1px solid #86EFAC;
      padding: 2px 8px; border-radius: 8px; float: right; display: inline-flex; align-items: center; gap: 3px;
    }

    .pda-prod-meta { font-size: 11.5px; color: #64748B; font-weight: 600; display: flex; flex-direction: column; gap: 2px; }
    .pda-prod-sku-tag { color: #16A34A; font-weight: 800; }

    /* 3-Grid Qtys */
    .pda-qty-3grid {
      display: grid; grid-template-columns: 1fr 1fr 1fr; text-align: center; background: #F8FAFC;
      border-radius: 12px; padding: 10px 4px; margin-top: 2px; border: 1px solid #F1F5F9;
    }
    .pda-qty-num { font-size: 18px; font-weight: 900; color: #0F172A; }
    .pda-qty-num-green { color: #16A34A; }
    .pda-qty-lbl { font-size: 9.5px; font-weight: 700; color: #64748B; text-transform: uppercase; margin-bottom: 2px; }

    /* Progress Track */
    .pda-progress-track { width: 100%; height: 8px; background: #E2E8F0; border-radius: 4px; overflow: hidden; margin-top: 4px; }
    .pda-progress-fill { height: 100%; background: #16A34A; width: 0%; transition: width 0.3s ease; border-radius: 4px; }
    .pda-progress-txt { font-size: 11px; font-weight: 700; color: #64748B; margin-top: 3px; }

    .pda-location-row { font-size: 12px; font-weight: 800; color: #0F172A; display: flex; align-items: center; gap: 6px; padding-top: 4px; border-top: 1px solid #F1F5F9; }

    /* Scanned Items List Cards */
    .pda-item-list-card {
      background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; padding: 10px 12px;
      display: flex; gap: 10px; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.02); margin-bottom: 8px; cursor: pointer;
    }
    .pda-item-thumb { width: 44px; height: 44px; border-radius: 10px; object-fit: contain; border: 1px solid #E2E8F0; padding: 2px; flex-shrink: 0; }
    .pda-item-info { flex: 1; min-width: 0; }
    .pda-item-name { font-size: 13px; font-weight: 800; color: #0F172A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .pda-item-sub { font-size: 10.5px; color: #64748B; font-weight: 600; }
    .pda-item-right { text-align: right; flex-shrink: 0; }
    .pda-item-qty-lbl { font-size: 9.5px; color: #64748B; font-weight: 700; text-transform: uppercase; }
    .pda-item-qty-val { font-size: 13px; font-weight: 900; color: #16A34A; }
    .pda-badge-completed { font-size: 9.5px; font-weight: 800; background: #DCFCE7; color: #16A34A; padding: 2px 6px; border-radius: 6px; }
    .pda-badge-pending { font-size: 9.5px; font-weight: 800; background: #FEF3C7; color: #D97706; padding: 2px 6px; border-radius: 6px; }

    /* Totals 3-Grid Bar */
    .pda-totals-bar {
      background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 10px 8px;
      display: grid; grid-template-columns: 1fr 1fr 1fr; text-align: center; margin-top: 4px;
    }

    /* Sticky Bottom Button */
    .pda-bottom-sticky-area { padding-top: 8px; flex-shrink: 0; }
    .pda-btn-complete-sticky {
      width: 100%; height: 56px; background: #16A34A; color: #FFFFFF; border: none; border-radius: 16px;
      font-size: 15px; font-weight: 900; display: flex; align-items: center; justify-content: center; gap: 10px;
      box-shadow: 0 6px 20px rgba(22, 163, 74, 0.3); text-decoration: none; transition: all 0.15s ease;
    }
    .pda-btn-complete-sticky:active { transform: translateY(2px); background: #15803D; }

    /* Alert Popups */
    .pda-toast-alert {
      position: fixed; top: 70px; left: 50%; transform: translateX(-50%); width: 90%; max-width: 380px;
      background: #EF4444; color: #FFFFFF; padding: 12px 16px; border-radius: 14px; box-shadow: 0 10px 30px rgba(239, 68, 68, 0.3);
      font-size: 13px; font-weight: 800; text-align: center; z-index: 1000; display: none; animation: popDown 0.25s ease;
    }
    @keyframes popDown { from { transform: translate(-50%, -20px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
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
    <a href="{{ route('pda.receiving') }}" class="pda-header-icon"><i class="bi bi-chevron-left"></i></a>
    <div class="pda-header-logo-group">
      <div class="pda-brand-title">INFY-POS</div>
      <div class="pda-brand-subtitle">Receiving</div>
    </div>
    <a href="#" class="pda-header-icon" onclick="alert('Receiving Menu Options'); return false;"><i class="bi bi-three-dots-vertical"></i></a>
  </div>

  <!-- Error Toast Popup -->
  <div class="pda-toast-alert" id="toastAlert">
    <span id="toastText">Product Not Found in Selected ASN</span>
  </div>

  <!-- Content Body -->
  <div class="pda-content-body">

    @php
      $po = $asn->purchase;
      $poRef = $po ? ($po->reference_code ?: ('PO-2026-' . str_pad($po->id, 6, '0', STR_PAD_LEFT))) : 'PO-2026-011147';
      if (str_starts_with($poRef, 'PU_')) {
          $poRef = 'PO-2026-' . str_pad($po->id, 6, '0', STR_PAD_LEFT);
      }
      $items = $po && $po->purchaseItems ? $po->purchaseItems : [];
    @endphp

    <!-- 1. Top ASN Banner Box -->
    <div class="pda-asn-banner-box">
      <div>
        <div class="pda-banner-lbl">ASN</div>
        <div class="pda-banner-val">{{ $asn->asn_number }}</div>
      </div>
      <div>
        <div class="pda-banner-lbl">PO</div>
        <div class="pda-banner-val" style="color:#2563EB;">{{ $poRef }}</div>
      </div>
      <div>
        <div class="pda-banner-lbl">Status</div>
        <div class="pda-status-pill-green">Receiving</div>
      </div>
    </div>

    <!-- 2. Scan / Search Barcode Input -->
    <div class="pda-scan-input-wrapper">
      <i class="bi bi-search pda-scan-icon-left"></i>
      <input
        type="text"
        id="barcodeInput"
        class="pda-scan-input-field"
        placeholder="Scan LPN Barcode or Product SKU..."
        autofocus
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
        data-pda-scan-input="true"
      >
      <button type="button" class="pda-scan-icon-right" onclick="triggerBarcodeScan()">
        <i class="bi bi-qr-code-scan"></i>
      </button>
    </div>

    <!-- 3. CURRENT PRODUCT Section -->
    <div class="pda-sec-title">CURRENT PRODUCT / LPN CARTON</div>

    <!-- Initial Placeholder State (Before Barcode Scan) -->
    <div class="pda-no-scan-box" id="noScanPlaceholder">
      <i class="bi bi-upc-scan" style="font-size:36px; color:#16A34A; margin-bottom:6px;"></i>
      <div style="font-size:14px; font-weight:800; color:#0F172A;">Ready for Scanning</div>
      <div style="font-size:12px; color:#64748B; margin-top:2px;">Scan LPN Barcode (e.g. LPN-20260803-000001) or Product SKU to inspect & receive</div>
    </div>

    <!-- Active Product Card (Revealed AFTER barcode scan) -->
    <div class="pda-current-prod-card" id="currentProductCard">
      <div class="pda-prod-top-row">
        <img src="" alt="Product Image" id="currentImg" class="pda-prod-img-box" onError="this.src='/uploads/main_product/1116/Lays_Classic_Salted__1.jpg'">
        <div style="flex:1; min-width:0;">
          <span class="pda-valid-badge"><i class="bi bi-check-circle-fill"></i> Valid Item</span>
          <div class="pda-prod-title-text" id="currentTitle">Product Name</div>
          <div class="pda-prod-meta">
            <span>SKU: <strong class="pda-prod-sku-tag" id="currentSku">SKU-001</strong></span>
            <span>Barcode: <strong id="currentBarcode">8901234567890</strong></span>
          </div>
        </div>
      </div>

      <!-- 3 Qtys Breakdown -->
      <div class="pda-qty-3grid">
        <div>
          <div class="pda-qty-lbl">Expected Qty</div>
          <div class="pda-qty-num" id="currentExpectedNum">0</div>
        </div>
        <div>
          <div class="pda-qty-lbl">Received Qty</div>
          <div class="pda-qty-num pda-qty-num-green" id="currentReceivedNum">0</div>
        </div>
        <div>
          <div class="pda-qty-lbl">Remaining</div>
          <div class="pda-qty-num" id="currentRemainingNum">0</div>
        </div>
      </div>

      <!-- Visual Progress Bar -->
      <div>
        <div class="pda-progress-track">
          <div class="pda-progress-fill" id="currentProgressFill" style="width: 0%;"></div>
        </div>
        <div class="pda-progress-txt" id="currentProgressTxt">Progress: 0 / 0 (0%)</div>
      </div>

      <div class="pda-location-row">
        <i class="bi bi-geo-alt-fill" style="color:#16A34A;"></i>
        <span>Location: <strong style="color:#16A34A;">WH-A-01</strong></span>
      </div>
    </div>

    <!-- 4. ITEMS TO RECEIVE / SCANNED ITEMS Section -->
    <div class="pda-sec-title-row">
      <div class="pda-sec-title" id="scannedSecTitle">ITEMS TO RECEIVE ({{ count($items) }})</div>
      <span class="pda-sec-action-link" onclick="clearScannedProgress()"><i class="bi bi-trash3"></i> Reset</span>
    </div>

    <!-- Scanned Items List Container -->
    <div id="scannedItemsListContainer">
      @foreach($items as $idx => $item)
        @php
          $p = $item->product;
          $pName = $p ? $p->name : 'Product #' . ($idx+1);
          $pCode = $p ? $p->code : 'SKU-00' . ($idx+1);
          $pBarcode = $p ? ($p->code ?: '8901234567' . $idx) : '8901234567' . $idx;
          $pImg = isset($item->catalog_image) ? $item->catalog_image : asset('uploads/main_product/1116/Lays_Classic_Salted__1.jpg');
          $pExpected = $item->quantity;
        @endphp

        <div class="pda-item-list-card" id="itemCard_{{ $idx }}" onclick="fillBarcodeField('{{ $pBarcode }}')">
          <img src="{{ $pImg }}" alt="{{ $pName }}" class="pda-item-thumb" onError="this.src='/uploads/main_product/1116/Lays_Classic_Salted__1.jpg'">
          <div class="pda-item-info">
            <div class="pda-item-name">{{ $pName }}</div>
            <div class="pda-item-sub">SKU: {{ $pCode }} | {{ $pBarcode }}</div>
          </div>
          <div class="pda-item-right">
            <div class="pda-item-qty-lbl">Qty</div>
            <div class="pda-item-qty-val"><span id="itemRecQty_{{ $idx }}">0</span> / {{ $pExpected }}</div>
            <span class="pda-badge-pending" id="itemBadge_{{ $idx }}">Pending</span>
          </div>
        </div>
      @endforeach
    </div>

    <!-- 5. Totals Bar -->
    @php
      $totalItems = count($items) ?: 1;
      $totalExpectedQty = $po && $po->purchaseItems ? $po->purchaseItems->sum('quantity') : 7;
    @endphp

    <div class="pda-totals-bar">
      <div>
        <div style="font-size:9.5px; color:#64748B; font-weight:700; text-transform:uppercase;">Total Items</div>
        <div style="font-size:16px; font-weight:900; color:#0F172A;" id="totalItemsVal">{{ $totalItems }}</div>
      </div>
      <div>
        <div style="font-size:9.5px; color:#64748B; font-weight:700; text-transform:uppercase;">Total Expected Qty</div>
        <div style="font-size:16px; font-weight:900; color:#0F172A;" id="totalExpectedVal">{{ $totalExpectedQty }}</div>
      </div>
      <div>
        <div style="font-size:9.5px; color:#64748B; font-weight:700; text-transform:uppercase;">Total Received Qty</div>
        <div style="font-size:16px; font-weight:900; color:#16A34A;" id="totalReceivedVal">0</div>
      </div>
    </div>

  </div>

  <!-- Sticky Complete Receiving Button -->
  <div class="pda-bottom-sticky-area">
    <a href="{{ route('pda.receiving.complete', $asn->id) }}" class="pda-btn-complete-sticky" id="completeReceivingBtn">
      <i class="bi bi-box-seam-fill" style="font-size:20px;"></i>
      <span>Complete Receiving (<span id="completeBtnProgress">0 / {{ $totalExpectedQty }}</span>)</span>
    </a>
  </div>

</div>

<script>
  // Products Data Store
  const asnItems = [
    @foreach($items as $idx => $item)
      @php
        $p = $item->product;
      @endphp
      {
        idx: {{ $idx }},
        name: "{{ addslashes($p ? $p->name : 'Item ' . ($idx+1)) }}",
        sku: "{{ $p ? $p->code : 'SKU-00' . ($idx+1) }}",
        barcode: "{{ $p ? ($p->code ?: '8901234567' . $idx) : '8901234567' . $idx }}",
        img: "{{ isset($item->catalog_image) ? $item->catalog_image : asset('uploads/main_product/1116/Lays_Classic_Salted__1.jpg') }}",
        expected: {{ $item->quantity }},
        received: 0
      },
    @endforeach
  ];

  let activeScanned = false;
  const totalExpectedAll = {{ $totalExpectedQty }};
  const barcodeInput = document.getElementById('barcodeInput');

  function saveCurrentSessionState() {
    try {
      const savedMap = {};
      asnItems.forEach(item => {
        savedMap[item.sku] = item.received;
        savedMap[item.barcode] = item.received;
      });
      localStorage.setItem("pda_rec_session_{{ $asn->id }}", JSON.stringify(savedMap));
    } catch(e) {}
  }

  // Restore previously saved scan quantities when returning to session
  try {
    const savedSession = localStorage.getItem("pda_rec_session_{{ $asn->id }}");
    if (savedSession) {
      const savedMap = JSON.parse(savedSession);
      let lastScannedItem = null;

      asnItems.forEach(item => {
        const savedRec = savedMap[item.sku] !== undefined ? savedMap[item.sku] : savedMap[item.barcode];
        if (savedRec !== undefined && savedRec !== null) {
          item.received = Math.min(item.expected, Number(savedRec));
          if (item.received > 0) {
            lastScannedItem = item;
          }
        }
      });

      // Update scanned list cards and totals bar on page load
      asnItems.forEach(item => updateScannedListCard(item));
      updateTotalsSummary();

      if (lastScannedItem) {
        document.getElementById('noScanPlaceholder').style.display = 'none';
        document.getElementById('currentProductCard').style.display = 'flex';
        updateActiveProductCard(lastScannedItem);
      }
    }
  } catch(e) {
    console.log("Error restoring saved receiving session:", e);
  }

  // Handle Hardware Laser Scan / Typing Enter
  if (barcodeInput) {
    barcodeInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const val = barcodeInput.value.trim();
        barcodeInput.value = '';
        if (val) processScanInput(val);
        // Keep focus on scan input
        setTimeout(() => barcodeInput.focus(), 50);
      }
    });
  }

  function triggerBarcodeScan() {
    if (asnItems.length > 0) {
      // Simulate hardware scan of first pending item
      const pendingItem = asnItems.find(i => i.received < i.expected) || asnItems[0];
      processScanInput(pendingItem.barcode);
    }
  }

  function processScanInput(scannedCode) {
    if (!scannedCode) return;

    // Match scanned barcode or SKU against ASN items list
    let matchedItem = asnItems.find(i => i.barcode.toLowerCase() === scannedCode.toLowerCase() || i.sku.toLowerCase() === scannedCode.toLowerCase());

    if (!matchedItem) {
      if (window.InfyPdaRealtime) InfyPdaRealtime.beepError();
      showToastAlert("⛔ Product Not Found in Selected ASN");
      return;
    }

    // Check if expected quantity already fully received
    if (matchedItem.received >= matchedItem.expected) {
      if (window.InfyPdaRealtime) InfyPdaRealtime.beepWarning();
      showToastAlert("⚠️ Quantity Already Received for this product");
      return;
    }

    // Audio + visual success feedback
    if (window.InfyPdaRealtime) InfyPdaRealtime.beepSuccess();
    const scanWrapper = document.querySelector('.pda-scan-input-wrapper');
    if (scanWrapper && window.InfyPdaRealtime) InfyPdaRealtime.flashResult(scanWrapper, true);

    // Increment received quantity automatically
    matchedItem.received += 1;

    // Save state persistently
    saveCurrentSessionState();

    // Hide placeholder & reveal CURRENT PRODUCT card
    document.getElementById('noScanPlaceholder').style.display = 'none';
    document.getElementById('currentProductCard').style.display = 'flex';

    // Update active current product card UI
    updateActiveProductCard(matchedItem);

    // Update scanned items list card UI
    updateScannedListCard(matchedItem);

    // Update totals bar UI
    updateTotalsSummary();

    // Broadcast real-time live sync event to Desktop Monitoring Page
    sendLiveBroadcast(matchedItem, 'scan');

    // Keep focus on barcode input
    if (barcodeInput) setTimeout(() => barcodeInput.focus(), 80);
  }

  function sendLiveBroadcast(item, eventType = 'scan') {
    let totalRec = 0;
    asnItems.forEach(i => totalRec += i.received);

    fetch("{{ route('pda.receiving.live-sync') }}", {
      method: "POST",
      headers: {
        "X-CSRF-TOKEN": "{{ csrf_token() }}",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        asn_id: {{ $asn->id }},
        event_type: eventType,
        item_data: item,
        items_list: asnItems,
        totals: {
          scanned_items: asnItems.filter(i => i.received > 0).length,
          total_items: asnItems.length,
          total_expected: totalExpectedAll,
          total_received: totalRec,
          remaining_qty: Math.max(0, totalExpectedAll - totalRec)
        }
      })
    }).catch(err => console.log('Live sync broadcast:', err));
  }

  function updateActiveProductCard(item) {
    document.getElementById('currentTitle').innerText = item.name;
    document.getElementById('currentSku').innerText = item.sku;
    document.getElementById('currentBarcode').innerText = item.barcode;
    document.getElementById('currentImg').src = item.img;
    document.getElementById('currentExpectedNum').innerText = item.expected;
    document.getElementById('currentReceivedNum').innerText = item.received;

    const remaining = Math.max(0, item.expected - item.received);
    document.getElementById('currentRemainingNum').innerText = remaining;

    const pct = Math.round((item.received / item.expected) * 100);
    document.getElementById('currentProgressFill').style.width = pct + '%';
    document.getElementById('currentProgressTxt').innerText = `Progress: ${item.received} / ${item.expected} (${pct}%)`;
  }

  function updateScannedListCard(item) {
    document.getElementById(`itemRecQty_${item.idx}`).innerText = item.received;
    const badge = document.getElementById(`itemBadge_${item.idx}`);
    if (item.received >= item.expected) {
      badge.className = "pda-badge-completed";
      badge.innerText = "Completed";
    } else {
      badge.className = "pda-badge-pending";
      badge.innerText = "Pending";
    }
  }

  function fillBarcodeField(barcode) {
    if (barcodeInput) {
      barcodeInput.value = barcode;
      barcodeInput.focus();
    }
  }

  function updateTotalsSummary() {
    let totalRec = 0;
    let totalScannedItems = 0;
    asnItems.forEach(i => {
      totalRec += i.received;
      if (i.received > 0) totalScannedItems++;
    });

    document.getElementById('totalReceivedVal').innerText = totalRec;
    document.getElementById('completeBtnProgress').innerText = `${totalRec} / ${totalExpectedAll}`;

    const titleElem = document.getElementById('scannedSecTitle');
    if (titleElem) {
      if (totalRec > 0) {
        titleElem.innerText = `SCANNED ITEMS (${totalScannedItems})`;
      } else {
        titleElem.innerText = `ITEMS TO RECEIVE (${asnItems.length})`;
      }
    }
  }

  function clearScannedProgress() {
    if (confirm("Reset all scanned quantities for this session?")) {
      asnItems.forEach(i => {
        i.received = 0;
        updateScannedListCard(i);
      });
      try {
        localStorage.removeItem("pda_rec_session_{{ $asn->id }}");
      } catch(e) {}
      document.getElementById('noScanPlaceholder').style.display = 'flex';
      document.getElementById('currentProductCard').style.display = 'none';
      updateTotalsSummary();
    }
  }

  function showToastAlert(msg) {
    const toast = document.getElementById('toastAlert');
    document.getElementById('toastText').innerText = msg;
    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 2800);
  }

  document.getElementById('completeReceivingBtn').addEventListener('click', function(e) {
    e.preventDefault();
    let totalRec = 0;
    asnItems.forEach(i => totalRec += i.received);

    if (totalRec < totalExpectedAll) {
      openDiscrepancyModal();
    } else {
      window.location.href = this.getAttribute('href');
    }
  });

  function openDiscrepancyModal() {
    const listContainer = document.getElementById('discrepancyItemsList');
    listContainer.innerHTML = '';
    
    // Find all items that are missing some quantity
    const missingItems = asnItems.filter(i => i.received < i.expected);
    
    missingItems.forEach(item => {
      const missingQty = item.expected - item.received;
      const itemHtml = `
        <div style="border: 1.5px solid #E2E8F0; border-radius: 18px; padding: 14px; display: flex; flex-direction: column; gap: 12px; background: #FFFFFF;" class="discrepancy-item-row" data-idx="${item.idx}">
          
          <!-- Product Row Header (Matching Ref Image 2 Layout) -->
          <div style="display: flex; gap: 12px; align-items: center; border-bottom: 1px dashed #E2E8F0; padding-bottom: 10px;">
            <img src="${item.img}" alt="${item.name}" style="width: 48px; height: 48px; border-radius: 12px; object-fit: contain; border: 1px solid #E2E8F0; padding: 2px; flex-shrink: 0;" onError="this.src='/uploads/main_product/1116/Lays_Classic_Salted__1.jpg'">
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 13.5px; font-weight: 800; color: #0F172A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.3;">
                ${item.name}
              </div>
              <div style="font-size: 10.5px; color: #64748B; font-weight: 600; margin-top: 2px;">
                SKU: ${item.sku} | Barcode: ${item.barcode}
              </div>
            </div>
            <div style="text-align: right; flex-shrink: 0;">
              <div style="font-size: 9px; color: #64748B; font-weight: 700; text-transform: uppercase;">QTY</div>
              <div style="font-size: 13px; font-weight: 900; color: #16A34A;">${item.received} / ${item.expected}</div>
              <span style="font-size: 9px; font-weight: 800; background: #FFF1F2; color: #E11D48; padding: 1px 6px; border-radius: 4px; display: inline-block; margin-top: 2px;">-${missingQty} Missing</span>
            </div>
          </div>
          
          <!-- Reason Inputs -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <label style="font-size: 9.5px; font-weight: 800; color: #64748B; text-transform: uppercase; display: block; margin-bottom: 2px;">Damaged Qty</label>
              <input type="number" class="damaged-input" min="0" max="${missingQty}" value="0" onchange="validateDiscrepancyQty(this, ${missingQty})" style="width: 100%; height: 38px; border: 1.5px solid #E2E8F0; border-radius: 8px; text-align: center; font-weight: 800;" />
            </div>
            <div>
              <label style="font-size: 9.5px; font-weight: 800; color: #64748B; text-transform: uppercase; display: block; margin-bottom: 2px;">Shortage Qty</label>
              <input type="number" class="shortage-input" min="0" max="${missingQty}" value="${missingQty}" onchange="validateDiscrepancyQty(this, ${missingQty})" style="width: 100%; height: 38px; border: 1.5px solid #E2E8F0; border-radius: 8px; text-align: center; font-weight: 800;" />
            </div>
          </div>
          
          <div style="margin-top: 2px;">
            <label style="font-size: 9.5px; font-weight: 800; color: #64748B; text-transform: uppercase; display: block; margin-bottom: 2px;">Remarks / Notes</label>
            <input type="text" class="reason-notes-input" placeholder="e.g., Short shipment / Damaged package" style="width: 100%; height: 38px; border: 1.5px solid #E2E8F0; border-radius: 8px; padding: 0 10px; font-size: 12px; font-weight: 600; outline: none;" />
          </div>
        </div>
      `;
      listContainer.insertAdjacentHTML('beforeend', itemHtml);
    });
    
    const overlay = document.getElementById('discrepancyModal');
    const container = document.getElementById('discrepancyContainer');
    
    overlay.style.display = 'flex';
    // Force layout reflow to trigger CSS transition
    overlay.offsetHeight;
    
    overlay.classList.add('show-active');
    container.classList.add('show-active');
  }
  
  function closeDiscrepancyModal() {
    const overlay = document.getElementById('discrepancyModal');
    const container = document.getElementById('discrepancyContainer');
    
    overlay.classList.remove('show-active');
    container.classList.remove('show-active');
    
    setTimeout(() => {
      overlay.style.display = 'none';
    }, 350);
  }
  
  function validateDiscrepancyQty(input, maxAllowed) {
    let val = parseInt(input.value) || 0;
    if (val < 0) val = 0;
    if (val > maxAllowed) val = maxAllowed;
    input.value = val;
    
    const row = input.closest('.discrepancy-item-row');
    const damagedInput = row.querySelector('.damaged-input');
    const shortageInput = row.querySelector('.shortage-input');
    
    if (input === damagedInput) {
      shortageInput.value = maxAllowed - val;
    } else {
      damagedInput.value = maxAllowed - val;
    }
  }
 
  function submitPartialReceiving() {
    const rows = document.querySelectorAll('.discrepancy-item-row');
    const discrepancies = [];
    
    rows.forEach(row => {
      const idx = row.getAttribute('data-idx');
      const item = asnItems[idx];
      const damaged = parseInt(row.querySelector('.damaged-input').value) || 0;
      const shortage = parseInt(row.querySelector('.shortage-input').value) || 0;
      const notes = row.querySelector('.reason-notes-input').value || '';
      
      discrepancies.push({
        name: item.name,
        sku: item.sku,
        expected: item.expected,
        received: item.received,
        damaged: damaged,
        shortage: shortage,
        notes: notes
      });
    });
 
    const submitBtn = document.querySelector('#discrepancyModal button[onclick="submitPartialReceiving()"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Submitting...';
 
    fetch("{{ route('pda.receiving.partial-complete', $asn->id) }}", {
      method: "POST",
      headers: {
        "X-CSRF-TOKEN": "{{ csrf_token() }}",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        discrepancies: discrepancies
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        window.location.href = "{{ route('pda.receiving.complete', $asn->id) }}?partial=1";
      } else {
        alert(data.message || 'Error submitting discrepancy.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Complete Partial';
      }
    })
    .catch(err => {
      console.error(err);
      window.location.href = "{{ route('pda.receiving.complete', $asn->id) }}?partial=1";
    });
  }
 
  // Auto-focus barcode input
  window.onload = function() {
    if (barcodeInput) barcodeInput.focus();
  };
</script>

<!-- Bottom Sheet Slide-up CSS transitions -->
<style>
  .bottom-sheet-overlay {
    display: none;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(15, 23, 42, 0);
    z-index: 1000;
    align-items: flex-end;
    justify-content: center;
    transition: background 0.35s ease;
  }
  .bottom-sheet-overlay.show-active {
    background: rgba(15, 23, 42, 0.75);
  }
  
  .bottom-sheet-container {
    background: #FFFFFF;
    width: 100%;
    border-radius: 32px 32px 0 0;
    padding: 24px 20px 30px;
    box-shadow: 0 -10px 30px rgba(15, 23, 42, 0.15);
    max-height: 85%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 14px;
    transform: translateY(100%);
    transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .bottom-sheet-container.show-active {
    transform: translateY(0);
  }
</style>

<!-- Discrepancy Reason Dialog Modal (Bottom Sheet slide-up drawer) -->
<div id="discrepancyModal" class="bottom-sheet-overlay">
  <div id="discrepancyContainer" class="bottom-sheet-container">
    
    <!-- Grabber/Handle bar for bottom sheet design feeling -->
    <div style="width: 40px; height: 5px; background: #CBD5E1; border-radius: 3px; align-self: center; margin-bottom: 4px;"></div>
    
    <div>
      <h3 style="font-size: 18px; font-weight: 900; color: #0F172A; margin-bottom: 3px; display: flex; align-items: center; gap: 8px;">
        ⚠️ Incomplete Receiving
      </h3>
      <p style="font-size: 11.5px; color: #64748B; font-weight: 700; line-height: 1.4;">
        Some products have missing quantity. Please categorize the reasons for discrepancy below:
      </p>
    </div>
    
    <!-- Items Form Fields Scrollable -->
    <div id="discrepancyItemsList" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding-right: 2px;">
      <!-- Populated dynamically via JS -->
    </div>
    
    <!-- Modal Footer Actions -->
    <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 10px; margin-top: 4px; flex-shrink: 0;">
      <button type="button" onclick="closeDiscrepancyModal()" style="height: 48px; border: 1.5px solid #E2E8F0; background: #FFFFFF; color: #0F172A; border-radius: 14px; font-size: 13.5px; font-weight: 800; cursor: pointer; transition: all 0.15s ease;">Cancel</button>
      <button type="button" onclick="submitPartialReceiving()" style="height: 48px; border: none; background: #E11D48; color: #FFFFFF; border-radius: 14px; font-size: 13.5px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 12px rgba(225, 29, 72, 0.2); transition: all 0.15s ease;">Complete Partial</button>
    </div>
</div>
</div>

<!-- INFY-POS PDA Realtime Optimizer -->
<script src="/js/infy-pda-realtime.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', function () {
    // Initialize PDA Realtime: focus lock + scan hook
    if (window.InfyPdaRealtime) {
      InfyPdaRealtime.init({
        scanInputId: 'barcodeInput',
        // onScan handled by existing keydown listener
      });
      // Lock focus — hardware scanners rely on the input always being focused
      const scanInput = document.getElementById('barcodeInput');
      if (scanInput) InfyPdaRealtime.lockFocus(scanInput);
    }
  });
</script>

</body>
</html>
