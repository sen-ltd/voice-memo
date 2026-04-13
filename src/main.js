/**
 * main.js — Voice Memo App
 * Orchestrates: MediaRecorder, IndexedDB storage, waveform, playback, transcription.
 */

import { t, getSpeechLang } from './i18n.js';
import {
  saveMemo,
  getAllMemos,
  deleteMemo,
  updateMemo,
  getTotalSize,
} from './storage.js';
import { getDuration, getMimeType, formatDuration, formatFileSize, getBestMimeType } from './audio.js';
import { drawLiveWaveform, generateWaveformData, drawWaveform } from './waveform.js';

// ─── State ────────────────────────────────────────────────────────────────────

let lang = 'ja';
let mediaRecorder = null;
let audioChunks = [];
let analyserNode = null;
let animFrameId = null;
let recordingStartTime = 0;
let timerInterval = null;

/** @type {string | null} Currently playing memo id */
let currentPlayingId = null;
/** @type {HTMLAudioElement | null} */
let currentAudio = null;

// ─── DOM references ───────────────────────────────────────────────────────────

const recordBtn = document.getElementById('recordBtn');
const recordLabel = document.getElementById('recordLabel');
const recordingIndicator = document.getElementById('recordingIndicator');
const liveCanvas = document.getElementById('liveWaveform');
const timerDisplay = document.getElementById('timerDisplay');
const memoList = document.getElementById('memoList');
const emptyState = document.getElementById('emptyState');
const storageDisplay = document.getElementById('storageDisplay');
const langToggleBtn = document.getElementById('langToggle');

// ─── Language ─────────────────────────────────────────────────────────────────

function applyLang() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    el.textContent = t(key, lang);
  });
  langToggleBtn.textContent = t('langToggle', lang);
}

langToggleBtn.addEventListener('click', () => {
  lang = lang === 'ja' ? 'en' : 'ja';
  applyLang();
  renderMemoList();
});

// ─── Recording ────────────────────────────────────────────────────────────────

recordBtn.addEventListener('click', () => {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    stopRecording();
  } else {
    startRecording();
  }
});

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = getBestMimeType();
    audioChunks = [];

    // Set up Web Audio analyser for live waveform
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    analyserNode = audioCtx.createAnalyser();
    analyserNode.fftSize = 256;
    source.connect(analyserNode);

    mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.push(e.data);
    };
    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      audioCtx.close();
      cancelAnimationFrame(animFrameId);
      clearInterval(timerInterval);
      await finalizeRecording(mimeType);
    };

    mediaRecorder.start(100); // collect data every 100ms
    recordingStartTime = Date.now();

    // UI
    recordBtn.classList.add('recording');
    recordLabel.textContent = t('recordStop', lang);
    recordingIndicator.hidden = false;
    timerDisplay.hidden = false;
    liveCanvas.hidden = false;

    // Timer
    timerInterval = setInterval(() => {
      const elapsed = (Date.now() - recordingStartTime) / 1000;
      timerDisplay.textContent = formatDuration(elapsed);
    }, 500);

    // Live waveform animation
    drawLoop();
  } catch (err) {
    const msg = err.name === 'NotFoundError'
      ? t('micUnavailable', lang)
      : t('micError', lang);
    showToast(msg, 'error');
  }
}

function drawLoop() {
  const bufferLength = analyserNode.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyserNode.getByteTimeDomainData(dataArray);
  drawLiveWaveform(liveCanvas, dataArray, '#e74c3c');
  animFrameId = requestAnimationFrame(drawLoop);
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    recordBtn.classList.remove('recording');
    recordLabel.textContent = t('recordStart', lang);
    recordingIndicator.hidden = true;
    timerDisplay.hidden = true;
    liveCanvas.hidden = true;
  }
}

async function finalizeRecording(mimeType) {
  const blob = new Blob(audioChunks, { type: mimeType || 'audio/webm' });
  const duration = await getDuration(blob);
  const now = Date.now();
  const label = formatRecordingLabel(now);

  const memo = {
    label,
    blob,
    mimeType: getMimeType(blob),
    duration: isFinite(duration) ? duration : 0,
    transcription: null,
    tags: [],
    createdAt: now,
  };

  try {
    await saveMemo(memo);
    await renderMemoList();
    await updateStorageDisplay();
    showToast(t('labelSaved', lang));
  } catch (err) {
    showToast(t('recordingError', lang), 'error');
  }
}

