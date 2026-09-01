const getBaseUrl = () => {
    let path = window.location.pathname;
    if (path.endsWith('/')) {
        path = path.slice(0, -1);
    }
    return window.location.origin + path;
};

export const environment = {
    URL: getBaseUrl(),
};

