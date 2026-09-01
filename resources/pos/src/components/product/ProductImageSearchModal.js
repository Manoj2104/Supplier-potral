import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Spinner, Badge } from "react-bootstrap-v5";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faDownload, faCheck, faGlobe, faSparkles, faTag, faLink, faImage } from "@fortawesome/free-solid-svg-icons";
import apiConfig from "../../config/apiConfigWthFormData";

const ProductImageSearchModal = ({ show, onHide, productName, productCode, initialTab, onSelectImage }) => {
    const [query, setQuery] = useState(productName || "");
    const [modelNo, setModelNo] = useState(productCode || "");
    const [source, setSource] = useState(initialTab || "all");
    const [directUrl, setDirectUrl] = useState("");
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [downloadingUrl, setDownloadingUrl] = useState(null);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    useEffect(() => {
        if (productName) setQuery(productName);
        if (productCode) setModelNo(productCode);
        if (initialTab) setSource(initialTab);
    }, [productName, productCode, initialTab]);

    const getCombinedQuery = () => {
        return [query, modelNo].filter(Boolean).join(" ").trim();
    };

    useEffect(() => {
        if (show && source !== "direct_url") {
            const combined = getCombinedQuery();
            if (combined.length > 0) {
                fetchImages(combined, source);
            }
        }
    }, [show, source]);

    const fetchImages = async (searchQuery, platformSource) => {
        if (!searchQuery || !searchQuery.trim()) return;
        setLoading(true);
        setError(null);
        setSuccessMsg(null);
        try {
            const response = await apiConfig.get("search-product-images", {
                params: {
                    name: searchQuery.trim(),
                    source: platformSource || "all",
                },
            });
            if (response.data && response.data.success) {
                setImages(response.data.data || []);
                if ((response.data.data || []).length === 0) {
                    setError("No images found for this product & variant model. Try adjusting terms.");
                }
            } else {
                setError(response.data?.message || "Failed to search images.");
            }
        } catch (err) {
            console.error("Image search error:", err);
            setError("Could not search product images. Please check connection.");
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (source === "direct_url") {
            if (directUrl.trim()) {
                handleChooseImage({ image_url: directUrl.trim() });
            } else {
                setError("Please enter a valid image URL.");
            }
        } else {
            fetchImages(getCombinedQuery(), source);
        }
    };

    const handleSourceChange = (newSource) => {
        setSource(newSource);
        if (newSource !== "direct_url") {
            fetchImages(getCombinedQuery(), newSource);
        }
    };

    const handleChooseImage = async (item) => {
        const urlToFetch = item.image_url;
        setDownloadingUrl(urlToFetch);
        setError(null);
        try {
            // 1. Download via backend proxy to avoid CORS
            const response = await apiConfig.post("proxy-image", {
                url: urlToFetch,
            });

            if (response.data && response.data.success) {
                const dataUrl = response.data.data.data_url;
                const contentType = response.data.data.content_type || "image/jpeg";
                const ext = contentType.split("/")[1] || "jpeg";
                const cleanName = (getCombinedQuery() || "product_image").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
                const fileName = `${cleanName}_${Date.now()}.${ext}`;

                // 2. Convert base64 Data URL to Blob -> File
                const res = await fetch(dataUrl);
                const blob = await res.blob();
                const file = new File([blob], fileName, { type: blob.type || contentType });

                // 3. Pass File to parent
                onSelectImage(file);
                setSuccessMsg(`Image fetched & auto-uploaded successfully!`);

                setTimeout(() => {
                    setSuccessMsg(null);
                    setDirectUrl("");
                    onHide();
                }, 1000);
            } else {
                setError("Failed to download image from this URL. Make sure it is a direct image link.");
            }
        } catch (err) {
            console.error("Error attaching image:", err);
            setError("Error processing selected image URL.");
        } finally {
            setDownloadingUrl(null);
        }
    };

    const platformBadges = {
        Google: { bg: "#4285F4", text: "#FFFFFF", label: "Google" },
        Amazon: { bg: "#FF9900", text: "#000000", label: "Amazon" },
        Flipkart: { bg: "#2874F0", text: "#FFFFFF", label: "Flipkart" },
        Myntra: { bg: "#E40046", text: "#FFFFFF", label: "Myntra" },
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered className="pf-image-search-modal">
            <Modal.Header closeButton style={{ borderBottom: "1px solid #F1F5F9", padding: "16px 24px" }}>
                <Modal.Title style={{ fontSize: "18px", fontWeight: "700", color: "#0F172A", display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ width: "34px", height: "34px", borderRadius: "10px", background: "linear-gradient(135deg, #10B981, #059669)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#FFF" }}>
                        🌐
                    </span>
                    Product Image Search & Direct URL Fetcher
                </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ padding: "20px 24px", background: "#F8FAFC" }}>
                
                {/* Source Filter Pills */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "18px", flexWrap: "wrap" }}>
                    {[
                        { id: "all", label: "🌐 All Platforms" },
                        { id: "google", label: "🔍 Google Images" },
                        { id: "flipkart", label: "🛒 Flipkart" },
                        { id: "amazon", label: "📦 Amazon" },
                        { id: "direct_url", label: "🔗 Direct Image URL" },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => handleSourceChange(tab.id)}
                            style={{
                                padding: "7px 16px",
                                borderRadius: "999px",
                                fontSize: "12px",
                                fontWeight: "700",
                                border: source === tab.id ? "1.5px solid #15803D" : "1px solid #E2E8F0",
                                background: source === tab.id ? "#EFE" : "#FFFFFF",
                                color: source === tab.id ? "#15803D" : "#475569",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                boxShadow: source === tab.id ? "0 2px 6px rgba(21,128,61,0.15)" : "none",
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Direct Image URL Mode */}
                {source === "direct_url" ? (
                    <Form onSubmit={handleSearchSubmit} className="mb-4" style={{ background: "#FFFFFF", padding: "20px", borderRadius: "16px", border: "1.5px solid #10B981" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                            <FontAwesomeIcon icon={faLink} style={{ color: "#10B981", fontSize: "18px" }} />
                            <div>
                                <h6 style={{ margin: 0, fontWeight: "700", color: "#0F172A" }}>Paste Direct Image URL</h6>
                                <p style={{ margin: 0, fontSize: "12px", color: "#64748B" }}>Paste any web image link (.jpg, .png, .webp, .jpeg) from Flipkart, Amazon, Google, etc.</p>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
                            <Form.Control
                                type="url"
                                placeholder="https://example.com/images/product-photo.jpg"
                                value={directUrl}
                                onChange={(e) => setDirectUrl(e.target.value)}
                                style={{
                                    borderRadius: "10px",
                                    border: "1px solid #CBD5E1",
                                    padding: "10px 14px",
                                    fontSize: "13px",
                                    background: "#F8FAFC",
                                }}
                            />
                            <Button
                                type="submit"
                                style={{
                                    borderRadius: "10px",
                                    background: "#15803D",
                                    borderColor: "#15803D",
                                    padding: "0 22px",
                                    fontWeight: "600",
                                    whiteSpace: "nowrap",
                                }}
                                disabled={downloadingUrl !== null || !directUrl.trim()}
                            >
                                {downloadingUrl ? <Spinner animation="border" size="sm" /> : <FontAwesomeIcon icon={faDownload} />} Fetch & Upload
                            </Button>
                        </div>

                        {/* Live Image URL Preview */}
                        {directUrl.trim().length > 10 && (
                            <div style={{ padding: "12px", background: "#F1F5F9", borderRadius: "12px", display: "flex", alignItems: "center", gap: "16px" }}>
                                <div style={{ width: "80px", height: "80px", background: "#FFF", borderRadius: "8px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #E2E8F0" }}>
                                    <img
                                        src={directUrl.trim()}
                                        alt="Preview"
                                        style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
                                        onError={(e) => {
                                            e.target.style.display = "none";
                                        }}
                                    />
                                </div>
                                <div style={{ flex: 1, overflow: "hidden" }}>
                                    <div style={{ fontSize: "12px", fontWeight: "600", color: "#334155" }}>URL Preview</div>
                                    <div style={{ fontSize: "11px", color: "#64748B", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{directUrl}</div>
                                </div>
                            </div>
                        )}
                    </Form>
                ) : (
                    /* Search Mode (Product Name + Model No / Variant) */
                    <Form onSubmit={handleSearchSubmit} className="mb-3">
                        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr auto", gap: "10px" }}>
                            <div>
                                <Form.Label style={{ fontSize: "11px", fontWeight: "700", color: "#475569", textTransform: "uppercase", marginBottom: "3px" }}>
                                    Product Name
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Product name (e.g. V Guard Water Heater)..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    style={{
                                        borderRadius: "10px",
                                        border: "1px solid #CBD5E1",
                                        padding: "8px 12px",
                                        fontSize: "13px",
                                        background: "#FFF",
                                    }}
                                />
                            </div>
                            <div>
                                <Form.Label style={{ fontSize: "11px", fontWeight: "700", color: "#047857", textTransform: "uppercase", marginBottom: "3px" }}>
                                    Model No. / Variant / Color
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g. VINESTA 3L, MAHA-3L, 256GB White..."
                                    value={modelNo}
                                    onChange={(e) => setModelNo(e.target.value)}
                                    style={{
                                        borderRadius: "10px",
                                        border: "1.5px solid #10B981",
                                        padding: "8px 12px",
                                        fontSize: "13px",
                                        background: "#F0FDF4",
                                        color: "#064E3B",
                                        fontWeight: "600",
                                    }}
                                />
                            </div>
                            <div style={{ display: "flex", alignItems: "flex-end" }}>
                                <Button
                                    type="submit"
                                    style={{
                                        borderRadius: "10px",
                                        background: "#15803D",
                                        borderColor: "#15803D",
                                        padding: "9px 20px",
                                        fontWeight: "600",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        whiteSpace: "nowrap",
                                        height: "38px",
                                    }}
                                    disabled={loading}
                                >
                                    {loading ? <Spinner animation="border" size="sm" /> : <FontAwesomeIcon icon={faSearch} />}
                                    Search
                                </Button>
                            </div>
                        </div>
                        <div style={{ marginTop: "6px", fontSize: "12px", color: "#047857", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                            <FontAwesomeIcon icon={faTag} />
                            <span>Exact Variant Target: </span>
                            <span style={{ background: "#DCFCE7", padding: "2px 8px", borderRadius: "6px", border: "1px solid #86EFAC" }}>
                                "{getCombinedQuery() || 'Type name or model'}"
                            </span>
                        </div>
                    </Form>
                )}

                {/* Status messages */}
                {error && (
                    <div style={{ padding: "12px 16px", borderRadius: "10px", background: "#FEF2F2", color: "#DC2626", fontSize: "13px", marginBottom: "16px", border: "1px solid #FCA5A5" }}>
                        {error}
                    </div>
                )}
                {successMsg && (
                    <div style={{ padding: "12px 16px", borderRadius: "10px", background: "#ECFDF5", color: "#059669", fontSize: "13px", marginBottom: "16px", border: "1px solid #6EE7B7", fontWeight: "600" }}>
                        ✓ {successMsg}
                    </div>
                )}

                {/* Loading skeleton */}
                {loading && (
                    <div style={{ textAlign: "center", padding: "40px 0" }}>
                        <Spinner animation="border" variant="success" />
                        <p style={{ marginTop: "12px", color: "#64748B", fontSize: "14px", fontWeight: "500" }}>
                            Searching Google, Flipkart & Amazon for exact variant "{getCombinedQuery()}"...
                        </p>
                    </div>
                )}

                {/* Image Results Grid (when not direct_url mode) */}
                {source !== "direct_url" && !loading && images.length > 0 && (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
                            gap: "14px",
                            maxHeight: "420px",
                            overflowY: "auto",
                            paddingRight: "4px",
                        }}
                    >
                        {images.map((imgItem, idx) => {
                            const badgeInfo = platformBadges[imgItem.platform] || { bg: "#64748B", text: "#FFF", label: imgItem.platform };
                            const isDownloading = downloadingUrl === imgItem.image_url;

                            return (
                                <div
                                    key={idx}
                                    style={{
                                        background: "#FFFFFF",
                                        borderRadius: "14px",
                                        border: "1px solid #E2E8F0",
                                        overflow: "hidden",
                                        display: "flex",
                                        flexDirection: "column",
                                        position: "relative",
                                        boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                                        transition: "transform 0.2s ease, box-shadow 0.2s ease",
                                    }}
                                    className="pf-img-card"
                                >
                                    {/* Platform Badge */}
                                    <span
                                        style={{
                                            position: "absolute",
                                            top: "8px",
                                            left: "8px",
                                            background: badgeInfo.bg,
                                            color: badgeInfo.text,
                                            fontSize: "10px",
                                            fontWeight: "700",
                                            padding: "3px 8px",
                                            borderRadius: "6px",
                                            zIndex: 2,
                                            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                        }}
                                    >
                                        {badgeInfo.label}
                                    </span>

                                    {/* Image Thumbnail */}
                                    <div
                                        style={{
                                            height: "140px",
                                            width: "100%",
                                            background: "#F8FAFC",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            padding: "8px",
                                            position: "relative",
                                        }}
                                    >
                                        <img
                                            src={imgItem.thumbnail_url || imgItem.image_url}
                                            alt={imgItem.title}
                                            style={{
                                                maxHeight: "100%",
                                                maxWidth: "100%",
                                                objectFit: "contain",
                                                margin: "0 auto",
                                            }}
                                            onError={(e) => {
                                                e.target.src = imgItem.image_url;
                                            }}
                                        />
                                    </div>

                                    {/* Footer Info & Action */}
                                    <div style={{ padding: "10px 12px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "8px" }}>
                                        <div
                                            style={{
                                                fontSize: "11px",
                                                color: "#334155",
                                                fontWeight: "500",
                                                lineHeight: "1.3",
                                                display: "-webkit-box",
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: "vertical",
                                                overflow: "hidden",
                                            }}
                                            title={imgItem.title}
                                        >
                                            {imgItem.title}
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => handleChooseImage(imgItem)}
                                            disabled={isDownloading || downloadingUrl !== null}
                                            style={{
                                                width: "100%",
                                                borderRadius: "8px",
                                                fontSize: "12px",
                                                fontWeight: "600",
                                                background: "#15803D",
                                                borderColor: "#15803D",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: "6px",
                                            }}
                                        >
                                            {isDownloading ? (
                                                <>
                                                    <Spinner animation="border" size="sm" />
                                                    Uploading...
                                                </>
                                            ) : (
                                                <>
                                                    <FontAwesomeIcon icon={faDownload} />
                                                    Select & Upload
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer style={{ borderTop: "1px solid #F1F5F9", padding: "12px 24px", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "#64748B" }}>
                    Search Google, Flipkart, Amazon or paste direct Image URL
                </span>
                <Button variant="secondary" onClick={onHide} style={{ borderRadius: "10px", fontWeight: "600" }}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ProductImageSearchModal;
