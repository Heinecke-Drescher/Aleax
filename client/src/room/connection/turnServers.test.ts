import { describe, expect, it } from "vitest";
import { parseTurnServers } from "./turnServers";

const stun = { urls: "stun:stun.example.com:80" };
const turn = {
  urls: [
    "turn:turn.example.com:80",
    "turns:turn.example.com:443?transport=tcp",
  ],
  username: "user",
  credential: "secret",
};

describe("parseTurnServers", () => {
  it("uses no servers when none are set", () => {
    expect(parseTurnServers(undefined)).toBeUndefined();
    expect(parseTurnServers("")).toBeUndefined();
  });

  it("reads the servers a TURN provider hands out", () => {
    expect(parseTurnServers(JSON.stringify([stun, turn]))).toEqual([
      { urls: stun.urls, username: undefined, credential: undefined },
      turn,
    ]);
  });

  it("keeps only urls, username and credential", () => {
    const servers = [{ ...turn, credentialType: "password", y: 1 }];
    expect(parseTurnServers(JSON.stringify(servers))).toEqual([turn]);
  });

  it("rejects anything but a list of servers", () => {
    for (const json of [
      "not json",
      "{}",
      "[]",
      "[null]",
      '[{"urls":""}]',
      '[{"urls":[]}]',
      '[{"urls":[3]}]',
      '[{"urls":"https://example.com"}]',
      '[{"urls":"turn:example.com"}]',
      '[{"urls":["stun:example.com","turns:example.com"],"username":"u"}]',
      '[{"urls":"turn:example.com","username":1,"credential":"c"}]',
      '[{"urls":"turn:example.com","username":"u","credential":false}]',
    ]) {
      expect(() => parseTurnServers(json), json).toThrow();
    }
  });
});
