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
});
