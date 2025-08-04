/**
 * BarcodeProcessor - Handles barcode validation and creature generation
 * Implements deterministic creature generation from barcode data
 */

class BarcodeProcessor {
    constructor() {
        // Expanded syllable set for more diverse creature names
        this.syllables = [
            // Common syllables
            'ka', 'ri', 'mo', 'na', 'zu', 'te', 'lo', 'xi', 'ba', 'do',
            'fe', 'gu', 'hi', 'ja', 'ko', 'lu', 'me', 'no', 'po', 'qu',
            'ra', 'si', 'tu', 'vo', 'wa', 'xe', 'ya', 'zi', 'bo', 'cu',
            'da', 'el', 'fi', 'go', 'hu', 'iv', 'jo', 'ke', 'li', 'ma',
            // Additional syllables for variety
            'ar', 'en', 'or', 'un', 'al', 'er', 'in', 'on', 'at', 'ed',
            'is', 'it', 'ou', 'an', 'he', 'wa', 'fo', 'nd', 'ng', 'ha',
            'th', 're', 've', 'st', 'gh', 'nd', 'le', 'se', 'nt', 'ti',
            'ro', 'ur', 'li', 'ch', 'la', 'ne', 'mi', 'el', 'co', 'de'
        ];
        
        // Name patterns for different creature types based on barcode characteristics
        this.namePatterns = [
            { minLength: 2, maxLength: 3, style: 'short' },    // Short, punchy names
            { minLength: 3, maxLength: 4, style: 'medium' },   // Medium length names
            { minLength: 4, maxLength: 5, style: 'long' }      // Longer, more complex names
        ];
    }

    /**
     * Validates a barcode string according to game requirements
     * @param {string} barcode - Barcode string to validate
     * @returns {boolean} Whether the barcode is valid
     */
    validateBarcode(barcode) {
        // Check if barcode is a string
        if (typeof barcode !== 'string') {
            return false;
        }

        // Check minimum length (8 digits)
        if (barcode.length < GameConstants.MIN_BARCODE_LENGTH) {
            return false;
        }

        // Check maximum length to prevent extremely long inputs
        if (barcode.length > GameConstants.MAX_BARCODE_LENGTH) {
            return false;
        }

        // Check numeric format (only digits allowed)
        if (!/^\d+$/.test(barcode)) {
            return false;
        }

        return true;
    }

    /**
     * Generates a deterministic seed from barcode for consistent creature generation
     * @param {string} barcode - Valid barcode string
     * @returns {number} Numeric seed for random generation
     */
    generateSeed(barcode) {
        let seed = 0;
        for (let i = 0; i < barcode.length; i++) {
            const digit = parseInt(barcode[i]);
            // Use position-based weighting to create more variation
            seed += digit * (i + 1) * 31; // 31 is a prime number for better distribution
        }
        return seed;
    }

    /**
     * Deterministic random number generator using Linear Congruential Generator
     * @param {number} seed - Seed value for random generation
     * @returns {Function} Random number generator function
     */
    createSeededRandom(seed) {
        let current = seed % 2147483647; // Use modulo to keep within 32-bit range
        if (current <= 0) current += 2147483646;

        return function() {
            current = (current * 16807) % 2147483647;
            return (current - 1) / 2147483646;
        };
    }

