import { elements } from './domElements.js';
import { storage } from './memoryStorage.js';
import { displayMemories } from './memoryDisplay.js';

let map;
const mapMarkers = new Map();

const createCustomMarkerIcon = (privacy) => {
    return L.divIcon({
        className: `custom-marker ${privacy}`,
        html: `<div class="marker-pin ${privacy}"></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    });
};

export function initializeMap() {
    const { map: mapElement } = elements;
    
    if (!mapElement) return null;

    try {
        // Initialize map with improved defaults
        map = L.map('map', {
            center: [0, 0],
            zoom: 2,
            minZoom: 2,
            maxZoom: 18,
            zoomControl: true,
            scrollWheelZoom: true
        });

        // Add tile layer with error handling
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(map);

        // Add click handler for adding memories
        map.on('click', (e) => {
            const { lat, lng } = e.latlng;
            sessionStorage.setItem('pinLocation', JSON.stringify({ lat, lng }));
            window.location.href = 'add.html';
        });

        // Load existing memories
        const memories = storage.getAllMemories();
        memories.forEach(memory => addMarkerToMap(memory));

        // Add custom CSS for markers
        const style = document.createElement('style');
        style.textContent = `
            .custom-marker {
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .marker-pin {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 3px solid var(--white);
                box-shadow: var(--shadow-sm);
                transition: transform 0.2s;
            }
            .marker-pin.public {
                background: var(--primary-color);
            }
            .marker-pin.private {
                background: var(--secondary-color);
            }
            .marker-pin:hover {
                transform: scale(1.2);
            }
        `;
        document.head.appendChild(style);

        return map;
    } catch (error) {
        console.error('Error initializing map:', error);
        return null;
    }
}

export function addMarkerToMap(memory) {
    if (!map || !memory?.coordinates) return;

    try {
        const marker = L.marker([memory.coordinates.lat, memory.coordinates.lng], {
            icon: createCustomMarkerIcon(memory.privacy)
        });

        const formattedDate = new Date(memory.date).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const popupContent = `
            <div class="popup-content">
                <img src="${memory.photo}" alt="Memory from ${memory.location}" class="popup-image">
                <div class="popup-info">
                    <div class="popup-title">${memory.location}</div>
                    <div class="popup-meta">
                        <span>${formattedDate}</span>
                        <span class="privacy-badge">${memory.privacy}</span>
                    </div>
                    <p class="memory-text">${memory.text}</p>
                    ${memory.tags?.length ? `
                        <div class="memory-tags">
                            ${memory.tags.map(tag => `<span class="memory-tag">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        marker.bindPopup(popupContent, {
            maxWidth: 300,
            className: 'memory-popup'
        });

        marker.addTo(map);
        mapMarkers.set(memory.id, marker);

        // Add click handler to focus the memory in the panel
        marker.on('click', () => {
            const memoryElement = document.querySelector(`[data-memory-id="${memory.id}"]`);
            if (memoryElement) {
                memoryElement.scrollIntoView({ behavior: 'smooth' });
                memoryElement.classList.add('highlighted');
                setTimeout(() => memoryElement.classList.remove('highlighted'), 2000);
            }
        });
    } catch (error) {
        console.error('Error adding marker:', error);
    }
}

export function filterMapMarkers(privacy = 'all') {
    try {
        mapMarkers.forEach((marker, memoryId) => {
            const memory = storage.memories.find(m => m.id === memoryId);
            if (!memory) {
                marker.remove();
                mapMarkers.delete(memoryId);
                return;
            }

            if (privacy === 'all' || memory.privacy === privacy) {
                marker.addTo(map);
            } else {
                marker.remove();
            }
        });

        // Update memory panel
        const memories = storage.getAllMemories(privacy);
        displayMemories(memories);
    } catch (error) {
        console.error('Error filtering markers:', error);
    }
}

export function setMapView(lat, lng, zoom = 13) {
    if (!map) return;
    
    try {
        map.setView([lat, lng], zoom, {
            animate: true,
            duration: 1
        });
    } catch (error) {
        console.error('Error setting map view:', error);
    }
}

export function getMap() {
    return map;
}
