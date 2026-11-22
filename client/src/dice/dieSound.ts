import dieThrow1 from "./sounds/die-throw-1.ogg";
import dieThrow2 from "./sounds/die-throw-2.ogg";
import dieThrow3 from "./sounds/die-throw-3.ogg";
import dieThrow4 from "./sounds/die-throw-4.ogg";

const DIE_THROW_URLS = [dieThrow1, dieThrow2, dieThrow3, dieThrow4];

// Browsers keep audio suspended until the page gets a press or a key.
// Pointer up counts for a finger, pointer down for a mouse.
const UNLOCK_EVENTS = ["pointerdown", "pointerup", "keydown"] as const;

export interface DieSound {
  play: () => void;
  close: () => void;
}

export function createDieSound(): DieSound {
  const context = new AudioContext();
  let buffers: AudioBuffer[] = [];
  void Promise.all(DIE_THROW_URLS.map((url) => load(context, url))).then(
    (loaded) => {
      buffers = loaded;
    },
    (error: unknown) => {
      // Closing the context while loading stops decoding; nothing is lost then.
      if (context.state !== "closed") throw error;
    },
  );
  const resume = () => {
    if (context.state === "suspended") void context.resume();
  };
  for (const type of UNLOCK_EVENTS) {
    document.addEventListener(type, resume, { capture: true });
  }

  return {
    play: () => {
      // A sound started while suspended would play late, together with all others, on the first tap.
      if (context.state !== "running") return;
      const buffer = buffers[Math.floor(Math.random() * buffers.length)];
      if (!buffer) return;
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
    throw new Error(`Die sound ${url} failed to load: ${response.status}`);
  }
  return context.decodeAudioData(await response.arrayBuffer());
}
