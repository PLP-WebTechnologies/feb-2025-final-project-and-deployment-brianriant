// DOM Elements
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const memoryForm = document.getElementById('memoryForm');
const imagePreview = document.getElementById('imagePreview');
const previewContainer = document.querySelector('.preview-container');
const memoryPanel = document.getElementById('memoryPanel');
const mapSvg = document.querySelector('.map-svg');
const privacyFilter = document.getElementById('privacyFilter');
const zoomInBtn = document.getElementById('zoomIn');
const zoomOutBtn = document.getElementById('zoomOut');
let currentZoom = 1;

// Mobile Menu Toggle
if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    // Close menu when clicking a link
    navLinks.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        }
    });
}

// Memory Storage
class MemoryStorage {
    constructor() {
        this.memories = JSON.parse(localStorage.getItem('memories')) || [];
    }

    addMemory(memory) {
        this.memories.push(memory);
        this.saveToLocalStorage();
        this.addPinToMap(memory);
    }

    getAllMemories(privacy = 'all') {
        if (privacy === 'all') return this.memories;
        return this.memories.filter(memory => memory.privacy === privacy);
    }

    saveToLocalStorage() {
        localStorage.setItem('memories', JSON.stringify(this.memories));
    }

    addPinToMap(memory) {
        if (!mapSvg) return;
        
        const pin = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        pin.setAttribute("class", `pin ${memory.privacy}`);
        pin.setAttribute("cx", memory.coordinates.x);
        pin.setAttribute("cy", memory.coordinates.y);
        pin.setAttribute("r", "5");
        pin.setAttribute("data-id", memory.id);
        mapSvg.appendChild(pin);
    }

    filterMemories(privacy) {
        const memories = this.getAllMemories(privacy);
        displayMemories(memories);
        updatePinsVisibility(privacy);
    }
}

const storage = new MemoryStorage();

// Map Interaction
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

// Form Validation and Submission
if (memoryForm) {
    // Initialize tags container
    const tagsContainer = document.querySelector('.tags-container');
    const tagsInput = document.getElementById('tags');
    let tags = [];

    // Handle tag input
    tagsInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const tag = tagsInput.value.trim();
            if (tag && !tags.includes(tag)) {
                tags.push(tag);
                updateTagsDisplay();
            }
            tagsInput.value = '';
        }
    });

    // Form submission
    memoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(memoryForm);
        const coordinates = JSON.parse(sessionStorage.getItem('pinLocation')) || {
            x: Math.random() * 1000,
            y: Math.random() * 500
        };

        const memory = {
            id: Date.now(),
            location: formData.get('location'),
            date: formData.get('date'),
            text: formData.get('memory'),
            photo: await getBase64(formData.get('photo')),
            privacy: formData.get('privacy'),
            tags: tags,
            coordinates
        };

        if (validateMemory(memory)) {
            storage.addMemory(memory);
            memoryForm.reset();
            previewContainer.style.display = 'none';
            sessionStorage.removeItem('pinLocation');
            window.location.href = 'map.html';
        }
    });

    // Image Preview
    const photoInput = document.getElementById('photo');
    photoInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                previewContainer.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });
}

// Memory Validation
function validateMemory(memory) {
    const errors = {
        location: !memory.location,
        date: !memory.date,
        photo: !memory.photo,
        text: !memory.text
    };

    Object.keys(errors).forEach(field => {
        const errorElement = document.getElementById(`${field}Error`);
        if (errorElement) {
            errorElement.style.display = errors[field] ? 'block' : 'none';
        }
    });

    return !Object.values(errors).some(error => error);
}

// Convert File to Base64
function getBase64(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            resolve(null);
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Map Functionality
if (document.querySelector('.map-svg')) {
    // Add click handlers to pins
    document.querySelectorAll('.pin').forEach(pin => {
        pin.addEventListener('click', () => {
            const memoryId = pin.dataset.id;
            displayMemory(memoryId);
        });
    });

    // Initial load of memories
    displayMemories();
}

// Display All Memories in Panel
function displayMemories(memories = storage.getAllMemories()) {
    if (!memoryPanel) return;

    const memoriesHTML = memories.map(memory => createMemoryCard(memory)).join('');
    
    memoryPanel.innerHTML = `
        <h2>My Memories</h2>
        ${memoriesHTML}
    `;
}

// Create Memory Card HTML
function createMemoryCard(memory) {
    const tags = memory.tags?.map(tag => `<span class="memory-tag">${tag}</span>`).join('') || '';
    return `
        <div class="memory-card">
            <img src="${memory.photo}" alt="Memory from ${memory.location}">
            <h3>${memory.location}</h3>
            <div class="memory-meta">
                <span class="memory-date">${new Date(memory.date).toLocaleDateString()}</span>
                <span class="memory-privacy">${memory.privacy}</span>
            </div>
            <p class="memory-text">${memory.text}</p>
            <div class="memory-tags">${tags}</div>
        </div>
    `;
}

// Display Single Memory in Panel
function displayMemory(memoryId) {
    const memory = storage.memories.find(m => m.id === parseInt(memoryId));
    if (memory && memoryPanel) {
        memoryPanel.innerHTML = `
            <button class="back-btn" onclick="displayMemories()">← Back to All Memories</button>
            ${createMemoryCard(memory)}
        `;
    }
}

// Update pins visibility based on privacy filter
function updatePinsVisibility(privacy) {
    const pins = document.querySelectorAll('.pin');
    pins.forEach(pin => {
        if (privacy === 'all') {
            pin.style.display = 'block';
        } else {
            pin.style.display = pin.classList.contains(privacy) ? 'block' : 'none';
        }
    });
}

// Helper function to update tags display
function updateTagsDisplay() {
    if (!tagsContainer) return;
    
    tagsContainer.innerHTML = tags.map(tag => `
        <span class="memory-tag">
            ${tag}
            <button onclick="removeTag('${tag}')">&times;</button>
        </span>
    `).join('');
}

// Helper function to remove a tag
function removeTag(tagToRemove) {
    tags = tags.filter(tag => tag !== tagToRemove);
    updateTagsDisplay();
}
