import {configActionType} from '../../constants';

const getInitialAllConfig = () => {
    try {
        const cached = localStorage.getItem('infypos_all_config');
        if (cached) return JSON.parse(cached);
    } catch (e) {}
    return {};
};

export default (state = getInitialAllConfig(), action) => {
    switch (action.type) {
        case configActionType.FETCH_ALL_CONFIG:
            return action.payload;
        default:
            return state;
    }
};
