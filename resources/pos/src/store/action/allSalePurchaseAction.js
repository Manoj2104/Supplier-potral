import apiConfig from "../../config/apiConfig";
import { apiBaseURL, dashboardActionType, toastType } from "../../constants";
import { addToast } from "./toastAction";
import { getCached, setCache } from "../apiCache";

export const fetchAllSalePurchaseCount = () => async (dispatch) => {
    const cacheKey = "dashboard:all_sale_purchase";
    const cached = getCached(cacheKey);

    if (cached) {
        dispatch({
            type: dashboardActionType.FETCH_ALL_SALE_PURCHASE,
            payload: cached,
        });
        apiConfig.get(apiBaseURL.ALL_SALE_PURCHASE).then((response) => {
            setCache(cacheKey, response.data.data);
            dispatch({
                type: dashboardActionType.FETCH_ALL_SALE_PURCHASE,
                payload: response.data.data,
            });
        }).catch(() => {});
        return;
    }

    apiConfig
        .get(apiBaseURL.ALL_SALE_PURCHASE)
        .then((response) => {
            setCache(cacheKey, response.data.data);
            dispatch({
                type: dashboardActionType.FETCH_ALL_SALE_PURCHASE,
                payload: response.data.data,
            });
        })
        .catch((response) => {
            dispatch(
                addToast({
                    text: response?.response?.data?.message,
                    type: toastType.ERROR,
                })
            );
        });
};

