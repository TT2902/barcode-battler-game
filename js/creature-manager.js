/**
 * CreatureManager - Handles creature collection management and progression
 * Implements creature storage, level up system, and experience calculations
 */

class CreatureManager {
    constructor(storageManager = null) {
        this.creatures = new Map(); // Use Map for efficient lookups by ID
        this.sortCriteria = 'discoveryDate'; // Default sort
        this.sortOrder = 'desc'; // Default order (newest first)
        this.storageManager = storageManager || new StorageManager();
        
        this.loadCreatures();
    }

    /**
     * Add a creature to the collection
     * @param {Creature} creature - Creature to add
     * @returns {boolean} Whether the creature was successfully added
     */
    addCreature(creature) {
        // Validate creature data
        if (!DataValidation.isValidCreature(creature)) {
            console.error('Invalid creature data:', creature);
            return false;
        }

        // Check if creature with same barcode already exists
        const existingCreature = this.findCreatureByBarcode(creature.barcode);
        if (existingCreature) {
            console.warn('Creature with barcode already exists:', creature.barcode);
            return false;
        }

        // Add creature to collection
        this.creatures.set(creature.id, GameUtils.deepClone(creature));
        
        // Save to storage
        this.saveCreatures();
        
        console.log(`Added creature ${creature.name} to collection`);
        return true;
    }

    /**
     * Get creature by ID
     * @param {string} creatureId - ID of the creature to retrieve
     * @returns {Creature|null} The creature or null if not found
     */
    getCreature(creatureId) {
        const creature = this.creatures.get(creatureId);
        return creature ? GameUtils.deepClone(creature) : null;
    }

    /**
     * Get all creatures in the collection
     * @returns {Creature[]} Array of all creatures
     */
    getCollection() {
        return Array.from(this.creatures.values()).map(creature => GameUtils.deepClone(creature));
    }

    /**
     * Get sorted collection based on current sort criteria
     * @param {string} criteria - Sort criteria ('name', 'level', 'discoveryDate', 'battlesWon')
     * @param {string} order - Sort order ('asc' or 'desc')
     * @returns {Creature[]} Sorted array of creatures
     */
    getSortedCollection(criteria = this.sortCriteria, order = this.sortOrder) {
        const collection = this.getCollection();
        
        // Update current sort settings
        this.sortCriteria = criteria;
        this.sortOrder = order;
        
        return this.sortCollection(collection, criteria, order);
    }

    /**
     * Sort a collection of creatures
     * @param {Creature[]} creatures - Array of creatures to sort
     * @param {string} criteria - Sort criteria
     * @param {string} order - Sort order
     * @returns {Creature[]} Sorted array of creatures
     */
    sortCollection(creatures, criteria, order) {
        const sortedCreatures = [...creatures];
        
        sortedCreatures.sort((a, b) => {
            let comparison = 0;
            
            switch (criteria) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                    
                case 'level':
                    comparison = a.level - b.level;
                    break;
                    
                case 'discoveryDate':
                    comparison = new Date(a.discoveryDate) - new Date(b.discoveryDate);
                    break;
                    
                case 'battlesWon':
                    comparison = a.battlesWon - b.battlesWon;
                    break;
                    
                case 'totalBattles':
                    const totalA = a.battlesWon + a.battlesLost;
                    const totalB = b.battlesWon + b.battlesLost;
                    comparison = totalA - totalB;
                    break;
                    
                case 'winRate':
                    const winRateA = this.calculateWinRate(a);
                    const winRateB = this.calculateWinRate(b);
                    comparison = winRateA - winRateB;
                    break;
                    
                case 'hp':
                    comparison = a.stats.maxHp - b.stats.maxHp;
                    break;
                    
                case 'attack':
                    comparison = a.stats.attack - b.stats.attack;
                    break;
                    
                case 'defense':
                    comparison = a.stats.defense - b.stats.defense;
                    break;
                    
                case 'speed':
                    comparison = a.stats.speed - b.stats.speed;
                    break;
                    
                default:
                    console.warn(`Unknown sort criteria: ${criteria}`);
                    return 0;
            }
            
            return order === 'desc' ? -comparison : comparison;
        });
        
