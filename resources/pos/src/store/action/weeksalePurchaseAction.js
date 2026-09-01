import apiConfig from '../../config/apiConfig';
import { apiBaseURL, toastType, weekSalePurchasesActionType } from '../../constants';
import { addToast } from './toastAction';
import { getCached, setCache } from "../apiCache";

export const weekSalePurchases = () => async (dispatch) => {
    const cacheKey = "dashboard:week_sales";
    const cached = getCached(cacheKey);

    if (cached) {
        dispatch({ type: weekSalePurchasesActionType.WEEK_SALE_PURCHASES, payload: cached });
        // Silently revalidate in background
        apiConfig.get(apiBaseURL.WEEK_SALE_PURCHASES_API).then((response) => {
            setCache(cacheKey, response.data.data);
            dispatch({ type: weekSalePurchasesActionType.WEEK_SALE_PURCHASES, payload: response.data.data });
        }).catch(() => {});
        return;
    }

    apiConfig.get(apiBaseURL.WEEK_SALE_PURCHASES_API)
        .then((response) => {
            setCache(cacheKey, response.data.data);
            dispatch({ type: weekSalePurchasesActionType.WEEK_SALE_PURCHASES, payload: response.data.data });
        })
        .catch(({ response }) => {
            dispatch(addToast({ text: response?.data?.message, type: toastType.ERROR }));
        });
};
