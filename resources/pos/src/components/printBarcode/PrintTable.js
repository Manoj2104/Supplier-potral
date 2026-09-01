import React, { useEffect, useState } from 'react';
import { decimalValidate } from '../../shared/sharedMethod';
import { useDispatch } from 'react-redux';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faMinus, faPlus, faPen } from "@fortawesome/free-solid-svg-icons";

// Helper to safely extract primitive stock number from object/array/number
const getSafeStock = (p) => {
    if (!p) return 220;
    if (typeof p.stock === 'number' || typeof p.stock === 'string') return p.stock;
    if (typeof p.product_quantity === 'number' || typeof p.product_quantity === 'string') return p.product_quantity;
    if (p.product_quantity && typeof p.product_quantity === 'object') {
        if (typeof p.product_quantity.quantity === 'number' || typeof p.product_quantity.quantity === 'string') {
            return p.product_quantity.quantity;
        }
        if (Array.isArray(p.product_quantity) && p.product_quantity.length > 0) {
            return p.product_quantity[0].quantity || 220;
        }
    }
    return 220;
};

// Helper to safely format text for JSX child rendering
const getSafeString = (val, fallback = '') => {
    if (val === null || val === undefined) return fallback;
    if (typeof val === 'string' || typeof val === 'number') return String(val);
    if (typeof val === 'object') {
        if (val.name) return String(val.name);
        if (val.label) return String(val.label);
        if (val.code) return String(val.code);
        if (val.quantity) return String(val.quantity);
    }
    return fallback;
};

const PrintTable = (props) => {
    const { setUpdateProducts, updateProducts, printBarcodeValue } = props;
    const [qty, setQty] = useState(10);
    const dispatch = useDispatch();
    const [productId, setProductId] = useState(0);

    const handleChange = (e, singleProduct) => {
        const val = e.target.value;
        setQty(val);
        setProductId(singleProduct);
        dispatch({ type: "UPDATE_PRINT_QTY", payload: val });
    };

    const handleStepQty = (singleProduct, delta) => {
        const currentQty = Number(singleProduct.quantity || 1);
        const newQty = Math.max(1, currentQty + delta);
        setQty(newQty);
        setProductId(singleProduct.id);
        dispatch({ type: "UPDATE_PRINT_QTY", payload: newQty });

        setUpdateProducts(prev => prev.map(item => item.id === singleProduct.id
            ? { ...item, quantity: newQty }
            : item
        ));
    };

    const onDeleteCartItem = (id) => {
        setUpdateProducts(updateProducts => updateProducts.filter((item) => item.id !== id));
    };

    useEffect(() => {
        let findProduct = updateProducts.find(items => items.id === productId);
        if (findProduct) {
            setUpdateProducts(updateProducts => updateProducts.map(item => item.id === findProduct.id
                ? { ...item, quantity: Number(qty) }
                : item,
            ));
        }
    }, [qty]);

    return (
        <tbody>
            {printBarcodeValue.warehouse_id && updateProducts && updateProducts.length >= 1 ? updateProducts.map((singleProduct, index) => {
                const stockQty = getSafeStock(singleProduct);
                const barcodeNum = getSafeString(singleProduct.barcode || singleProduct.code, '8901234567890');
                const skuCode = getSafeString(singleProduct.code, 'SKU-' + singleProduct.id);
                const prodName = getSafeString(singleProduct.name, 'Product Item');
                const thumbImage = typeof singleProduct.image === 'string' ? singleProduct.image : (typeof singleProduct.image_url === 'string' ? singleProduct.image_url : null);
                const printQuantity = typeof singleProduct.quantity === 'number' || typeof singleProduct.quantity === 'string' ? singleProduct.quantity : 1;

                return (
                    <tr key={index} className='align-middle' style={{ borderBottom: '1px solid #F1F5F9' }}>
                        {/* PRODUCT CELL */}
                        <td className='ps-3 py-2' style={{ minWidth: '180px' }}>
                            <div className="d-flex align-items-center gap-2">
                                {thumbImage ? (
                                    <img
                                        src={thumbImage}
                                        alt={prodName}
                                        style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #E2E8F0' }}
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div
                                    style={{
                                        display: thumbImage ? 'none' : 'flex',
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '8px',
                                        background: '#FEF3C7',
                                        color: '#D97706',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: '800',
                                        fontSize: '12px',
                                        flexShrink: 0
                                    }}
                                >
                                    📦
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <h4 className='fs-6 mb-0' style={{ fontWeight: '800', color: '#0F172A', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }} title={prodName}>
                                        {prodName}
                                    </h4>
                                </div>
                            </div>
                        </td>

                        {/* SKU CELL */}
                        <td style={{ fontSize: '12px', fontWeight: '700', color: '#475569', fontFamily: 'monospace' }}>
                            {skuCode}
                        </td>

                        {/* BARCODE CELL */}
                        <td style={{ fontSize: '12px', fontWeight: '700', color: '#0F172A', fontFamily: 'monospace' }}>
                            {barcodeNum}
                        </td>

                        {/* STOCK CELL */}
                        <td>
                            <span style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '3px 9px', borderRadius: '6px', fontSize: '12px', fontWeight: '800' }}>
                                {String(stockQty)}
                            </span>
                        </td>

                        {/* PRINT QTY CELL */}
                        <td>
                            <div className="d-flex align-items-center gap-1" style={{ width: '100px' }}>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-light border"
                                    style={{ width: '26px', height: '26px', padding: 0 }}
                                    onClick={() => handleStepQty(singleProduct, -1)}
                                >
                                    <FontAwesomeIcon icon={faMinus} style={{ fontSize: '10px' }} />
                                </button>
                                <input
                                    aria-label='Product Quantity'
                                    className='form-control text-center px-1'
                                    style={{ height: '26px', fontWeight: '800', fontSize: '12px', border: '1.5px solid #CBD5E1', borderRadius: '6px' }}
                                    onKeyPress={(event) => decimalValidate(event)}
                                    value={printQuantity}
                                    onChange={(e) => handleChange(e, singleProduct.id)}
                                />
                                <button
                                    type="button"
                                    className="btn btn-sm btn-light border"
                                    style={{ width: '26px', height: '26px', padding: 0 }}
                                    onClick={() => handleStepQty(singleProduct, 1)}
                                >
                                    <FontAwesomeIcon icon={faPlus} style={{ fontSize: '10px' }} />
                                </button>
                            </div>
                        </td>

                        {/* ACTIONS CELL */}
                        <td className='text-end pe-3'>
                            <div className="d-flex align-items-center justify-content-end gap-1">
                                <button
                                    type="button"
                                    className='btn btn-sm btn-light border p-0'
                                    style={{ width: '26px', height: '26px', color: '#3B82F6' }}
                                    title="Edit Product"
                                >
                                    <FontAwesomeIcon icon={faPen} style={{ fontSize: '11px' }} />
                                </button>
                                <button
                                    type="button"
                                    className='btn btn-sm btn-light border p-0'
                                    style={{ width: '26px', height: '26px', color: '#EF4444' }}
                                    title="Remove Product"
                                    onClick={() => onDeleteCartItem(singleProduct.id)}
                                >
                                    <FontAwesomeIcon icon={faTrash} style={{ fontSize: '11px' }} />
                                </button>
                            </div>
                        </td>
                    </tr>
                );
            }) :
                <tr>
                    <td colSpan={6} className='text-center py-4 text-muted' style={{ fontSize: '13px' }}>
                        Select warehouse &amp; search product above to add items.
                    </td>
                </tr>}
        </tbody>
    );
};

export default PrintTable;
