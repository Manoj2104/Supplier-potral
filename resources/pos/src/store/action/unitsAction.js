import apiConfig from "../../config/apiConfig";
import {
    apiBaseURL,
    unitsActionType,
    toastType,
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

export const fetchUnits =
    (filter = {}, isLoading = true) =>
    async (dispatch) => {
        const search = (filter.search || '').trim();
        let url = apiBaseURL.UNITS + '?page[size]=0';
        if (search) {
            url += `&search=${encodeURIComponent(search)}`;
        }

        if (isLoading) dispatch(setLoading(true));
        return apiConfig
            .get(url)
            .then((response) => {
                const data = response.data.data;
                const total = response.data.meta?.total ?? data?.length ?? 0;
                dispatch({ type: unitsActionType.FETCH_UNITS, payload: data });
                dispatch(setTotalRecord(total));
                if (isLoading) dispatch(setLoading(false));
                return data;
            })
            .catch((response) => {
                dispatch(
                    addToast({
                        text: response?.response?.data?.message || response?.data?.message,
                        type: toastType.ERROR,
                    })
                );
                if (isLoading) dispatch(setLoading(false));
                return [];
            });
    };


export const fetchAllunits = () => async (dispatch) => {
    apiConfig
        .get(`units?page[size]=0`)
        .then((response) => {
            dispatch({
                type: warehouseActionType.FETCH_UNITS,
                payload: response.data.data,
            });
        })
        .catch(({ response }) => {
            dispatch(
                addToast({ text: response.data.message, type: toastType.ERROR })
            );
        });
};

export const fetchUnit = (unitId, singleUnit) => async (dispatch) => {
    apiConfig
        .get(apiBaseURL.UNITS + "/" + unitId, singleUnit)
        .then((response) => {
            dispatch({
                type: unitsActionType.FETCH_UNIT,
                payload: response.data.data,
            });
        })
        .catch(({ response }) => {
            dispatch(
                addToast({ text: response.data.message, type: toastType.ERROR })
            );
        });
};

export const addUnit = (units) => async (dispatch) => {
    await apiConfig
        .post(apiBaseURL.UNITS, units)
        .then((response) => {
            invalidateCacheByPrefix("units");
            emitPosDataChanged({ type: "unit" });
            dispatch({
                type: unitsActionType.ADD_UNIT,
                payload: response.data.data,
            });
            dispatch(
                addToast({
                    text: getFormattedMessage("unit.success.create.message"),
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

export const editUnit = (unitId, units, handleClose) => async (dispatch) => {
    apiConfig
        .patch(apiBaseURL.UNITS + "/" + unitId, units)
        .then((response) => {
            invalidateCacheByPrefix("units");
            emitPosDataChanged({ type: "unit" });
            dispatch({
                type: unitsActionType.EDIT_UNIT,
                payload: response.data.data,
            });
            handleClose(false);
            dispatch(
                addToast({
                    text: getFormattedMessage("unit.success.edit.message"),
                })
            );
        })
        .catch(({ response }) => {
            dispatch(
                addToast({ text: response.data.message, type: toastType.ERROR })
            );
        });
};

export const deleteUnit = (unitId) => async (dispatch) => {
    apiConfig
        .delete(apiBaseURL.UNITS + "/" + unitId)
        .then((response) => {
            invalidateCacheByPrefix("units");
            emitPosDataChanged({ type: "unit" });
            dispatch(removeFromTotalRecord(1));
            dispatch({ type: unitsActionType.DELETE_UNIT, payload: unitId });
            dispatch(
                addToast({
                    text: getFormattedMessage("unit.success.delete.message"),
                })
            );
        })
        .catch(({ response }) => {
            dispatch(
                addToast({ text: response.data.message, type: toastType.ERROR })
            );
        });
};
