import { eventBus } from "./EventBus";

// Pentatonic scale frequencies
const PENTATONIC_NOTES = [
  261.63, // C4
  293.66, // D4
  329.63, // E4
  392.0, // G4
  440.0, // A4
  523.25, // C5
  587.33, // D5
  659.25, // E5
  783.99, // G5
  880.0, // A5
];

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private volume = 0.6;
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    try {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;

      // Create reverb
      this.reverbNode = this.ctx.createConvolver();
      const reverbBuffer = await this.createReverbImpulse();
      this.reverbNode.buffer = reverbBuffer;

      const reverbGain = this.ctx.createGain();
      reverbGain.gain.value = 0.3;

      this.masterGain.connect(this.ctx.destination);
      this.masterGain.connect(this.reverbNode);
      this.reverbNode.connect(reverbGain);
      reverbGain.connect(this.ctx.destination);

      this.initialized = true;
      this.setupListeners();
    } catch (e) {
      console.error("AudioEngine init failed:", e);
    }
  }

  private async createReverbImpulse(): Promise<AudioBuffer> {
    const ctx = this.ctx!;
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * 2;
    const impulse = ctx.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
      }
    }
    return impulse;
  }

  private setupListeners(): void {
    eventBus.on("line:break", (data: unknown) => {
      const { lineIndex, velocity } = data as {
        lineIndex: number;
        velocity: number;
      };
      this.playBellNote(lineIndex, velocity);
    });

    eventBus.on("ripple:create", (data: unknown) => {
      const { y, height } = data as { y: number; height: number };
      this.playPadNote(y, height);
    });

    eventBus.on("flow:turbulence", (data: unknown) => {
      const { intensity } = data as { intensity: number };
      this.playDrone(intensity);
    });
  }

  playBellNote(index: number, velocity: number): void {
    if (!this.ctx || !this.masterGain) return;
    const freq = PENTATONIC_NOTES[index % PENTATONIC_NOTES.length];
    const now = this.ctx.currentTime;

    // Bell-like oscillator
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);

    // Add harmonic
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(freq * 2.0, now);
    gain2.gain.setValueAtTime(0.15 * Math.min(velocity, 1), now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

    const vol = Math.min(0.25 * velocity, 0.4);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3);

    osc.connect(gain);
    osc2.connect(gain2);
    gain.connect(this.masterGain);
    gain2.connect(this.masterGain);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 3);
    osc2.stop(now + 2.5);
  }

  playPadNote(y: number, height: number): void {
    if (!this.ctx || !this.masterGain) return;
    const ratio = 1 - y / height;
    const noteIndex = Math.floor(ratio * PENTATONIC_NOTES.length);
    const freq =
      PENTATONIC_NOTES[
        Math.min(noteIndex, PENTATONIC_NOTES.length - 1)
      ];
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 2);
  }

  private droneOsc: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;

  playDrone(intensity: number): void {
    if (!this.ctx || !this.masterGain) return;

    if (!this.droneOsc) {
      this.droneOsc = this.ctx.createOscillator();
      this.droneGain = this.ctx.createGain();
      this.droneOsc.type = "sawtooth";
      this.droneOsc.frequency.value = 65.41; // C2

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 200;

      this.droneOsc.connect(filter);
      filter.connect(this.droneGain!);
      this.droneGain!.connect(this.masterGain);
      this.droneGain!.gain.value = 0;
      this.droneOsc.start();
    }

    const target = Math.min(intensity * 0.08, 0.15);
    this.droneGain!.gain.linearRampToValueAtTime(
      target,
      this.ctx.currentTime + 0.1
    );
  }

  setVolume(v: number): void {
    this.volume = v;
    if (this.masterGain) {
      this.masterGain.gain.linearRampToValueAtTime(
        v,
        this.ctx!.currentTime + 0.05
      );
    }
  }

  resume(): void {
    this.ctx?.resume();
  }

  suspend(): void {
    this.ctx?.suspend();
  }

  get isInitialized(): boolean {
    return this.initialized;
  }

  destroy(): void {
    this.droneOsc?.stop();
    this.droneOsc = null;
    this.droneGain = null;
    this.ctx?.close();
    this.ctx = null;
    this.initialized = false;
  }
}

export const audioEngine = new AudioEngine();
