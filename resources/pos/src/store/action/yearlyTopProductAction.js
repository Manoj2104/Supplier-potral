import apiConfig from '../../config/apiConfig';
import { apiBaseURL, toastType, yearTopProductActionType } from '../../constants';
import { addToast } from './toastAction';
import { getCached, setCache } from "../apiCache";

export const yearlyTopProduct = () => async (dispatch) => {
    const cacheKey = "dashboard:yearly_top_selling";
    const cached = getCached(cacheKey);

    if (cached) {
        dispatch({ type: yearTopProductActionType.YEAR_TOP_PRODUCT, payload: cached });
        // Silently revalidate in background
        apiConfig.get(apiBaseURL.YEAR_TOP_PRODUCT).then((response) => {
            setCache(cacheKey, response.data.data);
            dispatch({ type: yearTopProductActionType.YEAR_TOP_PRODUCT, payload: response.data.data });
        }).catch(() => {});
        return;
    }

    apiConfig.get(apiBaseURL.YEAR_TOP_PRODUCT)
        .then((response) => {
            setCache(cacheKey, response.data.data);
            dispatch({ type: yearTopProductActionType.YEAR_TOP_PRODUCT, payload: response.data.data });
        })
        .catch(({ response }) => {
            dispatch(addToast({ text: response?.data?.message, type: toastType.ERROR }));
        });
};
