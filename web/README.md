# 🎵 Music Composer Studio - Web Version

A browser-based music composition tool that lets you create music by dragging and dropping chords onto a timeline!

## ✨ Features

- **120+ Chords & Notes**: Major, Minor, 7th, Sus, 9th, Power chords, and more
- **12 High-Quality Instruments**: Piano, Guitar, Strings, Organ, Synth, Bass, Flute, Saxophone, Trumpet, Trombone, Violin, Cello
- **Multi-Track Timeline**: Create complex arrangements with multiple tracks
- **Drag & Drop Interface**: Simply drag chords to the timeline
- **Real-Time Playback**: Hear your music instantly
- **Repeat Mode**: Loop your composition continuously
- **Save/Load Projects**: Save as JSON and continue later
- **Happy Birthday Demo**: Preloaded example song

## 🚀 How to Use

### Online (Easiest)
1. Simply open `index.html` in any modern web browser
2. No installation needed!

### Hosting Online
You can share your app with the world by hosting it on:

#### Option 1: GitHub Pages (Free)
1. Create a GitHub repository
2. Upload all files from the `web` folder
3. Go to Settings → Pages → Enable GitHub Pages
4. Your app will be live at: `https://yourusername.github.io/yourrepo`

#### Option 2: Netlify (Free)
1. Go to [netlify.com](https://www.netlify.com)
2. Drag and drop the `web` folder
3. Get instant URL like: `https://your-music-app.netlify.app`

#### Option 3: Vercel (Free)
1. Go to [vercel.com](https://vercel.com)
2. Deploy the `web` folder
3. Get instant URL

#### Option 4: Simple HTTP Server (Local)
```bash
cd web
python -m http.server 8000
# Open http://localhost:8000
```

## 🎹 Quick Start Guide

1. **Choose an Instrument**: Select from the dropdown (Piano, Guitar, etc.)
2. **Drag Chords**: Drag any chord from the left palette to the timeline
3. **Create Music**: Place multiple chords on different tracks
4. **Play**: Click the ▶ Play button to hear your composition
5. **Save**: Export your project as JSON to continue later

## 🎼 Creating Your First Song

1. Set BPM (60-200) - Default is 100
2. Drag a few chords onto Track 1 (e.g., C, F, G7, C)
3. Add a melody on Track 2 using single notes (C4n, D4n, E4n, etc.)
4. Click Play!

## 🎨 Chord Color Guide

- **Cyan**: Single notes for melodies
- **Warm colors (Red/Orange/Yellow)**: Major chords
- **Cool colors (Blue/Teal)**: Minor chords
- **Purple**: 7th chords
- **Pink**: 9th chords
- **Yellow-Green**: Suspended chords
- **Dark Red**: Power chords
- **Gray**: Diminished chords
- **Orange**: Augmented chords

## ⌨️ Keyboard Shortcuts

- **Right-click** on timeline: Delete chord block
- **Mouse wheel** over timeline: Scroll horizontally

## 🎛️ Controls

- **Play/Stop**: Control playback
- **🔁 Repeat**: Loop your song continuously
- **📄 New**: Start a new composition
- **💾 Save**: Download as JSON project file
- **📂 Open**: Load a saved project
- **🗑 Clear**: Remove all chords
- **◄◄/►►**: Scroll timeline left/right

## 🔊 Supported Instruments

Each instrument uses advanced Web Audio API synthesis:

1. **Piano**: Rich harmonics with natural decay
2. **Guitar**: Plucked strings with resonance
3. **Strings**: Orchestra section with vibrato
4. **Organ**: Hammond-style drawbars
5. **Synth**: Analog-style filter sweep
6. **Bass**: Deep sub-bass emphasis
7. **Flute**: Breathy with vibrato
8. **Saxophone**: Reedy jazz sound
9. **Trumpet**: Bright brass
10. **Trombone**: Warm brass with slide
11. **Violin**: Rich bow vibrato
12. **Cello**: Deep resonant tones

## 📱 Browser Compatibility

Works in all modern browsers:
- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Opera

Requires JavaScript and Web Audio API support.

## 🎓 Tips & Tricks

1. **Layer Tracks**: Use Track 1 for chords, Track 2 for melody
2. **Experiment**: Try different instruments for different tracks
3. **Common Progressions**:
   - Pop: C, Am, F, G
   - Jazz: Cmaj7, Am7, Dm7, G7
   - Blues: C7, F7, G7
4. **Save Often**: Download your projects regularly
5. **Repeat Mode**: Great for practicing or presentations

## 🌐 Sharing Your Compositions

Share your music projects by:
1. Saving as JSON
2. Sharing the file with others
3. They can load it in their browser!

## 🛠️ Technical Details

- Built with vanilla JavaScript
- Uses Web Audio API for synthesis
- Canvas-based timeline rendering
- Zero dependencies
- Fully client-side (no server needed)

## 📄 File Structure

```
web/
├── index.html       # Main HTML page
├── styles.css       # Styling
├── audio-engine.js  # Audio synthesis engine
└── app.js          # Application logic
```

## 🚀 Deploy Instantly

**One-Line Deploy Commands:**

```bash
# Using npx serve
npx serve web

# Using Python
python -m http.server 8000 --directory web

# Using Node.js http-server
npx http-server web -p 8000
```

Then open: `http://localhost:8000`

## 💡 Example Songs

Try creating these:
- **Happy Birthday**: Preloaded by default!
- **Twinkle Twinkle**: C, C, G, G, A, A, G (melody)
- **Chord Progression**: C, Am, F, G (repeat)

## 🎉 Share With The World!

This app runs entirely in the browser - just share the files or host them online!

Perfect for:
- Music education
- Quick composition sketches
- Learning music theory
- Fun experiments
- Sharing with friends

---

**Created with ❤️ using Web Audio API**

Enjoy making music! 🎵🎹🎸🎺🎻
