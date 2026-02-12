"use client";

import { useState, useEffect } from "react";
import { audioEngine } from "@/engine/AudioEngine";
import { useSettings } from "@/store/useSettings";

export default function WelcomeScreen() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [pulseVisible, setPulseVisible] = useState(false);
  const setAudioInitialized = useSettings((s) => s.setAudioInitialized);

  useEffect(() => {
    const timer = setTimeout(() => setPulseVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleEnter = async () => {
    await audioEngine.init();
    setAudioInitialized(true);

    // Request fullscreen
    try {
      await document.documentElement.requestFullscreen?.();
    } catch {
      // Not critical
    }

    // Wake lock
    try {
      if ("wakeLock" in navigator) {
        await (navigator as unknown as { wakeLock: { request: (type: string) => Promise<unknown> } }).wakeLock.request("screen");
      }
    } catch {
      // Not critical
    }

    setFadeOut(true);
    setTimeout(() => setVisible(false), 800);
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0A0A1A] transition-opacity duration-700 ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      onClick={handleEnter}
      onTouchStart={handleEnter}
    >
      {/* Ambient glow */}
      <div className="absolute w-64 h-64 rounded-full bg-purple-500/10 blur-3xl animate-pulse" />

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="text-5xl font-extralight tracking-[0.3em] text-white/90">
          ZenFlow
        </div>
        <div className="text-sm font-light tracking-[0.2em] text-white/30 uppercase">
          sensory experiences
        </div>
      </div>

      {/* Pulse ring */}
      <div
        className={`mt-16 relative transition-opacity duration-1000 ${
          pulseVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center animate-pulse">
            <div className="w-3 h-3 rounded-full bg-white/40" />
          </div>
        </div>
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-white/20 whitespace-nowrap tracking-widest">
          tocar para empezar
        </div>
      </div>
    </div>
  );
}
