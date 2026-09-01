import { purchaseActionType } from '../../constants';

export default (state = [], action) => {
    switch (action.type) {
        case purchaseActionType.FETCH_PURCHASES:
            return action.payload;
        case purchaseActionType.FETCH_PURCHASE:
            return action.payload;
        case purchaseActionType.ADD_PURCHASE:
            if (Array.isArray(state)) {
                // Ensure no duplicate ID
                const filtered = state.filter(item => String(item.id) !== String(action.payload.id));
                return [action.payload, ...filtered];
            }
            if (state && Array.isArray(state.data)) {
                const filtered = state.data.filter(item => String(item.id) !== String(action.payload.id));
                return {
                    ...state,
                    data: [action.payload, ...filtered]
                };
            }
            return [action.payload];
        case purchaseActionType.EDIT_PURCHASE:
            if (Array.isArray(state)) {
                return state.map(item => String(item.id) === String(action.payload.id) ? action.payload : item);
            }
            if (state && Array.isArray(state.data)) {
                return {
                    ...state,
                    data: state.data.map(item => String(item.id) === String(action.payload.id) ? action.payload : item)
                };
            }
            return state;
        case purchaseActionType.DELETE_PURCHASE:
            if (Array.isArray(state)) {
                return state.filter(item => String(item.id) !== String(action.payload));
            }
            if (state && Array.isArray(state.data)) {
                return {
                    ...state,
                    data: state.data.filter(item => String(item.id) !== String(action.payload))
                };
            }
            return state;
        default:
            return state;
    }
};
