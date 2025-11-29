/**
 * Sound Manager Service
 * Centralized audio management for the poker game
 */

class SoundManager {
    constructor() {
        this.sounds = {};
        this.volume = 0.7; // Default 70% volume
        this.muted = false;
        this.initialized = false;

        // Load volume preference from localStorage
        const savedVolume = localStorage.getItem('poker-volume');
        const savedMuted = localStorage.getItem('poker-muted');

        if (savedVolume !== null) {
            this.volume = parseFloat(savedVolume);
        }
        if (savedMuted !== null) {
            this.muted = savedMuted === 'true';
        }
    }

    /**
     * Initialize and preload all sound files
     */
    init() {
        if (this.initialized) return;

        const soundFiles = {
            // Game sounds
            'card-shuffle': '/sounds/game/card-shuffle.mp3',
            'card-deal': '/sounds/game/card-deal.mp3',
            'chip-bet': '/sounds/game/chip-bet.mp3',
            'chip-win': '/sounds/game/chip-win.mp3',
            'victory': '/sounds/game/victory.mp3',
            'fold': '/sounds/game/fold.mp3',

            // UI sounds
            'button-click': '/sounds/ui/button-click.mp3',
            'button-hover': '/sounds/ui/button-hover.mp3',
            'error': '/sounds/ui/error.mp3',
            'notification': '/sounds/ui/notification.mp3'
        };

        // Preload all sounds
        Object.entries(soundFiles).forEach(([name, path]) => {
            const audio = new Audio(path);
            audio.preload = 'auto';
            audio.volume = this.volume;

            // Handle loading errors gracefully
            audio.addEventListener('error', () => {
                console.warn(`Failed to load sound: ${name} from ${path}`);
            });

            this.sounds[name] = audio;
        });

        this.initialized = true;
        console.log('[SoundManager] Initialized with', Object.keys(this.sounds).length, 'sounds');
    }

    /**
     * Play a sound by name
     * @param {string} name - Sound name
     * @param {number} volumeOverride - Optional volume override (0-1)
     */
    play(name, volumeOverride = null) {
        if (this.muted) return;

        const sound = this.sounds[name];
        if (!sound) {
            console.warn(`[SoundManager] Sound not found: ${name}`);
            return;
        }

        try {
            // Clone the audio to allow overlapping sounds
            const audioClone = sound.cloneNode();
            audioClone.volume = volumeOverride !== null ? volumeOverride : this.volume;

            // Play and clean up
            const playPromise = audioClone.play();

            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    // Handle autoplay restrictions
                    if (error.name === 'NotAllowedError') {
                        console.warn('[SoundManager] Autoplay blocked. User interaction required.');
                    } else {
                        console.error('[SoundManager] Error playing sound:', error);
                    }
                });
            }
        } catch (error) {
            console.error(`[SoundManager] Error playing ${name}:`, error);
        }
    }

    /**
     * Set master volume
     * @param {number} volume - Volume level (0-1)
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));

        // Update all preloaded sounds
        Object.values(this.sounds).forEach(sound => {
            sound.volume = this.volume;
        });

        // Save to localStorage
        localStorage.setItem('poker-volume', this.volume.toString());

        console.log('[SoundManager] Volume set to', Math.round(this.volume * 100) + '%');
    }

    /**
     * Get current volume
     * @returns {number} Current volume (0-1)
     */
    getVolume() {
        return this.volume;
    }

    /**
     * Toggle mute
     * @param {boolean} muted - Mute state
     */
    setMuted(muted) {
        this.muted = muted;
        localStorage.setItem('poker-muted', muted.toString());
        console.log('[SoundManager] Muted:', muted);
    }

    /**
     * Get mute state
     * @returns {boolean} Current mute state
     */
    isMuted() {
        return this.muted;
    }

    /**
     * Toggle mute on/off
     */
    toggleMute() {
        this.setMuted(!this.muted);
        return this.muted;
    }

    /**
     * Stop all currently playing sounds
     */
    stopAll() {
        Object.values(this.sounds).forEach(sound => {
            sound.pause();
            sound.currentTime = 0;
        });
    }
}

// Create singleton instance
const soundManager = new SoundManager();

export default soundManager;
