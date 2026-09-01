import React, { useEffect, useState, useMemo } from 'react';
import { connect } from 'react-redux';
import MasterLayout from '../MasterLayout';
import TabTitle from '../../shared/tab-title/TabTitle';
import { fetchSetting, editSetting } from '../../store/action/settingAction';
import { fetchCurrencies } from '../../store/action/currencyAction';
import { fetchAllCustomer } from '../../store/action/customerAction';
import { fetchAllWarehouses } from '../../store/action/warehouseAction';
import { getFormattedMessage, placeholderText } from '../../shared/sharedMethod';
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faReceipt,
    faShoppingCart,
    faMoneyBills,
    faBarcode,
    faTags,
    faCheck,
    faFloppyDisk,
    faArrowLeft,
    faArrowRight,
    faFileInvoice,
    faRotateLeft,
    faSearch,
    faSlidersH,
    faBuildingColumns
} from "@fortawesome/free-solid-svg-icons";
import LiveCounter from "../../shared/components/LiveCounter";
import LiveSparkline from "../../shared/components/LiveSparkline";
import "../brands/ProductBrandsPremium.css";
import "../units/ProductUnitsPremium.css";

const DEFAULT_PREFIXES = {
    purchases: 'PU',
    purchasesReturn: 'PR',
    sales: 'SA',
    salesReturn: 'SR',
    expense: 'EX'
};

const QUICK_SUGGESTIONS = {
    sales: ['SA', 'SALE', 'INV', 'POS'],
    purchases: ['PU', 'PO', 'PUR', 'GRN'],
    salesReturn: ['SR', 'RET', 'CN', 'SRET'],
    purchasesReturn: ['PR', 'DN', 'PRET', 'RTV'],
    expense: ['EX', 'EXP', 'VCH', 'PET']
};

