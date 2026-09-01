@extends('supplier.layout')

@section('title', 'Receiving Session — RCV-2026-00045')

@section('head')
<style>
  .rcv-session-layout {
    display: grid;
    grid-template-columns: 320px minmax(0, 1fr);
    gap: 16px;
    align-items: start;
  }
  @media (max-width: 1024px) { .rcv-session-layout { grid-template-columns: 1fr; } }

  .rcv-progress-bar-bg {
    height: 10px; background: #E2E8F0; border-radius: 5px; overflow: hidden; margin-top: 6px;
  }
  .rcv-progress-bar-fill {
    height: 100%; width: 0%; background: #16A34A; transition: width 0.3s ease;
  }

  .rcv-dropdown { position: relative; display: inline-block; }
  .rcv-dropdown-content {
    display: none; position: absolute; right: 0; top: 100%; z-index: 100;
    background: #FFFFFF; min-width: 200px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 1px solid #E2E8F0; border-radius: 10px;
    padding: 6px 0; font-size: 12px;
  }
  .rcv-dropdown.open .rcv-dropdown-content { display: block; }
  .rcv-dropdown-item {
    padding: 8px 14px; color: #334155; text-decoration: none; display: flex; align-items: center; gap: 8px; font-weight: 600; cursor: pointer;
  }
  .rcv-dropdown-item:hover { background: #F8FAFC; color: #16A34A; }
  .rcv-dropdown-item.disabled { opacity: 0.5; cursor: not-allowed; }
</style>
@endsection

@section('content')

<!-- Header Bar -->
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:12px;">
  <div>
    <div style="font-size:12px;color:#64748B;display:flex;gap:6px;align-items:center;margin-bottom:2px;">
      <a href="{{ route('supplier.receiving.index') }}" style="color:#64748B;text-decoration:none;">Receiving Queue</a>
      <span>›</span>
      <span style="color:#0F172A;font-weight:700;">RCV-2026-00045</span>
    </div>
    <h1 style="font-size:22px;font-weight:800;color:#0F172A;margin:0;">Receiving Session</h1>
    <div style="font-size:12px;color:#64748B;margin-top:2px;">
      <span style="font-weight:700;color:#2563EB;">RCV-2026-00045</span> • <span style="font-weight:700;color:#0F172A;">ASN-2026-00025</span> • <span style="font-weight:700;color:#0F172A;">PO-2026-00012</span>
    </div>
  </div>

  <div style="display:flex;gap:8px;align-items:center;">
    <a href="{{ route('supplier.receiving.index') }}" class="sp-btn sp-btn-secondary sp-btn-sm">← Back to Queue</a>
    
    <div class="rcv-dropdown" id="sessionMenu">
      <button class="sp-btn sp-btn-secondary sp-btn-sm" onclick="toggleDropdown('sessionMenu')">⋮</button>
      <div class="rcv-dropdown-content">
        <a class="rcv-dropdown-item disabled" id="btnGrnMenu" onclick="openGrnModal()">📜 Generate GRN</a>
        <a class="rcv-dropdown-item" href="#">📊 Export Receiving Report</a>
        <a class="rcv-dropdown-item" href="#">📈 View Timeline</a>
        <a class="rcv-dropdown-item" href="#" onclick="window.print()">🖨️ Print Receiving</a>
        <a class="rcv-dropdown-item" href="#">👨‍✈️ Assign Inspector</a>
        <a class="rcv-dropdown-item" href="#">⏸️ Hold Receiving</a>
        <a class="rcv-dropdown-item" href="#" style="color:#DC2626;">❌ Cancel Receiving</a>
      </div>
    </div>
  </div>
</div>

<!-- Progress Bar Header -->
<div class="sp-card" style="padding:14px 18px;margin-bottom:16px;">
  <div style="display:flex;justify-content:space-between;align-items:center;font-size:12.5px;font-weight:700;">
    <span>Receiving Progress ℹ️</span>
    <span style="color:#16A34A;"><strong id="sessionUnits">0</strong> / 640 Units (<strong id="sessionPct">0%</strong>)</span>
  </div>
  <div class="rcv-progress-bar-bg">
    <div id="sessionFill" class="rcv-progress-bar-fill"></div>
  </div>
</div>

<!-- Main Split View Layout -->
<div class="rcv-session-layout">

  <!-- Left Panel: Receiving Info -->
  <div class="sp-card" style="padding:16px;">
    <div style="font-size:13.5px;font-weight:800;color:#0F172A;margin-bottom:12px;border-bottom:1px solid #F1F5F9;padding-bottom:8px;">Receiving Info</div>
    
    <div style="display:flex;flex-direction:column;gap:8px;font-size:12px;">
      <div style="display:flex;justify-content:space-between;"><span style="color:#64748B;">Supplier:</span><strong style="color:#0F172A;">Apex Appliance Distributors</strong></div>
      <div style="display:flex;justify-content:space-between;"><span style="color:#64748B;">Vehicle:</span><strong style="color:#0F172A;">TN01AB2426</strong></div>
      <div style="display:flex;justify-content:space-between;"><span style="color:#64748B;">Driver:</span><strong style="color:#0F172A;">Ramesh</strong></div>
      <div style="display:flex;justify-content:space-between;"><span style="color:#64748B;">Dock:</span><strong style="color:#16A34A;">Dock-03</strong></div>
      <div style="display:flex;justify-content:space-between;"><span style="color:#64748B;">Warehouse:</span><strong style="color:#0F172A;">Main Warehouse</strong></div>
      <div style="display:flex;justify-content:space-between;"><span style="color:#64748B;">Expected Qty:</span><strong style="color:#0F172A;">640 Units</strong></div>
      <div style="display:flex;justify-content:space-between;"><span style="color:#64748B;">Received Qty:</span><strong id="infoReceived" style="color:#16A34A;">0 Units</strong></div>
      <div style="display:flex;justify-content:space-between;"><span style="color:#64748B;">Pending Qty:</span><strong id="infoPending" style="color:#D97706;">640 Units</strong></div>
    </div>

    <div style="margin-top:16px;">
      <button type="button" class="sp-btn sp-btn-primary" style="width:100%;height:42px;background:#16A34A;font-weight:800;justify-content:center;" onclick="openScanModal()">
        ⚡ Scan Barcode to Start
      </button>
    </div>
  </div>

  <!-- Right Panel: ASN Items (Shows all items BEFORE scanning) -->
  <div class="sp-card" style="padding:16px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;border-bottom:1px solid #F1F5F9;padding-bottom:8px;">
      <div style="font-size:13.5px;font-weight:800;color:#0F172A;">ASN Items (18)</div>
      <span style="font-size:11px;color:#64748B;">Verify items against physical shipment</span>
    </div>

    <div style="overflow-x:auto;">
      <table class="sp-table" style="font-size:12px;width:100%;">
        <thead>
          <tr>
            <th>Item</th>
            <th>Expected</th>
            <th>Received</th>
            <th>Status</th>
            <th style="text-align:right;">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="font-weight:700;color:#0F172A;">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:18px;">📺</span>
                <div>
                  <div>Samsung 43" Smart LED TV</div>
                  <div style="font-size:10px;color:#64748B;">SKU: TV43SMART • 8906123456789</div>
                </div>
              </div>
            </td>
            <td style="font-weight:700;">20</td>
            <td id="rx-item-1" style="font-weight:700;color:#16A34A;">0</td>
            <td><span id="st-item-1" class="sp-badge sp-badge-amber" style="font-size:10px;">Pending</span></td>
            <td style="text-align:right;">
              <button type="button" class="sp-btn sp-btn-primary sp-btn-sm" style="padding:2px 8px;font-size:11px;" onclick="openScanModal('Samsung 43\' Smart LED TV', 20)">Scan</button>
            </td>
          </tr>

          <tr>
            <td style="font-weight:700;color:#0F172A;">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:18px;">🧊</span>
                <div>
                  <div>LG Refrigerator 240L</div>
                  <div style="font-size:10px;color:#64748B;">SKU: LGR240 • 8906123456790</div>
                </div>
              </div>
            </td>
            <td style="font-weight:700;">5</td>
            <td id="rx-item-2" style="font-weight:700;color:#16A34A;">0</td>
            <td><span id="st-item-2" class="sp-badge sp-badge-amber" style="font-size:10px;">Pending</span></td>
            <td style="text-align:right;">
              <button type="button" class="sp-btn sp-btn-primary sp-btn-sm" style="padding:2px 8px;font-size:11px;" onclick="openScanModal('LG Refrigerator 240L', 5)">Scan</button>
            </td>
          </tr>

          <tr>
            <td style="font-weight:700;color:#0F172A;">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:18px;">🧺</span>
                <div>
                  <div>Whirlpool Washing Machine</div>
                  <div style="font-size:10px;color:#64748B;">SKU: WM700 • 8906123456791</div>
                </div>
              </div>
            </td>
            <td style="font-weight:700;">10</td>
            <td id="rx-item-3" style="font-weight:700;color:#16A34A;">0</td>
            <td><span id="st-item-3" class="sp-badge sp-badge-amber" style="font-size:10px;">Pending</span></td>
            <td style="text-align:right;">
              <button type="button" class="sp-btn sp-btn-primary sp-btn-sm" style="padding:2px 8px;font-size:11px;" onclick="openScanModal('Whirlpool Washing Machine', 10)">Scan</button>
            </td>
          </tr>

          <tr>
            <td style="font-weight:700;color:#0F172A;">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:18px;">🔌</span>
                <div>
                  <div>Mixer Grinder 750W</div>
                  <div style="font-size:10px;color:#64748B;">SKU: MIX750 • 8906123456792</div>
                </div>
              </div>
            </td>
            <td style="font-weight:700;">40</td>
            <td id="rx-item-4" style="font-weight:700;color:#16A34A;">0</td>
            <td><span id="st-item-4" class="sp-badge sp-badge-amber" style="font-size:10px;">Pending</span></td>
            <td style="text-align:right;">
              <button type="button" class="sp-btn sp-btn-primary sp-btn-sm" style="padding:2px 8px;font-size:11px;" onclick="openScanModal('Mixer Grinder 750W', 40)">Scan</button>
            </td>
          </tr>

          <tr>
            <td style="font-weight:700;color:#0F172A;">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:18px;">🍚</span>
                <div>
                  <div>Rice Cooker 1.8L</div>
                  <div style="font-size:10px;color:#64748B;">SKU: RC180 • 8906123456793</div>
                </div>
              </div>
            </td>
            <td style="font-weight:700;">100</td>
            <td id="rx-item-5" style="font-weight:700;color:#16A34A;">0</td>
            <td><span id="st-item-5" class="sp-badge sp-badge-amber" style="font-size:10px;">Pending</span></td>
            <td style="text-align:right;">
              <button type="button" class="sp-btn sp-btn-primary sp-btn-sm" style="padding:2px 8px;font-size:11px;" onclick="openScanModal('Rice Cooker 1.8L', 100)">Scan</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

</div>

<!-- Interactive Scan Item Modal (Matching Mockup Column 2 Screen 2) -->
<div id="scanItemModal" style="display:none;position:fixed;inset:0;background:rgba(15,23,42,0.4);backdrop-filter:blur(4px);z-index:1000;align-items:center;justify-content:center;">
  <div style="background:#FFF;border-radius:16px;width:90%;max-width:520px;padding:24px;box-shadow:0 10px 30px rgba(0,0,0,0.15);">
    
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;border-bottom:1px solid #F1F5F9;padding-bottom:8px;">
      <div>
        <div style="font-size:12px;color:#64748B;">← Scan Item</div>
        <div style="font-size:11px;color:#94A3B8;">RCV-2026-00045 • ASN-2026-00025</div>
      </div>
      <button class="sp-btn sp-btn-secondary sp-btn-sm" onclick="closeScanModal()">✕</button>
    </div>

    <!-- Product Card Header -->
    <div style="display:flex;gap:12px;align-items:center;margin-bottom:14px;background:#F8FAFC;padding:12px;border-radius:10px;border:1px solid #E2E8F0;">
      <div style="width:48px;height:48px;border-radius:8px;background:#FFF;display:flex;align-items:center;justify-content:center;font-size:24px;border:1px solid #CBD5E1;">
        📺
      </div>
      <div>
        <div id="modalProdTitle" style="font-size:14px;font-weight:800;color:#0F172A;">Samsung 43" Smart LED TV</div>
        <div style="font-size:11px;color:#64748B;">SKU: <strong style="color:#2563EB;">TV43SMART</strong> • Barcode: 8906123456789</div>
        <div style="font-size:10px;color:#94A3B8;">Batch: BATCH-2405 • Expiry: -</div>
      </div>
    </div>

    <!-- Quantities Strip -->
    <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:6px;text-align:center;font-size:11px;margin-bottom:14px;">
      <div style="background:#F8FAFC;padding:6px;border-radius:6px;border:1px solid #E2E8F0;">
        <span style="color:#64748B;">Ordered Qty</span><br><strong id="modalOrdered" style="color:#0F172A;font-size:13px;">20 Units</strong>
      </div>
      <div style="background:#F0FDF4;padding:6px;border-radius:6px;border:1px solid #86EFAC;">
        <span style="color:#166534;">Already Received</span><br><strong id="modalAlreadyRx" style="color:#16A34A;font-size:13px;">0 Units</strong>
      </div>
      <div style="background:#FFFBEB;padding:6px;border-radius:6px;border:1px solid #FDE68A;">
        <span style="color:#B45309;">Remaining Qty</span><br><strong id="modalRemain" style="color:#D97706;font-size:13px;">20 Units</strong>
      </div>
      <div style="background:#F8FAFC;padding:6px;border-radius:6px;border:1px solid #E2E8F0;">
        <span style="color:#64748B;">UOM</span><br><strong style="color:#0F172A;font-size:13px;">Nos</strong>
      </div>
    </div>

    <!-- Inputs Row -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
      <div>
        <label style="font-size:11px;font-weight:700;color:#0F172A;display:block;margin-bottom:2px;">Received Qty *</label>
        <input type="number" id="inRxQty" value="20" style="width:100%;height:36px;border:1px solid #CBD5E1;border-radius:6px;padding:0 8px;font-weight:800;font-size:13px;">
      </div>
      <div>
        <label style="font-size:11px;font-weight:700;color:#DC2626;display:block;margin-bottom:2px;">Damage Qty -</label>
        <input type="number" id="inDmgQty" value="0" style="width:100%;height:36px;border:1px solid #FCA5A5;border-radius:6px;padding:0 8px;font-weight:800;font-size:13px;color:#DC2626;">
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
      <div>
        <label style="font-size:11px;font-weight:700;color:#64748B;display:block;margin-bottom:2px;">Missing Qty</label>
        <input type="number" id="inMissQty" value="0" style="width:100%;height:36px;border:1px solid #CBD5E1;border-radius:6px;padding:0 8px;font-size:12px;">
      </div>
      <div>
        <label style="font-size:11px;font-weight:700;color:#64748B;display:block;margin-bottom:2px;">Rejected Qty -</label>
        <input type="number" id="inRejQty" value="0" style="width:100%;height:36px;border:1px solid #CBD5E1;border-radius:6px;padding:0 8px;font-size:12px;">
      </div>
    </div>

    <div style="display:flex;gap:8px;justify-content:flex-end;">
      <button type="button" class="sp-btn sp-btn-secondary" onclick="closeScanModal()">Cancel</button>
      <button type="button" class="sp-btn sp-btn-secondary" style="background:#FFFBEB;color:#B45309;border-color:#FDE68A;" onclick="submitReceiveScan(true)">Partial Receive</button>
      <button type="button" class="sp-btn sp-btn-primary" style="background:#16A34A;" onclick="submitReceiveScan(false)">Receive & Next →</button>
    </div>

  </div>
</div>

<!-- GRN Generated Success Modal -->
<div id="grnSuccessModal" style="display:none;position:fixed;inset:0;background:rgba(15,23,42,0.5);backdrop-filter:blur(4px);z-index:1000;align-items:center;justify-content:center;">
  <div style="background:#FFF;border-radius:16px;width:90%;max-width:440px;padding:24px;box-shadow:0 10px 30px rgba(0,0,0,0.15);text-align:center;">
    <div style="width:64px;height:64px;background:#DCFCE7;color:#16A34A;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:36px;margin:0 auto 12px auto;border:2px solid #86EFAC;">✓</div>
    
    <h3 style="font-size:18px;font-weight:800;color:#0F172A;margin-bottom:4px;">GRN Generated Successfully</h3>

    <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:12px;font-size:12px;display:flex;flex-direction:column;gap:6px;margin:16px 0;text-align:left;">
      <div style="display:flex;justify-content:space-between;"><span style="color:#64748B;">GRN Number:</span><strong style="color:#16A34A;font-size:13px;">GRN-2026-00084</strong></div>
      <div style="display:flex;justify-content:space-between;"><span style="color:#64748B;">ASN ID:</span><strong style="color:#0F172A;">ASN-2026-00025</strong></div>
      <div style="display:flex;justify-content:space-between;"><span style="color:#64748B;">PO ID:</span><strong style="color:#2563EB;">PO-2026-00012</strong></div>
      <div style="display:flex;justify-content:space-between;"><span style="color:#64748B;">Received Qty:</span><strong style="color:#16A34A;">640 Units</strong></div>
      <div style="display:flex;justify-content:space-between;"><span style="color:#64748B;">Rejected Qty:</span><strong style="color:#DC2626;">4 Units</strong></div>
      <div style="display:flex;justify-content:space-between;"><span style="color:#64748B;">Damaged Qty:</span><strong style="color:#D97706;">2 Units</strong></div>
    </div>

    <div style="display:flex;flex-direction:column;gap:8px;">
      <a href="{{ route('supplier.warehouse') }}" class="sp-btn sp-btn-primary" style="background:#16A34A;justify-content:center;">View GRN</a>
      <a href="{{ route('supplier.receiving.index') }}" style="font-size:12px;color:#64748B;font-weight:700;text-decoration:none;margin-top:4px;">Done</a>
    </div>
  </div>
</div>

@endsection

@section('scripts')
<script>
  let activeQty = 20;

  function toggleDropdown(id) {
    const el = document.getElementById(id);
    document.querySelectorAll('.rcv-dropdown').forEach(d => {
      if (d !== el) d.classList.remove('open');
    });
    if (el) el.classList.toggle('open');
  }

  function openScanModal(title, qty) {
    if (title) {
      document.getElementById('modalProdTitle').textContent = title;
      document.getElementById('modalOrdered').textContent = qty + ' Units';
      document.getElementById('modalRemain').textContent = qty + ' Units';
      document.getElementById('inRxQty').value = qty;
      activeQty = qty;
    }
    document.getElementById('scanItemModal').style.display = 'flex';
  }

  function closeScanModal() {
    document.getElementById('scanItemModal').style.display = 'none';
  }

  function submitReceiveScan(isPartial) {
    const rx = parseInt(document.getElementById('inRxQty').value || activeQty);
    
    // Update progress bar
    document.getElementById('sessionUnits').textContent = '640';
    document.getElementById('sessionPct').textContent = '100%';
    document.getElementById('sessionFill').style.width = '100%';
    document.getElementById('infoReceived').textContent = '640 Units';
    document.getElementById('infoPending').textContent = '0 Units';

    // Update item status badges
    for (let i=1; i<=5; i++) {
      const rxEl = document.getElementById('rx-item-' + i);
      const stEl = document.getElementById('st-item-' + i);
      if (rxEl) rxEl.textContent = (i===1?20: (i===2?5: (i===3?10: (i===4?40: 100))));
      if (stEl) {
        stEl.textContent = 'Completed';
        stEl.className = 'sp-badge sp-badge-green';
      }
    }

    // Enable Generate GRN menu option
    const grnBtn = document.getElementById('btnGrnMenu');
    if (grnBtn) grnBtn.classList.remove('disabled');

    closeScanModal();

    alert('✅ Received ' + rx + ' units. Receiving session is 100% completed!');
  }

  function openGrnModal() {
    document.getElementById('grnSuccessModal').style.display = 'flex';
  }
</script>
@endsection
