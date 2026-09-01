<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>INFY-POS — ₹499/Month | Enterprise Retail POS & ERP | All Features Included</title>
  <meta name="description" content="India's most affordable enterprise POS system for supermarkets, grocery stores, bakeries and retail shops. ₹499/month includes Unlimited Billing, PDA Scanner, Warehouse, Reports, Barcode. 14-Day Free Trial.">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; background: #0A0F1E; color: #FFFFFF; overflow-x: hidden; }

    /* ────── NAV ────── */
    .nav { position: sticky; top: 0; z-index: 100; background: rgba(10,15,30,0.85); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.08); padding: 0 5%; display: flex; align-items: center; justify-content: space-between; height: 68px; }
    .nav-brand { font-size: 22px; font-weight: 900; color: #10B981; letter-spacing: -0.5px; display: flex; align-items: center; gap: 8px; }
    .nav-links { display: flex; align-items: center; gap: 32px; }
    .nav-link { font-size: 14px; font-weight: 700; color: #94A3B8; text-decoration: none; transition: color 0.15s; }
    .nav-link:hover { color: #FFFFFF; }
    .btn-trial { background: linear-gradient(135deg, #10B981, #059669); color: #FFFFFF; border: none; padding: 10px 22px; border-radius: 10px; font-size: 14px; font-weight: 800; cursor: pointer; text-decoration: none; transition: opacity 0.15s; }
    .btn-trial:hover { opacity: 0.9; }

    /* ────── HERO ────── */
    .hero { padding: 100px 5% 80px; text-align: center; position: relative; overflow: hidden; }
    .hero::before { content: ''; position: absolute; top: -200px; left: 50%; transform: translateX(-50%); width: 900px; height: 600px; background: radial-gradient(ellipse, rgba(16,185,129,0.18) 0%, transparent 65%); pointer-events: none; }
    .hero-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.35); border-radius: 30px; padding: 6px 18px; font-size: 13px; font-weight: 800; color: #10B981; margin-bottom: 24px; }
    .hero-title { font-size: clamp(36px, 5.5vw, 68px); font-weight: 900; line-height: 1.08; letter-spacing: -2px; color: #F8FAFC; max-width: 900px; margin: 0 auto 20px; }
    .hero-title span { background: linear-gradient(135deg, #10B981, #34D399); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .hero-desc { font-size: 18px; font-weight: 600; color: #94A3B8; max-width: 640px; margin: 0 auto 40px; line-height: 1.6; }
    .hero-cta { display: flex; align-items: center; justify-content: center; gap: 14px; flex-wrap: wrap; }
    .btn-primary { display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #10B981, #059669); color: #FFFFFF; border: none; padding: 16px 32px; border-radius: 14px; font-size: 16px; font-weight: 800; cursor: pointer; text-decoration: none; box-shadow: 0 8px 30px rgba(16,185,129,0.35); transition: transform 0.15s, box-shadow 0.15s; }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 35px rgba(16,185,129,0.45); }
    .btn-secondary { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.07); color: #F1F5F9; border: 1px solid rgba(255,255,255,0.15); padding: 16px 30px; border-radius: 14px; font-size: 16px; font-weight: 700; cursor: pointer; text-decoration: none; transition: background 0.15s; }
    .btn-secondary:hover { background: rgba(255,255,255,0.12); }
    .hero-stats { display: flex; align-items: center; justify-content: center; gap: 40px; margin-top: 56px; flex-wrap: wrap; }
    .stat-item { text-align: center; }
    .stat-num { font-size: 32px; font-weight: 900; color: #10B981; letter-spacing: -1px; }
    .stat-label { font-size: 12px; font-weight: 700; color: #64748B; margin-top: 2px; }

    /* ────── SECTION COMMONS ────── */
    section { padding: 80px 5%; }
    .section-tag { display: inline-block; font-size: 12px; font-weight: 800; color: #10B981; background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.3); border-radius: 20px; padding: 4px 14px; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
    .section-title { font-size: clamp(28px, 3.5vw, 44px); font-weight: 900; color: #F8FAFC; letter-spacing: -1px; margin-bottom: 12px; }
    .section-desc { font-size: 16px; font-weight: 600; color: #64748B; max-width: 560px; line-height: 1.65; }

    /* ────── FEATURES GRID ────── */
    .features-section { background: rgba(255,255,255,0.02); }
    .features-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; margin-top: 52px; }
    .feature-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 28px; transition: background 0.2s, border-color 0.2s, transform 0.2s; }
    .feature-card:hover { background: rgba(16,185,129,0.06); border-color: rgba(16,185,129,0.3); transform: translateY(-4px); }
    .feature-icon { width: 50px; height: 50px; border-radius: 14px; background: linear-gradient(135deg, rgba(16,185,129,0.25), rgba(5,150,105,0.1)); display: flex; align-items: center; justify-content: center; font-size: 24px; color: #10B981; margin-bottom: 16px; }
    .feature-title { font-size: 15px; font-weight: 800; color: #F1F5F9; margin-bottom: 6px; }
    .feature-desc { font-size: 13px; font-weight: 600; color: #64748B; line-height: 1.6; }

    /* ────── PRICING ────── */
    .pricing-section { background: #0A0F1E; text-align: center; }
    .pricing-card {
      max-width: 500px; margin: 52px auto 0; border-radius: 28px; overflow: hidden;
      background: linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.05));
      border: 2px solid rgba(16,185,129,0.4);
      box-shadow: 0 0 60px rgba(16,185,129,0.15);
    }
    .pricing-header { background: linear-gradient(135deg, #059669, #047857); padding: 36px 40px; }
    .pricing-badge { display: inline-block; background: rgba(255,255,255,0.2); color: #FFFFFF; font-size: 13px; font-weight: 900; padding: 4px 14px; border-radius: 20px; margin-bottom: 16px; }
    .pricing-plan { font-size: 26px; font-weight: 900; color: #FFFFFF; margin-bottom: 8px; }
    .pricing-amount { font-size: 64px; font-weight: 900; color: #FFFFFF; letter-spacing: -3px; line-height: 1; }
    .pricing-cycle { font-size: 16px; font-weight: 700; color: rgba(255,255,255,0.7); margin-top: 4px; }
    .pricing-body { padding: 32px 40px; }
    .pricing-features { list-style: none; display: flex; flex-direction: column; gap: 12px; margin-bottom: 28px; }
    .pricing-features li { display: flex; align-items: center; gap: 10px; font-size: 14.5px; font-weight: 700; color: #E2E8F0; }
    .pricing-features li i { color: #10B981; font-size: 17px; }
    .btn-subscribe { width: 100%; padding: 16px; background: linear-gradient(135deg, #10B981, #059669); color: #FFFFFF; border: none; border-radius: 14px; font-size: 16px; font-weight: 900; cursor: pointer; text-decoration: none; display: block; box-shadow: 0 6px 20px rgba(16,185,129,0.4); transition: opacity 0.15s; }
    .btn-subscribe:hover { opacity: 0.9; }

    /* ────── FOOTER ────── */
    footer { background: #060A14; border-top: 1px solid rgba(255,255,255,0.07); padding: 48px 5%; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: start; }
    .footer-brand { font-size: 20px; font-weight: 900; color: #10B981; margin-bottom: 10px; }
    .footer-desc { font-size: 13px; font-weight: 600; color: #475569; line-height: 1.65; max-width: 360px; }
    .footer-links { display: flex; flex-direction: column; gap: 10px; }
    .footer-links a { font-size: 13px; font-weight: 700; color: #64748B; text-decoration: none; transition: color 0.15s; }
    .footer-links a:hover { color: #10B981; }
    .footer-bottom { background: #060A14; padding: 16px 5%; border-top: 1px solid rgba(255,255,255,0.05); text-align: center; font-size: 12.5px; font-weight: 700; color: #334155; }
  </style>
</head>
<body>

<!-- NAVIGATION -->
<nav class="nav">
  <div class="nav-brand">
    <i class="bi bi-bag-check-fill"></i>
    INFY-POS
  </div>
  <div class="nav-links">
    <a href="#features" class="nav-link">Features</a>
    <a href="#pricing" class="nav-link">Pricing</a>
    <a href="/billing" class="nav-link">Billing Portal</a>
    <a href="/saas-admin/dashboard" class="nav-link" style="color: #F59E0B;">Super Admin</a>
  </div>
  <a href="/install" class="btn-trial">🚀 Start Free Trial</a>
</nav>

<!-- HERO -->
<section class="hero">
  <div class="hero-badge">
    <i class="bi bi-stars"></i>
    ₹499/Month — Everything Included · No Hidden Charges
  </div>
  <h1 class="hero-title">The <span>Enterprise POS</span> Small Businesses Deserve</h1>
  <p class="hero-desc">Full-featured retail ERP with Unlimited Billing, Barcode Scanning, Warehouse Management, PDA Scanner, and GST Reports — all for ₹499/month. No feature locking. Ever.</p>
  <div class="hero-cta">
    <a href="/install" class="btn-primary">
      <i class="bi bi-download"></i>
      Download & Install Free
    </a>
    <a href="#pricing" class="btn-secondary">
      <i class="bi bi-currency-rupee"></i>
      View ₹499 Plan
    </a>
  </div>
  <div class="hero-stats">
    <div class="stat-item">
      <div class="stat-num">{{ $totalCompanies }}+</div>
      <div class="stat-label">Registered Businesses</div>
    </div>
    <div class="stat-item">
      <div class="stat-num">₹499</div>
      <div class="stat-label">Per Month — All Inclusive</div>
    </div>
    <div class="stat-item">
      <div class="stat-num">14 Days</div>
      <div class="stat-label">Free Trial · No Card Required</div>
    </div>
    <div class="stat-item">
      <div class="stat-num">100%</div>
      <div class="stat-label">Offline POS Billing</div>
    </div>
  </div>
</section>

<!-- FEATURES -->
<section id="features" class="features-section">
  <div style="text-align:center; margin-bottom: 0;">
    <span class="section-tag">Everything Included</span>
    <h2 class="section-title">One Price. Zero Compromises.</h2>
    <p class="section-desc" style="margin: 12px auto 0;">Every feature unlocked for every customer. No tiers, no upgrades, no feature gating.</p>
  </div>
  <div class="features-grid">
    @php
      $features = [
        ['icon' => 'bi-receipt', 'title' => 'Thermal POS Billing', 'desc' => 'Lightning-fast checkout with thermal printer, barcode scan, and GST billing.'],
        ['icon' => 'bi-qr-code-scan', 'title' => 'Barcode & QR Scanner', 'desc' => 'Scan barcodes using mobile camera or laser USB scanners. Print barcode labels.'],
        ['icon' => 'bi-buildings', 'title' => 'Multi-Warehouse', 'desc' => 'Manage multiple warehouses, stock locations, bin transfers, and putaway.'],
        ['icon' => 'bi-phone', 'title' => 'PDA Mobile Scanner', 'desc' => 'Android PDA warehouse receiving, putaway, picking, and dispatch modules.'],
        ['icon' => 'bi-graph-up-arrow', 'title' => 'GST Reports & Analytics', 'desc' => 'GSTR-1, GSTR-3B, profit & loss, stock valuation, and daily MIS reports.'],
        ['icon' => 'bi-truck', 'title' => 'Purchase & Supplier', 'desc' => 'Manage purchase orders, GRN receiving, supplier portal, and supplier ASNs.'],
        ['icon' => 'bi-cloud-check', 'title' => 'Offline-First Billing', 'desc' => 'POS billing continues 100% offline. Data auto-syncs to cloud when reconnected.'],
        ['icon' => 'bi-shield-lock', 'title' => 'Secure License Binding', 'desc' => 'Machine UUID hardware binding prevents unauthorized software copying.'],
        ['icon' => 'bi-box-seam', 'title' => 'Inventory Management', 'desc' => 'Real-time stock tracking, low-stock alerts, dead stock report, and adjustments.'],
        ['icon' => 'bi-person-badge', 'title' => 'Staff & Roles', 'desc' => 'Unlimited staff accounts with role-based permissions and access control.'],
        ['icon' => 'bi-arrow-repeat', 'title' => 'Sales & Purchase Returns', 'desc' => 'Full returns management with refund tracking and credit note generation.'],
        ['icon' => 'bi-download', 'title' => 'Auto Cloud Updates', 'desc' => 'Software updates automatically download, verify and install from cloud.'],
      ];
    @endphp
    @foreach($features as $f)
      <div class="feature-card">
        <div class="feature-icon"><i class="bi {{ $f['icon'] }}"></i></div>
        <div class="feature-title">{{ $f['title'] }}</div>
        <div class="feature-desc">{{ $f['desc'] }}</div>
      </div>
    @endforeach
  </div>
</section>

<!-- PRICING -->
<section id="pricing" class="pricing-section">
  <span class="section-tag">Simple Pricing</span>
  <h2 class="section-title">One Plan. All Features.</h2>
  <p class="section-desc" style="margin: 10px auto 0;">No tiers, no feature locking, no surprises. ₹499/month covers everything your retail business needs.</p>

  <div class="pricing-card">
    <div class="pricing-header">
      <div class="pricing-badge">🔥 Best Value in India</div>
      <div class="pricing-plan">INFY-POS PREMIUM</div>
      <div class="pricing-amount">₹499</div>
      <div class="pricing-cycle">per month · GST extra · Cancel anytime</div>
    </div>
    <div class="pricing-body">
      <ul class="pricing-features">
        @php
          $planFeatures = [
            'Unlimited POS Billing & Thermal Receipts',
            'Unlimited Products, Categories & Variants',
            'Unlimited Customers & Suppliers',
            'Unlimited Warehouses & Bin Locations',
            'Unlimited Employees & Role Permissions',
            'Unlimited PDA Scanner (Receiving, Putaway, Dispatch)',
            'Unlimited GST Reports & Analytics',
            'Unlimited Barcode & QR Label Printing',
            'Unlimited Purchase & Sales Returns',
            'Daily Cloud Backup & Restore',
            'Free Software Updates — Auto-Installed',
            '14-Day Free Trial · No Credit Card Required',
            'No Feature Locking · No Hidden Charges',
          ];
        @endphp
        @foreach($planFeatures as $pf)
          <li><i class="bi bi-check-circle-fill"></i> {{ $pf }}</li>
        @endforeach
      </ul>
      <a href="/install" class="btn-subscribe">🚀 Start 14-Day Free Trial — No Card Required</a>
      <p style="font-size: 12px; font-weight: 700; color: #475569; margin-top: 12px;">After trial: ₹499/month. Renew anytime via UPI, Card, or NetBanking.</p>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer>
  <div>
    <div class="footer-brand"><i class="bi bi-bag-check-fill"></i> INFY-POS Enterprise</div>
    <p class="footer-desc">India's most affordable enterprise-grade retail POS & ERP system. Built for supermarkets, grocery stores, pharmacies, bakeries, and retail chains.</p>
  </div>
  <div class="footer-links">
    <a href="/install">🔧 Install on Localhost</a>
    <a href="/billing">💳 Billing & Subscription</a>
    <a href="/saas-admin/dashboard">🔒 Super Admin Portal</a>
    <a href="/#/app/pos">⚡ Open POS Billing</a>
  </div>
</footer>
<div class="footer-bottom">
  © {{ date('Y') }} INFY-POS Enterprise. All Rights Reserved. Designed for Indian Retail.
</div>

</body>
</html>
