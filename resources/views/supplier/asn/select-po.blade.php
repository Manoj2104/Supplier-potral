@extends('supplier.layout')

@section('title', 'Select Purchase Order to Create ASN | Suguna')

@section('head')
<style>
/* ═══════════════════════════════════════════════════════════════════
   PIXEL-PERFECT SELECT PURCHASE ORDER TO CREATE ASN (Ref 2 Match)
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

/* Page Intro Header */
.po-page-intro {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    margin-bottom: 26px !important;
    flex-wrap: wrap !important;
    gap: 16px !important;
}
.po-page-title {
    font-size: 34px !important;
    font-weight: 800 !important;
    color: #111827 !important;
    letter-spacing: -1px !important;
    margin-bottom: 4px !important;
    line-height: 1.15 !important;
}
.po-page-subtitle {
    font-size: 14.5px !important;
    font-weight: 400 !important;
    color: #94A3B8 !important;
    margin: 0 !important;
}

/* Top 4 KPI Summary Grid (Exact Match to Ref Image 2) */
.po-kpi-grid-4 {
    display: grid !important;
    grid-template-columns: repeat(4, 1fr) !important;
    gap: 20px !important;
    margin-bottom: 28px !important;
}
@media (max-width: 1200px) { .po-kpi-grid-4 { grid-template-columns: repeat(2, 1fr) !important; } }
@media (max-width: 640px)  { .po-kpi-grid-4 { grid-template-columns: 1fr !important; } }

.po-kpi-card {
    background: #FFFFFF !important;
    border: 1px solid #EEF2F7 !important;
    border-radius: 20px !important;
    padding: 20px 22px !important;
    min-height: 155px !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: space-between !important;
    box-shadow: 0 4px 18px rgba(15, 23, 42, 0.03) !important;
    transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) !important;
    position: relative !important;
    overflow: hidden !important;
}
.po-kpi-card:hover {
    transform: translateY(-3px) !important;
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08) !important;
}

