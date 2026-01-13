// Main Application Logic
class MusicApp {
    constructor() {
        this.canvas = document.getElementById('timeline');
        if (!this.canvas) {
            console.error('Canvas element not found!');
            return;
        }
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
        this.timelineBeats = 200; // start smaller to ensure canvas renders
        this.scrollX = 0;
        this.scrollY = 0;

        this.resizingBlock = null;
        this.resizeStartX = 0;
        this.resizeOriginalDuration = 0;
        this.resizeOriginalPosition = 0;
        this.resizingLeft = false;
        this.draggingBlock = null;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragOriginalPosition = 0;
        this.dragOriginalTrack = 0;
        this.selectedBlocks = [];
        this.clipboard = [];
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 50;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.currentOctave = 4;
        
        this.initUI();
        this.initCanvas();
        this.loadDefaultSong();
    }

    initUI() {
        // Populate chord palette
        this.updateChordPalette();
        
        // Octave selector
        const octaveSelect = document.getElementById('octaveSelect');
        if (octaveSelect) {
            octaveSelect.addEventListener('change', (e) => {
                this.currentOctave = parseInt(e.target.value);
                this.updateChordPalette();
            });
        }

        // Song selector
        const songSelect = document.getElementById('songSelect');
        if (songSelect) {
            songSelect.addEventListener('change', (e) => {
                const songIndex = parseInt(e.target.value);
                this.loadDefaultSong(songIndex);
            });
        }

        // Button event listeners
        document.getElementById('playBtn').addEventListener('click', () => this.play());
        document.getElementById('stopBtn').addEventListener('click', () => this.stop());
        document.getElementById('repeatBtn').addEventListener('click', () => this.toggleRepeat());
        document.getElementById('newBtn').addEventListener('click', () => this.newSong());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportWAV());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveProject());
        document.getElementById('loadBtn').addEventListener('click', () => this.loadProject());
        document.getElementById('clearBtn').addEventListener('click', () => this.clear());
        document.getElementById('scrollLeft').addEventListener('click', () => this.scroll(-500));
        document.getElementById('scrollRight').addEventListener('click', () => this.scroll(500));
        document.getElementById('trackHeightPlus').addEventListener('click', () => this.adjustTrackHeight(10));
        document.getElementById('trackHeightMinus').addEventListener('click', () => this.adjustTrackHeight(-10));
        document.getElementById('beatWidthPlus').addEventListener('click', () => this.adjustBeatWidth(10));
        document.getElementById('beatWidthMinus').addEventListener('click', () => this.adjustBeatWidth(-10));
        // Note: AI button is handled by ai-generator.js
        
        // Mouse wheel horizontal scrolling on timeline
        const timelineWrapper = document.querySelector('.timeline-wrapper');
        if (timelineWrapper) {
            timelineWrapper.addEventListener('wheel', (e) => {
                if (e.shiftKey) {
                    // Shift + wheel = horizontal scroll
                    e.preventDefault();
                    timelineWrapper.scrollLeft += e.deltaY;
                } else if (Math.abs(e.deltaX) > 0) {
                    // Trackpad horizontal scroll
                    e.preventDefault();
                    timelineWrapper.scrollLeft += e.deltaX;
                } else {
                    // Normal wheel = horizontal scroll
                    e.preventDefault();
                    timelineWrapper.scrollLeft += e.deltaY;
                }
            }, { passive: false });
        }
        
        // Keyboard event for Delete key
        document.addEventListener('keydown', (e) => this.onKeyDown(e));

        // Controls
        document.getElementById('bpmInput').addEventListener('change', (e) => {
            this.bpm = parseInt(e.target.value);
        });
        document.getElementById('instrumentSelect').addEventListener('change', (e) => {
            window.audioEngine.setInstrument(e.target.value);
        });

        // Canvas events
        this.canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            
            // Auto-scroll when dragging near edges
            const wrapper = this.canvas.parentElement;
            if (wrapper) {
                const rect = wrapper.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const wrapperWidth = wrapper.clientWidth;
                
                // Scroll right when within 100px of right edge
                if (mouseX > wrapperWidth - 100) {
                    wrapper.scrollLeft += 15;
                }
                // Scroll left when within 100px of left edge
                if (mouseX < 100 && wrapper.scrollLeft > 0) {
                    wrapper.scrollLeft -= 15;
                }
            }
        });
        this.canvas.addEventListener('drop', (e) => this.onDrop(e));
        this.canvas.addEventListener('contextmenu', (e) => this.onRightClick(e));
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.onMouseUp(e));
        this.canvas.parentElement.addEventListener('scroll', () => this.drawTimeline());
    }

    updateChordPalette() {
        const chordList = document.getElementById('chordList');
        chordList.innerHTML = ''; // Clear existing
        
        // Generate notes for current octave
        const octave = this.currentOctave;
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const singleNotes = notes.map(note => `${note}${octave}n`);
        
        // Also include notes from adjacent octaves for continuity
        const prevOctave = octave - 1;
        const nextOctave = octave + 1;
        const prevNotes = prevOctave >= 0 ? notes.slice(6).map(note => `${note}${prevOctave}n`) : [];
        const nextNotes = nextOctave <= 8 ? notes.slice(0, 6).map(note => `${note}${nextOctave}n`) : [];
        
        const allSingleNotes = [...prevNotes, ...singleNotes, ...nextNotes];
        
        const chordSections = [
            { name: `SINGLE NOTES (Octave ${octave})`, chords: allSingleNotes },
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
    }

    initCanvas() {
        const newWidth = this.timelineBeats * this.beatWidth;
        this.canvas.width = newWidth;
        this.canvas.height = 600;
        this.canvas.style.width = newWidth + 'px';
        this.canvas.style.height = '600px';
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
            // Main beat line (stronger)
            this.ctx.lineWidth = 2;
            this.ctx.strokeStyle = '#444';
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.headerHeight);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
            this.ctx.fillText(i.toString(), x + 5, this.headerHeight / 2 + 4);
            
            // Quarter beat subdivisions (lighter)
            this.ctx.lineWidth = 1;
            this.ctx.strokeStyle = '#282828';
            for (let q = 1; q < 4; q++) {
                const qx = x + (q * this.beatWidth / 4);
                this.ctx.beginPath();
                this.ctx.moveTo(qx, this.headerHeight);
                this.ctx.lineTo(qx, this.canvas.height);
                this.ctx.stroke();
            }
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

        // Handle multiple notes (use gradient or first note's color)
        const chords = block.chord.split(',');
        if (chords.length > 1) {
            // Multiple notes - use gradient
            const gradient = this.ctx.createLinearGradient(x + 2, y, x + 2, y + height);
            gradient.addColorStop(0, this.getChordColor(chords[0].trim()));
            gradient.addColorStop(1, this.getChordColor(chords[chords.length - 1].trim()));
            this.ctx.fillStyle = gradient;
        } else {
            this.ctx.fillStyle = this.getChordColor(block.chord);
        }
        
        // Highlight selected blocks with gold border
        if (this.selectedBlocks.includes(block)) {
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 4;
        } else {
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 2;
        }
        
        this.ctx.fillRect(x + 2, y, width, height);
        this.ctx.strokeRect(x + 2, y, width, height);

        // Draw resize handle (vertical line on right edge)
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.fillRect(x + width - 2, y + 5, 4, height - 10);

        // Display text - show all notes or abbreviate if too many
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        
        if (chords.length > 3) {
            this.ctx.fillText(`${chords.length} notes`, x + width / 2, y + height / 2 + 5);
        } else {
            const displayText = block.chord.length > 15 ? block.chord.substring(0, 12) + '...' : block.chord;
            this.ctx.fillText(displayText, x + width / 2, y + height / 2 + 5);
        }
    }

    onMouseDown(e) {
        if (e.button !== 0) return; // Only left click
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left + this.scrollX;
        const y = e.clientY - rect.top + this.scrollY;

        // Check if clicking near the right edge of any block (resize handle)
        for (let block of this.chordBlocks) {
            const bx = block.position * this.beatWidth;
            const by = this.headerHeight + block.track * this.trackHeight + 5;
            const bw = block.duration * this.beatWidth - 4;
            const bh = this.trackHeight - 10;

            // Check if clicking within 10px of left edge (resize from left)
            if (x >= bx - 10 && x <= bx + 10 && y >= by && y <= by + bh) {
                this.resizingBlock = block;
                this.resizeStartX = x;
                this.resizeOriginalDuration = block.duration;
                this.resizeOriginalPosition = block.position;
                this.resizingLeft = true;
                this.canvas.style.cursor = 'ew-resize';
                
                if (!this.selectedBlocks.includes(block)) {
                    if (e.ctrlKey) {
                        this.selectedBlocks.push(block);
                    } else {
                        this.selectedBlocks = [block];
                    }
                }
                this.drawTimeline();
                return;
            }

            // Check if clicking within 10px of right edge (resize from right)
            if (x >= bx + bw - 10 && x <= bx + bw + 10 && y >= by && y <= by + bh) {
                this.resizingBlock = block;
                this.resizeStartX = x;
                this.resizeOriginalDuration = block.duration;
                this.resizeOriginalPosition = block.position;
                this.resizingLeft = false;
                this.canvas.style.cursor = 'ew-resize';
                
                // Add to selection if not already selected
                if (!this.selectedBlocks.includes(block)) {
                    if (e.ctrlKey) {
                        this.selectedBlocks.push(block);
                    } else {
                        this.selectedBlocks = [block];
                    }
                }
                this.drawTimeline();
                return;
            }
            
            // Check if clicking on the block itself
            if (x >= bx && x <= bx + bw && y >= by && y <= by + bh) {
                // Ctrl+Click for multi-select
                if (e.ctrlKey) {
                    const index = this.selectedBlocks.indexOf(block);
                    if (index > -1) {
                        // Deselect if already selected
                        this.selectedBlocks.splice(index, 1);
                    } else {
                        // Add to selection
                        this.selectedBlocks.push(block);
                    }
                } else {
                    // Regular click - select and prepare to drag
                    this.selectedBlocks = [block];
                    this.draggingBlock = block;
                    this.dragStartX = x;
                    this.dragStartY = y;
                    this.dragOriginalPosition = block.position;
                    this.dragOriginalTrack = block.track;
                    this.canvas.style.cursor = 'move';
                }
                this.drawTimeline();
                return;
            }
        }
        
        // Clicked on empty area - deselect (unless Ctrl held)
        if (!e.ctrlKey) {
            this.selectedBlocks = [];
            this.drawTimeline();
        }
    }

    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left + this.scrollX;
        const y = e.clientY - rect.top + this.scrollY;
        
        // Track mouse position for paste
        this.lastMouseX = x;
        this.lastMouseY = y;

        // If dragging a block to move it
        if (this.draggingBlock) {
            const deltaX = x - this.dragStartX;
            const deltaY = y - this.dragStartY;
            // Snap to quarter beats
            const deltaBeat = Math.round(deltaX / this.beatWidth * 4) / 4;
            const deltaTrack = Math.round(deltaY / this.trackHeight);
            
            this.draggingBlock.position = Math.max(0, this.dragOriginalPosition + deltaBeat);
            this.draggingBlock.track = Math.max(0, this.dragOriginalTrack + deltaTrack);
            
            // Auto-scroll when dragging near edges
            // Auto-scroll timeline while dragging near viewport edges
            const wrapper = this.canvas.parentElement;
            if (wrapper) {
                const wrapperRect = wrapper.getBoundingClientRect();
                const mouseXInWrapper = e.clientX - wrapperRect.left;
                const scrollStep = 18;
                if (mouseXInWrapper > wrapperRect.width - 80) {
                    wrapper.scrollLeft += scrollStep;
                } else if (mouseXInWrapper < 80 && wrapper.scrollLeft > 0) {
                    wrapper.scrollLeft -= scrollStep;
                }
                // Keep internal scroll trackers in sync so hit-testing stays accurate
                this.scrollX = wrapper.scrollLeft;
                this.scrollY = wrapper.scrollTop;
            }
            
            this.canvas.style.cursor = 'move';
            this.expandTimelineIfNeeded();
            this.drawTimeline();
            return;
        }

        // If resizing
        if (this.resizingBlock) {
            const deltaX = x - this.resizeStartX;
            // Snap to quarter beats
            const deltaBeat = Math.round(deltaX / this.beatWidth * 4) / 4;
            
            if (this.resizingLeft) {
                // Resizing from left edge - adjust position and duration
                const newPosition = Math.max(0, this.resizeOriginalPosition + deltaBeat);
                const actualDelta = newPosition - this.resizeOriginalPosition;
                const newDuration = Math.max(0.25, this.resizeOriginalDuration - actualDelta);
                this.resizingBlock.position = newPosition;
                this.resizingBlock.duration = newDuration;
            } else {
                // Resizing from right edge - only adjust duration
                const newDuration = Math.max(0.25, this.resizeOriginalDuration + deltaBeat);
                this.resizingBlock.duration = newDuration;
            }
            
            // Auto-scroll when dragging near the right edge
            // Auto-scroll timeline while resizing near edges
            const wrapper = this.canvas.parentElement;
            if (wrapper) {
                const wrapperRect = wrapper.getBoundingClientRect();
                const mouseXInWrapper = e.clientX - wrapperRect.left;
                const scrollStep = 18;
                if (mouseXInWrapper > wrapperRect.width - 80) {
                    wrapper.scrollLeft += scrollStep;
                } else if (mouseXInWrapper < 80 && wrapper.scrollLeft > 0) {
                    wrapper.scrollLeft -= scrollStep;
                }
                this.scrollX = wrapper.scrollLeft;
                this.scrollY = wrapper.scrollTop;
            }
            
            // Expand timeline if needed
            this.expandTimelineIfNeeded();
            this.drawTimeline();
            return;
        }

        // Update cursor when hovering over resize handle
        let onResizeHandle = false;
        for (let block of this.chordBlocks) {
            const bx = block.position * this.beatWidth;
            const by = this.headerHeight + block.track * this.trackHeight + 5;
            const bw = block.duration * this.beatWidth - 4;
            const bh = this.trackHeight - 10;

            // Check left or right edge
            if ((x >= bx - 10 && x <= bx + 10 && y >= by && y <= by + bh) ||
                (x >= bx + bw - 10 && x <= bx + bw + 10 && y >= by && y <= by + bh)) {
                onResizeHandle = true;
                break;
            }
        }
        this.canvas.style.cursor = onResizeHandle ? 'ew-resize' : 'crosshair';
    }

    onMouseUp(e) {
        if (this.draggingBlock) {
            this.saveHistory();
            this.draggingBlock = null;
            this.canvas.style.cursor = 'crosshair';
            this.expandTimelineIfNeeded();
            this.drawTimeline();
            return;
        }
        
        if (this.resizingBlock) {
            this.resizingBlock = null;
            this.resizingLeft = false;
            this.canvas.style.cursor = 'crosshair';
            this.expandTimelineIfNeeded();
            this.drawTimeline();
        }
    }

    onDrop(e) {
        e.preventDefault();
        if (!this.draggingChord) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left + this.scrollX;
        const y = e.clientY - rect.top + this.scrollY;

        if (y < this.headerHeight) return;

        // Snap to quarter beats (0.25 increments)
        const beat = Math.round(x / this.beatWidth * 4) / 4;
        const track = Math.floor((y - this.headerHeight) / this.trackHeight);

        // Check if there's already a block at this exact position
        const existingBlock = this.chordBlocks.find(
            b => Math.abs(b.position - beat) < 0.01 && b.track === track
        );

        if (existingBlock && existingBlock.chord.indexOf(',') === -1 && this.draggingChord.indexOf(',') === -1) {
            // Combine notes into a chord (e.g., "C4n" + "E4n" = "C4n,E4n")
            this.saveHistory();
            existingBlock.chord = existingBlock.chord + ',' + this.draggingChord;
        } else {
            // Create new block
            this.saveHistory();
            this.chordBlocks.push({
                chord: this.draggingChord,
                position: beat,
                duration: 1,
                track: track
            });
        }

        this.draggingChord = null;
        this.expandTimelineIfNeeded();
        this.drawTimeline();
    }

    onRightClick(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left + this.scrollX;
        const y = e.clientY - rect.top + this.scrollY;

        // Check if right-clicking on a block
        let clickedBlock = null;
        for (let i = this.chordBlocks.length - 1; i >= 0; i--) {
            const block = this.chordBlocks[i];
            const bx = block.position * this.beatWidth;
            const by = this.headerHeight + block.track * this.trackHeight + 5;
            const bw = block.duration * this.beatWidth - 4;
            const bh = this.trackHeight - 10;

            if (x >= bx && x <= bx + bw && y >= by && y <= by + bh) {
                clickedBlock = block;
                break;
            }
        }

        // Show context menu
        this.showContextMenu(e.clientX, e.clientY, clickedBlock, x, y);
    }

    showContextMenu(screenX, screenY, block, canvasX, canvasY) {
        // Remove existing context menu if any
        const existingMenu = document.getElementById('contextMenu');
        if (existingMenu) existingMenu.remove();

        // Create context menu
        const menu = document.createElement('div');
        menu.id = 'contextMenu';
        menu.style.cssText = `
            position: fixed;
            left: ${screenX}px;
            top: ${screenY}px;
            background: #2c3e50;
            border: 2px solid #4CAF50;
            border-radius: 5px;
            padding: 5px 0;
            z-index: 10000;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        `;

        const menuItems = [];
        
        if (block) {
            menuItems.push({ label: '❌ Delete', action: () => {
                this.saveHistory();
                const index = this.chordBlocks.indexOf(block);
                if (index > -1) this.chordBlocks.splice(index, 1);
                this.drawTimeline();
            }});
            
            if (!this.selectedBlocks.includes(block)) {
                this.selectedBlocks = [block];
                this.drawTimeline();
            }
        }
        
        if (this.selectedBlocks.length > 0) {
            menuItems.push({ label: '📋 Copy', action: () => this.copySelected() });
        }
        
        if (this.clipboard.length > 0) {
            menuItems.push({ label: '📌 Paste', action: () => this.paste(canvasX, canvasY) });
        }

        menuItems.forEach(item => {
            const div = document.createElement('div');
            div.textContent = item.label;
            div.style.cssText = `
                padding: 8px 20px;
                cursor: pointer;
                color: white;
                font-weight: bold;
            `;
            div.onmouseover = () => div.style.background = '#34495e';
            div.onmouseout = () => div.style.background = 'transparent';
            div.onclick = () => {
                item.action();
                menu.remove();
            };
            menu.appendChild(div);
        });

        document.body.appendChild(menu);

        // Remove menu when clicking elsewhere
        const removeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', removeMenu);
            }
        };
        setTimeout(() => document.addEventListener('click', removeMenu), 100);
    }

    async play() {
        if (this.isPlaying || this.chordBlocks.length === 0) return;
        this.isPlaying = true;
        document.getElementById('playBtn').disabled = true;

        // Initialize audio engine first
        await window.audioEngine.init();

        do {
            const beatDuration = 60 / this.bpm;
            const sortedBlocks = [...this.chordBlocks].sort((a, b) => a.position - b.position);
            
            // Get start time reference
            const startTime = Date.now();

            // Schedule all blocks relative to start time
            for (const block of sortedBlocks) {
                if (!this.isPlaying) break;
                const blockStartTime = block.position * beatDuration * 1000;
                const duration = block.duration * beatDuration;
                
                setTimeout(() => {
                    if (this.isPlaying) {
                        window.audioEngine.playChord(block.chord, duration);
                    }
                }, blockStartTime);
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
        // Stop all scheduled sounds in Tone.js
        if (window.audioEngine && window.audioEngine.initialized) {
            Tone.Transport.stop();
            Tone.Transport.cancel();
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
        if (!wrapper) return;

        const maxScroll = Math.max(0, this.canvas.width - wrapper.clientWidth);
        wrapper.scrollLeft = Math.min(maxScroll, Math.max(0, wrapper.scrollLeft + amount));

        // Keep internal scroll positions accurate and redraw for consistent hit-testing
        this.scrollX = wrapper.scrollLeft;
        this.scrollY = wrapper.scrollTop;
        this.drawTimeline();
    }

    adjustTrackHeight(change) {
        this.trackHeight = Math.max(40, Math.min(150, this.trackHeight + change));
        document.getElementById('trackHeightDisplay').textContent = this.trackHeight;
        this.initCanvas();
        this.drawTimeline();
    }

    adjustBeatWidth(change) {
        this.beatWidth = Math.max(40, Math.min(150, this.beatWidth + change));
        document.getElementById('beatWidthDisplay').textContent = this.beatWidth;
        this.initCanvas();
        this.drawTimeline();
    }

    onKeyDown(e) {
        // Delete selected blocks
        if (e.key === 'Delete' && this.selectedBlocks.length > 0) {
            this.saveHistory();
            this.selectedBlocks.forEach(block => {
                const index = this.chordBlocks.indexOf(block);
                if (index > -1) {
                    this.chordBlocks.splice(index, 1);
                }
            });
            this.selectedBlocks = [];
            this.drawTimeline();
        }
        
        // Undo (Ctrl+Z)
        if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            this.undo();
        }
        
        // Redo (Ctrl+Shift+Z or Ctrl+Y)
        if (e.ctrlKey && ((e.shiftKey && e.key === 'Z') || e.key === 'y')) {
            e.preventDefault();
            this.redo();
        }
        
        // Copy (Ctrl+C)
        if (e.ctrlKey && e.key === 'c' && this.selectedBlocks.length > 0) {
            e.preventDefault();
            this.copySelected();
        }
        
        // Paste (Ctrl+V)
        if (e.ctrlKey && e.key === 'v' && this.clipboard.length > 0) {
            e.preventDefault();
            this.paste();
        }
        
        // Select All (Ctrl+A)
        if (e.ctrlKey && e.key === 'a') {
            e.preventDefault();
            this.selectedBlocks = [...this.chordBlocks];
            this.drawTimeline();
        }
    }

    saveHistory() {
        // Remove any redo history when making new changes
        this.history = this.history.slice(0, this.historyIndex + 1);
        
        // Save current state
        this.history.push(JSON.parse(JSON.stringify(this.chordBlocks)));
        
        // Limit history size
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.chordBlocks = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
            this.selectedBlocks = [];
            this.drawTimeline();
            console.log('Undo - restored to history index', this.historyIndex);
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.chordBlocks = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
            this.selectedBlocks = [];
            this.drawTimeline();
            console.log('Redo - restored to history index', this.historyIndex);
        }
    }

    copySelected() {
        if (this.selectedBlocks.length > 0) {
            this.clipboard = JSON.parse(JSON.stringify(this.selectedBlocks));
            console.log('Copied', this.clipboard.length, 'blocks');
        }
    }

    paste(mouseX = null, mouseY = null) {
        if (this.clipboard.length === 0) return;
        
        this.saveHistory();
        this.selectedBlocks = [];
        
        // Find minimum position and track from clipboard
        let minPosition = Infinity;
        let minTrack = Infinity;
        this.clipboard.forEach(block => {
            if (block.position < minPosition) minPosition = block.position;
            if (block.track < minTrack) minTrack = block.track;
        });
        
        // Use mouse position if provided, otherwise use last mouse position
        const x = mouseX !== null ? mouseX : this.lastMouseX;
        const y = mouseY !== null ? mouseY : this.lastMouseY;
        
        // Calculate target position and track from mouse/click position
        const targetPosition = Math.floor(x / this.beatWidth);
        const targetTrack = y < this.headerHeight ? 0 : Math.floor((y - this.headerHeight) / this.trackHeight);
        
        const positionOffset = targetPosition - minPosition;
        const trackOffset = targetTrack - minTrack;
        
        // Create new blocks at click position
        this.clipboard.forEach(block => {
            const newBlock = {
                chord: block.chord,
                position: block.position + positionOffset,
                duration: block.duration,
                track: Math.max(0, block.track + trackOffset),
                color: block.color
            };
            this.chordBlocks.push(newBlock);
            this.selectedBlocks.push(newBlock);
        });
        
        this.drawTimeline();
        console.log('Pasted', this.clipboard.length, 'blocks at position', targetPosition, 'track', targetTrack);
    }

    expandTimelineIfNeeded() {
        // Find the rightmost block
        let maxPosition = 0;
        for (const block of this.chordBlocks) {
            const endPosition = block.position + block.duration;
            if (endPosition > maxPosition) {
                maxPosition = endPosition;
            }
        }
        
        // If any block is within 100 beats of the end, expand by 500 beats
        if (maxPosition > this.timelineBeats - 100) {
            this.timelineBeats = Math.ceil(maxPosition / 100) * 100 + 500;
            this.initCanvas();
            console.log('Timeline expanded to', this.timelineBeats, 'beats');
        }
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

    loadDefaultSong(songIndex = -1) {
        // Load a specific song or random if songIndex is -1
        const songs = this.getDefaultSongs();
        let selectedIndex;
        
        if (songIndex === -1) {
            selectedIndex = Math.floor(Math.random() * songs.length);
        } else {
            selectedIndex = songIndex;
        }
        
        const selectedSong = songs[selectedIndex];
        this.chordBlocks = selectedSong.blocks;
        console.log('Loaded default song:', selectedSong.name);
        this.drawTimeline();
    }

    getDefaultSongs() {
        return [
            // 1. Twinkle Twinkle Little Star
            {
                name: "Twinkle Twinkle Little Star",
                blocks: [
                    { chord: 'C4n', position: 0, duration: 1, track: 0 },
                    { chord: 'C4n', position: 1, duration: 1, track: 0 },
                    { chord: 'G4n', position: 2, duration: 1, track: 0 },
                    { chord: 'G4n', position: 3, duration: 1, track: 0 },
                    { chord: 'A4n', position: 4, duration: 1, track: 0 },
                    { chord: 'A4n', position: 5, duration: 1, track: 0 },
                    { chord: 'G4n', position: 6, duration: 2, track: 0 },
                    { chord: 'F4n', position: 8, duration: 1, track: 0 },
                    { chord: 'F4n', position: 9, duration: 1, track: 0 },
                    { chord: 'E4n', position: 10, duration: 1, track: 0 },
                    { chord: 'E4n', position: 11, duration: 1, track: 0 },
                    { chord: 'D4n', position: 12, duration: 1, track: 0 },
                    { chord: 'D4n', position: 13, duration: 1, track: 0 },
                    { chord: 'C4n', position: 14, duration: 2, track: 0 },
                    { chord: 'C', position: 0, duration: 4, track: 1 },
                    { chord: 'F', position: 4, duration: 4, track: 1 },
                    { chord: 'C', position: 8, duration: 4, track: 1 },
                    { chord: 'G', position: 12, duration: 2, track: 1 },
                    { chord: 'C', position: 14, duration: 2, track: 1 }
                ]
            },
            // 2. Happy Birthday (corrected)
            {
                name: "Happy Birthday",
                blocks: [
                    { chord: 'G4n', position: 0, duration: 0.75, track: 0 },
                    { chord: 'G4n', position: 0.75, duration: 0.25, track: 0 },
                    { chord: 'A4n', position: 1, duration: 1, track: 0 },
                    { chord: 'G4n', position: 2, duration: 1, track: 0 },
                    { chord: 'C5n', position: 3, duration: 1, track: 0 },
                    { chord: 'B4n', position: 4, duration: 2, track: 0 },
                    { chord: 'G4n', position: 6, duration: 0.75, track: 0 },
                    { chord: 'G4n', position: 6.75, duration: 0.25, track: 0 },
                    { chord: 'A4n', position: 7, duration: 1, track: 0 },
                    { chord: 'G4n', position: 8, duration: 1, track: 0 },
                    { chord: 'D5n', position: 9, duration: 1, track: 0 },
                    { chord: 'C5n', position: 10, duration: 2, track: 0 },
                    { chord: 'C', position: 0, duration: 3, track: 1 },
                    { chord: 'F', position: 3, duration: 3, track: 1 },
                    { chord: 'C', position: 6, duration: 3, track: 1 },
                    { chord: 'G', position: 9, duration: 3, track: 1 }
                ]
            },
            // 3. Mary Had a Little Lamb
            {
                name: "Mary Had a Little Lamb",
                blocks: [
                    { chord: 'E4n', position: 0, duration: 1, track: 0 },
                    { chord: 'D4n', position: 1, duration: 1, track: 0 },
                    { chord: 'C4n', position: 2, duration: 1, track: 0 },
                    { chord: 'D4n', position: 3, duration: 1, track: 0 },
                    { chord: 'E4n', position: 4, duration: 1, track: 0 },
                    { chord: 'E4n', position: 5, duration: 1, track: 0 },
                    { chord: 'E4n', position: 6, duration: 2, track: 0 },
                    { chord: 'D4n', position: 8, duration: 1, track: 0 },
                    { chord: 'D4n', position: 9, duration: 1, track: 0 },
                    { chord: 'D4n', position: 10, duration: 2, track: 0 },
                    { chord: 'E4n', position: 12, duration: 1, track: 0 },
                    { chord: 'G4n', position: 13, duration: 1, track: 0 },
                    { chord: 'G4n', position: 14, duration: 2, track: 0 },
                    { chord: 'C', position: 0, duration: 4, track: 1 },
                    { chord: 'G', position: 4, duration: 4, track: 1 },
                    { chord: 'C', position: 8, duration: 8, track: 1 }
                ]
            },
            // 4. Jingle Bells (Chorus)
            {
                name: "Jingle Bells",
                blocks: [
                    { chord: 'E4n', position: 0, duration: 1, track: 0 },
                    { chord: 'E4n', position: 1, duration: 1, track: 0 },
                    { chord: 'E4n', position: 2, duration: 2, track: 0 },
                    { chord: 'E4n', position: 4, duration: 1, track: 0 },
                    { chord: 'E4n', position: 5, duration: 1, track: 0 },
                    { chord: 'E4n', position: 6, duration: 2, track: 0 },
                    { chord: 'E4n', position: 8, duration: 1, track: 0 },
                    { chord: 'G4n', position: 9, duration: 1, track: 0 },
                    { chord: 'C4n', position: 10, duration: 1.5, track: 0 },
                    { chord: 'D4n', position: 11.5, duration: 0.5, track: 0 },
                    { chord: 'E4n', position: 12, duration: 4, track: 0 },
                    { chord: 'C', position: 0, duration: 4, track: 1 },
                    { chord: 'C', position: 4, duration: 4, track: 1 },
                    { chord: 'G', position: 8, duration: 2, track: 1 },
                    { chord: 'C', position: 10, duration: 6, track: 1 }
                ]
            },
            // 5. Ode to Joy
            {
                name: "Ode to Joy",
                blocks: [
                    { chord: 'E4n', position: 0, duration: 1, track: 0 },
                    { chord: 'E4n', position: 1, duration: 1, track: 0 },
                    { chord: 'F4n', position: 2, duration: 1, track: 0 },
                    { chord: 'G4n', position: 3, duration: 1, track: 0 },
                    { chord: 'G4n', position: 4, duration: 1, track: 0 },
                    { chord: 'F4n', position: 5, duration: 1, track: 0 },
                    { chord: 'E4n', position: 6, duration: 1, track: 0 },
                    { chord: 'D4n', position: 7, duration: 1, track: 0 },
                    { chord: 'C4n', position: 8, duration: 1, track: 0 },
                    { chord: 'C4n', position: 9, duration: 1, track: 0 },
                    { chord: 'D4n', position: 10, duration: 1, track: 0 },
                    { chord: 'E4n', position: 11, duration: 1, track: 0 },
                    { chord: 'E4n', position: 12, duration: 1.5, track: 0 },
                    { chord: 'D4n', position: 13.5, duration: 0.5, track: 0 },
                    { chord: 'D4n', position: 14, duration: 2, track: 0 },
                    { chord: 'C', position: 0, duration: 4, track: 1 },
                    { chord: 'G', position: 4, duration: 4, track: 1 },
                    { chord: 'Am', position: 8, duration: 4, track: 1 },
                    { chord: 'G', position: 12, duration: 4, track: 1 }
                ]
            },
            // 6. Für Elise (Opening)
            {
                name: "Für Elise",
                blocks: [
                    { chord: 'E5n', position: 0, duration: 0.5, track: 0 },
                    { chord: 'D#5n', position: 0.5, duration: 0.5, track: 0 },
                    { chord: 'E5n', position: 1, duration: 0.5, track: 0 },
                    { chord: 'D#5n', position: 1.5, duration: 0.5, track: 0 },
                    { chord: 'E5n', position: 2, duration: 0.5, track: 0 },
                    { chord: 'B4n', position: 2.5, duration: 0.5, track: 0 },
                    { chord: 'D5n', position: 3, duration: 0.5, track: 0 },
                    { chord: 'C5n', position: 3.5, duration: 0.5, track: 0 },
                    { chord: 'A4n', position: 4, duration: 1.5, track: 0 },
                    { chord: 'C4n', position: 5.5, duration: 0.5, track: 0 },
                    { chord: 'E4n', position: 6, duration: 0.5, track: 0 },
                    { chord: 'A4n', position: 6.5, duration: 0.5, track: 0 },
                    { chord: 'B4n', position: 7, duration: 1.5, track: 0 },
                    { chord: 'Am', position: 0, duration: 4, track: 1 },
                    { chord: 'E', position: 4, duration: 2, track: 1 },
                    { chord: 'Am', position: 6, duration: 2, track: 1 }
                ]
            },
            // 7. Canon in D (Pachelbel)
            {
                name: "Canon in D",
                blocks: [
                    { chord: 'D4n', position: 0, duration: 2, track: 0 },
                    { chord: 'F#4n', position: 2, duration: 2, track: 0 },
                    { chord: 'A4n', position: 4, duration: 2, track: 0 },
                    { chord: 'G4n', position: 6, duration: 2, track: 0 },
                    { chord: 'D4n', position: 8, duration: 2, track: 0 },
                    { chord: 'G4n', position: 10, duration: 2, track: 0 },
                    { chord: 'F#4n', position: 12, duration: 2, track: 0 },
                    { chord: 'E4n', position: 14, duration: 2, track: 0 },
                    { chord: 'D', position: 0, duration: 2, track: 1 },
                    { chord: 'A', position: 2, duration: 2, track: 1 },
                    { chord: 'Bm', position: 4, duration: 2, track: 1 },
                    { chord: 'F#m', position: 6, duration: 2, track: 1 },
                    { chord: 'G', position: 8, duration: 2, track: 1 },
                    { chord: 'D', position: 10, duration: 2, track: 1 },
                    { chord: 'G', position: 12, duration: 2, track: 1 },
                    { chord: 'A', position: 14, duration: 2, track: 1 }
                ]
            },
            // 8. Amazing Grace
            {
                name: "Amazing Grace",
                blocks: [
                    { chord: 'G4n', position: 0, duration: 1.5, track: 0 },
                    { chord: 'C5n', position: 1.5, duration: 0.5, track: 0 },
                    { chord: 'C5n', position: 2, duration: 1, track: 0 },
                    { chord: 'E5n', position: 3, duration: 1, track: 0 },
                    { chord: 'C5n', position: 4, duration: 1, track: 0 },
                    { chord: 'E5n', position: 5, duration: 1, track: 0 },
                    { chord: 'D5n', position: 6, duration: 2, track: 0 },
                    { chord: 'B4n', position: 8, duration: 1.5, track: 0 },
                    { chord: 'G4n', position: 9.5, duration: 0.5, track: 0 },
                    { chord: 'G4n', position: 10, duration: 1, track: 0 },
                    { chord: 'C5n', position: 11, duration: 1, track: 0 },
                    { chord: 'C5n', position: 12, duration: 2, track: 0 },
                    { chord: 'C', position: 0, duration: 4, track: 1 },
                    { chord: 'Am', position: 4, duration: 2, track: 1 },
                    { chord: 'G', position: 6, duration: 2, track: 1 },
                    { chord: 'G', position: 8, duration: 4, track: 1 },
                    { chord: 'C', position: 12, duration: 2, track: 1 }
                ]
            },
            // 9. Row Row Row Your Boat
            {
                name: "Row Row Row Your Boat",
                blocks: [
                    { chord: 'C4n', position: 0, duration: 1, track: 0 },
                    { chord: 'C4n', position: 1, duration: 1, track: 0 },
                    { chord: 'C4n', position: 2, duration: 0.75, track: 0 },
                    { chord: 'D4n', position: 2.75, duration: 0.25, track: 0 },
                    { chord: 'E4n', position: 3, duration: 1, track: 0 },
                    { chord: 'E4n', position: 4, duration: 0.75, track: 0 },
                    { chord: 'D4n', position: 4.75, duration: 0.25, track: 0 },
                    { chord: 'E4n', position: 5, duration: 0.75, track: 0 },
                    { chord: 'F4n', position: 5.75, duration: 0.25, track: 0 },
                    { chord: 'G4n', position: 6, duration: 2, track: 0 },
                    { chord: 'C5n', position: 8, duration: 0.5, track: 0 },
                    { chord: 'C5n', position: 8.5, duration: 0.5, track: 0 },
                    { chord: 'C5n', position: 9, duration: 0.5, track: 0 },
                    { chord: 'G4n', position: 9.5, duration: 0.5, track: 0 },
                    { chord: 'G4n', position: 10, duration: 0.5, track: 0 },
                    { chord: 'G4n', position: 10.5, duration: 0.5, track: 0 },
                    { chord: 'E4n', position: 11, duration: 0.5, track: 0 },
                    { chord: 'E4n', position: 11.5, duration: 0.5, track: 0 },
                    { chord: 'E4n', position: 12, duration: 0.5, track: 0 },
                    { chord: 'C4n', position: 12.5, duration: 0.5, track: 0 },
                    { chord: 'C4n', position: 13, duration: 0.5, track: 0 },
                    { chord: 'C4n', position: 13.5, duration: 0.5, track: 0 },
                    { chord: 'G4n', position: 14, duration: 0.75, track: 0 },
                    { chord: 'F4n', position: 14.75, duration: 0.25, track: 0 },
                    { chord: 'E4n', position: 15, duration: 0.75, track: 0 },
                    { chord: 'D4n', position: 15.75, duration: 0.25, track: 0 },
                    { chord: 'C4n', position: 16, duration: 2, track: 0 },
                    { chord: 'C', position: 0, duration: 4, track: 1 },
                    { chord: 'C', position: 4, duration: 4, track: 1 },
                    { chord: 'G', position: 8, duration: 4, track: 1 },
                    { chord: 'C', position: 12, duration: 6, track: 1 }
                ]
            },
            // 10. When the Saints Go Marching In
            {
                name: "When the Saints Go Marching In",
                blocks: [
                    { chord: 'C4n', position: 0, duration: 1.5, track: 0 },
                    { chord: 'E4n', position: 1.5, duration: 0.5, track: 0 },
                    { chord: 'F4n', position: 2, duration: 1.5, track: 0 },
                    { chord: 'G4n', position: 3.5, duration: 0.5, track: 0 },
                    { chord: 'G4n', position: 4, duration: 4, track: 0 },
                    { chord: 'C4n', position: 8, duration: 1.5, track: 0 },
                    { chord: 'E4n', position: 9.5, duration: 0.5, track: 0 },
                    { chord: 'F4n', position: 10, duration: 1.5, track: 0 },
                    { chord: 'G4n', position: 11.5, duration: 0.5, track: 0 },
                    { chord: 'G4n', position: 12, duration: 4, track: 0 },
                    { chord: 'C', position: 0, duration: 4, track: 1 },
                    { chord: 'F', position: 4, duration: 4, track: 1 },
                    { chord: 'C', position: 8, duration: 4, track: 1 },
                    { chord: 'G7', position: 12, duration: 4, track: 1 }
                ]
            }
        ];
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
