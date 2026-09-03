/**
 * Instant 0ms Product SVG Generator & Image Fallback Utility
 * Produces crisp, beautiful high-res inline SVGs in 0.00ms with zero network requests.
 */

export const generateInstantProductSvg = (name = "Product", category = "") => {
    const cleanName = (name || "Product").trim();
    const words = cleanName.split(/\s+/).filter(Boolean);
    const initials = words.length > 1 
        ? (words[0][0] + words[1][0]).toUpperCase() 
        : cleanName.slice(0, 2).toUpperCase();
        
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" fill="none">
        <defs>
            <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#F1F5F9"/>
                <stop offset="100%" stop-color="#E2E8F0"/>
            </linearGradient>
            <linearGradient id="boxTop" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#DEB887"/>
                <stop offset="100%" stop-color="#CD853F"/>
            </linearGradient>
            <linearGradient id="boxLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#C68A4C"/>
                <stop offset="100%" stop-color="#A76D36"/>
            </linearGradient>
            <linearGradient id="boxRight" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#B27435"/>
                <stop offset="100%" stop-color="#8C5320"/>
            </linearGradient>
            <linearGradient id="tapeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#99602E"/>
                <stop offset="100%" stop-color="#7B471C"/>
            </linearGradient>
            <filter id="boxShadow" x="-10%" y="-10%" width="120%" height="130%">
                <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#0F172A" flood-opacity="0.12"/>
            </filter>
        </defs>

        <!-- Base Rounded Card Container -->
        <rect width="96" height="96" rx="20" fill="url(#bgGrad)"/>
        <rect width="94" height="94" x="1" y="1" rx="19" stroke="#CBD5E1" stroke-width="1.2"/>

        <!-- 3D Isometric Cardboard Box with Drop Shadow -->
        <g filter="url(#boxShadow)">
            <!-- Top Diamond Face -->
            <polygon points="48,15 68,26 48,37 28,26" fill="url(#boxTop)"/>
            <!-- Top Tape Strip -->
            <polygon points="43,18 53,23.5 53,28.5 43,23" fill="url(#tapeGrad)"/>

            <!-- Left Face -->
            <polygon points="28,26 48,37 48,60 28,49" fill="url(#boxLeft)"/>
            <!-- Left Label -->
            <polygon points="34,38 42,42.5 42,47 34,42.5" fill="#E2E8F0" fill-opacity="0.85"/>

            <!-- Right Face -->
            <polygon points="48,37 68,26 68,49 48,60" fill="url(#boxRight)"/>
            <!-- Right Tape Strip -->
            <polygon points="48,37 53,34.5 53,57.5 48,60" fill="url(#tapeGrad)" fill-opacity="0.9"/>
        </g>

        <!-- Product Initials Tag -->
        <rect x="24" y="70" width="48" height="18" rx="6" fill="#334155" fill-opacity="0.08"/>
        <text x="48" y="83" dominant-baseline="central" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="900" fill="#334155" letter-spacing="1">${initials}</text>
    </svg>`;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
};

export const getInstantProductImage = (images, productName = "", categoryName = "") => {
    if (images) {
        if (typeof images === "string" && images.trim().length > 0 && !images.includes("brand_logo.png")) {
            return images.replace(/\\/g, '/');
        }
        if (typeof images === "object") {
            if (images.image_url && typeof images.image_url === "string" && !images.image_url.includes("brand_logo.png")) {
                return images.image_url.replace(/\\/g, '/');
            }
            if (images.url && typeof images.url === "string" && !images.url.includes("brand_logo.png")) {
                return images.url.replace(/\\/g, '/');
            }
            let urls = [];
            if (images.imageUrls) {
                urls = Array.isArray(images.imageUrls) ? images.imageUrls : Object.values(images.imageUrls || {});
            } else if (Array.isArray(images)) {
                urls = images;
            }
            const validUrls = urls
                .map(u => (typeof u === "string" ? u : (u?.url || u?.image_url || "")))
                .filter(u => typeof u === "string" && u.trim().length > 0 && !u.includes("brand_logo.png"));
            if (validUrls.length > 0) return validUrls[0].replace(/\\/g, '/');
        }
    }

    return generateInstantProductSvg(productName, categoryName);
};

export const getInstantProductSvgUrl = generateInstantProductSvg;

export default getInstantProductImage;
