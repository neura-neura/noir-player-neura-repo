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
var i = "namespace.resume-play", a = "resumePositions", o = 5, s = 3, c = 500, l = {
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
function u(e) {
	return e === "local-file" || e === "object-url" || e === "hls";
}
function d(e) {
	if (!e || typeof e != "object" || Array.isArray(e)) return;
	let t = e, n = t.sourceKind, r = typeof t.displayName == "string" ? t.displayName.trim() : "";
	if (!(!u(n) || !r)) return JSON.stringify({
		sourceKind: n,
		displayName: r
	});
}
function f(e) {
	if (!Number.isFinite(e) || e < 0) return "0:00";
	let t = Math.floor(e), n = t % 60, r = Math.floor(t / 60), i = r % 60, a = Math.floor(r / 60), o = String(n).padStart(2, "0");
	return a > 0 ? `${a}:${String(i).padStart(2, "0")}:${o}` : `${i}:${o}`;
}
function p(e) {
	if (!e || typeof e != "object" || Array.isArray(e)) throw TypeError("Resume Play config must be an object.");
	let t = e.enabled;
	if (typeof t != "boolean") throw TypeError("Resume Play config enabled must be a boolean.");
	return Object.freeze({ enabled: t });
}
function m(e) {
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
function h(e, t) {
	if (!t || t.position < o) return null;
	let n = e.duration ?? t.duration;
	if (n !== null && (!Number.isFinite(n) || n <= 0 || t.position >= n - s) || t.position <= e.currentTime + s) return null;
	let r = n !== null && n > 0 ? Math.min(100, Math.max(0, t.position / n * 100)) : null;
	return Object.freeze({
		mediaKey: e.key,
		displayName: e.displayName,
		position: t.position,
		duration: n,
		percentage: r
	});
}
var g = class {
	context;
	listeners = /* @__PURE__ */ new Set();
	positions;
	config;
	activeMedia = null;
	pendingPrompt = null;
	bypassPrompt = null;
	uiAvailable = !1;
	running = !1;
	disposed = !1;
	_state;
	constructor(e, t) {
		this.context = e, this.config = t, this.positions = this.readPositions(), this._state = this.buildState();
	}
	get state() {
		return this._state;
	}
	subscribe(e) {
		return this.disposed ? () => void 0 : (this.listeners.add(e), () => this.listeners.delete(e));
	}
	setUiAvailable(e) {
		this.uiAvailable = e, e || this.setPendingPrompt(null);
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
				this.setPendingPrompt(null);
				return;
			}
			this.offerResumeIfAvailable(), this.emitState();
		}
	}
	beforePlay(e) {
		if (this.disposed || !this.running || !this.config.enabled || !this.uiAvailable || !this.context.hasCapability("player.read")) return { decision: "allow" };
		let t = this.activateFromSnapshot(e);
		if (!t) return { decision: "allow" };
		if (this.matchesBypass(t)) return this.bypassPrompt = null, { decision: "allow" };
		let n = this.pendingPrompt?.mediaKey === t.key ? this.pendingPrompt : h(t, this.positions[t.key]);
		return n ? (this.setPendingPrompt(n), { decision: "cancel" }) : { decision: "allow" };
	}
	onOpening(e) {
		if (this.disposed || !u(e.payload.kind)) return;
		let t = d({
			sourceKind: e.payload.kind,
			displayName: e.payload.displayName
		});
		t && this.setActiveMedia({
			key: t,
			sourceKind: e.payload.kind,
			displayName: e.payload.displayName.trim(),
			sessionId: e.sessionId,
			duration: null,
			currentTime: 0
		});
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
		}), this.pendingPrompt?.mediaKey !== this.activeMedia.key && this.savePosition(e.payload.currentTime, e.payload.duration));
	}
	onPause(e) {
		this.disposed || !this.running || !this.activeMedia || !this.matchesSession(e.sessionId) || this.pendingPrompt?.mediaKey === this.activeMedia.key || this.savePosition(e.payload.currentTime, this.activeMedia.duration);
	}
	onSeeked(e) {
		this.disposed || !this.running || !this.activeMedia || !this.matchesSession(e.sessionId) || this.pendingPrompt?.mediaKey === this.activeMedia.key || (this.activeMedia = Object.freeze({
			...this.activeMedia,
			currentTime: e.payload.to
		}), this.savePosition(e.payload.to, this.activeMedia.duration));
	}
	onEnded(e) {
		this.disposed || !this.activeMedia || !this.matchesSession(e.sessionId) || (this.removePosition(this.activeMedia.key), this.setPendingPrompt(null));
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
				this.removePosition(t.key), this.setPendingPrompt(null);
				return;
			}
			this.running && e.status === "ready" && this.offerResumeIfAvailable();
		}
	}
	async resume() {
		let e = this.pendingPrompt;
		if (!this.canControl(e)) return !1;
		this.setPendingPrompt(null), this.bypassPrompt = {
			mediaKey: e.mediaKey,
			sessionId: this.activeMedia?.sessionId ?? null
		};
		try {
			return await this.context.commands.execute("media.seekTo", { seconds: e.position }), await this.context.commands.execute("media.play", void 0), !0;
		} catch (t) {
			return this.bypassPrompt = null, this.setPendingPrompt(e), this.logCommandFailure("resume", t), !1;
		}
	}
	async startOver() {
		let e = this.pendingPrompt;
		if (!this.canControl(e)) return !1;
		let t = this.positions[e.mediaKey];
		delete this.positions[e.mediaKey], this.persistPositions(), this.setPendingPrompt(null), this.bypassPrompt = {
			mediaKey: e.mediaKey,
			sessionId: this.activeMedia?.sessionId ?? null
		};
		try {
			return await this.context.commands.execute("media.seekTo", { seconds: 0 }), await this.context.commands.execute("media.play", void 0), !0;
		} catch (n) {
			return this.bypassPrompt = null, t && (this.positions[e.mediaKey] = t), this.persistPositions(), this.setPendingPrompt(e), this.logCommandFailure("start over", n), !1;
		}
	}
	dispose() {
		this.disposed || (this.running = !1, this.disposed = !0, this.bypassPrompt = null, this.pendingPrompt = null, this.listeners.clear(), this.emitState());
	}
	buildState() {
		return Object.freeze({
			enabled: this.config.enabled,
			currentMediaKey: this.activeMedia?.key ?? null,
			prompt: this.pendingPrompt
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
		}
	}
	setPendingPrompt(e) {
		this.disposed || (this.pendingPrompt = e, this.emitState());
	}
	setActiveMedia(e) {
		let t = !this.activeMedia || this.activeMedia.key !== e.key || this.activeMedia.sessionId !== null && e.sessionId !== null && this.activeMedia.sessionId !== e.sessionId;
		this.activeMedia = Object.freeze(e), t ? (this.bypassPrompt = null, this.setPendingPrompt(null)) : this.emitState();
	}
	clearActiveMedia() {
		!this.activeMedia && !this.pendingPrompt || (this.activeMedia = null, this.bypassPrompt = null, this.setPendingPrompt(null));
	}
	activateFromSnapshot(e) {
		return e.media ? (this.handleMediaSnapshot(e.media, e.sessionId), this.activeMedia) : null;
	}
	handleMediaSnapshot(e, t) {
		let n = d(e);
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
		let e = h(this.activeMedia, this.positions[this.activeMedia.key]);
		e && this.setPendingPrompt(e);
	}
	savePosition(e, t) {
		if (!this.activeMedia || !Number.isFinite(e) || e < 0) return;
		let n = typeof t == "number" && Number.isFinite(t) && t > 0 ? t : this.activeMedia.duration;
		if (n !== null && e >= n - s) {
			this.removePosition(this.activeMedia.key);
			return;
		}
		if (e < o) {
			this.removePosition(this.activeMedia.key);
			return;
		}
		this.positions[this.activeMedia.key] = Object.freeze({
			position: e,
			duration: n,
			updatedAt: Date.now()
		}), this.trimPositions(), this.persistPositions();
	}
	removePosition(e) {
		Object.prototype.hasOwnProperty.call(this.positions, e) && (delete this.positions[e], this.persistPositions());
	}
	trimPositions() {
		let e = Object.entries(this.positions);
		e.length <= c || e.sort(([, e], [, t]) => e.updatedAt - t.updatedAt).slice(0, e.length - c).forEach(([e]) => delete this.positions[e]);
	}
	readPositions() {
		if (!this.context.hasCapability("storage")) return {};
		try {
			return m(this.context.storage.get(a));
		} catch (e) {
			return this.context.logger.warn("Unable to read Resume Play positions.", { error: e instanceof Error ? e.message : "unknown error" }), {};
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
function _({ controller: e }) {
	let t = e.state;
	if (!t.enabled || !t.prompt) return null;
	let r = t.prompt, i = r.percentage === null ? "" : ` (${Math.round(r.percentage)}% complete)`;
	return (0, n.createElement)("section", {
		className: "plugin-stage-info resume-play-prompt",
		"aria-labelledby": "resume-play-prompt-title",
		"aria-live": "polite"
	}, (0, n.createElement)("h3", { id: "resume-play-prompt-title" }, "Resume Play"), (0, n.createElement)("p", null, `Continue “${r.displayName}” from ${f(r.position)}${i}?`), (0, n.createElement)("div", { className: "button-grid" }, (0, n.createElement)("button", {
		type: "button",
		className: "mini-button",
		onClick: () => {
			e.resume();
		}
	}, "Resume"), (0, n.createElement)("button", {
		type: "button",
		className: "mini-button",
		onClick: () => {
			e.startOver();
		}
	}, "Start over")));
}
var v = r({
	manifest: l,
	defaultConfig: { enabled: !0 },
	config: { parse: p },
	setup(e, t) {
		let r = new g(e, t);
		if (e.resources.add(() => r.dispose()), e.hasCapability("ui.contribute")) try {
			e.resources.add(e.ui.contribute({
				id: `${i}/prompt`,
				slot: "stage.info",
				order: 10,
				ariaLabel: "Resume Play",
				component: (e) => (0, n.createElement)(_, {
					...e,
					controller: r
				})
			})), r.setUiAvailable(!0);
		} catch (t) {
			e.logger.warn("Unable to register the Resume Play prompt.", { error: t instanceof Error ? t.message : "unknown error" });
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
				startOver: () => r.startOver()
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
export { i as PLUGIN_ID, d as buildMediaKey, v as default, f as formatResumeTime, p as parseResumePlayConfig };
