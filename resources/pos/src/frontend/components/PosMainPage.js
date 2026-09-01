import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Table } from "react-bootstrap-v5";
import { connect, useDispatch, useSelector } from "react-redux";
import moment from "moment";
import { useReactToPrint } from "react-to-print";
import { useNavigate } from "react-router";

// Components
import Category from "./Category";
import Brands from "./Brand";
import Product from "./product/Product";
import ProductCartList from "./cart-product/ProductCartList";
import ProductSearchbar from "./product/ProductSearchbar";
import CartItemMainCalculation from "./cart-product/CartItemMainCalculation";
import PosHeader from "./header/PosHeader";
import CustomerDropDown from "./pos-dropdown/CustomerDropdown";
import WarehouseDropDown from "./pos-dropdown/WarehouseDropDown";
import PaymentButton from "./cart-product/PaymentButton";
import CashPaymentModel from "./cart-product/paymentModel/CashPaymentModel";
import PrintData from "./printModal/PrintData";
import PaymentSlipModal from "./paymentSlipModal/PaymentSlipModal";
import HeaderAllButton from "./header/HeaderAllButton";
import RegisterDetailsModel from "./register-detailsModal/RegisterDetailsModel";
import PrintRegisterDetailsData from "./printModal/PrintRegisterDetailsData";
import TabTitle from "../../shared/tab-title/TabTitle";
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";
import CustomerForm from "./customerModel/CustomerForm";
import HoldListModal from "./holdListModal/HoldListModal";
import ProductDetailsModel from "../shared/ProductDetailsModel";
import PosCloseRegisterDetailsModel from "../../components/posRegister/PosCloseRegisterDetailsModel.js";
import RegisterDropdown from "./header/RegisterDropdown";
import OpenRegisterWorkspace from "./openRegister/OpenRegisterWorkspace";
import PosPageSkeleton from "../../shared/components/skeletons/PosPageSkeleton";
import { isPageFirstLoad, markPageAnimated } from "../../components/dashboard/dashboardAnimationState";

// Actions
import { posSearchNameProduct, posSearchCodeProduct } from "../../store/action/pos/posfetchProductAction";
import { prepareCartArray } from "../shared/PrepareCartArray";
import { fetchFrontSetting } from "../../store/action/frontSettingAction";
import { fetchSetting } from "../../store/action/settingAction";
import { calculateProductCost } from "../shared/SharedMethod";
import { fetchBrandClickable, posAllProduct } from "../../store/action/pos/posAllProductAction";
import { posCashPaymentAction } from "../../store/action/pos/posCashPaymentAction";
import { fetchHoldLists } from "../../store/action/pos/HoldListAction";
import { closeRegisterAction, fetchTodaySaleOverAllReport, getAllRegisterDetailsAction } from "../../store/action/pos/posRegisterDetailsAction";
import { getFormattedMessage, getFormattedOptions, currencySymbolHandling } from "../../shared/sharedMethod";
import { addToast } from "../../store/action/toastAction";
import { paymentMethodOptions, toastType, Tokens } from "../../constants";

// CSS
import "../../assets/css/pos-premium.css";

