// Function to format date in a more readable way
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Function to create a single memory card
function createMemoryCard(memory) {
    const card = document.createElement('div');
    card.className = 'memory-card';
    card.dataset.memoryId = memory.id;
    card.dataset.lat = memory.coordinates.lat;
    card.dataset.lng = memory.coordinates.lng;

    // Create image container if photo exists
    const imageHtml = memory.photo ? `
        <div class="memory-image">
            <img src="${memory.photo}" alt="Memory from ${memory.location}" loading="lazy">
        </div>
    ` : '';

    // Create tags if they exist
    const tagsHtml = memory.tags?.length ? `
        <div class="memory-tags">
            ${memory.tags.map(tag => `<span class="memory-tag">${tag}</span>`).join('')}
        </div>
    ` : '';

    card.innerHTML = `
        ${imageHtml}
        <div class="memory-info">
            <div class="memory-header">
                <h3 class="memory-location">${memory.location}</h3>
                <span class="privacy-badge">${memory.privacy}</span>
            </div>
            <span class="memory-date">${formatDate(memory.date)}</span>
            <p class="memory-text">${memory.text}</p>
            ${tagsHtml}
        </div>
    `;

    return card;
}

// Function to create empty state when no memories exist
function createEmptyState() {
    return `
        <div class="empty-state">
            <div class="empty-icon">📍</div>
            <h3>No Memories Yet</h3>
            <p>Start by adding your first memory!</p>
        </div>
    `;
}

// Main function to load and display memories
export function displayMemoryPanel() {
    const memoryPanel = document.getElementById('memoryPanel');
    if (!memoryPanel) return;

    // Get memories from localStorage
    let memories = [];
    try {
        const storedMemories = localStorage.getItem('memories');
        memories = storedMemories ? JSON.parse(storedMemories) : [];
        // Sort memories by date (newest first)
        memories.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
        console.error('Error loading memories:', error);
        memories = [];
    }

    // Display empty state if no memories
    if (memories.length === 0) {
        memoryPanel.innerHTML = createEmptyState();
        return;
    }

    // Clear existing content
    memoryPanel.innerHTML = '';

    // Create and append memory cards
    memories.forEach(memory => {
        const card = createMemoryCard(memory);
        
        // Add click handler to center map on memory location
        card.addEventListener('click', () => {
            const { lat, lng } = card.dataset;
            if (window.setMapView && !isNaN(lat) && !isNaN(lng)) {
                window.setMapView(parseFloat(lat), parseFloat(lng));
                
                // Remove active class from all cards and add to clicked card
                document.querySelectorAll('.memory-card').forEach(c => 
                    c.classList.remove('active'));
                card.classList.add('active');
            }
        });

        // Add hover effects for marker highlighting
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

        memoryPanel.appendChild(card);
    });
}

// Function to filter memories by privacy setting
export function filterMemories(privacy = 'all') {
    const memories = JSON.parse(localStorage.getItem('memories') || '[]');
    const filtered = privacy === 'all' 
        ? memories 
        : memories.filter(memory => memory.privacy === privacy);
    
    const memoryPanel = document.getElementById('memoryPanel');
    if (!memoryPanel) return;

    memoryPanel.innerHTML = filtered.length 
        ? filtered.map(memory => createMemoryCard(memory).outerHTML).join('')
        : createEmptyState();
}

// Initialize memory panel with event listeners
export function initializeMemoryPanel() {
    // Display initial memories
    displayMemoryPanel();

    // Add privacy filter listener
    const privacyFilter = document.getElementById('privacyFilter');
    if (privacyFilter) {
        privacyFilter.addEventListener('change', (e) => {
            filterMemories(e.target.value);
        });
    }

    // Add style for animations and transitions
    const style = document.createElement('style');
    style.textContent = `
        .memory-card {
            cursor: pointer;
            transition: var(--transition-base);
            background: var(--white);
            border-radius: 16px;
            padding: 2rem;
            margin-bottom: 1rem;
            box-shadow: var(--shadow-md);
        }

        .memory-card:hover {
            transform: translateY(-5px);
            box-shadow: var(--shadow-lg);
        }

        .memory-card.active {
            border: 2px solid var(--primary-color);
        }

        .empty-state {
            text-align: center;
            padding: 4rem 2rem;
            color: var(--text-color);
        }

        .empty-icon {
            font-size: 3.5rem;
            margin-bottom: 1.5rem;
            color: var(--primary-color);
            opacity: 0.8;
        }

        .memory-image img {
            width: 100%;
            height: 200px;
            object-fit: cover;
            border-radius: 12px;
            margin-bottom: 1.5rem;
            box-shadow: var(--shadow-sm);
        }

        .memory-info {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .memory-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
        }

        .memory-location {
            font-weight: 600;
            color: var(--secondary-color);
            margin: 0;
            font-size: 1.2rem;
        }

        .memory-date {
            font-size: 0.95rem;
            color: var(--text-color);
            opacity: 0.8;
        }

        .memory-text {
            line-height: 1.8;
            margin: 0.5rem 0;
            color: var(--text-color);
            font-size: 1rem;
        }

        .memory-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 0.8rem;
            margin-top: 1rem;
        }

        .memory-tag {
            background: var(--background-color);
            color: var(--secondary-color);
            padding: 0.8rem 1.5rem;
            border-radius: 25px;
            font-size: 0.9rem;
            font-weight: 500;
            transition: var(--transition-base);
        }

        .memory-tag:hover {
            background: var(--primary-color);
            color: var(--white);
            transform: translateY(-2px);
        }

        .privacy-badge {
            background: var(--background-color);
            padding: 0.8rem 1.5rem;
            border-radius: 25px;
            font-size: 0.9rem;
            color: var(--secondary-color);
            font-weight: 500;
            transition: var(--transition-base);
        }

        .privacy-badge:hover {
            transform: translateY(-2px);
        }

        .memory-card.active {
            border: 2px solid var(--primary-color);
            box-shadow: var(--shadow-lg);
        }

        @media screen and (max-width: 768px) {
            .memory-card {
                padding: 1.5rem;
            }

            .memory-image img {
                height: 180px;
            }
        }
    `;
    document.head.appendChild(style);
}
