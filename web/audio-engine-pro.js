// Professional Audio Engine using Tone.js
// 10x better sound quality with reverb, chorus, and advanced synthesis

class AudioEnginePro {
    constructor() {
        this.currentInstrument = 'Piano';
        this.initialized = false;
        this.synths = {};
        this.effects = {};
        // High-quality sampled instruments (lazy-loaded)
        this.sampleSets = {
            'Piano': {
                type: 'sampler',
                options: {
                    // Salamander Grand Piano multi-sample set (Tone.js hosted)
                    urls: {
                        'A0': 'A0.mp3',
                        'C1': 'C1.mp3',
                        'D#1': 'Ds1.mp3',
                        'F#1': 'Fs1.mp3',
                        'A1': 'A1.mp3',
                        'C2': 'C2.mp3',
                        'D#2': 'Ds2.mp3',
                        'F#2': 'Fs2.mp3',
                        'A2': 'A2.mp3',
                        'C3': 'C3.mp3',
                        'D#3': 'Ds3.mp3',
                        'F#3': 'Fs3.mp3',
                        'A3': 'A3.mp3',
                        'C4': 'C4.mp3',
                        'D#4': 'Ds4.mp3',
                        'F#4': 'Fs4.mp3',
                        'A4': 'A4.mp3',
                        'C5': 'C5.mp3',
                        'D#5': 'Ds5.mp3',
                        'F#5': 'Fs5.mp3',
                        'A5': 'A5.mp3',
                        'C6': 'C6.mp3',
                        'D#6': 'Ds6.mp3',
                        'F#6': 'Fs6.mp3',
                        'A6': 'A6.mp3',
                        'C7': 'C7.mp3',
                        'D#7': 'Ds7.mp3',
                        'F#7': 'Fs7.mp3',
                        'A7': 'A7.mp3',
                        'C8': 'C8.mp3'
                    },
                    release: 1.5,
                    attack: 0.002,
                    baseUrl: 'https://tonejs.github.io/audio/salamander/'
                }
            }
        };
    }

    async init() {
        if (this.initialized) return;
        
        await Tone.start();
        console.log('🎵 Tone.js Audio Engine Started - Professional Quality');
        
        // Create master effects chain
        this.effects.reverb = new Tone.Reverb({
            decay: 2.5,
            wet: 0.3
        }).toDestination();
        
        this.effects.chorus = new Tone.Chorus({
            frequency: 2,
            delayTime: 3.5,
            depth: 0.5,
            wet: 0.2
        }).connect(this.effects.reverb);
        
        this.effects.compressor = new Tone.Compressor({
            threshold: -20,
            ratio: 4,
            attack: 0.003,
            release: 0.25
        }).connect(this.effects.chorus);
        
        this.initialized = true;
    }

    setInstrument(instrument) {
        this.currentInstrument = instrument;
    }

    // Enhanced chord and note definitions
    noteFrequencies = {
        'C2': 'C2', 'C#2': 'C#2', 'Db2': 'Db2', 'D2': 'D2', 'Eb2': 'Eb2',
        'E2': 'E2', 'F2': 'F2', 'F#2': 'F#2', 'Gb2': 'Gb2', 'G2': 'G2', 'Ab2': 'Ab2',
        'A2': 'A2', 'Bb2': 'Bb2', 'B2': 'B2',
        'C3': 'C3', 'Db3': 'Db3', 'D3': 'D3', 'Eb3': 'Eb3',
        'E3': 'E3', 'F3': 'F3', 'F#3': 'F#3', 'Gb3': 'Gb3', 'G3': 'G3', 'Ab3': 'Ab3',
        'A3': 'A3', 'Bb3': 'Bb3', 'B3': 'B3',
        'C4': 'C4', 'C#4': 'C#4', 'Db4': 'Db4', 'D4': 'D4', 'D#4': 'D#4', 'Eb4': 'Eb4',
        'E4': 'E4', 'F4': 'F4', 'F#4': 'F#4', 'Gb4': 'Gb4', 'G4': 'G4', 'G#4': 'G#4', 'Ab4': 'Ab4',
        'A4': 'A4', 'A#4': 'A#4', 'Bb4': 'Bb4', 'B4': 'B4', 'B#4': 'B#4',
        'C5': 'C5', 'C#5': 'C#5', 'Db5': 'Db5', 'D5': 'D5', 'D#5': 'D#5', 'Eb5': 'Eb5',
        'E5': 'E5', 'E#5': 'E#5', 'F5': 'F5', 'F#5': 'F#5', 'Gb5': 'Gb5', 'G5': 'G5', 'G#5': 'G#5', 'Ab5': 'Ab5',
        'A5': 'A5', 'Bb5': 'Bb5', 'B5': 'B5'
    };

