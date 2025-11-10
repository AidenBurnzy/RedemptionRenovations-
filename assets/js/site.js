// Prevent scroll restoration on page load
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

// Ensure page starts at top immediately
window.scrollTo(0, 0);

// Also ensure scroll to top on page show (back/forward navigation)
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        // Page was loaded from cache (back/forward button)
        window.scrollTo(0, 0);
    }
});

const syncMobileLayoutFlags = () => {
    if (!document.body) {
        return;
    }

    const hasWrapper = Boolean(document.querySelector('.mobile-wrapper'));
    document.body.classList.toggle('has-mobile-wrapper', hasWrapper);

    const hasMobileNav = Boolean(document.querySelector('.mobile-nav-shell'));
    document.body.classList.toggle('has-mobile-nav', hasMobileNav);
};

syncMobileLayoutFlags();

document.addEventListener('DOMContentLoaded', () => {
    // Force scroll to top on load
    window.scrollTo(0, 0);

    syncMobileLayoutFlags();
    
    const yearElement = document.getElementById('year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    const mobileYearElement = document.getElementById('mobileYear');
    if (mobileYearElement) {
        mobileYearElement.textContent = new Date().getFullYear();
    }

    const loadSectionIncludes = () => {
        const includeTargets = Array.from(document.querySelectorAll('[data-include]'));
        if (!includeTargets.length) {
            return Promise.resolve();
        }

        const loaders = includeTargets.map((target) => {
            const source = target.getAttribute('data-include');
            if (!source) {
                return Promise.resolve();
            }

            return fetch(source)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`Failed to load include: ${response.status} ${response.statusText}`);
                    }

                    return response.text();
                })
                .then((html) => {
                    const template = document.createElement('template');
                    template.innerHTML = html.trim();
                    const fragment = template.content.cloneNode(true);
                    target.replaceWith(fragment);
                })
                .catch((error) => {
                    console.error('Include load failed', source, error);
                });
        });

        return Promise.all(loaders);
    };

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
        const gapReady = initNavbarGapController();
        return gapReady;
    };

    const bootstrapNavbarEnhancements = () => {
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
    };

    loadSectionIncludes().then(() => {
        syncMobileLayoutFlags();
        bootstrapNavbarEnhancements();
        // Mark page as loaded
        document.body.classList.add('loaded');
        // Ensure we're at the top after all content loads
        window.scrollTo(0, 0);
    });
});
