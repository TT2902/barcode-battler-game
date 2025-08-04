/**
 * AccessibilityManager - Manages accessibility features and preferences
 * Handles high contrast, large text, reduced motion, and screen reader optimizations
 */

class AccessibilityManager {
    constructor() {
        this.preferences = this.loadPreferences();
        this.keyboardNavHints = [];
        this.focusHistory = [];
        this.announceQueue = [];
        
        this.init();
    }

    /**
     * Initialize accessibility manager
     */
    init() {
        this.setupAccessibilityToolbar();
        this.applyStoredPreferences();
        this.setupKeyboardNavigation();
        this.setupFocusManagement();
        this.setupScreenReaderOptimizations();
        this.detectSystemPreferences();
        this.setupAnnounceQueue();
        
        console.log('AccessibilityManager initialized');
    }

    /**
     * Set up accessibility toolbar
     */
    setupAccessibilityToolbar() {
        const toolbar = document.getElementById('accessibility-toolbar');
        if (!toolbar) return;

        // High contrast toggle
        const highContrastBtn = document.getElementById('toggle-high-contrast');
        if (highContrastBtn) {
            highContrastBtn.addEventListener('click', () => {
                this.toggleHighContrast();
            });
        }

        // Large text toggle
        const largeTextBtn = document.getElementById('toggle-large-text');
        if (largeTextBtn) {
            largeTextBtn.addEventListener('click', () => {
                this.toggleLargeText();
            });
        }

        // Reduced motion toggle
        const reducedMotionBtn = document.getElementById('toggle-reduced-motion');
        if (reducedMotionBtn) {
            reducedMotionBtn.addEventListener('click', () => {
                this.toggleReducedMotion();
            });
        }

        // Screen reader mode toggle
        const screenReaderBtn = document.getElementById('toggle-screen-reader-mode');
        if (screenReaderBtn) {
            screenReaderBtn.addEventListener('click', () => {
                this.toggleScreenReaderMode();
            });
        }

        // Make toolbar keyboard accessible
        this.makeToolbarAccessible(toolbar);
    }

    /**
     * Make toolbar keyboard accessible
     * @param {HTMLElement} toolbar - Toolbar element
     */
    makeToolbarAccessible(toolbar) {
        const buttons = toolbar.querySelectorAll('button');
        
        buttons.forEach((button, index) => {
            button.addEventListener('keydown', (e) => {
                switch (e.key) {
                    case 'ArrowRight':
                    case 'ArrowDown':
                        e.preventDefault();
                        const nextIndex = (index + 1) % buttons.length;
                        buttons[nextIndex].focus();
                        break;
                        
                    case 'ArrowLeft':
                    case 'ArrowUp':
                        e.preventDefault();
                        const prevIndex = (index - 1 + buttons.length) % buttons.length;
                        buttons[prevIndex].focus();
                        break;
                        
                    case 'Home':
                        e.preventDefault();
                        buttons[0].focus();
                        break;
                        
                    case 'End':
                        e.preventDefault();
                        buttons[buttons.length - 1].focus();
                        break;
                }
            });
        });
    }

    /**
     * Toggle high contrast mode
     */
    toggleHighContrast() {
        const isEnabled = document.body.classList.toggle('high-contrast');
        this.preferences.highContrast = isEnabled;
        this.savePreferences();
        
        const button = document.getElementById('toggle-high-contrast');
        if (button) {
            button.classList.toggle('active', isEnabled);
            button.setAttribute('aria-pressed', isEnabled.toString());
        }
        
        this.announce(`High contrast mode ${isEnabled ? 'enabled' : 'disabled'}`, 'polite');
        
        // Dispatch event
        this.dispatchAccessibilityEvent('highContrastChanged', { enabled: isEnabled });
    }

    /**
     * Toggle large text mode
     */
    toggleLargeText() {
        const isEnabled = document.body.classList.toggle('large-text');
        this.preferences.largeText = isEnabled;
        this.savePreferences();
        
        const button = document.getElementById('toggle-large-text');
        if (button) {
            button.classList.toggle('active', isEnabled);
            button.setAttribute('aria-pressed', isEnabled.toString());
        }
        
        this.announce(`Large text mode ${isEnabled ? 'enabled' : 'disabled'}`, 'polite');
        
        // Dispatch event
        this.dispatchAccessibilityEvent('largeTextChanged', { enabled: isEnabled });
    }

