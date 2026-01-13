// Main Application Logic
class MusicApp {
    constructor() {
        this.canvas = document.getElementById('timeline');
        this.ctx = this.canvas.getContext('2d');
        this.chordBlocks = [];
        this.draggingChord = null;
        this.isPlaying = false;
        this.repeatMode = false;
        this.bpm = 100;
        this.currentKey = 'C';
        this.beatWidth = 80;
        this.trackHeight = 60;
        this.headerHeight = 25;
        this.timelineBeats = 50;
        this.scrollX = 0;
        this.scrollY = 0;
        
        this.initUI();
        this.initCanvas();
        this.loadDefaultSong();
    }

    initUI() {
        // Chord sections
        const chordSections = [
            { name: 'SINGLE NOTES', chords: ['C4n', 'D4n', 'E4n', 'F4n', 'G4n', 'A4n', 'B4n', 'C5n', 'D5n', 'E5n', 'F5n', 'G5n', 'A5n', 'B5n'] },
            { name: 'MAJOR CHORDS', chords: ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Db', 'Eb', 'Gb', 'Ab', 'Bb'] },
            { name: 'MINOR CHORDS', chords: ['Cm', 'Dm', 'Em', 'Fm', 'Gm', 'Am', 'Bm', 'C#m', 'Ebm', 'F#m', 'Abm', 'Bbm'] },
            { name: 'DOMINANT 7TH', chords: ['C7', 'D7', 'E7', 'F7', 'G7', 'A7', 'B7', 'Bb7', 'Eb7', 'Ab7'] },
            { name: 'MAJOR 7TH', chords: ['Cmaj7', 'Dmaj7', 'Emaj7', 'Fmaj7', 'Gmaj7', 'Amaj7', 'Bmaj7'] },
            { name: 'MINOR 7TH', chords: ['Cm7', 'Dm7', 'Em7', 'Fm7', 'Gm7', 'Am7', 'Bm7'] },
            { name: 'SUSPENDED', chords: ['Csus2', 'Csus4', 'Dsus2', 'Dsus4', 'Esus2', 'Esus4', 'Fsus2', 'Fsus4', 'Gsus2', 'Gsus4', 'Asus2', 'Asus4'] },
            { name: '9TH CHORDS', chords: ['C9', 'D9', 'E9', 'F9', 'G9', 'A9', 'Cm9', 'Dm9', 'Em9', 'Am9'] },
            { name: '6TH CHORDS', chords: ['C6', 'D6', 'E6', 'F6', 'G6', 'A6', 'Cm6', 'Dm6', 'Em6', 'Am6'] },
            { name: 'ADD9 CHORDS', chords: ['Cadd9', 'Dadd9', 'Eadd9', 'Fadd9', 'Gadd9', 'Aadd9'] },
            { name: 'POWER CHORDS', chords: ['C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5'] },
            { name: 'DIMINISHED', chords: ['Cdim', 'Ddim', 'Edim', 'Fdim', 'Gdim', 'Adim', 'Bdim'] },
            { name: 'AUGMENTED', chords: ['Caug', 'Daug', 'Eaug', 'Faug', 'Gaug', 'Aaug'] }
        ];

        const chordList = document.getElementById('chordList');
        chordSections.forEach(section => {
            const header = document.createElement('div');
            header.className = 'chord-section-header';
            header.textContent = section.name;
            chordList.appendChild(header);

            section.chords.forEach(chord => {
                const btn = document.createElement('button');
                btn.className = 'chord-btn';
                btn.textContent = chord;
                btn.style.background = this.getChordColor(chord);
                btn.draggable = true;
                btn.addEventListener('dragstart', (e) => {
                    this.draggingChord = chord;
                    e.dataTransfer.effectAllowed = 'copy';
                });
                chordList.appendChild(btn);
            });
        });

        // Button event listeners
        document.getElementById('playBtn').addEventListener('click', () => this.play());
        document.getElementById('stopBtn').addEventListener('click', () => this.stop());
        document.getElementById('repeatBtn').addEventListener('click', () => this.toggleRepeat());
        document.getElementById('newBtn').addEventListener('click', () => this.newSong());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportWAV());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveProject());
        document.getElementById('loadBtn').addEventListener('click', () => this.loadProject());
        document.getElementById('clearBtn').addEventListener('click', () => this.clear());
        document.getElementById('scrollLeft').addEventListener('click', () => this.scroll(-200));
        document.getElementById('scrollRight').addEventListener('click', () => this.scroll(200));

