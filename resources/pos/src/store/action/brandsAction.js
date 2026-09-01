import apiConfig from "../../config/apiConfig";
import { apiBaseURL, brandsActionType, toastType } from "../../constants";
import requestParam from "../../shared/requestParam";
import { addToast } from "./toastAction";
import {
    addInToTotalRecord,
    setTotalRecord,
    removeFromTotalRecord,
} from "./totalRecordAction";
import { setLoading } from "./loadingAction";
import { getFormattedMessage } from "../../shared/sharedMethod";
import { callUpdateBrandApi } from "./updateBrand";
import { getCached, setCache, invalidateCacheByPrefix } from "../apiCache";
import { emitPosDataChanged } from "../../shared/posEvents";

export const fetchBrands =
    (filter = {}, isLoading = true) =>
    async (dispatch) => {
        let url = apiBaseURL.BRANDS;
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

        const cacheKey = `brands:${url}`;
        const cached = getCached(cacheKey);

        // Instantly serve cached data (0ms)
        if (cached) {
            dispatch({ type: brandsActionType.FETCH_BRANDS, payload: cached.data });
            dispatch(setTotalRecord(cached.total));
            // Revalidate in background silently
            apiConfig.get(url).then((response) => {
                setCache(cacheKey, { data: response.data.data, total: response.data.meta?.total ?? 0 });
                dispatch({ type: brandsActionType.FETCH_BRANDS, payload: response.data.data });
                dispatch(setTotalRecord(response.data.meta?.total ?? 0));
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
                dispatch({ type: brandsActionType.FETCH_BRANDS, payload: response.data.data });
                dispatch(setTotalRecord(total));
                if (isLoading) dispatch(setLoading(false));
            })
            .catch(({ response }) => {
                dispatch(addToast({ text: response?.data?.message, type: toastType.ERROR }));
                if (isLoading) dispatch(setLoading(false));
            });
    };

export const fetchBrand = (brandsId, singleUser) => async (dispatch) => {
    apiConfig
        .get(apiBaseURL.BRANDS + "/" + brandsId, singleUser)
        .then((response) => {
            dispatch({
                type: brandsActionType.FETCH_BRAND,
                payload: response.data.data,
            });
        })
        .catch(({ response }) => {
            dispatch(
                addToast({ text: response.data.message, type: toastType.ERROR })
            );
        });
};

export const addBrand = (brands) => async (dispatch) => {
    await apiConfig
        .post(apiBaseURL.BRANDS, brands)
        .then((response) => {
            invalidateCacheByPrefix('brands:');
            emitPosDataChanged({ type: 'brand' });
            dispatch({ type: brandsActionType.ADD_BRANDS, payload: response.data.data });
            dispatch(addToast({ text: getFormattedMessage("brand.success.create.message") }));
            dispatch(addInToTotalRecord(1));
        })
        .catch(({ response }) => {
            dispatch(addToast({ text: response.data.message, type: toastType.ERROR }));
        });
};

export const editBrand =
    (brandsId, brands, handleClose) => async (dispatch) => {
        apiConfig
            .post(apiBaseURL.BRANDS + "/" + brandsId, brands)
            .then((response) => {
                invalidateCacheByPrefix('brands:');
                emitPosDataChanged({ type: 'brand' });
                dispatch(callUpdateBrandApi(true));
                // dispatch({type: productActionType.ADD_IMPORT_PRODUCT, payload: response.data.data});
                handleClose(false);
                dispatch(
                    addToast({
                        text: getFormattedMessage("brand.success.edit.message"),
                    })
                );
                dispatch(addInToTotalRecord(1));
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

export const deleteBrand = (brandsId) => async (dispatch) => {
    apiConfig
        .delete(apiBaseURL.BRANDS + "/" + brandsId)
        .then((response) => {
            invalidateCacheByPrefix('brands:');
            emitPosDataChanged({ type: 'brand' });
            dispatch(removeFromTotalRecord(1));
            dispatch({ type: brandsActionType.DELETE_BRANDS, payload: brandsId });
            dispatch(addToast({ text: getFormattedMessage("brand.success.delete.message") }));
        })
        .catch(({ response }) => {
            dispatch(addToast({ text: response.data.message, type: toastType.ERROR }));
        });
};

export const fetchAllBrands = () => async (dispatch) => {
    const cacheKey = 'brands:all';
    const cached = getCached(cacheKey);

    // Instantly return from cache (0ms)
    if (cached) {
        dispatch({ type: brandsActionType.FETCH_ALL_BRANDS, payload: cached });
        // Silently revalidate in background
        apiConfig.get(`brands?page[size]=0`).then((response) => {
            setCache(cacheKey, response.data.data);
            dispatch({ type: brandsActionType.FETCH_ALL_BRANDS, payload: response.data.data });
        }).catch(() => {});
        return;
    }

    apiConfig
        .get(`brands?page[size]=0`)
        .then((response) => {
            setCache(cacheKey, response.data.data);
            dispatch({ type: brandsActionType.FETCH_ALL_BRANDS, payload: response.data.data });
        })
        .catch(({ response }) => {
            dispatch(addToast({ text: response?.data?.message, type: toastType.ERROR }));
        });
};

