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
