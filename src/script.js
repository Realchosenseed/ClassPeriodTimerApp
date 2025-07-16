// src/script.js: Core timer logic for the Class Period Timer (Final Corrected Version with Debugging)
import { saveTimerState, loadTimerState, clearTimerState, saveSettings, loadSettings } from './storage.js';
import {
    updateTimerDisplay, toggleTheme, showTimeUpModal, hideTimeUpModal,
    updateProgressRing, showSettingsModal, hideSettingsModal,
    populateSettingsUI, getSettingsFromUI, showToast, updatePeriodIndicator
} from './ui.js';

// --- Timer State Variables ---
let timerId = null; // Stores the requestAnimationFrame ID for the animation loop
let startTime = 0; // Timestamp when the current period started (or resumed)
let initialDurationForCurrentPeriod = 0; // Total duration of the *current* period in milliseconds
let remainingTime = 0; // Remaining time in milliseconds
let isPaused = false; // Flag to indicate if the timer is paused
let currentPeriodIndex = 0; // 0-indexed current period in the schedule

// --- Application Settings Variables ---
let appSettings = {
    defaultSinglePeriodDuration: 40 * 60 * 1000, // Default 40 minutes in ms
    schedule: [], // Array of period durations in ms (e.g., [40*60*1000, 30*60*1000])
    vibrateAlert: true // Bonus: Vibrate at end of period
};

// --- DOM Elements ---
// These are defined globally, but their existence is checked in DOMContentLoaded
let startButton;
let pauseButton;
let resetButton;
let bellSound;
let themeToggle;
let closeModalButton;
let settingsButton;
let saveSettingsButton;
let cancelSettingsButton;
let timeUpModal;

// --- Helper Functions ---

/**
 * Initializes the application: loads settings and timer state, sets up initial display.
 */
function initApp() {
    console.log('INIT: Application initialization started.');

    // 1. Load application settings
    const loadedSettings = loadSettings();
    if (loadedSettings) {
        console.log('INIT: Loaded settings from localStorage:', loadedSettings);
        appSettings = { ...appSettings, ...loadedSettings };
        // Ensure schedule items are numbers and convert to milliseconds
        if (Array.isArray(appSettings.schedule)) {
            appSettings.schedule = appSettings.schedule.map(d => parseInt(d)).filter(d => !isNaN(d) && d > 0).map(d => d * 60 * 1000); // Convert to MS here
            console.log('INIT: Processed schedule (ms):', appSettings.schedule);
        } else {
            appSettings.schedule = []; // Reset if not array
            console.log('INIT: Schedule was not an array, reset to empty.');
        }
        // Ensure default duration is number and convert to milliseconds
        if (typeof appSettings.defaultSinglePeriodDuration === 'number') {
            appSettings.defaultSinglePeriodDuration = parseInt(appSettings.defaultSinglePeriodDuration) * 60 * 1000; // Convert to MS here
            console.log('INIT: Processed defaultSinglePeriodDuration (ms):', appSettings.defaultSinglePeriodDuration);
        } else {
            appSettings.defaultSinglePeriodDuration = 40 * 60 * 1000; // Default if invalid
            console.log('INIT: defaultSinglePeriodDuration was invalid, set to default.');
        }
        // Ensure vibrateAlert is boolean
        appSettings.vibrateAlert = typeof appSettings.vibrateAlert === 'boolean' ? appSettings.vibrateAlert : true;
        console.log('INIT: vibrateAlert set to:', appSettings.vibrateAlert);
    } else {
        console.log('INIT: No settings found in localStorage, using defaults.');
    }
    populateSettingsUI(appSettings); // Populate settings modal with loaded values

    // 2. Load timer state
    const savedTimerState = loadTimerState();
    if (savedTimerState) {
        console.log('INIT: Loaded timer state from localStorage:', savedTimerState);
        startTime = savedTimerState.startTime;
        initialDurationForCurrentPeriod = savedTimerState.initialDurationForCurrentPeriod;
        remainingTime = savedTimerState.remainingTime;
        isPaused = savedTimerState.isPaused;
        currentPeriodIndex = savedTimerState.currentPeriodIndex;

        // Validate loaded state against current schedule/default
        const totalPeriods = appSettings.schedule.length > 0 ? appSettings.schedule.length : 1;
        if (currentPeriodIndex >= totalPeriods) {
            console.warn('INIT: Saved period index out of bounds for the new schedule, resetting timer state.');
            resetTimer(); // This will re-initialize with current settings
            return;
        }

        // If it was running when saved, restart the animation loop
        if (!isPaused) {
            console.log('INIT: Timer was running, resuming animation.');
            startTimer();
        } else {
            // If paused, just update display to show remaining time
            console.log('INIT: Timer was paused, updating display.');
            updateDisplay();
        }
    } else {
        // New timer session or no saved state
        console.log('INIT: No saved timer state found, performing initial reset.');
        resetTimer(); // Initialize with default or first period
    }

    // 3. Initialize theme
    toggleTheme(true); // true to initialize without toggling
    console.log('INIT: Application initialization complete.');
}

