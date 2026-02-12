import * as PIXI from "pixi.js";
import Matter from "matter-js";
import { eventBus } from "@/engine/EventBus";
import { PALETTES, type ColorPalette } from "@/store/useSettings";

interface Line {
  id: number;
  y: number;
  x1: number;
  x2: number;
  graphics: PIXI.Graphics;
  broken: boolean;
  regenTimer: number;
  opacity: number;
  noteIndex: number;
}

interface Ball {
  body: Matter.Body;
  graphics: PIXI.Graphics;
  color: number;
  trail: { x: number; y: number; alpha: number }[];
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: number;
  size: number;
}

export class BouncingHarmony {
  private app: PIXI.Application;
  private engine: Matter.Engine;
  private centerX = 0;
  private centerY = 0;
  private radius = 0;
  private balls: Ball[] = [];
  private lines: Line[] = [];
  private particles: Particle[] = [];
  private particleGraphics: PIXI.Graphics;
  private trailGraphics: PIXI.Graphics;
  private containerGraphics: PIXI.Graphics;
  private lineContainer: PIXI.Container;
  private palette: string[] = PALETTES.aurora;
  private speed = 1;
  private maxBalls = 5;
  private lineCount = 14;
  private wallBodies: Matter.Body[] = [];
  private glowFilter: PIXI.Graphics;
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private attractPoint: { x: number; y: number; timer: number } | null = null;

