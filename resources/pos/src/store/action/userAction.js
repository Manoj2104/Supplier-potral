import apiConfig from "../../config/apiConfig";
import { apiBaseURL, userActionType, toastType } from "../../constants";
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
import { getCached, setCache, invalidateCacheByPrefix } from "../apiCache";

export const fetchUsers =
    (filter = {}, isLoading = true, allUser) =>
    async (dispatch) => {
        let url = apiBaseURL.USERS;
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
        url += allUser ? allUser : "";

        const cacheKey = `users:${url}`;
        const cached = getCached(cacheKey);

        // Instantly serve cached data (0ms)
        if (cached) {
            dispatch({
                type: userActionType.FETCH_USERS,
                payload: cached.data || [],
            });
            if (!allUser) dispatch(setTotalRecord(cached.total));
            // Silently revalidate in background
            apiConfig.get(url).then((response) => {
                const total = response?.data?.meta?.total !== undefined && response?.data?.meta?.total >= 0
                    ? response.data.meta.total
                    : response?.data?.data?.total || 0;
                setCache(cacheKey, { data: response?.data?.data || [], total });
                dispatch({
                    type: userActionType.FETCH_USERS,
                    payload: response?.data?.data || [],
                });
                if (!allUser) dispatch(setTotalRecord(total));
            }).catch(() => {});
            return;
        }

        if (isLoading) {
            dispatch(setLoading(true));
        }
        apiConfig
            .get(url)
            .then((response) => {
                const total = response?.data?.meta?.total !== undefined && response?.data?.meta?.total >= 0
                    ? response.data.meta.total
                    : response?.data?.data?.total || 0;
                setCache(cacheKey, { data: response?.data?.data || [], total });
                dispatch({
                    type: userActionType.FETCH_USERS,
                    payload: response?.data?.data || [],
                });
                !allUser && dispatch(setTotalRecord(total));
                if (isLoading) {
                    dispatch(setLoading(false));
                }
            })
            .catch((error) => {
                if (isLoading) {
                    dispatch(setLoading(false));
                }
                const msg = error?.response?.data?.message || 'Failed to fetch users';
                dispatch(
                    addToast({
                        text: msg,
                        type: toastType.ERROR,
                    })
                );
            });
    };

export const fetchUser =
    (userId, isLoading = true) =>
    async (dispatch) => {
        if (isLoading) {
            dispatch(setLoading(true));
        }
        apiConfig
            .get(apiBaseURL.USERS + "/" + userId)
            .then((response) => {
                dispatch({
                    type: userActionType.FETCH_USER,
                    payload: response?.data?.data || null,
                });
                if (isLoading) {
                    dispatch(setLoading(false));
                }
            })
            .catch((error) => {
                if (isLoading) {
                    dispatch(setLoading(false));
                }
                const msg = error?.response?.data?.message || 'Failed to fetch user';
                dispatch(
                    addToast({
                        text: msg,
                        type: toastType.ERROR,
                    })
                );
            });
    };

export const addUser = (users, navigate) => async (dispatch) => {
    dispatch(setSavingButton(true));
    await apiConfig
        .post(apiBaseURL.USERS, users)
        .then((response) => {
            invalidateCacheByPrefix("users");
            dispatch({
                type: userActionType.ADD_USER,
                payload: response?.data?.data,
            });
            dispatch(
                addToast({
                    text: getFormattedMessage("user.success.create.message"),
                })
            );
            navigate("/app/users");
            dispatch(addInToTotalRecord(1));
            dispatch(setSavingButton(false));
        })
        .catch((error) => {
            dispatch(setSavingButton(false));
            const msg = error?.response?.data?.message || 'Failed to create user';
            dispatch(
                addToast({ text: msg, type: toastType.ERROR })
            );
        });
};

export const editUser = (userId, users, navigate) => async (dispatch) => {
    dispatch(setSavingButton(true));
    apiConfig
        .post(apiBaseURL.USERS + "/" + userId, users)
        .then((response) => {
            invalidateCacheByPrefix("users");
            dispatch({
                type: userActionType.EDIT_USER,
                payload: response?.data?.data,
            });
            dispatch(
                addToast({
                    text: getFormattedMessage("user.success.edit.message"),
                })
            );
            navigate("/app/users");
            dispatch(setSavingButton(false));
        })
        .catch((error) => {
            dispatch(setSavingButton(false));
            const msg = error?.response?.data?.message || 'Failed to edit user';
            dispatch(
                addToast({ text: msg, type: toastType.ERROR })
            );
        });
};

export const deleteUser = (userId) => async (dispatch) => {
    apiConfig
        .delete(apiBaseURL.USERS + "/" + userId)
        .then((response) => {
            invalidateCacheByPrefix("users");
            dispatch(removeFromTotalRecord(1));
            dispatch({ type: userActionType.DELETE_USER, payload: userId });
            dispatch(
                addToast({
                    text: getFormattedMessage("user.success.delete.message"),
                })
            );
        })
        .catch((error) => {
            const msg = error?.response?.data?.message || 'Failed to delete user';
            dispatch(
                addToast({ text: msg, type: toastType.ERROR })
            );
        });
};
