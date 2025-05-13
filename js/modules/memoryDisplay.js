import { elements } from './domElements.js';

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

// Display All Memories in Panel
export function displayMemories(memories) {
    const { memoryPanel } = elements;
    if (!memoryPanel) return;

    const memoriesHTML = memories.map(memory => createMemoryCard(memory)).join('');
    
    memoryPanel.innerHTML = `
        <h2>My Memories</h2>
        ${memoriesHTML}
    `;
}

// Display Single Memory in Panel
export function displayMemory(memoryId, memories) {
    const { memoryPanel } = elements;
    const memory = memories.find(m => m.id === parseInt(memoryId));
    
    if (memory && memoryPanel) {
        memoryPanel.innerHTML = `
            <button class="back-btn" onclick="displayMemories()">← Back to All Memories</button>
            ${createMemoryCard(memory)}
        `;
    }
}
