import {Tokens, errorMessage} from '../constants';
import {environment} from './environment'

export default {
    setupInterceptors: (axios, skipAuthToken = false, isFormData = false) => {
        axios.interceptors.request.use((config) => {
                if (skipAuthToken) {
                    return config;
                }
                let token = localStorage.getItem(Tokens.ADMIN);
                if (token) {
                    config.headers['Authorization'] = `Bearer ${token}`;
                }
                let isSuperAdminUrl = window.location.href.toLowerCase().includes('super-admin') 
                    || window.location.href.toLowerCase().includes('super%20admin') 
                    || window.location.href.toLowerCase().includes('super admin') 
                    || window.location.href.toLowerCase().includes('super_admin');

                if (!token) {
                    if (!window.location.href.includes('login') && !window.location.href.includes('reset-password') && !window.location.href.includes('forgot-password') && !isSuperAdminUrl) {
                        window.location.href = environment.URL + '#/' + 'login';
                    }
                }
                if (isFormData) {
                    config.headers['Content-Type'] = 'multipart/form-data';
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );
        axios.interceptors.response.use(
            response => successHandler(response),
            error => errorHandler(error)
        );
        const errorHandler = (error) => {
            const errorData = error.response ? error.response.data : '';
            const errorStr = typeof errorData === 'string' ? errorData : JSON.stringify(errorData || {});

            let isSuperAdminUrl = window.location.href.toLowerCase().includes('super-admin') 
                || window.location.href.toLowerCase().includes('super%20admin') 
                || window.location.href.toLowerCase().includes('super admin') 
                || window.location.href.toLowerCase().includes('super_admin');

            if (
                !isSuperAdminUrl &&
                (
                    errorStr.includes('Unknown database') ||
                    errorStr.includes('Database not installed')
                )
            ) {
                window.location.href = '/install';
                return Promise.reject(error);
            }
            if (error.response.status === 401
                || error.response.data.message === errorMessage.TOKEN_NOT_PROVIDED
                || error.response.data.message === errorMessage.TOKEN_INVALID
                || error.response.data.message === errorMessage.TOKEN_INVALID_SIGNATURE
                || error.response.data.message === errorMessage.TOKEN_EXPIRED) {
                localStorage.removeItem(Tokens.ADMIN);
                localStorage.removeItem(Tokens.USER);
                localStorage.removeItem(Tokens.GET_PERMISSIONS);
            }else if(error.response.status === 403 || error.response.status === 404) {
                const currentHash = window.location.hash || '';
                const isSubscriptionPage = currentHash.includes('subscription') || window.location.href.includes('subscription');
                if (!isSubscriptionPage && !errorStr.includes('LICENSE_UNAUTHORIZED')) {
                    window.location.href = environment.URL + '#' + '/app/dashboard';
                }
                return Promise.reject({...error});
            }else {
                return Promise.reject({...error})
            }
        };
        const successHandler = (response) => {
            if (response && response.config && response.config.method === 'get' && response.data) {
                try {
                    const cacheKey = 'infy_get_cache_' + response.config.url;
                    localStorage.setItem(cacheKey, JSON.stringify(response.data));
                } catch(e) {}
            }
            return response;
        };
    }
};
