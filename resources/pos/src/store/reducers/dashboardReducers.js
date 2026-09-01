import {todaySalePurchaseCountActionType} from "../../constants";
import {getCached} from "../apiCache";

const getInitialState = () => getCached("dashboard:today_sale_count") || {};

export default (state = getInitialState(), action) => {
    switch (action.type) {
        case todaySalePurchaseCountActionType.TODAY_SALE_COUNT:
            return action.payload;
        case todaySalePurchaseCountActionType.RECENT_SALES:
            return action.payload;
        default:
            return state;
    }
};
