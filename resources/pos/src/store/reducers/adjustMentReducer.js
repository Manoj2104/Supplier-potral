import {adjustMentActionType} from '../../constants';

export default (state = [], action) => {
    switch (action.type) {
        case adjustMentActionType.FETCH_ADJUSTMENTS:
            return Array.isArray(action.payload) ? action.payload : [];
        case adjustMentActionType.FETCH_ADJUSTMENT:
            return action.payload;
        case adjustMentActionType.ADD_ADJUSTMENTS:
            return Array.isArray(state) ? [action.payload, ...state] : [action.payload];
        case adjustMentActionType.EDIT_ADJUSTMENTS:
            return Array.isArray(state) ? state.map(item => item.id === +action.payload.id ? action.payload : item) : [action.payload];
        case adjustMentActionType.DELETE_SALE:
            return Array.isArray(state) ? state.filter(item => item.id !== action.payload) : [];
        default:
            return Array.isArray(state) ? state : [];
    }
};