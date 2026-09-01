import {unitsActionType} from '../../constants';

export default (state = null, action) => {
    switch (action.type) {
        case unitsActionType.FETCH_UNITS:
            return action.payload;
        case unitsActionType.FETCH_UNIT:
            return [action.payload];
        case unitsActionType.ADD_UNIT:
            return [...(state || []), action.payload];
        case unitsActionType.EDIT_UNIT:
            return (state || []).map(item => String(item.id) === String(action.payload.id) ? action.payload : item);
        case unitsActionType.DELETE_UNIT:
            return (state || []).filter(item => String(item.id) !== String(action.payload));
        default:
            return state;
    }
};
