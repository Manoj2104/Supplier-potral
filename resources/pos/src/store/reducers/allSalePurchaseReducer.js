import {dashboardActionType} from "../../constants";
import {getCached} from "../apiCache";

const getInitialState = () => getCached("dashboard:all_sale_purchase") || {};

export default (state = getInitialState(), action) => {
    switch (action.type) {
        case dashboardActionType.FETCH_ALL_SALE_PURCHASE:
            return action.payload;
        default:
            return state;
    }
};