        // Controls
        document.getElementById('bpmInput').addEventListener('change', (e) => {
            this.bpm = parseInt(e.target.value);
        });
        document.getElementById('instrumentSelect').addEventListener('change', (e) => {
            window.audioEngine.setInstrument(e.target.value);
        });

        // Canvas events
        this.canvas.addEventListener('dragover', (e) => e.preventDefault());
        this.canvas.addEventListener('drop', (e) => this.onDrop(e));
        this.canvas.addEventListener('contextmenu', (e) => this.onRightClick(e));
        this.canvas.parentElement.addEventListener('scroll', () => this.drawTimeline());
    }

    initCanvas() {
        this.canvas.width = this.timelineBeats * this.beatWidth;
        this.canvas.height = 600;
        this.drawTimeline();
    }

    drawTimeline() {
        const wrapper = this.canvas.parentElement;
        this.scrollX = wrapper.scrollLeft;
        this.scrollY = wrapper.scrollTop;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Background
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Header
        this.ctx.fillStyle = '#2a2a2a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.headerHeight);

        // Grid lines and beat numbers
        this.ctx.strokeStyle = '#333';
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 12px Arial';
        for (let i = 0; i <= this.timelineBeats; i++) {
            const x = i * this.beatWidth;
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.headerHeight);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
            this.ctx.fillText(i.toString(), x + 5, this.headerHeight / 2 + 4);
        }

        // Track lines
        for (let i = this.headerHeight + this.trackHeight; i < this.canvas.height; i += this.trackHeight) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(this.canvas.width, i);
            this.ctx.stroke();
        }

        // Track labels
        this.ctx.fillStyle = '#555';
        this.ctx.font = 'italic 11px Arial';
        for (let i = 0; i < Math.floor((this.canvas.height - this.headerHeight) / this.trackHeight); i++) {
            this.ctx.fillText(`Track ${i + 1}`, 5, this.headerHeight + i * this.trackHeight + 30);
        }

        // Draw chord blocks
        this.chordBlocks.forEach(block => this.drawBlock(block));
    }

    drawBlock(block) {
        const x = block.position * this.beatWidth;
        const y = this.headerHeight + block.track * this.trackHeight + 5;
        const width = block.duration * this.beatWidth - 4;
        const height = this.trackHeight - 10;

        this.ctx.fillStyle = this.getChordColor(block.chord);
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        this.ctx.fillRect(x + 2, y, width, height);
        this.ctx.strokeRect(x + 2, y, width, height);

        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(block.chord, x + width / 2, y + height / 2 + 5);
    }

    onDrop(e) {
        e.preventDefault();
        if (!this.draggingChord) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left + this.scrollX;
        const y = e.clientY - rect.top + this.scrollY;

        if (y < this.headerHeight) return;

        const beat = Math.floor(x / this.beatWidth);
        const track = Math.floor((y - this.headerHeight) / this.trackHeight);

        this.chordBlocks.push({
            chord: this.draggingChord,
            position: beat,
            duration: 1,
            track: track
        });

        this.draggingChord = null;
        this.drawTimeline();
    }

    onRightClick(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left + this.scrollX;
        const y = e.clientY - rect.top + this.scrollY;

        for (let i = this.chordBlocks.length - 1; i >= 0; i--) {
            const block = this.chordBlocks[i];
            const bx = block.position * this.beatWidth;
            const by = this.headerHeight + block.track * this.trackHeight + 5;
            const bw = block.duration * this.beatWidth - 4;
            const bh = this.trackHeight - 10;

            if (x >= bx && x <= bx + bw && y >= by && y <= by + bh) {
                this.chordBlocks.splice(i, 1);
                this.drawTimeline();
                break;
            }
        }
    }

    async play() {
        if (this.isPlaying || this.chordBlocks.length === 0) return;
        this.isPlaying = true;
        document.getElementById('playBtn').disabled = true;

        do {
            const beatDuration = 60 / this.bpm;
            const sortedBlocks = [...this.chordBlocks].sort((a, b) => a.position - b.position);

            for (const block of sortedBlocks) {
                if (!this.isPlaying) break;
                const startTime = block.position * beatDuration;
                const duration = block.duration * beatDuration;
                
                setTimeout(() => {
                    window.audioEngine.playChord(block.chord, duration);
                }, startTime * 1000);
            }

            if (sortedBlocks.length > 0) {
                const lastBlock = sortedBlocks[sortedBlocks.length - 1];
                const totalDuration = (lastBlock.position + lastBlock.duration) * beatDuration;
                await new Promise(resolve => setTimeout(resolve, totalDuration * 1000 + 500));
            }
        } while (this.repeatMode && this.isPlaying);

        this.isPlaying = false;
        document.getElementById('playBtn').disabled = false;
    }

    stop() {
        this.isPlaying = false;
        if (window.audioEngine.audioContext) {
            window.audioEngine.audioContext.close();
            window.audioEngine.audioContext = null;
        }
    }

    toggleRepeat() {
        this.repeatMode = !this.repeatMode;
        const btn = document.getElementById('repeatBtn');
        if (this.repeatMode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    }

    newSong() {
        if (confirm('Create a new song? This will clear the current timeline.')) {
            this.clear();
        }
    }

    clear() {
        this.chordBlocks = [];
        this.drawTimeline();
    }

    scroll(amount) {
        const wrapper = this.canvas.parentElement;
        wrapper.scrollLeft += amount;
    }

    saveProject() {
        const data = {
            version: '1.0',
            bpm: this.bpm,
            key: this.currentKey,
            blocks: this.chordBlocks
        };
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'music-project.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    loadProject() {
        const input = document.getElementById('loadFileInput');
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    this.bpm = data.bpm || 100;
                    this.currentKey = data.key || 'C';
                    this.chordBlocks = data.blocks || [];
                    document.getElementById('bpmInput').value = this.bpm;
                    this.drawTimeline();
                } catch (err) {
                    alert('Error loading project: ' + err.message);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    exportWAV() {
        alert('WAV export requires server-side processing. For now, you can record your browser audio using screen recording software!');
    }

    loadDefaultSong() {
        // Happy Birthday
        this.chordBlocks = [
            { chord: 'G4n', position: 0, duration: 0.5, track: 0 },
            { chord: 'G4n', position: 0.5, duration: 0.5, track: 0 },
            { chord: 'A4n', position: 1, duration: 1, track: 0 },
            { chord: 'G4n', position: 2, duration: 1, track: 0 },
            { chord: 'C5n', position: 3, duration: 1, track: 0 },
            { chord: 'B4n', position: 4, duration: 2, track: 0 },
            { chord: 'G4n', position: 6, duration: 0.5, track: 0 },
            { chord: 'G4n', position: 6.5, duration: 0.5, track: 0 },
            { chord: 'A4n', position: 7, duration: 1, track: 0 },
            { chord: 'G4n', position: 8, duration: 1, track: 0 },
            { chord: 'D5n', position: 9, duration: 1, track: 0 },
            { chord: 'C5n', position: 10, duration: 2, track: 0 },
            { chord: 'C', position: 0, duration: 2, track: 1 },
            { chord: 'F', position: 2, duration: 2, track: 1 },
            { chord: 'C', position: 4, duration: 2, track: 1 },
            { chord: 'G7', position: 6, duration: 2, track: 1 },
            { chord: 'C', position: 8, duration: 4, track: 1 }
        ];
        this.drawTimeline();
    }

    getChordColor(chord) {
        const colors = {
            // Single notes - cyan shades
            'C4n': '#00FFFF', 'D4n': '#00EEFF', 'E4n': '#00DDFF', 'F4n': '#00CCFF',
            'G4n': '#00BBFF', 'A4n': '#00AAFF', 'B4n': '#0099FF',
            'C5n': '#0088FF', 'D5n': '#0077FF', 'E5n': '#0066FF', 'F5n': '#0055FF',
            'G5n': '#0044FF', 'A5n': '#0033FF', 'B5n': '#0022FF',
            // Major - warm
            'C': '#FF6B6B', 'D': '#FF8C42', 'E': '#FFA726', 'F': '#FFA07A',
            'G': '#98D8C8', 'A': '#F7DC6F', 'B': '#FFD93D',
            'Db': '#FF7043', 'Eb': '#FFC470', 'Gb': '#FFB347', 'Ab': '#FFCC80', 'Bb': '#FFE66D',
            // Minor - cool
            'Cm': '#4ECDC4', 'Dm': '#45B7D1', 'Em': '#5DADE2', 'Fm': '#85C1E2',
            'Gm': '#7FB3D5', 'Am': '#6FA3D8', 'Bm': '#5499C7',
            'C#m': '#52B2BF', 'Ebm': '#48C9B0', 'F#m': '#1ABC9C', 'Abm': '#16A085', 'Bbm': '#45B39D',
            // 7th - purple/pink
            'C7': '#E74C3C', 'D7': '#EC7063', 'E7': '#F1948A', 'F7': '#F5B7B1',
            'G7': '#D98880', 'A7': '#CD6155', 'B7': '#C0392B',
            'Bb7': '#E74C3C', 'Eb7': '#EC7063', 'Ab7': '#F1948A',
            // Major 7th - light purple
            'Cmaj7': '#BB8FCE', 'Dmaj7': '#C39BD3', 'Emaj7': '#D7BDE2',
            'Fmaj7': '#E8DAEF', 'Gmaj7': '#AF7AC5', 'Amaj7': '#A569BD', 'Bmaj7': '#9B59B6',
            // Minor 7th - teal
            'Cm7': '#17A589', 'Dm7': '#1ABC9C', 'Em7': '#48C9B0',
            'Fm7': '#76D7C4', 'Gm7': '#45B39D', 'Am7': '#138D75', 'Bm7': '#0E6655',
            // Sus - yellow
            'Csus2': '#F4D03F', 'Csus4': '#F7DC6F', 'Dsus2': '#F9E79F', 'Dsus4': '#FAD7A0',
            'Esus2': '#F8B739', 'Esus4': '#F5B041', 'Fsus2': '#EB984E', 'Fsus4': '#E59866',
            'Gsus2': '#DC7633', 'Gsus4': '#D68910', 'Asus2': '#CA6F1E', 'Asus4': '#BA4A00',
            // 9th - pink
            'C9': '#FF69B4', 'D9': '#FF1493', 'E9': '#DB7093', 'F9': '#C71585',
            'G9': '#D02090', 'A9': '#FF00FF', 'Cm9': '#8B008B', 'Dm9': '#9400D3',
            'Em9': '#9932CC', 'Am9': '#BA55D3',
            // 6th - soft yellow
            'C6': '#FFE4B5', 'D6': '#FFDAB9', 'E6': '#FFEFD5', 'F6': '#FFEBCD',
            'G6': '#FFEAA7', 'A6': '#FDCB6E', 'Cm6': '#87CEEB', 'Dm6': '#87CEFA',
            'Em6': '#00BFFF', 'Am6': '#1E90FF',
            // Add9 - peach
            'Cadd9': '#FFDAB9', 'Dadd9': '#FFB347', 'Eadd9': '#FF9966',
            'Fadd9': '#FF8C69', 'Gadd9': '#FFA07A', 'Aadd9': '#FF7F50',
            // Power - red
            'C5': '#8B0000', 'D5': '#A52A2A', 'E5': '#B22222', 'F5': '#DC143C',
            'G5': '#CD5C5C', 'A5': '#E9967A', 'B5': '#FA8072',
            // Diminished - gray
            'Cdim': '#7F8C8D', 'Ddim': '#95A5A6', 'Edim': '#BDC3C7',
            'Fdim': '#AAB7B8', 'Gdim': '#99A3A4', 'Adim': '#85929E', 'Bdim': '#717D7E',
            // Augmented - orange
            'Caug': '#E67E22', 'Daug': '#D68910', 'Eaug': '#CA6F1E',
            'Faug': '#BA4A00', 'Gaug': '#A04000', 'Aaug': '#873600'
        };
        return colors[chord] || '#888';
    }
}

// Initialize app when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.app = new MusicApp();
});
