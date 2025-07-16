// src/storage.js: Helper functions for interacting with localStorage (Final Corrected Version with Debugging)

const TIMER_STATE_KEY = 'classPeriodTimerState';
const APP_SETTINGS_KEY = 'classPeriodTimerSettings';

/**
 * Saves the current timer state to localStorage.
 * @param {object} state - The timer state object to save.
 */
export function saveTimerState(state) {
    try {
        localStorage.setItem(TIMER_STATE_KEY, JSON.stringify(state));
        console.log('STORAGE: Timer state saved:', state);
    } catch (e) {
        console.error('STORAGE ERROR: Error saving timer state to localStorage:', e);
    }
}

/**
 * Loads the timer state from localStorage.
 * @returns {object|null} The saved timer state, or null if no state is found or an error occurs.
 */
export function loadTimerState() {
    try {
        const storedState = localStorage.getItem(TIMER_STATE_KEY);
        if (storedState) {
            const state = JSON.parse(storedState);
            // Basic validation for essential properties
            if (typeof state.startTime === 'number' &&
                typeof state.initialDurationForCurrentPeriod === 'number' &&
                typeof state.remainingTime === 'number' &&
                typeof state.isPaused === 'boolean' &&
                typeof state.currentPeriodIndex === 'number') {
                console.log('STORAGE: Timer state loaded:', state);
                return state;
            } else {
                console.warn('STORAGE: Loaded timer state is invalid, returning null.');
                return null;
            }
        }
    } catch (e) {
        console.error('STORAGE ERROR: Error loading timer state from localStorage:', e);
    }
    return null;
}

/**
 * Clears the timer state from localStorage.
 */
export function clearTimerState() {
    try {
        localStorage.removeItem(TIMER_STATE_KEY);
        console.log('STORAGE: Timer state cleared from localStorage.');
    } catch (e) {
        console.error('STORAGE ERROR: Error clearing timer state from localStorage:', e);
    }
}

/**
 * Saves application settings to localStorage.
 * Note: Durations are stored in minutes here. Conversion to milliseconds happens in script.js.
 * @param {object} settings - The settings object to save.
 */
export function saveSettings(settings) {
    try {
        localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(settings));
        console.log('STORAGE: App settings saved:', settings);
    } catch (e) {
        console.error('STORAGE ERROR: Error saving app settings to localStorage:', e);
    }
}

/**
 * Loads application settings from localStorage.
 * @returns {object|null} The saved settings, or null if no settings are found or an error occurs.
 */
export function loadSettings() {
    try {
        const storedSettings = localStorage.getItem(APP_SETTINGS_KEY);
        if (storedSettings) {
            const settings = JSON.parse(storedSettings);
            // Basic validation for essential properties
            if (typeof settings.defaultSinglePeriodDuration === 'number' || Array.isArray(settings.schedule) || typeof settings.vibrateAlert === 'boolean') {
                console.log('STORAGE: App settings loaded:', settings);
                return settings;
            } else {
                console.warn('STORAGE: Loaded app settings are invalid, returning null.');
                return null;
            }
        }
    } catch (e) {
        console.error('STORAGE ERROR: Error loading app settings from localStorage:', e);
    }
    return null;
}