const Prefixes = (props) => {
    const {
        fetchSetting,
        fetchCurrencies,
        fetchAllCustomer,
        fetchAllWarehouses,
        editSetting,
        settings
    } = props;

    // Instant 0ms initial state
    const [prefixesValue, setPrefixesValue] = useState(() => {
        const attr = settings?.attributes || {};
        return {
            purchases: attr.purchase_code || DEFAULT_PREFIXES.purchases,
            purchasesReturn: attr.purchase_return_code || DEFAULT_PREFIXES.purchasesReturn,
            sales: attr.sale_code || DEFAULT_PREFIXES.sales,
            salesReturn: attr.sale_return_code || DEFAULT_PREFIXES.salesReturn,
            expense: attr.expense_code || DEFAULT_PREFIXES.expense
        };
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [errors, setErrors] = useState({});
    const [disable, setDisable] = useState(true);

    useEffect(() => {
        fetchSetting();
        fetchCurrencies();
        fetchAllCustomer();
        fetchAllWarehouses();
    }, []);

    useEffect(() => {
        if (settings && settings.attributes) {
            const attr = settings.attributes;
            setPrefixesValue({
                purchases: attr.purchase_code || DEFAULT_PREFIXES.purchases,
                purchasesReturn: attr.purchase_return_code || DEFAULT_PREFIXES.purchasesReturn,
                sales: attr.sale_code || DEFAULT_PREFIXES.sales,
                salesReturn: attr.sale_return_code || DEFAULT_PREFIXES.salesReturn,
                expense: attr.expense_code || DEFAULT_PREFIXES.expense
            });
        }
    }, [settings]);

    const onChangeInput = (e) => {
        e.preventDefault();
        setDisable(false);
        setPrefixesValue(inputs => ({ ...inputs, [e.target.name]: e.target.value.toUpperCase() }));
        setErrors({});
    };

    const handleApplyChip = (key, val) => {
        setDisable(false);
        setPrefixesValue(inputs => ({ ...inputs, [key]: val }));
        setErrors({});
    };

    const prepareFormData = (data) => {
        const formData = new FormData();
        formData.append('purchase_code', data.purchases);
        formData.append('purchase_return_code', data.purchasesReturn);
        formData.append('sale_code', data.sales);
        formData.append('sale_return_code', data.salesReturn);
        formData.append('expense_code', data.expense);
        return formData;
    };

    const handleValidation = () => {
        let errs = {};
        let isValid = true;
        if (!prefixesValue['purchases']?.trim()) {
            errs['purchases'] = "Purchase prefix is required";
            isValid = false;
        }
        if (!prefixesValue['purchasesReturn']?.trim()) {
            errs['purchasesReturn'] = "Purchase return prefix is required";
            isValid = false;
        }
        if (!prefixesValue['sales']?.trim()) {
            errs['sales'] = "Sales prefix is required";
            isValid = false;
        }
        if (!prefixesValue['salesReturn']?.trim()) {
            errs['salesReturn'] = "Sales return prefix is required";
            isValid = false;
        }
        if (!prefixesValue['expense']?.trim()) {
            errs['expense'] = "Expense prefix is required";
            isValid = false;
        }
        setErrors(errs);
        return isValid;
    };

    const onEdit = (event) => {
        if (event) event.preventDefault();
        const valid = handleValidation();
        if (valid) {
            editSetting(prepareFormData(prefixesValue));
            setDisable(true);
        }
    };

    const prefixList = [
        {
            key: 'sales',
            title: 'Sales Invoices',
            desc: 'POS Sales checkout invoices & customer receipts',
            icon: faFileInvoice,
            iconBg: '#DCFCE7',
            iconColor: '#16A34A',
            badgeBg: '#DCFCE7',
            badgeColor: '#15803D',
            sampleNum: '1024'
        },
        {
            key: 'purchases',
            title: 'Purchase Orders',
            desc: 'Vendor POs & Stock Inward Receipts',
            icon: faShoppingCart,
            iconBg: '#DBEAFE',
            iconColor: '#2563EB',
            badgeBg: '#DBEAFE',
            badgeColor: '#1D4ED8',
            sampleNum: '0582'
        },
        {
            key: 'salesReturn',
            title: 'Sales Returns',
            desc: 'Customer credit notes & refunded sales',
            icon: faArrowLeft,
            iconBg: '#FEF3C7',
            iconColor: '#D97706',
            badgeBg: '#FEF3C7',
            badgeColor: '#B45309',
            sampleNum: '0129'
        },
        {
            key: 'purchasesReturn',
            title: 'Purchase Returns',
            desc: 'Debit notes & goods returned to suppliers',
            icon: faArrowRight,
            iconBg: '#F3E8FF',
            iconColor: '#9333EA',
            badgeBg: '#F3E8FF',
            badgeColor: '#7E22CE',
            sampleNum: '0047'
        },
        {
            key: 'expense',
            title: 'Business Expenses',
            desc: 'Vouchers & petty cash transactions',
            icon: faMoneyBills,
            iconBg: '#FFEDD5',
            iconColor: '#EA580C',
            badgeBg: '#FFEDD5',
            badgeColor: '#C2410C',
            sampleNum: '0891'
        }
    ];

    const filteredPrefixes = useMemo(() => {
        if (!searchTerm.trim()) return prefixList;
        const q = searchTerm.toLowerCase();
        return prefixList.filter(p => p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q) || (prefixesValue[p.key] || '').toLowerCase().includes(q));
    }, [searchTerm, prefixesValue]);

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title="Prefixes & Codes — infy-pos" />

            <div className="brand-page-container">
                {/* 1. Breadcrumb */}
                <div className="brand-breadcrumb">
                    <span>Dashboard</span>
                    <span>&gt;</span>
                    <span>Settings</span>
                    <span>&gt;</span>
                    <span className="brand-crumb-active">Prefixes</span>
                </div>

                {/* 2. Page Header */}
                <div className="brand-header">
                    <div className="brand-title-group">
                        <h1>Prefixes</h1>
                        <p>Customize reference numbering, transaction invoice prefixes, and receipt identifiers.</p>
                    </div>

                    <div className="brand-header-actions">
                        <button
                            type="button"
                            className="brand-btn-pill"
                            onClick={() => {
                                setPrefixesValue(DEFAULT_PREFIXES);
                                setDisable(false);
                            }}
                        >
                            <FontAwesomeIcon icon={faRotateLeft} />
                            <span>Reset Defaults</span>
                        </button>

                        <button
                            type="button"
                            className="brand-btn-pill brand-btn-primary"
                            onClick={onEdit}
                            disabled={disable}
                        >
                            <FontAwesomeIcon icon={faFloppyDisk} />
                            <span>Save Changes</span>
                        </button>
                    </div>
                </div>

                {/* 3. 4 Real-Time Top KPI Cards Grid */}
                <div className="brand-kpi-grid">
                    {/* Card 1: Configured Categories */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Configured Prefixes</span>
                            <div className="brand-kpi-icon green">
                                <FontAwesomeIcon icon={faTags} />
                            </div>
                        </div>
                        <div className="brand-kpi-value">
                            <LiveCounter value={5} isCurrency={false} />
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge up">Active Units</span>
                            <LiveSparkline data={[5, 5, 5, 5, 5]} color="#16A34A" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 2: Sales Invoice Format */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Sales Invoice Prefix</span>
                            <div className="brand-kpi-icon blue">
                                <FontAwesomeIcon icon={faFileInvoice} />
                            </div>
                        </div>
                        <div className="brand-kpi-value" style={{ fontSize: '22px' }}>
                            {prefixesValue.sales || 'SA'}
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge up">{prefixesValue.sales || 'SA'}-001024</span>
                            <LiveSparkline data={[1, 1]} color="#2563EB" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 3: Purchase Prefix */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Purchase PO Prefix</span>
                            <div className="brand-kpi-icon purple">
                                <FontAwesomeIcon icon={faShoppingCart} />
                            </div>
                        </div>
                        <div className="brand-kpi-value" style={{ fontSize: '22px' }}>
                            {prefixesValue.purchases || 'PU'}
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-label" style={{ fontSize: '13px', color: '#64748B', fontWeight: '700' }}>
                                {prefixesValue.purchases || 'PU'}-000582
                            </span>
                            <LiveSparkline data={[1, 1]} color="#9333EA" width={60} height={24} />
                        </div>
                    </div>

                    {/* Card 4: Numbering Format */}
                    <div className="brand-kpi-card">
                        <div className="brand-kpi-top">
                            <span className="brand-kpi-label">Numbering Engine</span>
                            <div className="brand-kpi-icon orange">
                                <FontAwesomeIcon icon={faBarcode} />
                            </div>
                        </div>
                        <div className="brand-kpi-value" style={{ fontSize: '22px' }}>
                            Auto-Serial
                        </div>
                        <div className="brand-kpi-bottom">
                            <span className="brand-kpi-badge neutral">0-Padded 6 Digits</span>
                            <LiveSparkline data={[1, 1]} color="#D97706" width={60} height={24} />
                        </div>
                    </div>
                </div>

                {/* 4. Main Workspace (Matching Units Table Structure) */}
                <div className="var-workspace">

                    {/* Filter Bar */}
                    <div className="brand-filter-bar">
                        <div className="brand-search-box">
                            <FontAwesomeIcon icon={faSearch} className="brand-search-icon" />
                            <input
                                type="text"
                                placeholder="Search transaction types or prefix codes..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>
                                Total {filteredPrefixes.length} Transaction Types
                            </span>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="var-table-wrap">
                        <table className="var-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '50px', textAlign: 'center' }}>#</th>
                                    <th style={{ minWidth: '240px' }}>TRANSACTION TYPE</th>
                                    <th style={{ minWidth: '260px' }}>PREFIX CODE</th>
                                    <th style={{ minWidth: '240px' }}>LIVE INVOICE / REFERENCE PREVIEW</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPrefixes.map((item, i) => {
                                    const val = prefixesValue[item.key] || '';
                                    const chips = QUICK_SUGGESTIONS[item.key] || [];

                                    return (
                                        <tr key={item.key}>
                                            <td style={{ textAlign: 'center', fontWeight: '700', color: '#64748B' }}>
                                                {i + 1}
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center gap-3">
                                                    <div
                                                        style={{
                                                            width: '40px',
                                                            height: '40px',
                                                            borderRadius: '12px',
                                                            background: item.iconBg,
                                                            color: item.iconColor,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '17px',
                                                            flexShrink: 0
                                                        }}
                                                    >
                                                        <FontAwesomeIcon icon={item.icon} />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: '800', fontSize: '14.5px', color: '#0F172A' }}>
                                                            {item.title}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#64748B' }}>
                                                            {item.desc}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div>
                                                    <input
                                                        type="text"
                                                        name={item.key}
                                                        className="form-control fw-bold text-dark"
                                                        style={{
                                                            borderRadius: '10px',
                                                            height: '42px',
                                                            fontSize: '14px',
                                                            maxWidth: '220px',
                                                            border: '1.5px solid #E2E8F0',
                                                            letterSpacing: '1px'
                                                        }}
                                                        placeholder={`e.g. ${item.key.toUpperCase()}`}
                                                        value={val}
                                                        onChange={onChangeInput}
                                                    />
                                                    {errors[item.key] && (
                                                        <span className="text-danger fs-micro mt-1 d-block fw-semibold">{errors[item.key]}</span>
                                                    )}

                                                    {/* Quick Suggestions Chips */}
                                                    <div className="d-flex align-items-center gap-1 mt-2">
                                                        <span style={{ fontSize: '10.5px', color: '#94A3B8', fontWeight: '600' }}>Quick:</span>
                                                        {chips.map((chip) => (
                                                            <button
                                                                key={chip}
                                                                type="button"
                                                                onClick={() => handleApplyChip(item.key, chip)}
                                                                style={{
                                                                    border: val === chip ? '1px solid #16A34A' : '1px solid #E2E8F0',
                                                                    background: val === chip ? '#DCFCE7' : '#F8FAFC',
                                                                    color: val === chip ? '#15803D' : '#64748B',
                                                                    borderRadius: '6px',
                                                                    padding: '1px 7px',
                                                                    fontSize: '11px',
                                                                    fontWeight: '700',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                {chip}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    <span
                                                        className="badge fw-bold px-3 py-2"
                                                        style={{
                                                            background: item.badgeBg,
                                                            color: item.badgeColor,
                                                            border: `1px solid ${item.badgeColor}33`,
                                                            fontSize: '13px',
                                                            borderRadius: '8px',
                                                            letterSpacing: '0.5px'
                                                        }}
                                                    >
                                                        {val ? `${val}-${item.sampleNum}` : `[PREFIX]-${item.sampleNum}`}
                                                    </span>
                                                    <span style={{ fontSize: '11.5px', color: '#94A3B8' }}>
                                                        (Live Sample Number)
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Bottom Action Footer Bar */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: '24px',
                            padding: '16px 20px',
                            background: '#FFFFFF',
                            border: '1px solid #EEF2F7',
                            borderRadius: '18px',
                            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.03)',
                            flexWrap: 'wrap',
                            gap: '12px'
                        }}
                    >
                        <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
                            Prefix changes take effect immediately on all newly created invoices and records.
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            <button
                                type="button"
                                className="brand-btn-pill"
                                onClick={() => {
                                    setPrefixesValue(DEFAULT_PREFIXES);
                                    setDisable(false);
                                }}
                            >
                                <FontAwesomeIcon icon={faRotateLeft} />
                                <span>Reset</span>
                            </button>

                            <button
                                type="button"
                                className="brand-btn-pill brand-btn-primary"
                                onClick={onEdit}
                                disabled={disable}
                            >
                                <FontAwesomeIcon icon={faFloppyDisk} />
                                <span>Save Changes</span>
                            </button>
                        </div>
                    </div>

                </div>

            </div>
        </MasterLayout>
    );
};

const mapStateToProps = (state) => {
    const { customers, warehouses, isLoading, settings, currencies } = state;
    return { customers, warehouses, isLoading, settings, currencies };
};

export default connect(mapStateToProps, {
    fetchSetting,
    fetchCurrencies,
    fetchAllCustomer,
    fetchAllWarehouses,
    editSetting
})(Prefixes);
