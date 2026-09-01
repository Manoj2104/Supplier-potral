import apiConfig from "../../config/apiConfigWthFormData";
import { apiBaseURL, productActionType, toastType } from "../../constants";
import { addToast } from "./toastAction";
import {
    setTotalRecord,
    addInToTotalRecord,
    removeFromTotalRecord,
} from "./totalRecordAction";
import requestParam from "../../shared/requestParam";
import { setLoading } from "./loadingAction";
import { getFormattedMessage } from "../../shared/sharedMethod";
import { setSavingButton } from "./saveButtonAction";
import { callImportProductApi } from "./importProductApiAction";
import { getCached, setCache, invalidateCacheByPrefix } from "../apiCache";
import { emitPosDataChanged } from "../../shared/posEvents";

export const fetchProducts =
    (filter = {}, isLoading = true) =>
        async (dispatch) => {
            let url = apiBaseURL.PRODUCTS;
            if (
                !_.isEmpty(filter) &&
                (filter.page ||
                    filter.pageSize ||
                    filter.search ||
                    filter.order_By ||
                    filter.created_at)
            ) {
                url += requestParam(filter, null, null, null, url);
            }

            const cacheKey = `products:${url}`;
            const cached = getCached(cacheKey);

            // Instantly serve cached data (0ms)
            if (cached) {
                dispatch({ type: productActionType.FETCH_PRODUCTS, payload: cached.data });
                dispatch(setTotalRecord(cached.total));
                // Revalidate silently in background
                apiConfig.get(url).then((response) => {
                    const total = response.data.meta?.total ?? response.data.data?.total ?? 0;
                    setCache(cacheKey, { data: response.data.data, total });
                    dispatch({ type: productActionType.FETCH_PRODUCTS, payload: response.data.data });
                    dispatch(setTotalRecord(total));
                }).catch(() => {});
                return;
            }

            // First load — show spinner
            if (isLoading) dispatch(setLoading(true));
            apiConfig
                .get(url)
                .then((response) => {
                    const total = response.data.meta?.total ?? response.data.data?.total ?? 0;
                    setCache(cacheKey, { data: response.data.data, total });
                    dispatch({ type: productActionType.FETCH_PRODUCTS, payload: response.data.data });
                    dispatch(setTotalRecord(total));
                    if (isLoading) dispatch(setLoading(false));
                })
                .catch(({ response }) => {
                    dispatch(addToast({ text: response?.data?.message, type: toastType.ERROR }));
                    if (isLoading) dispatch(setLoading(false));
                });
        };

export const fetchProduct =
    (productId, singleProduct, isLoading = true) =>
        async (dispatch) => {
            if (isLoading) {
                dispatch(setLoading(true));
            }
            apiConfig
                .get(apiBaseURL.PRODUCTS + "/" + productId, singleProduct)
                .then((response) => {
                    dispatch({
                        type: productActionType.FETCH_PRODUCT,
                        payload: response.data.data,
                    });
                    if (isLoading) {
                        dispatch(setLoading(false));
                    }
                })
                .catch(({ response }) => {
                    dispatch(
                        addToast({
                            text: response.data.message,
                            type: toastType.ERROR,
                        })
                    );
                });
        };

export const addProduct = (product, navigate) => async (dispatch) => {
    dispatch(setSavingButton(true));
    await apiConfig
        .post(apiBaseURL.PRODUCTS, product)
        .then((response) => {
            invalidateCacheByPrefix('products:');
            emitPosDataChanged({ type: 'product' });
            const mainProdId = typeof product?.get === 'function' ? product.get('main_product_id') : product?.main_product_id;
            if (mainProdId) {
                dispatch(fetchMainProduct(mainProdId, false));
            }
            dispatch(
                addToast({
                    text: getFormattedMessage("product.success.create.message"),
                })
            );
            dispatch(setSavingButton(false));
            if (navigate) {
                navigate("/app/products");
            }
        })
        .catch(({ response }) => {
            dispatch(setSavingButton(false));
            dispatch(
                addToast({ text: response?.data?.message || 'Failed to create product', type: toastType.ERROR })
            );
        });
};

