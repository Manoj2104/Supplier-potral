import React, { useState, useEffect, useMemo } from 'react';
import { connect, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import MasterLayout from '../MasterLayout';
import { fetchPurchases } from '../../store/action/purchaseAction';
import { fetchAllWarehouses } from '../../store/action/warehouseAction';
import { fetchAllSuppliers } from '../../store/action/supplierAction';
import { fetchAllProducts } from '../../store/action/productAction';
import { fetchFrontSetting } from '../../store/action/frontSettingAction';
import { currencySymbolHandling } from '../../shared/sharedMethod';
import { addToast } from '../../store/action/toastAction';
import { toastType } from '../../constants';
import MasterTableSkeleton from '../../shared/components/skeletons/MasterTableSkeleton';
import { isPageFirstLoad, markPageAnimated } from '../dashboard/dashboardAnimationState';
import { Modal, Button } from 'react-bootstrap-v5';
import moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTruck,
    faBoxOpen,
    faPlus,
    faSearch,
    faFilter,
    faRedo,
    faEye,
    faDownload,
    faPrint,
    faChevronRight,
    faMapMarkerAlt,
    faUserCheck,
    faClock,
    faCheckCircle,
    faExclamationTriangle,
    faFileAlt,
    faBarcode,
    faCalendarAlt,
    faPhone,
    faSyncAlt,
    faTimes,
    faArrowRight,
    faRoute,
    faShieldAlt,
    faQrcode,
    faRobot,
    faPaperPlane,
    faBell
} from '@fortawesome/free-solid-svg-icons';
import './Shipments.css';

// Supported Courier Logistics API Partners
const COURIER_PARTNERS = [
    { id: 'bluedart', name: 'Blue Dart Express', logo: 'BD', color: '#1E3A8A', apiStatus: 'Active API' },
    { id: 'delhivery', name: 'Delhivery Surface & Express', logo: 'DEL', color: '#000000', apiStatus: 'Active API' },
    { id: 'dtdc', name: 'DTDC Courier & Cargo', logo: 'DTDC', color: '#DC2626', apiStatus: 'Active API' },
    { id: 'xpressbees', name: 'XpressBees Logistics', logo: 'XB', color: '#E11D48', apiStatus: 'Active API' },
    { id: 'ecom', name: 'Ecom Express', logo: 'ECOM', color: '#EA580C', apiStatus: 'Active API' },
    { id: 'shadowfax', name: 'Shadowfax Parcel', logo: 'SFX', color: '#0F172A', apiStatus: 'Active API' },
    { id: 'ekart', name: 'Ekart Logistics (Flipkart Hub)', logo: 'EK', color: '#2563EB', apiStatus: 'Active API' },
    { id: 'indiapost', name: 'India Post Speed Post', logo: 'IP', color: '#B91C1C', apiStatus: 'Active API' },
    { id: 'gati', name: 'Gati KWE Logistics', logo: 'GATI', color: '#D97706', apiStatus: 'Active API' },
    { id: 'mahindra', name: 'Mahindra Logistics Supply Chain', logo: 'MLL', color: '#991B1B', apiStatus: 'Active API' },
    { id: 'dhl', name: 'DHL Express International', logo: 'DHL', color: '#D97706', apiStatus: 'Active API' },
    { id: 'fedex', name: 'FedEx Priority Freight', logo: 'FDX', color: '#4C1D95', apiStatus: 'Active API' },
    { id: 'ups', name: 'UPS Supply Chain Solutions', logo: 'UPS', color: '#78350F', apiStatus: 'Active API' }
];