.po-kpi-header {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    margin-bottom: 8px !important;
}
.po-kpi-icon {
    width: 42px !important;
    height: 42px !important;
    border-radius: 12px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-size: 18px !important;
    flex-shrink: 0 !important;
}
.po-kpi-title {
    font-size: 14px !important;
    font-weight: 600 !important;
    color: #64748B !important;
}
.po-kpi-val {
    font-size: 32px !important;
    font-weight: 900 !important;
    color: #0F172A !important;
    line-height: 1.15 !important;
    letter-spacing: -0.02em !important;
}
.po-kpi-badge {
    font-size: 11.5px !important;
    font-weight: 700 !important;
    padding: 3px 10px !important;
    border-radius: 9999px !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 4px !important;
}
.po-kpi-badge.green  { background: #DCFCE7 !important; color: #16A34A !important; }
.po-kpi-badge.blue   { background: #EFF6FF !important; color: #2563EB !important; }
.po-kpi-badge.amber  { background: #FEF3C7 !important; color: #D97706 !important; }
.po-kpi-badge.purple { background: #F3E8FF !important; color: #7C3AED !important; }

.po-sparkline-svg {
    width: 80px !important;
    height: 24px !important;
    display: block !important;
}

/* Master Table / Container Card */
.po-master-card {
    background: #FFFFFF !important;
    border: 1px solid #EEF2F7 !important;
    border-radius: 22px !important;
    box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04) !important;
    overflow: hidden !important;
    margin-bottom: 28px !important;
}

/* Filter Toolbar (Exact Match to Ref 2) */
.po-filter-bar {
    padding: 18px 24px !important;
    border-bottom: 1px solid #F1F5F9 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    gap: 12px !important;
    flex-wrap: wrap !important;
}
.po-search-box {
    position: relative !important;
    flex: 1 !important;
    min-width: 280px !important;
    max-width: 440px !important;
}
.po-search-box input {
    width: 100% !important;
    height: 42px !important;
    padding-left: 40px !important;
    padding-right: 14px !important;
    background: #F8FAFC !important;
    border: 1px solid #E2E8F0 !important;
    border-radius: 12px !important;
    font-size: 13px !important;
    color: #0F172A !important;
    outline: none !important;
    transition: all 0.15s ease !important;
    box-sizing: border-box !important;
}
.po-search-box input:focus {
    border-color: #16A34A !important;
    background: #FFFFFF !important;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1) !important;
}
.po-search-icon {
    position: absolute !important;
    left: 14px !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    color: #94A3B8 !important;
    font-size: 14px !important;
}

.po-filter-actions {
    display: flex !important;
    align-items: center !important;
    gap: 10px !important;
    flex-wrap: wrap !important;
}
.po-select-pill {
    height: 42px !important;
    border-radius: 12px !important;
    border: 1px solid #E2E8F0 !important;
    background: #FFFFFF !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    color: #0F172A !important;
    padding: 0 14px !important;
    outline: none !important;
    cursor: pointer !important;
    transition: border-color 0.15s ease !important;
}
.po-select-pill:focus {
    border-color: #16A34A !important;
}

/* View Toggle Buttons */
.view-toggle-wrap {
    background: #F1F5F9 !important;
    border-radius: 12px !important;
    padding: 3px !important;
    display: flex !important;
    align-items: center !important;
    gap: 2px !important;
    height: 42px !important;
    box-sizing: border-box !important;
}
.view-toggle-btn {
    border: none !important;
    background: transparent !important;
    color: #94A3B8 !important;
    border-radius: 8px !important;
    width: 36px !important;
    height: 36px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    cursor: pointer !important;
    transition: all 0.15s ease !important;
    font-size: 15px !important;
}
.view-toggle-btn.active {
    background: #FFFFFF !important;
    color: #16A34A !important;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06) !important;
}

.po-reset-btn {
    height: 42px !important;
    padding: 0 18px !important;
    border-radius: 12px !important;
    border: 1px solid #E2E8F0 !important;
    background: #FFFFFF !important;
    color: #64748B !important;
    font-weight: 700 !important;
    font-size: 13px !important;
    text-decoration: none !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    transition: all 0.15s ease !important;
    cursor: pointer !important;
}
.po-reset-btn:hover {
    background: #F8FAFC !important;
    color: #0F172A !important;
    border-color: #CBD5E1 !important;
}

/* Table Design (List Mode) */
.po-table-wrap {
    width: 100% !important;
    overflow-x: auto !important;
}
.po-table {
    width: 100% !important;
    border-collapse: collapse !important;
    font-size: 13px !important;
}
.po-table th {
    padding: 14px 18px !important;
    background: #F8FAFC !important;
    color: #64748B !important;
    font-size: 11px !important;
    font-weight: 800 !important;
    letter-spacing: 0.5px !important;
    text-transform: uppercase !important;
    border-bottom: 1px solid #E2E8F0 !important;
    white-space: nowrap !important;
}
.po-table td {
    padding: 16px 18px !important;
    border-bottom: 1px solid #F1F5F9 !important;
    vertical-align: middle !important;
    color: #334155 !important;
}
.po-table tr:last-child td { border-bottom: none !important; }
.po-table tr:hover td { background: #F8FAFC !important; }

/* Status Badges */
.po-status-pill {
    display: inline-flex !important;
    align-items: center !important;
    gap: 6px !important;
    padding: 5px 12px !important;
    border-radius: 9999px !important;
    font-size: 12px !important;
    font-weight: 700 !important;
    white-space: nowrap !important;
}
.po-status-pill.approved { background: #DCFCE7 !important; color: #16A34A !important; }
.po-status-dot { width: 6px !important; height: 6px !important; border-radius: 50% !important; background: currentColor !important; }

/* Action Button */
.btn-start-asn-table {
    background: #15803D !important;
    color: #FFFFFF !important;
    font-size: 12.5px !important;
    font-weight: 700 !important;
    padding: 7px 18px !important;
    border-radius: 9999px !important;
    text-decoration: none !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 6px !important;
    box-shadow: 0 2px 8px rgba(21, 128, 61, 0.2) !important;
    transition: all 0.15s ease !important;
    white-space: nowrap !important;
}
.btn-start-asn-table:hover {
    background: #166534 !important;
    color: #FFFFFF !important;
    transform: translateY(-1px) !important;
}

/* Card View (Grid Mode) */
.po-grid-cards-wrap {
    padding: 24px !important;
    display: grid !important;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)) !important;
    gap: 20px !important;
}
.po-grid-card-item {
    background: #FFFFFF !important;
    border: 1px solid #EEF2F7 !important;
    border-radius: 18px !important;
    padding: 20px !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: space-between !important;
    box-shadow: 0 2px 10px rgba(15, 23, 42, 0.02) !important;
    transition: all 0.2s ease !important;
    position: relative !important;
}
.po-grid-card-item:hover {
    border-color: #86EFAC !important;
    box-shadow: 0 8px 24px rgba(22, 163, 74, 0.12) !important;
    transform: translateY(-3px) !important;
}

.po-card-top-row {
    display: flex !important;
    align-items: flex-start !important;
    justify-content: space-between !important;
    padding-bottom: 12px !important;
    border-bottom: 1px dashed #E2E8F0 !important;
    margin-bottom: 14px !important;
}
.po-grid-ref {
    font-size: 16px !important;
    font-weight: 900 !important;
    color: #0F172A !important;
}
.po-grid-details-grid {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 12px !important;
    margin-bottom: 14px !important;
}
.po-gdetail-lbl { font-size: 11px !important; font-weight: 700; color: #64748B; text-transform: uppercase; }
.po-gdetail-val { font-size: 13px !important; font-weight: 800; color: #0F172A; margin-top: 1px; }

/* Products Preview Box */
.po-items-preview-box {
    background: #F8FAFC !important;
    border: 1px solid #EEF2F7 !important;
    border-radius: 12px !important;
    padding: 12px 14px !important;
    margin-bottom: 16px !important;
    max-height: 120px !important;
    overflow-y: auto !important;
}
.po-preview-row {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    font-size: 12px !important;
    padding: 4px 0 !important;
    border-bottom: 1px solid #F1F5F9 !important;
}
.po-preview-row:last-child { border-bottom: none !important; }

.btn-start-asn-grid {
    background: linear-gradient(135deg, #15803D 0%, #166534 100%) !important;
    color: #FFFFFF !important;
    font-size: 13px !important;
    font-weight: 700 !important;
    padding: 11px 18px !important;
    border-radius: 12px !important;
    border: none !important;
    text-decoration: none !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 8px !important;
    box-shadow: 0 4px 14px rgba(21, 128, 61, 0.25) !important;
    transition: all 0.18s ease !important;
    width: 100% !important;
    box-sizing: border-box !important;
}
.btn-start-asn-grid:hover {
    background: linear-gradient(135deg, #166534 0%, #14532D 100%) !important;
    box-shadow: 0 6px 18px rgba(21, 128, 61, 0.35) !important;
    color: #FFFFFF !important;
}

/* Footer Pagination */
.po-table-footer {
    padding: 16px 24px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    border-top: 1px solid #F1F5F9 !important;
    font-size: 13px !important;
    color: #64748B !important;
    flex-wrap: wrap !important;
    gap: 12px !important;
}
.page-pill-btn {
    width: 32px !important;
    height: 32px !important;
    border-radius: 8px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-weight: 800 !important;
    font-size: 13px !important;
    text-decoration: none !important;
    border: 1px solid #E2E8F0 !important;
    color: #64748B !important;
    background: #FFFFFF !important;
}
.page-pill-btn.active {
    background: #16A34A !important;
    border-color: #16A34A !important;
    color: #FFFFFF !important;
}
</style>
@endsection

@section('content')
<div class="dashboard-page premium-workspace">

    <!-- ═══════════════════════════════════════════════════════════════════
         1. PAGE INTRO HEADER (Matching Reference 2)
         ═══════════════════════════════════════════════════════════════════ -->
    <div class="po-page-intro">
        <div>
            <div style="font-size:12.5px; font-weight:700; color:#64748B; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
                <span>Dashboard</span>
                <span>&gt;</span>
                <span>ASN (Dispatch)</span>
                <span>&gt;</span>
                <span style="color:#16A34A;">Select Purchase Order</span>
            </div>
            <h1 class="po-page-title">Select Purchase Order to Create ASN</h1>
            <p class="po-page-subtitle">Choose an approved Purchase Order to pack cartons, generate thermal LPN labels, and notify warehouse.</p>
        </div>
        <div style="display:flex; gap:12px; align-items:center;">
            <a href="{{ route('supplier.asn.index') }}" class="dashboard-import-button" style="height:44px; padding:0 20px; font-size:13.5px;">
                <i class="bi bi-arrow-left"></i> Back to Dispatches
            </a>
            <a href="{{ route('supplier.purchase-orders.index') }}" class="dashboard-add-button" style="height:44px; padding:0 22px; font-size:13.5px;">
                <i class="bi bi-list-check"></i> View All POs
            </a>
        </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════
         2. TOP 4 KPI CARDS GRID (Exact Layout to Reference 2)
         ═══════════════════════════════════════════════════════════════════ -->
    <div class="po-kpi-grid-4">

        <!-- Card 1: Approved POs -->
        <div class="po-kpi-card">
            <div class="po-kpi-header">
                <span class="po-kpi-title">Approved POs</span>
                <div class="po-kpi-icon" style="background:#DCFCE7; color:#16A34A;">
                    <i class="bi bi-sliders"></i>
                </div>
            </div>
            <div>
                <div class="po-kpi-val">{{ count($approvedPos) }}</div>
                <div style="display:flex; align-items:center; justify-content:space-between; margin-top:10px;">
                    <span class="po-kpi-badge green">Ready to Pack</span>
                    <svg class="po-sparkline-svg" viewBox="0 0 76 26" fill="none">
                        <path d="M2 20L22 14L44 16L74 4" stroke="#16A34A" stroke-width="2.5" stroke-linecap="round"/>
                        <circle cx="74" cy="4" r="3.5" fill="#16A34A"/>
                    </svg>
                </div>
            </div>
        </div>

        <!-- Card 2: Verification Status -->
        <div class="po-kpi-card">
            <div class="po-kpi-header">
                <span class="po-kpi-title">Verification Status</span>
                <div class="po-kpi-icon" style="background:#EFF6FF; color:#2563EB;">
                    <i class="bi bi-tag-fill"></i>
                </div>
            </div>
            <div>
                <div class="po-kpi-val">100%</div>
                <div style="display:flex; align-items:center; justify-content:space-between; margin-top:10px;">
                    <span class="po-kpi-badge blue">100% Verified</span>
                    <svg class="po-sparkline-svg" viewBox="0 0 76 26" fill="none">
                        <path d="M2 18L22 21L44 13L74 6" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round"/>
                        <circle cx="74" cy="6" r="3.5" fill="#2563EB"/>
                    </svg>
                </div>
            </div>
        </div>

        <!-- Card 3: Total Items to Pack -->
        <div class="po-kpi-card">
            <div class="po-kpi-header">
                <span class="po-kpi-title">Total Items to Pack</span>
                <div class="po-kpi-icon" style="background:#FEF3C7; color:#D97706;">
                    <i class="bi bi-palette-fill"></i>
                </div>
            </div>
            <div>
                <div class="po-kpi-val">{{ $approvedPos->sum(function($po) { return $po->purchaseItems ? $po->purchaseItems->sum('quantity') : 0; }) }}</div>
                <div style="display:flex; align-items:center; justify-content:space-between; margin-top:10px;">
                    <span class="po-kpi-badge amber">Items Ordered</span>
                    <svg class="po-sparkline-svg" viewBox="0 0 76 26" fill="none">
                        <path d="M2 22L22 17L44 12L74 4" stroke="#D97706" stroke-width="2.5" stroke-linecap="round"/>
                        <circle cx="74" cy="4" r="3.5" fill="#D97706"/>
                    </svg>
                </div>
            </div>
        </div>

        <!-- Card 4: Destination -->
        <div class="po-kpi-card">
            <div class="po-kpi-header">
                <span class="po-kpi-title">Destination</span>
                <div class="po-kpi-icon" style="background:#F3E8FF; color:#9333EA;">
                    <i class="bi bi-check-circle-fill"></i>
                </div>
            </div>
            <div>
                <div class="po-kpi-val" style="font-size:24px;">Main WH</div>
                <div style="display:flex; align-items:center; justify-content:space-between; margin-top:10px;">
                    <span class="po-kpi-badge purple">Suguna Warehouse</span>
                    <svg class="po-sparkline-svg" viewBox="0 0 76 26" fill="none">
                        <path d="M2 20L22 16L44 11L74 3" stroke="#9333EA" stroke-width="2.5" stroke-linecap="round"/>
                        <circle cx="74" cy="3" r="3.5" fill="#9333EA"/>
                    </svg>
                </div>
            </div>
        </div>

    </div>

    <!-- ═══════════════════════════════════════════════════════════════════
         3. MASTER CONTAINER CARD WITH SEARCH, FILTERS & DUAL VIEW
         ═══════════════════════════════════════════════════════════════════ -->
    <div class="po-master-card">

        <!-- Unified Filter Toolbar (Matching Ref 2) -->
        <div class="po-filter-bar">
            <!-- Search Box -->
            <div class="po-search-box">
                <i class="bi bi-search po-search-icon"></i>
                <input type="text" id="poSearchInput" placeholder="Search PO reference (e.g. PU_11153, PO-2026)..." oninput="filterPoItems()">
            </div>

            <!-- Dropdown Filters & Controls -->
            <div class="po-filter-actions">
                <select id="poWarehouseFilter" class="po-select-pill" onchange="filterPoItems()">
                    <option value="all">Warehouse: All</option>
                    @foreach($warehouses ?? [] as $wh)
                        <option value="{{ strtolower($wh->name) }}">{{ $wh->name }}</option>
                    @endforeach
                </select>

                <select id="poStatusFilter" class="po-select-pill" onchange="filterPoItems()">
                    <option value="all">Status: All</option>
                    <option value="approved">Status: Approved</option>
                </select>

                <select id="poSortFilter" class="po-select-pill" onchange="sortPoItems()">
                    <option value="newest">Sort: Newest</option>
                    <option value="oldest">Sort: Oldest</option>
                    <option value="items">Sort: Most Items</option>
                </select>

                <!-- Dual View Toggle Pills (List / Grid) -->
                <div class="view-toggle-wrap">
                    <button type="button" id="btnListView" class="view-toggle-btn active" onclick="switchPoView('list')" title="List Table View">
                        <i class="bi bi-list-ul"></i>
                    </button>
                    <button type="button" id="btnGridView" class="view-toggle-btn" onclick="switchPoView('grid')" title="Grid Card View">
                        <i class="bi bi-grid-fill"></i>
                    </button>
                </div>

                <button type="button" class="po-reset-btn" onclick="resetPoFilters()">
                    Reset
                </button>
            </div>
        </div>

        <!-- ── VIEW 1: MASTER TABLE (LIST MODE) ── -->
        <div id="poTableViewWrap" class="po-table-wrap">
            <table class="po-table" id="poMasterTable">
                <thead>
                    <tr>
                        <th style="width: 36px; padding-left: 20px;"><input type="checkbox" style="border-radius:4px;"></th>
                        <th>PO REFERENCE</th>
                        <th>ORDER DATE</th>
                        <th>WAREHOUSE</th>
                        <th>BUYER / RETAILER</th>
                        <th>PRODUCTS</th>
                        <th>ORDERED UNITS</th>
                        <th>STATUS</th>
                        <th style="text-align:right; padding-right: 20px;">ACTIONS</th>
                    </tr>
                </thead>
                <tbody id="poTableBody">
                    @forelse($approvedPos as $idx => $po)
                    @php
                        $itemsCount = $po->purchaseItems ? $po->purchaseItems->count() : 0;
                        $unitsTotal = $po->purchaseItems ? $po->purchaseItems->sum('quantity') : 0;
                        $refCode = $po->reference_code ?: ('PU_'.$po->id);
                        $whName = $po->warehouse->name ?? 'Suguna Warehouse';
                    @endphp
                    <tr class="po-data-row" data-search="{{ strtolower($refCode . ' ' . $whName . ' ' . $po->id) }}" data-warehouse="{{ strtolower($whName) }}" data-items="{{ $unitsTotal }}" data-date="{{ $po->date }}">
                        <td style="padding-left: 20px;"><input type="checkbox" style="border-radius:4px;"></td>
                        <td>
                            <div>
                                <a href="{{ route('supplier.asn.create', $po->id) }}" style="color:#2563EB; font-weight:800; text-decoration:none; font-size:13.5px;">
                                    {{ $refCode }}
                                </a>
                                @if($idx === 0)
                                    <span style="background:#DCFCE7; color:#16A34A; font-size:10px; font-weight:800; padding:2px 6px; border-radius:4px; margin-left:4px;">NEW</span>
                                @endif
                            </div>
                        </td>
                        <td>
                            <div style="font-size:12.5px; color:#64748B; font-weight:500;">
                                {{ \Carbon\Carbon::parse($po->date)->format('d M Y') }}
                            </div>
                        </td>
                        <td>
                            <div style="font-weight:700; color:#0F172A;">{{ $whName }}</div>
                            <div style="font-size:11px; color:#94A3B8;">WH-00{{ $po->warehouse_id ?? 1 }}</div>
                        </td>
                        <td>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <div style="width:28px; height:28px; border-radius:50%; background:#F1F5F9; border:1px solid #E2E8F0; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:800; color:#475569;">
                                    KR
                                </div>
                                <div>
                                    <div style="font-weight:700; color:#0F172A; font-size:12px;">Karthik R</div>
                                    <div style="font-size:10.5px; color:#94A3B8;">Infy-POS Retail</div>
                                </div>
                            </div>
                        </td>
                        <td>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <div style="width:30px; height:30px; border-radius:8px; background:#F3E8FF; color:#7C3AED; display:flex; align-items:center; justify-content:center; font-size:14px;">
                                    📦
                                </div>
                                <div>
                                    <span style="font-weight:700; color:#0F172A;">{{ $itemsCount }} Item(s)</span>
                                    @if($po->purchaseItems && $po->purchaseItems->first() && $po->purchaseItems->first()->product)
                                        <div style="font-size:10.5px; color:#94A3B8;">{{ $po->purchaseItems->first()->product->name }}</div>
                                    @endif
                                </div>
                            </div>
                        </td>
                        <td>
                            <span style="font-weight:800; color:#0F172A; font-size:14px;">{{ $unitsTotal }} Units</span>
                        </td>
                        <td>
                            <span class="po-status-pill approved"><span class="po-status-dot"></span> Approved</span>
                        </td>
                        <td style="text-align:right; padding-right: 20px;">
                            <a href="{{ route('supplier.asn.create', $po->id) }}" class="btn-start-asn-table">
                                <i class="bi bi-box-seam"></i> Start ASN Packing &rarr;
                            </a>
                        </td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="9" style="text-align:center; padding:50px; color:#94A3B8; font-weight:600;">
                            No approved purchase orders found to create ASN.
                        </td>
                    </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        <!-- ── VIEW 2: GRID CARD VIEW (GRID MODE) ── -->
        <div id="poGridViewWrap" class="po-grid-cards-wrap" style="display: none;">
            @forelse($approvedPos as $po)
            @php
                $itemsCount = $po->purchaseItems ? $po->purchaseItems->count() : 0;
                $unitsTotal = $po->purchaseItems ? $po->purchaseItems->sum('quantity') : 0;
                $refCode = $po->reference_code ?: ('PU_'.$po->id);
                $whName = $po->warehouse->name ?? 'Suguna Warehouse';
            @endphp
            <div class="po-grid-card-item po-card-item-box" data-search="{{ strtolower($refCode . ' ' . $whName . ' ' . $po->id) }}" data-warehouse="{{ strtolower($whName) }}" data-items="{{ $unitsTotal }}" data-date="{{ $po->date }}">
                <div>
                    <div class="po-card-top-row">
                        <div>
                            <div class="po-grid-ref">{{ $refCode }}</div>
                            <div style="font-size:11.5px; color:#64748B; margin-top:2px;">Order Date: {{ \Carbon\Carbon::parse($po->date)->format('d M Y') }}</div>
                        </div>
                        <span class="po-status-pill approved">
                            <span class="po-status-dot"></span> APPROVED
                        </span>
                    </div>

                    <div class="po-grid-details-grid">
                        <div>
                            <div class="po-gdetail-lbl">Warehouse</div>
                            <div class="po-gdetail-val">{{ $whName }}</div>
                        </div>
                        <div>
                            <div class="po-gdetail-lbl">Buyer / Retailer</div>
                            <div class="po-gdetail-val">Infy-POS Retail</div>
                        </div>
                        <div>
                            <div class="po-gdetail-lbl">Total SKUs</div>
                            <div class="po-gdetail-val" style="color:#2563EB;">{{ $itemsCount }} SKUs</div>
                        </div>
                        <div>
                            <div class="po-gdetail-lbl">Ordered Units</div>
                            <div class="po-gdetail-val" style="color:#10B981;">{{ $unitsTotal }} Units</div>
                        </div>
                    </div>

                    <!-- Products Preview List -->
                    <div class="po-items-preview-box">
                        <div style="font-size:10px; font-weight:800; color:#64748B; text-transform:uppercase; margin-bottom:6px;">Items in this PO:</div>
                        @foreach($po->purchaseItems as $item)
                        @if($item->product)
                        <div class="po-preview-row">
                            <strong style="color:#0F172A;">{{ $item->product->name }}</strong>
                            <span style="font-weight:800; color:#059669;">{{ $item->quantity }} Units</span>
                        </div>
                        @endif
                        @endforeach
                    </div>
                </div>

                <!-- Action CTA -->
                <div>
                    <a href="{{ route('supplier.asn.create', $po->id) }}" class="btn-start-asn-grid">
                        <span>📦 Start ASN Packing &amp; Generate LPN</span>
                        <span>&rarr;</span>
                    </a>
                </div>
            </div>
            @empty
            <div style="grid-column: 1 / -1; background:#FFFFFF; border:2px dashed #CBD5E1; border-radius:18px; padding:40px; text-align:center;">
                <div style="font-size:36px; margin-bottom:8px;">📋</div>
                <div style="font-size:16px; font-weight:900; color:#0F172A;">No Approved Purchase Orders Found</div>
                <div style="font-size:12px; color:#64748B; margin-top:4px;">Check back once a new Purchase Order is issued by retail buyer.</div>
            </div>
            @endforelse
        </div>

        <!-- Footer Pagination (Matching Ref 2) -->
        <div class="po-table-footer">
            <div id="poShowingCountText">
                Showing 1 to {{ count($approvedPos) }} of {{ count($approvedPos) }} purchase orders
            </div>
            <div style="display:flex; align-items:center; gap:12px;">
                <div style="display:flex; align-items:center; gap:6px;">
                    <span class="page-pill-btn">&lt;</span>
                    <span class="page-pill-btn active">1</span>
                    <span class="page-pill-btn">&gt;</span>
                </div>
                <select class="po-select-pill" style="height:34px; font-size:12px; padding:0 10px;">
                    <option value="10">10 / page</option>
                    <option value="25">25 / page</option>
                    <option value="50">50 / page</option>
                </select>
            </div>
        </div>

    </div>

</div>
@endsection

@section('scripts')
<script>
// View switcher between List Table & Grid Cards
function switchPoView(viewMode) {
    const tableView = document.getElementById('poTableViewWrap');
    const gridView = document.getElementById('poGridViewWrap');
    const btnList = document.getElementById('btnListView');
    const btnGrid = document.getElementById('btnGridView');

    if (viewMode === 'grid') {
        tableView.style.display = 'none';
        gridView.style.display = 'grid';
        btnGrid.classList.add('active');
        btnList.classList.remove('active');
    } else {
        tableView.style.display = 'block';
        gridView.style.display = 'none';
        btnList.classList.add('active');
        btnGrid.classList.remove('active');
    }
}

// Live Search & Warehouse Filter
function filterPoItems() {
    const q = document.getElementById('poSearchInput').value.toLowerCase().trim();
    const wh = document.getElementById('poWarehouseFilter').value.toLowerCase();

    const tableRows = document.querySelectorAll('.po-data-row');
    const gridCards = document.querySelectorAll('.po-card-item-box');

    let visibleCount = 0;

    tableRows.forEach(row => {
        const searchData = row.dataset.search || '';
        const rowWh = row.dataset.warehouse || '';
        const matchSearch = !q || searchData.includes(q);
        const matchWh = (wh === 'all') || rowWh.includes(wh);

        if (matchSearch && matchWh) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });

    gridCards.forEach(card => {
        const searchData = card.dataset.search || '';
        const cardWh = card.dataset.warehouse || '';
        const matchSearch = !q || searchData.includes(q);
        const matchWh = (wh === 'all') || cardWh.includes(wh);

        if (matchSearch && matchWh) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });

    const showingText = document.getElementById('poShowingCountText');
    if (showingText) {
        showingText.textContent = `Showing 1 to ${visibleCount} of ${visibleCount} purchase orders`;
    }
}

// Sorting
function sortPoItems() {
    const sortVal = document.getElementById('poSortFilter').value;
    const tableBody = document.getElementById('poTableBody');
    const gridWrap = document.getElementById('poGridViewWrap');

    const rows = Array.from(document.querySelectorAll('.po-data-row'));
    const cards = Array.from(document.querySelectorAll('.po-card-item-box'));

    const sortFn = (a, b) => {
        if (sortVal === 'items') {
            return (parseInt(b.dataset.items) || 0) - (parseInt(a.dataset.items) || 0);
        } else if (sortVal === 'oldest') {
            return (a.dataset.date || '').localeCompare(b.dataset.date || '');
        } else {
            return (b.dataset.date || '').localeCompare(a.dataset.date || '');
        }
    };

    rows.sort(sortFn).forEach(r => tableBody.appendChild(r));
    cards.sort(sortFn).forEach(c => gridWrap.appendChild(c));
}

// Reset Filters
function resetPoFilters() {
    document.getElementById('poSearchInput').value = '';
    document.getElementById('poWarehouseFilter').value = 'all';
    document.getElementById('poStatusFilter').value = 'all';
    document.getElementById('poSortFilter').value = 'newest';
    filterPoItems();
}
</script>
@endsection

