"""
Chord Generator - Creates high-quality audio for musical chords
"""

import numpy as np
import pygame
from scipy import signal

class ChordGenerator:
    """Generates high-quality chord sounds using advanced synthesis"""
    
    def __init__(self, sample_rate=48000):  # Higher sample rate for better quality
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
            'Bb7': ['Bb4', 'D5', 'F5', 'Ab5'], 'Eb7': ['Eb4', 'G4', 'Bb4', 'Db5'], 'Ab7': ['Ab4', 'C5', 'Eb5', 'Gb5'],
            
            # Major Seventh Chords
            'Cmaj7': ['C4', 'E4', 'G4', 'B4'], 'Dmaj7': ['D4', 'F#4', 'A4', 'C#5'], 'Emaj7': ['E4', 'G#4', 'B4', 'D#5'],
            'Fmaj7': ['F4', 'A4', 'C5', 'E5'], 'Gmaj7': ['G4', 'B4', 'D5', 'F#5'], 'Amaj7': ['A4', 'C#5', 'E5', 'G#5'],
            'Bmaj7': ['B4', 'D#5', 'F#5', 'A#5'],
            
            # Minor Seventh Chords
            'Cm7': ['C4', 'Eb4', 'G4', 'Bb4'], 'Dm7': ['D4', 'F4', 'A4', 'C5'], 'Em7': ['E4', 'G4', 'B4', 'D5'],
            'Fm7': ['F4', 'Ab4', 'C5', 'Eb5'], 'Gm7': ['G4', 'Bb4', 'D5', 'F5'], 'Am7': ['A4', 'C5', 'E5', 'G5'],
            'Bm7': ['B4', 'D5', 'F#5', 'A5'],
            
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
            
            # 9th Chords (dominant 9th)
            'C9': ['C4', 'E4', 'G4', 'Bb4', 'D5'], 'D9': ['D4', 'F#4', 'A4', 'C5', 'E5'], 
            'E9': ['E4', 'G#4', 'B4', 'D5', 'F#5'], 'F9': ['F4', 'A4', 'C5', 'Eb5', 'G5'], 
            'G9': ['G4', 'B4', 'D5', 'F5', 'A5'], 'A9': ['A4', 'C#5', 'E5', 'G5', 'B5'],
            
            # Minor 9th Chords
            'Cm9': ['C4', 'Eb4', 'G4', 'Bb4', 'D5'], 'Dm9': ['D4', 'F4', 'A4', 'C5', 'E5'],
            'Em9': ['E4', 'G4', 'B4', 'D5', 'F#5'], 'Am9': ['A4', 'C5', 'E5', 'G5', 'B5'],
            
            # 6th Chords
            'C6': ['C4', 'E4', 'G4', 'A4'], 'D6': ['D4', 'F#4', 'A4', 'B4'], 
            'E6': ['E4', 'G#4', 'B4', 'C#5'], 'F6': ['F4', 'A4', 'C5', 'D5'],
            'G6': ['G4', 'B4', 'D5', 'E5'], 'A6': ['A4', 'C#5', 'E5', 'F#5'],
            
            # Minor 6th Chords
            'Cm6': ['C4', 'Eb4', 'G4', 'A4'], 'Dm6': ['D4', 'F4', 'A4', 'B4'],
            'Em6': ['E4', 'G4', 'B4', 'C#5'], 'Am6': ['A4', 'C5', 'E5', 'F#5'],
            
            # Add9 Chords (major triad + 9th)
            'Cadd9': ['C4', 'E4', 'G4', 'D5'], 'Dadd9': ['D4', 'F#4', 'A4', 'E5'],
            'Eadd9': ['E4', 'G#4', 'B4', 'F#5'], 'Fadd9': ['F4', 'A4', 'C5', 'G5'],
            'Gadd9': ['G4', 'B4', 'D5', 'A5'], 'Aadd9': ['A4', 'C#5', 'E5', 'B5'],
            
            # Power Chords (root + 5th, common in guitar/rock)
            'C5': ['C3', 'G3', 'C4'], 'D5': ['D3', 'A3', 'D4'], 'E5': ['E3', 'B3', 'E4'],
            'F5': ['F3', 'C4', 'F4'], 'G5': ['G3', 'D4', 'G4'], 'A5': ['A3', 'E4', 'A4'], 
            'B5': ['B3', 'F#4', 'B4'],
            
            # Single Notes (for melodies)
            'C3n': ['C3'], 'D3n': ['D3'], 'E3n': ['E3'], 'F3n': ['F3'], 'G3n': ['G3'], 'A3n': ['A3'], 'B3n': ['B3'],
            'C4n': ['C4'], 'D4n': ['D4'], 'E4n': ['E4'], 'F4n': ['F4'], 'G4n': ['G4'], 'A4n': ['A4'], 'B4n': ['B4'],
            'C5n': ['C5'], 'D5n': ['D5'], 'E5n': ['E5'], 'F5n': ['F5'], 'G5n': ['G5'], 'A5n': ['A5'], 'B5n': ['B5'],
        }
        
        # Current instrument
        self.current_instrument = 'Piano'
    
    def set_instrument(self, instrument_name):
        """Set the current instrument"""
        self.current_instrument = instrument_name
    
    def generate_tone(self, frequency, duration=1.0, volume=0.3, instrument='Piano'):
        """Generate a high-quality tone with advanced synthesis"""
        num_samples = int(self.sample_rate * duration)
        t = np.linspace(0, duration, num_samples, False)
        
        # Anti-aliasing: band-limit harmonics to prevent aliasing
        nyquist = self.sample_rate / 2
        max_harmonic = int(nyquist / frequency) - 1
        
        # Generate wave based on instrument type with high-quality synthesis
        if instrument == 'Piano':
            # Piano with inharmonicity and complex decay
            wave = np.zeros(num_samples)
            harmonics = [1.0, 0.6, 0.4, 0.3, 0.2, 0.15, 0.1, 0.08, 0.05]
            for i, amp in enumerate(harmonics[:min(len(harmonics), max_harmonic)]):
                h = i + 1
                # Add slight inharmonicity for realistic piano sound
                inharm = 1 + 0.0001 * h * h
                decay = np.exp(-3 * h * t / duration)  # Different decay per harmonic
                wave += amp * np.sin(2 * np.pi * frequency * h * inharm * t) * decay
            wave = wave / 2.5
            
        elif instrument == 'Guitar':
            # High-quality guitar with realistic pluck and body resonance
            wave = np.zeros(num_samples)
            harmonics = [1.0, 0.5, 0.35, 0.2, 0.12, 0.08, 0.05]
            for i, amp in enumerate(harmonics[:min(len(harmonics), max_harmonic)]):
                h = i + 1
                # Exponential decay per harmonic (higher harmonics decay faster)
                decay = np.exp(-2.5 * h * t / duration)
                phase = np.random.uniform(0, 0.1)  # Slight random phase for realism
                wave += amp * np.sin(2 * np.pi * frequency * h * t + phase) * decay
            # Add body resonance
            resonance = 0.02 * np.sin(2 * np.pi * 100 * t) * np.exp(-8 * t / duration)
            wave = (wave + resonance) / 1.9
            
        elif instrument == 'Strings':
            # Smooth orchestral strings with rich overtones
            wave = np.zeros(num_samples)
            harmonics = [1.0, 0.7, 0.5, 0.35, 0.25, 0.18, 0.12, 0.08, 0.05]
            for i, amp in enumerate(harmonics[:min(len(harmonics), max_harmonic)]):
                h = i + 1
                wave += amp * np.sin(2 * np.pi * frequency * h * t)
            # Enhanced vibrato for warmth
            vibrato_freq = 5.5 + 0.5 * np.sin(2 * np.pi * 0.2 * t)  # Variable vibrato
            vibrato = 1 + 0.008 * np.sin(2 * np.pi * vibrato_freq * t)
            wave = wave * vibrato / 3.0
            
        elif instrument == 'Organ':
            # Hammond-style organ with drawbar harmonics
            wave = np.zeros(num_samples)
            drawbars = [0.8, 1.0, 0.6, 0.5, 0.4, 0.3, 0.25, 0.2, 0.15]  # Drawbar settings
            drawbar_harmonics = [0.5, 1, 1.5, 2, 3, 4, 5, 6, 8]  # Sub-octave to high harmonics
            for amp, h in zip(drawbars[:min(len(drawbars), max_harmonic)], drawbar_harmonics):
                wave += amp * np.sin(2 * np.pi * frequency * h * t)
            # Add slight Leslie effect (rotary speaker)
            tremolo = 1 + 0.03 * np.sin(2 * np.pi * 6 * t)
            wave = wave * tremolo / 3.5
            
        elif instrument == 'Synth':
            # Analog synthesizer with PWM and filter
            # Create pulse width modulation
            pwm = 0.5 + 0.3 * np.sin(2 * np.pi * 0.5 * t)
            wave = signal.square(2 * np.pi * frequency * t, duty=pwm)
            # Add harmonics
            wave += 0.4 * np.sin(2 * np.pi * frequency * 2 * t)
            wave += 0.25 * np.sin(2 * np.pi * frequency * 3 * t)
            # Low-pass filter sweep
            cutoff_sweep = 0.3 + 0.7 * np.exp(-4 * t / duration)
            wave = wave * cutoff_sweep / 2.0
            
        elif instrument == 'Bass':
            # Electric bass with strong fundamental and sub-bass
            wave = np.zeros(num_samples)
            harmonics = [1.2, 0.9, 0.5, 0.3, 0.15, 0.08]  # Emphasis on low
            for i, amp in enumerate(harmonics[:min(len(harmonics), max_harmonic)]):
                h = i + 1
                wave += amp * np.sin(2 * np.pi * frequency * h * t)
            # Add subtle attack click for pick sound
            click = 0.1 * np.exp(-50 * t) * np.random.normal(0, 1, num_samples)
            wave = (wave + click) / 2.6
            
        elif instrument == 'Flute':
            # Flute - airy with filtered noise for breath
            wave = np.zeros(num_samples)
            harmonics = [1.0, 0.35, 0.18, 0.1, 0.05]
            for i, amp in enumerate(harmonics[:min(len(harmonics), max_harmonic)]):
                h = i + 1
                wave += amp * np.sin(2 * np.pi * frequency * h * t)
            # Enhanced vibrato
            vibrato_depth = 0.01 * (1 + 0.3 * t / duration)  # Growing vibrato
            vibrato = 1 + vibrato_depth * np.sin(2 * np.pi * 5.5 * t)
            wave = wave * vibrato
            # Breath noise through band-pass filter
            noise = np.random.normal(0, 0.04, len(t))
            # Simple band-pass (frequency range for breath)
            breath = noise * np.sin(2 * np.pi * frequency * 0.5 * t) * 0.3
            wave = (wave + breath) / 1.7
            
        elif instrument == 'Saxophone':
            # Saxophone - reedy with odd/even harmonic balance
            wave = np.zeros(num_samples)
            # Odd and even harmonics for reed character
            harmonics = [1.0, 0.8, 0.6, 0.5, 0.35, 0.25, 0.18, 0.12]
            for i, amp in enumerate(harmonics[:min(len(harmonics), max_harmonic)]):
                h = i + 1
                # Odd harmonics slightly stronger (reed characteristic)
                if h % 2 == 1:
                    amp *= 1.15
                wave += amp * np.sin(2 * np.pi * frequency * h * t)
            # Expressive vibrato with depth variation
            vib_depth = 0.015 * (1 + 0.2 * np.sin(2 * np.pi * 0.3 * t))
            vibrato = 1 + vib_depth * np.sin(2 * np.pi * 6 * t)
            wave = wave * vibrato / 3.5
            
        elif instrument == 'Trumpet':
            # Trumpet - bright brass with strong upper harmonics
            wave = np.zeros(num_samples)
            harmonics = [1.0, 0.7, 0.6, 0.5, 0.4, 0.35, 0.3, 0.25, 0.2]
            for i, amp in enumerate(harmonics[:min(len(harmonics), max_harmonic)]):
                h = i + 1
                # Upper harmonics stronger for brightness
                if h > 3:
                    amp *= 1.1
                wave += amp * np.sin(2 * np.pi * frequency * h * t)
            # Sharp attack with overshoot
            attack = np.minimum(1.0, t * 80)
            overshoot = 1 + 0.2 * np.exp(-15 * t)
            wave = wave * attack * overshoot / 3.5
            
        elif instrument == 'Trombone':
            # Trombone - warm, mellow brass with slide
            wave = np.zeros(num_samples)
            harmonics = [1.0, 0.75, 0.55, 0.4, 0.28, 0.18, 0.12]
            for i, amp in enumerate(harmonics[:min(len(harmonics), max_harmonic)]):
                h = i + 1
                wave += amp * np.sin(2 * np.pi * frequency * h * t)
            # Portamento/slide effect at start
            slide_time = min(0.05, duration * 0.15)
            slide_mask = t < slide_time
            slide_bend = np.where(slide_mask, 
                                 1 - 0.05 * (1 - t / slide_time), 1)
            wave = wave * slide_bend / 3.0
            
        elif instrument == 'Violin':
            # Violin - rich harmonics with bow pressure simulation
            wave = np.zeros(num_samples)
            harmonics = [1.0, 0.7, 0.5, 0.4, 0.3, 0.22, 0.16, 0.12, 0.08]
            for i, amp in enumerate(harmonics[:min(len(harmonics), max_harmonic)]):
                h = i + 1
                # Add slight detuning for chorus effect
                detune = 1 + np.random.uniform(-0.001, 0.001)
                wave += amp * np.sin(2 * np.pi * frequency * h * detune * t)
            # Realistic vibrato with depth crescendo
            vib_depth = 0.012 * np.minimum(1.0, t * 3)  # Vibrato grows
            vib_rate = 6 + 0.5 * np.sin(2 * np.pi * 0.2 * t)  # Variable rate
            vibrato = 1 + vib_depth * np.sin(2 * np.pi * vib_rate * t)
            wave = wave * vibrato / 3.2
            
        elif instrument == 'Cello':
            # Cello - deep, resonant with body formants
            wave = np.zeros(num_samples)
            harmonics = [1.0, 0.8, 0.6, 0.45, 0.32, 0.22, 0.15, 0.1]
            for i, amp in enumerate(harmonics[:min(len(harmonics), max_harmonic)]):
                h = i + 1
                # Lower harmonics stronger for warmth
                if h <= 3:
                    amp *= 1.1
                wave += amp * np.sin(2 * np.pi * frequency * h * t)
            # Subtle vibrato (less than violin)
            vibrato = 1 + 0.009 * np.sin(2 * np.pi * 5.2 * t)
            wave = wave * vibrato
            # Body resonance (formant around 200-300Hz)
            resonance = 0.08 * np.sin(2 * np.pi * 250 * t) * np.exp(-3 * t / duration)
            wave = (wave + resonance) / 3.3
            
        else:
            # Default to piano
            wave = np.sin(2 * np.pi * frequency * t)
            wave += 0.5 * np.sin(2 * np.pi * frequency * 2 * t)
            wave += 0.3 * np.sin(2 * np.pi * frequency * 3 * t)
            wave = wave / 1.8
        
        # Apply envelope (ADSR - instrument specific)
        envelope = self.create_envelope(num_samples, instrument)
        wave = wave * envelope * volume
        
        # Add subtle reverb for depth (simple comb filter)
        wave = self.add_reverb(wave, duration)
        
        # Apply gentle low-pass filter to remove harsh high frequencies
        wave = self.apply_lowpass(wave)
        
        # Normalize to prevent clipping
        if np.max(np.abs(wave)) > 0:
            wave = wave / np.max(np.abs(wave)) * 0.9
        
        # Convert to 16-bit integers
        wave = (wave * 32767).astype(np.int16)
        
        # Make stereo with slight stereo widening
        left = wave
        right = wave
        stereo_wave = np.column_stack((left, right))
        
        return stereo_wave
    
    def add_reverb(self, wave, duration):
        """Add simple reverb using comb filtering"""
        # Short reverb for natural room sound
        delay_samples = int(self.sample_rate * 0.03)  # 30ms delay
        reverb = np.zeros_like(wave)
        
        if len(wave) > delay_samples:
            reverb[delay_samples:] = wave[:-delay_samples] * 0.15
            # Add second reflection
            delay2 = int(self.sample_rate * 0.047)
            if len(wave) > delay2:
                reverb[delay2:] += wave[:-delay2] * 0.08
        
        return wave + reverb
    
    def apply_lowpass(self, wave):
        """Apply gentle low-pass filter to smooth the sound"""
        # Simple moving average for smoothing
        window_size = 3
        kernel = np.ones(window_size) / window_size
        filtered = np.convolve(wave, kernel, mode='same')
        # Mix with original for subtle effect
        return 0.7 * wave + 0.3 * filtered
    
    def create_envelope(self, num_samples, instrument='Piano'):
        """Create an ADSR envelope for more natural sound based on instrument"""
        
        # Different envelope characteristics for each instrument
        if instrument == 'Piano':
            attack = int(num_samples * 0.01)
            decay = int(num_samples * 0.15)
            sustain_level = 0.6
            release = int(num_samples * 0.4)
        elif instrument == 'Guitar':
            attack = int(num_samples * 0.005)
            decay = int(num_samples * 0.1)
            sustain_level = 0.5
            release = int(num_samples * 0.5)
        elif instrument == 'Strings':
            attack = int(num_samples * 0.08)  # Slower attack
            decay = int(num_samples * 0.1)
            sustain_level = 0.8
            release = int(num_samples * 0.3)
        elif instrument == 'Organ':
            attack = int(num_samples * 0.02)
            decay = int(num_samples * 0.05)
            sustain_level = 0.9  # Strong sustain
            release = int(num_samples * 0.2)
        elif instrument == 'Synth':
            attack = int(num_samples * 0.02)
            decay = int(num_samples * 0.2)
            sustain_level = 0.7
            release = int(num_samples * 0.3)
        elif instrument == 'Bass':
            attack = int(num_samples * 0.005)
            decay = int(num_samples * 0.1)
            sustain_level = 0.7
            release = int(num_samples * 0.4)
        elif instrument == 'Flute':
            attack = int(num_samples * 0.03)  # Soft attack
            decay = int(num_samples * 0.08)
            sustain_level = 0.7
            release = int(num_samples * 0.25)
        elif instrument == 'Saxophone':
            attack = int(num_samples * 0.015)  # Quick attack
            decay = int(num_samples * 0.1)
            sustain_level = 0.75
            release = int(num_samples * 0.35)
        elif instrument == 'Trumpet':
            attack = int(num_samples * 0.008)  # Sharp attack
            decay = int(num_samples * 0.12)
            sustain_level = 0.8
            release = int(num_samples * 0.3)
        elif instrument == 'Trombone':
            attack = int(num_samples * 0.012)
            decay = int(num_samples * 0.1)
            sustain_level = 0.75
            release = int(num_samples * 0.35)
        elif instrument == 'Violin':
            attack = int(num_samples * 0.06)  # Bow attack
            decay = int(num_samples * 0.08)
            sustain_level = 0.85
            release = int(num_samples * 0.25)
        elif instrument == 'Cello':
            attack = int(num_samples * 0.07)  # Slower bow attack
            decay = int(num_samples * 0.1)
            sustain_level = 0.8
            release = int(num_samples * 0.3)
        else:
            attack = int(num_samples * 0.01)
            decay = int(num_samples * 0.15)
            sustain_level = 0.6
            release = int(num_samples * 0.4)
        
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
    
    def generate_chord(self, chord_name, duration=0.8, instrument='Piano'):
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
                wave = self.generate_tone(freq, duration, volume=0.25, instrument=instrument)
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
