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
    Clipboard,
    Edit2,
    Image as ImageIcon
} from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/library';
import JsBarcode from 'jsbarcode';
import apiConfig from '../../config/apiConfig';
import { addToast } from '../../store/action/toastAction';
import { addProduct, fetchAllMainProducts } from '../../store/action/productAction';
import { fetchAllBrands } from '../../store/action/brandsAction';
import { fetchAllProductCategories } from '../../store/action/productCategoryAction';
import { fetchUnits } from '../../store/action/unitsAction';
import { fetchAllWarehouses } from '../../store/action/warehouseAction';
import { fetchVariations } from '../../store/action/variationAction';
import './ProductFormPremium.css';

const PRESET_POS_ICONS = [
    { id: 'snack', name: 'Snacks & Tin', emoji: '🍿', color: '#D97706', bg: '#FEF3C7' },
    { id: 'frozen', name: 'Frozen Food', emoji: '❄️', color: '#0284C7', bg: '#E0F2FE' },
    { id: 'grocery', name: 'Groceries / Fresh', emoji: '🥦', color: '#10B981', bg: '#ECFDF5' },
    { id: 'beverage', name: 'Drinks & Beverages', emoji: '🥤', color: '#06B6D4', bg: '#CFFAFE' },
    { id: 'bakery', name: 'Bakery & Bread', emoji: '🍞', color: '#B45309', bg: '#FEF3C7' },
    { id: 'meat', name: 'Meat & Poultry', emoji: '🥩', color: '#EF4444', bg: '#FEE2E2' },
    { id: 'fastfood', name: 'Fast Food', emoji: '🍟', color: '#EA580C', bg: '#FFEDD5' },
    { id: 'cafe', name: 'Cafe & Hot Drinks', emoji: '☕', color: '#78350F', bg: '#F5EBE6' },
    { id: 'sweets', name: 'Chocolates & Sweets', emoji: '🍫', color: '#8B5CF6', bg: '#EDE9FE' },
    { id: 'dairy', name: 'Milk & Dairy', emoji: '🥛', color: '#2563EB', bg: '#DBEAFE' },
    { id: 'pharma', name: 'Health & Pharma', emoji: '💊', color: '#059669', bg: '#D1FAE5' },
    { id: 'apparel', name: 'Clothing & Apparel', emoji: '👕', color: '#DB2777', bg: '#FCE7F3' },
    { id: 'electronics', name: 'Electronics', emoji: '📱', color: '#4F46E5', bg: '#E0E7FF' },
    { id: 'general', name: 'General Retail', emoji: '📦', color: '#475569', bg: '#F1F5F9' },
];

const createIconBlob = (icon, title) => {
    return new Promise((resolve) => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 400;
            canvas.height = 400;
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(null);

            // Background
            ctx.fillStyle = icon.bg || '#F8FAFC';
            ctx.fillRect(0, 0, 400, 400);

            // Inner circle
            ctx.beginPath();
            ctx.arc(200, 175, 115, 0, 2 * Math.PI);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            ctx.lineWidth = 4;
            ctx.strokeStyle = icon.color || '#10B981';
            ctx.stroke();

            // Emoji
            ctx.font = '95px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(icon.emoji || '📦', 200, 175);

            // Label
            ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
            ctx.fillStyle = '#1E293B';
            const displayTitle = (title || icon.name || 'Product').substring(0, 22);
            ctx.fillText(displayTitle, 200, 335);

            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], `${icon.id || 'pos_icon'}.png`, { type: 'image/png' });
                    resolve(file);
                } else {
                    resolve(null);
                }
            }, 'image/png');
        } catch (e) {
            resolve(null);
        }
    });
};

