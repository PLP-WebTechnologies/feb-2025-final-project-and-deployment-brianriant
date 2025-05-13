import { elements } from './domElements.js';
import { storage } from './memoryStorage.js';

let currentZoom = 1;

export function initializeMapInteraction() {
    const { mapSvg, zoomInBtn, zoomOutBtn, privacyFilter } = elements;

    if (mapSvg) {
        // Initialize map interaction
        mapSvg.addEventListener('click', (e) => {
            if (e.target.classList.contains('continent')) {
                const rect = mapSvg.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const coordinates = {
                    x: (x / rect.width) * 1000,
                    y: (y / rect.height) * 500
                };
                sessionStorage.setItem('pinLocation', JSON.stringify(coordinates));
                window.location.href = 'add.html';
            }
        });

        // Zoom controls
        zoomInBtn?.addEventListener('click', () => {
            if (currentZoom < 2) {
                currentZoom += 0.2;
                mapSvg.style.transform = `scale(${currentZoom})`;
            }
        });

        zoomOutBtn?.addEventListener('click', () => {
            if (currentZoom > 0.5) {
                currentZoom -= 0.2;
                mapSvg.style.transform = `scale(${currentZoom})`;
            }
        });

        // Privacy filter
        privacyFilter?.addEventListener('change', (e) => {
            storage.filterMemories(e.target.value);
        });
    }
}

export function updatePinsVisibility(privacy) {
    const pins = document.querySelectorAll('.pin');
    pins.forEach(pin => {
        if (privacy === 'all') {
            pin.style.display = 'block';
        } else {
            pin.style.display = pin.classList.contains(privacy) ? 'block' : 'none';
        }
    });
}
