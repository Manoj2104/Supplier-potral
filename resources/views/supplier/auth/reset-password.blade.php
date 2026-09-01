<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <title>Reset Password — INFY-POS Supplier Portal</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{{ asset('css/supplier-portal.css') }}">
</head>
<body class="sp-body">
<div class="sp-login-page">
  <div class="sp-login-card">
    <div class="sp-login-logo">
      <div class="sp-login-logo-icon">🔑</div>
      <div class="sp-login-logo-text">
        <div class="sp-login-logo-title">Reset Password</div>
        <div class="sp-login-logo-sub">INFY-POS Supplier Portal</div>
      </div>
    </div>
    @if(session('success'))<div class="sp-alert sp-alert-success">✅ {{ session('success') }}</div>@endif
    <form action="{{ route('supplier.reset-password.submit') }}" method="POST" style="margin-top:24px;">
      @csrf
      <input type="hidden" name="email" value="{{ $email ?? request('email') }}">
      <div class="sp-form-group">
        <label class="sp-form-label">Email</label>
        <input type="email" class="sp-form-control" value="{{ $email ?? request('email') }}" disabled>
      </div>
      <div class="sp-form-group">
        <label class="sp-form-label">OTP Code <span class="required">*</span></label>
        <input type="text" name="otp" class="sp-form-control" placeholder="Enter 6-digit OTP" maxlength="6" inputmode="numeric" required autofocus>
        @error('otp')<div class="sp-form-error">⚠️ {{ $message }}</div>@enderror
      </div>
      <div class="sp-form-group">
        <label class="sp-form-label">New Password <span class="required">*</span></label>
        <input type="password" name="password" id="sp-new-pw" class="sp-form-control" placeholder="Minimum 6 characters" required>
      </div>
      <div class="sp-form-group">
        <label class="sp-form-label">Confirm New Password <span class="required">*</span></label>
        <input type="password" name="password_confirmation" class="sp-form-control" placeholder="Confirm new password" required>
      </div>
      <button type="submit" class="sp-btn sp-btn-primary sp-btn-full sp-btn-lg">🔐 Reset Password</button>
    </form>
    <div style="margin-top:20px;text-align:center;">
      <a href="{{ route('supplier.login') }}" style="font-size:13px;color:var(--sp-green-600);font-weight:600;">← Back to Login</a>
    </div>
  </div>
</div>
<script src="{{ asset('js/supplier-portal.js') }}"></script>
</body>
</html>
