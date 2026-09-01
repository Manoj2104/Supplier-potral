<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <title>Forgot Password — INFY-POS Supplier Portal</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{{ asset('css/supplier-portal.css') }}">
</head>
<body class="sp-body">

<div class="sp-login-page">
  <div class="sp-login-card">
    <div class="sp-login-logo">
      <div class="sp-login-logo-icon">🔐</div>
      <div class="sp-login-logo-text">
        <div class="sp-login-logo-title">INFY-POS</div>
        <div class="sp-login-logo-sub">Password Recovery</div>
      </div>
    </div>

    <div class="sp-login-title">Forgot Password?</div>
    <div class="sp-login-sub">Enter your registered email and we'll send you a 6-digit OTP.</div>

    @if(session('success'))
      <div class="sp-alert sp-alert-success">✅ {{ session('success') }}</div>
    @endif

    <form action="{{ route('supplier.forgot-password.submit') }}" method="POST" style="margin-top:24px;">
      @csrf
      <div class="sp-form-group">
        <label class="sp-form-label">Registered Email Address</label>
        <input type="email" name="email" class="sp-form-control" value="{{ old('email') }}" placeholder="Enter your email" required autofocus>
        @error('email') <div class="sp-form-error">⚠️ {{ $message }}</div> @enderror
      </div>
      <button type="submit" class="sp-btn sp-btn-primary sp-btn-full sp-btn-lg">📤 Send OTP</button>
    </form>

    <div style="margin-top:24px;text-align:center;">
      <a href="{{ route('supplier.login') }}" style="font-size:13px;color:var(--sp-green-600);font-weight:600;">← Back to Login</a>
    </div>
  </div>
</div>

<script src="{{ asset('js/supplier-portal.js') }}"></script>
</body>
</html>
