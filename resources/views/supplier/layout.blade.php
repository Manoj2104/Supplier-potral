<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <title>@yield('title', 'Dashboard') — INFY-POS Supplier Portal</title>
  <meta name="description" content="INFY-POS Enterprise Supplier Portal">

  <!-- Fonts & Local Styles (Zero External Blocking) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800;900&display=swap" media="print" onload="this.media='all'">
  <link rel="stylesheet" href="{{ asset('css/bootstrap.min.css') }}">
  <link rel="stylesheet" href="{{ asset('css/bootstrap-icons.css') }}">
  <link rel="stylesheet" href="{{ asset('css/supplier-portal.css') }}">
  <script src="{{ asset('js/bootstrap.bundle.min.js') }}" defer></script>

  @php
    $portal = request()->supplier_portal;
    $supId = $portal ? $portal->supplier_id : 1;
    $supplierInfo = ($portal && $portal->supplier) ? $portal->supplier : (\App\Models\Supplier::find($supId) ?? (object)[
        'name' => 'Jeyachandran Textile Private Limited',
        'email' => 'manoj2104s@gmail.com',
        'phone' => '+918610006544',
        'city' => 'Chennai',
        'country' => 'India',
    ]);
    $companyName = $supplierInfo->name ?? 'Jeyachandran Textile Private Limited';
    // Fast SQL Aggregates for layout badges & spotlight
    $poStats = \App\Models\Purchase::where('supplier_id', $supId)
        ->selectRaw("COUNT(*) as total_pos, COUNT(CASE WHEN status IN (0, 2, 3) AND (notes IS NULL OR notes NOT LIKE '%REJECTED%') THEN 1 END) as pending_pos")
        ->first();
        
    $asnStats = \App\Models\SupplierAsn::where('supplier_id', $supId)
        ->selectRaw("COUNT(*) as total_asns, COUNT(CASE WHEN status IN ('dispatched', 'in_transit', 'out_for_delivery', 'arrived', 'receiving', 'putaway_completed') THEN 1 END) as dispatched, COUNT(CASE WHEN invoice_number IS NOT NULL AND invoice_number != '' THEN 1 END) as invoices")
        ->first();

    $livePosCount = (int)($poStats->total_pos ?? 0);
    $livePendingPos = (int)($poStats->pending_pos ?? 0);
    $liveAsnsCount = (int)($asnStats->total_asns ?? 0);
    $liveDispatchedCount = (int)($asnStats->dispatched ?? 0);
    $liveInvoicesCount = (int)($asnStats->invoices ?? 0);
    if ($liveInvoicesCount === 0) { $liveInvoicesCount = $liveAsnsCount; }

    $recentNotifs = \App\Models\SupplierNotification::where('supplier_id', $supId)->latest('id')->limit(5)->get();
    $liveNotifs = \App\Models\SupplierNotification::where('supplier_id', $supId)->where('is_read', false)->count();

    // Check if supplier is currently using the default password
    $isDefaultPassword = false;
    if ($portal) {
        $rawPhone = $portal->phone ?? ($supplierInfo->phone ?? '');
        $cleanPhone = preg_replace('/[^0-9]/', '', $rawPhone);
        $last10Phone = strlen($cleanPhone) >= 10 ? substr($cleanPhone, -10) : $cleanPhone;
        if (
            $portal->checkPassword($rawPhone) ||
            (!empty($cleanPhone) && $portal->checkPassword($cleanPhone)) ||
            (!empty($last10Phone) && $portal->checkPassword($last10Phone)) ||
            $portal->checkPassword('12345678') ||
            $portal->checkPassword('admin123') ||
            $portal->checkPassword('password')
        ) {
            $isDefaultPassword = true;
        }
    }

    // Build Search Index for Global Spotlight
    $globalSearchData = [
      ['category' => 'Navigation', 'title' => 'Dashboard Overview', 'subtitle' => 'Live analytics, summary KPIs & graphs', 'url' => route('supplier.dashboard'), 'icon' => 'bi-grid'],
      ['category' => 'Navigation', 'title' => 'Purchase Orders List', 'subtitle' => $livePosCount . ' Total Purchase Orders', 'url' => route('supplier.purchase-orders.index'), 'icon' => 'bi-clipboard-check'],
      ['category' => 'Navigation', 'title' => 'My Approvals', 'subtitle' => $livePendingPos . ' POs pending approval/acceptance', 'url' => route('supplier.my-approvals'), 'icon' => 'bi-check2-circle'],
      ['category' => 'Navigation', 'title' => 'Advance Shipping Notices (ASN)', 'subtitle' => $liveAsnsCount . ' Total ASNs dispatched', 'url' => route('supplier.asn.index'), 'icon' => 'bi-truck'],
      ['category' => 'Navigation', 'title' => 'Cartons & LPN Barcode Hub', 'subtitle' => '4x6 thermal labels, GS1-128 packing', 'url' => route('supplier.cartons.index'), 'icon' => 'bi-boxes'],
      ['category' => 'Navigation', 'title' => 'Shipments Tracking', 'subtitle' => 'Vehicle telemetry & real-time delivery', 'url' => route('supplier.shipments'), 'icon' => 'bi-send'],
      ['category' => 'Navigation', 'title' => 'Invoices & Documents', 'subtitle' => 'Tax invoices, packing slips, e-Way bills', 'url' => route('supplier.invoices'), 'icon' => 'bi-receipt'],
      ['category' => 'Navigation', 'title' => 'Payment Settlements', 'subtitle' => 'Bank receipts & statement summaries', 'url' => route('supplier.payments'), 'icon' => 'bi-credit-card'],
      ['category' => 'Navigation', 'title' => 'Purchase Returns', 'subtitle' => 'RMA claims & defect management', 'url' => route('supplier.returns'), 'icon' => 'bi-arrow-return-left'],
      ['category' => 'Navigation', 'title' => 'My Profile & Company Settings', 'subtitle' => 'GSTIN, PAN, bank accounts & security', 'url' => route('supplier.profile'), 'icon' => 'bi-person'],
    ];

    $spotlightPos = \App\Models\Purchase::where('supplier_id', $supId)->latest('id')->limit(6)->get(['id', 'reference_code', 'grand_total', 'status']);
    foreach($spotlightPos as $po) {
      $poCode = $po->reference_code ?: ('PO-2026-' . str_pad($po->id, 6, '0', STR_PAD_LEFT));
      $globalSearchData[] = [
        'category' => 'Purchase Orders',
        'title' => $poCode,
        'subtitle' => 'Grand Total: ₹' . number_format($po->grand_total, 2) . ' • Status: ' . ucfirst($po->status),
        'url' => route('supplier.purchase-orders.show', $po->id),
        'icon' => 'bi-file-earmark-text',
      ];
    }

    $spotlightAsns = \App\Models\SupplierAsn::where('supplier_id', $supId)->latest('id')->limit(6)->get(['id', 'asn_number', 'status', 'driver_name']);
    foreach($spotlightAsns as $asn) {
      $asnCode = $asn->asn_number ?: ('ASN-2026-' . str_pad($asn->id, 5, '0', STR_PAD_LEFT));
      $globalSearchData[] = [
        'category' => 'ASN Dispatch',
        'title' => $asnCode,
        'subtitle' => 'Status: ' . ucfirst(str_replace('_', ' ', $asn->status)) . ' • Transport: ' . ($asn->driver_name ? $asn->driver_name : 'Standard Logistics'),
        'url' => route('supplier.asn.show', $asn->id),
        'icon' => 'bi-truck',
      ];
    }
  @endphp

  <style>
  :root {
    --sp-sidebar-width: 280px;
    --sp-sidebar-collapsed-width: 88px;
    --sp-header-h: 68px;
  }
  
  body.sp-body {
    background: #F4F6F9;
    color: #1E293B;
    font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    margin: 0;
    padding: 0;
  }

  /* Enterprise Sidebar */
  .sp-sidebar-v2 {
    position: fixed; top: 0; left: 0;
    width: var(--sp-sidebar-width);
    height: 100vh;
    background: #FFFFFF;
    border-right: 1px solid #E5E7EB;
    display: flex; flex-direction: column;
    z-index: 1000;
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-sizing: border-box;
  }
  
  .sp-sidebar-v2.collapsed {
    width: var(--sp-sidebar-collapsed-width);
  }

  .sp-logo-v2 {
    padding: 16px 20px;
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 1px solid #E5E7EB;
    height: var(--sp-header-h);
    box-sizing: border-box;
  }
  .sp-logo-brand {
    display: flex; align-items: center; gap: 10px;
    overflow: hidden;
    white-space: nowrap;
  }
  .sp-logo-text-v2 { font-size: 17px; font-weight: 900; color: #0F172A; line-height: 1.1; letter-spacing: -0.5px; }
  .sp-logo-sub-v2 { font-size: 9.5px; color: #10B981; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 1px; }

  .sp-nav-v2 {
    padding: 12px 14px;
    flex: 1;
    overflow-y: auto;
  }
  .sp-nav-v2::-webkit-scrollbar { width: 4px; }
  .sp-nav-v2::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }

  /* Group Titles */
  .sp-nav-group-title {
    font-size: 10px;
    font-weight: 800;
    color: #94A3B8;
    letter-spacing: 1px;
    text-transform: uppercase;
    padding: 14px 12px 4px 12px;
    transition: opacity 0.2s ease;
  }
  .sp-sidebar-v2.collapsed .sp-nav-group-title {
    display: none;
  }  /* Nav Items */
  .sp-nav-item-v2 {
    display: flex; align-items: center; gap: 14px;
    padding: 10px 16px;
    border-radius: 12px;
    color: #334155;
    font-size: 13.5px; font-weight: 600;
    text-decoration: none;
    margin-bottom: 4px;
    transition: all 0.15s ease;
    white-space: nowrap;
    position: relative;
  }
  .sp-nav-item-v2:hover { background: #F8FAFC; color: #0F172A; }
  .sp-nav-item-v2.active {
    background: #DCFCE7 !important;
    color: #15803D !important;
    font-weight: 800 !important;
    border-left: 4px solid #16A34A !important;
    border-radius: 0 14px 14px 0 !important;
    margin-left: -14px !important;
    padding-left: 24px !important;
  }
  .sp-nav-item-v2 .icon { font-size: 18px; color: #64748B; width: 22px; text-align: center; display: inline-flex; align-items: center; justify-content: center; }
  .sp-nav-item-v2.active .icon { color: #16A34A !important; }

  .sp-nav-text {
    flex: 1;
    transition: opacity 0.2s ease;
  }
  .sp-sidebar-v2.collapsed .sp-nav-text {
    display: none;
  }

  .sp-nav-badge-v2 {
    font-size: 10.5px; font-weight: 800;
    padding: 2px 7px; border-radius: 10px;
    background: #DCFCE7; color: #059669;
    transition: opacity 0.2s ease;
  }
  .sp-sidebar-v2.collapsed .sp-nav-badge-v2 {
    display: none;
  }

  /* User Card Bottom */
  .sp-user-card-v2 {
    margin: 12px;
    padding: 12px 14px;
    background: #F8FAFC;
    border: 1px solid #E5E7EB;
    border-radius: 12px;
    transition: all 0.2s ease;
  }
  .sp-sidebar-v2.collapsed .sp-user-card-details {
    display: none;
  }

  /* Header */
  .sp-header-v2 {
    position: fixed; top: 0; left: var(--sp-sidebar-width); right: 0;
    height: var(--sp-header-h);
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-bottom: 1px solid #E5E7EB;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 28px;
    z-index: 900;
    transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-sizing: border-box;
    box-shadow: 0 1px 4px rgba(15, 23, 42, 0.02);
  }
  .sp-header-v2.collapsed {
    left: var(--sp-sidebar-collapsed-width);
  }

  .sp-header-search-v2 {
    display: flex; align-items: center; gap: 10px;
    background: #F8FAFC; border: 1px solid #E2E8F0;
    border-radius: 12px; padding: 0 14px; height: 42px;
    width: 460px; box-shadow: inset 0 1px 2px rgba(0,0,0,0.02);
    transition: all 0.2s ease;
  }
  .sp-header-search-v2:focus-within {
    border-color: #16A34A;
    background: #FFFFFF;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
  }
  .sp-header-search-v2 input {
    border: none; background: none; outline: none;
    font-size: 13px; font-weight: 500; color: #0F172A; flex: 1; min-width: 0;
  }

  .sp-header-right-v2 {
    display: flex; align-items: center; gap: 10px;
  }
  .sp-icon-badge-btn {
    width: 40px; height: 40px; border-radius: 10px;
    background: #F8FAFC; border: 1px solid #E2E8F0;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; color: #475569; position: relative; cursor: pointer;
    transition: all 0.15s ease;
  }
  .sp-icon-badge-btn:hover {
    background: #F1F5F9;
    color: #0F172A;
    border-color: #CBD5E1;
    transform: translateY(-1px);
  }
  .sp-icon-badge-num {
    position: absolute; top: -5px; right: -5px;
    background: #10B981; color: #fff;
    font-size: 9.5px; font-weight: 800;
    padding: 1px 5.5px; border-radius: 10px; border: 1.5px solid #fff;
    box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
  }

  /* Header User Profile Pill */
  .sp-header-user-v2 {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    padding: 5px 14px 5px 6px;
    border-radius: 9999px;
    border: 1px solid #E2E8F0;
    background: #FFFFFF;
    transition: all 0.18s ease;
    user-select: none;
    box-shadow: 0 1px 3px rgba(0,0,0,0.03);
  }
  .sp-header-user-v2:hover {
    background: #F8FAFC;
    border-color: #CBD5E1;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
    transform: translateY(-1px);
  }
  .sp-header-user-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, #15803D 0%, #16A34A 100%);
    color: #FFFFFF;
    font-size: 13px;
    font-weight: 900;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 2px 6px rgba(22, 163, 74, 0.28);
    overflow: hidden;
  }
  .sp-header-user-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .sp-header-user-name {
    font-size: 13px;
    font-weight: 800;
    color: #0F172A;
    line-height: 1.2;
  }
  .sp-header-user-role {
    font-size: 10.5px;
    color: #15803D;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 1px;
  }

  /* Spotlight Command Palette */
  .sp-spotlight-backdrop {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(15, 23, 42, 0.5);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    z-index: 2000;
    display: none;
    align-items: flex-start;
    justify-content: center;
    padding-top: 90px;
    animation: spFadeIn 0.15s ease-out;
  }
  .sp-spotlight-backdrop.show {
    display: flex;
  }
  @keyframes spFadeIn {
    from { opacity: 0; transform: scale(0.98); }
    to { opacity: 1; transform: scale(1); }
  }
  .sp-spotlight-box {
    width: 620px;
    max-width: 92vw;
    background: #FFFFFF;
    border-radius: 20px;
    box-shadow: 0 25px 60px rgba(15, 23, 42, 0.28), 0 0 0 1px rgba(15, 23, 42, 0.08);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .sp-spotlight-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    border-bottom: 1px solid #E2E8F0;
    background: #FFFFFF;
  }
  .sp-spotlight-header i {
    font-size: 20px;
    color: #15803D;
  }
  .sp-spotlight-input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 15px;
    font-weight: 600;
    color: #0F172A;
    background: transparent;
  }
  .sp-spotlight-results {
    max-height: 380px;
    overflow-y: auto;
    padding: 10px;
  }
  .sp-spotlight-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    border-radius: 12px;
    text-decoration: none;
    color: #0F172A;
    transition: all 0.12s ease;
    cursor: pointer;
  }
  .sp-spotlight-item:hover, .sp-spotlight-item.active {
    background: #F0FDF4;
    color: #15803D;
  }
  .sp-spotlight-item .sp-item-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    color: #64748B;
    flex-shrink: 0;
  }
  .sp-spotlight-item:hover .sp-item-icon {
    background: #DCFCE7;
    color: #15803D;
    border-color: #86EFAC;
  }
  .sp-spotlight-footer {
    padding: 10px 18px;
    background: #F8FAFC;
    border-top: 1px solid #E2E8F0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 11.5px;
    color: #64748B;
    font-weight: 600;
  }

  /* Luxury Dropdowns */
  .sp-dropdown-menu-lux {
    border-radius: 18px !important;
    border: 1px solid #E2E8F0 !important;
    background: #FFFFFF !important;
    box-shadow: 0 16px 40px rgba(15, 23, 42, 0.14) !important;
    padding: 12px !important;
    animation: spDropdownFade 0.18s ease-out;
  }
  @keyframes spDropdownFade {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* App Launcher Grid */
  .sp-app-launcher-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    width: 290px;
  }
  .sp-app-tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 12px 6px;
    border-radius: 12px;
    text-decoration: none;
    color: #334155;
    transition: all 0.15s ease;
  }
  .sp-app-tile:hover {
    background: #F8FAFC;
    color: #15803D;
    transform: translateY(-2px);
  }
  .sp-app-tile-icon {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 17px;
    margin-bottom: 6px;
  }
  .sp-app-tile-name {
    font-size: 11.5px;
    font-weight: 700;
    text-align: center;
  }

  /* Notification Items */
  .sp-notif-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 12px;
    text-decoration: none;
    transition: background 0.12s ease;
    border-bottom: 1px solid #F1F5F9;
  }
  .sp-notif-row:last-child {
    border-bottom: none;
  }
  .sp-notif-row:hover {
    background: #F8FAFC;
  }
  .sp-notif-row.unread {
    background: #F0FDF4;
  }

  /* Main Viewport Container */
  .sp-main-v2 {
    margin-left: var(--sp-sidebar-width);
    margin-top: var(--sp-header-h);
    padding: 24px 28px 60px 28px;
    min-height: calc(100vh - var(--sp-header-h));
    transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-sizing: border-box;
  }
  .sp-main-v2.collapsed {
    margin-left: var(--sp-sidebar-collapsed-width);
  }

  /* Alert Toast Overlay */
  .sp-toast-container {
    position: fixed;
    top: calc(var(--sp-header-h) + 16px);
    right: 24px;
    z-index: 1100;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .sp-toast {
    padding: 12px 18px;
    border-radius: 10px;
    background: #FFFFFF;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
    border: 1px solid #E2E8F0;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    font-weight: 600;
    color: #0F172A;
    animation: spSlideInRight 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .sp-toast.success { border-left: 4px solid #10B981; }
  .sp-toast.error   { border-left: 4px solid #EF4444; }

  @keyframes spSlideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to   { transform: translateX(0); opacity: 1; }
  }

  @keyframes spModalPop {
    from { opacity: 0; transform: scale(0.94) translateY(8px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
</style>
@yield('head')
</head>
<body class="sp-body">

<div class="sp-layout">

  <!-- Enterprise Supplier Portal Sidebar -->
  <aside class="sp-sidebar-v2" id="sp-sidebar">

    <!-- Logo & Hamburger Toggle -->
    <div class="sp-logo-v2">
      <div class="sp-logo-brand">
        <div style="width:36px; height:36px; border-radius:10px; background:linear-gradient(135deg, #15803D 0%, #16A34A 100%); color:#FFFFFF; display:flex; align-items:center; justify-content:center; font-size:15px; font-weight:900; flex-shrink:0; box-shadow:0 2px 6px rgba(22, 163, 74, 0.3);">
          @if(!empty($portal->company_logo))
            <img src="{{ asset('storage/'.$portal->company_logo) }}" alt="Logo" style="width:100%; height:100%; object-fit:cover; border-radius:10px;">
          @else
            {{ strtoupper(substr($companyName, 0, 2)) }}
          @endif
        </div>
        <div style="min-width:0; overflow:hidden;">
          <div class="sp-logo-text-v2" style="font-size:13.5px; font-weight:800; color:#0F172A; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:155px; line-height:1.2;" title="{{ $companyName }}">
            {{ $companyName }}
          </div>
          <div class="sp-logo-sub-v2" style="font-size:9.5px; color:#15803D; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; margin-top:2px;">
            {{ $portal->supplier_code ?? 'SUP-000145' }}
          </div>
        </div>
      </div>
      <button id="sp-hamburger" style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:8px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:16px;cursor:pointer;color:#64748B; flex-shrink:0;" title="Toggle Sidebar">
        <i class="bi bi-list"></i>
      </button>
    </div>

    <!-- Search Modules Input (Ref Image 2 Match) -->
    <div style="padding: 14px 14px 10px;">
      <div style="display:flex;align-items:center;gap:8px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:8px 12px;">
        <i class="bi bi-search" style="color:#94A3B8;font-size:13px;"></i>
        <input type="text" placeholder="Search modules..." style="border:none;background:none;outline:none;font-size:13px;color:#1E293B;width:100%;">
      </div>
    </div>

    <!-- Navigation List (Clean Flat List Matching Ref Image 2) -->
    <nav class="sp-nav-v2">

      <a href="{{ route('supplier.dashboard') }}" class="sp-nav-item-v2 {{ request()->routeIs('supplier.dashboard') ? 'active' : '' }}" title="Dashboard">
        <i class="bi bi-grid icon"></i>
        <span class="sp-nav-text">Dashboard</span>
      </a>

      <a href="{{ route('supplier.purchase-orders.index') }}" class="sp-nav-item-v2 {{ request()->routeIs('supplier.purchase-orders.*') ? 'active' : '' }}" title="Purchase Orders">
        <i class="bi bi-clipboard-check icon"></i>
        <span class="sp-nav-text">Purchase Orders</span>
        <span class="sp-nav-badge-v2" id="badge-po-count">{{ $livePosCount }}</span>
      </a>

      <a href="{{ route('supplier.my-approvals') }}" class="sp-nav-item-v2 {{ request()->routeIs('supplier.my-approvals*') ? 'active' : '' }}" title="My Approvals">
        <i class="bi bi-check2-circle icon"></i>
        <span class="sp-nav-text">My Approvals</span>
        @if($livePendingPos > 0)
        <span class="sp-nav-badge-v2" id="badge-approvals" style="background:#FEF3C7;color:#B45309;">{{ $livePendingPos }}</span>
        @endif
      </a>

      <a href="{{ route('supplier.asn.index') }}" class="sp-nav-item-v2 {{ request()->routeIs('supplier.asn.*') ? 'active' : '' }}" title="ASN Dispatch">
        <i class="bi bi-truck icon"></i>
        <span class="sp-nav-text">ASN Dispatch</span>
        <span class="sp-nav-badge-v2" id="badge-asn-count">{{ $liveAsnsCount }}</span>
      </a>

      <a href="{{ route('supplier.cartons.index') }}" class="sp-nav-item-v2 {{ request()->routeIs('supplier.cartons*') ? 'active' : '' }}" title="Cartons (LPN)">
        <i class="bi bi-boxes icon"></i>
        <span class="sp-nav-text">Cartons (LPN)</span>
      </a>

      <a href="{{ route('supplier.shipments') }}" class="sp-nav-item-v2 {{ request()->routeIs('supplier.shipments*') ? 'active' : '' }}" title="Shipments">
        <i class="bi bi-send icon"></i>
        <span class="sp-nav-text">Shipments</span>
        <span class="sp-nav-badge-v2" id="badge-shipments-count">{{ $liveDispatchedCount }}</span>
      </a>

      <a href="{{ route('supplier.invoices') }}" class="sp-nav-item-v2 {{ request()->routeIs('supplier.invoices*') && !request()->has('tab') ? 'active' : '' }}" title="Invoices">
        <i class="bi bi-receipt icon"></i>
        <span class="sp-nav-text">Invoices</span>
        <span class="sp-nav-badge-v2" id="badge-invoices-count">{{ $liveInvoicesCount }}</span>
      </a>

      <a href="{{ route('supplier.payments') }}" class="sp-nav-item-v2 {{ request()->routeIs('supplier.payments*') ? 'active' : '' }}" title="Payments">
        <i class="bi bi-credit-card icon"></i>
        <span class="sp-nav-text">Payments</span>
      </a>

      <a href="{{ route('supplier.returns') }}" class="sp-nav-item-v2 {{ request()->routeIs('supplier.returns*') ? 'active' : '' }}" title="Purchase Returns">
        <i class="bi bi-arrow-return-left icon"></i>
        <span class="sp-nav-text">Purchase Returns</span>
      </a>

      <a href="{{ route('supplier.notifications') }}" class="sp-nav-item-v2 {{ request()->routeIs('supplier.notifications*') ? 'active' : '' }}" title="Notifications">
        <i class="bi bi-bell icon"></i>
        <span class="sp-nav-text">Notifications</span>
        <span class="sp-nav-badge-v2" id="badge-notifs-count">{{ $liveNotifs }}</span>
      </a>

      <a href="{{ route('supplier.profile') }}" class="sp-nav-item-v2 {{ request()->routeIs('supplier.profile') ? 'active' : '' }}" title="Profile">
        <i class="bi bi-person icon"></i>
        <span class="sp-nav-text">Profile</span>
      </a>

      <form action="{{ route('supplier.logout') }}" method="POST">
        @csrf
        <button type="submit" class="sp-nav-item-v2" style="width:100%;border:none;background:none;cursor:pointer;text-align:left;outline:none;" title="Logout">
          <i class="bi bi-box-arrow-right icon"></i>
          <span class="sp-nav-text">Logout</span>
        </button>
      </form>

    </nav>

    <!-- User Profile Card -->
    <div class="sp-user-card-v2">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
        <span class="sp-nav-badge-v2">🟢 Verified Supplier</span>
        <span style="font-size: 11px; color: #F59E0B;">⭐⭐⭐⭐⭐</span>
      </div>
      <div class="sp-user-card-details" style="font-size: 12px;">
        <strong style="color: #0F172A; display: block; font-size: 12.5px; line-height: 1.2; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="{{ $companyName }}">{{ $companyName }}</strong>
        <div style="font-size: 10.5px; color: #64748B; margin-top: 3px;">ID: <strong>{{ $portal->supplier_code ?? 'SUP-000145' }}</strong> • Main Warehouse</div>
      </div>
    </div>

  </aside>

  <!-- Header & Content Layout Wrapper -->
  <div style="flex:1; min-width:0; max-width:100%; overflow-x:hidden;">

    <!-- Top Header -->
    <header class="sp-header-v2" id="sp-header">
      <!-- Left: Global Spotlight Search Trigger -->
      <div style="display: flex; align-items: center; gap: 14px;">
        <div class="sp-header-search-v2" onclick="openSpotlightModal()" style="cursor:pointer;" title="Click or press Ctrl + K to search">
          <i class="bi bi-search" style="color:#15803D;font-size:14px;"></i>
          <input type="text" id="headerSearchTriggerInput" placeholder="Search purchase orders, ASNs, cartons, invoices, SKUs..." readonly style="cursor:pointer;">
          <span style="font-size:10px;color:#15803D;background:#DCFCE7;border:1px solid #86EFAC;padding:2px 7px;border-radius:6px;font-family:monospace;font-weight:800;">Ctrl + K</span>
        </div>
      </div>

      <!-- Right Header Actions -->
      <div class="sp-header-right-v2">

        <!-- 1. Apps & Quick Launch Launcher -->
        <div class="dropdown">
          <div class="sp-icon-badge-btn" data-bs-toggle="dropdown" aria-expanded="false" title="Apps & Modules">
            <i class="bi bi-grid-3x3-gap"></i>
          </div>
          <div class="dropdown-menu dropdown-menu-end sp-dropdown-menu-lux" style="width:310px;">
            <div style="padding:4px 8px 10px 8px; border-bottom:1px solid #F1F5F9; font-size:13px; font-weight:800; color:#0F172A; display:flex; justify-content:space-between; align-items:center;">
              <span>⚡ Quick Module Launch</span>
              <span style="font-size:11px; color:#15803D; font-weight:700;">Suguna Portal</span>
            </div>
            <div class="sp-app-launcher-grid" style="padding-top:10px;">
              <a href="{{ route('supplier.dashboard') }}" class="sp-app-tile">
                <div class="sp-app-tile-icon" style="background:#DCFCE7; color:#15803D;"><i class="bi bi-grid"></i></div>
                <span class="sp-app-tile-name">Dashboard</span>
              </a>
              <a href="{{ route('supplier.purchase-orders.index') }}" class="sp-app-tile">
                <div class="sp-app-tile-icon" style="background:#EFF6FF; color:#1D4ED8;"><i class="bi bi-clipboard-check"></i></div>
                <span class="sp-app-tile-name">Purchase Orders</span>
              </a>
              <a href="{{ route('supplier.asn.index') }}" class="sp-app-tile">
                <div class="sp-app-tile-icon" style="background:#FEF3C7; color:#B45309;"><i class="bi bi-truck"></i></div>
                <span class="sp-app-tile-name">ASN Dispatch</span>
              </a>
              <a href="{{ route('supplier.cartons.index') }}" class="sp-app-tile">
                <div class="sp-app-tile-icon" style="background:#FAF5FF; color:#7E22CE;"><i class="bi bi-boxes"></i></div>
                <span class="sp-app-tile-name">Cartons (LPN)</span>
              </a>
              <a href="{{ route('supplier.shipments') }}" class="sp-app-tile">
                <div class="sp-app-tile-icon" style="background:#ECFDF5; color:#059669;"><i class="bi bi-send"></i></div>
                <span class="sp-app-tile-name">Shipments</span>
              </a>
              <a href="{{ route('supplier.invoices') }}" class="sp-app-tile">
                <div class="sp-app-tile-icon" style="background:#EFF6FF; color:#2563EB;"><i class="bi bi-receipt"></i></div>
                <span class="sp-app-tile-name">Invoices</span>
              </a>
              <a href="{{ route('supplier.payments') }}" class="sp-app-tile">
                <div class="sp-app-tile-icon" style="background:#FEF2F2; color:#DC2626;"><i class="bi bi-credit-card"></i></div>
                <span class="sp-app-tile-name">Payments</span>
              </a>
              <a href="{{ route('supplier.returns') }}" class="sp-app-tile">
                <div class="sp-app-tile-icon" style="background:#FFFBEB; color:#D97706;"><i class="bi bi-arrow-return-left"></i></div>
                <span class="sp-app-tile-name">Returns</span>
              </a>
              <a href="{{ route('supplier.profile') }}" class="sp-app-tile">
                <div class="sp-app-tile-icon" style="background:#F1F5F9; color:#475569;"><i class="bi bi-gear"></i></div>
                <span class="sp-app-tile-name">Settings</span>
              </a>
            </div>
          </div>
        </div>

        <!-- 2. Direct Messages Dropdown -->
        <div class="dropdown">
          <div class="sp-icon-badge-btn" data-bs-toggle="dropdown" aria-expanded="false" title="Messages & Support">
            <i class="bi bi-envelope"></i>
            <span class="sp-icon-badge-num">2</span>
          </div>
          <div class="dropdown-menu dropdown-menu-end sp-dropdown-menu-lux" style="width:330px;">
            <div style="padding:4px 8px 10px 8px; border-bottom:1px solid #F1F5F9; display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:13px; font-weight:800; color:#0F172A;">💬 Buyer Inquiries</span>
              <span style="font-size:11px; background:#DCFCE7; color:#15803D; font-weight:800; padding:2px 6px; border-radius:6px;">2 New</span>
            </div>
            <div style="padding:6px 0;">
              <div class="sp-notif-row unread" style="cursor:pointer;">
                <div style="width:34px; height:34px; border-radius:50%; background:#EFF6FF; color:#1D4ED8; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:13px; flex-shrink:0;">
                  WH
                </div>
                <div style="flex:1; min-width:0;">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong style="font-size:12.5px; color:#0F172A;">Suguna Central WH</strong>
                    <span style="font-size:10.5px; color:#94A3B8;">10m ago</span>
                  </div>
                  <div style="font-size:11.5px; color:#64748B; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Dock 4 ready for PU_1111 shipment arrival.</div>
                </div>
              </div>

              <div class="sp-notif-row unread" style="cursor:pointer;">
                <div style="width:34px; height:34px; border-radius:50%; background:#DCFCE7; color:#15803D; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:13px; flex-shrink:0;">
                  PO
                </div>
                <div style="flex:1; min-width:0;">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong style="font-size:12.5px; color:#0F172A;">Procurement Desk</strong>
                    <span style="font-size:10.5px; color:#94A3B8;">1h ago</span>
                  </div>
                  <div style="font-size:11.5px; color:#64748B; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">New Purchase Order issued for next week delivery.</div>
                </div>
              </div>
            </div>
            <div style="padding-top:8px; border-top:1px solid #F1F5F9; text-align:center;">
              <a href="{{ route('supplier.notifications') }}" style="font-size:12px; font-weight:700; color:#15803D; text-decoration:none;">Open Notification Center →</a>
            </div>
          </div>
        </div>

        <!-- 3. Notifications Dropdown -->
        <div class="dropdown">
          <div class="sp-icon-badge-btn" id="hdrNotifsBtn" data-bs-toggle="dropdown" aria-expanded="false" title="Notifications">
            <i class="bi bi-bell"></i>
            @if($liveNotifs > 0)
            <span class="sp-icon-badge-num" id="hdr-notifs-count">{{ $liveNotifs }}</span>
            @endif
          </div>
          <div class="dropdown-menu dropdown-menu-end sp-dropdown-menu-lux" style="width:350px;">
            <div style="padding:4px 8px 10px 8px; border-bottom:1px solid #F1F5F9; display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:13.5px; font-weight:800; color:#0F172A;">🔔 Notifications</span>
              <div style="display:flex; align-items:center; gap:8px;">
                <span class="sp-nav-badge-v2" id="notifDropdownBadge">{{ $liveNotifs }} Unread</span>
                <span onclick="markAllNotificationsAsRead(event)" style="font-size:11.5px; color:#15803D; font-weight:700; cursor:pointer; text-decoration:underline;">Mark all read</span>
              </div>
            </div>
            <div style="padding:6px 0; max-height:280px; overflow-y:auto;" id="hdrNotifsList">
              @forelse($recentNotifs as $notif)
              <a href="{{ route('supplier.notifications') }}" class="sp-notif-row {{ !$notif->is_read ? 'unread' : '' }}">
                <div style="width:34px; height:34px; border-radius:10px; background:#DCFCE7; color:#15803D; display:flex; align-items:center; justify-content:center; font-size:15px; flex-shrink:0;">
                  <i class="bi bi-bell-fill"></i>
                </div>
                <div style="flex:1; min-width:0;">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong style="font-size:12.5px; color:#0F172A;">{{ $notif->title }}</strong>
                    <span style="font-size:10px; color:#94A3B8;">{{ $notif->created_at->diffForHumans() }}</span>
                  </div>
                  <div style="font-size:11.5px; color:#64748B; line-height:1.3; margin-top:2px;">{{ $notif->message }}</div>
                </div>
              </a>
              @empty
              <div style="padding:20px; text-align:center; color:#94A3B8; font-size:12.5px;">
                <i class="bi bi-check-all" style="font-size:24px; color:#10B981; display:block; margin-bottom:4px;"></i>
                No unread notifications!
              </div>
              @endforelse
            </div>
            <div style="padding-top:8px; border-top:1px solid #F1F5F9; text-align:center;">
              <a href="{{ route('supplier.notifications') }}" style="font-size:12px; font-weight:700; color:#15803D; text-decoration:none;">View All Notifications ({{ $liveNotifs }}) →</a>
            </div>
          </div>
        </div>

        <!-- 4. Language Selector Dropdown -->
        <div class="dropdown">
          <div class="sp-icon-badge-btn" data-bs-toggle="dropdown" aria-expanded="false" style="width:auto; padding:0 12px; display:flex; gap:6px; font-size:12.5px; font-weight:700;" title="Change Language">
            <i class="bi bi-globe"></i>
            <span id="selectedLangText">EN</span>
            <i class="bi bi-chevron-down" style="font-size:10px; color:#94A3B8;"></i>
          </div>
          <ul class="dropdown-menu dropdown-menu-end sp-dropdown-menu-lux" style="min-width:160px;">
            <li><a class="dropdown-item rounded py-2 fw-semibold" href="#" onclick="selectLang('EN', 'English', event)"><i class="bi bi-check2 text-success me-2"></i> English (EN)</a></li>
            <li><a class="dropdown-item rounded py-2 fw-semibold" href="#" onclick="selectLang('TA', 'தமிழ்', event)"><i class="bi bi-globe me-2"></i> தமிழ் (TA)</a></li>
            <li><a class="dropdown-item rounded py-2 fw-semibold" href="#" onclick="selectLang('HI', 'हिन्दी', event)"><i class="bi bi-globe me-2"></i> हिन्दी (HI)</a></li>
          </ul>
        </div>

        <!-- 5. User Profile Dropdown -->
        <div class="dropdown">
          <div class="sp-header-user-v2" data-bs-toggle="dropdown" aria-expanded="false">
            @php
              $words = explode(' ', $companyName);
              $initials = '';
              if (count($words) >= 2) {
                  $initials = strtoupper(substr($words[0], 0, 1) . substr($words[1], 0, 1));
              } else {
                  $initials = strtoupper(substr($words[0] ?? 'JT', 0, 2));
              }
              $supShortName = (strlen($companyName) > 20) ? substr($companyName, 0, 20) . '...' : $companyName;
            @endphp
            <div class="sp-header-user-avatar">
              @if(!empty($portal->profile_image))
                <img src="{{ asset('storage/'.$portal->profile_image) }}" alt="Avatar">
              @else
                {{ $initials }}
              @endif
            </div>
            <div class="sp-header-user-text">
              <div class="sp-header-user-name" title="{{ $companyName }}">{{ $supShortName }}</div>
              <div class="sp-header-user-role">
                <span class="sp-online-dot"></span>
                <span>Verified Supplier</span>
              </div>
            </div>
            <i class="bi bi-chevron-down" style="color:#64748B;font-size:11px;margin-left:2px;"></i>
          </div>

          <ul class="dropdown-menu dropdown-menu-end sp-dropdown-menu-lux" style="min-width:250px;">
            <li class="px-3 py-2 border-bottom mb-1">
              <strong style="color:#0F172A; display:block; font-size:13px;">{{ $companyName }}</strong>
              <span style="font-size:11px; color:#15803D; font-weight:700;">ID: {{ $portal->supplier_code ?? 'SUP-000145' }} &bull; Main Warehouse</span>
            </li>
            <li><a class="dropdown-item rounded py-2 fw-semibold" href="{{ route('supplier.profile') }}"><i class="bi bi-person me-2" style="color:#15803D;"></i> View Profile</a></li>
            <li><a class="dropdown-item rounded py-2 fw-semibold" href="{{ route('supplier.profile') }}"><i class="bi bi-gear me-2" style="color:#2563EB;"></i> Account Settings</a></li>
            <li><a class="dropdown-item rounded py-2 fw-semibold" href="{{ route('supplier.notifications') }}"><i class="bi bi-bell me-2" style="color:#D97706;"></i> Notifications</a></li>
            <li><hr class="dropdown-divider my-1"></li>
            <li>
              <form action="{{ route('supplier.logout') }}" method="POST">
                @csrf
                <button type="submit" class="dropdown-item rounded py-2 fw-bold text-danger"><i class="bi bi-box-arrow-right me-2"></i> Logout</button>
              </form>
            </li>
          </ul>
        </div>

      </div>
    </header>

    <!-- ── 6. Global Search Spotlight Command Palette Modal ── -->
    <div class="sp-spotlight-backdrop" id="spSpotlightModal" onclick="closeSpotlightModalOnBackdrop(event)">
      <div class="sp-spotlight-box" onclick="event.stopPropagation()">
        <div class="sp-spotlight-header">
          <i class="bi bi-search"></i>
          <input type="text" id="spotlightSearchInput" class="sp-spotlight-input" placeholder="Search purchase orders, ASNs, cartons, invoices, SKUs, or modules..." oninput="handleSpotlightSearch(this.value)">
          <button onclick="closeSpotlightModal()" style="background:#F1F5F9; border:none; border-radius:8px; width:28px; height:28px; font-weight:700; color:#64748B; cursor:pointer;" title="Close">✕</button>
        </div>
        <div class="sp-spotlight-results" id="spotlightResultsList">
          <!-- Results injected dynamically -->
        </div>
        <div class="sp-spotlight-footer">
          <div><span style="font-family:monospace; background:#E2E8F0; padding:1px 5px; border-radius:4px;">↑ ↓</span> Navigate &nbsp; <span style="font-family:monospace; background:#E2E8F0; padding:1px 5px; border-radius:4px;">↵</span> Select &nbsp; <span style="font-family:monospace; background:#E2E8F0; padding:1px 5px; border-radius:4px;">ESC</span> Close</div>
          <span style="color:#15803D; font-weight:700;">⚡ Instant Search</span>
        </div>
      </div>
    </div>
    </header>

    <!-- Main View Area -->
    <main class="sp-main-v2" id="sp-main">
      @if(session('success'))
        <div class="sp-alert sp-alert-success" style="margin-bottom:16px; background:#DCFCE7; border:1px solid #86EFAC; color:#15803D; padding:10px 14px; border-radius:8px; font-weight:700;">✅ {{ session('success') }}</div>
        <script>
          (function() {
            try {
              var payload = {
                eventId: 'sp_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7),
                type: 'purchase',
                action: 'supplier_action',
                timestamp: Date.now()
              };
              if (window.BroadcastChannel) {
                var bc = new BroadcastChannel('infypos_realtime_bus');
                bc.postMessage(payload);
                bc.close();
              }
              localStorage.setItem('infypos_realtime_event', JSON.stringify(payload));
            } catch(e) {}
          })();
        </script>
      @endif
      @if(session('error'))
        <div class="sp-alert sp-alert-error" style="margin-bottom:16px; background:#FEE2E2; border:1px solid #FCA5A5; color:#B91C1C; padding:10px 14px; border-radius:8px; font-weight:700;">❌ {{ session('error') }}</div>
      @endif

      @if($isDefaultPassword)
        <!-- Top Security Notice: Change Default Password (Ref Image Match) -->
        <div class="sp-security-alert-banner" id="spSecurityBanner" style="display:flex; align-items:center; justify-content:space-between; gap:16px; background:#FEF3C7; border:1.5px solid #FDE68A; border-radius:14px; padding:14px 22px; margin-bottom:20px; box-shadow:0 2px 10px rgba(217, 119, 6, 0.08); flex-wrap:wrap;">
          <div style="display:flex; align-items:center; gap:12px; font-size:13.5px; font-weight:600; color:#92400E; flex:1; min-width:280px;">
            <i class="bi bi-exclamation-triangle-fill" style="color:#D97706; font-size:18px; flex-shrink:0;"></i>
            <span>Your account for <strong>{{ $companyName }}</strong> is currently using the default password. Please update your password now to secure your account.</span>
          </div>
          <div style="display:flex; align-items:center; gap:10px; flex-shrink:0;">
            <button type="button" onclick="openChangePasswordModal()" style="background:#D97706; color:#FFFFFF; font-weight:700; font-size:13px; padding:8px 22px; border-radius:8px; border:none; cursor:pointer; display:inline-flex; align-items:center; gap:6px; transition:all 180ms ease; box-shadow:0 2px 8px rgba(217, 119, 6, 0.25); white-space:nowrap;" onmouseover="this.style.background='#B45309'; this.style.transform='translateY(-1px)';" onmouseout="this.style.background='#D97706'; this.style.transform='none';">
              Change Password &rarr;
            </button>
          </div>
        </div>
      @endif

      <div id="sp-real-content">
        @yield('content')
      </div>
    </main>

  </div>

</div>

<!-- ═══════════════════════════════════════════════════════════════════
     CHANGE PASSWORD CENTER POPUP MODAL (Modern, Fast & Accessible)
     ═══════════════════════════════════════════════════════════════════ -->
<div class="sp-modal-backdrop" id="spChangePasswordModal" onclick="closeChangePasswordModalOnBackdrop(event)" style="display:none; position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(15, 23, 42, 0.65); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); z-index:9999; align-items:center; justify-content:center; padding:16px;">
  <div class="sp-modal-card" onclick="event.stopPropagation()" style="background:#FFFFFF; border-radius:20px; width:460px; max-width:100%; box-shadow:0 25px 60px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.06); overflow:hidden; animation:spModalPop 0.2s cubic-bezier(0.16, 1, 0.3, 1);">
    
    <!-- Modal Header -->
    <div style="padding:22px 24px 18px; border-bottom:1px solid #F1F5F9; display:flex; align-items:flex-start; justify-content:space-between; gap:12px;">
      <div style="display:flex; align-items:center; gap:14px;">
        <div style="width:44px; height:44px; border-radius:12px; background:#FEF3C7; color:#D97706; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0;">
          <i class="bi bi-shield-lock-fill"></i>
        </div>
        <div>
          <h3 style="margin:0 0 3px 0; font-size:17px; font-weight:800; color:#0F172A;">Change Account Password</h3>
          <p style="margin:0; font-size:12.5px; color:#64748B;">Update your credentials to secure your supplier portal.</p>
        </div>
      </div>
      <button type="button" onclick="closeChangePasswordModal()" style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; width:32px; height:32px; display:flex; align-items:center; justify-content:center; color:#64748B; font-weight:700; cursor:pointer; font-size:14px; transition:all 0.15s ease;" onmouseover="this.style.background='#F1F5F9'; this.style.color='#0F172A';" onmouseout="this.style.background='#F8FAFC'; this.style.color='#64748B';">✕</button>
    </div>

    <!-- Alert Container for Errors / Success inside modal -->
    <div id="spModalAlertBox" style="display:none; margin:16px 24px 0 24px; padding:10px 14px; border-radius:10px; font-size:13px; font-weight:600;"></div>

    <!-- Modal Form -->
    <form id="spModalPasswordForm" onsubmit="handleModalPasswordSubmit(event)" style="padding:20px 24px 24px;">
      @csrf
      
      <!-- 1. Current Password -->
      <div style="margin-bottom:16px;">
        <label style="display:block; font-size:13px; font-weight:700; color:#334155; margin-bottom:6px;">
          Current Password <span style="color:#DC2626;">*</span>
        </label>
        <div style="position:relative; display:flex; align-items:center;">
          <i class="bi bi-key" style="position:absolute; left:14px; color:#94A3B8; font-size:16px; pointer-events:none;"></i>
          <input type="password" id="modalCurrentPassword" name="current_password" required placeholder="Enter current password" style="width:100%; height:44px; background:#F8FAFC; border:1.5px solid #E2E8F0; border-radius:10px; padding:0 40px 0 40px; font-size:13.5px; color:#0F172A; outline:none; transition:all 0.15s ease;" onfocus="this.style.borderColor='#D97706'; this.style.background='#FFFFFF';" onblur="this.style.borderColor='#E2E8F0'; this.style.background='#F8FAFC';">
          <button type="button" onclick="toggleModalPassVisibility('modalCurrentPassword', 'eyeCurrIcon')" style="position:absolute; right:10px; background:none; border:none; color:#94A3B8; cursor:pointer; font-size:15px; padding:4px;" title="Show/Hide">
            <i class="bi bi-eye" id="eyeCurrIcon"></i>
          </button>
        </div>
      </div>

      <!-- 2. New Password -->
      <div style="margin-bottom:16px;">
        <label style="display:block; font-size:13px; font-weight:700; color:#334155; margin-bottom:6px;">
          New Password <span style="color:#DC2626;">*</span>
        </label>
        <div style="position:relative; display:flex; align-items:center;">
          <i class="bi bi-lock" style="position:absolute; left:14px; color:#94A3B8; font-size:16px; pointer-events:none;"></i>
          <input type="password" id="modalNewPassword" name="password" minlength="8" required placeholder="Minimum 8 characters" style="width:100%; height:44px; background:#F8FAFC; border:1.5px solid #E2E8F0; border-radius:10px; padding:0 40px 0 40px; font-size:13.5px; color:#0F172A; outline:none; transition:all 0.15s ease;" onfocus="this.style.borderColor='#D97706'; this.style.background='#FFFFFF';" onblur="this.style.borderColor='#E2E8F0'; this.style.background='#F8FAFC';">
          <button type="button" onclick="toggleModalPassVisibility('modalNewPassword', 'eyeNewIcon')" style="position:absolute; right:10px; background:none; border:none; color:#94A3B8; cursor:pointer; font-size:15px; padding:4px;" title="Show/Hide">
            <i class="bi bi-eye" id="eyeNewIcon"></i>
          </button>
        </div>
        <span style="font-size:11.5px; color:#64748B; margin-top:4px; display:block;">Must be at least 8 characters long</span>
      </div>

      <!-- 3. Confirm New Password -->
      <div style="margin-bottom:22px;">
        <label style="display:block; font-size:13px; font-weight:700; color:#334155; margin-bottom:6px;">
          Confirm New Password <span style="color:#DC2626;">*</span>
        </label>
        <div style="position:relative; display:flex; align-items:center;">
          <i class="bi bi-lock-fill" style="position:absolute; left:14px; color:#94A3B8; font-size:16px; pointer-events:none;"></i>
          <input type="password" id="modalConfirmPassword" name="password_confirmation" minlength="8" required placeholder="Re-type new password" style="width:100%; height:44px; background:#F8FAFC; border:1.5px solid #E2E8F0; border-radius:10px; padding:0 40px 0 40px; font-size:13.5px; color:#0F172A; outline:none; transition:all 0.15s ease;" onfocus="this.style.borderColor='#D97706'; this.style.background='#FFFFFF';" onblur="this.style.borderColor='#E2E8F0'; this.style.background='#F8FAFC';">
          <button type="button" onclick="toggleModalPassVisibility('modalConfirmPassword', 'eyeConfIcon')" style="position:absolute; right:10px; background:none; border:none; color:#94A3B8; cursor:pointer; font-size:15px; padding:4px;" title="Show/Hide">
            <i class="bi bi-eye" id="eyeConfIcon"></i>
          </button>
        </div>
      </div>

      <!-- Buttons Row -->
      <div style="display:flex; align-items:center; justify-content:flex-end; gap:10px; border-top:1px solid #F1F5F9; padding-top:16px;">
        <button type="button" onclick="closeChangePasswordModal()" style="height:42px; padding:0 18px; border-radius:10px; border:1.5px solid #E2E8F0; background:#FFFFFF; color:#475569; font-weight:700; font-size:13px; cursor:pointer; transition:all 0.15s ease;" onmouseover="this.style.background='#F8FAFC';" onmouseout="this.style.background='#FFFFFF';">
          Cancel
        </button>
        <button type="submit" id="modalSubmitBtn" style="height:42px; padding:0 22px; border-radius:10px; border:none; background:#D97706; color:#FFFFFF; font-weight:700; font-size:13px; cursor:pointer; display:inline-flex; align-items:center; gap:8px; box-shadow:0 2px 8px rgba(217, 119, 6, 0.3); transition:all 0.15s ease;" onmouseover="this.style.background='#B45309';" onmouseout="this.style.background='#D97706';">
          <i class="bi bi-shield-check"></i> <span id="modalSubmitText">Update Password</span>
        </button>
      </div>

    </form>
  </div>
</div>

<!-- INFY-POS Enterprise Sync Engine + PDA Realtime Optimizer -->
<script src="{{ asset('js/infy-sync-engine.js') }}"></script>
<script src="{{ asset('js/infy-pda-realtime.js') }}"></script>

<script>
  // ── Global Search Index & Spotlight Palette ─────────────────────────────────
  const _globalSearchIndex = @json($globalSearchData ?? []);
  let _activeSpotlightIndex = 0;

  function openSpotlightModal() {
    const modal = document.getElementById('spSpotlightModal');
    const input = document.getElementById('spotlightSearchInput');
    if (!modal || !input) return;
    modal.classList.add('show');
    input.value = '';
    handleSpotlightSearch('');
    setTimeout(() => input.focus(), 50);
  }

  function closeSpotlightModal() {
    const modal = document.getElementById('spSpotlightModal');
    if (modal) modal.classList.remove('show');
  }

  function closeSpotlightModalOnBackdrop(e) {
    if (e.target.id === 'spSpotlightModal') {
      closeSpotlightModal();
    }
  }

  function handleSpotlightSearch(query) {
    const q = (query || '').toLowerCase().trim();
    const resultsContainer = document.getElementById('spotlightResultsList');
    if (!resultsContainer) return;

    const filtered = _globalSearchIndex.filter(item => {
      if (!q) return true;
      return item.title.toLowerCase().includes(q) ||
             item.subtitle.toLowerCase().includes(q) ||
             item.category.toLowerCase().includes(q);
    });

    if (filtered.length === 0) {
      resultsContainer.innerHTML = `
        <div style="padding:28px 14px; text-align:center; color:#94A3B8; font-size:13.5px;">
          <i class="bi bi-search" style="font-size:24px; color:#CBD5E1; display:block; margin-bottom:6px;"></i>
          No matching results found for "<strong style="color:#0F172A;">${query}</strong>"
        </div>
      `;
      return;
    }

    let html = '';
    filtered.slice(0, 8).forEach((item, idx) => {
      html += `
        <a href="${item.url}" class="sp-spotlight-item ${idx === 0 ? 'active' : ''}" data-idx="${idx}">
          <div class="sp-item-icon">
            <i class="bi ${item.icon}"></i>
          </div>
          <div style="flex:1; min-width:0;">
            <div style="display:flex; align-items:center; justify-content:space-between;">
              <strong style="font-size:13px; color:#0F172A;">${item.title}</strong>
              <span style="font-size:10.5px; font-weight:700; color:#64748B; background:#F1F5F9; padding:2px 6px; border-radius:6px;">${item.category}</span>
            </div>
            <div style="font-size:11.5px; color:#64748B; margin-top:2px;">${item.subtitle}</div>
          </div>
          <i class="bi bi-arrow-return-left" style="font-size:12px; color:#94A3B8;"></i>
        </a>
      `;
    });

    resultsContainer.innerHTML = html;
  }

  // Keyboard Navigation for Spotlight & Ctrl+K Hotkey
  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openSpotlightModal();
    }
    if (e.key === 'Escape') {
      closeSpotlightModal();
    }
  });

  // ── Mark All Notifications as Read ──────────────────────────────────────────
  function markAllNotificationsAsRead(e) {
    if (e) e.stopPropagation();
    fetch("{{ route('supplier.notifications.read') }}", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').getAttribute('content')
      },
      body: JSON.stringify({})
    }).then(res => res.json()).then(data => {
      const badge1 = document.getElementById('hdr-notifs-count');
      const badge2 = document.getElementById('badge-notifs-count');
      const dropBadge = document.getElementById('notifDropdownBadge');
      if (badge1) badge1.style.display = 'none';
      if (badge2) badge2.innerText = '0';
      if (dropBadge) dropBadge.innerText = '0 Unread';

      document.querySelectorAll('.sp-notif-row.unread').forEach(el => {
        el.classList.remove('unread');
      });
    }).catch(() => {});
  }

  // ── Language Selector ───────────────────────────────────────────────────────
  function selectLang(code, name, e) {
    if (e) e.preventDefault();
    const lbl = document.getElementById('selectedLangText');
    if (lbl) lbl.innerText = code;
  }

  // ── Sidebar toggle ──────────────────────────────────────────────────────────
  document.getElementById('sp-hamburger')?.addEventListener('click', () => {
    document.getElementById('sp-sidebar')?.classList.toggle('collapsed');
    document.getElementById('sp-header')?.classList.toggle('collapsed');
    document.getElementById('sp-main')?.classList.toggle('collapsed');
  });

  // ── Determine which modules to watch on this page ───────────────────────────
  const _pageModules = {
    watchCartons:  !!document.querySelector('[data-carton-id]'),
    watchAsns:     !!document.querySelector('[data-asn-id]'),
    watchPos:      !!document.querySelector('[data-po-row]'),
    watchShipments:!!document.querySelector('[data-shipment-id]'),
  };

  // ── Boot InfySyncEngine (Deferred after page load so browser tab stops spinning immediately) ──
  window.addEventListener('load', function () {
    setTimeout(function() {
      InfySyncEngine.init(Object.assign({
        supplierId:  {{ $supId ?? 1 }},
        initialSync: Math.floor(Date.now() / 1000) - 30,
      }, _pageModules));
    }, 400);
  });

    // ── Cross-Tab Instant Sync with POS Admin App ──────────────────────────────
    window.infyBroadcastPoChange = function() {
      try {
        const bc = new BroadcastChannel('infypos_realtime_bus');
        bc.postMessage({
          type: 'purchase',
          action: 'status_changed',
          timestamp: Date.now(),
          eventId: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        });
      } catch(e) {}
      try {
        localStorage.setItem('infypos_sync_pulse', Date.now().toString());
        localStorage.setItem('infy_purchase_sync', Date.now().toString());
      } catch(e) {}
    };

    @if(session('success') || session('error'))
      window.infyBroadcastPoChange();
    @endif

    document.addEventListener('submit', function(e) {
      if (e.target && e.target.action && (e.target.action.includes('approve') || e.target.action.includes('reject') || e.target.action.includes('purchase'))) {
        window.infyBroadcastPoChange();
      }
    });
  });

  // ── Change Password Center Modal Controls ───────────────────────────────────
  function openChangePasswordModal() {
    const modal = document.getElementById('spChangePasswordModal');
    const alertBox = document.getElementById('spModalAlertBox');
    const form = document.getElementById('spModalPasswordForm');
    if (!modal) return;
    if (alertBox) {
      alertBox.style.display = 'none';
      alertBox.innerHTML = '';
    }
    if (form) form.reset();
    modal.style.display = 'flex';
    setTimeout(() => {
      const currInput = document.getElementById('modalCurrentPassword');
      if (currInput) currInput.focus();
    }, 100);
  }

  function closeChangePasswordModal() {
    const modal = document.getElementById('spChangePasswordModal');
    if (modal) modal.style.display = 'none';
  }

  function closeChangePasswordModalOnBackdrop(e) {
    if (e.target.id === 'spChangePasswordModal') {
      closeChangePasswordModal();
    }
  }

  function toggleModalPassVisibility(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (!input || !icon) return;
    if (input.type === 'password') {
      input.type = 'text';
      icon.classList.remove('bi-eye');
      icon.classList.add('bi-eye-slash');
    } else {
      input.type = 'password';
      icon.classList.remove('bi-eye-slash');
      icon.classList.add('bi-eye');
    }
  }

  async function handleModalPasswordSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const alertBox = document.getElementById('spModalAlertBox');
    const btn = document.getElementById('modalSubmitBtn');
    const btnText = document.getElementById('modalSubmitText');

    const currPass = document.getElementById('modalCurrentPassword').value;
    const newPass = document.getElementById('modalNewPassword').value;
    const confPass = document.getElementById('modalConfirmPassword').value;

    if (newPass.length < 8) {
      showAlert(false, 'New password must be at least 8 characters long.');
      return;
    }
    if (newPass !== confPass) {
      showAlert(false, 'New password and confirmation do not match.');
      return;
    }

    // Set Loading state
    if (btn) btn.disabled = true;
    if (btnText) btnText.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" style="width:14px; height:14px; margin-right:4px;"></span> Updating...';
    if (alertBox) alertBox.style.display = 'none';

    try {
      const formData = new FormData(form);
      const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

      const response = await fetch('{{ route("supplier.change-password") }}', {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': token,
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showAlert(true, '✅ ' + (data.message || 'Password changed successfully!'));
        form.reset();
        
        // Hide warning banner dynamically
        const banner = document.getElementById('spSecurityBanner');
        if (banner) {
          banner.style.transition = 'all 0.3s ease';
          banner.style.opacity = '0';
          banner.style.transform = 'translateY(-10px)';
          setTimeout(() => banner.remove(), 350);
        }

        // Auto close modal after brief delay
        setTimeout(() => {
          closeChangePasswordModal();
          showGlobalToast('✅ Password changed successfully!', 'success');
        }, 1200);
      } else {
        const errorMsg = data.message || (data.errors ? Object.values(data.errors).flat().join('<br>') : 'Failed to update password. Please check your credentials.');
        showAlert(false, '⚠️ ' + errorMsg);
      }
    } catch(err) {
      console.error(err);
      showAlert(false, '⚠️ An unexpected error occurred. Please try again.');
    } finally {
      if (btn) btn.disabled = false;
      if (btnText) btnText.innerText = 'Update Password';
    }

    function showAlert(isSuccess, html) {
      if (!alertBox) return;
      alertBox.style.display = 'block';
      alertBox.innerHTML = html;
      if (isSuccess) {
        alertBox.style.background = '#DCFCE7';
        alertBox.style.color = '#15803D';
        alertBox.style.border = '1px solid #86EFAC';
      } else {
        alertBox.style.background = '#FEF2F2';
        alertBox.style.color = '#DC2626';
        alertBox.style.border = '1px solid #FCA5A5';
      }
    }
  }

  function showGlobalToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'sp-toast ' + type;
    toast.innerHTML = `<i class="bi ${type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}" style="color:${type === 'success' ? '#10B981' : '#EF4444'}; font-size:16px;"></i> <span>${message}</span>`;
    
    let container = document.querySelector('.sp-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'sp-toast-container';
      document.body.appendChild(container);
    }
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ⚡ INFY-POS 0ms REAL-TIME BROADCAST ENGINE
  // ══════════════════════════════════════════════════════════════════════════
  window.InfyBroadcast = function(type = 'shipment', payload = {}) {
    try {
      if (window.BroadcastChannel) {
        const bc = new BroadcastChannel('infypos_realtime_bus');
        bc.postMessage({
          type: type,
          action: 'status_updated',
          eventId: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5),
          companyId: 1,
          ...payload,
          timestamp: Date.now()
        });
      }
    } catch(e) {}
    try {
      const now = Date.now().toString();
      localStorage.setItem('infypos_sync_pulse', now);
      localStorage.setItem('infy_purchase_sync', now);
      localStorage.setItem('infy_shipment_sync', now);
      localStorage.setItem('pos_realtime_event', JSON.stringify({ type, timestamp: Date.now() }));
      localStorage.removeItem('infy_inbound_planning_cache');
      localStorage.removeItem('infy_stock_receiving_cache');
    } catch(e) {}
  };

  // ══════════════════════════════════════════════════════════════════════════
  // ⚡ SP-INSTANT-NAV: 0ms TURBO PREFETCH & SPA ROUTER
  // ══════════════════════════════════════════════════════════════════════════
  const SpInstantNav = (function() {
    const cache = new Map();
    const prefetchQueue = new Set();
    let isNavigating = false;

    function init() {
      // 1. Save current initial page
      saveCurrentPageToCache();

      // 2. High-priority prefetch for all sidebar links
      if (window.requestIdleCallback) {
        requestIdleCallback(() => warmupSidebarRoutes());
      } else {
        setTimeout(warmupSidebarRoutes, 200);
      }

      // 3. Intercept all internal navigation clicks for 0ms swap
      document.addEventListener('click', handleGlobalClick, true);

      // 4. Instant Hover & Touchstart prefetcher
      document.addEventListener('mouseover', handleHoverPrefetch, { passive: true });
      document.addEventListener('touchstart', handleHoverPrefetch, { passive: true });

      // 5. Browser Back & Forward popstate handling
      window.addEventListener('popstate', handlePopState);
    }

    function getNormalizedUrl(url) {
      try {
        const u = new URL(url, window.location.origin);
        if (u.origin !== window.location.origin) return null;
        if (!u.pathname.startsWith('/supplier')) return null;
        if (u.pathname.includes('/logout') || u.pathname.includes('/login') || u.pathname.includes('/pdf') || u.pathname.includes('/download') || u.pathname.includes('/export')) return null;
        return u.pathname + u.search;
      } catch(e) {
        return null;
      }
    }

    function saveCurrentPageToCache() {
      const main = document.getElementById('sp-real-content');
      if (!main) return;
      const normUrl = getNormalizedUrl(window.location.href);
      if (!normUrl) return;

      cache.set(normUrl, {
        title: document.title,
        html: main.innerHTML,
        timestamp: Date.now()
      });
    }

    function warmupSidebarRoutes() {
      const links = document.querySelectorAll('.sp-nav-item-v2, .sp-app-tile, .sp-kpi-card, .sp-tab-item');
      links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href !== '#' && !href.startsWith('javascript:')) {
          const norm = getNormalizedUrl(href);
          if (norm && !cache.has(norm)) {
            prefetchUrl(norm);
          }
        }
      });
    }

    async function prefetchUrl(url) {
      const norm = getNormalizedUrl(url);
      if (!norm || cache.has(norm) || prefetchQueue.has(norm)) return;
      prefetchQueue.add(norm);

      try {
        const resp = await fetch(norm, {
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-SP-Instant-Nav': '1'
          }
        });

        if (resp.ok) {
          const htmlText = await resp.text();
          const doc = new DOMParser().parseFromString(htmlText, 'text/html');
          const mainEl = doc.getElementById('sp-real-content');
          if (mainEl) {
            cache.set(norm, {
              title: doc.title || document.title,
              html: mainEl.innerHTML,
              timestamp: Date.now()
            });
          }
        }
      } catch(e) {
      } finally {
        prefetchQueue.delete(norm);
      }
    }

    function handleHoverPrefetch(e) {
      const link = e.target.closest('a');
      if (!link) return;
      const href = link.getAttribute('href');
      if (href) prefetchUrl(href);
    }

    function handleGlobalClick(e) {
      if (e.which > 1 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      
      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href || href === '#' || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:') || link.getAttribute('target') === '_blank' || link.hasAttribute('download')) {
        return;
      }

      const norm = getNormalizedUrl(href);
      if (!norm) return;

      // Handle same page anchor scrolling
      if (norm.split('#')[0] === getNormalizedUrl(window.location.href)?.split('#')[0] && href.includes('#')) {
        return;
      }

      e.preventDefault();
      navigateTo(norm);
    }

    async function navigateTo(url, pushState = true) {
      if (isNavigating) return;
      isNavigating = true;

      // 1. 0ms INSTANT CACHE HIT (Immediate DOM Swap!)
      const cached = cache.get(url);
      if (cached) {
        renderPage(cached, url, pushState);
        isNavigating = false;
        // Background silent revalidation for fresh stats
        revalidateUrlInBackground(url);
        return;
      }

      // 2. Cold navigation fallback with fast micro-bar
      showProgressBar();
      try {
        const resp = await fetch(url, {
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-SP-Instant-Nav': '1'
          }
        });

        if (!resp.ok) {
          window.location.href = url;
          return;
        }

        const htmlText = await resp.text();
        const doc = new DOMParser().parseFromString(htmlText, 'text/html');
        const mainEl = doc.getElementById('sp-real-content');

        if (!mainEl) {
          window.location.href = url;
          return;
        }

        const pageData = {
          title: doc.title || document.title,
          html: mainEl.innerHTML,
          timestamp: Date.now()
        };

        cache.set(url, pageData);
        renderPage(pageData, url, pushState);
      } catch(err) {
        console.error('InstantNav fallback:', err);
        window.location.href = url;
      } finally {
        hideProgressBar();
        isNavigating = false;
      }
    }

    function renderPage(pageData, url, pushState) {
      const main = document.getElementById('sp-real-content');
      if (!main) return;

      // 0ms Swap
      main.innerHTML = pageData.html;
      document.title = pageData.title;

      if (pushState) {
        window.history.pushState({ url }, '', url);
      }

      // Update active highlight in sidebar
      updateSidebarActiveState(url);

      // Scroll viewport to top
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

      // Execute scripts contained in the new view
      executePageScripts(main);

      // Trigger standard lifecycle events
      document.dispatchEvent(new Event('DOMContentLoaded'));
      window.dispatchEvent(new Event('load'));
      window.dispatchEvent(new CustomEvent('sp:navigated', { detail: { url } }));
    }

    function updateSidebarActiveState(url) {
      const path = url.split('?')[0].split('#')[0];
      document.querySelectorAll('.sp-nav-item-v2').forEach(item => {
        const href = item.getAttribute('href');
        if (!href) return;
        const itemPath = href.split('?')[0].split('#')[0];
        
        if (itemPath === path || (path !== '/supplier/dashboard' && path.startsWith(itemPath) && itemPath !== '/supplier/dashboard')) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    }

    function executePageScripts(container) {
      const scripts = container.querySelectorAll('script');
      scripts.forEach(oldScript => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
        newScript.textContent = oldScript.textContent;
        oldScript.parentNode.replaceChild(newScript, oldScript);
      });
    }

    async function revalidateUrlInBackground(url) {
      try {
        const resp = await fetch(url, {
          headers: { 'X-Requested-With': 'XMLHttpRequest', 'X-SP-Instant-Nav': '1' }
        });
        if (resp.ok) {
          const htmlText = await resp.text();
          const doc = new DOMParser().parseFromString(htmlText, 'text/html');
          const mainEl = doc.getElementById('sp-real-content');
          if (mainEl) {
            cache.set(url, {
              title: doc.title || document.title,
              html: mainEl.innerHTML,
              timestamp: Date.now()
            });
          }
        }
      } catch(e) {}
    }

    function handlePopState(e) {
      const url = getNormalizedUrl(window.location.href);
      if (url) {
        navigateTo(url, false);
      }
    }

    function showProgressBar() {
      let bar = document.getElementById('sp-top-progress');
      if (!bar) {
        bar = document.createElement('div');
        bar.id = 'sp-top-progress';
        bar.style.cssText = 'position:fixed; top:0; left:0; height:3px; background:linear-gradient(90deg,#15803D,#10B981,#F59E0B); z-index:99999; transition:width 0.15s ease, opacity 0.2s ease; width:0; pointer-events:none;';
        document.body.appendChild(bar);
      }
      bar.style.opacity = '1';
      bar.style.width = '70%';
    }

    function hideProgressBar() {
      const bar = document.getElementById('sp-top-progress');
      if (bar) {
        bar.style.width = '100%';
        setTimeout(() => {
          bar.style.opacity = '0';
          setTimeout(() => { bar.style.width = '0'; }, 200);
        }, 100);
      }
    }

    return { init, navigateTo, prefetchUrl };
  })();

  document.addEventListener('DOMContentLoaded', () => {
    SpInstantNav.init();
  });
</script>

@yield('scripts')
</body>
</html>

