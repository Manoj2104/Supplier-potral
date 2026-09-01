import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MasterLayout from '../MasterLayout';
import TabTitle from '../../shared/tab-title/TabTitle';
import LiveSparkline from '../../shared/components/LiveSparkline';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faLifeRing,
    faPlus,
    faTriangleExclamation,
    faHeadset,
    faUserShield,
    faSearch,
    faThLarge,
    faList,
    faEye,
    faEdit,
    faTrash,
    faRotateLeft,
    faComments,
    faClock,
    faCheckCircle,
    faTicket,
    faXmark,
    faPaperPlane,
    faPaperclip,
    faMessage,
    faShieldAlt,
    faUser,
    faEnvelope,
    faChevronDown,
    faChevronUp
} from '@fortawesome/free-solid-svg-icons';
import './SupportPortal.css';

const BOT_RESPONSES = {
    'ticket':    'To raise a ticket, click the "+ Raise Support Ticket" button. Our support engineers respond within 15 minutes.',
    'complaint': 'To file a service complaint, click "File Complaint". Escalated tickets are reviewed directly by Support Desk Management.',
    'printer':   'For thermal receipt printer issues, ensure your USB/LAN cable is connected and Baud Rate is set to 9600 in Printer Settings.',
    'billing':   'For billing issues or invoice corrections, go to Settings -> Tax & Invoices or submit a ticket under the Billing category.',
    'password':  'To reset staff passwords, navigate to People -> Users -> Edit User -> Change Password.',
    'report':    'Reports can be exported as Excel/CSV from the Reports module. Custom date filters are available in the top bar.',
    'hello':     'Hello! 👋 Welcome to Suguna POS Support Desk. How can I assist you with your POS system today?',
    'hi':        'Hi there! 👋 I am your automated Suguna POS support assistant. How can I help you?',
    'thanks':    'You are very welcome! 😊 Feel free to raise a support ticket anytime if you need further help.',
};

function getBotReply(msg) {
    const lower = msg.toLowerCase();
    for (const [key, reply] of Object.entries(BOT_RESPONSES)) {
        if (lower.includes(key)) return reply;
    }
    return "I've logged your query. Would you like me to convert this chat into an official Support Ticket for our technical team?";
}

