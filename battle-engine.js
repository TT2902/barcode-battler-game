/**
 * BattleEngine - Handles turn-based combat logic and battle mechanics
 * Manages battle flow, damage calculations, and turn order
 */

class BattleEngine {
    constructor(difficultyManager = null) {
        this.currentBattle = null;
        this.battleHistory = [];
        this.random = Math.random; // Can be overridden for testing
        this.aiOpponent = null; // Will be initialized per battle
        this.difficultyManager = difficultyManager; // DifficultyManager instance
        
        // Battle constants
        this.CRITICAL_HIT_BASE_CHANCE = 0.05; // 5% base critical hit chance
        this.CRITICAL_HIT_LEVEL_BONUS = 0.01; // +1% per level
        this.CRITICAL_HIT_MULTIPLIER = 1.5;
        this.SPECIAL_ATTACK_MULTIPLIER = 1.3;
        this.DEFEND_DAMAGE_REDUCTION = 0.5;
        this.SPEED_ADVANTAGE_THRESHOLD = 1.2; // 20% speed advantage for guaranteed first turn
        this.EXPERIENCE_BASE_REWARD = 50;
        this.EXPERIENCE_LEVEL_MULTIPLIER = 10;
    }

    /**
     * Initiate a new battle between two creatures
     * @param {Creature} playerCreature - Player's creature
     * @param {Creature} opponentCreature - Opponent's creature
     * @param {string} difficulty - Battle difficulty (optional, uses current difficulty if not specified)
     * @returns {Battle} Battle instance
     */
    initiateBattle(playerCreature, opponentCreature, difficulty = null) {
        if (!DataValidation.isValidCreature(playerCreature)) {
            throw new Error('Invalid player creature');
        }
        
        if (!DataValidation.isValidCreature(opponentCreature)) {
            throw new Error('Invalid opponent creature');
        }

        // Get difficulty from DifficultyManager if available
        const battleDifficulty = difficulty || 
            (this.difficultyManager ? this.difficultyManager.getCurrentDifficulty() : 'medium');

        // Initialize AI opponent with appropriate personality
        const aiPersonality = this.difficultyManager ? 
            this.difficultyManager.selectAIPersonality(battleDifficulty) : 
            'Tactical';
        
        this.aiOpponent = new AIOpponent(battleDifficulty);
        // Override personality if DifficultyManager provided one
        if (this.difficultyManager) {
            this.aiOpponent.personality = { 
                name: aiPersonality,
                traits: this.aiOpponent.generatePersonality().traits 
            };
        }

        // Create battle instance
        this.currentBattle = {
            id: GameUtils.generateId(),
            playerCreature: GameUtils.deepClone(playerCreature),
            opponentCreature: GameUtils.deepClone(opponentCreature),
            difficulty: difficulty,
            currentTurn: this.determineTurnOrder(playerCreature, opponentCreature),
            turnCount: 0,
            battleLog: [],
            status: 'active',
            startTime: new Date(),
            playerActions: {
                lastAction: null,
                consecutiveDefends: 0,
                specialAttacksUsed: 0,
                lastDamageDealt: 0
            },
            opponentActions: {
                lastAction: null,
                consecutiveDefends: 0,
                specialAttacksUsed: 0,
                lastDamageDealt: 0
            },
            aiInfo: this.aiOpponent.getAIInfo()
        };

        // Log battle start
        this.addBattleLogEntry({
            type: 'battle_start',
            message: `Battle begins! ${playerCreature.name} vs ${opponentCreature.name}`,
            timestamp: new Date()
        });

        console.log(`Battle initiated: ${playerCreature.name} vs ${opponentCreature.name}`);
        return GameUtils.deepClone(this.currentBattle);
    }

