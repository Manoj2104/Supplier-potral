import React, { useEffect, useRef, useState } from 'react';
import { Table } from 'react-bootstrap-v5';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import MasterLayout from '../MasterLayout';
import BarcodeSkeleton from '../../shared/components/skeletons/BarcodeSkeleton';
import TabTitle from '../../shared/tab-title/TabTitle';
import { getFormattedMessage, placeholderText } from '../../shared/sharedMethod';
import ReactSelect from '../../shared/select/reactSelect';
import { fetchAllWarehouses } from '../../store/action/warehouseAction';
import { fetchAllProducts } from '../../store/action/productAction';
import { preparePurchaseProductArray } from '../../shared/prepareArray/preparePurchaseArray';
import PrintTable from './PrintTable';
import paperSizeOptions from '../../shared/option-lists/paperSize.json';
import { toastType } from '../../constants';
import { addToast } from '../../store/action/toastAction';
import BarcodeShow from './BarcodeShow';
import PrintButton from './PrintButton';
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";
import { fetchFrontSetting } from "../../store/action/frontSettingAction";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBarcode,
    faPrint,
    faMagnifyingGlassPlus,
    faMagnifyingGlassMinus,
    faRotateLeft,
    faFilePdf,
    faCheck,
    faBoxes,
    faTrash,
    faArrowLeft,
    faSearch,
    faTimes,
    faArrowRight,
    faBoxesStacked,
    faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import "../sales/CreateSalePremium.css";
import "../variation/ProductVariationsPremium.css";
import "../brands/ProductBrandsPremium.css";
import "./PrintBarcodePremium.css";

