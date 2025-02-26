// Chat application main logic

let mediaRecorder;
let audioChunks = [];
let currentAudioBlob = null;
let recordingStartTime = null;
let inputMode = 'text'; // 'text', 'mic', or 'file'

// DOM elements
const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const recordButton = document.getElementById('recordButton');
const fileInput = document.getElementById('fileInput');
const sendButton = document.getElementById('sendButton');
const statusMessage = document.getElementById('statusMessage');
const recordingStatus = document.getElementById('recordingStatus');
const typingIndicator = document.getElementById('typingIndicator');

// Enable send button when input changes
userInput.addEventListener('input', () => {
    sendButton.disabled = userInput.value.trim() === '';
    inputMode = 'text';
});

// Record button functionality
recordButton.addEventListener('click', async function() {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        await startRecording();
    } else {
        stopRecording();
    }
});

// File input handling
fileInput.addEventListener('change', function(e) {
    if (this.files.length > 0) {
        const file = this.files[0];
        currentAudioBlob = file;
        inputMode = 'file';
        addMessage(`Selected file: ${file.name}`, true, 'file-selected');
        sendButton.disabled = false;
        statusMessage.textContent = `File selected: ${file.name}`;
    }
});

// Send button functionality
sendButton.addEventListener('click', function() {
    if (inputMode === 'text') {
        sendTextMessage();
    } else if (inputMode === 'mic' && currentAudioBlob) {
        sendRecording();
    } else if (inputMode === 'file' && currentAudioBlob) {
        sendAudioFile();
    } else {
        setStatus('No content to send', 'error');
    }
});

// Handle Enter key to send message
userInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sendButton.disabled) {
            sendButton.click();
        }
    }
});

// Function to add a message to the chat
function addMessage(message, isUser, className = '') {
    const messageRow = document.createElement('div');
    messageRow.className = 'message-row';
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'} ${className}`;
    
    // Handle different message types
    if (message instanceof Blob) {
        // For audio blobs
        const audio = document.createElement('audio');
        audio.controls = true;
        audio.src = URL.createObjectURL(message);
        messageDiv.appendChild(audio);
    } else {
        // For text messages - preserve formatting
        if (typeof message === 'string') {
            // Replace line breaks with <br> tags
            const formattedText = message.replace(/\n/g, '<br>');
            messageDiv.innerHTML = formattedText;
        } else {
            messageDiv.textContent = message;
        }
    }
    
    messageRow.appendChild(messageDiv);
    chatContainer.appendChild(messageRow);
    scrollToBottom();
}

// Scroll chat to bottom
function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Set status message
function setStatus(message, type = 'info') {
    statusMessage.textContent = message;
    if (type === 'error') {
        statusMessage.style.color = '#e74c3c';
    } else if (type === 'success') {
        statusMessage.style.color = '#2ecc71';
    } else {
        statusMessage.style.color = 'inherit';
    }
}

// Show typing indicator
function showTyping() {
    typingIndicator.style.display = 'block';
    scrollToBottom();
}

// Hide typing indicator
function hideTyping() {
    typingIndicator.style.display = 'none';
}

// Start recording from microphone
async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                channelCount: 1,
                sampleRate: 44100,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            } 
        });
        
        mediaRecorder = new MediaRecorder(stream, {
            audioBitsPerSecond: 128000
        });
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const recordedBlob = new Blob(audioChunks, { type: 'audio/wav' });
            currentAudioBlob = recordedBlob;
            inputMode = 'mic';
            
            // Update UI
            addMessage(recordedBlob, true);
            sendButton.disabled = false;
            
            const duration = Math.round((Date.now() - recordingStartTime) / 1000);
            setStatus(`Recording stopped (${duration}s)`, 'info');
        };

        mediaRecorder.start();
        recordingStartTime = Date.now();
        recordButton.classList.add('recording');
        recordButton.querySelector('i').className = 'fas fa-stop';
        
        // Start recording timer
        updateRecordingTimer();
        
        setStatus('Recording...', 'info');
    } catch (err) {
        setStatus(`Error accessing microphone: ${err.message}`, 'error');
    }
}

