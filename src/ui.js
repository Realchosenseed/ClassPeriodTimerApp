// src/ui.js: Functions for DOM manipulation and UI interactions (Final Corrected Version)

// --- DOM Elements ---
// These are assumed to be present in the HTML.
const timerDisplay = document.getElementById('timerDisplay');
const timeUpModal = document.getElementById('timeUpModal');
const modalContent = document.getElementById('modalContent'); // Content of timeUpModal
const progressRing = document.getElementById('progressRing');
const settingsModal = document.getElementById('settingsModal');
const settingsModalContent = document.getElementById('settingsModalContent');
const defaultDurationInput = document.getElementById('defaultDurationInput');
const scheduleInput = document.getElementById('scheduleInput');
const vibrateAlertToggle = document.getElementById('vibrateAlertToggle');
const toastContainer = document.getElementById('toastContainer');
const periodIndicator = document.getElementById('periodIndicator');

// --- Constants ---
const THEME_STORAGE_KEY = 'themePreference';
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * 52; // For a radius of 52 (from SVG)

/**
 * Updates the countdown display with formatted minutes and seconds.
 * @param {number} minutes - The minutes to display.
 * @param {number} seconds - The seconds to display.
 */
export function updateTimerDisplay(minutes, seconds) {
    const formattedMinutes = String(Math.max(0, minutes)).padStart(2, '0');
    const formattedSeconds = String(Math.max(0, seconds)).padStart(2, '0');
    if (timerDisplay) {
        timerDisplay.textContent = `${formattedMinutes}:${formattedSeconds}`;
    } else {
        console.error('UI ERROR: timerDisplay element not found!');
    }
}

/**
 * Updates the period indicator display.
 * @param {number} currentPeriod - The current period number (1-indexed).
 * @param {number} totalPeriods - The total number of periods.
 */
export function updatePeriodIndicator(currentPeriod, totalPeriods) {
    if (periodIndicator) {
        periodIndicator.textContent = `Period ${currentPeriod} of ${totalPeriods}`;
    } else {
        console.error('UI ERROR: periodIndicator element not found!');
    }
}

/**
 * Toggles between dark and light themes based on user preference or system setting.
 * Saves the preference to localStorage.
 * @param {boolean} [initialize=false] - If true, only initializes the theme without toggling.
 */
export function toggleTheme(initialize = false) {
    const body = document.body;
    const themeToggleCheckbox = document.getElementById('themeToggle');
    let currentTheme = localStorage.getItem(THEME_STORAGE_KEY);

    if (initialize) {
        if (!currentTheme) {
            currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        body.classList.add(currentTheme);
        if (themeToggleCheckbox) {
            themeToggleCheckbox.checked = (currentTheme === 'dark');
        }
    } else {
        if (body.classList.contains('dark')) {
            body.classList.remove('dark');
            body.classList.add('light');
            localStorage.setItem(THEME_STORAGE_KEY, 'light');
            if (themeToggleCheckbox) themeToggleCheckbox.checked = false;
        } else {
            body.classList.remove('light');
            body.classList.add('dark');
            localStorage.setItem(THEME_STORAGE_KEY, 'dark');
            if (themeToggleCheckbox) themeToggleCheckbox.checked = true;
        }
    }
}

/**
 * Shows the "Time's Up!" modal.
 */
export function showTimeUpModal() {
    console.log('UI: Showing time up modal.');
    if (timeUpModal && modalContent) {
        timeUpModal.classList.remove('hidden');
        setTimeout(() => {
            modalContent.classList.remove('scale-95', 'opacity-0');
            modalContent.classList.add('scale-100', 'opacity-100');
        }, 10);
    } else {
        console.error('UI ERROR: timeUpModal or modalContent element not found!');
    }
}

/**
 * Hides the "Time's Up!" modal.
 */
export function hideTimeUpModal() {
    console.log('UI: Hiding time up modal.');
    if (timeUpModal && modalContent) {
        modalContent.classList.remove('scale-100', 'opacity-100');
        modalContent.classList.add('scale-95', 'opacity-0');
        modalContent.addEventListener('transitionend', () => {
            timeUpModal.classList.add('hidden');
        }, { once: true });
    } else {
        console.error('UI ERROR: timeUpModal or modalContent element not found!');
    }
}

/**
 * Updates the SVG progress ring to show the remaining time.
 * @param {number} percentage - The percentage of time remaining (0-100).
 */
export function updateProgressRing(percentage) {
    if (progressRing) {
        const offset = CIRCLE_CIRCUMFERENCE - (percentage / 100) * CIRCLE_CIRCUMFERENCE;
        progressRing.style.strokeDashoffset = offset;
    } else {
        console.error('UI ERROR: progressRing element not found!');
    }
}

/**
 * Shows the settings modal.
 */
export function showSettingsModal() {
    console.log('UI: Showing settings modal.');
    if (settingsModal && settingsModalContent) {
        settingsModal.classList.remove('hidden');
        setTimeout(() => {
            settingsModalContent.classList.remove('scale-95', 'opacity-0');
            settingsModalContent.classList.add('scale-100', 'opacity-100');
        }, 10);
    } else {
        console.error('UI ERROR: settingsModal or settingsModalContent element not found!');
    }
}

/**
 * Hides the settings modal.
 */
export function hideSettingsModal() {
    console.log('UI: Hiding settings modal.');
    if (settingsModal && settingsModalContent) {
        settingsModalContent.classList.remove('scale-100', 'opacity-100');
        settingsModalContent.classList.add('scale-95', 'opacity-0');
        settingsModalContent.addEventListener('transitionend', () => {
            settingsModal.classList.add('hidden');
        }, { once: true });
    } else {
        console.error('UI ERROR: settingsModal or settingsModalContent element not found!');
    }
}

/**
 * Populates the settings modal UI with current settings.
 * @param {object} settings - The current application settings. Durations are in milliseconds.
 */
export function populateSettingsUI(settings) {
    console.log('UI: Populating settings UI with:', settings);
    if (defaultDurationInput) {
        defaultDurationInput.value = settings.defaultSinglePeriodDuration / (60 * 1000); // Convert MS to minutes for UI
    } else { console.error('UI ERROR: defaultDurationInput not found!'); }

    if (scheduleInput) {
        // Convert schedule milliseconds back to minutes and join with comma for UI
        scheduleInput.value = settings.schedule.map(d => d / (60 * 1000)).join(',');
    } else { console.error('UI ERROR: scheduleInput not found!'); }

    if (vibrateAlertToggle) {
        vibrateAlertToggle.checked = settings.vibrateAlert;
    } else { console.error('UI ERROR: vibrateAlertToggle not found!'); }
}

/**
 * Retrieves settings from the UI input fields.
 * @returns {object} An object containing the settings from the UI. Durations are in minutes.
 */
export function getSettingsFromUI() {
    console.log('UI: Retrieving settings from UI.');
    return {
        defaultSinglePeriodDuration: parseFloat(defaultDurationInput.value || '0'), // Use 0 if empty
        scheduleString: scheduleInput.value || '', // Use empty string if empty
        vibrateAlert: vibrateAlertToggle.checked
    };
}

/**
 * Displays a toast notification.
 * @param {string} message - The message to display.
 * @param {number} duration - How long the toast should be visible in milliseconds.
 */
export function showToast(message, duration = 3000) {
    console.log('UI: Displaying toast:', message);
    if (toastContainer) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => {
                toast.remove();
            }, { once: true });
        }, duration);
    } else {
        console.error('UI ERROR: toastContainer element not found!');
    }
}