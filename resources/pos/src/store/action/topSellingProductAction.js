import apiConfig from '../../config/apiConfig';
import { apiBaseURL, toastType, topSellingActionType } from '../../constants';
import { addToast } from './toastAction';
import { getCached, setCache } from "../apiCache";

export const topSellingProduct = () => async (dispatch) => {
    const cacheKey = "dashboard:top_selling";
    const cached = getCached(cacheKey);

    if (cached) {
        dispatch({ type: topSellingActionType.TOP_SELLING, payload: cached });
        // Silently revalidate in background
        apiConfig.get(apiBaseURL.TOP_SELLING_PRODUCTS).then((response) => {
            setCache(cacheKey, response.data.data);
            dispatch({ type: topSellingActionType.TOP_SELLING, payload: response.data.data });
        }).catch(() => {});
        return;
    }

    apiConfig.get(apiBaseURL.TOP_SELLING_PRODUCTS)
        .then((response) => {
            setCache(cacheKey, response.data.data);
            dispatch({ type: topSellingActionType.TOP_SELLING, payload: response.data.data });
        })
        .catch(({ response }) => {
            dispatch(addToast({ text: response?.data?.message, type: toastType.ERROR }));
        });
};
