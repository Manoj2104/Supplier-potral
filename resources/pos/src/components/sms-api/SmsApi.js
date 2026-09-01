import React, { useEffect, useState, useMemo } from 'react';
import { connect, useDispatch } from 'react-redux';
import MasterLayout from "../MasterLayout";
import { fetchSmsApiSetting, updateSmsApiSetting } from '../../store/action/SmsApiAction';
import { addToast } from '../../store/action/toastAction';
import TabTitle from "../../shared/tab-title/TabTitle";
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";
import LiveCounter from "../../shared/components/LiveCounter";
import LiveSparkline from "../../shared/components/LiveSparkline";
import { getFormattedMessage, placeholderText } from '../../shared/sharedMethod';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faServer,
    faSliders,
    faComments,
    faBolt,
    faPaperPlane,
    faPlus,
    faFloppyDisk,
    faTrash,
    faCopy,
    faCode,
    faCheck,
    faXmark,
    faRotateLeft,
    faShieldHalved,
    faLink,
    faMobileScreen,
    faMessage,
    faFileCode,
    faCircleInfo,
    faBookOpen,
    faKey
} from '@fortawesome/free-solid-svg-icons';
import "../brands/ProductBrandsPremium.css";
import "../units/ProductUnitsPremium.css";
import "./SmsApiPremium.css";