    /**
     * Determine turn order based on creature speed
     * @param {Creature} playerCreature - Player's creature
     * @param {Creature} opponentCreature - Opponent's creature
     * @returns {string} 'player' or 'opponent'
     */
    determineTurnOrder(playerCreature, opponentCreature) {
        const playerSpeed = playerCreature.stats.speed;
        const opponentSpeed = opponentCreature.stats.speed;

        // If one creature has significant speed advantage, they go first
        if (playerSpeed >= opponentSpeed * this.SPEED_ADVANTAGE_THRESHOLD) {
            return 'player';
        }
        
        if (opponentSpeed >= playerSpeed * this.SPEED_ADVANTAGE_THRESHOLD) {
            return 'opponent';
        }

        // Otherwise, random with speed bias
        const speedDifference = playerSpeed - opponentSpeed;
        const bias = speedDifference / (playerSpeed + opponentSpeed);
        const randomValue = this.random() - 0.5; // -0.5 to 0.5
        
        return (randomValue + bias) > 0 ? 'player' : 'opponent';
    }

    /**
     * Execute a player action
     * @param {string} actionType - Type of action ('attack', 'special', 'defend')
     * @returns {BattleResult} Result of the action
     */
    executePlayerAction(actionType) {
        if (!this.currentBattle || this.currentBattle.status !== 'active') {
            throw new Error('No active battle');
        }

        if (this.currentBattle.currentTurn !== 'player') {
            throw new Error('Not player turn');
        }

        const result = this.executeAction(
            this.currentBattle.playerCreature,
            this.currentBattle.opponentCreature,
            actionType,
            'player'
        );

        // Update player action tracking
        this.updateActionTracking('player', actionType);

        // Check if battle ended
        if (this.checkBattleEnd()) {
            return result;
        }

        // Switch to opponent turn
        this.currentBattle.currentTurn = 'opponent';
        this.currentBattle.turnCount++;

        return result;
    }

    /**
     * Execute an AI opponent action
     * @returns {BattleResult} Result of the action
     */
    executeAIAction() {
        if (!this.currentBattle || this.currentBattle.status !== 'active') {
            throw new Error('No active battle');
        }

        if (this.currentBattle.currentTurn !== 'opponent') {
            throw new Error('Not opponent turn');
        }

        // AI decision making (simplified for now, will be enhanced in task 6.2)
        const actionType = this.makeAIDecision();

        const result = this.executeAction(
            this.currentBattle.opponentCreature,
            this.currentBattle.playerCreature,
            actionType,
            'opponent'
        );

        // Update opponent action tracking
        this.updateActionTracking('opponent', actionType);

        // Check if battle ended
        if (this.checkBattleEnd()) {
            return result;
        }

        // Switch to player turn
        this.currentBattle.currentTurn = 'player';

        return result;
    }

