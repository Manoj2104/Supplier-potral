import React, { useState, useEffect } from 'react';
import { connect, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import moment from 'moment';
import { InputGroup, Table } from 'react-bootstrap-v5';
import { editTransfer } from '../../store/action/transfersAction';
import TransfersTable from '../../shared/components/transfers/TransfersTable';
import { prepareTransferArray } from '../../shared/prepareArray/prepareTransferArray';
import { decimalValidate, getFormattedMessage, placeholderText, onFocusInput, getFormattedOptions } from '../../shared/sharedMethod';
import { calculateCartTotalAmount, calculateCartTotalTaxAmount } from '../../shared/calculation/calculation';
import ProductSearch from '../../shared/components/product-cart/search/ProductSearch';
import { addToast } from '../../store/action/toastAction';
import { toastType, transferCreatStatusOptions } from '../../constants';
import ReactDatePicker from '../../shared/datepicker/ReactDatePicker';
import ReactSelect from '../../shared/select/reactSelect';
import { fetchProductsByWarehouse } from "../../store/action/productAction";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronRight,
    faArrowLeft,
    faArrowRight,
    faRightLeft,
    faBoxesStacked,
    faBoxOpen,
    faBarcode,
    faSearch,
    faTimes,
    faFileExcel,
    faExclamationTriangle,
    faMicrophone,
    faWarehouse,
    faArrowRightArrowLeft,
    faTrashCan,
    faBookmark,
    faEye,
    faPaperclip,
    faFileInvoice,
    faCalendarDays,
    faIndianRupeeSign,
    faClock,
    faSliders
} from '@fortawesome/free-solid-svg-icons';
import "./CreateTransferPremium.css";

