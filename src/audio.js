/**
 * Audio utility functions.
 * Pure helpers with no DOM/browser dependencies (except getDuration which uses Audio element).
 */

/**
 * Get the duration of an audio Blob in seconds.
 * Resolves to NaN if the blob cannot be decoded.
 *
 * @param {Blob} blob
 * @returns {Promise<number>}
 */
export function getDuration(blob) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(audio.duration);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(NaN);
    };
    audio.src = url;
  });
}

/**
 * Get the MIME type of a Blob.
 *
 * @param {Blob} blob
 * @returns {string}
 */
export function getMimeType(blob) {
  return blob.type || 'audio/webm';
}

/**
 * Format a duration in seconds to "MM:SS" or "H:MM:SS".
 *
 * @param {number} seconds
 * @returns {string}
 */
export function formatDuration(seconds) {
  if (!isFinite(seconds) || seconds < 0) seconds = 0;
  const totalSec = Math.floor(seconds);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Format a file size in bytes to a human-readable string.
 *
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes < 0) bytes = 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Return the list of MIME types supported by MediaRecorder in priority order.
 *
 * @returns {string[]}
 */
export function supportedMimeTypes() {
  if (typeof MediaRecorder === 'undefined') return [];
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
  ];
  return candidates.filter((t) => MediaRecorder.isTypeSupported(t));
}

/**
 * Pick the best supported MIME type for recording.
 *
 * @returns {string}
 */
export function getBestMimeType() {
  const supported = supportedMimeTypes();
  return supported[0] ?? 'audio/webm';
}
