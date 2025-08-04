/**
 * StorageManager - Handles local data persistence and backup/restore functionality
 * Manages localStorage operations with error handling and data validation
 */

class StorageManager {
    constructor() {
        this.isAvailable = this.checkStorageAvailability();
        this.storageKeys = GameConstants.STORAGE_KEYS;
        this.maxRetries = 3;
        this.retryDelay = 100; // milliseconds
        
        // Initialize storage if available
        if (this.isAvailable) {
            this.initializeStorage();
        } else {
            console.warn('localStorage is not available. Game progress will not be saved.');
        }
    }

    /**
     * Check if localStorage is available and functional
     * @returns {boolean} Whether localStorage is available
     */
    checkStorageAvailability() {
        try {
            const testKey = '__storage_test__';
            const testValue = 'test';
            
            localStorage.setItem(testKey, testValue);
            const retrieved = localStorage.getItem(testKey);
            localStorage.removeItem(testKey);
            
            return retrieved === testValue;
        } catch (error) {
            console.error('localStorage availability check failed:', error);
            return false;
        }
    }

    /**
     * Initialize storage with default values if needed
     */
    initializeStorage() {
        try {
            // Initialize creatures storage if it doesn't exist
            if (!localStorage.getItem(this.storageKeys.CREATURES)) {
                this.saveData(this.storageKeys.CREATURES, []);
            }

            // Initialize settings storage if it doesn't exist
            if (!localStorage.getItem(this.storageKeys.SETTINGS)) {
                const defaultSettings = {
                    difficulty: 'medium',
                    soundEnabled: true,
                    highContrastMode: false,
                    cameraEnabled: true,
                    lastBackupDate: null
                };
                this.saveData(this.storageKeys.SETTINGS, defaultSettings);
            }

            // Initialize battle history if it doesn't exist
            if (!localStorage.getItem(this.storageKeys.BATTLE_HISTORY)) {
                this.saveData(this.storageKeys.BATTLE_HISTORY, []);
            }

            console.log('Storage initialized successfully');
        } catch (error) {
            console.error('Failed to initialize storage:', error);
        }
    }

    /**
     * Save data to localStorage with error handling and retries
     * @param {string} key - Storage key
     * @param {any} data - Data to save
     * @returns {boolean} Whether the save was successful
     */
    saveData(key, data) {
        if (!this.isAvailable) {
            console.warn('Cannot save data: localStorage not available');
            return false;
        }

        return this.executeWithRetry(() => {
            const serializedData = JSON.stringify(data);
            localStorage.setItem(key, serializedData);
            return true;
        }, `save data for key: ${key}`);
    }

    /**
     * Load data from localStorage with error handling
     * @param {string} key - Storage key
     * @param {any} defaultValue - Default value if key doesn't exist
     * @returns {any} Loaded data or default value
     */
    loadData(key, defaultValue = null) {
        if (!this.isAvailable) {
            console.warn('Cannot load data: localStorage not available');
            return defaultValue;
        }

        return this.executeWithRetry(() => {
            const stored = localStorage.getItem(key);
            if (stored === null) {
                return defaultValue;
            }

            try {
                return JSON.parse(stored);
            } catch (parseError) {
                console.error(`Failed to parse stored data for key ${key}:`, parseError);
                return defaultValue;
            }
        }, `load data for key: ${key}`) || defaultValue;
    }

    /**
     * Remove data from localStorage
     * @param {string} key - Storage key to remove
     * @returns {boolean} Whether the removal was successful
     */
    removeData(key) {
        if (!this.isAvailable) {
            console.warn('Cannot remove data: localStorage not available');
            return false;
        }

        return this.executeWithRetry(() => {
            localStorage.removeItem(key);
            return true;
        }, `remove data for key: ${key}`);
    }

