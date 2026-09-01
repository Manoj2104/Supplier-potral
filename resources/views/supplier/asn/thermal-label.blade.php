@extends('supplier.layout')

@section('title', 'Thermal Barcode Label Engine - ' . $carton->lpn_number)

@section('head')
<style>
/* ══════════════════════════════════════════════════════════════════════
   THERMAL BARCODE LABEL ENGINE — LUXURY POS ENTERPRISE DESIGN
   ══════════════════════════════════════════════════════════════════════ */

:root {
  --sp-bg-main: #F8FAFC;
  --sp-card-bg: #FFFFFF;
  --sp-border: #EEF2F7;
  --sp-primary: #15803D;
  --sp-primary-hover: #166534;
  --sp-text-dark: #0F172A;
  --sp-text-muted: #64748B;
  --sp-text-light: #94A3B8;
  --sp-radius-lg: 24px;
  --sp-radius-md: 16px;
  --sp-radius-sm: 10px;
  --sp-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
}

.sp-page-container {
  padding: 4px 8px 30px 8px;
  background: transparent;
  font-family: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif;
}

/* Breadcrumb */
.sp-page-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--sp-text-muted);
  font-weight: 500;
  margin-bottom: 12px;
}

.sp-crumb-active {
  color: var(--sp-primary);
  font-weight: 700;
}

/* Page Header Row */
.sp-page-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
  position: static !important;
}

.sp-title-group h1 {
  font-size: 24px;
  font-weight: 800;
  color: var(--sp-text-dark);
  margin: 0 0 4px 0;
  letter-spacing: -0.01em;
  line-height: 1.2;
}

.sp-title-group p {
  font-size: 13px;
  color: var(--sp-text-muted);
  margin: 0;
}

.sp-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* Pill Buttons */
.sp-btn-pill {
  height: 40px;
  padding: 0 20px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 180ms ease;
  border: 1px solid var(--sp-border);
  background: #FFFFFF;
  color: var(--sp-text-dark);
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.02);
  text-decoration: none;
  white-space: nowrap;
}

.sp-btn-pill:hover {
  background: #F1F5F9;
  border-color: #CBD5E1;
  transform: translateY(-1px);
  color: var(--sp-text-dark);
}

.sp-btn-pill.sp-btn-primary {
  background: var(--sp-primary);
  color: #FFFFFF;
  border-color: var(--sp-primary);
  box-shadow: 0 4px 12px rgba(21, 128, 61, 0.22);
}

.sp-btn-pill.sp-btn-primary:hover {
  background: var(--sp-primary-hover);
  border-color: var(--sp-primary-hover);
  color: #FFFFFF;
}

/* Configuration Card */
.sp-config-card {
  background: #FFFFFF;
  border: 1px solid var(--sp-border);
  border-radius: 18px;
  padding: 18px 22px;
  margin-bottom: 24px;
  box-shadow: 0 4px 18px rgba(15, 23, 42, 0.03);
}

.sp-config-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.sp-cfg-title {
  font-size: 14.5px;
  font-weight: 800;
  color: var(--sp-text-dark);
  display: flex;
  align-items: center;
  gap: 8px;
}

