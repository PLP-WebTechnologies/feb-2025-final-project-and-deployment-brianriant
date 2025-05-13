import { elements } from './domElements.js';
import { storage } from './memoryStorage.js';

let map;
const mapMarkers = new Map();

export function initializeMap() {
    const { map: mapElement } = elements;
    
    if (!mapElement) return;

    // Initialize map
    map = L.map('map').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
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

    return map;
}

export function addMarkerToMap(memory) {
    if (!map || !memory.coordinates) return;

    const marker = L.marker([memory.coordinates.lat, memory.coordinates.lng], {
        icon: L.divIcon({
            className: `custom-marker ${memory.privacy}`,
            html: '',
            iconSize: [12, 12]
        })
    });

    const popupContent = `
        <div class="popup-content">
            <img src="${memory.photo}" alt="Memory from ${memory.location}" class="popup-image">
            <div class="popup-title">${memory.location}</div>
            <div class="popup-meta">
                <span>${new Date(memory.date).toLocaleDateString()}</span>
                <span>${memory.privacy}</span>
            </div>
            <p>${memory.text}</p>
            ${memory.tags ? `
                <div class="memory-tags">
                    ${memory.tags.map(tag => `<span class="memory-tag">${tag}</span>`).join('')}
                </div>
            ` : ''}
        </div>
    `;

    marker.bindPopup(popupContent);
    marker.addTo(map);
    mapMarkers.set(memory.id, marker);
}

export function filterMapMarkers(privacy) {
    mapMarkers.forEach((marker, memoryId) => {
        const memory = storage.memories.find(m => m.id === memoryId);
        if (privacy === 'all' || memory.privacy === privacy) {
            marker.addTo(map);
        } else {
            marker.remove();
        }
    });
}

export function setMapView(lat, lng, zoom = 13) {
    if (map) {
        map.setView([lat, lng], zoom);
    }
}

export function getMap() {
    return map;
}
