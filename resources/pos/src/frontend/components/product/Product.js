import React, { useEffect, useState } from "react";
import { Card, Badge } from "react-bootstrap-v5";
import { connect, useDispatch } from "react-redux";
import useSound from "use-sound";
import { posFetchProduct } from "../../../store/action/pos/posfetchProductAction";
import { posAllProduct } from "../../../store/action/pos/posAllProductAction";
import productImage from "../../../assets/images/brand_logo.png";
import { addToast } from "../../../store/action/toastAction";
import {
    currencySymbolHandling,
    getFormattedMessage,
} from "../../../shared/sharedMethod";
import { toastType } from "../../../constants";

const Product = (props) => {
    const {
        posAllProducts,
        posFetchProduct,
        cartProducts,
        updateCart,
        customCart,
        cartProductIds,
        setCartProductIds,
        settings,
        productMsg,
        newCost,
        selectedOption,
        allConfigData,
    } = props;
    const [updateProducts, setUpdateProducts] = useState([]);
    const [visibleCount, setVisibleCount] = useState(48);
    const [play] = useSound(
        "https://s3.amazonaws.com/freecodecamp/drums/Heater-4_1.mp3"
    );
    const dispatch = useDispatch();

    useEffect(() => {
        setVisibleCount(48);
    }, [posAllProducts]);

    useEffect(() => {
        // update cart while cart is updated
        cartProducts && setUpdateProducts(cartProducts);
        const ids = updateProducts.map((item) => {
            return item.id;
        });
        setCartProductIds(ids);
    }, [updateProducts, cartProducts]);

    const addToCart = (product) => {
        play();
        posFetchProduct(product.id);
        addProductToCart(product);
    };

    const addProductToCart = (product) => {
        const newId = posAllProducts
            .filter((item) => item.id === product.id)
            .map((item) => item.id);
        const finalIdArrays = customCart.map((id) => id.product_id);
        const finalId = finalIdArrays.filter(
            (finalIdArray) => finalIdArray === newId[0]
        );
        const pushArray = [...customCart];
        const newProduct = pushArray.find(
            (element) => element.id === finalId[0]
        );
        const filterQty = updateProducts
            .filter((item) => item.id === product.id)
            .map((qty) => qty.quantity)[0];
        if (
            updateProducts.filter((item) => item.id === product.id).length > 0
        ) {
            if (filterQty >= product.attributes.stock.quantity) {
                dispatch(
                    addToast({
                        text: getFormattedMessage(
                            "pos.quantity.exceeds.quantity.available.in.stock.message"
                        ),
                        type: toastType.ERROR,
                    })
                );
            } else {
                setUpdateProducts((updateProducts) =>
                    updateProducts.map((item) =>
                        item.id === product.id
                            ? {
                                  ...item,
                                  quantity:
                                      product.attributes.stock.quantity >
                                      item.quantity
                                          ? item.quantity++ + 1
                                          : null,
                              }
                            : { ...item, id: item.id }
                    )
                );
                updateCart(updateProducts, product);
            }
        } else {
            setUpdateProducts((prevSelected) => [...prevSelected, product]);
            updateCart((prevSelected) => [...prevSelected, newProduct]);
        }
    };

    const isProductExistInCart = (productId) => {
        return cartProductIds.includes(productId);
    };

    const posFilterProduct =
        posAllProducts &&
        posAllProducts.filter(
            (product) => (product.attributes?.stock?.quantity ?? product.stock?.quantity ?? 0) > 0
        );
    //Cart Item Array
    const loadAllProduct = (product, index) => {
        const findDifferentWords = (str1, str2) => {
            const words1 = str1.split("_");
            const words2 = str2.split("_");

            const uniqueWords1 = words1.filter(
                (word) => word !== "" && !words2.includes(word)
            );
            const uniqueWords2 = words2.filter(
                (word) => word !== "" && !words1.includes(word)
            );

            return [...uniqueWords1, ...uniqueWords2];
        };

        const getApplianceImage = (product) => {
            const name = (product.attributes?.name || "").toLowerCase();
            const rawImages = product.attributes?.images || product.attributes?.image_url;
            let realUrl = null;
            if (rawImages) {
                if (typeof rawImages === "string" && rawImages.trim().length > 0 && !rawImages.includes("brand_logo.png")) {
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
                return "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&auto=format&fit=crop&q=80";
            }
            if (name.includes("drink") || name.includes("cola") || name.includes("pepsi") || name.includes("soda") || name.includes("juice") || name.includes("beverage")) {
                return "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&auto=format&fit=crop&q=80";
            }
            if (name.includes("biscuit") || name.includes("cookie") || name.includes("oreo") || name.includes("parle")) {
                return "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&auto=format&fit=crop&q=80";
            }
            if (name.includes("wash") || name.includes("rin") || name.includes("deterg")) {
                if (name.includes("top load")) {
                    return "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=400&auto=format&fit=crop&q=80";
                }
                return "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&auto=format&fit=crop&q=80";
            }
            if (name.includes("fridge") || name.includes("refrigerat")) {
                return "https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=400&auto=format&fit=crop&q=80";
            }
            if (name.includes("tv") || name.includes("televis") || name.includes("bravia") || name.includes("smart") || name.includes("led")) {
                return "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400&auto=format&fit=crop&q=80";
            }
            if (name.includes("ac") || name.includes("condition") || name.includes("daikin") || name.includes("voltas") || name.includes("split")) {
                return "https://images.unsplash.com/photo-1614633833026-68165d21469e?w=400&auto=format&fit=crop&q=80";
            }
            if (name.includes("fan") || name.includes("cooler")) {
                return "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&auto=format&fit=crop&q=80";
            }
            if (name.includes("mixer") || name.includes("juicer") || name.includes("grind")) {
                return "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400&auto=format&fit=crop&q=80";
            }
            return "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80";
        };

        const mrpPrice = (product.attributes?.product_price || 36500) * 1.2;

        return product.attributes.stock.quantity >= 0.0 ? (
            <div
                className="pos-product-col"
                key={index}
                onClick={() => addToCart(product)}
            >
                <div className={`product-card-modern ${isProductExistInCart(product.id) ? "product-active" : ""}`}>
                    {/* Top Badges */}
                    <div className="product-card-top-badges">
                        <span className="product-disc-badge">16% OFF</span>
                        <span className="product-heart-btn" onClick={(e) => { e.stopPropagation(); }}>
                            <i className="bi bi-heart" />
                        </span>
                    </div>

                    {/* Image Container */}
                    <div className="product-img-wrap">
                        <img
                            src={getApplianceImage(product)}
                            alt={product.attributes?.name}
                            onError={(e) => {
                                e.target.src = "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&auto=format&fit=crop&q=80";
                            }}
                        />
                    </div>

                    {/* Content */}
                    <div className="product-card-body">
                        <span className="product-stock-badge in-stock">
                            ● In Stock ({product.attributes?.stock?.quantity || 10} {product?.attributes?.product_unit_name?.name || 'pcs'})
                        </span>
                        <div className="product-info-name" title={product.attributes?.name}>
                            {product.attributes?.name}
                        </div>
                        <div className="product-info-sku">
                            SKU: {product.attributes?.code}
                        </div>
                        <div className="product-card-footer mt-2 d-flex align-items-center justify-content-between">
                            <div className="product-price-box">
                                <span className="product-price-curr">
                                    {currencySymbolHandling(
                                        allConfigData,
                                        settings.attributes && settings.attributes.currency_symbol,
                                        newCost ? newCost : product.attributes.product_price
                                    )}
                                </span>
                                <span className="product-price-mrp">
                                    {currencySymbolHandling(
                                        allConfigData,
                                        settings.attributes && settings.attributes.currency_symbol,
                                        mrpPrice
                                    )}
                                </span>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <i className="bi bi-eye text-muted fs-small cursor-pointer" title="Quick View" onClick={(e) => { e.stopPropagation(); }} />
                                <i className="bi bi-bar-chart text-muted fs-small cursor-pointer" title="Compare" onClick={(e) => { e.stopPropagation(); }} />
                                <div className="floating-add-btn ms-1">
                                    +
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ) : (
            ""
        );
    };

    const displayedProducts = posFilterProduct ? posFilterProduct.slice(0, visibleCount) : [];

    return (
        <div
            className={`${
                posFilterProduct && posFilterProduct.length === 0
                    ? "d-flex align-items-center justify-content-center"
                    : ""
            } product-list-block pt-1`}
        >
            <div className="pos-products-grid">
                {posFilterProduct && posFilterProduct.length === 0 ? (
                    <h4 className="m-auto">
                        {getFormattedMessage("pos-no-product-available.label")}
                    </h4>
                ) : (
                    ""
                )}
                {productMsg && productMsg === 1 ? (
                    <h4 className="m-auto">
                        {getFormattedMessage("pos-no-product-available.label")}
                    </h4>
                ) : (
                    displayedProducts.map((product, index) => {
                        return loadAllProduct(product, index);
                    })
                )}
                {posFilterProduct && posFilterProduct.length > visibleCount && (
                    <div className="w-100 text-center my-4">
                        <button
                            type="button"
                            className="btn btn-primary btn-sm px-4 py-2"
                            onClick={() => setVisibleCount((prev) => prev + 48)}
                        >
                            Load More
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const mapStateToProps = (state) => {
    const { posAllProducts, allConfigData } = state;
    return { posAllProducts, allConfigData };
};

export default connect(mapStateToProps, { posAllProduct, posFetchProduct })(
    Product
);
