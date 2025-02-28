
document.addEventListener('DOMContentLoaded', function() {
    // Show audio preview when file is uploaded
    const uploadButton = document.querySelector('.uploadButton');
    if (uploadButton) {
        uploadButton.addEventListener('change', function() {
            const audioPreview = document.getElementById('audio-preview');
            if (audioPreview) {
                audioPreview.style.display = 'block';
            }
        });
    }
    
    // Handle loading indicator
    const submitButton = document.querySelector('#component-0 button');
    if (submitButton) {
        submitButton.addEventListener('click', function() {
            const loadingIndicator = document.querySelector('#loading-indicator .loading-indicator');
            if (loadingIndicator) {
                loadingIndicator.style.display = 'flex';
            }
        });
    }
    
    // Hide loading indicator when response is received
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                const loadingIndicator = document.querySelector('#loading-indicator .loading-indicator');
                if (loadingIndicator) {
                    loadingIndicator.style.display = 'none';
                }
            }
        });
    });
    
    const chatbot = document.getElementById('chatbot');
    if (chatbot) {
        observer.observe(chatbot, { childList: true, subtree: true });
    }
});
