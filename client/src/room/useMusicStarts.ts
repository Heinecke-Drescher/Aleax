import { useEffect, useEffectEvent } from "react";
import type * as Y from "yjs";
import { MUSIC_KEY, validMusic } from "./music";
import type { Music } from "./roomStore";

// Reports music that plays when the room has loaded and music others start afterwards, not music
// started here.
export function useMusicStarts(
  musicMap: Y.Map<Music>,
  isSynced: boolean,
  onStart: () => void,
) {
  const reportStart = useEffectEvent(onStart);

  useEffect(() => {
    if (!isSynced) return;
    const isPlaying = () =>
      validMusic(musicMap.get(MUSIC_KEY))?.playing === true;
    let wasPlaying = isPlaying();
    if (wasPlaying) reportStart();
    const observer = (event: Y.YMapEvent<Music>) => {
      const playing = isPlaying();
      if (!event.transaction.local && playing && !wasPlaying) reportStart();
      wasPlaying = playing;
    };
    musicMap.observe(observer);
    return () => {
      musicMap.unobserve(observer);
    };
  }, [musicMap, isSynced]);
}
