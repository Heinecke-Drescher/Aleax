import { createStore, del, set, values, type UseStore } from "idb-keyval";
import { fileTitle } from "../images/imageFiles";
import { notifyError } from "../notifyError";
import { embeddedImage } from "../room/tokens";
import { isRecord } from "../room/typeGuards";

// Token images and large ones (map images and backgrounds) have different sizes, so each has its
// own list.
export type RecentImageKind = "token" | "large";

export interface RecentImage {
  id: string;
  kind: RecentImageKind;
  name: string;
  dataUrl: string;
  lastUsed: number;
}

const KEPT: Record<RecentImageKind, number> = { token: 60, large: 12 };

let store: UseStore | undefined;

// Opened on first use, as opening it at import would fail where there is no IndexedDB.
function recentStore() {
  store ??= createStore("aleax-recent-images", "images");
  return store;
}

async function contentId(dataUrl: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(dataUrl),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export async function rememberImage(
  kind: RecentImageKind,
  name: string,
  dataUrl: string,
) {
  const id = `${kind}:${await contentId(dataUrl)}`;
  const image: RecentImage = { id, kind, name, dataUrl, lastUsed: Date.now() };
  await set(id, image, recentStore());
  const dropped = (await recentImages(kind)).slice(KEPT[kind]);
  await Promise.all(dropped.map(({ id }) => del(id, recentStore())));
}

// The image itself goes on into the room, so failing to remember it is only reported.
function rememberAlongside(
  kind: RecentImageKind,
  name: string,
  dataUrl: string,
) {
  rememberImage(kind, name, dataUrl).catch((error: unknown) =>
    notifyError("Could not add the image to recent images", error),
  );
}

export function rememberUpload(
  kind: RecentImageKind,
  file: File,
  dataUrl: string,
) {
  rememberAlongside(kind, fileTitle(file), dataUrl);
}

export function rememberUse({ kind, name, dataUrl }: RecentImage) {
  rememberAlongside(kind, name, dataUrl);
}

export async function recentImages(kind: RecentImageKind) {
  const stored: unknown[] = await values(recentStore());
  return stored
    .filter(isRecentImage)
    .filter((image) => image.kind === kind)
    .map(({ id, name, dataUrl, lastUsed }) => ({
      id,
      kind,
      name,
      dataUrl,
      lastUsed,
    }))
    .sort((a, b) => b.lastUsed - a.lastUsed);
}

export function onlyChosen([image, ...others]: RecentImage[]) {
  if (!image || others.length > 0) {
    throw new Error("Expected exactly one chosen image");
  }
  return image;
}

export function forgetImage(id: string) {
  return del(id, recentStore());
}

// What lies in the browser's storage is not checked by anyone else, so only valid entries and
// their known fields are read.
function isRecentImage(value: unknown): value is RecentImage {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    (value.kind === "token" || value.kind === "large") &&
    typeof value.name === "string" &&
    typeof value.dataUrl === "string" &&
    embeddedImage(value.dataUrl) !== null &&
    typeof value.lastUsed === "number" &&
    Number.isFinite(value.lastUsed)
  );
}
