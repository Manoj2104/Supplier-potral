import React from 'react';
import { Dropdown } from 'react-bootstrap-v5';
import { useNavigate } from 'react-router-dom';

/**
 * RegisterDropdown
 *
 * Props:
 *  isRegisterOpen       – true  → register is currently OPEN  (show "Close Register")
 *                         false → register is currently CLOSED (show "Open Register")
 *  handleOpenRegister   – called when cashier clicks "Open Register"
 *  handleCloseRegister  – called when cashier clicks "Close Register"
 *  goToHoldScreen       – called for Suspend / Reopen Register
 *  setShowROAlertModel  – called for Today's Summary
 */
const RegisterDropdown = ({
    isRegisterOpen,
    handleOpenRegister,
    handleCloseRegister,
    goToHoldScreen,
    setShowROAlertModel,
}) => {
    const navigate = useNavigate();

    return (
        <Dropdown className="pos-register-dropdown position-relative">
            <Dropdown.Toggle
                variant="success"
                id="dropdown-register-menu"
                className="btn d-flex align-items-center gap-2 px-3.5 py-0 fw-bold text-white border-0 shadow-sm"
                style={{
                    background: "linear-gradient(135deg, #16A34A 0%, #15803D 100%)",
                    borderRadius: "12px",
                    fontSize: "13px",
                    height: "48px",
                    boxShadow: "0 4px 14px rgba(22, 163, 74, 0.22)",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    cursor: "pointer",
                }}
            >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="14" x="2" y="5" rx="2"/>
                    <line x1="2" x2="22" y1="10" y2="10"/>
                    <circle cx="6" cy="15" r="1" fill="currentColor"/>
                    <circle cx="10" cy="15" r="1" fill="currentColor"/>
                </svg>
                <span style={{ fontWeight: 700, letterSpacing: "0.2px" }}>Register</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "2px" }}>
                    <path d="m6 9 6 6 6-6"/>
                </svg>
            </Dropdown.Toggle>

            <Dropdown.Menu
                className="border-0 p-2 mt-2"
                style={{
                    minWidth: "260px",
                    background: "#FFFFFF",
                    boxShadow: "0 20px 30px -10px rgba(15, 23, 42, 0.18), 0 10px 15px -5px rgba(15, 23, 42, 0.08)",
                    border: "1px solid #E2E8F0",
                    borderRadius: "16px",
                    padding: "8px",
                    zIndex: 3500,
                }}
            >
                {/* ── Register Status Badge ── */}
                <div
                    className="d-flex align-items-center gap-2 px-3 py-2 mb-1 rounded-3"
                    style={{
                        background: isRegisterOpen ? "#DCFCE7" : "#FEF3C7",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: isRegisterOpen ? "#15803D" : "#B45309",
                    }}
                >
                    <span
                        style={{
                            width: 8, height: 8, borderRadius: "50%",
                            background: isRegisterOpen ? "#16A34A" : "#F59E0B",
                            display: "inline-block",
                            flexShrink: 0,
                        }}
                    />
                    {isRegisterOpen ? "Register is Open" : "Register is Closed"}
                </div>

                {/* ── 1. Open Register  — shown only when register is CLOSED ── */}
                {!isRegisterOpen && (
                    <button
                        type="button"
                        className="dropdown-item d-flex align-items-center gap-3 py-2 px-3 rounded-3 fw-bold border-0 bg-transparent"
                        style={{ fontSize: "13px", transition: "background 0.15s ease", color: "#16A34A" }}
                        onClick={() => handleOpenRegister && handleOpenRegister()}
                    >
                        <div className="d-flex align-items-center justify-content-center rounded-2" style={{ width: "30px", height: "30px", background: "#DCFCE7", color: "#16A34A" }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                        </div>
                        <span>Open Register</span>
                    </button>
                )}

                {/* ── 2. Close Register — shown only when register is OPEN ── */}
                {isRegisterOpen && (
                    <button
                        type="button"
                        className="dropdown-item d-flex align-items-center gap-3 py-2 px-3 rounded-3 fw-bold border-0 bg-transparent"
                        style={{ fontSize: "13px", transition: "background 0.15s ease", color: "#1E293B" }}
                        onClick={() => handleCloseRegister && handleCloseRegister()}
                    >
                        <div className="d-flex align-items-center justify-content-center rounded-2" style={{ width: "30px", height: "30px", background: "#FEE2E2", color: "#DC2626" }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="18" height="11" x="3" y="11" rx="2"/>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                        </div>
                        <span>Close Register</span>
                    </button>
                )}

                {/* 3. Cash Drop */}
                <button
                    type="button"
                    className="dropdown-item d-flex align-items-center gap-3 py-2 px-3 rounded-3 text-dark fw-bold border-0 bg-transparent cursor-pointer"
                    style={{ fontSize: "13px", transition: "background 0.15s ease", color: "#1E293B" }}
                    onClick={() => navigate('/app/register/cash-drop')}
                >
                    <div className="d-flex align-items-center justify-content-center rounded-2" style={{ width: "30px", height: "30px", background: "#DBEAFE", color: "#2563EB" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 5v14"/>
                            <path d="m19 12-7 7-7-7"/>
                        </svg>
                    </div>
                    <span>Cash Drop</span>
                </button>

                {/* 4. Cash Pickup */}
                <button
                    type="button"
                    className="dropdown-item d-flex align-items-center gap-3 py-2 px-3 rounded-3 text-dark fw-bold border-0 bg-transparent cursor-pointer"
                    style={{ fontSize: "13px", transition: "background 0.15s ease", color: "#1E293B" }}
                    onClick={() => navigate('/app/register/cash-pickup')}
                >
                    <div className="d-flex align-items-center justify-content-center rounded-2" style={{ width: "30px", height: "30px", background: "#FEF3C7", color: "#D97706" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 19V5"/>
                            <path d="m5 12 7-7 7 7"/>
                        </svg>
                    </div>
                    <span>Cash Pickup</span>
                </button>

                {/* 5. Suspend Register */}
                <button
                    type="button"
                    className="dropdown-item d-flex align-items-center gap-3 py-2 px-3 rounded-3 text-dark fw-bold border-0 bg-transparent cursor-pointer"
                    style={{ fontSize: "13px", transition: "background 0.15s ease", color: "#1E293B" }}
                    onClick={() => navigate('/app/register/suspend')}
                >
                    <div className="d-flex align-items-center justify-content-center rounded-2" style={{ width: "30px", height: "30px", background: "#FEE2E2", color: "#DC2626" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="4" height="16" x="6" y="4" rx="1"/>
                            <rect width="4" height="16" x="14" y="4" rx="1"/>
                        </svg>
                    </div>
                    <span>Suspend Register</span>
                </button>

                {/* 6. Reopen Register */}
                <button
                    type="button"
                    className="dropdown-item d-flex align-items-center gap-3 py-2 px-3 rounded-3 text-dark fw-bold border-0 bg-transparent cursor-pointer"
                    style={{ fontSize: "13px", transition: "background 0.15s ease", color: "#1E293B" }}
                    onClick={() => navigate('/app/register/reopen')}
                >
                    <div className="d-flex align-items-center justify-content-center rounded-2" style={{ width: "30px", height: "30px", background: "#F3E8FF", color: "#9333EA" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
                            <path d="M21 3v5h-5"/>
                            <path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
                            <path d="M3 21v-5h5"/>
                        </svg>
                    </div>
                    <span>Reopen Register</span>
                </button>

                <div className="my-2 border-top" style={{ borderColor: "#F1F5F9" }} />

                {/* 7. Register History */}
                <button
                    type="button"
                    className="dropdown-item d-flex align-items-center gap-3 py-2 px-3 rounded-3 text-dark fw-bold border-0 bg-transparent cursor-pointer"
                    style={{ fontSize: "13px", transition: "background 0.15s ease", color: "#1E293B" }}
                    onClick={() => navigate('/app/register/history')}
                >
                    <div className="d-flex align-items-center justify-content-center rounded-2" style={{ width: "30px", height: "30px", background: "#E0E7FF", color: "#4F46E5" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                        </svg>
                    </div>
                    <span>Register History</span>
                </button>

                {/* 8. Shift Reports */}
                <button
                    type="button"
                    className="dropdown-item d-flex align-items-center gap-3 py-2 px-3 rounded-3 text-dark fw-bold border-0 bg-transparent cursor-pointer"
                    style={{ fontSize: "13px", transition: "background 0.15s ease", color: "#1E293B" }}
                    onClick={() => navigate('/app/register/shift-reports')}
                >
                    <div className="d-flex align-items-center justify-content-center rounded-2" style={{ width: "30px", height: "30px", background: "#CFFAFE", color: "#0891B2" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <polyline points="16 11 18 13 22 9"/>
                        </svg>
                    </div>
                    <span>Shift Reports</span>
                </button>

                {/* 9. Today's Summary */}
                <button
                    type="button"
                    className="dropdown-item d-flex align-items-center gap-3 py-2 px-3 rounded-3 text-dark fw-bold border-0 bg-transparent cursor-pointer"
                    style={{ fontSize: "13px", transition: "background 0.15s ease", color: "#1E293B" }}
                    onClick={() => setShowROAlertModel(true)}
                >
                    <div className="d-flex align-items-center justify-content-center rounded-2" style={{ width: "30px", height: "30px", background: "#D1FAE5", color: "#059669" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="20" x2="18" y2="10"/>
                            <line x1="12" y1="20" x2="12" y2="4"/>
                            <line x1="6" y1="20" x2="6" y2="14"/>
                        </svg>
                    </div>
                    <span>Today's Summary</span>
                </button>

                <div className="my-2 border-top" style={{ borderColor: "#F1F5F9" }} />

                {/* Status Box */}
                <div className="p-2 border rounded-3 my-1" style={{ background: "#F8FAFC", borderColor: "#F1F5F9" }}>
                    <div className="d-flex align-items-center justify-content-between py-1 px-2" style={{ fontSize: "11px", color: "#64748B", fontWeight: 600 }}>
                        <span className="d-flex align-items-center gap-1.5">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="6 9 6 2 18 2 18 9"/>
                                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                                <rect width="12" height="8" x="6" y="14"/>
                            </svg>
                            Printer Status
                        </span>
                        <span className="badge border-0" style={{ background: "#DCFCE7", color: "#15803D", fontWeight: 700, borderRadius: "20px", padding: "4px 8px", fontSize: "10px" }}>Online 🟢</span>
                    </div>

                    <div className="d-flex align-items-center justify-content-between py-1 px-2 mt-1" style={{ fontSize: "11px", color: "#64748B", fontWeight: 600 }}>
                        <span className="d-flex align-items-center gap-1.5">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect width="20" height="14" x="2" y="5" rx="2"/>
                                <line x1="2" x2="22" y1="10" y2="10"/>
                            </svg>
                            Cash Drawer
                        </span>
                        <span className="badge border-0" style={{ background: "#DCFCE7", color: "#15803D", fontWeight: 700, borderRadius: "20px", padding: "4px 8px", fontSize: "10px" }}>Ready 🟢</span>
                    </div>
                </div>

                {/* 12. POS Settings */}
                <button
                    type="button"
                    className="dropdown-item d-flex align-items-center gap-3 py-2 px-3 rounded-3 text-dark fw-bold border-0 bg-transparent mt-1"
                    style={{ fontSize: "13px", transition: "background 0.15s ease", color: "#1E293B" }}
                    onClick={() => navigate('/app/pos/settings')}
                >
                    <div className="d-flex align-items-center justify-content-center rounded-2" style={{ width: "30px", height: "30px", background: "#F1F5F9", color: "#475569" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/>
                        </svg>
                    </div>
                    <span>POS Settings</span>
                </button>
            </Dropdown.Menu>
        </Dropdown>
    );
};

export default RegisterDropdown;
