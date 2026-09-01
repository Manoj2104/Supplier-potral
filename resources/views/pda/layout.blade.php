<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>@yield('title', 'infy-pos WMS Scanner')</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <style>
    :root {
      --brand-green: #059669;
      --brand-green-hover: #047857;
      --brand-green-light: #ECFDF5;
      --brand-green-border: #A7F3D0;
      --bg-slate: #F9FAFB;
      --card-bg: #FFFFFF;
      --text-dark: #111827;
      --text-muted: #6B7280;
      --border-gray: #E5E7EB;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; -webkit-tap-highlight-color: transparent; }

    body {
      background: #111827;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      color: var(--text-dark);
    }

    /* PDA Mobile Phone Frame (390px x 844px) */
    .pda-shell {
      width: 100%;
      max-width: 410px;
      height: 100vh;
      max-height: 870px;
      background: var(--bg-slate);
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6);
      border-radius: 36px;
      border: 8px solid #1F2937;
    }

    @media (max-width: 480px) {
      .pda-shell {
        max-width: 100%;
        height: 100vh;
        max-height: 100vh;
        border-radius: 0;
        border: none;
      }
    }

    /* Phone Top Notch / Status Bar */
    .pda-status-bar {
      background: #FFFFFF;
      color: #111827;
      padding: 8px 16px 4px;
      font-size: 11px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }

    /* Header Bar */
    .pda-header {
      background: #FFFFFF;
      border-bottom: 1px solid var(--border-gray);
      padding: 10px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
      min-height: 48px;
    }
    .pda-header-back {
      font-size: 18px; color: var(--text-dark); text-decoration: none; display: flex; align-items: center;
    }
    .pda-header-title { font-size: 16px; font-weight: 800; color: var(--text-dark); flex: 1; text-align: center; }

    /* Content Area */
    .pda-content {
      flex: 1;
      overflow-y: auto;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    /* UI Card */
    .pda-card {
      background: var(--card-bg);
      border: 1px solid var(--border-gray);
      border-radius: 14px;
      padding: 14px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }

    /* Green Main Action Button */
    .pda-btn-green {
      width: 100%;
      height: 48px;
      background: var(--brand-green);
      color: #FFFFFF;
      border: none;
      border-radius: 12px;
      font-size: 14.5px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      text-decoration: none;
      transition: background 0.15s ease;
      box-shadow: 0 2px 8px rgba(5, 150, 105, 0.25);
    }
    .pda-btn-green:hover, .pda-btn-green:active { background: var(--brand-green-hover); }

    .pda-btn-outline {
      width: 100%;
      height: 44px;
      background: #FFFFFF;
      color: #374151;
      border: 1px solid #D1D5DB;
      border-radius: 12px;
      font-size: 13.5px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      cursor: pointer;
      text-decoration: none;
    }

    /* Bottom Navigation Bar */
    .pda-bottom-nav {
      background: #FFFFFF;
      border-top: 1px solid var(--border-gray);
      display: flex;
      align-items: center;
      justify-content: space-around;
      padding: 8px 0 12px;
      flex-shrink: 0;
    }
    .pda-nav-link {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      color: var(--text-muted);
      text-decoration: none;
      font-size: 10.5px;
      font-weight: 600;
      flex: 1;
      text-align: center;
    }
    .pda-nav-link i { font-size: 19px; }
    .pda-nav-link.active { color: var(--brand-green); font-weight: 800; }

    /* Badges */
    .pda-badge {
      font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 6px; display: inline-block;
    }
    .badge-pending { background: #FEF3C7; color: #D97706; }
    .badge-completed { background: #D1FAE5; color: #059669; }
    .badge-delayed { background: #FEE2E2; color: #DC2626; }
  </style>
  @yield('head')
</head>
<body>

<div class="pda-shell">

  <!-- Status Bar (iOS / Android Mobile Style) -->
  <div class="pda-status-bar">
    <span>10:32</span>
    <div style="display:flex;gap:6px;align-items:center;">
      <i class="bi bi-wifi"></i>
      <i class="bi bi-reception-4"></i>
      <i class="bi bi-battery-full"></i>
    </div>
  </div>

  <!-- Header Bar -->
  <div class="pda-header" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; background: #FFFFFF; border-bottom: 1px solid #E2E8F0;">
    @if(request()->routeIs('pda.dashboard'))
      <a href="#" onclick="openModal('profileModal'); return false;" class="pda-header-back" style="color: #0F172A; text-decoration: none;" title="Employee Profile"><i class="bi bi-list" style="font-size: 24px; font-weight: bold;"></i></a>
    @else
      <a href="{{ route('pda.dashboard') }}" class="pda-header-back" style="color: #0F172A; text-decoration: none;" title="Back to Dashboard"><i class="bi bi-arrow-left" style="font-size: 24px; font-weight: bold;"></i></a>
    @endif

    <div style="text-align: center;">
      <div style="font-size: 19px; font-weight: 900; color: #0F172A; letter-spacing: -0.5px; line-height: 1;">
        INFY-<span>POS</span>
      </div>
      <div style="font-size: 9.5px; font-weight: 800; color: #64748B; letter-spacing: 1.2px; text-transform: uppercase; margin-top: 2px;">
        Warehouse Scanner
      </div>
    </div>

    <div style="position: relative; cursor: pointer;" onclick="alert('3 Unread Warehouse Notifications:\n1. ASN ASN-2026-00056 arrived (Dock: DCK-03)\n2. Supplier ASN Created\n3. Putaway Pending');">
      <i class="bi bi-bell" style="font-size: 20px; color: #0F172A;"></i>
      <span style="position: absolute; top: -4px; right: -6px; background: #EF4444; color: #FFFFFF; font-size: 9px; font-weight: 800; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1.5px solid #FFFFFF;">3</span>
    </div>
  </div>

  <!-- Main Scrollable Content -->
  <div class="pda-content">
    @yield('content')
  </div>

  <!-- Bottom Navigation Bar (3 Clean Operations: Home, Profile, Logout) -->
  <div class="pda-bottom-nav" style="background: #FFFFFF; border-top: 1px solid #E2E8F0; display: flex; align-items: center; justify-content: space-around; padding: 0; position: relative;">
    <a href="{{ route('pda.dashboard') }}" class="pda-nav-link {{ request()->routeIs('pda.dashboard') ? 'active' : '' }}" style="flex: 1; text-align: center; padding: 10px 0; color: {{ request()->routeIs('pda.dashboard') ? '#16A34A' : '#64748B' }}; text-decoration: none; font-size: 11px; font-weight: 700; border-top: {{ request()->routeIs('pda.dashboard') ? '3px solid #16A34A' : '3px solid transparent' }};">
      <i class="bi bi-house-door-fill" style="font-size: 20px; display: block; margin-bottom: 2px;"></i>
      <span>Home</span>
    </a>
    <a href="#" onclick="openModal('profileModal'); return false;" class="pda-nav-link" style="flex: 1; text-align: center; padding: 10px 0; color: #64748B; text-decoration: none; font-size: 11px; font-weight: 700; border-top: 3px solid transparent;">
      <i class="bi bi-person-circle" style="font-size: 20px; display: block; margin-bottom: 2px;"></i>
      <span>Profile</span>
    </a>
    <a href="#" onclick="if(confirm('Are you sure you want to logout from the scanner?')){ window.location.href='{{ route('pda.logout') }}'; } return false;" class="pda-nav-link" style="flex: 1; text-align: center; padding: 10px 0; color: #64748B; text-decoration: none; font-size: 11px; font-weight: 700; border-top: 3px solid transparent;">
      <i class="bi bi-box-arrow-right" style="font-size: 20px; display: block; margin-bottom: 2px;"></i>
      <span>Logout</span>
    </a>
  </div>

</div>

<!-- Employee Profile Drawer Modal -->
<div id="profileModal" style="display:none; position:fixed; inset:0; background:rgba(15,23,42,0.65); backdrop-filter:blur(4px); z-index:9999; align-items:flex-end; justify-content:center;">
  <div style="width:100%; max-width:410px; background:#FFFFFF; border-radius:24px 24px 0 0; padding:24px 20px 28px; box-shadow:0 -10px 30px rgba(0,0,0,0.15);">
    
    <!-- Grabber Handle -->
    <div style="width:40px; height:5px; background:#E2E8F0; border-radius:3px; margin:0 auto 16px auto;"></div>

    <!-- User Header Avatar Card -->
    <div style="display:flex; align-items:center; gap:14px; padding-bottom:16px; border-bottom:1px solid #F1F5F9; margin-bottom:16px;">
      @php
        $empName  = session('pda_emp_name', 'Warehouse Employee');
        $words    = explode(' ', $empName);
        $initials = strtoupper(substr($words[0] ?? 'W', 0, 1) . (isset($words[1]) ? substr($words[1], 0, 1) : substr($words[0] ?? 'E', 1, 1)));
      @endphp
      <div style="width:52px; height:52px; border-radius:16px; background:linear-gradient(135deg,#16A34A 0%,#047857 100%); color:#FFFFFF; font-size:20px; font-weight:900; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(22,163,74,0.25); flex-shrink:0;">
        {{ $initials }}
      </div>
      <div>
        <div style="font-size:18px; font-weight:900; color:#0F172A; line-height:1.2;">{{ $empName }}</div>
        <div style="font-size:12px; font-weight:700; color:#16A34A; margin-top:2px;">{{ session('pda_role', 'Warehouse Executive') }}</div>
      </div>
    </div>

    <!-- User Details Rows -->
    <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:20px;">
      <div style="display:flex; justify-content:space-between; align-items:center; background:#F8FAFC; padding:10px 14px; border-radius:12px; font-size:12.5px;">
        <span style="color:#64748B; font-weight:700;">Employee ID</span>
        <span style="color:#0F172A; font-weight:900; font-family:monospace;">{{ session('pda_emp_id', 'EMP-0001') }}</span>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; background:#F8FAFC; padding:10px 14px; border-radius:12px; font-size:12.5px;">
        <span style="color:#64748B; font-weight:700;">Email Address</span>
        <span style="color:#0F172A; font-weight:800; font-size:12px;">{{ session('pda_emp_email', 'employee@infy-pos.com') }}</span>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; background:#F8FAFC; padding:10px 14px; border-radius:12px; font-size:12.5px;">
        <span style="color:#64748B; font-weight:700;">Assigned Warehouse</span>
        <span style="color:#0F172A; font-weight:800;">{{ session('pda_warehouse', 'Main Warehouse') }}</span>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; background:#F8FAFC; padding:10px 14px; border-radius:12px; font-size:12.5px;">
        <span style="color:#64748B; font-weight:700;">Working Shift</span>
        <span style="color:#0F172A; font-weight:800;">{{ session('pda_shift', 'Morning Shift') }}</span>
      </div>
    </div>

    <!-- Actions -->
    <div style="display:grid; grid-template-columns:1fr 1.2fr; gap:10px;">
      <button type="button" onclick="closeModal('profileModal')" style="height:46px; border:1.5px solid #E2E8F0; background:#FFFFFF; color:#0F172A; border-radius:12px; font-size:13.5px; font-weight:800; cursor:pointer;">Close</button>
      <a href="{{ route('pda.logout') }}" style="height:46px; background:#DC2626; color:#FFFFFF; border-radius:12px; font-size:13.5px; font-weight:800; display:flex; align-items:center; justify-content:center; gap:6px; text-decoration:none; box-shadow:0 4px 12px rgba(220,38,38,0.2);">
        <i class="bi bi-box-arrow-right"></i> Logout
      </a>
    </div>

  </div>
</div>

<script>
  function openModal(id) {
    const m = document.getElementById(id);
    if (m) m.style.display = 'flex';
  }
  function closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.style.display = 'none';
  }
  window.broadcastPdaMutation = function(type, action, payload) {
    try {
      var p = {
        eventId: 'pda_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7),
        type: type || 'purchase',
        action: action || 'pda_action',
        timestamp: Date.now(),
        ...(payload || {})
      };
      if (window.BroadcastChannel) {
        var bc = new BroadcastChannel('infypos_realtime_bus');
        bc.postMessage(p);
        bc.close();
      }
      localStorage.setItem('infypos_realtime_event', JSON.stringify(p));
    } catch(e) {}
  };
</script>

@yield('scripts')
</body>
</html>
