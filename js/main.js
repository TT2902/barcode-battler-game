/**
 * Main application controller for Barcode Battler Game
 * Handles screen navigation and basic UI initialization
 */

class UIController {
    constructor() {
        this.currentScreen = 'home-screen';
        this.previousScreen = null;
        this.screenHistory = [];
        this.maxHistoryLength = 10;
        
        // Screen configuration with metadata
        this.screens = {
            'home-screen': {
                id: 'home-screen',
                title: 'Barcode Battler',
                allowBack: false,
                requiresAuth: false,
                preload: false
            },
            'scanner-screen': {
                id: 'scanner-screen',
                title: 'Scan Barcode',
                allowBack: true,
                requiresAuth: false,
                preload: true,
                cleanup: () => this.cleanupScanner()
            },
            'collection-screen': {
                id: 'collection-screen',
                title: 'My Collection',
                allowBack: true,
                requiresAuth: false,
                preload: true,
                init: () => this.refreshCollection()
            },
            'creature-detail-screen': {
                id: 'creature-detail-screen',
                title: 'Creature Details',
                allowBack: true,
                requiresAuth: false,
                preload: false
            },
            'difficulty-screen': {
                id: 'difficulty-screen',
                title: 'Select Difficulty',
                allowBack: true,
                requiresAuth: false,
                preload: true,
                init: () => this.setupDifficultyScreen()
            },
            'battle-screen': {
                id: 'battle-screen',
                title: 'Battle Arena',
                allowBack: true,
                requiresAuth: false,
                preload: false,
                init: () => this.updateBattleDisplay(),
                cleanup: () => this.cleanupBattle()
            },
            'settings-screen': {
                id: 'settings-screen',
                title: 'Settings',
                allowBack: true,
                requiresAuth: false,
                preload: true,
                init: () => this.loadSettingsUI()
            }
        };
        
        // Navigation state
        this.isNavigating = false;
        this.navigationQueue = [];
        
        // Initialize managers
        this.storageManager = new StorageManager();
        this.barcodeProcessor = new BarcodeProcessor();
        this.creatureManager = new CreatureManager(this.storageManager);
        this.cameraScanner = new CameraScanner();
        this.difficultyManager = new DifficultyManager();
        this.battleEngine = new BattleEngine(this.difficultyManager);
        this.battleEffects = new BattleEffects();
        this.accessibilityManager = new AccessibilityManager();
        this.optimizationUtils = new OptimizationUtils();
        
        // Bind methods for event listeners
        this.handleKeyboardNavigation = this.handleKeyboardNavigation.bind(this);
        this.handlePopState = this.handlePopState.bind(this);
        
        this.init();
    }

    /**
     * Initialize the UI controller and set up event listeners
     */
    async init() {
        try {
            // Set up core navigation
            this.setupNavigationListeners();
            this.setupKeyboardNavigation();
            
            // Load user settings
            this.loadSettings();
            
            // Initialize screen from URL if available
            const initialScreen = this.getInitialScreenFromURL();
            
            // Show initial screen
            await this.showScreen(initialScreen);
            
            // Set up global error handling
            this.setupErrorHandling();
            
            // Initialize accessibility features
            this.initializeAccessibility();
            
            // Set up performance monitoring
            this.setupPerformanceMonitoring();
            
            // Add keyboard shortcuts
            this.addKeyboardShortcuts();
            
            // Check for saved battle state
            const savedBattle = this.loadBattleState();
            if (savedBattle) {
                this.currentBattle = savedBattle;
                this.showFeedback('Previous battle restored', 'success');
            }
            
            // Initialize analytics
            this.initializeAnalytics();
            
            console.log('UIController initialized successfully');
            
            // Show integration status
            this.showIntegrationStatus();
            
        } catch (error) {
            console.error('Failed to initialize UIController:', error);
            this.showFeedback('Failed to initialize application', 'error');
            
            // Fallback to home screen
            this.showScreen('home-screen', { force: true });
        }
    }

    /**
     * Get initial screen from URL hash
     * @returns {string} Initial screen ID
     */
    getInitialScreenFromURL() {
        const hash = window.location.hash.slice(1); // Remove #
        
        if (hash && this.screens[hash]) {
            return hash;
        }
        
        return 'home-screen';
    }

