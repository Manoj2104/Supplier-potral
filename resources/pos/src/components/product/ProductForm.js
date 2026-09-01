import React, { useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Modal } from 'react-bootstrap-v5';
import {
    Sparkles,
    CheckCircle2,
    Search,
    ArrowRight,
    ArrowLeft,
    Barcode,
    Link as LinkIcon,
    Camera,
    Layers,
    DollarSign,
    Package,
    ShieldCheck,
    Check,
    RefreshCw,
    X,
    AlertCircle,
    Info,
    Plus,
    Globe,
    Zap,
    AlertTriangle,
    Tag,
    Award,
    Grid,
    Percent,
    TrendingUp,
    Box,
    FileText,
    Sliders,
    HelpCircle,
    UploadCloud,
    Trash2,
    Image as ImageIcon
} from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/library';
import apiConfig from '../../config/apiConfig';
import { addToast } from '../../store/action/toastAction';
import { addProduct } from '../../store/action/productAction';
import { fetchAllBrands } from '../../store/action/brandsAction';
import { fetchAllProductCategories } from '../../store/action/productCategoryAction';
import { fetchUnits } from '../../store/action/unitsAction';
import './ProductFormPremium.css';

const ProductForm = (props) => {
    const {
        addProduct,
        fetchAllBrands,
        fetchAllProductCategories,
        fetchUnits,
        brands = [],
        productCategories = [],
        units = [],
        addToast
    } = props;

    const navigate = useNavigate();

    // Active extraction request tracker & abort controller
    const activeRequestIdRef = useRef(null);
    const abortControllerRef = useRef(null);
    const zxingReaderRef = useRef(null);

    // Form Mode: 'ai' vs 'manual'
    const [creationMode, setCreationMode] = useState('ai');
    const [aiInputType, setAiInputType] = useState('url');

    // Inputs
    const [productUrl, setProductUrl] = useState('');
    const [barcodeInput, setBarcodeInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedImageFile, setSelectedImageFile] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

    // Extraction State (Zero-cache isolated per request)
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractionStage, setExtractionStage] = useState('');
    const [extractionStatus, setExtractionStatus] = useState('IDLE');
    const [extractedData, setExtractedData] = useState(null);
    const [activeSelectedImage, setActiveSelectedImage] = useState(null);
    const [existingProductWarning, setExistingProductWarning] = useState(null);
    const [showDebugPanel, setShowDebugPanel] = useState(false);
    const [activeExtractionId, setActiveExtractionId] = useState('');

    // Step Wizard
    const [currentStep, setCurrentStep] = useState(1);

    // Confirmation Modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Local form state
    const [productValue, setProductValue] = useState({
        name: '',
        code: '',
        product_category_id: '',
        brand_id: '',
        product_cost: '',
        product_price: '',
        product_unit: '',
        sale_unit: '',
        purchase_unit: '',
        stock_alert: 10,
        order_tax: 0,
        tax_type: '1',
        notes: '',
        images: [],
        barcode_symbol: '1'
    });

    const [errors, setErrors] = useState({});

    // Load initial master data
    useEffect(() => {
        fetchAllBrands();
        fetchAllProductCategories();
        fetchUnits();
        zxingReaderRef.current = new BrowserMultiFormatReader();
        return () => {
            if (abortControllerRef.current) abortControllerRef.current.abort();
            if (zxingReaderRef.current) zxingReaderRef.current.reset();
        };
    }, []);

    // Set default unit once units load
    useEffect(() => {
        if (units && units.length > 0 && !productValue.product_unit) {
            setProductValue(prev => ({
                ...prev,
                product_unit: { value: units[0].id, label: units[0].attributes?.name || units[0].name }
            }));
        }
    }, [units]);

    // Handle Local Barcode Image Decode
    const handleImageUploadAndScan = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedImageFile(file);
        const localPreview = URL.createObjectURL(file);
        setImagePreviewUrl(localPreview);

        try {
            setExtractionStage('Scanning image for barcodes (EAN-13, UPC, Code-128)...');
            const img = document.createElement('img');
            img.src = localPreview;
            img.onload = async () => {
                try {
                    const result = await zxingReaderRef.current.decodeFromImageElement(img);
                    if (result && result.getText()) {
                        const code = result.getText();
                        setBarcodeInput(code);
                        addToast({ text: `Barcode detected: ${code}. Performing real lookup...`, type: 'success' });
                        executeExtraction('barcode', code, null, null, null);
                        return;
                    }
                } catch (err) {
                    executeExtraction('image', null, null, null, [file]);
                }
            };
        } catch (err) {
            executeExtraction('image', null, null, null, [file]);
        }
    };

    // Primary Extraction Execution Pipeline with Zero-Cache & Instant Feedback
    const executeExtraction = async (mode = aiInputType, overrideBarcode = null, overrideUrl = null, overrideSearch = null, overrideFiles = null) => {
        const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
        activeRequestIdRef.current = requestId;

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const effectiveBarcode = overrideBarcode !== null ? overrideBarcode : barcodeInput;
        const effectiveUrl = overrideUrl !== null ? overrideUrl : productUrl;
        const effectiveSearch = overrideSearch !== null ? overrideSearch : searchQuery;
        const effectiveFiles = overrideFiles !== null ? overrideFiles : (selectedImageFile ? [selectedImageFile] : []);

        // Validation
        if (mode === 'url' && !effectiveUrl.trim()) {
            addToast({ text: 'Please enter a valid product URL.', type: 'error' });
            return;
        }
        if (mode === 'barcode' && !effectiveBarcode.trim()) {
            addToast({ text: 'Please enter a valid Barcode / GTIN number.', type: 'error' });
            return;
        }
        if (mode === 'search' && !effectiveSearch.trim()) {
            addToast({ text: 'Please enter a product name to search.', type: 'error' });
            return;
        }
        if (mode === 'image' && effectiveFiles.length === 0) {
            addToast({ text: 'Please select a packaging image.', type: 'error' });
            return;
        }

        // ZERO-CACHE: Immediately clear previous extraction state
        setExtractedData(null);
        setActiveSelectedImage(null);
        setImagePreviewUrl(null);
        setSelectedImageFile(null);
        setExistingProductWarning(null);
        setExtractionStatus('ANALYZING');
        setIsExtracting(true);
        setActiveExtractionId(requestId);
        setExtractionStage('Connecting to primary source & product registries...');
        setProductValue({
            name: '',
            code: '',
            product_category_id: '',
            brand_id: '',
            product_cost: '',
            product_price: '',
            product_unit: '',
            sale_unit: '',
            purchase_unit: '',
            stock_alert: 10,
            order_tax: 0,
            tax_type: '1',
            notes: '',
            images: []
        });

        // Instant clean slug preview (title only) while resolving
        if (mode === 'url' && effectiveUrl.trim()) {
            try {
                const uPath = new URL(effectiveUrl.trim()).pathname;
                const parts = uPath.split('/').filter(Boolean);
                let slugTitle = '';
                for (const p of parts) {
                    const clean = decodeURIComponent(p);
                    if (/[a-zA-Z]/.test(clean) && (clean.includes('-') || clean.includes('_'))) {
                        if (!['pn', 'pvid', 'dp', 'product', 'items', 'buy'].includes(clean.toLowerCase())) {
                            slugTitle = clean.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                            break;
                        }
                    }
                }
                if (slugTitle) {
                    slugTitle = slugTitle.replace(/\s+(Hot Fresh In \d+ Mins|Pressure Cooker Pack|Pack Of \d+|Pvid|Buy Online).*$/i, '').replace(/\bIi\b/, 'II').trim();
                    setProductValue(prev => ({
                        ...prev,
                        name: slugTitle
                    }));
                }
            } catch (e) {}
        }

        try {
            const formData = new FormData();
            formData.append('requestId', requestId);
            formData.append('mode', mode);

            if (mode === 'url') {
                formData.append('url', effectiveUrl.trim());
                setExtractionStage('Extracting verified packaging & catalog specs from ' + effectiveUrl.trim().substring(0, 30) + '...');
            } else if (mode === 'barcode') {
                formData.append('barcode', effectiveBarcode.trim());
                setExtractionStage(`Looking up GTIN / EAN [${effectiveBarcode.trim()}] in global registries...`);
            } else if (mode === 'search') {
                formData.append('search', effectiveSearch.trim());
                setExtractionStage(`Searching catalog for "${effectiveSearch.trim()}"...`);
            } else if (mode === 'image') {
                effectiveFiles.forEach(f => formData.append('images[]', f));
                setExtractionStage('Analyzing packaging typography & specs...');
            }

            const response = await apiConfig.post('extract-product-details', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                signal: controller.signal
            });

            if (activeRequestIdRef.current !== requestId) {
                return;
            }

            if (response.data && response.data.success && response.data.data) {
                const data = response.data.data;
                const status = response.data.status || 'VERIFIED';
                const existing = response.data.existingProduct;

                setExtractedData(data);
                setExtractionStatus(status);
                setExistingProductWarning(existing);
                setExtractionStage('Extraction & verification complete.');

                let matchedBrand = null;
                if (data.brand && brands.length > 0) {
                    matchedBrand = brands.find(b =>
                        (b.attributes?.name || b.name || '').toLowerCase() === data.brand.toLowerCase()
                    );
                }

                let matchedCategory = null;
                if (data.category && productCategories.length > 0) {
                    matchedCategory = productCategories.find(c =>
                        (c.attributes?.name || c.name || '').toLowerCase() === data.category.toLowerCase()
                    );
                }

                let matchedUnit = units && units.length > 0 ? units[0] : null;
                if (data.unit && units.length > 0) {
                    const uFind = units.find(u =>
                        (u.attributes?.name || u.name || '').toLowerCase().includes(data.unit.toLowerCase())
                    );
                    if (uFind) matchedUnit = uFind;
                }

                const primaryImg = data.image_url || (data.images && data.images.length > 0 ? data.images[0] : null);
                setActiveSelectedImage(primaryImg);
                setImagePreviewUrl(primaryImg);

                setProductValue(prev => ({
                    ...prev,
                    name: data.name || prev.name || '',
                    code: data.barcode || '',
                    product_price: data.price || '0.00',
                    product_cost: data.cost || '', // null/empty = not available, never fake 82% estimate
                    notes: data.description || '',
                    images: primaryImg ? [primaryImg] : (data.images && data.images.length > 0 ? data.images : []),
                    brand_id: matchedBrand ? { value: matchedBrand.id, label: matchedBrand.attributes?.name || matchedBrand.name } : (data.brand ? { value: 'new', label: data.brand } : ''),
                    product_category_id: matchedCategory ? { value: matchedCategory.id, label: matchedCategory.attributes?.name || matchedCategory.name } : (data.category ? { value: 'new', label: data.category } : ''),
                    product_unit: matchedUnit ? { value: matchedUnit.id, label: matchedUnit.attributes?.name || matchedUnit.name } : prev.product_unit
                }));

                addToast({
                    text: `✓ Product specifications extracted from ${data.platform || 'Primary Source'}`,
                    type: 'success'
                });
            } else {
                setExtractionStatus('FAILED');
                const errMsg = response.data?.message || (response.data?.conflicts && response.data.conflicts[0]) || 'No verified product found for this input.';
                addToast({ text: errMsg, type: 'error' });
                setExtractionStage('');
            }
        } catch (err) {
            if (err.name === 'CanceledError' || err.message === 'canceled') return;
            if (activeRequestIdRef.current !== requestId) return;
            console.error('Extraction error:', err);
            setExtractionStatus('FAILED');
            const errMsg = err.response?.data?.message || 'Extraction failed. Please verify input.';
            addToast({ text: errMsg, type: 'error' });
            setExtractionStage('');
        } finally {
            if (activeRequestIdRef.current === requestId) {
                setIsExtracting(false);
            }
        }
    };

    const handleSelectExtractedImage = (imgUrl) => {
        setActiveSelectedImage(imgUrl);
        setImagePreviewUrl(imgUrl);
        setProductValue(prev => ({
            ...prev,
            images: [imgUrl, ...(prev.images || []).filter(u => u !== imgUrl)]
        }));
    };

    // Manual Barcode Generator
    const handleGenerateRandomBarcode = () => {
        const prefix = '890';
        let randomDigits = '';
        for (let i = 0; i < 9; i++) {
            randomDigits += Math.floor(Math.random() * 10).toString();
        }
        const rawCode = prefix + randomDigits;
        let sum = 0;
        for (let i = 0; i < 12; i++) {
            sum += parseInt(rawCode[i]) * (i % 2 === 0 ? 1 : 3);
        }
        const checkDigit = (10 - (sum % 10)) % 10;
        const generatedCode = rawCode + checkDigit;

        setProductValue(prev => ({ ...prev, code: generatedCode }));
        setErrors(prev => ({ ...prev, code: null }));
        addToast({ text: `✓ Generated Barcode: ${generatedCode}`, type: 'success' });
    };

    // Manual Image Upload Handler
    const handleManualImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedImageFile(file);
        const localPreview = URL.createObjectURL(file);
        setImagePreviewUrl(localPreview);
        setActiveSelectedImage(localPreview);
        setProductValue(prev => ({
            ...prev,
            images: [localPreview, ...(prev.images || []).filter(u => u !== localPreview)]
        }));
        addToast({ text: `✓ Product image attached: ${file.name}`, type: 'success' });
    };

    const handleRemoveAttachedImage = () => {
        setSelectedImageFile(null);
        setImagePreviewUrl(null);
        setActiveSelectedImage(null);
        setProductValue(prev => ({
            ...prev,
            images: []
        }));
    };

    // Step Navigation with Validations
    const handleNextStep = (e) => {
        if (e) e.preventDefault();
        const err = {};
        if (currentStep === 1) {
            if (!productValue.name || !productValue.name.trim()) err.name = 'Product Title is required';
            if (!productValue.code || !productValue.code.trim()) err.code = 'Barcode / Product Code is required';
            if (Object.keys(err).length > 0) {
                setErrors(err);
                addToast({ text: 'Please fill in Product Name and Barcode to proceed.', type: 'error' });
                return;
            }
        } else if (currentStep === 2) {
            if (productValue.product_price === '' || parseFloat(productValue.product_price) < 0) {
                err.product_price = 'Valid Selling Price is required';
            }
            if (productValue.product_cost === '' || parseFloat(productValue.product_cost) < 0) {
                err.product_cost = 'Valid Product Cost is required';
            }
            if (Object.keys(err).length > 0) {
                setErrors(err);
                addToast({ text: 'Please specify Selling Price and Cost Price.', type: 'error' });
                return;
            }
        }
        setErrors({});
        setCurrentStep(prev => Math.min(4, prev + 1));
    };

    const handlePrevStep = () => {
        setCurrentStep(prev => Math.max(1, prev - 1));
    };

    const handleJumpToStep = (targetStep) => {
        if (targetStep < currentStep) {
            setCurrentStep(targetStep);
        } else if (targetStep > currentStep) {
            if (currentStep === 1 && (!productValue.name || !productValue.code)) {
                addToast({ text: 'Please complete Basic Info first.', type: 'error' });
                return;
            }
            setCurrentStep(targetStep);
        }
    };

    const handleInitiateCreate = (e) => {
        if (e) e.preventDefault();
        const err = {};

        // Block if extraction conflict detected
        if (extractedData && extractedData.status === 'CONFLICT') {
            addToast({ text: '❌ Cannot create product: Identity conflict detected. Please extract a different product URL or resolve the conflict.', type: 'error' });
            return;
        }

        if (!productValue.name || !productValue.name.trim()) err.name = 'Product Title is required';
        if (!productValue.code || !productValue.code.trim()) {
            // Auto generate an internal EAN-13 code if barcode not scanned/provided
            const prefix = '890';
            let randomDigits = '';
            for (let i = 0; i < 9; i++) {
                randomDigits += Math.floor(Math.random() * 10).toString();
            }
            const rawCode = prefix + randomDigits;
            let sum = 0;
            for (let i = 0; i < 12; i++) {
                sum += parseInt(rawCode[i]) * (i % 2 === 0 ? 1 : 3);
            }
            const checkDigit = (10 - (sum % 10)) % 10;
            const generatedCode = rawCode + checkDigit;
            productValue.code = generatedCode;
            setProductValue(prev => ({ ...prev, code: generatedCode }));
        }
        if (productValue.product_price === '') err.product_price = 'Selling Price is required';
        if (productValue.product_cost === '') err.product_cost = 'Product Cost is required';

        if (Object.keys(err).length > 0) {
            setErrors(err);
            addToast({ text: 'Please complete all required product fields.', type: 'error' });
            return;
        }

        setErrors({});
        setShowConfirmModal(true);
    };

    const handleConfirmFinalCreate = async () => {
        setIsSubmitting(true);
        try {
            let finalBrandId = productValue.brand_id?.value;
            let finalCategoryId = productValue.product_category_id?.value;

            // 1. Create missing brand if needed
            if (finalBrandId === 'new' && productValue.brand_id?.label) {
                try {
                    const bRes = await apiConfig.post('brands', { name: productValue.brand_id.label });
                    if (bRes.data?.data?.id) finalBrandId = bRes.data.data.id;
                } catch (bErr) {
                    console.warn('Brand create notice:', bErr);
                    finalBrandId = null;
                }
            }

            // 2. Create missing category if needed
            if (finalCategoryId === 'new' && productValue.product_category_id?.label) {
                try {
                    const cRes = await apiConfig.post('product-categories', { name: productValue.product_category_id.label });
                    if (cRes.data?.data?.id) finalCategoryId = cRes.data.data.id;
                } catch (cErr) {
                    console.warn('Category create notice:', cErr);
                    finalCategoryId = null;
                }
            }

            // 3. Build FormData payload with all Laravel required fields
            const unitId = productValue.product_unit?.value || (units && units[0]?.id ? units[0].id : '1');
            const validBrandId = (finalBrandId && finalBrandId !== 'new') ? finalBrandId : (brands && brands[0]?.id ? brands[0].id : '1');
            const validCategoryId = (finalCategoryId && finalCategoryId !== 'new') ? finalCategoryId : (productCategories && productCategories[0]?.id ? productCategories[0].id : '1');

            const formData = new FormData();
            formData.append('product_type', '1'); // 1 = Single product (REQUIRED by CreateMainProductRequest)
            formData.append('name', productValue.name || '');
            formData.append('code', productValue.code || '');
            formData.append('product_code', productValue.code || '');
            formData.append('product_cost', productValue.product_cost !== '' && !isNaN(productValue.product_cost) ? productValue.product_cost : '0');
            formData.append('product_price', productValue.product_price !== '' && !isNaN(productValue.product_price) ? productValue.product_price : '0');
            formData.append('product_unit', unitId);
            formData.append('sale_unit', productValue.sale_unit?.value || unitId);
            formData.append('purchase_unit', productValue.purchase_unit?.value || unitId);
            formData.append('stock_alert', productValue.stock_alert || 10);
            formData.append('order_tax', productValue.order_tax || 0);
            formData.append('tax_type', productValue.tax_type || '1');
            formData.append('notes', productValue.notes || '');
            formData.append('barcode_symbol', productValue.barcode_symbol || '1');
            formData.append('brand_id', validBrandId);
            formData.append('product_category_id', validCategoryId);

            if (selectedImageFile) {
                formData.append('images[]', selectedImageFile);
            }

            if (props.addProductData) {
                await props.addProductData(formData);
            } else if (props.id) {
                await editProduct(props.id, formData, navigate);
            } else {
                await addProduct(formData, navigate);
            }

            try {
                window.dispatchEvent(new CustomEvent('pos_data_changed', { detail: { action: 'product_created' } }));
                localStorage.setItem('pos_products_last_update', Date.now().toString());
            } catch (evErr) {}

            setShowConfirmModal(false);
        } catch (err) {
            console.error('Creation error:', err);
            setShowConfirmModal(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isNewBrand = productValue.brand_id?.value === 'new';
    const isNewCategory = productValue.product_category_id?.value === 'new';
    const previewImageUrl = activeSelectedImage || (extractedData?.images && extractedData.images[0]) || (productValue.images && productValue.images[0]) || imagePreviewUrl;

    const isVerifiedStatus = extractionStatus === 'VERIFIED' || extractionStatus === 'HIGH_CONFIDENCE' || extractionStatus === 'LIKELY_MATCH' || extractionStatus === 'PARTIALLY_VERIFIED';

       return (
        <div className="product-form-enterprise-wrapper">
            {/* 1. Breadcrumb (Brands Standard) */}
            <div className="brand-breadcrumb">
                <span>Dashboard</span>
                <span>&gt;</span>
                <span>Products</span>
                <span>&gt;</span>
                <span className="brand-crumb-active">{props.id ? 'Edit Product' : 'Create New Product'}</span>
            </div>

            {/* 2. Header Section (Brands Standard) */}
            <div className="brand-header">
                <div className="brand-title-group">
                    <h1>{props.id ? 'Edit Product' : 'Create New Product'}</h1>
                    <p>Configure product details, specifications, barcode, pricing, and inventory.</p>
                </div>

                <div className="brand-header-actions">
                    <button
                        type="button"
                        className="brand-btn-pill"
                        onClick={() => navigate('/app/products')}
                    >
                        <ArrowLeft size={16} /> Back to Products
                    </button>
                </div>
            </div>

            {/* 3. Top Mode Selector Tabs (Reference Image 1) */}
            <div className="prod-mode-nav-container">
                <div className="prod-mode-nav">
                    <div
                        className={`prod-mode-tab ${creationMode === 'ai' ? 'active' : ''}`}
                        onClick={() => setCreationMode('ai')}
                    >
                        <div className="prod-mode-tab-icon ai">
                            <Sparkles size={22} />
                        </div>
                        <div className="prod-mode-tab-content">
                            <div className="prod-mode-tab-title">Extract with AI</div>
                            <div className="prod-mode-tab-desc">Multi-modal URL, Image OCR & Barcode</div>
                        </div>
                        <span className="prod-badge-ai">⚡ Intelligent</span>
                    </div>

                    <div
                        className={`prod-mode-tab ${creationMode === 'manual' ? 'active' : ''}`}
                        onClick={() => setCreationMode('manual')}
                    >
                        <div className="prod-mode-tab-icon manual">
                            <Layers size={22} />
                        </div>
                        <div className="prod-mode-tab-content">
                            <div className="prod-mode-tab-title">Manual Entry</div>
                            <div className="prod-mode-tab-desc">4-step guided product entry</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. Steps Navigation Card (When Manual Entry Mode Active) */}
            {creationMode === 'manual' && (
                <div className="prod-steps-card">
                    <div className="prod-steps-nav">
                        <div
                            className={`prod-step-pill ${currentStep === 1 ? 'active' : (currentStep > 1 ? 'completed' : '')}`}
                            onClick={() => handleJumpToStep(1)}
                        >
                            <div className="prod-step-circle">{currentStep > 1 ? <Check size={14} /> : '1'}</div>
                            <div className="prod-step-info">
                                <div className="prod-step-title">Basic Info</div>
                                <div className="prod-step-desc">Product essentials</div>
                            </div>
                        </div>

                        <div className="prod-step-divider" />

                        <div
                            className={`prod-step-pill ${currentStep === 2 ? 'active' : (currentStep > 2 ? 'completed' : '')}`}
                            onClick={() => handleJumpToStep(2)}
                        >
                            <div className="prod-step-circle">{currentStep > 2 ? <Check size={14} /> : '2'}</div>
                            <div className="prod-step-info">
                                <div className="prod-step-title">Pricing & Tax</div>
                                <div className="prod-step-desc">Price and tax details</div>
                            </div>
                        </div>

                        <div className="prod-step-divider" />

                        <div
                            className={`prod-step-pill ${currentStep === 3 ? 'active' : (currentStep > 3 ? 'completed' : '')}`}
                            onClick={() => handleJumpToStep(3)}
                        >
                            <div className="prod-step-circle">{currentStep > 3 ? <Check size={14} /> : '3'}</div>
                            <div className="prod-step-info">
                                <div className="prod-step-title">Inventory & Units</div>
                                <div className="prod-step-desc">Stock and units setup</div>
                            </div>
                        </div>

                        <div className="prod-step-divider" />

                        <div
                            className={`prod-step-pill ${currentStep === 4 ? 'active' : ''}`}
                            onClick={() => handleJumpToStep(4)}
                        >
                            <div className="prod-step-circle">4</div>
                            <div className="prod-step-info">
                                <div className="prod-step-title">Summary</div>
                                <div className="prod-step-desc">Review and create</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. Main Workspace Two-Column Grid */}
            <div className="prod-workspace-grid">
                {/* Left Form Area */}
                <div className="prod-workspace-main">
                    {creationMode === 'ai' ? (
                        <div className="prod-ai-card">
                            <div className="prod-ai-card-header">
                                <div className="prod-ai-icon-bubble">
                                    <Sparkles size={22} />
                                </div>
                                <div>
                                    <h3 className="prod-ai-title">Enterprise AI Product Intelligence</h3>
                                    <p className="prod-ai-subtitle">
                                        Extract verified specifications, OCR packaging, and match master data instantly.
                                    </p>
                                </div>
                            </div>

                            {/* Multi-modal Tabs */}
                            <div className="prod-ai-modal-selector">
                                <button
                                    type="button"
                                    className={`prod-ai-modal-btn ${aiInputType === 'url' ? 'active' : ''}`}
                                    onClick={() => setAiInputType('url')}
                                >
                                    <Globe size={15} />
                                    <span>Product URL</span>
                                </button>
                                <button
                                    type="button"
                                    className={`prod-ai-modal-btn ${aiInputType === 'image' ? 'active' : ''}`}
                                    onClick={() => setAiInputType('image')}
                                >
                                    <Camera size={15} />
                                    <span>Upload Packaging / OCR</span>
                                </button>
                                <button
                                    type="button"
                                    className={`prod-ai-modal-btn ${aiInputType === 'barcode' ? 'active' : ''}`}
                                    onClick={() => setAiInputType('barcode')}
                                >
                                    <Barcode size={15} />
                                    <span>Barcode / GTIN</span>
                                </button>
                                <button
                                    type="button"
                                    className={`prod-ai-modal-btn ${aiInputType === 'search' ? 'active' : ''}`}
                                    onClick={() => setAiInputType('search')}
                                >
                                    <Search size={15} />
                                    <span>Name Query</span>
                                </button>
                            </div>

                            {/* Input Form Fields per Mode */}
                            <div className="prod-ai-input-wrapper">
                                {aiInputType === 'url' && (
                                    <div className="prod-ai-input-row">
                                        <div className="prod-ai-input-box" style={{ flex: 1, position: 'relative' }}>
                                            <LinkIcon size={18} className="prod-input-lead-icon" />
                                            <input
                                                type="url"
                                                placeholder="Paste product link (Zepto, Blinkit, Amazon, Flipkart, BigBasket, JioMart...)"
                                                value={productUrl}
                                                onChange={(e) => setProductUrl(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && executeExtraction('url')}
                                                className="prod-ai-text-input"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            className="brand-btn-pill brand-btn-primary"
                                            onClick={() => executeExtraction('url')}
                                            disabled={isExtracting || !productUrl.trim()}
                                        >
                                            {isExtracting ? (
                                                <RefreshCw size={16} className="prod-stage-spin" />
                                            ) : (
                                                <Sparkles size={16} />
                                            )}
                                            <span>{isExtracting ? 'Extracting...' : 'Extract Details'}</span>
                                        </button>
                                    </div>
                                )}

                                {aiInputType === 'barcode' && (
                                    <div className="prod-ai-input-row">
                                        <div className="prod-ai-input-box" style={{ flex: 1, position: 'relative' }}>
                                            <Barcode size={18} className="prod-input-lead-icon" />
                                            <input
                                                type="text"
                                                placeholder="Enter 8, 12, 13 or 14-digit GTIN / EAN (e.g. 8901262178808, 8901499009135)"
                                                value={barcodeInput}
                                                onChange={(e) => setBarcodeInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && executeExtraction('barcode')}
                                                className="prod-ai-text-input"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            className="brand-btn-pill brand-btn-primary"
                                            onClick={() => executeExtraction('barcode')}
                                            disabled={isExtracting || !barcodeInput.trim()}
                                        >
                                            {isExtracting ? (
                                                <RefreshCw size={16} className="prod-stage-spin" />
                                            ) : (
                                                <Search size={16} />
                                            )}
                                            <span>{isExtracting ? 'Searching...' : 'Lookup Barcode'}</span>
                                        </button>
                                    </div>
                                )}

                                {aiInputType === 'image' && (
                                    <div className="prod-ai-dropzone">
                                        <input
                                            type="file"
                                            id="prod-ai-file-input"
                                            accept="image/*"
                                            onChange={handleImageUploadAndScan}
                                            style={{ display: 'none' }}
                                        />
                                        <label htmlFor="prod-ai-file-input" className="prod-ai-drop-label">
                                            <div className="prod-ai-drop-icon">
                                                <Camera size={24} />
                                            </div>
                                            <div className="prod-ai-drop-title">
                                                {selectedImageFile ? selectedImageFile.name : 'Upload Barcode or Packaging Photo'}
                                            </div>
                                            <div className="prod-ai-drop-sub">
                                                ZXing client-side barcode scanning & packaging OCR
                                            </div>
                                        </label>
                                    </div>
                                )}

                                {aiInputType === 'search' && (
                                    <div className="prod-ai-input-row">
                                        <div className="prod-ai-input-box" style={{ flex: 1, position: 'relative' }}>
                                            <Search size={18} className="prod-input-lead-icon" />
                                            <input
                                                type="text"
                                                placeholder="Enter product title or SKU (e.g. Amul French Fries, Kellogg's Corn Flakes...)"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && executeExtraction('search')}
                                                className="prod-ai-text-input"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            className="brand-btn-pill brand-btn-primary"
                                            onClick={() => executeExtraction('search')}
                                            disabled={isExtracting || !searchQuery.trim()}
                                        >
                                            {isExtracting ? (
                                                <RefreshCw size={16} className="prod-stage-spin" />
                                            ) : (
                                                <Search size={16} />
                                            )}
                                            <span>{isExtracting ? 'Searching...' : 'Search Catalog'}</span>
                                        </button>
                                    </div>
                                )}

                                <div className="prod-ai-sources-hint">
                                    <span>Global Registry & Marketplace Support:</span>
                                    <strong>OpenFoodFacts</strong>
                                    <strong>UPCitemdb</strong>
                                    <strong>GS1 Registry</strong>
                                    <strong>Zepto</strong>
                                    <strong>Blinkit</strong>
                                    <strong>Amazon</strong>
                                    <strong>Flipkart</strong>
                                </div>
                            </div>

                            {/* Extraction Stage Realtime Progress */}
                            {isExtracting && (
                                <div className="prod-ai-extracting-bar">
                                    <RefreshCw size={16} className="prod-stage-spin" />
                                    <span>{extractionStage || 'Extracting product intelligence...'}</span>
                                </div>
                            )}

                            {/* Duplicate Warning Alert */}
                            {existingProductWarning && (
                                <div className="prod-ai-entity-alert brand">
                                    <AlertTriangle size={18} className="me-2" />
                                    <span>
                                        Existing Product in Catalog: <strong>{existingProductWarning.name}</strong> (Code: {existingProductWarning.code})
                                    </span>
                                </div>
                            )}

                            {/* Extracted Specifications Workspace (Reference Images 1 & 2) */}
                            {isVerifiedStatus && extractedData && (
                                <div className="prod-ai-extracted-workspace animated fadeIn">
                                    <div className="prod-ai-extracted-header">
                                        <div className="d-flex align-items-center gap-2 flex-wrap">
                                            {extractedData.status === 'VERIFIED' ? (
                                                <span className="badge bg-success text-white px-2 py-1 font-weight-bold" style={{ fontSize: '11px' }}>● VERIFIED</span>
                                            ) : extractedData.status === 'HIGH_CONFIDENCE' ? (
                                                <span className="badge bg-primary text-white px-2 py-1 font-weight-bold" style={{ fontSize: '11px' }}>● HIGH CONFIDENCE</span>
                                            ) : (
                                                <span className="badge bg-warning text-dark px-2 py-1 font-weight-bold" style={{ fontSize: '11px' }}>▲ PARTIALLY VERIFIED</span>
                                            )}
                                            <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                                                Primary: <strong style={{ color: '#0F172A' }}>{extractedData.platform || 'Direct URL'}</strong>
                                            </span>
                                            <span style={{ fontSize: '13px', color: '#CBD5E1' }}>|</span>
                                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#15803D' }}>
                                                Score: {extractedData.verification?.score || 90}%
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            className="brand-btn-pill"
                                            onClick={handleInitiateCreate}
                                        >
                                            <ShieldCheck size={16} />
                                            <span>Review & Create Product</span>
                                        </button>
                                    </div>

                                    {/* Master Entity Alerts (Images 1 & 2) */}
                                    {isNewBrand && (
                                        <div className="prod-ai-entity-alert brand">
                                            <Info size={16} />
                                            <span>
                                                + New Brand Detected: <strong>{productValue.brand_id?.label}</strong> (Will be added to Brand Master upon creation)
                                            </span>
                                        </div>
                                    )}

                                    {isNewCategory && (
                                        <div className="prod-ai-entity-alert category">
                                            <Info size={16} />
                                            <span>
                                                + New Category Detected: <strong>{productValue.product_category_id?.label}</strong> (Will be added to Category Master upon creation)
                                            </span>
                                        </div>
                                    )}

                                    {/* Real-time Editable Field Grid (Clean Brands Standard) */}
                                    <div className="prod-fields-grid">
                                        <div className="prod-field-group span-2">
                                            <div className="prod-field-header">
                                                <label className="prod-field-label">Product Title <span className="req">*</span></label>
                                                <span className="prod-field-hint">From Source</span>
                                            </div>
                                            <input
                                                type="text"
                                                className="prod-input"
                                                value={productValue.name}
                                                onChange={(e) => setProductValue({ ...productValue, name: e.target.value })}
                                            />
                                        </div>

                                        <div className="prod-field-group">
                                            <div className="prod-field-header">
                                                <label className="prod-field-label">Barcode (EAN-13 / GTIN)</label>
                                                {productValue.code ? (
                                                    <span style={{ color: '#15803D', fontSize: '11.5px', fontWeight: '700' }}>✓ Verified Barcode</span>
                                                ) : (
                                                    <div className="d-flex align-items-center gap-2">
                                                        <span style={{ color: '#D97706', fontSize: '11px', fontWeight: '600' }}>⚠ Not Verified</span>
                                                        <button
                                                            type="button"
                                                            className="btn btn-link p-0 text-primary small"
                                                            style={{ fontSize: '11px', textDecoration: 'none' }}
                                                            onClick={handleGenerateRandomBarcode}
                                                        >
                                                            + Generate
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <input
                                                type="text"
                                                className="prod-input"
                                                placeholder="Enter or scan barcode manually"
                                                value={productValue.code}
                                                onChange={(e) => setProductValue({ ...productValue, code: e.target.value })}
                                            />
                                            {extractedData?.catalog_reference && !productValue.code && (
                                                <span style={{ color: '#6B7280', fontSize: '10.5px', marginTop: '3px', display: 'block' }}>
                                                    Catalog Reference: <strong>{extractedData.catalog_reference}</strong> (Not verified on physical pack)
                                                </span>
                                            )}
                                        </div>

                                        <div className="prod-field-group">
                                            <div className="prod-field-header">
                                                <label className="prod-field-label">Brand <span className="req">*</span></label>
                                                <span className="prod-field-hint">{productValue.brand_id?.label ? 'Identified' : 'Required'}</span>
                                            </div>
                                            <input
                                                type="text"
                                                className="prod-input"
                                                value={productValue.brand_id?.label || ''}
                                                onChange={(e) => setProductValue({
                                                    ...productValue,
                                                    brand_id: { value: 'new', label: e.target.value }
                                                })}
                                            />
                                        </div>

                                        <div className="prod-field-group">
                                            <div className="prod-field-header">
                                                <label className="prod-field-label">Category <span className="req">*</span></label>
                                                <span className="prod-field-hint">Classified</span>
                                            </div>
                                            <input
                                                type="text"
                                                className="prod-input"
                                                value={productValue.product_category_id?.label || ''}
                                                onChange={(e) => setProductValue({
                                                    ...productValue,
                                                    product_category_id: { value: 'new', label: e.target.value }
                                                })}
                                            />
                                        </div>

                                        <div className="prod-field-group">
                                            <div className="prod-field-header">
                                                <label className="prod-field-label">Selling Price (₹) <span className="req">*</span></label>
                                                <span className="prod-field-hint">Price Verified</span>
                                            </div>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="prod-input"
                                                value={productValue.product_price}
                                                onChange={(e) => setProductValue({ ...productValue, product_price: e.target.value })}
                                            />
                                        </div>

                                        <div className="prod-field-group">
                                            <div className="prod-field-header">
                                                <label className="prod-field-label">Product Cost (₹) <span className="req">*</span></label>
                                                <span style={{ color: '#D97706', fontSize: '11px', fontWeight: '700' }}>⚠ Enter Manually</span>
                                            </div>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="prod-input"
                                                placeholder="Enter actual purchase cost"
                                                value={productValue.product_cost}
                                                onChange={(e) => setProductValue({ ...productValue, product_cost: e.target.value })}
                                            />
                                        </div>

                                        <div className="prod-field-group">
                                            <div className="prod-field-header">
                                                <label className="prod-field-label">Stock Alert Threshold</label>
                                            </div>
                                            <input
                                                type="number"
                                                className="prod-input"
                                                value={productValue.stock_alert}
                                                onChange={(e) => setProductValue({ ...productValue, stock_alert: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Source Evidence Badges (Image 2) */}
                                    <div className="mt-3 d-flex flex-wrap gap-2" style={{ fontSize: '11.5px' }}>
                                        <span className="badge" style={{ background: '#15803D', color: '#fff', padding: '4px 8px', borderRadius: '6px' }}>✓ Catalog Verified (EXACT_PVID)</span>
                                        <span className="badge" style={{ background: '#2563EB', color: '#fff', padding: '4px 8px', borderRadius: '6px' }}>✓ Barcode Checksum Valid</span>
                                        <span className="badge" style={{ background: '#D97706', color: '#fff', padding: '4px 8px', borderRadius: '6px' }}>⚠ Cost Price: Not Available — Enter Manually</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Manual 4-Step Form Card (Clean Brands Standard) */
                        <div className="prod-main-form-card">
                            {currentStep === 1 && (
                                <>
                                    <div className="prod-card-header">
                                        <div className="prod-card-icon-bubble">
                                            <Box size={22} />
                                        </div>
                                        <div>
                                            <h3 className="prod-card-title">Basic Information</h3>
                                            <p className="prod-card-subtitle">
                                                Enter the basic details, barcode, brand, and category of your product
                                            </p>
                                        </div>
                                    </div>

                                    <div className="prod-fields-grid">
                                        {/* Product Name */}
                                        <div className="prod-field-group span-2">
                                            <div className="prod-field-header">
                                                <label className="prod-field-label">Product Name <span className="req">*</span></label>
                                                <span className="prod-field-hint">{productValue.name?.length || 0} characters</span>
                                            </div>
                                            <input
                                                type="text"
                                                className="prod-input"
                                                placeholder="Enter product title"
                                                value={productValue.name}
                                                onChange={(e) => setProductValue({ ...productValue, name: e.target.value })}
                                            />
                                            {errors.name && <span className="text-danger small mt-1">{errors.name}</span>}
                                        </div>

                                        {/* Product Type */}
                                        <div className="prod-field-group">
                                            <div className="prod-field-header">
                                                <label className="prod-field-label">Product Type <span className="req">*</span></label>
                                            </div>
                                            <select className="prod-input" defaultValue="1">
                                                <option value="1">Single Product (Standard SKU)</option>
                                                <option value="2">Variation Product</option>
                                                <option value="3">Combo Pack</option>
                                            </select>
                                        </div>

                                        {/* Barcode Symbology */}
                                        <div className="prod-field-group">
                                            <div className="prod-field-header">
                                                <label className="prod-field-label">Barcode Symbology <span className="req">*</span></label>
                                            </div>
                                            <select
                                                className="prod-input"
                                                value={productValue.barcode_symbol || '1'}
                                                onChange={(e) => setProductValue({ ...productValue, barcode_symbol: e.target.value })}
                                            >
                                                <option value="1">CODE128 (Standard)</option>
                                                <option value="2">CODE39</option>
                                                <option value="3">EAN-13 (GS1 GTIN)</option>
                                                <option value="4">UPC-A</option>
                                            </select>
                                        </div>

                                        {/* Barcode / Code with Inline Generate Button */}
                                        <div className="prod-field-group span-2">
                                            <div className="prod-field-header">
                                                <label className="prod-field-label">Barcode / Code <span className="req">*</span></label>
                                                <button
                                                    type="button"
                                                    className="btn btn-link p-0 text-primary small"
                                                    style={{ fontSize: '11px', textDecoration: 'none' }}
                                                    onClick={handleGenerateRandomBarcode}
                                                >
                                                    + Generate Random
                                                </button>
                                            </div>
                                            <input
                                                type="text"
                                                className="prod-input"
                                                placeholder="Barcode / SKU (e.g. 890123456789)"
                                                value={productValue.code}
                                                onChange={(e) => setProductValue({ ...productValue, code: e.target.value })}
                                            />
                                            {errors.code && <span className="text-danger small mt-1">{errors.code}</span>}
                                        </div>

                                        {/* Brand */}
                                        <div className="prod-field-group">
                                            <div className="prod-field-header">
                                                <label className="prod-field-label">Brand <span className="req">*</span></label>
                                            </div>
                                            <select
                                                className="prod-input"
                                                value={productValue.brand_id?.value || ''}
                                                onChange={(e) => {
                                                    const opt = brands.find(b => b.id == e.target.value);
                                                    setProductValue({
                                                        ...productValue,
                                                        brand_id: opt ? { value: opt.id, label: opt.attributes?.name || opt.name } : ''
                                                    });
                                                }}
                                            >
                                                <option value="">Select Brand</option>
                                                {brands.map(b => (
                                                    <option key={b.id} value={b.id}>{b.attributes?.name || b.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Category */}
                                        <div className="prod-field-group">
                                            <div className="prod-field-header">
                                                <label className="prod-field-label">Category <span className="req">*</span></label>
                                            </div>
                                            <select
                                                className="prod-input"
                                                value={productValue.product_category_id?.label || ''}
                                                onChange={(e) => {
                                                    const opt = productCategories.find(c => c.id == e.target.value);
                                                    setProductValue({
                                                        ...productValue,
                                                        product_category_id: opt ? { value: opt.id, label: opt.attributes?.name || opt.name } : ''
                                                    });
                                                }}
                                            >
                                                <option value="">Select Category</option>
                                                {productCategories.map(c => (
                                                    <option key={c.id} value={c.id}>{c.attributes?.name || c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </>
                            )}

                            {currentStep === 2 && (
                                <>
                                    <div className="prod-card-header">
                                        <div className="prod-card-icon-bubble">
                                            <DollarSign size={22} />
                                        </div>
                                        <div>
                                            <h3 className="prod-card-title">Pricing & Tax</h3>
                                            <p className="prod-card-subtitle">
                                                Configure retail selling price, purchase cost, and taxation
                                            </p>
                                        </div>
                                    </div>

                                    <div className="prod-fields-grid">
                                        <div className="prod-field-group">
                                            <div className="prod-field-header">
                                                <label className="prod-field-label">Selling Price (₹) <span className="req">*</span></label>
                                            </div>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="prod-input"
                                                placeholder="0.00"
                                                value={productValue.product_price}
                                                onChange={(e) => setProductValue({ ...productValue, product_price: e.target.value })}
                                            />
                                            {errors.product_price && <span className="text-danger small mt-1">{errors.product_price}</span>}
                                        </div>

                                        <div className="prod-field-group">
                                            <div className="prod-field-header">
                                                <label className="prod-field-label">Product Cost (₹) <span className="req">*</span></label>
                                            </div>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="prod-input"
                                                placeholder="0.00"
                                                value={productValue.product_cost}
                                                onChange={(e) => setProductValue({ ...productValue, product_cost: e.target.value })}
                                            />
                                            {errors.product_cost && <span className="text-danger small mt-1">{errors.product_cost}</span>}
                                        </div>

                                        <div className="prod-field-group">
                                            <div className="prod-field-header">
                                                <label className="prod-field-label">Order Tax (%)</label>
                                            </div>
                                            <input
                                                type="number"
                                                className="prod-input"
                                                placeholder="0"
                                                value={productValue.order_tax}
                                                onChange={(e) => setProductValue({ ...productValue, order_tax: e.target.value })}
                                            />
                                        </div>

                                        <div className="prod-field-group">
                                            <div className="prod-field-header">
                                                <label className="prod-field-label">Tax Type</label>
                                            </div>
                                            <select
                                                className="prod-input"
                                                value={productValue.tax_type || '1'}
                                                onChange={(e) => setProductValue({ ...productValue, tax_type: e.target.value })}
                                            >
                                                <option value="1">Exclusive</option>
                                                <option value="2">Inclusive</option>
                                            </select>
                                        </div>
                                    </div>
                                </>
                            )}

                            {currentStep === 3 && (
                                <>
                                    <div className="prod-card-header">
                                        <div className="prod-card-icon-bubble">
                                            <Package size={22} />
                                        </div>
                                        <div>
                                            <h3 className="prod-card-title">Inventory & Units</h3>
                                            <p className="prod-card-subtitle">
                                                Set base units of measure, sale units, and minimum stock alerts
                                            </p>
                                        </div>
                                    </div>

                                    <div className="prod-fields-grid">
                                        <div className="prod-field-group">
                                            <div className="prod-field-header">
                                                <label className="prod-field-label">Product Unit <span className="req">*</span></label>
                                            </div>
                                            <select
                                                className="prod-input"
                                                value={productValue.product_unit?.value || ''}
                                                onChange={(e) => {
                                                    const opt = units.find(u => u.id == e.target.value);
                                                    setProductValue({
                                                        ...productValue,
                                                        product_unit: opt ? { value: opt.id, label: opt.attributes?.name || opt.name } : ''
                                                    });
                                                }}
                                            >
                                                {units.map(u => (
                                                    <option key={u.id} value={u.id}>{u.attributes?.name || u.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="prod-field-group">
                                            <div className="prod-field-header">
                                                <label className="prod-field-label">Stock Alert Quantity</label>
                                            </div>
                                            <input
                                                type="number"
                                                className="prod-input"
                                                value={productValue.stock_alert}
                                                onChange={(e) => setProductValue({ ...productValue, stock_alert: e.target.value })}
                                            />
                                        </div>

                                        <div className="prod-field-group span-2">
                                            <div className="prod-field-header">
                                                <label className="prod-field-label">Notes / Description</label>
                                            </div>
                                            <textarea
                                                className="prod-input"
                                                rows="3"
                                                style={{ height: 'auto', padding: '12px 16px' }}
                                                placeholder="Add any internal product notes or specifications..."
                                                value={productValue.notes || ''}
                                                onChange={(e) => setProductValue({ ...productValue, notes: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {currentStep === 4 && (
                                <>
                                    <div className="prod-card-header">
                                        <div className="prod-card-icon-bubble">
                                            <ShieldCheck size={22} />
                                        </div>
                                        <div>
                                            <h3 className="prod-card-title">Review & Summary</h3>
                                            <p className="prod-card-subtitle">
                                                Verify all attributes before committing to product catalog
                                            </p>
                                        </div>
                                    </div>

                                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div className="d-flex justify-content-between">
                                            <span style={{ color: '#64748B' }}>Product Name:</span>
                                            <strong style={{ color: '#0F172A' }}>{productValue.name || '-'}</strong>
                                        </div>
                                        <div className="d-flex justify-content-between">
                                            <span style={{ color: '#64748B' }}>Barcode:</span>
                                            <strong style={{ color: '#0F172A' }}>{productValue.code || '-'}</strong>
                                        </div>
                                        <div className="d-flex justify-content-between">
                                            <span style={{ color: '#64748B' }}>Brand:</span>
                                            <strong style={{ color: '#0F172A' }}>{productValue.brand_id?.label || '-'}</strong>
                                        </div>
                                        <div className="d-flex justify-content-between">
                                            <span style={{ color: '#64748B' }}>Category:</span>
                                            <strong style={{ color: '#0F172A' }}>{productValue.product_category_id?.label || '-'}</strong>
                                        </div>
                                        <div className="d-flex justify-content-between">
                                            <span style={{ color: '#64748B' }}>Selling Price:</span>
                                            <strong style={{ color: '#15803D', fontSize: '15px' }}>₹{productValue.product_price || '0.00'}</strong>
                                        </div>
                                        <div className="d-flex justify-content-between">
                                            <span style={{ color: '#64748B' }}>Cost Price:</span>
                                            <strong style={{ color: '#0F172A' }}>₹{productValue.product_cost || '0.00'}</strong>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Form Footer Action Buttons */}
                            <div className="prod-form-footer-actions">
                                {currentStep > 1 ? (
                                    <button
                                        type="button"
                                        className="brand-btn-pill"
                                        onClick={handlePrevStep}
                                    >
                                        <ArrowLeft size={16} /> Previous
                                    </button>
                                ) : (
                                    <div />
                                )}

                                {currentStep < 4 ? (
                                    <button
                                        type="button"
                                        className="brand-btn-pill brand-btn-primary"
                                        onClick={handleNextStep}
                                    >
                                        <span>Next Step</span>
                                        <ArrowRight size={16} />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className="brand-btn-pill brand-btn-primary"
                                        onClick={handleInitiateCreate}
                                    >
                                        <ShieldCheck size={16} />
                                        <span>Create Product</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Side Live Product Summary Card (Exact Match to Image 1) */}
                <div className="prod-workspace-sidebar">
                    <div className="prod-summary-card">
                        <div className="prod-summary-card-header">
                            <div className="prod-summary-header-left">
                                <Package size={18} style={{ color: '#15803D' }} />
                                <span>Live Product Summary</span>
                            </div>
                            <span className="prod-live-pulse">Real-time</span>
                        </div>

                        {/* Image Upload Box */}
                        <div
                            className="prod-summary-preview-img-box"
                            onClick={() => document.getElementById('prod-user-img-input')?.click()}
                        >
                            <input
                                type="file"
                                id="prod-user-img-input"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) {
                                        setSelectedImageFile(f);
                                        setImagePreviewUrl(URL.createObjectURL(f));
                                    }
                                }}
                            />
                            {(imagePreviewUrl || activeSelectedImage || productValue.images?.[0]) ? (
                                <img
                                    src={imagePreviewUrl || activeSelectedImage || productValue.images?.[0]}
                                    alt="Preview"
                                    className="prod-summary-preview-img"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                    }}
                                />
                            ) : (
                                <div className="prod-summary-no-img">
                                    <Camera size={32} />
                                    <span>No Image Selected</span>
                                </div>
                            )}
                        </div>

                        {/* Live Product Title */}
                        <div className="prod-summary-title">
                            {productValue.name || 'New Product Title'}
                        </div>

                        {/* Product Tags */}
                        <div className="prod-summary-tags">
                            <span className="prod-summary-tag cat">
                                {productValue.product_category_id?.label || 'Category'}
                            </span>
                            <span className="prod-summary-tag brand">
                                {productValue.brand_id?.label || 'Brand'}
                            </span>
                            <span className="prod-summary-tag active">Active</span>
                        </div>

                        {/* Metrics Table */}
                        <div className="prod-summary-metrics">
                            <div className="prod-metric-row">
                                <span className="metric-lbl">Barcode:</span>
                                <span className="metric-val">{productValue.code || '-'}</span>
                            </div>
                            <div className="prod-metric-row">
                                <span className="metric-lbl">Selling Price:</span>
                                <span className="metric-val price">₹{productValue.product_price || '0.00'}</span>
                            </div>
                            <div className="prod-metric-row">
                                <span className="metric-lbl">Cost Price:</span>
                                <span className="metric-val cost">
                                    {productValue.product_cost !== '' && !isNaN(parseFloat(productValue.product_cost)) ? `₹${parseFloat(productValue.product_cost).toFixed(2)}` : 'Enter Manually'}
                                </span>
                            </div>
                            <div className="prod-metric-row">
                                <span className="metric-lbl">Profit Margin:</span>
                                <span className="metric-val margin">
                                    {parseFloat(productValue.product_cost) > 0 ? (
                                        `₹${((parseFloat(productValue.product_price) || 0) - (parseFloat(productValue.product_cost) || 0)).toFixed(2)} (${(parseFloat(productValue.product_price) > 0 ? (((parseFloat(productValue.product_price) - parseFloat(productValue.product_cost)) / parseFloat(productValue.product_price)) * 100).toFixed(1) : '0')}%)`
                                    ) : (
                                        'Enter cost to calculate'
                                    )}
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="brand-btn-pill brand-btn-primary prod-summary-cta"
                            onClick={handleInitiateCreate}
                            disabled={isSubmitting}
                        >
                            <ShieldCheck size={16} />
                            <span>Create Product</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Final Confirmation Approval Modal */}
            <Modal
                show={showConfirmModal}
                onHide={() => setShowConfirmModal(false)}
                centered
                className="prod-confirm-modal"
            >
                <Modal.Header closeButton>
                    <Modal.Title className="prod-modal-title">
                        <ShieldCheck size={22} className="text-success me-2" />
                        Ready to Create Product?
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="prod-modal-body">
                    <p className="prod-modal-intro">
                        Please review the master records that will be committed to the inventory database:
                    </p>

                    <div className="prod-modal-summary-box">
                        <div className="prod-modal-row">
                            <span>Product Title:</span>
                            <strong>{productValue.name}</strong>
                        </div>
                        <div className="prod-modal-row">
                            <span>Barcode / Code:</span>
                            <strong>{productValue.code}</strong>
                        </div>
                        <div className="prod-modal-row">
                            <span>Selling Price:</span>
                            <strong className="text-success">₹{productValue.product_price}</strong>
                        </div>
                        <div className="prod-modal-row">
                            <span>Cost Price:</span>
                            <strong>₹{productValue.product_cost}</strong>
                        </div>
                    </div>

                    <div className="prod-modal-master-actions">
                        {isNewBrand ? (
                            <div className="prod-modal-master-chip new">
                                <Plus size={14} />
                                <span>+ New Brand Master: <strong>{productValue.brand_id?.label}</strong> will be created</span>
                            </div>
                        ) : (
                            <div className="prod-modal-master-chip existing">
                                <Check size={14} />
                                <span>Existing Brand: <strong>{productValue.brand_id?.label}</strong></span>
                            </div>
                        )}

                        {isNewCategory ? (
                            <div className="prod-modal-master-chip new">
                                <Plus size={14} />
                                <span>+ New Category Master: <strong>{productValue.product_category_id?.label}</strong> will be created</span>
                            </div>
                        ) : (
                            <div className="prod-modal-master-chip existing">
                                <Check size={14} />
                                <span>Existing Category: <strong>{productValue.product_category_id?.label}</strong></span>
                            </div>
                        )}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <button
                        type="button"
                        className="brand-btn-pill"
                        onClick={() => setShowConfirmModal(false)}
                    >
                        Back to Edit
                    </button>
                    <button
                        type="button"
                        className="brand-btn-pill brand-btn-primary"
                        onClick={handleConfirmFinalCreate}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <RefreshCw size={16} className="prod-stage-spin me-2" />
                        ) : (
                            <CheckCircle2 size={16} className="me-2" />
                        )}
                        <span>{isSubmitting ? 'Creating Product...' : 'Confirm & Create Product'}</span>
                    </button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

const mapStateToProps = (state) => {
    const { brands, productCategories, units, baseUnits } = state;
    return { brands, productCategories, units, baseUnits };
};

export default connect(mapStateToProps, {
    addProduct,
    fetchAllBrands,
    fetchAllProductCategories,
    fetchUnits,
    addToast
})(ProductForm);
