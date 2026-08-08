# Prompt para implementar plugins con una IA

Trabaja directamente en este repositorio multi-plugin de Noir Player.

Objetivo del plugin:

`[describe aqui el comportamiento deseado]`

Reglas obligatorias:

1. Lee `AGENTS.md`, `README.md`, `noir.plugins.json`, todos los
   `noir.plugin.json`, los `src/index.ts` existentes y el SDK vendorizado en
   `vendor/noir-player-plugin-api` antes de modificar codigo.
2. Si el plugin ya existe, modificalo sin cambiar su `manifest.id`. Si es
   nuevo, usa `npm run create-plugin -- plugin-name` para crear su carpeta y
   registrarlo en `noir.plugins.json`.
3. Conserva el contrato de cada descriptor: `manifest`,
   `entry: "dist/index.js"` e `integrity` SHA-256 generado por el build.
4. Mantén sincronizados el manifest exportado por `src/index.ts` y el
   manifest de `noir.plugin.json`.
5. Usa solo las capabilities necesarias. Para `native.mpv.raw`, justifica
   cada comando/property y deja el grant y acknowledgement correspondiente en
   la seleccion del host; no inventes una allowlist cerrada.
6. Registra listeners, timers, commands, services y contribuciones UI con
   `context.resources` para garantizar cleanup.
7. Mantén `setup`, `start`, `stop` y `dispose` seguros ante llamadas repetidas
   y errores aislados.
8. No uses `invoke`, init/destroy de mpv, handles de ventana, ownership de la
   superficie nativa ni acceso al video interno del host.
9. Añade o actualiza pruebas de contrato y documentacion del plugin.
10. Ejecuta `npm run check`, corrige todos los fallos y comprueba que ningun
   plugin existente dejo de compilar o pasar sus pruebas.
11. No dejes TODOs, placeholders, mocks de produccion ni pruebas omitidas.

Al terminar entrega un resumen de archivos, capabilities solicitadas,
comandos de prueba y la URL del repositorio que el usuario debe abrir en
Plugin manager.
