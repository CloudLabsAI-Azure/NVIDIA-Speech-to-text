class ThemeManager {
    constructor() {
        this.darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        this.currentTheme = localStorage.getItem('theme') || 'system';
        this.init();
    }

    init() {
        // Listen for system theme changes
        this.darkModeMediaQuery.addEventListener('change', () => {
            if (this.currentTheme === 'system') {
                this.applyTheme('system');
            }
        });

        // Apply initial theme
        this.applyTheme(this.currentTheme);
    }

    applyTheme(theme) {
        this.currentTheme = theme;
        localStorage.setItem('theme', theme);

        // Remove any existing theme classes
        document.body.classList.remove('light-theme', 'dark-theme');

        // Apply the appropriate theme
        if (theme === 'system') {
            if (this.darkModeMediaQuery.matches) {
                document.body.classList.add('dark-theme');
            } else {
                document.body.classList.add('light-theme');
            }
        } else {
            document.body.classList.add(`${theme}-theme`);
        }

        // Update theme selector if it exists
        const themeSelector = document.getElementById('theme-selector');
        if (themeSelector) themeSelector.value = theme;
    }

    toggleTheme() {
        const themes = ['light', 'dark', 'system'];
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextTheme = themes[(currentIndex + 1) % themes.length];
        this.applyTheme(nextTheme);
        return nextTheme;
    }
}

// Initialize theme manager
const themeManager = new ThemeManager();
