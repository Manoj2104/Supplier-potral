@extends('supplier.layout')

@section('title', 'My Profile & Company Settings — Supplier Portal | Suguna')

@section('head')
<style>
/* ══════════════════════════════════════════════════════════════════════
   ENTERPRISE SUPPLIER PROFILE & COMPANY SETTINGS (LUXURY APPLE / SAAS)
   ══════════════════════════════════════════════════════════════════════ */

:root {
  --sp-primary: #15803D;
  --sp-primary-hover: #166534;
  --sp-primary-light: #DCFCE7;
  --sp-text-dark: #0F172A;
  --sp-text-muted: #64748B;
  --sp-text-light: #94A3B8;
  --sp-border: #EEF2F7;
  --sp-bg-light: #F8FAFC;
  --sp-radius-lg: 24px;
  --sp-radius-md: 16px;
  --sp-radius-sm: 10px;
}

.dashboard-page,
.dashboard-page * {
  font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
}

/* Outer Workspace Shell */
.dashboard-page.premium-workspace {
  margin: 12px 0 36px !important;
  padding: 28px 30px !important;
  border-radius: 24px !important;
  background: rgba(255, 255, 255, 0.88) !important;
  backdrop-filter: blur(24px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(24px) saturate(180%) !important;
  border: 1px solid rgba(255, 255, 255, 0.95) !important;
  box-shadow:
    0 0 0 1px rgba(15, 23, 42, 0.04),
    0 8px 32px rgba(15, 23, 42, 0.06),
    0 32px 64px rgba(15, 23, 42, 0.04) !important;
  box-sizing: border-box;
}

/* ── Breadcrumb ── */
.sp-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #64748B;
  margin-bottom: 12px;
}
.sp-breadcrumb a {
  color: #64748B;
  text-decoration: none;
  transition: color 150ms ease;
}
.sp-breadcrumb a:hover {
  color: #15803D;
}
.sp-breadcrumb i {
  font-size: 10px;
  color: #94A3B8;
}
.sp-breadcrumb .active {
  color: #16A34A;
  font-weight: 700;
}

/* ── Header Row ── */
.sp-page-intro-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 18px;
  margin-bottom: 24px;
}

.sp-page-title {
  font-size: 34px;
  font-weight: 800;
  color: #0F172A;
  letter-spacing: -0.02em;
  line-height: 1.15;
  margin: 0 0 4px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.sp-page-subtitle {
  font-size: 14.5px;
  color: #64748B;
  margin: 0;
  font-weight: 400;
  max-width: 680px;
  line-height: 1.45;
}

/* ── Action Buttons ── */
.sp-page-intro-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.sp-btn-pill {
  height: 42px !important;
  padding: 0 20px !important;
  border-radius: 9999px !important;
  font-size: 13.5px !important;
  font-weight: 700 !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1) !important;
  border: 1px solid #E2E8F0 !important;
  background: #FFFFFF !important;
  color: #0F172A !important;
  cursor: pointer !important;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04) !important;
  text-decoration: none !important;
  white-space: nowrap !important;
  line-height: 1 !important;
}

.sp-btn-pill:hover {
  background: #F8FAFC !important;
  border-color: #CBD5E1 !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08) !important;
  color: #0F172A !important;
}

.sp-btn-pill.sp-btn-primary {
  background: linear-gradient(135deg, #15803D 0%, #16A34A 100%) !important;
  color: #FFFFFF !important;
  border: none !important;
  box-shadow: 0 4px 14px rgba(22, 163, 74, 0.3) !important;
}

.sp-btn-pill.sp-btn-primary:hover {
  background: linear-gradient(135deg, #166534 0%, #15803D 100%) !important;
  transform: translateY(-1.5px) !important;
  box-shadow: 0 6px 18px rgba(22, 163, 74, 0.4) !important;
  color: #FFFFFF !important;
}

/* ── 2-Column Grid Layout ── */
.sp-profile-grid {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 24px;
  align-items: start;
}
@media (max-width: 1024px) {
  .sp-profile-grid { grid-template-columns: 1fr; }
}

/* ── Section Cards ── */
.sp-card-lux {
  background: #FFFFFF;
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-lg);
  padding: 26px 28px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.02);
}

.sp-section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 1px solid #F1F5F9;
}

