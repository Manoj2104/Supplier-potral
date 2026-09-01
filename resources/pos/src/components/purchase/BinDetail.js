import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeft,
    faWarehouse,
    faBox,
    faPlus,
    faTrash,
    faEdit,
    faSave,
    faTimes,
    faExclamationTriangle,
    faCheckCircle
} from "@fortawesome/free-solid-svg-icons";
import MasterLayout from "../MasterLayout";
import TabTitle from "../../shared/tab-title/TabTitle";
import { Modal, Form } from "react-bootstrap-v5";
import "./LiveWarehouseReceiving.css";

const BinDetail = () => {
    const { binCode } = useParams();
    const [bin, setBin] = useState(null);
    const [products, setProducts] = useState([]);
    const [inventories, setInventories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form states for adding product
    const [showAllocateModal, setShowAllocateModal] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState("");
    const [addQuantity, setAddQuantity] = useState(1);
    
    // Inline edit states
    const [editingProductId, setEditingProductId] = useState(null);
    const [editQuantity, setEditQuantity] = useState(0);

    const fetchBinDetail = () => {
        setLoading(true);
        fetch(`/api/warehouse-bins/detail/${binCode}`)
            .then(res => res.json())
            .then(data => {
                if (data.bin) {
                    setBin(data.bin);
                    setInventories(data.bin.inventories || []);
                }
                if (data.products) {
                    setProducts(data.products);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Error loading bin details:", err);
                setLoading(false);
            });
    };

    const broadcastSync = (type = 'bin_detail_update') => {
        try {
            if (window.BroadcastChannel) {
                const bc = new BroadcastChannel('infypos_realtime_bus');
                bc.postMessage({ type: 'bins', action: type, timestamp: Date.now() });
                bc.close();
            }
        } catch(e) {}
        try {
            localStorage.setItem('infypos_sync_pulse', Date.now().toString());
            localStorage.setItem('infy_inventory_sync', Date.now().toString());
            localStorage.setItem('infy_putaway_sync', Date.now().toString());
        } catch(e) {}
    };

    useEffect(() => {
        fetchBinDetail();

        let bc = null;
        try {
            if (window.BroadcastChannel) {
                bc = new BroadcastChannel('infypos_realtime_bus');
                bc.onmessage = (event) => {
                    if (event && event.data) {
                        fetchBinDetail();
                    }
                };
            }
        } catch(e) {}

        const handleStorage = (e) => {
            if (e.key === 'infypos_sync_pulse' || e.key === 'infy_inventory_sync' || e.key === 'infy_putaway_sync' || e.key === 'infypos_realtime_event') {
                fetchBinDetail();
            }
        };

        const handleFocus = () => fetchBinDetail();
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                fetchBinDetail();
            }
        };

        window.addEventListener('storage', handleStorage);
        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            if (bc) bc.close();
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [binCode]);

    const handleAddProduct = (e) => {
        e.preventDefault();
        if (!selectedProductId) {
            alert("Please select a product first.");
            return;
        }

        const data = {
            bin_code: binCode,
            product_id: selectedProductId,
            quantity: addQuantity,
            action: 'add'
        };

        fetch('/api/warehouse-bins/manage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            },
            body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(() => {
            setShowAllocateModal(false);
            setSelectedProductId("");
            setAddQuantity(1);
            broadcastSync('product_allocated');
            fetchBinDetail();
        })
        .catch(err => console.error("Error adding product to bin:", err));
    };

    const handleUpdateQuantity = (productId, qty) => {
        const data = {
            bin_code: binCode,
            product_id: productId,
            quantity: qty,
            action: 'update'
        };

        fetch('/api/warehouse-bins/manage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            },
            body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(() => {
            setEditingProductId(null);
            broadcastSync('qty_updated');
            fetchBinDetail();
        })
        .catch(err => console.error("Error updating bin qty:", err));
    };

    const handleDeleteProduct = (productId) => {
        if (!confirm("Are you sure you want to remove this product from the bin?")) {
            return;
        }

        const data = {
            bin_code: binCode,
            product_id: productId,
            action: 'delete'
        };

        fetch('/api/warehouse-bins/manage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            },
            body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(() => {
            broadcastSync('product_deleted');
            fetchBinDetail();
        })
        .catch(err => console.error("Error deleting product from bin:", err));
    };

    const handleToggleActive = (newStatus) => {
        fetch('/api/warehouse-bins/toggle-active', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            },
            body: JSON.stringify({ bin_code: binCode, is_active: newStatus })
        })
        .then(res => res.json())
        .then(data => {
            if (bin) {
                setBin({ ...bin, is_active: newStatus });
            }
            fetchBinDetail();
        })
        .catch(err => console.error("Error toggling bin status:", err));
    };

    const totalQty = inventories.reduce((sum, item) => sum + Number(item.quantity), 0);
    const capacityPct = bin ? Math.min(100, Math.round((totalQty / bin.max_capacity) * 100)) : 0;

    if (loading) {
        return (
            <MasterLayout>
                <div className="text-center py-5">
                    <h3>Loading Bin Details...</h3>
                </div>
            </MasterLayout>
        );
    }

    return (
        <MasterLayout>
            <TabTitle title={`Bin ${binCode} Details — INFY-POS WMS`} />
            <div className="live-rec-page-container">
                
                {/* Back button and header */}
                <div style={{ marginBottom: '20px' }}>
                    <Link to="/app/bins" className="text-decoration-none d-inline-flex align-items-center gap-2 text-success mb-3" style={{ fontWeight: '800', color: '#10B981' }}>
                        <FontAwesomeIcon icon={faArrowLeft} />
                        <span>Back to Bins list</span>
                    </Link>
                    <div className="d-flex justify-content-between align-items-start">
                        <div>
                            <h1 className="live-rec-main-title" style={{ fontSize: '28px' }}>Bin Details — <strong style={{ color: '#10B981' }}>{binCode}</strong></h1>
                            <p className="live-rec-subtitle">Manage allocated product counts, edit quantities, or assign new warehouse inventory.</p>
                        </div>
                        <div className="d-flex align-items-center gap-3">
                            <div className="d-flex align-items-center gap-2 px-3 py-2 bg-white rounded-3 border shadow-sm">
                                <span style={{ fontSize: '13px', fontWeight: '800', color: bin?.is_active !== false ? '#10B981' : '#64748B' }}>
                                    {bin?.is_active !== false ? 'Active Bin' : 'Inactive Bin'}
                                </span>
                                <div className="form-check form-switch m-0" title="Toggle Bin Active/Inactive Status">
                                    <input 
                                        className="form-check-input" 
                                        type="checkbox" 
                                        role="switch" 
                                        checked={bin?.is_active !== false} 
                                        onChange={(e) => handleToggleActive(e.target.checked)}
                                        style={{ cursor: 'pointer', width: '38px', height: '20px' }}
                                    />
                                </div>
                            </div>
                            <span 
                                className="badge bg-success"
                                style={{ fontSize: '13px', padding: '10px 14px', borderRadius: '10px', fontWeight: '800', background: '#10B981' }}
                            >
                                {bin?.zone_name || 'Zone A'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Metrics header */}
                <div className="card border-0 shadow-sm p-4 mb-4" style={{ borderRadius: '20px' }}>
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-4">
                        <div className="d-flex align-items-center gap-4">
                            <div>
                                <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Bin Capacity</span>
                                <div style={{ fontSize: '16px', fontWeight: '900', color: '#0F172A' }}>{bin?.max_capacity} Units</div>
                            </div>
                            <div style={{ borderLeft: '1px solid #E2E8F0', height: '30px' }}></div>
                            <div>
                                <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Used Capacity</span>
                                <div style={{ fontSize: '16px', fontWeight: '900', color: '#10B981' }}>{totalQty} Units</div>
                            </div>
                            <div style={{ borderLeft: '1px solid #E2E8F0', height: '30px' }}></div>
                            <div>
                                <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Available Capacity</span>
                                <div style={{ fontSize: '16px', fontWeight: '900', color: '#2563EB' }}>{Number(bin?.max_capacity || 0) - totalQty} Units</div>
                            </div>
                            <div style={{ borderLeft: '1px solid #E2E8F0', height: '30px' }}></div>
                            <div>
                                <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>SKU Types</span>
                                <div style={{ fontSize: '16px', fontWeight: '900', color: '#0F172A' }}>{inventories.length}</div>
                            </div>
                        </div>

                        <button 
                            className="btn btn-success d-flex align-items-center gap-2"
                            onClick={() => setShowAllocateModal(true)}
                            style={{ height: '42px', fontWeight: '800', borderRadius: '10px', background: '#10B981', border: 'none' }}
                        >
                            <FontAwesomeIcon icon={faPlus} />
                            <span>Bin Actions</span>
                        </button>
                    </div>

                    <div className="progress mt-4" style={{ height: '8px', borderRadius: '4px', background: '#F1F5F9' }}>
                        <div 
                            className="progress-bar" 
                            style={{ width: `${capacityPct}%`, background: '#10B981', borderRadius: '4px' }}
                        ></div>
                    </div>
                </div>

                {/* Table containing the products inside this bin */}
                <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '20px' }}>
                    <div className="table-responsive">
                        <table className="table align-middle text-nowrap">
                            <thead>
                                <tr style={{ background: '#F8FAFC', fontSize: '11px', fontWeight: '900', color: '#64748B', textTransform: 'uppercase' }}>
                                    <th style={{ padding: '12px' }}>#</th>
                                    <th>Image</th>
                                    <th>Product</th>
                                    <th>SKU / Barcode</th>
                                    <th>Bin</th>
                                    <th>Available Qty</th>
                                    <th>Putaway Date</th>
                                    <th>Status</th>
                                    <th className="text-end" style={{ padding: '12px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventories.length > 0 ? (
                                    inventories.map((item, idx) => {
                                        const p = item.product || { name: 'Unknown Product', code: 'N/A' };
                                        const isEditing = editingProductId === item.product_id;

                                        return (
                                            <tr key={item.id} style={{ fontSize: '13px' }}>
                                                <td style={{ padding: '12px', color: '#64748B', fontWeight: '700' }}>{idx + 1}</td>
                                                <td>
                                                    <div style={{ width: '40px', height: '40px', border: '1px solid #E2E8F0', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFF', overflow: 'hidden' }}>
                                                        <img src="/uploads/main_product/1116/Lays_Classic_Salted__1.jpg" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                    </div>
                                                </td>
                                                <td>
                                                    <div>
                                                        <strong style={{ color: '#0F172A', fontWeight: '800' }}>{p.name}</strong>
                                                        <div style={{ fontSize: '10px', color: '#64748B', fontWeight: '600' }}>Warehouse Inventory</div>
                                                    </div>
                                                </td>
                                                <td style={{ fontWeight: '700', color: '#0F172A' }}>
                                                    <div>{p.code}</div>
                                                    <div style={{ fontSize: '10px', color: '#64748B' }}>{p.code}</div>
                                                </td>
                                                <td>
                                                    <span className="badge bg-light text-dark border" style={{ fontSize: '11px', fontWeight: '800', padding: '5px 8px', borderRadius: '6px' }}>{binCode}</span>
                                                </td>
                                                <td>
                                                    {isEditing ? (
                                                        <input 
                                                            type="number"
                                                            className="form-control form-control-sm"
                                                            value={editQuantity}
                                                            onChange={(e) => setEditQuantity(e.target.value)}
                                                            style={{ width: '80px', fontWeight: '800' }}
                                                        />
                                                    ) : (
                                                        <strong style={{ color: '#10B981', fontSize: '14px', fontWeight: '900' }}>{item.quantity}</strong>
                                                    )}
                                                </td>
                                                <td style={{ color: '#64748B', fontWeight: '600' }}>{new Date(item.created_at || new Date()).toLocaleDateString()}</td>
                                                <td>
                                                    <span className="badge" style={{ background: '#ECFDF5', color: '#10B981', fontSize: '10px', fontWeight: '800' }}>
                                                        Available
                                                    </span>
                                                </td>
                                                <td className="text-end" style={{ padding: '12px' }}>
                                                    {isEditing ? (
                                                        <div className="d-flex justify-content-end gap-2">
                                                            <button 
                                                                className="btn btn-success btn-sm"
                                                                onClick={() => handleUpdateQuantity(item.product_id, editQuantity)}
                                                                style={{ borderRadius: '6px', fontWeight: '800', background: '#10B981', border: 'none' }}
                                                            >
                                                                <FontAwesomeIcon icon={faSave} />
                                                            </button>
                                                            <button 
                                                                className="btn btn-secondary btn-sm"
                                                                onClick={() => setEditingProductId(null)}
                                                                style={{ borderRadius: '6px' }}
                                                            >
                                                                <FontAwesomeIcon icon={faTimes} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="d-flex justify-content-end gap-2">
                                                            <button 
                                                                className="btn btn-outline-primary btn-sm"
                                                                onClick={() => {
                                                                    setEditingProductId(item.product_id);
                                                                    setEditQuantity(item.quantity);
                                                                }}
                                                                style={{ borderRadius: '6px' }}
                                                            >
                                                                <FontAwesomeIcon icon={faEdit} />
                                                            </button>
                                                            <button 
                                                                className="btn btn-outline-danger btn-sm"
                                                                onClick={() => handleDeleteProduct(item.product_id)}
                                                                style={{ borderRadius: '6px' }}
                                                            >
                                                                <FontAwesomeIcon icon={faTrash} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="text-center py-5 text-muted">
                                            <FontAwesomeIcon icon={faExclamationTriangle} style={{ fontSize: '24px', color: '#F59E0B', marginBottom: '8px' }} />
                                            <div>No products allocated in this location bin. Ready for Putaway.</div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Allocate Stock Modal */}
                <Modal
                    show={showAllocateModal}
                    onHide={() => setShowAllocateModal(false)}
                    centered
                >
                    <Modal.Header closeButton className="border-0 px-4 pt-4 pb-0">
                        <Modal.Title style={{ fontWeight: '900', fontSize: '18px', color: '#0F172A' }}>
                            ➕ Allocate Stock to Bin: {binCode}
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="px-4 pb-4">
                        <Form onSubmit={handleAddProduct}>
                            <Form.Group className="mb-3">
                                <Form.Label style={{ fontSize: '12px', fontWeight: '800', color: '#64748B' }}>Select Product</Form.Label>
                                <Form.Select
                                    value={selectedProductId}
                                    onChange={(e) => setSelectedProductId(e.target.value)}
                                    style={{ height: '48px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontWeight: '700' }}
                                    required
                                >
                                    <option value="">-- Choose Product --</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Label style={{ fontSize: '12px', fontWeight: '800', color: '#64748B' }}>Allocated Quantity</Form.Label>
                                <Form.Control 
                                    type="number"
                                    min="1"
                                    value={addQuantity}
                                    onChange={(e) => setAddQuantity(e.target.value)}
                                    style={{ height: '48px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontWeight: '700' }}
                                    required
                                />
                            </Form.Group>

                            <button 
                                type="submit" 
                                className="btn btn-success w-100"
                                style={{ height: '50px', fontWeight: '800', borderRadius: '12px', background: '#10B981', border: 'none' }}
                            >
                                Allocate Product
                            </button>
                        </Form>
                    </Modal.Body>
                </Modal>

            </div>
        </MasterLayout>
    );
};

export default BinDetail;
