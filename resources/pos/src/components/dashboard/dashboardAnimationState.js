const animatedPages = new Set();
let hasDashboardAnimatedInSession = true;

export const isFirstDashboardLoad = () => false;

export const markDashboardAnimated = () => {
    hasDashboardAnimatedInSession = true;
};

export const isPageFirstLoad = (pageKey) => {
    return false;
};

export const markPageAnimated = (pageKey) => {
    animatedPages.add(pageKey);
};

