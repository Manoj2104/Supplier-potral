import apiConfig from '../../config/apiConfig';
import { apiBaseURL, toastType, recentSaleActionType } from '../../constants';
import { addToast } from './toastAction';
import { getCached, setCache } from "../apiCache";

export const recentSales = () => async (dispatch) => {
    const cacheKey = "dashboard:recent_sales";
    const cached = getCached(cacheKey);

    if (cached) {
        dispatch({ type: recentSaleActionType.RECENT_SALES, payload: cached });
        // Silently revalidate in background
        apiConfig.get(apiBaseURL.RECENT_SALES).then((response) => {
            setCache(cacheKey, response.data.data);
            dispatch({ type: recentSaleActionType.RECENT_SALES, payload: response.data.data });
        }).catch(() => {});
        return;
    }

    apiConfig.get(apiBaseURL.RECENT_SALES)
        .then((response) => {
            setCache(cacheKey, response.data.data);
            dispatch({ type: recentSaleActionType.RECENT_SALES, payload: response.data.data });
        })
        .catch(({ response }) => {
            dispatch(addToast({ text: response?.data?.message, type: toastType.ERROR }));
        });
};
