import {configActionType} from '../../constants';

const getInitialPermissions = () => {
    try {
        const cached = localStorage.getItem('infypos_permissions');
        if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch (e) {}
    return [];
};

export default (state = getInitialPermissions(), action) => {
    switch (action.type) {
        case configActionType.FETCH_CONFIG:
            return action.payload;
        default:
            return state;
    }
};