    chordNotes = {
        'C': ['C4', 'E4', 'G4'], 'D': ['D4', 'F#4', 'A4'], 'E': ['E4', 'G#4', 'B4'],
        'F': ['F4', 'A4', 'C5'], 'G': ['G4', 'B4', 'D5'], 'A': ['A4', 'C#5', 'E5'], 'B': ['B4', 'D#5', 'F#5'],
        'Db': ['Db4', 'F4', 'Ab4'], 'Eb': ['Eb4', 'G4', 'Bb4'], 'Gb': ['Gb4', 'Bb4', 'Db5'],
        'Ab': ['Ab4', 'C5', 'Eb5'], 'Bb': ['Bb4', 'D5', 'F5'],
        'Cm': ['C4', 'Eb4', 'G4'], 'Dm': ['D4', 'F4', 'A4'], 'Em': ['E4', 'G4', 'B4'],
        'Fm': ['F4', 'Ab4', 'C5'], 'Gm': ['G4', 'Bb4', 'D5'], 'Am': ['A4', 'C5', 'E5'], 'Bm': ['B4', 'D5', 'F#5'],
        'C#m': ['C#4', 'E4', 'G#4'], 'Ebm': ['Eb4', 'Gb4', 'Bb4'], 'F#m': ['F#4', 'A4', 'C#5'],
        'Abm': ['Ab4', 'B4', 'Eb5'], 'Bbm': ['Bb4', 'Db5', 'F5'],
        'C7': ['C4', 'E4', 'G4', 'Bb4'], 'D7': ['D4', 'F#4', 'A4', 'C5'], 'E7': ['E4', 'G#4', 'B4', 'D5'],
        'F7': ['F4', 'A4', 'C5', 'Eb5'], 'G7': ['G4', 'B4', 'D5', 'F5'], 'A7': ['A4', 'C#5', 'E5', 'G5'],
        'B7': ['B4', 'D#5', 'F#5', 'A5'], 'Bb7': ['Bb4', 'D5', 'F5', 'Ab5'], 'Eb7': ['Eb4', 'G4', 'Bb4', 'Db5'],
        'Ab7': ['Ab4', 'C5', 'Eb5', 'Gb5'],
        'Cmaj7': ['C4', 'E4', 'G4', 'B4'], 'Dmaj7': ['D4', 'F#4', 'A4', 'C#5'], 'Emaj7': ['E4', 'G#4', 'B4', 'D#5'],
        'Fmaj7': ['F4', 'A4', 'C5', 'E5'], 'Gmaj7': ['G4', 'B4', 'D5', 'F#5'], 'Amaj7': ['A4', 'C#5', 'E5', 'G#5'],
        'Bmaj7': ['B4', 'D#5', 'F#5', 'A#5'],
        'Cm7': ['C4', 'Eb4', 'G4', 'Bb4'], 'Dm7': ['D4', 'F4', 'A4', 'C5'], 'Em7': ['E4', 'G4', 'B4', 'D5'],
        'Fm7': ['F4', 'Ab4', 'C5', 'Eb5'], 'Gm7': ['G4', 'Bb4', 'D5', 'F5'], 'Am7': ['A4', 'C5', 'E5', 'G5'],
        'Bm7': ['B4', 'D5', 'F#5', 'A5'],
        'Csus2': ['C4', 'D4', 'G4'], 'Csus4': ['C4', 'F4', 'G4'], 'Dsus2': ['D4', 'E4', 'A4'], 'Dsus4': ['D4', 'G4', 'A4'],
        'Esus2': ['E4', 'F#4', 'B4'], 'Esus4': ['E4', 'A4', 'B4'], 'Fsus2': ['F4', 'G4', 'C5'], 'Fsus4': ['F4', 'Bb4', 'C5'],
        'Gsus2': ['G4', 'A4', 'D5'], 'Gsus4': ['G4', 'C5', 'D5'], 'Asus2': ['A4', 'B4', 'E5'], 'Asus4': ['A4', 'D5', 'E5'],
        'C9': ['C4', 'E4', 'G4', 'Bb4', 'D5'], 'D9': ['D4', 'F#4', 'A4', 'C5', 'E5'], 'E9': ['E4', 'G#4', 'B4', 'D5', 'F#5'],
        'F9': ['F4', 'A4', 'C5', 'Eb5', 'G5'], 'G9': ['G4', 'B4', 'D5', 'F5', 'A5'], 'A9': ['A4', 'C#5', 'E5', 'G5', 'B5'],
        'Cm9': ['C4', 'Eb4', 'G4', 'Bb4', 'D5'], 'Dm9': ['D4', 'F4', 'A4', 'C5', 'E5'], 'Em9': ['E4', 'G4', 'B4', 'D5', 'F#5'],
        'Am9': ['A4', 'C5', 'E5', 'G5', 'B5'],
        'C6': ['C4', 'E4', 'G4', 'A4'], 'D6': ['D4', 'F#4', 'A4', 'B4'], 'E6': ['E4', 'G#4', 'B4', 'C#5'],
        'F6': ['F4', 'A4', 'C5', 'D5'], 'G6': ['G4', 'B4', 'D5', 'E5'], 'A6': ['A4', 'C#5', 'E5', 'F#5'],
        'Cm6': ['C4', 'Eb4', 'G4', 'A4'], 'Dm6': ['D4', 'F4', 'A4', 'B4'], 'Em6': ['E4', 'G4', 'B4', 'C#5'],
        'Am6': ['A4', 'C5', 'E5', 'F#5'],
        'Cadd9': ['C4', 'D4', 'E4', 'G4'], 'Dadd9': ['D4', 'E4', 'F#4', 'A4'], 'Eadd9': ['E4', 'F#4', 'G#4', 'B4'],
        'Fadd9': ['F4', 'G4', 'A4', 'C5'], 'Gadd9': ['G4', 'A4', 'B4', 'D5'], 'Aadd9': ['A4', 'B4', 'C#5', 'E5'],
        'C5': ['C4', 'G4'], 'D5': ['D4', 'A4'], 'E5': ['E4', 'B4'], 'F5': ['F4', 'C5'],
        'G5': ['G4', 'D5'], 'A5': ['A4', 'E5'], 'B5': ['B4', 'F#5'],
        'Cdim': ['C4', 'Eb4', 'Gb4'], 'Ddim': ['D4', 'F4', 'Ab4'], 'Edim': ['E4', 'G4', 'Bb4'],
        'Fdim': ['F4', 'Ab4', 'B4'], 'Gdim': ['G4', 'Bb4', 'Db5'], 'Adim': ['A4', 'C5', 'Eb5'], 'Bdim': ['B4', 'D5', 'F5'],
        'Caug': ['C4', 'E4', 'G#4'], 'Daug': ['D4', 'F#4', 'A#4'], 'Eaug': ['E4', 'G#4', 'B#4'],
        'Faug': ['F4', 'A4', 'C#5'], 'Gaug': ['G4', 'B4', 'D#5'], 'Aaug': ['A4', 'C#5', 'E#5']
    };

