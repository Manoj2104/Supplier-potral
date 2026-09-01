import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import MasterLayout from '../MasterLayout';
import TopProgressBar from '../../shared/components/loaders/TopProgressBar';
import TabTitle from '../../shared/tab-title/TabTitle';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronRight, faArrowLeft, faSave, faCog,
    faReceipt, faPrint, faBell, faShieldAlt, faMoneyBillWave,
    faBarcode, faWifi, faToggleOn, faToggleOff, faDisplay,
    faUsers, faWarehouse, faLanguage, faCircleCheck, faTimes,
    faDesktop, faKeyboard, faStore, faList
} from '@fortawesome/free-solid-svg-icons';
import { fetchSetting, editSetting } from '../../store/action/settingAction';
import { fetchAllWarehouses } from '../../store/action/warehouseAction';
import { fetchAllCustomer } from '../../store/action/customerAction';
import './RegisterManagement.css';

const Toggle = ({ value, onChange, id }) => (
    <div
        id={id}
        onClick={() => onChange(!value)}
        style={{
            width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
            background: value ? 'linear-gradient(135deg, #16A34A, #15803D)' : '#CBD5E1',
            position: 'relative', transition: 'background 0.25s ease',
            boxShadow: value ? '0 2px 8px rgba(22,163,74,0.35)' : 'none',
            flexShrink: 0,
        }}
    >
        <div style={{
            width: 18, height: 18, borderRadius: '50%', background: '#fff',
            position: 'absolute', top: 3, left: value ? 23 : 3,
            transition: 'left 0.25s ease',
            boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
        }} />
    </div>
);

const SectionCard = ({ icon, title, subtitle, children, accent = '#16A34A' }) => (
    <div style={{
        background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0',
        boxShadow: '0 1px 6px rgba(15,23,42,0.06)', marginBottom: 20, overflow: 'hidden',
    }}>
        <div style={{
            padding: '18px 24px', borderBottom: '1px solid #F1F5F9',
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'linear-gradient(135deg, #FAFEFF 0%, #F0FDF4 100%)',
        }}>
            <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: `linear-gradient(135deg, ${accent}22 0%, ${accent}11 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1.5px solid ${accent}33`,
            }}>
                <FontAwesomeIcon icon={icon} style={{ color: accent, fontSize: 16 }} />
            </div>
            <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{title}</div>
                {subtitle && <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>{subtitle}</div>}
            </div>
        </div>
        <div style={{ padding: '20px 24px' }}>{children}</div>
    </div>
);

const SettingRow = ({ label, description, children }) => (
    <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 0', borderBottom: '1px solid #F8FAFC',
        gap: 20, flexWrap: 'wrap',
    }}>
        <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: '#1E293B' }}>{label}</div>
            {description && <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{description}</div>}
        </div>
        <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
);

const inputStyle = {
    border: '1.5px solid #E2E8F0', borderRadius: 8, padding: '7px 12px',
    fontSize: 13, color: '#0F172A', background: '#FAFAFA',
    outline: 'none', transition: 'border-color 0.2s',
    fontFamily: 'inherit',
};

