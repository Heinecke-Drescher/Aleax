# Aleax

A shared map and dice roller for tabletop groups: tokens, drawings, fog of war
and scenes, in real time in the browser. Play straight from the website, or
start Aleax on your computer and send the link to your friends.

## Play without a server

Open https://heinecke-drescher.github.io/Aleax/, create a room and send its link
to your friends. Nothing runs on your computer: the browsers find each other
through public [Nostr](https://nostr.com/) relays and then talk directly.

**Rooms are stored only in the players' browsers, not on any server, and
browsers can delete them without asking.**

Good to know:

- Every browser keeps its own copy of the room, and the copies only meet while
  players are in the room together. Whoever joins while nobody else is there
  sees just their own copy, or an empty room the first time, so the DM should
  be in the room when the others arrive.
- A browser deletes its copy for example when site data is cleared, a private
  window is closed, space runs low or the site was not visited for a while.
  Another browser or device has no copy. To keep a map safe, use **Export map**
  in the map menu.
- The room link is the key to the room. The relays see only encrypted offers,
  but the players see each other's IP addresses, as their browsers connect
  directly.
- On mobile data the players often cannot reach each other, as many networks
  block direct connections. Use Wi-Fi, or host your own copy with a TURN server.

<details>
<summary>Host your own copy</summary>

1. [Fork](https://github.com/Heinecke-Drescher/Aleax/fork) this repository.
2. In your fork, open **Settings → Pages** and pick **GitHub Actions** as the
   source.
3. Open **Actions**, allow workflows in your fork, pick **Pages** and click
   **Run workflow**. Your copy is then at `https://<your-name>.github.io/Aleax/`
   and is built again with every push to `main`.

To get a newer version of Aleax, click **Sync fork** on your fork's page.

For players on mobile data, add a TURN server, which relays the data when a
direct connection fails. Get one from a provider such as
[Metered](https://www.metered.ca/), copy its list of ICE servers (JSON, like
`[{"urls":"turn:…","username":"…","credential":"…"}]`) into a repository secret
named `VITE_TURN_ICE_SERVERS` (**Settings → Secrets and variables → Actions**)
and run the workflow again. Anyone who opens your page can read these
credentials and use your TURN traffic, so keep an eye on it.

</details>

## Host a game for your friends

You need [Node.js](https://nodejs.org/) 24 or newer.

1. Download the ZIP of the
   [latest release](https://github.com/Heinecke-Drescher/Aleax/releases/latest)
   and unpack it (or `git clone` the repository).
2. In that folder, run:

   ```bash
   npm ci
   npm run build
   npm start
   ```

   Open http://localhost:3000 and create a room.

3. To let your friends in over the internet, install
   [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)
   and start a [Quick Tunnel](https://try.cloudflare.com/) next to Aleax:

   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```

   It prints an address like `https://….trycloudflare.com`. Open your room
   through that address and send its link to your friends.

Good to know:

- The tunnel address changes every time you start it.
- Anyone who knows the address can open Aleax while the tunnel runs, so stop it
  (Ctrl+C) when you are done.
- Rooms are saved in the `data` folder and are still there next time.
- In your home network, or in a virtual network such as Hamachi or ZeroTier,
  your friends can also open `http://<your-ip>:3000` without a tunnel. Your
  firewall has to let Node.js in for that network; Windows often counts
  virtual networks as public.

<details>
<summary>Run Aleax on a server</summary>

On a Linux server, [`deploy/aleax.service`](deploy/aleax.service) runs Aleax as a
systemd service: code in `/opt/aleax`, rooms in `/var/lib/aleax/data`, user
`aleax`. A daily timer deletes rooms that have not changed for about six months.

```bash
sudo cp deploy/aleax.service deploy/aleax-cleanup.* /etc/systemd/system/
sudo systemctl enable --now aleax aleax-cleanup.timer
```

To update to the latest version, run `sudo sh /opt/aleax/deploy/update.sh`.
If you build by hand, restart the server afterwards; it reads the list of
website files once at startup.

For HTTPS, put a reverse proxy in front of it. With
[Caddy](https://caddyserver.com/), which gets the certificate by itself, the
whole `Caddyfile` is:

```
aleax.example.com {
	reverse_proxy localhost:3000
}
```

| Variable   | Default  | Meaning                           |
| ---------- | -------- | --------------------------------- |
| `PORT`     | `3000`   | Port of the server                |
| `DATA_DIR` | `./data` | Folder where the rooms are stored |

The server refuses to start if a value is invalid. Each room is one file in
`<DATA_DIR>/rooms/`; to back up or move all rooms, copy that folder.

</details>

<details>
<summary>Development</summary>

```bash
npm install
npm run dev
```

Open http://localhost:5173. `npm run dev` starts the website (Vite) and the
sync server together.

| Command                | What it does                     |
| ---------------------- | -------------------------------- |
| `npm test`             | Runs the tests in watch mode     |
| `npm run typecheck`    | Checks the TypeScript types      |
| `npm run lint`         | Lints the code with oxlint       |
| `npm run format`       | Formats all files with Prettier  |
| `npm run format:check` | Checks formatting without fixing |
| `npm run dev:p2p`      | The website without a server     |
| `npm run preview:p2p`  | Builds and previews it on :4173  |

| Folder                         | Contents                                                       |
| ------------------------------ | -------------------------------------------------------------- |
| `client/`                      | The website: React, Mantine and Konva                          |
| `client/src/room/`             | Room state in Yjs and its rules; the only code that changes it |
| `client/src/room/connection/`  | Connection to the server or peers, presence, cursors and pings |
| `client/src/board/`            | Everything drawn on the map (Konva) and map input, by feature  |
| `client/src/dice/`, `tokens/`… | One feature off the map: its panels, bars, menus and hooks     |
| `client/src/pages/`            | Start page, room page and the parts of its header              |
| `server/`                      | The sync server: Hocuspocus with file storage                  |
| `shared/`                      | Code used by both: room ids and the room limits                |
| `scripts/`                     | Tools for developers, such as the load test                    |

`board/` and the feature folders may import `room/`, never the other way round.
Feature folders do not import `board/`; code both need lives directly in `client/src/`.
Components change the room only through the functions `createRoom` returns.
Panels that float over the map use `FloatingPanel`, so they share one look.

To see how many games a server can carry, start a second sync server without
the website, so no rate limit applies and no real room is touched, and let
`npm run load-test` fill it with simulated players:

```sh
PORT=3001 DATA_DIR=/tmp/aleax-load node server/index.ts
npm run load-test -- --url ws://localhost:3001 --rooms 60 --players 6
```

It opens one more room every 10 seconds and prints how long a change takes to
reach the other players. Run it from another computer through an SSH tunnel
(`ssh -L 3001:localhost:3001 <server>`), as it is about as busy as the server.
Delete `/tmp/aleax-load` afterwards.

</details>

## Credits

Sounds by Kenney (CC0):
[Casino Audio](https://kenney.nl/assets/casino-audio),
[Interface Sounds](https://kenney.nl/assets/interface-sounds) and
[Music Jingles](https://kenney.nl/assets/music-jingles).

The lettering of the logo is set in
[Fondamento](https://fonts.google.com/specimen/Fondamento) by Astigmatic
(SIL Open Font License 1.1).
