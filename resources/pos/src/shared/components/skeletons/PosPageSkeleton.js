import React from 'react';

const PosPageSkeleton = () => {
    return (
        <div className="skeleton-container" style={{ padding: '16px', background: '#F8FAFC', minHeight: '100vh', display: 'flex', gap: '16px' }}>
            {/* Left Products Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Search & Category Tabs */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div className="skeleton" style={{ flex: 1, height: '48px', borderRadius: '12px' }} />
                    <div className="skeleton" style={{ width: '120px', height: '48px', borderRadius: '12px' }} />
                </div>

                {/* Category Pills */}
                <div style={{ display: 'flex', gap: '10px', overflowX: 'hidden' }}>
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="skeleton" style={{ width: '100px', height: '36px', borderRadius: '50px', flexShrink: 0 }} />
                    ))}
                </div>

                {/* Product Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px', flex: 1 }}>
                    {[...Array(12)].map((_, i) => (
                        <div key={i} style={{ background: '#FFFFFF', borderRadius: '16px', padding: '14px', border: '1px solid #EEF2F7', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div className="skeleton" style={{ width: '100%', height: '110px', borderRadius: '12px' }} />
                            <div className="skeleton" style={{ width: '80%', height: '14px', borderRadius: '4px' }} />
                            <div className="skeleton" style={{ width: '40%', height: '18px', borderRadius: '6px' }} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Cart Sidebar */}
            <div style={{ width: '380px', background: '#FFFFFF', borderRadius: '20px', padding: '20px', border: '1px solid #EEF2F7', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="skeleton" style={{ width: '120px', height: '24px', borderRadius: '6px' }} />
                    <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
                </div>
                <div className="skeleton" style={{ width: '100%', height: '44px', borderRadius: '10px' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[...Array(4)].map((_, i) => (
                        <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '8px' }} />
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div className="skeleton" style={{ width: '80%', height: '12px', borderRadius: '4px' }} />
                                <div className="skeleton" style={{ width: '40%', height: '10px', borderRadius: '3px' }} />
                            </div>
                            <div className="skeleton" style={{ width: '50px', height: '16px', borderRadius: '4px' }} />
                        </div>
                    ))}
                </div>
                <div style={{ borderTop: '1px solid #EEF2F7', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div className="skeleton" style={{ width: '60px', height: '14px', borderRadius: '4px' }} />
                        <div className="skeleton" style={{ width: '80px', height: '14px', borderRadius: '4px' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div className="skeleton" style={{ width: '80px', height: '20px', borderRadius: '4px' }} />
                        <div className="skeleton" style={{ width: '100px', height: '24px', borderRadius: '6px' }} />
                    </div>
                    <div className="skeleton" style={{ width: '100%', height: '48px', borderRadius: '12px', marginTop: '10px' }} />
                </div>
            </div>
        </div>
    );
};

export default PosPageSkeleton;
