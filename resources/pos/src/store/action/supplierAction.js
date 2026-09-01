import apiConfig from "../../config/apiConfig";
import { apiBaseURL, toastType, supplierActionType } from "../../constants";
import requestParam from "../../shared/requestParam";
import { addToast } from "./toastAction";
import {
    setTotalRecord,
    addInToTotalRecord,
    removeFromTotalRecord,
} from "./totalRecordAction";
import { setLoading } from "./loadingAction";
import { getFormattedMessage } from "../../shared/sharedMethod";
import { setSavingButton } from "./saveButtonAction";
import { callImportProductApi } from "./importProductApiAction";
import _ from "lodash";
import { emitPosDataChanged } from "../../shared/posEvents";
import { getCached, setCache, invalidateCacheByPrefix } from "../apiCache";

export const fetchSuppliers =
    (filter = {}, isLoading = true) =>
    async (dispatch) => {
        let url = apiBaseURL.SUPPLIERS;
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

        const cacheKey = `suppliers:${url}`;
        const cached = getCached(cacheKey);

        // Instantly serve cached data (0ms)
        if (cached) {
            dispatch({ type: supplierActionType.FETCH_SUPPLIERS, payload: cached.data });
            dispatch(setTotalRecord(cached.total));
            apiConfig.get(url).then((response) => {
                const total = response.data.meta?.total ?? response.data.data?.total ?? 0;
                setCache(cacheKey, { data: response.data.data, total });
                dispatch({ type: supplierActionType.FETCH_SUPPLIERS, payload: response.data.data });
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
                dispatch({ type: supplierActionType.FETCH_SUPPLIERS, payload: response.data.data });
                dispatch(setTotalRecord(total));
                if (isLoading) dispatch(setLoading(false));
            })
            .catch(({ response }) => {
                dispatch(addToast({ text: response?.data?.message, type: toastType.ERROR }));
                if (isLoading) dispatch(setLoading(false));
            });
    };


export const fetchSupplier =
    (supplierId, isLoading = true) =>
    async (dispatch) => {
        if (isLoading) {
            dispatch(setLoading(true));
        }
        apiConfig
            .get(apiBaseURL.SUPPLIERS + "/" + supplierId)
            .then((response) => {
                dispatch({
                    type: supplierActionType.FETCH_SUPPLIER,
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

export const addSupplier = (supplier, navigate) => async (dispatch) => {
    dispatch(setSavingButton(true));
    await apiConfig
        .post(apiBaseURL.SUPPLIERS, supplier)
        .then((response) => {
            invalidateCacheByPrefix("suppliers");
            emitPosDataChanged({ type: "supplier" });
            dispatch({
                type: supplierActionType.ADD_SUPPLIER,
                payload: response.data.data,
            });
            dispatch(
                addToast({
                    text: getFormattedMessage(
                        "supplier.success.create.message"
                    ),
                })
            );
            navigate("/app/suppliers");
            dispatch(addInToTotalRecord(1));
            dispatch(setSavingButton(false));
        })
        .catch(({ response }) => {
            dispatch(setSavingButton(false));
            dispatch(
                addToast({ text: response.data.message, type: toastType.ERROR })
            );
        });
};

export const editSupplier =
    (supplierId, supplier, navigate) => async (dispatch) => {
        dispatch(setSavingButton(true));
        apiConfig
            .patch(apiBaseURL.SUPPLIERS + "/" + supplierId, supplier)
            .then((response) => {
                invalidateCacheByPrefix("suppliers");
                emitPosDataChanged({ type: "supplier" });
                dispatch({
                    type: supplierActionType.EDIT_SUPPLIER,
                    payload: response.data.data,
                });
                dispatch(
                    addToast({
                        text: getFormattedMessage(
                            "supplier.success.edit.message"
                        ),
                    })
                );
                navigate("/app/suppliers");
                dispatch(setSavingButton(false));
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

export const deleteSupplier = (supplierId) => async (dispatch) => {
    apiConfig
        .delete(apiBaseURL.SUPPLIERS + "/" + supplierId)
        .then((response) => {
            invalidateCacheByPrefix("suppliers");
            emitPosDataChanged({ type: "supplier" });
            dispatch(removeFromTotalRecord(1));
            dispatch({
                type: supplierActionType.DELETE_SUPPLIER,
                payload: supplierId,
            });
            dispatch(
                addToast({
                    text: getFormattedMessage(
                        "supplier.success.delete.message"
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

export const fetchAllSuppliers = () => async (dispatch) => {
    apiConfig
        .get(`suppliers?page[size]=0`)
        .then((response) => {
            dispatch({
                type: supplierActionType.FETCH_ALL_SUPPLIERS,
                payload: response.data.data,
            });
        })
        .catch(({ response }) => {
            dispatch(
                addToast({ text: response.data.message, type: toastType.ERROR })
            );
        });
};

export const addImportSupplier = (importSupplier) => async (dispatch) => {
    await apiConfig
        .post(apiBaseURL.IMPORT_SUPPLIER, importSupplier)
        .then((response) => {
            dispatch(setLoading(false));
            dispatch(callImportProductApi(true));
            dispatch(addToast({ text: "Product Import Create Success " }));
            dispatch(addInToTotalRecord(1));
        })
        .catch(({ response }) => {
            dispatch(
                addToast({ text: response.data.message, type: toastType.ERROR })
            );
        });
};
