"""
Music Composition App with Drag & Drop
A simple, fast music creation tool with pre-defined chords
"""

import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import pygame
import numpy as np
import threading
import os
import json
import wave
from chord_generator import ChordGenerator

class ChordBlock:
    """Represents a chord block on the timeline"""
    def __init__(self, chord_name, position, duration=1.0, track=0):
        self.chord_name = chord_name
        self.position = position  # Position in beats
        self.duration = duration  # Duration in beats
        self.track = track  # Track/row number (0, 1, 2, ...)
        self.canvas_id = None
        self.text_id = None

class MusicApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Music Composer - Drag & Drop")
        self.root.geometry("1200x700")
        self.root.configure(bg='#2b2b2b')
        
        # Initialize audio
        pygame.mixer.init(frequency=44100, size=-16, channels=2, buffer=512)
        self.chord_generator = ChordGenerator()
        
        # App state
        self.chord_blocks = []
        self.dragging_chord = None
        self.is_playing = False
        self.repeat_mode = False
        self.bpm = 120
        self.current_key = "C"
        self.stretching_block = None
        self.stretch_start_x = 0
        
        # Colors
        self.bg_color = '#2b2b2b'
        self.panel_color = '#3c3c3c'
        self.timeline_color = '#1e1e1e'
        
        # Generate colors for all chords
        self.chord_color_map = {
            # Single notes - bright distinctive colors
            'C3n': '#00FFFF', 'D3n': '#00E5FF', 'E3n': '#00D4FF', 'F3n': '#00C4FF', 
            'G3n': '#00B3FF', 'A3n': '#00A2FF', 'B3n': '#0091FF',
            'C4n': '#00DDFF', 'D4n': '#00CCFF', 'E4n': '#00BBFF', 'F4n': '#00AAFF', 
            'G4n': '#0099FF', 'A4n': '#0088FF', 'B4n': '#0077FF',
            'C5n': '#00BBFF', 'D5n': '#00AAFF', 'E5n': '#0099FF', 'F5n': '#0088FF', 
            'G5n': '#0077FF', 'A5n': '#0066FF', 'B5n': '#0055FF',
            # Major chords - warm colors
            'C': '#FF6B6B', 'D': '#FF8C42', 'E': '#FFA726', 'F': '#FFA07A', 
            'G': '#98D8C8', 'A': '#F7DC6F', 'B': '#FFD93D',
            'Db': '#FF7043', 'Eb': '#FFC470', 'Gb': '#FFB347', 'Ab': '#FFCC80', 'Bb': '#FFE66D',
            # Minor chords - cool colors
            'Cm': '#4ECDC4', 'Dm': '#45B7D1', 'Em': '#5DADE2', 'Fm': '#85C1E2',
            'Gm': '#7FB3D5', 'Am': '#6FA3D8', 'Bm': '#5499C7',
            'C#m': '#52B2BF', 'Ebm': '#48C9B0', 'F#m': '#1ABC9C', 'Abm': '#16A085', 'Bbm': '#45B39D',
            # 7th chords - purple/pink
            'C7': '#E74C3C', 'D7': '#EC7063', 'E7': '#F1948A', 'F7': '#F5B7B1',
            'G7': '#D98880', 'A7': '#CD6155', 'B7': '#C0392B',
            'Bb7': '#E74C3C', 'Eb7': '#EC7063', 'Ab7': '#F1948A',
            # Major 7th - light purple
            'Cmaj7': '#BB8FCE', 'Dmaj7': '#C39BD3', 'Emaj7': '#D7BDE2', 
            'Fmaj7': '#E8DAEF', 'Gmaj7': '#AF7AC5', 'Amaj7': '#A569BD', 'Bmaj7': '#9B59B6',
            # Minor 7th - teal
            'Cm7': '#17A589', 'Dm7': '#1ABC9C', 'Em7': '#48C9B0', 
            'Fm7': '#76D7C4', 'Gm7': '#45B39D', 'Am7': '#138D75', 'Bm7': '#0E6655',
            # Diminished - gray/brown
            'Cdim': '#7F8C8D', 'Ddim': '#95A5A6', 'Edim': '#BDC3C7', 
            'Fdim': '#AAB7B8', 'Gdim': '#99A3A4', 'Adim': '#85929E', 'Bdim': '#717D7E',
            # Augmented - orange/red
            'Caug': '#E67E22', 'Daug': '#D68910', 'Eaug': '#CA6F1E',
            'Faug': '#BA4A00', 'Gaug': '#A04000', 'Aaug': '#873600',
            # Sus chords - yellow/green
            'Csus2': '#F4D03F', 'Csus4': '#F7DC6F', 'Dsus2': '#F9E79F', 'Dsus4': '#FAD7A0',
            'Esus2': '#F8B739', 'Esus4': '#F5B041', 'Fsus2': '#EB984E', 'Fsus4': '#E59866',
            'Gsus2': '#DC7633', 'Gsus4': '#D68910', 'Asus2': '#CA6F1E', 'Asus4': '#BA4A00',
            # 9th chords - bright pink
            'C9': '#FF69B4', 'D9': '#FF1493', 'E9': '#DB7093', 'F9': '#C71585',
            'G9': '#D02090', 'A9': '#FF00FF',
            # Minor 9th - deep purple
            'Cm9': '#8B008B', 'Dm9': '#9400D3', 'Em9': '#9932CC', 'Am9': '#BA55D3',
            # 6th chords - soft yellow
            'C6': '#FFE4B5', 'D6': '#FFDAB9', 'E6': '#FFEFD5', 'F6': '#FFEBCD',
            'G6': '#FFEAA7', 'A6': '#FDCB6E',
            # Minor 6th - pale blue
            'Cm6': '#87CEEB', 'Dm6': '#87CEFA', 'Em6': '#00BFFF', 'Am6': '#1E90FF',
            # Add9 chords - peach/coral
            'Cadd9': '#FFDAB9', 'Dadd9': '#FFB347', 'Eadd9': '#FF9966', 
            'Fadd9': '#FF8C69', 'Gadd9': '#FFA07A', 'Aadd9': '#FF7F50',
            # Power chords - bold red/black
            'C5': '#8B0000', 'D5': '#A52A2A', 'E5': '#B22222', 'F5': '#DC143C',
            'G5': '#CD5C5C', 'A5': '#E9967A', 'B5': '#FA8072',
        }
        
        self.setup_ui()
        
        # Load default Happy Birthday song
        self.root.after(200, self.load_default_song)
        
    def setup_ui(self):
        """Setup the user interface"""
        # Top control panel
        control_frame = tk.Frame(self.root, bg=self.panel_color, height=80)
        control_frame.pack(fill=tk.X, padx=10, pady=5)
        control_frame.pack_propagate(False)
        
        # Play button
        self.play_btn = tk.Button(control_frame, text="▶ Play", command=self.play_music,
                                   bg='#4CAF50', fg='white', font=('Arial', 14, 'bold'),
                                   width=10, height=2, relief=tk.RAISED, bd=3)
        self.play_btn.pack(side=tk.LEFT, padx=10, pady=10)
        
        # Stop button
        self.stop_btn = tk.Button(control_frame, text="⬛ Stop", command=self.stop_music,
                                   bg='#f44336', fg='white', font=('Arial', 14, 'bold'),
                                   width=10, height=2, relief=tk.RAISED, bd=3)
        self.stop_btn.pack(side=tk.LEFT, padx=10, pady=10)
        
        # New button
        new_btn = tk.Button(control_frame, text="📄 New", command=self.new_song,
                           bg='#2196F3', fg='white', font=('Arial', 14, 'bold'),
                           width=8, height=2, relief=tk.RAISED, bd=3)
        new_btn.pack(side=tk.LEFT, padx=5, pady=10)
        
        # Export Audio button
        export_btn = tk.Button(control_frame, text="🎵 Export", command=self.export_audio,
                              bg='#00BCD4', fg='white', font=('Arial', 13, 'bold'),
                              width=8, height=2, relief=tk.RAISED, bd=3)
        export_btn.pack(side=tk.LEFT, padx=5, pady=10)
        
        # Save Project button
        save_btn = tk.Button(control_frame, text="💾 Save", command=self.save_project,
                            bg='#0097A7', fg='white', font=('Arial', 13, 'bold'),
                            width=8, height=2, relief=tk.RAISED, bd=3)
        save_btn.pack(side=tk.LEFT, padx=5, pady=10)
        
        # Load button
        load_btn = tk.Button(control_frame, text="📂 Open", command=self.load_song,
                            bg='#009688', fg='white', font=('Arial', 13, 'bold'),
                            width=8, height=2, relief=tk.RAISED, bd=3)
        load_btn.pack(side=tk.LEFT, padx=5, pady=10)
        
        # Clear button
        clear_btn = tk.Button(control_frame, text="🗑 Clear", command=self.clear_timeline,
                             bg='#FF9800', fg='white', font=('Arial', 14, 'bold'),
                             width=8, height=2, relief=tk.RAISED, bd=3)
        clear_btn.pack(side=tk.LEFT, padx=5, pady=10)
        
        # BPM control
        tk.Label(control_frame, text="BPM:", bg=self.panel_color, 
                fg='white', font=('Arial', 12)).pack(side=tk.LEFT, padx=(30, 5))
        self.bpm_var = tk.StringVar(value=str(self.bpm))
        bpm_spin = tk.Spinbox(control_frame, from_=60, to=200, textvariable=self.bpm_var,
                             width=8, font=('Arial', 12), command=self.update_bpm)
        bpm_spin.pack(side=tk.LEFT, padx=5)
        
        # Key selector
        tk.Label(control_frame, text="Key:", bg=self.panel_color,
                fg='white', font=('Arial', 12)).pack(side=tk.LEFT, padx=(30, 5))
        self.key_var = tk.StringVar(value=self.current_key)
        key_combo = ttk.Combobox(control_frame, textvariable=self.key_var,
                                values=['C', 'G', 'D', 'A', 'E', 'F'],
                                width=5, font=('Arial', 12), state='readonly')
        key_combo.pack(side=tk.LEFT, padx=5)
        key_combo.bind('<<ComboboxSelected>>', self.update_key)
        
        # Instrument selector
        tk.Label(control_frame, text="Instrument:", bg=self.panel_color,
                fg='white', font=('Arial', 12)).pack(side=tk.LEFT, padx=(30, 5))
        self.instrument_var = tk.StringVar(value='Piano')
        instrument_combo = ttk.Combobox(control_frame, textvariable=self.instrument_var,
                                values=['Piano', 'Guitar', 'Strings', 'Organ', 'Synth', 'Bass',
                                       'Flute', 'Saxophone', 'Trumpet', 'Trombone', 'Violin', 'Cello'],
                                width=12, font=('Arial', 12), state='readonly')
        instrument_combo.pack(side=tk.LEFT, padx=5)
        instrument_combo.bind('<<ComboboxSelected>>', self.update_instrument)
        
        # Main content area
        content_frame = tk.Frame(self.root, bg=self.bg_color)
        content_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)
        
        # Left panel - Chord palette
        palette_frame = tk.Frame(content_frame, bg=self.panel_color, width=200)
        palette_frame.pack(side=tk.LEFT, fill=tk.Y, padx=(0, 10))
        palette_frame.pack_propagate(False)
        
        tk.Label(palette_frame, text="Chords", bg=self.panel_color, fg='white',
                font=('Arial', 16, 'bold')).pack(pady=10)
        
        # Scrollable chord list
        canvas_frame = tk.Frame(palette_frame, bg=self.panel_color)
        canvas_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        palette_canvas = tk.Canvas(canvas_frame, bg=self.panel_color, 
                                   highlightthickness=0)
        scrollbar = ttk.Scrollbar(canvas_frame, orient="vertical", 
                                 command=palette_canvas.yview)
        chord_container = tk.Frame(palette_canvas, bg=self.panel_color)
        
        palette_canvas.configure(yscrollcommand=scrollbar.set)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        palette_canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        palette_canvas.create_window((0, 0), window=chord_container, anchor='nw')
        
        # Organized chord sections
        chord_sections = [
            ('SINGLE NOTES', ['C4n', 'D4n', 'E4n', 'F4n', 'G4n', 'A4n', 'B4n',
                              'C5n', 'D5n', 'E5n', 'F5n', 'G5n', 'A5n', 'B5n']),
            ('MAJOR CHORDS', ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Db', 'Eb', 'Gb', 'Ab', 'Bb']),
            ('MINOR CHORDS', ['Cm', 'Dm', 'Em', 'Fm', 'Gm', 'Am', 'Bm', 'C#m', 'Ebm', 'F#m', 'Abm', 'Bbm']),
            ('DOMINANT 7TH', ['C7', 'D7', 'E7', 'F7', 'G7', 'A7', 'B7', 'Bb7', 'Eb7', 'Ab7']),
            ('MAJOR 7TH', ['Cmaj7', 'Dmaj7', 'Emaj7', 'Fmaj7', 'Gmaj7', 'Amaj7', 'Bmaj7']),
            ('MINOR 7TH', ['Cm7', 'Dm7', 'Em7', 'Fm7', 'Gm7', 'Am7', 'Bm7']),
            ('SUSPENDED', ['Csus2', 'Csus4', 'Dsus2', 'Dsus4', 'Esus2', 'Esus4',
                           'Fsus2', 'Fsus4', 'Gsus2', 'Gsus4', 'Asus2', 'Asus4']),
            ('9TH CHORDS', ['C9', 'D9', 'E9', 'F9', 'G9', 'A9', 'Cm9', 'Dm9', 'Em9', 'Am9']),
            ('6TH CHORDS', ['C6', 'D6', 'E6', 'F6', 'G6', 'A6', 'Cm6', 'Dm6', 'Em6', 'Am6']),
            ('ADD9 CHORDS', ['Cadd9', 'Dadd9', 'Eadd9', 'Fadd9', 'Gadd9', 'Aadd9']),
            ('POWER CHORDS', ['C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5']),
            ('DIMINISHED', ['Cdim', 'Ddim', 'Edim', 'Fdim', 'Gdim', 'Adim', 'Bdim']),
            ('AUGMENTED', ['Caug', 'Daug', 'Eaug', 'Faug', 'Gaug', 'Aaug']),
        ]
        
        for section_name, chords in chord_sections:
            # Section header
            section_label = tk.Label(chord_container, text=section_name, 
                                    bg=self.panel_color, fg='#FFD700',
                                    font=('Arial', 11, 'bold'))
            section_label.pack(pady=(10, 5))
            
            # Chords in this section
            for chord in chords:
                self.create_chord_button(chord_container, chord)
        
        chord_container.update_idletasks()
        palette_canvas.config(scrollregion=palette_canvas.bbox("all"))
        
        # Right panel - Timeline
        timeline_frame = tk.Frame(content_frame, bg=self.timeline_color)
        timeline_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        
        tk.Label(timeline_frame, text="Timeline (Drag chords here)", 
                bg=self.timeline_color, fg='white',
                font=('Arial', 14, 'bold')).pack(pady=5)
        
        # Timeline canvas with scrollbar
        timeline_container = tk.Frame(timeline_frame, bg=self.timeline_color)
        timeline_container.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Navigation buttons frame
        nav_frame = tk.Frame(timeline_container, bg=self.timeline_color)
        nav_frame.pack(side=tk.BOTTOM, fill=tk.X, pady=(0, 5))
        
        # Scroll left button
        btn_left = tk.Button(nav_frame, text="◄◄ Scroll Left", command=self.scroll_left,
                            bg='#555', fg='white', font=('Arial', 10, 'bold'))
        btn_left.pack(side=tk.LEFT, padx=5)
        
        # Scroll right button
        btn_right = tk.Button(nav_frame, text="Scroll Right ►►", command=self.scroll_right,
                             bg='#555', fg='white', font=('Arial', 10, 'bold'))
        btn_right.pack(side=tk.LEFT, padx=5)
        
        # Info label
        tk.Label(nav_frame, text="Tip: Use scrollbar below or Shift+MouseWheel to scroll", 
                bg=self.timeline_color, fg='#aaa', font=('Arial', 9)).pack(side=tk.LEFT, padx=20)
        
        # Horizontal scrollbar
        h_scrollbar = ttk.Scrollbar(timeline_container, orient=tk.HORIZONTAL)
        h_scrollbar.pack(side=tk.BOTTOM, fill=tk.X)
        
        # Timeline canvas
        self.timeline = tk.Canvas(timeline_container, bg='#1a1a1a', 
                                 highlightthickness=1, highlightbackground='#555',
                                 xscrollcommand=h_scrollbar.set)
        self.timeline.pack(side=tk.TOP, fill=tk.BOTH, expand=True)
        
        h_scrollbar.config(command=self.timeline.xview)
        
        # Set scrollregion for infinite timeline (200 beats)
        self.timeline_beats = 200
        self.beat_width = 80
        
        # Bind timeline events
        self.timeline.bind('<Button-1>', self.timeline_click)
        self.timeline.bind('<B1-Motion>', self.timeline_drag)
        self.timeline.bind('<ButtonRelease-1>', self.timeline_release)
        self.timeline.bind('<Button-3>', self.timeline_right_click)
        self.timeline.bind('<Configure>', self.on_timeline_configure)
        
        # Enable mouse wheel scrolling
        self.timeline.bind('<MouseWheel>', self.on_mousewheel)
        self.timeline.bind('<Shift-MouseWheel>', self.on_shift_mousewheel)
        
        # Initialize after a short delay to ensure proper sizing
        self.root.after(100, self.initialize_timeline)
        
    def create_chord_button(self, parent, chord_name):
        """Create a draggable chord button"""
        color = self.chord_color_map.get(chord_name, '#888')
        btn = tk.Button(parent, text=chord_name, bg=color, fg='white',
                       font=('Arial', 12, 'bold'), width=12, height=2,
                       relief=tk.RAISED, bd=3, cursor='hand2')
        btn.pack(pady=5, padx=10)
        
        # Bind drag events
        btn.bind('<Button-1>', lambda e: self.start_drag_chord(chord_name))
        
    def start_drag_chord(self, chord_name):
        """Start dragging a chord from the palette"""
        self.dragging_chord = chord_name
        
    def initialize_timeline(self):
        """Initialize timeline with proper scroll region"""
        width = self.timeline_beats * self.beat_width
        height = max(500, self.timeline.winfo_height())
        self.timeline.config(scrollregion=(0, 0, width, height))
        self.draw_timeline_grid()
    
    def on_timeline_configure(self, event):
        """Handle timeline resize"""
        width = self.timeline_beats * self.beat_width
        height = max(500, event.height)
        self.timeline.config(scrollregion=(0, 0, width, height))
    
    def on_mousewheel(self, event):
        """Handle vertical mouse wheel (scroll horizontally with shift)"""
        # On Windows, event.delta is typically +-120 per notch
        pass
    
    def on_shift_mousewheel(self, event):
        """Handle shift+mouse wheel for horizontal scrolling"""
        # Scroll horizontally when shift is held
        self.timeline.xview_scroll(int(-1 * (event.delta / 120)), "units")
    
    def scroll_left(self):
        """Scroll timeline to the left"""
        self.timeline.xview_scroll(-5, "units")
    
    def scroll_right(self):
        """Scroll timeline to the right"""
        self.timeline.xview_scroll(5, "units")
    
    def draw_timeline_grid(self):
        """Draw the timeline grid"""
        self.timeline.delete('grid')
        self.timeline.delete('header')
        
        # Use full scrollable width
        width = self.timeline_beats * self.beat_width
        height = int(self.timeline.cget('scrollregion').split()[3]) if self.timeline.cget('scrollregion') else 500
        
        # Draw header background for beat numbers
        header_height = 25
        self.timeline.create_rectangle(0, 0, width, header_height, 
                                      fill='#2a2a2a', outline='', tags='header')
        
        # Vertical lines (beats) - draw all beats
        for i in range(0, width, self.beat_width):
            # Draw line starting from header area
            self.timeline.create_line(i, header_height, i, height, fill='#333', tags='grid')
            beat_num = i // self.beat_width
            # Draw beat number in header area
            self.timeline.create_text(i + 5, header_height//2, text=str(beat_num), 
                                     fill='#FFD700', anchor='w', tags='header',
                                     font=('Arial', 10, 'bold'))
        
        # Horizontal lines (tracks) - start below header
        track_height = 60
        for i in range(header_height + track_height, height, track_height):
            self.timeline.create_line(0, i, width, i, fill='#333', tags='grid')
        
        # Add track labels - adjust for header
        for track_num in range(0, (height - header_height) // track_height):
            self.timeline.create_text(5, header_height + track_num * track_height + 30, 
                                     text=f'Track {track_num + 1}', 
                                     fill='#555', anchor='w', tags='grid',
                                     font=('Arial', 9, 'italic'))
    
    def timeline_click(self, event):
        """Handle timeline click"""
        # Get actual canvas coordinates (accounting for scroll)
        canvas_x = self.timeline.canvasx(event.x)
        canvas_y = self.timeline.canvasy(event.y)
        
        header_height = 25
        
        # Ignore clicks in header area
        if canvas_y < header_height:
            return
        
        # Check if clicking on the right edge of a block for stretching
        for block in self.chord_blocks:
            x = block.position * self.beat_width
            width = block.duration * self.beat_width
            right_edge = x + width
            track_y = header_height + block.track * 60 + 5
            track_y_end = track_y + 50
            
            # Check if near right edge (within 10 pixels) and on same track
            if (abs(canvas_x - right_edge) < 10 and 
                track_y <= canvas_y <= track_y_end):
                self.stretching_block = block
                self.stretch_start_x = canvas_x
                return
        
        if self.dragging_chord:
            # Add chord to timeline
            beat_position = int(canvas_x // self.beat_width)
            track = int((canvas_y - header_height) // 60)  # Determine which track/row, accounting for header
            
            new_block = ChordBlock(self.dragging_chord, beat_position, duration=1.0, track=track)
            self.chord_blocks.append(new_block)
            self.draw_chord_block(new_block)
            self.dragging_chord = None
    
    def timeline_drag(self, event):
        """Handle dragging on timeline"""
        if self.stretching_block:
            # Get actual canvas coordinates
            canvas_x = self.timeline.canvasx(event.x)
            
            # Calculate new duration based on drag
            x = self.stretching_block.position * self.beat_width
            new_width = canvas_x - x
            new_duration = max(0.5, new_width / self.beat_width)  # Minimum 0.5 beats
            
            self.stretching_block.duration = new_duration
            
            # Redraw the block - delete both rectangle and text
            if self.stretching_block.canvas_id:
                self.timeline.delete(self.stretching_block.canvas_id)
            if self.stretching_block.text_id:
                self.timeline.delete(self.stretching_block.text_id)
            self.draw_chord_block(self.stretching_block)
    
    def timeline_release(self, event):
        """Handle release on timeline"""
        self.dragging_chord = None
        self.stretching_block = None
    
    def timeline_right_click(self, event):
        """Handle right-click to delete chord"""
        # Get actual canvas coordinates
        canvas_x = self.timeline.canvasx(event.x)
        canvas_y = self.timeline.canvasy(event.y)
        
        # Find chord at position
        items = self.timeline.find_overlapping(canvas_x-5, canvas_y-5, 
                                               canvas_x+5, canvas_y+5)
        for item in items:
            for block in self.chord_blocks:
                if block.canvas_id == item or block.text_id == item:
                    if block.canvas_id:
                        self.timeline.delete(block.canvas_id)
                    if block.text_id:
                        self.timeline.delete(block.text_id)
                    self.chord_blocks.remove(block)
                    return
    
    def draw_chord_block(self, block):
        """Draw a chord block on the timeline"""
        x = block.position * self.beat_width
        track_height = 60
        header_height = 25
        y = header_height + block.track * track_height + 5  # Position based on track number, below header
        width = block.duration * self.beat_width - 4
        height = track_height - 10  # Fit within track with padding
        
        color = self.chord_color_map.get(block.chord_name, '#888')
        
        rect = self.timeline.create_rectangle(x + 2, y, x + width, y + height,
                                              fill=color, outline='white', width=2)
        text = self.timeline.create_text(x + width/2, y + height/2,
                                         text=block.chord_name, fill='white',
                                         font=('Arial', 12, 'bold'))
        block.canvas_id = rect
        block.text_id = text
        
        # Ensure header stays on top
        self.timeline.tag_raise('header')
    
    def timeline_release(self, event):
        """Handle release on timeline"""
        self.dragging_chord = None
        self.stretching_block = None
    
    def timeline_right_click(self, event):
        """Handle right-click to delete chord"""
        # Get actual canvas coordinates
        canvas_x = self.timeline.canvasx(event.x)
        canvas_y = self.timeline.canvasy(event.y)
        
        # Find chord at position
        items = self.timeline.find_overlapping(canvas_x-5, canvas_y-5, 
                                               canvas_x+5, canvas_y+5)
        for item in items:
            for block in self.chord_blocks:
                if block.canvas_id == item or block.text_id == item:
                    if block.canvas_id:
                        self.timeline.delete(block.canvas_id)
                    if block.text_id:
                        self.timeline.delete(block.text_id)
                    self.chord_blocks.remove(block)
                    return
    
    def draw_chord_block(self, block):
        """Draw a chord block on the timeline"""
        x = block.position * self.beat_width
        track_height = 60
        header_height = 25
        y = header_height + block.track * track_height + 5  # Position based on track number, below header
        width = block.duration * self.beat_width - 4
        height = track_height - 10  # Fit within track with padding
        
        color = self.chord_color_map.get(block.chord_name, '#888')
        
        rect = self.timeline.create_rectangle(x + 2, y, x + width, y + height,
                                              fill=color, outline='white', width=2)
        text = self.timeline.create_text(x + width/2, y + height/2,
                                         text=block.chord_name, fill='white',
                                         font=('Arial', 12, 'bold'))
        block.canvas_id = rect
        block.text_id = text
        
        # Ensure header stays on top
        self.timeline.tag_raise('header')
    
    def update_bpm(self):
        """Update BPM"""
        try:
            self.bpm = int(self.bpm_var.get())
        except:
            pass
    
    def update_key(self, event):
        """Update musical key"""
        self.current_key = self.key_var.get()
    
    def update_instrument(self, event):
        """Update instrument"""
        instrument = self.instrument_var.get()
        self.chord_generator.set_instrument(instrument)
    
    def toggle_repeat(self):
        """Toggle repeat mode"""
        self.repeat_mode = not self.repeat_mode
        if self.repeat_mode:
            self.repeat_btn.config(relief=tk.SUNKEN, bg='#7B1FA2')
        else:
            self.repeat_btn.config(relief=tk.RAISED, bg='#9C27B0')
    
    def clear_timeline(self, confirm=True):
        """Clear all chords from timeline"""
        if confirm and self.chord_blocks and not messagebox.askyesno("Clear Timeline", 
                                                     "Clear all chords?"):
            return
        self.timeline.delete('all')
        self.chord_blocks.clear()
        self.draw_timeline_grid()
    
    def play_music(self):
        """Play the music sequence"""
        if not self.chord_blocks:
            messagebox.showinfo("Empty Timeline", "Add some chords first!")
            return
        
        if self.is_playing:
            return
        
        self.is_playing = True
        self.play_btn.config(state=tk.DISABLED)
        
        # Play in separate thread
        thread = threading.Thread(target=self._play_sequence, daemon=True)
        thread.start()
    
    def _play_sequence(self):
        """Play the chord sequence with multi-track support"""
        try:
            if not self.chord_blocks:
                return
            
            beat_duration = 60.0 / self.bpm  # Duration of one beat in seconds
            
            # Loop if repeat mode is on
            while True:
                # Sort all blocks by their start time
                sorted_blocks = sorted(self.chord_blocks, key=lambda b: b.position)
                
                # Find the total duration
                if sorted_blocks:
                    max_end_time = max(block.position + block.duration for block in sorted_blocks)
                else:
                    break
                
                # Pre-generate all sounds and their start times
                scheduled_sounds = []
                for block in sorted_blocks:
                    start_time_ms = int(block.position * beat_duration * 1000)
                    instrument = self.instrument_var.get() if hasattr(self, 'instrument_var') else 'Piano'
                    sound = self.chord_generator.generate_chord(
                        block.chord_name, 
                        duration=block.duration * beat_duration,
                        instrument=instrument
                    )
                    scheduled_sounds.append((start_time_ms, sound))
                
                # Sort by start time
                scheduled_sounds.sort(key=lambda x: x[0])
                
                # Play all sounds with precise timing
                start_ticks = pygame.time.get_ticks()
                sound_index = 0
                
                while sound_index < len(scheduled_sounds):
                    if not self.is_playing:
                        return
                    
                    current_ticks = pygame.time.get_ticks()
                    elapsed_ms = current_ticks - start_ticks
                    
                    # Play all sounds that should start now
                    while sound_index < len(scheduled_sounds):
                        scheduled_start_ms, sound = scheduled_sounds[sound_index]
                        
                        # If this sound's start time has arrived (with 50ms tolerance)
                        if elapsed_ms >= scheduled_start_ms - 50:
                            channel = pygame.mixer.find_channel()
                            if channel:
                                channel.play(sound)
                            sound_index += 1
                        else:
                            break
                    
                    # Small sleep to prevent CPU spinning
                    pygame.time.wait(10)
                
                # Wait for all sounds to finish
                final_duration_ms = int(max_end_time * beat_duration * 1000)
                while pygame.time.get_ticks() - start_ticks < final_duration_ms:
                    if not self.is_playing:
                        return
                    pygame.time.wait(50)
                
                # If not in repeat mode, break after one playthrough
                if not self.repeat_mode:
                    break
        
        finally:
            self.is_playing = False
            self.root.after(0, lambda: self.play_btn.config(state=tk.NORMAL))
    
    def stop_music(self):
        """Stop playing music"""
        self.is_playing = False
        pygame.mixer.stop()
    
    def new_song(self):
        """Create a new song"""
        if self.chord_blocks and not messagebox.askyesno("New Song", 
                                                          "Create new song? Current song will be lost if not saved."):
            return
        self.clear_timeline()
        self.root.title("Music Composer - New Song")
    
    def export_audio(self):
        """Export the song as a WAV audio file"""
        if not self.chord_blocks:
            messagebox.showinfo("Empty Song", "Nothing to export! Add some chords first.")
            return
        
        filename = filedialog.asksaveasfilename(
            defaultextension=".wav",
            filetypes=[("WAV Audio", "*.wav"), ("All files", "*.*")],
            title="Export Audio"
        )
        
        if filename:
            try:
                # Show progress
                progress_msg = tk.Toplevel(self.root)
                progress_msg.title("Exporting...")
                progress_msg.geometry("300x100")
                tk.Label(progress_msg, text="Rendering audio...\nPlease wait.", 
                        font=('Arial', 12), pady=20).pack()
                progress_msg.update()
                
                # Render the audio
                audio_data = self._render_audio_to_array()
                
                # Save as WAV
                import wave
                with wave.open(filename, 'wb') as wav_file:
                    wav_file.setnchannels(2)  # Stereo
                    wav_file.setsampwidth(2)   # 16-bit
                    wav_file.setframerate(44100)
                    wav_file.writeframes(audio_data.tobytes())
                
                progress_msg.destroy()
                messagebox.showinfo("Success", f"Audio exported successfully!\n{os.path.basename(filename)}")
            except Exception as e:
                if 'progress_msg' in locals():
                    progress_msg.destroy()
                messagebox.showerror("Error", f"Failed to export audio: {str(e)}")
    
    def save_project(self):
        """Save the current song project as JSON"""
        if not self.chord_blocks:
            messagebox.showinfo("Empty Song", "Nothing to save! Add some chords first.")
            return
        
        filename = filedialog.asksaveasfilename(
            defaultextension=".json",
            filetypes=[("Project files", "*.json"), ("All files", "*.*")],
            title="Save Project"
        )
        
        if filename:
            song_data = {
                'bpm': self.bpm,
                'key': self.current_key,
                'blocks': [
                    {
                        'chord_name': block.chord_name,
                        'position': block.position,
                        'duration': block.duration,
                        'track': block.track
                    }
                    for block in self.chord_blocks
                ]
            }
            
            try:
                with open(filename, 'w') as f:
                    json.dump(song_data, f, indent=2)
                self.root.title(f"Music Composer - {os.path.basename(filename)}")
                messagebox.showinfo("Success", "Song saved successfully!")
            except Exception as e:
                messagebox.showerror("Error", f"Failed to save song: {str(e)}")
    
    def load_song(self):
        """Load a song from a file"""
        filename = filedialog.askopenfilename(
            filetypes=[("Music files", "*.json"), ("All files", "*.*")],
            title="Open Song"
        )
        
        if filename:
            try:
                with open(filename, 'r') as f:
                    song_data = json.load(f)
                
                # Clear current song without confirmation
                self.clear_timeline(confirm=False)
                
                # Load BPM and key
                self.bpm = song_data.get('bpm', 120)
                self.bpm_var.set(str(self.bpm))
                self.current_key = song_data.get('key', 'C')
                self.key_var.set(self.current_key)
                
                # Load blocks
                for block_data in song_data.get('blocks', []):
                    block = ChordBlock(
                        chord_name=block_data['chord_name'],
                        position=block_data['position'],
                        duration=block_data.get('duration', 1.0),
                        track=block_data.get('track', 0)
                    )
                    self.chord_blocks.append(block)
                    self.draw_chord_block(block)
                
                self.root.title(f"Music Composer - {os.path.basename(filename)}")
                messagebox.showinfo("Success", "Song loaded successfully!")
            except Exception as e:
                messagebox.showerror("Error", f"Failed to load song: {str(e)}")
    
    def _render_audio_to_array(self):
        """Render the entire song to a numpy array"""
        # Sort blocks by position
        sorted_blocks = sorted(self.chord_blocks, key=lambda b: (b.position, b.track))
        
        if not sorted_blocks:
            return np.array([], dtype=np.int16)
        
        # Calculate total duration
        max_end = max(block.position + block.duration for block in sorted_blocks)
        beat_duration = 60.0 / self.bpm
        total_duration = max_end * beat_duration
        
        # Create silence buffer
        num_samples = int(44100 * total_duration)
        final_audio = np.zeros((num_samples, 2), dtype=np.float32)
        
        # Process blocks by position to handle overlapping tracks
        i = 0
        while i < len(sorted_blocks):
            current_block_position = sorted_blocks[i].position
            blocks_at_position = []
            
            # Get all blocks at the same position
            while i < len(sorted_blocks) and sorted_blocks[i].position == current_block_position:
                blocks_at_position.append(sorted_blocks[i])
                i += 1
            
            # Render each block at this position
            for block in blocks_at_position:
                # Generate chord audio
                chord_duration = block.duration * beat_duration
                instrument = self.instrument_var.get() if hasattr(self, 'instrument_var') else 'Piano'
                sound = self.chord_generator.generate_chord(block.chord_name, duration=chord_duration, instrument=instrument)
                
                # Convert pygame sound to numpy array
                sound_array = pygame.sndarray.array(sound)
                
                # Calculate position in samples
                start_sample = int(block.position * beat_duration * 44100)
                end_sample = min(start_sample + len(sound_array), num_samples)
                
                # Mix into final audio
                sound_length = end_sample - start_sample
                if sound_length > 0:
                    final_audio[start_sample:end_sample] += sound_array[:sound_length].astype(np.float32)
        
        # Normalize to prevent clipping
        max_val = np.max(np.abs(final_audio))
        if max_val > 0:
            final_audio = final_audio * (32767.0 / max_val) * 0.9  # Leave headroom
        
        # Convert to 16-bit integer
        final_audio = final_audio.astype(np.int16)
        
        return final_audio
    
    def load_default_song(self):
        """Load Happy Birthday as default song"""
        # Happy Birthday melody in C major (actual notes)
        # Phrase 1: "Happy birthday to you"
        # Phrase 2: "Happy birthday to you"
        # Phrase 3: "Happy birthday dear [name]"
        # Phrase 4: "Happy birthday to you"
        
        self.bpm = 100  # Slower tempo for Happy Birthday
        self.bpm_var.set(str(self.bpm))
        
        default_blocks = [
            # Melody track (Track 0) - Actual Happy Birthday melody
            # "Happy birthday to you" (Phrase 1)
            ChordBlock('G4n', 0, 0.75, 0),      # Hap-
            ChordBlock('G4n', 0.75, 0.25, 0),   # py
            ChordBlock('A4n', 1, 1, 0),          # birth-
            ChordBlock('G4n', 2, 1, 0),          # day
            ChordBlock('C5n', 3, 1, 0),          # to
            ChordBlock('B4n', 4, 2, 0),          # you
            
            # "Happy birthday to you" (Phrase 2)
            ChordBlock('G4n', 6, 0.75, 0),      # Hap-
            ChordBlock('G4n', 6.75, 0.25, 0),   # py
            ChordBlock('A4n', 7, 1, 0),          # birth-
            ChordBlock('G4n', 8, 1, 0),          # day
            ChordBlock('D5n', 9, 1, 0),          # to
            ChordBlock('C5n', 10, 2, 0),         # you
            
            # "Happy birthday dear [name]" (Phrase 3)
            ChordBlock('G4n', 12, 0.75, 0),     # Hap-
            ChordBlock('G4n', 12.75, 0.25, 0),  # py
            ChordBlock('G5n', 13, 1, 0),         # birth-
            ChordBlock('E5n', 14, 1, 0),         # day
            ChordBlock('C5n', 15, 1, 0),         # dear
            ChordBlock('B4n', 16, 1, 0),         # [name]
            ChordBlock('A4n', 17, 2, 0),         # (name)
            
            # "Happy birthday to you" (Phrase 4)
            ChordBlock('F5n', 19, 0.75, 0),     # Hap-
            ChordBlock('F5n', 19.75, 0.25, 0),  # py
            ChordBlock('E5n', 20, 1, 0),         # birth-
            ChordBlock('C5n', 21, 1, 0),         # day
            ChordBlock('D5n', 22, 1, 0),         # to
            ChordBlock('C5n', 23, 2, 0),         # you
            
            # Harmony track (Track 1) - Bass/chord accompaniment
            ChordBlock('C', 0, 6, 1),      # C chord for phrase 1
            ChordBlock('C', 6, 6, 1),      # C chord for phrase 2
            ChordBlock('C', 12, 7, 1),     # C chord for phrase 3
            ChordBlock('F', 19, 3, 1),     # F chord
            ChordBlock('C', 22, 3, 1),     # C chord for ending
        ]
        
        for block in default_blocks:
            self.chord_blocks.append(block)
            self.draw_chord_block(block)
        
        self.root.title("Music Composer - Happy Birthday")
    
    def run(self):
        """Run the application"""
        self.root.mainloop()

def main():
    root = tk.Tk()
    app = MusicApp(root)
    app.run()

if __name__ == "__main__":
    main()
