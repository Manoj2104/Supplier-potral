@extends('supplier.layout')

@section('title', 'Receiving Queue — Warehouse Management')

@section('head')
<style>
  .rcv-kpi-bar {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 12px;
    margin-bottom: 16px;
  }
  @media (max-width: 1200px) { .rcv-kpi-bar { grid-template-columns: repeat(3, 1fr); } }
  @media (max-width: 640px) { .rcv-kpi-bar { grid-template-columns: repeat(2, 1fr); } }

  .rcv-kpi-card {
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    padding: 12px 14px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  }
  .rcv-kpi-val { font-size: 20px; font-weight: 800; color: #0F172A; }
  .rcv-kpi-lbl { font-size: 11px; font-weight: 700; color: #64748B; margin-top: 2px; }

  .rcv-filter-bar {
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    padding: 12px 16px;
    margin-bottom: 16px;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
  }

  .rcv-split-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 360px;
    gap: 16px;
    align-items: start;
  }
  @media (max-width: 1200px) { .rcv-split-layout { grid-template-columns: minmax(0, 1fr); } }

  .rcv-drawer {
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 14px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.04);
    position: sticky;
    top: 76px;
  }

  /* Three dots dropdown */
  .rcv-dropdown { position: relative; display: inline-block; }
  .rcv-dropdown-content {
    display: none;
    position: absolute; right: 0; top: 100%; z-index: 100;
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
    <h1 style="font-size:22px;font-weight:800;color:#0F172A;margin:0;">Receiving</h1>
    <p style="font-size:12.5px;color:#64748B;margin:2px 0 0 0;">Physical receiving of goods against ASN before GRN generation.</p>
  </div>
  <div style="display:flex;gap:8px;align-items:center;">
    <a href="{{ route('supplier.receiving.index') }}" class="sp-btn sp-btn-secondary sp-btn-sm">🔄 Refresh</a>
    <a href="{{ route('supplier.receiving.session', 1) }}" class="sp-btn sp-btn-primary sp-btn-sm" style="background:#16A34A;">+ Start Receiving</a>
    
    <div class="rcv-dropdown" id="topHeaderDropdown">
      <button class="sp-btn sp-btn-secondary sp-btn-sm" onclick="toggleDropdown('topHeaderDropdown')">⋮</button>
      <div class="rcv-dropdown-content">
        <a class="rcv-dropdown-item disabled" title="Receiving must be 100% verified to generate GRN">📜 Generate GRN</a>
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

<!-- 5 Top KPI Cards -->
<div class="rcv-kpi-bar">

  <div class="rcv-kpi-card" style="border-left:4px solid #D97706;">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <span class="rcv-kpi-lbl">Pending</span>
      <span style="font-size:16px;">📦</span>
    </div>
    <div class="rcv-kpi-val" style="color:#D97706;">12</div>
    <div style="font-size:10px;color:#94A3B8;">ASN waiting</div>
  </div>

  <div class="rcv-kpi-card" style="border-left:4px solid #2563EB;">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <span class="rcv-kpi-lbl">In Progress</span>
      <span style="font-size:16px;">🚚</span>
    </div>
    <div class="rcv-kpi-val" style="color:#2563EB;">5</div>
    <div style="font-size:10px;color:#94A3B8;">Receiving now</div>
  </div>

  <div class="rcv-kpi-card" style="border-left:4px solid #16A34A;">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <span class="rcv-kpi-lbl">Completed</span>
      <span style="font-size:16px;">✅</span>
    </div>
    <div class="rcv-kpi-val" style="color:#16A34A;">18</div>
    <div style="font-size:10px;color:#94A3B8;">Today</div>
  </div>

  <div class="rcv-kpi-card" style="border-left:4px solid #7C3AED;">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <span class="rcv-kpi-lbl">Partial</span>
      <span style="font-size:16px;">📊</span>
    </div>
    <div class="rcv-kpi-val" style="color:#7C3AED;">7</div>
    <div style="font-size:10px;color:#94A3B8;">Partially received</div>
  </div>

  <div class="rcv-kpi-card" style="border-left:4px solid #DC2626;">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <span class="rcv-kpi-lbl">Delayed</span>
      <span style="font-size:16px;">⚠️</span>
    </div>
    <div class="rcv-kpi-val" style="color:#DC2626;">3</div>
    <div style="font-size:10px;color:#94A3B8;">ASN delayed</div>
  </div>

</div>

<!-- Filter Bar -->
<div class="rcv-filter-bar">
  <div style="flex:1;min-width:200px;display:flex;align-items:center;background:#F8FAFC;border:1px solid #CBD5E1;border-radius:8px;padding:0 10px;height:36px;">
    <span style="color:#94A3B8;margin-right:6px;">🔍</span>
    <input type="text" placeholder="Search ASN / PO / Supplier / Vehicle / Driver..." style="border:none;outline:none;background:transparent;width:100%;font-size:12px;">
  </div>

  <select style="height:36px;border:1px solid #CBD5E1;border-radius:8px;padding:0 10px;font-size:12px;background:#FFF;">
    <option>All Status</option>
    <option>Waiting</option>
    <option>In Progress</option>
    <option>Completed</option>
    <option>Partial</option>
    <option>Delayed</option>
  </select>

  <select style="height:36px;border:1px solid #CBD5E1;border-radius:8px;padding:0 10px;font-size:12px;background:#FFF;">
    <option>All Warehouses</option>
    <option>Main Warehouse</option>
    <option>Coimbatore WH</option>
  </select>

  <select style="height:36px;border:1px solid #CBD5E1;border-radius:8px;padding:0 10px;font-size:12px;background:#FFF;">
    <option>All Suppliers</option>
    <option>Apex Appliance Distributors</option>
    <option>Kiranakart Tech Pvt Ltd</option>
  </select>

  <input type="text" value="01 May 2026 - 31 May 2026" style="height:36px;border:1px solid #CBD5E1;border-radius:8px;padding:0 10px;font-size:12px;background:#FFF;width:170px;">

  <button class="sp-btn sp-btn-secondary sp-btn-sm" style="height:36px;">⚙️ More Filters</button>
</div>

<!-- Main Split View Layout -->
<div class="rcv-split-layout">

  <!-- Left: Receiving Queue Data Table -->
  <div class="sp-card" style="overflow:hidden;">
    <div class="sp-table-wrap" style="border:none;border-radius:0;box-shadow:none;">
      <table class="sp-table" style="font-size:12px;width:100%;">
        <thead>
          <tr>
            <th>RCV ID</th>
            <th>ASN ID</th>
            <th>PO ID</th>
            <th>Supplier</th>
            <th>Vehicle / Driver</th>
            <th>Expected Qty</th>
            <th>Received Qty</th>
            <th>Status</th>
            <th style="text-align:right;">Actions</th>
          </tr>
        </thead>
        <tbody>
          @forelse($asns as $index => $asn)
          @php
            $statuses = [
              0 => ['label'=>'Waiting', 'class'=>'sp-badge-amber', 'rx'=>0, 'pct'=>'0%'],
              1 => ['label'=>'In Progress', 'class'=>'sp-badge-blue', 'rx'=>120, 'pct'=>'37.5%'],
              2 => ['label'=>'Completed', 'class'=>'sp-badge-green', 'rx'=>210, 'pct'=>'100%'],
              3 => ['label'=>'Partial', 'class'=>'sp-badge-purple', 'rx'=>420, 'pct'=>'93.3%'],
              4 => ['label'=>'Delayed', 'class'=>'sp-badge-red', 'rx'=>0, 'pct'=>'0%'],
            ];
            $st = $statuses[$index % 5];
            $isSel = ($index == 0);
          @endphp
          <tr style="{{ $isSel ? 'background:#F0FDF4;border-left:3px solid #16A34A;' : '' }}">
            <td>
              <div style="font-weight:800;color:{{ $isSel ? '#16A34A' : '#0F172A' }};">RCV-2026-000{{ 45 - $index }}</div>
              <div style="font-size:10px;color:#94A3B8;">23 May 2026, 10:15 AM</div>
            </td>
            <td>
              <a href="#" style="font-weight:700;color:#2563EB;">{{ $asn->asn_number }}</a>
              <div style="font-size:10px;color:#94A3B8;">23 May 2026</div>
            </td>
            <td>
              <div style="font-weight:600;color:#1E293B;">{{ optional($asn->purchase)->reference_code ?: ('PO-2026-000'.(41 - $index)) }}</div>
            </td>
            <td>
              <div style="font-weight:700;color:#0F172A;">{{ $asn->supplier->name ?? 'Apex Appliance Distributors' }}</div>
            </td>
            <td>
              <div style="font-weight:600;color:#1E293B;">{{ $asn->vehicle_number ?: 'TN01AB2426' }}</div>
              <div style="font-size:10px;color:#94A3B8;">{{ $asn->driver_name ?: 'Ramesh' }}</div>
            </td>
            <td style="font-weight:700;color:#0F172A;">640 <span style="font-size:10px;color:#64748B;">Units</span></td>
            <td style="font-weight:700;">
              <div>{{ $st['rx'] }}</div>
              <div style="font-size:10px;color:#94A3B8;">({{ $st['pct'] }})</div>
            </td>
            <td>
              <span class="sp-badge {{ $st['class'] }}" style="font-size:10px;">{{ $st['label'] }}</span>
            </td>
            <td style="text-align:right;">
              <div style="display:flex;gap:4px;justify-content:flex-end;align-items:center;">
                <a href="{{ route('supplier.receiving.session', $asn->id) }}" class="sp-btn sp-btn-primary sp-btn-sm" style="background:#16A34A;padding:3px 10px;font-size:11px;">
                  Start Receiving
                </a>
                <div class="rcv-dropdown" id="rowDrop{{ $asn->id }}">
                  <button class="sp-btn sp-btn-secondary sp-btn-sm" style="padding:2px 6px;" onclick="toggleDropdown('rowDrop{{ $asn->id }}')">⋮</button>
                  <div class="rcv-dropdown-content">
                    <a class="rcv-dropdown-item {{ $st['pct'] == '100%' ? '' : 'disabled' }}" href="#" onclick="openGrnModal('{{ $asn->asn_number }}')">📜 Generate GRN</a>
                    <a class="rcv-dropdown-item" href="#">📊 Export Report</a>
                    <a class="rcv-dropdown-item" href="#">📈 View Timeline</a>
                    <a class="rcv-dropdown-item" href="#">🖨️ Print Receiving</a>
                  </div>
                </div>
              </div>
            </td>
          </tr>
          @empty
          <tr><td colspan="9" style="text-align:center;padding:30px;color:#94A3B8;">No receiving records found.</td></tr>
          @endforelse
        </tbody>
      </table>
    </div>
  </div>

  <!-- Right: Detail Panel (Split View Matching Mockup) -->
  <div class="rcv-drawer">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;border-bottom:1px solid #F1F5F9;padding-bottom:8px;">
      <div>
        <div style="font-size:16px;font-weight:800;color:#0F172A;">RCV-2026-00045</div>
        <div style="font-size:11px;color:#64748B;">Receiving Queue Summary</div>
      </div>
      <span class="sp-badge sp-badge-amber" style="font-size:10px;">Waiting</span>
    </div>

    <!-- Key Information Grid -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 12px;font-size:11.5px;margin-bottom:12px;">
      <div style="color:#64748B;">ASN ID</div><div style="font-weight:700;color:#2563EB;text-align:right;">ASN-2026-00025</div>
      <div style="color:#64748B;">PO ID</div><div style="font-weight:700;color:#0F172A;text-align:right;">PO-2026-00012</div>
      <div style="color:#64748B;">Supplier</div><div style="font-weight:700;color:#0F172A;text-align:right;">Apex Appliance Distributors</div>
      <div style="color:#64748B;">Vehicle</div><div style="font-weight:700;color:#0F172A;text-align:right;">TN01AB2426</div>
      <div style="color:#64748B;">Driver</div><div style="font-weight:700;color:#0F172A;text-align:right;">Ramesh</div>
      <div style="color:#64748B;">Dock</div><div style="font-weight:700;color:#16A34A;text-align:right;">Dock-03</div>
      <div style="color:#64748B;">Warehouse</div><div style="font-weight:700;color:#0F172A;text-align:right;">Main Warehouse</div>
      <div style="color:#64748B;">Expected Date</div><div style="font-weight:700;color:#0F172A;text-align:right;">23 May 2026, 10:00 AM</div>
    </div>

    <div style="height:1px;background:#F1F5F9;margin:10px 0;"></div>

    <!-- Quantities Breakdown -->
    <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:10px;font-size:12px;display:flex;flex-direction:column;gap:4px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;"><span style="color:#64748B;">Expected Qty</span><strong style="color:#0F172A;">640 Units</strong></div>
      <div style="display:flex;justify-content:space-between;"><span style="color:#64748B;">Received Qty</span><strong style="color:#16A34A;">0 Units (0%)</strong></div>
      <div style="display:flex;justify-content:space-between;"><span style="color:#64748B;">Rejected Qty</span><strong style="color:#DC2626;">0 Units</strong></div>
      <div style="display:flex;justify-content:space-between;"><span style="color:#64748B;">Damaged Qty</span><strong style="color:#D97706;">0 Units</strong></div>
    </div>

    <!-- Tabs -->
    <div style="display:flex;gap:12px;border-bottom:1px solid #E2E8F0;margin-bottom:12px;font-size:11.5px;font-weight:700;">
      <a href="#" style="color:#16A34A;border-bottom:2px solid #16A34A;padding-bottom:6px;text-decoration:none;">Overview</a>
      <a href="#" style="color:#64748B;text-decoration:none;padding-bottom:6px;">ASN Items</a>
      <a href="#" style="color:#64748B;text-decoration:none;padding-bottom:6px;">Timeline</a>
      <a href="#" style="color:#64748B;text-decoration:none;padding-bottom:6px;">Documents</a>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11.5px;margin-bottom:16px;">
      <div style="background:#F8FAFC;padding:8px;border-radius:6px;">
        <div style="color:#64748B;font-size:10px;">Items</div>
        <div style="font-weight:800;color:#0F172A;font-size:14px;">18</div>
      </div>
      <div style="background:#F8FAFC;padding:8px;border-radius:6px;">
        <div style="color:#64748B;font-size:10px;">Total Value</div>
        <div style="font-weight:800;color:#0F172A;font-size:14px;">₹ 1,24,560.00</div>
      </div>
      <div style="background:#F8FAFC;padding:8px;border-radius:6px;">
        <div style="color:#64748B;font-size:10px;">Assigned To</div>
        <div style="font-weight:700;color:#0F172A;">Warehouse Team A</div>
      </div>
      <div style="background:#F8FAFC;padding:8px;border-radius:6px;">
        <div style="color:#64748B;font-size:10px;">Priority</div>
        <div style="font-weight:800;color:#DC2626;">High</div>
      </div>
    </div>

    <a href="{{ route('supplier.receiving.session', 1) }}" class="sp-btn sp-btn-primary" style="width:100%;height:40px;background:#16A34A;font-weight:800;justify-content:center;">
      Start Receiving
    </a>
  </div>

</div>

<!-- Generate GRN Confirmation Modal -->
<div id="grnModal" style="display:none;position:fixed;inset:0;background:rgba(15,23,42,0.4);backdrop-filter:blur(4px);z-index:1000;align-items:center;justify-content:center;">
  <div style="background:#FFF;border-radius:16px;width:90%;max-width:440px;padding:24px;box-shadow:0 10px 30px rgba(0,0,0,0.15);">
    <div style="text-align:center;margin-bottom:16px;">
      <div style="width:56px;height:56px;background:#DCFCE7;color:#16A34A;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;margin:0 auto 10px auto;">✓</div>
      <h3 style="font-size:16px;font-weight:800;color:#0F172A;margin:0;">Generate Goods Receipt Note?</h3>
      <p style="font-size:12px;color:#64748B;margin-top:4px;">Please review the verified quantities before official GRN creation.</p>
    </div>

    <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:12px;font-size:12px;display:flex;flex-direction:column;gap:6px;margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;"><span style="color:#64748B;">ASN ID:</span><strong style="color:#0F172A;">ASN-2026-00025</strong></div>
      <div style="display:flex;justify-content:space-between;"><span style="color:#64748B;">PO ID:</span><strong style="color:#2563EB;">PO-2026-00012</strong></div>
      <div style="display:flex;justify-content:space-between;"><span style="color:#64748B;">Supplier:</span><strong style="color:#0F172A;">Apex Appliance Distributors</strong></div>
      <div style="display:flex;justify-content:space-between;"><span style="color:#64748B;">Received Qty:</span><strong style="color:#16A34A;">640 Units</strong></div>
      <div style="display:flex;justify-content:space-between;"><span style="color:#64748B;">Rejected Qty:</span><strong style="color:#DC2626;">4 Units</strong></div>
      <div style="display:flex;justify-content:space-between;"><span style="color:#64748B;">Damaged Qty:</span><strong style="color:#D97706;">2 Units</strong></div>
    </div>

    <div style="display:flex;gap:10px;justify-content:flex-end;">
      <button class="sp-btn sp-btn-secondary" onclick="closeGrnModal()">Cancel</button>
      <button class="sp-btn sp-btn-primary" style="background:#16A34A;" onclick="alert('GRN-2026-00084 Created Successfully!'); closeGrnModal();">Generate GRN</button>
    </div>
  </div>
</div>

@endsection

@section('scripts')
<script>
  function toggleDropdown(id) {
    const el = document.getElementById(id);
    document.querySelectorAll('.rcv-dropdown').forEach(d => {
      if (d !== el) d.classList.remove('open');
    });
    if (el) el.classList.toggle('open');
  }

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.rcv-dropdown')) {
      document.querySelectorAll('.rcv-dropdown').forEach(d => d.classList.remove('open'));
    }
  });

  function openGrnModal(asnNum) {
    document.getElementById('grnModal').style.display = 'flex';
  }

  function closeGrnModal() {
    document.getElementById('grnModal').style.display = 'none';
  }
</script>
@endsection
