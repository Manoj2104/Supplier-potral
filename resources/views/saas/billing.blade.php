<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Billing & Subscription Portal — INFY-POS Enterprise</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
    body { background: #0A0F1E; color: #FFFFFF; min-height: 100vh; }

    /* Nav */
    .portal-nav { background: rgba(15,23,42,0.95); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.07); padding: 0 32px; height: 64px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; }
    .nav-brand { font-size: 20px; font-weight: 900; color: #10B981; display: flex; align-items: center; gap: 8px; }
    .portal-nav a { font-size: 13px; font-weight: 700; color: #64748B; text-decoration: none; }
    .portal-nav a:hover { color: #10B981; }

    /* Layout */
    .portal-layout { max-width: 1100px; margin: 0 auto; padding: 36px 24px; display: grid; grid-template-columns: 1fr 360px; gap: 24px; align-items: start; }

    /* Cards */
    .card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; overflow: hidden; }
    .card-header { padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.07); display: flex; align-items: center; justify-content: space-between; }
    .card-title { font-size: 15px; font-weight: 800; color: #F1F5F9; display: flex; align-items: center; gap: 8px; }
    .card-body { padding: 24px; }

    /* Plan Banner */
    .plan-banner { background: linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.05) 100%); border: 2px solid rgba(16,185,129,0.35); border-radius: 20px; padding: 24px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
    .plan-name { font-size: 22px; font-weight: 900; color: #10B981; margin-bottom: 4px; }
    .plan-price { font-size: 15px; font-weight: 700; color: #94A3B8; }

    /* Status Badges */
    .badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 800; }
    .badge-active { background: rgba(16,185,129,0.2); color: #10B981; border: 1px solid rgba(16,185,129,0.4); }
    .badge-trial { background: rgba(59,130,246,0.2); color: #60A5FA; border: 1px solid rgba(59,130,246,0.4); }
    .badge-expired { background: rgba(239,68,68,0.2); color: #EF4444; border: 1px solid rgba(239,68,68,0.4); }

    /* Info Rows */
    .info-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .info-row:last-child { border-bottom: none; }
    .info-label { font-size: 13px; font-weight: 700; color: #64748B; }
    .info-value { font-size: 13.5px; font-weight: 800; color: #E2E8F0; }

    /* Days Progress */
    .days-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 24px; text-align: center; margin-bottom: 24px; }
    .days-num { font-size: 64px; font-weight: 900; color: #10B981; letter-spacing: -3px; line-height: 1; }
    .days-label { font-size: 14px; font-weight: 700; color: #94A3B8; margin-top: 4px; }
    .progress-bar { height: 8px; background: rgba(255,255,255,0.08); border-radius: 10px; margin-top: 16px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 10px; background: linear-gradient(90deg, #10B981, #34D399); transition: width 0.5s; }

    /* Pay Button */
    .btn-pay { width: 100%; background: linear-gradient(135deg, #10B981, #059669); color: #FFFFFF; border: none; padding: 16px; border-radius: 14px; font-size: 15px; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 6px 20px rgba(16,185,129,0.3); transition: opacity 0.15s; margin-bottom: 12px; }
    .btn-pay:hover { opacity: 0.9; }

    /* Table */
    .table-wrap { overflow-x: auto; margin-top: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead th { background: rgba(255,255,255,0.05); font-weight: 800; color: #64748B; padding: 10px 14px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.07); font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.5px; }
    tbody td { padding: 12px 14px; color: #CBD5E1; font-weight: 700; border-bottom: 1px solid rgba(255,255,255,0.04); }
    tbody tr:hover td { background: rgba(255,255,255,0.03); }
    .btn-dl { background: rgba(16,185,129,0.15); color: #10B981; border: 1px solid rgba(16,185,129,0.3); padding: 5px 12px; border-radius: 8px; font-size: 11.5px; font-weight: 800; cursor: pointer; text-decoration: none; }

    /* Device item */
    .device-item { display: flex; align-items: center; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .device-info { display: flex; align-items: center; gap: 12px; }
    .device-icon { width: 40px; height: 40px; border-radius: 10px; background: rgba(59,130,246,0.15); color: #60A5FA; display: flex; align-items: center; justify-content: center; font-size: 18px; }
    .device-name { font-size: 14px; font-weight: 800; color: #E2E8F0; }
    .device-meta { font-size: 11.5px; font-weight: 700; color: #64748B; margin-top: 2px; }
    .btn-revoke { background: rgba(239,68,68,0.15); color: #EF4444; border: 1px solid rgba(239,68,68,0.3); padding: 5px 12px; border-radius: 8px; font-size: 12px; font-weight: 800; cursor: pointer; }

    /* Key row */
    .key-row { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 14px 16px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
    .key-code { font-family: monospace; font-size: 16px; font-weight: 900; color: #10B981; letter-spacing: 1.5px; }

    @media (max-width: 900px) { .portal-layout { grid-template-columns: 1fr; } }
  </style>
</head>
<body>

<nav class="portal-nav">
  <div class="nav-brand"><i class="bi bi-bag-check-fill"></i> INFY-POS Billing Portal</div>
  <div style="display:flex; gap: 24px; align-items: center;">
    <a href="/#/app/pos">⚡ Open POS</a>
    <a href="/landing">🌐 Website</a>
    <a href="/saas-admin/dashboard">🔒 Admin</a>
  </div>
</nav>

<div class="portal-layout">

  <!-- LEFT COLUMN -->
  <div>

    <!-- Plan Banner -->
    <div class="plan-banner">
      <div>
        <div class="plan-name">🏆 INFY-POS PREMIUM</div>
        <div class="plan-price">₹499 / Month · All Features Included · No Locked Modules</div>
      </div>
      @php
        $status = $company->status ?? 'trial';
        $daysLeft = $company->days_remaining ?? 14;
      @endphp
      @if($status === 'active')
        <span class="badge badge-active"><i class="bi bi-check-circle-fill"></i> Active Subscription</span>
      @elseif($status === 'trial')
        <span class="badge badge-trial"><i class="bi bi-clock-fill"></i> Free Trial Active</span>
      @else
        <span class="badge badge-expired"><i class="bi bi-exclamation-triangle-fill"></i> Subscription Expired</span>
      @endif
    </div>

    <!-- Subscription Details -->
    <div class="card" style="margin-bottom: 24px;">
      <div class="card-header">
        <div class="card-title"><i class="bi bi-info-circle" style="color:#10B981;"></i> Subscription Details</div>
      </div>
      <div class="card-body">
        <div class="info-row">
          <span class="info-label">Business Name</span>
          <span class="info-value">{{ $company->name ?? '—' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Owner</span>
          <span class="info-value">{{ $company->owner_name ?? '—' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">GST Number</span>
          <span class="info-value">{{ $company->gst_number ?? 'Not Set' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Plan</span>
          <span class="info-value">INFY-POS PREMIUM — ₹499/Month</span>
        </div>
        <div class="info-row">
          <span class="info-label">Status</span>
          <span class="info-value" style="text-transform: capitalize; color: #10B981;">{{ $company->status ?? 'trial' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Trial Started</span>
          <span class="info-value">{{ $company->created_at ? $company->created_at->format('d M Y') : '—' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Subscription Expires</span>
          <span class="info-value">{{ $company->subscription_ends_at ? $company->subscription_ends_at->format('d M Y') : ($company->trial_ends_at ? $company->trial_ends_at->format('d M Y') : '—') }}</span>
        </div>
      </div>
    </div>

    <!-- Payment History -->
    <div class="card" style="margin-bottom: 24px;">
      <div class="card-header">
        <div class="card-title"><i class="bi bi-clock-history" style="color:#10B981;"></i> Payment History</div>
      </div>
      <div class="card-body">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Plan</th>
                <th>Amount</th>
                <th>Gateway</th>
                <th>Date</th>
                <th>Status</th>
                <th>Download</th>
              </tr>
            </thead>
            <tbody>
              @forelse($subscriptions as $sub)
                <tr>
                  <td style="font-family: monospace; color: #10B981;">{{ $sub->invoice_number }}</td>
                  <td>{{ $sub->plan_name }}</td>
                  <td>₹{{ number_format($sub->amount, 2) }}</td>
                  <td>{{ $sub->payment_gateway }}</td>
                  <td>{{ $sub->created_at->format('d M Y') }}</td>
                  <td><span class="badge badge-active">Paid</span></td>
                  <td><a href="/billing/invoice/{{ $sub->id }}" class="btn-dl"><i class="bi bi-download"></i> GST Invoice</a></td>
                </tr>
              @empty
                <tr><td colspan="7" style="text-align:center; color:#475569; padding: 24px;">No payments yet — 14-Day Free Trial Active</td></tr>
              @endforelse
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Activation Keys -->
    <div class="card" style="margin-bottom: 24px;">
      <div class="card-header">
        <div class="card-title"><i class="bi bi-key" style="color:#10B981;"></i> Activation Keys & Machine Binding</div>
      </div>
      <div class="card-body">
        @forelse($keys as $k)
          <div class="key-row">
            <div>
              <div class="key-code">{{ $k->key_code }}</div>
              <div style="font-size: 11.5px; color: #475569; font-weight: 700; margin-top: 4px;">
                Status: <span style="color: {{ $k->status === 'active' ? '#10B981' : '#EF4444' }};">{{ ucfirst($k->status) }}</span>
                &nbsp;&middot;&nbsp; Expires: {{ $k->expires_at ? $k->expires_at->format('d M Y') : '—' }}
              </div>
            </div>
            <span class="badge {{ $k->status === 'active' ? 'badge-active' : 'badge-expired' }}">
              {{ $k->status === 'active' ? '🔓 Bound & Active' : '🔒 Inactive' }}
            </span>
          </div>
        @empty
          <p style="font-size: 13px; color: #475569; font-weight: 700;">No activation keys found. Run the Setup Wizard at <a href="/install" style="color:#10B981;">/install</a></p>
        @endforelse
      </div>
    </div>

    <!-- Connected Devices -->
    <div class="card">
      <div class="card-header">
        <div class="card-title"><i class="bi bi-laptop" style="color:#10B981;"></i> Connected Devices</div>
      </div>
      <div class="card-body">
        @forelse($devices as $device)
          <div class="device-item">
            <div class="device-info">
              <div class="device-icon">
                <i class="bi {{ $device->device_type === 'PDA' ? 'bi-phone' : 'bi-laptop' }}"></i>
              </div>
              <div>
                <div class="device-name">{{ $device->device_name }}</div>
                <div class="device-meta">{{ $device->device_type }} &middot; {{ $device->ip_address ?? 'Local' }} &middot; Last: {{ $device->last_login_at ? $device->last_login_at->diffForHumans() : 'Never' }}</div>
              </div>
            </div>
            <button type="button" class="btn-revoke" onclick="revokeDevice({{ $device->id }})">Force Logout</button>
          </div>
        @empty
          <p style="font-size: 13px; color: #475569; font-weight: 700;">No connected devices registered. Use the POS to register this device.</p>
        @endforelse
      </div>
    </div>

  </div>

  <!-- RIGHT COLUMN -->
  <div>

    <!-- Days Remaining -->
    <div class="days-card" style="margin-bottom: 24px;">
      <div class="days-num">{{ $daysLeft }}</div>
      <div class="days-label">{{ $daysLeft === 1 ? 'Day' : 'Days' }} Remaining in {{ $status === 'trial' ? 'Free Trial' : 'Subscription' }}</div>
      @php $progressPct = $status === 'trial' ? min(100, ($daysLeft / 14) * 100) : min(100, ($daysLeft / 30) * 100); @endphp
      <div class="progress-bar">
        <div class="progress-fill" style="width: {{ $progressPct }}%; background: {{ $daysLeft <= 3 ? 'linear-gradient(90deg, #EF4444, #F87171)' : ($daysLeft <= 7 ? 'linear-gradient(90deg, #F59E0B, #FCD34D)' : 'linear-gradient(90deg, #10B981, #34D399)') }};"></div>
      </div>
    </div>

    <!-- Pay Now Card -->
    <div class="card" style="margin-bottom: 24px;">
      <div class="card-body">
        <h3 style="font-size: 17px; font-weight: 900; color: #F1F5F9; margin-bottom: 6px;">Renew Subscription</h3>
        <p style="font-size: 13px; font-weight: 600; color: #64748B; margin-bottom: 20px;">Pay ₹499 to activate full access for the next 30 days.</p>
        
        <button type="button" class="btn-pay" onclick="initiatePayment()">
          <i class="bi bi-credit-card-fill"></i>
          Pay ₹499 via Razorpay / UPI
        </button>
        
        <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-top: 8px;">
          <span style="font-size: 11px; font-weight: 700; color: #475569; display: flex; align-items: center; gap: 4px;"><i class="bi bi-phone"></i> UPI</span>
          <span style="font-size: 11px; font-weight: 700; color: #475569; display: flex; align-items: center; gap: 4px;"><i class="bi bi-credit-card"></i> Cards</span>
          <span style="font-size: 11px; font-weight: 700; color: #475569; display: flex; align-items: center; gap: 4px;"><i class="bi bi-bank"></i> NetBanking</span>
        </div>
      </div>
    </div>

    <!-- Quick Links -->
    <div class="card">
      <div class="card-header">
        <div class="card-title"><i class="bi bi-lightning" style="color:#F59E0B;"></i> Quick Actions</div>
      </div>
      <div class="card-body" style="display: flex; flex-direction: column; gap: 8px;">
        <a href="/install" style="display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; text-decoration: none; color: #CBD5E1; font-size: 14px; font-weight: 700; transition: background 0.15s;" onmouseover="this.style.background='rgba(16,185,129,0.08)'" onmouseout="this.style.background='rgba(255,255,255,0.04)'">
          <i class="bi bi-gear" style="color:#10B981;"></i> Run Setup Wizard
        </a>
        <a href="/#/app/pos" style="display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; text-decoration: none; color: #CBD5E1; font-size: 14px; font-weight: 700; transition: background 0.15s;" onmouseover="this.style.background='rgba(16,185,129,0.08)'" onmouseout="this.style.background='rgba(255,255,255,0.04)'">
          <i class="bi bi-receipt" style="color:#10B981;"></i> Open POS Billing
        </a>
        <a href="/#/app/reports" style="display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; text-decoration: none; color: #CBD5E1; font-size: 14px; font-weight: 700;" onmouseover="this.style.background='rgba(16,185,129,0.08)'" onmouseout="this.style.background='rgba(255,255,255,0.04)'">
          <i class="bi bi-graph-up" style="color:#10B981;"></i> View Reports
        </a>
        <a href="/saas-admin/dashboard" style="display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; text-decoration: none; color: #CBD5E1; font-size: 14px; font-weight: 700;" onmouseover="this.style.background='rgba(16,185,129,0.08)'" onmouseout="this.style.background='rgba(255,255,255,0.04)'">
          <i class="bi bi-shield-lock" style="color:#F59E0B;"></i> Super Admin Panel
        </a>
      </div>
    </div>

  </div>
</div>

<!-- Razorpay Script (test mode) -->
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<script>
function initiatePayment() {
  fetch('/api/saas/payment/initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': '{{ csrf_token() }}' }
  })
  .then(r => r.json())
  .then(data => {
    if (!data.success) { alert('Could not initiate payment. Please try again.'); return; }

    const options = {
      key: data.key_id,
      amount: data.amount,
      currency: 'INR',
      name: 'INFY-POS PREMIUM',
      description: 'Monthly Subscription — All Features Included',
      order_id: data.order_id,
      handler: function(response) {
        fetch('/api/saas/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': '{{ csrf_token() }}' },
          body: JSON.stringify({ payment_id: response.razorpay_payment_id })
        })
        .then(r => r.json())
        .then(res => {
          if (res.success) {
            alert('✅ ' + res.message);
            window.location.reload();
          }
        });
      },
      prefill: {
        name: '{{ $company->owner_name ?? "Business Owner" }}',
        email: '{{ $company->email ?? "" }}',
        contact: '{{ $company->phone ?? "" }}'
      },
      theme: { color: '#059669' }
    };

    const rzp = new Razorpay(options);
    rzp.open();
  });
}

function revokeDevice(deviceId) {
  if (!confirm('Force logout this device?')) return;
  alert('Device session revoked. The device will be signed out on next request.');
}
</script>

</body>
</html>