    /**
     * Execute a battle action
     * @param {Creature} attacker - Attacking creature
     * @param {Creature} defender - Defending creature
     * @param {string} actionType - Type of action
     * @param {string} actor - 'player' or 'opponent'
     * @returns {BattleResult} Result of the action
     */
    executeAction(attacker, defender, actionType, actor) {
        const result = {
            actor: actor,
            actionType: actionType,
            damage: 0,
            critical: false,
            blocked: false,
            message: '',
            attackerHp: attacker.stats.hp,
            defenderHp: defender.stats.hp,
            timestamp: new Date()
        };

        switch (actionType) {
            case 'attack':
                result.damage = this.calculateDamage(attacker, defender, 'normal');
                result.critical = this.checkCriticalHit(attacker);
                
                if (result.critical) {
                    result.damage = Math.floor(result.damage * this.CRITICAL_HIT_MULTIPLIER);
                }
                
                defender.stats.hp = Math.max(0, defender.stats.hp - result.damage);
                result.defenderHp = defender.stats.hp;
                
                // Track damage dealt for AI analysis
                if (actor === 'player') {
                    this.currentBattle.playerActions.lastDamageDealt = result.damage;
                } else {
                    this.currentBattle.opponentActions.lastDamageDealt = result.damage;
                }
                
                result.message = result.critical 
                    ? `${attacker.name} lands a critical hit for ${result.damage} damage!`
                    : `${attacker.name} attacks for ${result.damage} damage!`;
                break;

            case 'special':
                result.damage = this.calculateDamage(attacker, defender, 'special');
                result.critical = this.checkCriticalHit(attacker, 0.5); // Reduced crit chance for special
                
                if (result.critical) {
                    result.damage = Math.floor(result.damage * this.CRITICAL_HIT_MULTIPLIER);
                }
                
                defender.stats.hp = Math.max(0, defender.stats.hp - result.damage);
                result.defenderHp = defender.stats.hp;
                
                // Track damage dealt for AI analysis
                if (actor === 'player') {
                    this.currentBattle.playerActions.lastDamageDealt = result.damage;
                } else {
                    this.currentBattle.opponentActions.lastDamageDealt = result.damage;
                }
                
                result.message = result.critical
                    ? `${attacker.name} unleashes a critical special attack for ${result.damage} damage!`
                    : `${attacker.name} uses a special attack for ${result.damage} damage!`;
                break;

            case 'defend':
                // Defending reduces incoming damage for the next turn and may restore some HP
                const healAmount = Math.floor(attacker.stats.maxHp * 0.1); // 10% heal
                attacker.stats.hp = Math.min(attacker.stats.maxHp, attacker.stats.hp + healAmount);
                result.attackerHp = attacker.stats.hp;
                
                result.message = healAmount > 0 
                    ? `${attacker.name} defends and recovers ${healAmount} HP!`
                    : `${attacker.name} takes a defensive stance!`;
                break;

            default:
                throw new Error(`Unknown action type: ${actionType}`);
        }

        // Add to battle log
        this.addBattleLogEntry({
            type: 'action',
            actor: actor,
            actionType: actionType,
            damage: result.damage,
            critical: result.critical,
            message: result.message,
            timestamp: result.timestamp
        });

        return result;
    }

    /**
     * Calculate damage for an attack
     * @param {Creature} attacker - Attacking creature
     * @param {Creature} defender - Defending creature
     * @param {string} attackType - 'normal' or 'special'
     * @returns {number} Damage amount
     */
    calculateDamage(attacker, defender, attackType = 'normal') {
        let baseDamage = attacker.stats.attack;
        let defense = defender.stats.defense;

        // Apply attack type multiplier
        if (attackType === 'special') {
            baseDamage *= this.SPECIAL_ATTACK_MULTIPLIER;
        }

        // Check if defender is defending (reduce damage)
        const defenderActions = this.currentBattle[
            this.currentBattle.currentTurn === 'player' ? 'opponentActions' : 'playerActions'
        ];
        
        if (defenderActions.lastAction === 'defend') {
            defense *= (1 + this.DEFEND_DAMAGE_REDUCTION);
        }

        // Calculate base damage with defense
        let damage = Math.max(1, baseDamage - defense);

        // Add random variance (±20%)
        const variance = 0.2;
        const randomMultiplier = 1 + (this.random() - 0.5) * variance * 2;
        damage = Math.floor(damage * randomMultiplier);

        // Ensure minimum damage
        return Math.max(1, damage);
    }

    /**
     * Check if an attack is a critical hit
     * @param {Creature} attacker - Attacking creature
     * @param {number} modifier - Modifier to critical hit chance (default 1.0)
     * @returns {boolean} Whether the attack is critical
     */
    checkCriticalHit(attacker, modifier = 1.0) {
        let baseChance = this.CRITICAL_HIT_BASE_CHANCE;
        const levelBonus = attacker.level * this.CRITICAL_HIT_LEVEL_BONUS;
        
        // Apply difficulty-based critical hit chance for opponents
        if (attacker.isOpponent && this.difficultyManager && attacker.difficultyBonuses) {
            baseChance = attacker.difficultyBonuses.criticalHitChance;
        }
        
        const totalChance = (baseChance + levelBonus) * modifier;
        
        return this.random() < totalChance;
    }

