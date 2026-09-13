import { GlassBackground } from "./glass-background";
import { MoltenMetal } from "./molten-metal";

/**
 * Animated molten background used by every route: landing, login, dashboard
 * and the access-denied page.
 *
 * The shared glass background renders underneath: it shows until the first
 * WebGL frame fades in, and stays if WebGL2 isn't available.
 */
export function MoltenBackground() {
  return (
    <>
      <GlassBackground />
      <div className="fixed inset-0 -z-10" aria-hidden>
        <MoltenMetal
          color1="#ede9fe"
          color2="#a855f7"
          color3="#7c3aed"
          speed={0.35}
          scale={4}
          detail={3}
          glow={1.25}
          coreSize={0.1}
          swirl={1}
          fold={-0.2}
          blackPoint={0.025}
          brightness={1.2}
          colorMode="molten"
          grain
          grainIntensity={0.05}
          mouseInteraction
          mouseStrength={0.3}
          opacity={0.6}
          lightMode
          backgroundColor="#faf5ff"
          maxDpr={1.5}
        />
      </div>
    </>
  );
}