function formatRecordingLabel(timestamp) {
  const d = new Date(timestamp);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ─── Memo List ────────────────────────────────────────────────────────────────

async function renderMemoList() {
  const memos = await getAllMemos();
  memoList.innerHTML = '';

  if (memos.length === 0) {
    emptyState.hidden = false;
    emptyState.textContent = t('noMemos', lang);
    return;
  }

  emptyState.hidden = true;

  for (const memo of memos) {
    const item = buildMemoItem(memo);
    memoList.appendChild(item);
  }
}

function buildMemoItem(memo) {
  const item = document.createElement('div');
  item.className = 'memo-item';
  item.dataset.id = memo.id;

  const header = document.createElement('div');
  header.className = 'memo-header';

  // Label (editable)
  const labelEl = document.createElement('input');
  labelEl.type = 'text';
  labelEl.className = 'memo-label';
  labelEl.value = memo.label;
  labelEl.placeholder = t('labelPlaceholder', lang);
  labelEl.addEventListener('change', async () => {
    await updateMemo(memo.id, { label: labelEl.value });
  });

  // Meta
  const meta = document.createElement('div');
  meta.className = 'memo-meta';

  const durationEl = document.createElement('span');
  durationEl.className = 'memo-duration';
  durationEl.textContent = formatDuration(memo.duration);

  const dateEl = document.createElement('span');
  dateEl.className = 'memo-date';
  dateEl.textContent = new Date(memo.createdAt).toLocaleString(lang === 'ja' ? 'ja-JP' : 'en-US');

  const sizeEl = document.createElement('span');
  sizeEl.className = 'memo-size';
  sizeEl.textContent = formatFileSize(memo.blob?.size ?? 0);

  meta.append(durationEl, dateEl, sizeEl);
  header.append(labelEl, meta);

  // Tags
  const tagsEl = document.createElement('div');
  tagsEl.className = 'memo-tags';
  renderTags(tagsEl, memo);

  // Waveform thumbnail
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.className = 'memo-waveform';
  thumbCanvas.width = 300;
  thumbCanvas.height = 48;
  renderWaveformThumbnail(thumbCanvas, memo.blob);

  // Playback
  const playbackEl = document.createElement('div');
  playbackEl.className = 'memo-playback';

  const playBtn = document.createElement('button');
  playBtn.className = 'btn-icon';
  playBtn.title = t('play', lang);
  playBtn.innerHTML = '<span class="icon-play">▶</span>';

  const scrubber = document.createElement('input');
  scrubber.type = 'range';
  scrubber.className = 'memo-scrubber';
  scrubber.min = 0;
  scrubber.max = Math.ceil(memo.duration) || 100;
  scrubber.value = 0;
  scrubber.step = 0.1;

  const timeEl = document.createElement('span');
  timeEl.className = 'playback-time';
  timeEl.textContent = `00:00 / ${formatDuration(memo.duration)}`;

  playBtn.addEventListener('click', () => togglePlayback(memo, playBtn, scrubber, timeEl));
  scrubber.addEventListener('input', () => {
    if (currentPlayingId === memo.id && currentAudio) {
      currentAudio.currentTime = parseFloat(scrubber.value);
    }
  });

  playbackEl.append(playBtn, scrubber, timeEl);

  // Transcription
  let transcriptionEl = null;
  if (memo.transcription) {
    transcriptionEl = document.createElement('div');
    transcriptionEl.className = 'memo-transcription';
    transcriptionEl.textContent = memo.transcription;
  }

  // Action buttons
  const actions = document.createElement('div');
  actions.className = 'memo-actions';

  const transcribeBtn = document.createElement('button');
  transcribeBtn.className = 'btn-sm';
  transcribeBtn.textContent = t('transcribe', lang);
  transcribeBtn.addEventListener('click', () => handleTranscribe(memo, item, transcribeBtn));

  const exportBtn = document.createElement('button');
  exportBtn.className = 'btn-sm';
  exportBtn.textContent = t('export', lang);
  exportBtn.addEventListener('click', () => handleExport(memo));

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn-sm btn-danger';
  deleteBtn.textContent = t('delete', lang);
  deleteBtn.addEventListener('click', () => handleDelete(memo.id, item));

  actions.append(transcribeBtn, exportBtn, deleteBtn);

  item.append(header, tagsEl, thumbCanvas, playbackEl);
  if (transcriptionEl) item.appendChild(transcriptionEl);
  item.appendChild(actions);

  return item;
}

function renderTags(container, memo) {
  container.innerHTML = '';
  if (memo.tags && memo.tags.length > 0) {
    memo.tags.forEach((tag) => {
      const span = document.createElement('span');
      span.className = 'tag';
      span.textContent = tag;
      const removeBtn = document.createElement('button');
      removeBtn.className = 'tag-remove';
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', async () => {
        const newTags = memo.tags.filter((t) => t !== tag);
        await updateMemo(memo.id, { tags: newTags });
        memo.tags = newTags;
        renderTags(container, memo);
      });
      span.appendChild(removeBtn);
      container.appendChild(span);
    });
  }

  // Add tag input
  const addBtn = document.createElement('button');
  addBtn.className = 'btn-tag-add';
  addBtn.textContent = '+ ' + t('addTag', lang);
  addBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'tag-input';
    input.placeholder = t('tagPlaceholder', lang);
    input.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        const newTags = [...(memo.tags || []), input.value.trim()];
        await updateMemo(memo.id, { tags: newTags });
        memo.tags = newTags;
        renderTags(container, memo);
      }
      if (e.key === 'Escape') renderTags(container, memo);
    });
    addBtn.replaceWith(input);
    input.focus();
  });
  container.appendChild(addBtn);
}

