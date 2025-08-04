/**
 * AIOpponent - Advanced AI decision-making system for battle opponents
 * Provides strategic AI behavior patterns and difficulty-based decision making
 */

class AIOpponent {
    constructor(difficulty = 'medium') {
        this.difficulty = difficulty;
        this.personality = this.generatePersonality();
        this.memory = {
            playerActions: [],
            ownActions: [],
            damageDealt: 0,
            damageTaken: 0,
            turnsElapsed: 0
        };
        
        // AI behavior parameters based on difficulty
        this.behaviorParams = this.getDifficultyParams(difficulty);
        
        // Strategy weights (will be adjusted based on battle state)
        this.strategyWeights = {
            aggressive: 0.4,
            defensive: 0.3,
            balanced: 0.3
        };
    }

    /**
     * Generate AI personality traits
     * @returns {Object} Personality traits
     */
    generatePersonality() {
        const personalities = [
            {
                name: 'Aggressive',
                traits: {
                    attackPreference: 0.7,
                    specialAttackUsage: 0.4,
                    riskTolerance: 0.8,
                    adaptability: 0.3
                }
            },
            {
                name: 'Defensive',
                traits: {
                    attackPreference: 0.3,
                    specialAttackUsage: 0.2,
                    riskTolerance: 0.2,
                    adaptability: 0.6
                }
            },
            {
                name: 'Tactical',
                traits: {
                    attackPreference: 0.5,
                    specialAttackUsage: 0.6,
                    riskTolerance: 0.4,
                    adaptability: 0.8
                }
            },
            {
                name: 'Berserker',
                traits: {
                    attackPreference: 0.9,
                    specialAttackUsage: 0.7,
                    riskTolerance: 0.9,
                    adaptability: 0.1
                }
            },
            {
                name: 'Cautious',
                traits: {
                    attackPreference: 0.4,
                    specialAttackUsage: 0.3,
                    riskTolerance: 0.3,
                    adaptability: 0.7
                }
            }
        ];

        return personalities[Math.floor(Math.random() * personalities.length)];
    }

    /**
     * Get difficulty-based behavior parameters
     * @param {string} difficulty - AI difficulty level
     * @returns {Object} Behavior parameters
     */
    getDifficultyParams(difficulty) {
        const params = {
            easy: {
                decisionAccuracy: 0.6,
                strategyConsistency: 0.4,
                adaptationSpeed: 0.3,
                mistakeChance: 0.3,
                optimalPlayChance: 0.2
            },
            medium: {
                decisionAccuracy: 0.75,
                strategyConsistency: 0.6,
                adaptationSpeed: 0.5,
                mistakeChance: 0.15,
                optimalPlayChance: 0.4
            },
            hard: {
                decisionAccuracy: 0.9,
                strategyConsistency: 0.8,
                adaptationSpeed: 0.7,
                mistakeChance: 0.05,
                optimalPlayChance: 0.7
            }
        };

        return params[difficulty] || params.medium;
    }

    /**
     * Make AI decision for battle action
     * @param {Object} battleState - Current battle state
     * @returns {string} Chosen action ('attack', 'special', 'defend')
     */
    makeDecision(battleState) {
        // Update memory with current battle state
        this.updateMemory(battleState);

        // Analyze battle situation
        const situation = this.analyzeBattleSituation(battleState);

        // Determine strategy based on situation
        const strategy = this.determineStrategy(situation);

        // Make decision based on strategy and personality
        let decision = this.executeStrategy(strategy, situation, battleState);

        // Apply difficulty-based modifications
        decision = this.applyDifficultyModifications(decision, situation);

        // Log decision for learning
        this.logDecision(decision, situation);

        return decision;
    }

    /**
     * Update AI memory with battle information
     * @param {Object} battleState - Current battle state
     */
    updateMemory(battleState) {
        this.memory.turnsElapsed++;

        // Track recent player actions (last 5 turns)
        if (battleState.lastPlayerAction) {
            this.memory.playerActions.push(battleState.lastPlayerAction);
            if (this.memory.playerActions.length > 5) {
                this.memory.playerActions.shift();
            }
        }

        // Update damage tracking
        if (battleState.lastDamageToAI) {
            this.memory.damageTaken += battleState.lastDamageToAI;
        }
        if (battleState.lastDamageToPlayer) {
            this.memory.damageDealt += battleState.lastDamageToPlayer;
        }
    }

