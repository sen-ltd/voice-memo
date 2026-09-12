# Voice Memo

Voice memo app built with vanilla JavaScript — zero dependencies, no build step.

**Live demo**: https://sen.ltd/portfolio/voice-memo/

## Features

- **Record** audio using the MediaRecorder API
- **Live waveform** visualization during recording (Canvas + Web Audio AnalyserNode)
- **Save** recordings to IndexedDB (handles large audio blobs)
- **Playback** with scrubber and play/pause controls
- **Label and tag** memos with inline editing
- **Transcription** using Web Speech API (best-effort speaker→mic loopback — see caveats below)
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

## How transcription works (and why it is not reproducible)

`SpeechRecognition` has no file input. It only ever listens to the microphone.
So transcribing a saved memo is an **acoustic loopback**: the blob is played
back through the speakers and the recogniser picks it up again through the mic.

That puts the playback path inside the result:

| Condition | Effect on the transcript |
|-----------|--------------------------|
| Headphones plugged in | The mic hears nothing → empty result |
| Microphone muted / wrong input device | Empty result |
| OS or browser echo cancellation active | The playback is treated as echo and suppressed → dropped or quiet words |
| Output routed to Bluetooth / an external interface mid-run | Level changes → words dropped |
| Background noise, speaker volume, room | Wording varies between runs |

The same memo can therefore transcribe differently on the next run. The app
states this in the UI above the memo list, stops any playing memo before it
starts, and reports an empty result as a failure with a hint rather than
storing a placeholder.

For a reproducible transcript, send the blob to a server-side recogniser
(Whisper and the cloud speech APIs all take a file); the Web Speech API cannot
do it from a file in the browser.

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

<!-- sen-publish:links -->
## Links

- 🌐 Demo: https://sen.ltd/portfolio/voice-memo/
- 📝 dev.to: https://dev.to/sendotltd/a-voice-memo-app-with-mediarecorder-indexeddb-and-live-waveform-rendering-1429
<!-- /sen-publish:links -->
