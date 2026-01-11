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
            'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61,
            'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
            'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
            'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
            'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46,
            'G5': 783.99, 'A5': 880.00, 'B5': 987.77
        }
        
        # Chord definitions (notes in each chord)
        self.chord_notes = {
            'C': ['C4', 'E4', 'G4'],
            'Dm': ['D4', 'F4', 'A4'],
            'Em': ['E4', 'G4', 'B4'],
            'F': ['F4', 'A4', 'C5'],
            'G': ['G4', 'B4', 'D5'],
            'Am': ['A4', 'C5', 'E5'],
            'Bdim': ['B4', 'D5', 'F5'],
            'Cmaj7': ['C4', 'E4', 'G4', 'B4'],
            'Dm7': ['D4', 'F4', 'A4', 'C5'],
            'Em7': ['E4', 'G4', 'B4', 'D5'],
            'Fmaj7': ['F4', 'A4', 'C5', 'E5'],
            'G7': ['G4', 'B4', 'D5', 'F5'],
        }
    
    def generate_tone(self, frequency, duration=1.0, volume=0.3):
        """Generate a single tone using sine wave"""
        num_samples = int(self.sample_rate * duration)
        t = np.linspace(0, duration, num_samples, False)
        
        # Generate sine wave
        wave = np.sin(2 * np.pi * frequency * t)
        
        # Apply envelope (ADSR - simplified)
        envelope = self.create_envelope(num_samples)
        wave = wave * envelope * volume
        
        # Convert to 16-bit integers
        wave = (wave * 32767).astype(np.int16)
        
        # Make stereo
        stereo_wave = np.column_stack((wave, wave))
        
        return stereo_wave
    
    def create_envelope(self, num_samples):
        """Create an ADSR envelope for more natural sound"""
        attack = int(num_samples * 0.05)  # 5% attack
        decay = int(num_samples * 0.1)    # 10% decay
        sustain_level = 0.7
        release = int(num_samples * 0.3)  # 30% release
        
        envelope = np.ones(num_samples)
        
        # Attack
        if attack > 0:
            envelope[:attack] = np.linspace(0, 1, attack)
        
        # Decay
        if decay > 0:
            envelope[attack:attack+decay] = np.linspace(1, sustain_level, decay)
        
        # Sustain
        sustain_end = num_samples - release
        if sustain_end > attack + decay:
            envelope[attack+decay:sustain_end] = sustain_level
        
        # Release
        if release > 0:
            envelope[sustain_end:] = np.linspace(sustain_level, 0, release)
        
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
                wave = self.generate_tone(freq, duration, volume=0.2)
                chord_waves.append(wave)
        
        # Mix all notes together
        if chord_waves:
            mixed = np.sum(chord_waves, axis=0)
            # Normalize to prevent clipping
            max_val = np.max(np.abs(mixed))
            if max_val > 32767:
                mixed = mixed * (32767 / max_val)
            mixed = mixed.astype(np.int16)
        else:
            # Fallback to silence
            mixed = np.zeros((int(self.sample_rate * duration), 2), dtype=np.int16)
        
        # Convert to pygame Sound
        sound = pygame.sndarray.make_sound(mixed)
        return sound
    
    def generate_melody_note(self, note_name, duration=0.5):
        """Generate a single melody note"""
        if note_name not in self.note_frequencies:
            return None
        
        freq = self.note_frequencies[note_name]
        wave = self.generate_tone(freq, duration, volume=0.4)
        sound = pygame.sndarray.make_sound(wave)
        return sound
