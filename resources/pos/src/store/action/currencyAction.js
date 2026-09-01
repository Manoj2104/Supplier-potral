import apiConfig from "../../config/apiConfig";
import { apiBaseURL, currencyActionType, toastType } from "../../constants";
import requestParam from "../../shared/requestParam";
import { addToast } from "./toastAction";
import {
    addInToTotalRecord,
    removeFromTotalRecord,
    setTotalRecord,
} from "./totalRecordAction";
import { setLoading } from "./loadingAction";
import { getFormattedMessage } from "../../shared/sharedMethod";

import { getCached, setCache, invalidateCacheByPrefix } from "../apiCache";
import { emitPosDataChanged } from "../../shared/posEvents";

export const fetchCurrencies =
    (filter = {}, isLoading = true) =>
    async (dispatch) => {
        let url = apiBaseURL.CURRENCY;
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

        const cacheKey = `currencies:${url}`;
        const cached = getCached(cacheKey);

        if (cached) {
            dispatch({
                type: currencyActionType.FETCH_CURRENCIES,
                payload: cached.data,
            });
            dispatch(setTotalRecord(cached.total));
            apiConfig.get(url).then((response) => {
                const total = response.data.meta?.total !== undefined && response.data.meta.total >= 0
                    ? response.data.meta.total
                    : response.data.data?.total || 0;
                setCache(cacheKey, { data: response.data.data, total });
                dispatch({
                    type: currencyActionType.FETCH_CURRENCIES,
                    payload: response.data.data,
                });
                dispatch(setTotalRecord(total));
            }).catch(() => {});
            return;
        }

        if (isLoading) {
            dispatch(setLoading(true));
        }
        apiConfig
            .get(url)
            .then((response) => {
                const total = response.data.meta?.total !== undefined && response.data.meta.total >= 0
                    ? response.data.meta.total
                    : response.data.data?.total || 0;
                setCache(cacheKey, { data: response.data.data, total });
                dispatch({
                    type: currencyActionType.FETCH_CURRENCIES,
                    payload: response.data.data,
                });
                dispatch(setTotalRecord(total));
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
                if (isLoading) {
                    dispatch(setLoading(false));
                }
            });
    };

export const fetchCurrency = (currencyId) => async (dispatch) => {
    apiConfig
        .get(apiBaseURL.CURRENCY + "/" + currencyId)
        .then((response) => {
            dispatch({
                type: currencyActionType.FETCH_CURRENCY,
                payload: response.data.data,
            });
        })
        .catch(({ response }) => {
            dispatch(
                addToast({ text: response.data.message, type: toastType.ERROR })
            );
        });
};

export const addCurrency = (currency) => async (dispatch) => {
    await apiConfig
        .post(apiBaseURL.CURRENCY, currency)
        .then((response) => {
            dispatch({
                type: currencyActionType.ADD_CURRENCY,
                payload: response.data.data,
            });
            dispatch(
                addToast({
                    text: getFormattedMessage(
                        "currency.success.create.message"
                    ),
                })
            );
            dispatch(addInToTotalRecord(1));
        })
        .catch(({ response }) => {
            dispatch(
                addToast({ text: response.data.message, type: toastType.ERROR })
            );
        });
};

export const editCurrency =
    (currencyId, currency, handleClose) => async (dispatch) => {
        apiConfig
            .put(apiBaseURL.CURRENCY + "/" + currencyId, currency)
            .then((response) => {
                dispatch({
                    type: currencyActionType.EDIT_CURRENCY,
                    payload: response.data.data,
                });
                handleClose(false);
                dispatch(
                    addToast({
                        text: getFormattedMessage(
                            "currency.success.edit.message"
                        ),
                    })
                );
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

export const deleteCurrency = (currencyId) => async (dispatch) => {
    apiConfig
        .delete(apiBaseURL.CURRENCY + "/" + currencyId)
        .then((response) => {
            dispatch(removeFromTotalRecord(1));
            dispatch({
                type: currencyActionType.DELETE_CURRENCY,
                payload: currencyId,
            });
            dispatch(
                addToast({
                    text: getFormattedMessage(
                        "currency.success.delete.message"
                    ),
                })
            );
        })
        .catch(({ response }) => {
            dispatch(
                addToast({ text: response.data.message, type: toastType.ERROR })
            );
        });
};
