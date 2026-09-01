<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
body{font-family:'Inter',Arial,sans-serif;margin:0;padding:0;background:#F8FAFC;}
.wrap{max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);}
.header{background:linear-gradient(135deg,#0D3B24 0%,#16A34A 100%);padding:36px 40px;text-align:center;}
.header-logo{font-size:42px;margin-bottom:12px;}
.header-title{color:#fff;font-size:24px;font-weight:800;margin:0;}
.header-sub{color:rgba(255,255,255,0.75);font-size:14px;margin-top:6px;}
.body{padding:36px 40px;}
.greeting{font-size:18px;font-weight:700;color:#0F172A;margin-bottom:6px;}
.sub{font-size:14px;color:#64748B;margin-bottom:28px;line-height:1.6;}
.cred-box{background:#F0FDF4;border:1.5px solid #BBF7D0;border-radius:12px;padding:24px;margin:24px 0;}
.cred-title{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#15803D;margin-bottom:16px;}
.cred-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #DCFCE7;}
.cred-row:last-child{border-bottom:none;}
.cred-label{font-size:13px;color:#64748B;}
.cred-value{font-size:13px;font-weight:700;color:#0F172A;font-family:monospace;}
.btn{display:inline-block;background:linear-gradient(135deg,#16A34A,#15803D);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:700;margin:20px 0;letter-spacing:0.02em;}
.footer{background:#F8FAFC;padding:24px 40px;text-align:center;border-top:1px solid #E2E8F0;}
.footer p{font-size:12px;color:#94A3B8;margin:4px 0;}
</style></head>
<body>
<div class="wrap">
  <div class="header">
    <div class="header-logo">🏪</div>
    <div class="header-title">INFY-POS Supplier Portal</div>
    <div class="header-sub">Your account is ready — Welcome aboard!</div>
  </div>

  <div class="body">
    <div class="greeting">Welcome, {{ $supplier->name }}! 👋</div>
    <p class="sub">Your Supplier Portal account has been created on the INFY-POS platform. You can now log in to view purchase orders, create ASNs, upload invoices, and track payments — all in one place.</p>

    <div class="cred-box">
      <div class="cred-title">🔑 Your Login Credentials</div>
      <div class="cred-row">
        <span class="cred-label">Supplier Name</span>
        <span class="cred-value">{{ $supplier->name }}</span>
      </div>
      <div class="cred-row">
        <span class="cred-label">Supplier Code</span>
        <span class="cred-value">{{ $portal->supplier_code }}</span>
      </div>
      <div class="cred-row">
        <span class="cred-label">Username (Email)</span>
        <span class="cred-value">{{ $supplier->email }}</span>
      </div>
      <div class="cred-row">
        <span class="cred-label">Temporary Password</span>
        <span class="cred-value">{{ $tempPassword }}</span>
      </div>
      <div class="cred-row">
        <span class="cred-label">Login URL</span>
        <span class="cred-value">{{ $loginUrl }}</span>
      </div>
    </div>

    <div style="text-align:center;">
      <a href="{{ $loginUrl }}" class="btn">🔐 Login to Supplier Portal</a>
    </div>

    <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:10px;padding:16px;margin-top:20px;">
      <p style="margin:0;font-size:13.5px;color:#92400E;font-weight:600;">⚠️ Important: Please change your password after first login for security.</p>
    </div>

    <p style="font-size:13px;color:#64748B;margin-top:24px;line-height:1.7;">
      If you have any questions or need assistance, please contact our procurement team at
      <a href="mailto:{{ config('mail.from.address') }}" style="color:#16A34A;">{{ config('mail.from.address') }}</a>.
    </p>
  </div>

  <div class="footer">
    <p>This is an automated email from <strong>INFY-POS Enterprise</strong></p>
    <p>© {{ date('Y') }} INFY-POS. All rights reserved.</p>
  </div>
</div>
</body>
</html>
