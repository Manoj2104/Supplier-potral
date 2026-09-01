import {baseUnitsActionType, unitsActionType} from '../../constants';

export default (state = null, action) => {
    switch (action.type) {
        case baseUnitsActionType.FETCH_UNITS:
            return action.payload;
        case baseUnitsActionType.FETCH_UNIT:
            return [action.payload];
        case baseUnitsActionType.ADD_UNIT:
            return [...(state || []), action.payload];
        case baseUnitsActionType.EDIT_UNIT:
            return (state || []).map(item => String(item.id) === String(action.payload.id) ? action.payload : item);
        case baseUnitsActionType.DELETE_UNIT:
            return (state || []).filter(item => String(item.id) !== String(action.payload));
        default:
            return state;
    }
};
