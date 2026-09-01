@extends('pda.layout')

@section('title', 'Inventory Lookup — infy-pos WMS')

@section('header_title', 'Inventory')

@section('back_url', route('pda.dashboard'))

@section('head')
<style>
  .pda-search-bar {
    display: flex; align-items: center; gap: 8px; background: #FFFFFF; border: 1px solid #E5E7EB;
    border-radius: 12px; padding: 0 12px; height: 42px; margin-bottom: 6px;
  }
  .pda-search-bar input { border: none; outline: none; width: 100%; font-size: 13px; font-weight: 600; }

  .inv-prod-card {
    background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 12px; padding: 12px; margin-bottom: 10px;
  }
  .inv-prod-img {
    width: 48px; height: 48px; border-radius: 10px; background: #F3F4F6;
    display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0;
  }
</style>
@endsection

@section('content')

<!-- Search Bar -->
<div class="pda-search-bar">
  <i class="bi bi-search" style="color:#9CA3AF;"></i>
  <input type="text" placeholder="Search SKU / Barcode / Product...">
  <i class="bi bi-sliders" style="color:#6B7280;"></i>
</div>

<!-- Screen 15 Inventory Updated Success Banner (shown at top) -->
<div style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:12px;padding:12px;text-align:center;margin-bottom:10px;">
  <div style="width:36px;height:36px;background:#D1FAE5;color:#059669;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;margin:0 auto 4px auto;">✓</div>
  <div style="font-size:13px;font-weight:800;color:#047857;">Inventory Updated Successfully</div>

  <!-- 4 KPI Cards -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px;text-align:left;font-size:11px;">
    <div style="background:#FFF;padding:6px 8px;border-radius:6px;border:1px solid #A7F3D0;">
      <span style="color:#6B7280;">Available Stock</span><br><strong style="color:#059669;font-size:13px;">1,245</strong>
    </div>
    <div style="background:#FFF;padding:6px 8px;border-radius:6px;border:1px solid #A7F3D0;">
      <span style="color:#6B7280;">Reserved Stock</span><br><strong style="color:#111827;font-size:13px;">120</strong>
    </div>
    <div style="background:#FFF;padding:6px 8px;border-radius:6px;border:1px solid #A7F3D0;">
      <span style="color:#6B7280;">Bin Locations</span><br><strong style="color:#111827;font-size:13px;">320</strong>
    </div>
    <div style="background:#FFF;padding:6px 8px;border-radius:6px;border:1px solid #A7F3D0;">
      <span style="color:#6B7280;">Total Value</span><br><strong style="color:#111827;font-size:13px;">₹ 24,85,690</strong>
    </div>
  </div>
</div>

<!-- Screen 16 Product Cards List -->
<div style="display:flex;flex-direction:column;">

  <!-- Card 1 -->
  <div class="inv-prod-card">
    <div style="display:flex;gap:10px;align-items:center;margin-bottom:8px;">
      <div class="inv-prod-img">📺</div>
      <div>
        <div style="font-size:13.5px;font-weight:800;color:#111827;">Samsung 43" Smart LED TV</div>
        <div style="font-size:10.5px;color:#059669;font-weight:700;">SKU: TV43SMART</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:4px;font-size:10.5px;text-align:center;background:#F9FAFB;padding:6px;border-radius:6px;">
      <div>Available<br><strong style="color:#059669;">120 Units</strong></div>
      <div>Reserved<br><strong style="color:#111827;">0</strong></div>
      <div>In Transit<br><strong style="color:#2563EB;">A-01-02</strong></div>
    </div>
  </div>

  <!-- Card 2 -->
  <div class="inv-prod-card">
    <div style="display:flex;gap:10px;align-items:center;margin-bottom:8px;">
      <div class="inv-prod-img">🔌</div>
      <div>
        <div style="font-size:13.5px;font-weight:800;color:#111827;">Mixer Grinder 750W</div>
        <div style="font-size:10.5px;color:#059669;font-weight:700;">SKU: MIX750</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:4px;font-size:10.5px;text-align:center;background:#F9FAFB;padding:6px;border-radius:6px;">
      <div>Available<br><strong style="color:#059669;">76 Units</strong></div>
      <div>Reserved<br><strong style="color:#111827;">5</strong></div>
      <div>Bin<br><strong style="color:#2563EB;">B-02-01</strong></div>
    </div>
  </div>

  <!-- Card 3 -->
  <div class="inv-prod-card">
    <div style="display:flex;gap:10px;align-items:center;margin-bottom:8px;">
      <div class="inv-prod-img">🧊</div>
      <div>
        <div style="font-size:13.5px;font-weight:800;color:#111827;">LG Refrigerator 190L</div>
        <div style="font-size:10.5px;color:#059669;font-weight:700;">SKU: LGR190</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:4px;font-size:10.5px;text-align:center;background:#F9FAFB;padding:6px;border-radius:6px;">
      <div>Available<br><strong style="color:#059669;">45 Units</strong></div>
      <div>Reserved<br><strong style="color:#111827;">0</strong></div>
      <div>Bin<br><strong style="color:#2563EB;">C-01-03</strong></div>
    </div>
  </div>

</div>

@endsection