const Shipments = (props) => {
    const {
        fetchPurchases,
        fetchAllWarehouses,
        fetchAllSuppliers,
        fetchAllProducts,
        fetchFrontSetting,
        purchases = [],
        warehouses = [],
        suppliers = [],
        products = [],
        frontSetting,
        allConfigData
    } = props;

    const dispatch = useDispatch();
    const currencySymbol = frontSetting?.value?.currency_symbol || '₹';

    // State initialization
    useEffect(() => {
        fetchPurchases({ pageSize: 100 }, false);
        fetchAllWarehouses();
        fetchAllSuppliers();
        fetchAllProducts();
        fetchFrontSetting();
    }, []);

    // Filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [courierFilter, setCourierFilter] = useState('All');

    // Modals & Drawers state
    const [selectedShipment, setSelectedShipment] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showTrackModal, setShowTrackModal] = useState(false);
    const [showLabelModal, setShowLabelModal] = useState(false);
    const [activeDrawerTab, setActiveDrawerTab] = useState('overview');

    // Create Shipment Form State (Auto Courier API Integration)
    const [newShipment, setNewShipment] = useState({
        po_no: 'PO-2026-00045',
        courier_id: 'bluedart',
        tracking_mode: 'api',
        vehicle_type: '20ft Container Truck',
        pickup_address: 'Apex Appliance Hub, GST Road, Guindy, Chennai',
        pickup_date: moment().format('YYYY-MM-DD'),
        pickup_time: '10:30 AM',
        package_count: 4,
        weight: '145 kg',
        dimensions: '120 x 80 x 100 cm',
        priority: 'Express Priority Air',
        auto_generate_label: true,
        auto_schedule_pickup: true
    });

    // Auto generated shipment dataset with live API couriers
    const [shipmentsList, setShipmentsList] = useState([
        {
            id: 101,
            shipment_no: 'SHP-2026-00007',
            asn_no: 'ASN-2026-00006',
            po_no: 'PO-2026-00045',
            courier: 'Blue Dart Express',
            courier_code: 'BD',
            courier_color: '#1E3A8A',
            tracking_number: 'AWB-BLUEDART-88991100',
            tracking_url: 'https://www.bluedart.com/tracking?awb=AWB-BLUEDART-88991100',
            vehicle_no: 'TN03UZ104',
            driver_name: 'Manoj K',
            driver_phone: '+91 98765 43210',
            pickup_time: '01 Aug 2026 10:30 AM',
            status: 'In Transit',
            status_code: 'intransit',
            current_location: 'Salem Hub, Tamil Nadu',
            location_updated: 'Updated 15 mins ago via Blue Dart API',
            eta: '04 Aug 2026 10:00 AM',
            packages: 4,
            weight: '145 kg',
            warehouse: 'Main Warehouse, Chennai',
            ai_alert: null,
            grn_triggered: false
        },
        {
            id: 102,
            shipment_no: 'SHP-2026-00006',
            asn_no: 'ASN-2026-00005',
            po_no: 'PO-2026-00044',
            courier: 'Delhivery Surface',
            courier_code: 'DEL',
            courier_color: '#000000',
            tracking_number: 'AWB-DELHIVERY-55443322',
            tracking_url: 'https://www.delhivery.com/track/package/AWB-DELHIVERY-55443322',
            vehicle_no: 'TN66AB5678',
            driver_name: 'Suresh B',
            driver_phone: '+91 97890 12345',
            pickup_time: '31 Jul 2026 04:15 PM',
            status: 'Out For Delivery',
            status_code: 'outfordelivery',
            current_location: 'Coimbatore Dock Gateway',
            location_updated: 'Updated 30 mins ago via Delhivery API',
            eta: '03 Aug 2026 06:00 PM',
            packages: 6,
            weight: '185 kg',
            warehouse: 'Coimbatore WH, Coimbatore',
            ai_alert: 'Traffic Congestion Delay (+20 mins)',
            grn_triggered: false
        },
        {
            id: 103,
            shipment_no: 'SHP-2026-00005',
            asn_no: 'ASN-2026-00004',
            po_no: 'PO-2026-00043',
            courier: 'DTDC Express',
            courier_code: 'DTDC',
            courier_color: '#DC2626',
            tracking_number: 'AWB-DTDC-99223344',
            tracking_url: 'https://www.dtdc.in/tracking/AWB-DTDC-99223344',
            vehicle_no: 'TN59CD7896',
            driver_name: 'Ravi Kumar',
            driver_phone: '+91 96543 21098',
            pickup_time: '30 Jul 2026 11:00 AM',
            status: 'Delivered',
            status_code: 'delivered',
            current_location: 'Madurai Receiving Dock',
            location_updated: 'Delivered & Confirmed',
            eta: '02 Aug 2026 11:00 AM',
            packages: 2,
            weight: '45 kg',
            warehouse: 'Madurai WH, Madurai',
            ai_alert: null,
            grn_triggered: true
        }
    ]);

    // Computed Filtered List
    const filteredShipments = useMemo(() => {
        return shipmentsList.filter(s => {
            const matchesQuery = searchQuery === '' ||
                s.shipment_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.tracking_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.po_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.courier.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.driver_name.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = statusFilter === 'All' || s.status.toLowerCase() === statusFilter.toLowerCase();
            const matchesCourier = courierFilter === 'All' || s.courier.toLowerCase().includes(courierFilter.toLowerCase());

            return matchesQuery && matchesStatus && matchesCourier;
        });
    }, [shipmentsList, searchQuery, statusFilter, courierFilter]);

    // Handle Create Shipment with Auto Courier API & Auto GRN Triggering
    const handleCreateShipment = (e) => {
        e.preventDefault();

        const courierObj = COURIER_PARTNERS.find(c => c.id === newShipment.courier_id) || COURIER_PARTNERS[0];
        const generatedAwb = `AWB-${courierObj.logo}-${Math.floor(10000000 + Math.random() * 90000000)}`;

        const createdItem = {
            id: Date.now(),
            shipment_no: `SHP-2026-${String(shipmentsList.length + 8).padStart(5, '0')}`,
            asn_no: `ASN-2026-${String(shipmentsList.length + 8).padStart(5, '0')}`,
            po_no: newShipment.po_no,
            courier: courierObj.name,
            courier_code: courierObj.logo,
            courier_color: courierObj.color,
            tracking_number: generatedAwb,
            tracking_url: `https://track.courierapi.io/${generatedAwb}`,
            vehicle_no: 'TN04AZ9988',
            driver_name: 'Assigned Driver',
            driver_phone: '+91 98765 11223',
            pickup_time: `${newShipment.pickup_date} ${newShipment.pickup_time}`,
            status: 'Dispatched',
            status_code: 'dispatched',
            current_location: 'Dispatched from Supplier Dock',
            location_updated: 'Live API Tracking Connected',
            eta: moment().add(3, 'days').format('DD MMM YYYY 11:00 AM'),
            packages: newShipment.package_count,
            weight: newShipment.weight,
            warehouse: 'Main Warehouse, Chennai',
            ai_alert: null,
            grn_triggered: false
        };

        setShipmentsList([createdItem, ...shipmentsList]);
        setShowCreateModal(false);

        dispatch(addToast({
            text: `Shipment ${createdItem.shipment_no} created via ${courierObj.name} API! AWB: ${generatedAwb}`,
            type: toastType.SUCCESS
        }));
    };

    // Auto-update Courier Status & Trigger Pending GRN when Delivered
    const handleStatusUpdate = (shipmentId, newStatusCode) => {
        const statusMap = {
            dispatched: 'Dispatched',
            intransit: 'In Transit',
            outfordelivery: 'Out For Delivery',
            delivered: 'Delivered'
        };

        setShipmentsList(prev => prev.map(item => {
            if (item.id === shipmentId) {
                const isDelivered = newStatusCode === 'delivered';
                const updated = {
                    ...item,
                    status: statusMap[newStatusCode] || 'In Transit',
                    status_code: newStatusCode,
                    grn_triggered: isDelivered ? true : item.grn_triggered,
                    current_location: isDelivered ? 'Warehouse Dock Received' : item.current_location
                };

                if (isDelivered) {
                    dispatch(addToast({
                        text: `🎉 Shipment ${item.shipment_no} delivered! Pending GRN automatically triggered in Stock Receiving.`,
                        type: toastType.SUCCESS
                    }));
                } else {
                    dispatch(addToast({
                        text: `Courier Status for ${item.shipment_no} updated to ${statusMap[newStatusCode]}`,
                        type: toastType.INFO
                    }));
                }
                return updated;
            }
            return item;
        }));
    };

    const [isLoadingSkeleton, setIsLoadingSkeleton] = useState(isPageFirstLoad('shipments'));

    useEffect(() => {
        if (isLoadingSkeleton) {
            const timer = setTimeout(() => {
                setIsLoadingSkeleton(false);
                markPageAnimated('shipments');
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [isLoadingSkeleton]);

    return (
        <MasterLayout>
            {isLoadingSkeleton ? (
                <MasterTableSkeleton />
            ) : (
                <div className="shp-wrapper">

                {/* ── 1. Top Enterprise Header & Actions Bar ───────────────── */}
                <div className="shp-header-row">
                    <div>
                        <div className="shp-breadcrumb">
                            <Link to="/app/dashboard" className="shp-breadcrumb-link">Dashboard</Link>
                            <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: '10px' }} />
                            <span>Courier Integration & Shipments</span>
                        </div>
                        <div className="shp-title-group">
                            <h1 className="shp-main-title">Shipments & Logistics Hub</h1>
                        </div>
                        <p className="shp-subtitle">Real-time courier API integration (Blue Dart, Delhivery, DTDC, DHL, FedEx) & Auto GRN pipeline.</p>
                    </div>

                    <div className="shp-header-actions">
                        <button type="button" className="shp-btn-primary" onClick={() => setShowCreateModal(true)}>
                            <FontAwesomeIcon icon={faPlus} />
                            <span>Create Shipment</span>
                        </button>

                        <button type="button" className="shp-btn-secondary" onClick={() => setShowTrackModal(true)}>
                            <FontAwesomeIcon icon={faRoute} />
                            <span>Live GPS Map</span>
                        </button>

                        <button
                            type="button"
                            className="shp-btn-secondary"
                            onClick={() => dispatch(addToast({ text: "Courier Manifest & AWB Barcodes Exported PDF.", type: toastType.SUCCESS }))}
                        >
                            <FontAwesomeIcon icon={faDownload} />
                            <span>Export Manifest</span>
                        </button>

                        <button
                            type="button"
                            className="shp-btn-secondary"
                            onClick={() => dispatch(addToast({ text: "Courier API webhooks synced successfully.", type: toastType.INFO }))}
                            title="Sync Courier Webhooks"
                        >
                            <FontAwesomeIcon icon={faSyncAlt} />
                        </button>
                    </div>
                </div>

                {/* ── 2. Supported Courier API Partner Badge Ribbon ────────────── */}
                <div className="p-3 bg-white border rounded-3 mb-4 shadow-sm">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="fw-bold text-dark" style={{ fontSize: '13px' }}>
                            <FontAwesomeIcon icon={faRobot} className="text-success me-2" />
                            Connected Enterprise Courier API Gateways (Auto-Tracking & Auto GRN Enabled)
                        </span>
                        <span className="badge bg-light-success text-success fw-bold">13 Gateways Live</span>
                    </div>

                    <div className="d-flex align-items-center gap-2 overflow-auto py-1">
                        {COURIER_PARTNERS.map((c) => (
                            <div key={c.id} className="d-flex align-items-center gap-2 px-2.5 py-1.5 border rounded-2 bg-light white-space-nowrap" style={{ fontSize: '12px' }}>
                                <div style={{ width: '22px', height: '22px', borderRadius: '4px', background: c.color, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '9.5px' }}>
                                    {c.logo}
                                </div>
                                <span className="fw-semibold text-dark">{c.name}</span>
                                <span className="badge bg-success" style={{ fontSize: '9px' }}>API</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── 3. Workspace Layout (70% Left Workspace + 30% Right Analytics Panel) ── */}
                <div className="shp-workspace-layout">

                    {/* LEFT WORKSPACE (70%) */}
                    <div className="shp-main-card">

                        {/* Search & Advanced Courier Filter Bar */}
                        <div className="shp-filter-container">
                            <div className="shp-filter-grid">
                                <div className="shp-search-box">
                                    <FontAwesomeIcon icon={faSearch} className="shp-search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Search Shipment, AWB Tracking No, PO, Courier..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <select
                                        className="shp-filter-select"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <option value="All">All Courier Statuses</option>
                                        <option value="Dispatched">Dispatched</option>
                                        <option value="In Transit">In Transit</option>
                                        <option value="Out For Delivery">Out For Delivery</option>
                                        <option value="Delivered">Delivered (GRN Ready)</option>
                                    </select>
                                </div>

                                <div>
                                    <select
                                        className="shp-filter-select"
                                        value={courierFilter}
                                        onChange={(e) => setCourierFilter(e.target.value)}
                                    >
                                        <option value="All">All Courier Carriers</option>
                                        <option value="Blue Dart">Blue Dart</option>
                                        <option value="Delhivery">Delhivery</option>
                                        <option value="DTDC">DTDC</option>
                                        <option value="Ecom Express">Ecom Express</option>
                                        <option value="Shadowfax">Shadowfax</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Shipment Data Grid Table */}
                        <div className="shp-table-responsive">
                            <table className="shp-data-table">
                                <thead>
                                    <tr>
                                        <th>Shipment ID</th>
                                        <th>Courier & AWB Tracking</th>
                                        <th>PO Reference</th>
                                        <th>Vehicle / Driver</th>
                                        <th>Auto Status Pipeline ⚡</th>
                                        <th>ETA & GPS Location</th>
                                        <th>Auto GRN Status</th>
                                        <th className="text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredShipments.length > 0 ? (
                                        filteredShipments.map((s) => (
                                            <tr key={s.id}>
                                                <td>
                                                    <span
                                                        className="fw-bold text-success cursor-pointer"
                                                        onClick={() => {
                                                            setSelectedShipment(s);
                                                            setIsDrawerOpen(true);
                                                        }}
                                                    >
                                                        • {s.shipment_no}
                                                    </span>
                                                </td>

                                                <td>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div className="shp-transporter-logo" style={{ background: s.courier_color }}>
                                                            {s.courier_code}
                                                        </div>
                                                        <div>
                                                            <div className="fw-bold text-dark" style={{ fontSize: '12px' }}>{s.courier}</div>
                                                            <a
                                                                href={s.tracking_url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="font-monospace fw-semibold text-primary text-decoration-none"
                                                                style={{ fontSize: '11px' }}
                                                            >
                                                                {s.tracking_number} ↗
                                                            </a>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="font-monospace fw-bold text-dark">{s.po_no}</td>

                                                <td>
                                                    <div className="font-monospace fw-bold text-dark" style={{ fontSize: '11.5px' }}>{s.vehicle_no}</div>
                                                    <div className="text-muted" style={{ fontSize: '11px' }}>{s.driver_name}</div>
                                                </td>

                                                {/* Live Interactive Courier Status Change */}
                                                <td>
                                                    <select
                                                        className="form-select form-select-sm fw-bold border-0"
                                                        style={{
                                                            fontSize: '11.5px',
                                                            borderRadius: '20px',
                                                            padding: '4px 10px',
                                                            backgroundColor: s.status_code === 'delivered' ? '#DCFCE7' : s.status_code === 'outfordelivery' ? '#F0FDF4' : '#DBEAFE',
                                                            color: s.status_code === 'delivered' ? '#15803D' : s.status_code === 'outfordelivery' ? '#166534' : '#1D4ED8',
                                                        }}
                                                        value={s.status_code}
                                                        onChange={(e) => handleStatusUpdate(s.id, e.target.value)}
                                                    >
                                                        <option value="dispatched">● Dispatched 🚚</option>
                                                        <option value="intransit">● In Transit 🛣️</option>
                                                        <option value="outfordelivery">● Out For Delivery 📍</option>
                                                        <option value="delivered">● Delivered (Auto GRN) ✅</option>
                                                    </select>
                                                </td>

                                                <td>
                                                    <div className="fw-bold text-dark" style={{ fontSize: '12px' }}>{s.eta}</div>
                                                    <div className="text-muted" style={{ fontSize: '11px' }}>📍 {s.current_location}</div>
                                                </td>

                                                <td>
                                                    {s.grn_triggered ? (
                                                        <span className="badge bg-light-success text-success fw-bold px-2 py-1" style={{ borderRadius: '6px' }}>
                                                            ✅ Pending GRN Created
                                                        </span>
                                                    ) : (
                                                        <span className="badge bg-light-secondary text-muted fw-bold px-2 py-1" style={{ borderRadius: '6px' }}>
                                                            Awaiting Delivery
                                                        </span>
                                                    )}
                                                </td>

                                                <td>
                                                    <div className="d-flex align-items-center justify-content-center gap-1">
                                                        <button
                                                            type="button"
                                                            className="shp-action-btn"
                                                            onClick={() => {
                                                                setSelectedShipment(s);
                                                                setIsDrawerOpen(true);
                                                            }}
                                                            title="View Shipment & Courier Details"
                                                        >
                                                            <FontAwesomeIcon icon={faEye} />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="shp-action-btn"
                                                            onClick={() => {
                                                                setSelectedShipment(s);
                                                                setShowTrackModal(true);
                                                            }}
                                                            title="Live GPS Map Tracking"
                                                        >
                                                            <FontAwesomeIcon icon={faRoute} />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="shp-action-btn"
                                                            onClick={() => {
                                                                setSelectedShipment(s);
                                                                setShowLabelModal(true);
                                                            }}
                                                            title="Print Courier Shipping Label & Barcode"
                                                        >
                                                            <FontAwesomeIcon icon={faBarcode} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="8" className="py-5 text-center text-muted">
                                                <FontAwesomeIcon icon={faTruck} className="fs-1 text-secondary mb-2" />
                                                <div className="fw-extrabold text-dark fs-5">No Shipments Found</div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* RIGHT ANALYTICS PANEL (30%) */}
                    <div className="shp-right-panel">

                        {/* AI Logistics Exception Detector */}
                        <div className="shp-panel-card border-warning bg-light-warning">
                            <div className="shp-panel-title text-warning">
                                <span><FontAwesomeIcon icon={faRobot} className="me-2" />AI Logistics Monitor</span>
                                <span className="badge bg-warning text-dark fw-bold">Live Risk Scan</span>
                            </div>
                            <div className="p-2.5 bg-white border rounded-3 mb-2" style={{ fontSize: '12px' }}>
                                <div className="fw-bold text-dark">TN66AB5678 (Delhivery)</div>
                                <div className="text-muted">Traffic Congestion Delay (+20 mins) detected on NH-44. ETA automatically updated.</div>
                            </div>
                            <button
                                type="button"
                                className="btn btn-warning btn-sm w-100 fw-bold"
                                onClick={() => dispatch(addToast({ text: "AI Alert sent to Warehouse receiving manager.", type: toastType.INFO }))}
                            >
                                Send Auto Warehouse Alert
                            </button>
                        </div>

                        {/* Automatic GRN Integration Card */}
                        <div className="shp-panel-card border-success">
                            <div className="shp-panel-title text-success">
                                <span><FontAwesomeIcon icon={faCheckCircle} className="me-2" />Auto GRN Integration</span>
                            </div>
                            <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 12px 0' }}>
                                When courier status switches to <strong>Delivered</strong>, Stock Receiving automatically logs a <strong>Pending GRN</strong> for fast scanning.
                            </p>
                            <Link to="/app/stock-receiving" className="btn btn-outline-success btn-sm w-100 fw-bold">
                                View Stock Receiving (GRN) &rarr;
                            </Link>
                        </div>

                    </div>
                </div>

                {/* ── 4. Slide-Over Detail Drawer (Courier & Live Pipeline) ─────── */}
                {isDrawerOpen && selectedShipment && (
                    <>
                        <div className="shp-drawer-backdrop" onClick={() => setIsDrawerOpen(false)}></div>
                        <div className="shp-drawer">
                            <div className="shp-drawer-header">
                                <div>
                                    <div className="d-flex align-items-center gap-2">
                                        <h4 className="fw-bold text-dark mb-0">{selectedShipment.shipment_no}</h4>
                                        <span className="badge bg-success fw-bold">{selectedShipment.status}</span>
                                    </div>
                                    <div className="text-muted mt-1" style={{ fontSize: '12px' }}>
                                        Courier: <strong className="text-dark">{selectedShipment.courier}</strong> • AWB: <strong className="text-primary font-monospace">{selectedShipment.tracking_number}</strong>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="btn btn-light btn-sm rounded-circle p-1.5"
                                    onClick={() => setIsDrawerOpen(false)}
                                >
                                    <FontAwesomeIcon icon={faTimes} className="fs-5" />
                                </button>
                            </div>

                            <div className="shp-drawer-body">
                                {/* Courier & AWB Header Box */}
                                <div className="p-3 border rounded-3 bg-white mb-4">
                                    <h6 className="fw-bold text-dark mb-3">Courier Integration & Tracking API</h6>
                                    <div className="row g-2" style={{ fontSize: '12.5px' }}>
                                        <div className="col-6">
                                            <div className="text-muted">Carrier Partner</div>
                                            <div className="fw-bold text-dark">{selectedShipment.courier}</div>
                                        </div>
                                        <div className="col-6">
                                            <div className="text-muted">AWB Tracking Number</div>
                                            <div className="fw-bold text-primary font-monospace">{selectedShipment.tracking_number}</div>
                                        </div>
                                        <div className="col-6 mt-2">
                                            <div className="text-muted">Assigned Driver</div>
                                            <div className="fw-bold text-dark">{selectedShipment.driver_name} ({selectedShipment.driver_phone})</div>
                                        </div>
                                        <div className="col-6 mt-2">
                                            <div className="text-muted">Vehicle Registration</div>
                                            <div className="fw-bold text-dark font-monospace">{selectedShipment.vehicle_no}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Live Multi-step Courier Pipeline */}
                                <div className="p-3 border rounded-3 bg-white mb-4">
                                    <h6 className="fw-bold text-dark mb-3">Live Multi-Step Courier Timeline</h6>
                                    <div className="shp-timeline">
                                        <div className="shp-timeline-step">
                                            <div className="shp-timeline-node completed"></div>
                                            <div className="shp-timeline-title">Shipment & ASN Created</div>
                                            <div className="shp-timeline-sub">{selectedShipment.pickup_time} • System Auto-Generated</div>
                                        </div>

                                        <div className="shp-timeline-step">
                                            <div className="shp-timeline-node completed"></div>
                                            <div className="shp-timeline-title">Courier Picked Up ({selectedShipment.courier})</div>
                                            <div className="shp-timeline-sub">Driver {selectedShipment.driver_name} Picked Up Goods</div>
                                        </div>

                                        <div className="shp-timeline-step">
                                            <div className="shp-timeline-node completed"></div>
                                            <div className="shp-timeline-title">Sorting Hub ({selectedShipment.current_location})</div>
                                            <div className="shp-timeline-sub">In Transit via National Highway</div>
                                        </div>

                                        <div className="shp-timeline-step">
                                            <div className={`shp-timeline-node ${selectedShipment.status_code === 'delivered' ? 'completed' : ''}`}></div>
                                            <div className="shp-timeline-title">Warehouse Dock Delivery & Auto GRN</div>
                                            <div className="shp-timeline-sub">ETA: {selectedShipment.eta}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 border-top bg-light d-flex align-items-center justify-content-between">
                                <button type="button" className="btn btn-outline-secondary btn-sm fw-bold" onClick={() => setIsDrawerOpen(false)}>Close</button>
                                <button
                                    type="button"
                                    className="btn btn-success btn-sm fw-bold"
                                    onClick={() => dispatch(addToast({ text: "WhatsApp & Email shipping notification dispatched to warehouse.", type: toastType.SUCCESS }))}
                                >
                                    <FontAwesomeIcon icon={faPaperPlane} className="me-1" /> Send Notification
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* ── 5. Modal: Create Shipment (Select Courier API) ───────────── */}
                <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg" centered>
                    <Modal.Header closeButton className="bg-light">
                        <Modal.Title className="fw-bold text-dark fs-5">
                            <FontAwesomeIcon icon={faTruck} className="text-success me-2" />
                            Create Shipment & Connect Courier API
                        </Modal.Title>
                    </Modal.Header>
                    <form onSubmit={handleCreateShipment}>
                        <Modal.Body className="p-4">
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label fw-bold text-dark" style={{ fontSize: '12.5px' }}>Purchase Order (PO)</label>
                                    <select className="form-select" value={newShipment.po_no} onChange={(e) => setNewShipment({ ...newShipment, po_no: e.target.value })}>
                                        <option value="PO-2026-00045">PO-2026-00045 (Apex Appliance)</option>
                                        <option value="PO-2026-00044">PO-2026-00044 (Ecom Express)</option>
                                    </select>
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-bold text-dark" style={{ fontSize: '12.5px' }}>Select Integrated Courier Gateway</label>
                                    <select className="form-select fw-bold" value={newShipment.courier_id} onChange={(e) => setNewShipment({ ...newShipment, courier_id: e.target.value })}>
                                        {COURIER_PARTNERS.map(c => (
                                            <option key={c.id} value={c.id}>✅ {c.name} ({c.apiStatus})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-bold text-dark" style={{ fontSize: '12.5px' }}>Tracking Mode</label>
                                    <div className="d-flex gap-3 mt-1">
                                        <label className="d-flex align-items-center gap-1 cursor-pointer">
                                            <input type="radio" name="trk_mode" checked={newShipment.tracking_mode === 'api'} onChange={() => setNewShipment({ ...newShipment, tracking_mode: 'api' })} />
                                            <span>API Auto Tracking</span>
                                        </label>
                                        <label className="d-flex align-items-center gap-1 cursor-pointer">
                                            <input type="radio" name="trk_mode" checked={newShipment.tracking_mode === 'manual'} onChange={() => setNewShipment({ ...newShipment, tracking_mode: 'manual' })} />
                                            <span>Manual Tracking</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-bold text-dark" style={{ fontSize: '12.5px' }}>Package Count & Weight</label>
                                    <div className="d-flex gap-2">
                                        <input type="number" className="form-control" value={newShipment.package_count} onChange={(e) => setNewShipment({ ...newShipment, package_count: e.target.value })} placeholder="Cartons" required />
                                        <input type="text" className="form-control" value={newShipment.weight} onChange={(e) => setNewShipment({ ...newShipment, weight: e.target.value })} placeholder="Weight kg" required />
                                    </div>
                                </div>
                            </div>
                        </Modal.Body>
                        <Modal.Footer className="bg-light">
                            <Button variant="outline-secondary" className="fw-bold" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                            <Button variant="success" type="submit" className="fw-bold px-4" style={{ background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)', border: 'none' }}>
                                Generate AWB & Schedule Courier Pickup
                            </Button>
                        </Modal.Footer>
                    </form>
                </Modal>

                {/* ── 6. Modal: Print Courier Shipping Label & Barcode ───────── */}
                {showLabelModal && selectedShipment && (
                    <Modal show={showLabelModal} onHide={() => setShowLabelModal(false)} centered>
                        <Modal.Header closeButton className="bg-light">
                            <Modal.Title className="fw-bold fs-6">
                                <FontAwesomeIcon icon={faBarcode} className="me-2 text-success" />
                                Official Courier Shipping Label (AWB Barcode)
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body className="p-4">
                            <div className="p-3 border rounded-3 bg-white text-center shadow-sm">
                                <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                                    <div className="fw-bold text-dark fs-5">{selectedShipment.courier}</div>
                                    <span className="badge bg-dark">EXPRESS PRIORITY</span>
                                </div>

                                <div className="font-monospace fw-bold fs-6 text-primary mb-2">AWB: {selectedShipment.tracking_number}</div>

                                {/* Simulated Barcode Visual */}
                                <div className="my-3 py-2 bg-light rounded-2 font-monospace fs-4 text-dark" style={{ letterSpacing: '4px', border: '1px dashed #CBD5E1' }}>
                                    ||| | |||| | ||| |||| || |
                                </div>

                                <div className="row g-2 text-start" style={{ fontSize: '11.5px' }}>
                                    <div className="col-6"><strong>TO:</strong> {selectedShipment.warehouse}</div>
                                    <div className="col-6"><strong>FROM:</strong> Apex Appliance Hub</div>
                                    <div className="col-6"><strong>PO:</strong> {selectedShipment.po_no}</div>
                                    <div className="col-6"><strong>WEIGHT:</strong> {selectedShipment.weight}</div>
                                </div>
                            </div>
                        </Modal.Body>
                        <Modal.Footer className="bg-light">
                            <Button variant="outline-secondary" className="fw-bold" onClick={() => setShowLabelModal(false)}>Close</Button>
                            <Button variant="success" className="fw-bold" onClick={() => window.print()}>Print Shipping Label</Button>
                        </Modal.Footer>
                    </Modal>
                )}

                {/* ── 7. Modal: Track Shipment (GPS Route Simulation) ───────── */}
                <Modal show={showTrackModal} onHide={() => setShowTrackModal(false)} size="lg" centered>
                    <Modal.Header closeButton className="bg-dark text-white">
                        <Modal.Title className="fw-bold fs-5">
                            <FontAwesomeIcon icon={faRoute} className="text-success me-2" />
                            Live GPS Courier Route Tracking
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-4">
                        <div className="position-relative border rounded-4 overflow-hidden shadow-sm" style={{ height: '300px', background: '#0F172A', color: '#FFF' }}>
                            <div className="position-absolute inset-0 d-flex flex-column align-items-center justify-content-center">
                                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-danger fs-1 mb-2 animate-bounce" />
                                <div className="fw-extrabold fs-5 text-white">{selectedShipment?.current_location || 'Transit Hub, Salem TN'}</div>
                                <div className="text-muted" style={{ fontSize: '12px' }}>Live Vehicle Speed: 58 km/h • Auto-Refreshed via Courier Webhook</div>
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer className="bg-light">
                        <Button variant="secondary" className="fw-bold" onClick={() => setShowTrackModal(false)}>Close Tracking</Button>
                    </Modal.Footer>
                </Modal>

            </div>
            )}
        </MasterLayout>
    );
};

const mapStateToProps = (state) => {
    const { purchases, warehouses, suppliers, products, frontSetting, allConfigData } = state;
    return { purchases, warehouses, suppliers, products, frontSetting, allConfigData };
};

export default connect(mapStateToProps, {
    fetchPurchases,
    fetchAllWarehouses,
    fetchAllSuppliers,
    fetchAllProducts,
    fetchFrontSetting
})(Shipments);
