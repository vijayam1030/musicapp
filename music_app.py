"""
Music Composition App with Drag & Drop
A simple, fast music creation tool with pre-defined chords
"""

import tkinter as tk
from tkinter import ttk, messagebox
import pygame
import numpy as np
import threading
import os
from chord_generator import ChordGenerator

class ChordBlock:
    """Represents a chord block on the timeline"""
    def __init__(self, chord_name, position, duration=1.0):
        self.chord_name = chord_name
        self.position = position  # Position in beats
        self.duration = duration  # Duration in beats
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
        self.chord_colors = {
            'C': '#FF6B6B', 'Dm': '#4ECDC4', 'Em': '#45B7D1',
            'F': '#FFA07A', 'G': '#98D8C8', 'Am': '#F7DC6F',
            'Bdim': '#BB8FCE', 'Cmaj7': '#FF6B6B', 'Dm7': '#4ECDC4',
            'Em7': '#45B7D1', 'Fmaj7': '#FFA07A', 'G7': '#98D8C8'
        }
        
        self.setup_ui()
        
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
        
        # Clear button
        clear_btn = tk.Button(control_frame, text="🗑 Clear", command=self.clear_timeline,
                             bg='#FF9800', fg='white', font=('Arial', 14, 'bold'),
                             width=10, height=2, relief=tk.RAISED, bd=3)
        clear_btn.pack(side=tk.LEFT, padx=10, pady=10)
        
        # Repeat button
        self.repeat_btn = tk.Button(control_frame, text="🔁 Repeat", command=self.toggle_repeat,
                                    bg='#9C27B0', fg='white', font=('Arial', 14, 'bold'),
                                    width=10, height=2, relief=tk.RAISED, bd=3)
        self.repeat_btn.pack(side=tk.LEFT, padx=10, pady=10)
        
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
        
        # Common chords
        chords = ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim',
                 'Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7']
        
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
        
        # Initialize after a short delay to ensure proper sizing
        self.root.after(100, self.initialize_timeline)
        
    def create_chord_button(self, parent, chord_name):
        """Create a draggable chord button"""
        color = self.chord_colors.get(chord_name, '#888')
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
    
    def draw_timeline_grid(self):
        """Draw the timeline grid"""
        self.timeline.delete('grid')
        
        # Use full scrollable width
        width = self.timeline_beats * self.beat_width
        height = int(self.timeline.cget('scrollregion').split()[3]) if self.timeline.cget('scrollregion') else 500
        
        # Vertical lines (beats) - draw all beats
        for i in range(0, width, self.beat_width):
            self.timeline.create_line(i, 0, i, height, fill='#333', tags='grid')
            beat_num = i // self.beat_width
            self.timeline.create_text(i + 5, 10, text=str(beat_num), 
                                     fill='#666', anchor='nw', tags='grid')
        
        # Horizontal lines (tracks)
        track_height = 60
        for i in range(track_height, height, track_height):
            self.timeline.create_line(0, i, width, i, fill='#333', tags='grid')
    
    def timeline_click(self, event):
        """Handle timeline click"""
        # Get actual canvas coordinates (accounting for scroll)
        canvas_x = self.timeline.canvasx(event.x)
        canvas_y = self.timeline.canvasy(event.y)
        
        # Check if clicking on the right edge of a block for stretching
        for block in self.chord_blocks:
            x = block.position * self.beat_width
            width = block.duration * self.beat_width
            right_edge = x + width
            
            # Check if near right edge (within 10 pixels)
            if (abs(canvas_x - right_edge) < 10 and 
                40 <= canvas_y <= 90):
                self.stretching_block = block
                self.stretch_start_x = canvas_x
                return
        
        if self.dragging_chord:
            # Add chord to timeline
            beat_position = int(canvas_x // self.beat_width)
            track = int(canvas_y // 60)
            
            new_block = ChordBlock(self.dragging_chord, beat_position, duration=1.0)
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
        y = 40
        width = block.duration * self.beat_width - 4
        height = 50
        
        color = self.chord_colors.get(block.chord_name, '#888')
        
        rect = self.timeline.create_rectangle(x + 2, y, x + width, y + height,
                                              fill=color, outline='white', width=2)
        text = self.timeline.create_text(x + width/2, y + height/2,
                                         text=block.chord_name, fill='white',
                                         font=('Arial', 12, 'bold'))
        block.canvas_id = rect
        block.text_id = text
    
    def update_bpm(self):
        """Update BPM"""
        try:
            self.bpm = int(self.bpm_var.get())
        except:
            pass
    
    def update_key(self, event):
        """Update musical key"""
        self.current_key = self.key_var.get()
    
    def toggle_repeat(self):
        """Toggle repeat mode"""
        self.repeat_mode = not self.repeat_mode
        if self.repeat_mode:
            self.repeat_btn.config(relief=tk.SUNKEN, bg='#7B1FA2')
        else:
            self.repeat_btn.config(relief=tk.RAISED, bg='#9C27B0')
    
    def clear_timeline(self):
        """Clear all chords from timeline"""
        if self.chord_blocks and messagebox.askyesno("Clear Timeline", 
                                                     "Clear all chords?"):
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
        """Play the chord sequence"""
        try:
            # Sort blocks by position
            sorted_blocks = sorted(self.chord_blocks, key=lambda b: b.position)
            
            if not sorted_blocks:
                return
            
            beat_duration = 60.0 / self.bpm  # Duration of one beat in seconds
            
            # Loop if repeat mode is on
            while True:
                # Track current position in beats
                current_position = 0
                
                for block in sorted_blocks:
                    if not self.is_playing:
                        return
                    
                    # Wait for the gap before this chord (silence between chords)
                    if block.position > current_position:
                        gap = block.position - current_position
                        gap_time = int(gap * beat_duration * 1000)
                        pygame.time.wait(gap_time)
                    
                    # Generate and play chord
                    sound = self.chord_generator.generate_chord(block.chord_name, 
                                                               duration=block.duration * beat_duration)
                    channel = pygame.mixer.find_channel()
                    if channel:
                        channel.play(sound)
                    
                    # Wait for block duration
                    wait_time = int(block.duration * beat_duration * 1000)
                    pygame.time.wait(wait_time)
                    
                    # Update current position
                    current_position = block.position + block.duration
                
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
    
    def run(self):
        """Run the application"""
        self.root.mainloop()

def main():
    root = tk.Tk()
    app = MusicApp(root)
    app.run()

if __name__ == "__main__":
    main()
