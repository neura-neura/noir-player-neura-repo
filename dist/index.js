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
//#region src/index.ts
var i = "namespace.change-slider-color", a = "sliderColor", o = "#39A7FF", s = {
	id: i,
	name: "Change Slider Color",
	version: "0.1.0",
	apiVersion: "^1.0.0",
	appVersion: ">=0.1.0 <1.0.0",
	description: "Customize the Noir Player playback and volume slider color with a persistent color picker or hexadecimal value.",
	license: "MIT",
	authors: ["neura-neura"],
	repository: "https://github.com/neura-neura/noir-player-neura-repo",
	platforms: ["windows", "browser-preview"],
	requestedCapabilities: [
		"ui.contribute",
		"storage",
		"unsafe.dom"
	]
};
function c(e) {
	if (typeof e != "string") return;
	let t = e.trim();
	if (/^#[0-9a-f]{3}$/i.test(t)) {
		let [e, n, r] = t.slice(1).toUpperCase().split("");
		return `#${e}${e}${n}${n}${r}${r}`;
	}
	if (/^#[0-9a-f]{6}$/i.test(t)) return t.toUpperCase();
}
function l(e) {
	if (!e || typeof e != "object" || Array.isArray(e)) throw TypeError("Change Slider Color config must be an object.");
	let t = e;
	if (typeof t.enabled != "boolean") throw TypeError("Change Slider Color config enabled must be a boolean.");
	let n = c(t.defaultColor);
	if (!n) throw TypeError("Change Slider Color config defaultColor must be a hexadecimal color such as #39A7FF.");
	return Object.freeze({
		enabled: t.enabled,
		defaultColor: n
	});
}
var u = class {
	context;
	listeners = /* @__PURE__ */ new Set();
	disposed = !1;
	running = !1;
	persistedColor = !1;
	styleElement = null;
	_state;
	constructor(e, t) {
		this.context = e;
		let n = this.readStoredColor();
		this.persistedColor = n !== void 0, this._state = Object.freeze({
			enabled: t.enabled,
			color: n ?? t.defaultColor,
			defaultColor: t.defaultColor
		});
	}
	get state() {
		return this._state;
	}
	subscribe(e) {
		return this.disposed ? () => void 0 : (this.listeners.add(e), () => this.listeners.delete(e));
	}
	start() {
		this.disposed || (this.running = !0, this.syncDom());
	}
	stop() {
		this.disposed || (this.running = !1, this.removeStyleElement());
	}
	applyConfig(e, t) {
		if (this.disposed) return;
		let n = e.defaultColor !== t.defaultColor && !this.persistedColor && this._state.color === t.defaultColor;
		this.updateState({
			enabled: e.enabled,
			color: n ? e.defaultColor : this._state.color,
			defaultColor: e.defaultColor
		});
	}
	setColor(e) {
		if (this.disposed) return !1;
		let t = c(e);
		if (!t) return !1;
		this.persistedColor = !0;
		try {
			this.context.storage.set(a, t);
		} catch (e) {
			this.context.logger.warn("Unable to persist slider color.", { storageKey: a }), this.context.logger.debug("Slider color persistence error details.", { error: e instanceof Error ? e.message : "unknown error" });
		}
		return this.updateState({
			...this._state,
			color: t
		}), !0;
	}
	resetColor() {
		return this.setColor(this._state.defaultColor);
	}
	dispose() {
		this.disposed || (this.running = !1, this.removeStyleElement(), this.disposed = !0, this.listeners.clear());
	}
	readStoredColor() {
		try {
			return c(this.context.storage.get(a));
		} catch (e) {
			this.context.logger.warn("Unable to read the persisted slider color.", { storageKey: a }), this.context.logger.debug("Slider color read error details.", { error: e instanceof Error ? e.message : "unknown error" });
			return;
		}
	}
	updateState(e) {
		if (!this.disposed) {
			this._state = Object.freeze(e), this.syncDom();
			for (let e of [...this.listeners]) try {
				e();
			} catch (e) {
				this.context.logger.warn("A slider color UI listener failed.", { error: e instanceof Error ? e.message : "unknown error" });
			}
		}
	}
	syncDom() {
		if (!this.running || !this.canUseDom()) return;
		this.ensureStyleElement(), this.styleElement && (this.styleElement.textContent = this._state.enabled ? d(this._state.color) : "");
		let e = document.querySelector(`[data-plugin-settings="${i}"]`);
		if (!e) return;
		let t = e.querySelector("[data-slider-color-control=\"picker\"]"), n = e.querySelector("[data-slider-color-control=\"hex\"]"), r = e.querySelector("[data-slider-color-control=\"reset\"]"), a = e.querySelector("[data-slider-color-control=\"helper\"]");
		t && (t.value = this._state.color, t.disabled = !this._state.enabled), n && (n.value = this._state.color, n.disabled = !this._state.enabled), r && (r.disabled = !this._state.enabled || this._state.color === this._state.defaultColor), a && (a.textContent = this._state.enabled ? "Choose a color or enter #RGB/#RRGGBB. The choice is remembered when Noir Player restarts." : "This plugin is disabled by its configuration.");
	}
	canUseDom() {
		return this.context.hasCapability("unsafe.dom") && typeof document < "u";
	}
	ensureStyleElement() {
		if (this.styleElement?.isConnected || !this.canUseDom()) return;
		let e = document.head ?? document.documentElement;
		if (!e) return;
		let t = document.createElement("style");
		t.setAttribute("data-plugin", `${i}/styles`), e.append(t), this.styleElement = t;
	}
	removeStyleElement() {
		this.styleElement?.remove(), this.styleElement = null;
	}
};
function d(e) {
	let t = c(e);
	if (!t) throw TypeError("A valid hexadecimal slider color is required.");
	return `
/* namespace.change-slider-color: public UI contribution for Noir Player sliders */
.native-progress,
.native-volume {
  accent-color: ${t} !important;
}

.native-progress::-webkit-slider-runnable-track,
.native-volume::-webkit-slider-runnable-track {
  background: linear-gradient(
    90deg,
    ${t} 0 var(--range-progress, 0%),
    rgba(255, 255, 255, 0.16) var(--range-progress, 0%) 100%
  ) !important;
}

.native-progress::-moz-range-progress,
.native-volume::-moz-range-progress,
.native-progress::-webkit-slider-thumb,
.native-volume::-webkit-slider-thumb,
.native-progress::-moz-range-thumb,
.native-volume::-moz-range-thumb {
  background: ${t} !important;
}

.plyr .plyr__progress input[type='range'],
.plyr .plyr__volume input[type='range'] {
  --plyr-color-main: ${t};
  --plyr-range-fill-background: ${t};
  --plyr-range-thumb-background: ${t};
  --plyr-video-range-fill-background: ${t};
  --plyr-video-range-thumb-background: ${t};
  accent-color: ${t} !important;
  color: ${t} !important;
}

.plyr .plyr__progress input[type='range']::-webkit-slider-thumb,
.plyr .plyr__volume input[type='range']::-webkit-slider-thumb,
.plyr .plyr__progress input[type='range']::-moz-range-thumb,
.plyr .plyr__volume input[type='range']::-moz-range-thumb {
  background: ${t} !important;
}
`;
}
function f({ controller: e }) {
	let t = e.state, r = (t, n) => {
		!e.setColor(t) && n && (n.value = e.state.color);
	};
	return (0, n.createElement)("section", {
		className: "plugin-settings-section",
		"aria-labelledby": "change-slider-color-settings-title",
		"data-plugin-settings": i
	}, (0, n.createElement)("h3", { id: "change-slider-color-settings-title" }, "Slider color"), (0, n.createElement)("label", { className: "settings-item" }, (0, n.createElement)("span", null, "Playback and volume"), (0, n.createElement)("span", { className: "settings-item-content" }, (0, n.createElement)("input", {
		type: "color",
		value: t.color,
		disabled: !t.enabled,
		"data-slider-color-control": "picker",
		"aria-label": "Choose playback and volume slider color",
		onChange: (t) => {
			e.setColor(t.currentTarget.value);
		}
	}))), (0, n.createElement)("label", { className: "settings-item" }, (0, n.createElement)("span", null, "Hexadecimal value"), (0, n.createElement)("input", {
		className: "text-input",
		type: "text",
		defaultValue: t.color,
		maxLength: 7,
		spellCheck: !1,
		inputMode: "text",
		disabled: !t.enabled,
		"data-slider-color-control": "hex",
		"aria-label": "Hexadecimal slider color",
		onBlur: (e) => r(e.currentTarget.value, e.currentTarget),
		onKeyDown: (t) => {
			t.key === "Enter" ? (t.preventDefault(), r(t.currentTarget.value, t.currentTarget)) : t.key === "Escape" && (t.preventDefault(), t.currentTarget.value = e.state.color);
		}
	})), (0, n.createElement)("div", { className: "button-grid" }, (0, n.createElement)("button", {
		type: "button",
		className: "mini-button",
		disabled: !t.enabled || t.color === t.defaultColor,
		"data-slider-color-control": "reset",
		onClick: () => e.resetColor()
	}, "Reset to default")), (0, n.createElement)("p", {
		className: "helper-text",
		"data-slider-color-control": "helper"
	}, t.enabled ? "Choose a color or enter #RGB/#RRGGBB. The choice is remembered when Noir Player restarts." : "This plugin is disabled by its configuration."));
}
var p = r({
	manifest: s,
	defaultConfig: {
		enabled: !0,
		defaultColor: o
	},
	config: { parse: l },
	setup(e, t) {
		let r = new u(e, t);
		return e.resources.add(() => r.dispose()), e.resources.add(e.ui.contribute({
			id: `${i}/settings`,
			slot: "settings.sections",
			order: 50,
			component: (e) => (0, n.createElement)(f, {
				...e,
				controller: r
			})
		})), e.logger.info("Change Slider Color setup complete", { color: r.state.color }), {
			api: {
				getState: () => r.state,
				setColor: (e) => r.setColor(e),
				resetColor: () => r.resetColor()
			},
			start() {
				r.start();
			},
			onConfigChange(e, t) {
				r.applyConfig(e, t);
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
export { i as PLUGIN_ID, d as buildSliderColorStyles, p as default, c as normalizeHexColor, l as parseChangeSliderColorConfig };