  constructor(app: PIXI.Application) {
    this.app = app;
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: 0 },
    });

    this.containerGraphics = new PIXI.Graphics();
    this.trailGraphics = new PIXI.Graphics();
    this.lineContainer = new PIXI.Container();
    this.particleGraphics = new PIXI.Graphics();
    this.glowFilter = new PIXI.Graphics();

    this.app.stage.addChild(this.glowFilter);
    this.app.stage.addChild(this.containerGraphics);
    this.app.stage.addChild(this.trailGraphics);
    this.app.stage.addChild(this.lineContainer);
    this.app.stage.addChild(this.particleGraphics);
  }

  init(): void {
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    this.centerX = w / 2;
    this.centerY = h / 2;
    this.radius = Math.min(w, h) * 0.42;

    this.createWalls();
    this.createLines();
    this.addBall(this.centerX, this.centerY - this.radius * 0.3);
    this.drawContainer();
    this.setupInput();

    Matter.Events.on(this.engine, "beforeUpdate", () => {
      this.enforceBounds();
    });
  }

  private createWalls(): void {
    const segments = 48;
    for (let i = 0; i < segments; i++) {
      const angle1 = (i / segments) * Math.PI * 2;
      const angle2 = ((i + 1) / segments) * Math.PI * 2;
      const x1 = this.centerX + Math.cos(angle1) * (this.radius + 5);
      const y1 = this.centerY + Math.sin(angle1) * (this.radius + 5);
      const x2 = this.centerX + Math.cos(angle2) * (this.radius + 5);
      const y2 = this.centerY + Math.sin(angle2) * (this.radius + 5);
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
      const angle = Math.atan2(y2 - y1, x2 - x1);

      const wall = Matter.Bodies.rectangle(mx, my, len, 10, {
        isStatic: true,
        angle,
        restitution: 1,
        friction: 0,
        slop: 0,
      });
      this.wallBodies.push(wall);
    }
    Matter.Composite.add(this.engine.world, this.wallBodies);
  }

  private enforceBounds(): void {
    for (const ball of this.balls) {
      const dx = ball.body.position.x - this.centerX;
      const dy = ball.body.position.y - this.centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = this.radius - 14;

      if (dist > maxDist) {
        const nx = dx / dist;
        const ny = dy / dist;
        Matter.Body.setPosition(ball.body, {
          x: this.centerX + nx * maxDist,
          y: this.centerY + ny * maxDist,
        });
        // Reflect velocity
        const v = ball.body.velocity;
        const dot = v.x * nx + v.y * ny;
        Matter.Body.setVelocity(ball.body, {
          x: v.x - 2 * dot * nx,
          y: v.y - 2 * dot * ny,
        });
      }

      // Maintain constant speed
      const v = ball.body.velocity;
      const currentSpeed = Math.sqrt(v.x * v.x + v.y * v.y);
      const targetSpeed = 4 * this.speed;
      if (currentSpeed > 0.1) {
        const scale = targetSpeed / currentSpeed;
        Matter.Body.setVelocity(ball.body, {
          x: v.x * scale,
          y: v.y * scale,
        });
      }
    }
  }

  private createLines(): void {
    const margin = this.radius * 0.15;
    const top = this.centerY - this.radius + margin;
    const bottom = this.centerY + this.radius - margin;
    const step = (bottom - top) / (this.lineCount + 1);

    for (let i = 0; i < this.lineCount; i++) {
      const y = top + step * (i + 1);
      const dy = y - this.centerY;
      const halfWidth = Math.sqrt(
        Math.max(0, this.radius * this.radius - dy * dy)
      );

      const g = new PIXI.Graphics();
      this.lineContainer.addChild(g);

      this.lines.push({
        id: i,
        y,
        x1: this.centerX - halfWidth * 0.9,
        x2: this.centerX + halfWidth * 0.9,
        graphics: g,
        broken: false,
        regenTimer: 0,
        opacity: 1,
        noteIndex: i,
      });
    }
  }

  addBall(x: number, y: number): void {
    if (this.balls.length >= this.maxBalls) return;
    const colorHex = this.palette[this.balls.length % this.palette.length];
    const color = parseInt(colorHex.replace("#", ""), 16);

    const angle = Math.random() * Math.PI * 2;
    const speed = 4 * this.speed;

    const body = Matter.Bodies.circle(x, y, 12, {
      restitution: 1,
      friction: 0,
      frictionAir: 0,
      inertia: Infinity,
      slop: 0,
    });

    Matter.Body.setVelocity(body, {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
    });

    Matter.Composite.add(this.engine.world, body);

    const g = new PIXI.Graphics();
    this.app.stage.addChild(g);

    const ball: Ball = { body, graphics: g, color, trail: [] };
    this.balls.push(ball);
    eventBus.emit("ball:add", { count: this.balls.length });
  }

  private drawContainer(): void {
    this.containerGraphics.clear();
    // Outer glow
    this.containerGraphics.circle(this.centerX, this.centerY, this.radius + 2);
    this.containerGraphics.stroke({ width: 1.5, color: 0x6c63ff, alpha: 0.15 });
    // Inner ring
    this.containerGraphics.circle(this.centerX, this.centerY, this.radius);
    this.containerGraphics.stroke({ width: 1, color: 0x6c63ff, alpha: 0.08 });
  }

  private setupInput(): void {
    const canvas = this.app.canvas;
    canvas.addEventListener("pointerdown", (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);
      const dx = x - this.centerX;
      const dy = y - this.centerY;
      if (Math.sqrt(dx * dx + dy * dy) > this.radius) return;

      this.longPressTimer = setTimeout(() => {
        this.attractPoint = { x, y, timer: 120 };
        this.longPressTimer = null;
      }, 400);
    });

    canvas.addEventListener("pointerup", (e) => {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);
        const dx = x - this.centerX;
        const dy = y - this.centerY;
        if (Math.sqrt(dx * dx + dy * dy) <= this.radius) {
          this.addBall(x, y);
        }
      }
    });

    canvas.addEventListener("pointerleave", () => {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
    });
  }

  private spawnParticles(x: number, y: number, color: number, count = 10): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 0.5 + Math.random() * 0.3,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  }

  update(delta: number): void {
    const dt = delta * this.speed;

    // Attract point
    if (this.attractPoint) {
      this.attractPoint.timer -= dt;
      if (this.attractPoint.timer <= 0) {
        this.attractPoint = null;
      } else {
        for (const ball of this.balls) {
          const dx = this.attractPoint.x - ball.body.position.x;
          const dy = this.attractPoint.y - ball.body.position.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 10) {
            const force = 0.0003 / Math.max(dist * 0.01, 0.5);
            Matter.Body.applyForce(ball.body, ball.body.position, {
              x: dx * force,
              y: dy * force,
            });
          }
        }
      }
    }

    Matter.Engine.update(this.engine, 16.67 * dt);

    // Check line collisions
    for (const ball of this.balls) {
      const bx = ball.body.position.x;
      const by = ball.body.position.y;
      const bRadius = 12;

      for (const line of this.lines) {
        if (line.broken) continue;
        if (by + bRadius >= line.y - 2 && by - bRadius <= line.y + 2) {
          if (bx >= line.x1 && bx <= line.x2) {
            line.broken = true;
            line.regenTimer = 240; // 4 seconds at 60fps
            line.opacity = 0;

            const v = ball.body.velocity;
            const velocity = Math.sqrt(v.x * v.x + v.y * v.y) / 4;

            eventBus.emit("line:break", {
              lineIndex: line.noteIndex,
              velocity,
              x: bx,
              y: line.y,
            });

            const mixColor = ball.color;
            this.spawnParticles(bx, line.y, mixColor, 10);
          }
        }
      }

      // Update trail
      ball.trail.unshift({ x: bx, y: by, alpha: 1 });
      if (ball.trail.length > 12) ball.trail.pop();
      for (const t of ball.trail) {
        t.alpha *= 0.88;
      }
    }

    // Regenerate lines
    for (const line of this.lines) {
      if (line.broken) {
        line.regenTimer -= dt;
        if (line.regenTimer <= 0) {
          line.broken = false;
          line.opacity = 0;
        }
      }
      if (!line.broken && line.opacity < 1) {
        line.opacity = Math.min(1, line.opacity + 0.011 * dt);
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 0.05 * dt;
      p.life -= (1 / 60 / p.maxLife) * dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    this.draw();
  }

  private draw(): void {
    // Draw trails
    this.trailGraphics.clear();
    for (const ball of this.balls) {
      for (let i = 1; i < ball.trail.length; i++) {
        const t = ball.trail[i];
        const size = 12 * t.alpha * 0.6;
        if (size > 0.5) {
          this.trailGraphics.circle(t.x, t.y, size);
          this.trailGraphics.fill({ color: ball.color, alpha: t.alpha * 0.25 });
        }
      }
    }

    // Draw lines
    for (const line of this.lines) {
      line.graphics.clear();
      if (!line.broken && line.opacity > 0) {
        line.graphics
          .moveTo(line.x1, line.y)
          .lineTo(line.x2, line.y);
        line.graphics.stroke({
          width: 2,
          color: 0xffffff,
          alpha: line.opacity * 0.2,
        });
        // Subtle glow on line
        line.graphics
          .moveTo(line.x1, line.y)
          .lineTo(line.x2, line.y);
        line.graphics.stroke({
          width: 4,
          color: parseInt(this.palette[line.noteIndex % this.palette.length].replace("#", ""), 16),
          alpha: line.opacity * 0.06,
        });
      }
    }

    // Draw balls
    for (const ball of this.balls) {
      ball.graphics.clear();
      const bx = ball.body.position.x;
      const by = ball.body.position.y;

      // Glow
      ball.graphics.circle(bx, by, 20);
      ball.graphics.fill({ color: ball.color, alpha: 0.08 });

      // Core
      ball.graphics.circle(bx, by, 12);
      ball.graphics.fill({ color: ball.color, alpha: 0.9 });

      // Specular highlight
      ball.graphics.circle(bx - 3, by - 3, 4);
      ball.graphics.fill({ color: 0xffffff, alpha: 0.25 });
    }

    // Draw particles
    this.particleGraphics.clear();
    for (const p of this.particles) {
      const size = p.size * p.life;
      this.particleGraphics.circle(p.x, p.y, size);
      this.particleGraphics.fill({ color: p.color, alpha: p.life * 0.8 });
    }

    // Draw attract point
    if (this.attractPoint) {
      const alpha = Math.sin(Date.now() * 0.01) * 0.1 + 0.15;
      this.glowFilter.clear();
      this.glowFilter.circle(this.attractPoint.x, this.attractPoint.y, 40);
      this.glowFilter.fill({ color: 0xa78bfa, alpha });
    } else {
      this.glowFilter.clear();
    }
  }

  setPalette(p: ColorPalette): void {
    this.palette = PALETTES[p];
    // Update existing ball colors
    this.balls.forEach((ball, i) => {
      ball.color = parseInt(
        this.palette[i % this.palette.length].replace("#", ""),
        16
      );
    });
  }

  setSpeed(s: number): void {
    this.speed = s;
  }

  destroy(): void {
    Matter.Engine.clear(this.engine);
    for (const ball of this.balls) {
      ball.graphics.destroy();
    }
    for (const line of this.lines) {
      line.graphics.destroy();
    }
    this.containerGraphics.destroy();
    this.trailGraphics.destroy();
    this.particleGraphics.destroy();
    this.lineContainer.destroy();
    this.glowFilter.destroy();
    this.balls = [];
    this.lines = [];
    this.particles = [];
  }
}