    /**
     * Analyze current battle situation
     * @param {Object} battleState - Current battle state
     * @returns {Object} Situation analysis
     */
    analyzeBattleSituation(battleState) {
        const aiCreature = battleState.opponentCreature;
        const playerCreature = battleState.playerCreature;

        const aiHpPercentage = aiCreature.stats.hp / aiCreature.stats.maxHp;
        const playerHpPercentage = playerCreature.stats.hp / playerCreature.stats.maxHp;

        const situation = {
            // Health status
            aiHealthStatus: this.getHealthStatus(aiHpPercentage),
            playerHealthStatus: this.getHealthStatus(playerHpPercentage),
            healthAdvantage: aiHpPercentage - playerHpPercentage,

            // Stat comparisons
            attackAdvantage: aiCreature.stats.attack - playerCreature.stats.attack,
            defenseAdvantage: aiCreature.stats.defense - playerCreature.stats.defense,
            speedAdvantage: aiCreature.stats.speed - playerCreature.stats.speed,

            // Battle progress
            turnsElapsed: this.memory.turnsElapsed,
            damageRatio: this.memory.damageTaken > 0 ? 
                this.memory.damageDealt / this.memory.damageTaken : 1,

            // Player patterns
            playerPattern: this.analyzePlayerPattern(),
            
            // Urgency level
            urgency: this.calculateUrgency(aiHpPercentage, playerHpPercentage),

            // Special conditions
            canUseSpecial: battleState.opponentActions.specialAttacksUsed < 3,
            shouldAvoidDefend: battleState.opponentActions.consecutiveDefends >= 2
        };

        return situation;
    }

    /**
     * Get health status category
     * @param {number} hpPercentage - HP percentage (0-1)
     * @returns {string} Health status
     */
    getHealthStatus(hpPercentage) {
        if (hpPercentage > 0.75) return 'healthy';
        if (hpPercentage > 0.5) return 'wounded';
        if (hpPercentage > 0.25) return 'critical';
        return 'desperate';
    }

    /**
     * Analyze player action patterns
     * @returns {Object} Pattern analysis
     */
    analyzePlayerPattern() {
        const actions = this.memory.playerActions;
        if (actions.length < 2) {
            return { type: 'unknown', confidence: 0 };
        }

        const actionCounts = actions.reduce((counts, action) => {
            counts[action] = (counts[action] || 0) + 1;
            return counts;
        }, {});

        const mostCommon = Object.keys(actionCounts).reduce((a, b) => 
            actionCounts[a] > actionCounts[b] ? a : b
        );

        const confidence = actionCounts[mostCommon] / actions.length;

        // Detect specific patterns
        let patternType = 'random';
        if (confidence > 0.6) {
            patternType = `${mostCommon}_heavy`;
        } else if (this.isAlternatingPattern(actions)) {
            patternType = 'alternating';
        } else if (this.isEscalatingPattern(actions)) {
            patternType = 'escalating';
        }

        return {
            type: patternType,
            confidence: confidence,
            mostCommon: mostCommon,
            actionCounts: actionCounts
        };
    }

    /**
     * Check if actions follow alternating pattern
     * @param {Array} actions - Recent actions
     * @returns {boolean} Whether pattern is alternating
     */
    isAlternatingPattern(actions) {
        if (actions.length < 4) return false;
        
        for (let i = 2; i < actions.length; i++) {
            if (actions[i] !== actions[i - 2]) {
                return false;
            }
        }
        return true;
    }

    /**
     * Check if actions follow escalating pattern (attack -> special -> defend)
     * @param {Array} actions - Recent actions
     * @returns {boolean} Whether pattern is escalating
     */
    isEscalatingPattern(actions) {
        if (actions.length < 3) return false;
        
        const escalation = ['attack', 'special', 'defend'];
        const recent = actions.slice(-3);
        
        return recent.every((action, index) => action === escalation[index]);
    }

