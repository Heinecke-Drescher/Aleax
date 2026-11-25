import { useLocalStorage } from "@mantine/hooks";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import { createSounds, type SoundName, type Sounds } from "./sounds";

type PlaySound = (name: SoundName) => void;

export const PlaySoundContext = createContext<PlaySound | null>(null);

export function usePlaySound() {
  const playSound = useContext(PlaySoundContext);
  if (!playSound) throw new Error("Sounds are not provided");
  return playSound;
}

export function useSoundSetting() {
  return useLocalStorage({
    key: "aleax-sound",
    defaultValue: true,
    getInitialValueInEffect: false,
  });
}

const PRESSABLE = 'button, [role="menuitem"], [role="tab"]';
const DISABLED = ':disabled, [data-disabled], [aria-disabled="true"]';

// One listener for every button, menu item and tab instead of one at each; dice sound their own
// throw.
export function usePressSound(playSound: PlaySound) {
  useEffect(() => {
    function onPress(event: PointerEvent) {
      if (event.button !== 0 || !(event.target instanceof Element)) return;
      const pressed = event.target.closest(PRESSABLE);
      if (
        pressed &&
        !pressed.matches(DISABLED) &&
        !pressed.closest("[data-own-sound]")
      ) {
        playSound("buttonPress");
      }
    }
    document.addEventListener("pointerdown", onPress, { capture: true });
    return () =>
      document.removeEventListener("pointerdown", onPress, { capture: true });
  }, [playSound]);
}

export function useSoundPlayer(): PlaySound {
  const [isSoundOn] = useSoundSetting();
  const sounds = useRef<Sounds | null>(null);

  useEffect(() => {
    if (!isSoundOn) return;
    const created = createSounds();
    sounds.current = created;
    return () => {
      created.close();
      sounds.current = null;
    };
  }, [isSoundOn]);

  return useCallback((name) => sounds.current?.play(name), []);
}