    /**
     * Calculates creature stats based on barcode digit positions
     * @param {string} barcode - Valid barcode string
     * @returns {CreatureStats} Generated creature statistics
     */
    calculateStats(barcode) {
        const random = this.createSeededRandom(this.generateSeed(barcode));
        
        // Use different digit positions for different stats to ensure variation
        const hpBase = this.getStatFromDigits(barcode, [0, 1], GameConstants.BASE_HP_MIN, GameConstants.BASE_HP_MAX);
        const attackBase = this.getStatFromDigits(barcode, [2, 3], GameConstants.BASE_ATTACK_MIN, GameConstants.BASE_ATTACK_MAX);
        const defenseBase = this.getStatFromDigits(barcode, [4, 5], GameConstants.BASE_DEFENSE_MIN, GameConstants.BASE_DEFENSE_MAX);
        const speedBase = this.getStatFromDigits(barcode, [6, 7], GameConstants.BASE_SPEED_MIN, GameConstants.BASE_SPEED_MAX);

        // Add some randomness using seeded random for more variation
        const hp = Math.floor(hpBase + (random() * 20 - 10)); // ±10 variation
        const attack = Math.floor(attackBase + (random() * 10 - 5)); // ±5 variation
        const defense = Math.floor(defenseBase + (random() * 10 - 5)); // ±5 variation
        const speed = Math.floor(speedBase + (random() * 10 - 5)); // ±5 variation

        // Ensure stats are within valid ranges
        return {
            hp: GameUtils.clamp(hp, GameConstants.BASE_HP_MIN, GameConstants.BASE_HP_MAX),
            maxHp: GameUtils.clamp(hp, GameConstants.BASE_HP_MIN, GameConstants.BASE_HP_MAX),
            attack: GameUtils.clamp(attack, GameConstants.BASE_ATTACK_MIN, GameConstants.BASE_ATTACK_MAX),
            defense: GameUtils.clamp(defense, GameConstants.BASE_DEFENSE_MIN, GameConstants.BASE_DEFENSE_MAX),
            speed: GameUtils.clamp(speed, GameConstants.BASE_SPEED_MIN, GameConstants.BASE_SPEED_MAX)
        };
    }

    /**
     * Extracts stat value from specific barcode digit positions
     * @param {string} barcode - Barcode string
     * @param {number[]} positions - Array of digit positions to use
     * @param {number} min - Minimum stat value
     * @param {number} max - Maximum stat value
     * @returns {number} Calculated stat value
     */
    getStatFromDigits(barcode, positions, min, max) {
        let sum = 0;
        for (const pos of positions) {
            if (pos < barcode.length) {
                sum += parseInt(barcode[pos]);
            }
        }
        
        // Map sum to the desired range
        const range = max - min;
        const maxSum = positions.length * 9; // Maximum possible sum (all 9s)
        const normalized = sum / maxSum; // Normalize to 0-1
        
        return min + Math.floor(normalized * range);
    }

    /**
     * Generates a creature name using syllable-based generation
     * @param {string} barcode - Valid barcode string
     * @returns {string} Generated creature name
     */
    generateCreatureName(barcode) {
        const seed = this.generateSeed(barcode);
        const random = this.createSeededRandom(seed);
        
        // Choose name pattern based on barcode characteristics
        const patternIndex = Math.floor(random() * this.namePatterns.length);
        const pattern = this.namePatterns[patternIndex];
        
        // Generate name length within pattern range
        const nameLength = pattern.minLength + Math.floor(random() * (pattern.maxLength - pattern.minLength + 1));
        
        let name = '';
        let usedSyllables = new Set(); // Avoid repeating syllables in short names
        
        for (let i = 0; i < nameLength; i++) {
            let syllableIndex;
            let syllable;
            let attempts = 0;
            
            // For shorter names, try to avoid repeating syllables
            do {
                syllableIndex = Math.floor(random() * this.syllables.length);
                syllable = this.syllables[syllableIndex];
                attempts++;
            } while (nameLength <= 3 && usedSyllables.has(syllable) && attempts < 10);
            
            usedSyllables.add(syllable);
            name += syllable;
        }
        
        // Apply name styling based on pattern
        name = this.applyNameStyling(name, pattern.style, random);
        
        // Capitalize first letter
        return name.charAt(0).toUpperCase() + name.slice(1);
    }
    