        return sortedCreatures;
    }

    /**
     * Find creature by barcode
     * @param {string} barcode - Barcode to search for
     * @returns {Creature|null} Found creature or null
     */
    findCreatureByBarcode(barcode) {
        for (const creature of this.creatures.values()) {
            if (creature.barcode === barcode) {
                return GameUtils.deepClone(creature);
            }
        }
        return null;
    }

    /**
     * Award experience to a creature and handle level ups
     * @param {string} creatureId - ID of the creature
     * @param {number} experienceGained - Amount of experience to award
     * @returns {Object} Level up result with details
     */
    awardExperience(creatureId, experienceGained) {
        const creature = this.creatures.get(creatureId);
        if (!creature) {
            console.error(`Creature not found: ${creatureId}`);
            return { success: false, error: 'Creature not found' };
        }

        if (experienceGained < 0) {
            console.error('Experience gained cannot be negative');
            return { success: false, error: 'Invalid experience amount' };
        }

        const oldLevel = creature.level;
        const oldStats = GameUtils.deepClone(creature.stats);
        
        // Add experience
        creature.experience += experienceGained;
        
        // Check for level ups
        const levelUpResult = this.checkLevelUp(creature);
        
        // Save changes
        this.saveCreatures();
        
        const result = {
            success: true,
            experienceGained: experienceGained,
            oldLevel: oldLevel,
            newLevel: creature.level,
            levelsGained: creature.level - oldLevel,
            oldStats: oldStats,
            newStats: GameUtils.deepClone(creature.stats),
            statGains: this.calculateStatGains(oldStats, creature.stats)
        };
        
        if (levelUpResult.leveledUp) {
            console.log(`${creature.name} gained ${experienceGained} XP and leveled up to ${creature.level}!`);
        } else {
            console.log(`${creature.name} gained ${experienceGained} XP (${creature.experience}/${creature.experienceToNext})`);
        }
        
        return result;
    }

    /**
     * Check if creature should level up and apply level ups
     * @param {Creature} creature - Creature to check
     * @returns {Object} Level up result
     */
    checkLevelUp(creature) {
        let leveledUp = false;
        let levelsGained = 0;
        
        // Keep leveling up while creature has enough experience
        while (creature.experience >= creature.experienceToNext) {
            creature.experience -= creature.experienceToNext;
            creature.level += 1;
            levelsGained += 1;
            leveledUp = true;
            
            // Update stats for new level
            this.updateStatsForLevel(creature);
            
            // Calculate experience needed for next level
            creature.experienceToNext = GameUtils.calculateExperienceToNext(creature.level);
            
            // Prevent infinite loops (safety check)
            if (levelsGained > 50) {
                console.warn('Prevented excessive level gain for creature:', creature.name);
                break;
            }
        }
        
        return {
            leveledUp: leveledUp,
            levelsGained: levelsGained,
            newLevel: creature.level
        };
    }

    /**
     * Update creature stats based on current level
     * @param {Creature} creature - Creature to update
     */
    updateStatsForLevel(creature) {
        // Get base stats from barcode (level 1 stats)
        const barcodeProcessor = new BarcodeProcessor();
        const baseStats = barcodeProcessor.calculateStats(creature.barcode);
        
        // Calculate stats at current level
        const newMaxHp = GameUtils.calculateStatAtLevel(baseStats.maxHp, creature.level);
        const newAttack = GameUtils.calculateStatAtLevel(baseStats.attack, creature.level);
        const newDefense = GameUtils.calculateStatAtLevel(baseStats.defense, creature.level);
        const newSpeed = GameUtils.calculateStatAtLevel(baseStats.speed, creature.level);
        
        // Calculate HP increase to maintain current HP ratio
        const hpRatio = creature.stats.hp / creature.stats.maxHp;
        
        // Update stats
        creature.stats.maxHp = newMaxHp;
        creature.stats.attack = newAttack;
        creature.stats.defense = newDefense;
        creature.stats.speed = newSpeed;
        
        // Update current HP maintaining the same ratio (but at least 1)
        creature.stats.hp = Math.max(1, Math.floor(newMaxHp * hpRatio));
    }

    /**
     * Level up a creature directly (for testing or admin purposes)
     * @param {string} creatureId - ID of the creature
     * @param {number} levels - Number of levels to gain (default: 1)
     * @returns {Object} Level up result
     */
    levelUpCreature(creatureId, levels = 1) {
        const creature = this.creatures.get(creatureId);
        if (!creature) {
            console.error(`Creature not found: ${creatureId}`);
            return { success: false, error: 'Creature not found' };
        }

        if (levels < 1) {
            console.error('Levels must be positive');
            return { success: false, error: 'Invalid level amount' };
        }

        const oldLevel = creature.level;
        const oldStats = GameUtils.deepClone(creature.stats);
        
        // Add levels directly
        creature.level += levels;
        
        // Update stats for new level
        this.updateStatsForLevel(creature);
        
        // Update experience requirements
        creature.experienceToNext = GameUtils.calculateExperienceToNext(creature.level);
        
        // Save changes
        this.saveCreatures();
        
        const result = {
            success: true,
            oldLevel: oldLevel,
            newLevel: creature.level,
            levelsGained: levels,
            oldStats: oldStats,
            newStats: GameUtils.deepClone(creature.stats),
            statGains: this.calculateStatGains(oldStats, creature.stats)
        };
        
        console.log(`${creature.name} leveled up from ${oldLevel} to ${creature.level}!`);
        return result;
    }

    /**
     * Update creature battle statistics
     * @param {string} creatureId - ID of the creature
     * @param {boolean} won - Whether the creature won the battle
     * @param {number} experienceGained - Experience gained from battle
     * @returns {boolean} Whether the update was successful
     */
    updateBattleStats(creatureId, won, experienceGained = 0) {
        const creature = this.creatures.get(creatureId);
        if (!creature) {
            console.error(`Creature not found: ${creatureId}`);
            return false;
        }

        // Update battle statistics
        if (won) {
            creature.battlesWon += 1;
        } else {
            creature.battlesLost += 1;
        }

        // Award experience if provided
        if (experienceGained > 0) {
            this.awardExperience(creatureId, experienceGained);
        } else {
            // Save changes even if no experience was gained
            this.saveCreatures();
        }

        return true;
    }

    /**
     * Calculate win rate for a creature
     * @param {Creature} creature - Creature to calculate win rate for
     * @returns {number} Win rate as a decimal (0.0 to 1.0)
     */
    calculateWinRate(creature) {
        const totalBattles = creature.battlesWon + creature.battlesLost;
        return totalBattles > 0 ? creature.battlesWon / totalBattles : 0;
    }

    /**
     * Calculate stat gains between two stat objects
     * @param {CreatureStats} oldStats - Previous stats
     * @param {CreatureStats} newStats - New stats
     * @returns {Object} Stat gains
     */
    calculateStatGains(oldStats, newStats) {
        return {
            maxHp: newStats.maxHp - oldStats.maxHp,
            attack: newStats.attack - oldStats.attack,
            defense: newStats.defense - oldStats.defense,
            speed: newStats.speed - oldStats.speed
        };
    }

    /**
     * Get collection statistics
     * @returns {Object} Collection statistics
     */
    getCollectionStats() {
        const creatures = Array.from(this.creatures.values());
        
        if (creatures.length === 0) {
            return {
                totalCreatures: 0,
                averageLevel: 0,
                totalBattles: 0,
                totalVictories: 0,
                overallWinRate: 0,
                highestLevel: 0,
                oldestDiscovery: null,
                newestDiscovery: null
            };
        }

        const totalBattles = creatures.reduce((sum, c) => sum + c.battlesWon + c.battlesLost, 0);
        const totalVictories = creatures.reduce((sum, c) => sum + c.battlesWon, 0);
        const averageLevel = creatures.reduce((sum, c) => sum + c.level, 0) / creatures.length;
        const highestLevel = Math.max(...creatures.map(c => c.level));
        
        const discoveryDates = creatures.map(c => new Date(c.discoveryDate));
        const oldestDiscovery = new Date(Math.min(...discoveryDates));
        const newestDiscovery = new Date(Math.max(...discoveryDates));

        return {
            totalCreatures: creatures.length,
            averageLevel: Math.round(averageLevel * 10) / 10, // Round to 1 decimal
            totalBattles: totalBattles,
            totalVictories: totalVictories,
            overallWinRate: totalBattles > 0 ? totalVictories / totalBattles : 0,
            highestLevel: highestLevel,
            oldestDiscovery: oldestDiscovery,
            newestDiscovery: newestDiscovery
        };
    }

    /**
     * Remove a creature from the collection
     * @param {string} creatureId - ID of the creature to remove
     * @returns {boolean} Whether the creature was successfully removed
     */
    removeCreature(creatureId) {
        const creature = this.creatures.get(creatureId);
        if (!creature) {
            console.error(`Creature not found: ${creatureId}`);
            return false;
        }

        this.creatures.delete(creatureId);
        this.saveCreatures();
        
        console.log(`Removed creature ${creature.name} from collection`);
        return true;
    }

    /**
     * Clear all creatures from the collection
     * @returns {boolean} Whether the collection was successfully cleared
     */
    clearCollection() {
        this.creatures.clear();
        this.saveCreatures();
        
        console.log('Cleared creature collection');
        return true;
    }

    /**
     * Load creatures from storage
     */
    loadCreatures() {
        try {
            const creaturesArray = this.storageManager.loadData(GameConstants.STORAGE_KEYS.CREATURES, []);
            
            // Validate and load each creature
            for (const creatureData of creaturesArray) {
                if (DataValidation.isValidCreature(creatureData)) {
                    // Convert discoveryDate back to Date object
                    creatureData.discoveryDate = new Date(creatureData.discoveryDate);
                    this.creatures.set(creatureData.id, creatureData);
                } else {
                    console.warn('Invalid creature data found in storage:', creatureData);
                }
            }
            
            console.log(`Loaded ${this.creatures.size} creatures from storage`);
        } catch (error) {
            console.error('Error loading creatures from storage:', error);
            this.creatures.clear();
        }
    }

    /**
     * Save creatures to storage
     */
    saveCreatures() {
        try {
            const creaturesArray = Array.from(this.creatures.values());
            const success = this.storageManager.saveData(GameConstants.STORAGE_KEYS.CREATURES, creaturesArray);
            
            if (!success) {
                console.warn('Failed to save creatures to storage');
            }
        } catch (error) {
            console.error('Error saving creatures to storage:', error);
        }
    }

    /**
     * Export collection data for backup
     * @returns {string} JSON string of collection data
     */
    exportCollection() {
        const exportData = {
            creatures: Array.from(this.creatures.values()),
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Import collection data from backup
     * @param {string} jsonData - JSON string of collection data
     * @param {boolean} merge - Whether to merge with existing collection (default: false)
     * @returns {Object} Import result
     */
    importCollection(jsonData, merge = false) {
        try {
            const importData = JSON.parse(jsonData);
            
            if (!importData.creatures || !Array.isArray(importData.creatures)) {
                return { success: false, error: 'Invalid import data format' };
            }

            if (!merge) {
                this.creatures.clear();
            }

            let imported = 0;
            let skipped = 0;

            for (const creatureData of importData.creatures) {
                if (DataValidation.isValidCreature(creatureData)) {
                    // Convert discoveryDate back to Date object
                    creatureData.discoveryDate = new Date(creatureData.discoveryDate);
                    
                    // Check for duplicates if merging
                    if (merge && this.creatures.has(creatureData.id)) {
                        skipped++;
                        continue;
                    }
                    
                    this.creatures.set(creatureData.id, creatureData);
                    imported++;
                } else {
                    console.warn('Invalid creature data in import:', creatureData);
                    skipped++;
                }
            }

            this.saveCreatures();

            return {
                success: true,
                imported: imported,
                skipped: skipped,
                total: importData.creatures.length
            };

        } catch (error) {
            console.error('Error importing collection:', error);
            return { success: false, error: error.message };
        }
    }
}

// Export for use in other modules (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CreatureManager;
}

