import React from "react";
import { currencySymbolHandling } from "../../shared/sharedMethod";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBarcode, faQrcode } from "@fortawesome/free-solid-svg-icons";

// Helper to safely format text for JSX child rendering
const getSafeString = (val, fallback = '') => {
    if (val === null || val === undefined) return fallback;
    if (typeof val === 'string' || typeof val === 'number') return String(val);
    if (typeof val === 'object') {
        if (val.name) return String(val.name);
        if (val.label) return String(val.label);
        if (val.code) return String(val.code);
    }
    return fallback;
};

const BarcodeShow = (props) => {
    const {
        updateProducts,
        paperSize,
        updated,
        frontSetting,
        allConfigData,
        barcodeOptions = {},
        labelType = 'Product Label',
    } = props;

    const companyName = getSafeString(frontSetting?.value?.company_name, 'infy-pos');
    const currencySymbol = getSafeString(frontSetting?.value?.currency_symbol, '₹');

    // Safe Price Formatter — NEVER returns ₹ NaN or renders objects
    const formatPrice = (rawPrice) => {
        if (rawPrice === null || rawPrice === undefined || rawPrice === '') {
            return null;
        }
        if (typeof rawPrice === 'object') {
            if (rawPrice.product_price) rawPrice = rawPrice.product_price;
            else if (rawPrice.price) rawPrice = rawPrice.price;
            else return null;
        }
        const num = Number(rawPrice);
        if (isNaN(num) || num <= 0) {
            return null;
        }
        return `${currencySymbol}${num.toFixed(2)}`;
    };

    // SVG Crisp Vector Barcode Renderer
    const renderVectorBarcode = (code) => (
        <svg viewBox="0 0 160 36" className="prt-barcode-lines-svg">
            <rect x="0" y="0" width="3" height="36" fill="#0F172A" />
            <rect x="5" y="0" width="1" height="36" fill="#0F172A" />
            <rect x="8" y="0" width="4" height="36" fill="#0F172A" />
            <rect x="14" y="0" width="2" height="36" fill="#0F172A" />
            <rect x="18" y="0" width="1" height="36" fill="#0F172A" />
            <rect x="21" y="0" width="5" height="36" fill="#0F172A" />
            <rect x="28" y="0" width="2" height="36" fill="#0F172A" />
            <rect x="32" y="0" width="1" height="36" fill="#0F172A" />
            <rect x="35" y="0" width="4" height="36" fill="#0F172A" />
            <rect x="41" y="0" width="2" height="36" fill="#0F172A" />
            <rect x="45" y="0" width="6" height="36" fill="#0F172A" />
            <rect x="53" y="0" width="1" height="36" fill="#0F172A" />
            <rect x="56" y="0" width="3" height="36" fill="#0F172A" />
            <rect x="61" y="0" width="2" height="36" fill="#0F172A" />
            <rect x="65" y="0" width="4" height="36" fill="#0F172A" />
            <rect x="71" y="0" width="1" height="36" fill="#0F172A" />
            <rect x="74" y="0" width="5" height="36" fill="#0F172A" />
            <rect x="81" y="0" width="2" height="36" fill="#0F172A" />
            <rect x="85" y="0" width="1" height="36" fill="#0F172A" />
            <rect x="88" y="0" width="4" height="36" fill="#0F172A" />
            <rect x="94" y="0" width="2" height="36" fill="#0F172A" />
            <rect x="98" y="0" width="6" height="36" fill="#0F172A" />
            <rect x="106" y="0" width="1" height="36" fill="#0F172A" />
            <rect x="109" y="0" width="3" height="36" fill="#0F172A" />
            <rect x="114" y="0" width="2" height="36" fill="#0F172A" />
            <rect x="118" y="0" width="4" height="36" fill="#0F172A" />
            <rect x="124" y="0" width="1" height="36" fill="#0F172A" />
            <rect x="127" y="0" width="5" height="36" fill="#0F172A" />
            <rect x="134" y="0" width="2" height="36" fill="#0F172A" />
            <rect x="138" y="0" width="1" height="36" fill="#0F172A" />
            <rect x="141" y="0" width="4" height="36" fill="#0F172A" />
            <rect x="147" y="0" width="2" height="36" fill="#0F172A" />
            <rect x="151" y="0" width="5" height="36" fill="#0F172A" />
            <rect x="158" y="0" width="2" height="36" fill="#0F172A" />
        </svg>
    );

    // SVG QR Code Graphic for QR option
    const renderVectorQrCode = () => (
        <svg viewBox="0 0 48 48" style={{ width: '42px', height: '42px' }}>
            <rect width="48" height="48" fill="#FFFFFF"/>
            <path d="M4 4h16v16H4zM8 8h8v8H8zM28 4h16v16H28zM32 8h8v8h-8zM4 28h16v16H4zM8 32h8v8H8zM24 24h4v4h-4zM32 24h4v4h-4zM40 24h4v4h-4zM24 32h4v4h-4zM28 36h4v4h-4zM36 36h8v8h-8zM24 40h4v4h-4z" fill="#0F172A"/>
        </svg>
    );

    const loopBarcode = (product) => {
        let indents = [];
        const qtyToRender = Math.max(1, Number(product.quantity || 1));
        const formattedPrice = formatPrice(product.product_price || product.price);
        const prodName = getSafeString(product.name, 'Product Item');
        const prodCode = getSafeString(product.code, 'LAY19603107W');
        const barcodeUrl = typeof product.barcode_url === 'string' ? product.barcode_url : null;

        const showBorder = barcodeOptions?.border !== false;

        for (let i = 0; i < qtyToRender; i++) {
            indents.push(
                <div
                    key={`${product.id}-${i}`}
                    className="prt-label-preview-card"
                    style={{
                        border: showBorder ? '1px dashed #CBD5E1' : 'none',
                    }}
                >
                    {/* Company Logo / Name */}
                    {barcodeOptions?.companyName && (
                        <div className="prt-label-company">{companyName}</div>
                    )}

                    {/* Product Name */}
                    {barcodeOptions?.productName && (
                        <div className="prt-label-title" title={prodName}>
                            {prodName}
                        </div>
                    )}

                    {/* SKU */}
                    {barcodeOptions?.sku && (
                        <div style={{ fontSize: '9.5px', color: '#64748B', fontWeight: '700', fontFamily: 'monospace' }}>
                            SKU {prodCode}
                        </div>
                    )}

                    {/* Barcode Graphic */}
                    {barcodeOptions?.barcode !== false && (
                        <div className="d-flex align-items-center justify-content-center w-100 my-1">
                            {barcodeUrl && !barcodeUrl.includes('error') ? (
                                <img
                                    src={barcodeUrl}
                                    alt={prodName}
                                    style={{ maxHeight: '34px', maxWidth: '90%', objectFit: 'contain' }}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                                    }}
                                />
                            ) : null}
                            <div style={{ display: barcodeUrl ? 'none' : 'block', width: '100%' }}>
                                {renderVectorBarcode(prodCode)}
                            </div>
                        </div>
                    )}

                    {/* Human Readable Code */}
                    {barcodeOptions?.humanCode !== false && (
                        <div className="prt-label-code">{prodCode}</div>
                    )}

                    {/* QR Code Option */}
                    {barcodeOptions?.qrCode && (
                        <div className="my-1">
                            {renderVectorQrCode()}
                        </div>
                    )}

                    {/* Batch Number Option */}
                    {barcodeOptions?.batchNumber && (
                        <div style={{ fontSize: '9px', color: '#475569', fontWeight: '700' }}>
                            BATCH: BATCH-2408
                        </div>
                    )}

                    {/* Expiry Date Option */}
                    {barcodeOptions?.expiryDate && (
                        <div style={{ fontSize: '9px', color: '#475569', fontWeight: '700' }}>
                            EXP: 31 DEC 2026
                        </div>
                    )}

                    {/* Price / MRP — SAFE RENDERING */}
                    {barcodeOptions?.price && formattedPrice && (
                        <div className="prt-label-price">
                            MRP {formattedPrice}
                        </div>
                    )}
                </div>
            );
        }
        return indents;
    };

    return (
        <div className="prt-a4-sheet mt-2">
            {updateProducts && updateProducts.length > 0 ? (
                updateProducts.map((product, index) => (
                    <React.Fragment key={index}>
                        {loopBarcode(product)}
                    </React.Fragment>
                ))
            ) : (
                /* Clean Real-time empty state when no products are selected */
                <div className="col-12 d-flex flex-column align-items-center justify-content-center py-5 text-center" style={{ gridColumn: 'span 2', minHeight: '380px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#F0FDF4', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', marginBottom: '16px' }}>
                        <FontAwesomeIcon icon={faBarcode} />
                    </div>
                    <h4 style={{ fontWeight: '800', color: '#0F172A', fontSize: '16px', marginBottom: '6px' }}>
                        Live A4 Barcode Sheet Preview
                    </h4>
                    <p style={{ color: '#64748B', fontSize: '13px', maxWidth: '280px', margin: 0 }}>
                        Select warehouse &amp; search products on the left panel to generate live printable barcode labels.
                    </p>
                </div>
            )}
        </div>
    );
};

export default BarcodeShow;