async function renderWaveformThumbnail(canvas, blob) {
  if (!blob) return;
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioCtx = new OfflineAudioContext(1, 1, 44100);
    const decoded = await audioCtx.decodeAudioData(arrayBuffer);
    const rawData = decoded.getChannelData(0);
    const samples = generateWaveformData(rawData, Math.floor(canvas.width / 3));
    drawWaveform(canvas, samples, '#e74c3c');
  } catch {
    // If decode fails (e.g. webm with certain codecs), draw flat line
    drawWaveform(canvas, new Float32Array(80).fill(0.05), '#555');
  }
}

// ─── Playback ─────────────────────────────────────────────────────────────────

function togglePlayback(memo, playBtn, scrubber, timeEl) {
  if (currentPlayingId === memo.id && currentAudio) {
    if (currentAudio.paused) {
      currentAudio.play();
      playBtn.innerHTML = '<span class="icon-pause">⏸</span>';
    } else {
      currentAudio.pause();
      playBtn.innerHTML = '<span class="icon-play">▶</span>';
    }
    return;
  }

  // Stop any currently playing audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
    // Reset other play buttons
    document.querySelectorAll('.icon-pause').forEach((el) => {
      el.textContent = '▶';
      el.className = 'icon-play';
    });
  }

  const url = URL.createObjectURL(memo.blob);
  const audio = new Audio(url);
  currentAudio = audio;
  currentPlayingId = memo.id;

  audio.addEventListener('timeupdate', () => {
    scrubber.value = audio.currentTime;
    timeEl.textContent = `${formatDuration(audio.currentTime)} / ${formatDuration(memo.duration)}`;
  });

  audio.addEventListener('ended', () => {
    playBtn.innerHTML = '<span class="icon-play">▶</span>';
    scrubber.value = 0;
    timeEl.textContent = `00:00 / ${formatDuration(memo.duration)}`;
    URL.revokeObjectURL(url);
    currentAudio = null;
    currentPlayingId = null;
  });

  audio.play();
  playBtn.innerHTML = '<span class="icon-pause">⏸</span>';
}

// ─── Transcription ────────────────────────────────────────────────────────────

async function handleTranscribe(memo, item, btn) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showToast(t('transcriptionUnavailable', lang), 'error');
    return;
  }

  btn.disabled = true;
  btn.textContent = t('transcribing', lang);

  try {
    const text = await transcribeBlob(memo.blob, getSpeechLang(lang));
    await updateMemo(memo.id, { transcription: text });

    // Update or add transcription display
    let transcriptionEl = item.querySelector('.memo-transcription');
    if (!transcriptionEl) {
      transcriptionEl = document.createElement('div');
      transcriptionEl.className = 'memo-transcription';
      item.querySelector('.memo-actions').before(transcriptionEl);
    }
    transcriptionEl.textContent = text;
    showToast(t('transcriptionDone', lang));
  } catch {
    showToast(t('transcriptionError', lang), 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = t('transcribe', lang);
  }
}

/**
 * Play the blob audio through the SpeechRecognition API.
 * This approach plays the audio and captures speech during playback.
 *
 * @param {Blob} blob
 * @param {string} speechLang  BCP-47 language code
 * @returns {Promise<string>}
 */
function transcribeBlob(blob, speechLang) {
  return new Promise((resolve, reject) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = speechLang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = true;

    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);

    let transcript = '';

    recognition.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          transcript += e.results[i][0].transcript + ' ';
        }
      }
    };

    recognition.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(new Error(e.error));
    };

    recognition.onend = () => {
      URL.revokeObjectURL(url);
      resolve(transcript.trim() || '(no speech detected)');
    };

    audio.onended = () => recognition.stop();
    audio.onerror = () => {
      recognition.stop();
      reject(new Error('audio playback error'));
    };

    recognition.start();
    audio.play().catch(reject);
  });
}

// ─── Export ───────────────────────────────────────────────────────────────────

function handleExport(memo) {
  const ext = memo.mimeType.includes('mp4') ? 'mp4' : memo.mimeType.includes('ogg') ? 'ogg' : 'webm';
  const url = URL.createObjectURL(memo.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${memo.label.replace(/[^a-zA-Z0-9\u3000-\u9fff_-]/g, '_')}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ─── Delete ───────────────────────────────────────────────────────────────────

async function handleDelete(id, item) {
  if (!confirm(t('deleteConfirm', lang))) return;
  if (currentPlayingId === id && currentAudio) {
    currentAudio.pause();
    currentAudio = null;
    currentPlayingId = null;
  }
  await deleteMemo(id);
  item.remove();
  const remaining = memoList.querySelectorAll('.memo-item').length;
  if (remaining === 0) emptyState.hidden = false;
  await updateStorageDisplay();
}

// ─── Storage display ──────────────────────────────────────────────────────────

async function updateStorageDisplay() {
  const bytes = await getTotalSize();
  storageDisplay.textContent = `${t('storageUsed', lang)}: ${formatFileSize(bytes)}`;
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast-visible'));
  setTimeout(() => {
    toast.classList.remove('toast-visible');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  applyLang();
  await renderMemoList();
  await updateStorageDisplay();
}

init();