const PosMainPage = (props) => {
    const {
        onClickFullScreen,
        posAllProducts,
        customCart,
        posCashPaymentAction,
        frontSetting,
        fetchFrontSetting,
        settings,
        fetchSetting,
        paymentDetails,
        allConfigData,
        fetchBrandClickable,
        posAllTodaySaleOverAllReport,
        fetchHoldLists,
        holdListData,
        totalRecord = 0,
    } = props;

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const componentRef = useRef();
    const registerDetailsRef = useRef();
    const { closeRegisterDetails, getRegisterDetails } = useSelector((state) => state);
    const [showOpenRegisterWorkspace, setShowOpenRegisterWorkspace] = useState(false);
    const [hasSubmittedRegisterToday, setHasSubmittedRegisterToday] = useState(() => {
        return localStorage.getItem("pos_register_opened") === "true";
    });

    const isRegisterOpen = useMemo(() => {
        if (hasSubmittedRegisterToday) return true;
        if (localStorage.getItem("pos_register_opened") === "true") return true;

        if (!getRegisterDetails) return false;

        // If Redux returned object from API get-register-details
        if (typeof getRegisterDetails === 'object' && !Array.isArray(getRegisterDetails)) {
            if (getRegisterDetails.open_register === true) return true;
            if (getRegisterDetails.register_id !== undefined || (getRegisterDetails.cash_in_hand !== undefined && getRegisterDetails.open_register !== false)) return true;
        }

        // If Redux returned array
        if (Array.isArray(getRegisterDetails) && getRegisterDetails.length > 0) {
            const first = getRegisterDetails[0];
            if (first?.open_register === true || first?.id) return true;
        }

        return false;
    }, [getRegisterDetails, hasSubmittedRegisterToday]);

    const shouldShowOpenRegister = showOpenRegisterWorkspace ? true : !isRegisterOpen;

    const isLoadingSkeleton = false;

    const loggedInFirstName = localStorage.getItem(Tokens.UPDATED_FIRST_NAME) || localStorage.getItem(Tokens.FIRST_NAME) || 'Manoj';
    const loggedInLastName = localStorage.getItem(Tokens.UPDATED_LAST_NAME) || localStorage.getItem(Tokens.LAST_NAME) || 'S';
    const cashierFullName = `${loggedInFirstName} ${loggedInLastName}`.trim();
    const cashierInitials = cashierFullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'MS';

    // ─── Resizable Split Layout & State Persistence ───────────────────────────
    const [cartWidth, setCartWidth] = useState(() => {
        const saved = localStorage.getItem("pos_cart_width");
        return saved ? parseInt(saved, 10) : 420;
    });

    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem("pos_product_collapsed");
        return saved !== null ? saved === "true" : true;
    });

    const [isDragging, setIsDragging] = useState(false);
    const [currentTime, setCurrentTime] = useState(moment().format("hh:mm A"));

    // Real-time Clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(moment().format("hh:mm A")), 1000);
        return () => clearInterval(timer);
    }, []);

    // Toggle Collapse Mode
    const toggleCollapseProducts = useCallback(() => {
        setIsCollapsed((prev) => {
            const next = !prev;
            localStorage.setItem("pos_product_collapsed", next);
            return next;
        });
    }, []);

    // Dragging Divider Handlers
    const handleMouseDown = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging) return;
            const newWidth = Math.max(320, Math.min(e.clientX, window.innerWidth * 0.7));
            setCartWidth(newWidth);
            localStorage.setItem("pos_cart_width", newWidth);
        };

        const handleMouseUp = () => {
            if (isDragging) setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
            window.addEventListener("touchmove", handleMouseMove);
            window.addEventListener("touchend", handleMouseUp);
        }
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
            window.removeEventListener("touchmove", handleMouseMove);
            window.removeEventListener("touchend", handleMouseUp);
        };
    }, [isDragging]);

    // ─── Core POS State ───────────────────────────────────────────────────────
    const [updateProducts, setUpdateProducts] = useState([]);
    const [quantity, setQuantity] = useState(1);
    const [product, setProduct] = useState(null);
    const [cartProductIds, setCartProductIds] = useState([]);
    const [newCost, setNewCost] = useState("");
    const [paymentPrint, setPaymentPrint] = useState({});

    // Modal visibility
    const [cashPayment, setCashPayment] = useState(false);
    const [modalShowPaymentSlip, setModalShowPaymentSlip] = useState(false);
    const [modalShowCustomer, setModalShowCustomer] = useState(false);
    const [isOpenCartItemUpdateModel, setIsOpenCartItemUpdateModel] = useState(false);
    const [lgShow, setLgShow] = useState(false);
    const [holdShow, setHoldShow] = useState(false);
    const [showCloseDetailsModal, setShowCloseDetailsModal] = useState(false);

    // Filters & Selections
    const [brandId, setBrandId] = useState();
    const [categoryId, setCategoryId] = useState();
    const [selectedCustomerOption, setSelectedCustomerOption] = useState(null);
    const [selectedOption, setSelectedOption] = useState(null);
    const [productMsg, setProductMsg] = useState(0);
    const [updateHolList, setUpdateHoldList] = useState(false);
    const [hold_ref_no, setHold_ref_no] = useState("");

    // Cart calculations
    const [cartItemValue, setCartItemValue] = useState({ discount: 0, tax: 0, shipping: 0 });
    const [holdListId, setHoldListValue] = useState({ referenceNumber: "" });
    const [changeReturn, setChangeReturn] = useState(0);
    const [amountPaidInput, setAmountPaidInput] = useState("");

    // Payment
    const [cashPaymentValue, setCashPaymentValue] = useState({
        notes: "",
        payment_status: {
            label: getFormattedMessage("dashboard.recentSales.paid.label"),
            value: 1,
        },
    });
    const [errors, setErrors] = useState({ notes: "" });
    const paymentTypeFilterOptions = getFormattedOptions(paymentMethodOptions);
    const paymentTypeDefaultValue = paymentTypeFilterOptions.map((o) => ({ value: o.id, label: o.name }));
    const [paymentValue, setPaymentValue] = useState({ payment_type: paymentTypeDefaultValue[0] });

    const currencySymbol = (settings.attributes && settings.attributes.currency_symbol) || "₹";

    // ─── Computed Totals ─────────────────────────────────────────────────────
    const localCart = updateProducts.map((p) => Number(p.quantity));
    const totalQty = localCart.length > 0 ? localCart.reduce((a, b) => a + b) : 0;

    const localTotal = updateProducts.map((p) => calculateProductCost(p).toFixed(2) * p.quantity);
    const subTotal = localTotal.length > 0 ? localTotal.reduce((a, b) => a + b) : 0;

    const discountTotal = subTotal - cartItemValue.discount;
    const taxTotal = (discountTotal * cartItemValue.tax) / 100;
    const grandTotal = (Number(discountTotal + taxTotal) + Number(cartItemValue.shipping)).toFixed(2);
    const balanceAmount = amountPaidInput ? (Number(amountPaidInput) - Number(grandTotal)).toFixed(2) : "0.00";

    // ─── Effects ──────────────────────────────────────────────────────────────
    useEffect(() => {
        fetchSetting();
        fetchFrontSetting();
        fetchTodaySaleOverAllReport();
        fetchHoldLists();
        dispatch(getAllRegisterDetailsAction());
    }, []);

    useEffect(() => {
        setSelectedCustomerOption(
            settings.attributes && {
                value: Number(settings.attributes.default_customer),
                label: settings.attributes.customer_name,
            }
        );
        setSelectedOption(
            settings.attributes && {
                value: Number(settings.attributes.default_warehouse),
                label: settings.attributes.warehouse_name,
            }
        );
    }, [settings]);

    useEffect(() => {
        setPaymentPrint({
            ...paymentPrint,
            barcode_url: paymentDetails.attributes && paymentDetails.attributes.barcode_url,
            reference_code: paymentDetails.attributes && paymentDetails.attributes.reference_code,
        });
    }, [paymentDetails]);

    useEffect(() => {
        if (updateHolList) {
            fetchHoldLists();
            setUpdateHoldList(false);
        }
    }, [updateHolList]);

    useEffect(() => {
        if (selectedOption && selectedOption.value) {
            fetchBrandClickable(brandId, categoryId, selectedOption.value);
        } else {
            posAllProduct();
        }
    }, [selectedOption, brandId, categoryId]);

    // Full-screen POS mode (hides sidebar)
    useEffect(() => {
        document.body.classList.add("pos-fullscreen-active");
        return () => document.body.classList.remove("pos-fullscreen-active");
    }, []);

    // Focus search bar helper
    const focusSearchInput = () => {
        const el = document.querySelector(".pos-top-search-input, input[placeholder*='Search']");
        if (el) el.focus();
    };

    // Auto focus search on mount
    useEffect(() => {
        setTimeout(focusSearchInput, 300);
    }, []);

    // ─── Keyboard Shortcuts ───────────────────────────────────────────────────
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "F2") {
                e.preventDefault();
                setModalShowCustomer(true);
            } else if (e.key === "F3" || ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "k" || e.key.toLowerCase() === "f"))) {
                e.preventDefault();
                focusSearchInput();
            } else if (e.key === "F4" || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b")) {
                e.preventDefault();
                focusSearchInput();
            } else if (e.key === "F5" || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "h")) {
                e.preventDefault();
                setHoldShow(true);
            } else if (e.key === "F6" || (e.key === "F8" && isCollapsed) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p")) {
                e.preventDefault();
                if (updateProducts && updateProducts.length > 0) setCashPayment(true);
            } else if (e.key === "F7" || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s")) {
                e.preventDefault();
                if (updateProducts && updateProducts.length > 0) setHoldShow(true);
            } else if (e.key === "F9") {
                e.preventDefault();
                setLgShow(true);
            } else if (e.key === "F10") {
                e.preventDefault();
                handleClickCloseRegister();
            } else if (e.key === "F11") {
                e.preventDefault();
                toggleCollapseProducts();
            } else if (e.key === "F12") {
                e.preventDefault();
                onClickFullScreen();
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r") {
                e.preventDefault();
                if (updateProducts && updateProducts.length > 0) {
                    setUpdateProducts([]);
                    setCartItemValue({ discount: 0, tax: 0, shipping: 0 });
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [updateProducts, isCollapsed, toggleCollapseProducts, onClickFullScreen]);

    // ─── Handlers ─────────────────────────────────────────────────────────────
    const updateCart = (cartProducts) => {
        setUpdateProducts(cartProducts);
        setTimeout(focusSearchInput, 100);
    };
    const addToCarts = (items) => updateCart(items);
    const setCategory = (item) => setCategoryId(item);
    const setBrand = (item) => setBrandId(item);
    const updatedQty = (qty) => setQuantity(qty);
    const updateCost = (item) => setNewCost(item);

    const onDeleteCartItem = (productId) => {
        updateCart(updateProducts.filter((e) => e.id !== productId));
    };

    const openProductDetailModal = () => setIsOpenCartItemUpdateModel(!isOpenCartItemUpdateModel);

    const onClickUpdateItemInCart = (item) => {
        setProduct(item);
        setIsOpenCartItemUpdateModel(true);
    };

    const onProductUpdateInCart = () => {
        updateCart(updateProducts.slice());
    };

    const onClickDetailsModel = () => setLgShow(true);
    const onClickHoldModel = () => setHoldShow(true);

    const handleClickCloseRegister = () => {
        dispatch(getAllRegisterDetailsAction());
        setShowCloseDetailsModal(true);
    };

    const handleCloseRegisterDetails = (data) => {
        if (data.cash_in_hand_while_closing.toString().trim().length === 0) {
            dispatch(addToast({
                text: getFormattedMessage("pos.cclose-register.enter-total-cash.message"),
                type: toastType.ERROR,
            }));
        } else {
            localStorage.removeItem("pos_register_opened");
            setHasSubmittedRegisterToday(false);
            setShowCloseDetailsModal(false);
            dispatch(closeRegisterAction(data, navigate));
        }
    };

    // ─── Payment Handlers ─────────────────────────────────────────────────────
    const onChangeInput = (e) => {
        e.preventDefault();
        setCashPaymentValue((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const onPaymentStatusChange = (obj) => setCashPaymentValue((prev) => ({ ...prev, payment_status: obj }));
    const onPaymentTypeChange = (obj) => setPaymentValue({ ...paymentValue, payment_type: obj });
    const onChangeReturnChange = (change) => setChangeReturn(change);

    const onChangeCart = (event) => {
        const { value } = event.target;
        if (value.match(/\./g)) {
            const [, decimal] = value.split(".");
            if (decimal?.length > 2) return;
        }
        setCartItemValue((prev) => ({ ...prev, [event.target.name]: value }));
    };

    const onChangeTaxCart = (event) => {
        const val = Math.max(0, Math.min(100, Number(event.target.value)));
        setCartItemValue((prev) => ({ ...prev, [event.target.name]: val }));
    };

    const handleValidation = () => {
        let errs = {};
        let isValid = true;
        if (cashPaymentValue.notes && cashPaymentValue.notes.length > 100) {
            errs.notes = "The notes must not be greater than 100 characters";
            isValid = false;
        }
        setErrors(errs);
        return isValid;
    };

    const handleCashPayment = () => {
        setCashPaymentValue({
            notes: "",
            payment_status: {
                label: getFormattedMessage("dashboard.recentSales.paid.label"),
                value: 1,
            },
        });
        setCashPayment(false);
    };

    const preparePrintData = () => ({
        products: updateProducts,
        discount: cartItemValue.discount || 0,
        tax: cartItemValue.tax || 0,
        cartItemPrint: cartItemValue,
        taxTotal,
        grandTotal,
        shipping: cartItemValue.shipping,
        subTotal,
        frontSetting,
        customer_name: selectedCustomerOption,
        settings,
        note: cashPaymentValue.notes,
        changeReturn,
        payment_status: cashPaymentValue.payment_status,
    });

    const prepareData = (products) => ({
        date: moment(new Date()).format("YYYY-MM-DD"),
        customer_id: selectedCustomerOption && selectedCustomerOption[0]
            ? selectedCustomerOption[0].value
            : selectedCustomerOption && selectedCustomerOption.value,
        warehouse_id: selectedOption && selectedOption[0]
            ? selectedOption[0].value
            : selectedOption && selectedOption.value,
        sale_items: products,
        grand_total: grandTotal,
        payment_type: paymentValue?.payment_type?.value,
        discount: cartItemValue.discount,
        shipping: cartItemValue.shipping,
        tax_rate: cartItemValue.tax,
        note: cashPaymentValue.notes,
        status: 1,
        hold_ref_no,
        payment_status: cashPaymentValue?.payment_status?.value,
    });

    const onCashPayment = (event) => {
        event.preventDefault();
        if (!handleValidation()) return;
        posCashPaymentAction(
            prepareData(updateProducts),
            setUpdateProducts,
            setModalShowPaymentSlip,
            posAllProduct,
            { brandId, categoryId, selectedOption }
        );
        setCashPayment(false);
        setPaymentPrint(preparePrintData());
        setCartItemValue({ discount: 0, tax: 0, shipping: 0 });
        setCashPaymentValue({
            notes: "",
            payment_status: {
                label: getFormattedMessage("dashboard.recentSales.paid.label"),
                value: 1,
            },
        });
        setCartProductIds("");
        setTimeout(focusSearchInput, 300);
    };

    // ─── Print ────────────────────────────────────────────────────────────────
    const handlePrint = useReactToPrint({ content: () => componentRef.current });
    const handleRegisterDetailsPrint = useReactToPrint({ content: () => registerDetailsRef.current });
    const printPaymentReceiptPdf = () => document.getElementById("printReceipt").click();
    const printRegisterDetails = () => document.getElementById("printRegisterDetailsId").click();

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="pos-enterprise-wrapper">
            <TabTitle title="⚡ POS — Enterprise Billing" />
            <TopProgressBar />

            {/* Hidden print blocks */}
            <div className="d-none">
                <button id="printReceipt" onClick={handlePrint}>Print</button>
                <PrintData
                    ref={componentRef}
                    paymentType={paymentValue.payment_type.label}
                    allConfigData={allConfigData}
                    updateProducts={paymentPrint}
                />
            </div>
            <div className="d-none">
                <button id="printRegisterDetailsId" onClick={handleRegisterDetailsPrint}>Print</button>
                <PrintRegisterDetailsData
                    ref={registerDetailsRef}
                    allConfigData={allConfigData}
                    frontSetting={frontSetting}
                    posAllTodaySaleOverAllReport={posAllTodaySaleOverAllReport}
                    updateProducts={paymentPrint}
                    closeRegisterDetails={closeRegisterDetails}
                />
            </div>
            <div className="d-none">
                <PaymentSlipModal
                    printPaymentReceiptPdf={printPaymentReceiptPdf}
                    setPaymentValue={setPaymentValue}
                    setModalShowPaymentSlip={setModalShowPaymentSlip}
                    settings={settings}
                    frontSetting={frontSetting}
                    modalShowPaymentSlip={modalShowPaymentSlip}
                    allConfigData={allConfigData}
                    paymentDetails={paymentDetails}
                    updateProducts={paymentPrint}
                    paymentType={paymentValue.payment_type.label}
                    paymentTypeDefaultValue={paymentTypeDefaultValue}
                />
            </div>

            {/* ── TOP NAVIGATION BAR ── */}
            <header className="pos-top-nav" style={{ position: "relative", zIndex: 2000, overflow: "visible" }}>
                <a href="#/app/dashboard" className="pos-brand-logo">
                    <i className="bi bi-cpu-fill" />
                    <span>infy-pos</span>
                </a>
                <span className="pos-mode-tag me-2">
                    <i className="bi bi-lightning-charge-fill" /> POS Mode
                </span>

                {/* Main Search Bar */}
                <div style={{ flex: 1, maxWidth: "560px", position: "relative", zIndex: 2000, overflow: "visible" }}>
                    <ProductSearchbar
                        customCart={customCart}
                        setUpdateProducts={setUpdateProducts}
                        updateProducts={updateProducts}
                    />
                </div>

                {/* Toolbar Tools */}
                <div className="pos-top-tools">
                    <HeaderAllButton
                        holdListData={holdListData}
                        goToHoldScreen={onClickHoldModel}
                        goToDetailScreen={onClickDetailsModel}
                        onClickFullScreen={onClickFullScreen}
                        opneCalculator={false}
                        setOpneCalculator={() => {}}
                        handleClickCloseRegister={handleClickCloseRegister}
                        frontSetting={frontSetting}
                        allConfigData={allConfigData}
                    />

                    {/* Collapse / Show Products Toggle */}
                    <button
                        type="button"
                        className={`btn btn-sm ${isCollapsed ? "btn-success text-white" : "btn-light border"} fw-bold d-flex align-items-center gap-1`}
                        style={{ fontSize: "11px", borderRadius: "8px", height: "32px" }}
                        onClick={toggleCollapseProducts}
                        title="Toggle Product Panel (F11)"
                    >
                        <i className={`bi ${isCollapsed ? "bi-grid-3x3-gap-fill" : "bi-arrows-angle-contract"}`} />
                        {isCollapsed ? "Show Products F11" : "Collapse"}
                    </button>

                    <div className="pos-online-indicator ms-1">
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#16A34A", display: "inline-block" }} />
                        {" "}Online
                    </div>
                    <div className="pos-user-profile-badge">
                        <div className="pos-user-avatar">{cashierInitials}</div>
                        <div className="pos-user-details">
                            <span className="pos-user-name">{cashierFullName}</span>
                            <span className="pos-user-role">Cashier / Executive</span>
                        </div>
                    </div>
                </div>
            </header>

            {isLoadingSkeleton ? (
                <PosPageSkeleton />
            ) : shouldShowOpenRegister ? (
                <OpenRegisterWorkspace
                    onCompleteOpenRegister={() => {
                        localStorage.setItem("pos_register_opened", "true");
                        setHasSubmittedRegisterToday(true);
                        setShowOpenRegisterWorkspace(false);
                        dispatch(getAllRegisterDetailsAction());
                    }}
                    allConfigData={allConfigData}
                    frontSetting={frontSetting}
                    settings={settings}
                />
            ) : isCollapsed ? (
                /* ─── COLLAPSE MODE: ULTRA ENTERPRISE SUPERMARKET WORKSPACE (REF IMG #2) ─── */
                <div className="d-flex flex-column flex-fill overflow-hidden" style={{ background: "#F8FAFC" }}>

                    {/* Top Enterprise Info Bar (Customer, Warehouse, Cashier, Invoice, Date, Time) */}
                    <div className="pos-collapse-bar" style={{ position: "relative", zIndex: 5000, overflow: "visible" }}>
                        {/* Customer Header Box */}
                        <div className="pos-collapse-card-box flex-fill" style={{ minWidth: "240px", maxWidth: "320px", height: "48px" }}>
                            <CustomerDropDown
                                setSelectedCustomerOption={setSelectedCustomerOption}
                                selectedCustomerOption={selectedCustomerOption}
                                customerModel={setModalShowCustomer}
                                updateCustomer={modalShowCustomer}
                            />
                        </div>

                        {/* Warehouse DropDown Box */}
                        <div className="pos-collapse-card-box flex-fill" style={{ minWidth: "220px", maxWidth: "300px", height: "48px" }}>
                            <WarehouseDropDown
                                setSelectedOption={setSelectedOption}
                                selectedOption={selectedOption}
                            />
                        </div>

                        {/* Cashier Box */}
                        <div className="pos-collapse-card-box">
                            <i className="bi bi-person-badge text-success" />
                            <div className="d-flex flex-column line-height-1">
                                <span style={{ fontSize: "9px", color: "#64748B", fontWeight: 600 }}>Cashier</span>
                                <span style={{ fontSize: "12px", fontWeight: 700, color: "#0F172A" }}>{cashierFullName}</span>
                            </div>
                        </div>

                        {/* Invoice Code */}
                        <div className="pos-collapse-card-box">
                            <i className="bi bi-receipt text-warning" />
                            <div className="d-flex flex-column line-height-1">
                                <span style={{ fontSize: "9px", color: "#64748B", fontWeight: 600 }}>Invoice</span>
                                <span style={{ fontSize: "12px", fontWeight: 700, color: "#0F172A" }}>{`${(settings?.attributes?.sale_code || 'INV').replace(/[-_]/g, '')}-111${(totalRecord || 29) + 1}`}</span>
                            </div>
                        </div>

                        {/* Date */}
                        <div className="pos-collapse-card-box">
                            <i className="bi bi-calendar3 text-info" />
                            <div className="d-flex flex-column line-height-1">
                                <span style={{ fontSize: "9px", color: "#64748B", fontWeight: 600 }}>Date</span>
                                <span style={{ fontSize: "12px", fontWeight: 700, color: "#0F172A" }}>{moment().format("DD MMM YYYY")}</span>
                            </div>
                        </div>

                        {/* Time */}
                        <div className="pos-collapse-card-box">
                            <i className="bi bi-clock text-danger" />
                            <div className="d-flex flex-column line-height-1">
                                <span style={{ fontSize: "9px", color: "#64748B", fontWeight: 600 }}>Time</span>
                                <span style={{ fontSize: "12px", fontWeight: 700, color: "#0F172A" }}>{currentTime}</span>
                            </div>
                        </div>

                        {/* Register Dropdown Button right next to Time */}
                        <div className="ms-1">
                            <RegisterDropdown
                                isRegisterOpen={isRegisterOpen}
                                handleOpenRegister={() => setShowOpenRegisterWorkspace(true)}
                                handleCloseRegister={handleClickCloseRegister}
                                goToHoldScreen={onClickHoldModel}
                                setShowROAlertModel={() => {}}
                            />
                        </div>

                        {/* Right Toggle Button */}
                        <div className="ms-auto d-flex align-items-center gap-2">
                            <button
                                type="button"
                                className="btn btn-outline-success btn-sm fw-bold d-flex align-items-center gap-1"
                                style={{ borderRadius: "8px", height: "36px", fontSize: "12px" }}
                                onClick={toggleCollapseProducts}
                            >
                                <i className="bi bi-grid-3x3-gap-fill" /> Show Products <span className="badge bg-success text-white ms-1">F11</span>
                            </button>
                            <button
                                type="button"
                                className="btn btn-light border btn-sm p-2"
                                style={{ borderRadius: "8px", height: "36px", width: "36px" }}
                                onClick={onClickFullScreen}
                                title="Fullscreen"
                            >
                                <i className="bi bi-arrows-fullscreen" />
                            </button>
                        </div>
                    </div>

                    {/* Main Workspace Body */}
                    <div className="pos-collapse-workspace">

                        {/* ── LEFT SECTION: CART TABLE & ACTIONS (70%) ── */}
                        <div className="pos-collapse-left">
                            <div className="bg-white border rounded-3 d-flex flex-column flex-fill" style={{ borderColor: "#E2E8F0", overflow: "visible", position: "relative", zIndex: 10 }}>
                                <div className="pos-cart-bar">
                                    <div className="pos-cart-bar-title d-flex align-items-center gap-2">
                                        <i className="bi bi-cart3 text-success" />
                                        <span>Current Cart</span>
                                        <span className="pos-cart-count-chip">{updateProducts.length} Items</span>
                                    </div>
                                    {updateProducts.length > 0 && (
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-link text-danger text-decoration-none fw-bold p-0"
                                            style={{ fontSize: "11px" }}
                                            onClick={() => {
                                                setUpdateProducts([]);
                                                setCartItemValue({ discount: 0, tax: 0, shipping: 0 });
                                            }}
                                        >
                                            <i className="bi bi-trash3 me-1" />Clear Cart
                                        </button>
                                    )}
                                </div>

                                {/* Cart Table */}
                                <div className="pos-cart-items-scroll flex-fill">
                                    <Table className="mb-0 pos-cart-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: "36px" }}>#</th>
                                                <th>ITEM DETAILS</th>
                                                <th className="text-center" style={{ width: "90px" }}>QTY</th>
                                                <th>PRICE</th>
                                                <th style={{ width: "80px" }}>DISC %</th>
                                                <th style={{ width: "80px" }}>TAX %</th>
                                                <th className="text-end">TOTAL</th>
                                                <th style={{ width: "36px" }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {updateProducts.length > 0 ? (
                                                updateProducts.map((item, index) => (
                                                    <ProductCartList
                                                        singleProduct={item}
                                                        key={item.id}
                                                        index={index}
                                                        posAllProducts={posAllProducts}
                                                        onClickUpdateItemInCart={onClickUpdateItemInCart}
                                                        updatedQty={updatedQty}
                                                        updateCost={updateCost}
                                                        onDeleteCartItem={onDeleteCartItem}
                                                        quantity={quantity}
                                                        frontSetting={frontSetting}
                                                        newCost={newCost}
                                                        allConfigData={allConfigData}
                                                        setUpdateProducts={setUpdateProducts}
                                                    />
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={8} style={{ padding: "48px 16px", textAlign: "center" }}>
                                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", color: "#94A3B8" }}>
                                                            <div style={{ width: "64px", height: "64px", background: "#F1F5F9", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px" }}>
                                                                🛒
                                                            </div>
                                                            <span style={{ fontSize: "16px", fontWeight: 800, color: "#0F172A" }}>Ready to Start Billing</span>
                                                            <span style={{ fontSize: "12px", color: "#64748B" }}>Scan a barcode or search a product to begin</span>
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-success fw-bold px-3 py-2 mt-2"
                                                                style={{ borderRadius: "8px", background: "#16A34A" }}
                                                                onClick={focusSearchInput}
                                                            >
                                                                <i className="bi bi-barcode me-1" /> Scan Barcode (Ctrl+B)
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </div>

                                 {/* Scan Barcode / Search Live Product Autocomplete */}
                                <div className="p-2 border-top bg-light" style={{ position: "relative", zIndex: 10, overflow: "visible" }}>
                                    <ProductSearchbar
                                        customCart={customCart}
                                        setUpdateProducts={setUpdateProducts}
                                        updateProducts={updateProducts}
                                        dropUp={true}
                                    />
                                </div>
                            </div>

                            {/* Order Note + Quick Actions */}
                            <div className="row g-2">
                                <div className="col-5">
                                    <div className="bg-white border rounded-3 p-2 h-100 d-flex flex-column" style={{ borderColor: "#E2E8F0" }}>
                                        <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                                            Order Note (Optional)
                                        </label>
                                        <textarea
                                            className="form-control form-control-sm flex-fill"
                                            rows={2}
                                            placeholder="Add any note for this order..."
                                            style={{ fontSize: "11px" }}
                                        />
                                    </div>
                                </div>

                                <div className="col-7">
                                    <div className="bg-white border rounded-3 p-2 h-100" style={{ borderColor: "#E2E8F0" }}>
                                        <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                                            Quick Actions
                                        </label>
                                        <div className="d-flex align-items-center gap-2 flex-wrap">
                                            <button type="button" className="quick-action-pill" onClick={() => setModalShowCustomer(true)}>
                                                <i className="bi bi-person text-success" /> Customer <span className="badge bg-secondary ms-1">F2</span>
                                            </button>
                                            <button type="button" className="quick-action-pill" onClick={onClickDetailsModel}>
                                                <i className="bi bi-clock-history text-primary" /> Recent Bills <span className="badge bg-secondary ms-1">Alt+R</span>
                                            </button>
                                            <button type="button" className="quick-action-pill" onClick={onClickHoldModel}>
                                                <i className="bi bi-pause-circle text-warning" /> Hold Bills <span className="badge bg-secondary ms-1">F7</span>
                                            </button>
                                            <button type="button" className="quick-action-pill">
                                                <i className="bi bi-tag text-purple" /> Price Check <span className="badge bg-secondary ms-1">F9</span>
                                            </button>
                                            <button type="button" className="quick-action-pill">
                                                <i className="bi bi-calculator text-info" /> Calculator <span className="badge bg-secondary ms-1">F6</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── RIGHT SECTION: BILL SUMMARY & PAY PANEL (30%) ── */}
                        <div className="pos-collapse-right">

                            {/* Bill Summary Card */}
                            <div className="bill-summary-container">
                                <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                                    <h5 className="m-0 fw-bold" style={{ fontSize: "15px", color: "#0F172A" }}>Bill Summary</h5>
                                    <span className="badge bg-success bg-opacity-10 text-success fw-bold px-2 py-1" style={{ borderRadius: "6px" }}>
                                        {totalQty} Items
                                    </span>
                                </div>

                                <div className="bill-summary-row">
                                    <span>Subtotal ({updateProducts.length} Items)</span>
                                    <span className="fw-bold">{currencySymbolHandling(allConfigData, currencySymbol, subTotal || "0.00")}</span>
                                </div>

                                <div className="bill-summary-row">
                                    <span>Discount</span>
                                    <div className="d-flex align-items-center gap-1" style={{ width: "100px" }}>
                                        <input
                                            type="number"
                                            name="discount"
                                            value={cartItemValue.discount}
                                            onChange={onChangeCart}
                                            className="form-control form-control-sm py-0 px-2 text-end fw-bold"
                                            style={{ fontSize: "11px" }}
                                        />
                                    </div>
                                </div>

                                <div className="bill-summary-row">
                                    <span>Coupon Discount</span>
                                    <span className="text-success fw-bold cursor-pointer" style={{ fontSize: "11px" }}>❖ Apply Coupon</span>
                                </div>

                                <div className="bill-summary-row">
                                    <span>Loyalty Discount</span>
                                    <span className="text-success fw-bold cursor-pointer" style={{ fontSize: "11px" }}>❖ Apply Points</span>
                                </div>

                                <div className="bill-summary-row">
                                    <span>Tax ({cartItemValue.tax || 0}%)</span>
                                    <span className="fw-bold">{currencySymbolHandling(allConfigData, currencySymbol, taxTotal || "0.00")}</span>
                                </div>

                                <div className="bill-summary-row">
                                    <span>Shipping</span>
                                    <div className="d-flex align-items-center gap-1" style={{ width: "100px" }}>
                                        <input
                                            type="number"
                                            name="shipping"
                                            value={cartItemValue.shipping}
                                            onChange={onChangeCart}
                                            className="form-control form-control-sm py-0 px-2 text-end fw-bold"
                                            style={{ fontSize: "11px" }}
                                        />
                                    </div>
                                </div>

                                <div className="bill-summary-row grand-total">
                                    <span>Grand Total</span>
                                    <span className="val">
                                        {currencySymbolHandling(allConfigData, currencySymbol, grandTotal)}
                                    </span>
                                </div>

                                {/* Amount Paid & Balance Input */}
                                <div className="mt-3 p-2 border rounded-3" style={{ background: "#F0FDF4", borderColor: "#DCFCE7" }}>
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                        <span style={{ fontSize: "12px", fontWeight: 700, color: "#166534" }}>Amount Paid</span>
                                        <div style={{ width: "120px" }}>
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                value={amountPaidInput}
                                                onChange={(e) => setAmountPaidInput(e.target.value)}
                                                className="form-control form-control-sm text-end fw-bold border-success"
                                                style={{ fontSize: "13px" }}
                                            />
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <span style={{ fontSize: "12px", fontWeight: 700, color: "#166534" }}>Balance</span>
                                        <span style={{ fontSize: "14px", fontWeight: 800, color: "#15803D" }}>
                                            {currencySymbolHandling(allConfigData, currencySymbol, balanceAmount)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Huge Pay Now Button */}
                            <button
                                type="button"
                                className="pay-now-btn-huge"
                                onClick={() => {
                                    if (updateProducts && updateProducts.length > 0) setCashPayment(true);
                                }}
                            >
                                <i className="bi bi-credit-card-fill" /> PAY NOW (F8)
                            </button>

                            {/* Action Buttons Row */}
                            <div className="d-flex align-items-center gap-2">
                                <button type="button" className="btn btn-sm btn-outline-warning fw-bold flex-fill py-2" onClick={onClickHoldModel}>
                                    <i className="bi bi-pause-fill me-1" /> Hold (F7)
                                </button>
                                <button type="button" className="btn btn-sm btn-outline-primary fw-bold flex-fill py-2" onClick={onClickHoldModel}>
                                    <i className="bi bi-file-earmark me-1" /> Draft (F8)
                                </button>
                                <button type="button" className="btn btn-sm btn-outline-danger fw-bold flex-fill py-2" onClick={() => setUpdateProducts([])}>
                                    <i className="bi bi-trash3 me-1" /> Clear
                                </button>
                            </div>
                        </div>

                    </div>

                    {/* Bottom Status & Shortcuts Footer */}
                    <div className="pos-bottom-bar border-top bg-white py-2 px-3">
                        <div className="d-flex align-items-center justify-content-between w-100">
                            <div className="d-flex align-items-center gap-3 overflow-auto" style={{ fontSize: "11px", color: "#64748B" }}>
                                <strong className="text-dark">Shortcuts:</strong>
                                <span>F2 Customer</span>
                                <span>F4 Barcode</span>
                                <span>F5 QR Scan</span>
                                <span>F6 Calculator</span>
                                <span>F7 Hold</span>
                                <span>F8 Draft</span>
                                <span>F9 Price Check</span>
                                <span>F10 Cash Drawer</span>
                                <span>F11 Toggle Products</span>
                                <span>F12 Full Screen</span>
                            </div>
                            <div className="d-flex align-items-center gap-1 text-muted" style={{ fontSize: "11px", whiteSpace: "nowrap" }}>
                                <i className="bi bi-wifi text-success" /> Last Synced: {currentTime}
                            </div>
                        </div>
                    </div>

                </div>
            ) : (
                /* ─── SPLIT MODE: CART + PRODUCTS SIDE BY SIDE ─── */
                <div className="pos-split-container">

                    {/* ─── LEFT PANEL (Cart) ─── */}
                    <div
                        className="pos-left-panel"
                        style={{
                            width: `${cartWidth}px`,
                            flex: "none",
                        }}
                    >
                        {/* Customer + Warehouse */}
                        <div className="p-2 bg-white border-bottom">
                            <PosHeader
                                setSelectedCustomerOption={setSelectedCustomerOption}
                                selectedCustomerOption={selectedCustomerOption}
                                setSelectedOption={setSelectedOption}
                                selectedOption={selectedOption}
                                customerModel={setModalShowCustomer}
                                updateCustomer={modalShowCustomer}
                            />
                        </div>

                        {/* Cart Header */}
                        <div className="pos-cart-bar">
                            <div className="pos-cart-bar-title d-flex align-items-center gap-2">
                                <span>Current Cart</span>
                                <span className="pos-cart-count-chip">{updateProducts.length} Items</span>
                            </div>
                            {updateProducts.length > 0 && (
                                <button
                                    type="button"
                                    className="btn btn-sm btn-link text-danger text-decoration-none fw-bold p-0"
                                    style={{ fontSize: "11px" }}
                                    onClick={() => {
                                        setUpdateProducts([]);
                                        setCartItemValue({ discount: 0, tax: 0, shipping: 0 });
                                    }}
                                >
                                    <i className="bi bi-trash3 me-1" />Clear Cart
                                </button>
                            )}
                        </div>

                        {/* Cart Items */}
                        <div className="pos-cart-items-scroll">
                            <Table className="mb-0 pos-cart-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: "36px" }}>#</th>
                                        <th>ITEM</th>
                                        <th className="text-center" style={{ width: "76px" }}>QTY</th>
                                        <th>PRICE</th>
                                        <th style={{ width: "55px" }}>DISC %</th>
                                        <th style={{ width: "55px" }}>TAX %</th>
                                        <th className="text-end">SUBTOTAL</th>
                                        <th style={{ width: "28px" }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {updateProducts.length > 0 ? (
                                        updateProducts.map((item, index) => (
                                            <ProductCartList
                                                singleProduct={item}
                                                key={item.id}
                                                index={index}
                                                posAllProducts={posAllProducts}
                                                onClickUpdateItemInCart={onClickUpdateItemInCart}
                                                updatedQty={updatedQty}
                                                updateCost={updateCost}
                                                onDeleteCartItem={onDeleteCartItem}
                                                quantity={quantity}
                                                frontSetting={frontSetting}
                                                newCost={newCost}
                                                allConfigData={allConfigData}
                                                setUpdateProducts={setUpdateProducts}
                                            />
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={8} style={{ padding: "36px 16px", textAlign: "center" }}>
                                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", color: "#94A3B8" }}>
                                                    <div style={{ width: "48px", height: "48px", background: "#F1F5F9", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>
                                                        🛒
                                                    </div>
                                                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#0F172A" }}>Cart is empty</span>
                                                    <span style={{ fontSize: "11px", color: "#64748B" }}>Click products to add to cart</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </div>

                        {/* Order Note */}
                        <button type="button" className="pos-order-note-btn">
                            + Add Order Note
                        </button>

                        {/* Tax / Discount / Shipping + Totals */}
                        <CartItemMainCalculation
                            totalQty={totalQty}
                            subTotal={subTotal}
                            grandTotal={grandTotal}
                            cartItemValue={cartItemValue}
                            onChangeCart={onChangeCart}
                            allConfigData={allConfigData}
                            frontSetting={frontSetting}
                            onChangeTaxCart={onChangeTaxCart}
                        />

                        {/* Payment Buttons */}
                        <div className="p-2 border-top bg-white">
                            <PaymentButton
                                updateProducts={updateProducts}
                                updateCart={addToCarts}
                                setUpdateProducts={setUpdateProducts}
                                setCartItemValue={setCartItemValue}
                                setCashPayment={setCashPayment}
                                cartItemValue={cartItemValue}
                                grandTotal={grandTotal}
                                subTotal={subTotal}
                                selectedOption={selectedOption}
                                cashPaymentValue={cashPaymentValue}
                                holdListId={holdListId}
                                setHoldListValue={setHoldListValue}
                                selectedCustomerOption={selectedCustomerOption}
                                setUpdateHoldList={setUpdateHoldList}
                            />
                        </div>
                    </div>

                    {/* ─── DRAGGABLE DIVIDER HANDLE ─── */}
                    <div
                        className={`pos-drag-handle ${isDragging ? "dragging" : ""}`}
                        onMouseDown={handleMouseDown}
                        onTouchStart={handleMouseDown}
                        title="Drag left or right to resize cart width"
                    />

                    {/* ─── RIGHT PANEL (Products) ─── */}
                    <div className="pos-right-panel">

                        {/* Category + Brand Chips */}
                        <div className="pos-filters-bar">
                            <Category setCategory={setCategory} brandId={brandId} selectedOption={selectedOption} />
                            <Brands categoryId={categoryId} setBrand={setBrand} selectedOption={selectedOption} />
                        </div>

                        {/* Sub-filter bar */}
                        <div className="pos-grid-header border-bottom bg-white py-2 px-3">
                            <div className="d-flex align-items-center gap-2 flex-fill me-2">
                                <div className="input-group input-group-sm" style={{ maxWidth: "200px" }}>
                                    <span className="input-group-text bg-light border-end-0">
                                        <i className="bi bi-search text-muted" />
                                    </span>
                                    <input
                                        type="text"
                                        className="form-control bg-light border-start-0"
                                        placeholder="Search within products..."
                                        style={{ fontSize: "11px" }}
                                    />
                                </div>
                                <div className="d-flex align-items-center gap-1">
                                    <span style={{ fontSize: "10px", color: "#64748B", fontWeight: 600, whiteSpace: "nowrap" }}>Stock Status</span>
                                    <select className="form-select form-select-sm py-0" style={{ fontSize: "11px", height: "28px", width: "80px" }}>
                                        <option>All</option>
                                        <option>In Stock</option>
                                        <option>Low Stock</option>
                                    </select>
                                </div>
                                <div className="d-flex align-items-center gap-1">
                                    <span style={{ fontSize: "10px", color: "#64748B", fontWeight: 600, whiteSpace: "nowrap" }}>Price Range</span>
                                    <select className="form-select form-select-sm py-0" style={{ fontSize: "11px", height: "28px", width: "90px" }}>
                                        <option>All</option>
                                        <option>Under ₹20k</option>
                                        <option>₹20k–₹50k</option>
                                        <option>Above ₹50k</option>
                                    </select>
                                </div>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <span style={{ fontSize: "10px", color: "#64748B", fontWeight: 600 }}>Sort By</span>
                                <select className="form-select form-select-sm py-0" style={{ fontSize: "11px", height: "28px", width: "100px" }}>
                                    <option>Popular</option>
                                    <option>Price ↑</option>
                                    <option>Price ↓</option>
                                </select>
                                <button type="button" className="btn btn-sm btn-outline-success p-1" title="Grid View" style={{ height: "28px", width: "28px" }}>
                                    <i className="bi bi-grid-fill" />
                                </button>
                                <button type="button" className="btn btn-sm btn-outline-secondary p-1" title="List View" style={{ height: "28px", width: "28px" }}>
                                    <i className="bi bi-list-task" />
                                </button>
                            </div>
                        </div>

                        {/* Products Grid */}
                        <div className="pos-products-scroll">
                            <Product
                                cartProducts={updateProducts}
                                updateCart={addToCarts}
                                customCart={customCart}
                                setCartProductIds={setCartProductIds}
                                cartProductIds={cartProductIds}
                                settings={settings}
                                productMsg={productMsg}
                                selectedOption={selectedOption}
                            />
                        </div>

                        {/* Bottom Shortcut Bar */}
                        <div className="pos-bottom-bar border-top bg-white py-2 px-3">
                            <div className="d-flex align-items-center gap-2 overflow-auto" style={{ scrollbarWidth: "none" }}>
                                {[
                                    { icon: "bi-barcode", label: "Barcode Scan", key: "F4", action: focusSearchInput },
                                    { icon: "bi-qr-code-scan", label: "QR Scan", key: "F8", action: focusSearchInput },
                                    { icon: "bi-person", label: "Customer", key: "F2", action: () => setModalShowCustomer(true) },
                                    { icon: "bi-receipt-cutoff", label: "Recent Orders", key: "F9", action: onClickDetailsModel },
                                    { icon: "bi-pause-circle", label: `Hold Bills`, key: "F5", badge: holdListData?.length || 0, action: onClickHoldModel },
                                    { icon: "bi-arrows-collapse", label: "Collapse Panel", key: "F11", action: toggleCollapseProducts },
                                    { icon: "bi-cash-stack", label: "Cash Drawer", key: "F10", action: handleClickCloseRegister },
                                ].map((btn, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        className="btn btn-sm btn-light border fw-semibold text-secondary d-flex align-items-center gap-1 flex-shrink-0"
                                        style={{ fontSize: "11px", borderRadius: "8px", height: "32px", whiteSpace: "nowrap" }}
                                        onClick={btn.action}
                                    >
                                        <i className={`bi ${btn.icon}`} />
                                        {btn.label}
                                        {btn.badge !== undefined && btn.badge > 0 && (
                                            <span className="badge bg-success ms-1">{btn.badge}</span>
                                        )}
                                        <span className="badge bg-secondary ms-1">{btn.key}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODALS ── */}
            {isOpenCartItemUpdateModel && product && (
                <ProductDetailsModel
                    openProductDetailModal={openProductDetailModal}
                    productModelId={product.id}
                    onProductUpdateInCart={onProductUpdateInCart}
                    updateCost={updateCost}
                    cartProduct={product}
                    isOpenCartItemUpdateModel={isOpenCartItemUpdateModel}
                    frontSetting={frontSetting}
                />
            )}

            {cashPayment && (
                <CashPaymentModel
                    cashPayment={cashPayment}
                    totalQty={totalQty}
                    cartItemValue={cartItemValue}
                    onChangeInput={onChangeInput}
                    onPaymentStatusChange={onPaymentStatusChange}
                    cashPaymentValue={cashPaymentValue}
                    allConfigData={allConfigData}
                    subTotal={subTotal}
                    onPaymentTypeChange={onPaymentTypeChange}
                    grandTotal={grandTotal}
                    onCashPayment={onCashPayment}
                    taxTotal={taxTotal}
                    handleCashPayment={handleCashPayment}
                    settings={settings}
                    errors={errors}
                    paymentTypeDefaultValue={paymentTypeDefaultValue}
                    paymentTypeFilterOptions={paymentTypeFilterOptions}
                    onChangeReturnChange={onChangeReturnChange}
                    setPaymentValue={setPaymentValue}
                />
            )}

            {lgShow && (
                <RegisterDetailsModel
                    printRegisterDetails={printRegisterDetails}
                    frontSetting={frontSetting}
                    lgShow={lgShow}
                    setLgShow={setLgShow}
                />
            )}

            {holdShow && (
                <HoldListModal
                    setUpdateHoldList={setUpdateHoldList}
                    setCartItemValue={setCartItemValue}
                    setUpdateProducts={setUpdateProducts}
                    updateProduct={updateProducts}
                    printRegisterDetails={printRegisterDetails}
                    frontSetting={frontSetting}
                    holdListData={holdListData}
                    setHold_ref_no={setHold_ref_no}
                    holdShow={holdShow}
                    setHoldShow={setHoldShow}
                    addCart={addToCarts}
                    updateCart={updateCart}
                    setSelectedCustomerOption={setSelectedCustomerOption}
                    setSelectedOption={setSelectedOption}
                />
            )}

            {modalShowCustomer && (
                <CustomerForm
                    show={modalShowCustomer}
                    hide={setModalShowCustomer}
                    setSelectedCustomerOption={setSelectedCustomerOption}
                />
            )}

            <PosCloseRegisterDetailsModel
                showCloseDetailsModal={showCloseDetailsModal}
                handleCloseRegisterDetails={handleCloseRegisterDetails}
                setShowCloseDetailsModal={setShowCloseDetailsModal}
            />
        </div>
    );
};

const mapStateToProps = (state) => {
    const {
        posAllProducts,
        frontSetting,
        settings,
        cashPayment,
        allConfigData,
        posAllTodaySaleOverAllReport,
        holdListData,
        totalRecord,
    } = state;
    return {
        holdListData,
        posAllProducts,
        frontSetting,
        settings,
        paymentDetails: cashPayment,
        customCart: prepareCartArray(posAllProducts),
        allConfigData,
        posAllTodaySaleOverAllReport,
        totalRecord: totalRecord || (posAllProducts ? posAllProducts.length : 0),
    };
};

export default connect(mapStateToProps, {
    fetchSetting,
    fetchFrontSetting,
    posSearchNameProduct,
    posCashPaymentAction,
    posSearchCodeProduct,
    posAllProduct,
    fetchBrandClickable,
    fetchHoldLists,
})(PosMainPage);
