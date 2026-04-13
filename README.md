# Voice Memo

Voice memo app built with vanilla JavaScript — zero dependencies, no build step.

**Live demo**: https://sen.ltd/portfolio/voice-memo/

## Features

- **Record** audio using the MediaRecorder API
- **Live waveform** visualization during recording (Canvas + Web Audio AnalyserNode)
- **Save** recordings to IndexedDB (handles large audio blobs)
- **Playback** with scrubber and play/pause controls
- **Label and tag** memos with inline editing
- **Transcription** using Web Speech API (best-effort, browser-dependent)
- **Delete / rename** memos
- **Export** audio as WebM/OGG/MP4 (browser-native format)
- **Total storage used** display
- **Japanese/English UI** with language-aware speech recognition
- Dark theme

## Tech stack

| Layer | Technology |
|-------|-----------|
| Audio capture | MediaRecorder API |
| Waveform | Canvas 2D + Web Audio AnalyserNode |
| Storage | IndexedDB |
| Transcription | Web Speech API (SpeechRecognition) |
| UI | Vanilla JS ES modules |
| i18n | Custom ja/en translation module |

## Browser compatibility

| Feature | Chrome | Firefox | Safari |
|---------|--------|---------|--------|
| MediaRecorder | ✅ | ✅ | ✅ 14.1+ |
| Web Speech API | ✅ | ❌ | ✅ partial |
| OfflineAudioContext | ✅ | ✅ | ✅ |

> Transcription is best-effort and depends on the browser's SpeechRecognition implementation. Chrome has the best support.

## Setup

```bash
npm run serve
# → http://localhost:8080
```

No build step needed. Open `index.html` directly in a browser or serve with any static file server.

## Run tests

```bash
npm test
```

Tests cover pure utility functions (`formatDuration`, `formatFileSize`, `generateWaveformData`) and the pluggable IndexedDB storage backend using an in-memory implementation.

## Architecture

```
src/
  main.js      # DOM orchestration, MediaRecorder, playback, transcription
  storage.js   # IndexedDB wrapper with pluggable backend for testing
  audio.js     # Pure helpers: formatDuration, formatFileSize, mimeType detection
  waveform.js  # Canvas waveform: live (time-domain) and thumbnail (decoded audio)
  i18n.js      # ja/en translations
```

## License

MIT © 2026 SEN LLC (SEN 合同会社)
