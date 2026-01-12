# 🎵 Music Composer App

A fast, user-friendly music composition app with drag-and-drop functionality!

## ✨ Features

- **70+ Chords & Notes**: Comprehensive library including major, minor, 7th, diminished, augmented, and sus chords
- **Multi-Track Support**: Create complex arrangements with up to 8+ simultaneous tracks
- **Drag & Drop Interface**: Simply click and place chords on the timeline
- **Save/Load Songs**: Save your compositions and load them later
- **Default Song**: Happy Birthday loads automatically when you start the app
- **Adjustable BPM**: Control the tempo (60-200 BPM)
- **High-Quality Audio**: Enhanced synthesis with harmonics for rich, piano-like sound
- **Visual Timeline**: Infinite scrollable timeline with beat markers and track labels
- **Simultaneous Playback**: Play multiple tracks together for rich harmonies

## 🚀 Quick Start

### Installation

1. Install the required packages:
```bash
pip install -r requirements.txt
```

### Running the App

```bash
python music_app.py
```

The app will open with "Happy Birthday" already loaded!

## 🎹 How to Use

### Basic Composition

1. **Browse Chords**: Scroll through the left panel to see all 70+ available chords
2. **Place Chords**: Click a chord, then click on the timeline to place it
3. **Multiple Tracks**: Place chords at different vertical positions for multi-track arrangements
4. **Adjust Duration**: Click near the right edge of a chord block and drag to change duration
5. **Delete Chords**: Right-click on any chord to remove it

### Playback Controls

- **▶ Play**: Play your composition from start to finish
- **⬛ Stop**: Stop playback immediately
- **BPM**: Adjust tempo with the spinbox control

### File Operations

- **📄 New**: Create a new empty song
- **🎵 Export**: Export your composition as a WAV audio file (playable in any music player)
- **💾 Save**: Save your project as a .json file (to edit later)
- **📂 Open**: Load a previously saved project
- **🗑 Clear**: Remove all chords from the timeline

### Audio Export

When you click **🎵 Export**, your composition is rendered to a high-quality WAV audio file that you can:
- Play in any music player (Windows Media Player, VLC, iTunes, etc.)
- Share with friends
- Upload to social media
- Use in videos or other projects

### Project Files

When you click **💾 Save**, your project is saved as a JSON file that preserves:
- All chord positions and durations
- Track assignments
- BPM and key settings
- Everything needed to continue editing later

### Navigation

- **◄◄ / ►►**: Scroll the timeline left/right
- **Scrollbar**: Drag to navigate through 200 beats
- **Shift + Mouse Wheel**: Horizontal scroll with your mouse

## 🎼 Available Chords

### Major Chords
C, D, E, F, G, A, B, Db, Eb, Gb, Ab, Bb

### Minor Chords  
Cm, Dm, Em, Fm, Gm, Am, Bm, C#m, Ebm, F#m, Abm, Bbm

### 7th Chords
C7, D7, E7, F7, G7, A7, B7

### Major 7th Chords
Cmaj7, Dmaj7, Emaj7, Fmaj7, Gmaj7, Amaj7

### Minor 7th Chords
Cm7, Dm7, Em7, Fm7, Gm7, Am7

### Diminished Chords
Cdim, Ddim, Edim, Fdim, Gdim, Adim, Bdim

### Augmented Chords
Caug, Daug, Eaug, Faug, Gaug, Aaug

### Sus Chords
Csus2, Csus4, Dsus2, Dsus4, Esus2, Esus4, Fsus2, Fsus4, Gsus2, Gsus4, Asus2, Asus4

## 💡 Tips & Tricks

### Popular Progressions
- **Pop**: C → G → Am → F
- **Blues**: C7 → F7 → C7 → G7
- **Jazz**: Cmaj7 → Dm7 → G7 → Cmaj7
- **Sad**: Am → F → C → G

### Multi-Track Tips
- Use Track 1 for melody (single notes/short chords)
- Use Track 2 for bass line (lower chords)
- Use Track 3+ for harmony and fills
- Chords at the same beat position play simultaneously

### Composition Workflow
1. Start with a bass line on Track 2
2. Add chord progression on Track 1
3. Layer melody or fills on Track 3
4. Adjust BPM to match your style
5. Save frequently!

## 🎨 Visual Guide

- **Color-coded chords**: Each chord type has its own color family
  - Major: Warm reds/oranges/yellows
  - Minor: Cool blues/teals
  - 7th: Purples/pinks
  - Diminished: Grays
  - Augmented: Orange/red
  - Sus: Yellow/green

## 🔧 Technical Details

- Built with **tkinter** for GUI
- Uses **pygame** for audio playback
- **numpy** for enhanced audio synthesis with harmonics
- Real-time chord generation with rich, piano-like tones
- Multi-track simultaneous playback support
- JSON format for song storage

## 📁 File Format

Songs are saved as JSON with this structure:
```json
{
  "bpm": 120,
  "key": "C",
  "blocks": [
    {
      "chord_name": "C",
      "position": 0,
      "duration": 1.0,
      "track": 0
    }
  ]
}
```

## 🎯 Keyboard Shortcuts

- **Shift + Mouse Wheel**: Horizontal scroll
- **Right Click**: Delete chord
- **Left Click**: Place chord

---

Enjoy creating music! 🎶
