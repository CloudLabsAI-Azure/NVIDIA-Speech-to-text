let mediaRecorder;
let audioChunks = [];

document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startRecord');
    const stopButton = document.getElementById('stopRecord');
    
    startButton.addEventListener('click', startRecording);
    stopButton.addEventListener('click', stopRecording);
});

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = sendRecording;
        
        audioChunks = [];
        mediaRecorder.start();
        
        document.getElementById('startRecord').disabled = true;
        document.getElementById('stopRecord').disabled = false;
    } catch (err) {
        console.error('Error accessing microphone:', err);
        alert('Error accessing microphone. Please ensure you have granted permission.');
    }
}

function stopRecording() {
    mediaRecorder.stop();
    document.getElementById('startRecord').disabled = false;
    document.getElementById('stopRecord').disabled = true;
}

function sendRecording() {
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.wav');

    fetch('/transcribe_mic', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            document.getElementById('transcription').textContent = 'Error: ' + data.error;
        } else {
            document.getElementById('transcription').textContent = data.transcription;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('transcription').textContent = 'Error occurred during transcription';
    });
}

function uploadFile() {
    const fileInput = document.getElementById('audioFile');
    const file = fileInput.files[0];
    if (!file) {
        alert('Please select a file first');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    fetch('/transcribe', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            document.getElementById('transcription').textContent = 'Error: ' + data.error;
        } else {
            document.getElementById('transcription').textContent = data.transcription;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('transcription').textContent = 'Error occurred during transcription';
    });
}