// Make available globally in browser
if (typeof window !== 'undefined') {
    window.CreatureManager = CreatureManager;
}/**
 * CreatureManager - Manages creature collection and operations
 * Handles creature storage, retrieval, leveling, and collection management
 */

class CreatureManager {
    constructor() {
        this.creatures = new Map(); // Use Map for efficient lookups by ID
        this.loadCreatures();
    }

    /**
     * Adds a creature to the collection
     * @param {Creature} creature - Creature to add
     * @returns {boolean} Whether the creature was successfully added
     */
    addCreature(creature) {
        // Validate creature data
        if (!DataValidation.isValidCreature(creature)) {
            console.error('Invalid creature data:', creature);
            return false;
        }

        // Check if creature with same barcode already exists
        const existingCreature = this.findCreatureByBarcode(creature.barcode);
        if (existingCreature) {
            console.log(`Creature with barcode ${creature.barcode} already exists:`, existingCreature.name);
            return false;
        }

        // Add creature to collection
        this.creatures.set(creature.id, creature);
        
        // Save to localStorage
        this.saveCreatures();
        
        console.log(`Added creature ${creature.name} to collection`);
        return true;
    }

    /**
     * Gets a creature by ID
     * @param {string} creatureId - ID of the creature to retrieve
     * @returns {Creature|null} The creature or null if not found
     */
    getCreature(creatureId) {
        return this.creatures.get(creatureId) || null;
    }

