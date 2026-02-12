import * as PIXI from "pixi.js";
import { eventBus } from "@/engine/EventBus";
import { PALETTES, type ColorPalette } from "@/store/useSettings";

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  color: number;
  width: number;
}

interface TrailDot {
  x: number;
  y: number;
  life: number;
  color: number;
}

export class TouchRipples {
  private app: PIXI.Application;
  private graphics: PIXI.Graphics;
  private ripples: Ripple[] = [];
  private trailDots: TrailDot[] = [];
  private palette: string[] = PALETTES.aurora;
  private speed = 1;
  private pointerDown = false;
  private lastPointerPos = { x: 0, y: 0 };
  private trailTimer = 0;

  constructor(app: PIXI.Application) {
    this.app = app;
    this.graphics = new PIXI.Graphics();
    this.app.stage.addChild(this.graphics);
  }

  init(): void {
    this.setupInput();
  }

  private positionToColor(x: number, y: number): number {
    const w = this.app.screen.width;
    const hue = (x / w) * 360;
    return this.hslToHex(hue, 70, 60);
  }

  private hslToHex(h: number, s: number, l: number): number {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color);
    };
    return (f(0) << 16) + (f(8) << 8) + f(4);
  }

  private createRipple(x: number, y: number): void {
    const color = this.positionToColor(x, y);
    this.ripples.push({
      x,
      y,
      radius: 0,
      maxRadius: 120 + Math.random() * 80,
      life: 1,
      color,
      width: 2 + Math.random(),
    });

    eventBus.emit("ripple:create", {
      x,
      y,
      height: this.app.screen.height,
    });
  }

  private setupInput(): void {
    const canvas = this.app.canvas;

    canvas.addEventListener("pointerdown", (e) => {
      this.pointerDown = true;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);
      this.lastPointerPos = { x, y };
      this.createRipple(x, y);
    });

    canvas.addEventListener("pointermove", (e) => {
      if (!this.pointerDown) return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);
      this.lastPointerPos = { x, y };
    });

    canvas.addEventListener("pointerup", () => {
      this.pointerDown = false;
    });

    canvas.addEventListener("pointerleave", () => {
      this.pointerDown = false;
    });

    // Multi-touch
    canvas.addEventListener(
      "touchstart",
      (e) => {
        for (let i = 0; i < e.touches.length; i++) {
          const t = e.touches[i];
          const rect = canvas.getBoundingClientRect();
          const x = (t.clientX - rect.left) * (canvas.width / rect.width);
          const y = (t.clientY - rect.top) * (canvas.height / rect.height);
          if (i > 0) this.createRipple(x, y);
        }
      },
      { passive: true }
    );
  }

  update(delta: number): void {
    const dt = delta * this.speed;

    // Trail dots from dragging
    if (this.pointerDown) {
      this.trailTimer += dt;
      if (this.trailTimer > 3) {
        this.trailTimer = 0;
        const x = this.lastPointerPos.x + (Math.random() - 0.5) * 10;
        const y = this.lastPointerPos.y + (Math.random() - 0.5) * 10;
        this.createRipple(x, y);
      }
    }

    // Update ripples
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.radius += 1.5 * dt;
      r.life -= (1 / 60 / 1.8) * dt;
      if (r.life <= 0 || r.radius > r.maxRadius) {
        this.ripples.splice(i, 1);
      }
    }

    // Update trail dots
    for (let i = this.trailDots.length - 1; i >= 0; i--) {
      this.trailDots[i].life -= (1 / 60 / 0.8) * dt;
      if (this.trailDots[i].life <= 0) {
        this.trailDots.splice(i, 1);
      }
    }

    this.draw();
  }

  private draw(): void {
    this.graphics.clear();

    // Draw interference points (where ripples overlap)
    for (let i = 0; i < this.ripples.length; i++) {
      for (let j = i + 1; j < this.ripples.length; j++) {
        const r1 = this.ripples[i];
        const r2 = this.ripples[j];
        const dx = r2.x - r1.x;
        const dy = r2.y - r1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const overlap =
          Math.abs(dist - Math.abs(r1.radius - r2.radius)) < 20 ||
          Math.abs(dist - (r1.radius + r2.radius)) < 20;

        if (overlap && dist > 0) {
          const mx = (r1.x + r2.x) / 2;
          const my = (r1.y + r2.y) / 2;
          const alpha = Math.min(r1.life, r2.life) * 0.5;
          this.graphics.circle(mx, my, 6);
          this.graphics.fill({ color: 0xffffff, alpha });
        }
      }
    }

    // Draw ripples
    for (const r of this.ripples) {
      const alpha = r.life * 0.6;
      this.graphics.circle(r.x, r.y, r.radius);
      this.graphics.stroke({ width: r.width, color: r.color, alpha });

      // Inner subtle fill
      if (r.radius < 30) {
        this.graphics.circle(r.x, r.y, r.radius);
        this.graphics.fill({ color: r.color, alpha: alpha * 0.1 });
      }
    }

    // Draw trail dots
    for (const d of this.trailDots) {
      this.graphics.circle(d.x, d.y, 3 * d.life);
      this.graphics.fill({ color: d.color, alpha: d.life * 0.4 });
    }
  }

  setPalette(p: ColorPalette): void {
    this.palette = PALETTES[p];
  }

  setSpeed(s: number): void {
    this.speed = s;
  }

  destroy(): void {
    this.graphics.destroy();
    this.ripples = [];
    this.trailDots = [];
  }
}