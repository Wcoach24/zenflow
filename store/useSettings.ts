import { create } from "zustand";

export type ColorPalette = "aurora" | "ocean" | "sunset";
export type HapticLevel = "off" | "light" | "medium";
export type SceneId = "bouncing" | "ripples" | "flowfield";

interface SettingsState {
  volume: number;
  haptic: HapticLevel;
  speed: number;
  palette: ColorPalette;
  audioEnabled: boolean;
  currentScene: SceneId;
  isMenuOpen: boolean;
  isSettingsOpen: boolean;
  audioInitialized: boolean;
  setVolume: (v: number) => void;
  setHaptic: (h: HapticLevel) => void;
  setSpeed: (s: number) => void;
  setPalette: (p: ColorPalette) => void;
  toggleAudio: () => void;
  setScene: (s: SceneId) => void;
  setMenuOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setAudioInitialized: (v: boolean) => void;
}

export const PALETTES: Record<ColorPalette, string[]> = {
  aurora: ["#6C63FF", "#A78BFA", "#34D399", "#10B981", "#3B82F6"],
  ocean: ["#0EA5E9", "#06B6D4", "#22D3EE", "#67E8F9", "#818CF8"],
  sunset: ["#F472B6", "#FB923C", "#FBBF24", "#F87171", "#C084FC"],
};

export const useSettings = create<SettingsState>((set) => ({
  volume: 0.6,
  haptic: "light",
  speed: 1,
  palette: "aurora",
  audioEnabled: true,
  currentScene: "bouncing",
  isMenuOpen: false,
  isSettingsOpen: false,
  audioInitialized: false,
  setVolume: (v) => set({ volume: v }),
  setHaptic: (h) => set({ haptic: h }),
  setSpeed: (s) => set({ speed: s }),
  setPalette: (p) => set({ palette: p }),
  toggleAudio: () => set((s) => ({ audioEnabled: !s.audioEnabled })),
  setScene: (s) => set({ currentScene: s, isMenuOpen: false }),
  setMenuOpen: (open) => set({ isMenuOpen: open }),
  setSettingsOpen: (open) => set({ isSettingsOpen: open }),
  setAudioInitialized: (v) => set({ audioInitialized: v }),
}));
