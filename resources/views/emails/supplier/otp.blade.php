<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
body{font-family:'Inter',Arial,sans-serif;margin:0;padding:0;background:#F8FAFC;}
.wrap{max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);}
.header{background:linear-gradient(135deg,#0D3B24 0%,#16A34A 100%);padding:30px 40px;text-align:center;}
.header-title{color:#fff;font-size:22px;font-weight:800;margin:0;}
.body{padding:32px 40px;}
.otp-box{background:linear-gradient(135deg,#F0FDF4,#DCFCE7);border:2px solid #86EFAC;border-radius:16px;padding:28px;text-align:center;margin:24px 0;}
.otp-label{font-size:13px;color:#15803D;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px;}
.otp-code{font-size:48px;font-weight:900;color:#0D3B24;letter-spacing:0.15em;font-family:monospace;}
.otp-expire{font-size:12px;color:#64748B;margin-top:10px;}
.footer{background:#F8FAFC;padding:20px 40px;text-align:center;border-top:1px solid #E2E8F0;}
.footer p{font-size:12px;color:#94A3B8;margin:3px 0;}
</style></head>
<body>
<div class="wrap">
  <div class="header">
    <div style="font-size:36px;margin-bottom:10px;">🔐</div>
    <div class="header-title">Password Reset OTP</div>
    <div style="color:rgba(255,255,255,0.7);font-size:13px;margin-top:6px;">INFY-POS Supplier Portal</div>
  </div>
  <div class="body">
    <p style="font-size:15px;font-weight:700;color:#0F172A;">Hello, {{ $supplierName }} 👋</p>
    <p style="font-size:14px;color:#64748B;line-height:1.7;">We received a request to reset your password. Use the OTP below to complete your password reset.</p>

    <div class="otp-box">
      <div class="otp-label">Your One-Time Password</div>
      <div class="otp-code">{{ $otp }}</div>
      <div class="otp-expire">⏱ Valid for 15 minutes only</div>
    </div>

    <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:10px;padding:14px 18px;margin-top:16px;">
      <p style="margin:0;font-size:13px;color:#991B1B;">🔒 If you did not request a password reset, please ignore this email. Your account is safe.</p>
    </div>
  </div>
  <div class="footer">
    <p>© {{ date('Y') }} INFY-POS Enterprise. All rights reserved.</p>
  </div>
</div>
</body>
</html>
