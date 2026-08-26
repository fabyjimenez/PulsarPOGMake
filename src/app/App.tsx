import { useState } from "react";
import OnboardingFlow from "./components/OnboardingFlow";
import MainApp from "./components/MainApp";
import { loadStore, saveStorePartial } from "./storage";

export default function App() {
  const [started, setStarted] = useState(() => loadStore().onboardingComplete);
  const [initialDark, setInitialDark] = useState(() => loadStore().dark);

  function handleOnboardingComplete(dark: boolean) {
    saveStorePartial({ dark, onboardingComplete: true });
    setInitialDark(dark);
    setStarted(true);
  }

  function handleReplayOnboarding() {
    saveStorePartial({ onboardingComplete: false });
    setStarted(false);
  }

  return started
    ? <MainApp initialDark={initialDark} onReplayOnboarding={handleReplayOnboarding} />
    : <OnboardingFlow initialDark={initialDark} onComplete={handleOnboardingComplete} />;
}
