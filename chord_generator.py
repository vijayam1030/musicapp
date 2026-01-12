"""
Chord Generator - Creates audio for musical chords
"""

import numpy as np
import pygame

class ChordGenerator:
    """Generates chord sounds using sine wave synthesis"""
    
    def __init__(self, sample_rate=44100):
        self.sample_rate = sample_rate
        
        # Note frequencies (A4 = 440 Hz standard)
        self.note_frequencies = {
            'C2': 65.41, 'C#2': 69.30, 'Db2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'Eb2': 77.78,
            'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'Gb2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'Ab2': 103.83,
            'A2': 110.00, 'A#2': 116.54, 'Bb2': 116.54, 'B2': 123.47,
            'C3': 130.81, 'C#3': 138.59, 'Db3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'Eb3': 155.56,
            'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'Gb3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'Ab3': 207.65,
            'A3': 220.00, 'A#3': 233.08, 'Bb3': 233.08, 'B3': 246.94,
            'C4': 261.63, 'C#4': 277.18, 'Db4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'Eb4': 311.13,
            'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'Gb4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'Ab4': 415.30,
            'A4': 440.00, 'A#4': 466.16, 'Bb4': 466.16, 'B4': 493.88,
            'C5': 523.25, 'C#5': 554.37, 'Db5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'Eb5': 622.25,
            'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'Gb5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'Ab5': 830.61,
            'A5': 880.00, 'A#5': 932.33, 'Bb5': 932.33, 'B5': 987.77,
            'C6': 1046.50, 'C#6': 1108.73, 'Db6': 1108.73, 'D6': 1174.66, 'D#6': 1244.51, 'Eb6': 1244.51,
            'E6': 1318.51, 'F6': 1396.91, 'F#6': 1479.98, 'Gb6': 1479.98, 'G6': 1567.98, 'G#6': 1661.22, 'Ab6': 1661.22,
            'A6': 1760.00, 'A#6': 1864.66, 'Bb6': 1864.66, 'B6': 1975.53
        }
        
        # Chord definitions (notes in each chord)
        self.chord_notes = {
            # Major Chords
            'C': ['C4', 'E4', 'G4'], 'D': ['D4', 'F#4', 'A4'], 'E': ['E4', 'G#4', 'B4'],
            'F': ['F4', 'A4', 'C5'], 'G': ['G4', 'B4', 'D5'], 'A': ['A4', 'C#5', 'E5'], 'B': ['B4', 'D#5', 'F#5'],
            'Db': ['Db4', 'F4', 'Ab4'], 'Eb': ['Eb4', 'G4', 'Bb4'], 'Gb': ['Gb4', 'Bb4', 'Db5'],
            'Ab': ['Ab4', 'C5', 'Eb5'], 'Bb': ['Bb4', 'D5', 'F5'],
            
            # Minor Chords
            'Cm': ['C4', 'Eb4', 'G4'], 'Dm': ['D4', 'F4', 'A4'], 'Em': ['E4', 'G4', 'B4'],
            'Fm': ['F4', 'Ab4', 'C5'], 'Gm': ['G4', 'Bb4', 'D5'], 'Am': ['A4', 'C5', 'E5'], 'Bm': ['B4', 'D5', 'F#5'],
            'C#m': ['C#4', 'E4', 'G#4'], 'Ebm': ['Eb4', 'Gb4', 'Bb4'], 'F#m': ['F#4', 'A4', 'C#5'],
            'Abm': ['Ab4', 'B4', 'Eb5'], 'Bbm': ['Bb4', 'Db5', 'F5'],
            
            # Seventh Chords
            'C7': ['C4', 'E4', 'G4', 'Bb4'], 'D7': ['D4', 'F#4', 'A4', 'C5'], 'E7': ['E4', 'G#4', 'B4', 'D5'],
            'F7': ['F4', 'A4', 'C5', 'Eb5'], 'G7': ['G4', 'B4', 'D5', 'F5'], 'A7': ['A4', 'C#5', 'E5', 'G5'], 'B7': ['B4', 'D#5', 'F#5', 'A5'],
            
            # Major Seventh Chords
            'Cmaj7': ['C4', 'E4', 'G4', 'B4'], 'Dmaj7': ['D4', 'F#4', 'A4', 'C#5'], 'Emaj7': ['E4', 'G#4', 'B4', 'D#5'],
            'Fmaj7': ['F4', 'A4', 'C5', 'E5'], 'Gmaj7': ['G4', 'B4', 'D5', 'F#5'], 'Amaj7': ['A4', 'C#5', 'E5', 'G#5'],
            
            # Minor Seventh Chords
            'Cm7': ['C4', 'Eb4', 'G4', 'Bb4'], 'Dm7': ['D4', 'F4', 'A4', 'C5'], 'Em7': ['E4', 'G4', 'B4', 'D5'],
            'Fm7': ['F4', 'Ab4', 'C5', 'Eb5'], 'Gm7': ['G4', 'Bb4', 'D5', 'F5'], 'Am7': ['A4', 'C5', 'E5', 'G5'],
            
            # Diminished Chords
            'Cdim': ['C4', 'Eb4', 'Gb4'], 'Ddim': ['D4', 'F4', 'Ab4'], 'Edim': ['E4', 'G4', 'Bb4'],
            'Fdim': ['F4', 'Ab4', 'B4'], 'Gdim': ['G4', 'Bb4', 'Db5'], 'Adim': ['A4', 'C5', 'Eb5'], 'Bdim': ['B4', 'D5', 'F5'],
            
            # Augmented Chords
            'Caug': ['C4', 'E4', 'G#4'], 'Daug': ['D4', 'F#4', 'A#4'], 'Eaug': ['E4', 'G#4', 'B#4'],
            'Faug': ['F4', 'A4', 'C#5'], 'Gaug': ['G4', 'B4', 'D#5'], 'Aaug': ['A4', 'C#5', 'E#5'],
            
            # Sus Chords
            'Csus2': ['C4', 'D4', 'G4'], 'Csus4': ['C4', 'F4', 'G4'],
            'Dsus2': ['D4', 'E4', 'A4'], 'Dsus4': ['D4', 'G4', 'A4'],
            'Esus2': ['E4', 'F#4', 'B4'], 'Esus4': ['E4', 'A4', 'B4'],
            'Fsus2': ['F4', 'G4', 'C5'], 'Fsus4': ['F4', 'Bb4', 'C5'],
            'Gsus2': ['G4', 'A4', 'D5'], 'Gsus4': ['G4', 'C5', 'D5'],
            'Asus2': ['A4', 'B4', 'E5'], 'Asus4': ['A4', 'D5', 'E5'],
            
            # Single Notes (for melodies)
            'C3n': ['C3'], 'D3n': ['D3'], 'E3n': ['E3'], 'F3n': ['F3'], 'G3n': ['G3'], 'A3n': ['A3'], 'B3n': ['B3'],
            'C4n': ['C4'], 'D4n': ['D4'], 'E4n': ['E4'], 'F4n': ['F4'], 'G4n': ['G4'], 'A4n': ['A4'], 'B4n': ['B4'],
            'C5n': ['C5'], 'D5n': ['D5'], 'E5n': ['E5'], 'F5n': ['F5'], 'G5n': ['G5'], 'A5n': ['A5'], 'B5n': ['B5'],
        }
    
    def generate_tone(self, frequency, duration=1.0, volume=0.3):
        """Generate a single tone with harmonics for richer sound"""
        num_samples = int(self.sample_rate * duration)
        t = np.linspace(0, duration, num_samples, False)
        
        # Generate fundamental frequency with harmonics for piano-like sound
        wave = np.sin(2 * np.pi * frequency * t)  # Fundamental
        wave += 0.5 * np.sin(2 * np.pi * frequency * 2 * t)  # 2nd harmonic
        wave += 0.3 * np.sin(2 * np.pi * frequency * 3 * t)  # 3rd harmonic
        wave += 0.15 * np.sin(2 * np.pi * frequency * 4 * t)  # 4th harmonic
        wave += 0.08 * np.sin(2 * np.pi * frequency * 5 * t)  # 5th harmonic
        
        # Normalize
        wave = wave / 2.03
        
        # Apply envelope (ADSR - simplified)
        envelope = self.create_envelope(num_samples)
        wave = wave * envelope * volume
        
        # Add subtle vibrato for warmth
        vibrato_freq = 5.0  # 5 Hz vibrato
        vibrato_depth = 0.003  # Very subtle
        vibrato = 1 + vibrato_depth * np.sin(2 * np.pi * vibrato_freq * t)
        wave = wave * vibrato
        
        # Convert to 16-bit integers
        wave = (wave * 32767).astype(np.int16)
        
        # Make stereo with slight stereo widening
        left = wave
        right = wave
        stereo_wave = np.column_stack((left, right))
        
        return stereo_wave
    
    def create_envelope(self, num_samples):
        """Create an ADSR envelope for more natural sound"""
        attack = int(num_samples * 0.01)  # 1% quick attack
        decay = int(num_samples * 0.15)   # 15% decay
        sustain_level = 0.6
        release = int(num_samples * 0.4)  # 40% smooth release
        
        envelope = np.ones(num_samples)
        
        # Attack - exponential curve for natural sound
        if attack > 0:
            envelope[:attack] = np.power(np.linspace(0, 1, attack), 0.5)
        
        # Decay
        if decay > 0:
            envelope[attack:attack+decay] = np.linspace(1, sustain_level, decay)
        
        # Sustain
        sustain_end = num_samples - release
        if sustain_end > attack + decay:
            envelope[attack+decay:sustain_end] = sustain_level
        
        # Release - exponential curve
        if release > 0:
            envelope[sustain_end:] = sustain_level * np.power(np.linspace(1, 0, release), 2)
        
        return envelope
    
    def generate_chord(self, chord_name, duration=0.8):
        """Generate a chord sound by combining multiple notes"""
        if chord_name not in self.chord_notes:
            # Default to C major if chord not found
            chord_name = 'C'
        
        notes = self.chord_notes[chord_name]
        
        # Generate each note in the chord
        chord_waves = []
        for note in notes:
            if note in self.note_frequencies:
                freq = self.note_frequencies[note]
                wave = self.generate_tone(freq, duration, volume=0.25)
                chord_waves.append(wave)
        
        # Mix all notes together
        if chord_waves:
            mixed = np.sum(chord_waves, axis=0)
            
            # Add simple reverb effect
            mixed = self.add_reverb(mixed)
            
            # Normalize to prevent clipping with headroom
            max_val = np.max(np.abs(mixed))
            if max_val > 0:
                mixed = mixed * (28000 / max_val)  # Leave headroom
            mixed = mixed.astype(np.int16)
        else:
            # Fallback to silence
            mixed = np.zeros((int(self.sample_rate * duration), 2), dtype=np.int16)
        
        # Convert to pygame Sound
        sound = pygame.sndarray.make_sound(mixed)
        return sound
    
    def add_reverb(self, audio, wet=0.15):
        """Add simple reverb effect for depth"""
        delay_samples = int(0.05 * self.sample_rate)  # 50ms delay
        reverb = np.zeros_like(audio, dtype=np.float32)
        reverb[:] = audio
        
        # Add delayed copies with decay
        if len(audio) > delay_samples:
            reverb[delay_samples:] += audio[:-delay_samples] * 0.3
        
        delay2 = int(0.08 * self.sample_rate)  # 80ms delay
        if len(audio) > delay2:
            reverb[delay2:] += audio[:-delay2] * 0.15
        
        # Mix dry and wet signals
        output = audio * (1 - wet) + reverb * wet
        return output
    
    def generate_melody_note(self, note_name, duration=0.5):
        """Generate a single melody note"""
        if note_name not in self.note_frequencies:
            return None
        
        freq = self.note_frequencies[note_name]
        wave = self.generate_tone(freq, duration, volume=0.4)
        sound = pygame.sndarray.make_sound(wave)
        return sound
