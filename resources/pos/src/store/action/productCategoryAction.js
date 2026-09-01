import apiConfig from "../../config/apiConfig";
import {
    apiBaseURL,
    productCategoriesActionType,
    toastType,
} from "../../constants";
import { addToast } from "./toastAction";
import {
    addInToTotalRecord,
    setTotalRecord,
    removeFromTotalRecord,
} from "./totalRecordAction";
import requestParam from "../../shared/requestParam";
import { setLoading } from "./loadingAction";
import { getFormattedMessage } from "../../shared/sharedMethod";
import { emitPosDataChanged } from "../../shared/posEvents";
import { getCached, setCache, invalidateCacheByPrefix } from "../apiCache";

export const fetchProductCategories =
    (filter = {}, isLoading = true) =>
    async (dispatch) => {
        let url = apiBaseURL.PRODUCTS_CATEGORIES;
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

        const cacheKey = `categories:${url}`;
        const cached = getCached(cacheKey);

        // Instantly serve cached data (0ms)
        if (cached) {
            dispatch({ type: productCategoriesActionType.FETCH_PRODUCTS_CATEGORIES, payload: cached.data });
            dispatch(setTotalRecord(cached.total));
            // Silently revalidate in background
            apiConfig.get(url).then((response) => {
                setCache(cacheKey, { data: response.data.data, total: response.data.meta?.total ?? 0 });
                dispatch({ type: productCategoriesActionType.FETCH_PRODUCTS_CATEGORIES, payload: response.data.data });
                dispatch(setTotalRecord(response.data.meta?.total ?? 0));
            }).catch(() => {});
            return;
        }

        // First load — show spinner
        if (isLoading) dispatch(setLoading(true));
        apiConfig
            .get(url)
            .then((response) => {
                const total = response.data.meta?.total ?? 0;
                setCache(cacheKey, { data: response.data.data, total });
                dispatch({ type: productCategoriesActionType.FETCH_PRODUCTS_CATEGORIES, payload: response.data.data });
                dispatch(setTotalRecord(total));
            })
            .catch((response) => {
                dispatch(addToast({ text: response.response?.data?.message, type: toastType.ERROR }));
            })
            .finally(() => {
                if (isLoading) dispatch(setLoading(false));
            });
    };

export const fetchProductCategory =
    (productId, singleProduct) => async (dispatch) => {
        apiConfig
            .get(apiBaseURL.PRODUCTS_CATEGORIES + "/" + productId, singleProduct)
            .then((response) => {
                dispatch({ type: productCategoriesActionType.FETCH_PRODUCT_CATEGORIES, payload: response.data.data });
            })
            .catch(({ response }) => {
                dispatch(addToast({ text: response.data.message, type: toastType.ERROR }));
            });
    };

export const addProductCategory = (products) => async (dispatch) => {
    await apiConfig
        .post(apiBaseURL.PRODUCTS_CATEGORIES, products)
        .then((response) => {
            invalidateCacheByPrefix('categories:');
            emitPosDataChanged({ type: 'category' });
            dispatch({ type: productCategoriesActionType.ADD_PRODUCT_CATEGORIES, payload: response.data.data });
            dispatch(addToast({ text: getFormattedMessage("product-category.success.create.message") }));
            dispatch(addInToTotalRecord(1));
        })
        .catch(({ response }) => {
            dispatch(addToast({ text: response.data.message, type: toastType.ERROR }));
        });
};

export const editProductCategory =
    (productId, products, handleClose) => async (dispatch) => {
        apiConfig
            .post(apiBaseURL.PRODUCTS_CATEGORIES + "/" + productId, products)
            .then((response) => {
                invalidateCacheByPrefix('categories:');
                emitPosDataChanged({ type: 'category' });
                dispatch({ type: productCategoriesActionType.EDIT_PRODUCT_CATEGORIES, payload: response.data.data });
                handleClose(false);
                dispatch(addToast({ text: getFormattedMessage("product-category.success.edit.message") }));
            })
            .catch(({ response }) => {
                dispatch(addToast({ text: response.data.message, type: toastType.ERROR }));
            });
    };

export const deleteProductCategory = (productId) => async (dispatch) => {
    apiConfig
        .delete(apiBaseURL.PRODUCTS_CATEGORIES + "/" + productId)
        .then((response) => {
            invalidateCacheByPrefix('categories:');
            emitPosDataChanged({ type: 'category' });
            dispatch(removeFromTotalRecord(1));
            dispatch({ type: productCategoriesActionType.DELETE_PRODUCT_CATEGORIES, payload: productId });
            dispatch(addToast({ text: getFormattedMessage("product-category.success.delete.message") }));
        })
        .catch(({ response }) => {
            dispatch(addToast({ text: response.data.message, type: toastType.ERROR }));
        });
};

export const fetchAllProductCategories = () => async (dispatch) => {
    const cacheKey = 'categories:all';
    const cached = getCached(cacheKey);

    // Instantly return from cache (0ms)
    if (cached) {
        dispatch({ type: productCategoriesActionType.FETCH_ALL_PRODUCTS_CATEGORIES, payload: cached });
        // Silently revalidate in background
        apiConfig.get(`product-categories?page[size]=500`).then((response) => {
            setCache(cacheKey, response.data.data);
            dispatch({ type: productCategoriesActionType.FETCH_ALL_PRODUCTS_CATEGORIES, payload: response.data.data });
        }).catch(() => {});
        return;
    }

    apiConfig
        .get(`product-categories?page[size]=500`)
        .then((response) => {
            setCache(cacheKey, response.data.data);
            dispatch({ type: productCategoriesActionType.FETCH_ALL_PRODUCTS_CATEGORIES, payload: response.data.data });
        })
        .catch(({ response }) => {
            dispatch(addToast({ text: response?.data?.message, type: toastType.ERROR }));
        });
};


