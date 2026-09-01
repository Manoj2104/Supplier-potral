import apiConfig from "../../config/apiConfig";
import {
    apiBaseURL,
    toastType,
    baseUnitsActionType,
    Filters,
} from "../../constants";
import requestParam from "../../shared/requestParam";
import { addToast } from "./toastAction";
import {
    setTotalRecord,
    addInToTotalRecord,
    removeFromTotalRecord,
} from "./totalRecordAction";
import { setLoading } from "./loadingAction";
import { getFormattedMessage } from "../../shared/sharedMethod";
import { emitPosDataChanged } from "../../shared/posEvents";
import { getCached, setCache, invalidateCacheByPrefix } from "../apiCache";
import _ from "lodash";

export const fetchBaseUnits =
    (filter = {}, isLoading = true) =>
    async (dispatch) => {
        const search = (filter.search || '').trim();
        let url = apiBaseURL.BASE_UNITS + '?page[size]=0';
        if (search) {
            url += `&search=${encodeURIComponent(search)}`;
        }

        if (isLoading) {
            dispatch(setLoading(true));
        }

        return apiConfig
            .get(url)
            .then((response) => {
                const data = response.data.data;
                const total = response.data.meta?.total ?? data?.length ?? 0;
                dispatch({
                    type: baseUnitsActionType.FETCH_UNITS,
                    payload: data,
                });
                dispatch(setTotalRecord(total));
                if (isLoading) {
                    dispatch(setLoading(false));
                }
                return data;
            })
            .catch((response) => {
                dispatch(
                    addToast({
                        text: response?.response?.data?.message || response?.data?.message,
                        type: toastType.ERROR,
                    })
                );
                if (isLoading) {
                    dispatch(setLoading(false));
                }
                return [];
            });
    };

export const fetchBaseUnit = (unitId, singleUnit) => async (dispatch) => {
    apiConfig
        .get(apiBaseURL.BASE_UNITS + "/" + unitId, singleUnit)
        .then((response) => {
            dispatch({
                type: baseUnitsActionType.FETCH_UNIT,
                payload: response.data.data,
            });
        })
        .catch(({ response }) => {
            dispatch(
                addToast({ text: response.data.message, type: toastType.ERROR })
            );
        });
};

export const addBaseUnit = (base_units) => async (dispatch) => {
    await apiConfig
        .post(apiBaseURL.BASE_UNITS, base_units)
        .then((response) => {
            invalidateCacheByPrefix("base-units");
            invalidateCacheByPrefix("units");
            emitPosDataChanged({ type: "base_unit" });
            dispatch({
                type: baseUnitsActionType.ADD_UNIT,
                payload: response.data.data,
            });
            dispatch(
                addToast({
                    text: getFormattedMessage(
                        "base-unit.success.create.message"
                    ),
                })
            );
            dispatch(addInToTotalRecord(1));
        })
        .catch(({ response }) => {
            dispatch(
                addToast({
                    text: response?.data?.message,
                    type: toastType.ERROR,
                })
            );
        });
};

export const editBaseUnit =
    (unitId, units, handleClose) => async (dispatch) => {
        apiConfig
            .patch(apiBaseURL.BASE_UNITS + "/" + unitId, units)
            .then((response) => {
                invalidateCacheByPrefix("base-units");
                invalidateCacheByPrefix("units");
                emitPosDataChanged({ type: "base_unit" });
                dispatch({
                    type: baseUnitsActionType.EDIT_UNIT,
                    payload: response.data.data,
                });
                handleClose(false);
                dispatch(
                    addToast({
                        text: getFormattedMessage(
                            "base-unit.success.edit.message"
                        ),
                    })
                );
            })
            .catch(({ response }) => {
                dispatch(
                    addToast({
                        text: response?.data?.message,
                        type: toastType.ERROR,
                    })
                );
            });
    };

export const deleteBaseUnit = (unitId) => async (dispatch) => {
    apiConfig
        .delete(apiBaseURL.BASE_UNITS + "/" + unitId)
        .then((response) => {
            invalidateCacheByPrefix("base-units");
            invalidateCacheByPrefix("units");
            emitPosDataChanged({ type: "base_unit" });
            dispatch(removeFromTotalRecord(1));
            dispatch({
                type: baseUnitsActionType.DELETE_UNIT,
                payload: unitId,
            });
            dispatch(
                addToast({
                    text: getFormattedMessage(
                        "base-unit.success.delete.message"
                    ),
                })
            );
        })
        .catch(({ response }) => {
            dispatch(
                addToast({
                    text: response?.data?.message,
                    type: toastType.ERROR,
                })
            );
        });
};

export const fetchAllBaseUnits = () => async (dispatch) => {
    apiConfig
        .get(`base-units?page[size]=0`)
        .then((response) => {
            dispatch({
                type: baseUnitsActionType.FETCH_ALL_BASE_UNITS,
                payload: response.data.data,
            });
        })
        .catch(({ response }) => {
            dispatch(
                addToast({
                    text: response?.data?.message,
                    type: toastType.ERROR,
                })
            );
        });
};
