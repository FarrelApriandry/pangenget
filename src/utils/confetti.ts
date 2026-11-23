import confetti from "canvas-confetti";

/**
 * Fires an elegant, celebratory confetti burst.
 * Designed with Apple & Emil Kowalski craft: two phased bursts, harmonious emerald and amber colors.
 */
export function fireTaskCompletionConfetti() {
  if (typeof window === "undefined") return;

  const count = 180;
  const defaults = {
    origin: { y: 0.7 },
    disableForReducedMotion: true,
    colors: ["#10b981", "#059669", "#34d399", "#f59e0b", "#fbbf24", "#0284c7"],
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  // Burst 1: Sharp center launch
  fire(0.25, {
    spread: 30,
    startVelocity: 45,
  });

  // Burst 2: Wide sparkle rain
  fire(0.2, {
    spread: 60,
  });

  // Burst 3: Soft drift
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  });

  // Burst 4: High velocity floaters
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
}
