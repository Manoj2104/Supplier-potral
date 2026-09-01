import React, { useState } from 'react';
import Form from 'react-bootstrap/Form';
import { connect } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import moment from 'moment';
import { InputGroup } from 'react-bootstrap-v5';
import { decimalValidate, getFormattedMessage, placeholderText } from '../../shared/sharedMethod';
import { editExpense } from '../../store/action/expenseAction';
import ReactSelect from '../../shared/select/reactSelect';
import ReactDatePicker from '../../shared/datepicker/ReactDatePicker';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronRight,
    faArrowLeft,
    faReceipt,
    faCalendarAlt,
    faWallet,
    faCalculator,
    faCloudArrowUp,
    faFilePdf,
    faFileImage,
    faFile,
    faXmark,
    faFloppyDisk,
} from '@fortawesome/free-solid-svg-icons';
import "./CreateExpensePremium.css";

const ExpenseForm = ( props ) => {
    const { addExpenseData, id, editExpense, singleExpense, warehouses, expenseCategories, frontSetting, isEdit } = props;
    const navigate = useNavigate();

    const currencySymbol = frontSetting?.value?.currency_symbol || '₹';

    const [ expenseValue, setExpenseValue ] = useState( {
        date: singleExpense ? moment( singleExpense[ 0 ].date ).toDate() : new Date(),
        warehouse_id: singleExpense ? singleExpense[ 0 ].warehouse_id : '',
        expense_category_id: singleExpense ? singleExpense[ 0 ].expense_category_id : '',
        amount: singleExpense ? singleExpense[ 0 ].amount : '',
        details: singleExpense ? singleExpense[ 0 ].details : '',
        title: singleExpense ? singleExpense[ 0 ].title : '',
    } );

    const [ paymentMethod, setPaymentMethod ] = useState('Cash');
    const [ paidBy, setPaidBy ] = useState('Manoj S (Administrator)');
    const [ attachedFiles, setAttachedFiles ] = useState([]);

    const [ errors, setErrors ] = useState( {
        date: '', title: '', warehouse_id: '', expense_category_id: '', amount: '', details: ''
    } );

    const [ selectedWarehouse ] = useState( singleExpense ? ( [ {
        label: singleExpense[ 0 ].warehouse_id.label, value: singleExpense[ 0 ].warehouse_id.value
    } ] ) : null );
    const [ selectExpenseCategory ] = useState( singleExpense ? ( [ {
        label: singleExpense[ 0 ].expense_category_id.label, value: singleExpense[ 0 ].expense_category_id.value
    } ] ) : null );

    const disabled = singleExpense && singleExpense[ 0 ].title === expenseValue.title && singleExpense[ 0 ].expense_category_id?.value === expenseValue.expense_category_id?.value && singleExpense[ 0 ].warehouse_id?.value === expenseValue.warehouse_id?.value && singleExpense[ 0 ].amount === expenseValue.amount && singleExpense[ 0 ].details === expenseValue.details && moment( singleExpense[ 0 ].date ).toDate().toString() === expenseValue.date.toString();

    const handleValidation = () => {
        let errorss = {};
        let isValid = false;
        if ( !expenseValue[ 'warehouse_id' ] ) {
            errorss[ 'warehouse_id' ] = getFormattedMessage( 'expense.input.warehouse.validate.label' );
        } else if ( !expenseValue[ 'title' ] ) {
            errorss[ 'title' ] = getFormattedMessage( 'expense.input.title.validate.label' );
        } else if ( !expenseValue[ 'expense_category_id' ] ) {
            errorss[ 'expense_category_id' ] = getFormattedMessage( 'expense.input.expense-category.validate.label' );
        } else if ( !expenseValue[ 'amount' ] ) {
            errorss[ 'amount' ] = getFormattedMessage( 'expense.input.amount.validate.label' );
        } else {
            isValid = true;
        }
        setErrors( errorss );
        return isValid;
    };

    const onWarehouseChange = ( obj ) => {
        setExpenseValue( inputs => ( { ...inputs, warehouse_id: obj } ) );
        setErrors( '' );
    };

    const onExpenseChange = ( obj ) => {
        setExpenseValue( inputs => ( { ...inputs, expense_category_id: obj } ) );
        setErrors( '' );
    };

    const onChangeInput = ( e ) => {
        e.preventDefault();
        setExpenseValue( inputs => ( { ...inputs, [ e.target.name ]: e.target.value } ) );
        setErrors( '' );
    };

    const handleCallback = ( date ) => {
        setExpenseValue( previousState => {
            return { ...previousState, date: date };
        } );
    };

    const handleFileUpload = ( e ) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            setAttachedFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index) => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const prepareData = ( prepareData ) => {
        const formValue = {
            date: moment( prepareData.date ).toDate(),
            title: prepareData.title,
            warehouse_id: prepareData.warehouse_id.value,
            expense_category_id: prepareData.expense_category_id.value,
            amount: prepareData.amount,
            details: prepareData.details,
        };
        return formValue;
    };

    const onSubmit = ( event ) => {
        event.preventDefault();
        const valid = handleValidation();
        if ( singleExpense && valid ) {
            if ( !disabled ) {
                editExpense( id, prepareData( expenseValue ), navigate );
            }
        } else {
            if ( valid ) {
                setExpenseValue( expenseValue );
                addExpenseData( prepareData( expenseValue ) );
            }
        }
    };

    const parsedAmount = parseFloat(expenseValue.amount || 0);
    const refCode = `EXP-${moment(expenseValue.date || new Date()).format("YYMMDD")}-001`;

    return (
        <div className="exp-create-page">
            {/* ─── Breadcrumb ───────────────────────────────────────── */}
            <div className="exp-breadcrumb">
                <span>Dashboard</span>
                <span className="sep"><FontAwesomeIcon icon={faChevronRight} /></span>
                <span>Finance</span>
                <span className="sep"><FontAwesomeIcon icon={faChevronRight} /></span>
                <span>Expenses</span>
                <span className="sep"><FontAwesomeIcon icon={faChevronRight} /></span>
                <span className="text-dark fw-bold">{isEdit ? 'Edit Expense' : 'Create Expense'}</span>
            </div>

            {/* ─── Page Header ──────────────────────────────────────── */}
            <div className="exp-header">
                <div>
                    <h1 className="exp-header-title">{isEdit ? 'Edit Expense' : 'Create Expense'}</h1>
                    <p className="exp-header-subtitle">
                        Record and categorize business expenses with supporting documents and financial tracking.
                    </p>
                </div>
                <div>
                    <button 
                        type="button" 
                        className="exp-btn-outline"
                        onClick={() => navigate('/app/expenses')}
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                        <span>Back</span>
                    </button>
                </div>
            </div>

            {/* ─── 4 REAL-TIME TOP KPI SUMMARY CARDS ───────────────────────────── */}
            <div className="exp-kpi-grid">
                <div className="exp-kpi-card">
                    <div className="exp-kpi-top">
                        <div className="exp-kpi-title">Today's Expenses</div>
                        <div className="exp-kpi-icon-box green">
                            <FontAwesomeIcon icon={faReceipt} />
                        </div>
                    </div>
                    <div className="exp-kpi-value">{currencySymbol} {parsedAmount > 0 ? parsedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}</div>
                    <div className="exp-kpi-trend text-muted fs-micro">
                        Current Entry Total
                    </div>
                </div>

                <div className="exp-kpi-card">
                    <div className="exp-kpi-top">
                        <div className="exp-kpi-title">Monthly Expenses</div>
                        <div className="exp-kpi-icon-box blue">
                            <FontAwesomeIcon icon={faCalendarAlt} />
                        </div>
                    </div>
                    <div className="exp-kpi-value">{currencySymbol} 0.00</div>
                    <div className="exp-kpi-trend text-muted fs-micro">
                        Cumulative Current Month Total
                    </div>
                </div>

                <div className="exp-kpi-card">
                    <div className="exp-kpi-top">
                        <div className="exp-kpi-title">Pending Approvals</div>
                        <div className="exp-kpi-icon-box orange">
                            <FontAwesomeIcon icon={faWallet} />
                        </div>
                    </div>
                    <div className="exp-kpi-value">{currencySymbol} 0.00</div>
                    <div className="exp-kpi-trend text-muted fs-micro">
                        0 Expenses Pending Approval
                    </div>
                </div>

                <div className="exp-kpi-card">
                    <div className="exp-kpi-top">
                        <div className="exp-kpi-title">Average Expense</div>
                        <div className="exp-kpi-icon-box purple">
                            <FontAwesomeIcon icon={faCalculator} />
                        </div>
                    </div>
                    <div className="exp-kpi-value">{currencySymbol} 0.00</div>
                    <div className="exp-kpi-trend text-muted fs-micro">
                        Live Calculated Average
                    </div>
                </div>
            </div>

            <Form onSubmit={onSubmit}>
                {/* ─── MAIN FULL-WIDTH WORKSPACE ─────────────────────────── */}
                <div className="exp-full-workspace">
                    {/* SECTION 1: EXPENSE INFORMATION */}
                    <div className="exp-card">
                        <div className="exp-card-header">
                            <span className="exp-section-badge">1</span>
                            <h3 className="exp-card-title">Expense Information</h3>
                        </div>

                        <div className="row g-4">
                            <div className="col-md-4">
                                <label className="form-label fw-bold fs-small text-dark">
                                    Expense Date <span className="text-danger">*</span>
                                </label>
                                <div className="position-relative">
                                    <ReactDatePicker onChangeDate={handleCallback} newStartDate={expenseValue.date} />
                                </div>
                                {errors['date'] && <span className="text-danger fs-micro mt-1 d-block">{errors['date']}</span>}
                            </div>

                            <div className="col-md-4">
                                <label className="form-label fw-bold fs-small text-dark">
                                    Expense Title <span className="text-danger">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    name="title" 
                                    className="form-control"
                                    style={{ borderRadius: '12px', height: '44px', background: '#F8FAFC', fontSize: '13.5px' }}
                                    placeholder="Enter Expense Title (e.g., Office Supplies)"
                                    onChange={onChangeInput}
                                    value={expenseValue.title || ''} 
                                />
                                {errors['title'] && <span className="text-danger fs-micro mt-1 d-block">{errors['title']}</span>}
                            </div>

                            <div className="col-md-4">
                                <label className="form-label fw-bold fs-small text-dark">Reference No.</label>
                                <input 
                                    type="text" 
                                    className="form-control text-muted" 
                                    value={refCode} 
                                    readOnly 
                                    style={{ borderRadius: '12px', height: '44px', background: '#F1F5F9', fontSize: '13.5px', fontWeight: '700' }}
                                />
                                <span className="fs-micro text-muted">Auto Generated</span>
                            </div>

                            <div className="col-md-4">
                                <ReactSelect 
                                    title={getFormattedMessage('expense-category.title')}
                                    placeholder={placeholderText('expense.input.expense-category.placeholder.label')}
                                    defaultValue={selectExpenseCategory} 
                                    errors={errors['expense_category_id']}
                                    data={expenseCategories} 
                                    onChange={onExpenseChange} 
                                />
                            </div>

                            <div className="col-md-4">
                                <ReactSelect 
                                    title={getFormattedMessage('warehouse.title')}
                                    placeholder={placeholderText('expense.input.warehouse.placeholder.label')}
                                    defaultValue={selectedWarehouse} 
                                    errors={errors['warehouse_id']}
                                    data={warehouses} 
                                    onChange={onWarehouseChange} 
                                />
                            </div>

                            <div className="col-md-4">
                                <label className="form-label fw-bold fs-small text-dark">
                                    Expense Amount <span className="text-danger">*</span>
                                </label>
                                <InputGroup style={{ height: '44px' }}>
                                    <InputGroup.Text style={{ borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px', background: '#F8FAFC', fontWeight: '700' }}>
                                        {currencySymbol}
                                    </InputGroup.Text>
                                    <input 
                                        type="text" 
                                        name="amount" 
                                        value={expenseValue.amount || ''}
                                        placeholder="Enter Amount"
                                        className="form-control"
                                        style={{ background: '#F8FAFC', fontSize: '13.5px', fontWeight: '700' }}
                                        onKeyPress={(event) => decimalValidate(event)}
                                        onChange={onChangeInput} 
                                    />
                                    <InputGroup.Text style={{ borderTopRightRadius: '12px', borderBottomRightRadius: '12px', background: '#F8FAFC', fontWeight: '700', fontSize: '12px', color: '#64748B' }}>
                                        INR
                                    </InputGroup.Text>
                                </InputGroup>
                                {errors['amount'] && <span className="text-danger fs-micro mt-1 d-block">{errors['amount']}</span>}
                            </div>

                            <div className="col-md-6">
                                <label className="form-label fw-bold fs-small text-dark">Payment Method <span className="text-danger">*</span></label>
                                <select 
                                    className="form-select" 
                                    style={{ height: '44px', borderRadius: '12px', background: '#F8FAFC', fontSize: '13.5px' }}
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="UPI">UPI / Digital Payment</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Card">Corporate Credit Card</option>
                                </select>
                            </div>

                            <div className="col-md-6">
                                <label className="form-label fw-bold fs-small text-dark">Paid By <span className="text-danger">*</span></label>
                                <select 
                                    className="form-select" 
                                    style={{ height: '44px', borderRadius: '12px', background: '#F8FAFC', fontSize: '13.5px' }}
                                    value={paidBy}
                                    onChange={(e) => setPaidBy(e.target.value)}
                                >
                                    <option value="Manoj S (Administrator)">Manoj S (Administrator)</option>
                                    <option value="Company Account">Company Account</option>
                                    <option value="Petty Cash Fund">Petty Cash Fund</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: EXPENSE DETAILS */}
                    <div className="exp-card">
                        <div className="exp-card-header">
                            <span className="exp-section-badge">2</span>
                            <h3 className="exp-card-title">Expense Details</h3>
                        </div>
                        <div>
                            <textarea 
                                name="details" 
                                className="form-control" 
                                rows={4}
                                placeholder="Enter details about this expense, business justification, or notes..."
                                style={{ borderRadius: '14px', background: '#F8FAFC', fontSize: '13.5px', padding: '14px' }}
                                onChange={onChangeInput}
                                value={expenseValue.details || ''} 
                            />
                            <div className="text-end text-muted fs-micro mt-1">{(expenseValue.details || '').length} / 500</div>
                        </div>
                    </div>

                    {/* SECTION 3: REAL FILE ATTACHMENTS */}
                    <div className="exp-card">
                        <div className="exp-card-header">
                            <span className="exp-section-badge">3</span>
                            <h3 className="exp-card-title">Attachments</h3>
                        </div>

                        <label className="exp-drop-zone mb-3 position-relative cursor-pointer d-block text-center">
                            <input
                                type="file"
                                multiple
                                className="position-absolute w-100 h-100 opacity-0 cursor-pointer"
                                style={{ top: 0, left: 0 }}
                                onChange={handleFileUpload}
                            />
                            <FontAwesomeIcon icon={faCloudArrowUp} style={{ fontSize: '32px', color: '#15803D', marginBottom: '8px' }} />
                            <div className="fw-bold text-dark fs-small">Drag & drop files here or click to upload</div>
                            <div className="fs-micro text-muted mt-1">Supported formats: PDF, JPG, PNG (Max. 10MB each)</div>
                        </label>

                        {attachedFiles && attachedFiles.length > 0 ? (
                            <div className="d-flex flex-column gap-2">
                                {attachedFiles.map((file, idx) => (
                                    <div className="exp-file-chip" key={idx}>
                                        <div className="d-flex align-items-center gap-2">
                                            <FontAwesomeIcon 
                                                icon={file.type.includes("pdf") ? faFilePdf : file.type.includes("image") ? faFileImage : faFile} 
                                                className={file.type.includes("pdf") ? "text-danger fs-5" : "text-success fs-5"} 
                                            />
                                            <div>
                                                <div className="fw-bold text-dark fs-micro">{file.name}</div>
                                                <div className="fs-micro text-muted">{(file.size / 1024).toFixed(1)} KB</div>
                                            </div>
                                        </div>
                                        <FontAwesomeIcon icon={faXmark} className="text-muted cursor-pointer" onClick={() => removeFile(idx)} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-muted text-center py-2 fs-micro">
                                No attachments added yet. Drag & drop or click above to upload receipts.
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── BOTTOM ACTION BUTTONS BAR ────────────────────────── */}
                <div className="exp-footer-actions">
                    <button 
                        type="button" 
                        className="btn btn-outline-danger px-4 rounded-pill fw-bold"
                        style={{ height: '44px' }}
                        onClick={() => navigate('/app/expenses')}
                    >
                        <FontAwesomeIcon icon={faXmark} /> Cancel
                    </button>
                    <div className="d-flex align-items-center gap-2">
                        <button 
                            type="submit" 
                            className="exp-btn-primary"
                            onClick={onSubmit}
                        >
                            <FontAwesomeIcon icon={faFloppyDisk} />
                            <span>{isEdit ? 'Update Expense' : 'Save Expense'}</span>
                        </button>
                    </div>
                </div>
            </Form>
        </div>
    );
};

const mapStateToProps = ( state ) => {
    const { frontSetting } = state;
    return { frontSetting };
};

export default connect( mapStateToProps, { editExpense } )( ExpenseForm );
