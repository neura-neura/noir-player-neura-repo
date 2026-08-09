# Resume Play

Resume Play remembers the last meaningful playback position for each video. On
the next play attempt it shows a floating public Noir Player notification with
a configurable countdown and progress bar. The default duration is five
seconds. It offers two choices:

- **Resume** seeks to the stored position and continues playback.
- **Start over** clears the stored position, seeks to the beginning, and starts
  playback.

If no choice is made, the notification disappears after five seconds and does
not force either action. The next valid playback position replaces the old
saved point.

Positions are saved from the public player time, pause, and seeked events. A
position within five seconds of the beginning is ignored, and a position within
three seconds of the end is treated as complete. The plugin identifies media by
the public `sourceKind` and `displayName` fields exposed by the SDK, so it does
not need access to the host's internal video element, filesystem APIs, or mpv
properties.

## Capabilities

The manifest requests only:

- `player.read`: reads the public player snapshot and playback events.
- `player.control`: uses the public `media.seekTo` and `media.play` commands
  after the user chooses an action.
- `ui.contribute`: adds the floating Resume/Start over notification to the
  public `notifications` slot and adds the duration control to
  `settings.sections`.
- `storage`: persists positions and the notification-duration preference in the
  plugin's namespaced storage.

It does not request `native.mpv.read`, `native.mpv.raw`, `unsafe.dom`,
`invoke`, window handles, or access to the internal `<video>` element. No
`native.mpv.raw` grant or risk acknowledgement is required.

## Installation from Noir Player

1. Open **Plugin manager**.
2. Paste the repository URL:
   `https://github.com/neura-neura/noir-player-neura-repo`
3. Select **Resume Play**.
4. Review and grant `player.read`, `player.control`, `ui.contribute`, and
   `storage`.
5. Install and enable the plugin, then restart Noir Player if requested.

The prompt appears when a video with a saved position is played again.

## Notification duration

Open the Noir Player settings/style menu and use the **Resume Play** section to
choose how long the floating notification remains visible: 1, 3, 5, 8, 10,
15, 30, or 60 seconds. Five seconds is selected by default. The choice is
stored in the plugin's namespaced storage and is restored when Noir Player
restarts.

## Development

Run the repository checks from the root:

```powershell
npm ci
npm run check
```
