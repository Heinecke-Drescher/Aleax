import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  forgetImage,
  recentImages,
  rememberImage,
  restoreImage,
} from "./recentImages";

const stored = new Map<string, unknown>();

vi.mock("idb-keyval", () => ({
  createStore: () => "store",
  set: (key: string, value: unknown) => {
    stored.set(key, value);
    return Promise.resolve();
  },
  del: (key: string) => {
    stored.delete(key);
    return Promise.resolve();
  },
  values: () => Promise.resolve([...stored.values()]),
}));

let now = 1000;

function image(n: number) {
  return `data:image/webp;base64,${n}`;
}

async function remember(...args: Parameters<typeof rememberImage>) {
  vi.setSystemTime(now++);
  await rememberImage(...args);
}

beforeEach(() => {
  stored.clear();
  vi.useFakeTimers({ toFake: ["Date"] });
});

describe("recent images", () => {
  it("lists the images of one kind, newest first", async () => {
    await remember("token", "Goblin", image(1));
    await remember("large", "Cave", image(2));
    await remember("token", "Orc", image(3));

    const tokens = await recentImages("token");
    expect(tokens.map(({ name }) => name)).toEqual(["Orc", "Goblin"]);
    expect(tokens[0]).toMatchObject({ kind: "token", dataUrl: image(3) });
    expect((await recentImages("large")).map(({ name }) => name)).toEqual([
      "Cave",
    ]);
  });

  it("keeps one entry for the same picture and moves it to the front", async () => {
    await remember("token", "Goblin", image(1));
    await remember("token", "Orc", image(2));
    await remember("token", "Goblin boss", image(1));

    expect((await recentImages("token")).map(({ name }) => name)).toEqual([
      "Goblin boss",
      "Orc",
    ]);
  });

  it("keeps only the newest of each kind", async () => {
    await remember("large", "Cave", image(0));
    for (let n = 1; n <= 61; n++) await remember("token", `T${n}`, image(n));
    for (let n = 100; n < 111; n++) await remember("large", `L${n}`, image(n));

    const tokens = await recentImages("token");
    expect(tokens).toHaveLength(60);
    expect(tokens.at(-1)?.name).toBe("T2");
    const large = await recentImages("large");
    expect(large).toHaveLength(12);
    expect(large.some(({ name }) => name === "Cave")).toBe(true);

    await remember("large", "L111", image(111));
    const newest = await recentImages("large");
    expect(newest).toHaveLength(12);
    expect(newest.some(({ name }) => name === "Cave")).toBe(false);
  });

  it("reads only valid entries and their known fields", async () => {
    await remember("token", "Goblin", image(1));
    const [goblin] = await recentImages("token");
    if (!goblin) throw new Error("Goblin is missing");
    stored.set("extra", { ...goblin, id: "extra", secret: "x" });
    stored.set("script", {
      ...goblin,
      id: "script",
      dataUrl: "javascript:alert(1)",
    });
    stored.set("kind", { ...goblin, id: "kind", kind: "sound" });
    stored.set("time", { ...goblin, id: "time", lastUsed: Number.NaN });
    stored.set("text", "Goblin");

    const tokens = await recentImages("token");
    expect(tokens.map(({ id }) => id).sort()).toEqual(
      [goblin.id, "extra"].sort(),
    );
    expect(tokens.find(({ id }) => id === "extra")).not.toHaveProperty(
      "secret",
    );
  });

  it("forgets an image", async () => {
    await remember("token", "Goblin", image(1));
    await remember("token", "Orc", image(2));
    const [orc] = await recentImages("token");
    if (!orc) throw new Error("Orc is missing");

    await forgetImage(orc.id);

    expect((await recentImages("token")).map(({ name }) => name)).toEqual([
      "Goblin",
    ]);
  });

  it("brings back a forgotten image at its old place", async () => {
    await remember("token", "Goblin", image(1));
    await remember("token", "Orc", image(2));
    await remember("token", "Troll", image(3));
    const orc = (await recentImages("token")).find(
      ({ name }) => name === "Orc",
    );
    if (!orc) throw new Error("Orc is missing");

    await forgetImage(orc.id);
    await restoreImage(orc);

    expect((await recentImages("token")).map(({ name }) => name)).toEqual([
      "Troll",
      "Orc",
      "Goblin",
    ]);
  });
});
