class MemoryStorage {
    constructor() {
        this.memories = [];
        this.load();
    }

    load() {
        try {
            const stored = localStorage.getItem('memories');
            if (stored) {
                this.memories = JSON.parse(stored);
                // Sort memories by date (newest first)
                this.memories.sort((a, b) => new Date(b.date) - new Date(a.date));
            }
        } catch (error) {
            console.error('Error loading memories:', error);
            this.memories = [];
        }
    }

    getAllMemories(privacy = 'all') {
        try {
            return privacy === 'all' 
                ? [...this.memories]  // Return a copy to prevent direct modification
                : this.memories.filter(m => m.privacy === privacy);
        } catch (error) {
            console.error('Error getting memories:', error);
            return [];
        }
    }

    validateMemory(memory) {
        const requiredFields = ['id', 'location', 'date', 'coordinates', 'privacy', 'text'];
        const missingFields = requiredFields.filter(field => !memory[field]);
        
        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        if (!memory.coordinates.lat || !memory.coordinates.lng) {
            throw new Error('Invalid coordinates');
        }

        if (!['public', 'private'].includes(memory.privacy)) {
            throw new Error('Invalid privacy setting');
        }

        if (memory.tags && !Array.isArray(memory.tags)) {
            throw new Error('Tags must be an array');
        }
    }

    addMemory(memory) {
        try {
            this.validateMemory(memory);
            
            // Ensure unique ID
            if (this.memories.some(m => m.id === memory.id)) {
                throw new Error('Memory ID already exists');
            }

            this.memories.unshift(memory); // Add to start of array (newest first)
            this.save();
            return true;
        } catch (error) {
            console.error('Error adding memory:', error);
            throw error; // Propagate error to caller
        }
    }

    deleteMemory(id) {
        try {
            const initialLength = this.memories.length;
            this.memories = this.memories.filter(m => m.id !== id);
            
            if (this.memories.length === initialLength) {
                throw new Error('Memory not found');
            }
            
            this.save();
            return true;
        } catch (error) {
            console.error('Error deleting memory:', error);
            throw error;
        }
    }

    updateMemory(id, updates) {
        try {
            const memoryIndex = this.memories.findIndex(m => m.id === id);
            if (memoryIndex === -1) {
                throw new Error('Memory not found');
            }

            const updatedMemory = { ...this.memories[memoryIndex], ...updates };
            this.validateMemory(updatedMemory);
            
            this.memories[memoryIndex] = updatedMemory;
            this.memories.sort((a, b) => new Date(b.date) - new Date(a.date));
            this.save();
            return true;
        } catch (error) {
            console.error('Error updating memory:', error);
            throw error;
        }
    }

    getMemoryById(id) {
        try {
            const memory = this.memories.find(m => m.id === id);
            if (!memory) {
                throw new Error('Memory not found');
            }
            return { ...memory }; // Return a copy to prevent direct modification
        } catch (error) {
            console.error('Error getting memory:', error);
            throw error;
        }
    }

    searchMemories(query) {
        try {
            query = query.toLowerCase().trim();
            return this.memories.filter(memory => 
                memory.location.toLowerCase().includes(query) ||
                memory.text.toLowerCase().includes(query) ||
                memory.tags?.some(tag => tag.toLowerCase().includes(query))
            );
        } catch (error) {
            console.error('Error searching memories:', error);
            return [];
        }
    }

    save() {
        try {
            localStorage.setItem('memories', JSON.stringify(this.memories));
            return true;
        } catch (error) {
            console.error('Error saving memories:', error);
            throw error;
        }
    }

    clear() {
        try {
            this.memories = [];
            localStorage.removeItem('memories');
            return true;
        } catch (error) {
            console.error('Error clearing memories:', error);
            throw error;
        }
    }

    exportMemories() {
        try {
            const dataStr = JSON.stringify(this.memories, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', `memories_${new Date().toISOString()}.json`);
            linkElement.click();
            
            return true;
        } catch (error) {
            console.error('Error exporting memories:', error);
            throw error;
        }
    }

    async importMemories(file) {
        try {
            const text = await file.text();
            const memories = JSON.parse(text);
            
            if (!Array.isArray(memories)) {
                throw new Error('Invalid memories format');
            }

            // Validate each memory
            memories.forEach(this.validateMemory);
            
            this.memories = memories;
            this.memories.sort((a, b) => new Date(b.date) - new Date(a.date));
            this.save();
            return true;
        } catch (error) {
            console.error('Error importing memories:', error);
            throw error;
        }
    }
}

export const storage = new MemoryStorage();