export default function SupportPortal() {
    const [tickets, setTickets] = useState(() => {
        try {
            const saved = localStorage.getItem('suguna_pos_support_tickets');
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return [];
    });

    useEffect(() => {
        try {
            localStorage.setItem('suguna_pos_support_tickets', JSON.stringify(tickets));
        } catch (e) {}
    }, [tickets]);

    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [viewMode, setViewMode] = useState('list');
    const [selectedRows, setSelectedRows] = useState([]);

    // Modals and Drawers
    const [activeModal, setActiveModal] = useState(null); // 'ticket' | 'complaint' | 'chat'
    const [drawerTicket, setDrawerTicket] = useState(null);
    const [replyText, setReplyText] = useState('');

    // Screenshot Attachments State
    const [ticketScreenshot, setTicketScreenshot] = useState(null); // { url, name, size }
    const [complaintScreenshot, setComplaintScreenshot] = useState(null);
    const [replyScreenshot, setReplyScreenshot] = useState(null);
    const [previewImageModal, setPreviewImageModal] = useState(null); // Fullscreen lightbox preview

    // File selection helper
    const handleFileSelect = (e, setter) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file (PNG, JPG, JPEG, WEBP, GIF)');
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            setter({
                url: event.target.result,
                name: file.name,
                size: (file.size / 1024).toFixed(1) + ' KB'
            });
        };
        reader.readAsDataURL(file);
    };

    // Clipboard paste helper (Ctrl+V)
    const handlePaste = (e, setter) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                const reader = new FileReader();
                reader.onload = (event) => {
                    setter({
                        url: event.target.result,
                        name: `screenshot_${Date.now().toString().slice(-4)}.png`,
                        size: (blob.size / 1024).toFixed(1) + ' KB'
                    });
                };
                reader.readAsDataURL(blob);
                break;
            }
        }
    };

    // Ticket Creation Form
    const [newTicket, setNewTicket] = useState({
        subject: '',
        email: 'care@suguna.com',
        submittedBy: 'Suguna Administrator',
        category: 'Technical POS',
        priority: 'High',
        description: ''
    });

    // Complaint Form
    const [newComplaint, setNewComplaint] = useState({
        name: 'Suguna Admin',
        email: 'admin@suguna.com',
        department: 'Technical POS',
        severity: 'Major',
        details: ''
    });

    // Chatbot State
    const [chatMessages, setChatMessages] = useState([
        { from: 'bot', text: "Hello! 👋 Welcome to Suguna POS Support Desk. How can I assist you with your POS system today?\n\nYou can ask about: thermal printers, billing calculation, user permissions, reports, or ticket escalation." }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [chatTyping, setChatTyping] = useState(false);
    const chatBottomRef = useRef(null);

    useEffect(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages, chatTyping]);

    // Filtering logic
    const filteredTickets = tickets.filter(item => {
        const matchesSearch =
            item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.submittedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.category.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
        const matchesPriority = priorityFilter === 'all' || item.priority.toLowerCase() === priorityFilter.toLowerCase();
        const matchesStatus = statusFilter === 'all' || item.status.toLowerCase().replace(' ', '-') === statusFilter.toLowerCase();

        return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
    }).sort((a, b) => {
        if (sortBy === 'newest') return b.id.localeCompare(a.id);
        if (sortBy === 'oldest') return a.id.localeCompare(b.id);
        if (sortBy === 'urgent') return (b.priority === 'Urgent' ? 1 : 0) - (a.priority === 'Urgent' ? 1 : 0);
        return 0;
    });

    const sortedTickets = filteredTickets;

    // Bulk selection handlers
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedRows(filteredTickets.map(t => t.id));
        } else {
            setSelectedRows([]);
        }
    };

    const handleSelectRow = (id) => {
        if (selectedRows.includes(id)) {
            setSelectedRows(selectedRows.filter(rId => rId !== id));
        } else {
            setSelectedRows([...selectedRows, id]);
        }
    };

    // Raise Ticket Submit
    const handleCreateTicketSubmit = (e) => {
        e.preventDefault();
        const created = {
            id: `TK-${Math.floor(1000 + Math.random() * 9000)}`,
            subject: newTicket.subject,
            submittedBy: newTicket.submittedBy,
            email: newTicket.email,
            category: newTicket.category,
            priority: newTicket.priority,
            status: 'Open',
            createdAt: 'Just now',
            attachment: ticketScreenshot ? { ...ticketScreenshot } : null,
            messages: [
                {
                    sender: newTicket.submittedBy,
                    role: 'customer',
                    text: newTicket.description,
                    time: 'Just now',
                    attachment: ticketScreenshot ? { ...ticketScreenshot } : null
                }
            ]
        };
        setTickets([created, ...tickets]);
        setActiveModal(null);
        setTicketScreenshot(null);
        setNewTicket({ subject: '', email: 'care@suguna.com', submittedBy: 'Suguna Administrator', category: 'Technical POS', priority: 'High', description: '' });
    };

    // File Complaint Submit
    const handleCreateComplaintSubmit = (e) => {
        e.preventDefault();
        const created = {
            id: `CMP-${Math.floor(1000 + Math.random() * 9000)}`,
            subject: `[ESCALATED COMPLAINT] ${newComplaint.details.slice(0, 40)}...`,
            submittedBy: newComplaint.name,
            email: newComplaint.email,
            category: newComplaint.department,
            priority: 'Urgent',
            status: 'In Progress',
            createdAt: 'Just now',
            attachment: complaintScreenshot ? { ...complaintScreenshot } : null,
            messages: [
                {
                    sender: newComplaint.name,
                    role: 'customer',
                    text: `COMPLAINT SEVERITY: ${newComplaint.severity}\n\n${newComplaint.details}`,
                    time: 'Just now',
                    attachment: complaintScreenshot ? { ...complaintScreenshot } : null
                }
            ]
        };
        setTickets([created, ...tickets]);
        setActiveModal(null);
        setComplaintScreenshot(null);
        setNewComplaint({ name: 'Suguna Admin', email: 'admin@suguna.com', department: 'Technical POS', severity: 'Major', details: '' });
    };

    // Drawer Send Reply
    const handleSendReply = (e) => {
        e.preventDefault();
        if ((!replyText.trim() && !replyScreenshot) || !drawerTicket) return;
        const updated = tickets.map(t => {
            if (t.id === drawerTicket.id) {
                return {
                    ...t,
                    messages: [
                        ...t.messages,
                        {
                            sender: 'Suguna Administrator',
                            role: 'customer',
                            text: replyText || '(Attached Screenshot)',
                            time: 'Just now',
                            attachment: replyScreenshot ? { ...replyScreenshot } : null
                        }
                    ]
                };
            }
            return t;
        });
        setTickets(updated);
        setDrawerTicket(updated.find(t => t.id === drawerTicket.id));
        setReplyText('');
        setReplyScreenshot(null);
    };

    // Chatbot send
    const handleSendChatMessage = () => {
        const text = chatInput.trim();
        if (!text) return;
        setChatMessages(prev => [...prev, { from: 'user', text }]);
        setChatInput('');
        setChatTyping(true);
        setTimeout(() => {
            setChatTyping(false);
            setChatMessages(prev => [...prev, { from: 'bot', text: getBotReply(text) }]);
        }, 800);
    };

    return (
        <MasterLayout>
            <TabTitle title="Support Center & Helpdesk — Suguna POS" />

            <div className="sp-page-container">
                {/* 1. Breadcrumb */}
                <div className="sp-breadcrumb">
                    <span>Dashboard</span>
                    <span>&gt;</span>
                    <span className="sp-crumb-active">Support Center & Client Helpdesk</span>
                </div>

                {/* 2. Header */}
                <div className="sp-header">
                    <div className="sp-title-group">
                        <h1>
                            <FontAwesomeIcon icon={faLifeRing} style={{ color: '#16A34A' }} />
                            Support Center & Helpdesk
                        </h1>
                        <p>Manage support tickets, live assistance chats, service complaints, and admin helpdesk requests.</p>
                    </div>

                    <div className="sp-header-actions">
                        <button
                            type="button"
                            className="brand-btn-pill brand-btn-primary"
                            onClick={() => setActiveModal('ticket')}
                        >
                            <FontAwesomeIcon icon={faPlus} />
                            <span>Raise Support Ticket</span>
                        </button>

                        <button
                            type="button"
                            className="brand-btn-pill brand-btn-orange"
                            onClick={() => setActiveModal('complaint')}
                        >
                            <FontAwesomeIcon icon={faTriangleExclamation} />
                            <span>File Complaint</span>
                        </button>

                        <button
                            type="button"
                            className="brand-btn-pill brand-btn-blue"
                            onClick={() => setActiveModal('chat')}
                        >
                            <FontAwesomeIcon icon={faHeadset} />
                            <span>Live Support Chat</span>
                        </button>
                    </div>
                </div>

                {/* 3. 4 Real-Time Summary Cards Grid */}
                <div className="sp-kpi-grid">
                    {/* Card 1: Active Tickets */}
                    <div className="sp-kpi-card">
                        <div className="sp-kpi-top">
                            <span className="sp-kpi-label">Active Tickets</span>
                            <div className="sp-kpi-icon green">
                                <FontAwesomeIcon icon={faTicket} />
                            </div>
                        </div>
                        <div className="sp-kpi-val">
                            {tickets.filter(t => t.status !== 'Resolved' && t.status !== 'Closed').length}
                        </div>
                        <div className="sp-kpi-sub">
                            <span className="sp-badge-pill green">● Active Desk</span>
                            <LiveSparkline data={[2, 3, 2, 4, 3]} color="#16A34A" width={60} height={20} />
                        </div>
                    </div>

                    {/* Card 2: Resolved Rate */}
                    <div className="sp-kpi-card">
                        <div className="sp-kpi-top">
                            <span className="sp-kpi-label">Resolved Tickets</span>
                            <div className="sp-kpi-icon blue">
                                <FontAwesomeIcon icon={faCheckCircle} />
                            </div>
                        </div>
                        <div className="sp-kpi-val">
                            {tickets.filter(t => t.status === 'Resolved').length}
                        </div>
                        <div className="sp-kpi-sub">
                            <span className="sp-badge-pill blue">
                                {tickets.length > 0 ? `${Math.round((tickets.filter(t => t.status === 'Resolved').length / tickets.length) * 100)}% Resolution` : '0% Resolution'}
                            </span>
                            <LiveSparkline data={[10, 12, 14, 18]} color="#2563EB" width={60} height={20} />
                        </div>
                    </div>

                    {/* Card 3: Avg SLA Response */}
                    <div className="sp-kpi-card">
                        <div className="sp-kpi-top">
                            <span className="sp-kpi-label">Avg Response SLA</span>
                            <div className="sp-kpi-icon purple">
                                <FontAwesomeIcon icon={faClock} />
                            </div>
                        </div>
                        <div className="sp-kpi-val" style={{ fontSize: '22px' }}>
                            &lt; 15 Mins
                        </div>
                        <div className="sp-kpi-sub">
                            <span className="sp-badge-pill purple">SLA Guaranteed</span>
                            <LiveSparkline data={[15, 12, 10, 8]} color="#9333EA" width={60} height={20} />
                        </div>
                    </div>

                    {/* Card 4: Live Support Desk */}
                    <div className="sp-kpi-card">
                        <div className="sp-kpi-top">
                            <span className="sp-kpi-label">Live Support Desk</span>
                            <div className="sp-kpi-icon orange">
                                <FontAwesomeIcon icon={faComments} />
                            </div>
                        </div>
                        <div className="sp-kpi-val" style={{ fontSize: '20px' }}>
                            24/7 Available
                        </div>
                        <div className="sp-kpi-sub">
                            <span className="sp-badge-pill orange">● 3 Agents Online</span>
                            <LiveSparkline data={[1, 1, 1, 1]} color="#D97706" width={60} height={20} />
                        </div>
                    </div>
                </div>

                {/* 4. Search & Filter Controls Bar */}
                <div className="sp-filter-bar">
                    <div className="sp-search-box">
                        <input
                            type="text"
                            className="sp-search-input"
                            placeholder="Search tickets by ID, subject, submitted by..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <FontAwesomeIcon icon={faSearch} className="sp-search-icon" />
                    </div>

                    <div className="sp-filter-controls">
                        <select
                            className="sp-filter-select"
                            value={categoryFilter}
                            onChange={e => setCategoryFilter(e.target.value)}
                        >
                            <option value="all">All Categories</option>
                            <option value="Hardware POS">Hardware POS</option>
                            <option value="Billing">Billing & Tax</option>
                            <option value="Technical POS">Technical POS</option>
                            <option value="Feature Request">Feature Request</option>
                            <option value="Account">Account Permissions</option>
                        </select>

                        <select
                            className="sp-filter-select"
                            value={priorityFilter}
                            onChange={e => setPriorityFilter(e.target.value)}
                        >
                            <option value="all">All Priorities</option>
                            <option value="urgent">Urgent</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>

                        <select
                            className="sp-filter-select"
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="open">Open</option>
                            <option value="in-progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                        </select>

                        <select
                            className="sp-filter-select"
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                        >
                            <option value="newest">Sort: Newest First</option>
                            <option value="oldest">Sort: Oldest First</option>
                            <option value="priority">Sort: High Priority</option>
                        </select>

                        <div className="sp-view-toggle">
                            <button
                                type="button"
                                className={`sp-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                                onClick={() => setViewMode('list')}
                                title="List Table View"
                            >
                                <FontAwesomeIcon icon={faList} />
                            </button>
                            <button
                                type="button"
                                className={`sp-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                onClick={() => setViewMode('grid')}
                                title="Grid View"
                            >
                                <FontAwesomeIcon icon={faThLarge} />
                            </button>
                        </div>

                        <button
                            type="button"
                            className="brand-btn-pill"
                            onClick={() => {
                                setSearchTerm('');
                                setCategoryFilter('all');
                                setPriorityFilter('all');
                                setStatusFilter('all');
                                setSortBy('newest');
                            }}
                        >
                            <FontAwesomeIcon icon={faRotateLeft} />
                            <span>Reset</span>
                        </button>
                    </div>
                </div>

                {/* 5. Master Tickets Table View */}
                <div className="var-table-wrap">
                    <table className="var-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}>
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={selectedRows.length === sortedTickets.length && sortedTickets.length > 0}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th>TICKET ID & SUBJECT</th>
                                <th>SUBMITTED BY</th>
                                <th>CATEGORY</th>
                                <th>PRIORITY</th>
                                <th>CREATED ON</th>
                                <th>STATUS</th>
                                <th style={{ textAlign: 'right' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedTickets.length === 0 ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '60px 20px' }}>
                                        <div style={{
                                            width: '64px',
                                            height: '64px',
                                            borderRadius: '20px',
                                            background: '#DCFCE7',
                                            color: '#16A34A',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '26px',
                                            margin: '0 auto 16px auto'
                                        }}>
                                            <FontAwesomeIcon icon={faTicket} />
                                        </div>
                                        <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '6px' }}>
                                            No support tickets found
                                        </h3>
                                        <p style={{ fontSize: '13.5px', color: '#64748B', maxWidth: '400px', margin: '0 auto 20px auto', lineHeight: '1.5' }}>
                                            You haven't created any support tickets yet. Click below to submit your first request.
                                        </p>
                                        <button
                                            type="button"
                                            className="brand-btn-pill brand-btn-primary"
                                            onClick={() => setActiveModal('ticket')}
                                        >
                                            <FontAwesomeIcon icon={faPlus} />
                                            <span>Raise Support Ticket</span>
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                sortedTickets.map(item => {
                                    const isSelected = selectedRows.includes(item.id);
                                    return (
                                        <tr key={item.id} style={{ background: isSelected ? '#F0FDF4' : 'transparent' }}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    checked={isSelected}
                                                    onChange={() => handleSelectRow(item.id)}
                                                />
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center gap-3">
                                                    <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                                                        <FontAwesomeIcon icon={faTicket} />
                                                    </div>
                                                    <div>
                                                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#2563EB', display: 'block' }}>{item.id}</span>
                                                        <span style={{ fontWeight: '700', fontSize: '14px', color: '#0F172A' }}>{item.subject}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: '700', fontSize: '13.5px', color: '#0F172A' }}>{item.submittedBy}</div>
                                                <div style={{ fontSize: '11px', color: '#64748B' }}>{item.email}</div>
                                            </td>
                                            <td>
                                                <span className="sp-category-badge">{item.category}</span>
                                            </td>
                                            <td>
                                                <span className={`sp-priority-badge ${item.priority.toLowerCase()}`}>
                                                    {item.priority}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A' }}>{item.createdAt}</div>
                                            </td>
                                            <td>
                                                <span className={`var-status-badge ${item.status.toLowerCase().replace(' ', '-')}`}>
                                                    <span className="status-dot"></span>{item.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="brand-card-actions" style={{ justifyContent: 'flex-end' }}>
                                                    <button
                                                        type="button"
                                                        className="brand-action-btn"
                                                        title="View Ticket Timeline"
                                                        onClick={() => setDrawerTicket(item)}
                                                    >
                                                        <FontAwesomeIcon icon={faEye} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="brand-action-btn chat"
                                                        title="Live Chat"
                                                        onClick={() => setActiveModal('chat')}
                                                    >
                                                        <FontAwesomeIcon icon={faComments} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="brand-action-btn delete"
                                                        title="Close Ticket"
                                                        onClick={() => {
                                                            setTickets(tickets.map(t => t.id === item.id ? { ...t, status: 'Resolved' } : t));
                                                        }}
                                                    >
                                                        <FontAwesomeIcon icon={faCheckCircle} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 6. Ticket Preview Slide-Over Drawer */}
                {drawerTicket && (
                    <div className="sp-drawer-backdrop" onClick={() => setDrawerTicket(null)}>
                        <div className="sp-drawer" onClick={e => e.stopPropagation()}>
                            <div className="sp-drawer-header">
                                <div>
                                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#2563EB' }}>{drawerTicket.id}</div>
                                    <h2 className="sp-drawer-title">{drawerTicket.subject}</h2>
                                    <div className="d-flex align-items-center gap-2 mt-2">
                                        <span className="sp-category-badge">{drawerTicket.category}</span>
                                        <span className={`sp-priority-badge ${drawerTicket.priority.toLowerCase()}`}>{drawerTicket.priority}</span>
                                        <span className={`var-status-badge ${drawerTicket.status.toLowerCase().replace(' ', '-')}`}><span className="status-dot"></span>{drawerTicket.status}</span>
                                    </div>
                                </div>
                                <button type="button" className="sp-view-btn" onClick={() => setDrawerTicket(null)}>
                                    <FontAwesomeIcon icon={faXmark} />
                                </button>
                            </div>
                            <div className="sp-drawer-body">
                                <div className="sp-timeline">
                                    {drawerTicket.messages.map((m, idx) => (
                                        <div key={idx} className={`sp-timeline-item ${m.role === 'agent' ? 'agent' : ''}`}>
                                            <div className="d-flex align-items-center justify-content-between mb-2">
                                                <span style={{ fontWeight: '700', fontSize: '13px', color: '#0F172A' }}>{m.sender}</span>
                                                <span style={{ fontSize: '11px', color: '#64748B' }}>{m.time}</span>
                                            </div>
                                            <p style={{ fontSize: '13.5px', color: '#334155', margin: 0, lineHeight: '1.5', whiteSpace: 'pre-line' }}>{m.text}</p>
                                            {m.attachment && (
                                                <div className="sp-timeline-attachment">
                                                    <div className="sp-attachment-thumb" onClick={() => setPreviewImageModal(m.attachment.url)}>
                                                        <img src={m.attachment.url} alt={m.attachment.name} />
                                                        <div className="sp-attachment-overlay">
                                                            <FontAwesomeIcon icon={faEye} />
                                                            <span>View Screenshot</span>
                                                        </div>
                                                    </div>
                                                    <div className="sp-attachment-meta">
                                                        <span>{m.attachment.name}</span>
                                                        <span>({m.attachment.size})</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="sp-drawer-footer">
                                <form onSubmit={handleSendReply}>
                                    <textarea
                                        rows={3}
                                        className="form-control mb-2"
                                        style={{ borderRadius: '12px', fontSize: '13.5px' }}
                                        placeholder="Type your reply to support team (or paste screenshot Ctrl+V)..."
                                        value={replyText}
                                        onChange={e => setReplyText(e.target.value)}
                                        onPaste={e => handlePaste(e, setReplyScreenshot)}
                                    />

                                    {replyScreenshot && (
                                        <div className="sp-preview-card mb-2" style={{ padding: '6px 10px' }}>
                                            <img src={replyScreenshot.url} alt="Reply preview" className="sp-preview-img" style={{ width: 44, height: 44 }} onClick={() => setPreviewImageModal(replyScreenshot.url)} />
                                            <div className="sp-preview-info">
                                                <div className="sp-preview-name" style={{ fontSize: 12 }}>{replyScreenshot.name}</div>
                                                <div className="sp-preview-size" style={{ fontSize: 11 }}>{replyScreenshot.size}</div>
                                            </div>
                                            <button type="button" className="sp-preview-remove" style={{ width: 26, height: 26 }} onClick={() => setReplyScreenshot(null)}>
                                                <FontAwesomeIcon icon={faXmark} style={{ fontSize: 11 }} />
                                            </button>
                                        </div>
                                    )}

                                    <div className="d-flex align-items-center justify-content-between">
                                        <div className="d-flex align-items-center gap-2">
                                            <select
                                                className="form-select form-select-sm"
                                                style={{ width: '140px', borderRadius: '8px' }}
                                                value={drawerTicket.status}
                                                onChange={e => {
                                                    const newSt = e.target.value;
                                                    setTickets(tickets.map(t => t.id === drawerTicket.id ? { ...t, status: newSt } : t));
                                                    setDrawerTicket({ ...drawerTicket, status: newSt });
                                                }}
                                            >
                                                <option value="Open">Status: Open</option>
                                                <option value="In Progress">Status: In Progress</option>
                                                <option value="Resolved">Status: Resolved</option>
                                            </select>

                                            <label className="btn btn-sm btn-light border" style={{ borderRadius: '8px', cursor: 'pointer', margin: 0 }} title="Attach Screenshot">
                                                <input type="file" accept="image/*" className="d-none" onChange={e => handleFileSelect(e, setReplyScreenshot)} />
                                                <FontAwesomeIcon icon={faPaperclip} />
                                            </label>
                                        </div>

                                        <button type="submit" className="brand-btn-pill brand-btn-primary">
                                            <FontAwesomeIcon icon={faPaperPlane} />
                                            <span>Send Reply</span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* 7. Raise Support Ticket Modal */}
                {activeModal === 'ticket' && (
                    <div className="sp-modal-center-backdrop" onClick={() => setActiveModal(null)}>
                        <div className="mail-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px' }}>
                            <div className="mail-modal-header">
                                <div className="mail-modal-title">
                                    <FontAwesomeIcon icon={faPlus} style={{ color: '#16A34A' }} />
                                    <span>Raise New Support Ticket</span>
                                </div>
                                <button type="button" className="mail-modal-close" onClick={() => { setActiveModal(null); setTicketScreenshot(null); }}>
                                    <FontAwesomeIcon icon={faXmark} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateTicketSubmit} onPaste={e => handlePaste(e, setTicketScreenshot)}>
                                <div className="mb-3">
                                    <label className="form-label fw-bold text-dark" style={{ fontSize: 13 }}>Ticket Subject *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        style={{ borderRadius: 12, height: 44, fontSize: 13.5 }}
                                        placeholder="Brief summary of your issue (e.g. Barcode scanner not working)"
                                        value={newTicket.subject}
                                        onChange={e => setNewTicket({ ...newTicket, subject: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="row g-3 mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold text-dark" style={{ fontSize: 13 }}>Issue Category *</label>
                                        <select
                                            className="form-select"
                                            style={{ borderRadius: 12, height: 44, fontSize: 13.5 }}
                                            value={newTicket.category}
                                            onChange={e => setNewTicket({ ...newTicket, category: e.target.value })}
                                        >
                                            <option value="Technical POS">Technical POS</option>
                                            <option value="Hardware POS">Hardware POS</option>
                                            <option value="Billing">Billing & Tax</option>
                                            <option value="Feature Request">Feature Request</option>
                                            <option value="Account">Account Permissions</option>
                                        </select>
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label fw-bold text-dark" style={{ fontSize: 13 }}>Priority SLA *</label>
                                        <select
                                            className="form-select"
                                            style={{ borderRadius: 12, height: 44, fontSize: 13.5 }}
                                            value={newTicket.priority}
                                            onChange={e => setNewTicket({ ...newTicket, priority: e.target.value })}
                                        >
                                            <option value="Urgent">Urgent (Critical Outage)</option>
                                            <option value="High">High (High Impact)</option>
                                            <option value="Medium">Medium (Normal Query)</option>
                                            <option value="Low">Low (General Inquiry)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-bold text-dark" style={{ fontSize: 13 }}>Detailed Description *</label>
                                    <textarea
                                        rows={4}
                                        className="form-control"
                                        style={{ borderRadius: 12, fontSize: 13.5 }}
                                        placeholder="Provide exact details or error messages encountered..."
                                        value={newTicket.description}
                                        onChange={e => setNewTicket({ ...newTicket, description: e.target.value })}
                                        required
                                    />
                                </div>

                                {/* Attach Screenshot (Optional) */}
                                <div className="mb-4">
                                    <label className="form-label fw-bold text-dark d-flex align-items-center justify-content-between" style={{ fontSize: 13 }}>
                                        <span>Attach Screenshot (Optional)</span>
                                        <span className="text-muted fw-normal" style={{ fontSize: 11 }}>Supports PNG, JPG, WebP or Paste (Ctrl+V)</span>
                                    </label>

                                    {!ticketScreenshot ? (
                                        <label className="sp-upload-box">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="d-none"
                                                onChange={e => handleFileSelect(e, setTicketScreenshot)}
                                            />
                                            <div className="sp-upload-icon">
                                                <FontAwesomeIcon icon={faPaperclip} />
                                            </div>
                                            <div className="sp-upload-text">
                                                <strong>Click to browse</strong> or drag & drop screenshot here
                                            </div>
                                            <div className="sp-upload-hint">PNG, JPG, JPEG, WebP or paste directly from clipboard</div>
                                        </label>
                                    ) : (
                                        <div className="sp-preview-card">
                                            <img
                                                src={ticketScreenshot.url}
                                                alt="Screenshot Preview"
                                                className="sp-preview-img"
                                                onClick={() => setPreviewImageModal(ticketScreenshot.url)}
                                                title="Click to zoom screenshot"
                                            />
                                            <div className="sp-preview-info">
                                                <div className="sp-preview-name">{ticketScreenshot.name}</div>
                                                <div className="sp-preview-size">{ticketScreenshot.size}</div>
                                            </div>
                                            <button
                                                type="button"
                                                className="sp-preview-remove"
                                                onClick={() => setTicketScreenshot(null)}
                                                title="Remove Screenshot"
                                            >
                                                <FontAwesomeIcon icon={faXmark} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="d-flex justify-content-end gap-2">
                                    <button type="button" className="brand-btn-pill" onClick={() => { setActiveModal(null); setTicketScreenshot(null); }}>Cancel</button>
                                    <button type="submit" className="brand-btn-pill brand-btn-primary">
                                        <FontAwesomeIcon icon={faPaperPlane} />
                                        <span>Submit Ticket</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* 8. File Complaint Modal */}
                {activeModal === 'complaint' && (
                    <div className="sp-modal-center-backdrop" onClick={() => setActiveModal(null)}>
                        <div className="mail-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px' }}>
                            <div className="mail-modal-header">
                                <div className="mail-modal-title">
                                    <FontAwesomeIcon icon={faTriangleExclamation} style={{ color: '#EA580C' }} />
                                    <span>Escalate Service Complaint</span>
                                </div>
                                <button type="button" className="mail-modal-close" onClick={() => { setActiveModal(null); setComplaintScreenshot(null); }}>
                                    <FontAwesomeIcon icon={faXmark} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateComplaintSubmit} onPaste={e => handlePaste(e, setComplaintScreenshot)}>
                                <div className="row g-3 mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold text-dark" style={{ fontSize: 13 }}>Department *</label>
                                        <select
                                            className="form-select"
                                            style={{ borderRadius: 12, height: 44, fontSize: 13.5 }}
                                            value={newComplaint.department}
                                            onChange={e => setNewComplaint({ ...newComplaint, department: e.target.value })}
                                        >
                                            <option value="Technical POS">Technical POS Support</option>
                                            <option value="Billing">Billing & Subscription</option>
                                            <option value="Sales">Sales & Licensing</option>
                                            <option value="Management">Management Escalation</option>
                                        </select>
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label fw-bold text-dark" style={{ fontSize: 13 }}>Severity Rating *</label>
                                        <select
                                            className="form-select"
                                            style={{ borderRadius: 12, height: 44, fontSize: 13.5 }}
                                            value={newComplaint.severity}
                                            onChange={e => setNewComplaint({ ...newComplaint, severity: e.target.value })}
                                        >
                                            <option value="Critical">Critical Business Disruption</option>
                                            <option value="Major">Major Service Failure</option>
                                            <option value="Moderate">Moderate Issue</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-bold text-dark" style={{ fontSize: 13 }}>Complaint Details *</label>
                                    <textarea
                                        rows={4}
                                        className="form-control"
                                        style={{ borderRadius: 12, fontSize: 13.5 }}
                                        placeholder="State your complaint clearly for priority management review..."
                                        value={newComplaint.details}
                                        onChange={e => setNewComplaint({ ...newComplaint, details: e.target.value })}
                                        required
                                    />
                                </div>

                                {/* Attach Screenshot (Optional) */}
                                <div className="mb-4">
                                    <label className="form-label fw-bold text-dark d-flex align-items-center justify-content-between" style={{ fontSize: 13 }}>
                                        <span>Attach Evidence Screenshot (Optional)</span>
                                        <span className="text-muted fw-normal" style={{ fontSize: 11 }}>Supports PNG, JPG, WebP or Paste (Ctrl+V)</span>
                                    </label>

                                    {!complaintScreenshot ? (
                                        <label className="sp-upload-box">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="d-none"
                                                onChange={e => handleFileSelect(e, setComplaintScreenshot)}
                                            />
                                            <div className="sp-upload-icon" style={{ background: '#FFEDD5', color: '#EA580C' }}>
                                                <FontAwesomeIcon icon={faPaperclip} />
                                            </div>
                                            <div className="sp-upload-text">
                                                <strong>Click to browse</strong> or drag & drop screenshot here
                                            </div>
                                            <div className="sp-upload-hint">PNG, JPG, JPEG, WebP or paste directly from clipboard</div>
                                        </label>
                                    ) : (
                                        <div className="sp-preview-card">
                                            <img
                                                src={complaintScreenshot.url}
                                                alt="Complaint Preview"
                                                className="sp-preview-img"
                                                onClick={() => setPreviewImageModal(complaintScreenshot.url)}
                                                title="Click to zoom screenshot"
                                            />
                                            <div className="sp-preview-info">
                                                <div className="sp-preview-name">{complaintScreenshot.name}</div>
                                                <div className="sp-preview-size">{complaintScreenshot.size}</div>
                                            </div>
                                            <button
                                                type="button"
                                                className="sp-preview-remove"
                                                onClick={() => setComplaintScreenshot(null)}
                                                title="Remove Screenshot"
                                            >
                                                <FontAwesomeIcon icon={faXmark} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="d-flex justify-content-end gap-2">
                                    <button type="button" className="brand-btn-pill" onClick={() => { setActiveModal(null); setComplaintScreenshot(null); }}>Cancel</button>
                                    <button type="submit" className="brand-btn-pill brand-btn-orange">
                                        <FontAwesomeIcon icon={faTriangleExclamation} />
                                        <span>File Complaint</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* 9. Live Support Chat Assistant */}
                {activeModal === 'chat' && (
                    <div className="sp-modal-center-backdrop" onClick={() => setActiveModal(null)}>
                        <div className="sp-chat-modal" onClick={e => e.stopPropagation()}>
                            <div className="sp-chat-header">
                                <div className="sp-chat-avatar">
                                    <FontAwesomeIcon icon={faHeadset} />
                                </div>
                                <div>
                                    <strong>Suguna POS AI Assistant</strong>
                                    <span className="sp-chat-status">● Live Online 24/7</span>
                                </div>
                                <button type="button" className="sp-modal-close" style={{ color: 'white', background: 'transparent' }} onClick={() => setActiveModal(null)}>
                                    <FontAwesomeIcon icon={faXmark} />
                                </button>
                            </div>

                            <div className="sp-chat-body">
                                {chatMessages.map((m, i) => (
                                    <div key={i} className={`sp-msg sp-msg-${m.from}`}>
                                        {m.from === 'bot' && <div className="sp-msg-avatar">🤖</div>}
                                        <div className="sp-msg-bubble">{m.text}</div>
                                    </div>
                                ))}
                                {chatTyping && (
                                    <div className="sp-msg sp-msg-bot">
                                        <div className="sp-msg-avatar">🤖</div>
                                        <div className="sp-msg-bubble sp-typing">
                                            <span></span><span></span><span></span>
                                        </div>
                                    </div>
                                )}
                                <div ref={chatBottomRef} />
                            </div>

                            <div className="sp-quick-replies">
                                {['Thermal printer issue', 'GST invoice calculation', 'How to reset staff password?', 'Export sales report'].map(chip => (
                                    <button
                                        key={chip}
                                        type="button"
                                        className="sp-quick-chip"
                                        onClick={() => {
                                            setChatMessages(prev => [...prev, { from: 'user', text: chip }]);
                                            setChatTyping(true);
                                            setTimeout(() => {
                                                setChatTyping(false);
                                                setChatMessages(prev => [...prev, { from: 'bot', text: getBotReply(chip) }]);
                                            }, 700);
                                        }}
                                    >
                                        {chip}
                                    </button>
                                ))}
                            </div>

                            <div className="sp-chat-input-row">
                                <input
                                    value={chatInput}
                                    onChange={e => setChatInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSendChatMessage()}
                                    placeholder="Ask anything about Suguna POS..."
                                />
                                <button type="button" className="sp-chat-send" onClick={handleSendChatMessage}>
                                    <FontAwesomeIcon icon={faPaperPlane} style={{ color: 'white' }} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 10. Fullscreen Screenshot Lightbox Modal */}
                {previewImageModal && (
                    <div className="sp-lightbox-backdrop" onClick={() => setPreviewImageModal(null)}>
                        <div className="sp-lightbox-content" onClick={e => e.stopPropagation()}>
                            <button type="button" className="sp-lightbox-close" onClick={() => setPreviewImageModal(null)} title="Close preview">
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                            <img src={previewImageModal} alt="Screenshot Full View" className="sp-lightbox-img" />
                        </div>
                    </div>
                )}
            </div>
        </MasterLayout>
    );
}
