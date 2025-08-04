/**
 * BattleEffects - Manages battle animations, sound effects, and visual feedback
 * Provides immersive battle experience with animations and audio
 */

class BattleEffects {
    constructor() {
        this.soundEnabled = true;
        this.animationsEnabled = true;
        this.audioContext = null;
        this.sounds = {};
        this.activeAnimations = new Set();
        
        // Check for reduced motion preference
        this.animationsEnabled = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        // Initialize audio context
        this.initializeAudio();
        
        // Load sound effects
        this.loadSounds();
    }

    /**
     * Initialize Web Audio API context
     */
    initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
            this.soundEnabled = false;
        }
    }

    /**
     * Load sound effects using Web Audio API
     */
    loadSounds() {
        if (!this.soundEnabled || !this.audioContext) return;

        // Generate simple sound effects using oscillators
        this.sounds = {
            attack: this.createAttackSound.bind(this),
            special: this.createSpecialSound.bind(this),
            defend: this.createDefendSound.bind(this),
            damage: this.createDamageSound.bind(this),
            heal: this.createHealSound.bind(this),
            critical: this.createCriticalSound.bind(this),
            victory: this.createVictorySound.bind(this),
            defeat: this.createDefeatSound.bind(this),
            turnChange: this.createTurnChangeSound.bind(this)
        };
    }

    /**
     * Play a sound effect
     * @param {string} soundName - Name of the sound to play
     * @param {number} volume - Volume level (0-1)
     */
    playSound(soundName, volume = 0.3) {
        if (!this.soundEnabled || !this.audioContext || !this.sounds[soundName]) {
            return;
        }

        try {
            // Resume audio context if suspended (required by some browsers)
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            this.sounds[soundName](volume);
        } catch (error) {
            console.warn('Error playing sound:', error);
        }
    } 
   /**
     * Create attack sound effect
     * @param {number} volume - Volume level
     */
    createAttackSound(volume = 0.3) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.15);
    }

    /**
     * Create special attack sound effect
     * @param {number} volume - Volume level
     */
    createSpecialSound(volume = 0.3) {
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator1.type = 'sawtooth';
        oscillator1.frequency.setValueAtTime(300, this.audioContext.currentTime);
        oscillator1.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.2);
        
        oscillator2.type = 'sine';
        oscillator2.frequency.setValueAtTime(150, this.audioContext.currentTime);
        oscillator2.frequency.exponentialRampToValueAtTime(300, this.audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.25);
        
        oscillator1.start(this.audioContext.currentTime);
        oscillator1.stop(this.audioContext.currentTime + 0.25);
        oscillator2.start(this.audioContext.currentTime);
        oscillator2.stop(this.audioContext.currentTime + 0.25);
    }

    /**
     * Create defend sound effect
     * @param {number} volume - Volume level
     */
    createDefendSound(volume = 0.3) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(800, this.audioContext.currentTime + 0.1);
        oscillator.frequency.linearRampToValueAtTime(400, this.audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(volume * 0.7, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    /**
     * Create damage sound effect
     * @param {number} volume - Volume level
     */
    createDamageSound(volume = 0.3) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }

    /**
     * Create heal sound effect
     * @param {number} volume - Volume level
     */
    createHealSound(volume = 0.3) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523, this.audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(784, this.audioContext.currentTime + 0.2); // G5
        
        gainNode.gain.setValueAtTime(volume * 0.6, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.4);
    }

    /**
     * Create critical hit sound effect
     * @param {number} volume - Volume level
     */
    createCriticalSound(volume = 0.3) {
        // Play multiple oscillators for a more dramatic effect
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(400 + i * 200, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(200 + i * 100, this.audioContext.currentTime + 0.1);
                
                gainNode.gain.setValueAtTime(volume * 0.8, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.15);
            }, i * 50);
        }
    }

    /**
     * Create victory sound effect
     * @param {number} volume - Volume level
     */
    createVictorySound(volume = 0.3) {
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        
        notes.forEach((frequency, index) => {
            setTimeout(() => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                
                gainNode.gain.setValueAtTime(volume * 0.7, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.3);
            }, index * 150);
        });
    }

    /**
     * Create defeat sound effect
     * @param {number} volume - Volume level
     */
    createDefeatSound(volume = 0.3) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 1.0);
        
        gainNode.gain.setValueAtTime(volume * 0.5, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1.0);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 1.0);
    }

    /**
     * Create turn change sound effect
     * @param {number} volume - Volume level
     */
    createTurnChangeSound(volume = 0.3) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
        oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime + 0.05);
        
        gainNode.gain.setValueAtTime(volume * 0.4, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }    /*
*
     * Animate damage effect on creature
     * @param {string} targetSide - 'player' or 'opponent'
     * @param {number} damage - Damage amount
     * @param {boolean} isCritical - Whether it's a critical hit
     */
    animateDamage(targetSide, damage, isCritical = false) {
        if (!this.animationsEnabled) return;

        const panel = document.querySelector(`.${targetSide}-panel`);
        const avatar = panel?.querySelector('.creature-avatar');
        
        if (!panel || !avatar) return;

        // Screen shake effect
        this.shakeElement(panel, isCritical ? 'strong' : 'normal');
        
        // Damage number animation
        this.showDamageNumber(avatar, damage, isCritical);
        
        // Flash effect
        this.flashElement(panel, isCritical ? '#ff4444' : '#ff6666');
        
        // Play sound
        this.playSound(isCritical ? 'critical' : 'damage');
    }

    /**
     * Animate healing effect on creature
     * @param {string} targetSide - 'player' or 'opponent'
     * @param {number} healAmount - Heal amount
     */
    animateHeal(targetSide, healAmount) {
        if (!this.animationsEnabled) return;

        const panel = document.querySelector(`.${targetSide}-panel`);
        const avatar = panel?.querySelector('.creature-avatar');
        
        if (!panel || !avatar) return;

        // Healing glow effect
        this.glowElement(panel, '#44ff44');
        
        // Heal number animation
        this.showHealNumber(avatar, healAmount);
        
        // Play sound
        this.playSound('heal');
    }

    /**
     * Animate attack action
     * @param {string} attackerSide - 'player' or 'opponent'
     * @param {string} actionType - 'attack' or 'special'
     */
    animateAttack(attackerSide, actionType = 'attack') {
        if (!this.animationsEnabled) return;

        const panel = document.querySelector(`.${attackerSide}-panel`);
        const avatar = panel?.querySelector('.creature-avatar');
        
        if (!panel || !avatar) return;

        // Attack animation
        if (actionType === 'special') {
            this.chargeEffect(avatar);
            this.playSound('special');
        } else {
            this.strikeEffect(avatar);
            this.playSound('attack');
        }
    }

    /**
     * Animate defend action
     * @param {string} defenderSide - 'player' or 'opponent'
     */
    animateDefend(defenderSide) {
        if (!this.animationsEnabled) return;

        const panel = document.querySelector(`.${defenderSide}-panel`);
        
        if (!panel) return;

        // Shield effect
        this.shieldEffect(panel);
        this.playSound('defend');
    }

    /**
     * Shake element animation
     * @param {HTMLElement} element - Element to shake
     * @param {string} intensity - 'normal' or 'strong'
     */
    shakeElement(element, intensity = 'normal') {
        const shakeClass = intensity === 'strong' ? 'shake-strong' : 'shake-normal';
        
        element.classList.add(shakeClass);
        
        setTimeout(() => {
            element.classList.remove(shakeClass);
        }, 600);
    }

    /**
     * Flash element with color
     * @param {HTMLElement} element - Element to flash
     * @param {string} color - Flash color
     */
    flashElement(element, color) {
        const originalBackground = element.style.backgroundColor;
        
        element.style.backgroundColor = color;
        element.style.transition = 'background-color 0.1s ease';
        
        setTimeout(() => {
            element.style.backgroundColor = originalBackground;
            element.style.transition = 'background-color 0.3s ease';
        }, 100);
    }

    /**
     * Glow element with color
     * @param {HTMLElement} element - Element to glow
     * @param {string} color - Glow color
     */
    glowElement(element, color) {
        element.style.boxShadow = `0 0 20px ${color}`;
        element.style.transition = 'box-shadow 0.3s ease';
        
        setTimeout(() => {
            element.style.boxShadow = '';
        }, 1000);
    }

    /**
     * Show damage number animation
     * @param {HTMLElement} parent - Parent element
     * @param {number} damage - Damage amount
     * @param {boolean} isCritical - Whether it's critical
     */
    showDamageNumber(parent, damage, isCritical = false) {
        const damageElement = document.createElement('div');
        damageElement.className = `damage-number ${isCritical ? 'critical' : ''}`;
        damageElement.textContent = `-${damage}`;
        
        parent.style.position = 'relative';
        parent.appendChild(damageElement);
        
        // Animate
        setTimeout(() => {
            damageElement.style.transform = 'translateY(-50px)';
            damageElement.style.opacity = '0';
        }, 100);
        
        // Remove
        setTimeout(() => {
            if (damageElement.parentNode) {
                damageElement.parentNode.removeChild(damageElement);
            }
        }, 1500);
    }

    /**
     * Show heal number animation
     * @param {HTMLElement} parent - Parent element
     * @param {number} healAmount - Heal amount
     */
    showHealNumber(parent, healAmount) {
        const healElement = document.createElement('div');
        healElement.className = 'heal-number';
        healElement.textContent = `+${healAmount}`;
        
        parent.style.position = 'relative';
        parent.appendChild(healElement);
        
        // Animate
        setTimeout(() => {
            healElement.style.transform = 'translateY(-50px)';
            healElement.style.opacity = '0';
        }, 100);
        
        // Remove
        setTimeout(() => {
            if (healElement.parentNode) {
                healElement.parentNode.removeChild(healElement);
            }
        }, 1500);
    }

    /**
     * Strike effect animation
     * @param {HTMLElement} element - Element to animate
     */
    strikeEffect(element) {
        element.classList.add('strike-animation');
        
        setTimeout(() => {
            element.classList.remove('strike-animation');
        }, 300);
    }

    /**
     * Charge effect animation for special attacks
     * @param {HTMLElement} element - Element to animate
     */
    chargeEffect(element) {
        element.classList.add('charge-animation');
        
        setTimeout(() => {
            element.classList.remove('charge-animation');
        }, 500);
    }

    /**
     * Shield effect animation
     * @param {HTMLElement} element - Element to animate
     */
    shieldEffect(element) {
        element.classList.add('shield-animation');
        
        setTimeout(() => {
            element.classList.remove('shield-animation');
        }, 800);
    }

    /**
     * Animate HP bar change
     * @param {string} side - 'player' or 'opponent'
     * @param {number} newHp - New HP value
     * @param {number} maxHp - Maximum HP
     */
    animateHPChange(side, newHp, maxHp) {
        const hpFill = document.getElementById(`${side}-hp-fill`);
        const hpText = document.getElementById(`${side}-hp-text`);
        
        if (!hpFill || !hpText) return;
        
        const percentage = (newHp / maxHp) * 100;
        
        // Animate HP bar
        hpFill.style.width = `${percentage}%`;
        hpText.textContent = `${newHp}/${maxHp}`;
        
        // Change color based on HP percentage
        if (percentage <= 25) {
            hpFill.style.background = 'linear-gradient(90deg, #f44336, #d32f2f)';
        } else if (percentage <= 50) {
            hpFill.style.background = 'linear-gradient(90deg, #FF9800, #F57C00)';
        } else {
            hpFill.style.background = 'linear-gradient(90deg, #4CAF50, #8BC34A)';
        }
    }

    /**
     * Victory celebration animation
     * @param {string} winnerSide - 'player' or 'opponent'
     */
    celebrateVictory(winnerSide) {
        if (!this.animationsEnabled) return;

        const panel = document.querySelector(`.${winnerSide}-panel`);
        if (!panel) return;

        // Victory glow
        this.glowElement(panel, '#ffd700');
        
        // Bounce animation
        panel.classList.add('victory-bounce');
        
        setTimeout(() => {
            panel.classList.remove('victory-bounce');
        }, 2000);
        
        // Play victory sound
        this.playSound('victory');
        
        // Confetti effect
        this.createConfetti();
    }

    /**
     * Defeat animation
     * @param {string} loserSide - 'player' or 'opponent'
     */
    showDefeat(loserSide) {
        if (!this.animationsEnabled) return;

        const panel = document.querySelector(`.${loserSide}-panel`);
        if (!panel) return;

        // Fade out effect
        panel.classList.add('defeat-fade');
        
        // Play defeat sound
        this.playSound('defeat');
    }

    /**
     * Create confetti effect
     */
    createConfetti() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'];
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        document.body.appendChild(confettiContainer);
        
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.animationDelay = Math.random() * 3 + 's';
            confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
            confettiContainer.appendChild(confetti);
        }
        
        // Remove confetti after animation
        setTimeout(() => {
            if (confettiContainer.parentNode) {
                confettiContainer.parentNode.removeChild(confettiContainer);
            }
        }, 5000);
    }

    /**
     * Set sound enabled state
     * @param {boolean} enabled - Whether sound is enabled
     */
    setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
    }

    /**
     * Set animations enabled state
     * @param {boolean} enabled - Whether animations are enabled
     */
    setAnimationsEnabled(enabled) {
        this.animationsEnabled = enabled;
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
        
        this.activeAnimations.clear();
    }
}

// Export for use in other modules (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BattleEffects;
}

// Make available globally in browser
if (typeof window !== 'undefined') {
    window.BattleEffects = BattleEffects;
}