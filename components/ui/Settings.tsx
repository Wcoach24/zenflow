"use client";

import { useEffect, useRef } from "react";
import {
  useSettings,
  type ColorPalette,
  type HapticLevel,
  PALETTES,
} from "@/store/useSettings";
import { audioEngine } from "@/engine/AudioEngine";
import { hapticEngine } from "@/engine/HapticEngine";

const palettes: { id: ColorPalette; name: string }[] = [
  { id: "aurora", name: "Aurora" },
  { id: "ocean", name: "Ocean" },
  { id: "sunset", name: "Sunset" },
];

const speeds = [
  { value: 0.5, label: "0.5x" },
  { value: 1, label: "1x" },
  { value: 1.5, label: "1.5x" },
  { value: 2, label: "2x" },
];

const hapticLevels: { value: HapticLevel; label: string }[] = [
  { value: "off", label: "Off" },
  { value: "light", label: "Suave" },
  { value: "medium", label: "Medio" },
];

export default function Settings() {
  const isOpen = useSettings((s) => s.isSettingsOpen);
  const setOpen = useSettings((s) => s.setSettingsOpen);
  const volume = useSettings((s) => s.volume);
  const setVolume = useSettings((s) => s.setVolume);
  const haptic = useSettings((s) => s.haptic);
  const setHaptic = useSettings((s) => s.setHaptic);
  const speed = useSettings((s) => s.speed);
  const setSpeed = useSettings((s) => s.setSpeed);
  const palette = useSettings((s) => s.palette);
  const setPalette = useSettings((s) => s.setPalette);
  const startY = useRef(0);

  useEffect(() => {
    const handleSwipe = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      if (e.type === "touchstart") {
        startY.current = touch.clientY;
      }
      if (e.type === "touchmove") {
        const dy = touch.clientY - startY.current;
        if (dy > 50 && touch.clientY < 80 && !isOpen) {
          setOpen(true);
        }
      }
    };

    window.addEventListener("touchstart", handleSwipe, { passive: true });
    window.addEventListener("touchmove", handleSwipe, { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleSwipe);
      window.removeEventListener("touchmove", handleSwipe);
    };
  }, [isOpen, setOpen]);

  const handleVolume = (v: number) => {
    setVolume(v);
    audioEngine.setVolume(v);
  };

  const handleHaptic = (h: HapticLevel) => {
    setHaptic(h);
    hapticEngine.setIntensity(h);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={`fixed left-0 right-0 top-0 z-40 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="bg-[#12122A]/95 backdrop-blur-xl rounded-b-3xl pt-10 pb-4 px-5">
          <div className="text-white/40 text-xs tracking-[0.15em] uppercase mb-5">
            ajustes
          </div>

          {/* Volume */}
          <div className="mb-5">
            <div className="flex justify-between text-sm text-white/50 mb-2">
              <span>Volumen</span>
              <span>{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => handleVolume(parseFloat(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-400"
            />
          </div>

          {/* Haptic */}
          <div className="mb-5">
            <div className="text-sm text-white/50 mb-2">Vibración</div>
            <div className="flex gap-2">
              {hapticLevels.map((h) => (
                <button
                  key={h.value}
                  onClick={() => handleHaptic(h.value)}
                  className={`flex-1 py-2 rounded-xl text-xs transition-all ${
                    haptic === h.value
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      : "bg-white/5 text-white/40 border border-white/5"
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>

          {/* Speed */}
          <div className="mb-5">
            <div className="text-sm text-white/50 mb-2">Velocidad</div>
            <div className="flex gap-2">
              {speeds.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSpeed(s.value)}
                  className={`flex-1 py-2 rounded-xl text-xs transition-all ${
                    speed === s.value
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      : "bg-white/5 text-white/40 border border-white/5"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Palette */}
          <div className="mb-3">
            <div className="text-sm text-white/50 mb-2">Paleta</div>
            <div className="flex gap-2">
              {palettes.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPalette(p.id)}
                  className={`flex-1 py-2 rounded-xl text-xs transition-all ${
                    palette === p.id
                      ? "border border-purple-500/30"
                      : "border border-white/5"
                  }`}
                >
                  <div className="flex justify-center gap-1 mb-1">
                    {PALETTES[p.id].slice(0, 4).map((c, i) => (
                      <div
                        key={i}
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <span className={palette === p.id ? "text-purple-300" : "text-white/40"}>
                    {p.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Handle */}
          <div className="flex justify-center mt-3">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>
        </div>
      </div>
    </>
  );
}
