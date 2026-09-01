import apiConfig from '../../config/apiConfig';
import { apiBaseURL, frontSettingActionType, toastType } from '../../constants';
import { addToast } from './toastAction';

export const fetchFrontSetting = () => async ( dispatch ) => {
    apiConfig.get( apiBaseURL.FRONT_SETTING )
        .then( ( response ) => {
            if (response.data?.data) {
                try {
                    localStorage.setItem('infypos_front_setting', JSON.stringify(response.data.data));
                } catch(e) {}
            }
            dispatch( { type: frontSettingActionType.FETCH_FRONT_SETTING, payload: response.data.data } );
        } )
        .catch( ( { response } ) => {
            dispatch( addToast(
                { text: response?.data?.message, type: toastType.ERROR } ) );
        } );
}
