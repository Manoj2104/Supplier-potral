import apiConfig from "../../config/apiConfig";
import { apiBaseURL, expenseActionType, toastType } from "../../constants";
import requestParam from "../../shared/requestParam";
import { addToast } from "./toastAction";
import {
    addInToTotalRecord,
    removeFromTotalRecord,
    setTotalRecord,
} from "./totalRecordAction";
import { setLoading } from "./loadingAction";
import { getFormattedMessage } from "../../shared/sharedMethod";
import { setSavingButton } from "./saveButtonAction";
import { emitPosDataChanged } from "../../shared/posEvents";
import { getCached, setCache, invalidateCacheByPrefix } from "../apiCache";

export const fetchExpenses =
    (filter = {}, isLoading = true) =>
    async (dispatch) => {
        let url = apiBaseURL.EXPENSES;
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

        const cacheKey = `expenses:${url}`;
        const cached = getCached(cacheKey);

        // Instantly serve cached data (0ms)
        if (cached) {
            dispatch({ type: expenseActionType.FETCH_EXPENSES, payload: cached.data });
            dispatch(setTotalRecord(cached.total));
            // Silently revalidate in background
            apiConfig.get(url).then((response) => {
                const total = response.data.meta?.total !== undefined && response.data.meta.total >= 0
                    ? response.data.meta.total
                    : response.data.data?.total || 0;
                setCache(cacheKey, { data: response.data.data, total });
                dispatch({ type: expenseActionType.FETCH_EXPENSES, payload: response.data.data });
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
                    type: expenseActionType.FETCH_EXPENSES,
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

export const fetchExpense = (expenseId, singleExpense) => async (dispatch) => {
    apiConfig
        .get(apiBaseURL.EXPENSES + "/" + expenseId, singleExpense)
        .then((response) => {
            dispatch({
                type: expenseActionType.FETCH_EXPENSE,
                payload: response.data.data,
            });
        })
        .catch(({ response }) => {
            dispatch(
                addToast({ text: response.data.message, type: toastType.ERROR })
            );
        });
};

export const addExpense = (expense, navigate) => async (dispatch) => {
    dispatch(setSavingButton(true));
    await apiConfig
        .post(apiBaseURL.EXPENSES, expense)
        .then((response) => {
            invalidateCacheByPrefix("expenses");
            invalidateCacheByPrefix("dashboard");
            emitPosDataChanged({ type: "expense" });
            dispatch({
                type: expenseActionType.ADD_EXPENSE,
                payload: response.data.data,
            });
            dispatch(
                addToast({
                    text: getFormattedMessage("expense.success.create.message"),
                })
            );
            navigate("/app/expenses");
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

export const editExpense =
    (expenseId, expense, navigate) => async (dispatch) => {
        dispatch(setSavingButton(true));
        apiConfig
            .put(apiBaseURL.EXPENSES + "/" + expenseId, expense)
            .then((response) => {
                invalidateCacheByPrefix("expenses");
                invalidateCacheByPrefix("dashboard");
                emitPosDataChanged({ type: "expense" });
                dispatch({
                    type: expenseActionType.EDIT_EXPENSE,
                    payload: response.data.data,
                });
                dispatch(
                    addToast({
                        text: getFormattedMessage(
                            "expense.success.edit.message"
                        ),
                    })
                );
                navigate("/app/expenses");
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

export const deleteExpense = (expenseId) => async (dispatch) => {
    apiConfig
        .delete(apiBaseURL.EXPENSES + "/" + expenseId)
        .then((response) => {
            invalidateCacheByPrefix("expenses");
            invalidateCacheByPrefix("dashboard");
            emitPosDataChanged({ type: "expense" });
            dispatch(removeFromTotalRecord(1));
            dispatch({
                type: expenseActionType.DELETE_EXPENSE,
                payload: expenseId,
            });
            dispatch(
                addToast({
                    text: getFormattedMessage("expense.success.delete.message"),
                })
            );
        })
        .catch(({ response }) => {
            dispatch(
                addToast({ text: response.data.message, type: toastType.ERROR })
            );
        });
};
