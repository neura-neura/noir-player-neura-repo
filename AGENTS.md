# AGENTS.md - Noir Player multi-plugin repository

Este repositorio es una plantilla GitHub para publicar uno o varios plugins
de Noir Player desde un mismo repositorio. Antes de editar, lee este archivo,
`README.md`, `AI-PROMPT.md`, `noir.plugins.json`, todos los descriptores que
liste el catalogo, los `src/index.ts` y los tests de cada plugin, y el SDK en
`vendor/noir-player-plugin-api`.

## Estructura obligatoria

- `noir.plugins.json` es la fuente de verdad y enumera cada descriptor.
- El plugin de ejemplo inicial usa `src/index.ts`, `tests/`,
  `noir.plugin.json` y `dist/index.js` en la raiz.
- Los plugins adicionales viven en `plugins/<slug>/` y tienen la misma
  estructura interna: `src/index.ts`, `tests/`, `noir.plugin.json`,
  `README.md` y el `dist/index.js` generado.
- Cada `manifest.id` es unico, estable y tiene formato `namespace.name`.
- Cada plugin tiene su propio descriptor, bundle e integridad SHA-256.
- El `manifest` exportado por `src/index.ts` y el `manifest` del descriptor
  deben mantenerse sincronizados en id, nombre, version, repositorio y
  capabilities.

Para crear un plugin adicional usa:

```powershell
npm run create-plugin -- my-plugin
```

El comando crea la carpeta y agrega el descriptor al catalogo. No copies un
plugin encima de otro ni edites el catalogo dejando rutas inexistentes.

## Flujo para la IA

1. Inspecciona los plugins existentes antes de decidir la arquitectura.
2. Implementa el comportamiento solicitado sin romper los otros plugins.
3. Usa solo las APIs publicas del SDK.
4. Mantén `setup`, `start`, `stop` y `dispose` seguros ante llamadas
   repetidas, errores parciales y reinicios.
5. Registra listeners, timers, comandos, servicios, abort controllers y
   contribuciones UI con `context.resources` para cleanup completo.
6. Usa `context.player`, `context.events`, el command bus, `context.storage`,
   `context.config`, `context.i18n` y slots UI para integraciones portables.
7. Solicita solo las capabilities necesarias. `native.mpv.read` permite leer
   properties/eventos de mpv. `native.mpv.raw` permite comandos y properties
   arbitrarios solo con grant y acknowledgement `native.mpv.raw`; documenta
   cada operacion.
8. Nunca uses `invoke`, init/destroy de mpv, handles de ventana, ownership de
   la superficie nativa ni acceso al video interno del host.
9. Valida toda entrada `unknown`, aisla errores y no guardes secretos en
   `context.storage`.
10. Cuando cambies el manifest, actualiza tanto `src/index.ts` como
    `noir.plugin.json` antes de ejecutar el build.

## Build y verificaciones

Ejecuta desde la raiz:

```powershell
npm ci
npm run check
```

`npm run check` hace typecheck, ejecuta los tests de todos los plugins y del
catalogo, construye cada descriptor listado en `noir.plugins.json` y actualiza
su hash SHA-256. Conserva en Git los `dist/index.js` generados y los hashes
actualizados.

Cada descriptor debe usar `entry: "dist/index.js"` y su fuente debe estar en
`src/index.ts` junto al descriptor. No dejes TODOs, placeholders, mocks
conectados a produccion ni pruebas omitidas para aparentar exito.

Actualiza tambien el `README.md` del plugin cuando cambien sus capabilities,
configuracion o comportamiento. Al terminar informa archivos, capabilities,
pruebas y la URL del repositorio que el usuario debe abrir en Noir Player.

No hagas commits ni publiques cambios a GitHub a menos que el usuario lo pida
de forma explicita.
