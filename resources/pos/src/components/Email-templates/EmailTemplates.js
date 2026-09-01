import React, { useEffect, useState, useMemo } from 'react';
import { connect } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import MasterLayout from '../MasterLayout';
import TabTitle from '../../shared/tab-title/TabTitle';
import { getFormattedMessage, placeholderText } from '../../shared/sharedMethod';
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";
import MasterTableSkeleton from "../../shared/components/skeletons/MasterTableSkeleton";
import LiveCounter from "../../shared/components/LiveCounter";
import LiveSparkline from "../../shared/components/LiveSparkline";
import useSmartLoading from "../../shared/hooks/useSmartLoading";
import { isPageFirstLoad, markPageAnimated } from "../dashboard/dashboardAnimationState";
import { fetchEmailTemplates, activeInactiveEmail } from "../../store/action/emailTemplatesAction";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faSearch,
    faEnvelope,
    faCheckCircle,
    faPaperPlane,
    faSliders,
    faThLarge,
    faList,
    faEdit,
    faRotateLeft,
    faArrowRight,
    faPlus,
    faRotateRight
} from "@fortawesome/free-solid-svg-icons";
import "../brands/ProductBrandsPremium.css";

const DEFAULT_TEMPLATES_CACHE = [
    {
        id: 1,
        attributes: {
            template_name: 'GREETING TO CUSTOMER ON SALES !',
            content: 'Hi, {customer_name}Your sales Id is {sales_id}Sales Date: {sales_date}',
            status: 1
        }
    },
    {
        id: 2,
        attributes: {
            template_name: 'GREETING TO CUSTOMER ON SALES RETURN !',
            content: 'Hi, {customer_name}Your sales return Id is {sales_return_id}Sales return Date: {sales_return_date}',
            status: 1
        }
    }
];

