<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>INFY-POS Enterprise</title>
        <link rel="icon" type="image/x-icon" href="/favicon.ico">
        <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico">
        <!-- Preload Empty State Mascot & Package for 0ms instant display -->
        <link rel="preload" as="image" href="/images/pos_empty_manager.webp" type="image/webp" fetchpriority="high">
        <link rel="preload" as="image" href="/images/pos_empty_package.webp" type="image/webp" fetchpriority="high">
        <link rel="preload" href="{{ mix('js/app.js') }}" as="script" fetchpriority="high">
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
            .esb-sidebar.collapsed ~ .d-flex.flex-column.flex-row-fluid,
            .sa-sidebar.collapsed ~ .d-flex.flex-column.flex-row-fluid,
            .sa-root.sidebar-collapsed .d-flex.flex-column.flex-row-fluid,
            .sa-root.sidebar-collapsed .sa-main-content {
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
            .esb-sidebar.collapsed ~ .d-flex.flex-column.flex-row-fluid .header,
            .sa-sidebar.collapsed ~ .d-flex.flex-column.flex-row-fluid header,
            .sa-root.sidebar-collapsed .sa-top-header {
                left: 70px !important;
                width: calc(100vw - 70px) !important;
                max-width: calc(100vw - 70px) !important;
            }

            @media (max-width: 991px) {
                .d-flex.flex-row.flex-column-fluid > .d-flex.flex-column.flex-row-fluid > div:first-child header,
                .d-flex.flex-row.flex-column-fluid > .d-flex.flex-column.flex-row-fluid > div:first-child .header,
                #kt_header {
                    left: 0 !important;
                    width: 100vw !important;
                    max-width: 100vw !important;
                }

                .d-flex.flex-row.flex-column-fluid > .d-flex.flex-column.flex-row-fluid {
                    margin-left: 0 !important;
                    width: 100vw !important;
                    max-width: 100vw !important;
                }
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

            .btn-restart-update-pill {
                background: #0080FF !important;
                color: #FFFFFF !important;
                border: none !important;
                border-radius: 9999px !important;
                padding: 6px 18px !important;
                font-size: 12.5px !important;
                font-weight: 700 !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
                cursor: pointer !important;
                box-shadow: 0 3px 12px rgba(0, 128, 255, 0.45) !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 6px !important;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
                margin: 0 10px !important;
                outline: none !important;
                white-space: nowrap !important;
                letter-spacing: 0.1px !important;
            }
            .btn-restart-update-pill:hover {
                background: #006EDB !important;
                transform: scale(1.04) !important;
                box-shadow: 0 5px 16px rgba(0, 128, 255, 0.6) !important;
            }
            .btn-restart-update-pill:active {
                transform: scale(0.97) !important;
            }

            /* ── Universal Page Section Heading & Breadcrumbs Typography ── */
            .brand-title-group h1,
            .brand-title-group h2,
            .cat-title-group h1,
            .cat-title-group h2,
            .var-title-group h1,
            .var-title-group h2,
            .unit-title-group h1,
            .unit-title-group h2,
            .shp-title-group h1,
            .shp-title-group h2,
            .sp-title-group h1,
            .sp-title-group h2,
            .ps-title-group h1,
            .ps-title-group h2,
            .mail-title-group h1,
            .mail-title-group h2,
            .sale-detail-title-group h1,
            .crm-title,
            .qd-title-row h1,
            [class*="-title-group"] h1,
            [class*="-title-group"] h2 {
                font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
                font-size: 22px !important;
                font-weight: 800 !important;
                color: #0F172A !important;
                letter-spacing: -0.025em !important;
                line-height: 1.25 !important;
                margin: 0 0 4px 0 !important;
            }

            .brand-title-group p,
            .cat-title-group p,
            .var-title-group p,
            .unit-title-group p,
            .shp-title-group p,
            .sp-title-group p,
            .ps-title-group p,
            .mail-title-group p,
            .sale-detail-title-group p,
            .crm-sub,
            .qd-subtitle,
            [class*="-title-group"] p {
                font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
                font-size: 13px !important;
                font-weight: 400 !important;
                color: #64748B !important;
                line-height: 1.45 !important;
                margin: 0 !important;
                max-width: 850px !important;
            }

            .brand-breadcrumb,
            .cat-breadcrumb,
            .var-breadcrumb,
            .unit-breadcrumb,
            .mail-breadcrumb,
            .sp-breadcrumb,
            .qd-breadcrumb,
            [class*="-breadcrumb"] {
                display: flex !important;
                align-items: center !important;
                gap: 6px !important;
                font-size: 12.5px !important;
                font-weight: 500 !important;
                color: #64748B !important;
                margin-bottom: 8px !important;
            }

            .brand-crumb-active,
            .cat-crumb-active,
            .var-crumb-active,
            .unit-crumb-active,
            .mail-crumb-active,
            .sp-crumb-active,
            .qd-crumb-active,
            [class*="-crumb-active"] {
                color: #15803D !important;
                font-weight: 700 !important;
            }
        </style>
    </head>
    <body class="antialiased">
    <div id="root"></div>

    <!-- ── In-App Update Engine ── -->
    <script>
    (function() {
        var updateBtn = null;
        var updateModal = null;
        var updateData = null;

        function checkUpdateStatus() {
            fetch('/api/check-update', { headers: { 'Accept': 'application/json' } })
                .then(function(r) { return r.json(); })
                .then(function(res) {
                    if (res && res.success && res.data && res.data.update_available) {
                        updateData = res.data;
                        renderUpdateBtn();
                    } else if (updateBtn) {
                        updateBtn.remove();
                        updateBtn = null;
                    }
                })
                .catch(function() {});
        }

        function renderUpdateBtn() {
            if (updateBtn && document.body.contains(updateBtn)) return;

            // Target header container
            var targetContainer = document.querySelector('.esb-nav-actions') ||
                                  document.querySelector('.navbar-nav') ||
                                  document.querySelector('header');

            if (!targetContainer) {
                setTimeout(renderUpdateBtn, 600);
                return;
            }

            if (!updateBtn) {
                updateBtn = document.createElement('button');
                updateBtn.type = 'button';
                updateBtn.className = 'btn-restart-update-pill';
                updateBtn.innerHTML = 'Restart to Update &rarr;';
                updateBtn.title = 'New version ' + (updateData ? updateData.latest_version : '') + ' is ready. Click to restart and update.';
                updateBtn.onclick = handleUpdateClick;
            }

            if (targetContainer.firstChild) {
                targetContainer.insertBefore(updateBtn, targetContainer.firstChild);
            } else {
                targetContainer.appendChild(updateBtn);
            }
        }

        function handleUpdateClick() {
            if (confirm('A new version ' + (updateData ? updateData.latest_version : '') + ' of INFY-POS Enterprise is available!\n\nRestart now to apply the new version and modern design?\n(Your billing and store data will remain 100% safe)')) {
                updateBtn.innerHTML = 'Restarting...';
                updateBtn.style.opacity = '0.7';
                updateBtn.disabled = true;

                fetch('/api/apply-update', {
                    method: 'POST',
                    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
                }).catch(function() {});

                // Signal native desktop WPF application
                if (window.chrome && window.chrome.webview) {
                    window.chrome.webview.postMessage({ action: 'restart_to_update' });
                } else {
                    setTimeout(function() {
                        window.location.reload(true);
                    }, 1200);
                }
            }
        }

        // Start polling for updates
        document.addEventListener('DOMContentLoaded', checkUpdateStatus);
        setTimeout(checkUpdateStatus, 1000);
        setInterval(checkUpdateStatus, 30000);
    })();
    </script>

    </body>
<script src="https://checkout.razorpay.com/v1/checkout.js" defer></script>
<script type="text/javascript" src="{{ mix('js/app.js') }}"></script>
</html>
