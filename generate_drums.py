import wave
import math
import struct
import random

def generate_kick(filename):
    sample_rate = 44100
    duration = 0.5 # seconds
    freq_start = 150.0
    freq_end = 50.0
    decay = 5.0
    
    n_samples = int(sample_rate * duration)
    with wave.open(filename, 'w') as obj:
        obj.setnchannels(1)
        obj.setsampwidth(2)
        obj.setframerate(sample_rate)
        
        for i in range(n_samples):
            t = i / sample_rate
            # Frequency sweep
            freq = freq_start * math.exp(-decay * t)
            # Amplitude envelope
            amp = math.exp(-10 * t)
            value = 32767 * amp * math.sin(2 * math.pi * freq * t)
            data = struct.pack('<h', int(max(min(value, 32767), -32768)))
            obj.writeframesraw(data)

def generate_snare(filename):
    sample_rate = 44100
    duration = 0.2
    n_samples = int(sample_rate * duration)
    
    with wave.open(filename, 'w') as obj:
        obj.setnchannels(1)
        obj.setsampwidth(2)
        obj.setframerate(sample_rate)
        
        for i in range(n_samples):
            t = i / sample_rate
            # Noise
            noise = (random.random() * 2 - 1) * math.exp(-15 * t)
            # Tonal body
            tone = math.sin(2 * math.pi * 180 * t) * math.exp(-20 * t)
            
            value = 32767 * (0.7 * noise + 0.3 * tone)
            data = struct.pack('<h', int(max(min(value, 32767), -32768)))
            obj.writeframesraw(data)

def generate_hat(filename):
    sample_rate = 44100
    duration = 0.05
    n_samples = int(sample_rate * duration)
    
    with wave.open(filename, 'w') as obj:
        obj.setnchannels(1)
        obj.setsampwidth(2)
        obj.setframerate(sample_rate)
        
        for i in range(n_samples):
            t = i / sample_rate
            # High pass noise essentially
            # Metal tone approximation (high non-harmonic sines)
            metal = 0
            for f in [8000, 5400, 11000]:
                metal += math.sin(2*math.pi*f*t) 
            
            noise = (random.random() * 2 - 1) 
            amp = math.exp(-100 * t) # Quick decay
            
            value = 32767 * amp * (0.5 * noise + 0.5 * metal/3)
            data = struct.pack('<h', int(max(min(value, 32767), -32768)))
            obj.writeframesraw(data)

if __name__ == "__main__":
    generate_kick("plugins/Drummer/assets/kick.wav")
    generate_snare("plugins/Drummer/assets/snare.wav")
    generate_hat("plugins/Drummer/assets/hat.wav")
    print("Drums generated")