    /**
     * Gets all creatures in the collection
     * @returns {Creature[]} Array of all creatures
     */
    getCollection() {
        return Array.from(this.creatures.values());
    }

    /**
     * Finds a creature by barcode
     * @param {string} barcode - Barcode to search for
     * @returns {Creature|null} The creature or null if not found
     */
    findCreatureByBarcode(barcode) {
        for (const creature of this.creatures.values()) {
            if (creature.barcode === barcode) {
                return creature;
            }
        }
        return null;
    }

    /**
     * Removes a creature from the collection
     * @param {string} creatureId - ID of the creature to remove
     * @returns {boolean} Whether the creature was successfully removed
     */
    removeCreature(creatureId) {
        const creature = this.creatures.get(creatureId);
        if (!creature) {
            return false;
        }

        this.creatures.delete(creatureId);
        this.saveCreatures();
        
        console.log(`Removed creature ${creature.name} from collection`);
        return true;
    }

    /**
     * Levels up a creature and increases its stats
     * @param {string} creatureId - ID of the creature to level up
     * @param {number} experienceGained - Experience points to add
     * @returns {boolean} Whether the creature leveled up
     */
    levelUpCreature(creatureId, experienceGained) {
        const creature = this.getCreature(creatureId);
        if (!creature) {
            console.error(`Creature with ID ${creatureId} not found`);
            return false;
        }

        // Add experience
        creature.experience += experienceGained;
        
        let leveledUp = false;
        
        // Check for level ups
        while (creature.experience >= creature.experienceToNext) {
            creature.experience -= creature.experienceToNext;
            creature.level++;
            leveledUp = true;
            
            // Increase stats
            this.increaseCreatureStats(creature);
            
            // Calculate new experience requirement
            creature.experienceToNext = GameUtils.calculateExperienceToNext(creature.level);
            
            console.log(`${creature.name} leveled up to level ${creature.level}!`);
        }

        // Save changes
        this.saveCreatures();
        
        return leveledUp;
    }

