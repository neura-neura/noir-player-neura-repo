//#region vendor/noir-player-plugin-api/src/index.ts
function e(e) {
	return e;
}
//#endregion
//#region src/index.ts
function t(e) {
	if (!e || typeof e != "object" || Array.isArray(e)) throw TypeError("Blank plugin config must be an object.");
	let t = e.enabled;
	if (typeof t != "boolean") throw TypeError("Blank plugin config enabled must be a boolean.");
	return Object.freeze({ enabled: t });
}
var n = e({
	manifest: {
		id: "example.blank",
		name: "Blank Noir Player plugin",
		version: "0.1.0",
		apiVersion: "^1.0.0",
		appVersion: ">=0.1.0 <1.0.0",
		description: "A minimal, self-contained Noir Player plugin starter.",
		license: "MIT",
		authors: ["Your name"],
		repository: "https://github.com/neura-neura/noir-player-plugin-template",
		platforms: ["windows", "browser-preview"],
		requestedCapabilities: []
	},
	defaultConfig: { enabled: !0 },
	config: { parse: t },
	setup(e, t) {
		return e.logger.info("Blank plugin setup complete", { enabled: t.enabled }), { dispose() {
			e.logger.info("Blank plugin disposed");
		} };
	}
});
//#endregion
export { n as default };
