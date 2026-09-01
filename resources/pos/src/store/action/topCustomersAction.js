import apiConfig from '../../config/apiConfig';
import { apiBaseURL, toastType, topCustomersActionType } from '../../constants';
import { addToast } from './toastAction';
import { getCached, setCache } from "../apiCache";

export const fetchTopCustomers = () => async (dispatch) => {
    const cacheKey = "dashboard:top_customers";
    const cached = getCached(cacheKey);

    if (cached) {
        dispatch({ type: topCustomersActionType.TOP_CUSTOMERS, payload: cached });
        // Silently revalidate in background
        apiConfig.get(apiBaseURL.TOP_CUSTOMERS).then((response) => {
            setCache(cacheKey, response.data.data);
            dispatch({ type: topCustomersActionType.TOP_CUSTOMERS, payload: response.data.data });
        }).catch(() => {});
        return;
    }

    apiConfig.get(apiBaseURL.TOP_CUSTOMERS)
        .then((response) => {
            setCache(cacheKey, response.data.data);
            dispatch({ type: topCustomersActionType.TOP_CUSTOMERS, payload: response.data.data });
        })
        .catch(({ response }) => {
            dispatch(addToast({ text: response?.data?.message, type: toastType.ERROR }));
        });
};
