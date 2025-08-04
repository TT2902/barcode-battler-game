/**
 * DifficultyManager - Manages game difficulty levels and progression
 * Handles difficulty settings, opponent scaling, and unlock system
 */

class DifficultyManager {
    constructor() {
        this.currentDifficulty = 'easy';
        this.unlockedDifficulties = ['easy']; // Start with easy unlocked
        this.difficultyStats = this.initializeDifficultyStats();
        this.progressionRequirements = this.getProgressionRequirements();
        
        // Load saved difficulty progress
        this.loadProgress();
    }

    /**
     * Initialize difficulty statistics and parameters
     * @returns {Object} Difficulty configuration
     */
    initializeDifficultyStats() {
        return {
            easy: {
                name: 'Easy',
                description: 'Perfect for beginners learning the game',
                opponentStatMultiplier: 0.8,
                experienceMultiplier: 1.0,
                aiPersonalityWeights: {
                    'Aggressive': 0.1,
                    'Defensive': 0.4,
                    'Tactical': 0.2,
                    'Berserker': 0.05,
                    'Cautious': 0.25
                },
                specialAttackFrequency: 0.2,
                criticalHitChance: 0.05,
                color: '#4CAF50', // Green
                icon: '🟢'
            },
            medium: {
                name: 'Medium',
                description: 'Balanced challenge for experienced players',
                opponentStatMultiplier: 1.0,
                experienceMultiplier: 1.2,
                aiPersonalityWeights: {
                    'Aggressive': 0.25,
                    'Defensive': 0.25,
                    'Tactical': 0.3,
                    'Berserker': 0.1,
                    'Cautious': 0.1
                },
                specialAttackFrequency: 0.35,
                criticalHitChance: 0.1,
                color: '#FF9800', // Orange
                icon: '🟡'
            },
            hard: {
                name: 'Hard',
                description: 'Ultimate challenge for master battlers',
                opponentStatMultiplier: 1.3,
                experienceMultiplier: 1.5,
                aiPersonalityWeights: {
                    'Aggressive': 0.3,
                    'Defensive': 0.15,
                    'Tactical': 0.4,
                    'Berserker': 0.1,
                    'Berserker': 0.05
                },
                specialAttackFrequency: 0.5,
                criticalHitChance: 0.15,
                color: '#F44336', // Red
                icon: '🔴'
            }
        };
    }

    /**
     * Get progression requirements for unlocking difficulties
     * @returns {Object} Unlock requirements
     */
    getProgressionRequirements() {
        return {
            medium: {
                battlesWon: 5,
                description: 'Win 5 battles on Easy difficulty'
            },
            hard: {
                battlesWon: 15,
                mediumWins: 8,
                description: 'Win 15 total battles including 8 on Medium difficulty'
            }
        };
    }

    /**
     * Set current difficulty level
     * @param {string} difficulty - Difficulty level ('easy', 'medium', 'hard')
     * @returns {boolean} Success status
     */
    setDifficulty(difficulty) {
        if (!this.isValidDifficulty(difficulty)) {
            console.warn(`Invalid difficulty: ${difficulty}`);
            return false;
        }

        if (!this.isDifficultyUnlocked(difficulty)) {
            console.warn(`Difficulty ${difficulty} is not unlocked yet`);
            return false;
        }

        this.currentDifficulty = difficulty;
        this.saveProgress();
        
        // Dispatch event for UI updates
        this.dispatchDifficultyChangeEvent(difficulty);
        
        return true;
    }

    /**
     * Get current difficulty level
     * @returns {string} Current difficulty
     */
    getCurrentDifficulty() {
        return this.currentDifficulty;
    }

    /**
     * Get difficulty configuration
     * @param {string} difficulty - Difficulty level (optional, defaults to current)
     * @returns {Object} Difficulty configuration
     */
    getDifficultyConfig(difficulty = null) {
        const targetDifficulty = difficulty || this.currentDifficulty;
        return this.difficultyStats[targetDifficulty] || this.difficultyStats.easy;
    }