    /**
     * Increases creature stats when leveling up
     * @param {Creature} creature - Creature to increase stats for
     */
    increaseCreatureStats(creature) {
        const statIncrease = GameConstants.STAT_GROWTH_PER_LEVEL;
        
        // Increase all stats
        creature.stats.maxHp += statIncrease;
        creature.stats.hp = creature.stats.maxHp; // Heal to full on level up
        creature.stats.attack += statIncrease;
        creature.stats.defense += statIncrease;
        creature.stats.speed += statIncrease;
    }

    /**
     * Heals a creature to full HP
     * @param {string} creatureId - ID of the creature to heal
     * @returns {boolean} Whether the creature was successfully healed
     */
    healCreature(creatureId) {
        const creature = this.getCreature(creatureId);
        if (!creature) {
            return false;
        }

        creature.stats.hp = creature.stats.maxHp;
        this.saveCreatures();
        
        return true;
    }

    /**
     * Updates creature battle statistics
     * @param {string} creatureId - ID of the creature
     * @param {boolean} won - Whether the creature won the battle
     */
    updateBattleStats(creatureId, won) {
        const creature = this.getCreature(creatureId);
        if (!creature) {
            return;
        }

        if (won) {
            creature.battlesWon++;
        } else {
            creature.battlesLost++;
        }

        this.saveCreatures();
    }