// Update recording timer
function updateRecordingTimer() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        const duration = Math.round((Date.now() - recordingStartTime) / 1000);
        recordingStatus.textContent = `Recording: ${duration}s`;
        setTimeout(updateRecordingTimer, 1000);
    }
}

// Stop recording
function stopRecording() {
    if (mediaRecorder) {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        recordButton.classList.remove('recording');
        recordButton.querySelector('i').className = 'fas fa-microphone';
        recordingStatus.textContent = '';
    }
}

// Send text message
function sendTextMessage() {
    const text = userInput.value.trim();
    if (!text) return;
    
    addMessage(text, true);
    setStatus('Sending message...', 'info');
    userInput.value = '';
    sendButton.disabled = true;
    
    // Process text with Azure AI
    showTyping();
    
    fetch('/process_text', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text })
    })
    .then(response => response.json())
    .then(data => {
        hideTyping();
        if (data.error) {
            let errorMessage = data.error;
            if (data.details && typeof data.details === 'object') {
                errorMessage += ":\n" + JSON.stringify(data.details, null, 2);
            } else if (data.details) {
                errorMessage += ":\n" + data.details;
            }
            addMessage(`Error: ${errorMessage}`, false);
            setStatus(`Error: ${data.error}`, 'error');
        } else {
            let resultText = '';
            
            if (typeof data.result === 'object') {
                // Try to extract the answer from the response object
                if (data.result.answer) {
                    resultText = data.result.answer;
                } else {
                    resultText = JSON.stringify(data.result, null, 2);
                }
            } else {
                resultText = data.result;
            }
            
            addMessage(resultText, false);
            setStatus('Response received', 'success');
        }
    })
    .catch(error => {
        hideTyping();
        addMessage(`Error: Could not process your request`, false);
        setStatus(`Error: ${error.message}`, 'error');
    });
}

// Send recorded audio
function sendRecording() {
    if (!currentAudioBlob) {
        setStatus('No recording available', 'error');
        return;
    }
    
    setStatus('Processing recording...', 'info');
    sendButton.disabled = true;
    showTyping();
    
    const formData = new FormData();
    formData.append('file', currentAudioBlob, 'recording.wav');

    fetch('/transcribe_mic', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            hideTyping();
            addMessage(`Error: ${data.error}`, false);
            setStatus(`Error: ${data.error}`, 'error');
        } else {
            // Display transcription
            addMessage(data.transcription, false);
            
            // Fill the input field with the transcription
            userInput.value = data.transcription;
            inputMode = 'text';
            sendButton.disabled = false;
            
            hideTyping();
            setStatus('Transcription completed. You can edit and send the text.', 'success');
        }
    })
    .catch(error => {
        hideTyping();
        addMessage(`Error: Could not process your recording`, false);
        setStatus(`Error: ${error.message}`, 'error');
    })
    .finally(() => {
        currentAudioBlob = null;
    });
}

// Send audio file
function sendAudioFile() {
    if (!currentAudioBlob) {
        setStatus('No file available', 'error');
        return;
    }
    
    setStatus('Processing audio file...', 'info');
    sendButton.disabled = true;
    showTyping();
    
    const formData = new FormData();
    formData.append('file', currentAudioBlob, currentAudioBlob.name);

    fetch('/transcribe', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            hideTyping();
            addMessage(`Error: ${data.error}`, false);
            setStatus(`Error: ${data.error}`, 'error');
        } else {
            // Display transcription
            addMessage(data.transcription, false);
            
            // Fill the input field with the transcription
            userInput.value = data.transcription;
            inputMode = 'text';
            sendButton.disabled = false;
            
            hideTyping();
            setStatus('Transcription completed. You can edit and send the text.', 'success');
        }
    })
    .catch(error => {
        hideTyping();
        addMessage(`Error: Could not process your audio file`, false);
        setStatus(`Error: ${error.message}`, 'error');
    })
    .finally(() => {
        // Reset file input
        fileInput.value = '';
        currentAudioBlob = null;
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setStatus('Ready');
    scrollToBottom();
});