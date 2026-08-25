import { useState } from "react";
import OnboardingFlow from "./components/OnboardingFlow";
import MainApp from "./components/MainApp";

export default function App() {
  const [started, setStarted] = useState(false);
  const [initialDark, setInitialDark] = useState(true);

  function handleOnboardingComplete(dark: boolean) {
    setInitialDark(dark);
    setStarted(true);
  }

  return started
    ? <MainApp initialDark={initialDark} />
    : <OnboardingFlow onComplete={handleOnboardingComplete} />;
}
