import React, { useEffect, useState, useRef } from "react";
import { connect, useDispatch } from "react-redux";
import {
    posSearchCodeProduct,
    posSearchNameProduct,
} from "../../../store/action/pos/posfetchProductAction";
import useSound from "use-sound";
import {
    getFormattedMessage,
    placeholderText,
} from "../../../shared/sharedMethod";
import { addToast } from "../../../store/action/toastAction";
import { toastType } from "../../../constants";

const ProductSearchbar = (props) => {
    const {
        posAllProducts,
        customCart,
        setUpdateProducts,
        updateProducts,
        posSearchCodeProduct,
        posSearchNameProduct,
        dropUp = false,
    } = props;

    const [searchString, setSearchString] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef(null);
    const containerRef = useRef(null);
    const dispatch = useDispatch();

    const [play] = useSound(
        "https://s3.amazonaws.com/freecodecamp/drums/Heater-4_1.mp3"
    );

    // ── Filtered Products for Autocomplete Dropdown (Excludes Out of Stock) ──────
    const searchResults = (posAllProducts || []).filter((item) => {
        if (!searchString.trim()) return false;
        const qty = item?.attributes?.stock?.quantity ?? item?.stock?.quantity ?? 0;
        if (qty <= 0) return false; // Strictly exclude Out of Stock items (quantity <= 0)
        const q = searchString.toLowerCase().trim();
        const name = (item?.attributes?.name || "").toLowerCase();
        const code = (item?.attributes?.code || "").toLowerCase();
        return name.includes(q) || code.includes(q);
    }).slice(0, 12);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Add Product to Cart
    const addProductToCart = (product) => {
        if (!product || !customCart) return;

        const codeVal = product.attributes?.code || product.code;
        const nameVal = product.attributes?.name || product.name;

        posSearchCodeProduct(codeVal);
        try { play(); } catch (e) {}

        const matchedCartItem = customCart.find(
            (item) => item.code === codeVal || item.name === nameVal
        );

        if (!matchedCartItem) {
            dispatch(addToast({
                text: "Product not found in inventory list",
                type: toastType.ERROR,
            }));
            return;
        }

        const maxAvailable = product.attributes?.stock?.quantity ?? 9999;
        const existingCartItem = updateProducts.find(
            (item) => item.code === codeVal || item.name === nameVal
        );

        if (existingCartItem) {
            if (existingCartItem.quantity >= maxAvailable) {
                dispatch(addToast({
                    text: getFormattedMessage("pos.quantity.exceeds.quantity.available.in.stock.message") || "Available stock quantity exceeded!",
                    type: toastType.ERROR,
                }));
            } else {
                setUpdateProducts((prev) =>
                    prev.map((item) =>
                        (item.code === codeVal || item.name === nameVal)
                            ? { ...item, quantity: item.quantity + 1 }
                            : item
                    )
                );
            }
        } else {
            setUpdateProducts((prev) => [...prev, { ...matchedCartItem, quantity: 1 }]);
        }

        setSearchString("");
        setIsOpen(false);
        setSelectedIndex(-1);
        if (inputRef.current) inputRef.current.focus();
    };

    // Handle Input Change
    const handleInputChange = (e) => {
        const val = e.target.value;
        setSearchString(val);
        setIsOpen(val.trim().length > 0);
        setSelectedIndex(-1);

        // Instant Barcode Auto-Add if exact single code match
        const exactMatch = (posAllProducts || []).find(
            (p) => (p.attributes?.code || "").toLowerCase() === val.toLowerCase().trim()
        );
        if (exactMatch && exactMatch.attributes?.stock?.quantity > 0) {
            addProductToCart(exactMatch);
        }
    };

    // Handle Key Navigation (Enter, Arrow Up/Down, Esc)
    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (selectedIndex >= 0 && searchResults[selectedIndex]) {
                addProductToCart(searchResults[selectedIndex]);
            } else if (searchResults.length > 0) {
                addProductToCart(searchResults[0]);
            } else if (searchString.trim()) {
                const match = (posAllProducts || []).find(
                    (p) => (p.attributes?.code || "").toLowerCase() === searchString.toLowerCase().trim()
                );
                if (match) addProductToCart(match);
            }
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex((prev) => Math.min(prev + 1, searchResults.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === "Escape") {
            setIsOpen(false);
        }
    };

    // Shortcut Focus listener (Ctrl+K)
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                if (inputRef.current) inputRef.current.focus();
            }
        };
        document.addEventListener("keydown", handleGlobalKeyDown);
        return () => document.removeEventListener("keydown", handleGlobalKeyDown);
    }, []);

    return (
        <div ref={containerRef} className="search-bar-wrap w-100 position-relative">
            {/* Live Search Input Bar */}
            <div className="input-group input-group-sm" style={{ height: "42px" }}>
                <span className="input-group-text bg-white border-end-0 text-success ps-3">
                    <i className="bi bi-search fs-6" />
                </span>
                <input
                    ref={inputRef}
                    type="text"
                    className="form-control bg-white border-start-0 border-end-0 fw-semibold"
                    placeholder={placeholderText("pos-globally.search.field.label") || "Search product by name, SKU or scan barcode..."}
                    value={searchString}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => { if (searchString.trim()) setIsOpen(true); }}
                    style={{ height: "42px", fontSize: "13px", color: "#0F172A", boxShadow: "none" }}
                    autoComplete="off"
                />
                <span className="input-group-text bg-white border-start-0 pe-3">
                    <span className="badge bg-light text-secondary border fw-bold" style={{ fontSize: "10px" }}>Ctrl + K</span>
                </span>
            </div>

            {/* Floating Autocomplete Dropdown List (Supports Opening UPWARDS for bottom bar) */}
            {isOpen && (
                <div
                    className={`search-dropdown-menu position-absolute start-0 ${dropUp ? "drop-up" : ""}`}
                    style={dropUp ? { bottom: "46px", top: "auto", zIndex: 999999 } : { top: "46px", zIndex: 999999 }}
                >
                    {searchResults.length > 0 ? (
                        searchResults.map((item, idx) => {
                            const attr = item.attributes || {};
                            const qty = attr.stock?.quantity || 0;
                            const isSelected = idx === selectedIndex;

                            // Comprehensive Product Thumbnail Image Extractor
                            const getThumb = () => {
                                const name = (attr.name || "").toLowerCase();
                                const rawImages = attr.images || attr.image_url;
                                let realUrl = null;
                                if (rawImages) {
                                    if (typeof rawImages === "string" && rawImages.trim().length > 0 && !rawImages.includes("brand_logo.png") && !rawImages.includes("data:image/svg")) {
                                        realUrl = rawImages;
                                    } else if (typeof rawImages === "object") {
                                        let urls = [];
                                        if (rawImages.imageUrls) {
                                            urls = Array.isArray(rawImages.imageUrls) ? rawImages.imageUrls : Object.values(rawImages.imageUrls || {});
                                        } else if (Array.isArray(rawImages)) {
                                            urls = rawImages;
                                        }
                                        const valid = urls.filter(u => typeof u === "string" && u.trim().length > 0 && !u.includes("brand_logo.png"));
                                        if (valid.length > 0) {
                                            const photoUrl = valid.slice().reverse().find(u => !u.includes("cat_") && !u.includes("category_"));
                                            realUrl = photoUrl || valid[valid.length - 1];
                                        }
                                    }
                                }
                                if (realUrl) return realUrl;

                                if (name.includes("lays") || name.includes("chip") || name.includes("snack") || name.includes("potato") || name.includes("bingo") || name.includes("kurkure")) {
                                    return "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=100&auto=format&fit=crop&q=80";
                                }
                                if (name.includes("drink") || name.includes("cola") || name.includes("pepsi") || name.includes("soda") || name.includes("juice") || name.includes("beverage")) {
                                    return "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=100&auto=format&fit=crop&q=80";
                                }
                                if (name.includes("biscuit") || name.includes("cookie") || name.includes("oreo") || name.includes("parle")) {
                                    return "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=100&auto=format&fit=crop&q=80";
                                }
                                if (name.includes("wash") || name.includes("rin") || name.includes("deterg")) {
                                    return "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=100&auto=format&fit=crop&q=80";
                                }
                                if (name.includes("fridge") || name.includes("refrigerat")) {
                                    return "https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=100&auto=format&fit=crop&q=80";
                                }
                                if (name.includes("tv") || name.includes("televis") || name.includes("bravia") || name.includes("smart") || name.includes("led")) {
                                    return "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=100&auto=format&fit=crop&q=80";
                                }
                                return "https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&auto=format&fit=crop&q=80";
                            };

                            return (
                                <div
                                    key={item.id}
                                    className={`search-dropdown-item ${isSelected ? "bg-success bg-opacity-10" : ""}`}
                                    onClick={() => addProductToCart(item)}
                                >
                                    <div className="d-flex align-items-center gap-2">
                                        {/* Product Image Thumbnail */}
                                        <img
                                            src={getThumb()}
                                            alt={attr.name}
                                            style={{
                                                width: "36px",
                                                height: "36px",
                                                objectFit: "cover",
                                                borderRadius: "6px",
                                                border: "1px solid #E2E8F0",
                                                background: "#F8FAFC",
                                                flexShrink: 0,
                                            }}
                                            onError={(e) => {
                                                e.target.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&auto=format&fit=crop&q=80";
                                            }}
                                        />

                                        <span className="badge bg-dark text-white font-mono px-2 py-1" style={{ fontSize: "11px", borderRadius: "6px" }}>
                                            {attr.code}
                                        </span>
                                        <div className="d-flex flex-column">
                                            <span style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A" }}>
                                                {attr.name}
                                            </span>
                                            <span style={{ fontSize: "11px", color: qty > 0 ? "#16A34A" : "#DC2626", fontWeight: 600 }}>
                                                ● {qty > 0 ? `In Stock (${qty} pcs)` : "Out of Stock"}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center gap-3">
                                        <span style={{ fontSize: "14px", fontWeight: 800, color: "#16A34A" }}>
                                            ₹ {parseFloat(attr.product_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </span>
                                        <button type="button" className="btn btn-sm btn-success rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ width: "28px", height: "28px" }}>
                                            <i className="bi bi-plus-lg text-white" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="p-3 text-center text-muted" style={{ fontSize: "12px" }}>
                            <i className="bi bi-exclamation-circle me-1 text-warning" /> No matching products found for "{searchString}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const mapStateToProps = (state) => {
    const { posAllProducts } = state;
    return { posAllProducts };
};

export default connect(mapStateToProps, {
    posSearchCodeProduct,
    posSearchNameProduct,
})(ProductSearchbar);
