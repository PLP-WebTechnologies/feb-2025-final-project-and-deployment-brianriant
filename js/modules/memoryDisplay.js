import { elements } from './domElements.js';
import { setMapView } from './mapMarkers.js';

// Create Memory Card HTML
function createMemoryCard(memory) {
    const formattedDate = new Date(memory.date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const tags = memory.tags?.map(tag => `<span class="memory-tag">${tag}</span>`).join('') || '';
    
    return `
        <div class="memory-card" data-memory-id="${memory.id}" data-lat="${memory.coordinates.lat}" data-lng="${memory.coordinates.lng}">
            <div class="memory-image">
                <img src="${memory.photo}" alt="Memory from ${memory.location}" loading="lazy">
            </div>
            <div class="memory-info">
                <div class="memory-header">
                    <h3 class="memory-location">${memory.location}</h3>
                    <span class="privacy-badge">${memory.privacy}</span>
                </div>
                <span class="memory-date">${formattedDate}</span>
                <p class="memory-text">${memory.text}</p>
                ${tags ? `<div class="memory-tags">${tags}</div>` : ''}
            </div>
        </div>
    `;
}

// Display All Memories in Panel
export function displayMemories(memories = []) {
    const { memoryPanel } = elements;
    if (!memoryPanel) return;

    if (memories.length === 0) {
        memoryPanel.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📍</div>
                <h3>No Memories Yet</h3>
                <p>Click anywhere on the map to add your first memory!</p>
            </div>
        `;
        return;
    }

    const memoriesHTML = memories.map(memory => createMemoryCard(memory)).join('');
    memoryPanel.innerHTML = memoriesHTML;

    // Add click handlers for memory cards
    const cards = memoryPanel.querySelectorAll('.memory-card');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const lat = parseFloat(card.dataset.lat);
            const lng = parseFloat(card.dataset.lng);
            if (!isNaN(lat) && !isNaN(lng)) {
                setMapView(lat, lng);
                cards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
            }
        });

        // Add hover effect to highlight corresponding marker
        card.addEventListener('mouseenter', () => {
            const markerId = card.dataset.memoryId;
            const marker = document.querySelector(`.marker-pin[data-memory-id="${markerId}"]`);
            if (marker) marker.classList.add('highlighted');
        });

        card.addEventListener('mouseleave', () => {
            const markerId = card.dataset.memoryId;
            const marker = document.querySelector(`.marker-pin[data-memory-id="${markerId}"]`);
            if (marker) marker.classList.remove('highlighted');
        });
    });
}

// Add highlight animation class
const style = document.createElement('style');
style.textContent = `
    .memory-card {
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .memory-card:hover {
        transform: translateY(-3px);
    }

    .memory-card.active {
        border: 2px solid var(--primary-color);
    }

    .memory-card.highlighted {
        animation: highlight 2s ease;
    }

    @keyframes highlight {
        0%, 100% { background: var(--background-color); }
        50% { background: var(--primary-light); }
    }

    .empty-state {
        text-align: center;
        padding: 2rem;
        color: var(--text-color);
    }

    .empty-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
        opacity: 0.5;
    }
`;
document.head.appendChild(style);
