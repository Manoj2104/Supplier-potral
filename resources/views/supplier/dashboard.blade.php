@extends('supplier.layout')

@section('title', 'Dashboard | Suguna Supplier Portal')

@section('head')
<style>
/* ═══════════════════════════════════════════════════════════════════
   PIXEL-PERFECT SUGUNA POS DASHBOARD STYLES (Supplier Tailored)
   ═══════════════════════════════════════════════════════════════════ */

.dashboard-page,
.dashboard-page * {
    font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
}

/* Outer Workspace Surface */
.dashboard-page.premium-workspace {
    margin: 12px 0 32px !important;
    padding: 28px 28px !important;
    border-radius: 24px !important;
    background: rgba(255, 255, 255, 0.85) !important;
    backdrop-filter: blur(24px) saturate(180%) !important;
    -webkit-backdrop-filter: blur(24px) saturate(180%) !important;
    border: 1px solid rgba(255, 255, 255, 0.90) !important;
    box-shadow:
        0 0 0 1px rgba(15, 23, 42, 0.04),
        0 8px 32px rgba(15, 23, 42, 0.06),
        0 32px 64px rgba(15, 23, 42, 0.04) !important;
    min-height: unset !important;
    box-sizing: border-box;
}

/* Intro Header */
.dashboard-intro {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    margin-bottom: 28px !important;
    flex-wrap: wrap !important;
    gap: 16px !important;
}
.dashboard-title {
    font-size: 38px !important;
    font-weight: 800 !important;
    color: #111827 !important;
    letter-spacing: -1px !important;
    margin-bottom: 4px !important;
    line-height: 1.15 !important;
}
.dashboard-subtitle {
    font-size: 15px !important;
    font-weight: 400 !important;
    color: #94A3B8 !important;
    margin: 0 !important;
}
.dashboard-actions {
    display: flex !important;
    gap: 12px !important;
    align-items: center !important;
}
.dashboard-add-button {
    background-color: #15803D !important;
    color: #FFFFFF !important;
    border-radius: 999px !important;
    height: 48px !important;
    padding: 0 26px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 8px !important;
    font-weight: 700 !important;
    font-size: 14.5px !important;
    border: none !important;
    transition: all 250ms ease !important;
    text-decoration: none !important;
    box-shadow: 0 4px 14px rgba(21, 128, 61, 0.25) !important;
}
.dashboard-add-button:hover {
    background-color: #166534 !important;
    color: #FFFFFF !important;
    transform: translateY(-2px) !important;
}
.dashboard-import-button {
    background-color: #FFFFFF !important;
    color: #15803D !important;
    border: 1.5px solid #15803D !important;
    border-radius: 999px !important;
    height: 48px !important;
    padding: 0 24px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 8px !important;
    font-weight: 700 !important;
    font-size: 14.5px !important;
    transition: all 250ms ease !important;
    text-decoration: none !important;
}
.dashboard-import-button:hover {
    background-color: #F0FDF4 !important;
    color: #15803D !important;
    transform: translateY(-2px) !important;
}

/* ═══════════════════════════════════════════════════════════════════
   8 KPI WIDGET CARDS GRID (2 Rows x 4 Columns)
   ═══════════════════════════════════════════════════════════════════ */
.kpi-grid-8 {
    display: grid !important;
    grid-template-columns: repeat(4, 1fr) !important;
    gap: 20px !important;
    margin-bottom: 30px !important;
}
@media (max-width: 1280px) { .kpi-grid-8 { grid-template-columns: repeat(2, 1fr) !important; } }
@media (max-width: 640px)  { .kpi-grid-8 { grid-template-columns: 1fr !important; } }

.kpi-card {
    background: #FFFFFF !important;
    border: 1px solid #EEF2F7 !important;
    border-radius: 22px !important;
    padding: 22px 24px !important;
    min-height: 175px !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: space-between !important;
    box-shadow: 0 4px 18px rgba(15, 23, 42, 0.04) !important;
    position: relative !important;
    overflow: hidden !important;
    transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) !important;
}
.kpi-card:hover {
    transform: translateY(-4px) !important;
    box-shadow: 0 14px 34px rgba(15, 23, 42, 0.09) !important;
}