    /**
     * Advanced AI decision making using AIOpponent system
     * @returns {string} Action type
     */
    makeAIDecision() {
        if (!this.aiOpponent) {
            // Fallback to simple decision if AI not initialized
            return this.makeSimpleAIDecision();
        }

        // Prepare battle state for AI analysis
        const battleState = {
            playerCreature: this.currentBattle.playerCreature,
            opponentCreature: this.currentBattle.opponentCreature,
            playerActions: this.currentBattle.playerActions,
            opponentActions: this.currentBattle.opponentActions,
            lastPlayerAction: this.currentBattle.playerActions.lastAction,
            lastDamageToAI: this.currentBattle.playerActions.lastDamageDealt,
            lastDamageToPlayer: this.currentBattle.opponentActions.lastDamageDealt,
            turnCount: this.currentBattle.turnCount,
            difficulty: this.currentBattle.difficulty
        };

        return this.aiOpponent.makeDecision(battleState);
    }

    /**
     * Simple fallback AI decision making
     * @returns {string} Action type
     */
    makeSimpleAIDecision() {
        const opponent = this.currentBattle.opponentCreature;
        const opponentActions = this.currentBattle.opponentActions;

        // Simple strategy based on HP and previous actions
        const hpPercentage = opponent.stats.hp / opponent.stats.maxHp;
        
        // If low on HP, consider defending
        if (hpPercentage < 0.3 && opponentActions.consecutiveDefends < 2) {
            if (this.random() < 0.4) {
                return 'defend';
            }
        }

        // Use special attack occasionally (but not too often)
        if (opponentActions.specialAttacksUsed < 3 && this.random() < 0.25) {
            return 'special';
        }

        // Default to normal attack
        return 'attack';
    }

    /**
     * Update action tracking for a player
     * @param {string} actor - 'player' or 'opponent'
     * @param {string} actionType - Action type
     */
    updateActionTracking(actor, actionType) {
        const actions = this.currentBattle[`${actor}Actions`];
        
        actions.lastAction = actionType;
        
        if (actionType === 'defend') {
            actions.consecutiveDefends++;
        } else {
            actions.consecutiveDefends = 0;
        }
        
        if (actionType === 'special') {
            actions.specialAttacksUsed++;
        }
    }

    /**
     * Check if the battle has ended
     * @returns {boolean} Whether the battle has ended
     */
    checkBattleEnd() {
        if (!this.currentBattle || this.currentBattle.status !== 'active') {
            return true;
        }

        const playerHp = this.currentBattle.playerCreature.stats.hp;
        const opponentHp = this.currentBattle.opponentCreature.stats.hp;

        if (playerHp <= 0) {
            this.endBattle('opponent');
            return true;
        }

        if (opponentHp <= 0) {
            this.endBattle('player');
            return true;
        }

        return false;
    }

    /**
     * End the current battle
     * @param {string} winner - 'player' or 'opponent'
     */
    endBattle(winner) {
        if (!this.currentBattle) {
            return;
        }

        this.currentBattle.status = winner === 'player' ? 'won' : 'lost';
        this.currentBattle.winner = winner;
        this.currentBattle.endTime = new Date();
        this.currentBattle.duration = this.currentBattle.endTime - this.currentBattle.startTime;

        // Calculate experience reward
        const experienceReward = this.calculateExperienceReward(winner);
        this.currentBattle.experienceReward = experienceReward;

        // Add final battle log entry
        const winnerCreature = winner === 'player' 
            ? this.currentBattle.playerCreature 
            : this.currentBattle.opponentCreature;

        this.addBattleLogEntry({
            type: 'battle_end',
            winner: winner,
            message: `${winnerCreature.name} wins the battle!`,
            experienceReward: experienceReward,
            timestamp: new Date()
        });

        // Get AI battle analysis
        if (this.aiOpponent) {
            this.currentBattle.aiAnalysis = this.aiOpponent.getBattleAnalysis();
        }

        // Record battle result in DifficultyManager
        if (this.difficultyManager) {
            this.difficultyManager.recordBattleResult({
                won: winner === 'player',
                difficulty: this.currentBattle.difficulty,
                experienceReward: experienceReward,
                turnCount: this.currentBattle.turnCount,
                battleDuration: this.currentBattle.duration
            });
        }

        // Add to battle history
        this.battleHistory.push(GameUtils.deepClone(this.currentBattle));

        console.log(`Battle ended: ${winner} wins! Experience reward: ${experienceReward}`);
        
        // Log AI analysis
        if (this.currentBattle.aiAnalysis) {
            console.log('AI Battle Analysis:', this.currentBattle.aiAnalysis);
        }
    }

