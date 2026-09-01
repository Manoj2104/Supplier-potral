<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Employee Login — INFY-POS Warehouse Scanner</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #0F172A; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 12px; }

    /* PDA Shell Container */
    .pda-shell {
      width: 100%; max-width: 440px; min-height: 840px;
      background: #F8FAFC; display: flex; flex-direction: column; justify-content: space-between;
      overflow: hidden; border-radius: 40px; border: 10px solid #1E293B; position: relative; padding: 16px 24px 24px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    @media (max-width: 480px) {
      body { padding: 0; }
      .pda-shell { max-width: 100%; min-height: 100vh; border-radius: 0; border: none; padding: 14px 20px 20px; }
    }

    /* PDA Status Bar */
    .pda-status-bar {
      color: #0F172A; font-size: 11.5px; font-weight: 800; display: flex; justify-content: space-between; align-items: center;
      padding-bottom: 12px; border-bottom: 1px solid #F1F5F9; margin-bottom: 16px;
    }

    /* Brand Header */
    .pda-brand { text-align: center; margin-bottom: 14px; }
    .pda-logo-svg { width: 56px; height: 32px; margin: 0 auto 6px; display: block; }
    .pda-brand-title { font-size: 24px; font-weight: 900; color: #0F172A; letter-spacing: -0.5px; line-height: 1; }
    .pda-brand-title span { color: #16A34A; }
    .pda-brand-sub { font-size: 10px; font-weight: 800; color: #64748B; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 4px; }

    /* Warehouse Illustration Banner */
    .pda-illustration { text-align: center; margin-bottom: 14px; }
    .pda-illustration svg { width: 100%; max-width: 240px; height: auto; }

    /* Title Section */
    .pda-welcome { text-align: center; margin-bottom: 18px; }
    .pda-welcome-h1 { font-size: 20px; font-weight: 800; color: #0F172A; margin-bottom: 4px; }
    .pda-welcome-p { font-size: 12.5px; color: #64748B; font-weight: 500; }

    /* Login Card Container */
    .pda-card {
      background: #FFFFFF; border-radius: 20px; padding: 22px 20px;
      border: 1px solid #E2E8F0; box-shadow: 0 4px 16px rgba(15, 23, 42, 0.03); margin-bottom: 16px;
    }

    /* Form Fields */
    .pda-form-group { margin-bottom: 16px; position: relative; }
    .pda-label { font-size: 12px; font-weight: 700; color: #1E293B; margin-bottom: 6px; display: block; }
    .pda-input-box { position: relative; display: flex; align-items: center; }
    .pda-input-icon { position: absolute; left: 14px; color: #16A34A; font-size: 17px; }
    .pda-input {
      width: 100%; height: 48px; border: 1.5px solid #E2E8F0; border-radius: 14px;
      padding: 0 42px 0 44px; font-size: 13.5px; font-weight: 600; outline: none; background: #FFFFFF; color: #0F172A;
      transition: all 0.2s ease;
    }
    .pda-input:focus { border-color: #16A34A; box-shadow: 0 0 0 3.5px rgba(22, 163, 74, 0.12); }
    .pda-eye-icon { position: absolute; right: 14px; color: #64748B; font-size: 18px; cursor: pointer; }

    /* Checkbox & Forgot Password */
    .pda-options { display: flex; align-items: center; justify-content: space-between; font-size: 12px; margin-bottom: 20px; }
    .pda-checkbox-label { display: flex; align-items: center; gap: 8px; color: #334155; font-weight: 600; cursor: pointer; }
    .pda-checkbox { width: 17px; height: 17px; accent-color: #16A34A; border-radius: 4px; }
    .pda-forgot-link { color: #16A34A; font-weight: 700; text-decoration: none; transition: color 0.2s; }
    .pda-forgot-link:hover { color: #15803D; text-decoration: underline; }

    /* Login Button */
    .pda-btn-submit {
      width: 100%; height: 50px; background: #16A34A; color: #FFFFFF; border: none; border-radius: 14px;
      font-size: 15px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer;
      box-shadow: 0 4px 16px rgba(22, 163, 74, 0.3); transition: all 0.2s ease;
    }
    .pda-btn-submit:hover { background: #15803D; transform: translateY(-1px); }
    .pda-btn-submit:active { transform: translateY(1px); }

    /* Divider & Encrypted Badge */
    .pda-divider { display: flex; align-items: center; text-align: center; color: #94A3B8; font-size: 11px; font-weight: 700; margin: 16px 0; }
    .pda-divider::before, .pda-divider::after { content: ''; flex: 1; border-bottom: 1px solid #E2E8F0; }
    .pda-divider span { padding: 0 10px; text-transform: uppercase; letter-spacing: 0.5px; }

    .pda-secure-badge {
      background: #F0FDF4; border: 1px solid #DCFCE7; border-radius: 14px; padding: 12px;
      display: flex; align-items: center; justify-content: center; gap: 8px; color: #16A34A;
      font-size: 12px; font-weight: 700; text-align: center;
    }

    /* Error Alert */
    .pda-alert-danger {
      background: #FEF2F2; border: 1px solid #FCA5A5; color: #991B1B; font-size: 12.5px; font-weight: 600;
      padding: 10px 14px; border-radius: 12px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;
    }

    /* Loading Overlay */
    .pda-overlay {
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(255, 255, 255, 0.96); backdrop-filter: blur(4px);
      display: none; flex-direction: column; align-items: center; justify-content: center; z-index: 100;
      padding: 30px; text-align: center; border-radius: 36px;
    }
    .pda-spinner {
      width: 48px; height: 48px; border: 4px solid #DCFCE7; border-top-color: #16A34A;
      border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Footer */
    .pda-footer { text-align: center; font-size: 11px; color: #94A3B8; font-weight: 600; margin-top: auto; }
  </style>
</head>
<body>

<div class="pda-shell">
  <!-- PDA Status Bar -->
  <div class="pda-status-bar">
    <span>10:30 AM</span>
    <div style="display: flex; align-items: center; gap: 6px;">
      <i class="bi bi-reception-4"></i>
      <i class="bi bi-wifi"></i>
      <i class="bi bi-battery-full" style="font-size: 13px;"></i>
      <span>100%</span>
    </div>
  </div>

  <div>
    <!-- Logo Header -->
    <div class="pda-brand">
      <svg class="pda-logo-svg" viewBox="0 0 60 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 15C15 19.4183 11.4183 23 7.5 23C3.58172 23 0 19.4183 0 15C0 10.5817 3.58172 7 7.5 7C11.4183 7 15 10.5817 15 15Z" fill="#16A34A"/>
        <path d="M60 15C60 19.4183 56.4183 23 52.5 23C48.5817 23 45 19.4183 45 15C45 10.5817 48.5817 7 52.5 7C56.4183 7 60 10.5817 60 15Z" fill="#0F172A"/>
        <path d="M7.5 7C18.75 7 41.25 23 52.5 23" stroke="#16A34A" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M7.5 23C18.75 23 41.25 7 52.5 7" stroke="#0F172A" stroke-width="4.5" stroke-linecap="round"/>
      </svg>
      <div class="pda-brand-title">INFY-<span>POS</span></div>
      <div class="pda-brand-sub">Warehouse Scanner</div>
    </div>

    <!-- Warehouse Vector Graphic -->
    <div class="pda-illustration">
      <svg viewBox="0 0 300 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 110L150 30L290 110" stroke="#CBD5E1" stroke-width="2"/>
        <rect x="40" y="55" width="220" height="55" rx="6" fill="#F1F5F9" stroke="#94A3B8" stroke-width="2"/>
        <path d="M30 55L150 20L270 55H30Z" fill="#16A34A"/>
        <rect x="110" y="65" width="80" height="45" fill="#0F172A" rx="4"/>
        <rect x="115" y="70" width="70" height="40" fill="#334155"/>
        <rect x="120" y="75" width="60" height="4" fill="#94A3B8"/>
        <rect x="120" y="83" width="60" height="4" fill="#94A3B8"/>
        <rect x="120" y="91" width="60" height="4" fill="#94A3B8"/>
        <!-- Forklift & Box -->
        <rect x="205" y="85" width="30" height="25" fill="#D97706" rx="3"/>
        <rect x="210" y="90" width="20" height="15" fill="#B45309"/>
        <circle cx="212" cy="110" r="5" fill="#0F172A"/>
        <circle cx="228" cy="110" r="5" fill="#0F172A"/>
        <rect x="75" y="88" width="18" height="18" fill="#F59E0B" rx="2"/>
        <rect x="55" y="92" width="16" height="14" fill="#D97706" rx="2"/>
      </svg>
    </div>

    <!-- Welcome Headline -->
    <div class="pda-welcome">
      <h1 class="pda-welcome-h1">Welcome Back!</h1>
      <p class="pda-welcome-p">Sign in to continue to your dashboard</p>
    </div>

    <!-- Login Form Card -->
    <div class="pda-card">

      @if($errors->any())
        <div class="pda-alert-danger">
          <i class="bi bi-exclamation-triangle-fill" style="font-size: 16px;"></i>
          <span>{{ $errors->first() }}</span>
        </div>
      @endif

      <form id="pdaLoginForm" action="{{ route('pda.login.submit') }}" method="POST">
        @csrf

        <!-- Email -->
        <div class="pda-form-group">
          <label class="pda-label">Email Address</label>
          <div class="pda-input-box">
            <i class="bi bi-envelope pda-input-icon"></i>
            <input
              type="email"
              name="email"
              id="emailInput"
              class="pda-input"
              value="admin@infy-pos.com"
              required
              placeholder="Enter your user email"
            >
          </div>
        </div>

        <!-- Password -->
        <div class="pda-form-group">
          <label class="pda-label">Password</label>
          <div class="pda-input-box">
            <i class="bi bi-lock pda-input-icon"></i>
            <input
              type="password"
              name="password"
              id="passwordInput"
              class="pda-input"
              value="123456"
              required
              placeholder="Enter password (default: 123456)"
            >
            <i class="bi bi-eye pda-eye-icon" id="togglePasswordBtn"></i>
          </div>
        </div>

        <!-- Remember Device & Forgot Password -->
        <div class="pda-options">
          <label class="pda-checkbox-label">
            <input type="checkbox" name="remember" class="pda-checkbox" checked>
            <span>Remember this device</span>
          </label>
          <a href="#" class="pda-forgot-link" onclick="alert('Please contact Warehouse IT Admin to reset password.'); return false;">Forgot Password?</a>
        </div>

        <!-- Login Button -->
        <button type="submit" class="pda-btn-submit" id="loginBtn">
          <i class="bi bi-box-arrow-in-right" style="font-size: 18px;"></i>
          <span>LOGIN</span>
        </button>
      </form>
    </div>

    <!-- OR Divider -->
    <div class="pda-divider">
      <span>OR</span>
    </div>

    <!-- Encrypted Device Badge -->
    <div class="pda-secure-badge">
      <i class="bi bi-shield-check" style="font-size: 18px;"></i>
      <span>This device is secure and encrypted</span>
    </div>
  </div>

  <!-- Footer Info -->
  <div class="pda-footer">
    <div style="margin-bottom: 2px;">Version 1.0.0</div>
    <div>© 2024 INFY-POS. All rights reserved.</div>
  </div>

  <!-- Loading Screen Overlay -->
  <div class="pda-overlay" id="loadingOverlay">
    <div class="pda-spinner"></div>
    <h4 style="font-size: 17px; font-weight: 800; color: #0F172A; margin-bottom: 6px;" id="overlayTitle">Authenticating...</h4>
    <p style="font-size: 12.5px; color: #64748B; font-weight: 600;" id="overlayStatus">Verifying employee credentials...</p>
  </div>
</div>

<script>
  // Toggle Password Visibility
  const toggleBtn = document.getElementById('togglePasswordBtn');
  const pwdInput = document.getElementById('passwordInput');

  toggleBtn.addEventListener('click', function() {
    const isPassword = pwdInput.type === 'password';
    pwdInput.type = isPassword ? 'text' : 'password';
    toggleBtn.classList.toggle('bi-eye', !isPassword);
    toggleBtn.classList.toggle('bi-eye-slash', isPassword);
  });

  // Smooth Loading Animation on Submit
  const form = document.getElementById('pdaLoginForm');
  const overlay = document.getElementById('loadingOverlay');
  const overlayTitle = document.getElementById('overlayTitle');
  const overlayStatus = document.getElementById('overlayStatus');

  form.addEventListener('submit', function(e) {
    const email = document.getElementById('emailInput').value;
    if (!email) return;

    overlay.style.display = 'flex';

    setTimeout(() => {
      overlayTitle.innerText = "Authenticating...";
      overlayStatus.innerText = "Checking employee credentials...";
    }, 400);

    setTimeout(() => {
      overlayTitle.innerText = "Checking Warehouse...";
      overlayStatus.innerText = "Loading assigned Main Warehouse...";
    }, 800);

    setTimeout(() => {
      overlayTitle.innerText = "Preparing Dashboard...";
      overlayStatus.innerText = "Loading today's receiving tasks...";
    }, 1200);
  });
</script>

</body>
</html>
