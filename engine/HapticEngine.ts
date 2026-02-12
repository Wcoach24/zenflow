import { eventBus } from "./EventBus";

type HapticIntensity = "off" | "light" | "medium";

class HapticEngine {
  private intensity: HapticIntensity = "light";
  private supported = false;

  init(): void {
    this.supported = "vibrate" in navigator;
    this.setupListeners();
  }

  private setupListeners(): void {
    eventBus.on("line:break", (data: unknown) => {
      const { velocity } = data as { velocity: number };
      this.pulse(Math.min(velocity * 25, 50));
    });

    eventBus.on("ripple:create", () => {
      this.pulse(10);
    });

    eventBus.on("ball:add", () => {
      this.pulse(20);
    });
  }

  pulse(durationMs: number): void {
    if (!this.supported || this.intensity === "off") return;
    const mult = this.intensity === "light" ? 0.6 : 1;
    const d = Math.round(durationMs * mult);
    try {
      navigator.vibrate(d);
    } catch {
      // Silent fail on unsupported platforms
    }
  }

  pattern(pattern: number[]): void {
    if (!this.supported || this.intensity === "off") return;
    try {
      navigator.vibrate(pattern);
    } catch {
      // Silent fail
    }
  }

  setIntensity(i: HapticIntensity): void {
    this.intensity = i;
  }

  get isSupported(): boolean {
    return this.supported;
  }
}

export const hapticEngine = new HapticEngine();