    /**
     * Sorts the creature collection by specified criteria
     * @param {string} criteria - Sort criteria ('name', 'level', 'discovery', 'barcode')
     * @param {boolean} ascending - Whether to sort in ascending order
     * @returns {Creature[]} Sorted array of creatures
     */
    sortCollection(criteria, ascending = true) {
        const creatures = this.getCollection();
        
        creatures.sort((a, b) => {
            let valueA, valueB;
            
            switch (criteria) {
                case 'name':
                    valueA = a.name.toLowerCase();
                    valueB = b.name.toLowerCase();
                    break;
                case 'level':
                    valueA = a.level;
                    valueB = b.level;
                    break;
                case 'discovery':
                    valueA = new Date(a.discoveryDate);
                    valueB = new Date(b.discoveryDate);
                    break;
                case 'barcode':
                    valueA = a.barcode;
                    valueB = b.barcode;
                    break;
                case 'hp':
                    valueA = a.stats.maxHp;
                    valueB = b.stats.maxHp;
                    break;
                case 'attack':
                    valueA = a.stats.attack;
                    valueB = b.stats.attack;
                    break;
                case 'defense':
                    valueA = a.stats.defense;
                    valueB = b.stats.defense;
                    break;
                case 'speed':
                    valueA = a.stats.speed;
                    valueB = b.stats.speed;
                    break;
                default:
                    console.warn(`Unknown sort criteria: ${criteria}`);
                    return 0;
            }
            
            if (valueA < valueB) return ascending ? -1 : 1;
            if (valueA > valueB) return ascending ? 1 : -1;
            return 0;
        });
        
        return creatures;
    }

    /**
     * Filters creatures by various criteria
     * @param {Object} filters - Filter criteria
     * @returns {Creature[]} Filtered array of creatures
     */
    filterCreatures(filters = {}) {
        let creatures = this.getCollection();
        
        // Filter by minimum level
        if (filters.minLevel) {
            creatures = creatures.filter(c => c.level >= filters.minLevel);
        }
        
        // Filter by maximum level
        if (filters.maxLevel) {
            creatures = creatures.filter(c => c.level <= filters.maxLevel);
        }
        
        // Filter by name (partial match)
        if (filters.name) {
            const searchName = filters.name.toLowerCase();
            creatures = creatures.filter(c => c.name.toLowerCase().includes(searchName));
        }
        
        // Filter by barcode (partial match)
        if (filters.barcode) {
            creatures = creatures.filter(c => c.barcode.includes(filters.barcode));
        }
        
        // Filter by battle experience (creatures that have battled)
        if (filters.hasBattled) {
            creatures = creatures.filter(c => (c.battlesWon + c.battlesLost) > 0);
        }
        
        return creatures;
    }

