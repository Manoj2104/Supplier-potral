@php
  $errors = $errors ?? new \Illuminate\Support\ViewErrorBag;
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <title>Supplier Portal Login — Suguna POS</title>
  <meta name="description" content="Enterprise Supplier Portal Login — Suguna POS">
  
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  
  <!-- Bootstrap Icons -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">

  <style>
    /* ═══════════════════════════════════════════════════════════════════
       FULL-SCREEN ENTERPRISE LUXURY SUPPLIER LOGIN PAGE
       Theme Matching Suguna POS (Ref 1 & Ref 2 Alignment)
       ═══════════════════════════════════════════════════════════════════ */

    :root {
      --sp-primary: #15803D;
      --sp-primary-hover: #166534;
      --sp-primary-light: #F0FDF4;
      --sp-primary-border: #86EFAC;
      --sp-text-dark: #0F172A;
      --sp-text-muted: #64748B;
      --sp-border: #E2E8F0;
      --sp-bg: #F8FAFC;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif;
    }

    body {
      min-height: 100vh;
      background-color: var(--sp-bg);
      color: var(--sp-text-dark);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow-x: hidden;
    }

    .sp-login-wrapper {
      width: 100vw;
      min-height: 100vh;
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      background: #FFFFFF;
    }

    @media (max-width: 1024px) {
      .sp-login-wrapper {
        grid-template-columns: 1fr;
      }
      .sp-showcase-panel {
        display: none !important;
      }
    }

    /* ── LEFT SHOWCASE PANEL ── */
    .sp-showcase-panel {
      background: linear-gradient(145deg, #0F172A 0%, #1E293B 45%, #064E3B 100%);
      padding: 48px 64px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
      color: #FFFFFF;
    }

    .sp-showcase-panel::before {
      content: '';
      position: absolute;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(22, 163, 74, 0.25) 0%, rgba(22, 163, 74, 0) 70%);
      top: -100px;
      right: -100px;
      pointer-events: none;
    }

    .sp-showcase-panel::after {
      content: '';
      position: absolute;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, rgba(37, 99, 235, 0) 70%);
      bottom: -100px;
      left: -100px;
      pointer-events: none;
    }

    .sp-brand-header {
      display: flex;
      align-items: center;
      gap: 12px;
      z-index: 2;
    }

    .sp-brand-logo-icon {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #22C55E 0%, #15803D 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      color: #FFFFFF;
      box-shadow: 0 4px 14px rgba(34, 197, 94, 0.4);
    }

    .sp-brand-title {
      font-size: 20px;
      font-weight: 900;
      color: #FFFFFF;
      letter-spacing: -0.02em;
    }

    .sp-brand-tag {
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.25);
      color: #86EFAC;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 3px 10px;
      border-radius: 999px;
      margin-left: 8px;
    }

    .sp-showcase-body {
      margin: 40px 0;
      z-index: 2;
    }

    .sp-showcase-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(34, 197, 94, 0.15);
      border: 1px solid rgba(74, 222, 128, 0.3);
      color: #86EFAC;
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 12.5px;
      font-weight: 700;
      margin-bottom: 20px;
    }

    .sp-showcase-heading {
      font-size: 40px;
      font-weight: 800;
      line-height: 1.2;
      letter-spacing: -0.02em;
      margin-bottom: 18px;
      color: #FFFFFF;
    }

    .sp-showcase-heading span {
      background: linear-gradient(135deg, #86EFAC 0%, #4ADE80 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .sp-showcase-desc {
      font-size: 15px;
      color: #CBD5E1;
      line-height: 1.6;
      max-width: 540px;
      margin-bottom: 32px;
    }

    /* Showcase 3 Feature Cards */
    .sp-feature-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
      margin-bottom: 28px;
    }

    .sp-feat-card {
      background: rgba(255, 255, 255, 0.06);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 16px;
      padding: 16px;
      transition: transform 180ms ease;
    }

    .sp-feat-card:hover {
      transform: translateY(-2px);
      background: rgba(255, 255, 255, 0.1);
    }

    .sp-feat-icon {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      background: rgba(34, 197, 94, 0.2);
      color: #86EFAC;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      margin-bottom: 10px;
    }

    .sp-feat-title {
      font-size: 13.5px;
      font-weight: 700;
      color: #FFFFFF;
      margin-bottom: 4px;
    }

    .sp-feat-sub {
      font-size: 11.5px;
      color: #94A3B8;
      line-height: 1.35;
    }

    /* Showcase Footer / Trust */
    .sp-showcase-foot {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 20px;
      z-index: 2;
    }

    .sp-trust-info {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 12.5px;
      color: #94A3B8;
    }

    .sp-stars {
      color: #FBBF24;
      font-size: 14px;
    }

    /* ── RIGHT LOGIN FORM PANEL ── */
    .sp-form-panel {
      background: #FFFFFF;
      padding: 48px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      position: relative;
    }

    .sp-form-container {
      width: 100%;
      max-width: 440px;
    }

    .sp-login-header {
      margin-bottom: 28px;
    }

    .sp-login-top-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 20px;
    }

    .sp-login-icon-box {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: #DCFCE7;
      color: #15803D;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }

    .sp-login-title {
      font-size: 28px;
      font-weight: 800;
      color: var(--sp-text-dark);
      letter-spacing: -0.02em;
      margin-bottom: 6px;
    }

    .sp-login-sub {
      font-size: 13.5px;
      color: var(--sp-text-muted);
      line-height: 1.4;
    }

    /* Alert Banner */
    .sp-alert-error {
      background: #FEF2F2;
      border: 1px solid #FCA5A5;
      color: #991B1B;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Form Inputs */
    .sp-form-group {
      margin-bottom: 20px;
    }

    .sp-form-label {
      font-size: 13px;
      font-weight: 700;
      color: #334155;
      margin-bottom: 6px;
      display: block;
    }

    .sp-input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }

    .sp-input-icon {
      position: absolute;
      left: 16px;
      color: #94A3B8;
      font-size: 16px;
      pointer-events: none;
    }

    .sp-form-control {
      width: 100%;
      height: 48px;
      background: #F8FAFC;
      border: 1.5px solid #E2E8F0;
      border-radius: 12px;
      padding: 0 16px 0 46px;
      font-size: 14px;
      font-weight: 600;
      color: #0F172A;
      outline: none;
      transition: all 180ms ease;
    }

    .sp-form-control:focus {
      background: #FFFFFF;
      border-color: var(--sp-primary);
      box-shadow: 0 0 0 4px rgba(21, 128, 61, 0.1);
    }

    .sp-form-control.is-invalid {
      border-color: #EF4444;
      background: #FEF2F2;
    }

    .sp-toggle-pass {
      position: absolute;
      right: 14px;
      background: none;
      border: none;
      color: #94A3B8;
      font-size: 16px;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .sp-toggle-pass:hover {
      color: var(--sp-text-dark);
    }

    .sp-form-error {
      font-size: 12px;
      color: #DC2626;
      font-weight: 600;
      margin-top: 5px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* Remember & Forgot Row */
    .sp-form-flex-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
      font-size: 13px;
    }

    .sp-checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #475569;
      font-weight: 600;
      cursor: pointer;
    }

    .sp-checkbox-label input {
      accent-color: var(--sp-primary);
      width: 16px;
      height: 16px;
      cursor: pointer;
    }

    .sp-link-muted {
      color: var(--sp-primary);
      font-weight: 700;
      text-decoration: none;
    }

    .sp-link-muted:hover {
      text-decoration: underline;
    }

    /* Submit Button */
    .sp-btn-submit {
      width: 100%;
      height: 50px;
      background: var(--sp-primary);
      color: #FFFFFF;
      border: none;
      border-radius: 999px;
      font-size: 15px;
      font-weight: 800;
      letter-spacing: -0.01em;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(21, 128, 61, 0.28);
      transition: all 180ms ease;
    }

    .sp-btn-submit:hover {
      background: var(--sp-primary-hover);
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(21, 128, 61, 0.35);
    }

    .sp-btn-submit:active {
      transform: translateY(0);
    }

    /* Footer */
    .sp-login-footer {
      margin-top: 32px;
      text-align: center;
      font-size: 12px;
      color: #94A3B8;
      line-height: 1.6;
    }

    .sp-login-footer a {
      color: var(--sp-primary);
      font-weight: 700;
      text-decoration: none;
    }

    .sp-login-footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>

<div class="sp-login-wrapper">

  <!-- ═══════════════════════════════════════════════════════════════════
       1. LEFT HERO SHOWCASE PANEL (Enterprise Brand & Value Prop)
       ═══════════════════════════════════════════════════════════════════ -->
  <div class="sp-showcase-panel">
    
    <!-- Brand Header -->
    <div class="sp-brand-header">
      <div class="sp-brand-logo-icon">
        <i class="bi bi-shop"></i>
      </div>
      <div>
        <span class="sp-brand-title">Suguna POS</span>
        <span class="sp-brand-tag">Supplier Portal</span>
      </div>
    </div>

    <!-- Main Headline & Description -->
    <div class="sp-showcase-body">
      <div class="sp-showcase-badge">
        <i class="bi bi-shield-check"></i> Enterprise Vendor Hub v2.0
      </div>

      <h1 class="sp-showcase-heading">
        Seamless Supply Chain &amp; <span>Smart Logistics</span>
      </h1>

      <p class="sp-showcase-desc">
        Streamline your procurement orders, dispatch Advance Shipping Notices (ASN), generate GS1 carton labels, and receive fast payments with real-time GRN synchronization.
      </p>

      <!-- 3 Feature Stat Cards -->
      <div class="sp-feature-grid">
        <div class="sp-feat-card">
          <div class="sp-feat-icon">
            <i class="bi bi-file-earmark-check"></i>
          </div>
          <div class="sp-feat-title">Auto ASN &amp; LPN</div>
          <div class="sp-feat-sub">Automated packing lists &amp; barcode generation</div>
        </div>

        <div class="sp-feat-card">
          <div class="sp-feat-icon">
            <i class="bi bi-truck"></i>
          </div>
          <div class="sp-feat-title">Gate Inward Sync</div>
          <div class="sp-feat-sub">Real-time warehouse verification &amp; GRN</div>
        </div>

        <div class="sp-feat-card">
          <div class="sp-feat-icon">
            <i class="bi bi-cash-stack"></i>
          </div>
          <div class="sp-feat-title">Fast Settlement</div>
          <div class="sp-feat-sub">Instant invoice approvals &amp; bank credits</div>
        </div>
      </div>
    </div>

    <!-- Trust & Verification Footer -->
    <div class="sp-showcase-foot">
      <div class="sp-trust-info">
        <span class="sp-stars">★★★★★</span>
        <span>Trusted by 500+ Verified Suppliers</span>
      </div>
      <div style="font-size:12px; color:#64748B; display:flex; align-items:center; gap:6px;">
        <i class="bi bi-shield-lock"></i> <span>256-Bit SSL Encrypted</span>
      </div>
    </div>

  </div>

  <!-- ═══════════════════════════════════════════════════════════════════
       2. RIGHT SIGN-IN PANEL (Email & Password Only)
       ═══════════════════════════════════════════════════════════════════ -->
  <div class="sp-form-panel">
    <div class="sp-form-container">

      <div class="sp-login-header">
        <div class="sp-login-top-logo">
          <div class="sp-login-icon-box">
            <i class="bi bi-person-badge-fill"></i>
          </div>
          <span style="font-size:13px; font-weight:800; color:#15803D; text-transform:uppercase; letter-spacing:0.05em;">
            Supplier Access
          </span>
        </div>
        <h2 class="sp-login-title">Welcome Back</h2>
        <p class="sp-login-sub">Please enter your registered supplier email address and mobile number password to sign in.</p>
      </div>

      <!-- Flash Error -->
      @if(session('error'))
        <div class="sp-alert-error">
          <i class="bi bi-exclamation-triangle-fill"></i> {{ session('error') }}
        </div>
      @endif

      <!-- Sign In Form (Clean: Email & Password Only) -->
      <form action="{{ route('supplier.login.submit') }}" method="POST" id="supplierLoginForm">
        @csrf

        <!-- 1. Supplier Email Address -->
        <div class="sp-form-group">
          <label class="sp-form-label" for="loginEmail">Supplier Email Address <span style="color:#DC2626;">*</span></label>
          <div class="sp-input-wrap">
            <i class="bi bi-envelope sp-input-icon"></i>
            <input
              class="sp-form-control {{ $errors->has('login_id') || $errors->has('email') ? 'is-invalid' : '' }}"
              type="email"
              id="loginEmail"
              name="email"
              value="{{ old('email', old('login_id', '')) }}"
              placeholder="e.g. supplier@company.com"
              autocomplete="email"
              autofocus
              required
            >
          </div>
          @if($errors->has('login_id'))
            <div class="sp-form-error"><i class="bi bi-exclamation-circle"></i> {{ $errors->first('login_id') }}</div>
          @elseif($errors->has('email'))
            <div class="sp-form-error"><i class="bi bi-exclamation-circle"></i> {{ $errors->first('email') }}</div>
          @endif
        </div>

        <!-- 2. Supplier Password (Mobile Number) -->
        <div class="sp-form-group">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
            <label class="sp-form-label" for="loginPassword" style="margin:0;">Password <span style="color:#DC2626;">*</span></label>
            <span style="font-size:11.5px; color:#64748B; font-weight:600;">(Default: Registered Mobile No)</span>
          </div>
          <div class="sp-input-wrap">
            <i class="bi bi-lock sp-input-icon"></i>
            <input
              class="sp-form-control {{ $errors->has('password') ? 'is-invalid' : '' }}"
              type="password"
              id="loginPassword"
              name="password"
              value="{{ old('password', '') }}"
              placeholder="Enter your registered mobile number"
              autocomplete="current-password"
              required
              style="padding-right:44px;"
            >
            <button type="button" class="sp-toggle-pass" onclick="togglePasswordVisibility()" title="Show/Hide Password">
              <i class="bi bi-eye" id="passEyeIcon"></i>
            </button>
          </div>
          @error('password')
            <div class="sp-form-error"><i class="bi bi-exclamation-circle"></i> {{ $message }}</div>
          @enderror
        </div>

        <!-- Remember Me Row -->
        <div class="sp-form-flex-row">
          <label class="sp-checkbox-label">
            <input type="checkbox" name="remember_me" checked>
            <span>Remember me for 30 days</span>
          </label>
          <a href="{{ route('supplier.forgot-password') }}" class="sp-link-muted" style="font-size:12.5px;">Forgot Password?</a>
        </div>

        <!-- Submit Button -->
        <button type="submit" class="sp-btn-submit">
          <i class="bi bi-shield-lock-fill"></i> Sign In to Supplier Portal
        </button>

      </form>

      <!-- Footer Back Link -->
      <div class="sp-login-footer">
        <div style="display:flex; align-items:center; justify-content:center; gap:6px;">
          <i class="bi bi-shield-check" style="color:var(--sp-primary); font-size:14px;"></i>
          <span>Secured by enterprise-grade encryption &bull; Suguna POS v2.0</span>
        </div>
      </div>

      <!-- ⬇ Download Desktop App Banner -->
      <div style="margin-top:18px; padding:14px 18px; background:linear-gradient(135deg,#f0fdf4,#dcfce7); border:1.5px solid #86efac; border-radius:12px; text-align:center;">
        <div style="font-size:13px; font-weight:700; color:#15803d; margin-bottom:6px;">
          <i class="bi bi-windows" style="margin-right:5px;"></i> Get the Desktop App — Opens Instantly!
        </div>
        <div style="font-size:12px; color:#166534; margin-bottom:10px;">
          Faster access • Works offline login • No browser needed
        </div>
        <a href="/supplier/download-app"
           style="display:inline-flex; align-items:center; gap:8px; background:#15803d; color:#fff; padding:9px 20px; border-radius:8px; font-size:13px; font-weight:700; text-decoration:none; transition:background 0.2s;"
           onmouseover="this.style.background='#166534'" onmouseout="this.style.background='#15803d'">
          <i class="bi bi-download"></i> Download Supplier Portal Setup (.exe)
        </a>
        <div style="font-size:11px; color:#4ade80; margin-top:6px;">Free • No activation key • Windows 10/11 x64</div>
      </div>

    </div>
  </div>

</div>

<script>
function togglePasswordVisibility() {
  const passInput = document.getElementById('loginPassword');
  const icon = document.getElementById('passEyeIcon');
  if (passInput.type === 'password') {
    passInput.type = 'text';
    icon.classList.remove('bi-eye');
    icon.classList.add('bi-eye-slash');
  } else {
    passInput.type = 'password';
    icon.classList.remove('bi-eye-slash');
    icon.classList.add('bi-eye');
  }
}
</script>

</body>
</html>