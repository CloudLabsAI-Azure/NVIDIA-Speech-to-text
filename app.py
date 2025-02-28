from flask import Flask, request, jsonify, send_from_directory
import subprocess
import os
import threading
import time
import json
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from azure_ai import process_with_azure_ai
from flask_cors import CORS
import sounddevice as sd
import numpy as np
import wave
import io

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder='static')
CORS(app)  # Enable CORS for all routes
app.config['UPLOAD_FOLDER'] = 'uploads'

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def get_audio_devices():
    try:
        devices = sd.query_devices()
        input_devices = [d for d in devices if d['max_input_channels'] > 0]
        return input_devices
    except Exception as e:
        return str(e)

@app.route('/api/check-mic')
def check_microphone():
    try:
        devices = get_audio_devices()
        if devices:
            return jsonify({"status": "success", "devices": devices})
        return jsonify({"status": "error", "message": "No input devices found"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route('/api/record', methods=['POST'])
def record_audio():
    try:
        duration = request.json.get('duration', 5)  # Default 5 seconds
        fs = 44100  # Sample rate
        recording = sd.rec(int(duration * fs), samplerate=fs, channels=1)
        sd.wait()
        
        # Convert to WAV format
        byte_io = io.BytesIO()
        with wave.open(byte_io, 'wb') as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(fs)
            wf.writeframes((recording * 32767).astype(np.int16).tobytes())
        
        return jsonify({"status": "success", "message": "Recording completed"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

@app.route('/transcribe', methods=['POST'])
def transcribe():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    # Save the uploaded file in the UPLOAD_FOLDER directory
    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    # Schedule the file for deletion after 5 minutes (300 seconds)
    threading.Timer(300, os.remove, args=[filepath]).start()

    try:
        # Get server and language code from environment variables
        riva_server = os.getenv('RIVA_SERVER')
        if not riva_server:
            return jsonify({'error': 'RIVA_SERVER not configured in .env file'}), 500
            
        language_code = os.getenv('LANGUAGE_CODE', 'en-US')

        # Run the transcription script with explicit encoding parameters
        script_path = r"asr/transcribe_file.py"
        cmd = [
            'python',
            script_path,
            '--server', riva_server,
            '--language-code', language_code,
            '--input-file', filepath
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            return jsonify({'transcription': result.stdout.strip(), 'source': 'file'})
        else:
            return jsonify({'error': result.stderr.strip()}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/transcribe_mic', methods=['POST'])
def transcribe_mic():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    # Save the recorded file in the UPLOAD_FOLDER directory
    filename = secure_filename("recorded_audio.wav")  # Fixed filename for recorded audio
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    # Schedule the file for deletion after 5 minutes (300 seconds)
    threading.Timer(300, os.remove, args=[filepath]).start()

    try:
        # Get server and language code from environment variables
        riva_server = os.getenv('RIVA_SERVER')
        if not riva_server:
            return jsonify({'error': 'RIVA_SERVER not configured in .env file'}), 500
            
        language_code = os.getenv('LANGUAGE_CODE', 'en-US')
        
        # Get encoding configuration from request
        encoding_config = {}
        if request.form.get('encoding_config'):
            try:
                encoding_config = json.loads(request.form.get('encoding_config'))
            except json.JSONDecodeError:
                return jsonify({'error': 'Invalid encoding configuration format'}), 400
        
        # Run the transcription script with explicit encoding parameters
        script_path = r"asr/transcribe_file.py"
        cmd = [
            'python',
            script_path,
            '--server', riva_server,
            '--language-code', language_code,
            '--input-file', filepath
        ]
        
        # Add additional supported flags if specified in encoding_config
        if encoding_config.get('word_time_offsets', False):
            cmd.append('--word-time-offsets')
            
        if 'max_alternatives' in encoding_config:
            cmd.extend(['--max-alternatives', str(encoding_config['max_alternatives'])])
            
        if encoding_config.get('profanity_filter', False):
            cmd.append('--profanity-filter')
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            return jsonify({
                'transcription': result.stdout.strip(), 
                'source': 'mic',
                'encoding_config': encoding_config
            })
        else:
            return jsonify({'error': result.stderr.strip()}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/process_text', methods=['POST'])
def process_text():
    try:
        data = request.json
        if not data or 'text' not in data:
            return jsonify({'error': 'No text provided'}), 400
        
        text_to_process = data['text']
        
        # Process the text with Azure AI Foundry
        result = process_with_azure_ai(text_to_process)
        
        return jsonify({'result': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    
    ssl_context = None
    try:
        cert_path = os.path.join(os.path.dirname(__file__), 'cert.pem')
        key_path = os.path.join(os.path.dirname(__file__), 'key.pem')
        
        if os.path.exists(cert_path) and os.path.exists(key_path):
            ssl_context = (cert_path, key_path)
            print("SSL certificates found, running in HTTPS mode")
        else:
            print("SSL certificates not found, running in HTTP mode")
            print("To enable HTTPS, generate certificates using:")
            print("openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365")
    
        app.run(
            host='127.0.0.1',
            port=port, 
            debug=True,
            ssl_context=ssl_context
        )
    except Exception as e:
        print(f"Error starting server: {e}")
        print("Falling back to HTTP mode")
        app.run(host='127.0.0.1', port=port, debug=True)
