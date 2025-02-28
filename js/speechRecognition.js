class SpeechRecognitionHandler {
    constructor() {
        this.recognition = null;
        this.isRecording = false;
        this.transcript = '';
        this.micButton = document.getElementById('mic-button');
        this.messageInput = document.getElementById('message-input');
        
        this.initSpeechRecognition();
        this.bindEvents();
    }
    
    initSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.error('Speech recognition not supported in this browser');
            if (this.micButton) {
                this.micButton.style.display = 'none';
            }
            return;
        }
        
        // Initialize speech recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        
        // Set up event handlers
        this.recognition.onstart = () => {
            this.isRecording = true;
            this.updateMicButtonState();
        };
        
        this.recognition.onend = () => {
            this.isRecording = false;
            this.updateMicButtonState();
        };
        
        this.recognition.onresult = (event) => {
            this.handleRecognitionResult(event);
        };
        
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            this.isRecording = false;
            this.updateMicButtonState();
        };
    }
    
    bindEvents() {
        if (this.micButton) {
            this.micButton.addEventListener('click', () => {
                this.toggleRecording();
            });
        }
    }
    
    toggleRecording() {
        if (!this.recognition) {
            this.initSpeechRecognition();
            if (!this.recognition) return;
        }
        
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }
    
    startRecording() {
        try {
            this.recognition.start();
        } catch (error) {
            console.error('Failed to start recording:', error);
        }
    }
    
    stopRecording() {
        try {
            this.recognition.stop();
        } catch (error) {
            console.error('Failed to stop recording:', error);
        }
    }
    
    handleRecognitionResult(event) {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        
        if (finalTranscript !== '') {
            this.appendToInput(finalTranscript);
        }
        
        // For debugging
        console.log('Final transcript:', finalTranscript);
        console.log('Interim transcript:', interimTranscript);
    }
    
    appendToInput(text) {
        if (this.messageInput) {
            this.messageInput.value += (this.messageInput.value ? ' ' : '') + text;
        }
    }
    
    updateMicButtonState() {
        if (this.micButton) {
            if (this.isRecording) {
                this.micButton.classList.add('recording');
                this.micButton.querySelector('i').className = 'fas fa-stop';
            } else {
                this.micButton.classList.remove('recording');
                this.micButton.querySelector('i').className = 'fas fa-microphone';
            }
        }
    }
}

// Initialize speech recognition when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const speechHandler = new SpeechRecognitionHandler();
});
