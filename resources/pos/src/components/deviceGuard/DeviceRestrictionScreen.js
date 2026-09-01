import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faLaptop,
    faMobileScreen,
    faTabletScreenButton,
    faCheck,
    faXmark,
    faCircleInfo,
    faArrowRight,
    faRotateRight,
    faShieldHalved
} from '@fortawesome/free-solid-svg-icons';
import './DeviceRestriction.css';

const DeviceRestrictionScreen = () => {
    const handleOpenPda = () => {
        window.location.href = '/pda';
    };

    const handleRefresh = () => {
        window.location.reload();
    };

    return (
        <div className="device-restriction-wrapper">
            {/* Background Animated Blobs */}
            <div className="device-bg-blob-1"></div>
            <div className="device-bg-blob-2"></div>

            <div className="device-restriction-card">
                <div className="row align-items-center g-5">
                    {/* LEFT COLUMN: Floating Laptop Illustration */}
                    <div className="col-lg-5 col-md-12 text-center device-illustration-column">
                        <div className="device-laptop-stage">
                            {/* SVG Laptop Artwork */}
                            <svg className="device-laptop-frame" viewBox="0 0 400 260" fill="none" xmlns="http://www.w3.org/2000/svg">
                                {/* Background Decorative Circle */}
                                <circle cx="200" cy="120" r="110" fill="#DCFCE7" fillOpacity="0.6" />
                                <circle cx="200" cy="120" r="85" stroke="#22C55E" strokeWidth="1.5" strokeDasharray="4 4" fill="none" />
                                
                                {/* Laptop Screen Base */}
                                <rect x="55" y="25" width="290" height="180" rx="14" fill="#0F172A" stroke="#334155" strokeWidth="4" />
                                <rect x="65" y="35" width="270" height="160" rx="8" fill="#FFFFFF" />
                                
                                {/* Screen Display Header */}
                                <rect x="65" y="35" width="270" height="28" fill="#F8FAFC" />
                                <circle cx="78" cy="49" r="4" fill="#EF4444" />
                                <circle cx="90" cy="49" r="4" fill="#F59E0B" />
                                <circle cx="102" cy="49" r="4" fill="#10B981" />
                                
                                {/* Infy-POS Logo inside Laptop Screen */}
                                <path d="M152 110 C 152 102, 160 96, 168 96 C 176 96, 184 104, 192 116 C 200 104, 208 96, 216 96 C 224 96, 232 102, 232 110 C 232 118, 224 124, 216 124 C 208 124, 200 116, 192 104 C 184 116, 176 124, 168 124 C 160 124, 152 118, 152 110 Z" fill="#22C55E" />
                                <text x="240" y="115" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="800" fontSize="18" fill="#0F172A">infy-pos</text>

                                {/* Laptop Base & Keyboard Hinge */}
                                <path d="M25 205 L375 205 C385 205, 390 212, 385 218 L365 225 C360 227, 40 227, 35 225 L15 218 C10 212, 15 205, 25 205 Z" fill="#94A3B8" />
                                <rect x="165" y="206" width="70" height="4" rx="2" fill="#64748B" />
                            </svg>

                            {/* Floating Verified Check Circle */}
                            <div className="device-verified-badge" title="Laptop Device Recommended">
                                <FontAwesomeIcon icon={faCheck} />
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Copywriting & Status Badges */}
                    <div className="col-lg-7 col-md-12">
                        <div className="d-flex align-items-center gap-2 mb-2">
                            <div className="d-inline-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F0FDF4', color: '#16A34A', border: '1px solid #DCFCE7' }}>
                                <FontAwesomeIcon icon={faLaptop} style={{ fontSize: '16px' }} />
                            </div>
                            <span className="fw-bold text-success" style={{ fontSize: '13px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Desktop Access Guard</span>
                        </div>

                        <h1 className="fw-extrabold text-dark mb-2 device-heading-title" style={{ letterSpacing: '-0.8px', fontWeight: 800, color: '#0F172A' }}>
                            Use Only <span style={{ color: '#16A34A' }}>Laptop Device</span>
                        </h1>

                        <p className="text-secondary mb-4 device-subtitle" style={{ lineHeight: '1.6', color: '#475569' }}>
                            INFY-POS is optimized for laptop/desktop experience to deliver the best performance, security, and enterprise functionality.
                        </p>

                        {/* Status Grid (Mobile Blocked | Tablet Blocked | Laptop Allowed) */}
                        <div className="device-status-grid">
                            <div className="device-status-card blocked">
                                <div className="device-status-icon">
                                    <FontAwesomeIcon icon={faMobileScreen} />
                                </div>
                                <div>
                                    <div className="device-status-title">Mobile Phone</div>
                                    <div className="device-status-subtitle">
                                        <FontAwesomeIcon icon={faXmark} className="me-1" /> Not Supported
                                    </div>
                                </div>
                            </div>

                            <div className="device-status-card blocked">
                                <div className="device-status-icon">
                                    <FontAwesomeIcon icon={faTabletScreenButton} />
                                </div>
                                <div>
                                    <div className="device-status-title">Tablet Device</div>
                                    <div className="device-status-subtitle">
                                        <FontAwesomeIcon icon={faXmark} className="me-1" /> Not Supported
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Informational Box */}
                        <div className="device-info-callout">
                            <FontAwesomeIcon icon={faCircleInfo} style={{ fontSize: '20px', flexShrink: 0 }} />
                            <div>
                                Only the <strong>PDA Portal</strong> is supported on mobile devices for warehouse scanning operations.
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="d-flex align-items-center gap-3 flex-wrap">
                            <button type="button" className="device-action-btn-primary" onClick={handleOpenPda}>
                                Open PDA Portal <FontAwesomeIcon icon={faArrowRight} />
                            </button>
                            <button type="button" className="device-action-btn-secondary" onClick={handleRefresh}>
                                <FontAwesomeIcon icon={faRotateRight} /> Refresh Page
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Brand Tagline */}
                <div className="device-footer-brand">
                    <div className="d-flex align-items-center gap-2">
                        <div className="device-footer-logo-box">
                            <FontAwesomeIcon icon={faShieldHalved} />
                        </div>
                        <div>
                            <div className="device-footer-text">infy-pos</div>
                            <div className="device-footer-tagline">Smart POS. Smarter Business.</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeviceRestrictionScreen;
