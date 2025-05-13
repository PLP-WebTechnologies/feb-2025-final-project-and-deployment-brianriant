import { elements } from './domElements.js';
import { setSelectedLocation } from './formHandler.js';

export function initializeLocationSearch() {
    const { 
        searchLocationBtn, 
        locationInput, 
        searchResults, 
        coordinatesDisplay, 
        coordinatesText,
        editLocationBtn,
        searchInput,
        searchBtn,
        map
    } = elements;

    // Location search for add memory page
    searchLocationBtn?.addEventListener('click', () => {
        searchLocation(locationInput.value);
    });

    locationInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchLocation(locationInput.value);
        }
    });

    editLocationBtn?.addEventListener('click', () => {
        locationInput.disabled = false;
        coordinatesDisplay.style.display = 'none';
        searchLocationBtn.style.display = 'block';
        setSelectedLocation(null);
    });

    // Map page search
    searchBtn?.addEventListener('click', () => {
        if (searchInput) {
            searchLocation(searchInput.value);
        }
    });

    searchInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchLocation(searchInput.value);
        }
    });
}

export async function searchLocation(query) {
    const { searchResults, map } = elements;

    try {
        if (!query.trim()) {
            alert('Please enter a location to search');
            return;
        }

        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.length > 0) {
            if (map) {
                // If we're on the map page
                const { lat, lon } = data[0];
                map.setView([lat, lon], 13);
            } else {
                // If we're on the add memory page
                displaySearchResults(data);
            }
        } else {
            if (searchResults) {
                searchResults.innerHTML = '<div class="search-result-item">No locations found</div>';
                searchResults.style.display = 'block';
            } else {
                alert('Location not found');
            }
        }
    } catch (error) {
        console.error('Error searching location:', error);
        if (searchResults) {
            searchResults.innerHTML = '<div class="search-result-item">Error searching location</div>';
            searchResults.style.display = 'block';
        } else {
            alert('Error searching location');
        }
    }
}

export function handleLocationSelect(location) {
    const { 
        locationInput, 
        coordinatesText, 
        coordinatesDisplay, 
        searchResults, 
        searchLocationBtn 
    } = elements;

    setSelectedLocation(location);
    locationInput.value = location.display_name;
    document.getElementById('latitude').value = location.lat;
    document.getElementById('longitude').value = location.lon;
    
    coordinatesText.textContent = `Selected: ${location.display_name}`;
    coordinatesDisplay.style.display = 'flex';
    searchResults.style.display = 'none';
    locationInput.disabled = true;
    searchLocationBtn.style.display = 'none';
}

function displaySearchResults(results) {
    const { searchResults } = elements;
    if (!searchResults) return;

    if (results.length === 0) {
        searchResults.innerHTML = '<div class="search-result-item">No results found</div>';
        searchResults.style.display = 'block';
        return;
    }

    searchResults.innerHTML = results.map(result => `
        <div class="search-result-item" onclick="handleLocationSelect(${JSON.stringify(result).replace(/"/g, '&quot;')})">
            ${result.display_name}
        </div>
    `).join('');
    
    searchResults.style.display = 'block';
}