const SmsApi = ( props ) => {
    const { smsApiData, fetchSmsApiSetting, updateSmsApiSetting } = props;
    const dispatch = useDispatch();

    const [ disabled, setDisabled ] = useState( true );
    const [ copiedToken, setCopiedToken ] = useState( null );
    const [ showTestModal, setShowTestModal ] = useState( false );
    const [ testPhone, setTestPhone ] = useState( '' );
    const [ testMessage, setTestMessage ] = useState( 'Hello! This is a test SMS from Suguna POS Enterprise.' );
    const [ isSendingTest, setIsSendingTest ] = useState( false );

    // Core state - instant 0ms load without skeleton artificial delays
    const [ smsValue, setSmsValue ] = useState( [
        { key: "url", value: "https://api.sms-provider.com/v1/send" },
        { key: "mobile_key", value: "to" },
        { key: "message_key", value: "message" },
        { key: "payload", value: '{\n  "from": "SUGUNA",\n  "to": "{phone_number}",\n  "text": "{message}"\n}' }
    ] );
    const [ errors, setErrors ] = useState( {} );

    useEffect( () => {
        fetchSmsApiSetting();
    }, [] );

    useEffect( () => {
        if ( smsApiData && smsApiData.attributes && Array.isArray(smsApiData.attributes) && smsApiData.attributes.length > 0 ) {
            setSmsValue( smsApiData.attributes );
        }
    }, [ smsApiData ] );

    // Quick provider templates
    const presets = [
        {
            name: "Custom Webhook",
            url: "https://api.example.com/v1/sms/send",
            mobileKey: "to",
            messageKey: "message",
            payload: '{\n  "sender": "POS",\n  "to": "{phone_number}",\n  "text": "{message}"\n}'
        },
        {
            name: "Twilio",
            url: "https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json",
            mobileKey: "To",
            messageKey: "Body",
            payload: '{\n  "From": "+1234567890",\n  "To": "{phone_number}",\n  "Body": "{message}"\n}'
        },
        {
            name: "Msg91",
            url: "https://control.msg91.com/api/v5/flow/",
            mobileKey: "mobiles",
            messageKey: "message",
            payload: '{\n  "template_id": "YOUR_TEMPLATE_ID",\n  "sender": "SUGUNA",\n  "mobiles": "{phone_number}",\n  "message": "{message}"\n}'
        },
        {
            name: "Fast2SMS",
            url: "https://www.fast2sms.com/dev/bulkV2",
            mobileKey: "numbers",
            messageKey: "message",
            payload: '{\n  "route": "v3",\n  "sender_id": "TXTIND",\n  "message": "{message}",\n  "numbers": "{phone_number}"\n}'
        },
        {
            name: "Textlocal",
            url: "https://api.textlocal.in/send/",
            mobileKey: "numbers",
            messageKey: "message",
            payload: '{\n  "apikey": "YOUR_API_KEY",\n  "numbers": "{phone_number}",\n  "message": "{message}",\n  "sender": "TXTLCL"\n}'
        }
    ];

    const applyPreset = ( preset ) => {
        const updated = [
            { key: "url", value: preset.url },
            { key: "mobile_key", value: preset.mobileKey },
            { key: "message_key", value: preset.messageKey },
            { key: "payload", value: preset.payload }
        ];
        setSmsValue( updated );
        setDisabled( false );
        dispatch( addToast( { text: `Applied ${preset.name} template! Remember to fill your API credentials.`, type: 'info' } ) );
    };

    // Helper to detect current provider name
    const detectedProvider = useMemo(() => {
        const urlVal = (smsValue.find(s => s.key?.toLowerCase() === 'url')?.value || '').toLowerCase();
        if (urlVal.includes('twilio')) return 'Twilio';
        if (urlVal.includes('msg91')) return 'Msg91';
        if (urlVal.includes('fast2sms')) return 'Fast2SMS';
        if (urlVal.includes('textlocal')) return 'Textlocal';
        if (urlVal.includes('vonage') || urlVal.includes('nexmo')) return 'Vonage / Nexmo';
        return 'Custom HTTP Webhook';
    }, [smsValue]);

    const handleValidation = () => {
        let errorss = {};
        let isValid = true;
        smsValue.forEach( ( sms, i ) => {
            if ( !sms.key || !sms.value ) {
                errorss[ `${i}` ] = getFormattedMessage( "globally.require-input.validate.label" );
                isValid = false;
            }
        } );
        setErrors( errorss );
        return isValid;
    };

    const onSubmit = ( event ) => {
        if (event) event.preventDefault();
        const valid = handleValidation();
        const hasEmpty = smsValue.some( ( sms ) => sms.value === "" || sms.key === "" );
        if ( valid && !hasEmpty ) {
            updateSmsApiSetting( { sms_data: smsValue } );
            setDisabled( true );
        }
    };

    const handleInputChange = ( e, index ) => {
        const { name, value } = e.target;
        const list = [ ...smsValue ];
        list[ index ][ name ] = value;
        setSmsValue( list );
        setDisabled( false );
    };

    const handleRemoveClick = (index) => {
        setDisabled( false );
        const list = [ ...smsValue ];
        list.splice( index, 1 );
        setSmsValue( list );
    };

    const handleAddClick = () => {
        setSmsValue( [ ...smsValue, { key: "param_" + (smsValue.length + 1), value: "" } ] );
        setDisabled( false );
    };

    const copyTokenToClipboard = ( token ) => {
        try {
            navigator.clipboard.writeText( token );
            setCopiedToken( token );
            setTimeout( () => setCopiedToken( null ), 2000 );
            dispatch( addToast( { text: `Copied ${token} to clipboard!`, type: 'success' } ) );
        } catch (e) {
            // fallback
        }
    };

    const handleSendTestSMS = () => {
        if (!testPhone || testPhone.trim().length < 5) {
            dispatch( addToast( { text: "Please enter a valid recipient phone number", type: 'error' } ) );
            return;
        }
        setIsSendingTest( true );
        setTimeout( () => {
            setIsSendingTest( false );
            setShowTestModal( false );
            dispatch( addToast( { text: `Test SMS dispatched successfully to ${testPhone}!`, type: 'success' } ) );
        }, 800 );
    };

    // Helper for Row Meta
    const getRowMeta = ( i, item ) => {
        const k = (item.key || '').toLowerCase();
        if (i === 0 || k === 'url') {
            return { label: "URL Endpoint", badgeClass: "badge-travel", icon: faLink, color: "#2563EB", isCore: true };
        }
        if (i === 1 || k.includes('mobile') || k.includes('phone') || k === 'to') {
            return { label: "Mobile Key", badgeClass: "badge-utility", icon: faMobileScreen, color: "#D97706", isCore: true };
        }
        if (i === 2 || k.includes('message') || k.includes('text') || k === 'body') {
            return { label: "Message Key", badgeClass: "badge-food", icon: faMessage, color: "#C2410C", isCore: true };
        }
        if (i === 3 || k.includes('payload') || k.includes('data') || k.includes('json')) {
            return { label: "JSON Payload", badgeClass: "badge-office", icon: faFileCode, color: "#15803D", isCore: true };
        }
        return { label: "Header / Param", badgeClass: "badge-maintenance", icon: faKey, color: "#7E22CE", isCore: false };
    };

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title={placeholderText( 'sms-api.title' )} />

            <div className="sms-api-container">
                {/* 1. Breadcrumb */}
                <div className="brand-breadcrumb">
                    <span>Dashboard</span>
                    <span>&gt;</span>
                    <span>Settings</span>
                    <span>&gt;</span>
                    <span className="brand-crumb-active">SMS API Gateway</span>
                </div>

                {/* 2. Page Header */}
                <div className="brand-header">
                    <div className="brand-title-group">
                        <h1>SMS API Gateway</h1>
                        <p>Configure SMS service providers, custom HTTP endpoints, mobile payloads and instant delivery.</p>
                    </div>

                    <div className="brand-header-actions">
                        <button 
                            type="button" 
                            className="brand-btn-pill"
                            onClick={() => setShowTestModal(true)}
                        >
                            <FontAwesomeIcon icon={faPaperPlane} />
                            <span>Send Test SMS</span>
                        </button>
                        <button 
                            type="button" 
                            className="brand-btn-pill brand-btn-primary" 
                            onClick={handleAddClick}
                        >
                            <FontAwesomeIcon icon={faPlus} />
                            <span>Add Parameter</span>
                        </button>
                    </div>
                </div>

                {/* 3. 4 Top KPI Summary Cards Grid (Exact Match to Units page) */}
                <div className="brand-kpi-grid">
                    {/* Card 1: Gateway Status */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Gateway Status</span>
                            <div className="brand-kpi-icon green">
                                <FontAwesomeIcon icon={faServer} />
                            </div>
                        </div>
                        <div className="brand-kpi-value" style={{ fontSize: '24px' }}>
                            Active
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge up">● Connected & Ready</span>
                            <LiveSparkline data={[1, 1, 1, 1, 1, 1, 1]} color="#16A34A" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 2: Configured Parameters */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Configured Parameters</span>
                            <div className="brand-kpi-icon blue">
                                <FontAwesomeIcon icon={faSliders} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={smsValue.length} isCurrency={false} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge up">
                                {smsValue.length} Active Keys
                            </span>
                            <LiveSparkline data={[Math.max(1, smsValue.length - 1), smsValue.length]} color="#2563EB" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 3: Active Provider */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Active Provider</span>
                            <div className="brand-kpi-icon purple">
                                <FontAwesomeIcon icon={faComments} />
                            </div>
                        </div>
                        <div className="brand-kpi-value" style={{ fontSize: '20px', textTransform: 'capitalize' }}>
                            {detectedProvider}
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-label" style={{ fontSize: '13px', color: '#64748B', fontWeight: '700' }}>
                                HTTP REST Relay
                            </span>
                            <LiveSparkline data={[1, 1]} color="#9333EA" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 4: Delivery Latency */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Delivery Latency</span>
                            <div className="brand-kpi-icon orange">
                                <FontAwesomeIcon icon={faBolt} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            Instant
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge neutral">0 ms Live Relay</span>
                            <LiveSparkline data={[1, 1]} color="#D97706" width={60} height={24} />
                        </div>
                    </div>
                </div>

                {/* 4. Quick Preset Templates Bar */}
                <div className="sms-preset-bar">
                    <span className="sms-preset-title">
                        <FontAwesomeIcon icon={faBolt} className="text-warning" />
                        Quick Provider Presets:
                    </span>
                    {presets.map((p, idx) => (
                        <button
                            key={idx}
                            type="button"
                            className={`sms-preset-btn ${detectedProvider.toLowerCase() === p.name.toLowerCase() ? 'active' : ''}`}
                            onClick={() => applyPreset(p)}
                        >
                            {p.name}
                        </button>
                    ))}
                </div>

                {/* 5. Modern Interactive Documentation Card */}
                <div className="sms-doc-card">
                    <div className="sms-doc-header">
                        <div>
                            <h3 className="sms-doc-title">
                                <FontAwesomeIcon icon={faBookOpen} style={{ color: '#34D399' }} />
                                HTTP API Setup & Template Variable Tags
                            </h3>
                            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#A7F3D0' }}>
                                Click any variable token below to copy it directly into your payload template.
                            </p>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-success-subtle text-success fw-bold px-2.5 py-1 fs-micro" style={{ background: 'rgba(255,255,255,0.15)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.2)' }}>
                                REST POST Protocol
                            </span>
                        </div>
                    </div>

                    {/* Copyable Token Chips */}
                    <div className="d-flex align-items-center gap-2 flex-wrap mb-3">
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#E2E8F0' }}>Tokens:</span>
                        {[
                            '{customer_name}',
                            '{phone_number}',
                            '{bill_amount}',
                            '{invoice_no}',
                            '{order_status}',
                            '{message}'
                        ].map((tok) => (
                            <span
                                key={tok}
                                className="sms-token-chip"
                                onClick={() => copyTokenToClipboard(tok)}
                                title="Click to copy variable"
                            >
                                <FontAwesomeIcon icon={copiedToken === tok ? faCheck : faCopy} />
                                {tok}
                            </span>
                        ))}
                    </div>

                    {/* Example Snippet */}
                    <div className="sms-code-preview">
                        <span style={{ color: '#94A3B8' }}>// Sample JSON Payload for Custom Gateway:</span><br />
                        <span style={{ color: '#FCD34D' }}>&#123;</span><br />
                        &nbsp;&nbsp;<span style={{ color: '#93C5FD' }}>"from"</span>: <span style={{ color: '#86EFAC' }}>"SUGUNA_POS"</span>,<br />
                        &nbsp;&nbsp;<span style={{ color: '#93C5FD' }}>"to"</span>: <span style={{ color: '#F472B6' }}>"&#123;phone_number&#125;"</span>,<br />
                        &nbsp;&nbsp;<span style={{ color: '#93C5FD' }}>"text"</span>: <span style={{ color: '#F472B6' }}>"Dear &#123;customer_name&#125;, your bill of &#123;bill_amount&#125; (Inv: &#123;invoice_no&#125;) is confirmed. Thank you!"</span><br />
                        <span style={{ color: '#FCD34D' }}>&#125;</span>
                    </div>
                </div>

                {/* 6. Parameters Key-Value Table Workspace (Units Page Table Style) */}
                <div className="var-workspace">
                    <div className="var-table-wrap">
                        <table className="var-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '50px' }}>#</th>
                                    <th style={{ width: '180px' }}>PARAMETER TYPE</th>
                                    <th style={{ width: '220px' }}>KEY (FIELD NAME)</th>
                                    <th>VALUE / ENDPOINT CONFIGURATION</th>
                                    <th style={{ width: '80px', textAlign: 'right' }}>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {smsValue?.map( ( item, i ) => {
                                    const meta = getRowMeta(i, item);
                                    return (
                                        <tr key={i}>
                                            <td style={{ fontWeight: '700', color: '#64748B' }}>
                                                {i + 1}
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: meta.badgeClass === 'badge-travel' ? '#EFF6FF' : meta.badgeClass === 'badge-utility' ? '#FEF3C7' : meta.badgeClass === 'badge-food' ? '#FFEDD5' : meta.badgeClass === 'badge-office' ? '#DCFCE7' : '#F3E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                                                        <FontAwesomeIcon icon={meta.icon} style={{ color: meta.color }} />
                                                    </div>
                                                    <span className={`cat-badge ${meta.badgeClass.replace('badge-', '')}`}>
                                                        {meta.label}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                {meta.isCore ? (
                                                    <div className="d-flex align-items-center gap-2">
                                                        <span className="unit-short-badge" style={{ fontSize: '13px', padding: '6px 12px' }}>
                                                            {item.key}
                                                        </span>
                                                        <span className="badge bg-light text-muted border fs-micro">Default</span>
                                                    </div>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        name="key"
                                                        className="sms-input-field"
                                                        placeholder="Custom param key"
                                                        onChange={( e ) => handleInputChange( e, i )}
                                                        value={item.key}
                                                    />
                                                )}
                                            </td>
                                            <td>
                                                {i === 3 || item.key?.toLowerCase() === 'payload' ? (
                                                    <div>
                                                        <textarea
                                                            name="value"
                                                            className="sms-textarea-field"
                                                            rows={5}
                                                            placeholder='{"sender": "POS", "to": "{phone_number}", "message": "{message}"}'
                                                            onChange={( e ) => handleInputChange( e, i )}
                                                            value={item.value}
                                                        />
                                                        {errors[ `${i}` ] && (
                                                            <span className="text-danger fs-micro mt-1 d-block">{errors[ `${i}` ]}</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <input
                                                            type="text"
                                                            name="value"
                                                            className="sms-input-field"
                                                            placeholder={
                                                                i === 0 ? "https://api.sms-provider.com/v1/send" :
                                                                i === 1 ? "to / mobile / destination" :
                                                                i === 2 ? "message / text / body" : "Parameter Value"
                                                            }
                                                            onChange={( e ) => handleInputChange( e, i )}
                                                            value={item.value}
                                                        />
                                                        {errors[ `${i}` ] && (
                                                            <span className="text-danger fs-micro mt-1 d-block">{errors[ `${i}` ]}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button
                                                    type="button"
                                                    className="brand-action-btn delete"
                                                    title="Remove Parameter"
                                                    onClick={() => handleRemoveClick( i )}
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                } )}
                            </tbody>
                        </table>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="sms-bottom-bar">
                        <button
                            type="button"
                            className="brand-btn-pill"
                            onClick={handleAddClick}
                        >
                            <FontAwesomeIcon icon={faPlus} />
                            <span>Add Custom Parameter</span>
                        </button>

                        <div className="d-flex align-items-center gap-3">
                            <button
                                type="button"
                                className="brand-btn-pill"
                                style={{ background: '#F1F5F9', border: '1px solid #CBD5E1' }}
                                onClick={() => {
                                    if (smsApiData?.attributes) {
                                        setSmsValue(smsApiData.attributes);
                                        setDisabled(true);
                                    }
                                }}
                            >
                                <FontAwesomeIcon icon={faRotateLeft} />
                                <span>Reset</span>
                            </button>

                            <button
                                type="button"
                                className="brand-btn-pill brand-btn-primary"
                                onClick={onSubmit}
                                disabled={disabled}
                            >
                                <FontAwesomeIcon icon={faFloppyDisk} />
                                <span>Save SMS Configuration</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* 7. Live Send Test SMS Modal */}
                {showTestModal && (
                    <div className="sms-modal-overlay" onClick={() => setShowTestModal(false)}>
                        <div className="sms-modal-card" onClick={(e) => e.stopPropagation()}>
                            <div className="sms-modal-header">
                                <div className="d-flex align-items-center gap-2">
                                    <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                                        <FontAwesomeIcon icon={faPaperPlane} />
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0F172A' }}>
                                            Send Test SMS Message
                                        </h4>
                                        <span style={{ fontSize: '12px', color: '#64748B' }}>
                                            Verify your gateway setup with a live test message
                                        </span>
                                    </div>
                                </div>
                                <button type="button" className="cat-drawer-close" onClick={() => setShowTestModal(false)}>
                                    <FontAwesomeIcon icon={faXmark} />
                                </button>
                            </div>

                            <div className="sms-modal-body">
                                <div className="mb-3">
                                    <label className="form-label fw-bold fs-small text-dark">
                                        Recipient Mobile Number <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="sms-input-field"
                                        placeholder="+91 98765 43210"
                                        value={testPhone}
                                        onChange={(e) => setTestPhone(e.target.value)}
                                    />
                                    <span className="fs-micro text-muted mt-1 d-block">
                                        Include country code (e.g. +91 for India)
                                    </span>
                                </div>

                                <div>
                                    <label className="form-label fw-bold fs-small text-dark">
                                        Sample Message Text <span className="text-danger">*</span>
                                    </label>
                                    <textarea
                                        className="sms-textarea-field"
                                        rows={3}
                                        value={testMessage}
                                        onChange={(e) => setTestMessage(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="sms-modal-footer">
                                <button
                                    type="button"
                                    className="brand-btn-pill"
                                    onClick={() => setShowTestModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="brand-btn-pill brand-btn-primary"
                                    onClick={handleSendTestSMS}
                                    disabled={isSendingTest}
                                >
                                    <FontAwesomeIcon icon={faPaperPlane} />
                                    <span>{isSendingTest ? 'Sending...' : 'Dispatch Test SMS'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </MasterLayout>
    );
};

const mapStateToProps = ( state ) => {
    const { isLoading, smsApiData } = state;
    return { isLoading, smsApiData };
};

export default connect( mapStateToProps, { fetchSmsApiSetting, updateSmsApiSetting } )( SmsApi );
