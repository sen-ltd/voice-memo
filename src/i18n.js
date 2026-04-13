/**
 * Japanese / English UI string translations.
 */

export const TRANSLATIONS = {
  ja: {
    appTitle: '音声メモ',
    appSubtitle: 'MediaRecorder + IndexedDB + Web Speech API',

    // Recording
    recordStart: '録音開始',
    recordStop: '録音停止',
    recording: '録音中...',
    recordingHint: 'マイクに向かって話してください',

    // Memo list
    noMemos: '音声メモがありません。録音ボタンを押して開始してください。',
    memoCount: '件',
    storageUsed: '使用容量',

    // Playback
    play: '再生',
    pause: '一時停止',
    stop: '停止',

    // Actions
    rename: '名前変更',
    delete: '削除',
    transcribe: '文字起こし',
    export: 'エクスポート',
    addTag: 'タグ追加',

    // Labels & Tags
    labelPlaceholder: 'メモ名を入力...',
    tagPlaceholder: 'タグ名...',
    noTags: 'タグなし',
    labelSaved: '保存しました',

    // Transcription
    transcribing: '文字起こし中...',
    transcriptionDone: '文字起こし完了',
    transcriptionError: '文字起こしに失敗しました（ブラウザ非対応の可能性があります）',
    transcriptionUnavailable: 'このブラウザは音声認識に対応していません',
    transcription: '文字起こし',

    // Delete confirmation
    deleteConfirm: 'このメモを削除しますか？',

    // Export
    exportWebM: 'WebM でダウンロード',
    exportWAV: 'WAV でダウンロード（準備中）',

    // Duration / date
    duration: '長さ',
    createdAt: '録音日時',

    // Language toggle
    langToggle: 'English',

    // Errors
    micError: 'マイクへのアクセスが拒否されました',
    micUnavailable: 'マイクが見つかりません',
    recordingError: '録音に失敗しました',

    // Storage
    bytes: 'B',
    kb: 'KB',
    mb: 'MB',
    gb: 'GB',
  },

  en: {
    appTitle: 'Voice Memo',
    appSubtitle: 'MediaRecorder + IndexedDB + Web Speech API',

    // Recording
    recordStart: 'Start Recording',
    recordStop: 'Stop Recording',
    recording: 'Recording...',
    recordingHint: 'Speak into your microphone',

    // Memo list
    noMemos: 'No voice memos yet. Press the record button to start.',
    memoCount: 'memo(s)',
    storageUsed: 'Storage used',

    // Playback
    play: 'Play',
    pause: 'Pause',
    stop: 'Stop',

    // Actions
    rename: 'Rename',
    delete: 'Delete',
    transcribe: 'Transcribe',
    export: 'Export',
    addTag: 'Add tag',

    // Labels & Tags
    labelPlaceholder: 'Enter memo name...',
    tagPlaceholder: 'Tag name...',
    noTags: 'No tags',
    labelSaved: 'Saved',

    // Transcription
    transcribing: 'Transcribing...',
    transcriptionDone: 'Transcription complete',
    transcriptionError: 'Transcription failed (browser may not support it)',
    transcriptionUnavailable: 'This browser does not support speech recognition',
    transcription: 'Transcription',

    // Delete confirmation
    deleteConfirm: 'Delete this memo?',

    // Export
    exportWebM: 'Download as WebM',
    exportWAV: 'Download as WAV (coming soon)',

    // Duration / date
    duration: 'Duration',
    createdAt: 'Recorded',

    // Language toggle
    langToggle: '日本語',

    // Errors
    micError: 'Microphone access denied',
    micUnavailable: 'No microphone found',
    recordingError: 'Recording failed',

    // Storage
    bytes: 'B',
    kb: 'KB',
    mb: 'MB',
    gb: 'GB',
  },
};

/**
 * Get the translation for a key.
 * Falls back to the key itself if not found.
 *
 * @param {string} key
 * @param {'ja'|'en'} lang
 * @returns {string}
 */
export function t(key, lang) {
  return (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) ?? key;
}

/**
 * Get the BCP-47 language code for speech recognition from the UI lang.
 *
 * @param {'ja'|'en'} lang
 * @returns {string}
 */
export function getSpeechLang(lang) {
  return lang === 'ja' ? 'ja-JP' : 'en-US';
}
