// Add toggle functionality for encoding options
document.getElementById('toggleEncodingOptions').addEventListener('click', function() {
  const encodingOptions = document.getElementById('encodingOptions');
  const isHidden = encodingOptions.style.display === 'none';
  
  encodingOptions.style.display = isHidden ? 'block' : 'none';
  this.textContent = isHidden ? 'Hide Encoding Options' : 'Show Encoding Options';
});

// Function to submit recorded audio with supported encoding configuration
function submitRecordedAudio(audioBlob) {
  // Create form data to send the file
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.wav');
  
  // Add encoding configuration with supported parameters
  const encodingConfig = {
    enable_automatic_punctuation: true,
    word_time_offsets: false,
    max_alternatives: 1,
    profanity_filter: false
  };
  formData.append('encoding_config', JSON.stringify(encodingConfig));
  
  // Submit the form data to the server
  fetch('/transcribe_mic', {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    // Process response
    if (data.error) {
      showError(data.error);
    } else {
      displayTranscription(data.transcription);
    }
  })
  .catch(error => {
    console.error('Error:', error);
    showError('An error occurred during transcription.');
  });
}
