import apiConfig from "../../config/apiConfig";
import {
    apiBaseURL,
    profitAndLossReportActionType,
    toastType,
} from "../../constants";
import requestParam from "../../shared/requestParam";
import { addToast } from "./toastAction";
import { setLoading } from "./loadingAction";
import { setTotalRecord } from "./totalRecordAction";

import { getCached, setCache, invalidateCacheByPrefix } from "../apiCache";

export const fetchProfitAndLossReports =
    (filter = {}, isLoading = true) =>
    async (dispatch) => {
        let url = apiBaseURL.PROFIT_AND_LOSS_REPORT;
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

        const cacheKey = `reports:${url}`;
        const cached = getCached(cacheKey);

        if (cached) {
            dispatch({
                type: profitAndLossReportActionType.FETCH_PROFIT_AND_LOSS,
                payload: cached,
            });
            apiConfig.get(url).then((response) => {
                setCache(cacheKey, response.data.data);
                dispatch({
                    type: profitAndLossReportActionType.FETCH_PROFIT_AND_LOSS,
                    payload: response.data.data,
                });
            }).catch(() => {});
            return;
        }

        if (isLoading) {
            dispatch(setLoading(true));
        }
        apiConfig
            .get(url)
            .then((response) => {
                setCache(cacheKey, response.data.data);
                dispatch({
                    type: profitAndLossReportActionType.FETCH_PROFIT_AND_LOSS,
                    payload: response.data.data,
                });
                if (isLoading) {
                    dispatch(setLoading(false));
                }
            })
            .catch(({ response }) => {
                dispatch(
                    addToast({
                        text: response?.data?.message,
                        type: toastType.ERROR,
                    })
                );
                if (isLoading) {
                    dispatch(setLoading(false));
                }
            });
    };
