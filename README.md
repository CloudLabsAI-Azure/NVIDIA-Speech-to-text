# NVIDIA Riva Speech-to-Text Web Application

A real-time speech-to-text web application using NVIDIA Riva ASR (Automatic Speech Recognition) with both microphone recording and audio file upload capabilities.

## Project Overview

This application provides a modern web interface for transcribing speech to text using NVIDIA's Riva ASR service. It features:
- Real-time microphone recording
- Audio file upload support
- VS Code-inspired dark theme interface
- Session-based chat history
- Local audio file storage
- Responsive design

## Prerequisites

### Hardware Requirements
- NVIDIA GPU (Minimum 8GB VRAM recommended)
- CUDA-compatible graphics driver
- At least 16GB system RAM
- 50GB free disk space

### Software Requirements
- Docker
- NVIDIA Container Toolkit
- NVIDIA GPU Driver
- Python 3.8+
- Flask
- Modern web browser (Chrome, Firefox, or Edge recommended)

## Installation & Setup

### 1. NVIDIA Container Toolkit Setup
```bash
# Add user to docker group
sudo gpasswd -a $USER docker

# Apply changes (logout/login required)
newgrp docker
```

### 2. NVIDIA GPU Container Setup
Ensure NVIDIA Container Toolkit is installed:
```bash
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list

sudo apt-get update
sudo apt-get install -y nvidia-docker2
sudo systemctl restart docker
```

### 3. NGC API Key Setup
```bash
# Set your NGC API Key
export NGC_API_KEY="your-ngc-api-key"

# Add to shell configuration
# For bash
echo "export NGC_API_KEY=your-ngc-api-key" >> ~/.bashrc

# For zsh
echo "export NGC_API_KEY=your-ngc-api-key" >> ~/.zshrc

# Login to NGC container registry
echo "$NGC_API_KEY" | docker login nvcr.io --username '$oauthtoken' --password-stdin
```

### 4. Run NVIDIA Riva ASR Container
```bash
# Set model selector
export NIM_TAGS_SELECTOR="name=parakeet-1-1b-ctc-riva-en-us,mode=all"

# Run the container
docker run -it --rm --name=riva-asr \
   --runtime=nvidia \
   --gpus '"device=0"' \
   --shm-size=8GB \
   -e NGC_API_KEY \
   -e NIM_HTTP_API_PORT=9000 \
   -e NIM_GRPC_API_PORT=50051 \
   -p 9000:9000 \
   -p 50051:50051 \
   -e NIM_TAGS_SELECTOR \
   nvcr.io/nim/nvidia/riva-asr:1.3.0
```

### 5. Application Setup
```bash
# Clone the repository
git clone [repository-url]
cd [repository-name]

# Install Python dependencies
pip install -r requirements.txt

# Start the Flask application
python app.py
```

## Running the Application

1. Ensure the NVIDIA Riva ASR container is running
2. Start the Flask application:
   ```bash
   python app.py
   ```
3. Open your web browser and navigate to:
   ```
   http://127.0.0.1:5000
   ```

## Usage

1. **Microphone Recording**:
   - Click the microphone icon to start recording
   - Click again to stop recording
   - Click the send button to transcribe

2. **File Upload**:
   - Click the paperclip icon to select an audio file
   - Click the send button to transcribe

3. **Transcription Results**:
   - Results appear in the text area below
   - Audio recordings are saved in the chat history
   - Transcriptions are displayed in real-time

## Project Structure
```
.
├── app.py                 # Flask application
├── static/
│   ├── index.html        # Main web interface
│   └── uploads/          # Temporary audio storage
├── requirements.txt      # Python dependencies
└── README.md            # Project documentation
```

## Troubleshooting

1. **GPU Issues**:
   - Verify GPU is detected: `nvidia-smi`
   - Check Docker GPU access: `docker run --gpus all nvidia/cuda:11.0-base nvidia-smi`

2. **Audio Issues**:
   - Ensure microphone permissions are granted
   - Check browser console for errors
   - Verify audio file format is supported

3. **Container Issues**:
   - Verify NGC API key is set correctly
   - Check container logs: `docker logs riva-asr`
   - Ensure ports 9000 and 50051 are available

## Support

For issues and questions:
- Check NVIDIA Riva documentation
- Submit issues on the project repository
- Consult NVIDIA Developer Forums

## License

This project is licensed under the MIT License - see the LICENSE file for details.