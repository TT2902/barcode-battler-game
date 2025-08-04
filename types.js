/**
 * Core Data Models and Interfaces for Barcode Battler Game
 * These TypeScript-style interfaces define the structure of our data models
 */

/**
 * @typedef {Object} CreatureStats
 * @property {number} hp - Current hit points
 * @property {number} maxHp - Maximum hit points
 * @property {number} attack - Attack power
 * @property {number} defense - Defense power
 * @property {number} speed - Speed stat for turn order
 */

/**
 * @typedef {Object} Creature
 * @property {string} id - Unique identifier for the creature
 * @property {string} name - Generated name of the creature
 * @property {string} barcode - Source barcode used to generate this creature
 * @property {CreatureStats} stats - Creature's combat statistics
 * @property {number} level - Current level of the creature
 * @property {number} experience - Current experience points
 * @property {number} experienceToNext - Experience points needed for next level
 * @property {Date} discoveryDate - When this creature was first discovered
 * @property {number} battlesWon - Number of battles won
 * @property {number} battlesLost - Number of battles lost
 */

/**
 * @typedef {Object} BattleAction
 * @property {'attack'|'special'|'defend'} type - Type of action performed
 * @property {number} damage - Damage dealt (0 for non-damaging actions)
 * @property {boolean} critical - Whether this was a critical hit
 * @property {Date} timestamp - When the action was performed
 * @property {string} description - Human-readable description of the action
 * @property {string} actor - ID of the creature performing the action
 * @property {string} target - ID of the creature being targeted
 */

/**
 * @typedef {Object} Battle
 * @property {string} id - Unique identifier for the battle
 * @property {Creature} playerCreature - Player's creature in battle
 * @property {Creature} opponentCreature - Opponent's creature in battle
 * @property {'player'|'opponent'} currentTurn - Whose turn it is
 * @property {number} turnCount - Current turn number
 * @property {BattleAction[]} battleLog - History of all actions in this battle
 * @property {'active'|'won'|'lost'} status - Current battle status
 * @property {string} difficulty - Difficulty level of the battle
 * @property {Date} startTime - When the battle began
 * @property {Date|null} endTime - When the battle ended (null if active)
 */

/**
 * @typedef {Object} GameSettings
 * @property {'easy'|'medium'|'hard'} difficulty - Current difficulty level
 * @property {boolean} soundEnabled - Whether sound effects are enabled
 * @property {boolean} highContrastMode - Whether high contrast mode is active
 * @property {boolean} cameraEnabled - Whether camera scanning is enabled
 * @property {string} lastBackupDate - ISO string of last data backup
 */

/**
 * @typedef {Object} GameData
 * @property {Creature[]} creatures - Player's creature collection
 * @property {Battle[]} battleHistory - History of completed battles
 * @property {GameSettings} settings - Game configuration settings
 * @property {number} totalBattles - Total number of battles fought
 * @property {number} totalVictories - Total number of battles won
 * @property {Date} gameStartDate - When the player first started playing
 * @property {Date} lastPlayDate - When the player last played
 */

/**
 * @typedef {Object} BattleResult
 * @property {'hit'|'miss'|'critical'|'blocked'} outcome - Result of the action
 * @property {number} damage - Damage dealt
 * @property {string} message - Description of what happened
 * @property {boolean} battleEnded - Whether this action ended the battle
 * @property {Creature|null} winner - Winning creature if battle ended
 * @property {number} experienceGained - Experience points awarded
 */

/**
 * @typedef {Object} CreatureGenerationData
 * @property {string} barcode - Source barcode
 * @property {number} seed - Numeric seed derived from barcode
 * @property {string} name - Generated creature name
 * @property {CreatureStats} baseStats - Base statistics before level modifications
 * @property {string[]} nameSyllables - Syllables used to generate the name
 */

/**
 * Validation functions for data integrity
 */
