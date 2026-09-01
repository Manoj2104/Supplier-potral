import { apiBaseURL, configActionType, toastType } from '../../constants';
import apiConfig from '../../config/apiConfig';
import { addToast } from './toastAction';

export const fetchConfig = (navigate) => async (dispatch) => {
    apiConfig.get(apiBaseURL.CONFIG)
        .then((response) => {
            const permissions = response.data?.data?.permissions;
            if (permissions) {
                try {
                    localStorage.setItem('infypos_permissions', JSON.stringify(permissions));
                } catch (e) {}
            }
            if (response.data?.data) {
                try {
                    localStorage.setItem('infypos_all_config', JSON.stringify(response.data.data));
                } catch (e) {}
            }
            dispatch({ type: configActionType.FETCH_CONFIG, payload: permissions });
            dispatch({ type: configActionType.FETCH_ALL_CONFIG, payload: response.data.data });
            navigate && navigate("/app/pos")
        })
        .catch((response) => {
            dispatch(addToast(
                { text: response.response?.data?.message, type: toastType.ERROR }));
        });
};
