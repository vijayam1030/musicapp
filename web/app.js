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
        this.maxCanvasWidth = 60000; // guard against browser canvas size limits
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
        this.updateChordPalette();

        const octaveSelect = document.getElementById('octaveSelect');
        if (octaveSelect) {
            octaveSelect.addEventListener('change', (e) => {
                this.currentOctave = parseInt(e.target.value, 10);
                this.updateChordPalette();
            });
        }

        const songSelect = document.getElementById('songSelect');
        if (songSelect) {
            songSelect.addEventListener('change', (e) => {
                const songIndex = parseInt(e.target.value, 10);
                this.loadDefaultSong(songIndex);
            });
        }

        const qualitySelect = document.getElementById('qualitySelect');
        if (qualitySelect) {
            qualitySelect.addEventListener('change', (e) => {
                const mode = e.target.value === 'local-hq' ? 'local-hq' : 'standard';
                window.audioEngine.setQualityMode(mode);
            });
        }

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

        const timelineWrapper = document.querySelector('.timeline-wrapper');
        if (timelineWrapper) {
            timelineWrapper.addEventListener('wheel', (e) => {
                if (e.shiftKey) {
                    e.preventDefault();
                    timelineWrapper.scrollLeft += e.deltaY;
                } else if (Math.abs(e.deltaX) > 0) {
                    e.preventDefault();
                    timelineWrapper.scrollLeft += e.deltaX;
                } else {
                    e.preventDefault();
                    timelineWrapper.scrollLeft += e.deltaY;
                }
            }, { passive: false });

            timelineWrapper.addEventListener('scroll', () => {
                this.scrollX = timelineWrapper.scrollLeft;
                this.scrollY = timelineWrapper.scrollTop;
            });
        }

        document.addEventListener('keydown', (e) => this.onKeyDown(e));

        document.getElementById('bpmInput').addEventListener('change', (e) => {
            this.bpm = parseInt(e.target.value, 10);
        });
        const keySelect = document.getElementById('keySelect');
        if (keySelect) {
            keySelect.addEventListener('change', (e) => {
                this.currentKey = e.target.value;
            });
        }
        document.getElementById('instrumentSelect').addEventListener('change', (e) => {
            window.audioEngine.setInstrument(e.target.value);
        });
    }

    updateChordPalette() {
        const chordList = document.getElementById('chordList');
        if (!chordList) return;

        chordList.innerHTML = '';

        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octaveNotes = noteNames.map(n => `${n}${this.currentOctave}n`);
        const chordNames = ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim', 'G7', 'Cmaj7', 'Fmaj7'];

        const makeDraggable = (label, value) => {
            const item = document.createElement('div');
            item.className = 'chord-item';
            item.textContent = label;
            item.draggable = true;
            item.addEventListener('dragstart', () => {
                this.draggingChord = value;
            });
            item.addEventListener('dragend', () => {
                this.draggingChord = null;
            });
            item.addEventListener('click', () => {
                // Quick add near current viewport
                const wrapper = this.canvas.parentElement;
                const baseBeat = Math.round((this.scrollX + (wrapper ? wrapper.clientWidth * 0.2 : 0)) / this.beatWidth);
                const track = 0;
                this.saveHistory();
                this.chordBlocks.push({ chord: value, position: baseBeat, duration: 1, track });
                this.expandTimelineIfNeeded();
                this.drawTimeline();
            });
            chordList.appendChild(item);
        };

        const notesHeader = document.createElement('div');
        notesHeader.textContent = `Notes (Octave ${this.currentOctave})`;
        notesHeader.style.fontWeight = 'bold';
        notesHeader.style.marginBottom = '6px';
        chordList.appendChild(notesHeader);

        octaveNotes.forEach(n => makeDraggable(n, n));

        const chordHeader = document.createElement('div');
        chordHeader.textContent = 'Chords';
        chordHeader.style.fontWeight = 'bold';
        chordHeader.style.margin = '10px 0 6px 0';
        chordList.appendChild(chordHeader);

        chordNames.forEach(c => makeDraggable(c, c));
    }

    initCanvas() {
        const maxTrack = this.chordBlocks.reduce((max, b) => Math.max(max, b.track), 0);
        const trackCount = Math.max(3, maxTrack + 1);

        this.canvas.width = Math.min(this.timelineBeats * this.beatWidth, this.maxCanvasWidth);
        this.canvas.height = this.headerHeight + trackCount * this.trackHeight + 40;

        if (!this.canvasListenersAttached) {
            this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
            this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
            this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
            this.canvas.addEventListener('mouseleave', () => {
                this.draggingBlock = null;
                this.resizingBlock = null;
                this.canvas.style.cursor = 'crosshair';
            });
            this.canvas.addEventListener('dragover', (e) => {
                e.preventDefault();
            });
            this.canvas.addEventListener('drop', (e) => this.onDrop(e));
            this.canvas.addEventListener('contextmenu', (e) => this.onRightClick(e));
            this.canvasListenersAttached = true;
        }

        this.drawTimeline();
    }

    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left + this.scrollX;
        const y = e.clientY - rect.top + this.scrollY;

        this.lastMouseX = x;
        this.lastMouseY = y;

        // Hit test blocks from topmost to bottom
        for (let i = this.chordBlocks.length - 1; i >= 0; i--) {
            const block = this.chordBlocks[i];
            const bx = block.position * this.beatWidth;
            const by = this.headerHeight + block.track * this.trackHeight + 5;
            const bw = block.duration * this.beatWidth - 4;
            const bh = this.trackHeight - 10;

            const onLeft = x >= bx - 8 && x <= bx + 8 && y >= by && y <= by + bh;
            const onRight = x >= bx + bw - 8 && x <= bx + bw + 8 && y >= by && y <= by + bh;

            if (onLeft || onRight) {
                this.resizingBlock = block;
                this.resizingLeft = onLeft;
                this.resizeStartX = x;
                this.resizeOriginalDuration = block.duration;
                this.resizeOriginalPosition = block.position;
                this.canvas.style.cursor = 'ew-resize';
                return;
            }

            if (x >= bx && x <= bx + bw && y >= by && y <= by + bh) {
                if (e.ctrlKey) {
                    const idx = this.selectedBlocks.indexOf(block);
                    if (idx > -1) {
                        this.selectedBlocks.splice(idx, 1);
                    } else {
                        this.selectedBlocks.push(block);
                    }
                } else {
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

        if (!e.ctrlKey) {
            this.selectedBlocks = [];
            this.drawTimeline();
        }
    }

    drawTimeline() {
        const ctx = this.ctx;
        if (!ctx) return;

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Background
        ctx.fillStyle = '#1e2a35';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Track lanes
        const maxTrack = this.chordBlocks.reduce((max, b) => Math.max(max, b.track), 0);
        const trackCount = Math.max(3, maxTrack + 1);
        for (let t = 0; t < trackCount; t++) {
            const y = this.headerHeight + t * this.trackHeight;
            ctx.fillStyle = t % 2 === 0 ? '#243443' : '#203040';
            ctx.fillRect(0, y, this.canvas.width, this.trackHeight);
        }

        // Grid lines and beat numbers
        ctx.strokeStyle = '#37516a';
        ctx.lineWidth = 1;
        for (let beat = 0; beat <= this.timelineBeats; beat++) {
            const x = beat * this.beatWidth;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();

            if (beat % 4 === 0) {
                ctx.fillStyle = '#9ad06e';
                ctx.font = '12px Arial';
                ctx.fillText(`${beat / 4 | 0}|${beat % 4}`, x + 4, this.headerHeight - 6);
            }
        }

        // Header line
        ctx.fillStyle = '#2f4b63';
        ctx.fillRect(0, 0, this.canvas.width, this.headerHeight);

        // Draw blocks
        for (const block of this.chordBlocks) {
            const x = block.position * this.beatWidth;
            const y = this.headerHeight + block.track * this.trackHeight + 5;
            const w = Math.max(10, block.duration * this.beatWidth - 4);
            const h = this.trackHeight - 10;

            const baseColor = this.getChordColor(block.chord.split(',')[0]);
            ctx.fillStyle = baseColor;
            ctx.strokeStyle = '#1a252f';
            ctx.lineWidth = 2;
            ctx.fillRect(x, y, w, h);
            ctx.strokeRect(x, y, w, h);

            ctx.fillStyle = 'white';
            ctx.font = '14px Arial';
            ctx.fillText(block.chord, x + 6, y + h / 2 + 5);

            if (this.selectedBlocks.includes(block)) {
                ctx.strokeStyle = '#ffeb3b';
                ctx.lineWidth = 3;
                ctx.strokeRect(x - 1, y - 1, w + 2, h + 2);
            }
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
        // Ignore shortcuts when typing in inputs/textareas/selects
        const tag = (e.target && e.target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') {
            return;
        }

        // Quick note entry: letter keys A-G drop a note at the current mouse position/viewport
        const noteKey = e.key.toLowerCase();
        const noteMap = { a: 'A', b: 'B', c: 'C', d: 'D', e: 'E', f: 'F', g: 'G' };
        if (noteMap[noteKey]) {
            e.preventDefault();
            this.addNoteFromShortcut(noteMap[noteKey]);
            return;
        }

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

    addNoteFromShortcut(baseNote) {
        // Use last known mouse position; if none, drop near the current viewport start
        const wrapper = this.canvas.parentElement;
        const x = this.lastMouseX || (this.scrollX + (wrapper ? wrapper.clientWidth * 0.1 : 0));
        const y = this.lastMouseY || (this.headerHeight + this.trackHeight * 0.5);

        const beat = Math.max(0, Math.round(x / this.beatWidth * 4) / 4);
        const track = Math.max(0, Math.floor((y - this.headerHeight) / this.trackHeight));

        const noteName = `${baseNote}${this.currentOctave}n`;

        this.saveHistory();
        const newBlock = {
            chord: noteName,
            position: beat,
            duration: 1,
            track
        };
        this.chordBlocks.push(newBlock);
        this.selectedBlocks = [newBlock];
        this.expandTimelineIfNeeded();
        this.drawTimeline();
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

        const wrapper = this.canvas.parentElement;
        const visibleEnd = wrapper ? this.scrollX + wrapper.clientWidth : 0;
        const nearBlockEnd = maxPosition > this.timelineBeats - 100;
        const nearViewportEnd = wrapper ? (visibleEnd > this.canvas.width - 200) : false;

        if (nearBlockEnd || nearViewportEnd) {
            const beatsFromBlocks = Math.ceil((maxPosition + 200) / 100) * 100;
            const beatsFromViewport = Math.ceil(((this.scrollX + (wrapper ? wrapper.clientWidth : 0) + 800) / this.beatWidth) / 100) * 100;
            const unclampedTarget = Math.max(this.timelineBeats + 200, beatsFromBlocks, beatsFromViewport);

            // Respect canvas width cap
            const maxBeatsAllowed = Math.floor(this.maxCanvasWidth / this.beatWidth) - 1;
            const targetBeats = Math.min(unclampedTarget, maxBeatsAllowed);

            const prevScrollLeft = wrapper ? wrapper.scrollLeft : 0;
            const prevScrollTop = wrapper ? wrapper.scrollTop : 0;

            this.timelineBeats = targetBeats;
            this.initCanvas();

            if (wrapper) {
                wrapper.scrollLeft = prevScrollLeft;
                wrapper.scrollTop = prevScrollTop;
            }
            console.log('Timeline expanded to', this.timelineBeats, 'beats');
        }
    }

    async saveProject() {
        const data = {
            version: '1.0',
            bpm: this.bpm,
            key: this.currentKey,
            blocks: this.chordBlocks
        };
        const json = JSON.stringify(data, null, 2);

        // Prefer the native file picker so the user can choose a folder (Chrome/Edge secure context)
        if (window.showSaveFilePicker) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: 'music-project.json',
                    types: [{ description: 'JSON Project', accept: { 'application/json': ['.json'] } }]
                });
                const writable = await handle.createWritable();
                await writable.write(json);
                await writable.close();
                return;
            } catch (err) {
                console.warn('showSaveFilePicker failed, falling back to download:', err);
            }
        }

        // Fallback: trigger a download (likely goes to Downloads)
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
        this.initCanvas();
    }

    getDefaultSongs() {
        return [
            {
                name: "Twinkle Twinkle Little Star (Full)",
                blocks: [
                    // Melody (track 0)
                    { chord: 'C4n', position: 0, duration: 1, track: 0 }, { chord: 'C4n', position: 1, duration: 1, track: 0 },
                    { chord: 'G4n', position: 2, duration: 1, track: 0 }, { chord: 'G4n', position: 3, duration: 1, track: 0 },
                    { chord: 'A4n', position: 4, duration: 1, track: 0 }, { chord: 'A4n', position: 5, duration: 1, track: 0 },
                    { chord: 'G4n', position: 6, duration: 2, track: 0 },
                    { chord: 'F4n', position: 8, duration: 1, track: 0 }, { chord: 'F4n', position: 9, duration: 1, track: 0 },
                    { chord: 'E4n', position: 10, duration: 1, track: 0 }, { chord: 'E4n', position: 11, duration: 1, track: 0 },
                    { chord: 'D4n', position: 12, duration: 1, track: 0 }, { chord: 'D4n', position: 13, duration: 1, track: 0 },
                    { chord: 'C4n', position: 14, duration: 2, track: 0 },
                    // Second phrase
                    { chord: 'G4n', position: 16, duration: 1, track: 0 }, { chord: 'G4n', position: 17, duration: 1, track: 0 },
                    { chord: 'F4n', position: 18, duration: 1, track: 0 }, { chord: 'F4n', position: 19, duration: 1, track: 0 },
                    { chord: 'E4n', position: 20, duration: 1, track: 0 }, { chord: 'E4n', position: 21, duration: 1, track: 0 },
                    { chord: 'D4n', position: 22, duration: 2, track: 0 },
                    { chord: 'G4n', position: 24, duration: 1, track: 0 }, { chord: 'G4n', position: 25, duration: 1, track: 0 },
                    { chord: 'F4n', position: 26, duration: 1, track: 0 }, { chord: 'F4n', position: 27, duration: 1, track: 0 },
                    { chord: 'E4n', position: 28, duration: 1, track: 0 }, { chord: 'E4n', position: 29, duration: 1, track: 0 },
                    { chord: 'D4n', position: 30, duration: 2, track: 0 },
                    { chord: 'C4n', position: 32, duration: 1, track: 0 }, { chord: 'C4n', position: 33, duration: 1, track: 0 },
                    { chord: 'G4n', position: 34, duration: 1, track: 0 }, { chord: 'G4n', position: 35, duration: 1, track: 0 },
                    { chord: 'A4n', position: 36, duration: 1, track: 0 }, { chord: 'A4n', position: 37, duration: 1, track: 0 },
                    { chord: 'G4n', position: 38, duration: 2, track: 0 },
                    { chord: 'F4n', position: 40, duration: 1, track: 0 }, { chord: 'F4n', position: 41, duration: 1, track: 0 },
                    { chord: 'E4n', position: 42, duration: 1, track: 0 }, { chord: 'E4n', position: 43, duration: 1, track: 0 },
                    { chord: 'D4n', position: 44, duration: 1, track: 0 }, { chord: 'D4n', position: 45, duration: 1, track: 0 },
                    { chord: 'C4n', position: 46, duration: 2, track: 0 },
                    // Harmony (track 1)
                    { chord: 'C', position: 0, duration: 8, track: 1 },
                    { chord: 'F', position: 8, duration: 8, track: 1 },
                    { chord: 'C', position: 16, duration: 8, track: 1 },
                    { chord: 'G', position: 24, duration: 8, track: 1 },
                    { chord: 'C', position: 32, duration: 8, track: 1 },
                    { chord: 'F', position: 40, duration: 8, track: 1 },
                    // Bass (track 2)
                    { chord: 'C3n', position: 0, duration: 2, track: 2 }, { chord: 'C3n', position: 2, duration: 2, track: 2 },
                    { chord: 'F2n', position: 8, duration: 4, track: 2 }, { chord: 'G2n', position: 24, duration: 4, track: 2 },
                    { chord: 'C3n', position: 32, duration: 4, track: 2 }, { chord: 'F2n', position: 40, duration: 4, track: 2 }
                ]
            },
            {
                name: "Happy Birthday (Full)",
                blocks: [
                    // Melody
                    { chord: 'G4n', position: 0, duration: 0.75, track: 0 }, { chord: 'G4n', position: 0.75, duration: 0.25, track: 0 },
                    { chord: 'A4n', position: 1, duration: 1, track: 0 }, { chord: 'G4n', position: 2, duration: 1, track: 0 },
                    { chord: 'C5n', position: 3, duration: 1, track: 0 }, { chord: 'B4n', position: 4, duration: 2, track: 0 },
                    { chord: 'G4n', position: 6, duration: 0.75, track: 0 }, { chord: 'G4n', position: 6.75, duration: 0.25, track: 0 },
                    { chord: 'A4n', position: 7, duration: 1, track: 0 }, { chord: 'G4n', position: 8, duration: 1, track: 0 },
                    { chord: 'D5n', position: 9, duration: 1, track: 0 }, { chord: 'C5n', position: 10, duration: 2, track: 0 },
                    { chord: 'G4n', position: 12, duration: 0.75, track: 0 }, { chord: 'G4n', position: 12.75, duration: 0.25, track: 0 },
                    { chord: 'G5n', position: 13, duration: 1, track: 0 }, { chord: 'E5n', position: 14, duration: 1, track: 0 },
                    { chord: 'C5n', position: 15, duration: 1, track: 0 }, { chord: 'B4n', position: 16, duration: 1, track: 0 },
                    { chord: 'A4n', position: 17, duration: 2, track: 0 },
                    { chord: 'F5n', position: 19, duration: 0.75, track: 0 }, { chord: 'F5n', position: 19.75, duration: 0.25, track: 0 },
                    { chord: 'E5n', position: 20, duration: 1, track: 0 }, { chord: 'C5n', position: 21, duration: 1, track: 0 },
                    { chord: 'D5n', position: 22, duration: 1, track: 0 }, { chord: 'C5n', position: 23, duration: 2, track: 0 },
                    // Chords
                    { chord: 'C', position: 0, duration: 4, track: 1 }, { chord: 'F', position: 4, duration: 4, track: 1 },
                    { chord: 'C', position: 8, duration: 4, track: 1 }, { chord: 'G', position: 12, duration: 4, track: 1 },
                    { chord: 'C', position: 16, duration: 4, track: 1 }, { chord: 'F', position: 20, duration: 4, track: 1 },
                    // Bass
                    { chord: 'C3n', position: 0, duration: 2, track: 2 }, { chord: 'F2n', position: 4, duration: 2, track: 2 },
                    { chord: 'C3n', position: 8, duration: 2, track: 2 }, { chord: 'G2n', position: 12, duration: 2, track: 2 },
                    { chord: 'C3n', position: 16, duration: 2, track: 2 }, { chord: 'F2n', position: 20, duration: 2, track: 2 }
                ]
            },
            {
                name: "Mary Had a Little Lamb (Full)",
                blocks: [
                    { chord: 'E4n', position: 0, duration: 1, track: 0 }, { chord: 'D4n', position: 1, duration: 1, track: 0 },
                    { chord: 'C4n', position: 2, duration: 1, track: 0 }, { chord: 'D4n', position: 3, duration: 1, track: 0 },
                    { chord: 'E4n', position: 4, duration: 1, track: 0 }, { chord: 'E4n', position: 5, duration: 1, track: 0 },
                    { chord: 'E4n', position: 6, duration: 2, track: 0 },
                    { chord: 'D4n', position: 8, duration: 1, track: 0 }, { chord: 'D4n', position: 9, duration: 1, track: 0 },
                    { chord: 'D4n', position: 10, duration: 2, track: 0 },
                    { chord: 'E4n', position: 12, duration: 1, track: 0 }, { chord: 'G4n', position: 13, duration: 1, track: 0 },
                    { chord: 'G4n', position: 14, duration: 2, track: 0 },
                    { chord: 'E4n', position: 16, duration: 1, track: 0 }, { chord: 'D4n', position: 17, duration: 1, track: 0 },
                    { chord: 'C4n', position: 18, duration: 1, track: 0 }, { chord: 'D4n', position: 19, duration: 1, track: 0 },
                    { chord: 'E4n', position: 20, duration: 1, track: 0 }, { chord: 'E4n', position: 21, duration: 1, track: 0 },
                    { chord: 'E4n', position: 22, duration: 2, track: 0 },
                    { chord: 'E4n', position: 24, duration: 1, track: 0 }, { chord: 'D4n', position: 25, duration: 1, track: 0 },
                    { chord: 'D4n', position: 26, duration: 1, track: 0 }, { chord: 'E4n', position: 27, duration: 1, track: 0 },
                    { chord: 'D4n', position: 28, duration: 1, track: 0 }, { chord: 'C4n', position: 29, duration: 2, track: 0 },
                    // Chords
                    { chord: 'C', position: 0, duration: 8, track: 1 }, { chord: 'G', position: 8, duration: 8, track: 1 },
                    { chord: 'C', position: 16, duration: 8, track: 1 }, { chord: 'G', position: 24, duration: 8, track: 1 },
                    // Bass
                    { chord: 'C3n', position: 0, duration: 4, track: 2 }, { chord: 'G2n', position: 8, duration: 4, track: 2 },
                    { chord: 'C3n', position: 16, duration: 4, track: 2 }, { chord: 'G2n', position: 24, duration: 4, track: 2 }
                ]
            },
            {
                name: "Jingle Bells (Chorus Full)",
                blocks: [
                    // Melody
                    { chord: 'E4n', position: 0, duration: 1, track: 0 }, { chord: 'E4n', position: 1, duration: 1, track: 0 }, { chord: 'E4n', position: 2, duration: 2, track: 0 },
                    { chord: 'E4n', position: 4, duration: 1, track: 0 }, { chord: 'E4n', position: 5, duration: 1, track: 0 }, { chord: 'E4n', position: 6, duration: 2, track: 0 },
                    { chord: 'E4n', position: 8, duration: 1, track: 0 }, { chord: 'G4n', position: 9, duration: 1, track: 0 }, { chord: 'C4n', position: 10, duration: 1, track: 0 }, { chord: 'D4n', position: 11, duration: 1, track: 0 }, { chord: 'E4n', position: 12, duration: 4, track: 0 },
                    { chord: 'F4n', position: 16, duration: 1, track: 0 }, { chord: 'F4n', position: 17, duration: 1, track: 0 }, { chord: 'F4n', position: 18, duration: 1, track: 0 }, { chord: 'F4n', position: 19, duration: 1, track: 0 },
                    { chord: 'F4n', position: 20, duration: 1, track: 0 }, { chord: 'E4n', position: 21, duration: 1, track: 0 }, { chord: 'E4n', position: 22, duration: 1, track: 0 }, { chord: 'E4n', position: 23, duration: 1, track: 0 },
                    { chord: 'E4n', position: 24, duration: 1, track: 0 }, { chord: 'D4n', position: 25, duration: 1, track: 0 }, { chord: 'D4n', position: 26, duration: 1, track: 0 }, { chord: 'E4n', position: 27, duration: 1, track: 0 },
                    { chord: 'D4n', position: 28, duration: 2, track: 0 }, { chord: 'G4n', position: 30, duration: 2, track: 0 },
                    // Chords
                    { chord: 'C', position: 0, duration: 8, track: 1 }, { chord: 'F', position: 8, duration: 8, track: 1 },
                    { chord: 'C', position: 16, duration: 8, track: 1 }, { chord: 'G', position: 24, duration: 8, track: 1 },
                    // Bass
                    { chord: 'C3n', position: 0, duration: 4, track: 2 }, { chord: 'F2n', position: 8, duration: 4, track: 2 },
                    { chord: 'C3n', position: 16, duration: 4, track: 2 }, { chord: 'G2n', position: 24, duration: 4, track: 2 }
                ]
            },
            {
                name: "Ode to Joy (Full)",
                blocks: [
                    { chord: 'E4n', position: 0, duration: 1, track: 0 }, { chord: 'E4n', position: 1, duration: 1, track: 0 }, { chord: 'F4n', position: 2, duration: 1, track: 0 }, { chord: 'G4n', position: 3, duration: 1, track: 0 },
                    { chord: 'G4n', position: 4, duration: 1, track: 0 }, { chord: 'F4n', position: 5, duration: 1, track: 0 }, { chord: 'E4n', position: 6, duration: 1, track: 0 }, { chord: 'D4n', position: 7, duration: 1, track: 0 },
                    { chord: 'C4n', position: 8, duration: 1, track: 0 }, { chord: 'C4n', position: 9, duration: 1, track: 0 }, { chord: 'D4n', position: 10, duration: 1, track: 0 }, { chord: 'E4n', position: 11, duration: 1, track: 0 },
                    { chord: 'E4n', position: 12, duration: 1.5, track: 0 }, { chord: 'D4n', position: 13.5, duration: 0.5, track: 0 }, { chord: 'D4n', position: 14, duration: 2, track: 0 },
                    // repeat second half
                    { chord: 'E4n', position: 16, duration: 1, track: 0 }, { chord: 'E4n', position: 17, duration: 1, track: 0 }, { chord: 'F4n', position: 18, duration: 1, track: 0 }, { chord: 'G4n', position: 19, duration: 1, track: 0 },
                    { chord: 'G4n', position: 20, duration: 1, track: 0 }, { chord: 'F4n', position: 21, duration: 1, track: 0 }, { chord: 'E4n', position: 22, duration: 1, track: 0 }, { chord: 'D4n', position: 23, duration: 1, track: 0 },
                    { chord: 'C4n', position: 24, duration: 1, track: 0 }, { chord: 'C4n', position: 25, duration: 1, track: 0 }, { chord: 'D4n', position: 26, duration: 1, track: 0 }, { chord: 'E4n', position: 27, duration: 1, track: 0 },
                    { chord: 'D4n', position: 28, duration: 1.5, track: 0 }, { chord: 'C4n', position: 29.5, duration: 0.5, track: 0 }, { chord: 'C4n', position: 30, duration: 2, track: 0 },
                    // Chords
                    { chord: 'C', position: 0, duration: 8, track: 1 }, { chord: 'G', position: 8, duration: 8, track: 1 },
                    { chord: 'C', position: 16, duration: 8, track: 1 }, { chord: 'G', position: 24, duration: 8, track: 1 },
                    // Bass
                    { chord: 'C3n', position: 0, duration: 4, track: 2 }, { chord: 'G2n', position: 8, duration: 4, track: 2 },
                    { chord: 'C3n', position: 16, duration: 4, track: 2 }, { chord: 'G2n', position: 24, duration: 4, track: 2 }
                ]
            },
            {
                name: "Für Elise (Opening Full Loop)",
                blocks: [
                    { chord: 'E5n', position: 0, duration: 0.5, track: 0 }, { chord: 'D#5n', position: 0.5, duration: 0.5, track: 0 },
                    { chord: 'E5n', position: 1, duration: 0.5, track: 0 }, { chord: 'D#5n', position: 1.5, duration: 0.5, track: 0 },
                    { chord: 'E5n', position: 2, duration: 0.5, track: 0 }, { chord: 'B4n', position: 2.5, duration: 0.5, track: 0 },
                    { chord: 'D5n', position: 3, duration: 0.5, track: 0 }, { chord: 'C5n', position: 3.5, duration: 0.5, track: 0 },
                    { chord: 'A4n', position: 4, duration: 1, track: 0 },
                    { chord: 'C4n', position: 5, duration: 0.5, track: 0 }, { chord: 'E4n', position: 5.5, duration: 0.5, track: 0 },
                    { chord: 'A4n', position: 6, duration: 1, track: 0 }, { chord: 'B4n', position: 7, duration: 0.5, track: 0 }, { chord: 'Bb4n', position: 7.5, duration: 0.5, track: 0 },
                    { chord: 'C5n', position: 8, duration: 1, track: 0 },
                    { chord: 'E5n', position: 9, duration: 0.5, track: 0 }, { chord: 'D#5n', position: 9.5, duration: 0.5, track: 0 },
                    { chord: 'E5n', position: 10, duration: 0.5, track: 0 }, { chord: 'D#5n', position: 10.5, duration: 0.5, track: 0 },
                    { chord: 'E5n', position: 11, duration: 0.5, track: 0 }, { chord: 'B4n', position: 11.5, duration: 0.5, track: 0 },
                    { chord: 'D5n', position: 12, duration: 0.5, track: 0 }, { chord: 'C5n', position: 12.5, duration: 0.5, track: 0 },
                    { chord: 'A4n', position: 13, duration: 1, track: 0 },
                    { chord: 'E5n', position: 14, duration: 0.5, track: 0 }, { chord: 'D5n', position: 14.5, duration: 0.5, track: 0 },
                    { chord: 'C5n', position: 15, duration: 0.5, track: 0 }, { chord: 'B4n', position: 15.5, duration: 0.5, track: 0 },
                    { chord: 'A4n', position: 16, duration: 2, track: 0 },
                    // repeat second half
                    { chord: 'E5n', position: 18, duration: 0.5, track: 0 }, { chord: 'D#5n', position: 18.5, duration: 0.5, track: 0 },
                    { chord: 'E5n', position: 19, duration: 0.5, track: 0 }, { chord: 'D#5n', position: 19.5, duration: 0.5, track: 0 },
                    { chord: 'E5n', position: 20, duration: 0.5, track: 0 }, { chord: 'B4n', position: 20.5, duration: 0.5, track: 0 },
                    { chord: 'D5n', position: 21, duration: 0.5, track: 0 }, { chord: 'C5n', position: 21.5, duration: 0.5, track: 0 },
                    { chord: 'A4n', position: 22, duration: 1, track: 0 },
                    { chord: 'C4n', position: 23, duration: 0.5, track: 0 }, { chord: 'E4n', position: 23.5, duration: 0.5, track: 0 },
                    { chord: 'A4n', position: 24, duration: 1, track: 0 }, { chord: 'B4n', position: 25, duration: 0.5, track: 0 }, { chord: 'Bb4n', position: 25.5, duration: 0.5, track: 0 },
                    { chord: 'C5n', position: 26, duration: 1, track: 0 },
                    // Harmony and bass
                    { chord: 'Am', position: 0, duration: 8, track: 1 }, { chord: 'E', position: 8, duration: 4, track: 1 }, { chord: 'Am', position: 12, duration: 8, track: 1 },
                    { chord: 'E', position: 20, duration: 4, track: 1 }, { chord: 'Am', position: 24, duration: 4, track: 1 },
                    { chord: 'A2n', position: 0, duration: 2, track: 2 }, { chord: 'E2n', position: 8, duration: 2, track: 2 }, { chord: 'A2n', position: 12, duration: 2, track: 2 }, { chord: 'E2n', position: 20, duration: 2, track: 2 }
                ]
            },
            {
                name: "Canon in D (Full Loop)",
                blocks: [
                    // Chord progression
                    { chord: 'D', position: 0, duration: 4, track: 1 }, { chord: 'A', position: 4, duration: 4, track: 1 },
                    { chord: 'Bm', position: 8, duration: 4, track: 1 }, { chord: 'F#m', position: 12, duration: 4, track: 1 },
                    { chord: 'G', position: 16, duration: 4, track: 1 }, { chord: 'D', position: 20, duration: 4, track: 1 },
                    { chord: 'G', position: 24, duration: 4, track: 1 }, { chord: 'A', position: 28, duration: 4, track: 1 },
                    // Melody outline over two cycles (64 beats)
                    { chord: 'F#4n', position: 0, duration: 2, track: 0 }, { chord: 'G4n', position: 2, duration: 2, track: 0 },
                    { chord: 'A4n', position: 4, duration: 2, track: 0 }, { chord: 'D5n', position: 6, duration: 2, track: 0 },
                    { chord: 'B4n', position: 8, duration: 2, track: 0 }, { chord: 'A4n', position: 10, duration: 2, track: 0 },
                    { chord: 'G4n', position: 12, duration: 2, track: 0 }, { chord: 'F#4n', position: 14, duration: 2, track: 0 },
                    { chord: 'G4n', position: 16, duration: 2, track: 0 }, { chord: 'A4n', position: 18, duration: 2, track: 0 },
                    { chord: 'B4n', position: 20, duration: 2, track: 0 }, { chord: 'A4n', position: 22, duration: 2, track: 0 },
                    { chord: 'G4n', position: 24, duration: 2, track: 0 }, { chord: 'F#4n', position: 26, duration: 2, track: 0 },
                    { chord: 'E4n', position: 28, duration: 2, track: 0 }, { chord: 'F#4n', position: 30, duration: 2, track: 0 },
                    // second cycle add a stepwise descent
                    { chord: 'D5n', position: 32, duration: 2, track: 0 }, { chord: 'C#5n', position: 34, duration: 2, track: 0 },
                    { chord: 'B4n', position: 36, duration: 2, track: 0 }, { chord: 'A4n', position: 38, duration: 2, track: 0 },
                    { chord: 'G4n', position: 40, duration: 2, track: 0 }, { chord: 'F#4n', position: 42, duration: 2, track: 0 },
                    { chord: 'E4n', position: 44, duration: 2, track: 0 }, { chord: 'D4n', position: 46, duration: 2, track: 0 },
                    { chord: 'G4n', position: 48, duration: 2, track: 0 }, { chord: 'F#4n', position: 50, duration: 2, track: 0 },
                    { chord: 'E4n', position: 52, duration: 2, track: 0 }, { chord: 'D4n', position: 54, duration: 2, track: 0 },
                    { chord: 'C#4n', position: 56, duration: 2, track: 0 }, { chord: 'B3n', position: 58, duration: 2, track: 0 },
                    { chord: 'A3n', position: 60, duration: 2, track: 0 }, { chord: 'D4n', position: 62, duration: 2, track: 0 },
                    // Bass line
                    { chord: 'D3n', position: 0, duration: 4, track: 2 }, { chord: 'A2n', position: 4, duration: 4, track: 2 },
                    { chord: 'B2n', position: 8, duration: 4, track: 2 }, { chord: 'F#2n', position: 12, duration: 4, track: 2 },
                    { chord: 'G2n', position: 16, duration: 4, track: 2 }, { chord: 'D3n', position: 20, duration: 4, track: 2 },
                    { chord: 'G2n', position: 24, duration: 4, track: 2 }, { chord: 'A2n', position: 28, duration: 4, track: 2 },
                    { chord: 'D3n', position: 32, duration: 4, track: 2 }, { chord: 'A2n', position: 36, duration: 4, track: 2 },
                    { chord: 'B2n', position: 40, duration: 4, track: 2 }, { chord: 'F#2n', position: 44, duration: 4, track: 2 },
                    { chord: 'G2n', position: 48, duration: 4, track: 2 }, { chord: 'D3n', position: 52, duration: 4, track: 2 },
                    { chord: 'G2n', position: 56, duration: 4, track: 2 }, { chord: 'A2n', position: 60, duration: 4, track: 2 }
                ]
            },
            {
                name: "Amazing Grace (Full)",
                blocks: [
                    { chord: 'G4n', position: 0, duration: 2, track: 0 }, { chord: 'B4n', position: 2, duration: 2, track: 0 },
                    { chord: 'D5n', position: 4, duration: 2, track: 0 }, { chord: 'G5n', position: 6, duration: 2, track: 0 },
                    { chord: 'B4n', position: 8, duration: 2, track: 0 }, { chord: 'G4n', position: 10, duration: 2, track: 0 },
                    { chord: 'E4n', position: 12, duration: 2, track: 0 }, { chord: 'G4n', position: 14, duration: 2, track: 0 },
                    { chord: 'A4n', position: 16, duration: 2, track: 0 }, { chord: 'G4n', position: 18, duration: 2, track: 0 },
                    { chord: 'E4n', position: 20, duration: 2, track: 0 }, { chord: 'D4n', position: 22, duration: 4, track: 0 },
                    { chord: 'G4n', position: 26, duration: 2, track: 0 }, { chord: 'B4n', position: 28, duration: 2, track: 0 },
                    { chord: 'D5n', position: 30, duration: 2, track: 0 }, { chord: 'G5n', position: 32, duration: 2, track: 0 },
                    { chord: 'B4n', position: 34, duration: 2, track: 0 }, { chord: 'G4n', position: 36, duration: 2, track: 0 },
                    { chord: 'E4n', position: 38, duration: 2, track: 0 }, { chord: 'C5n', position: 40, duration: 2, track: 0 },
                    { chord: 'B4n', position: 42, duration: 2, track: 0 }, { chord: 'G4n', position: 44, duration: 4, track: 0 },
                    // Chords
                    { chord: 'G', position: 0, duration: 8, track: 1 }, { chord: 'C', position: 8, duration: 8, track: 1 },
                    { chord: 'G', position: 16, duration: 8, track: 1 }, { chord: 'D', position: 24, duration: 8, track: 1 },
                    { chord: 'G', position: 32, duration: 8, track: 1 }, { chord: 'C', position: 40, duration: 8, track: 1 },
                    // Bass
                    { chord: 'G2n', position: 0, duration: 4, track: 2 }, { chord: 'C3n', position: 8, duration: 4, track: 2 },
                    { chord: 'G2n', position: 16, duration: 4, track: 2 }, { chord: 'D2n', position: 24, duration: 4, track: 2 },
                    { chord: 'G2n', position: 32, duration: 4, track: 2 }, { chord: 'C3n', position: 40, duration: 4, track: 2 }
                ]
            },
            {
                name: "Row Row Row Your Boat (Round Intro)",
                blocks: [
                    { chord: 'C4n', position: 0, duration: 1, track: 0 }, { chord: 'C4n', position: 1, duration: 1, track: 0 }, { chord: 'C4n', position: 2, duration: 1, track: 0 }, { chord: 'D4n', position: 3, duration: 1, track: 0 },
                    { chord: 'E4n', position: 4, duration: 2, track: 0 }, { chord: 'E4n', position: 6, duration: 1, track: 0 }, { chord: 'D4n', position: 7, duration: 1, track: 0 }, { chord: 'E4n', position: 8, duration: 1, track: 0 },
                    { chord: 'F4n', position: 9, duration: 1, track: 0 }, { chord: 'G4n', position: 10, duration: 2, track: 0 },
                    { chord: 'C5n', position: 12, duration: 1, track: 0 }, { chord: 'C5n', position: 13, duration: 1, track: 0 }, { chord: 'C5n', position: 14, duration: 1, track: 0 }, { chord: 'G4n', position: 15, duration: 1, track: 0 },
                    { chord: 'G4n', position: 16, duration: 1, track: 0 }, { chord: 'F4n', position: 17, duration: 1, track: 0 }, { chord: 'E4n', position: 18, duration: 1, track: 0 }, { chord: 'D4n', position: 19, duration: 1, track: 0 },
                    { chord: 'C4n', position: 20, duration: 4, track: 0 },
                    // Chords and bass
                    { chord: 'C', position: 0, duration: 4, track: 1 }, { chord: 'G', position: 4, duration: 4, track: 1 },
                    { chord: 'C', position: 8, duration: 4, track: 1 }, { chord: 'G', position: 12, duration: 4, track: 1 },
                    { chord: 'C', position: 16, duration: 8, track: 1 },
                    { chord: 'C3n', position: 0, duration: 4, track: 2 }, { chord: 'G2n', position: 4, duration: 4, track: 2 },
                    { chord: 'C3n', position: 8, duration: 4, track: 2 }, { chord: 'G2n', position: 12, duration: 4, track: 2 },
                    { chord: 'C3n', position: 16, duration: 4, track: 2 }
                ]
            },
            {
                name: "When the Saints Go Marching In (Full)",
                blocks: [
                    { chord: 'G4n', position: 0, duration: 1, track: 0 }, { chord: 'B4n', position: 1, duration: 1, track: 0 }, { chord: 'C5n', position: 2, duration: 1, track: 0 }, { chord: 'D5n', position: 3, duration: 1, track: 0 },
                    { chord: 'G5n', position: 4, duration: 2, track: 0 }, { chord: 'G4n', position: 6, duration: 1, track: 0 }, { chord: 'B4n', position: 7, duration: 1, track: 0 }, { chord: 'C5n', position: 8, duration: 1, track: 0 }, { chord: 'D5n', position: 9, duration: 1, track: 0 },
                    { chord: 'G5n', position: 10, duration: 2, track: 0 }, { chord: 'D5n', position: 12, duration: 1, track: 0 }, { chord: 'E5n', position: 13, duration: 1, track: 0 }, { chord: 'F#5n', position: 14, duration: 1, track: 0 }, { chord: 'G5n', position: 15, duration: 2, track: 0 },
                    { chord: 'G4n', position: 17, duration: 1, track: 0 }, { chord: 'B4n', position: 18, duration: 1, track: 0 }, { chord: 'C5n', position: 19, duration: 1, track: 0 }, { chord: 'D5n', position: 20, duration: 1, track: 0 },
                    { chord: 'E5n', position: 21, duration: 1, track: 0 }, { chord: 'E5n', position: 22, duration: 1, track: 0 }, { chord: 'D5n', position: 23, duration: 2, track: 0 },
                    // Chords
                    { chord: 'G', position: 0, duration: 4, track: 1 }, { chord: 'C', position: 4, duration: 4, track: 1 },
                    { chord: 'G', position: 8, duration: 4, track: 1 }, { chord: 'D', position: 12, duration: 4, track: 1 },
                    { chord: 'G', position: 16, duration: 4, track: 1 }, { chord: 'C', position: 20, duration: 4, track: 1 },
                    // Bass
                    { chord: 'G2n', position: 0, duration: 4, track: 2 }, { chord: 'C3n', position: 4, duration: 4, track: 2 },
                    { chord: 'G2n', position: 8, duration: 4, track: 2 }, { chord: 'D2n', position: 12, duration: 4, track: 2 },
                    { chord: 'G2n', position: 16, duration: 4, track: 2 }, { chord: 'C3n', position: 20, duration: 4, track: 2 }
                ]
            },
            {
                name: "Tujh Mein Rab Dikhta Hai (Loop)",
                blocks: [
                    { chord: 'G4n', position: 0, duration: 1, track: 0 }, { chord: 'A4n', position: 1, duration: 1, track: 0 }, { chord: 'B4n', position: 2, duration: 2, track: 0 },
                    { chord: 'A4n', position: 4, duration: 1, track: 0 }, { chord: 'G4n', position: 5, duration: 1, track: 0 }, { chord: 'D4n', position: 6, duration: 2, track: 0 },
                    { chord: 'G4n', position: 8, duration: 1, track: 0 }, { chord: 'A4n', position: 9, duration: 1, track: 0 }, { chord: 'B4n', position: 10, duration: 2, track: 0 },
                    { chord: 'A4n', position: 12, duration: 1, track: 0 }, { chord: 'G4n', position: 13, duration: 1, track: 0 }, { chord: 'D4n', position: 14, duration: 2, track: 0 },
                    { chord: 'C4n', position: 16, duration: 1, track: 0 }, { chord: 'D4n', position: 17, duration: 1, track: 0 }, { chord: 'E4n', position: 18, duration: 2, track: 0 },
                    { chord: 'D4n', position: 20, duration: 1, track: 0 }, { chord: 'C4n', position: 21, duration: 1, track: 0 }, { chord: 'G4n', position: 22, duration: 2, track: 0 },
                    { chord: 'A4n', position: 24, duration: 1, track: 0 }, { chord: 'B4n', position: 25, duration: 1, track: 0 }, { chord: 'A4n', position: 26, duration: 2, track: 0 },
                    { chord: 'G4n', position: 28, duration: 1, track: 0 }, { chord: 'D4n', position: 29, duration: 1, track: 0 }, { chord: 'G4n', position: 30, duration: 2, track: 0 },
                    { chord: 'G', position: 0, duration: 4, track: 1 }, { chord: 'C', position: 4, duration: 4, track: 1 }, { chord: 'D', position: 8, duration: 4, track: 1 }, { chord: 'G', position: 12, duration: 4, track: 1 },
                    { chord: 'C', position: 16, duration: 4, track: 1 }, { chord: 'D', position: 20, duration: 4, track: 1 }, { chord: 'Em', position: 24, duration: 4, track: 1 }, { chord: 'G', position: 28, duration: 4, track: 1 },
                    { chord: 'G2n', position: 0, duration: 2, track: 2 }, { chord: 'C3n', position: 4, duration: 2, track: 2 }, { chord: 'D3n', position: 8, duration: 2, track: 2 }, { chord: 'G2n', position: 12, duration: 2, track: 2 },
                    { chord: 'C3n', position: 16, duration: 2, track: 2 }, { chord: 'D3n', position: 20, duration: 2, track: 2 }, { chord: 'E3n', position: 24, duration: 2, track: 2 }, { chord: 'G2n', position: 28, duration: 2, track: 2 }
                ]
            },
            {
                name: "Tum Hi Ho (Loop)",
                blocks: [
                    { chord: 'F4n', position: 0, duration: 1, track: 0 }, { chord: 'Ab4n', position: 1, duration: 1, track: 0 }, { chord: 'C5n', position: 2, duration: 2, track: 0 },
                    { chord: 'C5n', position: 4, duration: 1, track: 0 }, { chord: 'Db5n', position: 5, duration: 1, track: 0 }, { chord: 'C5n', position: 6, duration: 2, track: 0 },
                    { chord: 'Bb4n', position: 8, duration: 1, track: 0 }, { chord: 'Ab4n', position: 9, duration: 1, track: 0 }, { chord: 'F4n', position: 10, duration: 2, track: 0 },
                    { chord: 'C5n', position: 12, duration: 1, track: 0 }, { chord: 'Db5n', position: 13, duration: 1, track: 0 }, { chord: 'C5n', position: 14, duration: 2, track: 0 },
                    { chord: 'F4n', position: 16, duration: 1, track: 0 }, { chord: 'Ab4n', position: 17, duration: 1, track: 0 }, { chord: 'C5n', position: 18, duration: 2, track: 0 },
                    { chord: 'Bb4n', position: 20, duration: 1, track: 0 }, { chord: 'Ab4n', position: 21, duration: 1, track: 0 }, { chord: 'F4n', position: 22, duration: 2, track: 0 },
                    { chord: 'Eb4n', position: 24, duration: 1, track: 0 }, { chord: 'F4n', position: 25, duration: 1, track: 0 }, { chord: 'Eb4n', position: 26, duration: 2, track: 0 },
                    { chord: 'Db4n', position: 28, duration: 1, track: 0 }, { chord: 'C4n', position: 29, duration: 1, track: 0 }, { chord: 'F4n', position: 30, duration: 2, track: 0 },
                    { chord: 'Fm', position: 0, duration: 4, track: 1 }, { chord: 'Db', position: 4, duration: 4, track: 1 }, { chord: 'Eb', position: 8, duration: 4, track: 1 }, { chord: 'Fm', position: 12, duration: 4, track: 1 },
                    { chord: 'Db', position: 16, duration: 4, track: 1 }, { chord: 'Eb', position: 20, duration: 4, track: 1 }, { chord: 'C', position: 24, duration: 4, track: 1 }, { chord: 'Fm', position: 28, duration: 4, track: 1 },
                    { chord: 'F2n', position: 0, duration: 2, track: 2 }, { chord: 'Db3n', position: 4, duration: 2, track: 2 }, { chord: 'Eb3n', position: 8, duration: 2, track: 2 }, { chord: 'F2n', position: 12, duration: 2, track: 2 },
                    { chord: 'Db3n', position: 16, duration: 2, track: 2 }, { chord: 'Eb3n', position: 20, duration: 2, track: 2 }, { chord: 'C3n', position: 24, duration: 2, track: 2 }, { chord: 'F2n', position: 28, duration: 2, track: 2 }
                ]
            },
            {
                name: "Chaiyya Chaiyya (Loop)",
                blocks: [
                    { chord: 'D4n', position: 0, duration: 1, track: 0 }, { chord: 'E4n', position: 1, duration: 1, track: 0 }, { chord: 'F#4n', position: 2, duration: 2, track: 0 },
                    { chord: 'A4n', position: 4, duration: 1, track: 0 }, { chord: 'G4n', position: 5, duration: 1, track: 0 }, { chord: 'F#4n', position: 6, duration: 2, track: 0 },
                    { chord: 'E4n', position: 8, duration: 1, track: 0 }, { chord: 'F#4n', position: 9, duration: 1, track: 0 }, { chord: 'A4n', position: 10, duration: 2, track: 0 },
                    { chord: 'G4n', position: 12, duration: 1, track: 0 }, { chord: 'F#4n', position: 13, duration: 1, track: 0 }, { chord: 'E4n', position: 14, duration: 2, track: 0 },
                    { chord: 'D4n', position: 16, duration: 1, track: 0 }, { chord: 'E4n', position: 17, duration: 1, track: 0 }, { chord: 'F#4n', position: 18, duration: 2, track: 0 },
                    { chord: 'A4n', position: 20, duration: 1, track: 0 }, { chord: 'G4n', position: 21, duration: 1, track: 0 }, { chord: 'F#4n', position: 22, duration: 2, track: 0 },
                    { chord: 'E4n', position: 24, duration: 1, track: 0 }, { chord: 'D4n', position: 25, duration: 1, track: 0 }, { chord: 'E4n', position: 26, duration: 2, track: 0 },
                    { chord: 'F#4n', position: 28, duration: 1, track: 0 }, { chord: 'E4n', position: 29, duration: 1, track: 0 }, { chord: 'D4n', position: 30, duration: 2, track: 0 },
                    { chord: 'D', position: 0, duration: 4, track: 1 }, { chord: 'G', position: 4, duration: 4, track: 1 }, { chord: 'A', position: 8, duration: 4, track: 1 }, { chord: 'Bm', position: 12, duration: 4, track: 1 },
                    { chord: 'D', position: 16, duration: 4, track: 1 }, { chord: 'G', position: 20, duration: 4, track: 1 }, { chord: 'A', position: 24, duration: 4, track: 1 }, { chord: 'D', position: 28, duration: 4, track: 1 },
                    { chord: 'D3n', position: 0, duration: 2, track: 2 }, { chord: 'G2n', position: 4, duration: 2, track: 2 }, { chord: 'A2n', position: 8, duration: 2, track: 2 }, { chord: 'B2n', position: 12, duration: 2, track: 2 },
                    { chord: 'D3n', position: 16, duration: 2, track: 2 }, { chord: 'G2n', position: 20, duration: 2, track: 2 }, { chord: 'A2n', position: 24, duration: 2, track: 2 }, { chord: 'D3n', position: 28, duration: 2, track: 2 }
                ]
            },
            {
                name: "Tera Ban Jaunga (Loop)",
                blocks: [
                    { chord: 'A4n', position: 0, duration: 1, track: 0 }, { chord: 'B4n', position: 1, duration: 1, track: 0 }, { chord: 'C#5n', position: 2, duration: 2, track: 0 },
                    { chord: 'C#5n', position: 4, duration: 1, track: 0 }, { chord: 'B4n', position: 5, duration: 1, track: 0 }, { chord: 'A4n', position: 6, duration: 2, track: 0 },
                    { chord: 'E4n', position: 8, duration: 1, track: 0 }, { chord: 'F#4n', position: 9, duration: 1, track: 0 }, { chord: 'A4n', position: 10, duration: 2, track: 0 },
                    { chord: 'B4n', position: 12, duration: 1, track: 0 }, { chord: 'C#5n', position: 13, duration: 1, track: 0 }, { chord: 'B4n', position: 14, duration: 2, track: 0 },
                    { chord: 'A4n', position: 16, duration: 1, track: 0 }, { chord: 'B4n', position: 17, duration: 1, track: 0 }, { chord: 'C#5n', position: 18, duration: 2, track: 0 },
                    { chord: 'B4n', position: 20, duration: 1, track: 0 }, { chord: 'A4n', position: 21, duration: 1, track: 0 }, { chord: 'F#4n', position: 22, duration: 2, track: 0 },
                    { chord: 'E4n', position: 24, duration: 1, track: 0 }, { chord: 'F#4n', position: 25, duration: 1, track: 0 }, { chord: 'E4n', position: 26, duration: 2, track: 0 },
                    { chord: 'D4n', position: 28, duration: 1, track: 0 }, { chord: 'C#4n', position: 29, duration: 1, track: 0 }, { chord: 'A4n', position: 30, duration: 2, track: 0 },
                    { chord: 'A', position: 0, duration: 4, track: 1 }, { chord: 'F#m', position: 4, duration: 4, track: 1 }, { chord: 'D', position: 8, duration: 4, track: 1 }, { chord: 'E', position: 12, duration: 4, track: 1 },
                    { chord: 'A', position: 16, duration: 4, track: 1 }, { chord: 'F#m', position: 20, duration: 4, track: 1 }, { chord: 'D', position: 24, duration: 4, track: 1 }, { chord: 'E', position: 28, duration: 4, track: 1 },
                    { chord: 'A2n', position: 0, duration: 2, track: 2 }, { chord: 'F#2n', position: 4, duration: 2, track: 2 }, { chord: 'D3n', position: 8, duration: 2, track: 2 }, { chord: 'E2n', position: 12, duration: 2, track: 2 },
                    { chord: 'A2n', position: 16, duration: 2, track: 2 }, { chord: 'F#2n', position: 20, duration: 2, track: 2 }, { chord: 'D3n', position: 24, duration: 2, track: 2 }, { chord: 'E2n', position: 28, duration: 2, track: 2 }
                ]
            },
            {
                name: "Galliyan (Loop)",
                blocks: [
                    { chord: 'E4n', position: 0, duration: 1, track: 0 }, { chord: 'F#4n', position: 1, duration: 1, track: 0 }, { chord: 'G4n', position: 2, duration: 2, track: 0 },
                    { chord: 'B4n', position: 4, duration: 1, track: 0 }, { chord: 'A4n', position: 5, duration: 1, track: 0 }, { chord: 'G4n', position: 6, duration: 2, track: 0 },
                    { chord: 'F#4n', position: 8, duration: 1, track: 0 }, { chord: 'G4n', position: 9, duration: 1, track: 0 }, { chord: 'B4n', position: 10, duration: 2, track: 0 },
                    { chord: 'A4n', position: 12, duration: 1, track: 0 }, { chord: 'G4n', position: 13, duration: 1, track: 0 }, { chord: 'E4n', position: 14, duration: 2, track: 0 },
                    { chord: 'E4n', position: 16, duration: 1, track: 0 }, { chord: 'F#4n', position: 17, duration: 1, track: 0 }, { chord: 'G4n', position: 18, duration: 2, track: 0 },
                    { chord: 'B4n', position: 20, duration: 1, track: 0 }, { chord: 'A4n', position: 21, duration: 1, track: 0 }, { chord: 'G4n', position: 22, duration: 2, track: 0 },
                    { chord: 'F#4n', position: 24, duration: 1, track: 0 }, { chord: 'E4n', position: 25, duration: 1, track: 0 }, { chord: 'D4n', position: 26, duration: 2, track: 0 },
                    { chord: 'E4n', position: 28, duration: 1, track: 0 }, { chord: 'F#4n', position: 29, duration: 1, track: 0 }, { chord: 'E4n', position: 30, duration: 2, track: 0 },
                    { chord: 'Em', position: 0, duration: 4, track: 1 }, { chord: 'C', position: 4, duration: 4, track: 1 }, { chord: 'D', position: 8, duration: 4, track: 1 }, { chord: 'Bm', position: 12, duration: 4, track: 1 },
                    { chord: 'Em', position: 16, duration: 4, track: 1 }, { chord: 'C', position: 20, duration: 4, track: 1 }, { chord: 'D', position: 24, duration: 4, track: 1 }, { chord: 'Em', position: 28, duration: 4, track: 1 },
                    { chord: 'E2n', position: 0, duration: 2, track: 2 }, { chord: 'C3n', position: 4, duration: 2, track: 2 }, { chord: 'D3n', position: 8, duration: 2, track: 2 }, { chord: 'B2n', position: 12, duration: 2, track: 2 },
                    { chord: 'E2n', position: 16, duration: 2, track: 2 }, { chord: 'C3n', position: 20, duration: 2, track: 2 }, { chord: 'D3n', position: 24, duration: 2, track: 2 }, { chord: 'E2n', position: 28, duration: 2, track: 2 }
                ]
            },
            {
                name: "Kesariya (Loop)",
                blocks: [
                    { chord: 'A4n', position: 0, duration: 1, track: 0 }, { chord: 'B4n', position: 1, duration: 1, track: 0 }, { chord: 'C#5n', position: 2, duration: 2, track: 0 },
                    { chord: 'B4n', position: 4, duration: 1, track: 0 }, { chord: 'A4n', position: 5, duration: 1, track: 0 }, { chord: 'F#4n', position: 6, duration: 2, track: 0 },
                    { chord: 'D4n', position: 8, duration: 1, track: 0 }, { chord: 'E4n', position: 9, duration: 1, track: 0 }, { chord: 'F#4n', position: 10, duration: 2, track: 0 },
                    { chord: 'E4n', position: 12, duration: 1, track: 0 }, { chord: 'D4n', position: 13, duration: 1, track: 0 }, { chord: 'A4n', position: 14, duration: 2, track: 0 },
                    { chord: 'A4n', position: 16, duration: 1, track: 0 }, { chord: 'B4n', position: 17, duration: 1, track: 0 }, { chord: 'C#5n', position: 18, duration: 2, track: 0 },
                    { chord: 'B4n', position: 20, duration: 1, track: 0 }, { chord: 'A4n', position: 21, duration: 1, track: 0 }, { chord: 'F#4n', position: 22, duration: 2, track: 0 },
                    { chord: 'E4n', position: 24, duration: 1, track: 0 }, { chord: 'D4n', position: 25, duration: 1, track: 0 }, { chord: 'E4n', position: 26, duration: 2, track: 0 },
                    { chord: 'F#4n', position: 28, duration: 1, track: 0 }, { chord: 'E4n', position: 29, duration: 1, track: 0 }, { chord: 'D4n', position: 30, duration: 2, track: 0 },
                    { chord: 'D', position: 0, duration: 4, track: 1 }, { chord: 'G', position: 4, duration: 4, track: 1 }, { chord: 'A', position: 8, duration: 4, track: 1 }, { chord: 'Bm', position: 12, duration: 4, track: 1 },
                    { chord: 'D', position: 16, duration: 4, track: 1 }, { chord: 'G', position: 20, duration: 4, track: 1 }, { chord: 'A', position: 24, duration: 4, track: 1 }, { chord: 'D', position: 28, duration: 4, track: 1 },
                    { chord: 'D3n', position: 0, duration: 2, track: 2 }, { chord: 'G2n', position: 4, duration: 2, track: 2 }, { chord: 'A2n', position: 8, duration: 2, track: 2 }, { chord: 'B2n', position: 12, duration: 2, track: 2 },
                    { chord: 'D3n', position: 16, duration: 2, track: 2 }, { chord: 'G2n', position: 20, duration: 2, track: 2 }, { chord: 'A2n', position: 24, duration: 2, track: 2 }, { chord: 'D3n', position: 28, duration: 2, track: 2 }
                ]
            },
            {
                name: "Kal Ho Naa Ho (Loop)",
                blocks: [
                    { chord: 'E4n', position: 0, duration: 1, track: 0 }, { chord: 'F4n', position: 1, duration: 1, track: 0 }, { chord: 'G4n', position: 2, duration: 2, track: 0 },
                    { chord: 'G4n', position: 4, duration: 1, track: 0 }, { chord: 'A4n', position: 5, duration: 1, track: 0 }, { chord: 'G4n', position: 6, duration: 2, track: 0 },
                    { chord: 'F4n', position: 8, duration: 1, track: 0 }, { chord: 'E4n', position: 9, duration: 1, track: 0 }, { chord: 'C4n', position: 10, duration: 2, track: 0 },
                    { chord: 'D4n', position: 12, duration: 1, track: 0 }, { chord: 'E4n', position: 13, duration: 1, track: 0 }, { chord: 'F4n', position: 14, duration: 2, track: 0 },
                    { chord: 'E4n', position: 16, duration: 1, track: 0 }, { chord: 'F4n', position: 17, duration: 1, track: 0 }, { chord: 'G4n', position: 18, duration: 2, track: 0 },
                    { chord: 'G4n', position: 20, duration: 1, track: 0 }, { chord: 'A4n', position: 21, duration: 1, track: 0 }, { chord: 'G4n', position: 22, duration: 2, track: 0 },
                    { chord: 'F4n', position: 24, duration: 1, track: 0 }, { chord: 'E4n', position: 25, duration: 1, track: 0 }, { chord: 'D4n', position: 26, duration: 2, track: 0 },
                    { chord: 'C4n', position: 28, duration: 1, track: 0 }, { chord: 'D4n', position: 29, duration: 1, track: 0 }, { chord: 'C4n', position: 30, duration: 2, track: 0 },
                    { chord: 'C', position: 0, duration: 4, track: 1 }, { chord: 'Am', position: 4, duration: 4, track: 1 }, { chord: 'F', position: 8, duration: 4, track: 1 }, { chord: 'G', position: 12, duration: 4, track: 1 },
                    { chord: 'C', position: 16, duration: 4, track: 1 }, { chord: 'Am', position: 20, duration: 4, track: 1 }, { chord: 'F', position: 24, duration: 4, track: 1 }, { chord: 'G', position: 28, duration: 4, track: 1 },
                    { chord: 'C3n', position: 0, duration: 2, track: 2 }, { chord: 'A2n', position: 4, duration: 2, track: 2 }, { chord: 'F2n', position: 8, duration: 2, track: 2 }, { chord: 'G2n', position: 12, duration: 2, track: 2 },
                    { chord: 'C3n', position: 16, duration: 2, track: 2 }, { chord: 'A2n', position: 20, duration: 2, track: 2 }, { chord: 'F2n', position: 24, duration: 2, track: 2 }, { chord: 'G2n', position: 28, duration: 2, track: 2 }
                ]
            },
            {
                name: "Pehla Nasha (Loop)",
                blocks: [
                    { chord: 'A4n', position: 0, duration: 1, track: 0 }, { chord: 'B4n', position: 1, duration: 1, track: 0 }, { chord: 'C#5n', position: 2, duration: 2, track: 0 },
                    { chord: 'C#5n', position: 4, duration: 1, track: 0 }, { chord: 'B4n', position: 5, duration: 1, track: 0 }, { chord: 'A4n', position: 6, duration: 2, track: 0 },
                    { chord: 'F#4n', position: 8, duration: 1, track: 0 }, { chord: 'G#4n', position: 9, duration: 1, track: 0 }, { chord: 'A4n', position: 10, duration: 2, track: 0 },
                    { chord: 'B4n', position: 12, duration: 1, track: 0 }, { chord: 'C#5n', position: 13, duration: 1, track: 0 }, { chord: 'B4n', position: 14, duration: 2, track: 0 },
                    { chord: 'A4n', position: 16, duration: 1, track: 0 }, { chord: 'B4n', position: 17, duration: 1, track: 0 }, { chord: 'C#5n', position: 18, duration: 2, track: 0 },
                    { chord: 'B4n', position: 20, duration: 1, track: 0 }, { chord: 'A4n', position: 21, duration: 1, track: 0 }, { chord: 'F#4n', position: 22, duration: 2, track: 0 },
                    { chord: 'E4n', position: 24, duration: 1, track: 0 }, { chord: 'F#4n', position: 25, duration: 1, track: 0 }, { chord: 'E4n', position: 26, duration: 2, track: 0 },
                    { chord: 'D4n', position: 28, duration: 1, track: 0 }, { chord: 'C#4n', position: 29, duration: 1, track: 0 }, { chord: 'A4n', position: 30, duration: 2, track: 0 },
                    { chord: 'A', position: 0, duration: 4, track: 1 }, { chord: 'D', position: 4, duration: 4, track: 1 }, { chord: 'E', position: 8, duration: 4, track: 1 }, { chord: 'F#m', position: 12, duration: 4, track: 1 },
                    { chord: 'A', position: 16, duration: 4, track: 1 }, { chord: 'D', position: 20, duration: 4, track: 1 }, { chord: 'E', position: 24, duration: 4, track: 1 }, { chord: 'A', position: 28, duration: 4, track: 1 },
                    { chord: 'A2n', position: 0, duration: 2, track: 2 }, { chord: 'D3n', position: 4, duration: 2, track: 2 }, { chord: 'E2n', position: 8, duration: 2, track: 2 }, { chord: 'F#2n', position: 12, duration: 2, track: 2 },
                    { chord: 'A2n', position: 16, duration: 2, track: 2 }, { chord: 'D3n', position: 20, duration: 2, track: 2 }, { chord: 'E2n', position: 24, duration: 2, track: 2 }, { chord: 'A2n', position: 28, duration: 2, track: 2 }
                ]
            },
            {
                name: "Tera Hone Laga Hoon (Loop)",
                blocks: [
                    { chord: 'G4n', position: 0, duration: 1, track: 0 }, { chord: 'A4n', position: 1, duration: 1, track: 0 }, { chord: 'B4n', position: 2, duration: 2, track: 0 },
                    { chord: 'B4n', position: 4, duration: 1, track: 0 }, { chord: 'A4n', position: 5, duration: 1, track: 0 }, { chord: 'G4n', position: 6, duration: 2, track: 0 },
                    { chord: 'E4n', position: 8, duration: 1, track: 0 }, { chord: 'F#4n', position: 9, duration: 1, track: 0 }, { chord: 'G4n', position: 10, duration: 2, track: 0 },
                    { chord: 'A4n', position: 12, duration: 1, track: 0 }, { chord: 'B4n', position: 13, duration: 1, track: 0 }, { chord: 'A4n', position: 14, duration: 2, track: 0 },
                    { chord: 'G4n', position: 16, duration: 1, track: 0 }, { chord: 'A4n', position: 17, duration: 1, track: 0 }, { chord: 'B4n', position: 18, duration: 2, track: 0 },
                    { chord: 'A4n', position: 20, duration: 1, track: 0 }, { chord: 'G4n', position: 21, duration: 1, track: 0 }, { chord: 'E4n', position: 22, duration: 2, track: 0 },
                    { chord: 'D4n', position: 24, duration: 1, track: 0 }, { chord: 'E4n', position: 25, duration: 1, track: 0 }, { chord: 'D4n', position: 26, duration: 2, track: 0 },
                    { chord: 'C4n', position: 28, duration: 1, track: 0 }, { chord: 'B3n', position: 29, duration: 1, track: 0 }, { chord: 'G4n', position: 30, duration: 2, track: 0 },
                    { chord: 'G', position: 0, duration: 4, track: 1 }, { chord: 'Em', position: 4, duration: 4, track: 1 }, { chord: 'C', position: 8, duration: 4, track: 1 }, { chord: 'D', position: 12, duration: 4, track: 1 },
                    { chord: 'G', position: 16, duration: 4, track: 1 }, { chord: 'Em', position: 20, duration: 4, track: 1 }, { chord: 'C', position: 24, duration: 4, track: 1 }, { chord: 'D', position: 28, duration: 4, track: 1 },
                    { chord: 'G2n', position: 0, duration: 2, track: 2 }, { chord: 'E2n', position: 4, duration: 2, track: 2 }, { chord: 'C3n', position: 8, duration: 2, track: 2 }, { chord: 'D3n', position: 12, duration: 2, track: 2 },
                    { chord: 'G2n', position: 16, duration: 2, track: 2 }, { chord: 'E2n', position: 20, duration: 2, track: 2 }, { chord: 'C3n', position: 24, duration: 2, track: 2 }, { chord: 'D3n', position: 28, duration: 2, track: 2 }
                ]
            },
            {
                name: "Dil Diyan Gallan (Loop)",
                blocks: [
                    { chord: 'G4n', position: 0, duration: 1, track: 0 }, { chord: 'A4n', position: 1, duration: 1, track: 0 }, { chord: 'B4n', position: 2, duration: 2, track: 0 },
                    { chord: 'B4n', position: 4, duration: 1, track: 0 }, { chord: 'A4n', position: 5, duration: 1, track: 0 }, { chord: 'G4n', position: 6, duration: 2, track: 0 },
                    { chord: 'E4n', position: 8, duration: 1, track: 0 }, { chord: 'F#4n', position: 9, duration: 1, track: 0 }, { chord: 'G4n', position: 10, duration: 2, track: 0 },
                    { chord: 'A4n', position: 12, duration: 1, track: 0 }, { chord: 'B4n', position: 13, duration: 1, track: 0 }, { chord: 'A4n', position: 14, duration: 2, track: 0 },
                    { chord: 'G4n', position: 16, duration: 1, track: 0 }, { chord: 'A4n', position: 17, duration: 1, track: 0 }, { chord: 'B4n', position: 18, duration: 2, track: 0 },
                    { chord: 'A4n', position: 20, duration: 1, track: 0 }, { chord: 'G4n', position: 21, duration: 1, track: 0 }, { chord: 'E4n', position: 22, duration: 2, track: 0 },
                    { chord: 'D4n', position: 24, duration: 1, track: 0 }, { chord: 'E4n', position: 25, duration: 1, track: 0 }, { chord: 'D4n', position: 26, duration: 2, track: 0 },
                    { chord: 'C4n', position: 28, duration: 1, track: 0 }, { chord: 'B3n', position: 29, duration: 1, track: 0 }, { chord: 'G4n', position: 30, duration: 2, track: 0 },
                    { chord: 'G', position: 0, duration: 4, track: 1 }, { chord: 'Em', position: 4, duration: 4, track: 1 }, { chord: 'C', position: 8, duration: 4, track: 1 }, { chord: 'D', position: 12, duration: 4, track: 1 },
                    { chord: 'G', position: 16, duration: 4, track: 1 }, { chord: 'Em', position: 20, duration: 4, track: 1 }, { chord: 'C', position: 24, duration: 4, track: 1 }, { chord: 'D', position: 28, duration: 4, track: 1 },
                    { chord: 'G2n', position: 0, duration: 2, track: 2 }, { chord: 'E2n', position: 4, duration: 2, track: 2 }, { chord: 'C3n', position: 8, duration: 2, track: 2 }, { chord: 'D3n', position: 12, duration: 2, track: 2 },
                    { chord: 'G2n', position: 16, duration: 2, track: 2 }, { chord: 'E2n', position: 20, duration: 2, track: 2 }, { chord: 'C3n', position: 24, duration: 2, track: 2 }, { chord: 'D3n', position: 28, duration: 2, track: 2 }
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
