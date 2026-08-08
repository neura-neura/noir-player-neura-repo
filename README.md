# Noir Player multi-plugin repository template

This is a GitHub Template Repository for publishing one or more Noir Player
plugins from a single repository. The root `noir.plugins.json` catalog is the
source of truth for the Plugin manager, and the build automatically produces a
self-contained ESM bundle and SHA-256 integrity value for every descriptor.

## Create a repository

Use **Use this template** on GitHub, create your repository, then clone it:

```powershell
git clone https://github.com/YOUR-USER/YOUR-REPOSITORY.git
Set-Location YOUR-REPOSITORY
npm ci
npm run check
```

The repository starts with one blank example plugin at the root:

```text
noir.plugins.json
noir.plugin.json
src/index.ts
tests/index.test.ts
dist/index.js
```

You can either turn that example into your first plugin or create an
additional plugin under `plugins/`.

## Add another plugin

Use the scaffold command from the repository root:

```powershell
npm run create-plugin -- subtitle-tools
npm run check
```

This creates and registers:

```text
plugins/subtitle-tools/
  src/index.ts
  tests/index.test.ts
  noir.plugin.json
  README.md
```

The command updates `noir.plugins.json`. The build then builds every catalog
entry independently. Each plugin must keep a unique `manifest.id`, use
`src/index.ts` as its source, and publish `dist/index.js` next to its
descriptor.

If you want the AI to implement the behavior, say:

```text
Lee AGENTS.md, README.md, AI-PROMPT.md, noir.plugins.json, todos los
noir.plugin.json, los src/index.ts y el SDK en vendor/noir-player-plugin-api.

Implementa el plugin plugins/subtitle-tools para que haga lo siguiente:
[describe el comportamiento]

No rompas los plugins existentes. Usa solo el SDK publico, solicita las
capabilities minimas, actualiza pruebas y documentacion, ejecuta npm run check
y corrige todos los errores.
```

## Build and publish

Run the complete checks and build all plugins:

```powershell
npm run check
git add .
git commit -m "Add my Noir Player plugins"
git push
```

`npm run check` runs typecheck, all plugin tests, the catalog test, the
multi-plugin build, and descriptor integrity generation. Keep the generated
`dist/` files and descriptors committed.

In Noir Player, open **Plugin manager**, paste the GitHub repository URL, open
the repository, select the plugins you want, review their requested
capabilities, install them, and restart the player.

## Capabilities and safety

Start with `requestedCapabilities: []`. Add capabilities only when behavior
requires them. For mpv reads use `native.mpv.read`; arbitrary mpv commands or
properties require both `native.mpv.raw` and the matching
`riskAcknowledgements: ['native.mpv.raw']` entry in the host selection.

Do not expose init/destroy, window handles, native surface margins, or direct
Tauri invocation from a plugin. The host owns those resources.

## Files for AI agents

Read [`AGENTS.md`](AGENTS.md) before editing. [`AI-PROMPT.md`](AI-PROMPT.md)
is a reusable prompt for asking an agent to add or modify a plugin while
preserving the multi-plugin catalog and build contract.
