@extends('pda.layout')

@section('title', ($moduleTitle ?? 'Module') . ' — Coming Soon | INFY-POS WMS')

@section('head')
<style>
  .cs-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 30px 16px;
    min-height: 70vh;
  }
  
  .cs-icon-box {
    width: 90px;
    height: 90px;
    border-radius: 28px;
    background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%);
    border: 2px solid #86EFAC;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 42px;
    margin-bottom: 20px;
    box-shadow: 0 10px 25px rgba(22, 163, 74, 0.15);
    animation: floatBounce 3s ease-in-out infinite;
  }

  @keyframes floatBounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }

  .cs-badge {
    background: #FEF3C7;
    color: #B45309;
    border: 1px solid #FDE68A;
    font-size: 11px;
    font-weight: 800;
    padding: 4px 14px;
    border-radius: 20px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    margin-bottom: 12px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .cs-title {
    font-size: 22px;
    font-weight: 900;
    color: #0F172A;
    margin-bottom: 8px;
    letter-spacing: -0.3px;
    line-height: 1.2;
  }

  .cs-subtitle {
    font-size: 13.5px;
    color: #64748B;
    font-weight: 600;
    max-width: 320px;
    margin-bottom: 28px;
    line-height: 1.5;
  }

  .cs-card-info {
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 18px;
    padding: 16px;
    width: 100%;
    max-width: 350px;
    margin-bottom: 24px;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
    text-align: left;
  }

  .cs-info-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #F1F5F9;
    font-size: 12px;
  }
  .cs-info-row:last-child { border-bottom: none; }
  .cs-info-lbl { color: #64748B; font-weight: 600; }
  .cs-info-val { color: #0F172A; font-weight: 800; }

  .cs-actions {
    width: 100%;
    max-width: 350px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .cs-btn-primary {
    width: 100%;
    height: 50px;
    background: #16A34A;
    color: #FFFFFF;
    border: none;
    border-radius: 14px;
    font-size: 14.5px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    text-decoration: none;
    box-shadow: 0 4px 14px rgba(22, 163, 74, 0.25);
    transition: transform 0.15s;
  }
  .cs-btn-primary:active { transform: translateY(1px); }

  .cs-btn-secondary {
    width: 100%;
    height: 46px;
    background: #F1F5F9;
    color: #334155;
    border: 1px solid #CBD5E1;
    border-radius: 14px;
    font-size: 13.5px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    text-decoration: none;
  }
</style>
@endsection

@section('content')

<div class="cs-wrapper">
  
  <div class="cs-icon-box">
    {{ $moduleIcon ?? '🚀' }}
  </div>

  <div class="cs-badge">
    <span style="font-size: 8px;">●</span> COMING SOON
  </div>

  <h2 class="cs-title">{{ $moduleTitle ?? 'Module Under Development' }}</h2>
  
  <p class="cs-subtitle">
    {{ $moduleDesc ?? 'This mobile scanner module is scheduled in the upcoming enterprise update. Active WMS receiving and putaway features are available now!' }}
  </p>

  <div class="cs-card-info">
    <div class="cs-info-row">
      <span class="cs-info-lbl">Module Name:</span>
      <span class="cs-info-val">{{ $moduleTitle ?? 'Bin Movement & Transfer' }}</span>
    </div>
    <div class="cs-info-row">
      <span class="cs-info-lbl">Status:</span>
      <span class="cs-info-val" style="color: #D97706;">In Active Development</span>
    </div>
    <div class="cs-info-row">
      <span class="cs-info-lbl">Target Release:</span>
      <span class="cs-info-val" style="color: #16A34A;">Enterprise v2.5 Update</span>
    </div>
  </div>

  <div class="cs-actions">
    <a href="{{ route('pda.dashboard') }}" class="cs-btn-primary">
      <i class="bi bi-house-door-fill"></i>
      <span>Back to Scanner Home</span>
    </a>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
      <a href="{{ route('pda.receiving') }}" class="cs-btn-secondary">
        <i class="bi bi-truck" style="color: #16A34A;"></i>
        <span>Receiving</span>
      </a>
      <a href="{{ route('pda.putaway') }}" class="cs-btn-secondary">
        <i class="bi bi-grid-3x3-gap" style="color: #16A34A;"></i>
        <span>Putaway</span>
      </a>
    </div>
  </div>

</div>

@endsection
