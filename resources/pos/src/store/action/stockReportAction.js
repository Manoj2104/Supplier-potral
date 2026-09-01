import { setLoading } from "./loadingAction";
import { apiBaseURL, stockReportActionType } from "../../constants";
import apiConfig from "../../config/apiConfig";
import { setTotalRecord } from "./totalRecordAction";
import requestParam from "../../shared/requestParam";

import { getCached, setCache, invalidateCacheByPrefix } from "../apiCache";

export const stockReportAction =
    (id, filter = {}, isLoading = true) =>
    async (dispatch) => {
        const stockReport = true;
        let url = apiBaseURL.STOCK_REPORT + "?warehouse_id=" + id;
        if (
            !_.isEmpty(filter) &&
            (filter.page ||
                filter.pageSize ||
                filter.search ||
                filter.order_By ||
                filter.created_at)
        ) {
            url += requestParam(filter, false, stockReport, null, url);
        }

        const cacheKey = `stock:${url}`;
        const cached = getCached(cacheKey);

        if (cached) {
            dispatch({
                type: stockReportActionType.STOCK_REPORT,
                payload: cached.data,
            });
            dispatch(setTotalRecord(cached.total));
            apiConfig.get(url).then((response) => {
                const total = response.data.meta?.total !== undefined && response.data.meta.total >= 0
                    ? response.data.meta.total
                    : response.data.data?.total || 0;
                setCache(cacheKey, { data: response.data.data, total });
                dispatch({
                    type: stockReportActionType.STOCK_REPORT,
                    payload: response.data.data,
                });
                dispatch(setTotalRecord(total));
            }).catch(() => {});
            return;
        }

        if (isLoading) {
            dispatch(setLoading(true));
        }
        await apiConfig
            .get(url)
            .then((response) => {
                const total = response.data.meta?.total !== undefined && response.data.meta.total >= 0
                    ? response.data.meta.total
                    : response.data.data?.total || 0;
                setCache(cacheKey, { data: response.data.data, total });
                dispatch({
                    type: stockReportActionType.STOCK_REPORT,
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
            });
    };
