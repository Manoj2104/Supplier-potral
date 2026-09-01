import React from 'react';

const FormPageSkeleton = () => {
    return (
        <div className="skeleton-container" style={{ padding: '24px 32px', background: '#F8FAFC', minHeight: '100vh' }}>
            {/* 1. Breadcrumb + Header Title */}
            <div className="skeleton-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="skeleton" style={{ width: '160px', height: '14px', borderRadius: '4px' }} />
                    <div className="skeleton" style={{ width: '280px', height: '32px', borderRadius: '8px' }} />
                    <div className="skeleton" style={{ width: '380px', height: '14px', borderRadius: '4px' }} />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div className="skeleton" style={{ width: '110px', height: '42px', borderRadius: '10px' }} />
                    <div className="skeleton" style={{ width: '140px', height: '42px', borderRadius: '10px' }} />
                </div>
            </div>

            {/* 2. Main Form Card */}
            <div className="skeleton-card" style={{ background: '#FFFFFF', borderRadius: '20px', padding: '32px', border: '1px solid #EEF2F7', boxShadow: '0 4px 20px rgba(15,23,42,0.04)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                    {[...Array(6)].map((_, i) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div className="skeleton" style={{ width: '120px', height: '16px', borderRadius: '4px' }} />
                            <div className="skeleton" style={{ width: '100%', height: '48px', borderRadius: '10px' }} />
                        </div>
                    ))}
                </div>

                {/* Additional large input block */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
                    <div className="skeleton" style={{ width: '140px', height: '16px', borderRadius: '4px' }} />
                    <div className="skeleton" style={{ width: '100%', height: '110px', borderRadius: '12px' }} />
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px', paddingTop: '20px', borderTop: '1px solid #F1F5F9' }}>
                    <div className="skeleton" style={{ width: '100px', height: '44px', borderRadius: '10px' }} />
                    <div className="skeleton" style={{ width: '150px', height: '44px', borderRadius: '10px' }} />
                </div>
            </div>
        </div>
    );
};

export default FormPageSkeleton;
