import { elements } from './domElements.js';
import { filterMapMarkers } from './mapMarkers.js';

export function initializeMapInteraction() {
    const { privacyFilter } = elements;

    // Initialize privacy filter
    privacyFilter?.addEventListener('change', (e) => {
        const selectedPrivacy = e.target.value;
        filterMapMarkers(selectedPrivacy);
    });
}
