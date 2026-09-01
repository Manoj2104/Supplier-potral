import React from 'react';
import {toastType} from '../../constants';
import toastConfig from '../../config/toastConfig';
import {toast} from 'react-toastify';
import ToastCard from '../../shared/toast/ToastCard';

const notify = (options, toastsConfig) => {
    toastsConfig.config.toastId = toastsConfig.id;
    toast(<ToastCard {...options}/>, toastsConfig.config);
};

export const addToast = (options = {}) => {
    const rawText = options.text || options.message || '';
    const text = typeof rawText === 'string' ? rawText.trim() : (rawText ? String(rawText) : '');

    // Never display empty, blank, or generic undefined error toasts
    if (!text || text === '' || text === 'undefined' || text === 'null' || text === 'Error' || text === '[object Object]') {
        return { type: 'SUPPRESS_TOAST', payload: {} };
    }

    const isLoginScreen = typeof window !== 'undefined' && (
        window.location.hash.includes('login') ||
        window.location.pathname.includes('login')
    );

    // Suppress background errors, licensing locks, network aborts, or token expiry alerts from spamming the UI
    const lowerText = text.toLowerCase();
    if (
        lowerText.includes('no active license token') ||
        lowerText.includes('license_unauthorized') ||
        lowerText.includes('license locked') ||
        lowerText.includes('no application encryption key') ||
        lowerText.includes('token not provided') ||
        lowerText.includes('unauthenticated') ||
        lowerText.includes('token_not_provided') ||
        lowerText.includes('canceled') ||
        lowerText.includes('aborted') ||
        (isLoginScreen && options.type === toastType.ERROR && !options.isLoginAttempt && !lowerText.includes('password') && !lowerText.includes('credential') && !lowerText.includes('email') && !lowerText.includes('match'))
    ) {
        return { type: 'SUPPRESS_TOAST', payload: {} };
    }

    const toastsConfig = toastConfig({ ...options, text });
    notify({ ...options, text }, toastsConfig);
    return { type: toastType.ADD_TOAST, payload: toastsConfig };
};

export const removeToast = (id) => {
    return { type: toastType.REMOVE_TOAST, payload: id };
};

export const displayMessage = (message, success) => async (dispatch) => {
    if (!message) return;
    success === 1 ? dispatch(addToast({text: message})) : dispatch(addToast({text: message, type: toastType.ERROR}));
};
