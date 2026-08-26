import { useState } from "react";
import OnboardingFlow from "./components/OnboardingFlow";
import MainApp from "./components/MainApp";
import { loadStore } from "./storage";

export default function App() {
  const [started, setStarted] = useState(false);
  const [initialDark, setInitialDark] = useState(() => loadStore().dark);

  function handleOnboardingComplete(dark: boolean) {
    setInitialDark(dark);
    setStarted(true);
  }

  return started
    ? <MainApp initialDark={initialDark} />
    : <OnboardingFlow initialDark={initialDark} onComplete={handleOnboardingComplete} />;
}