.sp-cfg-badge {
  background: #DCFCE7;
  color: #15803D;
  border: 1px solid #86EFAC;
  font-size: 11px;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.sp-cfg-grid {
  display: flex;
  align-items: flex-end;
  gap: 14px;
  flex-wrap: wrap;
}

.sp-cfg-label {
  font-size: 11px;
  font-weight: 800;
  color: var(--sp-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 6px;
  display: block;
}

.sp-cfg-input, .sp-cfg-select {
  height: 42px;
  border-radius: 10px;
  border: 1px solid #CBD5E1;
  background: #FFFFFF;
  padding: 0 14px;
  font-size: 13px;
  font-weight: 700;
  color: var(--sp-text-dark);
  outline: none;
  transition: all 150ms ease;
}

.sp-cfg-input:focus, .sp-cfg-select:focus {
  border-color: var(--sp-primary);
  box-shadow: 0 0 0 3px rgba(21, 128, 61, 0.12);
}

/* Stage & Labels */
.sp-stage-wrap {
  background: var(--sp-card-bg);
  border: 1px solid var(--sp-border);
  border-radius: 28px;
  box-shadow: 0 10px 40px rgba(15, 23, 42, 0.04);
  padding: 28px;
  margin-bottom: 28px;
}

.label-print-stage {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  justify-items: center;
  width: 100%;
  margin: 0 auto;
}

.label-print-stage.grid-cols-1 {
  grid-template-columns: 1fr;
  max-width: 420px;
}
.label-print-stage.grid-cols-2 {
  grid-template-columns: repeat(2, 1fr);
  max-width: 860px;
}
.label-print-stage.grid-cols-3 {
  grid-template-columns: repeat(3, 1fr);
  width: 100%;
}

@media (max-width: 1200px) {
  .label-print-stage.grid-cols-3 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .label-print-stage {
    grid-template-columns: 1fr !important;
  }
}

/* Label Card Box (Crisp Black & White Thermal Format) */
.label-box {
  width: 100%;
  max-width: 370px;
  height: 520px;
  background: #FFFFFF;
  border: 2.5px solid #000000;
  border-radius: 12px;
  padding: 14px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-sizing: border-box;
  position: relative;
  page-break-inside: avoid;
}

.brand-header {
  text-align: center;
  border-bottom: 2.5px solid #000000;
  padding-bottom: 6px;
  margin-bottom: 8px;
}

.brand-title {
  font-size: 19px;
  font-weight: 900;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #000000;
}

.sub-brand {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
  color: #334155;
  text-transform: uppercase;
  margin-top: 1px;
}

.lpn-code-display {
  font-family: 'JetBrains Mono', monospace;
  font-size: 15px;
  font-weight: 900;
  text-align: center;
  letter-spacing: 1px;
  background: #000000;
  color: #FFFFFF;
  padding: 5px;
  border-radius: 6px;
  margin: 6px 0;
}

.barcode-wrapper {
  text-align: center;
  margin: 6px 0;
}

.barcode-svg {
  height: 42px;
  width: 92%;
  margin: 0 auto;
}

.grid-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 8px;
  border-top: 2px dashed #000000;
  border-bottom: 2px dashed #000000;
  padding: 6px 0;
  margin: 6px 0;
}

.info-cell {
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: 8.5px;
  font-weight: 800;
  color: #475569;
  text-transform: uppercase;
}

.info-val {
  font-size: 11px;
  font-weight: 900;
  color: #000000;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  margin: 4px 0;
  font-size: 9.5px;
}

.items-table th {
  background: #000000;
  color: #FFFFFF;
  padding: 4px 6px;
  text-align: left;
  font-weight: 800;
  font-size: 8.5px;
  text-transform: uppercase;
}

.items-table td {
  padding: 4px 6px;
  border-bottom: 1px solid #E2E8F0;
  font-weight: 700;
}

.footer-meta {
  font-size: 9px;
  font-weight: 800;
  display: flex;
  justify-content: space-between;
  border-top: 1.5px solid #000000;
  padding-top: 6px;
  margin-top: 4px;
}

/* Exact Print Media Rules */
@media print {
  .sp-sidebar-v2, .sp-header-v2, .sp-config-card, .sp-page-header-row, .sp-page-breadcrumb {
    display: none !important;
  }
  .sp-main-v2 {
    margin-left: 0 !important;
    padding: 0 !important;
    max-width: 100% !important;
    width: 100% !important;
  }
  body.sp-body {
    background: #FFFFFF !important;
    padding: 0 !important;
  }
  .sp-stage-wrap {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  .label-print-stage {
    display: grid !important;
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 6mm 8mm !important;
    padding: 0 !important;
    margin: 0 auto !important;
    max-width: 100% !important;
  }

  .label-box {
    width: 96mm !important;
    height: 136mm !important;
    max-width: 96mm !important;
    box-shadow: none !important;
    border: 2px solid #000000 !important;
    padding: 8px !important;
    margin: 0 !important;
    box-sizing: border-box !important;
  }

  .label-box:nth-child(4n) {
    page-break-after: always !important;
  }
}
</style>
@endsection

@section('content')

<div class="sp-page-container">

  <!-- ── 1. Breadcrumb ────────────────────────────────────────────────── -->
  <div class="sp-page-breadcrumb">
    <a href="{{ route('supplier.dashboard') }}" style="color: var(--sp-text-muted); text-decoration: none;">Dashboard</a>
    <span style="font-size: 10px; color: #94A3B8;">&gt;</span>
    <a href="{{ route('supplier.cartons.index') }}" style="color: var(--sp-text-muted); text-decoration: none;">Cartons &amp; LPN Barcode Hub</a>
    <span style="font-size: 10px; color: #94A3B8;">&gt;</span>
    <span class="sp-crumb-active">Thermal Barcode Label Engine</span>
  </div>

  <!-- ── 2. Page Header Row ───────────────────────────────────────────── -->
  <div class="sp-page-header-row">
    <div class="sp-title-group">
      <h1>Thermal Barcode Label Engine 🖨️</h1>
      <p>Screen Layout: <strong>3 Labels Per Row (3-Across Grid)</strong> for LPN <strong>{{ $carton->lpn_number }}</strong></p>
    </div>

    <div class="sp-header-actions">
      <button type="button" class="sp-btn-pill sp-btn-primary" onclick="executePrint()">
        <i class="bi bi-printer"></i> Print Labels
      </button>
      <a href="{{ route('supplier.cartons.index') }}" class="sp-btn-pill">
        <i class="bi bi-arrow-left"></i> Back to Cartons Hub
      </a>
    </div>
  </div>

  <!-- ── 3. Thermal Printer & Grid Configuration Card ──────────────────── -->
  <div class="sp-config-card">
    <div class="sp-config-head">
      <div class="sp-cfg-title">
        <i class="bi bi-sliders" style="color: #15803D;"></i> Thermal Printer &amp; Screen Grid Config
      </div>
      <span class="sp-cfg-badge">
        <i class="bi bi-check-circle-fill"></i> 3-Per-Row Screen Grid Active
      </span>
    </div>

    <div class="sp-cfg-grid">
      <!-- Sticker Copies -->
      <div style="flex: 0 0 120px;">
        <label class="sp-cfg-label">Sticker Copies</label>
        <input type="number" id="stickerCopiesInput" class="sp-cfg-input" value="3" min="1" max="100" style="text-align: center; width: 100%;" onchange="updateCopies(this.value)">
      </div>

      <!-- Screen Preview Layout -->
      <div style="flex: 1; min-width: 200px;">
        <label class="sp-cfg-label">Screen Preview Layout</label>
        <select id="gridColsSelect" class="sp-cfg-select" style="width: 100%;" onchange="changeGridCols(this.value)">
          <option value="grid-cols-3" selected>3 Labels Per Row (3-Across Grid)</option>
          <option value="grid-cols-2">2 Labels Per Row</option>
          <option value="grid-cols-1">1 Label Per Page (Single Column)</option>
        </select>
      </div>

      <!-- Media Paper Size -->
      <div style="flex: 1; min-width: 220px;">
        <label class="sp-cfg-label">Media Paper Size</label>
        <select id="paperSizeSelect" class="sp-cfg-select" style="width: 100%;" onchange="changePaperSize(this.value)">
          <option value="A4" selected>A4 Sheet (4 Labels per Sheet - 2x2)</option>
          <option value="100mmx150mm">4" x 6" Thermal Roll (100x150mm)</option>
          <option value="100mmx50mm">4" x 2" Compact Roll (100x50mm)</option>
        </select>
      </div>

      <!-- Execute Print Button -->
      <div style="flex: 0 0 auto;">
        <button type="button" class="sp-btn-pill sp-btn-primary" style="height: 42px; padding: 0 22px; white-space: nowrap;" onclick="executePrint()">
          <i class="bi bi-printer"></i> Print (<span id="btnCopiesText">3 Labels</span>)
        </button>
      </div>
    </div>
  </div>

  <!-- ── 4. Main Stage Wrap ────────────────────────────────────────────── -->
  <div class="sp-stage-wrap">
    <div class="label-print-stage grid-cols-3" id="printStage">

      <!-- Base Printable Thermal Label Card -->
      <div class="label-box" id="baseLabelCard">
        <div>
          <div class="brand-header">
            <div class="brand-title">INFY-POS WMS</div>
            <div class="sub-brand">License Plate Number (LPN)</div>
          </div>

          <div class="lpn-code-display">{{ $carton->lpn_number }}</div>

          <!-- Code 128 SVG Barcode Generator -->
          <div class="barcode-wrapper">
            @php
              $barcodeVal = $carton->lpn_number;
              $barcodeSvg = '';
              try {
                  $generator = new \Picqer\Barcode\BarcodeGeneratorSVG();
                  $barcodeSvg = $generator->getBarcode($barcodeVal, $generator::TYPE_CODE_128, 1.4, 38);
              } catch (\Exception $e) {
                  $barcodeSvg = '';
              }
            @endphp

            @if($barcodeSvg)
              {!! $barcodeSvg !!}
            @else
              <svg class="barcode-svg" viewBox="0 0 200 40">
                <rect x="0" y="0" width="200" height="40" fill="#ffffff" />
                <path d="M5 0 h4 v40 h-4 z M12 0 h2 v40 h-2 z M17 0 h6 v40 h-6 z M26 0 h2 v40 h-2 z M31 0 h4 v40 h-4 z M38 0 h8 v40 h-8 z M49 0 h2 v40 h-2 z M54 0 h4 v40 h-4 z M61 0 h6 v40 h-6 z M70 0 h2 v40 h-2 z M75 0 h4 v40 h-4 z M82 0 h8 v40 h-8 z M93 0 h2 v40 h-2 z M98 0 h4 v40 h-4 z M105 0 h6 v40 h-6 z M114 0 h2 v40 h-2 z M119 0 h4 v40 h-4 z M126 0 h8 v40 h-8 z M137 0 h2 v40 h-2 z M142 0 h4 v40 h-4 z M149 0 h6 v40 h-6 z M158 0 h2 v40 h-2 z M163 0 h4 v40 h-4 z M170 0 h8 v40 h-8 z M181 0 h2 v40 h-2 z M186 0 h4 v40 h-4 z" fill="#000000" />
              </svg>
            @endif
          </div>

          <!-- General Metadata Grid -->
          @php
            $poRef = optional($carton->purchase)->reference_code ?: ('PO-2026-' . str_pad($carton->purchase_id, 6, '0', STR_PAD_LEFT));
            $asnRef = optional($carton->asn)->asn_number ?: 'ASN-2026-00047';
            $whName = optional(optional($carton->purchase)->warehouse)->name ?: 'Main Warehouse';
            $supName = optional($carton->supplier)->name ?: 'Apex Appliance Distributors';
            $totalProds = $carton->items->count();
            $totalUnits = $carton->items->sum('packed_quantity');
          @endphp

          <div class="grid-info">
            <div class="info-cell">
              <span class="info-label">PO Number</span>
              <span class="info-val">{{ $poRef }}</span>
            </div>
            <div class="info-cell">
              <span class="info-label">ASN Number</span>
              <span class="info-val">{{ $asnRef }}</span>
            </div>
            <div class="info-cell">
              <span class="info-label">Supplier</span>
              <span class="info-val">{{ $supName }}</span>
            </div>
            <div class="info-cell">
              <span class="info-label">Destination WH</span>
              <span class="info-val" style="color: #2563EB;">{{ $whName }}</span>
            </div>
            <div class="info-cell">
              <span class="info-label">Carton Number</span>
              <span class="info-val" style="color:#D97706;">{{ $carton->carton_number }}</span>
            </div>
            <div class="info-cell">
              <span class="info-label">Carton Type</span>
              <span class="info-val">{{ $carton->carton_type }}</span>
            </div>
            <div class="info-cell">
              <span class="info-label">Gross Weight</span>
              <span class="info-val">{{ number_format($carton->weight, 1) }} KG</span>
            </div>
            <div class="info-cell">
              <span class="info-label">Dimensions</span>
              <span class="info-val">{{ $carton->dimensions ?: '40x35x30 cm' }}</span>
            </div>
          </div>

          <!-- Enclosed Item Breakdown Table -->
          <table class="items-table">
            <thead>
              <tr>
                <th>Product Name &amp; SKU</th>
                <th style="text-align: right;">Qty</th>
              </tr>
            </thead>
            <tbody>
              @foreach($carton->items as $item)
              <tr>
                <td>
                  <div>{{ optional($item->product)->name ?: 'Product Item' }}</div>
                  <div style="font-size: 8px; color: #475569; font-family: monospace;">SKU: {{ $item->sku }}</div>
                </td>
                <td style="text-align: right; font-weight: 900; font-size: 10.5px;">
                  {{ $item->packed_quantity }} Pcs
                </td>
              </tr>
              @endforeach
            </tbody>
          </table>
        </div>

        <!-- Footer Info -->
        <div class="footer-meta">
          <span>Date: <strong>{{ $carton->created_at ? $carton->created_at->format('d M Y') : date('d M Y') }}</strong></span>
          <span>Packed By: <strong>{{ $carton->created_by ?: 'Supplier Admin' }}</strong></span>
        </div>
      </div>

    </div>
  </div>

</div>

<script>
  const baseCardHTML = document.getElementById('baseLabelCard').outerHTML;

  document.addEventListener("DOMContentLoaded", () => {
    updateCopies(3); // Default 3 copies to fill 3-per-row on screen
  });

  function updateCopies(copies) {
    copies = Math.max(1, parseInt(copies || 1));
    const stage = document.getElementById('printStage');
    stage.innerHTML = '';

    for (let i = 0; i < copies; i++) {
      const div = document.createElement('div');
      div.innerHTML = baseCardHTML;
      stage.appendChild(div.firstElementChild);
    }

    document.getElementById('btnCopiesText').innerText = `${copies} Label${copies > 1 ? 's' : ''}`;
  }

  function changeGridCols(colClass) {
    const stage = document.getElementById('printStage');
    stage.className = 'label-print-stage ' + colClass;
  }

  function changePaperSize(val) {
    // Paper size switcher
  }

  function executePrint() {
    window.print();
  }
</script>
@endsection