const RealBarcodeCanvas = ({ value = '' }) => {
    const canvasRef = useRef(null);
    const rawVal = String(value || '8904152110902').trim();

    useEffect(() => {
        if (canvasRef.current && rawVal) {
            try {
                JsBarcode(canvasRef.current, rawVal, {
                    format: "CODE128",
                    lineColor: "#000000",
                    width: 2.2,
                    height: 60,
                    displayValue: true,
                    font: "monospace",
                    fontSize: 14,
                    textMargin: 5,
                    fontOptions: "bold",
                    background: "#FFFFFF",
                    margin: 8
                });
            } catch (e) {
                console.warn('JsBarcode render notice:', e);
            }
        }
    }, [rawVal]);

    if (!rawVal) return null;

    return (
        <div style={{ textAlign: 'center', background: '#FFFFFF', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #CBD5E1', display: 'inline-block', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <canvas ref={canvasRef} style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto' }} />
        </div>
    );
};

const ProductForm = (props) => {
    const {
        addProduct,
        fetchAllBrands,
        fetchAllProductCategories,
        fetchUnits,
        fetchAllWarehouses,
        fetchVariations,
        fetchAllMainProducts,
        brands = [],
        productCategories = [],
        units = [],
        warehouses = [],
        variations = [],
        products = [],
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
    const [extractionProgress, setExtractionProgress] = useState(0);
    const [extractionStepIndex, setExtractionStepIndex] = useState(0);
    const progressIntervalRef = useRef(null);

    // Step Wizard
    const [currentStep, setCurrentStep] = useState(1);

    // Confirmation Modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Local form state
    const [productValue, setProductValue] = useState({
        name: '',
        product_type: '1',
        barcode_symbol: '1',
        sku: '',
        code: '', // Barcode
        product_category_id: '',
        brand_id: '',
        warehouse_id: '',
        product_cost: '',
        product_price: '',
        mrp: '',
        product_unit: '',
        sale_unit: '',
        purchase_unit: '',
        stock_alert: 10,
        initial_stock: '',
        order_tax: 0,
        tax_type: '1',
        hsn_code: '',
        pos_name: '',
        quick_sale: true,
        allow_discount: true,
        weighing_scale: false,
        returnable: true,
        batch_number: '',
        expiry_date: '',
        notes: '',
        images: []
    });

    // Variation product state
    const [selectedVariationId, setSelectedVariationId] = useState('');
    const [variantsList, setVariantsList] = useState([]);

    // Combo pack state
    const [selectedComboProductId, setSelectedComboProductId] = useState('');
    const [comboItemQty, setComboItemQty] = useState(1);
    const [comboItems, setComboItems] = useState([]);

    // Visual / Icon selection state
    const [selectedIcon, setSelectedIcon] = useState(null);
    const [showImagePromptModal, setShowImagePromptModal] = useState(false);
    const [visualTab, setVisualTab] = useState('upload'); // 'upload' | 'url' | 'paste' | 'icons'
    const [customImageUrl, setCustomImageUrl] = useState('');
    const [isFetchingUrl, setIsFetchingUrl] = useState(false);

    // Modal quick barcode edit state
    const [tempModalBarcode, setTempModalBarcode] = useState('');
    const [isEditingBarcodeInModal, setIsEditingBarcodeInModal] = useState(false);

    // Modal success celebration state
    const [createSuccessAnim, setCreateSuccessAnim] = useState(false);
    const [createdProductName, setCreatedProductName] = useState('');
    const [autofillActive, setAutofillActive] = useState(false);

    // AI Extraction to Product Creation Wizard Transition States
    const [isAiCompleted, setIsAiCompleted] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [aiFieldsTouched, setAiFieldsTouched] = useState({});
    const [extractionError, setExtractionError] = useState(null);

    const [errors, setErrors] = useState({});

    // Global Clipboard Paste Listener (Ctrl+V)
    useEffect(() => {
        const handleGlobalPaste = (e) => {
            if (e.clipboardData && e.clipboardData.items) {
                const items = e.clipboardData.items;
                for (let i = 0; i < items.length; i++) {
                    if (items[i].type && items[i].type.indexOf('image') !== -1) {
                        const file = items[i].getAsFile();
                        if (file) {
                            setSelectedImageFile(file);
                            setImagePreviewUrl(URL.createObjectURL(file));
                            setSelectedIcon(null);
                            addToast({ text: '✓ Image pasted from clipboard!', type: 'success' });
                            e.preventDefault();
                            break;
                        }
                    }
                }
            }
        };
        window.addEventListener('paste', handleGlobalPaste);
        return () => window.removeEventListener('paste', handleGlobalPaste);
    }, []);

    // Load initial master data
    useEffect(() => {
        fetchAllBrands();
        fetchAllProductCategories();
        fetchUnits();
        if (fetchAllWarehouses) fetchAllWarehouses();
        if (fetchVariations) fetchVariations({}, false);
        if (fetchAllMainProducts) fetchAllMainProducts({ pageSize: 100 }, false);
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

    // Set default warehouse once warehouses load
    useEffect(() => {
        if (warehouses && warehouses.length > 0 && !productValue.warehouse_id) {
            setProductValue(prev => ({
                ...prev,
                warehouse_id: prev.warehouse_id || warehouses[0].id
            }));
        }
    }, [warehouses]);

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

    // Clipboard & Quick Helper handlers
    const handlePasteUrlFromClipboard = async () => {
        try {
            if (navigator.clipboard && navigator.clipboard.readText) {
                const text = await navigator.clipboard.readText();
                if (text && text.trim()) {
                    setProductUrl(text.trim());
                    if (extractionError) setExtractionError(null);
                    addToast({ text: '✓ Product URL pasted from clipboard!', type: 'success' });
                    return;
                }
            }
            addToast({ text: 'Clipboard is empty. Copy a product link first.', type: 'info' });
        } catch (e) {
            addToast({ text: 'Press Ctrl+V to paste link directly into the input.', type: 'info' });
        }
    };

    const handleApplySampleUrl = (url) => {
        setProductUrl(url);
        if (extractionError) setExtractionError(null);
        addToast({ text: '✓ Sample link loaded! Click Extract Details to run.', type: 'success' });
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

        // Real-Time Extraction Progress Tracker
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
        }
        setExtractionProgress(15);
        setExtractionStepIndex(0);

        const timer = setInterval(() => {
            setExtractionProgress(prev => {
                if (prev < 35) {
                    setExtractionStepIndex(1);
                    setExtractionStage('Inspecting DOM, product imagery & structured JSON-LD specifications...');
                    return prev + 6;
                } else if (prev < 68) {
                    setExtractionStepIndex(2);
                    setExtractionStage('AI Neural parsing: Brand, Category, Pack Size & Variation attributes...');
                    return prev + 5;
                } else if (prev < 90) {
                    setExtractionStepIndex(3);
                    setExtractionStage('Mapping master POS units, pricing & barcode integrity verification...');
                    return prev + 3;
                }
                return prev;
            });
        }, 320);
        progressIntervalRef.current = timer;

        // ZERO-CACHE: Immediately clear previous extraction state
        setExtractedData(null);
        setActiveSelectedImage(null);
        setImagePreviewUrl(null);
        setSelectedImageFile(null);
        setExistingProductWarning(null);
        setExtractionStatus('ANALYZING');
        setIsExtracting(true);
        setActiveExtractionId(requestId);
        setExtractionStage(mode === 'url' ? 'Connecting to product marketplace & registry...' : (mode === 'image' ? 'Processing packaging photo & OCR text...' : 'Connecting to global barcode registries...'));
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
            let response;
            if (mode === 'image') {
                const formData = new FormData();
                formData.append('requestId', requestId);
                formData.append('mode', mode);
                effectiveFiles.forEach(f => formData.append('images[]', f));
                setExtractionStage('Analyzing packaging typography & specs...');
                response = await apiConfig.post('extract-product-details', formData, {
                    signal: controller.signal
                });
            } else {
                const payload = {
                    requestId,
                    mode,
                    url: effectiveUrl.trim(),
                    barcode: effectiveBarcode.trim(),
                    search: effectiveSearch.trim(),
                };
                if (mode === 'url') {
                    setExtractionStage('Extracting verified packaging & catalog specs from ' + effectiveUrl.trim().substring(0, 30) + '...');
                } else if (mode === 'barcode') {
                    setExtractionStage(`Looking up GTIN / EAN [${effectiveBarcode.trim()}] in global registries...`);
                } else if (mode === 'search') {
                    setExtractionStage(`Searching catalog for "${effectiveSearch.trim()}"...`);
                }
                response = await apiConfig.post('extract-product-details', payload, {
                    signal: controller.signal
                });
            }

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

                let matchedUnit = null;
                const rawUnit = (data.unit || data.pack_size || '').toLowerCase();
                if (units && units.length > 0 && rawUnit) {
                    // 1. Exact or multi-pack match first (e.g. "1 pack (3 pcs)", "Pack of 3")
                    matchedUnit = units.find(u => {
                        const uName = (u.attributes?.name || u.name || '').toLowerCase();
                        const uShort = (u.attributes?.short_name || u.short_name || '').toLowerCase();
                        return uName === rawUnit || uShort === rawUnit ||
                               (rawUnit.includes('pack') && uName.includes('pack') && (rawUnit.includes('3') ? uName.includes('3') : true)) ||
                               uName.includes(rawUnit) || rawUnit.includes(uName);
                    });

                    // 2. Comprehensive Category matching
                    if (!matchedUnit) {
                        const targetUnit = rawUnit;
                        if (targetUnit.includes('pack') || targetUnit.includes('packet')) {
                            matchedUnit = units.find(u => 
                                (u.attributes?.name || u.name || '').toLowerCase().includes('pack') ||
                                (u.attributes?.short_name || u.short_name || '').toLowerCase() === 'pkt'
                            );
                        } else if (targetUnit.includes('bottle') || targetUnit.includes('btl')) {
                            matchedUnit = units.find(u => (u.attributes?.name || u.name || '').toLowerCase().includes('bottle'));
                        } else if (targetUnit.includes('can') || targetUnit.includes('tin')) {
                            matchedUnit = units.find(u => (u.attributes?.name || u.name || '').toLowerCase().includes('can') || (u.attributes?.name || u.name || '').toLowerCase().includes('tin'));
                        } else if (targetUnit.includes('jar')) {
                            matchedUnit = units.find(u => (u.attributes?.name || u.name || '').toLowerCase().includes('jar'));
                        } else if (targetUnit.includes('tube')) {
                            matchedUnit = units.find(u => (u.attributes?.name || u.name || '').toLowerCase().includes('tube'));
                        } else if (targetUnit.includes('box') || targetUnit.includes('carton') || targetUnit.includes('ctn')) {
                            matchedUnit = units.find(u => (u.attributes?.name || u.name || '').toLowerCase().includes('box') || (u.attributes?.name || u.name || '').toLowerCase().includes('carton'));
                        } else if (targetUnit.includes('pouch') || targetUnit.includes('bag') || targetUnit.includes('sachet')) {
                            matchedUnit = units.find(u => (u.attributes?.name || u.name || '').toLowerCase().includes('pouch') || (u.attributes?.name || u.name || '').toLowerCase().includes('bag'));
                        } else if (targetUnit.includes('strip') || targetUnit.includes('tablet') || targetUnit.includes('capsule')) {
                            matchedUnit = units.find(u => (u.attributes?.name || u.name || '').toLowerCase().includes('strip'));
                        } else if (targetUnit.includes('roll')) {
                            matchedUnit = units.find(u => (u.attributes?.name || u.name || '').toLowerCase().includes('roll'));
                        } else if (targetUnit.includes('pair') || targetUnit.includes('prs') || targetUnit.includes('shoe') || targetUnit.includes('sandal') || targetUnit.includes('sock')) {
                            matchedUnit = units.find(u => (u.attributes?.name || u.name || '').toLowerCase().includes('pair'));
                        } else if (targetUnit.includes('dozen') || targetUnit.includes('doz')) {
                            matchedUnit = units.find(u => (u.attributes?.name || u.name || '').toLowerCase().includes('dozen'));
                        } else if (targetUnit.includes('set')) {
                            matchedUnit = units.find(u => (u.attributes?.name || u.name || '').toLowerCase().includes('set'));
                        } else if (targetUnit.includes('meter') || targetUnit.includes('mtr') || targetUnit.includes('metre')) {
                            matchedUnit = units.find(u => (u.attributes?.name || u.name || '').toLowerCase().includes('meter'));
                        } else if (targetUnit.includes('gm') || targetUnit.includes('gram')) {
                            matchedUnit = units.find(u => 
                                (u.attributes?.name || u.name || '').toLowerCase().includes('gram') || 
                                (u.attributes?.short_name || u.short_name || '').toLowerCase() === 'gms' ||
                                (u.attributes?.short_name || u.short_name || '').toLowerCase() === 'gm'
                            );
                        } else if (targetUnit.includes('kg') || targetUnit.includes('kilo')) {
                            matchedUnit = units.find(u => 
                                (u.attributes?.name || u.name || '').toLowerCase().includes('kilo') || 
                                (u.attributes?.short_name || u.short_name || '').toLowerCase() === 'kg'
                            );
                        } else if (targetUnit.includes('ml') || targetUnit.includes('milli')) {
                            matchedUnit = units.find(u => 
                                (u.attributes?.name || u.name || '').toLowerCase().includes('milli') || 
                                (u.attributes?.short_name || u.short_name || '').toLowerCase() === 'ml'
                            );
                        } else if (targetUnit.includes('l') || targetUnit.includes('ltr') || targetUnit.includes('litre')) {
                            matchedUnit = units.find(u => 
                                (u.attributes?.name || u.name || '').toLowerCase().includes('litre') || 
                                (u.attributes?.short_name || u.short_name || '').toLowerCase() === 'ltr'
                            );
                        } else if (targetUnit.includes('pc') || targetUnit.includes('piece') || targetUnit.includes('unit') || targetUnit.includes('item') || targetUnit.includes('nos')) {
                            matchedUnit = units.find(u => 
                                (u.attributes?.name || u.name || '').toLowerCase().includes('piece') || 
                                (u.attributes?.short_name || u.short_name || '').toLowerCase() === 'pcs' ||
                                (u.attributes?.short_name || u.short_name || '').toLowerCase() === 'pc'
                            );
                        }
                    }
                }
                if (!matchedUnit && units && units.length > 0) {
                    matchedUnit = units.find(u => (u.attributes?.name || u.name || '').toLowerCase().includes('piece')) || units[0];
                }

                const primaryImg = data.image_url || (data.images && data.images.length > 0 ? (typeof data.images[0] === 'string' ? data.images[0] : (data.images[0].url || null)) : null);
                if (primaryImg) {
                    setActiveSelectedImage(primaryImg);
                    setImagePreviewUrl(primaryImg);
                    setSelectedImageFile(primaryImg);
                }

                // Generate SKU if not provided; keep Barcode EMPTY by default as requested
                const smartSku = generateSmartSku(data.name || 'PROD');
                const barcodeVal = (data.barcode && String(data.barcode).trim()) ? String(data.barcode).trim() : '';

                const finalBrand = matchedBrand 
                    ? { value: matchedBrand.id, label: matchedBrand.attributes?.name || matchedBrand.name } 
                    : (data.brand ? { value: 'new', label: data.brand } : '');

                const finalCategory = matchedCategory 
                    ? { value: matchedCategory.id, label: matchedCategory.attributes?.name || matchedCategory.name } 
                    : (data.category ? { value: 'new', label: data.category } : '');

                // Reset error and touched state
                setExtractionError(null);
                setAiFieldsTouched({});

                const detectedType = String(data.product_type || '1');

                // If Variation Product (2), auto-populate ONLY the specific size/color variant present in the link
                if (detectedType === '2') {
                    const baseSku = data.sku || smartSku;
                    const pCost = data.cost ? String(data.cost) : String(Math.round(Number(data.price || 0) * 0.75));
                    const pPrice = data.price ? String(data.price) : '0.00';
                    const colorName = data.additional?.['Colour name'] || data.additional?.Colour || '';
                    const detectedSize = data.additional?.Size || (data.name.match(/\b(XS|S|M|L|XL|XXL|XXXL|[0-9]{2})\b/i) ? data.name.match(/\b(XS|S|M|L|XL|XXL|XXXL|[0-9]{2})\b/i)[1] : 'L');
                    
                    const variantTitle = colorName 
                        ? `${data.name || 'Product'} - ${colorName} / ${detectedSize}`
                        : `${data.name || 'Product'} - Size ${detectedSize}`;

                    const singleVariant = [{
                        id: 1,
                        name: variantTitle,
                        code: `${baseSku}-${detectedSize}`,
                        product_cost: pCost,
                        product_price: pPrice,
                        stock_alert: 5,
                        variation_id: 2, // Size variation
                        variation_type_id: 10 // L size
                    }];

                    setVariantsList(singleVariant);
                    setSelectedVariationId('2');
                }

                // If Combo Pack (3), auto-populate bundle items
                if (detectedType === '3') {
                    const unitStr = data.pack_size || data.additional?.Unit || '';
                    const qtyMatch = unitStr.match(/([2-9][0-9]?)\s*(?:pcs|pieces|pack|items|units)/i) || 
                                     (data.name || '').match(/pack of\s*([2-9][0-9]?)/i) || 
                                     (data.name || '').match(/set of\s*([2-9][0-9]?)/i) || 
                                     (unitStr || '').match(/pack\s*of\s*([2-9][0-9]?)/i) || [0, 3];
                    const packCount = parseInt(qtyMatch[1]) || 3;
                    const itemBaseName = (data.name || 'Item').replace(/\s*\(?(?:pack|set) of \d+\)?/i, '').trim();
                    const singlePrice = Number((Number(data.price || 0) / packCount).toFixed(2));
                    const singleCost = Number((Number(data.cost || (Number(data.price || 0) * 0.75)) / packCount).toFixed(2));

                    const initialComboItems = [{
                        product_id: 'auto_bundle_1',
                        name: itemBaseName,
                        qty: packCount,
                        price: singlePrice,
                        cost: singleCost,
                        subtotal_price: Number(data.price || 0),
                        subtotal_cost: Number(data.cost || (Number(data.price || 0) * 0.75))
                    }];
                    setComboItems(initialComboItems);
                }

                setProductValue(prev => ({
                    ...prev,
                    name: data.name || prev.name || '',
                    product_type: detectedType,
                    barcode_symbol: '1',
                    sku: data.sku || smartSku,
                    code: barcodeVal,
                    product_price: data.price ? String(data.price) : (prev.product_price || '0.00'),
                    product_cost: data.cost ? String(data.cost) : (data.price ? String(Math.round(Number(data.price) * 0.75)) : prev.product_cost),
                    mrp: data.mrp ? String(data.mrp) : (data.price ? String(Math.round(Number(data.price) * 1.25)) : prev.mrp),
                    notes: data.description || '',
                    images: primaryImg ? [primaryImg] : (data.images && data.images.length > 0 ? data.images : []),
                    brand_id: finalBrand || prev.brand_id,
                    product_category_id: finalCategory || prev.product_category_id,
                    product_unit: matchedUnit ? { value: matchedUnit.id, label: matchedUnit.attributes?.name || matchedUnit.name } : prev.product_unit,
                    purchase_unit: matchedUnit ? { value: matchedUnit.id, label: matchedUnit.attributes?.name || matchedUnit.name } : prev.purchase_unit,
                    sale_unit: matchedUnit ? { value: matchedUnit.id, label: matchedUnit.attributes?.name || matchedUnit.name } : prev.sale_unit
                }));

                if (progressIntervalRef.current) {
                    clearInterval(progressIntervalRef.current);
                }
                setExtractionProgress(100);
                setExtractionStepIndex(4);
                setExtractionStage('✓ Specifications extracted & verified! Initializing workspace...');

                // Smooth animated transition from AI extraction to Product Creation Wizard
                setIsTransitioning(true);
                setTimeout(() => {
                    setIsAiCompleted(true);
                    setCurrentStep(1);
                    setIsTransitioning(false);
                    setAutofillActive(true);
                    setTimeout(() => setAutofillActive(false), 2600);
                }, 380);

                dispatch(
                    addToast({
                        text: `✨ Product details extracted & auto-filled!`,
                        type: 'success'
                    })
                );
            } else {
                if (progressIntervalRef.current) {
                    clearInterval(progressIntervalRef.current);
                }
                setExtractionProgress(0);
                setExtractionStatus('FAILED');
                const errMsg = response.data?.message || (response.data?.conflicts && response.data.conflicts[0]) || 'Unable to extract product details. Please verify input or try again.';
                setExtractionError(errMsg);
                addToast({ text: errMsg, type: 'error' });
                setExtractionStage('');
            }
        } catch (err) {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
            setExtractionProgress(0);
            if (err.name === 'CanceledError' || err.name === 'AbortError' || err.message === 'canceled') return;
            if (activeRequestIdRef.current !== requestId) return;
            console.error('Extraction error:', err);
            setExtractionStatus('FAILED');
            const errMsg = err.response?.data?.message || (err.response?.data?.warnings && err.response.data.warnings[0]) || 'Unable to extract product details. Please verify input or try again.';
            setExtractionError(errMsg);
            addToast({ text: errMsg, type: 'error' });
            setExtractionStage('');
        } finally {
            if (activeRequestIdRef.current === requestId) {
                if (progressIntervalRef.current) {
                    clearInterval(progressIntervalRef.current);
                }
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
            if (!productValue.sku || !productValue.sku.trim()) err.sku = 'SKU is required';
            if (!productValue.code || !productValue.code.trim()) err.code = 'Barcode is required. Please scan or click + GS1 Barcode.';
            if (Object.keys(err).length > 0) {
                setErrors(err);
                addToast({ text: 'Please fill in Product Name, SKU, and Barcode to proceed.', type: 'error' });
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
        } else if (currentStep === 3) {
            const hasVisual = selectedImageFile || imagePreviewUrl || activeSelectedImage || selectedIcon || (productValue.images && productValue.images.length > 0);
            if (!hasVisual) {
                setShowImagePromptModal(true);
                return;
            }
        }
        setErrors({});
        setCurrentStep(prev => Math.min(4, prev + 1));
    };

    const handleSelectPosIcon = (icon) => {
        setSelectedIcon(icon);
        setSelectedImageFile(null);
        setImagePreviewUrl(null);
        addToast({ text: `✓ Selected POS Icon: ${icon.emoji} ${icon.name}`, type: 'success' });
    };

    const handleChooseIconAndAdvance = (icon) => {
        setSelectedIcon(icon);
        setSelectedImageFile(null);
        setImagePreviewUrl(null);
        setShowImagePromptModal(false);
        addToast({ text: `✓ Visual set: ${icon.emoji} ${icon.name}`, type: 'success' });
        setCurrentStep(4);
    };

    const handlePasteFromClipboard = async () => {
        try {
            if (navigator.clipboard && navigator.clipboard.read) {
                const clipboardItems = await navigator.clipboard.read();
                for (const clipboardItem of clipboardItems) {
                    const imageType = clipboardItem.types.find(type => type.startsWith('image/'));
                    if (imageType) {
                        const blob = await clipboardItem.getType(imageType);
                        const file = new File([blob], `pasted_image_${Date.now()}.png`, { type: imageType });
                        setSelectedImageFile(file);
                        setImagePreviewUrl(URL.createObjectURL(file));
                        setSelectedIcon(null);
                        addToast({ text: '✓ Image pasted from clipboard successfully!', type: 'success' });
                        return;
                    }
                }
                addToast({ text: 'No image found in clipboard. Press Ctrl+V or copy an image first.', type: 'info' });
            } else {
                addToast({ text: 'Press Ctrl+V anywhere on the page to paste your image.', type: 'info' });
            }
        } catch (err) {
            console.warn('Clipboard read error:', err);
            addToast({ text: 'Press Ctrl+V on your keyboard to paste the copied image.', type: 'info' });
        }
    };

    const handleFetchImageUrl = async (urlToFetch) => {
        const url = (urlToFetch || customImageUrl).trim();
        if (!url) {
            addToast({ text: 'Please enter a valid image URL (e.g. https://...)', type: 'error' });
            return;
        }
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            addToast({ text: 'Image URL must begin with http:// or https://', type: 'error' });
            return;
        }
        try {
            setIsFetchingUrl(true);
            const res = await fetch(url, { mode: 'cors' });
            if (res.ok) {
                const blob = await res.blob();
                const ext = (blob.type && blob.type.split('/')[1]) || 'png';
                const file = new File([blob], `web_image_${Date.now()}.${ext}`, { type: blob.type || 'image/png' });
                setSelectedImageFile(file);
                setImagePreviewUrl(URL.createObjectURL(file));
                setSelectedIcon(null);
                addToast({ text: '✓ Image fetched and attached successfully!', type: 'success' });
            } else {
                throw new Error('CORS or fetch error');
            }
        } catch (e) {
            // Fallback for cross-origin URLs: directly display & attach URL string
            setImagePreviewUrl(url);
            setSelectedIcon(null);
            setProductValue(prev => ({ ...prev, images: [url] }));
            addToast({ text: '✓ Web Image URL linked successfully!', type: 'success' });
        } finally {
            setIsFetchingUrl(false);
        }
    };

    const handleClearVisual = () => {
        setSelectedImageFile(null);
        setImagePreviewUrl(null);
        setSelectedIcon(null);
        setCustomImageUrl('');
        setProductValue(prev => ({ ...prev, images: [] }));
        addToast({ text: 'Visual selection cleared', type: 'info' });
    };

    const generateSmartSku = (productTitle = '') => {
        const cleanTitle = (productTitle || '').replace(/[^a-zA-Z]/g, '').toUpperCase();
        const firstLetter = cleanTitle ? cleanTitle[0] : 'M';
        const midLetter1 = cleanTitle.length > 2 ? cleanTitle[2] : 'F';
        const midLetter2 = cleanTitle.length > 4 ? cleanTitle[4] : 'T';
        const d1 = Math.floor(1000 + Math.random() * 9000); // 4 digits e.g. 0986
        const d2 = Math.floor(100 + Math.random() * 900);   // 3 digits e.g. 678
        return `${firstLetter}${d1}${midLetter1}${midLetter2}${d2}`;
    };

    const generateBarcode = () => {
        const prefix = '890';
        const numPart = Date.now().toString().slice(-9);
        const raw12 = prefix + numPart;
        let sum = 0;
        for (let i = 0; i < 12; i++) {
            sum += parseInt(raw12[i], 10) * (i % 2 === 0 ? 1 : 3);
        }
        const checkDigit = (10 - (sum % 10)) % 10;
        return raw12 + checkDigit;
    };

    const handleGenerateSku = () => {
        const generatedSku = generateSmartSku(productValue.name);
        setProductValue(prev => ({ ...prev, sku: generatedSku }));
        addToast({ text: `✓ Enterprise SKU generated: ${generatedSku}`, type: 'success' });
    };

    const handleGenerateBarcode = () => {
        const generatedBarcode = generateBarcode();
        setProductValue(prev => ({ ...prev, code: generatedBarcode, barcode_symbol: '3' }));
        if (errors.code) setErrors(prev => ({ ...prev, code: null }));
        addToast({ text: `✓ GS1 Standard EAN-13 generated: ${generatedBarcode}`, type: 'success' });
    };

    // Variation product handlers
    const handleSelectVariation = (varId) => {
        setSelectedVariationId(varId);
        const found = (variations || []).find(v => v.id == varId);
        if (found && found.attributes?.variation_types) {
            const baseSku = productValue.sku || generateSmartSku(productValue.name);
            const newVariants = found.attributes.variation_types.map(vt => ({
                id: vt.id,
                name: `${productValue.name || 'Product'} - ${vt.name}`,
                code: `${baseSku}-${vt.name.replace(/[^a-zA-Z0-9]/g, '')}`,
                product_cost: productValue.product_cost || '0',
                product_price: productValue.product_price || '0',
                stock_alert: productValue.stock_alert || 10,
                variation_id: found.id,
                variation_type_id: vt.id
            }));
            setVariantsList(newVariants);
            addToast({ text: `✓ Generated ${newVariants.length} variants from ${found.attributes.name}`, type: 'success' });
        }
    };

    const handleAddCustomVariantRow = () => {
        const idx = variantsList.length + 1;
        const baseSku = productValue.sku || generateSmartSku(productValue.name);
        const newV = {
            id: Date.now(),
            name: `${productValue.name || 'Product'} - Variant ${idx}`,
            code: `${baseSku}-V${idx}`,
            product_cost: productValue.product_cost || '0',
            product_price: productValue.product_price || '0',
            stock_alert: 10,
            variation_id: 1,
            variation_type_id: 1
        };
        setVariantsList(prev => [...prev, newV]);
    };

    const handleUpdateVariantRow = (index, field, val) => {
        setVariantsList(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: val };
            return updated;
        });
    };

    const handleRemoveVariantRow = (index) => {
        setVariantsList(prev => prev.filter((_, i) => i !== index));
    };

    // Combo pack handlers
    const handleAddComboItem = () => {
        if (!selectedComboProductId) {
            addToast({ text: 'Please select a product to bundle.', type: 'error' });
            return;
        }
        const pObj = (products || []).find(p => p.id == selectedComboProductId);
        if (!pObj) return;
        const pAttrs = pObj.attributes || pObj;
        const price = Number(pAttrs.product_price || pAttrs.price || 0);
        const cost = Number(pAttrs.product_cost || pAttrs.cost || 0);
        const qty = Number(comboItemQty) || 1;
        const newItem = {
            id: pObj.id,
            name: pAttrs.name || 'Product',
            qty: qty,
            price: price,
            cost: cost,
            subtotal_price: price * qty,
            subtotal_cost: cost * qty
        };
        const updated = [...comboItems, newItem];
        setComboItems(updated);
        const totalCost = updated.reduce((s, it) => s + it.subtotal_cost, 0);
        const totalPrice = updated.reduce((s, it) => s + it.subtotal_price, 0);
        setProductValue(prev => ({
            ...prev,
            product_cost: totalCost.toFixed(2),
            product_price: totalPrice.toFixed(2),
            mrp: (totalPrice * 1.15).toFixed(2)
        }));
        setSelectedComboProductId('');
        setComboItemQty(1);
        addToast({ text: `✓ Added ${newItem.name} to Combo Pack`, type: 'success' });
    };

    const handleRemoveComboItem = (index) => {
        const updated = comboItems.filter((_, i) => i !== index);
        setComboItems(updated);
        const totalCost = updated.reduce((s, it) => s + it.subtotal_cost, 0);
        const totalPrice = updated.reduce((s, it) => s + it.subtotal_price, 0);
        setProductValue(prev => ({
            ...prev,
            product_cost: totalCost.toFixed(2),
            product_price: totalPrice.toFixed(2),
            mrp: (totalPrice * 1.15).toFixed(2)
        }));
    };

    const handlePrevStep = () => {
        setCurrentStep(prev => Math.max(1, prev - 1));
    };

    const handleJumpToStep = (targetStep) => {
        if (targetStep < currentStep) {
            setCurrentStep(targetStep);
        } else if (targetStep > currentStep) {
            if (currentStep === 1 && (!productValue.name || !productValue.sku || !productValue.code)) {
                addToast({ text: 'Please complete Basic Info first.', type: 'error' });
                return;
            }
            if (targetStep === 4) {
                const hasVisual = selectedImageFile || imagePreviewUrl || activeSelectedImage || selectedIcon || (productValue.images && productValue.images.length > 0);
                if (!hasVisual) {
                    setShowImagePromptModal(true);
                    return;
                }
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
        if (!productValue.sku || !productValue.sku.trim()) {
            err.sku = 'SKU is required';
        }
        if (!productValue.code || !productValue.code.trim()) {
            err.code = 'Barcode is required';
        }
        if (productValue.product_price === '' || isNaN(productValue.product_price)) err.product_price = 'Selling Price is required';
        if (productValue.product_cost === '' || isNaN(productValue.product_cost)) err.product_cost = 'Product Cost is required';

        if (productValue.product_type === '2' && variantsList.length === 0) {
            addToast({ text: 'Please configure at least one variant for Variation Product.', type: 'error' });
            return;
        }

        if (Object.keys(err).length > 0) {
            setErrors(err);
            addToast({ text: 'Please complete all required product fields (*).', type: 'error' });
            return;
        }

        setErrors({});
        setTempModalBarcode(productValue.code || '');
        setIsEditingBarcodeInModal(false);
        setShowConfirmModal(true);
    };

    const handleSaveBarcodeInModal = () => {
        const clean = (tempModalBarcode || '').trim();
        if (!clean) {
            addToast({ text: 'Barcode cannot be blank', type: 'error' });
            return;
        }
        setProductValue(prev => ({ ...prev, code: clean }));
        setIsEditingBarcodeInModal(false);
        addToast({ text: `✓ Barcode updated: ${clean}`, type: 'success' });
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

            const costVal = productValue.product_cost !== '' && !isNaN(productValue.product_cost) ? productValue.product_cost : '0';
            const priceVal = productValue.product_price !== '' && !isNaN(productValue.product_price) ? productValue.product_price : '0';
            const mrpVal = productValue.mrp !== '' && !isNaN(productValue.mrp) ? productValue.mrp : Math.round(Number(priceVal) * 1.15);

            const formData = new FormData();
            formData.append('product_type', productValue.product_type || '1');
            formData.append('name', productValue.name || '');
            formData.append('code', productValue.code || productValue.sku || '');
            formData.append('product_code', productValue.sku || productValue.code || '');
            formData.append('product_cost', costVal);
            formData.append('product_price', priceVal);
            formData.append('mrp', mrpVal);
            formData.append('product_unit', unitId);
            formData.append('sale_unit', productValue.sale_unit?.value || unitId);
            formData.append('purchase_unit', productValue.purchase_unit?.value || unitId);
            formData.append('stock_alert', productValue.stock_alert || 10);
            formData.append('order_tax', productValue.order_tax || 0);
            formData.append('tax_type', productValue.tax_type || '1');
            formData.append('hsn_code', productValue.hsn_code || '');
            formData.append('barcode_symbol', productValue.barcode_symbol || '1');
            formData.append('brand_id', validBrandId);
            formData.append('product_category_id', validCategoryId);

            if (productValue.warehouse_id) {
                formData.append('warehouse_id', productValue.warehouse_id);
            }
            if (productValue.initial_stock) {
                formData.append('stock', productValue.initial_stock);
            }

            // Variation Product payload
            if (productValue.product_type === '2' && variantsList.length > 0) {
                const variationData = variantsList.map(v => ({
                    name: v.name,
                    code: v.code || `${productValue.sku || 'SKU'}-${v.name}`,
                    product_cost: Number(v.product_cost || v.cost || costVal || 0),
                    product_price: Number(v.product_price || v.price || priceVal || 0),
                    stock_alert: Number(v.stock_alert || productValue.stock_alert || 10),
                    order_tax: Number(productValue.order_tax || 0),
                    tax_type: productValue.tax_type || '1',
                    variation_id: v.variation_id || 1,
                    variation_type_id: v.variation_type_id || 1
                }));
                formData.append('variation_data', JSON.stringify(variationData));
            }

            // Combo Pack payload
            if (productValue.product_type === '3' && comboItems.length > 0) {
                const comboSummary = comboItems.map(c => `${c.qty}x ${c.name}`).join(', ');
                const fullNotes = `[Combo Pack: ${comboSummary}] ${productValue.notes || ''}`.trim();
                formData.append('notes', fullNotes);
            } else {
                formData.append('notes', productValue.notes || '');
            }

            if (selectedImageFile) {
                formData.append('images[]', selectedImageFile);
            } else if (selectedIcon) {
                try {
                    const iconFile = await createIconBlob(selectedIcon, productValue.name);
                    if (iconFile) {
                        formData.append('images[]', iconFile);
                    }
                } catch (bErr) {
                    console.warn('Icon blob notice:', bErr);
                }
            }

            if (props.addProductData) {
                await props.addProductData(formData);
            } else if (props.id) {
                await editProduct(props.id, formData);
            } else {
                await addProduct(formData);
            }

            try {
                window.dispatchEvent(new CustomEvent('pos_data_changed', { detail: { action: 'product_created' } }));
                localStorage.setItem('pos_products_last_update', Date.now().toString());
            } catch (evErr) {}

            // Trigger celebratory green tick animation!
            setCreateSuccessAnim(true);
            setCreatedProductName(productValue.name || 'Product');

            setTimeout(() => {
                setShowConfirmModal(false);
                setCreateSuccessAnim(false);
                navigate('/app/products');
            }, 1200);
        } catch (err) {
            console.error('Creation error:', err);
            setShowConfirmModal(false);
            setCreateSuccessAnim(false);
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
                        onClick={() => {
                            setCreationMode('ai');
                            setIsAiCompleted(false);
                        }}
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
                        onClick={() => {
                            setCreationMode('manual');
                            setIsAiCompleted(false);
                        }}
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

            {/* 4. Steps Navigation Card (When Manual Entry Mode Active OR when AI Extraction Succeeded) */}
            {(creationMode === 'manual' || isAiCompleted) && (
                <div className={`prod-steps-card ${isAiCompleted ? 'wizard-section-fade-in' : ''}`}>
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
            <div className={`prod-workspace-grid ${creationMode === 'ai' && !isAiCompleted ? 'ai-extract-mode' : ''}`}>
                {/* Left Form Area */}
                <div className="prod-workspace-main">
                    {creationMode === 'ai' && !isAiCompleted ? (
                        <div className={`prod-ai-card ${isTransitioning ? 'ai-section-fade-out' : ''}`}>
                            {/* Card Header (Styled matching Image 2 Quotation Details) */}
                            <div className="prod-ai-card-header">
                                <div className="prod-ai-icon-bubble">
                                    <Sparkles size={22} />
                                </div>
                                <div className="prod-ai-header-titles">
                                    <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                                        <h3 className="prod-ai-title m-0">Enterprise AI Product Intelligence</h3>
                                        <span className="prod-ai-tag-purple">Multi-Modal AI v2.4</span>
                                        <span className="prod-ai-tag-green">
                                            <span className="prod-ai-dot-pulse" /> Active & Ready
                                        </span>
                                    </div>
                                    <p className="prod-ai-subtitle m-0">
                                        Extract verified specifications, OCR packaging, and match master data instantly across global e-commerce registries.
                                    </p>
                                </div>
                            </div>

                            {/* Multi-modal Tabs (4-Card Grid styled like Image 2 Info Cards) */}
                            <div className="prod-ai-modal-grid">
                                <div
                                    className={`prod-ai-mode-card ${aiInputType === 'url' ? 'active' : ''}`}
                                    onClick={() => setAiInputType('url')}
                                >
                                    <div className="prod-ai-mode-icon-box url">
                                        <Globe size={18} />
                                    </div>
                                    <div className="prod-ai-mode-info">
                                        <div className="prod-ai-mode-title">Product URL</div>
                                        <div className="prod-ai-mode-desc">Zepto, Blinkit, Amazon...</div>
                                    </div>
                                    {aiInputType === 'url' && <div className="prod-ai-active-indicator" />}
                                </div>

                                <div
                                    className={`prod-ai-mode-card ${aiInputType === 'image' ? 'active' : ''}`}
                                    onClick={() => setAiInputType('image')}
                                >
                                    <div className="prod-ai-mode-icon-box image">
                                        <Camera size={18} />
                                    </div>
                                    <div className="prod-ai-mode-info">
                                        <div className="prod-ai-mode-title">Upload Packaging / OCR</div>
                                        <div className="prod-ai-mode-desc">Photo, label & box scan</div>
                                    </div>
                                    {aiInputType === 'image' && <div className="prod-ai-active-indicator" />}
                                </div>

                                <div
                                    className={`prod-ai-mode-card ${aiInputType === 'barcode' ? 'active' : ''}`}
                                    onClick={() => setAiInputType('barcode')}
                                >
                                    <div className="prod-ai-mode-icon-box barcode">
                                        <Barcode size={18} />
                                    </div>
                                    <div className="prod-ai-mode-info">
                                        <div className="prod-ai-mode-title">Barcode / GTIN</div>
                                        <div className="prod-ai-mode-desc">8, 12, 13 or 14 digits</div>
                                    </div>
                                    {aiInputType === 'barcode' && <div className="prod-ai-active-indicator" />}
                                </div>

                                <div
                                    className={`prod-ai-mode-card ${aiInputType === 'search' ? 'active' : ''}`}
                                    onClick={() => setAiInputType('search')}
                                >
                                    <div className="prod-ai-mode-icon-box search">
                                        <Search size={18} />
                                    </div>
                                    <div className="prod-ai-mode-info">
                                        <div className="prod-ai-mode-title">Name Query</div>
                                        <div className="prod-ai-mode-desc">Search catalog or SKU</div>
                                    </div>
                                    {aiInputType === 'search' && <div className="prod-ai-active-indicator" />}
                                </div>
                            </div>

                            {/* Input Form Fields per Mode */}
                            <div className="prod-ai-input-wrapper">
                                {aiInputType === 'url' && (
                                    <div className="prod-ai-input-pane">
                                        <div className="prod-ai-unified-searchbar">
                                            <LinkIcon size={19} className="prod-ai-bar-icon" />
                                            <input
                                                type="url"
                                                placeholder="Paste product link (Zepto, Blinkit, Amazon, Flipkart, BigBasket, JioMart...)"
                                                value={productUrl}
                                                onChange={(e) => {
                                                    setProductUrl(e.target.value);
                                                    if (extractionError) setExtractionError(null);
                                                }}
                                                onKeyDown={(e) => e.key === 'Enter' && executeExtraction('url')}
                                                className="prod-ai-bar-input"
                                            />
                                            {productUrl ? (
                                                <button
                                                    type="button"
                                                    className="prod-ai-action-btn clear"
                                                    onClick={() => setProductUrl('')}
                                                    title="Clear input"
                                                >
                                                    <X size={15} />
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="prod-ai-action-btn paste"
                                                    onClick={handlePasteUrlFromClipboard}
                                                    title="Paste from clipboard"
                                                >
                                                    <Clipboard size={14} className="me-1" />
                                                    <span>Paste</span>
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                className="prod-ai-bar-btn"
                                                onClick={() => executeExtraction('url')}
                                                disabled={isExtracting || !productUrl.trim()}
                                            >
                                                {isExtracting ? (
                                                    <RefreshCw size={15} className="prod-stage-spin" />
                                                ) : (
                                                    <Sparkles size={15} />
                                                )}
                                                <span>{isExtracting ? 'Extracting Details...' : 'Extract Details'}</span>
                                            </button>
                                        </div>

                                        {/* Quick Sample Links helper chips */}
                                        <div className="prod-ai-sample-row">
                                            <span className="prod-ai-sample-label">⚡ Quick Samples:</span>
                                            <button
                                                type="button"
                                                className="prod-ai-sample-chip"
                                                onClick={() => handleApplySampleUrl('https://www.zepto.com/pn/us-polo-assn-mens-crew-neck-embroidered-logo-lounge-t-shirt-white-l/pvid/90edff0c-b019-425b-a282-99cf3cba54d0')}
                                            >
                                                👕 Zepto T-Shirt (Variant)
                                            </button>
                                            <button
                                                type="button"
                                                className="prod-ai-sample-chip"
                                                onClick={() => handleApplySampleUrl('https://www.zepto.com/pn/lux-cozi-mens-solid-trunk-assorted-85-cm/pvid/d8eab4b5-be72-4154-a1ef-dd4128108c26')}
                                            >
                                                📦 Lux Cozi (Pack of 3 Combo)
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {aiInputType === 'barcode' && (
                                    <div className="prod-ai-input-pane">
                                        <div className="prod-ai-unified-searchbar">
                                            <Barcode size={19} className="prod-ai-bar-icon" />
                                            <input
                                                type="text"
                                                placeholder="Enter 8, 12, 13 or 14-digit GTIN / EAN (e.g. 8901262178808, 8901499009135)"
                                                value={barcodeInput}
                                                onChange={(e) => {
                                                    setBarcodeInput(e.target.value);
                                                    if (extractionError) setExtractionError(null);
                                                }}
                                                onKeyDown={(e) => e.key === 'Enter' && executeExtraction('barcode')}
                                                className="prod-ai-bar-input"
                                            />
                                            {barcodeInput && (
                                                <button
                                                    type="button"
                                                    className="prod-ai-action-btn clear"
                                                    onClick={() => setBarcodeInput('')}
                                                    title="Clear input"
                                                >
                                                    <X size={15} />
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                className="prod-ai-bar-btn"
                                                onClick={() => executeExtraction('barcode')}
                                                disabled={isExtracting || !barcodeInput.trim()}
                                            >
                                                {isExtracting ? (
                                                    <RefreshCw size={15} className="prod-stage-spin" />
                                                ) : (
                                                    <Search size={15} />
                                                )}
                                                <span>{isExtracting ? 'Extracting Details...' : 'Lookup Barcode'}</span>
                                            </button>
                                        </div>
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
                                                <Camera size={26} />
                                            </div>
                                            <div className="prod-ai-drop-title">
                                                {selectedImageFile ? selectedImageFile.name : 'Upload Barcode or Packaging Photo'}
                                            </div>
                                            <div className="prod-ai-drop-sub">
                                                ZXing client-side barcode scanning & neural packaging OCR (JPG, PNG, WebP)
                                            </div>
                                        </label>
                                    </div>
                                )}

                                {aiInputType === 'search' && (
                                    <div className="prod-ai-input-pane">
                                        <div className="prod-ai-unified-searchbar">
                                            <Search size={19} className="prod-ai-bar-icon" />
                                            <input
                                                type="text"
                                                placeholder="Enter product title or SKU (e.g. Amul French Fries, Kellogg's Corn Flakes...)"
                                                value={searchQuery}
                                                onChange={(e) => {
                                                    setSearchQuery(e.target.value);
                                                    if (extractionError) setExtractionError(null);
                                                }}
                                                onKeyDown={(e) => e.key === 'Enter' && executeExtraction('search')}
                                                className="prod-ai-bar-input"
                                            />
                                            {searchQuery && (
                                                <button
                                                    type="button"
                                                    className="prod-ai-action-btn clear"
                                                    onClick={() => setSearchQuery('')}
                                                    title="Clear input"
                                                >
                                                    <X size={15} />
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                className="prod-ai-bar-btn"
                                                onClick={() => executeExtraction('search')}
                                                disabled={isExtracting || !searchQuery.trim()}
                                            >
                                                {isExtracting ? (
                                                    <RefreshCw size={15} className="prod-stage-spin" />
                                                ) : (
                                                    <Search size={15} />
                                                )}
                                                <span>{isExtracting ? 'Extracting Details...' : 'Search Catalog'}</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Supported Registries & Platforms Bar */}
                                <div className="prod-ai-sources-hint">
                                    <span className="prod-ai-sources-label">Global Registry & Marketplace Support:</span>
                                    <span className="prod-ai-source-badge">OpenFoodFacts</span>
                                    <span className="prod-ai-source-badge">UPCitemdb</span>
                                    <span className="prod-ai-source-badge">GS1 Registry</span>
                                    <span className="prod-ai-source-badge highlight">Zepto</span>
                                    <span className="prod-ai-source-badge highlight">Blinkit</span>
                                    <span className="prod-ai-source-badge">Amazon</span>
                                    <span className="prod-ai-source-badge">Flipkart</span>
                                </div>
                            </div>

                            {/* REAL-TIME EXTRACTION PROGRESS BAR & PIPELINE STEPPER */}
                            {isExtracting && (
                                <div className="prod-ai-realtime-progress-panel">
                                    <div className="prod-ai-progress-header">
                                        <div className="prod-ai-progress-status-left">
                                            <div className="prod-ai-progress-radar">
                                                <RefreshCw size={18} className="prod-stage-spin" />
                                            </div>
                                            <div>
                                                <div className="prod-ai-progress-title">
                                                    Real-Time AI Extraction Pipeline Active
                                                </div>
                                                <div className="prod-ai-progress-stage-text">
                                                    {extractionStage || 'Analyzing target catalog source...'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="prod-ai-progress-percent-badge">
                                            {extractionProgress}%
                                        </div>
                                    </div>

                                    {/* The glowing progress track */}
                                    <div className="prod-ai-progress-track">
                                        <div
                                            className="prod-ai-progress-fill"
                                            style={{ width: `${extractionProgress}%` }}
                                        />
                                    </div>

                                    {/* 4-Stage Visual Stepper Track */}
                                    <div className="prod-ai-stepper-grid">
                                        <div className={`prod-ai-step-item ${extractionStepIndex >= 0 ? (extractionStepIndex > 0 ? 'completed' : 'active') : ''}`}>
                                            <div className="prod-ai-step-dot">
                                                {extractionStepIndex > 0 ? <Check size={12} /> : '1'}
                                            </div>
                                            <div className="prod-ai-step-meta">
                                                <span className="prod-ai-step-name">Connect</span>
                                                <span className="prod-ai-step-sub">Marketplace DOM</span>
                                            </div>
                                        </div>

                                        <div className={`prod-ai-step-item ${extractionStepIndex >= 1 ? (extractionStepIndex > 1 ? 'completed' : 'active') : ''}`}>
                                            <div className="prod-ai-step-dot">
                                                {extractionStepIndex > 1 ? <Check size={12} /> : '2'}
                                            </div>
                                            <div className="prod-ai-step-meta">
                                                <span className="prod-ai-step-name">Inspect</span>
                                                <span className="prod-ai-step-sub">JSON-LD Specs</span>
                                            </div>
                                        </div>

                                        <div className={`prod-ai-step-item ${extractionStepIndex >= 2 ? (extractionStepIndex > 2 ? 'completed' : 'active') : ''}`}>
                                            <div className="prod-ai-step-dot">
                                                {extractionStepIndex > 2 ? <Check size={12} /> : '3'}
                                            </div>
                                            <div className="prod-ai-step-meta">
                                                <span className="prod-ai-step-name">AI Intelligence</span>
                                                <span className="prod-ai-step-sub">Brand & Pack Size</span>
                                            </div>
                                        </div>

                                        <div className={`prod-ai-step-item ${extractionStepIndex >= 3 ? (extractionStepIndex > 3 ? 'completed' : 'active') : ''}`}>
                                            <div className="prod-ai-step-dot">
                                                {extractionStepIndex > 3 ? <Check size={12} /> : '4'}
                                            </div>
                                            <div className="prod-ai-step-meta">
                                                <span className="prod-ai-step-name">Finalize</span>
                                                <span className="prod-ai-step-sub">POS Master Units</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Clean Error State Banner */}
                            {extractionError && (
                                <div style={{ background: '#FEF2F2', border: '1.5px solid #FCA5A5', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', gap: '12px' }}>
                                    <div className="d-flex align-items-center gap-2 text-danger" style={{ fontSize: '13px', fontWeight: '600' }}>
                                        <AlertTriangle size={18} className="flex-shrink-0" />
                                        <span>{extractionError}</span>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() => executeExtraction(aiInputType)}
                                        style={{ borderRadius: '8px', fontSize: '12px', fontWeight: '700', padding: '4px 14px', flexShrink: 0 }}
                                    >
                                        Try Again
                                    </button>
                                </div>
                            )}

                            {/* Duplicate Warning Alert */}
                            {existingProductWarning && (
                                <div className="prod-ai-entity-alert brand mt-3">
                                    <AlertTriangle size={18} className="me-2" />
                                    <span>
                                        Existing Product in Catalog: <strong>{existingProductWarning.name}</strong> (Code: {existingProductWarning.code})
                                    </span>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* 4-Step Form Card (Clean Brands Standard) */
                        <div className={`prod-main-form-card ${isAiCompleted ? 'wizard-section-fade-in' : ''}`} id="basic-info-section">
                            {currentStep === 1 && (
                                <>
                                    <div className="prod-card-header d-flex align-items-center justify-content-between">
                                        <div className="d-flex align-items-center gap-3">
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
                                        {isAiCompleted && (
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-link text-success fw-bold text-decoration-none d-flex align-items-center gap-1"
                                                onClick={() => {
                                                    setIsAiCompleted(false);
                                                    setCreationMode('ai');
                                                }}
                                                title="Scan or paste a different product link"
                                                style={{ fontSize: '12px' }}
                                            >
                                                <Sparkles size={14} /> Re-extract / New Link
                                            </button>
                                        )}
                                    </div>

                                    <div className="prod-fields-grid" id="basic-info-section">
                                        {/* Full Product Name (Master Title) */}
                                        <div className="prod-field-group span-2">
                                            <div className="prod-field-header">
                                                <label className="prod-field-label">
                                                    Product Name (Full Master Title) <span className="req">*</span>
                                                    {autofillActive && productValue.name && <span className="prod-field-autofilled-badge">✨ AI Filled</span>}
                                                </label>
                                                <span className="prod-field-hint">{productValue.name?.length || 0} / 255 characters</span>
                                            </div>
                                            <input
                                                type="text"
                                                className={`prod-input ${autofillActive ? 'prod-input-autofilled' : ''}`}
                                                placeholder="e.g. Jockey 8015 Men's Super Combed Cotton Rib Underwear Solid Trunk (Pack of 2)"
                                                maxLength={255}
                                                value={productValue.name}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setProductValue(prev => ({
                                                        ...prev,
                                                        name: val,
                                                        pos_name: prev.pos_name && prev.pos_name !== (prev.name?.length > 35 ? prev.name.substring(0, 35) : prev.name) ? prev.pos_name : (val.length > 35 ? val.substring(0, 35).trim() : val),
                                                        sku: prev.sku || generateSmartSku(val)
                                                    }));
                                                }}
                                            />
                                            {errors.name && <span className="text-danger small mt-1">{errors.name}</span>}
                                        </div>

                                        {/* Display Name / Short Name (For Thermal Receipts & POS Tiles) */}
                                        <div className="prod-field-group span-2">
                                            <div className="prod-field-header">
                                                <label className="prod-field-label d-flex align-items-center gap-1.5 flex-wrap">
                                                    <span>Display Name / Short Name (POS & Receipts)</span>
                                                    <span className="badge bg-light text-secondary border px-2 py-0.5" style={{ fontSize: '10.5px', fontWeight: '600' }}>
                                                        Max 35 chars
                                                    </span>
                                                    {autofillActive && productValue.pos_name && <span className="prod-field-autofilled-badge">✨ Auto Shortened</span>}
                                                </label>
                                                <span className={`prod-field-hint ${(productValue.pos_name?.length || 0) > 35 ? 'text-danger fw-bold' : ''}`}>
                                                    {productValue.pos_name?.length || 0} / 35 characters
                                                </span>
                                            </div>
                                            <input
                                                type="text"
                                                className={`prod-input ${autofillActive ? 'prod-input-autofilled' : ''}`}
                                                placeholder="e.g. Jockey 8015 Trunk (Pack of 2)"
                                                maxLength={50}
                                                value={productValue.pos_name || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setProductValue(prev => ({
                                                        ...prev,
                                                        pos_name: val
                                                    }));
                                                }}
                                            />
                                            <span className="text-muted small mt-1" style={{ fontSize: '11.5px', display: 'block' }}>
                                                Optimal for 58mm/80mm Thermal Receipt Printers, Barcode Label Tags, and POS Touch Screen Grid Tiles.
                                            </span>
                                        </div>

                                        {/* Product Type */}
                                        <div className="prod-field-group">
                                            <div className="prod-field-header">
                                                <label className="prod-field-label">
                                                    Product Type <span className="req">*</span>
                                                    {isAiCompleted && (
                                                        <span className={`prod-ai-tag-pill ${aiFieldsTouched.product_type ? 'edited' : ''}`}>
                                                            {aiFieldsTouched.product_type ? 'Edited' : (
                                                                productValue.product_type === '2' ? '✨ Variation (AI Detected)' : (productValue.product_type === '3' ? '✨ Combo (AI Detected)' : '✨ Single (AI Detected)')
                                                            )}
                                                        </span>
                                                    )}
                                                </label>
                                            </div>
                                            <select
                                                className="prod-input"
                                                value={productValue.product_type || '1'}
                                                onChange={(e) => {
                                                    const newType = e.target.value;
                                                    setProductValue(prev => ({ ...prev, product_type: newType }));
                                                    setAiFieldsTouched(prev => ({ ...prev, product_type: true }));
                                                }}
                                            >
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

                                        {/* Separate SKU Field */}
                                        <div className="prod-field-group">
                                            <div className="prod-field-header">
                                                <label className="prod-field-label">
                                                    SKU (Product Code) <span className="req">*</span>
                                                    {autofillActive && productValue.sku && <span className="prod-field-autofilled-badge">✨ Auto Generated</span>}
                                                </label>
                                                <button
                                                    type="button"
                                                    className="prod-badge-btn-action"
                                                    onClick={handleGenerateSku}
                                                    title="Auto Generate SKU"
                                                >
                                                    + Auto Generate SKU
                                                </button>
                                            </div>
                                            <input
                                                type="text"
                                                className={`prod-input ${autofillActive ? 'prod-input-autofilled' : ''}`}
                                                placeholder="e.g. M0986FT678"
                                                value={productValue.sku}
                                                onChange={(e) => setProductValue({ ...productValue, sku: e.target.value })}
                                            />
                                            {errors.sku && <span className="text-danger small mt-1">{errors.sku}</span>}
                                        </div>

                                        {/* Separate Barcode Field (Empty by default as requested) */}
                                        <div className="prod-field-group">
                                            <div className="prod-field-header">
                                                <label className="prod-field-label">
                                                    Barcode <span className="req">*</span>
                                                    {autofillActive && productValue.code && <span className="prod-field-autofilled-badge">✨ AI Matched</span>}
                                                </label>
                                                <button
                                                    type="button"
                                                    className="prod-badge-btn-action"
                                                    onClick={handleGenerateBarcode}
                                                    title="Generate GS1 barcode"
                                                >
                                                    + GS1 Barcode
                                                </button>
                                            </div>
                                            <div className="prod-input-with-action">
                                                <input
                                                    type="text"
                                                    className={`prod-input ${autofillActive ? 'prod-input-autofilled' : ''} ${errors.code ? 'border-danger' : ''}`}
                                                    placeholder="Scan with barcode scanner or enter manually..."
                                                    value={productValue.code || ''}
                                                    onChange={(e) => {
                                                        setProductValue(prev => ({ ...prev, code: e.target.value }));
                                                        if (errors.code) setErrors(prev => ({ ...prev, code: null }));
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            const scannedVal = e.target.value.trim();
                                                            if (scannedVal) {
                                                                addToast({ text: `✓ Barcode scanned/entered: ${scannedVal}`, type: 'success' });
                                                            }
                                                        }
                                                    }}
                                                />
                                                {productValue.code && (
                                                    <button
                                                        type="button"
                                                        className="prod-input-clear-btn"
                                                        onClick={() => setProductValue(prev => ({ ...prev, code: '' }))}
                                                        title="Clear barcode"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>
                                            {errors.code && <span className="text-danger small mt-1">{errors.code}</span>}
                                        </div>

                                        {/* Brand */}
                                        <div className="prod-field-group">
                                            <div className="prod-field-header">
                                                <label className="prod-field-label">
                                                    Brand <span className="req">*</span>
                                                    {productValue.brand_id?.label && (
                                                        <span className={`prod-ai-tag-pill ${aiFieldsTouched.brand ? 'edited' : ''}`}>
                                                            {aiFieldsTouched.brand ? 'Edited' : '✨ AI Identified'}
                                                        </span>
                                                    )}
                                                </label>
                                            </div>
                                            <select
                                                className={`prod-input ${autofillActive ? 'prod-input-autofilled' : ''}`}
                                                value={productValue.brand_id?.value || (typeof productValue.brand_id === 'string' ? productValue.brand_id : '')}
                                                onChange={(e) => {
                                                    setAiFieldsTouched(prev => ({ ...prev, brand: true }));
                                                    const val = e.target.value;
                                                    if (val === 'new') return;
                                                    const opt = brands.find(b => b.id == val);
                                                    setProductValue({
                                                        ...productValue,
                                                        brand_id: opt ? { value: opt.id, label: opt.attributes?.name || opt.name } : ''
                                                    });
                                                }}
                                            >
                                                <option value="">Select Brand</option>
                                                {productValue.brand_id?.value === 'new' && (
                                                    <option value="new">✨ {productValue.brand_id?.label} (AI Identified)</option>
                                                )}
                                                {brands.map(b => (
                                                    <option key={b.id} value={b.id}>{b.attributes?.name || b.name}</option>
                                                ))}
                                            </select>
                                            {errors.brand_id && <span className="text-danger small mt-1">{errors.brand_id}</span>}
                                        </div>

                                        {/* Category */}
                                        <div className="prod-field-group">
                                            <div className="prod-field-header">
                                                <label className="prod-field-label">
                                                    Category <span className="req">*</span>
                                                    {productValue.product_category_id?.label && (
                                                        <span className={`prod-ai-tag-pill ${aiFieldsTouched.category ? 'edited' : ''}`}>
                                                            {aiFieldsTouched.category ? 'Edited' : '✨ AI Identified'}
                                                        </span>
                                                    )}
                                                </label>
                                            </div>
                                            <select
                                                className={`prod-input ${autofillActive ? 'prod-input-autofilled' : ''}`}
                                                value={productValue.product_category_id?.value || (typeof productValue.product_category_id === 'string' ? productValue.product_category_id : '')}
                                                onChange={(e) => {
                                                    setAiFieldsTouched(prev => ({ ...prev, category: true }));
                                                    const val = e.target.value;
                                                    if (val === 'new') return;
                                                    const opt = productCategories.find(c => c.id == val);
                                                    setProductValue({
                                                        ...productValue,
                                                        product_category_id: opt ? { value: opt.id, label: opt.attributes?.name || opt.name } : ''
                                                    });
                                                }}
                                            >
                                                <option value="">Select Category</option>
                                                {productValue.product_category_id?.value === 'new' && (
                                                    <option value="new">✨ {productValue.product_category_id?.label} (AI Identified)</option>
                                                )}
                                                {productCategories.map(c => (
                                                    <option key={c.id} value={c.id}>{c.attributes?.name || c.name}</option>
                                                ))}
                                            </select>
                                            {errors.product_category_id && <span className="text-danger small mt-1">{errors.product_category_id}</span>}
                                        </div>

                                        {/* Dynamic Variation Product Builder Section */}
                                        {productValue.product_type === '2' && (
                                            <div className="prod-field-group span-2">
                                                <div className="prod-builder-card">
                                                    <div className="prod-builder-header">
                                                        <div className="prod-builder-title-group">
                                                            <div className="prod-builder-icon-box blue">
                                                                <Layers size={18} />
                                                            </div>
                                                            <div>
                                                                <h4 className="prod-builder-title">Variation Attributes & Matrix</h4>
                                                                <p className="prod-builder-subtitle">Define size, color, or custom spec variations</p>
                                                            </div>
                                                        </div>
                                                        <div className="prod-builder-actions">
                                                            <select
                                                                className="prod-input prod-builder-select"
                                                                value={selectedVariationId}
                                                                onChange={(e) => handleSelectVariation(e.target.value)}
                                                            >
                                                                <option value="">+ Quick Generate by Attribute...</option>
                                                                {(variations || []).map(v => (
                                                                    <option key={v.id} value={v.id}>{v.attributes?.name || v.name}</option>
                                                                ))}
                                                            </select>
                                                            <button
                                                                type="button"
                                                                className="prod-builder-btn secondary"
                                                                onClick={handleAddCustomVariantRow}
                                                            >
                                                                <Plus size={14} className="me-1" /> Add Variant Row
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {variantsList.length > 0 ? (
                                                        <div className="prod-builder-table-wrap">
                                                            <table className="prod-builder-table">
                                                                <thead>
                                                                    <tr>
                                                                        <th>Variant Title</th>
                                                                        <th>SKU Code</th>
                                                                        <th>Cost (₹)</th>
                                                                        <th>Price (₹)</th>
                                                                        <th>Alert Qty</th>
                                                                        <th style={{ width: '60px', textAlign: 'center' }}>Action</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {variantsList.map((variant, vIdx) => (
                                                                        <tr key={variant.id || vIdx}>
                                                                            <td>
                                                                                <input
                                                                                    type="text"
                                                                                    className="prod-builder-input"
                                                                                    value={variant.name}
                                                                                    onChange={(e) => handleUpdateVariantRow(vIdx, 'name', e.target.value)}
                                                                                />
                                                                            </td>
                                                                            <td>
                                                                                <input
                                                                                    type="text"
                                                                                    className="prod-builder-input"
                                                                                    value={variant.code}
                                                                                    onChange={(e) => handleUpdateVariantRow(vIdx, 'code', e.target.value)}
                                                                                />
                                                                            </td>
                                                                            <td>
                                                                                <input
                                                                                    type="number"
                                                                                    className="prod-builder-input"
                                                                                    value={variant.product_cost}
                                                                                    onChange={(e) => handleUpdateVariantRow(vIdx, 'product_cost', e.target.value)}
                                                                                />
                                                                            </td>
                                                                            <td>
                                                                                <input
                                                                                    type="number"
                                                                                    className="prod-builder-input"
                                                                                    value={variant.product_price}
                                                                                    onChange={(e) => handleUpdateVariantRow(vIdx, 'product_price', e.target.value)}
                                                                                />
                                                                            </td>
                                                                            <td>
                                                                                <input
                                                                                    type="number"
                                                                                    className="prod-builder-input"
                                                                                    value={variant.stock_alert}
                                                                                    onChange={(e) => handleUpdateVariantRow(vIdx, 'stock_alert', e.target.value)}
                                                                                />
                                                                            </td>
                                                                            <td style={{ textAlign: 'center' }}>
                                                                                <button
                                                                                    type="button"
                                                                                    className="prod-builder-del-btn"
                                                                                    onClick={() => handleRemoveVariantRow(vIdx)}
                                                                                    title="Delete Variant"
                                                                                >
                                                                                    <Trash2 size={14} />
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    ) : (
                                                        <div className="prod-builder-empty">
                                                            <Layers size={32} className="text-muted mb-2" />
                                                            <p className="mb-1 fw-bold">No Variants Added Yet</p>
                                                            <p className="small mb-0">Select an attribute type above (e.g. Size or Color) or click <strong>+ Add Variant Row</strong> to create variants.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Dynamic Combo Pack Items Builder Section */}
                                        {productValue.product_type === '3' && (
                                            <div className="prod-field-group span-2">
                                                <div className="prod-builder-card">
                                                    <div className="prod-builder-header">
                                                        <div className="prod-builder-title-group">
                                                            <div className="prod-builder-icon-box green">
                                                                <Package size={18} />
                                                            </div>
                                                            <div>
                                                                <div className="d-flex align-items-center gap-2">
                                                                    <h4 className="prod-builder-title m-0">Combo Pack Items & Bundle Configuration</h4>
                                                                    <span className="prod-builder-pill">{comboItems.length} Items Bundled</span>
                                                                </div>
                                                                <p className="prod-builder-subtitle m-0">Combine multiple catalog products into a discounted bundle</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="prod-builder-controls-row">
                                                        <select
                                                            className="prod-input prod-builder-select"
                                                            value={selectedComboProductId}
                                                            onChange={(e) => setSelectedComboProductId(e.target.value)}
                                                        >
                                                            <option value="">Select Catalog Product to Bundle...</option>
                                                            {(products || []).map(p => {
                                                                const pAttrs = p.attributes || p;
                                                                return (
                                                                    <option key={p.id} value={p.id}>
                                                                        {pAttrs.name} (₹{pAttrs.product_price || pAttrs.price || 0})
                                                                    </option>
                                                                );
                                                            })}
                                                        </select>
                                                        <input
                                                            type="number"
                                                            className="prod-input prod-builder-qty"
                                                            placeholder="Qty"
                                                            min="1"
                                                            value={comboItemQty}
                                                            onChange={(e) => setComboItemQty(e.target.value)}
                                                        />
                                                        <button
                                                            type="button"
                                                            className="prod-builder-btn primary"
                                                            onClick={handleAddComboItem}
                                                        >
                                                            <Plus size={14} className="me-1" /> Add to Bundle
                                                        </button>
                                                    </div>

                                                    {comboItems.length > 0 ? (
                                                        <>
                                                            <div className="prod-builder-table-wrap">
                                                                <table className="prod-builder-table">
                                                                    <thead>
                                                                        <tr>
                                                                            <th>Bundled Product</th>
                                                                            <th>Unit Cost (₹)</th>
                                                                            <th>Unit Price (₹)</th>
                                                                            <th>Pack Qty</th>
                                                                            <th>Subtotal (₹)</th>
                                                                            <th style={{ width: '60px', textAlign: 'center' }}>Action</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {comboItems.map((item, cIdx) => (
                                                                            <tr key={item.id || cIdx}>
                                                                                <td style={{ fontWeight: '600' }}>{item.name}</td>
                                                                                <td>₹{item.cost.toFixed(2)}</td>
                                                                                <td>₹{item.price.toFixed(2)}</td>
                                                                                <td><span className="prod-builder-qty-badge">{item.qty}</span></td>
                                                                                <td className="prod-builder-subtotal">₹{item.subtotal_price.toFixed(2)}</td>
                                                                                <td style={{ textAlign: 'center' }}>
                                                                                    <button
                                                                                        type="button"
                                                                                        className="prod-builder-del-btn"
                                                                                        onClick={() => handleRemoveComboItem(cIdx)}
                                                                                        title="Remove item from bundle"
                                                                                    >
                                                                                        <Trash2 size={14} />
                                                                                    </button>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>

                                                            <div className="prod-builder-total-bar">
                                                                <span className="prod-builder-total-label">Combo Bundle Total Price:</span>
                                                                <span className="prod-builder-total-val">
                                                                    ₹{comboItems.reduce((s, it) => s + it.subtotal_price, 0).toFixed(2)}
                                                                </span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="prod-builder-empty">
                                                            <Package size={32} className="text-muted mb-2" />
                                                            <p className="mb-1 fw-bold">No Items in Combo Pack Yet</p>
                                                            <p className="small mb-0">Select products above and click <strong>Add to Bundle</strong> to build this combo package.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
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
                                                Configure retail selling price, purchase cost, MRP, and taxation
                                            </p>
                                        </div>
                                    </div>

                                    <div className="prod-fields-grid">
                                        {/* Selling Price */}
                                        <div className="prod-field-group">
                                            <div className="prod-field-header">
                                                <label className="prod-field-label">
                                                    Selling Price (₹) <span className="req">*</span>
                                                    {autofillActive && productValue.product_price && <span className="prod-field-autofilled-badge">✨ AI Set</span>}
                                                </label>
                                            </div>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className={`prod-input ${autofillActive ? 'prod-input-autofilled' : ''}`}
                                                placeholder="0.00"
                                                value={productValue.product_price}
                                                onChange={(e) => setProductValue({ ...productValue, product_price: e.target.value })}
                                            />
                                            {errors.product_price && <span className="text-danger small mt-1">{errors.product_price}</span>}
                                        </div>

                                        {/* Product Cost / Purchase Price */}
                                        <div className="prod-field-group">
                                            <div className="prod-field-header">
                                                <label className="prod-field-label">
                                                    Product Cost / Purchase Price (₹) <span className="req">*</span>
                                                    {autofillActive && productValue.product_cost && <span className="prod-field-autofilled-badge">✨ AI Set</span>}
                                                </label>
                                            </div>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className={`prod-input ${autofillActive ? 'prod-input-autofilled' : ''}`}
                                                placeholder="0.00"
                                                value={productValue.product_cost}
                                                onChange={(e) => setProductValue({ ...productValue, product_cost: e.target.value })}
                                            />
                                            {errors.product_cost && <span className="text-danger small mt-1">{errors.product_cost}</span>}
                                        </div>

                                        {/* MRP */}
                                        <div className="prod-field-group">
                                            <div className="prod-field-header">
                                                <label className="prod-field-label">
                                                    MRP (Max Retail Price ₹)
                                                    {autofillActive && productValue.mrp && <span className="prod-field-autofilled-badge">✨ AI Set</span>}
                                                </label>
                                                <span className="prod-field-hint">Printed pack price</span>
                                            </div>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className={`prod-input ${autofillActive ? 'prod-input-autofilled' : ''}`}
                                                placeholder={productValue.product_price ? (Number(productValue.product_price) * 1.15).toFixed(2) : "0.00"}
                                                value={productValue.mrp}
                                                onChange={(e) => setProductValue({ ...productValue, mrp: e.target.value })}
                                            />
                                        </div>

                                        {/* HSN Code */}
                                        <div className="prod-field-group">
                                            <div className="prod-field-header">
                                                <label className="prod-field-label">HSN / SAC Code</label>
                                                <span className="prod-field-hint">GST classification</span>
                                            </div>
                                            <input
                                                type="text"
                                                className="prod-input"
                                                placeholder="e.g. 19059090, 21069099"
                                                value={productValue.hsn_code}
                                                onChange={(e) => setProductValue({ ...productValue, hsn_code: e.target.value })}
                                            />
                                        </div>

                                        {/* Order Tax */}
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

                                        {/* Tax Type */}
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

                                        {/* Live Profit Margin Widget */}
                                        {parseFloat(productValue.product_price) > 0 && parseFloat(productValue.product_cost) > 0 && (
                                            <div className="prod-field-group span-2" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px 18px', marginTop: '4px' }}>
                                                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                                                    <div className="d-flex align-items-center gap-2">
                                                        <TrendingUp size={18} className="text-success" />
                                                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Gross Margin Analysis:</span>
                                                    </div>
                                                    <div className="d-flex align-items-center gap-3">
                                                        <span style={{ fontSize: '12.5px', color: '#64748B' }}>
                                                            Unit Profit: <strong style={{ color: '#0F172A' }}>₹{(parseFloat(productValue.product_price) - parseFloat(productValue.product_cost)).toFixed(2)}</strong>
                                                        </span>
                                                        <span style={{
                                                            padding: '3px 10px',
                                                            borderRadius: '999px',
                                                            fontSize: '12px',
                                                            fontWeight: '700',
                                                            background: (((parseFloat(productValue.product_price) - parseFloat(productValue.product_cost)) / parseFloat(productValue.product_price)) * 100) >= 20 ? '#DCFCE7' : '#FEF3C7',
                                                            color: (((parseFloat(productValue.product_price) - parseFloat(productValue.product_cost)) / parseFloat(productValue.product_price)) * 100) >= 20 ? '#15803D' : '#B45309'
                                                        }}>
                                                            {(((parseFloat(productValue.product_price) - parseFloat(productValue.product_cost)) / parseFloat(productValue.product_price)) * 100).toFixed(1)}% Margin
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
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
                                                Set base units of measure, warehouse allocation, stock alerts, and POS configuration
                                            </p>
                                        </div>
                                    </div>

                                    <div className="prod-fields-grid">
                                        {/* Product Unit / Base Unit */}
                                        <div className="prod-field-group">
                                            <div className="prod-field-header">
                                                <label className="prod-field-label">Base Unit (UOM) <span className="req">*</span></label>
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
                                            {errors.product_unit && <span className="text-danger small mt-1">{errors.product_unit}</span>}
                                        </div>

                                        {/* Primary Warehouse */}
                                        <div className="prod-field-group">
                                            <div className="prod-field-header">
                                                <label className="prod-field-label">Primary Warehouse</label>
                                                <span className="prod-field-hint">Initial stock location</span>
                                            </div>
                                            <select
                                                className="prod-input"
                                                value={productValue.warehouse_id || ''}
                                                onChange={(e) => setProductValue({ ...productValue, warehouse_id: e.target.value })}
                                            >
                                                <option value="">Select Warehouse (Optional)</option>
                                                {warehouses.map(w => (
                                                    <option key={w.id} value={w.id}>{w.attributes?.name || w.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Stock Alert Quantity */}
                                        <div className="prod-field-group">
                                            <div className="prod-field-header">
                                                <label className="prod-field-label">Stock Alert Quantity <span className="req">*</span></label>
                                                <span className="prod-field-hint">Reorder threshold</span>
                                            </div>
                                            <input
                                                type="number"
                                                className="prod-input"
                                                value={productValue.stock_alert}
                                                onChange={(e) => setProductValue({ ...productValue, stock_alert: e.target.value })}
                                            />
                                        </div>

                                        {/* Opening Stock Quantity */}
                                        <div className="prod-field-group">
                                            <div className="prod-field-header">
                                                <label className="prod-field-label">Initial Opening Stock</label>
                                                <span className="prod-field-hint">Starting count</span>
                                            </div>
                                            <input
                                                type="number"
                                                className="prod-input"
                                                placeholder="0"
                                                value={productValue.initial_stock}
                                                onChange={(e) => setProductValue({ ...productValue, initial_stock: e.target.value })}
                                            />
                                        </div>

                                        {/* POS Configuration Card */}
                                        <div className="prod-field-group span-2" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', marginTop: '6px' }}>
                                            <div className="d-flex align-items-center gap-2 mb-3">
                                                <Sliders size={18} className="text-primary" />
                                                <strong style={{ fontSize: '13.5px', color: '#0F172A' }}>POS Touch & Cashier Policy Configuration</strong>
                                            </div>
                                            <div className="d-flex align-items-center gap-4 flex-wrap">
                                                <label className="d-flex align-items-center gap-2" style={{ fontSize: '13px', cursor: 'pointer' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={productValue.quick_sale}
                                                        onChange={(e) => setProductValue({ ...productValue, quick_sale: e.target.checked })}
                                                    />
                                                    <span>Quick POS Tile</span>
                                                </label>
                                                <label className="d-flex align-items-center gap-2" style={{ fontSize: '13px', cursor: 'pointer' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={productValue.allow_discount}
                                                        onChange={(e) => setProductValue({ ...productValue, allow_discount: e.target.checked })}
                                                    />
                                                    <span>Allow Cashier Discount</span>
                                                </label>
                                                <label className="d-flex align-items-center gap-2" style={{ fontSize: '13px', cursor: 'pointer' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={productValue.weighing_scale}
                                                        onChange={(e) => setProductValue({ ...productValue, weighing_scale: e.target.checked })}
                                                    />
                                                    <span>Weighing Scale Product</span>
                                                </label>
                                                <label className="d-flex align-items-center gap-2" style={{ fontSize: '13px', cursor: 'pointer' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={productValue.returnable}
                                                        onChange={(e) => setProductValue({ ...productValue, returnable: e.target.checked })}
                                                    />
                                                    <span>Allow Sales Return</span>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Product Visual & POS Icon Multi-Channel Selector Card */}
                                        <div className="prod-field-group span-2" style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '16px', padding: '20px', marginTop: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                                                <div className="d-flex align-items-center gap-2">
                                                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7' }}>
                                                        <ImageIcon size={20} />
                                                    </div>
                                                    <div>
                                                        <strong style={{ fontSize: '14.5px', color: '#0F172A' }}>Product Visual & POS Identification <span className="req">*</span></strong>
                                                        <p className="text-muted small mb-0" style={{ fontSize: '12px' }}>Upload file, paste from clipboard, enter image URL, or pick a POS quick icon</p>
                                                    </div>
                                                </div>
                                                <div className="d-flex align-items-center gap-2">
                                                    {(imagePreviewUrl || selectedImageFile || selectedIcon) && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-danger"
                                                            style={{ fontSize: '11.5px', padding: '4px 10px', borderRadius: '8px' }}
                                                            onClick={handleClearVisual}
                                                        >
                                                            <Trash2 size={13} className="me-1" /> Clear Visual
                                                        </button>
                                                    )}
                                                    {selectedImageFile && (
                                                        <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill" style={{ fontSize: '12px' }}>
                                                            ✓ Image Attached
                                                        </span>
                                                    )}
                                                    {selectedIcon && !selectedImageFile && (
                                                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 rounded-pill" style={{ fontSize: '12px' }}>
                                                            ✓ POS Icon: {selectedIcon.emoji} {selectedIcon.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Visual Source Tabs */}
                                            <div className="d-flex align-items-center gap-2 mb-3 p-1" style={{ background: '#F1F5F9', borderRadius: '10px', width: 'fit-content', flexWrap: 'wrap' }}>
                                                <button
                                                    type="button"
                                                    className={`btn btn-sm ${visualTab === 'upload' ? 'btn-white bg-white text-primary shadow-sm fw-bold' : 'text-secondary border-0'}`}
                                                    style={{ borderRadius: '8px', fontSize: '12px', padding: '6px 14px' }}
                                                    onClick={() => setVisualTab('upload')}
                                                >
                                                    <UploadCloud size={14} className="me-1" /> File Upload
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`btn btn-sm ${visualTab === 'paste' ? 'btn-white bg-white text-primary shadow-sm fw-bold' : 'text-secondary border-0'}`}
                                                    style={{ borderRadius: '8px', fontSize: '12px', padding: '6px 14px' }}
                                                    onClick={() => setVisualTab('paste')}
                                                >
                                                    <Clipboard size={14} className="me-1" /> Paste (Ctrl+V)
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`btn btn-sm ${visualTab === 'url' ? 'btn-white bg-white text-primary shadow-sm fw-bold' : 'text-secondary border-0'}`}
                                                    style={{ borderRadius: '8px', fontSize: '12px', padding: '6px 14px' }}
                                                    onClick={() => setVisualTab('url')}
                                                >
                                                    <Globe size={14} className="me-1" /> Image URL
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`btn btn-sm ${visualTab === 'icons' ? 'btn-white bg-white text-primary shadow-sm fw-bold' : 'text-secondary border-0'}`}
                                                    style={{ borderRadius: '8px', fontSize: '12px', padding: '6px 14px' }}
                                                    onClick={() => setVisualTab('icons')}
                                                >
                                                    <Sparkles size={14} className="me-1" /> POS Quick Icons
                                                </button>
                                            </div>

                                            {/* Tab 1: File Upload */}
                                            {visualTab === 'upload' && (
                                                <div
                                                    style={{
                                                        border: selectedImageFile || imagePreviewUrl ? '2px solid #10B981' : '2px dashed #CBD5E1',
                                                        borderRadius: '12px',
                                                        padding: '24px',
                                                        textAlign: 'center',
                                                        background: '#F8FAFC',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onClick={() => document.getElementById('prod-step3-img-input')?.click()}
                                                >
                                                    <input
                                                        type="file"
                                                        id="prod-step3-img-input"
                                                        accept="image/*"
                                                        style={{ display: 'none' }}
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                setSelectedImageFile(file);
                                                                setImagePreviewUrl(URL.createObjectURL(file));
                                                                setSelectedIcon(null);
                                                                addToast({ text: `✓ Image selected: ${file.name}`, type: 'success' });
                                                            }
                                                        }}
                                                    />
                                                    {imagePreviewUrl || selectedImageFile ? (
                                                        <div className="d-flex align-items-center justify-content-center gap-3">
                                                            <img
                                                                src={imagePreviewUrl}
                                                                alt="Uploaded"
                                                                style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '10px', border: '2px solid #10B981' }}
                                                            />
                                                            <div className="text-start">
                                                                <div className="fw-bold text-success" style={{ fontSize: '13px' }}>Photo Attached ({selectedImageFile?.name || 'Uploaded File'})</div>
                                                                <div className="text-muted" style={{ fontSize: '11.5px' }}>Click anywhere in this box to replace photo</div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <UploadCloud size={38} className="text-primary mb-2" />
                                                            <div className="fw-bold text-dark" style={{ fontSize: '13.5px' }}>Click or Drag & Drop Image Here</div>
                                                            <div className="text-muted" style={{ fontSize: '11.5px' }}>Supports JPG, PNG, WebP up to 5MB</div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Tab 2: Clipboard Paste */}
                                            {visualTab === 'paste' && (
                                                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                                                    <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                                                        <Clipboard size={28} className="text-primary" />
                                                        <strong style={{ fontSize: '14px', color: '#0F172A' }}>Copy & Paste Image Direct</strong>
                                                    </div>
                                                    <p className="text-muted small mb-3" style={{ fontSize: '12px', maxWidth: '460px', margin: '0 auto' }}>
                                                        Copy any image from Google Images, supplier catalogs, or take a screenshot (<kbd style={{ background: '#E2E8F0', color: '#0F172A', padding: '2px 6px', borderRadius: '4px' }}>Win + Shift + S</kbd>) and press <kbd style={{ background: '#E2E8F0', color: '#0F172A', padding: '2px 6px', borderRadius: '4px' }}>Ctrl + V</kbd> anywhere!
                                                    </p>

                                                    <div className="d-flex align-items-center justify-content-center gap-2 flex-wrap">
                                                        <button
                                                            type="button"
                                                            className="brand-btn-pill brand-btn-primary"
                                                            style={{ padding: '8px 20px', fontSize: '13px' }}
                                                            onClick={handlePasteFromClipboard}
                                                        >
                                                            <Clipboard size={15} className="me-1" /> Paste from Clipboard Now
                                                        </button>
                                                    </div>

                                                    {imagePreviewUrl && (
                                                        <div className="d-flex align-items-center justify-content-center gap-3 mt-3 pt-3 border-top">
                                                            <img
                                                                src={imagePreviewUrl}
                                                                alt="Pasted"
                                                                style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '10px', border: '2px solid #10B981' }}
                                                            />
                                                            <div className="text-start">
                                                                <span className="badge bg-success-subtle text-success">✓ Image Pasted from Clipboard</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Tab 3: Image URL Fetcher */}
                                            {visualTab === 'url' && (
                                                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '18px' }}>
                                                    <div className="d-flex align-items-center gap-2 mb-2">
                                                        <Globe size={18} className="text-primary" />
                                                        <strong style={{ fontSize: '13.5px', color: '#0F172A' }}>Load Image from Web URL</strong>
                                                    </div>
                                                    <p className="text-muted small mb-3" style={{ fontSize: '12px' }}>
                                                        Paste a direct image link (e.g. from AWS S3, Shopify, Google, or brand distributor CDN)
                                                    </p>

                                                    <div className="d-flex align-items-center gap-2">
                                                        <input
                                                            type="url"
                                                            className="prod-input"
                                                            placeholder="https://example.com/images/product-item.png"
                                                            value={customImageUrl}
                                                            onChange={(e) => setCustomImageUrl(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    handleFetchImageUrl();
                                                                }
                                                            }}
                                                        />
                                                        <button
                                                            type="button"
                                                            className="brand-btn-pill brand-btn-primary"
                                                            style={{ whiteSpace: 'nowrap', padding: '8px 18px', fontSize: '13px' }}
                                                            onClick={() => handleFetchImageUrl()}
                                                            disabled={isFetchingUrl || !customImageUrl.trim()}
                                                        >
                                                            {isFetchingUrl ? (
                                                                <>
                                                                    <RefreshCw size={14} className="prod-stage-spin me-1" /> Fetching...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Globe size={14} className="me-1" /> Fetch Image
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>

                                                    {imagePreviewUrl && (
                                                        <div className="d-flex align-items-center gap-3 mt-3 pt-3 border-top">
                                                            <img
                                                                src={imagePreviewUrl}
                                                                alt="URL Preview"
                                                                style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '10px', border: '2px solid #10B981' }}
                                                                onError={(e) => {
                                                                    e.target.src = 'https://via.placeholder.com/60?text=Error';
                                                                }}
                                                            />
                                                            <div>
                                                                <div className="fw-bold text-success small">✓ Web Image Linked Successfully</div>
                                                                <div className="text-muted" style={{ fontSize: '11px', wordBreak: 'break-all', maxWidth: '400px' }}>{customImageUrl || imagePreviewUrl}</div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Tab 4: POS Quick Touch Icons */}
                                            {visualTab === 'icons' && (
                                                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
                                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                                        <span className="small fw-bold text-dark" style={{ fontSize: '13px' }}>Select Instant POS Touch Icon:</span>
                                                        <span className="text-muted" style={{ fontSize: '11.5px' }}>1-Click high-contrast register icon</span>
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                                                        {PRESET_POS_ICONS.map(icon => (
                                                            <div
                                                                key={icon.id}
                                                                onClick={() => handleSelectPosIcon(icon)}
                                                                style={{
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    padding: '10px 8px',
                                                                    borderRadius: '10px',
                                                                    border: selectedIcon?.id === icon.id && !selectedImageFile ? `2px solid ${icon.color}` : '1px solid #E2E8F0',
                                                                    background: selectedIcon?.id === icon.id && !selectedImageFile ? icon.bg : '#FFFFFF',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.15s',
                                                                    boxShadow: selectedIcon?.id === icon.id && !selectedImageFile ? `0 0 0 1px ${icon.color}` : 'none'
                                                                }}
                                                            >
                                                                <span style={{ fontSize: '24px', lineHeight: 1 }}>{icon.emoji}</span>
                                                                <span style={{ fontSize: '11px', fontWeight: '600', color: selectedIcon?.id === icon.id && !selectedImageFile ? icon.color : '#334155', marginTop: '4px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                                                                    {icon.name}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Notes / Specifications */}
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
                                                Verify all master catalog attributes before committing to inventory
                                            </p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                                        {/* Card 1: Basic Information */}
                                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>Identification & Type</div>
                                            <div className="d-flex justify-content-between align-items-start gap-2"><span style={{ color: '#64748B', fontSize: '12.5px', whiteSpace: 'nowrap' }}>Product Name:</span><strong style={{ color: '#0F172A', fontSize: '12.5px', textAlign: 'right' }} title={productValue.name}>{productValue.name || '—'}</strong></div>
                                            <div className="d-flex justify-content-between align-items-start gap-2"><span style={{ color: '#64748B', fontSize: '12.5px', whiteSpace: 'nowrap' }}>Display Name:</span><strong style={{ color: '#2563EB', fontSize: '12.5px', textAlign: 'right' }}>{productValue.pos_name || (productValue.name?.length > 35 ? productValue.name.substring(0, 35) : productValue.name) || '—'}</strong></div>
                                            <div className="d-flex justify-content-between"><span style={{ color: '#64748B', fontSize: '12.5px' }}>SKU Code:</span><strong style={{ color: '#0F172A', fontSize: '12.5px', fontFamily: 'monospace' }}>{productValue.sku || '—'}</strong></div>
                                            <div className="d-flex justify-content-between"><span style={{ color: '#64748B', fontSize: '12.5px' }}>Barcode:</span><strong style={{ color: '#0F172A', fontSize: '12.5px', fontFamily: 'monospace' }}>{productValue.code || '—'}</strong></div>
                                            <div className="d-flex justify-content-between"><span style={{ color: '#64748B', fontSize: '12.5px' }}>Type:</span><strong style={{ color: '#0F172A', fontSize: '12.5px' }}>{productValue.product_type === '2' ? `Variation (${variantsList.length} variants)` : (productValue.product_type === '3' ? `Combo Pack (${comboItems.length} items)` : 'Single Product')}</strong></div>
                                            <div className="d-flex justify-content-between"><span style={{ color: '#64748B', fontSize: '12.5px' }}>Brand:</span><strong style={{ color: '#0F172A', fontSize: '12.5px' }}>{productValue.brand_id?.label || '—'}</strong></div>
                                            <div className="d-flex justify-content-between"><span style={{ color: '#64748B', fontSize: '12.5px' }}>Category:</span><strong style={{ color: '#0F172A', fontSize: '12.5px' }}>{productValue.product_category_id?.label || '—'}</strong></div>
                                        </div>

                                        {/* Card 2: Pricing & Margins */}
                                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>Financials & Tax</div>
                                            <div className="d-flex justify-content-between"><span style={{ color: '#64748B', fontSize: '12.5px' }}>Selling Price:</span><strong style={{ color: '#15803D', fontSize: '13px' }}>₹{productValue.product_price || '0.00'}</strong></div>
                                            <div className="d-flex justify-content-between"><span style={{ color: '#64748B', fontSize: '12.5px' }}>Cost Price:</span><strong style={{ color: '#0F172A', fontSize: '12.5px' }}>₹{productValue.product_cost || '0.00'}</strong></div>
                                            <div className="d-flex justify-content-between"><span style={{ color: '#64748B', fontSize: '12.5px' }}>MRP:</span><strong style={{ color: '#0F172A', fontSize: '12.5px' }}>₹{productValue.mrp || (Number(productValue.product_price || 0) * 1.15).toFixed(2)}</strong></div>
                                            <div className="d-flex justify-content-between"><span style={{ color: '#64748B', fontSize: '12.5px' }}>GST Rate:</span><strong style={{ color: '#0F172A', fontSize: '12.5px' }}>{productValue.order_tax || 0}% ({productValue.tax_type === '2' ? 'Inclusive' : 'Exclusive'})</strong></div>
                                        </div>

                                        {/* Card 3: Inventory & Warehouse */}
                                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>Inventory & Units</div>
                                            <div className="d-flex justify-content-between"><span style={{ color: '#64748B', fontSize: '12.5px' }}>Base Unit:</span><strong style={{ color: '#0F172A', fontSize: '12.5px' }}>{productValue.product_unit?.label || 'Units'}</strong></div>
                                            <div className="d-flex justify-content-between"><span style={{ color: '#64748B', fontSize: '12.5px' }}>Warehouse:</span><strong style={{ color: '#0F172A', fontSize: '12.5px' }}>{warehouses.find(w => w.id == productValue.warehouse_id)?.attributes?.name || 'Suguna Warehouse'}</strong></div>
                                            <div className="d-flex justify-content-between"><span style={{ color: '#64748B', fontSize: '12.5px' }}>Reorder Alert:</span><strong style={{ color: '#0F172A', fontSize: '12.5px' }}>{productValue.stock_alert || 10} units</strong></div>
                                            <div className="d-flex justify-content-between"><span style={{ color: '#64748B', fontSize: '12.5px' }}>Opening Stock:</span><strong style={{ color: '#0F172A', fontSize: '12.5px' }}>{productValue.initial_stock || 0} units</strong></div>
                                        </div>

                                        {/* Card 4: POS & Policies */}
                                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>POS & Policies</div>
                                            <div className="d-flex justify-content-between"><span style={{ color: '#64748B', fontSize: '12.5px' }}>HSN Code:</span><strong style={{ color: '#0F172A', fontSize: '12.5px' }}>{productValue.hsn_code || '19059090'}</strong></div>
                                            <div className="d-flex justify-content-between"><span style={{ color: '#64748B', fontSize: '12.5px' }}>POS Quick Tile:</span><strong style={{ color: productValue.quick_sale ? '#15803D' : '#64748B', fontSize: '12.5px' }}>{productValue.quick_sale ? 'Enabled' : 'Disabled'}</strong></div>
                                            <div className="d-flex justify-content-between"><span style={{ color: '#64748B', fontSize: '12.5px' }}>Cashier Discount:</span><strong style={{ color: productValue.allow_discount ? '#15803D' : '#64748B', fontSize: '12.5px' }}>{productValue.allow_discount ? 'Allowed' : 'Disabled'}</strong></div>
                                            <div className="d-flex justify-content-between"><span style={{ color: '#64748B', fontSize: '12.5px' }}>Return Policy:</span><strong style={{ color: productValue.returnable ? '#15803D' : '#EF4444', fontSize: '12.5px' }}>{productValue.returnable ? 'Returnable' : 'Non-returnable'}</strong></div>
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

                {/* Right Side Live Product Summary Card - Rendered after extraction or in manual entry mode */}
                {!(creationMode === 'ai' && !isAiCompleted) && (
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
                            ) : selectedIcon ? (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: selectedIcon.bg,
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: '12px',
                                    padding: '16px'
                                }}>
                                    <span style={{ fontSize: '56px', lineHeight: 1 }}>{selectedIcon.emoji}</span>
                                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: selectedIcon.color, marginTop: '8px' }}>
                                        {selectedIcon.name}
                                    </span>
                                </div>
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
                        {(productValue.pos_name || (productValue.name && productValue.name.length > 35)) && (
                            <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px', fontWeight: '600' }}>
                                <span style={{ color: '#2563EB', fontWeight: '700' }}>Display:</span> {productValue.pos_name || productValue.name.substring(0, 35)}
                            </div>
                        )}

                        {/* Product Tags */}
                        <div className="prod-summary-tags">
                            <span className="prod-summary-tag cat">
                                {productValue.product_category_id?.label || 'Category'}
                            </span>
                            <span className="prod-summary-tag brand">
                                {productValue.brand_id?.label || 'Brand'}
                            </span>
                            <span className="prod-summary-tag active">
                                {productValue.product_type === '2' ? 'Variant Product' : (productValue.product_type === '3' ? 'Combo Pack' : 'Active')}
                            </span>
                        </div>

                        {/* Metrics Table */}
                        <div className="prod-summary-metrics">
                            <div className="prod-metric-row">
                                <span className="metric-lbl">SKU:</span>
                                <span className="metric-val" style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{productValue.sku || '-'}</span>
                            </div>
                            <div className="prod-metric-row">
                                <span className="metric-lbl">Barcode:</span>
                                <span className="metric-val" style={{ fontFamily: 'monospace' }}>
                                    {productValue.code ? (
                                        productValue.code
                                    ) : (
                                        <span style={{ color: '#94A3B8', fontWeight: 500, fontStyle: 'italic', fontSize: '11px' }}>
                                            — (Scan or Enter)
                                        </span>
                                    )}
                                </span>
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
                                <span className="metric-lbl">MRP:</span>
                                <span className="metric-val">
                                    {productValue.mrp ? `₹${parseFloat(productValue.mrp).toFixed(2)}` : (productValue.product_price ? `₹${(parseFloat(productValue.product_price) * 1.15).toFixed(2)}` : '₹0.00')}
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
                            <div className="prod-metric-row">
                                <span className="metric-lbl">Base Unit:</span>
                                <span className="metric-val">{productValue.product_unit?.label || 'Units'}</span>
                            </div>
                            {productValue.warehouse_id && (
                                <div className="prod-metric-row">
                                    <span className="metric-lbl">Warehouse:</span>
                                    <span className="metric-val">{warehouses.find(w => w.id == productValue.warehouse_id)?.attributes?.name || 'Suguna Warehouse'}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>

            {/* Final Confirmation Approval Modal (Compact & Scannable Barcode) */}
            <Modal
                show={showConfirmModal}
                onHide={() => setShowConfirmModal(false)}
                centered
                className="prod-confirm-modal"
            >
                <Modal.Header closeButton style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9' }}>
                    <Modal.Title className="prod-modal-title" style={{ fontSize: '16.5px' }}>
                        <ShieldCheck size={22} className="text-success me-2" />
                        Ready to Create Product?
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="prod-modal-body" style={{ padding: '18px 20px', maxHeight: '75vh', overflowY: 'auto' }}>
                    {createSuccessAnim ? (
                        <div className="prod-success-animated-box">
                            <div className="prod-success-icon-wrapper">
                                <Check size={44} strokeWidth={3.5} />
                            </div>
                            <h3 className="prod-success-title">Product Created Successfully!</h3>
                            <p className="prod-success-subtitle">
                                <strong>{createdProductName || productValue.name || 'New Product'}</strong> has been committed to the inventory database.
                            </p>
                            <div className="d-flex align-items-center gap-2 text-success fw-bold small" style={{ background: '#ECFDF5', padding: '6px 16px', borderRadius: '20px' }}>
                                <RefreshCw size={13} className="prod-stage-spin" />
                                <span>Loading Product Catalogue...</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Compact Product Hero Banner */}
                            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#FFFFFF', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                                    {(imagePreviewUrl || activeSelectedImage || productValue.images?.[0]) ? (
                                        <img
                                            src={imagePreviewUrl || activeSelectedImage || productValue.images?.[0]}
                                            alt="Product"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : selectedIcon ? (
                                        <span style={{ fontSize: '26px' }}>{selectedIcon.emoji}</span>
                                    ) : (
                                        <Package size={24} className="text-muted" />
                                    )}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h4 style={{ fontSize: '14.5px', fontWeight: '800', color: '#0F172A', margin: '0 0 4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {productValue.name || 'New Product'}
                                    </h4>
                                    <div className="d-flex align-items-center gap-2 flex-wrap">
                                        <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold', background: '#DBEAFE', color: '#1E40AF', padding: '2px 8px', borderRadius: '6px' }}>
                                            SKU: {productValue.sku || productValue.code || '—'}
                                        </span>
                                        <span style={{ fontSize: '11px', background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: '6px', fontWeight: '600' }}>
                                            {productValue.product_type === '2' ? 'Variation Product' : (productValue.product_type === '3' ? 'Combo Pack' : 'Single Product')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* REAL SCANNABLE BARCODE SECTION & VERIFICATION */}
                            <div style={{ background: '#FFFFFF', border: '1.5px solid #CBD5E1', borderRadius: '14px', padding: '14px', textAlign: 'center', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
                                <div className="d-flex align-items-center justify-content-between mb-2">
                                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>
                                        <Barcode size={15} className="me-1 text-primary" /> Live Scannable Barcode:
                                    </span>
                                    <button
                                        type="button"
                                        className="btn btn-link p-0 text-primary small fw-bold"
                                        style={{ fontSize: '11.5px', textDecoration: 'none' }}
                                        onClick={() => {
                                            setTempModalBarcode(productValue.code);
                                            setIsEditingBarcodeInModal(prev => !prev);
                                        }}
                                    >
                                        <Edit2 size={12} className="me-1" />
                                        {isEditingBarcodeInModal ? 'Cancel Edit' : 'Edit Barcode'}
                                    </button>
                                </div>

                                {/* Real Scannable Canvas (JsBarcode) */}
                                <RealBarcodeCanvas value={isEditingBarcodeInModal ? tempModalBarcode : productValue.code} />

                                {/* Inline Barcode Editor if toggled */}
                                {isEditingBarcodeInModal ? (
                                    <div className="mt-2 pt-2 border-top d-flex align-items-center gap-2">
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            placeholder="Enter new barcode number"
                                            value={tempModalBarcode}
                                            onChange={(e) => setTempModalBarcode(e.target.value)}
                                            style={{ fontSize: '12px' }}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-success"
                                            style={{ fontSize: '11.5px', whiteSpace: 'nowrap' }}
                                            onClick={handleSaveBarcodeInModal}
                                        >
                                            ✓ Apply
                                        </button>
                                    </div>
                                ) : (
                                    /* Verification Alert Callout */
                                    <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', padding: '6px 10px', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                        <AlertTriangle size={14} style={{ color: '#B45309', flexShrink: 0 }} />
                                        <span style={{ fontSize: '11.5px', color: '#92400E', fontWeight: '600' }}>
                                            Make sure this barcode is correct before committing to inventory
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Compact 4-Tile Financial KPIs Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '14px' }}>
                                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '8px 6px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Selling Price</div>
                                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#15803D', marginTop: '2px' }}>₹{productValue.product_price || '0.00'}</div>
                                </div>
                                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '8px 6px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Cost Price</div>
                                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', marginTop: '2px' }}>₹{productValue.product_cost || '0.00'}</div>
                                </div>
                                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '8px 6px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Margin</div>
                                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#2563EB', marginTop: '2px' }}>
                                        {parseFloat(productValue.product_cost) > 0 ? (
                                            `₹${((parseFloat(productValue.product_price) || 0) - (parseFloat(productValue.product_cost) || 0)).toFixed(2)}`
                                        ) : '₹0.00'}
                                    </div>
                                </div>
                                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '8px 6px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>MRP</div>
                                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', marginTop: '2px' }}>
                                        ₹{productValue.mrp ? parseFloat(productValue.mrp).toFixed(2) : (productValue.product_price ? (parseFloat(productValue.product_price) * 1.15).toFixed(2) : '0.00')}
                                    </div>
                                </div>
                            </div>

                            {/* Master Classification Details */}
                            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div className="d-flex justify-content-between">
                                    <span style={{ color: '#64748B' }}>Category / Brand:</span>
                                    <strong style={{ color: '#0F172A' }}>
                                        {productValue.product_category_id?.label || productCategories.find(c => c.id == productValue.product_category_id)?.attributes?.name || 'General'} / {productValue.brand_id?.label || brands.find(b => b.id == productValue.brand_id)?.attributes?.name || 'Suguna'}
                                    </strong>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span style={{ color: '#64748B' }}>Unit / Warehouse:</span>
                                    <strong style={{ color: '#0F172A' }}>
                                        {productValue.product_unit?.label || 'Units'} / {warehouses.find(w => w.id == productValue.warehouse_id)?.attributes?.name || 'Suguna Warehouse'}
                                    </strong>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span style={{ color: '#64748B' }}>Opening Stock / Reorder:</span>
                                    <strong style={{ color: '#0F172A' }}>
                                        {productValue.initial_stock || '0'} units / Alert: {productValue.stock_alert || '10'} units
                                    </strong>
                                </div>
                            </div>
                        </>
                    )}
                </Modal.Body>
                {!createSuccessAnim && (
                    <Modal.Footer style={{ padding: '12px 20px', borderTop: '1px solid #F1F5F9', background: '#F8FAFC' }}>
                        <button
                            type="button"
                            className="brand-btn-pill"
                            style={{ height: '38px', padding: '0 16px', fontSize: '13px' }}
                            onClick={() => setShowConfirmModal(false)}
                            disabled={isSubmitting}
                        >
                            Back to Edit
                        </button>
                        <button
                            type="button"
                            className="brand-btn-pill brand-btn-primary"
                            style={{ height: '38px', padding: '0 20px', fontSize: '13px' }}
                            onClick={handleConfirmFinalCreate}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <RefreshCw size={15} className="prod-stage-spin me-2" />
                            ) : (
                                <CheckCircle2 size={15} className="me-2" />
                            )}
                            <span>{isSubmitting ? 'Creating...' : 'Confirm & Create Product'}</span>
                        </button>
                    </Modal.Footer>
                )}
            </Modal>

            {/* 4th Step Visual Gate Modal: Upload Photo, Paste, Image URL, or POS Icon */}
            <Modal
                show={showImagePromptModal}
                onHide={() => setShowImagePromptModal(false)}
                centered
                size="lg"
                className="prod-confirm-modal"
            >
                <Modal.Header closeButton>
                    <Modal.Title className="prod-modal-title">
                        <ImageIcon size={22} className="text-primary me-2" />
                        Attach Product Visual or POS Icon
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="prod-modal-body" style={{ padding: '24px' }}>
                    <p style={{ fontSize: '13.5px', color: '#475569', marginBottom: '18px' }}>
                        Before proceeding to the final summary, please attach a product photo or pick a quick POS touch icon for cashiers and registers:
                    </p>

                    <div className="row g-3">
                        {/* Option 1: Upload Photo */}
                        <div className="col-md-4">
                            <div
                                style={{
                                    border: '2px dashed #94A3B8',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    textAlign: 'center',
                                    background: '#F8FAFC',
                                    cursor: 'pointer',
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                onClick={() => document.getElementById('modal-step3-img-input')?.click()}
                            >
                                <input
                                    type="file"
                                    id="modal-step3-img-input"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setSelectedImageFile(file);
                                            setImagePreviewUrl(URL.createObjectURL(file));
                                            setShowImagePromptModal(false);
                                            addToast({ text: `✓ Image uploaded: ${file.name}`, type: 'success' });
                                            setCurrentStep(4);
                                        }
                                    }}
                                />
                                <UploadCloud size={30} className="text-primary mb-2" />
                                <div className="fw-bold small text-dark">Upload Local File</div>
                                <div className="text-muted" style={{ fontSize: '11px' }}>JPG, PNG, WebP</div>
                            </div>
                        </div>

                        {/* Option 2: Paste from Clipboard */}
                        <div className="col-md-4">
                            <div
                                style={{
                                    border: '1px solid #CBD5E1',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    textAlign: 'center',
                                    background: '#F8FAFC',
                                    cursor: 'pointer',
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                onClick={async () => {
                                    await handlePasteFromClipboard();
                                    if (selectedImageFile || imagePreviewUrl) {
                                        setShowImagePromptModal(false);
                                        setCurrentStep(4);
                                    }
                                }}
                            >
                                <Clipboard size={30} className="text-success mb-2" />
                                <div className="fw-bold small text-dark">Paste Clipboard (Ctrl+V)</div>
                                <div className="text-muted" style={{ fontSize: '11px' }}>Click to read copied image</div>
                            </div>
                        </div>

                        {/* Option 3: Image URL */}
                        <div className="col-md-4">
                            <div style={{ border: '1px solid #CBD5E1', borderRadius: '12px', padding: '14px', background: '#F8FAFC', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <div className="d-flex align-items-center gap-1 mb-2">
                                    <Globe size={16} className="text-primary" />
                                    <strong style={{ fontSize: '12px', color: '#0F172A' }}>Web Image URL</strong>
                                </div>
                                <input
                                    type="url"
                                    className="prod-input mb-2"
                                    style={{ fontSize: '11.5px', padding: '6px 10px' }}
                                    placeholder="https://.../img.jpg"
                                    value={customImageUrl}
                                    onChange={(e) => setCustomImageUrl(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="brand-btn-pill brand-btn-primary"
                                    style={{ padding: '5px 10px', fontSize: '11.5px', width: '100%' }}
                                    onClick={async () => {
                                        await handleFetchImageUrl();
                                        setShowImagePromptModal(false);
                                        setCurrentStep(4);
                                    }}
                                    disabled={!customImageUrl.trim()}
                                >
                                    Fetch & Attach
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="small fw-bold text-dark mb-2 d-block">Or 1-Click Choose a POS Quick Icon:</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(115px, 1fr))', gap: '8px', maxHeight: '170px', overflowY: 'auto', paddingRight: '4px' }}>
                            {PRESET_POS_ICONS.map(icon => (
                                <div
                                    key={icon.id}
                                    onClick={() => handleChooseIconAndAdvance(icon)}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '8px 4px',
                                        borderRadius: '10px',
                                        border: '1px solid #CBD5E1',
                                        background: icon.bg,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s'
                                    }}
                                >
                                    <span style={{ fontSize: '22px' }}>{icon.emoji}</span>
                                    <span style={{ fontSize: '10.5px', fontWeight: 'bold', color: icon.color, marginTop: '3px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                                        {icon.name.split('/')[0]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <button
                        type="button"
                        className="brand-btn-pill"
                        onClick={() => {
                            handleChooseIconAndAdvance(PRESET_POS_ICONS[0]);
                        }}
                    >
                        Skip & Use Default Retail Icon
                    </button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

const mapStateToProps = (state) => {
    const { brands, productCategories, units, baseUnits, warehouses, variations, products } = state;
    return { brands, productCategories, units, baseUnits, warehouses, variations, products };
};

export default connect(mapStateToProps, {
    addProduct,
    fetchAllBrands,
    fetchAllProductCategories,
    fetchUnits,
    fetchAllWarehouses,
    fetchVariations,
    fetchAllMainProducts,
    addToast
})(ProductForm);
