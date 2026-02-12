"use client";

import dynamic from "next/dynamic";
import WelcomeScreen from "@/components/ui/WelcomeScreen";
import AudioToggle from "@/components/ui/AudioToggle";
import SceneSelector from "@/components/ui/SceneSelector";
import Settings from "@/components/ui/Settings";

// Dynamic import to prevent SSR for canvas
const SceneRenderer = dynamic(
  () => import("@/components/canvas/SceneRenderer"),
  { ssr: false }
);

export default function Home() {
  return (
    <main className="fixed inset-0 bg-[#0A0A1A]">
      <WelcomeScreen />
      <SceneRenderer />
      <AudioToggle />
      <SceneSelector />
      <Settings />
    </main>
  );
}