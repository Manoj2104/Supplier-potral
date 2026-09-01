@extends('pda.layout')

@section('title', 'Profile & Settings — infy-pos WMS')

@section('header_title', 'Profile & Settings')

@section('back_url', route('pda.dashboard'))

@section('head')
<style>
  .profile-user-card {
    background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 14px;
    padding: 16px; text-align: center; margin-bottom: 12px;
  }
  .profile-avatar {
    width: 60px; height: 60px; border-radius: 50%; background: #E5E7EB; color: #4B5563;
    display: flex; align-items: center; justify-content: center; font-size: 28px; margin: 0 auto 10px auto;
  }
  .settings-menu {
    background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 14px; overflow: hidden;
  }
  .settings-item {
    display: flex; align-items: center; justify-content: space-between; padding: 12px 14px;
    border-bottom: 1px solid #F3F4F6; text-decoration: none; color: #111827; font-size: 13px; font-weight: 600;
  }
  .settings-item:last-child { border-bottom: none; }
</style>
@endsection

@section('content')

<!-- Profile Card -->
<div class="profile-user-card">
  <div class="profile-avatar"><i class="bi bi-person"></i></div>
  <div style="font-size:16px;font-weight:800;color:#111827;">Manoj S</div>
  <div style="font-size:11.5px;color:#6B7280;font-weight:600;margin-top:2px;">WHO0125 • Receiver</div>
  <div style="font-size:11px;color:#059669;font-weight:700;margin-top:2px;">Main Warehouse • Shift A</div>
</div>

<!-- Settings Options List (Screen 17) -->
<div class="settings-menu">
  <a href="#" class="settings-item">
    <div style="display:flex;align-items:center;gap:10px;">
      <i class="bi bi-key" style="font-size:16px;color:#059669;"></i>
      <span>Change Password</span>
    </div>
    <i class="bi bi-chevron-right" style="color:#9CA3AF;"></i>
  </a>

  <a href="#" class="settings-item">
    <div style="display:flex;align-items:center;gap:10px;">
      <i class="bi bi-globe" style="font-size:16px;color:#2563EB;"></i>
      <span>Language</span>
    </div>
    <span style="font-size:11.5px;color:#6B7280;">English ›</span>
  </a>

  <a href="#" class="settings-item">
    <div style="display:flex;align-items:center;gap:10px;">
      <i class="bi bi-arrow-repeat" style="font-size:16px;color:#D97706;"></i>
      <span>Synchronization</span>
    </div>
    <span style="font-size:11px;color:#6B7280;">Last sync: 10:39 AM ›</span>
  </a>

  <a href="#" class="settings-item">
    <div style="display:flex;align-items:center;gap:10px;">
      <i class="bi bi-headset" style="font-size:16px;color:#7C3AED;"></i>
      <span>Help & Support</span>
    </div>
    <i class="bi bi-chevron-right" style="color:#9CA3AF;"></i>
  </a>

  <a href="#" class="settings-item">
    <div style="display:flex;align-items:center;gap:10px;">
      <i class="bi bi-info-circle" style="font-size:16px;color:#6B7280;"></i>
      <span>About App</span>
    </div>
    <i class="bi bi-chevron-right" style="color:#9CA3AF;"></i>
  </a>

  <a href="{{ route('pda.login') }}" class="settings-item" style="color:#DC2626;">
    <div style="display:flex;align-items:center;gap:10px;">
      <i class="bi bi-box-arrow-right" style="font-size:16px;color:#DC2626;"></i>
      <span style="font-weight:800;">Logout</span>
    </div>
    <i class="bi bi-chevron-right" style="color:#DC2626;"></i>
  </a>
</div>

@endsection
