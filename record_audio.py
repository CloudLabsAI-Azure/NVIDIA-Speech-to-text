import sounddevice as sd
from scipy.io.wavfile import write
import wavio as wv

# Sampling frequency
freq = 44100

# Recording duration (in seconds)
duration = 30

# Start recorder with the given values of duration and sample frequency
print("Recording...")
recording = sd.rec(int(duration * freq), samplerate=freq, channels=2)

# Record audio for the given number of seconds
sd.wait()
print("Recording complete")

# Save the recording using scipy
write("output_scipy.wav", freq, recording)

# Save the recording using wavio
wv.write("output_wavio.wav", recording, freq, sampwidth=2)

print("Audio saved as 'output_scipy.wav' and 'output_wavio.wav'")