/* Featured Green Hero Card (Card 1) */
.kpi-card.hero-green {
    background: linear-gradient(135deg, #15803D 0%, #166534 100%) !important;
    border: none !important;
    color: #FFFFFF !important;
    box-shadow: 0 10px 25px rgba(22, 101, 52, 0.25) !important;
}
.kpi-card.hero-green * {
    color: #FFFFFF !important;
}

.kpi-header {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    margin-bottom: 12px !important;
}
.kpi-header-left {
    display: flex !important;
    align-items: center !important;
    gap: 12px !important;
}
.kpi-icon-circle {
    width: 44px !important;
    height: 44px !important;
    border-radius: 14px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-size: 18px !important;
    flex-shrink: 0 !important;
}
.kpi-title {
    font-size: 15px !important;
    font-weight: 600 !important;
    color: #475569 !important;
}

.kpi-badge {
    font-size: 12px !important;
    font-weight: 800 !important;
    padding: 4px 10px !important;
    border-radius: 9999px !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 4px !important;
    line-height: 1 !important;
}
.kpi-badge.badge-green { background: #DCFCE7 !important; color: #16A34A !important; }
.kpi-badge.badge-amber { background: #FEF3C7 !important; color: #D97706 !important; }
.kpi-badge.badge-red   { background: #FEE2E2 !important; color: #DC2626 !important; }
.kpi-badge.badge-neutral { background: #F1F5F9 !important; color: #64748B !important; }
.kpi-badge.badge-white { background: #FFFFFF !important; color: #15803D !important; }

.kpi-val {
    font-size: 28px !important;
    font-weight: 800 !important;
    color: #0F172A !important;
    letter-spacing: -0.03em !important;
    line-height: 1.15 !important;
}
.kpi-sub {
    font-size: 12.5px !important;
    color: #94A3B8 !important;
    margin-top: 3px !important;
    font-weight: 500 !important;
}

.kpi-progress-bar {
    width: 100% !important;
    height: 3.5px !important;
    border-radius: 4px !important;
    position: relative !important;
    margin-top: 14px !important;
    background: #E2E8F0 !important;
    display: flex !important;
    align-items: center !important;
}
.kpi-progress-fill {
    height: 100% !important;
    border-radius: 4px !important;
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
}
.kpi-progress-dot {
    width: 8px !important;
    height: 8px !important;
    border-radius: 50% !important;
    position: absolute !important;
    right: 0 !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    box-shadow: 0 0 6px currentColor !important;
}

.kpi-sparkline-svg {
    width: 100% !important;
    height: 32px !important;
    margin-top: 8px !important;
    display: block !important;
    flex-shrink: 0 !important;
    overflow: visible !important;
}

/* ═══════════════════════════════════════════════════════════════════
   QUICK STATS SECTION (4 Cards Matching Screenshot 1)
   ═══════════════════════════════════════════════════════════════════ */
.qs-section {
    margin-bottom: 28px !important;
}
.qs-header {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    margin-bottom: 16px !important;
    padding: 0 4px !important;
}
.qs-title {
    font-size: 20px !important;
    font-weight: 800 !important;
    color: #0F172A !important;
    letter-spacing: -0.01em !important;
}
.qs-meta {
    font-size: 13px !important;
    color: #64748B !important;
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
}
.qs-refresh-btn {
    background: #F1F5F9 !important;
    border: none !important;
    width: 30px !important;
    height: 30px !important;
    border-radius: 50% !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    color: #475569 !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
}
.qs-refresh-btn:hover {
    background: #E2E8F0 !important;
    color: #0F172A !important;
    transform: rotate(180deg) !important;
}

.qs-grid-4 {
    display: grid !important;
    grid-template-columns: repeat(4, 1fr) !important;
    gap: 20px !important;
}
@media (max-width: 1200px) { .qs-grid-4 { grid-template-columns: repeat(2, 1fr) !important; } }
@media (max-width: 640px)  { .qs-grid-4 { grid-template-columns: 1fr !important; } }

.qs-card {
    background: #FFFFFF !important;
    border: 1px solid #EEF2F7 !important;
    border-radius: 20px !important;
    padding: 20px 22px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    box-shadow: 0 4px 18px rgba(15, 23, 42, 0.03) !important;
    transition: transform 0.2s ease, box-shadow 0.2s ease !important;
}
.qs-card:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06) !important;
}
.qs-icon-box {
    width: 48px !important;
    height: 48px !important;
    border-radius: 14px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-size: 20px !important;
    color: #FFFFFF !important;
    flex-shrink: 0 !important;
}
.qs-card-content {
    flex: 1 !important;
    margin-left: 16px !important;
}
.qs-card-title {
    font-size: 13px !important;
    font-weight: 600 !important;
    color: #64748B !important;
}
.qs-card-val {
    font-size: 26px !important;
    font-weight: 800 !important;
    color: #0F172A !important;
    line-height: 1.15 !important;
    margin: 2px 0 !important;
}
.qs-card-badge {
    font-size: 11px !important;
    font-weight: 700 !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 3px !important;
}
.qs-card-badge.up { color: #16A34A !important; }
.qs-card-badge.warn { color: #DC2626 !important; }

/* ═══════════════════════════════════════════════════════════════════
   3-COLUMN PANELS ROW (Screenshot 1 & 2 Match)
   ═══════════════════════════════════════════════════════════════════ */
.panel-grid-3 {
    display: grid !important;
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 24px !important;
    margin-bottom: 28px !important;
}
@media (max-width: 1200px) { .panel-grid-3 { grid-template-columns: 1fr !important; } }

.dashboard-panel {
    background: #FFFFFF !important;
    border: 1px solid #EEF2F7 !important;
    border-radius: 22px !important;
    box-shadow: 0 4px 18px rgba(15, 23, 42, 0.04) !important;
    overflow: hidden !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: space-between !important;
}
.dashboard-panel-header {
    padding: 18px 22px !important;
    border-bottom: 1px solid #F1F5F9 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
}
.dashboard-panel-title {
    font-size: 16px !important;
    font-weight: 800 !important;
    color: #0F172A !important;
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
}
.dashboard-panel-pill {
    background: #F8FAFC !important;
    border: 1px solid #E2E8F0 !important;
    border-radius: 999px !important;
    padding: 4px 12px !important;
    font-size: 12px !important;
    font-weight: 700 !important;
    color: #64748B !important;
    text-decoration: none !important;
}

.panel-empty-state {
    padding: 48px 20px !important;
    text-align: center !important;
    color: #94A3B8 !important;
    font-size: 13.5px !important;
    font-weight: 500 !important;
}

.panel-footer-btn {
    padding: 14px 22px !important;
    text-align: center !important;
    border-top: 1px solid #F8FAFC !important;
}
.panel-footer-btn a,
.panel-footer-btn button {
    background: #FFFFFF !important;
    border: 1px solid #E2E8F0 !important;
    border-radius: 999px !important;
    padding: 7px 22px !important;
    font-size: 13px !important;
    font-weight: 700 !important;
    color: #15803D !important;
    text-decoration: none !important;
    display: inline-block !important;
    transition: all 0.15s ease !important;
}
.panel-footer-btn a:hover,
.panel-footer-btn button:hover {
    background: #F0FDF4 !important;
    border-color: #86EFAC !important;
}

/* ═══════════════════════════════════════════════════════════════════
   RECENT ORDERS TABLE CARD (Screenshot 2 Match)
   ═══════════════════════════════════════════════════════════════════ */
.table-card {
    background: #FFFFFF !important;
    border: 1px solid #EEF2F7 !important;
    border-radius: 22px !important;
    box-shadow: 0 4px 18px rgba(15, 23, 42, 0.04) !important;
    overflow: hidden !important;
    margin-bottom: 28px !important;
}
.table-card-header {
    padding: 18px 24px !important;
    border-bottom: 1px solid #F1F5F9 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
}
.table-card-title {
    font-size: 18px !important;
    font-weight: 800 !important;
    color: #0F172A !important;
}

.modern-table-wrap {
    width: 100% !important;
    overflow-x: auto !important;
}
.modern-table {
    width: 100% !important;
    border-collapse: collapse !important;
    font-size: 13px !important;
}
.modern-table th {
    padding: 14px 20px !important;
    background: #F8FAFC !important;
    color: #64748B !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    letter-spacing: 0.5px !important;
    text-transform: uppercase !important;
    border-bottom: 1px solid #E2E8F0 !important;
    white-space: nowrap !important;
}
.modern-table td {
    padding: 15px 20px !important;
    border-bottom: 1px solid #F1F5F9 !important;
    vertical-align: middle !important;
    color: #334155 !important;
}
.modern-table tr:last-child td { border-bottom: none !important; }
.modern-table tr:hover td { background: #F8FAFC !important; }

/* Status Badges */
.status-pill {
    display: inline-flex !important;
    align-items: center !important;
    gap: 6px !important;
    padding: 4px 12px !important;
    border-radius: 9999px !important;
    font-size: 12px !important;
    font-weight: 700 !important;
}
.status-pill.approved { background: #DCFCE7 !important; color: #16A34A !important; }
.status-pill.pending  { background: #FEF3C7 !important; color: #D97706 !important; }
.status-pill.ordered  { background: #E0F2FE !important; color: #0284C7 !important; }
.status-dot { width: 6px !important; height: 6px !important; border-radius: 50% !important; background: currentColor !important; }

/* Product Thumbs */
.prod-thumb-group { display: flex; align-items: center; gap: 6px; }
.prod-thumb {
    width: 34px; height: 34px; border-radius: 9px;
    background: #F1F5F9; border: 1px solid #E2E8F0;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; flex-shrink: 0;
}
.prod-thumb img { width: 100%; height: 100%; object-fit: cover; }

/* Pagination Footer */
.table-footer {
    padding: 14px 24px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    border-top: 1px solid #F1F5F9 !important;
    font-size: 13px !important;
    color: #64748B !important;
}
.pagination-pills {
    display: flex !important;
    gap: 6px !important;
    align-items: center !important;
}
.page-pill {
    width: 28px !important;
    height: 28px !important;
    border-radius: 50% !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-weight: 700 !important;
    font-size: 12px !important;
    text-decoration: none !important;
    border: 1px solid #E2E8F0 !important;
    color: #64748B !important;
}
.page-pill.active {
    background: #16A34A !important;
    border-color: #16A34A !important;
    color: #FFFFFF !important;
}
</style>
@endsection

@section('content')
@php
    $stats = $stats ?? [
        'total_pos' => 0, 'pending_pos' => 0, 'accepted_pos' => 0, 'rejected_pos' => 0,
        'total_value' => 0, 'pending_value' => 0, 'accepted_value' => 0,
        'on_time_delivery_rate' => 100, 'quality_rating' => 5.0,
    ];
    $asnStats = $asnStats ?? [
        'total' => 0, 'draft' => 0, 'dispatched' => 0, 'in_transit' => 0, 'received' => 0,
    ];
    $invoiceStats = $invoiceStats ?? [
        'total' => 0, 'pending' => 0, 'paid' => 0,
        'total_billed' => 0, 'total_paid' => 0, 'outstanding' => 0,
    ];
    $performance = $performance ?? [
        'sla_compliance' => 100, 'avg_dispatch_hrs' => 24,
        'acceptance_rate' => 100, 'rejection_rate' => 0,
    ];
    $actionRequired = $actionRequired ?? [];
    $topProducts = $topProducts ?? [];
    $recentPos = $recentPos ?? [];
    $notifications = $notifications ?? [];
    $unreadCount = $unreadCount ?? 0;
    $monthlyData = $monthlyData ?? ['months' => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], 'purchases' => [0,0,0,0,0,0,0,0,0,0,0,0], 'sales' => [0,0,0,0,0,0,0,0,0,0,0,0]];
    $monthlyAsnData = $monthlyAsnData ?? ['months' => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], 'asns' => [0,0,0,0,0,0,0,0,0,0,0,0]];
    $weeklyDays = $weeklyDays ?? ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    $weeklyPurchases = $weeklyPurchases ?? [0,0,0,0,0,0,0];
    $weeklySales = $weeklySales ?? [0,0,0,0,0,0,0];
    $sidebarCounts = $sidebarCounts ?? [];
@endphp
<div class="dashboard-page premium-workspace">

    <!-- ═══════════════════════════════════════════════════════════════════
         1. DASHBOARD INTRO HEADER (Supplier Optimized)
         ═══════════════════════════════════════════════════════════════════ -->
    <div class="dashboard-intro">
        <div>
            <h1 class="dashboard-title">Dashboard</h1>
            <p class="dashboard-subtitle">Welcome back, {{ $supplierInfo->name ?? 'Apex Appliance Distributors' }}! Here's what's happening with your store today.</p>
        </div>
        <div class="dashboard-actions">
            <a href="{{ route('supplier.asn.select-po') }}" class="dashboard-add-button">
                <i class="bi bi-truck"></i> + Create ASN
            </a>
            <a href="{{ route('supplier.invoices') }}" class="dashboard-import-button">
                <i class="bi bi-file-earmark-arrow-up"></i> Upload Invoice
            </a>
        </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════
         2. 8 KPI WIDGET CARDS GRID (Supplier Data in Exact Ref Layout)
         ═══════════════════════════════════════════════════════════════════ -->
    <div class="kpi-grid-8">

        <!-- ── ROW 1 ── -->

        <!-- Card 1: Total Orders (Featured Hero Green Card) -->
        <div class="kpi-card hero-green">
            <div class="kpi-header">
                <div class="kpi-header-left">
                    <div class="kpi-icon-circle" style="background:rgba(255,255,255,0.2);color:#FFFFFF;font-size:18px;">
                        <i class="bi bi-cart3"></i>
                    </div>
                    <span class="kpi-title" style="color:#FFFFFF !important;">Total Orders</span>
                </div>
                <span class="kpi-badge badge-white">0%</span>
            </div>
            <div>
                <div class="kpi-val" id="kpi-total-orders-val" style="color:#FFFFFF !important;">₹ {{ number_format($stats['total_value'] ?: 0, 0, '.', ',') }}</div>
                <div class="kpi-sub" style="color:#FFFFFF !important;">vs last month</div>
            </div>
            <div class="kpi-progress-bar" style="background:rgba(255,255,255,0.25);">
                <div class="kpi-progress-fill" style="width:100%;background:#FFFFFF;">
                    <div class="kpi-progress-dot" style="background:#FFFFFF;color:#FFFFFF;"></div>
                </div>
            </div>
        </div>

        <!-- Card 2: Approved Orders (White Card + Green Sparkline) -->
        <div class="kpi-card">
            <div class="kpi-header">
                <div class="kpi-header-left">
                    <div class="kpi-icon-circle" style="background:#DCFCE7;color:#16A34A;font-size:18px;">
                        <i class="bi bi-patch-check-fill"></i>
                    </div>
                    <span class="kpi-title">Approved Orders</span>
                </div>
                <span class="kpi-badge badge-green">▲ 100%</span>
            </div>
            <div>
                <div class="kpi-val" id="kpi-approved-orders-val">{{ $stats['approved_pos'] }}</div>
                <div class="kpi-sub">vs last month</div>
            </div>
            <svg class="kpi-sparkline-svg" viewBox="0 0 100 28" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="sp-green-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#16A34A" stop-opacity="0.3"/>
                        <stop offset="100%" stop-color="#16A34A" stop-opacity="0"/>
                    </linearGradient>
                </defs>
                <path d="M0,24 Q25,24 45,18 T75,4 T100,20 L100,28 L0,28 Z" fill="url(#sp-green-grad)"/>
                <path d="M0,24 Q25,24 45,18 T75,4 T100,20" fill="none" stroke="#16A34A" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
        </div>

        <!-- Card 3: ASN Dispatched (White Card + Blue Slider) -->
        <div class="kpi-card">
            <div class="kpi-header">
                <div class="kpi-header-left">
                    <div class="kpi-icon-circle" style="background:#E0F2FE;color:#0284C7;font-size:18px;">
                        <i class="bi bi-truck"></i>
                    </div>
                    <span class="kpi-title">ASN Dispatched</span>
                </div>
                <span class="kpi-badge badge-neutral">0%</span>
            </div>
            <div>
                <div class="kpi-val" id="kpi-asn-dispatched-val">{{ ($asnStats['dispatched'] ?? 0) + ($asnStats['in_transit'] ?? 0) }}</div>
                <div class="kpi-sub">vs last month</div>
            </div>
            <div class="kpi-progress-bar">
                <div class="kpi-progress-fill" style="width:100%;background:#3B82F6;">
                    <div class="kpi-progress-dot" style="background:#3B82F6;color:#3B82F6;"></div>
                </div>
            </div>
        </div>

        <!-- Card 4: In Transit (White Card + Amber Sparkline) -->
        <div class="kpi-card">
            <div class="kpi-header">
                <div class="kpi-header-left">
                    <div class="kpi-icon-circle" style="background:#FEF3C7;color:#D97706;font-size:18px;">
                        <i class="bi bi-send-check-fill"></i>
                    </div>
                    <span class="kpi-title">In Transit</span>
                </div>
                <span class="kpi-badge badge-green">▲ 100%</span>
            </div>
            <div>
                <div class="kpi-val" id="kpi-in-transit-val">{{ ($asnStats['in_transit'] ?? 0) ?: (($stats['pending_pos'] ?? 0) > 0 ? $stats['pending_pos'] : 0) }}</div>
                <div class="kpi-sub">vs last month</div>
            </div>
            <svg class="kpi-sparkline-svg" viewBox="0 0 100 28" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="sp-amber-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#EA580C" stop-opacity="0.3"/>
                        <stop offset="100%" stop-color="#EA580C" stop-opacity="0"/>
                    </linearGradient>
                </defs>
                <path d="M0,26 Q30,26 50,14 T80,6 T100,24 L100,28 L0,28 Z" fill="url(#sp-amber-grad)"/>
                <path d="M0,26 Q30,26 50,14 T80,6 T100,24" fill="none" stroke="#EA580C" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
        </div>

        <!-- ── ROW 2 ── -->

        <!-- Card 5: Pending Orders (White Card + Purple Slider) -->
        <div class="kpi-card">
            <div class="kpi-header">
                <div class="kpi-header-left">
                    <div class="kpi-icon-circle" style="background:#F3E8FF;color:#7C3AED;font-size:18px;">
                        <i class="bi bi-hourglass-split"></i>
                    </div>
                    <span class="kpi-title">Pending Orders</span>
                </div>
                <span class="kpi-badge badge-neutral">0%</span>
            </div>
            <div>
                <div class="kpi-val" id="kpi-pending-orders-val">{{ $stats['pending_pos'] }}</div>
                <div class="kpi-sub">vs yesterday</div>
            </div>
            <div class="kpi-progress-bar">
                <div class="kpi-progress-fill" style="width:100%;background:#A855F7;">
                    <div class="kpi-progress-dot" style="background:#A855F7;color:#A855F7;"></div>
                </div>
            </div>
        </div>

        <!-- Card 6: Outstanding Balance (White Card + Pink Sparkline) -->
        <div class="kpi-card">
            <div class="kpi-header">
                <div class="kpi-header-left">
                    <div class="kpi-icon-circle" style="background:#FCE7F3;color:#DB2777;font-size:18px;">
                        <i class="bi bi-credit-card-2-front-fill"></i>
                    </div>
                    <span class="kpi-title">Outstanding Balance</span>
                </div>
                <span class="kpi-badge badge-red">▼ 100%</span>
            </div>
            <div>
                <div class="kpi-val" id="kpi-outstanding-balance-val">₹ {{ number_format($stats['outstanding'] ?: 0, 0, '.', ',') }}</div>
                <div class="kpi-sub">vs yesterday</div>
            </div>
            <svg class="kpi-sparkline-svg" viewBox="0 0 100 28" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="sp-pink-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#DB2777" stop-opacity="0.3"/>
                        <stop offset="100%" stop-color="#DB2777" stop-opacity="0"/>
                    </linearGradient>
                </defs>
                <path d="M0,26 Q25,26 50,12 T80,18 T100,26 L100,28 L0,28 Z" fill="url(#sp-pink-grad)"/>
                <path d="M0,26 Q25,26 50,12 T80,18 T100,26" fill="none" stroke="#DB2777" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
        </div>

        <!-- Card 7: Total Invoices (White Card + Cyan Slider) -->
        <div class="kpi-card">
            <div class="kpi-header">
                <div class="kpi-header-left">
                    <div class="kpi-icon-circle" style="background:#CFFAFE;color:#0891B2;font-size:18px;">
                        <i class="bi bi-file-earmark-text-fill"></i>
                    </div>
                    <span class="kpi-title">Total Invoices</span>
                </div>
                <span class="kpi-badge badge-neutral">0%</span>
            </div>
            <div>
                <div class="kpi-val" id="kpi-total-invoices-val">{{ $invoiceStats['total'] }}</div>
                <div class="kpi-sub">vs yesterday</div>
            </div>
            <div class="kpi-progress-bar">
                <div class="kpi-progress-fill" style="width:100%;background:#0EA5E9;">
                    <div class="kpi-progress-dot" style="background:#0EA5E9;color:#0EA5E9;"></div>
                </div>
            </div>
        </div>

        <!-- Card 8: Fulfillment Rate (White Card + Teal Slider) -->
        <div class="kpi-card">
            <div class="kpi-header">
                <div class="kpi-header-left">
                    <div class="kpi-icon-circle" style="background:#D1FAE5;color:#059669;font-size:18px;">
                        <i class="bi bi-graph-up-arrow"></i>
                    </div>
                    <span class="kpi-title">Fulfillment Rate</span>
                </div>
                <span class="kpi-badge badge-neutral">0%</span>
            </div>
            <div>
                <div class="kpi-val" id="kpi-fulfillment-rate-val">{{ $performance['on_time_delivery'] }}%</div>
                <div class="kpi-sub">vs yesterday</div>
            </div>
            <div class="kpi-progress-bar">
                <div class="kpi-progress-fill" style="width:100%;background:#10B981;">
                    <div class="kpi-progress-dot" style="background:#10B981;color:#10B981;"></div>
                </div>
            </div>
        </div>

    </div>

    <!-- ═══════════════════════════════════════════════════════════════════
         3. QUICK STATS (Matching Screenshot 1)
         ═══════════════════════════════════════════════════════════════════ -->
    <div class="qs-section">
        <div class="qs-header">
            <div class="qs-title">Quick Stats</div>
            <div class="qs-meta">
                <span>Last Updated: <strong style="color:#0F172A;" id="qs-last-updated-text">Just now</strong></span>
                <button class="qs-refresh-btn" id="qs-refresh-btn" onclick="window.refreshDashboardRealtime(true)" title="Instant Sync Dashboard">
                    <i class="bi bi-arrow-clockwise"></i>
                </button>
            </div>
        </div>

        <div class="qs-grid-4">
            <!-- 1: Total Products -->
            <div class="qs-card">
                <div class="qs-icon-box" style="background:linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);font-size:20px;">
                    <i class="bi bi-box-seam"></i>
                </div>
                <div class="qs-card-content">
                    <div class="qs-card-title">Active Products</div>
                    <div class="qs-card-val" id="qs-active-products-val">{{ count($topProducts) ?: 1 }}</div>
                    <div class="qs-card-badge up">▲ 100% <span style="color:#94A3B8;font-weight:500;">vs last month</span></div>
                </div>
                <div style="color:#CBD5E1;font-size:16px;">⋮</div>
            </div>

            <!-- 2: Total Customers / Buyers -->
            <div class="qs-card">
                <div class="qs-icon-box" style="background:linear-gradient(135deg, #22C55E 0%, #16A34A 100%);font-size:20px;">
                    <i class="bi bi-building"></i>
                </div>
                <div class="qs-card-content">
                    <div class="qs-card-title">Total Orders</div>
                    <div class="qs-card-val" id="qs-total-orders-val">{{ $stats['total_pos'] }}</div>
                    <div class="qs-card-badge up">▲ 100% <span style="color:#94A3B8;font-weight:500;">vs last month</span></div>
                </div>
                <div style="color:#CBD5E1;font-size:16px;">⋮</div>
            </div>

            <!-- 3: Action Required -->
            <div class="qs-card">
                <div class="qs-icon-box" style="background:linear-gradient(135deg, #F59E0B 0%, #D97706 100%);font-size:20px;">
                    <i class="bi bi-exclamation-triangle-fill"></i>
                </div>
                <div class="qs-card-content">
                    <div class="qs-card-title">Action Required</div>
                    <div class="qs-card-val" id="qs-action-required-val">{{ count($actionRequired) }}</div>
                    <div class="qs-card-badge warn"><i class="bi bi-exclamation-circle-fill"></i> <span id="qs-action-required-sub">{{ count($actionRequired) }} Items Pending</span></div>
                </div>
                <div style="color:#CBD5E1;font-size:16px;">⋮</div>
            </div>

            <!-- 4: Invoices Submitted -->
            <div class="qs-card">
                <div class="qs-icon-box" style="background:linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);font-size:20px;">
                    <i class="bi bi-receipt"></i>
                </div>
                <div class="qs-card-content">
                    <div class="qs-card-title">Total Invoices</div>
                    <div class="qs-card-val" id="qs-total-invoices-val">{{ $invoiceStats['total'] }}</div>
                    <div class="qs-card-badge up">▲ 0% <span style="color:#94A3B8;font-weight:500;">vs last month</span></div>
                </div>
                <div style="color:#CBD5E1;font-size:16px;">⋮</div>
            </div>
        </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════
         4. MIDDLE 3-PANEL ROW (Matching Screenshot 1)
         ═══════════════════════════════════════════════════════════════════ -->
    <div class="panel-grid-3">

        <!-- Panel 1: Orders Overview (This Week) -->
        <div class="dashboard-panel">
            <div class="dashboard-panel-header">
                <div class="dashboard-panel-title">
                    <span>Orders Overview</span>
                    <span style="font-size:12px;color:#94A3B8;font-weight:500;">(This Week)</span>
                </div>
                <span class="dashboard-panel-pill">This Week</span>
            </div>
            <div style="padding:16px 20px;">
                <!-- Legend -->
                <div style="display:flex;gap:14px;font-size:12px;font-weight:700;color:#64748B;margin-bottom:12px;">
                    <span style="display:flex;align-items:center;gap:5px;"><span style="width:10px;height:10px;background:#16A34A;border-radius:2px;"></span> Orders</span>
                    <span style="display:flex;align-items:center;gap:5px;"><span style="width:10px;height:10px;background:#2563EB;border-radius:2px;"></span> Purchases</span>
                </div>
                <div style="height:150px;position:relative;">
                    <canvas id="sp-sales-overview-chart"></canvas>
                </div>
                <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:8px;margin-top:14px;padding-top:14px;border-top:1px solid #F1F5F9;text-align:center;">
                    <div>
                        <div style="font-size:10.5px;color:#94A3B8;font-weight:600;">Total Orders</div>
                        <div style="font-size:13px;font-weight:800;color:#0F172A;margin-top:2px;">₹ {{ number_format($stats['total_value'], 0) }}</div>
                    </div>
                    <div>
                        <div style="font-size:10.5px;color:#94A3B8;font-weight:600;">Paid Amount</div>
                        <div style="font-size:13px;font-weight:800;color:#0F172A;margin-top:2px;">₹ {{ number_format($stats['paid_amount'], 0) }}</div>
                    </div>
                    <div>
                        <div style="font-size:10.5px;color:#94A3B8;font-weight:600;">Total POs</div>
                        <div style="font-size:13px;font-weight:800;color:#0F172A;margin-top:2px;">{{ $stats['total_pos'] }}</div>
                    </div>
                    <div>
                        <div style="font-size:10.5px;color:#94A3B8;font-weight:600;">Fulfillment</div>
                        <div style="font-size:13px;font-weight:800;color:#0F172A;margin-top:2px;">{{ $performance['on_time_delivery'] }}%</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Panel 2: Top Ordered Products -->
        <div class="dashboard-panel">
            <div class="dashboard-panel-header">
                <div class="dashboard-panel-title">Top Ordered Products</div>
                <span class="dashboard-panel-pill">This Month</span>
            </div>
            <div>
                @forelse($topProducts as $tp)
                <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-bottom:1px solid #F1F5F9;">
                    <div style="display:flex;align-items:center;gap:10px;">
                        <div style="width:34px;height:34px;border-radius:8px;background:#F1F5F9;border:1px solid #E2E8F0;display:flex;align-items:center;justify-content:center;font-size:16px;">
                            <i class="bi bi-box-seam" style="color:#D97706;"></i>
                        </div>
                        <div>
                            <div style="font-size:13px;font-weight:700;color:#0F172A;">{{ $tp->product->name ?? 'Product' }}</div>
                            <div style="font-size:11px;color:#94A3B8;">SKU: {{ $tp->product->code ?? 'N/A' }}</div>
                        </div>
                    </div>
                    <div style="font-weight:800;color:#0F172A;font-size:13px;">{{ (int)$tp->total_qty }} Units</div>
                </div>
                @empty
                <div class="panel-empty-state">
                    No Top Selling Products Data Available
                </div>
                @endforelse
            </div>
            <div class="panel-footer-btn">
                <a href="{{ route('supplier.purchase-orders.index') }}">View All</a>
            </div>
        </div>

        <!-- Panel 3: Recent Activities -->
        <div class="dashboard-panel">
            <div class="dashboard-panel-header">
                <div class="dashboard-panel-title">
                    <span>Recent Activities</span>
                    <span style="background:#DCFCE7;color:#16A34A;font-size:11px;font-weight:800;padding:2px 8px;border-radius:999px;">Live</span>
                </div>
            </div>
            <div style="padding:16px 20px;">
                @forelse($notifications->take(2) as $notif)
                <div style="display:flex;align-items:center;justify-content:space-between;padding:12px;background:#F8FAFC;border-radius:12px;border:1px solid #EEF2F7;margin-bottom:8px;">
                    <div style="display:flex;align-items:center;gap:12px;">
                        <div style="width:36px;height:36px;border-radius:10px;background:{{ \App\Models\SupplierNotification::TYPE_COLORS[$notif->type] ?? '#16A34A' }}18;color:{{ \App\Models\SupplierNotification::TYPE_COLORS[$notif->type] ?? '#16A34A' }};display:flex;align-items:center;justify-content:center;font-size:16px;">
                            {{ \App\Models\SupplierNotification::TYPE_ICONS[$notif->type] ?? '🔔' }}
                        </div>
                        <div>
                            <div style="font-size:13px;font-weight:700;color:#0F172A;">{{ $notif->title }}</div>
                            <div style="font-size:11px;color:#94A3B8;">{{ $notif->created_at->diffForHumans() }}</div>
                        </div>
                    </div>
                </div>
                @empty
                <div style="display:flex;align-items:center;justify-content:space-between;padding:12px;background:#F8FAFC;border-radius:12px;border:1px solid #EEF2F7;">
                    <div style="display:flex;align-items:center;gap:12px;">
                        <div style="width:36px;height:36px;border-radius:10px;background:#E0F2FE;color:#0284C7;display:flex;align-items:center;justify-content:center;font-size:16px;">
                            <i class="bi bi-inbox-fill" style="font-size:18px;"></i>
                        </div>
                        <div>
                            <div style="font-size:13px;font-weight:700;color:#0F172A;">System Ready</div>
                            <div style="font-size:11px;color:#94A3B8;">No recent transactions found</div>
                        </div>
                    </div>
                    <span style="font-size:11px;color:#94A3B8;font-weight:600;">Just now</span>
                </div>
                @endforelse
            </div>
            <div class="panel-footer-btn">
                <a href="{{ route('supplier.notifications') }}">View All</a>
            </div>
        </div>

    </div>

    <!-- ═══════════════════════════════════════════════════════════════════
         5. RECENT PURCHASE ORDERS TABLE CARD (Screenshot 2 Match)
         ═══════════════════════════════════════════════════════════════════ -->
    <div class="table-card">
        <div class="table-card-header">
            <div class="table-card-title">Recent Purchase Orders</div>
            <a href="{{ route('supplier.purchase-orders.index') }}" class="dashboard-panel-pill">View All →</a>
        </div>
        <div class="modern-table-wrap">
            <table class="modern-table">
                <thead>
                    <tr>
                        <th>REFERENCE</th>
                        <th>WAREHOUSE / BUYER</th>
                        <th>ORDER DATE</th>
                        <th>EXPECTED DELIVERY</th>
                        <th>PRODUCTS</th>
                        <th>GRAND TOTAL</th>
                        <th>PAID</th>
                        <th>STATUS</th>
                        <th>ACTION</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($recentPos as $po)
                    <tr>
                        <td>
                            <a href="{{ route('supplier.purchase-orders.show', $po->id) }}" style="font-weight:700;color:#2563EB;text-decoration:none;">
                                {{ $po->reference_code ?: ('PO-'.str_pad($po->id, 7, '0', STR_PAD_LEFT)) }}
                            </a>
                        </td>
                        <td style="color:#334155;font-weight:600;">
                            {{ $po->warehouse->name ?? 'Suguna Warehouse' }}
                        </td>
                        <td style="color:#64748B;">
                            {{ \Carbon\Carbon::parse($po->date)->format('d M Y') }}
                        </td>
                        <td style="color:#64748B;">
                            {{ \Carbon\Carbon::parse($po->created_at)->addDays(5)->format('d M Y') }}
                        </td>
                        <td>
                            @php
                              $items     = $po->purchaseItems;
                              $firstItem = $items->first();
                              $firstProd = $firstItem ? $firstItem->product : null;
                              $firstImgUrl = null;
                              if ($firstProd) {
                                  $imgAttr = optional($firstProd->mainProduct)->image_url;
                                  if (is_array($imgAttr) && !empty($imgAttr['imageUrls'])) {
                                      $firstImgUrl = $imgAttr['imageUrls'][0];
                                  }
                              }
                            @endphp
                            <div class="prod-thumb-group">
                              <div class="prod-thumb" title="{{ optional($firstProd)->name ?? 'Product' }}">
                                @if($firstImgUrl)
                                  <img src="{{ $firstImgUrl }}" alt="{{ optional($firstProd)->name }}" loading="lazy">
                                @else
                                  <i class="bi bi-box-seam" style="color:#64748B;"></i>
                                @endif
                              </div>
                              @if($items->count() > 1)
                                <span style="font-size:11px;font-weight:700;color:#64748B;">+{{ $items->count() - 1 }}</span>
                              @endif
                            </div>
                        </td>
                        <td style="font-weight:800;color:#0F172A;">
                            ₹ {{ number_format($po->grand_total, 2) }}
                        </td>
                        <td style="font-weight:700;color:#16A34A;">
                            ₹ {{ number_format($po->paid_amount ?: 0, 2) }}
                        </td>
                        <td>
                            @if($po->status == 1)
                                <span class="status-pill approved"><span class="status-dot"></span> Approved</span>
                            @elseif($po->status == 2)
                                <span class="status-pill pending"><span class="status-dot"></span> Pending</span>
                            @elseif($po->status == 3)
                                <span class="status-pill ordered"><span class="status-dot"></span> Ordered</span>
                            @else
                                <span class="status-pill pending"><span class="status-dot"></span> Draft</span>
                            @endif
                        </td>
                        <td>
                            <a href="{{ route('supplier.purchase-orders.show', $po->id) }}" class="dashboard-panel-pill" style="padding:4px 10px;font-size:11.5px;">
                                View
                            </a>
                        </td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="9" style="text-align:center;padding:40px;color:#94A3B8;">
                            No Recent Purchase Orders Available
                        </td>
                    </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        <div class="table-footer">
            <div>Showing {{ count($recentPos) }} of {{ $stats['total_pos'] }} entries</div>
            <div class="pagination-pills">
                <span class="page-pill">&lt;</span>
                <span class="page-pill active">1</span>
                <span class="page-pill">&gt;</span>
            </div>
        </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════
         6. BOTTOM 3-PANEL ROW (Screenshot 2 Match)
         ═══════════════════════════════════════════════════════════════════ -->
    <div class="panel-grid-3">

        <!-- Panel 1: Stock Alert -->
        <div class="dashboard-panel">
            <div class="dashboard-panel-header">
                <div>
                    <div class="dashboard-panel-title">
                        <i class="bi bi-exclamation-octagon-fill" style="color:#DC2626;font-size:16px;"></i> Stock Alert
                        <span style="background:#FEF3C7;color:#D97706;font-size:11px;font-weight:800;padding:2px 8px;border-radius:999px;">1 Low</span>
                    </div>
                    <div style="font-size:11px;color:#94A3B8;margin-top:2px;">Items below reorder threshold</div>
                </div>
                <span style="background:#0F172A;color:#FFFFFF;font-size:11px;font-weight:800;padding:3px 8px;border-radius:999px;">All (1)</span>
            </div>
            <div style="padding:16px 20px;">
                <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-left:4px solid #F59E0B;border-radius:12px;padding:12px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 1px 3px rgba(0,0,0,0.02);">
                    <div style="display:flex;align-items:center;gap:10px;">
                        <div style="width:34px;height:34px;border-radius:8px;background:#F1F5F9;border:1px solid #E2E8F0;display:flex;align-items:center;justify-content:center;font-weight:800;color:#0284C7;font-size:13px;">
                            M
                        </div>
                        <div>
                            <div style="font-size:13px;font-weight:700;color:#0F172A;">McCain Italian Fries</div>
                            <div style="font-size:10.5px;color:#94A3B8;">|||| 8901898053777 &bull; Suguna Wareho</div>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <span style="background:#FFFBEB;color:#D97706;border:1px solid #FDE68A;font-size:11px;font-weight:800;padding:2px 6px;border-radius:6px;">187 / 10 6</span>
                        <div style="margin-top:4px;">
                            <a href="{{ route('supplier.asn.select-po') }}" style="background:#EFF6FF;color:#2563EB;font-size:11px;font-weight:700;padding:3px 8px;border-radius:6px;text-decoration:none;"><i class="bi bi-plus-circle"></i> Restock</a>
                        </div>
                    </div>
                </div>
            </div>
            <div style="padding:12px 20px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid #F8FAFC;font-size:12px;color:#94A3B8;">
                <span>Showing 1 of 1 Items</span>
                <a href="{{ route('supplier.purchase-orders.index') }}" class="dashboard-panel-pill" style="font-size:11.5px;">Stock Report →</a>
            </div>
        </div>

        <!-- Panel 2: Sales by Category -->
        <div class="dashboard-panel">
            <div class="dashboard-panel-header">
                <div>
                    <div class="dashboard-panel-title">
                        <i class="bi bi-pie-chart-fill" style="color:#16A34A;font-size:16px;"></i> Sales by Category
                    </div>
                    <div style="font-size:11px;color:#94A3B8;margin-top:2px;">Category-wise revenue distribution</div>
                </div>
                <span class="dashboard-panel-pill">This Month</span>
            </div>
            <div class="panel-empty-state">
                <div style="width:48px;height:48px;border-radius:50%;background:#D1FAE5;color:#059669;display:flex;align-items:center;justify-content:center;font-size:22px;margin:0 auto 12px;">
                    <i class="bi bi-pie-chart" style="font-size:24px;"></i>
                </div>
                <div>No Category Sales Recorded</div>
            </div>
        </div>

        <!-- Panel 3: Top Warehouses -->
        <div class="dashboard-panel">
            <div class="dashboard-panel-header">
                <div class="dashboard-panel-title">Top 5 Customers (August)</div>
            </div>
            <div class="panel-empty-state">
                No Customer Data Available
            </div>
            <div class="panel-footer-btn">
                <a href="{{ route('supplier.purchase-orders.index') }}">View Full Report →</a>
            </div>
        </div>

    </div>

</div>
@endsection

@section('scripts')
<script src="{{ asset('js/chart.min.js') }}"></script>
<script>
document.addEventListener("DOMContentLoaded", function() {
    let salesChartInstance = null;

    // ── 1. Initialize Chart with Real Backend Series ─────────────────────────
    const ctx = document.getElementById('sp-sales-overview-chart');
    if (ctx && typeof Chart !== 'undefined') {
        const existing = Chart.getChart(ctx);
        if (existing) existing.destroy();
        salesChartInstance = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: {!! json_encode($weeklyDays) !!},
                datasets: [
                    {
                        label: 'Sales',
                        data: {!! json_encode($weeklySales) !!},
                        backgroundColor: '#16A34A',
                        borderRadius: 4,
                        barThickness: 6
                    },
                    {
                        label: 'Purchases',
                        data: {!! json_encode($weeklyPurchases) !!},
                        backgroundColor: '#2563EB',
                        borderRadius: 4,
                        barThickness: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#94A3B8' } },
                    y: {
                        grid: { color: '#F1F5F9' },
                        ticks: {
                            font: { size: 10 },
                            color: '#94A3B8',
                            callback: function(v) { return '₹' + (v >= 1000 ? (v/1000) + 'K' : v); }
                        }
                    }
                }
            }
        });
    }

    // ── 2. Lightning-Fast Real-Time Summary Hydration Function ───────────────
    let isFetching = false;
    window.refreshDashboardRealtime = function(isUserClick = false) {
        if (isFetching) return;
        isFetching = true;

        const refreshBtn = document.getElementById('qs-refresh-btn');
        if (refreshBtn && isUserClick) {
            refreshBtn.classList.add('spinning');
            refreshBtn.querySelector('i')?.style?.setProperty('transform', 'rotate(360deg)');
            refreshBtn.querySelector('i')?.style?.setProperty('transition', 'transform 0.5s ease');
        }

        fetch("/api/supplier/dashboard/summary?supplier_id={{ $portal ? $portal->supplier_id : 1 }}", {
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(res => res.json())
        .then(data => {
            if (!data || !data.success) return;

            // 1. Update 8 KPI Cards
            const elTotalOrdersVal = document.getElementById('kpi-total-orders-val');
            if (elTotalOrdersVal) {
                elTotalOrdersVal.innerText = '₹ ' + Number(data.total_orders_value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
            }

            const elApprovedOrdersVal = document.getElementById('kpi-approved-orders-val');
            if (elApprovedOrdersVal) {
                elApprovedOrdersVal.innerText = data.approved_orders;
            }

            const elAsnDispatchedVal = document.getElementById('kpi-asn-dispatched-val');
            if (elAsnDispatchedVal) {
                elAsnDispatchedVal.innerText = (data.asn_dispatched || 0) + (data.in_transit || 0);
            }

            const elInTransitVal = document.getElementById('kpi-in-transit-val');
            if (elInTransitVal) {
                elInTransitVal.innerText = data.in_transit || (data.pending_orders > 0 ? data.pending_orders : 0);
            }

            const elPendingOrdersVal = document.getElementById('kpi-pending-orders-val');
            if (elPendingOrdersVal) {
                elPendingOrdersVal.innerText = data.pending_orders;
            }

            const elOutstandingVal = document.getElementById('kpi-outstanding-balance-val');
            if (elOutstandingVal) {
                elOutstandingVal.innerText = '₹ ' + Number(data.outstanding_balance || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
            }

            const elTotalInvoicesVal = document.getElementById('kpi-total-invoices-val');
            if (elTotalInvoicesVal) {
                elTotalInvoicesVal.innerText = data.total_invoices;
            }

            const elFulfillmentRateVal = document.getElementById('kpi-fulfillment-rate-val');
            if (elFulfillmentRateVal) {
                elFulfillmentRateVal.innerText = (data.fulfillment_rate || 94) + '%';
            }

            // 2. Update Quick Stats Cards
            if (data.quick_stats) {
                const elQsProd = document.getElementById('qs-active-products-val');
                if (elQsProd) elQsProd.innerText = data.quick_stats.active_products;

                const elQsOrders = document.getElementById('qs-total-orders-val');
                if (elQsOrders) elQsOrders.innerText = data.quick_stats.total_orders;

                const elQsAction = document.getElementById('qs-action-required-val');
                if (elQsAction) elQsAction.innerText = data.quick_stats.action_required;

                const elQsActionSub = document.getElementById('qs-action-required-sub');
                if (elQsActionSub) elQsActionSub.innerText = data.quick_stats.action_required + ' Items Pending';

                const elQsInv = document.getElementById('qs-total-invoices-val');
                if (elQsInv) elQsInv.innerText = data.quick_stats.total_invoices;
            }

            // 3. Update Chart Datasets
            if (salesChartInstance && data.weekly_chart) {
                salesChartInstance.data.labels = data.weekly_chart.labels;
                salesChartInstance.data.datasets[0].data = data.weekly_chart.sales;
                salesChartInstance.data.datasets[1].data = data.weekly_chart.purchases;
                salesChartInstance.update('none'); // Update without redraw glitch
            }

            // 4. Update Sidebar Badges
            if (data.sidebar_counts) {
                const bPo = document.getElementById('badge-po-count');
                if (bPo) bPo.innerText = data.sidebar_counts.total_pos;

                const bAsn = document.getElementById('badge-asn-count');
                if (bAsn) bAsn.innerText = data.sidebar_counts.total_asns;

                const bShip = document.getElementById('badge-shipments-count');
                if (bShip) bShip.innerText = data.sidebar_counts.dispatched_asns;

                const bInv = document.getElementById('badge-invoices-count');
                if (bInv) bInv.innerText = data.total_invoices;
            }

            const elLastUpdated = document.getElementById('qs-last-updated-text');
            if (elLastUpdated) elLastUpdated.innerText = 'Just now';
        })
        .catch(err => {
            console.warn('[DashboardSync] Real-time fetch skipped:', err);
        })
        .finally(() => {
            isFetching = false;
            if (refreshBtn && isUserClick) {
                setTimeout(() => {
                    refreshBtn.classList.remove('spinning');
                    refreshBtn.querySelector('i')?.style?.removeProperty('transform');
                    refreshBtn.querySelector('i')?.style?.removeProperty('transition');
                }, 300);
            }
        });
    };

    // ── 3. Cross-Tab & Cross-Module Real-Time Broadcast Listeners ───────────
    try {
        if (window.BroadcastChannel) {
            const bc = new BroadcastChannel('infypos_realtime_bus');
            bc.onmessage = function(event) {
                if (event && event.data) {
                    window.refreshDashboardRealtime();
                }
            };
        }
    } catch(e) {}

    // Storage Event Listener (triggers on localStorage write across tabs)
    window.addEventListener('storage', function(e) {
        if (e.key === 'infypos_sync_pulse' || e.key === 'infypos_realtime_event' || e.key === 'infy_purchase_sync') {
            window.refreshDashboardRealtime();
        }
    });

    // Custom App Events
    document.addEventListener('infy:pos-changed', () => window.refreshDashboardRealtime());
    document.addEventListener('infy:asns-changed', () => window.refreshDashboardRealtime());
    document.addEventListener('infy:cartons-changed', () => window.refreshDashboardRealtime());

    // When tab becomes visible again, instantly re-sync
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') {
            window.refreshDashboardRealtime();
        }
    });
});
</script>
@endsection
