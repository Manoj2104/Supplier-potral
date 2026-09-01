import { setLoading } from './loadingAction';
import apiConfig from '../../config/apiConfig';
import { apiBaseURL, toastType } from '../../constants';
import { addToast } from './toastAction';

export const purchasePdfAction = (purchaseId, isLoading = true) => async (dispatch) => {
    if (!purchaseId || purchaseId === 'undefined') {
        dispatch(addToast({ text: "Invalid Purchase Order ID.", type: toastType.ERROR }));
        return;
    }
    if (isLoading) {
        dispatch(setLoading(true));
    }
    apiConfig.get(apiBaseURL.PURCHASE_PDF + '/' + purchaseId)
        .then((response) => {
            if (response.data && response.data.data && response.data.data.purchase_pdf_url) {
                window.open(response.data.data.purchase_pdf_url, '_blank');
            }
            if (isLoading) {
                dispatch(setLoading(false));
            }
        })
        .catch(({ response }) => {
            if (isLoading) {
                dispatch(setLoading(false));
            }
            dispatch(addToast({ text: response?.data?.message || "Failed to download PDF.", type: toastType.ERROR }));
        });
};
