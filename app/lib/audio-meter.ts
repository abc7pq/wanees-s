// Reads the loudness of a live audio stream so the call screen's waveform follows the real voice
// (the visitor's microphone or WANEES's reply). Nothing is recorded or sent: the analyser only
// exposes the current spectrum to the page that already owns the stream.

export type AudioMeter = {
  /** `count` bar heights in 0..1 for the voice band, lowest pitch first. */
  bars: (count: number) => number[];
  /** Overall loudness in 0..1. */
  level: () => number;
  close: () => void;
};

/** Folds analyser bins (0..255) into `count` bars in 0..1. Pure, so the shaping is testable. */
export function foldBins(bins: ArrayLike<number>, count: number): number[] {
  const size = Math.max(1, Math.floor(count));
  const usable = Math.max(size, Math.floor(bins.length * 0.6)); // speech sits in the lower part of the spectrum
  const step = usable / size;
  const out: number[] = [];
  for (let bar = 0; bar < size; bar += 1) {
    const from = Math.floor(bar * step);
    const to = Math.max(from + 1, Math.floor((bar + 1) * step));
    let sum = 0;
    for (let index = from; index < to; index += 1) sum += bins[index] ?? 0;
    const mean = sum / (to - from) / 255;
    out.push(Math.min(1, Math.max(0, mean * 1.35)));
  }
  return out;
}

export function createAudioMeter(context: AudioContext, stream: MediaStream): AudioMeter | null {
  try {
    const source = context.createMediaStreamSource(stream);
    const analyser = context.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.72;
    source.connect(analyser); // never connected to the destination: nothing is played back from here
    const bins = new Uint8Array(analyser.frequencyBinCount);
    return {
      bars(count) {
        analyser.getByteFrequencyData(bins);
        return foldBins(bins, count);
      },
      level() {
        analyser.getByteFrequencyData(bins);
        let sum = 0;
        for (const value of bins) sum += value;
        return Math.min(1, (sum / bins.length / 255) * 1.8);
      },
      close() {
        try { source.disconnect(); } catch { /* already gone */ }
      },
    };
  } catch {
    return null;
  }
}
