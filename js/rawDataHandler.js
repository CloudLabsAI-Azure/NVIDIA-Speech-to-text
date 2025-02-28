class RawDataHandler {
    constructor() {
        this.showRawData = localStorage.getItem('showRawData') === 'true' || false;
        this.rawDataContainers = {};
        this.init();
    }

    init() {
        // Apply initial state
        this.updateRawDataVisibility();
        
        // Add event listener to any existing toggle buttons
        document.querySelectorAll('.raw-toggle').forEach(button => {
            button.addEventListener('click', (e) => {
                this.toggleRawData(e.target.closest('.message-container').dataset.messageId);
            });
        });
    }

    // Store raw data for a specific message
    storeRawData(messageId, data) {
        const messageContainer = document.querySelector(`.message-container[data-message-id="${messageId}"]`);
        
        if (!messageContainer) return;
        
        // Create raw data container if it doesn't exist
        if (!messageContainer.querySelector('.raw-data')) {
            const rawContainer = document.createElement('div');
            rawContainer.className = 'raw-data';
            rawContainer.textContent = JSON.stringify(data, null, 2);
            messageContainer.appendChild(rawContainer);
        }
        
        // Add toggle button if it doesn't exist
        if (!messageContainer.querySelector('.raw-toggle')) {
            const toggleButton = document.createElement('button');
            toggleButton.className = 'raw-toggle';
            toggleButton.innerHTML = '<i class="fas fa-lightbulb"></i> Raw Data';
            toggleButton.addEventListener('click', () => {
                this.toggleRawData(messageId);
            });
            
            // Insert after the message content
            const messageContent = messageContainer.querySelector('.message-content');
            messageContent.parentNode.insertBefore(toggleButton, messageContent.nextSibling);
        }
        
        this.updateRawDataVisibility();
    }

    // Toggle raw data visibility for specific message
    toggleRawData(messageId) {
        const messageContainer = document.querySelector(`.message-container[data-message-id="${messageId}"]`);
        if (!messageContainer) return;
        
        const rawData = messageContainer.querySelector('.raw-data');
        if (!rawData) return;
        
        const isVisible = rawData.style.display === 'block';
        rawData.style.display = isVisible ? 'none' : 'block';
    }
    
    // Toggle global raw data preference
    toggleGlobalRawData() {
        this.showRawData = !this.showRawData;
        localStorage.setItem('showRawData', this.showRawData);
        this.updateRawDataVisibility();
        return this.showRawData;
    }

    // Update visibility based on global preference
    updateRawDataVisibility() {
        document.querySelectorAll('.raw-data').forEach(container => {
            if (this.showRawData) {
                container.style.display = 'block';
            }
        });
    }
}

// Initialize raw data handler
const rawDataHandler = new RawDataHandler();