/**
 * Updates the timer display and progress ring.
 */
function updateDisplay() {
    console.log('UPDATE_DISPLAY: Updating timer display. Remaining:', remainingTime / 1000, 's');
    const seconds = Math.max(0, Math.floor(remainingTime / 1000));
    const minutes = Math.floor(seconds / 60);
    const displaySeconds = seconds % 60;

    const totalPeriods = appSettings.schedule.length > 0 ? appSettings.schedule.length : 1;
    const currentPeriodNum = currentPeriodIndex + 1;

    updateTimerDisplay(minutes, displaySeconds);
    updatePeriodIndicator(currentPeriodNum, totalPeriods);

    // Calculate progress percentage for the ring
    const progressPercentage = (initialDurationForCurrentPeriod > 0) ? (remainingTime / initialDurationForCurrentPeriod) * 100 : 0;
    updateProgressRing(progressPercentage);
}

/**
 * Starts or resumes the timer countdown.
 * Calculates the end time and begins the animation loop.
 */
function startTimer() {
    console.log('START: Attempting to start timer.');
    if (timerId) {
        console.log('START: Timer already running, doing nothing.');
        return;
    }

    // Determine the duration for this specific period
    if (appSettings.schedule.length > 0) {
        // Use multi-period schedule
        initialDurationForCurrentPeriod = appSettings.schedule[currentPeriodIndex];
        console.log(`START: Using multi-period schedule. Period ${currentPeriodIndex + 1} duration: ${initialDurationForCurrentPeriod / (60 * 1000)} minutes.`);
    } else {
        // Use default single period duration
        initialDurationForCurrentPeriod = appSettings.defaultSinglePeriodDuration;
        currentPeriodIndex = 0; // Ensure single period mode always starts at index 0
        console.log(`START: Using default single period duration: ${initialDurationForCurrentPeriod / (60 * 1000)} minutes.`);
    }

    // If starting fresh or resuming after reset
    if (startTime === 0 || remainingTime === 0 || remainingTime === initialDurationForCurrentPeriod) {
        startTime = Date.now();
        remainingTime = initialDurationForCurrentPeriod;
        console.log('START: Starting fresh or after full reset.');
    } else if (isPaused) {
        // If resuming from a paused state
        startTime = Date.now() - (initialDurationForCurrentPeriod - remainingTime);
        isPaused = false;
        console.log('START: Resuming from paused state.');
    }

    // Save initial state to localStorage
    saveTimerState({
        startTime,
        initialDurationForCurrentPeriod,
        remainingTime,
        isPaused,
        currentPeriodIndex
    });

    // Start the animation loop
    animate();
    console.log('START: Timer animation loop started.');

    // Disable start button, enable pause/reset
    if (startButton) startButton.disabled = true;
    if (pauseButton) pauseButton.disabled = false;
    if (resetButton) resetButton.disabled = false;
}

/**
 * Pauses the timer countdown.
 * Stops the animation loop and updates remaining time.
 */
function pauseTimer() {
    console.log('PAUSE: Attempting to pause timer.');
    if (!timerId) {
        console.log('PAUSE: Timer not running, doing nothing.');
        return;
    }

    cancelAnimationFrame(timerId);
    timerId = null;
    isPaused = true;
    // Calculate remaining time at the moment of pause
    remainingTime = startTime + initialDurationForCurrentPeriod - Date.now();
    saveTimerState({
        startTime,
        initialDurationForCurrentPeriod,
        remainingTime,
        isPaused,
        currentPeriodIndex
    });
    console.log('PAUSE: Timer paused. Remaining:', remainingTime / 1000, 'seconds');

    // Enable start button, disable pause
    if (startButton) startButton.disabled = false;
    if (pauseButton) pauseButton.disabled = true;
}

/**
 * Resets the timer to its initial state for the current period or the first period if schedule exists.
 * Clears localStorage timer state and resets display.
 */
