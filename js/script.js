// Import all modules
import { elements } from './modules/domElements.js';
import { initializeNavigation } from './modules/navigation.js';
import { storage } from './modules/memoryStorage.js';
import { initializeMapInteraction } from './modules/mapInteraction.js';
import { initializeForm } from './modules/formHandler.js';
import { initializeLocationSearch, handleLocationSelect } from './modules/locationSearch.js';
import { initializeMap, filterMapMarkers } from './modules/mapMarkers.js';
import { displayMemories } from './modules/memoryDisplay.js';

// Initialize components based on current page
document.addEventListener('DOMContentLoaded', () => {
    // Initialize navigation on all pages
    initializeNavigation();

    // Initialize map page specific functionality
    if (window.location.pathname.includes('map.html')) {
        const map = initializeMap();
        if (map) {
            // Initialize location search
            initializeLocationSearch();

            // Initialize privacy filter
            elements.privacyFilter?.addEventListener('change', (e) => {
                const privacy = e.target.value;
                filterMapMarkers(privacy);
                const memories = storage.getAllMemories(privacy);
                displayMemories(memories);
            });

            // Display initial memories
            displayMemories(storage.getAllMemories());
        }
    }

    // Initialize add memory page functionality
    if (window.location.pathname.includes('add.html')) {
        initializeForm();
        initializeLocationSearch();

        // Check for pinLocation in sessionStorage
        const pinLocation = sessionStorage.getItem('pinLocation');
        if (pinLocation) {
            const { lat, lng } = JSON.parse(pinLocation);
            document.getElementById('latitude').value = lat;
            document.getElementById('longitude').value = lng;
        }
    }

    // Make certain functions available globally for onclick handlers
    if (typeof window !== 'undefined') {
        window.handleLocationSelect = (displayName, lat, lng) => {
            import('./modules/locationSearch.js').then(module => {
                module.handleLocationSelect(displayName, lat, lng);
            });
        };
        
        window.removeTag = (tag) => {
            import('./modules/formHandler.js').then(module => {
                module.removeTag(tag);
            });
        };
    }
});
