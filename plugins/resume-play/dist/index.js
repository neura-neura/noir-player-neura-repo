//#region \0rolldown/runtime.js
var e = (e, t) => () => (t || (e((t = { exports: {} }).exports, t), e = null), t.exports), t = /* @__PURE__ */ e(((e) => {
	var t = Symbol.for("react.element"), n = {
		isMounted: function() {
			return !1;
		},
		enqueueForceUpdate: function() {},
		enqueueReplaceState: function() {},
		enqueueSetState: function() {}
	}, r = Object.assign, i = {};
	function a(e, t, r) {
		this.props = e, this.context = t, this.refs = i, this.updater = r || n;
	}
	a.prototype.isReactComponent = {}, a.prototype.setState = function(e, t) {
		if (typeof e != "object" && typeof e != "function" && e != null) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
		this.updater.enqueueSetState(this, e, t, "setState");
	}, a.prototype.forceUpdate = function(e) {
		this.updater.enqueueForceUpdate(this, e, "forceUpdate");
	};
	function o() {}
	o.prototype = a.prototype;
	function s(e, t, r) {
		this.props = e, this.context = t, this.refs = i, this.updater = r || n;
	}
	var c = s.prototype = new o();
	c.constructor = s, r(c, a.prototype), c.isPureReactComponent = !0, Array.isArray;
	var l = Object.prototype.hasOwnProperty, u = { current: null }, d = {
		key: !0,
		ref: !0,
		__self: !0,
		__source: !0
	};
	function f(e, n, r) {
		var i, a = {}, o = null, s = null;
		if (n != null) for (i in n.ref !== void 0 && (s = n.ref), n.key !== void 0 && (o = "" + n.key), n) l.call(n, i) && !d.hasOwnProperty(i) && (a[i] = n[i]);
		var c = arguments.length - 2;
		if (c === 1) a.children = r;
		else if (1 < c) {
			for (var f = Array(c), p = 0; p < c; p++) f[p] = arguments[p + 2];
			a.children = f;
		}
		if (e && e.defaultProps) for (i in c = e.defaultProps, c) a[i] === void 0 && (a[i] = c[i]);
		return {
			$$typeof: t,
			type: e,
			key: o,
			ref: s,
			props: a,
			_owner: u.current
		};
	}
	e.createElement = f;
})), n = (/* @__PURE__ */ e(((e, n) => {
	n.exports = t();
})))();
function r(e) {
	return e;
}
//#endregion
//#region plugins/resume-play/src/index.ts
var i = "namespace.resume-play", a = "resumePositions", o = "promptDurationSeconds", s = 5, c = 3, l = 500, u = 5, d = [
	1,
	3,
	5,
	8,
	10,
	15,
	30,
	60
], f = 200;
function p(e) {
	let t = typeof e == "number" ? e : typeof e == "string" && e.trim() ? Number(e) : NaN;
	if (Number.isInteger(t)) return d.some((e) => e === t) ? t : void 0;
}
var m = {
	id: i,
	name: "Resume Play",
	version: "0.1.0",
	apiVersion: "^1.0.0",
	appVersion: ">=0.1.0 <1.0.0",
	description: "Resume Play automatically remembers the exact point where you left off in each video. When you play it again, you can choose to resume from where you stopped or start over from the beginning, so you never lose your progress.",
	license: "MIT",
	authors: ["neura-neura"],
	repository: "https://github.com/neura-neura/noir-player-neura-repo",
	platforms: ["windows", "browser-preview"],
	requestedCapabilities: [
		"player.read",
		"player.control",
		"ui.contribute",
		"storage"
	]
};
function h(e) {
	return e === "local-file" || e === "object-url" || e === "hls";
}
function g(e) {
	if (!e || typeof e != "object" || Array.isArray(e)) return;
	let t = e, n = t.sourceKind, r = typeof t.displayName == "string" ? t.displayName.trim() : "";
	if (!(!h(n) || !r)) return JSON.stringify({
		sourceKind: n,
		displayName: r
	});
}
function _(e) {
	if (!Number.isFinite(e) || e < 0) return "0:00";
	let t = Math.floor(e), n = t % 60, r = Math.floor(t / 60), i = r % 60, a = Math.floor(r / 60), o = String(n).padStart(2, "0");
	return a > 0 ? `${a}:${String(i).padStart(2, "0")}:${o}` : `${i}:${o}`;
}
function v(e) {
	if (!e || typeof e != "object" || Array.isArray(e)) throw TypeError("Resume Play config must be an object.");
	let t = e.enabled;
	if (typeof t != "boolean") throw TypeError("Resume Play config enabled must be a boolean.");
	return Object.freeze({ enabled: t });
}
function y(e) {
	if (!e || typeof e != "object" || Array.isArray(e)) return {};
	let t = {};
	for (let [n, r] of Object.entries(e)) {
		if (!r || typeof r != "object" || Array.isArray(r)) continue;
		let e = r, i = e.position, a = e.duration, o = e.updatedAt, s = a === null || typeof a == "number" && Number.isFinite(a) && a > 0;
		typeof i != "number" || !Number.isFinite(i) || i < 0 || !s || typeof o != "number" || !Number.isFinite(o) || o < 0 || (t[n] = Object.freeze({
			position: i,
			duration: a,
			updatedAt: o
		}));
	}
	return t;
}
function b(e, t, n = {}) {
	if (!t || t.position < s) return null;
	let r = e.duration ?? t.duration;
	if (r !== null && (!Number.isFinite(r) || r <= 0 || t.position >= r - c) || !n.allowPastPosition && t.position <= e.currentTime + c) return null;
	let i = r !== null && r > 0 ? Math.min(100, Math.max(0, t.position / r * 100)) : null;
	return Object.freeze({
		mediaKey: e.key,
		displayName: e.displayName,
		position: t.position,
		duration: r,
		percentage: i
	});
}
var x = class {
	context;
	listeners = /* @__PURE__ */ new Set();
	positions;
	config;
	promptDurationSeconds;
	activeMedia = null;
	pendingPrompt = null;
	resumeCandidate = null;
	bypassPrompt = null;
	uiAvailable = !1;
	uiRefresh = null;
	settingsUiRefresh = null;
	promptTimer = null;
	promptExpiresAt = null;
	promptRemainingMs = 0;
	running = !1;
	disposed = !1;
	_state;
	constructor(e, t) {
		this.context = e, this.config = t, this.positions = this.readPositions(), this.promptDurationSeconds = this.readPromptDuration(), this._state = this.buildState();
	}
	get state() {
		return this._state;
	}
	subscribe(e) {
		return this.disposed ? () => void 0 : (this.listeners.add(e), () => this.listeners.delete(e));
	}
	setUiAvailable(e) {
		if (this.uiAvailable = e, !e) {
			this.resumeCandidate = null, this.setPendingPrompt(null);
			return;
		}
		this.activeMedia && this.config.enabled && !this.resumeCandidate && (this.resumeCandidate = this.positions[this.activeMedia.key] ?? null), this.offerResumeIfAvailable();
	}
	setUiRefresh(e) {
		this.uiRefresh = e;
	}
	setSettingsUiRefresh(e) {
		this.settingsUiRefresh = e;
	}
	start() {
		this.disposed || this.running || (this.running = !0, this.refreshSnapshot(), this.offerResumeIfAvailable());
	}
	stop() {
		this.disposed || !this.running || (this.running = !1, this.bypassPrompt = null, this.setPendingPrompt(null));
	}
	applyConfig(e) {
		if (!this.disposed) {
			if (this.config = e, !e.enabled) {
				this.resumeCandidate = null, this.setPendingPrompt(null), this.emitState(), this.refreshSettingsUi();
				return;
			}
			this.activeMedia && (this.resumeCandidate = this.positions[this.activeMedia.key] ?? null), this.offerResumeIfAvailable(), this.emitState(), this.refreshSettingsUi();
		}
	}
	beforePlay(e) {
		if (this.disposed || !this.running || !this.config.enabled || !this.uiAvailable || !this.context.hasCapability("player.read")) return { decision: "allow" };
		let t = this.activateFromSnapshot(e);
		if (!t) return { decision: "allow" };
		if (this.matchesBypass(t)) return this.bypassPrompt = null, { decision: "allow" };
		let n = this.pendingPrompt?.mediaKey === t.key ? this.pendingPrompt : b(t, this.resumeCandidate ?? this.positions[t.key], { allowPastPosition: this.resumeCandidate !== null });
		return n ? (this.setPendingPrompt(n), { decision: "cancel" }) : { decision: "allow" };
	}
	onOpening(e) {
		if (this.disposed || !h(e.payload.kind)) return;
		let t = g({
			sourceKind: e.payload.kind,
			displayName: e.payload.displayName
		});
		t && (this.setActiveMedia({
			key: t,
			sourceKind: e.payload.kind,
			displayName: e.payload.displayName.trim(),
			sessionId: e.sessionId,
			duration: null,
			currentTime: 0
		}), this.offerResumeIfAvailable());
	}
	onReady(e) {
		this.disposed || !e.payload.media || (this.handleMediaSnapshot(e.payload.media, e.sessionId), this.offerResumeIfAvailable());
	}
	onSourceChanged(e) {
		if (this.disposed || !e.payload.media) {
			this.clearActiveMedia();
			return;
		}
		this.handleMediaSnapshot(e.payload.media, e.sessionId), this.offerResumeIfAvailable();
	}
	onTimeUpdate(e) {
		this.disposed || !this.running || !this.activeMedia || !this.matchesSession(e.sessionId) || (this.activeMedia = Object.freeze({
			...this.activeMedia,
			currentTime: e.payload.currentTime,
			duration: e.payload.duration ?? this.activeMedia.duration
		}), this.pendingPrompt?.mediaKey !== this.activeMedia.key && this.resumeCandidate === null && this.savePosition(e.payload.currentTime, e.payload.duration));
	}
	onPause(e) {
		this.disposed || !this.running || !this.activeMedia || !this.matchesSession(e.sessionId) || this.pendingPrompt?.mediaKey === this.activeMedia.key || this.resumeCandidate !== null || this.savePosition(e.payload.currentTime, this.activeMedia.duration);
	}
	onSeeked(e) {
		this.disposed || !this.running || !this.activeMedia || !this.matchesSession(e.sessionId) || this.pendingPrompt?.mediaKey === this.activeMedia.key || this.resumeCandidate !== null || (this.activeMedia = Object.freeze({
			...this.activeMedia,
			currentTime: e.payload.to
		}), this.savePosition(e.payload.to, this.activeMedia.duration));
	}
	onEnded(e) {
		this.disposed || !this.activeMedia || !this.matchesSession(e.sessionId) || (this.removePosition(this.activeMedia.key), this.resumeCandidate = null, this.setPendingPrompt(null));
	}
	onSnapshot(e) {
		if (this.disposed) return;
		if (!e.media) {
			this.clearActiveMedia();
			return;
		}
		let t = this.activateFromSnapshot(e);
		if (t) {
			if (e.status === "ended") {
				this.removePosition(t.key), this.resumeCandidate = null, this.setPendingPrompt(null);
				return;
			}
			this.running && e.status === "ready" && this.offerResumeIfAvailable();
		}
	}
	async resume() {
		let e = this.pendingPrompt;
		if (!this.canControl(e)) return !1;
		this.setPendingPrompt(null);
		let t = this.resumeCandidate;
		this.resumeCandidate = null, this.bypassPrompt = {
			mediaKey: e.mediaKey,
			sessionId: this.activeMedia?.sessionId ?? null
		};
		try {
			return await this.context.commands.execute("media.seekTo", { seconds: e.position }), await this.context.commands.execute("media.play", void 0), !0;
		} catch (n) {
			return this.bypassPrompt = null, this.resumeCandidate = t, this.setPendingPrompt(e), this.logCommandFailure("resume", n), !1;
		}
	}
	async startOver() {
		let e = this.pendingPrompt;
		if (!this.canControl(e)) return !1;
		let t = this.positions[e.mediaKey], n = this.resumeCandidate;
		delete this.positions[e.mediaKey], this.persistPositions(), this.setPendingPrompt(null), this.resumeCandidate = null, this.bypassPrompt = {
			mediaKey: e.mediaKey,
			sessionId: this.activeMedia?.sessionId ?? null
		};
		try {
			return await this.context.commands.execute("media.seekTo", { seconds: 0 }), await this.context.commands.execute("media.play", void 0), !0;
		} catch (r) {
			return this.bypassPrompt = null, this.resumeCandidate = n, t && (this.positions[e.mediaKey] = t), this.persistPositions(), this.setPendingPrompt(e), this.logCommandFailure("start over", r), !1;
		}
	}
	setPromptDuration(e) {
		if (this.disposed) return !1;
		let t = p(e);
		return t !== void 0 && (this.promptDurationSeconds = t, this.persistPromptDuration(), this.pendingPrompt && this.startPromptTimer(), this.emitState(), this.refreshSettingsUi(), !0);
	}
	dispose() {
		this.disposed || (this.stopPromptTimer(), this.running = !1, this.disposed = !0, this.resumeCandidate = null, this.bypassPrompt = null, this.pendingPrompt = null, this.listeners.clear(), this.emitState());
	}
	buildState() {
		return Object.freeze({
			enabled: this.config.enabled,
			currentMediaKey: this.activeMedia?.key ?? null,
			prompt: this.pendingPrompt,
			promptDurationSeconds: this.promptDurationSeconds,
			promptRemainingMs: this.promptRemainingMs
		});
	}
	emitState() {
		if (!this.disposed) {
			this._state = this.buildState();
			for (let e of [...this.listeners]) try {
				e();
			} catch (e) {
				this.context.logger.warn("A Resume Play UI listener failed.", { error: e instanceof Error ? e.message : "unknown error" });
			}
			try {
				this.uiRefresh?.();
			} catch (e) {
				this.context.logger.warn("A Resume Play UI refresh failed.", { error: e instanceof Error ? e.message : "unknown error" });
			}
		}
	}
	refreshSettingsUi() {
		try {
			this.settingsUiRefresh?.();
		} catch (e) {
			this.context.logger.warn("A Resume Play settings refresh failed.", { error: e instanceof Error ? e.message : "unknown error" });
		}
	}
	setPendingPrompt(e) {
		this.disposed || this.pendingPrompt === e || this.pendingPrompt !== null && e !== null && this.pendingPrompt.mediaKey === e.mediaKey && this.pendingPrompt.position === e.position && this.pendingPrompt.duration === e.duration || (this.pendingPrompt = e, e ? this.startPromptTimer() : this.stopPromptTimer(), this.emitState());
	}
	startPromptTimer() {
		this.stopPromptTimer();
		let e = this.promptDurationSeconds * 1e3;
		this.promptExpiresAt = Date.now() + e, this.promptRemainingMs = e, this.promptTimer = setInterval(() => {
			if (!this.pendingPrompt || this.promptExpiresAt === null) {
				this.stopPromptTimer();
				return;
			}
			let e = Math.max(0, this.promptExpiresAt - Date.now());
			if (e === 0) {
				let e = this.activeMedia;
				this.resumeCandidate = null, e && (this.bypassPrompt = {
					mediaKey: e.key,
					sessionId: e.sessionId
				}), this.setPendingPrompt(null);
				return;
			}
			e !== this.promptRemainingMs && (this.promptRemainingMs = e, this.emitState());
		}, f);
	}
	stopPromptTimer() {
		this.promptTimer !== null && (clearInterval(this.promptTimer), this.promptTimer = null), this.promptExpiresAt = null, this.promptRemainingMs = 0;
	}
	setActiveMedia(e) {
		let t = !this.activeMedia || this.activeMedia.key !== e.key || this.activeMedia.sessionId !== null && e.sessionId !== null && this.activeMedia.sessionId !== e.sessionId;
		this.activeMedia = Object.freeze(e), t && (this.bypassPrompt = null, this.resumeCandidate = this.config.enabled && this.uiAvailable ? this.positions[e.key] ?? null : null, this.setPendingPrompt(null));
	}
	clearActiveMedia() {
		!this.activeMedia && !this.pendingPrompt || (this.activeMedia = null, this.resumeCandidate = null, this.bypassPrompt = null, this.setPendingPrompt(null));
	}
	activateFromSnapshot(e) {
		return e.media ? (this.handleMediaSnapshot(e.media, e.sessionId), this.activeMedia) : null;
	}
	handleMediaSnapshot(e, t) {
		let n = g(e);
		if (!n) {
			this.clearActiveMedia();
			return;
		}
		this.setActiveMedia({
			key: n,
			sourceKind: e.sourceKind,
			displayName: e.displayName.trim(),
			sessionId: t,
			duration: e.duration,
			currentTime: e.currentTime
		});
	}
	refreshSnapshot() {
		try {
			this.onSnapshot(this.context.player.getSnapshot());
		} catch (e) {
			this.context.logger.warn("Unable to read the current player snapshot.", { error: e instanceof Error ? e.message : "unknown error" });
		}
	}
	offerResumeIfAvailable() {
		if (!this.running || !this.config.enabled || !this.uiAvailable || !this.activeMedia) return;
		let e = b(this.activeMedia, this.resumeCandidate ?? void 0, { allowPastPosition: !0 });
		e && this.setPendingPrompt(e);
	}
	savePosition(e, t) {
		if (!this.activeMedia || !Number.isFinite(e) || e < 0 || e < s && this.hasStoredResumePosition()) return;
		let n = typeof t == "number" && Number.isFinite(t) && t > 0 ? t : this.activeMedia.duration;
		if (n !== null && e >= n - c) {
			this.removePosition(this.activeMedia.key);
			return;
		}
		if (e < s) {
			this.removePosition(this.activeMedia.key);
			return;
		}
		this.positions[this.activeMedia.key] = Object.freeze({
			position: e,
			duration: n,
			updatedAt: Date.now()
		}), this.trimPositions(), this.persistPositions();
	}
	hasStoredResumePosition() {
		if (!this.activeMedia) return !1;
		let e = this.positions[this.activeMedia.key];
		return !!(e && e.position >= s);
	}
	removePosition(e) {
		Object.prototype.hasOwnProperty.call(this.positions, e) && (delete this.positions[e], this.persistPositions());
	}
	trimPositions() {
		let e = Object.entries(this.positions);
		e.length <= l || e.sort(([, e], [, t]) => e.updatedAt - t.updatedAt).slice(0, e.length - l).forEach(([e]) => delete this.positions[e]);
	}
	readPositions() {
		if (!this.context.hasCapability("storage")) return {};
		try {
			return y(this.context.storage.get(a));
		} catch (e) {
			return this.context.logger.warn("Unable to read Resume Play positions.", { error: e instanceof Error ? e.message : "unknown error" }), {};
		}
	}
	readPromptDuration() {
		if (!this.context.hasCapability("storage")) return u;
		try {
			return p(this.context.storage.get(o)) ?? u;
		} catch (e) {
			return this.context.logger.warn("Unable to read Resume Play notification duration.", { storageKey: o }), this.context.logger.debug("Resume Play duration read error details.", { error: e instanceof Error ? e.message : "unknown error" }), u;
		}
	}
	persistPromptDuration() {
		if (this.context.hasCapability("storage")) try {
			this.context.storage.set(o, this.promptDurationSeconds);
		} catch (e) {
			this.context.logger.warn("Unable to persist Resume Play notification duration.", { storageKey: o }), this.context.logger.debug("Resume Play duration persistence error details.", { error: e instanceof Error ? e.message : "unknown error" });
		}
	}
	persistPositions() {
		if (this.context.hasCapability("storage")) try {
			let e = {};
			for (let [t, n] of Object.entries(this.positions)) e[t] = {
				position: n.position,
				duration: n.duration,
				updatedAt: n.updatedAt
			};
			this.context.storage.set(a, e);
		} catch (e) {
			this.context.logger.warn("Unable to persist Resume Play positions.", { error: e instanceof Error ? e.message : "unknown error" });
		}
	}
	matchesSession(e) {
		return !this.activeMedia || this.activeMedia.sessionId === null || e === null || this.activeMedia.sessionId === e;
	}
	matchesBypass(e) {
		return this.bypassPrompt !== null && this.bypassPrompt.mediaKey === e.key && (this.bypassPrompt.sessionId === null || e.sessionId === null || this.bypassPrompt.sessionId === e.sessionId);
	}
	canControl(e) {
		return !!(e && this.running && !this.disposed && this.config.enabled && this.context.hasCapability("player.control"));
	}
	logCommandFailure(e, t) {
		this.context.logger.warn(`Unable to ${e} in Resume Play.`, { error: t instanceof Error ? t.message : "unknown error" });
	}
};
function S({ controller: e }) {
	let t = e.state;
	if (!t.enabled || !t.prompt) return null;
	let r = t.prompt, i = r.percentage === null ? "" : ` (${Math.round(r.percentage)}% complete)`, a = t.promptDurationSeconds * 1e3, o = Math.max(0, Math.min(a, t.promptRemainingMs)), s = Math.round(o / a * 100), c = Math.max(1, Math.ceil(o / 1e3)), l = {
		position: "fixed",
		top: "84px",
		right: "24px",
		zIndex: 1e3,
		width: "min(420px, calc(100vw - 32px))",
		padding: "16px",
		border: "1px solid rgba(57, 167, 255, 0.42)",
		borderRadius: "20px",
		background: "rgba(11, 15, 22, 0.96)",
		boxShadow: "0 18px 48px rgba(0, 0, 0, 0.42), 0 0 0 1px rgba(255, 255, 255, 0.04) inset",
		backdropFilter: "blur(16px)",
		color: "#eff5fb",
		pointerEvents: "auto"
	}, u = {
		minHeight: "44px",
		padding: "0 14px",
		border: "1px solid rgba(255, 255, 255, 0.14)",
		borderRadius: "12px",
		color: "#eff5fb",
		fontWeight: 700,
		cursor: "pointer"
	};
	return (0, n.createElement)("section", {
		className: "resume-play-notification",
		role: "dialog",
		"aria-labelledby": "resume-play-notification-title",
		"aria-describedby": "resume-play-notification-description",
		"aria-live": "polite",
		style: l
	}, (0, n.createElement)("div", { style: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		gap: "12px"
	} }, (0, n.createElement)("h2", {
		id: "resume-play-notification-title",
		style: {
			margin: 0,
			fontSize: "15px",
			lineHeight: 1.25,
			letterSpacing: "0.02em"
		}
	}, "Resume Play"), (0, n.createElement)("span", {
		"aria-label": `${c} seconds remaining`,
		style: {
			flex: "0 0 auto",
			minWidth: "40px",
			padding: "4px 8px",
			borderRadius: "999px",
			background: "rgba(57, 167, 255, 0.16)",
			color: "#8bdcff",
			fontSize: "12px",
			fontVariantNumeric: "tabular-nums",
			textAlign: "center"
		}
	}, `${c}s`)), (0, n.createElement)("p", {
		id: "resume-play-notification-description",
		style: {
			margin: "12px 0 14px",
			color: "rgba(239, 245, 251, 0.78)",
			fontSize: "14px",
			lineHeight: 1.45,
			overflowWrap: "anywhere"
		}
	}, `Continue "${r.displayName}" from ${_(r.position)}${i}?`), (0, n.createElement)("div", { style: {
		display: "grid",
		gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
		gap: "8px"
	} }, (0, n.createElement)("button", {
		type: "button",
		style: {
			...u,
			background: "rgba(57, 167, 255, 0.22)",
			borderColor: "rgba(57, 167, 255, 0.48)"
		},
		onClick: () => {
			e.resume();
		}
	}, "Resume"), (0, n.createElement)("button", {
		type: "button",
		style: {
			...u,
			background: "rgba(255, 255, 255, 0.06)"
		},
		onClick: () => {
			e.startOver();
		}
	}, "Start over")), (0, n.createElement)("div", {
		role: "progressbar",
		"aria-label": "Resume prompt time remaining",
		"aria-valuemin": 0,
		"aria-valuemax": a,
		"aria-valuenow": o,
		"aria-valuetext": `${c} seconds remaining`,
		style: {
			height: "4px",
			marginTop: "14px",
			overflow: "hidden",
			borderRadius: "999px",
			background: "rgba(255, 255, 255, 0.12)"
		}
	}, (0, n.createElement)("div", {
		"aria-hidden": "true",
		style: {
			width: `${s}%`,
			height: "100%",
			borderRadius: "inherit",
			background: "linear-gradient(90deg, #39a7ff, #6fe1ff)",
			transition: "width 180ms linear"
		}
	})));
}
function C({ controller: e }) {
	let t = e.state;
	return (0, n.createElement)("section", {
		className: "plugin-settings-section",
		"aria-labelledby": "resume-play-settings-title",
		"data-plugin-settings": i
	}, (0, n.createElement)("h3", { id: "resume-play-settings-title" }, "Resume Play"), (0, n.createElement)("label", { className: "settings-item" }, (0, n.createElement)("span", null, "Notification duration"), (0, n.createElement)("span", { className: "settings-item-content" }, (0, n.createElement)("select", {
		className: "text-input",
		value: String(t.promptDurationSeconds),
		disabled: !t.enabled,
		"aria-label": "Resume Play notification duration",
		onChange: (t) => e.setPromptDuration(t.currentTarget.value)
	}, ...d.map((e) => (0, n.createElement)("option", {
		key: e,
		value: String(e)
	}, `${e} second${e === 1 ? "" : "s"}`))))), (0, n.createElement)("p", { className: "helper-text" }, t.enabled ? "Choose how long the floating notification stays visible. The choice is remembered when Noir Player restarts." : "This plugin is disabled by its configuration."));
}
var w = r({
	manifest: m,
	defaultConfig: { enabled: !0 },
	config: { parse: v },
	setup(e, t) {
		let r = new x(e, t);
		if (e.resources.add(() => r.dispose()), e.hasCapability("ui.contribute")) {
			let t, a, o = {
				id: `${i}/prompt`,
				slot: "notifications",
				order: 10,
				ariaLabel: "Resume Play",
				component: (e) => (0, n.createElement)(S, {
					...e,
					controller: r
				})
			}, s = {
				id: `${i}/settings`,
				slot: "settings.sections",
				order: 60,
				ariaLabel: "Resume Play settings",
				component: (e) => (0, n.createElement)(C, {
					...e,
					controller: r
				})
			}, c = () => {
				t?.(), t = e.ui.contribute(o);
			}, l = () => {
				a?.(), a = e.ui.contribute(s);
			};
			try {
				r.setUiRefresh(c), r.setSettingsUiRefresh(l), c(), l(), e.resources.add(() => {
					r.setUiRefresh(null), r.setSettingsUiRefresh(null), t?.(), a?.(), t = void 0, a = void 0;
				}), r.setUiAvailable(!0);
			} catch (t) {
				r.setUiRefresh(null), e.logger.warn("Unable to register the Resume Play prompt.", { error: t instanceof Error ? t.message : "unknown error" });
			}
		}
		return e.hasCapability("player.read") && (e.resources.add(e.player.subscribe(() => {
			try {
				r.onSnapshot(e.player.getSnapshot());
			} catch (t) {
				e.logger.warn("Unable to process a player snapshot.", { error: t instanceof Error ? t.message : "unknown error" });
			}
		})), e.resources.add(e.events.on("media:opening", (e) => r.onOpening(e))), e.resources.add(e.events.on("media:ready", (e) => r.onReady(e))), e.resources.add(e.events.on("media:source-changed", (e) => r.onSourceChanged(e))), e.resources.add(e.events.on("media:time-update", (e) => r.onTimeUpdate(e))), e.resources.add(e.events.on("media:pause", (e) => r.onPause(e))), e.resources.add(e.events.on("media:seeked", (e) => r.onSeeked(e))), e.resources.add(e.events.on("media:ended", (e) => r.onEnded(e))), e.resources.add(e.hooks.register("media:before-play", (e) => r.beforePlay(e)))), e.logger.info("Resume Play setup complete", { enabled: t.enabled }), {
			api: {
				getState: () => r.state,
				resume: () => r.resume(),
				startOver: () => r.startOver(),
				setPromptDuration: (e) => r.setPromptDuration(e)
			},
			start() {
				r.start();
			},
			onConfigChange(e) {
				r.applyConfig(e);
			},
			stop() {
				r.stop();
			},
			dispose() {
				r.dispose();
			}
		};
	}
});
//#endregion
export { i as PLUGIN_ID, g as buildMediaKey, w as default, _ as formatResumeTime, p as normalizePromptDurationSeconds, v as parseResumePlayConfig };