function resetTimer() {
    console.log('RESET: Attempting to reset timer.');
    cancelAnimationFrame(timerId);
    timerId = null;
    clearTimerState(); // Clear saved timer state from localStorage

    // Determine the initial duration based on current settings
    if (appSettings.schedule.length > 0) {
        // Reset to the first period of the schedule if a schedule exists
        currentPeriodIndex = 0;
        initialDurationForCurrentPeriod = appSettings.schedule[currentPeriodIndex];
        console.log(`RESET: Resetting to first period of schedule. Period 1 duration: ${initialDurationForCurrentPeriod / (60 * 1000)} minutes.`);
    } else {
        // Reset to the default single period duration
        currentPeriodIndex = 0; // Ensure period indicator shows 1 of 1
        initialDurationForCurrentPeriod = appSettings.defaultSinglePeriodDuration;
        console.log(`RESET: Resetting to default single period duration: ${initialDurationForCurrentPeriod / (60 * 1000)} minutes.`);
    }

    startTime = 0; // Reset start time
    remainingTime = initialDurationForCurrentPeriod; // Set remaining time to the full duration
    isPaused = false; // Ensure it's not paused

    updateDisplay(); // Update display to show reset time
    console.log('RESET: Timer reset complete.');

    // Enable start button, disable pause/reset
    if (startButton) startButton.disabled = false;
    if (pauseButton) pauseButton.disabled = true;
    if (resetButton) resetButton.disabled = true;
}

/**
 * The main animation loop for the timer.
 * Calculates remaining time and updates the display.
 */
function animate() {
    const currentTime = Date.now();
    let currentRemaining = startTime + initialDurationForCurrentPeriod - currentTime;

    if (isPaused) {
        currentRemaining = remainingTime;
    } else if (currentRemaining <= 0) {
        currentRemaining = 0;
        handleTimeUp();
        return;
    }

    remainingTime = currentRemaining;
    updateDisplay();

    timerId = requestAnimationFrame(animate);

    saveTimerState({
        startTime,
        initialDurationForCurrentPeriod,
        remainingTime,
        isPaused,
        currentPeriodIndex
    });
}

/**
 * Handles actions when the timer reaches 00:00.
 * Plays a sound, shows a modal, vibrates, shows toast, and advances to next period.
 */
function handleTimeUp() {
    console.log('TIME_UP: Period ended.');
    cancelAnimationFrame(timerId);
    timerId = null;
    clearTimerState(); // Clear timer state from localStorage

    if (bellSound) bellSound.play().catch(e => console.error("ERROR: Error playing bell sound:", e)); // Play the bell sound

    if (appSettings.vibrateAlert && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]); // Vibrate pattern: 200ms on, 100ms off, 200ms on
        console.log('TIME_UP: Vibration triggered.');
    }

    showTimeUpModal(); // Show the "Time's Up!" modal

    const totalPeriods = appSettings.schedule.length > 0 ? appSettings.schedule.length : 1;
    const nextPeriodIndex = currentPeriodIndex + 1;

    if (nextPeriodIndex < totalPeriods) {
        // There's a next period
        const nextPeriodDurationMinutes = appSettings.schedule[nextPeriodIndex] / (60 * 1000);
        showToast(`Period ${currentPeriodIndex + 1} complete. Next: ${nextPeriodDurationMinutes} minutes.`, 4000);
        currentPeriodIndex = nextPeriodIndex;
        console.log(`TIME_UP: Advancing to next period: ${currentPeriodIndex + 1}.`);
        // Auto-start the next period after a short delay (e.g., 2 seconds)
        setTimeout(() => {
            hideTimeUpModal();
            startTimer();
        }, 2000);
    } else {
        // All periods finished
        showToast(`All periods complete!`, 5000);
        console.log('TIME_UP: All periods finished.');
        currentPeriodIndex = 0; // Reset for next session
        initialDurationForCurrentPeriod = appSettings.defaultSinglePeriodDuration; // Reset to default for next session
        updateDisplay(); // Update display to show 00:00 and Period 1 of 1 (or 1 of N if schedule exists)
        // Reset buttons to initial state
        if (startButton) startButton.disabled = false;
        if (pauseButton) pauseButton.disabled = true;
        if (resetButton) resetButton.disabled = true;
        // Hide modal after a delay
        setTimeout(() => hideTimeUpModal(), 3000);
    }
}

/**
 * Handles saving settings from the modal.
 */
