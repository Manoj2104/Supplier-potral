<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <title>Supplier Portal Admin — INFY-POS</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{{ asset('css/supplier-portal.css') }}">
</head>
<body class="sp-body" style="background:var(--sp-gray-50);padding:32px;">

<div style="max-width:1200px;margin:0 auto;">

  <!-- Header -->
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;">
    <div>
      <h1 style="font-size:26px;font-weight:800;color:var(--sp-gray-900);">🔧 Supplier Portal Management</h1>
      <p style="color:var(--sp-gray-500);margin-top:4px;">Create and manage supplier portal accounts</p>
    </div>
    <a href="/" class="sp-btn sp-btn-secondary">← Back to Admin Dashboard</a>
  </div>

  @if(session('success'))
    <div class="sp-alert sp-alert-success" data-auto-dismiss="5000">✅ {{ session('success') }}</div>
  @endif
  @if(session('error'))
    <div class="sp-alert sp-alert-error">❌ {{ session('error') }}</div>
  @endif

  <div style="display:grid;grid-template-columns:1fr 360px;gap:24px;align-items:start;">

    <!-- Existing Portal Accounts -->
    <div>
      <div class="sp-card">
        <div class="sp-card-header">
          <div class="sp-card-title">👥 Portal Accounts ({{ $portals->total() }})</div>
        </div>
        <div class="sp-table-wrap" style="border:none;border-radius:0;box-shadow:none;">
          <table class="sp-table">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Code</th>
                <th>Username (Email)</th>
                <th>KYC</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @forelse($portals as $p)
              <tr>
                <td>
                  <div style="font-weight:600;font-size:13px;">{{ $p->supplier->name ?? '—' }}</div>
                  <div style="font-size:11px;color:var(--sp-gray-400);">{{ $p->supplier->city ?? '' }}</div>
                </td>
                <td><span style="font-size:12px;font-weight:700;color:var(--sp-green-700);">{{ $p->supplier_code }}</span></td>
                <td style="font-size:12.5px;">{{ $p->username }}</td>
                <td>
                  @php $kc=['verified'=>'green','pending'=>'amber','rejected'=>'red']; @endphp
                  <span class="sp-badge sp-badge-{{ $kc[$p->kyc_status]??'gray' }}" style="font-size:10px;">{{ ucfirst($p->kyc_status) }}</span>
                </td>
                <td>
                  @php $sc=['active'=>'green','inactive'=>'gray','blocked'=>'red']; @endphp
                  <span class="sp-badge sp-badge-{{ $sc[$p->status]??'gray' }}" style="font-size:10px;">{{ ucfirst($p->status) }}</span>
                </td>
                <td style="font-size:12px;color:var(--sp-gray-500);">
                  {{ $p->last_login_at ? $p->last_login_at->diffForHumans() : 'Never' }}
                </td>
                <td>
                  <div style="display:flex;gap:6px;">
                    <!-- Reset PW -->
                    <form action="{{ route('supplier.admin.reset-password', $p->id) }}" method="POST" onsubmit="return confirm('Reset password? Enter new password:')">
                      @csrf
                      <input type="hidden" name="password" value="Supplier@123">
                      <button type="submit" class="sp-btn sp-btn-secondary sp-btn-sm" title="Reset to Supplier@123">🔑</button>
                    </form>
                    <!-- Block/Unblock -->
                    @if($p->status !== 'blocked')
                    <form action="{{ route('supplier.admin.block', $p->id) }}" method="POST" onsubmit="return confirm('Block this supplier?')">
                      @csrf
                      <button type="submit" class="sp-btn sp-btn-sm" style="background:#FEF2F2;color:var(--sp-red);border:1px solid #FECACA;" title="Block">🚫</button>
                    </form>
                    @else
                    <form action="{{ route('supplier.admin.unblock', $p->id) }}" method="POST">
                      @csrf
                      <button type="submit" class="sp-btn sp-btn-sm sp-btn-primary" title="Unblock">✅</button>
                    </form>
                    @endif
                    <!-- Toggle Active/Inactive -->
                    <form action="{{ route('supplier.admin.toggle-status', $p->id) }}" method="POST">
                      @csrf
                      <button type="submit" class="sp-btn sp-btn-secondary sp-btn-sm" title="{{ $p->status==='active' ? 'Deactivate' : 'Activate' }}">
                        {{ $p->status==='active' ? '⏸' : '▶️' }}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
              @empty
              <tr><td colspan="7">
                <div class="sp-empty"><div class="sp-empty-icon">👥</div><div class="sp-empty-title">No portal accounts yet</div></div>
              </td></tr>
              @endforelse
            </tbody>
          </table>
        </div>
        @if($portals->hasPages())
        <div style="padding:16px;">{{ $portals->links() }}</div>
        @endif
      </div>
    </div>

    <!-- Create New Account -->
    <div>
      <div class="sp-card">
        <div class="sp-card-header"><div class="sp-card-title">➕ Create Portal Account</div></div>
        <div class="sp-card-body">
          <form action="{{ route('supplier.admin.store') }}" method="POST">
            @csrf
            <div class="sp-form-group">
              <label class="sp-form-label">Select Supplier <span class="required">*</span></label>
              <select name="supplier_id" class="sp-form-control" required>
                <option value="">— Select Supplier —</option>
                @foreach($suppliers as $s)
                  <option value="{{ $s->id }}" {{ old('supplier_id') == $s->id ? 'selected' : '' }}>
                    {{ $s->name }} ({{ $s->email }})
                  </option>
                @endforeach
              </select>
              @error('supplier_id')<div class="sp-form-error">⚠️ {{ $message }}</div>@enderror
              @if($suppliers->isEmpty())
              <div style="font-size:12px;color:var(--sp-amber);margin-top:4px;">⚠️ All suppliers already have portal accounts.</div>
              @endif
            </div>

            <div class="sp-form-group">
              <label class="sp-form-label">Temporary Password <span class="required">*</span></label>
              <input type="text" name="password" class="sp-form-control" value="{{ old('password','Supplier@2026') }}" required placeholder="Temporary password for supplier">
              <div style="font-size:11px;color:var(--sp-gray-400);margin-top:4px;">Supplier can change this after first login.</div>
            </div>

            <div class="sp-form-group">
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;">
                <input type="checkbox" name="send_email" value="1" checked style="accent-color:var(--sp-green-600);">
                Send welcome email with credentials
              </label>
            </div>

            <button type="submit" class="sp-btn sp-btn-primary sp-btn-full">🚀 Create Portal Account</button>
          </form>
        </div>
      </div>

      <!-- Portal Login Link -->
      <div class="sp-card" style="margin-top:20px;">
        <div class="sp-card-body">
          <div style="font-size:13px;font-weight:700;color:var(--sp-gray-800);margin-bottom:8px;">🔗 Supplier Portal Login URL</div>
          <div style="background:var(--sp-gray-50);border:1px solid var(--sp-gray-200);border-radius:var(--sp-radius-sm);padding:10px 14px;font-size:13px;color:var(--sp-green-700);font-weight:600;word-break:break-all;">
            {{ url('/supplier/login') }}
          </div>
          <button data-copy="{{ url('/supplier/login') }}" class="sp-btn sp-btn-secondary sp-btn-sm" style="margin-top:8px;">📋 Copy URL</button>
          <a href="{{ url('/supplier/login') }}" target="_blank" class="sp-btn sp-btn-primary sp-btn-sm" style="margin-top:8px;margin-left:8px;">🔗 Open Portal</a>
        </div>
      </div>
    </div>
  </div>

</div>

<script src="{{ asset('js/supplier-portal.js') }}"></script>
</body>
</html>
