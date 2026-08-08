//#region \0rolldown/runtime.js
var e = (e, t) => () => (t || (e((t = { exports: {} }).exports, t), e = null), t.exports), t = /* @__PURE__ */ e(((e) => {
	var t = Symbol.for("react.element"), n = Symbol.for("react.portal"), r = Symbol.for("react.fragment"), i = Symbol.for("react.strict_mode"), a = Symbol.for("react.profiler"), o = Symbol.for("react.provider"), s = Symbol.for("react.context"), c = Symbol.for("react.forward_ref"), l = Symbol.for("react.suspense"), u = Symbol.for("react.memo"), d = Symbol.for("react.lazy"), f = Symbol.iterator;
	function p(e) {
		return typeof e != "object" || !e ? null : (e = f && e[f] || e["@@iterator"], typeof e == "function" ? e : null);
	}
	var m = {
		isMounted: function() {
			return !1;
		},
		enqueueForceUpdate: function() {},
		enqueueReplaceState: function() {},
		enqueueSetState: function() {}
	}, h = Object.assign, g = {};
	function _(e, t, n) {
		this.props = e, this.context = t, this.refs = g, this.updater = n || m;
	}
	_.prototype.isReactComponent = {}, _.prototype.setState = function(e, t) {
		if (typeof e != "object" && typeof e != "function" && e != null) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
		this.updater.enqueueSetState(this, e, t, "setState");
	}, _.prototype.forceUpdate = function(e) {
		this.updater.enqueueForceUpdate(this, e, "forceUpdate");
	};
	function v() {}
	v.prototype = _.prototype;
	function y(e, t, n) {
		this.props = e, this.context = t, this.refs = g, this.updater = n || m;
	}
	var b = y.prototype = new v();
	b.constructor = y, h(b, _.prototype), b.isPureReactComponent = !0;
	var x = Array.isArray, S = Object.prototype.hasOwnProperty, C = { current: null }, w = {
		key: !0,
		ref: !0,
		__self: !0,
		__source: !0
	};
	function T(e, n, r) {
		var i, a = {}, o = null, s = null;
		if (n != null) for (i in n.ref !== void 0 && (s = n.ref), n.key !== void 0 && (o = "" + n.key), n) S.call(n, i) && !w.hasOwnProperty(i) && (a[i] = n[i]);
		var c = arguments.length - 2;
		if (c === 1) a.children = r;
		else if (1 < c) {
			for (var l = Array(c), u = 0; u < c; u++) l[u] = arguments[u + 2];
			a.children = l;
		}
		if (e && e.defaultProps) for (i in c = e.defaultProps, c) a[i] === void 0 && (a[i] = c[i]);
		return {
			$$typeof: t,
			type: e,
			key: o,
			ref: s,
			props: a,
			_owner: C.current
		};
	}
	function E(e, n) {
		return {
			$$typeof: t,
			type: e.type,
			key: n,
			ref: e.ref,
			props: e.props,
			_owner: e._owner
		};
	}
	function D(e) {
		return typeof e == "object" && !!e && e.$$typeof === t;
	}
	function O(e) {
		var t = {
			"=": "=0",
			":": "=2"
		};
		return "$" + e.replace(/[=:]/g, function(e) {
			return t[e];
		});
	}
	var k = /\/+/g;
	function A(e, t) {
		return typeof e == "object" && e && e.key != null ? O("" + e.key) : t.toString(36);
	}
	function j(e, r, i, a, o) {
		var s = typeof e;
		(s === "undefined" || s === "boolean") && (e = null);
		var c = !1;
		if (e === null) c = !0;
		else switch (s) {
			case "string":
			case "number":
				c = !0;
				break;
			case "object": switch (e.$$typeof) {
				case t:
				case n: c = !0;
			}
		}
		if (c) return c = e, o = o(c), e = a === "" ? "." + A(c, 0) : a, x(o) ? (i = "", e != null && (i = e.replace(k, "$&/") + "/"), j(o, r, i, "", function(e) {
			return e;
		})) : o != null && (D(o) && (o = E(o, i + (!o.key || c && c.key === o.key ? "" : ("" + o.key).replace(k, "$&/") + "/") + e)), r.push(o)), 1;
		if (c = 0, a = a === "" ? "." : a + ":", x(e)) for (var l = 0; l < e.length; l++) {
			s = e[l];
			var u = a + A(s, l);
			c += j(s, r, i, u, o);
		}
		else if (u = p(e), typeof u == "function") for (e = u.call(e), l = 0; !(s = e.next()).done;) s = s.value, u = a + A(s, l++), c += j(s, r, i, u, o);
		else if (s === "object") throw r = String(e), Error("Objects are not valid as a React child (found: " + (r === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : r) + "). If you meant to render a collection of children, use an array instead.");
		return c;
	}
	function M(e, t, n) {
		if (e == null) return e;
		var r = [], i = 0;
		return j(e, r, "", "", function(e) {
			return t.call(n, e, i++);
		}), r;
	}
	function N(e) {
		if (e._status === -1) {
			var t = e._result;
			t = t(), t.then(function(t) {
				(e._status === 0 || e._status === -1) && (e._status = 1, e._result = t);
			}, function(t) {
				(e._status === 0 || e._status === -1) && (e._status = 2, e._result = t);
			}), e._status === -1 && (e._status = 0, e._result = t);
		}
		if (e._status === 1) return e._result.default;
		throw e._result;
	}
	var P = { current: null }, F = { transition: null }, I = {
		ReactCurrentDispatcher: P,
		ReactCurrentBatchConfig: F,
		ReactCurrentOwner: C
	};
	function ee() {
		throw Error("act(...) is not supported in production builds of React.");
	}
	e.Children = {
		map: M,
		forEach: function(e, t, n) {
			M(e, function() {
				t.apply(this, arguments);
			}, n);
		},
		count: function(e) {
			var t = 0;
			return M(e, function() {
				t++;
			}), t;
		},
		toArray: function(e) {
			return M(e, function(e) {
				return e;
			}) || [];
		},
		only: function(e) {
			if (!D(e)) throw Error("React.Children.only expected to receive a single React element child.");
			return e;
		}
	}, e.Component = _, e.Fragment = r, e.Profiler = a, e.PureComponent = y, e.StrictMode = i, e.Suspense = l, e.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = I, e.act = ee, e.cloneElement = function(e, n, r) {
		if (e == null) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + e + ".");
		var i = h({}, e.props), a = e.key, o = e.ref, s = e._owner;
		if (n != null) {
			if (n.ref !== void 0 && (o = n.ref, s = C.current), n.key !== void 0 && (a = "" + n.key), e.type && e.type.defaultProps) var c = e.type.defaultProps;
			for (l in n) S.call(n, l) && !w.hasOwnProperty(l) && (i[l] = n[l] === void 0 && c !== void 0 ? c[l] : n[l]);
		}
		var l = arguments.length - 2;
		if (l === 1) i.children = r;
		else if (1 < l) {
			c = Array(l);
			for (var u = 0; u < l; u++) c[u] = arguments[u + 2];
			i.children = c;
		}
		return {
			$$typeof: t,
			type: e.type,
			key: a,
			ref: o,
			props: i,
			_owner: s
		};
	}, e.createContext = function(e) {
		return e = {
			$$typeof: s,
			_currentValue: e,
			_currentValue2: e,
			_threadCount: 0,
			Provider: null,
			Consumer: null,
			_defaultValue: null,
			_globalName: null
		}, e.Provider = {
			$$typeof: o,
			_context: e
		}, e.Consumer = e;
	}, e.createElement = T, e.createFactory = function(e) {
		var t = T.bind(null, e);
		return t.type = e, t;
	}, e.createRef = function() {
		return { current: null };
	}, e.forwardRef = function(e) {
		return {
			$$typeof: c,
			render: e
		};
	}, e.isValidElement = D, e.lazy = function(e) {
		return {
			$$typeof: d,
			_payload: {
				_status: -1,
				_result: e
			},
			_init: N
		};
	}, e.memo = function(e, t) {
		return {
			$$typeof: u,
			type: e,
			compare: t === void 0 ? null : t
		};
	}, e.startTransition = function(e) {
		var t = F.transition;
		F.transition = {};
		try {
			e();
		} finally {
			F.transition = t;
		}
	}, e.unstable_act = ee, e.useCallback = function(e, t) {
		return P.current.useCallback(e, t);
	}, e.useContext = function(e) {
		return P.current.useContext(e);
	}, e.useDebugValue = function() {}, e.useDeferredValue = function(e) {
		return P.current.useDeferredValue(e);
	}, e.useEffect = function(e, t) {
		return P.current.useEffect(e, t);
	}, e.useId = function() {
		return P.current.useId();
	}, e.useImperativeHandle = function(e, t, n) {
		return P.current.useImperativeHandle(e, t, n);
	}, e.useInsertionEffect = function(e, t) {
		return P.current.useInsertionEffect(e, t);
	}, e.useLayoutEffect = function(e, t) {
		return P.current.useLayoutEffect(e, t);
	}, e.useMemo = function(e, t) {
		return P.current.useMemo(e, t);
	}, e.useReducer = function(e, t, n) {
		return P.current.useReducer(e, t, n);
	}, e.useRef = function(e) {
		return P.current.useRef(e);
	}, e.useState = function(e) {
		return P.current.useState(e);
	}, e.useSyncExternalStore = function(e, t, n) {
		return P.current.useSyncExternalStore(e, t, n);
	}, e.useTransition = function() {
		return P.current.useTransition();
	}, e.version = "18.3.1";
})), n = /* @__PURE__ */ e(((e, t) => {
	process.env.NODE_ENV !== "production" && (function() {
		typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart == "function" && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(/* @__PURE__ */ Error());
		var n = "18.3.1", r = Symbol.for("react.element"), i = Symbol.for("react.portal"), a = Symbol.for("react.fragment"), o = Symbol.for("react.strict_mode"), s = Symbol.for("react.profiler"), c = Symbol.for("react.provider"), l = Symbol.for("react.context"), u = Symbol.for("react.forward_ref"), d = Symbol.for("react.suspense"), f = Symbol.for("react.suspense_list"), p = Symbol.for("react.memo"), m = Symbol.for("react.lazy"), h = Symbol.for("react.offscreen"), g = Symbol.iterator, _ = "@@iterator";
		function v(e) {
			if (typeof e != "object" || !e) return null;
			var t = g && e[g] || e[_];
			return typeof t == "function" ? t : null;
		}
		var y = { current: null }, b = { transition: null }, x = {
			current: null,
			isBatchingLegacy: !1,
			didScheduleLegacyUpdate: !1
		}, S = { current: null }, C = {}, w = null;
		function T(e) {
			w = e;
		}
		C.setExtraStackFrame = function(e) {
			w = e;
		}, C.getCurrentStack = null, C.getStackAddendum = function() {
			var e = "";
			w && (e += w);
			var t = C.getCurrentStack;
			return t && (e += t() || ""), e;
		};
		var E = {
			ReactCurrentDispatcher: y,
			ReactCurrentBatchConfig: b,
			ReactCurrentOwner: S
		};
		E.ReactDebugCurrentFrame = C, E.ReactCurrentActQueue = x;
		function D(e) {
			k("warn", e, [...arguments].slice(1));
		}
		function O(e) {
			k("error", e, [...arguments].slice(1));
		}
		function k(e, t, n) {
			var r = E.ReactDebugCurrentFrame.getStackAddendum();
			r !== "" && (t += "%s", n = n.concat([r]));
			var i = n.map(function(e) {
				return String(e);
			});
			i.unshift("Warning: " + t), Function.prototype.apply.call(console[e], console, i);
		}
		var A = {};
		function j(e, t) {
			var n = e.constructor, r = n && (n.displayName || n.name) || "ReactClass", i = r + "." + t;
			A[i] || (O("Can't call %s on a component that is not yet mounted. This is a no-op, but it might indicate a bug in your application. Instead, assign to `this.state` directly or define a `state = {};` class property with the desired state in the %s component.", t, r), A[i] = !0);
		}
		var M = {
			isMounted: function(e) {
				return !1;
			},
			enqueueForceUpdate: function(e, t, n) {
				j(e, "forceUpdate");
			},
			enqueueReplaceState: function(e, t, n, r) {
				j(e, "replaceState");
			},
			enqueueSetState: function(e, t, n, r) {
				j(e, "setState");
			}
		}, N = Object.assign, P = {};
		Object.freeze(P);
		function F(e, t, n) {
			this.props = e, this.context = t, this.refs = P, this.updater = n || M;
		}
		F.prototype.isReactComponent = {}, F.prototype.setState = function(e, t) {
			if (typeof e != "object" && typeof e != "function" && e != null) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
			this.updater.enqueueSetState(this, e, t, "setState");
		}, F.prototype.forceUpdate = function(e) {
			this.updater.enqueueForceUpdate(this, e, "forceUpdate");
		};
		var I = {
			isMounted: ["isMounted", "Instead, make sure to clean up subscriptions and pending requests in componentWillUnmount to prevent memory leaks."],
			replaceState: ["replaceState", "Refactor your code to use setState instead (see https://github.com/facebook/react/issues/3236)."]
		}, ee = function(e, t) {
			Object.defineProperty(F.prototype, e, { get: function() {
				D("%s(...) is deprecated in plain JavaScript React classes. %s", t[0], t[1]);
			} });
		};
		for (var te in I) I.hasOwnProperty(te) && ee(te, I[te]);
		function ne() {}
		ne.prototype = F.prototype;
		function re(e, t, n) {
			this.props = e, this.context = t, this.refs = P, this.updater = n || M;
		}
		var ie = re.prototype = new ne();
		ie.constructor = re, N(ie, F.prototype), ie.isPureReactComponent = !0;
		function ae() {
			var e = { current: null };
			return Object.seal(e), e;
		}
		var oe = Array.isArray;
		function L(e) {
			return oe(e);
		}
		function se(e) {
			return typeof Symbol == "function" && Symbol.toStringTag && e[Symbol.toStringTag] || e.constructor.name || "Object";
		}
		function ce(e) {
			try {
				return le(e), !1;
			} catch {
				return !0;
			}
		}
		function le(e) {
			return "" + e;
		}
		function R(e) {
			if (ce(e)) return O("The provided key is an unsupported type %s. This value must be coerced to a string before before using it here.", se(e)), le(e);
		}
		function ue(e, t, n) {
			var r = e.displayName;
			if (r) return r;
			var i = t.displayName || t.name || "";
			return i === "" ? n : n + "(" + i + ")";
		}
		function de(e) {
			return e.displayName || "Context";
		}
		function z(e) {
			if (e == null) return null;
			if (typeof e.tag == "number" && O("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), typeof e == "function") return e.displayName || e.name || null;
			if (typeof e == "string") return e;
			switch (e) {
				case a: return "Fragment";
				case i: return "Portal";
				case s: return "Profiler";
				case o: return "StrictMode";
				case d: return "Suspense";
				case f: return "SuspenseList";
			}
			if (typeof e == "object") switch (e.$$typeof) {
				case l: return de(e) + ".Consumer";
				case c: return de(e._context) + ".Provider";
				case u: return ue(e, e.render, "ForwardRef");
				case p:
					var t = e.displayName || null;
					return t === null ? z(e.type) || "Memo" : t;
				case m:
					var n = e, r = n._payload, h = n._init;
					try {
						return z(h(r));
					} catch {
						return null;
					}
			}
			return null;
		}
		var B = Object.prototype.hasOwnProperty, fe = {
			key: !0,
			ref: !0,
			__self: !0,
			__source: !0
		}, pe, me, he = {};
		function ge(e) {
			if (B.call(e, "ref")) {
				var t = Object.getOwnPropertyDescriptor(e, "ref").get;
				if (t && t.isReactWarning) return !1;
			}
			return e.ref !== void 0;
		}
		function _e(e) {
			if (B.call(e, "key")) {
				var t = Object.getOwnPropertyDescriptor(e, "key").get;
				if (t && t.isReactWarning) return !1;
			}
			return e.key !== void 0;
		}
		function ve(e, t) {
			var n = function() {
				pe || (pe = !0, O("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", t));
			};
			n.isReactWarning = !0, Object.defineProperty(e, "key", {
				get: n,
				configurable: !0
			});
		}
		function ye(e, t) {
			var n = function() {
				me || (me = !0, O("%s: `ref` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", t));
			};
			n.isReactWarning = !0, Object.defineProperty(e, "ref", {
				get: n,
				configurable: !0
			});
		}
		function be(e) {
			if (typeof e.ref == "string" && S.current && e.__self && S.current.stateNode !== e.__self) {
				var t = z(S.current.type);
				he[t] || (O("Component \"%s\" contains the string ref \"%s\". Support for string refs will be removed in a future major release. This case cannot be automatically converted to an arrow function. We ask you to manually fix this case by using useRef() or createRef() instead. Learn more about using refs safely here: https://reactjs.org/link/strict-mode-string-ref", t, e.ref), he[t] = !0);
			}
		}
		var xe = function(e, t, n, i, a, o, s) {
			var c = {
				$$typeof: r,
				type: e,
				key: t,
				ref: n,
				props: s,
				_owner: o
			};
			return c._store = {}, Object.defineProperty(c._store, "validated", {
				configurable: !1,
				enumerable: !1,
				writable: !0,
				value: !1
			}), Object.defineProperty(c, "_self", {
				configurable: !1,
				enumerable: !1,
				writable: !1,
				value: i
			}), Object.defineProperty(c, "_source", {
				configurable: !1,
				enumerable: !1,
				writable: !1,
				value: a
			}), Object.freeze && (Object.freeze(c.props), Object.freeze(c)), c;
		};
		function Se(e, t, n) {
			var r, i = {}, a = null, o = null, s = null, c = null;
			if (t != null) for (r in ge(t) && (o = t.ref, be(t)), _e(t) && (R(t.key), a = "" + t.key), s = t.__self === void 0 ? null : t.__self, c = t.__source === void 0 ? null : t.__source, t) B.call(t, r) && !fe.hasOwnProperty(r) && (i[r] = t[r]);
			var l = arguments.length - 2;
			if (l === 1) i.children = n;
			else if (l > 1) {
				for (var u = Array(l), d = 0; d < l; d++) u[d] = arguments[d + 2];
				Object.freeze && Object.freeze(u), i.children = u;
			}
			if (e && e.defaultProps) {
				var f = e.defaultProps;
				for (r in f) i[r] === void 0 && (i[r] = f[r]);
			}
			if (a || o) {
				var p = typeof e == "function" ? e.displayName || e.name || "Unknown" : e;
				a && ve(i, p), o && ye(i, p);
			}
			return xe(e, a, o, s, c, S.current, i);
		}
		function Ce(e, t) {
			return xe(e.type, t, e.ref, e._self, e._source, e._owner, e.props);
		}
		function we(e, t, n) {
			if (e == null) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + e + ".");
			var r, i = N({}, e.props), a = e.key, o = e.ref, s = e._self, c = e._source, l = e._owner;
			if (t != null) {
				ge(t) && (o = t.ref, l = S.current), _e(t) && (R(t.key), a = "" + t.key);
				var u;
				for (r in e.type && e.type.defaultProps && (u = e.type.defaultProps), t) B.call(t, r) && !fe.hasOwnProperty(r) && (t[r] === void 0 && u !== void 0 ? i[r] = u[r] : i[r] = t[r]);
			}
			var d = arguments.length - 2;
			if (d === 1) i.children = n;
			else if (d > 1) {
				for (var f = Array(d), p = 0; p < d; p++) f[p] = arguments[p + 2];
				i.children = f;
			}
			return xe(e.type, a, o, s, c, l, i);
		}
		function V(e) {
			return typeof e == "object" && !!e && e.$$typeof === r;
		}
		var Te = ".", Ee = ":";
		function De(e) {
			var t = /[=:]/g, n = {
				"=": "=0",
				":": "=2"
			};
			return "$" + e.replace(t, function(e) {
				return n[e];
			});
		}
		var Oe = !1, ke = /\/+/g;
		function Ae(e) {
			return e.replace(ke, "$&/");
		}
		function je(e, t) {
			return typeof e == "object" && e && e.key != null ? (R(e.key), De("" + e.key)) : t.toString(36);
		}
		function H(e, t, n, a, o) {
			var s = typeof e;
			(s === "undefined" || s === "boolean") && (e = null);
			var c = !1;
			if (e === null) c = !0;
			else switch (s) {
				case "string":
				case "number":
					c = !0;
					break;
				case "object": switch (e.$$typeof) {
					case r:
					case i: c = !0;
				}
			}
			if (c) {
				var l = e, u = o(l), d = a === "" ? Te + je(l, 0) : a;
				if (L(u)) {
					var f = "";
					d != null && (f = Ae(d) + "/"), H(u, t, f, "", function(e) {
						return e;
					});
				} else u != null && (V(u) && (u.key && (!l || l.key !== u.key) && R(u.key), u = Ce(u, n + (u.key && (!l || l.key !== u.key) ? Ae("" + u.key) + "/" : "") + d)), t.push(u));
				return 1;
			}
			var p, m, h = 0, g = a === "" ? Te : a + Ee;
			if (L(e)) for (var _ = 0; _ < e.length; _++) p = e[_], m = g + je(p, _), h += H(p, t, n, m, o);
			else {
				var y = v(e);
				if (typeof y == "function") {
					var b = e;
					y === b.entries && (Oe || D("Using Maps as children is not supported. Use an array of keyed ReactElements instead."), Oe = !0);
					for (var x = y.call(b), S, C = 0; !(S = x.next()).done;) p = S.value, m = g + je(p, C++), h += H(p, t, n, m, o);
				} else if (s === "object") {
					var w = String(e);
					throw Error("Objects are not valid as a React child (found: " + (w === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : w) + "). If you meant to render a collection of children, use an array instead.");
				}
			}
			return h;
		}
		function U(e, t, n) {
			if (e == null) return e;
			var r = [], i = 0;
			return H(e, r, "", "", function(e) {
				return t.call(n, e, i++);
			}), r;
		}
		function Me(e) {
			var t = 0;
			return U(e, function() {
				t++;
			}), t;
		}
		function Ne(e, t, n) {
			U(e, function() {
				t.apply(this, arguments);
			}, n);
		}
		function Pe(e) {
			return U(e, function(e) {
				return e;
			}) || [];
		}
		function Fe(e) {
			if (!V(e)) throw Error("React.Children.only expected to receive a single React element child.");
			return e;
		}
		function Ie(e) {
			var t = {
				$$typeof: l,
				_currentValue: e,
				_currentValue2: e,
				_threadCount: 0,
				Provider: null,
				Consumer: null,
				_defaultValue: null,
				_globalName: null
			};
			t.Provider = {
				$$typeof: c,
				_context: t
			};
			var n = !1, r = !1, i = !1, a = {
				$$typeof: l,
				_context: t
			};
			return Object.defineProperties(a, {
				Provider: {
					get: function() {
						return r || (r = !0, O("Rendering <Context.Consumer.Provider> is not supported and will be removed in a future major release. Did you mean to render <Context.Provider> instead?")), t.Provider;
					},
					set: function(e) {
						t.Provider = e;
					}
				},
				_currentValue: {
					get: function() {
						return t._currentValue;
					},
					set: function(e) {
						t._currentValue = e;
					}
				},
				_currentValue2: {
					get: function() {
						return t._currentValue2;
					},
					set: function(e) {
						t._currentValue2 = e;
					}
				},
				_threadCount: {
					get: function() {
						return t._threadCount;
					},
					set: function(e) {
						t._threadCount = e;
					}
				},
				Consumer: { get: function() {
					return n || (n = !0, O("Rendering <Context.Consumer.Consumer> is not supported and will be removed in a future major release. Did you mean to render <Context.Consumer> instead?")), t.Consumer;
				} },
				displayName: {
					get: function() {
						return t.displayName;
					},
					set: function(e) {
						i ||= (D("Setting `displayName` on Context.Consumer has no effect. You should set it directly on the context with Context.displayName = '%s'.", e), !0);
					}
				}
			}), t.Consumer = a, t._currentRenderer = null, t._currentRenderer2 = null, t;
		}
		var W = -1, Le = 0, Re = 1, ze = 2;
		function Be(e) {
			if (e._status === W) {
				var t = e._result, n = t();
				if (n.then(function(t) {
					if (e._status === Le || e._status === W) {
						var n = e;
						n._status = Re, n._result = t;
					}
				}, function(t) {
					if (e._status === Le || e._status === W) {
						var n = e;
						n._status = ze, n._result = t;
					}
				}), e._status === W) {
					var r = e;
					r._status = Le, r._result = n;
				}
			}
			if (e._status === Re) {
				var i = e._result;
				return i === void 0 && O("lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))\n\nDid you accidentally put curly braces around the import?", i), "default" in i || O("lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))", i), i.default;
			}
			throw e._result;
		}
		function Ve(e) {
			var t = {
				$$typeof: m,
				_payload: {
					_status: W,
					_result: e
				},
				_init: Be
			}, n, r;
			return Object.defineProperties(t, {
				defaultProps: {
					configurable: !0,
					get: function() {
						return n;
					},
					set: function(e) {
						O("React.lazy(...): It is not supported to assign `defaultProps` to a lazy component import. Either specify them where the component is defined, or create a wrapping component around it."), n = e, Object.defineProperty(t, "defaultProps", { enumerable: !0 });
					}
				},
				propTypes: {
					configurable: !0,
					get: function() {
						return r;
					},
					set: function(e) {
						O("React.lazy(...): It is not supported to assign `propTypes` to a lazy component import. Either specify them where the component is defined, or create a wrapping component around it."), r = e, Object.defineProperty(t, "propTypes", { enumerable: !0 });
					}
				}
			}), t;
		}
		function He(e) {
			e != null && e.$$typeof === p ? O("forwardRef requires a render function but received a `memo` component. Instead of forwardRef(memo(...)), use memo(forwardRef(...)).") : typeof e == "function" ? e.length !== 0 && e.length !== 2 && O("forwardRef render functions accept exactly two parameters: props and ref. %s", e.length === 1 ? "Did you forget to use the ref parameter?" : "Any additional parameter will be undefined.") : O("forwardRef requires a render function but was given %s.", e === null ? "null" : typeof e), e != null && (e.defaultProps != null || e.propTypes != null) && O("forwardRef render functions do not support propTypes or defaultProps. Did you accidentally pass a React component?");
			var t = {
				$$typeof: u,
				render: e
			}, n;
			return Object.defineProperty(t, "displayName", {
				enumerable: !1,
				configurable: !0,
				get: function() {
					return n;
				},
				set: function(t) {
					n = t, !e.name && !e.displayName && (e.displayName = t);
				}
			}), t;
		}
		var Ue = Symbol.for("react.module.reference");
		function We(e) {
			return !!(typeof e == "string" || typeof e == "function" || e === a || e === s || e === o || e === d || e === f || e === h || typeof e == "object" && e && (e.$$typeof === m || e.$$typeof === p || e.$$typeof === c || e.$$typeof === l || e.$$typeof === u || e.$$typeof === Ue || e.getModuleId !== void 0));
		}
		function Ge(e, t) {
			We(e) || O("memo: The first argument must be a component. Instead received: %s", e === null ? "null" : typeof e);
			var n = {
				$$typeof: p,
				type: e,
				compare: t === void 0 ? null : t
			}, r;
			return Object.defineProperty(n, "displayName", {
				enumerable: !1,
				configurable: !0,
				get: function() {
					return r;
				},
				set: function(t) {
					r = t, !e.name && !e.displayName && (e.displayName = t);
				}
			}), n;
		}
		function G() {
			var e = y.current;
			return e === null && O("Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem."), e;
		}
		function Ke(e) {
			var t = G();
			if (e._context !== void 0) {
				var n = e._context;
				n.Consumer === e ? O("Calling useContext(Context.Consumer) is not supported, may cause bugs, and will be removed in a future major release. Did you mean to call useContext(Context) instead?") : n.Provider === e && O("Calling useContext(Context.Provider) is not supported. Did you mean to call useContext(Context) instead?");
			}
			return t.useContext(e);
		}
		function qe(e) {
			return G().useState(e);
		}
		function Je(e, t, n) {
			return G().useReducer(e, t, n);
		}
		function Ye(e) {
			return G().useRef(e);
		}
		function Xe(e, t) {
			return G().useEffect(e, t);
		}
		function Ze(e, t) {
			return G().useInsertionEffect(e, t);
		}
		function Qe(e, t) {
			return G().useLayoutEffect(e, t);
		}
		function $e(e, t) {
			return G().useCallback(e, t);
		}
		function et(e, t) {
			return G().useMemo(e, t);
		}
		function tt(e, t, n) {
			return G().useImperativeHandle(e, t, n);
		}
		function nt(e, t) {
			return G().useDebugValue(e, t);
		}
		function rt() {
			return G().useTransition();
		}
		function it(e) {
			return G().useDeferredValue(e);
		}
		function at() {
			return G().useId();
		}
		function ot(e, t, n) {
			return G().useSyncExternalStore(e, t, n);
		}
		var K = 0, st, ct, lt, ut, dt, ft, pt;
		function mt() {}
		mt.__reactDisabledLog = !0;
		function ht() {
			if (K === 0) {
				st = console.log, ct = console.info, lt = console.warn, ut = console.error, dt = console.group, ft = console.groupCollapsed, pt = console.groupEnd;
				var e = {
					configurable: !0,
					enumerable: !0,
					value: mt,
					writable: !0
				};
				Object.defineProperties(console, {
					info: e,
					log: e,
					warn: e,
					error: e,
					group: e,
					groupCollapsed: e,
					groupEnd: e
				});
			}
			K++;
		}
		function gt() {
			if (K--, K === 0) {
				var e = {
					configurable: !0,
					enumerable: !0,
					writable: !0
				};
				Object.defineProperties(console, {
					log: N({}, e, { value: st }),
					info: N({}, e, { value: ct }),
					warn: N({}, e, { value: lt }),
					error: N({}, e, { value: ut }),
					group: N({}, e, { value: dt }),
					groupCollapsed: N({}, e, { value: ft }),
					groupEnd: N({}, e, { value: pt })
				});
			}
			K < 0 && O("disabledDepth fell below zero. This is a bug in React. Please file an issue.");
		}
		var _t = E.ReactCurrentDispatcher, vt;
		function q(e, t, n) {
			if (vt === void 0) try {
				throw Error();
			} catch (e) {
				var r = e.stack.trim().match(/\n( *(at )?)/);
				vt = r && r[1] || "";
			}
			return "\n" + vt + e;
		}
		var yt = !1, bt = new (typeof WeakMap == "function" ? WeakMap : Map)();
		function xt(e, t) {
			if (!e || yt) return "";
			var n = bt.get(e);
			if (n !== void 0) return n;
			var r;
			yt = !0;
			var i = Error.prepareStackTrace;
			Error.prepareStackTrace = void 0;
			var a = _t.current;
			_t.current = null, ht();
			try {
				if (t) {
					var o = function() {
						throw Error();
					};
					if (Object.defineProperty(o.prototype, "props", { set: function() {
						throw Error();
					} }), typeof Reflect == "object" && Reflect.construct) {
						try {
							Reflect.construct(o, []);
						} catch (e) {
							r = e;
						}
						Reflect.construct(e, [], o);
					} else {
						try {
							o.call();
						} catch (e) {
							r = e;
						}
						e.call(o.prototype);
					}
				} else {
					try {
						throw Error();
					} catch (e) {
						r = e;
					}
					e();
				}
			} catch (t) {
				if (t && r && typeof t.stack == "string") {
					for (var s = t.stack.split("\n"), c = r.stack.split("\n"), l = s.length - 1, u = c.length - 1; l >= 1 && u >= 0 && s[l] !== c[u];) u--;
					for (; l >= 1 && u >= 0; l--, u--) if (s[l] !== c[u]) {
						if (l !== 1 || u !== 1) do
							if (l--, u--, u < 0 || s[l] !== c[u]) {
								var d = "\n" + s[l].replace(" at new ", " at ");
								return e.displayName && d.includes("<anonymous>") && (d = d.replace("<anonymous>", e.displayName)), typeof e == "function" && bt.set(e, d), d;
							}
						while (l >= 1 && u >= 0);
						break;
					}
				}
			} finally {
				yt = !1, _t.current = a, gt(), Error.prepareStackTrace = i;
			}
			var f = e ? e.displayName || e.name : "", p = f ? q(f) : "";
			return typeof e == "function" && bt.set(e, p), p;
		}
		function St(e, t, n) {
			return xt(e, !1);
		}
		function Ct(e) {
			var t = e.prototype;
			return !!(t && t.isReactComponent);
		}
		function J(e, t, n) {
			if (e == null) return "";
			if (typeof e == "function") return xt(e, Ct(e));
			if (typeof e == "string") return q(e);
			switch (e) {
				case d: return q("Suspense");
				case f: return q("SuspenseList");
			}
			if (typeof e == "object") switch (e.$$typeof) {
				case u: return St(e.render);
				case p: return J(e.type, t, n);
				case m:
					var r = e, i = r._payload, a = r._init;
					try {
						return J(a(i), t, n);
					} catch {}
			}
			return "";
		}
		var wt = {}, Tt = E.ReactDebugCurrentFrame;
		function Y(e) {
			if (e) {
				var t = e._owner, n = J(e.type, e._source, t ? t.type : null);
				Tt.setExtraStackFrame(n);
			} else Tt.setExtraStackFrame(null);
		}
		function Et(e, t, n, r, i) {
			var a = Function.call.bind(B);
			for (var o in e) if (a(e, o)) {
				var s = void 0;
				try {
					if (typeof e[o] != "function") {
						var c = Error((r || "React class") + ": " + n + " type `" + o + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof e[o] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.");
						throw c.name = "Invariant Violation", c;
					}
					s = e[o](t, o, r, n, null, "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED");
				} catch (e) {
					s = e;
				}
				s && !(s instanceof Error) && (Y(i), O("%s: type specification of %s `%s` is invalid; the type checker function must return `null` or an `Error` but returned a %s. You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument).", r || "React class", n, o, typeof s), Y(null)), s instanceof Error && !(s.message in wt) && (wt[s.message] = !0, Y(i), O("Failed %s type: %s", n, s.message), Y(null));
			}
		}
		function X(e) {
			if (e) {
				var t = e._owner;
				T(J(e.type, e._source, t ? t.type : null));
			} else T(null);
		}
		var Dt = !1;
		function Ot() {
			if (S.current) {
				var e = z(S.current.type);
				if (e) return "\n\nCheck the render method of `" + e + "`.";
			}
			return "";
		}
		function kt(e) {
			if (e !== void 0) {
				var t = e.fileName.replace(/^.*[\\\/]/, ""), n = e.lineNumber;
				return "\n\nCheck your code at " + t + ":" + n + ".";
			}
			return "";
		}
		function At(e) {
			return e == null ? "" : kt(e.__source);
		}
		var jt = {};
		function Mt(e) {
			var t = Ot();
			if (!t) {
				var n = typeof e == "string" ? e : e.displayName || e.name;
				n && (t = "\n\nCheck the top-level render call using <" + n + ">.");
			}
			return t;
		}
		function Nt(e, t) {
			if (!(!e._store || e._store.validated || e.key != null)) {
				e._store.validated = !0;
				var n = Mt(t);
				if (!jt[n]) {
					jt[n] = !0;
					var r = "";
					e && e._owner && e._owner !== S.current && (r = " It was passed a child from " + z(e._owner.type) + "."), X(e), O("Each child in a list should have a unique \"key\" prop.%s%s See https://reactjs.org/link/warning-keys for more information.", n, r), X(null);
				}
			}
		}
		function Pt(e, t) {
			if (typeof e == "object") {
				if (L(e)) for (var n = 0; n < e.length; n++) {
					var r = e[n];
					V(r) && Nt(r, t);
				}
				else if (V(e)) e._store && (e._store.validated = !0);
				else if (e) {
					var i = v(e);
					if (typeof i == "function" && i !== e.entries) for (var a = i.call(e), o; !(o = a.next()).done;) V(o.value) && Nt(o.value, t);
				}
			}
		}
		function Ft(e) {
			var t = e.type;
			if (t != null && typeof t != "string") {
				var n;
				if (typeof t == "function") n = t.propTypes;
				else if (typeof t == "object" && (t.$$typeof === u || t.$$typeof === p)) n = t.propTypes;
				else return;
				if (n) {
					var r = z(t);
					Et(n, e.props, "prop", r, e);
				} else t.PropTypes !== void 0 && !Dt && (Dt = !0, O("Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?", z(t) || "Unknown"));
				typeof t.getDefaultProps == "function" && !t.getDefaultProps.isReactClassApproved && O("getDefaultProps is only used on classic React.createClass definitions. Use a static property named `defaultProps` instead.");
			}
		}
		function It(e) {
			for (var t = Object.keys(e.props), n = 0; n < t.length; n++) {
				var r = t[n];
				if (r !== "children" && r !== "key") {
					X(e), O("Invalid prop `%s` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props.", r), X(null);
					break;
				}
			}
			e.ref !== null && (X(e), O("Invalid attribute `ref` supplied to `React.Fragment`."), X(null));
		}
		function Lt(e, t, n) {
			var i = We(e);
			if (!i) {
				var o = "";
				(e === void 0 || typeof e == "object" && e && Object.keys(e).length === 0) && (o += " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.");
				var s = At(t);
				o += s || Ot();
				var c;
				e === null ? c = "null" : L(e) ? c = "array" : e !== void 0 && e.$$typeof === r ? (c = "<" + (z(e.type) || "Unknown") + " />", o = " Did you accidentally export a JSX literal instead of a component?") : c = typeof e, O("React.createElement: type is invalid -- expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s", c, o);
			}
			var l = Se.apply(this, arguments);
			if (l == null) return l;
			if (i) for (var u = 2; u < arguments.length; u++) Pt(arguments[u], e);
			return e === a ? It(l) : Ft(l), l;
		}
		var Rt = !1;
		function zt(e) {
			var t = Lt.bind(null, e);
			return t.type = e, Rt || (Rt = !0, D("React.createFactory() is deprecated and will be removed in a future major release. Consider using JSX or use React.createElement() directly instead.")), Object.defineProperty(t, "type", {
				enumerable: !1,
				get: function() {
					return D("Factory.type is deprecated. Access the class directly before passing it to createFactory."), Object.defineProperty(this, "type", { value: e }), e;
				}
			}), t;
		}
		function Bt(e, t, n) {
			for (var r = we.apply(this, arguments), i = 2; i < arguments.length; i++) Pt(arguments[i], r.type);
			return Ft(r), r;
		}
		function Vt(e, t) {
			var n = b.transition;
			b.transition = {};
			var r = b.transition;
			b.transition._updatedFibers = /* @__PURE__ */ new Set();
			try {
				e();
			} finally {
				b.transition = n, n === null && r._updatedFibers && (r._updatedFibers.size > 10 && D("Detected a large number of updates inside startTransition. If this is due to a subscription please re-write it to use React provided hooks. Otherwise concurrent mode guarantees are off the table."), r._updatedFibers.clear());
			}
		}
		var Ht = !1, Z = null;
		function Ut(e) {
			if (Z === null) try {
				var n = ("require" + Math.random()).slice(0, 7);
				Z = (t && t[n]).call(t, "timers").setImmediate;
			} catch {
				Z = function(e) {
					Ht === !1 && (Ht = !0, typeof MessageChannel > "u" && O("This browser does not have a MessageChannel implementation, so enqueuing tasks via await act(async () => ...) will fail. Please file an issue at https://github.com/facebook/react/issues if you encounter this warning."));
					var t = new MessageChannel();
					t.port1.onmessage = e, t.port2.postMessage(void 0);
				};
			}
			return Z(e);
		}
		var Q = 0, Wt = !1;
		function Gt(e) {
			var t = Q;
			Q++, x.current === null && (x.current = []);
			var n = x.isBatchingLegacy, r;
			try {
				if (x.isBatchingLegacy = !0, r = e(), !n && x.didScheduleLegacyUpdate) {
					var i = x.current;
					i !== null && (x.didScheduleLegacyUpdate = !1, Jt(i));
				}
			} catch (e) {
				throw $(t), e;
			} finally {
				x.isBatchingLegacy = n;
			}
			if (typeof r == "object" && r && typeof r.then == "function") {
				var a = r, o = !1;
				return !Wt && typeof Promise < "u" && Promise.resolve().then(function() {}).then(function() {
					o || (Wt = !0, O("You called act(async () => ...) without await. This could lead to unexpected testing behaviour, interleaving multiple act calls and mixing their scopes. You should - await act(async () => ...);"));
				}), { then: function(e, n) {
					o = !0, a.then(function(r) {
						$(t), Q === 0 ? Kt(r, e, n) : e(r);
					}, function(e) {
						$(t), n(e);
					});
				} };
			}
			var s = r;
			if ($(t), Q === 0) {
				var c = x.current;
				return c !== null && (Jt(c), x.current = null), { then: function(e, t) {
					x.current === null ? (x.current = [], Kt(s, e, t)) : e(s);
				} };
			}
			return { then: function(e, t) {
				e(s);
			} };
		}
		function $(e) {
			e !== Q - 1 && O("You seem to have overlapping act() calls, this is not supported. Be sure to await previous act() calls before making a new one. "), Q = e;
		}
		function Kt(e, t, n) {
			var r = x.current;
			if (r !== null) try {
				Jt(r), Ut(function() {
					r.length === 0 ? (x.current = null, t(e)) : Kt(e, t, n);
				});
			} catch (e) {
				n(e);
			}
			else t(e);
		}
		var qt = !1;
		function Jt(e) {
			if (!qt) {
				qt = !0;
				var t = 0;
				try {
					for (; t < e.length; t++) {
						var n = e[t];
						do
							n = n(!0);
						while (n !== null);
					}
					e.length = 0;
				} catch (n) {
					throw e = e.slice(t + 1), n;
				} finally {
					qt = !1;
				}
			}
		}
		var Yt = Lt, Xt = Bt, Zt = zt;
		e.Children = {
			map: U,
			forEach: Ne,
			count: Me,
			toArray: Pe,
			only: Fe
		}, e.Component = F, e.Fragment = a, e.Profiler = s, e.PureComponent = re, e.StrictMode = o, e.Suspense = d, e.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = E, e.act = Gt, e.cloneElement = Xt, e.createContext = Ie, e.createElement = Yt, e.createFactory = Zt, e.createRef = ae, e.forwardRef = He, e.isValidElement = V, e.lazy = Ve, e.memo = Ge, e.startTransition = Vt, e.unstable_act = Gt, e.useCallback = $e, e.useContext = Ke, e.useDebugValue = nt, e.useDeferredValue = it, e.useEffect = Xe, e.useId = at, e.useImperativeHandle = tt, e.useInsertionEffect = Ze, e.useLayoutEffect = Qe, e.useMemo = et, e.useReducer = Je, e.useRef = Ye, e.useState = qe, e.useSyncExternalStore = ot, e.useTransition = rt, e.version = n, typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop == "function" && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(/* @__PURE__ */ Error());
	})();
})), r = (/* @__PURE__ */ e(((e, r) => {
	r.exports = process.env.NODE_ENV === "production" ? t() : n();
})))();
function i(e) {
	return e;
}
//#endregion
//#region src/index.ts
var a = "namespace.change-slider-color", o = "sliderColor", s = "#39A7FF", c = {
	id: a,
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
function l(e) {
	if (typeof e != "string") return;
	let t = e.trim();
	if (/^#[0-9a-f]{3}$/i.test(t)) {
		let [e, n, r] = t.slice(1).toUpperCase().split("");
		return `#${e}${e}${n}${n}${r}${r}`;
	}
	if (/^#[0-9a-f]{6}$/i.test(t)) return t.toUpperCase();
}
function u(e) {
	if (!e || typeof e != "object" || Array.isArray(e)) throw TypeError("Change Slider Color config must be an object.");
	let t = e;
	if (typeof t.enabled != "boolean") throw TypeError("Change Slider Color config enabled must be a boolean.");
	let n = l(t.defaultColor);
	if (!n) throw TypeError("Change Slider Color config defaultColor must be a hexadecimal color such as #39A7FF.");
	return Object.freeze({
		enabled: t.enabled,
		defaultColor: n
	});
}
var d = class {
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
		let t = l(e);
		if (!t) return !1;
		this.persistedColor = !0;
		try {
			this.context.storage.set(o, t);
		} catch (e) {
			this.context.logger.warn("Unable to persist slider color.", { storageKey: o }), this.context.logger.debug("Slider color persistence error details.", { error: e instanceof Error ? e.message : "unknown error" });
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
			return l(this.context.storage.get(o));
		} catch (e) {
			this.context.logger.warn("Unable to read the persisted slider color.", { storageKey: o }), this.context.logger.debug("Slider color read error details.", { error: e instanceof Error ? e.message : "unknown error" });
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
		this.ensureStyleElement(), this.styleElement && (this.styleElement.textContent = this._state.enabled ? f(this._state.color) : "");
		let e = document.querySelector(`[data-plugin-settings="${a}"]`);
		if (!e) return;
		let t = e.querySelector("[data-slider-color-control=\"picker\"]"), n = e.querySelector("[data-slider-color-control=\"hex\"]"), r = e.querySelector("[data-slider-color-control=\"reset\"]"), i = e.querySelector("[data-slider-color-control=\"helper\"]");
		t && (t.value = this._state.color, t.disabled = !this._state.enabled), n && (n.value = this._state.color, n.disabled = !this._state.enabled), r && (r.disabled = !this._state.enabled || this._state.color === this._state.defaultColor), i && (i.textContent = this._state.enabled ? "Choose a color or enter #RGB/#RRGGBB. The choice is remembered when Noir Player restarts." : "This plugin is disabled by its configuration.");
	}
	canUseDom() {
		return this.context.hasCapability("unsafe.dom") && typeof document < "u";
	}
	ensureStyleElement() {
		if (this.styleElement?.isConnected || !this.canUseDom()) return;
		let e = document.head ?? document.documentElement;
		if (!e) return;
		let t = document.createElement("style");
		t.setAttribute("data-plugin", `${a}/styles`), e.append(t), this.styleElement = t;
	}
	removeStyleElement() {
		this.styleElement?.remove(), this.styleElement = null;
	}
};
function f(e) {
	let t = l(e);
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
function p({ controller: e }) {
	let t = e.state, n = (t, n) => {
		!e.setColor(t) && n && (n.value = e.state.color);
	};
	return (0, r.createElement)("section", {
		className: "plugin-settings-section",
		"aria-labelledby": "change-slider-color-settings-title",
		"data-plugin-settings": a
	}, (0, r.createElement)("h3", { id: "change-slider-color-settings-title" }, "Slider color"), (0, r.createElement)("label", { className: "settings-item" }, (0, r.createElement)("span", null, "Playback and volume"), (0, r.createElement)("span", { className: "settings-item-content" }, (0, r.createElement)("input", {
		type: "color",
		value: t.color,
		disabled: !t.enabled,
		"data-slider-color-control": "picker",
		"aria-label": "Choose playback and volume slider color",
		onChange: (t) => {
			e.setColor(t.currentTarget.value);
		}
	}))), (0, r.createElement)("label", { className: "settings-item" }, (0, r.createElement)("span", null, "Hexadecimal value"), (0, r.createElement)("input", {
		className: "text-input",
		type: "text",
		defaultValue: t.color,
		maxLength: 7,
		spellCheck: !1,
		inputMode: "text",
		disabled: !t.enabled,
		"data-slider-color-control": "hex",
		"aria-label": "Hexadecimal slider color",
		onBlur: (e) => n(e.currentTarget.value, e.currentTarget),
		onKeyDown: (t) => {
			t.key === "Enter" ? (t.preventDefault(), n(t.currentTarget.value, t.currentTarget)) : t.key === "Escape" && (t.preventDefault(), t.currentTarget.value = e.state.color);
		}
	})), (0, r.createElement)("div", { className: "button-grid" }, (0, r.createElement)("button", {
		type: "button",
		className: "mini-button",
		disabled: !t.enabled || t.color === t.defaultColor,
		"data-slider-color-control": "reset",
		onClick: () => e.resetColor()
	}, "Reset to default")), (0, r.createElement)("p", {
		className: "helper-text",
		"data-slider-color-control": "helper"
	}, t.enabled ? "Choose a color or enter #RGB/#RRGGBB. The choice is remembered when Noir Player restarts." : "This plugin is disabled by its configuration."));
}
var m = i({
	manifest: c,
	defaultConfig: {
		enabled: !0,
		defaultColor: s
	},
	config: { parse: u },
	setup(e, t) {
		let n = new d(e, t);
		return e.resources.add(() => n.dispose()), e.resources.add(e.ui.contribute({
			id: `${a}/settings`,
			slot: "settings.sections",
			order: 50,
			component: (e) => (0, r.createElement)(p, {
				...e,
				controller: n
			})
		})), e.logger.info("Change Slider Color setup complete", { color: n.state.color }), {
			api: {
				getState: () => n.state,
				setColor: (e) => n.setColor(e),
				resetColor: () => n.resetColor()
			},
			start() {
				n.start();
			},
			onConfigChange(e, t) {
				n.applyConfig(e, t);
			},
			stop() {
				n.stop();
			},
			dispose() {
				n.dispose();
			}
		};
	}
});
//#endregion
export { a as PLUGIN_ID, f as buildSliderColorStyles, m as default, l as normalizeHexColor, u as parseChangeSliderColorConfig };
