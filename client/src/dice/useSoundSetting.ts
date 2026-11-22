import { useLocalStorage } from "@mantine/hooks";

export function useSoundSetting() {
  return useLocalStorage({
    key: "aleax-sound",
    defaultValue: true,
    getInitialValueInEffect: false,
  });
}