export const editProduct =
    (productId, product, navigate) => async (dispatch) => {
        dispatch(setSavingButton(true));
        apiConfig
            .post(apiBaseURL.PRODUCTS + "/" + productId, product)
            .then((response) => {
                invalidateCacheByPrefix('products:');
                emitPosDataChanged({ type: 'product' });
                const mainProdId = typeof product?.get === 'function' ? product.get('main_product_id') : product?.main_product_id;
                if (mainProdId) {
                    dispatch(fetchMainProduct(mainProdId, false));
                }
                dispatch(
                    addToast({
                        text: getFormattedMessage(
                            "product.success.edit.message"
                        ),
                    })
                );
                dispatch(setSavingButton(false));
                if (navigate) {
                    navigate("/app/products");
                }
            })
            .catch(({ response }) => {
                dispatch(setSavingButton(false));
                dispatch(
                    addToast({
                        text: response.data.message,
                        type: toastType.ERROR,
                    })
                );
            });
    };

export const deleteProduct = (productId, mainProductId) => async (dispatch) => {
    apiConfig
        .delete(apiBaseURL.PRODUCTS + "/" + productId)
        .then((response) => {
            invalidateCacheByPrefix('products:');
            emitPosDataChanged({ type: 'product' });
            dispatch(fetchMainProduct(mainProductId, false));
            dispatch(
                addToast({
                    text: getFormattedMessage("product.success.delete.message"),
                })
            );
        })
        .catch(({ response }) => {
            dispatch(
                addToast({ text: response.data.message, type: toastType.ERROR })
            );
        });
};

export const fetchAllProducts = () => async (dispatch) => {
    apiConfig
        .get(`products?page[size]=0`)
        .then((response) => {
            dispatch({
                type: productActionType.FETCH_ALL_PRODUCTS,
                payload: response.data.data,
            });
        })
        .catch(({ response }) => {
            dispatch(
                addToast({ text: response.data.message, type: toastType.ERROR })
            );
        });
};

export const fetchProductsByWarehouse = (id) => async (dispatch) => {
    apiConfig
        .get(`products?page[size]=0&warehouse_id=${id}`)
        .then((response) => {
            dispatch({
                type: productActionType.FETCH_PRODUCTS_BY_WAREHOUSE,
                payload: response.data.data,
            });
        })
        .catch(({ response }) => {
            dispatch(
                addToast({ text: response.data.message, type: toastType.ERROR })
            );
        });
};

export const addImportProduct = (importProduct) => async (dispatch) => {
    await apiConfig
        .post(apiBaseURL.IMPORT_PRODUCT, importProduct)
        .then((response) => {
            invalidateCacheByPrefix('main_products');
            invalidateCacheByPrefix('products');
            emitPosDataChanged({ type: 'product' });
            dispatch(setLoading(false));
            dispatch(callImportProductApi(true));
            // dispatch({type: productActionType.ADD_IMPORT_PRODUCT, payload: response.data.data});
            dispatch(addToast({ text: "Product Import Create Success " }));
            dispatch(addInToTotalRecord(1));
        })
        .catch(({ response }) => {
            dispatch(
                addToast({ text: response.data.message, type: toastType.ERROR })
            );
        });
};
export const fetchAllMainProducts = (filter = {}, isLoading = true, forceRefresh = false) => async (dispatch) => {
    let url = apiBaseURL.MAIN_PRODUCTS;
    if (
        !_.isEmpty(filter) &&
        (filter.page ||
            filter.pageSize ||
            filter.search ||
            filter.order_By ||
            filter.created_at)
    ) {
        url += requestParam(filter, null, null, null, url);
    }

    const cacheKey = `main_products:${url}`;
    const cached = !forceRefresh ? getCached(cacheKey) : null;

    // Instantly serve cached data (0ms)
    if (cached) {
        dispatch({ type: productActionType.FETCH_ALL_MAIN_PRODUCTS, payload: cached.data });
        dispatch(setTotalRecord(cached.total));
        // Silently revalidate in background
        apiConfig.get(url).then((response) => {
            const total = response.data.meta?.total ?? response.data.data?.total ?? 0;
            setCache(cacheKey, { data: response.data.data, total });
            dispatch({ type: productActionType.FETCH_ALL_MAIN_PRODUCTS, payload: response.data.data });
            dispatch(setTotalRecord(total));
        }).catch(() => {});
        return;
    }

    if (isLoading) dispatch(setLoading(true));
    apiConfig
        .get(url)
        .then((response) => {
            const total = response.data.meta?.total ?? response.data.data?.total ?? 0;
            setCache(cacheKey, { data: response.data.data, total });
            dispatch({
                type: productActionType.FETCH_ALL_MAIN_PRODUCTS,
                payload: response.data.data,
            });
            dispatch(setTotalRecord(total));
            if (isLoading) dispatch(setLoading(false));
        })
        .catch(({ response }) => {
            dispatch(addToast({ text: response?.data?.message, type: toastType.ERROR }));
            if (isLoading) dispatch(setLoading(false));
        });
};


