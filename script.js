// DOM Elements
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const memoryForm = document.getElementById('memoryForm');
const imagePreview = document.getElementById('imagePreview');
const previewContainer = document.querySelector('.preview-container');
const memoryPanel = document.getElementById('memoryPanel');

// Mobile Menu Toggle
hamburger?.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});

// Memory Storage
class MemoryStorage {
    constructor() {
        this.memories = JSON.parse(localStorage.getItem('memories')) || [];
    }

    addMemory(memory) {
        this.memories.push(memory);
        this.saveToLocalStorage();
    }

    getAllMemories() {
        return this.memories;
    }

    saveToLocalStorage() {
        localStorage.setItem('memories', JSON.stringify(this.memories));
    }
}

const storage = new MemoryStorage();

// Form Validation and Submission
if (memoryForm) {
    memoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(memoryForm);
        const memory = {
            id: Date.now(),
            location: formData.get('location'),
            date: formData.get('date'),
            text: formData.get('memory'),
            photo: await getBase64(formData.get('photo'))
        };

        if (validateMemory(memory)) {
            storage.addMemory(memory);
            memoryForm.reset();
            previewContainer.style.display = 'none';
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
function displayMemories() {
    if (!memoryPanel) return;

    const memories = storage.getAllMemories();
    const memoriesHTML = memories.map(memory => createMemoryCard(memory)).join('');
    
    memoryPanel.innerHTML = `
        <h2>My Memories</h2>
        ${memoriesHTML}
    `;
}

// Create Memory Card HTML
function createMemoryCard(memory) {
    return `
        <div class="memory-card">
            <img src="${memory.photo}" alt="Memory from ${memory.location}">
            <h3>${memory.location}</h3>
            <div class="memory-date">${new Date(memory.date).toLocaleDateString()}</div>
            <p>${memory.text}</p>
        </div>
    `;
}

// Display Single Memory in Panel
function displayMemory(memoryId) {
    const memory = storage.memories.find(m => m.id === parseInt(memoryId));
    if (memory && memoryPanel) {
        memoryPanel.innerHTML = createMemoryCard(memory);
    }
}