    /**
     * Calculate battle urgency level
     * @param {number} aiHp - AI HP percentage
     * @param {number} playerHp - Player HP percentage
     * @returns {number} Urgency level (0-1)
     */
    calculateUrgency(aiHp, playerHp) {
        // Higher urgency when AI is low on HP or player is close to winning
        const hpUrgency = Math.max(0, (0.5 - aiHp) * 2);
        const threatUrgency = Math.max(0, (0.3 - playerHp) * -1);
        
        return Math.min(1, hpUrgency + threatUrgency);
    }

    /**
     * Determine optimal strategy based on situation
     * @param {Object} situation - Battle situation analysis
     * @returns {string} Strategy type
     */
    determineStrategy(situation) {
        let strategyScores = {
            aggressive: 0,
            defensive: 0,
            tactical: 0
        };

        // Health-based strategy adjustments
        if (situation.aiHealthStatus === 'desperate') {
            strategyScores.aggressive += 0.4; // Go all-out
            strategyScores.defensive -= 0.2;
        } else if (situation.aiHealthStatus === 'critical') {
            strategyScores.defensive += 0.3;
            strategyScores.tactical += 0.2;
        } else if (situation.aiHealthStatus === 'healthy') {
            strategyScores.aggressive += 0.2;
        }

        // Advantage-based adjustments
        if (situation.attackAdvantage > 10) {
            strategyScores.aggressive += 0.3;
        }
        if (situation.defenseAdvantage > 10) {
            strategyScores.defensive += 0.2;
        }

        // Urgency adjustments
        if (situation.urgency > 0.7) {
            strategyScores.aggressive += 0.4;
            strategyScores.defensive -= 0.3;
        }

        // Player pattern counter-strategies
        if (situation.playerPattern.type === 'attack_heavy') {
            strategyScores.defensive += 0.3;
        } else if (situation.playerPattern.type === 'defend_heavy') {
            strategyScores.aggressive += 0.3;
        }

        // Personality influence
        strategyScores.aggressive += this.personality.traits.attackPreference * 0.3;
        strategyScores.defensive += (1 - this.personality.traits.riskTolerance) * 0.2;
        strategyScores.tactical += this.personality.traits.adaptability * 0.2;

        // Return strategy with highest score
        return Object.keys(strategyScores).reduce((a, b) => 
            strategyScores[a] > strategyScores[b] ? a : b
        );
    }

    /**
     * Execute chosen strategy
     * @param {string} strategy - Strategy type
     * @param {Object} situation - Battle situation
     * @param {Object} battleState - Current battle state
     * @returns {string} Action to take
     */
    executeStrategy(strategy, situation, battleState) {
        switch (strategy) {
            case 'aggressive':
                return this.executeAggressiveStrategy(situation, battleState);
            case 'defensive':
                return this.executeDefensiveStrategy(situation, battleState);
            case 'tactical':
                return this.executeTacticalStrategy(situation, battleState);
            default:
                return 'attack';
        }
    }

    /**
     * Execute aggressive strategy
     * @param {Object} situation - Battle situation
     * @param {Object} battleState - Current battle state
     * @returns {string} Action
     */
    executeAggressiveStrategy(situation, battleState) {
        // Prefer special attacks when available
        if (situation.canUseSpecial && Math.random() < 0.6) {
            return 'special';
        }
        
        // Use normal attacks most of the time
        if (Math.random() < 0.8) {
            return 'attack';
        }
        
        // Occasionally defend to avoid being too predictable
        return 'defend';
    }

    /**
     * Execute defensive strategy
     * @param {Object} situation - Battle situation
     * @param {Object} battleState - Current battle state
     * @returns {string} Action
     */
    executeDefensiveStrategy(situation, battleState) {
        // Avoid consecutive defends
        if (situation.shouldAvoidDefend) {
            return Math.random() < 0.7 ? 'attack' : 'special';
        }
        
        // Defend when health is low
        if (situation.aiHealthStatus === 'critical' && Math.random() < 0.6) {
            return 'defend';
        }
        
        // Mix of attacks and defends
        if (Math.random() < 0.4) {
            return 'defend';
        } else if (Math.random() < 0.7) {
            return 'attack';
        } else {
            return 'special';
        }
    }