    /**
     * Gets collection statistics
     * @returns {Object} Collection statistics
     */
    getCollectionStats() {
        const creatures = this.getCollection();
        
        if (creatures.length === 0) {
            return {
                totalCreatures: 0,
                averageLevel: 0,
                highestLevel: 0,
                totalBattles: 0,
                winRate: 0
            };
        }
        
        const totalLevel = creatures.reduce((sum, c) => sum + c.level, 0);
        const totalWins = creatures.reduce((sum, c) => sum + c.battlesWon, 0);
        const totalLosses = creatures.reduce((sum, c) => sum + c.battlesLost, 0);
        const totalBattles = totalWins + totalLosses;
        
        return {
            totalCreatures: creatures.length,
            averageLevel: totalLevel / creatures.length,
            highestLevel: Math.max(...creatures.map(c => c.level)),
            totalBattles: totalBattles,
            winRate: totalBattles > 0 ? (totalWins / totalBattles) * 100 : 0
        };
    }

    /**
     * Loads creatures from localStorage
     */
    loadCreatures() {
        try {
            const stored = localStorage.getItem(GameConstants.STORAGE_KEYS.CREATURES);
            if (stored) {
                const creaturesData = JSON.parse(stored);
                
                // Validate and load each creature
                creaturesData.forEach(creatureData => {
                    // Convert date strings back to Date objects
                    if (creatureData.discoveryDate) {
                        creatureData.discoveryDate = new Date(creatureData.discoveryDate);
                    }
                    
                    if (DataValidation.isValidCreature(creatureData)) {
                        this.creatures.set(creatureData.id, creatureData);
                    } else {
                        console.warn('Invalid creature data found in storage:', creatureData);
                    }
                });
                
                console.log(`Loaded ${this.creatures.size} creatures from storage`);
            }
        } catch (error) {
            console.error('Error loading creatures from storage:', error);
        }
    }

    /**
     * Saves creatures to localStorage
     */
    saveCreatures() {
        try {
            const creaturesArray = Array.from(this.creatures.values());
            localStorage.setItem(GameConstants.STORAGE_KEYS.CREATURES, JSON.stringify(creaturesArray));
        } catch (error) {
            console.error('Error saving creatures to storage:', error);
            
            // Handle storage quota exceeded
            if (error.name === 'QuotaExceededError') {
                console.warn('Storage quota exceeded. Consider implementing data cleanup.');
                // Could implement cleanup logic here
            }
        }
    }

    /**
     * Clears all creatures from the collection
     * @returns {boolean} Whether the collection was successfully cleared
     */
    clearCollection() {
        this.creatures.clear();
        
        try {
            localStorage.removeItem(GameConstants.STORAGE_KEYS.CREATURES);
            console.log('Collection cleared');
            return true;
        } catch (error) {
            console.error('Error clearing collection:', error);
            return false;
        }
    }

    /**
     * Exports creature collection data
     * @returns {string} JSON string of creature data
     */
    exportData() {
        const creaturesArray = Array.from(this.creatures.values());
        return JSON.stringify({
            exportDate: new Date().toISOString(),
            version: '1.0',
            creatures: creaturesArray
        }, null, 2);
    }

    /**
     * Imports creature collection data
     * @param {string} jsonData - JSON string of creature data
     * @returns {boolean} Whether the import was successful
     */
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (!data.creatures || !Array.isArray(data.creatures)) {
                throw new Error('Invalid data format');
            }
            
            // Clear existing collection
            this.creatures.clear();
            
            // Import creatures
            let importedCount = 0;
            data.creatures.forEach(creatureData => {
                // Convert date strings back to Date objects
                if (creatureData.discoveryDate) {
                    creatureData.discoveryDate = new Date(creatureData.discoveryDate);
                }
                
                if (DataValidation.isValidCreature(creatureData)) {
                    this.creatures.set(creatureData.id, creatureData);
                    importedCount++;
                } else {
                    console.warn('Invalid creature data in import:', creatureData);
                }
            });
            
            // Save imported data
            this.saveCreatures();
            
            console.log(`Imported ${importedCount} creatures`);
            return true;
            
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
}

// Export for use in other modules (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CreatureManager;
}

// Make available globally in browser
if (typeof window !== 'undefined') {
    window.CreatureManager = CreatureManager;
}