    /**
     * Calculate experience reward for battle
     * @param {string} winner - Battle winner
     * @returns {number} Experience points
     */
    calculateExperienceReward(winner) {
        if (winner !== 'player') {
            return 0; // No experience for losing
        }

        const opponentLevel = this.currentBattle.opponentCreature.level;
        const playerLevel = this.currentBattle.playerCreature.level;
        
        // Base reward plus level difference bonus
        let experience = this.EXPERIENCE_BASE_REWARD;
        experience += opponentLevel * this.EXPERIENCE_LEVEL_MULTIPLIER;
        
        // Bonus for fighting higher level opponents
        if (opponentLevel > playerLevel) {
            const levelDifference = opponentLevel - playerLevel;
            experience += levelDifference * 20;
        }

        // Apply difficulty multiplier from DifficultyManager
        if (this.difficultyManager) {
            const difficultyConfig = this.difficultyManager.getDifficultyConfig(this.currentBattle.difficulty);
            experience *= difficultyConfig.experienceMultiplier;
        } else {
            // Fallback difficulty multipliers
            const difficultyMultipliers = {
                'easy': 0.8,
                'medium': 1.0,
                'hard': 1.3
            };
            experience *= difficultyMultipliers[this.currentBattle.difficulty] || 1.0;
        }

        return Math.floor(experience);
    }

    /**
     * Add entry to battle log
     * @param {Object} entry - Log entry
     */
    addBattleLogEntry(entry) {
        if (this.currentBattle) {
            this.currentBattle.battleLog.push(entry);
        }
    }

    /**
     * Get current battle state
     * @returns {Battle|null} Current battle or null
     */
    getCurrentBattle() {
        return this.currentBattle ? GameUtils.deepClone(this.currentBattle) : null;
    }

    /**
     * Get battle history
     * @returns {Battle[]} Array of completed battles
     */
    getBattleHistory() {
        return this.battleHistory.map(battle => GameUtils.deepClone(battle));
    }

    /**
     * Reset current battle
     */
    resetBattle() {
        this.currentBattle = null;
        if (this.aiOpponent) {
            this.aiOpponent.resetMemory();
            this.aiOpponent = null;
        }
    }

    /**
     * Get battle statistics
     * @returns {Object} Battle statistics
     */
    getBattleStats() {
        const battles = this.battleHistory;
        const totalBattles = battles.length;
        
        if (totalBattles === 0) {
            return {
                totalBattles: 0,
                wins: 0,
                losses: 0,
                winRate: 0,
                averageDuration: 0,
                totalExperience: 0
            };
        }

        const wins = battles.filter(b => b.status === 'won').length;
        const losses = battles.filter(b => b.status === 'lost').length;
        const totalDuration = battles.reduce((sum, b) => sum + (b.duration || 0), 0);
        const totalExperience = battles.reduce((sum, b) => sum + (b.experienceReward || 0), 0);

        return {
            totalBattles: totalBattles,
            wins: wins,
            losses: losses,
            winRate: wins / totalBattles,
            averageDuration: totalDuration / totalBattles,
            totalExperience: totalExperience
        };
    }

    /**
     * Set random function (for testing)
     * @param {Function} randomFunc - Random function
     */
    setRandomFunction(randomFunc) {
        this.random = randomFunc;
    }
}

// Export for use in other modules (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BattleEngine;
}

// Make available globally in browser
if (typeof window !== 'undefined') {
    window.BattleEngine = BattleEngine;
}