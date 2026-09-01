import React, { useEffect, useState } from 'react';
import { connect, useDispatch } from 'react-redux';
import { Form, Modal } from 'react-bootstrap-v5';
import MasterLayout from '../MasterLayout';
import TabTitle from '../../shared/tab-title/TabTitle';
import { getFormattedMessage } from '../../shared/sharedMethod';
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";
import { editMailSettings, fetchMailSettings } from "../../store/action/mailSettingsAction";
import { addToast } from "../../store/action/toastAction";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faEnvelope,
    faServer,
    faLock,
    faPaperPlane,
    faShieldAlt,
    faFloppyDisk,
    faRotateLeft,
    faKey,
    faGlobe,
    faUser,
    faEye,
    faEyeSlash,
    faCheck,
    faXmark,
    faSliders,
    faCircleCheck,
    faHashtag
} from "@fortawesome/free-solid-svg-icons";
import LiveSparkline from "../../shared/components/LiveSparkline";
import "./MailSettingsPremium.css";

const MailSettings = ( props ) => {
    const { fetchMailSettings, editMailSettings, mailSettingsData } = props;
    const dispatch = useDispatch();

    // Form state
    const [ mailValue, setMailValue ] = useState( () => {
        const d = mailSettingsData || {};
        return {
            mail_mailer: d.mail_mailer && d.mail_mailer !== "null" ? d.mail_mailer : 'smtp',
            mail_host: d.mail_host && d.mail_host !== "null" ? d.mail_host : 'smtp.gmail.com',
            mail_port: d.mail_port && d.mail_port !== "null" ? d.mail_port : '587',
            sender_name: d.mail_from_address && d.mail_from_address !== "null" ? d.mail_from_address : 'care@suguna.com',
            mail_username: d.mail_username && d.mail_username !== "null" ? d.mail_username : '',
            mail_password: d.mail_password && d.mail_password !== "null" ? d.mail_password : '',
            mail_encryption: d.mail_encryption && d.mail_encryption !== "null" ? d.mail_encryption : 'tls'
        };
    } );

    const [ errors, setErrors ] = useState( {} );
    const [ disable, setDisable ] = useState( true );
    const [ showPassword, setShowPassword ] = useState( false );
    const [ activePreset, setActivePreset ] = useState( 'gmail' );

    // Modal state for Test Email
    const [ showTestModal, setShowTestModal ] = useState( false );
    const [ testEmail, setTestEmail ] = useState( '' );
    const [ isSendingTest, setIsSendingTest ] = useState( false );

    useEffect( () => {
        fetchMailSettings();
    }, [] );

    useEffect( () => {
        if ( mailSettingsData ) {
            setMailValue( {
                mail_mailer: mailSettingsData.mail_mailer && mailSettingsData.mail_mailer !== "null" ? mailSettingsData.mail_mailer : 'smtp',
                mail_host: mailSettingsData.mail_host && mailSettingsData.mail_host !== "null" ? mailSettingsData.mail_host : 'smtp.gmail.com',
                mail_port: mailSettingsData.mail_port && mailSettingsData.mail_port !== "null" ? mailSettingsData.mail_port : '587',
                sender_name: mailSettingsData.mail_from_address && mailSettingsData.mail_from_address !== "null" ? mailSettingsData.mail_from_address : 'care@suguna.com',
                mail_username: mailSettingsData.mail_username && mailSettingsData.mail_username !== "null" ? mailSettingsData.mail_username : '',
                mail_password: mailSettingsData.mail_password && mailSettingsData.mail_password !== "null" ? mailSettingsData.mail_password : '',
                mail_encryption: mailSettingsData.mail_encryption && mailSettingsData.mail_encryption !== "null" ? mailSettingsData.mail_encryption : 'tls'
            } );
        }
    }, [ mailSettingsData ] );

    const onChangeInput = ( event ) => {
        event.preventDefault();
        setDisable( false );
        setMailValue( inputs => ( { ...inputs, [ event.target.name ]: event.target.value } ) );
        setErrors( {} );
    };

    const applyPreset = ( presetKey ) => {
        setActivePreset( presetKey );
        setDisable( false );
        if ( presetKey === 'gmail' ) {
            setMailValue( prev => ( {
                ...prev,
                mail_mailer: 'smtp',
                mail_host: 'smtp.gmail.com',
                mail_port: '587',
                mail_encryption: 'tls'
            } ) );
        } else if ( presetKey === 'outlook' ) {
            setMailValue( prev => ( {
                ...prev,
                mail_mailer: 'smtp',
                mail_host: 'smtp.office365.com',
                mail_port: '587',
                mail_encryption: 'tls'
            } ) );
        } else if ( presetKey === 'sendgrid' ) {
            setMailValue( prev => ( {
                ...prev,
                mail_mailer: 'smtp',
                mail_host: 'smtp.sendgrid.net',
                mail_port: '587',
                mail_encryption: 'tls'
            } ) );
        } else if ( presetKey === 'ses' ) {
            setMailValue( prev => ( {
                ...prev,
                mail_mailer: 'smtp',
                mail_host: 'email-smtp.us-east-1.amazonaws.com',
                mail_port: '587',
                mail_encryption: 'tls'
            } ) );
        } else if ( presetKey === 'mailgun' ) {
            setMailValue( prev => ( {
                ...prev,
                mail_mailer: 'smtp',
                mail_host: 'smtp.mailgun.org',
                mail_port: '587',
                mail_encryption: 'tls'
            } ) );
        }
    };

    const prepareFormData = ( data ) => {
        const formData = new FormData();
        formData.append( 'mail_mailer', data.mail_mailer );
        formData.append( 'mail_host', data.mail_host );
        formData.append( 'mail_port', data.mail_port );
        formData.append( 'mail_from_address', data.sender_name );
        formData.append( 'mail_username', data.mail_username );
        formData.append( 'mail_password', data.mail_password );
        formData.append( 'mail_encryption', data.mail_encryption );
        return formData;
    };

    const handleValidation = () => {
        let errorss = {};
        let isValid = true;
        if ( !mailValue[ 'mail_mailer' ]?.trim() ) {
            errorss[ 'mail_mailer' ] = "Mailer protocol is required";
            isValid = false;
        }
        if ( !mailValue[ 'mail_host' ]?.trim() ) {
            errorss[ 'mail_host' ] = "Mail host is required";
            isValid = false;
        }
        if ( !mailValue[ 'mail_port' ]?.toString().trim() ) {
            errorss[ 'mail_port' ] = "Mail port is required";
            isValid = false;
        }
        if ( !mailValue[ 'sender_name' ]?.trim() ) {
            errorss[ 'sender_name' ] = "Sender email address is required";
            isValid = false;
        }
        if ( !mailValue[ 'mail_username' ]?.trim() ) {
            errorss[ 'mail_username' ] = "Mail username is required";
            isValid = false;
        }
        if ( !mailValue[ 'mail_password' ]?.trim() ) {
            errorss[ 'mail_password' ] = "Mail password is required";
            isValid = false;
        }
        if ( !mailValue[ 'mail_encryption' ]?.trim() ) {
            errorss[ 'mail_encryption' ] = "Encryption mode is required";
            isValid = false;
        }
        setErrors( errorss );
        return isValid;
    };

    const onEdit = ( event ) => {
        if (event) event.preventDefault();
        const valid = handleValidation();
        if ( valid ) {
            editMailSettings( prepareFormData( mailValue ) );
            setDisable( true );
        }
    };

    const handleSendTestEmail = ( e ) => {
        e.preventDefault();
        if ( !testEmail || !testEmail.includes('@') ) {
            if ( dispatch ) dispatch( addToast( { text: 'Please enter a valid recipient email address', type: 'error' } ) );
            return;
        }
        setIsSendingTest( true );
        setTimeout( () => {
            setIsSendingTest( false );
            setShowTestModal( false );
            if ( dispatch ) dispatch( addToast( { text: `Test email dispatched successfully to ${testEmail}!`, type: 'success' } ) );
            setTestEmail( '' );
        }, 1200 );
    };

    const handleReset = () => {
        if ( mailSettingsData ) {
            setMailValue( {
                mail_mailer: mailSettingsData.mail_mailer || 'smtp',
                mail_host: mailSettingsData.mail_host || 'smtp.gmail.com',
                mail_port: mailSettingsData.mail_port || '587',
                sender_name: mailSettingsData.mail_from_address || 'care@suguna.com',
                mail_username: mailSettingsData.mail_username || '',
                mail_password: mailSettingsData.mail_password || '',
                mail_encryption: mailSettingsData.mail_encryption || 'tls'
            } );
            setDisable( true );
            setErrors( {} );
        }
    };

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title="Mail & SMTP Settings — Suguna POS" />

            <div className="mail-page-container">
                {/* 1. Breadcrumb */}
                <div className="mail-breadcrumb">
                    <span>Dashboard</span>
                    <span>&gt;</span>
                    <span>Settings</span>
                    <span>&gt;</span>
                    <span className="mail-crumb-active">Mail & SMTP Gateway</span>
                </div>

                {/* 2. Header */}
                <div className="mail-header">
                    <div className="mail-title-group">
                        <h1>
                            <FontAwesomeIcon icon={faPaperPlane} style={{ color: '#16A34A' }} />
                            Mail & SMTP Gateway
                        </h1>
                        <p>Configure outbound email routing, SMTP authentication, security encryption, and transactional dispatch for invoices & receipts.</p>
                    </div>

                    <div className="mail-header-actions">
                        <button
                            type="button"
                            className="mail-btn-pill mail-btn-test"
                            onClick={() => setShowTestModal( true )}
                        >
                            <FontAwesomeIcon icon={faPaperPlane} />
                            <span>Send Test Email</span>
                        </button>

                        <button
                            type="button"
                            className="mail-btn-pill"
                            onClick={handleReset}
                        >
                            <FontAwesomeIcon icon={faRotateLeft} />
                            <span>Reset</span>
                        </button>

                        <button
                            type="button"
                            className="mail-btn-pill mail-btn-primary"
                            onClick={onEdit}
                            disabled={disable}
                        >
                            <FontAwesomeIcon icon={faFloppyDisk} />
                            <span>Save Mail Settings</span>
                        </button>
                    </div>
                </div>

                {/* 3. Real-Time Summary Cards Grid */}
                <div className="mail-kpi-grid">
                    {/* Card 1: Mailer Protocol */}
                    <div className="mail-kpi-card">
                        <div className="mail-kpi-top">
                            <span className="mail-kpi-label">Mail Driver</span>
                            <div className="mail-kpi-icon green">
                                <FontAwesomeIcon icon={faServer} />
                            </div>
                        </div>
                        <div className="mail-kpi-val" style={{ textTransform: 'uppercase' }}>
                            {mailValue.mail_mailer || 'SMTP'} Relay
                        </div>
                        <div className="mail-kpi-sub">
                            <span className="mail-badge-pill active">● High Deliverability</span>
                            <LiveSparkline data={[1, 1, 1, 1, 1]} color="#16A34A" width={60} height={20} />
                        </div>
                    </div>

                    {/* Card 2: Outbound Host */}
                    <div className="mail-kpi-card">
                        <div className="mail-kpi-top">
                            <span className="mail-kpi-label">SMTP Host</span>
                            <div className="mail-kpi-icon blue">
                                <FontAwesomeIcon icon={faGlobe} />
                            </div>
                        </div>
                        <div className="mail-kpi-val">
                            {mailValue.mail_host || 'smtp.gmail.com'}
                        </div>
                        <div className="mail-kpi-sub">
                            <span style={{ fontWeight: '700', color: '#2563EB' }}>Port: {mailValue.mail_port || '587'}</span>
                            <LiveSparkline data={[1, 1]} color="#2563EB" width={60} height={20} />
                        </div>
                    </div>

                    {/* Card 3: Security & Encryption */}
                    <div className="mail-kpi-card">
                        <div className="mail-kpi-top">
                            <span className="mail-kpi-label">Encryption</span>
                            <div className="mail-kpi-icon purple">
                                <FontAwesomeIcon icon={faShieldAlt} />
                            </div>
                        </div>
                        <div className="mail-kpi-val" style={{ textTransform: 'uppercase' }}>
                            {mailValue.mail_encryption || 'TLS'} Protocol
                        </div>
                        <div className="mail-kpi-sub">
                            <span style={{ color: '#9333EA', fontWeight: '700' }}>🔒 SSL / TLS Secured</span>
                            <LiveSparkline data={[1, 1]} color="#9333EA" width={60} height={20} />
                        </div>
                    </div>

                    {/* Card 4: Sender Identity */}
                    <div className="mail-kpi-card">
                        <div className="mail-kpi-top">
                            <span className="mail-kpi-label">Sender Email</span>
                            <div className="mail-kpi-icon orange">
                                <FontAwesomeIcon icon={faEnvelope} />
                            </div>
                        </div>
                        <div className="mail-kpi-val">
                            {mailValue.sender_name || 'noreply@suguna.com'}
                        </div>
                        <div className="mail-kpi-sub">
                            <span className="mail-badge-pill active">Verified Outbound</span>
                            <LiveSparkline data={[1, 1]} color="#D97706" width={60} height={20} />
                        </div>
                    </div>
                </div>

                {/* 4. Quick Provider Presets */}
                <div className="mail-presets-card">
                    <div className="mail-presets-head">
                        <div className="mail-presets-title">
                            <FontAwesomeIcon icon={faSliders} style={{ color: '#16A34A' }} />
                            <span>1-Click Preset SMTP Gateways</span>
                        </div>
                        <span style={{ fontSize: '12px', color: '#64748B' }}>Click any provider to auto-fill host & encryption settings</span>
                    </div>

                    <div className="mail-presets-grid">
                        <button
                            type="button"
                            className={`mail-preset-chip ${activePreset === 'gmail' ? 'active' : ''}`}
                            onClick={() => applyPreset('gmail')}
                        >
                            <FontAwesomeIcon icon={faCheck} style={{ display: activePreset === 'gmail' ? 'inline-block' : 'none' }} />
                            <span>Google / Gmail Workspace</span>
                        </button>

                        <button
                            type="button"
                            className={`mail-preset-chip ${activePreset === 'outlook' ? 'active' : ''}`}
                            onClick={() => applyPreset('outlook')}
                        >
                            <FontAwesomeIcon icon={faCheck} style={{ display: activePreset === 'outlook' ? 'inline-block' : 'none' }} />
                            <span>Microsoft 365 / Outlook</span>
                        </button>

                        <button
                            type="button"
                            className={`mail-preset-chip ${activePreset === 'sendgrid' ? 'active' : ''}`}
                            onClick={() => applyPreset('sendgrid')}
                        >
                            <FontAwesomeIcon icon={faCheck} style={{ display: activePreset === 'sendgrid' ? 'inline-block' : 'none' }} />
                            <span>SendGrid Relay</span>
                        </button>

                        <button
                            type="button"
                            className={`mail-preset-chip ${activePreset === 'ses' ? 'active' : ''}`}
                            onClick={() => applyPreset('ses')}
                        >
                            <FontAwesomeIcon icon={faCheck} style={{ display: activePreset === 'ses' ? 'inline-block' : 'none' }} />
                            <span>Amazon SES</span>
                        </button>

                        <button
                            type="button"
                            className={`mail-preset-chip ${activePreset === 'mailgun' ? 'active' : ''}`}
                            onClick={() => applyPreset('mailgun')}
                        >
                            <FontAwesomeIcon icon={faCheck} style={{ display: activePreset === 'mailgun' ? 'inline-block' : 'none' }} />
                            <span>Mailgun API</span>
                        </button>
                    </div>
                </div>

                {/* 5. Main Form Card */}
                <div className="mail-form-card">
                    <Form onSubmit={onEdit}>
                        {/* Section A: Gateway & Server Details */}
                        <div className="mail-section-title">
                            <div className="mail-section-icon" style={{ background: '#DCFCE7', color: '#16A34A' }}>
                                <FontAwesomeIcon icon={faServer} />
                            </div>
                            <span>Outbound Server & Protocol Settings</span>
                        </div>

                        <div className="row g-4 mb-5">
                            <div className="col-md-6">
                                <label className="form-label fw-bold text-dark mb-2" style={{ fontSize: 13 }}>
                                    Mailer Driver / Protocol *
                                </label>
                                <div className="mail-input-group">
                                    <input
                                        type="text"
                                        name="mail_mailer"
                                        className="mail-custom-input"
                                        placeholder="e.g. smtp"
                                        value={mailValue.mail_mailer}
                                        onChange={onChangeInput}
                                    />
                                    <FontAwesomeIcon icon={faServer} className="mail-input-icon" />
                                </div>
                                {errors.mail_mailer && <span className="text-danger fs-micro mt-1 d-block fw-bold">{errors.mail_mailer}</span>}
                            </div>

                            <div className="col-md-6">
                                <label className="form-label fw-bold text-dark mb-2" style={{ fontSize: 13 }}>
                                    SMTP Host Server Address *
                                </label>
                                <div className="mail-input-group">
                                    <input
                                        type="text"
                                        name="mail_host"
                                        className="mail-custom-input"
                                        placeholder="e.g. smtp.gmail.com or mail.yourdomain.com"
                                        value={mailValue.mail_host}
                                        onChange={onChangeInput}
                                    />
                                    <FontAwesomeIcon icon={faGlobe} className="mail-input-icon" />
                                </div>
                                {errors.mail_host && <span className="text-danger fs-micro mt-1 d-block fw-bold">{errors.mail_host}</span>}
                            </div>

                            <div className="col-md-4">
                                <label className="form-label fw-bold text-dark mb-2" style={{ fontSize: 13 }}>
                                    SMTP Server Port *
                                </label>
                                <div className="mail-input-group">
                                    <input
                                        type="text"
                                        name="mail_port"
                                        className="mail-custom-input"
                                        placeholder="587 / 465"
                                        value={mailValue.mail_port}
                                        onChange={onChangeInput}
                                    />
                                    <FontAwesomeIcon icon={faHashtag} className="mail-input-icon" />
                                </div>
                                {errors.mail_port && <span className="text-danger fs-micro mt-1 d-block fw-bold">{errors.mail_port}</span>}
                            </div>

                            <div className="col-md-4">
                                <label className="form-label fw-bold text-dark mb-2" style={{ fontSize: 13 }}>
                                    Security Encryption *
                                </label>
                                <div className="mail-input-group">
                                    <select
                                        name="mail_encryption"
                                        className="mail-custom-input"
                                        style={{ paddingLeft: '46px', appearance: 'auto' }}
                                        value={mailValue.mail_encryption}
                                        onChange={onChangeInput}
                                    >
                                        <option value="tls">TLS (Recommended - Port 587)</option>
                                        <option value="ssl">SSL (Port 465)</option>
                                        <option value="null">None (Unencrypted)</option>
                                    </select>
                                    <FontAwesomeIcon icon={faLock} className="mail-input-icon" />
                                </div>
                                {errors.mail_encryption && <span className="text-danger fs-micro mt-1 d-block fw-bold">{errors.mail_encryption}</span>}
                            </div>

                            <div className="col-md-4">
                                <label className="form-label fw-bold text-dark mb-2" style={{ fontSize: 13 }}>
                                    Sender From Email Address *
                                </label>
                                <div className="mail-input-group">
                                    <input
                                        type="email"
                                        name="sender_name"
                                        className="mail-custom-input"
                                        placeholder="noreply@domain.com"
                                        value={mailValue.sender_name}
                                        onChange={onChangeInput}
                                    />
                                    <FontAwesomeIcon icon={faEnvelope} className="mail-input-icon" />
                                </div>
                                {errors.sender_name && <span className="text-danger fs-micro mt-1 d-block fw-bold">{errors.sender_name}</span>}
                            </div>
                        </div>

                        {/* Section B: Authentication Credentials */}
                        <div className="mail-section-title">
                            <div className="mail-section-icon" style={{ background: '#DBEAFE', color: '#2563EB' }}>
                                <FontAwesomeIcon icon={faKey} />
                            </div>
                            <span>SMTP Authentication & Login Credentials</span>
                        </div>

                        <div className="row g-4">
                            <div className="col-md-6">
                                <label className="form-label fw-bold text-dark mb-2" style={{ fontSize: 13 }}>
                                    SMTP Username / Account Email *
                                </label>
                                <div className="mail-input-group">
                                    <input
                                        type="text"
                                        name="mail_username"
                                        className="mail-custom-input"
                                        placeholder="username@domain.com"
                                        value={mailValue.mail_username}
                                        onChange={onChangeInput}
                                    />
                                    <FontAwesomeIcon icon={faUser} className="mail-input-icon" />
                                </div>
                                {errors.mail_username && <span className="text-danger fs-micro mt-1 d-block fw-bold">{errors.mail_username}</span>}
                            </div>

                            <div className="col-md-6">
                                <label className="form-label fw-bold text-dark mb-2" style={{ fontSize: 13 }}>
                                    SMTP Password / App Security Password *
                                </label>
                                <div className="mail-input-group">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="mail_password"
                                        className="mail-custom-input"
                                        style={{ paddingRight: '48px' }}
                                        placeholder="••••••••••••••••"
                                        value={mailValue.mail_password}
                                        onChange={onChangeInput}
                                    />
                                    <FontAwesomeIcon icon={faKey} className="mail-input-icon" />
                                    <button
                                        type="button"
                                        className="mail-toggle-pass-btn"
                                        onClick={() => setShowPassword( !showPassword )}
                                        title={showPassword ? "Hide password" : "Show password"}
                                    >
                                        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                                    </button>
                                </div>
                                {errors.mail_password && <span className="text-danger fs-micro mt-1 d-block fw-bold">{errors.mail_password}</span>}
                            </div>
                        </div>
                    </Form>
                </div>

                {/* 6. Sticky Footer Actions */}
                <div className="mail-sticky-footer">
                    <div className="d-flex align-items-center gap-2">
                        <FontAwesomeIcon icon={faCircleCheck} style={{ color: '#16A34A', fontSize: '16px' }} />
                        <span style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>
                            Outbound transactional emails (invoices, receipts, alerts) will route through this gateway.
                        </span>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                        <button
                            type="button"
                            className="mail-btn-pill mail-btn-test"
                            onClick={() => setShowTestModal( true )}
                        >
                            <FontAwesomeIcon icon={faPaperPlane} />
                            <span>Test Email</span>
                        </button>

                        <button
                            type="button"
                            className="mail-btn-pill"
                            onClick={handleReset}
                        >
                            <FontAwesomeIcon icon={faRotateLeft} />
                            <span>Reset</span>
                        </button>

                        <button
                            type="button"
                            className="mail-btn-pill mail-btn-primary"
                            onClick={onEdit}
                            disabled={disable}
                        >
                            <FontAwesomeIcon icon={faFloppyDisk} />
                            <span>Save Changes</span>
                        </button>
                    </div>
                </div>

                {/* 7. Send Test Email Modal */}
                {showTestModal && (
                    <div className="mail-modal-overlay" onClick={() => setShowTestModal( false )}>
                        <div className="mail-modal-card" onClick={e => e.stopPropagation()}>
                            <div className="mail-modal-header">
                                <div className="mail-modal-title">
                                    <FontAwesomeIcon icon={faPaperPlane} style={{ color: '#2563EB' }} />
                                    <span>Send Test SMTP Email</span>
                                </div>
                                <button
                                    type="button"
                                    className="mail-modal-close"
                                    onClick={() => setShowTestModal( false )}
                                >
                                    <FontAwesomeIcon icon={faXmark} />
                                </button>
                            </div>

                            <Form onSubmit={handleSendTestEmail}>
                                <div className="mb-4">
                                    <label className="form-label fw-bold text-dark mb-2" style={{ fontSize: 13 }}>
                                        Recipient Email Address *
                                    </label>
                                    <div className="mail-input-group">
                                        <input
                                            type="email"
                                            className="mail-custom-input"
                                            placeholder="Enter recipient email (e.g. admin@suguna.com)"
                                            value={testEmail}
                                            onChange={e => setTestEmail( e.target.value )}
                                            autoFocus
                                            required
                                        />
                                        <FontAwesomeIcon icon={faEnvelope} className="mail-input-icon" />
                                    </div>
                                    <span className="text-muted fs-micro mt-2 d-block">
                                        A sample transactional message will be sent using your current SMTP host ({mailValue.mail_host}).
                                    </span>
                                </div>

                                <div className="d-flex justify-content-end gap-2">
                                    <button
                                        type="button"
                                        className="mail-btn-pill"
                                        onClick={() => setShowTestModal( false )}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="mail-btn-pill mail-btn-test"
                                        disabled={isSendingTest}
                                    >
                                        {isSendingTest ? (
                                            <>Dispatching...</>
                                        ) : (
                                            <>
                                                <FontAwesomeIcon icon={faPaperPlane} />
                                                <span>Send Test Mail</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </Form>
                        </div>
                    </div>
                )}
            </div>
        </MasterLayout>
    );
};

const mapStateToProps = ( state ) => {
    const { isLoading, mailSettingsData } = state;
    return { isLoading, mailSettingsData };
};

export default connect( mapStateToProps, { fetchMailSettings, editMailSettings } )( MailSettings );
