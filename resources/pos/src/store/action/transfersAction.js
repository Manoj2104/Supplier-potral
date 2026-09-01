import apiConfig from "../../config/apiConfig";
import { apiBaseURL, transferActionType, toastType } from "../../constants";
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
import { emitPosDataChanged } from "../../shared/posEvents";
import { getCached, setCache, invalidateCacheByPrefix } from "../apiCache";

export const fetchTransfers =
    (filter = {}, isLoading = true) =>
    async (dispatch) => {
        let url = apiBaseURL.TRANSFERS;
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

        const cacheKey = `transfers:${url}`;
        const cached = getCached(cacheKey);

        // Instantly serve cached data (0ms)
        if (cached) {
            dispatch({
                type: transferActionType.FETCH_TRANSFERS,
                payload: cached.data,
            });
            dispatch(setTotalRecord(cached.total));
            // Silently revalidate in background
            apiConfig.get(url).then((response) => {
                const total = response.data.meta?.total !== undefined && response.data.meta.total >= 0
                    ? response.data.meta.total
                    : response.data.data?.total || 0;
                setCache(cacheKey, { data: response.data.data, total });
                dispatch({
                    type: transferActionType.FETCH_TRANSFERS,
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
                    type: transferActionType.FETCH_TRANSFERS,
                    payload: response.data.data,
                });
                dispatch(setTotalRecord(total));
                if (isLoading) {
                    dispatch(setLoading(false));
                }
            })
            .catch(({ response }) => {
                if (isLoading) {
                    dispatch(setLoading(false));
                }
                dispatch(
                    addToast({
                        text: response?.data?.message,
                        type: toastType.ERROR,
                    })
                );
            });
    };

export const addTransfer = (transfer, navigate) => async (dispatch) => {
    dispatch(setSavingButton(true));
    apiConfig
        .post(apiBaseURL.TRANSFERS, transfer)
        .then((response) => {
            invalidateCacheByPrefix("transfers");
            invalidateCacheByPrefix("inventory");
            emitPosDataChanged({ type: "transfer" });
            dispatch({
                type: transferActionType.ADD_TRANSFER,
                payload: response.data.data,
            });
            dispatch(
                addToast({
                    text: getFormattedMessage(
                        "transfer.success.create.message"
                    ),
                })
            );
            navigate("/app/transfers");
            dispatch(addInToTotalRecord(1));
            dispatch(setSavingButton(false));
        })
        .catch(({ response }) => {
            dispatch(setSavingButton(false));
            response &&
                dispatch(
                    addToast({
                        text: response.data.message,
                        type: toastType.ERROR,
                    })
                );
        });
};

export const fetchTransfer =
    (transferId, singleTransfer, isLoading = true) =>
    async (dispatch) => {
        if (isLoading) {
            dispatch(setLoading(true));
        }
        apiConfig
            .get(
                apiBaseURL.TRANSFERS + "/" + transferId + "/edit",
                singleTransfer
            )
            .then((response) => {
                dispatch({
                    type: transferActionType.FETCH_TRANSFER,
                    payload: response.data.data,
                });
                if (isLoading) {
                    dispatch(setLoading(false));
                }
            })
            .catch(({ response }) => {
                if (isLoading) {
                    dispatch(setLoading(false));
                }
                response &&
                    dispatch(
                        addToast({
                            text: response.data.message,
                            type: toastType.ERROR,
                        })
                    );
            });
    };

export const editTransfer =
    (transferId, transfer, navigate) => async (dispatch) => {
        dispatch(setSavingButton(true));
        await apiConfig
            .patch(apiBaseURL.TRANSFERS + "/" + transferId, transfer)
            .then((response) => {
                invalidateCacheByPrefix("transfers");
                invalidateCacheByPrefix("inventory");
                emitPosDataChanged({ type: "transfer" });
                dispatch(
                    addToast({
                        text: getFormattedMessage("sale.success.edit.message"),
                    })
                );
                navigate("/app/transfers");
                dispatch({
                    type: transferActionType.EDIT_TRANSFER,
                    payload: response.data.data,
                });
                dispatch(setSavingButton(false));
            })
            .catch(({ response }) => {
                dispatch(setSavingButton(false));
                response &&
                    dispatch(
                        addToast({
                            text: response.data.message,
                            type: toastType.ERROR,
                        })
                    );
            });
    };

export const deleteTransfer = (transferId) => async (dispatch) => {
    apiConfig
        .delete(apiBaseURL.TRANSFERS + "/" + transferId)
        .then((response) => {
            invalidateCacheByPrefix("transfers");
            invalidateCacheByPrefix("inventory");
            emitPosDataChanged({ type: "transfer" });
            dispatch(removeFromTotalRecord(1));
            dispatch(
                addToast({
                    text: getFormattedMessage(
                        "transfer.success.delete.message"
                    ),
                })
            );
            dispatch({
                type: transferActionType.DELETE_TRANSFER,
                payload: transferId,
            });
        })
        .catch(({ response }) => {
            response &&
                dispatch(
                    addToast({
                        text: response.data.message,
                        type: toastType.ERROR,
                    })
                );
        });
};
