<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>INFY-POS Enterprise</title>
        <link rel="icon" type="image/x-icon" href="/favicon.ico">
        <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico">
        <!-- Fonts (Non-blocking asynchronous load) -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&display=swap" media="print" onload="this.media='all'"/>
        <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&display=swap"/></noscript>
        <script>
            (function() {
                var p = window.location.pathname.toLowerCase();
                if (p.indexOf('/pda') === 0) return; // Allow PDA
                var ua = navigator.userAgent || '';
                var isMob = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
                if (isMob) {
                    document.documentElement.classList.add('mobile-blocked-screen');
                }
            })();
        </script>
        <style>
            /* ── Rigid Desktop Layout Anchor & Zero Horizontal Drift / Drag ── */
            *, *::before, *::after {
                box-sizing: border-box !important;
            }

            html, body {
                width: 100vw !important;
                max-width: 100vw !important;
                height: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow-x: hidden !important;
                overscroll-behavior-x: none !important;
                overscroll-behavior-y: auto !important;
                touch-action: pan-y !important;
                -webkit-user-drag: none;
                position: relative !important;
            }

            #root,
            .d-flex.flex-column.flex-root,
            .d-flex.flex-row.flex-column-fluid.page,
            .d-flex.flex-row.flex-column-fluid {
                width: 100vw !important;
                max-width: 100vw !important;
                overflow-x: hidden !important;
                position: relative !important;
            }

            /* Main Content Container: strictly 100vw minus sidebar width (265px) */
            .d-flex.flex-column.flex-row-fluid {
                width: calc(100vw - 265px) !important;
                max-width: calc(100vw - 265px) !important;
                min-width: 0 !important;
                overflow-x: hidden !important;
                box-sizing: border-box !important;
            }

            /* When sidebar is collapsed (70px) */
            .esb-sidebar.collapsed ~ .d-flex.flex-column.flex-row-fluid {
                width: calc(100vw - 70px) !important;
                max-width: calc(100vw - 70px) !important;
            }

            /* ── Header & Navbar Permanently Fixed to Viewport ── */
            .esb-header,
            header, 
            .header, 
            .top-header, 
            .navbar, 
            .header-navbar, 
            .main-header, 
            #kt_header,
            .header.align-items-stretch {
                height: 64px !important;
                min-height: 64px !important;
                max-height: 64px !important;
                background-color: #FFFFFF !important;
                border-bottom: 1px solid #E2E8F0 !important;
                box-sizing: border-box !important;
                margin: 0 !important;
                padding-top: 0 !important;
                padding-bottom: 0 !important;
                display: flex !important;
                align-items: center !important;
            }

            /* Scoped Admin Top Header (when sidebar is active) */
            .d-flex.flex-row.flex-column-fluid > .d-flex.flex-column.flex-row-fluid > div:first-child header,
            .d-flex.flex-row.flex-column-fluid > .d-flex.flex-column.flex-row-fluid > div:first-child .header,
            #kt_header {
                position: fixed !important;
                top: 0 !important;
                left: 265px !important;
                right: 0 !important;
                width: calc(100vw - 265px) !important;
                max-width: calc(100vw - 265px) !important;
                height: 64px !important;
                z-index: 1040 !important;
                background-color: #FFFFFF !important;
                box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03) !important;
                border-bottom: 1px solid #E2E8F0 !important;
                box-sizing: border-box !important;
            }

            .esb-sidebar.collapsed ~ .d-flex.flex-column.flex-row-fluid header,
            .esb-sidebar.collapsed ~ .d-flex.flex-column.flex-row-fluid .header {
                left: 70px !important;
                width: calc(100vw - 70px) !important;
                max-width: calc(100vw - 70px) !important;
            }

            /* Push Admin Page Content below the Fixed 64px Header */
            .d-flex.flex-row.flex-column-fluid .content,
            .d-flex.flex-row.flex-column-fluid .main-content {
                padding-top: 74px !important;
            }

            /* ── POS SCREEN FULL-WIDTH EXCEPTION (Zero Offset, Full Width) ── */
            .pos-enterprise-wrapper,
            .pos-enterprise-wrapper * {
                box-sizing: border-box !important;
            }

            .pos-enterprise-wrapper header,
            .pos-enterprise-wrapper .pos-top-nav,
            .pos-top-nav {
                position: relative !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                width: 100vw !important;
                max-width: 100vw !important;
                height: 56px !important;
                margin: 0 !important;
                padding: 0 16px !important;
                display: flex !important;
                align-items: center !important;
                background: #FFFFFF !important;
                border-bottom: 1px solid #E2E8F0 !important;
                z-index: 10000 !important;
            }

            .pos-enterprise-wrapper .content,
            .pos-enterprise-wrapper .main-content {
                padding-top: 0 !important;
                margin: 0 !important;
            }

            /* Left Sidebar Fixed */
            #kt_aside,
            .aside,
            .sidebar,
            .enterprise-sidebar,
            .esb-sidebar {
                position: fixed !important;
                top: 0 !important;
                bottom: 0 !important;
                left: 0 !important;
                z-index: 1050 !important;
                height: 100vh !important;
                overflow-y: auto !important;
                overflow-x: hidden !important;
                border-right: 1px solid #E2E8F0 !important;
            }

            /* Container padding */
            .container-fluid {
                width: 100% !important;
                max-width: 100% !important;
                box-sizing: border-box !important;
            }

            /* Hide Any Blocking Loading Modal Overlay */
            .premium-loader-overlay,
            #global-premium-loader,
            .premium-loader-card,
            .loader-overlay,
            .loading-modal {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                pointer-events: none !important;
                z-index: -9999 !important;
            }

            /* ── Product Skeleton Shimmer Animations ── */
            @keyframes prodShimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }

            .prod-skeleton-shimmer {
                background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 37%, #F1F5F9 63%) !important;
                background-size: 400% 100% !important;
                animation: prodShimmer 1.4s ease infinite !important;
                display: inline-block;
            }

            .prod-skeleton-shimmer-dark {
                background: linear-gradient(90deg, rgba(255, 255, 255, 0.18) 25%, rgba(255, 255, 255, 0.35) 37%, rgba(255, 255, 255, 0.18) 63%) !important;
                background-size: 400% 100% !important;
                animation: prodShimmer 1.4s ease infinite !important;
                display: inline-block;
            }
        </style>
    </head>
    <body class="antialiased">
    <div id="root"></div>
    </body>
<script type="text/javascript" src="{{ mix('js/app.js') }}"></script>
</html>
