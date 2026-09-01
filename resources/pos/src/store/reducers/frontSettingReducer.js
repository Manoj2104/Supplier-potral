import {frontSettingActionType} from '../../constants';

const getInitialFrontSetting = () => {
    try {
        const cached = localStorage.getItem('infypos_front_setting');
        if (cached) return JSON.parse(cached);
    } catch (e) {}
    return {};
};

export default (state = getInitialFrontSetting(), action) => {
    switch (action.type) {
        case frontSettingActionType.FETCH_FRONT_SETTING:
            return action.payload;
        default:
            return state;
    }
};
