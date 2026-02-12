import * as PIXI from "pixi.js";
import { eventBus } from "@/engine/EventBus";
import { PALETTES, type ColorPalette } from "@/store/useSettings";

interface FlowParticle {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  speed: number;
  life: number;
}

export class FlowField {
  private app: PIXI.Application;
  private graphics: PIXI.Graphics;
  private particles: FlowParticle[] = [];
  private noiseTime = 0;
  private palette: string[] = PALETTES.aurora;
  private speed = 1;
  private pointerDown = false;
  private pointerPos = { x: -1000, y: -1000 };
  private maxParticles = 1500;
  private cols = 0;
  private rows = 0;
  private fieldScale = 25;
  private field: number[] = [];
  private turbulence = 0;

  constructor(app: PIXI.Application) {
    this.app = app;
    this.graphics = new PIXI.Graphics();
    this.app.stage.addChild(this.graphics);
  }

  init(): void {
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    this.cols = Math.ceil(w / this.fieldScale) + 1;
    this.rows = Math.ceil(h / this.fieldScale) + 1;
    this.field = new Array(this.cols * this.rows).fill(0);

    // Spawn initial particles
    for (let i = 0; i < this.maxParticles; i++) {
      this.spawnParticle();
    }

    this.setupInput();
  }

  private spawnParticle(): void {
    const x = Math.random() * this.app.screen.width;
    const y = Math.random() * this.app.screen.height;
    this.particles.push({
      x,
      y,
      prevX: x,
      prevY: y,
      speed: 0.5 + Math.random() * 1.5,
      life: 0.5 + Math.random() * 0.5,
    });
  }

  private setupInput(): void {
    const canvas = this.app.canvas;

    canvas.addEventListener("pointerdown", (e) => {
      this.pointerDown = true;
      const rect = canvas.getBoundingClientRect();
      this.pointerPos = {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height),
      };
    });

    canvas.addEventListener("pointermove", (e) => {
      if (!this.pointerDown) return;
      const rect = canvas.getBoundingClientRect();
      this.pointerPos = {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height),
      };
    });

    canvas.addEventListener("pointerup", () => {
      this.pointerDown = false;
      this.pointerPos = { x: -1000, y: -1000 };
    });

    canvas.addEventListener("pointerleave", () => {
      this.pointerDown = false;
      this.pointerPos = { x: -1000, y: -1000 };
    });
  }

  // Simple Perlin-like noise using sin combinations
  private noise(x: number, y: number, t: number): number {
    return (
      Math.sin(x * 0.3 + t) * 0.5 +
      Math.sin(y * 0.3 + t * 0.7) * 0.5 +
      Math.sin((x + y) * 0.2 + t * 1.3) * 0.3 +
      Math.sin(x * 0.1 - y * 0.15 + t * 0.5) * 0.4
    );
  }

  private updateField(): void {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const idx = row * this.cols + col;
        let angle = this.noise(col * 0.15, row * 0.15, this.noiseTime) * Math.PI * 2;

        // Distortion from pointer
        if (this.pointerDown) {
          const px = col * this.fieldScale;
          const py = row * this.fieldScale;
          const dx = px - this.pointerPos.x;
          const dy = py - this.pointerPos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            const influence = 1 - dist / 150;
            const pointerAngle = Math.atan2(dy, dx);
            angle += (pointerAngle - angle) * influence * 0.8;
          }
        }

        this.field[idx] = angle;
      }
    }
  }

  update(delta: number): void {
    const dt = delta * this.speed;
    this.noiseTime += 0.005 * dt;

    this.updateField();

    let localTurbulence = 0;

    // Update particles
    const w = this.app.screen.width;
    const h = this.app.screen.height;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.prevX = p.x;
      p.prevY = p.y;

      const col = Math.floor(p.x / this.fieldScale);
      const row = Math.floor(p.y / this.fieldScale);

      if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
        const angle = this.field[row * this.cols + col];
        p.x += Math.cos(angle) * p.speed * dt;
        p.y += Math.sin(angle) * p.speed * dt;
      }

      // Pointer repulsion
      if (this.pointerDown) {
        const dx = p.x - this.pointerPos.x;
        const dy = p.y - this.pointerPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100 && dist > 1) {
          const force = (1 - dist / 100) * 3;
          p.x += (dx / dist) * force * dt;
          p.y += (dy / dist) * force * dt;
          localTurbulence += force * 0.01;
        }
      }

      // Wrap around edges
      if (p.x < 0) { p.x = w; p.prevX = w; }
      if (p.x > w) { p.x = 0; p.prevX = 0; }
      if (p.y < 0) { p.y = h; p.prevY = h; }
      if (p.y > h) { p.y = 0; p.prevY = 0; }

      p.life -= 0.001 * dt;
      if (p.life <= 0) {
        p.x = Math.random() * w;
        p.y = Math.random() * h;
        p.prevX = p.x;
        p.prevY = p.y;
        p.life = 0.5 + Math.random() * 0.5;
      }
    }

    // Smooth turbulence
    this.turbulence += (localTurbulence - this.turbulence) * 0.1;

    if (this.pointerDown && this.turbulence > 0.05) {
      eventBus.emit("flow:turbulence", { intensity: this.turbulence });
    }

    // Haptic feedback while touching
    if (this.pointerDown) {
      eventBus.emit("flow:touch", {});
    }

    this.draw();
  }

  private getColorFromAngle(angle: number): number {
    const hue = ((angle / (Math.PI * 2)) * 360 + 360) % 360;
    return this.hslToHex(hue, 65, 55);
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

  private draw(): void {
    this.graphics.clear();

    for (const p of this.particles) {
      const dx = p.x - p.prevX;
      const dy = p.y - p.prevY;

      // Skip if wrapped
      if (Math.abs(dx) > 50 || Math.abs(dy) > 50) continue;

      const angle = Math.atan2(dy, dx);
      const color = this.getColorFromAngle(angle);
      const alpha = p.life * 0.6;

      this.graphics.moveTo(p.prevX, p.prevY);
      this.graphics.lineTo(p.x, p.y);
      this.graphics.stroke({ width: 1.5, color, alpha });

      // Dot at head
      this.graphics.circle(p.x, p.y, 1.2);
      this.graphics.fill({ color, alpha: alpha * 0.8 });
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
    this.particles = [];
    this.field = [];
  }
}
