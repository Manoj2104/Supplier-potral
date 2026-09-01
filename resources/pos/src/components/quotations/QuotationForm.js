import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, InputGroup } from 'react-bootstrap-v5';
import moment from 'moment';
import { connect, useDispatch } from 'react-redux';
import { fetchProductsByWarehouse } from '../../store/action/productAction';
import { editSale } from '../../store/action/salesAction';
import ProductSearch from '../../shared/components/product-cart/search/ProductSearch';
import ProductRowTable from '../../shared/components/sales/ProductRowTable';
import { placeholderText, getFormattedMessage, decimalValidate, onFocusInput, getFormattedOptions } from '../../shared/sharedMethod';
import ReactDatePicker from '../../shared/datepicker/ReactDatePicker';
import ProductMainCalculation from './ProductMainCalculation';
import { calculateCartTotalAmount, calculateCartTotalTaxAmount } from '../../shared/calculation/calculation';
import { prepareSaleProductArray } from '../../shared/prepareArray/prepareSaleArray';
import { addToast } from '../../store/action/toastAction';
import { quotationStatusOptions, toastType, apiBaseURL } from '../../constants';
import { fetchFrontSetting } from '../../store/action/frontSettingAction';
import { fetchCustomers } from '../../store/action/customerAction';
import apiConfig from '../../config/apiConfig';
import ReactSelect from '../../shared/select/reactSelect';
import { editQuotation } from '../../store/action/quotationAction';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faChevronRight, 
    faPlus, 
    faArrowLeft, 
    faArrowRight,
    faFileLines, 
    faBoxesStacked, 
    faReceipt, 
    faBoxOpen, 
    faBarcode, 
    faSearch,
    faTimes,
    faFileExcel,
    faExclamationTriangle,
    faUser, 
    faHistory, 
    faTrash, 
    faCheck, 
    faBookmark, 
    faEye, 
    faFileSignature, 
    faPrint,
    faTrashCan,
    faCreditCard
} from '@fortawesome/free-solid-svg-icons';
import './CreateQuotationPremium.css';

