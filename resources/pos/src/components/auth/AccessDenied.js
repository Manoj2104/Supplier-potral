import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldHalved, faArrowLeft, faHome, faLock } from '@fortawesome/free-solid-svg-icons';

const AccessDenied = () => {
    const navigate = useNavigate();

    return (
        <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light p-4 text-center">
            <div style={{ maxWidth: '520px', width: '100%' }}>
                <div 
                    className="mx-auto mb-4 d-flex align-items-center justify-content-center rounded-circle"
                    style={{ 
                        width: '96px', 
                        height: '96px', 
                        background: '#FEF2F2', 
                        color: '#EF4444',
                        boxShadow: '0 8px 24px rgba(239, 68, 68, 0.15)'
                    }}
                >
                    <FontAwesomeIcon icon={faShieldHalved} size="3x" />
                </div>

                <div className="badge bg-danger-subtle text-danger px-3 py-1.5 rounded-pill mb-3 fw-bold fs-7">
                    HTTP 403 FORBIDDEN
                </div>

                <h1 className="fw-black text-dark mb-2 fs-2" style={{ letterSpacing: '-0.02em' }}>
                    Access Denied
                </h1>

                <p className="text-secondary fs-6 mb-4 leading-relaxed">
                    You do not have sufficient enterprise permissions to access this page or module. Your attempt has been logged for audit compliance.
                </p>

                <div className="bg-white border rounded-3 p-3 mb-4 text-start shadow-sm">
                    <div className="d-flex align-items-center gap-2 text-muted fs-7 mb-1">
                        <FontAwesomeIcon icon={faLock} className="text-warning" />
                        <span className="fw-semibold">Role-Based Access Control (RBAC) Policy</span>
                    </div>
                    <div className="fs-8 text-secondary">
                        If you believe you should have access to this module, please request permission assignment from your Administrator or Department Manager.
                    </div>
                </div>

                <div className="d-flex align-items-center justify-content-center gap-3">
                    <button 
                        type="button" 
                        className="btn btn-outline-secondary px-4 py-2.5 rounded-3 fw-semibold d-inline-flex align-items-center gap-2"
                        onClick={() => navigate(-1)}
                    >
                        <FontAwesomeIcon icon={faArrowLeft} /> Go Back
                    </button>

                    <Link 
                        to="/app/dashboard" 
                        className="btn btn-success text-white px-4 py-2.5 rounded-3 fw-bold d-inline-flex align-items-center gap-2 shadow-sm"
                        style={{ background: '#16A34A', borderColor: '#16A34A' }}
                    >
                        <FontAwesomeIcon icon={faHome} /> Return to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AccessDenied;
