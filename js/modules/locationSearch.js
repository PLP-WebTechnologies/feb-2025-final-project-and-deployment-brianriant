import { elements } from './domElements.js';
import { setMapView, getMap } from './mapMarkers.js';
import { setSelectedLocation } from './formHandler.js';
import { storage } from './memoryStorage.js';

let searchTimeout;
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';
const SEARCH_DELAY = 500;
const MIN_QUERY_LENGTH = 3;

export function initializeLocationSearch() {
    const { locationSearch, searchBtn, searchResults } = elements;
    
    if (!locationSearch) return;

    // Add input handler with debounce
    locationSearch?.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();

        if (query.length === 0) {
            clearSearchResults();
        } else if (query.length >= MIN_QUERY_LENGTH) {
            searchTimeout = setTimeout(() => performSearch(query), SEARCH_DELAY);
        }
    });

    // Add search button click handler
    searchBtn?.addEventListener('click', () => {
        const query = locationSearch.value.trim();
        if (query.length >= MIN_QUERY_LENGTH) {
            performSearch(query);
        } else {
            showError('Please enter at least 3 characters');
        }
    });

    // Add keyboard navigation for search results
    locationSearch?.addEventListener('keydown', handleKeyboardNavigation);

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-box') && searchResults) {
            searchResults.style.display = 'none';
        }
    });

    // Search through existing memories
    if (window.location.pathname.includes('/map.html')) {
        initializeMemorySearch();
    }
}

function initializeMemorySearch() {
    const { locationSearch } = elements;
    
    locationSearch?.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();

        searchTimeout = setTimeout(() => {
            const memories = storage.searchMemories(query);
            if (memories.length > 0) {
                const bounds = L.latLngBounds(memories.map(m => [m.coordinates.lat, m.coordinates.lng]));
                const map = getMap();
                if (map) {
                    map.fitBounds(bounds, { padding: [50, 50] });
                }
            }
        }, SEARCH_DELAY);
    });
}

function handleKeyboardNavigation(e) {
    const { searchResults } = elements;
    if (!searchResults || searchResults.style.display === 'none') return;

    const items = searchResults.querySelectorAll('.search-result-item');
    const activeItem = searchResults.querySelector('.search-result-item.active');
    
    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            if (!activeItem) {
                items[0]?.classList.add('active');
            } else {
                const nextItem = activeItem.nextElementSibling;
                if (nextItem) {
                    activeItem.classList.remove('active');
                    nextItem.classList.add('active');
                }
            }
            break;

        case 'ArrowUp':
            e.preventDefault();
            if (activeItem) {
                const prevItem = activeItem.previousElementSibling;
                if (prevItem) {
                    activeItem.classList.remove('active');
                    prevItem.classList.add('active');
                }
            }
            break;

        case 'Enter':
            if (activeItem) {
                e.preventDefault();
                activeItem.click();
            }
            break;

        case 'Escape':
            e.preventDefault();
            clearSearchResults();
            break;
    }
}

async function performSearch(query) {
    const { searchResults } = elements;
    if (!searchResults) return;

    try {
        showLoading();
        const url = `${NOMINATIM_BASE_URL}?format=json&q=${encodeURIComponent(query)}&limit=5`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Search failed: ${response.statusText}`);
        }

        const results = await response.json();
        displaySearchResults(results);
    } catch (error) {
        console.error('Location search error:', error);
        showError(error.message);
    }
}

function displaySearchResults(results) {
    const { searchResults } = elements;
    if (!searchResults) return;

    if (results.length === 0) {
        showError('No locations found');
        return;
    }

    const resultItems = results.map(result => {
        // Escape special characters
        const escapedName = result.display_name
            .replace(/'/g, "\\'")
            .replace(/"/g, '\\"');
            
        return `
            <div class="search-result-item" 
                 onclick="handleLocationSelect('${escapedName}', ${result.lat}, ${result.lon})"
                 data-lat="${result.lat}"
                 data-lon="${result.lon}">
                <div class="result-name">${result.display_name}</div>
                <div class="result-type">${result.type}</div>
            </div>
        `;
    }).join('');

    searchResults.innerHTML = resultItems;
    searchResults.style.display = 'block';
}

export function handleLocationSelect(displayName, lat, lng) {
    const { locationSearch, searchResults, coordinatesDisplay, coordinatesText } = elements;
    
    try {
        // Update form inputs if they exist
        locationSearch.value = displayName;
        const latInput = document.getElementById('latitude');
        const lngInput = document.getElementById('longitude');
        
        if (latInput && lngInput) {
            latInput.value = lat;
            lngInput.value = lng;
        }

        // Update UI elements if they exist
        if (searchResults) searchResults.style.display = 'none';
        if (coordinatesDisplay) coordinatesDisplay.style.display = 'block';
        if (coordinatesText) coordinatesText.textContent = `Selected: ${displayName}`;

        // Update map view
        setMapView(lat, lng);

        // Update form state
        setSelectedLocation({ displayName, lat, lng });

    } catch (error) {
        console.error('Error handling location selection:', error);
        showError('Failed to select location. Please try again.');
    }
}

function showLoading() {
    const { searchResults } = elements;
    if (searchResults) {
        searchResults.innerHTML = `
            <div class="search-result-item loading">
                <div class="loading-spinner"></div>
                Searching...
            </div>
        `;
        searchResults.style.display = 'block';
    }
}

function showError(message) {
    const { searchResults } = elements;
    if (searchResults) {
        searchResults.innerHTML = `
            <div class="search-result-item error">
                <span class="error-icon">⚠️</span>
                ${message}
            </div>
        `;
        searchResults.style.display = 'block';
    }
}

function clearSearchResults() {
    const { searchResults } = elements;
    if (searchResults) {
        searchResults.style.display = 'none';
        searchResults.innerHTML = '';
    }
}

export function clearLocationSearch() {
    const { locationSearch, searchResults, coordinatesDisplay } = elements;
    
    if (locationSearch) locationSearch.value = '';
    clearSearchResults();
    if (coordinatesDisplay) coordinatesDisplay.style.display = 'none';
    
    const latInput = document.getElementById('latitude');
    const lngInput = document.getElementById('longitude');
    if (latInput) latInput.value = '';
    if (lngInput) lngInput.value = '';
    
    setSelectedLocation(null);
}

// Add styles for search functionality
const style = document.createElement('style');
style.textContent = `
    .search-result-item {
        padding: 0.75rem;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .search-result-item:hover,
    .search-result-item.active {
        background-color: var(--primary-light);
    }

    .search-result-item .result-name {
        font-weight: 500;
        margin-bottom: 0.25rem;
    }

    .search-result-item .result-type {
        font-size: 0.8rem;
        color: var(--text-color);
        opacity: 0.8;
    }

    .search-result-item.loading,
    .search-result-item.error {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: default;
    }

    .search-result-item.error {
        color: var(--error-color);
    }

    .loading-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid var(--primary-color);
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
