// AI Music Generator for Web Version
class AIGenerator {
    constructor(app) {
        this.app = app;
        this.modal = document.getElementById('aiModal');
        this.closeBtn = document.querySelector('.close');
        this.closeModalBtn = document.getElementById('closeModalBtn');
        this.generateBtn = document.getElementById('generateBtn');
        this.aiBtn = document.getElementById('aiBtn');
        this.statusDiv = document.getElementById('aiStatus');
        
        this.initEventListeners();
    }

    initEventListeners() {
        // Open modal
        this.aiBtn.addEventListener('click', () => this.showModal());
        
        // Close modal
        this.closeBtn.addEventListener('click', () => this.hideModal());
        this.closeModalBtn.addEventListener('click', () => this.hideModal());
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) this.hideModal();
        });
        
        // Generate button
        this.generateBtn.addEventListener('click', () => this.generate());
        
        // Enter key to submit
        document.getElementById('aiDescription').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.generate();
            }
        });
    }

    showModal() {
        this.modal.style.display = 'block';
        this.statusDiv.textContent = '';
        this.statusDiv.className = 'ai-status';
        document.getElementById('aiDescription').focus();
    }

    hideModal() {
        this.modal.style.display = 'none';
    }

    async generate() {
        const description = document.getElementById('aiDescription').value.trim();
        const track = parseInt(document.getElementById('aiTrack').value);
        const length = parseInt(document.getElementById('aiLength').value);

        if (!description) {
            alert('Please describe the music you want!');
            return;
        }

        this.statusDiv.textContent = '🤖 Generating with AI...';
        this.statusDiv.className = 'ai-status loading';
        this.generateBtn.disabled = true;

        try {
            const blocks = await this.generateMusicWithAI(description, track, length);
            
            if (blocks && blocks.length > 0) {
                // Add blocks to timeline
                blocks.forEach(block => {
                    this.app.chordBlocks.push(block);
                });
                this.app.drawTimeline();
                
                this.statusDiv.textContent = `✅ Generated ${blocks.length} chords!`;
                this.statusDiv.className = 'ai-status success';
                
                // Auto-close after 1.5 seconds
                setTimeout(() => this.hideModal(), 1500);
            } else {
                throw new Error('No chords generated');
            }
        } catch (error) {
            this.statusDiv.textContent = `❌ ${error.message}`;
            this.statusDiv.className = 'ai-status error';
        } finally {
            this.generateBtn.disabled = false;
        }
    }

    async generateMusicWithAI(description, track, length) {
        // List of all available chords
        const availableChords = [
            'C4n', 'D4n', 'E4n', 'F4n', 'G4n', 'A4n', 'B4n', 'C5n', 'D5n', 'E5n', 'F5n', 'G5n', 'A5n', 'B5n',
            'C', 'D', 'E', 'F', 'G', 'A', 'B', 'Db', 'Eb', 'Gb', 'Ab', 'Bb',
            'Cm', 'Dm', 'Em', 'Fm', 'Gm', 'Am', 'Bm', 'C#m', 'Ebm', 'F#m', 'Abm', 'Bbm',
            'C7', 'D7', 'E7', 'F7', 'G7', 'A7', 'B7', 'Bb7', 'Eb7', 'Ab7',
            'Cmaj7', 'Dmaj7', 'Emaj7', 'Fmaj7', 'Gmaj7', 'Amaj7', 'Bmaj7',
            'Cm7', 'Dm7', 'Em7', 'Fm7', 'Gm7', 'Am7', 'Bm7',
            'Csus2', 'Csus4', 'Dsus2', 'Dsus4', 'Esus2', 'Esus4', 'Fsus2', 'Fsus4', 'Gsus2', 'Gsus4', 'Asus2', 'Asus4',
            'C9', 'D9', 'E9', 'F9', 'G9', 'A9', 'Cm9', 'Dm9', 'Em9', 'Am9',
            'C6', 'D6', 'E6', 'F6', 'G6', 'A6', 'Cm6', 'Dm6', 'Em6', 'Am6',
            'Cadd9', 'Dadd9', 'Eadd9', 'Fadd9', 'Gadd9', 'Aadd9',
            'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5',
            'Cdim', 'Ddim', 'Edim', 'Fdim', 'Gdim', 'Adim', 'Bdim',
            'Caug', 'Daug', 'Eaug', 'Faug', 'Gaug', 'Aaug'
        ];

        // Try using built-in AI (if available in browser)
        if (window.ai && window.ai.languageModel) {
            return await this.generateWithBrowserAI(description, track, length, availableChords);
        }
        
        // Fallback to rule-based generation
        return this.generateWithRules(description, track, length, availableChords);
    }

    async generateWithBrowserAI(description, track, length, availableChords) {
        try {
            const session = await window.ai.languageModel.create();
            
            const prompt = `You are a music composition assistant. Generate a chord progression based on this description: "${description}"

Available chords: ${availableChords.join(', ')}

Generate ${length} bars of music. Each bar is 4 beats. Return ONLY a JSON array with this format:
[
  {"chord": "C", "position": 0, "duration": 4},
  {"chord": "G", "position": 4, "duration": 4}
]

Rules:
- Use only chords from the available list
- Position starts at 0
- Duration is in beats (typically 2 or 4)
- Total length should be around ${length * 4} beats
- Choose chords that match the mood and style described

Return ONLY the JSON array, no explanation.`;

            const response = await session.prompt(prompt);
            
            // Extract JSON from response
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const data = JSON.parse(jsonMatch[0]);
                return data.map(item => ({
                    chord: item.chord,
                    position: item.position,
                    duration: item.duration || 4,
                    track: track
                }));
            }
        } catch (error) {
            console.log('Browser AI not available, using rule-based generation');
        }
        
        return null;
    }

    generateWithRules(description, track, length, availableChords) {
        // Rule-based generation based on keywords
        const lower = description.toLowerCase();
        let chordPool = [];
        
        // Detect mood and genre
        const isHappy = /happy|cheerful|joy|bright|upbeat|energetic/i.test(lower);
        const isSad = /sad|melancholy|somber|dark|minor/i.test(lower);
        const isJazz = /jazz|swing|bebop/i.test(lower);
        const isRock = /rock|metal|punk/i.test(lower);
        const isPop = /pop|commercial|catchy/i.test(lower);
        const isClassical = /classical|baroque|orchestral/i.test(lower);
        
        // Select appropriate chords
        if (isHappy || isPop) {
            chordPool = ['C', 'G', 'Am', 'F', 'Dm', 'Em', 'Cadd9', 'Gsus4'];
        } else if (isSad) {
            chordPool = ['Am', 'Dm', 'Em', 'Fm', 'Cm', 'Gm', 'C7', 'Dm7'];
        } else if (isJazz) {
            chordPool = ['Cmaj7', 'Dm7', 'G7', 'Am7', 'Fmaj7', 'C9', 'D9', 'Em7'];
        } else if (isRock) {
            chordPool = ['C5', 'G5', 'D5', 'A5', 'E5', 'F5', 'Bb5'];
        } else if (isClassical) {
            chordPool = ['C', 'G', 'Am', 'F', 'Dm', 'E', 'Cmaj7', 'G7'];
        } else {
            // Default pop progression
            chordPool = ['C', 'G', 'Am', 'F', 'Dm', 'Em'];
        }
        
        // Detect specific key
        const keyMatch = lower.match(/in ([A-G][#b]?)\s*(major|minor)?/i);
        if (keyMatch) {
            const key = keyMatch[1].toUpperCase();
            const mode = keyMatch[2] ? keyMatch[2].toLowerCase() : 'major';
            chordPool = this.transposeChords(chordPool, 'C', key, mode);
        }
        
        // Generate progression
        const blocks = [];
        let position = 0;
        const totalBeats = length * 4;
        
        while (position < totalBeats) {
            const chord = chordPool[Math.floor(Math.random() * chordPool.length)];
            const duration = [2, 4, 4, 4][Math.floor(Math.random() * 4)]; // Prefer longer durations
            
            blocks.push({
                chord: chord,
                position: position,
                duration: Math.min(duration, totalBeats - position),
                track: track
            });
            
            position += duration;
        }
        
        return blocks;
    }

    transposeChords(chords, fromKey, toKey, mode) {
        // Simple transposition - in real app, this would be more sophisticated
        const notes = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
        const fromIndex = notes.indexOf(fromKey);
        const toIndex = notes.indexOf(toKey);
        const interval = (toIndex - fromIndex + 12) % 12;
        
        if (interval === 0) return chords;
        
        return chords.map(chord => {
            // Extract root note
            const match = chord.match(/^([A-G][#b]?)(.*)/);
            if (!match) return chord;
            
            const root = match[1];
            const suffix = match[2];
            const rootIndex = notes.indexOf(root);
            if (rootIndex === -1) return chord;
            
            const newRootIndex = (rootIndex + interval) % 12;
            const newRoot = notes[newRootIndex];
            
            return newRoot + suffix;
        });
    }
}

// Initialize AI Generator when app is ready
window.addEventListener('DOMContentLoaded', () => {
    // Wait for app to be initialized
    setTimeout(() => {
        if (window.app) {
            window.aiGenerator = new AIGenerator(window.app);
        }
    }, 100);
});
