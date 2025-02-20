from flask import Flask, request, jsonify, send_from_directory
import subprocess
import os
import threading
import time
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

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
        # Run the transcription script
        script_path = r"asr\transcribe_file.py"
        cmd = [
            'python',
            script_path,
            '--server', '4.155.11.186:50051',  # Added server parameter
            '--language-code', 'en-US',
            '--input-file', filepath
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            return jsonify({'transcription': result.stdout.strip()})
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
        # Run the transcription script for recorded audio files
        script_path = r"asr\transcribe_file.py"  # Fixed typo in path
        cmd = [
            'python',
            script_path,
            '--server', '4.155.11.186:50051',
            '--language-code', 'en-US',
            '--input-file', filepath
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            return jsonify({'transcription': result.stdout.strip()})
        else:
            return jsonify({'error': result.stderr.strip()}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
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
            host='127.0.0.1',  # Changed to localhost
            port=5000, 
            debug=True,
            ssl_context=ssl_context
        )
    except Exception as e:
        print(f"Error starting server: {e}")
        print("Falling back to HTTP mode")
        app.run(host='127.0.0.1', port=5000, debug=True)  # Changed to localhost