    /**
     * Execute tactical strategy
     * @param {Object} situation - Battle situation
     * @param {Object} battleState - Current battle state
     * @returns {string} Action
     */
    executeTacticalStrategy(situation, battleState) {
        // Counter player patterns
        if (situation.playerPattern.confidence > 0.6) {
            return this.counterPlayerPattern(situation.playerPattern);
        }
        
        // Use special attacks strategically
        if (situation.canUseSpecial && situation.urgency > 0.5 && Math.random() < 0.4) {
            return 'special';
        }
        
        // Balanced approach
        const rand = Math.random();
        if (rand < 0.5) {
            return 'attack';
        } else if (rand < 0.75) {
            return 'defend';
        } else {
            return 'special';
        }
    }

    /**
     * Counter detected player patterns
     * @param {Object} pattern - Player pattern analysis
     * @returns {string} Counter action
     */
    counterPlayerPattern(pattern) {
        switch (pattern.mostCommon) {
            case 'attack':
                return 'defend'; // Counter attacks with defense
            case 'special':
                return 'attack'; // Interrupt specials with quick attacks
            case 'defend':
                return 'special'; // Break through defense with specials
            default:
                return 'attack';
        }
    }

    /**
     * Apply difficulty-based modifications to decision
     * @param {string} decision - Initial decision
     * @param {Object} situation - Battle situation
     * @returns {string} Modified decision
     */
    applyDifficultyModifications(decision, situation) {
        const params = this.behaviorParams;
        
        // Easy AI makes more mistakes
        if (this.difficulty === 'easy' && Math.random() < params.mistakeChance) {
            const actions = ['attack', 'special', 'defend'];
            return actions[Math.floor(Math.random() * actions.length)];
        }
        
        // Hard AI makes more optimal plays
        if (this.difficulty === 'hard' && Math.random() < params.optimalPlayChance) {
            return this.getOptimalAction(situation);
        }
        
        return decision;
    }

    /**
     * Get theoretically optimal action for current situation
     * @param {Object} situation - Battle situation
     * @returns {string} Optimal action
     */
    getOptimalAction(situation) {
        // Simple optimal play logic
        if (situation.aiHealthStatus === 'desperate') {
            return situation.canUseSpecial ? 'special' : 'attack';
        }
        
        if (situation.playerHealthStatus === 'critical') {
            return 'attack'; // Finish them off
        }
        
        if (situation.healthAdvantage < -0.3) {
            return 'defend'; // Need to recover
        }
        
        return 'attack'; // Default optimal action
    }

    /**
     * Log decision for potential learning/analysis
     * @param {string} decision - Made decision
     * @param {Object} situation - Battle situation
     */
    logDecision(decision, situation) {
        this.memory.ownActions.push({
            action: decision,
            situation: {
                aiHealth: situation.aiHealthStatus,
                playerHealth: situation.playerHealthStatus,
                strategy: situation.strategy,
                urgency: situation.urgency
            },
            turn: this.memory.turnsElapsed
        });

        // Keep only recent decisions
        if (this.memory.ownActions.length > 10) {
            this.memory.ownActions.shift();
        }
    }

    /**
     * Get AI personality and stats for display
     * @returns {Object} AI information
     */
    getAIInfo() {
        return {
            personality: this.personality.name,
            difficulty: this.difficulty,
            traits: this.personality.traits,
            behaviorParams: this.behaviorParams
        };
    }

    /**
     * Reset AI memory for new battle
     */
    resetMemory() {
        this.memory = {
            playerActions: [],
            ownActions: [],
            damageDealt: 0,
            damageTaken: 0,
            turnsElapsed: 0
        };
    }

    /**
     * Get battle analysis summary
     * @returns {Object} Analysis summary
     */
    getBattleAnalysis() {
        return {
            turnsElapsed: this.memory.turnsElapsed,
            damageRatio: this.memory.damageTaken > 0 ? 
                this.memory.damageDealt / this.memory.damageTaken : 1,
            playerPattern: this.analyzePlayerPattern(),
            aiPersonality: this.personality.name,
            difficulty: this.difficulty
        };
    }
}

// Export for use in other modules (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIOpponent;
}

// Make available globally in browser
if (typeof window !== 'undefined') {
    window.AIOpponent = AIOpponent;
}