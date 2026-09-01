import {recentSaleActionType} from "../../constants";
import {getCached} from "../apiCache";

const getInitialState = () => getCached("dashboard:recent_sales") || [];

export default (state = getInitialState(), action) => {
    switch (action.type) {
        case recentSaleActionType.RECENT_SALES:
            return action.payload;
        default:
            return state;
    }
};
