"use client";

import { useEffect, useRef, useCallback } from "react";
import * as PIXI from "pixi.js";
import { useSettings } from "@/store/useSettings";
import { BouncingHarmony } from "@/components/scenes/BouncingHarmony";
import { TouchRipples } from "@/components/scenes/TouchRipples";
import { FlowField } from "@/components/scenes/FlowField";
import { audioEngine } from "@/engine/AudioEngine";
import { hapticEngine } from "@/engine/HapticEngine";

type SceneInstance = BouncingHarmony | TouchRipples | FlowField;

export default function SceneRenderer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const sceneRef = useRef<SceneInstance | null>(null);
  const currentScene = useSettings((s) => s.currentScene);
  const speed = useSettings((s) => s.speed);
  const palette = useSettings((s) => s.palette);
  const audioEnabled = useSettings((s) => s.audioEnabled);
  const volume = useSettings((s) => s.volume);

  const createScene = useCallback(
    (app: PIXI.Application) => {
      // Clear stage
      while (app.stage.children.length > 0) {
        app.stage.removeChildAt(0);
      }
      sceneRef.current?.destroy();

      let scene: SceneInstance;
      switch (currentScene) {
        case "ripples":
          scene = new TouchRipples(app);
          break;
        case "flowfield":
          scene = new FlowField(app);
          break;
        case "bouncing":
        default:
          scene = new BouncingHarmony(app);
          break;
      }

      scene.init();
      scene.setPalette(palette);
      scene.setSpeed(speed);
      sceneRef.current = scene;
    },
    [currentScene, palette, speed]
  );

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    let app: PIXI.Application;
    let mounted = true;

    (async () => {
      app = new PIXI.Application();
      await app.init({
        canvas,
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x0a0a1a,
        antialias: true,
        resolution: Math.min(window.devicePixelRatio, 2),
        autoDensity: true,
      });

      if (!mounted) {
        app.destroy();
        return;
      }

      appRef.current = app;
      hapticEngine.init();
      createScene(app);

      app.ticker.add((ticker) => {
        sceneRef.current?.update(ticker.deltaTime);
      });

      const handleResize = () => {
        app.renderer.resize(window.innerWidth, window.innerHeight);
        createScene(app);
      };

      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    })();

    return () => {
      mounted = false;
      sceneRef.current?.destroy();
      appRef.current?.destroy();
      appRef.current = null;
    };
  }, []);

  // Recreate scene when scene type changes
  useEffect(() => {
    if (appRef.current) {
      createScene(appRef.current);
    }
  }, [currentScene, createScene]);

  // Update palette
  useEffect(() => {
    sceneRef.current?.setPalette(palette);
  }, [palette]);

  // Update speed
  useEffect(() => {
    sceneRef.current?.setSpeed(speed);
  }, [speed]);

  // Audio toggle
  useEffect(() => {
    if (audioEnabled) {
      audioEngine.resume();
    } else {
      audioEngine.suspend();
    }
  }, [audioEnabled]);

  // Volume
  useEffect(() => {
    audioEngine.setVolume(volume);
  }, [volume]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full touch-none"
      style={{ WebkitTapHighlightColor: "transparent" }}
    />
  );
}