    /**
     * Get all available difficulties with their unlock status
     * @returns {Array} Array of difficulty objects
     */
    getAllDifficulties() {
        return Object.keys(this.difficultyStats).map(key => ({
            id: key,
            ...this.difficultyStats[key],
            unlocked: this.isDifficultyUnlocked(key),
            current: key === this.currentDifficulty,
            requirements: this.progressionRequirements[key] || null
        }));
    }

    /**
     * Check if a difficulty level is valid
     * @param {string} difficulty - Difficulty to check
     * @returns {boolean} Whether difficulty is valid
     */
    isValidDifficulty(difficulty) {
        return Object.keys(this.difficultyStats).includes(difficulty);
    }

    /**
     * Check if a difficulty level is unlocked
     * @param {string} difficulty - Difficulty to check
     * @returns {boolean} Whether difficulty is unlocked
     */
    isDifficultyUnlocked(difficulty) {
        return this.unlockedDifficulties.includes(difficulty);
    }

    /**
     * Generate opponent creature with difficulty scaling
     * @param {Object} baseCreature - Base creature to scale
     * @param {string} difficulty - Difficulty level (optional)
     * @returns {Object} Scaled opponent creature
     */
    generateOpponent(baseCreature, difficulty = null) {
        const config = this.getDifficultyConfig(difficulty);
        const multiplier = config.opponentStatMultiplier;

        // Create scaled opponent
        const opponent = {
            ...baseCreature,
            id: `opponent_${Date.now()}`,
            name: `${baseCreature.name} (${config.name})`,
            stats: {
                hp: Math.round(baseCreature.stats.maxHp * multiplier),
                maxHp: Math.round(baseCreature.stats.maxHp * multiplier),
                attack: Math.round(baseCreature.stats.attack * multiplier),
                defense: Math.round(baseCreature.stats.defense * multiplier),
                speed: Math.round(baseCreature.stats.speed * multiplier)
            },
            level: Math.max(1, Math.round(baseCreature.level * multiplier)),
            isOpponent: true,
            difficulty: difficulty || this.currentDifficulty
        };

        // Add difficulty-specific enhancements
        this.applyDifficultyEnhancements(opponent, config);

        return opponent;
    }

    /**
     * Apply difficulty-specific enhancements to opponent
     * @param {Object} opponent - Opponent creature
     * @param {Object} config - Difficulty configuration
     */
    applyDifficultyEnhancements(opponent, config) {
        // Boost stats based on difficulty
        if (config.opponentStatMultiplier > 1.0) {
            // Hard difficulty gets additional bonuses
            const bonus = (config.opponentStatMultiplier - 1.0) * 0.5;
            opponent.stats.attack += Math.round(opponent.stats.attack * bonus);
            opponent.stats.defense += Math.round(opponent.stats.defense * bonus);
        }

        // Add difficulty-specific abilities
        opponent.difficultyBonuses = {
            specialAttackFrequency: config.specialAttackFrequency,
            criticalHitChance: config.criticalHitChance,
            experienceReward: Math.round(opponent.level * config.experienceMultiplier)
        };
    }

    /**
     * Select AI personality based on difficulty weights
     * @param {string} difficulty - Difficulty level (optional)
     * @returns {string} Selected personality type
     */
    selectAIPersonality(difficulty = null) {
        const config = this.getDifficultyConfig(difficulty);
        const weights = config.aiPersonalityWeights;
        
        // Weighted random selection
        const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const [personality, weight] of Object.entries(weights)) {
            random -= weight;
            if (random <= 0) {
                return personality;
            }
        }
        
