// Audio Engine using Web Audio API
class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.sampleRate = 48000;
        this.currentInstrument = 'Piano';
    }

    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: this.sampleRate
            });
        }
        return this.audioContext;
    }

    setInstrument(instrument) {
        this.currentInstrument = instrument;
    }

    // Note frequencies
    noteFrequencies = {
        'C2': 65.41, 'C#2': 69.30, 'Db2': 69.30, 'D2': 73.42, 'Eb2': 77.78,
        'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'Gb2': 92.50, 'G2': 98.00, 'Ab2': 103.83,
        'A2': 110.00, 'Bb2': 116.54, 'B2': 123.47,
        'C3': 130.81, 'Db3': 138.59, 'D3': 146.83, 'Eb3': 155.56,
        'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'Gb3': 185.00, 'G3': 196.00, 'Ab3': 207.65,
        'A3': 220.00, 'Bb3': 233.08, 'B3': 246.94,
        'C4': 261.63, 'C#4': 277.18, 'Db4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'Eb4': 311.13,
        'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'Gb4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'Ab4': 415.30,
        'A4': 440.00, 'A#4': 466.16, 'Bb4': 466.16, 'B4': 493.88, 'B#4': 523.25,
        'C5': 523.25, 'C#5': 554.37, 'Db5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'Eb5': 622.25,
        'E5': 659.25, 'E#5': 698.46, 'F5': 698.46, 'F#5': 739.99, 'Gb5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'Ab5': 830.61,
        'A5': 880.00, 'Bb5': 932.33, 'B5': 987.77
    };

    // Chord definitions
    chordNotes = {
        // Major
        'C': ['C4', 'E4', 'G4'], 'D': ['D4', 'F#4', 'A4'], 'E': ['E4', 'G#4', 'B4'],
        'F': ['F4', 'A4', 'C5'], 'G': ['G4', 'B4', 'D5'], 'A': ['A4', 'C#5', 'E5'], 'B': ['B4', 'D#5', 'F#5'],
        'Db': ['Db4', 'F4', 'Ab4'], 'Eb': ['Eb4', 'G4', 'Bb4'], 'Gb': ['Gb4', 'Bb4', 'Db5'],
        'Ab': ['Ab4', 'C5', 'Eb5'], 'Bb': ['Bb4', 'D5', 'F5'],
        // Minor
        'Cm': ['C4', 'Eb4', 'G4'], 'Dm': ['D4', 'F4', 'A4'], 'Em': ['E4', 'G4', 'B4'],
        'Fm': ['F4', 'Ab4', 'C5'], 'Gm': ['G4', 'Bb4', 'D5'], 'Am': ['A4', 'C5', 'E5'], 'Bm': ['B4', 'D5', 'F#5'],
        'C#m': ['C#4', 'E4', 'G#4'], 'Ebm': ['Eb4', 'Gb4', 'Bb4'], 'F#m': ['F#4', 'A4', 'C#5'],
        'Abm': ['Ab4', 'B4', 'Eb5'], 'Bbm': ['Bb4', 'Db5', 'F5'],
        // 7th
        'C7': ['C4', 'E4', 'G4', 'Bb4'], 'D7': ['D4', 'F#4', 'A4', 'C5'], 'E7': ['E4', 'G#4', 'B4', 'D5'],
        'F7': ['F4', 'A4', 'C5', 'Eb5'], 'G7': ['G4', 'B4', 'D5', 'F5'], 'A7': ['A4', 'C#5', 'E5', 'G5'], 'B7': ['B4', 'D#5', 'F#5', 'A5'],
        'Bb7': ['Bb4', 'D5', 'F5', 'Ab5'], 'Eb7': ['Eb4', 'G4', 'Bb4', 'Db5'], 'Ab7': ['Ab4', 'C5', 'Eb5', 'Gb5'],
        // Major 7th
        'Cmaj7': ['C4', 'E4', 'G4', 'B4'], 'Dmaj7': ['D4', 'F#4', 'A4', 'C#5'], 'Emaj7': ['E4', 'G#4', 'B4', 'D#5'],
        'Fmaj7': ['F4', 'A4', 'C5', 'E5'], 'Gmaj7': ['G4', 'B4', 'D5', 'F#5'], 'Amaj7': ['A4', 'C#5', 'E5', 'G#5'], 'Bmaj7': ['B4', 'D#5', 'F#5', 'A#5'],
        // Minor 7th
        'Cm7': ['C4', 'Eb4', 'G4', 'Bb4'], 'Dm7': ['D4', 'F4', 'A4', 'C5'], 'Em7': ['E4', 'G4', 'B4', 'D5'],
        'Fm7': ['F4', 'Ab4', 'C5', 'Eb5'], 'Gm7': ['G4', 'Bb4', 'D5', 'F5'], 'Am7': ['A4', 'C5', 'E5', 'G5'], 'Bm7': ['B4', 'D5', 'F#5', 'A5'],
        // Sus
        'Csus2': ['C4', 'D4', 'G4'], 'Csus4': ['C4', 'F4', 'G4'],
        'Dsus2': ['D4', 'E4', 'A4'], 'Dsus4': ['D4', 'G4', 'A4'],
        'Esus2': ['E4', 'F#4', 'B4'], 'Esus4': ['E4', 'A4', 'B4'],
        'Fsus2': ['F4', 'G4', 'C5'], 'Fsus4': ['F4', 'Bb4', 'C5'],
        'Gsus2': ['G4', 'A4', 'D5'], 'Gsus4': ['G4', 'C5', 'D5'],
        'Asus2': ['A4', 'B4', 'E5'], 'Asus4': ['A4', 'D5', 'E5'],
        // 9th
        'C9': ['C4', 'E4', 'G4', 'Bb4', 'D5'], 'D9': ['D4', 'F#4', 'A4', 'C5', 'E5'],
        'E9': ['E4', 'G#4', 'B4', 'D5', 'F#5'], 'F9': ['F4', 'A4', 'C5', 'Eb5', 'G5'],
        'G9': ['G4', 'B4', 'D5', 'F5', 'A5'], 'A9': ['A4', 'C#5', 'E5', 'G5', 'B5'],
        'Cm9': ['C4', 'Eb4', 'G4', 'Bb4', 'D5'], 'Dm9': ['D4', 'F4', 'A4', 'C5', 'E5'],
        'Em9': ['E4', 'G4', 'B4', 'D5', 'F#5'], 'Am9': ['A4', 'C5', 'E5', 'G5', 'B5'],
        // 6th
        'C6': ['C4', 'E4', 'G4', 'A4'], 'D6': ['D4', 'F#4', 'A4', 'B4'],
        'E6': ['E4', 'G#4', 'B4', 'C#5'], 'F6': ['F4', 'A4', 'C5', 'D5'],
        'G6': ['G4', 'B4', 'D5', 'E5'], 'A6': ['A4', 'C#5', 'E5', 'F#5'],
        'Cm6': ['C4', 'Eb4', 'G4', 'A4'], 'Dm6': ['D4', 'F4', 'A4', 'B4'],
        'Em6': ['E4', 'G4', 'B4', 'C#5'], 'Am6': ['A4', 'C5', 'E5', 'F#5'],
        // Add9
        'Cadd9': ['C4', 'E4', 'G4', 'D5'], 'Dadd9': ['D4', 'F#4', 'A4', 'E5'],
        'Eadd9': ['E4', 'G#4', 'B4', 'F#5'], 'Fadd9': ['F4', 'A4', 'C5', 'G5'],
        'Gadd9': ['G4', 'B4', 'D5', 'A5'], 'Aadd9': ['A4', 'C#5', 'E5', 'B5'],
        // Power chords
        'C5': ['C3', 'G3', 'C4'], 'D5': ['D3', 'A3', 'D4'], 'E5': ['E3', 'B3', 'E4'],
        'F5': ['F3', 'C4', 'F4'], 'G5': ['G3', 'D4', 'G4'], 'A5': ['A3', 'E4', 'A4'], 'B5': ['B3', 'F#4', 'B4'],
        // Diminished
        'Cdim': ['C4', 'Eb4', 'Gb4'], 'Ddim': ['D4', 'F4', 'Ab4'], 'Edim': ['E4', 'G4', 'Bb4'],
        'Fdim': ['F4', 'Ab4', 'B4'], 'Gdim': ['G4', 'Bb4', 'Db5'], 'Adim': ['A4', 'C5', 'Eb5'], 'Bdim': ['B4', 'D5', 'F5'],
        // Augmented
        'Caug': ['C4', 'E4', 'G#4'], 'Daug': ['D4', 'F#4', 'A#4'], 'Eaug': ['E4', 'G#4', 'B#4'],
        'Faug': ['F4', 'A4', 'C#5'], 'Gaug': ['G4', 'B4', 'D#5'], 'Aaug': ['A4', 'C#5', 'E#5'],
        // Single notes
        'C4n': ['C4'], 'D4n': ['D4'], 'E4n': ['E4'], 'F4n': ['F4'], 'G4n': ['G4'], 'A4n': ['A4'], 'B4n': ['B4'],
        'C5n': ['C5'], 'D5n': ['D5'], 'E5n': ['E5'], 'F5n': ['F5'], 'G5n': ['G5'], 'A5n': ['A5'], 'B5n': ['B5']
    };

    async playChord(chordName, duration, startTime = 0) {
        const ctx = this.init();
        const notes = this.chordNotes[chordName];
        if (!notes) return;

        for (const note of notes) {
            await this.playNote(note, duration, startTime);
        }
    }

    async playNote(note, duration, startTime = 0) {
        const ctx = this.init();
        const frequency = this.noteFrequencies[note];
        if (!frequency) return;

        const now = ctx.currentTime + startTime;
        this.synthesizeInstrument(frequency, duration, now, this.currentInstrument);
    }

    synthesizeInstrument(frequency, duration, startTime, instrument) {
        const ctx = this.audioContext;
        const masterGain = ctx.createGain();
        masterGain.connect(ctx.destination);

        switch (instrument) {
            case 'Piano':
                this.synthPiano(ctx, frequency, duration, startTime, masterGain);
                break;
            case 'Guitar':
                this.synthGuitar(ctx, frequency, duration, startTime, masterGain);
                break;
            case 'Strings':
                this.synthStrings(ctx, frequency, duration, startTime, masterGain);
                break;
            case 'Organ':
                this.synthOrgan(ctx, frequency, duration, startTime, masterGain);
                break;
            case 'Synth':
                this.synthSynth(ctx, frequency, duration, startTime, masterGain);
                break;
            case 'Bass':
                this.synthBass(ctx, frequency, duration, startTime, masterGain);
                break;
            case 'Flute':
                this.synthFlute(ctx, frequency, duration, startTime, masterGain);
                break;
            case 'Saxophone':
                this.synthSaxophone(ctx, frequency, duration, startTime, masterGain);
                break;
            case 'Trumpet':
                this.synthTrumpet(ctx, frequency, duration, startTime, masterGain);
                break;
            case 'Trombone':
                this.synthTrombone(ctx, frequency, duration, startTime, masterGain);
                break;
            case 'Violin':
                this.synthViolin(ctx, frequency, duration, startTime, masterGain);
                break;
            case 'Cello':
                this.synthCello(ctx, frequency, duration, startTime, masterGain);
                break;
            default:
                this.synthPiano(ctx, frequency, duration, startTime, masterGain);
        }

        // ADSR envelope
        masterGain.gain.setValueAtTime(0, startTime);
        masterGain.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
        masterGain.gain.exponentialRampToValueAtTime(0.2, startTime + 0.1);
        masterGain.gain.setValueAtTime(0.2, startTime + duration - 0.1);
        masterGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    }

    synthPiano(ctx, freq, duration, start, output) {
        const harmonics = [1, 0.6, 0.4, 0.3, 0.2, 0.15];
        harmonics.forEach((amp, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = freq * (i + 1) * (1 + 0.0001 * (i + 1) * (i + 1));
            osc.connect(gain);
            gain.connect(output);
            gain.gain.setValueAtTime(amp * 0.15, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
            osc.start(start);
            osc.stop(start + duration);
        });
    }

    synthGuitar(ctx, freq, duration, start, output) {
        const harmonics = [1, 0.5, 0.35, 0.2];
        harmonics.forEach((amp, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = freq * (i + 1);
            osc.connect(gain);
            gain.connect(output);
            gain.gain.setValueAtTime(amp * 0.2, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + duration * 0.8);
            osc.start(start);
            osc.stop(start + duration);
        });
    }

    synthStrings(ctx, freq, duration, start, output) {
        const harmonics = [1, 0.7, 0.5, 0.35, 0.25];
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 5.5;
        lfoGain.gain.value = 3;
        lfo.connect(lfoGain);
        
        harmonics.forEach((amp, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = freq * (i + 1);
            lfoGain.connect(osc.frequency);
            osc.connect(gain);
            gain.connect(output);
            gain.gain.value = amp * 0.15;
            osc.start(start);
            osc.stop(start + duration);
        });
        
        lfo.start(start);
        lfo.stop(start + duration);
    }

    synthOrgan(ctx, freq, duration, start, output) {
        const drawbars = [0.5, 1, 1.5, 2, 3, 4];
        const amps = [0.8, 1.0, 0.6, 0.5, 0.3, 0.25];
        drawbars.forEach((harmonic, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = freq * harmonic;
            osc.connect(gain);
            gain.connect(output);
            gain.gain.value = amps[i] * 0.12;
            osc.start(start);
            osc.stop(start + duration);
        });
    }

    synthSynth(ctx, freq, duration, start, output) {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(freq * 8, start);
        filter.frequency.exponentialRampToValueAtTime(freq * 2, start + duration);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(output);
        gain.gain.value = 0.2;
        
        osc.start(start);
        osc.stop(start + duration);
    }

    synthBass(ctx, freq, duration, start, output) {
        const harmonics = [1.2, 0.9, 0.5, 0.3];
        harmonics.forEach((amp, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = freq * (i + 1);
            osc.connect(gain);
            gain.connect(output);
            gain.gain.value = amp * 0.18;
            osc.start(start);
            osc.stop(start + duration);
        });
    }

    synthFlute(ctx, freq, duration, start, output) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        lfo.frequency.value = 5.5;
        lfoGain.gain.value = 5;
        
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        osc.connect(gain);
        gain.connect(output);
        gain.gain.value = 0.25;
        
        osc.start(start);
        lfo.start(start);
        osc.stop(start + duration);
        lfo.stop(start + duration);
    }

    synthSaxophone(ctx, freq, duration, start, output) {
        const harmonics = [1, 0.8, 0.6, 0.5, 0.35];
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 6;
        lfoGain.gain.value = 8;
        lfo.connect(lfoGain);
        
        harmonics.forEach((amp, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = freq * (i + 1);
            lfoGain.connect(osc.frequency);
            osc.connect(gain);
            gain.connect(output);
            gain.gain.value = amp * 0.12;
            osc.start(start);
            osc.stop(start + duration);
        });
        
        lfo.start(start);
        lfo.stop(start + duration);
    }

    synthTrumpet(ctx, freq, duration, start, output) {
        const harmonics = [1, 0.7, 0.6, 0.5, 0.4];
        harmonics.forEach((amp, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = freq * (i + 1);
            osc.connect(gain);
            gain.connect(output);
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(amp * 0.15, start + 0.02);
            gain.gain.setValueAtTime(amp * 0.12, start + duration - 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
            osc.start(start);
            osc.stop(start + duration);
        });
    }

    synthTrombone(ctx, freq, duration, start, output) {
        const harmonics = [1, 0.75, 0.55, 0.4];
        harmonics.forEach((amp, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = freq * (i + 1);
            osc.connect(gain);
            gain.connect(output);
            gain.gain.value = amp * 0.15;
            osc.start(start);
            osc.stop(start + duration);
        });
    }

    synthViolin(ctx, freq, duration, start, output) {
        const harmonics = [1, 0.7, 0.5, 0.4, 0.3];
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 6;
        lfoGain.gain.value = 6;
        lfo.connect(lfoGain);
        
        harmonics.forEach((amp, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = freq * (i + 1);
            lfoGain.connect(osc.frequency);
            osc.connect(gain);
            gain.connect(output);
            gain.gain.value = amp * 0.13;
            osc.start(start);
            osc.stop(start + duration);
        });
        
        lfo.start(start);
        lfo.stop(start + duration);
    }

    synthCello(ctx, freq, duration, start, output) {
        const harmonics = [1, 0.8, 0.6, 0.45, 0.32];
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 5.2;
        lfoGain.gain.value = 4;
        lfo.connect(lfoGain);
        
        harmonics.forEach((amp, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = freq * (i + 1);
            lfoGain.connect(osc.frequency);
            osc.connect(gain);
            gain.connect(output);
            gain.gain.value = amp * 0.14;
            osc.start(start);
            osc.stop(start + duration);
        });
        
        lfo.start(start);
        lfo.stop(start + duration);
    }
}

window.audioEngine = new AudioEngine();