const PosSettingsPage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { settings, frontSetting, warehouses, customers } = useSelector(state => state);

    const [saved, setSaved] = useState(false);
    const [activeTab, setActiveTab] = useState('general');

    // POS-specific settings state
    const [pos, setPos] = useState({
        // General
        autoFocusSearch: true,
        quickAddToCart: true,
        showProductImages: true,
        showStockQty: true,
        showProductCode: true,
        defaultView: 'grid',

        // Receipt
        printReceipt: true,
        autoPromptPrint: false,
        showLogo: true,
        showBarcode: true,
        showTaxBreakdown: true,
        footerNote: 'Thank you for shopping with us!',
        receiptCopies: '1',

        // Payment
        allowCreditSale: false,
        allowPartialPayment: false,
        enableCoupon: true,
        enableLoyalty: false,
        roundOffTotal: false,
        defaultPaymentType: 'cash',

        // Register
        requirePinOnOpen: false,
        requirePinOnClose: true,
        autoCloseOnEOD: false,
        drawerAutoOpen: false,
        showShiftReminder: true,

        // Notifications
        lowStockAlert: true,
        lowStockThreshold: '5',
        soundOnSale: true,
        soundOnError: true,
        desktopNotifications: false,

        // Display
        darkMode: false,
        fontSize: 'medium',
        currencyPosition: 'left',
        showClock: true,
        showWeather: true,
    });

    useEffect(() => {
        dispatch(fetchSetting());
        dispatch(fetchAllWarehouses());
        dispatch(fetchAllCustomer());
    }, []);

    const update = (key, val) => setPos(prev => ({ ...prev, [key]: val }));

    const handleSave = () => {
        // Save settings to localStorage for POS-specific overrides
        localStorage.setItem('pos_settings', JSON.stringify(pos));
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const tabs = [
        { id: 'general', label: 'General', icon: faCog },
        { id: 'receipt', label: 'Receipt', icon: faReceipt },
        { id: 'payment', label: 'Payment', icon: faMoneyBillWave },
        { id: 'register', label: 'Register', icon: faStore },
        { id: 'display', label: 'Display', icon: faDisplay },
        { id: 'notifications', label: 'Alerts', icon: faBell },
    ];

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title="POS Settings — infy-pos" />
            <div className="reg-mgmt-container">

                {/* Breadcrumb */}
                <div style={{ fontSize: 12, color: '#64748B', marginBottom: 10, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Link to="/app/dashboard" style={{ color: '#64748B', textDecoration: 'none' }}>Dashboard</Link>
                    <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 9 }} />
                    <Link to="/app/pos" style={{ color: '#64748B', textDecoration: 'none' }}>POS</Link>
                    <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 9 }} />
                    <span style={{ color: '#0F172A', fontWeight: 700 }}>POS Settings</span>
                </div>

                {/* Header */}
                <div className="reg-mgmt-header">
                    <div>
                        <h1 className="reg-mgmt-title">
                            <FontAwesomeIcon icon={faCog} className="text-success" />
                            POS Settings
                        </h1>
                        <p className="reg-mgmt-sub">
                            Configure your Point of Sale terminal — receipt printing, payment methods, register behavior, display preferences, and alert settings.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button
                            type="button"
                            onClick={() => navigate('/app/pos')}
                            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2"
                            style={{ borderRadius: 10, fontWeight: 600 }}
                        >
                            <FontAwesomeIcon icon={faArrowLeft} />
                            Back to POS
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            className="btn btn-success btn-sm d-flex align-items-center gap-2"
                            style={{ borderRadius: 10, fontWeight: 600, background: 'linear-gradient(135deg,#16A34A,#15803D)', border: 'none' }}
                        >
                            <FontAwesomeIcon icon={saved ? faCircleCheck : faSave} />
                            {saved ? 'Saved!' : 'Save Settings'}
                        </button>
                    </div>
                </div>

                {/* Success Banner */}
                {saved && (
                    <div style={{
                        background: 'linear-gradient(135deg,#DCFCE7,#BBF7D0)', borderRadius: 12,
                        padding: '12px 20px', marginBottom: 16,
                        display: 'flex', alignItems: 'center', gap: 10,
                        border: '1px solid #86EFAC', color: '#15803D', fontWeight: 600, fontSize: 13,
                    }}>
                        <FontAwesomeIcon icon={faCircleCheck} />
                        Settings saved successfully!
                    </div>
                )}

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setActiveTab(t.id)}
                            style={{
                                padding: '8px 16px', borderRadius: 10, fontWeight: 600, fontSize: 12,
                                border: 'none', cursor: 'pointer',
                                background: activeTab === t.id
                                    ? 'linear-gradient(135deg,#16A34A,#15803D)'
                                    : '#F1F5F9',
                                color: activeTab === t.id ? '#fff' : '#475569',
                                display: 'flex', alignItems: 'center', gap: 7,
                                boxShadow: activeTab === t.id ? '0 4px 12px rgba(22,163,74,0.25)' : 'none',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <FontAwesomeIcon icon={t.icon} style={{ fontSize: 12 }} />
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* ── GENERAL TAB ── */}
                {activeTab === 'general' && (
                    <>
                        <SectionCard icon={faCog} title="General POS Behavior" subtitle="Configure how your POS terminal operates day-to-day" accent="#16A34A">
                            <SettingRow label="Auto-focus Search Bar" description="Automatically focus the product search bar when POS opens">
                                <Toggle value={pos.autoFocusSearch} onChange={v => update('autoFocusSearch', v)} />
                            </SettingRow>
                            <SettingRow label="Quick Add to Cart" description="Single click adds product directly to cart">
                                <Toggle value={pos.quickAddToCart} onChange={v => update('quickAddToCart', v)} />
                            </SettingRow>
                            <SettingRow label="Show Product Images" description="Display product thumbnails in cart and product grid">
                                <Toggle value={pos.showProductImages} onChange={v => update('showProductImages', v)} />
                            </SettingRow>
                            <SettingRow label="Show Stock Quantity" description="Display available stock next to each product">
                                <Toggle value={pos.showStockQty} onChange={v => update('showStockQty', v)} />
                            </SettingRow>
                            <SettingRow label="Show Product Code" description="Display product SKU/barcode code in the cart">
                                <Toggle value={pos.showProductCode} onChange={v => update('showProductCode', v)} />
                            </SettingRow>
                            <SettingRow label="Default Product View" description="Grid or list view for product panel">
                                <select
                                    value={pos.defaultView}
                                    onChange={e => update('defaultView', e.target.value)}
                                    style={{ ...inputStyle, width: 130 }}
                                >
                                    <option value="grid">Grid View</option>
                                    <option value="list">List View</option>
                                </select>
                            </SettingRow>
                        </SectionCard>

                        <SectionCard icon={faKeyboard} title="Keyboard Shortcuts" subtitle="POS keyboard shortcuts reference" accent="#2563EB">
                            {[
                                ['Ctrl + K', 'Focus product search'],
                                ['F8', 'Process payment (Pay Now)'],
                                ['F7', 'Hold current bill'],
                                ['F2', 'Add / change customer'],
                                ['F11', 'Toggle products panel'],
                                ['F12', 'Fullscreen mode'],
                                ['Ctrl + R', 'Clear cart'],
                                ['Ctrl + B', 'Barcode scan mode'],
                            ].map(([key, label]) => (
                                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #F8FAFC' }}>
                                    <span style={{ fontSize: 13, color: '#475569' }}>{label}</span>
                                    <kbd style={{
                                        background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 6,
                                        padding: '3px 8px', fontSize: 11, fontWeight: 700, color: '#0F172A',
                                        fontFamily: 'monospace',
                                    }}>{key}</kbd>
                                </div>
                            ))}
                        </SectionCard>
                    </>
                )}

                {/* ── RECEIPT TAB ── */}
                {activeTab === 'receipt' && (
                    <>
                        <SectionCard icon={faPrint} title="Print & Receipt Settings" subtitle="Configure receipt format, auto-print, and branding" accent="#7C3AED">
                            <SettingRow label="Auto-print Receipt" description="Automatically print receipt after each successful payment">
                                <Toggle value={pos.printReceipt} onChange={v => update('printReceipt', v)} />
                            </SettingRow>
                            <SettingRow label="Prompt Before Printing" description="Ask cashier to confirm before printing each receipt">
                                <Toggle value={pos.autoPromptPrint} onChange={v => update('autoPromptPrint', v)} />
                            </SettingRow>
                            <SettingRow label="Show Company Logo" description="Print company logo at the top of every receipt">
                                <Toggle value={pos.showLogo} onChange={v => update('showLogo', v)} />
                            </SettingRow>
                            <SettingRow label="Show Barcode on Receipt" description="Print scannable order barcode at the bottom of receipts">
                                <Toggle value={pos.showBarcode} onChange={v => update('showBarcode', v)} />
                            </SettingRow>
                            <SettingRow label="Show Tax Breakdown" description="Display tax details separately on receipts">
                                <Toggle value={pos.showTaxBreakdown} onChange={v => update('showTaxBreakdown', v)} />
                            </SettingRow>
                            <SettingRow label="Number of Receipt Copies" description="How many copies to print per sale">
                                <select
                                    value={pos.receiptCopies}
                                    onChange={e => update('receiptCopies', e.target.value)}
                                    style={{ ...inputStyle, width: 100 }}
                                >
                                    <option value="1">1 copy</option>
                                    <option value="2">2 copies</option>
                                    <option value="3">3 copies</option>
                                </select>
                            </SettingRow>
                            <SettingRow label="Receipt Footer Note" description="Custom text to print at the bottom of every receipt">
                                <input
                                    type="text"
                                    value={pos.footerNote}
                                    onChange={e => update('footerNote', e.target.value)}
                                    placeholder="Enter footer message..."
                                    style={{ ...inputStyle, width: 280 }}
                                />
                            </SettingRow>
                        </SectionCard>
                    </>
                )}

                {/* ── PAYMENT TAB ── */}
                {activeTab === 'payment' && (
                    <>
                        <SectionCard icon={faMoneyBillWave} title="Payment Methods & Rules" subtitle="Configure payment types, credit sales, and rounding" accent="#D97706">
                            <SettingRow label="Default Payment Method" description="Pre-selected payment type when payment screen opens">
                                <select
                                    value={pos.defaultPaymentType}
                                    onChange={e => update('defaultPaymentType', e.target.value)}
                                    style={{ ...inputStyle, width: 150 }}
                                >
                                    <option value="cash">Cash</option>
                                    <option value="card">Card</option>
                                    <option value="upi">UPI</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="cheque">Cheque</option>
                                </select>
                            </SettingRow>
                            <SettingRow label="Allow Credit Sales" description="Enable selling on credit (customer will owe payment later)">
                                <Toggle value={pos.allowCreditSale} onChange={v => update('allowCreditSale', v)} />
                            </SettingRow>
                            <SettingRow label="Allow Partial Payment" description="Allow customers to pay a portion of the total amount">
                                <Toggle value={pos.allowPartialPayment} onChange={v => update('allowPartialPayment', v)} />
                            </SettingRow>
                            <SettingRow label="Enable Coupon Discounts" description="Allow applying coupon codes at checkout">
                                <Toggle value={pos.enableCoupon} onChange={v => update('enableCoupon', v)} />
                            </SettingRow>
                            <SettingRow label="Enable Loyalty Points" description="Show and apply loyalty point redemption at checkout">
                                <Toggle value={pos.enableLoyalty} onChange={v => update('enableLoyalty', v)} />
                            </SettingRow>
                            <SettingRow label="Round Off Grand Total" description="Round the final total to the nearest whole number">
                                <Toggle value={pos.roundOffTotal} onChange={v => update('roundOffTotal', v)} />
                            </SettingRow>
                        </SectionCard>
                    </>
                )}

                {/* ── REGISTER TAB ── */}
                {activeTab === 'register' && (
                    <>
                        <SectionCard icon={faShieldAlt} title="Register Security & Control" subtitle="PIN requirements, shift controls, and end-of-day settings" accent="#DC2626">
                            <SettingRow label="Require PIN to Open Register" description="Cashier must enter PIN before opening the register">
                                <Toggle value={pos.requirePinOnOpen} onChange={v => update('requirePinOnOpen', v)} />
                            </SettingRow>
                            <SettingRow label="Require PIN to Close Register" description="Manager PIN needed to close the register at end of shift">
                                <Toggle value={pos.requirePinOnClose} onChange={v => update('requirePinOnClose', v)} />
                            </SettingRow>
                            <SettingRow label="Auto-close Register at End of Day" description="Automatically close register at midnight">
                                <Toggle value={pos.autoCloseOnEOD} onChange={v => update('autoCloseOnEOD', v)} />
                            </SettingRow>
                            <SettingRow label="Auto-open Cash Drawer on Sale" description="Trigger cash drawer to open after each cash payment">
                                <Toggle value={pos.drawerAutoOpen} onChange={v => update('drawerAutoOpen', v)} />
                            </SettingRow>
                            <SettingRow label="Show Shift Reminder" description="Remind cashiers of shift end 15 minutes before time">
                                <Toggle value={pos.showShiftReminder} onChange={v => update('showShiftReminder', v)} />
                            </SettingRow>
                        </SectionCard>
                    </>
                )}

                {/* ── DISPLAY TAB ── */}
                {activeTab === 'display' && (
                    <>
                        <SectionCard icon={faDisplay} title="Display & Interface Preferences" subtitle="Customize the POS terminal appearance and layout" accent="#0284C7">
                            <SettingRow label="Font Size" description="Choose the text size for the POS interface">
                                <select
                                    value={pos.fontSize}
                                    onChange={e => update('fontSize', e.target.value)}
                                    style={{ ...inputStyle, width: 140 }}
                                >
                                    <option value="small">Small</option>
                                    <option value="medium">Medium (Default)</option>
                                    <option value="large">Large</option>
                                </select>
                            </SettingRow>
                            <SettingRow label="Currency Symbol Position" description="Show currency symbol before or after the amount">
                                <select
                                    value={pos.currencyPosition}
                                    onChange={e => update('currencyPosition', e.target.value)}
                                    style={{ ...inputStyle, width: 140 }}
                                >
                                    <option value="left">Left (₹ 100)</option>
                                    <option value="right">Right (100 ₹)</option>
                                </select>
                            </SettingRow>
                            <SettingRow label="Show Live Clock in Header" description="Display real-time clock in the POS top bar">
                                <Toggle value={pos.showClock} onChange={v => update('showClock', v)} />
                            </SettingRow>
                            <SettingRow label="Show Weather Widget" description="Display current weather conditions in POS header">
                                <Toggle value={pos.showWeather} onChange={v => update('showWeather', v)} />
                            </SettingRow>
                        </SectionCard>
                    </>
                )}

                {/* ── NOTIFICATIONS TAB ── */}
                {activeTab === 'notifications' && (
                    <>
                        <SectionCard icon={faBell} title="Alerts & Notifications" subtitle="Configure low stock alerts, sound feedback, and push notifications" accent="#D97706">
                            <SettingRow label="Low Stock Alert" description="Show alert when product quantity falls below threshold">
                                <Toggle value={pos.lowStockAlert} onChange={v => update('lowStockAlert', v)} />
                            </SettingRow>
                            <SettingRow label="Low Stock Threshold" description="Number of items remaining to trigger low stock warning">
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={pos.lowStockThreshold}
                                    onChange={e => update('lowStockThreshold', e.target.value)}
                                    disabled={!pos.lowStockAlert}
                                    style={{ ...inputStyle, width: 90, opacity: pos.lowStockAlert ? 1 : 0.4 }}
                                />
                            </SettingRow>
                            <SettingRow label="Sound on Sale" description="Play a success sound after each completed sale">
                                <Toggle value={pos.soundOnSale} onChange={v => update('soundOnSale', v)} />
                            </SettingRow>
                            <SettingRow label="Sound on Error" description="Play an alert sound when an error or warning occurs">
                                <Toggle value={pos.soundOnError} onChange={v => update('soundOnError', v)} />
                            </SettingRow>
                            <SettingRow label="Desktop Notifications" description="Show browser desktop notifications for important events">
                                <Toggle value={pos.desktopNotifications} onChange={v => update('desktopNotifications', v)} />
                            </SettingRow>
                        </SectionCard>
                    </>
                )}

                {/* Footer Save */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 10, paddingBottom: 32 }}>
                    <button
                        type="button"
                        onClick={() => navigate('/app/pos')}
                        className="btn btn-outline-secondary"
                        style={{ borderRadius: 10, fontWeight: 600 }}
                    >
                        <FontAwesomeIcon icon={faTimes} className="me-2" />
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="btn btn-success"
                        style={{ borderRadius: 10, fontWeight: 600, background: 'linear-gradient(135deg,#16A34A,#15803D)', border: 'none', minWidth: 140 }}
                    >
                        <FontAwesomeIcon icon={saved ? faCircleCheck : faSave} className="me-2" />
                        {saved ? 'Saved!' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </MasterLayout>
    );
};

export default PosSettingsPage;