const EmailTemplates = (props) => {
    const { totalRecord, emailTemplates, fetchEmailTemplates, activeInactiveEmail } = props;

    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [viewMode, setViewMode] = useState("list"); // 'list' or 'grid'

    useEffect(() => {
        fetchEmailTemplates({}, false);
    }, []);

    const goToEditProduct = (item) => {
        const id = item.id;
        navigate('/app/email-templates/' + id);
    };

    const hasLoadedData = (Array.isArray(emailTemplates) && emailTemplates.length > 0) ||
        (emailTemplates && Array.isArray(emailTemplates.data) && emailTemplates.data.length > 0) ||
        (emailTemplates && (emailTemplates.id || emailTemplates.attributes));

    const safeTemplates = Array.isArray(emailTemplates) && emailTemplates.length > 0
        ? emailTemplates
        : (emailTemplates && Array.isArray(emailTemplates.data) && emailTemplates.data.length > 0
            ? emailTemplates.data
            : (emailTemplates && (emailTemplates.id || emailTemplates.attributes)
                ? [emailTemplates]
                : DEFAULT_TEMPLATES_CACHE));

    const totalCount = safeTemplates.length;
    const activeCount = safeTemplates.filter(t => {
        const attr = t.attributes || t;
        return attr.status === 1 || attr.status === true || attr.status === '1';
    }).length;

    const filteredTemplates = useMemo(() => {
        return safeTemplates.filter(item => {
            const attr = item.attributes || item;
            const name = (attr.template_name || '').toLowerCase();
            const content = (attr.content || '').replace(/<\/?[a-zA-Z0-9]+.*?>/ig, '').toLowerCase();
            const search = searchTerm.toLowerCase();

            const matchesSearch = !search || name.includes(search) || content.includes(search);
            const isActive = attr.status === 1 || attr.status === true || attr.status === '1';
            const matchesStatus = selectedStatus === 'all' || (selectedStatus === 'active' ? isActive : !isActive);

            return matchesSearch && matchesStatus;
        });
    }, [safeTemplates, searchTerm, selectedStatus]);

    const onChecked = (row, e) => {
        if (e) e.stopPropagation();
        activeInactiveEmail(row.id, row);
    };

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title={placeholderText('email-template.title')} />

            <div className="brand-page-container">
                {/* 1. Breadcrumb */}
                <div className="brand-breadcrumb">
                    <span>Dashboard</span>
                    <span>&gt;</span>
                    <span>Settings</span>
                    <span>&gt;</span>
                    <span className="brand-crumb-active">Email Templates</span>
                </div>

                {/* 2. Header Section */}
                <div className="brand-header">
                    <div className="brand-title-group">
                        <h1>Email Templates</h1>
                        <p>Configure automated transactional email notifications, customer receipts, and return alerts.</p>
                    </div>
                    <div className="brand-header-actions">
                        <Link
                            to="/app/email-templates/create"
                            className="brand-btn-pill brand-btn-primary text-white text-decoration-none"
                        >
                            <FontAwesomeIcon icon={faPlus} /> Create Email Template
                        </Link>
                    </div>
                </div>

                    {/* 3. 4 REALTIME TOP KPI CARDS GRID */}
                    <div className="brand-kpi-grid">
                        {/* Card 1: Total Templates */}
                        <div className="brand-kpi-card">
                            <div className="brand-kpi-top">
                                <span className="brand-kpi-label">Total Email Templates</span>
                                <div className="brand-kpi-icon green">
                                    <FontAwesomeIcon icon={faEnvelope} />
                                </div>
                            </div>
                            <div className="brand-kpi-value">
                                <LiveCounter value={totalCount} isCurrency={false} />
                            </div>
                            <div className="brand-kpi-bottom">
                                <span className="brand-kpi-badge up">Configured in System</span>
                                <LiveSparkline data={[0, 0, 0, 0, 0, 0, totalCount]} color="#16A34A" width={60} height={24} />
                            </div>
                        </div>

                        {/* Card 2: Active Templates */}
                        <div className="brand-kpi-card">
                            <div className="brand-kpi-top">
                                <span className="brand-kpi-label">Active Automations</span>
                                <div className="brand-kpi-icon blue">
                                    <FontAwesomeIcon icon={faCheckCircle} />
                                </div>
                            </div>
                            <div className="brand-kpi-value">
                                <LiveCounter value={activeCount} isCurrency={false} />
                            </div>
                            <div className="brand-kpi-bottom">
                                <span className="brand-kpi-badge up">Live in System</span>
                                <LiveSparkline data={[0, 0, 0, 0, 0, 0, activeCount]} color="#2563EB" width={60} height={24} />
                            </div>
                        </div>

                        {/* Card 3: System Mailers */}
                        <div className="brand-kpi-card">
                            <div className="brand-kpi-top">
                                <span className="brand-kpi-label">System Automations</span>
                                <div className="brand-kpi-icon purple">
                                    <FontAwesomeIcon icon={faPaperPlane} />
                                </div>
                            </div>
                            <div className="brand-kpi-value">
                                2 Triggers
                            </div>
                            <div className="brand-kpi-bottom">
                                <span className="brand-kpi-label" style={{ fontSize: '13px', color: '#64748B', fontWeight: '700' }}>
                                    Sales & Returns
                                </span>
                                <LiveSparkline data={[0, 0, 0, 0, 0, 0, 2]} color="#9333EA" width={60} height={24} />
                            </div>
                        </div>

                        {/* Card 4: Delivery Gateway */}
                        <div className="brand-kpi-card">
                            <div className="brand-kpi-top">
                                <span className="brand-kpi-label">Delivery Channel</span>
                                <div className="brand-kpi-icon orange">
                                    <FontAwesomeIcon icon={faSliders} />
                                </div>
                            </div>
                            <div className="brand-kpi-value">
                                SMTP / API
                            </div>
                            <div className="brand-kpi-bottom">
                                <span className="brand-kpi-badge neutral">
                                    Active Dispatcher
                                </span>
                                <LiveSparkline data={[0, 0, 0, 0, 0, 0, 1]} color="#D97706" width={60} height={24} />
                            </div>
                        </div>
                    </div>

                    {/* 4. Full Width Main Workspace Container */}
                    <div className="brand-workspace">
                        {/* Search & Filter Controls Bar */}
                        <div className="brand-filter-bar">
                            <div className="brand-search-box">
                                <FontAwesomeIcon icon={faSearch} className="brand-search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search email template name or content..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                <select 
                                    className="var-select-sm" 
                                    value={selectedStatus} 
                                    onChange={e => setSelectedStatus(e.target.value)}
                                >
                                    <option value="all">Status: All</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>

                                <div className="var-view-toggle">
                                    <button
                                        type="button"
                                        className={'var-view-btn ' + (viewMode === 'list' ? 'active' : '')}
                                        onClick={() => setViewMode('list')}
                                        title="Table View"
                                    >
                                        <FontAwesomeIcon icon={faList} />
                                    </button>
                                    <button
                                        type="button"
                                        className={'var-view-btn ' + (viewMode === 'grid' ? 'active' : '')}
                                        onClick={() => setViewMode('grid')}
                                        title="Grid View"
                                    >
                                        <FontAwesomeIcon icon={faThLarge} />
                                    </button>
                                </div>

                                <button 
                                    type="button" 
                                    className="cat-btn-filter" 
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSelectedStatus('all');
                                    }}
                                >
                                    Reset
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        {filteredTemplates.length === 0 ? (
                            <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #EEF2F7', padding: '60px 24px', textAlign: 'center', width: '100%' }}>
                                <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', margin: '0 auto 16px auto', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.12)' }}>
                                    <FontAwesomeIcon icon={faEnvelope} />
                                </div>
                                <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                                    No email templates found
                                </h3>
                                <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '380px', margin: '0 auto 20px auto', lineHeight: 1.5 }}>
                                    All system notification templates will be displayed here
                                </p>
                            </div>
                        ) : viewMode === 'list' ? (
                            /* TABLE VIEW */
                            <div className="brand-table-wrapper" style={{ overflowX: 'auto' }}>
                                <table className="brand-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ padding: '14px 18px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748B', borderBottom: '1px solid #EEF2F7' }}>TEMPLATE NAME</th>
                                            <th style={{ padding: '14px 18px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748B', borderBottom: '1px solid #EEF2F7' }}>MESSAGE CONTENT PREVIEW</th>
                                            <th style={{ padding: '14px 18px', textAlign: 'center', fontSize: '12px', fontWeight: '700', color: '#64748B', borderBottom: '1px solid #EEF2F7' }}>STATUS</th>
                                            <th style={{ padding: '14px 18px', textAlign: 'right', fontSize: '12px', fontWeight: '700', color: '#64748B', borderBottom: '1px solid #EEF2F7' }}>ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredTemplates.map(item => {
                                            const attr = item.attributes || item;
                                            const isActive = attr.status === 1 || attr.status === true || attr.status === '1';
                                            const cleanContent = (attr.content || '').replace(/<\/?[a-zA-Z0-9]+.*?>/ig, '');

                                            return (
                                                <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                                    <td style={{ padding: '14px 18px' }}>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>
                                                                <FontAwesomeIcon icon={faEnvelope} />
                                                            </div>
                                                            <div>
                                                                <strong style={{ color: '#0F172A', fontSize: '14px', fontWeight: '800' }}>
                                                                    {attr.template_name}
                                                                </strong>
                                                                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>
                                                                    ID: #{item.id} • Automated Trigger
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '14px 18px', color: '#475569', fontSize: '13px', maxWidth: '400px' }}>
                                                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {cleanContent}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                                                        <div className="form-check form-switch d-inline-block m-0" title={isActive ? "Template Active" : "Template Inactive"}>
                                                            <input 
                                                                className="form-check-input" 
                                                                type="checkbox" 
                                                                role="switch" 
                                                                checked={isActive} 
                                                                onChange={(e) => onChecked(item, e)}
                                                                style={{ cursor: 'pointer', width: '32px', height: '16px' }}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-primary"
                                                            onClick={() => goToEditProduct(item)}
                                                            style={{ borderRadius: '8px', fontWeight: '700', fontSize: '12px', padding: '4px 12px' }}
                                                        >
                                                            <FontAwesomeIcon icon={faEdit} className="me-1" /> Edit Template
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            /* GRID CARDS VIEW */
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                                {filteredTemplates.map(item => {
                                    const attr = item.attributes || item;
                                    const isActive = attr.status === 1 || attr.status === true || attr.status === '1';
                                    const cleanContent = (attr.content || '').replace(/<\/?[a-zA-Z0-9]+.*?>/ig, '');

                                    return (
                                        <div
                                            key={item.id}
                                            style={{
                                                background: '#FFFFFF',
                                                border: '1px solid #EEF2F7',
                                                borderRadius: '20px',
                                                padding: '20px',
                                                boxShadow: '0 4px 16px rgba(15, 23, 42, 0.03)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                                transition: 'all 200ms ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-3px)';
                                                e.currentTarget.style.boxShadow = '0 12px 28px rgba(15, 23, 42, 0.08)';
                                                e.currentTarget.style.borderColor = '#CBD5E1';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = '0 4px 16px rgba(15, 23, 42, 0.03)';
                                                e.currentTarget.style.borderColor = '#EEF2F7';
                                            }}
                                        >
                                            <div>
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>
                                                        <FontAwesomeIcon icon={faEnvelope} />
                                                    </div>
                                                    <div className="form-check form-switch m-0" onClick={(e) => e.stopPropagation()}>
                                                        <input 
                                                            className="form-check-input" 
                                                            type="checkbox" 
                                                            role="switch" 
                                                            checked={isActive} 
                                                            onChange={(e) => onChecked(item, e)}
                                                            style={{ cursor: 'pointer', width: '32px', height: '16px' }}
                                                        />
                                                    </div>
                                                </div>

                                                <strong style={{ fontSize: '15px', color: '#0F172A', fontWeight: '800', display: 'block', margin: '8px 0 4px 0' }}>
                                                    {attr.template_name}
                                                </strong>

                                                <p style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.5', margin: '8px 0 16px 0', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                    {cleanContent}
                                                </p>
                                            </div>

                                            <div className="d-flex justify-content-between align-items-center pt-3" style={{ borderTop: '1px solid #F1F5F9' }}>
                                                <span style={{ background: isActive ? '#DCFCE7' : '#F1F5F9', color: isActive ? '#15803D' : '#64748B', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '999px' }}>
                                                    {isActive ? '● Active' : '○ Inactive'}
                                                </span>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => goToEditProduct(item)}
                                                    style={{ borderRadius: '8px', fontWeight: '700', fontSize: '12px', padding: '4px 12px' }}
                                                >
                                                    <FontAwesomeIcon icon={faEdit} className="me-1" /> Edit
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
        </MasterLayout>
    );
};

const mapStateToProps = (state) => {
    const { totalRecord, isLoading, emailTemplates } = state;
    return { totalRecord, isLoading, emailTemplates };
};

export default connect(mapStateToProps, { fetchEmailTemplates, activeInactiveEmail })(EmailTemplates);
