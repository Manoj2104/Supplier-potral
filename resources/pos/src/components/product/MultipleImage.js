import React, { useEffect, useState, useRef } from 'react';
import { Image, Form, Button, Row, Col } from 'react-bootstrap-v5';
import { connect, useDispatch } from 'react-redux';
import { deleteProductImage } from '../../store/action/productImageAction';
import { addToast } from '../../store/action/toastAction';
import apiConfig from '../../config/apiConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTrash,
    faCloudArrowUp,
    faPaste,
    faLink,
    faSearch,
    faCamera,
    faStar,
    faCheck,
    faImage
} from '@fortawesome/free-solid-svg-icons';

const MultipleImage = (props) => {
    const { fetchFiles, product, deleteProductImage, transferImage, addedFiles, onOpenSearchModal } = props;
    const [images, setImages] = useState([]);
    const [newImages, setNewImages] = useState([]);
    const [oldImages, setOldImages] = useState([]);
    const [imageIdArray, setImageIdArray] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [imageUrlInput, setImageUrlInput] = useState('');
    const fileInputRef = useRef(null);
    const dispatch = useDispatch();

    useEffect(() => {
        if (addedFiles && Array.isArray(addedFiles) && addedFiles.length > 0) {
            setImages((prevImages) => {
                const sliced = addedFiles.slice(0, 2);
                if (prevImages.length === sliced.length && prevImages.every((val, index) => val === sliced[index])) {
                    return prevImages;
                }
                return sliced;
            });
        }
    }, [addedFiles]);

    useEffect(() => {
        if (images && images.length > 0) {
            if (typeof fetchFiles === 'function') {
                fetchFiles(images.slice(0, 2));
            }
            if (typeof transferImage === 'function') {
                transferImage(images.slice(0, 2));
            }
        }
    }, [images.length]);

    useEffect(() => {
        if (product && product[0] && product[0].images && product[0].images.imageUrls) {
            const urls = product[0].images.imageUrls.map((item) => item);
            setOldImages(urls);
            if (product[0].images.id) {
                setImageIdArray(product[0].images.id.map((id) => id));
            }
        }
    }, []);

    // ── Global Clipboard Paste Listener (CTRL + V) ───────────────────────────
    useEffect(() => {
        const handlePaste = (e) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    if (blob) {
                        const pastedFile = new File([blob], `pasted-image-${Date.now()}.png`, { type: blob.type });
                        setImages((prev) => [pastedFile, ...prev]);
                        dispatch(addToast({ text: "📋 Image pasted from Clipboard (CTRL + V)!" }));
                    }
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [dispatch]);

    // ── Auto-Fill Image from Smart Product Lookup ──────────────────────────
    useEffect(() => {
        const handleAutoFill = async (e) => {
            const { file, url } = e.detail || {};
            if (file) {
                setImages(prev => {
                    if (prev.length >= 2) return prev;
                    return [file, ...prev].slice(0, 2);
                });
            } else if (url) {
                try {
                    const resp = await apiConfig.post('proxy-image', { url });
                    const json = resp.data;
                    const dataurl = json?.data?.data_url || json?.data_url;
                    if (dataurl) {
                        const arr = dataurl.split(',');
                        const mime = arr[0].match(/:(.*?);/)[1];
                        const bstr = atob(arr[1]);
                        let n = bstr.length;
                        const u8arr = new Uint8Array(n);
                        while (n--) {
                            u8arr[n] = bstr.charCodeAt(n);
                        }
                        const autoFile = new File([u8arr], `product_auto_${Date.now()}.jpg`, { type: mime });
                        setImages(prev => {
                            if (prev.length >= 2) return prev;
                            return [autoFile, ...prev].slice(0, 2);
                        });
                        return;
                    }
                } catch (err) {
                    console.warn('Proxy fetch warning, falling back to direct URL:', err);
                }
                // Fallback to raw URL string
                setImages(prev => {
                    if (prev.length >= 2) return prev;
                    return [url, ...prev].slice(0, 2);
                });
            }
        };
        window.addEventListener('product-image-autofill', handleAutoFill);
        return () => window.removeEventListener('product-image-autofill', handleAutoFill);
    }, [dispatch]);



    useEffect(() => {
        if (images.length < 1) {
            setNewImages([]);
            return;
        }
        const newImageUrls = [];
        images.forEach((image) => {
            if (typeof image === 'string') {
                newImageUrls.push(image);
            } else if (image instanceof Blob || image instanceof File) {
                newImageUrls.push(URL.createObjectURL(image));
            }
        });
        setNewImages(newImageUrls);
    }, [images]);

    // Drag & Drop Handlers
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
            setImages((prev) => [...droppedFiles, ...prev]);
            dispatch(addToast({ text: `Uploaded ${droppedFiles.length} images via Drag & Drop` }));
        }
    };

    const onUploadImage = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            setImages((prev) => [...newFiles, ...prev]);
            dispatch(addToast({ text: `Uploaded ${newFiles.length} images` }));
        }
    };

    const handleAddImageUrl = () => {
        if (!imageUrlInput.trim()) {
            dispatch(addToast({ text: "Please enter a valid image URL", type: "ERROR" }));
            return;
        }
        setImages((prev) => [imageUrlInput.trim(), ...prev]);
        setImageUrlInput('');
        dispatch(addToast({ text: "Image URL added to gallery!" }));
    };

    const onRemove = (index) => {
        let imgFiles = images.filter((file, i) => i !== index);
        dispatch(addToast({ text: "Image removed" }));
        setImages(imgFiles);
    };

    const oldRemoveOld = (index) => {
        let newFiles = oldImages.filter((file, i) => i !== index);
        let imageId = imageIdArray.filter((id, i) => i === index);
        let leftImageIdArray = imageIdArray.filter((id, i) => i !== index);
        if (deleteProductImage && imageId[0]) {
            deleteProductImage(imageId[0]);
        }
        setOldImages(newFiles);
        setImageIdArray(leftImageIdArray);
    };

    return (
        <div className="pim-media-container">

            {/* 1. Large Drag & Drop Dropzone */}
            <div
                className={`pim-dropzone-box ${isDragging ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    accept=".png, .jpg, .jpeg, .webp, .gif, .svg, .jfif"
                    style={{ display: 'none' }}
                    multiple
                    onChange={onUploadImage}
                />
                <div className="pim-dropzone-content">
                    <div className="pim-dropzone-icon-circle">
                        <FontAwesomeIcon icon={faCloudArrowUp} />
                    </div>
                    <h5 className="fw-extrabold text-dark mb-1 fs-6">Drag & drop product images here, or browse</h5>
                    <p className="text-muted small mb-3">Supports PNG, JPG, WEBP, GIF, SVG up to 10MB each</p>

                    <div className="d-flex align-items-center justify-content-center gap-2 flex-wrap">
                        <button type="button" className="btn btn-pim-green px-4 py-2">
                            <FontAwesomeIcon icon={faImage} className="me-1.5" /> Browse Files
                        </button>
                        <span className="badge bg-light text-dark border px-3 py-2 fw-semibold">
                            <FontAwesomeIcon icon={faPaste} className="me-1 text-primary" /> Press CTRL + V to Paste
                        </span>
                    </div>
                </div>
            </div>

            {/* 2. Alternative Upload Bar: Image URL & Google Image Search */}
            <div className="pim-media-tools-bar mt-3 p-3 bg-light border rounded-3">
                <Row className="g-2 align-items-center">
                    <Col md={7}>
                        <div className="d-flex gap-2">
                            <div className="position-relative flex-grow-1">
                                <input
                                    type="text"
                                    className="form-control pim-field-input ps-4"
                                    placeholder="Paste image URL (https://...)"
                                    value={imageUrlInput}
                                    onChange={(e) => setImageUrlInput(e.target.value)}
                                />
                                <FontAwesomeIcon icon={faLink} className="position-absolute text-muted" style={{ left: "12px", top: "12px" }} />
                            </div>
                            <button type="button" className="btn btn-pim-outline fw-bold" onClick={handleAddImageUrl}>
                                Add URL
                            </button>
                        </div>
                    </Col>

                    <Col md={5} className="d-flex gap-2 justify-content-md-end">
                        {onOpenSearchModal && (
                            <button type="button" className="btn btn-pim-outline fw-bold text-primary w-100" onClick={onOpenSearchModal}>
                                <FontAwesomeIcon icon={faSearch} className="me-1.5" /> Search Web Images
                            </button>
                        )}
                        <button type="button" className="btn btn-pim-outline fw-bold text-secondary" onClick={() => dispatch(addToast({ text: "Camera feature ready" }))}>
                            <FontAwesomeIcon icon={faCamera} />
                        </button>
                    </Col>
                </Row>
            </div>

            {/* 3. Image Gallery Preview Grid */}
            <div className="pim-gallery-grid mt-4">
                <h6 className="fw-bold text-dark mb-3">Product Media Gallery ({newImages.length + oldImages.length})</h6>
                
                <div className="d-flex flex-wrap gap-3">
                    {newImages.map((newImage, i) => (
                        <div className="pim-gallery-item position-relative" key={`new-${i}`}>
                            <Image className="pim-gallery-img" src={newImage} alt={`Product Image ${i + 1}`} />
                            {i === 0 && (
                                <span className="pim-primary-badge">
                                    <FontAwesomeIcon icon={faStar} className="me-1" /> Primary
                                </span>
                            )}
                            <button type="button" className="pim-img-delete-btn" onClick={() => onRemove(i)}>
                                <FontAwesomeIcon icon={faTrash} />
                            </button>
                        </div>
                    ))}

                    {oldImages.map((oldImage, i) => (
                        <div className="pim-gallery-item position-relative" key={`old-${i}`}>
                            <Image className="pim-gallery-img" src={oldImage} alt={`Existing Image ${i + 1}`} />
                            <button type="button" className="pim-img-delete-btn" onClick={() => oldRemoveOld(i)}>
                                <FontAwesomeIcon icon={faTrash} />
                            </button>
                        </div>
                    ))}

                    {newImages.length === 0 && oldImages.length === 0 && (
                        <div className="p-4 text-center border rounded-3 bg-light text-muted w-100" style={{ borderStyle: 'dashed' }}>
                            No images uploaded yet. Drag & drop images or paste image URL above.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default connect(null, { deleteProductImage })(MultipleImage);