export const deleteMainProduct = (productId) => async (dispatch) => {
    invalidateCacheByPrefix('main_products');
    invalidateCacheByPrefix('products');
    apiConfig
        .delete(apiBaseURL.MAIN_PRODUCTS + "/" + productId)
        .then((response) => {
            emitPosDataChanged({ type: 'product' });
            dispatch(removeFromTotalRecord(1));
            dispatch({
                type: productActionType.DELETE_MAIN_PRODUCT,
                payload: productId,
            });
            dispatch(
                addToast({
                    text: getFormattedMessage("product.success.delete.message"),
                })
            );
        })
        .catch(({ response }) => {
            dispatch(
                addToast({ text: response?.data?.message || "Failed to delete product", type: toastType.ERROR })
            );
        });
};

export const fetchMainProduct =
    (productId, isLoading = true) =>
        async (dispatch) => {
            if (isLoading) {
                dispatch(setLoading(true));
            }
            apiConfig
                .get(apiBaseURL.MAIN_PRODUCTS + "/" + productId)
                .then((response) => {
                    dispatch({
                        type: productActionType.FETCH_MAIN_PRODUCT,
                        payload: response.data.data,
                    });
                    if (isLoading) {
                        dispatch(setLoading(false));
                    }
                })
                .catch(({ response }) => {
                    dispatch(
                        addToast({
                            text: response.data.message,
                            type: toastType.ERROR,
                        })
                    );
                });
        };

export const addMainProduct = (product, navigate) => async (dispatch) => {
    dispatch(setSavingButton(true));
    return apiConfig
        .post(apiBaseURL.MAIN_PRODUCTS, product)
        .then((response) => {
            invalidateCacheByPrefix('main_products');
            invalidateCacheByPrefix('products');
            emitPosDataChanged({ type: 'product' });
            dispatch({
                type: productActionType.ADD_MAIN_PRODUCT,
                payload: response.data.data,
            });
            dispatch(
                addToast({
                    text: getFormattedMessage("product.success.create.message"),
                })
            );
            if (navigate) {
                navigate("/app/products");
            }
            dispatch(addInToTotalRecord(1));
            dispatch(setSavingButton(false));
            return response;
        })
        .catch((err) => {
            dispatch(setSavingButton(false));
            dispatch(
                addToast({ text: err.response?.data?.message || 'Failed to create product', type: toastType.ERROR })
            );
            throw err;
        });
};

export const editMainProduct = (productId, product, navigate) => async (dispatch) => {
    dispatch(setSavingButton(true));
    return apiConfig
        .post(apiBaseURL.MAIN_PRODUCTS + "/" + productId, product)
        .then((response) => {
            invalidateCacheByPrefix('main_products');
            invalidateCacheByPrefix('products');
            emitPosDataChanged({ type: 'product' });
            if (navigate) {
                navigate("/app/products");
            }
            dispatch(
                addToast({
                    text: getFormattedMessage(
                        "product.success.edit.message"
                    ),
                })
            );
            dispatch(setSavingButton(false));
            return response;
        })
        .catch((err) => {
            dispatch(setSavingButton(false));
            dispatch(
                addToast({
                    text: err.response?.data?.message || 'Failed to update product',
                    type: toastType.ERROR,
                })
            );
            throw err;
        });
};
