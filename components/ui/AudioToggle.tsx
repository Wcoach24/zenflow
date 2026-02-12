"use client";

import { useSettings } from "@/store/useSettings";

export default function AudioToggle() {
  const audioEnabled = useSettings((s) => s.audioEnabled);
  const toggleAudio = useSettings((s) => s.toggleAudio);
  const audioInitialized = useSettings((s) => s.audioInitialized);

  if (!audioInitialized) return null;

  return (
    <button
      onClick={toggleAudio}
      className="fixed top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center transition-all duration-300 active:scale-90"
      aria-label={audioEnabled ? "Silenciar audio" : "Activar audio"}
    >
      {audioEnabled ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/50">
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/25">
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      )}
    </button>
  );
}