function handleSaveSettings() {
    console.log('SAVE_SETTINGS: Save button clicked.');
    const newSettings = getSettingsFromUI();
    console.log('SAVE_SETTINGS: Settings from UI:', newSettings);

    // Validate and convert durations to milliseconds
    const validatedSchedule = [];
    if (newSettings.scheduleString) {
        const parts = newSettings.scheduleString.split(',').map(s => parseInt(s.trim()));
        for (let i = 0; i < Math.min(parts.length, 8); i++) { // Max 8 periods
            const duration = parts[i];
            if (!isNaN(duration) && duration > 0) {
                validatedSchedule.push(duration * 60 * 1000); // Convert to milliseconds
            } else {
                showToast(`Invalid duration "${parts[i]}" in schedule. Please use positive numbers.`, 3000);
                console.error(`SAVE_SETTINGS: Invalid duration found: "${parts[i]}"`);
                return; // Stop save process
            }
        }
    }

    const defaultDurationMinutes = parseInt(newSettings.defaultSinglePeriodDuration);
    if (isNaN(defaultDurationMinutes) || defaultDurationMinutes <= 0) {
        showToast("Default duration must be a positive number.", 3000);
        console.error('SAVE_SETTINGS: Default duration invalid.');
        return; // Stop save process
    }

    // Update appSettings with validated values (converted to minutes for storage, then back to ms for appSettings)
    appSettings.defaultSinglePeriodDuration = defaultDurationMinutes * 60 * 1000;
    appSettings.schedule = validatedSchedule; // This is already in MS
    appSettings.vibrateAlert = newSettings.vibrateAlert;

    // Save a version of settings where durations are in minutes for cleaner storage
    saveSettings({
        defaultSinglePeriodDuration: defaultDurationMinutes, // Store in minutes
        schedule: validatedSchedule.map(d => d / (60 * 1000)), // Store in minutes
        vibrateAlert: newSettings.vibrateAlert
    });

    hideSettingsModal(); // Close modal
    showToast("Settings saved!", 2000);
    console.log('SAVE_SETTINGS: Settings saved successfully. New appSettings:', appSettings);

    // Re-initialize timer based on new settings (resets current period if schedule changed)
    resetTimer();
}

// --- Event Listeners and DOM Element Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM_LOADED: DOMContentLoaded event fired. Attempting to get DOM elements.');

    // Assign DOM elements after DOM is loaded
    startButton = document.getElementById('startButton');
    pauseButton = document.getElementById('pauseButton');
    resetButton = document.getElementById('resetButton');
    bellSound = document.getElementById('bellSound');
    themeToggle = document.getElementById('themeToggle');
    closeModalButton = document.getElementById('closeModalButton');
    settingsButton = document.getElementById('settingsButton');
    saveSettingsButton = document.getElementById('saveSettingsButton');
    cancelSettingsButton = document.getElementById('cancelSettingsButton');
    timeUpModal = document.getElementById('timeUpModal'); // Ensure this is also captured

    // Attach event listeners, checking if elements were found
    if (startButton) {
        startButton.addEventListener('click', startTimer);
        console.log('DOM_LOADED: startButton found and listener attached.');
    } else { console.error('ERROR: startButton not found!'); }

    if (pauseButton) {
        pauseButton.addEventListener('click', pauseTimer);
        console.log('DOM_LOADED: pauseButton found and listener attached.');
    } else { console.error('ERROR: pauseButton not found!'); }

    if (resetButton) {
        resetButton.addEventListener('click', resetTimer);
        console.log('DOM_LOADED: resetButton found and listener attached.');
    } else { console.error('ERROR: resetButton not found!'); }

    if (themeToggle) {
        themeToggle.addEventListener('change', () => toggleTheme());
        console.log('DOM_LOADED: themeToggle found and listener attached.');
    } else { console.error('ERROR: themeToggle not found!'); }

    if (closeModalButton) {
        closeModalButton.addEventListener('click', hideTimeUpModal);
        console.log('DOM_LOADED: closeModalButton found and listener attached.');
    } else { console.error('ERROR: closeModalButton not found!'); }

    if (settingsButton) {
        settingsButton.addEventListener('click', () => {
            console.log('CLICK: Settings button clicked! Preparing to show settings modal.');
            populateSettingsUI(appSettings); // Ensure UI reflects current settings before showing
            showSettingsModal();
        });
        console.log('DOM_LOADED: settingsButton found and listener attached.');
    } else { console.error('ERROR: settingsButton not found!'); }

    if (saveSettingsButton) {
        saveSettingsButton.addEventListener('click', handleSaveSettings);
        console.log('DOM_LOADED: saveSettingsButton found and listener attached.');
    } else { console.error('ERROR: saveSettingsButton not found!'); }

    if (cancelSettingsButton) {
        cancelSettingsButton.addEventListener('click', hideSettingsModal);
        console.log('DOM_LOADED: cancelSettingsButton found and listener attached.');
    } else { console.error('ERROR: cancelSettingsButton not found!'); }

    // Initialize the app after all elements are guaranteed to be in DOM and listeners attached
    initApp();
});