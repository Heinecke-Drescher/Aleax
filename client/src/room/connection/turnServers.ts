import type { TurnServerConfig } from "trystero";
import { isRecord } from "../typeGuards";

// The servers come from the build, as the list of `iceServers` that a TURN
// provider such as Metered hands out for a credential.
export function parseTurnServers(
  json: string | undefined,
): TurnServerConfig[] | undefined {
  if (json === undefined || json === "") return undefined;
  const servers: unknown = parseJson(json);
  if (!Array.isArray(servers) || servers.length === 0) {
    throw new Error("VITE_TURN_ICE_SERVERS is not a list of ICE servers");
  }
  return servers.map(toTurnServer);
}

function parseJson(json: string): unknown {
  try {
    return JSON.parse(json);
  } catch (error) {
    throw new Error("VITE_TURN_ICE_SERVERS is not valid JSON", {
      cause: error,
    });
  }
}

// `credentialType` is left out, as WebRTC knows only passwords now.
function toTurnServer(server: unknown): TurnServerConfig {
  if (!isRecord(server)) throw new Error("An ICE server is not an object");
  const { urls, username, credential } = server;
  if (!isUrls(urls)) throw new Error("An ICE server has no valid urls");
  if (!isOptionalString(username) || !isOptionalString(credential)) {
    throw new Error("An ICE server has an invalid username or credential");
  }
  const isRelay = [urls].flat().some((url) => /^turns?:/.test(url));
  if (isRelay && (username === undefined || credential === undefined)) {
    throw new Error("A TURN server needs a username and credential");
  }
  return { urls, username, credential };
}

function isUrls(value: unknown): value is string | string[] {
  if (typeof value === "string") return isIceUrl(value);
  return Array.isArray(value) && value.length > 0 && value.every(isIceUrl);
}

function isIceUrl(value: unknown): value is string {
  return typeof value === "string" && /^(stun|turns?):./.test(value);
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string";
}
