import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Image } from "react-bootstrap-v5";
import * as EmailValidator from "email-validator";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faEnvelope,
    faLock,
    faEye,
    faEyeSlash,
    faShieldAlt,
    faArrowRight,
    faCircleCheck,
    faBolt
} from "@fortawesome/free-solid-svg-icons";
import { loginAction } from "../../store/action/authAction";
import TabTitle from "../../shared/tab-title/TabTitle";
import { fetchFrontSetting } from "../../store/action/frontSettingAction";
import { Tokens } from "../../constants";
import { toast } from "react-toastify";
import {
    getFormattedMessage,
    placeholderText,
} from "../../shared/sharedMethod";

const Login = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { frontSetting } = useSelector((state) => state);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const token = localStorage.getItem(Tokens.ADMIN);

    const [loginInputs, setLoginInputs] = useState({
        email: "",
        password: "",
    });

    useEffect(() => {
        try { toast.dismiss(); } catch (e) {}
        dispatch(fetchFrontSetting());
        if (token) {
            navigate('/app/dashboard');
        }
    }, [token]);

    const [errors, setErrors] = useState({
        email: "",
        password: "",
    });

    const handleValidation = () => {
        let errorss = {};
        let isValid = false;
        if (!EmailValidator.validate(loginInputs["email"])) {
            if (!loginInputs["email"]) {
                errorss["email"] = getFormattedMessage(
                    "globally.input.email.validate.label"
                );
            } else {
                errorss["email"] = getFormattedMessage(
                    "globally.input.email.valid.validate.label"
                );
            }
        } else if (!loginInputs["password"]) {
            errorss["password"] = getFormattedMessage(
                "user.input.password.validate.label"
            );
        } else {
            isValid = true;
        }
        setErrors(errorss);
        setLoading(false);
        return isValid;
    };

    const prepareFormData = () => {
        const formData = new FormData();
        formData.append("email", loginInputs.email);
        formData.append("password", loginInputs.password);
        formData.append(
            "language_code",
            localStorage.getItem("updated_language") || "en"
        );
        return formData;
    };

    const onLogin = async (e) => {
        e.preventDefault();
        const valid = handleValidation();
        if (valid) {
            setLoading(true);
            dispatch(
                loginAction(prepareFormData(), navigate, setLoading)
            );
        }
    };

    const handleChange = (e) => {
        e.persist();
        setLoginInputs((inputs) => ({
            ...inputs,
            [e.target.name]: e.target.value,
        }));
        setErrors((err) => ({
            ...err,
            [e.target.name]: "",
        }));
    };

    const companyLogo = (frontSetting && frontSetting.value && frontSetting.value.logo) || "/images/logo.png";
    const companyName = (frontSetting && frontSetting.value && frontSetting.value.company_name) || "Suguna Enterprise";

    return (
        <div style={{
            minHeight: "100vh",
            width: "100vw",
            display: "flex",
            flexDirection: "row",
            background: "#FFFFFF",
            fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            overflow: "hidden",
            position: "relative"
        }}>
            <TabTitle title={`${companyName} — Enterprise Sign In`} />

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* LEFT HERO PANEL (Full-Screen Feature Showcase) */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="d-none d-lg-flex" style={{
                flex: "1 1 52%",
                minWidth: "520px",
                background: "linear-gradient(145deg, #022C22 0%, #064E3B 40%, #0F172A 100%)",
                position: "relative",
                padding: "60px 64px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                overflow: "hidden",
                color: "#FFFFFF"
            }}>
                {/* Ambient Glow Orbs */}
                <div style={{
                    position: "absolute",
                    top: "-15%",
                    left: "-10%",
                    width: "500px",
                    height: "500px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, rgba(16, 185, 129, 0) 70%)",
                    filter: "blur(40px)",
                    pointerEvents: "none"
                }} />
                <div style={{
                    position: "absolute",
                    bottom: "-15%",
                    right: "-10%",
                    width: "450px",
                    height: "450px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(56, 189, 248, 0) 70%)",
                    filter: "blur(50px)",
                    pointerEvents: "none"
                }} />

                {/* Subtle Grid Pattern Overlay */}
                <div style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)",
                    backgroundSize: "28px 28px",
                    opacity: 0.7,
                    pointerEvents: "none"
                }} />

                {/* Top Brand Header */}
                <div style={{ position: "relative", zIndex: 5 }}>
                    <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "14px",
                        padding: "10px 20px",
                        borderRadius: "16px",
                        background: "rgba(255, 255, 255, 0.08)",
                        backdropFilter: "blur(16px)",
                        border: "1px solid rgba(255, 255, 255, 0.14)",
                        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)"
                    }}>
                        <Image
                            src={companyLogo}
                            alt={companyName}
                            style={{
                                maxHeight: "38px",
                                maxWidth: "140px",
                                objectFit: "contain",
                                filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))"
                            }}
                        />
                        <div style={{ width: "1px", height: "24px", background: "rgba(255, 255, 255, 0.2)" }} />
                        <span style={{
                            fontSize: "13px",
                            fontWeight: "800",
                            letterSpacing: "0.08em",
                            color: "#A7F3D0",
                            textTransform: "uppercase"
                        }}>
                            Enterprise WMS &amp; POS Hub
                        </span>
                    </div>
                </div>

                {/* Middle Value Proposition & Feature Cards */}
                <div style={{ position: "relative", zIndex: 5, margin: "40px 0" }}>
                    <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "6px 14px",
                        borderRadius: "999px",
                        background: "rgba(16, 185, 129, 0.2)",
                        border: "1px solid rgba(52, 211, 153, 0.4)",
                        color: "#6EE7B7",
                        fontSize: "12px",
                        fontWeight: "700",
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        marginBottom: "18px"
                    }}>
                        <FontAwesomeIcon icon={faBolt} style={{ color: "#34D399" }} />
                        <span>High-Speed 0ms Unified Synchrony</span>
                    </div>

                    <h1 style={{
                        fontSize: "36px",
                        fontWeight: "900",
                        lineHeight: 1.25,
                        letterSpacing: "-0.03em",
                        color: "#FFFFFF",
                        marginBottom: "16px",
                        maxWidth: "520px"
                    }}>
                        Real-Time POS &amp; Warehouse Inventory Command Center.
                    </h1>
                    <p style={{
                        fontSize: "15.5px",
                        lineHeight: 1.6,
                        color: "#CBD5E1",
                        maxWidth: "480px",
                        marginBottom: "32px"
                    }}>
                        Seamlessly synchronize retail sales, warehouse putaway, supplier advance shipping notices, and live bin allocations across all devices.
                    </p>

                    {/* 3 Interactive Feature Pills */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px", maxWidth: "480px" }}>
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "14px",
                            padding: "14px 18px",
                            borderRadius: "14px",
                            background: "rgba(255, 255, 255, 0.05)",
                            backdropFilter: "blur(12px)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            transition: "all 200ms ease"
                        }}>
                            <div style={{
                                width: "38px",
                                height: "38px",
                                borderRadius: "10px",
                                background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "16px",
                                color: "#FFFFFF",
                                flexShrink: 0
                            }}>
                                <FontAwesomeIcon icon={faBolt} />
                            </div>
                            <div>
                                <div style={{ fontSize: "14px", fontWeight: "700", color: "#FFFFFF" }}>Instant Multi-Tab Data Sync</div>
                                <div style={{ fontSize: "12.5px", color: "#94A3B8" }}>Database single-source of truth with zero browser refresh delays.</div>
                            </div>
                        </div>

                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "14px",
                            padding: "14px 18px",
                            borderRadius: "14px",
                            background: "rgba(255, 255, 255, 0.05)",
                            backdropFilter: "blur(12px)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            transition: "all 200ms ease"
                        }}>
                            <div style={{
                                width: "38px",
                                height: "38px",
                                borderRadius: "10px",
                                background: "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "16px",
                                color: "#FFFFFF",
                                flexShrink: 0
                            }}>
                                <FontAwesomeIcon icon={faCircleCheck} />
                            </div>
                            <div>
                                <div style={{ fontSize: "14px", fontWeight: "700", color: "#FFFFFF" }}>End-to-End ASN &amp; Bin Putaway</div>
                                <div style={{ fontSize: "12.5px", color: "#94A3B8" }}>Full barcode scanning, pallet LPN tracking, and warehouse routing.</div>
                            </div>
                        </div>

                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "14px",
                            padding: "14px 18px",
                            borderRadius: "14px",
                            background: "rgba(255, 255, 255, 0.05)",
                            backdropFilter: "blur(12px)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            transition: "all 200ms ease"
                        }}>
                            <div style={{
                                width: "38px",
                                height: "38px",
                                borderRadius: "10px",
                                background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "16px",
                                color: "#FFFFFF",
                                flexShrink: 0
                            }}>
                                <FontAwesomeIcon icon={faShieldAlt} />
                            </div>
                            <div>
                                <div style={{ fontSize: "14px", fontWeight: "700", color: "#FFFFFF" }}>Enterprise Security Shield</div>
                                <div style={{ fontSize: "12.5px", color: "#94A3B8" }}>Multi-worker Apache architecture with 256-bit encryption.</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Trust Badge */}
                <div style={{
                    position: "relative",
                    zIndex: 5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: "24px",
                    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                    fontSize: "13px",
                    color: "#94A3B8"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10B981" }} />
                        <span>High-Availability Cloud Network (99.99% Uptime)</span>
                    </div>
                    <span style={{ color: "#64748B" }}>v3.2 Enterprise</span>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* RIGHT FORM PANEL (Clean, Crisp, Focused Sign-In) */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div style={{
                flex: "1 1 48%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "48px 36px",
                background: "#FFFFFF",
                position: "relative",
                overflowY: "auto"
            }}>
                <div style={{
                    width: "100%",
                    maxWidth: "440px",
                    display: "flex",
                    flexDirection: "column"
                }}>
                    {/* Header */}
                    <div style={{ marginBottom: "32px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                            <div style={{
                                padding: "8px 14px",
                                borderRadius: "12px",
                                background: "#F8FAFC",
                                border: "1px solid #E2E8F0",
                                display: "inline-flex",
                                alignItems: "center"
                            }}>
                                <Image
                                    src={companyLogo}
                                    alt={companyName}
                                    style={{
                                        maxHeight: "36px",
                                        maxWidth: "120px",
                                        objectFit: "contain"
                                    }}
                                />
                            </div>
                            <div style={{
                                fontSize: "12px",
                                fontWeight: "700",
                                color: "#059669",
                                background: "#ECFDF5",
                                border: "1px solid #A7F3D0",
                                padding: "4px 10px",
                                borderRadius: "999px",
                                textTransform: "uppercase",
                                letterSpacing: "0.04em"
                            }}>
                                Portal Access
                            </div>
                        </div>

                        <h2 style={{
                            fontSize: "28px",
                            fontWeight: "900",
                            color: "#0F172A",
                            letterSpacing: "-0.03em",
                            margin: "0 0 8px 0"
                        }}>
                            Sign In to your Account
                        </h2>
                        <p style={{
                            fontSize: "14px",
                            color: "#64748B",
                            margin: 0,
                            lineHeight: 1.5
                        }}>
                            Enter your verified credentials to access your administrative dashboard, warehouse, and POS terminals.
                        </p>
                    </div>

                    {/* Sign-In Form */}
                    <form onSubmit={onLogin}>
                        {/* Email Input */}
                        <div style={{ marginBottom: "20px" }}>
                            <label style={{
                                display: "block",
                                fontSize: "13px",
                                fontWeight: "700",
                                color: "#334155",
                                marginBottom: "8px"
                            }}>
                                {getFormattedMessage("globally.input.email.label") || "Email Address"}{" "}
                                <span style={{ color: "#EF4444" }}>*</span>
                            </label>
                            <div style={{ position: "relative" }}>
                                <span style={{
                                    position: "absolute",
                                    left: "16px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "#94A3B8",
                                    fontSize: "14px",
                                    pointerEvents: "none"
                                }}>
                                    <FontAwesomeIcon icon={faEnvelope} />
                                </span>
                                <input
                                    type="text"
                                    name="email"
                                    value={loginInputs.email}
                                    onChange={handleChange}
                                    placeholder={placeholderText("globally.input.email.placeholder.label") || "admin@suguna.com"}
                                    autoComplete="username"
                                    required
                                    style={{
                                        width: "100%",
                                        height: "48px",
                                        paddingLeft: "44px",
                                        paddingRight: "16px",
                                        borderRadius: "12px",
                                        border: errors["email"] ? "1.5px solid #EF4444" : "1.5px solid #CBD5E1",
                                        background: "#F8FAFC",
                                        color: "#0F172A",
                                        fontSize: "14.5px",
                                        fontWeight: "500",
                                        outline: "none",
                                        transition: "all 150ms ease"
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.background = "#FFFFFF";
                                        e.target.style.borderColor = "#10B981";
                                        e.target.style.boxShadow = "0 0 0 4px rgba(16, 185, 129, 0.14)";
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.background = "#F8FAFC";
                                        e.target.style.borderColor = errors["email"] ? "#EF4444" : "#CBD5E1";
                                        e.target.style.boxShadow = "none";
                                    }}
                                />
                            </div>
                            {errors["email"] && (
                                <span style={{
                                    display: "block",
                                    fontSize: "12px",
                                    color: "#EF4444",
                                    fontWeight: "600",
                                    marginTop: "6px"
                                }}>
                                    {errors["email"]}
                                </span>
                            )}
                        </div>

                        {/* Password Input */}
                        <div style={{ marginBottom: "22px" }}>
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: "8px"
                            }}>
                                <label style={{
                                    fontSize: "13px",
                                    fontWeight: "700",
                                    color: "#334155",
                                    margin: 0
                                }}>
                                    {getFormattedMessage("user.input.password.label") || "Password"}{" "}
                                    <span style={{ color: "#EF4444" }}>*</span>
                                </label>
                                <Link
                                    to="/forgot-password"
                                    style={{
                                        fontSize: "13px",
                                        fontWeight: "700",
                                        color: "#059669",
                                        textDecoration: "none"
                                    }}
                                    onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                                    onMouseLeave={(e) => e.target.style.textDecoration = "none"}
                                >
                                    {getFormattedMessage("login-form.forgot-password.label") || "Forgot Password?"}
                                </Link>
                            </div>
                            <div style={{ position: "relative" }}>
                                <span style={{
                                    position: "absolute",
                                    left: "16px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "#94A3B8",
                                    fontSize: "14px",
                                    pointerEvents: "none"
                                }}>
                                    <FontAwesomeIcon icon={faLock} />
                                </span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={loginInputs.password}
                                    onChange={handleChange}
                                    placeholder={placeholderText("user.input.password.placeholder.label") || "••••••••"}
                                    autoComplete="current-password"
                                    required
                                    style={{
                                        width: "100%",
                                        height: "48px",
                                        paddingLeft: "44px",
                                        paddingRight: "46px",
                                        borderRadius: "12px",
                                        border: errors["password"] ? "1.5px solid #EF4444" : "1.5px solid #CBD5E1",
                                        background: "#F8FAFC",
                                        color: "#0F172A",
                                        fontSize: "14.5px",
                                        fontWeight: "500",
                                        outline: "none",
                                        transition: "all 150ms ease"
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.background = "#FFFFFF";
                                        e.target.style.borderColor = "#10B981";
                                        e.target.style.boxShadow = "0 0 0 4px rgba(16, 185, 129, 0.14)";
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.background = "#F8FAFC";
                                        e.target.style.borderColor = errors["password"] ? "#EF4444" : "#CBD5E1";
                                        e.target.style.boxShadow = "none";
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: "absolute",
                                        right: "12px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        background: "transparent",
                                        border: "none",
                                        color: "#94A3B8",
                                        cursor: "pointer",
                                        padding: "6px 10px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "14px",
                                        outline: "none"
                                    }}
                                    title={showPassword ? "Hide Password" : "Show Password"}
                                >
                                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                                </button>
                            </div>
                            {errors["password"] && (
                                <span style={{
                                    display: "block",
                                    fontSize: "12px",
                                    color: "#EF4444",
                                    fontWeight: "600",
                                    marginTop: "6px"
                                }}>
                                    {errors["password"]}
                                </span>
                            )}
                        </div>

                        {/* Remember me row */}
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "28px"
                        }}>
                            <label style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                fontSize: "13.5px",
                                fontWeight: "500",
                                color: "#475569",
                                cursor: "pointer",
                                margin: 0,
                                userSelect: "none"
                            }}>
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    style={{
                                        width: "17px",
                                        height: "17px",
                                        accentColor: "#10B981",
                                        borderRadius: "5px",
                                        cursor: "pointer"
                                    }}
                                />
                                <span>Remember this workstation</span>
                            </label>
                            <span style={{
                                fontSize: "12px",
                                fontWeight: "700",
                                color: "#059669",
                                background: "#ECFDF5",
                                border: "1px solid #A7F3D0",
                                padding: "4px 10px",
                                borderRadius: "8px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px"
                            }}>
                                <FontAwesomeIcon icon={faBolt} style={{ fontSize: "10px" }} />
                                <span>Instant Session</span>
                            </span>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: "100%",
                                height: "50px",
                                borderRadius: "12px",
                                background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                                border: "none",
                                color: "#FFFFFF",
                                fontSize: "15.5px",
                                fontWeight: "800",
                                letterSpacing: "0.02em",
                                boxShadow: "0 8px 24px -4px rgba(16, 185, 129, 0.45)",
                                cursor: loading ? "not-allowed" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "10px",
                                transition: "all 180ms cubic-bezier(0.4, 0, 0.2, 1)",
                                outline: "none"
                            }}
                            onMouseEnter={(e) => {
                                if (!loading) {
                                    e.currentTarget.style.transform = "translateY(-1.5px)";
                                    e.currentTarget.style.boxShadow = "0 12px 28px -4px rgba(16, 185, 129, 0.55)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!loading) {
                                    e.currentTarget.style.transform = "translateY(0)";
                                    e.currentTarget.style.boxShadow = "0 8px 24px -4px rgba(16, 185, 129, 0.45)";
                                }
                            }}
                        >
                            {loading ? (
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <span style={{
                                        display: "inline-block",
                                        width: "20px",
                                        height: "20px",
                                        border: "2.5px solid rgba(255, 255, 255, 0.4)",
                                        borderTopColor: "#FFFFFF",
                                        borderRadius: "50%",
                                        animation: "loginSpin 0.7s linear infinite"
                                    }} />
                                    <span>Verifying Credentials...</span>
                                </div>
                            ) : (
                                <>
                                    <span>Sign In to Workspace</span>
                                    <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: "14px" }} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Security Notice */}
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        marginTop: "32px",
                        paddingTop: "24px",
                        borderTop: "1px solid #F1F5F9",
                        fontSize: "12.5px",
                        color: "#94A3B8",
                        fontWeight: "500"
                    }}>
                        <FontAwesomeIcon icon={faShieldAlt} style={{ color: "#10B981" }} />
                        <span>Protected by 256-Bit Enterprise Transport Layer Security</span>
                    </div>

                    {/* Footer */}
                    <div style={{
                        marginTop: "16px",
                        textAlign: "center",
                        fontSize: "12px",
                        color: "#94A3B8"
                    }}>
                        &copy; {new Date().getFullYear()} {companyName}. All rights reserved.
                    </div>
                </div>
            </div>

            {/* Spinner Keyframe Animation */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes loginSpin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            ` }} />
        </div>
    );
};

export default Login;
