import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCheckCircle,
    faTimesCircle,
    faFilePdf,
    faDownload,
    faBuilding,
    faUserCheck,
    faExclamationTriangle,
    faCircleNotch
} from "@fortawesome/free-solid-svg-icons";

const SupplierApprovalPage = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    const [status, setStatus] = useState('pending'); // 'pending', 'accepted', 'rejected'
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('Price Issue');
    const [rejectComments, setRejectComments] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAccept = () => {
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            setStatus('accepted');
        }, 800);
    };

    const handleRejectSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            setShowRejectModal(false);
            setStatus('rejected');
        }, 800);
    };

    return (
        <div style={{ background: '#F8FAFC', minHeight: '100vh', padding: '40px 20px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            <div style={{ maxWidth: '840px', margin: '0 auto', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 10px 40px rgba(15, 23, 42, 0.08)', overflow: 'hidden' }}>
                {/* Header Bar */}
                <div style={{ background: '#0F172A', color: '#FFFFFF', padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.3px' }}>
                            INFY-POS PROCUREMENT NETWORK
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#94A3B8', marginTop: '2px' }}>
                            Official Purchase Order Supplier Portal
                        </div>
                    </div>
                    <div style={{ background: '#1E293B', padding: '6px 14px', borderRadius: '8px', border: '1px solid #334155', fontSize: '12px', fontWeight: '700', color: '#38BDF8' }}>
                        Ref: PO-2026-000033
                    </div>
                </div>

                {status === 'pending' && (
                    <div style={{ padding: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', pb: '20px', marginBottom: '24px' }}>
                            <div>
                                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                                    Purchase Order Approval Request
                                </h2>
                                <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
                                    Sent to <strong>Apex Appliance Distributors</strong> on 01 Aug 2026
                                </div>
                            </div>
                            <span style={{ background: '#FEF3C7', color: '#D97706', fontWeight: '800', fontSize: '12px', padding: '4px 12px', borderRadius: '12px', border: '1px solid #FDE68A' }}>
                                Action Required
                            </span>
                        </div>

                        {/* Order Meta */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                            <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
                                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Buyer Details</div>
                                <div style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', marginTop: '4px' }}>System Administrator</div>
                                <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>Main Industrial Depot, Dock 4, Technology Park</div>
                            </div>
                            <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
                                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Supplier Details</div>
                                <div style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', marginTop: '4px' }}>Apex Appliance Distributors</div>
                                <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>GSTIN: 33AAACN1234C1Z5 • SUP-00012</div>
                            </div>
                        </div>

                        {/* Product Table */}
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
                            <thead>
                                <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', fontSize: '12px', color: '#475569', textAlign: 'left' }}>
                                    <th style={{ padding: '10px 12px' }}>#</th>
                                    <th style={{ padding: '10px 12px' }}>PRODUCT</th>
                                    <th style={{ padding: '10px 12px' }}>SKU</th>
                                    <th style={{ padding: '10px 12px' }}>QTY</th>
                                    <th style={{ padding: '10px 12px' }}>UNIT COST</th>
                                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>TOTAL</th>
                                </tr>
                            </thead>
                            <tbody style={{ fontSize: '13px' }}>
                                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                                    <td style={{ padding: '12px' }}>1</td>
                                    <td style={{ padding: '12px', fontWeight: '700' }}>Samsung 55 Inch 4K Smart TV</td>
                                    <td style={{ padding: '12px', fontFamily: 'monospace' }}>SAM55UHD</td>
                                    <td style={{ padding: '12px', fontWeight: '700' }}>10</td>
                                    <td style={{ padding: '12px' }}>₹32,000.00</td>
                                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '800' }}>₹3,20,000.00</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                                    <td style={{ padding: '12px' }}>2</td>
                                    <td style={{ padding: '12px', fontWeight: '700' }}>LG 260L Double Door Refrigerator</td>
                                    <td style={{ padding: '12px', fontFamily: 'monospace' }}>LGR260DB</td>
                                    <td style={{ padding: '12px', fontWeight: '700' }}>52</td>
                                    <td style={{ padding: '12px' }}>₹2,850.00</td>
                                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '800' }}>₹1,48,200.00</td>
                                </tr>
                            </tbody>
                        </table>

                        <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '10px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                            <div>
                                <div style={{ fontSize: '12px', color: '#166534', fontWeight: '700' }}>GRAND TOTAL (INCL. 18% GST)</div>
                                <div style={{ fontSize: '24px', fontWeight: '800', color: '#15803D' }}>₹2,12,798.84</div>
                            </div>
                            <div style={{ fontSize: '12px', color: '#166534', textAlign: 'right' }}>
                                Expected Delivery: <strong>08 Aug 2026</strong>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', justify: 'center', gap: '16px' }}>
                            <button
                                type="button"
                                onClick={() => setShowRejectModal(true)}
                                style={{ height: '46px', padding: '0 24px', borderRadius: '10px', border: '1px solid #FCA5A5', background: '#FFFFFF', color: '#DC2626', fontWeight: '800', fontSize: '14px', cursor: 'pointer' }}
                            >
                                Reject Purchase Order
                            </button>
                            <button
                                type="button"
                                onClick={handleAccept}
                                disabled={isSubmitting}
                                style={{ height: '46px', padding: '0 32px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)', color: '#FFFFFF', fontWeight: '800', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)' }}
                            >
                                {isSubmitting ? 'Processing...' : 'Confirm & Accept Purchase Order'}
                            </button>
                        </div>
                    </div>
                )}

                {status === 'accepted' && (
                    <div style={{ padding: '60px 32px', textAlign: 'center' }}>
                        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', margin: '0 auto 20px auto' }}>
                            <FontAwesomeIcon icon={faCheckCircle} />
                        </div>
                        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                            Purchase Order Accepted Successfully!
                        </h2>
                        <p style={{ fontSize: '14px', color: '#64748B', marginTop: '8px', maxWidth: '480px', margin: '8px auto 0 auto' }}>
                            Thank you. Your acceptance has been logged in the INFY-POS procurement network. The buyer has been notified in real time.
                        </p>
                        <div style={{ marginTop: '24px', fontSize: '12px', color: '#94A3B8' }}>
                            Audit Stamp: Accepted at {new Date().toLocaleString()} • Device IP Logged
                        </div>
                    </div>
                )}

                {status === 'rejected' && (
                    <div style={{ padding: '60px 32px', textAlign: 'center' }}>
                        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', margin: '0 auto 20px auto' }}>
                            <FontAwesomeIcon icon={faTimesCircle} />
                        </div>
                        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                            Purchase Order Rejected
                        </h2>
                        <p style={{ fontSize: '14px', color: '#64748B', marginTop: '8px', maxWidth: '480px', margin: '8px auto 0 auto' }}>
                            You have rejected this purchase order (Reason: <strong>{rejectReason}</strong>). The procurement manager has been alerted.
                        </p>
                    </div>
                )}

                {/* Rejection Modal Popup */}
                {showRejectModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1080 }}>
                        <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '460px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
                            <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Reject Purchase Order</h4>
                            <p style={{ fontSize: '12.5px', color: '#64748B', marginTop: '4px' }}>Please specify the reason for rejecting this PO.</p>

                            <form onSubmit={handleRejectSubmit}>
                                <div style={{ marginBottom: '14px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Rejection Reason</label>
                                    <select
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '13px' }}
                                    >
                                        <option value="Price Issue">Price Issue</option>
                                        <option value="Stock Not Available">Stock Not Available</option>
                                        <option value="Delivery Delay">Delivery Delay</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Additional Comments</label>
                                    <textarea
                                        rows="3"
                                        value={rejectComments}
                                        onChange={(e) => setRejectComments(e.target.value)}
                                        placeholder="Enter details..."
                                        style={{ width: '100%', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '8px 10px', fontSize: '13px' }}
                                    ></textarea>
                                </div>

                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={() => setShowRejectModal(false)} style={{ height: '36px', padding: '0 16px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '13px', fontWeight: '700' }}>Cancel</button>
                                    <button type="submit" style={{ height: '36px', padding: '0 18px', borderRadius: '8px', border: 'none', background: '#DC2626', color: '#FFFFFF', fontSize: '13px', fontWeight: '800' }}>Submit Rejection</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupplierApprovalPage;
