import dieThrow1 from "./audio/die-throw-1.ogg";
import dieThrow2 from "./audio/die-throw-2.ogg";
import dieThrow3 from "./audio/die-throw-3.ogg";
import dieThrow4 from "./audio/die-throw-4.ogg";
import natural1 from "./audio/natural-1.ogg";
import natural20 from "./audio/natural-20.ogg";
import ping from "./audio/ping.ogg";

const SOUND_URLS = {
  dieThrow: [dieThrow1, dieThrow2, dieThrow3, dieThrow4],
  natural20: [natural20],
  natural1: [natural1],
  ping: [ping],
};

export type SoundName = keyof typeof SOUND_URLS;

// Browsers keep audio suspended until the page gets a press or a key.
// Pointer up counts for a finger, pointer down for a mouse.
const UNLOCK_EVENTS = ["pointerdown", "pointerup", "keydown"] as const;

export interface Sounds {
  play: (name: SoundName) => void;
  close: () => void;
}

export function createSounds(): Sounds {
  const context = new AudioContext();
  const buffers = new Map<SoundName, AudioBuffer[]>();
  for (const [name, urls] of Object.entries(SOUND_URLS)) {
    void Promise.all(urls.map((url) => load(context, url))).then(
      (loaded) => buffers.set(name as SoundName, loaded),
      (error: unknown) => {
        // Closing the context while loading stops decoding; nothing is lost then.
        if (context.state !== "closed") throw error;
      },
    );
  }
  const resume = () => {
    if (context.state === "suspended") void context.resume();
  };
  for (const type of UNLOCK_EVENTS) {
    document.addEventListener(type, resume, { capture: true });
  }

  return {
    play: (name) => {
      // A sound started while suspended would play late, together with all others, on the first tap.
      if (context.state !== "running") return;
      const loaded = buffers.get(name);
      if (!loaded) return;
      const buffer = loaded[Math.floor(Math.random() * loaded.length)];
      if (!buffer) throw new Error(`Sound ${name} has no files`);
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      source.start();
    },
    close: () => {
      for (const type of UNLOCK_EVENTS) {
        document.removeEventListener(type, resume, { capture: true });
      }
      void context.close();
    },
  };
}

async function load(context: AudioContext, url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Sound ${url} failed to load: ${response.status}`);
  }
  return context.decodeAudioData(await response.arrayBuffer());
}
