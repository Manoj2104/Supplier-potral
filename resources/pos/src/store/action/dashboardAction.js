import apiConfig from '../../config/apiConfig';
import { apiBaseURL, toastType, todaySalePurchaseCountActionType } from '../../constants';
import { addToast } from './toastAction';
import { getCached, setCache } from '../apiCache';

export const todaySalePurchaseCount = () => async (dispatch) => {
    const cacheKey = "dashboard:today_sale_count";
    const cached = getCached(cacheKey);

    if (cached) {
        dispatch({ type: todaySalePurchaseCountActionType.TODAY_SALE_COUNT, payload: cached });
        apiConfig.get(apiBaseURL.TODAY_SALE_COUNT).then((response) => {
            setCache(cacheKey, response.data.data);
            dispatch({ type: todaySalePurchaseCountActionType.TODAY_SALE_COUNT, payload: response.data.data });
        }).catch(() => {});
        return;
    }

    apiConfig.get(apiBaseURL.TODAY_SALE_COUNT)
        .then((response) => {
            setCache(cacheKey, response.data.data);
            dispatch({ type: todaySalePurchaseCountActionType.TODAY_SALE_COUNT, payload: response.data.data });
        })
        .catch(({ response }) => {
            dispatch(addToast({ text: response?.data?.message, type: toastType.ERROR }));
        });
};