        // Fallback to first personality
        return Object.keys(weights)[0];
    }

    /**
     * Record battle result and check for difficulty unlocks
     * @param {Object} battleResult - Battle result data
     */
    recordBattleResult(battleResult) {
        if (!battleResult || typeof battleResult.won !== 'boolean') {
            console.warn('Invalid battle result provided');
            return;
        }

        // Initialize battle statistics if not exists
        if (!this.battleStats) {
            this.battleStats = {
                easy: { wins: 0, losses: 0 },
                medium: { wins: 0, losses: 0 },
                hard: { wins: 0, losses: 0 }
            };
        }

        const difficulty = battleResult.difficulty || this.currentDifficulty;
        
        // Record the result
        if (battleResult.won) {
            this.battleStats[difficulty].wins++;
        } else {
            this.battleStats[difficulty].losses++;
        }

        // Check for difficulty unlocks
        this.checkDifficultyUnlocks();
        
        // Save progress
        this.saveProgress();

        // Dispatch event for UI updates
        this.dispatchProgressUpdateEvent();
    }

    /**
     * Check and unlock new difficulties based on progress
     */
    checkDifficultyUnlocks() {
        const totalWins = this.getTotalWins();
        const mediumWins = this.battleStats.medium ? this.battleStats.medium.wins : 0;

        // Check medium unlock
        if (!this.isDifficultyUnlocked('medium')) {
            const mediumReq = this.progressionRequirements.medium;
            if (totalWins >= mediumReq.battlesWon) {
                this.unlockDifficulty('medium');
            }
        }

        // Check hard unlock
        if (!this.isDifficultyUnlocked('hard')) {
            const hardReq = this.progressionRequirements.hard;
            if (totalWins >= hardReq.battlesWon && mediumWins >= hardReq.mediumWins) {
                this.unlockDifficulty('hard');
            }
        }
    }

    /**
     * Unlock a difficulty level
     * @param {string} difficulty - Difficulty to unlock
     */
    unlockDifficulty(difficulty) {
        if (!this.isValidDifficulty(difficulty)) {
            console.warn(`Cannot unlock invalid difficulty: ${difficulty}`);
            return;
        }

        if (this.isDifficultyUnlocked(difficulty)) {
            return; // Already unlocked
        }

        this.unlockedDifficulties.push(difficulty);
        
        // Dispatch unlock event
        this.dispatchDifficultyUnlockEvent(difficulty);
        
        console.log(`Difficulty unlocked: ${this.difficultyStats[difficulty].name}`);
    }

    /**
     * Get total wins across all difficulties
     * @returns {number} Total wins
     */
    getTotalWins() {
        if (!this.battleStats) return 0;
        
        return Object.values(this.battleStats).reduce((total, stats) => {
            return total + (stats.wins || 0);
        }, 0);
    }

    /**
     * Get battle statistics
     * @returns {Object} Battle statistics
     */
    getBattleStats() {
        return this.battleStats || {
            easy: { wins: 0, losses: 0 },
            medium: { wins: 0, losses: 0 },
            hard: { wins: 0, losses: 0 }
        };
    }

    /**
     * Get progress towards next difficulty unlock
     * @returns {Object} Progress information
     */
    getUnlockProgress() {
        const progress = {};
        const totalWins = this.getTotalWins();
        const mediumWins = this.battleStats.medium ? this.battleStats.medium.wins : 0;

        // Medium progress
        if (!this.isDifficultyUnlocked('medium')) {
            const req = this.progressionRequirements.medium;
            progress.medium = {
                current: totalWins,
                required: req.battlesWon,
                percentage: Math.min(100, (totalWins / req.battlesWon) * 100),
                description: req.description
            };
        }

        // Hard progress
        if (!this.isDifficultyUnlocked('hard')) {
            const req = this.progressionRequirements.hard;
            const totalProgress = totalWins / req.battlesWon;
            const mediumProgress = mediumWins / req.mediumWins;
            const overallProgress = Math.min(totalProgress, mediumProgress);
            
            progress.hard = {
                currentTotal: totalWins,
                requiredTotal: req.battlesWon,
                currentMedium: mediumWins,
                requiredMedium: req.mediumWins,
                percentage: Math.min(100, overallProgress * 100),
                description: req.description
            };
        }

        return progress;
    }

    /**
     * Reset difficulty progress (for testing or new game)
     */
    resetProgress() {
        this.currentDifficulty = 'easy';
        this.unlockedDifficulties = ['easy'];
        this.battleStats = {
            easy: { wins: 0, losses: 0 },
            medium: { wins: 0, losses: 0 },
            hard: { wins: 0, losses: 0 }
        };
        
        this.saveProgress();
        this.dispatchProgressUpdateEvent();
    }

    /**
     * Save difficulty progress to local storage
     */
    saveProgress() {
        try {
            const progressData = {
                currentDifficulty: this.currentDifficulty,
                unlockedDifficulties: this.unlockedDifficulties,
                battleStats: this.battleStats || {}
            };
            
            localStorage.setItem('barcodeBattler_difficultyProgress', JSON.stringify(progressData));
        } catch (error) {
            console.warn('Failed to save difficulty progress:', error);
        }
    }

    /**
     * Load difficulty progress from local storage
     */
    loadProgress() {
        try {
            const saved = localStorage.getItem('barcodeBattler_difficultyProgress');
            if (saved) {
                const progressData = JSON.parse(saved);
                
                this.currentDifficulty = progressData.currentDifficulty || 'easy';
                this.unlockedDifficulties = progressData.unlockedDifficulties || ['easy'];
                this.battleStats = progressData.battleStats || {};
                
                // Validate loaded data
                if (!this.isValidDifficulty(this.currentDifficulty)) {
                    this.currentDifficulty = 'easy';
                }
                
                // Ensure easy is always unlocked
                if (!this.unlockedDifficulties.includes('easy')) {
                    this.unlockedDifficulties.push('easy');
                }
            }
        } catch (error) {
            console.warn('Failed to load difficulty progress:', error);
            // Reset to defaults on error
            this.currentDifficulty = 'easy';
            this.unlockedDifficulties = ['easy'];
            this.battleStats = {};
        }
    }

    /**
     * Dispatch difficulty change event
     * @param {string} difficulty - New difficulty
     */
    dispatchDifficultyChangeEvent(difficulty) {
        const event = new CustomEvent('difficultyChanged', {
            detail: {
                difficulty: difficulty,
                config: this.getDifficultyConfig(difficulty)
            }
        });
        
        if (typeof window !== 'undefined') {
            window.dispatchEvent(event);
        }
    }

    /**
     * Dispatch difficulty unlock event
     * @param {string} difficulty - Unlocked difficulty
     */
    dispatchDifficultyUnlockEvent(difficulty) {
        const event = new CustomEvent('difficultyUnlocked', {
            detail: {
                difficulty: difficulty,
                config: this.getDifficultyConfig(difficulty)
            }
        });
        
        if (typeof window !== 'undefined') {
            window.dispatchEvent(event);
        }
    }

    /**
     * Dispatch progress update event
     */
    dispatchProgressUpdateEvent() {
        const event = new CustomEvent('difficultyProgressUpdated', {
            detail: {
                battleStats: this.getBattleStats(),
                unlockProgress: this.getUnlockProgress(),
                unlockedDifficulties: this.unlockedDifficulties
            }
        });
        
        if (typeof window !== 'undefined') {
            window.dispatchEvent(event);
        }
    }

    /**
     * Get difficulty manager status for debugging
     * @returns {Object} Status information
     */
    getStatus() {
        return {
            currentDifficulty: this.currentDifficulty,
            unlockedDifficulties: this.unlockedDifficulties,
            battleStats: this.getBattleStats(),
            unlockProgress: this.getUnlockProgress(),
            totalWins: this.getTotalWins()
        };
    }
}

// Export for use in other modules (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DifficultyManager;
}

// Make available globally in browser
if (typeof window !== 'undefined') {
    window.DifficultyManager = DifficultyManager;
}