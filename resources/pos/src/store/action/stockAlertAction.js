import apiConfig from '../../config/apiConfig';
import { apiBaseURL, toastType, topCustomersActionType } from '../../constants';
import { addToast } from './toastAction';
import { getCached, setCache } from "../apiCache";

export const fetchStockAlert = () => async (dispatch) => {
    const cacheKey = "dashboard:stock_alerts";
    const cached = getCached(cacheKey);

    if (cached) {
        dispatch({ type: topCustomersActionType.FETCH_STOCK_ALERT, payload: cached });
        // Silently revalidate in background
        apiConfig.get(apiBaseURL.STOCK_ALERT).then((response) => {
            setCache(cacheKey, response.data.data);
            dispatch({ type: topCustomersActionType.FETCH_STOCK_ALERT, payload: response.data.data });
        }).catch(() => {});
        return;
    }

    apiConfig.get(apiBaseURL.STOCK_ALERT)
        .then((response) => {
            setCache(cacheKey, response.data.data);
            dispatch({ type: topCustomersActionType.FETCH_STOCK_ALERT, payload: response.data.data });
        })
        .catch(({ response }) => {
            dispatch(addToast({ text: response?.data?.message, type: toastType.ERROR }));
        });
};