    /**
     * Toggle reduced motion mode
     */
    toggleReducedMotion() {
        const isEnabled = document.body.classList.toggle('reduced-motion');
        this.preferences.reducedMotion = isEnabled;
        this.savePreferences();
        
        const button = document.getElementById('toggle-reduced-motion');
        if (button) {
            button.classList.toggle('active', isEnabled);
            button.setAttribute('aria-pressed', isEnabled.toString());
        }
        
        this.announce(`Reduced motion mode ${isEnabled ? 'enabled' : 'disabled'}`, 'polite');
        
        // Dispatch event
        this.dispatchAccessibilityEvent('reducedMotionChanged', { enabled: isEnabled });
    }

    /**
     * Toggle screen reader mode
     */
    toggleScreenReaderMode() {
        const isEnabled = document.body.classList.toggle('screen-reader-mode');
        this.preferences.screenReaderMode = isEnabled;
        this.savePreferences();
        
        const button = document.getElementById('toggle-screen-reader-mode');
        if (button) {
            button.classList.toggle('active', isEnabled);
            button.setAttribute('aria-pressed', isEnabled.toString());
        }
        
        this.announce(`Screen reader optimizations ${isEnabled ? 'enabled' : 'disabled'}`, 'polite');
        
        // Dispatch event
        this.dispatchAccessibilityEvent('screenReaderModeChanged', { enabled: isEnabled });
    }