const TransferForm = ( props ) => {
    const {
        addTtansferData,
        id,
        editTransfer,
        customProducts,
        singleTransfer,
        warehouses,
        fetchProductsByWarehouse,
        products,
        frontSetting,
        allConfigData,
        isEdit
    } = props;

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [ newCost, setNewCost ] = useState( '' );
    const [ newDiscount, setNewDiscount ] = useState( '' );
    const [ newTax, setNewTax ] = useState( '' );
    const [ newPurchaseUnit, setNewPurchaseUnit ] = useState( '' );
    const [ subTotal, setSubTotal ] = useState( '' );
    const [ updateProducts, setUpdateProducts ] = useState( [] );
    const [ quantity, setQuantity ] = useState( 0 );
    const [ priority, setPriority ] = useState( 'Normal' );
    const [ searchMode, setSearchMode ] = useState( 'search' );
    const [ searchQuery, setSearchQuery ] = useState( '' );

    const [ transferValue, setTransferValue ] = useState( {
        date: singleTransfer ? moment( singleTransfer.date ).toDate() : new Date(),
        from_warehouse_id: singleTransfer ? singleTransfer.from_warehouse_id : '',
        to_warehouse_id: singleTransfer ? singleTransfer.to_warehouse_id : '',
        warehouse_id: undefined,
        supplier_id: singleTransfer ? singleTransfer.supplier_id : '',
        tax_rate: singleTransfer && singleTransfer.tax_rate ? singleTransfer.tax_rate.toFixed( 2 ) : '0.00',
        tax_amount: singleTransfer && singleTransfer.tax_amount ? singleTransfer.tax_amount.toFixed( 2 ) : '0.00',
        discount: singleTransfer && singleTransfer.discount ? singleTransfer.discount.toFixed( 2 ) : '0.00',
        shipping: singleTransfer && singleTransfer.shipping ? singleTransfer.shipping.toFixed( 2 ) : '0.00',
        grand_total: singleTransfer ? singleTransfer.grand_total : '0.00',
        notes: singleTransfer ? singleTransfer.notes : '',
        status_id: singleTransfer ? singleTransfer.status_id : {
            label: getFormattedMessage( "status.filter.complated.label" ),
            value: 1
        },
    } );

    const [ errors, setErrors ] = useState( {
        date: '',
        from_warehouse_id: '',
        to_warehouse_id: '',
        supplier_id: '',
        details: '',
        tax_rate: '',
        discount: '',
        shipping: '',
        status_id: ''
    } );

    useEffect( () => {
        setUpdateProducts( updateProducts );
    }, [ updateProducts, quantity, newCost, newDiscount, newTax, subTotal, newPurchaseUnit ] );

    useEffect( () => {
        if ( singleTransfer && singleTransfer.transfer_items ) {
            setUpdateProducts( singleTransfer.transfer_items );
        }
    }, [ singleTransfer ] );

    useEffect( () => {
        updateProducts.length >= 1 ? dispatch( { type: 'DISABLE_OPTION', payload: true } ) : dispatch( { type: 'DISABLE_OPTION', payload: false } );
    }, [ singleTransfer ] );

    useEffect( () => {
        if ( !singleTransfer && warehouses && warehouses.length > 0 ) {
            if ( !transferValue.from_warehouse_id ) {
                const firstWh = warehouses[0];
                const whObj = firstWh.value !== undefined ? firstWh : { label: firstWh.attributes?.name || firstWh.name, value: firstWh.id };
                setTransferValue( prev => ( { ...prev, from_warehouse_id: whObj, warehouse_id: whObj } ) );
                fetchProductsByWarehouse( whObj.value || firstWh.id );
            }
            if ( !transferValue.to_warehouse_id && warehouses.length > 1 ) {
                const secondWh = warehouses[1];
                const toWhObj = secondWh.value !== undefined ? secondWh : { label: secondWh.attributes?.name || secondWh.name, value: secondWh.id };
                setTransferValue( prev => ( { ...prev, to_warehouse_id: toWhObj } ) );
            }
        }
    }, [ warehouses ] );

    useEffect( () => {
        if ( transferValue.from_warehouse_id && transferValue.from_warehouse_id.value ) {
            fetchProductsByWarehouse( transferValue.from_warehouse_id.value );
            setTransferValue( inputs => ( { ...inputs, warehouse_id: transferValue.from_warehouse_id } ) );
        }
    }, [ transferValue.from_warehouse_id ] );

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
    const hasWarehouse = !!(transferValue.from_warehouse_id?.value || transferValue.from_warehouse_id?.id || transferValue.from_warehouse_id);
    const filteredProducts = (searchQuery && hasWarehouse)
        ? safeProducts.filter(p => {
              const a = p.attributes || p;
              const nameMatch = (a.name || '').toLowerCase().includes(searchQuery.toLowerCase());
              const codeMatch = (a.code || '').toLowerCase().includes(searchQuery.toLowerCase());
              const barcodeMatch = (a.barcode || '').toLowerCase().includes(searchQuery.toLowerCase());
              return nameMatch || codeMatch || barcodeMatch;
          }).slice(0, 8)
        : [];

    const displayProducts = filteredProducts;

    const addProductToTransfer = (prod) => {
        const a = prod.attributes || prod;
        const targetId = prod.id;
        const cost = Number(a.product_cost !== undefined ? a.product_cost : (a.cost !== undefined ? a.cost : (a.net_unit_cost || a.product_price || 0)));
        const stockQty = Number(a.stock?.quantity || a.available_qty || a.quantity || 0);

        const existing = updateProducts.find(p => (p.product_id || p.id) === targetId);
        if (existing) {
            setUpdateProducts(prev => prev.map(p => {
                if ((p.product_id || p.id) === targetId) {
                    const nextQty = (p.quantity || 1) + 1;
                    return {
                        ...p,
                        quantity: nextQty,
                        sub_total: nextQty * (p.net_unit_cost || cost),
                    };
                }
                return p;
            }));
            dispatch(addToast({ text: `Increased quantity for ${a.name}!`, type: toastType.SUCCESS }));
        } else {
            const newItem = {
                id: targetId,
                product_id: targetId,
                name: a.name,
                code: a.code || '—',
                barcode: a.barcode || a.code || '—',
                net_unit_cost: cost,
                product_cost: cost,
                fix_net_unit: cost,
                quantity: 1,
                tax_type: 1,
                tax_value: 0.00,
                tax_amount: 0.00,
                discount_type: '2',
                discount_value: 0.00,
                discount_amount: 0.00,
                sub_total: cost,
                purchase_unit: a.purchase_unit || 1,
                product_unit: a.product_unit || 1,
                stock: stockQty,
                short_name: a.purchase_unit_name?.short_name || a.product_unit_name?.short_name || 'pc',
                image: extractImageUrl(a),
                newItem: "",
            };
            setUpdateProducts(prev => [newItem, ...prev]);
            dispatch(addToast({ text: `${a.name} added to transfer list!`, type: toastType.SUCCESS }));
        }
        setSearchQuery('');
    };

    const handleValidation = () => {
        let errorss = {};
        let isValid = false;
        const qtyCart = updateProducts.filter( ( a ) => a.quantity === 0 );

        if ( !transferValue.date ) {
            errorss[ 'date' ] = getFormattedMessage( 'globally.date.validate.label' );
        } else if ( !transferValue.from_warehouse_id ) {
            errorss[ 'from_warehouse_id' ] = getFormattedMessage( 'purchase.select.warehouse.validate.label' );
        } else if ( !transferValue.to_warehouse_id ) {
            errorss[ 'to_warehouse_id' ] = getFormattedMessage( 'purchase.select.warehouse.validate.label' );
        } else if ( transferValue.from_warehouse_id.value === transferValue.to_warehouse_id.value ) {
            errorss[ 'to_warehouse_id' ] = getFormattedMessage( "transfer.select.warehouse.validate.message" );
        } else if ( qtyCart.length > 0 ) {
            dispatch( addToast( {
                text: getFormattedMessage( 'globally.product-quantity.validate.message' ),
                type: toastType.ERROR
            } ) );
        } else if ( updateProducts.length < 1 ) {
            dispatch( addToast( {
                text: getFormattedMessage( 'purchase.product-list.validate.message' ),
                type: toastType.ERROR
            } ) );
        } else if ( !transferValue.status_id ) {
            errorss[ 'status_id' ] = getFormattedMessage( 'globally.status.validate.label' );
        } else {
            isValid = true;
        }
        setErrors( errorss );
        return isValid;
    };

    const onWarehouseChangeOne = ( obj ) => {
        setTransferValue( inputs => ( { ...inputs, from_warehouse_id: obj } ) );
        setErrors( '' );
    };

    const onWarehouseChangeTow = ( obj ) => {
        setTransferValue( inputs => ( { ...inputs, to_warehouse_id: obj } ) );
        setErrors( '' );
    };

    const handleSwapWarehouses = () => {
        const temp = transferValue.from_warehouse_id;
        setTransferValue( inputs => ( {
            ...inputs,
            from_warehouse_id: inputs.to_warehouse_id,
            to_warehouse_id: temp
        } ) );
    };

    const onStatusChange = ( obj ) => {
        setTransferValue( inputs => ( { ...inputs, status_id: obj } ) );
    };

    const updateCost = ( item ) => setNewCost( item );
    const updateDiscount = ( item ) => setNewDiscount( item );
    const updateTax = ( item ) => setNewTax( item );
    const updatedQty = ( qty ) => setQuantity( qty );
    const updateSubTotal = ( item ) => setSubTotal( item );
    const updatePurchaseUnit = ( item ) => setNewPurchaseUnit( item );

    const onChangeInput = ( e ) => {
        e.preventDefault();
        const { value } = e.target;
        if ( value.match( /\./g ) ) {
            const [ , decimal ] = value.split( '.' );
            if ( decimal?.length > 2 ) return;
        }
        setTransferValue( inputs => ( { ...inputs, [ e.target.name ]: value && value } ) );
    };

    const onNotesChangeInput = ( e ) => {
        e.preventDefault();
        setTransferValue( inputs => ( { ...inputs, notes: e.target.value } ) );
    };

    const handleCallback = ( date ) => {
        setTransferValue( previousState => ({ ...previousState, date: date }) );
        setErrors( '' );
    };

    const transferStatusFilterOptions = getFormattedOptions( transferCreatStatusOptions );

    const prepareData = ( prepareData ) => {
        const formValue = {
            from_warehouse_id: prepareData.from_warehouse_id.value ? prepareData.from_warehouse_id.value : prepareData.from_warehouse_id,
            to_warehouse_id: prepareData.to_warehouse_id.value ? prepareData.to_warehouse_id.value : prepareData.to_warehouse_id,
            date: moment( prepareData.date ).toDate(),
            transfer_items: updateProducts,
            note: prepareData.notes,
            discount: prepareData.discount,
            tax_rate: prepareData.tax_rate,
            tax_amount: calculateCartTotalTaxAmount( updateProducts, transferValue ),
            shipping: prepareData.shipping,
            grand_total: calculateCartTotalAmount( updateProducts, transferValue ),
            received_amount: 0,
            paid_amount: 0,
            status: prepareData.status_id.value ? prepareData.status_id.value : prepareData.status_id,
        };
        return formValue;
    };

    const onSubmit = ( event ) => {
        event.preventDefault();
        const valid = handleValidation();
        if ( valid ) {
            if ( singleTransfer ) {
                editTransfer( id, prepareData( transferValue ), navigate );
            } else {
                addTtansferData( prepareData( transferValue ) );
                setTransferValue( transferValue );
            }
        }
    };

    const onBlurInput = ( el ) => {
        if ( el.target.value === '' ) {
            if ( el.target.name === 'shipping' ) setTransferValue( { ...transferValue, shipping: '0.00' } );
            if ( el.target.name === 'discount' ) setTransferValue( { ...transferValue, discount: '0.00' } );
            if ( el.target.name === 'tax_rate' ) setTransferValue( { ...transferValue, tax_rate: '0.00' } );
        }
    };

    const currencySymbol = (frontSetting && frontSetting.value && frontSetting.value.currency_symbol) || '₹';
    const rawSubTotal = calculateCartTotalAmount(updateProducts, transferValue);
    const calculatedSubTotal = Number(rawSubTotal || 0);

    const totalQtyCount = updateProducts.reduce((sum, p) => sum + Number(p.quantity || 1), 0);

    const fromWarehouseLabel = transferValue.from_warehouse_id?.label || 'Main Warehouse';
    const toWarehouseLabel = transferValue.to_warehouse_id?.label || 'Select Warehouse';

    return (
        <div className="trf-create-page">
            {/* ─── Breadcrumb ───────────────────────────────────────── */}
            <div className="trf-breadcrumb">
                <span>Dashboard</span>
                <span className="sep"><FontAwesomeIcon icon={faChevronRight} /></span>
                <span>Inventory</span>
                <span className="sep"><FontAwesomeIcon icon={faChevronRight} /></span>
                <Link to="/app/transfers" className="text-decoration-none text-muted">Transfers</Link>
                <span className="sep"><FontAwesomeIcon icon={faChevronRight} /></span>
                <span className="text-dark fw-bold">{singleTransfer ? 'Edit Transfer' : 'Create Transfer'}</span>
            </div>

            {/* ─── Page Header ──────────────────────────────────────── */}
            <div className="trf-header">
                <div>
                    <h1 className="trf-header-title">{singleTransfer ? 'Edit Transfer' : 'Create Transfer'}</h1>
                    <p className="trf-header-subtitle">
                        Transfer inventory between warehouses with real-time stock validation and inventory tracking.
                    </p>
                </div>
                <div>
                    <button
                        type="button"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', height: '42px', padding: '0 20px', borderRadius: '999px', border: '1px solid #16A34A', background: '#FFFFFF', color: '#16A34A', fontSize: '13.5px', fontWeight: '700', cursor: 'pointer' }}
                        onClick={() => navigate('/app/transfers')}
                    >
                        <FontAwesomeIcon icon={faArrowLeft} /> Back
                    </button>
                </div>
            </div>

            {/* ─── 4 Top KPI Cards ──────────────────────────────────── */}
            <div className="trf-kpi-grid">
                <div className="trf-kpi-card">
                    <div className="trf-kpi-top">
                        <span className="trf-kpi-title">Transfer Reference</span>
                        <div className="trf-kpi-icon-box green">
                            <FontAwesomeIcon icon={faFileInvoice} />
                        </div>
                    </div>
                    <div className="trf-kpi-value" style={{ fontSize: '20px' }}>TRF-000123</div>
                    <div className="trf-kpi-sub">Auto Generated</div>
                </div>

                <div className="trf-kpi-card">
                    <div className="trf-kpi-top">
                        <span className="trf-kpi-title">Products Selected</span>
                        <div className="trf-kpi-icon-box blue">
                            <FontAwesomeIcon icon={faBoxesStacked} />
                        </div>
                    </div>
                    <div className="trf-kpi-value">{updateProducts.length}</div>
                    <div className="trf-kpi-sub">{totalQtyCount} Total Quantity</div>
                </div>

                <div className="trf-kpi-card">
                    <div className="trf-kpi-top">
                        <span className="trf-kpi-title">Estimated Value</span>
                        <div className="trf-kpi-icon-box purple">
                            <FontAwesomeIcon icon={faIndianRupeeSign} />
                        </div>
                    </div>
                    <div className="trf-kpi-value">{currencySymbol} {calculatedSubTotal.toFixed(2)}</div>
                    <div className="trf-kpi-sub">Includes all taxes</div>
                </div>

                <div className="trf-kpi-card">
                    <div className="trf-kpi-top">
                        <span className="trf-kpi-title">Transfer Status</span>
                        <div className="trf-kpi-icon-box orange">
                            <FontAwesomeIcon icon={faClock} />
                        </div>
                    </div>
                    <div className="trf-kpi-value" style={{ fontSize: '18px', color: '#D97706' }}>
                        {transferValue.status_id?.label || 'Draft'}
                    </div>
                    <div className="trf-kpi-sub">Not processed yet</div>
                </div>
            </div>

            {/* ─── Main 2-Column Responsive Workspace ───────────────── */}
            <form onSubmit={onSubmit}>
                <div className="trf-main-layout">

                    {/* LEFT PANEL (72%) */}
                    <div className="trf-left-panel">

                        {/* SECTION 1: TRANSFER INFORMATION */}
                        <div className="trf-card">
                            <div className="trf-card-header">
                                <span className="trf-section-badge">1</span>
                                <h3 className="trf-card-title">Transfer Information</h3>
                            </div>

                            <div className="row g-4">
                                <div className="col-md-3">
                                    <label className="form-label" style={{ fontWeight: '600', fontSize: '13px' }}>
                                        Transfer Date <span className="text-danger">*</span>
                                    </label>
                                    <ReactDatePicker onChangeDate={handleCallback} newStartDate={transferValue.date} />
                                    <span className="text-danger d-block fs-small mt-1">{errors['date']}</span>
                                </div>

                                <div className="col-md-3">
                                    <ReactSelect
                                        data={warehouses}
                                        onChange={onWarehouseChangeOne}
                                        defaultValue={transferValue.from_warehouse_id}
                                        addSearchItems={singleTransfer}
                                        isWarehouseDisable={true}
                                        title={getFormattedMessage('transfer.from-warehouse.title')}
                                        errors={errors['from_warehouse_id']}
                                        placeholder={placeholderText('purchase.select.warehouse.placeholder.label')}
                                    />
                                </div>

                                <div className="col-md-1 d-flex align-items-center justify-content-center">
                                    <button
                                        type="button"
                                        className="trf-swap-btn"
                                        title="Swap Warehouses"
                                        onClick={handleSwapWarehouses}
                                    >
                                        <FontAwesomeIcon icon={faArrowRightArrowLeft} />
                                    </button>
                                </div>

                                <div className="col-md-3">
                                    <ReactSelect
                                        data={warehouses}
                                        onChange={onWarehouseChangeTow}
                                        defaultValue={transferValue.to_warehouse_id}
                                        addSearchItems={singleTransfer}
                                        isWarehouseDisable={true}
                                        title={getFormattedMessage('transfer.to-warehouse.title')}
                                        errors={errors['to_warehouse_id']}
                                        placeholder={placeholderText('purchase.select.warehouse.placeholder.label')}
                                    />
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label" style={{ fontWeight: '600', fontSize: '13px' }}>Reference No.</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        readOnly={true}
                                        value="TRF-000123"
                                        style={{ height: '42px', borderRadius: '12px', background: '#F8FAFC', fontWeight: '700' }}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <ReactSelect
                                        multiLanguageOption={transferStatusFilterOptions}
                                        name="status"
                                        onChange={onStatusChange}
                                        title={getFormattedMessage('purchase.select.status.label')}
                                        defaultValue={transferValue.status_id}
                                        errors={errors['status_id']}
                                        placeholder={placeholderText('purchase.select.status.placeholder.label')}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2: WAREHOUSE COMPARISON INFORMATION */}
                        <div className="trf-card">
                            <div className="trf-card-header">
                                <span className="trf-section-badge">2</span>
                                <h3 className="trf-card-title">Warehouse Information</h3>
                            </div>

                            <div className="trf-wh-grid">
                                {/* FROM WAREHOUSE GLASS CARD */}
                                <div className="trf-wh-card">
                                    <div className="trf-wh-card-header">
                                        <div className="trf-wh-icon">
                                            <FontAwesomeIcon icon={faWarehouse} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#16A34A', textTransform: 'uppercase' }}>From Warehouse</div>
                                            <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>{fromWarehouseLabel}</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '12px' }}>
                                        <div>
                                            <span style={{ color: '#94A3B8' }}>Location:</span>
                                            <div style={{ fontWeight: '700', color: '#0F172A' }}>Mumbai, Maharashtra</div>
                                        </div>
                                        <div>
                                            <span style={{ color: '#94A3B8' }}>Manager:</span>
                                            <div style={{ fontWeight: '700', color: '#0F172A' }}>Rajesh Kumar</div>
                                        </div>
                                        <div>
                                            <span style={{ color: '#94A3B8' }}>Current Stock:</span>
                                            <div style={{ fontWeight: '700', color: '#16A34A' }}>1,24,350 items</div>
                                        </div>
                                        <div>
                                            <span style={{ color: '#94A3B8' }}>Capacity:</span>
                                            <div style={{ fontWeight: '700', color: '#0F172A' }}>70% (7000 / 10000)</div>
                                        </div>
                                    </div>
                                </div>

                                {/* TO WAREHOUSE GLASS CARD */}
                                <div className="trf-wh-card">
                                    <div className="trf-wh-card-header">
                                        <div className="trf-wh-icon" style={{ background: '#DBEAFE', color: '#2563EB' }}>
                                            <FontAwesomeIcon icon={faWarehouse} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#2563EB', textTransform: 'uppercase' }}>To Warehouse</div>
                                            <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>{toWarehouseLabel}</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '12px' }}>
                                        <div>
                                            <span style={{ color: '#94A3B8' }}>Location:</span>
                                            <div style={{ fontWeight: '700', color: '#0F172A' }}>Ahmedabad, Gujarat</div>
                                        </div>
                                        <div>
                                            <span style={{ color: '#94A3B8' }}>Manager:</span>
                                            <div style={{ fontWeight: '700', color: '#0F172A' }}>Vikram Patel</div>
                                        </div>
                                        <div>
                                            <span style={{ color: '#94A3B8' }}>Available Capacity:</span>
                                            <div style={{ fontWeight: '700', color: '#2563EB' }}>65% (6500 / 10000)</div>
                                        </div>
                                        <div>
                                            <span style={{ color: '#94A3B8' }}>Status:</span>
                                            <div style={{ fontWeight: '700', color: '#16A34A' }}>Receiving Ready</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 3: SEARCH & ADD PRODUCTS */}
                        <div className="trf-card">
                            <div className="trf-card-header">
                                <span className="trf-section-badge">3</span>
                                <h3 className="trf-card-title">Search & Add Products</h3>
                            </div>

                            {/* Mode Pills */}
                            <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
                                {[
                                    { id: 'search', label: 'Search Product', icon: faSearch },
                                    { id: 'scan',   label: 'Scan Barcode',   icon: faBarcode },
                                    { id: 'excel',  label: 'Import Excel',   icon: faFileExcel }
                                ].map(m => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        className={`brand-btn-pill ${searchMode === m.id ? 'brand-btn-primary' : ''}`}
                                        style={{ height: '38px', fontSize: '13px', padding: '0 18px' }}
                                        onClick={() => setSearchMode(m.id)}
                                    >
                                        <FontAwesomeIcon icon={m.icon} /> {m.label}
                                    </button>
                                ))}
                            </div>

                            {/* Search Input Bar */}
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
                                        Please select <strong>From Warehouse</strong> first to search products.
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
                                        const availQty = Number(a.stock?.quantity || a.available_qty || a.quantity || 0);
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
                                                    onClick={() => addProductToTransfer(prod)}
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

                        {/* SECTION 4: TRANSFER PRODUCTS TABLE */}
                        <div className="trf-card">
                            <div className="trf-card-header">
                                <span className="trf-section-badge">4</span>
                                <h3 className="trf-card-title">Transfer Products</h3>
                            </div>

                            {updateProducts.length === 0 ? (
                                <div className="trf-empty-state">
                                    <div className="trf-empty-icon">
                                        <FontAwesomeIcon icon={faBoxOpen} />
                                    </div>
                                    <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '6px' }}>No products added yet</h4>
                                    <p style={{ fontSize: '13.5px', color: '#64748B', maxWidth: '360px', margin: '0 auto 20px auto' }}>
                                        Search and add products to create a warehouse transfer.
                                    </p>
                                </div>
                            ) : (
                                <div className="custom-responsive">
                                    <Table responsive className="align-middle">
                                        <thead>
                                            <tr>
                                                <th>{getFormattedMessage('dashboard.stockAlert.product.label')}</th>
                                                <th>{getFormattedMessage('purchase.order-item.table.net-unit-cost.column.label')}</th>
                                                <th>{getFormattedMessage('purchase.order-item.table.stock.column.label')}</th>
                                                <th className="text-center">{getFormattedMessage('purchase.order-item.table.qty.column.label')}</th>
                                                <th>{getFormattedMessage('purchase.order-item.table.discount.column.label')}</th>
                                                <th>{getFormattedMessage('purchase.order-item.table.tax.column.label')}</th>
                                                <th>{getFormattedMessage('purchase.order-item.table.sub-total.column.label')}</th>
                                                <th>{getFormattedMessage('react-data-table.action.column.label')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {updateProducts.map((singleProduct, index) => (
                                                <TransfersTable
                                                    key={index}
                                                    singleProduct={singleProduct}
                                                    index={index}
                                                    updateQty={updatedQty}
                                                    updateCost={updateCost}
                                                    updateDiscount={updateDiscount}
                                                    updateProducts={updateProducts}
                                                    updateSubTotal={updateSubTotal}
                                                    frontSetting={frontSetting}
                                                    setUpdateProducts={setUpdateProducts}
                                                    updateTax={updateTax}
                                                    updatePurchaseUnit={updatePurchaseUnit}
                                                    transferItem={singleTransfer && singleTransfer.purchase_items}
                                                />
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            )}

                            {/* Taxes & Shipping Controls */}
                            {updateProducts.length > 0 && (
                                <div className="row g-3 mt-4 pt-3 border-top">
                                    <div className="col-md-4">
                                        <label className="form-label">Order Tax (%)</label>
                                        <InputGroup>
                                            <input
                                                className="form-control"
                                                type="text"
                                                name="tax_rate"
                                                value={transferValue.tax_rate}
                                                onBlur={(event) => onBlurInput(event)}
                                                onFocus={(event) => onFocusInput(event)}
                                                onKeyPress={(event) => decimalValidate(event)}
                                                onChange={(e) => onChangeInput(e)}
                                            />
                                            <InputGroup.Text>%</InputGroup.Text>
                                        </InputGroup>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Discount</label>
                                        <InputGroup>
                                            <input
                                                className="form-control"
                                                type="text"
                                                name="discount"
                                                value={transferValue.discount}
                                                onBlur={(event) => onBlurInput(event)}
                                                onFocus={(event) => onFocusInput(event)}
                                                onKeyPress={(event) => decimalValidate(event)}
                                                onChange={(e) => onChangeInput(e)}
                                            />
                                            <InputGroup.Text>{currencySymbol}</InputGroup.Text>
                                        </InputGroup>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Shipping</label>
                                        <InputGroup>
                                            <input
                                                className="form-control"
                                                type="text"
                                                name="shipping"
                                                value={transferValue.shipping}
                                                onBlur={(event) => onBlurInput(event)}
                                                onFocus={(event) => onFocusInput(event)}
                                                onKeyPress={(event) => decimalValidate(event)}
                                                onChange={(e) => onChangeInput(e)}
                                            />
                                            <InputGroup.Text>{currencySymbol}</InputGroup.Text>
                                        </InputGroup>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* RIGHT SIDEBAR PANEL (28% / 320px) */}
                    <div className="trf-sidebar">

                        {/* CARD 1: TRANSFER SUMMARY */}
                        <div className="trf-summary-card">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <span style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>Transfer Summary</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: '#475569' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span>Total Products</span>
                                    <span style={{ fontWeight: '700', color: '#0F172A' }}>{updateProducts.length}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span>Total Quantity</span>
                                    <span style={{ fontWeight: '700', color: '#0F172A' }}>{totalQtyCount}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span>Estimated Value</span>
                                    <span style={{ fontWeight: '700', color: '#16A34A' }}>{currencySymbol} {calculatedSubTotal.toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span>Transfer Tax</span>
                                    <span style={{ fontWeight: '700', color: '#0F172A' }}>{currencySymbol} 0.00</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span>Shipping Cost</span>
                                    <span style={{ fontWeight: '700', color: '#0F172A' }}>{currencySymbol} {parseFloat(transferValue.shipping || 0).toFixed(2)}</span>
                                </div>

                                <div className="trf-grand-total-box">
                                    <span className="trf-grand-label">Grand Total</span>
                                    <span className="trf-grand-value">{currencySymbol} {calculatedSubTotal.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* CARD 2: TRANSFER DETAILS & PRIORITY */}
                        <div className="trf-summary-card">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                                <span style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>Transfer Details</span>
                            </div>

                            <div style={{ marginBottom: '14px' }}>
                                <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>Transfer Reason</label>
                                <select className="form-select" style={{ borderRadius: '12px', background: '#F8FAFC', fontSize: '13px' }}>
                                    <option value="">Select Reason</option>
                                    <option value="stock_rebalance">Stock Rebalancing</option>
                                    <option value="store_demand">Store Demand Increase</option>
                                    <option value="warehouse_relocation">Warehouse Relocation</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '14px' }}>
                                <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>Priority</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                                    {['Normal', 'Medium', 'High', 'Urgent'].map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            style={{ height: '32px', borderRadius: '8px', border: priority === p ? 'none' : '1px solid #E2E8F0', background: priority === p ? (p === 'Urgent' ? '#DC2626' : p === 'High' ? '#D97706' : p === 'Medium' ? '#2563EB' : '#16A34A') : '#F8FAFC', color: priority === p ? '#FFFFFF' : '#475569', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                                            onClick={() => setPriority(p)}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>Internal Notes</label>
                                <textarea
                                    name="notes"
                                    className="form-control"
                                    rows={3}
                                    onChange={onNotesChangeInput}
                                    value={transferValue.notes}
                                    placeholder="Add internal notes..."
                                    style={{ borderRadius: '12px', background: '#F8FAFC', fontSize: '13px' }}
                                />
                                <div className="text-end text-muted fs-small mt-1">{(transferValue.notes || '').length} / 300</div>
                            </div>
                        </div>

                        {/* CARD 3: ATTACHMENTS */}
                        <div className="trf-summary-card">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                                <span style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>Attachments</span>
                            </div>
                            <div style={{ border: '2px dashed #CBD5E1', borderRadius: '16px', padding: '20px', textAlign: 'center', background: '#F8FAFC' }}>
                                <FontAwesomeIcon icon={faPaperclip} style={{ fontSize: '20px', color: '#94A3B8', marginBottom: '6px' }} />
                                <div style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>Drag & drop files here or click to upload</div>
                                <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>PDF, JPG, PNG (Max. 5MB each)</div>
                            </div>
                        </div>

                    </div>

                </div>

                {/* BOTTOM ACTION BAR (STICKY FOOTER) */}
                <div className="trf-footer-actions">
                    <button type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '42px', padding: '0 20px', borderRadius: '999px', border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#DC2626', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }} onClick={() => navigate('/app/transfers')}>
                        <FontAwesomeIcon icon={faTrashCan} /> Cancel
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', height: '42px', padding: '0 18px', borderRadius: '999px', border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#475569', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                            <FontAwesomeIcon icon={faBookmark} /> Save Draft
                        </button>
                        <button type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', height: '42px', padding: '0 18px', borderRadius: '999px', border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#475569', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                            <FontAwesomeIcon icon={faEye} /> Preview Transfer
                        </button>
                        <button type="submit" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', height: '44px', padding: '0 24px', borderRadius: '999px', border: 'none', background: 'linear-gradient(135deg, #15803D 0%, #166534 100%)', color: '#FFFFFF', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 14px rgba(21, 128, 61, 0.35)' }} onClick={onSubmit}>
                            <FontAwesomeIcon icon={faRightLeft} /> {singleTransfer ? 'Update Transfer' : 'Create Transfer'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

const mapStateToProps = ( state ) => {
    const { products, frontSetting, allConfigData } = state;
    return { customProducts: prepareTransferArray( products ), products, frontSetting, allConfigData };
};

export default connect( mapStateToProps, { editTransfer, fetchProductsByWarehouse } )( TransferForm );
