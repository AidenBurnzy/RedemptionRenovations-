document.addEventListener('DOMContentLoaded', () => {
    const yearElement = document.getElementById('year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    const mobileYearElement = document.getElementById('mobileYear');
    if (mobileYearElement) {
        mobileYearElement.textContent = new Date().getFullYear();
    }

    const menuButton = document.querySelector('[data-menu-button]');
    const menuSheet = document.querySelector('[data-menu-sheet]');
    const menuOverlay = document.querySelector('[data-menu-overlay]');
    const menuClose = document.querySelector('[data-menu-close]');

    if (menuButton && menuSheet && menuOverlay) {
        if (menuSheet.parentElement && menuSheet.parentElement !== document.body) {
            document.body.appendChild(menuSheet);
        }

        if (menuOverlay.parentElement && menuOverlay.parentElement !== document.body) {
            document.body.appendChild(menuOverlay);
        }

        const openMenu = () => {
            const scrollbarComp = window.innerWidth - document.documentElement.clientWidth;
            if (scrollbarComp > 0) {
                document.body.style.setProperty('--scrollbar-comp', `${scrollbarComp}px`);
            }

            menuButton.setAttribute('aria-expanded', 'true');
            menuSheet.classList.add('open');
            menuOverlay.classList.add('active');
            document.body.classList.add('mobile-menu-open');
        };

        const closeMenu = () => {
            menuButton.setAttribute('aria-expanded', 'false');
            menuSheet.classList.remove('open');
            menuOverlay.classList.remove('active');
            document.body.classList.remove('mobile-menu-open');
            document.body.style.removeProperty('--scrollbar-comp');
        };

        menuButton.addEventListener('click', () => {
            const isExpanded = menuButton.getAttribute('aria-expanded') === 'true';
            if (isExpanded) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        if (menuClose) {
            menuClose.addEventListener('click', closeMenu);
        }

        menuOverlay.addEventListener('click', closeMenu);

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeMenu();
            }
        });

        const mediaQuery = window.matchMedia('(min-width: 641px)');
        const handleViewportChange = (event) => {
            if (event.matches) {
                closeMenu();
            }
        };

        if (typeof mediaQuery.addEventListener === 'function') {
            mediaQuery.addEventListener('change', handleViewportChange);
        } else if (typeof mediaQuery.addListener === 'function') {
            mediaQuery.addListener(handleViewportChange);
        }
    }

    const initLogoSwap = () => {
        const navbar = document.querySelector('.airbnb-navbar');
        const logoImg = document.querySelector('.airbnb-logo img');
        if (!navbar || !logoImg) {
            return false;
        }

        const hero = document.querySelector('.hero');
        const LOGO_DARK_SRC = 'logo1.PNG';
        const LOGO_LIGHT_SRC = 'logo2white.PNG';

        const applyVariant = (variant) => {
            if (logoImg.dataset.logoVariant === variant) {
                return;
            }

            logoImg.src = variant === 'light' ? LOGO_LIGHT_SRC : LOGO_DARK_SRC;
            logoImg.dataset.logoVariant = variant;
        };

        const updateLogoVariant = () => {
            if (!hero) {
                applyVariant('dark');
                return;
            }

            const heroRect = hero.getBoundingClientRect();
            const navbarHeight = navbar.getBoundingClientRect().height || 0;
            const useLight = heroRect.bottom > navbarHeight;
            applyVariant(useLight ? 'light' : 'dark');
        };

        updateLogoVariant();

        if (logoImg.dataset.logoSwapInitialized === 'true') {
            return true;
        }

        logoImg.dataset.logoSwapInitialized = 'true';

        if (!hero) {
            return true;
        }

        let ticking = false;
        const requestUpdate = () => {
            if (ticking) {
                return;
            }
            ticking = true;
            window.requestAnimationFrame(() => {
                updateLogoVariant();
                ticking = false;
            });
        };

        window.addEventListener('scroll', requestUpdate, { passive: true });
        window.addEventListener('resize', requestUpdate);

        return true;
    };

    const initNavbarGapController = () => {
        const navbarContainer = document.getElementById('navbar-container');
        const navbar = navbarContainer ? navbarContainer.querySelector('.airbnb-navbar') : null;
        if (!navbarContainer || !navbar) {
            return false;
        }

        if (navbarContainer.dataset.gapControllerInitialized === 'true') {
            return true;
        }

        navbarContainer.dataset.gapControllerInitialized = 'true';

    // Track scroll direction and toggle the navbar gap accordingly.
    const GAPLESS_CLASS = 'navbar-gapless';
    const SCROLL_DELTA_THRESHOLD = 2;
        let lastScrollY = window.scrollY;
        let lastDirection = window.scrollY > 0 ? 'down' : 'up';
        let frameRequested = false;
        let gapHidden = navbarContainer.classList.contains(GAPLESS_CLASS);

        const applyGapState = (shouldHideGap) => {
            if (shouldHideGap === gapHidden) {
                return;
            }

            gapHidden = shouldHideGap;

            if (shouldHideGap) {
                navbarContainer.classList.add(GAPLESS_CLASS);
            } else {
                navbarContainer.classList.remove(GAPLESS_CLASS);
            }
        };

        const evaluateGap = () => {
            frameRequested = false;
            const currentScrollY = window.scrollY;
            const isAtTop = currentScrollY <= 0;
            let direction = lastDirection;

            if (currentScrollY - lastScrollY > SCROLL_DELTA_THRESHOLD) {
                direction = 'down';
            } else if (lastScrollY - currentScrollY > SCROLL_DELTA_THRESHOLD) {
                direction = 'up';
            }

            if (isAtTop) {
                applyGapState(false);
                direction = 'up';
            } else if (direction === 'up') {
                applyGapState(false);
            } else if (direction === 'down') {
                applyGapState(true);
            }

            lastScrollY = currentScrollY;
            lastDirection = direction;
        };

        const handleScroll = () => {
            if (frameRequested) {
                return;
            }

            frameRequested = true;
            window.requestAnimationFrame(evaluateGap);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', evaluateGap);
        evaluateGap();

        return true;
    };

    const initNavbarEnhancements = () => {
        const logoReady = initLogoSwap();
        const gapReady = initNavbarGapController();
        return logoReady && gapReady;
    };

    if (!initNavbarEnhancements()) {
        const navbarContainer = document.getElementById('navbar-container');
        if (navbarContainer) {
            const observer = new MutationObserver(() => {
                if (initNavbarEnhancements()) {
                    observer.disconnect();
                }
            });

            observer.observe(navbarContainer, { childList: true, subtree: true });
        }
    }
});
