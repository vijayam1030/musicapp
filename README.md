# 🎵 Music Composer App

A fast, user-friendly music composition app with drag-and-drop functionality!

## ✨ Features

- **Pre-defined Chords**: 12 common chords ready to use (C, Dm, Em, F, G, Am, Bdim, Cmaj7, Dm7, Em7, Fmaj7, G7)
- **Drag & Drop**: Simply click on any chord and drop it on the timeline
- **Timeline Interface**: Visual timeline with beat markers
- **Play/Stop Controls**: Listen to your composition instantly
- **Adjustable BPM**: Control the tempo (60-200 BPM)
- **Key Selection**: Choose your musical key
- **Right-Click to Delete**: Remove chords easily

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

## 🎹 How to Use

1. **Start the App**: Run `python music_app.py`

2. **Add Chords**:
   - Click on any chord from the left panel
   - Click on the timeline where you want to place it
   - Each grid cell represents one beat

3. **Play Your Music**:
   - Click the **▶ Play** button to hear your composition
   - Click **⬛ Stop** to stop playback

4. **Adjust Settings**:
   - Change **BPM** to make it faster or slower
   - Select different **Keys** for different moods

5. **Edit**:
   - Right-click on any chord in the timeline to delete it
   - Click **🗑 Clear** to start over

## 🎼 Chord Guide

- **Major Chords** (C, F, G): Happy, bright sound
- **Minor Chords** (Dm, Em, Am): Sad, mellow sound
- **Diminished** (Bdim): Tense, unstable sound
- **7th Chords** (Cmaj7, Dm7, Em7, Fmaj7, G7): Rich, jazzy sound

## 💡 Tips

- Start with a simple progression: C → F → G → C
- Try the popular progression: C → Am → F → G
- Layer chords at different positions for interesting rhythms
- Experiment with different BPM values for different feels

## 🎨 Shortcuts

- **Left Click**: Place chord on timeline
- **Right Click**: Delete chord from timeline
- **Play Button**: Start playback
- **Stop Button**: Stop playback

## 🔧 Technical Details

- Built with **tkinter** for GUI
- Uses **pygame** for audio playback
- **numpy** for audio synthesis
- Real-time chord generation using sine wave synthesis

## 📝 Future Enhancements

- Save/Load compositions
- More chord types
- Multiple tracks
- Export to MIDI/WAV
- Undo/Redo functionality

---

Enjoy creating music! 🎶
