<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Super Admin — INFY-POS Enterprise Cloud Management Portal</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
    body { background: #060B18; color: #FFFFFF; min-height: 100vh; display: flex; }

    /* Sidebar */
    .sidebar { width: 230px; background: #0A1020; border-right: 1px solid rgba(255,255,255,0.06); display: flex; flex-direction: column; padding: 24px 0; flex-shrink: 0; position: fixed; top: 0; left: 0; height: 100vh; overflow-y: auto; }
    .sidebar-brand { font-size: 18px; font-weight: 900; color: #10B981; padding: 0 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; gap: 8px; }
    .sidebar-section { padding: 16px 20px 8px; font-size: 10.5px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.8px; }
    .sidebar-item { display: flex; align-items: center; gap: 10px; padding: 10px 20px; font-size: 13.5px; font-weight: 700; color: #64748B; text-decoration: none; transition: all 0.15s; cursor: pointer; border-left: 3px solid transparent; }
    .sidebar-item:hover { color: #CBD5E1; background: rgba(255,255,255,0.03); }
    .sidebar-item.active { color: #10B981; background: rgba(16,185,129,0.08); border-left-color: #10B981; }

    /* Main */
    .main { margin-left: 230px; flex: 1; padding: 28px 32px; min-height: 100vh; }

    /* Top Header */
    .top-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
    .page-title { font-size: 22px; font-weight: 900; color: #F1F5F9; }
    .page-subtitle { font-size: 13px; font-weight: 600; color: #475569; margin-top: 2px; }
    .header-actions { display: flex; align-items: center; gap: 12px; }

    /* Stats Grid */
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; margin-bottom: 28px; }
    .stat-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 18px; padding: 22px; display: flex; align-items: center; gap: 16px; }
    .stat-icon { width: 50px; height: 50px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
    .stat-value { font-size: 28px; font-weight: 900; color: #F1F5F9; letter-spacing: -1px; line-height: 1; }
    .stat-label { font-size: 12px; font-weight: 700; color: #475569; margin-top: 3px; }
    .stat-change { font-size: 11.5px; font-weight: 800; margin-top: 4px; }
    .change-up { color: #10B981; }

    /* Cards */
    .card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 18px; overflow: hidden; margin-bottom: 20px; }
    .card-header { padding: 16px 22px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: space-between; }
    .card-title { font-size: 14px; font-weight: 800; color: #E2E8F0; display: flex; align-items: center; gap: 8px; }
    .card-body { padding: 20px 22px; }

    /* Grid Layout */
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

    /* Tables */
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead th { font-weight: 800; color: #475569; padding: 10px 14px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    tbody td { padding: 11px 14px; color: #94A3B8; font-weight: 700; border-bottom: 1px solid rgba(255,255,255,0.04); }
    tbody tr:hover td { background: rgba(255,255,255,0.02); }

    /* Badges */
    .badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 800; }
    .badge-green { background: rgba(16,185,129,0.15); color: #10B981; }
    .badge-blue { background: rgba(59,130,246,0.15); color: #60A5FA; }
    .badge-orange { background: rgba(245,158,11,0.15); color: #F59E0B; }
    .badge-red { background: rgba(239,68,68,0.15); color: #EF4444; }

    /* System Health */
    .health-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .health-item { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 16px; }
    .health-label { font-size: 11.5px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 6px; }
    .health-val { font-size: 18px; font-weight: 900; color: #10B981; }

    /* Key Generator */
    .key-generated { font-family: monospace; font-size: 20px; font-weight: 900; color: #10B981; letter-spacing: 2px; background: rgba(16,185,129,0.1); border: 2px dashed rgba(16,185,129,0.4); border-radius: 12px; padding: 16px; text-align: center; margin-top: 12px; display: none; }
    .btn-action { background: linear-gradient(135deg, #10B981, #059669); color: #FFFFFF; border: none; padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
    .btn-action:hover { opacity: 0.9; }
    .btn-sm { padding: 5px 12px; font-size: 11.5px; border-radius: 8px; }

    /* MRR Banner */
    .mrr-banner { background: linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.05)); border: 1px solid rgba(16,185,129,0.25); border-radius: 18px; padding: 24px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
    .mrr-val { font-size: 48px; font-weight: 900; color: #10B981; letter-spacing: -2px; line-height: 1; }
    .mrr-label { font-size: 13px; font-weight: 700; color: #94A3B8; margin-top: 4px; }
  </style>
</head>
<body>

<!-- SIDEBAR -->
<aside class="sidebar">
  <div class="sidebar-brand"><i class="bi bi-shield-lock-fill"></i> INFY Admin</div>

  <div class="sidebar-section">Overview</div>
  <a class="sidebar-item active" onclick="showSection('overview')"><i class="bi bi-speedometer2"></i> Dashboard</a>
  <a class="sidebar-item" onclick="showSection('companies')"><i class="bi bi-buildings"></i> Companies</a>
  <a class="sidebar-item" onclick="showSection('payments')"><i class="bi bi-currency-rupee"></i> Revenue & Payments</a>
  <a class="sidebar-item" onclick="showSection('keys')"><i class="bi bi-key"></i> Activation Keys</a>

  <div class="sidebar-section">System</div>
  <a class="sidebar-item" onclick="showSection('health')"><i class="bi bi-activity"></i> System Health</a>
  <a class="sidebar-item" onclick="showSection('audit')"><i class="bi bi-journal-text"></i> Audit Logs</a>

  <div style="flex: 1;"></div>
  <div style="padding: 16px 20px; border-top: 1px solid rgba(255,255,255,0.06);">
    <a href="/landing" style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #475569; text-decoration: none;">
      <i class="bi bi-globe"></i> Public Website
    </a>
    <a href="/billing" style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #475569; text-decoration: none; margin-top: 10px;">
      <i class="bi bi-credit-card"></i> Billing Portal
    </a>
  </div>
</aside>

<!-- MAIN CONTENT -->
<main class="main">

  <!-- Header -->
  <div class="top-header">
    <div>
      <div class="page-title">🔒 Super Admin Management Portal</div>
      <div class="page-subtitle">INFY-POS Enterprise · {{ $systemHealth['server_time'] }}</div>
    </div>
    <div class="header-actions">
      <span style="font-size: 12px; font-weight: 700; color: #10B981;"><i class="bi bi-circle-fill" style="font-size:8px;"></i> System Online</span>
    </div>
  </div>

  <!-- OVERVIEW SECTION -->
  <div id="section-overview" class="section-content">

    <!-- MRR Banner -->
    <div class="mrr-banner">
      <div>
        <div style="font-size: 12px; font-weight: 800; color: #10B981; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Monthly Recurring Revenue (MRR)</div>
        <div class="mrr-val">₹{{ number_format($mrr, 0) }}</div>
        <div class="mrr-label">This month · ₹{{ number_format($totalRevenue, 0) }} Total All-Time Revenue</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 13px; font-weight: 700; color: #475569; margin-bottom: 4px;">₹499 × {{ $activeCompanies }} subscribers</div>
        <div style="font-size: 13px; font-weight: 800; color: #10B981;">= ₹{{ number_format($activeCompanies * 499, 0) }}/mo potential</div>
      </div>
    </div>

    <!-- Stats Row -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(16,185,129,0.15); color: #10B981;"><i class="bi bi-buildings"></i></div>
        <div>
          <div class="stat-value">{{ $totalCompanies }}</div>
          <div class="stat-label">Total Registered Businesses</div>
          <div class="stat-change change-up">↑ All Time</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(59,130,246,0.15); color: #60A5FA;"><i class="bi bi-person-check"></i></div>
        <div>
          <div class="stat-value">{{ $activeCompanies }}</div>
          <div class="stat-label">Active Subscribers</div>
          <div class="stat-change change-up">₹{{ number_format($activeCompanies * 499, 0) }}/mo</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(245,158,11,0.15); color: #F59E0B;"><i class="bi bi-clock"></i></div>
        <div>
          <div class="stat-value">{{ $trialCompanies }}</div>
          <div class="stat-label">Free Trial Accounts</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(239,68,68,0.15); color: #EF4444;"><i class="bi bi-x-circle"></i></div>
        <div>
          <div class="stat-value">{{ $expiredCompanies }}</div>
          <div class="stat-label">Expired Accounts</div>
        </div>
      </div>
    </div>

    <!-- Recent Companies & Payments -->
    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i class="bi bi-buildings" style="color:#10B981;"></i> Recent Companies</div>
        </div>
        <div class="card-body" style="padding: 0;">
          <table>
            <thead><tr><th>Business</th><th>Type</th><th>Status</th></tr></thead>
            <tbody>
              @forelse($recentCompanies as $c)
                <tr>
                  <td>
                    <div style="font-weight: 800; color: #E2E8F0;">{{ $c->name }}</div>
                    <div style="font-size: 11px; color: #475569;">{{ $c->email }}</div>
                  </td>
                  <td>{{ $c->business_type }}</td>
                  <td>
                    <span class="badge {{ $c->status === 'active' ? 'badge-green' : ($c->status === 'trial' ? 'badge-blue' : 'badge-red') }}">
                      {{ ucfirst($c->status) }}
                    </span>
                  </td>
                </tr>
              @empty
                <tr><td colspan="3" style="text-align:center; padding: 20px; color: #475569;">No companies registered yet</td></tr>
              @endforelse
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title"><i class="bi bi-currency-rupee" style="color:#10B981;"></i> Recent Payments</div>
        </div>
        <div class="card-body" style="padding: 0;">
          <table>
            <thead><tr><th>Invoice</th><th>Company</th><th>Amount</th></tr></thead>
            <tbody>
              @forelse($recentPayments as $pay)
                <tr>
                  <td style="font-family: monospace; color: #10B981; font-size: 12px;">{{ $pay->invoice_number }}</td>
                  <td>{{ $pay->company->name ?? '—' }}</td>
                  <td style="color: #10B981; font-weight: 900;">₹{{ number_format($pay->amount, 0) }}</td>
                </tr>
              @empty
                <tr><td colspan="3" style="text-align:center; padding: 20px; color: #475569;">No payments recorded yet</td></tr>
              @endforelse
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- System Health -->
    <div class="card">
      <div class="card-header">
        <div class="card-title"><i class="bi bi-activity" style="color:#10B981;"></i> System & Server Health</div>
        <span class="badge badge-green"><i class="bi bi-circle-fill" style="font-size:7px;"></i> All Systems Operational</span>
      </div>
      <div class="card-body">
        <div class="health-grid">
          <div class="health-item">
            <div class="health-label">PHP Version</div>
            <div class="health-val">{{ $systemHealth['php_version'] }}</div>
          </div>
          <div class="health-item">
            <div class="health-label">Server Host</div>
            <div class="health-val">{{ $systemHealth['server_name'] }}</div>
          </div>
          <div class="health-item">
            <div class="health-label">Disk Free</div>
            <div class="health-val">{{ $systemHealth['disk_free'] }} GB</div>
          </div>
          <div class="health-item">
            <div class="health-label">Disk Total</div>
            <div class="health-val">{{ $systemHealth['disk_total'] }} GB</div>
          </div>
          <div class="health-item">
            <div class="health-label">Server Time</div>
            <div class="health-val" style="font-size: 14px;">{{ $systemHealth['server_time'] }}</div>
          </div>
          <div class="health-item">
            <div class="health-label">Application Status</div>
            <div class="health-val">🟢 Online</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Activation Key Generator -->
    <div class="card">
      <div class="card-header">
        <div class="card-title"><i class="bi bi-key" style="color:#F59E0B;"></i> License Key Generator</div>
      </div>
      <div class="card-body">
        <p style="font-size: 13px; font-weight: 600; color: #64748B; margin-bottom: 14px;">Generate a new INFYPOS-2026-XXXX-XXXX activation key and provide it to a new subscriber.</p>
        <button type="button" class="btn-action" onclick="generateKey()">
          <i class="bi bi-key-fill"></i> Generate New Activation Key
        </button>
        <div id="generatedKey" class="key-generated"></div>
      </div>
    </div>

    <!-- Audit Logs -->
    <div class="card">
      <div class="card-header">
        <div class="card-title"><i class="bi bi-journal-text" style="color:#60A5FA;"></i> Recent Audit Log</div>
      </div>
      <div class="card-body" style="padding: 0;">
        <table>
          <thead><tr><th>Action</th><th>Details</th><th>IP</th><th>Time</th></tr></thead>
          <tbody>
            @forelse($auditLogs as $log)
              <tr>
                <td style="color: #E2E8F0; font-weight: 800;">{{ $log->action }}</td>
                <td>{{ Str::limit($log->details, 60) }}</td>
                <td style="font-family: monospace; font-size: 11.5px;">{{ $log->ip_address ?? '127.0.0.1' }}</td>
                <td style="font-size: 11.5px; color: #475569;">{{ $log->created_at->diffForHumans() }}</td>
              </tr>
            @empty
              <tr><td colspan="4" style="text-align:center; padding: 20px; color: #475569;">No audit logs recorded yet</td></tr>
            @endforelse
          </tbody>
        </table>
      </div>
    </div>

  </div>

</main>

<script>
  function generateKey() {
    fetch('/saas-admin/generate-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': '{{ csrf_token() }}' }
    })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        const box = document.getElementById('generatedKey');
        box.style.display = 'block';
        box.textContent = data.key_code;
      }
    });
  }

  function showSection(section) {
    document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
    event.target.closest('.sidebar-item').classList.add('active');
  }
</script>

</body>
</html>