    /**
     * Applies styling to creature names based on pattern type
     * @param {string} name - Base name to style
     * @param {string} style - Style type ('short', 'medium', 'long')
     * @param {Function} random - Seeded random function
     * @returns {string} Styled name
     */
    applyNameStyling(name, style, random) {
        switch (style) {
            case 'short':
                // Short names might have doubled consonants or vowel changes
                if (random() < 0.3) {
                    const pos = Math.floor(random() * (name.length - 1)) + 1;
                    const char = name[pos];
                    if ('bcdfghjklmnpqrstvwxyz'.includes(char)) {
                        name = name.slice(0, pos) + char + name.slice(pos);
                    }
                }
                break;
                
            case 'medium':
                // Medium names are used as-is mostly
                break;
                
            case 'long':
                // Long names might have apostrophes or hyphens
                if (random() < 0.2 && name.length > 4) {
                    const pos = Math.floor(random() * (name.length - 2)) + 2;
                    name = name.slice(0, pos) + "'" + name.slice(pos);
                }
                break;
        }
        
        return name;
    }
    
    /**
     * Gets detailed name generation data for testing/debugging
     * @param {string} barcode - Valid barcode string
     * @returns {Object} Name generation details
     */
    getNameGenerationData(barcode) {
        if (!this.validateBarcode(barcode)) {
            return null;
        }
        
        const seed = this.generateSeed(barcode);
        const random = this.createSeededRandom(seed);
        
        const patternIndex = Math.floor(random() * this.namePatterns.length);
        const pattern = this.namePatterns[patternIndex];
        const nameLength = pattern.minLength + Math.floor(random() * (pattern.maxLength - pattern.minLength + 1));
        
        // Regenerate to get the syllables used
        const nameRandom = this.createSeededRandom(seed);
        nameRandom(); // Skip pattern selection
        nameRandom(); // Skip length calculation
        
        const syllablesUsed = [];
        for (let i = 0; i < nameLength; i++) {
            const syllableIndex = Math.floor(nameRandom() * this.syllables.length);
            syllablesUsed.push(this.syllables[syllableIndex]);
        }
        
        return {
            barcode: barcode,
            seed: seed,
            pattern: pattern,
            nameLength: nameLength,
            syllablesUsed: syllablesUsed,
            finalName: this.generateCreatureName(barcode)
        };
    }

    /**
     * Generates a complete creature from a barcode
     * @param {string} barcode - Barcode string to process
     * @returns {Creature|null} Generated creature or null if barcode is invalid
     */
    generateCreature(barcode) {
        // Validate barcode first
        if (!this.validateBarcode(barcode)) {
            return null;
        }

        // Generate creature data
        const stats = this.calculateStats(barcode);
        const name = this.generateCreatureName(barcode);
        const id = GameUtils.generateId();

        // Create creature object
        const creature = {
            id: id,
            name: name,
            barcode: barcode,
            stats: stats,
            level: 1,
            experience: 0,
            experienceToNext: GameUtils.calculateExperienceToNext(1),
            discoveryDate: new Date(),
            battlesWon: 0,
            battlesLost: 0
        };

        // Validate the generated creature
        if (!DataValidation.isValidCreature(creature)) {
            console.error('Generated invalid creature:', creature);
            return null;
        }

        return creature;
    }

    /**
     * Gets generation data for debugging/testing purposes
     * @param {string} barcode - Valid barcode string
     * @returns {CreatureGenerationData} Generation data used to create creature
     */
    getGenerationData(barcode) {
        if (!this.validateBarcode(barcode)) {
            return null;
        }

        const seed = this.generateSeed(barcode);
        const random = this.createSeededRandom(seed);
        const baseStats = this.calculateStats(barcode);
        const name = this.generateCreatureName(barcode);
        
        // Get syllables used for name generation
        const nameRandom = this.createSeededRandom(seed);
        const nameLength = 2 + Math.floor(nameRandom() * 3);
        const nameSyllables = [];
        
        for (let i = 0; i < nameLength; i++) {
            const syllableIndex = Math.floor(nameRandom() * this.syllables.length);
            nameSyllables.push(this.syllables[syllableIndex]);
        }

        return {
            barcode: barcode,
            seed: seed,
            name: name,
            baseStats: baseStats,
            nameSyllables: nameSyllables
        };
    }
}

// Export for use in other modules (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BarcodeProcessor;
}

// Make available globally in browser
if (typeof window !== 'undefined') {
    window.BarcodeProcessor = BarcodeProcessor;
}