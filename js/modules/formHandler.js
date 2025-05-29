import { elements } from './domElements.js';
import { storage } from './memoryStorage.js';

const MAX_IMAGE_SIZE = 1024 * 1024; // 1MB
const MAX_TAGS = 5;
let tags = [];
let selectedLocation = null;
let isSubmitting = false;

export function initializeForm() {
    const { memoryForm, photoInput, previewContainer, imagePreview, tagsInput, tagsContainer } = elements;

    if (!memoryForm) return;

    // Handle tag input
    tagsInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const tag = tagsInput.value.trim();
            if (tag && !tags.includes(tag) && tags.length < MAX_TAGS) {
                tags.push(tag);
                updateTagsDisplay();
            } else if (tags.length >= MAX_TAGS) {
                showError('tagsError', `Maximum ${MAX_TAGS} tags allowed`);
            }
            tagsInput.value = '';
        }
    });

    // Real-time validation
    memoryForm.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('input', () => {
            validateField(input);
        });

        input.addEventListener('blur', () => {
            validateField(input);
        });
    });

    // Image Preview with validation
    photoInput?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showError('photoError', 'Please select an image file');
            photoInput.value = '';
            return;
        }

        if (file.size > MAX_IMAGE_SIZE) {
            showError('photoError', 'Image size should be less than 1MB');
            photoInput.value = '';
            return;
        }

        try {
            const optimizedImage = await optimizeImage(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                previewContainer.style.display = 'block';
                hideError('photoError');
            };
            reader.readAsDataURL(optimizedImage);
        } catch (error) {
            showError('photoError', 'Error processing image');
            console.error('Image processing error:', error);
        }
    });

    // Form submission
    memoryForm.addEventListener('submit', handleFormSubmit);
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    const { memoryForm, previewContainer, submitBtn } = elements;
    
    // Validate all fields before submission
    const isValid = validateAllFields();
    if (!isValid) return;

    try {
        isSubmitting = true;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';

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
            },
            createdAt: new Date().toISOString()
        };

        const success = storage.addMemory(memory);
        
        if (success) {
            memoryForm.reset();
            previewContainer.style.display = 'none';
            tags = [];
            updateTagsDisplay();
            sessionStorage.removeItem('pinLocation');
            window.location.href = 'map.html';
        } else {
            throw new Error('Failed to save memory');
        }
    } catch (error) {
        console.error('Form submission error:', error);
        showError('submitError', 'Failed to save memory. Please try again.');
    } finally {
        isSubmitting = false;
        submitBtn.disabled = false;
        submitBtn.textContent = 'Pin This Memory';
    }
}

function validateAllFields() {
    const fields = ['location', 'date', 'photo', 'memory'];
    const errors = {
        location: !elements.locationSearch?.value || !selectedLocation,
        date: !document.getElementById('date')?.value,
        photo: !document.getElementById('photo')?.files[0],
        memory: !document.getElementById('memory')?.value?.trim()
    };

    let isValid = true;

    Object.keys(errors).forEach(field => {
        if (errors[field]) {
            showError(`${field}Error`, `Please provide a valid ${field}`);
            isValid = false;
        } else {
            hideError(`${field}Error`);
        }
    });

    return isValid;
}

function validateField(input) {
    const field = input.name || input.id;
    const value = input.value.trim();

    switch (field) {
        case 'location':
            if (!value || !selectedLocation) {
                showError('locationError', 'Please select a valid location');
                return false;
            }
            break;
        case 'date':
            if (!value) {
                showError('dateError', 'Please select a date');
                return false;
            }
            break;
        case 'memory':
            if (!value) {
                showError('memoryError', 'Please share your memory');
                return false;
            }
            break;
    }

    hideError(`${field}Error`);
    return true;
}

async function optimizeImage(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Calculate new dimensions while maintaining aspect ratio
            let width = img.width;
            let height = img.height;
            const maxDimension = 1200;

            if (width > height && width > maxDimension) {
                height = (height * maxDimension) / width;
                width = maxDimension;
            } else if (height > maxDimension) {
                width = (width * maxDimension) / height;
                height = maxDimension;
            }

            canvas.width = width;
            canvas.height = height;
            
            // Draw and compress image
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to blob
            canvas.toBlob(
                blob => resolve(new File([blob], file.name, { type: 'image/jpeg' })),
                'image/jpeg',
                0.8
            );
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

function getBase64(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            resolve(null);
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
    });
}

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

function hideError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

function updateTagsDisplay() {
    const { tagsContainer } = elements;
    if (!tagsContainer) return;
    
    tagsContainer.innerHTML = tags.map(tag => `
        <span class="memory-tag">
            ${tag}
            <button type="button" onclick="removeTag('${tag}')">&times;</button>
        </span>
    `).join('');
}

export function removeTag(tagToRemove) {
    tags = tags.filter(tag => tag !== tagToRemove);
    updateTagsDisplay();
    hideError('tagsError');
}

export function setSelectedLocation(location) {
    selectedLocation = location;
    if (location) {
        hideError('locationError');
    }
}
