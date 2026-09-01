@extends('pda.layout')

@section('title', 'Warehouse Scanner Home — INFY-POS')

@section('head')
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800;900&display=swap" rel="stylesheet">
<style>
  * { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; box-sizing: border-box; }

  .pda-dashboard-wrapper {
    display: flex; flex-direction: column; gap: 14px; padding-bottom: 24px;
  }

  /* 1. TOP GREETING BANNER CARD */
  .pda-banner-card {
    background: linear-gradient(135deg, #F0FDF4 0%, #E8F5E9 100%);
    border: 1px solid #DCFCE7; border-radius: 20px; padding: 18px 16px 14px 16px;
    position: relative; overflow: hidden; box-shadow: 0 2px 8px rgba(22, 163, 74, 0.05);
  }
  
  .pda-banner-content { position: relative; z-index: 2; width: 60%; }
  .pda-greeting-text { font-size: 13px; font-weight: 700; color: #1E293B; margin-bottom: 2px; }
  .pda-user-name { font-size: 22px; font-weight: 900; color: #15803D; margin-bottom: 6px; letter-spacing: -0.4px; line-height: 1.1; }
  .pda-wh-location { font-size: 12px; font-weight: 700; color: #475569; display: flex; align-items: center; gap: 5px; }

  /* Warehouse Illustration Graphic */
  .pda-wh-illustration {
    position: absolute; right: -5px; top: 10px; width: 145px; height: 95px; z-index: 1; pointer-events: none;
  }

  /* Current Shift Bar */
  .pda-shift-card {
    background: #FFFFFF; border-radius: 14px; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between;
    border: 1px solid #E2E8F0; box-shadow: 0 1px 3px rgba(0,0,0,0.02); margin-top: 12px; position: relative; z-index: 2;
  }
  .pda-shift-left { display: flex; align-items: center; gap: 10px; }
  .pda-shift-icon-box {
    width: 32px; height: 32px; border-radius: 10px; background: #F0FDF4; border: 1px solid #DCFCE7; color: #16A34A;
    display: flex; align-items: center; justify-content: center; font-size: 17px;
  }
  .pda-shift-lbl { font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.3px; }
  .pda-shift-time { font-size: 13px; font-weight: 900; color: #0F172A; }
  .pda-shift-pill {
    background: #DCFCE7; color: #15803D; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 12px;
    display: flex; align-items: center; gap: 5px; border: 1px solid #BBF7D0;
  }

  /* 2. MAIN OPERATION CARDS (INBOUND, OUTBOUND, BIN MOVEMENT) */
  .pda-op-card {
    background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 20px; padding: 16px;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.02);
  }

  .pda-op-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .pda-op-header-left { display: flex; align-items: center; gap: 12px; }

  .pda-op-square-icon {
    width: 46px; height: 46px; border-radius: 14px; display: flex; align-items: center; justify-content: center;
    font-size: 22px; color: #FFFFFF; flex-shrink: 0; boxShadow: 0 4px 10px rgba(0,0,0,0.06);
  }

  .pda-op-title { font-size: 16.5px; font-weight: 900; letter-spacing: 0.3px; line-height: 1.2; }
  .pda-op-subtitle { font-size: 11.5px; color: #64748B; font-weight: 600; margin-top: 1px; }

  .pda-op-arrow-circle {
    width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 800; text-decoration: none; transition: transform 0.15s;
  }
  .pda-op-arrow-circle:active { transform: scale(0.92); }

  /* Sub-Actions Cards Grid */
  .pda-sub-actions-container {
    background: #F8FAFC; border: 1px solid #F1F5F9; border-radius: 14px; padding: 8px;
    display: grid; gap: 8px;
  }
  .pda-grid-cols-2 { grid-template-columns: 1fr 1fr; }
  .pda-grid-cols-3 { grid-template-columns: 1fr 1fr 1fr; }

  .pda-sub-action-btn {
    background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 10px 8px;
    display: flex; align-items: center; justify-content: space-between; text-decoration: none; color: #0F172A;
    transition: all 0.15s; position: relative; overflow: hidden;
  }
  .pda-sub-action-btn:active { background: #F1F5F9; border-color: #CBD5E1; }

  .pda-sub-left-content { display: flex; align-items: center; gap: 7px; min-width: 0; }
  .pda-sub-icon-display { font-size: 17px; flex-shrink: 0; }
  .pda-sub-text-title { font-size: 12px; font-weight: 800; color: #0F172A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pda-sub-text-desc { font-size: 9.5px; color: #64748B; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pda-sub-arrow-right { font-size: 11px; color: #94A3B8; font-weight: 800; flex-shrink: 0; }

  /* Color Variations */
  /* Inbound Green */
  .bg-inbound-square { background: #16A34A; }
  .text-inbound-header { color: #16A34A; }
  .bg-inbound-circle { background: #DCFCE7; color: #16A34A; }

  /* Outbound Blue */
  .bg-outbound-square { background: #2563EB; }
  .text-outbound-header { color: #2563EB; }
  .bg-outbound-circle { background: #DBEAFE; color: #2563EB; }

  /* Bin Movement Orange */
  .bg-bin-square { background: #EA580C; }
  .text-bin-header { color: #EA580C; }
  .bg-bin-circle { background: #FFEDD5; color: #EA580C; }

  /* 3. TODAY'S TASKS SECTION */
  .pda-section-heading-row { display: flex; align-items: center; justify-content: space-between; margin: 4px 0 2px; }
  .pda-section-heading-text { font-size: 12px; font-weight: 900; color: #334155; letter-spacing: 0.5px; text-transform: uppercase; }
  .pda-section-link-all { font-size: 12px; font-weight: 800; color: #16A34A; text-decoration: none; display: flex; align-items: center; gap: 2px; }

  .pda-tasks-4grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .pda-task-tile {
    background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; padding: 10px 4px; text-align: center;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02); display: flex; flex-direction: column; align-items: center; justify-content: space-between;
  }
  .pda-task-icon-wrapper {
    width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center;
    font-size: 16px; margin-bottom: 4px;
  }
  .pda-task-number { font-size: 19px; font-weight: 900; color: #0F172A; line-height: 1; margin-bottom: 2px; }
  .pda-task-title-text { font-size: 10px; font-weight: 800; color: #475569; margin-bottom: 2px; white-space: nowrap; }
  .pda-task-status-pill { font-size: 9px; font-weight: 800; }

  /* 4. RECENT NOTIFICATIONS SECTION */
  .pda-notif-box {
    background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; padding: 12px 14px;
    display: flex; align-items: center; justify-content: space-between; box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  }
  .pda-notif-left-side { display: flex; align-items: center; gap: 10px; }
  .pda-notif-green-icon {
    width: 36px; height: 36px; border-radius: 10px; background: #16A34A; color: #FFFFFF;
    display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;
  }
  .pda-notif-main-title { font-size: 12px; font-weight: 800; color: #0F172A; }
  .pda-notif-dock-text { font-size: 10.5px; color: #64748B; font-weight: 600; }
  .pda-notif-time-badge { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #64748B; font-weight: 600; }
  .pda-red-dot-indicator { width: 7px; height: 7px; border-radius: 50%; background: #EF4444; }
</style>
@endsection

@section('content')

<div class="pda-dashboard-wrapper">

  <!-- 1. TOP GREETING BANNER WITH WAREHOUSE GRAPHIC -->
  <div class="pda-banner-card">
    <div class="pda-banner-content">
      <div class="pda-greeting-text" id="greetingTime">Good Morning,</div>
      <div class="pda-user-name">{{ session('pda_emp_name', 'admin') }}</div>
      <div class="pda-wh-location">
        <i class="bi bi-geo-alt-fill" style="color: #16A34A;"></i>
        <span>{{ session('pda_warehouse', 'Main Warehouse') }}</span>
      </div>
    </div>

    <!-- Warehouse Vector Graphic -->
    <svg class="pda-wh-illustration" viewBox="0 0 160 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 80L80 20L150 80" stroke="#CBD5E1" stroke-width="2"/>
      <rect x="25" y="40" width="110" height="40" rx="4" fill="#F1F5F9" stroke="#94A3B8" stroke-width="1.5"/>
      <path d="M20 40L80 15L140 40H20Z" fill="#16A34A"/>
      <rect x="65" y="48" width="30" height="32" fill="#0F172A" rx="3"/>
      <rect x="68" y="51" width="24" height="29" fill="#334155"/>
      <rect x="110" y="58" width="18" height="18" fill="#D97706" rx="2"/>
      <circle cx="115" cy="76" r="3" fill="#0F172A"/>
      <circle cx="123" cy="76" r="3" fill="#0F172A"/>
      <rect x="40" y="60" width="12" height="12" fill="#F59E0B" rx="2"/>
    </svg>

    <!-- Shift Row -->
    <div class="pda-shift-card">
      <div class="pda-shift-left">
        <div class="pda-shift-icon-box">
          <i class="bi bi-clock"></i>
        </div>
        <div>
          <div class="pda-shift-lbl">Current Shift</div>
          <div class="pda-shift-time">{{ session('pda_shift', 'Morning (08:00 AM - 04:00 PM)') }}</div>
        </div>
      </div>
      <div class="pda-shift-pill">
        <span style="font-size: 7px;">●</span> In Progress
      </div>
    </div>
  </div>

  <!-- 2. INBOUND CARD (Green Theme) -->
  <div class="pda-op-card">
    <div class="pda-op-header">
      <div class="pda-op-header-left">
        <div class="pda-op-square-icon bg-inbound-square">
          <i class="bi bi-box-arrow-in-down"></i>
        </div>
        <div>
          <div class="pda-op-title text-inbound-header">INBOUND</div>
          <div class="pda-op-subtitle">Receive and process incoming goods</div>
        </div>
      </div>
      <a href="{{ route('pda.receiving') }}" class="pda-op-arrow-circle bg-inbound-circle">
        <i class="bi bi-chevron-right"></i>
      </a>
    </div>

    <!-- Sub Actions Grid (Receiving & Putaway) -->
    <div class="pda-sub-actions-container pda-grid-cols-2">
      <a href="{{ route('pda.receiving') }}" class="pda-sub-action-btn">
        <div class="pda-sub-left-content">
          <div class="pda-sub-icon-display" style="color: #16A34A;"><i class="bi bi-truck"></i></div>
          <div>
            <div class="pda-sub-text-title">Receiving</div>
            <div class="pda-sub-text-desc">Receive & Inspect</div>
          </div>
        </div>
        <i class="bi bi-chevron-right pda-sub-arrow-right"></i>
      </a>

      <a href="{{ route('pda.putaway') }}" class="pda-sub-action-btn">
        <div class="pda-sub-left-content">
          <div class="pda-sub-icon-display" style="color: #16A34A;"><i class="bi bi-grid-3x3-gap"></i></div>
          <div>
            <div class="pda-sub-text-title">Putaway</div>
            <div class="pda-sub-text-desc">Store in Location</div>
          </div>
        </div>
        <i class="bi bi-chevron-right pda-sub-arrow-right"></i>
      </a>
    </div>
  </div>

  <!-- 3. OUTBOUND CARD (Blue Theme) -->
  <div class="pda-op-card">
    <div class="pda-op-header">
      <div class="pda-op-header-left">
        <div class="pda-op-square-icon bg-outbound-square">
          <i class="bi bi-box-arrow-up-right"></i>
        </div>
        <div>
          <div class="pda-op-title text-outbound-header">OUTBOUND</div>
          <div class="pda-op-subtitle">Fulfill customer orders</div>
        </div>
      </div>
      <a href="{{ route('pda.outbound.picking') }}" class="pda-op-arrow-circle bg-outbound-circle">
        <i class="bi bi-chevron-right"></i>
      </a>
    </div>

    <!-- Sub Actions Grid (Picking, Packing, Dispatch) -->
    <div class="pda-sub-actions-container pda-grid-cols-3">
      <a href="{{ route('pda.outbound.picking') }}" class="pda-sub-action-btn">
        <div class="pda-sub-left-content">
          <div class="pda-sub-icon-display" style="color: #2563EB;"><i class="bi bi-cart3"></i></div>
          <div>
            <div class="pda-sub-text-title">Picking</div>
            <div class="pda-sub-text-desc">Pick Items</div>
          </div>
        </div>
        <i class="bi bi-chevron-right pda-sub-arrow-right"></i>
      </a>

      <a href="{{ route('pda.outbound.packing') }}" class="pda-sub-action-btn">
        <div class="pda-sub-left-content">
          <div class="pda-sub-icon-display" style="color: #2563EB;"><i class="bi bi-box-seam"></i></div>
          <div>
            <div class="pda-sub-text-title">Packing</div>
            <div class="pda-sub-text-desc">Pack Orders</div>
          </div>
        </div>
        <i class="bi bi-chevron-right pda-sub-arrow-right"></i>
      </a>

      <a href="{{ route('pda.outbound.dispatch') }}" class="pda-sub-action-btn">
        <div class="pda-sub-left-content">
          <div class="pda-sub-icon-display" style="color: #2563EB;"><i class="bi bi-truck-flatbed"></i></div>
          <div>
            <div class="pda-sub-text-title">Dispatch</div>
            <div class="pda-sub-text-desc">Ship Orders</div>
          </div>
        </div>
        <i class="bi bi-chevron-right pda-sub-arrow-right"></i>
      </a>
    </div>
  </div>

  <!-- 4. BIN MOVEMENT CARD (Orange Theme) -->
  <div class="pda-op-card">
    <div class="pda-op-header">
      <div class="pda-op-header-left">
        <div class="pda-op-square-icon bg-bin-square">
          <i class="bi bi-arrow-repeat"></i>
        </div>
        <div>
          <div class="pda-op-title text-bin-header">BIN MOVEMENT</div>
          <div class="pda-op-subtitle">Move stock between bins</div>
        </div>
      </div>
      <a href="{{ route('pda.bin-movement') }}" class="pda-op-arrow-circle bg-bin-circle">
        <i class="bi bi-chevron-right"></i>
      </a>
    </div>

    <!-- Sub Actions Grid (Move Stock, Confirm Move, History) -->
    <div class="pda-sub-actions-container pda-grid-cols-3">
      <a href="{{ route('pda.bin-movement') }}" class="pda-sub-action-btn">
        <div class="pda-sub-left-content">
          <div class="pda-sub-icon-display" style="color: #EA580C;"><i class="bi bi-arrow-down-up"></i></div>
          <div>
            <div class="pda-sub-text-title">Move Stock</div>
            <div class="pda-sub-text-desc">Transfer Items</div>
          </div>
        </div>
        <i class="bi bi-chevron-right pda-sub-arrow-right"></i>
      </a>

      <a href="{{ route('pda.bin-movement') }}" class="pda-sub-action-btn">
        <div class="pda-sub-left-content">
          <div class="pda-sub-icon-display" style="color: #EA580C;"><i class="bi bi-check-circle"></i></div>
          <div>
            <div class="pda-sub-text-title">Confirm Move</div>
            <div class="pda-sub-text-desc">Confirm Transfer</div>
          </div>
        </div>
        <i class="bi bi-chevron-right pda-sub-arrow-right"></i>
      </a>

      <a href="{{ route('pda.bin-movement') }}" class="pda-sub-action-btn">
        <div class="pda-sub-left-content">
          <div class="pda-sub-icon-display" style="color: #EA580C;"><i class="bi bi-clock-history"></i></div>
          <div>
            <div class="pda-sub-text-title">History</div>
            <div class="pda-sub-text-desc">Movement History</div>
          </div>
        </div>
        <i class="bi bi-chevron-right pda-sub-arrow-right"></i>
      </a>
    </div>
  </div>

  <!-- 5. TODAY'S TASKS SECTION -->
  <div>
    <div class="pda-section-heading-row">
      <div class="pda-section-heading-text">TODAY'S TASKS</div>
      <a href="{{ route('pda.receiving') }}" class="pda-section-link-all">View All <i class="bi bi-chevron-right"></i></a>
    </div>

    <div class="pda-tasks-4grid">
      <!-- Receiving Task -->
      <a href="{{ route('pda.receiving') }}" class="pda-task-tile" style="text-decoration: none;">
        <div class="pda-task-icon-wrapper" style="background: #DCFCE7; color: #16A34A;"><i class="bi bi-truck"></i></div>
        <div class="pda-task-number">{{ $stats['receiving'] ?? 0 }}</div>
        <div class="pda-task-title-text">Receiving</div>
        <div class="pda-task-status-pill" style="color: #16A34A;">In Progress</div>
      </a>

      <!-- Putaway Task -->
      <a href="{{ route('pda.putaway') }}" class="pda-task-tile" style="text-decoration: none;">
        <div class="pda-task-icon-wrapper" style="background: #FEF3C7; color: #D97706;"><i class="bi bi-grid-3x3-gap"></i></div>
        <div class="pda-task-number">{{ $stats['putaway'] ?? 0 }}</div>
        <div class="pda-task-title-text">Putaway</div>
        <div class="pda-task-status-pill" style="color: #16A34A;">Pending</div>
      </a>

      <!-- Picking Task -->
      <a href="{{ route('pda.outbound.picking') }}" class="pda-task-tile" style="text-decoration: none;">
        <div class="pda-task-icon-wrapper" style="background: #DBEAFE; color: #2563EB;"><i class="bi bi-cart3"></i></div>
        <div class="pda-task-number">{{ $stats['picking'] ?? 0 }}</div>
        <div class="pda-task-title-text">Picking</div>
        <div class="pda-task-status-pill" style="color: #2563EB;">Pending</div>
      </a>

      <!-- Pending GRN Task -->
      <a href="{{ route('pda.receiving') }}" class="pda-task-tile" style="text-decoration: none;">
        <div class="pda-task-icon-wrapper" style="background: #FFEDD5; color: #EA580C;"><i class="bi bi-file-earmark-text"></i></div>
        <div class="pda-task-number">{{ $stats['pending_grn'] ?? 0 }}</div>
        <div class="pda-task-title-text">Pending GRN</div>
        <div class="pda-task-status-pill" style="color: #EA580C;">To Generate</div>
      </a>
    </div>
  </div>

  <!-- 6. RECENT NOTIFICATIONS SECTION -->
  <div>
    <div class="pda-section-heading-row">
      <div class="pda-section-heading-text">RECENT NOTIFICATIONS</div>
      <a href="#" onclick="alert('Warehouse Notifications:\n{{ $latestAsn ? ('ASN ' . $latestAsn->asn_number . ' ' . ucfirst($latestAsn->status)) : 'No new notifications' }}'); return false;" class="pda-section-link-all">View All <i class="bi bi-chevron-right"></i></a>
    </div>

    <div class="pda-notif-box">
      <div class="pda-notif-left-side">
        <div class="pda-notif-green-icon">
          <i class="bi bi-file-earmark-check"></i>
        </div>
        <div>
          <div class="pda-notif-main-title">
            {{ $latestAsn ? ('ASN ' . $latestAsn->asn_number . ' ' . ucfirst($latestAsn->status)) : 'No recent notifications' }}
          </div>
          <div class="pda-notif-dock-text">
            {{ $latestAsn ? ('Dock: ' . ($latestAsn->dock_number ?? 'DCK-01')) : 'System Active' }}
          </div>
        </div>
      </div>
      <div class="pda-notif-time-badge">
        <span>{{ $latestAsn ? $latestAsn->created_at->diffForHumans() : 'Just now' }}</span>
        <div class="pda-red-dot-indicator"></div>
      </div>
    </div>
  </div>

</div>

<!-- Profile Modal Sheet -->
<div class="pda-modal-backdrop" id="profileModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); z-index: 1000; display: none; align-items: flex-end; justify-content: center;">
  <div style="width: 100%; max-width: 440px; background: #FFFFFF; border-radius: 28px 28px 0 0; padding: 24px; box-shadow: 0 -10px 40px rgba(0,0,0,0.2);">
    <div style="width: 40px; height: 4px; background: #CBD5E1; border-radius: 2px; margin: 0 auto 16px;"></div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
      <h4 style="font-size: 18px; font-weight: 900; color: #0F172A; margin: 0;">Employee Profile</h4>
      <button onclick="document.getElementById('profileModal').style.display='none'" style="background:none; border:none; font-size:20px; color:#64748B; cursor:pointer;"><i class="bi bi-x-circle-fill"></i></button>
    </div>

    <div style="text-align:center; padding: 10px 0 20px;">
      <div style="width: 64px; height: 64px; border-radius: 50%; background: #DCFCE7; color: #16A34A; display: inline-flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 900; border: 3px solid #86EFAC; margin-bottom: 8px;">
        {{ strtoupper(substr(session('pda_emp_name', 'admin'), 0, 2)) }}
      </div>
      <h3 style="font-size: 18px; font-weight: 900; color: #0F172A; margin: 0;">{{ session('pda_emp_name', 'admin') }}</h3>
      <p style="font-size: 12px; color: #64748B; margin: 2px 0 12px;">{{ session('pda_emp_email', 'admin@infypos.com') }}</p>
      <span style="background: #F0FDF4; border: 1px solid #DCFCE7; color: #16A34A; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 20px;">
        ● Active Employee
      </span>
    </div>

    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 16px; font-size: 12.5px; display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
      <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px;">
        <span style="color: #64748B;">Employee ID:</span>
        <strong style="color: #0F172A;">{{ session('pda_emp_id', 'EMP-0001') }}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px;">
        <span style="color: #64748B;">Assigned Warehouse:</span>
        <strong style="color: #16A34A;">{{ session('pda_warehouse', 'Main Warehouse') }}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px;">
        <span style="color: #64748B;">Role & Permission:</span>
        <strong style="color: #0F172A;">{{ session('pda_role', 'Warehouse Executive') }}</strong>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #64748B;">Current Shift:</span>
        <strong style="color: #0F172A;">{{ session('pda_shift', 'Morning (08:00 AM - 04:00 PM)') }}</strong>
      </div>
    </div>

    <a href="{{ route('pda.logout') }}" style="width: 100%; height: 48px; background: #EF4444; color: #FFFFFF; border: none; border-radius: 12px; font-size: 14.5px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none;">
      <i class="bi bi-box-arrow-right"></i>
      <span>LOGOUT SCANNER</span>
    </a>
  </div>
</div>

@endsection

@section('scripts')
<script>
  // Dynamic Greeting
  const hour = new Date().getHours();
  const greetingEl = document.getElementById('greetingTime');
  if (greetingEl) {
    if (hour < 12) greetingEl.innerText = "Good Morning,";
    else if (hour < 17) greetingEl.innerText = "Good Afternoon,";
    else greetingEl.innerText = "Good Evening,";
  }

  function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'flex';
  }
</script>
@endsection