    /**
     * Clear all game data from localStorage
     * @returns {boolean} Whether the clear was successful
     */
    clearAllData() {
        if (!this.isAvailable) {
            console.warn('Cannot clear data: localStorage not available');
            return false;
        }

        return this.executeWithRetry(() => {
            Object.values(this.storageKeys).forEach(key => {
                localStorage.removeItem(key);
            });
            
            // Reinitialize with default values
            this.initializeStorage();
            return true;
        }, 'clear all data');
    }

    /**
     * Get storage usage information
     * @returns {Object} Storage usage statistics
     */
    getStorageInfo() {
        if (!this.isAvailable) {
            return {
                available: false,
                totalSize: 0,
                usedSize: 0,
                remainingSize: 0,
                usagePercentage: 0
            };
        }

        try {
            let totalSize = 0;
            const keyData = {};

            // Calculate size for each key
            Object.entries(this.storageKeys).forEach(([name, key]) => {
                const data = localStorage.getItem(key);
                const size = data ? new Blob([data]).size : 0;
                keyData[name] = size;
                totalSize += size;
            });

            // Estimate total localStorage capacity (usually 5-10MB)
            const estimatedCapacity = 5 * 1024 * 1024; // 5MB
            const usagePercentage = (totalSize / estimatedCapacity) * 100;

            return {
                available: true,
                totalSize: totalSize,
                usedSize: totalSize,
                remainingSize: Math.max(0, estimatedCapacity - totalSize),
                usagePercentage: Math.min(100, usagePercentage),
                keyData: keyData
            };
        } catch (error) {
            console.error('Failed to get storage info:', error);
            return {
                available: true,
                totalSize: 0,
                usedSize: 0,
                remainingSize: 0,
                usagePercentage: 0,
                error: error.message
            };
        }
    }

