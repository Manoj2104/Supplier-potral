import {topSellingActionType} from '../../constants';
import {getCached} from "../apiCache";

const getInitialState = () => getCached("dashboard:top_selling") || [];

export default (state = getInitialState(), action) => {
    switch (action.type) {
        case topSellingActionType.TOP_SELLING:
            return action.payload;
        default:
            return state;
    }
};