const DataValidation = {
    /**
     * Validates a barcode string
     * @param {string} barcode - Barcode to validate
     * @returns {boolean} Whether the barcode is valid
     */
    isValidBarcode(barcode) {
        if (typeof barcode !== 'string') return false;
        if (barcode.length < 8) return false;
        return /^\d+$/.test(barcode);
    },

    /**
     * Validates a creature object
     * @param {any} creature - Object to validate as creature
     * @returns {boolean} Whether the object is a valid creature
     */
    isValidCreature(creature) {
        if (!creature || typeof creature !== 'object') return false;
        
        const requiredFields = ['id', 'name', 'barcode', 'stats', 'level', 'experience'];
        for (const field of requiredFields) {
            if (!(field in creature)) return false;
        }
        
        if (!this.isValidBarcode(creature.barcode)) return false;
        if (typeof creature.level !== 'number' || creature.level < 1) return false;
        if (typeof creature.experience !== 'number' || creature.experience < 0) return false;
        
        return this.isValidCreatureStats(creature.stats);
    },

    /**
     * Validates creature stats object
     * @param {any} stats - Object to validate as creature stats
     * @returns {boolean} Whether the object is valid creature stats
     */
    isValidCreatureStats(stats) {
        if (!stats || typeof stats !== 'object') return false;
        
        const requiredFields = ['hp', 'maxHp', 'attack', 'defense', 'speed'];
        for (const field of requiredFields) {
            if (typeof stats[field] !== 'number' || stats[field] < 0) return false;
        }
        
        return stats.hp <= stats.maxHp;
    },

    /**
     * Validates a battle action object
     * @param {any} action - Object to validate as battle action
     * @returns {boolean} Whether the object is a valid battle action
     */
    isValidBattleAction(action) {
        if (!action || typeof action !== 'object') return false;
        
        const validTypes = ['attack', 'special', 'defend'];
        if (!validTypes.includes(action.type)) return false;
        
        const requiredFields = ['damage', 'critical', 'timestamp', 'description', 'actor', 'target'];
        for (const field of requiredFields) {
            if (!(field in action)) return false;
        }
        
        if (typeof action.damage !== 'number' || action.damage < 0) return false;
        if (typeof action.critical !== 'boolean') return false;
        
        return true;
    }
};

/**
 * Constants used throughout the game
 */
const GameConstants = {
    // Creature generation constants
    MIN_BARCODE_LENGTH: 8,
    MAX_BARCODE_LENGTH: 20,
    
    // Base stat ranges
    BASE_HP_MIN: 80,
    BASE_HP_MAX: 120,
    BASE_ATTACK_MIN: 30,
    BASE_ATTACK_MAX: 70,
    BASE_DEFENSE_MIN: 25,
    BASE_DEFENSE_MAX: 65,
    BASE_SPEED_MIN: 20,
    BASE_SPEED_MAX: 60,
    
    // Level progression
    BASE_EXPERIENCE_TO_LEVEL: 100,
    EXPERIENCE_MULTIPLIER: 1.5,
    STAT_GROWTH_PER_LEVEL: 5,
    
    // Battle constants
    CRITICAL_HIT_CHANCE: 0.1,
    CRITICAL_HIT_MULTIPLIER: 1.5,
    DEFEND_DAMAGE_REDUCTION: 0.5,
    SPECIAL_ATTACK_MULTIPLIER: 1.3,
    
    // Difficulty modifiers
    DIFFICULTY_MODIFIERS: {
        easy: { hp: 0.8, attack: 0.8, defense: 0.8, speed: 0.8 },
        medium: { hp: 1.0, attack: 1.0, defense: 1.0, speed: 1.0 },
        hard: { hp: 1.2, attack: 1.2, defense: 1.2, speed: 1.2 }
    },
    
    // UI constants
    ANIMATION_DURATION: 300,
    BATTLE_LOG_MAX_ENTRIES: 50,
    
    // Storage keys
    STORAGE_KEYS: {
        CREATURES: 'barcode_battler_creatures',
        SETTINGS: 'barcode_battler_settings',
        BATTLE_HISTORY: 'barcode_battler_battles',
        GAME_DATA: 'barcode_battler_game_data'
    }
};

/**
 * Utility functions for working with game data
 */
const GameUtils = {
    /**
     * Generates a unique ID
     * @returns {string} Unique identifier
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Calculates experience needed for next level
     * @param {number} level - Current level
     * @returns {number} Experience points needed for next level
     */
    calculateExperienceToNext(level) {
        return Math.floor(GameConstants.BASE_EXPERIENCE_TO_LEVEL * Math.pow(GameConstants.EXPERIENCE_MULTIPLIER, level - 1));
    },

    /**
     * Calculates stat value at a given level
     * @param {number} baseStat - Base stat value
     * @param {number} level - Current level
     * @returns {number} Stat value at the given level
     */
    calculateStatAtLevel(baseStat, level) {
        return baseStat + ((level - 1) * GameConstants.STAT_GROWTH_PER_LEVEL);
    },

    /**
     * Clamps a number between min and max values
     * @param {number} value - Value to clamp
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Clamped value
     */
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    /**
     * Formats a date for display
     * @param {Date} date - Date to format
     * @returns {string} Formatted date string
     */
    formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    },

    /**
     * Creates a deep copy of an object
     * @param {any} obj - Object to clone
     * @returns {any} Deep copy of the object
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
};

// Export for use in other modules (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DataValidation,
        GameConstants,
        GameUtils
    };
}