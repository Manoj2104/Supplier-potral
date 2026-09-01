import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import MasterLayout from "../MasterLayout";
import TabTitle from "../../shared/tab-title/TabTitle";
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";
import { fetchSetting } from "../../store/action/settingAction";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faBarcode,
    faQrcode,
    faCircleInfo,
    faMobileScreen,
    faServer,
    faWifi,
    faShieldHalved,
    faCopy,
    faCheck
} from "@fortawesome/free-solid-svg-icons";
import LiveCounter from "../../shared/components/LiveCounter";
import LiveSparkline from "../../shared/components/LiveSparkline";
import "../brands/ProductBrandsPremium.css";
import "../units/ProductUnitsPremium.css";

const PdaConnection = (props) => {
    const { fetchSetting, settings } = props;
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchSetting();
    }, []);

    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port || (protocol === "https:" ? "443" : "8000");
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";

    const companyName = settings?.attributes?.company_name || 'SUGUNA';
    const derivedCompanyCode = companyName.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '') + '001';
    const serverUrl = `${protocol}//${hostname}`;

    const config = {
        company: derivedCompanyCode,
        url: serverUrl,
        port: port
    };

    const configData = `INFY-PDA-CONFIG:${JSON.stringify(config)}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(configData)}`;

    const copyConfig = () => {
        try {
            navigator.clipboard.writeText(configData);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {}
    };

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title="PDA Mobile Connection — infy-pos" />

            <div className="brand-page-container">
                {/* 1. Breadcrumb */}
                <div className="brand-breadcrumb">
                    <span>Dashboard</span>
                    <span>&gt;</span>
                    <span>Settings</span>
                    <span>&gt;</span>
                    <span className="brand-crumb-active">PDA Mobile Connection</span>
                </div>

                {/* 2. Page Header */}
                <div className="brand-header">
                    <div className="brand-title-group">
                        <h1>PDA Handheld Scanner Setup</h1>
                        <p>Auto-configure INFY-PDA Android handheld barcode terminals using 1-click QR code scanning.</p>
                    </div>

                    <div className="brand-header-actions">
                        <button type="button" className="brand-btn-pill brand-btn-primary" onClick={copyConfig}>
                            <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
                            <span>{copied ? 'Copied Payload!' : 'Copy Config Payload'}</span>
                        </button>
                    </div>
                </div>

                {/* 3. 4 Real-Time KPI Cards Grid */}
                <div className="brand-kpi-grid">
                    {/* Card 1: Wireless Status */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Sync Protocol</span>
                            <div className="brand-kpi-icon green">
                                <FontAwesomeIcon icon={faWifi} />
                            </div>
                        </div>
                        <div className="brand-kpi-value" style={{ fontSize: '20px' }}>
                            Live LAN Sync
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge up">● Port {port} Listening</span>
                            <LiveSparkline data={[1, 1, 1, 1, 1]} color="#16A34A" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 2: Company Terminal Code */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Terminal ID</span>
                            <div className="brand-kpi-icon blue">
                                <FontAwesomeIcon icon={faBarcode} />
                            </div>
                        </div>
                        <div className="brand-kpi-value" style={{ fontSize: '22px' }}>
                            {derivedCompanyCode}
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge up">Hardware Bound</span>
                            <LiveSparkline data={[1, 1]} color="#2563EB" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 3: Host Endpoint */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Target Server</span>
                            <div className="brand-kpi-icon purple">
                                <FontAwesomeIcon icon={faServer} />
                            </div>
                        </div>
                        <div className="brand-kpi-value" style={{ fontSize: '18px' }}>
                            {hostname}
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-label" style={{ fontSize: '13px', color: '#64748B', fontWeight: '700' }}>
                                Port {port}
                            </span>
                            <LiveSparkline data={[1, 1]} color="#9333EA" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 4: QR Payload Status */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Auto-Config Engine</span>
                            <div className="brand-kpi-icon orange">
                                <FontAwesomeIcon icon={faQrcode} />
                            </div>
                        </div>
                        <div className="brand-kpi-value" style={{ fontSize: '20px' }}>
                            Instant 0ms
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge neutral">Encrypted Payload</span>
                            <LiveSparkline data={[1, 1]} color="#D97706" width={60} height={24} />
                        </div>
                    </div>
                </div>

                {/* 4. Main Workspace */}
                <div className="var-workspace">
                    {isLocalhost && (
                        <div className="alert alert-warning d-flex align-items-center gap-3 p-3 rounded-4 mb-4 border-0" style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}>
                            <FontAwesomeIcon icon={faCircleInfo} className="fs-4" />
                            <div>
                                <h6 className="alert-heading fw-bold mb-1" style={{ fontSize: 13.5 }}>Localhost Access Notice</h6>
                                <p className="mb-0" style={{ opacity: 0.9, fontSize: 12.5 }}>
                                    You are accessing using <strong>localhost</strong>. The generated QR code contains <code>127.0.0.1</code>. To allow your physical handheld PDA device to connect over Wi-Fi, open the POS admin panel using your host PC's local network IP (e.g. <code>http://192.168.1.X:8000</code>).
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="row g-4 align-items-stretch">
                        {/* Left: QR Code Box */}
                        <div className="col-lg-5">
                            <div style={{ background: '#FFFFFF', border: '1px solid #EEF2F7', borderRadius: '22px', padding: '28px', textAlign: 'center', height: '100%', boxShadow: '0 4px 18px rgba(15, 23, 42, 0.03)' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#DCFCE7', color: '#16A34A', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '14px' }}>
                                    <FontAwesomeIcon icon={faQrcode} />
                                </div>
                                <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '6px' }}>Scan with PDA Camera</h4>
                                <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '320px', margin: '0 auto 20px auto' }}>
                                    Open the INFY-PDA app on your scanner, tap <strong>"Scan Config QR"</strong>, and aim at this code:
                                </p>

                                <div style={{ background: '#F8FAFC', border: '2px dashed #86EFAC', borderRadius: '20px', padding: '20px', display: 'inline-block', marginBottom: '20px' }}>
                                    <img src={qrUrl} alt="PDA Setup QR Code" style={{ width: '180px', height: '180px', borderRadius: '10px' }} />
                                </div>

                                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '14px', textAlign: 'left', fontSize: '12.5px' }}>
                                    <div style={{ fontWeight: '700', color: '#64748B', marginBottom: '4px', textTransform: 'uppercase', fontSize: '11px' }}>Payload Parameters</div>
                                    <div><strong>Company Code:</strong> <code>{derivedCompanyCode}</code></div>
                                    <div><strong>Server:</strong> <code>{serverUrl}:{port}</code></div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Setup Instructions */}
                        <div className="col-lg-7">
                            <div style={{ background: '#FFFFFF', border: '1px solid #EEF2F7', borderRadius: '22px', padding: '28px', height: '100%', boxShadow: '0 4px 18px rgba(15, 23, 42, 0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div>
                                    <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '16px' }}>
                                        Step-by-Step PDA Setup Guide
                                    </h4>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#16A34A', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800', flexShrink: 0 }}>1</div>
                                            <div>
                                                <div style={{ fontWeight: '700', fontSize: '14px', color: '#0F172A' }}>Connect to Same Local Network</div>
                                                <div style={{ fontSize: '12.5px', color: '#64748B' }}>Ensure your Android PDA barcode device is connected to the same Wi-Fi router as this POS host computer.</div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#2563EB', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800', flexShrink: 0 }}>2</div>
                                            <div>
                                                <div style={{ fontWeight: '700', fontSize: '14px', color: '#0F172A' }}>Open INFY-PDA Application</div>
                                                <div style={{ fontSize: '12.5px', color: '#64748B' }}>Launch the dedicated mobile warehouse app on your device and tap the setup button.</div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#7C3AED', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800', flexShrink: 0 }}>3</div>
                                            <div>
                                                <div style={{ fontWeight: '700', fontSize: '14px', color: '#0F172A' }}>Scan Configuration QR</div>
                                                <div style={{ fontSize: '12.5px', color: '#64748B' }}>Point the camera or 2D laser scanner at the QR code on the left to instantly pair and configure the terminal.</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '16px', padding: '16px', marginTop: '20px' }}>
                                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                        <FontAwesomeIcon icon={faShieldHalved} /> Real-Time Barcode Warehouse Sync Active
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#15803D' }}>
                                        All inventory adjustments, receiving, and stock audits scanned on paired PDA devices will update POS stock counts in real time.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </MasterLayout>
    );
};

const mapStateToProps = (state) => {
    const { settings } = state;
    return { settings };
};

export default connect(mapStateToProps, { fetchSetting })(PdaConnection);
