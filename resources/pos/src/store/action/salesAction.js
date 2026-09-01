import apiConfig from "../../config/apiConfig";
import { apiBaseURL, saleActionType, toastType } from "../../constants";
import { addToast } from "./toastAction";
import {
    addInToTotalRecord,
    removeFromTotalRecord,
    setTotalRecord,
} from "./totalRecordAction";
import { setLoading } from "./loadingAction";
import requestParam from "../../shared/requestParam";
import { getFormattedMessage } from "../../shared/sharedMethod";
import { callSaleApi } from "./saleApiAction";
import { setSavingButton } from "./saveButtonAction";
import { getCached, setCache, invalidateCacheByPrefix } from "../apiCache";
import { emitPosDataChanged } from "../../shared/posEvents";

export const fetchSales =
    (filter = {}, isLoading = true) =>
    async (dispatch) => {
        const admin = true;
        let url = apiBaseURL.SALES;
        if (
            !_.isEmpty(filter) &&
            (filter.page ||
                filter.pageSize ||
                filter.search ||
                filter.order_By ||
                filter.created_at ||
                filter.customer_id)
        ) {
            url += requestParam(filter, admin, null, null, url);
        }

        const cacheKey = `sales:${url}`;
        const cached = getCached(cacheKey);

        // Instantly serve cached data (0ms)
        if (cached) {
            dispatch({ type: saleActionType.FETCH_SALES, payload: cached.data });
            dispatch(setTotalRecord(cached.total));
            dispatch(callSaleApi(false));
            // Silently revalidate
            apiConfig.get(url).then((response) => {
                const total = response.data.meta?.total ?? response.data.data?.total ?? 0;
                setCache(cacheKey, { data: response.data.data, total });
                dispatch({ type: saleActionType.FETCH_SALES, payload: response.data.data });
                dispatch(setTotalRecord(total));
            }).catch(() => {});
            return;
        }

        if (isLoading) dispatch(setLoading(true));
        await apiConfig
            .get(url)
            .then((response) => {
                const total = response.data.meta?.total ?? response.data.data?.total ?? 0;
                setCache(cacheKey, { data: response.data.data, total });
                dispatch({ type: saleActionType.FETCH_SALES, payload: response.data.data });
                dispatch(setTotalRecord(total));
                dispatch(callSaleApi(false));
                if (isLoading) dispatch(setLoading(false));
            })
            .catch(({ response }) => {
                dispatch(addToast({ text: response?.data?.message, type: toastType.ERROR }));
                if (isLoading) dispatch(setLoading(false));
            });
    };

export const fetchSale =
    (saleId, singleSale, isLoading = true) =>
    async (dispatch) => {
        if (isLoading) {

            dispatch(setLoading(true));
        }
        await apiConfig
            .get(apiBaseURL.SALES + "/" + saleId + "/edit", singleSale)
            .then((response) => {
                dispatch({
                    type: saleActionType.FETCH_SALE,
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

export const addSale = (sale, navigate) => async (dispatch) => {
    dispatch(setSavingButton(true));
    await apiConfig
        .post(apiBaseURL.SALES, sale)
        .then((response) => {
            invalidateCacheByPrefix('sales:');
            emitPosDataChanged({ type: 'sale' });
            dispatch({ type: saleActionType.ADD_SALE, payload: response.data.data });
            dispatch(addToast({ text: getFormattedMessage("sale.success.create.message") }));
            dispatch(addInToTotalRecord(1));
            navigate("/app/sales");
            dispatch(setSavingButton(false));
        })
        .catch(({ response }) => {
            dispatch(setSavingButton(false));
            dispatch(
                addToast({ text: response.data.message, type: toastType.ERROR })
            );
        });
};

export const editSale = (saleId, sale, navigate) => async (dispatch) => {
    dispatch(setSavingButton(true));
    await apiConfig
        .patch(apiBaseURL.SALES + "/" + saleId, sale)
        .then((response) => {
            invalidateCacheByPrefix('sales:');
            emitPosDataChanged({ type: 'sale' });
            dispatch(
                addToast({
                    text: getFormattedMessage("sale.success.edit.message"),
                })
            );
            navigate("/app/sales");
            dispatch({
                type: saleActionType.EDIT_SALE,
                payload: response.data.data,
            });
            dispatch(setSavingButton(false));
        })
        .catch(({ response }) => {
            dispatch(setSavingButton(false));
            dispatch(
                addToast({ text: response.data.message, type: toastType.ERROR })
            );
        });
};

export const deleteSale = (userId) => async (dispatch) => {
    await apiConfig
        .delete(apiBaseURL.SALES + "/" + userId)
        .then(() => {
            invalidateCacheByPrefix('sales:');
            emitPosDataChanged({ type: 'sale' });
            dispatch(removeFromTotalRecord(1));
            dispatch({ type: saleActionType.DELETE_SALE, payload: userId });
            dispatch(addToast({ text: getFormattedMessage("sale.success.delete.message") }));
        })
        .catch(({ response }) => {
            response && dispatch(addToast({ text: response.data.message, type: toastType.ERROR }));
        });
};
