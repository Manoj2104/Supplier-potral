import React from 'react';
import MasterLayout from '../MasterLayout';
import TopProgressBar from '../../shared/components/loaders/TopProgressBar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faClock, faTriangleExclamation, faLock, faCheck, faXmark,
    faHeadset, faShieldHalved, faRotate, faFileInvoice, faCreditCard,
    faStore, faWifi, faBolt, faSliders, faChartLine, faBuilding,
    faArrowRotateRight
} from '@fortawesome/free-solid-svg-icons';
import './SubscriptionLockScreen.css';

/**
 * SubscriptionLockScreen
 *
 * Rendered inside MasterLayout so that:
 *  ✔ Sidebar stays visible
 *  ✔ Top navigation stays visible
 *  ✔ URL stays the same
 *  ✗ ALL page content is replaced with subscription info ONLY
 */
const SubscriptionLockScreen = ({ subData }) => {
    const data = subData || {};
    const daysLeft = data.days_remaining || 0;
    const status = data.status || 'expired';

    const isTrial = status === 'trial';
    const isGrace = status === 'grace_period';
    const isLocked = status === 'locked' || status === 'access_locked';
    const isExpired = !isTrial && !isGrace && !isLocked;

    // Circular ring for trial countdown
    const circumference = 201;
    const progressOffset = isTrial
        ? circumference - (Math.min(daysLeft, 14) / 14) * circumference
        : circumference;

    const getBannerClass = () => {
        if (isTrial && daysLeft <= 3) return 'lock-banner lock-banner--warning';
        if (isTrial) return 'lock-banner lock-banner--trial';
        if (isGrace) return 'lock-banner lock-banner--grace';
        if (isLocked) return 'lock-banner lock-banner--locked';
        return 'lock-banner lock-banner--expired';
    };

    const getBannerIcon = () => {
        if (isTrial) return faClock;
        if (isGrace) return faTriangleExclamation;
        return faLock;
    };

    const getBannerTitle = () => {
        if (isTrial && daysLeft <= 3) return `Only ${daysLeft} Day${daysLeft !== 1 ? 's' : ''} Left!`;
        if (isTrial) return 'Your Free Trial is Active';
        if (isGrace) return `Grace Period — ${daysLeft} Day${daysLeft !== 1 ? 's' : ''} Remaining`;
        if (isLocked) return 'Access Locked';
        return 'Your Subscription Has Expired';
    };

    const getBannerSubtitle = () => {
        if (isTrial && daysLeft <= 3) return 'Your trial is ending soon. Subscribe now to continue using INFY-POS without interruption.';
        if (isTrial) return 'Enjoying INFY-POS? Upgrade now and continue using all features without interruption.';
        if (isGrace) return `Your subscription has expired but you have ${daysLeft} grace day(s) remaining. Renew now to avoid losing access.`;
        if (isLocked) return 'Your grace period is over. Renew your subscription to unlock and continue using INFY-POS.';
        return `Your subscription ended on ${data.subscription_ends_at || data.trial_ends_at || 'recently'}. Please renew to continue using INFY-POS.`;
    };

    return (
        <MasterLayout>
            <TopProgressBar />
            <div className="sub-lock-page">

                {/* ── HERO STATUS BANNER ── */}
                <div className={getBannerClass()}>
                    <div className="lock-banner__left">
                        <div className="lock-banner__icon-ring">
                            <FontAwesomeIcon icon={getBannerIcon()} />
                        </div>
                        <div className="lock-banner__text">
                            <h1 className="lock-banner__title">{getBannerTitle()}</h1>
                            <p className="lock-banner__subtitle">{getBannerSubtitle()}</p>
                        </div>
                    </div>

                    <div className="lock-banner__right">
                        {isTrial && (
                            <div className="lock-trial-ring">
                                <svg viewBox="0 0 80 80" className="lock-ring-svg">
                                    <circle className="lock-ring-bg" cx="40" cy="40" r="32" />
                                    <circle
                                        className="lock-ring-progress"
                                        cx="40" cy="40" r="32"
                                        style={{
                                            strokeDasharray: circumference,
                                            strokeDashoffset: isNaN(progressOffset) ? 0 : progressOffset,
                                            stroke: daysLeft <= 3 ? '#F59E0B' : '#10B981'
                                        }}
                                    />
                                </svg>
                                <div className="lock-ring-center">
                                    <span className="lock-ring-number">{String(daysLeft).padStart(2, '0')}</span>
                                    <span className="lock-ring-label">Days Left</span>
                                </div>
                            </div>
                        )}

                        <div className="lock-banner__actions">
                            <a href="#/app/subscription" className="lock-btn-primary">
                                {isTrial ? 'Choose a Plan' : '🔓 Renew Now — ₹499 / Month'}
                            </a>
                            <a href="https://wa.me/918610006544" target="_blank" rel="noreferrer" className="lock-btn-support">
                                <FontAwesomeIcon icon={faHeadset} /> Contact Support
                            </a>
                        </div>
                    </div>
                </div>

                {/* ── 3-COLUMN STATUS CARDS ── */}
                <div className="lock-status-grid">

                    {/* Card 1 — Trial */}
                    <div className={`lock-card lock-card--trial ${!isTrial ? 'lock-card--dim' : ''}`}>
                        <div className="lock-card__badge">
                            <FontAwesomeIcon icon={faClock} /> FREE TRIAL
                        </div>
                        <h3 className="lock-card__title">
                            {daysLeft <= 3 && isTrial ? 'Trial Ending Soon!' : 'Your Free Trial is Active!'}
                        </h3>
                        <p className="lock-card__desc">Enjoying INFY-POS? Upgrade now and continue using all features.</p>
                        {isTrial && (
                            <div className="lock-card__ring-mini">
                                <svg viewBox="0 0 80 80">
                                    <circle className="lock-ring-bg" cx="40" cy="40" r="32" />
                                    <circle className="lock-ring-progress" cx="40" cy="40" r="32"
                                        style={{
                                            strokeDasharray: circumference,
                                            strokeDashoffset: isNaN(progressOffset) ? 0 : progressOffset,
                                            stroke: daysLeft <= 3 ? '#F59E0B' : '#10B981'
                                        }}
                                    />
                                </svg>
                                <div className="lock-ring-center">
                                    <span className="lock-ring-number">{String(daysLeft).padStart(2, '0')}</span>
                                    <span className="lock-ring-label">Days Left</span>
                                </div>
                            </div>
                        )}
                        <ul className="lock-card__list">
                            <li><FontAwesomeIcon icon={faCheck} className="icon-check" /> All Features Included</li>
                            <li><FontAwesomeIcon icon={faCheck} className="icon-check" /> No Credit Card Required</li>
                            <li><FontAwesomeIcon icon={faCheck} className="icon-check" /> Cancel Anytime</li>
                        </ul>
                        <a href="#/app/subscription" className="lock-card__btn lock-card__btn--green">Choose a Plan</a>
                        <a href="https://wa.me/918610006544" target="_blank" rel="noreferrer" className="lock-card__support">
                            <FontAwesomeIcon icon={faHeadset} /> Need Help? Contact Support
                        </a>
                    </div>

                    {/* Card 2 — Expired */}
                    <div className={`lock-card lock-card--expired ${isTrial ? 'lock-card--dim' : ''}`}>
                        <div className="lock-card__badge lock-card__badge--red">
                            <FontAwesomeIcon icon={faTriangleExclamation} /> SUBSCRIPTION EXPIRED
                        </div>
                        <h3 className="lock-card__title">
                            Your Subscription <span className="text-red">Has Expired!</span>
                        </h3>
                        <p className="lock-card__desc">
                            Your subscription ended on {data.subscription_ends_at || data.trial_ends_at || 'recently'}.
                            Please renew to continue using INFY-POS.
                        </p>
                        <div className="lock-expired-stamp">EXPIRED</div>
                        {isGrace && (
                            <div className="lock-grace-alert">
                                <FontAwesomeIcon icon={faLock} />
                                <span>Grace period active. {daysLeft} day(s) remaining to renew.</span>
                            </div>
                        )}
                        <a href="#/app/subscription" className="lock-card__btn lock-card__btn--red">Renew Now — ₹499 / Month</a>
                        <a href="https://wa.me/918610006544" target="_blank" rel="noreferrer" className="lock-card__support">
                            <FontAwesomeIcon icon={faHeadset} /> Need Help? Contact Support
                        </a>
                    </div>

                    {/* Card 3 — Access Locked */}
                    <div className={`lock-card lock-card--locked ${isTrial || isGrace ? 'lock-card--dim' : ''}`}>
                        <div className="lock-card__badge lock-card__badge--dark">
                            <FontAwesomeIcon icon={faLock} /> ACCESS LOCKED
                        </div>
                        <h3 className="lock-card__title">Access Locked!</h3>
                        <p className="lock-card__desc">Your grace period is over. Renew your subscription to unlock and continue.</p>
                        <div className="lock-locked-icon"><FontAwesomeIcon icon={faLock} /></div>
                        <ul className="lock-card__list">
                            <li className="restricted"><FontAwesomeIcon icon={faXmark} className="icon-cross" /> Cannot create new transactions</li>
                            <li className="restricted"><FontAwesomeIcon icon={faXmark} className="icon-cross" /> Billing is disabled</li>
                            <li className="restricted"><FontAwesomeIcon icon={faXmark} className="icon-cross" /> Reports are restricted</li>
                            <li><FontAwesomeIcon icon={faCheck} className="icon-check" /> Data is safe and secure</li>
                        </ul>
                        <a href="#/app/subscription" className="lock-card__btn lock-card__btn--dark">
                            <FontAwesomeIcon icon={faLock} /> Renew Now — ₹499 / Month
                        </a>
                        <a href="https://wa.me/918610006544" target="_blank" rel="noreferrer" className="lock-card__support">
                            <FontAwesomeIcon icon={faHeadset} /> Need Help? Contact Support
                        </a>
                    </div>

                </div>

                {/* ── PREMIUM PLAN HERO CARD ── */}
                <div className="lock-plan-section">
                    <div className="lock-plan-card">
                        <div className="lock-plan-left">
                            <span className="lock-badge-best">BEST VALUE</span>
                            <h2 className="lock-plan-name">INFY–POS PREMIUM</h2>
                            <p className="lock-plan-tagline">Everything Included. No Limits. Single Plan. All Features.</p>
                            <div className="lock-plan-price">
                                <span className="lock-price-amount">₹499</span>
                                <span className="lock-price-unit"> / Month</span>
                            </div>
                            <span className="lock-trial-pill">14-Day Free Trial • No Credit Card Required</span>
                            <div className="lock-features-grid">
                                {[
                                    'Unlimited Billing', 'PDA & Scanner Included',
                                    'Unlimited Products', 'Barcode & QR Printing',
                                    'Unlimited Users', 'Inventory Management',
                                    'Unlimited Warehouses', 'Purchase & Sales',
                                    'Unlimited Customers', 'Cloud Backup',
                                    'Unlimited Suppliers', 'Free Updates',
                                    'Unlimited Invoices', '24x7 Support',
                                    'Unlimited Reports',
                                ].map((f) => (
                                    <div className="lock-feature-item" key={f}>
                                        <FontAwesomeIcon icon={faCheck} /> {f}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="lock-plan-right">
                            <div className="lock-why-card">
                                <h4>WHY CHOOSE INFY-POS?</h4>
                                <ul>
                                    <li><span className="why-dot"><FontAwesomeIcon icon={faStore} /></span> All-in-One POS & Inventory</li>
                                    <li><span className="why-dot"><FontAwesomeIcon icon={faWifi} /></span> Works Offline & Online</li>
                                    <li><span className="why-dot"><FontAwesomeIcon icon={faBolt} /></span> Lightning Fast Billing</li>
                                    <li><span className="why-dot"><FontAwesomeIcon icon={faSliders} /></span> Easy to Use Interface</li>
                                    <li><span className="why-dot"><FontAwesomeIcon icon={faChartLine} /></span> Advanced Reports & Analytics</li>
                                    <li><span className="why-dot"><FontAwesomeIcon icon={faBuilding} /></span> Multi-Store & Multi-Warehouse</li>
                                    <li><span className="why-dot"><FontAwesomeIcon icon={faArrowRotateRight} /></span> Regular Updates</li>
                                    <li><span className="why-dot"><FontAwesomeIcon icon={faHeadset} /></span> Dedicated Support</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── TRUST BADGES + RAZORPAY ── */}
                <div className="lock-trust-footer">
                    <div className="lock-trust-badges">
                        {[
                            { icon: faShieldHalved, title: 'Trusted by 1,000+ Businesses', sub: 'From small stores to large enterprises' },
                            { icon: faShieldHalved, title: '100% Data Safe', sub: 'Secure Cloud Backup' },
                            { icon: faRotate, title: 'Cancel Anytime', sub: 'No Hidden Charges' },
                            { icon: faFileInvoice, title: 'GST Invoice', sub: 'Instant Download' },
                            { icon: faCreditCard, title: 'Multiple Payment Options', sub: 'UPI, Card, Net Banking, Wallet' },
                        ].map(({ icon, title, sub }) => (
                            <div className="lock-trust-item" key={title}>
                                <div className="lock-trust-icon"><FontAwesomeIcon icon={icon} /></div>
                                <div>
                                    <h5>{title}</h5>
                                    <p>{sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="lock-razorpay-card">
                        <div className="lock-razorpay-header">
                            <FontAwesomeIcon icon={faLock} style={{ color: '#059669' }} />
                            <span>Pay Securely with Razorpay</span>
                        </div>
                        <div className="lock-pay-logos">
                            {['UPI', 'VISA', 'MC', 'RuPay', 'Paytm'].map(l => (
                                <span className="lock-pay-badge" key={l}>{l}</span>
                            ))}
                        </div>
                        <a href="/billing" className="lock-pay-btn">
                            Pay Now — ₹499 / Month
                        </a>
                        <div className="lock-secure-note">
                            🔒 100% Secure &nbsp;•&nbsp; SSL Protected &nbsp;•&nbsp; GST Invoice &nbsp;•&nbsp; Instant Activation
                        </div>
                    </div>
                </div>

            </div>
        </MasterLayout>
    );
};

export default SubscriptionLockScreen;