    getSynthForInstrument(instrument) {
        const key = instrument || this.currentInstrument;
        
        if (this.synths[key]) {
            return this.synths[key];
        }

        // Prefer high-quality sampled instruments when defined
        const sampleDef = this.sampleSets[key];
        if (sampleDef && sampleDef.type === 'sampler') {
            const sampler = new Tone.Sampler(sampleDef.options).connect(this.effects.compressor);
            this.synths[key] = sampler;
            return sampler;
        }

        let synth;
        
        switch (key) {
            case 'Piano':
                synth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: 'triangle' },
                    envelope: { attack: 0.005, decay: 0.2, sustain: 0.2, release: 1.5 }
                }).connect(this.effects.compressor);
                break;
                
            case 'Guitar':
                synth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: 'triangle' },
                    envelope: { attack: 0.008, decay: 0.5, sustain: 0.1, release: 1.2 }
                }).connect(this.effects.compressor);
                break;
                
            case 'Strings':
                synth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: 'sawtooth' },
                    envelope: { attack: 0.3, decay: 0.1, sustain: 0.9, release: 2.0 }
                }).connect(this.effects.compressor);
                break;
                
            case 'Organ':
                synth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: 'sine4' },
                    envelope: { attack: 0.001, decay: 0.1, sustain: 1.0, release: 0.5 }
                }).connect(this.effects.compressor);
                break;
                
            case 'Synth':
                synth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: 'square' },
                    envelope: { attack: 0.005, decay: 0.2, sustain: 0.6, release: 0.8 }
                }).connect(this.effects.compressor);
                break;
                
            case 'Bass':
                synth = new Tone.MonoSynth({
                    oscillator: { type: 'sawtooth' },
                    envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.5 },
                    filter: { Q: 3, type: 'lowpass', rolloff: -24 },
                    filterEnvelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.5, baseFrequency: 50, octaves: 3.5 }
                }).connect(this.effects.compressor);
                break;
                
            case 'Flute':
                synth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: 'sine' },
                    envelope: { attack: 0.05, decay: 0.2, sustain: 0.8, release: 1.0 }
                }).connect(this.effects.compressor);
                break;
                
            case 'Saxophone':
                synth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: 'sawtooth' },
                    envelope: { attack: 0.02, decay: 0.3, sustain: 0.7, release: 0.8 }
                }).connect(this.effects.compressor);
                break;
                
            case 'Trumpet':
                synth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: 'square' },
                    envelope: { attack: 0.01, decay: 0.2, sustain: 0.8, release: 0.5 }
                }).connect(this.effects.compressor);
                break;
                
            case 'Trombone':
                synth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: 'sawtooth' },
                    envelope: { attack: 0.03, decay: 0.2, sustain: 0.7, release: 0.7 }
                }).connect(this.effects.compressor);
                break;
                
            case 'Violin':
                synth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: 'sawtooth' },
                    envelope: { attack: 0.1, decay: 0.2, sustain: 0.9, release: 1.5 }
                }).connect(this.effects.compressor);
                break;
                
            case 'Cello':
                synth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: 'sawtooth' },
                    envelope: { attack: 0.15, decay: 0.3, sustain: 0.9, release: 1.8 }
                }).connect(this.effects.compressor);
                break;
                
            default:
                synth = new Tone.PolySynth().connect(this.effects.compressor);
        }
        
        this.synths[key] = synth;
        return synth;
    }

    async playChord(chordName, duration, startTime = 0) {
        await this.init();
        
        // Handle multiple notes separated by comma
        if (chordName.indexOf(',') !== -1) {
            const individualNotes = chordName.split(',');
            for (const noteName of individualNotes) {
                const cleanNote = noteName.trim();
                if (cleanNote.endsWith('n')) {
                    await this.playNote(cleanNote.slice(0, -1), duration, startTime);
                } else {
                    const notes = this.chordNotes[cleanNote];
                    if (notes) {
                        const synth = this.getSynthForInstrument();
                        synth.triggerAttackRelease(notes, duration);
                    }
                }
            }
            return;
        }
        
        // Handle single notes
        if (chordName.endsWith('n')) {
            await this.playNote(chordName.slice(0, -1), duration, startTime);
            return;
        }
        
        // Handle regular chords
        const notes = this.chordNotes[chordName];
        if (!notes) return;

        const synth = this.getSynthForInstrument();
        synth.triggerAttackRelease(notes, duration);
    }

    async playNote(note, duration, startTime = 0) {
        await this.init();
        
        const toneNote = this.noteFrequencies[note];
        if (!toneNote) return;

        const synth = this.getSynthForInstrument();
        
        if (this.currentInstrument === 'Bass') {
            synth.triggerAttackRelease(toneNote, duration);
        } else {
            synth.triggerAttackRelease([toneNote], duration);
        }
    }

    dispose() {
        Object.values(this.synths).forEach(synth => synth.dispose());
        Object.values(this.effects).forEach(effect => effect.dispose());
        this.synths = {};
        this.initialized = false;
    }
}

// Create global instance
window.audioEngine = new AudioEnginePro();
console.log('✅ Professional Audio Engine loaded');
