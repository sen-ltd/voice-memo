/**
 * Canvas-based waveform rendering utilities.
 */

/**
 * Downsample an array of audio amplitude values to `targetSamples` data points.
 * Each output sample is the maximum absolute value in that segment.
 *
 * @param {Float32Array | number[]} audioData  Raw PCM samples in range [-1, 1]
 * @param {number} targetSamples              Number of bars to produce
 * @returns {Float32Array}
 */
export function generateWaveformData(audioData, targetSamples) {
  if (!audioData || audioData.length === 0) {
    return new Float32Array(targetSamples).fill(0);
  }
  const samples = Math.max(1, Math.floor(targetSamples));
  const result = new Float32Array(samples);
  const blockSize = Math.max(1, Math.floor(audioData.length / samples));

  for (let i = 0; i < samples; i++) {
    const start = i * blockSize;
    const end = Math.min(start + blockSize, audioData.length);
    let peak = 0;
    for (let j = start; j < end; j++) {
      const abs = Math.abs(audioData[j]);
      if (abs > peak) peak = abs;
    }
    result[i] = peak;
  }
  return result;
}

/**
 * Draw a waveform on a canvas element.
 * Clears the canvas and draws vertical bars for each sample.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {Float32Array | number[]} audioData  Values in range [0, 1]
 * @param {string} color                       CSS color string
 */
export function drawWaveform(canvas, audioData, color = '#e74c3c') {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);

  if (!audioData || audioData.length === 0) return;

  const barCount = audioData.length;
  const barWidth = width / barCount;
  const midY = height / 2;

  ctx.fillStyle = color;

  for (let i = 0; i < barCount; i++) {
    const amplitude = Math.min(1, Math.max(0, audioData[i]));
    const barHeight = Math.max(2, amplitude * height * 0.9);
    const x = i * barWidth;
    ctx.fillRect(x, midY - barHeight / 2, Math.max(1, barWidth - 1), barHeight);
  }
}

/**
 * Draw the live waveform from a Uint8Array of frequency/time-domain data
 * (output from AnalyserNode.getByteTimeDomainData).
 *
 * @param {HTMLCanvasElement} canvas
 * @param {Uint8Array} timeDomainData
 * @param {string} color
 */
export function drawLiveWaveform(canvas, timeDomainData, color = '#e74c3c') {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);

  ctx.lineWidth = 2;
  ctx.strokeStyle = color;
  ctx.beginPath();

  const sliceWidth = width / timeDomainData.length;
  let x = 0;

  for (let i = 0; i < timeDomainData.length; i++) {
    // timeDomainData values are 0-255, with 128 = silence
    const v = timeDomainData[i] / 128.0;
    const y = (v * height) / 2;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
    x += sliceWidth;
  }

  ctx.lineTo(width, height / 2);
  ctx.stroke();
}