    /**
     * Set up global error handling
     */
    setupErrorHandling() {
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.showFeedback('An unexpected error occurred', 'error');
        });

        // Handle general errors
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.showFeedback('An error occurred', 'error');
        });
    }

    /**
     * Initialize accessibility features
     */
    initializeAccessibility() {
        // Add skip link for keyboard users
        this.addSkipLink();
        
        // Set up ARIA live regions
        this.setupLiveRegions();
        
        // Initialize high contrast mode if previously enabled
        const highContrastEnabled = localStorage.getItem('highContrast') === 'true';
        if (highContrastEnabled) {
            this.toggleHighContrast(true);
        }
    }

    /**
     * Add skip link for keyboard navigation
     */
    addSkipLink() {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.textContent = 'Skip to main content';
        skipLink.className = 'skip-link';
        skipLink.style.cssText = `
            position: absolute;
            top: -40px;
            left: 6px;
            background: #000;
            color: #fff;
            padding: 8px;
            text-decoration: none;
            z-index: 1000;
            border-radius: 4px;
        `;
        
        skipLink.addEventListener('focus', () => {
            skipLink.style.top = '6px';
        });
        
        skipLink.addEventListener('blur', () => {
            skipLink.style.top = '-40px';
        });
        
        document.body.insertBefore(skipLink, document.body.firstChild);
    }

    /**
     * Set up ARIA live regions for announcements
     */
    setupLiveRegions() {
        // Polite announcements
        const politeRegion = document.createElement('div');
        politeRegion.id = 'polite-announcer';
        politeRegion.setAttribute('aria-live', 'polite');
        politeRegion.setAttribute('aria-atomic', 'true');
        politeRegion.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
        document.body.appendChild(politeRegion);

        // Assertive announcements
        const assertiveRegion = document.createElement('div');
        assertiveRegion.id = 'assertive-announcer';
        assertiveRegion.setAttribute('aria-live', 'assertive');
        assertiveRegion.setAttribute('aria-atomic', 'true');
        assertiveRegion.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
        document.body.appendChild(assertiveRegion);
    }

    /**
     * Initialize analytics tracking
     */
    initializeAnalytics() {
        const analytics = this.getAnalytics();
        
        // Track session start
        analytics.sessionsStarted = (analytics.sessionsStarted || 0) + 1;
        analytics.lastSession = new Date().toISOString();
        
        // Track browser and device info
        if (!analytics.browserInfo) {
            analytics.browserInfo = {
                userAgent: navigator.userAgent,
                language: navigator.language,
                platform: navigator.platform,
                screenResolution: `${screen.width}x${screen.height}`,
                colorDepth: screen.colorDepth
            };
        }
        
        this.saveAnalytics(analytics);
        
        // Set up session tracking
        this.trackSessionActivity();
    }

    /**
     * Track session activity
     */
    trackSessionActivity() {
        let lastActivity = Date.now();
        
        // Track user activity
        const activityEvents = ['click', 'keydown', 'touchstart', 'scroll'];
        activityEvents.forEach(event => {
            document.addEventListener(event, () => {
                lastActivity = Date.now();
            });
        });
        
        // Check for inactivity every minute
        setInterval(() => {
            const inactiveTime = Date.now() - lastActivity;
            const analytics = this.getAnalytics();
            
            if (inactiveTime > 300000) { // 5 minutes
                analytics.inactiveSessions = (analytics.inactiveSessions || 0) + 1;
            }
            
            analytics.totalSessionTime = (analytics.totalSessionTime || 0) + 60000; // Add 1 minute
            this.saveAnalytics(analytics);
        }, 60000);
    }

    /**
     * Set up performance monitoring
     */
    setupPerformanceMonitoring() {
        // Monitor navigation performance
        this.navigationTimes = new Map();
        
        window.addEventListener('screenChanged', (event) => {
            const { newScreen, timestamp } = event.detail;
            this.navigationTimes.set(newScreen, timestamp);
            
            // Log slow navigations
            if (this.navigationTimes.size > 1) {
                const entries = Array.from(this.navigationTimes.entries());
                const lastEntry = entries[entries.length - 2];
                const navigationTime = timestamp - lastEntry[1];
                
                if (navigationTime > 1000) { // More than 1 second
                    console.warn(`Slow navigation detected: ${lastEntry[0]} -> ${newScreen} (${navigationTime}ms)`);
                }
            }
        });
    }

    /**
     * Set up navigation event listeners
     */
    setupNavigationListeners() {
        // Home screen navigation
        document.getElementById('scan-barcode-btn')?.addEventListener('click', () => {
            this.showScreen('scanner-screen');
        });

        document.getElementById('view-collection-btn')?.addEventListener('click', () => {
            this.showScreen('collection-screen');
        });

        document.getElementById('battle-btn')?.addEventListener('click', () => {
            this.showScreen('difficulty-screen');
            this.setupDifficultyScreen();
        });

        document.getElementById('settings-btn')?.addEventListener('click', () => {
            this.showScreen('settings-screen');
        });

        // Back button navigation
        document.getElementById('back-from-scanner')?.addEventListener('click', () => {
            this.showScreen('home-screen');
        });

        document.getElementById('back-from-collection')?.addEventListener('click', () => {
            this.showScreen('home-screen');
        });

        document.getElementById('back-from-detail')?.addEventListener('click', () => {
            this.showScreen('collection-screen');
        });

        document.getElementById('back-from-difficulty')?.addEventListener('click', () => {
            this.showScreen('collection-screen');
        });

        document.getElementById('back-from-battle')?.addEventListener('click', () => {
            this.showScreen('difficulty-screen');
        });

        document.getElementById('back-from-settings')?.addEventListener('click', () => {
            this.showScreen('home-screen');
        });

        // Settings toggles
        document.getElementById('high-contrast-toggle')?.addEventListener('change', (e) => {
            this.toggleHighContrast(e.target.checked);
        });

        document.getElementById('sound-toggle')?.addEventListener('change', (e) => {
            this.battleEffects.setSoundEnabled(e.target.checked);
            this.saveSettings();
        });

        // Data management buttons
        document.getElementById('backup-data-btn')?.addEventListener('click', () => {
            this.createBackup();
        });

        document.getElementById('restore-data-btn')?.addEventListener('click', () => {
            this.showRestoreDialog();
        });

        document.getElementById('reset-data-btn')?.addEventListener('click', () => {
            this.showResetDialog();
        });

        // File input for restore
        document.getElementById('backup-file-input')?.addEventListener('change', (e) => {
            this.handleBackupFileSelected(e);
        });

        // Manual input toggle
        document.getElementById('manual-input-btn')?.addEventListener('click', () => {
            this.toggleManualInput();
        });

        // Creature detail battle button
        document.getElementById('battle-with-creature')?.addEventListener('click', () => {
            if (this.selectedCreature) {
                this.startBattleWithCreature(this.selectedCreature);
            }
        });

        // Battle action buttons
        document.getElementById('attack-btn')?.addEventListener('click', () => {
            this.executeBattleAction('attack');
        });

        document.getElementById('special-attack-btn')?.addEventListener('click', () => {
            this.executeBattleAction('special');
        });

        document.getElementById('defend-btn')?.addEventListener('click', () => {
            this.executeBattleAction('defend');
        });

        document.getElementById('battle-continue-btn')?.addEventListener('click', () => {
            this.handleBattleEnd();
        });

        document.getElementById('battle-rematch-btn')?.addEventListener('click', () => {
            this.handleRematch();
        });

        document.getElementById('clear-log-btn')?.addEventListener('click', () => {
            this.clearBattleLog();
        });
    }

    /**
     * Set up enhanced keyboard navigation support
     */
    setupKeyboardNavigation() {
        // Remove existing listener if it exists
        document.removeEventListener('keydown', this.handleKeyboardNavigation);
        
        // Add enhanced keyboard navigation
        document.addEventListener('keydown', this.handleKeyboardNavigation);
        
        // Handle browser back/forward buttons
        window.addEventListener('popstate', this.handlePopState);
        
        // Set up focus trap for modals (future feature)
        this.setupFocusTraps();
    }

    /**
     * Handle keyboard navigation events
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyboardNavigation(e) {
        // Don't interfere with form inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        switch (e.key) {
            case 'Escape':
                e.preventDefault();
                this.goBack();
                break;
                
            case 'Enter':
                if (e.target.tagName === 'BUTTON' || e.target.hasAttribute('tabindex')) {
                    e.preventDefault();
                    e.target.click();
                }
                break;
                
            case 'ArrowLeft':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.goBack();
                }
                break;
                
            case 'ArrowRight':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.goForward();
                }
                break;
                
            case 'h':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.showScreen('home-screen');
                }
                break;
                
            case 's':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.showScreen('scanner-screen');
                }
                break;
                
            case 'c':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.showScreen('collection-screen');
                }
                break;
                
            case 'Tab':
                this.handleTabNavigation(e);
                break;
        }
    }

    /**
     * Handle browser popstate events (back/forward buttons)
     * @param {PopStateEvent} e - Popstate event
     */
    handlePopState(e) {
        if (e.state && e.state.screen) {
            this.showScreen(e.state.screen, { skipHistory: true });
        } else {
            // Default to home screen if no state
            this.showScreen('home-screen', { skipHistory: true });
        }
    }

    /**
     * Handle tab navigation for accessibility
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleTabNavigation(e) {
        const currentScreen = document.getElementById(this.currentScreen);
        if (!currentScreen) return;

        const focusableElements = currentScreen.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            // Shift + Tab (backward)
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            // Tab (forward)
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    }

    /**
     * Set up focus traps for modal dialogs
     */
    setupFocusTraps() {
        // This will be implemented when modal dialogs are added
        console.log('Focus traps initialized');
    }

    /**
     * Show a specific screen with enhanced navigation management
     * @param {string} screenId - ID of the screen to show
     * @param {Object} options - Navigation options
     * @returns {Promise<boolean>} Success status
     */
    async showScreen(screenId, options = {}) {
        // Validate screen ID
        if (!this.screens[screenId]) {
            console.error(`Invalid screen ID: ${screenId}`);
            this.showFeedback(`Screen "${screenId}" not found`, 'error');
            return false;
        }

        // Prevent concurrent navigation
        if (this.isNavigating && !options.force) {
            this.navigationQueue.push({ screenId, options });
            return false;
        }

        this.isNavigating = true;

        try {
            const screenConfig = this.screens[screenId];
            const currentScreenConfig = this.screens[this.currentScreen];

            // Check if navigation is allowed
            if (!this.canNavigateToScreen(screenId, options)) {
                return false;
            }

            // Handle cleanup for previous screen
            if (this.currentScreen && currentScreenConfig?.cleanup) {
                try {
                    await currentScreenConfig.cleanup();
                } catch (error) {
                    console.warn(`Cleanup failed for ${this.currentScreen}:`, error);
                }
            }

            // Update navigation history
            if (!options.skipHistory && this.currentScreen !== screenId) {
                this.updateNavigationHistory(screenId);
            }

            // Hide all screens with animation
            await this.hideAllScreens();

            // Show target screen with animation
            await this.showTargetScreen(screenId, screenConfig);

            // Update document title
            this.updateDocumentTitle(screenConfig.title);

            // Update URL if browser supports it
            this.updateURL(screenId);

            // Dispatch navigation event
            this.dispatchNavigationEvent(screenId, this.currentScreen);

            // Update current screen
            this.previousScreen = this.currentScreen;
            this.currentScreen = screenId;

            return true;

        } catch (error) {
            console.error(`Navigation to ${screenId} failed:`, error);
            this.showFeedback('Navigation failed', 'error');
            return false;
        } finally {
            this.isNavigating = false;
            
            // Process queued navigation
            if (this.navigationQueue.length > 0) {
                const next = this.navigationQueue.shift();
                setTimeout(() => this.showScreen(next.screenId, next.options), 100);
            }
        }
    }

    /**
     * Check if navigation to a screen is allowed
     * @param {string} screenId - Target screen ID
     * @param {Object} options - Navigation options
     * @returns {boolean} Whether navigation is allowed
     */
    canNavigateToScreen(screenId, options = {}) {
        const screenConfig = this.screens[screenId];
        
        // Check if screen requires authentication (future feature)
        if (screenConfig.requiresAuth && !this.isAuthenticated()) {
            this.showFeedback('Authentication required', 'error');
            return false;
        }

        // Check for unsaved changes (future feature)
        if (this.hasUnsavedChanges() && !options.force) {
            return this.confirmNavigation();
        }

        return true;
    }

    /**
     * Update navigation history
     * @param {string} screenId - Screen being navigated to
     */
    updateNavigationHistory(screenId) {
        // Add current screen to history if it's not already there
        if (this.currentScreen && this.currentScreen !== screenId) {
            this.screenHistory.push(this.currentScreen);
            
            // Limit history size
            if (this.screenHistory.length > this.maxHistoryLength) {
                this.screenHistory.shift();
            }
        }
    }

    /**
     * Hide all screens with animation
     * @returns {Promise<void>}
     */
    async hideAllScreens() {
        const hidePromises = Object.keys(this.screens).map(screenId => {
            const element = document.getElementById(screenId);
            if (element && element.classList.contains('active')) {
                return this.animateScreenOut(element);
            }
            return Promise.resolve();
        });

        await Promise.all(hidePromises);
    }

    /**
     * Show target screen with animation and initialization
     * @param {string} screenId - Screen to show
     * @param {Object} screenConfig - Screen configuration
     * @returns {Promise<void>}
     */
    async showTargetScreen(screenId, screenConfig) {
        const targetScreen = document.getElementById(screenId);
        if (!targetScreen) {
            throw new Error(`Screen element not found: ${screenId}`);
        }

        // Initialize screen if needed
        if (screenConfig.init) {
            try {
                await screenConfig.init();
            } catch (error) {
                console.warn(`Initialization failed for ${screenId}:`, error);
            }
        }

        // Show screen with animation
        await this.animateScreenIn(targetScreen);

        // Focus management for accessibility
        this.focusFirstElement(targetScreen);
    }

    /**
     * Animate screen out
     * @param {HTMLElement} element - Screen element
     * @returns {Promise<void>}
     */
    animateScreenOut(element) {
        return new Promise(resolve => {
            element.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
            element.style.opacity = '0';
            element.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                element.classList.remove('active');
                element.style.transition = '';
                element.style.opacity = '';
                element.style.transform = '';
                resolve();
            }, 300);
        });
    }

    /**
     * Animate screen in
     * @param {HTMLElement} element - Screen element
     * @returns {Promise<void>}
     */
    animateScreenIn(element) {
        return new Promise(resolve => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            element.classList.add('active');
            
            // Force reflow
            element.offsetHeight;
            
            element.style.transition = 'opacity 0.3s ease-in, transform 0.3s ease-in';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
            
            setTimeout(() => {
                element.style.transition = '';
                element.style.opacity = '';
                element.style.transform = '';
                resolve();
            }, 300);
        });
    }

    /**
     * Update document title
     * @param {string} title - New title
     */
    updateDocumentTitle(title) {
        document.title = `${title} - Barcode Battler`;
    }

    /**
     * Update URL without page reload (if supported)
     * @param {string} screenId - Current screen ID
     */
    updateURL(screenId) {
        if (window.history && window.history.pushState) {
            const url = screenId === 'home-screen' ? '/' : `/#${screenId}`;
            window.history.pushState({ screen: screenId }, '', url);
        }
    }

    /**
     * Dispatch navigation event
     * @param {string} newScreen - New screen ID
     * @param {string} oldScreen - Previous screen ID
     */
    dispatchNavigationEvent(newScreen, oldScreen) {
        const event = new CustomEvent('screenChanged', {
            detail: {
                newScreen,
                oldScreen,
                timestamp: Date.now()
            }
        });
        window.dispatchEvent(event);
    }

    /**
     * Handle screen-specific initialization when shown
     * @param {string} screenId - ID of the screen being shown
     */
    onScreenShow(screenId) {
        // This method is now handled by the screen config init functions
        console.log(`Screen shown: ${screenId}`);
    }
            case 'settings-screen':
                this.loadSettingsUI();
                break;
            case 'battle-screen':
                this.initializeBattleScreen();
                break;
        }
    }
    
    /**
     * Initialize battle screen
     */
    initializeBattleScreen() {
        // If there's no active battle, redirect to collection
        if (!this.battleEngine.getCurrentBattle()) {
            this.showScreen('collection-screen');
            this.showFeedback('Please select a creature to battle with', 'error');
        }
    }

    /**
     * Go back to the previous screen using history
     */
    goBack() {
        // Check if current screen allows back navigation
        const currentScreenConfig = this.screens[this.currentScreen];
        if (!currentScreenConfig?.allowBack) {
            console.log('Back navigation not allowed from current screen');
            return;
        }

        // Use history if available
        if (this.screenHistory.length > 0) {
            const previousScreen = this.screenHistory.pop();
            this.showScreen(previousScreen, { skipHistory: true });
            return;
        }

        // Fallback to predefined navigation
        const backNavigation = {
            'scanner-screen': 'home-screen',
            'collection-screen': 'home-screen',
            'creature-detail-screen': 'collection-screen',
            'difficulty-screen': 'collection-screen',
            'battle-screen': 'difficulty-screen',
            'settings-screen': 'home-screen'
        };

        const fallbackScreen = backNavigation[this.currentScreen];
        if (fallbackScreen) {
            this.showScreen(fallbackScreen);
        } else {
            // Ultimate fallback to home
            this.showScreen('home-screen');
        }
    }

    /**
     * Go forward in navigation history (if available)
     */
    goForward() {
        // This would require a forward history stack
        // For now, just log that it's not implemented
        console.log('Forward navigation not yet implemented');
    }

    /**
     * Clear navigation history
     */
    clearHistory() {
        this.screenHistory = [];
    }

    /**
     * Get current navigation state
     * @returns {Object} Navigation state
     */
    getNavigationState() {
        return {
            currentScreen: this.currentScreen,
            previousScreen: this.previousScreen,
            history: [...this.screenHistory],
            canGoBack: this.screenHistory.length > 0 || this.screens[this.currentScreen]?.allowBack
        };
    }
    
    /**
     * Check if user is authenticated (placeholder for future feature)
     * @returns {boolean} Authentication status
     */
    isAuthenticated() {
        // Placeholder for future authentication system
        return true;
    }

    /**
     * Check if there are unsaved changes (placeholder for future feature)
     * @returns {boolean} Whether there are unsaved changes
     */
    hasUnsavedChanges() {
        // Placeholder for future unsaved changes detection
        return false;
    }

    /**
     * Confirm navigation when there are unsaved changes
     * @returns {boolean} Whether to proceed with navigation
     */
    confirmNavigation() {
        return confirm('You have unsaved changes. Are you sure you want to leave?');
    }

    /**
     * Clean up scanner resources
     */
    cleanupScanner() {
        if (this.cameraScanner && this.cameraScanner.isScanning) {
            this.cameraScanner.stopScanning();
        }
    }

    /**
     * Clean up battle resources
     */
    cleanupBattle() {
        if (this.battleEffects) {
            this.battleEffects.stopAllEffects();
        }
    }

    /**
     * Get screen configuration
     * @param {string} screenId - Screen ID
     * @returns {Object|null} Screen configuration
     */
    getScreenConfig(screenId) {
        return this.screens[screenId] || null;
    }

    /**
     * Check if a screen exists
     * @param {string} screenId - Screen ID to check
     * @returns {boolean} Whether screen exists
     */
    hasScreen(screenId) {
        return Boolean(this.screens[screenId]);
    }

    /**
     * Get list of all available screens
     * @returns {Array<string>} Array of screen IDs
     */
    getAvailableScreens() {
        return Object.keys(this.screens);
    }

    /**
     * Handle screen cleanup when leaving
     * @param {string} screenId - Screen being left
     */
    onScreenLeave(screenId) {
        // This is now handled by the screen config cleanup functions
        console.log(`Screen left: ${screenId}`);
    }
                    this.cameraScanner.stopScanning();
                    
                    const cameraButton = document.getElementById('toggle-camera-btn');
                    if (cameraButton) {
                        cameraButton.textContent = 'Start Camera';
                        cameraButton.classList.remove('active');
                    }
                    
                    const cameraContainer = document.getElementById('camera-container');
                    if (cameraContainer) {
                        cameraContainer.classList.remove('scanning');
                    }
                }
                break;
        }
    }

    /**
     * Focus the first interactive element in a screen for accessibility
     * @param {HTMLElement} screen - Screen element
     */
    focusFirstElement(screen) {
        // Wait for screen to be fully rendered
        setTimeout(() => {
            // Look for elements in priority order
            const selectors = [
                '[data-autofocus]', // Explicit autofocus
                'input:not([disabled]):not([readonly])', // Input fields
                'button:not([disabled])', // Buttons
                'select:not([disabled])', // Select elements
                'textarea:not([disabled]):not([readonly])', // Text areas
                '[tabindex]:not([tabindex="-1"]):not([disabled])', // Tabbable elements
                'a[href]' // Links
            ];

            for (const selector of selectors) {
                const elements = screen.querySelectorAll(selector);
                if (elements.length > 0) {
                    const element = elements[0];
                    
                    // Ensure element is visible
                    if (this.isElementVisible(element)) {
                        element.focus();
                        
                        // Announce screen change to screen readers
                        this.announceScreenChange(screen);
                        return;
                    }
                }
            }

            // Fallback: focus the screen itself
            if (screen.tabIndex === -1) {
                screen.tabIndex = -1;
            }
            screen.focus();
            this.announceScreenChange(screen);
        }, 100);
    }

    /**
     * Check if an element is visible
     * @param {HTMLElement} element - Element to check
     * @returns {boolean} Whether element is visible
     */
    isElementVisible(element) {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        
        return rect.width > 0 && 
               rect.height > 0 && 
               style.visibility !== 'hidden' && 
               style.display !== 'none' &&
               style.opacity !== '0';
    }

    /**
     * Announce screen change to screen readers
     * @param {HTMLElement} screen - Screen element
     */
    announceScreenChange(screen) {
        const screenConfig = this.screens[screen.id];
        if (!screenConfig) return;

        // Create or update live region for announcements
        let liveRegion = document.getElementById('screen-announcer');
        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'screen-announcer';
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.style.position = 'absolute';
            liveRegion.style.left = '-10000px';
            liveRegion.style.width = '1px';
            liveRegion.style.height = '1px';
            liveRegion.style.overflow = 'hidden';
            document.body.appendChild(liveRegion);
        }

        // Announce the screen change
        liveRegion.textContent = `Navigated to ${screenConfig.title}`;
    }

    /**
     * Toggle high contrast mode
     * @param {boolean} enabled - Whether high contrast should be enabled
     */
    toggleHighContrast(enabled) {
        if (enabled) {
            document.body.classList.add('high-contrast');
        } else {
            document.body.classList.remove('high-contrast');
        }
        
        // Save setting
        this.saveSettings();
    }

    /**
     * Toggle manual barcode input visibility
     */
    toggleManualInput() {
        const container = document.getElementById('manual-input-container');
        const button = document.getElementById('manual-input-btn');
        
        if (container && button) {
            const isHidden = container.classList.contains('hidden');
            
            if (isHidden) {
                container.classList.remove('hidden');
                button.textContent = 'Hide Manual Input';
                // Focus the input field
                const input = document.getElementById('barcode-input');
                if (input) input.focus();
            } else {
                container.classList.add('hidden');
                button.textContent = 'Manual Input';
            }
        }
    }

    /**
     * Initialize scanner screen with camera and manual input
     */
    async initializeScanner() {
        console.log('Scanner screen initialized');
        
        // Set up camera scanner
        await this.setupCameraScanner();
        
        // Set up manual input validation and creature generation
        this.setupManualInput();
        this.setupExampleBarcodes();
    }
    
    /**
     * Set up camera scanner functionality
     */
    async setupCameraScanner() {
        const cameraButton = document.getElementById('toggle-camera-btn');
        const cameraContainer = document.getElementById('camera-container');
        const videoElement = document.getElementById('camera-video');
        
        if (!cameraButton || !cameraContainer || !videoElement) {
            console.warn('Camera UI elements not found');
            return;
        }
        
        // Check if camera scanning is supported
        if (!this.cameraScanner.isSupported()) {
            cameraButton.textContent = 'Camera Not Supported';
            cameraButton.disabled = true;
            cameraContainer.style.display = 'none';
            this.showFeedback('Camera scanning not supported on this device', 'error');
            return;
        }
        
        // Initialize camera scanner
        const initialized = await this.cameraScanner.initialize('camera-video');
        if (!initialized) {
            cameraButton.textContent = 'Camera Unavailable';
            cameraButton.disabled = true;
            this.showFeedback('Camera initialization failed', 'error');
            return;
        }
        
        // Set up camera scanner callbacks
        this.cameraScanner.onBarcodeDetected((barcode, metadata) => {
            this.handleScannedBarcode(barcode, metadata);
        });
        
        this.cameraScanner.onError((type, error) => {
            this.handleCameraError(type, error);
        });
        
        // Set up camera toggle button
        cameraButton.addEventListener('click', async () => {
            await this.toggleCamera();
        });
        
        console.log('Camera scanner setup completed');
    }
    
    /**
     * Toggle camera scanning
     */
    async toggleCamera() {
        const cameraButton = document.getElementById('toggle-camera-btn');
        const cameraContainer = document.getElementById('camera-container');
        
        if (!cameraButton || !cameraContainer) return;
        
        try {
            if (this.cameraScanner.isScanning) {
                // Stop scanning
                this.cameraScanner.stopScanning();
                cameraButton.textContent = 'Start Camera';
                cameraButton.classList.remove('active');
                cameraContainer.classList.remove('scanning');
                
                this.showFeedback('Camera stopped', 'success');
            } else {
                // Start scanning
                cameraButton.textContent = 'Starting...';
                cameraButton.disabled = true;
                
                const started = await this.cameraScanner.startScanning();
                
                if (started) {
                    cameraButton.textContent = 'Stop Camera';
                    cameraButton.classList.add('active');
                    cameraContainer.classList.add('scanning');
                    
                    this.showFeedback('Camera started - point at a barcode', 'success');
                } else {
                    cameraButton.textContent = 'Start Camera';
                    this.showFeedback('Failed to start camera', 'error');
                }
                
                cameraButton.disabled = false;
            }
        } catch (error) {
            console.error('Error toggling camera:', error);
            cameraButton.textContent = 'Start Camera';
            cameraButton.disabled = false;
            this.showFeedback('Camera error occurred', 'error');
        }
    }
    
    /**
     * Handle scanned barcode from camera with full system integration
     * @param {string} barcode - Scanned barcode
     * @param {Object} metadata - Scan metadata
     */
    handleScannedBarcode(barcode, metadata) {
        console.log(`Scanned barcode: ${barcode}`, metadata);
        
        // Validate barcode
        if (!this.barcodeProcessor.validateBarcode(barcode)) {
            this.showFeedback(`Invalid barcode scanned: ${barcode}`, 'error');
            this.announceToScreenReader(`Invalid barcode scanned: ${barcode}`, 'assertive');
            return;
        }
        
        // Generate creature with full integration
        try {
            const creature = this.barcodeProcessor.generateCreature(barcode);
            
            if (creature) {
                // Add to collection with storage integration
                const added = this.creatureManager.addCreature(creature);
                
                // Trigger storage save
                this.storageManager.saveCreatureCollection(this.creatureManager.getCollection());
                
                // Show comprehensive feedback
                if (added) {
                    this.showScannedCreatureFeedback(creature, metadata, true);
                    this.announceToScreenReader(`New creature discovered: ${creature.name}`, 'polite');
                    
                    // Track discovery analytics
                    this.trackCreatureDiscovery(creature, 'camera_scan');
                    
                    // Check for achievements
                    this.checkDiscoveryAchievements();
                } else {
                    this.showScannedCreatureFeedback(creature, metadata, false);
                    this.announceToScreenReader(`Creature already in collection: ${creature.name}`, 'polite');
                }
                
                // Update all relevant UI components
                this.updateAllCreatureDisplays();
                
                // Auto-navigate to collection if user preference is set
                if (this.getSettings().autoNavigateToCollection && added) {
                    setTimeout(() => {
                        this.showScreen('collection-screen');
                    }, 2000);
                }
                
            } else {
                this.showFeedback('Failed to generate creature from scanned barcode', 'error');
                this.announceToScreenReader('Failed to generate creature from barcode', 'assertive');
            }
        } catch (error) {
            console.error('Error processing scanned barcode:', error);
            this.showFeedback('Error processing scanned barcode', 'error');
            this.announceToScreenReader('Error processing barcode', 'assertive');
            
            // Log error for debugging
            this.logError('barcode_processing', error, { barcode, metadata });
        }
    }
    
    /**
     * Handle camera errors
     * @param {string} type - Error type
     * @param {Error} error - Error object
     */
    handleCameraError(type, error) {
        console.error(`Camera error (${type}):`, error);
        
        let message = 'Camera error occurred';
        
        switch (type) {
            case 'initialization':
                message = 'Failed to initialize camera';
                break;
            case 'permission':
                message = 'Camera permission denied';
                break;
            case 'not_found':
                message = 'No camera found';
                break;
            case 'quagga_init':
                message = 'Barcode scanner initialization failed';
                break;
            default:
                message = `Camera error: ${error.message}`;
        }
        
        this.showFeedback(message, 'error');
        
        // Reset camera button state
        const cameraButton = document.getElementById('toggle-camera-btn');
        if (cameraButton) {
            cameraButton.textContent = 'Start Camera';
            cameraButton.disabled = false;
            cameraButton.classList.remove('active');
        }
    }
    
    /**
     * Show feedback for scanned creature
     * @param {Creature} creature - Generated creature
     * @param {Object} metadata - Scan metadata
     * @param {boolean} isNew - Whether creature is new
     */
    showScannedCreatureFeedback(creature, metadata, isNew) {
        const feedback = document.getElementById('scan-feedback');
        const feedbackMessage = feedback?.querySelector('.feedback-message');
        
        if (!feedback || !feedbackMessage) return;
        
        feedback.classList.remove('hidden', 'success', 'error');
        
        const confidencePercent = Math.round(metadata.confidence * 100);
        
        if (isNew) {
            feedback.classList.add('success');
            feedbackMessage.innerHTML = `
                <div class="creature-scanned">
                    <h4>📱 Barcode Scanned Successfully!</h4>
                    <div class="scan-info">
                        <div class="scan-confidence">Confidence: ${confidencePercent}%</div>
                        <div class="scan-format">Format: ${metadata.format || 'Unknown'}</div>
                    </div>
                    <div class="creature-preview">
                        <div class="creature-name">${creature.name}</div>
                        <div class="creature-stats-mini">
                            HP: ${creature.stats.hp} | ATK: ${creature.stats.attack} | 
                            DEF: ${creature.stats.defense} | SPD: ${creature.stats.speed}
                        </div>
                    </div>
                    <div class="creature-actions">
                        <button class="btn secondary small" onclick="window.uiController.showScreen('collection-screen')">
                            View Collection
                        </button>
                    </div>
                </div>
            `;
        } else {
            feedback.classList.add('error');
            feedbackMessage.innerHTML = `
                <div class="creature-exists">
                    <h4>Barcode Already Scanned</h4>
                    <div class="scan-info">
                        <div class="scan-confidence">Confidence: ${confidencePercent}%</div>
                    </div>
                    <div class="creature-preview">
                        <div class="creature-name">${creature.name}</div>
                        <div class="creature-level">Level ${creature.level}</div>
                    </div>
                    <div class="creature-actions">
                        <button class="btn secondary small" onclick="window.uiController.showCreatureDetail('${creature.id}')">
                            View Details
                        </button>
                    </div>
                </div>
            `;
        }
        
        // Auto-hide after 4 seconds
        setTimeout(() => {
            feedback.classList.add('hidden');
        }, 4000);
    }
    
    /**
     * Set up manual barcode input with real-time validation
     */
    setupManualInput() {
        const input = document.getElementById('barcode-input');
        const button = document.getElementById('generate-creature-btn');
        const validationIcon = document.getElementById('validation-icon');
        const validationMessage = document.getElementById('barcode-validation');
        
        if (!input || !button) return;
        
        // Real-time validation on input
        input.addEventListener('input', (e) => {
            this.validateBarcodeInput(e.target.value);
        });
        
        // Handle paste events
        input.addEventListener('paste', (e) => {
            setTimeout(() => {
                this.validateBarcodeInput(e.target.value);
            }, 10);
        });
        
        // Handle Enter key
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !button.disabled) {
                button.click();
            }
        });
        
        // Handle creature generation
        button.addEventListener('click', () => {
            this.generateCreatureFromInput();
        });
    }
    
    /**
     * Set up example barcode buttons
     */
    setupExampleBarcodes() {
        const exampleButtons = document.querySelectorAll('.example-barcode');
        const input = document.getElementById('barcode-input');
        
        exampleButtons.forEach(button => {
            button.addEventListener('click', () => {
                const barcode = button.dataset.barcode;
                if (input) {
                    input.value = barcode;
                    input.focus();
                    this.validateBarcodeInput(barcode);
                }
            });
        });
    }
    
    /**
     * Validate barcode input and update UI
     * @param {string} value - Input value to validate
     */
    validateBarcodeInput(value) {
        const input = document.getElementById('barcode-input');
        const button = document.getElementById('generate-creature-btn');
        const validationIcon = document.getElementById('validation-icon');
        const validationMessage = document.getElementById('barcode-validation');
        
        if (!input || !button || !validationIcon || !validationMessage) return;
        
        // Clear previous states
        input.classList.remove('valid', 'invalid');
        validationIcon.classList.remove('valid', 'invalid');
        validationMessage.classList.remove('error', 'success');
        
        if (value.length === 0) {
            // Empty input
            button.disabled = true;
            validationMessage.textContent = '';
            return;
        }
        
        // Check for non-numeric characters
        if (!/^\d*$/.test(value)) {
            input.classList.add('invalid');
            validationIcon.classList.add('invalid');
            validationMessage.classList.add('error');
            validationMessage.textContent = 'Only numeric characters are allowed';
            button.disabled = true;
            return;
        }
        
        // Check length requirements
        if (value.length < 8) {
            input.classList.add('invalid');
            validationIcon.classList.add('invalid');
            validationMessage.classList.add('error');
            validationMessage.textContent = `Need ${8 - value.length} more digit${8 - value.length !== 1 ? 's' : ''}`;
            button.disabled = true;
            return;
        }
        
        if (value.length > 20) {
            input.classList.add('invalid');
            validationIcon.classList.add('invalid');
            validationMessage.classList.add('error');
            validationMessage.textContent = 'Maximum 20 digits allowed';
            button.disabled = true;
            return;
        }
        
        // Valid barcode
        const isValid = this.barcodeProcessor.validateBarcode(value);
        if (isValid) {
            input.classList.add('valid');
            validationIcon.classList.add('valid');
            validationMessage.classList.add('success');
            
            // Check if creature already exists
            const existingCreature = this.creatureManager.findCreatureByBarcode(value);
            if (existingCreature) {
                validationMessage.textContent = `${existingCreature.name} already in collection`;
            } else {
                validationMessage.textContent = 'Ready to generate creature!';
            }
            
            button.disabled = false;
        } else {
            input.classList.add('invalid');
            validationIcon.classList.add('invalid');
            validationMessage.classList.add('error');
            validationMessage.textContent = 'Invalid barcode format';
            button.disabled = true;
        }
    }
    
    /**
     * Generate creature from input with enhanced feedback
     */
    generateCreatureFromInput() {
        const input = document.getElementById('barcode-input');
        const button = document.getElementById('generate-creature-btn');
        const btnText = button.querySelector('.btn-text');
        const btnLoading = button.querySelector('.btn-loading');
        
        if (!input || !button) return;
        
        const barcode = input.value.trim();
        
        if (!this.barcodeProcessor.validateBarcode(barcode)) {
            this.showFeedback('Invalid barcode. Please check your input.', 'error');
            return;
        }
        
        // Show loading state
        button.disabled = true;
        btnText.classList.add('hidden');
        btnLoading.classList.remove('hidden');
        
        // Simulate processing delay for better UX
        setTimeout(() => {
            try {
                const creature = this.barcodeProcessor.generateCreature(barcode);
                
                if (creature) {
                    // Try to add creature to collection
                    const added = this.creatureManager.addCreature(creature);
                    
                    if (added) {
                        this.showCreatureGeneratedFeedback(creature, true);
                        console.log('Added creature to collection:', creature);
                        
                        // Update collection display if we're on collection screen
                        if (this.currentScreen === 'collection-screen') {
                            this.refreshCollection();
                        }
                    } else {
                        this.showCreatureGeneratedFeedback(creature, false);
                        console.log('Creature already exists:', creature);
                    }
                    
                    // Clear input and reset validation
                    input.value = '';
                    this.validateBarcodeInput('');
                } else {
                    this.showFeedback('Failed to generate creature. Please try again.', 'error');
                }
            } catch (error) {
                console.error('Error generating creature:', error);
                this.showFeedback('An error occurred while generating the creature.', 'error');
            } finally {
                // Reset button state
                btnText.classList.remove('hidden');
                btnLoading.classList.add('hidden');
                button.disabled = false;
            }
        }, 500); // Small delay for better UX
    }
    
    /**
     * Show enhanced feedback for creature generation
     * @param {Creature} creature - Generated creature
     * @param {boolean} isNew - Whether the creature is new to collection
     */
    showCreatureGeneratedFeedback(creature, isNew) {
        const feedback = document.getElementById('scan-feedback');
        const feedbackMessage = feedback?.querySelector('.feedback-message');
        
        if (!feedback || !feedbackMessage) return;
        
        feedback.classList.remove('hidden', 'success', 'error');
        
        if (isNew) {
            feedback.classList.add('success');
            feedbackMessage.innerHTML = `
                <div class="creature-generated">
                    <h4>🎉 New Creature Discovered!</h4>
                    <div class="creature-preview">
                        <div class="creature-name">${creature.name}</div>
                        <div class="creature-stats-mini">
                            HP: ${creature.stats.hp} | ATK: ${creature.stats.attack} | 
                            DEF: ${creature.stats.defense} | SPD: ${creature.stats.speed}
                        </div>
                    </div>
                    <div class="creature-actions">
                        <button class="btn secondary small" onclick="window.uiController.showScreen('collection-screen')">
                            View Collection
                        </button>
                    </div>
                </div>
            `;
        } else {
            feedback.classList.add('error');
            feedbackMessage.innerHTML = `
                <div class="creature-exists">
                    <h4>Creature Already Exists</h4>
                    <div class="creature-preview">
                        <div class="creature-name">${creature.name}</div>
                        <div class="creature-level">Level ${creature.level}</div>
                    </div>
                    <div class="creature-actions">
                        <button class="btn secondary small" onclick="window.uiController.showCreatureDetail('${creature.id}')">
                            View Details
                        </button>
                    </div>
                </div>
            `;
        }
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            feedback.classList.add('hidden');
        }, 5000);
    }

    /**
     * Refresh the creature collection display
     */
    refreshCollection() {
        console.log('Collection refreshed');
        
        const grid = document.getElementById('creature-grid');
        const sortSelect = document.getElementById('sort-select');
        
        if (!grid) return;
        
        const creatures = this.creatureManager.getCollection();
        
        if (creatures.length === 0) {
            grid.innerHTML = `
                <div class="empty-collection">
                    <p>No creatures discovered yet!</p>
                    <p>Scan some barcodes to start your collection.</p>
                    <button class="btn primary" onclick="window.uiController.showScreen('scanner-screen')">
                        Start Scanning
                    </button>
                </div>
            `;
            return;
        }
        
        // Sort creatures based on selected criteria
        const sortCriteria = sortSelect ? sortSelect.value : 'name';
        const sortedCreatures = this.creatureManager.sortCollection(sortCriteria, false); // Descending by default
        
        // Generate creature cards with enhanced information
        grid.innerHTML = sortedCreatures.map(creature => {
            const hpPercentage = (creature.stats.hp / creature.stats.maxHp) * 100;
            const winRate = this.calculateWinRate(creature);
            const experiencePercentage = creature.experienceToNext > 0 ? 
                (creature.experience / creature.experienceToNext) * 100 : 100;
            
            return `
                <div class="creature-card" data-creature-id="${creature.id}" 
                     tabindex="0" role="button" aria-label="View details for ${creature.name}">
                    <div class="creature-card-header">
                        <h3 class="creature-name">${creature.name}</h3>
                        <span class="creature-level">Lv.${creature.level}</span>
                    </div>
                    <div class="creature-stats-summary">
                        <div class="stat-bar">
                            <span class="stat-label">HP</span>
                            <div class="stat-bar-fill">
                                <div class="stat-bar-value" style="width: ${hpPercentage}%"></div>
                            </div>
                            <span class="stat-text">${creature.stats.hp}/${creature.stats.maxHp}</span>
                        </div>
                        <div class="stat-bar">
                            <span class="stat-label">XP</span>
                            <div class="stat-bar-fill">
                                <div class="stat-bar-value experience" style="width: ${experiencePercentage}%"></div>
                            </div>
                            <span class="stat-text">${creature.experience}/${creature.experienceToNext}</span>
                        </div>
                        <div class="creature-stats-mini">
                            <span>ATK: ${creature.stats.attack}</span>
                            <span>DEF: ${creature.stats.defense}</span>
                            <span>SPD: ${creature.stats.speed}</span>
                        </div>
                    </div>
                    <div class="creature-card-footer">
                        <span class="creature-barcode">Barcode: ${creature.barcode}</span>
                        <span class="creature-battles">
                            W:${creature.battlesWon} L:${creature.battlesLost} 
                            ${winRate > 0 ? `(${Math.round(winRate * 100)}%)` : ''}
                        </span>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add click and keyboard handlers for creature cards
        grid.querySelectorAll('.creature-card').forEach(card => {
            const creatureId = card.dataset.creatureId;
            
            // Click handler
            card.addEventListener('click', () => {
                this.showCreatureDetail(creatureId);
            });
            
            // Keyboard handler
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.showCreatureDetail(creatureId);
                }
            });
        });
        
        // Update sort select handler (remove existing listeners first)
        if (sortSelect) {
            const newSortSelect = sortSelect.cloneNode(true);
            sortSelect.parentNode.replaceChild(newSortSelect, sortSelect);
            
            newSortSelect.addEventListener('change', () => {
                this.refreshCollection();
            });
        }
        
        // Set up search functionality
        const searchInput = document.getElementById('creature-search');
        if (searchInput) {
            // Remove existing listener
            const newSearchInput = searchInput.cloneNode(true);
            searchInput.parentNode.replaceChild(newSearchInput, searchInput);
            
            newSearchInput.addEventListener('input', (e) => {
                this.filterCollection(e.target.value);
            });
        }
        
        // Show collection stats
        this.updateCollectionStats();
    }
    
    /**
     * Calculate win rate for a creature
     * @param {Creature} creature - Creature to calculate win rate for
     * @returns {number} Win rate as decimal (0.0 to 1.0)
     */
    calculateWinRate(creature) {
        const totalBattles = creature.battlesWon + creature.battlesLost;
        return totalBattles > 0 ? creature.battlesWon / totalBattles : 0;
    }
    
    /**
     * Filter collection display based on search term
     * @param {string} searchTerm - Search term to filter by
     */
    filterCollection(searchTerm) {
        const cards = document.querySelectorAll('.creature-card');
        const term = searchTerm.toLowerCase().trim();
        
        if (!term) {
            // Show all cards if search is empty
            cards.forEach(card => {
                card.style.display = 'block';
            });
            return;
        }
        
        cards.forEach(card => {
            const creatureName = card.querySelector('.creature-name').textContent.toLowerCase();
            const creatureBarcode = card.querySelector('.creature-barcode').textContent.toLowerCase();
            
            if (creatureName.includes(term) || creatureBarcode.includes(term)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
        
        // Update empty state if no results
        this.updateEmptyState(searchTerm);
    }
    
    /**
     * Update empty state display for search results
     * @param {string} searchTerm - Current search term
     */
    updateEmptyState(searchTerm) {
        const grid = document.getElementById('creature-grid');
        const visibleCards = grid.querySelectorAll('.creature-card[style*="block"], .creature-card:not([style])');
        
        let emptyState = grid.querySelector('.search-empty-state');
        
        if (visibleCards.length === 0 && searchTerm) {
            if (!emptyState) {
                emptyState = document.createElement('div');
                emptyState.className = 'search-empty-state';
                grid.appendChild(emptyState);
            }
            
            emptyState.innerHTML = `
                <div class="empty-collection">
                    <p>No creatures found matching "${searchTerm}"</p>
                    <p>Try a different search term or discover more creatures!</p>
                </div>
            `;
            emptyState.style.display = 'block';
        } else if (emptyState) {
            emptyState.style.display = 'none';
        }
    }
    
    /**
     * Shows detailed view of a creature
     * @param {string} creatureId - ID of the creature to show
     */
    showCreatureDetail(creatureId) {
        const creature = this.creatureManager.getCreature(creatureId);
        if (!creature) {
            console.error('Creature not found:', creatureId);
            return;
        }
        
        // Update creature detail screen
        document.getElementById('creature-detail-name').textContent = creature.name;
        document.getElementById('detail-level').textContent = creature.level;
        document.getElementById('detail-hp').textContent = `${creature.stats.hp}/${creature.stats.maxHp}`;
        document.getElementById('detail-attack').textContent = creature.stats.attack;
        document.getElementById('detail-defense').textContent = creature.stats.defense;
        document.getElementById('detail-speed').textContent = creature.stats.speed;
        document.getElementById('detail-experience').textContent = `${creature.experience}/${creature.experienceToNext}`;
        document.getElementById('detail-barcode').textContent = creature.barcode;
        document.getElementById('detail-battles-won').textContent = creature.battlesWon;
        document.getElementById('detail-battles-lost').textContent = creature.battlesLost;
        
        // Store current creature for battle
        this.selectedCreature = creature;
        
        // Show detail screen
        this.showScreen('creature-detail-screen');
    }
    
    /**
     * Updates collection statistics display
     */
    updateCollectionStats() {
        const stats = this.creatureManager.getCollectionStats();
        console.log('Collection stats:', stats);
        
        // Add collection stats to the collection screen header
        const collectionScreen = document.getElementById('collection-screen');
        let statsDisplay = collectionScreen.querySelector('.collection-stats');
        
        if (!statsDisplay) {
            statsDisplay = document.createElement('div');
            statsDisplay.className = 'collection-stats';
            
            const controlsContainer = collectionScreen.querySelector('.collection-controls');
            if (controlsContainer) {
                controlsContainer.parentNode.insertBefore(statsDisplay, controlsContainer);
            }
        }
        
        if (stats.totalCreatures > 0) {
            statsDisplay.innerHTML = `
                <div class="stats-summary">
                    <div class="stat-item">
                        <span class="stat-number">${stats.totalCreatures}</span>
                        <span class="stat-label">Creatures</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${stats.averageLevel}</span>
                        <span class="stat-label">Avg Level</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${stats.totalBattles}</span>
                        <span class="stat-label">Battles</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${Math.round(stats.overallWinRate * 100)}%</span>
                        <span class="stat-label">Win Rate</span>
                    </div>
                </div>
            `;
        } else {
            statsDisplay.innerHTML = '';
        }
    }

    /**
     * Load settings into the UI
     */
    loadSettingsUI() {
        const settings = this.loadSettings();
        
        // Update UI elements with current settings
        const difficultySelect = document.getElementById('difficulty-select');
        const soundToggle = document.getElementById('sound-toggle');
        const contrastToggle = document.getElementById('high-contrast-toggle');
        
        if (difficultySelect) difficultySelect.value = settings.difficulty;
        if (soundToggle) soundToggle.checked = settings.soundEnabled;
        if (contrastToggle) contrastToggle.checked = settings.highContrastMode;
        
        // Update storage information
        this.updateStorageInfo();
    }
    
    /**
     * Update storage information display
     */
    updateStorageInfo() {
        const storageStats = document.getElementById('storage-stats');
        if (!storageStats) return;
        
        const summary = this.storageManager.getDataSummary();
        const storageInfo = this.storageManager.getStorageInfo();
        
        if (!summary.available) {
            storageStats.innerHTML = '<p>Storage not available</p>';
            return;
        }
        
        const usagePercentage = storageInfo.usagePercentage || 0;
        const usageColor = usagePercentage > 80 ? '#f44336' : usagePercentage > 60 ? '#FFC107' : '#4CAF50';
        
        storageStats.innerHTML = `
            <div class="storage-stat-item">
                <span class="storage-stat-label">Creatures:</span>
                <span class="storage-stat-value">${summary.creatures.count}</span>
            </div>
            <div class="storage-stat-item">
                <span class="storage-stat-label">Average Level:</span>
                <span class="storage-stat-value">${summary.creatures.averageLevel.toFixed(1)}</span>
            </div>
            <div class="storage-stat-item">
                <span class="storage-stat-label">Battles:</span>
                <span class="storage-stat-value">${summary.battles.count}</span>
            </div>
            <div class="storage-stat-item">
                <span class="storage-stat-label">Storage Used:</span>
                <span class="storage-stat-value">${(storageInfo.totalSize / 1024).toFixed(1)} KB</span>
            </div>
            <div class="storage-usage-bar">
                <div class="storage-usage-fill" style="width: ${usagePercentage}%; background: ${usageColor}"></div>
            </div>
            <div class="storage-stat-item">
                <span class="storage-stat-label">Usage:</span>
                <span class="storage-stat-value">${usagePercentage.toFixed(1)}%</span>
            </div>
        `;
    }
    
    /**
     * Create and download backup
     */
    createBackup() {
        try {
            const backup = this.storageManager.createBackup();
            if (!backup) {
                this.showFeedback('Failed to create backup', 'error');
                return;
            }
            
            // Create download link
            const blob = new Blob([backup], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.getElementById('backup-download-link');
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `barcode-battler-backup-${timestamp}.json`;
            
            link.href = url;
            link.download = filename;
            link.click();
            
            // Clean up
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            
            this.showFeedback('Backup created successfully!', 'success');
        } catch (error) {
            console.error('Error creating backup:', error);
            this.showFeedback('Failed to create backup', 'error');
        }
    }
    
    /**
     * Show restore dialog
     */
    showRestoreDialog() {
        if (confirm('This will restore your game data from a backup file. Current data may be overwritten. Continue?')) {
            document.getElementById('backup-file-input').click();
        }
    }
    
    /**
     * Handle backup file selection
     */
    handleBackupFileSelected(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const backupData = e.target.result;
                const result = this.storageManager.restoreFromBackup(backupData, false);
                
                if (result.success) {
                    this.showFeedback(`Backup restored! ${result.restored} items restored.`, 'success');
                    
                    // Refresh the UI
                    this.creatureManager.loadCreatures();
                    this.refreshCollection();
                    this.updateStorageInfo();
                } else {
                    this.showFeedback(`Restore failed: ${result.error}`, 'error');
                }
            } catch (error) {
                console.error('Error restoring backup:', error);
                this.showFeedback('Invalid backup file', 'error');
            }
        };
        
        reader.readAsText(file);
        
        // Clear the input
        event.target.value = '';
    }
    
    /**
     * Show reset dialog
     */
    showResetDialog() {
        if (confirm('This will permanently delete all your game data including creatures, settings, and battle history. This cannot be undone. Are you sure?')) {
            if (confirm('Are you absolutely sure? This action cannot be undone!')) {
                this.resetGameData();
            }
        }
    }
    
    /**
     * Reset all game data
     */
    resetGameData() {
        try {
            const success = this.storageManager.clearAllData();
            if (success) {
                // Reload managers with fresh data
                this.creatureManager.loadCreatures();
                
                // Refresh UI
                this.refreshCollection();
                this.updateStorageInfo();
                this.loadSettingsUI();
                
                this.showFeedback('Game data reset successfully', 'success');
            } else {
                this.showFeedback('Failed to reset game data', 'error');
            }
        } catch (error) {
            console.error('Error resetting game data:', error);
            this.showFeedback('Failed to reset game data', 'error');
        }
    }

    /**
     * Load game settings from storage
     * @returns {GameSettings} Current game settings
     */
    loadSettings() {
        const defaultSettings = {
            difficulty: 'medium',
            soundEnabled: true,
            highContrastMode: false,
            cameraEnabled: true,
            lastBackupDate: null
        };

        try {
            const settings = this.storageManager.loadData(GameConstants.STORAGE_KEYS.SETTINGS, defaultSettings);
            
            // Apply high contrast mode if enabled
            if (settings.highContrastMode) {
                document.body.classList.add('high-contrast');
            }
            
            // Apply sound settings
            if (this.battleEffects) {
                this.battleEffects.setSoundEnabled(settings.soundEnabled);
            }
            
            return settings;
        } catch (error) {
            console.error('Error loading settings:', error);
            return defaultSettings;
        }
    }

    /**
     * Save current settings to storage
     */
    saveSettings() {
        const settings = {
            difficulty: document.getElementById('difficulty-select')?.value || 'medium',
            soundEnabled: document.getElementById('sound-toggle')?.checked || true,
            highContrastMode: document.getElementById('high-contrast-toggle')?.checked || false,
            cameraEnabled: true,
            lastBackupDate: new Date().toISOString()
        };

        try {
            const success = this.storageManager.saveData(GameConstants.STORAGE_KEYS.SETTINGS, settings);
            if (!success) {
                console.warn('Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    /**
     * Show feedback message to user
     * @param {string} message - Message to display
     * @param {'success'|'error'} type - Type of message
     */
    showFeedback(message, type = 'success') {
        const feedback = document.getElementById('scan-feedback');
        if (feedback) {
            feedback.classList.remove('hidden', 'success', 'error');
            feedback.classList.add(type);
            feedback.querySelector('.feedback-message').textContent = message;
            
            // Auto-hide after 3 seconds
            setTimeout(() => {
                feedback.classList.add('hidden');
            }, 3000);
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI Controller
    window.uiController = new UIController();
    
    console.log('Barcode Battler Game initialized');
    console.log('Current screen:', window.uiController.currentScreen);
    
    // Test functionality
    console.log('--- System Tests ---');
    console.log('BarcodeProcessor loaded:', typeof window.uiController.barcodeProcessor);
    console.log('CreatureManager loaded:', typeof window.uiController.creatureManager);
    
    // Show collection stats
    const stats = window.uiController.creatureManager.getCollectionStats();
    console.log('Collection stats:', stats);
    
    // Test creature generation and management
    const testCreature = window.uiController.barcodeProcessor.generateCreature('12345678');
    if (testCreature) {
        console.log('Test creature generated:', testCreature.name, testCreature.stats);
        
        // Test adding to collection
        const added = window.uiController.creatureManager.addCreature(testCreature);
        console.log('Added to collection:', added);
        
        if (added) {
            console.log('Collection size:', window.uiController.creatureManager.getCollection().length);
        }
    }
});   
 /**
     * Start battle with selected creature
     * @param {Creature} creature - Player's creature
     */
    startBattleWithCreature(creature) {
        try {
            // Generate opponent creature based on difficulty
            const settings = this.loadSettings();
            const difficulty = settings.difficulty || 'medium';
            const opponent = this.generateOpponentCreature(difficulty);
            
            // Start battle
            const battle = this.battleEngine.initiateBattle(creature, opponent, difficulty);
            
            // Update battle UI
            this.updateBattleUI(battle);
            
            // Show battle screen
            this.showScreen('battle-screen');
            
            console.log('Battle started:', battle);
        } catch (error) {
            console.error('Error starting battle:', error);
            this.showFeedback('Failed to start battle', 'error');
        }
    }
    
    /**
     * Generate opponent creature based on difficulty
     * @param {string} difficulty - Battle difficulty
     * @returns {Creature} Generated opponent creature
     */
    generateOpponentCreature(difficulty) {
        // Generate a random barcode for opponent
        const barcodeLength = 8 + Math.floor(Math.random() * 5); // 8-12 digits
        let barcode = '';
        for (let i = 0; i < barcodeLength; i++) {
            barcode += Math.floor(Math.random() * 10);
        }
        
        const opponent = this.barcodeProcessor.generateCreature(barcode);
        if (!opponent) {
            throw new Error('Failed to generate opponent creature');
        }
        
        // Adjust opponent stats based on difficulty
        const difficultyMultipliers = {
            'easy': 0.8,
            'medium': 1.0,
            'hard': 1.3
        };
        
        const multiplier = difficultyMultipliers[difficulty] || 1.0;
        
        opponent.stats.hp = Math.floor(opponent.stats.hp * multiplier);
        opponent.stats.maxHp = opponent.stats.hp;
        opponent.stats.attack = Math.floor(opponent.stats.attack * multiplier);
        opponent.stats.defense = Math.floor(opponent.stats.defense * multiplier);
        opponent.stats.speed = Math.floor(opponent.stats.speed * multiplier);
        
        // Adjust level based on difficulty
        if (difficulty === 'hard') {
            opponent.level += 2;
        } else if (difficulty === 'easy') {
            opponent.level = Math.max(1, opponent.level - 1);
        }
        
        return opponent;
    }
    
    /**
     * Update battle UI with current battle state
     * @param {Battle} battle - Current battle
     */
    updateBattleUI(battle) {
        // Update battle status
        document.getElementById('battle-turn-count').textContent = battle.turnCount + 1;
        document.getElementById('battle-difficulty').textContent = battle.difficulty.charAt(0).toUpperCase() + battle.difficulty.slice(1);
        
        // Update turn indicator
        const turnIndicator = document.getElementById('current-turn-indicator');
        const isPlayerTurn = battle.currentTurn === 'player';
        turnIndicator.textContent = isPlayerTurn ? 'Your Turn' : 'Opponent\'s Turn';
        turnIndicator.className = isPlayerTurn ? '' : 'opponent-turn';
        
        // Update creature panels
        this.updateCreaturePanel('player', battle.playerCreature, battle, isPlayerTurn);
        this.updateCreaturePanel('opponent', battle.opponentCreature, battle, !isPlayerTurn);
        
        // Update battle log
        this.updateBattleLog(battle.battleLog);
        
        // Update action buttons state
        this.updateBattleActions(battle);
        
        // Update action previews
        this.updateActionPreviews(battle);
    }
    
    /**
     * Update creature panel display
     * @param {string} side - 'player' or 'opponent'
     * @param {Creature} creature - Creature data
     * @param {Battle} battle - Battle data
     * @param {boolean} isActive - Whether this creature's turn
     */
    updateCreaturePanel(side, creature, battle, isActive) {
        // Update creature names
        if (side === 'player') {
            document.getElementById('player-creature-name').textContent = creature.name;
            document.getElementById('player-level').textContent = creature.level;
        } else {
            const aiPersonality = battle.aiInfo ? ` (${battle.aiInfo.personality})` : '';
            document.getElementById('opponent-creature-name').textContent = creature.name + aiPersonality;
            document.getElementById('opponent-level').textContent = creature.level;
            
            // Update AI type display
            const aiType = battle.aiInfo ? battle.aiInfo.personality : 'Basic';
            document.getElementById('opponent-ai-type').textContent = aiType;
        }
        
        // Update panel active state
        const panel = document.querySelector(`.${side}-panel`);
        if (panel) {
            panel.classList.toggle('active', isActive);
        }
        
        // Update creature status
        const statusElement = document.getElementById(`${side}-status`);
        if (statusElement) {
            const actions = battle[`${side === 'player' ? 'player' : 'opponent'}Actions`];
            let status = '';
            
            if (actions.lastAction === 'defend') {
                status = '🛡️ Defending';
            } else if (actions.lastAction === 'special') {
                status = '✨ Charged up';
            } else if (isActive) {
                status = '⚡ Ready to act';
            }
            
            statusElement.textContent = status;
        }
        
        // Update HP bars and text
        this.updateCreatureHP('player', battle.playerCreature);
        this.updateCreatureHP('opponent', battle.opponentCreature);
        
        // Update stats
        document.getElementById('player-attack').textContent = creature.stats.attack;
        document.getElementById('player-defense').textContent = creature.stats.defense;
        document.getElementById('player-speed').textContent = creature.stats.speed;
        
        if (side === 'player') {
            const specialUsesLeft = 3 - battle.playerActions.specialAttacksUsed;
            document.getElementById('player-special-uses').textContent = specialUsesLeft;
        } else {
            document.getElementById('opponent-attack').textContent = creature.stats.attack;
            document.getElementById('opponent-defense').textContent = creature.stats.defense;
            document.getElementById('opponent-speed').textContent = creature.stats.speed;
        }
    }
    
    /**
     * Update creature HP display
     * @param {string} side - 'player' or 'opponent'
     * @param {Creature} creature - Creature data
     */
    updateCreatureHP(side, creature) {
        const hpFill = document.getElementById(`${side}-hp-fill`);
        const hpText = document.getElementById(`${side}-hp-text`);
        
        if (hpFill && hpText) {
            const hpPercentage = (creature.stats.hp / creature.stats.maxHp) * 100;
            hpFill.style.width = `${hpPercentage}%`;
            hpText.textContent = `${creature.stats.hp}/${creature.stats.maxHp}`;
            
            // Change color based on HP percentage
            if (hpPercentage <= 25) {
                hpFill.style.background = 'linear-gradient(90deg, #f44336, #d32f2f)';
            } else if (hpPercentage <= 50) {
                hpFill.style.background = 'linear-gradient(90deg, #FF9800, #F57C00)';
            } else {
                hpFill.style.background = 'linear-gradient(90deg, #4CAF50, #8BC34A)';
            }
        }
    }
    
    /**
     * Update battle log display
     * @param {Array} battleLog - Battle log entries
     */
    updateBattleLog(battleLog) {
        const logContainer = document.getElementById('battle-log');
        if (!logContainer) return;
        
        // Show last 10 entries
        const recentEntries = battleLog.slice(-10);
        
        logContainer.innerHTML = recentEntries.map(entry => {
            let className = 'log-entry';
            if (entry.type === 'action' && entry.damage > 0) {
                className += entry.critical ? ' critical' : ' damage';
            }
            
            return `<div class="${className}">${entry.message}</div>`;
        }).join('');
        
        // Scroll to bottom
        logContainer.scrollTop = logContainer.scrollHeight;
    }
    
    /**
     * Update battle action buttons
     * @param {Battle} battle - Current battle
     */
    updateBattleActions(battle) {
        const actionsContainer = document.getElementById('battle-actions');
        const actionPanel = document.querySelector('.battle-action-panel');
        const resultContainer = document.getElementById('battle-result');
        
        if (!actionsContainer || !resultContainer) return;
        
        if (battle.status === 'active') {
            // Show/hide actions based on turn
            const isPlayerTurn = battle.currentTurn === 'player';
            
            if (actionPanel) {
                actionPanel.style.display = isPlayerTurn ? 'block' : 'none';
            }
            
            resultContainer.classList.add('hidden');
            
            // Update help text
            this.updateActionHelpText(battle);
            
            if (!isPlayerTurn) {
                // Show AI thinking indicator
                this.addBattleEffect('🤔 AI is thinking...', 'system');
                
                // Execute AI action after a short delay
                setTimeout(() => {
                    this.executeAIAction();
                }, 1500);
            }
        } else {
            // Battle ended
            if (actionPanel) {
                actionPanel.style.display = 'none';
            }
            this.showBattleResult(battle);
        }
    }
    
    /**
     * Execute player battle action
     * @param {string} actionType - Type of action
     */
    executeBattleAction(actionType) {
        try {
            // Animate player action
            this.battleEffects.animateAttack('player', actionType);
            
            // Small delay for animation
            setTimeout(() => {
                const result = this.battleEngine.executePlayerAction(actionType);
                
                // Animate effects based on result
                if (result.damage > 0) {
                    this.battleEffects.animateDamage('opponent', result.damage, result.critical);
                }
                
                if (actionType === 'defend' && result.attackerHp > result.attackerHp - 10) {
                    this.battleEffects.animateHeal('player', 10);
                }
                
                // Update UI with result
                const battle = this.battleEngine.getCurrentBattle();
                this.updateBattleUI(battle);
                
                // Animate HP changes
                this.battleEffects.animateHPChange('opponent', battle.opponentCreature.stats.hp, battle.opponentCreature.stats.maxHp);
                if (actionType === 'defend') {
                    this.battleEffects.animateHPChange('player', battle.playerCreature.stats.hp, battle.playerCreature.stats.maxHp);
                }
                
                console.log('Player action result:', result);
            }, 300);
        } catch (error) {
            console.error('Error executing player action:', error);
            this.showFeedback('Failed to execute action', 'error');
        }
    }
    
    /**
     * Execute AI action
     */
    executeAIAction() {
        try {
            // Animate AI action
            const battle = this.battleEngine.getCurrentBattle();
            const aiActionType = this.battleEngine.makeAIDecision();
            
            this.battleEffects.animateAttack('opponent', aiActionType);
            
            // Small delay for animation
            setTimeout(() => {
                const result = this.battleEngine.executeAIAction();
                
                // Animate effects based on result
                if (result.damage > 0) {
                    this.battleEffects.animateDamage('player', result.damage, result.critical);
                }
                
                if (result.actionType === 'defend' && result.attackerHp > result.attackerHp - 10) {
                    this.battleEffects.animateHeal('opponent', 10);
                }
                
                // Update UI with result
                const updatedBattle = this.battleEngine.getCurrentBattle();
                this.updateBattleUI(updatedBattle);
                
                // Animate HP changes
                this.battleEffects.animateHPChange('player', updatedBattle.playerCreature.stats.hp, updatedBattle.playerCreature.stats.maxHp);
                if (result.actionType === 'defend') {
                    this.battleEffects.animateHPChange('opponent', updatedBattle.opponentCreature.stats.hp, updatedBattle.opponentCreature.stats.maxHp);
                }
                
                console.log('AI action result:', result);
            }, 300);
        } catch (error) {
            console.error('Error executing AI action:', error);
        }
    }
    
    /**
     * Show battle result
     * @param {Battle} battle - Completed battle
     */
    showBattleResult(battle) {
        const resultContainer = document.getElementById('battle-result');
        const resultTitle = document.getElementById('battle-result-title');
        const resultMessage = document.getElementById('battle-result-message');
        const resultIcon = document.getElementById('battle-result-icon');
        
        if (!resultContainer || !resultTitle || !resultMessage) return;
        
        const isVictory = battle.status === 'won';
        
        // Update title and icon
        resultTitle.textContent = isVictory ? 'Victory!' : 'Defeat!';
        resultTitle.style.color = isVictory ? '#4CAF50' : '#f44336';
        
        if (resultIcon) {
            resultIcon.textContent = isVictory ? '🏆' : '💀';
        }
        
        // Update message
        if (isVictory) {
            resultMessage.textContent = `${battle.playerCreature.name} wins! Gained ${battle.experienceReward} experience points!`;
        } else {
            resultMessage.textContent = `${battle.playerCreature.name} was defeated. Better luck next time!`;
        }
        
        // Update battle statistics
        const duration = battle.endTime - battle.startTime;
        const minutes = Math.floor(duration / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);
        
        document.getElementById('battle-duration').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('battle-turns').textContent = battle.turnCount;
        
        // Calculate total damage dealt
        const totalDamage = battle.battleLog
            .filter(entry => entry.type === 'action' && entry.actor === 'player' && entry.damage)
            .reduce((sum, entry) => sum + entry.damage, 0);
        
        document.getElementById('total-damage-dealt').textContent = totalDamage;
        
        resultContainer.classList.remove('hidden');
        
        // Play victory/defeat animations
        if (isVictory) {
            this.battleEffects.celebrateVictory('player');
        } else {
            this.battleEffects.showDefeat('player');
        }
    }
    
    /**
     * Handle battle end
     */
    handleBattleEnd() {
        const battle = this.battleEngine.getCurrentBattle();
        
        if (battle && battle.status === 'won') {
            // Award experience to player creature
            const experienceResult = this.creatureManager.awardExperience(
                battle.playerCreature.id,
                battle.experienceReward
            );
            
            if (experienceResult.success && experienceResult.levelsGained > 0) {
                this.showFeedback(
                    `${battle.playerCreature.name} gained ${experienceResult.levelsGained} level(s)!`,
                    'success'
                );
            }
        }
        
        // Reset battle and return to collection
        this.battleEngine.resetBattle();
        this.showScreen('collection-screen');
        this.refreshCollection();
    }
} 
   /**
     * Update action damage previews
     * @param {Battle} battle - Current battle
     */
    updateActionPreviews(battle) {
        const playerCreature = battle.playerCreature;
        const opponentCreature = battle.opponentCreature;
        
        // Calculate approximate damage values
        const baseDamage = Math.max(1, playerCreature.stats.attack - opponentCreature.stats.defense);
        const specialDamage = Math.floor(baseDamage * 1.3);
        const healAmount = Math.floor(playerCreature.stats.maxHp * 0.1);
        
        // Update preview values
        document.getElementById('attack-damage-preview').textContent = baseDamage;
        document.getElementById('special-damage-preview').textContent = specialDamage;
        document.getElementById('defend-heal-preview').textContent = healAmount;
        
        // Update special uses left
        const specialUsesLeft = 3 - battle.playerActions.specialAttacksUsed;
        document.getElementById('special-uses-left').textContent = specialUsesLeft;
        
        // Disable special attack if no uses left
        const specialBtn = document.getElementById('special-attack-btn');
        if (specialBtn) {
            specialBtn.disabled = specialUsesLeft <= 0;
            if (specialUsesLeft <= 0) {
                specialBtn.querySelector('.action-stats').textContent = 'No uses remaining';
            }
        }
    }
    
    /**
     * Update action help text based on battle state
     * @param {Battle} battle - Current battle
     */
    updateActionHelpText(battle) {
        const helpText = document.getElementById('action-help-text');
        if (!helpText) return;
        
        const isPlayerTurn = battle.currentTurn === 'player';
        
        if (!isPlayerTurn) {
            helpText.textContent = 'Waiting for opponent to make their move...';
            return;
        }
        
        const playerHpPercent = battle.playerCreature.stats.hp / battle.playerCreature.stats.maxHp;
        const opponentHpPercent = battle.opponentCreature.stats.hp / battle.opponentCreature.stats.maxHp;
        
        let suggestion = '';
        
        if (playerHpPercent < 0.3) {
            suggestion = 'Your HP is low - consider defending to recover health';
        } else if (opponentHpPercent < 0.3) {
            suggestion = 'Opponent is weakened - finish them with a strong attack!';
        } else if (battle.playerActions.specialAttacksUsed === 0) {
            suggestion = 'Try using a special attack for extra damage';
        } else {
            suggestion = 'Choose your action wisely - every move counts!';
        }
        
        helpText.textContent = suggestion;
    }
    
    /**
     * Add battle effect animation
     * @param {string} effect - Effect text to display
     * @param {string} type - Effect type ('damage', 'heal', 'critical')
     */
    addBattleEffect(effect, type = 'normal') {
        const effectsContainer = document.getElementById('battle-effects');
        if (!effectsContainer) return;
        
        const effectElement = document.createElement('div');
        effectElement.className = `battle-effect ${type}`;
        effectElement.textContent = effect;
        
        effectsContainer.appendChild(effectElement);
        
        // Animate and remove
        setTimeout(() => {
            effectElement.style.opacity = '0';
            effectElement.style.transform = 'translateY(-20px)';
        }, 100);
        
        setTimeout(() => {
            if (effectElement.parentNode) {
                effectElement.parentNode.removeChild(effectElement);
            }
        }, 2000);
    }
    
    /**
     * Clear battle log
     */
    clearBattleLog() {
        const logContainer = document.getElementById('battle-log');
        if (logContainer) {
            logContainer.innerHTML = '<div class="log-entry system">Battle log cleared</div>';
        }
    }
    
    /**
     * Handle rematch request
     */
    handleRematch() {
        const battle = this.battleEngine.getCurrentBattle();
        if (!battle) return;
        
        // Reset battle with same creatures
        const playerCreature = battle.playerCreature;
        const opponent = this.generateOpponentCreature(battle.difficulty);
        
        // Start new battle
        this.battleEngine.resetBattle();
        const newBattle = this.battleEngine.initiateBattle(playerCreature, opponent, battle.difficulty);
        
        // Update UI
        this.updateBattleUI(newBattle);
        
        // Hide result modal
        document.getElementById('battle-result').classList.add('hidden');
        
        this.showFeedback('Rematch started!', 'success');
    }
} 
   /**
     * Set up difficulty selection screen
     */
    setupDifficultyScreen() {
        this.renderDifficultyOptions();
        this.renderDifficultyProgress();
        this.renderBattleStats();
        this.setupDifficultyEventListeners();
    }

    /**
     * Render difficulty options
     */
    renderDifficultyOptions() {
        const container = document.getElementById('difficulty-options');
        if (!container) return;

        const difficulties = this.difficultyManager.getAllDifficulties();
        const currentDifficulty = this.difficultyManager.getCurrentDifficulty();

        container.innerHTML = difficulties.map(difficulty => {
            const isSelected = difficulty.id === currentDifficulty;
            const isLocked = !difficulty.unlocked;

            return `
                <div class="difficulty-option ${isSelected ? 'selected' : ''} ${isLocked ? 'locked' : ''}" 
                     data-difficulty="${difficulty.id}">
                    <div class="difficulty-header">
                        <span class="difficulty-icon">${difficulty.icon}</span>
                        <h3 class="difficulty-name">${difficulty.name}</h3>
                    </div>
                    
                    <p class="difficulty-description">${difficulty.description}</p>
                    
                    <div class="difficulty-stats">
                        <div class="difficulty-stat">
                            <span class="difficulty-stat-label">Opponent Strength:</span>
                            <span class="difficulty-stat-value">${Math.round(difficulty.opponentStatMultiplier * 100)}%</span>
                        </div>
                        <div class="difficulty-stat">
                            <span class="difficulty-stat-label">Experience Bonus:</span>
                            <span class="difficulty-stat-value">+${Math.round((difficulty.experienceMultiplier - 1) * 100)}%</span>
                        </div>
                        <div class="difficulty-stat">
                            <span class="difficulty-stat-label">Critical Hit Rate:</span>
                            <span class="difficulty-stat-value">${Math.round(difficulty.criticalHitChance * 100)}%</span>
                        </div>
                        <div class="difficulty-stat">
                            <span class="difficulty-stat-label">Special Attacks:</span>
                            <span class="difficulty-stat-value">${Math.round(difficulty.specialAttackFrequency * 100)}%</span>
                        </div>
                    </div>
                    
                    ${isLocked && difficulty.requirements ? `
                        <div class="difficulty-unlock-requirements">
                            <h4>🔒 Unlock Requirements</h4>
                            <p>${difficulty.requirements.description}</p>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        // Add click handlers for unlocked difficulties
        container.querySelectorAll('.difficulty-option:not(.locked)').forEach(option => {
            option.addEventListener('click', () => {
                const difficulty = option.dataset.difficulty;
                this.selectDifficulty(difficulty);
            });
        });
    }

    /**
     * Render difficulty progress information
     */
    renderDifficultyProgress() {
        const container = document.getElementById('difficulty-progress-content');
        if (!container) return;

        const progress = this.difficultyManager.getUnlockProgress();
        
        if (Object.keys(progress).length === 0) {
            container.innerHTML = `
                <div class="progress-complete">
                    <p>🎉 All difficulties unlocked!</p>
                    <p>You've mastered the Barcode Battler challenge!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = Object.entries(progress).map(([difficulty, data]) => {
            const difficultyConfig = this.difficultyManager.getDifficultyConfig(difficulty);
            
            return `
                <div class="progress-item">
                    <div class="progress-header">
                        <h4 class="progress-title">${difficultyConfig.icon} ${difficultyConfig.name}</h4>
                        <span class="progress-percentage">${Math.round(data.percentage)}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${data.percentage}%"></div>
                    </div>
                    <p class="progress-description">${data.description}</p>
                    ${difficulty === 'hard' && data.currentMedium !== undefined ? `
                        <div class="progress-details">
                            <div>Total Wins: ${data.currentTotal}/${data.requiredTotal}</div>
                            <div>Medium Wins: ${data.currentMedium}/${data.requiredMedium}</div>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    /**
     * Render battle statistics
     */
    renderBattleStats() {
        const container = document.getElementById('battle-stats-content');
        if (!container) return;

        const stats = this.difficultyManager.getBattleStats();
        const totalWins = this.difficultyManager.getTotalWins();
        const totalBattles = Object.values(stats).reduce((sum, stat) => sum + stat.wins + stat.losses, 0);
        const overallWinRate = totalBattles > 0 ? (totalWins / totalBattles) * 100 : 0;

        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-value">${totalWins}</span>
                    <span class="stat-label">Total Wins</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${totalBattles}</span>
                    <span class="stat-label">Total Battles</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${Math.round(overallWinRate)}%</span>
                    <span class="stat-label">Win Rate</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${stats.easy.wins}</span>
                    <span class="stat-label">Easy Wins</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${stats.medium.wins}</span>
                    <span class="stat-label">Medium Wins</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${stats.hard.wins}</span>
                    <span class="stat-label">Hard Wins</span>
                </div>
            </div>
        `;
    }

    /**
     * Set up event listeners for difficulty screen
     */
    setupDifficultyEventListeners() {
        // Listen for difficulty manager events
        window.addEventListener('difficultyChanged', (event) => {
            this.renderDifficultyOptions();
        });

        window.addEventListener('difficultyUnlocked', (event) => {
            this.renderDifficultyOptions();
            this.renderDifficultyProgress();
            this.showFeedback(`${event.detail.config.name} difficulty unlocked!`, 'success');
        });

        window.addEventListener('difficultyProgressUpdated', (event) => {
            this.renderDifficultyProgress();
            this.renderBattleStats();
        });

        // Start battle button
        const startBattleBtn = document.getElementById('start-battle-btn');
        if (startBattleBtn) {
            startBattleBtn.addEventListener('click', () => {
                this.startBattleWithDifficulty();
            });
        }
    }

    /**
     * Select a difficulty level
     * @param {string} difficulty - Difficulty to select
     */
    selectDifficulty(difficulty) {
        if (this.difficultyManager.setDifficulty(difficulty)) {
            this.renderDifficultyOptions();
            
            // Enable start battle button if we have a selected creature
            const startBattleBtn = document.getElementById('start-battle-btn');
            if (startBattleBtn && this.selectedCreature) {
                startBattleBtn.disabled = false;
            }
        }
    }

    /**
     * Start battle with selected difficulty and full system integration
     */
    startBattleWithDifficulty() {
        if (!this.selectedCreature) {
            this.showFeedback('Please select a creature first', 'error');
            this.announceToScreenReader('Please select a creature first', 'assertive');
            return;
        }

        const difficulty = this.difficultyManager.getCurrentDifficulty();
        
        try {
            // Ensure creature is at full health before battle
            this.selectedCreature.stats.hp = this.selectedCreature.stats.maxHp;
            
            // Generate opponent using difficulty manager with random barcode
            const randomBarcode = this.generateRandomBarcode();
            const baseOpponent = this.barcodeProcessor.generateCreature(randomBarcode);
            const opponent = this.difficultyManager.generateOpponent(baseOpponent, difficulty);

            // Initialize battle with full integration
            this.currentBattle = this.battleEngine.initiateBattle(this.selectedCreature, opponent, difficulty);
            
            // Set up battle event listeners
            this.setupBattleEventListeners();
            
            // Initialize battle effects
            this.battleEffects.initializeBattle(this.currentBattle);
            
            // Save battle start to storage
            this.saveBattleState();
            
            // Track battle analytics
            this.trackBattleStart(difficulty);
            
            // Show battle screen with announcement
            this.showScreen('battle-screen');
            this.announceToScreenReader(`Battle started: ${this.selectedCreature.name} vs ${opponent.name} on ${difficulty} difficulty`, 'polite');
            
            // Update battle display
            this.updateBattleDisplay();
            
            console.log('Battle started:', this.currentBattle);
            
        } catch (error) {
            console.error('Failed to start battle:', error);
            this.showFeedback('Failed to start battle', 'error');
            this.logError('battle_start', error, { difficulty, creature: this.selectedCreature?.id });
        }
    }// In
itialize UIController when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create global UIController instance
    window.uiController = new UIController();
    
    // Expose navigation methods globally for inline event handlers
    window.showScreen = (screenId, options) => window.uiController.showScreen(screenId, options);
    window.goBack = () => window.uiController.goBack();
    
    console.log('Barcode Battler Game initialized');
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden - pause any ongoing operations
        if (window.uiController?.cameraScanner?.isScanning) {
            window.uiController.cameraScanner.stopScanning();
        }
    } else {
        // Page is visible again - resume if needed
        console.log('Page became visible again');
    }
});

// Export UIController for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIController;
}

// Make UIController available globally
if (typeof window !== 'undefined') {
    window.UIController = UIController;
}    /
**
     * Generate random barcode for opponent creation
     * @returns {string} Random barcode
     */
    generateRandomBarcode() {
        const length = 12; // Standard barcode length
        let barcode = '';
        for (let i = 0; i < length; i++) {
            barcode += Math.floor(Math.random() * 10);
        }
        return barcode;
    }

    /**
     * Update all creature displays across the application
     */
    updateAllCreatureDisplays() {
        // Update collection screen if visible
        if (this.currentScreen === 'collection-screen') {
            this.refreshCollection();
        }
        
        // Update creature detail screen if visible
        if (this.currentScreen === 'creature-detail-screen' && this.selectedCreature) {
            this.showCreatureDetail(this.selectedCreature.id);
        }
        
        // Update any other creature displays
        this.updateCollectionStats();
    }

    /**
     * Track creature discovery for analytics
     * @param {Object} creature - Discovered creature
     * @param {string} method - Discovery method
     */
    trackCreatureDiscovery(creature, method) {
        const analytics = this.getAnalytics();
        analytics.creaturesDiscovered = (analytics.creaturesDiscovered || 0) + 1;
        analytics.discoveryMethods = analytics.discoveryMethods || {};
        analytics.discoveryMethods[method] = (analytics.discoveryMethods[method] || 0) + 1;
        analytics.lastDiscovery = new Date().toISOString();
        
        this.saveAnalytics(analytics);
        
        // Dispatch discovery event
        this.dispatchEvent('creatureDiscovered', {
            creature: creature,
            method: method,
            totalDiscovered: analytics.creaturesDiscovered
        });
    }

    /**
     * Check for discovery achievements
     */
    checkDiscoveryAchievements() {
        const collection = this.creatureManager.getCollection();
        const count = collection.length;
        
        const achievements = [
            { count: 1, name: 'First Discovery', message: 'You discovered your first creature!' },
            { count: 5, name: 'Collector', message: 'You have 5 creatures in your collection!' },
            { count: 10, name: 'Enthusiast', message: 'You have 10 creatures in your collection!' },
            { count: 25, name: 'Expert', message: 'You have 25 creatures in your collection!' },
            { count: 50, name: 'Master', message: 'You have 50 creatures in your collection!' }
        ];
        
        const unlockedAchievements = this.getUnlockedAchievements();
        
        achievements.forEach(achievement => {
            if (count >= achievement.count && !unlockedAchievements.includes(achievement.name)) {
                this.unlockAchievement(achievement);
            }
        });
    }

    /**
     * Unlock an achievement
     * @param {Object} achievement - Achievement to unlock
     */
    unlockAchievement(achievement) {
        const unlockedAchievements = this.getUnlockedAchievements();
        unlockedAchievements.push(achievement.name);
        
        localStorage.setItem('barcodeBattler_achievements', JSON.stringify(unlockedAchievements));
        
        // Show achievement notification
        this.showAchievementNotification(achievement);
        
        // Dispatch achievement event
        this.dispatchEvent('achievementUnlocked', achievement);
    }

    /**
     * Show achievement notification
     * @param {Object} achievement - Achievement data
     */
    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-content">
                <div class="achievement-icon">🏆</div>
                <div class="achievement-text">
                    <div class="achievement-title">Achievement Unlocked!</div>
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-message">${achievement.message}</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 4000);
        
        // Announce to screen readers
        this.announceToScreenReader(`Achievement unlocked: ${achievement.name}. ${achievement.message}`, 'polite');
    }

    /**
     * Get unlocked achievements
     * @returns {Array} Array of unlocked achievement names
     */
    getUnlockedAchievements() {
        try {
            return JSON.parse(localStorage.getItem('barcodeBattler_achievements') || '[]');
        } catch (error) {
            console.warn('Failed to load achievements:', error);
            return [];
        }
    }

    /**
     * Set up battle event listeners
     */
    setupBattleEventListeners() {
        // Listen for battle events
        window.addEventListener('battleActionExecuted', (event) => {
            this.handleBattleAction(event.detail);
        });
        
        window.addEventListener('battleEnded', (event) => {
            this.handleBattleEnd(event.detail);
        });
        
        window.addEventListener('creatureDefeated', (event) => {
            this.handleCreatureDefeated(event.detail);
        });
    }

    /**
     * Handle battle action events
     * @param {Object} actionData - Battle action data
     */
    handleBattleAction(actionData) {
        // Update battle display
        this.updateBattleDisplay();
        
        // Play appropriate effects
        this.battleEffects.playActionEffect(actionData.type, actionData.critical);
        
        // Update battle log
        this.updateBattleLog(actionData);
    }

    /**
     * Handle battle end events
     * @param {Object} battleResult - Battle result data
     */
    handleBattleEnd(battleResult) {
        // Update creature stats and experience
        if (battleResult.winner === 'player') {
            this.creatureManager.addExperience(this.selectedCreature.id, battleResult.experienceGained);
        }
        
        // Save updated collection
        this.storageManager.saveCreatureCollection(this.creatureManager.getCollection());
        
        // Track battle completion
        this.trackBattleCompletion(battleResult);
        
        // Show battle results
        this.showBattleResults(battleResult);
    }

    /**
     * Save current battle state
     */
    saveBattleState() {
        if (this.currentBattle) {
            try {
                const battleState = {
                    battle: this.currentBattle,
                    timestamp: Date.now()
                };
                localStorage.setItem('barcodeBattler_currentBattle', JSON.stringify(battleState));
            } catch (error) {
                console.warn('Failed to save battle state:', error);
            }
        }
    }

    /**
     * Load saved battle state
     * @returns {Object|null} Saved battle state
     */
    loadBattleState() {
        try {
            const saved = localStorage.getItem('barcodeBattler_currentBattle');
            if (saved) {
                const battleState = JSON.parse(saved);
                
                // Check if battle is recent (within 1 hour)
                if (Date.now() - battleState.timestamp < 3600000) {
                    return battleState.battle;
                }
            }
        } catch (error) {
            console.warn('Failed to load battle state:', error);
        }
        return null;
    }

    /**
     * Track battle start for analytics
     * @param {string} difficulty - Battle difficulty
     */
    trackBattleStart(difficulty) {
        const analytics = this.getAnalytics();
        analytics.battlesStarted = (analytics.battlesStarted || 0) + 1;
        analytics.battlesByDifficulty = analytics.battlesByDifficulty || {};
        analytics.battlesByDifficulty[difficulty] = (analytics.battlesByDifficulty[difficulty] || 0) + 1;
        
        this.saveAnalytics(analytics);
    }

    /**
     * Track battle completion for analytics
     * @param {Object} battleResult - Battle result
     */
    trackBattleCompletion(battleResult) {
        const analytics = this.getAnalytics();
        analytics.battlesCompleted = (analytics.battlesCompleted || 0) + 1;
        
        if (battleResult.winner === 'player') {
            analytics.battlesWon = (analytics.battlesWon || 0) + 1;
        } else {
            analytics.battlesLost = (analytics.battlesLost || 0) + 1;
        }
        
        analytics.lastBattle = new Date().toISOString();
        this.saveAnalytics(analytics);
    }

    /**
     * Get analytics data
     * @returns {Object} Analytics data
     */
    getAnalytics() {
        try {
            return JSON.parse(localStorage.getItem('barcodeBattler_analytics') || '{}');
        } catch (error) {
            console.warn('Failed to load analytics:', error);
            return {};
        }
    }

    /**
     * Save analytics data
     * @param {Object} analytics - Analytics data to save
     */
    saveAnalytics(analytics) {
        try {
            localStorage.setItem('barcodeBattler_analytics', JSON.stringify(analytics));
        } catch (error) {
            console.warn('Failed to save analytics:', error);
        }
    }

    /**
     * Announce message to screen readers
     * @param {string} message - Message to announce
     * @param {string} priority - 'polite' or 'assertive'
     */
    announceToScreenReader(message, priority = 'polite') {
        const regionId = priority === 'assertive' ? 'assertive-announcer' : 'polite-announcer';
        const region = document.getElementById(regionId);
        
        if (region) {
            region.textContent = message;
            
            // Clear after announcement
            setTimeout(() => {
                region.textContent = '';
            }, 1000);
        }
    }

    /**
     * Log error for debugging
     * @param {string} category - Error category
     * @param {Error} error - Error object
     * @param {Object} context - Additional context
     */
    logError(category, error, context = {}) {
        const errorLog = {
            category,
            message: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        console.error('Application Error:', errorLog);
        
        // Store error log (optional)
        try {
            const errors = JSON.parse(localStorage.getItem('barcodeBattler_errors') || '[]');
            errors.push(errorLog);
            
            // Keep only last 50 errors
            if (errors.length > 50) {
                errors.splice(0, errors.length - 50);
            }
            
            localStorage.setItem('barcodeBattler_errors', JSON.stringify(errors));
        } catch (storageError) {
            console.warn('Failed to store error log:', storageError);
        }
    }

    /**
     * Dispatch custom event
     * @param {string} eventName - Event name
     * @param {Object} detail - Event detail
     */
    dispatchEvent(eventName, detail) {
        const event = new CustomEvent(eventName, { detail });
        window.dispatchEvent(event);
    }

    /**
     * Get user settings
     * @returns {Object} User settings
     */
    getSettings() {
        try {
            return JSON.parse(localStorage.getItem('barcodeBattler_settings') || '{}');
        } catch (error) {
            console.warn('Failed to load settings:', error);
            return {};
        }
    }

    /**
     * Save user settings
     * @param {Object} settings - Settings to save
     */
    saveSettings(settings) {
        try {
            localStorage.setItem('barcodeBattler_settings', JSON.stringify(settings));
        } catch (error) {
            console.warn('Failed to save settings:', error);
        }
    }

    /**
     * Add keyboard shortcuts for desktop users
     */
    addKeyboardShortcuts() {
        const shortcuts = {
            'KeyH': () => this.showScreen('home-screen'),
            'KeyS': () => this.showScreen('scanner-screen'),
            'KeyC': () => this.showScreen('collection-screen'),
            'KeyB': () => this.showScreen('difficulty-screen'),
            'KeyT': () => this.showScreen('settings-screen'),
            'Escape': () => this.goBack(),
            'F1': () => this.showHelp(),
            'KeyR': () => this.refreshCurrentScreen()
        };

        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when not in input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            const key = e.code;
            const hasModifier = e.ctrlKey || e.metaKey;

            if (hasModifier && shortcuts[key]) {
                e.preventDefault();
                shortcuts[key]();
            } else if (key === 'Escape' || key === 'F1') {
                e.preventDefault();
                shortcuts[key]();
            }
        });
    }

    /**
     * Show help information
     */
    showHelp() {
        const helpContent = `
            <div class="help-content">
                <h3>Keyboard Shortcuts</h3>
                <ul>
                    <li><kbd>Ctrl+H</kbd> - Home Screen</li>
                    <li><kbd>Ctrl+S</kbd> - Scanner Screen</li>
                    <li><kbd>Ctrl+C</kbd> - Collection Screen</li>
                    <li><kbd>Ctrl+B</kbd> - Battle Screen</li>
                    <li><kbd>Ctrl+T</kbd> - Settings Screen</li>
                    <li><kbd>Escape</kbd> - Go Back</li>
                    <li><kbd>F1</kbd> - Show Help</li>
                    <li><kbd>Ctrl+R</kbd> - Refresh Current Screen</li>
                </ul>
                
                <h3>Game Instructions</h3>
                <ol>
                    <li>Scan or enter barcodes to discover creatures</li>
                    <li>Build your collection of unique creatures</li>
                    <li>Battle against AI opponents</li>
                    <li>Level up your creatures through battles</li>
                    <li>Unlock higher difficulty levels</li>
                </ol>
            </div>
        `;
        
        this.showModal('Help', helpContent);
    }

    /**
     * Show modal dialog
     * @param {string} title - Modal title
     * @param {string} content - Modal content
     */
    showModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button class="modal-close" aria-label="Close">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                <div class="modal-footer">
                    <button class="btn primary modal-close">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Set up close handlers
        modal.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                document.body.removeChild(modal);
            });
        });
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // Close on Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(modal);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
        
        // Focus first button
        const firstButton = modal.querySelector('button');
        if (firstButton) {
            firstButton.focus();
        }
    }

    /**
     * Refresh current screen
     */
    refreshCurrentScreen() {
        const screenConfig = this.screens[this.currentScreen];
        if (screenConfig && screenConfig.init) {
            screenConfig.init();
        }
        
        this.announceToScreenReader('Screen refreshed', 'polite');
    }

    /**
     * Show integration status indicator
     */
    showIntegrationStatus() {
        const statusElement = document.getElementById('integration-status');
        if (!statusElement) return;

        // Check system integration status
        const integrationChecks = [
            () => this.barcodeProcessor && typeof this.barcodeProcessor.generateCreature === 'function',
            () => this.creatureManager && typeof this.creatureManager.addCreature === 'function',
            () => this.battleEngine && typeof this.battleEngine.initiateBattle === 'function',
            () => this.storageManager && typeof this.storageManager.saveCreatureCollection === 'function',
            () => this.difficultyManager && typeof this.difficultyManager.getCurrentDifficulty === 'function',
            () => this.cameraScanner && typeof this.cameraScanner.startScanning === 'function',
            () => this.battleEffects && typeof this.battleEffects.playActionEffect === 'function'
        ];

        const allIntegrated = integrationChecks.every(check => {
            try {
                return check();
            } catch (error) {
                console.warn('Integration check failed:', error);
                return false;
            }
        });

        const indicator = statusElement.querySelector('.integration-status-indicator');
        const text = statusElement.querySelector('span');

        if (allIntegrated) {
            indicator.classList.remove('error');
            text.textContent = 'All systems integrated';
            statusElement.classList.remove('hidden');
            
            // Hide after 3 seconds
            setTimeout(() => {
                statusElement.classList.add('hidden');
            }, 3000);
        } else {
            indicator.classList.add('error');
            text.textContent = 'Integration issues detected';
            statusElement.classList.remove('hidden');
        }
    }