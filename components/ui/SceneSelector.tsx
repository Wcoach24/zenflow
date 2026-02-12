"use client";

import { useEffect, useRef } from "react";
import { useSettings, type SceneId } from "@/store/useSettings";

const scenes: { id: SceneId; name: string; desc: string; icon: string }[] = [
  {
    id: "bouncing",
    name: "Bouncing Harmony",
    desc: "Bolas musicales rompen líneas",
    icon: "◉",
  },
  {
    id: "ripples",
    name: "Touch Ripples",
    desc: "Ondas de color con tu toque",
    icon: "◎",
  },
  {
    id: "flowfield",
    name: "Flow Field",
    desc: "Partículas que fluyen como agua",
    icon: "≋",
  },
];

export default function SceneSelector() {
  const isOpen = useSettings((s) => s.isMenuOpen);
  const setMenuOpen = useSettings((s) => s.setMenuOpen);
  const currentScene = useSettings((s) => s.currentScene);
  const setScene = useSettings((s) => s.setScene);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);

  useEffect(() => {
    const handleSwipe = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;

      if (e.type === "touchstart") {
        startY.current = touch.clientY;
      }

      if (e.type === "touchmove") {
        const dy = startY.current - touch.clientY;
        if (dy > 50 && touch.clientY > window.innerHeight - 80 && !isOpen) {
          setMenuOpen(true);
        }
      }
    };

    window.addEventListener("touchstart", handleSwipe, { passive: true });
    window.addEventListener("touchmove", handleSwipe, { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleSwipe);
      window.removeEventListener("touchmove", handleSwipe);
    };
  }, [isOpen, setMenuOpen]);

  return (
    <>
      {/* Pull indicator */}
      {!isOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-center pb-2 pointer-events-none">
          <div className="w-10 h-1 rounded-full bg-white/15" />
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Bottom sheet */}
      <div
        ref={sheetRef}
        className={`fixed left-0 right-0 bottom-0 z-40 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="bg-[#12122A]/95 backdrop-blur-xl rounded-t-3xl pt-3 pb-8 px-4">
          {/* Handle */}
          <div className="flex justify-center mb-4">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          <div className="text-white/40 text-xs tracking-[0.15em] uppercase mb-4 px-2">
            experiencias
          </div>

          {/* Scene cards */}
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
            {scenes.map((scene) => {
              const active = currentScene === scene.id;
              return (
                <button
                  key={scene.id}
                  onClick={() => setScene(scene.id)}
                  className={`flex-shrink-0 w-[140px] snap-center rounded-2xl p-4 transition-all duration-300 ${
                    active
                      ? "bg-white/10 border border-purple-500/30 scale-105"
                      : "bg-white/5 border border-white/5"
                  }`}
                >
                  <div
                    className={`text-3xl mb-2 ${
                      active ? "text-purple-400" : "text-white/30"
                    }`}
                  >
                    {scene.icon}
                  </div>
                  <div
                    className={`text-sm font-medium mb-1 ${
                      active ? "text-white" : "text-white/60"
                    }`}
                  >
                    {scene.name}
                  </div>
                  <div className="text-xs text-white/30">{scene.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