.sp-section-title-wrap h2 {
  font-size: 17px;
  font-weight: 800;
  color: var(--sp-text-dark);
  margin: 0 0 3px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.sp-section-title-wrap p {
  font-size: 13px;
  color: var(--sp-text-muted);
  margin: 0;
}

/* Form Controls */
.sp-form-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
  margin-bottom: 18px;
}
@media (max-width: 640px) { .sp-form-grid-2 { grid-template-columns: 1fr; } }

.sp-form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sp-form-label {
  font-size: 12.5px;
  font-weight: 700;
  color: #334155;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sp-input-icon-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.sp-input-icon {
  position: absolute;
  left: 14px;
  color: #94A3B8;
  font-size: 15px;
  pointer-events: none;
}

.sp-form-input {
  width: 100%;
  height: 42px;
  padding: 0 14px 0 40px;
  border-radius: 12px;
  border: 1px solid #E2E8F0;
  font-size: 13.5px;
  font-weight: 500;
  color: #0F172A;
  background: #FFFFFF;
  outline: none;
  transition: all 180ms ease;
  box-sizing: border-box;
}

.sp-form-input.no-icon {
  padding-left: 14px;
}

.sp-form-input:focus {
  border-color: #16A34A;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
}

.sp-form-input:disabled {
  background: #F8FAFC;
  color: #64748B;
  cursor: not-allowed;
  border-color: #E2E8F0;
}

.sp-form-hint {
  font-size: 11.5px;
  color: #64748B;
  font-weight: 500;
}

/* Upload Box */
.sp-upload-card {
  border: 2px dashed #CBD5E1;
  border-radius: 16px;
  padding: 22px 18px;
  text-align: center;
  background: #F8FAFC;
  transition: all 180ms ease;
  cursor: pointer;
}
.sp-upload-card:hover {
  border-color: #16A34A;
  background: #F0FDF4;
}

.sp-upload-icon-circle {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 10px auto;
  font-size: 20px;
  color: #15803D;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
}

/* ── Sidebar Right Column ── */
.sp-profile-executive-card {
  background: #FFFFFF;
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-lg);
  padding: 28px 24px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.02);
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;
}

.sp-avatar-large {
  width: 88px;
  height: 88px;
  border-radius: 24px;
  background: linear-gradient(135deg, #15803D 0%, #16A34A 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34px;
  font-weight: 900;
  color: #FFFFFF;
  margin: 0 auto 16px auto;
  box-shadow: 0 8px 20px rgba(22, 163, 74, 0.28);
  border: 3px solid #FFFFFF;
  overflow: hidden;
}

.sp-avatar-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sp-verified-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #DCFCE7;
  color: #15803D;
  border: 1px solid #86EFAC;
  font-size: 11.5px;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 999px;
}

.sp-active-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #EFF6FF;
  color: #1D4ED8;
  border: 1px solid #BFDBFE;
  font-size: 11.5px;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 999px;
}

.sp-pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
  display: inline-block;
  animation: pulseDot 1.5s infinite;
}
@keyframes pulseDot {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.8; }
}

.sp-info-list {
  text-align: left;
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid #F1F5F9;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sp-info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #475569;
}
.sp-info-item i {
  color: #15803D;
  font-size: 15px;
  width: 18px;
  text-align: center;
}

/* Login History */
.sp-login-history-card {
  background: #FFFFFF;
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-lg);
  padding: 24px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.02);
}

.sp-session-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #F1F5F9;
}
.sp-session-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
</style>
@endsection

@section('content')

@php
  $supplierName = $supplierInfo->name ?? 'Jeyachandran Textile Private Limited';
  $supplierCode = $portal->supplier_code ?? 'SUP-00001';
  $supplierEmail = $supplierInfo->email ?? ($portal->username ?? 'manoj2104s@gmail.com');
  $supplierPhone = $portal->phone ?: ($supplierInfo->phone ?? '+918610006544');
  $supplierCity = $supplierInfo->city ?? 'Chennai';
  $supplierCountry = $supplierInfo->country ?? 'India';
  $initials = strtoupper(substr($supplierName, 0, 2));
@endphp

