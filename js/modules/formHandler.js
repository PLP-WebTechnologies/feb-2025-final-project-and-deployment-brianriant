import { elements } from './domElements.js';
import { storage } from './memoryStorage.js';

let tags = [];
let selectedLocation = null;

export function initializeForm() {
    const { memoryForm, photoInput, previewContainer, imagePreview, tagsInput, tagsContainer } = elements;

    if (!memoryForm) return;

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

    // Image Preview
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

    // Form submission
    memoryForm.addEventListener('submit', handleFormSubmit);
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const { memoryForm, previewContainer } = elements;
    const formData = new FormData(memoryForm);
    
    const memory = {
        id: Date.now(),
        location: formData.get('location'),
        date: formData.get('date'),
        text: formData.get('memory'),
        photo: await getBase64(formData.get('photo')),
        privacy: formData.get('privacy'),
        tags: tags,
        coordinates: {
            lat: parseFloat(document.getElementById('latitude').value),
            lng: parseFloat(document.getElementById('longitude').value)
        }
    };

    if (validateMemory(memory)) {
        storage.addMemory(memory);
        memoryForm.reset();
        previewContainer.style.display = 'none';
        sessionStorage.removeItem('pinLocation');
        window.location.href = 'map.html';
    }
}

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

    return !Object.values(errors).some(error => error) && selectedLocation !== null;
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

// Helper function to update tags display
function updateTagsDisplay() {
    const { tagsContainer } = elements;
    if (!tagsContainer) return;
    
    tagsContainer.innerHTML = tags.map(tag => `
        <span class="memory-tag">
            ${tag}
            <button onclick="removeTag('${tag}')">&times;</button>
        </span>
    `).join('');
}

// Helper function to remove a tag
export function removeTag(tagToRemove) {
    tags = tags.filter(tag => tag !== tagToRemove);
    updateTagsDisplay();
}

export function setSelectedLocation(location) {
    selectedLocation = location;
}