const QuotationForm = ( props ) => {
    const {
        addQuoationData,
        id,
        customers = [],
        warehouses = [],
        singleQuotation,
        customProducts,
        products,
        fetchProductsByWarehouse,
        fetchFrontSetting,
        frontSetting,
        editQuotation,
        allConfigData
    } = props;

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [ updateProducts, setUpdateProducts ] = useState( [] );
    const [ quantity, setQuantity ] = useState( 0 );
    const [ newCost, setNewCost ] = useState( '' );
    const [ newDiscount, setNewDiscount ] = useState( '' );
    const [ newTax, setNewTax ] = useState( '' );
    const [ subTotal, setSubTotal ] = useState( '' );
    const [ newSaleUnit, setNewSaleUnit ] = useState( '' );
    const [ paymentMethod, setPaymentMethod ] = useState( 'Cash' );
    const [ searchMode, setSearchMode ] = useState( 'search' );
    const [ searchQuery, setSearchQuery ] = useState( '' );

    // ── Quick Add Customer Modal State ───────────────────────────────────────
    const [ showAddCustomerModal, setShowAddCustomerModal ] = useState( false );
    const [ newCustomerData, setNewCustomerData ] = useState( {
        name: '',
        phone: '',
        email: '',
        country: 'India',
        city: 'Chennai',
        address: ''
    } );
    const [ savingCustomer, setSavingCustomer ] = useState( false );

    const handleCreateCustomerSubmit = async (e) => {
        e.preventDefault();
        if (!newCustomerData.name || !newCustomerData.phone) {
            dispatch(addToast({ text: 'Customer Name and Phone number are required!', type: toastType.ERROR }));
            return;
        }
        try {
            setSavingCustomer(true);
            const payload = {
                name: newCustomerData.name,
                phone: newCustomerData.phone,
                email: newCustomerData.email || `${newCustomerData.phone.replace(/[^0-9]/g, '')}@sugunapos.com`,
                country: newCustomerData.country || 'India',
                city: newCustomerData.city || 'Chennai',
                address: newCustomerData.address || 'Local Store Customer'
            };
            const res = await apiConfig.post(apiBaseURL.CUSTOMERS, payload);
            const createdData = res.data.data;
            const newOption = {
                label: createdData.attributes?.name || createdData.name || newCustomerData.name,
                value: createdData.id
            };
            dispatch(fetchCustomers());
            setSaleValue(prev => ({ ...prev, customer_id: newOption }));
            setErrors(prev => ({ ...prev, customer_id: '' }));
            dispatch(addToast({ text: `Customer "${newCustomerData.name}" created & selected!`, type: toastType.SUCCESS }));
            setShowAddCustomerModal(false);
            setNewCustomerData({ name: '', phone: '', email: '', country: 'India', city: 'Chennai', address: '' });
        } catch (err) {
            const msg = err?.response?.data?.message || 'Failed to create customer';
            dispatch(addToast({ text: msg, type: toastType.ERROR }));
        } finally {
            setSavingCustomer(false);
        }
    };

    const [ saleValue, setSaleValue ] = useState( {
        date: new Date(),
        expiry_date: moment().add(14, 'days').toDate(),
        customer_id: '',
        warehouse_id: '',
        sales_person: 'Manoj S',
        reference_no: `REF-${moment().format('YYYY-MMDD')}`,
        currency: 'INR - Indian Rupee (₹)',
        payment_terms: 'Net 15 Days',
        tax_rate: "0.00",
        tax_amount: 0.00,
        discount: "0.00",
        shipping: "0.00",
        grand_total: 0.00,
        notes: singleQuotation ? singleQuotation.notes : '',
        received_amount: 0,
        paid_amount: 0,
        status_id: { label: getFormattedMessage( 'status.filter.sent.label' ), value: 1 }
    } );

    const [ errors, setErrors ] = useState( {
        date: '',
        customer_id: '',
        warehouse_id: '',
        status_id: ''
    } );

    useEffect( () => {
        setUpdateProducts( updateProducts );
    }, [ updateProducts, quantity, newCost, newDiscount, newTax, subTotal, newSaleUnit ] );

    useEffect( () => {
        updateProducts.length >= 1 
            ? dispatch( { type: 'DISABLE_OPTION', payload: true } ) 
            : dispatch( { type: 'DISABLE_OPTION', payload: false } );
    }, [ updateProducts ] );

    useEffect( () => {
        fetchFrontSetting();
    }, [] );

    useEffect( () => {
        if ( singleQuotation ) {
            setSaleValue( {
                date: singleQuotation ? moment( singleQuotation.date ).toDate() : '',
                expiry_date: moment( singleQuotation.date ).add(14, 'days').toDate(),
                customer_id: singleQuotation ? singleQuotation.customer_id : '',
                warehouse_id: singleQuotation ? singleQuotation.warehouse_id : '',
                sales_person: 'Manoj S',
                reference_no: singleQuotation ? `QUO-${singleQuotation.id}` : `REF-${moment().format('YYYY-MMDD')}`,
                currency: 'INR - Indian Rupee (₹)',
                payment_terms: 'Net 15 Days',
                tax_rate: singleQuotation ? singleQuotation.tax_rate?.toFixed ? singleQuotation.tax_rate.toFixed( 2 ) : String(singleQuotation.tax_rate) : '0.00',
                tax_amount: singleQuotation ? singleQuotation.tax_amount?.toFixed ? singleQuotation.tax_amount.toFixed( 2 ) : String(singleQuotation.tax_amount) : '0.00',
                discount: singleQuotation ? singleQuotation.discount?.toFixed ? singleQuotation.discount.toFixed( 2 ) : String(singleQuotation.discount) : '0.00',
                shipping: singleQuotation ? singleQuotation.shipping?.toFixed ? singleQuotation.shipping.toFixed( 2 ) : String(singleQuotation.shipping) : '0.00',
                grand_total: singleQuotation ? singleQuotation.grand_total : '0.00',
                status_id: singleQuotation ? singleQuotation.status_id : '',
                notes: singleQuotation ? singleQuotation.notes : ''
            } );
        }
    }, [ singleQuotation ] );

    useEffect( () => {
        if ( singleQuotation ) {
            setUpdateProducts( singleQuotation.quotation_items );
        }
    }, [] );

    useEffect( () => {
        if ( !singleQuotation && warehouses && warehouses.length > 0 && !saleValue.warehouse_id ) {
            const firstWh = warehouses[0];
            const whObj = firstWh.value !== undefined ? firstWh : { label: firstWh.attributes?.name || firstWh.name, value: firstWh.id };
            setSaleValue( prev => ( { ...prev, warehouse_id: whObj } ) );
            if ( whObj.value || firstWh.id ) {
                fetchProductsByWarehouse( whObj.value || firstWh.id );
            }
        }
    }, [ warehouses ] );

    useEffect( () => {
        if ( !singleQuotation && customers && customers.length > 0 && !saleValue.customer_id ) {
            const firstCust = customers[0];
            const custObj = firstCust.value !== undefined ? firstCust : { label: firstCust.attributes?.name || firstCust.name, value: firstCust.id };
            setSaleValue( prev => ( { ...prev, customer_id: custObj } ) );
        }
    }, [ customers ] );

    useEffect( () => {
        if ( saleValue.warehouse_id?.value ) {
            fetchProductsByWarehouse( saleValue.warehouse_id.value );
        }
    }, [ saleValue.warehouse_id?.value ] );

    const handleValidation = () => {
        let error = {};
        let isValid = true;
        let firstErrorTarget = null;

        const qtyCart = updateProducts.filter( ( a ) => a.quantity === 0 );

        if ( !saleValue.date ) {
            error[ 'date' ] = getFormattedMessage( 'globally.date.validate.label' );
            if (!firstErrorTarget) firstErrorTarget = '#quotation-date-col';
            isValid = false;
        }
        if ( !saleValue.warehouse_id ) {
            error[ 'warehouse_id' ] = getFormattedMessage( 'product.input.warehouse.validate.label' );
            if (!firstErrorTarget) firstErrorTarget = '#warehouse-select-col';
            isValid = false;
        }
        if ( !saleValue.customer_id ) {
            error[ 'customer_id' ] = getFormattedMessage( 'sale.select.customer.validate.label' );
            if (!firstErrorTarget) firstErrorTarget = '#customer-select-col';
            isValid = false;
        }
        if ( !saleValue.status_id ) {
            error[ 'status_id' ] = getFormattedMessage( "globally.status.validate.label" );
            if (!firstErrorTarget) firstErrorTarget = '#status-select-col';
            isValid = false;
        }
        if ( updateProducts.length < 1 ) {
            dispatch( addToast( { text: getFormattedMessage( 'purchase.product-list.validate.message' ), type: toastType.ERROR } ) );
            if (!firstErrorTarget) firstErrorTarget = '#products-section-col';
            isValid = false;
        } else if ( qtyCart.length > 0 ) {
            dispatch( addToast( { text: getFormattedMessage( 'globally.product-quantity.validate.message' ), type: toastType.ERROR } ) );
            if (!firstErrorTarget) firstErrorTarget = '#products-section-col';
            isValid = false;
        }

        setErrors( error );

        if (!isValid && firstErrorTarget) {
            setTimeout(() => {
                const el = document.querySelector(firstErrorTarget);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    const inputEl = el.querySelector('input, select, .react-select__input');
                    if (inputEl) inputEl.focus();
                }
            }, 60);
        }

        return isValid;
    };

    const onWarehouseChange = ( obj ) => {
        setSaleValue( inputs => ( { ...inputs, warehouse_id: obj } ) );
        setErrors( '' );
    };

    const onCustomerChange = ( obj ) => {
        setSaleValue( inputs => ( { ...inputs, customer_id: obj } ) );
        setErrors( '' );
    };

    const onChangeInput = ( e ) => {
        e.preventDefault();
        const { value } = e.target;
        if ( value.match( /\./g ) ) {
            const [ , decimal ] = value.split( '.' );
            if ( decimal?.length > 2 ) return;
        }
        setSaleValue( inputs => ( { ...inputs, [ e.target.name ]: value && value } ) );
    };

    const onNotesChangeInput = ( e ) => {
        e.preventDefault();
        setSaleValue( inputs => ( { ...inputs, notes: e.target.value } ) );
    };

    const onStatusChange = ( obj ) => {
        setSaleValue( inputs => ( { ...inputs, status_id: obj } ) );
    };

    const updatedQty = ( qty ) => setQuantity( qty );
    const updateCost = ( cost ) => setNewCost( cost );
    const updateDiscount = ( discount ) => setNewDiscount( discount );
    const updateTax = ( tax ) => setNewTax( tax );
    const updateSubTotal = ( subTotal ) => setSubTotal( subTotal );
    const updateSaleUnit = ( saleUnit ) => setNewSaleUnit( saleUnit );

    const handleCallback = ( date ) => {
        setSaleValue( previousState => ( { ...previousState, date: date } ) );
        setErrors( '' );
    };

    const handleExpiryCallback = ( date ) => {
        setSaleValue( previousState => ( { ...previousState, expiry_date: date } ) );
    };

    const quotationStatusFilterOptions = getFormattedOptions( quotationStatusOptions );

    const prepareFormData = ( prepareData ) => {
        const formattedDate = prepareData.date ? moment( prepareData.date ).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD');
        const formValue = {
            date: formattedDate,
            customer_id: prepareData.customer_id?.value ? prepareData.customer_id.value : prepareData.customer_id,
            warehouse_id: prepareData.warehouse_id?.value ? prepareData.warehouse_id.value : prepareData.warehouse_id,
            discount: prepareData.discount ? String(prepareData.discount) : "0.00",
            tax_rate: prepareData.tax_rate ? String(prepareData.tax_rate) : "0.00",
            tax_amount: calculateCartTotalTaxAmount( updateProducts, saleValue ),
            quotation_items: updateProducts.map(item => ({
                product_id: item.product_id || item.id,
                product_price: Number(item.product_price || item.net_unit_price || 0),
                net_unit_price: Number(item.net_unit_price || item.product_price || 0),
                tax_type: Number(item.tax_type || 1),
                tax_value: Number(item.tax_value || 0),
                tax_amount: Number(item.tax_amount || 0),
                discount_type: String(item.discount_type || '2'),
                discount_value: Number(item.discount_value || 0),
                discount_amount: Number(item.discount_amount || 0),
                sale_unit: item.sale_unit?.value !== undefined ? item.sale_unit.value : (typeof item.sale_unit === 'number' ? item.sale_unit : 1),
                quantity: Number(item.quantity || 1),
                sub_total: Number(item.sub_total || 0),
            })),
            shipping: prepareData.shipping ? String(prepareData.shipping) : "0.00",
            grand_total: calculateCartTotalAmount( updateProducts, saleValue ),
            received_amount: 0,
            paid_amount: 0,
            note: prepareData.notes || '',
            status: prepareData.status_id?.value ? prepareData.status_id.value : (prepareData.status_id || 1),
        };
        return formValue;
    };

    const onSubmit = ( event ) => {
        event.preventDefault();
        const valid = handleValidation();
        if ( valid ) {
            if ( singleQuotation ) {
                editQuotation( id, prepareFormData( saleValue ), navigate );
            } else {
                addQuoationData( prepareFormData( saleValue ) );
                setSaleValue( saleValue );
            }
        }
    };

    const onBlurInput = ( el ) => {
        if ( el.target.value === '' ) {
            if ( el.target.name === "shipping" ) setSaleValue( { ...saleValue, shipping: "0.00" } );
            if ( el.target.name === "discount" ) setSaleValue( { ...saleValue, discount: "0.00" } );
            if ( el.target.name === "tax_rate" ) setSaleValue( { ...saleValue, tax_rate: "0.00" } );
        }
    };

    const currencySymbol = (frontSetting && frontSetting.value && frontSetting.value.currency_symbol) || '₹';
    const rawSubTotal = calculateCartTotalAmount( updateProducts, saleValue );
    const calculatedSubTotal = Number(rawSubTotal || 0);

    const rawTaxTotal = calculateCartTotalTaxAmount( updateProducts, saleValue );
    const calculatedTaxTotal = Number(rawTaxTotal || 0);

    const discountAmount = parseFloat(saleValue.discount || 0);
    const shippingAmount = parseFloat(saleValue.shipping || 0);
    const grandTotalAmount = Math.max(0, calculatedSubTotal - discountAmount + calculatedTaxTotal + shippingAmount);

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
    const safeProducts = Array.isArray(products) ? products : [];
    const hasWarehouse = !!(saleValue.warehouse_id?.value || saleValue.warehouse_id);
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

    const addProductToQuotation = (prod) => {
        const a = prod.attributes || prod;
        const targetId = prod.id;
        const cost = Number(a.product_price || a.product_cost || a.net_unit_price || a.price || 0);
        const stockQty = Number(a.stock?.quantity || a.available_qty || a.quantity || 0);

        const existing = updateProducts.find(p => (p.product_id || p.id) === targetId);
        if (existing) {
            setUpdateProducts(prev => prev.map(p => {
                if ((p.product_id || p.id) === targetId) {
                    const nextQty = (p.quantity || 1) + 1;
                    return {
                        ...p,
                        quantity: nextQty,
                        sub_total: nextQty * (p.net_unit_price || cost),
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
                net_unit_price: cost,
                product_price: cost,
                fix_net_unit: cost,
                quantity: 1,
                tax_type: 1,
                tax_value: 0.00,
                tax_amount: 0.00,
                discount_type: '2',
                discount_value: 0.00,
                discount_amount: 0.00,
                sub_total: cost,
                sale_unit: a.sale_unit || 1,
                product_unit: a.product_unit || 1,
                stock: stockQty,
                short_name: a.product_unit_name?.short_name || 'pc',
                image: extractImageUrl(a),
                newItem: "",
            };
            setUpdateProducts(prev => [newItem, ...prev]);
            dispatch(addToast({ text: `${a.name} added to quotation items!`, type: toastType.SUCCESS }));
        }
        setSearchQuery('');
    };

    return (
        <div className="quo-create-page">
            {/* ── Breadcrumb ── */}
            <div className="brand-breadcrumb">
                <span>Dashboard</span>
                <span>&gt;</span>
                <Link to="/app/quotations" style={{ color: '#64748B', textDecoration: 'none' }}>Quotations</Link>
                <span>&gt;</span>
                <span className="brand-crumb-active">{singleQuotation ? 'Edit' : 'Create'}</span>
            </div>

            <div className="create-fullpage-container">

                {/* ── Header Bar ── */}
                <div className="create-form-header">
                    <div className="d-flex align-items-center gap-3">
                        <Link to="/app/quotations" className="brand-btn-pill">
                            <FontAwesomeIcon icon={faArrowLeft} /> Back to Quotations
                        </Link>
                        <div>
                            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', margin: 0, lineHeight: '1.2' }}>
                                {singleQuotation ? 'Edit Quotation' : 'Create Quotation'}
                            </h2>
                            <p style={{ fontSize: '13.5px', color: '#64748B', margin: '2px 0 0 0' }}>
                                Configure quotation details, products, discount, and terms
                            </p>
                        </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <button type="button" className="brand-btn-pill" onClick={() => navigate('/app/quotations')}>
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="brand-btn-pill brand-btn-primary"
                            onClick={onSubmit}
                        >
                            <FontAwesomeIcon icon={faCheck} /> {singleQuotation ? 'Save Changes' : 'Save Quotation'}
                        </button>
                    </div>
                </div>

                {/* ── Form Body ── */}
                <div className="create-form-body">
                    <form onSubmit={onSubmit}>

                        {/* Section 1: Quotation Information */}
                        <div className="create-card-section">
                            <div className="create-section-header">
                                <div className="create-section-icon green">
                                    <FontAwesomeIcon icon={faFileLines} />
                                </div>
                                <div className="create-section-title">
                                    <h3>Quotation Information</h3>
                                    <p>Select customer, warehouse, quotation dates, and reference configuration</p>
                                </div>
                            </div>

                            <div className="row g-4">
                                <div className="col-md-3" id="quotation-date-col">
                                    <label className="form-label">
                                        Quotation Date <span className="text-danger">*</span>
                                    </label>
                                    <ReactDatePicker onChangeDate={handleCallback} newStartDate={saleValue.date} />
                                    {errors.date && <span className="text-danger d-block fw-400 fs-small mt-1">{errors.date}</span>}
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label">
                                        Expiry Date <span className="text-danger">*</span>
                                    </label>
                                    <ReactDatePicker onChangeDate={handleExpiryCallback} newStartDate={saleValue.expiry_date} />
                                </div>

                                <div className="col-md-3" id="warehouse-select-col">
                                    <label className="form-label">
                                        Warehouse <span className="text-danger">*</span>
                                    </label>
                                    <ReactSelect
                                        name="warehouse_id"
                                        data={warehouses}
                                        onChange={onWarehouseChange}
                                        isRequired={true}
                                        errors={errors.warehouse_id}
                                        defaultValue={saleValue.warehouse_id}
                                        value={saleValue.warehouse_id}
                                        addSearchItems={singleQuotation}
                                        isWarehouseDisable={true}
                                        placeholder={placeholderText('purchase.select.warehouse.placeholder.label')}
                                    />
                                </div>

                                <div className="col-md-3" id="customer-select-col">
                                    <div className="d-flex align-items-center justify-content-between mb-1">
                                        <label className="form-label mb-0">
                                            Customer <span className="text-danger">*</span>
                                        </label>
                                        <button
                                            type="button"
                                            className="brand-btn-pill"
                                            style={{
                                                fontSize: '11.5px',
                                                padding: '2px 10px',
                                                height: '24px',
                                                background: '#DCFCE7',
                                                color: '#16A34A',
                                                border: '1px solid #86EFAC',
                                                fontWeight: '700'
                                            }}
                                            onClick={() => setShowAddCustomerModal(true)}
                                            title="Click to add a new customer"
                                        >
                                            <FontAwesomeIcon icon={faPlus} style={{ fontSize: '10px' }} /> Add Customer
                                        </button>
                                    </div>
                                    <ReactSelect
                                        name="customer_id"
                                        data={customers}
                                        onChange={onCustomerChange}
                                        isRequired={true}
                                        errors={errors.customer_id}
                                        defaultValue={saleValue.customer_id}
                                        value={saleValue.customer_id}
                                        placeholder={placeholderText('sale.select.customer.placeholder.label')}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">Reference No.</label>
                                    <input
                                        className="form-control create-ref-input"
                                        value={saleValue.reference_no}
                                        disabled
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">Sales Person</label>
                                    <select
                                        className="form-select"
                                        value={saleValue.sales_person}
                                        onChange={(e) => setSaleValue({...saleValue, sales_person: e.target.value})}
                                    >
                                        <option value="Manoj S">Manoj S (Administrator)</option>
                                        <option value="Sales Manager">Sales Manager</option>
                                    </select>
                                </div>

                                <div className="col-md-4" id="status-select-col">
                                    <label className="form-label">Status <span className="text-danger">*</span></label>
                                    <ReactSelect
                                        multiLanguageOption={quotationStatusFilterOptions}
                                        name="status_id"
                                        onChange={onStatusChange}
                                        isRequired={true}
                                        value={saleValue.status_id}
                                        errors={errors.status_id}
                                        placeholder={placeholderText('purchase.select.status.placeholder.label')}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Search & Add Products */}
                        <div className="create-card-section" id="products-section-col">
                            <div className="create-section-header">
                                <div className="create-section-icon blue">
                                    <FontAwesomeIcon icon={faBoxesStacked} />
                                </div>
                                <div className="create-section-title">
                                    <h3>Search & Add Products</h3>
                                    <p>Lookup items by SKU, barcode, or product name and configure quotation items</p>
                                </div>
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
                                                    onClick={() => addProductToQuotation(prod)}
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

                            {/* Table of configured quotation items */}
                            <div className="mt-4">
                                {updateProducts.length === 0 ? (
                                    <div className="quo-empty-state">
                                        <div className="quo-empty-icon">
                                            <FontAwesomeIcon icon={faBoxOpen} />
                                        </div>
                                        <h4 className="quo-empty-title">No products added yet</h4>
                                        <p className="quo-empty-desc">Search and add products above to build your quotation order.</p>
                                    </div>
                                ) : (
                                    <div className="custom-responsive">
                                        <ProductRowTable
                                            updateProducts={updateProducts}
                                            setUpdateProducts={setUpdateProducts}
                                            updatedQty={updatedQty}
                                            frontSetting={frontSetting}
                                            updateCost={updateCost}
                                            updateDiscount={updateDiscount}
                                            updateTax={updateTax}
                                            updateSubTotal={updateSubTotal}
                                            updateSaleUnit={updateSaleUnit}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Section 3: Tax, Discount, Shipping & Financial Summary */}
                        <div className="create-card-section">
                            <div className="create-section-header">
                                <div className="create-section-icon orange">
                                    <FontAwesomeIcon icon={faReceipt} />
                                </div>
                                <div className="create-section-title">
                                    <h3>Order Adjustments & Financial Summary</h3>
                                    <p>Configure tax rate, discount, shipping fee, and inspect live calculations</p>
                                </div>
                            </div>

                            <div className="row g-4">
                                <div className="col-md-4">
                                    <label className="form-label">Order Tax (%)</label>
                                    <InputGroup>
                                        <input
                                            className="form-control"
                                            type="text"
                                            name="tax_rate"
                                            value={saleValue.tax_rate}
                                            onBlur={onBlurInput}
                                            onFocus={onFocusInput}
                                            onKeyPress={decimalValidate}
                                            onChange={onChangeInput}
                                        />
                                        <InputGroup.Text>%</InputGroup.Text>
                                    </InputGroup>
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">Discount ({currencySymbol})</label>
                                    <InputGroup>
                                        <input
                                            className="form-control"
                                            type="text"
                                            name="discount"
                                            value={saleValue.discount}
                                            onBlur={onBlurInput}
                                            onFocus={onFocusInput}
                                            onKeyPress={decimalValidate}
                                            onChange={onChangeInput}
                                        />
                                        <InputGroup.Text>{currencySymbol}</InputGroup.Text>
                                    </InputGroup>
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">Shipping ({currencySymbol})</label>
                                    <InputGroup>
                                        <input
                                            className="form-control"
                                            type="text"
                                            name="shipping"
                                            value={saleValue.shipping}
                                            onBlur={onBlurInput}
                                            onFocus={onFocusInput}
                                            onKeyPress={decimalValidate}
                                            onChange={onChangeInput}
                                        />
                                        <InputGroup.Text>{currencySymbol}</InputGroup.Text>
                                    </InputGroup>
                                </div>
                            </div>

                            {/* Live Financial Calculation Box */}
                            <div className="quo-financial-summary-box">
                                <div className="d-flex align-items-center justify-content-between flex-wrap gap-4">
                                    <div className="quo-financial-stat">
                                        <span className="quo-financial-lbl">Subtotal</span>
                                        <span className="quo-financial-val">{currencySymbol} {calculatedSubTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="quo-financial-stat">
                                        <span className="quo-financial-lbl">Discount</span>
                                        <span className="quo-financial-val text-danger">−{currencySymbol} {discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="quo-financial-stat">
                                        <span className="quo-financial-lbl">Order Tax ({parseFloat(saleValue.tax_rate || 0).toFixed(2)}%)</span>
                                        <span className="quo-financial-val text-primary">+{currencySymbol} {calculatedTaxTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="quo-financial-stat">
                                        <span className="quo-financial-lbl">Shipping</span>
                                        <span className="quo-financial-val text-secondary">+{currencySymbol} {shippingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="quo-grand-total-pill">
                                        <span className="quo-grand-pill-lbl">Grand Total</span>
                                        <span className="quo-grand-pill-val">{currencySymbol} {grandTotalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Notes & Terms */}
                        <div className="create-card-section">
                            <div className="create-section-header">
                                <div className="create-section-icon purple">
                                    <FontAwesomeIcon icon={faFileSignature} />
                                </div>
                                <div className="create-section-title">
                                    <h3>Notes & Remarks</h3>
                                    <p>Add special instructions, payment terms, or remarks for this quotation</p>
                                </div>
                            </div>

                            <div>
                                <label className="form-label">Notes (optional)</label>
                                <textarea
                                    name="notes"
                                    className="form-control"
                                    value={saleValue.notes}
                                    rows={3}
                                    placeholder="Add any notes or special instructions for this quotation..."
                                    onChange={onNotesChangeInput}
                                    style={{ borderRadius: '12px', resize: 'none', background: '#F8FAFC' }}
                                />
                                <div className="text-end text-muted fs-small mt-1">
                                    {(saleValue.notes || '').length} / 500
                                </div>
                            </div>
                        </div>

                        {/* Bottom Action Footer Bar */}
                        <div className="d-flex align-items-center justify-content-between pt-3 pb-2 flex-wrap gap-3">
                            <button
                                type="button"
                                className="brand-btn-pill"
                                style={{ borderColor: '#FCA5A5', color: '#DC2626', background: '#FEF2F2' }}
                                onClick={() => setUpdateProducts([])}
                            >
                                <FontAwesomeIcon icon={faTrashCan} /> Clear Products
                            </button>
                            <div className="d-flex align-items-center gap-3">
                                <button type="button" className="brand-btn-pill" onClick={() => navigate('/app/quotations')}>
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="brand-btn-pill brand-btn-primary"
                                    onClick={onSubmit}
                                >
                                    <FontAwesomeIcon icon={faCheck} /> {singleQuotation ? 'Save Changes' : 'Save Quotation'}
                                </button>
                            </div>
                        </div>

                    </form>
                </div>
            </div>

            {/* ── Quick Add Customer Modal ── */}
            {showAddCustomerModal && (
                <div className="sp-modal-center-backdrop" onClick={() => setShowAddCustomerModal(false)}>
                    <div className="mail-modal-card" style={{ maxWidth: '520px', width: '100%', padding: '24px', borderRadius: '16px' }} onClick={e => e.stopPropagation()}>
                        <div className="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom">
                            <div className="d-flex align-items-center gap-2">
                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                                    <FontAwesomeIcon icon={faUser} />
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Add New Customer</h4>
                                    <span style={{ fontSize: '12px', color: '#64748B' }}>Create a customer record and automatically select for this quotation</span>
                                </div>
                            </div>
                            <button type="button" className="btn-close" onClick={() => setShowAddCustomerModal(false)} />
                        </div>

                        <form onSubmit={handleCreateCustomerSubmit}>
                            <div className="row g-3">
                                <div className="col-12">
                                    <label className="form-label fw-bold fs-small">Customer Full Name <span className="text-danger">*</span></label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        required
                                        placeholder="e.g. Rahul Sharma"
                                        value={newCustomerData.name}
                                        onChange={e => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-bold fs-small">Phone / Mobile <span className="text-danger">*</span></label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        required
                                        placeholder="e.g. 9876543210"
                                        value={newCustomerData.phone}
                                        onChange={e => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-bold fs-small">Email Address</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        placeholder="e.g. rahul@example.com"
                                        value={newCustomerData.email}
                                        onChange={e => setNewCustomerData({ ...newCustomerData, email: e.target.value })}
                                    />
                                </div>
                                <div className="col-12">
                                    <label className="form-label fw-bold fs-small">Address / Location</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="e.g. Anna Nagar, Chennai"
                                        value={newCustomerData.address}
                                        onChange={e => setNewCustomerData({ ...newCustomerData, address: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="d-flex align-items-center justify-content-end gap-2 mt-4 pt-3 border-top">
                                <button type="button" className="brand-btn-pill" onClick={() => setShowAddCustomerModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="brand-btn-pill brand-btn-primary" disabled={savingCustomer}>
                                    {savingCustomer ? 'Saving Customer...' : 'Save & Select Customer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const mapStateToProps = ( state ) => {
    const { purchaseProducts, products, frontSetting, allConfigData } = state;
    return { customProducts: prepareSaleProductArray( products ), purchaseProducts, products, frontSetting, allConfigData };
};

export default connect( mapStateToProps, { editSale, editQuotation, fetchProductsByWarehouse, fetchFrontSetting } )( QuotationForm );