<div class="dashboard-page premium-workspace">

  <!-- ── 1. Breadcrumb Navigation ── -->
  <div class="sp-breadcrumb">
    <a href="{{ route('supplier.dashboard') }}">Dashboard</a>
    <i class="bi bi-chevron-right"></i>
    <span class="active">My Profile &amp; Company Settings</span>
  </div>

  <!-- ── 2. Top Header Row ── -->
  <div class="sp-page-intro-header">
    <div>
      <h1 class="sp-page-title">My Profile &amp; Settings 🏢</h1>
      <p class="sp-page-subtitle">Manage company verification credentials, tax registration (GST/PAN), bank settlements, and security access.</p>
    </div>

    <div class="sp-page-intro-actions">
      <a href="{{ route('supplier.dashboard') }}" class="sp-btn-pill">
        <i class="bi bi-speedometer2"></i> Dashboard
      </a>
      <button type="submit" form="companyProfileForm" class="sp-btn-pill sp-btn-primary">
        <i class="bi bi-floppy-fill"></i> Save Profile Changes
      </button>
    </div>
  </div>

  <!-- ── Flash Success / Error Messages ── -->
  @if(session('success'))
  <div style="background:#ECFDF5; border:1.5px solid #86EFAC; border-radius:14px; padding:14px 20px; margin-bottom:22px; color:#064E3B; font-weight:700; display:flex; align-items:center; gap:12px;">
    <i class="bi bi-check-circle-fill" style="font-size:20px; color:#15803D;"></i>
    <span>{{ session('success') }}</span>
  </div>
  @endif

  @if(session('error'))
  <div style="background:#FEE2E2; border:1.5px solid #FCA5A5; border-radius:14px; padding:14px 20px; margin-bottom:22px; color:#991B1B; font-weight:700; display:flex; align-items:center; gap:12px;">
    <i class="bi bi-exclamation-octagon-fill" style="font-size:20px; color:#DC2626;"></i>
    <span>{{ session('error') }}</span>
  </div>
  @endif

  <!-- ── 3. Main 2-Column Workspace Grid ── -->
  <div class="sp-profile-grid">

    <!-- ── LEFT COLUMN: EDITABLE FORMS ── -->
    <div>

      <!-- SECTION 1: Company & Contact Information -->
      <div class="sp-card-lux">
        <div class="sp-section-head">
          <div class="sp-section-title-wrap">
            <h2><i class="bi bi-building" style="color: #15803D;"></i> 1. Company Information</h2>
            <p>Official legal entity details registered on Suguna Supplier Network.</p>
          </div>
          <span class="sp-verified-pill">
            <i class="bi bi-shield-check"></i> Verified Entity
          </span>
        </div>

        <form id="companyProfileForm" action="{{ route('supplier.profile.update') }}" method="POST" enctype="multipart/form-data">
          @csrf

          <div class="sp-form-grid-2">
            <div class="sp-form-group">
              <label class="sp-form-label">
                Company Legal Name
                <small style="color:#94A3B8; font-weight:600;"><i class="bi bi-lock-fill"></i> Read-only</small>
              </label>
              <div class="sp-input-icon-wrap">
                <i class="bi bi-buildings sp-input-icon"></i>
                <input type="text" class="sp-form-input" value="{{ $supplierName }}" disabled>
              </div>
              <span class="sp-form-hint">Contact platform admin to update legal company title.</span>
            </div>

            <div class="sp-form-group">
              <label class="sp-form-label">
                Supplier Unique ID
                <small style="color:#94A3B8; font-weight:600;"><i class="bi bi-lock-fill"></i> Read-only</small>
              </label>
              <div class="sp-input-icon-wrap">
                <i class="bi bi-qr-code sp-input-icon"></i>
                <input type="text" class="sp-form-input" value="{{ $supplierCode }}" disabled style="font-family:monospace; font-weight:700;">
              </div>
            </div>
          </div>

          <div class="sp-form-grid-2">
            <div class="sp-form-group">
              <label class="sp-form-label">Primary Contact Person</label>
              <div class="sp-input-icon-wrap">
                <i class="bi bi-person sp-input-icon"></i>
                <input type="text" name="contact_person" class="sp-form-input" value="{{ old('contact_person', $portal->contact_person ?? 'Manoj Kumar') }}" placeholder="Primary contact name">
              </div>
            </div>

            <div class="sp-form-group">
              <label class="sp-form-label">
                Registered Email
                <small style="color:#94A3B8; font-weight:600;"><i class="bi bi-lock-fill"></i> Read-only</small>
              </label>
              <div class="sp-input-icon-wrap">
                <i class="bi bi-envelope sp-input-icon"></i>
                <input type="email" class="sp-form-input" value="{{ $supplierEmail }}" disabled>
              </div>
            </div>
          </div>

          <div class="sp-form-grid-2">
            <div class="sp-form-group">
              <label class="sp-form-label">Phone Number</label>
              <div class="sp-input-icon-wrap">
                <i class="bi bi-telephone sp-input-icon"></i>
                <input type="text" name="phone" class="sp-form-input" value="{{ old('phone', $supplierPhone) }}" placeholder="+91 98765 43210">
              </div>
            </div>

            <div class="sp-form-group">
              <label class="sp-form-label">Alternate Phone / WhatsApp</label>
              <div class="sp-input-icon-wrap">
                <i class="bi bi-phone sp-input-icon"></i>
                <input type="text" name="alt_phone" class="sp-form-input" value="{{ old('alt_phone', $portal->alt_phone) }}" placeholder="+91 98765 43211">
              </div>
            </div>
          </div>

          <div class="sp-form-grid-2">
            <div class="sp-form-group">
              <label class="sp-form-label">GSTIN Number</label>
              <div class="sp-input-icon-wrap">
                <i class="bi bi-receipt sp-input-icon"></i>
                <input type="text" name="gst" class="sp-form-input" value="{{ old('gst', $portal->gst ?? '33ABCDE1234F1Z5') }}" placeholder="e.g. 33ABCDE1234F1Z5" style="text-transform:uppercase; font-family:monospace;">
              </div>
            </div>

            <div class="sp-form-group">
              <label class="sp-form-label">PAN Number</label>
              <div class="sp-input-icon-wrap">
                <i class="bi bi-credit-card-2-front sp-input-icon"></i>
                <input type="text" name="pan" class="sp-form-input" value="{{ old('pan', $portal->pan ?? 'ABCDE1234F') }}" placeholder="e.g. ABCDE1234F" style="text-transform:uppercase; font-family:monospace;">
              </div>
            </div>
          </div>

          <!-- SECTION 2: Banking & Settlement -->
          <div style="margin: 28px 0 20px 0; padding-top: 20px; border-top: 1px solid #F1F5F9;">
            <div class="sp-section-title-wrap" style="margin-bottom:16px;">
              <h2><i class="bi bi-bank" style="color: #2563EB;"></i> 2. Bank &amp; Settlement Details</h2>
              <p>Direct bank account for receiving automated payment settlements.</p>
            </div>

            <div class="sp-form-grid-2">
              <div class="sp-form-group">
                <label class="sp-form-label">Bank Name</label>
                <div class="sp-input-icon-wrap">
                  <i class="bi bi-bank2 sp-input-icon"></i>
                  <input type="text" name="bank_name" class="sp-form-input" value="{{ old('bank_name', $portal->bank_name ?? 'HDFC Bank Ltd.') }}" placeholder="e.g. HDFC Bank">
                </div>
              </div>

              <div class="sp-form-group">
                <label class="sp-form-label">Account Number</label>
                <div class="sp-input-icon-wrap">
                  <i class="bi bi-123 sp-input-icon"></i>
                  <input type="text" name="account_number" class="sp-form-input" value="{{ old('account_number', $portal->account_number ?? '50200012345678') }}" placeholder="Account number" style="font-family:monospace;">
                </div>
              </div>
            </div>

            <div class="sp-form-grid-2">
              <div class="sp-form-group">
                <label class="sp-form-label">IFSC Code</label>
                <div class="sp-input-icon-wrap">
                  <i class="bi bi-hash sp-input-icon"></i>
                  <input type="text" name="ifsc" class="sp-form-input" value="{{ old('ifsc', $portal->ifsc ?? 'HDFC0001234') }}" placeholder="e.g. HDFC0001234" style="text-transform:uppercase; font-family:monospace;">
                </div>
              </div>

              <div class="sp-form-group">
                <label class="sp-form-label">UPI ID / VPA</label>
                <div class="sp-input-icon-wrap">
                  <i class="bi bi-qr-code sp-input-icon"></i>
                  <input type="text" name="upi" class="sp-form-input" value="{{ old('upi', $portal->upi ?? 'jeyachandran@hdfcbank') }}" placeholder="e.g. company@upi">
                </div>
              </div>
            </div>
          </div>

          <!-- SECTION 3: Profile & Branding Media -->
          <div style="margin: 28px 0 20px 0; padding-top: 20px; border-top: 1px solid #F1F5F9;">
            <div class="sp-section-title-wrap" style="margin-bottom:16px;">
              <h2><i class="bi bi-image" style="color: #D97706;"></i> 3. Branding &amp; Media Assets</h2>
              <p>Upload profile avatar and company logo for invoices &amp; packing slips.</p>
            </div>

            <div class="sp-form-grid-2">
              <div class="sp-upload-card" onclick="document.getElementById('inpProfileImg').click()">
                <input type="file" id="inpProfileImg" name="profile_image" accept="image/*" style="display:none;" onchange="previewUploadName(this, 'profilePreviewText')">
                <div class="sp-upload-icon-circle">
                  <i class="bi bi-person-bounding-box"></i>
                </div>
                <strong style="font-size:13.5px; color:#0F172A; display:block;" id="profilePreviewText">
                  {{ $portal->profile_image ? 'Change Profile Avatar' : 'Upload Profile Avatar' }}
                </strong>
                <span class="sp-form-hint">JPG, PNG up to 2MB</span>
              </div>

              <div class="sp-upload-card" onclick="document.getElementById('inpCompanyLogo').click()">
                <input type="file" id="inpCompanyLogo" name="company_logo" accept="image/*" style="display:none;" onchange="previewUploadName(this, 'logoPreviewText')">
                <div class="sp-upload-icon-circle" style="color:#2563EB;">
                  <i class="bi bi-building"></i>
                </div>
                <strong style="font-size:13.5px; color:#0F172A; display:block;" id="logoPreviewText">
                  {{ $portal->company_logo ? 'Change Company Logo' : 'Upload Company Logo' }}
                </strong>
                <span class="sp-form-hint">JPG, PNG, SVG up to 2MB</span>
              </div>
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end; padding-top:14px;">
            <button type="submit" class="sp-btn-pill sp-btn-primary" style="height:44px; padding:0 24px;">
              <i class="bi bi-check2-circle"></i> Save All Changes
            </button>
          </div>
        </form>
      </div>

      <!-- SECTION 4: Change Password Card -->
      <div class="sp-card-lux" id="password-section" style="scroll-margin-top: 90px; transition: all 0.3s ease;">
        <div class="sp-section-head">
          <div class="sp-section-title-wrap">
            <h2><i class="bi bi-shield-lock" style="color: #7E22CE;"></i> 4. Change Account Password</h2>
            <p>Ensure your supplier portal credentials remain secure with a strong password.</p>
          </div>
        </div>

        <form action="{{ route('supplier.change-password') }}" method="POST">
          @csrf

          <div class="sp-form-group" style="margin-bottom:16px;">
            <label class="sp-form-label">Current Password <span style="color:#DC2626;">*</span></label>
            <div class="sp-input-icon-wrap">
              <i class="bi bi-key sp-input-icon"></i>
              <input type="password" name="current_password" class="sp-form-input" required placeholder="Enter current account password">
            </div>
            @error('current_password')
            <span style="font-size:12px; color:#DC2626; font-weight:700; margin-top:2px;">⚠️ {{ $message }}</span>
            @enderror
          </div>

          <div class="sp-form-grid-2">
            <div class="sp-form-group">
              <label class="sp-form-label">New Password <span style="color:#DC2626;">*</span></label>
              <div class="sp-input-icon-wrap">
                <i class="bi bi-lock sp-input-icon"></i>
                <input type="password" name="password" class="sp-form-input" required placeholder="Minimum 8 characters" minlength="8">
              </div>
            </div>

            <div class="sp-form-group">
              <label class="sp-form-label">Confirm New Password <span style="color:#DC2626;">*</span></label>
              <div class="sp-input-icon-wrap">
                <i class="bi bi-lock-fill sp-input-icon"></i>
                <input type="password" name="password_confirmation" class="sp-form-input" required placeholder="Re-type new password">
              </div>
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end; padding-top:10px;">
            <button type="submit" class="sp-btn-pill" style="border-color:#CBD5E1; color:#0F172A;">
              <i class="bi bi-key-fill"></i> Update Password
            </button>
          </div>
        </form>
      </div>

    </div>

    <!-- ── RIGHT COLUMN: EXECUTIVE SUMMARY & SECURITY ── -->
    <div>

      <!-- Executive Profile Card -->
      <div class="sp-profile-executive-card">
        <div class="sp-avatar-large">
          @if($portal->profile_image)
            <img src="{{ asset('storage/'.$portal->profile_image) }}" alt="Avatar">
          @else
            {{ $initials }}
          @endif
        </div>

        <h3 style="font-size:18px; font-weight:900; color:#0F172A; margin:0 0 4px 0; line-height:1.3;">
          {{ $supplierName }}
        </h3>
        <div style="font-size:13px; font-weight:700; color:#15803D; font-family:monospace; margin-bottom:12px;">
          {{ $supplierCode }}
        </div>

        <div style="display:flex; align-items:center; justify-content:center; gap:8px; flex-wrap:wrap; margin-bottom:16px;">
          <span class="sp-verified-pill">
            <i class="bi bi-patch-check-fill"></i> KYC: Verified
          </span>
          <span class="sp-active-pill">
            <span class="sp-pulse-dot"></span> Active Supplier
          </span>
        </div>

        <div style="display:flex; justify-content:center; align-items:center; gap:4px; font-size:13px; color:#F59E0B; margin-bottom:16px;">
          <i class="bi bi-star-fill"></i>
          <i class="bi bi-star-fill"></i>
          <i class="bi bi-star-fill"></i>
          <i class="bi bi-star-fill"></i>
          <i class="bi bi-star-fill"></i>
          <strong style="color:#0F172A; font-size:12.5px; margin-left:4px;">5.0 Rating</strong>
        </div>

        <div class="sp-info-list">
          <div class="sp-info-item">
            <i class="bi bi-envelope"></i>
            <span style="word-break:break-all;">{{ $supplierEmail }}</span>
          </div>
          <div class="sp-info-item">
            <i class="bi bi-telephone"></i>
            <span>{{ $supplierPhone }}</span>
          </div>
          <div class="sp-info-item">
            <i class="bi bi-geo-alt"></i>
            <span>{{ $supplierCity }}, {{ $supplierCountry }}</span>
          </div>
          <div class="sp-info-item">
            <i class="bi bi-building-check"></i>
            <span>Main Fulfillment Warehouse</span>
          </div>
        </div>
      </div>

      <!-- Login & Security History Card -->
      <div class="sp-login-history-card">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; padding-bottom:10px; border-bottom:1px solid #F1F5F9;">
          <strong style="font-size:14px; color:#0F172A; display:flex; align-items:center; gap:6px;">
            <i class="bi bi-clock-history" style="color:#2563EB;"></i> Recent Login History
          </strong>
          <span style="font-size:11px; color:#64748B; font-weight:700;">Last 10 Sessions</span>
        </div>

        <div>
          @forelse($loginHistory as $session)
          <div class="sp-session-row">
            <div>
              <div style="font-size:12.5px; font-weight:700; color:#0F172A;">
                {{ $session->browser ?? 'Chrome on Desktop' }}
              </div>
              <div style="font-size:11.5px; color:#64748B; font-family:monospace;">
                IP: {{ $session->ip_address ?? '127.0.0.1' }}
              </div>
            </div>
            <div style="font-size:11.5px; color:#94A3B8; font-weight:600;">
              {{ $session->login_at ? $session->login_at->diffForHumans() : 'Just now' }}
            </div>
          </div>
          @empty
          <div class="sp-session-row">
            <div>
              <div style="font-size:12.5px; font-weight:700; color:#0F172A;">Chrome on Windows</div>
              <div style="font-size:11.5px; color:#64748B; font-family:monospace;">IP: 127.0.0.1</div>
            </div>
            <div style="font-size:11.5px; color:#94A3B8; font-weight:600;">Active Now</div>
          </div>
          @endforelse
        </div>
      </div>

    </div>

  </div>

</div>

<script>
function previewUploadName(input, labelId) {
  if (input.files && input.files[0]) {
    document.getElementById(labelId).innerText = 'Selected: ' + input.files[0].name;
  }
}

document.addEventListener('DOMContentLoaded', function() {
  if (window.location.hash === '#password-section') {
    const pwSec = document.getElementById('password-section');
    if (pwSec) {
      setTimeout(() => {
        pwSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        pwSec.style.boxShadow = '0 0 0 3px rgba(217, 119, 6, 0.35)';
        pwSec.style.borderColor = '#D97706';
        setTimeout(() => {
          pwSec.style.boxShadow = '';
          pwSec.style.borderColor = '';
        }, 3000);
      }, 200);
    }
  }
});
</script>
@endsection
