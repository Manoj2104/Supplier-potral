import apiConfig from "../../config/apiConfig";
import { apiBaseURL, warehouseActionType, toastType } from "../../constants";
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
import { emitPosDataChanged } from "../../shared/posEvents";
import { getCached, setCache, invalidateCacheByPrefix } from "../apiCache";

export const fetchWarehouses =
    (filter = {}, isLoading = true) =>
    async (dispatch) => {
        let url = apiBaseURL.WAREHOUSES;
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

        const cacheKey = `warehouses:${url}`;
        const cached = getCached(cacheKey);

        // Instantly serve cached data (0ms)
        if (cached) {
            dispatch({ type: warehouseActionType.FETCH_WAREHOUSES, payload: cached.data });
            dispatch(setTotalRecord(cached.total));
            apiConfig.get(url).then((response) => {
                const total = response.data.meta?.total ?? response.data.data?.total ?? 0;
                setCache(cacheKey, { data: response.data.data, total });
                dispatch({ type: warehouseActionType.FETCH_WAREHOUSES, payload: response.data.data });
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
                dispatch({ type: warehouseActionType.FETCH_WAREHOUSES, payload: response.data.data });
                dispatch(setTotalRecord(total));
                if (isLoading) dispatch(setLoading(false));
            })
            .catch(({ response }) => {
                dispatch(addToast({ text: response?.data?.message, type: toastType.ERROR }));
                if (isLoading) dispatch(setLoading(false));
            });
    };


export const fetchWarehouse =
    (warehouseId, isLoading = true) =>
    async (dispatch) => {
        if (isLoading) {
            dispatch(setLoading(true));
        }
        apiConfig
            .get(apiBaseURL.WAREHOUSES + "/" + warehouseId)
            .then((response) => {
                dispatch({
                    type: warehouseActionType.FETCH_WAREHOUSE,
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

export const addWarehouse = (warehouse, navigate) => async (dispatch) => {
    dispatch(setSavingButton(true));
    await apiConfig
        .post(apiBaseURL.WAREHOUSES, warehouse)
        .then((response) => {
            invalidateCacheByPrefix("warehouses");
            emitPosDataChanged({ type: "warehouse" });
            dispatch({
                type: warehouseActionType.ADD_WAREHOUSE,
                payload: response.data.data,
            });
            dispatch(
                addToast({
                    text: getFormattedMessage(
                        "warehouse.success.create.message"
                    ),
                })
            );
            navigate("/app/warehouse");
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

export const editWarehouse =
    (warehouseId, warehouse, navigate) => async (dispatch) => {
        dispatch(setSavingButton(true));
        apiConfig
            .patch(apiBaseURL.WAREHOUSES + "/" + warehouseId, warehouse)
            .then((response) => {
                invalidateCacheByPrefix("warehouses");
                emitPosDataChanged({ type: "warehouse" });
                dispatch({
                    type: warehouseActionType.EDIT_WAREHOUSE,
                    payload: response.data.data,
                });
                dispatch(
                    addToast({
                        text: getFormattedMessage(
                            "warehouse.success.edit.message"
                        ),
                    })
                );
                navigate("/app/warehouse");
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

export const deleteWarehouse = (warehouseId) => async (dispatch) => {
    apiConfig
        .delete(apiBaseURL.WAREHOUSES + "/" + warehouseId)
        .then((response) => {
            invalidateCacheByPrefix("warehouses");
            emitPosDataChanged({ type: "warehouse" });
            dispatch(removeFromTotalRecord(1));
            dispatch({
                type: warehouseActionType.DELETE_WAREHOUSE,
                payload: warehouseId,
            });
            dispatch(
                addToast({
                    text: getFormattedMessage(
                        "warehouse.success.delete.message"
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

export const fetchAllWarehouses = () => async (dispatch) => {
    const cacheKey = 'warehouses:all';
    const cached = getCached(cacheKey);

    if (cached) {
        dispatch({
            type: warehouseActionType.FETCH_ALL_WAREHOUSES,
            payload: cached,
        });
        apiConfig.get(`warehouses?page[size]=0`).then((response) => {
            setCache(cacheKey, response.data.data);
            dispatch({
                type: warehouseActionType.FETCH_ALL_WAREHOUSES,
                payload: response.data.data,
            });
        }).catch(() => {});
        return;
    }

    apiConfig
        .get(`warehouses?page[size]=0`)
        .then((response) => {
            setCache(cacheKey, response.data.data);
            dispatch({
                type: warehouseActionType.FETCH_ALL_WAREHOUSES,
                payload: response.data.data,
            });
        })
        .catch(({ response }) => {
            dispatch(
                addToast({ text: response?.data?.message, type: toastType.ERROR })
            );
        });
};


export const fetchWarehouseDetails =
    (WarehouseId, isLoading = true) =>
    async (dispatch) => {
        if (isLoading) {
            dispatch(setLoading(true));
        }
        apiConfig
            .get(apiBaseURL.WAREHOUSE_DETAILS + "/" + WarehouseId)
            .then((response) => {
                dispatch({
                    type: warehouseActionType.FETCH_WAREHOUSE_DETAILS,
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
