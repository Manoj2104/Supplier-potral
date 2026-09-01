import apiConfig from "../../config/apiConfig";
import { apiBaseURL, purchaseActionType, toastType } from "../../constants";
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
import { getCached, setCache, invalidateCacheByPrefix } from "../apiCache";
import { emitPosDataChanged } from "../../shared/posEvents";

export const fetchPurchases =
    (filter = {}, isLoading = true) =>
    async (dispatch) => {
        let url = apiBaseURL.PURCHASES;
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

        if (isLoading) dispatch(setLoading(true));
        apiConfig
            .get(url)
            .then((response) => {
                const total = response.data.meta?.total ?? response.data.data?.total ?? 0;
                dispatch({ type: purchaseActionType.FETCH_PURCHASES, payload: response.data.data });
                dispatch(setTotalRecord(total));
                if (isLoading) dispatch(setLoading(false));
            })
            .catch(({ response }) => {
                if (isLoading) dispatch(setLoading(false));
                dispatch(addToast({ text: response?.data?.message || "Error loading purchase orders.", type: toastType.ERROR }));
            });
    };

export const fetchPurchase =
    (purchaseId, singlePurchase, isLoading = true) =>
    async (dispatch) => {
        if (isLoading) {
            dispatch(setLoading(true));
        }
        apiConfig
            .get(
                apiBaseURL.PURCHASES + "/" + purchaseId + "/edit",
                singlePurchase
            )
            .then((response) => {
                dispatch({
                    type: purchaseActionType.FETCH_PURCHASE,
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
                dispatch(
                    addToast({
                        text: response?.data?.message || "Error loading purchase order.",
                        type: toastType.ERROR,
                    })
                );
            });
    };

export const addPurchase = (purchase, navigate) => async (dispatch) => {
    dispatch(setSavingButton(true));
    dispatch(setLoading(true));

    apiConfig
        .post(apiBaseURL.PURCHASES, purchase)
        .then((response) => {
            const newPoData = response.data.data;
            invalidateCacheByPrefix('purchases:');
            emitPosDataChanged({ type: 'purchase' });
            dispatch({
                type: purchaseActionType.ADD_PURCHASE,
                payload: newPoData,
            });
            dispatch(addInToTotalRecord(1));
            dispatch(fetchPurchases({ pageSize: 100 }, false));
            dispatch(setSavingButton(false));
            dispatch(setLoading(false));
            dispatch(
                addToast({
                    text: getFormattedMessage("purchase.success.create.message") || "Purchase Created Successfully",
                    type: toastType.SUCCESS,
                })
            );
            if (navigate) {
                navigate("/app/purchases");
            }
        })
        .catch(({ response }) => {
            dispatch(setSavingButton(false));
            dispatch(setLoading(false));
            dispatch(
                addToast({ text: response?.data?.message || "Failed to create Purchase Order.", type: toastType.ERROR })
            );
        });
};

export const editPurchase =
    (purchaseId, purchase, navigate) => async (dispatch) => {
        dispatch(setSavingButton(true));
        apiConfig
            .put(apiBaseURL.PURCHASES + "/" + purchaseId, purchase)
            .then((response) => {
                invalidateCacheByPrefix('purchases:');
                emitPosDataChanged({ type: 'purchase' });
                navigate("/app/purchases");
                dispatch(
                    addToast({
                        text: getFormattedMessage(
                            "purchase.success.edit.message"
                        ),
                        type: toastType.SUCCESS
                    })
                );
                dispatch({
                    type: purchaseActionType.EDIT_PURCHASE,
                    payload: response.data.data,
                });
                dispatch(setSavingButton(false));
            })
            .catch(({ response }) => {
                dispatch(setSavingButton(false));
                dispatch(
                    addToast({
                        text: response?.data?.message || "Failed to update Purchase Order.",
                        type: toastType.ERROR,
                    })
                );
            });
    };

export const deletePurchase = (purchaseId) => async (dispatch) => {
    apiConfig
        .delete(apiBaseURL.PURCHASES + "/" + purchaseId)
        .then((response) => {
            invalidateCacheByPrefix('purchases:');
            emitPosDataChanged({ type: 'purchase' });
            dispatch(removeFromTotalRecord(1));
            dispatch({
                type: purchaseActionType.DELETE_PURCHASE,
                payload: purchaseId,
            });
            dispatch(
                addToast({
                    text: getFormattedMessage(
                        "purchase.success.delete.message"
                    ),
                    type: toastType.SUCCESS
                })
            );
        })
        .catch(({ response }) => {
            dispatch(
                addToast({ text: response?.data?.message || "Failed to delete Purchase Order.", type: toastType.ERROR })
            );
        });
};

export const purchasePdfAction = (id) => async (dispatch) => {
    apiConfig
        .get(`purchase-pdf-download/${id}`)
        .then((response) => {
            if (response.data?.data?.purchase_pdf_url) {
                window.open(response.data.data.purchase_pdf_url, '_blank');
            }
        })
        .catch(({ response }) => {
            dispatch(
                addToast({ text: response?.data?.message || "Failed to download PDF.", type: toastType.ERROR })
            );
        });
};

