document.addEventListener('DOMContentLoaded', function() {
    // ...existing code...

    // Theme toggle functionality
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const newTheme = themeManager.toggleTheme();
            updateThemeIcon(newTheme);
        });
    }

    // Theme selector functionality
    const themeSelector = document.getElementById('theme-selector');
    if (themeSelector) {
        themeSelector.value = themeManager.currentTheme;
        themeSelector.addEventListener('change', function() {
            themeManager.applyTheme(this.value);
            updateThemeIcon(this.value);
        });
    }

    // Initialize theme icon
    updateThemeIcon(themeManager.currentTheme);

    // Raw data toggle functionality
    const rawDataToggle = document.getElementById('raw-data-toggle');
    if (rawDataToggle) {
        rawDataToggle.checked = rawDataHandler.showRawData;
        rawDataToggle.addEventListener('change', function() {
            rawDataHandler.toggleGlobalRawData();
        });
    }

    // ...existing code...

    // Update function to create message elements to include raw data support
    function createMessageElement(message, isUser) {
        // ...existing code...
        
        // Generate unique message ID if not exists
        const messageId = message.id || Date.now().toString();
        messageContainer.dataset.messageId = messageId;
        
        // ...existing code...
        
        // Store raw data for AI responses
        if (!isUser && message.rawData) {
            rawDataHandler.storeRawData(messageId, message.rawData);
        }
        
        // ...existing code...
    }

    // Update your sendMessage function to store raw data
    async function sendMessage(text) {
        // ...existing code...
        
        try {
            const response = await fetch('/api/chat', {
                // ...existing API call configuration...
            });
            
            const data = await response.json();
            
            // Store both processed response and raw data
            const aiMessage = {
                text: data.response, // or however you extract the processed text
                rawData: data, // store the entire response
                id: Date.now().toString()
            };
            
            // Display the message
            createMessageElement(aiMessage, false);
            
            // ...existing code...
        } catch (error) {
            // ...error handling...
        }
        
        // ...existing code...
    }

    // Helper function to update theme icon
    function updateThemeIcon(theme) {
        if (!themeToggle) return;
        
        const iconElement = themeToggle.querySelector('i');
        if (!iconElement) return;
        
        // Remove all existing classes
        iconElement.className = '';
        
        // Add appropriate icon class based on theme
        if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            iconElement.className = 'fas fa-sun';
        } else {
            iconElement.className = 'fas fa-moon';
        }
    }

    // Update send button functionality
    const sendButton = document.getElementById('send-button');
    const messageInput = document.getElementById('message-input');
    
    if (sendButton && messageInput) {
        sendButton.addEventListener('click', function() {
            if (messageInput.value.trim()) {
                sendMessage(messageInput.value.trim());
                messageInput.value = '';
            }
        });
    }

    // ...existing code...
});