    /**
     * Set up enhanced keyboard navigation
     */
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            this.handleGlobalKeyboard(e);
        });

        // Show keyboard navigation hints
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F1' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                this.showKeyboardHelp();
            }
        });

        // Track focus for better navigation
        document.addEventListener('focusin', (e) => {
            this.trackFocus(e.target);
        });
    }

    /**
     * Handle global keyboard shortcuts
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleGlobalKeyboard(e) {
        // Don't interfere with form inputs
        if (e.target.matches('input, textarea, select')) {
            return;
        }

        // Alt + number keys for quick navigation
        if (e.altKey && !e.ctrlKey && !e.metaKey) {
            switch (e.key) {
                case '1':
                    e.preventDefault();
                    this.focusMainHeading();
                    break;
                case '2':
                    e.preventDefault();
                    this.focusMainContent();
                    break;
                case '3':
                    e.preventDefault();
                    this.focusNavigation();
                    break;
                case '0':
                    e.preventDefault();
                    this.showAccessibilityMenu();
                    break;
            }
        }

        // Ctrl + Alt combinations for accessibility features
        if (e.ctrlKey && e.altKey) {
            switch (e.key) {
                case 'h':
                    e.preventDefault();
                    this.toggleHighContrast();
                    break;
                case 'l':
                    e.preventDefault();
                    this.toggleLargeText();
                    break;
                case 'm':
                    e.preventDefault();
                    this.toggleReducedMotion();
                    break;
                case 's':
                    e.preventDefault();
                    this.toggleScreenReaderMode();
                    break;
            }
        }
    }

    /**
     * Set up focus management
     */
    setupFocusManagement() {
        // Create focus trap for modals
        this.setupFocusTraps();
        
        // Restore focus when returning to screens
        this.setupFocusRestoration();
        
        // Skip links functionality
        this.setupSkipLinks();
    }

    /**
     * Set up focus traps for modal dialogs
     */
    setupFocusTraps() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                const modal = document.querySelector('.modal-overlay');
                if (modal) {
                    this.trapFocusInModal(e, modal);
                }
            }
        });
    }

    /**
     * Trap focus within modal
     * @param {KeyboardEvent} e - Keyboard event
     * @param {HTMLElement} modal - Modal element
     */
    trapFocusInModal(e, modal) {
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    }

    /**
     * Set up focus restoration
     */
    setupFocusRestoration() {
        window.addEventListener('screenChanged', (e) => {
            const { newScreen, oldScreen } = e.detail;
            this.restoreFocusForScreen(newScreen);
        });
    }

    /**
     * Set up skip links
     */
    setupSkipLinks() {
        const skipLink = document.querySelector('.skip-link');
        if (skipLink) {
            skipLink.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(skipLink.getAttribute('href'));
                if (target) {
                    target.focus();
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
    }

    /**
     * Set up screen reader optimizations
     */
    setupScreenReaderOptimizations() {
        // Add role and aria-label to interactive elements
        this.enhanceInteractiveElements();
        
        // Set up live regions
        this.setupLiveRegions();
        
        // Add landmark roles
        this.addLandmarkRoles();
        
        // Enhance form labels
        this.enhanceFormLabels();
    }

    /**
     * Enhance interactive elements with ARIA attributes
     */
    enhanceInteractiveElements() {
        // Enhance buttons without proper labels
        document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])').forEach(button => {
            if (!button.textContent.trim()) {
                const icon = button.querySelector('[aria-hidden="true"]');
                if (icon) {
                    button.setAttribute('aria-label', this.getButtonLabelFromIcon(icon.textContent));
                }
            }
        });

        // Enhance clickable elements
        document.querySelectorAll('[onclick]:not(button):not(a)').forEach(element => {
            if (!element.getAttribute('role')) {
                element.setAttribute('role', 'button');
            }
            if (!element.hasAttribute('tabindex')) {
                element.setAttribute('tabindex', '0');
            }
        });
    }

    /**
     * Get button label from icon
     * @param {string} icon - Icon character
     * @returns {string} Button label
     */
    getButtonLabelFromIcon(icon) {
        const iconLabels = {
            '📱': 'Scan barcode',
            '📚': 'View collection',
            '⚔️': 'Battle',
            '⚙️': 'Settings',
            '←': 'Go back',
            '🎨': 'Toggle high contrast',
            '🔍': 'Toggle large text',
            '⏸️': 'Toggle reduced motion',
            '🔊': 'Toggle screen reader mode'
        };
        
        return iconLabels[icon] || 'Button';
    }

    /**
     * Set up live regions for announcements
     */
    setupLiveRegions() {
        // Ensure live regions exist
        this.ensureLiveRegion('polite-announcer', 'polite');
        this.ensureLiveRegion('assertive-announcer', 'assertive');
        this.ensureLiveRegion('status-announcer', 'status');
    }

    /**
     * Ensure live region exists
     * @param {string} id - Region ID
     * @param {string} politeness - ARIA live politeness level
     */
    ensureLiveRegion(id, politeness) {
        let region = document.getElementById(id);
        if (!region) {
            region = document.createElement('div');
            region.id = id;
            region.setAttribute('aria-live', politeness);
            region.setAttribute('aria-atomic', 'true');
            region.className = 'sr-only';
            document.body.appendChild(region);
        }
    }

    /**
     * Add landmark roles to page sections
     */
    addLandmarkRoles() {
        // Add main landmark if not present
        if (!document.querySelector('main') && !document.querySelector('[role="main"]')) {
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.setAttribute('role', 'main');
            }
        }

        // Add navigation landmarks
        document.querySelectorAll('.main-menu, .screen-header').forEach(nav => {
            if (!nav.getAttribute('role')) {
                nav.setAttribute('role', 'navigation');
            }
        });

        // Add banner role to headers
        document.querySelectorAll('.screen-header').forEach(header => {
            if (!header.getAttribute('role')) {
                header.setAttribute('role', 'banner');
            }
        });
    }

    /**
     * Enhance form labels and descriptions
     */
    enhanceFormLabels() {
        // Ensure all inputs have labels
        document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])').forEach(input => {
            const label = document.querySelector(`label[for="${input.id}"]`);
            if (!label && input.placeholder) {
                input.setAttribute('aria-label', input.placeholder);
            }
        });

        // Add descriptions to form fields
        document.querySelectorAll('input[pattern]').forEach(input => {
            if (!input.getAttribute('aria-describedby')) {
                const description = this.createInputDescription(input);
                if (description) {
                    input.setAttribute('aria-describedby', description.id);
                }
            }
        });
    }

    /**
     * Create input description element
     * @param {HTMLInputElement} input - Input element
     * @returns {HTMLElement|null} Description element
     */
    createInputDescription(input) {
        const pattern = input.getAttribute('pattern');
        let descriptionText = '';

        if (pattern === '[0-9]{8,20}') {
            descriptionText = 'Enter 8 to 20 digits';
        }

        if (descriptionText) {
            const description = document.createElement('div');
            description.id = `${input.id}-description`;
            description.className = 'input-description sr-only';
            description.textContent = descriptionText;
            input.parentNode.insertBefore(description, input.nextSibling);
            return description;
        }

        return null;
    }

    /**
     * Detect and apply system accessibility preferences
     */
    detectSystemPreferences() {
        // Detect prefers-reduced-motion
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            if (!this.preferences.reducedMotion) {
                this.toggleReducedMotion();
            }
        }

        // Detect prefers-contrast
        if (window.matchMedia('(prefers-contrast: high)').matches) {
            if (!this.preferences.highContrast) {
                this.toggleHighContrast();
            }
        }

        // Listen for changes
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
            if (e.matches && !this.preferences.reducedMotion) {
                this.toggleReducedMotion();
            }
        });

        window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
            if (e.matches && !this.preferences.highContrast) {
                this.toggleHighContrast();
            }
        });
    }

    /**
     * Set up announcement queue for screen readers
     */
    setupAnnounceQueue() {
        setInterval(() => {
            if (this.announceQueue.length > 0) {
                const announcement = this.announceQueue.shift();
                this.processAnnouncement(announcement);
            }
        }, 500);
    }

    /**
     * Announce message to screen readers
     * @param {string} message - Message to announce
     * @param {string} priority - 'polite', 'assertive', or 'status'
     */
    announce(message, priority = 'polite') {
        this.announceQueue.push({ message, priority, timestamp: Date.now() });
    }

    /**
     * Process announcement
     * @param {Object} announcement - Announcement object
     */
    processAnnouncement(announcement) {
        const regionId = `${announcement.priority}-announcer`;
        const region = document.getElementById(regionId);
        
        if (region) {
            region.textContent = announcement.message;
            
            // Clear after announcement
            setTimeout(() => {
                if (region.textContent === announcement.message) {
                    region.textContent = '';
                }
            }, 1000);
        }
    }

    /**
     * Apply stored accessibility preferences
     */
    applyStoredPreferences() {
        if (this.preferences.highContrast) {
            document.body.classList.add('high-contrast');
            const button = document.getElementById('toggle-high-contrast');
            if (button) {
                button.classList.add('active');
                button.setAttribute('aria-pressed', 'true');
            }
        }

        if (this.preferences.largeText) {
            document.body.classList.add('large-text');
            const button = document.getElementById('toggle-large-text');
            if (button) {
                button.classList.add('active');
                button.setAttribute('aria-pressed', 'true');
            }
        }

        if (this.preferences.reducedMotion) {
            document.body.classList.add('reduced-motion');
            const button = document.getElementById('toggle-reduced-motion');
            if (button) {
                button.classList.add('active');
                button.setAttribute('aria-pressed', 'true');
            }
        }

        if (this.preferences.screenReaderMode) {
            document.body.classList.add('screen-reader-mode');
            const button = document.getElementById('toggle-screen-reader-mode');
            if (button) {
                button.classList.add('active');
                button.setAttribute('aria-pressed', 'true');
            }
        }
    }

    /**
     * Track focus for navigation history
     * @param {HTMLElement} element - Focused element
     */
    trackFocus(element) {
        this.focusHistory.push({
            element: element,
            timestamp: Date.now(),
            screen: document.querySelector('.screen.active')?.id
        });

        // Keep only recent focus history
        if (this.focusHistory.length > 10) {
            this.focusHistory.shift();
        }
    }

    /**
     * Restore focus for screen
     * @param {string} screenId - Screen ID
     */
    restoreFocusForScreen(screenId) {
        // Find the last focused element for this screen
        const lastFocus = this.focusHistory
            .reverse()
            .find(entry => entry.screen === screenId);

        if (lastFocus && document.contains(lastFocus.element)) {
            setTimeout(() => {
                lastFocus.element.focus();
            }, 100);
        }
    }

    /**
     * Focus main heading
     */
    focusMainHeading() {
        const heading = document.querySelector('h1, h2, [role="heading"]');
        if (heading) {
            heading.focus();
            this.announce('Focused on main heading', 'polite');
        }
    }

    /**
     * Focus main content
     */
    focusMainContent() {
        const main = document.querySelector('main, [role="main"], #main-content');
        if (main) {
            main.focus();
            this.announce('Focused on main content', 'polite');
        }
    }

    /**
     * Focus navigation
     */
    focusNavigation() {
        const nav = document.querySelector('nav, [role="navigation"]');
        if (nav) {
            const firstLink = nav.querySelector('a, button');
            if (firstLink) {
                firstLink.focus();
                this.announce('Focused on navigation', 'polite');
            }
        }
    }

    /**
     * Show accessibility menu
     */
    showAccessibilityMenu() {
        const toolbar = document.getElementById('accessibility-toolbar');
        if (toolbar) {
            const firstButton = toolbar.querySelector('button');
            if (firstButton) {
                firstButton.focus();
                this.announce('Accessibility menu opened', 'polite');
            }
        }
    }

    /**
     * Show keyboard help
     */
    showKeyboardHelp() {
        const helpContent = `
            <div class="keyboard-help">
                <h3>Keyboard Navigation</h3>
                <dl>
                    <dt>Alt + 1</dt>
                    <dd>Focus main heading</dd>
                    
                    <dt>Alt + 2</dt>
                    <dd>Focus main content</dd>
                    
                    <dt>Alt + 3</dt>
                    <dd>Focus navigation</dd>
                    
                    <dt>Alt + 0</dt>
                    <dd>Open accessibility menu</dd>
                    
                    <dt>Ctrl + Alt + H</dt>
                    <dd>Toggle high contrast</dd>
                    
                    <dt>Ctrl + Alt + L</dt>
                    <dd>Toggle large text</dd>
                    
                    <dt>Ctrl + Alt + M</dt>
                    <dd>Toggle reduced motion</dd>
                    
                    <dt>Ctrl + Alt + S</dt>
                    <dd>Toggle screen reader mode</dd>
                    
                    <dt>Tab / Shift + Tab</dt>
                    <dd>Navigate between interactive elements</dd>
                    
                    <dt>Enter / Space</dt>
                    <dd>Activate buttons and links</dd>
                    
                    <dt>Escape</dt>
                    <dd>Close dialogs or go back</dd>
                </dl>
            </div>
        `;

        // Use existing modal system if available
        if (window.uiController && typeof window.uiController.showModal === 'function') {
            window.uiController.showModal('Keyboard Help', helpContent);
        } else {
            alert('Keyboard help: Press Alt+1 for main heading, Alt+2 for main content, Alt+3 for navigation, Alt+0 for accessibility menu');
        }
    }

    /**
     * Dispatch accessibility event
     * @param {string} eventName - Event name
     * @param {Object} detail - Event detail
     */
    dispatchAccessibilityEvent(eventName, detail) {
        const event = new CustomEvent(eventName, { detail });
        window.dispatchEvent(event);
    }

    /**
     * Load accessibility preferences
     * @returns {Object} Preferences object
     */
    loadPreferences() {
        try {
            const stored = localStorage.getItem('barcodeBattler_accessibility');
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.warn('Failed to load accessibility preferences:', error);
            return {};
        }
    }

    /**
     * Save accessibility preferences
     */
    savePreferences() {
        try {
            localStorage.setItem('barcodeBattler_accessibility', JSON.stringify(this.preferences));
        } catch (error) {
            console.warn('Failed to save accessibility preferences:', error);
        }
    }

    /**
     * Get accessibility status
     * @returns {Object} Accessibility status
     */
    getAccessibilityStatus() {
        return {
            highContrast: this.preferences.highContrast || false,
            largeText: this.preferences.largeText || false,
            reducedMotion: this.preferences.reducedMotion || false,
            screenReaderMode: this.preferences.screenReaderMode || false,
            systemPreferences: {
                reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
                highContrast: window.matchMedia('(prefers-contrast: high)').matches,
                darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches
            }
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AccessibilityManager;
}

// Make available globally in browser
if (typeof window !== 'undefined') {
    window.AccessibilityManager = AccessibilityManager;
}