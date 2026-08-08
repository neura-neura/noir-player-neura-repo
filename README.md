# Change Slider Color for Noir Player

Plugin para cambiar el color del slider de reproducción y del volumen en
Noir Player. Incluye un selector de color y un campo hexadecimal; el color se
guarda en el almacenamiento persistente del plugin y se restaura al volver a
abrir Noir Player.

## Qué hace

- Aplica el color elegido a los sliders nativos de reproducción y volumen.
- Aplica el mismo color a los controles de rango de Plyr usados por el motor
  de reproducción del navegador.
- Permite elegir el color con un selector manual o escribir `#RGB` / `#RRGGBB`.
- Conserva la selección después de cerrar y abrir Noir Player.
- Permite restaurar el color predeterminado (`#39A7FF`).

La configuración aparece en **Settings → Plugin manager → Change Slider Color**
después de instalar y habilitar el plugin.

## Capabilities

El manifest solicita únicamente:

- `ui.contribute`: agrega la sección de configuración mediante el slot público
  `settings.sections`.
- `storage`: guarda el color elegido bajo una clave namespaced del plugin.
- `unsafe.dom`: inserta y actualiza una hoja de estilos propia para que el
  color se aplique también a los sliders nativos que ya renderizó el host.

No usa `native.mpv.raw`, `native.mpv.read`, `player.read`, `player.control`,
`invoke`, el `<video>` interno ni handles de ventana. Como `unsafe.dom` es una
capability de riesgo, el host debe mostrar y guardar también el
`riskAcknowledgement` `unsafe.dom` al instalarlo.

No necesita eventos del reproductor, comandos del command bus ni servicios:
solo cambia la presentación de los sliders y guarda la preferencia.

El plugin usa una contribución React pública para mostrar la configuración y
una hoja de estilos propia. Los selectores se limitan a los sliders que
renderiza Noir Player (`.native-progress`, `.native-volume` y los rangos de
Plyr); no se accede ni se modifica el elemento de video.

## Instalación desde Noir Player

1. Abre **Plugin manager**.
2. Pega la URL del repositorio:
   `https://github.com/neura-neura/noir-player-neura-repo`
3. Abre el repositorio y selecciona **Change Slider Color**.
4. Revisa y concede `ui.contribute`, `storage` y `unsafe.dom`; confirma el
   riesgo `unsafe.dom` cuando Noir Player lo solicite.
5. Instala, habilita el plugin y reinicia Noir Player si el administrador lo
   solicita.
6. Abre **Settings** para elegir el color.

## Desarrollo

```powershell
npm ci
npm run check
```

`npm run check` valida TypeScript, ejecuta las pruebas, genera el bundle ESM en
`dist/index.js` y actualiza el hash SHA-256 de `noir.plugin.json`.