    /**
     * Validate data integrity for a specific key
     * @param {string} key - Storage key to validate
     * @param {Function} validator - Validation function
     * @returns {boolean} Whether the data is valid
     */
    validateData(key, validator) {
        try {
            const data = this.loadData(key);
            if (data === null) {
                return true; // No data is considered valid
            }

            return validator(data);
        } catch (error) {
            console.error(`Data validation failed for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Create a backup of all game data
     * @returns {string|null} JSON string of backup data or null if failed
     */
    createBackup() {
        if (!this.isAvailable) {
            console.warn('Cannot create backup: localStorage not available');
            return null;
        }

        try {
            const backupData = {
                version: '1.0',
                timestamp: new Date().toISOString(),
                data: {}
            };

            // Collect all game data
            Object.entries(this.storageKeys).forEach(([name, key]) => {
                const data = this.loadData(key);
                if (data !== null) {
                    backupData.data[name] = data;
                }
            });

            const backupString = JSON.stringify(backupData, null, 2);
            
            // Update last backup date in settings
            const settings = this.loadData(this.storageKeys.SETTINGS, {});
            settings.lastBackupDate = new Date().toISOString();
            this.saveData(this.storageKeys.SETTINGS, settings);

            console.log('Backup created successfully');
            return backupString;
        } catch (error) {
            console.error('Failed to create backup:', error);
            return null;
        }
    }

    /**
     * Restore data from a backup
     * @param {string} backupString - JSON string of backup data
     * @param {boolean} merge - Whether to merge with existing data
     * @returns {Object} Restore result with details
     */
    restoreFromBackup(backupString, merge = false) {
        if (!this.isAvailable) {
            return {
                success: false,
                error: 'localStorage not available'
            };
        }

        try {
            const backupData = JSON.parse(backupString);
            
            // Validate backup format
            if (!backupData.version || !backupData.data) {
                return {
                    success: false,
                    error: 'Invalid backup format'
                };
            }

            const result = {
                success: true,
                restored: 0,
                skipped: 0,
                errors: []
            };

            // Clear existing data if not merging
            if (!merge) {
                this.clearAllData();
            }

            // Restore each data type
            Object.entries(backupData.data).forEach(([name, data]) => {
                const key = this.storageKeys[name];
                if (key) {
                    try {
                        if (merge && name === 'CREATURES') {
                            // Special handling for merging creatures
                            const existingCreatures = this.loadData(key, []);
                            const mergedCreatures = this.mergeCreatures(existingCreatures, data);
                            this.saveData(key, mergedCreatures);
                        } else {
                            this.saveData(key, data);
                        }
                        result.restored++;
                    } catch (error) {
                        result.errors.push(`Failed to restore ${name}: ${error.message}`);
                        result.skipped++;
                    }
                } else {
                    result.errors.push(`Unknown data type: ${name}`);
                    result.skipped++;
                }
            });

            console.log('Restore completed:', result);
            return result;
        } catch (error) {
            console.error('Failed to restore from backup:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Merge creature arrays, avoiding duplicates
     * @param {Array} existing - Existing creatures
     * @param {Array} backup - Backup creatures
     * @returns {Array} Merged creature array
     */
    mergeCreatures(existing, backup) {
        const merged = [...existing];
        const existingBarcodes = new Set(existing.map(c => c.barcode));

        backup.forEach(creature => {
            if (!existingBarcodes.has(creature.barcode)) {
                merged.push(creature);
            }
        });

        return merged;
    }

    /**
     * Execute a function with retry logic
     * @param {Function} operation - Operation to execute
     * @param {string} description - Description for logging
     * @returns {any} Result of the operation
     */
    executeWithRetry(operation, description) {
        let lastError;
        
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                return operation();
            } catch (error) {
                lastError = error;
                
                if (error.name === 'QuotaExceededError') {
                    console.warn(`Storage quota exceeded while trying to ${description}`);
                    this.handleQuotaExceeded();
                    // Don't retry quota errors immediately
                    break;
                } else if (attempt < this.maxRetries) {
                    console.warn(`Attempt ${attempt} failed for ${description}, retrying...`, error);
                    // Wait before retrying
                    this.sleep(this.retryDelay * attempt);
                } else {
                    console.error(`All ${this.maxRetries} attempts failed for ${description}:`, error);
                }
            }
        }
        
        throw lastError;
    }

    /**
     * Handle storage quota exceeded error
     */
    handleQuotaExceeded() {
        console.warn('Storage quota exceeded. Consider clearing old data or creating a backup.');
        
        // Could implement automatic cleanup here
        // For now, just log the storage info
        const info = this.getStorageInfo();
        console.log('Current storage usage:', info);
    }

    /**
     * Sleep for specified milliseconds (for retry delays)
     * @param {number} ms - Milliseconds to sleep
     */
    sleep(ms) {
        const start = Date.now();
        while (Date.now() - start < ms) {
            // Busy wait (not ideal but works for short delays)
        }
    }

    /**
     * Check if storage is getting full (over 80% capacity)
     * @returns {boolean} Whether storage is nearly full
     */
    isStorageNearlyFull() {
        const info = this.getStorageInfo();
        return info.available && info.usagePercentage > 80;
    }

    /**
     * Get a summary of stored data
     * @returns {Object} Summary of stored data
     */
    getDataSummary() {
        if (!this.isAvailable) {
            return { available: false };
        }

        try {
            const creatures = this.loadData(this.storageKeys.CREATURES, []);
            const settings = this.loadData(this.storageKeys.SETTINGS, {});
            const battleHistory = this.loadData(this.storageKeys.BATTLE_HISTORY, []);

            return {
                available: true,
                creatures: {
                    count: creatures.length,
                    totalLevels: creatures.reduce((sum, c) => sum + c.level, 0),
                    averageLevel: creatures.length > 0 ? creatures.reduce((sum, c) => sum + c.level, 0) / creatures.length : 0
                },
                settings: {
                    difficulty: settings.difficulty || 'medium',
                    lastBackupDate: settings.lastBackupDate
                },
                battles: {
                    count: battleHistory.length
                },
                storage: this.getStorageInfo()
            };
        } catch (error) {
            console.error('Failed to get data summary:', error);
            return {
                available: true,
                error: error.message
            };
        }
    }
}

// Export for use in other modules (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}

// Make available globally in browser
if (typeof window !== 'undefined') {
    window.StorageManager = StorageManager;
}