const PrintBarcode = () => {
    const dispatch = useDispatch();
    const { warehouses, products, frontSetting, allConfigData } = useSelector(state => state);

    const customProducts = (products && Array.isArray(products) && products.length > 0)
        ? preparePurchaseProductArray(products, true)
        : [];

    const hasData = (Array.isArray(warehouses) && warehouses.length > 0) || (Array.isArray(products) && products.length > 0);
    const isLoadingSkeleton = !hasData;

    const defaultPaperSize = paperSizeOptions.find(p => p.value === 1) || paperSizeOptions[0];

    const [printBarcodeValue, setPrintBarcodeValue] = useState({
        warehouse_id: '',
        paperSizeValue: defaultPaperSize
    });

    const printBarcodeQuantity = useSelector((state) => state.printQuantity);
    const [updateProducts, setUpdateProducts] = useState([]);
    const [print, setPrint] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    const [companyLogo, setCompanyLogo] = useState(true);
    const [companyName, setCompanyName] = useState(true);
    const [productName, setProductName] = useState(true);
    const [showBarcode, setShowBarcode] = useState(true);
    const [humanCode, setHumanCode] = useState(true);
    const [showSku, setShowSku] = useState(true);
    const [price, setPrice] = useState(true);
    const [batchNumber, setBatchNumber] = useState(false);
    const [expiryDate, setExpiryDate] = useState(false);
    const [qrCode, setQrCode] = useState(false);
    const [border, setBorder] = useState(true);

    const [selectedPaperVal, setSelectedPaperVal] = useState(1);
    const [labelType, setLabelType] = useState('Product Label');
    const [zoomLevel, setZoomLevel] = useState(100);
    const [activePreset, setActivePreset] = useState('10');

    const [errors, setErrors] = useState({
        warehouse_id: '',
        paperSizeValue: ''
    });

    const [updated, setUpdated] = useState(true);
    const componentRef = useRef();

    useEffect(() => {
        dispatch(fetchAllWarehouses());
        dispatch(fetchAllProducts());
        dispatch(fetchFrontSetting());
    }, []);

    useEffect(() => {
        if (warehouses && warehouses.length > 0 && !printBarcodeValue.warehouse_id) {
            const firstWh = warehouses[0];
            setPrintBarcodeValue(inputs => ({
                ...inputs,
                warehouse_id: { value: firstWh.id, label: firstWh.attributes ? firstWh.attributes.name : (firstWh.name || 'Main Warehouse') }
            }));
        }
    }, [warehouses]);

    useEffect(() => {
        if (printBarcodeQuantity) {
            const product = updateProducts.filter(
                (item) => item.id === printBarcodeQuantity.id
            );
            if (product.length > 0) {
                product[0].quantity = printBarcodeQuantity.quantity;
                setUpdateProducts([...updateProducts]);
            }
        }
    }, [printBarcodeQuantity]);

    // ── Image Helper ──────────────────────────────────────────────────────────
    const extractImageUrl = (attr) => {
        if (!attr) return null;
        if (attr.image_url?.imageUrls) {
            const urls = attr.image_url.imageUrls;
            const first = Object.values(urls)[0];
            if (first && typeof first === 'string') return first;
        }
        if (typeof attr.image_url === 'string' && attr.image_url.length > 5) return attr.image_url;
        if (typeof attr.product_image === 'string' && attr.product_image.length > 5) return attr.product_image;
        return null;
    };

    // ── Search & Filter ───────────────────────────────────────────────────────
    const safeProducts = Array.isArray(products) ? products : (products?.data || []);
    const hasWarehouse = !!(printBarcodeValue.warehouse_id?.value || printBarcodeValue.warehouse_id?.id || printBarcodeValue.warehouse_id);
    const filteredProducts = searchQuery
        ? safeProducts.filter(p => {
              const a = p.attributes || p;
              const nameMatch = (a.name || '').toLowerCase().includes(searchQuery.toLowerCase());
              const codeMatch = (a.code || '').toLowerCase().includes(searchQuery.toLowerCase());
              const barcodeMatch = (a.barcode || '').toLowerCase().includes(searchQuery.toLowerCase());
              return nameMatch || codeMatch || barcodeMatch;
          }).slice(0, 8)
        : [];

    const displayProducts = filteredProducts;

    const addProductToBarcode = (prod) => {
        const a = prod.attributes || prod;
        const targetId = prod.id;
        const cost = Number(a.product_cost !== undefined ? a.product_cost : (a.cost !== undefined ? a.cost : (a.net_unit_cost || a.product_price || 0)));
        const stockQty = Number(a.stock ? (typeof a.stock === 'object' ? a.stock.quantity : a.stock) : (a.available_qty || a.quantity || 0));

        const existing = updateProducts.find(p => (p.product_id || p.id) === targetId);
        if (existing) {
            setUpdateProducts(prev => prev.map(p => {
                if ((p.product_id || p.id) === targetId) {
                    const nextQty = (parseInt(p.quantity, 10) || 1) + 1;
                    return { ...p, quantity: nextQty };
                }
                return p;
            }));
            dispatch(addToast({ text: `Increased print quantity for ${a.name}!`, type: toastType.SUCCESS }));
        } else {
            const newItem = {
                id: targetId,
                product_id: targetId,
                name: a.name || 'Product',
                code: a.code || '—',
                barcode: a.barcode || a.code || '—',
                barcode_url: a.barcode_url || '',
                net_unit_cost: cost,
                product_cost: cost,
                fix_net_unit: cost,
                product_price: Number(a.product_price) || cost,
                quantity: parseInt(activePreset, 10) || 10,
                stock: stockQty,
                short_name: a.purchase_unit_name?.short_name || a.product_unit_name?.short_name || 'pc',
                image: extractImageUrl(a),
            };
            setUpdateProducts(prev => [newItem, ...prev]);
            dispatch(addToast({ text: `${a.name} added to barcode queue!`, type: toastType.SUCCESS }));
        }
        setSearchQuery('');
    };

    const handleValidation = () => {
        let errorss = {};
        let isValid = false;
        if (!printBarcodeValue['warehouse_id']) {
            errorss['warehouse_id'] = getFormattedMessage('unit.input.warehouse.validate.label');
        } else if (!printBarcodeValue['paperSizeValue']) {
            errorss['paperSizeValue'] = getFormattedMessage('unit.input.paperSize.validate.label');
        } else {
            isValid = true;
        }
        setErrors(errorss);
        return isValid;
    };

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        onAfterPrint: () => {
            dispatch(addToast({ text: "Barcode labels sent to printer successfully!", type: toastType.SUCCESS }));
        }
    });

    const printPaymentReceiptPdf = (event) => {
        event.preventDefault();
        const valid = handleValidation();
        if (updateProducts.length === 0) {
            dispatch(addToast({ text: getFormattedMessage('purchase.product-list.validate.message'), type: toastType.ERROR }));
        } else if (valid) {
            const printObj = {
                products: updateProducts,
                paperSize: printBarcodeValue.paperSizeValue,
            };
            setPrint(printObj);
            setTimeout(() => {
                const btn = document.getElementById('printReceipt');
                if (btn) btn.click();
            }, 100);
        }
    };

    const onWarehouseChange = (obj) => {
        setPrintBarcodeValue(inputs => ({ ...inputs, warehouse_id: obj }));
        setErrors('');
    };

    const onPaperSizeChange = (obj) => {
        setPrintBarcodeValue(inputs => ({ ...inputs, paperSizeValue: obj }));
        setSelectedPaperVal(obj.value);
        setErrors('');
    };

    const handleApplyPresetQty = (qtyStr) => {
        const qtyNum = parseInt(qtyStr, 10);
        setActivePreset(qtyStr);
        setUpdateProducts(prev => prev.map(p => ({ ...p, quantity: qtyNum })));
        dispatch(addToast({ text: `Set print quantity to ${qtyNum} for all items`, type: toastType.SUCCESS }));
    };

    const onResetClick = () => {
        setUpdateProducts([]);
        dispatch(addToast({ text: "Barcode queue reset", type: toastType.INFO }));
    };

    const barcodeOptions = {
        companyLogo,
        companyName,
        productName,
        showBarcode,
        humanCode,
        showSku,
        price,
        batchNumber,
        expiryDate,
        qrCode,
        border,
    };

    const totalSelectedProducts = updateProducts?.length || 0;
    const totalLabelsCount = updateProducts?.reduce((acc, curr) => acc + (parseInt(curr.quantity, 10) || 0), 0) || 0;
    const labelsPerSheet = printBarcodeValue.paperSizeValue?.value || 40;
    const totalSheetsCount = totalLabelsCount > 0 ? Math.ceil(totalLabelsCount / labelsPerSheet) : 0;

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title={placeholderText('print.barcode.title')} />

            {updateProducts && updateProducts.length > 0 && (
                <div className='d-none'>
                    <button id='printReceipt' onClick={handlePrint}>Print this out!</button>
                    <PrintButton
                        ref={componentRef}
                        frontSetting={frontSetting}
                        allConfigData={allConfigData}
                        barcodeOptions={barcodeOptions}
                        updateProducts={print && print.products ? print : { products: updateProducts, paperSize: printBarcodeValue.paperSizeValue }}
                    />
                </div>
            )}

            {isLoadingSkeleton ? (
                <BarcodeSkeleton />
            ) : (
                <div className="sale-create-page">
                    <div className="brand-breadcrumb">
                        <Link to="/app/dashboard" style={{ color: '#64748B', textDecoration: 'none' }}>Dashboard</Link>
                        <span>&gt;</span>
                        <Link to="/app/products" style={{ color: '#64748B', textDecoration: 'none' }}>Products</Link>
                        <span>&gt;</span>
                        <span className="brand-crumb-active">Print Barcode</span>
                    </div>

                    <div className="create-fullpage-container">
                        <div className="create-form-header">
                            <div className="d-flex align-items-center gap-3">
                                <Link to="/app/products" className="brand-btn-pill">
                                    <FontAwesomeIcon icon={faArrowLeft} /> Back to Products
                                </Link>
                                <div>
                                    <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', margin: 0, lineHeight: '1.2' }}>
                                        Print Barcode Labels
                                    </h2>
                                    <p style={{ fontSize: '13.5px', color: '#64748B', margin: '2px 0 0 0' }}>
                                        Generate, customize, and print high-resolution barcode labels for your inventory
                                    </p>
                                </div>
                            </div>

                            <div className="d-flex align-items-center gap-2">
                                <button
                                    type="button"
                                    className="brand-btn-pill"
                                    onClick={onResetClick}
                                >
                                    <FontAwesomeIcon icon={faRotateLeft} /> Reset
                                </button>
                                <button
                                    type="button"
                                    className="brand-btn-pill"
                                    onClick={(e) => printPaymentReceiptPdf(e)}
                                >
                                    <FontAwesomeIcon icon={faFilePdf} /> Export PDF
                                </button>
                                <button
                                    type="button"
                                    className="brand-btn-pill brand-btn-primary"
                                    onClick={(e) => printPaymentReceiptPdf(e)}
                                >
                                    <FontAwesomeIcon icon={faPrint} /> Print Barcode Labels ({totalLabelsCount})
                                </button>
                            </div>
                        </div>

                        <div className="create-form-body">
                            <div className="create-card-section">
                                <div className="create-section-header justify-content-between flex-wrap gap-2">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="create-section-icon green">
                                            <FontAwesomeIcon icon={faBarcode} />
                                        </div>
                                        <div className="create-section-title">
                                            <h3>Configuration &amp; Products</h3>
                                            <p>Select target warehouse, label paper sheet format, and add products</p>
                                        </div>
                                    </div>

                                    <div className="d-flex align-items-center gap-2">
                                        <span className="badge px-3 py-2" style={{ background: '#DCFCE7', color: '#15803D', fontSize: '12px', fontWeight: '700', borderRadius: '999px' }}>
                                            {totalSelectedProducts} Products Selected
                                        </span>
                                        <span className="badge px-3 py-2" style={{ background: '#F1F5F9', color: '#475569', fontSize: '12px', fontWeight: '700', borderRadius: '999px' }}>
                                            Total: {totalLabelsCount} Labels
                                        </span>
                                    </div>
                                </div>

                                <div className="row g-4 mb-4 align-items-end">
                                    <div className="col-12 col-md-4">
                                        <label className="form-label" style={{ fontWeight: '700', fontSize: '13.5px', color: '#0F172A' }}>
                                            Warehouse <span className="text-danger">*</span>
                                        </label>
                                        <ReactSelect
                                            name='warehouse_id'
                                            data={warehouses || []}
                                            onChange={onWarehouseChange}
                                            title=""
                                            isRequired={true}
                                            errors={errors['warehouse_id']}
                                            defaultValue={printBarcodeValue.warehouse_id}
                                            value={printBarcodeValue.warehouse_id}
                                            placeholder="Select Warehouse"
                                        />
                                    </div>

                                    <div className="col-12 col-md-4">
                                        <label className="form-label" style={{ fontWeight: '700', fontSize: '13.5px', color: '#0F172A' }}>
                                            Paper Format <span className="text-danger">*</span>
                                        </label>
                                        <ReactSelect
                                            name='paperSizeValue'
                                            data={paperSizeOptions}
                                            onChange={onPaperSizeChange}
                                            title=""
                                            isRequired={true}
                                            errors={errors['paperSizeValue']}
                                            defaultValue={printBarcodeValue.paperSizeValue}
                                            value={printBarcodeValue.paperSizeValue}
                                            placeholder="Select Paper Format"
                                        />
                                    </div>

                                    <div className="col-12 col-md-4">
                                        <div className="p-2.5 bg-light rounded-4 border d-flex align-items-center justify-content-between flex-wrap gap-1" style={{ minHeight: '48px' }}>
                                            <span style={{ fontWeight: '700', fontSize: '12px', color: '#475569' }}>Apply Qty to All:</span>
                                            <div className="d-flex align-items-center gap-1">
                                                {['1', '5', '10', '25', '50', '100'].map((preset) => (
                                                    <button
                                                        key={preset}
                                                        type="button"
                                                        className={'btn btn-sm ' + (activePreset === preset ? 'btn-success text-white' : 'btn-white bg-white border') + ' fw-bold'}
                                                        style={{
                                                            height: '28px',
                                                            padding: '0 8px',
                                                            fontSize: '11px',
                                                            borderRadius: '8px',
                                                            background: activePreset === preset ? '#16A34A' : '#FFFFFF',
                                                            borderColor: activePreset === preset ? '#16A34A' : '#E2E8F0'
                                                        }}
                                                        onClick={() => handleApplyPresetQty(preset)}
                                                    >
                                                        {preset}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="form-label" style={{ fontWeight: '700', fontSize: '13.5px', color: '#0F172A' }}>
                                        Search Products
                                    </label>
                                    <div className="create-search-wrap">
                                        <FontAwesomeIcon
                                            icon={faSearch}
                                            className="create-search-icon"
                                        />
                                        <input
                                            type="text"
                                            className="form-control create-search-input"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            placeholder="Search by SKU, Barcode, Brand, or Product Name..."
                                        />
                                        {searchQuery && (
                                            <button
                                                type="button"
                                                onClick={() => setSearchQuery('')}
                                                className="create-search-clear"
                                            >
                                                <FontAwesomeIcon icon={faTimes} />
                                            </button>
                                        )}
                                    </div>

                                    {!hasWarehouse && searchQuery && (
                                        <div className="d-flex align-items-center gap-2 mt-3 p-3 rounded-3" style={{ background: '#FEF3C7', border: '1px solid #FCD34D' }}>
                                            <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#D97706' }} />
                                            <span style={{ fontSize: '13px', fontWeight: '600', color: '#92400E' }}>
                                                Please select a <strong>Warehouse</strong> first to search products.
                                            </span>
                                        </div>
                                    )}

                                    {searchQuery && hasWarehouse && (
                                        <div className="mt-3" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                                            {displayProducts.length === 0 ? (
                                                <div className="text-center py-4" style={{ color: '#94A3B8' }}>
                                                    <FontAwesomeIcon icon={faSearch} style={{ fontSize: '24px', marginBottom: '8px', display: 'block', margin: '0 auto 8px' }} />
                                                    <div style={{ fontSize: '13.5px', fontWeight: '600' }}>No products found for <strong>"{searchQuery}"</strong></div>
                                                    <div style={{ fontSize: '12px', marginTop: '4px' }}>Try a different name, SKU, or barcode.</div>
                                                </div>
                                            ) : displayProducts.map(prod => {
                                                const a = prod.attributes || prod;
                                                const availQty = Number(a.stock ? (typeof a.stock === 'object' ? a.stock.quantity : a.stock) : (a.available_qty || a.quantity || 0));
                                                const imgUrl = extractImageUrl(a);
                                                return (
                                                    <div
                                                        key={prod.id}
                                                        className="d-flex align-items-center justify-content-between p-3 border mt-2"
                                                        style={{ background: '#FAFAFA', borderRadius: '14px', gap: '12px', border: '1px solid #E2E8F0 !important' }}
                                                    >
                                                        <div className="d-flex align-items-center gap-3">
                                                            {imgUrl ? (
                                                                <img
                                                                    src={imgUrl}
                                                                    alt=""
                                                                    style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
                                                                    onError={e => { e.target.style.display = 'none'; }}
                                                                />
                                                            ) : (
                                                                <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                    <FontAwesomeIcon icon={faBoxesStacked} style={{ color: '#94A3B8', fontSize: '18px' }} />
                                                                </div>
                                                            )}
                                                            <div>
                                                                <div style={{ fontWeight: '800', fontSize: '14px', color: '#0F172A' }}>{a.name}</div>
                                                                <div style={{ fontSize: '12px', color: '#64748B' }}>
                                                                    SKU: <strong>{a.code || '—'}</strong> &bull; Stock: <strong className={availQty > 0 ? 'text-success' : 'text-danger'}>{availQty} Units</strong>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => addProductToBarcode(prod)}
                                                            className="brand-btn-pill brand-btn-primary"
                                                            style={{ height: '38px', padding: '0 16px', fontSize: '13px' }}
                                                        >
                                                            Add <FontAwesomeIcon icon={faArrowRight} className="ms-1" />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                        <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A' }}>
                                            Selected Products ({updateProducts?.length || 0})
                                        </span>
                                        {updateProducts?.length > 0 && (
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-link text-danger p-0 text-decoration-none fw-bold"
                                                style={{ fontSize: '12px' }}
                                                onClick={() => setUpdateProducts([])}
                                            >
                                                Clear All
                                            </button>
                                        )}
                                    </div>

                                    {updateProducts && updateProducts.length > 0 ? (
                                        <div className="brand-table-wrapper" style={{ overflowX: 'auto', maxHeight: '300px', borderRadius: '16px', border: '1px solid #EEF2F7' }}>
                                            <Table responsive className="brand-table mb-0" style={{ fontSize: '13px' }}>
                                                <thead>
                                                    <tr>
                                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11.5px', fontWeight: '700', color: '#64748B', borderBottom: '1px solid #EEF2F7' }}>PRODUCT</th>
                                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11.5px', fontWeight: '700', color: '#64748B', borderBottom: '1px solid #EEF2F7' }}>SKU / CODE</th>
                                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11.5px', fontWeight: '700', color: '#64748B', borderBottom: '1px solid #EEF2F7' }}>STOCK</th>
                                                        <th style={{ padding: '12px 16px', textAlign: 'center', width: '160px', fontSize: '11.5px', fontWeight: '700', color: '#64748B', borderBottom: '1px solid #EEF2F7' }}>PRINT QUANTITY</th>
                                                        <th style={{ padding: '12px 16px', textAlign: 'right', width: '60px', fontSize: '11.5px', fontWeight: '700', color: '#64748B', borderBottom: '1px solid #EEF2F7' }}>ACTION</th>
                                                    </tr>
                                                </thead>
                                                <PrintTable
                                                    printBarcodeValue={printBarcodeValue}
                                                    updateProducts={updateProducts}
                                                    setUpdateProducts={setUpdateProducts}
                                                />
                                            </Table>
                                        </div>
                                    ) : (
                                        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px dashed #CBD5E1', padding: '36px 20px', textAlign: 'center' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', margin: '0 auto 10px auto' }}>
                                                <FontAwesomeIcon icon={faBarcode} />
                                            </div>
                                            <div style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', marginBottom: '4px' }}>
                                                No products added
                                            </div>
                                            <div style={{ fontSize: '12.5px', color: '#64748B' }}>
                                                Type in the search box above to add products to the print sheet.
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-3 bg-light rounded-4 border">
                                    <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                                        <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#0F172A' }}>Visible Label Elements</span>
                                        <span style={{ fontSize: '11.5px', color: '#64748B' }}>Customize printed fields on each barcode sticker</span>
                                    </div>
                                    <div className="d-flex align-items-center gap-4 flex-wrap" style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155' }}>
                                        <label className="d-flex align-items-center gap-1.5 cursor-pointer">
                                            <input type="checkbox" className="form-check-input mt-0" checked={companyName} onChange={(e) => setCompanyName(e.target.checked)} />
                                            <span>Company</span>
                                        </label>
                                        <label className="d-flex align-items-center gap-1.5 cursor-pointer">
                                            <input type="checkbox" className="form-check-input mt-0" checked={productName} onChange={(e) => setProductName(e.target.checked)} />
                                            <span>Name</span>
                                        </label>
                                        <label className="d-flex align-items-center gap-1.5 cursor-pointer">
                                            <input type="checkbox" className="form-check-input mt-0" checked={showBarcode} onChange={(e) => setShowBarcode(e.target.checked)} />
                                            <span>Barcode</span>
                                        </label>
                                        <label className="d-flex align-items-center gap-1.5 cursor-pointer">
                                            <input type="checkbox" className="form-check-input mt-0" checked={price} onChange={(e) => setPrice(e.target.checked)} />
                                            <span>Price</span>
                                        </label>
                                        <label className="d-flex align-items-center gap-1.5 cursor-pointer">
                                            <input type="checkbox" className="form-check-input mt-0" checked={showSku} onChange={(e) => setShowSku(e.target.checked)} />
                                            <span>SKU</span>
                                        </label>
                                        <label className="d-flex align-items-center gap-1.5 cursor-pointer">
                                            <input type="checkbox" className="form-check-input mt-0" checked={border} onChange={(e) => setBorder(e.target.checked)} />
                                            <span>Border</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="create-card-section">
                                <div className="create-section-header justify-content-between flex-wrap gap-2">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="create-section-icon blue">
                                            <FontAwesomeIcon icon={faFilePdf} />
                                        </div>
                                        <div className="create-section-title">
                                            <h3>Live Preview - Sheet ({labelsPerSheet} Labels)</h3>
                                            <p>Real-time visual layout matching your selected paper format and label stickers</p>
                                        </div>
                                    </div>

                                    <div className="d-flex align-items-center gap-2 flex-wrap">
                                        <span className="badge px-3 py-2" style={{ background: '#F1F5F9', color: '#475569', fontSize: '12px', fontWeight: '700', borderRadius: '999px' }}>
                                            Products: <strong style={{ color: '#0F172A' }}>{totalSelectedProducts}</strong>
                                        </span>
                                        <span className="badge px-3 py-2" style={{ background: '#DCFCE7', color: '#15803D', fontSize: '12px', fontWeight: '700', borderRadius: '999px' }}>
                                            Total Labels: <strong>{totalLabelsCount}</strong>
                                        </span>
                                        <span className="badge px-3 py-2" style={{ background: '#DBEAFE', color: '#2563EB', fontSize: '12px', fontWeight: '700', borderRadius: '999px' }}>
                                            Sheets: <strong>{totalSheetsCount}</strong>
                                        </span>
                                        <div className="d-flex align-items-center gap-1 ms-2">
                                            <button type="button" className="brand-btn-pill btn-sm px-2" onClick={() => setZoomLevel(Math.max(50, zoomLevel - 20))} title="Zoom Out">
                                                <FontAwesomeIcon icon={faMagnifyingGlassMinus} />
                                            </button>
                                            <span style={{ fontSize: '12px', fontWeight: '800', color: '#475569', minWidth: '40px', textAlign: 'center' }}>{zoomLevel}%</span>
                                            <button type="button" className="brand-btn-pill btn-sm px-2" onClick={() => setZoomLevel(Math.min(150, zoomLevel + 20))} title="Zoom In">
                                                <FontAwesomeIcon icon={faMagnifyingGlassPlus} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    background: '#F8FAFC',
                                    border: '1px solid #EEF2F7',
                                    borderRadius: '20px',
                                    padding: '24px',
                                    overflowY: 'auto',
                                    minHeight: '380px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'flex-start'
                                }}>
                                    {updateProducts && updateProducts.length > 0 ? (
                                        <div style={{ zoom: (zoomLevel / 100), width: '100%', maxWidth: '960px' }}>
                                            <BarcodeShow
                                                updateProducts={updateProducts}
                                                barcodeOptions={barcodeOptions}
                                                frontSetting={frontSetting}
                                                paperSize={printBarcodeValue.paperSizeValue}
                                                updated={updated}
                                                allConfigData={allConfigData}
                                                labelType={labelType}
                                            />
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '60px 20px', margin: 'auto' }}>
                                            <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px auto' }}>
                                                <FontAwesomeIcon icon={faBarcode} />
                                            </div>
                                            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>
                                                Live A4 Barcode Sheet Preview
                                            </h3>
                                            <p style={{ fontSize: '13.5px', color: '#64748B', maxWidth: '420px', margin: '0 auto', lineHeight: 1.5 }}>
                                                Select warehouse &amp; search products in the top configuration section to generate live printable barcode labels.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="d-flex align-items-center justify-content-end gap-3 pt-3">
                                <button type="button" className="brand-btn-pill" onClick={onResetClick}>
                                    <FontAwesomeIcon icon={faRotateLeft} /> Reset
                                </button>
                                <button type="button" className="brand-btn-pill" onClick={(e) => printPaymentReceiptPdf(e)}>
                                    <FontAwesomeIcon icon={faFilePdf} /> Export PDF
                                </button>
                                <button
                                    type="button"
                                    className="brand-btn-pill brand-btn-primary"
                                    onClick={(e) => printPaymentReceiptPdf(e)}
                                >
                                    <FontAwesomeIcon icon={faPrint} /> Print Barcode Labels ({totalLabelsCount})
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </MasterLayout>
    );
};

export default PrintBarcode;
